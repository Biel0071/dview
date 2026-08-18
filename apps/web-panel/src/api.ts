import type {
  ApkBuildRequest,
  ApkBuildResponse,
  AppPackage,
  AuditLog,
  DashboardStats,
  Device,
  LoginResponse,
  RemoteSession
} from "@droidview/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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
  sessions: () => request<RemoteSession[]>("/sessions"),
  logs: () => request<AuditLog[]>("/logs"),
  apps: () => request<AppPackage[]>("/apps"),
  startSession: (deviceId: string) => request<RemoteSession>(`/devices/${deviceId}/session`, { method: "POST" }),
  buildApk: (payload: ApkBuildRequest) =>
    request<ApkBuildResponse>("/apk/build", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};
