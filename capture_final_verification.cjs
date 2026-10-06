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
  const tempProfile = process.env.TEMP + '\\chrome_dview_diag_' + Date.now();
  console.log('Launching headless Chrome on port 9446...');
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
    for (let i = 0; i < 40; i++) {
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

    async function saveScreenshot(filename, clip = null) {
      const params = { format: 'png' };
      if (clip) {
        params.clip = clip;
      }
      const res = await sendCommand('Page.captureScreenshot', params);
      const fullPath = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(fullPath, Buffer.from(res.data, 'base64'));
      console.log(`[CAPTURED] ${fullPath} (${fs.statSync(fullPath).size} bytes)`);
    }

    // Enable console & runtime exception monitoring
    await sendCommand('Runtime.enable');
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
      } else if (msg.method === 'Runtime.exceptionThrown') {
        console.error('[BROWSER ERROR]', JSON.stringify(msg.params.exceptionDetails));
      }
    });

    console.log('Waiting for initial page load...');
    await sleep(4000);

    const initialInfo = await evaluate(`({
      url: location.href,
      title: document.title,
      bodyText: document.body.innerText.slice(0, 300),
      buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText)
    })`);
    console.log('Initial page info:', initialInfo);

    // If on login page, fill form and click submit
    if (initialInfo && initialInfo.bodyText.includes('Login') || initialInfo.bodyText.includes('Entrar') || initialInfo.bodyText.includes('ACESSO')) {
      console.log('Filling login form...');
      await evaluate(`
        (function() {
          const emailInput = document.querySelector('input[type="email"], input[name="email"], input[placeholder*="email" i]');
          if (emailInput) {
            emailInput.value = 'admin@dview.local';
            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          const passInput = document.querySelector('input[type="password"]');
          if (passInput) {
            passInput.value = 'admin123';
            passInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          const totpInput = document.querySelector('input[name="totp"], input[placeholder*="totp" i], input[placeholder*="código" i]');
          if (totpInput) {
            totpInput.value = '123456';
            totpInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('Entrar') || b.textContent.includes('Acessar')));
          if (submitBtn) submitBtn.click();
        })()
      `);
      await sleep(3000);
    } else {
      // Direct token injection
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
      await sleep(4000);
    }

    const afterLogin = await evaluate(`({
      url: location.href,
      navItems: Array.from(document.querySelectorAll('.nav-item-btn, .sidebar-nav-item, button')).map(b => b.innerText.trim()).filter(Boolean)
    })`);
    console.log('After login info:', afterLogin);

    // Click on Controle
    console.log('Clicking Controle...');
    await evaluate(`
      (function() {
        const btn = Array.from(document.querySelectorAll('button, a, .nav-item-btn')).find(b => b.textContent && b.textContent.includes('Controle'));
        if (btn) btn.click();
      })()
    `);
    await sleep(3000);

    // Select the device
    console.log('Selecting device...');
    await evaluate(`
      (function() {
        const cards = document.querySelectorAll('.control-device-card');
        if (cards.length > 0) {
          cards[0].click();
        }
      })()
    `);
    await sleep(3000);

    const controlState = await evaluate(`({
      hasTacticalBar: !!document.querySelector('.tactical-top-controls-bar'),
      tacticalBarText: document.querySelector('.tactical-top-controls-bar') ? document.querySelector('.tactical-top-controls-bar').innerText : null,
      deviceCardsCount: document.querySelectorAll('.control-device-card').length,
      screenColumnsCount: document.querySelectorAll('.tactical-screen-column').length,
      a11yNodesCount: document.querySelectorAll('.sr-wireframe-node').length
    })`);
    console.log('Control state:', controlState);

    // Full screen capture
    await saveScreenshot('proof_controle_dual_screens_synchronized.png');

    // Focused capture of top bar
    const barBox = await evaluate(`
      (function() {
        const bar = document.querySelector('.tactical-top-controls-bar');
        if (!bar) return null;
        const r = bar.getBoundingClientRect();
        return { x: r.left, y: r.top, width: r.width, height: r.height };
      })()
    `);
    if (barBox) {
      await saveScreenshot('proof_top_menu_volume_line_and_quick_actions.png', {
        x: Math.max(0, barBox.x - 5),
        y: Math.max(0, barBox.y - 5),
        width: barBox.width + 10,
        height: barBox.height + 10,
        scale: 1
      });
    }

    // Focused capture of the dual phone screens
    const screensBox = await evaluate(`
      (function() {
        const s = document.querySelector('.tactical-screen-viewport') || document.querySelector('.tactical-multi-screen-grid');
        if (!s) return null;
        const r = s.getBoundingClientRect();
        return { x: r.left, y: r.top, width: r.width, height: r.height };
      })()
    `);
    if (screensBox) {
      await saveScreenshot('proof_dual_phones_centered_view.png', {
        x: Math.max(0, screensBox.x - 5),
        y: Math.max(0, screensBox.y - 5),
        width: screensBox.width + 10,
        height: screensBox.height + 10,
        scale: 1
      });
    }

    ws.close();
    console.log('DONE!');
  } finally {
    try { chrome.kill(); } catch {}
  }
}

run().catch(err => {
  console.error('Fatal diag error:', err);
  process.exit(1);
});
