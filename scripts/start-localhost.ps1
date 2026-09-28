$ErrorActionPreference = "Stop"
Write-Host "Iniciando DVIEW no modo Localhost (Backend Fastify na porta 3000 + Web-Panel na porta 5000)..." -ForegroundColor Cyan
npm run start:localhost
