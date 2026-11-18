using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Windows.Forms;

public class KioskGuard {
    private const int WH_KEYBOARD_LL = 13;
    private const int VK_TAB = 0x09;
    private const int VK_ESCAPE = 0x1B;
    private const int VK_LWIN = 0x5B;
    private const int VK_RWIN = 0x5C;
    private const int VK_APPS = 0x5D;

    private const int SW_HIDE = 0;
    private const int SW_SHOW = 5;
    private const int SW_RESTORE = 9;

    private static volatile bool _stopping = false;

    [StructLayout(LayoutKind.Sequential)]
    private struct KBDLLHOOKSTRUCT {
        public uint vkCode;
        public uint scanCode;
        public uint flags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    private delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);
    private static LowLevelKeyboardProc _proc = HookCallback;
    private static IntPtr _hookID = IntPtr.Zero;

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    private static extern short GetAsyncKeyState(int vKey);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool UnhookWindowsHookEx(IntPtr hhk);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr GetModuleHandle(string lpModuleName);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool EnableWindow(IntPtr hWnd, bool bEnable);

    [DllImport("user32.dll")]
    private static extern bool IsWindowVisible(IntPtr hWnd);

    public static void HideTaskbar() {
        try {
            IntPtr tray = FindWindow("Shell_TrayWnd", null);
            if (tray != IntPtr.Zero) {
                ShowWindow(tray, SW_HIDE);
            }

            IntPtr secTray = FindWindow("Shell_SecondaryTrayWnd", null);
            if (secTray != IntPtr.Zero) {
                ShowWindow(secTray, SW_HIDE);
            }

            IntPtr taskView = FindWindow("MultitaskingViewFrame", null);
            if (taskView != IntPtr.Zero) ShowWindow(taskView, SW_HIDE);
        } catch {}
    }

    public static void ShowTaskbar() {
        try {
            IntPtr tray = FindWindow("Shell_TrayWnd", null);
            if (tray != IntPtr.Zero) {
                EnableWindow(tray, true);
                ShowWindow(tray, SW_SHOW);
                ShowWindow(tray, SW_RESTORE);
            }

            IntPtr secTray = FindWindow("Shell_SecondaryTrayWnd", null);
            if (secTray != IntPtr.Zero) {
                EnableWindow(secTray, true);
                ShowWindow(secTray, SW_SHOW);
                ShowWindow(secTray, SW_RESTORE);
            }

            IntPtr island = FindWindow("XamlExplorerHostIslandWindow", null);
            if (island != IntPtr.Zero) {
                EnableWindow(island, true);
                ShowWindow(island, SW_SHOW);
            }

            IntPtr startBtn = FindWindow("Button", "Start");
            if (startBtn != IntPtr.Zero) {
                EnableWindow(startBtn, true);
                ShowWindow(startBtn, SW_SHOW);
                ShowWindow(startBtn, SW_RESTORE);
            }

            IntPtr startMenu = FindWindow("Windows.UI.Core.CoreWindow", "Start");
            if (startMenu != IntPtr.Zero) {
                EnableWindow(startMenu, true);
                ShowWindow(startMenu, SW_SHOW);
            }

            // Khởi động lại nhẹ nhàng tiến trình StartMenuExperienceHost trong luồng ngầm (không chặn UI)
            System.Threading.ThreadPool.QueueUserWorkItem(_ => {
                try {
                    foreach (var p in Process.GetProcessesByName("StartMenuExperienceHost")) {
                        p.Kill();
                    }
                } catch {}
            });
        } catch {}
    }

    [STAThread]
    public static void Main(string[] args) {
        if (args != null && args.Length > 0) {
            string cmd = args[0].ToLowerInvariant();
            if (cmd == "--restore" || cmd == "--show" || cmd == "-r" || cmd == "restore" || cmd == "show") {
                ShowTaskbar();
                return;
            }
        }

        _hookID = SetHook(_proc);
        HideTaskbar();

        AppDomain.CurrentDomain.ProcessExit += (s, e) => {
            _stopping = true;
            ShowTaskbar();
            if (_hookID != IntPtr.Zero) UnhookWindowsHookEx(_hookID);
        };

        // Watchdog thread: liên tục khóa thanh taskbar, dập tắt Task View và dập tắt cửa sổ Search/Start Menu/Copilot
        System.Threading.Thread watchdogThread = new System.Threading.Thread(() => {
            while (!_stopping) {
                try {
                    HideTaskbar();

                    IntPtr taskView = FindWindow("MultitaskingViewFrame", null);
                    if (taskView != IntPtr.Zero && IsWindowVisible(taskView)) {
                        ShowWindow(taskView, SW_HIDE);
                    }

                    // Dập tắt lập tức mọi cửa sổ Search / Start Menu / Copilot flyout
                    IntPtr searchWnd = FindWindow("Windows.UI.Core.CoreWindow", "Search");
                    if (searchWnd != IntPtr.Zero && IsWindowVisible(searchWnd)) {
                        ShowWindow(searchWnd, SW_HIDE);
                    }

                    IntPtr searchVi = FindWindow("Windows.UI.Core.CoreWindow", "Tìm kiếm");
                    if (searchVi != IntPtr.Zero && IsWindowVisible(searchVi)) {
                        ShowWindow(searchVi, SW_HIDE);
                    }

                    IntPtr startWnd = FindWindow("Windows.UI.Core.CoreWindow", "Start");
                    if (startWnd != IntPtr.Zero && IsWindowVisible(startWnd)) {
                        ShowWindow(startWnd, SW_HIDE);
                    }

                    IntPtr searchPane = FindWindow("SearchPane", null);
                    if (searchPane != IntPtr.Zero && IsWindowVisible(searchPane)) {
                        ShowWindow(searchPane, SW_HIDE);
                    }
                } catch {}
                System.Threading.Thread.Sleep(50);
            }
        });
        watchdogThread.IsBackground = true;
        watchdogThread.Start();

        // Background thread to listen for parent exit or STOP on stdin
        System.Threading.Thread stdinThread = new System.Threading.Thread(() => {
            try {
                Console.ReadLine();
            } catch {}
            _stopping = true;
            ShowTaskbar();
            if (_hookID != IntPtr.Zero) UnhookWindowsHookEx(_hookID);
            Application.Exit();
            Environment.Exit(0);
        });
        stdinThread.IsBackground = true;
        stdinThread.Start();

        Application.Run();

        _stopping = true;
        ShowTaskbar();
        if (_hookID != IntPtr.Zero) UnhookWindowsHookEx(_hookID);
    }

