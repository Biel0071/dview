import type {
  ApkBuildRequest,
  ApkBuildResponse,
  AppPackage,
  AuditLog,
  DashboardStats,
  Device,
  InstallTrackSession,
  LoginResponse,
  RemoteSession,
  SavedApkBuild
} from "@droidview/shared";

const API_URL =
  (typeof window !== "undefined" && ((window as any).__DVIEW_API_URL__ || (window as any).__DVIEW_CONFIG__?.apiUrl)) ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

async function request<T>(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("droidview.token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error ?? "Falha na requisicao");
  }

  return response.json() as Promise<T>;
}

export const api = {
  baseUrl: API_URL,
  login: (email: string, password: string, totp: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, totp })
    }),
  dashboard: () => request<DashboardStats>("/dashboard"),
  devices: () => request<Device[]>("/devices"),
  deleteDevice: (deviceId: string) =>
    request<{ success: boolean; id: string }>(`/devices/${deviceId}`, {
      method: "DELETE"
    }),
  sessions: () => request<RemoteSession[]>("/sessions"),
  logs: () => request<AuditLog[]>("/logs"),
  apps: () => request<AppPackage[]>("/apps"),
  startSession: (deviceId: string) => request<RemoteSession>(`/devices/${deviceId}/session`, { method: "POST" }),
  buildApk: (payload: ApkBuildRequest) =>
    request<ApkBuildResponse>("/apk/build", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  apkBuilds: () => request<SavedApkBuild[]>("/apk/builds"),
  updateApkBuild: (id: string, payload: Partial<SavedApkBuild>) =>
    request<SavedApkBuild>(`/apk/builds/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteApkBuild: (id: string) =>
    request<{ success: boolean; id: string }>(`/apk/builds/${id}`, {
      method: "DELETE"
    }),
  addEmulator: (payload?: { name?: string; model?: string; port?: number }) =>
    request<{ success: boolean; device: Device }>("/devices/emulator/add", {
      method: "POST",
      body: JSON.stringify(payload ?? {})
    }),
  getDeviceScreenUrl: (deviceId: string) => `${API_URL}/devices/${deviceId}/screen`,
  sendTouch: (deviceId: string, x: number, y: number, displayWidth?: number, displayHeight?: number) =>
    request<{ success: boolean; x: number; y: number }>(`/devices/${deviceId}/touch`, {
      method: "POST",
      body: JSON.stringify({ x, y, displayWidth, displayHeight })
    }),
  sendSwipe: (deviceId: string, x1: number, y1: number, x2: number, y2: number, duration?: number) =>
    request<{ success: boolean }>(`/devices/${deviceId}/swipe`, {
      method: "POST",
      body: JSON.stringify({ x1, y1, x2, y2, duration })
    }),
  sendKey: (deviceId: string, key: string | number) =>
    request<{ success: boolean; key: string | number }>(`/devices/${deviceId}/key`, {
      method: "POST",
      body: JSON.stringify({ key })
    }),
  sendText: (deviceId: string, text: string) =>
    request<{ success: boolean }>(`/devices/${deviceId}/text`, {
      method: "POST",
      body: JSON.stringify({ text })
    }),
  getDeviceTelemetry: (deviceId: string) => request<any>(`/devices/${deviceId}/telemetry`),
  getDeviceForegroundApp: (deviceId: string) =>
    request<{ packageName: string; activity: string; name: string; emoji: string; bg: string }>(
      `/devices/${deviceId}/foreground-app`
    ),
  getDeviceApps: (deviceId: string) => request<any[]>(`/devices/${deviceId}/apps`),
  syncDeviceApps: (deviceId: string) =>
    request<{ success: boolean; count: number; apps: any[]; syncedAt: string }>(`/devices/${deviceId}/apps/sync`, {
      method: "POST"
    }),
  launchApp: (deviceId: string, packageName: string) =>
    request<{ success: boolean }>(`/devices/${deviceId}/apps/launch`, {
      method: "POST",
      body: JSON.stringify({ packageName })
    }),
  stopApp: (deviceId: string, packageName: string) =>
    request<{ success: boolean }>(`/devices/${deviceId}/apps/stop`, {
      method: "POST",
      body: JSON.stringify({ packageName })
    }),
  getDeviceA11yTree: (deviceId: string) => request<any[]>(`/devices/${deviceId}/a11y-tree`),
  getDeviceFiles: (deviceId: string, path?: string) =>
    request<any[]>(`/devices/${deviceId}/files${path ? `?path=${encodeURIComponent(path)}` : ""}`),
  getDeviceVolume: (deviceId: string) =>
    request<{ volume: number; max: number; percent: number; muted: boolean }>(`/devices/${deviceId}/volume`),
  setDeviceVolume: (deviceId: string, payload: { level?: number; action?: "up" | "down" | "mute" }) =>
    request<{ volume: number; max: number; percent: number; muted: boolean }>(`/devices/${deviceId}/volume`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  sendPower: (deviceId: string) =>
    request<{ locked: boolean }>(`/devices/${deviceId}/power`, {
      method: "POST"
    }),
  getDeviceProductivity: (deviceId: string) =>
    request<{
      currentApp: { packageName: string; appName: string; category: string; since: string };
      totalWorkTimeSeconds: number;
      totalWorkTimeFormatted: string;
      productivePercent: number;
      appCount: number;
      apps: Array<{
        packageName: string;
        appName: string;
        category: string;
        totalTime: string;
        totalSeconds: number;
        lastTime: string;
        percent: number;
        isActive: boolean;
        iconBg: string;
        iconColor: string;
        iconLetter: string;
      }>;
      lastSync: string;
    }>(`/devices/${deviceId}/productivity`),
  getDeviceKeyboardLogs: (deviceId: string) =>
    request<
      Array<{
        id: string;
        timestamp: string;
        appName: string;
        packageName: string;
        category: "todas" | "whatsapp" | "banco" | "google" | "trabalho" | "sistema";
        content: string;
        timeInApp: string;
        type: "text" | "key" | "action";
      }>
    >(`/devices/${deviceId}/keyboard-logs`),
  sendKeyboardLog: (deviceId: string, payload: any) =>
    request<any>(`/devices/${deviceId}/keyboard-logs`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getInstallSessions: () => request<InstallTrackSession[]>("/install/sessions"),
  getInstallTrack: (token: string) => request<InstallTrackSession>(`/install/track/${token}`),
  sendInstallTrack: (payload: any) =>
    request<{ success: boolean; session: InstallTrackSession }>("/install/track", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  reconnectDevice: (deviceId: string) =>
    request<{ success: boolean; deviceId: string; message: string; timestamp: number }>(
      `/devices/${deviceId}/reconnect`,
      { method: "POST" }
    ),
  getUpdateSeed: () =>
    request<{
      success: boolean;
      version: string;
      versionCode: number;
      minSupportedVersion: string;
      appName: string;
      improvements: string[];
      hasArtifact: boolean;
      downloadUrl: string;
      updatedAt: string;
    }>("/apk/seed")
};
