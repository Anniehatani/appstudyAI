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

ipcMain.handle("academic:open-iu-login", async () => {
  return new Promise((resolve) => {
    let resolved = false;

    const loginWin = new BrowserWindow({
      parent: mainWindow,
      modal: true,
      width: 900,
      height: 750,
      minWidth: 700,
      minHeight: 600,
      title: "Đăng Nhập Cổng Trường IU (CMC University)",
      autoHideMenuBar: true,
      backgroundColor: "#ffffff",
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    loginWin.webContents.setWindowOpenHandler(() => {
      return { action: "allow" };
    });

    const targetUrl = "https://iu.cmcu.edu.vn/congthongtin/login.aspx";
    loginWin.loadURL(targetUrl);

    async function checkAuthSuccess(currentUrl) {
      if (resolved) return;
      if (!currentUrl || !/Index\.aspx/i.test(currentUrl)) return;
      resolved = true;

      try {
        const cookies = await loginWin.webContents.session.cookies.get({ domain: "cmcu.edu.vn" });
        const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join("; ");

        let studentName = "";
        let tokenJWT = "";
        try {
          const evalRes = await loginWin.webContents.executeJavaScript(`
            (function() {
              var name = document.querySelector("#lblTenDangNhap, #lblUser, .user-name, #ctl00_lblTenDangNhap, #lblHoTen")?.innerText || "";
              var axyz = window.AXYZCLRVN || (document.body.innerText.match(/AXYZCLRVN.*?([A-Za-z0-9+/=]{30,})/)||[])[1] || "";
              return { name: name.trim(), axyz: axyz };
            })()
          `);
          studentName = evalRes.name || "";
          tokenJWT = evalRes.axyz || "";
        } catch {}

        try { loginWin.close(); } catch {}

        // Dùng tool scraper backend để đục bảng điểm từ cổng IU
        const postRes = await fetch("http://127.0.0.1:8787/api/academic/import-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cookie: cookieStr,
            token: tokenJWT,
            student: { ho_ten: studentName }
          })
        });

        const data = await postRes.json();
        resolve(data);
      } catch (err) {
        resolve({ ok: false, error: err.message });
      }
    }

    loginWin.webContents.on("did-navigate", (e, url) => checkAuthSuccess(url));
    loginWin.webContents.on("did-navigate-in-page", (e, url) => checkAuthSuccess(url));
    loginWin.webContents.on("did-finish-load", () => checkAuthSuccess(loginWin.webContents.getURL()));

    loginWin.on("closed", () => {
      if (!resolved) {
        resolved = true;
        resolve({ ok: false, cancelled: true });
      }
    });
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
