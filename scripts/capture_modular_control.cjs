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

  console.log("2. Navigating to Control Panel...");
  await win.loadURL("http://localhost:5000");
  await new Promise((r) => setTimeout(r, 2000));

  // Click on "Controle" in sidebar
  await win.webContents.executeJavaScript(`
    (() => {
      const links = Array.from(document.querySelectorAll("button, a, span"));
      const controleBtn = links.find(el => el.textContent && el.textContent.trim() === "Controle");
      if (controleBtn) {
        controleBtn.click();
      }
    })()
  `);

  await new Promise((r) => setTimeout(r, 2500));

  // Select first device if not selected
  await win.webContents.executeJavaScript(`
    (() => {
      const deviceItems = document.querySelectorAll(".sidebar-device-item, .device-item");
      if (deviceItems.length > 0) {
        deviceItems[0].click();
      }
    })()
  `);

  await new Promise((r) => setTimeout(r, 2000));

  console.log("3. Capturing Control Panel screenshot...");
  const imgControl = await win.capturePage();
  fs.writeFileSync(path.join(ARTIFACT_DIR, "proof_lapidacao_botoes_telas_controle.png"), imgControl.toPNG());
  console.log("Control Panel screenshot saved!");

  // Navigate to Gerador APK
  console.log("4. Navigating to Gerador APK...");
  await win.loadURL("http://localhost:5000/apk-builder");
  await new Promise((r) => setTimeout(r, 2000));

  console.log("5. Capturing Gerador APK screenshot...");
  const imgApk = await win.capturePage();
  fs.writeFileSync(path.join(ARTIFACT_DIR, "proof_lapidacao_botoes_telas_gerador.png"), imgApk.toPNG());
  console.log("Gerador APK screenshot saved!");

  app.quit();
}

run().catch((err) => {
  console.error("Error capturing screenshots:", err);
  app.quit();
});
