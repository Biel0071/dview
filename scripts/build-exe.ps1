$ErrorActionPreference = "Stop"
Write-Host "Compilando e empacotando DVIEW Admin Desktop (.exe)..." -ForegroundColor Cyan
npm run build:exe
Write-Host "Executavel gerado com sucesso em apps/desktop/release-mvp/" -ForegroundColor Green
