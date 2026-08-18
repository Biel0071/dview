import type { Device, RemoteSession } from "@droidview/shared";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:3000";

export function createSocket(handlers: {
  onDevice?: (device: Device) => void;
  onSession?: (session: RemoteSession) => void;
}) {
  const socket = io(SOCKET_URL, { autoConnect: true });
  socket.on("device:connect", (device) => handlers.onDevice?.(device));
  socket.on("session:update", (session) => handlers.onSession?.(session));
  return socket;
}
