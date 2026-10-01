import { useEffect, useRef, useState } from "react";
import {
  Camera,
  ChevronDown,
  CircleDot,
  ExternalLink,
  Layers,
  Lock,
  Maximize2,
  Minimize2,
  Plus,
  Power,
  RefreshCw,
  RotateCw,
  Smartphone,
  Square,
  Volume2,
  VolumeX,
  Zap
} from "lucide-react";
import type { ControlDevice } from "./types";
import { api } from "../../api";

interface MultiDeviceGridProps {
  devices: ControlDevice[];
  gridCount: 1 | 2 | 3 | 4;
  onOpenFloating: (device: ControlDevice) => void;
  onAddEmulator: () => void;
  onGridCountChange: (count: 1 | 2 | 3 | 4) => void;
}

interface SlotState {
  deviceId: string;
  rotation: number;
  screenTimestamp: number;
  isStreaming: boolean;
}

export function MultiDeviceGrid({
  devices,
  gridCount,
  onOpenFloating,
  onAddEmulator,
  onGridCountChange
}: MultiDeviceGridProps) {
  // Map of slot index (0..3) to selected device id
  const [slotAssignments, setSlotAssignments] = useState<string[]>(() => {
    return [
      devices[0]?.id || "dev_sm_n975f",
      devices[1]?.id || devices[0]?.id || "dev_sm_n975f",
      devices[2]?.id || devices[0]?.id || "dev_sm_n975f",
      devices[3]?.id || devices[0]?.id || "dev_sm_n975f"
    ];
  });

  // Sync mode (broadcast actions to all active slots)
  const [multiSync, setMultiSync] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Per-slot timestamps for frame refresh
  const [slotTimestamps, setSlotTimestamps] = useState<number[]>([
    Date.now(),
    Date.now() + 100,
    Date.now() + 200,
    Date.now() + 300
  ]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2800);
  };

  // Keep slot assignments updated if new devices arrive
  useEffect(() => {
    if (devices.length > 0) {
      setSlotAssignments((curr) => {
        const updated = [...curr];
        for (let i = 0; i < 4; i++) {
          if (!updated[i] || !devices.some((d) => d.id === updated[i])) {
            updated[i] = devices[i % devices.length]?.id || devices[0]?.id || "";
          }
        }
        return updated;
      });
    }
  }, [devices]);

  const refreshSlotFrame = (slotIdx: number) => {
    setSlotTimestamps((curr) => {
      const copy = [...curr];
      copy[slotIdx] = Date.now();
      return copy;
    });
  };

  const refreshAllFrames = () => {
    const now = Date.now();
    setSlotTimestamps([now, now + 50, now + 100, now + 150]);
  };

  // Handle Touch on a Slot (with Multi-Sync support!)
  const handleSlotTouch = async (slotIdx: number, normalizedX: number, normalizedY: number) => {
    const targetSlots = multiSync ? [0, 1, 2, 3].slice(0, gridCount) : [slotIdx];

    for (const idx of targetSlots) {
      const devId = slotAssignments[idx];
      if (devId) {
        api.sendTouch(devId, normalizedX, normalizedY, 720, 1280).catch(() => {});
        setTimeout(() => refreshSlotFrame(idx), 280);
      }
    }

    if (multiSync) {
      showToast(`Toque Multi-Sync sincronizado em ${targetSlots.length} aparelhos!`);
    }
  };

  // Handle Swipe on a Slot (with Multi-Sync support!)
  const handleSlotSwipe = async (
    slotIdx: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    duration: number
  ) => {
    const targetSlots = multiSync ? [0, 1, 2, 3].slice(0, gridCount) : [slotIdx];

    for (const idx of targetSlots) {
      const devId = slotAssignments[idx];
      if (devId) {
        api.sendSwipe(devId, x1, y1, x2, y2, duration).catch(() => {});
        setTimeout(() => refreshSlotFrame(idx), 300);
      }
    }

    if (multiSync) {
      showToast(`Gesto Multi-Sync replicado em ${targetSlots.length} aparelhos!`);
    }
  };

  // Handle Key (with Multi-Sync support!)
  const handleSlotKey = async (slotIdx: number, key: string | number, label: string) => {
    const targetSlots = multiSync ? [0, 1, 2, 3].slice(0, gridCount) : [slotIdx];

    for (const idx of targetSlots) {
      const devId = slotAssignments[idx];
      if (devId) {
        api.sendKey(devId, key).catch(() => {});
        setTimeout(() => refreshSlotFrame(idx), 300);
      }
    }

    showToast(multiSync ? `Tecla "${label}" enviada para ${targetSlots.length} aparelhos` : `Tecla: ${label}`);
  };

  const handlePopout = (devId: string) => {
    const url = `${window.location.origin}/?popout=true&deviceId=${encodeURIComponent(devId)}`;
    window.open(url, `DVIEW_Popout_${devId.replace(/[^a-zA-Z0-9]/g, "_")}`, "width=480,height=880,menubar=no,toolbar=no,status=no,resizable=yes");
  };

  return (
    <div
      className="multi-device-grid-container"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#05070c",
        overflow: "hidden"
      }}
    >
      {/* 1. BARRA SUPERIOR DE CONTROLE DA GRADE MULTI-INSTÂNCIA */}
      <header
        style={{
          height: "44px",
          background: "#080c16",
          borderBottom: "1px solid #1e293b",
          padding: "0 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          zIndex: 20
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Smartphone size={16} style={{ color: "var(--crimson-neon, #ff1a2a)" }} />
            <strong style={{ fontSize: "12.5px", color: "#f8fafc", letterSpacing: "0.5px" }}>
              MULTI-SESSÃO
            </strong>
          </div>

          {/* GRID LAYOUT SELECTOR */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "6px",
              padding: "2px"
            }}
          >
            <button
              type="button"
              onClick={() => onGridCountChange(1)}
              className={`tactical-grid-btn ${gridCount === 1 ? "active" : ""}`}
              style={{
                background: gridCount === 1 ? "var(--crimson-neon, #ff1a2a)" : "transparent",
                color: gridCount === 1 ? "#fff" : "#94a3b8",
                border: "none",
                borderRadius: "4px",
                padding: "3px 8px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer"
              }}
              title="1 Aparelho (Modo Foco)"
            >
              1 Tela
            </button>
            <button
              type="button"
              onClick={() => onGridCountChange(2)}
              className={`tactical-grid-btn ${gridCount === 2 ? "active" : ""}`}
              style={{
                background: gridCount === 2 ? "var(--crimson-neon, #ff1a2a)" : "transparent",
                color: gridCount === 2 ? "#fff" : "#94a3b8",
                border: "none",
                borderRadius: "4px",
                padding: "3px 8px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer"
              }}
              title="2 Aparelhos Lado a Lado (2x1)"
            >
              2 Telas (2x1)
            </button>
            <button
              type="button"
              onClick={() => onGridCountChange(3)}
              className={`tactical-grid-btn ${gridCount === 3 ? "active" : ""}`}
              style={{
                background: gridCount === 3 ? "var(--crimson-neon, #ff1a2a)" : "transparent",
                color: gridCount === 3 ? "#fff" : "#94a3b8",
                border: "none",
                borderRadius: "4px",
                padding: "3px 8px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer"
              }}
              title="3 Aparelhos Simultâneos (3x1)"
            >
              3 Telas (3x1)
            </button>
            <button
              type="button"
              onClick={() => onGridCountChange(4)}
              className={`tactical-grid-btn ${gridCount === 4 ? "active" : ""}`}
              style={{
                background: gridCount === 4 ? "var(--crimson-neon, #ff1a2a)" : "transparent",
                color: gridCount === 4 ? "#fff" : "#94a3b8",
                border: "none",
                borderRadius: "4px",
                padding: "3px 8px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer"
              }}
              title="4 Aparelhos Matriz Quad (2x2)"
            >
              4 Telas (2x2)
            </button>
          </div>
        </div>

        {/* CONTROLES DA DIREITA: MULTI-SYNC & NOVA INSTÂNCIA */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {toastMsg && (
            <span
              style={{
                fontSize: "11px",
                color: "#38bdf8",
                background: "rgba(56, 189, 248, 0.15)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                padding: "2px 8px",
                borderRadius: "12px"
              }}
            >
              {toastMsg}
            </span>
          )}

          {/* MULTI-SYNC BROADCAST TOGGLE */}
          <button
            type="button"
            onClick={() => {
              setMultiSync(!multiSync);
              showToast(!multiSync ? "⚡ Sincronização em Massa ATIVADA (Multi-Sync)" : "Sincronização Desativada");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: multiSync ? "rgba(255, 26, 42, 0.25)" : "rgba(30, 41, 59, 0.6)",
              border: `1px solid ${multiSync ? "var(--crimson-neon, #ff1a2a)" : "#334155"}`,
              color: multiSync ? "#ff4d5a" : "#cbd5e1",
              borderRadius: "6px",
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer"
            }}
            title="Ao ativar, toques e cliques são replicados simultaneamente em todos os aparelhos da grade"
          >
            <Zap size={13} style={{ fill: multiSync ? "#ff1a2a" : "none" }} />
            <span>{multiSync ? "SYNC ATIVO" : "SINCRONIZAR AÇÕES"}</span>
          </button>

          {/* RECARREGAR TODOS OS FRAMES */}
          <button
            type="button"
            onClick={refreshAllFrames}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#cbd5e1",
              borderRadius: "6px",
              padding: "4px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}
            title="Atualizar todos os aparelhos da grade"
          >
            <RefreshCw size={13} />
          </button>

          {/* ADICIONAR EMULADOR / SESSÃO */}
          <button
            type="button"
            onClick={onAddEmulator}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(34, 197, 94, 0.18)",
              border: "1px solid #22c55e",
              color: "#4ade80",
              borderRadius: "6px",
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer"
            }}
            title="Iniciar e vincular nova instância de emulador"
          >
            <Plus size={13} />
            <span>Nova Sessão</span>
          </button>
        </div>
      </header>

      {/* 2. ÁREA DA GRADE DE SLOTS DINÂMICA (1, 2, 3 OU 4 APARELHOS) */}
      <div
        className={`multi-grid-body layout-${gridCount}`}
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns:
            gridCount === 1
              ? "1fr"
              : gridCount === 2
              ? "1fr 1fr"
              : gridCount === 3
              ? "1fr 1fr 1fr"
              : "1fr 1fr",
          gridTemplateRows: gridCount === 4 ? "1fr 1fr" : "1fr",
          gap: "8px",
          padding: "8px",
          overflow: "hidden"
        }}
      >
        {Array.from({ length: gridCount }).map((_, slotIdx) => {
          const devId = slotAssignments[slotIdx] || devices[0]?.id || "dev_sm_n975f";
          const dev = devices.find((d) => d.id === devId) || devices[0] || {
            id: devId,
            name: `Aparelho #${slotIdx + 1}`,
            ip: "127.0.0.1",
            battery: 100,
            status: "online"
          };

          return (
            <SlotDeviceCard
              key={`slot_${slotIdx}_${devId}`}
              slotNumber={slotIdx + 1}
              device={dev}
              devices={devices}
              timestamp={slotTimestamps[slotIdx]}
              onSelectDevice={(newId) => {
                setSlotAssignments((curr) => {
                  const copy = [...curr];
                  copy[slotIdx] = newId;
                  return copy;
                });
              }}
              onRefreshFrame={() => refreshSlotFrame(slotIdx)}
              onTouch={(x, y) => handleSlotTouch(slotIdx, x, y)}
              onSwipe={(x1, y1, x2, y2, dur) => handleSlotSwipe(slotIdx, x1, y1, x2, y2, dur)}
              onKey={(k, l) => handleSlotKey(slotIdx, k, l)}
              onPopout={() => handlePopout(dev.id)}
              onOpenFloating={() => onOpenFloating(dev as ControlDevice)}
            />
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SUBCOMPONENTE: CARD INDIVIDUAL DE DISPOSITIVO NA GRADE
// -------------------------------------------------------------
interface SlotDeviceCardProps {
  slotNumber: number;
  device: any;
  devices: any[];
  timestamp: number;
  onSelectDevice: (newId: string) => void;
  onRefreshFrame: () => void;
  onTouch: (normalizedX: number, normalizedY: number) => void;
  onSwipe: (x1: number, y1: number, x2: number, y2: number, duration: number) => void;
  onKey: (key: string | number, label: string) => void;
  onPopout: () => void;
  onOpenFloating: () => void;
}

function SlotDeviceCard({
  slotNumber,
  device,
  devices,
  timestamp,
  onSelectDevice,
  onRefreshFrame,
  onTouch,
  onSwipe,
  onKey,
  onPopout,
  onOpenFloating
}: SlotDeviceCardProps) {
  const [isStreaming, setIsStreaming] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      time: Date.now()
    };
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!dragRef.current) return;
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = dragRef.current.x;
    const startY = dragRef.current.y;
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    const duration = Math.max(120, Math.min(600, Date.now() - dragRef.current.time));
    dragRef.current = null;

    const deltaX = Math.abs(endX - startX);
    const deltaY = Math.abs(endY - startY);

    if (deltaX > 18 || deltaY > 18) {
      const x1 = Math.round((startX / rect.width) * 720);
      const y1 = Math.round((startY / rect.height) * 1280);
      const x2 = Math.round((endX / rect.width) * 720);
      const y2 = Math.round((endY / rect.height) * 1280);
      onSwipe(x1, y1, x2, y2, duration);
      return;
    }

    const devX = Math.round((endX / rect.width) * 720);
    const devY = Math.round((endY / rect.height) * 1280);

    const ripId = Date.now();
    setRipples((prev) => [...prev, { id: ripId, x: endX, y: endY }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== ripId)), 500);

    onTouch(devX, devY);
  };

  const handleDownloadScreenshot = () => {
    const link = document.createElement("a");
    link.href = `${api.getDeviceScreenUrl(device.id)}?snapshot=${Date.now()}`;
    link.download = `slot${slotNumber}_${device.id}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="slot-device-card"
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#080c14",
        border: "1px solid #1e293b",
        borderRadius: "8px",
        overflow: "hidden",
        position: "relative"
      }}
    >
      {/* SLOT HEADER */}
      <div
        style={{
          height: "36px",
          background: "#0b101c",
          borderBottom: "1px solid #1e293b",
          padding: "0 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
          <span
            style={{
              background: "rgba(56, 189, 248, 0.2)",
              color: "#38bdf8",
              fontSize: "10px",
              fontWeight: 800,
              padding: "1px 5px",
              borderRadius: "4px"
            }}
          >
            #{slotNumber}
          </span>

          {/* DEVICE PICKER SELECT */}
          <select
            value={device.id}
            onChange={(e) => onSelectDevice(e.target.value)}
            style={{
              background: "#05070a",
              border: "1px solid #1e293b",
              color: "#f8fafc",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "4px",
              padding: "2px 4px",
              maxWidth: "140px",
              outline: "none",
              cursor: "pointer"
            }}
          >
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.ip || "127.0.0.1"})
              </option>
            ))}
          </select>

          <span style={{ fontSize: "10px", color: "#64748b" }}>
            {device.battery ?? 100}%
          </span>
        </div>

        {/* FAST SLOT ACTIONS */}
        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          {/* FLUTUANTE */}
          <button
            type="button"
            onClick={onOpenFloating}
            title="Abrir como Janela Flutuante Estilo MEmu"
            style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "2px" }}
          >
            <Layers size={13} />
          </button>

          {/* POPOUT */}
          <button
            type="button"
            onClick={onPopout}
            title="Desencaixar Janela Desktop"
            style={{ background: "transparent", border: "none", color: "#38bdf8", cursor: "pointer", padding: "2px" }}
          >
            <ExternalLink size={13} />
          </button>

          {/* POWER */}
          <button
            type="button"
            onClick={() => onKey("power", "Power")}
            title="Power / Ligar/Desligar Tela"
            style={{ background: "transparent", border: "none", color: "#f59e0b", cursor: "pointer", padding: "2px" }}
          >
            <Power size={13} />
          </button>
        </div>
      </div>

      {/* SLOT BODY: VIEWPORT + TOOLBAR LATERAL */}
      <div style={{ flex: 1, display: "flex", position: "relative", overflow: "hidden", background: "#000000" }}>
        {/* TELA AO VIVO */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", alignItems: "center", justifyContent: "center" }}>
          <img
            ref={imgRef}
            src={`${api.getDeviceScreenUrl(device.id)}?t=${timestamp}`}
            alt={device.name}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              transform: `rotate(${rotation}deg)`,
              cursor: "crosshair",
              userSelect: "none"
            }}
            onLoad={() => {
              setIsStreaming(true);
              setTimeout(onRefreshFrame, 350);
            }}
            onError={() => {
              setIsStreaming(false);
              setTimeout(onRefreshFrame, 1200);
            }}
          />

          {ripples.map((r) => (
            <span
              key={r.id}
              style={{
                position: "absolute",
                left: r.x,
                top: r.y,
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                background: "rgba(56, 189, 248, 0.4)",
                border: "2px solid #38bdf8",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                boxShadow: "0 0 8px #38bdf8"
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
                gap: "6px"
              }}
            >
              <Smartphone size={24} style={{ color: "#f59e0b" }} />
              <span style={{ fontSize: "10.5px", color: "#cbd5e1" }}>Aguardando Quadro...</span>
              <button
                type="button"
                onClick={onRefreshFrame}
                style={{
                  background: "#0284c7",
                  border: "none",
                  color: "#fff",
                  borderRadius: "4px",
                  padding: "2px 8px",
                  fontSize: "10px",
                  cursor: "pointer"
                }}
              >
                Reconectar
              </button>
            </div>
          )}

          {/* MINI NAVBAR INFERIOR */}
          <div
            style={{
              width: "100%",
              height: "30px",
              background: "#080c14",
              borderTop: "1px solid #1e293b",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around"
            }}
          >
            <button
              type="button"
              onClick={() => onKey("recents", "Recentes")}
              title="Recentes"
              style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "2px" }}
            >
              <Square size={12} />
            </button>
            <button
              type="button"
              onClick={() => onKey("home", "Home")}
              title="Tela Inicial"
              style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "2px" }}
            >
              <CircleDot size={13} />
            </button>
            <button
              type="button"
              onClick={() => onKey("back", "Voltar")}
              title="Voltar"
              style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "2px" }}
            >
              <ChevronDown size={13} style={{ transform: "rotate(90deg)" }} />
            </button>
          </div>
        </div>

        {/* MINI TOOLBAR LATERAL ACOPLADA */}
        <div
          style={{
            width: "32px",
            background: "#070a12",
            borderLeft: "1px solid #1e293b",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "4px 1px",
            gap: "4px"
          }}
        >
          <button
            type="button"
            onClick={handleDownloadScreenshot}
            title="Print da tela"
            style={{ width: "26px", height: "26px", borderRadius: "4px", border: "1px solid #1e293b", background: "#0d1322", color: "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Camera size={13} />
          </button>
          <button
            type="button"
            onClick={() => onKey("volume_up", "Volume +")}
            title="Volume +"
            style={{ width: "26px", height: "26px", borderRadius: "4px", border: "1px solid #1e293b", background: "#0d1322", color: "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "11px", fontWeight: 700 }}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => onKey("volume_down", "Volume -")}
            title="Volume -"
            style={{ width: "26px", height: "26px", borderRadius: "4px", border: "1px solid #1e293b", background: "#0d1322", color: "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}
          >
            -
          </button>
          <button
            type="button"
            onClick={() => setRotation((curr) => (curr + 90) % 360)}
            title="Rotacionar 90°"
            style={{ width: "26px", height: "26px", borderRadius: "4px", border: "1px solid #1e293b", background: "#0d1322", color: "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <RotateCw size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
