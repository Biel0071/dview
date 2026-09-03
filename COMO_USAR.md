# DVIEW Admin - Executáveis Instaláveis

## 📦 Artefatos Gerados

Os seguintes executáveis instaláveis foram gerados com sucesso na pasta `apps/desktop/release-mvp/`:

### Para Windows
- **`DVIEW-Admin-Setup-0.1.0.exe`** (185 KB)
  - Instalador NSIS para Windows
  - Cria atalhos na área de trabalho e menu Iniciar
  - Permite escolher diretório de instalação

### Para Linux
- **`DVIEW-Admin-0.1.0.AppImage`** (103 MB)
  - Aplicação portátil para Linux
  - Não requer instalação
  - Execute diretamente: `chmod +x DVIEW-Admin-0.1.0.AppImage && ./DVIEW-Admin-0.1.0.AppImage`

- **`DVIEW-Admin-0.1.0.deb`** (72 MB)
  - Pacote Debian para Ubuntu/Debian
  - Instale com: `sudo dpkg -i DVIEW-Admin-0.1.0.deb`

### Versão Portátil (Linux)
- **`release-mvp/linux-unpacked/`**
  - Diretório com aplicação descompactada
  - Execute: `./@droidviewdesktop`

## 🚀 Como Usar

### No Windows
1. Baixe o arquivo `DVIEW-Admin-Setup-0.1.0.exe`
2. Execute o instalador
3. Siga as instruções do assistente de instalação
4. O aplicativo será iniciado automaticamente após a instalação

### No Linux (AppImage)
```bash
# Tornar executável
chmod +x DVIEW-Admin-0.1.0.AppImage

# Executar
./DVIEW-Admin-0.1.0.AppImage
```

### No Linux (pacote .deb)
```bash
# Instalar
sudo dpkg -i DVIEW-Admin-0.1.0.deb

# Executar (atalho criado no menu de aplicações)
DVIEW-Admin
```

## 🔐 Credenciais de Acesso

Ao iniciar o aplicativo, use as seguintes credenciais:

### Admin
- **Email:** admin@dview.local
- **Senha:** admin123
- **Código 2FA:** 123456

### Operador
- **Email:** user@dview.local
- **Senha:** user123
- **Código 2FA:** 123456

## 📱 Funcionalidades

- **Dashboard:** Visão geral de dispositivos, sessões e alertas
- **Gerenciamento de Dispositivos:** Visualize dispositivos Android conectados
- **Sessões Remotas:** Solicite acesso remoto a dispositivos
- **Geração de APK:** Crie pacotes de enrollment para agentes Android
- **Logs:** Acompanhe todas as ações do sistema

## 🛠️ Comandos de Build

### Gerar todos os formatos
```bash
cd apps/desktop
npm run dist:linux   # AppImage + deb
npm run dist:win     # EXE (requer Wine no Linux)
```

### Apenas para teste
```bash
npm start            # Executa em modo desenvolvimento
```

## 📋 Recursos Incluídos

- ✅ Interface web moderna (React + TypeScript)
- ✅ API local integrada (porta 3000)
- ✅ APK do agente Android embutido
- ✅ Suporte multiplataforma (Windows/Linux)
- ✅ Atalhos automáticos
- ✅ Instalação personalizada

## ⚠️ Notas Importantes

1. **Windows:** O build para Windows (.exe) requer Wine instalado no Linux
2. **Linux:** O AppImage funciona na maioria das distribuições modernas
3. **APK:** O pacote inclui `DVIEW-Agent-debug.apk` para enrollment de dispositivos
4. **Rede:** A API local roda em `http://127.0.0.1:3000`

---
**DVIEW Admin v0.1.0** - Sistema de gerenciamento de dispositivos Android
