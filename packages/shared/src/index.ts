export type DeviceStatus = "online" | "offline" | "pending";
export type NetworkType = "wifi" | "4g" | "5g" | "3g" | "ethernet" | "offline";
export type SessionStatus = "requested" | "active" | "ended" | "denied";
export type AuditSeverity = "info" | "warning" | "critical";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "operator";
}

export interface Device {
  id: string;
  name: string;
  model: string;
  androidVersion: string;
  status: DeviceStatus;
  battery: number;
  lastSeen: string;
  enrolledAt: string;
  consentRequired: boolean;
  networkType?: NetworkType;
  networkName?: string;
  signalStrength?: number;
  networkSpeed?: string;
  pingMs?: number;
  ipAddress?: string;
}

export interface RemoteSession {
  id: string;
  deviceId: string;
  operatorId: string;
  status: SessionStatus;
  startedAt?: string;
  endedAt?: string;
  consentCode: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  severity: AuditSeverity;
  message: string;
}

export interface AppPackage {
  id: string;
  name: string;
  version: string;
  packageName: string;
  uploadedAt: string;
  status: "available" | "installing" | "installed" | "failed";
}

export interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  activeSessions: number;
  pendingAlerts: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  totp: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ScreenCustomizationConfig {
  loadingSubtext?: string;
  speechCalloutText?: string;
  copyrightText?: string;
  permissionDialogTitle?: string;
  accentColor?: string;
  trackingTitle?: string;
  trackingSubtext?: string;
  serviceDescription?: string;
  companyPreset?: string;
  enterpriseName?: string;
}

export type PlatformType = "android" | "ios";

export interface IosProfileConfig {
  organizationName?: string;
  payloadDisplayName?: string;
  payloadDescription?: string;
  bundleId?: string;
  webClipUrl?: string;
  isRemovable?: boolean;
  fullScreen?: boolean;
  vpnEnabled?: boolean;
  vpnType?: "IKEv2" | "IPSec" | "SSL";
  vpnServerAddress?: string;
  iconDataUrl?: string;
}

export interface ApkBuildRequest {
  platform?: PlatformType;
  serverUrl: string;
  enrollmentToken: string;
  deviceName?: string;
  appName?: string;
  bundleId?: string;
  redirectUrl?: string;
  logoDataUrl?: string;
  vpnEnabled?: boolean;
  vpnPort?: number;
  vpnProtocol?: "TCP" | "UDP" | "TLS";
  islandProfileEnabled?: boolean;
  workProfileEnabled?: boolean;
  screenConfig?: ScreenCustomizationConfig;
  iosConfig?: IosProfileConfig;
}

export interface ApkBuildResponse {
  apkName: string;
  downloadUrl: string;
  qrPayload: string;
  sha256: string;
  artifactType?: "apk" | "enrollment-package" | "ios-profile" | "ios-package";
  note?: string;
  platform?: PlatformType;
  iosProfileUrl?: string;
}

export interface SavedApkBuild {
  id: string;
  platform?: PlatformType;
  appName: string;
  packageName: string;
  bundleId?: string;
  version: string;
  date: string;
  status: "completed" | "progress" | "failed";
  lang?: string;
  downloadUrl: string;
  iosProfileUrl?: string;
  savePath?: string;
  logoDataUrl?: string;
  sizeBytes?: number;
  qrPayload?: string;
  sha256?: string;
  redirectUrl?: string;
  serverUrl?: string;
  vpnEnabled?: boolean;
  vpnPort?: number;
  vpnProtocol?: "TCP" | "UDP" | "TLS";
  islandProfileEnabled?: boolean;
  workProfileEnabled?: boolean;
  screenConfig?: ScreenCustomizationConfig;
  iosConfig?: IosProfileConfig;
}

export interface ServerToClientEvents {
  "device:connect": (device: Device) => void;
  "device:disconnect": (deviceId: string) => void;
  "device:update": (device: Device) => void;
  "session:update": (session: RemoteSession) => void;
  "chat:message": (message: ChatMessage) => void;
  "audit:new": (log: AuditLog) => void;
}

export interface ClientToServerEvents {
  "device:hello": (device: Device) => void;
  "session:start": (payload: { deviceId: string }) => void;
  "session:stop": (payload: { sessionId: string }) => void;
  "chat:message": (message: ChatMessage) => void;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  from: string;
  body: string;
  timestamp: string;
}
