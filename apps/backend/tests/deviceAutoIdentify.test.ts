import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { extractDeviceUserIdentity, formatNameFromEmail, formatPhoneNumber } from "../src/deviceBridge.js";
import { autoIdentifyDevice, getDeviceCustomMetadata } from "../src/data.js";
import type { Device } from "@droidview/shared";

describe("Device Automatic User Identification & Contact Integration", () => {
  it("formats phone numbers and names from emails properly", () => {
    // Teste de formatação de telefone
    expect(formatPhoneNumber("11987654321")).toBe("+55 (11) 98765-4321");
    expect(formatPhoneNumber("5511987654321")).toBe("+55 (11) 98765-4321");
    expect(formatPhoneNumber("+5511987654321")).toBe("+55 (11) 98765-4321");
    expect(formatPhoneNumber("1133334444")).toBe("+55 (11) 3333-4444");

    // Teste de formatação de nome derivado de email (filtrando sufixos técnicos como 'log')
    expect(formatNameFromEmail("carlos.ferreira.log@gmail.com")).toBe("Carlos Ferreira");
    expect(formatNameFromEmail("mariana_alcantara@empresa.com.br")).toBe("Mariana Alcantara");
    expect(formatNameFromEmail("lucas-mendes@transportes.com")).toBe("Lucas Mendes");
  });

  it("extracts device user identity with fallback profiles deterministically", async () => {
    const identity1 = await extractDeviceUserIdentity("dev_test_samsung", "SM-N975F");
    expect(identity1.autoIdentified).toBe(true);
    expect(identity1.contactName).toBeDefined();
    expect(identity1.contactName.length).toBeGreaterThan(0);
    expect(identity1.phoneNumber).toMatch(/^\+55\s\(\d{2}\)\s\d{4,5}-\d{4}$/);
    expect(identity1.apkName).toBeDefined();
    expect(identity1.userAccount).toBeDefined();
    expect(identity1.identifiedAt).toBeDefined();

    // Mesma entrada produz a mesma identificação determinística quando em contingência
    const identity2 = await extractDeviceUserIdentity("dev_test_samsung", "SM-N975F");
    expect(identity2.contactName).toBe(identity1.contactName);
    expect(identity2.phoneNumber).toBe(identity1.phoneNumber);
  });

  it("auto-identifies device and enriches contact fields", async () => {
    const sampleDevice: Device = {
      id: "dev_auto_ident_unit",
      name: "Galaxy S23",
      model: "SM-S911B",
      androidVersion: "14",
      status: "online",
      battery: 88,
      networkType: "5g",
      ipAddress: "192.168.1.150",
      lastSeen: new Date().toISOString(),
      enrolledAt: new Date().toISOString(),
      consentRequired: false
    };

    const identified = await autoIdentifyDevice(sampleDevice, undefined, true);
    expect(identified.autoIdentified).toBe(true);
    expect(identified.contactName).toBeDefined();
    expect(identified.phoneNumber).toBeDefined();
    expect(identified.apkName).toBeDefined();
    expect(identified.userAccount).toBeDefined();
    expect(identified.identifiedAt).toBeDefined();

    // Verifica persistência de metadata no data store
    const meta = getDeviceCustomMetadata("dev_auto_ident_unit");
    expect(meta.contactName).toBe(identified.contactName);
    expect(meta.phoneNumber).toBe(identified.phoneNumber);
  });

  it("automatically enriches device on registration and returns in GET /devices", async () => {
    const app = buildApp();

    // Login admin para obter token
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "admin@dview.local", password: "admin123", totp: "123456" }
    });
    const token = login.json().token;
    const authHeaders = { authorization: `Bearer ${token}` };

    // 1. Registrar novo aparelho sem informações prévias de contato
    const regRes = await app.inject({
      method: "POST",
      url: "/devices/register",
      headers: authHeaders,
      payload: {
        id: "dev_registered_live_01",
        name: "Motorola Edge 40",
        model: "XT2303-2",
        androidVersion: "13",
        isEmulator: false
      }
    });

    expect(regRes.statusCode).toBe(200);
    const regBody = regRes.json();
    expect(regBody.device.id).toBe("dev_registered_live_01");
    expect(regBody.device.autoIdentified).toBe(true);
    expect(regBody.device.contactName).toBeDefined();
    expect(regBody.device.phoneNumber).toBeDefined();
    expect(regBody.device.apkName).toBeDefined();

    // 2. Consultar GET /devices para assegurar que a lista de aparelhos traz os dados identificados
    const listRes = await app.inject({
      method: "GET",
      url: "/devices",
      headers: authHeaders
    });

    expect(listRes.statusCode).toBe(200);
    const devices: Device[] = listRes.json();
    const found = devices.find((d) => d.id === "dev_registered_live_01");
    expect(found).toBeDefined();
    expect(found?.autoIdentified).toBe(true);
    expect(found?.contactName).toBe(regBody.device.contactName);
    expect(found?.phoneNumber).toBe(regBody.device.phoneNumber);
    expect(found?.userAccount).toBe(regBody.device.userAccount);
  });

  it("supports manual on-demand re-identification via POST /devices/:id/auto-identify", async () => {
    const app = buildApp();

    // Login admin
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "admin@dview.local", password: "admin123", totp: "123456" }
    });
    const token = login.json().token;
    const authHeaders = { authorization: `Bearer ${token}` };

    // Disparar identificação automática sob demanda
    const triggerRes = await app.inject({
      method: "POST",
      url: "/devices/dev_registered_live_01/auto-identify",
      headers: authHeaders
    });

    expect(triggerRes.statusCode).toBe(200);
    const triggerBody = triggerRes.json();
    expect(triggerBody.success).toBe(true);
    expect(triggerBody.device.autoIdentified).toBe(true);
    expect(triggerBody.device.contactName).toBeDefined();
    expect(triggerBody.message).toContain("Identificação de usuário concluída com sucesso");
  });
});
