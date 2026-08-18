import type { AppPackage, AuditLog, Device, RemoteSession, User } from "@droidview/shared";

export const adminUser: User = {
  id: "usr_admin",
  email: process.env.ADMIN_EMAIL ?? "admin@dview.local",
  name: "DVIEW Admin",
  role: "admin"
};

export const operatorUser: User = {
  id: "usr_operator",
  email: process.env.OPERATOR_EMAIL ?? "user@dview.local",
  name: "DVIEW Operador",
  role: "operator"
};

export const devices: Device[] = [
  {
    id: "dev_demo_01",
    name: "Demo Android 14",
    model: "Pixel 8",
    androidVersion: "14",
    status: "online",
    battery: 87,
    lastSeen: new Date().toISOString(),
    enrolledAt: new Date(Date.now() - 86400000).toISOString(),
    consentRequired: true
  },
  {
    id: "dev_demo_02",
    name: "Equipe Campo",
    model: "Samsung A54",
    androidVersion: "13",
    status: "offline",
    battery: 41,
    lastSeen: new Date(Date.now() - 3600000).toISOString(),
    enrolledAt: new Date(Date.now() - 604800000).toISOString(),
    consentRequired: true
  }
];

export const sessions: RemoteSession[] = [];

export const logs: AuditLog[] = [
  {
    id: "log_001",
    timestamp: new Date().toISOString(),
    actor: "system",
    action: "system.boot",
    target: "backend",
    severity: "info",
    message: "DVIEW backend initialized"
  }
];

export const apps: AppPackage[] = [
  {
    id: "app_agent",
    name: "DVIEW Agent",
    version: "0.1.0",
    packageName: "com.droidview.agent",
    uploadedAt: new Date().toISOString(),
    status: "available"
  }
];

export function addLog(log: Omit<AuditLog, "id" | "timestamp">): AuditLog {
  const entry: AuditLog = {
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...log
  };
  logs.unshift(entry);
  return entry;
}
