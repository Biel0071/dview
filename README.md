# DroidView - Sistema de Suporte Remoto e Gestao de Dispositivos

Sistema MVP de suporte remoto consentido e gestao administrativa de dispositivos Android corporativos.

## Arquitetura

- **Backend**: Node.js + TypeScript, Fastify, Socket.IO, JWT e dados em memoria no MVP
- **Painel Web**: React + TypeScript + Vite, tema escuro com acento verde
- **Desktop Admin**: Electron + electron-builder para gerar instalador `.exe`
- **Agente Android**: Kotlin, foreground service, deeplink de pareamento e estrutura MediaProjection/MDM
- **Shared**: contratos TypeScript compartilhados

## Funcionalidades

- Autenticacao com login e codigo 2FA simples
- Dashboard com KPIs em tempo real
- Gerenciamento de dispositivos com consentimento por sessao
- Sessao remota simulada pronta para integrar MediaProjection real
- Apps Manager
- Gerador de pacote de pareamento Android com QR Code
- Logs de conexao e auditoria
- Build web, backend, desktop `.exe` e Android skeleton

## Estrutura

```
├── apps/
│   ├── backend/          # Node.js + TypeScript
│   ├── android-agent/    # Kotlin (agente Android)
│   └── web-panel/        # React + TypeScript
├── apps/desktop/         # Electron installer
├── packages/shared/      # Tipos compartilhados
├── docker/               # Configs Docker
├── docs/                 # Documentação
└── scripts/              # Scripts de build e deploy
```

## Quick Start

## Credenciais locais

```text
E-mail: admin@droidview.local
Senha: admin123
2FA: 123456
```

Altere esses valores em `.env` antes de qualquer ambiente real.

## Quick Start

### Instalar dependencias

```bash
npm install
```

### Backend

```bash
npm run dev:backend
```

### Painel Web

```bash
npm run dev:web
```

Abra: http://localhost:5173

### Backend e painel juntos

```bash
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

Acesse: http://localhost:8080

## Gerar instalador Windows

```bash
npm run exe
```

Saida esperada: `apps/desktop/release-build/DroidView-Admin-Setup-0.1.0.exe`

## Gerar APK do agente

No painel web: `Gerador APK` -> configurar URL -> gerar QR/pacote MVP.

Para gerar APK Android real do skeleton:

```bash
cd apps/android-agent
./gradlew assembleDebug
```

Se o wrapper Gradle ainda nao existir, abra `apps/android-agent` no Android Studio ou instale Gradle localmente e rode `gradle assembleDebug`.

## Nota de seguranca

O MVP foi criado para aparelhos corporativos autorizados e exige consentimento visivel por sessao. Funcionalidades destrutivas ou ocultas nao estao implementadas.

## License

MIT
