const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\ae263ad2-5f2f-44e6-ad49-c434bcfe2bac';
const LOCAL_DIR = 'C:\\Users\\Dell\\Downloads\\dview-main';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const tempProfile = process.env.TEMP + '\\chrome_full_' + Date.now();
  console.log('Iniciando Chrome Headless...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9777',
    '--disable-gpu',
    '--window-size=1600,1050',
    `--user-data-dir=${tempProfile}`,
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:5000/'
  ]);

  try {
    let ready = false;
    let listData = '';
    for (let i = 0; i < 30; i++) {
      await sleep(300);
      try {
        listData = await httpGet('http://127.0.0.1:9777/json/list');
        const list = JSON.parse(listData);
        if (list.length > 0 && list[0].webSocketDebuggerUrl) {
          ready = true;
          break;
        }
      } catch {}
    }
    if (!ready) throw new Error('Chrome falhou ao iniciar');

    const pages = JSON.parse(listData);
    const targetPage = pages.find(p => p.type === 'page') || pages[0];
    const ws = new globalThis.WebSocket(targetPage.webSocketDebuggerUrl);

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    function sendCommand(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const handler = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.id === id) {
            ws.removeEventListener('message', handler);
            if (msg.result) resolve(msg.result);
            else reject(new Error(JSON.stringify(msg.error)));
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evaluate(expression) {
      const res = await sendCommand('Runtime.evaluate', { expression, returnByValue: true });
      return res.result ? res.result.value : null;
    }

    async function saveScreenshot(baseName) {
      const res = await sendCommand('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(res.data, 'base64');
      const artifactPath = path.join(ARTIFACT_DIR, baseName);
      const localPath = path.join(LOCAL_DIR, baseName);
      fs.writeFileSync(artifactPath, buffer);
      fs.writeFileSync(localPath, buffer);
      console.log(`[PRINT SALVO] ${baseName} (${buffer.length} bytes)`);
    }

    await sleep(2500);

    // 1. Realizar Login
    console.log('1. Realizando login...');
    await evaluate(`document.querySelector('button[type="submit"]')?.click()`);
    await sleep(2500);

    // 2. Navegar para Gerador APK
    console.log('2. Navegando para Gerador APK...');
    await evaluate(`window.useAppStore?.getState().setView('Gerador APK')`);
    await sleep(2000);
    await saveScreenshot('print_01_apk_builder.png');

    // 3. Abrir Modal de Edição de APK
    console.log('3. Abrindo modal de edição de APK...');
    await evaluate(`
      const editBtn = document.querySelector('.apk-btn-edit') || document.querySelector('.apk-btn-novo-build');
      if (editBtn) editBtn.click();
    `);
    await sleep(2000);
    await saveScreenshot('print_02_apk_builder_modal_form.png');

    // 4. Alternar para a aba Preview de Telas no Smartphone
    console.log('4. Alternando para Preview no Smartphone...');
    await evaluate(`
      const pills = Array.from(document.querySelectorAll('.control-filter-pill'));
      const prevPill = pills.find(p => p.textContent && p.textContent.includes('Preview'));
      if (prevPill) prevPill.click();
    `);
    await sleep(1500);

    async function selectPreviewStep(stepNum) {
      await evaluate(`
        const stepBtns = Array.from(document.querySelectorAll('.step-pill-btn'));
        const btn = stepBtns.find(b => b.textContent && b.textContent.trim() === '${stepNum}');
        if (btn) btn.click();
      `);
      await sleep(1200);
    }

    // Step 1: Download
    console.log('Capturando Etapa 1: Download...');
    await selectPreviewStep(1);
    await saveScreenshot('print_03_preview_passo1_download.png');

    // Step 2: Instalador de Pacotes
    console.log('Capturando Etapa 2: Instalador de Pacotes...');
    await selectPreviewStep(2);
    await saveScreenshot('print_04_preview_passo2_instalador.png');

    // Step 3: App Instalado
    console.log('Capturando Etapa 3: App Instalado...');
    await selectPreviewStep(3);
    await saveScreenshot('print_05_preview_passo3_app_instalado.png');

    // Step 4: Acessibilidade
    console.log('Capturando Etapa 4: Ativação de Acessibilidade...');
    await selectPreviewStep(4);
    await saveScreenshot('print_06_preview_passo4_acessibilidade.png');

    // Step 5: Conexão VPN
    console.log('Capturando Etapa 5: Conexão VPN...');
    await selectPreviewStep(5);
    await saveScreenshot('print_07_preview_passo5_vpn_tunnel.png');

    // Step 6: Transmissão de Tela
    console.log('Capturando Etapa 6: Transmissão de Tela...');
    await selectPreviewStep(6);
    await saveScreenshot('print_08_preview_passo6_transmissao_tela.png');

    // Step 7: Device Admin
    console.log('Capturando Etapa 7: Device Admin...');
    await selectPreviewStep(7);
    await saveScreenshot('print_09_preview_passo7_device_admin.png');

    // Step 8: WebView Destino
    console.log('Capturando Etapa 8: WebView Destino...');
    await selectPreviewStep(8);
    await saveScreenshot('print_10_preview_passo8_webview_destino.png');

    // Fechar Modal
    console.log('Fechando modal de build...');
    await evaluate(`document.querySelector('.modal-close-btn')?.click()`);
    await sleep(1500);

    // 5. Ir para Dashboard
    console.log('5. Acessando Dashboard com celular online...');
    await evaluate(`window.useAppStore?.getState().setView('Dashboard')`);
    await sleep(2500);
    await saveScreenshot('print_13_dashboard_celular_online.png');

    // 6. Ir para Centro de Controle Tático
    console.log('6. Acessando Centro de Controle Tático...');
    await evaluate(`window.useAppStore?.getState().setView('Controle')`);
    await sleep(3000);

    // Selecionar o aparelho
    await evaluate(`
      const devCard = document.querySelector('.control-device-item');
      if (devCard) devCard.click();
    `);
    await sleep(2000);
    await saveScreenshot('print_14_controle_tela_tempo_real.png');

    ws.close();
    console.log('TODOS OS 12 PRINTS DO FRONT-END FORAM GERADOS COM SUCESSO!');
  } finally {
    try { chrome.kill(); } catch {}
  }
}

run().catch(err => {
  console.error('Erro na execução:', err);
  process.exit(1);
});
