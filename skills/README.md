# DroidView Skills

## Skills Comportamentais

### think-before-code.md
- Escreva suposições explicitamente antes de codar
- Ambiguidade: pare e pergunte
- Abordagem mais simples: argumente por ela
- Violação de compliance: issue "blocked-compliance"

### simplicity-first.md
- Código mínimo que resolve a tarefa
- Sem features/flags/configs não pedidos
- Sem abstração antes do 3º uso real

### surgical-changes.md
- Toque só nas linhas necessárias
- Não "melhore" código adjacente
- Problema não relacionado: anotar no backlog

### plan-then-execute.md
- Plano escrito com passos verificáveis
- Revisar contra compliance antes de executar

### test-driven-development.md
- RED → GREEN → REFACTOR
- E2E obrigatório para fluxos críticos

### verification-before-completion.md
- Nenhuma afirmação sem evidência fresca
- Conferir critérios de sucesso um a um

### systematic-debugging.md
- Reproduzir → isolar → causa raiz → correção mínima
- Proibido ajuste aleatório

### code-review-gate.md
- Self-review obrigatório
- Resumo legível + evidência de testes
- Compliance e QA com veto

### context-hygiene.md
- QWEN.md/PROGRESS.md/DECISIONS.md são fonte da verdade
- Atualizar antes de fechar contexto

## Skills de Domínio

### backend.md
Fastify + TypeScript, Socket.IO, PostgreSQL, JWT/2FA, auditoria, OpenAPI, vitest

### android.md
Kotlin, device owner, foreground service, MediaProjection, UsageStats, Material3, mín. Android 10

### frontend.md
React + TS + Vite, tema escuro/verde, toggle/tabela/aba/modal, socket client

### db.md
Migrações, retenção com purge, auditoria imutável

### devops.md
docker-compose, HTTPS Caddy/Traefik, CI, pipeline de assinatura

### qa.md
E2E fluxos críticos, OWASP ASVS light

### compliance.md
Checagem seção 0, fluxos de transparência, checklist por flag

### docs.md
READMEs, API, anexo contratual LGPD
