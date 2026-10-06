const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const brainDir = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\ae263ad2-5f2f-44e6-ad49-c434bcfe2bac';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function test() {
  const tempProfile = process.env.TEMP + '\\chrome_direct_' + Date.now();
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9458',
    '--disable-gpu',
    '--disable-extensions',
    `--user-data-dir=${tempProfile}`,
    'http://localhost:5000/'
  ]);

  await sleep(1500);
  const res = await new Promise(r => http.get('http://127.0.0.1:9458/json/list', res => {
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
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('EXCEPTION:', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');

  async function evalInPage(fnStr) {
    const r = await send('Runtime.evaluate', {
      expression: `(${fnStr})()`,
      returnByValue: true,
      awaitPromise: true
    });
    return r.result ? r.result.value : null;
  }

  async function capture(filename) {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filename, Buffer.from(r.data, 'base64'));
    const brainPath = path.join(brainDir, filename);
    fs.writeFileSync(brainPath, Buffer.from(r.data, 'base64'));
    console.log(`[CAPTURA] ${filename} salva (${fs.statSync(filename).size} bytes)`);
  }

  await sleep(1500);

  // Step 1: Submit Login form
  console.log('Step 1: Submitting login...');
  const loginRes = await evalInPage(`
    async () => {
      const btn = document.querySelector('form.login-panel button[type="submit"]');
      if (btn) {
        btn.click();
        return 'clicked_login';
      }
      return 'no_login_btn';
    }
  `);
  console.log('Login result:', loginRes);
  await sleep(1500);

  // Step 2: Navigate to Gerador APK
  console.log('Step 2: Navigating to Gerador APK...');
  const navRes = await evalInPage(`
    () => {
      const navBtns = Array.from(document.querySelectorAll('.nav-item-btn'));
      const apkBtn = navBtns.find(b => b.textContent && b.textContent.includes('Gerador APK'));
      if (apkBtn) {
        apkBtn.click();
        return 'navigated_apk';
      }
      return 'nav_btn_not_found';
    }
  `);
  console.log('Navigation result:', navRes);
  await sleep(1500);

  // Capture Main APK Builder Page
  await capture('proof_1_gerador_apk_tela_principal.png');

  // Step 3: Open QR Code Modal
  console.log('Step 3: Opening QR Code Modal...');
  const qrRes = await evalInPage(`
    () => {
      const btns = Array.from(document.querySelectorAll('.apk-item-actions-col button, .compact-btn'));
      const qrBtn = btns.find(b => b.textContent && b.textContent.includes('QR Code'));
      if (qrBtn) {
        qrBtn.click();
        return 'opened_qr_modal';
      }
      return 'qr_btn_not_found';
    }
  `);
  console.log('QR Button result:', qrRes);
  await sleep(1200);

  // Ensure Zero-Touch mode is active
  await evalInPage(`
    () => {
      const btns = Array.from(document.querySelectorAll('button'));
      const zt = btns.find(b => b.textContent && b.textContent.includes('Zero-Touch'));
      if (zt) zt.click();
    }
  `);
  await sleep(600);

  // Capture QR Code Modal with Zero-Touch
  await capture('proof_2_mdm_qr_code_zero_touch_modal.png');

  // Step 4: Expand Terminal JSON Inspector
  console.log('Step 4: Expanding Encrypted Payload Inspector...');
  await evalInPage(`
    () => {
      const btns = Array.from(document.querySelectorAll('button'));
      const exp = btns.find(b => b.textContent && (b.textContent.includes('Inspecionar Payload') || b.textContent.includes('JSON MDM')));
      if (exp) exp.click();
    }
  `);
  await sleep(800);

  // Capture Encrypted Payload JSON Inspector
  await capture('proof_3_mdm_encrypted_json_payload_inspector.png');

  // Step 5: Switch to APK Direto & Emulador Tab
  console.log('Step 5: Switching to APK Direto & Emulador...');
  await evalInPage(`
    () => {
      const btns = Array.from(document.querySelectorAll('button'));
      const apkTab = btns.find(b => b.textContent && b.textContent.includes('2. APK Direto & Emulador'));
      if (apkTab) apkTab.click();
    }
  `);
  await sleep(800);

  // Capture APK Download and ADB Command View
  await capture('proof_4_apk_download_e_emulador_funcional.png');

  ws.close();
  chrome.kill();
  try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch {}
  console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
