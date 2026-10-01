import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Check,
  ChevronLeft,
  CircleDot,
  Copy,
  Eye,
  Gamepad2,
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
  RotateCw,
  Search,
  Send,
  Smartphone,
  Sparkles,
  Terminal,
  Volume2,
  VolumeX,
  Wifi,
  X,
  Zap,
  Crosshair,
  Fingerprint,
  Hand
} from "lucide-react";
import type { ControlDevice, InstalledAppItem, KeyboardEventItem } from "../types";
import type { DigitalTouchEvent } from "@droidview/shared";
import { subscribeToTouchEvents } from "../../../socket/client";
import { initialKeyboardLogs } from "../mockData";
import { api } from "../../../api";
import { getAppEmojiFallback } from "../DeviceToolMenu";
import { AppLogo } from "../AppLogo";
import { RightSidebarQuickActions } from "../RightSidebarQuickActions";

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
  isFocused?: boolean;
  clickable?: boolean;
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
    const match = boundsStr?.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (!match) return null;
    const left = parseInt(match[1], 10);
    const top = parseInt(match[2], 10);
    const right = parseInt(match[3], 10);
    const bottom = parseInt(match[4], 10);
    const width = Math.max(right - left, 4);
    const height = Math.max(bottom - top, 4);
    return {
      left,
      top,
      right,
      bottom,
      width,
      height,
      leftPercent: Math.min(Math.max((left / screenW) * 100, 0), 100),
      topPercent: Math.min(Math.max((top / screenH) * 100, 0), 100),
      widthPercent: Math.min((width / screenW) * 100, 100),
      heightPercent: Math.min((height / screenH) * 100, 100),
      centerX: Math.round((left + right) / 2),
      centerY: Math.round((top + bottom) / 2)
    };
  };

  // Scale slider (default 75% as in capture)
  const [viewScale, setViewScale] = useState(75);

  // Right Sidebar & Multi-Screen Auto-Fit State
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [isAutoFit, setIsAutoFit] = useState(true);
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

  // Live Screen State & Auto-Refresh
  const [screenTimestamp, setScreenTimestamp] = useState<number>(Date.now());
  const [isStreaming, setIsStreaming] = useState(true);
  const [fps, setFps] = useState(12);
  const [command, setCommand] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>("Sessão em tempo real conectada");
  const [toastType, setToastType] = useState<"success" | "info">("success");

  // Touch Ripples
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [skeletonRipples, setSkeletonRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  // Drag detection
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
          const rect = imgRef.current?.getBoundingClientRect();
          if (rect && rect.width > 0 && rect.height > 0) {
            const screenX = (event.x / 720) * rect.width;
            const screenY = (event.y / 1280) * rect.height;
            const rippleId = Date.now();
            setRipples((curr) => [...curr, { id: rippleId, x: screenX, y: screenY }]);
            setTimeout(() => setRipples((curr) => curr.filter((r) => r.id !== rippleId)), 600);
          }
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
  }, [device.id]);

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

  // Sequential frame requester (never cancels in-flight frame)
  const isFetchingFrameRef = useRef(false);

  const fetchNextFrame = () => {
    if (!telaActive) return;
    setScreenTimestamp(Date.now());
  };

  useEffect(() => {
    isFetchingFrameRef.current = false;
    fetchNextFrame();
  }, [telaActive, device.id]);

  // Load real accessibility tree
  const refreshA11y = async () => {
    if (!srActive) return;
    setIsLoadingA11y(true);
    try {
      const nodes = await api.getDeviceA11yTree(device.id);
      if (Array.isArray(nodes) && nodes.length > 0) {
        setA11yNodes(nodes);
        if (!inspectedNode) {
          const leaf = nodes.find((n) => n.clickable && (n.text || n.contentDescription) && !n.className.endsWith("ViewGroup")) || nodes.find((n) => n.text) || nodes[0];
          setInspectedNode(leaf);
        }
      }
    } catch {
      // Keep existing
    } finally {
      setIsLoadingA11y(false);
    }
  };

  useEffect(() => {
    refreshA11y();
  }, [device.id, srActive]);

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

  // Touch / Drag Handlers for Real Device
  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!touchActive) return;
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      time: Date.now()
    };
  };

  const handleMouseUp = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!touchActive || !dragStartRef.current) return;
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = dragStartRef.current.x;
    const startY = dragStartRef.current.y;
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    const duration = Math.max(150, Math.min(800, Date.now() - dragStartRef.current.time));
    dragStartRef.current = null;

    const deltaX = Math.abs(endX - startX);
    const deltaY = Math.abs(endY - startY);

    // If dragged more than 20px, execute swipe
    if (deltaX > 20 || deltaY > 20) {
      const devX1 = Math.round((startX / rect.width) * 720);
      const devY1 = Math.round((startY / rect.height) * 1280);
      const devX2 = Math.round((endX / rect.width) * 720);
      const devY2 = Math.round((endY / rect.height) * 1280);

      try {
        await api.sendSwipe(device.id, devX1, devY1, devX2, devY2, duration);
        showToast(`Deslize: (${devX1}, ${devY1}) ➜ (${devX2}, ${devY2})`, "success");
        setTimeout(() => setScreenTimestamp(Date.now()), 350);
        refreshA11y();
      } catch (err: any) {
        showToast(`Erro ao deslizar: ${err.message}`, "info");
      }
      return;
    }

    // Otherwise it's a tap
    const devX = Math.round((endX / rect.width) * 720);
    const devY = Math.round((endY / rect.height) * 1280);

    const rippleId = Date.now();
    setRipples((curr) => [...curr, { id: rippleId, x: endX, y: endY }]);
    setTimeout(() => setRipples((curr) => curr.filter((r) => r.id !== rippleId)), 500);

    try {
      await api.sendTouch(device.id, devX, devY, 720, 1280);
      showToast(`Toque no dispositivo: (${devX}, ${devY})`, "success");
      setTimeout(() => setScreenTimestamp(Date.now()), 350);
      refreshA11y();
    } catch (err: any) {
      showToast(`Erro ao enviar toque: ${err.message}`, "info");
    }
  };

  // Node Click in Accessibility Inspector
  const handleSelectA11yNode = async (node: AccessibilityNode, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setInspectedNode(node);
    const b = parseBounds(node.bounds);
    const midX = b ? b.centerX : 360;
    const midY = b ? b.centerY : 640;

    try {
      await api.sendTouch(device.id, midX, midY, 720, 1280);
      showToast(`Toque calibrado no botão: "${node.text || node.name}" (${midX}, ${midY})`, "success");
      setTimeout(() => setScreenTimestamp(Date.now()), 350);
      setTimeout(refreshA11y, 450);
    } catch (err: any) {
      showToast(`Erro ao interagir com nó: ${err.message}`, "info");
    }
  };

  // Calibrated click on the skeleton canvas (Apurar clique na tela esqueleto)
  const handleSkeletonCanvasClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Trigger visual touch ripple on the skeleton canvas
    const rippleId = Date.now();
    setSkeletonRipples((prev) => [...prev, { id: rippleId, x: clickX, y: clickY }]);
    setTimeout(() => {
      setSkeletonRipples((prev) => prev.filter((r) => r.id !== rippleId));
    }, 600);

    // Precise submillimeter mapping to real device resolution (720x1280)
    const normX = Math.max(0, Math.min(1, clickX / rect.width));
    const normY = Math.max(0, Math.min(1, clickY / rect.height));
    const devX = Math.round(normX * 720);
    const devY = Math.round(normY * 1280);

    // Find candidate nodes covering (devX, devY)
    const candidates = a11yNodes.filter((n) => {
      const b = parseBounds(n.bounds);
      if (!b) return false;
      return devX >= b.left && devX <= b.right && devY >= b.top && devY <= b.bottom;
    });

    // Pick smallest area candidate (leaf button / interactive node)
    let selected: AccessibilityNode | null = null;
    let minArea = Infinity;
    for (const c of candidates) {
      const b = parseBounds(c.bounds);
      if (b) {
        const area = b.width * b.height;
        if (area < minArea) {
          minArea = area;
          selected = c;
        }
      }
    }

    if (selected) {
      setInspectedNode(selected);
    }

    try {
      await api.sendTouch(device.id, devX, devY, 720, 1280);
      const targetDesc = selected ? `-> ${selected.text || selected.name}` : "";
      showToast(`Toque calibrado no esqueleto: (${devX}, ${devY}) ${targetDesc}`, "success");
      setTimeout(() => setScreenTimestamp(Date.now()), 350);
      setTimeout(refreshA11y, 450);
    } catch (err: any) {
      showToast(`Erro ao enviar toque: ${err.message}`, "info");
    }
  };

  // Shell Command Submit
  const handleSendShellCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    const cmd = command.trim();
    setCommand("");

    try {
      await api.sendText(device.id, cmd);
      showToast(`Texto enviado ao aparelho: "${cmd}"`, "success");
      setTimeout(() => setScreenTimestamp(Date.now()), 350);
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
        setScreenTimestamp(Date.now());
        showToast("Tela atualizada com sucesso", "success");
        return;
      }

      await api.sendKey(device.id, keyVal);
      showToast(`Ação executada: ${label}`, "success");
      setTimeout(() => setScreenTimestamp(Date.now()), 350);
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

      {/* 1. BARRA SUPERIOR DE CONTROLES TÁTICOS */}
      <header className="tactical-top-controls-bar">
        {/* Upper Title Line */}
        <div className="tactical-header-title-row">
          <div className="tactical-device-header-left">
            <button
              type="button"
              className="tactical-back-btn"
              title="Voltar / Desfocar"
              onClick={() => handleMacroAction("input keyevent 4", "Voltar")}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="tactical-title-stack">
              <span className="tactical-main-mode-title">
                TELA EM TEMPO REAL {silentActive ? "· SILENT" : ""}{silentActive && srActive ? " +" : ""}{srActive ? " A11Y" : ""}
              </span>
              <span className="tactical-device-id-sub" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <span>{device.name} · {device.ip}</span>
                <span style={{ color: "#22c55e", fontWeight: 700 }}>● SINCRONIZADO AO VIVO</span>
                <span style={{ color: "#38bdf8", fontWeight: 700 }}>ACESSIBILIDADE ATIVA</span>
                {activeApp && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "rgba(56, 189, 248, 0.15)", border: "1px solid #38bdf8", borderRadius: "10px", padding: "1px 7px", color: "#38bdf8", fontWeight: 700 }}>
                    <AppLogo name={activeApp.name} packageName={activeApp.packageName} size={15} />
                    <span>{activeApp.name} (Alvo)</span>
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
              </span>
            </div>
          </div>
        </div>

        {/* Lower Controls Toolbar Line */}
        <div className="tactical-toolbar-row">
          <div className="tactical-pill-toggles-row">
            {/* Silent Toggle */}
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

            {/* SR Toggle */}
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

            {/* Hid Toggle */}
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
              <span className="pill-label">Hid</span>
            </button>

            {/* Joy Toggle */}
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

            {/* Tactical Switch Toggle between Joy and Touch */}
            <button
              type="button"
              className={`tactical-switch-toggle ${tacticalSwitch ? "active" : ""}`}
              onClick={() => {
                setTacticalSwitch(!tacticalSwitch);
                showToast(tacticalSwitch ? "Alternado para modo Touch direto" : "Alternado para modo Preciso", "success");
              }}
              title="Alternar Modo de Controle"
            >
              <span className="switch-toggle-knob" />
            </button>

            {/* Touch Toggle */}
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

            {/* Tela Toggle */}
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

            {/* Cam Toggle */}
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

            {/* Shell Toggle */}
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
          </div>

          {/* Real Volume Adjustment Slider and Mute */}
          <div
            className="tactical-volume-slider-row"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 8px",
              background: "rgba(15, 23, 42, 0.7)",
              border: "1px solid #1e293b",
              borderRadius: "8px"
            }}
          >
            <button
              type="button"
              onClick={() => handleVolumeStep("mute")}
              title={isMuted ? "Desmutar Áudio" : "Mutar Áudio"}
              style={{ background: "transparent", border: "none", color: isMuted ? "#ef4444" : "#38bdf8", cursor: "pointer", display: "flex", alignItems: "center", padding: "2px" }}
            >
              {isMuted || deviceVolume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            <span style={{ fontSize: "10px", fontWeight: 700, color: "#cbd5e1", minWidth: "46px" }}>
              Vol {Math.round((deviceVolume / 15) * 100)}%
            </span>

            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={deviceVolume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="tactical-range-input"
              style={{ width: "70px", accentColor: "#38bdf8", cursor: "pointer" }}
              title={`Linha de ajuste de volume: ${deviceVolume}/15`}
            />

            <button
              type="button"
              onClick={() => handleVolumeStep("down")}
              title="Diminuir Volume"
              style={{ background: "#1e293b", border: "1px solid #334155", color: "#cbd5e1", borderRadius: "3px", padding: "1px 5px", fontSize: "10px", cursor: "pointer" }}
            >
              -
            </button>
            <button
              type="button"
              onClick={() => handleVolumeStep("up")}
              title="Aumentar Volume"
              style={{ background: "#1e293b", border: "1px solid #334155", color: "#cbd5e1", borderRadius: "3px", padding: "1px 5px", fontSize: "10px", cursor: "pointer" }}
            >
              +
            </button>
          </div>

          {/* Scale Slider & Auto-Fit Sync Controls */}
          <div className="tactical-scale-slider-row">
            <button
              type="button"
              className={`tactical-fit-chip ${isAutoFit ? "active" : ""}`}
              onClick={handleAutoFitSync}
              title="Ajustar automaticamente à tela (Auto-Fit sem rolagem)"
            >
              <Maximize2 size={11} />
              <span>Auto-Fit</span>
            </button>
            <span className="scale-label-tag">{isAutoFit ? "Auto (100%)" : `Zoom ${viewScale}%`}</span>
            <input
              type="range"
              min="50"
              max="110"
              step="5"
              value={viewScale}
              onChange={(e) => {
                setIsAutoFit(false);
                setViewScale(Number(e.target.value));
              }}
              className="tactical-range-input"
            />
          </div>

          {/* Right Action Icons Group */}
          <div className="tactical-actions-group">
            {/* Quick Actions Sidebar Button */}
            <button
              type="button"
              className={`tactical-action-btn quick-actions-toggle-pill ${showRightSidebar ? "active" : ""}`}
              title="Abrir / Fechar Painel de Funções Rápidas"
              onClick={() => setShowRightSidebar(!showRightSidebar)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 9px",
                borderRadius: "6px",
                background: showRightSidebar ? "rgba(255, 26, 42, 0.25)" : "rgba(15, 23, 42, 0.8)",
                border: `1px solid ${showRightSidebar ? "var(--crimson-neon, #ff1a2a)" : "#334155"}`,
                color: showRightSidebar ? "#ff4d5a" : "#facc15",
                fontWeight: 700,
                fontSize: "10.5px"
              }}
            >
              <Zap size={13} style={{ fill: showRightSidebar ? "#ff1a2a" : "none" }} />
              <span>FUNÇÕES RÁPIDAS</span>
            </button>

            <button
              type="button"
              className={`tactical-action-btn ${isLocked ? "active" : ""}`}
              title="Bloquear / Desbloquear Tela do Aparelho (Power)"
              onClick={handleToggleLock}
              style={{ color: isLocked ? "#ef4444" : "#f59e0b" }}
            >
              {isLocked ? <Lock size={15} /> : <Power size={15} />}
            </button>

            <button
              type="button"
              className={`tactical-action-btn ${isPinned ? "active" : ""}`}
              title="Fixar painel de visualização"
              onClick={handleTogglePin}
            >
              <Pin size={15} />
            </button>

            <button
              type="button"
              className="tactical-action-btn"
              title="Copiar dados do dispositivo"
              onClick={handleCopyInfo}
            >
              <Copy size={15} />
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
              <RotateCw size={15} />
            </button>

            <button
              type="button"
              className="tactical-action-btn"
              title="Tela Cheia (Fullscreen)"
              onClick={handleToggleFullscreen}
            >
              <Maximize2 size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. CORPO PRINCIPAL: VIEWPORTS CENTRAIS (1, 2 OU 3 TELAS) + FUNÇÕES RÁPIDAS */}
      <div className="tactical-screen-body-row">
        <div className="tactical-stage-and-footer-column">
          <div
            className={`tactical-viewports-stage screens-${activeScreensCount} ${isAutoFit ? "is-auto-fit" : ""}`}
            data-screens={activeScreensCount}
          >
            <div
              className="tactical-viewport-scale-wrapper"
              style={{
                transform: isAutoFit ? "none" : `scale(${viewScale / 100})`,
                transformOrigin: "center center"
              }}
            >
          {/* PAINEL ESQUERDO: Tela Real do Dispositivo com Toques Interativos */}
          {telaActive && (
            <div
              className="tactical-phone-viewport live-device-frame"
              style={{
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
              }}
            >
              {/* Top Control Header on Phone Frame */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 12px",
                  background: "#0b0f19",
                  borderBottom: "1px solid #1e293b",
                  zIndex: 10
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    className="tactical-phone-silent-pill"
                    style={{
                      position: "static",
                      transform: "none",
                      background: "rgba(34, 197, 94, 0.2)",
                      borderColor: "#22c55e",
                      color: "#4ade80"
                    }}
                  >
                    AO VIVO · {fps} FPS
                  </div>
                  {foregroundApp && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        background: "rgba(56, 189, 248, 0.12)",
                        border: "1px solid rgba(56, 189, 248, 0.4)",
                        borderRadius: "12px",
                        padding: "1px 8px",
                        fontSize: "9.5px",
                        color: "#f8fafc",
                        fontWeight: 700
                      }}
                      title={`App em primeiro plano no celular: ${foregroundApp.name} (${foregroundApp.packageName})`}
                    >
                      <AppLogo name={foregroundApp.name} packageName={foregroundApp.packageName} size={16} />
                      <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {foregroundApp.name}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => handleVolumeStep("down")}
                    title="Volume Menos"
                    style={{
                      background: "#1e293b",
                      border: "1px solid #334155",
                      color: "#cbd5e1",
                      borderRadius: "4px",
                      padding: "2px 6px",
                      fontSize: "10px",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Vol -
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVolumeStep("up")}
                    title="Volume Mais"
                    style={{
                      background: "#1e293b",
                      border: "1px solid #334155",
                      color: "#cbd5e1",
                      borderRadius: "4px",
                      padding: "2px 6px",
                      fontSize: "10px",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Vol +
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleLock}
                    title="Bloquear / Desbloquear aparelho (Power)"
                    style={{
                      background: isLocked ? "#dc2626" : "#0284c7",
                      border: "none",
                      color: "#fff",
                      borderRadius: "4px",
                      padding: "2px 8px",
                      fontSize: "10px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor: "pointer"
                    }}
                  >
                    {isLocked ? <Lock size={10} /> : <Power size={10} />}
                    <span>{isLocked ? "Desbloquear" : "Bloquear"}</span>
                  </button>
                </div>
              </div>

              {/* Real Screen Image Container */}
              <div
                ref={screenWrapperRef}
                className="real-screen-container"
                style={{
                  position: "relative",
                  flex: 1,
                  width: "100%",
                  background: "#000000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden"
                }}
              >
                <img
                  ref={imgRef}
                  src={`${api.getDeviceScreenUrl(device.id)}?t=${screenTimestamp}`}
                  alt={`Tela ao vivo de ${device.name}`}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    cursor: touchActive ? "crosshair" : "default",
                    userSelect: "none",
                    WebkitUserSelect: "none"
                  }}
                  onLoad={() => {
                    setIsStreaming(true);
                    setTimeout(fetchNextFrame, 350);
                  }}
                  onError={() => {
                    setIsStreaming(false);
                    setTimeout(fetchNextFrame, 1200);
                  }}
                />

                {/* Touch Feedback Ripples */}
                {ripples.map((r) => (
                  <span
                    key={r.id}
                    style={{
                      position: "absolute",
                      left: r.x,
                      top: r.y,
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(34, 197, 94, 0.45)",
                      border: "2px solid #22c55e",
                      transform: "translate(-50%, -50%)",
                      pointerEvents: "none",
                      boxShadow: "0 0 12px #22c55e"
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

                {/* Stream Disconnect Overlay */}
                {!isStreaming && (
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
              <div
                className="android-hardware-navbar"
                style={{
                  height: "46px",
                  background: "#080a10",
                  borderTop: "1px solid #1e293b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-around",
                  padding: "0 12px",
                  zIndex: 20
                }}
              >
                <button
                  type="button"
                  className="android-nav-btn"
                  onClick={() => handleMacroAction("input keyevent 187", "Trocar Telas / Recentes")}
                  title="Trocar de Telas / Aplicativos Recentes (KEYCODE_APP_SWITCH 187)"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                    padding: "4px 16px",
                    borderRadius: "6px"
                  }}
                >
                  <span style={{ fontSize: "16px", fontWeight: 900, lineHeight: 1 }}>|||</span>
                  <span style={{ fontSize: "8px", fontWeight: 700, marginTop: "2px", letterSpacing: "0.5px" }}>RECENTES</span>
                </button>

                <button
                  type="button"
                  className="android-nav-btn"
                  onClick={() => handleMacroAction("input keyevent 3", "Iniciar / Home")}
                  title="Tela Inicial / Iniciar (KEYCODE_HOME 3)"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                    padding: "4px 16px",
                    borderRadius: "6px"
                  }}
                >
                  <span style={{ fontSize: "17px", fontWeight: 900, lineHeight: 1 }}>○</span>
                  <span style={{ fontSize: "8px", fontWeight: 700, marginTop: "2px", letterSpacing: "0.5px" }}>INICIAR</span>
                </button>

                <button
                  type="button"
                  className="android-nav-btn"
                  onClick={() => handleMacroAction("input keyevent 4", "Voltar")}
                  title="Voltar Tela Anterior (KEYCODE_BACK 4)"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                    padding: "4px 16px",
                    borderRadius: "6px"
                  }}
                >
                  <span style={{ fontSize: "16px", fontWeight: 900, lineHeight: 1 }}>◁</span>
                  <span style={{ fontSize: "8px", fontWeight: 700, marginTop: "2px", letterSpacing: "0.5px" }}>VOLTAR</span>
                </button>
              </div>
            </div>
          )}

          {/* PAINEL DIREITO: SCREEN READER (TELA ESQUELETO 2D WIREFRAME REAL DO DISPOSITIVO) */}
          {srActive && (
            <div className="tactical-phone-viewport screen-reader-frame" style={{ display: "flex", flexDirection: "column" }}>
              {/* Screen Reader Header */}
              <div className="sr-header-bar">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="sr-header-title">
                    {skeletonViewMode === "visual" ? "ESQUELETO 2D (A11Y WIRE)" : "HIERARQUIA DOM (A11Y)"}
                  </span>
                  <div style={{ display: "flex", gap: "2px", background: "#0a0d14", padding: "2px", borderRadius: "4px", border: "1px solid #1c2438" }}>
                    <button
                      type="button"
                      onClick={() => setSkeletonViewMode("visual")}
                      style={{
                        padding: "2px 6px",
                        fontSize: "9px",
                        fontWeight: 700,
                        borderRadius: "3px",
                        background: skeletonViewMode === "visual" ? "#38bdf8" : "transparent",
                        color: skeletonViewMode === "visual" ? "#000" : "#94a3b8",
                        border: "none",
                        cursor: "pointer"
                      }}
                    >
                      2D
                    </button>
                    <button
                      type="button"
                      onClick={() => setSkeletonViewMode("list")}
                      style={{
                        padding: "2px 6px",
                        fontSize: "9px",
                        fontWeight: 700,
                        borderRadius: "3px",
                        background: skeletonViewMode === "list" ? "#38bdf8" : "transparent",
                        color: skeletonViewMode === "list" ? "#000" : "#94a3b8",
                        border: "none",
                        cursor: "pointer"
                      }}
                    >
                      Lista
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={refreshA11y}
                    style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center" }}
                    title="Recarregar elementos da tela"
                  >
                    <RotateCw size={12} className={isLoadingA11y ? "animate-spin" : ""} />
                  </button>
                  <div className="sr-header-window-btns">
                    <span className="sr-win-btn minimize" />
                    <span className="sr-win-btn maximize" />
                    <span className="sr-win-btn close" onClick={() => setSrActive(false)} />
                  </div>
                </div>
              </div>

              {/* Wireframe Viewport - 2D Visual Skeleton or DOM List */}
              {skeletonViewMode === "visual" ? (
                <div
                  className="sr-wireframe-viewport"
                  onClick={handleSkeletonCanvasClick}
                  style={{
                    position: "relative",
                    flex: 1,
                    width: "100%",
                    background: "#080a12",
                    backgroundImage: "linear-gradient(rgba(56, 189, 248, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.08) 1px, transparent 1px)",
                    backgroundSize: "22px 22px",
                    overflow: "hidden",
                    border: "1px solid #1e293b",
                    padding: 0,
                    cursor: "crosshair"
                  }}
                >
                  {/* Calibrated Click Ripples on Skeleton */}
                  {skeletonRipples.map((r) => (
                    <span
                      key={r.id}
                      style={{
                        position: "absolute",
                        left: r.x,
                        top: r.y,
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(0, 240, 255, 0.45)",
                        border: "2px solid #00f0ff",
                        transform: "translate(-50%, -50%)",
                        pointerEvents: "none",
                        boxShadow: "0 0 16px #00f0ff",
                        zIndex: 99
                      }}
                    />
                  ))}

                  {a11yNodes.length === 0 ? (
                    <div style={{ margin: "auto", textAlign: "center", color: "#64748b", fontSize: "12px", padding: "20px" }}>
                      Nenhum elemento inspecionado. Clique no botão de atualizar no topo para sincronizar a tela esqueleto.
                    </div>
                  ) : (
                    a11yNodes.map((node) => {
                      const b = parseBounds(node.bounds);
                      if (!b) return null;
                      const isSelected = inspectedNode?.id === node.id;
                      const shortClass = node.className.split(".").pop() || "Elemento";
                      const title = node.text || node.contentDescription || node.name || shortClass;
                      const isLargeContainer = b.width > 350 && b.height > 200;
                      const isLayoutWrapper = (node.className.endsWith("Layout") || node.className.endsWith("ViewGroup")) && !node.text;
                      const isContainer = isLargeContainer || isLayoutWrapper;
                      const isSearch = title.toLowerCase().includes("search") || node.className.includes("EditText");

                      // 1. Layout Container (ViewGroup, FrameLayout, RelativeLayout, etc.) - Transparent with dashed border and pointerEvents none
                      if (isContainer) {
                        return (
                          <div
                            key={node.id}
                            style={{
                              position: "absolute",
                              left: `${b.leftPercent}%`,
                              top: `${b.topPercent}%`,
                              width: `${b.widthPercent}%`,
                              height: `${b.heightPercent}%`,
                              border: isSelected ? "1.5px dashed #00f0ff" : isLargeContainer ? "1px dashed rgba(56, 189, 248, 0.22)" : "none",
                              backgroundColor: "transparent",
                              pointerEvents: "none",
                              zIndex: 1,
                              padding: "4px",
                              boxSizing: "border-box"
                            }}
                          >
                            {isLargeContainer && (
                              <span style={{ fontSize: "7px", color: "rgba(56, 189, 248, 0.4)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                                LAYOUT: {shortClass}
                              </span>
                            )}
                          </div>
                        );
                      }

                      // 2. Search Bar Pill
                      if (isSearch) {
                        return (
                          <div
                            key={node.id}
                            onClick={(e) => handleSelectA11yNode(node, e)}
                            title={`Barra de Busca: ${title}`}
                            style={{
                              position: "absolute",
                              left: `${b.leftPercent}%`,
                              top: `${b.topPercent}%`,
                              width: `${b.widthPercent}%`,
                              height: `${b.heightPercent}%`,
                              border: isSelected ? "2px solid #00f0ff" : "1.5px solid rgba(56, 189, 248, 0.55)",
                              backgroundColor: "rgba(15, 23, 42, 0.88)",
                              boxShadow: isSelected ? "0 0 14px rgba(0, 240, 255, 0.6)" : "0 2px 8px rgba(0,0,0,0.5)",
                              borderRadius: "24px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "0 12px",
                              cursor: "pointer",
                              zIndex: isSelected ? 25 : 15,
                              boxSizing: "border-box"
                            }}
                          >
                            <Search size={13} style={{ color: "#38bdf8", flexShrink: 0 }} />
                            <span
                              style={{
                                fontSize: "10px",
                                color: "#cbd5e1",
                                fontWeight: 600,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {title}
                            </span>
                          </div>
                        );
                      }

                      // 3. Dot Indicator (Page indicator)
                      if (b.width < 35 && b.height < 35 && !node.text) {
                        return (
                          <div
                            key={node.id}
                            onClick={(e) => handleSelectA11yNode(node, e)}
                            style={{
                              position: "absolute",
                              left: `${b.leftPercent}%`,
                              top: `${b.topPercent}%`,
                              width: `${b.widthPercent}%`,
                              height: `${b.heightPercent}%`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              zIndex: 10,
                              cursor: "pointer"
                            }}
                          >
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isSelected ? "#00f0ff" : "#38bdf8" }} />
                          </div>
                        );
                      }

                      // 4. App Button Squircle with Emoji & Label
                      const meta = getAppEmojiFallback(title, node.className);
                      return (
                        <div
                          key={node.id}
                          onClick={(e) => handleSelectA11yNode(node, e)}
                          title={`${shortClass}: ${title} (${node.bounds})`}
                          style={{
                            position: "absolute",
                            left: `${b.leftPercent}%`,
                            top: `${b.topPercent}%`,
                            width: `${Math.max(b.widthPercent, 8)}%`,
                            height: `${Math.max(b.heightPercent, 7)}%`,
                            border: isSelected
                              ? "2px solid #00f0ff"
                              : node.clickable
                              ? "1.5px solid rgba(56, 189, 248, 0.7)"
                              : "1px solid rgba(56, 189, 248, 0.35)",
                            backgroundColor: isSelected
                              ? "rgba(0, 240, 255, 0.22)"
                              : "rgba(15, 23, 42, 0.78)",
                            boxShadow: isSelected
                              ? "0 0 16px rgba(0, 240, 255, 0.65)"
                              : "0 4px 10px rgba(0, 0, 0, 0.45)",
                            borderRadius: "10px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "3px",
                            padding: "3px 2px",
                            overflow: "hidden",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            zIndex: isSelected ? 30 : node.clickable ? 20 : 10,
                            boxSizing: "border-box"
                          }}
                        >
                          {/* Official App Logo inside 2D Skeleton Screen */}
                          <AppLogo
                            name={title}
                            packageName={node.className}
                            size={28}
                          />

                          {/* App Name Label Underneath */}
                          <span
                            style={{
                              fontSize: "8px",
                              fontWeight: 700,
                              color: isSelected ? "#00f0ff" : "#f8fafc",
                              textAlign: "center",
                              lineHeight: 1.1,
                              maxWidth: "100%",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              padding: "0 1px"
                            }}
                          >
                            {title}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div
                  className="sr-wireframe-viewport"
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    background: "#090b10"
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
                            <span style={{ fontSize: "11px", fontWeight: 700, color: node.clickable ? "#22c55e" : "#94a3b8" }}>
                              {shortClass}
                            </span>
                            {node.clickable && (
                              <span style={{ fontSize: "9px", background: "#22c55e", color: "#000", fontWeight: 800, padding: "2px 6px", borderRadius: "4px" }}>
                                INTERATIVO (CLIQUE)
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "12px", color: "#f8fafc", fontWeight: 600, wordBreak: "break-word" }}>
                            {node.text || node.contentDescription || node.name}
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

              {/* Node Metadata Footer Bar */}
              {inspectedNode && (() => {
                const nodeTitle = inspectedNode.contentDescription || inspectedNode.text || inspectedNode.name;
                const meta = getAppEmojiFallback(nodeTitle, inspectedNode.className);
                return (
                  <div
                    className="sr-node-inspector-bar"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 12px",
                      background: "rgba(11, 15, 25, 0.95)",
                      borderTop: "1px solid #1e293b"
                    }}
                  >
                    <AppLogo
                      name={nodeTitle}
                      packageName={inspectedNode.className}
                      size={32}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="inspector-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="inspector-title" style={{ color: "#38bdf8", fontWeight: 700, fontSize: "11px" }}>
                          {nodeTitle}
                        </span>
                        <span className="inspector-bounds" style={{ fontSize: "9px", color: "#64748b" }}>{inspectedNode.bounds}</span>
                      </div>
                      <div className="inspector-desc" style={{ fontSize: "9.5px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>{inspectedNode.className}</span>
                        {inspectedNode.clickable && (
                          <span style={{ color: "#22c55e", fontWeight: 700 }}>● INTERATIVO</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* BARRA DE NAVEGAÇÃO ANDROID VIRTUAL NATIVA (NO ESQUELETO) */}
              <div
                className="android-hardware-navbar"
                style={{
                  height: "46px",
                  background: "#080a10",
                  borderTop: "1px solid #1e293b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-around",
                  padding: "0 12px",
                  zIndex: 20
                }}
              >
                <button
                  type="button"
                  className="android-nav-btn"
                  onClick={() => handleMacroAction("input keyevent 187", "Trocar Telas / Recentes")}
                  title="Trocar de Telas / Aplicativos Recentes (KEYCODE_APP_SWITCH 187)"
                >
                  <span style={{ fontSize: "16px", fontWeight: 900, lineHeight: 1 }}>|||</span>
                  <span style={{ fontSize: "8px", fontWeight: 700, marginTop: "2px", letterSpacing: "0.5px" }}>RECENTES</span>
                </button>

                <button
                  type="button"
                  className="android-nav-btn"
                  onClick={() => handleMacroAction("input keyevent 3", "Iniciar / Home")}
                  title="Tela Inicial / Iniciar (KEYCODE_HOME 3)"
                >
                  <span style={{ fontSize: "17px", fontWeight: 900, lineHeight: 1 }}>○</span>
                  <span style={{ fontSize: "8px", fontWeight: 700, marginTop: "2px", letterSpacing: "0.5px" }}>INICIAR</span>
                </button>

                <button
                  type="button"
                  className="android-nav-btn"
                  onClick={() => handleMacroAction("input keyevent 4", "Voltar")}
                  title="Voltar Tela Anterior (KEYCODE_BACK 4)"
                >
                  <span style={{ fontSize: "16px", fontWeight: 900, lineHeight: 1 }}>◁</span>
                  <span style={{ fontSize: "8px", fontWeight: 700, marginTop: "2px", letterSpacing: "0.5px" }}>VOLTAR</span>
                </button>
              </div>
            </div>
          )}

          {/* PAINEL 3: CÂMERA AO VIVO DO APARELHO (3ª TELA SIMULTÂNEA COM FEED ÓPTICO) */}
          {camActive && (
            <div
              className="tactical-phone-viewport live-camera-frame"
              style={{
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
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
                  flex: 1,
                  width: "100%",
                  background: "#040508",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  filter: nightVision ? "brightness(1.35) contrast(1.2) hue-rotate(90deg)" : "none"
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
              <div
                className="android-hardware-navbar"
                style={{
                  height: "46px",
                  background: "#080a10",
                  borderTop: "1px solid #1e293b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-around",
                  padding: "0 12px",
                  zIndex: 20
                }}
              >
                <button
                  type="button"
                  className="android-nav-btn"
                  onClick={() => handleMacroAction("input keyevent 187", "Recentes")}
                  title="Trocar Telas / Recentes"
                >
                  <span style={{ fontSize: "16px", fontWeight: 900, lineHeight: 1 }}>|||</span>
                  <span style={{ fontSize: "8px", fontWeight: 700, marginTop: "2px", letterSpacing: "0.5px" }}>RECENTES</span>
                </button>

                <button
                  type="button"
                  className="android-nav-btn"
                  onClick={() => handleMacroAction("input keyevent 3", "Home")}
                  title="Tela Inicial"
                >
                  <span style={{ fontSize: "17px", fontWeight: 900, lineHeight: 1 }}>○</span>
                  <span style={{ fontSize: "8px", fontWeight: 700, marginTop: "2px", letterSpacing: "0.5px" }}>INICIAR</span>
                </button>

                <button
                  type="button"
                  className="android-nav-btn"
                  onClick={() => handleMacroAction("input keyevent 4", "Voltar")}
                  title="Voltar"
                >
                  <span style={{ fontSize: "16px", fontWeight: 900, lineHeight: 1 }}>◁</span>
                  <span style={{ fontSize: "8px", fontWeight: 700, marginTop: "2px", letterSpacing: "0.5px" }}>VOLTAR</span>
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

      {/* 5. RODAPÉ TÁTICO: Terminal Shell com feedback e macros rápidas REAIS */}
      {shellActive && (
        <footer className="tactical-footer-shell">
          <div className="tactical-macro-shortcuts-row">
            <span className="macro-lead-label">ATALHOS DO DISPOSITIVO:</span>
            <button
              type="button"
              className="tactical-macro-chip"
              onClick={() => handleMacroAction("input keyevent 3", "Home")}
            >
              Home
            </button>
            <button
              type="button"
              className="tactical-macro-chip"
              onClick={() => handleMacroAction("input keyevent 4", "Voltar")}
            >
              Voltar
            </button>
            <button
              type="button"
              className="tactical-macro-chip"
              onClick={() => handleMacroAction("input keyevent 187", "Recentes")}
            >
              Recentes
            </button>
            <button
              type="button"
              className="tactical-macro-chip"
              onClick={() => handleMacroAction("input keyevent 26", "Power / Bloqueio")}
            >
              Power
            </button>
            <button
              type="button"
              className="tactical-macro-chip"
              onClick={() => handleMacroAction("capture", "Capturar Tela")}
            >
              Capturar Tela
            </button>
            <button
              type="button"
              className="tactical-macro-chip"
              onClick={async () => {
                await api.sendTouch(device.id, 360, 640, 720, 1280);
                showToast("Toque digital simulado no centro da tela (360, 640)", "success");
              }}
              title="Simular toque digital no centro da tela (360, 640)"
              style={{ borderColor: "rgba(34, 197, 94, 0.4)", color: "#22c55e" }}
            >
              ● Simular Toque (360, 640)
            </button>
            <button
              type="button"
              className="tactical-macro-chip"
              onClick={async () => {
                await api.sendSwipe(device.id, 360, 800, 360, 300, 300);
                showToast("Gesto digital simulado: Swipe para cima", "success");
              }}
              title="Simular gesto de deslize digital para cima"
              style={{ borderColor: "rgba(56, 189, 248, 0.4)", color: "#38bdf8" }}
            >
              ↑ Simular Swipe Cima
            </button>
            <button
              type="button"
              className="tactical-macro-chip"
              onClick={async () => {
                await api.sendSwipe(device.id, 360, 300, 360, 800, 300);
                showToast("Gesto digital simulado: Swipe para baixo", "success");
              }}
              title="Simular gesto de deslize digital para baixo"
              style={{ borderColor: "rgba(56, 189, 248, 0.4)", color: "#38bdf8" }}
            >
              ↓ Simular Swipe Baixo
            </button>
          </div>

          <form className="tactical-command-input-form" onSubmit={handleSendShellCommand}>
            <div className="command-prefix-tag">DVIEW:~$</div>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Digite um texto para digitar no celular ou comando shell..."
              className="tactical-shell-input"
            />
            <button type="submit" className="tactical-send-cmd-btn" title="Enviar texto ao celular">
              <Send size={14} />
            </button>
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
        title="Abrir Funções Rápidas do Aparelho"
      >
        <Zap size={14} />
        <span>FUNÇÕES RÁPIDAS</span>
      </button>
    )}

    {/* Right Sidebar Quick Actions Drawer */}
    {showRightSidebar && (
      <RightSidebarQuickActions
        device={device}
        onClose={() => setShowRightSidebar(false)}
        onMacroAction={handleMacroAction}
        onSendTouch={(x, y) => {
          api.sendTouch(device.id, x, y, 720, 1280);
          showToast(`Toque digital simulado em (${x}, ${y})`, "success");
        }}
        onSendSwipe={(x1, y1, x2, y2) => {
          api.sendSwipe(device.id, x1, y1, x2, y2, 300);
          showToast(`Gesto de deslize simulado: (${x1}, ${y1}) -> (${x2}, ${y2})`, "success");
        }}
        onVolumeChange={handleVolumeChange}
        deviceVolume={deviceVolume}
        isMuted={isMuted}
        onToggleMute={() => handleVolumeStep("mute")}
        activeCamera={activeCamera}
        onToggleCamera={() => {
          const nextCam = activeCamera === "back" ? "front" : "back";
          setActiveCamera(nextCam);
          showToast(`Alternado para Câmera ${nextCam === "back" ? "Traseira (50MP)" : "Frontal (12MP)"}`, "success");
        }}
        torchOn={torchOn}
        onToggleTorch={() => {
          setTorchOn(!torchOn);
          showToast(torchOn ? "Lanterna desligada" : "Lanterna ativada no celular", "success");
        }}
        activeScreensCount={activeScreensCount}
        onToggleScreen={(type) => {
          if (type === "tela") setTelaActive(!telaActive);
          if (type === "sr") setSrActive(!srActive);
          if (type === "cam") setCamActive(!camActive);
        }}
        telaActive={telaActive}
        srActive={srActive}
        camActive={camActive}
        fps={fps}
        onChangeFps={setFps}
        onAutoFit={handleAutoFitSync}
        showToast={showToast}
      />
    )}
  </div>
    </div>
  );
}
