# DVIEW - Sistema de Suporte Remoto e Gestao de Dispositivos

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
Admin: admin@dview.local
Senha: admin123
2FA: 123456

Operador: user@dview.local
Senha: user123
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

### Desktop Admin independente

O instalador Windows abre o painel e inicia uma API local embutida em `http://localhost:3000`, suficiente para usar o MVP sem terminal.

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

Saida esperada: `apps/desktop/release-mvp/DVIEW-Admin-Setup-0.1.0.exe`

## Gerar APK do agente

No painel web: `Gerador APK` -> configurar URL -> gerar QR -> baixar `DVIEW-Agent-debug.apk`.

O APK debug real fica versionado em:

```text
artifacts/android/DVIEW-Agent-debug.apk
```

Compatibilidade atual do APK: Android 7.0+ (`minSdk 24`) até Android moderno com `targetSdk 35`.

Para gerar APK Android real do skeleton:

```bash
cd apps/android-agent
./gradlew assembleDebug
```

Depois da build, copie o APK novo para `artifacts/android/DVIEW-Agent-debug.apk` antes de gerar o instalador desktop.

O Gerador APK aceita URL do site/PWA, nome exibido no fluxo e logo em payload. O app abre a URL dentro de uma WebView depois do aceite.

## Nota de seguranca

O MVP foi criado para aparelhos corporativos autorizados e exige consentimento visivel por sessao. Funcionalidades destrutivas ou ocultas nao estao implementadas.

## License

MIT
