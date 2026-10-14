import React from "react";
import {
  Building2,
  CreditCard,
  Layers,
  Mail,
  Package,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Truck,
  Zap
} from "lucide-react";

export interface BrandVectorIconProps {
  brand?: string | null;
  appName?: string | null;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Strips raw Unicode emojis and dingbats from text so dynamic strings
 * from backend or presets never render raw OS emojis in the UI.
 */
export function stripEmojis(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Renders a crisp vector SVG icon for any corporate brand profile or legacy emoji key.
 */
export const BrandVectorIcon: React.FC<BrandVectorIconProps> = ({
  brand,
  appName,
  size = 13,
  style,
  className
}) => {
  const combined = `${brand || ""} ${appName || ""}`.toLowerCase();

  if (combined.includes("🛍") || combined.includes("renner") || combined.includes("varejo") || combined.includes("loja")) {
    return <ShoppingBag size={size} className={className} style={{ color: "#f43f5e", flexShrink: 0, ...style }} />;
  }
  if (combined.includes("💳") || combined.includes("banco") || combined.includes("finan") || combined.includes("nubank") || combined.includes("itau")) {
    return <CreditCard size={size} className={className} style={{ color: "#a855f7", flexShrink: 0, ...style }} />;
  }
  if (combined.includes("📮") || combined.includes("sedex") || combined.includes("correios")) {
    return <Mail size={size} className={className} style={{ color: "#facc15", flexShrink: 0, ...style }} />;
  }
  if (combined.includes("🚚") || combined.includes("loggi") || combined.includes("express") || combined.includes("entrega")) {
    return <Truck size={size} className={className} style={{ color: "#38bdf8", flexShrink: 0, ...style }} />;
  }
  if (combined.includes("🏢") || combined.includes("corp") || combined.includes("empres")) {
    return <Building2 size={size} className={className} style={{ color: "#94a3b8", flexShrink: 0, ...style }} />;
  }
  if (combined.includes("⚡") || combined.includes("dview")) {
    return <Zap size={size} className={className} style={{ color: "#ff1a2a", flexShrink: 0, ...style }} />;
  }
  if (combined.includes("🏝") || combined.includes("island")) {
    return <Layers size={size} className={className} style={{ color: "#38bdf8", flexShrink: 0, ...style }} />;
  }
  if (combined.includes("🛡") || combined.includes("vpn") || combined.includes("sec")) {
    return <ShieldCheck size={size} className={className} style={{ color: "#22c55e", flexShrink: 0, ...style }} />;
  }
  if (combined.includes("📦") || combined.includes("jadlog") || combined.includes("rastreio") || combined.includes("encomenda")) {
    return <Package size={size} className={className} style={{ color: "#f87171", flexShrink: 0, ...style }} />;
  }
  if (combined.includes("📱") || combined.includes("ios") || combined.includes("android")) {
    return <Smartphone size={size} className={className} style={{ color: "#38bdf8", flexShrink: 0, ...style }} />;
  }

  return <Package size={size} className={className} style={{ color: "#f87171", flexShrink: 0, ...style }} />;
};
