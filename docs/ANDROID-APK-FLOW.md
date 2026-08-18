# Android APK Flow

O fluxo Android do DroidView agora separa dois casos de forma honesta.

## Caso 1: APK Real Disponivel

Se existir:

```text
artifacts/android/DroidView-Agent-debug.apk
```

ou o output local de build:

```text
apps/android-agent/app/build/outputs/apk/debug/app-debug.apk
```

o backend serve esse arquivo em:

```text
GET /apk/download/:config
```

com:

```text
content-type: application/vnd.android.package-archive
x-droidview-artifact-kind: apk
x-droidview-sha256: <hash>
```

## Caso 2: Sem APK Versionado/Build

Se o APK nao existir, o backend entrega:

```text
DroidView-Agent-enrollment-package.zip
```

com:

```text
content-type: application/zip
x-droidview-artifact-kind: enrollment-package
```

Esse fallback nao e um APK. Ele contem configuracao e instrucoes para compilar o agente. O fluxo normal do projeto agora inclui o APK debug em `artifacts/android`.

## Endpoints

```text
POST /apk/build
GET /apk/download/:config
GET /apk/status/:config
```

`POST /apk/build` retorna o nome do artefato, URL de download, payload de QR/deeplink e uma nota dizendo se o artefato e APK real ou pacote de pareamento.

## Garantias De Seguranca

- O agente Android exige aceite visivel antes de ativar o servico.
- Compartilhamento de tela usa o dialogo nativo MediaProjection.
- Device Admin abre a tela oficial do Android para consentimento manual.
- O projeto nao implementa instalacao silenciosa, bypass, modo oculto, wipe automatico ou controle remoto sem consentimento.
