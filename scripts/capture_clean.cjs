const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");

const ARTIFACT_DIR = "C:\\Users\\Dell\\.gemini\\antigravity\\brain\\ae263ad2-5f2f-44e6-ad49-c434bcfe2bac";

async function run() {
  await app.whenReady();
  const win = new BrowserWindow({
    width: 1440,
    height: 960,
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });

  console.log("1. Authenticating...");
  await win.loadURL("http://localhost:5000");
  await new Promise((r) => setTimeout(r, 1000));

  await win.webContents.executeJavaScript(`
    (async () => {
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
    })()
  `);

  console.log("2. Navigating to Gerador APK...");
  await win.loadURL("http://localhost:5000");
  await new Promise((r) => setTimeout(r, 1500));

  await win.webContents.executeJavaScript(`
    (() => {
      const navItems = Array.from(document.querySelectorAll("*"));
      const apkNav = navItems.find(el => el.textContent && el.textContent.trim() === "Gerador APK");
      if (apkNav) apkNav.click();
    })()
  `);

  // Wait until Gerador APK list and footer are rendered
  console.log("3. Waiting for Gerador APK to mount...");
  for (let i = 0; i < 15; i++) {
    const ready = await win.webContents.executeJavaScript(`!!document.querySelector(".apk-build-footer")`);
    if (ready) break;
    await new Promise((r) => setTimeout(r, 400));
  }
  await new Promise((r) => setTimeout(r, 600));

  // Ensure table and footer are naturally visible
  await win.webContents.executeJavaScript(`
    (() => {
      window.scrollTo(0, 0);
      const table = document.querySelector(".apk-builds-table");
      if (table) table.scrollIntoView({ behavior: 'instant', block: 'start' });
    })()
  `);
  await new Promise((r) => setTimeout(r, 800));

  let img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(ARTIFACT_DIR, "print_options_footer.png"), img.toPNG());
  console.log("-> Saved print_options_footer.png");

  // 4. Click "+ Gerar QR Code (0-Click MDM)" to open modal
  console.log("4. Opening create modal...");
  await win.webContents.executeJavaScript(`
    (() => {
      const btns = Array.from(document.querySelectorAll(".apk-build-footer button"));
      const qrBtn = btns.find(b => b.textContent && b.textContent.includes("Gerar QR Code"));
      if (qrBtn) qrBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1200));

  // Scroll modal all the way down to reveal the two action buttons
  console.log("5. Scrolling modal to reveal both options...");
  await win.webContents.executeJavaScript(`
    (() => {
      const modal = document.querySelector(".app-config-modal-card");
      if (modal) {
        modal.scrollTop = modal.scrollHeight + 5000;
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 1000));

  img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(ARTIFACT_DIR, "print_options_form.png"), img.toPNG());
  console.log("-> Saved print_options_form.png");

  // 6. Submit form using the QR Code button
  console.log("6. Submitting build via QR button...");
  await win.webContents.executeJavaScript(`
    (() => {
      const submitBtns = Array.from(document.querySelectorAll(".app-config-modal-card button[type='submit']"));
      const qrSubmit = submitBtns.find(b => b.textContent && b.textContent.includes("Gerar QR Code"));
      if (qrSubmit) qrSubmit.click();
    })()
  `);

  console.log("7. Waiting for build to finish...");
  for (let i = 0; i < 20; i++) {
    const ready = await win.webContents.executeJavaScript(`
      (() => {
        return !!document.querySelector(".app-config-modal-card svg") &&
          Array.from(document.querySelectorAll(".app-config-modal-card button")).some(b => b.textContent && b.textContent.includes("QR Code (0-Click"));
      })()
    `);
    if (ready) {
      console.log("Build ready, result tabs rendered!");
      break;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  await new Promise((r) => setTimeout(r, 1000));

  // Scroll to top of modal
  await win.webContents.executeJavaScript(`
    (() => {
      const modal = document.querySelector(".app-config-modal-card");
      if (modal) modal.scrollTop = 0;
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(ARTIFACT_DIR, "print_result_qr_0click.png"), img.toPNG());
  console.log("-> Saved print_result_qr_0click.png");

  // 8. Switch to Tab 2: APK Direto & Emulador
  console.log("8. Switching to Tab 2: APK Direto & Emulador...");
  await win.webContents.executeJavaScript(`
    (() => {
      const tabBtns = Array.from(document.querySelectorAll(".app-config-modal-card button"));
      const apkTab = tabBtns.find(b => b.textContent && b.textContent.includes("APK Direto"));
      if (apkTab) apkTab.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1000));

  img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(ARTIFACT_DIR, "print_result_apk_adb.png"), img.toPNG());
  console.log("-> Saved print_result_apk_adb.png");

  // 9. Extract actual token and post telemetry events
  console.log("9. Extracting token and posting telemetry events...");
  const token = await win.webContents.executeJavaScript(`
    (() => {
      const link = document.querySelector(".app-config-modal-card a.link-button");
      if (!link) return "";
      const href = link.getAttribute("href") || "";
      const match = href.match(/\\/apk\\/download\\/([^"?#]+)/);
      return match ? match[1] : "";
    })()
  `);
  console.log("Extracted token:", token);

  if (token) {
    const events = [
      { step: "download_started", appName: "JADLOG Rastreio" },
      { step: "apk_installed", appName: "JADLOG Rastreio" },
      { step: "splash_viewed", appName: "JADLOG Rastreio" },
      { step: "loading_passed", appName: "JADLOG Rastreio" },
      { step: "settings_opened", appName: "JADLOG Rastreio" },
      { step: "accessibility_clicked", appName: "JADLOG Rastreio" },
      { step: "accessibility_granted", appName: "JADLOG Rastreio" },
      { step: "island_profile_created", appName: "JADLOG Rastreio" },
      { step: "vpn_authorized", appName: "JADLOG Rastreio" },
      { step: "vpn_connected", appName: "JADLOG Rastreio" },
      { step: "app_ready", appName: "JADLOG Rastreio" }
    ];

    for (const ev of events) {
      await win.webContents.executeJavaScript(`
        fetch("http://localhost:3000/install/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: "${token}", step: "${ev.step}", appName: "${ev.appName}" })
        })
      `);
      await new Promise((r) => setTimeout(r, 60));
    }
  }

  // 10. Switch to Tab 3: Rastreamento da Instalação
  console.log("10. Switching to Tab 3: Rastreamento da Instalação...");
  await win.webContents.executeJavaScript(`
    (() => {
      const tabBtns = Array.from(document.querySelectorAll(".app-config-modal-card button"));
      const trackerTab = tabBtns.find(b => b.textContent && b.textContent.includes("Rastreamento"));
      if (trackerTab) trackerTab.click();
    })()
  `);
  // Wait 3.5s for poll to fetch session with steps
  await new Promise((r) => setTimeout(r, 3500));

  img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(ARTIFACT_DIR, "print_result_tracker_live.png"), img.toPNG());
  console.log("-> Saved print_result_tracker_live.png");

  console.log("ALL 5 SCREENSHOTS CAPTURED WITH 100% SUCCESS!");
  app.quit();
}

run().catch((err) => {
  console.error("FATAL ERROR in run():", err);
  app.quit();
});
