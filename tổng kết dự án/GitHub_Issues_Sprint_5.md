# 📋 Danh Sách GitHub Issues Sprint 5 • Nhóm TONE PINK
**Đồ án:** 3TG Study Hub • **Môn:** Công nghệ phần mềm • **GV:** ThS. Vân Anh  
**Nhóm thực hiện:** TONE PINK (Lê Văn An - Lead, Nguyễn Như Quỳnh, Nguyễn Tú)

---

## 📌 Issue #SP5-01: [Security] Bảo vệ Secret & API Key trong bản cài Electron, cách ly token quản trị
- **Người thực hiện:** Lê Văn An (`@Anniehatani`)
- **Nhãn (Labels):** `security`, `architecture`, `desktop`, `sprint-5`
- **Mô tả:** Ngăn chặn tuyệt đối việc rò rỉ Cloudflare API Token, R2 Access Key hoặc DeepSeek API Key khi người dùng trích xuất file `.asar` của bản cài đặt Desktop. Cấu hình loại trừ nghiêm ngặt trong `package.json` và kiểm tra cờ `isPackaged` trong `electron/embedded-server.cjs`.
- **Tiêu chuẩn chấp thuận (Acceptance Criteria):**
  - [x] Không bao gồm bất kỳ file `.dev.vars`, `.env*`, `.key` trong gói asar.
  - [x] Bản cài đóng gói không bao giờ đọc hoặc tìm kiếm secret file cục bộ trên máy người dùng.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP5-02: [Security] Nâng cấp chuẩn mã hóa mật khẩu PBKDF2-HMAC-SHA256 với Salt 16-byte ngẫu nhiên
- **Người thực hiện:** Lê Văn An (`@Anniehatani`)
- **Nhãn (Labels):** `security`, `backend`, `database`, `sprint-5`
- **Mô tả:** Nâng cấp thuật toán băm mật khẩu từ SHA-256 legacy lên chuẩn an toàn cấp công nghiệp PBKDF2-HMAC-SHA256 với Salt 16 bytes ngẫu nhiên, chạy 100,000 vòng lặp chuẩn OWASP và so sánh Timing-Safe Equal.
- **Tiêu chuẩn chấp thuận:**
  - [x] Sinh Salt ngẫu nhiên 16 bytes bằng `crypto.getRandomValues()` cho từng tài khoản.
  - [x] Băm mật khẩu 100,000 iterations chuẩn OWASP.
  - [x] Tự động nâng cấp mật khẩu cũ sang PBKDF2 khi người dùng đăng nhập.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP5-03: [Security] Thiết lập Rate Limiting trượt chống Brute-force mật khẩu và rà quét tài khoản
- **Người thực hiện:** Lê Văn An (`@Anniehatani`)
- **Nhãn (Labels):** `security`, `backend`, `sprint-5`
- **Mô tả:** Thiết lập bộ đếm Rate Limiter trượt trong 15 phút tại `/api/auth/login` và `/api/auth/register`, giới hạn tối đa 5 lần thử sai liên tiếp.
- **Tiêu chuẩn chấp thuận:**
  - [x] Chặn đứng các cuộc tấn công rà quét mật khẩu và spam đăng ký.
  - [x] Trả về mã lỗi HTTP 429 Too Many Requests kèm thông báo thời gian đếm ngược chính xác.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP5-04: [Database] Kiến trúc Transactional Outbox & Replay Queue đồng bộ ngoại tuyến SQLite – Cloudflare D1
- **Người thực hiện:** Lê Văn An (`@Anniehatani`)
- **Nhãn (Labels):** `database`, `backend`, `architecture`, `sprint-5`
- **Mô tả:** Khởi tạo bảng `sync_outbox` và tiến trình `replayOutboxToD1()` tự động đối soát và đồng bộ dữ liệu lên Cloudflare D1 theo thứ tự FIFO khi kết nối mạng phục hồi.
- **Tiêu chuẩn chấp thuận:**
  - [x] Bảng `sync_outbox` lưu trữ các câu lệnh INSERT/UPDATE/DELETE khi rớt mạng.
  - [x] Tự động phát lại dữ liệu lên Cloudflare D1 khi có mạng Internet.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP5-05: [Architecture] Tái cấu trúc Module hóa Backend (crypto, pomodoro_validator, sync_outbox)
- **Người thực hiện:** Lê Văn An (`@Anniehatani`)
- **Nhãn (Labels):** `backend`, `architecture`, `sprint-5`
- **Mô tả:** Phân tách các khối xử lý bảo mật, outbox và xác thực pomodoro thành các module độc lập trong `src/modules/` (`crypto.js`, `pomodoro_validator.js`, `sync_outbox.js`).
- **Tiêu chuẩn chấp thuận:**
  - [x] Mã nguồn `src/index.js` gọn gàng, module hóa rõ ràng.
  - [x] Dễ dàng bảo trì và kiểm thử độc lập từng thành phần.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP5-06: [UI/UX] Hệ sinh thái 6 Theme Duolingo sống động & Chế độ nền tối Midnight Velvet Dark Mode
