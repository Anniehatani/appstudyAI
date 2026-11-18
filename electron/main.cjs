const { app, BrowserWindow, Menu, shell, ipcMain, screen } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn, execFile } = require("child_process");
const { startEmbeddedServer } = require("./embedded-server.cjs");

// ========================================================
// TỐI ƯU HIỆU NĂNG TOÀN DIỆN CHO MÁY YẾU (LOW-END PC / CẤU HÌNH THẤP)
// ========================================================
// 1. Ép tăng tốc phần cứng GPU & Zero-Copy rasterization để giảm tải CPU 2-core/4-core
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("enable-zero-copy");
app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("disable-software-rasterizer");

// 2. Giới hạn dung lượng V8 Heap (RAM) ở mức 512MB để không chiếm dụng RAM hệ thống
app.commandLine.appendSwitch("js-flags", "--max-old-space-size=512 --expose-gc");

// 3. Tắt các module ngầm tốn tài nguyên của Chromium
app.commandLine.appendSwitch("disable-features", "Translate,CalculateNativeWinOcclusion,InterestFeedContentSuggestions,MediaRouter");
app.commandLine.appendSwitch("renderer-process-limit", "4");

let mainWindow = null;
let embeddedServerInstance = null;
let kioskGuardProc = null;

function getGuardExecutablePath() {
  if (process.platform !== "win32") return null;
  const exeNames = ["study_guard.exe", "pomo_guard.exe", "focus_guard.exe", "kiosk_guard.exe"];
  const candidates = [];
  // Khi ứng dụng đã đóng gói thành installer/exe (process.resourcesPath tồn tại):
  // ƯU TIÊN TUYỆT ĐỐI đường dẫn đã giải nén (unpacked) ngoài ASAR, vì Windows không thể chạy .exe từ trong app.asar
  if (process.resourcesPath) {
    for (const name of exeNames) {
      candidates.push(path.join(process.resourcesPath, "app.asar.unpacked", "electron", name));
      candidates.push(path.join(process.resourcesPath, "app.asar.unpacked", "build", name));
      candidates.push(path.join(process.resourcesPath, "electron", name));
      candidates.push(path.join(process.resourcesPath, "build", name));
      candidates.push(path.join(process.resourcesPath, name));
    }
  }
  // Nếu đang chạy trong môi trường phát triển (npm run dev / source tree):
  if (!app.isPackaged) {
    for (const name of exeNames) {
      candidates.push(path.join(__dirname, name));
      candidates.push(path.join(__dirname, "..", "build", name));
    }
  }
  return candidates.find(p => fs.existsSync(p)) || null;
}

function restoreWindowsTaskbar() {
  if (process.platform !== "win32") return;

  // Tầng 1: Kích hoạt guard process với tham số --restore (C# Native ShowWindow + SetWindowPos)
  const targetExe = getGuardExecutablePath();
  if (targetExe) {
    try {
      const p = spawn(targetExe, ["--restore"], {
        detached: true,
        stdio: "ignore",
        windowsHide: true
      });
      p.unref();
      console.log("[KioskGuard] Đã kích hoạt khôi phục Taskbar qua study_guard.exe --restore (async)");
    } catch (e) {
      console.warn("[TaskbarRestore Error]", e.message);
    }
  }

  // Tầng 2: Win32 PowerShell Native Fallback trực tiếp để đảm bảo 100% Shell_TrayWnd và Shell_SecondaryTrayWnd được hiển thị lại
  try {
    const psScript = "$d='[DllImport(\"user32.dll\")] public static extern bool ShowWindow(IntPtr h, int c); [DllImport(\"user32.dll\")] public static extern bool EnableWindow(IntPtr h, bool e); [DllImport(\"user32.dll\")] public static extern IntPtr FindWindow(string c, string n);'; $w=Add-Type -MemberDefinition $d -Name W -PassThru; $t1=$w::FindWindow('Shell_TrayWnd', $null); if ($t1 -ne [IntPtr]::Zero) { $w::EnableWindow($t1, $true); $w::ShowWindow($t1, 5); $w::ShowWindow($t1, 9); }; $t2=$w::FindWindow('Shell_SecondaryTrayWnd', $null); if ($t2 -ne [IntPtr]::Zero) { $w::EnableWindow($t2, $true); $w::ShowWindow($t2, 5); $w::ShowWindow($t2, 9); }";
    const ps = spawn("powershell", ["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", psScript], {
      detached: true,
      stdio: "ignore",
      windowsHide: true
    });
    ps.unref();
  } catch {}
}

