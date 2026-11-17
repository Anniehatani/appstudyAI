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

    public static void HideTaskbar() {
        try {
            IntPtr tray = FindWindow("Shell_TrayWnd", null);
            if (tray != IntPtr.Zero) {
                ShowWindow(tray, SW_HIDE);
                EnableWindow(tray, false);
            }

            IntPtr secTray = FindWindow("Shell_SecondaryTrayWnd", null);
            if (secTray != IntPtr.Zero) {
                ShowWindow(secTray, SW_HIDE);
                EnableWindow(secTray, false);
            }

            IntPtr startBtn = FindWindow("Button", "Start");
            if (startBtn != IntPtr.Zero) {
                ShowWindow(startBtn, SW_HIDE);
                EnableWindow(startBtn, false);
            }

            // Windows 11 Start Menu & Search Core Windows
            IntPtr startMenu = FindWindow("Windows.UI.Core.CoreWindow", "Start");
            if (startMenu != IntPtr.Zero) ShowWindow(startMenu, SW_HIDE);

            IntPtr startIsland = FindWindow("XamlExplorerHostIslandWindow", null);
            if (startIsland != IntPtr.Zero) ShowWindow(startIsland, SW_HIDE);

            IntPtr searchFlyout = FindWindow("Windows.UI.Core.CoreWindow", "Search");
            if (searchFlyout != IntPtr.Zero) ShowWindow(searchFlyout, SW_HIDE);

            IntPtr taskView = FindWindow("MultitaskingViewFrame", null);
            if (taskView != IntPtr.Zero) ShowWindow(taskView, SW_HIDE);

            IntPtr overflowIsland = FindWindow("TopLevelWindowForOverflowXamlIsland", null);
            if (overflowIsland != IntPtr.Zero) ShowWindow(overflowIsland, SW_HIDE);
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

            IntPtr startBtn = FindWindow("Button", "Start");
            if (startBtn != IntPtr.Zero) {
                EnableWindow(startBtn, true);
                ShowWindow(startBtn, SW_SHOW);
                ShowWindow(startBtn, SW_RESTORE);
            }
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

        // Watchdog thread: liên tục khóa thanh taskbar và dập tắt Task View (3 ngón vuốt trackpad)
        System.Threading.Thread watchdogThread = new System.Threading.Thread(() => {
            while (!_stopping) {
                try {
                    HideTaskbar();

                    IntPtr taskView = FindWindow("MultitaskingViewFrame", null);
                    if (taskView != IntPtr.Zero) {
                        ShowWindow(taskView, SW_HIDE);
                    }
                } catch {}
                System.Threading.Thread.Sleep(80);
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

            // 2. Chặn TẤT CẢ phím ALT (0x12, 0xA4, 0xA5) và bất kỳ tổ hợp nào khi giữ ALT
            // (Alt, Alt+Tab, Alt+F4, Alt+Esc, Alt+Space, Alt mở menubar...)
            if (vk == 0x12 || vk == 0xA4 || vk == 0xA5 || altDown) {
                return (IntPtr)1;
            }

            // 3. Chặn toàn bộ phím chức năng F1 đến F12 (0x70 đến 0x7B)
            if (vk >= 0x70 && vk <= 0x7B) {
                return (IntPtr)1;
            }

            // 4. Chặn phím ESC (0x1B) để không thoát fullscreen / start menu
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
