import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";

describe("Push Notification System (/devices/:id/push-notification)", () => {
  it("should successfully dispatch push notification for selected app with custom text", async () => {
    const app = buildApp();

    const deviceId = "dev_push_test_01";
    const res = await app.inject({
      method: "POST",
      url: `/devices/${deviceId}/push-notification`,
      payload: {
        appName: "Nubank",
        packageName: "com.nu.production",
        title: "Transferência Pix Recebida",
        message: "Você recebeu R$ 1.250,00 de Marcos Souza via Pix.",
        category: "banco"
      }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.notification).toBeDefined();
    expect(body.notification.deviceId).toBe(deviceId);
    expect(body.notification.appName).toBe("Nubank");
    expect(body.notification.packageName).toBe("com.nu.production");
    expect(body.notification.title).toBe("Transferência Pix Recebida");
    expect(body.notification.message).toBe("Você recebeu R$ 1.250,00 de Marcos Souza via Pix.");
    expect(body.notification.iconEmoji).toBe("🟣");
    expect(body.notification.timestamp).toBeDefined();
  });

  it("should retrieve history of dispatched push notifications for device", async () => {
    const app = buildApp();
    const deviceId = "dev_push_test_02";

    // Send WhatsApp notification
    await app.inject({
      method: "POST",
      url: `/devices/${deviceId}/push-notification`,
      payload: {
        appName: "WhatsApp",
        packageName: "com.whatsapp",
        title: "Mensagem de Carlos Ferreira",
        message: "Cheguei no local com a encomenda da Jadlog.",
        category: "chat"
      }
    });

    // Send JADLOG notification
    await app.inject({
      method: "POST",
      url: `/devices/${deviceId}/push-notification`,
      payload: {
        appName: "JADLOG Rastreio",
        packageName: "com.droidview.agent",
        title: "Pacote em Rota de Entrega",
        message: "Remessa #100827364 saiu para entrega hoje.",
        category: "logistica"
      }
    });

    const getRes = await app.inject({
      method: "GET",
      url: `/devices/${deviceId}/push-notifications`
    });

    expect(getRes.statusCode).toBe(200);
    const list = JSON.parse(getRes.payload);
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list[0].appName).toBe("JADLOG Rastreio");
    expect(list[1].appName).toBe("WhatsApp");
  });
});
