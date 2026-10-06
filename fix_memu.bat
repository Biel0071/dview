@echo off
chcp 65001 >nul
title DVIEW - Correção de Inicialização do MEmu Play

echo ========================================================
echo   DVIEW - Corretor de Virtualização para MEmu Play
echo ========================================================
echo.

:: Verificar se está executando como Administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Solicitando permissão de Administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo [+] Privilégios de Administrador confirmados!
echo.
echo [1/3] Finalizando processos travados do MEmu...
taskkill /F /IM MEmu.exe >nul 2>&1
taskkill /F /IM MEmuConsole.exe >nul 2>&1
taskkill /F /IM MEmuHyper.exe >nul 2>&1
taskkill /F /IM MEmuSVC.exe >nul 2>&1
taskkill /F /IM memuc.exe >nul 2>&1

echo [2/3] Ajustando o hipervisor do Windows para liberar o VT-x para o MEmu...
bcdedit /set hypervisorlaunchtype off
if %errorlevel% equ 0 (
    echo [OK] Hipervisor configurado com sucesso (hypervisorlaunchtype off).
) else (
    echo [!] Falha ao executar bcdedit. Verifique permissões.
)

echo.
echo [3/3] Desativando conflito de Isolamento do Núcleo (Memory Integrity)...
reg add "HKLM\SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity" /v "Enabled" /t REG_DWORD /d 0 /f >nul 2>&1

echo.
echo ========================================================
echo   [SUCESSO] Configuração concluída!
echo ========================================================
echo.
echo Para que o processador libere o VT-x para o MEmu,
echo É NECESSÁRIO REINICIAR O COMPUTADOR.
echo.
echo Deseja reiniciar o computador agora? (S/N)
set /p REBOOT="Digite S para reiniciar agora ou N para reiniciar depois: "
if /i "%REBOOT%"=="S" (
    echo Reiniciando o sistema em 5 segundos...
    shutdown /r /t 5 /c "Reiniciando para ativar VT-x do MEmu Play..."
) else (
    echo.
    echo Lembre-se de reiniciar manualmente antes de abrir o MEmu!
    pause
)
