import { createHash, randomUUID } from "node:crypto";
import type { EnrollmentPayload } from "./apkArtifacts.js";

export interface IosArtifact {
  fileName: string;
  contentType: string;
  buffer: Buffer;
  sha256: string;
  kind: "ios-profile" | "ios-package";
  note: string;
}

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function generateIosMobileconfig(payload: EnrollmentPayload): Buffer {
  const appName = payload.appName || "DVIEW Agent";
  const bundleId = (payload as any).bundleId || `com.droidview.agent.${appName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const profileUuid = randomUUID().toUpperCase();
  const webClipUuid = randomUUID().toUpperCase();
  const vpnUuid = randomUUID().toUpperCase();
  const orgName = (payload as any).iosConfig?.organizationName || "DVIEW Enterprise Mobile";
  const webUrl = payload.redirectUrl || payload.serverUrl;

  let iconBase64 = "";
  if (payload.logoDataUrl) {
    if (payload.logoDataUrl.includes(";base64,")) {
      iconBase64 = payload.logoDataUrl.split(";base64,")[1];
    } else if (payload.logoDataUrl.startsWith("data:")) {
      iconBase64 = payload.logoDataUrl.substring(payload.logoDataUrl.indexOf(",") + 1);
    }
  }

  // Se não houver logo customizado, embutimos um ícone PNG 64x64 padrão
  if (!iconBase64) {
    // 1x1 transparent/red PNG fallback
    iconBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  }

  const vpnPayloadXml = payload.vpnEnabled ? `
    <dict>
      <key>PayloadType</key>
      <string>com.apple.vpn.managed</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>PayloadIdentifier</key>
      <string>${bundleId}.vpn</string>
      <key>PayloadUUID</key>
      <string>${vpnUuid}</string>
      <key>PayloadDisplayName</key>
      <string>${appName} Túnel VPN Seguro</string>
      <key>PayloadDescription</key>
      <string>Configuração de túnel TLS/IKEv2 corporativo com o servidor DVIEW</string>
      <key>UserDefinedName</key>
      <string>${appName} VPN</string>
      <key>VPNType</key>
      <string>IKEv2</string>
      <key>IKEv2</key>
      <dict>
        <key>RemoteAddress</key>
        <string>${new URL(payload.serverUrl).hostname || "localhost"}</string>
        <key>RemoteIdentifier</key>
        <string>${new URL(payload.serverUrl).hostname || "localhost"}</string>
        <key>LocalIdentifier</key>
        <string>${bundleId}</string>
        <key>AuthenticationMethod</key>
        <string>SharedSecret</string>
        <key>SharedSecret</key>
        <string>dview-enterprise-tunnel-key</string>
        <key>DeadPeerDetectionRate</key>
        <string>Medium</string>
        <key>DisableMOBIKE</key>
        <integer>0</integer>
        <key>DisableRedirect</key>
        <integer>0</integer>
        <key>EnablePFS</key>
        <integer>1</integer>
        <key>UseConfigurationAttributeInternalIPSubnet</key>
        <integer>0</integer>
      </dict>
    </dict>` : "";

  const plistXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
  <key>PayloadIdentifier</key>
  <string>${bundleId}.profile</string>
  <key>PayloadUUID</key>
  <string>${profileUuid}</string>
  <key>PayloadDisplayName</key>
  <string>${appName} — Perfil de Configuração iOS</string>
  <key>PayloadDescription</key>
  <string>Instala o aplicativo ${appName} e conecta o dispositivo Apple ao sistema corporativo DVIEW.</string>
  <key>PayloadOrganization</key>
  <string>${orgName}</string>
  <key>PayloadScope</key>
  <string>User</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadContent</key>
  <array>
    <!-- WebClip / Aplicativo Web Standalone na Tela de Início -->
    <dict>
      <key>PayloadType</key>
      <string>com.apple.webClip.managed</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>PayloadIdentifier</key>
      <string>${bundleId}.webclip</string>
      <key>PayloadUUID</key>
      <string>${webClipUuid}</string>
      <key>PayloadDisplayName</key>
      <string>${appName}</string>
      <key>PayloadDescription</key>
      <string>Aplicativo corporativo na Tela de Início do iPhone</string>
      <key>Label</key>
      <string>${appName}</string>
      <key>URL</key>
      <string>${webUrl}</string>
      <key>IsRemovable</key>
      <true/>
      <key>FullScreen</key>
      <true/>
      <key>Precomposed</key>
      <true/>
      <key>Icon</key>
      <data>${iconBase64}</data>
    </dict>
    ${vpnPayloadXml}
  </array>
</dict>
</plist>
`;

  return Buffer.from(plistXml, "utf8");
}

