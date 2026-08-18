# DroidView Android Agent

Agente Android Kotlin para pareamento consentido com o DroidView Admin.

## Estado Atual

Este app e um agente seguro de MVP:

- Abre por launcher ou deeplink `droidview://enroll?config=...`
- Decodifica configuracao de pareamento gerada pelo backend
- Mostra servidor, dispositivo e status do pareamento
- Exige aceite visivel antes de ativar o foreground service
- Permite alternar idioma basico entre Portugues e Ingles
- Solicita compartilhamento de tela pelo dialogo nativo do Android
- Abre a tela nativa de Device Admin para aceite manual

Nao ha instalacao silenciosa, bypass, stealth, wipe automatico ou controle remoto sem consentimento.

## Build Do APK

Com Android SDK/Gradle disponivel:

```bash
cd apps/android-agent
gradle assembleDebug
```

Se o Android Studio gerar o Gradle Wrapper:

```bash
cd apps/android-agent
./gradlew assembleDebug
```

APK esperado:

```text
apps/android-agent/app/build/outputs/apk/debug/app-debug.apk
```

Quando esse arquivo existir, o backend passa a servir um APK real em `/apk/download/:config`.

## Fallback Sem SDK

Se o APK ainda nao foi compilado, o backend nao finge que existe um APK. Ele entrega:

```text
DroidView-Agent-enrollment-package.zip
```

Esse ZIP contem:

- `enrollment.json` com servidor, token e nome do aparelho
- `README.md` com o link de pareamento e instrucao de build

## Instalacao No Aparelho

1. Gere o pacote pelo painel/admin.
2. Se o download for `.apk`, instale manualmente no Android.
3. Se o download for `.zip`, compile o APK primeiro e use o deeplink/QR informado.
4. Abra o DroidView Agent no aparelho.
5. Marque o aceite.
6. Toque em `Ativar agente visivel`.
7. Para sessao de tela, toque em `Autorizar compartilhamento de tela` e aceite o dialogo nativo Android.

## Estrutura

```text
apps/android-agent/
  app/src/main/java/com/droidview/agent/
    MainActivity.kt
    service/AgentForegroundService.kt
    socket/AgentSocketClient.kt
    projection/ProjectionConsentController.kt
    mdm/DroidViewDeviceAdminReceiver.kt
```

## Limites Propositais

- Device Admin requer aceite manual do usuario.
- MediaProjection requer aceite por sessao.
- Acessibilidade, toque remoto e streaming real ainda nao estao implementados.
- Politicas MDM destrutivas nao fazem parte deste MVP.
