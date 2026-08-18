import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import Fastify from "fastify";
import type { ApkBuildRequest, LoginRequest } from "@droidview/shared";
import { addLog, adminUser, apps, devices, logs, sessions } from "./data.js";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: true });
  app.register(jwt, {
    secret: process.env.JWT_SECRET ?? "dev-secret"
  });

  app.decorate("authenticate", async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });

  app.get("/health", async () => ({
    ok: true,
    service: "droidview-backend",
    time: new Date().toISOString()
  }));

  app.post<{ Body: LoginRequest }>("/auth/login", async (request, reply) => {
    const { email, password, totp } = request.body;
    const expectedPassword = process.env.ADMIN_PASSWORD ?? "admin123";
    const expectedTotp = process.env.ADMIN_TOTP ?? "123456";

    if (email !== adminUser.email || password !== expectedPassword || totp !== expectedTotp) {
      addLog({
        actor: email,
        action: "auth.failed",
        target: "admin",
        severity: "warning",
        message: "Invalid login attempt"
      });
      return reply.code(401).send({ error: "Invalid credentials or 2FA code" });
    }

    const token = app.jwt.sign({ sub: adminUser.id, email: adminUser.email, role: adminUser.role });
    addLog({
      actor: adminUser.email,
      action: "auth.login",
      target: "admin",
      severity: "info",
      message: "Admin logged in"
    });
    return { token, user: adminUser };
  });

  app.get("/dashboard", { preHandler: (app as any).authenticate }, async () => ({
    totalDevices: devices.length,
    onlineDevices: devices.filter((device) => device.status === "online").length,
    activeSessions: sessions.filter((session) => session.status === "active").length,
    pendingAlerts: logs.filter((log) => log.severity !== "info").length
  }));

  app.get("/devices", { preHandler: (app as any).authenticate }, async () => devices);

  app.post<{ Params: { id: string } }>(
    "/devices/:id/session",
    { preHandler: (app as any).authenticate },
    async (request, reply) => {
      const device = devices.find((item) => item.id === request.params.id);
      if (!device) return reply.code(404).send({ error: "Device not found" });

      const session = {
        id: `ses_${Date.now()}`,
        deviceId: device.id,
        operatorId: adminUser.id,
        status: "requested" as const,
        consentCode: String(Math.floor(100000 + Math.random() * 900000))
      };
      sessions.unshift(session);
      addLog({
        actor: adminUser.email,
        action: "session.request",
        target: device.id,
        severity: "info",
        message: `Consent code ${session.consentCode} generated for ${device.name}`
      });
      return session;
    }
  );

  app.get("/sessions", { preHandler: (app as any).authenticate }, async () => sessions);
  app.get("/logs", { preHandler: (app as any).authenticate }, async () => logs);
  app.get("/apps", { preHandler: (app as any).authenticate }, async () => apps);

  app.post<{ Body: ApkBuildRequest }>("/apk/build", { preHandler: (app as any).authenticate }, async (request) => {
    const payload = {
      serverUrl: request.body.serverUrl,
      enrollmentToken: request.body.enrollmentToken,
      deviceName: request.body.deviceName ?? "Android Device"
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sha256 = Buffer.from(encoded).toString("hex").slice(0, 64).padEnd(64, "0");

    addLog({
      actor: adminUser.email,
      action: "apk.build",
      target: "agent",
      severity: "info",
      message: "Agent enrollment package generated"
    });

    return {
      apkName: "DroidView-Agent-MVP.apk",
      downloadUrl: `/apk/download/${encoded}`,
      qrPayload: `droidview://enroll?config=${encoded}`,
      sha256
    };
  });

  app.get<{ Params: { config: string } }>("/apk/download/:config", async (request, reply) => {
    const text = [
      "DroidView Agent MVP placeholder",
      "This is not a production APK.",
      `Enrollment config: ${request.params.config}`,
      "Build the Android project in apps/android-agent to generate a real APK."
    ].join("\n");
    return reply
      .header("content-type", "application/vnd.android.package-archive")
      .header("content-disposition", "attachment; filename=DroidView-Agent-MVP.apk")
      .send(Buffer.from(text));
  });

  return app;
}
