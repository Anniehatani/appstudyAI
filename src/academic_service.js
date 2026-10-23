/**
 * ===================================================================================
 * ACADEMIC & TRANSCRIPT SERVICE (IU PORTAL & DEEPSEEK AI ADVISOR)
 * ===================================================================================
 * Kết nối cổng thông tin IU CMCU (iu.cmcu.edu.vn), cào bảng điểm, tính toán GPA
 * và tích hợp Trợ giảng AI DeepSeek lên lộ trình cải thiện điểm cá nhân hoá.
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
    strChucNang_Id: ss.chucNangId || "",
    strQLSV_NguoiHoc_Id: nguoiHocId,
    strDaoTao_ChuongTrinh_Id: ss.chuongTrinhId || "",
    ...patch,
  };

  const bodyEncrypted = { A: ma_hoa_iu(payload) };
  const url = `${IU_API_BASE}/${ep.module}/${ep.suffix}`;
  const headers = {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json;charset=UTF-8",
    Cookie: cookieFrom(cookie),
    Origin: IU_ORIGIN,
    Referer: `${IU_ORIGIN}/congthongtin/Index.aspx`,
  };
  if (session && (session.token || session.tokenJWT)) {
    headers.Authorization = `Bearer ${session.token || session.tokenJWT}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(bodyEncrypted),
    signal: AbortSignal.timeout(25000),
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Portal IU trả về dữ liệu không hợp lệ (HTTP ${res.status}).`);
  }

  if (!res.ok) {
    throw new Error(`Portal IU HTTP ${res.status}: ${json.Message || text || "Lỗi yêu cầu"}`);
  }

  let duLieuGiaiMa = json.Data;
  if (json.Data && typeof json.Data === "object" && typeof json.Data.B === "string") {
    const rawPlain = giai_ma_iu(json.Data.B, payload.iM || IM_MAC_DINH);
    try {
      duLieuGiaiMa = JSON.parse(rawPlain);
    } catch {
      duLieuGiaiMa = rawPlain;
    }
  }

  return { ok: true, data: duLieuGiaiMa, raw: json };
}

/**
 * Đăng nhập Cổng Thông Tin IU CMCU (iu.cmcu.edu.vn)
 */
