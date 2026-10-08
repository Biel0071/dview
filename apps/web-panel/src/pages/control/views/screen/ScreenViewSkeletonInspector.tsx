import React from "react";
import {
  Battery,
  ChevronLeft,
  Crosshair,
  Eye,
  Layers,
  Moon,
  MousePointer,
  RotateCw,
  Search,
  Smartphone,
  Terminal,
  Wifi,
  X,
  Zap
} from "lucide-react";
import type { ControlDevice } from "../../types";
import type { DeviceDisguiseConfig, DevicePushNotification } from "@droidview/shared";
import { AppLogo } from "../../AppLogo";
import {
  AccessibilityNode,
  ActiveDragGesture,
  DetectedAppInfo,
  detectAppFromNode,
  parseBounds,
  sanitizeA11yText,
  SyncedRipple
} from "./types";

export interface ScreenViewSkeletonInspectorProps {
  viewportDimensions: {
    frameWidth: number;
    frameHeight: number;
    screenWidth: number;
    screenHeight: number;
  };
  deviceAspectRatio: number;
  device: ControlDevice;
  resolvedActiveApp: DetectedAppInfo;
  skeletonViewMode: "visual" | "list";
  setSkeletonViewMode: (mode: "visual" | "list") => void;
  skeletonViewportRef: any;
  touchActive: boolean;
  activeDrag: ActiveDragGesture | null;
  handleSkeletonPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  handleSkeletonPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  handleSkeletonPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  syncedRipples: SyncedRipple[];
  activeDisguise?: DeviceDisguiseConfig | null;
  skeletonXRayMode: boolean;
  setSkeletonXRayMode: React.Dispatch<React.SetStateAction<boolean>>;
  activePushBanner: DevicePushNotification | null;
  a11yNodes: AccessibilityNode[];
  inspectedNode: AccessibilityNode | null;
  setInspectedNode: React.Dispatch<React.SetStateAction<AccessibilityNode | null>>;
  handleSelectA11yNode: (node: AccessibilityNode, e?: React.MouseEvent) => void;
  refreshA11y: () => void;
  isLoadingA11y: boolean;
  handleMacroAction: (cmd: string, label: string) => void;
}

