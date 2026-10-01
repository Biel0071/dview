import { useEffect, useRef, useState } from "react";
import {
  Camera,
  ChevronDown,
  CircleDot,
  Copy,
  Keyboard,
  Layers,
  Maximize2,
  Minimize2,
  Power,
  RotateCw,
  Send,
  Smartphone,
  Square,
  Volume2,
  VolumeX,
  X
} from "lucide-react";
import type { ControlDevice } from "./types";
import { api } from "../../api";

interface PopoutDeviceViewProps {
  deviceId: string;
}

export function PopoutDeviceView({ deviceId }: PopoutDeviceViewProps) {
  const [device, setDevice] = useState<ControlDevice | null>(null);
  const [screenTimestamp, setScreenTimestamp] = useState(Date.now());
  const [isStreaming, setIsStreaming] = useState(true);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [showQuickType, setShowQuickType] = useState(false);
  const [typeText, setTypeText] = useState("");
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  useEffect(() => {
    // Fetch device info
    api.devices().then((devList) => {
      const found = devList.find((d: any) => d.id === deviceId);
      if (found) {
        setDevice({
          id: found.id,
          name: found.name,
          model: found.model,
          ip: (found as any).ip || found.ipAddress || "127.0.0.1",
          battery: found.battery ?? 100,
          status: found.status || "online",
          lastSeen: "agora",
          androidVersion: found.androidVersion || "14.0",
          manufacturer: "Android",
          wifiSignal: 95,
          networkType: "wifi",
          networkName: "Wi-Fi",
          signalStrength: 95,
          networkSpeed: "86.4 Mbps",
          pingMs: 14,
          screenLocked: false,
          dateGroup: "HOJE",
          isFavorite: false
        });
      } else {
        setDevice({
          id: deviceId,
          name: `Aparelho (${deviceId})`,
          model: "SM-N975F",
          ip: "127.0.0.1",
          battery: 100,
          status: "online",
          lastSeen: "agora",
          androidVersion: "14.0",
          manufacturer: "Samsung",
          wifiSignal: 95,
          networkType: "wifi",
          networkName: "Wi-Fi",
          signalStrength: 95,
          networkSpeed: "86.4 Mbps",
          pingMs: 14,
          screenLocked: false,
          dateGroup: "HOJE",
          isFavorite: false
        });
      }
    }).catch(() => {
      setDevice({
        id: deviceId,
        name: `Aparelho (${deviceId})`,
        model: "Android",
        ip: "127.0.0.1",
        battery: 100,
        status: "online",
        lastSeen: "agora",
        androidVersion: "14.0",
        manufacturer: "Android",
        wifiSignal: 95,
        networkType: "wifi",
        networkName: "Wi-Fi",
        signalStrength: 95,
        networkSpeed: "86.4 Mbps",
        pingMs: 14,
        screenLocked: false,
        dateGroup: "HOJE",
        isFavorite: false
      });
    });
  }, [deviceId]);

  const fetchNextFrame = () => {
    setScreenTimestamp(Date.now());
  };

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
        await api.sendSwipe(deviceId, x1, y1, x2, y2, duration);
        setTimeout(fetchNextFrame, 250);
      } catch {
        // ignore
      }
      return;
    }

    const devX = Math.round((endX / rect.width) * 720);
    const devY = Math.round((endY / rect.height) * 1280);

    const ripId = Date.now();
    setRipples((prev) => [...prev, { id: ripId, x: endX, y: endY }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== ripId)), 500);

    try {
      await api.sendTouch(deviceId, devX, devY, 720, 1280);
      setTimeout(fetchNextFrame, 250);
    } catch {
      // ignore
    }
  };

  const handleKey = async (key: string | number, label: string) => {
    try {
      await api.sendKey(deviceId, key);
      showToast(`Tecla: ${label}`);
      setTimeout(fetchNextFrame, 250);
    } catch {
      // ignore
    }
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeText.trim()) return;
    try {
      await api.sendText(deviceId, typeText);
      showToast("Texto enviado para o aparelho");
      setTypeText("");
      setShowQuickType(false);
      setTimeout(fetchNextFrame, 300);
    } catch {
      // ignore
    }
  };

  const handleDownloadScreenshot = () => {
    const link = document.createElement("a");
    link.href = `${api.getDeviceScreenUrl(deviceId)}?snapshot=${Date.now()}`;
    link.download = `screenshot_${deviceId}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Captura baixada!");
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#05070a",
        color: "#cbd5e1",
        overflow: "hidden",
        fontFamily: "var(--font-sans, system-ui, sans-serif)"
      }}
    >
      {/* HEADER SUPERIOR COMPACTO */}
      <header
        style={{
          height: "38px",
          background: "#0a0e17",
          borderBottom: "1px solid #1e293b",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          flexShrink: 0
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
          <strong style={{ fontSize: "12px", color: "#f8fafc" }}>{device?.name || deviceId}</strong>
          <span style={{ fontSize: "10.5px", color: "#64748b", fontFamily: "var(--font-mono, monospace)" }}>
            {device?.ip || "127.0.0.1"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {toastMsg && (
            <span style={{ fontSize: "11px", color: "#38bdf8", background: "rgba(56,189,248,0.15)", padding: "2px 8px", borderRadius: "10px" }}>
              {toastMsg}
            </span>
          )}
          <button
            type="button"
            onClick={() => handleKey("power", "Power")}
            title="Ligar/Desligar Tela"
            style={{ background: "#1e293b", border: "1px solid #334155", color: "#f59e0b", borderRadius: "4px", padding: "3px 8px", cursor: "pointer", fontSize: "11px" }}
          >
            Power
          </button>
          <button
            type="button"
            onClick={() => window.close()}
            title="Fechar Janela"
            style={{ background: "#ef4444", border: "none", color: "#fff", borderRadius: "4px", padding: "3px 8px", cursor: "pointer", fontSize: "11px" }}
          >
            Fechar
          </button>
        </div>
      </header>

      {/* CORPO: TELA + TOOLBAR MEMU */}
      <div style={{ flex: 1, display: "flex", position: "relative", overflow: "hidden", background: "#000000" }}>
        {showQuickType && (
          <form
            onSubmit={handleSendText}
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              right: "55px",
              background: "#0c101c",
              border: "1px solid #38bdf8",
              borderRadius: "8px",
              padding: "8px",
              display: "flex",
              gap: "6px",
              zIndex: 90,
              boxShadow: "0 8px 24px rgba(0,0,0,0.8)"
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
              style={{ background: "#0284c7", border: "none", borderRadius: "4px", color: "#fff", padding: "0 10px", cursor: "pointer" }}
            >
              <Send size={13} />
            </button>
            <button
              type="button"
              onClick={() => setShowQuickType(false)}
              style={{ background: "#1e293b", border: "none", borderRadius: "4px", color: "#94a3b8", padding: "0 6px", cursor: "pointer" }}
            >
              <X size={13} />
            </button>
          </form>
        )}

        {/* Viewport da Tela */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", alignItems: "center", justifyContent: "center" }}>
          <img
            ref={imgRef}
            src={`${api.getDeviceScreenUrl(deviceId)}?t=${screenTimestamp}`}
            alt={device?.name || deviceId}
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
                gap: "8px"
              }}
            >
              <Smartphone size={32} style={{ color: "#f59e0b" }} />
              <span style={{ fontSize: "12px", color: "#cbd5e1" }}>Conectando ao Stream...</span>
              <button
                type="button"
                onClick={() => setScreenTimestamp(Date.now())}
                style={{ background: "#0284c7", border: "none", color: "#fff", borderRadius: "4px", padding: "4px 10px", fontSize: "11px", cursor: "pointer" }}
              >
                Reconectar
              </button>
            </div>
          )}

          {/* Mini Navbar Android inferior */}
          <div
            style={{
              width: "100%",
              height: "36px",
              background: "#080b12",
              borderTop: "1px solid #1e293b",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around"
            }}
          >
            <button type="button" onClick={() => handleKey("recents", "Recentes")} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}>
              <Square size={14} />
            </button>
            <button type="button" onClick={() => handleKey("home", "Home")} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}>
              <CircleDot size={15} />
            </button>
            <button type="button" onClick={() => handleKey("back", "Voltar")} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}>
              <ChevronDown size={15} style={{ transform: "rotate(90deg)" }} />
            </button>
          </div>
        </div>

        {/* Barra Lateral Direita Acoplada (Estilo MEmu Play) */}
        <div
          style={{
            width: "44px",
            background: "#070a12",
            borderLeft: "1px solid #1e293b",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "8px 2px",
            gap: "5px",
            flexShrink: 0
          }}
        >
          <button
            type="button"
            onClick={() => setShowQuickType(!showQuickType)}
            title="Digitar texto / Teclado Virtual"
            style={{ width: "34px", height: "34px", borderRadius: "6px", border: "1px solid #1e293b", background: showQuickType ? "rgba(56, 189, 248, 0.2)" : "#0d1322", color: showQuickType ? "#38bdf8" : "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Keyboard size={16} />
          </button>

          <button
            type="button"
            onClick={handleDownloadScreenshot}
            title="Tirar Print / Captura de Tela"
            style={{ width: "34px", height: "34px", borderRadius: "6px", border: "1px solid #1e293b", background: "#0d1322", color: "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Camera size={16} />
          </button>

          <button
            type="button"
            onClick={() => handleKey("volume_up", "Volume +")}
            title="Volume Mais"
            style={{ width: "34px", height: "34px", borderRadius: "6px", border: "1px solid #1e293b", background: "#0d1322", color: "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 700 }}
          >
            +
          </button>

          <button
            type="button"
            onClick={() => handleKey("volume_down", "Volume -")}
            title="Volume Menos"
            style={{ width: "34px", height: "34px", borderRadius: "6px", border: "1px solid #1e293b", background: "#0d1322", color: "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 700 }}
          >
            -
          </button>

          <button
            type="button"
            onClick={() => setRotationDeg((curr) => (curr + 90) % 360)}
            title="Rotacionar Tela 90°"
            style={{ width: "34px", height: "34px", borderRadius: "6px", border: "1px solid #1e293b", background: "#0d1322", color: "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <RotateCw size={15} />
          </button>

          <button
            type="button"
            onClick={() => handleKey("power", "Power")}
            title="Ligar/Desligar Tela"
            style={{ width: "34px", height: "34px", borderRadius: "6px", border: "1px solid #1e293b", background: "#0d1322", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Power size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
