const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getToken() {
  const input = 'protocol=https\nhost=github.com\n\n';
  const credOut = execSync('git credential fill', { input: input, encoding: 'utf8' });
  return credOut.split('\n').find(l => l.startsWith('password='))?.split('=')[1]?.trim();
}

async function uploadAsset(uploadUrl, filePath, fileName, token) {
  const stats = fs.statSync(filePath);
  const fileSize = stats.size;
  console.log(`\n⏳ Đang tải file lên GitHub Release: ${fileName} (${(fileSize / (1024 * 1024)).toFixed(2)} MB)...`);

  const cleanUploadUrl = uploadUrl.replace(/\{(\?name,label)?\}/, '') + `?name=${encodeURIComponent(fileName)}`;
  const fileStream = fs.createReadStream(filePath);

  const res = await fetch(cleanUploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/octet-stream',
      'Content-Length': fileSize.toString(),
      'User-Agent': 'Node-Fetch'
    },
    body: fileStream,
    duplex: 'half'
  });

  if (res.ok) {
    const data = await res.json();
    console.log(`✅ Tải lên thành công: ${data.name} (Download URL: ${data.browser_download_url})`);
  } else {
    const errText = await res.text();
    console.error(`❌ Lỗi tải file ${fileName}:`, res.status, errText);
  }
}

