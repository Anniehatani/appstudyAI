/**
 * ===================================================================================
 * ACADEMIC & TRANSCRIPT SERVICE (IU PORTAL & DEEPSEEK AI ADVISOR)
 * ===================================================================================
 * Kết nối cổng thông tin IU CMCU (iu.cmcu.edu.vn), cào bảng điểm, tính toán GPA
 * và tích hợp Trợ giảng 3TG AI lên lộ trình cải thiện điểm cá nhân hoá.
 * ===================================================================================
 */

const IU_ORIGIN = "https://iu.cmcu.edu.vn";
const IU_API_BASE = `${IU_ORIGIN}/sinhvienapi/api`;
const IM_MAC_DINH = "AzzSystem";

function toBase64(str) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf8").toString("base64");
  }
  return btoa(unescape(encodeURIComponent(str)));
}

function fromBase64(b64) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(b64, "base64").toString("utf8");
  }
  return decodeURIComponent(escape(atob(b64)));
}

export function ma_hoa_iu(payload) {
  const text = JSON.stringify(payload);
  const action = String((payload && payload.action) || "");
  const key = action.includes("/") ? action.substring(action.indexOf("/") + 1) : action;
  if (!key) throw new Error("Payload thiếu action dạng '<MODULE_MH>/<suffix>'.");
  let xor = "";
  for (let i = 0; i < text.length; i++) {
    xor += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return toBase64(xor);
}

export function giai_ma_iu(base64, key = IM_MAC_DINH) {
  try {
    const mid = fromBase64(String(base64));
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

export const IU_ENDPOINTS_MAP = {
  KetQuaHocTapCaNhan: ["SV_ThongTin_MH", "CiQ1EDQgCS4iFSAxAiAPKSAv", "pkg_congthongtin_hssv_thongtin.KetQuaHocTapCaNhan"],
  LayKetQuaTichLuyTheoKhoi: ["SV_ThongTin_MH", "DSA4CiQ1EDQgFSgiKQ00OBUpJC4KKS4o", "pkg_congthongtin_hssv_thongtin.LayKetQuaTichLuyTheoKhoi"],
  LayThongTinChiTietHoSo: ["SV_Custom", "DSA4FSkuLyYVKC8CKSgVKCQ1CS4SLgPP", "pkg_hosohocvien.LayThongTinChiTietHoSo"],
  LayThongTinChuongTrinhHoc: ["SV_ThongTin_MH", "DSA4FSkuLyYVKC8CKSgVKCQ1CS4SLgPP", "pkg_congthongtin_hssv_thongtin.LayThongTinChuongTrinhHoc"]
};

function traEndpointIU(tenEndpoint) {
  const item = IU_ENDPOINTS_MAP[tenEndpoint];
  if (!item) throw new Error(`Endpoint IU không hỗ trợ: "${tenEndpoint}".`);
  return { module: item[0], suffix: item[1], func: item[2] };
}

function cookieFrom(rawCookie) {
  if (!rawCookie) return "";
  const pairs = [];
  const seen = new Set();
  const cleaned = String(rawCookie).replace(/^set-cookie:\s*/gim, "");
  for (const match of cleaned.matchAll(/(?:^|[;,\r\n]\s*)([^=;,\s]+)=([^;,\r\n]*)/g)) {
    const key = match[1].trim();
    if (!key || ["path", "domain", "expires", "max-age", "samesite", "secure", "httponly"].includes(key.toLowerCase()) || seen.has(key)) continue;
    seen.add(key);
    pairs.push(`${key}=${match[2].trim()}`);
  }
  return pairs.join("; ");
}

export async function goiIU(session, cookie, tenEndpoint, patch = {}) {
  const ep = traEndpointIU(tenEndpoint);
  const ss = session || {};
  const nguoiHocId = ss.nguoiHocId || ss.userId || "";
  const payload = {
    action: `${ep.module}/${ep.suffix}`,
    func: ep.func,
    iM: ss.iM || IM_MAC_DINH,
    strNguoiThucHien_Id: ss.userId || "",
    strChucNang_Id: ss.chucNangId || "20160101",
    strQLSV_NguoiHoc_Id: nguoiHocId,
    strDaoTao_ChuongTrinh_Id: ss.chuongTrinhId || "",
    ...patch,
  };

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
  const token = session ? (session.tokenJWT || session.token) : "";
  if (token) {
    headers.Authorization = "Bearer " + token;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: new URLSearchParams({ A: ma_hoa_iu(payload) }),
    signal: AbortSignal.timeout(25000),
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    // Không ném lỗi cú pháp JSON mà kiểm tra theo status code
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Phiên làm việc trên cổng IU không hợp lệ hoặc đã hết hạn (HTTP 401).");
    }
    const msg = (json && (json.Message || json.error)) || `Portal IU HTTP ${res.status}`;
    throw new Error(msg);
  }

  if (!json) {
    throw new Error(`Portal IU trả về dữ liệu không hợp lệ (HTTP ${res.status}).`);
  }

  let duLieuGiaiMa = json.Data;
  if (json.Data && typeof json.Data === "object" && typeof json.Data.B === "string") {
    const keysThu = [payload.iM || IM_MAC_DINH, "AzzSystem", "AzzKeyApi", "AzzCore"];
    for (const k of keysThu) {
      if (!k) continue;
      try {
        const rawPlain = giai_ma_iu(json.Data.B, k);
        if (rawPlain) {
          try {
            duLieuGiaiMa = JSON.parse(rawPlain);
          } catch {
            duLieuGiaiMa = rawPlain;
          }
          break;
        }
      } catch {}
    }
  }

  return { ok: true, data: duLieuGiaiMa, raw: json };
}

/**
 * Đăng nhập Cổng Thông Tin IU CMCU (iu.cmcu.edu.vn)
 * Hỗ trợ tự động thử cả tài khoản có đuôi @st.cmcu.edu.vn và mã sinh viên gốc
 */
export async function loginIUPortal({ username, password }) {
  const rawUser = String(username || "").trim();
  const pass = String(password || "").trim();
  if (!rawUser || !pass) {
    throw new Error("Vui lòng nhập tài khoản/mã sinh viên và mật khẩu cổng IU.");
  }

  // Tạo các biến thể đăng nhập để thử nghiệm linh hoạt
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
      // Bước 1: Lấy __VIEWSTATE và Session cookies ban đầu từ login.aspx
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

      // Bước 2: Gửi form đăng nhập
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

      // Kiểm tra phản hồi đăng nhập
      const isRedirectToIndex = (postRes.status >= 300 && postRes.status < 400 && /Index\.aspx/i.test(location));
      const hasAuthCookie = /\.ASPXAUTH/i.test(combinedCookies);
      const notifyMatch = postHtml.match(/<span[^>]*id=["']lblNotify["'][^>]*>([\s\S]*?)<\/span>/i);
      const notifyText = notifyMatch ? notifyMatch[1].trim() : "";

      const isFailed = (postRes.status === 200 && (notifyText || postHtml.includes("lblNotify"))) ||
        postHtml.includes("Tai khoan khong dung") ||
        postHtml.includes("không chính xác") ||
        postHtml.includes("đăng nhập không thành công");

      if (isFailed && !isRedirectToIndex && !hasAuthCookie) {
        continue; // Thử biến thể tài khoản tiếp theo
      }

      // Bước 3: Đọc Index.aspx để lấy thông tin phiên (AXYZCLRVN / Token JWT / edu.system)
      let token = "";
      let studentId = candidate.includes("@") ? candidate.split("@")[0] : candidate;
      let chucNangId = "20160101";

      try {
        const indexRes = await fetch(`${IU_ORIGIN}/congthongtin/Index.aspx`, {
          headers: {
            "Cookie": combinedCookies,
            "Referer": `${IU_ORIGIN}/congthongtin/login.aspx`,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          },
          redirect: "manual",
          signal: AbortSignal.timeout(15000)
        });

        if (indexRes.status === 200) {
          const indexHtml = await indexRes.text();

          // Giải mã chuỗi AXYZCLRVN nếu có trong Index.aspx
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
    } catch {
      // Tiếp tục thử variant khác
    }
  }

  if (!successSession || (!successCookies && !successSession.token)) {
    throw new Error("Tài khoản hoặc mật khẩu cổng thông tin IU không đúng. Vui lòng kiểm tra lại Mã sinh viên (ví dụ: bai250001) và Mật khẩu cổng trường!");
  }

  return { session: successSession, cookie: successCookies };
}

/**
 * Kéo bảng điểm và hồ sơ sinh viên từ Portal IU
 */
export async function layBangDiemVaHoSoIU(session, cookie) {
  // Bước 1: Lấy chương trình đào tạo ID để truyền vào tham số bảng điểm (tránh 401)
  let chuongTrinhId = session.chuongTrinhId || "";
  if (!chuongTrinhId) {
    try {
      const cthRes = await goiIU(session, cookie, "LayThongTinChuongTrinhHoc", {});
      const cthList = Array.isArray(cthRes.data) ? cthRes.data : [];
      if (cthList[0]) {
        chuongTrinhId = cthList[0].DAOTAO_TOCHUCCHUONGTRINH_ID || cthList[0].ID || cthList[0].DAOTAO_CHUONGTRINH_ID || "";
        session.chuongTrinhId = chuongTrinhId;
      }
    } catch {}
  }

  let kq = null;
  try {
    const res = await goiIU(session, cookie, "KetQuaHocTapCaNhan", chuongTrinhId ? { strDaoTao_ChuongTrinh_Id: chuongTrinhId } : {});
    kq = res.data;
  } catch (err) {
    throw new Error(`Không thể lấy kết quả học tập từ IU: ${err.message}`);
  }

  const r = (kq && kq.rsThongTinNguoiHoc && kq.rsThongTinNguoiHoc[0]) || {};
  let ct = [];
  try {
    const resCt = await goiIU(session, cookie, "LayThongTinChiTietHoSo", {});
    ct = Array.isArray(resCt.data) ? resCt.data : [];
  } catch {}

  const t = ct[0] || {};
  const hoDem = r.QLSV_NGUOIHOC_HODEM || t.HODEM || "";
  const ten = r.QLSV_NGUOIHOC_TEN || t.TEN || "";
  const hoTen = `${hoDem} ${ten}`.trim() || r.QLSV_NGUOIHOC_HOTEN || "Sinh viên CMC";

  const studentInfo = {
    ma_sinh_vien: r.QLSV_NGUOIHOC_MASO || t.MASO || session.userId || "",
    ho_ten: hoTen,
    ngay_sinh: r.QLSV_NGUOIHOC_NGAYSINH || t.QLSV_NGUOIHOC_NGAYSINH || "",
    email: r.EMAIL || t.EMAIL || "",
    lop: r.DAOTAO_LOPQUANLY_TEN || t.LOP || "",
    nganh: r.NGANH || t.NGANH || "Công nghệ thông tin",
    khoa: r.KHOA || t.KHOA || "",
  };

  const rsDiem = (kq && kq.rsDiemKetThucHocPhan) || [];
  const rsThanhPhan = (kq && kq.rsDiemThanhPhan) || [];

  const rawSubjects = rsDiem.map(e => {
    const eHocPhanId = e.DAOTAO_HOCPHAN_ID != null ? String(e.DAOTAO_HOCPHAN_ID).trim() : "";
    const eMaMon = e.DAOTAO_HOCPHAN_MA != null ? String(e.DAOTAO_HOCPHAN_MA).trim().toUpperCase() : "";
    const eLanHoc = e.LANHOC != null ? String(e.LANHOC).trim() : "";

    const matchedParts = rsThanhPhan.filter(x => {
      const xHocPhanId = x.DAOTAO_HOCPHAN_ID != null ? String(x.DAOTAO_HOCPHAN_ID).trim() : "";
      const xMaMon = (x.DAOTAO_HOCPHAN_MA || x.MAHOCPHAN) != null ? String(x.DAOTAO_HOCPHAN_MA || x.MAHOCPHAN).trim().toUpperCase() : "";
      const matchId = (eHocPhanId && xHocPhanId && eHocPhanId === xHocPhanId) ||
                      (eMaMon && xMaMon && eMaMon === xMaMon);
      if (!matchId) return false;
      const xLanHoc = x.LANHOC != null ? String(x.LANHOC).trim() : "";
      if (eLanHoc && xLanHoc && eLanHoc !== xLanHoc) return false;
      return true;
    });

    const getPartScore = kw => {
      const f = matchedParts.find(x => {
        const name = String(x.DIEM_THANHPHANDIEM_TEN || x.TEN_THANHPHANDIEM || x.THANHPHAN_TEN || x.TEN || "");
        return new RegExp(kw, "i").test(name);
      });
      if (!f || f.DIEM == null || f.DIEM === "") return null;
      const num = Number(f.DIEM);
      return Number.isFinite(num) ? num : null;
    };

    return {
      ma_mon: String(e.DAOTAO_HOCPHAN_MA || ""),
      ten_hoc_phan: String(e.DAOTAO_HOCPHAN_TEN || ""),
      so_tin_chi: Number(e.DAOTAO_HOCPHAN_HOCTRINH) || 3,
      diem_he_10: Number.isFinite(Number(e.DIEM)) ? Number(e.DIEM) : 0,
      diem_he_4: Number.isFinite(Number(e.DIEMQUYDOI)) ? Number(e.DIEMQUYDOI) : 0,
      diem_chu: String(e.DIEMQUYDOI_TEN || "B").trim(),
      hoc_ky: String(e.HOCKY || e.HOC_KY || "Học kỳ 1"),
      nam_hoc: String(e.NAMHOC || e.NAM_HOC || ""),
      xep_loai: String(e.DANHGIA_TEN || ""),
      chi_tiet_diem: {
        chuyen_can: getPartScore("chuy[eêèéẻẽẹ]n.*c[aâàáảãạ]n|cc$|chuyencan|điểm danh|danh"),
        bai_tap: getPartScore("b[aàáảãạ]i.*t[aâàáảãạ]p|bt$|baitap|qu[aá].*tr[iì]nh|quatrinh|d[aá]nh.*gi[aá]|thường xuyên"),
        giua_ky: getPartScore("gi[uư][aã].*k[yỳ]|gk$|giuaky"),
        cuoi_ky: getPartScore("cu[oô][ií].*k[yỳ]|cuoiky|cu[oô][ií].*thi|ck$|thi.*k[eê]t.*th[uú]c|thi"),
      },
    };
  });

  return { studentInfo, rawSubjects };
}

/**
 * Chuẩn hoá và làm sạch tên môn học (loại bỏ hậu tố lớp học phần, phòng thực hành, mã đuôi portal IU)
 */
export function cleanCourseName(name) {
  if (!name || typeof name !== "string") return "";
  let clean = name.trim();
  clean = clean.replace(/[-_]\s*\d+-\d+-\d+.*$/i, "");
  clean = clean.replace(/[-_]\s*N\d+.*$/i, "");
  clean = clean.replace(/\s*\([A-Z0-9_\-]+\)\s*(\.(LT|TH|LT\+TH|BT))?$/i, "");
  clean = clean.replace(/\.(LT|TH|LT\+TH|BT)$/i, "");
  clean = clean.replace(/\s*-\s*Lớp.*$/i, "");
  clean = clean.replace(/\s+/g, " ").trim();
  return clean || name.trim();
}

/**
 * Chuẩn hoá và bóc tách mã môn học chuẩn (VD: INFO2011 từ INFO2011-1-1-26(N08))
 */
export function cleanCourseCode(code) {
  if (!code || typeof code !== "string") return "";
  const trimmed = code.trim().toUpperCase();
  const match = trimmed.match(/^([A-Z0-9]{3,10})[-_]/i);
  if (match) return match[1].toUpperCase();
  return trimmed.replace(/\s*\([^\)]*\)/g, "").trim();
}

/**
 * Chuẩn hoá khoá so sánh môn học (bỏ dấu tiếng Việt, bỏ ký tự đặc biệt, chữ thường)
 */
export function normalizeCourseKey(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Hợp nhất và loại bỏ môn học bị trùng lặp giữa Thời khóa biểu (Lịch học) và Kết quả đăng ký học
 */
export function mergeAndDeduplicateActiveCourses(courses = [], rawSubjects = []) {
  if (!Array.isArray(courses)) return [];
  const map = new Map();

  const rawSubjectMap = new Map();
  if (Array.isArray(rawSubjects)) {
    for (const s of rawSubjects) {
      const code = cleanCourseCode(s.ma_mon || "");
      const name = cleanCourseName(s.ten_hoc_phan || s.ten_mon || "");
      const keyName = normalizeCourseKey(name);
      if (keyName && !rawSubjectMap.has(keyName)) {
        rawSubjectMap.set(keyName, { ma_mon: code, so_tin_chi: Number(s.so_tin_chi) || 0 });
      }
      if (code && !rawSubjectMap.has(code)) {
        rawSubjectMap.set(code, { ma_mon: code, so_tin_chi: Number(s.so_tin_chi) || 0 });
      }
    }
  }

  for (const c of courses) {
    if (!c || typeof c !== "object") continue;
    const rawName = c.ten_mon || c.ten_hoc_phan || "";
    const cleanName = cleanCourseName(rawName);
    const rawCode = c.ma_mon || "";
    const cleanCode = cleanCourseCode(rawCode);

    const nameKey = normalizeCourseKey(cleanName);
    const codeKey = cleanCode ? cleanCode.toUpperCase() : "";

    let existingKey = null;
    if (nameKey && map.has("NAME:" + nameKey)) {
      existingKey = "NAME:" + nameKey;
    } else if (codeKey && map.has("CODE:" + codeKey)) {
      existingKey = "CODE:" + codeKey;
    } else {
      for (const [k, item] of map.entries()) {
        const itemCode = cleanCourseCode(item.ma_mon);
        const itemNameKey = normalizeCourseKey(item.ten_mon);
        if (codeKey && itemCode && codeKey === itemCode) {
          existingKey = k;
          break;
        }
        if (nameKey && itemNameKey && nameKey === itemNameKey) {
          existingKey = k;
          break;
        }
      }
    }

    const fallbackRaw = (nameKey && rawSubjectMap.get(nameKey)) || (codeKey && rawSubjectMap.get(codeKey));

    if (!existingKey) {
      const chosenKey = nameKey ? "NAME:" + nameKey : "CODE:" + codeKey;
      const initial = {
        ma_mon: cleanCode || (fallbackRaw ? fallbackRaw.ma_mon : "") || rawCode,
        ten_mon: cleanName || rawName || "Học phần",
        so_tin_chi: Number(c.so_tin_chi) || (fallbackRaw ? fallbackRaw.so_tin_chi : 0) || 0,
        giang_vien: (c.giang_vien || "").trim(),
        phong: (c.phong || "").trim(),
        trang_thai: (c.trang_thai || "").trim(),
        hinh_thuc: (c.hinh_thuc || "").trim(),
        ma_lop: c.ma_lop || (rawCode !== cleanCode ? rawCode : "")
      };
      map.set(chosenKey, initial);
      if (nameKey) map.set("NAME:" + nameKey, initial);
      if (codeKey) map.set("CODE:" + codeKey, initial);
    } else {
      const existing = map.get(existingKey);
      if (!existing.ma_mon && (cleanCode || rawCode)) {
        existing.ma_mon = cleanCode || rawCode;
      } else if (cleanCode && existing.ma_mon && existing.ma_mon.includes("-")) {
        existing.ma_mon = cleanCode;
      }

      if (cleanName && (!existing.ten_mon || existing.ten_mon.length > cleanName.length)) {
        existing.ten_mon = cleanName;
      }

      if (!existing.so_tin_chi && Number(c.so_tin_chi) > 0) {
        existing.so_tin_chi = Number(c.so_tin_chi);
      }

      if (!existing.giang_vien && c.giang_vien) existing.giang_vien = String(c.giang_vien).trim();
      if (!existing.phong && c.phong) existing.phong = String(c.phong).trim();
      if (!existing.trang_thai && c.trang_thai) existing.trang_thai = String(c.trang_thai).trim();
      if (!existing.hinh_thuc && c.hinh_thuc) existing.hinh_thuc = String(c.hinh_thuc).trim();
      if (!existing.ma_lop && (c.ma_lop || (rawCode !== cleanCode ? rawCode : ""))) {
        existing.ma_lop = c.ma_lop || rawCode;
      }

      if (nameKey) map.set("NAME:" + nameKey, existing);
      if (codeKey) map.set("CODE:" + codeKey, existing);
    }
  }

  const uniqueItems = Array.from(new Set(map.values()));
  return uniqueItems.map(c => {
    let code = cleanCourseCode(c.ma_mon);
    if (!code && c.ten_mon) {
      const fb = rawSubjectMap.get(normalizeCourseKey(c.ten_mon));
      if (fb && fb.ma_mon) code = fb.ma_mon;
    }
    const credits = Number(c.so_tin_chi) || (c.ten_mon && rawSubjectMap.get(normalizeCourseKey(c.ten_mon))?.so_tin_chi) || 0;

    return {
      ma_mon: code || c.ma_mon || "",
      ten_mon: cleanCourseName(c.ten_mon || c.ten_hoc_phan || "Học phần"),
      so_tin_chi: credits,
      giang_vien: c.giang_vien || "",
      phong: c.phong || "",
      trang_thai: c.trang_thai || (c.hinh_thuc ? c.hinh_thuc : "Đang học"),
      hinh_thuc: c.hinh_thuc || "",
      ma_lop: c.ma_lop || ""
    };
  });
}

/**
 * Xử lý dữ liệu bảng điểm, gom nhóm học kỳ và tính toán GPA tổng + môn yếu
 * Chuẩn CMC University: Loại trừ các môn điều kiện Pass/Fail (Điểm chữ P, NP, Đạt, Miễn, Thể dục, GDQP, Tiếng Anh điều kiện)
 * để tính đúng 100% GPA tích lũy hệ 4 và hệ 10 như trên cổng trường IU.
 */
export function processAcademicTranscript(bangDiemRaw, studentInfo = {}, activeCourses = []) {
  const list = Array.isArray(bangDiemRaw) ? bangDiemRaw : [];
  const cleanActiveCourses = mergeAndDeduplicateActiveCourses(activeCourses, list);

  function isGpaSubject(m) {
    const letter = String(m.diem_chu || "").trim().toUpperCase();
    if (["P", "NP", "ĐẠT", "DAT", "M", "MIỄN", "MIEN", "KĐ", "KD", "I", "W", "CHƯA CÓ ĐIỂM", ""].includes(letter)) {
      return false;
    }
    const name = String(m.ten_hoc_phan || "").toLowerCase();
    const code = String(m.ma_mon || "").toUpperCase();
    if (/thể dục|thể chất|đá cầu|bóng rổ|bóng chuyền|bóng bàn|bơi lội|điền kinh|quốc phòng|an ninh|gdqp/i.test(name)) {
      return false;
    }
    if (/^GENE101[0-9]/.test(code) || /^MIL/.test(code)) {
      return false;
    }
    if (/^ENG-100[1-9]/.test(code) && (Number(m.diem_he_4) === 0 || letter === "P")) {
      return false;
    }
    return true;
  }

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
    const passed = (score10 >= 4.0 || letter === "P" || letter === "ĐẠT") && letter !== "F" && letter !== "NP";
    const countsInGpa = isGpaSubject(m);

    const semName = (m.hoc_ky ? `${m.hoc_ky}` : "Học kỳ") + (m.nam_hoc ? ` - Năm học ${m.nam_hoc}` : "");
    if (!semesterMap.has(semName)) {
      semesterMap.set(semName, {
        semester_name: semName,
        hoc_ky: m.hoc_ky || "",
        nam_hoc: m.nam_hoc || "",
        subjects: [],
        total_credits: 0,
        gpa_credits: 0,
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
      countsInGpa,
      chi_tiet_diem: m.chi_tiet_diem || {}
    });

    sem.total_credits += credits;
    if (countsInGpa) {
      sem.gpa_credits += credits;
      sem.weighted_10 += score10 * credits;
      sem.weighted_4 += score4 * credits;

      totalCredits10 += credits;
      totalWeighted10 += score10 * credits;
      totalCredits4 += credits;
      totalWeighted4 += score4 * credits;
    }

    if (passed && countsInGpa) {
      totalPassedCredits += credits;
    }
  }

  const semesters = [];
  for (const [, sem] of semesterMap.entries()) {
    sem.gpa_10 = sem.gpa_credits > 0 ? Math.round((sem.weighted_10 / sem.gpa_credits) * 100) / 100 : 0;
    sem.gpa_4 = sem.gpa_credits > 0 ? Math.round((sem.weighted_4 / sem.gpa_credits) * 100) / 100 : 0;
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

  // Danh sách môn cần cải thiện (chỉ xét môn tính vào GPA có điểm C+, C, D+, D, F hoặc điểm hệ 10 < 7.0)
  const weakSubjects = list
    .filter(m => {
      if (!isGpaSubject(m)) return false;
      const score = Number(m.diem_he_10) || 0;
      const letter = String(m.diem_chu || "").toUpperCase();
      return score < 7.0 || ["F", "D", "D+", "C", "C+"].includes(letter);
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
      email: studentInfo.email || "",
      khoa: studentInfo.khoa || "",
      ngay_sinh: studentInfo.ngay_sinh || ""
    },
    gpa: {
      overall_10: overallGpa10,
      overall_4: overallGpa4,
      total_credits: totalCredits4,
      passed_credits: totalPassedCredits,
      classification,
      badgeColor,
      total_subjects: list.length,
      weak_count: weakSubjects.length
    },
    semesters,
    weak_subjects: weakSubjects,
    active_courses: cleanActiveCourses,
    raw_subjects: list
  };
}

/**
 * Cố vấn 3TG AI: Phân tích bảng điểm & lập lộ trình cải thiện điểm số
 */
export async function generateAcademicAdvisorPlan(transcriptData, targetGpa = 3.2, env = {}, selectedCourse = "all") {
  const apiKey = env.LOCAL_AI_API_KEY || env.DEEPSEEK_API_KEY || env.VITE_DEEPSEEK_API_KEY || "";
  const endpoint = env.LOCAL_AI_ENDPOINT || "https://api.deepseek.com/chat/completions";
  const model = env.DEEPSEEK_MODEL || "deepseek-chat";

  if (!apiKey && !env.LOCAL_AI_ENDPOINT) {
    throw new Error("Chưa cấu hình API Key cho 3TG AI. Hãy kiểm tra biến DEEPSEEK_API_KEY trong file .dev.vars!");
  }

  const { student = {}, gpa = {}, weak_subjects = [], semesters = [], active_courses = [], raw_subjects = [] } = transcriptData;

  const weakSubjectsSummary = (weak_subjects || []).slice(0, 8).map((s, idx) =>
    `${idx + 1}. ${s.ten_hoc_phan} (${s.ma_mon}) — ${s.so_tin_chi} tín chỉ. Điểm hiện tại: ${s.diem_he_10}/10 (Hệ 4: ${s.diem_he_4}, Điểm chữ: ${s.diem_chu}). Nếu kéo lên điểm A sẽ giúp GPA tăng ngay +${s.gpaGainIfA} điểm.`
  ).join("\n");

  const semestersSummary = (semesters || []).map(s =>
    `• ${s.semester_name}: ${s.subjects.length} môn, ${s.total_credits} tín chỉ, GPA kỳ: ${s.gpa_4}/4.0 (${s.gpa_10}/10)`
  ).join("\n");

  const activeCoursesSummary = (active_courses || []).map((c, idx) =>
    `${idx + 1}. ${c.ten_mon || c.ten_hoc_phan} (${c.ma_mon}) ${c.so_tin_chi ? `- ${c.so_tin_chi} tín chỉ` : ""} ${c.giang_vien ? `[GV: ${c.giang_vien}]` : ""} ${c.phong ? `[Phòng: ${c.phong}]` : ""}`
  ).join("\n");

  let systemPrompt = "";
  let userPrompt = "";

  const isSpecificCourse = selectedCourse && selectedCourse !== "all" && selectedCourse !== "toan-canh";

  if (isSpecificCourse) {
    const allKnownSubjects = [
      ...raw_subjects,
      ...active_courses.map(c => ({
        ma_mon: c.ma_mon,
        ten_hoc_phan: c.ten_mon || c.ten_hoc_phan,
        so_tin_chi: c.so_tin_chi || 3,
        isActive: true
      }))
    ];

    const matched = allKnownSubjects.find(s =>
      String(s.ten_hoc_phan || s.ten_mon || "").toLowerCase().includes(selectedCourse.toLowerCase()) ||
      String(s.ma_mon || "").toLowerCase().includes(selectedCourse.toLowerCase())
    ) || { ten_hoc_phan: selectedCourse, so_tin_chi: 3 };

    const courseTitle = matched.ten_hoc_phan || matched.ten_mon || selectedCourse;
    const courseCode = matched.ma_mon || "";
    const currentGrade = matched.diem_he_10 !== undefined
      ? `${matched.diem_he_10}/10 (Hệ 4: ${matched.diem_he_4}, Điểm chữ: ${matched.diem_chu})`
      : "Môn đang học kỳ này trên thời khóa biểu";

    systemPrompt = `Bạn là Giáo sư Thỏ Bảy Màu & Trợ giảng AI Chuyên gia của trường Đại học CMC (CMC University).
Nhiệm vụ: Cung cấp PHƯƠNG PHÁP HỌC THỰC CHIẾN và BÍ KÍP SĂN ĐIỂM A/A+ CHO DUY NHẤT MÔN HỌC ĐƯỢC CHỈ ĐỊNH.
QUY TẮC BẮT BUỘC:
- KHÔNG viết mở đầu "Kính gửi", "Chủ đề", không dài dòng. Đi thẳng vào hành động!
- TẬP TRUNG 100% VÀO MÔN HỌC ĐƯỢC YÊU CẦU. TUYỆT ĐỐI KHÔNG nói lan man sang các môn khác!
- Nội dung cụ thể, bám sát kiến thức thực tế và cấu trúc đề thi tại Đại học CMC.
- Trình bày dạng bảng Markdown, gạch đầu dòng, checklist ngắn gọn, KHÔNG VIẾT VĂN XUÔI DÀI DÒNG!`;

    userPrompt = `
Hãy lập CẨM NĂNG PHƯƠNG PHÁP HỌC & LỘ TRÌNH SĂN ĐIỂM A/A+ CHO DUY NHẤT MÔN NÀY:
🎯 **Môn học: ${courseTitle}** ${courseCode ? `(${courseCode})` : ""}
- Tình trạng điểm: ${currentGrade}
- Ngành học sinh viên: ${student.nganh || "Công nghệ thông tin"} (CMC University)

Cấu trúc trình bày súc tích, trực quan:

## 💡 1. Bản chất môn học & Các cạm bẫy "mất điểm oan"
- Bản chất cốt lõi của môn ${courseTitle}.
- Những chương / dạng bài khó nhất mà sinh viên CMC hay bị điểm kém trong bài thi.
- 3 lỗi sai kinh điển cần tránh tuyệt đối khi làm bài thi.

## 🎯 2. Phương pháp học thực chiến & Nguồn tài liệu đỉnh nhất
- Chiến thuật học hiểu sâu bản chất (Active Recall, sơ đồ tư duy, flashcard công thức/code).
- Nguồn tài liệu, giáo trình, slide hoặc kênh ôn tập chất lượng cao nên học.
- Mẹo làm lab / bài tập lớn / bài tập tuần để lấy trọn điểm tối đa.

## 📊 3. Chiến thuật "Vét trọn điểm" từng cột điểm tại CMC
| Cột điểm | Trọng số | Chiến thuật săn điểm tối đa của Thầy Thỏ |
|---|---|---|
| **Chuyên cần** | 10% | Đi học 100%, ngồi bàn đầu, tích cực tương tác |
| **Bài tập / Quá trình / Lab** | 20-30% | Nộp bài trước hạn, đúng rubric barem chấm điểm |
| **Giữa kỳ & Cuối kỳ** | 60-70% | Cấu trúc đề thi, dạng bài nhiều điểm nhất, mẹo phân bổ thời gian |

## 📅 4. Checklist 4 tuần nước rút săn điểm A (9.0+)
- **Tuần 1 (Nền tảng):** Nắm chắc lý thuyết cốt lõi & tổng hợp sơ đồ tư duy công thức.
- **Tuần 2 (Thực chiến):** Quét sạch các dạng bài tập điển hình từ cơ bản đến nâng cao.
- **Tuần 3 (Luyện đề):** Giải tối thiểu 3 đề thi các kỳ trước của trường CMC, canh thời gian.
- **Tuần 4 (Về đích):** Thi thử bấm giờ, vá lỗ hổng kiến thức và chuẩn bị tâm lý tự tin.
`;
  } else {
    systemPrompt = `Bạn là Giáo sư Thỏ Bảy Màu & Cố vấn Học thuật 3TG AI của trường Đại học CMC (CMC University).
Nhiệm vụ: Đưa ra BÁO CÁO CỐ VẤN HỌC THUẬT TOÀN CẢNH TINH GỌN, TRỰC QUAN, ĐI THẲNG VÀO HÀNH ĐỘNG.
QUY TẮC BẮT BUỘC:
- KHÔNG viết mở đầu "Kính gửi", "Chủ đề", không viết văn xuôi dài dòng lan man.
- Sử dụng bảng Markdown và bullet points súc tích, dễ nhìn.`;

    userPrompt = `
BẢNG TỔNG KẾT HỌC THUẬT:
- Sinh viên: ${student.ho_ten} (${student.ma_sinh_vien || "Chưa có"}) — Ngành: ${student.nganh}
- GPA Tích lũy Hiện tại: ${gpa.overall_4}/4.0 (Hệ 10: ${gpa.overall_10}/10) — Xếp loại: ${gpa.classification}
- Tín chỉ tích lũy: ${gpa.passed_credits} / ${gpa.total_credits} tín chỉ.
- Mục tiêu GPA: ${targetGpa || 3.2}/4.0

LỊCH SỬ KẾT QUẢ CÁC HỌC KỲ:
${semestersSummary}

CÁC MÔN HỌC CẦN CẢI THIỆN:
${weakSubjectsSummary || "Không có môn nào dưới 6.5!"}

MÔN ĐANG HỌC KỲ NÀY:
${activeCoursesSummary || "Chưa có môn trên lịch học."}

Hãy đưa ra BÁO CÁO CỐ VẤN TINH GỌN (Dưới 350 từ, định dạng Markdown đẹp mắt):
## 🩺 1. Nhận định nhanh phong độ học tập
- Nhận xét ngắn gọn thực trạng GPA hiện tại và cơ hội bứt phá lên ${targetGpa}/4.0.

## 🎯 2. Top 2 môn gỡ điểm mang lại bước nhảy GPA cao nhất
| Mã môn | Tên học phần | Điểm hiện tại | Nâng lên A | GPA tổng nhảy vọt |
|---|---|---|---|---|

## 🎒 3. Chiến lược cho các môn đang học kỳ này
- Định hướng hành động cụ thể để săn A/A+ chặn đứng đà tụt điểm.

## 📅 4. Kế hoạch hành động 4 tuần
- Tuần 1 đến Tuần 4 ngắn gọn, súc tích.
`;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "Authorization": `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: 2200
    }),
    signal: AbortSignal.timeout(90000)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`3TG AI API lỗi HTTP ${res.status}: ${errText}`);
  }

  const json = await res.json();
  const reply = json.choices?.[0]?.message?.content || "";
  return reply;
}
