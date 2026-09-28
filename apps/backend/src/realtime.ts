import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import type { ChatMessage, ClientToServerEvents, Device, ServerToClientEvents } from "@droidview/shared";
import { addLog, devices, sessions } from "./data.js";

let globalIo: Server<ClientToServerEvents, ServerToClientEvents> | null = null;

export function broadcastDeviceConnect(device: Device) {
  if (globalIo) {
    globalIo.emit("device:connect", device);
  }
}

export function broadcastDeviceDisconnect(deviceId: string) {
  if (globalIo) {
    globalIo.emit("device:disconnect", deviceId);
  }
}

export function broadcastDeviceUpdate(device: Device) {
  if (globalIo) {
    globalIo.emit("device:update", device);
  }
}

export function attachRealtime(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: "*" }
  });
  globalIo = io;

  io.on("connection", (socket) => {
    socket.on("device:hello", (device) => {
      (socket.data as any).deviceId = device.id;
      (socket.data as any).deviceName = device.name;
      const existing = devices.find((item) => item.id === device.id);
      if (existing) {
        Object.assign(existing, device, { status: "online", lastSeen: new Date().toISOString() });
      } else {
        devices.unshift({ ...device, status: "online", lastSeen: new Date().toISOString() });
      }
      const log = addLog({
        actor: "agent",
        action: "device.connect",
        target: device.id,
        severity: "info",
        message: `${device.name} connected`
      });
      io.emit("device:connect", device);
      io.emit("audit:new", log);
    });

    socket.on("disconnect", () => {
      const devId = (socket.data as any)?.deviceId;
      if (devId) {
        const existing = devices.find((item) => item.id === devId);
        if (existing) {
          existing.status = "offline";
          existing.lastSeen = new Date().toISOString();
          const log = addLog({
            actor: "agent",
            action: "device.disconnect",
            target: existing.id,
            severity: "info",
            message: `${existing.name} disconnected`
          });
          io.emit("device:disconnect", existing.id);
          io.emit("device:update", existing);
          io.emit("audit:new", log);
        }
      }
    });

    socket.on("session:start", ({ deviceId }) => {
      const session = sessions.find((item) => item.deviceId === deviceId && item.status === "requested");
      if (!session) return;
      session.status = "active";
      session.startedAt = new Date().toISOString();
      io.emit("session:update", session);
    });

    socket.on("session:stop", ({ sessionId }) => {
      const session = sessions.find((item) => item.id === sessionId);
      if (!session) return;
      session.status = "ended";
      session.endedAt = new Date().toISOString();
      io.emit("session:update", session);
    });

    socket.on("chat:message", (message: ChatMessage) => {
      io.emit("chat:message", message);
    });
  });

  return io;
}
