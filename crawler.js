/**
 * ===================================================================================
 * BỘ CÀO DỮ LIỆU TẬP TRUNG: EDUX & IU (CMC UNIVERSITY) - CRAWLER STANDALONE
 * ===================================================================================
 * Tệp độc lập (all-in-one), không phụ thuộc thư mục con, dùng được cả:
 *   1. Import làm module trong code:
 *        const { edux, iu } = require('./crawler');
 *   2. Chạy trực tiếp từ dòng lệnh (CLI):
 *        node crawler.js --help
 *        node crawler.js edux login --email ... --password ...
 *        node crawler.js edux tasks --cookie "..." --out tasks.json
 *        node crawler.js iu test-crypto
 *        node crawler.js iu pull --cookie "..." --token "..." --out iu_data.json
 * ===================================================================================
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ===================================================================================
// 1. CỤM CÀO DỮ LIỆU EDUX (edux.cmcu.edu.vn)
// ===================================================================================

const EDUX_ORIGIN = (process.env.EDUX_ORIGIN || "https://edux.cmcu.edu.vn").replace(/\/+$/, "");
const EDUX_API_BASE = process.env.EDUX_API_BASE || `${EDUX_ORIGIN}/api`;
const EDUX_TIMEOUT_MS = Number(process.env.EDUX_TIMEOUT_MS) > 0 ? Number(process.env.EDUX_TIMEOUT_MS) : 25000;

const THUOC_TINH_COOKIE = new Set([
  "path", "domain", "expires", "max-age", "samesite", "secure",
  "httponly", "priority", "partitioned",
]);

/**
 * Chuẩn hoá cookie thô thành chuỗi `name=value; name=value`
 */
function cookieFrom(rawCookie) {
  if (!rawCookie) return "";
  const pairs = [];
  const seen = new Set();
  const cleaned = String(rawCookie).replace(/^set-cookie:\s*/gim, "");
  for (const match of cleaned.matchAll(/(?:^|[;,\r\n]\s*)([^=;,\s]+)=([^;,\r\n]*)/g)) {
    const key = match[1].trim();
    if (!key || THUOC_TINH_COOKIE.has(key.toLowerCase()) || seen.has(key)) continue;
    seen.add(key);
    pairs.push(`${key}=${match[2].trim()}`);
  }
  return pairs.join("; ");
}

function unwrap(value) {
  let result = value;
  while (result && typeof result === "object" && !Array.isArray(result) && Object.hasOwn(result, "data")) {
    result = result.data;
  }
  return result;
}

function asList(value, preferredKeys = []) {
  const root = unwrap(value);
  if (Array.isArray(root)) return root;
  if (!root || typeof root !== "object") return [];

  const queue = [root];
  const visited = new Set();
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || visited.has(current)) continue;
    visited.add(current);
    for (const key of preferredKeys) {
      if (Array.isArray(current[key])) return current[key];
    }
    for (const child of Object.values(current)) {
      if (child && typeof child === "object" && !Array.isArray(child)) queue.push(child);
    }
  }
  return [];
}

