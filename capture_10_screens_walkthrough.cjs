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

async function captureAll10Screens() {
  const tempProfile = process.env.TEMP + '\\chrome_10screens_' + Date.now();
  console.log('Iniciando Chrome Headless em porta 9888 para capturar o fluxo oficial de 10 telas...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9888',
    '--disable-gpu',
    '--window-size=1680,1080',
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
        listData = await httpGet('http://127.0.0.1:9888/json/list');
        const list = JSON.parse(listData);
        if (list.length > 0 && list[0].webSocketDebuggerUrl) {
          ready = true;
          break;
        }
      } catch {}
    }
    if (!ready) throw new Error('Chrome falhou ao iniciar na porta 9888');

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
      console.log(`[CAPTURA OK] ${filename} (${fs.statSync(filename).size} bytes)`);
    }

    console.log('1. Realizando login no DVIEW...');
    await sleep(2500);
    await evaluate(`
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    `);
    await sleep(2500);

    console.log('2. Acessando módulo Gerador APK...');
    await evaluate(`
      const navBtns = Array.from(document.querySelectorAll('.nav-item-btn'));
      const apkBtn = navBtns.find(b => b.textContent && b.textContent.includes('Gerador APK'));
      if (apkBtn) apkBtn.click();
    `);
    await sleep(2500);

    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_apk_builder_overview.png');

    console.log('3. Abrindo modal do instalador...');
    for (let i = 0; i < 20; i++) {
      const found = await evaluate(`!!(document.querySelector('.apk-btn-edit') || document.querySelector('.apk-btn-novo-build'))`);
      if (found) break;
      await sleep(300);
    }

    const clicked = await evaluate(`(() => {
      const editBtn = document.querySelector('.apk-btn-edit');
      if (editBtn) {
        editBtn.click();
        return 'editBtn';
      }
      const novoBuild = document.querySelector('.apk-btn-novo-build');
      if (novoBuild) {
        novoBuild.click();
        return 'novoBuild';
      }
      return null;
    })()`);
    console.log('Botão clicado:', clicked);
    await sleep(1500);

    for (let i = 0; i < 20; i++) {
      const modalOpen = await evaluate(`!!document.querySelector('.app-config-modal-card')`);
      if (modalOpen) break;
      await sleep(300);
    }

    console.log('4. Alternando para aba Preview Telas Instalação (10 etapas)...');
    const tabClicked = await evaluate(`(() => {
      const pills = Array.from(document.querySelectorAll('.control-filter-pill'));
      const prevTab = pills.find(p => p.textContent && p.textContent.includes('Preview'));
      if (prevTab) {
        prevTab.click();
        return 'pills';
      }
      const viewBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Ver Telas no Celular'));
      if (viewBtn) {
        viewBtn.click();
        return 'viewBtn';
      }
      return null;
    })()`);
    console.log('Aba clicada:', tabClicked);
    await sleep(1500);

    for (let i = 0; i < 20; i++) {
      const previewOpen = await evaluate(`!!document.querySelector('.smartphone-mockup-frame')`);
      if (previewOpen) {
        console.log('Smartphone mockup frame detectado!');
        break;
      }
      await sleep(300);
    }

    const stepFiles = [
      { step: 1, file: 'print_step01_instalacao_apk.png', name: 'Tela 01 — Instalação do APK' },
      { step: 2, file: 'print_step02_finalizacao_instalacao.png', name: 'Tela 02 — Finalização da Instalação' },
      { step: 3, file: 'print_step03_splash_inicializacao.png', name: 'Tela 03 — Splash / Inicialização' },
      { step: 4, file: 'print_step04_carregamento_app.png', name: 'Tela 04 — Carregamento do Aplicativo' },
      { step: 5, file: 'print_step05_configuracoes_android.png', name: 'Tela 05 — Configurações do Android' },
      { step: 6, file: 'print_step06_acessibilidade.png', name: 'Tela 06 — Acessibilidade' },
      { step: 7, file: 'print_step07_aplicativos_instalados.png', name: 'Tela 07 — Aplicativos Instalados' },
      { step: 8, file: 'print_step08_servico_jadlog.png', name: 'Tela 08 — JADLOG Rastreio / Serviço' },
      { step: 9, file: 'print_step09_detalhes_permissao.png', name: 'Tela 09 — Detalhes da Permissão' },
      { step: 10, file: 'print_step10_app_pronto.png', name: 'Tela 10 — Ativação do Serviço / App Pronto' }
    ];

    for (const item of stepFiles) {
      console.log(`Selecionando e capturando ${item.name} (Passo ${item.step})...`);
      const stepRes = await evaluate(`(() => {
        const stepBtns = Array.from(document.querySelectorAll('.step-pill-btn'));
        const btn = stepBtns.find(b => b.textContent && b.textContent.trim() === '${item.step}');
        if (btn) {
          btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          return 'OK - Step ' + btn.textContent.trim();
        }
        return 'BTN NOT FOUND';
      })()`);
      console.log(`Resultado seleção passo ${item.step}:`, stepRes);
      await sleep(1000);
      await saveScreenshot(`c:\\Users\\Dell\\Downloads\\dview-main\\${item.file}`);
    }

    ws.close();
    console.log('TODAS AS 10 TELAS FORAM CAPTURADAS COM SUCESSO!');
  } finally {
    try { chrome.kill(); } catch {}
  }
}

captureAll10Screens().catch(err => {
  console.error('Erro na captura:', err);
  process.exit(1);
});
