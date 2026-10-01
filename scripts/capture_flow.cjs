const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");

const ARTIFACT_DIR = "C:\\Users\\Dell\\.gemini\\antigravity\\brain\\ae263ad2-5f2f-44e6-ad49-c434bcfe2bac";

async function run() {
  await app.whenReady();
  const win = new BrowserWindow({
    width: 1440,
    height: 950,
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });

  console.log("Authenticating...");
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
        console.error("Login fetch error:", e);
      }
    })()
  `);

  console.log("Reloading...");
  await win.loadURL("http://localhost:5000");
  await new Promise((r) => setTimeout(r, 1800));

  console.log("Navigating to Gerador APK...");
  await win.webContents.executeJavaScript(`
    const navItems = Array.from(document.querySelectorAll("button, a, div"));
    const apkNav = navItems.find(el => el.textContent && el.textContent.trim() === "Gerador APK");
    if (apkNav) apkNav.click();
  `);
  await new Promise((r) => setTimeout(r, 1800));

  // 1. Scroll directly to the footer buttons and take screenshot
  await win.webContents.executeJavaScript(`
    const footer = document.querySelector(".apk-build-footer");
    if (footer) footer.scrollIntoView({ block: "center" });
  `);
  await new Promise((r) => setTimeout(r, 800));

  let image = await win.webContents.capturePage();
  fs.writeFileSync(path.join(ARTIFACT_DIR, "print_options_footer.png"), image.toPNG());
  console.log("Saved print_options_footer.png");

  // 2. Click "+ Gerar QR Code (0-Click MDM)" to open modal
  await win.webContents.executeJavaScript(`
    const btns = Array.from(document.querySelectorAll("button"));
    const qrBtn = btns.find(b => b.textContent && b.textContent.includes("Gerar QR Code"));
    if (qrBtn) qrBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 1200));

  // Scroll modal down to reveal the two options side by side
  await win.webContents.executeJavaScript(`
    const modal = document.querySelector(".app-config-modal-card");
    if (modal) {
      modal.scrollTop = modal.scrollHeight;
      const submitBtn = modal.querySelector("button[type='submit']");
      if (submitBtn) submitBtn.scrollIntoView({ block: "center" });
    }
  `);
  await new Promise((r) => setTimeout(r, 800));

  image = await win.webContents.capturePage();
  fs.writeFileSync(path.join(ARTIFACT_DIR, "print_options_form.png"), image.toPNG());
  console.log("Saved print_options_form.png");

  // 3. Submit build using the QR Code button
  await win.webContents.executeJavaScript(`
    const modalBtns = Array.from(document.querySelectorAll(".app-config-modal-card button"));
    const submitQr = modalBtns.find(b => b.textContent && b.textContent.includes("Gerar QR Code") && b.getAttribute("type") === "submit");
    if (submitQr) submitQr.click();
  `);

  console.log("Waiting for build to complete...");
  let waited = 0;
  while (waited < 15000) {
    const hasResult = await win.webContents.executeJavaScript(`
      !!document.querySelector(".app-config-modal-card button.primary") &&
      Array.from(document.querySelectorAll(".app-config-modal-card button")).some(b => b.textContent && b.textContent.includes("QR Code (0-Click"))
    `);
    if (hasResult) {
      console.log("Build finished, modal tabs detected!");
      break;
    }
    await new Promise((r) => setTimeout(r, 500));
    waited += 500;
  }
  await new Promise((r) => setTimeout(r, 1000));

  // Scroll modal to top
  await win.webContents.executeJavaScript(`
    const modal = document.querySelector(".app-config-modal-card");
    if (modal) modal.scrollTop = 0;
  `);
  await new Promise((r) => setTimeout(r, 500));

  // Screenshot of Tab 1: QR Code Zero-Touch
  image = await win.webContents.capturePage();
  fs.writeFileSync(path.join(ARTIFACT_DIR, "print_result_qr_0click.png"), image.toPNG());
  console.log("Saved print_result_qr_0click.png");

  // 4. Switch to Tab 2: APK Direto & Emulador
  await win.webContents.executeJavaScript(`
    const tabBtns = Array.from(document.querySelectorAll(".app-config-modal-card button"));
    const apkTab = tabBtns.find(b => b.textContent && b.textContent.includes("APK Direto"));
    if (apkTab) apkTab.click();
  `);
  await new Promise((r) => setTimeout(r, 1200));

  // Screenshot of Tab 2: APK Direto & ADB
  image = await win.webContents.capturePage();
  fs.writeFileSync(path.join(ARTIFACT_DIR, "print_result_apk_adb.png"), image.toPNG());
  console.log("Saved print_result_apk_adb.png");

  // 5. Send simulated install track events to backend using the actual token from the download link!
  const actualToken = await win.webContents.executeJavaScript(`
    (async () => {
      try {
        const link = document.querySelector(".app-config-modal-card a.link-button");
        const href = link ? link.getAttribute("href") : "";
        const tokenMatch = href.match(/\\/apk\\/download\\/([^"?#]+)/);
        const token = tokenMatch ? tokenMatch[1] : "";
        if (!token) return "no-token";

        const baseUrl = "http://localhost:3000";
        const events = [
          { step: "download_started", metadata: { source: "qr_scanner" } },
          { step: "apk_installed", metadata: { package: "com.droidview.agent", version: "1.4.8" } },
          { step: "splash_viewed", metadata: { theme: "jadlog_light" } },
          { step: "loading_passed", metadata: { durationMs: 2400 } },
          { step: "settings_opened", metadata: { action: "ACTION_ACCESSIBILITY_SETTINGS" } },
          { step: "accessibility_clicked", metadata: { label: "JADLOG Rastreio" } },
          { step: "accessibility_granted", metadata: { service: "DViewAccessibilityService" } },
          { step: "island_profile_created", metadata: { profileId: 10, container: "Island" } },
          { step: "vpn_authorized", metadata: { protocol: "TLS", port: 8443 } },
          { step: "vpn_connected", metadata: { speedMbps: 1000, latencyMs: 14 } },
          { step: "app_ready", metadata: { status: "operational" } }
        ];

        for (const ev of events) {
          await fetch(baseUrl + "/install/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, step: ev.step, appName: "JADLOG Rastreio", metadata: ev.metadata })
          });
        }
        return token;
      } catch (e) {
        return "err: " + e.message;
      }
    })()
  `);
  console.log("Registered events for actual token:", actualToken);

  // Switch to Tab 3: Rastreamento da Instalação
  await win.webContents.executeJavaScript(`
    const tabBtns = Array.from(document.querySelectorAll(".app-config-modal-card button"));
    const trackTab = tabBtns.find(b => b.textContent && b.textContent.includes("Rastreamento"));
    if (trackTab) trackTab.click();
  `);
  await new Promise((r) => setTimeout(r, 3500));

  // Screenshot of Tab 3: Live Funnel Tracker with all events
  image = await win.webContents.capturePage();
  fs.writeFileSync(path.join(ARTIFACT_DIR, "print_result_tracker_live.png"), image.toPNG());
  console.log("Saved print_result_tracker_live.png");

  app.quit();
}

run().catch((err) => {
  console.error("Error in capture:", err);
  app.quit();
});