function startKioskGuard() {
  return new Promise((resolve) => {
    if (process.platform !== "win32") return resolve({ ok: true, reason: "non-win32" });
    if (kioskGuardProc && !kioskGuardProc.killed) {
      return resolve({ ok: true, alreadyRunning: true, pid: kioskGuardProc.pid });
    }

    let guardPath = getGuardExecutablePath();
    if (!guardPath) {
      const csFile = path.join(__dirname, "kiosk-guard.cs");
      const targetExe = path.join(__dirname, "study_guard.exe");
      const cscCandidates = [
        "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe",
        "C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe"
      ];
      const cscPath = cscCandidates.find(p => fs.existsSync(p));
      if (fs.existsSync(csFile) && cscPath) {
        try {
          const { spawnSync } = require("child_process");
          const res = spawnSync(cscPath, ["/nologo", "/target:winexe", `/out:${targetExe}`, csFile], { windowsHide: true });
          if (res.status === 0 && fs.existsSync(targetExe)) {
            guardPath = targetExe;
            console.log("[KioskGuard] Tự động biên dịch study_guard.exe thành công!");
          } else {
            console.warn("[KioskGuard Compile Failed]", res.stderr ? res.stderr.toString() : res.status);
          }
        } catch (err) {
          console.warn("[KioskGuard Compile Error]", err.message);
        }
      }
    }

    if (!guardPath) {
      console.warn("[KioskGuard] Không tìm thấy tệp bảo vệ study_guard.exe tại các vị trí kiểm tra");
      return resolve({ ok: false, error: "not_found" });
    }

    try {
      let isResolved = false;
      const timeoutTimer = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          console.log("[KioskGuard] Guard đã kích hoạt (PID:", kioskGuardProc?.pid, "), hết thời gian chờ handshake, cho phép vào phòng");
          resolve({ ok: true, timeoutFallback: true, pid: kioskGuardProc?.pid });
        }
      }, 800);

      kioskGuardProc = spawn(guardPath, ["--parent-pid", String(process.pid)], {
        stdio: ["pipe", "pipe", "ignore"],
        windowsHide: true
      });

      kioskGuardProc.stdout?.on("data", (data) => {
        const str = data.toString();
        if (str.includes("GUARD_READY") && !isResolved) {
          isResolved = true;
          clearTimeout(timeoutTimer);
          console.log("[KioskGuard] Hook bàn phím & Watchdog đã phản hồi GUARD_READY hoàn tất 100%!");
          resolve({ ok: true, ready: true, pid: kioskGuardProc?.pid });
        }
      });

      kioskGuardProc.on("error", (e) => {
        console.warn("[KioskGuard Error]", e.message);
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutTimer);
          resolve({ ok: false, error: e.message });
        }
      });

      kioskGuardProc.on("exit", () => {
        kioskGuardProc = null;
      });

      console.log("[KioskGuard] Đã kích hoạt Hook bàn phím & Watchdog khóa cứng Windows (PID:", kioskGuardProc.pid, ")");
    } catch (err) {
      console.warn("[KioskGuard Exception]", err.message);
      resolve({ ok: false, error: err.message });
    }
  });
}

