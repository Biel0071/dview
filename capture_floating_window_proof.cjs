const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\ae263ad2-5f2f-44e6-ad49-c434bcfe2bac';

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
  const tempProfile = process.env.TEMP + '\\chrome_dview_floating_' + Date.now();
  console.log('Launching headless Chrome for floating window screenshots on port 9446...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9446',
    '--disable-gpu',
    '--window-size=1680,1050',
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
        listData = await httpGet('http://127.0.0.1:9446/json/list');
        const list = JSON.parse(listData);
        if (list.length > 0 && list[0].webSocketDebuggerUrl) {
          ready = true;
          break;
        }
      } catch {}
    }
    if (!ready) throw new Error('Chrome failed to start on port 9446');

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
      const res = await sendCommand('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      return res.result ? res.result.value : null;
    }

    async function saveScreenshot(filename) {
      const res = await sendCommand('Page.captureScreenshot', { format: 'png' });
      const fullPath = path.join(artifactDir, filename);
      fs.writeFileSync(fullPath, Buffer.from(res.data, 'base64'));
      console.log(`[PRINT GERADO] ${fullPath} (${fs.statSync(fullPath).size} bytes)`);
    }

    console.log('Waiting for initial page load...');
    await sleep(2500);

    // Login by clicking the button on the login form
    console.log('Clicking ENTRAR NO SISTEMA button...');
    await evaluate(`
      (function() {
        const btn = document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('ENTRAR'));
        if (btn) btn.click();
      })()
    `);
    await sleep(3500);

    // Navigate to Controle
    console.log('Navigating to Controle...');
    await evaluate(`
      (function() {
        const items = Array.from(document.querySelectorAll('.nav-item-btn'));
        const btn = items.find(b => b.textContent && b.textContent.includes('Controle'));
        if (btn) btn.click();
      })()
    `);
    await sleep(2500);

    // Click "+ Instância Flutuante (MEmu)"
    console.log('Opening Floating Device Window...');
    await evaluate(`
      (function() {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Instância Flutuante'));
        if (btn) btn.click();
      })()
    `);
    await sleep(2000);
    await saveScreenshot('shot_instancia_flutuante_padrao.png');

    // Open Left Drawer: Pastas & Island inside Floating Window
    console.log('Opening Left Drawer (Pastas) in floating window...');
    await evaluate(`
      (function() {
        const floatingWin = document.querySelector('.floating-device-window');
        if (!floatingWin) return;
        const pastasBtn = Array.from(floatingWin.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Pastas');
        if (pastasBtn) pastasBtn.click();
      })()
    `);
    await sleep(1500);

    // Open Right Drawer: Senhas inside Floating Window
    console.log('Opening Right Drawer (Senhas) in floating window...');
    await evaluate(`
      (function() {
        const floatingWin = document.querySelector('.floating-device-window');
        if (!floatingWin) return;
        const senhasBtn = Array.from(floatingWin.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Senhas'));
        if (senhasBtn) senhasBtn.click();
      })()
    `);
    await sleep(1500);
    await saveScreenshot('shot_instancia_flutuante_sidebars_ambos.png');

    // Switch Right Drawer to Telas inside Floating Window
    console.log('Switching Right Drawer to Telas...');
    await evaluate(`
      (function() {
        const floatingWin = document.querySelector('.floating-device-window');
        if (!floatingWin) return;
        const telasBtn = Array.from(floatingWin.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Telas');
        if (telasBtn) telasBtn.click();
      })()
    `);
    await sleep(1200);
    await saveScreenshot('shot_instancia_flutuante_telas_disfarce.png');

    ws.close();
    console.log('All floating window screenshots captured successfully!');
  } finally {
    try { chrome.kill(); } catch {}
  }
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
