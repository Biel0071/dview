export type DeviceStatus = "online" | "offline" | "pending";
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

export type AppStatus = "running" | "stopped" | "connected" | "disconnected" | "detecting" | "error";

export interface DetectedApp {
  id: string;
  name: string;
  packageName: string;
  version?: string;
  process?: string;
  pid?: number;
  status: AppStatus;
  icon?: string;
  source: "process" | "device" | "emulator" | "package" | "manual";
  lastSeen?: string;
  metadata?: Record<string, unknown>;
}

export interface AppActionRequest {
  appId: string;
  action: "open" | "close" | "restart" | "activate" | "deactivate" | "refresh" | "connect" | "disconnect";
}

export interface AppActionResult {
  success: boolean;
  message: string;
  action: string;
  appId: string;
  timestamp: string;
}

export interface InjectionSession {
  id: string;
  targetAppId?: string;
  targetPackageName?: string;
  status: "idle" | "initializing" | "active" | "suspended" | "closed" | "error";
  engine?: string;
  startedAt?: string;
  lastEvent?: string;
  logs: InjectionLog[];
}

export interface InjectionLog {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  source?: string;
}

export interface ServerToClientEvents {
  "device:connect": (device: Device) => void;
  "device:disconnect": (deviceId: string) => void;
  "session:update": (session: RemoteSession) => void;
  "chat:message": (message: ChatMessage) => void;
  "audit:new": (log: AuditLog) => void;
  "apps:detected": (apps: DetectedApp[]) => void;
  "app:status": (app: DetectedApp) => void;
  "injection:log": (log: InjectionLog) => void;
  "injection:session": (session: InjectionSession) => void;
}

export interface ClientToServerEvents {
  "device:hello": (device: Device) => void;
  "session:start": (payload: { deviceId: string }) => void;
  "session:stop": (payload: { sessionId: string }) => void;
  "chat:message": (message: ChatMessage) => void;
  "app:action": (payload: AppActionRequest) => void;
  "injection:start": (payload: { appId?: string; packageName?: string }) => void;
  "injection:stop": (payload: { sessionId: string }) => void;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  from: string;
  body: string;
  timestamp: string;
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

export interface ApkBuildRequest {
  serverUrl: string;
  enrollmentToken: string;
  deviceName?: string;
  appName?: string;
  redirectUrl?: string;
  logoDataUrl?: string;
}

export interface ApkBuildResponse {
  apkName: string;
  downloadUrl: string;
  qrPayload: string;
  sha256: string;
  artifactType?: "apk" | "enrollment-package";
  note?: string;
}
