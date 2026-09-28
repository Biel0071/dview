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

async function captureScreenshot(url, outputPath, width = 1600, height = 1050, waitMs = 3000) {
  const tempProfile = process.env.TEMP + '\\chrome_cdp_' + Date.now();
  console.log(`Capturing ${url} -> ${outputPath}`);
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9333',
    '--disable-gpu',
    `--window-size=${width},${height}`,
    `--user-data-dir=${tempProfile}`,
    '--no-first-run',
    '--no-default-browser-check',
    url
  ]);

  try {
    let ready = false;
    let listData = '';
    for (let i = 0; i < 30; i++) {
      await sleep(300);
      try {
        listData = await httpGet('http://127.0.0.1:9333/json/list');
        const list = JSON.parse(listData);
        if (list.length > 0 && list[0].webSocketDebuggerUrl) {
          ready = true;
          break;
        }
      } catch {}
    }
    if (!ready) throw new Error('Chrome failed to list active page on port 9333');

    const pages = JSON.parse(listData);
    const targetPage = pages.find(p => p.type === 'page') || pages[0];
    const wsUrl = targetPage.webSocketDebuggerUrl;

    const ws = new globalThis.WebSocket(wsUrl);

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    console.log(`Connected to page CDP: ${targetPage.title}. Waiting ${waitMs}ms for render...`);
    await sleep(waitMs);

    const base64Data = await new Promise((resolve, reject) => {
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === 1) {
          if (msg.result && msg.result.data) {
            resolve(msg.result.data);
          } else {
            reject(new Error(JSON.stringify(msg.error)));
          }
        }
      };
      ws.send(JSON.stringify({ id: 1, method: 'Page.captureScreenshot', params: { format: 'png' } }));
    });

    ws.close();
    fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
    console.log(`SUCCESS: Saved screenshot (${base64Data.length} chars base64, ${fs.statSync(outputPath).size} bytes) to ${outputPath}`);
  } finally {
    try { chrome.kill(); } catch {}
  }
}

async function run() {
  const target = process.argv[2] || 'http://localhost:5000/';
  const out = process.argv[3] || 'screenshot.png';
  const width = parseInt(process.argv[4] || '1600', 10);
  const height = parseInt(process.argv[5] || '1050', 10);
  const waitMs = parseInt(process.argv[6] || '3500', 10);
  await captureScreenshot(target, out, width, height, waitMs);
}

run().catch(err => {
  console.error('Error capturing screenshot:', err);
  process.exit(1);
});
