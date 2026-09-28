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

async function run() {
  const tempProfile = process.env.TEMP + '\\chrome_walkthrough_' + Date.now();
  console.log('Iniciando Chrome Headless na porta 9666...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9666',
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
        listData = await httpGet('http://127.0.0.1:9666/json/list');
        const list = JSON.parse(listData);
        if (list.length > 0 && list[0].webSocketDebuggerUrl) {
          ready = true;
          break;
        }
      } catch {}
    }
    if (!ready) throw new Error('Chrome falhou ao iniciar na porta 9666');

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

    async function saveScreenshot(filename) {
      const res = await sendCommand('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(filename, Buffer.from(res.data, 'base64'));
      console.log(`[PRINT SALVO] ${filename} (${fs.statSync(filename).size} bytes)`);
    }

    await sleep(2500);

    // 1. Login
    console.log('Realizando login no sistema...');
    await evaluate(`document.querySelector('button[type="submit"]')?.click()`);
    await sleep(2500);

    // 2. Navegar para Gerador APK
    console.log('Navegando para Gerador APK...');
    await evaluate(`
      const navBtns = Array.from(document.querySelectorAll('.nav-item-btn'));
      const apkBtn = navBtns.find(b => b.textContent && b.textContent.includes('Gerador APK'));
      if (apkBtn) apkBtn.click();
    `);
    await sleep(2500);

    // Print 1: Tabela de builds
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_01_apk_builder.png');

    // 3. Abrir Modal de Edição de APK
    console.log('Abrindo modal de parâmetros do APK...');
    await evaluate(`
      const editBtn = document.querySelector('.apk-btn-edit') || document.querySelector('.apk-btn-novo-build');
      if (editBtn) editBtn.click();
    `);
    await sleep(2000);

    // Print 2: Modal de Parâmetros com VPN e Acessibilidade
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_02_apk_form_vpn_accessibility.png');

    // 4. Mudar para Aba Preview no Smartphone
    console.log('Mudando para aba Preview no Smartphone...');
    await evaluate(`
      const pills = Array.from(document.querySelectorAll('.control-filter-pill'));
      const prevPill = pills.find(p => p.textContent && p.textContent.includes('Preview'));
      if (prevPill) prevPill.click();
    `);
    await sleep(2000);

    // Helper para selecionar etapa no carrossel
    async function selectStep(num) {
      await evaluate(`
        const stepBtns = Array.from(document.querySelectorAll('.step-pill-btn'));
        const btn = stepBtns.find(b => b.textContent && b.textContent.trim() === '${num}');
        if (btn) btn.click();
      `);
      await sleep(1500);
    }

    // Print 3: Passo 1 - Download no Navegador
    console.log('Capturando Passo 1: Download no Navegador...');
    await selectStep(1);
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_03_preview_passo1_download.png');

    // Print 4: Passo 2 - Instalador de Pacotes
    console.log('Capturando Passo 2: Instalador de Pacotes...');
    await selectStep(2);
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_04_preview_passo2_instalador.png');

    // Print 5: Passo 4 - Ativação do Serviço de Acessibilidade
    console.log('Capturando Passo 4: Ativação de Acessibilidade...');
    await selectStep(4);
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_05_preview_passo4_acessibilidade.png');

    // Print 6: Passo 5 - Conexão VPN & Túnel Seguro com o Servidor
    console.log('Capturando Passo 5: Conexão VPN & Túnel...');
    await selectStep(5);
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_06_preview_passo5_vpn.png');

    // Print 7: Passo 6 - Transmissão de Tela em Tempo Real
    console.log('Capturando Passo 6: Transmissão de Tela...');
    await selectStep(6);
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_07_preview_passo6_transmissao_tela.png');

    // Print 8: Passo 8 - URL Destino em WebView
    console.log('Capturando Passo 8: URL Destino em WebView...');
    await selectStep(8);
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_08_preview_passo8_webview_destino.png');

    // Fechar modal
    console.log('Fechando modal de build...');
    await evaluate(`document.querySelector('.modal-close-btn')?.click()`);
    await sleep(1500);

    // 5. Navegar para Dashboard
    console.log('Navegando para o Dashboard...');
    await evaluate(`
      const navBtns = Array.from(document.querySelectorAll('.nav-item-btn'));
      const dashBtn = navBtns.find(b => b.textContent && b.textContent.includes('Dashboard'));
      if (dashBtn) dashBtn.click();
    `);
    await sleep(2500);

    // Print 11: Dashboard com celular online
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_11_dashboard_celular_online.png');

    // 6. Navegar para Controle
    console.log('Navegando para o Centro de Controle Tático...');
    await evaluate(`
      const navBtns = Array.from(document.querySelectorAll('.nav-item-btn'));
      const ctrlBtn = navBtns.find(b => b.textContent && b.textContent.includes('Controle'));
      if (ctrlBtn) ctrlBtn.click();
    `);
    await sleep(3500);

    // Selecionar o aparelho na lista
    await evaluate(`
      const devCard = document.querySelector('.control-device-item');
      if (devCard) devCard.click();
    `);
    await sleep(2000);

    // Print 12: Centro de Controle Tático
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_12_controle_tela_tempo_real.png');

    ws.close();
    console.log('FLUXO COMPLETO DE CAPTURAS FINALIZADO COM SUCESSO!');
  } finally {
    try { chrome.kill(); } catch {}
  }
}

run().catch(err => {
  console.error('Falha geral:', err);
  process.exit(1);
});
