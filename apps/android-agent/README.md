# DroidView Android Agent

Agente Android em Kotlin com suporte a MDM e sessão remota.

## Requisitos

- Android 10+ (API 29)
- Android Studio Arctic Fox+
- Gradle 7.0+

## Estrutura

```
apps/android-agent/
├── app/
│   ├── src/main/
│   │   ├── java/com/droidview/agent/
│   │   │   ├── service/      # Foreground Service
│   │   │   ├── socket/       # Cliente Socket.IO
│   │   │   ├── projection/   # MediaProjection
│   │   │   ├── mdm/          # Device Owner / Policies
│   │   │   └── MainActivity.kt
│   │   └── AndroidManifest.xml
│   └── build.gradle.kts
└── gradle/
```

## Permissões Necessárias

```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.BIND_ACCESSIBILITY_SERVICE" />
```

## Funcionalidades

### Foreground Service
- Notificação persistente
- Mantém conexão socket ativa
- Reinício automático se morto

### MediaProjection
- Captura de tela em tempo real
- Consentimento por sessão (diálogo nativo)
- Overlay visível durante sessão

### MDM (Android Enterprise)
- Device Owner mode
- Instalação silenciosa de apps
- Políticas de segurança
- Remote wipe
- Block device

### Socket.IO Client
- Conexão persistente com backend
- Reconeção automática
- Rooms por dispositivo

## Build

```bash
gradle assembleDebug
```

Se voce abrir o projeto no Android Studio, ele pode gerar o Gradle Wrapper. Depois disso tambem funciona:

```bash
./gradlew assembleDebug
```

APK gerado em: `app/build/outputs/apk/debug/app-debug.apk`

## Instalação como Device Owner

```bash
adb shell pm uninstall com.droidview.agent
adb shell am start -a android.settings.DEVICE_SETTINGS
adb shell dpm set-device-owner com.droidview.agent/.DeviceAdminReceiver
```

## Testes

```bash
./gradlew test
./gradlew connectedAndroidTest
```

## Notas

- **Consentimento obrigatório**: Cada sessão requer aceite do usuário via diálogo MediaProjection
- **Overlay visível**: Indicador verde mostra quando sessão está ativa
- **Acessibilidade**: Necessária para toque remoto e gestos
