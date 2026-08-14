# DroidView Backend

Backend Node.js + TypeScript com Fastify, Socket.IO e PostgreSQL.

## Estrutura

```
apps/backend/
├── src/
│   ├── auth/           # Autenticação JWT + 2FA
│   ├── devices/        # Gestão de dispositivos
│   ├── sessions/       # Sessões remotas (Socket.IO)
│   ├── apps/           # Apps Manager
│   ├── logs/           # Connection Logs e Auditoria
│   └── main.ts         # Entry point
├── tests/
├── package.json
└── tsconfig.json
```

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

## Variáveis de Ambiente

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/droidview
JWT_SECRET=seu-segreto-aqui
PORT=3000
NODE_ENV=development
```

## Endpoints Principais

- `POST /auth/login` - Login com 2FA
- `GET /devices` - Lista dispositivos
- `POST /devices/:id/session` - Iniciar sessão remota
- `GET /logs` - Connection logs
- `POST /apps/upload` - Upload de APK

## Eventos Socket

- `device:connect` - Dispositivo conectou
- `device:disconnect` - Dispositivo desconectou
- `session:start` - Iniciar sessão remota
- `session:stop` - Encerrar sessão
- `chat:message` - Mensagem de chat
- `file:transfer` - Transferência de arquivo

## Testes

```bash
npm test
```
