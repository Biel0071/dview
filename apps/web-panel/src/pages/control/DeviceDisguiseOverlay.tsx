import React, { useEffect, useState } from "react";
import {
  BatteryCharging,
  CheckCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Lock,
  RefreshCw,
  RotateCw,
  ShieldAlert,
  Smartphone,
  Sparkles,
  X,
  Zap
} from "lucide-react";
import type { DeviceDisguiseConfig } from "@droidview/shared";

interface Props {
  disguise: DeviceDisguiseConfig;
  batteryLevel?: number;
  onDismiss?: () => void;
  showDismissButton?: boolean;
}

export function DeviceDisguiseOverlay({
  disguise,
  batteryLevel = 84,
  onDismiss,
  showDismissButton = true
}: Props) {
  const [animatedPercent, setAnimatedPercent] = useState(disguise.progressPercent || 28);
  const [isHovered, setIsHovered] = useState(false);
  // Default to FALSE so Tela Real immediately portrays the full, vivid disguise screen as requested
  const [isXRayMode, setIsXRayMode] = useState(false);

  // Subtle animated progress increment for realism if update screen is active
  useEffect(() => {
    if (disguise.type !== "update") return;
    const interval = setInterval(() => {
      setAnimatedPercent((prev) => {
        if (prev >= 98) return 98;
        return prev + 1;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [disguise.type]);

  if (!disguise.active) return null;

  return (
    <div
      className="device-disguise-overlay-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        userSelect: "none",
        pointerEvents: "none"
      }}
    >
      {/* 1. TELA PRETA (OLED BLACK / MODO SUPORTE REMOTO COM CONTROLE TOTAL) */}
      {disguise.type === "black" && (
        <div
          className="disguise-screen-black"
          style={{
            position: "absolute",
            inset: 0,
            background: isXRayMode ? "rgba(0, 0, 0, 0.12)" : "#000000",
            border: isXRayMode ? "2px dashed rgba(255, 26, 42, 0.65)" : "none",
            boxShadow: isXRayMode ? "inset 0 0 35px rgba(255, 26, 42, 0.25)" : "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: isXRayMode ? "flex-end" : "center",
            paddingBottom: isXRayMode ? "28px" : "0",
            pointerEvents: "none"
          }}
        >
          {isXRayMode ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(10, 14, 23, 0.92)",
                border: "1px solid #ff1a2a",
                boxShadow: "0 0 14px rgba(255, 26, 42, 0.5)",
                borderRadius: "20px",
                padding: "5px 14px",
                color: "#ff808b",
                fontSize: "11px",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                pointerEvents: "none"
              }}
            >
              <EyeOff size={13} style={{ color: "#ff1a2a" }} />
              <span>Display do celular apagado · Toque do aparelho OFF · Suporte com controle total</span>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                color: "#475569",
                pointerEvents: "none",
                textAlign: "center",
                padding: "20px"
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  border: "1px solid #1e293b",
                  background: "rgba(15, 23, 42, 0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <EyeOff size={18} style={{ color: "#64748b" }} />
              </div>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", letterSpacing: "0.5px" }}>
                SIMULAÇÃO DE TELA DO CLIENTE (PRETA)
              </span>
              <span style={{ fontSize: "9.5px", color: "#64748b", maxWidth: "220px", lineHeight: 1.4 }}>
                O display do aparelho físico está 100% apagado e o toque físico travado.
              </span>
              <span style={{ fontSize: "9px", color: "#38bdf8", fontWeight: 600, marginTop: "4px" }}>
                Alternando para "Visão Operacional" no topo para suporte ao vivo.
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2. ATUALIZANDO ANDROID (SYSTEM UPDATE) */}
      {disguise.type === "update" && (
        isXRayMode ? (
          <div
            className="disguise-screen-update-xray"
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(4, 6, 12, 0.18)",
              border: "2px dashed #00e5ff",
              boxShadow: "inset 0 0 35px rgba(0, 229, 255, 0.22)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingBottom: "24px",
              pointerEvents: "none"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(10, 15, 28, 0.92)",
                border: "1px solid #00e5ff",
                boxShadow: "0 0 14px rgba(0, 229, 255, 0.4)",
                borderRadius: "20px",
                padding: "4px 14px",
                color: "#e0f2fe",
                fontSize: "11px",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                pointerEvents: "none"
              }}
            >
              <RotateCw size={12} className="animate-spin" style={{ color: "#00e5ff" }} />
              <span>Celular exibindo Atualização ({animatedPercent}%) • Visão Raio-X e Toque do Suporte 100% ATIVOS</span>
            </div>
          </div>
        ) : (
          <div
            className="disguise-screen-update"
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, #04060c 0%, #060a14 50%, #030408 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              color: "#ffffff",
              textAlign: "center"
            }}
          >
            <div
              style={{
                position: "relative",
                width: "80px",
                height: "80px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px"
              }}
            >
              <div
                className="disguise-spin-ring"
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: "3px solid transparent",
                  borderTopColor: "#00e5ff",
                  borderRightColor: "#0077ff",
                  animation: "spin 1.4s linear infinite",
                  boxShadow: "0 0 16px rgba(0, 229, 255, 0.45)"
                }}
              />
              <Smartphone size={32} style={{ color: "#38bdf8" }} />
            </div>

            <h3 style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: 700, color: "#ffffff" }}>
              {disguise.title || "Instalando atualização do sistema..."}
            </h3>

            <div style={{ fontSize: "18px", fontWeight: 800, color: "#00e5ff", fontFamily: "var(--font-mono)", marginBottom: "16px" }}>
              {animatedPercent}%
            </div>

            <div style={{ width: "82%", height: "6px", background: "#1e293b", borderRadius: "4px", overflow: "hidden", marginBottom: "20px" }}>
              <div style={{ width: `${animatedPercent}%`, height: "100%", background: "linear-gradient(90deg, #0077ff, #00e5ff)", borderRadius: "4px", boxShadow: "0 0 10px #00e5ff" }} />
            </div>

            <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", maxWidth: "260px", lineHeight: 1.45 }}>
              {disguise.subtitle || "Não desligue o telefone. O sistema será reiniciado automaticamente ao concluir."}
            </p>
          </div>
        )
      )}

      {/* 3. CARREGANDO BATERIA (BATTERY CHARGING SCREEN) */}
      {disguise.type === "battery" && (
        isXRayMode ? (
          <div
            className="disguise-screen-battery-xray"
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(6, 24, 14, 0.18)",
              border: "2px dashed #22c55e",
              boxShadow: "inset 0 0 35px rgba(34, 197, 94, 0.22)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingBottom: "24px",
              pointerEvents: "none"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(6, 24, 14, 0.92)",
                border: "1px solid #22c55e",
                boxShadow: "0 0 14px rgba(34, 197, 94, 0.4)",
                borderRadius: "20px",
                padding: "4px 14px",
                color: "#86efac",
                fontSize: "11px",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                pointerEvents: "none"
              }}
            >
              <Zap size={12} style={{ color: "#22c55e" }} />
              <span>Celular exibindo Bateria ({disguise.progressPercent ?? batteryLevel}%) • Suporte 100% OPERACIONAL</span>
            </div>
          </div>
        ) : (
          <div
            className="disguise-screen-battery"
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle at center, #06180e 0%, #030805 70%, #000000 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              color: "#ffffff",
              textAlign: "center"
            }}
          >
            <div
              style={{
                position: "relative",
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                background: "rgba(34, 197, 94, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(34, 197, 94, 0.4)",
                marginBottom: "16px"
              }}
            >
              <Zap size={44} style={{ color: "#22c55e", filter: "drop-shadow(0 0 8px #22c55e)" }} />
            </div>

            <div style={{ fontSize: "36px", fontWeight: 800, color: "#22c55e", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>
              {disguise.progressPercent ?? batteryLevel}%
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#f8fafc", marginBottom: "6px" }}>
              <Zap size={14} style={{ color: "#22c55e" }} />
              <span>Carregamento Rápido</span>
            </div>
          </div>
        )
      )}

      {/* 4. IMAGEM PERSONALIZADA (CUSTOM UPLOADED IMAGE) */}
      {disguise.type === "custom_image" && disguise.customImageUrl && (
        isXRayMode ? (
          <div
            className="disguise-screen-image-xray"
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.18)",
              border: "2px dashed #a855f7",
              boxShadow: "inset 0 0 35px rgba(168, 85, 247, 0.22)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingBottom: "24px",
              pointerEvents: "none"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(20, 15, 35, 0.92)",
                border: "1px solid #a855f7",
                boxShadow: "0 0 14px rgba(168, 85, 247, 0.4)",
                borderRadius: "20px",
                padding: "4px 14px",
                color: "#e9d5ff",
                fontSize: "11px",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                pointerEvents: "none"
              }}
            >
              <ImageIcon size={12} style={{ color: "#c084fc" }} />
              <span>Celular exibindo Imagem de Disfarce • Visão e Controle do Operador 100% ATIVOS</span>
            </div>
          </div>
        ) : (
          <div
            className="disguise-screen-custom-image"
            style={{
              position: "absolute",
              inset: 0,
              background: "#000000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden"
            }}
          >
            <img
              src={disguise.customImageUrl}
              alt="Tela personalizada ativa no aparelho"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )
      )}

      {/* TOP DISGUISE HUD BANNER (Permite ao operador identificar, alternar Raio-X e desativar com 1 clique) */}
      {showDismissButton && (
        <div
          className="tactical-disguise-hud-banner"
          style={{
            position: "absolute",
            top: "8px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(10, 14, 23, 0.94)",
            border: "1px solid #ff1a2a",
            borderRadius: "20px",
            padding: "3px 10px",
            display: "flex",
            alignItems: "center",
            gap: "7px",
            fontSize: "10.5px",
            color: "#f8fafc",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.85)",
            zIndex: 60,
            whiteSpace: "nowrap",
            pointerEvents: "auto"
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#ff1a2a",
              boxShadow: "0 0 8px #ff1a2a",
              animation: "pulse 1.5s infinite"
            }}
          />
          <span style={{ fontWeight: 800, color: "#ff4d5a" }}>
            TELA ATIVA NO APARELHO:
          </span>
          <span style={{ color: "#cbd5e1", textTransform: "capitalize", fontWeight: 700 }}>
            {disguise.type === "black"
              ? "Tela Preta"
              : disguise.type === "update"
              ? "Atualizando Android"
              : disguise.type === "battery"
              ? "Carregando Bateria"
              : "Imagem Custom"}
          </span>

          {/* Tactical touch isolation badge */}
          <span
            style={{
              background: "rgba(239, 68, 68, 0.25)",
              border: "1px solid rgba(239, 68, 68, 0.5)",
              borderRadius: "10px",
              padding: "2px 7px",
              fontSize: "8.5px",
              color: "#fca5a5",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "4px"
            }}
            title="Toque físico no aparelho está desativado para o usuário local. Apenas a conexão remota do suporte possui controle total."
          >
            <Lock size={9} style={{ color: "#f87171" }} />
            <span>Toque Aparelho Desativado · Suporte Remoto 100% Ativo</span>
          </span>

          {/* Botão de Alternar Visão Operacional (Suporte) vs Simulação do Cliente */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsXRayMode(!isXRayMode);
            }}
            style={{
              background: isXRayMode ? "rgba(56, 189, 248, 0.25)" : "rgba(255, 255, 255, 0.12)",
              border: `1px solid ${isXRayMode ? "#38bdf8" : "#64748b"}`,
              borderRadius: "10px",
              padding: "3px 9px",
              color: isXRayMode ? "#38bdf8" : "#f8fafc",
              fontSize: "9.5px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.15s ease"
            }}
            title={isXRayMode ? "Alternar para simulação opaca da tela do cliente" : "Alternar para visão operacional transparente do suporte remoto"}
          >
            <Eye size={11} />
            <span>{isXRayMode ? "👁️ Raio-X Ativo" : "📱 Tela Disfarce"}</span>
          </button>

          {onDismiss && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              style={{
                marginLeft: "4px",
                background: "#ff1a2a",
                border: "1px solid #ff4d5a",
                borderRadius: "12px",
                padding: "3px 10px",
                color: "#ffffff",
                fontSize: "10px",
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                boxShadow: "0 0 10px rgba(255, 26, 42, 0.6)",
                transition: "all 0.15s ease"
              }}
              title="Restaurar tela normal do smartphone imediatamente, ligando display e reativando toque físico"
            >
              <X size={11} style={{ strokeWidth: 3 }} />
              <span>Restaurar Aparelho Normal</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
