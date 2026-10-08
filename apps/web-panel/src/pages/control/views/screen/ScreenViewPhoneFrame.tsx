import React from "react";
import {
  Battery,
  RotateCw,
  Smartphone,
  Wifi,
  WifiOff,
  Zap
} from "lucide-react";
import type { ControlDevice } from "../../types";
import type { DeviceDisguiseConfig, DevicePushNotification, DigitalTouchEvent } from "@droidview/shared";
import { AppLogo } from "../../AppLogo";
import { DeviceDisguiseOverlay } from "../../DeviceDisguiseOverlay";
import type { QualityProfile, SyncedRipple } from "./types";

export interface DragState {
  active: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  pctStartX: number;
  pctStartY: number;
  pctCurrentX: number;
  pctCurrentY: number;
}

export interface ScreenViewPhoneFrameProps {
  viewportDimensions: {
    frameWidth: number;
    frameHeight: number;
    screenWidth: number;
    screenHeight: number;
  };
  device: ControlDevice;
  fps: number;
  adaptiveMode: "auto" | "manual";
  setAdaptiveMode: (m: "auto" | "manual") => void;
  currentProfile: QualityProfile;
  liveLatency: number;
  foregroundApp?: { name: string; packageName?: string } | null;
  deviceAspectRatio: number;
  screenWrapperRef: any;
  canvasRef: any;
  handleLivePointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  handleLivePointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  handleLivePointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  touchActive: boolean;
  activeDrag: DragState | null;
  imgRef: any;
  activeFrameSrc: string;
  activeDisguise?: DeviceDisguiseConfig | null;
  handleClearDisguise: () => void;
  activePushBanner: DevicePushNotification | null;
  setActivePushBanner: (v: DevicePushNotification | null) => void;
  syncedRipples: SyncedRipple[];
  showTouchHUD: boolean;
  activeTouchFeedback: DigitalTouchEvent | null;
  triggerImmediateFrame: () => void;
  refreshA11y: () => void;
  isStreaming: boolean;
  lastFrameSuccessTimeRef: React.MutableRefObject<number>;
  setScreenTimestamp: (ts: number) => void;
  handleMacroAction: (cmd: string, label: string) => void;
  showToast: (msg: string, type?: "info" | "success" | "warn") => void;
}

