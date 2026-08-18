const { app, BrowserWindow, shell } = require("electron");
const crypto = require("node:crypto");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const isDev = require("electron-is-dev");

let apiServer;

const adminUser = {
  id: "usr_admin",
  email: "admin@dview.local",
  name: "DVIEW Admin",
  role: "admin"
};

const operatorUser = {
  id: "usr_operator",
  email: "user@dview.local",
  name: "DVIEW Operador",
  role: "operator"
};

const devices = [
  {
    id: "dev_desktop_01",
    name: "Demo Android 14",
    model: "Pixel 8",
    androidVersion: "14",
    status: "online",
    battery: 87,
    lastSeen: new Date().toISOString(),
    enrolledAt: new Date(Date.now() - 86400000).toISOString(),
    consentRequired: true
  }
];

const sessions = [];
const logs = [
  {
    id: "log_desktop_boot",
    timestamp: new Date().toISOString(),
    actor: "desktop",
    action: "desktop.boot",
    target: "local-api",
    severity: "info",
    message: "DVIEW desktop local API initialized"
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

function findBundledApk() {
  const candidates = [
    path.join(process.resourcesPath || "", "artifacts", "android", "DVIEW-Agent-debug.apk"),
    path.join(__dirname, "../../../artifacts/android/DVIEW-Agent-debug.apk"),
    path.join(process.cwd(), "artifacts/android/DVIEW-Agent-debug.apk")
  ];
  return candidates.find((candidate) => candidate && fs.existsSync(candidate)) || null;
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-allow-methods": "GET, POST, OPTIONS"
  });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
  });
}

function addLog(action, target, message, severity = "info") {
  const entry = {
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: "desktop-admin",
    action,
    target,
    severity,
    message
  };
  logs.unshift(entry);
  return entry;
}

function startLocalApi() {
  if (apiServer) return;

  apiServer = http.createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://localhost:3000");

    if (request.method === "OPTIONS") {
      return sendJson(response, 200, {});
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return sendJson(response, 200, {
        ok: true,
        service: "droidview-desktop-api",
        time: new Date().toISOString()
      });
    }

    if (request.method === "POST" && url.pathname === "/auth/login") {
      const body = await readBody(request);
      const user = body.email === adminUser.email ? adminUser : body.email === operatorUser.email ? operatorUser : null;
      const passwordOk = (user?.role === "admin" && body.password === "admin123") || (user?.role === "operator" && body.password === "user123");
      if (!user || !passwordOk || body.totp !== "123456") {
        addLog("auth.failed", "admin", "Invalid desktop login", "warning");
        return sendJson(response, 401, { error: "Invalid credentials or 2FA code" });
      }
      addLog("auth.login", "admin", "Admin logged in from desktop");
      return sendJson(response, 200, {
        token: Buffer.from(JSON.stringify({ sub: user.id, role: user.role, desktop: true })).toString("base64url"),
        user
      });
    }

    if (request.method === "GET" && url.pathname === "/dashboard") {
      return sendJson(response, 200, {
        totalDevices: devices.length,
        onlineDevices: devices.filter((device) => device.status === "online").length,
        activeSessions: sessions.filter((session) => session.status === "active").length,
        pendingAlerts: logs.filter((log) => log.severity !== "info").length
      });
    }

    if (request.method === "GET" && url.pathname === "/devices") return sendJson(response, 200, devices);
    if (request.method === "GET" && url.pathname === "/sessions") return sendJson(response, 200, sessions);
    if (request.method === "GET" && url.pathname === "/logs") return sendJson(response, 200, logs);
    if (request.method === "GET" && url.pathname === "/apps") return sendJson(response, 200, apps);

    const sessionMatch = url.pathname.match(/^\/devices\/([^/]+)\/session$/);
    if (request.method === "POST" && sessionMatch) {
      const device = devices.find((item) => item.id === sessionMatch[1]);
      if (!device) return sendJson(response, 404, { error: "Device not found" });
      const session = {
        id: `ses_${Date.now()}`,
        deviceId: device.id,
        operatorId: adminUser.id,
        status: "requested",
        consentCode: String(Math.floor(100000 + Math.random() * 900000))
      };
      sessions.unshift(session);
      addLog("session.request", device.id, `Consent code ${session.consentCode} generated`);
      return sendJson(response, 200, session);
    }

    if (request.method === "POST" && url.pathname === "/apk/build") {
      const body = await readBody(request);
      const payload = {
        serverUrl: body.serverUrl || "http://localhost:3000",
        enrollmentToken: body.enrollmentToken || `enroll-${Date.now()}`,
        deviceName: body.deviceName || "Android Device",
        appName: body.appName || "DVIEW Agent",
        redirectUrl: body.redirectUrl || body.serverUrl || "http://localhost:3000",
        logoDataUrl: body.logoDataUrl,
        generatedAt: new Date().toISOString()
      };
      const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
      const apkPath = findBundledApk();
      const sha256 = apkPath
        ? crypto.createHash("sha256").update(fs.readFileSync(apkPath)).digest("hex")
        : crypto.createHash("sha256").update(encoded).digest("hex");
      addLog("apk.build", "agent", "Agent enrollment package generated");
      return sendJson(response, 200, {
        apkName: apkPath ? "DVIEW-Agent-debug.apk" : "DVIEW-Agent-enrollment-package.zip",
        downloadUrl: `/apk/download/${encoded}`,
        qrPayload: `droidview://enroll?config=${encoded}`,
        sha256,
        artifactType: apkPath ? "apk" : "enrollment-package",
        note: apkPath ? "APK real incluido no instalador." : "APK nao encontrado; pacote de pareamento disponivel."
      });
    }

    const apkMatch = url.pathname.match(/^\/apk\/download\/(.+)$/);
    if (request.method === "GET" && apkMatch) {
      const apkPath = findBundledApk();
      if (apkPath) {
        const apk = fs.readFileSync(apkPath);
        response.writeHead(200, {
          "content-type": "application/vnd.android.package-archive",
          "content-disposition": "attachment; filename=DVIEW-Agent-debug.apk",
          "x-droidview-artifact-kind": "apk",
          "x-droidview-sha256": crypto.createHash("sha256").update(apk).digest("hex"),
          "access-control-allow-origin": "*"
        });
        return response.end(apk);
      }

      const text = [
        "DVIEW Agent enrollment package",
        "Build apps/android-agent with Android Studio/Gradle to generate a real APK if the bundled APK is absent.",
        `Enrollment config: ${apkMatch[1]}`
      ].join("\n");
      response.writeHead(200, {
        "content-type": "application/zip",
        "content-disposition": "attachment; filename=DVIEW-Agent-enrollment-package.zip",
        "x-droidview-artifact-kind": "enrollment-package",
        "access-control-allow-origin": "*"
      });
      return response.end(Buffer.from(text));
    }

    return sendJson(response, 404, { error: "Not found" });
  });

  apiServer.on("error", (error) => {
    if (error.code !== "EADDRINUSE") console.error(error);
  });
  apiServer.listen(3000, "127.0.0.1");
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1100,
    minHeight: 720,
    title: "DVIEW Admin",
    backgroundColor: "#0b0f14",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../../web-panel/dist/index.html"));
  }
}

app.whenReady().then(() => {
  startLocalApi();
  createWindow();
});

app.on("window-all-closed", () => {
  if (apiServer) apiServer.close();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
