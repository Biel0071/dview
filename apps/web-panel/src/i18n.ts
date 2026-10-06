export type Language = "pt" | "en" | "es";

export const languageNames: Record<Language, string> = {
  pt: "Portugues",
  en: "English",
  es: "Espanol"
};

const dictionary: Record<Language, Record<string, string>> = {
  pt: {
    Dashboard: "Dashboard",
    Clients: "Dispositivos / Sessão",
    "Remote Session": "Sessão Remota",
    "Apps Manager": "Apps Manager",
    "Connection Logs": "Logs",
    "Gerador APK": "Gerador APK",
    Controle: "Controle",
    Settings: "Configurações",
    About: "Sobre / Diagnóstico",
    refresh: "Atualizar",
    localOperation: "Operação local",
    logout: "Sair",
    adminArea: "Área admin",
    operatorArea: "Área operador"
  },
  en: {
    Dashboard: "Dashboard",
    Clients: "Devices / Sessions",
    "Remote Session": "Remote Session",
    "Apps Manager": "Apps Manager",
    "Connection Logs": "Logs",
    "Gerador APK": "APK Builder",
    Controle: "Device Control",
    Settings: "Settings",
    About: "System & Architecture",
    refresh: "Refresh",
    localOperation: "Local operation",
    logout: "Sign out",
    adminArea: "Admin area",
    operatorArea: "Operator area"
  },
  es: {
    Dashboard: "Panel",
    Clients: "Dispositivos / Sesión",
    "Remote Session": "Sesión remota",
    "Apps Manager": "Apps Manager",
    "Connection Logs": "Registros",
    "Gerador APK": "Generador APK",
    Controle: "Control",
    Settings: "Configuración",
    About: "Arquitectura y Diagnóstico",
    refresh: "Actualizar",
    localOperation: "Operacion local",
    logout: "Salir",
    adminArea: "Area admin",
    operatorArea: "Area operador"
  }
};

export function translate(language: Language, key: string) {
  return dictionary[language][key] ?? key;
}
