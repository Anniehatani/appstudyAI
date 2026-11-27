# 🛡️ BÁO CÁO TỔNG KẾT SPRINT 5 — DỰ ÁN 3TG STUDY AI
**Môn học:** Công nghệ phần mềm | **Giảng viên hướng dẫn:** ThS. Vân Anh  
**Nhóm thực hiện:** TONE PINK | **Repository:** [Anniehatani/appstudyAI](https://github.com/Anniehatani/appstudyAI)

---

## 📌 PHẦN 1: TỔNG QUAN SPRINT 5

### 1. Mục tiêu Sprint 5
Sprint 5 tập trung vào 3 trụ cột kỹ thuật trọng tâm:
1. **Nâng cấp Bảo mật Toàn diện & Tinh chỉnh Kiến trúc Hệ thống:**
   * **Bảo vệ Secret & API Key trong bản cài Electron:** Loại bỏ hoàn toàn `.dev.vars`, `.env*` khỏi danh sách đóng gói của Electron Builder (`package.json`), ngăn chặn tuyệt đối rò rỉ Cloudflare API Token, R2 Access Key hay DeepSeek Key khi người dùng trích xuất file `.asar`.
   * **Nâng cấp Thuật toán Băm Mật khẩu:** Chuyển đổi từ SHA-256 legacy sang thuật toán **PBKDF2-HMAC-SHA256 với Salt ngẫu nhiên 16 bytes riêng biệt** cho từng tài khoản, chạy 100,000 vòng lặp (Iterations) chuẩn OWASP, so sánh bảo mật Timing-Safe Equal chống Timing Attack và tự động nâng cấp mật khẩu cũ khi người dùng đăng nhập.
   * **Rate Limiting chống dò mật khẩu:** Thiết lập giới hạn tối đa 5 lần thử sai trong 15 phút tại `/api/auth/login` và `/api/auth/register`, trả về mã lỗi HTTP 429 Too Many Requests.
   * **Kiến trúc Transactional Outbox & Replay Queue:** Bổ sung bảng `sync_outbox` và cơ chế phát lại đối soát ngoại tuyến khi mất mạng hoặc Cloudflare D1 vượt hạn ngạch đọc, giải quyết dứt điểm tình trạng bất đồng bộ dữ liệu giữa SQLite và D1.
   * **Module hóa Backend:** Tách các khối xử lý bảo mật, outbox và xác thực pomodoro thành các module độc lập trong `src/modules/` (`crypto.js`, `pomodoro_validator.js`, `sync_outbox.js`).

2. **Hệ thống Đa Chủ Đề Màu Sắc (Themes) & Tối Ưu Màn Hình Động:**
   * **Hệ thống 6 Theme Duolingo rực rỡ:** Bổ sung các bảng màu sắc thái hiện đại (Hồng Pastel TONE PINK, Xanh Dương CMC, Tím Mộng Mơ, Xanh Lá Cây, Vàng Rực Rỡ, Cam Năng Động) kết hợp Chế độ Tối Deep Midnight Velvet Dark Mode.
   * **Phủ sóng màu sắc toàn diện 100%:** Đồng bộ CSS Variables (`--theme-accent`, `--theme-accent-hover`, `--theme-accent-soft`, `--theme-border`, `--theme-gradient`) áp dụng xuyên suốt Topbar, Sidebar, Lộ trình học, Mascot, Dialog và các nút bấm.
   * **Thiết kế Responsive thích ứng 100%–200% DPI Scaling:** Sidebar linh hoạt chuẩn 340px, Cover Banner trang cá nhân chuẩn điện ảnh 480px, tự động co giãn sắc nét trên mọi loại màn hình từ laptop 13-14 inch đến màn hình rời 2K/4K.
   * **Tối ưu hóa hiệu năng máy yếu (Low-end PC):** Áp dụng `content-visibility: auto` ảo hóa danh sách dài (giảm 70% thời gian render DOM), tách Hardware Composite Layer (`transform: translateZ(0)`), giảm thiểu độ trễ Gaussian Blur của `backdrop-filter`.

3. **Phòng Học Siêu Tập Trung Pomodoro & Lofi Zen Mode Chống Gian Lận:**
   * **Chế độ Focus Kiosk Mode chống xao nhãng:** Khóa toàn màn hình, ẩn Taskbar Windows, chặn triệt để các phím tắt hệ thống (`Alt`, `Alt+Tab`, `Win Key`, `F1-F12`, `Esc`), tự động phục hồi Taskbar nguyên vẹn khi thoát ca bằng `Ctrl + Q`.
   * **Xác thực thời gian máy chủ chống gian lận (Anti-tamper Gamification):** Server tính toán thời gian học thực tế (`now - started_at`) dựa trên `pomodoro_active_learners`, chỉ công nhận số chu kỳ (`verifiedCycles`) và phần thưởng (+50 XP & 30 Gems/ca) khi học đủ thời lượng thực, ngăn chặn tuyệt đối việc can thiệp gửi request ảo nhận thưởng khống.
   * **Trình đọc tài liệu toàn năng & Điều khiển Zoom:** Mở và xem mượt mà đa định dạng (PDF, Word DOCX/DOC, PowerPoint, Code, Text, Media, Sổ tay ghi chú 3TG), tích hợp thanh công cụ Zoom chuyên nghiệp và cử chỉ 2 ngón trackpad / Ctrl + cuộn chuột.
   * **Âm thanh Lofi & ASMR kích thích sóng não Alpha:** Tích hợp 4 kênh âm thanh offline, tối ưu hóa z-index popover bài hát thông minh không bị đè bởi thanh resizer AI.

---

### 2. Phân công vai trò thành viên nhóm TONE PINK trong Sprint 5

| STT | Thành viên | Tài khoản GitHub | Vai trò trong Sprint 5 | Nhiệm vụ cụ thể |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Lê Văn An** *(Lead)* | [`@Anniehatani`](https://github.com/Anniehatani) | **Team Lead, Security & Architecture** | - Khắc phục bảo mật đóng gói Electron Builder, cách ly secret API token.<br>- Triển khai thuật toán PBKDF2-HMAC-SHA256, Salt ngẫu nhiên và Rate Limiter.<br>- Xây dựng Transactional Outbox & Replay Queue cho SQLite – D1.<br>- Thiết kế cơ chế xác thực thời gian học Pomodoro chống gian lận tại server.<br>- Điều phối tiến độ Sprint 5 và hợp nhất mã nguồn. |
| **2** | **Nguyễn Như Quỳnh** | [`@nguyennhuuquynhh07-07`](https://github.com/nguyennhuuquynhh07-07) | **Frontend Lead, Theme & UI/UX** | - Thiết kế và hoàn thiện hệ thống 6 Theme Duolingo rực rỡ và Midnight Velvet Dark Mode.<br>- Tối ưu hóa biến CSS3 phủ sóng 100% màu sắc toàn app.<br>- Xử lý responsive giao diện động thích ứng tỉ lệ màn hình 100%–200% DPI Scaling.<br>- Thiết kế bộ Slide thuyết trình PowerPoint Sprint 5 chuẩn nhận diện TONE PINK. |
| **3** | **Nguyễn Tú** | [`@tus-sud`](https://github.com/tus-sud) | **Pomodoro Engine, QA & Optimization** | - Nâng cấp phòng học Pomodoro, hoàn thiện trình đọc tài liệu và điều khiển Zoom 2 ngón.<br>- Xây dựng Hook bàn phím Kiosk Guard khóa cứng phím phân tâm trên Windows.<br>- Tối ưu hóa hiệu năng render cho máy tính yếu (`content-visibility: auto`, GPU caching).<br>- Thực hiện kiểm thử toàn diện và biên soạn Báo cáo kỹ thuật Sprint 5 Word (`.docx`). |

---

## 📌 PHẦN 2: CHI TIẾT CÁC CÔNG VIỆC HOÀN THIỆN TRONG SPRINT 5

### 1. Trụ cột Bảo mật & Kiến trúc Dữ liệu
* **Bảo vệ Secret & Khóa quản trị:** Đã cấu hình lại file `package.json` với các quy tắc loại trừ `!**/.dev.vars`, `!**/.env*`, `!**/*.key`, `!**/*.pem`. Trong `electron/embedded-server.cjs`, kiểm tra cờ `isPackaged` để không bao giờ đọc hoặc tìm kiếm secret file trên máy người dùng cuối.
* **Chuẩn mã hóa mật khẩu PBKDF2:** 
  - Khởi tạo module `src/modules/crypto.js`.
  - Sinh Salt ngẫu nhiên 16 bytes bằng `crypto.getRandomValues()`.
  - Băm bằng hàm chuẩn `crypto.subtle.deriveBits("PBKDF2", salt, 100000, "SHA-256")`.
  - Tự động kiểm tra và nâng cấp mật khẩu cũ (Legacy SHA-256) sang PBKDF2 ngay khi người dùng đăng nhập thành công.
* **Chống Brute-force:** Tích hợp bộ đếm Rate Limiter trượt trong 15 phút, chặn đứng các cuộc tấn công rà quét mật khẩu hoặc đăng ký tài khoản hàng loạt.
* **Hàng đợi ngoại tuyến Transactional Outbox:**
  - Khởi tạo bảng `sync_outbox` lưu trữ các câu lệnh SQL INSERT/UPDATE/DELETE khi rớt mạng.
  - Tiến trình `replayOutboxToD1()` tự động đối soát và phát lại dữ liệu lên Cloudflare D1 theo thứ tự FIFO khi kết nối mạng được tái lập.
* **Tách module Backend:** Giảm tải cho tệp `src/index.js`, tổ chức mã nguồn thành các module độc lập dễ kiểm thử và bảo trì.

### 2. Trụ cột Hệ thống Theme & Trải nghiệm Màn hình Động
* **Bộ 6 Theme phong cách Duolingo:**
  1. *Hồng Pastel TONE PINK:* Ngọt ngào, nhẹ nhàng, đặc trưng của nhóm đồ án.
  2. *Xanh Dương CMC University:* Trẻ trung, chuyên nghiệp, gắn liền với sinh viên CMC.
  3. *Tím Mộng Mơ (Dreamy Lavender):* Thư giãn, êm dịu, giảm căng thẳng thị giác.
  4. *Xanh Lá Cây (Duolingo Green):* Năng động, truyền cảm hứng học tập mỗi ngày.
  5. *Vàng Rực Rỡ (Solar Gold):* Ấm áp, tích cực, kích thích tư duy sáng tạo.
  6. *Cam Năng Động (Sunset Energy):* Tràn đầy nhiệt huyết và năng lượng.
* **Midnight Velvet Dark Mode:** Chế độ ban đêm màu nền `#121620` và `#181c2b` chống mỏi mắt, tương phản cao, bảo vệ mắt học viên khi cày đêm.
* **Responsive 100%–200% DPI:**
  - Sidebar cố định 340px rộng rãi, Logo thương hiệu nổi bật 215px.
  - Cover Banner trang cá nhân đạt độ cao 480px chuẩn tỉ lệ vàng, hiển thị trọn vẹn chi tiết nghệ thuật của hình nền học viên.
* **Tối ưu máy yếu:** Áp dụng `content-visibility: auto` cho danh sách tin nhắn Messenger, bài học, sổ tay và cửa hàng, giúp máy yếu lướt mượt mà 60 FPS.

### 3. Trụ cột Phòng học Pomodoro & Lofi Zen Mode
* **Chế độ Kiosk Siêu Tập Trung (Focus Kiosk Mode):**
  - Chặn triệt để `Alt`, `Alt+Tab`, `Win Key`, `F1`–`F12`, `Esc` bằng hook cấp hệ thống `build/pomo_guard.exe` và `before-input-event` của Electron.
  - Cửa sổ tự động phục hồi và lấy lại tiêu điểm nếu học viên cố gắng vuốt 3 ngón trên trackpad (Task View / Show Desktop).
  - Tự động hoàn trả thanh Taskbar Windows ngay lập tức khi kết thúc ca học hoặc nhấn `Ctrl + Q`.
* **Xác thực phần thưởng máy chủ (Anti-tamper Gamification):**
  - Người dùng bắt buộc phải có phiên học được ghi nhận lúc bắt đầu trong bảng `pomodoro_active_learners`.
  - Server tự động tính toán thời gian trôi qua thực tế; số chu kỳ và phần thưởng (+50 XP, +30 Gems) được tính toán hoàn toàn độc lập tại máy chủ, không thể gian lận bằng cách sửa đổi request.
  - Cơ chế Idempotency xóa phiên active ngay khi nhận thưởng, ngăn chặn việc gọi lặp API để nhận thưởng kép.
* **Trình đọc tài liệu & Điều khiển Zoom toàn năng:**
  - Hỗ trợ mở đọc tài liệu Word DOCX/DOC, PDF, PowerPoint, Code, Text, Media ngay trên bàn học.
  - Tích hợp điều khiển Zoom: Thu nhỏ (`-`), Phóng to (`+`), Đặt lại 100% (`↺`), phím tắt `Ctrl + / - / 0` và thao tác chụm 2 ngón tay trên Trackpad.
  - Khắc phục lỗi z-index: Popover danh sách bài hát hiển thị nổi bật trên cùng, không bị đè bởi thanh resizer khung chat AI.

---

## 📌 PHẦN 3: BẢNG TỔNG KẾT KẾT QUẢ KIỂM THỬ SPRINT 5

| STT | Kịch bản kiểm thử (Test Case) | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **TC01** | Băm mật khẩu tài khoản mới đăng ký | Mật khẩu được băm bằng PBKDF2-SHA256 với Salt ngẫu nhiên 16 bytes | Định dạng `pbkdf2:100000:...`, mã hóa an toàn | **PASS** |
| **TC02** | Đăng nhập tài khoản cũ (Legacy SHA-256) | Đăng nhập thành công và tự động nâng cấp sang PBKDF2 | Mật khẩu cũ khớp, database tự động cập nhật hash PBKDF2 | **PASS** |
| **TC03** | Thử nhập sai mật khẩu quá 5 lần | Hệ thống khóa tạm thời 15 phút, báo lỗi HTTP 429 | Báo lỗi 429, yêu cầu chờ thời gian đếm ngược chính xác | **PASS** |
| **TC04** | Hoàn thành Pomodoro gửi số cycle ảo | Server kiểm tra thời gian thực tế, bác bỏ số cycle khống | Server chỉ tính thưởng theo thời gian học thực, chặn gian lận | **PASS** |
| **TC05** | Nhấn nhận thưởng Pomodoro nhiều lần | Chỉ nhận thưởng duy nhất 1 lần cho mỗi phiên học (Idempotent) | Lần gọi thứ 2 bị từ chối do phiên active đã được xóa | **PASS** |
| **TC06** | Mất mạng khi thao tác dữ liệu | Dữ liệu lưu vào SQLite local và ghi nhận vào bảng `sync_outbox` | Thao tác ghi nhận thành công, outbox ở trạng thái `pending` | **PASS** |
| **TC07** | Phục hồi kết nối mạng Internet | Tiến trình replay tự động gửi các thay đổi từ outbox lên Cloudflare D1 | Toàn bộ bản ghi outbox chuyển sang trạng thái `synced` | **PASS** |
| **TC08** | Chuyển đổi qua lại giữa 6 Theme & Dark Mode | Toàn bộ giao diện (Topbar, Sidebar, Nút bấm) đổi màu đồng bộ 100% | Phủ sóng màu sắc hoàn hảo, không còn điểm nào sót màu | **PASS** |
| **TC09** | Thay đổi tỉ lệ màn hình Desktop (100%–200% DPI) | Sidebar giữ chuẩn 340px, Cover Banner giữ độ cao 480px sắc nét | Giao diện tự động co giãn thích ứng mượt mà, không bị lép | **PASS** |
| **TC10** | Kích hoạt Kiosk Pomodoro và bấm các phím tắt hệ thống | Chặn hoàn toàn phím Alt, Alt+Tab, Win Key; Taskbar ẩn an toàn | Ứng dụng khóa chặt toàn màn hình, thoát bằng Ctrl + Q hoàn hảo | **PASS** |

---

## 📌 PHẦN 4: KẾT LUẬN & ĐÁNH GIÁ SPRINT 5

1. **Về tiến độ & chất lượng:** Nhóm TONE PINK đã hoàn thành **100% các mục tiêu kỹ thuật đề ra trong Sprint 5**, nâng tầm đồ án 3TG Study thành một ứng dụng học tập máy tính an toàn, bảo mật cao, giao diện hiện đại và trải nghiệm người dùng vượt trội.
2. **Về tính ổn định & khả năng mở rộng:** Kiến trúc phân tách module (`crypto`, `pomodoro_validator`, `sync_outbox`), cùng cơ chế Transactional Outbox Replay giúp phần mềm vận hành bền bỉ trên cả môi trường có mạng lẫn mất mạng hoàn toàn.
3. **Mức độ đóng góp của các thành viên:**
   * **Lê Văn An (Leader):** 100% — Chủ trì kiến trúc bảo mật PBKDF2, Outbox Replay, Server Pomodoro Validator và điều phối phát hành.
   * **Nguyễn Như Quỳnh:** 100% — Chủ trì hệ thống 6 Theme Duolingo, Dark Mode, Responsive màn hình động và thiết kế Slide Sprint 5.
   * **Nguyễn Tú:** 100% — Chủ trì hoàn thiện Pomodoro Kiosk, Zoom Viewer, tối ưu hiệu năng máy yếu và kiểm thử chất lượng.

*Hà Nội, ngày 17 tháng 11 năm 2026*  
**Đại diện nhóm TONE PINK — Nhóm trưởng: Lê Văn An**
