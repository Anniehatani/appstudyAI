const { app, BrowserWindow, Menu, shell, ipcMain, screen } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn, execFile } = require("child_process");
const { startEmbeddedServer } = require("./embedded-server.cjs");

let mainWindow = null;
let embeddedServerInstance = null;
let kioskGuardProc = null;

function restoreWindowsTaskbar() {
  if (process.platform !== "win32") return;
  const candidates = [
    path.join(__dirname, "kiosk_guard.exe"),
    path.join(__dirname, "../build/study_kiosk.exe"),
    path.join(process.resourcesPath || "", "app.asar.unpacked/build/study_kiosk.exe"),
    path.join(process.resourcesPath || "", "build/study_kiosk.exe")
  ];
  const targetExe = candidates.find(p => fs.existsSync(p));
  if (targetExe) {
    try {
      const { spawnSync } = require("child_process");
      spawnSync(targetExe, ["--restore"], { windowsHide: true, timeout: 3000 });
      console.log("[KioskGuard] Đã khôi phục thanh Taskbar Windows hoàn tất");
    } catch (e) {
      console.warn("[TaskbarRestore Error]", e.message);
    }
  }
}

function startKioskGuard() {
  if (process.platform !== "win32") return;
  if (kioskGuardProc && !kioskGuardProc.killed) return;

  const candidates = [
    path.join(__dirname, "kiosk_guard.exe"),
    path.join(__dirname, "../build/study_kiosk.exe"),
    path.join(process.resourcesPath || "", "app.asar.unpacked/build/study_kiosk.exe"),
    path.join(process.resourcesPath || "", "build/study_kiosk.exe")
  ];

  let guardPath = candidates.find(p => fs.existsSync(p));
  if (!guardPath) {
    const csFile = path.join(__dirname, "kiosk-guard.cs");
    const targetExe = path.join(__dirname, "kiosk_guard.exe");
    const cscPath = "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe";
    if (fs.existsSync(csFile) && fs.existsSync(cscPath)) {
      try {
        const { spawnSync } = require("child_process");
        const res = spawnSync(cscPath, ["/target:winexe", `/out:${targetExe}`, csFile]);
        if (res.status === 0 && fs.existsSync(targetExe)) {
          guardPath = targetExe;
          console.log("[KioskGuard] Tự động biên dịch kiosk_guard.exe thành công!");
        }
      } catch (err) {
        console.warn("[KioskGuard Compile Error]", err.message);
      }
    }
  }

  if (!guardPath) {
    console.warn("[KioskGuard] Không tìm thấy tệp kiosk_guard.exe tại các vị trí:", candidates);
    return;
  }

  try {
    kioskGuardProc = spawn(guardPath, [], {
      stdio: ["pipe", "ignore", "ignore"],
      windowsHide: true
    });
    kioskGuardProc.on("error", (e) => console.warn("[KioskGuard Error]", e.message));
    console.log("[KioskGuard] Đã kích hoạt Hook bàn phím khóa cứng phím Windows & Alt+Tab (PID:", kioskGuardProc.pid, ")");
  } catch (err) {
    console.warn("[KioskGuard Exception]", err.message);
  }
}

