import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import path from "node:path";
import os from "node:os";

const require = createRequire(import.meta.url);
const {
  buildEmbeddedApp,
  checkDViewBackendActive,
  isPortAvailable,
  findAvailablePort,
  resolveWebPanelDir
} = require("../../desktop/src/embeddedBackend.cjs");

describe("Desktop Embedded Backend", () => {
  it("serves health status", async () => {
    const app = buildEmbeddedApp();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);
    expect(res.json().service).toBe("droidview-desktop-backend");
  });

  it("authenticates admin and rejects bad credentials", async () => {
    const app = buildEmbeddedApp();
    const badRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "admin@dview.local", password: "wrong", totp: "123456" }
    });
    expect(badRes.statusCode).toBe(401);

    const goodRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "admin@dview.local", password: "admin123", totp: "123456" }
    });
    expect(goodRes.statusCode).toBe(200);
    const body = goodRes.json();
    expect(body.token).toBeDefined();
    expect(body.user.role).toBe("admin");
  });

  it("handles devices, emulators and APK builds including update and delete", async () => {
    const app = buildEmbeddedApp();
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "admin@dview.local", password: "admin123", totp: "123456" }
    });
    const token = login.json().token;
    const authHeaders = { authorization: `Bearer ${token}` };

    // Register a device
    const regRes = await app.inject({
      method: "POST",
      url: "/devices/register",
      payload: { id: "test_dev_01", name: "Pixel 8 Pro", model: "Pixel 8", isEmulator: false }
    });
    expect(regRes.statusCode).toBe(200);
    expect(regRes.json().success).toBe(true);

    // Add emulator
    const emuRes = await app.inject({
      method: "POST",
      url: "/devices/emulator/add",
      headers: authHeaders,
      payload: { name: "Emulador Unit Test", port: 5554 }
    });
    expect(emuRes.statusCode).toBe(200);
    expect(emuRes.json().device.name).toBe("Emulador Unit Test");

    // Dashboard
    const dashRes = await app.inject({
      method: "GET",
      url: "/dashboard",
      headers: authHeaders
    });
    expect(dashRes.statusCode).toBe(200);
    expect(dashRes.json().totalDevices).toBeGreaterThanOrEqual(2);

    // Build APK
    const apkRes = await app.inject({
      method: "POST",
      url: "/apk/build",
      headers: authHeaders,
      payload: { appName: "Unit-Test-Agent", serverUrl: "http://localhost:3000" }
    });
    expect(apkRes.statusCode).toBe(200);
    expect(apkRes.json().apkName).toBe("Unit-Test-Agent.apk");
    expect(apkRes.json().downloadUrl).toBeDefined();

    // Query builds
    const buildsRes = await app.inject({
      method: "GET",
      url: "/apk/builds",
      headers: authHeaders
    });
    expect(buildsRes.statusCode).toBe(200);
    const builds = buildsRes.json();
    expect(Array.isArray(builds)).toBe(true);
    expect(builds.length).toBeGreaterThanOrEqual(1);

    const targetBuild = builds[0];
    expect(targetBuild.savePath).toContain(os.homedir());

    // Update build
    const updateRes = await app.inject({
      method: "PUT",
      url: `/apk/builds/${targetBuild.id}`,
      headers: authHeaders,
      payload: { version: "v9.9.9", status: "completed" }
    });
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.json().version).toBe("v9.9.9");

    // Delete build
    const delRes = await app.inject({
      method: "DELETE",
      url: `/apk/builds/${targetBuild.id}`,
      headers: authHeaders
    });
    expect(delRes.statusCode).toBe(200);
    expect(delRes.json().success).toBe(true);

    // Delete device
    const delDevRes = await app.inject({
      method: "DELETE",
      url: "/devices/test_dev_01",
      headers: authHeaders
    });
    expect(delDevRes.statusCode).toBe(200);
    expect(delDevRes.json().success).toBe(true);
  });

  it("serves static web-panel assets and handles SPA routes", async () => {
    const webPanelDir = resolveWebPanelDir();
    expect(webPanelDir).toBeDefined();
    const app = buildEmbeddedApp({ webPanelDir });

    // Root route serves index.html
    const rootRes = await app.inject({ method: "GET", url: "/" });
    expect(rootRes.statusCode).toBe(200);
    expect(rootRes.headers["content-type"]).toContain("text/html");
    expect(rootRes.body).toContain("<div id=\"root\">");

    // Static assets
    const faviconRes = await app.inject({ method: "GET", url: "/favicon.svg" });
    expect(faviconRes.statusCode).toBe(200);
    expect(faviconRes.headers["content-type"]).toContain("image/svg+xml");

    // SPA client-side route fallback
    const spaRes = await app.inject({ method: "GET", url: "/controle/devices" });
    expect(spaRes.statusCode).toBe(200);
    expect(spaRes.headers["content-type"]).toContain("text/html");

    // Unknown API routes return 404 JSON, not HTML SPA fallback
    const api404 = await app.inject({ method: "GET", url: "/devices/non-existent-device" });
    expect(api404.statusCode).toBe(404);
    expect(api404.headers["content-type"]).toContain("application/json");
  });

  it("checks port availability and finds free ports", async () => {
    const freePort = await findAvailablePort(3900, "127.0.0.1", 5);
    expect(freePort).toBeGreaterThanOrEqual(3900);
    const available = await isPortAvailable(freePort, "127.0.0.1");
    expect(available).toBe(true);
  });

  it("handles persistent device heartbeat and automatic reconnect telemetry", async () => {
    const app = buildEmbeddedApp();

    // 1. Initial heartbeat from an Android agent
    const hbRes = await app.inject({
      method: "POST",
      url: "/devices/dev_jadlog_agent_01/heartbeat",
      payload: {
        id: "dev_jadlog_agent_01",
        name: "JADLOG Rastreio (Galaxy Note 10)",
        model: "SM-N975F",
        battery: 88,
        batteryCharging: true,
        networkType: "wifi",
        networkName: "Wi-Fi 5GHz",
        signalStrength: 98,
        status: "online"
      }
    });

    expect(hbRes.statusCode).toBe(200);
    const hbBody = hbRes.json();
    expect(hbBody.success).toBe(true);
    expect(hbBody.status).toBe("online");
    expect(hbBody.heartbeatIntervalMs).toBe(10000);

    // 2. Query devices to verify status is online and battery is 88
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "admin@dview.local", password: "admin123", totp: "123456" }
    });
    const token = login.json().token;

    const devListRes = await app.inject({
      method: "GET",
      url: "/devices",
      headers: { authorization: `Bearer ${token}` }
    });
    expect(devListRes.statusCode).toBe(200);
    const device = devListRes.json().find((d: any) => d.id === "dev_jadlog_agent_01");
    expect(device).toBeDefined();
    expect(device.status).toBe("online");
    expect(device.battery).toBe(88);
    expect(device.networkName).toBe("Wi-Fi 5GHz");

    // 3. Fallback heartbeat endpoint /devices/heartbeat
    const fallbackHb = await app.inject({
      method: "POST",
      url: "/devices/heartbeat",
      payload: {
        id: "dev_jadlog_agent_01",
        battery: 92,
        networkType: "5g",
        networkName: "Claro 5G"
      }
    });
    expect(fallbackHb.statusCode).toBe(200);
    expect(fallbackHb.json().success).toBe(true);
  });
});
