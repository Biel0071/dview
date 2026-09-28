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

async function loginAndCaptureAll() {
  const tempProfile = process.env.TEMP + '\\chrome_dview_' + Date.now();
  console.log('Launching headless Chrome with debugging port 9444...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9444',
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
        listData = await httpGet('http://127.0.0.1:9444/json/list');
        const list = JSON.parse(listData);
        if (list.length > 0 && list[0].webSocketDebuggerUrl) {
          ready = true;
          break;
        }
      } catch {}
    }
    if (!ready) throw new Error('Chrome failed to start or list page on port 9444');

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
      console.log(`[PRINT GERADO] ${filename} (${fs.statSync(filename).size} bytes)`);
    }

    console.log('Waiting for initial page load...');
    await sleep(2500);

    // 1. Perform Login
    console.log('Performing login on DVIEW web panel...');
    await evaluate(`
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    `);
    await sleep(2500);

    // 2. Navigate to "Gerador APK"
    console.log('Navigating to Gerador APK...');
    await evaluate(`
      const links = Array.from(document.querySelectorAll('button, a, span'));
      const apkLink = links.find(el => el.textContent && el.textContent.includes('Gerador APK'));
      if (apkLink) apkLink.click();
    `);
    await sleep(2500);

    // Capture Print 1: APK Builder Settings
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_1_apk_builder_config.png');

    // Advance to step 4 (Accessibility Activation preview in smartphone mockup)
    console.log('Navigating to accessibility preview step in mockup...');
    await evaluate(`
      // Click next step button on preview phone mockup multiple times
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.textContent && b.textContent.includes('Próxima'));
      if (nextBtn) {
        nextBtn.click();
        setTimeout(() => nextBtn.click(), 400);
        setTimeout(() => nextBtn.click(), 800);
      }
    `);
    await sleep(2000);

    // Capture Print 2: Preview Mockup Installation & Activation
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_2_apk_preview_activation.png');

    // 3. Navigate to Dashboard
    console.log('Navigating to Dashboard...');
    await evaluate(`
      const links = Array.from(document.querySelectorAll('button, a, span'));
      const dashLink = links.find(el => el.textContent && el.textContent.includes('Dashboard'));
      if (dashLink) dashLink.click();
    `);
    await sleep(2500);

    // Capture Print 3: Dashboard with connected MEmu device
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_3_dashboard_connected_device.png');

    // 4. Navigate to Controle (Control Panel)
    console.log('Navigating to Controle...');
    await evaluate(`
      const links = Array.from(document.querySelectorAll('button, a, span'));
      const ctrlLink = links.find(el => el.textContent && el.textContent.includes('Controle'));
      if (ctrlLink) ctrlLink.click();
    `);
    await sleep(3000);

    // Capture Print 4: Tactical Control Center
    await saveScreenshot('c:\\Users\\Dell\\Downloads\\dview-main\\print_4_control_panel_phone_view.png');

    ws.close();
    console.log('ALL PRINTS CAPTURED SUCCESSFULLY!');
  } finally {
    try { chrome.kill(); } catch {}
  }
}

loginAndCaptureAll().catch(err => {
  console.error('Fatal error capturing all screenshots:', err);
  process.exit(1);
});