export const ScreenViewSkeletonInspector: React.FC<ScreenViewSkeletonInspectorProps> = ({
  viewportDimensions,
  deviceAspectRatio,
  device,
  resolvedActiveApp,
  skeletonViewMode,
  setSkeletonViewMode,
  skeletonViewportRef,
  touchActive,
  activeDrag,
  handleSkeletonPointerDown,
  handleSkeletonPointerMove,
  handleSkeletonPointerUp,
  syncedRipples,
  activeDisguise,
  skeletonXRayMode,
  setSkeletonXRayMode,
  activePushBanner,
  a11yNodes,
  inspectedNode,
  setInspectedNode,
  handleSelectA11yNode,
  refreshA11y,
  isLoadingA11y,
  handleMacroAction
}) => {
  return (
    <div
      className="tactical-phone-viewport screen-reader-frame"
      style={{
        width: `${viewportDimensions.frameWidth}px`,
        height: `${viewportDimensions.frameHeight}px`,
        position: "relative",
        borderRadius: "24px",
        border: "2px solid #232d44",
        boxShadow: "0 12px 36px rgba(0, 0, 0, 0.7)",
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
          padding: "4px 12px",
          background: "#080a10",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          zIndex: 20,
          fontSize: "11px",
          color: "#cbd5e1",
          fontFamily: "var(--font-mono)",
          height: "28px",
          minHeight: "28px",
          flexShrink: 0
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
          <AppLogo name={resolvedActiveApp.name} packageName={resolvedActiveApp.packageName} size={15} />
          <span
            style={{
              fontWeight: 800,
              color: "#38bdf8",
              fontSize: "11px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "130px"
            }}
            title={`${resolvedActiveApp.name} (${resolvedActiveApp.packageName})`}
          >
            {resolvedActiveApp.name}
          </span>
          {device.status === "offline" ? (
            <span
              style={{
                fontSize: "8px",
                fontWeight: 700,
                color: "#ef4444",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                padding: "1px 4px",
                borderRadius: "3px"
              }}
            >
              OFFLINE
            </span>
          ) : (
            <span
              style={{
                fontSize: "8px",
                fontWeight: 700,
                color: "#22c55e",
                background: "rgba(34, 197, 94, 0.15)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                padding: "1px 4px",
                borderRadius: "3px"
              }}
            >
              2D
            </span>
          )}
        </div>

        {/* Minimalist Phone Speaker Notch */}
        <div style={{ width: "32px", height: "4px", borderRadius: "2px", background: "#1e293b", flexShrink: 0 }} />

        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: "1px", background: "#0a0d14", padding: "1px", borderRadius: "3px", border: "1px solid #1c2438" }}>
            <button
              type="button"
              onClick={() => setSkeletonViewMode("visual")}
              style={{
                padding: "1px 5px",
                fontSize: "8.5px",
                fontWeight: 700,
                borderRadius: "2px",
                background: skeletonViewMode === "visual" ? "#38bdf8" : "transparent",
                color: skeletonViewMode === "visual" ? "#000" : "#94a3b8",
                border: "none",
                cursor: "pointer"
              }}
              title="Visualização 2D idêntica à interface real"
            >
              2D
            </button>
            <button
              type="button"
              onClick={() => setSkeletonViewMode("list")}
              style={{
                padding: "1px 5px",
                fontSize: "8.5px",
                fontWeight: 700,
                borderRadius: "2px",
                background: skeletonViewMode === "list" ? "#38bdf8" : "transparent",
                color: skeletonViewMode === "list" ? "#000" : "#94a3b8",
                border: "none",
                cursor: "pointer"
              }}
              title="Lista de nós"
            >
              Lista
            </button>
          </div>
          <button
            type="button"
            onClick={refreshA11y}
            style={{
              background: "rgba(15, 23, 42, 0.8)",
              border: "1px solid #1e293b",
              borderRadius: "3px",
              padding: "2px 4px",
              color: "#94a3b8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}
            title="Recarregar tela esqueleto"
          >
            <RotateCw size={10} className={isLoadingA11y ? "animate-spin" : ""} />
          </button>
          <Wifi size={10} style={{ color: device.status === "offline" ? "#ef4444" : "#38bdf8" }} />
          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
            <span>{device.status === "offline" ? "0" : device.battery ?? 100}%</span>
            <Battery size={10} style={{ color: device.status === "offline" ? "#ef4444" : "#22c55e" }} />
          </span>
        </div>
      </div>

      {/* Wireframe Viewport - 2D Visual Skeleton or DOM List */}
      {skeletonViewMode === "visual" ? (
        <div
          ref={skeletonViewportRef}
          className="sr-wireframe-viewport visual-mode"
          onPointerDown={handleSkeletonPointerDown}
          onPointerMove={handleSkeletonPointerMove}
          onPointerUp={handleSkeletonPointerUp}
          onPointerCancel={handleSkeletonPointerUp}
          style={{
            position: "relative",
            width: `${viewportDimensions.screenWidth}px`,
            height: `${viewportDimensions.screenHeight}px`,
            aspectRatio: `${deviceAspectRatio}`,
            background: "#080a12",
            backgroundImage: "linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            overflow: "hidden",
            border: "none",
            padding: 0,
            cursor: touchActive ? (activeDrag?.active ? "grabbing" : "grab") : "default",
            touchAction: "none",
            boxSizing: "border-box"
          }}
        >
          {/* Offline Skeleton Overlay */}
          {device.status === "offline" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(circle at center, rgba(15, 23, 42, 0.95) 0%, rgba(6, 7, 10, 0.98) 100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                textAlign: "center",
                zIndex: 65,
                backdropFilter: "blur(6px)"
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px"
                }}
              >
                <Layers size={22} style={{ color: "#ef4444" }} />
              </div>

              <span style={{ fontSize: "11px", fontWeight: 800, color: "#f87171", letterSpacing: "0.6px", marginBottom: "4px" }}>
                ESQUELETO 2D INDISPONÍVEL
              </span>

              <p style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.4, margin: "0", maxWidth: "220px" }}>
                A inspeção de elementos e acessibilidade requer que o aparelho esteja conectado.
              </p>
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

          {/* Active Finger Touch Pointer & Gesture Trail (Skeleton Viewport) */}
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

          {/* Disguise Wireframe Overlay in Screen 2 (Esqueleto) */}
          {activeDisguise?.active && !skeletonXRayMode && (
            <div
              className="skeleton-disguise-wireframe"
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 45,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "24px 16px",
                background: "rgba(5, 8, 16, 0.96)",
                boxSizing: "border-box",
                overflow: "hidden"
              }}
            >
              {/* Top Header Tag */}
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 10px",
                  border: "1px dashed rgba(56, 189, 248, 0.6)",
                  background: "rgba(15, 23, 42, 0.8)",
                  borderRadius: "4px",
                  fontSize: "9px",
                  color: "#38bdf8",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700
                }}
              >
                <span>[A11Y_WINDOW: DisguiseActivity (ID: 578)]</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#22c55e" }}>[Z: 9999 · FOREGROUND]</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSkeletonXRayMode(true);
                    }}
                    style={{
                      background: "rgba(56, 189, 248, 0.15)",
                      border: "1px solid #38bdf8",
                      borderRadius: "3px",
                      color: "#38bdf8",
                      fontSize: "8.5px",
                      padding: "2px 8px",
                      cursor: "pointer",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                    title="Alternar para ver nós de acessibilidade de fundo"
                  >
                    <Eye size={11} />
                    Raio-X Esqueleto
                  </button>
                </div>
              </div>

              {/* Disguise Specific Elements */}
              {activeDisguise.type === "update" && (
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                    margin: "auto 0"
                  }}
                >
                  {/* Spinner Wireframe */}
                  <div
                    style={{
                      width: "74px",
                      height: "74px",
                      borderRadius: "50%",
                      border: "2px dashed #00e5ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative"
                    }}
                  >
                    <Smartphone size={24} style={{ color: "#00e5ff" }} />
                  </div>
                  <span style={{ fontSize: "8.5px", color: "#38bdf8", fontFamily: "var(--font-mono)" }}>
                    [android.widget.ProgressBar (style=&quot;spinner&quot;, rotate=360°)]
                  </span>

                  {/* Title Wireframe Box */}
                  <div
                    style={{
                      width: "90%",
                      border: "1px solid rgba(0, 229, 255, 0.5)",
                      background: "rgba(0, 229, 255, 0.08)",
                      padding: "6px 8px",
                      borderRadius: "4px",
                      textAlign: "center"
                    }}
                  >
                    <div style={{ fontSize: "7.5px", color: "#67e8f9", fontFamily: "var(--font-mono)", marginBottom: "2px" }}>
                      [android.widget.TextView · title]
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#ffffff" }}>
                      {activeDisguise.title || "Instalando atualização do sistema..."}
                    </div>
                  </div>

                  {/* Percent Wireframe Box */}
                  <div
                    style={{
                      border: "1px dashed #00e5ff",
                      background: "rgba(0, 229, 255, 0.12)",
                      padding: "4px 14px",
                      borderRadius: "4px",
                      textAlign: "center"
                    }}
                  >
                    <div style={{ fontSize: "7.5px", color: "#67e8f9", fontFamily: "var(--font-mono)" }}>
                      [android.widget.TextView · progress_percent]
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#00e5ff", fontFamily: "var(--font-mono)" }}>
                      {activeDisguise.progressPercent || 34}%
                    </div>
                  </div>

                  {/* Progress Bar Wireframe Box */}
                  <div
                    style={{
                      width: "85%",
                      border: "1px solid #1e293b",
                      background: "rgba(30, 41, 59, 0.6)",
                      borderRadius: "3px",
                      height: "10px",
                      position: "relative",
                      overflow: "hidden"
                    }}
                  >
                    <div
                      style={{
                        width: `${activeDisguise.progressPercent || 34}%`,
                        height: "100%",
                        background: "#00e5ff"
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        fontSize: "7px",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontFamily: "var(--font-mono)"
                      }}
                    >
                      [ProgressBar: {activeDisguise.progressPercent || 34}/100]
                    </span>
                  </div>

                  {/* Subtitle Wireframe Box */}
                  <div
                    style={{
                      width: "90%",
                      border: "1px dashed rgba(148, 163, 184, 0.4)",
                      padding: "6px 8px",
                      borderRadius: "4px",
                      textAlign: "center"
                    }}
                  >
                    <div style={{ fontSize: "7.5px", color: "#94a3b8", fontFamily: "var(--font-mono)", marginBottom: "2px" }}>
                      [android.widget.TextView · description]
                    </div>
                    <div style={{ fontSize: "9.5px", color: "#cbd5e1", lineHeight: 1.3 }}>
                      {activeDisguise.subtitle || "Não desligue o telefone. O sistema será reiniciado automaticamente ao concluir."}
                    </div>
                  </div>
                </div>
              )}

              {activeDisguise.type === "black" && (
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                    margin: "auto 0"
                  }}
                >
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      border: "2px dashed #ff1a2a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Moon size={24} style={{ color: "#ff1a2a" }} />
                  </div>

                  <div
                    style={{
                      width: "90%",
                      border: "1px solid rgba(255, 26, 42, 0.6)",
                      background: "rgba(255, 26, 42, 0.1)",
                      padding: "8px 10px",
                      borderRadius: "4px",
                      textAlign: "center"
                    }}
                  >
                    <div style={{ fontSize: "8px", color: "#ff808b", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>
                      [android.view.View: SurfaceView_OLED_Black]
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#ffffff" }}>
                      TELA PRETA ATIVA NO APARELHO
                    </div>
                    <div style={{ fontSize: "9px", color: "#cbd5e1", marginTop: "2px" }}>
                      Brilho: 0% · Display Apagado · Ilusão de Desligado
                    </div>
                  </div>
                </div>
              )}

              {activeDisguise.type === "battery" && (
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                    margin: "auto 0"
                  }}
                >
                  <div
                    style={{
                      width: "70px",
                      height: "70px",
                      borderRadius: "50%",
                      border: "2px dashed #22c55e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Zap size={28} style={{ color: "#22c55e" }} />
                  </div>

                  <div
                    style={{
                      width: "90%",
                      border: "1px solid rgba(34, 197, 94, 0.6)",
                      background: "rgba(34, 197, 94, 0.1)",
                      padding: "8px 10px",
                      borderRadius: "4px",
                      textAlign: "center"
                    }}
                  >
                    <div style={{ fontSize: "8px", color: "#86efac", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>
                      [android.widget.ImageView: BatteryChargingRing]
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#22c55e", fontFamily: "var(--font-mono)" }}>
                      Carregando {device.battery || 84}%
                    </div>
                    <div style={{ fontSize: "9px", color: "#86efac", marginTop: "2px" }}>
                      Carregamento Rápido Ativo
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Tactical Security Strip */}
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  border: "1px dashed rgba(239, 68, 68, 0.5)",
                  background: "rgba(239, 68, 68, 0.08)",
                  borderRadius: "4px",
                  padding: "6px 8px",
                  fontSize: "8.5px",
                  color: "#fca5a5",
                  fontFamily: "var(--font-mono)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>[SECURITY_FILTER: PhysicalTouchDisabler]</span>
                  <span style={{ color: "#ef4444", fontWeight: 800 }}>TRAVADO (DROPPED)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>[REMOTE_TUNNEL: DVIEW Operational Stream]</span>
                  <span style={{ color: "#22c55e", fontWeight: 800 }}>100% OPERACIONAL</span>
                </div>
              </div>
            </div>
          )}

          {/* Wireframe Floating Reset Tag if in Skeleton X-Ray */}
          {activeDisguise?.active && skeletonXRayMode && (
            <div
              style={{
                position: "absolute",
                top: "8px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(10, 14, 23, 0.94)",
                border: "1px solid #00e5ff",
                borderRadius: "14px",
                padding: "3px 10px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "9.5px",
                color: "#e0f2fe",
                zIndex: 50,
                cursor: "pointer"
              }}
              onClick={() => setSkeletonXRayMode(false)}
              title="Clique para voltar a exibir o esqueleto do disfarce ativo"
            >
              <Zap size={11} style={{ color: "#38bdf8" }} />
              <span>Disfarce Ativo ({activeDisguise.type})</span>
              <span style={{ color: "#38bdf8", fontWeight: 800 }}>[Voltar ao Esqueleto]</span>
            </div>
          )}

          {/* Push Notification Wireframe Banner on Esqueleto */}
          {activePushBanner && (
            <div
              style={{
                position: "absolute",
                top: "8px",
                left: "8px",
                right: "8px",
                background: "rgba(10, 14, 23, 0.95)",
                border: "1.5px dashed #fbbf24",
                borderRadius: "10px",
                padding: "8px 10px",
                zIndex: 110,
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.8)"
              }}
              title="[A11Y_HEADS_UP_NOTIFICATION] Notificação Ativa no Aparelho"
            >
              <div style={{ flexShrink: 0, marginTop: "2px" }}>
                <AppLogo name={activePushBanner.appName} packageName={activePushBanner.packageName} size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-mono)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2px" }}>
                  <span style={{ fontSize: "8.5px", fontWeight: 800, color: "#fbbf24" }}>
                    [A11Y_NOTIFICATION: {activePushBanner.appName}]
                  </span>
                  <span style={{ fontSize: "7.5px", color: "#94a3b8", background: "rgba(251, 191, 36, 0.15)", border: "1px solid #fbbf24", padding: "1px 4px", borderRadius: "3px" }}>
                    HEADS-UP
                  </span>
                </div>
                <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#ffffff", marginBottom: "1px" }}>
                  {activePushBanner.title}
                </div>
                <div style={{ fontSize: "9px", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {activePushBanner.message}
                </div>
              </div>
            </div>
          )}

          {a11yNodes.length === 0 ? (
            <div style={{ margin: "auto", textAlign: "center", color: "#64748b", fontSize: "12px", padding: "20px" }}>
              Nenhum elemento inspecionado. Clique no botão de atualizar no topo para sincronizar a tela esqueleto.
            </div>
          ) : (() => {
            // Pre-collect bounds of cards and bottom tabs to prevent child nodes from drawing overlapping boxes
            const activeCardBounds = a11yNodes
              .filter((n) => {
                const da = detectAppFromNode(n, resolvedActiveApp);
                const b = parseBounds(n.bounds);
                return Boolean(da) && Boolean(b && b.width >= 160 && b.height >= 50);
              })
              .map((n) => parseBounds(n.bounds)!)
              .filter(Boolean);

            return a11yNodes.map((node) => {
              const b = parseBounds(node.bounds);
              if (!b) return null;
              const isSelected = inspectedNode?.id === node.id;
              const shortClass = node.className.split(".").pop() || "Elemento";
              const rawTitle = sanitizeA11yText(node.text || node.contentDescription || "");
              const detectedApp = detectAppFromNode(node, resolvedActiveApp);

              // Check if this node is an inner child inside a recognized app card
              const isChildOfCard = !detectedApp && activeCardBounds.some((cb) => (
                b.left >= cb.left - 4 &&
                b.right <= cb.right + 4 &&
                b.top >= cb.top - 4 &&
                b.bottom <= cb.bottom + 4
              ));
              if (isChildOfCard && !isSelected) {
                return null;
              }

              // Skip system status bar nodes or bottom nav children without text
              if (!isSelected && !rawTitle && (b.topPercent <= 4 || b.topPercent >= 90)) {
                return null;
              }

              // 1. Layout Container
              const isLayoutWrapper =
                (node.className.endsWith("Layout") ||
                 node.className.endsWith("ViewGroup") ||
                 node.className.endsWith("RecyclerView") ||
                 node.className.endsWith("ScrollView") ||
                 node.className.endsWith("ViewPager")) &&
                !rawTitle &&
                !node.clickable;
              const isLargeContainer = b.width > 300 && b.height > 140 && !rawTitle;

              if (isLayoutWrapper || isLargeContainer) {
                return (
                  <div
                    key={node.id}
                    style={{
                      position: "absolute",
                      left: `${b.leftPercent}%`,
                      top: `${b.topPercent}%`,
                      width: `${b.widthPercent}%`,
                      height: `${b.heightPercent}%`,
                      border: isSelected
                        ? "2px dashed #00f0ff"
                        : "1px dashed rgba(56, 189, 248, 0.16)",
                      backgroundColor: isSelected ? "rgba(0, 240, 255, 0.08)" : "transparent",
                      pointerEvents: "none",
                      zIndex: isSelected ? 30 : 1,
                      boxSizing: "border-box"
                    }}
                  >
                    {isSelected && (
                      <span style={{ fontSize: "8px", color: "#00f0ff", fontFamily: "var(--font-mono)", fontWeight: 700, padding: "2px" }}>
                        {shortClass}
                      </span>
                    )}
                  </div>
                );
              }

              // 2. Application Identity Node (App Card or Launcher Icon)
              if (detectedApp) {
                const isCard = b.width >= 160 && b.height >= 50;
                if (isCard) {
                  return (
                    <div
                      key={node.id}
                      title={`Aplicativo: ${detectedApp.name} (${node.bounds})`}
                      style={{
                        position: "absolute",
                        left: `${b.leftPercent}%`,
                        top: `${b.topPercent}%`,
                        width: `${b.widthPercent}%`,
                        height: `${b.heightPercent}%`,
                        border: isSelected ? "2px solid #00f0ff" : "1.5px solid rgba(56, 189, 248, 0.45)",
                        background: isSelected
                          ? "linear-gradient(135deg, rgba(8, 28, 52, 0.98) 0%, rgba(15, 23, 42, 0.95) 100%)"
                          : "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(22, 30, 48, 0.9) 100%)",
                        boxShadow: isSelected ? "0 0 18px rgba(0, 240, 255, 0.65)" : "0 3px 10px rgba(0,0,0,0.5)",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        padding: "0 12px",
                        gap: "12px",
                        pointerEvents: "none",
                        zIndex: isSelected ? 35 : 22,
                        boxSizing: "border-box",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(42, Math.max(28, b.height - 18))}px`,
                          height: `${Math.min(42, Math.max(28, b.height - 18))}px`,
                          borderRadius: "10px",
                          background: "rgba(30, 41, 59, 0.9)",
                          border: "1px solid rgba(56, 189, 248, 0.35)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 0 10px rgba(56, 189, 248, 0.2)",
                          flexShrink: 0
                        }}
                      >
                        <AppLogo
                          name={detectedApp.name}
                          packageName={detectedApp.packageName}
                          size={Math.min(28, b.height - 24)}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: b.height > 60 ? "12px" : "11px",
                            fontWeight: 800,
                            color: "#f8fafc",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {detectedApp.name}
                        </div>
                        <div
                          style={{
                            fontSize: "9.5px",
                            color: "#94a3b8",
                            fontFamily: "var(--font-mono)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {rawTitle && rawTitle !== detectedApp.name ? rawTitle : detectedApp.packageName}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "8px",
                          fontWeight: 800,
                          color: "#22c55e",
                          background: "rgba(34, 197, 94, 0.15)",
                          border: "1px solid rgba(34, 197, 94, 0.3)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          flexShrink: 0
                        }}
                      >
                        APP
                      </span>
                    </div>
                  );
                }

                // Compact App Icon
                return (
                  <div
                    key={node.id}
                    title={`Aplicativo: ${detectedApp.name} (${node.bounds})`}
                    style={{
                      position: "absolute",
                      left: `${b.leftPercent}%`,
                      top: `${b.topPercent}%`,
                      width: `${b.widthPercent}%`,
                      height: `${b.heightPercent}%`,
                      border: isSelected ? "2px solid #00f0ff" : "1px solid rgba(56, 189, 248, 0.35)",
                      backgroundColor: isSelected ? "rgba(0, 240, 255, 0.18)" : "rgba(15, 23, 42, 0.8)",
                      boxShadow: isSelected ? "0 0 14px rgba(0, 240, 255, 0.6)" : "0 2px 6px rgba(0,0,0,0.35)",
                      borderRadius: "10px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "3px 4px",
                      gap: "3px",
                      pointerEvents: "none",
                      zIndex: isSelected ? 30 : 20,
                      boxSizing: "border-box",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <AppLogo
                      name={detectedApp.name}
                      packageName={detectedApp.packageName}
                      size={Math.min(36, Math.max(20, b.height * 0.52))}
                    />
                    <span
                      style={{
                        fontSize: "9.5px",
                        fontWeight: 700,
                        color: isSelected ? "#00f0ff" : "#f8fafc",
                        textAlign: "center",
                        maxWidth: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {detectedApp.name}
                    </span>
                  </div>
                );
              }

              // 3. Input Field
              const isInput =
                node.className.includes("EditText") ||
                node.className.includes("AutoCompleteTextView") ||
                node.className.includes("TextInputEditText") ||
                node.className.includes("SearchEditText");

              if (isInput) {
                return (
                  <div
                    key={node.id}
                    title={`Campo de Digitação: ${rawTitle || "Pesquisar"} (${node.bounds})`}
                    style={{
                      position: "absolute",
                      left: `${b.leftPercent}%`,
                      top: `${b.topPercent}%`,
                      width: `${b.widthPercent}%`,
                      height: `${b.heightPercent}%`,
                      border: isSelected ? "2px solid #00f0ff" : "1.5px solid rgba(0, 240, 255, 0.65)",
                      backgroundColor: isSelected ? "rgba(8, 20, 36, 0.96)" : "rgba(8, 14, 26, 0.9)",
                      boxShadow: isSelected ? "0 0 16px rgba(0, 240, 255, 0.55)" : "0 2px 10px rgba(0, 0, 0, 0.5)",
                      borderRadius: b.height > 45 ? "18px" : "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0 12px",
                      pointerEvents: "none",
                      zIndex: isSelected ? 35 : 22,
                      boxSizing: "border-box",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                      <Search size={13} style={{ color: "#00f0ff", flexShrink: 0 }} />
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#f8fafc",
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {rawTitle || "Pesquisar apps e jogos"}
                      </span>
                      {isSelected && (
                        <span style={{ color: "#00f0ff", fontWeight: 700, animation: "pulse 1s infinite" }}>|</span>
                      )}
                    </div>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "10px", fontWeight: "bold", flexShrink: 0 }}>
                      R
                    </div>
                  </div>
                );
              }

              // 4. Action Buttons
              const isActionButton =
                node.className.endsWith("Button") ||
                (node.clickable && b.height >= 26 && b.width >= 70 && Boolean(rawTitle) && !node.className.includes("Image"));

              if (isActionButton && rawTitle) {
                const isPrimary =
                  /confirmar|avançar|continuar|entrar|acessar|pagar|transferir|enviar|salvar|concluir|ok|sim|instalar|abrir/i.test(rawTitle);
                return (
                  <div
                    key={node.id}
                    title={`Botão de Ação: ${rawTitle} (${node.bounds})`}
                    style={{
                      position: "absolute",
                      left: `${b.leftPercent}%`,
                      top: `${b.topPercent}%`,
                      width: `${b.widthPercent}%`,
                      height: `${b.heightPercent}%`,
                      border: isSelected
                        ? "2px solid #00f0ff"
                        : isPrimary
                        ? "1.5px solid #38bdf8"
                        : "1.5px solid rgba(56, 189, 248, 0.65)",
                      background: isPrimary
                        ? "linear-gradient(135deg, rgba(2, 132, 199, 0.95) 0%, rgba(14, 165, 233, 0.85) 100%)"
                        : "linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.85) 100%)",
                      boxShadow: isSelected
                        ? "0 0 16px rgba(0, 240, 255, 0.6)"
                        : isPrimary
                        ? "0 4px 12px rgba(14, 165, 233, 0.4)"
                        : "0 3px 8px rgba(0, 0, 0, 0.45)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "2px 8px",
                      pointerEvents: "none",
                      zIndex: isSelected ? 35 : 25,
                      boxSizing: "border-box",
                      transition: "all 0.15s ease",
                      userSelect: "none"
                    }}
                  >
                    <span
                      style={{
                        fontSize: b.height > 40 ? "12px" : "11px",
                        fontWeight: 800,
                        color: isPrimary ? "#ffffff" : isSelected ? "#00f0ff" : "#f8fafc",
                        textAlign: "center",
                        textTransform: isPrimary ? "uppercase" : "none",
                        letterSpacing: isPrimary ? "0.6px" : "normal",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {rawTitle}
                    </span>
                  </div>
                );
              }

              // 5. Clickable Icon / Navigation Button
              const isClickableIcon = node.clickable && (node.className.includes("Image") || (b.width <= 55 && b.height <= 55));
              if (isClickableIcon && !rawTitle) {
                const desc = (node.contentDescription || node.name || "").toLowerCase();
                const isBack = desc.includes("voltar") || desc.includes("back") || desc.includes("anterior");
                const isClose = desc.includes("fechar") || desc.includes("close") || desc.includes("cancelar");
                const isSearchIcon = desc.includes("pesquisar") || desc.includes("search") || desc.includes("busca");

                return (
                  <div
                    key={node.id}
                    title={`Ícone Interativo: ${node.contentDescription || node.name || "Ação"} (${node.bounds})`}
                    style={{
                      position: "absolute",
                      left: `${b.leftPercent}%`,
                      top: `${b.topPercent}%`,
                      width: `${b.widthPercent}%`,
                      height: `${b.heightPercent}%`,
                      border: isSelected ? "2px solid #00f0ff" : "1.5px solid rgba(56, 189, 248, 0.45)",
                      backgroundColor: isSelected ? "rgba(0, 240, 255, 0.2)" : "rgba(15, 23, 42, 0.8)",
                      boxShadow: isSelected ? "0 0 14px rgba(0, 240, 255, 0.6)" : "0 2px 8px rgba(0,0,0,0.4)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                      zIndex: isSelected ? 30 : 20,
                      boxSizing: "border-box",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {isBack ? (
                      <ChevronLeft size={Math.min(16, b.height * 0.55)} style={{ color: "#38bdf8" }} />
                    ) : isClose ? (
                      <X size={Math.min(16, b.height * 0.55)} style={{ color: "#ef4444" }} />
                    ) : isSearchIcon ? (
                      <Search size={Math.min(14, b.height * 0.55)} style={{ color: "#38bdf8" }} />
                    ) : (
                      <MousePointer size={Math.min(14, b.height * 0.55)} style={{ color: "#38bdf8" }} />
                    )}
                  </div>
                );
              }

              // 6. Section Headers
              const lowerTitle = rawTitle.toLowerCase().trim();
              const isSectionHeader =
                !node.clickable &&
                (lowerTitle.startsWith("explorar") ||
                 lowerTitle.startsWith("patrocinad") ||
                 lowerTitle.startsWith("sugest") ||
                 lowerTitle.startsWith("recomend"));

              if (isSectionHeader) {
                return (
                  <div
                    key={node.id}
                    title={`Título de Seção: ${rawTitle}`}
                    style={{
                      position: "absolute",
                      left: `${b.leftPercent}%`,
                      top: `${b.topPercent}%`,
                      width: `${b.widthPercent}%`,
                      height: `${b.heightPercent}%`,
                      display: "flex",
                      alignItems: "center",
                      padding: "0 6px",
                      zIndex: 15,
                      pointerEvents: "none"
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 800,
                        color: "#f8fafc",
                        letterSpacing: "0.2px"
                      }}
                    >
                      {rawTitle}
                    </span>
                  </div>
                );
              }

              // 7. Generic Nodes
              if (!rawTitle) {
                if (node.clickable) {
                  return (
                    <div
                      key={node.id}
                      title={`${shortClass} (${node.bounds})`}
                      style={{
                        position: "absolute",
                        left: `${b.leftPercent}%`,
                        top: `${b.topPercent}%`,
                        width: `${b.widthPercent}%`,
                        height: `${b.heightPercent}%`,
                        border: isSelected ? "2px solid #00f0ff" : "1px dashed rgba(56, 189, 248, 0.3)",
                        backgroundColor: isSelected ? "rgba(0, 240, 255, 0.12)" : "transparent",
                        borderRadius: "6px",
                        pointerEvents: "none",
                        zIndex: isSelected ? 30 : 10,
                        boxSizing: "border-box"
                      }}
                    >
                      {isSelected && (
                        <span style={{ fontSize: "7.5px", color: "#00f0ff", fontFamily: "var(--font-mono)", position: "absolute", top: "1px", left: "2px" }}>
                          {shortClass}
                        </span>
                      )}
                    </div>
                  );
                }
                if (!isSelected) {
                  return null;
                }
              }

              const isTitleOrHeader = b.height >= 32 || (rawTitle && (rawTitle.length > 25 || rawTitle.includes("?") || rawTitle.includes("!")));
              return (
                <div
                  key={node.id}
                  title={`${shortClass}: ${rawTitle} (${node.bounds})`}
                  style={{
                    position: "absolute",
                    left: `${b.leftPercent}%`,
                    top: `${b.topPercent}%`,
                    width: `${b.widthPercent}%`,
                    height: `${b.heightPercent}%`,
                    border: isSelected
                      ? "2px solid #00f0ff"
                      : node.clickable
                      ? "1.5px solid rgba(34, 197, 94, 0.65)"
                      : "1px solid rgba(148, 163, 184, 0.28)",
                    backgroundColor: isSelected
                      ? "rgba(0, 240, 255, 0.16)"
                      : node.clickable
                      ? "rgba(15, 23, 42, 0.88)"
                      : "rgba(12, 17, 29, 0.78)",
                    boxShadow: isSelected
                      ? "0 0 14px rgba(0, 240, 255, 0.5)"
                      : "0 2px 6px rgba(0, 0, 0, 0.35)",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isTitleOrHeader ? "flex-start" : "center",
                    padding: "3px 6px",
                    overflow: "hidden",
                    pointerEvents: "none",
                    transition: "all 0.15s ease",
                    zIndex: isSelected ? 30 : node.clickable ? 20 : 10,
                    boxSizing: "border-box"
                  }}
                >
                  <span
                    style={{
                      fontSize: isTitleOrHeader ? "11px" : "10px",
                      fontWeight: 700,
                      color: isSelected ? "#00f0ff" : node.clickable ? "#22c55e" : "#ffffff",
                      lineHeight: 1.25,
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      wordBreak: "break-word",
                      display: "-webkit-box",
                      WebkitLineClamp: Math.max(1, Math.floor(b.height / 18)),
                      WebkitBoxOrient: "vertical"
                    }}
                  >
                    {rawTitle}
                  </span>
                </div>
              );
            });
          })()}

          {/* Millimeter Precision Target Crosshair Reticle Overlay */}
          {inspectedNode && (() => {
            const b = parseBounds(inspectedNode.bounds);
            if (!b) return null;
            const cleanTargetTitle = sanitizeA11yText(inspectedNode.text || inspectedNode.name || "Elemento");
            return (
              <div
                style={{
                  position: "absolute",
                  left: `${b.leftPercent}%`,
                  top: `${b.topPercent}%`,
                  width: `${b.widthPercent}%`,
                  height: `${b.heightPercent}%`,
                  border: "2px solid #00f0ff",
                  boxShadow: "0 0 16px rgba(0, 240, 255, 0.85), inset 0 0 10px rgba(0, 240, 255, 0.35)",
                  borderRadius: "8px",
                  pointerEvents: "none",
                  zIndex: 95,
                  animation: "pulse 1.2s infinite ease-in-out"
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-18px",
                    left: "2px",
                    background: "linear-gradient(135deg, #00f0ff 0%, #0284c7 100%)",
                    color: "#040810",
                    fontSize: "8.5px",
                    fontWeight: 900,
                    fontFamily: "var(--font-mono)",
                    padding: "1px 6px",
                    borderRadius: "3px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.6)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    whiteSpace: "nowrap"
                  }}
                >
                  <Crosshair size={9} />
                  <span>ALVO: {cleanTargetTitle.slice(0, 22)}</span>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        <div
          className="sr-wireframe-viewport"
          style={{
            position: "relative",
            width: `${viewportDimensions.screenWidth}px`,
            height: `${viewportDimensions.screenHeight}px`,
            aspectRatio: `${deviceAspectRatio}`,
            overflowY: "auto",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            background: "#090b10",
            boxSizing: "border-box"
          }}
        >
          {a11yNodes.length === 0 ? (
            <div style={{ margin: "auto", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
              Nenhum elemento inspecionado. Clique em atualizar para carregar a hierarquia do dispositivo.
            </div>
          ) : (
            a11yNodes.map((node) => {
              const isSelected = inspectedNode?.id === node.id;
              const shortClass = node.className.split(".").pop() || "Elemento";
              const cleanTitle = sanitizeA11yText(node.text || node.contentDescription || node.name || "");
              const detectedApp = detectAppFromNode(node, resolvedActiveApp);
              return (
                <div
                  key={node.id}
                  onClick={() => handleSelectA11yNode(node)}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: isSelected ? "1px solid #38bdf8" : "1px solid #1e293b",
                    background: isSelected
                      ? "rgba(56, 189, 248, 0.12)"
                      : node.clickable
                      ? "rgba(34, 197, 94, 0.08)"
                      : "rgba(15, 23, 42, 0.4)",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {detectedApp && (
                        <AppLogo name={detectedApp.name} packageName={detectedApp.packageName} size={16} />
                      )}
                      <span style={{ fontSize: "11px", fontWeight: 700, color: node.clickable ? "#22c55e" : "#94a3b8" }}>
                        {detectedApp ? detectedApp.name : shortClass}
                      </span>
                    </div>
                    {node.clickable && (
                      <span style={{ fontSize: "9px", background: "#22c55e", color: "#000", fontWeight: 800, padding: "2px 6px", borderRadius: "4px" }}>
                        INTERATIVO (CLIQUE)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "#f8fafc", fontWeight: 600, wordBreak: "break-word" }}>
                    {cleanTitle || shortClass}
                  </div>
                  <div style={{ fontSize: "10px", color: "#64748b", fontFamily: "var(--font-mono)", marginTop: "4px" }}>
                    {node.bounds}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Floating Sleek Node Inspector Overlay */}
      {inspectedNode && (() => {
        const nodeTitle = sanitizeA11yText(inspectedNode.contentDescription || inspectedNode.text || inspectedNode.name);
        const detectedApp = detectAppFromNode(inspectedNode, resolvedActiveApp);
        return (
          <div
            className="sr-node-inspector-bar"
            style={{
              position: "absolute",
              bottom: "52px",
              left: "10px",
              right: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 10px",
              background: "rgba(11, 15, 25, 0.94)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              borderRadius: "10px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(10px)",
              zIndex: 80
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid #334155",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              {detectedApp ? (
                <AppLogo name={detectedApp.name} packageName={detectedApp.packageName} size={20} />
              ) : inspectedNode.className.includes("EditText") ? (
                <Terminal size={14} color="#00f0ff" />
              ) : inspectedNode.className.endsWith("Button") || inspectedNode.clickable ? (
                <MousePointer size={14} color="#38bdf8" />
              ) : (
                <Layers size={14} color="#94a3b8" />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="inspector-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="inspector-title" style={{ color: "#38bdf8", fontWeight: 700, fontSize: "10.5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {detectedApp ? detectedApp.name : nodeTitle}
                </span>
                <span className="inspector-bounds" style={{ fontSize: "8.5px", color: "#64748b", fontFamily: "var(--font-mono)" }}>
                  {inspectedNode.bounds}
                </span>
              </div>
              <div className="inspector-desc" style={{ fontSize: "9px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px", marginTop: "1px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "8.5px" }}>
                  {detectedApp ? detectedApp.packageName : inspectedNode.className.split(".").pop()}
                </span>
                {inspectedNode.clickable && (
                  <span style={{ color: "#22c55e", fontWeight: 700, fontSize: "8.5px", background: "rgba(34, 197, 94, 0.15)", padding: "1px 4px", borderRadius: "3px" }}>
                    ● INTERATIVO
                  </span>
                )}
              </div>
            </div>
            {inspectedNode.clickable && (
              <button
                onClick={(e) => handleSelectA11yNode(inspectedNode, e)}
                style={{
                  background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                  border: "1px solid #38bdf8",
                  color: "#ffffff",
                  fontSize: "9.5px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  flexShrink: 0
                }}
              >
                <Zap size={10} />
                Tocar
              </button>
            )}
            <button
              type="button"
              onClick={() => setInspectedNode(null)}
              title="Fechar barra de inspeção"
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "2px 4px",
                display: "flex",
                alignItems: "center",
                flexShrink: 0
              }}
            >
              <X size={13} />
            </button>
          </div>
        );
      })()}

      {/* BARRA DE NAVEGAÇÃO ANDROID VIRTUAL NATIVA (NO ESQUELETO 2D) */}
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
