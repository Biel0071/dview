import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import Fastify from "fastify";
import type { ApkBuildRequest, LoginRequest } from "@droidview/shared";
import { decodeEnrollment, encodeEnrollment, findBuiltApk, resolveAgentArtifact } from "./apkArtifacts.js";
import { addLog, adminUser, apps, devices, logs, operatorUser, sessions } from "./data.js";

export function buildApp() {
  const app = Fastify({ logger: true, maxParamLength: 4096 });

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
    const expectedAdminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
    const expectedOperatorPassword = process.env.OPERATOR_PASSWORD ?? "user123";
    const expectedTotp = process.env.ADMIN_TOTP ?? "123456";
    const user = email === adminUser.email ? adminUser : email === operatorUser.email ? operatorUser : null;
    const passwordOk =
      (user?.role === "admin" && password === expectedAdminPassword) ||
      (user?.role === "operator" && password === expectedOperatorPassword);

    if (!user || !passwordOk || totp !== expectedTotp) {
      addLog({
        actor: email,
        action: "auth.failed",
        target: "admin",
        severity: "warning",
        message: "Invalid login attempt"
      });
      return reply.code(401).send({ error: "Invalid credentials or 2FA code" });
    }

    const token = app.jwt.sign({ sub: user.id, email: user.email, role: user.role });
    addLog({
      actor: user.email,
      action: "auth.login",
      target: "admin",
      severity: "info",
      message: "Admin logged in"
    });
    return { token, user };
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
      deviceName: request.body.deviceName ?? "Android Device",
      appName: request.body.appName ?? "DVIEW Agent",
      redirectUrl: request.body.redirectUrl ?? request.body.serverUrl,
      logoDataUrl: request.body.logoDataUrl,
      generatedAt: new Date().toISOString()
    };
    const encoded = encodeEnrollment(payload);
    const hasBuiltApk = Boolean(findBuiltApk());

    addLog({
      actor: adminUser.email,
      action: "apk.build",
      target: "agent",
      severity: "info",
      message: hasBuiltApk ? "Real Android agent APK prepared" : "Fallback enrollment package prepared"
    });

    return {
      apkName: hasBuiltApk ? "DVIEW-Agent-debug.apk" : "DVIEW-Agent-enrollment-package.zip",
      downloadUrl: `/apk/download/${encoded}`,
      qrPayload: `droidview://enroll?config=${encoded}`,
      sha256: "calculated-on-download",
      artifactType: hasBuiltApk ? "apk" : "enrollment-package",
      note: hasBuiltApk
        ? "APK real encontrado no build Android local."
        : "SDK/build Android nao encontrado; download sera um ZIP honesto com config e instrucoes."
    };
  });

  app.get<{ Params: { config: string } }>("/apk/download/:config", async (request, reply) => {
    const artifact = await resolveAgentArtifact(request.params.config);
    return reply
      .header("content-type", artifact.contentType)
      .header("content-disposition", `attachment; filename=${artifact.fileName}`)
      .header("x-droidview-artifact-kind", artifact.kind)
      .header("x-droidview-sha256", artifact.sha256)
      .send(artifact.buffer);
  });

  app.get<{ Params: { config: string } }>("/apk/status/:config", async (request, reply) => {
    try {
      const enrollment = decodeEnrollment(request.params.config);
      const hasBuiltApk = Boolean(findBuiltApk());
      return {
        ready: true,
        artifactType: hasBuiltApk ? "apk" : "enrollment-package",
        fileName: hasBuiltApk ? "DVIEW-Agent-debug.apk" : "DVIEW-Agent-enrollment-package.zip",
        enrollment,
        message: hasBuiltApk
          ? "APK real disponivel para download."
          : "APK ainda nao compilado nesta maquina; pacote ZIP de pareamento disponivel."
      };
    } catch {
      return reply.code(400).send({ ready: false, error: "Invalid enrollment config" });
    }
  });

  return app;
}
