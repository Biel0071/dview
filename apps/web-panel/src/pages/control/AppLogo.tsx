import React, { useState } from "react";

interface AppLogoProps {
  name?: string;
  packageName?: string;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  iconUrl?: string;
}

export function getAppPngIconUrl(name = "", packageName = ""): string {
  const lower = (name + " " + packageName).toLowerCase();
  if (lower.includes("vending") || lower.includes("play store") || lower.includes("playstore")) {
    return "/icons/com.android.vending.png";
  }
  if (lower.includes("play.games") || lower.includes("play games") || lower.includes("playgames")) {
    return "/icons/com.google.android.play.games.png";
  }
  if (lower.includes("firefox")) {
    return "/icons/org.mozilla.firefox.png";
  }
  if (lower.includes("chrome") || lower.includes("chromium")) {
    return "/icons/com.android.chrome.png";
  }
  if (lower.includes("droidview") || lower.includes("jadlog") || lower.includes("jad log") || lower.includes("entregue")) {
    return "/icons/com.droidview.agent.png";
  }
  if (lower.includes("settings") || lower.includes("configura")) {
    return "/icons/com.android.settings.png";
  }
  if (lower.includes("roblox")) {
    return "/icons/com.roblox.client.png";
  }
  if (lower.includes("brawl")) {
    return "/icons/com.supercell.brawlstars.png";
  }
  if (lower.includes("subway")) {
    return "/icons/com.kiloo.subwaysurf.png";
  }
  if (lower.includes("whatsapp") || lower.includes("whats")) {
    return "/icons/com.whatsapp.png";
  }
  if (lower.includes("nubank") || lower.includes("nu.")) {
    return "/icons/com.nu.production.png";
  }
  if (lower.includes("itau") || lower.includes("itaú")) {
    return "/icons/com.itau.png";
  }
  if (lower.includes("youtube")) {
    return "/icons/com.google.android.youtube.png";
  }
  if (lower.includes("launcher") || lower.includes("tela inicial") || lower.includes("inicio")) {
    return "/icons/com.microvirt.launcher2.png";
  }
  if (lower.includes("tools")) {
    return "/icons/com.android.tools.png";
  }
  if (lower.includes("galeria") || lower.includes("gallery")) {
    return "/icons/com.android.gallery3d.png";
  }
  if (lower.includes("download") || lower.includes("document")) {
    return "/icons/com.android.documentsui.png";
  }
  if (lower.includes("arquivos") || lower.includes("filemanager")) {
    return "/icons/com.cyanogenmod.filemanager.png";
  }

  // If specific package name file exists in public/icons
  if (packageName && !packageName.includes(" ")) {
    return `/icons/${packageName}.png`;
  }

  return "/icons/android.default.png";
}

export function AppLogo({
  name = "",
  packageName = "",
  size = 28,
  className = "",
  style = {},
  iconUrl
}: AppLogoProps) {
  const [hasError, setHasError] = useState(false);
  const px = typeof size === "number" ? `${size}px` : size;

  // Real PNG image source
  const src = iconUrl || (hasError ? "/icons/android.default.png" : getAppPngIconUrl(name, packageName));

  return (
    <div
      className={`app-real-icon-wrapper ${className}`}
      style={{
        width: px,
        height: px,
        minWidth: px,
        minHeight: px,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "6px",
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
        ...style
      }}
      title={name || packageName || "Aplicativo"}
    >
      <img
        src={src}
        alt={name || packageName || "App Icon"}
        loading="lazy"
        onError={() => {
          if (!hasError) setHasError(true);
        }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block"
        }}
      />
    </div>
  );
}
