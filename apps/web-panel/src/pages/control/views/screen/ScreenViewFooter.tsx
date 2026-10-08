import React from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  History,
  MessageSquare,
  Send,
  Trash2,
  Zap
} from "lucide-react";
import type { ControlDevice } from "../../types";
import type { QualityProfile } from "./types";

export interface SentHistoryItem {
  id: string;
  text: string;
  timestamp: string;
  appName?: string;
}

export interface ScreenViewFooterProps {
  shellActive: boolean;
  showHistoryDrawer: boolean;
  setShowHistoryDrawer: (v: boolean) => void;
  sentHistory: SentHistoryItem[];
  setSentHistory: (items: SentHistoryItem[]) => void;
  device: ControlDevice;
  handleSendPresetText: (text: string) => void;
  handleSendShellCommand: (e: React.FormEvent) => void;
  command: string;
  setCommand: (v: string) => void;
  handleKeyDownCommandInput: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  showRightSidebar: boolean;
  currentProfile: QualityProfile;
  adaptiveMode: "auto" | "manual";
  liveLatency: number;
  liveSpeed: string;
  showToast: (msg: string, type?: "info" | "success" | "warn") => void;
}

export const ScreenViewFooter: React.FC<ScreenViewFooterProps> = ({
  shellActive,
  showHistoryDrawer,
  setShowHistoryDrawer,
  sentHistory,
  setSentHistory,
  device,
  handleSendPresetText,
  handleSendShellCommand,
  command,
  setCommand,
  handleKeyDownCommandInput,
  showRightSidebar,
  currentProfile,
  adaptiveMode,
  liveLatency,
  liveSpeed,
  showToast
}) => {
  if (!shellActive) return null;

  return (
    <footer className="tactical-footer-shell" style={{ position: "relative" }}>
      {/* Painel Expansível de Histórico de Mensagens / Conversas Enviadas ao Celular */}
      {showHistoryDrawer && (
        <div
          className="tactical-sent-history-drawer"
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            right: 0,
            background: "rgba(9, 12, 20, 0.98)",
            border: "1px solid #1e293b",
            borderBottom: "1px solid #ff1a2a",
            borderRadius: "8px 8px 0 0",
            boxShadow: "0 -8px 24px rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(12px)",
            zIndex: 40,
            maxHeight: "260px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          {/* Header do Histórico */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "7px 12px",
              background: "rgba(15, 23, 42, 0.8)",
              borderBottom: "1px solid #1e293b"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <History size={13} style={{ color: "#38bdf8" }} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#f8fafc", letterSpacing: "0.4px" }}>
                HISTÓRICO DE MENSAGENS E INPUTS ENVIADOS ({sentHistory.length})
              </span>
              <span style={{ fontSize: "9.5px", color: "#64748b" }}>• Digitação via Suporte</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                type="button"
                onClick={() => {
                  setSentHistory([]);
                  try {
                    localStorage.removeItem(`dview_sent_history_${device.id}`);
                  } catch {}
                  showToast("Histórico de mensagens limpo.", "info");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  fontSize: "10px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px"
                }}
                title="Limpar histórico"
              >
                <Trash2 size={11} />
                <span>Limpar</span>
              </button>
              <button
                type="button"
                onClick={() => setShowHistoryDrawer(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "12px",
                  cursor: "pointer",
                  padding: "0 4px"
                }}
                title="Fechar histórico"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Presets Rápidos de Suporte */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              background: "rgba(10, 14, 24, 0.6)",
              borderBottom: "1px solid rgba(30, 41, 59, 0.5)",
              overflowX: "auto",
              whiteSpace: "nowrap"
            }}
          >
            <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#94a3b8" }}>Presets:</span>
            {[
              "Favor confirmar na tela",
              "Aguarde a atualização",
              "Código de rastreamento validado",
              "https://jadlog.com.br",
              "input keyevent 66"
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendPresetText(preset)}
                style={{
                  background: "rgba(30, 41, 59, 0.6)",
                  border: "1px solid #334155",
                  borderRadius: "10px",
                  padding: "1px 7px",
                  fontSize: "9.5px",
                  color: "#cbd5e1",
                  cursor: "pointer"
                }}
              >
                + {preset}
              </button>
            ))}
          </div>

          {/* Lista de Mensagens / Conversas com Rolagem para Baixo */}
          <div
            style={{
              padding: "8px 12px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "6px"
            }}
          >
            {sentHistory.length === 0 ? (
              <div style={{ textAlign: "center", padding: "16px", color: "#64748b", fontSize: "11px" }}>
                Nenhuma mensagem ou comando enviado recentemente. Digite abaixo e pressione Enviar.
              </div>
            ) : (
              sentHistory.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "8px",
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid #1e293b",
                    borderRadius: "6px",
                    padding: "6px 9px"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "9px", fontWeight: 700, color: "#ff4d5a", fontFamily: "var(--font-mono)" }}>
                        OP / SUPORTE
                      </span>
                      <span style={{ fontSize: "9px", color: "#64748b" }}>{item.timestamp}</span>
                      {item.appName && (
                        <span style={{ fontSize: "9px", color: "#38bdf8", background: "rgba(56, 189, 248, 0.12)", padding: "0 4px", borderRadius: "3px" }}>
                          {item.appName}
                        </span>
                      )}
                      <span style={{ fontSize: "9px", color: "#22c55e", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                        <Check size={9} /> Injetado
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#f8fafc",
                        fontFamily: "var(--font-mono)",
                        wordBreak: "break-all"
                      }}
                    >
                      {item.text}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(item.text);
                        showToast("Texto copiado para a área de transferência", "success");
                      }}
                      style={{
                        background: "transparent",
                        border: "1px solid #334155",
                        borderRadius: "4px",
                        padding: "2px 5px",
                        color: "#94a3b8",
                        fontSize: "9px",
                        cursor: "pointer"
                      }}
                      title="Copiar texto"
                    >
                      <Copy size={10} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCommand(item.text);
                        showToast("Texto inserido no terminal pronto para reenvio", "info");
                      }}
                      style={{
                        background: "rgba(56, 189, 248, 0.15)",
                        border: "1px solid rgba(56, 189, 248, 0.4)",
                        borderRadius: "4px",
                        padding: "2px 6px",
                        color: "#38bdf8",
                        fontSize: "9px",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                      title="Reenviar este texto para o aparelho"
                    >
                      Reenviar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <form className="tactical-shell-command-form" onSubmit={handleSendShellCommand} style={{ width: "100%", margin: 0 }}>
        {/* O Olho Cibernético e Logo do Sistema DVIEW com Glow Carmesim */}
        <div
          className="tactical-cmd-prompt-badge"
          title="DVIEW Console - Logo Oficial do Sistema com Olho Cibernético"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "2px 6px",
            background: "rgba(255, 26, 42, 0.12)",
            border: "1px solid rgba(255, 26, 42, 0.35)",
            borderRadius: "5px",
            flexShrink: 0
          }}
        >
          <img
            src="./dview-logo.jpg"
            alt="DVIEW Emblem"
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "1px solid #ff1a2a",
              boxShadow: "0 0 6px rgba(255, 26, 42, 0.7)"
            }}
            onError={(e) => {
              (e.currentTarget as any).style.display = "none";
            }}
          />
          <Eye size={12} style={{ color: "#ff1a2a" }} />
          {!showRightSidebar && (
            <span style={{ fontWeight: 800, color: "#ff4d5a", letterSpacing: "0.5px" }}>DVIEW:~$</span>
          )}
        </div>

        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDownCommandInput}
          placeholder={
            showRightSidebar
              ? "Digite texto para enviar ao aparelho (Enter para enviar)..."
              : "Digite texto para digitar no celular ou comando shell (↑/↓ histórico, Enter para enviar)..."
          }
          className="tactical-cmd-input"
          style={{ flex: 1 }}
        />

        {/* Telemetria e Botões de Ação */}
        {!showRightSidebar && (
          <>
            <div
              className="tactical-abr-footer-telemetry"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "rgba(15, 23, 42, 0.75)",
                border: `1px solid ${currentProfile.color}44`,
                borderRadius: "5px",
                padding: "3px 8px",
                fontSize: "10.5px",
                fontFamily: "var(--font-mono)",
                color: "#cbd5e1",
                flexShrink: 0
              }}
              title={`Qualidade Adaptativa de Vídeo: ${currentProfile.label} (${currentProfile.resolution}) • Latência de Quadro: ${liveLatency}ms • Vazão: ${liveSpeed} • Modo: ${adaptiveMode === "auto" ? "Adaptativo Automático (ABR)" : "Fixo Manual"}`}
            >
              <Zap size={11} style={{ color: currentProfile.color, flexShrink: 0 }} />
              <span style={{ fontWeight: 800, color: currentProfile.color }}>
                {adaptiveMode === "auto" ? `AUTO ${currentProfile.shortLabel}` : currentProfile.shortLabel}
              </span>
              <span style={{ color: "#64748b" }}>•</span>
              <span style={{ color: liveLatency < 80 ? "#22c55e" : liveLatency < 160 ? "#fbbf24" : "#f87171", fontWeight: 700 }}>
                {liveLatency}ms
              </span>
              <span style={{ color: "#64748b" }}>•</span>
              <span style={{ color: "#94a3b8" }}>{liveSpeed}</span>
            </div>
            <button
              type="button"
              className={`tactical-history-toggle-btn ${showHistoryDrawer ? "active" : ""}`}
              onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
              style={{
                background: showHistoryDrawer ? "rgba(56, 189, 248, 0.2)" : "rgba(15, 23, 42, 0.6)",
                border: `1px solid ${showHistoryDrawer ? "#38bdf8" : "#1e293b"}`,
                borderRadius: "5px",
                padding: "3px 8px",
                color: showHistoryDrawer ? "#38bdf8" : "#cbd5e1",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                flexShrink: 0
              }}
              title="Abrir histórico de conversas e mensagens enviadas ao aparelho"
            >
              <MessageSquare size={12} />
              <span>Histórico ({sentHistory.length})</span>
              {showHistoryDrawer ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            <button type="submit" className="tactical-cmd-submit-btn" title="Enviar texto ao celular" style={{ flexShrink: 0 }}>
              <Send size={13} />
              <span>Enviar</span>
            </button>
          </>
        )}
      </form>
    </footer>
  );
};
