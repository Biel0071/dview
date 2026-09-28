import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Clock,
  Gauge,
  MessageSquare,
  MonitorSmartphone,
  MousePointer2,
  Play,
  RotateCw,
  Send,
  ShieldCheck,
  Smartphone,
  Square,
  Video,
  X,
  Zap
} from "lucide-react";
import { useAppStore } from "../store";
import { api } from "../api";

export function RemoteSession() {
  const { sessions, setSessions, devices, preferences, setView, setSelectedDeviceId } = useAppStore();
  const session = sessions[0];
  const device = devices.find((item) => item.id === session?.deviceId);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "operador" | "aparelho"; text: string; time: string }>>([
    { sender: "aparelho", text: "Agente DVIEW inicializado e conectado ao túnel seguro.", time: "10:00" },
    { sender: "operador", text: "Iniciando sessão de suporte supervisionado.", time: "10:01" }
  ]);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [selectedDeviceIdToStart, setSelectedDeviceIdToStart] = useState<string>(devices[0]?.id || "");
  const [frameTimestamp, setFrameTimestamp] = useState<number>(Date.now());

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleStartSession = async (devId: string) => {
    if (!devId) return;
    setIsStartingSession(true);
    try {
      const res = await api.startSession(devId);
      setSessions([res]);
      showToast(`Sessão remota inicializada com sucesso para ${device?.name || devId}.`);
    } catch {
      showToast("Falha ao iniciar sessão. Verifique a conectividade do dispositivo.");
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleEndSession = async () => {
    if (!session) return;
    if (confirm("Deseja realmente encerrar a sessão remota supervisionada?")) {
      setSessions([]);
      showToast("Sessão remota encerrada com sucesso.");
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const text = chatMessage.trim();
    setChatMessage("");

    const newEntry = {
      sender: "operador" as const,
      text,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };
    setChatHistory((prev) => [...prev, newEntry]);

    if (device) {
      try {
        await api.sendText(device.id, text);
        showToast(`Mensagem transmitida à tela do aparelho: "${text}"`);
      } catch {
        showToast("Mensagem registrada no log de atendimento.");
      }
    }
  };

  // If no session exists, render Dark-Ops Session Starter
  if (!session) {
    const onlineDevices = devices.filter((d) => d.status === "online");

    return (
      <section className="panel" style={{ maxWidth: "780px", margin: "20px auto" }}>
        {toastMsg && (
          <div className="control-toast-alert">
            <Zap size={14} style={{ color: "var(--crimson-neon)" }} />
            <span>{toastMsg}</span>
          </div>
        )}

        <div className="panel-heading">
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <MonitorSmartphone size={20} style={{ color: "var(--crimson-neon)" }} />
              Iniciar Sessão Remota Supervisionada
            </h2>
            <small>Estabeleça um canal criptografado AES-256 com consentimento auditado.</small>
          </div>
        </div>

        <div style={{ padding: "20px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
          {devices.length === 0 ? (
            <div className="dashboard-empty-state-box" style={{ margin: 0 }}>
              <Smartphone size={32} style={{ color: "#64748b" }} />
              <h3>Nenhum dispositivo disponível</h3>
              <p>Conecte um dispositivo físico ou emulador no painel para iniciar sessões.</p>
              <button
                type="button"
                className="primary"
                onClick={() => setView("Controle")}
                style={{ marginTop: "14px" }}
              >
                Abrir Painel de Controle
              </button>
            </div>
          ) : (
            <>
              <label>
                Selecione o Dispositivo Alvo
                <select
                  value={selectedDeviceIdToStart}
                  onChange={(e) => setSelectedDeviceIdToStart(e.target.value)}
                  style={{ marginTop: "6px" }}
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.model}) - {d.status === "online" ? "● Online" : "○ Offline"} - Bateria: {d.battery}%
                    </option>
                  ))}
                </select>
              </label>

              <div
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "14px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  fontSize: "12px"
                }}
              >
                <div>
                  <span style={{ color: "#94a3b8" }}>Canal de Criptografia:</span>
                  <div style={{ color: "#22c55e", fontWeight: 700 }}>AES-256-GCM Certificado</div>
                </div>
                <div>
                  <span style={{ color: "#94a3b8" }}>Transmissão Óptica:</span>
                  <div style={{ color: "#38bdf8", fontWeight: 700 }}>MediaProjection Nativa</div>
                </div>
                <div>
                  <span style={{ color: "#94a3b8" }}>Política de Consentimento:</span>
                  <div style={{ color: "#facc15", fontWeight: 700 }}>
                    {preferences.requireConsent ? "Aceite no Aparelho Exigido" : "Supervisão Contínua"}
                  </div>
                </div>
                <div>
                  <span style={{ color: "#94a3b8" }}>Qualidade de Vídeo:</span>
                  <div style={{ color: "#f8fafc", fontWeight: 700 }}>{preferences.sessionQuality.toUpperCase()}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="primary"
                  disabled={isStartingSession || !selectedDeviceIdToStart}
                  onClick={() => handleStartSession(selectedDeviceIdToStart)}
                  style={{ flex: 1, justifyContent: "center", padding: "12px", fontSize: "13px" }}
                >
                  <Play size={15} />
                  <span>{isStartingSession ? "Conectando ao Aparelho..." : "Iniciar Sessão Agora"}</span>
                </button>

                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    if (selectedDeviceIdToStart) setSelectedDeviceId(selectedDeviceIdToStart);
                    setView("Controle");
                  }}
                  style={{ padding: "0 18px" }}
                >
                  Abrir Controle Completo
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    );
  }

  // Active Session View
  return (
    <section className="remote-grid">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="control-toast-alert">
          <Zap size={14} style={{ color: "var(--crimson-neon)" }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Viewport Stage */}
      <div className="remote-stage">
        <div className="phone-frame" style={{ position: "relative", overflow: "hidden", minHeight: "460px" }}>
          {/* Top Status Banner */}
          <div className="phone-status" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
            <span>AO VIVO · {session.status.toUpperCase()}</span>
            <button
              type="button"
              onClick={() => setFrameTimestamp(Date.now())}
              style={{ background: "transparent", border: "none", color: "#38bdf8", cursor: "pointer", display: "flex", alignItems: "center" }}
              title="Atualizar quadro"
            >
              <RotateCw size={12} />
            </button>
          </div>

          {/* Real Screen Image Feed */}
          {device ? (
            <img
              src={`${api.getDeviceScreenUrl(device.id)}?t=${frameTimestamp}`}
              alt={`Tela de ${device.name}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                background: "#000000"
              }}
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", margin: "auto" }}>
              <Video size={42} style={{ color: "#38bdf8" }} />
              <strong>{session.deviceId}</strong>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                Código de consentimento: <code style={{ color: "#22c55e" }}>{session.consentCode}</code>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Tools Panel */}
      <aside className="panel tools" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div className="panel-heading" style={{ margin: 0, paddingBottom: "10px" }}>
          <div>
            <h2 style={{ fontSize: "16px", color: "#ffffff", margin: 0 }}>Sessão Supervisionada</h2>
            <small style={{ color: "#94a3b8" }}>{device?.name || session.deviceId}</small>
          </div>
          <span className={`badge ${session.status}`}>{session.status}</span>
        </div>

        <div className="session-summary" style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", background: "rgba(15, 23, 42, 0.6)", padding: "10px", borderRadius: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheck size={14} style={{ color: "#22c55e" }} />
            <span>Consentimento: <strong>{preferences.requireConsent ? "Obrigatório" : "Manual"}</strong></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Gauge size={14} style={{ color: "#38bdf8" }} />
            <span>Qualidade de Streaming: <strong>{preferences.sessionQuality}</strong></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={14} style={{ color: "#facc15" }} />
            <span>Indicador no Aparelho: <strong>{preferences.showDeviceIndicator ? "Ativo" : "Desativado"}</strong></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={14} style={{ color: "#94a3b8" }} />
            <span>Código de Aceite: <code style={{ color: "#22c55e" }}>{session.consentCode}</code></span>
          </div>
        </div>

        <button
          type="button"
          className="secondary"
          onClick={() => {
            if (device?.id) setSelectedDeviceId(device.id);
            setView("Controle");
            showToast("Alternando para o Centro de Controle com viewport duplo.");
          }}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
          title="Abrir o painel de controle com toque interativo e A11Y"
        >
          <MousePointer2 size={16} style={{ color: "#38bdf8" }} />
          <span>Controle Interativo & Toque</span>
        </button>

        <button
          type="button"
          className="secondary"
          onClick={() => setShowChatModal(true)}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
          title="Abrir mensagens com o usuário do dispositivo"
        >
          <MessageSquare size={16} style={{ color: "#22c55e" }} />
          <span>Chat de Atendimento</span>
        </button>

        <button
          type="button"
          className="danger"
          onClick={handleEndSession}
          style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "auto" }}
          title="Finalizar esta sessão de atendimento remoto"
        >
          <Square size={16} />
          <span>Encerrar Sessão</span>
        </button>

        <small style={{ color: "#64748b", fontSize: "11px", lineHeight: "1.4" }}>
          Criptografia ponta a ponta AES-256-GCM ativa com auditoria de conformidade em tempo real.
        </small>
      </aside>

      {/* CHAT MODAL */}
      {showChatModal && (
        <div className="app-config-modal-backdrop" onClick={() => setShowChatModal(false)}>
          <div className="app-config-modal-card" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="app-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MessageSquare size={18} style={{ color: "#22c55e" }} />
                <h3 style={{ margin: 0, fontSize: "16px", color: "#ffffff" }}>
                  Chat de Atendimento: {device?.name || session.deviceId}
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowChatModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ height: "240px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", padding: "10px 0" }}>
              {chatHistory.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: item.sender === "operador" ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    background: item.sender === "operador" ? "rgba(255, 26, 42, 0.15)" : "rgba(30, 41, 59, 0.6)",
                    border: item.sender === "operador" ? "1px solid rgba(255, 26, 42, 0.3)" : "1px solid #334155",
                    borderRadius: "8px",
                    padding: "8px 12px"
                  }}
                >
                  <div style={{ fontSize: "10px", color: "#94a3b8", display: "flex", justifyContent: "space-between", gap: "8px" }}>
                    <span>{item.sender === "operador" ? "Operador" : "Dispositivo"}</span>
                    <span>{item.time}</span>
                  </div>
                  <div style={{ fontSize: "12.5px", color: "#f8fafc", marginTop: "3px" }}>{item.text}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChatMessage} style={{ display: "flex", gap: "8px", paddingTop: "10px", borderTop: "1px solid #1e293b" }}>
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Digite a mensagem para exibir no celular..."
                style={{ flex: 1 }}
              />
              <button type="submit" className="primary" disabled={!chatMessage.trim()}>
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
