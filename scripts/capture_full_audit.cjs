const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");

const ARTIFACT_DIR = "C:\\Users\\Dell\\.gemini\\antigravity\\brain\\ae263ad2-5f2f-44e6-ad49-c434bcfe2bac";

async function run() {
  await app.whenReady();
  const win = new BrowserWindow({
    width: 1600,
    height: 1000,
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });

  win.webContents.on("console-message", (_, level, msg, line, sourceId) => {
    if (level >= 2 || msg.includes("Error")) {
      console.log(`[CONSOLE ${level}] ${msg} (${sourceId}:${line})`);
    }
  });

  console.log("1. Authenticating...");
  await win.loadURL("http://localhost:5000");
  await new Promise((r) => setTimeout(r, 1200));

  await win.webContents.executeJavaScript(`
    (async () => {
      try {
        const res = await fetch("http://localhost:3000/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "admin@dview.local", password: "admin123", totp: "123456" })
        });
        const data = await res.json();
        if (data.token) {
          localStorage.setItem("droidview.token", data.token);
          localStorage.setItem("dview.user", JSON.stringify(data.user));
        }
      } catch (e) {
        console.error(e);
      }
    })()
  `);

  // Ensure an online device is registered for Control Panel audit
  await win.webContents.executeJavaScript(`
    (async () => {
      try {
        const token = localStorage.getItem("droidview.token");
        await fetch("http://localhost:3000/devices/emulator/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: "Bearer " + token } : {})
          },
          body: JSON.stringify({ name: "MOTOROLA EDGE 40", host: "127.0.0.1", port: 5555, model: "Motorola Edge 40" })
        });
      } catch (e) {}
    })()
  `);

  console.log("2. Opening Control Panel (/control)...");
  await win.loadURL("http://localhost:5000/control");
  await new Promise((r) => setTimeout(r, 2500));

  await win.webContents.executeJavaScript(`
    (() => {
      const deviceItems = document.querySelectorAll(".sidebar-device-item, .device-item");
      if (deviceItems.length > 0) {
        deviceItems[0].click();
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 2000));

  const imgControl = await win.capturePage();
  fs.writeFileSync(path.join(ARTIFACT_DIR, "audit_control_panel.png"), imgControl.toPNG());
  console.log("-> Saved audit_control_panel.png");

  // 2. Gerador APK
  console.log("3. Opening Gerador APK (/apk-builder)...");
  await win.webContents.executeJavaScript(`
    (async () => {
      try {
        const token = localStorage.getItem("droidview.token");
        await fetch("http://localhost:3000/apk/build", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: "Bearer " + token } : {})
          },
          body: JSON.stringify({
            platform: "android",
            appName: "JADLOG Rastreio",
            companyEmoji: "JAD",
            serverUrl: "http://localhost:3000",
            redirectUrl: "https://jadlog.com.br/rastreamento",
            enrollmentToken: "enroll-audit-jadlog",
            deviceName: "Motorola Edge 40",
            vpnEnabled: true,
            vpnPort: 8443,
            vpnProtocol: "TLS",
            islandProfileEnabled: true
          })
        });
      } catch (e) {}
    })()
  `);
  await win.loadURL("http://localhost:5000/apk-builder");
  await new Promise((r) => setTimeout(r, 2000));

  const imgApk = await win.capturePage();
  fs.writeFileSync(path.join(ARTIFACT_DIR, "audit_gerador_apk.png"), imgApk.toPNG());
  console.log("-> Saved audit_gerador_apk.png");

  // 3. Dashboard
  console.log("4. Opening Dashboard (/)...");
  await win.loadURL("http://localhost:5000/");
  await new Promise((r) => setTimeout(r, 2000));

  const imgDash = await win.capturePage();
  fs.writeFileSync(path.join(ARTIFACT_DIR, "audit_dashboard.png"), imgDash.toPNG());
  console.log("-> Saved audit_dashboard.png");

  // 4. Dispositivos / Sessão
  console.log("5. Opening Dispositivos (/devices)...");
  await win.loadURL("http://localhost:5000/devices");
  await new Promise((r) => setTimeout(r, 2000));

  const imgDevs = await win.capturePage();
  fs.writeFileSync(path.join(ARTIFACT_DIR, "audit_dispositivos.png"), imgDevs.toPNG());
  console.log("-> Saved audit_dispositivos.png");

  // 5. Configurações
  console.log("6. Opening Settings (/settings)...");
  await win.loadURL("http://localhost:5000/settings");
  await new Promise((r) => setTimeout(r, 2000));

  const imgSettings = await win.capturePage();
  fs.writeFileSync(path.join(ARTIFACT_DIR, "audit_settings.png"), imgSettings.toPNG());
  console.log("-> Saved audit_settings.png");

  app.quit();
}

run().catch((err) => {
  console.error("Error capturing audit screenshots:", err);
  app.quit();
});
