import type { DashboardStats, Device, RemoteSession, User } from "@droidview/shared";
import { create } from "zustand";
import type { Language } from "../i18n";

export interface WebPreferences {
  language: Language;
  requireConsent: boolean;
  showDeviceIndicator: boolean;
  autoEndIdleSessions: boolean;
  sessionQuality: "balanced" | "performance" | "quality";
  maskSensitiveFields: boolean;
  notifyOfflineDevices: boolean;
}

const defaultPreferences: WebPreferences = {
  language: "pt",
  requireConsent: true,
  showDeviceIndicator: true,
  autoEndIdleSessions: true,
  sessionQuality: "balanced",
  maskSensitiveFields: true,
  notifyOfflineDevices: true
};

function loadPreferences(): WebPreferences {
  const raw = localStorage.getItem("droidview.preferences");
  if (!raw) return defaultPreferences;
  try {
    return { ...defaultPreferences, ...JSON.parse(raw) } as WebPreferences;
  } catch {
    return defaultPreferences;
  }
}

function loadUser(): User | null {
  const raw = localStorage.getItem("dview.user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

interface AppState {
  token: string | null;
  user: User | null;
  view: string;
  devices: Device[];
  sessions: RemoteSession[];
  stats: DashboardStats | null;
  preferences: WebPreferences;
  selectedDeviceId: string | null;
  setSelectedDeviceId: (id: string | null) => void;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  setView: (view: string) => void;
  setDevices: (devices: Device[]) => void;
  upsertDevice: (device: Device) => void;
  markDeviceOffline: (deviceId: string) => void;
  removeDevice: (deviceId: string) => void;
  setSessions: (sessions: RemoteSession[]) => void;
  setStats: (stats: DashboardStats) => void;
  updatePreferences: (preferences: Partial<WebPreferences>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  token: localStorage.getItem("droidview.token"),
  user: loadUser(),
  view: "Dashboard",
  devices: [],
  sessions: [],
  stats: null,
  preferences: loadPreferences(),
  selectedDeviceId: null,
  setSelectedDeviceId: (id) => set({ selectedDeviceId: id }),
  setAuth: (token, user) => {
    localStorage.setItem("droidview.token", token);
    localStorage.setItem("dview.user", JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem("droidview.token");
    localStorage.removeItem("dview.user");
    set({ token: null, user: null });
  },
  setView: (view) => set({ view }),
  setDevices: (devices) => set({ devices }),
  upsertDevice: (device) =>
    set((state) => {
      const idx = state.devices.findIndex((d) => d.id === device.id);
      if (idx >= 0) {
        const next = [...state.devices];
        next[idx] = { ...next[idx], ...device };
        return { devices: next };
      }
      return { devices: [device, ...state.devices] };
    }),
  markDeviceOffline: (deviceId) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              status: "offline",
              networkType: "offline",
              networkName: "Sem Conexão",
              networkSpeed: "0 Mbps",
              pingMs: 0,
              signalStrength: 0,
              lastSeen: new Date().toISOString()
            }
          : d
      )
    })),
  removeDevice: (deviceId) =>
    set((state) => ({
      devices: state.devices.filter((d) => d.id !== deviceId)
    })),
  setSessions: (sessions) => set({ sessions }),
  setStats: (stats) => set({ stats }),
  updatePreferences: (next) =>
    set((state) => {
      const preferences = { ...state.preferences, ...next };
      localStorage.setItem("droidview.preferences", JSON.stringify(preferences));
      return { preferences };
    })
}));

if (typeof window !== "undefined") {
  (window as any).useAppStore = useAppStore;
}