function stopKioskGuard() {
  if (kioskGuardProc) {
    try {
      kioskGuardProc.stdin?.write("STOP\n");
    } catch {}
    try {
      kioskGuardProc.stdin?.end();
    } catch {}
    const oldProc = kioskGuardProc;
    kioskGuardProc = null;
    setTimeout(() => {
      try {
        if (oldProc && !oldProc.killed) {
          oldProc.kill();
        }
      } catch {}
    }, 150);
  }
  // Khôi phục thanh Taskbar Windows ngay lập tức ở cả 2 tầng bảo vệ
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

  // Tối ưu kích thước thích ứng chuẩn mọi tỷ lệ DPI Scaling (100%, 125%, 150%)
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: workW, height: workH } = primaryDisplay.workAreaSize;
  const initialWidth = Math.min(1280, Math.max(900, workW - 40));
  const initialHeight = Math.min(820, Math.max(540, workH - 40));

  // KHỞI TẠO CỬA SỔ MAINWINDOW NGAY LẬP TỨC (PARALLEL NON-BLOCKING)
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
      plugins: true,
      backgroundThrottling: true,
      v8CacheOptions: "code"
    }
  });

  // Triệt tiêu hoàn toàn menu bar native để người dùng bấm Alt không bao giờ hiện bộ công cụ thoát ra
  Menu.setApplicationMenu(null);
  mainWindow.setMenu(null);
  mainWindow.setMenuBarVisibility(false);

  // Đảm bảo phiên luôn trống khi mở app: Xóa cookie phiên lưu tạm để người dùng đăng nhập tài khoản riêng của họ
  try {
    const { session } = require("electron");
    session.defaultSession.clearStorageData({ storages: ["cookies"] });
  } catch {}

  // Giữ cửa sổ luôn ở trên cùng và lấy lại tiêu điểm ngay lập tức nếu có tác vụ hệ thống muốn can thiệp khi Kiosk đang kích hoạt
  mainWindow.on("blur", () => {
    if (isKioskActive && mainWindow && !mainWindow.isDestroyed()) {
      setTimeout(() => {
        if (isKioskActive && mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.focus();
          mainWindow.setAlwaysOnTop(true, "screen-saver");
        }
      }, 50);
    }
  });

  // Hiển thị ngay splash screen siêu tốc trong 0.1s đầu tiên để người dùng không cảm giác bị delay
  const splashHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 0; height: 100vh;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: #fff5f8; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      user-select: none; -webkit-user-select: none;
    }
    .card {
      display: flex; flex-direction: column; align-items: center;
      padding: 32px 48px; border-radius: 28px; background: rgba(255, 255, 255, 0.92);
      box-shadow: 0 12px 36px rgba(255, 94, 142, 0.14);
      border: 1px solid rgba(255, 182, 193, 0.45);
    }
    .mascot {
      width: 80px; height: 80px; border-radius: 22px; background: #fff0f5;
      display: flex; align-items: center; justify-content: center; font-size: 42px;
      margin-bottom: 16px; box-shadow: 0 6px 18px rgba(255, 94, 142, 0.15);
      animation: pulse 1.2s ease-in-out infinite alternate;
    }
    .title { font-size: 20px; font-weight: 800; color: #ff3b7a; letter-spacing: -0.2px; }
    .status { margin-top: 6px; font-size: 13px; color: #888; font-weight: 500; }
    .progress-bar {
      margin-top: 18px; width: 140px; height: 5px; background: rgba(255, 105, 180, 0.15);
      border-radius: 10px; overflow: hidden; position: relative;
    }
    .progress-fill {
      width: 45%; height: 100%; background: linear-gradient(90deg, #ff6b9d, #ff3b7a);
      border-radius: 10px; animation: slide 1.1s ease-in-out infinite alternate;
    }
    @keyframes pulse { from { transform: scale(0.96); } to { transform: scale(1.04); } }
    @keyframes slide { from { transform: translateX(0%); } to { transform: translateX(130%); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="mascot">🐰</div>
    <div class="title">3TG — Học Vui Mỗi Ngày</div>
    <div class="status">Đang mở không gian học tập...</div>
    <div class="progress-bar"><div class="progress-fill"></div></div>
  </div>
</body>
</html>`;

  mainWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(splashHtml));
  mainWindow.once("ready-to-show", () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
  });
  // Fast display fallback: đảm bảo cửa sổ luôn hiện lên ngay lập tức trong 200ms
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  }, 200);

  // Kích hoạt embedded server song song trên luồng nền
  const serverPromise = startEmbeddedServer(rootPath, 8787).then(sInfo => {
    embeddedServerInstance = sInfo.server;
    currentAppUrl = sInfo.url;
    return sInfo.url;
  }).catch(err => {
    console.error("[Electron] Không thể chạy embedded server:", err);
    return "http://127.0.0.1:8787";
  });

  // Khi server sẵn sàng (thường chỉ mất ~150-250ms), chuyển tiếp vào ứng dụng
  serverPromise.then(url => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(url);
    }
  });

  // Chặn toàn bộ phím chức năng khi ở chế độ Kiosk Pomodoro (ngoại trừ PrtSc và Ctrl C, V, A, X, Z, Q)
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (!isKioskActive) return;

    if (input.key === "PrintScreen") return;

    const isCtrl = input.control || input.meta;
    const keyLower = (input.key || "").toLowerCase();

    // Cho phép phím bổ trợ (Control, Shift) để cử chỉ chuột và phím tắt hoạt động
    if (keyLower === "control" || keyLower === "shift") {
      return;
    }

    // Cho phép phím soạn thảo, phím zoom tài liệu (Ctrl +, Ctrl -, Ctrl 0) và phím thoát Pomodoro (Ctrl + Q)
    if (isCtrl && (
      keyLower === "c" || keyLower === "v" || keyLower === "a" || keyLower === "x" || keyLower === "z" || keyLower === "q" ||
      keyLower === "+" || keyLower === "=" || keyLower === "-" || keyLower === "0" || keyLower === "numadd" || keyLower === "numsub"
    )) {
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

  // Ngăn chặn thoát bằng vuốt trackpad (3 ngón vuốt Task View, Show Desktop) hoặc click ra ngoài khi đang Pomodoro Kiosk
  mainWindow.on("blur", () => {
    if (isKioskActive && mainWindow && !mainWindow.isDestroyed()) {
      setTimeout(() => {
        if (isKioskActive && mainWindow && !mainWindow.isDestroyed()) {
          try {
            mainWindow.show();
            mainWindow.restore();
            mainWindow.setFullScreen(true);
            mainWindow.setAlwaysOnTop(true, "screen-saver");
            mainWindow.focus();
          } catch {}
        }
      }, 50);
    }
  });

  mainWindow.on("minimize", (e) => {
    if (isKioskActive && mainWindow && !mainWindow.isDestroyed()) {
      e.preventDefault();
      try {
        mainWindow.restore();
        mainWindow.setFullScreen(true);
        mainWindow.setAlwaysOnTop(true, "screen-saver");
        mainWindow.focus();
      } catch {}
    }
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
ipcMain.handle("window:set-kiosk", async (event, flag) => {
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  isKioskActive = Boolean(flag);
  if (isKioskActive) {
    Menu.setApplicationMenu(null);
    try {
      mainWindow.setMenu(null);
      mainWindow.setMenuBarVisibility(false);
      mainWindow.autoHideMenuBar = false;
    } catch {}

    // ĐẢM BẢO HOOK BÀN PHÍM VÀ BẢO VỆ WINDOWS HOẠT ĐỘNG HOÀN TOÀN TRƯỚC KHI BẬT KIOSK
    await startKioskGuard();

    try {
      mainWindow.setAlwaysOnTop(true, "screen-saver");
      mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      mainWindow.setKiosk(true);
    } catch {}
    mainWindow.setFullScreen(true);
    mainWindow.focus();
  } else {
    // 1. Phục hồi trạng thái cửa sổ ngay lập tức (0ms delay) để người dùng không cảm nhận bất kỳ độ trễ nào
    try {
      mainWindow.setAlwaysOnTop(false);
      mainWindow.setVisibleOnAllWorkspaces(false);
      mainWindow.setKiosk(false);
      mainWindow.setFullScreen(false);
      mainWindow.focus();
    } catch {}
    // 2. Dừng guard và khôi phục taskbar trong background (không chặn event loop)
    stopKioskGuard();
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

    // Lấy cookie phiên đăng nhập từ mainWindow để fetch nội bộ không bị 401
    let cookieHeader = "";
    try {
      if (mainWindow && mainWindow.webContents && mainWindow.webContents.session) {
        const cookies = await mainWindow.webContents.session.cookies.get({ url: currentAppUrl || "http://127.0.0.1:8787" });
        if (cookies && cookies.length > 0) {
          cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");
        }
      }
    } catch {}

    // Gửi sang backend /api/academic/import-data để tính GPA, chuẩn hoá môn và lưu vào DB
    const postUrl = `${currentAppUrl || "http://127.0.0.1:8787"}/api/academic/import-data`;
    const postHeaders = { "Content-Type": "application/json" };
    if (cookieHeader) postHeaders["Cookie"] = cookieHeader;

    const postRes = await fetch(postUrl, {
      method: "POST",
      headers: postHeaders,
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

  app.on("before-quit", () => {
    stopKioskGuard();
    restoreWindowsTaskbar();
  });

  app.on("will-quit", () => {
    stopKioskGuard();
    restoreWindowsTaskbar();
  });

  process.on("exit", () => {
    restoreWindowsTaskbar();
  });

  process.on("uncaughtException", (err) => {
    console.error("[UncaughtException]", err);
    restoreWindowsTaskbar();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
