import React from "react";
import { Lightbulb, Moon, RotateCw } from "lucide-react";
import type { ControlDevice } from "../../types";
import { api } from "../../../../api";

export interface ScreenViewCameraFrameProps {
  viewportDimensions: {
    frameWidth: number;
    frameHeight: number;
    screenWidth: number;
    screenHeight: number;
  };
  device: ControlDevice;
  activeCamera: "front" | "back";
  setActiveCamera: (cam: "front" | "back") => void;
  torchOn: boolean;
  setTorchOn: (on: boolean) => void;
  nightVision: boolean;
  setNightVision: (on: boolean) => void;
  deviceAspectRatio: number;
  screenTimestamp: number;
  showCameraGrid: boolean;
  cameraResolution: "720p" | "1080p" | "4K";
  isCapturingPhoto: boolean;
  handleCaptureCameraPhoto: () => void;
  handleMacroAction: (cmd: string, label: string) => void;
  showToast: (msg: string, type?: "info" | "success" | "warn") => void;
}

export const ScreenViewCameraFrame: React.FC<ScreenViewCameraFrameProps> = ({
  viewportDimensions,
  device,
  activeCamera,
  setActiveCamera,
  torchOn,
  setTorchOn,
  nightVision,
  setNightVision,
  deviceAspectRatio,
  screenTimestamp,
  showCameraGrid,
  cameraResolution,
  isCapturingPhoto,
  handleCaptureCameraPhoto,
  handleMacroAction,
  showToast
}) => {
  return (
    <div
      className="tactical-phone-viewport live-camera-frame"
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
      {/* Top Control Header on Camera Phone Frame */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 10px",
          background: "#0b0f19",
          borderBottom: "1px solid #1e293b",
          zIndex: 10
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            className="tactical-phone-silent-pill"
            style={{
              position: "static",
              transform: "none",
              background: "rgba(56, 189, 248, 0.2)",
              borderColor: "#38bdf8",
              color: "#38bdf8"
            }}
          >
            CÂMERA · {activeCamera === "back" ? "50MP" : "12MP"}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            type="button"
            onClick={() => {
              const nextCam = activeCamera === "back" ? "front" : "back";
              setActiveCamera(nextCam);
              showToast(`Câmera alternada para ${nextCam === "back" ? "Traseira" : "Frontal"}`, "info");
            }}
            title="Alternar entre câmera frontal e traseira"
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#cbd5e1",
              borderRadius: "4px",
              padding: "2px 6px",
              fontSize: "9px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "3px"
            }}
          >
            <RotateCw size={10} />
            <span>{activeCamera === "back" ? "Traseira" : "Frontal"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTorchOn(!torchOn);
              showToast(torchOn ? "Lanterna desligada" : "Lanterna ativada no aparelho", "success");
            }}
            title="Ligar ou desligar lanterna LED"
            style={{
              background: torchOn ? "rgba(250, 204, 21, 0.25)" : "#1e293b",
              border: `1px solid ${torchOn ? "#facc15" : "#334155"}`,
              color: torchOn ? "#facc15" : "#94a3b8",
              borderRadius: "4px",
              padding: "2px 5px",
              cursor: "pointer"
            }}
          >
            <Lightbulb size={11} />
          </button>

          <button
            type="button"
            onClick={() => {
              setNightVision(!nightVision);
              showToast(nightVision ? "Modo Noturno desativado" : "Modo Noturno / ISO Ativado", "info");
            }}
            title="Visão Noturna / Ganho ISO"
            style={{
              background: nightVision ? "rgba(34, 197, 94, 0.25)" : "#1e293b",
              border: `1px solid ${nightVision ? "#22c55e" : "#334155"}`,
              color: nightVision ? "#22c55e" : "#94a3b8",
              borderRadius: "4px",
              padding: "2px 5px",
              cursor: "pointer"
            }}
          >
            <Moon size={11} />
          </button>
        </div>
      </div>

      {/* Camera Optical Viewfinder Container */}
      <div
        className="camera-viewfinder-container"
        style={{
          position: "relative",
          width: `${viewportDimensions.screenWidth}px`,
          height: `${viewportDimensions.screenHeight}px`,
          aspectRatio: `${deviceAspectRatio}`,
          background: "#040508",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          filter: nightVision ? "brightness(1.35) contrast(1.2) hue-rotate(90deg)" : "none",
          boxSizing: "border-box"
        }}
      >
        {/* Viewfinder visual feed */}
        <img
          src={`${api.getDeviceScreenUrl(device.id)}?cam=1&t=${screenTimestamp}`}
          alt="Feed da Câmera"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: activeCamera === "front" ? "scaleX(-1)" : "none",
            opacity: 0.9
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = "0.4";
          }}
        />

        {/* Optical Reticle & Rule of Thirds Grid Overlay */}
        {showCameraGrid && (
          <div className="camera-optical-grid-overlay">
            <div className="camera-grid-line h-1" />
            <div className="camera-grid-line h-2" />
            <div className="camera-grid-line v-1" />
            <div className="camera-grid-line v-2" />
            <div className="camera-center-crosshair">
              <span className="crosshair-bracket top-left" />
              <span className="crosshair-bracket top-right" />
              <span className="crosshair-bracket bottom-left" />
              <span className="crosshair-bracket bottom-right" />
              <span className="crosshair-dot" />
            </div>
          </div>
        )}

        {/* Telemetry Badge on Viewfinder */}
        <div className="camera-telemetry-hud">
          <span className="hud-tag">ÓPTICO</span>
          <span className="hud-metric">{activeCamera === "back" ? "24mm f/1.8" : "18mm f/2.2"}</span>
          <span className="hud-metric">ISO 400</span>
          <span className="hud-resolution">{cameraResolution}</span>
        </div>

        {/* Floating Shutter Capture Button */}
        <div className="camera-shutter-bar">
          <button
            type="button"
            className={`camera-shutter-trigger ${isCapturingPhoto ? "capturing" : ""}`}
            onClick={handleCaptureCameraPhoto}
            title="Capturar Foto"
          >
            <div className="shutter-inner-circle" />
          </button>
        </div>

        {/* Flash effect when capturing */}
        {isCapturingPhoto && <div className="camera-shutter-flash-overlay" />}
      </div>

      {/* Android Hardware Navbar at Bottom */}
      <div className="android-hardware-navbar">
        <button
          type="button"
          className="android-nav-btn"
          onClick={() => handleMacroAction("input keyevent 187", "Recentes")}
          title="Trocar Telas / Recentes"
        >
          <span className="nav-btn-icon">|||</span>
          <span className="nav-btn-text">RECENTES</span>
        </button>

        <button
          type="button"
          className="android-nav-btn"
          onClick={() => handleMacroAction("input keyevent 3", "Home")}
          title="Tela Inicial"
        >
          <span className="nav-btn-icon">○</span>
          <span className="nav-btn-text">INICIAR</span>
        </button>

        <button
          type="button"
          className="android-nav-btn"
          onClick={() => handleMacroAction("input keyevent 4", "Voltar")}
          title="Voltar"
        >
          <span className="nav-btn-icon">◁</span>
          <span className="nav-btn-text">VOLTAR</span>
        </button>
      </div>
    </div>
  );
};
