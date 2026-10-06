const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function test() {
  const tempProfile = process.env.TEMP + '\\chrome_trace_' + Date.now();
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9457',
    '--disable-gpu',
    '--disable-extensions',
    `--user-data-dir=${tempProfile}`,
    'http://localhost:5000/'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const res = await new Promise(r => http.get('http://127.0.0.1:9457/json/list', res => {
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
    if (e.data.includes('Runtime.exceptionThrown')) {
      console.error('EXCEPTION:', e.data);
    }
  });

  await send('Runtime.enable');

  async function waitForSelector(selector, timeout = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const r = await send('Runtime.evaluate', {
        expression: `Boolean(document.querySelector('${selector}'))`,
        returnByValue: true
      });
      if (r.result && r.result.value) return true;
      await new Promise(res => setTimeout(res, 200));
    }
    return false;
  }

  console.log('Logging in...');
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
        window.location.reload();
      })()
    `,
    awaitPromise: true
  });

  console.log('Waiting for sidebar navigation to appear...');
  const navLoaded = await waitForSelector('.nav-item-btn');
  console.log('Nav loaded:', navLoaded);

  console.log('Navigating to Gerador APK...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const navBtns = Array.from(document.querySelectorAll('.nav-item-btn'));
        const apkBtn = navBtns.find(b => b.textContent && b.textContent.includes('Gerador APK'));
        if (apkBtn) apkBtn.click();
      })()
    `
  });

  console.log('Waiting for APK list to appear...');
  const listLoaded = await waitForSelector('.apk-build-item-row');
  console.log('List loaded:', listLoaded);

  // Take screenshot of main APK Builder page
  const ss1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('proof_1_apk_builder_gerador_funcional.png', Buffer.from(ss1.data, 'base64'));
  console.log('Saved proof_1_apk_builder_gerador_funcional.png, size:', fs.statSync('proof_1_apk_builder_gerador_funcional.png').size);

  console.log('Clicking QR Code button on row...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('.apk-item-actions-col button, .compact-btn'));
        const qrBtn = btns.find(b => b.textContent && b.textContent.includes('QR Code'));
        if (qrBtn) qrBtn.click();
      })()
    `
  });

  console.log('Waiting for modal card to appear...');
  const modalLoaded = await waitForSelector('.app-config-modal-card');
  console.log('Modal loaded:', modalLoaded);

  // Take screenshot of modal with QR Code
  const ss2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('proof_2_mdm_qr_code_zero_touch_modal.png', Buffer.from(ss2.data, 'base64'));
  fs.writeFileSync('C:\\Users\\Dell\\.gemini\\antigravity\\brain\\ae263ad2-5f2f-44e6-ad49-c434bcfe2bac\\proof_2_mdm_qr_code_zero_touch_modal.png', Buffer.from(ss2.data, 'base64'));
  console.log('Saved proof_2_mdm_qr_code_zero_touch_modal.png, size:', fs.statSync('proof_2_mdm_qr_code_zero_touch_modal.png').size);

  console.log('Expanding JSON Inspector...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.textContent && (b.textContent.includes('Inspecionar Payload') || b.textContent.includes('JSON MDM')));
        if (btn) btn.click();
      })()
    `
  });

  await new Promise(r => setTimeout(r, 800));

  // Take screenshot of modal with open JSON terminal
  const ss3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('proof_3_mdm_encrypted_json_payload_inspector.png', Buffer.from(ss3.data, 'base64'));
  fs.writeFileSync('C:\\Users\\Dell\\.gemini\\antigravity\\brain\\ae263ad2-5f2f-44e6-ad49-c434bcfe2bac\\proof_3_mdm_encrypted_json_payload_inspector.png', Buffer.from(ss3.data, 'base64'));
  console.log('Saved proof_3_mdm_encrypted_json_payload_inspector.png, size:', fs.statSync('proof_3_mdm_encrypted_json_payload_inspector.png').size);

  console.log('Clicking Tab 2: APK Direto & Emulador...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.textContent && b.textContent.includes('2. APK Direto & Emulador'));
        if (btn) btn.click();
      })()
    `
  });

  await new Promise(r => setTimeout(r, 800));

  // Take screenshot of APK Download view
  const ss4 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('proof_4_apk_download_e_emulador_funcional.png', Buffer.from(ss4.data, 'base64'));
  fs.writeFileSync('C:\\Users\\Dell\\.gemini\\antigravity\\brain\\ae263ad2-5f2f-44e6-ad49-c434bcfe2bac\\proof_4_apk_download_e_emulador_funcional.png', Buffer.from(ss4.data, 'base64'));
  console.log('Saved proof_4_apk_download_e_emulador_funcional.png, size:', fs.statSync('proof_4_apk_download_e_emulador_funcional.png').size);

  ws.close();
  chrome.kill();
  try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch {}
  console.log('All operations finished successfully!');
}
test().catch(console.error);
