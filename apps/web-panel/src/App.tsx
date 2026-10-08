import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Boxes,
  ChevronLeft,
  CircleDot,
  Download,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MonitorSmartphone,
  Radio,
  RefreshCw,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  User as UserIcon,
  X
} from "lucide-react";
import { api } from "./api";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Devices } from "./pages/Devices";
import { RemoteSession } from "./pages/RemoteSession";
import { AppsManager } from "./pages/AppsManager";
import { Logs } from "./pages/Logs";
import { SettingsPage } from "./pages/SettingsPage";
import { ApkBuilder } from "./pages/ApkBuilder";
import { ControlPanel } from "./pages/control/ControlPanel";
import { About } from "./pages/About";
import { useAppStore } from "./store";
import { createSocket } from "./socket/client";
import { translate } from "./i18n";

import { PopoutDeviceView } from "./pages/control/PopoutDeviceView";

interface NavItem {
  name: string;
  icon: typeof LayoutDashboard;
  adminOnly: boolean;
  badgeKey?: "devices" | "alerts" | "sessions";
}

const nav: NavItem[] = [
  { name: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { name: "Controle", icon: SlidersHorizontal, adminOnly: false },
  { name: "Clients", icon: Smartphone, adminOnly: false, badgeKey: "devices" },
  { name: "Gerador APK", icon: Download, adminOnly: false }
];

export function viewToSlug(viewName: string): string {
  switch (viewName) {
    case "Controle":
      return "control";
    case "Clients":
      return "devices";
    case "Gerador APK":
      return "apk-builder";
    case "Settings":
      return "settings";
    case "Apps Manager":
      return "apps";
    case "Connection Logs":
      return "logs";
    case "About":
      return "about";
    case "Remote Session":
      return "sessions";
    case "Dashboard":
    default:
      return "dashboard";
  }
}

export function slugToView(slug?: string | null): string | null {
  if (!slug) return null;
  const s = slug.toLowerCase().trim();
  if (s === "control" || s === "controle") return "Controle";
  if (s === "devices" || s === "clients" || s === "dispositivos") return "Clients";
  if (s === "apk-builder" || s === "gerador-apk" || s === "builder") return "Gerador APK";
  if (s === "settings" || s === "configuracoes") return "Settings";
  if (s === "apps" || s === "apps-manager") return "Apps Manager";
  if (s === "logs" || s === "auditoria") return "Connection Logs";
  if (s === "about" || s === "sobre") return "About";
  if (s === "sessions" || s === "sessao") return "Remote Session";
  if (s === "dashboard" || s === "painel") return "Dashboard";
  return null;
}

export interface RouteState {
  view: string;
  selectedDeviceId?: string | null;
  encryptedToken?: string | null;
}

export function parseCurrentRoute(): RouteState {
  if (typeof window === "undefined") {
    return { view: "Dashboard" };
  }
  const pathname = window.location.pathname.replace(/^\/+|\/+$/g, "");
  const segments = pathname ? pathname.split("/") : [];
  const params = new URLSearchParams(window.location.search);

  let encryptedToken = params.get("inst") || params.get("instance_token") || params.get("token") || null;
  let deviceId = params.get("instance") || params.get("deviceId") || params.get("id") || null;
  let pageParam = params.get("page") || params.get("view") || null;

  if (segments.length >= 2) {
    const prefix = segments[0].toLowerCase();
    const slugParam = segments.slice(1).join("/");
    if (prefix === "inst" || prefix === "i" || prefix === "token") {
      encryptedToken = slugParam;
    } else if (prefix === "instance" || prefix === "device" || prefix === "dev") {
      deviceId = slugParam;
    } else if (prefix === "control" || prefix === "controle") {
      if (slugParam.includes(".") || slugParam.length > 50) {
        encryptedToken = slugParam;
      } else {
        deviceId = slugParam;
      }
    }
  } else if (segments.length === 1 && !pageParam) {
    const single = segments[0];
    const matched = slugToView(single);
    if (matched) {
      pageParam = single;
    } else if (single.includes(".") || single.length > 50) {
      encryptedToken = single;
    } else if (single.startsWith("dev_") || single.startsWith("emu_")) {
      deviceId = single;
    }
  }

  let matchedView = slugToView(pageParam);
  if (encryptedToken || deviceId) {
    matchedView = "Controle";
  }

  return {
    view: matchedView || "Dashboard",
    selectedDeviceId: deviceId,
    encryptedToken
  };
}

export function formatRouteUrl(
  viewName: string,
  deviceId?: string | null,
  encryptedToken?: string | null
): string {
  if (viewName === "Controle") {
    if (encryptedToken) {
      return `/inst/${encodeURIComponent(encryptedToken)}`;
    }
    if (deviceId) {
      return `/instance/${encodeURIComponent(deviceId)}`;
    }
    return "/control";
  }
  const slug = viewToSlug(viewName);
  return slug === "dashboard" ? "/" : `/${slug}`;
}

export function App() {
  const isPopout = useMemo(() => {
    return window.location.search.includes("popout=true") || window.location.pathname.startsWith("/popout");
  }, []);

  const popoutDeviceId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("deviceId") || "dev_sm_n975f";
  }, []);

  if (isPopout) {
    return <PopoutDeviceView deviceId={popoutDeviceId} />;
  }
  const {
    token,
    user,
    view,
    setView,
    logout,
    setDevices,
    upsertDevice,
    markDeviceOffline,
    removeDevice,
    setSessions,
    setStats,
    preferences,
    devices,
    sessions,
    stats,
    selectedDeviceId,
    setSelectedDeviceId
  } = useAppStore();

  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [instanceToast, setInstanceToast] = useState<string | null>(null);
  const [currentEncryptedToken, setCurrentEncryptedToken] = useState<string | null>(null);
  const t = (key: string) => translate(preferences.language, key);

  // 1. Initial URL Inspection (Path Slug, Tokenized Instance, or Direct Instance ID)
  useEffect(() => {
    const route = parseCurrentRoute();

    if (route.encryptedToken) {
      setCurrentEncryptedToken(route.encryptedToken);
      void (async () => {
        try {
          const res = await api.resolveInstanceToken(route.encryptedToken!);
          if (res?.valid && res.deviceId) {
            setSelectedDeviceId(res.deviceId);
            setView("Controle");
            setInstanceToast(`Instância Criptografada Conectada: ${res.deviceName || res.deviceId}`);
            setTimeout(() => setInstanceToast(null), 5000);
          }
        } catch {
          if (route.selectedDeviceId) {
            setSelectedDeviceId(route.selectedDeviceId);
            setView("Controle");
          }
        }
      })();
      return;
    }

    if (route.selectedDeviceId) {
      setSelectedDeviceId(route.selectedDeviceId);
      setView("Controle");
      return;
    }

    if (route.view && route.view !== view) {
      setView(route.view);
    }
  }, []);

  // 2. Keep Browser URL synchronized with current Page, Instance and Encrypted Token
  useEffect(() => {
    if (!token) return;
    const targetUrl = formatRouteUrl(view, selectedDeviceId, view === "Controle" ? currentEncryptedToken : null);
    const currentFull = window.location.pathname;
    if (currentFull !== targetUrl && !window.location.search.includes("popout=true")) {
      window.history.replaceState(null, "", targetUrl);
    }
  }, [view, selectedDeviceId, currentEncryptedToken, token]);

  // 3. Browser Back/Forward navigation listener
  useEffect(() => {
    const handlePopState = () => {
      const route = parseCurrentRoute();
      if (route.view) {
        setView(route.view);
      }
      if (route.encryptedToken) {
        setCurrentEncryptedToken(route.encryptedToken);
        void (async () => {
          try {
            const res = await api.resolveInstanceToken(route.encryptedToken!);
            if (res?.valid && res.deviceId) {
              setSelectedDeviceId(res.deviceId);
            }
          } catch {}
        })();
      } else {
        setCurrentEncryptedToken(null);
        if (route.selectedDeviceId) {
          setSelectedDeviceId(route.selectedDeviceId);
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const refresh = async () => {
    if (!token) return;
    setIsRefreshing(true);
    try {
      const [statsRes, devicesRes, sessionsRes] = await Promise.all([
        api.dashboard(),
        api.devices(),
        api.sessions()
      ]);
      setStats(statsRes);
      setDevices(devicesRes);
      setSessions(sessionsRes);
      setError("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao atualizar painel";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setError("Servidor Central desconectado. Aguardando reconexão...");
      } else {
        setError(msg);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void refresh();
    if (!token) return;
    const socket = createSocket({
      onDevice: (dev) => {
        upsertDevice(dev);
      },
      onDeviceDisconnect: (devId) => {
        markDeviceOffline(devId);
      },
      onDeviceUpdate: (dev) => {
        upsertDevice(dev);
      },
      onSession: () => void refresh()
    });
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }, 15000);
    return () => {
      socket.close();
      window.clearInterval(timer);
    };
  }, [token]);

  const onlineDevicesCount = useMemo(() => {
    return devices.filter((d) => d.status === "online").length;
  }, [devices]);

  const activeSessionsCount = useMemo(() => {
    return sessions.filter((s) => s.status === "active").length;
  }, [sessions]);

  const pendingAlertsCount = stats?.pendingAlerts ?? 0;



  const page = useMemo(() => {
    switch (view) {
      case "Controle":
        return <ControlPanel />;
      case "Clients":
        return <Devices initialTab="devices" />;
      case "Remote Session":
        return <Devices initialTab="sessions" />;
      case "Gerador APK":
        return <ApkBuilder />;
      case "Settings":
      case "Apps Manager":
      case "Connection Logs":
      case "About":
        return (
          <SettingsPage
            initialTab={
              view === "Apps Manager"
                ? "apps"
                : view === "Connection Logs"
                ? "logs"
                : view === "About"
                ? "about"
                : "preferences"
            }
          />
        );
      case "Dashboard":
      default:
        return <Dashboard />;
    }
  }, [view]);

  const [isGlobalSidebarCollapsed, setIsGlobalSidebarCollapsed] = useState(false);

  if (!token) return <Login />;

  return (
    <div className={`app-shell ${isGlobalSidebarCollapsed ? "sidebar-shell-collapsed" : ""}`}>
      <aside className={`sidebar ${isGlobalSidebarCollapsed ? "sidebar-collapsed-compact" : ""}`}>
        {/* Brand Header */}
        <div className="brand" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="brand-emblem-wrap">
              <img src="./dview-logo.jpg" alt="DVIEW Emblem" />
            </div>
            {!isGlobalSidebarCollapsed && (
              <div>
                <div className="brand-title-row">
                  <strong>DVIEW</strong>
                  <span className="brand-release-tag">v0.1.0</span>
                </div>
                <span>{user?.role === "admin" ? "Console Admin" : "Operador"}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            className="sidebar-collapse-toggle-btn"
            onClick={() => setIsGlobalSidebarCollapsed(!isGlobalSidebarCollapsed)}
            title={isGlobalSidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
            style={{
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid #1e293b",
              borderRadius: "4px",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center"
            }}
          >
            <ChevronLeft size={14} style={{ transform: isGlobalSidebarCollapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
        </div>

        {/* Live Pulse / Offline Indicator in Sidebar */}
        {!isGlobalSidebarCollapsed && (
          <div className="sidebar-c2-status-card">
            {onlineDevicesCount > 0 ? (
              <>
                <span className="c2-live-beacon" />
                <div className="c2-status-details" style={{ flex: 1 }}>
                  <span className="c2-status-title">REDE CENTRAL ATIVA</span>
                  <small className="c2-status-sub">
                    {onlineDevicesCount} {onlineDevicesCount === 1 ? "aparelho conectado" : "aparelhos conectados"}
                  </small>
                </div>
              </>
            ) : (
              <>
                <span className="c2-beacon-offline" />
                <div className="c2-status-details" style={{ flex: 1 }}>
                  <span className="c2-status-title" style={{ color: "#ef4444" }}>CONEXÃO OFF</span>
                  <small className="c2-status-sub" style={{ color: "#f87171" }}>Sem Conexão (0 aparelhos)</small>
                </div>
              </>
            )}
            <button
              type="button"
              className="sidebar-quick-refresh-btn"
              onClick={() => void refresh()}
              disabled={isRefreshing}
              title="Sincronizar dados com servidor central"
            >
              <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
            </button>
          </div>
        )}

        {/* Navigation Items with Tactical Badges */}
        <nav>
          {nav
            .filter((item) => user?.role === "admin" || !item.adminOnly)
            .map((item) => {
              const Icon = item.icon;
              const isActive = view === item.name;

              let badgeCount: number | null = null;
              if (item.badgeKey === "devices") badgeCount = onlineDevicesCount;
              if (item.badgeKey === "sessions" && activeSessionsCount > 0) badgeCount = activeSessionsCount;
              if (item.badgeKey === "alerts" && pendingAlertsCount > 0) badgeCount = pendingAlertsCount;

              return (
                <button
                  key={item.name}
                  className={`nav-item-btn ${isActive ? "active" : ""}`}
                  onClick={() => setView(item.name)}
                >
                  <Icon size={17} className="nav-icon" />
                  <span className="nav-label">{t(item.name)}</span>
                  {badgeCount !== null && (
                    <span
                      className={`nav-badge-pill ${
                        item.badgeKey === "alerts"
                          ? "badge-alert"
                          : item.badgeKey === "sessions"
                          ? "badge-active-session"
                          : "badge-online"
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
        </nav>

        {/* Sidebar Footer: Settings, Operator Info & Logout */}
        <div className="sidebar-footer-wrap">
          <button
            type="button"
            className={`settings-nav-btn ${
              view === "Settings" ||
              view === "Apps Manager" ||
              view === "Connection Logs" ||
              view === "Remote Session" ||
              view === "About"
                ? "active"
                : ""
            }`}
            onClick={() => setView("Settings")}
            title="Configurações & Painel Administrativo"
          >
            <Settings size={16} />
            {!isGlobalSidebarCollapsed && <span>{t("Settings")}</span>}
          </button>

          <div className="sidebar-operator-card">
            <div className="operator-avatar">
              <UserIcon size={14} />
            </div>
            <div className="operator-meta">
              <span className="operator-name">{user?.name || "Operador"}</span>
              <span className="operator-role-badge">
                {user?.role === "admin" ? "ADMINISTRADOR" : "OPERADOR"}
              </span>
            </div>
          </div>

          <button className="logout-btn" onClick={logout} title={t("logout")}>
            <LogOut size={16} />
            <span>{t("logout")}</span>
          </button>
        </div>
      </aside>

      <main className={`content ${view === "Controle" ? "content-controle-mode" : ""}`}>
        {instanceToast && (
          <div
            style={{
              position: "fixed",
              top: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "linear-gradient(135deg, rgba(8, 28, 52, 0.98) 0%, rgba(15, 23, 42, 0.95) 100%)",
              border: "1.5px solid #00f0ff",
              boxShadow: "0 0 24px rgba(0, 240, 255, 0.45)",
              color: "#f8fafc",
              padding: "8px 20px",
              borderRadius: "24px",
              fontSize: "12px",
              fontWeight: 800,
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backdropFilter: "blur(10px)"
            }}
          >
            <ShieldCheck size={16} style={{ color: "#00f0ff" }} />
            <span>{instanceToast}</span>
          </div>
        )}

        {error ? (
          <div className="alert alert-dismissible">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
              <Radio size={16} />
              <span>{error}</span>
            </div>
            <button className="alert-close-btn" onClick={() => setError("")} title="Fechar alerta">
              <X size={14} />
            </button>
          </div>
        ) : null}

        <div key={view} className="page-transition">
          {page}
        </div>
      </main>
    </div>
  );
}
