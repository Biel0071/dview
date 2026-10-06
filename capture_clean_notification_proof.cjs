const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const currentDir = 'c:\\Users\\Dell\\Downloads\\dview-main';
const brainDir = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\b95fc76d-2ffb-419b-acd4-ef5c4e0dd052';

if (!fs.existsSync(brainDir)) {
  fs.mkdirSync(brainDir, { recursive: true });
}

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
  const tempProfile = process.env.TEMP + '\\chrome_notif_' + Date.now();
  console.log('Launching headless Chrome on port 9445...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9445',
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
      const p1 = path.join(currentDir, filename);
      const p2 = path.join(brainDir, filename);
      fs.writeFileSync(p1, Buffer.from(res.data, 'base64'));
      fs.writeFileSync(p2, Buffer.from(res.data, 'base64'));
      console.log(`[CAPTURA SALVA] ${p1} e ${p2} (${fs.statSync(p1).size} bytes)`);
    }

    console.log('Waiting for web-panel to load...');
    await sleep(2500);

    // Login via API if login page appears
    console.log('Authenticating...');
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

    // Navigate to Gerador APK with robust polling
    console.log('Navigating to Gerador APK...');
    for (let attempt = 0; attempt < 20; attempt++) {
      const clicked = await evaluate(`
        (function() {
          const btns = Array.from(document.querySelectorAll('.nav-item-btn'));
          const btn = btns.find(b => b.textContent && b.textContent.includes('Gerador APK'));
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        })()
      `);
      if (clicked) {
        await sleep(1500);
        // Look for the "+ Gerar APK" button (case-insensitive)
        const openedModal = await evaluate(`
          (function() {
            const btns = Array.from(document.querySelectorAll('button'));
            const modalBtn = btns.find(b => b.textContent && b.textContent.toLowerCase().includes('gerar apk (download'));
            if (modalBtn) {
              modalBtn.click();
              return true;
            }
            return false;
          })()
        `);
        if (openedModal) {
          await sleep(1500);
          console.log('Gerador APK modal opened!');
          break;
        }
      }
      await sleep(1000);
    }

    // 0. Capture Form tab showing the company emoji picker/input
    console.log('Capturing Form tab with company emoji selector...');
    await saveScreenshot('proof_apk_builder_form_emoji.png');

    // Switch to Preview tab to display the phone mockup and notification drawer
    console.log('Switching to Preview Telas tab...');
    await evaluate(`
      (function() {
        const btns = Array.from(document.querySelectorAll('button'));
        const previewBtn = btns.find(b => b.textContent && b.textContent.includes('Preview Telas'));
        if (previewBtn) previewBtn.click();
      })()
    `);
    await sleep(1200);

    // 1. Capture Connected state (🟢 Conectado)
    console.log('Capturing state: Conectado (Jadlog)...');
    await evaluate(`
      (function() {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Conectado');
        if (btn) btn.click();
      })()
    `);
    await sleep(800);
    await saveScreenshot('proof_notification_jadlog_conectado.png');

    // 2. Capture Connecting state (🔵 Conectando...)
    console.log('Capturing state: Conectando...');
    await evaluate(`
      (function() {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Conectando');
        if (btn) btn.click();
      })()
    `);
    await sleep(800);
    await saveScreenshot('proof_notification_jadlog_conectando.png');

    // 3. Capture Loading state (🟡 Carregando...)
    console.log('Capturing state: Carregando...');
    await evaluate(`
      (function() {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Carregando');
        if (btn) btn.click();
      })()
    `);
    await sleep(800);
    await saveScreenshot('proof_notification_jadlog_carregando.png');

    // 4. Capture Updating state (🟡 Carregando atualização...)
    console.log('Capturing state: Atualização...');
    await evaluate(`
      (function() {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Atualização');
        if (btn) btn.click();
      })()
    `);
    await sleep(800);
    await saveScreenshot('proof_notification_jadlog_atualizacao.png');

    // 5. Switch back to Form, select Renner profile, then switch back to Preview
    console.log('Selecting Renner profile and capturing preview...');
    await evaluate(`
      (function() {
        const btns = Array.from(document.querySelectorAll('button'));
        const formBtn = btns.find(b => b.textContent && (b.textContent.includes('Parâmetros do APK') || b.textContent.includes('Parâmetros')));
        if (formBtn) formBtn.click();
      })()
    `);
    await sleep(800);

    await evaluate(`
      (function() {
        const cards = Array.from(document.querySelectorAll('.profile-card, button'));
        const rennerCard = cards.find(c => c.textContent && c.textContent.includes('Lojas Renner'));
        if (rennerCard) {
          rennerCard.click();
        } else {
          const emojiBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('🛍️'));
          if (emojiBtn) emojiBtn.click();
        }
      })()
    `);
    await sleep(1000);

    await evaluate(`
      (function() {
        const btns = Array.from(document.querySelectorAll('button'));
        const previewBtn = btns.find(b => b.textContent && b.textContent.includes('Preview Telas'));
        if (previewBtn) previewBtn.click();
      })()
    `);
    await sleep(1200);

    // Set state to Conectado on Renner
    await evaluate(`
      (function() {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Conectado');
        if (btn) btn.click();
      })()
    `);
    await sleep(800);
    await saveScreenshot('proof_notification_renner_conectado.png');

    console.log('All proof screenshots successfully generated!');
    ws.close();
  } catch (err) {
    console.error('Error during proof capture:', err);
  } finally {
    try { chrome.kill(); } catch {}
  }
}

run();
