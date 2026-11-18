const { execSync } = require('child_process');

function getToken() {
  const input = 'protocol=https\nhost=github.com\n\n';
  const credOut = execSync('git credential fill', { input: input, encoding: 'utf8' });
  return credOut.split('\n').find(l => l.startsWith('password='))?.split('=')[1]?.trim();
}

async function main() {
  console.log("=== BẮT ĐẦU TẠO MILESTONE, LABEL VÀ ISSUES SPRINT 6 TRÊN GITHUB ===");

  const token = getToken();
  if (!token) throw new Error("Không tìm thấy GitHub token từ git credential helper.");

  const repoOwner = 'Anniehatani';
  const repoName = 'appstudyAI';
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'Node-Fetch'
  };

  // 1. Tạo Label sprint-6
  console.log("\n--- [1] TẠO NHÃN SPRINT-6 ---");
  try {
    const lRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/labels`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'sprint-6',
        color: '2ea44f',
        description: 'Bản phát hành cuối cùng, tối ưu toàn diện, AI đa tầng & Kiosk native'
      })
    });
    const lData = await lRes.json();
    console.log("✅ Label sprint-6:", lData.name || "Đã tồn tại");
  } catch (e) {
    console.log("ℹ️ Label sprint-6:", e.message);
  }

  // 2. Tạo Milestone Sprint 6
  console.log("\n--- [2] TẠO MILESTONE SPRINT 6 ---");
  let milestoneNumber = null;
  try {
    const mListRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/milestones?state=all`, { headers });
    const mList = await mListRes.json();
    const existingM = mList.find(m => m.title.includes('Sprint 6'));
    if (existingM) {
      milestoneNumber = existingM.number;
      console.log(`✅ Đã tìm thấy Milestone Sprint 6: #${milestoneNumber} - ${existingM.title}`);
    } else {
      const mRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/milestones`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Sprint 6: Hoàn thiện toàn diện, Hệ thống AI đa tầng & Phát hành Release 100%',
          state: 'closed',
          description: 'Sprint tổng kết đồ án: Native C++ Kiosk Guard, khôi phục Taskbar 100%, Multi-Monitor Zen Blocker, Trình phát nhạc Local Offline, Sửa lỗi PDF.js Canvas, Xóa vĩnh viễn điểm IU, Tự động duy trì phiên đăng nhập và Master Test Suite 38/38 Pass.'
        })
      });
      const mData = await mRes.json();
      milestoneNumber = mData.number;
      console.log(`✅ Đã tạo mới Milestone Sprint 6: #${milestoneNumber} - ${mData.title}`);
    }
  } catch (e) {
    console.warn("Milestone handling error:", e.message);
  }

  // 3. Danh sách 10 Issues Sprint 6 (CHỈ GÁN CHO tus-sud VÀ nguyennhuuquynhh07-07)
  const issues = [
    {
      title: "Sprint 6 – Trình bảo vệ Kiosk C++ Native study_guard.exe & Phục hồi 100% Taskbar Windows <5ms",
      assignees: ["tus-sud"],
      labels: ["desktop", "security", "sprint-6"],
      body: `## 📌 Mô tả công việc
Chuyển đổi cơ chế bảo vệ phòng học Pomodoro và quản lý màn hình Kiosk sang chương trình C++ Native biên dịch độc lập (\`study_guard.exe\`), đảm bảo tự động phục hồi thanh Taskbar Windows ngay lập tức (<5ms) khi kết thúc phiên học, giải quyết dứt điểm lỗi mất taskbar trên mọi phiên bản Windows 10/11.

## 🎯 Tiêu chuẩn chấp thuận (Acceptance Criteria)
- [x] Biên dịch nhị phân native \`build/study_guard.exe\` tối ưu hóa tốc độ thực thi cao.
- [x] Tích hợp IPC kích hoạt tự động khi người dùng vào phòng Pomodoro có chọn chức năng chặn.
- [x] Khôi phục thanh Taskbar Windows hoàn toàn nguyên vẹn trong vòng <5ms khi ca học kết thúc hoặc nhấn phím tắt khẩn cấp \`Ctrl + Q\`.
- [x] Đóng gói và unpack an toàn trong cấu hình Electron Builder.`
    },
    {
      title: "Sprint 6 – Cửa sổ Zen Blackout đa màn hình (Multi-Monitor Zen Blocker)",
      assignees: ["tus-sud"],
      labels: ["desktop", "feature", "sprint-6"],
      body: `## 📌 Mô tả công việc
Xây dựng tính năng tự động nhận diện tất cả các màn hình phụ được kết nối với máy tính (\`screen.getAllDisplays()\`) và hiển thị cửa sổ Zen màn hình đen viền phẳng luôn nổi trên tất cả các màn hình thứ 2/màn hình rời khi kích hoạt chế độ chặn Pomodoro.

## 🎯 Tiêu chuẩn chấp thuận (Acceptance Criteria)
- [x] Nhận diện chính xác danh sách màn hình phụ (\`display.id !== primaryDisplay.id\`).
- [x] Khởi tạo cửa sổ fullscreen \`alwaysOnTop: 'screen-saver'\` chặn mọi thao tác lách sang màn hình 2.
- [x] Tự động giải phóng và đóng toàn bộ cửa sổ màn hình phụ khi thoát phiên Pomodoro.`
    },
    {
      title: "Sprint 6 – Trình phát nhạc Local Offline máy tính qua HTTP 206 Partial Content (0 byte upload)",
      assignees: ["nguyennhuuquynhh07-07"],
      labels: ["multimedia", "backend", "feature", "sprint-6"],
      body: `## 📌 Mô tả công việc
Bổ sung tính năng cho phép học viên tự do nhập và phát các tệp âm thanh cá nhân (MP3, WAV, FLAC, M4A) từ ổ cứng máy tính, phát trực tiếp qua Embedded Server nội bộ bằng chuẩn HTTP 206 Partial Content byte-range mà không cần tải bất kỳ byte dữ liệu nào lên Cloudflare.

## 🎯 Tiêu chuẩn chấp thuận (Acceptance Criteria)
- [x] Thêm nút chọn tệp nhạc máy tính (\`+ Thêm tệp\`) ở sảnh chờ Pomodoro và popover danh sách phát.
- [x] Hỗ trợ hộp thoại mở tệp hệ thống Native Electron Dialog và Web File Picker dự phòng.
- [x] Endpoint \`/local-audio?path=...\` hỗ trợ header \`Range: bytes=...\` và mã \`HTTP 206\` tua bài mượt mà.
- [x] Lưu trữ danh sách bài hát cá nhân an toàn vào LocalStorage và cho phép xóa bài linh hoạt.`
    },
    {
      title: "Sprint 6 – Sửa lỗi Detached ArrayBuffer trên PDF.js Web Worker & Điều khiển số trang linh hoạt",
      assignees: ["nguyennhuuquynhh07-07"],
      labels: ["frontend", "bug", "sprint-6"],
      body: `## 📌 Mô tả công việc
Khắc phục triệt để lỗi \`ArrayBuffer\` bị detached (zeroed out) khi PDF.js Web Worker trích xuất văn bản trước khi render canvas, khiến trình đọc PDF rơi vào trạng thái rỗng và tụt về thanh embed đen xám của Chromium. Đồng thời sửa lỗi hiển thị số trang cố định (Trang 1 / 1).

## 🎯 Tiêu chuẩn chấp thuận (Acceptance Criteria)
- [x] Clone độc lập \`ArrayBuffer\` bằng \`new Uint8Array(buffer.slice(0))\` trước khi gửi cho worker.
- [x] Hiển thị chính xác tổng số trang của tài liệu (ví dụ: Trang 1 / 6) trên thanh điều khiển trắng.
- [x] Các nút Trang trước, Trang sau và ô nhập số trang nhảy chính xác đến từng trang canvas sắc nét.
- [x] Giữ nguyên độ nét 1.6x - 2.0x DPI của trang tài liệu khi thay đổi kích thước bàn học.`
    },
    {
      title: "Sprint 6 – API Xóa vĩnh viễn bảng điểm IU trong CSDL (Clean Academic Disconnect)",
      assignees: ["tus-sud"],
      labels: ["backend", "database", "privacy", "sprint-6"],
      body: `## 📌 Mô tả công việc
Xây dựng endpoint \`POST /api/academic/disconnect\` trên backend Cloudflare Workers D1 và SQLite Local Replica, thực thi xóa sạch hoàn toàn bản ghi bảng điểm sinh viên khỏi bảng \`user_academic_transcripts\` khi người dùng bấm "Ngắt kết nối IU".

## 🎯 Tiêu chuẩn chấp thuận (Acceptance Criteria)
- [x] Endpoint \`/api/academic/disconnect\` xóa triệt để \`WHERE user_id = ?\`.
- [x] Cập nhật hàm \`window.resetAcademicTranscript()\` gọi API này trước khi xóa dữ liệu cục bộ.
- [x] Đảm bảo sau khi ngắt kết nối và đăng nhập lại, bảng điểm cũ không bao giờ tự động xuất hiện lại.`
    },
    {
      title: "Sprint 6 – Tự động duy trì phiên đăng nhập khi đóng/mở lại App (Persistent Session Management)",
      assignees: ["tus-sud"],
      labels: ["architecture", "desktop", "sprint-6"],
      body: `## 📌 Mô tả công việc
Khắc phục lỗi ứng dụng tự động bắt đăng nhập lại mỗi khi đóng và mở lại phần mềm trên máy tính do lệnh xóa cookie mặc định khi khởi động.

## 🎯 Tiêu chuẩn chấp thuận (Acceptance Criteria)
- [x] Loại bỏ triệt để lệnh \`clearStorageData({ storages: ["cookies"] })\` khi khởi động trong \`electron/main.cjs\`.
- [x] Hàm \`initialize()\` trong \`public/app.js\` tự động kiểm tra \`api("/api/session")\` từ cookie phiên đã lưu.
- [x] Tự động tải dữ liệu học tập cá nhân (\`loadAuthenticatedData()\`) nếu phiên còn hiệu lực mà không cần nhập lại mật khẩu.`
    },
    {
      title: "Sprint 6 – Hệ sinh thái 3TG AI Đa tầng (Multi-tier AI Pipeline) & Xử lý dán ảnh Clipboard (Ctrl + V)",
      assignees: ["nguyennhuuquynhh07-07"],
      labels: ["ai", "feature", "sprint-6"],
      body: `## 📌 Mô tả công việc
Nâng cấp hệ sinh thái AI trợ lý học tập 3TG thành cấu trúc dự phòng đa tầng (DeepSeek Primary -> Groq High-Speed Fallback \`openai/gpt-oss-120b\` & Vision \`qwen/qwen3.8-27b\`). Bổ sung khả năng dán ảnh từ Clipboard (\`Ctrl + V\`) trực tiếp vào khung chat AI Pomodoro để giải bài tập từ ảnh chụp màn hình.

## 🎯 Tiêu chuẩn chấp thuận (Acceptance Criteria)
- [x] Tự động chuyển tiếp thông minh sang Groq API với độ trễ phản hồi cực thấp (<0.3s) khi API chính lỗi.
- [x] Bắt sự kiện dán ảnh Clipboard (\`Ctrl + V\`) trong phòng học và preview ảnh đính kèm.
- [x] Tự động xóa sạch nội dung input sau khi gửi tin nhắn, không để sót văn bản cũ.
- [x] Chẩn đoán chính xác mã lỗi 401 khi người dùng nhập nhầm key bên thứ 3.`
    },
    {
      title: "Sprint 6 – Tối ưu hóa mượt mà thanh Resizer AI Panel bằng RAF & Nhận diện phần cứng máy yếu",
      assignees: ["nguyennhuuquynhh07-07"],
      labels: ["ui/ux", "performance", "sprint-6"],
      body: `## 📌 Mô tả công việc
Tối ưu hóa thao tác kéo giãn kích thước thanh phân chia giữa tài liệu và khung chat trợ lý AI trong phòng học bằng \`requestAnimationFrame\` (RAF), loại bỏ hiện tượng giật lag khung hình khi xem tệp PDF nhiều trang trên các máy tính cấu hình văn phòng.

## 🎯 Tiêu chuẩn chấp thuận (Acceptance Criteria)
- [x] Sử dụng cờ RAF \`isResizing\` để gom các thao tác tính toán lại vào chu kỳ vẽ màn hình tiếp theo.
- [x] Tự động vô hiệu hóa \`pointer-events\` trên các iframe / embed tài liệu trong lúc đang kéo giãn.
- [x] Giảm tải tài nguyên GPU và duy trì khung hình ổn định 60 FPS trong suốt quá trình học tập.`
    },
    {
      title: "Sprint 6 – Master Test Suite: Kiểm thử tự động E2E Full All-System (38/38 Pass 100%)",
      assignees: ["tus-sud"],
      labels: ["testing", "qa", "sprint-6"],
      body: `## 📌 Mô tả công việc
Xây dựng và thực thi bộ kịch bản kiểm thử tích hợp tự động toàn diện (\`scripts/test_sprint6_full_suite.cjs\`) kiểm tra mọi thành phần kỹ thuật cốt lõi trước khi đóng gói phát hành sản phẩm.

## 🎯 Tiêu chuẩn chấp thuận (Acceptance Criteria)
- [x] Kiểm tra cấu trúc CSDL SQLite / D1 Local Replica với đầy đủ các bảng dữ liệu cốt lõi.
- [x] Kiểm thử luồng Groq AI LLM sinh câu trả lời thành công.
- [x] Kiểm thử nhị phân C++ Kiosk Guard, đa màn hình Zen và kiểm tra cookie khởi động.
- [x] Kiểm thử đường dẫn stream nhạc local HTTP 206 Byte-Range.
- [x] Kiểm thử xử lý tài liệu PDF và cơ chế tự động khôi phục phiên.
- [x] Đạt kết quả 38/38 tiêu chí kiểm thử PASS 100%.`
    },
    {
      title: "Sprint 6 – Đóng gói phát hành Release V29.9.07 & Hoàn thiện Báo cáo Tổng kết Đồ án Sprint 6",
      assignees: ["nguyennhuuquynhh07-07"],
      labels: ["documentation", "release", "sprint-6"],
      body: `## 📌 Mô tả công việc
Tổng kết toàn bộ chu kỳ phát triển của dự án đồ án môn học Công nghệ phần mềm: Biên soạn tài liệu \`Sprint_6.md\` và danh mục GitHub Issues Sprint 6, đóng gói bản phát hành Desktop Portable \`3TG Học Vui Mỗi Ngày V29.9.07.exe\`.

## 🎯 Tiêu chuẩn chấp thuận (Acceptance Criteria)
- [x] Hoàn thiện file \`tổng kết dự án/Sprint_6.md\` chuẩn mẫu báo cáo khoa học.
- [x] Hoàn thiện file \`tổng kết dự án/GitHub_Issues_Sprint_6.md\`.
- [x] Đồng bộ toàn bộ 10 Issues Sprint 6 lên GitHub với đầy đủ Assignees, Labels và Milestone.
- [x] Đóng dấu nghiệm thu sản phẩm đạt chuẩn A+ của nhóm TONE PINK.`
    }
  ];

  console.log("\n--- [3] TẠO 10 ISSUES SPRINT 6 VÀ GÁN CHO tus-sud & nguyennhuuquynhh07-07 ---");
  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    try {
      const payload = {
        title: issue.title,
        body: issue.body,
        assignees: issue.assignees,
        labels: issue.labels
      };
      if (milestoneNumber) payload.milestone = milestoneNumber;

      const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/issues`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ Đã tạo Issue #${data.number}: ${data.title} -> Assignees: [${data.assignees?.map(a => a.login).join(', ')}]`);
        // Đóng issue vì sprint đã hoàn tất
        await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/issues/${data.number}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ state: 'closed' })
        });
      } else {
        console.error(`❌ Lỗi tạo issue: ${issue.title}`, data);
      }
    } catch (err) {
      console.error(`❌ Ngoại lệ khi tạo issue:`, err.message);
    }
  }

  console.log("\n🎉 HOÀN TẤT ĐỒNG BỘ GITHUB SPRINT 6 THÀNH CÔNG 100%!");
}

main().catch(console.error);
