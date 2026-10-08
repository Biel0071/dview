import type { ControlDevice, InstalledAppItem } from "../../types";

export interface ScreenViewProps {
  device: ControlDevice;
  activeApp?: InstalledAppItem | null;
  onCloseApp?: () => void;
  allDevices?: ControlDevice[];
  onSelectDevice?: (device: ControlDevice) => void;
}

export interface AccessibilityNode {
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
  if (
    /^(?:android\.(?:view|widget|webkit)\.)?(?:View|ViewGroup|FrameLayout|LinearLayout|RelativeLayout|RecyclerView|ImageView|ImageButton|Button|TextView|Elemento|ScrollView|ViewPager|ViewStub|Space|TableRow|TableLayout|GridLayout)$/i.test(
      cleaned
    )
  ) {
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

  // Inside a Store app (like Google Play Store)
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

export type StreamQualityTier = "ultra" | "high" | "balance" | "fluid";

export interface QualityProfile {
  tier: StreamQualityTier;
  label: string;
  shortLabel: string;
  resolution: string;
  scale: number;
  targetFps: number;
  imageSmoothing: ImageSmoothingQuality;
  color: string;
  badgeBg: string;
  description: string;
}

export const QUALITY_PROFILES: Record<StreamQualityTier, QualityProfile> = {
  ultra: {
    tier: "ultra",
    label: "1080p Ultra (FHD)",
    shortLabel: "1080p",
    resolution: "1080×1920",
    scale: 1.0,
    targetFps: 30,
    imageSmoothing: "high",
    color: "#10b981",
    badgeBg: "rgba(16, 185, 129, 0.18)",
    description: "Máxima nitidez e resolução para redes velozes e sinal ótimo"
  },
  high: {
    tier: "high",
    label: "720p Alta (HD)",
    shortLabel: "720p",
    resolution: "720×1280",
    scale: 0.8,
    targetFps: 26,
    imageSmoothing: "medium",
    color: "#38bdf8",
    badgeBg: "rgba(56, 189, 248, 0.18)",
    description: "Alta definição equilibrada, excelente taxa de quadros e baixo consumo"
  },
  balance: {
    tier: "balance",
    label: "540p Equilibrada (qHD)",
    shortLabel: "540p",
    resolution: "540×960",
    scale: 0.6,
    targetFps: 22,
    imageSmoothing: "medium",
    color: "#f59e0b",
    badgeBg: "rgba(245, 158, 11, 0.18)",
    description: "Modo equilibrado para conexões oscilantes, mantém velocidade contínua"
  },
  fluid: {
    tier: "fluid",
    label: "360p Fluida / Eco",
    shortLabel: "360p",
    resolution: "360×640",
    scale: 0.45,
    targetFps: 18,
    imageSmoothing: "low",
    color: "#f97316",
    badgeBg: "rgba(249, 115, 22, 0.18)",
    description: "Modo fluído para sinal baixo, zero travamento e conexão ininterrupta"
  }
};

export interface ParsedBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
  heightPercent: number;
}

export function parseBounds(boundsStr: string, screenW = 720, screenH = 1280): ParsedBounds | null {
  if (!boundsStr) return null;
  let left = 0,
    top = 0,
    right = 0,
    bottom = 0;
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
}

export interface ActiveDragGesture {
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

export interface SyncedRipple {
  id: number | string;
  pctX: number;
  pctY: number;
  devX?: number;
  devY?: number;
  source: "live" | "skeleton" | "remote";
}
