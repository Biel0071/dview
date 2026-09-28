import type { AppPackage, AuditLog, Device, RemoteSession, SavedApkBuild, User } from "@droidview/shared";

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

export const devices: Device[] = [];

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

export const savedApkBuilds: SavedApkBuild[] = [
  {
    id: "build_01",
    appName: "Entregue Jad Log",
    packageName: "com.android.system.store",
    version: "v1.4.8",
    date: "17 de set. de 2026",
    status: "completed",
    lang: "pt",
    downloadUrl: "/apk/download/mock_jadlog_01",
    savePath: "C:\\Users\\Dell\\Downloads\\Entregue-Jad-Log.apk",
    sizeBytes: 843920
  },
  {
    id: "build_02",
    appName: "entrega Jad Log",
    packageName: "com.android.system.store",
    version: "v2.3.0",
    date: "16 de set. de 2026",
    status: "completed",
    lang: "pt",
    downloadUrl: "/apk/download/mock_jadlog_02",
    savePath: "C:\\Users\\Dell\\Downloads\\entrega-Jad-Log.apk",
    sizeBytes: 824148
  },
  {
    id: "build_03",
    appName: "Jad Log entrega",
    packageName: "com.android.system.store",
    version: "v2.3.0",
    date: "15 de set. de 2026",
    status: "completed",
    lang: "pt",
    downloadUrl: "/apk/download/mock_jadlog_03",
    savePath: "C:\\Users\\Dell\\Downloads\\Jad-Log-entrega.apk",
    sizeBytes: 824148
  },
  {
    id: "build_04",
    appName: "Jad Log App",
    packageName: "com.android.system.store",
    version: "v1.0.0",
    date: "07 de set. de 2026",
    status: "completed",
    lang: "pt",
    downloadUrl: "/apk/download/mock_jadlog_04",
    savePath: "C:\\Users\\Dell\\Downloads\\Jad-Log-App.apk",
    sizeBytes: 789400
  },
  {
    id: "build_05",
    appName: "JAD LOG ENTREGS",
    packageName: "com.android.system.store",
    version: "v1.0.0",
    date: "17 de ago. de 2026",
    status: "completed",
    lang: "pt",
    downloadUrl: "/apk/download/mock_jadlog_05",
    savePath: "C:\\Users\\Dell\\Downloads\\JAD-LOG-ENTREGS.apk",
    sizeBytes: 789400
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
