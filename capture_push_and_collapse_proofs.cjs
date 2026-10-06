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
  const tempProfile = process.env.TEMP + '\\chrome_dview_proof_push_' + Date.now();
  console.log('Launching headless Chrome on port 9458...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9458',
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
        listData = await httpGet('http://127.0.0.1:9458/json/list');
        const list = JSON.parse(listData);
        if (list.length > 0 && list[0].webSocketDebuggerUrl) {
          ready = true;
          break;
        }
      } catch {}
    }
    if (!ready) throw new Error('Chrome failed to start on port 9458');

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
      const res = await sendCommand('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      return res.result?.value;
    }

    async function captureScreenshot(filePath) {
      const res = await sendCommand('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(res.data, 'base64');
      fs.writeFileSync(filePath, buffer);
      console.log(`[PRINT GERADO] ${filePath} (${buffer.length} bytes)`);
    }

    await sendCommand('Page.enable');
    await sendCommand('DOM.enable');
    await sendCommand('Runtime.enable');

    console.log('Waiting for initial page load...');
    await sleep(2500);

    // Login via API with token
    console.log('Logging in via API...');
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
        const navBtn = Array.from(document.querySelectorAll('.nav-item-btn')).find(b => b.textContent && b.textContent.includes('Controle'));
        if (navBtn) navBtn.click();
      })()
    `);
    await sleep(2500);

    // 1. Proof: Unique devices list
    console.log('Capturing proof 1: Deduplicated devices list...');
    await captureScreenshot(path.join(artifactDir, 'proof_push_notification_card_at_top_and_deduplicated_devices.png'));

    // Open Right Sidebar to Push/Telas tab
    console.log('Opening Right Sidebar via Push button...');
    await evaluate(`
      (function() {
        const pushBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Push'));
        if (pushBtn) {
          pushBtn.click();
        } else {
          const floatingTab = document.querySelector('.tactical-floating-right-tab');
          if (floatingTab) floatingTab.click();
        }
      })()
    `);
    await sleep(1500);

    // Click Pix Nubank preset to populate title and message for preview
    await evaluate(`
      (function() {
        const presetBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Pix Nubank'));
        if (presetBtn) presetBtn.click();
      })()
    `);
    await sleep(1000);

    // Capture Proof 2: Open Right Sidebar with Push Notification card at TOP, live preview, and screens below
    console.log('Capturing proof 2: Open Right Sidebar with Push Notification card at top, live preview, and screens below...');
    await captureScreenshot(path.join(artifactDir, 'proof_push_notification_live_preview_and_disguise_screens_below.png'));

    // 3. Test left sidebar collapse
    console.log('Testing left sidebar collapse...');
    await evaluate(`
      (function() {
        const collapseBtn = document.querySelector('.unified-sidebar-collapse-btn');
        if (collapseBtn) collapseBtn.click();
      })()
    `);
    await sleep(1200);

    console.log('Capturing proof 3: Left sidebar collapsed...');
    await captureScreenshot(path.join(artifactDir, 'proof_submenus_left_sidebar_collapsed.png'));

    // Expand left sidebar back
    await evaluate(`
      (function() {
        const expandBtn = document.querySelector('.sidebar-expand-toggle-btn');
        if (expandBtn) expandBtn.click();
      })()
    `);
    await sleep(1000);

    // 4. Test right sidebar minimize
    console.log('Testing right sidebar minimize...');
    await evaluate(`
      (function() {
        const minBtn = document.querySelector('.right-sidebar-minimize-btn');
        if (minBtn) minBtn.click();
      })()
    `);
    await sleep(1200);

    console.log('Capturing proof 4: Right sidebar minimized with floating tab...');
    await captureScreenshot(path.join(artifactDir, 'proof_submenus_right_sidebar_minimized_with_floating_tab.png'));

    console.log('All proofs captured successfully!');
  } finally {
    try {
      chrome.kill();
    } catch {}
  }
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
