"use strict";

/**
 * session.js — Tu lay ID phien sau khi login.
 *
 * NHIEM VU: 1 ham duy nhat laySession(win) -> { userId, chucNangId,
 * nguoiHocId, iM, appId, tokenJWT }. Khong dung payload, khong ma hoa, khong goi mang.
 *
 * NGUON DU LIEU (bien edu.system tren trang web da login):
 *  - userId     <- edu.system.userId            (server cap luc login)
 *  - chucNangId <- edu.system.strChucNang_Id    (man hinh dang mo)
 *  - iM         <- edu.system.iM                 (mac dinh "AzzSystem")
 *  - appId      <- edu.system.appId
 *  - tokenJWT   <- edu.system.tokenJWT          (server cap luc login,
 *      portal gui kem header "Authorization: Bearer <tokenJWT>" trong moi
 *      makeRequest — thieu la API tra 401. Nguon: ham makeRequest trong
 *      portalSrc/loi/Core_systemroot.js:
 *        h = "Bearer " + s.tokenJWT; s.tokenJWT && (m.headers = { Authorization: h }))
 *  Luong goc: ham AFG() trong portalSrc/loi/pagination.js gan cac bien nay
 *  sau khi giai chuoi AXYZCLRVN() (portalSrc/loi/Index.aspx).
 *  Cach lay thu cong (node thuong, khong co Electron): mo trang IU, bam F12,
 *  go edu.system.userId va edu.system.strChucNang_Id.
 *
 * CACH DUNG (trong Electron, sau loginIU):
 *   const { getIuWindow } = require("../login");
 *   const { laySession } = require("../payload"); // hoac require("./session")
 *   const session = await laySession(getIuWindow());
 */

const { IM_MAC_DINH } = require("../crypto");

async function laySession(win, retryTimeoutMs = 15000) {
    // BrowserWindow cua Electron — doc truc tiep tu trang web.
    if (win && win.webContents && typeof win.webContents.executeJavaScript === "function") {
        const start = Date.now();
        while (Date.now() - start < retryTimeoutMs) {
            if (win.isDestroyed()) throw new Error("Cửa sổ IU đã bị đóng.");
            try {
                const raw = await win.webContents.executeJavaScript(
                    "(() => { try { " +
                    "  var eduObj = (typeof edu !== 'undefined' && edu) || window.edu || {}; " +
                    "  var s = eduObj.system || {}; " +
                    "  var token = s.tokenJWT || (window.sessionStorage && window.sessionStorage.getItem('tokenJWT')) || (window.localStorage && window.localStorage.getItem('tokenJWT')) || ''; " +
                    "  var uid = s.userId || ''; " +
                    "  var name = (document.querySelector('.user-name, #lblTenDangNhap, #lblHoTen, #lblUser') ? document.querySelector('.user-name, #lblTenDangNhap, #lblHoTen, #lblUser').innerText : '').trim(); " +
                    "  return JSON.stringify({ " +
                    "    userId: uid, " +
                    "    chucNangId: s.strChucNang_Id || '20160101', " +
                    "    iM: s.iM || 'AzzSystem', " +
                    "    appId: s.appId || 'Portal_SinhVien', " +
                    "    tokenJWT: token, " +
                    "    hoTen: name " +
                    "  }); " +
                    "} catch (e) { return JSON.stringify({ error: String((e && e.message) || e) }); } })()",
                    true
                );
                const s = JSON.parse(raw);
                if (s && s.userId) {
                    return {
                        userId: s.userId,
                        chucNangId: s.chucNangId || "20160101",
                        nguoiHocId: s.userId,
                        iM: s.iM || IM_MAC_DINH,
                        appId: s.appId || "Portal_SinhVien",
                        tokenJWT: s.tokenJWT || "",
                        hoTen: s.hoTen || ""
                    };
                }
            } catch {}
            await new Promise((r) => setTimeout(r, 600));
        }
        throw new Error("Trang IU chưa khởi tạo xong thông tin phiên (edu.system.userId rỗng). Vui lòng thử lại!");
    }
    // Khong co Electron — khong tu lay duoc, huong dan lay tay.
    throw new Error(
        "laySession can BrowserWindow Electron (getIuWindow() sau loginIU()). " +
        "Neu chay node thuong: mo trang IU (F12) go " +
        "`edu.system.userId` va `edu.system.strChucNang_Id` roi tu tao " +
        "{ userId, chucNangId } truyen vao buildPayload()."
    );
}

module.exports = { laySession };
