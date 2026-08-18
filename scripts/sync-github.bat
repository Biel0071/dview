@echo off
REM Script de sincronização com GitHub - DroidView
REM Uso: scripts\sync-github.bat [GITHUB_USERNAME] [GITHUB_TOKEN]

setlocal enabledelayedexpansion

echo ============================================
echo   DroidView - Sincronizacao com GitHub
echo ============================================
echo.

REM Configurar credenciais
if "%1"=="" (
    echo Erro: Usuario do GitHub nao fornecido
    echo Uso: sync-github.bat ^<usuario^> ^<token^>
    exit /b 1
)

if "%2"=="" (
    echo Erro: Token do GitHub nao fornecido
    echo Uso: sync-github.bat ^<usuario^> ^<token^>
    exit /b 1
)

set GH_USER=%1
set GH_TOKEN=%2
set GH_REPO=https://github.com/%GH_USER%/dview.git

echo Configurando remote...
git remote set-url origin %GH_REPO%

echo.
echo Verificando arquivos secretos...
set HAS_SECRET=0
for /f "delims=" %%i in ('findstr /s /m "password secret token api_key" *.ts *.tsx *.js *.jsx *.json 2^>nul') do (
    echo AVISO: Possivel segredo em %%i
    set HAS_SECRET=1
)
if %HAS_SECRET%==1 (
    echo.
    echo ATENCAO: Foram detectados possiveis segredos no codigo.
    echo Revise antes de fazer push.
    pause
)

echo.
echo Adicionando todos os arquivos...
git add -A

echo.
echo Fazendo commit...
git commit -m "sync: sincronizar projeto DroidView com GitHub" || echo Nenhum arquivo para commit

echo.
echo Fazendo fetch do remoto...
git fetch origin

echo.
echo Tentando merge...
git merge origin/main --allow-unrelated-histories -m "merge: integrar com remoto" || echo Merge automatico falhou, resolva conflitos manualmente

echo.
echo Fazendo push...
git push origin HEAD:main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo   SUCESSO!
    echo ============================================
    echo   Branch: main
    echo   Repositorio: https://github.com/%GH_USER%/dview
    echo   Commit: !COMMIT_HASH!
    echo ============================================
) else (
    echo.
    echo ============================================
    echo   ERRO no push
    echo ============================================
    echo   Verifique:
    echo   1. Token valido com permissao repo
    echo   2. Conexao com internet
    echo   3. Conflitos de merge
    echo ============================================
)

endlocal
