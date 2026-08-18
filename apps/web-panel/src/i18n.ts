export type Language = "pt" | "en" | "es";

export const languageNames: Record<Language, string> = {
  pt: "Portugues",
  en: "English",
  es: "Espanol"
};

const dictionary: Record<Language, Record<string, string>> = {
  pt: {
    Dashboard: "Dashboard",
    Clients: "Dispositivos",
    "Remote Session": "Sessao remota",
    "Apps Manager": "Apps Manager",
    "Connection Logs": "Logs",
    "Gerador APK": "Gerador APK",
    Settings: "Configuracoes",
    refresh: "Atualizar",
    localOperation: "Operacao local",
    logout: "Sair",
    adminArea: "Area admin",
    operatorArea: "Area operador"
  },
  en: {
    Dashboard: "Dashboard",
    Clients: "Devices",
    "Remote Session": "Remote Session",
    "Apps Manager": "Apps Manager",
    "Connection Logs": "Logs",
    "Gerador APK": "APK Builder",
    Settings: "Settings",
    refresh: "Refresh",
    localOperation: "Local operation",
    logout: "Sign out",
    adminArea: "Admin area",
    operatorArea: "Operator area"
  },
  es: {
    Dashboard: "Panel",
    Clients: "Dispositivos",
    "Remote Session": "Sesion remota",
    "Apps Manager": "Apps Manager",
    "Connection Logs": "Registros",
    "Gerador APK": "Generador APK",
    Settings: "Configuracion",
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
