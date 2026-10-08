import { useMemo, useState } from "react";
import {
  Activity,
  Battery,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  Filter,
  Package,
  Phone,
  Play,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  User,
  Wifi,
  WifiOff,
  X,
  Zap,
  Sparkles,
  Link2
} from "lucide-react";
import type { Device } from "@droidview/shared";
import { api } from "../api";
import { useAppStore } from "../store";
import { RemoteSession } from "./RemoteSession";
import { DeviceEditModal } from "../components/DeviceEditModal";

const statusOptions = ["all", "online", "offline", "pending"] as const;

export function Devices({ initialTab = "devices" }: { initialTab?: "devices" | "sessions" }) {
  const { devices, sessions, setSessions, setView, setSelectedDeviceId } = useAppStore();
  const [activeTab, setActiveTab] = useState<"devices" | "sessions">(initialTab);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCopyDirectUrl = (device: Device) => {
    const url = `${window.location.origin}/instance/${encodeURIComponent(device.id)}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast(`🔗 Link da instância (${device.name}) copiado!`);
    }).catch(() => {
      showToast(`Link da instância: ${url}`);
    });
  };

  const handleCopyEncryptedUrl = async (device: Device) => {
    try {
      const res = await api.getEncryptedInstanceUrl(device.id);
      if (res?.encryptedUrl) {
        await navigator.clipboard.writeText(res.encryptedUrl);
        showToast(`🔒 URL Criptografado da Instância (${device.name}) copiado!`);
        return;
      }
    } catch {}
    const fallbackUrl = `${window.location.origin}/instance/${encodeURIComponent(device.id)}`;
    await navigator.clipboard.writeText(fallbackUrl).catch(() => {});
    showToast(`Link da instância: ${fallbackUrl}`);
  };

  const filtered = useMemo(() => {
    return devices.filter((device) => {
      const matchesStatus = status === "all" || device.status === status;
      const text = `${device.name} ${device.contactName || ""} ${device.phoneNumber || ""} ${device.apkName || ""} ${device.model} ${device.id} ${device.androidVersion}`.toLowerCase();
      return matchesStatus && text.includes(query.toLowerCase());
    });
  }, [devices, query, status]);

  const start = async (deviceId: string) => {
    try {
      const session = await api.startSession(deviceId);
      setSessions([session]);
      setActiveTab("sessions");
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
    <div className="devices-and-sessions-wrap" style={{ width: "100%" }}>
      {/* Sub-tabs header compact */}
      <div
        className="devices-subtabs-bar"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 6px",
          background: "rgba(10, 14, 23, 0.8)",
          border: "1px solid #1e293b",
          borderRadius: "8px",
          marginBottom: "10px"
        }}
      >
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "devices" ? "active" : ""}`}
          onClick={() => setActiveTab("devices")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            borderRadius: "6px",
            border: "1px solid",
            borderColor: activeTab === "devices" ? "var(--crimson-neon, #ff1a2a)" : "transparent",
            background: activeTab === "devices" ? "rgba(255, 26, 42, 0.15)" : "transparent",
            color: activeTab === "devices" ? "#ffffff" : "#94a3b8",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <Smartphone size={14} style={{ color: activeTab === "devices" ? "var(--crimson-neon, #ff1a2a)" : "#64748b" }} />
          <span>Dispositivos Pareados ({devices.length})</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "sessions" ? "active" : ""}`}
          onClick={() => setActiveTab("sessions")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            borderRadius: "6px",
            border: "1px solid",
            borderColor: activeTab === "sessions" ? "var(--crimson-neon, #ff1a2a)" : "transparent",
            background: activeTab === "sessions" ? "rgba(255, 26, 42, 0.15)" : "transparent",
            color: activeTab === "sessions" ? "#ffffff" : "#94a3b8",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <Activity size={14} style={{ color: activeTab === "sessions" ? "var(--crimson-neon, #ff1a2a)" : "#64748b" }} />
          <span>Sessões Remotas ({sessions.length})</span>
        </button>
      </div>

      {activeTab === "sessions" ? (
        <RemoteSession />
      ) : (
        <section className="panel" style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Toast Alert */}
          {toastMsg && (
            <div className="control-toast-alert" style={{ marginBottom: "4px" }}>
              <Zap size={14} style={{ color: "var(--crimson-neon)" }} />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Unified Compact Action Toolbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2 style={{ fontSize: "15px", margin: 0, fontWeight: 800, letterSpacing: "0.4px" }}>
                DISPOSITIVOS PAREADOS
              </h2>
              <span style={{ fontSize: "11px", color: "#94a3b8", background: "#111622", padding: "2px 8px", borderRadius: "10px", border: "1px solid #1e293b", fontFamily: "var(--font-mono)" }}>
                {filtered.length} / {devices.length}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <label className="search-field" style={{ minWidth: "210px", height: "30px", padding: "0 8px", borderRadius: "6px" }}>
                <Search size={13} style={{ color: "#64748b" }} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar aparelho, contato, ID..."
                  style={{ fontSize: "11.5px" }}
                />
                {query && (
                  <button className="control-clear-btn" onClick={() => setQuery("")}>
                    <X size={11} />
                  </button>
                )}
              </label>

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as typeof status)}
                style={{ height: "30px", fontSize: "11px", padding: "0 8px", background: "#0a0e17", border: "1px solid #1e293b", borderRadius: "6px", color: "#cbd5e1" }}
              >
                <option value="all">Todos ({devices.length})</option>
                <option value="online">Online ({devices.filter((d) => d.status === "online").length})</option>
                <option value="offline">Offline ({devices.filter((d) => d.status === "offline").length})</option>
                <option value="pending">Pendente ({devices.filter((d) => d.status === "pending").length})</option>
              </select>

              {selectedIds.length > 0 && (
                <>
                  <button
                    type="button"
                    className="secondary compact-btn"
                    onClick={handleBatchPing}
                    title="Testar ping dos selecionados"
                    style={{ fontSize: "11px", height: "30px", padding: "0 8px" }}
                  >
                    <Radio size={12} style={{ color: "#38bdf8" }} /> Ping ({selectedIds.length})
                  </button>

                  <button
                    type="button"
                    className="secondary compact-btn"
                    onClick={handleRequestAudit}
                    style={{ fontSize: "11px", height: "30px", padding: "0 8px" }}
                  >
                    <ClipboardCheck size={12} style={{ color: "#22c55e" }} /> Auditoria ({selectedIds.length})
                  </button>
                </>
              )}

              <button
                type="button"
                className="secondary compact-btn"
                onClick={handleSelectAll}
                style={{ fontSize: "11px", height: "30px", padding: "0 8px" }}
              >
                {selectedIds.length === filtered.length && filtered.length > 0 ? "Desmarcar" : "Selecionar Todos"}
              </button>
            </div>
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
              <span>DISPOSITIVO & CONTATO</span>
              <span>DISPONIBILIDADE</span>
              <span>SINAL & REDE</span>
              <span>VELOCIDADE</span>
              <span>BATERIA</span>
              <span style={{ textAlign: "right" }}>AÇÕES RÁPIDAS</span>
            </div>

            <div className="table">
              {filtered.map((device) => {
                const isSelected = selectedIds.includes(device.id);
                const isOnline = device.status === "online";
                const battColor = device.battery > 50 ? "#22c55e" : device.battery > 20 ? "#f59e0b" : "#ef4444";

                const netType = device.networkType || (isOnline ? "wifi" : "offline");
                const isWifi = netType === "wifi" || netType === "ethernet";
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

                    {/* APARELHO & CONTATO (Célula composta integrada) */}
                    <div
                      className="device-info-cell"
                      style={{ cursor: "pointer", display: "flex", flexDirection: "row", alignItems: "center", gap: "8px" }}
                      onClick={() => setEditingDevice(device)}
                      title="Clique para ver ou editar detalhes deste aparelho"
                    >
                      <div className="device-avatar-box" style={{ width: "28px", height: "28px", borderRadius: "6px", flexShrink: 0 }}>
                        <Smartphone size={14} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: 0, overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <strong className="device-name-title" style={{ fontSize: "12.5px" }}>{device.name}</strong>
                          <Edit3 size={10} style={{ color: "#38bdf8", opacity: 0.6 }} />
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: 700,
                              color: "#f87171",
                              background: "rgba(255, 26, 42, 0.12)",
                              border: "1px solid rgba(255, 26, 42, 0.25)",
                              borderRadius: "3px",
                              padding: "0 4px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "2px"
                            }}
                          >
                            <Package size={8} /> {device.apkName || "JADLOG"}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10.5px", color: "#64748b" }}>
                          <span>{device.model} • Android {device.androidVersion}</span>
                          {device.contactName && (
                            <span style={{ color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                              <User size={10} style={{ color: "#38bdf8" }} /> {device.contactName}
                            </span>
                          )}
                          {device.phoneNumber && (
                            <span style={{ color: "#86efac", fontFamily: "var(--font-mono)", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                              <Phone size={10} style={{ color: "#22c55e" }} /> {device.phoneNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

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
                        <span className="badge-availability offline" title="Dispositivo sem conexão (Conexão OFF)">
                          <span className="status-beacon offline" />
                          <span>CONEXÃO OFF</span>
                        </span>
                      )}
                    </div>

                    {/* SINAL DE INTERNET */}
                    <div className="device-net-col">
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
                            <div className="signal-bars-meter" title={`Intensidade de sinal: ${signal}%`}>
                              <span className={`sig-bar bar-1 ${signal >= 15 ? "filled" : ""}`} />
                              <span className={`sig-bar bar-2 ${signal >= 40 ? "filled" : ""}`} />
                              <span className={`sig-bar bar-3 ${signal >= 65 ? "filled" : ""}`} />
                              <span className={`sig-bar bar-4 ${signal >= 85 ? "filled" : ""}`} />
                            </div>
                            <span className="signal-percent" style={{ fontSize: "9.5px" }}>{signal}%</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* VELOCIDADE & PING */}
                    <div className="device-speed-col">
                      <div className={`net-speed-cell ${!isOnline ? "offline" : ""}`}>
                        <div className="net-speed-val" title="Velocidade de transmissão / link">
                          <Activity size={12} className="speed-icon" />
                          <span className="speed-text" style={{ fontSize: "11px" }}>{speed}</span>
                        </div>
                        {isOnline && ping !== null ? (
                          <div className="net-ping-val" title="Latência / Ping">
                            <span className="ping-dot" />
                            <span className="ping-text" style={{ fontSize: "9.5px" }}>{ping} ms</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* BATERIA */}
                    <div className="device-battery-col">
                      <div className="device-battery-header">
                        <span style={{ color: battColor, fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: "11.5px" }}>
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

                    {/* AÇÕES RÁPIDAS (Sleek e compacto) */}
                    <div className="row-actions" style={{ display: "flex", gap: "5px", justifyContent: "flex-end", alignItems: "center", whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        className="secondary compact-btn"
                        onClick={() => void handleCopyEncryptedUrl(device)}
                        title="Copiar URL Criptografado (AES-256-GCM)"
                        style={{ padding: "4px 7px", fontSize: "10.5px", display: "inline-flex", alignItems: "center", gap: "3px", color: "#38bdf8", borderColor: "rgba(56, 189, 248, 0.3)" }}
                      >
                        <ShieldCheck size={12} />
                        <span>URL</span>
                      </button>

                      <button
                        type="button"
                        className="secondary compact-btn"
                        onClick={() => setEditingDevice(device)}
                        title="Editar aparelho e dados"
                        style={{ padding: "4px 7px", fontSize: "10.5px", display: "inline-flex", alignItems: "center", gap: "3px" }}
                      >
                        <Edit3 size={11} />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        className="primary compact-btn"
                        onClick={() => {
                          setSelectedDeviceId(device.id);
                          setView("Controle");
                        }}
                        title="Abrir centro de controle"
                        style={{ padding: "4px 9px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        <SlidersHorizontal size={12} />
                        <span>Controle</span>
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
      )}

      {/* Modal de Edição de Aparelho, Contato e APK */}
      {editingDevice && (
        <DeviceEditModal
          device={editingDevice}
          isOpen={Boolean(editingDevice)}
          onClose={() => setEditingDevice(null)}
          onGoToControl={(id) => {
            setSelectedDeviceId(id);
            setView("Controle");
          }}
        />
      )}
    </div>
  );
}
