const { app, BrowserWindow, Menu, shell, ipcMain, screen } = require("electron");
const path = require("path");
const fs = require("fs");
const { startEmbeddedServer } = require("./embedded-server.cjs");

let mainWindow = null;
let embeddedServerInstance = null;

// Set Application User Model ID for Windows Taskbar & Notifications
if (process.platform === "win32") {
  app.setAppUserModelId("com.tonepink.3tgstudy");
}

function getIconPath() {
  if (process.platform === "win32") {
    if (app.isPackaged) {
      const unpacked = path.join(process.resourcesPath, "app.asar.unpacked/build/icon.ico");
      if (fs.existsSync(unpacked)) return unpacked;
      const direct = path.join(process.resourcesPath, "build/icon.ico");
      if (fs.existsSync(direct)) return direct;
    }
    return path.join(__dirname, "..", "build/icon.ico");
  }
  return path.join(__dirname, "..", "build/icon.png");
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

  // Fast display fallback: hiển thị cửa sổ ngay lập tức, không chờ đợi
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  }, 800);

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
ipcMain.handle("auth:clear-cookies", async () => {
  try {
    if (mainWindow) {
      await mainWindow.webContents.session.clearStorageData({ storages: ["cookies"] });
    }
  } catch {}
  return { ok: true };
});

let currentAppUrl = "http://127.0.0.1:8787";

const iu = require("./iu");
const { destroyWindow } = require("./iu/login/window");

ipcMain.handle("academic:open-iu-login", async () => {
  try {
    console.log("[IU Bridge] Mở cửa sổ đăng nhập Cổng Trường IU...");
    const jar = await iu.loginIU({ timeoutMs: 180000, keepOpen: false });
    if (!jar || jar.count === 0) {
      return { ok: false, message: "Không thể lấy cookie xác thực cổng IU." };
    }
    console.log(`[IU Bridge] Đã bắt thành công ${jar.count} cookies: ${Object.keys(jar.map).join(", ")}`);

    const win = iu.getIuWindow();
    const session = win ? await iu.laySession(win) : null;
    if (!session || !session.userId) {
      return { ok: false, message: "Không thể đọc thông tin người dùng từ cổng IU." };
    }
    console.log(`[IU Bridge] Đã xác thực phiên sinh viên: userId=${session.userId}, hoTen=${session.hoTen || "Sinh viên"}`);

    // Tính toán khoảng thời gian 2 tuần vừa rồi đến 4 tuần tới để cào trọn vẹn Lịch Học (thời khóa biểu)
    const pad = n => String(n).padStart(2, '0');
    const now = new Date();
    const past = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const future = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);
    const dateRange = {
      ngayBatDau: `${pad(past.getDate())}/${pad(past.getMonth() + 1)}/${past.getFullYear()}`,
      ngayKetThuc: `${pad(future.getDate())}/${pad(future.getMonth() + 1)}/${future.getFullYear()}`
    };

    // Cào dữ liệu học tập từ cổng trường IU
    console.log(`[IU Bridge] Đang cào bảng điểm & lịch học từ cổng trường IU (${dateRange.ngayBatDau} -> ${dateRange.ngayKetThuc})...`);
    let academicData = null;
    try {
      academicData = await iu.layTatCaIU(session, jar.cookie, dateRange);
    } catch (pullErr) {
      console.warn("[IU Bridge] layTatCaIU cảnh báo, fallback sang cào từng phần:", pullErr.message);
      const bangDiem = await iu.layBangDiem(session, jar.cookie).catch(() => []);
      const hoSo = await iu.layHoSoSinhVien(session, jar.cookie).catch(() => ({}));
      const lichHoc = await iu.layLichHoc(session, jar.cookie, dateRange).catch(() => []);
      const ketQuaDk = await iu.layKetQuaDangKy(session, jar.cookie).catch(() => []);
      academicData = {
        data: {
          IU: {
            goc_hoc_tap: {
              tra_cuu_diem: {
                bang_diem: bangDiem || [],
                ket_qua_dang_ky: ketQuaDk || []
              }
            },
            ho_so_sinh_vien: { thong_tin_ca_nhan: hoSo || {} },
            lich_hoc: { chi_tiet_thoi_khoa_bieu: lichHoc || [] }
          }
        }
      };
    }

    // Đóng cửa sổ trình duyệt đăng nhập sau khi đã cào xong dữ liệu
    try { destroyWindow(); } catch {}

    const payloadToImport = (academicData && academicData.data) ? academicData.data : academicData;

    // Gửi sang backend /api/academic/import-data để tính GPA, chuẩn hoá môn và lưu vào DB
    const postUrl = `${currentAppUrl || "http://127.0.0.1:8787"}/api/academic/import-data`;
    const postRes = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawData: payloadToImport,
        cookie: jar.cookie,
        token: session.tokenJWT || "",
        userId: session.userId || "",
        student: { ho_ten: session.hoTen || "" }
      })
    });

    const data = await postRes.json();
    return data;
  } catch (err) {
    try {
      destroyWindow();
    } catch {}
    console.error("[IU Bridge Error]", err);
    return { ok: false, error: err.message || "Lỗi khi kết nối cổng trường IU." };
  }
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
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
}
