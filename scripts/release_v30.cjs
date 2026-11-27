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
    console.log(`✅ Tải lên thành công: ${data.name} -> ${data.browser_download_url}`);
    return data;
  } else {
    const errText = await res.text();
    throw new Error(`Lỗi tải file ${fileName}: ${res.status} ${errText}`);
  }
}

async function main() {
  const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
  const ver = pkg.version || '30.0.1';
  console.log(`=== PHÁT HÀNH GITHUB RELEASE V${ver} — 3TG STUDY AI ===`);

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

  const tagName = `v${ver}`;
  const releaseTitle = `3TG Study AI V${ver} — Sửa lỗi hiển thị công thức toán KaTeX (Pomodoro & Trợ lý AI)`;
  const releaseBody = `## 🚀 3TG STUDY AI — PHIÊN BẢN MỚI NHẤT V${ver}
> **Đồ án môn học:** Công nghệ phần mềm (\`INFO2011\`) • **Trường Đại học CMC**  
> **Nhóm thực hiện:** TONE PINK (Lê Văn An, Nguyễn Như Quỳnh, Nguyễn Văn Tú)

---

### ✨ CÁC CẬP NHẬT QUAN TRỌNG TRONG V${ver}

1. **∑ Sửa triệt để lỗi hiển thị công thức toán học (LaTeX / KaTeX) trên toàn hệ thống:**
   - Tích hợp **KaTeX engine + font toán chuẩn** (\`/vendor/katex/\`) qua module dùng chung \`public/math-renderer.js\`.
   - Khắc phục hoàn toàn tình trạng hiển thị thô \`$...$\`, \`$$...$$\`, \`\\iint_D\`, \`\\Rightarrow\`, \`\\frac\`, \`\\int_{-1}^{1}\` trong cả **Trợ lý 3TG AI bên ngoài**, **AI trong Phòng Pomodoro**, **Cố vấn học tập AI**, **Bot 3TG trong Messenger** và **Sổ tay ghi chú**.
   - Định dạng đẹp khối bước giải (\`>> Bước 1\`), callout trích dẫn (\`>\`), đường kẻ (\`---\`), bảng biểu và code block; vẫn giữ nguyên văn bản tiền tệ (ví dụ \`$50 và $100\`).
2. **🤖 Giữ nguyên toàn bộ nâng cấp từ V30.0.0:**
   - Sửa lỗi AI rơi về chế độ Ngoại tuyến trên Desktop Electron, đồng bộ Cổng đào tạo IU, giao diện Messenger & tối ưu đóng gói an toàn.
   - Bộ kiểm thử tự động \`scripts/test_sprint6_full_suite.cjs\`: **38/38 PASS (100%)**.

---

### 📦 TỆP CÀI ĐẶT WINDOWS (64-BIT)

| Tệp tải về | Loại bản | Ghi chú |
| :--- | :---: | :--- |
| **\`3TG Học Vui Mỗi Ngày ${ver}.exe\`** | Portable | **(Khuyên dùng)** Chạy trực tiếp ngay không cần cài đặt |
| **\`3TG Học Vui Mỗi Ngày Setup ${ver}.exe\`** | Installer | Bộ cài đặt chuẩn Windows tạo shortcut Desktop & Start Menu |`;

  let release = null;
  try {
    const checkRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/releases/tags/${tagName}`, { headers });
    if (checkRes.ok) {
      release = await checkRes.json();
      console.log(`ℹ️ Release ${tagName} đã tồn tại (#${release.id}), tiến hành cập nhật thông tin & assets...`);
      await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/releases/${release.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ name: releaseTitle, body: releaseBody })
      });
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
    console.log(`✅ Đã tạo Release #${release.id} thành công!`);
  }

  const assetsToUpload = [
    { path: path.resolve(`dist-electron/3TG Học Vui Mỗi Ngày ${ver}.exe`), name: `3TG Học Vui Mỗi Ngày ${ver}.exe` },
    { path: path.resolve(`dist-electron/3TG Học Vui Mỗi Ngày Setup ${ver}.exe`), name: `3TG Học Vui Mỗi Ngày Setup ${ver}.exe` },
    { path: path.resolve('dist-electron/latest.yml'), name: 'latest.yml' }
  ];

  // Xóa asset trùng tên nếu release đã tồn tại trước đó
  if (Array.isArray(release.assets) && release.assets.length > 0) {
    for (const existing of release.assets) {
      if (assetsToUpload.some(a => a.name === existing.name)) {
        await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/releases/assets/${existing.id}`, {
          method: 'DELETE',
          headers
        });
      }
    }
  }

  for (const item of assetsToUpload) {
    if (fs.existsSync(item.path)) {
      await uploadAsset(release.upload_url, item.path, item.name, token);
    } else {
      console.warn("⚠️ Không tìm thấy file:", item.path);
    }
  }

  console.log(`\n🎉 HOÀN THÀNH PHÁT HÀNH GITHUB RELEASE V${ver}!`);
  console.log(`🔗 Link Release: ${release.html_url}`);
}

main().catch((err) => {
  console.error("❌ Release thất bại:", err);
  process.exit(1);
});
