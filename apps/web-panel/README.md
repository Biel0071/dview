# DroidView Web Panel

Painel web em React + TypeScript com tema escuro e acento verde.

## Estrutura

```
apps/web-panel/
├── src/
│   ├── components/     # Componentes UI reutilizáveis
│   ├── pages/          # Telas do sistema
│   ├── hooks/          # Hooks customizados
│   ├── store/          # Estado global (Zustand)
│   ├── socket/         # Cliente Socket.IO
│   ├── types/          # Tipos TypeScript
│   └── App.tsx
├── public/
├── package.json
└── vite.config.ts
```

## Telas

1. **Login** - E-mail/senha + 2FA
2. **Dashboard** - KPIs, gráficos, sessões ativas
3. **Clients** - Tabela de dispositivos com ações
4. **Remote Session** - Espelhamento + chat + controles
5. **Apps Manager** - Catálogo e apps customizados
6. **Connection Logs** - Logs filtráveis
7. **Settings** - Perfil e preferências de exibição
8. **About** - Informações do sistema
9. **Gerador APK** - Builder de APK encriptado

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

Acesso: http://localhost:5173

## Build

```bash
npm run build
```

Output em: `dist/`

## Temas

- **Background**: `#0d1117`
- **Primary**: `#2ea043` (verde)
- **Text**: `#c9d1d9`
- **Border**: `#30363d`

## Componentes UI

- `Button` - Botões com variantes
- `Input` - Campos de formulário
- `Table` - Tabelas ordenáveis
- `Toggle` - Switches
- `Modal` - Diálogos
- `Tabs` - Navegação por abas
- `Badge` - Indicadores de status

## Socket Client

```typescript
import { useSocket } from './socket'

const { connected, devices, sendMessage } = useSocket()
```

## Testes

```bash
npm test
npm run test:e2e
```

## Deploy

O build pode ser servido por qualquer servidor estático ou via Docker.
