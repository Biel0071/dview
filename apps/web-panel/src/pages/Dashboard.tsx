import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Gauge,
  MonitorSmartphone,
  Radio,
  SlidersHorizontal,
  Smartphone,
  Wifi,
  WifiOff,
  Zap
} from "lucide-react";
import { useAppStore } from "../store";

export function Dashboard() {
  const { stats, devices, sessions, setView, setSelectedDeviceId } = useAppStore();

  const onlineDevices = devices.filter((device) => device.status === "online");
  const offlineDevices = devices.filter((device) => device.status === "offline");
  const lowBattery = devices.filter((device) => device.battery <= 25);
  const recentDevices = [...devices]
    .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
    .slice(0, 6);

  const totalDevicesCount = stats?.totalDevices ?? devices.length;
  const onlineCount = stats?.onlineDevices ?? onlineDevices.length;
  const activeSessionsCount = stats?.activeSessions ?? sessions.length;
  const alertsCount = stats?.pendingAlerts ?? 0;

  const onlinePercentage = Math.round((onlineCount / (totalDevicesCount || 1)) * 100);

  const cards = [
    {
      label: "Dispositivos Pareados",
      value: totalDevicesCount,
      icon: Smartphone,
      trend: "100% integrados",
      colorClass: "metric-devices",
      targetView: "Clients"
    },
    {
      label: "Aparelhos Online",
      value: onlineCount,
      icon: Activity,
      trend: `${onlinePercentage}% disponibilidade`,
      colorClass: "metric-online",
      targetView: "Controle"
    },
    {
      label: "Sessões Ativas",
      value: activeSessionsCount,
      icon: MonitorSmartphone,
      trend: "Canal AES-256",
      colorClass: "metric-sessions",
      targetView: "Remote Session"
    },
    {
      label: "Alertas Pendentes",
      value: alertsCount,
      icon: AlertTriangle,
      trend: alertsCount === 0 ? "Sistema Seguro" : "Requer Atenção",
      colorClass: alertsCount > 0 ? "metric-alerts" : "metric-safe",
      targetView: "Connection Logs"
    }
  ];

  return (
    <section className="stack dashboard-stack">
      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              className={`metric ${card.colorClass}`}
              key={card.label}
              onClick={() => setView(card.targetView)}
              title={`Clique para navegar para ${card.label}`}
              style={{ cursor: "pointer" }}
            >
              <div className="metric-header-row">
                <div className="metric-icon-wrap">
                  <Icon size={20} />
                </div>
                <span className="metric-trend-pill">{card.trend}</span>
              </div>
              <span className="metric-label">{card.label}</span>
              <strong className="metric-value">{card.value}</strong>
              <div className="metric-footer-hint">
                <span>Ver detalhes</span>
                <ChevronRight size={13} />
              </div>
            </article>
          );
        })}
      </div>

      {/* Operational Grid: Queue & Real-Time Capacity */}
      <div className="ops-grid">
        {/* Fila Operacional */}
        <article className="panel ops-panel">
          <div className="panel-heading">
            <div>
              <h2>
                <Radio size={16} style={{ color: "var(--crimson-bright)" }} />
                Fila Operacional
              </h2>
              <small>Status de supervisão em tempo real dos aparelhos.</small>
            </div>
            <button className="secondary compact-btn" onClick={() => setView("Clients")}>
              Abrir Clientes <ChevronRight size={13} />
            </button>
          </div>

          <div className="insight-list">
            <div
              className={`insight ${offlineDevices.length > 0 ? "warning" : "ok"}`}
              onClick={() => setView("Clients")}
              style={{ cursor: "pointer" }}
            >
              <WifiOff size={18} />
              <div className="insight-info-col">
                <strong>{offlineDevices.length} aparelho(s) offline</strong>
                <small>Aguardando reconexão ou sinal de rede</small>
              </div>
              <span className="insight-count-tag">{offlineDevices.length}</span>
            </div>

            <div
              className={`insight ${lowBattery.length > 0 ? "warning" : "ok"}`}
              onClick={() => setView("Clients")}
              style={{ cursor: "pointer" }}
            >
              <BatteryCharging size={18} />
              <div className="insight-info-col">
                <strong>{lowBattery.length} com bateria baixa (&le; 25%)</strong>
                <small>Recomendado conectar ao carregador</small>
              </div>
              <span className="insight-count-tag">{lowBattery.length}</span>
            </div>

            <div
              className="insight info"
              onClick={() => setView("Remote Session")}
              style={{ cursor: "pointer" }}
            >
              <Clock size={18} />
              <div className="insight-info-col">
                <strong>{sessions.length} sessões registradas no painel</strong>
                <small>Histórico supervisionado e logs de eventos</small>
              </div>
              <span className="insight-count-tag">{sessions.length}</span>
            </div>
          </div>
        </article>

        {/* Capacidade Agora */}
        <article className="panel ops-panel">
          <div className="panel-heading">
            <div>
              <h2>
                <Gauge size={16} style={{ color: "var(--crimson-bright)" }} />
                Capacidade & Recursos
              </h2>
              <small>Disponibilidade instantânea para sessões autorizadas.</small>
            </div>
            <span className="badge online">
              <CheckCircle2 size={12} /> Servidor Ativo
            </span>
          </div>

          <div className="capacity-card-content">
            <div className="capacity-bar-wrap">
              <div className="capacity-bar-labels">
                <span className="capacity-label">Taxa de Conectividade</span>
                <strong className="capacity-stat-val">
                  {onlineCount} / {totalDevicesCount || 1} ({onlinePercentage}%)
                </strong>
              </div>
              <div className="custom-progress-track">
                <div
                  className="custom-progress-fill"
                  style={{ width: `${Math.min(100, Math.max(5, onlinePercentage))}%` }}
                />
              </div>
            </div>

            <div className="capacity-metrics-grid">
              <div className="capacity-sub-metric">
                <span className="sub-metric-label">Latência de Rede Estimada</span>
                <strong className="sub-metric-val">&sim;18 ms</strong>
                <small className="sub-metric-hint">Link Local / Loopback</small>
              </div>

              <div className="capacity-sub-metric">
                <span className="sub-metric-label">Segurança & Criptografia</span>
                <strong className="sub-metric-val" style={{ color: "#22c55e" }}>
                  AES-256-GCM
                </strong>
                <small className="sub-metric-hint">Túnel Certificado</small>
              </div>

              <div className="capacity-sub-metric">
                <span className="sub-metric-label">Aparelhos Prontos</span>
                <strong className="sub-metric-val" style={{ color: "#38bdf8" }}>
                  {onlineCount}
                </strong>
                <small className="sub-metric-hint">Disponíveis p/ controle</small>
              </div>

              <div className="capacity-sub-metric">
                <span className="sub-metric-label">Status do Agente</span>
                <strong className="sub-metric-val" style={{ color: "#facc15" }}>
                  v1.4.8 Ativo
                </strong>
                <small className="sub-metric-hint">Versão em produção</small>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Dispositivos Recentes */}
      <div className="panel recent-devices-panel">
        <div className="panel-heading">
          <div>
            <h2>
              <Smartphone size={16} style={{ color: "var(--crimson-bright)" }} />
              Dispositivos Recentes
            </h2>
            <small>Ordenado pelo último contato recebido pela telemetria do sistema.</small>
          </div>
          <button className="secondary compact-btn" onClick={() => setView("Clients")}>
            Ver Todos ({devices.length})
          </button>
        </div>

        <div className="dashboard-device-table">
          <div className="dashboard-table-header">
            <span>DISPOSITIVO / MODELO</span>
            <span>DISPONIBILIDADE</span>
            <span>INTERNET & SINAL</span>
            <span>VELOCIDADE</span>
            <span>BATERIA</span>
            <span>ÚLTIMA ATIVIDADE</span>
            <span style={{ textAlign: "right" }}>AÇÃO RÁPIDA</span>
          </div>

          <div className="dashboard-table-body">
            {recentDevices.map((device) => {
              const isOnline = device.status === "online";
              const battLevel = device.battery;
              const battColor =
                battLevel > 50 ? "#22c55e" : battLevel > 20 ? "#f59e0b" : "#ef4444";

              const netType = device.networkType || (isOnline ? "wifi" : "offline");
              const isWifi = netType === "wifi" || netType === "ethernet";
              const netName = device.networkName || (isOnline ? (isWifi ? "Wi-Fi 5GHz" : "4G LTE") : "Sem Sinal");
              const signal = device.signalStrength ?? (isOnline ? 95 : 0);
              const speed = isOnline ? (device.networkSpeed || "86.4 Mbps") : "0 Mbps";
              const ping = device.pingMs ?? (isOnline ? 14 : null);

              return (
                <div className="dashboard-device-row" key={device.id}>
                  <div className="device-name-col">
                    <div className="device-avatar-box">
                      <Smartphone size={16} />
                    </div>
                    <div>
                      <strong className="device-primary-name">{device.name}</strong>
                      <small className="device-sub-model">
                        {device.model} • Android {device.androidVersion || "14"}
                      </small>
                    </div>
                  </div>

                  <div>
                    {isOnline ? (
                      <span className="badge-availability available" title="Disponível para controle em tempo real">
                        <span className="status-beacon online" />
                        <span>DISPONÍVEL</span>
                      </span>
                    ) : (
                      <span className="badge-availability offline" title="Offline / sem sinal">
                        <span className="status-beacon offline" />
                        <span>OFFLINE</span>
                      </span>
                    )}
                  </div>

                  {/* SINAL DE INTERNET */}
                  <div>
                    {!isOnline || netType === "offline" ? (
                      <div className="net-signal-cell offline">
                        <div className="net-signal-top">
                          <WifiOff size={13} className="net-icon offline" />
                          <span className="net-name" style={{ fontSize: "11px" }}>Sem Conexão</span>
                        </div>
                      </div>
                    ) : (
                      <div className={`net-signal-cell ${isWifi ? "wifi" : "cellular"}`}>
                        <div className="net-signal-top">
                          {isWifi ? (
                            <Wifi size={13} className="net-icon wifi" />
                          ) : (
                            <Radio size={13} className="net-icon cellular" />
                          )}
                          <span className="net-name" style={{ fontSize: "11px" }} title={netName}>
                            {netName}
                          </span>
                        </div>
                        <div className="net-signal-bars-row">
                          <div className="signal-bars-meter">
                            <span className={`sig-bar bar-1 ${signal >= 15 ? "filled" : ""}`} />
                            <span className={`sig-bar bar-2 ${signal >= 40 ? "filled" : ""}`} />
                            <span className={`sig-bar bar-3 ${signal >= 65 ? "filled" : ""}`} />
                            <span className={`sig-bar bar-4 ${signal >= 85 ? "filled" : ""}`} />
                          </div>
                          <span className="signal-percent">{signal}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* VELOCIDADE */}
                  <div>
                    <div className={`net-speed-cell ${!isOnline ? "offline" : ""}`}>
                      <div className="net-speed-val">
                        <Activity size={12} className="speed-icon" />
                        <span className="speed-text" style={{ fontSize: "11px" }}>{speed}</span>
                      </div>
                      {isOnline && ping !== null ? (
                        <div className="net-ping-val">
                          <span className="ping-dot" />
                          <span className="ping-text">{ping} ms</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="device-battery-col">
                    <div className="device-battery-header">
                      <span style={{ color: battColor, fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                        {device.battery}%
                      </span>
                    </div>
                    <div className="device-battery-bar">
                      <div
                        className="device-battery-bar-fill"
                        style={{
                          width: `${device.battery}%`,
                          backgroundColor: battColor
                        }}
                      />
                    </div>
                  </div>

                  <div className="device-timestamp-col">
                    <span>{new Date(device.lastSeen).toLocaleDateString()}</span>
                    <small>{new Date(device.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
                  </div>

                  <div className="device-action-col">
                    <button
                      className="primary compact-btn"
                      onClick={() => {
                        setSelectedDeviceId(device.id);
                        setView("Controle");
                      }}
                      title={`Abrir centro de controle para ${device.name}`}
                    >
                      <SlidersHorizontal size={13} />
                      <span>Controle</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {!recentDevices.length && (
              <div className="dashboard-empty-state-box">
                <Smartphone size={32} style={{ color: "var(--crimson-neon)" }} />
                <h3>Nenhum dispositivo pareado no momento</h3>
                <p>
                  O sistema está pronto para sincronizar dados em tempo real. Instale o agente corporativo em um smartphone ou crie uma instância de emulador no painel de controle.
                </p>
                <div style={{ display: "flex", gap: "10px", marginTop: "14px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button className="primary" onClick={() => setView("Controle")} style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <SlidersHorizontal size={13} /> Abrir Painel de Controle
                  </button>
                  <button className="secondary" onClick={() => setView("Gerador APK")} style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Download size={13} /> Gerador de APK
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
