"use strict";

/**
 * cookies.js — Đọc cookie phiên IU từ partition Electron.
 *
 * NHIEM VU: duy nhat 1 viec — doc toan bo cookie cua portal tu session
 * persist va tra ve dang dung duoc cho fetch. Khong mo cua so, khong login.
 *
 * NGUON DU LIEU:
 *  - CMC_PARTITION, IU_URL: login/constants.js.
 *  - getElectron(): login/window.js (can Electron MAIN process).
 *  - Luong doc cookie trich tu
 *    thoiGianBieu/src/main/sync/browserLogin.js (extractCookieMap / readCookies).
 *  - Doc 2 lan: theo url "https://cmcu.edu.vn" va theo IU_URL, gop lai khử
 *    trùng theo (name|domain|path) — phong khi cookie set theo host con.
 *
 * CACH DUNG:
 *   const { readIuCookies } = require("./cookies");
 *   const jar = await readIuCookies(); // { map, cookie, count }
 *   fetch(url, { headers: { Cookie: jar.cookie } });
 */

const { IU_URL, CMC_PARTITION } = require("./constants");
const { getElectron } = require("./window");

// Đọc toàn bộ cookie IU từ session persist -> { map, cookie, count }
async function readIuCookies(win) {
    const { session } = getElectron();
    const ses = session.fromPartition(CMC_PARTITION);
    const urls = [
        "https://cmcu.edu.vn",
        IU_URL,
        "https://iu.cmcu.edu.vn",
        "https://iu.cmcu.edu.vn/congthongtin/login.aspx",
        "https://iu.cmcu.edu.vn/sinhvienapi/api"
    ];
    const map = {};
    for (const u of urls) {
        try {
            const list = await ses.cookies.get({ url: u });
            for (const c of list) {
                if (c && c.name) map[c.name] = c.value;
            }
        } catch {}
    }
    try {
        const all = await ses.cookies.get({});
        for (const c of all) {
            if (c && c.name && (!c.domain || c.domain.includes("cmcu.edu.vn") || c.name === "ASP.NET_SessionId" || c.name.startsWith(".ASPX"))) {
                map[c.name] = c.value;
            }
        }
    } catch {}
    if (win && !win.isDestroyed()) {
        try {
            const docCookie = await win.webContents.executeJavaScript("document.cookie", true);
            if (docCookie && typeof docCookie === "string") {
                const parts = docCookie.split(";");
                for (const p of parts) {
                    const idx = p.indexOf("=");
                    if (idx > 0) {
                        const k = p.slice(0, idx).trim();
                        const v = p.slice(idx + 1).trim();
                        if (k && !map[k]) map[k] = v;
                    }
                }
            }
        } catch {}
    }
    const cookie = Object.entries(map).map(([k, v]) => `${k}=${v}`).join("; ");
    return { map, cookie, count: Object.keys(map).length };
}

// Xoa sach storage cua partition (cookie, localStorage...) — dung khi logout.
async function clearSession() {
    try {
        const { session } = getElectron();
        const ses = session.fromPartition(CMC_PARTITION);
        await ses.clearStorageData();
        try { await ses.clearCache(); } catch { /* ignore */ }
    } catch { /* ignore */ }
}

module.exports = { readIuCookies, clearSession };
