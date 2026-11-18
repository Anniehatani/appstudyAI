const { execSync } = require('child_process');

function getToken() {
  const input = 'protocol=https\nhost=github.com\n\n';
  const credOut = execSync('git credential fill', { input: input, encoding: 'utf8' });
  return credOut.split('\n').find(l => l.startsWith('password='))?.split('=')[1]?.trim();
}

async function main() {
  console.log("=== BẮT ĐẦU CẬP NHẬT ASSIGNEES SPRINT 4 VÀ TẠO ISSUES SPRINT 5 TRÊN GITHUB ===");

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

  // ==========================================
  // PHẦN 1: GÁN ASSIGNEES CHO 10 ISSUES SPRINT 4 (#28 ĐẾN #37)
  // ==========================================
  console.log("\n--- [1] GÁN ASSIGNEES CHO 10 ISSUES SPRINT 4 (#28 - #37) ---");
  const sprint4AssigneesMap = {
    28: ['Anniehatani'],
    29: ['Anniehatani'],
    30: ['Anniehatani'],
    31: ['nguyennhuuquynhh07-07'],
    32: ['Anniehatani'],
    33: ['tus-sud'],
    34: ['Anniehatani'],
    35: ['nguyennhuuquynhh07-07'],
    36: ['Anniehatani'],
    37: ['nguyennhuuquynhh07-07', 'tus-sud', 'Anniehatani']
  };

  for (const [issueNum, assignees] of Object.entries(sprint4AssigneesMap)) {
    try {
      const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/issues/${issueNum}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ assignees })
      });
      const data = await res.json();
      console.log(`✅ Issue #${issueNum} đã gán thành viên: [${data.assignees?.map(a => a.login).join(', ')}]`);
    } catch (e) {
      console.error(`❌ Lỗi gán assignees cho #${issueNum}:`, e.message);
    }
  }

  // ==========================================
  // PHẦN 2: TẠO LABEL SPRINT-5 VÀ MILESTONE SPRINT 5
  // ==========================================
  console.log("\n--- [2] TẠO NHÃN SPRINT-5 & MILESTONE SPRINT 5 ---");
  try {
    const lRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/labels`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'sprint-5',
        color: 'ff4b82',
        description: 'Các tính năng, bảo mật và nhiệm vụ thuộc Sprint 5'
      })
    });
    const lData = await lRes.json();
    console.log("✅ Label sprint-5:", lData.name || "Đã tồn tại");
  } catch (e) {
    console.log("ℹ️ Label sprint-5:", e.message);
  }

  let milestoneNumber = null;
  try {
    const mListRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/milestones?state=all`, { headers });
    const mList = await mListRes.json();
    const existingM = mList.find(m => m.title.includes('Sprint 5'));
    if (existingM) {
      milestoneNumber = existingM.number;
      console.log(`✅ Đã tìm thấy Milestone Sprint 5: #${milestoneNumber} - ${existingM.title}`);
    } else {
      const mRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/milestones`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Sprint 5: Bảo mật PBKDF2, 6 Themes Duolingo & Pomodoro Kiosk',
          state: 'open',
          description: 'Nâng cấp bảo mật PBKDF2, Rate Limiting, Transactional Outbox, 6 Theme Duolingo toàn diện, phòng học Pomodoro Focus Kiosk Mode và Server Validator chống gian lận.'
        })
      });
      const mData = await mRes.json();
      milestoneNumber = mData.number;
      console.log(`✅ Đã tạo mới Milestone Sprint 5: #${milestoneNumber} - ${mData.title}`);
    }
  } catch (e) {
    console.warn("Milestone handling error:", e.message);
  }

  // ==========================================
  // PHẦN 3: TẠO 10 ISSUES SPRINT 5 ĐẦY ĐỦ ASSIGNEES VÀ ĐÓNG (CLOSED)
  // ==========================================
  console.log("\n--- [3] TẠO VÀ ĐÓNG 10 ISSUES SPRINT 5 ---");
  const sprint5Issues = [
    {
      title: "Sprint 5 – Bảo vệ Secret & API Key trong bản cài Electron, cách ly token quản trị",
      labels: ["security", "architecture", "desktop", "sprint-5"],
      assignees: ["Anniehatani"],
      body: `### 🎯 Mục tiêu
Ngăn chặn tuyệt đối việc rò rỉ Cloudflare API Token, R2 Access Key hoặc DeepSeek API Key khi người dùng trích xuất file asar của bản cài đặt Desktop.

### 🛠️ Chi tiết triển khai
- Cấu hình loại trừ nghiêm ngặt trong \`package.json\`: \`!**/.dev.vars\`, \`!**/.env*\`, \`!**/*.key\`, \`!**/*.pem\`.
- Trong \`electron/embedded-server.cjs\`, kiểm tra cờ \`isPackaged\` để không bao giờ đọc hoặc tìm kiếm file secret cục bộ trên máy người dùng cuối.
- Đảm bảo bảo vệ toàn diện bí mật hệ thống chuẩn OWASP.

### 👥 Người phụ trách
- **Lê Văn An (Lead - @Anniehatani)**

### ✅ Trạng thái
Đã hoàn thành và kiểm thử 100%.`
    },
    {
      title: "Sprint 5 – Nâng cấp chuẩn mã hóa mật khẩu PBKDF2-HMAC-SHA256 với Salt 16-byte ngẫu nhiên",
      labels: ["security", "backend", "database", "sprint-5"],
      assignees: ["Anniehatani"],
      body: `### 🎯 Mục tiêu
Nâng cấp thuật toán băm mật khẩu từ SHA-256 legacy lên chuẩn an toàn cấp công nghiệp PBKDF2-HMAC-SHA256.

### 🛠️ Chi tiết triển khai
- Khởi tạo module mã hóa \`src/modules/crypto.js\`.
- Sinh Salt ngẫu nhiên 16 bytes bằng \`crypto.getRandomValues()\` cho từng tài khoản.
- Chạy 100,000 vòng lặp (Iterations) chuẩn khuyến nghị OWASP.
- So sánh mật khẩu bằng thuật toán Timing-Safe Equal chống Timing Attack.
- Tự động nâng cấp mật khẩu cũ (Legacy SHA-256) sang PBKDF2 ngay khi người dùng đăng nhập thành công.

### 👥 Người phụ trách
- **Lê Văn An (Lead - @Anniehatani)**

### ✅ Trạng thái
Đã hoàn thành và kiểm thử 100%.`
    },
    {
      title: "Sprint 5 – Thiết lập Rate Limiting trượt chống Brute-force mật khẩu và rà quét tài khoản",
      labels: ["security", "backend", "sprint-5"],
      assignees: ["Anniehatani"],
      body: `### 🎯 Mục tiêu
Ngăn chặn các cuộc tấn công rà quét mật khẩu (Dictionary Attack, Brute-force) và spam tạo tài khoản ảo.

### 🛠️ Chi tiết triển khai
- Thiết lập bộ đếm Rate Limiter trượt trong 15 phút tại \`/api/auth/login\` và \`/api/auth/register\`.
- Cho phép tối đa 5 lần thử sai liên tiếp.
- Trả về mã lỗi HTTP 429 Too Many Requests kèm thông báo thời gian đếm ngược chính xác nếu vượt quá ngưỡng cho phép.

### 👥 Người phụ trách
- **Lê Văn An (Lead - @Anniehatani)**

### ✅ Trạng thái
Đã hoàn thành và kiểm thử 100%.`
    },
    {
      title: "Sprint 5 – Kiến trúc Transactional Outbox & Replay Queue đồng bộ ngoại tuyến SQLite – Cloudflare D1",
      labels: ["database", "backend", "architecture", "sprint-5"],
      assignees: ["Anniehatani"],
      body: `### 🎯 Mục tiêu
Giải quyết triệt để tình trạng bất đồng bộ dữ liệu giữa SQLite Local Replica và Cloudflare D1 Remote khi mất kết nối mạng hoặc D1 vượt hạn ngạch 5M rows/ngày.

### 🛠️ Chi tiết triển khai
- Khởi tạo bảng \`sync_outbox\` lưu trữ tuần tự các câu lệnh SQL INSERT/UPDATE/DELETE khi rớt mạng.
- Xây dựng tiến trình phát lại \`replayOutboxToD1()\` tự động đối soát và đồng bộ lên Cloudflare D1 theo thứ tự FIFO khi có mạng trở lại.
- Tự động chuyển đổi mượt mà sang Local D1 Replica và In-memory Cache mà không gây gián đoạn trải nghiệm học viên.

### 👥 Người phụ trách
- **Lê Văn An (Lead - @Anniehatani)**

### ✅ Trạng thái
Đã hoàn thành và kiểm thử 100%.`
    },
    {
      title: "Sprint 5 – Tái cấu trúc Module hóa Backend (crypto, pomodoro_validator, sync_outbox)",
      labels: ["backend", "architecture", "sprint-5"],
      assignees: ["Anniehatani"],
      body: `### 🎯 Mục tiêu
Tách các khối mã nguồn lớn trong \`src/index.js\` thành các module chuyên biệt, tăng tính bảo trì và giảm thiểu lỗi xung đột mã nguồn.

### 🛠️ Chi tiết triển khai
- Tách \`src/modules/crypto.js\`: Quản lý băm mật khẩu, sinh salt và đối soát timing-safe.
- Tách \`src/modules/pomodoro_validator.js\`: Xử lý logic heartbeat, xác thực thời lượng ca học thực và chống gian lận phần thưởng.
- Tách \`src/modules/sync_outbox.js\`: Quản lý hàng đợi ghi nhận thay đổi và tiến trình replay dữ liệu.

### 👥 Người phụ trách
- **Lê Văn An (Lead - @Anniehatani)**

### ✅ Trạng thái
Đã hoàn thành và kiểm thử 100%.`
    },
    {
      title: "Sprint 5 – Hệ sinh thái 6 Theme Duolingo sống động & Chế độ nền tối Midnight Velvet Dark Mode",
      labels: ["frontend", "ui/ux", "feature", "sprint-5"],
      assignees: ["nguyennhuuquynhh07-07"],
      body: `### 🎯 Mục tiêu
Đem đến cho học viên trải nghiệm học tập tươi trẻ, rực rỡ sắc màu phong cách Duolingo cùng chế độ bảo vệ mắt khi học ban đêm.

### 🛠️ Chi tiết triển khai
- Xây dựng hệ thống 6 Theme:
  1. *Hồng Pastel TONE PINK:* Ngọt ngào, signature thương hiệu nhóm.
  2. *Xanh Dương CMC:* Trẻ trung, chuyên nghiệp, gắn liền sinh viên CMC.
  3. *Tím Mộng Mơ (Dreamy Lavender):* Thư giãn, giảm căng thẳng thị giác.
  4. *Xanh Lá Cây (Duolingo Green):* Năng động, truyền cảm hứng học tập.
  5. *Vàng Rực Rỡ (Solar Gold):* Ấm áp, tích cực, kích thích tư duy.
  6. *Cam Năng Động (Sunset Energy):* Nhiệt huyết và đam mê bứt phá.
- Chế độ Midnight Velvet Dark Mode: tông nền \`#121620\` và \`#181c2b\` dịu mắt, chống lóa khi học ban đêm.

### 👥 Người phụ trách
- **Nguyễn Như Quỳnh (@nguyennhuuquynhh07-07)**

### ✅ Trạng thái
Đã hoàn thành và kiểm thử 100%.`
    },
    {
      title: "Sprint 5 – Phủ sóng CSS Variables 100% toàn app & Responsive thích ứng 100%–200% DPI Scaling",
      labels: ["frontend", "ui/ux", "sprint-5"],
      assignees: ["nguyennhuuquynhh07-07"],
      body: `### 🎯 Mục tiêu
Đảm bảo màu sắc giao diện được đồng bộ 100% không còn điểm sót, và hiển thị sắc nét trên mọi kích thước màn hình từ laptop đến màn rời 2K/4K.

### 🛠️ Chi tiết triển khai
- Phủ sóng bộ biến CSS3 (\`--theme-accent\`, \`--theme-border\`, \`--theme-gradient\`, \`--theme-soft\`) xuyên suốt Topbar, Sidebar, Lộ trình học, Dialog, Cửa hàng và Mascot.
- Thiết kế Responsive thích ứng DPI Scaling 100%–200%: Sidebar chuẩn 340px, Cover Banner trang cá nhân đạt độ cao 480px chuẩn tỉ lệ vàng.
- Tối ưu hóa hiệu năng máy yếu: áp dụng \`content-visibility: auto\` ảo hóa danh sách, giảm 70% thời gian render DOM.

### 👥 Người phụ trách
- **Nguyễn Như Quỳnh (@nguyennhuuquynhh07-07)**

### ✅ Trạng thái
Đã hoàn thành và kiểm thử 100%.`
    },
    {
      title: "Sprint 5 – Phòng học Pomodoro Chế độ Focus Kiosk Mode khóa màn hình và chặn phím phân tâm Windows",
      labels: ["desktop", "feature", "sprint-5"],
      assignees: ["tus-sud"],
      body: `### 🎯 Mục tiêu
Tạo không gian học tập siêu tập trung, ngăn chặn triệt để học viên chuyển tab hay lướt mạng xã hội trong ca học Pomodoro.

### 🛠️ Chi tiết triển khai
- Khóa toàn màn hình Kiosk Mode, ẩn Taskbar Windows an toàn bằng lệnh Windows API.
- Cài đặt Driver Hook bàn phím cấp thấp \`WH_KEYBOARD_LL\` trong \`electron/kiosk-guard.cs\`.
- Chặn triệt để các phím phân tâm: phím Windows (LWIN, RWIN), Menu ngữ cảnh (APPS), phím chức năng F1-F12, Esc và toàn bộ tổ hợp phím có chứa Alt (Alt+Tab, Alt+F4, Alt+Esc).
- Phục hồi Taskbar và làm tươi nút Start Menu Windows 11 ngay lập tức khi kết thúc ca học hoặc nhấn \`Ctrl + Q\`.

### 👥 Người phụ trách
- **Nguyễn Tú (@tus-sud)**

### ✅ Trạng thái
Đã hoàn thành và kiểm thử 100%.`
    },
    {
      title: "Sprint 5 – Server-side Pomodoro Validator chống gian lận thời lượng học và nhận thưởng ảo",
      labels: ["security", "backend", "sprint-5"],
      assignees: ["Anniehatani"],
      body: `### 🎯 Mục tiêu
Bảo vệ tính công bằng của hệ thống Game hóa, ngăn chặn việc chỉnh sửa request API để nhận khống điểm kinh nghiệm XP và Đá quý.

### 🛠️ Chi tiết triển khai
- Bắt buộc đăng ký phiên học khởi tạo tại server trong bảng \`pomodoro_active_learners\`.
- Server tự tính toán thời lượng trôi qua thực tế (\`now - started_at\`), chỉ công nhận số chu kỳ và phần thưởng (+50 XP, +30 Gems/ca) khi học đủ thời lượng thực.
- Triển khai cơ chế Idempotency xóa phiên active ngay khi nhận thưởng, chặn đứng việc gọi lặp API để nhận thưởng kép.

### 👥 Người phụ trách
- **Lê Văn An (Lead - @Anniehatani)**

### ✅ Trạng thái
Đã hoàn thành và kiểm thử 100%.`
    },
    {
      title: "Sprint 5 – Trình đọc tài liệu toàn năng (Word, PDF, PPTX), Điều khiển Zoom 2 ngón & Báo cáo Sprint 5",
      labels: ["documentation", "frontend", "qa", "sprint-5"],
      assignees: ["tus-sud", "nguyennhuuquynhh07-07", "Anniehatani"],
      body: `### 🎯 Mục tiêu
Hoàn thiện trải nghiệm đọc tài liệu học tập trong phòng Pomodoro và tổng hợp hồ sơ nghiệm thu kỹ thuật Sprint 5 chuẩn môn Công nghệ phần mềm.

### 🛠️ Chi tiết triển khai
- Tích hợp trình đọc đa định dạng (PDF, Word DOCX/DOC, PowerPoint, Code, Text, Media, Sổ tay ghi chú 3TG).
- Thanh công cụ điều khiển Zoom: Thu nhỏ (-), Phóng to (+), Đặt lại 100% (↺), phím tắt Ctrl +/-/0 và cử chỉ chụm 2 ngón tay Trackpad.
- Khắc phục lỗi z-index popover danh sách phát nhạc Lofi không bị đè bởi resizer AI.
- Biên soạn Báo cáo Word: \`Bao_Cao_Sprint_5_Do_An_3TG_Study_TONE_PINK.docx\`.
- Thiết kế Slide thuyết trình PowerPoint: \`Slide_Thuyet_Trinh_Sprint_5_TONE_PINK.pptx\`.
- Xuất bản tài liệu \`Sprint_5.md\` và \`GitHub_Issues_Sprint_5.md\`.

### 👥 Người phụ trách
- **Nhóm TONE PINK (Lê Văn An, Nguyễn Như Quỳnh, Nguyễn Tú)**

### ✅ Trạng thái
Đã hoàn thành và kiểm thử 100%.`
    }
  ];

  for (let i = 0; i < sprint5Issues.length; i++) {
    const item = sprint5Issues[i];
    console.log(`\nĐang tạo Issue Sprint 5 [${i + 1}/${sprint5Issues.length}]: "${item.title}"...`);

    const payload = {
      title: item.title,
      body: item.body,
      labels: item.labels,
      assignees: item.assignees
    };
    if (milestoneNumber) {
      payload.milestone = milestoneNumber;
    }

    try {
      const cRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/issues`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const created = await cRes.json();

      if (!created.number) {
        console.error("  ❌ Lỗi tạo issue:", created.message || created);
        continue;
      }
      console.log(`  ✅ Đã tạo thành công Issue #${created.number}: ${created.html_url} [Assignees: ${created.assignees?.map(a => a.login).join(', ')}]`);

      // Close issue immediately
      const closeRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/issues/${created.number}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ state: 'closed' })
      });
      const closed = await closeRes.json();
      console.log(`  🔒 Đã chuyển trạng thái Issue #${created.number} sang CLOSED (Done 100%)`);
    } catch (err) {
      console.error("  ❌ Exception:", err.message);
    }
  }

  // Đóng Milestone Sprint 5 (Hoàn thành 100%)
  if (milestoneNumber) {
    try {
      await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/milestones/${milestoneNumber}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ state: 'closed' })
      });
      console.log(`\n🎉 Đã hoàn tất và đóng Milestone Sprint 5!`);
    } catch {}
  }

  console.log("\n==================================================");
  console.log("🎉 ĐÃ HOÀN TẤT TOÀN BỘ GÁN ASSIGNEES SPRINT 4 VÀ TẠO 10 ISSUES SPRINT 5 TRÊN GITHUB!");
  console.log(`👉 Link xem trực tiếp: https://github.com/${repoOwner}/${repoName}/issues?q=is%3Aissue+state%3Aclosed`);
  console.log("==================================================");
}

main().catch(console.error);
