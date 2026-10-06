const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function test() {
  const tempProfile = process.env.TEMP + '\\chrome_diag_' + Date.now();
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9451',
    '--disable-gpu',
    '--window-size=1650,1100',
    `--user-data-dir=${tempProfile}`,
    'http://localhost:5000/'
  ]);

  await new Promise(r => setTimeout(r, 2000));
  const res = await new Promise(r => http.get('http://127.0.0.1:9451/json/list', res => {
    let d = ''; res.on('data', c => d += c); res.on('end', () => r(JSON.parse(d)));
  }));
  const ws = new globalThis.WebSocket(res[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (method, params = {}) => new Promise(r => {
    const curId = id++;
    const handler = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === curId) { ws.removeEventListener('message', handler); r(msg.result); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('CONSOLE:', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('EXCEPTION:', JSON.stringify(msg.params.exceptionDetails));
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');

  // Authenticate
  await send('Runtime.evaluate', {
    expression: `
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
    `,
    awaitPromise: true
  });

  await new Promise(r => setTimeout(r, 2500));

  const urlRes = await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true });
  console.log('URL:', urlRes.result.value);

  // Now click QR Code button
  console.log('Clicking QR Code button...');
  const clickRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const qrBtn = btns.find(b => b.textContent && b.textContent.trim() === 'QR Code');
        if (!qrBtn) return 'not found';
        qrBtn.click();
        return 'clicked';
      })()
    `,
    returnByValue: true
  });
  console.log('Click result:', clickRes.result.value);

  await new Promise(r => setTimeout(r, 1200));

  const modalCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.querySelector('.app-config-modal-backdrop');
        const card = document.querySelector('.app-config-modal-card');
        const qrSvg = document.querySelector('svg.qr-code-svg, .qr-container svg, svg[viewBox=\"0 0 256 256\"]');
        return {
          hasBackdrop: Boolean(modal),
          hasCard: Boolean(card),
          hasQrSvg: Boolean(qrSvg),
          cardTextSnippet: card ? card.innerText.slice(0, 300) : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Modal check:', modalCheck.result.value);

  // Take screenshot
  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('proof_diagnose.png', Buffer.from(ss.data, 'base64'));
  console.log('Saved proof_diagnose.png, size:', fs.statSync('proof_diagnose.png').size);

  ws.close();
  chrome.kill();
  try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch {}
}
test().catch(console.error);
