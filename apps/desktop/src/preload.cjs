const { contextBridge, ipcRenderer } = require("electron");

const apiUrl = process.env.DVIEW_API_URL || "http://localhost:3000";
const socketUrl = process.env.DVIEW_SOCKET_URL || "http://localhost:3000";

try {
  contextBridge.exposeInMainWorld("__DVIEW_API_URL__", apiUrl);
  contextBridge.exposeInMainWorld("__DVIEW_SOCKET_URL__", socketUrl);
  contextBridge.exposeInMainWorld("__IS_DESKTOP__", true);
  contextBridge.exposeInMainWorld("__DVIEW_CONFIG__", {
    apiUrl,
    socketUrl,
    isDesktop: true
  });
} catch (e) {
  window.__DVIEW_API_URL__ = apiUrl;
  window.__DVIEW_SOCKET_URL__ = socketUrl;
  window.__IS_DESKTOP__ = true;
  window.__DVIEW_CONFIG__ = {
    apiUrl,
    socketUrl,
    isDesktop: true
  };
}
