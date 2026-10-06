const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const currentDir = 'c:\\Users\\Dell\\Downloads\\dview-main';
const brainDir = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\ae263ad2-5f2f-44e6-ad49-c434bcfe2bac';

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
  const tempProfile = process.env.TEMP + '\\chrome_apk_mdm_clean_' + Date.now();
  console.log('Launching headless Chrome with --disable-extensions on port 9455...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9455',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-plugins',
    '--window-size=1650,1100',
    `--user-data-dir=${tempProfile}`,
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:5000/apk-builder'
  ]);

  try {
    let ready = false;
    let listData = '';
    for (let i = 0; i < 30; i++) {
      await sleep(300);
      try {
        listData = await httpGet('http://127.0.0.1:9455/json/list');
        const list = JSON.parse(listData);
        if (list.length > 0 && list.some(p => p.webSocketDebuggerUrl)) {
          ready = true;
          break;
        }
      } catch {}
    }
    if (!ready) throw new Error('Chrome failed to start on port 9455');

    const pages = JSON.parse(listData);
    const targetPage = pages.find(p => p.url && p.url.includes('localhost:5000')) ||
                       pages.find(p => p.type === 'page' && !p.url.startsWith('chrome')) ||
                       pages[0];
    const wsUrl = targetPage.webSocketDebuggerUrl;
    console.log('Connected to page target:', targetPage.url);

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
      const p1 = path.join(currentDir, filename);
      const p2 = path.join(brainDir, filename);
      fs.writeFileSync(p1, Buffer.from(res.data, 'base64'));
      fs.writeFileSync(p2, Buffer.from(res.data, 'base64'));
      console.log(`[CAPTURA SALVA] ${filename} (${fs.statSync(p1).size} bytes)`);
    }

    await sendCommand('Runtime.enable');
    await sendCommand('Page.enable');

    console.log('Authenticating in page...');
    await evaluate(`
      (async () => {
        const res = await fetch('http://localhost:3000/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@dview.local', password: 'admin123', totp: '123456' })
        });
        const data = await res.json();
        localStorage.setItem('droidview.token', data.token);
        localStorage.setItem('dview.user', JSON.stringify(data.user));
        window.location.href = '/apk-builder';
      })()
    `);
    await sleep(3000);

    // Save proof of the main ApkBuilder page
    await saveScreenshot('proof_1_apk_builder_gerador_funcional.png');

    // Click the QR Code button on the first build row
    console.log('Clicking QR Code button on saved build row...');
    const clickedQr = await evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const qrBtn = btns.find(b => b.textContent && b.textContent.trim() === 'QR Code');
        if (qrBtn) {
          qrBtn.click();
          return true;
        }
        return false;
      })()
    `);
    console.log('Clicked QR Code button:', clickedQr);
    await sleep(1500);

    // Ensure Zero-Touch mode is active
    await evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const ztBtn = btns.find(b => b.textContent && b.textContent.includes('Zero-Touch'));
        if (ztBtn) ztBtn.click();
      })()
    `);
    await sleep(1000);

    // Save proof of the Zero-Touch MDM QR Code Modal
    await saveScreenshot('proof_2_mdm_qr_code_zero_touch_modal.png');

    // Click to expand the Encrypted Payload Terminal Inspector
    console.log('Expanding Encrypted JSON MDM Inspector...');
    await evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const expBtn = btns.find(b => b.textContent && (b.textContent.includes('Inspecionar Payload') || b.textContent.includes('JSON MDM')));
        if (expBtn) expBtn.click();
      })()
    `);
    await sleep(1000);

    // Save proof of Expanded Encrypted MDM Payload Inspector
    await saveScreenshot('proof_3_mdm_encrypted_json_payload_inspector.png');

    // Switch to Tab 2: "2. APK Direto & Emulador"
    console.log('Switching to APK Direto & Emulador tab...');
    await evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const apkTab = btns.find(b => b.textContent && b.textContent.includes('2. APK Direto & Emulador'));
        if (apkTab) apkTab.click();
      })()
    `);
    await sleep(1000);

    // Save proof of APK Download and ADB command view
    await saveScreenshot('proof_4_apk_download_e_emulador_funcional.png');

    console.log('All 4 proofs captured successfully with high fidelity!');
    ws.close();
  } finally {
    try { chrome.kill('SIGKILL'); } catch {}
    try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch {}
  }
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
