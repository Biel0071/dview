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

  console.log("2. Reloading authenticated session...");
  await win.loadURL("http://localhost:5000");
  await new Promise((r) => setTimeout(r, 2000));

  // 1. Control Panel
  console.log("3. Opening Control Panel...");
  await win.webContents.executeJavaScript(`
    (() => {
      const items = Array.from(document.querySelectorAll(".nav-item, button, span"));
      const btn = items.find(el => el.textContent && el.textContent.trim() === "Controle");
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 2500));

  // Select device
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
  console.log("4. Opening Gerador APK...");
  await win.webContents.executeJavaScript(`
    (() => {
      const items = Array.from(document.querySelectorAll(".nav-item-btn"));
      const btn = items.find(el => el.textContent && el.textContent.includes("Gerador APK"));
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 2500));

  const imgApk = await win.capturePage();
  fs.writeFileSync(path.join(ARTIFACT_DIR, "audit_gerador_apk.png"), imgApk.toPNG());
  console.log("-> Saved audit_gerador_apk.png");

  // 3. Dashboard
  console.log("5. Opening Dashboard...");
  await win.webContents.executeJavaScript(`
    (() => {
      const items = Array.from(document.querySelectorAll(".nav-item-btn"));
      const btn = items.find(el => el.textContent && el.textContent.includes("Dashboard"));
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 2500));

  const imgDash = await win.capturePage();
  fs.writeFileSync(path.join(ARTIFACT_DIR, "audit_dashboard.png"), imgDash.toPNG());
  console.log("-> Saved audit_dashboard.png");

  app.quit();
}

run().catch((err) => {
  console.error("Error capturing audit screenshots:", err);
  app.quit();
});