function stopKioskGuard() {
  if (kioskGuardProc) {
    try {
      kioskGuardProc.stdin?.write("STOP\n");
    } catch {}
    try {
      kioskGuardProc.stdin?.end();
    } catch {}
    setTimeout(() => {
      try {
        if (kioskGuardProc && !kioskGuardProc.killed) {
          kioskGuardProc.kill();
        }
      } catch {}
      kioskGuardProc = null;
    }, 100);
  }
  // Luôn khôi phục thanh Taskbar Windows ngay lập tức và vô điều kiện
  restoreWindowsTaskbar();
}

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
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
      plugins: true
    }
  });

  // Triệt tiêu hoàn toàn menu bar native để người dùng bấm Alt không bao giờ hiện bộ công cụ thoát ra
  Menu.setApplicationMenu(null);
  mainWindow.setMenu(null);
  mainWindow.setMenuBarVisibility(false);

  // Chặn toàn bộ phím chức năng khi ở chế độ Kiosk Pomodoro (ngoại trừ PrtSc và Ctrl C, V, A, X, Z, Q)
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (!isKioskActive) return;

    if (input.key === "PrintScreen") return;

    const isCtrl = input.control || input.meta;
    const keyLower = (input.key || "").toLowerCase();

    // Cho phép phím soạn thảo và phím thoát khẩn cấp Pomodoro (Ctrl + Q)
    if (isCtrl && (keyLower === "c" || keyLower === "v" || keyLower === "a" || keyLower === "x" || keyLower === "z" || keyLower === "q")) {
      return;
    }

    // Chặn triệt để phím Alt (Alt đơn, Alt+Tab, Alt+F4...)
    if (input.key === "Alt" || input.alt) {
      event.preventDefault();
      return;
    }

    // Chặn toàn bộ phím F1 - F12
    if (/^F\d+$/i.test(input.key)) {
      event.preventDefault();
      return;
    }

    // Chặn phím Escape
    if (input.key === "Escape") {
      event.preventDefault();
      return;
    }

    // Chặn mọi tổ hợp Ctrl khác (Ctrl+W, Ctrl+R, Ctrl+N, Ctrl+P, Ctrl+Shift+I...)
    if (isCtrl) {
      event.preventDefault();
      return;
    }
  });

  // Open external links in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

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

  // Chế độ chụp màn hình PrtSc / Snipping Tool: tạm thời không gửi ESC và không cướp lại focus khi mất focus
  mainWindow.on("blur", () => {
    // Tạm thời vô hiệu hóa auto-refocus để cho phép công cụ chụp ảnh màn hình (PrtSc, Snipping Tool, Lightshot...) hiển thị
  });

  mainWindow.on("closed", () => {
    stopKioskGuard();
    mainWindow = null;
  });
}

let isKioskActive = false;
let kioskBlurTimer = null;

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
ipcMain.handle("window:set-fullscreen", (event, flag) => {
  if (mainWindow) {
    mainWindow.setFullScreen(Boolean(flag));
    return mainWindow.isFullScreen();
  }
  return false;
});
ipcMain.handle("window:is-fullscreen", () => {
  return mainWindow ? mainWindow.isFullScreen() : false;
});
ipcMain.handle("window:set-kiosk", (event, flag) => {
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  isKioskActive = Boolean(flag);
  if (isKioskActive) {
    Menu.setApplicationMenu(null);
    try {
      mainWindow.setMenu(null);
      mainWindow.setMenuBarVisibility(false);
      mainWindow.autoHideMenuBar = false;
    } catch {}
    startKioskGuard();
    try { mainWindow.setKiosk(true); } catch {}
    mainWindow.setFullScreen(true);
    mainWindow.focus();
  } else {
    stopKioskGuard();
    try { mainWindow.setKiosk(false); } catch {}
    mainWindow.setFullScreen(false);
  }
  return isKioskActive;
});
ipcMain.handle("window:is-kiosk", () => isKioskActive);
ipcMain.handle("dialog:open-study-files", async () => {
  if (!mainWindow || mainWindow.isDestroyed()) return [];
  const { dialog } = require("electron");
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Thêm tài liệu học tập vào phòng Pomodoro",
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "Tài liệu học tập", extensions: ["pdf", "docx", "doc", "pptx", "ppt", "txt", "md", "js", "py", "java", "cpp", "c", "cs", "html", "css", "json", "sql", "mp4", "webm", "mp3", "wav", "png", "jpg", "jpeg", "webp"] },
      { name: "Tất cả tệp", extensions: ["*"] }
    ]
  });
  if (result.canceled || !result.filePaths || !result.filePaths.length) return [];
  
  const filesData = [];
  for (const filePath of result.filePaths) {
    try {
      const fileName = path.basename(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const buffer = fs.readFileSync(filePath);
      filesData.push({
        name: fileName,
        path: filePath,
        ext: ext,
        size: buffer.length,
        base64: buffer.toString("base64")
      });
    } catch (e) {
      console.warn("[OpenFile Error]", e.message);
    }
  }
  return filesData;
});
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
    stopKioskGuard();
    if (embeddedServerInstance) {
      try {
        embeddedServerInstance.close();
      } catch {}
    }
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("will-quit", () => {
    stopKioskGuard();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
