import { Activity, AlertTriangle, MonitorSmartphone, Smartphone } from "lucide-react";
import { useAppStore } from "../store";

export function Dashboard() {
  const { stats, devices } = useAppStore();
  const cards = [
    { label: "Dispositivos", value: stats?.totalDevices ?? 0, icon: Smartphone },
    { label: "Online", value: stats?.onlineDevices ?? 0, icon: Activity },
    { label: "Sessoes ativas", value: stats?.activeSessions ?? 0, icon: MonitorSmartphone },
    { label: "Alertas", value: stats?.pendingAlerts ?? 0, icon: AlertTriangle }
  ];

  return (
    <section className="stack">
      <div className="kpi-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="metric" key={card.label}>
              <Icon size={22} />
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          );
        })}
      </div>
      <div className="panel">
        <h2>Dispositivos recentes</h2>
        <div className="table">
          {devices.map((device) => (
            <div className="row" key={device.id}>
              <span>{device.name}</span>
              <span>{device.model}</span>
              <span className={`badge ${device.status}`}>{device.status}</span>
              <span>{device.battery}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
