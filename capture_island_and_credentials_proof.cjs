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
  const tempProfile = process.env.TEMP + '\\chrome_dview_proof_' + Date.now();
  console.log('Launching headless Chrome for proof screenshots on port 9445...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9445',
    '--disable-gpu',
    '--window-size=1600,1000',
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
        listData = await httpGet('http://127.0.0.1:9445/json/list');
        const list = JSON.parse(listData);
        if (list.length > 0 && list[0].webSocketDebuggerUrl) {
          ready = true;
          break;
        }
      } catch {}
    }
    if (!ready) throw new Error('Chrome failed to start on port 9445');

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

    // Login
    console.log('Logging in...');
    await evaluate(`
      (async () => {
        try {
          const res = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@dview.local', password: 'admin123', totp: '123456' })
          });
          const data = await res.json();
          if (data && data.token) {
            localStorage.setItem('droidview.token', data.token);
            localStorage.setItem('dview.user', JSON.stringify(data.user));
            window.location.reload();
          }
        } catch (e) {
          console.error(e);
        }
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

    // Click on Ferramentas tab in UnifiedControlSidebar
    console.log('Switching to Ferramentas tab in sidebar...');
    await evaluate(`
      (function() {
        const tabs = Array.from(document.querySelectorAll('.unified-tab-btn'));
        const ferramentasTab = tabs.find(t => t.textContent && t.textContent.includes('Ferramentas'));
        if (ferramentasTab) ferramentasTab.click();
      })()
    `);
    await sleep(1500);
    await saveScreenshot('shot_controle_island_folders.png');

    // Click on an app inside the Island folder to test auto-mirror
    console.log('Clicking an app in the Island folder to trigger auto-mirror...');
    await evaluate(`
      (function() {
        const appBtns = Array.from(document.querySelectorAll('.control-real-app-row-btn'));
        // Find an app in the Island folder (not DVIEW)
        const islandApp = appBtns.find(b => !b.textContent.includes('DVIEW') && !b.textContent.includes('RAIZ'));
        if (islandApp) islandApp.click();
      })()
    `);
    await sleep(2000);
    await saveScreenshot('shot_controle_island_auto_mirror_active.png');

    // Open right drawer (SENHAS)
    console.log('Opening right drawer and switching to SENHAS...');
    await evaluate(`
      (function() {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('TECLAS') || b.textContent.includes('TELAS') || b.textContent.includes('SENHAS')));
        if (btn) btn.click();
      })()
    `);
    await sleep(1000);
    await evaluate(`
      (function() {
        const tab = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('SENHAS'));
        if (tab) tab.click();
      })()
    `);
    await sleep(1000);

    // 1. Click "Usar Digital" to use and record fingerprint
    console.log('Clicking Usar Digital to use and record fingerprint...');
    await evaluate(`
      (function() {
        const digBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Usar Digital'));
        if (digBtn) digBtn.click();
      })()
    `);
    await sleep(1500);

    // 2. Switch to PIN mode and use + record PIN
    console.log('Recording and using a test PIN...');
    await evaluate(`
      (async function() {
        const pinModeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'PIN');
        if (pinModeBtn) pinModeBtn.click();
        
        await new Promise(r => setTimeout(r, 400));
        
        const pinInput = document.querySelector('input[placeholder*="PIN"]');
        if (pinInput) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(pinInput, '4826');
          pinInput.dispatchEvent(new Event('input', { bubbles: true }));
          pinInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        await new Promise(r => setTimeout(r, 400));

        const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Digitar & Gravar'));
        if (submitBtn) submitBtn.click();
      })()
    `);
    await sleep(2500);
    await saveScreenshot('shot_controle_credential_recorded.png');

    ws.close();
    console.log('Proof screenshots completed successfully!');
  } finally {
    try { chrome.kill(); } catch {}
  }
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
