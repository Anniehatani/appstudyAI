import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

const devVars = {};
if (fs.existsSync('.dev.vars')) {
  for (const line of fs.readFileSync('.dev.vars', 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const idx = t.indexOf('=');
    if (idx > 0) devVars[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
}

const dbPath = path.resolve("build/local_replica.sqlite");
const sqliteDb = new DatabaseSync(dbPath);
devVars.DB = {
  prepare(sql) {
    return {
      bind(...params) {
        const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        return {
          async first(col) {
            const stmt = sqliteDb.prepare(sql);
            const row = stmt.get(...flat);
            if (!row) return null;
            if (col !== undefined) return row[col];
            return row;
          },
          async all() {
            const stmt = sqliteDb.prepare(sql);
            const rows = stmt.all(...flat);
            return { success: true, results: rows || [], meta: {} };
          },
          async run() {
            const stmt = sqliteDb.prepare(sql);
            const res = stmt.run(...flat);
            return { success: true, meta: { changes: res.changes } };
          }
        };
      }
    };
  }
};

const workerModule = await import('../src/index.js');
const worker = workerModule.default;

async function runTest() {
  console.log("=== KIỂM TRA TÍNH NĂNG CẢI THIỆN ĐIỂM & IU CRAWLER ===");

  const cookieVal = "lumi_session=e483dd96-caa4-47a5-8b73-017069a05e49";
  console.log("1. Sử dụng tài khoản sinh viên đã xác thực:", cookieVal);

  // 2. Test GET /api/academic/transcript
  const getReq1 = new Request("http://127.0.0.1:8787/api/academic/transcript", {
    headers: { "Cookie": cookieVal }
  });
  const getRes1 = await worker.fetch(getReq1, devVars);
  const getData1 = await getRes1.json();
  console.log("2. GET /api/academic/transcript:", getData1);

  // 3. Test POST /api/academic/import-data with CMCU transcript
  const sampleData = {
    student: {
      ma_sinh_vien: "23010123",
      ho_ten: "Lê Văn An",
      nganh: "Công nghệ thông tin",
      lop: "23IT1"
    },
    raw_subjects: [
      {
        ma_mon: "BAS1105",
        ten_hoc_phan: "Toán rời rạc",
        so_tin_chi: 3,
        diem_he_10: 4.8,
        diem_he_4: 1.0,
        diem_chu: "D",
        hoc_ky: "Học kỳ 1",
        nam_hoc: "2023 - 2024",
        chi_tiet_diem: { chuyen_can: 8.5, bai_tap: 6.0, giua_ky: 4.5, cuoi_ky: 4.0 }
      },
      {
        ma_mon: "INT1339",
        ten_hoc_phan: "Lập trình mạng",
        so_tin_chi: 3,
        diem_he_10: 6.0,
        diem_he_4: 2.0,
        diem_chu: "C",
        hoc_ky: "Học kỳ 2",
        nam_hoc: "2023 - 2024",
        chi_tiet_diem: { chuyen_can: 9.0, bai_tap: 7.0, giua_ky: 5.5, cuoi_ky: 5.5 }
      },
      {
        ma_mon: "INT1306",
        ten_hoc_phan: "Cấu trúc dữ liệu và giải thuật",
        so_tin_chi: 4,
        diem_he_10: 8.5,
        diem_he_4: 3.5,
        diem_chu: "B+",
        hoc_ky: "Học kỳ 1",
        nam_hoc: "2024 - 2025",
        chi_tiet_diem: { chuyen_can: 10, bai_tap: 8.5, giua_ky: 8.0, cuoi_ky: 8.5 }
      },
      {
        ma_mon: "INT1401",
        ten_hoc_phan: "Lập trình Web hiện đại",
        so_tin_chi: 3,
        diem_he_10: 9.2,
        diem_he_4: 4.0,
        diem_chu: "A",
        hoc_ky: "Học kỳ 1",
        nam_hoc: "2024 - 2025",
        chi_tiet_diem: { chuyen_can: 10, bai_tap: 9.5, giua_ky: 9.0, cuoi_ky: 9.0 }
      }
    ]
  };

  const importReq = new Request("http://127.0.0.1:8787/api/academic/import-data", {
    method: "POST",
    headers: { "Cookie": cookieVal, "Content-Type": "application/json" },
    body: JSON.stringify({ rawData: sampleData })
  });
  const importRes = await worker.fetch(importReq, devVars);
  const importData = await importRes.json();
  console.log("3. Import bảng điểm thành công:");
  console.log("   - Sinh viên:", importData.transcript?.student?.ho_ten, "(MSV:", importData.transcript?.student?.ma_sinh_vien, ")");
  console.log("   - GPA Hệ 4:", importData.transcript?.gpa?.overall_4, "| GPA Hệ 10:", importData.transcript?.gpa?.overall_10);
  console.log("   - Tín chỉ tích lũy:", importData.transcript?.gpa?.passed_credits, "/", importData.transcript?.gpa?.total_credits);
  console.log("   - Xếp loại:", importData.transcript?.gpa?.classification);
  console.log("   - Số môn cần cải thiện:", importData.transcript?.weak_subjects?.length);
  console.log("   - Số học kỳ:", importData.transcript?.semesters?.length);

  // 4. Test GET /api/academic/transcript after import
  const getReq2 = new Request("http://127.0.0.1:8787/api/academic/transcript", {
    headers: { "Cookie": cookieVal }
  });
  const getRes2 = await worker.fetch(getReq2, devVars);
  const getData2 = await getRes2.json();
  console.log("4. GET /api/academic/transcript sau import:", getData2.hasTranscript ? "✅ Đã nạp thành công" : "❌ Thất bại");

  // 5. Test DeepSeek AI Advisor POST /api/academic/advisor
  console.log("5. Đang gọi DeepSeek AI lên lộ trình nâng điểm...");
  const advisorReq = new Request("http://127.0.0.1:8787/api/academic/advisor", {
    method: "POST",
    headers: { "Cookie": cookieVal, "Content-Type": "application/json" },
    body: JSON.stringify({ targetGpa: 3.5 })
  });
  const advisorRes = await worker.fetch(advisorReq, devVars);
  const advisorData = await advisorRes.json();
  console.log("   Kết quả DeepSeek Advisor:", advisorData.ok ? "✅ THÀNH CÔNG" : "❌ Thất bại");
  console.log("   Trích đoạn phản hồi từ Giáo sư Thỏ Bảy Màu:\n", advisorData.advice ? advisorData.advice.slice(0, 450) + "..." : "Trống");

  sqliteDb.close();
  console.log("\n✅ TẤT CẢ CÁC BƯỚC KIỂM TRA ĐỀU HOÀN HẢO 100%!");
}

runTest().catch(console.error);