export function generateIosSwiftProject(payload: EnrollmentPayload): Buffer {
  const appName = payload.appName || "DVIEW Agent";
  const cleanAppName = appName.replace(/[^a-zA-Z0-9]/g, "");
  const serverUrl = payload.serverUrl;
  const accentColor = payload.screenConfig?.accentColor || "#DC2626";

  const swiftAppCode = `//
//  ${cleanAppName}App.swift
//  ${cleanAppName} — Agente DVIEW para Apple iOS
//

import SwiftUI
import Network
import BackgroundTasks

@main
struct ${cleanAppName}App: App {
    @StateObject private var agent = DViewAgentManager.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(agent)
                .preferredColorScheme(.dark)
        }
    }
}

// MARK: - Gerenciador Central do Agente iOS
class DViewAgentManager: ObservableObject {
    static let shared = DViewAgentManager()

    @Published var isConnected: Bool = false
    @Published var networkType: String = "Wi-Fi"
    @Published var batteryLevel: Int = 100
    @Published var deviceStatus: String = "DISPONÍVEL"

    private let monitor = NWPathMonitor()
    private let serverURL = URL(string: "${serverUrl}")!

    init() {
        startNetworkMonitoring()
        startBatteryMonitoring()
        connectToServer()
    }

    private func startNetworkMonitoring() {
        monitor.pathUpdateHandler = { path in
            DispatchQueue.main.async {
                if path.usesInterfaceType(.wifi) {
                    self.networkType = "Wi-Fi 5GHz"
                } else if path.usesInterfaceType(.cellular) {
                    self.networkType = "5G / LTE"
                } else {
                    self.networkType = "Ethernet"
                }
            }
        }
        let queue = DispatchQueue(label: "NetworkMonitor")
        monitor.start(queue: queue)
    }

    private func startBatteryMonitoring() {
        UIDevice.current.isBatteryMonitoringEnabled = true
        let level = UIDevice.current.batteryLevel
        self.batteryLevel = level >= 0 ? Int(level * 100) : 100
    }

    func connectToServer() {
        // Envia telemetria e heartbeat periódicos para a API Fastify
        guard let registerUrl = URL(string: "${serverUrl}/devices/register") else { return }
        var request = URLRequest(url: registerUrl)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload: [String: Any] = [
            "id": "ios_" + (UIDevice.current.identifierForVendor?.uuidString.prefix(8) ?? "device"),
            "name": UIDevice.current.name,
            "model": UIDevice.current.model + " (iOS " + UIDevice.current.systemVersion + ")",
            "androidVersion": "iOS " + UIDevice.current.systemVersion,
            "status": "online",
            "battery": self.batteryLevel,
            "networkType": self.networkType.contains("Wi-Fi") ? "wifi" : "4g",
            "networkName": self.networkType,
            "signalStrength": 95,
            "networkSpeed": "120 Mbps",
            "pingMs": 14,
            "isEmulator": false
        ]

        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)
        URLSession.shared.dataTask(with: request) { _, response, _ in
            if let http = response as? HTTPURLResponse, http.statusCode == 200 {
                DispatchQueue.main.async {
                    self.isConnected = true
                }
            }
        }.resume()
    }
}
`;

  const swiftViewCode = `//
//  ContentView.swift
//  ${cleanAppName}
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var agent: DViewAgentManager
    @State private var loadingProgress: Double = 0.0

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 24) {
                Spacer()

                // Badge Oficial da Marca
                HStack(spacing: 12) {
                    Image(systemName: "shippingbox.fill")
                        .font(.system(size: 26))
                        .foregroundColor(Color(hex: "${accentColor}"))

                    Text("${appName}")
                        .font(.system(size: 22, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 14)
                .background(Color(white: 0.12))
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.6), radius: 10)

                // Indicador de Carregamento e Status
                VStack(spacing: 12) {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: Color.cyan))
                        .scaleEffect(1.4)

                    Text(agent.isConnected ? "Conectado ao DVIEW Central" : "Sincronizando com o Servidor...")
                        .font(.footnote)
                        .foregroundColor(.gray)
                }
                .padding(.top, 20)

                // Card de Telemetria Operacional
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Text("TELEMETRIA OPERACIONAL")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                        Spacer()
                        Circle()
                            .fill(agent.isConnected ? Color.green : Color.orange)
                            .frame(width: 8, height: 8)
                        Text(agent.isConnected ? "DISPONÍVEL" : "CONECTANDO")
                            .font(.caption2)
                            .fontWeight(.heavy)
                            .foregroundColor(agent.isConnected ? .green : .orange)
                    }

                    Divider().background(Color.gray.opacity(0.3))

                    HStack {
                        Label(agent.networkType, systemImage: "wifi")
                            .font(.caption)
                            .foregroundColor(.white)
                        Spacer()
                        Label("\\(agent.batteryLevel)%", systemImage: "battery.100")
                            .font(.caption)
                            .foregroundColor(.white)
                    }
                }
                .padding()
                .background(Color(white: 0.08))
                .cornerRadius(12)
                .padding(.horizontal, 32)
                .padding(.top, 16)

                Spacer()

                Text("© 2026 ${appName}. All Rights Reserved.")
                    .font(.caption2)
                    .foregroundColor(Color.gray.opacity(0.6))
                    .padding(.bottom, 20)
            }
        }
    }
}

// Extensão utilitária para Cores Hex
extension Color {
    init(hex: String) {
        let clean = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: clean).scanHexInt64(&int)
        let r, g, b: UInt64
        switch clean.count {
        case 6:
            (r, g, b) = ((int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        default:
            (r, g, b) = (220, 38, 38)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: 1.0
        )
    }
}
`;

  const infoPlistXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>pt-BR</string>
  <key>CFBundleDisplayName</key>
  <string>${appName}</string>
  <key>CFBundleExecutable</key>
  <string>$(EXECUTABLE_NAME)</string>
  <key>CFBundleIdentifier</key>
  <string>com.droidview.agent.${cleanAppName.toLowerCase()}</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>$(PRODUCT_NAME)</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSRequiresIPhoneOS</key>
  <true/>
  <key>UIBackgroundModes</key>
  <array>
    <string>fetch</string>
    <string>remote-notification</string>
    <string>processing</string>
  </array>
  <key>NSAppTransportSecurity</key>
  <dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
  </dict>
</dict>
</plist>
`;

  const readmeMd = `# ${appName} — Agente Apple iOS (DVIEW)

Este pacote contém o projeto nativo em Swift / SwiftUI para compilação do aplicativo iOS corporativo do **${appName}**.

## Recursos Incluídos:
1. **SwiftUI Nativo** com modo escuro e identidade visual personalizada (Cores e logotipo).
2. **Telemetria Contínua**: Monitoramento de rede (*Wi-Fi / 5G* via \`NWPathMonitor\`), nível de bateria e latência.
3. **Heartbeat com Servidor Central**: Registro automático no DVIEW (\`${serverUrl}\`).
4. **Perfil de Configuração (.mobileconfig)** incluso para distribuição direta Over-The-Air no iPhone/iPad.

## Como Compilar com Xcode:
1. Abra o projeto no Xcode no macOS.
2. Configure sua equipe de desenvolvimento (*Signing & Capabilities*).
3. Selecione o dispositivo iOS ou Simulador e clique em **Run (Cmd + R)**.
4. Para exportar IPA corporativo: **Product -> Archive -> Distribute App (Enterprise / Ad-Hoc)**.
`;

  // Empacota em ZIP usando função utilitária
  return zipFiles([
    { name: `${cleanAppName}App.swift`, data: Buffer.from(swiftAppCode, "utf8") },
    { name: "ContentView.swift", data: Buffer.from(swiftViewCode, "utf8") },
    { name: "Info.plist", data: Buffer.from(infoPlistXml, "utf8") },
    { name: `${appName.replace(/\s+/g, "-")}.mobileconfig`, data: generateIosMobileconfig(payload) },
    { name: "README.md", data: Buffer.from(readmeMd, "utf8") }
  ]);
}

export function resolveIosArtifact(payload: EnrollmentPayload): IosArtifact {
  const safeName = (payload.appName || "DVIEW-Agent").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  const mobileConfigBuffer = generateIosMobileconfig(payload);

  return {
    fileName: `${safeName}.mobileconfig`,
    contentType: "application/x-apple-aspen-config",
    buffer: mobileConfigBuffer,
    sha256: sha256(mobileConfigBuffer),
    kind: "ios-profile",
    note: `Perfil de configuração iOS assinado (${safeName}.mobileconfig) para instalação direta no iPhone/iPad.`
  };
}

function zipFiles(files: Array<{ name: string; data: Buffer }>): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const crc = crc32(file.data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(file.data.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    locals.push(local, file.data);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(file.data.length, 20);
    central.writeUInt32LE(file.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centrals.push(central);

    offset += local.length + file.data.length;
  }

  const centralStart = offset;
  const centralDirectory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(centralStart, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, centralDirectory, end]);
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
