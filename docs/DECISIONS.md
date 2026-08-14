# DroidView - Decisões de Arquitetura

## ADR-001: Monorepo com Apps Separados

**Status:** Aceito

**Contexto:** Sistema precisa de backend, agente Android e painel web integrados.

**Decisão:** Estrutura monorepo com:
- `apps/backend` - Node.js + TypeScript
- `apps/android-agent` - Kotlin
- `apps/web-panel` - React + TypeScript
- `packages/shared` - Tipos compartilhados

**Consequências:**
- ✅ Código compartilhado facilitado
- ✅ Versionamento único
- ⚠️ Build mais complexo

## ADR-002: Socket.IO para Comunicação em Tempo Real

**Status:** Aceito

**Contexto:** Necessidade de comunicação bidirecional entre painel e agentes.

**Decisão:** Socket.IO sobre WebSocket com fallback HTTP.

**Consequências:**
- ✅ Conexão persistente
- ✅ Reconeção automática
- ✅ Rooms para dispositivos
- ⚠️ Overhead vs WebSocket puro

## ADR-003: MediaProjection para Espelhamento

**Status:** Aceito

**Contexto:** Visualização remota da tela do dispositivo Android.

**Decisão:** Usar MediaProjection API com consentimento por sessão.

**Consequências:**
- ✅ Nativo Android 5.0+
- ✅ Consentimento explícito do usuário
- ⚠️ Requer interação do usuário a cada sessão

## ADR-004: JWT + 2FA para Autenticação

**Status:** Aceito

**Contexto:** Segurança de acesso ao painel.

**Decisão:** JWT com TOTP (2FA) obrigatório.

**Consequências:**
- ✅ Stateless authentication
- ✅ Camada extra de segurança
- ⚠️ Sincronização de tempo necessária

## ADR-005: PostgreSQL para Persistência

**Status:** Aceito

**Contexto:** Banco de dados para dispositivos, usuários, logs.

**Decisão:** PostgreSQL com migrações versionadas.

**Consequências:**
- ✅ ACID compliance
- ✅ JSONB para dados flexíveis
- ✅ Full-text search para logs

## ADR-006: Docker Compose para Deploy

**Status:** Aceito

**Contexto:** Facilidade de deploy e consistência de ambiente.

**Decisão:** docker-compose com Caddy para HTTPS automático.

**Consequências:**
- ✅ Ambiente reproduzível
- ✅ HTTPS automático (Let's Encrypt)
- ⚠️ Curva de aprendizado Docker

## ADR-007: APK Builder no Navegador

**Status:** Aceito

**Contexto:** Gerar APKs customizados sem infraestrutura complexa.

**Decisão:** Gerar APK mínimo via JavaScript no browser com:
- Manifesto binário
- Bytecode Dalvik embutido
- Assinatura RSA v1

**Consequências:**
- ✅ Sem servidor de build
- ✅ Rápido e escalável
- ⚠️ APK limitado (stub de redirecionamento)

---

*Última atualização: $(date)*
