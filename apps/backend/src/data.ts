import type { AppPackage, AuditLog, Device, RemoteSession, SavedApkBuild, User } from "@droidview/shared";

export const adminUser: User = {
  id: "usr_admin",
  email: process.env.ADMIN_EMAIL ?? "admin@dview.local",
  name: "DVIEW Admin",
  role: "admin"
};

export const operatorUser: User = {
  id: "usr_operator",
  email: process.env.OPERATOR_EMAIL ?? "user@dview.local",
  name: "DVIEW Operador",
  role: "operator"
};

export const devices: Device[] = [];

export const sessions: RemoteSession[] = [];

export const logs: AuditLog[] = [
  {
    id: "log_001",
    timestamp: new Date().toISOString(),
    actor: "system",
    action: "system.boot",
    target: "backend",
    severity: "info",
    message: "DVIEW backend initialized"
  }
];

export const apps: AppPackage[] = [
  {
    id: "app_agent",
    name: "DVIEW Agent",
    version: "0.1.0",
    packageName: "com.droidview.agent",
    uploadedAt: new Date().toISOString(),
    status: "available"
  }
];

export const savedApkBuilds: SavedApkBuild[] = [
  {
    id: "build_01",
    platform: "android",
    appName: "JADLOG Rastreio",
    packageName: "com.droidview.agent",
    version: "v2.3.0",
    backupVersion: "v1.4.8",
    date: "17 de set. de 2026",
    status: "completed",
    lang: "pt",
    downloadUrl: "/apk/download/mock_jadlog_01",
    webInstallUrl: "http://localhost:3000/install/mock_jadlog_01",
    qrPayload: "http://localhost:3000/install/mock_jadlog_01",
    zeroTouchQrPayload: JSON.stringify({
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.droidview.agent/com.droidview.agent.mdm.DroidViewDeviceAdminReceiver",
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "http://localhost:3000/apk/download/mock_jadlog_01",
      "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": "90w3kAyU0RkAW59SJdp0fypUTUVmpnchmYx0r4WJDqk",
      "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
        serverUrl: "http://localhost:3000",
        enrollmentToken: "enroll-jadlog-demo",
        appName: "JADLOG Rastreio",
        companyEmoji: "📦",
        vpnEnabled: true,
        vpnProtocol: "TLS",
        vpnPort: 8443,
        islandProfileEnabled: true,
        autoStart: true,
        zeroTouch: true,
        encrypted: true,
        algorithm: "AES-256-GCM"
      },
      "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
      "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true
    }),
    savePath: "C:\\Users\\Dell\\Downloads\\JADLOG-Rastreio.apk",
    sizeBytes: 843920,
    sha256: "f74c37900c948d19005b9f5225da747f2a544d4566a6c721798c74af85890ea9",
    companyEmoji: "📦",
    vpnEnabled: true,
    vpnPort: 8443,
    vpnProtocol: "TLS",
    islandProfileEnabled: true
  }
];

export function addLog(log: Omit<AuditLog, "id" | "timestamp">): AuditLog {
  const entry: AuditLog = {
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...log
  };
  logs.unshift(entry);
  return entry;
}

import { extractDeviceUserIdentity } from "./deviceBridge.js";

export interface DeviceCustomMetadata {
  name?: string;
  contactName?: string;
  phoneNumber?: string;
  apkName?: string;
  notes?: string;
  userAccount?: string;
  operator?: string;
  deviceOwner?: string;
  autoIdentified?: boolean;
  identifiedAt?: string;
}

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const METADATA_DIR = join(process.cwd(), "apps/backend/data");
const METADATA_FILE = join(METADATA_DIR, "devices-metadata.json");

let deviceMetadataStore: Record<string, DeviceCustomMetadata> = {
  dev_sm_n975f: {
    name: "Entregue Jad Log (SM-N975F)",
    contactName: "Carlos Ferreira",
    phoneNumber: "+55 (11) 98765-4321",
    apkName: "JADLOG Rastreio",
    userAccount: "carlos.ferreira.log@gmail.com",
    operator: "Vivo 4G LTE",
    deviceOwner: "Carlos Ferreira",
    notes: "Identificação automática via perfil de frota corporativa (Google: carlos.ferreira.log@gmail.com · WhatsApp: +55 (11) 98765-4321 · Operadora: Vivo). Sincronizado na conexão.",
    autoIdentified: true,
    identifiedAt: new Date().toISOString()
  }
};

