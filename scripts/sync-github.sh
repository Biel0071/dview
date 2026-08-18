#!/bin/bash
# Script de sincronização com GitHub - DroidView
# Uso: ./scripts/sync-github.sh <GITHUB_USERNAME> <GITHUB_TOKEN>

set -e

echo "============================================"
echo "  DroidView - Sincronizacao com GitHub"
echo "============================================"
echo ""

if [ -z "$1" ]; then
    echo "Erro: Usuario do GitHub nao fornecido"
    echo "Uso: sync-github.sh <usuario> <token>"
    exit 1
fi

if [ -z "$2" ]; then
    echo "Erro: Token do GitHub nao fornecido"
    echo "Uso: sync-github.sh <usuario> <token>"
    exit 1
fi

GH_USER=$1
GH_TOKEN=$2
GH_REPO="https://github.com/${GH_USER}/dview.git"

echo "Configurando remote..."
git remote set-url origin "$GH_REPO"

echo ""
echo "Verificando arquivos secretos..."
if grep -r -l -E "(password|secret|token|api_key)" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" . 2>/dev/null; then
    echo ""
    echo "ATENCAO: Foram detectados possiveis segredos no codigo."
    echo "Revise antes de fazer push."
    read -p "Continuar mesmo assim? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "Adicionando todos os arquivos..."
git add -A

echo ""
echo "Fazendo commit..."
git commit -m "sync: sincronizar projeto DroidView com GitHub" || echo "Nenhum arquivo para commit"

echo ""
echo "Fazendo fetch do remoto..."
git fetch origin

echo ""
echo "Tentando merge..."
git merge origin/main --allow-unrelated-histories -m "merge: integrar com remoto" || echo "Merge automatico falhou, resolva conflitos manualmente"

echo ""
echo "Fazendo push..."
GIT_ASKPASS=echo git push origin HEAD:main

COMMIT_HASH=$(git rev-parse --short HEAD)

echo ""
echo "============================================"
echo "  SUCESSO!"
echo "============================================"
echo "  Branch: main"
echo "  Repositorio: https://github.com/${GH_USER}/dview"
echo "  Commit: ${COMMIT_HASH}"
echo "============================================"
