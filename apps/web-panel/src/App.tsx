import { useEffect, useMemo, useState } from "react";
import { Activity, Boxes, Download, LayoutDashboard, ListChecks, LogOut, MonitorSmartphone, Settings, Shield, Smartphone } from "lucide-react";
import { api } from "./api";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Devices } from "./pages/Devices";
import { RemoteSession } from "./pages/RemoteSession";
import { AppsManager } from "./pages/AppsManager";
import { Logs } from "./pages/Logs";
import { SettingsPage } from "./pages/SettingsPage";
import { About } from "./pages/About";
import { ApkBuilder } from "./pages/ApkBuilder";
import { useAppStore } from "./store";
import { createSocket } from "./socket/client";
import { translate } from "./i18n";

const nav = [
  { name: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { name: "Clients", icon: Smartphone, adminOnly: false },
  { name: "Remote Session", icon: MonitorSmartphone, adminOnly: false },
  { name: "Apps Manager", icon: Boxes, adminOnly: true },
  { name: "Connection Logs", icon: ListChecks, adminOnly: true },
  { name: "Gerador APK", icon: Download, adminOnly: true },
  { name: "Settings", icon: Settings, adminOnly: true },
  { name: "About", icon: Shield, adminOnly: false }
];

export function App() {
  const { token, user, view, setView, logout, setDevices, setSessions, setStats, preferences } = useAppStore();
  const [error, setError] = useState("");
  const t = (key: string) => translate(preferences.language, key);

  const refresh = async () => {
    if (!token) return;
    try {
      const [stats, devices, sessions] = await Promise.all([api.dashboard(), api.devices(), api.sessions()]);
      setStats(stats);
      setDevices(devices);
      setSessions(sessions);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar painel");
    }
  };

  useEffect(() => {
    void refresh();
    if (!token) return;
    const socket = createSocket({
      onDevice: () => void refresh(),
      onSession: () => void refresh()
    });
    const timer = window.setInterval(refresh, 10000);
    return () => {
      socket.close();
      window.clearInterval(timer);
    };
  }, [token]);

  const page = useMemo(() => {
    const adminViews = ["Apps Manager", "Connection Logs", "Gerador APK", "Settings"];
    if (user?.role !== "admin" && adminViews.includes(view)) {
      return <Dashboard />;
    }
    switch (view) {
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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Activity size={26} />
          <div>
            <strong>DVIEW</strong>
            <span>{user?.role === "admin" ? "Admin Console" : "Operador"}</span>
          </div>
        </div>
        <nav>
          {nav.filter((item) => user?.role === "admin" || !item.adminOnly).map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.name} className={view === item.name ? "active" : ""} onClick={() => setView(item.name)}>
                <Icon size={18} />
                <span>{t(item.name)}</span>
              </button>
            );
          })}
        </nav>
        <button className="logout" onClick={logout}>
          <LogOut size={18} />
          <span>{t("logout")}</span>
        </button>
      </aside>
      <main className="content">
        <header className="topbar">
          <div>
            <span className="eyebrow">{t("localOperation")}</span>
            <h1>{t(user?.role !== "admin" && ["Apps Manager", "Connection Logs", "Gerador APK", "Settings"].includes(view) ? "Dashboard" : view)}</h1>
          </div>
          <div className="toolbar">
            <span className={`badge ${user?.role === "admin" ? "active" : ""}`}>{t(user?.role === "admin" ? "adminArea" : "operatorArea")}</span>
            <button className="secondary" onClick={() => void refresh()}>{t("refresh")}</button>
          </div>
        </header>
        {error ? <div className="alert">{error}</div> : null}
        {page}
      </main>
    </div>
  );
}