    private static IntPtr SetHook(LowLevelKeyboardProc proc) {
        using (Process curProcess = Process.GetCurrentProcess())
        using (ProcessModule curModule = curProcess.MainModule) {
            return SetWindowsHookEx(WH_KEYBOARD_LL, proc, GetModuleHandle(curModule.ModuleName), 0);
        }
    }

    private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam) {
        if (nCode >= 0) {
            KBDLLHOOKSTRUCT hookStruct = (KBDLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(KBDLLHOOKSTRUCT));
            uint vk = hookStruct.vkCode;
            bool altDown = (hookStruct.flags & 0x20) != 0;

            // 0. Luôn cho phép phím chụp màn hình PrtSc (VK_SNAPSHOT = 0x2C)
            if (vk == 0x2C) {
                return CallNextHookEx(_hookID, nCode, wParam, lParam);
            }

            // 1. Chặn phím Windows (LWIN, RWIN) & Context Menu (APPS) tuyệt đối
            // Ngăn chặn Start Menu, Cortana, Windows Search, Task View (Win+Tab), Win+D (vuốt trackpad)
            if (vk == VK_LWIN || vk == VK_RWIN || vk == VK_APPS) {
                return (IntPtr)1;
            }

            // 2. Chặn TẤT CẢ tổ hợp khi đang giữ phím Windows (Win+S, Win+C, Win+Tab, Win+D, Win+E, Win+R...)
            bool winDown = (GetAsyncKeyState(VK_LWIN) & 0x8000) != 0 || 
                           (GetAsyncKeyState(VK_RWIN) & 0x8000) != 0;
            if (winDown) {
                return (IntPtr)1;
            }

            // 3. Chặn TẤT CẢ phím ALT (0x12, 0xA4, 0xA5) và bất kỳ tổ hợp nào khi giữ ALT
            // (Alt, Alt+Tab, Alt+F4, Alt+Esc, Alt+Space, Alt mở menubar...)
            if (vk == 0x12 || vk == 0xA4 || vk == 0xA5 || altDown) {
                return (IntPtr)1;
            }

            // 4. Chặn toàn bộ phím chức năng F1 đến F24 (0x70 đến 0x87)
            // LƯU Ý ĐẶC BIỆT: Phím cứng Copilot trên Windows 11 gửi mã VK_F23 = 0x86 (hoặc LeftShift + Win + F23).
            // Chặn 0x86 và toàn dải 0x70-0x87 đảm bảo triệt tiêu hoàn toàn phím Copilot & Windows Search flyout!
            if ((vk >= 0x70 && vk <= 0x87) || vk == 0x86) {
                return (IntPtr)1;
            }

            // 5. Chặn phím ESC (0x1B) để không thoát fullscreen / start menu
            if (vk == VK_ESCAPE) {
                return (IntPtr)1;
            }

            // 5. Kiểm tra khi giữ phím CTRL:
            // Chỉ cho phép:
            // - Ctrl + C (0x43)
            // - Ctrl + V (0x56)
            // - Ctrl + A (0x41)
            // - Ctrl + X (0x58)
            // - Ctrl + Z (0x5A)
            // - Ctrl + Q (0x51 - Thoát khẩn cấp Pomodoro)
            bool ctrlDown = (GetAsyncKeyState(0x11) & 0x8000) != 0 ||
                            (GetAsyncKeyState(0xA2) & 0x8000) != 0 ||
                            (GetAsyncKeyState(0xA3) & 0x8000) != 0;

            if (ctrlDown) {
                // Cho phép chính phím Ctrl để kích hoạt tổ hợp
                if (vk == 0x11 || vk == 0xA2 || vk == 0xA3) {
                    return CallNextHookEx(_hookID, nCode, wParam, lParam);
                }

                // Kiểm tra ký tự đi kèm Ctrl:
                bool isAllowedCtrlCombo = (vk == 0x43 || vk == 0x56 || vk == 0x41 || 
                                           vk == 0x58 || vk == 0x5A || vk == 0x51);
                if (!isAllowedCtrlCombo) {
                    return (IntPtr)1; // Chặn triệt để mọi Ctrl khác (Ctrl+W, Ctrl+R, Ctrl+N, Ctrl+P, Ctrl+Shift+Esc...)
                }
            }
        }
        return CallNextHookEx(_hookID, nCode, wParam, lParam);
    }
}