- **Người thực hiện:** Nguyễn Như Quỳnh (`@nguyennhuuquynhh07-07`)
- **Nhãn (Labels):** `frontend`, `ui/ux`, `feature`, `sprint-5`
- **Mô tả:** Xây dựng hệ thống 6 Theme sắc màu rực rỡ phong cách Duolingo (Hồng Pastel TONE PINK, Xanh Dương CMC, Tím Mộng Mơ, Xanh Lá Cây, Vàng Rực Rỡ, Cam Năng Động) kết hợp Midnight Velvet Dark Mode.
- **Tiêu chuẩn chấp thuận:**
  - [x] Tùy biến toàn bộ màu sắc nút bấm, viền sáng, thanh tiến trình theo theme đã chọn.
  - [x] Chế độ tối Midnight Velvet Dark Mode chống lóa mắt khi cày đêm.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP5-07: [UI/UX] Phủ sóng CSS Variables 100% toàn app & Responsive thích ứng 100%–200% DPI Scaling
- **Người thực hiện:** Nguyễn Như Quỳnh (`@nguyennhuuquynhh07-07`)
- **Nhãn (Labels):** `frontend`, `ui/ux`, `sprint-5`
- **Mô tả:** Phủ sóng bộ biến CSS3 `--theme-accent`, `--theme-border`, `--theme-gradient` xuyên suốt Topbar, Sidebar, Lộ trình học, Dialog, Cửa hàng và Mascot; tự động thích ứng DPI Scaling 100%–200%.
- **Tiêu chuẩn chấp thuận:**
  - [x] Sidebar cố định chuẩn 340px, Cover Banner trang cá nhân đạt độ cao 480px chuẩn tỉ lệ vàng.
  - [x] Tối ưu `content-visibility: auto` ảo hóa danh sách, giảm 70% thời gian render DOM trên máy yếu.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP5-08: [Desktop] Phòng học Pomodoro Chế độ Focus Kiosk Mode khóa màn hình và chặn phím phân tâm Windows
- **Người thực hiện:** Nguyễn Tú (`@tus-sud`)
- **Nhãn (Labels):** `desktop`, `feature`, `sprint-5`
- **Mô tả:** Khóa toàn màn hình Kiosk Mode, ẩn Taskbar Windows an toàn, cài đặt Driver Hook bàn phím cấp thấp `WH_KEYBOARD_LL` chặn triệt để phím Windows, Context Menu, F1-F12, Esc, Alt+Tab.
- **Tiêu chuẩn chấp thuận:**
  - [x] Chặn hoàn toàn phím tắt hệ thống trong ca học Pomodoro.
  - [x] Thoát khẩn cấp an toàn bằng `Ctrl + Q` và tự động làm tươi Taskbar / Start Menu ngay lập tức.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP5-09: [Gamification] Server-side Pomodoro Validator chống gian lận thời lượng học và nhận thưởng ảo
- **Người thực hiện:** Lê Văn An (`@Anniehatani`)
- **Nhãn (Labels):** `security`, `backend`, `sprint-5`
- **Mô tả:** Server tự tính toán thời lượng trôi qua thực tế (`now - started_at`), chỉ công nhận số chu kỳ và phần thưởng (+50 XP, +30 Gems/ca) khi học đủ thời lượng thực, chống spam nhận thưởng ảo.
- **Tiêu chuẩn chấp thuận:**
  - [x] Ghi nhận phiên active trong `pomodoro_active_learners`.
  - [x] Idempotency: xóa phiên active ngay khi nhận thưởng, ngăn nhận thưởng kép.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP5-10: [Documentation] Trình đọc tài liệu toàn năng (Word, PDF, PPTX), Điều khiển Zoom 2 ngón & Báo cáo Sprint 5
- **Người thực hiện:** Nhóm TONE PINK (Lê Văn An, Nguyễn Như Quỳnh, Nguyễn Tú)
- **Nhãn (Labels):** `documentation`, `frontend`, `qa`, `sprint-5`
- **Mô tả:** Tích hợp trình đọc đa định dạng (PDF, Word, PowerPoint, Code, Text) kèm điều khiển Zoom 2 ngón Trackpad; hoàn thiện bộ tài liệu Báo cáo Word, Slide thuyết trình PowerPoint và hồ sơ nghiệm thu kỹ thuật Sprint 5.
- **Tiêu chuẩn chấp thuận:**
  - [x] Đọc mượt mà đa định dạng tài liệu học tập trong phòng Pomodoro.
  - [x] Báo cáo Word: `Bao_Cao_Sprint_5_Do_An_3TG_Study_TONE_PINK.docx`.
  - [x] Slide PPTX: `Slide_Thuyet_Trinh_Sprint_5_TONE_PINK.pptx`.
- **Trạng thái:** ✅ **Closed / Done**
