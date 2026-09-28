# DVIEW - Guia de Uso: Aplicativo Desktop (.exe) e Modo Localhost

O **DVIEW** oferece duas formas flexíveis de operação:
1. **Aplicativo Desktop Executável (`.exe`)**: Sistema completo em janela nativa para Windows (com backend Fastify + Socket.IO embutido e painel de controle React), pronto para uso imediato sem necessidade de abrir terminais.
2. **Modo Web Localhost**: Execução tradicional para desenvolvimento ou operação via navegador web padrão (Chrome, Edge, Firefox).

---

## 📦 1. Artefatos Executáveis Windows (.exe)

Os executáveis de produção são gerados na pasta `apps/desktop/release-mvp/`:

### A. Instalador Oficial para Windows
- **Arquivo:** `DVIEW-Admin-Setup-0.1.0.exe` (~79.5 MB)
- **Tipo:** Instalador NSIS completo
- **Recursos:**
  - Cria atalho na Área de Trabalho e no Menu Iniciar
  - Permite escolher diretório personalizado de instalação
  - Desinstalador limpo no Painel de Controle do Windows
  - Inicia o sistema automaticamente com duplo clique

### B. Versão Portátil / Direta
- **Diretório:** `apps/desktop/release-mvp/win-unpacked/`
- **Executável:** `DVIEW Admin.exe`
- **Uso:** Não requer instalação. Basta copiar a pasta e executar `DVIEW Admin.exe`.

---

## 🚀 2. Como Usar

### Opção A: Executar pelo Aplicativo Desktop (.exe)
1. Dê um duplo clique em `DVIEW-Admin-Setup-0.1.0.exe` para instalar, ou execute diretamente `win-unpacked/DVIEW Admin.exe`.
2. A aplicação desktop inicializa automaticamente o backend embutido na porta `3000` (se ainda não estiver ativo) e carrega a interface de controle.
3. Se o operador já tiver um backend rodando no terminal, o app detecta a porta ativa e se conecta a ele sem conflitos.
4. O operador também pode conectar aparelhos Android físicos ou emuladores através de `http://<IP_DA_MAQUINA>:3000`.

### Opção B: Subir via Localhost (Navegador Web)
Para rodar o sistema localmente pelo navegador:
```bash
# Iniciar backend (porta 3000) e painel web (porta 5000) juntos
npm start
# ou
npm run start:localhost
# ou
npm run dev
```
- **Painel de Controle:** Acesse no navegador: `http://localhost:5000`
- **API & WebSocket:** Ativos em `http://localhost:3000`

---

## 🔐 3. Credenciais de Acesso

Ao abrir a interface (seja pelo `.exe` ou pelo navegador), utilize as credenciais:

### Administrador
- **Email:** `admin@dview.local`
- **Senha:** `admin123`
- **Código 2FA:** `123456`

### Operador
- **Email:** `user@dview.local`
- **Senha:** `user123`
- **Código 2FA:** `123456`

---

## 🛠️ 4. Scripts e Comandos de Build

### Gerar os Executáveis Windows (.exe)
```bash
# Gerar instalador de produção (.exe NSIS)
npm run build:exe
# ou
.\scripts\build-exe.ps1

# Gerar versão portátil descompactada (win-unpacked)
npm run electron:pack
```

### Inicialização Rápida
```bash
# Modo Localhost (Backend + Web)
npm run start:localhost
# ou: .\scripts\start-localhost.ps1

# Modo Desktop (Electron)
npm run start:desktop
# ou: .\scripts\start-desktop.ps1
```

### Testes e Verificação
```bash
# Rodar todos os testes automatizados
npm test

# Build de produção de todos os módulos
npm run build
```

---

## 📱 5. Funcionalidades do Sistema Completo

- **Dashboard:** KPIs em tempo real (dispositivos online, sessões ativas, alertas de segurança).
- **Gerenciador de Dispositivos:** Registro automático de dispositivos físicos (`/devices/register`) e criação rápida de múltiplos emuladores (`/devices/emulator/add`).
- **Sessões Remotas:** Solicitação de conexão com código de consentimento seguro gerado por sessão.
- **Gerador de APK / Pacote de Pareamento:** Emissão de APK assinado com criptografia AES-256 e QR code de pareamento.
- **WebSocket em Tempo Real:** Socket.IO para conexão simultânea entre agentes, emuladores e painel de controle.
- **Logs de Auditoria:** Rastreabilidade completa de autenticação, comandos e acessos.
