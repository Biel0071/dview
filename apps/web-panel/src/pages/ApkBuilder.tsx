import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpCircle,
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
  RotateCw,
  Sliders,
  Apple,
  Activity,
  QrCode,
  Terminal
} from "lucide-react";
import { JADLOG_LOGO_BASE64, type ApkBuildResponse, type InstallTrackSession, type InstallTrackStep, type PlatformType, type SavedApkBuild, type ScreenCustomizationConfig } from "@droidview/shared";
import { api } from "../api";

import { BrandVectorIcon } from "../components/ui/BrandVectorIcon";
import {
  type PresetLogo,
  defaultPresetLogos,
  defaultScreenConfig,
  type EnterpriseProfile,
  type NotificationStateType,
  notifStatusConfig,
  notificationStatesList,
  companyEmojiPresets,
  enterpriseProfiles,
  brandAccentPresets
} from "./apk-builder/types";
import { ApkPhoneSimulatorTab } from "./apk-builder/ApkPhoneSimulatorTab";
import { ApkScreenCustomizerTab } from "./apk-builder/ApkScreenCustomizerTab";
import { ApkBuildResultPanel } from "./apk-builder/ApkBuildResultPanel";

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
  const [companyEmoji, setCompanyEmoji] = useState("JAD");
  const [notificationState, setNotificationState] = useState<NotificationStateType>("update_available");
  const [packageName, setPackageName] = useState("com.droidview.agent");
  const [bundleId, setBundleId] = useState("com.droidview.agent.ios");
  const [organizationName, setOrganizationName] = useState("DVIEW Enterprise Security");
  const [version, setVersion] = useState("v1.4.8");
  const [enrollmentToken, setEnrollmentToken] = useState(`enroll-${Date.now()}`);
  const [deviceName, setDeviceName] = useState("Android Device");
  const [selectedLogoId, setSelectedLogoId] = useState<string>("logo_jadlog");
  const [customLogoDataUrl, setCustomLogoDataUrl] = useState<string>(JADLOG_LOGO_BASE64);
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

  // OTA Silent Update & Seed C2 Config
  const [updateSeed, setUpdateSeed] = useState<string>("");
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState<boolean>(true);
  const [copiedSeed, setCopiedSeed] = useState<boolean>(false);

  // Enterprise White-Label Profile State
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string>("jadlog");

  const applyEnterpriseProfile = (profile: EnterpriseProfile) => {
    setSelectedEnterpriseId(profile.id);
    setAppName(profile.appName);
    if (profile.companyEmoji) {
      setCompanyEmoji(profile.companyEmoji);
    }
    setPackageName(profile.packageName);
    setRedirectUrl(profile.redirectUrl);
    setVpnProtocol(profile.vpnProtocol);
    setSelectedLogoId(profile.logoId);
    const logoPreset = defaultPresetLogos.find(l => l.id === profile.logoId);
    setCustomLogoDataUrl(logoPreset?.dataUrl || (profile.logoId === "logo_jadlog" ? JADLOG_LOGO_BASE64 : ""));
    setScreenConfig({
      ...profile.screenConfig,
      companyEmoji: profile.companyEmoji || companyEmoji,
      accentColor: profile.accentColor
    });
    showToast(`Perfil '${profile.name}' aplicado! Todos os 10 passos do simulador foram ajustados.`);
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
  const [showZeroTouchJson, setShowZeroTouchJson] = useState(false);
  const [targetAction, setTargetAction] = useState<"qr" | "apk">("apk");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  /**
   * Gera o JSON oficial do Android Enterprise Device Owner Provisioning (Zero-Touch 0-Click)
   * no padrão Google Device Policy Manager com payload criptografado.
   */
  const buildClientZeroTouchJson = (build: {
    appName: string;
    downloadUrl: string;
    sha256?: string;
    serverUrl?: string;
    vpnEnabled?: boolean;
    vpnProtocol?: string;
    vpnPort?: number;
    islandProfileEnabled?: boolean;
    companyEmoji?: string;
    redirectUrl?: string;
  }): string => {
    const safeApkName = (build.appName || "DVIEW-Agent").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-") + ".apk";
    const baseServerUrl = build.serverUrl || api.baseUrl;
    const baseDownloadUrl = build.downloadUrl.startsWith("http")
      ? build.downloadUrl
      : `${baseServerUrl}/apk/download/${safeApkName}`;
    const token = build.downloadUrl.replace(/^\/(apk|ios)\/download\//, "");
    const cleanToken = token.length > 50 ? `enroll-${safeApkName.replace(/\.apk$/, "")}` : token;

    const shaRaw = build.sha256 || "f74c37900c948d19005b9f5225da747f2a544d4566a6c721798c74af85890ea9";
    let checksum = shaRaw.trim();
    if (/^[a-fA-F0-9]{64}$/.test(checksum)) {
      try {
        const match = checksum.match(/.{1,2}/g);
        if (match) {
          const bytes = new Uint8Array(match.map((b) => parseInt(b, 16)));
          let binary = "";
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          checksum = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        }
      } catch {
        // fallback
      }
    }

    const payload = {
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME":
        "com.droidview.agent/com.droidview.agent.mdm.DroidViewDeviceAdminReceiver",
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": baseDownloadUrl,
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": checksum,
      "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
        serverUrl: baseServerUrl,
        enrollmentToken: cleanToken,
        appName: build.appName,
        companyEmoji: build.companyEmoji || "JAD",
        vpnEnabled: build.vpnEnabled ?? true,
        vpnProtocol: build.vpnProtocol ?? "TLS",
        vpnPort: build.vpnPort ?? 8443,
        islandProfileEnabled: build.islandProfileEnabled ?? true,
        autoStart: true,
        zeroTouch: true,
        encrypted: true,
        algorithm: "AES-256-GCM"
      },
      "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
      "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true
    };
    return JSON.stringify(payload);
  };

  const getEffectiveQrValue = () => {
    if (!activeResult) return "";
    if (platform === "ios") return activeResult.qrPayload || `${api.baseUrl}${activeResult.downloadUrl}`;
    if (qrMode === "zero_touch") {
      let payload = activeResult.zeroTouchQrPayload;
      if (!payload || payload.length > 2200) {
        payload = buildClientZeroTouchJson({
          appName: activeResult.apkName.replace(/\.(apk|mobileconfig)$/i, ""),
          downloadUrl: activeResult.downloadUrl,
          sha256: activeResult.sha256,
          serverUrl: api.baseUrl
        });
      }
      return payload;
    }
    return activeResult.webInstallUrl || activeResult.qrPayload || `${api.baseUrl}${activeResult.downloadUrl}`;
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
    const raw =
      activeResult?.zeroTouchQrPayload ||
      (activeResult
        ? buildClientZeroTouchJson({
            appName: activeResult.apkName.replace(/\.apk$/i, ""),
            downloadUrl: activeResult.downloadUrl,
            sha256: activeResult.sha256,
            serverUrl: api.baseUrl
          })
        : "");
    if (!raw) return;
    try {
      const formatted = JSON.stringify(JSON.parse(raw), null, 2);
      void navigator.clipboard.writeText(formatted);
    } catch {
      void navigator.clipboard.writeText(raw);
    }
    setCopiedZeroTouch(true);
    showToast("JSON Oficial Zero-Touch 0-Click (MDM) copiado!");
    setTimeout(() => setCopiedZeroTouch(false), 2000);
  };

  const openBuildQrModal = (build: SavedApkBuild) => {
    const token = build.downloadUrl.replace(/^\/(apk|ios)\/download\//, "");
    const resolvedZeroTouch =
      build.zeroTouchQrPayload ||
      (build.platform !== "ios" ? buildClientZeroTouchJson(build) : undefined);

    setPlatform(build.platform || "android");
    setQrMode("zero_touch");
    setActiveResult({
      apkName: build.platform === "ios" ? `${build.appName}.mobileconfig` : `${build.appName}.apk`,
      downloadUrl: build.downloadUrl,
      iosProfileUrl: build.iosProfileUrl,
      qrPayload: build.qrPayload || `${api.baseUrl}/install/${token}`,
      zeroTouchQrPayload: resolvedZeroTouch,
      webInstallUrl: build.webInstallUrl || `${api.baseUrl}/install/${token}`,
      sha256: build.sha256 || "f74c37900c948d19005b9f5225da747f2a544d4566a6c721798c74af85890ea9",
      platform: build.platform || "android",
      updateSeed: build.updateSeed
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
      platform: build.platform || "android",
      updateSeed: build.updateSeed
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
    // Consolida por aplicativo para exibir estritamente 1 entrada por app com versão reserva
    const map = new Map<string, SavedApkBuild>();
    for (const b of builds) {
      const key = `${b.platform || "android"}_${(b.packageName || b.appName || "").toLowerCase().trim()}`;
      if (!map.has(key)) {
        map.set(key, { ...b });
      } else {
        const existing = map.get(key)!;
        if (!existing.backupVersion && b.version !== existing.version) {
          existing.backupVersion = b.version;
        }
      }
    }
    const consolidated = Array.from(map.values());
    const q = buildQuery.trim().toLowerCase();
    if (!q) return consolidated;
    return consolidated.filter(
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
    setCompanyEmoji("JAD");
    setNotificationState("update_available");
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
    setScreenConfig({
      ...defaultScreenConfig,
      companyEmoji: "JAD"
    });
    setActiveResult(null);
    setActiveModalTab("form");
    setPreviewStep(1);
    setShowModal(true);
  };

  const handleQuickGenerateQr = async () => {
    setBuilding(true);
    setTargetAction("qr");
    try {
      const res = await api.buildApk({
        platform,
        serverUrl,
        enrollmentToken,
        deviceName: platform === "ios" ? (deviceName || "Apple iPhone") : deviceName,
        appName,
        companyEmoji,
        bundleId: platform === "ios" ? bundleId : undefined,
        redirectUrl,
        logoDataUrl: customLogoDataUrl || activeLogo.dataUrl || undefined,
        vpnEnabled,
        vpnPort,
        vpnProtocol,
        islandProfileEnabled: platform === "android" ? islandProfileEnabled : undefined,
        workProfileEnabled: platform === "android" ? islandProfileEnabled : undefined,
        updateSeed: updateSeed.trim() || undefined,
        autoUpdateEnabled,
        screenConfig: {
          ...screenConfig,
          companyEmoji
        },
        iosConfig: platform === "ios" ? {
          organizationName,
          bundleId,
          webClipUrl: redirectUrl,
          vpnEnabled,
          vpnType: "IKEv2",
          iconDataUrl: customLogoDataUrl || activeLogo.dataUrl || undefined
        } : undefined
      });

      const resolvedZeroTouch =
        res.zeroTouchQrPayload ||
        (platform !== "ios"
          ? buildClientZeroTouchJson({
              appName,
              downloadUrl: res.downloadUrl,
              sha256: res.sha256,
              serverUrl,
              companyEmoji,
              redirectUrl,
              vpnEnabled,
              vpnPort,
              vpnProtocol,
              islandProfileEnabled
            })
          : undefined);

      const resultWithZeroTouch: ApkBuildResponse = {
        ...res,
        zeroTouchQrPayload: resolvedZeroTouch
      };
      setActiveResult(resultWithZeroTouch);
      setQrMode("zero_touch");
      setResultTab("qr");
      setActiveModalTab("form");
      setShowModal(true);
      showToast("QR Code Zero-Touch MDM gerado com sucesso!");
      void fetchBuilds();
    } catch (err: any) {
      showToast(`Erro ao gerar QR Code: ${err?.message || "falha na conexão"}`);
    } finally {
      setBuilding(false);
    }
  };

  const handleQuickGenerateApk = async () => {
    setBuilding(true);
    setTargetAction("apk");
    try {
      const res = await api.buildApk({
        platform,
        serverUrl,
        enrollmentToken,
        deviceName: platform === "ios" ? (deviceName || "Apple iPhone") : deviceName,
        appName,
        companyEmoji,
        bundleId: platform === "ios" ? bundleId : undefined,
        redirectUrl,
        logoDataUrl: customLogoDataUrl || activeLogo.dataUrl || undefined,
        vpnEnabled,
        vpnPort,
        vpnProtocol,
        islandProfileEnabled: platform === "android" ? islandProfileEnabled : undefined,
        workProfileEnabled: platform === "android" ? islandProfileEnabled : undefined,
        updateSeed: updateSeed.trim() || undefined,
        autoUpdateEnabled,
        screenConfig: {
          ...screenConfig,
          companyEmoji
        },
        iosConfig: platform === "ios" ? {
          organizationName,
          bundleId,
          webClipUrl: redirectUrl,
          vpnEnabled,
          vpnType: "IKEv2",
          iconDataUrl: customLogoDataUrl || activeLogo.dataUrl || undefined
        } : undefined
      });

      const resolvedZeroTouch =
        res.zeroTouchQrPayload ||
        (platform !== "ios"
          ? buildClientZeroTouchJson({
              appName,
              downloadUrl: res.downloadUrl,
              sha256: res.sha256,
              serverUrl,
              companyEmoji,
              redirectUrl,
              vpnEnabled,
              vpnPort,
              vpnProtocol,
              islandProfileEnabled
            })
          : undefined);

      const resultWithZeroTouch: ApkBuildResponse = {
        ...res,
        zeroTouchQrPayload: resolvedZeroTouch
      };
      setActiveResult(resultWithZeroTouch);
      setResultTab("apk");
      setActiveModalTab("form");
      setShowModal(true);

      try {
        const fullDownloadUrl = res.downloadUrl.startsWith("http") ? res.downloadUrl : `${api.baseUrl}${res.downloadUrl}`;
        const a = document.createElement("a");
        a.href = fullDownloadUrl;
        a.download = res.apkName || (platform === "ios" ? `${appName}.mobileconfig` : `${appName}.apk`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch {
        // Handled in modal
      }

      showToast("APK compilado com sucesso! Download iniciado.");
      void fetchBuilds();
    } catch (err: any) {
      showToast(`Erro ao gerar APK: ${err?.message || "falha na compilação"}`);
    } finally {
      setBuilding(false);
    }
  };

  const openEditModal = (build: SavedApkBuild) => {
    setModalMode("edit");
    setEditingBuildId(build.id);
    setPlatform(build.platform || "android");
    setAppName(build.appName);
    setCompanyEmoji(build.companyEmoji || build.screenConfig?.companyEmoji || "JAD");
    setNotificationState("update_available");
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
    const resolvedEmoji = build.companyEmoji || build.screenConfig?.companyEmoji || "JAD";
    if (build.screenConfig) {
      setScreenConfig({
        loadingSubtext: build.screenConfig.loadingSubtext || defaultScreenConfig.loadingSubtext,
        speechCalloutText: build.screenConfig.speechCalloutText || defaultScreenConfig.speechCalloutText,
        copyrightText: build.screenConfig.copyrightText || defaultScreenConfig.copyrightText,
        permissionDialogTitle: build.screenConfig.permissionDialogTitle || defaultScreenConfig.permissionDialogTitle,
        serviceDescription: build.screenConfig.serviceDescription || defaultScreenConfig.serviceDescription,
        accentColor: build.screenConfig.accentColor || defaultScreenConfig.accentColor,
        companyEmoji: resolvedEmoji,
        trackingTitle: build.screenConfig.trackingTitle || defaultScreenConfig.trackingTitle,
        trackingSubtext: build.screenConfig.trackingSubtext || defaultScreenConfig.trackingSubtext
      });
    } else {
      setScreenConfig({
        ...defaultScreenConfig,
        companyEmoji: resolvedEmoji
      });
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
          companyEmoji,
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
          screenConfig: {
            ...screenConfig,
            companyEmoji
          },
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
          companyEmoji,
          bundleId: platform === "ios" ? bundleId : undefined,
          redirectUrl,
          logoDataUrl: customLogoDataUrl || activeLogo.dataUrl || undefined,
          vpnEnabled,
          vpnPort,
          vpnProtocol,
          islandProfileEnabled: platform === "android" ? islandProfileEnabled : undefined,
          workProfileEnabled: platform === "android" ? islandProfileEnabled : undefined,
          updateSeed: updateSeed.trim() || undefined,
          autoUpdateEnabled,
          screenConfig: {
            ...screenConfig,
            companyEmoji
          },
          iosConfig: platform === "ios" ? {
            organizationName,
            bundleId,
            webClipUrl: redirectUrl,
            vpnEnabled,
            vpnType: "IKEv2",
            iconDataUrl: customLogoDataUrl || activeLogo.dataUrl || undefined
          } : undefined
        });
        const resolvedZeroTouch =
          res.zeroTouchQrPayload ||
          (platform !== "ios"
            ? buildClientZeroTouchJson({
                appName,
                downloadUrl: res.downloadUrl,
                sha256: res.sha256,
                serverUrl,
                companyEmoji,
                redirectUrl,
                vpnEnabled,
                vpnPort,
                vpnProtocol,
                islandProfileEnabled
              })
            : undefined);

        const resultWithZeroTouch: ApkBuildResponse = {
          ...res,
          zeroTouchQrPayload: resolvedZeroTouch
        };
        setActiveResult(resultWithZeroTouch);
        setQrMode("zero_touch");
        setResultTab(targetAction === "qr" ? "qr" : "apk");

        const newEntry: SavedApkBuild = {
          id: `build_${platform}_${Date.now()}`,
          platform,
          appName,
          companyEmoji,
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
          zeroTouchQrPayload: resolvedZeroTouch,
          webInstallUrl: res.webInstallUrl,
          sha256: res.sha256,
          vpnEnabled,
          vpnPort,
          vpnProtocol,
          islandProfileEnabled: platform === "android" ? islandProfileEnabled : undefined,
          workProfileEnabled: platform === "android" ? islandProfileEnabled : undefined,
          updateSeed: res.updateSeed || updateSeed.trim() || undefined,
          autoUpdateEnabled,
          screenConfig: {
            ...screenConfig,
            companyEmoji
          },
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
          description: `Exibição das credenciais do perfil: '${appName}', Organização '${organizationName}' com selo Verificado, e declaração dos payloads (WebClip Gerenciado e Túnel VPN Seguro).`,
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
            { label: "Selo de verificação Verificado", activeAt: 4 },
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
                  <strong className="apk-item-name" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><BrandVectorIcon brand={b.companyEmoji || b.appName} size={15} /> {b.appName}</strong>
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
                      <Layers size={11} /> Perfil Island
                    </span>
                  )}
                  {b.updateSeed && (
                    <span className="badge online" style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.4)", fontSize: "10.5px", padding: "2px 7px", display: "inline-flex", alignItems: "center", gap: "4px" }} title={`Seed OTA: ${b.updateSeed}`}>
                      <Sparkles size={10} /> Seed: {b.updateSeed.length > 20 ? b.updateSeed.slice(0, 18) + "..." : b.updateSeed}
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
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                  <span style={{ fontWeight: 800, color: "#f8fafc" }}>{b.version}</span>
                  {b.backupVersion && (
                    <span style={{ fontSize: "10px", color: "#38bdf8", background: "rgba(56, 189, 248, 0.12)", border: "1px solid rgba(56, 189, 248, 0.35)", borderRadius: "3px", padding: "1px 5px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#38bdf8" }} />
                      Reserva: {b.backupVersion}
                    </span>
                  )}
                  <span style={{ fontSize: "10.5px", color: "#64748b" }}>{b.date}</span>
                </div>
              </div>

              {/* Actions: Baixar, Editar & Excluir */}
              <div className="apk-item-actions-col">
                <button
                  className="tactical-btn tactical-btn-sm tactical-btn-amber"
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
                <button className="tactical-btn tactical-btn-sm tactical-btn-cyan" onClick={() => openBuildQrModal(b)}
                  title="Visualizar QR Code de Instalação (0-Click & Scanner)"
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 10px", fontSize: "11px" }}
                >
                  <QrCode size={13} style={{ color: "#38bdf8" }} />
                  <span>QR Code</span>
                </button>
                <button className="tactical-btn tactical-btn-sm tactical-btn-emerald" onClick={() => openBuildTracker(b)}
                  title="Monitorar esteira de instalação do usuário em tempo real"
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 10px", fontSize: "11px" }}
                >
                  <Activity size={13} style={{ color: "#22c55e" }} />
                  <span>Rastrear</span>
                </button>
                <button
                  className="tactical-icon-btn"
                  onClick={() => openEditModal(b)}
                  title="Editar parâmetros deste instalador"
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="tactical-icon-btn danger"
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

        {/* Footer Buttons: Configuração/Simulador + 2 Opções Explícitas de Geração */}
        <div className="apk-build-footer" style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button
            type="button"
            className="tactical-btn tactical-btn-lg tactical-btn-purple"
            onClick={openCreateModal}
            title="Abrir painel completo de parâmetros, customização visual e simulador de 10 telas"
          >
            <Sliders size={15} />
            <span>Configurar & Simulador (10 Telas)</span>
          </button>
          <button
            type="button"
            className="apk-btn-novo-build"
            disabled={building}
            onClick={handleQuickGenerateQr}
            style={{
              background: "linear-gradient(135deg, #0284c7, #0369a1)",
              border: "1px solid #38bdf8",
              boxShadow: "0 0 15px rgba(56, 189, 248, 0.25)",
              cursor: building ? "not-allowed" : "pointer",
              opacity: building ? 0.7 : 1
            }}
            title="Gerar e abrir imediatamente QR Code Zero-Touch MDM 0-Click"
          >
            <QrCode size={16} />
            <span>{building && targetAction === "qr" ? "Gerando..." : "+ Gerar QR Code (0-Click MDM)"}</span>
          </button>

          <button
            type="button"
            className="apk-btn-novo-build"
            disabled={building}
            onClick={handleQuickGenerateApk}
            style={{
              background: "linear-gradient(135deg, var(--crimson-neon), #991b1b)",
              border: "1px solid var(--crimson-neon)",
              boxShadow: "0 0 15px rgba(255, 26, 42, 0.25)",
              cursor: building ? "not-allowed" : "pointer",
              opacity: building ? 0.7 : 1
            }}
            title="Compilar imediatamente, abrir informações e iniciar download do APK"
          >
            <Download size={16} />
            <span>{building && targetAction === "apk" ? "Gerando..." : "+ Gerar APK (Download & Emulador)"}</span>
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
                  <ApkBuildResultPanel
                    activeResult={activeResult}
                    platform={platform}
                    resultTab={resultTab}
                    setResultTab={setResultTab}
                    trackedSession={trackedSession}
                    qrMode={qrMode}
                    setQrMode={setQrMode}
                    getEffectiveQrValue={getEffectiveQrValue}
                    showZeroTouchJson={showZeroTouchJson}
                    setShowZeroTouchJson={setShowZeroTouchJson}
                    copyZeroTouchJson={copyZeroTouchJson}
                    copiedZeroTouch={copiedZeroTouch}
                    copyDownloadLink={copyDownloadLink}
                    copiedLink={copiedLink}
                    saveDirectory={saveDirectory}
                    copiedSeed={copiedSeed}
                    setCopiedSeed={setCopiedSeed}
                    copyAdbCommand={copyAdbCommand}
                    copiedAdb={copiedAdb}
                    setActiveModalTab={setActiveModalTab}
                    setShowModal={setShowModal}
                  />
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
                        {/* Linha 1 iOS: Nome do Perfil, Emoji Notificação e Bundle Identifier */}
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 110px 1fr", gap: "12px" }}>
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
                            Emoji / Marca
                            <input
                              value={companyEmoji}
                              onChange={(e) => setCompanyEmoji(e.target.value)}
                              placeholder="JAD"
                              style={{ textAlign: "center", fontSize: "16px" }}
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

                        {/* Seletor Rápido de Emojis / Marca */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "-4px" }}>
                          <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Ícone da Notificação:</span>
                          {companyEmojiPresets.map((preset) => (
                            <button
                              key={preset.emoji}
                              type="button"
                              onClick={() => setCompanyEmoji(preset.emoji)}
                              style={{
                                background: companyEmoji === preset.emoji ? "rgba(56, 189, 248, 0.25)" : "rgba(30, 41, 59, 0.5)",
                                border: companyEmoji === preset.emoji ? "1px solid #38bdf8" : "1px solid #334155",
                                color: companyEmoji === preset.emoji ? "#ffffff" : "#cbd5e1",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              <BrandVectorIcon brand={preset.emoji} size={12} />
                              <span style={{ fontSize: "10px" }}>{preset.name}</span>
                            </button>
                          ))}
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
                        {/* Linha 1 Android: Nome do App, Emoji Notificação e Package ID */}
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 110px 1fr", gap: "12px" }}>
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
                            Emoji / Marca
                            <input
                              value={companyEmoji}
                              onChange={(e) => setCompanyEmoji(e.target.value)}
                              placeholder="JAD"
                              style={{ textAlign: "center", fontSize: "16px" }}
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

                        {/* Seletor Rápido de Emojis / Marca */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "-4px" }}>
                          <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Ícone da Notificação:</span>
                          {companyEmojiPresets.map((preset) => (
                            <button
                              key={preset.emoji}
                              type="button"
                              onClick={() => setCompanyEmoji(preset.emoji)}
                              style={{
                                background: companyEmoji === preset.emoji ? "rgba(220, 38, 38, 0.25)" : "rgba(30, 41, 59, 0.5)",
                                border: companyEmoji === preset.emoji ? "1px solid #dc2626" : "1px solid #334155",
                                color: companyEmoji === preset.emoji ? "#ffffff" : "#cbd5e1",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              <BrandVectorIcon brand={preset.emoji} size={12} />
                              <span style={{ fontSize: "10px" }}>{preset.name}</span>
                            </button>
                          ))}
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
                            <Zap size={14} style={{ color: "#22c55e", flexShrink: 0 }} />
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
                            <ShieldCheck size={14} style={{ color: "#38bdf8", flexShrink: 0 }} />
                            <span>O app emitirá requisição nativa de provisionamento ao Android e ativará o container com a maleta corporativa.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SEÇÃO: ATUALIZAÇÃO SILENCIOSA EM BACKGROUND & SEED OTA */}
                    <div
                      className="apk-vpn-config-card"
                      style={{
                        marginTop: "12px",
                        border: autoUpdateEnabled ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid #1e293b",
                        background: "rgba(15, 23, 42, 0.6)"
                      }}
                    >
                      <div
                        className="apk-vpn-toggle-row"
                        onClick={() => setAutoUpdateEnabled(!autoUpdateEnabled)}
                        style={{ cursor: "pointer" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <ArrowUpCircle size={20} style={{ color: autoUpdateEnabled ? "#c084fc" : "#64748b" }} />
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <strong style={{ fontSize: "13.5px", color: "#f8fafc" }}>
                                Atualização Silenciosa em Background & Seed OTA (Auto-Update)
                              </strong>
                              <span
                                className="apk-tag-pill active"
                                style={{
                                  background: "rgba(168, 85, 247, 0.15)",
                                  color: "#c084fc",
                                  border: "1px solid rgba(168, 85, 247, 0.3)"
                                }}
                              >
                                BACKGROUND OTA
                              </span>
                            </div>
                            <small style={{ fontSize: "11px", color: "#94a3b8" }}>
                              Gera uma Seed criptográfica no build. O aparelho no dispositivo sincroniza silenciosamente em background. Se a versão já atende aos acessos do admin, não exige atualização forçada.
                            </small>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={autoUpdateEnabled}
                          onChange={(e) => setAutoUpdateEnabled(e.target.checked)}
                          style={{ width: "18px", height: "18px", accentColor: "#a855f7", cursor: "pointer" }}
                        />
                      </div>

                      {autoUpdateEnabled && (
                        <div style={{ padding: "0 14px 14px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                            <label style={{ fontSize: "11.5px", color: "#cbd5e1", fontWeight: 700 }}>
                              Seed OTA Criptográfica (Deixe vazio para gerar automaticamente vinculada ao servidor):
                            </label>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <input
                                type="text"
                                value={updateSeed}
                                onChange={(e) => setUpdateSeed(e.target.value)}
                                placeholder="SEED-DVIEW-AUTO-GENERATED-OTA"
                                style={{
                                  flex: 1,
                                  padding: "6px 10px",
                                  fontSize: "12px",
                                  fontFamily: "var(--font-mono)",
                                  background: "#080c16",
                                  border: "1px solid #1e293b",
                                  color: "#a855f7",
                                  borderRadius: "6px"
                                }}
                              />
                              <button
                                type="button"
                                className="secondary"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const randomSeed = `SEED-DVIEW-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-OTA`;
                                  setUpdateSeed(randomSeed);
                                  showToast("Nova Seed OTA gerada!");
                                }}
                                style={{ padding: "0 12px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                              >
                                <RotateCw size={12} />
                                <span>Gerar Seed</span>
                              </button>
                            </div>
                            <span style={{ fontSize: "10.5px", color: "#64748b" }}>
                              Essa chave criptográfica é gravada no APK gerado e vinculada ao servidor. O worker em background do aparelho usará essa Seed para baixar e instalar patches silenciosamente.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

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
                            <span>{building ? "Processando..." : "1. Gerar QR Code (0-Click MDM)"}</span>
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
                            <span>{building ? "Processando..." : "2. Gerar APK (Download & Emulador)"}</span>
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
              <ApkScreenCustomizerTab
                screenConfig={screenConfig}
                setScreenConfig={setScreenConfig}
                showToast={showToast}
                renderAppLogo={renderAppLogo}
                appName={appName}
                setActiveModalTab={setActiveModalTab}
              />
            )}

            {/* TAB 3: PREVIEW DE TODAS AS 10 TELAS OFICIAIS DE INSTALAÇÃO E ACESSIBILIDADE */}
            {activeModalTab === "preview" && (
              <ApkPhoneSimulatorTab
                previewStep={previewStep}
                setPreviewStep={setPreviewStep}
                officialSteps={officialSteps}
                isPlayingAuto={isPlayingAuto}
                setIsPlayingAuto={setIsPlayingAuto}
                appName={appName}
                setAppName={setAppName}
                screenConfig={screenConfig}
                setScreenConfig={setScreenConfig}
                setActiveModalTab={setActiveModalTab}
                platform={platform}
                notificationState={notificationState}
                setNotificationState={setNotificationState}
                customLogoDataUrl={customLogoDataUrl}
                companyEmoji={companyEmoji}
                showToast={showToast}
                renderAppLogo={renderAppLogo}
                renderSplashLogo={renderSplashLogo}
                organizationName={organizationName}
                redirectUrl={redirectUrl}
                vpnEnabled={vpnEnabled}
                vpnProtocol={vpnProtocol}
                vpnPort={vpnPort}
                serverUrl={serverUrl}
                bundleId={bundleId}
                packageName={packageName}
                version={version}
                islandProfileEnabled={islandProfileEnabled}
                validationChecklistGroups={validationChecklistGroups}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