function firstValue(object, keys) {
  if (!object || typeof object !== "object") return undefined;
  for (const key of keys) {
    const value = object[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function cleanText(value) {
  if (value === null || value === undefined) return "";
  const text = typeof value === "string" ? value : String(value);
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();
}

function isoTime(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string" && Number.isNaN(Number(value))) {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
  }
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return new Date(seconds * 1000).toISOString();
}

/**
 * Gọi API EduX với Cookie xác thực
 */
async function goiEdux(pathOrUrl, options = {}) {
  const url = /^https?:\/\//i.test(pathOrUrl)
    ? pathOrUrl
    : `${EDUX_API_BASE}/${String(pathOrUrl).replace(/^\/+/, "")}`;

  const method = (options.method || "GET").toUpperCase();
  const headers = {
    Accept: "application/json",
    Origin: EDUX_ORIGIN,
    Referer: `${EDUX_ORIGIN}/`,
    ...(options.headers || {}),
  };

  const cookie = cookieFrom(options.cookie || process.env.EDUX_COOKIE || "");
  if (cookie) headers.Cookie = cookie;

  let body;
  if (options.body !== undefined && options.body !== null) {
    if (typeof options.body === "string") {
      body = options.body;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }
  }

  const timeout = options.timeout || EDUX_TIMEOUT_MS;
  const res = await fetch(url, {
    method,
    headers,
    body,
    signal: AbortSignal.timeout(timeout),
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(`EduX HTTP ${res.status}: ${json?.detail || json?.message || text || "Lỗi không xác định"}`);
    err.status = res.status;
    err.data = json;
    throw err;
  }

  return json;
}

/**
 * Thử lần lượt các route (dùng cho các API có nhiều biến thể path)
 */
async function thuLanLuotEdux(routes, options = {}) {
  for (const r of routes) {
    try {
      const data = await goiEdux(r, options);
      if (data) return { route: r, data };
    } catch {
      // Bỏ qua thử route tiếp theo
    }
  }
  return { route: null, data: null };
}

/**
 * Đăng nhập EDUX bằng email và mật khẩu
 */
async function loginEdux({ email, password } = {}) {
  const mail = String(email || process.env.EDUX_EMAIL || "").trim();
  const pass = String(password || process.env.EDUX_PASSWORD || "");

  if (!mail || !pass) {
    throw new Error("Email và mật khẩu EDUX là bắt buộc.");
  }

  const res = await fetch(`${EDUX_API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Origin: EDUX_ORIGIN,
      Referer: `${EDUX_ORIGIN}/`,
    },
    body: JSON.stringify({ email: mail, password: pass }),
    signal: AbortSignal.timeout(EDUX_TIMEOUT_MS),
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Đăng nhập EduX thất bại: phản hồi không phải JSON (HTTP ${res.status}).`);
  }

  if (!res.ok) {
    const msg = data?.detail || data?.message || "Kiểm tra lại tài khoản hoặc mật khẩu";
    const err = new Error(`Đăng nhập EduX thất bại (HTTP ${res.status}): ${msg}`);
    err.status = res.status === 403 ? 401 : res.status;
    throw err;
  }

  const setCookies = typeof res.headers.getSetCookie === "function"
    ? res.headers.getSetCookie()
    : [res.headers.get("set-cookie")].filter(Boolean);
  const cookie = cookieFrom(setCookies.join("; "));

  return {
    email: data?.email || mail,
    message: data?.message || "Đăng nhập thành công",
    cookie,
    data,
  };
}

// --- CÁC HÀM CÀO CHI TIẾT TỪ EDUX ---

async function layHocPhanEdux(options = {}) {
  const raw = await goiEdux("/subjects/joined", options);
  return asList(raw, ["subjects", "items", "list", "data"]);
}

async function layChuongTrinhHocEdux(subjectId, options = {}) {
  if (!subjectId) return [];
  const raw = await goiEdux(`/subjects/${subjectId}/models`, options);
  return asList(raw, ["models", "items", "list", "data"]);
}

async function laySlideEdux(modelId, options = {}) {
  if (!modelId) return [];
  const res = await thuLanLuotEdux([
    `/subjects/models/${modelId}/slides`,
    `/models/${modelId}/slides`,
    `/subjects/models/${modelId}/documents`,
    `/models/${modelId}/documents`,
  ], options);
  return asList(res.data, ["slides", "documents", "items", "list", "data"]);
}

async function layBaiTapEdux(modelId, options = {}) {
  if (!modelId) return { cau_hoi: [], session_id: null, tho: null };
  const raw = await goiEdux("/exam/start", {
    method: "POST",
    body: { model_id: modelId, modelId, id: modelId },
    ...options,
  });
  const root = unwrap(raw) || {};
  const examData = root.exam_data ?? root.data?.exam_data ?? root;
  const multipleChoice = (examData && (examData.multiple_choice || examData.questions)) || (Array.isArray(examData) ? examData : []);
  const cauHoi = multipleChoice.map((cau, idx) => ({
    id: firstValue(cau, ["id", "question_id", "qid"]) ?? `cau_${idx + 1}`,
    cau_hoi: firstValue(cau, ["question", "content", "title", "cau_hoi"]) ?? "",
    dap_an: firstValue(cau, ["options", "choices", "answers", "dap_an"]) ?? null,
    dap_an_dung: firstValue(cau, ["correct_answer", "answer", "dap_an_dung"]) ?? null,
    diem: firstValue(cau, ["score", "point", "diem"]) ?? null,
    tho: cau,
  }));
  return {
    cau_hoi: cauHoi,
    session_id: root.session_id ?? root.sessionId ?? null,
    tho: raw,
  };
}

async function layLopHocPhanEdux(options = {}) {
  const res = await thuLanLuotEdux(["/groups", "/subjects/groups", "/classes", "/lop-hoc-phan"], options);
  return asList(res.data, ["groups", "items", "list", "data"]);
}

async function layChiTietLopHocPhanEdux(groupId, options = {}) {
  if (!groupId) return {};
  const res = await thuLanLuotEdux([`/groups/${groupId}`, `/subjects/groups/${groupId}`], options);
  return unwrap(res.data) || {};
}

async function layBangDiemEdux(options = {}) {
  const res = await thuLanLuotEdux(["/scores", "/grades", "/subjects/scores", "/me/scores"], options);
  return asList(res.data, ["scores", "grades", "items", "data"]);
}

async function layThongBaoGiangVienEdux(options = {}) {
  const res = await thuLanLuotEdux(["/notifications", "/announcements", "/subjects/notifications"], options);
  return asList(res.data, ["items", "notifications", "list", "data"]);
}

async function layThongKeEdux(options = {}) {
  const res = await thuLanLuotEdux(["/statistics", "/me/statistics", "/progress", "/me/progress"], options);
  const duLieu = res.data ? asList(res.data, ["hoc_phan", "subjects", "items", "data"]) : [];
  return {
    hoc_phan: duLieu.map((hp) => ({
      ten_hoc_phan: firstValue(hp, ["name", "ten_hoc_phan", "subject"]) ?? "",
      tong_so: Number(firstValue(hp, ["total", "tong_so"]) ?? 0) || 0,
      da_hoc: Number(firstValue(hp, ["done", "da_hoc", "completed"]) ?? 0) || 0,
      phan_tram: Number(firstValue(hp, ["percent", "phan_tram"]) ?? 0) || 0,
    })),
  };
}

/**
 * Kéo danh sách bài tập AI của toàn bộ học phần EDUX
 */
async function keoBaiTapEdux(cookie, options = {}) {
  if (!cookie) throw Object.assign(new Error("Chưa có cookie phiên EDUX."), { statusCode: 401 });
  const chung = { cookie };
  const tatCaHocPhan = await layHocPhanEdux(chung);
  const { subjectId, questions = false } = options;
  const hocPhan = subjectId
    ? tatCaHocPhan.filter(item => String(item?.id) === String(subjectId))
    : tatCaHocPhan;

  const assignments = [];
  const thatBai = [];

  for (const subject of hocPhan) {
    const tenMon = String(subject?.name || subject?.subject_code || "Học phần").trim();
    let models;
    try {
      models = await layChuongTrinhHocEdux(subject.id, chung);
    } catch (err) {
      if (err.status === 401) throw err;
      thatBai.push(`${tenMon}: ${err.message}`);
      continue;
    }

    for (const model of models) {
      if (!model || !model.exist_exam) continue;

      let cauHoi = null;
      if (questions) {
        try {
          const ketQua = await layBaiTapEdux(model.id, chung);
          cauHoi = ketQua.cau_hoi;
        } catch (err) {
          if (err.status === 401) throw err;
          thatBai.push(`${tenMon} / ${model.title || model.name}: ${err.message}`);
        }
      }

      const tenChuong = String(model.title || model.name || "Chương học").trim();
      const diemCaoNhat = Number(model.highest_score);
      const match = String(model.process_document || "").match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/);
      const daHoc = match ? Number(match[1]) : 0;
      const tongSo = match ? Number(match[2]) : 0;

      assignments.push({
        id: `edux-${subject.id}-${model.id}`,
        title: tenChuong,
        subject: tenMon,
        subjectId: String(subject.id),
        subjectCode: subject.subject_code || null,
        modelId: String(model.id),
        chapter: model.chapter?.name || model.chapter?.title || null,
        due: null,
        status: !tongSo ? "Chưa làm" : (daHoc >= tongSo ? "Hoàn thành" : (daHoc > 0 ? "Đang làm" : "Chưa làm")),
        priority: "Trung bình",
        description: `Bài tập AI môn ${tenMon} — ${tenChuong}. ${Number.isFinite(diemCaoNhat) ? `Điểm cao nhất: ${diemCaoNhat}` : "Chưa có điểm cao nhất."}`,
        progress: { daHoc, tongSo, phanTram: tongSo ? Math.round((daHoc / tongSo) * 10000) / 100 : null },
        highestScore: Number.isFinite(diemCaoNhat) ? diemCaoNhat : null,
        questionCount: Array.isArray(cauHoi) ? cauHoi.length : null,
        questions: Array.isArray(cauHoi) ? cauHoi : undefined,
        source: "EDUX",
      });
    }
  }

  return {
    assignments,
    subjects: hocPhan.length,
    subjectIds: hocPhan.map(item => String(item.id)).filter(Boolean),
    thatBai,
  };
}

/**
 * Tổng hợp toàn bộ dữ liệu EDUX thành schema chuẩn
 */
async function layDataEdux(options = {}) {
  const cookie = options.cookie || process.env.EDUX_COOKIE || "";
  const chung = { cookie };
  const [subjects, groups, thongKe, thongBao] = await Promise.all([
    layHocPhanEdux(chung),
    layLopHocPhanEdux(chung),
    layThongKeEdux(chung),
    layThongBaoGiangVienEdux(chung),
  ]);

  return {
    EDUX: {
      cac_hoc_phan: subjects,
      lop_hoc_phan: groups,
      thong_ke: thongKe,
      thong_bao: thongBao,
    },
  };
}

// ===================================================================================
// 2. CỤM CÀO DỮ LIỆU CỔNG THÔNG TIN IU (iu.cmcu.edu.vn)
// ===================================================================================

const IU_ORIGIN = "https://iu.cmcu.edu.vn";
const IU_API_BASE = `${IU_ORIGIN}/sinhvienapi/api`;
const IM_MAC_DINH = "AzzSystem";
const APIS_KEYS = ["AzzSystem", "31415926535", "A", "1"];

/**
 * Mã hoá request theo chuẩn AE() của Portal IU (XOR charCode với endpoint key rồi base64)
 */
function ma_hoa_iu(payload) {
  const text = JSON.stringify(payload);
  const action = String((payload && payload.action) || "");
  const key = action.includes("/") ? action.substring(action.indexOf("/") + 1) : action;
  if (!key) throw new Error("Payload thiếu action dạng '<MODULE_MH>/<suffix>'.");
  let xor = "";
  for (let i = 0; i < text.length; i++) {
    xor += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return Buffer.from(xor, "utf8").toString("base64");
}

/**
 * Giải mã response theo chuẩn AD() của Portal IU (base64 decode + XOR charCode với key iM)
 */
function giai_ma_iu(base64, key = IM_MAC_DINH) {
  try {
    const mid = Buffer.from(String(base64), "base64").toString("utf8");
    if (!mid.length || !key.length) return "";
    let out = "";
    for (let i = 0; i < mid.length; i++) {
      out += String.fromCharCode(mid.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return out;
  } catch {
    return "";
  }
}

/**
 * Giải mã chuỗi A trong request (để debug)
 */
function giai_ma_request_iu(aMaHoa, suffixHoacAction) {
  let key = String(suffixHoacAction || "");
  if (key.includes("/")) key = key.substring(key.indexOf("/") + 1);
  if (!key) throw new Error("giai_ma_request_iu cần key (suffix hoặc iM).");
  const mid = Buffer.from(String(aMaHoa), "base64").toString("utf8");
  let text = "";
  for (let i = 0; i < mid.length; i++) {
    text += String.fromCharCode(mid.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return JSON.parse(text);
}

// Bảng tra cứu các Endpoint chính của Portal IU
const IU_ENDPOINTS_MAP = {
  // Điểm & Học tập
  KetQuaHocTapCaNhan: ["SV_ThongTin_MH", "CiQ1EDQgCS4iFSAxAiAPKSAv", "pkg_congthongtin_hssv_thongtin.KetQuaHocTapCaNhan"],
  LayKetQuaTichLuyTheoKhoi: ["SV_ThongTin_MH", "DSA4CiQ1EDQgFSgiKQ00OBUpJC4KKS4o", "pkg_congthongtin_hssv_thongtin.LayKetQuaTichLuyTheoKhoi"],
  LatKetQuaDiemQuaTrinh: ["SV_ThongTin_MH", "DSA1CiQ1EDQgBSgkLBA0IBUzKC8p", "pkg_congthongtin_hssv_thongtin.LatKetQuaDiemQuaTrinh"],
  LayDSDiemThanhPhanTheoTKHP: ["SV_ThongTin_MH", "DSA4BRIFKCQsFSkgLykRKSAvFSkkLhUKCREP", "pkg_congthongtin_hssv_thongtin.LayDSDiemThanhPhanTheoTKHP"],
  LayKQRenLuyenCaNhan: ["SV_ThongTin_MH", "DSA4ChATJC8NNDgkLwIgDykgLwPP", "pkg_congthongtin_hssv_thongtin.LayKQRenLuyenCaNhan"],
  LayThongTinChuongTrinhHoc: ["SV_ThongTin_MH", "DSA4FSkuLyYVKC8CKTQuLyYVMygvKQkuIgPP", "pkg_congthongtin_hssv_thongtin.LayThongTinChuongTrinhHoc"],
  // Lịch học & Thời khoá biểu
  LayDSThoiGianLichHoc: ["SV_ThongTin_MH", "DSA4BRIVKS4oBiggLw0oIikJLiIP", "pkg_congthongtin_hssv_thongtin.LayDSThoiGianLichHoc"],
  LayDSLichCaNhan: ["SV_ThongTin_MH", "DSA4BRINKCIpAiAPKSAv", "pkg_congthongtin_hssv_thongtin.LayDSLichCaNhan"],
  LayKetQuaDangKyHocCaNhan: ["SV_ThongTin_MH", "DSA4CiQ1EDQgBSAvJgo4CS4iAiAPKSAv", "pkg_congthongtin_hssv_thongtin.LayKetQuaDangKyHocCaNhan"],
  // Lịch thi
  LayDSThoiGianLichThi: ["SV_ThongTin_MH", "DSA4BRIVKS4oBiggLw0oIikVKSgP", "pkg_congthongtin_hssv_thongtin.LayDSThoiGianLichThi"],
  LayDSHocPhanLichThi: ["SV_ThongTin_MH", "DSA4BRIJLiIRKSAvDSgiKRUpKAPP", "pkg_congthongtin_hssv_thongtin.LayDSHocPhanLichThi"],
  LayDSLichThi_KeHoachThi: ["SV_ThongTin_MH", "DSA4BRINKCIpFSkoHgokCS4gIikVKSgP", "pkg_congthongtin_hssv_thongtin.LayDSLichThi_KeHoachThi"],
  LayTTLichThi: ["SV_ThongTin_MH", "DSA4FRUNKCIpFSko", "pkg_congthongtin_hssv_thongtin.LayTTLichThi"],
  // Hồ sơ & Văn bằng
  LayDSTabThongTinNguoiHoc: ["SV_KeHoach_MH", "DSA4BRIVICMVKS4vJhUoLw8mNC4oCS4i", "pkg_hososinhvien_kehoach.LayDSTabThongTinNguoiHoc"],
  LayThongTinChiTietHoSo: ["SV_Custom", "DSA4FSkuLyYVKC8CKSgVKCQ1CS4SLgPP", "pkg_hosohocvien.LayThongTinChiTietHoSo"],
  LayDSTN_KetQua_CongNhan_VB: ["SV_ThongTin_MH", "DSA4BRIVDx4KJDUQNCAeAi4vJg8pIC8eFwMP", "pkg_congthongtin_hssv_thongtin.LayDSTN_KetQua_CongNhan_VB"],
  // Tin tức & Thông báo
  LayDSTinTuc_BangTin_NguoiDung: ["TS_TinTuc_MH", "DSA4BRIVKC8VNCIeAyAvJhUoLx4PJjQuKAU0LyYP", "pkg_tintuc.LayDSTinTuc_BangTin_NguoiDung"],
  // Phúc khảo
  LayDSThiPhucKhaoCaNhan: ["XLHV_TP_PhucKhao_MH", "DSA4BRIVKSgRKTQiCikgLgIgDykgLwPP", "pkg_thi_phach_phuckhao.LayDSThiPhucKhaoCaNhan"],
  LayThoiGian: ["XLHV_TP_PhucKhao_MH", "DSA4FSkuKAYoIC8P", "pkg_thi_phach_phuckhao.LayThoiGian"],
};

function traEndpointIU(tenEndpoint) {
  const item = IU_ENDPOINTS_MAP[tenEndpoint];
  if (!item) {
    throw new Error(`Endpoint IU không hỗ trợ: "${tenEndpoint}".`);
  }
  return { module: item[0], suffix: item[1], func: item[2] };
}

/**
 * Xây dựng payload request IU theo đúng chuẩn hệ thống
 */
function buildPayloadIU(session, tenEndpoint, patch = {}) {
  const ep = traEndpointIU(tenEndpoint);
  const ss = session || {};
  const nguoiHocId = ss.nguoiHocId || ss.userId || "";
  const payload = {
    action: `${ep.module}/${ep.suffix}`,
    func: ep.func,
    iM: ss.iM || IM_MAC_DINH,
    strNguoiThucHien_Id: ss.userId || "",
    strChucNang_Id: ss.chucNangId || "",
    strQLSV_NguoiHoc_Id: nguoiHocId,
    strDaoTao_ChuongTrinh_Id: ss.chuongTrinhId || "",
    ...patch,
  };
  return payload;
}

/**
 * Gọi 1 endpoint IU và tự động giải mã dữ liệu trả về
 */
async function goiIU(session, cookie, tenEndpoint, patch = {}) {
  if (!session) throw new Error("Session IU là bắt buộc.");
  if (!cookie) throw new Error("Cookie IU là bắt buộc.");

  const ep = traEndpointIU(tenEndpoint);
  const payload = buildPayloadIU(session, tenEndpoint, patch);
  const bodyEncrypted = { A: ma_hoa_iu(payload) };

  const url = `${IU_API_BASE}/${ep.module}/${ep.suffix}`;
  const headers = {
    Accept: "*/*",
    "Content-Type": "application/x-www-form-urlencoded",
    "X-Requested-With": "XMLHttpRequest",
    Cookie: cookieFrom(cookie),
    Origin: IU_ORIGIN,
    Referer: `${IU_ORIGIN}/congthongtin/Index.aspx`,
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0",
  };
  const token = session.tokenJWT || session.token || "";
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: new URLSearchParams({ A: ma_hoa_iu(payload) }),
    signal: AbortSignal.timeout(30000),
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {}

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Phiên làm việc trên cổng IU không hợp lệ hoặc đã hết hạn (HTTP 401). Vui lòng thử đăng nhập lại bằng Mã sinh viên.");
    }
    const msg = (json && (json.Message || json.error)) || `Portal IU HTTP ${res.status}`;
    throw new Error(msg);
  }

  if (!json) {
    throw new Error(`Portal IU trả về dữ liệu không hợp lệ (HTTP ${res.status}).`);
  }

  // Giải mã Data.B nếu được mã hoá
  let duLieuGiaiMa = json.Data;
  if (json.Data && typeof json.Data === "object" && typeof json.Data.B === "string") {
    const rawPlain = giai_ma_iu(json.Data.B, payload.iM || IM_MAC_DINH);
    try {
      duLieuGiaiMa = JSON.parse(rawPlain);
    } catch {
      duLieuGiaiMa = rawPlain;
    }
  }

  return {
    ok: true,
    status: res.status,
    data: duLieuGiaiMa,
    raw: json,
  };
}

// --- CÁC HÀM CÀO CHI TIẾT TỪ IU ---

async function layChuongTrinhIdIU(session, cookie, opts = {}) {
  if (opts.chuongTrinhId) return opts.chuongTrinhId;
  try {
    const res = await goiIU(session, cookie, "LayThongTinChuongTrinhHoc", {});
    const cth = res.data;
    if (Array.isArray(cth) && cth[0]) {
      return cth[0].DAOTAO_TOCHUCCHUONGTRINH_ID || cth[0].ID || cth[0].DAOTAO_CHUONGTRINH_ID || "";
    }
  } catch { /* để trống */ }
  return "";
}

async function layTinTucIU(session, cookie) {
  const res = await goiIU(session, cookie, "LayDSTinTuc_BangTin_NguoiDung", {
    strTuKhoa: "", strTuNgay: "", strDenNgay: "", strChuyenMuc_Id: "",
    strChung_UngDung_Id: (session && session.appId) || "", dTinQuanTrong: -1,
    strDaoTao_CoCauToChuc_Id: "", dHieuLuc: 1, pageIndex: 1, pageSize: 30,
  });
  const list = Array.isArray(res.data) ? res.data : [];
  return list.map(e => ({
    loai: e.CHUYENMUC_TEN || e.LOAI || "",
    tieu_de: e.TIEUDE || "",
    noi_dung: e.NOIDUNG || e.TOMTAT || "",
    thoi_gian: e.NGAYTAO_DD_MM_YYYY || e.NGAYBATDAU || e.NGAYTAO || "",
  }));
}

async function layHoSoSinhVienIU(session, cookie, opts = {}) {
  const chuongTrinhId = opts.chuongTrinhId || await layChuongTrinhIdIU(session, cookie, opts);
  let kq = null;
  try {
    const res = await goiIU(session, cookie, "KetQuaHocTapCaNhan", chuongTrinhId ? { strDaoTao_ChuongTrinh_Id: chuongTrinhId } : {});
    kq = res.data;
  } catch { /* tiếp tục */ }

  const r = (kq && kq.rsThongTinNguoiHoc && kq.rsThongTinNguoiHoc[0]) || {};
  let ct = [];
  try {
    const resCt = await goiIU(session, cookie, "LayThongTinChiTietHoSo", {});
    ct = Array.isArray(resCt.data) ? resCt.data : [];
  } catch { /* dùng cơ bản */ }

  const t = ct[0] || {};
  const hoDem = r.QLSV_NGUOIHOC_HODEM || t.HODEM || "";
  const ten = r.QLSV_NGUOIHOC_TEN || t.TEN || "";
  const hoTen = `${hoDem} ${ten}`.trim();

  return {
    ma_sinh_vien: r.QLSV_NGUOIHOC_MASO || t.MASO || session.studentCode || "",
    ho_ten: hoTen || "Sinh viên",
    ngay_sinh: r.QLSV_NGUOIHOC_NGAYSINH || t.QLSV_NGUOIHOC_NGAYSINH || "",
    gioi_tinh: r.QLSV_NGUOIHOC_GIOITINH || t.GIOITINH || "",
    email: r.EMAIL || t.EMAIL || "",
    so_dien_thoai: r.DIENTHOAI || t.DIENTHOAI || "",
    lop: r.DAOTAO_LOPQUANLY_TEN || t.LOP || "",
    nganh: r.NGANH || t.NGANH || "Công nghệ thông tin",
    khoa: r.KHOA || t.KHOA || "",
  };
}

async function layBangDiemIU(session, cookie, opts = {}) {
  const chuongTrinhId = opts.chuongTrinhId || await layChuongTrinhIdIU(session, cookie, opts);
  const res = await goiIU(session, cookie, "KetQuaHocTapCaNhan", chuongTrinhId ? { strDaoTao_ChuongTrinh_Id: chuongTrinhId } : {});
  const rsDiem = (res.data && res.data.rsDiemKetThucHocPhan) || [];
  const rsThanhPhan = (res.data && res.data.rsDiemThanhPhan) || [];

  return rsDiem.map(e => {
    const ct = rsThanhPhan.filter(x =>
      String(x.DAOTAO_HOCPHAN_ID) === String(e.DAOTAO_HOCPHAN_ID) &&
      String(x.LANHOC) === String(e.LANHOC) &&
      String(x.LANTHI) === String(e.LANTHI)
    );
    const layDiem = kw => {
      const f = ct.find(x => new RegExp(kw, "i").test(String(x.DIEM_THANHPHANDIEM_TEN || "")));
      return f && Number.isFinite(Number(f.DIEM)) ? Number(f.DIEM) : 0;
    };
    return {
      ma_mon: String(e.DAOTAO_HOCPHAN_MA || ""),
      ten_hoc_phan: String(e.DAOTAO_HOCPHAN_TEN || ""),
      so_tin_chi: Number(e.DAOTAO_HOCPHAN_HOCTRINH) || 3,
      diem_he_10: Number.isFinite(Number(e.DIEM)) ? Number(e.DIEM) : 0,
      diem_he_4: Number.isFinite(Number(e.DIEMQUYDOI)) ? Number(e.DIEMQUYDOI) : 0,
      diem_chu: String(e.DIEMQUYDOI_TEN || "B").trim(),
      hoc_ky: String(e.HOCKY || e.HOC_KY || "HK1"),
      nam_hoc: String(e.NAMHOC || e.NAM_HOC || ""),
      xep_loai: String(e.DANHGIA_TEN || ""),
      chi_tiet_diem: {
        chuyen_can: layDiem("chuy.n.c.n|chuyencan|cc$"),
        bai_tap: layDiem("b.i.t.p|baitap|bt$"),
        giua_ky: layDiem("gi.a.k|giuaky|gk$"),
        cuoi_ky: layDiem("cu.i.k|cuoiky|cu.i.thi|ck$|thi.k.t.th.c"),
      },
    };
  });
}

async function layLichHocIU(session, cookie, opts = {}) {
  const ngayBatDau = opts.ngayBatDau || "01/09/2026";
  const ngayKetThuc = opts.ngayKetThuc || "31/08/2027";
  const res = await goiIU(session, cookie, "LayDSLichCaNhan", {
    strNgayBatDau: ngayBatDau,
    strNgayKetThuc: ngayKetThuc,
  });
  const rows = Array.isArray(res.data) ? res.data : [];
  const hhmm = (g, p) => (g == null || g === "" ? "" : `${String(g).padStart(2, "0")}:${String(p == null || p === "" ? 0 : p).padStart(2, "0")}`);
  return rows.map(e => ({
    thu: String(e.THU || ""),
    ngay: String(e.NGAYHOC || ""),
    thoi_gian_bat_dau: hhmm(e.GIOBATDAU, e.PHUTBATDAU) || "07:30",
    thoi_gian_ket_thuc: hhmm(e.GIOKETTHUC, e.PHUTKETTHUC) || "09:30",
    ma_mon: String(e.DAOTAO_HOCPHAN_MA || ""),
    ten_mon: String(e.TENHOCPHAN || ""),
    phong: String(e.PHONGHOC_TEN || e.PHONGHOC_MA || "A101"),
    giang_vien: String(e.GIANGVIEN || ""),
    hinh_thuc: String(e.THUOCTINH_TEN || e.PHANLOAI || "Lớp học phần"),
  }));
}

async function layLichThiIU(session, cookie, opts = {}) {
  const hkRes = await goiIU(session, cookie, "LayDSThoiGianLichThi", {});
  const dsHk = Array.isArray(hkRes.data) ? hkRes.data : [];
  const hkId = (dsHk[0] && dsHk[0].ID) || opts.thoiGianId || "";
  if (!hkId) return [];

  const hpRes = await goiIU(session, cookie, "LayDSHocPhanLichThi", {
    strDaoTao_ThoiGianDaoTao_Id: hkId,
    strTHI_DotThi_Id: "", strDiem_ThanhPhanDiem_Id: "",
  });
  const dsHp = Array.isArray(hpRes.data) ? hpRes.data : ((hpRes.data && hpRes.data.rsDanhSach) || []);
  const ids = dsHp.map(h => h.ID || h.DAOTAO_HOCPHAN_ID || h.HOCPHAN_ID).filter(Boolean);
  const idCanQuery = ["", ...new Set(ids)];

  const rowsGop = [];
  const thay = new Set();
  const hhmm = (g, p) => (g == null || g === "" ? "" : `${String(g).padStart(2, "0")}:${String(p == null || p === "" ? 0 : p).padStart(2, "0")}`);

  for (const hpId of idCanQuery) {
    try {
      const ltRes = await goiIU(session, cookie, "LayDSLichThi_KeHoachThi", {
        strDaoTao_ThoiGianDaoTao_Id: hkId,
        strDaoTao_HocPhan_Id: hpId,
      });
      const rows = ltRes.data?.rsLichThiCaNhan || ltRes.data?.rsKeHoachThiChung || (Array.isArray(ltRes.data) ? ltRes.data : []);
      for (const r of rows) {
        const key = `${r.MAHOCPHAN || ""}_${r.NGAYHOC || r.NGAYTHI || ""}_${r.GIOBATDAU || ""}`;
        if (thay.has(key)) continue;
        thay.add(key);
        rowsGop.push(r);
      }
    } catch { /* tiếp tục */ }
  }

  return rowsGop.map(e => ({
    ma_mon: String(e.MAHOCPHAN || e.DAOTAO_HOCPHAN_MA || ""),
    ten_mon: String(e.TENHOCPHAN || e.DAOTAO_HOCPHAN_TEN || ""),
    ngay_thi: String(e.NGAYHOC || e.NGAYTHI || ""),
    gio_thi: `${hhmm(e.GIOBATDAU, e.PHUTBATDAU)}${e.GIOKETTHUC != null ? ` - ${hhmm(e.GIOKETTHUC, e.PHUTKETTHUC)}` : ""}`,
    phong_thi: String(e.PHONGHOC_TEN || e.PHONGTHI_TEN || e.PHONG || "Chưa xếp phòng"),
    hinh_thuc_thi: String(e.HINHTHUCTHI_TEN || e.HINHTHUC || "Tự luận"),
  }));
}

/**
 * Kéo toàn bộ dữ liệu IU thành schema tổng hợp
 */
async function layTatCaIU(session, cookie, opts = {}) {
  const thatBai = [];
  const anToan = async (fn, ten) => {
    try {
      return await fn();
    } catch (err) {
      thatBai.push(`${ten}: ${err.message}`);
      return null;
    }
  };

  const [hoSo, bangDiem, lichHoc, lichThi, tinTuc] = await Promise.all([
    anToan(() => layHoSoSinhVienIU(session, cookie, opts), "HoSo"),
    anToan(() => layBangDiemIU(session, cookie, opts), "BangDiem"),
    anToan(() => layLichHocIU(session, cookie, opts), "LichHoc"),
    anToan(() => layLichThiIU(session, cookie, opts), "LichThi"),
    anToan(() => layTinTucIU(session, cookie), "TinTuc"),
  ]);

  return {
    data: {
      IU: {
        tin_tuc: tinTuc || [],
        ho_so_sinh_vien: { thong_tin_ca_nhan: hoSo || {} },
        goc_hoc_tap: { tra_cuu_diem: { bang_diem: bangDiem || [] } },
        lich_hoc: { chi_tiet_thoi_khoa_bieu: lichHoc || [] },
        lich_thi: { chi_tiet_lich_thi: lichThi || [] },
      },
    },
    thatBai,
  };
}

/**
 * Chuyển schema { IU: ... } thành định dạng dataIU phẳng cho cơ sở dữ liệu
 */
function mapSangDataIU(schema) {
  const iu = (schema && schema.IU) || {};
  const cn = (iu.ho_so_sinh_vien && iu.ho_so_sinh_vien.thong_tin_ca_nhan) || {};
  const goc = iu.goc_hoc_tap || {};
  const traCuu = goc.tra_cuu_diem || {};
  const bangDiemRaw = Array.isArray(traCuu.bang_diem) ? traCuu.bang_diem : [];
  const bang_diem = {};
  for (const mon of bangDiemRaw) {
    const hk = String(mon.hoc_ky || "").trim();
    const nam = String(mon.nam_hoc || "").trim();
    const ky = (hk || nam ? `${hk} ${nam}`.trim() : "HK1").replace(/\s+/g, "_") || "HK1";
    if (!bang_diem[ky]) bang_diem[ky] = {};
    const key = String(mon.ten_hoc_phan || mon.ma_mon || "Mon_hoc").replace(/\s+/g, "_");
    bang_diem[ky][key] = {
      so_tin_chi: Number(mon.so_tin_chi) || 3,
      ma_mon: String(mon.ma_mon || ""),
      diem_tong_ket: Number(mon.diem_he_10) || 0,
      diem_chu: String(mon.diem_chu || "B"),
      trang_thai: (Number(mon.diem_he_10) || 0) >= 4 ? "dat" : "rot",
    };
  }

  const toDMY = v => {
    const str = String(v || "").trim();
    const m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return `${m[3].padStart(2, "0")}/${m[2].padStart(2, "0")}/${m[1]}`;
    return str;
  };

  const tkb = ((iu.lich_hoc && iu.lich_hoc.chi_tiet_thoi_khoa_bieu) || []).map(t => ({
    ma_mon: String(t.ma_mon || ""),
    ten_mon: String(t.ten_mon || "").replace(/\s+/g, "_"),
    ten_lop: String(t.hinh_thuc || "Lớp học phần"),
    phong: String(t.phong || "A101"),
    co_so: "Cơ sở chính",
    thu: Number(t.thu) || 2,
    gio_bat_dau: String(t.thoi_gian_bat_dau || "07:30"),
    gio_ket_thuc: String(t.thoi_gian_ket_thuc || "09:30"),
    ngay_bat_dau: toDMY(t.ngay),
    ngay_ket_thuc: toDMY(t.ngay),
    giang_vien: String(t.giang_vien || ""),
  }));

  const lich_thi = ((iu.lich_thi && iu.lich_thi.chi_tiet_lich_thi) || []).map(t => {
    const [batDau, ketThuc] = String(t.gio_thi || "").split("-").map(x => x.trim());
    return {
      ma_mon: String(t.ma_mon || ""),
      ten_mon: String(t.ten_mon || "").replace(/\s+/g, "_"),
      ngay_thi: toDMY(t.ngay_thi),
      gio_thi: batDau || "",
      gio_ket_thuc: ketThuc || "",
      thoi_luong: 90,
      phong_thi: String(t.phong_thi || "Chưa xếp phòng"),
      hinh_thuc_thi: String(t.hinh_thuc_thi || "Tự luận"),
      co_so: "Cơ sở chính",
    };
  });

  return {
    MSV: String(cn.ma_sinh_vien || ""),
    ho_ten: String(cn.ho_ten || ""),
    ten_nganh_hoc: String(cn.nganh || ""),
    ngay_thang_nam_sinh: toDMY(cn.ngay_sinh),
    bang_diem,
    tkb,
    lich_thi,
  };
}

/**
 * Đăng nhập Cổng Thông Tin IU CMCU (iu.cmcu.edu.vn)
 */
async function loginIUPortal({ username, password }) {
  const rawUser = String(username || "").trim();
  const pass = String(password || "").trim();
  if (!rawUser || !pass) {
    throw new Error("Vui lòng nhập tài khoản/mã sinh viên và mật khẩu cổng IU.");
  }

  const userVariants = [rawUser];
  if (rawUser.includes("@")) {
    const code = rawUser.split("@")[0].trim();
    if (code && !userVariants.includes(code)) userVariants.push(code);
    const upper = code.toUpperCase();
    if (upper && !userVariants.includes(upper)) userVariants.push(upper);
  } else {
    const upper = rawUser.toUpperCase();
    if (!userVariants.includes(upper)) userVariants.push(upper);
    const withDomain = `${rawUser}@st.cmcu.edu.vn`;
    if (!userVariants.includes(withDomain)) userVariants.push(withDomain);
  }

  let successSession = null;
  let successCookies = "";

  for (const candidate of userVariants) {
    try {
      // 1. Lấy ViewState và Cookie ban đầu
      const getRes = await fetch(`${IU_ORIGIN}/congthongtin/login.aspx`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        signal: AbortSignal.timeout(15000)
      });
      const html = await getRes.text();
      const initCookies = typeof getRes.headers.getSetCookie === "function"
        ? getRes.headers.getSetCookie()
        : [getRes.headers.get("set-cookie")].filter(Boolean);

      function getAttr(tag, attr) {
        const m = tag.match(new RegExp(attr + '="([^"]*)"', 'i')) || tag.match(new RegExp(attr + "='([^']*)'", 'i'));
        return m ? m[1] : "";
      }
      const inputs = [...html.matchAll(/<input[^>]+>/gi)].map(m => m[0]);
      let viewstate = "", generator = "", eventvalidation = "";
      for (const tag of inputs) {
        const name = getAttr(tag, "name");
        const val = getAttr(tag, "value");
        if (name === "__VIEWSTATE") viewstate = val;
        if (name === "__VIEWSTATEGENERATOR") generator = val;
        if (name === "__EVENTVALIDATION") eventvalidation = val;
      }

      // 2. Gửi request xác thực
      const params = new URLSearchParams();
      params.append("__VIEWSTATE", viewstate);
      params.append("__VIEWSTATEGENERATOR", generator);
      params.append("__EVENTVALIDATION", eventvalidation);
      params.append("username", candidate);
      params.append("password", pass);
      params.append("cms_authenticate_do_login", "ĐĂNG NHẬP");

      const postRes = await fetch(`${IU_ORIGIN}/congthongtin/login.aspx`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          ...(initCookies.length ? { "Cookie": cookieFrom(initCookies.join("; ")) } : {}),
          "Origin": IU_ORIGIN,
          "Referer": `${IU_ORIGIN}/congthongtin/login.aspx`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        body: params.toString(),
        redirect: "manual",
        signal: AbortSignal.timeout(20000)
      });

      const postCookies = typeof postRes.headers.getSetCookie === "function"
        ? postRes.headers.getSetCookie()
        : [postRes.headers.get("set-cookie")].filter(Boolean);
      const combinedCookies = cookieFrom([...initCookies, ...postCookies].join("; "));
      const postHtml = await postRes.text();
      const location = postRes.headers.get("location") || "";

      const isRedirectToIndex = (postRes.status >= 300 && postRes.status < 400 && /Index\.aspx/i.test(location));
      const hasAuthCookie = /\.ASPXAUTH/i.test(combinedCookies);
      const notifyMatch = postHtml.match(/<span[^>]*id=["']lblNotify["'][^>]*>([\s\S]*?)<\/span>/i);
      const notifyText = notifyMatch ? notifyMatch[1].trim() : "";

      const isFailed = (postRes.status === 200 && (notifyText || postHtml.includes("lblNotify"))) ||
        postHtml.includes("Tai khoan khong dung") ||
        postHtml.includes("không chính xác") ||
        postHtml.includes("đăng nhập không thành công");

      if (isFailed && !isRedirectToIndex && !hasAuthCookie) {
        continue;
      }

      // 3. Phân tích Index.aspx lấy token hoặc userId
      let token = "";
      let studentId = candidate.includes("@") ? candidate.split("@")[0] : candidate;
      let chucNangId = "20160101";

      try {
        const indexRes = await fetch(`${IU_ORIGIN}/congthongtin/Index.aspx`, {
          headers: {
            "Cookie": combinedCookies,
            "Referer": `${IU_ORIGIN}/congthongtin/login.aspx`,
            "User-Agent": "Mozilla/5.0"
          },
          redirect: "manual",
          signal: AbortSignal.timeout(15000)
        });

        if (indexRes.status === 200) {
          const indexHtml = await indexRes.text();
          const axyzMatch = indexHtml.match(/(?:var\s+)?AXYZCLRVN\s*=\s*["']([^"']+)["']/i) ||
            indexHtml.match(/AXYZCLRVN\s*\(\s*["']([^"']+)["']\s*\)/i) ||
            indexHtml.match(/function\s+AXYZCLRVN\s*\(\)\s*\{\s*return\s*["']([^"']+)["']/i);

          if (axyzMatch) {
            try {
              const plain = giai_ma_iu(axyzMatch[1], "AzzSystem");
              const decrypted = JSON.parse(plain);
              if (decrypted.tokenJWT) token = decrypted.tokenJWT;
              if (decrypted.userId) studentId = decrypted.userId;
              if (decrypted.strChucNang_Id) chucNangId = decrypted.strChucNang_Id;
            } catch {}
          }

          if (!token) {
            const jwtMatch = indexHtml.match(/(eyJ[a-zA-Z0-9_-]{15,}\.[a-zA-Z0-9_-]{15,}\.[a-zA-Z0-9_-]+)/);
            if (jwtMatch) token = jwtMatch[1];
          }

          if (!token) {
            const tokenMatch = indexHtml.match(/(?:tokenJWT|token)["']?\s*[:=]\s*["']([^"']+)["']/i);
            if (tokenMatch) token = tokenMatch[1];
          }

          const userMatch = indexHtml.match(/(?:strQLSV_NguoiHoc_Id|userId)["']?\s*[:=]\s*["']([^"']+)["']/i);
          if (userMatch) studentId = userMatch[1];

          const chucNangMatch = indexHtml.match(/(?:strChucNang_Id|chucNangId)["']?\s*[:=]\s*["']([^"']+)["']/i);
          if (chucNangMatch) chucNangId = chucNangMatch[1];
        }
      } catch {}

      successSession = {
        userId: studentId || candidate,
        studentCode: candidate.includes("@") ? candidate.split("@")[0] : candidate,
        chucNangId: chucNangId || "20160101",
        token: token,
        tokenJWT: token,
        appId: "Portal_SinhVien",
        iM: IM_MAC_DINH
      };
      successCookies = combinedCookies;
      break;
    } catch {}
  }

  if (!successSession || (!successCookies && !successSession.token)) {
    throw new Error("Tài khoản hoặc mật khẩu cổng thông tin IU không đúng. Vui lòng kiểm tra lại Mã sinh viên (ví dụ: bai250001) và Mật khẩu cổng trường!");
  }

  return { session: successSession, cookie: successCookies };
}

/**
 * Kéo bảng điểm và hồ sơ sinh viên từ Portal IU
 */
async function layBangDiemVaHoSoIU(session, cookie) {
  const [hoSo, bangDiem] = await Promise.all([
    layHoSoSinhVienIU(session, cookie),
    layBangDiemIU(session, cookie)
  ]);
  return { hoSo, bangDiem };
}

/**
 * Xử lý dữ liệu bảng điểm, gom nhóm học kỳ và tính toán GPA tổng + môn yếu
 */
function processAcademicTranscript(bangDiemRaw, studentInfo = {}) {
  const list = Array.isArray(bangDiemRaw) ? bangDiemRaw : [];

  const semesterMap = new Map();
  let totalCredits10 = 0;
  let totalWeighted10 = 0;
  let totalCredits4 = 0;
  let totalWeighted4 = 0;
  let totalPassedCredits = 0;

  for (const m of list) {
    const credits = Number(m.so_tin_chi) || 3;
    const score10 = Number.isFinite(Number(m.diem_he_10)) ? Number(m.diem_he_10) : 0;
    const score4 = Number.isFinite(Number(m.diem_he_4)) ? Number(m.diem_he_4) : 0;
    const letter = String(m.diem_chu || "B").trim().toUpperCase();
    const passed = score10 >= 4.0 && letter !== "F";

    const semName = (m.hoc_ky ? `${m.hoc_ky}` : "Học kỳ") + (m.nam_hoc ? ` - Năm học ${m.nam_hoc}` : "");
    if (!semesterMap.has(semName)) {
      semesterMap.set(semName, {
        semester_name: semName,
        hoc_ky: m.hoc_ky || "",
        nam_hoc: m.nam_hoc || "",
        subjects: [],
        total_credits: 0,
        gpa_10: 0,
        gpa_4: 0,
        weighted_10: 0,
        weighted_4: 0
      });
    }

    const sem = semesterMap.get(semName);
    sem.subjects.push({
      ma_mon: m.ma_mon || "",
      ten_hoc_phan: m.ten_hoc_phan || "Học phần",
      so_tin_chi: credits,
      diem_he_10: score10,
      diem_he_4: score4,
      diem_chu: letter,
      passed,
      chi_tiet_diem: m.chi_tiet_diem || {}
    });
    sem.total_credits += credits;
    sem.weighted_10 += score10 * credits;
    sem.weighted_4 += score4 * credits;

    totalCredits10 += credits;
    totalWeighted10 += score10 * credits;
    totalCredits4 += credits;
    totalWeighted4 += score4 * credits;
    if (passed) totalPassedCredits += credits;
  }

  const semesters = [];
  for (const [, sem] of semesterMap.entries()) {
    sem.gpa_10 = sem.total_credits > 0 ? Math.round((sem.weighted_10 / sem.total_credits) * 100) / 100 : 0;
    sem.gpa_4 = sem.total_credits > 0 ? Math.round((sem.weighted_4 / sem.total_credits) * 100) / 100 : 0;
    semesters.push(sem);
  }

  const overallGpa10 = totalCredits10 > 0 ? Math.round((totalWeighted10 / totalCredits10) * 100) / 100 : 0;
  const overallGpa4 = totalCredits4 > 0 ? Math.round((totalWeighted4 / totalCredits4) * 100) / 100 : 0;

  let classification = "Chưa xếp loại";
  let badgeColor = "#ff7597";
  if (overallGpa4 >= 3.6) {
    classification = "Xuất sắc 🏆";
    badgeColor = "#e60049";
  } else if (overallGpa4 >= 3.2) {
    classification = "Giỏi 🌟";
    badgeColor = "#ff4d80";
  } else if (overallGpa4 >= 2.5) {
    classification = "Khá ✨";
    badgeColor = "#00b4d8";
  } else if (overallGpa4 >= 2.0) {
    classification = "Trung bình ⚠️";
    badgeColor = "#f59e0b";
  } else if (totalCredits4 > 0) {
    classification = "Yếu / Cảnh báo 🚨";
    badgeColor = "#ef4444";
  }

  const weakSubjects = list
    .filter(m => {
      const score = Number(m.diem_he_10) || 0;
      const letter = String(m.diem_chu || "").toUpperCase();
      return score < 6.5 || ["F", "D", "D+", "C"].includes(letter);
    })
    .map(m => {
      const credits = Number(m.so_tin_chi) || 3;
      const score4 = Number(m.diem_he_4) || 0;
      const gpaGainIfA = totalCredits4 > 0 ? Math.round(((4.0 - score4) * credits / totalCredits4) * 100) / 100 : 0;
      return {
        ma_mon: m.ma_mon,
        ten_hoc_phan: m.ten_hoc_phan,
        so_tin_chi: credits,
        diem_he_10: Number(m.diem_he_10) || 0,
        diem_he_4: score4,
        diem_chu: m.diem_chu,
        hoc_ky: m.hoc_ky,
        nam_hoc: m.nam_hoc,
        chi_tiet_diem: m.chi_tiet_diem || {},
        gpaGainIfA
      };
    })
    .sort((a, b) => b.gpaGainIfA - a.gpaGainIfA);

  return {
    student: {
      ma_sinh_vien: studentInfo.ma_sinh_vien || "",
      ho_ten: studentInfo.ho_ten || "Sinh viên CMC",
      nganh: studentInfo.nganh || "Công nghệ thông tin",
      lop: studentInfo.lop || "",
      email: studentInfo.email || ""
    },
    gpa: {
      overall_10: overallGpa10,
      overall_4: overallGpa4,
      total_credits: totalCredits10,
      passed_credits: totalPassedCredits,
      classification,
      badgeColor,
      total_subjects: list.length,
      weak_count: weakSubjects.length
    },
    semesters,
    weak_subjects: weakSubjects,
    raw_subjects: list
  };
}

// ===================================================================================
// 3. GIAO DIỆN DÒNG LỆNH (CLI RUNNER)
// ===================================================================================

function inTroGiup() {
  console.log(`
================================================================================
BỘ CÀO WEB STANDALONE: EDUX & IU (CMC UNIVERSITY)
================================================================================

CÁCH DÙNG:
  node crawler.js <he_thong> <lenh> [tuy_chon]

HỆ THỐNG EDUX:
  node crawler.js edux login --email <email> --password <pass>
      Đăng nhập và lấy cookie phiên EDUX.

  node crawler.js edux tasks --cookie "<cookie>" [--out <file.json>]
      Kéo danh sách bài tập AI của các học phần EDUX.

  node crawler.js edux pull --cookie "<cookie>" [--out <file.json>]
      Kéo toàn bộ học phần, lớp học, thống kê EDUX.

HỆ THỐNG IU:
  node crawler.js iu test-crypto
      Kiểm tra thuật toán mã hoá AE / giải mã AD của cổng IU.

  node crawler.js iu pull --cookie "<cookie>" --token "<tokenJWT>" [--userId <id>] [--out <file.json>]
      Kéo toàn bộ hồ sơ, bảng điểm, thời khoá biểu, lịch thi từ cổng IU.

  node crawler.js iu group --group <hoso|bangdiem|tkb|lichthi> --cookie "<cookie>" --token "<tokenJWT>"
      Kéo riêng một nhóm dữ liệu cụ thể từ cổng IU.

VÍ DỤ NHANH:
  node crawler.js iu test-crypto
  node crawler.js edux login --email sv@st.cmcu.edu.vn --password matkhau
================================================================================
`);
}

async function chayCLI(args) {
  const heThong = (args[0] || "").toLowerCase();
  const lenh = (args[1] || "").toLowerCase();

  const layThamSo = (ten) => {
    const idx = args.indexOf(`--${ten}`);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
  };

  if (!heThong || heThong === "--help" || heThong === "-h" || heThong === "help") {
    inTroGiup();
    return;
  }

  try {
    if (heThong === "edux") {
      if (lenh === "login") {
        const email = layThamSo("email");
        const password = layThamSo("password");
        console.log(`[EDUX] Đang đăng nhập tài khoản: ${email}...`);
        const kq = await loginEdux({ email, password });
        console.log(`[EDUX] Đăng nhập thành công!`);
        console.log(`[EDUX] Email : ${kq.email}`);
        console.log(`[EDUX] Cookie: ${kq.cookie}`);
        return;
      }

      if (lenh === "tasks") {
        const cookie = layThamSo("cookie");
        const outFile = layThamSo("out");
        console.log(`[EDUX] Đang kéo danh sách bài tập AI...`);
        const kq = await keoBaiTapEdux(cookie);
        console.log(`[EDUX] Đã kéo được ${kq.assignments.length} bài tập từ ${kq.subjects} học phần.`);
        if (outFile) {
          fs.writeFileSync(outFile, JSON.stringify(kq, null, 2), "utf8");
          console.log(`[EDUX] Đã lưu kết quả vào: ${outFile}`);
        } else {
          console.log(JSON.stringify(kq.assignments.slice(0, 3), null, 2));
          if (kq.assignments.length > 3) console.log(`... và ${kq.assignments.length - 3} bài tập khác.`);
        }
        return;
      }

      if (lenh === "pull") {
        const cookie = layThamSo("cookie");
        const outFile = layThamSo("out");
        console.log(`[EDUX] Đang kéo toàn bộ dữ liệu EduX...`);
        const kq = await layDataEdux({ cookie });
        console.log(`[EDUX] Đã kéo xong dữ liệu EduX.`);
        if (outFile) {
          fs.writeFileSync(outFile, JSON.stringify(kq, null, 2), "utf8");
          console.log(`[EDUX] Đã lưu kết quả vào: ${outFile}`);
        } else {
          console.log(JSON.stringify(kq, null, 2));
        }
        return;
      }

      console.error(`[EDUX] Lệnh không hợp lệ: "${lenh}". Gõ "node crawler.js --help" để xem hướng dẫn.`);
      process.exit(1);
    }

    if (heThong === "iu") {
      if (lenh === "test-crypto") {
        console.log(`[IU] Đang kiểm tra mã hoá AE và giải mã AD...`);
        const payloadMau = {
          action: "SV_ThongTin_MH/DSA4CiQ1EDQgFSgiKQ00OBUpJC4KKS4o",
          iM: "AzzSystem",
          strQLSV_NguoiHoc_Id: "TEST_USER_ID",
        };
        const maHoa = ma_hoa_iu(payloadMau);
        console.log(`[IU] Chuỗi mã hoá (Base64): ${maHoa}`);
        const giaiMaReq = giai_ma_request_iu(maHoa, "DSA4CiQ1EDQgFSgiKQ00OBUpJC4KKS4o");
        console.log(`[IU] Giải mã kiểm tra:`, giaiMaReq);
        const khop = JSON.stringify(payloadMau) === JSON.stringify(giaiMaReq);
        console.log(`[IU] Kết quả đối chiếu: ${khop ? "THÀNH CÔNG (Khớp 100%)" : "THẤT BẠI"}`);
        return;
      }

      if (lenh === "login") {
        const user = layThamSo("user") || layThamSo("username");
        const pass = layThamSo("pass") || layThamSo("password");
        const outFile = layThamSo("out");

        if (!user || !pass) {
          console.error(`[IU] Cần truyền cả --user <mã_sinh_viên> và --pass <mật_khẩu>.`);
          process.exit(1);
        }

        console.log(`[IU] Đang đăng nhập cổng IU với tài khoản: ${user}...`);
        const { session, cookie } = await loginIUPortal({ username: user, password: pass });
        console.log(`[IU] Đăng nhập IU thành công! Phiên kết nối đã sẵn sàng.`);
        console.log(`[IU] Đang tải bảng điểm và hồ sơ sinh viên...`);
        const { hoSo, bangDiem } = await layBangDiemVaHoSoIU(session, cookie);
        const processed = processAcademicTranscript(bangDiem, hoSo);
        console.log(`[IU] Đã lấy thành công bảng điểm của sinh viên: ${processed.student.ho_ten} (${processed.student.ma_sinh_vien})`);
        console.log(`[IU] GPA Hệ 4: ${processed.gpa.overall_4} | GPA Hệ 10: ${processed.gpa.overall_10} | Tín chỉ: ${processed.gpa.passed_credits}`);
        console.log(`[IU] Xếp loại: ${processed.gpa.classification} | Số môn cần cải thiện: ${processed.weak_subjects.length}`);

        if (outFile) {
          fs.writeFileSync(outFile, JSON.stringify(processed, null, 2), "utf8");
          console.log(`[IU] Đã lưu bảng điểm và hồ sơ vào: ${outFile}`);
        } else {
          console.log(JSON.stringify(processed, null, 2));
        }
        return;
      }

      if (lenh === "pull") {
        const cookie = layThamSo("cookie");
        const token = layThamSo("token");
        const userId = layThamSo("userId") || "SV";
        const outFile = layThamSo("out");

        if (!cookie || !token) {
          console.error(`[IU] Cần truyền cả --cookie và --token (tokenJWT).`);
          process.exit(1);
        }

        const session = { userId, token, tokenJWT: token, appId: "Portal_SinhVien" };
        console.log(`[IU] Đang kéo dữ liệu từ portal IU...`);
        const kq = await layTatCaIU(session, cookie);
        console.log(`[IU] Kéo hoàn tất (lỗi: ${kq.thatBai.length}).`);
        if (outFile) {
          fs.writeFileSync(outFile, JSON.stringify(kq, null, 2), "utf8");
          console.log(`[IU] Đã lưu kết quả vào: ${outFile}`);
        } else {
          console.log(JSON.stringify(kq.data, null, 2));
        }
        return;
      }

      console.error(`[IU] Lệnh không hợp lệ: "${lenh}". Gõ "node crawler.js --help" để xem hướng dẫn.`);
      process.exit(1);
    }

    console.error(`Hệ thống "${heThong}" không được hỗ trợ. Dùng "edux" hoặc "iu".`);
    inTroGiup();
    process.exit(1);
  } catch (err) {
    console.error(`[LỖI] ${err.message}`);
    process.exit(1);
  }
}

// Nếu thực thi file trực tiếp từ Node: chạy CLI
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  chayCLI(process.argv.slice(2));
}

// ===================================================================================
// 4. MODULE EXPORTS
// ===================================================================================

const eduxModule = {
  ORIGIN: EDUX_ORIGIN,
  API_BASE: EDUX_API_BASE,
  loginEdux,
  goiEdux,
  thuLanLuotEdux,
  layHocPhanEdux,
  layChuongTrinhHocEdux,
  laySlideEdux,
  layBaiTapEdux,
  layLopHocPhanEdux,
  layChiTietLopHocPhanEdux,
  layBangDiemEdux,
  layThongBaoGiangVienEdux,
  layThongKeEdux,
  keoBaiTapEdux,
  layDataEdux,
  cookieFrom,
};

const iuModule = {
  ORIGIN: IU_ORIGIN,
  API_BASE: IU_API_BASE,
  IM_MAC_DINH,
  APIS_KEYS,
  ENDPOINTS: IU_ENDPOINTS_MAP,
  ma_hoa: ma_hoa_iu,
  giai_ma: giai_ma_iu,
  giai_ma_request: giai_ma_request_iu,
  traEndpoint: traEndpointIU,
  buildPayload: buildPayloadIU,
  goiIU,
  layChuongTrinhId: layChuongTrinhIdIU,
  layTinTuc: layTinTucIU,
  layHoSoSinhVien: layHoSoSinhVienIU,
  layBangDiem: layBangDiemIU,
  layLichHoc: layLichHocIU,
  layLichThi: layLichThiIU,
  layTatCaIU,
  mapSangDataIU,
  loginIUPortal,
  layBangDiemVaHoSoIU,
  processAcademicTranscript,
};

export {
  eduxModule as edux,
  iuModule as iu,
  loginEdux,
  keoBaiTapEdux,
  layDataEdux,
  goiIU,
  layTatCaIU,
  mapSangDataIU,
  ma_hoa_iu,
  giai_ma_iu,
  loginIUPortal,
  layBangDiemVaHoSoIU,
  processAcademicTranscript,
};

export default {
  edux: eduxModule,
  iu: iuModule,
  loginEdux,
  keoBaiTapEdux,
  layDataEdux,
  goiIU,
  layTatCaIU,
  mapSangDataIU,
  ma_hoa_iu,
  giai_ma_iu,
  loginIUPortal,
  layBangDiemVaHoSoIU,
  processAcademicTranscript,
};
