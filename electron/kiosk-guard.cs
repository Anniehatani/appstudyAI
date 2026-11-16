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
    private static extern short GetKeyState(int nVirtKey);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool UnhookWindowsHookEx(IntPtr hhk);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr GetModuleHandle(string lpModuleName);

    public static void HideTaskbar() {
        try {
            IntPtr tray = FindWindow("Shell_TrayWnd", null);
            if (tray != IntPtr.Zero) ShowWindow(tray, SW_HIDE);

            IntPtr secTray = FindWindow("Shell_SecondaryTrayWnd", null);
            if (secTray != IntPtr.Zero) ShowWindow(secTray, SW_HIDE);

            IntPtr startBtn = FindWindow("Button", "Start");
            if (startBtn != IntPtr.Zero) ShowWindow(startBtn, SW_HIDE);
        } catch {}
    }

    public static void ShowTaskbar() {
        try {
            IntPtr tray = FindWindow("Shell_TrayWnd", null);
            if (tray != IntPtr.Zero) ShowWindow(tray, SW_SHOW);

            IntPtr secTray = FindWindow("Shell_SecondaryTrayWnd", null);
            if (secTray != IntPtr.Zero) ShowWindow(secTray, SW_SHOW);

            IntPtr startBtn = FindWindow("Button", "Start");
            if (startBtn != IntPtr.Zero) ShowWindow(startBtn, SW_SHOW);
        } catch {}
    }

    [STAThread]
    public static void Main(string[] args) {
        _hookID = SetHook(_proc);
        HideTaskbar();

        AppDomain.CurrentDomain.ProcessExit += (s, e) => {
            ShowTaskbar();
            if (_hookID != IntPtr.Zero) UnhookWindowsHookEx(_hookID);
        };

        // Background thread to listen for parent exit or STOP on stdin
        System.Threading.Thread stdinThread = new System.Threading.Thread(() => {
            try {
                Console.ReadLine();
            } catch {}
            ShowTaskbar();
            if (_hookID != IntPtr.Zero) UnhookWindowsHookEx(_hookID);
            Environment.Exit(0);
        });
        stdinThread.IsBackground = true;
        stdinThread.Start();

        Application.Run();

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

            // 1. Chặn phím Windows (LWIN, RWIN) tuyệt đối để không mở Start Menu / Taskbar
            if (vk == VK_LWIN || vk == VK_RWIN) {
                return (IntPtr)1;
            }
            if (vk == VK_APPS) {
                return (IntPtr)1;
            }
            // 2. Block Alt + Tab
            if (vk == VK_TAB && altDown) {
                return (IntPtr)1;
            }
            // 3. Block Alt + Esc
            if (vk == VK_ESCAPE && altDown) {
                return (IntPtr)1;
            }
            // 4. Block Ctrl + Esc (mở Start Menu)
            if (vk == VK_ESCAPE && (Control.ModifierKeys & Keys.Control) != 0) {
                return (IntPtr)1;
            }
        }
        return CallNextHookEx(_hookID, nCode, wParam, lParam);
    }
}