export const ScreenViewPhoneFrame: React.FC<ScreenViewPhoneFrameProps> = ({
  viewportDimensions,
  device,
  fps,
  adaptiveMode,
  setAdaptiveMode,
  currentProfile,
  liveLatency,
  foregroundApp,
  deviceAspectRatio,
  screenWrapperRef,
  canvasRef,
  handleLivePointerDown,
  handleLivePointerMove,
  handleLivePointerUp,
  touchActive,
  activeDrag,
  imgRef,
  activeFrameSrc,
  activeDisguise,
  handleClearDisguise,
  activePushBanner,
  setActivePushBanner,
  syncedRipples,
  showTouchHUD,
  activeTouchFeedback,
  triggerImmediateFrame,
  refreshA11y,
  isStreaming,
  lastFrameSuccessTimeRef,
  setScreenTimestamp,
  handleMacroAction,
  showToast
}) => {
  return (
    <div
      className="tactical-phone-viewport live-device-frame"
      style={{
        width: `${viewportDimensions.frameWidth}px`,
        height: `${viewportDimensions.frameHeight}px`,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        flexShrink: 0
      }}
    >
      {/* Top Smartphone Status Bar & Notch */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 14px",
          background: "#080a10",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          zIndex: 10,
          fontSize: "11px",
          color: "#cbd5e1",
          fontFamily: "var(--font-mono)",
          height: "28px",
          minHeight: "28px",
          boxSizing: "border-box",
          flexShrink: 0
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {device.status === "offline" ? (
            <span style={{ fontWeight: 700, color: "#ef4444", display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#ef4444" }} />
              OFFLINE
            </span>
          ) : (
            <>
              <span style={{ fontWeight: 700, color: "#22c55e", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e" }} />
                {fps} FPS
              </span>
              <button
                type="button"
                onClick={() => {
                  if (adaptiveMode === "auto") {
                    setAdaptiveMode("manual");
                    showToast(`Modo Manual fixado em ${currentProfile.shortLabel}`, "info");
                  } else {
                    setAdaptiveMode("auto");
                    showToast("Modo Adaptativo (ABR) ativado: Qualidade se ajusta dinamicamente!", "success");
                  }
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  background: currentProfile.badgeBg,
                  border: `1px solid ${currentProfile.color}77`,
                  borderRadius: "8px",
                  padding: "1px 5px",
                  color: currentProfile.color,
                  fontSize: "9.5px",
                  fontWeight: 800,
                  fontFamily: "var(--font-mono)",
                  cursor: "pointer",
                  outline: "none",
                  boxShadow: adaptiveMode === "auto" ? `0 0 8px ${currentProfile.color}33` : "none"
                }}
                title={`Stream: ${currentProfile.label} (${currentProfile.resolution}) • Latência: ${liveLatency}ms • Modo: ${adaptiveMode === "auto" ? "Adaptativo Automático (ABR)" : "Fixo Manual"} (Clique para alternar)`}
              >
                <Zap size={9} style={{ color: currentProfile.color }} />
                <span>{currentProfile.shortLabel}</span>
              </button>
            </>
          )}
          {device.status !== "offline" && foregroundApp && (
            <span style={{ color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10.5px" }}>
              · <AppLogo name={foregroundApp.name} packageName={foregroundApp.packageName} size={13} />
              <span style={{ maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {foregroundApp.name}
              </span>
            </span>
          )}
        </div>

        {/* Minimalist Phone Speaker / Camera Notch */}
        <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "#1e293b" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10.5px" }}>
          {device.status === "offline" ? (
            <span style={{ color: "#ef4444", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: 700 }}>
              <WifiOff size={11} style={{ color: "#ef4444" }} /> Desconectado
            </span>
          ) : (
            <>
              {device.networkType === "4g" || device.networkType === "5g" || device.networkType === "3g" ? (
                <span style={{ color: "#fbbf24", fontWeight: 800, fontSize: "9.5px", fontFamily: "var(--font-mono)" }}>4G</span>
              ) : (
                <Wifi size={11} style={{ color: "#38bdf8" }} />
              )}
              <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                <span>{device.battery ?? 100}%</span>
                <Battery size={11} style={{ color: "#22c55e" }} />
              </span>
            </>
          )}
        </div>
      </div>

      {/* Real Screen Image Container */}
      <div
        ref={screenWrapperRef}
        className="real-screen-container"
        style={{
          position: "relative",
          width: `${viewportDimensions.screenWidth}px`,
          height: `${viewportDimensions.screenHeight}px`,
          aspectRatio: `${deviceAspectRatio}`,
          background: "#000000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          boxSizing: "border-box"
        }}
      >
        {/* Canvas de Transmissão em Tempo Real com Suporte a Deslize com Dedo / Mouse */}
        <canvas
          ref={canvasRef}
          width={720}
          height={1280}
          onPointerDown={handleLivePointerDown}
          onPointerMove={handleLivePointerMove}
          onPointerUp={handleLivePointerUp}
          onPointerCancel={handleLivePointerUp}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            cursor: touchActive ? (activeDrag?.active ? "grabbing" : "grab") : "default",
            userSelect: "none",
            WebkitUserSelect: "none",
            display: "block",
            imageRendering: "auto",
            touchAction: "none"
          }}
        />

        {/* Active Finger Touch Pointer & Gesture Trail (Live Viewport) */}
        {activeDrag?.active && (
          <>
            <div
              style={{
                position: "absolute",
                left: `${activeDrag.pctCurrentX}%`,
                top: `${activeDrag.pctCurrentY}%`,
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(56, 189, 248, 0.8) 0%, rgba(56, 189, 248, 0.25) 60%, transparent 75%)",
                border: "2px solid #38bdf8",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                zIndex: 100,
                boxShadow: "0 0 16px rgba(56, 189, 248, 0.6)"
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 0 8px #ffffff"
                }}
              />
            </div>

            {Math.hypot(activeDrag.currentX - activeDrag.startX, activeDrag.currentY - activeDrag.startY) > 10 && (
              <svg
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                  zIndex: 99
                }}
              >
                <line
                  x1={`${activeDrag.pctStartX}%`}
                  y1={`${activeDrag.pctStartY}%`}
                  x2={`${activeDrag.pctCurrentX}%`}
                  y2={`${activeDrag.pctCurrentY}%`}
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                  filter="drop-shadow(0 0 6px #38bdf8)"
                />
                <circle
                  cx={`${activeDrag.pctStartX}%`}
                  cy={`${activeDrag.pctStartY}%`}
                  r="5"
                  fill="#22c55e"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              </svg>
            )}
          </>
        )}
        <img
          ref={imgRef}
          src={activeFrameSrc}
          alt=""
          style={{ display: "none" }}
          aria-hidden="true"
        />

        {/* Device Disguise Overlay (Tela Preta, Atualizando Android, Bateria, Imagem) */}
        {activeDisguise?.active && (
          <DeviceDisguiseOverlay
            disguise={activeDisguise}
            batteryLevel={device.battery}
            onDismiss={handleClearDisguise}
            showDismissButton={true}
          />
        )}

        {/* Animated Heads-Up Push Notification Banner (Notificação Push Dinâmica) */}
        {activePushBanner && (
          <div
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              right: "8px",
              background: "rgba(11, 15, 25, 0.96)",
              border: "1px solid rgba(245, 158, 11, 0.6)",
              borderRadius: "12px",
              boxShadow: "0 12px 28px rgba(0, 0, 0, 0.85), 0 0 16px rgba(245, 158, 11, 0.25)",
              backdropFilter: "blur(14px)",
              padding: "9px 11px",
              zIndex: 105,
              display: "flex",
              alignItems: "flex-start",
              gap: "9px",
              cursor: "pointer"
            }}
            onClick={() => setActivePushBanner(null)}
            title="Notificação Push Ativa no Celular (Toque para fechar)"
          >
            <div style={{ flexShrink: 0, marginTop: "2px" }}>
              <AppLogo name={activePushBanner.appName} packageName={activePushBanner.packageName} size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1px" }}>
                <span style={{ fontSize: "9px", fontWeight: 800, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  {activePushBanner.appName} • agora
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePushBanner(null);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "0 2px",
                    fontSize: "10px"
                  }}
                  title="Fechar banner"
                >
                  ✕
                </button>
              </div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#ffffff", marginBottom: "2px", lineHeight: 1.25 }}>
                {activePushBanner.title}
              </div>
              <div style={{ fontSize: "10px", color: "#cbd5e1", lineHeight: 1.35, wordBreak: "break-word" }}>
                {activePushBanner.message}
              </div>
            </div>
          </div>
        )}

        {/* Synced Touch Feedback Ripples */}
        {syncedRipples.map((r) => (
          <span
            key={r.id}
            style={{
              position: "absolute",
              left: `${r.pctX}%`,
              top: `${r.pctY}%`,
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              backgroundColor: r.source === "skeleton" ? "rgba(56, 189, 248, 0.45)" : "rgba(34, 197, 94, 0.45)",
              border: `2px solid ${r.source === "skeleton" ? "#38bdf8" : "#22c55e"}`,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              boxShadow: `0 0 16px ${r.source === "skeleton" ? "#38bdf8" : "#22c55e"}`,
              zIndex: 99
            }}
          />
        ))}

        {/* Tactical Digital Touch HUD Banner */}
        {touchActive && showTouchHUD && activeTouchFeedback && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(6, 7, 10, 0.9)",
              border: "1px solid rgba(34, 197, 94, 0.45)",
              borderRadius: "20px",
              padding: "4px 12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              color: "#cbd5e1",
              backdropFilter: "blur(6px)",
              zIndex: 10,
              boxShadow: "0 4px 14px rgba(0,0,0,0.6)",
              pointerEvents: "none"
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: activeTouchFeedback.source === "remote_simulation" ? "#38bdf8" : "#22c55e",
                boxShadow: `0 0 6px ${activeTouchFeedback.source === "remote_simulation" ? "#38bdf8" : "#22c55e"}`
              }}
            />
            <span style={{ fontWeight: 800, color: activeTouchFeedback.source === "remote_simulation" ? "#38bdf8" : "#22c55e" }}>
              {activeTouchFeedback.source === "remote_simulation" ? "TOQUE SIMULADO" : "TOQUE DETECTADO"}
            </span>
            <span style={{ color: "#94a3b8" }}>
              ({Math.round(activeTouchFeedback.x)}, {Math.round(activeTouchFeedback.y)})
              {activeTouchFeedback.viewText ? ` • "${activeTouchFeedback.viewText}"` : ""}
            </span>
          </div>
        )}

        {/* Tactical Device Offline Overlay */}
        {device.status === "offline" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle at center, rgba(15, 23, 42, 0.97) 0%, rgba(6, 7, 10, 0.99) 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              textAlign: "center",
              zIndex: 85,
              backdropFilter: "blur(8px)"
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.12)",
                border: "2px solid rgba(239, 68, 68, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
                boxShadow: "0 0 20px rgba(239, 68, 68, 0.25)"
              }}
            >
              <WifiOff size={28} style={{ color: "#ef4444" }} />
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                padding: "3px 10px",
                borderRadius: "20px",
                marginBottom: "10px"
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444" }} />
              <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#f87171", letterSpacing: "0.8px" }}>
                APARELHO OFFLINE
              </span>
            </div>

            <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#f8fafc", margin: "0 0 6px 0" }}>
              {device.name || "Aparelho Desconectado"}
            </h4>

            <p style={{ fontSize: "11.5px", color: "#94a3b8", lineHeight: 1.5, margin: "0 0 16px 0", maxWidth: "250px" }}>
              O dispositivo não está transmitindo ou o agente foi pausado. A transmissão retornará assim que o aparelho conectar.
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                background: "rgba(15, 23, 42, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "8px",
                padding: "10px 14px",
                width: "100%",
                maxWidth: "250px",
                fontSize: "11px",
                color: "#cbd5e1",
                textAlign: "left",
                marginBottom: "16px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Status Real:</span>
                <span style={{ color: "#ef4444", fontWeight: 700 }}>● Desconectado</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Identificador:</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "#94a3b8" }}>{device.id.slice(0, 16)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Streaming:</span>
                <span style={{ color: "#f59e0b", fontWeight: 600 }}>Pausado (0 FPS)</span>
              </div>
            </div>

            <button
              type="button"
              className="primary compact-btn"
              onClick={() => {
                triggerImmediateFrame();
                refreshA11y();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                fontSize: "11.5px",
                fontWeight: 700,
                borderRadius: "8px",
                background: "linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.35) 100%)",
                border: "1px solid rgba(239, 68, 68, 0.5)",
                color: "#fca5a5",
                cursor: "pointer"
              }}
            >
              <RotateCw size={12} />
              <span>Verificar Conexão</span>
            </button>
          </div>
        )}

        {/* Stream Disconnect Overlay */}
        {!isStreaming && Date.now() - lastFrameSuccessTimeRef.current > 4000 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(9, 10, 15, 0.85)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              padding: "20px",
              textAlign: "center"
            }}
          >
            <Smartphone size={36} style={{ color: "#f59e0b" }} />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>
              Aguardando Próximo Quadro...
            </span>
            <button
              type="button"
              className="primary compact-btn"
              onClick={() => setScreenTimestamp(Date.now())}
              style={{ fontSize: "11px" }}
            >
              Reconectar Frame
            </button>
          </div>
        )}
      </div>

      {/* BARRA DE NAVEGAÇÃO ANDROID VIRTUAL NATIVA (RECENTES, INICIAR, VOLTAR) */}
      <div className="android-hardware-navbar">
        <button
          type="button"
          className="android-nav-btn"
          onClick={() => handleMacroAction("input keyevent 187", "Trocar Telas / Recentes")}
          title="Trocar de Telas / Aplicativos Recentes (KEYCODE_APP_SWITCH 187)"
        >
          <span className="nav-btn-icon">|||</span>
          <span className="nav-btn-text">RECENTES</span>
        </button>

        <button
          type="button"
          className="android-nav-btn"
          onClick={() => handleMacroAction("input keyevent 3", "Iniciar / Home")}
          title="Tela Inicial / Iniciar (KEYCODE_HOME 3)"
        >
          <span className="nav-btn-icon">○</span>
          <span className="nav-btn-text">INICIAR</span>
        </button>

        <button
          type="button"
          className="android-nav-btn"
          onClick={() => handleMacroAction("input keyevent 4", "Voltar")}
          title="Voltar Tela Anterior (KEYCODE_BACK 4)"
        >
          <span className="nav-btn-icon">◁</span>
          <span className="nav-btn-text">VOLTAR</span>
        </button>
      </div>
    </div>
  );
};
