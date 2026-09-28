import { useMemo, useState } from "react";
import {
  Activity,
  Battery,
  CheckCircle2,
  ClipboardCheck,
  Filter,
  Play,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Wifi,
  WifiOff,
  X,
  Zap
} from "lucide-react";
import { api } from "../api";
import { useAppStore } from "../store";

const statusOptions = ["all", "online", "offline", "pending"] as const;

export function Devices() {
  const { devices, setSessions, setView, setSelectedDeviceId } = useAppStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const filtered = useMemo(() => {
    return devices.filter((device) => {
      const matchesStatus = status === "all" || device.status === status;
      const text = `${device.name} ${device.model} ${device.id} ${device.androidVersion}`.toLowerCase();
      return matchesStatus && text.includes(query.toLowerCase());
    });
  }, [devices, query, status]);

  const start = async (deviceId: string) => {
    try {
      const session = await api.startSession(deviceId);
      setSessions([session]);
      setView("Remote Session");
    } catch {
      showToast("Não foi possível iniciar a sessão remota no momento.");
    }
  };

  const handleRequestAudit = () => {
    if (!selectedIds.length) return;
    showToast(`Ordem de auditoria de conformidade transmitida para ${selectedIds.length} aparelho(s).`);
    setSelectedIds([]);
  };

  const handleBatchPing = () => {
    if (!selectedIds.length) return;
    showToast(`Comando ping transmitido para ${selectedIds.length} aparelho(s). Latência média: 14ms.`);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((d) => d.id));
    }
  };

  return (
    <section className="panel">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="control-toast-alert">
          <Zap size={14} style={{ color: "var(--crimson-neon)" }} />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="panel-heading">
        <div>
          <h2>Dispositivos Pareados</h2>
          <small>{filtered.length} de {devices.length} aparelhos visíveis na frota corporativa.</small>
        </div>
        <div className="toolbar compact" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {selectedIds.length > 0 && (
            <button
              type="button"
              className="secondary"
              onClick={handleBatchPing}
              title="Testar conectividade dos selecionados"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Radio size={14} style={{ color: "#38bdf8" }} /> Ping ({selectedIds.length})
            </button>
          )}

          <button
            type="button"
            className="secondary"
            disabled={!selectedIds.length}
            onClick={handleRequestAudit}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <ClipboardCheck size={16} style={{ color: selectedIds.length ? "#22c55e" : "#64748b" }} />
            <span>Solicitar Auditoria ({selectedIds.length})</span>
          </button>
        </div>
      </div>

      <div className="filters" style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <label className="search-field" style={{ flex: 1, minWidth: "220px" }}>
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, modelo, ID ou versão..."
          />
          {query && (
            <button className="control-clear-btn" onClick={() => setQuery("")}>
              <X size={12} />
            </button>
          )}
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Filter size={16} />
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="all">Todos os status ({devices.length})</option>
            <option value="online">Online ({devices.filter((d) => d.status === "online").length})</option>
            <option value="offline">Offline ({devices.filter((d) => d.status === "offline").length})</option>
            <option value="pending">Pendente ({devices.filter((d) => d.status === "pending").length})</option>
          </select>
        </label>

        <button
          type="button"
          className="secondary compact-btn"
          onClick={handleSelectAll}
          style={{ fontSize: "11px", padding: "8px 12px" }}
        >
          {selectedIds.length === filtered.length && filtered.length > 0 ? "Desmarcar Todos" : "Selecionar Todos"}
        </button>
      </div>

      <div className="device-table-wrapper">
        <div className="device-table-header">
          <span className="th-check">
            <input
              type="checkbox"
              checked={selectedIds.length === filtered.length && filtered.length > 0}
              onChange={handleSelectAll}
              title="Selecionar / desmarcar todos"
            />
          </span>
          <span>Aparelho</span>
          <span>Modelo</span>
          <span>Sistema</span>
          <span>Bateria</span>
          <span>Disponibilidade</span>
          <span>Sinal de Internet</span>
          <span>Velocidade</span>
          <span>Política</span>
          <span style={{ textAlign: "right" }}>Ações</span>
        </div>

        <div className="table">
          {filtered.map((device) => {
            const isSelected = selectedIds.includes(device.id);
            const isOnline = device.status === "online";
            const battColor = device.battery > 50 ? "#22c55e" : device.battery > 20 ? "#f59e0b" : "#ef4444";

            const netType = device.networkType || (isOnline ? "wifi" : "offline");
            const isWifi = netType === "wifi" || netType === "ethernet";
            const isCellular = netType === "4g" || netType === "5g" || netType === "3g";
            const netName = device.networkName || (isOnline ? (isWifi ? "Wi-Fi 5GHz" : "4G LTE") : "Sem Conexão");
            const signal = device.signalStrength ?? (isOnline ? 95 : 0);
            const speed = isOnline ? (device.networkSpeed || "86.4 Mbps") : "0 Mbps";
            const ping = device.pingMs ?? (isOnline ? 14 : null);

            return (
              <div className={`row device-row ${isSelected ? "selected-row" : ""}`} key={device.id}>
                <label className="check compact-check">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(event) =>
                      setSelectedIds((current) =>
                        event.target.checked ? [...current, device.id] : current.filter((id) => id !== device.id)
                      )
                    }
                  />
                </label>

                <div className="device-info-cell">
                  <strong className="device-name-title">{device.name}</strong>
                  <small className="device-meta-sub">
                    {device.id} · {new Date(device.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </small>
                </div>

                <span className="device-model-cell font-mono">{device.model}</span>
                <span className="device-os-cell">Android {device.androidVersion}</span>

                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Battery size={15} style={{ color: battColor }} />
                  <span style={{ color: battColor, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                    {device.battery}%
                  </span>
                </span>

                {/* DISPONIBILIDADE */}
                <div className="device-availability-col">
                  {isOnline ? (
                    <span className="badge-availability available" title="Dispositivo online e disponível para controle">
                      <span className="status-beacon online" />
                      <span>DISPONÍVEL</span>
                    </span>
                  ) : device.status === "pending" ? (
                    <span className="badge-availability pending" title="Conexão pendente">
                      <span className="status-beacon pending" />
                      <span>PENDENTE</span>
                    </span>
                  ) : (
                    <span className="badge-availability offline" title="Dispositivo offline / desconectado">
                      <span className="status-beacon offline" />
                      <span>OFFLINE</span>
                    </span>
                  )}
                </div>

                {/* SINAL DE INTERNET (Wi-Fi / 4G) */}
                <div className="device-net-col">
                  {!isOnline || netType === "offline" ? (
                    <div className="net-signal-cell offline">
                      <div className="net-signal-top">
                        <WifiOff size={14} className="net-icon offline" />
                        <span className="net-name">Sem Sinal</span>
                      </div>
                      <span className="net-offline-hint">Desconectado</span>
                    </div>
                  ) : (
                    <div className={`net-signal-cell ${isWifi ? "wifi" : "cellular"}`}>
                      <div className="net-signal-top">
                        {isWifi ? (
                          <Wifi size={14} className="net-icon wifi" />
                        ) : (
                          <Radio size={14} className="net-icon cellular" />
                        )}
                        <span className="net-name" title={netName}>
                          {netName}
                        </span>
                      </div>
                      <div className="net-signal-bars-row">
                        <div className="signal-bars-meter" title={`Intensidade de sinal: ${signal}%`}>
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

                {/* VELOCIDADE & PING */}
                <div className="device-speed-col">
                  <div className={`net-speed-cell ${!isOnline ? "offline" : ""}`}>
                    <div className="net-speed-val" title="Velocidade de transmissão / link">
                      <Activity size={13} className="speed-icon" />
                      <span className="speed-text">{speed}</span>
                    </div>
                    {isOnline && ping !== null ? (
                      <div className="net-ping-val" title="Latência / Ping">
                        <span className="ping-dot" />
                        <span className="ping-text">{ping} ms</span>
                      </div>
                    ) : (
                      <span className="ping-offline-text">-- ms</span>
                    )}
                  </div>
                </div>

                {/* POLÍTICA / CONSENTIMENTO */}
                <span className={`badge ${device.consentRequired ? "info" : "warning"}`}>
                  <ShieldCheck size={14} /> {device.consentRequired ? "Consentimento" : "Política Ativa"}
                </span>

                {/* AÇÕES */}
                <div className="row-actions" style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="primary compact-btn"
                    onClick={() => {
                      setSelectedDeviceId(device.id);
                      setView("Controle");
                    }}
                    title="Abrir centro de controle"
                  >
                    <SlidersHorizontal size={14} /> Controle
                  </button>
                  <button
                    type="button"
                    className="secondary compact-btn"
                    disabled={!isOnline}
                    onClick={() => void start(device.id)}
                    title="Iniciar sessão supervisionada"
                  >
                    <Play size={14} /> Sessão
                  </button>
                </div>
              </div>
            );
          })}

          {!filtered.length ? (
            <div className="empty-inline" style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
              Nenhum aparelho combina com os filtros atuais.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
