#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define EVENT_NAME L"Local\\3TG_StudyGuardStopEvent"

static HHOOK g_hHook = NULL;
static volatile BOOL g_stopping = FALSE;
static HANDLE g_hStopEvent = NULL;

static void ensure_desktop(void) {
    HDESK hDesk = OpenDesktopW(L"Default", 0, FALSE, GENERIC_ALL);
    if (hDesk) {
        SetThreadDesktop(hDesk);
        CloseDesktop(hDesk);
    }
}

void restore_taskbar(void) {
    g_stopping = TRUE;
    ensure_desktop();

    HWND tray = FindWindowW(L"Shell_TrayWnd", NULL);
    if (tray) {
        EnableWindow(tray, TRUE);
        ShowWindow(tray, SW_SHOW);
        ShowWindow(tray, SW_RESTORE);
        SetWindowPos(tray, NULL, 0, 0, 0, 0,
                     SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE | SWP_FRAMECHANGED | SWP_SHOWWINDOW);
    }

    HWND secTray = FindWindowW(L"Shell_SecondaryTrayWnd", NULL);
    if (secTray) {
        EnableWindow(secTray, TRUE);
        ShowWindow(secTray, SW_SHOW);
        ShowWindow(secTray, SW_RESTORE);
        SetWindowPos(secTray, NULL, 0, 0, 0, 0,
                     SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE | SWP_FRAMECHANGED | SWP_SHOWWINDOW);
    }

    HWND island = FindWindowW(L"XamlExplorerHostIslandWindow", NULL);
    if (island) {
        EnableWindow(island, TRUE);
        ShowWindow(island, SW_SHOW);
        SetWindowPos(island, NULL, 0, 0, 0, 0,
                     SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE | SWP_FRAMECHANGED | SWP_SHOWWINDOW);
    }

    HWND startBtn = FindWindowW(L"Button", L"Start");
    if (startBtn) {
        EnableWindow(startBtn, TRUE);
        ShowWindow(startBtn, SW_SHOW);
        ShowWindow(startBtn, SW_RESTORE);
    }

    HWND startMenu = FindWindowW(L"Windows.UI.Core.CoreWindow", L"Start");
    if (startMenu) {
        EnableWindow(startMenu, TRUE);
        ShowWindow(startMenu, SW_SHOW);
    }
}

void hide_taskbar(void) {
    if (g_stopping) return;
    ensure_desktop();

    HWND tray = FindWindowW(L"Shell_TrayWnd", NULL);
    if (tray) ShowWindow(tray, SW_HIDE);

    HWND secTray = FindWindowW(L"Shell_SecondaryTrayWnd", NULL);
    if (secTray) ShowWindow(secTray, SW_HIDE);

    HWND taskView = FindWindowW(L"MultitaskingViewFrame", NULL);
    if (taskView) ShowWindow(taskView, SW_HIDE);

    HWND searchWnd = FindWindowW(L"Windows.UI.Core.CoreWindow", L"Search");
    if (searchWnd && IsWindowVisible(searchWnd)) ShowWindow(searchWnd, SW_HIDE);

    HWND searchVi = FindWindowW(L"Windows.UI.Core.CoreWindow", L"Tìm kiếm");
    if (searchVi && IsWindowVisible(searchVi)) ShowWindow(searchVi, SW_HIDE);

    HWND startWnd = FindWindowW(L"Windows.UI.Core.CoreWindow", L"Start");
    if (startWnd && IsWindowVisible(startWnd)) ShowWindow(startWnd, SW_HIDE);
}

static LRESULT CALLBACK LowLevelKeyboardProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode >= 0 && !g_stopping) {
        KBDLLHOOKSTRUCT *p = (KBDLLHOOKSTRUCT *)lParam;
        DWORD vk = p->vkCode;
        BOOL altDown = (p->flags & LLKHF_ALTDOWN) != 0;

        // 0. Luôn cho phép PrtSc (0x2C)
        if (vk == VK_SNAPSHOT) {
            return CallNextHookEx(g_hHook, nCode, wParam, lParam);
        }

        // 1. Chặn phím Windows (LWIN, RWIN) & Context Menu (APPS) tuyệt đối
        if (vk == VK_LWIN || vk == VK_RWIN || vk == VK_APPS) {
            return 1;
        }

        // 2. Chặn TẤT CẢ tổ hợp khi đang giữ phím Windows (Win+S, Win+C, Win+Tab, Win+D, Win+E, Win+R...)
        BOOL winDown = (GetAsyncKeyState(VK_LWIN) & 0x8000) != 0 ||
                       (GetAsyncKeyState(VK_RWIN) & 0x8000) != 0;
        if (winDown) {
            return 1;
        }

        // 3. Chặn TẤT CẢ phím ALT (VK_MENU, VK_LMENU, VK_RMENU) và bất kỳ tổ hợp nào khi giữ ALT
        if (vk == VK_MENU || vk == VK_LMENU || vk == VK_RMENU || altDown) {
            return 1;
        }

        // 4. Chặn toàn bộ phím chức năng F1 đến F24 (0x70 đến 0x87)
        // Lưu ý: Phím Copilot gửi mã VK_F23 = 0x86
        if (vk >= VK_F1 && vk <= VK_F24) {
            return 1;
        }

        // 5. Chặn phím ESC (0x1B) để không thoát fullscreen / start menu
        if (vk == VK_ESCAPE) {
            return 1;
        }

        // 6. Kiểm tra khi giữ phím CTRL:
        // Chỉ cho phép:
        // - Ctrl + C, Ctrl + V, Ctrl + A, Ctrl + X, Ctrl + Z, Ctrl + Q
        // - Zoom: Ctrl + (+), Ctrl + (-), Ctrl + (=), Ctrl + 0
        BOOL ctrlDown = (GetAsyncKeyState(VK_CONTROL) & 0x8000) != 0 ||
                        (GetAsyncKeyState(VK_LCONTROL) & 0x8000) != 0 ||
                        (GetAsyncKeyState(VK_RCONTROL) & 0x8000) != 0;
        if (ctrlDown) {
            if (vk == VK_CONTROL || vk == VK_LCONTROL || vk == VK_RCONTROL) {
                return CallNextHookEx(g_hHook, nCode, wParam, lParam);
            }
            BOOL isAllowedCtrl = (vk == 'C' || vk == 'c' ||
                                  vk == 'V' || vk == 'v' ||
                                  vk == 'A' || vk == 'a' ||
                                  vk == 'X' || vk == 'x' ||
                                  vk == 'Z' || vk == 'z' ||
                                  vk == 'Q' || vk == 'q' ||
                                  vk == VK_OEM_PLUS || vk == VK_OEM_MINUS ||
                                  vk == '0' || vk == VK_ADD || vk == VK_SUBTRACT);
            if (!isAllowedCtrl) {
                return 1;
            }
        }
    }
    return CallNextHookEx(g_hHook, nCode, wParam, lParam);
}

