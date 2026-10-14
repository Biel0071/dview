import React from "react";
import { EyeOff, Image as ImageIcon, RotateCw, Zap } from "lucide-react";
import type { DeviceDisguiseType } from "@droidview/shared";

export interface MiniPhonePreviewProps {
  type: DeviceDisguiseType;
  updatePercent?: number;
  batteryPercent?: number;
  customImageUrl?: string | null;
  isActive?: boolean;
  scale?: "compact" | "normal" | "large";
}

export const MiniPhonePreview: React.FC<MiniPhonePreviewProps> = ({
  type,
  updatePercent = 34,
  batteryPercent = 100,
  customImageUrl,
  isActive = false,
  scale = "normal"
}) => {
  const accentColor =
    type === "update" ? "#00e5ff" : type === "battery" ? "#22c55e" : type === "custom_image" ? "#c084fc" : "#ff4d5a";

  const w = scale === "compact" ? "28px" : scale === "large" ? "48px" : "36px";
  const h = scale === "compact" ? "48px" : scale === "large" ? "80px" : "60px";
  const notchW = scale === "compact" ? "7px" : scale === "large" ? "12px" : "9px";

  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: scale === "compact" ? "4px" : "5px",
        background: "#000000",
        border: `1px solid ${isActive ? accentColor : "#243046"}`,
        boxShadow: isActive ? `0 0 8px ${accentColor}44` : "0 2px 5px rgba(0,0,0,0.5)",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        userSelect: "none",
        transition: "all 0.15s ease"
      }}
      title="Miniatura preview da tela no display do smartphone (720×1280 px • 9:16)"
    >
      {/* Top Speaker Notch Dot */}
      <div
        style={{
          position: "absolute",
          top: "2px",
          width: notchW,
          height: scale === "compact" ? "1.2px" : "1.5px",
          borderRadius: "1px",
          background: "#334155",
          zIndex: 10
        }}
      />

      {/* 1. BLACK SCREEN PREVIEW */}
      {type === "black" && (
        <div style={{ width: "100%", height: "100%", background: "#000000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px" }}>
          <EyeOff size={scale === "compact" ? 8 : scale === "large" ? 14 : 10} style={{ color: "#334155" }} />
          <span style={{ fontSize: scale === "compact" ? "4.5px" : scale === "large" ? "7px" : "5.5px", color: "#475569", fontFamily: "var(--font-mono)", fontWeight: 800 }}>OLED</span>
        </div>
      )}

      {/* 2. UPDATE SCREEN PREVIEW */}
      {type === "update" && (
        <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, #040711 0%, #060d1d 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2px" }}>
          <div style={{ width: scale === "compact" ? "10px" : scale === "large" ? "17px" : "13px", height: scale === "compact" ? "10px" : scale === "large" ? "17px" : "13px", borderRadius: "50%", border: "1.2px solid transparent", borderTopColor: "#00e5ff", borderRightColor: "#0077ff", animation: "spin 1.4s linear infinite", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2px" }}>
            <RotateCw size={scale === "compact" ? 5 : scale === "large" ? 8 : 6} style={{ color: "#00e5ff" }} />
          </div>
          <span style={{ fontSize: scale === "compact" ? "5.5px" : scale === "large" ? "8.5px" : "6.5px", fontWeight: 800, color: "#00e5ff", fontFamily: "var(--font-mono)", marginBottom: "2px" }}>{updatePercent}%</span>
          <div style={{ width: "75%", height: "2px", background: "#1e293b", borderRadius: "1px", overflow: "hidden" }}>
            <div style={{ width: `${updatePercent}%`, height: "100%", background: "#00e5ff" }} />
          </div>
        </div>
      )}

      {/* 3. BATTERY SCREEN PREVIEW */}
      {type === "battery" && (
        <div style={{ width: "100%", height: "100%", background: "radial-gradient(circle at center, #05160b 0%, #010603 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2px" }}>
          <div style={{ width: scale === "compact" ? "12px" : scale === "large" ? "19px" : "15px", height: scale === "compact" ? "12px" : scale === "large" ? "19px" : "15px", borderRadius: "50%", border: "1.2px solid #22c55e", boxShadow: "0 0 5px rgba(34, 197, 94, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2px" }}>
            <Zap size={scale === "compact" ? 6 : scale === "large" ? 10 : 8} style={{ color: "#22c55e" }} />
          </div>
          <span style={{ fontSize: scale === "compact" ? "6px" : scale === "large" ? "9px" : "7px", fontWeight: 800, color: "#22c55e", fontFamily: "var(--font-mono)" }}>{batteryPercent}%</span>
          <span style={{ fontSize: scale === "compact" ? "4.5px" : scale === "large" ? "6.5px" : "5px", color: "#86efac", fontWeight: 700 }}>FAST</span>
        </div>
      )}

      {/* 4. CUSTOM IMAGE PREVIEW */}
      {type === "custom_image" && (
        <div style={{ width: "100%", height: "100%", background: "#090d16", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {customImageUrl ? (
            <img src={customImageUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
              <ImageIcon size={scale === "compact" ? 8 : scale === "large" ? 14 : 10} style={{ color: "#a855f7" }} />
              <span style={{ fontSize: scale === "compact" ? "4.5px" : scale === "large" ? "7px" : "5.5px", color: "#c084fc", fontWeight: 700 }}>9:16</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom Nav Home Dash */}
      <div
        style={{
          position: "absolute",
          bottom: "2px",
          width: scale === "compact" ? "8px" : scale === "large" ? "15px" : "11px",
          height: "1px",
          borderRadius: "1px",
          background: "rgba(255,255,255,0.25)",
          zIndex: 10
        }}
      />
    </div>
  );
};