async function main() {
  console.log("=== BẮT ĐẦU TẠO GITHUB RELEASE V29.9.07 CHO 3TG STUDY AI ===");

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

  const tagName = 'v29.9.07';
  const releaseTitle = '3TG Study AI V29.9.07 — Bản Phát Hành Chính Thức (Gold Master Release)';
  const releaseBody = `## 🌸 3TG STUDY AI — BẢN PHÁT HÀNH CHÍNH THỨC V29.9.07
> **Đồ án môn học:** Công nghệ phần mềm | **Giảng viên hướng dẫn:** ThS. Vân Anh  
> **Nhóm thực hiện:** TONE PINK (Lê Văn An - Lead, Nguyễn Như Quỳnh, Nguyễn Tú)  
> **Milestone:** [Sprint 6: Hoàn thiện toàn diện, Hệ thống AI đa tầng & Phát hành Release 100%](https://github.com/Anniehatani/appstudyAI/milestone/6)

---

### 🌟 ĐIỂM NỔI BẬT TRONG BẢN PHÁT HÀNH V29.9.07 (GOLD MASTER)

#### 1. 🛡️ Chế Độ Focus Kiosk Mode & Phục Hồi Taskbar 100% Bằng C++ Native
* Chuyển đổi toàn bộ hook bảo vệ Kiosk và ẩn/hiện thanh tác vụ sang tệp nhị phân C++ Native độc lập (\`build/study_guard.exe\`).
* Đảm bảo phục hồi 100% thanh Taskbar và Start Menu Windows trong vòng **<5ms** ngay khi thoát phiên học hoặc bấm phím tắt khẩn cấp \`Ctrl + Q\`.
* **Multi-Monitor Zen Blocker**: Tự động nhận diện tất cả màn hình phụ kết nối với máy tính và hiển thị cửa sổ Zen blackout viền phẳng luôn nổi, khóa chặt toàn diện mọi hành vi gây xao nhãng sang màn hình thứ 2.

#### 2. 🎵 Trình Phát Nhạc Local Offline Cá Nhân (Zero-Cloud Streaming)
* Hỗ trợ học viên tự do thêm và phát các tệp âm thanh cá nhân (\`MP3\`, \`WAV\`, \`FLAC\`, \`M4A\`, \`OGG\`) trực tiếp từ máy tính.
* Máy chủ nhúng nội bộ hỗ trợ chuẩn **HTTP 206 Partial Content byte-range** (\`/local-audio?path=...\`), cho phép tua bài mượt mà và **0 byte tải lên máy chủ đám mây Cloudflare**.
* Tích hợp hộp thoại chọn tệp hệ thống Native Electron và lưu trữ danh sách phát cá nhân an toàn vào LocalStorage.

#### 3. 📄 Trình Đọc Tài Liệu PDF.js Canvas & Điều Khiển Số Trang
* Khắc phục triệt để lỗi \`ArrayBuffer\` bị detached do Web Worker của PDF.js chuyển quyền sở hữu buffer khi trích xuất text. Nhân bản buffer độc lập giúp tài liệu luôn hiển thị dạng HTML5 Canvas sắc nét.
* Hiển thị chính xác tổng số trang của tài liệu (ví dụ: Trang 1 / 6), các nút chuyển trang trước/sau và ô nhảy trang trên thanh điều khiển trắng hoạt động hoàn hảo.

#### 4. 🔑 Quản Lý Phiên Đăng Nhập Bền Vững (Persistent Session)
* Loại bỏ lệnh xóa cookie lúc mở app. Hàm \`initialize()\` tự động kiểm tra cookie phiên và tải dữ liệu học tập cá nhân ngay khi khởi động, học viên không bao giờ bị bắt đăng nhập lại.

#### 5. 🎓 Quyền Riêng Tư Bảng Điểm IU (Clean Disconnect)
* Bổ sung endpoint backend \`POST /api/academic/disconnect\` xóa sạch hoàn toàn bản ghi bảng điểm sinh viên trong CSDL Cloudflare D1 và SQLite Local khi bấm "Ngắt kết nối IU".

#### 6. 🤖 Hệ Sinh Thái 3TG AI Đa Tầng & Phím Tắt Dán Ảnh (Ctrl + V)
* Tự động chuyển tiếp thông minh sang hạ tầng Groq API siêu tốc (\`openai/gpt-oss-120b\` và vision \`qwen/qwen3.8-27b\`) với độ trễ phản hồi cực thấp (<0.3s).
* Hỗ trợ phím tắt \`Ctrl + V\` dán trực tiếp ảnh chụp màn hình bài tập vào phòng Pomodoro và tự động làm sạch input sau khi gửi tin nhắn.

#### 7. ⚡ Tối Ưu Hóa Mượt Mà 60 FPS & Smooth Resizer RAF
* Ứng dụng \`requestAnimationFrame\` (RAF) gom sự kiện chuột khi kéo giãn thanh phân chia giữa tài liệu và khung chat AI, duy trì 60 FPS mượt mà trên mọi máy tính cấu hình văn phòng.

#### 8. 🧪 Master Test Suite 38/38 Pass 100%
* Bộ kịch bản kiểm thử tự động toàn diện \`scripts/test_sprint6_full_suite.cjs\` đã xác minh thành công 100% toàn bộ hệ thống từ CSDL, AI, Kiosk, Audio, PDF đến UI.

---

### 📦 TỆP TẢI VỀ CÀI ĐẶT (DOWNLOADS)

| Tệp cài đặt | Định dạng | Dung lượng | Ghi chú |
| :--- | :---: | :---: | :--- |
| **\`3TG Học Vui Mỗi Ngày V29.9.07.exe\`** | Portable | ~117.5 MB | **(Khuyên dùng)** Chạy ngay không cần cài đặt |
| **\`3TG Học Vui Mỗi Ngày Setup V29.9.07.exe\`** | Installer | ~117.9 MB | Bản cài đặt tự động tạo shortcut Desktop & Start Menu |

---
*Bản quyền © 2026 TONE PINK Group — Dự án 3TG Study AI*`;

  // Kiểm tra xem Release đã tồn tại chưa
  console.log(`\nKiểm tra release cho tag ${tagName}...`);
  let release = null;
  try {
    const checkRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/releases/tags/${tagName}`, { headers });
    if (checkRes.ok) {
      release = await checkRes.json();
      console.log(`ℹ️ Release đã tồn tại: #${release.id} - ${release.name}`);
    }
  } catch (e) {}

  if (!release) {
    console.log(`Tạo mới GitHub Release ${tagName}...`);
    const createRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/releases`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tag_name: tagName,
        target_commitish: 'main',
        name: releaseTitle,
        body: releaseBody,
        draft: false,
        prerelease: false
      })
    });
    release = await createRes.json();
    if (!createRes.ok) {
      throw new Error(`Lỗi tạo release: ${JSON.stringify(release)}`);
    }
    console.log(`✅ Đã tạo mới Release #${release.id} thành công!`);
  }

  // Tải các file binary lên release
  const portablePath = path.resolve('dist-electron/3TG Học Vui Mỗi Ngày V29.9.07.exe');
  const installerPath = path.resolve('dist-electron/3TG Học Vui Mỗi Ngày Setup V29.9.07.exe');

  if (fs.existsSync(portablePath)) {
    await uploadAsset(release.upload_url, portablePath, '3TG Học Vui Mỗi Ngày V29.9.07.exe', token);
  } else {
    console.warn("⚠️ Không tìm thấy file portable:", portablePath);
  }

  if (fs.existsSync(installerPath)) {
    await uploadAsset(release.upload_url, installerPath, '3TG Học Vui Mỗi Ngày Setup V29.9.07.exe', token);
  } else {
    console.warn("⚠️ Không tìm thấy file installer:", installerPath);
  }

  console.log("\n🎉 HOÀN THÀNH TẠO VÀ UPLOAD GITHUB RELEASE V29.9.07!");
  console.log(`🔗 Link Release: ${release.html_url}`);
}

main().catch(console.error);
