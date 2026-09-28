const { app, BrowserWindow, shell } = require("electron");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const isDev = require("electron-is-dev");
const { startEmbeddedBackend, stopEmbeddedBackend, resolveWebPanelDir } = require("./embeddedBackend.cjs");

let mainWindow = null;
let actualBackendPort = 3000;
let isQuitting = false;

function findWebPanelIndex() {
  const panelDir = resolveWebPanelDir();
  if (panelDir) {
    const candidate = path.join(panelDir, "index.html");
    if (fs.existsSync(candidate)) return candidate;
  }
  const candidates = [
    path.join(__dirname, "../web-panel/index.html"),
    path.join(__dirname, "../../web-panel/dist/index.html"),
    path.join(__dirname, "../apps/web-panel/dist/index.html"),
    path.join(process.resourcesPath || "", "app.asar/web-panel/index.html"),
    path.join(process.resourcesPath || "", "app/web-panel/index.html"),
    path.join(process.cwd(), "apps/web-panel/dist/index.html"),
    path.join(process.cwd(), "web-panel/index.html")
  ];
  return candidates.find((cand) => cand && fs.existsSync(cand)) || null;
}

async function checkUrlAccessible(url, timeoutMs = 1000) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function loadPanel(win) {
  const devPort = process.env.WEB_PORT || 5000;
  const devUrl = `http://localhost:${devPort}`;

  // 1. In dev mode, check if Vite dev server is running
  if (isDev) {
    try {
      const isDevServerActive = await checkUrlAccessible(devUrl, 800);
      if (isDevServerActive) {
        console.log(`[DVIEW Desktop] Loading panel from Vite dev server: ${devUrl}`);
        return win.loadURL(devUrl);
      }
    } catch {}
  }

  // 2. Check if embedded backend is serving the web panel over HTTP
  const httpUrl = `http://localhost:${actualBackendPort}`;
  try {
    const isHttpPanelReady = await checkUrlAccessible(httpUrl, 800);
    if (isHttpPanelReady) {
      console.log(`[DVIEW Desktop] Loading panel from embedded HTTP server: ${httpUrl}`);
      return win.loadURL(httpUrl);
    }
  } catch {}

  // 3. Fallback to direct file loading via file:// protocol
  const indexPath = findWebPanelIndex();
  if (indexPath) {
    console.log(`[DVIEW Desktop] Loading panel from file: ${indexPath}`);
    return win.loadFile(indexPath);
  }

  // 4. Ultimate fallback to localhost URL
  console.log(`[DVIEW Desktop] Fallback to URL: ${httpUrl}`);
  win.loadURL(httpUrl);
}

function createWindow() {
  const iconPath = path.join(__dirname, "assets", "logo.jpg");
  const preloadPath = path.join(__dirname, "preload.cjs");

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1100,
    minHeight: 720,
    title: "DVIEW | See Everything. Fear Nothing.",
    backgroundColor: "#06070a",
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: fs.existsSync(preloadPath) ? preloadPath : undefined
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  loadPanel(mainWindow);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    const preferredPort = Number(process.env.PORT || 3000);
    const result = await startEmbeddedBackend(preferredPort, "0.0.0.0");
    if (result && result.port) {
      actualBackendPort = result.port;
    }
  } catch (err) {
    console.error("[DVIEW Desktop] Error starting embedded backend:", err);
  }
  createWindow();
});

app.on("window-all-closed", async () => {
  if (process.platform !== "darwin") {
    await stopEmbeddedBackend();
    app.quit();
  }
});

app.on("before-quit", (event) => {
  if (!isQuitting) {
    isQuitting = true;
    event.preventDefault();
    stopEmbeddedBackend()
      .catch((e) => console.warn("[DVIEW Desktop] Error stopping backend:", e))
      .finally(() => {
        app.quit();
      });
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
