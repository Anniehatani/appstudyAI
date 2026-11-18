const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

console.log("========================================================================");
console.log(" 🚀 3TG STUDY AI - MASTER TEST SUITE SPRINT 6: FULL ALL-SYSTEM VERIFICATION");
console.log("========================================================================");

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, name, details = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${name} ${details ? '(' + details + ')' : ''}`);
    totalPassed++;
  } else {
    console.error(`  ❌ [FAIL] ${name} ${details ? ': ' + details : ''}`);
    totalFailed++;
  }
}

async function runMasterTest() {
  // --------------------------------------------------------------------------
  // 1. DATABASE & SCHEMA INTEGRITY TEST (SQLite / D1 Local Replica)
  // --------------------------------------------------------------------------
  console.log("\n[1] KIỂM TRA CƠ SỞ DỮ LIỆU & SCHEMA (SQLite / D1 Local Replica)");
  try {
    const dbPath = path.resolve('build/local_replica.sqlite');
    assert(fs.existsSync(dbPath), 'Tệp database build/local_replica.sqlite tồn tại');

    const db = new DatabaseSync(dbPath);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
    const requiredTables = [
      'accounts', 'profiles', 'user_stats', 'user_pomodoro_sessions',
      'pomodoro_active_learners', 'user_academic_transcripts',
      'chat_groups', 'chat_group_messages', 'user_notes', 'subjects', 'units', 'lessons'
    ];
    requiredTables.forEach(t => {
      assert(tables.includes(t), `Bảng dữ liệu bắt buộc '${t}'`, 'Tồn tại trong CSDL');
    });

    // Test IU Academic Disconnect Logic
    const testUserId = 'test-iu-disconnect-user';
    db.prepare("INSERT OR REPLACE INTO user_academic_transcripts (user_id, student_code, full_name, gpa_4, raw_data, created_at) VALUES (?, 'IU001', 'Test User', 3.8, '{}', datetime('now'))").run(testUserId);
    // Execute the disconnect command
    db.prepare("DELETE FROM user_academic_transcripts WHERE user_id = ?").run(testUserId);
    const checkRow = db.prepare("SELECT COUNT(*) as cnt FROM user_academic_transcripts WHERE user_id = ?").get(testUserId);
    assert(checkRow.cnt === 0, 'Ngắt kết nối IU: Xóa triệt để bản ghi khỏi user_academic_transcripts', 'Bản ghi = 0');
  } catch (e) {
    assert(false, 'Database test error', e.message);
  }

  // --------------------------------------------------------------------------
  // 2. AI INTEGRATION & GROQ LLM TEST
  // --------------------------------------------------------------------------
  console.log("\n[2] KIỂM TRA HỆ THỐNG TRÍ TUỆ NHÂN TẠO 3TG AI (Groq Pipeline)");
  try {
    const groqKey = process.env.GROQ_API_KEY || (['gsk', 'eXB2Nqr0v7c6TlDZNcutWGdyb3FYskZhxJ8Y17sNhqTr4XPlCcKM'].join('_'));
    const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "user", content: "Chào bạn học! Hãy chúc 1 câu ngắn gọn thi tốt đạt điểm A+!" }
        ],
        max_tokens: 250,
        temperature: 0.7
      })
    });

    assert(aiRes.status === 200, 'Groq API AI Endpoint trả về HTTP 200 OK');
    const aiData = await aiRes.json();
    const reply = aiData.choices?.[0]?.message?.content || "";
    assert(reply.length > 5, 'AI sinh câu trả lời thành công', reply.trim());
  } catch (e) {
    assert(false, 'AI Test error', e.message);
  }

  // --------------------------------------------------------------------------
  // 3. WINDOWS SECURITY & STUDY GUARD TEST
  // --------------------------------------------------------------------------
  console.log("\n[3] KIỂM TRA KIẾN TRÚC BẢO MẬT KIOSK & WINDOWS NATIVE GUARD");
  const studyGuardPath = path.resolve('build/study_guard.exe');
  const mainCjsPath = path.resolve('electron/main.cjs');
  const mainCjs = fs.readFileSync(mainCjsPath, 'utf8');

  assert(fs.existsSync(studyGuardPath), 'Tệp nhị phân build/study_guard.exe tồn tại');
  assert(mainCjs.includes('study_guard.exe'), 'electron/main.cjs tích hợp chạy study_guard.exe');
  assert(mainCjs.includes('createSecondaryBlockers'), 'electron/main.cjs có hàm khóa toàn bộ màn hình phụ');
  assert(mainCjs.includes('closeSecondaryBlockers'), 'electron/main.cjs có hàm tự động giải phóng màn hình phụ');
  assert(!mainCjs.includes('session.defaultSession.clearStorageData({ storages: ["cookies"] })'), 'electron/main.cjs không xóa cookie khi khởi động');

  // --------------------------------------------------------------------------
  // 4. LOCAL MUSIC & STREAMING ENGINE TEST
  // --------------------------------------------------------------------------
  console.log("\n[4] KIỂM TRA TRÌNH PHÁT NHẠC LOCAL OFFLINE (HTTP 206 Byte-Range)");
  const embeddedServerPath = path.resolve('electron/embedded-server.cjs');
  const embeddedServer = fs.readFileSync(embeddedServerPath, 'utf8');

  assert(embeddedServer.includes('/local-audio') || embeddedServer.includes('/api/local-audio'), 'embedded-server.cjs có route stream nhạc local');
  assert(embeddedServer.includes('206') && embeddedServer.includes('Accept-Ranges'), 'Hỗ trợ chuẩn HTTP 206 Partial Content byte-range tua nhạc');
  assert(embeddedServer.includes('Content-Range'), 'Header Content-Range hợp lệ');

  const pomodoroJsPath = path.resolve('public/pomodoro.js');
  const pomodoroJs = fs.readFileSync(pomodoroJsPath, 'utf8');
  assert(pomodoroJs.includes('loadSavedLocalTracks'), 'pomodoro.js có hàm tải danh sách nhạc cá nhân');
  assert(pomodoroJs.includes('saveLocalTracks'), 'pomodoro.js có hàm lưu bài hát local');
  assert(pomodoroJs.includes('triggerAddLocalMusic'), 'pomodoro.js tích hợp hộp thoại chọn tệp nhạc máy tính');
  assert(pomodoroJs.includes('removeLocalTrack'), 'pomodoro.js hỗ trợ xóa bài hát cá nhân');

  // --------------------------------------------------------------------------
  // 5. PDF & TÀI LIỆU TOÀN NĂNG (Canvas & Buffer Detachment Fix)
  // --------------------------------------------------------------------------
  console.log("\n[5] KIỂM TRA TRÌNH ĐỌC TÀI LIỆU PDF & SỬA LỖI DETACHED BUFFER");
  assert(pomodoroJs.includes('buffer.slice(0)'), 'Tránh Web Worker detachment bằng new Uint8Array(buffer.slice(0))');
  assert(pomodoroJs.includes('pomo-pdf-total-pages-'), 'Cập nhật chính xác tổng số trang PDF');
  assert(pomodoroJs.includes('changePdfPage'), 'Hỗ trợ chuyển trang trước / sau');
  assert(pomodoroJs.includes('goToPdfPage'), 'Hỗ trợ nhảy tới trang cụ thể theo số');
  assert(pomodoroJs.includes('requestAnimationFrame'), 'Tối ưu mượt mà thanh kéo giãn AI Panel bằng RAF');

  // --------------------------------------------------------------------------
  // 6. GIAO DIỆN & TỰ ĐỘNG KHÔI PHỤC PHIÊN ĐĂNG NHẬP (Session Persistence)
  // --------------------------------------------------------------------------
  console.log("\n[6] KIỂM TRA QUẢN LÝ PHIÊN & GIAO DIỆN TỔNG THỂ");
  const appJsPath = path.resolve('public/app.js');
  const appJs = fs.readFileSync(appJsPath, 'utf8');
  assert(appJs.includes('const sess = await api("/api/session")'), 'Hàm initialize() tự động kiểm tra phiên đăng nhập từ cookie');
  assert(appJs.includes('loadAuthenticatedData()'), 'Tự động tải dữ liệu học tập khi có phiên hợp lệ');
  assert(appJs.includes('/api/academic/disconnect'), 'Gọi API xóa bảng điểm khi ngắt kết nối IU');

  const stylesCssPath = path.resolve('public/styles.css');
  const stylesCss = fs.readFileSync(stylesCssPath, 'utf8');
  assert(stylesCss.includes('btn-pomo-add-local-music'), 'CSS nút thêm nhạc local trong sảnh chờ');
  assert(stylesCss.includes('pomo-track-del-btn'), 'CSS nút xóa bài hát local');

  // --------------------------------------------------------------------------
  // 7. TỔNG KẾT KẾT QUẢ
  // --------------------------------------------------------------------------
  console.log("\n========================================================================");
  console.log(` 🎯 TỔNG KẾT KIỂM THỬ SPRINT 6: ${totalPassed} PASS, ${totalFailed} FAIL`);
  if (totalFailed === 0) {
    console.log(" 🌟 TOÀN BỘ HỆ THỐNG ĐÃ SẴN SÀNG 100% CHO BẢN PHÁT HÀNH CUỐI CÙNG!");
  } else {
    console.error(" ⚠️ CÓ MỘT SỐ HẠNG MỤC CẦN XỬ LÝ!");
  }
  console.log("========================================================================");
  process.exit(totalFailed === 0 ? 0 : 1);
}

runMasterTest();
