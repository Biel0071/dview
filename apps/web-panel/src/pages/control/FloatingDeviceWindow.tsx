import { useEffect, useRef, useState } from "react";
import {
  Camera,
  ChevronDown,
  CircleDot,
  Copy,
  ExternalLink,
  Keyboard,
  Layers,
  Lock,
  Maximize2,
  Minimize2,
  Minus,
  Pin,
  Power,
  RotateCw,
  Send,
  Smartphone,
  Square,
  Volume2,
  VolumeX,
  X,
  Zap
} from "lucide-react";
import type { ControlDevice } from "./types";
import { api } from "../../api";

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
  initialY = 80,
  zIndex = 1000,
  onBringToFront
}: FloatingDeviceWindowProps) {
  // Window position & size state
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: 440, height: 720 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [showQuickType, setShowQuickType] = useState(false);
  const [typeText, setTypeText] = useState("");
  const [rotationDeg, setRotationDeg] = useState(0);

  // Live Screen State
  const [screenTimestamp, setScreenTimestamp] = useState(Date.now());
  const [isStreaming, setIsStreaming] = useState(true);
  const [fps] = useState(15);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Dragging state
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Resizing state
  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const imgRef = useRef<HTMLImageElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Next frame loop
  const fetchNextFrame = () => {
    if (!isMinimized) {
      setScreenTimestamp(Date.now());
    }
  };

  // Open Popout Desktop
  const handlePopoutDesktop = () => {
    const url = `${window.location.origin}/?popout=true&deviceId=${encodeURIComponent(device.id)}`;
    const popup = window.open(
      url,
      `DVIEW_Popout_${device.id.replace(/[^a-zA-Z0-9]/g, "_")}`,
      "width=480,height=880,menubar=no,toolbar=no,location=no,status=no,resizable=yes"
    );
    if (popup) {
      showToast("Janela Desktop Desencaixada com sucesso!");
    } else {
      showToast("Aviso: Habilite popups no navegador para desencaixar.");
    }
  };

  // Touch Injection
  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return;
    touchStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      time: Date.now()
    };
  };

  const handleMouseUp = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!touchStartRef.current) return;
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = touchStartRef.current.x;
    const startY = touchStartRef.current.y;
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    const duration = Math.max(120, Math.min(600, Date.now() - touchStartRef.current.time));
    touchStartRef.current = null;

    const deltaX = Math.abs(endX - startX);
    const deltaY = Math.abs(endY - startY);

    if (deltaX > 18 || deltaY > 18) {
      const x1 = Math.round((startX / rect.width) * 720);
      const y1 = Math.round((startY / rect.height) * 1280);
      const x2 = Math.round((endX / rect.width) * 720);
      const y2 = Math.round((endY / rect.height) * 1280);
      try {
        await api.sendSwipe(device.id, x1, y1, x2, y2, duration);
        setTimeout(fetchNextFrame, 250);
      } catch {
        // ignore
      }
      return;
    }

    // Single Tap
    const devX = Math.round((endX / rect.width) * 720);
    const devY = Math.round((endY / rect.height) * 1280);

    const ripId = Date.now();
    setRipples((prev) => [...prev, { id: ripId, x: endX, y: endY }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== ripId)), 500);

    try {
      await api.sendTouch(device.id, devX, devY, 720, 1280);
      setTimeout(fetchNextFrame, 250);
    } catch {
      // ignore
    }
  };

  // Hardware Keys
  const handleKey = async (key: string | number, label: string) => {
    try {
      await api.sendKey(device.id, key);
      showToast(`Tecla: ${label}`);
      setTimeout(fetchNextFrame, 250);
    } catch {
      // ignore
    }
  };

  // Quick Type injection
  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeText.trim()) return;
    try {
      await api.sendText(device.id, typeText);
      showToast(`Texto digitado no aparelho`);
      setTypeText("");
      setShowQuickType(false);
      setTimeout(fetchNextFrame, 300);
    } catch {
      // ignore
    }
  };

  // Screenshot download
  const handleDownloadScreenshot = () => {
    const link = document.createElement("a");
    link.href = `${api.getDeviceScreenUrl(device.id)}?snapshot=${Date.now()}`;
    link.download = `screenshot_${device.id}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Captura baixada!");
  };

  // Window drag handlers
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    onBringToFront?.();
    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newX = Math.max(10, Math.min(window.innerWidth - 100, moveEvent.clientX - dragOffsetRef.current.x));
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
        width: Math.max(340, Math.min(1000, resizeStartRef.current.width + dx)),
        height: Math.max(480, Math.min(1200, resizeStartRef.current.height + dy))
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
        width: isMinimized ? "320px" : `${size.width}px`,
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
        transition: "box-shadow 0.2s ease, border-color 0.2s ease"
      }}
      onMouseDown={onBringToFront}
    >
      {/* 1. JANELA HEADER (BARRA DE TÍTULO & CONTROLES ESTILO WINDOWS / MEMU) */}
      <div
        className="floating-window-header"
        onMouseDown={handleHeaderMouseDown}
        style={{
          height: "42px",
          minHeight: "42px",
          background: isPinned ? "rgba(255, 26, 42, 0.12)" : "#0b101b",
          borderBottom: "1px solid #1e293b",
          padding: "0 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "grab",
          userSelect: "none"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: device.status === "online" ? "#22c55e" : "#64748b",
              boxShadow: device.status === "online" ? "0 0 8px #22c55e" : "none"
            }}
          />
          <strong
            style={{
              fontSize: "12px",
              color: "#f8fafc",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "160px"
            }}
            title={device.name}
          >
            {device.name}
          </strong>
          <span
            style={{
              fontSize: "10px",
              color: "#64748b",
              fontFamily: "var(--font-mono, monospace)"
            }}
          >
            {device.ip}
          </span>
        </div>

        {/* Action icons in Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {/* PIN BUTTON */}
          <button
            type="button"
            className={`tactical-floating-btn ${isPinned ? "active-pin" : ""}`}
            onClick={() => {
              setIsPinned(!isPinned);
              showToast(!isPinned ? "📌 Janela fixada no topo!" : "Janela desafixada");
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

          {/* DESENCAIXAR POPUP DESKTOP */}
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

      {/* 2. CORPO DA JANELA: FRAME DO CELULAR + BARRA LATERAL ACOPLADA ESTILO MEMU */}
      {!isMinimized && (
        <div
          className="floating-window-body"
          style={{
            flex: 1,
            display: "flex",
            position: "relative",
            overflow: "hidden",
            background: "#000000"
          }}
        >
          {/* TOAST FLUTUANTE */}
          {toastMsg && (
            <div
              style={{
                position: "absolute",
                top: "10px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(10, 15, 25, 0.92)",
                border: "1px solid #38bdf8",
                color: "#38bdf8",
                padding: "3px 10px",
                borderRadius: "14px",
                fontSize: "11px",
                fontWeight: 600,
                zIndex: 100,
                pointerEvents: "none",
                whiteSpace: "nowrap"
              }}
            >
              {toastMsg}
            </div>
          )}

          {/* MODAL / OVERLAY DE DIGITAÇÃO RÁPIDA (VIRTUAL KEYBOARD) */}
          {showQuickType && (
            <form
              onSubmit={handleSendText}
              style={{
                position: "absolute",
                top: "8px",
                left: "10px",
                right: "50px",
                background: "#0b101b",
                border: "1px solid #38bdf8",
                borderRadius: "8px",
                padding: "8px",
                display: "flex",
                gap: "6px",
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
                  padding: "4px 8px",
                  fontSize: "12px",
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
                  padding: "0 10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <Send size={12} />
              </button>
              <button
                type="button"
                onClick={() => setShowQuickType(false)}
                style={{
                  background: "#1e293b",
                  border: "none",
                  borderRadius: "4px",
                  color: "#94a3b8",
                  padding: "0 6px",
                  cursor: "pointer"
                }}
              >
                <X size={12} />
              </button>
            </form>
          )}

          {/* VIEWPORT DA TELA AO VIVO */}
          <div
            className="floating-screen-wrapper"
            style={{
              flex: 1,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden"
            }}
          >
            <img
              ref={imgRef}
              src={`${api.getDeviceScreenUrl(device.id)}?t=${screenTimestamp}`}
              alt={device.name}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                transform: `rotate(${rotationDeg}deg)`,
                cursor: "crosshair",
                userSelect: "none"
              }}
              onLoad={() => {
                setIsStreaming(true);
                setTimeout(fetchNextFrame, 300);
              }}
              onError={() => {
                setIsStreaming(false);
                setTimeout(fetchNextFrame, 1200);
              }}
            />

            {/* TOUCH RIPPLES */}
            {ripples.map((r) => (
              <span
                key={r.id}
                style={{
                  position: "absolute",
                  left: r.x,
                  top: r.y,
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: "rgba(56, 189, 248, 0.4)",
                  border: "2px solid #38bdf8",
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none",
                  boxShadow: "0 0 10px #38bdf8"
                }}
              />
            ))}

            {/* OVERLAY SE ESTIVER DESCONECTADO OU CARREGANDO */}
            {!isStreaming && (
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
                <Smartphone size={28} style={{ color: "#f59e0b" }} />
                <span style={{ fontSize: "11px", color: "#cbd5e1" }}>Conectando ao Stream...</span>
                <button
                  type="button"
                  onClick={() => setScreenTimestamp(Date.now())}
                  style={{
                    background: "#0284c7",
                    border: "none",
                    color: "#fff",
                    borderRadius: "4px",
                    padding: "3px 8px",
                    fontSize: "10px",
                    cursor: "pointer"
                  }}
                >
                  Reconectar
                </button>
              </div>
            )}

            {/* MINI NAVEGADOR VIRTUAL ANDROID INFERIOR (RECENTES, INICIAR, VOLTAR) */}
            <div
              style={{
                width: "100%",
                height: "34px",
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
                <Square size={13} />
              </button>
              <button
                type="button"
                onClick={() => handleKey("home", "Home")}
                title="Tela Inicial"
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
              >
                <CircleDot size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleKey("back", "Voltar")}
                title="Voltar"
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
              >
                <ChevronDown size={14} style={{ transform: "rotate(90deg)" }} />
              </button>
            </div>
          </div>

          {/* 3. BARRA LATERAL ACOPLADA VERTICAL ESTILO MEMU PLAY */}
          <div
            className="memu-docked-toolbar"
            style={{
              width: "42px",
              background: "#070a12",
              borderLeft: "1px solid #1e293b",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "6px 2px",
              gap: "4px",
              zIndex: 30
            }}
          >
            {/* Teclado Virtual / Digitação */}
            <button
              type="button"
              className="memu-tool-btn"
              onClick={() => setShowQuickType(!showQuickType)}
              title="Digitar texto / Teclado Virtual"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                border: "1px solid #1e293b",
                background: showQuickType ? "rgba(56, 189, 248, 0.2)" : "#0d1322",
                color: showQuickType ? "#38bdf8" : "#cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <Keyboard size={15} />
            </button>

            {/* Captura de Tela (Print) */}
            <button
              type="button"
              className="memu-tool-btn"
              onClick={handleDownloadScreenshot}
              title="Tirar Print / Captura de Tela"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                border: "1px solid #1e293b",
                background: "#0d1322",
                color: "#cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <Camera size={15} />
            </button>

            {/* Volume + */}
            <button
              type="button"
              className="memu-tool-btn"
              onClick={() => handleKey("volume_up", "Volume +")}
              title="Volume Mais"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                border: "1px solid #1e293b",
                background: "#0d1322",
                color: "#cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: 700
              }}
            >
              +
            </button>

            {/* Volume - */}
            <button
              type="button"
              className="memu-tool-btn"
              onClick={() => handleKey("volume_down", "Volume -")}
              title="Volume Menos"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                border: "1px solid #1e293b",
                background: "#0d1322",
                color: "#cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 700
              }}
            >
              -
            </button>

            {/* Rotacionar 90° */}
            <button
              type="button"
              className="memu-tool-btn"
              onClick={() => setRotationDeg((curr) => (curr + 90) % 360)}
              title="Rotacionar Tela 90°"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                border: "1px solid #1e293b",
                background: "#0d1322",
                color: "#cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <RotateCw size={14} />
            </button>

            {/* Power / Bloquear */}
            <button
              type="button"
              className="memu-tool-btn"
              onClick={() => handleKey("power", "Power")}
              title="Botão Power / Ligar/Desligar Tela"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                border: "1px solid #1e293b",
                background: "#0d1322",
                color: "#f59e0b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <Power size={14} />
            </button>

            {/* Divisor */}
            <div style={{ width: "24px", height: "1px", background: "#1e293b", margin: "4px 0" }} />

            {/* Popout Desktop */}
            <button
              type="button"
              className="memu-tool-btn"
              onClick={handlePopoutDesktop}
              title="Desencaixar Janela (Janela Desktop Independente)"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
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
              <ExternalLink size={14} />
            </button>
          </div>

          {/* 4. CANTO DE REDIMENSIONAMENTO LIVRE (RESIZE HANDLE) */}
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
