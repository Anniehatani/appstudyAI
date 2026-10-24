const { app, BrowserWindow, Menu, shell, ipcMain, screen } = require("electron");
const path = require("path");
const { startEmbeddedServer } = require("./embedded-server.cjs");

let mainWindow = null;
let embeddedServerInstance = null;

// Set Application User Model ID for Windows Taskbar & Notifications
if (process.platform === "win32") {
  app.setAppUserModelId("com.lumi.3tgstudy");
}

function getIconPath() {
  const base = app.isPackaged ? app.getAppPath() : path.join(__dirname, "..");
  if (process.platform === "win32") {
    return path.join(base, "build/icon.ico");
  }
  return path.join(base, "build/icon.png");
}

async function createWindow() {
  const iconPath = getIconPath();
  const rootPath = app.isPackaged ? app.getAppPath() : path.join(__dirname, "..");

  // Start standalone internal embedded server (zero external dependency)
  let appUrl = "http://127.0.0.1:8787";
  try {
    const sInfo = await startEmbeddedServer(rootPath, 8787);
    embeddedServerInstance = sInfo.server;
    appUrl = sInfo.url;
    currentAppUrl = sInfo.url;
  } catch (err) {
    console.error("[Electron] Không thể chạy embedded server:", err);
  }

  // Tối ưu kích thước thích ứng chuẩn mọi tỷ lệ DPI Scaling (100%, 125%, 150%)
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: workW, height: workH } = primaryDisplay.workAreaSize;
  const initialWidth = Math.min(1280, Math.max(900, workW - 40));
  const initialHeight = Math.min(820, Math.max(540, workH - 40));

  mainWindow = new BrowserWindow({
    width: initialWidth,
    height: initialHeight,
    minWidth: 860,
    minHeight: 520,
    title: "3TG — Học Vui Mỗi Ngày",
    icon: iconPath,
    backgroundColor: "#fff5f8",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false
    }
  });

  // Open external links in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // Application Menu
  const menuTemplate = [
    {
      label: "3TG Study",
      submenu: [
        { label: "Trang chủ", accelerator: "CmdOrCtrl+H", click: () => mainWindow.loadURL(appUrl) },
        { label: "Tải lại trang", accelerator: "CmdOrCtrl+R", click: () => mainWindow.reload() },
        { type: "separator" },
        { label: "Ẩn cửa sổ", accelerator: "CmdOrCtrl+W", role: "minimize" },
        { label: "Thoát ứng dụng", accelerator: "CmdOrCtrl+Q", role: "quit" }
      ]
    },
    {
      label: "Giao diện",
      submenu: [
        { label: "Thu nhỏ", role: "zoomOut" },
        { label: "Phóng to", role: "zoomIn" },
        { label: "Kích thước chuẩn (100%)", role: "resetZoom" },
        { type: "separator" },
        { label: "Toàn màn hình", role: "togglefullscreen" }
      ]
    },
    {
      label: "Công cụ",
      submenu: [
        { label: "Công cụ nhà phát triển (DevTools)", accelerator: "F12", click: () => mainWindow.webContents.toggleDevTools() },
        { type: "separator" },
        {
          label: "Về 3TG Study",
          click: () => {
            shell.openExternal("https://github.com/Anniehatani/appstudyAI");
          }
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.loadURL(appUrl);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle("app:ping", () => "pong");
ipcMain.handle("app:reload", () => mainWindow?.reload());
ipcMain.handle("window:minimize", () => mainWindow?.minimize());
ipcMain.handle("window:maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle("window:close", () => mainWindow?.close());

let currentAppUrl = "http://127.0.0.1:8787";

const CMC_PARTITION = "persist:cmc-portal";
const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function clickMsSignInScript() {
  var kw = /microsoft|đăng nhập.*microsoft|sign in using microsoft|office ?365|azure/i;
  var sel = "a, button, input[type=button], input[type=submit], div[role=button], span[role=button], img";
  var els = Array.prototype.slice.call(document.querySelectorAll(sel));
  for (var i = 0; i < els.length; i++) {
    var e = els[i];
    var t = (e.innerText || e.value || e.getAttribute("aria-label") || e.title || e.alt || "").trim();
    if (t && kw.test(t)) {
      var clickable = e.closest && e.closest("a,button,[role=button]") ? e.closest("a,button,[role=button]") : e;
      clickable.click();
      return t || "clicked";
    }
  }
  var links = Array.prototype.slice.call(document.querySelectorAll("a[href]"));
  for (var j = 0; j < links.length; j++) {
    if (/microsoft|oauth|external|azuread|\bsso\b|signin-oidc|openid/i.test(links[j].href)) {
      links[j].click();
      return links[j].href;
    }
  }
  return false;
}

function portalAuthStateScript() {
  try {
    var href = location.href || "";
    if (/login\.microsoftonline\.com|login\.live\.com/i.test(href)) return false;
    return /cmcu\.edu\.vn/i.test(location.hostname) && !/login|signin|sign-in/i.test(href);
  } catch (e) {
    return false;
  }
}

ipcMain.handle("academic:open-iu-login", async () => {
  return new Promise(async (resolve) => {
    let finished = false;

    const loginWin = new BrowserWindow({
      width: 1080,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      show: false,
      title: "Đăng Nhập Cổng Trường IU (Microsoft CMC University)",
      autoHideMenuBar: true,
      backgroundColor: "#ffffff",
      webPreferences: {
        partition: CMC_PARTITION,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        backgroundThrottling: false
      }
    });

    try { loginWin.webContents.setUserAgent(CHROME_UA); } catch {}

    loginWin.webContents.setWindowOpenHandler(() => ({ action: "allow" }));

    loginWin.once("ready-to-show", () => {
      if (!loginWin.isDestroyed()) {
        loginWin.show();
        loginWin.focus();
      }
    });

    loginWin.on("closed", () => {
      if (!finished) {
        finished = true;
        resolve({ ok: false, cancelled: true, message: "Cửa sổ đăng nhập cổng IU đã đóng." });
      }
    });

    const targetUrl = "https://iu.cmcu.edu.vn/congthongtin/login.aspx";
    loginWin.loadURL(targetUrl).catch(() => {});

    // Tự động click nút Microsoft SSO nếu xuất hiện
    loginWin.webContents.on("did-finish-load", async () => {
      if (loginWin.isDestroyed()) return;
      try {
        await sleep(500);
        await loginWin.webContents.executeJavaScript(`(${clickMsSignInScript.toString()})()`, true);
      } catch {}
    });

    // Vòng lặp kiểm tra trạng thái xác thực cổng trường theo chuẩn smart_study_hub_cmc_uni
    const started = Date.now();
    const timeoutMs = 180000; // 3 phút
    let isAuthed = false;

    while (Date.now() - started < timeoutMs) {
      if (finished || loginWin.isDestroyed()) break;

      try {
        const curAuthed = await loginWin.webContents.executeJavaScript(
          `(${portalAuthStateScript.toString()})()`,
          true
        );
        if (curAuthed) {
          isAuthed = true;
          break;
        }
      } catch {}

      await sleep(700);
    }

    if (!isAuthed || finished || loginWin.isDestroyed()) {
      if (!finished) {
        finished = true;
        try { if (!loginWin.isDestroyed()) loginWin.close(); } catch {}
        resolve({ ok: false, error: "Hết thời gian chờ đăng nhập cổng trường IU." });
      }
      return;
    }

    // Đã đăng nhập vào IU thành công -> Đọc thông tin phiên từ window.edu.system
    let session = null;
    const waitSessionStart = Date.now();
    while (Date.now() - waitSessionStart < 15000) {
      if (loginWin.isDestroyed()) break;
      try {
        const raw = await loginWin.webContents.executeJavaScript(`
          (function() {
            try {
              var s = (window.edu && window.edu.system) || {};
              var name = (document.querySelector(".user-name, #lblTenDangNhap, #lblHoTen, #lblUser")?.innerText || "").trim();
              return JSON.stringify({
                userId: s.userId || "",
                chucNangId: s.strChucNang_Id || "",
                iM: s.iM || "AzzSystem",
                appId: s.appId || "Portal_SinhVien",
                tokenJWT: s.tokenJWT || "",
                hoTen: name
              });
            } catch(e) { return JSON.stringify({ error: String(e) }); }
          })()
        `, true);

        const parsed = JSON.parse(raw);
        if (parsed && (parsed.userId || parsed.tokenJWT || parsed.hoTen)) {
          session = parsed;
          if (parsed.tokenJWT && parsed.userId) break;
        }
      } catch {}
      await sleep(500);
    }

    // Lấy cookie cổng IU từ session partition persist:cmc-portal (bao gồm cả ASP.NET_SessionId)
    let cookieStr = "";
    try {
      const ses = loginWin.webContents.session;
      const [listIu, listCmc, listAll] = await Promise.all([
        ses.cookies.get({ url: "https://iu.cmcu.edu.vn" }).catch(() => []),
        ses.cookies.get({ url: "https://cmcu.edu.vn" }).catch(() => []),
        ses.cookies.get({}).catch(() => [])
      ]);
      const map = new Map();
      for (const c of [...listAll, ...listCmc, ...listIu]) {
        if (!c || !c.name) continue;
        if ((c.domain && c.domain.includes("cmcu.edu.vn")) || c.name === "ASP.NET_SessionId" || c.name.startsWith(".ASPX")) {
          map.set(c.name, c.value);
        }
      }
      cookieStr = Array.from(map.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
      console.log(`[IU Bridge] Đã bắt ${map.size} cookies: ${Array.from(map.keys()).join(", ")}`);
    } catch (e) {
      console.warn("[IU Cookie Error]", e);
    }

    // ĐÓNG CỬA SỔ IU NGAY LẬP TỨC (không để cửa sổ treo sau khi đã login xong!)
    finished = true;
    try {
      if (!loginWin.isDestroyed()) {
        loginWin.hide();
        loginWin.close();
      }
    } catch {}

    // Gọi API backend scraper để đục toàn bộ bảng điểm, GPA, các kỳ
    try {
      const postUrl = `${currentAppUrl || "http://127.0.0.1:8787"}/api/academic/import-data`;
      const postRes = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cookie: cookieStr,
          token: session?.tokenJWT || "",
          userId: session?.userId || "",
          chucNangId: session?.chucNangId || "20160101",
          student: { ho_ten: session?.hoTen || "" }
        })
      });

      const data = await postRes.json();
      resolve(data);
    } catch (err) {
      resolve({ ok: false, error: "Lỗi kéo bảng điểm từ backend: " + err.message });
    }
  });
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (embeddedServerInstance) {
    try {
      embeddedServerInstance.close();
    } catch {}
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
