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
  const tempProfile = process.env.TEMP + '\\chrome_zoom_' + Date.now();
  console.log('Iniciando Chrome para captura focada...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9448',
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
        listData = await httpGet('http://127.0.0.1:9448/json/list');
        const list = JSON.parse(listData);
        if (list.length > 0 && list[0].webSocketDebuggerUrl) {
          ready = true;
          break;
        }
      } catch {}
    }
    if (!ready) throw new Error('Chrome falhou ao iniciar na porta 9448');

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
      const p1 = path.join(currentDir, filename);
      const p2 = path.join(brainDir, filename);
      fs.writeFileSync(p1, Buffer.from(res.data, 'base64'));
      fs.writeFileSync(p2, Buffer.from(res.data, 'base64'));
      console.log(`[CAPTURA SALVA] ${filename} (${fs.statSync(p1).size} bytes)`);
    }

    console.log('Aguardando carregamento da interface...');
    await sleep(2500);

    // Login
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

    // Navegar para Gerador APK
    console.log('Navegando para Gerador APK...');
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
          break;
        }
      }
      await sleep(1000);
    }

    // Mudar para Preview Telas
    await evaluate(`
      (function() {
        const btns = Array.from(document.querySelectorAll('button'));
        const previewBtn = btns.find(b => b.textContent && b.textContent.includes('Preview Telas'));
        if (previewBtn) previewBtn.click();
      })()
    `);
    await sleep(1500);

    // Obter bounding box do mockup de smartphone e da notificação
    const phoneBox = await evaluate(`
      (function() {
        // Encontra o container com formato de smartphone
        const frames = Array.from(document.querySelectorAll('div')).filter(el => {
          const style = window.getComputedStyle(el);
          return style.borderRadius && parseInt(style.borderRadius) >= 20 && el.offsetHeight > 400 && el.offsetWidth > 200 && el.offsetWidth < 450;
        });
        if (frames.length > 0) {
          const rect = frames[0].getBoundingClientRect();
          return { x: rect.x - 10, y: rect.y - 10, width: rect.width + 20, height: rect.height + 20, scale: 1 };
        }
        return null;
      })()
    `);

    console.log('Phone bounding box detectado:', phoneBox);

    // 1. Zoom focado no Mockup com Jadlog (Carregando 🟡)
    await evaluate(`
      (function() {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Carregando');
        if (btn) btn.click();
      })()
    `);
    await sleep(800);
    await saveScreenshot('print_zoom_jadlog_carregando.png', phoneBox);

    // 2. Zoom focado no Mockup com Jadlog (Conectando 🔵)
    await evaluate(`
      (function() {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Conectando');
        if (btn) btn.click();
      })()
    `);
    await sleep(800);
    await saveScreenshot('print_zoom_jadlog_conectando.png', phoneBox);

    // 3. Zoom focado no Mockup com Jadlog (Conectado 🟢)
    await evaluate(`
      (function() {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Conectado');
        if (btn) btn.click();
      })()
    `);
    await sleep(800);
    await saveScreenshot('print_zoom_jadlog_conectado.png', phoneBox);

    // 4. Zoom focado no Mockup com Jadlog (Atualização 🟡)
    await evaluate(`
      (function() {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Atualização');
        if (btn) btn.click();
      })()
    `);
    await sleep(800);
    await saveScreenshot('print_zoom_jadlog_atualizacao.png', phoneBox);

    // 5. Trocar para Renner e capturar zoom com Renner Conectado
    await evaluate(`
      (function() {
        const btns = Array.from(document.querySelectorAll('button'));
        const formBtn = btns.find(b => b.textContent && b.textContent.includes('Parâmetros'));
        if (formBtn) formBtn.click();
      })()
    `);
    await sleep(1000);

    await evaluate(`
      (function() {
        const cards = Array.from(document.querySelectorAll('.profile-card, button'));
        const rennerCard = cards.find(c => c.textContent && c.textContent.includes('Lojas Renner'));
        if (rennerCard) rennerCard.click();
      })()
    `);
    await sleep(1000);

    // Volta para Preview
    await evaluate(`
      (function() {
        const btns = Array.from(document.querySelectorAll('button'));
        const previewBtn = btns.find(b => b.textContent && b.textContent.includes('Preview Telas'));
        if (previewBtn) previewBtn.click();
      })()
    `);
    await sleep(1500);

    await evaluate(`
      (function() {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'Conectado');
        if (btn) btn.click();
      })()
    `);
    await sleep(800);
    await saveScreenshot('print_zoom_renner_conectado.png', phoneBox);

    // 6. Captura de tela inteira com o modal aberto e Renner selecionado
    await saveScreenshot('print_modal_completo_renner.png');

    console.log('Todas as capturas focadas concluídas com sucesso!');
  } finally {
    try {
      chrome.kill();
    } catch {}
  }
}

run().catch(err => {
  console.error('Erro na execução:', err);
  process.exit(1);
});
