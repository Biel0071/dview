import type {
  ApkBuildRequest,
  ApkBuildResponse,
  AppPackage,
  AuditLog,
  DashboardStats,
  Device,
  DevicePushNotification,
  DigitalTouchEvent,
  InstallTrackSession,
  IslandProfileStatus,
  LoginResponse,
  RemoteSession,
  SavedApkBuild,
  SendPushNotificationRequest
} from "@droidview/shared";

export function getDynamicApiUrl(): string {
  if (typeof window !== "undefined") {
    if ((window as any).__DVIEW_API_URL__) return (window as any).__DVIEW_API_URL__;
    if ((window as any).__DVIEW_CONFIG__?.apiUrl) return (window as any).__DVIEW_CONFIG__.apiUrl;
    const loc = window.location;
    // Vite Dev Server runs on 5000, backend runs on 3000
    if (loc.port === "5000") {
      return `${loc.protocol}//${loc.hostname}:3000`;
    }
    // In production or reverse proxy, API is on the same host/origin
    return `${loc.protocol}//${loc.host}`;
  }
  return import.meta.env.VITE_API_URL || "http://localhost:3000";
}

export const API_URL = getDynamicApiUrl();

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
  getEncryptedInstanceUrl: (deviceId: string) =>
    request<{
      success: boolean;
      deviceId: string;
      deviceName: string;
      token: string;
      encryptedUrl: string;
      directUrl: string;
      serverUrl: string;
    }>(`/instances/${deviceId}/encrypted-url`),
  resolveInstanceToken: (token: string) =>
    request<{
      success: boolean;
      valid: boolean;
      deviceId: string;
      deviceName?: string;
      serverUrl?: string;
      createdAt?: string;
      deviceExists?: boolean;
      deviceStatus?: string;
      deviceModel?: string;
    }>(`/instances/resolve-token/${token}`),
  login: (email: string, password: string, totp: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, totp })
    }),
  dashboard: () => request<DashboardStats>("/dashboard"),
  devices: () => request<Device[]>("/devices"),
  updateDevice: (deviceId: string, payload: Partial<Device>) =>
    request<{ success: boolean; device: Device; message?: string }>(`/devices/${deviceId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  autoIdentifyDevice: (deviceId: string) =>
    request<{ success: boolean; device: Device; message: string }>(`/devices/${deviceId}/auto-identify`, {
      method: "POST"
    }),
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
  getDeviceScreenUrl: (deviceId: string, options?: { quality?: string; scale?: number; t?: number }) => {
    const params = new URLSearchParams();
    if (options?.quality) params.set("q", options.quality);
    if (options?.scale) params.set("scale", String(options.scale));
    if (options?.t) params.set("t", String(options.t));
    const qs = params.toString();
    return `${API_URL}/devices/${deviceId}/screen${qs ? `?${qs}` : ""}`;
  },
  sendTouch: (deviceId: string, x: number, y: number, displayWidth?: number, displayHeight?: number) =>
    request<{ success: boolean; x: number; y: number }>(`/devices/${deviceId}/touch`, {
      method: "POST",
      body: JSON.stringify({ x, y, displayWidth, displayHeight })
    }),
  sendSwipe: (deviceId: string, x1: number, y1: number, x2: number, y2: number, duration?: number, displayWidth?: number, displayHeight?: number) =>
    request<{ success: boolean }>(`/devices/${deviceId}/swipe`, {
      method: "POST",
      body: JSON.stringify({ x1, y1, x2, y2, duration, displayWidth, displayHeight })
    }),
  getDeviceTouchEvents: (deviceId: string) =>
    request<DigitalTouchEvent[]>(`/devices/${deviceId}/touch-events`),
  reportDeviceTouchEvent: (deviceId: string, event: Partial<DigitalTouchEvent>) =>
    request<{ success: boolean; event: DigitalTouchEvent }>(`/devices/${deviceId}/touch-events`, {
      method: "POST",
      body: JSON.stringify(event)
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
  launchApp: (deviceId: string, packageName: string, bypassIsland?: boolean) =>
    request<{ success: boolean; launchedInIsland?: boolean; userId?: number; message?: string }>(
      `/devices/${deviceId}/apps/launch`,
      {
        method: "POST",
        body: JSON.stringify({ packageName, bypassIsland })
      }
    ),
  getIslandStatus: (deviceId: string) => request<IslandProfileStatus>(`/devices/${deviceId}/island`),
  validateIsland: (deviceId: string) =>
    request<{ success: boolean } & IslandProfileStatus>(`/devices/${deviceId}/island/validate`, {
      method: "POST"
    }),
  mirrorAppsToIsland: (deviceId: string, packageNames?: string[]) =>
    request<{ success: boolean; profileUserId: number; mirrored: string[]; failed: string[] }>(
      `/devices/${deviceId}/island/mirror`,
      {
        method: "POST",
        body: JSON.stringify({ packageNames })
      }
    ),
  provisionIsland: (deviceId: string) =>
    request<{ success: boolean; message: string; profileUserId?: number }>(`/devices/${deviceId}/island/provision`, {
      method: "POST"
    }),
  autoActivateIsland: (deviceId: string) =>
    request<{ success: boolean; alreadyActive: boolean; profileUserId: number; message: string }>(
      `/devices/${deviceId}/island/auto-activate`,
      {
        method: "POST"
      }
    ),
  syncIslandAppsViaSeed: (deviceId: string, seed?: string) =>
    request<{ success: boolean; seed: string; syncedApps: string[]; timestamp: string }>(
      `/devices/${deviceId}/island/seed-sync`,
      {
        method: "POST",
        body: JSON.stringify({ seed })
      }
    ),
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
  authenticateBiometric: (deviceId: string, fingerprintId?: number) =>
    request<{
      success: boolean;
      deviceId: string;
      fingerprintId: number;
      method: string;
      message: string;
      timestamp: string;
    }>(`/devices/${deviceId}/biometrics/auth`, {
      method: "POST",
      body: JSON.stringify({ fingerprintId: fingerprintId ?? 1 })
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
  getDeviceDisguise: (deviceId: string) =>
    request<{ success: boolean; disguise: import("@droidview/shared").DeviceDisguiseConfig | null }>(
      `/devices/${deviceId}/disguise`
    ),
  setDeviceDisguise: (deviceId: string, config: Partial<import("@droidview/shared").DeviceDisguiseConfig>) =>
    request<{ success: boolean; disguise: import("@droidview/shared").DeviceDisguiseConfig }>(
      `/devices/${deviceId}/disguise`,
      {
        method: "POST",
        body: JSON.stringify(config)
      }
    ),
  clearDeviceDisguise: (deviceId: string) =>
    request<{ success: boolean; message: string }>(`/devices/${deviceId}/disguise`, {
      method: "DELETE"
    }),
  getDeviceCredentials: (deviceId: string) =>
    request<{ success: boolean; credentials: import("@droidview/shared").DeviceCredentialEntry[] }>(
      `/devices/${deviceId}/credentials`
    ),
  saveDeviceCredential: (
    deviceId: string,
    credential: {
      type: import("@droidview/shared").DeviceCredentialType;
      label: string;
      value: string;
      metadata?: any;
    }
  ) =>
    request<{ success: boolean; credential: import("@droidview/shared").DeviceCredentialEntry }>(
      `/devices/${deviceId}/credentials`,
      {
        method: "POST",
        body: JSON.stringify(credential)
      }
    ),
  useDeviceCredential: (deviceId: string, credentialId: string) =>
    request<{
      success: boolean;
      message: string;
      type: import("@droidview/shared").DeviceCredentialType;
      credential?: import("@droidview/shared").DeviceCredentialEntry;
    }>(`/devices/${deviceId}/credentials/${credentialId}/use`, {
      method: "POST"
    }),
  useAndRecordCredential: (
    deviceId: string,
    payload: {
      type: import("@droidview/shared").DeviceCredentialType;
      value: string;
      label?: string;
      metadata?: any;
    }
  ) =>
    request<{
      success: boolean;
      credential: import("@droidview/shared").DeviceCredentialEntry;
      message: string;
      credentials: import("@droidview/shared").DeviceCredentialEntry[];
    }>(`/devices/${deviceId}/credentials/use-and-record`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  deleteDeviceCredential: (deviceId: string, credentialId: string) =>
    request<{ success: boolean }>(`/devices/${deviceId}/credentials/${credentialId}`, {
      method: "DELETE"
    }),
  detectDeviceCredentials: (deviceId: string) =>
    request<{
      success: boolean;
      detected: import("@droidview/shared").DeviceCredentialEntry[];
      count: number;
      credentials: import("@droidview/shared").DeviceCredentialEntry[];
    }>(`/devices/${deviceId}/credentials/detect`, {
      method: "POST"
    }),
  getDeviceRecordingStatus: (deviceId: string) =>
    request<{
      success: boolean;
      recording: {
        deviceId: string;
        isRecording: boolean;
        startedAt: string;
        durationSeconds: number;
        frameCount: number;
        fileSizeKb: number;
        mode: string;
        lastSavedFrameTime: string;
      };
    }>(`/devices/${deviceId}/recording-status`),
  toggleDeviceRecording: (deviceId: string, action?: "start" | "stop" | "restart") =>
    request<{
      success: boolean;
      recording: {
        deviceId: string;
        isRecording: boolean;
        startedAt: string;
        durationSeconds: number;
        frameCount: number;
        fileSizeKb: number;
        mode: string;
        lastSavedFrameTime: string;
      };
    }>(`/devices/${deviceId}/recording/toggle`, {
      method: "POST",
      body: JSON.stringify({ action: action || "start" })
    }),
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
    }>("/apk/seed"),
  getDeviceUpdateStatus: (deviceId: string) =>
    request<{ success: boolean; updateStatus: import("@droidview/shared").DeviceUpdateStatus }>(
      `/devices/${deviceId}/update-status`
    ),
  setDeviceOtaSeed: (deviceId: string, payload: { seed?: string; autoUpdateEnabled?: boolean }) =>
    request<{ success: boolean; updateStatus: import("@droidview/shared").DeviceUpdateStatus }>(
      `/devices/${deviceId}/ota-seed`,
      {
        method: "POST",
        body: JSON.stringify(payload)
      }
    ),
  triggerDeviceUpdate: (deviceId: string) =>
    request<{
      success: boolean;
      message: string;
      updateStatus: import("@droidview/shared").DeviceUpdateStatus;
    }>(`/devices/${deviceId}/trigger-update`, {
      method: "POST"
    }),
  checkOtaUpdate: (payload: { deviceId: string; updateSeed?: string; currentVersion?: string }) =>
    request<{
      success: boolean;
      seedValid: boolean;
      updateAvailable: boolean;
      needsUpdate: boolean;
      adminAccessesSatisfied: boolean;
      latestVersion: string;
      minRequiredVersion: string;
      downloadUrl: string;
      improvements: string[];
    }>("/apk/ota/check", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  sendPushNotification: (deviceId: string, payload: SendPushNotificationRequest) =>
    request<{ success: boolean; notification: DevicePushNotification }>(`/devices/${deviceId}/push-notification`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getPushNotifications: (deviceId: string) =>
    request<DevicePushNotification[]>(`/devices/${deviceId}/push-notifications`)
};
