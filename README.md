# DroidView - Sistema de Suporte Remoto e Gestão de Dispositivos

Sistema completo de suporte remoto e gestão de dispositivos móveis corporativos (MDM).

## Arquitetura

- **Backend**: Node.js + TypeScript, Socket.IO, Fastify, PostgreSQL, JWT + 2FA
- **Agente Android**: Kotlin, serviço foreground, MediaProjection, políticas MDM
- **Painel Web**: React + TypeScript, tema escuro com acento verde

## Funcionalidades

- Autenticação com login e 2FA
- Dashboard com KPIs em tempo real
- Gerenciamento de dispositivos com consentimento por sessão
- Visualização remota via MediaProjection
- Chat e transferência de arquivos
- Instalação/remoção de apps corporativos
- Bloqueio e wipe de dispositivos
- Builder de APK com URL configurável
- Logs de conexão e auditoria

## Estrutura

```
├── apps/
│   ├── backend/          # Node.js + TypeScript
│   ├── android-agent/    # Kotlin (agente Android)
│   └── web-panel/        # React + TypeScript
├── packages/
│   └── shared/           # Tipos compartilhados
├── docker/               # Docker Compose e configs
├── docs/                 # Documentação
└── scripts/              # Scripts de build e deploy
```

## Quick Start

### Backend

```bash
cd apps/backend
npm install
npm run dev
```

### Painel Web

```bash
cd apps/web-panel
npm install
npm run dev
```

### Agente Android

```bash
cd apps/android-agent
./gradlew assembleRelease
```

## Deploy com Docker

```bash
docker-compose up -d
```

Acesse: https://localhost:8443

## Gerar APK

No painel web: Menu → Gerador APK → Configurar URL → Gerar APK

## License

MIT