export async function loginIUPortal({ username, password }) {
  const user = String(username || "").trim();
  const pass = String(password || "").trim();
  if (!user || !pass) {
    throw new Error("Vui lòng nhập tài khoản/mã sinh viên và mật khẩu cổng IU.");
  }

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
  params.append("username", user);
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

  if (postHtml.includes("Tai khoan khong dung") || postHtml.includes("không chính xác") || postHtml.includes("đăng nhập không thành công")) {
    throw new Error("Tài khoản hoặc mật khẩu cổng thông tin IU không đúng. Vui lòng kiểm tra lại!");
  }

  // Bước 3: Đọc Index.aspx để lấy thông tin phiên
  let token = "";
  let userId = user;
  try {
    const indexRes = await fetch(`${IU_ORIGIN}/congthongtin/Index.aspx`, {
      headers: {
        "Cookie": combinedCookies,
        "Referer": `${IU_ORIGIN}/congthongtin/login.aspx`,
        "User-Agent": "Mozilla/5.0"
      },
      signal: AbortSignal.timeout(15000)
    });
    const indexHtml = await indexRes.text();
    const tokenMatch = indexHtml.match(/token(?:JWT)?["']?\s*[:=]\s*["']([^"']+)["']/i);
    if (tokenMatch) token = tokenMatch[1];
    const userMatch = indexHtml.match(/strQLSV_NguoiHoc_Id["']?\s*[:=]\s*["']([^"']+)["']/i) || indexHtml.match(/userId["']?\s*[:=]\s*["']([^"']+)["']/i);
    if (userMatch) userId = userMatch[1];
  } catch {}

  const session = {
    userId: userId || user,
    token: token,
    tokenJWT: token,
    appId: "Portal_SinhVien"
  };

  return { session, cookie: combinedCookies };
}

/**
 * Kéo bảng điểm và hồ sơ sinh viên từ Portal IU
 */
export async function layBangDiemVaHoSoIU(session, cookie) {
  let kq = null;
  try {
    const res = await goiIU(session, cookie, "KetQuaHocTapCaNhan", {});
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
    const matchedParts = rsThanhPhan.filter(x =>
      String(x.DAOTAO_HOCPHAN_ID) === String(e.DAOTAO_HOCPHAN_ID) &&
      String(x.LANHOC) === String(e.LANHOC)
    );
    const getPartScore = kw => {
      const f = matchedParts.find(x => new RegExp(kw, "i").test(String(x.DIEM_THANHPHANDIEM_TEN || "")));
      return f && Number.isFinite(Number(f.DIEM)) ? Number(f.DIEM) : null;
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
        chuyen_can: getPartScore("chuy.n.c.n|chuyencan|cc$"),
        bai_tap: getPartScore("b.i.t.p|baitap|bt$"),
        giua_ky: getPartScore("gi.a.k|giuaky|gk$"),
        cuoi_ky: getPartScore("cu.i.k|cuoiky|cu.i.thi|ck$|thi.k.t.th.c"),
      },
    };
  });

  return { studentInfo, rawSubjects };
}

/**
 * Xử lý dữ liệu bảng điểm, gom nhóm học kỳ và tính toán GPA tổng + môn yếu
 */
export function processAcademicTranscript(bangDiemRaw, studentInfo = {}) {
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

  // Danh sách môn cần cải thiện (điểm D, D+, C, F hoặc điểm < 6.5)
  // Tính tiềm năng gỡ điểm: nếu nâng môn này lên 4.0 (A) thì GPA 4 tăng bao nhiêu điểm
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

/**
 * Cố vấn AI DeepSeek: Phân tích bảng điểm & lập lộ trình cải thiện điểm số
 */
export async function generateAcademicAdvisorPlan(transcriptData, targetGpa = 3.2, env = {}) {
  const apiKey = env.LOCAL_AI_API_KEY || env.DEEPSEEK_API_KEY || env.VITE_DEEPSEEK_API_KEY || "";
  const endpoint = env.LOCAL_AI_ENDPOINT || "https://api.deepseek.com/chat/completions";
  const model = env.DEEPSEEK_MODEL || "deepseek-chat";

  if (!apiKey && !env.LOCAL_AI_ENDPOINT) {
    throw new Error("Chưa cấu hình API Key DeepSeek. Hãy kiểm tra biến DEEPSEEK_API_KEY trong file .dev.vars!");
  }

  const { student, gpa, weak_subjects, semesters } = transcriptData;

  const weakSubjectsSummary = (weak_subjects || []).slice(0, 8).map((s, idx) =>
    `${idx + 1}. ${s.ten_hoc_phan} (${s.ma_mon}) — ${s.so_tin_chi} tín chỉ. Điểm hiện tại: ${s.diem_he_10}/10 (Hệ 4: ${s.diem_he_4}, Điểm chữ: ${s.diem_chu}). Nếu kéo lên điểm A sẽ giúp GPA tăng ngay +${s.gpaGainIfA} điểm.`
  ).join("\n");

  const semestersSummary = (semesters || []).map(s =>
    `• ${s.semester_name}: ${s.subjects.length} môn, ${s.total_credits} tín chỉ, GPA kỳ: ${s.gpa_4}/4.0 (${s.gpa_10}/10)`
  ).join("\n");

  const prompt = `
Bạn là "Giáo sư Thỏ Bảy Màu & Cố vấn Học thuật Cấp cao 3TG AI" của trường Đại học CMC (CMC University).
Tính cách: Thông tuệ, chiến lược, hài hước, hừng hực động lực, xưng hô "Thầy Thỏ" hoặc "Thỏ Giáo Sư" và gọi sinh viên là "đồng chí học trò" hoặc "bạn nhỏ".

Dưới đây là bảng điểm và hồ sơ học tập thực tế cào từ cổng thông tin IU của sinh viên:
- Sinh viên: ${student.ho_ten} (MSV: ${student.ma_sinh_vien || "Chưa có"})
- Ngành học: ${student.nganh} - Lớp: ${student.lop || "Chưa rõ"}
- GPA Tích lũy Hiện tại: ${gpa.overall_4}/4.0 (Hệ 10: ${gpa.overall_10}/10)
- Xếp loại học lực hiện tại: ${gpa.classification}
- Tổng số tín chỉ đã học: ${gpa.total_credits} (Đã tích lũy: ${gpa.passed_credits} tín chỉ)
- Mục tiêu GPA mong muốn: ${targetGpa || 3.2}/4.0

LỊCH SỬ KẾT QUẢ CÁC HỌC KỲ:
${semestersSummary}

CÁC MÔN HỌC ĐIỂM THẤP KÉO TỤT GPA NHIỀU NHẤT (HÒN ĐÁ TẢNG CẦN GỠ):
${weakSubjectsSummary || "Thật tuyệt vời! Không có môn nào dưới 6.5, phong độ học tập rất ổn định!"}

YÊU CẦU:
Hãy đưa ra một BÁO CÁO CỐ VẤN HỌC THUẬT & LỘ TRÌNH CẢI THIỆN ĐIỂM CHI TIẾT bao gồm:
1. 🩺 **Bắt bệnh bảng điểm & Đánh giá toàn cảnh**: Nhận xét khách quan về phong độ qua các kỳ, phân tích vì sao GPA bị chững lại hoặc tụt, chỉ rõ rủi ro nếu không cải thiện.
2. 🎯 **Chiến lược "Gỡ điểm" ROI cao nhất (Học cải thiện môn nào?)**:
   - Chọn ra chính xác 2-3 môn học lại/cải thiện mang lại bước nhảy GPA lớn nhất với số tín chỉ và công sức tối ưu.
   - Tính toán cụ thể: Nếu kéo môn X từ điểm hiện tại lên B+ hoặc A thì GPA tổng sẽ nhảy vọt lên bao nhiêu!
3. 🧠 **Phương pháp học thực chiến cụ thể cho từng nhóm môn**:
   - Môn lập trình / công nghệ: Cách luyện code, làm lab, tránh mất điểm đồ án.
   - Môn toán / lý thuyết đại cương: Chiến thuật ôn đề cũ, phương pháp Active Recall và Spaced Repetition.
   - Mẹo lấy điểm tối đa ở các cột Chuyên cần, Bài tập quá trình, Giữa kỳ và Cuối kỳ.
4. 📅 **Lộ trình hành động 4 tuần nâng điểm**:
   - Tuần 1: Ôn lại gốc & tổng hợp sơ đồ tư duy.
   - Tuần 2: Luyện giải bài tập & đề thi mẫu các năm.
   - Tuần 3: Giả lập thi thử bấm giờ & vá lỗ hổng kiến thức.
   - Tuần 4: Nước rút, tối ưu tâm lý và chiến thuật làm bài thi.
5. 🥕 **Lời dặn dò tâm huyết của Thỏ Bảy Màu**: Động viên tinh thần, truyền lửa vượt khó, không nản lòng!

Định dạng Markdown đẹp mắt, có emoji sinh động, bullet points rõ ràng, phân cấp tiêu đề chuẩn.
`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "Authorization": `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "Bạn là Giáo sư Thỏ Bảy Màu & Cố vấn Học thuật cấp cao 3TG AI. Hãy đưa ra chiến lược nâng điểm và lộ trình học chuẩn xác, truyền cảm hứng và khoa học nhất." },
        { role: "user", content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 2500
    }),
    signal: AbortSignal.timeout(90000)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek API lỗi HTTP ${res.status}: ${errText}`);
  }

  const json = await res.json();
  const reply = json.choices?.[0]?.message?.content || "";
  return reply;
}
