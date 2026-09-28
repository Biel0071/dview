import type { Device, RemoteSession } from "@droidview/shared";
import { io } from "socket.io-client";

const SOCKET_URL =
  (typeof window !== "undefined" && ((window as any).__DVIEW_SOCKET_URL__ || (window as any).__DVIEW_CONFIG__?.socketUrl)) ||
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:3000";

export function createSocket(handlers: {
  onDevice?: (device: Device) => void;
  onDeviceDisconnect?: (deviceId: string) => void;
  onDeviceUpdate?: (device: Device) => void;
  onSession?: (session: RemoteSession) => void;
}) {
  const socket = io(SOCKET_URL, { autoConnect: true });
  socket.on("device:connect", (device) => handlers.onDevice?.(device));
  socket.on("device:disconnect", (deviceId) => handlers.onDeviceDisconnect?.(deviceId));
  socket.on("device:update", (device) => handlers.onDeviceUpdate?.(device));
  socket.on("session:update", (session) => handlers.onSession?.(session));
  return socket;
}
