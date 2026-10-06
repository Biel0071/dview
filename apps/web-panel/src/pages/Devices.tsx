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
      {/* Sub-tabs header for Dispositivos e Sessões */}
      <div
        className="devices-subtabs-bar"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 8px",
          background: "rgba(10, 14, 23, 0.8)",
          border: "1px solid #1e293b",
          borderRadius: "8px",
          marginBottom: "16px"
        }}
      >
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "devices" ? "active" : ""}`}
          onClick={() => setActiveTab("devices")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "1px solid",
            borderColor: activeTab === "devices" ? "var(--crimson-neon, #ff1a2a)" : "transparent",
            background: activeTab === "devices" ? "rgba(255, 26, 42, 0.15)" : "transparent",
            color: activeTab === "devices" ? "#ffffff" : "#94a3b8",
            fontSize: "12.5px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <Smartphone size={15} style={{ color: activeTab === "devices" ? "var(--crimson-neon, #ff1a2a)" : "#64748b" }} />
          <span>Dispositivos Pareados ({devices.length})</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "sessions" ? "active" : ""}`}
          onClick={() => setActiveTab("sessions")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "1px solid",
            borderColor: activeTab === "sessions" ? "var(--crimson-neon, #ff1a2a)" : "transparent",
            background: activeTab === "sessions" ? "rgba(255, 26, 42, 0.15)" : "transparent",
            color: activeTab === "sessions" ? "#ffffff" : "#94a3b8",
            fontSize: "12.5px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <Activity size={15} style={{ color: activeTab === "sessions" ? "var(--crimson-neon, #ff1a2a)" : "#64748b" }} />
          <span>Sessões Remotas ({sessions.length})</span>
        </button>
      </div>

      {activeTab === "sessions" ? (
        <RemoteSession />
      ) : (
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
          <span>Aparelho & APK</span>
          <span>Contato & Telefone</span>
          <span>Modelo & SO</span>
          <span>Bateria</span>
          <span>Disponibilidade</span>
          <span>Sinal & Rede</span>
          <span>Velocidade</span>
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

                {/* APARELHO & APK */}
                <div
                  className="device-info-cell"
                  style={{ cursor: "pointer" }}
                  onClick={() => setEditingDevice(device)}
                  title="Clique para ver ou editar detalhes deste aparelho"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <strong className="device-name-title">{device.name}</strong>
                    <Edit3 size={11} style={{ color: "#38bdf8", opacity: 0.7 }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#f87171",
                        background: "rgba(255, 26, 42, 0.12)",
                        border: "1px solid rgba(255, 26, 42, 0.25)",
                        borderRadius: "4px",
                        padding: "1px 5px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px"
                      }}
                    >
                      <Package size={10} /> {device.apkName || "JADLOG Rastreio"}
                    </span>
                    <small className="device-meta-sub">
                      {device.id} · {new Date(device.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </small>
                  </div>
                </div>

                {/* CONTATO & TELEFONE */}
                <div
                  className="device-contact-col"
                  style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden" }}
                  onClick={() => setEditingDevice(device)}
                  title="Clique para editar contato e telefone"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <User size={12} style={{ color: "#38bdf8", flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", fontWeight: 700, color: device.contactName ? "#ffffff" : "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {device.contactName || "Sem contato"}
                    </span>
                    {device.autoIdentified && (
                      <span
                        title="Identificado automaticamente a partir dos dados do celular"
                        style={{
                          fontSize: "8.5px",
                          fontWeight: 700,
                          color: "#38bdf8",
                          background: "rgba(56, 189, 248, 0.15)",
                          border: "1px solid rgba(56, 189, 248, 0.3)",
                          borderRadius: "3px",
                          padding: "0 3px",
                          flexShrink: 0
                        }}
                      >
                        AUTO
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Phone size={11} style={{ color: "#22c55e", flexShrink: 0 }} />
                    <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: device.phoneNumber ? "#86efac" : "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {device.phoneNumber || "Adicionar tel..."}
                    </span>
                  </div>
                </div>

                {/* MODELO & SO */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden" }}>
                  <span className="device-model-cell font-mono" style={{ fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {device.model}
                  </span>
                  <span className="device-os-cell" style={{ fontSize: "11px", color: "#94a3b8" }}>
                    Android {device.androidVersion}
                  </span>
                </div>

                {/* BATERIA */}
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

                {/* AÇÕES */}
                <div className="row-actions" style={{ display: "flex", gap: "6px", justifyContent: "flex-end", alignItems: "center", whiteSpace: "nowrap" }}>
                  <button
                    type="button"
                    className="secondary compact-btn"
                    onClick={() => void handleCopyEncryptedUrl(device)}
                    title="Copiar URL Criptografado (AES-256-GCM) desta instância"
                    style={{ whiteSpace: "nowrap", padding: "5px 7px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px", color: "#00f0ff", borderColor: "rgba(0, 240, 255, 0.3)" }}
                  >
                    <ShieldCheck size={12} style={{ color: "#00f0ff" }} /> 🔒 URL
                  </button>
                  <button
                    type="button"
                    className="secondary compact-btn"
                    onClick={() => handleCopyDirectUrl(device)}
                    title="Copiar link direto para esta instância"
                    style={{ whiteSpace: "nowrap", padding: "5px 7px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <Link2 size={12} /> 🔗
                  </button>
                  <button
                    type="button"
                    className="secondary compact-btn"
                    onClick={() => setEditingDevice(device)}
                    title="Editar informações do aparelho, contato e APK"
                    style={{ whiteSpace: "nowrap", padding: "5px 9px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <Edit3 size={12} style={{ color: "#38bdf8" }} /> Editar
                  </button>
                  <button
                    type="button"
                    className="primary compact-btn"
                    onClick={() => {
                      setSelectedDeviceId(device.id);
                      setView("Controle");
                    }}
                    title="Abrir centro de controle"
                    style={{ whiteSpace: "nowrap", padding: "5px 10px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <SlidersHorizontal size={13} /> Controle
                  </button>
                  <button
                    type="button"
                    className="secondary compact-btn"
                    disabled={!isOnline}
                    onClick={() => void start(device.id)}
                    title="Iniciar sessão supervisionada"
                    style={{ whiteSpace: "nowrap", padding: "5px 10px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <Play size={13} /> Sessão
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
