import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";

describe("Digital Touch Detection & Simulation System", () => {
  it("simulates digital touch and records the event", async () => {
    const app = buildApp();

    // 1. Simular toque digital via POST /devices/:id/touch
    const touchRes = await app.inject({
      method: "POST",
      url: "/devices/dev_test_device/touch",
      payload: {
        x: 360,
        y: 640,
        displayWidth: 720,
        displayHeight: 1280
      }
    });

    expect(touchRes.statusCode).toBe(200);
    const touchBody = touchRes.json();
    expect(touchBody.success).toBe(true);
    expect(touchBody.x).toBe(360);
    expect(touchBody.y).toBe(640);

    // 2. Simular gesto de deslize via POST /devices/:id/swipe
    const swipeRes = await app.inject({
      method: "POST",
      url: "/devices/dev_test_device/swipe",
      payload: {
        x1: 360,
        y1: 800,
        x2: 360,
        y2: 200,
        duration: 250
      }
    });

    expect(swipeRes.statusCode).toBe(200);
    expect(swipeRes.json().success).toBe(true);

    // 3. Registrar detecção de toque originado no dispositivo via POST /devices/:id/touch-events
    const detectRes = await app.inject({
      method: "POST",
      url: "/devices/dev_test_device/touch-events",
      payload: {
        action: "click",
        x: 180,
        y: 350,
        packageName: "br.com.jadlog.rastreio",
        className: "android.widget.Button",
        viewText: "Rastrear Encomenda",
        source: "device_user"
      }
    });

    expect(detectRes.statusCode).toBe(200);
    const detectBody = detectRes.json();
    expect(detectBody.success).toBe(true);
    expect(detectBody.event).toBeDefined();
    expect(detectBody.event.viewText).toBe("Rastrear Encomenda");

    // 4. Consultar histórico de toques digitais via GET /devices/:id/touch-events
    const historyRes = await app.inject({
      method: "GET",
      url: "/devices/dev_test_device/touch-events"
    });

    expect(historyRes.statusCode).toBe(200);
    const history = historyRes.json();
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThanOrEqual(3);

    const detectedEvent = history.find((e: any) => e.viewText === "Rastrear Encomenda");
    expect(detectedEvent).toBeDefined();
    expect(detectedEvent.source).toBe("device_user");

    const simulatedTouch = history.find((e: any) => e.action === "tap" && e.source === "remote_simulation");
    expect(simulatedTouch).toBeDefined();
    expect(simulatedTouch.x).toBe(360);
    expect(simulatedTouch.y).toBe(640);
  });

  it("exchanges touch commands and telemetry during continuous heartbeat", async () => {
    const app = buildApp();
    const deviceId = "dev_heartbeat_touch_test";

    // Envia toque via API para enfileirar comando pendente
    await app.inject({
      method: "POST",
      url: `/devices/${deviceId}/touch`,
      payload: { x: 500, y: 900 }
    });

    // O agente envia heartbeat contendo toques detectados e recupera os comandos pendentes
    const heartbeatRes = await app.inject({
      method: "POST",
      url: `/devices/${deviceId}/heartbeat`,
      payload: {
        id: deviceId,
        name: "Test Android Device",
        model: "SM-G998B",
        battery: 88,
        touchEvents: [
          {
            action: "click",
            x: 240,
            y: 520,
            viewText: "Entrar com CPF",
            packageName: "br.com.jadlog.rastreio"
          }
        ]
      }
    });

    expect(heartbeatRes.statusCode).toBe(200);
    const hbBody = heartbeatRes.json();
    expect(hbBody.success).toBe(true);
    expect(hbBody.status).toBe("online");
    expect(Array.isArray(hbBody.pendingCommands)).toBe(true);
    expect(hbBody.pendingCommands.length).toBeGreaterThanOrEqual(1);
    expect(hbBody.pendingCommands[0].type).toBe("touch");
    expect(hbBody.pendingCommands[0].payload.x).toBe(500);
    expect(hbBody.pendingCommands[0].payload.y).toBe(900);
  });
});
