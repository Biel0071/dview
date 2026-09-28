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

### Backend e painel juntos (Modo Localhost / Navegador Web)

Você pode subir o sistema completo via terminal para acesso local no navegador:

```bash
npm start
# ou
npm run start:localhost
# ou
npm run dev
```

- Backend Fastify + Socket.IO: `http://localhost:3000`
- Painel Web React: `http://localhost:5000`

### Opção Desktop Completo (.exe para Windows)

O DVIEW inclui um aplicativo desktop nativo para Windows (Electron) que empacota o sistema completo de controle:
- Inicia automaticamente o backend Fastify + Socket.IO embutido na porta 3000 (ou conecta ao backend existente se já estiver rodando).
- Renderiza o painel de controle nativamente em janela desktop de alta resolução.
- Não depende de terminal aberto ou comandos manuais após instalado.
- Permite que dispositivos físicos Android ou emuladores se conectem normalmente via rede local (`http://<IP>:3000`).

#### Gerar o executável instalador de produção (.exe)
```bash
npm run build:exe
# ou
npm run exe
```
Saída gerada: `apps/desktop/release-mvp/DVIEW-Admin-Setup-0.1.0.exe` (Instalador NSIS com atalhos na Área de Trabalho e Menu Iniciar).

#### Gerar versão portátil / descompactada (.exe direto)
```bash
npm run electron:pack
```
Saída gerada: `apps/desktop/release-mvp/win-unpacked/DVIEW Admin.exe`

#### Executar o aplicativo desktop diretamente (Modo Dev/Preview)
```bash
npm run start:desktop
# ou
npm run electron:dev
```

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