function initMetadataStore() {
  try {
    if (!existsSync(METADATA_DIR)) {
      mkdirSync(METADATA_DIR, { recursive: true });
    }
    if (existsSync(METADATA_FILE)) {
      const content = readFileSync(METADATA_FILE, "utf-8");
      const parsed = JSON.parse(content);
      deviceMetadataStore = { ...deviceMetadataStore, ...parsed };
    } else {
      writeFileSync(METADATA_FILE, JSON.stringify(deviceMetadataStore, null, 2), "utf-8");
    }
  } catch {
    // fallback in-memory
  }
}

initMetadataStore();

export function getDeviceCustomMetadata(deviceId: string): DeviceCustomMetadata {
  return deviceMetadataStore[deviceId] || {};
}

export function saveDeviceCustomMetadata(deviceId: string, meta: Partial<DeviceCustomMetadata>): DeviceCustomMetadata {
  const existing = deviceMetadataStore[deviceId] || {};
  const updated = { ...existing, ...meta };
  deviceMetadataStore[deviceId] = updated;

  try {
    if (!existsSync(METADATA_DIR)) {
      mkdirSync(METADATA_DIR, { recursive: true });
    }
    writeFileSync(METADATA_FILE, JSON.stringify(deviceMetadataStore, null, 2), "utf-8");
  } catch {
    // ignore
  }

  return updated;
}

export function applyCustomMetadataToDevice(device: Device): Device {
  const meta = getDeviceCustomMetadata(device.id);
  if (meta.name) device.name = meta.name;
  if (meta.contactName !== undefined) device.contactName = meta.contactName;
  if (meta.phoneNumber !== undefined) device.phoneNumber = meta.phoneNumber;
  if (meta.apkName !== undefined) device.apkName = meta.apkName;
  if (meta.notes !== undefined) device.notes = meta.notes;
  if (meta.userAccount !== undefined) device.userAccount = meta.userAccount;
  if (meta.operator !== undefined) device.operator = meta.operator;
  if (meta.deviceOwner !== undefined) device.deviceOwner = meta.deviceOwner;
  if (meta.autoIdentified !== undefined) device.autoIdentified = meta.autoIdentified;
  if (meta.identifiedAt !== undefined) device.identifiedAt = meta.identifiedAt;
  return device;
}

export async function autoIdentifyDevice(device: Device, serial?: string, force = false): Promise<Device> {
  const existingMeta = getDeviceCustomMetadata(device.id);

  if (!force && existingMeta.contactName && existingMeta.phoneNumber) {
    return applyCustomMetadataToDevice(device);
  }

  try {
    const identity = await extractDeviceUserIdentity(device.id, device.model, serial);
    const updatedMeta = saveDeviceCustomMetadata(device.id, {
      contactName: force ? identity.contactName : (existingMeta.contactName || identity.contactName),
      phoneNumber: force ? identity.phoneNumber : (existingMeta.phoneNumber || identity.phoneNumber),
      apkName: force ? identity.apkName : (existingMeta.apkName || identity.apkName || device.apkName || "JADLOG Rastreio"),
      userAccount: force ? identity.userAccount : (existingMeta.userAccount || identity.userAccount),
      operator: force ? identity.operator : (existingMeta.operator || identity.operator),
      deviceOwner: force ? identity.deviceOwner : (existingMeta.deviceOwner || identity.deviceOwner),
      notes: force ? identity.notes : (existingMeta.notes || identity.notes),
      autoIdentified: true,
      identifiedAt: force ? new Date().toISOString() : (existingMeta.identifiedAt || identity.identifiedAt)
    });

    addLog({
      actor: "system",
      action: "device.auto_identify",
      target: device.id,
      severity: "info",
      message: `Identificação automática de usuário vinculada ao aparelho: ${updatedMeta.contactName} (${updatedMeta.phoneNumber}) · Conta: ${updatedMeta.userAccount || "-"} · APK: ${updatedMeta.apkName || "-"}`
    });
  } catch (_e) {
    // non-fatal
  }

  return applyCustomMetadataToDevice(device);
}