static DWORD WINAPI ParentWatchdogThread(LPVOID lpParam) {
    DWORD parentPid = (DWORD)(uintptr_t)lpParam;
    if (parentPid > 0) {
        HANDLE hParent = OpenProcess(SYNCHRONIZE, FALSE, parentPid);
        if (hParent) {
            WaitForSingleObject(hParent, INFINITE);
            CloseHandle(hParent);
        }
    }
    restore_taskbar();
    if (g_hHook) UnhookWindowsHookEx(g_hHook);
    ExitProcess(0);
    return 0;
}

static DWORD WINAPI StopEventThread(LPVOID lpParam) {
    HANDLE hStopEvent = (HANDLE)lpParam;
    WaitForSingleObject(hStopEvent, INFINITE);
    restore_taskbar();
    if (g_hHook) UnhookWindowsHookEx(g_hHook);
    ExitProcess(0);
    return 0;
}

static DWORD WINAPI StdinThread(LPVOID lpParam) {
    (void)lpParam;
    char buf[128];
    if (fgets(buf, sizeof(buf), stdin)) {
        // Any message received on stdin -> stop
    }
    restore_taskbar();
    if (g_hHook) UnhookWindowsHookEx(g_hHook);
    ExitProcess(0);
    return 0;
}

static DWORD WINAPI WatchdogThread(LPVOID lpParam) {
    (void)lpParam;
    while (!g_stopping) {
        hide_taskbar();
        Sleep(100);
    }
    return 0;
}

static BOOL WINAPI ConsoleCtrlHandler(DWORD dwCtrlType) {
    (void)dwCtrlType;
    restore_taskbar();
    if (g_hHook) UnhookWindowsHookEx(g_hHook);
    return FALSE;
}

int main(int argc, char **argv) {
    DWORD parentPid = 0;

    for (int i = 1; i < argc; i++) {
        if (_stricmp(argv[i], "--restore") == 0 ||
            _stricmp(argv[i], "-r") == 0 ||
            _stricmp(argv[i], "restore") == 0) {
            restore_taskbar();
            return 0;
        }
        if (_stricmp(argv[i], "--stop") == 0 ||
            _stricmp(argv[i], "-s") == 0 ||
            _stricmp(argv[i], "stop") == 0) {
            HANDLE hEv = OpenEventW(EVENT_MODIFY_STATE, FALSE, EVENT_NAME);
            if (hEv) {
                SetEvent(hEv);
                CloseHandle(hEv);
            }
            restore_taskbar();
            return 0;
        }
        if ((_stricmp(argv[i], "--parent-pid") == 0 || _stricmp(argv[i], "-p") == 0) && i + 1 < argc) {
            parentPid = (DWORD)atoi(argv[++i]);
        }
    }

    SetConsoleCtrlHandler(ConsoleCtrlHandler, TRUE);
    atexit(restore_taskbar);

    // Tạo Stop Event dùng để dừng tức thời từ bất kỳ tiến trình nào
    g_hStopEvent = CreateEventW(NULL, TRUE, FALSE, EVENT_NAME);
    if (g_hStopEvent) {
        CreateThread(NULL, 0, StopEventThread, g_hStopEvent, 0, NULL);
    }

    // Luồng giám sát tiến trình cha (Electron)
    if (parentPid > 0) {
        CreateThread(NULL, 0, ParentWatchdogThread, (LPVOID)(uintptr_t)parentPid, 0, NULL);
    }

    // Luồng lắng nghe stdin từ Electron
    CreateThread(NULL, 0, StdinThread, NULL, 0, NULL);

    // Kích hoạt hook bàn phím
    HINSTANCE hInst = GetModuleHandle(NULL);
    g_hHook = SetWindowsHookEx(WH_KEYBOARD_LL, LowLevelKeyboardProc, hInst, 0);

    // Ẩn taskbar ban đầu và chạy watchdog thread
    hide_taskbar();
    CreateThread(NULL, 0, WatchdogThread, NULL, 0, NULL);

    // Báo GUARD_READY ra stdout cho Electron
    printf("GUARD_READY\n");
    fflush(stdout);

    // Message pump cho LowLevel Keyboard Hook
    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0) > 0) {
        if (g_stopping) break;
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    restore_taskbar();
    if (g_hHook) UnhookWindowsHookEx(g_hHook);
    return 0;
}
