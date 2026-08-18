import { Activity, AlertTriangle, BatteryCharging, Clock, MonitorSmartphone, Smartphone, WifiOff } from "lucide-react";
import { useAppStore } from "../store";

export function Dashboard() {
  const { stats, devices, sessions, setView } = useAppStore();
  const onlineDevices = devices.filter((device) => device.status === "online");
  const offlineDevices = devices.filter((device) => device.status === "offline");
  const lowBattery = devices.filter((device) => device.battery <= 25);
  const recentDevices = [...devices]
    .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
    .slice(0, 5);

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

      <div className="ops-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Fila operacional</h2>
              <small>Resumo para decidir o proximo atendimento.</small>
            </div>
            <button className="secondary" onClick={() => setView("Clients")}>Abrir dispositivos</button>
          </div>
          <div className="insight-list">
            <div className="insight warning">
              <WifiOff size={18} />
              <span>{offlineDevices.length} aparelhos offline</span>
            </div>
            <div className="insight warning">
              <BatteryCharging size={18} />
              <span>{lowBattery.length} com bateria baixa</span>
            </div>
            <div className="insight info">
              <Clock size={18} />
              <span>{sessions.length} sessoes registradas no painel</span>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Capacidade agora</h2>
              <small>Aparelhos online disponiveis para sessao consentida.</small>
            </div>
          </div>
          <div className="progress-stack">
            <div>
              <span>Online</span>
              <strong>{onlineDevices.length}/{devices.length || 1}</strong>
            </div>
            <progress max={devices.length || 1} value={onlineDevices.length} />
            <div>
              <span>Alertas pendentes</span>
              <strong>{stats?.pendingAlerts ?? 0}</strong>
            </div>
          </div>
        </article>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>Dispositivos recentes</h2>
            <small>Ordenado pelo ultimo contato recebido da API local.</small>
          </div>
        </div>
        <div className="table">
          {recentDevices.map((device) => (
            <div className="row dashboard-row" key={device.id}>
              <span>
                <strong>{device.name}</strong>
                <small>{device.model}</small>
              </span>
              <span className={`badge ${device.status}`}>{device.status}</span>
              <span>{device.battery}% bateria</span>
              <span>{new Date(device.lastSeen).toLocaleString()}</span>
            </div>
          ))}
          {!recentDevices.length ? <div className="empty-inline">Nenhum dispositivo pareado ainda.</div> : null}
        </div>
      </div>
    </section>
  );
}
