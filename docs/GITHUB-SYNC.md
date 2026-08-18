# DroidView - Guia de Sincronização com GitHub

## Configuração Inicial

O projeto já está configurado para sincronizar com:
- **Repositório:** https://github.com/Biel0071/dview
- **Remote:** origin
- **Branch:** main

## Sincronizar pela Primeira Vez

### Windows

```batch
scripts\sync-github.bat SEU_USUARIO SEU_TOKEN
```

### Linux/macOS

```bash
chmod +x scripts/sync-github.sh
./scripts/sync-github.sh SEU_USUARIO SEU_TOKEN
```

## Obter Token do GitHub

1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token (classic)"
3. Marque as permissões:
   - ✅ `repo` (Full control of private repositories)
4. Gere o token e copie (não será mostrado novamente)

## O que o Script Faz

1. ⚠️ **Verifica secrets** - Busca por passwords, tokens, API keys
2. 📦 **Adiciona todos os arquivos** - `git add -A`
3. 💾 **Faz commit** - Mensagem padrão "sync: sincronizar projeto DroidView com GitHub"
4. 🔀 **Merge com remoto** - Integra histórico se necessário
5. 📤 **Push para GitHub** - Envia para `origin/main`

## Sincronização Manual

```bash
# Configurar remote (já feito)
git remote -v

# Buscar mudanças do GitHub
git fetch origin

# Verificar diferenças
git diff main origin/main

# Fazer merge se houver mudanças remotas
git merge origin/main

# Adicionar mudanças locais
git add -A

# Commitar
git commit -m "feat: sua mensagem aqui"

# Enviar para GitHub
git push origin main
```

## Conflitos

Se houver conflito:

```bash
# Lista arquivos em conflito
git status

# Edite cada arquivo resolvendo conflitos
# Procure por <<<<<<< HEAD e ======= e >>>>>>>

# Após resolver:
git add <arquivo-resolvido>
git commit -m "fix: resolver conflito em <arquivo>"
git push origin main
```

## Verificar Status

```bash
# Branch atual
git branch

# Remote configurado
git remote -v

# Últimos commits
git log --oneline -5

# Status dos arquivos
git status
```

## Notas Importantes

- ⚠️ **Nunca force push** (`git push -f`) a menos que saiba exatamente o que está fazendo
- ⚠️ **Não envie secrets** - O script verifica, mas revise sempre
- ✅ **Commite com frequência** - Mudanças pequenas são mais fáceis de sincronizar
- ✅ **Pull antes de push** - Sempre faça `git fetch` e `git merge` antes de push

## URLs Úteis

- Repositório: https://github.com/Biel0071/dview
- Seus tokens: https://github.com/settings/tokens
- Docs Git: https://git-scm.com/doc
