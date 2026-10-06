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
  const tempProfile = process.env.TEMP + '\\chrome_dview_proof_precision_' + Date.now();
  console.log('Launching headless Chrome on port 9452...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9452',
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
        listData = await httpGet('http://127.0.0.1:9452/json/list');
        const list = JSON.parse(listData);
        if (list.length > 0 && list[0].webSocketDebuggerUrl) {
          ready = true;
          break;
        }
      } catch {}
    }
    if (!ready) throw new Error('Chrome failed to start on port 9452');

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

    // 1. CLICAR EM CONTROLE NO MENU GLOBAL
    console.log('Clicking Controle in nav...');
    await evaluate(`
      (function() {
        const navBtn = Array.from(document.querySelectorAll('.nav-item-btn')).find(b => b.textContent && b.textContent.includes('Controle'));
        if (navBtn) navBtn.click();
      })()
    `);
    await sleep(2500);

    // Tirar screenshot da tela zero-flicker e toques calibrados
    console.log('Capturing ScreenView zero-flicker...');
    await captureScreenshot(path.join(artifactDir, 'shot_screen_zero_flicker_touch.png'));

    // 2. ABRIR ABA FERRAMENTAS NO SIDEBAR E CLICAR EM SPECS (DEVICEINFOVIEW)
    console.log('Switching to Ferramentas in unified sidebar...');
    await evaluate(`
      (function() {
        const tabBtn = Array.from(document.querySelectorAll('.unified-tab-btn')).find(b => b.textContent && b.textContent.includes('Ferramentas'));
        if (tabBtn) tabBtn.click();
      })()
    `);
    await sleep(1500);

    console.log('Clicking Specs / Dispositivo tool button...');
    await evaluate(`
      (function() {
        const toolBtn = Array.from(document.querySelectorAll('.control-tool-btn')).find(b => b.textContent && (b.textContent.includes('Specs') || b.textContent.includes('Dispositivo')));
        if (toolBtn) toolBtn.click();
      })()
    `);
    await sleep(2500);

    // Capturar tela de DeviceInfoView com o Card de Versão & Seed OTA
    console.log('Capturing DeviceInfoView with Seed OTA...');
    await captureScreenshot(path.join(artifactDir, 'shot_device_info_seed_ota.png'));

    // 3. ABRIR INSTÂNCIA FLUTUANTE COM DRAWER INFO
    console.log('Opening Floating Window...');
    await evaluate(`
      (function() {
        const floatBtn = Array.from(document.querySelectorAll('.ribbon-btn, button')).find(b => b.textContent && b.textContent.includes('Instância Flutuante'));
        if (floatBtn) floatBtn.click();
      })()
    `);
    await sleep(2000);

    console.log('Opening Info Drawer in Floating Window...');
    await evaluate(`
      (function() {
        const infoBtn = document.querySelector('button[title*="Informações"], button[title*="Hardware"], .memu-dock-btn');
        if (infoBtn) infoBtn.click();
      })()
    `);
    await sleep(2000);
    await captureScreenshot(path.join(artifactDir, 'shot_floating_window_seed_ota.png'));

    // 4. GERADOR APK: ABRIR E CLICAR EM GERAR APK
    console.log('Navigating to Gerador APK...');
    await evaluate(`
      (function() {
        const navBtn = Array.from(document.querySelectorAll('.nav-item-btn')).find(b => b.textContent && b.textContent.includes('Gerador APK'));
        if (navBtn) navBtn.click();
      })()
    `);
    await sleep(2500);

    console.log('Opening Gerar APK modal...');
    await evaluate(`
      (function() {
        const buildBtn = Array.from(document.querySelectorAll('.apk-btn-novo-build')).find(b => b.textContent && b.textContent.includes('GERAR APK')) || document.querySelector('.apk-btn-novo-build');
        if (buildBtn) buildBtn.click();
      })()
    `);
    await sleep(2500);

    // Rolar até a seção de Seed OTA no modal
    await evaluate(`
      (function() {
        const modalBody = document.querySelector('.apk-builder-modal-body, .modal-content, .modal-dialog, .form-tab-content') || document.querySelector('.apk-build-modal-overlay');
        if (modalBody) {
          modalBody.scrollTop = 600;
        }
        const seedCard = document.querySelector('.apk-vpn-config-card:last-of-type');
        if (seedCard) {
          seedCard.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      })()
    `);
    await sleep(1500);
    await captureScreenshot(path.join(artifactDir, 'shot_apk_builder_seed_ota.png'));

    ws.close();
    console.log('All detailed proof screenshots captured successfully!');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    try {
      chrome.kill();
    } catch {}
  }
}

run();
