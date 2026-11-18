const http = require("http");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9225;
const TEMP_PROFILE = path.join(os.tmpdir(), "chrome_cdp_profile_" + Date.now());

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.callbacks = new Map();
    this.nextId = 1;
    this.ready = new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result?.value;
  }

  async screenshot(outPath) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    const buf = Buffer.from(res.data, "base64");
    fs.writeFileSync(outPath, buf);
    console.log(`📸 Saved screenshot (${buf.length} bytes): ${outPath}`);
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log("=== STARTING CDP LIVE CHROME CAPTURE ===");
  fs.mkdirSync(TEMP_PROFILE, { recursive: true });

  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${TEMP_PROFILE}`,
    "--headless=new",
    "--disable-gpu",
    "--window-size=1440,900",
    "about:blank"
  ]);

  chromeProc.on("error", err => console.error("Chrome error:", err));

  let targets = null;
  for (let i = 0; i < 30; i++) {
    await sleep(300);
    try {
      targets = await httpGetJson(`http://127.0.0.1:${PORT}/json`);
      if (targets && targets.length > 0) break;
    } catch {}
  }

  if (!targets || targets.length === 0) {
    console.error("Could not connect to Chrome DevTools port");
    chromeProc.kill();
    return;
  }

  const pageTarget = targets.find(t => t.type === "page") || targets[0];
  console.log("Connecting to target WebSocket:", pageTarget.webSocketDebuggerUrl);

  const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await client.ready;
  console.log("Connected to Chrome DevTools Protocol!");

  await client.send("Page.enable");
  await client.send("Runtime.enable");

  const outDir = path.resolve("tổng kết dự án/figures");
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Navigate to live app
  console.log("Navigating to http://127.0.0.1:8787 ...");
  await client.send("Page.navigate", { url: "http://127.0.0.1:8787" });
  await sleep(2500);

  // Screen 1: Auth screen / Landing
  await client.eval(`
    if (document.getElementById('header-login-btn')) {
      document.getElementById('header-login-btn').click();
    }
  `);
  await sleep(1000);
  await client.screenshot(path.join(outDir, "fig_auth_screen.png"));

  // Screen 2: Log in as test user or dismiss to see learning path
  console.log("Setting logged in session state and showing learning path...");
  await client.eval(`
    // Simulate user login directly via state
    if (typeof state !== 'undefined') {
      state.profile = {
        id: 'user_test',
        username: 'levanan01',
        displayName: 'Lê Văn An',
        colorTheme: 'oxford',
        role: 'user'
      };
      state.stats = {
        totalXp: 1850,
        currentStreak: 14,
        gems: 320,
        hearts: 5
      };
      state.page = 'home';
      if (typeof updateShell === 'function') updateShell();
      if (typeof render === 'function') render();
      // Close any modal
      const modal = document.querySelector('.modal-overlay');
      if (modal) modal.remove();
    }
  `);
  await sleep(1500);
  await client.screenshot(path.join(outDir, "fig_learning_path.png"));

  // Screen 3: Pomodoro lobby
  console.log("Navigating to Pomodoro lobby...");
  await client.eval(`
    if (typeof navigateToPage === 'function') {
      navigateToPage('pomodoro');
    }
  `);
  await sleep(1500);
  await client.screenshot(path.join(outDir, "fig_pomo_lobby.png"));

  // Screen 4: Pomodoro Study Room / Zen desk
  console.log("Triggering study desk view with PDF and AI panel...");
  await client.eval(`
    // Trigger focus view or show study layout
    const btn = document.querySelector('#pomo-start-btn') || document.querySelector('.pomo-start-btn') || document.querySelector('[data-action="start-focus"]');
    if (btn) btn.click();
    // Or render study room
    const desk = document.getElementById('pomo-focus-desk');
    if (desk) desk.style.display = 'block';
  `);
  await sleep(1500);
  await client.screenshot(path.join(outDir, "fig_pomo_room.png"));

  client.close();
  chromeProc.kill();
  console.log("✅ LIVE APPLICATION SCREENSHOTS CAPTURED SUCCESSFULLY 100%!");
}

run().catch(err => console.error("CDP Script Failed:", err));
