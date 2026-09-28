import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Boxes,
  ChevronRight,
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
  { name: "Remote Session", icon: MonitorSmartphone, adminOnly: false, badgeKey: "sessions" },
  { name: "Apps Manager", icon: Boxes, adminOnly: true },
  { name: "Connection Logs", icon: ListChecks, adminOnly: true, badgeKey: "alerts" },
  { name: "Gerador APK", icon: Download, adminOnly: true },
  { name: "Settings", icon: Settings, adminOnly: true },
  { name: "About", icon: ShieldCheck, adminOnly: false }
];

export function App() {
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
    stats
  } = useAppStore();

  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const t = (key: string) => translate(preferences.language, key);

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
      setError(err instanceof Error ? err.message : "Falha ao atualizar painel");
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
        void refresh();
      },
      onDeviceDisconnect: (devId) => {
        markDeviceOffline(devId);
        void refresh();
      },
      onDeviceUpdate: (dev) => {
        upsertDevice(dev);
        void refresh();
      },
      onSession: () => void refresh()
    });
    const timer = window.setInterval(refresh, 10000);
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

  const currentNav = nav.find((item) => item.name === view) ?? nav[0];
  const CurrentIcon = currentNav.icon;

  const page = useMemo(() => {
    const adminViews = ["Apps Manager", "Connection Logs", "Gerador APK", "Settings"];
    if (user?.role !== "admin" && adminViews.includes(view)) {
      return <Dashboard />;
    }
    switch (view) {
      case "Controle":
        return <ControlPanel />;
      case "Clients":
        return <Devices />;
      case "Remote Session":
        return <RemoteSession />;
      case "Apps Manager":
        return <AppsManager />;
      case "Connection Logs":
        return <Logs />;
      case "Gerador APK":
        return <ApkBuilder />;
      case "Settings":
        return <SettingsPage />;
      case "About":
        return <About />;
      default:
        return <Dashboard />;
    }
  }, [view, user?.role]);

  if (!token) return <Login />;

  const effectiveViewTitle =
    user?.role !== "admin" && ["Apps Manager", "Connection Logs", "Gerador APK", "Settings"].includes(view)
      ? "Dashboard"
      : view;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        {/* Brand Header */}
        <div className="brand">
          <div className="brand-emblem-wrap">
            <img src="./dview-logo.jpg" alt="DVIEW Emblem" />
          </div>
          <div>
            <div className="brand-title-row">
              <strong>DVIEW</strong>
              <span className="brand-release-tag">v0.1.0</span>
            </div>
            <span>{user?.role === "admin" ? "Console Admin" : "Operador"}</span>
          </div>
        </div>

        {/* Live Pulse Indicator in Sidebar */}
        <div className="sidebar-c2-status-card">
          <span className="c2-live-beacon" />
          <div className="c2-status-details">
            <span className="c2-status-title">REDE CENTRAL ATIVA</span>
            <small className="c2-status-sub">{onlineDevicesCount} aparelhos conectados</small>
          </div>
        </div>

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

        {/* Sidebar Footer: Operator Info & Logout */}
        <div className="sidebar-footer-wrap">
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

      <main className="content">
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-breadcrumbs">
              <span className="eyebrow">PAINEL CENTRAL</span>
              <ChevronRight size={12} style={{ color: "#64748b" }} />
              <span className="breadcrumb-current">{t(effectiveViewTitle)}</span>
            </div>
            <h1 className="topbar-main-title">
              <CurrentIcon size={22} className="topbar-title-icon" />
              <span>{t(effectiveViewTitle)}</span>
            </h1>
          </div>

          <div className="topbar-right">
            <div className="topbar-live-chip" title="Conexão com servidor central estável">
              <span className="beacon-dot" />
              <span>SERVIDOR ONLINE</span>
            </div>

            <div className="topbar-stat-pill" title="Dispositivos online no momento">
              <Smartphone size={13} style={{ color: "#22c55e" }} />
              <span>{onlineDevicesCount} online</span>
            </div>

            <span className={`badge ${user?.role === "admin" ? "active" : ""}`}>
              {t(user?.role === "admin" ? "adminArea" : "operatorArea")}
            </span>

            <button
              className="secondary refresh-btn"
              onClick={() => void refresh()}
              disabled={isRefreshing}
              title="Sincronizar dados com servidor local"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              <span>{isRefreshing ? "Sincronizando..." : t("refresh")}</span>
            </button>
          </div>
        </header>

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
