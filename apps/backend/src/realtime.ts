import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import type { ChatMessage, ClientToServerEvents, ServerToClientEvents } from "@droidview/shared";
import { addLog, devices, sessions } from "./data.js";

export function attachRealtime(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    socket.on("device:hello", (device) => {
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
