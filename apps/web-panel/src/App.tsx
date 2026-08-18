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

const nav = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Clients", icon: Smartphone },
  { name: "Remote Session", icon: MonitorSmartphone },
  { name: "Apps Manager", icon: Boxes },
  { name: "Connection Logs", icon: ListChecks },
  { name: "Gerador APK", icon: Download },
  { name: "Settings", icon: Settings },
  { name: "About", icon: Shield }
];

export function App() {
  const { token, view, setView, logout, setDevices, setSessions, setStats } = useAppStore();
  const [error, setError] = useState("");

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
  }, [view]);

  if (!token) return <Login />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Activity size={26} />
          <div>
            <strong>DroidView</strong>
            <span>Admin Console</span>
          </div>
        </div>
        <nav>
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.name} className={view === item.name ? "active" : ""} onClick={() => setView(item.name)}>
                <Icon size={18} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
        <button className="logout" onClick={logout}>
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </aside>
      <main className="content">
        <header className="topbar">
          <div>
            <span className="eyebrow">Operacao local</span>
            <h1>{view}</h1>
          </div>
          <button className="secondary" onClick={() => void refresh()}>Atualizar</button>
        </header>
        {error ? <div className="alert">{error}</div> : null}
        {page}
      </main>
    </div>
  );
}
