import type { Device, DigitalTouchEvent, RemoteSession } from "@droidview/shared";
import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  (typeof window !== "undefined" && ((window as any).__DVIEW_SOCKET_URL__ || (window as any).__DVIEW_CONFIG__?.socketUrl)) ||
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:3000";

let globalSocket: Socket | null = null;
const touchListeners = new Set<(event: DigitalTouchEvent) => void>();

export function getGlobalSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io(SOCKET_URL, { autoConnect: true });
    globalSocket.on("touch:event", (event: DigitalTouchEvent) => {
      touchListeners.forEach((fn) => {
        try {
          fn(event);
        } catch {
          // ignore
        }
      });
    });
  }
  return globalSocket;
}

export function subscribeToTouchEvents(callback: (event: DigitalTouchEvent) => void): () => void {
  getGlobalSocket();
  touchListeners.add(callback);
  return () => {
    touchListeners.delete(callback);
  };
}

export function createSocket(handlers: {
  onDevice?: (device: Device) => void;
  onDeviceDisconnect?: (deviceId: string) => void;
  onDeviceUpdate?: (device: Device) => void;
  onSession?: (session: RemoteSession) => void;
  onTouchEvent?: (event: DigitalTouchEvent) => void;
}) {
  const socket = getGlobalSocket();
  if (handlers.onDevice) socket.on("device:connect", (device) => handlers.onDevice?.(device));
  if (handlers.onDeviceDisconnect) socket.on("device:disconnect", (deviceId) => handlers.onDeviceDisconnect?.(deviceId));
  if (handlers.onDeviceUpdate) socket.on("device:update", (device) => handlers.onDeviceUpdate?.(device));
  if (handlers.onSession) socket.on("session:update", (session) => handlers.onSession?.(session));
  if (handlers.onTouchEvent) {
    touchListeners.add(handlers.onTouchEvent);
  }
  return socket;
}
