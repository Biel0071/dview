import type { DashboardStats, Device, RemoteSession, User } from "@droidview/shared";
import { create } from "zustand";

interface AppState {
  token: string | null;
  user: User | null;
  view: string;
  devices: Device[];
  sessions: RemoteSession[];
  stats: DashboardStats | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  setView: (view: string) => void;
  setDevices: (devices: Device[]) => void;
  setSessions: (sessions: RemoteSession[]) => void;
  setStats: (stats: DashboardStats) => void;
}

export const useAppStore = create<AppState>((set) => ({
  token: localStorage.getItem("droidview.token"),
  user: null,
  view: "Dashboard",
  devices: [],
  sessions: [],
  stats: null,
  setAuth: (token, user) => {
    localStorage.setItem("droidview.token", token);
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem("droidview.token");
    set({ token: null, user: null });
  },
  setView: (view) => set({ view }),
  setDevices: (devices) => set({ devices }),
  setSessions: (sessions) => set({ sessions }),
  setStats: (stats) => set({ stats })
}));
