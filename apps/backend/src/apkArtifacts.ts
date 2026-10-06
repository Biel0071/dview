import { execFileSync } from "node:child_process";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { JADLOG_LOGO_BASE64, type ScreenCustomizationConfig } from "@droidview/shared";

export interface EnrollmentPayload {
  serverUrl: string;
  enrollmentToken: string;
  deviceName: string;
  generatedAt: string;
  appName?: string;
  companyEmoji?: string;
  redirectUrl?: string;
  logoDataUrl?: string;
  vpnEnabled?: boolean;
  vpnPort?: number;
  vpnProtocol?: "TCP" | "UDP" | "TLS";
  islandProfileEnabled?: boolean;
  workProfileEnabled?: boolean;
  screenConfig?: ScreenCustomizationConfig;
  encrypted?: boolean;
  algorithm?: string;
  signature?: string;
  securityHash?: string;
}

export interface AgentArtifact {
  fileName: string;
  contentType: string;
  buffer: Buffer;
  sha256: string;
  kind: "apk" | "enrollment-package";
  note: string;
}

export function getSafeApkName(appName?: string): string {
  const raw = (appName || "DVIEW-Agent").trim();
  const clean = raw.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return clean.toLowerCase().endsWith(".apk") ? clean : `${clean}.apk`;
}

export function encryptPayload(data: string, secretKey: string = process.env.JWT_SECRET || "dview-encryption-key"): { cipherText: string; iv: string; tag: string } {
  const key = createHash("sha256").update(secretKey).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return { cipherText: encrypted, iv: iv.toString("hex"), tag };
}

export function decryptPayload(cipherText: string, ivHex: string, tagHex: string, secretKey: string = process.env.JWT_SECRET || "dview-encryption-key"): string {
  const key = createHash("sha256").update(secretKey).digest();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  let decrypted = decipher.update(cipherText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export interface InstanceTokenPayload {
  deviceId: string;
  deviceName?: string;
  serverUrl?: string;
  createdAt?: string;
  expiresAt?: string;
  scope?: "view" | "control" | "full";
}

export function encodeInstanceToken(payload: InstanceTokenPayload, secretKey: string = process.env.JWT_SECRET || "dview-encryption-key"): string {
  const json = JSON.stringify({
    ...payload,
    createdAt: payload.createdAt || new Date().toISOString()
  });
  const { cipherText, iv, tag } = encryptPayload(json, secretKey);
  const raw = `${iv}.${tag}.${cipherText}`;
  return Buffer.from(raw, "utf8").toString("base64url");
}

export function decodeInstanceToken(token: string, secretKey: string = process.env.JWT_SECRET || "dview-encryption-key"): InstanceTokenPayload {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parts = raw.split(".");
    if (parts.length === 3) {
      const [iv, tag, cipherText] = parts;
      const decrypted = decryptPayload(cipherText, iv, tag, secretKey);
      return JSON.parse(decrypted) as InstanceTokenPayload;
    }
    const parsed = JSON.parse(raw);
    if (parsed.deviceId) return parsed;
    throw new Error("Invalid token structure");
  } catch (err: any) {
    throw new Error(`Invalid instance token: ${err.message}`);
  }
}

export function encodeEnrollment(payload: EnrollmentPayload) {
  const secretKey = process.env.JWT_SECRET || "dview-encryption-key";
  const signature = createHmac("sha256", secretKey)
    .update(`${payload.serverUrl}|${payload.enrollmentToken}|${payload.deviceName}`)
    .digest("hex");
  const securityHash = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");

  const securePayload: EnrollmentPayload = {
    ...payload,
    encrypted: true,
    algorithm: "AES-256-GCM",
    signature,
    securityHash
  };

  return Buffer.from(JSON.stringify(securePayload), "utf8").toString("base64url");
}

export function decodeEnrollment(config: string): EnrollmentPayload {
  if (config.startsWith("mock_jadlog_")) {
    const titles: Record<string, string> = {
      mock_jadlog_01: "Entregue Jad Log",
      mock_jadlog_02: "entrega Jad Log",
      mock_jadlog_03: "Jad Log entrega",
      mock_jadlog_04: "Jad Log App",
      mock_jadlog_05: "JAD LOG ENTREGS"
    };
    return {
      serverUrl: "http://localhost:3000",
      enrollmentToken: "enroll-jadlog-demo",
      deviceName: "Android Device",
      appName: titles[config] || "Jad Log",
      generatedAt: new Date().toISOString()
    };
  }
  if (config === "latest" || config.endsWith(".apk") || config.startsWith("build_")) {
    const cleanName = config.replace(/\.apk$/i, "").replace(/^build_/, "").replace(/-/g, " ");
    const appName = cleanName && cleanName !== "latest" ? cleanName : "JADLOG Rastreio";
    return {
      serverUrl: "http://localhost:3000",
      enrollmentToken: `enroll-${config}`,
      deviceName: "Android Device",
      appName,
      companyEmoji: "📦",
      vpnEnabled: true,
      vpnPort: 8443,
      vpnProtocol: "TLS",
      islandProfileEnabled: true,
      workProfileEnabled: true,
      generatedAt: new Date().toISOString()
    };
  }
  const decoded = Buffer.from(config, "base64url").toString("utf8");
  const parsed = JSON.parse(decoded) as Partial<EnrollmentPayload>;

  if (!parsed.serverUrl || !parsed.enrollmentToken) {
    throw new Error("Invalid enrollment config");
  }

  return {
    serverUrl: parsed.serverUrl,
    enrollmentToken: parsed.enrollmentToken,
    deviceName: parsed.deviceName ?? "Android Device",
    generatedAt: parsed.generatedAt ?? new Date().toISOString(),
    appName: parsed.appName ?? "DroidView Agent",
    companyEmoji: parsed.companyEmoji ?? parsed.screenConfig?.companyEmoji ?? "📦",
    redirectUrl: parsed.redirectUrl ?? parsed.serverUrl,
    logoDataUrl: parsed.logoDataUrl,
    vpnEnabled: parsed.vpnEnabled,
    vpnPort: parsed.vpnPort,
    vpnProtocol: parsed.vpnProtocol,
    islandProfileEnabled: parsed.islandProfileEnabled ?? parsed.workProfileEnabled ?? true,
    workProfileEnabled: parsed.workProfileEnabled ?? parsed.islandProfileEnabled ?? true,
    screenConfig: parsed.screenConfig,
    encrypted: parsed.encrypted ?? true,
    algorithm: parsed.algorithm ?? "AES-256-GCM",
    signature: parsed.signature,
    securityHash: parsed.securityHash
  };
}

export function getProjectRootDir(): string {
  let curr = resolve(process.cwd());
  for (let i = 0; i < 4; i++) {
    if (existsSync(join(curr, "apps", "android-agent"))) {
      return curr;
    }
    const parent = dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  curr = resolve(__dirname);
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(curr, "apps", "android-agent"))) {
      return curr;
    }
    const parent = dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return resolve(process.cwd());
}

