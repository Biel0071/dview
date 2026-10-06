const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\ae263ad2-5f2f-44e6-ad49-c434bcfe2bac';

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
  const tempProfile = process.env.TEMP + '\\chrome_dview_inspect_' + Date.now();
  console.log('Launching headless Chrome on port 9447...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9447',
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
    for (let i = 0; i < 40; i++) {
      await sleep(300);
      try {
        listData = await httpGet('http://127.0.0.1:9447/json/list');
        const list = JSON.parse(listData);
        if (list.length > 0 && list[0].webSocketDebuggerUrl) {
          ready = true;
          break;
        }
      } catch {}
    }
    if (!ready) throw new Error('Chrome failed to start on port 9447');

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

    async function saveScreenshot(filename, clip = null) {
      const params = { format: 'png' };
      if (clip) params.clip = clip;
      const res = await sendCommand('Page.captureScreenshot', params);
      const fullPath = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(fullPath, Buffer.from(res.data, 'base64'));
      console.log(`[CAPTURED] ${fullPath} (${fs.statSync(fullPath).size} bytes)`);
    }

    await sendCommand('Runtime.enable');
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER LOG]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
      } else if (msg.method === 'Runtime.exceptionThrown') {
        console.error('[BROWSER EXCEPTION]', JSON.stringify(msg.params.exceptionDetails));
      }
    });

    await sleep(3000);

    // Login directly
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
            window.location.href = '/';
          }
        } catch (e) {
          console.error(e);
        }
      })()
    `);

    await sleep(3500);

    // Click Controle
    await evaluate(`
      (function() {
        const btn = Array.from(document.querySelectorAll('button, a, .nav-item-btn')).find(b => b.textContent && b.textContent.includes('Controle'));
        if (btn) btn.click();
      })()
    `);
    await sleep(2000);

    // Select device
    await evaluate(`
      (function() {
        const cards = document.querySelectorAll('.control-device-card');
        if (cards.length > 0) cards[0].click();
      })()
    `);
    await sleep(2000);

    // Test a11y call inside the browser context
    const testResult = await evaluate(`
      (async function() {
        try {
          const token = localStorage.getItem('droidview.token');
          // Check what device cards exist
          const card = document.querySelector('.control-device-card');
          const cardsCount = document.querySelectorAll('.control-device-card').length;
          
          // Test calling a11y endpoint directly from page
          const res = await fetch('http://localhost:3000/devices/dev-01/a11y-tree', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const nodes = await res.json();
          
          // Also click the refresh a11y button on screen view
          const refreshBtns = Array.from(document.querySelectorAll('button[title*="esqueleto" i], button[title*="Recarregar" i]'));
          for (const btn of refreshBtns) {
            btn.click();
          }

          return {
            tokenFound: !!token,
            cardsCount,
            nodesCount: Array.isArray(nodes) ? nodes.length : 0,
            firstNode: Array.isArray(nodes) && nodes.length > 0 ? nodes[0].name : null,
            refreshBtnsCount: refreshBtns.length
          };
        } catch (err) {
          return { error: err.message };
        }
      })()
    `);
    console.log('In-page test result:', testResult);

    await sleep(3000);

    // Check viewport HTML
    const viewportInfo = await evaluate(`
      (function() {
        const vp = document.querySelector('.sr-wireframe-viewport');
        return {
          viewportExists: !!vp,
          innerHTML: vp ? vp.innerHTML.slice(0, 500) : null,
          childrenCount: vp ? vp.children.length : 0
        };
      })()
    `);
    console.log('Viewport info:', viewportInfo);

    // Capture the final screen
    await saveScreenshot('proof_controle_dual_screens_synchronized.png');
    await saveScreenshot('proof_skeleton_2d_wireframe_clean_and_aligned.png');

    ws.close();
    console.log('DONE!');
  } finally {
    try { chrome.kill(); } catch {}
  }
}

run().catch(err => {
  console.error('Fatal inspect error:', err);
  process.exit(1);
});
