@echo off
title DVIEW - Sistema de Monitoramento e Controle
color 0C
cls

echo ========================================================
echo                  DVIEW SYSTEM LAUNCHER
echo ========================================================
echo       SISTEMA DE CONTROLE E MONITORAMENTO REMOTO
echo ========================================================
echo.

cd /d "c:\Users\Dell\Downloads\dview-main"

:: 1. Verificar se o sistema ja esta respondendo na porta 5000
curl.exe -s --connect-timeout 1 http://localhost:5000/ >nul 2>&1
if not errorlevel 1 (
    echo [+] O sistema DVIEW ja esta ativo e funcionando!
    echo [*] Abrindo painel no navegador: http://localhost:5000/
    echo.
    start http://localhost:5000/
    goto READY
)

:: 2. Liberar portas se houver processos antigos travados
echo [*] Verificando integridade das portas 3000 e 5000...
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":3000.*LISTENING :5000.*LISTENING"') do (
    taskkill /F /PID %%p >nul 2>&1
)

:: 3. Iniciar servidores DVIEW
echo [*] Ativando servidores DVIEW (Backend :3000 + Web Panel :5000)...
start "DVIEW - SERVIDOR CENTRAL" cmd /k "cd /d c:\Users\Dell\Downloads\dview-main && npm run dev"

:: 4. Aguardar ate o servidor web e backend ficarem online
echo [*] Aguardando inicializacao completa do sistema...
set ATTEMPTS=0

:WAIT_SERVER
ping -n 3 127.0.0.1 >nul
curl.exe -s --connect-timeout 1 http://localhost:5000/ >nul 2>&1
if not errorlevel 1 (
    goto OPEN_BROWSER
)

set /a ATTEMPTS+=1
echo [*] Conectando aos servicos... (%ATTEMPTS%/15)
if %ATTEMPTS% lss 15 goto WAIT_SERVER

:OPEN_BROWSER
echo.
echo ========================================================
echo        [+] SERVIDORES INICIADOS COM SUCESSO!
echo ========================================================
echo.
echo [*] Abrindo URL do sistema no navegador: http://localhost:5000/
start http://localhost:5000/

:READY
echo.
echo ========================================================
echo             SISTEMA DVIEW PRONTO PARA USO
echo ========================================================
echo  - Painel Web:     http://localhost:5000/
echo  - Servidor API:   http://localhost:3000/
echo.
echo  [i] Mantenha a janela do servidor aberta durante o uso.
echo ========================================================
echo.
ping -n 5 127.0.0.1 >nul
exit