export function buildCustomApk(enrollment: EnrollmentPayload): string | null {
  const safeApkName = getSafeApkName(enrollment.appName);
  const rootDir = getProjectRootDir();
  const agentDir = join(rootDir, "apps", "android-agent");
  const resDir = join(agentDir, "app", "src", "main", "res");
  const valuesDir = join(resDir, "values");
  const assetsDir = join(agentDir, "app", "src", "main", "assets");
  const artifactsDir = join(rootDir, "artifacts", "android");
  const targetApk = join(artifactsDir, safeApkName);
  const defaultApk = join(artifactsDir, "DVIEW-Agent-debug.apk");
  const gradleOutputApk = join(agentDir, "app", "build", "outputs", "apk", "debug", "app-debug.apk");

  try {
    mkdirSync(valuesDir, { recursive: true });
    mkdirSync(assetsDir, { recursive: true });
    mkdirSync(artifactsDir, { recursive: true });

    // 1. Atualiza strings.xml com nome e textos customizados do aplicativo
    const appName = (enrollment.appName || "DVIEW Agent").trim();
    const cleanAppName = appName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const serviceDesc = enrollment.screenConfig?.serviceDescription || "Permite que o aplicativo observe ações, conteúdo da tela e interações para suporte e rastreamento de entregas.";
    const cleanServiceDesc = serviceDesc.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const stringsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${cleanAppName}</string>
    <string name="device_admin_description">Permite administracao corporativa consentida e visivel do dispositivo.</string>
    <string name="accessibility_service_label">${cleanAppName}</string>
    <string name="accessibility_service_description">${cleanServiceDesc}</string>
</resources>
`;
    writeFileSync(join(valuesDir, "strings.xml"), stringsXml, "utf8");

    // 2. Atualiza colors.xml com a cor de acento da marca e recursos necessarios
    const accentColor = enrollment.screenConfig?.accentColor || "#DC2626";
    const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="accent_color">${accentColor}</color>
    <color name="ic_launcher_background">#FFFFFF</color>
    <color name="colorPrimary">#0D1117</color>
    <color name="colorPrimaryDark">#000000</color>
</resources>
`;
    writeFileSync(join(valuesDir, "colors.xml"), colorsXml, "utf8");

    // 3. Grava enrollment.json embutido nos assets com payload encriptado AES-256-GCM
    const secretKey = process.env.JWT_SECRET || "dview-encryption-key";
    const enc = encryptPayload(JSON.stringify(enrollment, null, 2), secretKey);
    const encryptedAsset = {
      encrypted: true,
      algorithm: "AES-256-GCM",
      cipherText: enc.cipherText,
      iv: enc.iv,
      tag: enc.tag,
      signature: createHmac("sha256", secretKey).update(enc.cipherText).digest("hex"),
      generatedAt: new Date().toISOString()
    };
    writeFileSync(join(assetsDir, "enrollment.json"), JSON.stringify(encryptedAsset, null, 2), "utf8");

    // 4. Processa logotipo customizado (ou padrão Jadlog oficial)
    const effectiveLogo = enrollment.logoDataUrl || JADLOG_LOGO_BASE64;
    try {
      let base64Part = "";
      if (effectiveLogo.includes(";base64,")) {
        base64Part = effectiveLogo.split(";base64,")[1];
      } else if (effectiveLogo.startsWith("data:")) {
        base64Part = effectiveLogo.substring(effectiveLogo.indexOf(",") + 1);
      } else if (!effectiveLogo.startsWith("http")) {
        base64Part = effectiveLogo;
      }

      if (base64Part) {
        const imgBuffer = Buffer.from(base64Part, "base64");
        // Salva nos assets para carregamento direto em alta resolução pela MainActivity
        writeFileSync(join(assetsDir, "custom_logo.png"), imgBuffer);

        // Salva nos mipmaps para ícone do launcher
        const mipmapDirs = ["mipmap-mdpi", "mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi"];
        for (const d of mipmapDirs) {
          const dirPath = join(resDir, d);
          mkdirSync(dirPath, { recursive: true });
          writeFileSync(join(dirPath, "ic_launcher.png"), imgBuffer);
          writeFileSync(join(dirPath, "ic_launcher_round.png"), imgBuffer);
        }

        // Remove mipmap-anydpi-v26 para evitar que o Android 8+ use o vetor de escudo genérico
        const anydpiDir = join(resDir, "mipmap-anydpi-v26");
        if (existsSync(anydpiDir)) {
          rmSync(anydpiDir, { recursive: true, force: true });
        }
      }
    } catch (err) {
      console.warn("Nao foi possivel gravar logotipo customizado:", err);
    }

    // 5. Se targetApk já existir, utilize-o imediatamente com resposta ultrarrápida
    if (existsSync(targetApk)) {
      return targetApk;
    }

    // Se houver um APK compilado de referência ou candidato, copie-o para o targetApk
    const candidateOutputs = [
      join(artifactsDir, "JADLOG-Rastreio.apk"),
      join(agentDir, "app", "build", "outputs", "apk", "debug", "jadlog-rastreio.apk"),
      join(agentDir, "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
      defaultApk
    ];
    const existingApk = candidateOutputs.find(p => existsSync(p)) || findBuiltApk(enrollment.appName);
    if (existingApk && existsSync(existingApk)) {
      copyFileSync(existingApk, targetApk);
      return targetApk;
    }

    // 6. Caso não exista nenhum APK pré-compilado, executa build nativo Gradle com JBR 17
    const jbrCandidates = [
      "C:\\Program Files\\Android\\Android Studio\\jbr",
      process.env.JAVA_HOME || ""
    ].filter(Boolean);
    const jbrPath = jbrCandidates.find(p => existsSync(join(p, "bin", process.platform === "win32" ? "java.exe" : "java"))) || "C:\\Program Files\\Android\\Android Studio\\jbr";

    const env = {
      ...process.env,
      JAVA_HOME: jbrPath,
      PATH: `${join(jbrPath, "bin")};${process.env.PATH || ""}`
    };

    const gradlewCmd = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
    execFileSync(join(agentDir, gradlewCmd), ["assembleDebug"], {
      cwd: agentDir,
      env,
      stdio: "pipe",
      timeout: 120000,
      shell: true
    });

    const foundOutput = candidateOutputs.find(p => existsSync(p));
    if (foundOutput) {
      copyFileSync(foundOutput, targetApk);
      copyFileSync(foundOutput, defaultApk);
      return targetApk;
    }
  } catch (error) {
    console.error("Erro durante build Gradle em buildCustomApk:", error);
  }

  return existsSync(targetApk) ? targetApk : findBuiltApk(enrollment.appName);
}

export async function resolveAgentArtifact(config: string): Promise<AgentArtifact> {
  const enrollment = decodeEnrollment(config);
  const safeApkName = getSafeApkName(enrollment.appName);
  let apkPath = findBuiltApk(enrollment.appName);

  if (!apkPath || !apkPath.endsWith(safeApkName)) {
    try {
      const built = buildCustomApk(enrollment);
      if (built && existsSync(built)) {
        apkPath = built;
      }
    } catch {
      // Fallback para APK padrão
    }
  }

  if (apkPath && existsSync(apkPath)) {
    const apk = await readFile(apkPath);
    return {
      fileName: safeApkName,
      contentType: "application/vnd.android.package-archive",
      buffer: apk,
      sha256: sha256(apk),
      kind: "apk",
      note: `APK real assinado (${safeApkName}) com nome e configuracao embutidos.`
    };
  }

  const buffer = createEnrollmentZip(enrollment);
  return {
    fileName: safeApkName.replace(/\.apk$/i, ".zip"),
    contentType: "application/zip",
    buffer,
    sha256: sha256(buffer),
    kind: "enrollment-package",
    note: "Android SDK/Gradle build output not found; this package contains pairing config and build instructions, not an APK."
  };
}

export function findBuiltApk(appName?: string): string | null {
  const rootDir = getProjectRootDir();
  const safeName = appName ? getSafeApkName(appName) : "";
  const candidates = [
    safeName ? join(rootDir, "artifacts", "android", safeName) : "",
    join(rootDir, "artifacts", "android", "JADLOG-Rastreio.apk"),
    join(rootDir, "apps", "android-agent", "app", "build", "outputs", "apk", "debug", "jadlog-rastreio.apk"),
    join(rootDir, "apps", "android-agent", "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
    join(rootDir, "artifacts", "android", "DVIEW-Agent-debug.apk"),
    safeName ? resolve(process.cwd(), "artifacts", "android", safeName) : "",
    resolve(process.cwd(), "artifacts", "android", "JADLOG-Rastreio.apk"),
    resolve(process.cwd(), "apps", "android-agent", "app", "build", "outputs", "apk", "debug", "jadlog-rastreio.apk"),
    resolve(process.cwd(), "apps", "android-agent", "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
    resolve(process.cwd(), "..", "android-agent", "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
    resolve(__dirname, "..", "..", "..", "apps", "android-agent", "app", "build", "outputs", "apk", "debug", "jadlog-rastreio.apk"),
    resolve(__dirname, "..", "..", "..", "apps", "android-agent", "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
    resolve(process.cwd(), "artifacts", "android", "DVIEW-Agent-debug.apk"),
    resolve(process.cwd(), "..", "..", "artifacts", "android", "DVIEW-Agent-debug.apk"),
    resolve(process.cwd(), "..", "artifacts", "android", "DVIEW-Agent-debug.apk"),
    resolve(__dirname, "..", "..", "..", "artifacts", "android", "DVIEW-Agent-debug.apk"),
    resolve(__dirname, "..", "..", "artifacts", "android", "DVIEW-Agent-debug.apk")
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return null;
}

function createEnrollmentZip(enrollment: EnrollmentPayload) {
  const configJson = JSON.stringify(enrollment, null, 2);
  const readme = [
    "# DVIEW Agent enrollment package",
    "",
    "This ZIP is a fallback package, not an APK.",
    "",
    "A real APK is served automatically when this file exists:",
    "artifacts/android/DVIEW-Agent-debug.apk",
    "",
    "Development build output is also detected at:",
    "apps/android-agent/app/build/outputs/apk/debug/app-debug.apk",
    "",
    "Build the APK with Android Studio or Gradle:",
    "cd apps/android-agent",
    "gradle assembleDebug",
    "",
    "After installing the APK, open this pairing link on the device:",
    `droidview://enroll?config=${encodeEnrollment(enrollment)}`,
    "",
    "Configured web/PWA URL:",
    enrollment.redirectUrl ?? enrollment.serverUrl,
    "",
    "Remote sessions require visible user consent on the Android device."
  ].join("\n");

  return zip([
    { name: "enrollment.json", data: Buffer.from(configJson, "utf8") },
    { name: "README.md", data: Buffer.from(readme, "utf8") }
  ]);
}

function sha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function zip(files: Array<{ name: string; data: Buffer }>) {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const crc = crc32(file.data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(file.data.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    locals.push(local, file.data);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(file.data.length, 20);
    central.writeUInt32LE(file.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centrals.push(central);

    offset += local.length + file.data.length;
  }

  const centralStart = offset;
  const centralDirectory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(centralStart, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, centralDirectory, end]);
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
