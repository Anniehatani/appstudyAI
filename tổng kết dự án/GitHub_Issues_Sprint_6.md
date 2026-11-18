# 📋 Danh Sách GitHub Issues Sprint 6 • Nhóm TONE PINK
**Đồ án:** 3TG Study Hub • **Môn:** Công nghệ phần mềm • **GV:** ThS. Vân Anh  
**Nhóm thực hiện:** TONE PINK (Lê Văn An - Lead, Nguyễn Như Quỳnh, Nguyễn Tú)  
**Milestone:** [Sprint 6: Hoàn thiện toàn diện, Hệ thống AI đa tầng & Phát hành Release 100%](https://github.com/Anniehatani/appstudyAI/milestone/6)

---

## 📌 Issue #48: Sprint 6 – Trình bảo vệ Kiosk C++ Native study_guard.exe & Phục hồi 100% Taskbar Windows <5ms
- **Người thực hiện:** Nguyễn Tú ([`@tus-sud`](https://github.com/tus-sud))
- **Nhãn (Labels):** `desktop`, `security`, `sprint-6`
- **Mô tả:** Chuyển đổi cơ chế bảo vệ phòng học Pomodoro và quản lý màn hình Kiosk sang chương trình C++ Native biên dịch độc lập (`study_guard.exe`), trực tiếp điều khiển Win32 API `FindWindow` và `ShowWindow`, đảm bảo tự động phục hồi thanh Taskbar Windows ngay lập tức (<5ms) khi kết thúc ca học hoặc bấm `Ctrl + Q`.
- **Tiêu chuẩn chấp thuận (Acceptance Criteria):**
  - [x] Biên dịch nhị phân native `build/study_guard.exe` tối ưu hóa tốc độ thực thi cao.
  - [x] Tích hợp IPC kích hoạt tự động khi người dùng vào phòng Pomodoro có chọn chức năng chặn.
  - [x] Khôi phục thanh Taskbar Windows hoàn toàn nguyên vẹn trong vòng <5ms khi ca học kết thúc.
  - [x] Đóng gói và unpack an toàn trong cấu hình Electron Builder.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #49: Sprint 6 – Cửa sổ Zen Blackout đa màn hình (Multi-Monitor Zen Blocker)
- **Người thực hiện:** Nguyễn Tú ([`@tus-sud`](https://github.com/tus-sud))
- **Nhãn (Labels):** `desktop`, `feature`, `sprint-6`
- **Mô tả:** Xây dựng tính năng tự động nhận diện tất cả các màn hình phụ được kết nối với máy tính (`screen.getAllDisplays()`) và hiển thị cửa sổ Zen màn hình đen viền phẳng luôn nổi (`alwaysOnTop: 'screen-saver'`) trên tất cả các màn hình thứ 2/màn hình rời khi kích hoạt chế độ chặn Pomodoro.
- **Tiêu chuẩn chấp thuận:**
  - [x] Nhận diện chính xác danh sách màn hình phụ (`display.id !== primaryDisplay.id`).
  - [x] Khởi tạo cửa sổ fullscreen `alwaysOnTop: 'screen-saver'` chặn mọi thao tác lách sang màn hình 2.
  - [x] Tự động giải phóng và đóng toàn bộ cửa sổ màn hình phụ khi thoát phiên Pomodoro.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #50: Sprint 6 – Trình phát nhạc Local Offline máy tính qua HTTP 206 Partial Content (0 byte upload)
- **Người thực hiện:** Nguyễn Như Quỳnh ([`@nguyennhuuquynhh07-07`](https://github.com/nguyennhuuquynhh07-07))
- **Nhãn (Labels):** `multimedia`, `backend`, `feature`, `sprint-6`
- **Mô tả:** Bổ sung tính năng cho phép học viên tự do nhập và phát các tệp âm thanh cá nhân (MP3, WAV, FLAC, M4A) từ ổ cứng máy tính, phát trực tiếp qua Embedded Server nội bộ bằng chuẩn HTTP 206 Partial Content byte-range mà không cần tải bất kỳ byte dữ liệu nào lên Cloudflare.
- **Tiêu chuẩn chấp thuận:**
  - [x] Thêm nút chọn tệp nhạc máy tính (`+ Thêm tệp`) ở sảnh chờ Pomodoro và popover danh sách phát.
  - [x] Hỗ trợ hộp thoại mở tệp hệ thống Native Electron Dialog và Web File Picker dự phòng.
  - [x] Endpoint `/local-audio?path=...` hỗ trợ header `Range: bytes=...` và mã `HTTP 206` tua bài mượt mà.
  - [x] Lưu trữ danh sách bài hát cá nhân an toàn vào LocalStorage và cho phép xóa bài linh hoạt.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #51: Sprint 6 – Sửa lỗi Detached ArrayBuffer trên PDF.js Web Worker & Điều khiển số trang linh hoạt
- **Người thực hiện:** Nguyễn Như Quỳnh ([`@nguyennhuuquynhh07-07`](https://github.com/nguyennhuuquynhh07-07))
- **Nhãn (Labels):** `frontend`, `bug`, `sprint-6`
- **Mô tả:** Khắc phục triệt để lỗi `ArrayBuffer` bị detached khi PDF.js Web Worker trích xuất văn bản trước khi render canvas, khiến trình đọc PDF rơi vào trạng thái rỗng và tụt về thanh embed đen xám của Chromium. Đồng thời sửa lỗi hiển thị số trang cố định (Trang 1 / 1).
- **Tiêu chuẩn chấp thuận:**
  - [x] Clone độc lập `ArrayBuffer` bằng `new Uint8Array(buffer.slice(0))` trước khi gửi cho worker.
  - [x] Hiển thị chính xác tổng số trang của tài liệu (ví dụ: Trang 1 / 6) trên thanh điều khiển trắng.
  - [x] Các nút Trang trước, Trang sau và ô nhập số trang nhảy chính xác đến từng trang canvas sắc nét.
  - [x] Giữ nguyên độ nét 1.6x - 2.0x DPI của trang tài liệu khi thay đổi kích thước bàn học.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #52: Sprint 6 – API Xóa vĩnh viễn bảng điểm IU trong CSDL (Clean Academic Disconnect)
- **Người thực hiện:** Nguyễn Tú ([`@tus-sud`](https://github.com/tus-sud))
- **Nhãn (Labels):** `backend`, `database`, `privacy`, `sprint-6`
- **Mô tả:** Xây dựng endpoint `POST /api/academic/disconnect` trên backend Cloudflare Workers D1 và SQLite Local Replica, thực thi xóa sạch hoàn toàn bản ghi bảng điểm sinh viên khỏi bảng `user_academic_transcripts` khi người dùng bấm "Ngắt kết nối IU".
- **Tiêu chuẩn chấp thuận:**
  - [x] Endpoint `/api/academic/disconnect` xóa triệt để `WHERE user_id = ?`.
  - [x] Cập nhật hàm `window.resetAcademicTranscript()` gọi API này trước khi xóa dữ liệu cục bộ.
  - [x] Đảm bảo sau khi ngắt kết nối và đăng nhập lại, bảng điểm cũ không bao giờ tự động xuất hiện lại.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #53: Sprint 6 – Tự động duy trì phiên đăng nhập khi đóng/mở lại App (Persistent Session Management)
- **Người thực hiện:** Nguyễn Tú ([`@tus-sud`](https://github.com/tus-sud))
- **Nhãn (Labels):** `architecture`, `desktop`, `sprint-6`
- **Mô tả:** Khắc phục lỗi ứng dụng tự động bắt đăng nhập lại mỗi khi đóng và mở lại phần mềm trên máy tính do lệnh xóa cookie mặc định khi khởi động.
- **Tiêu chuẩn chấp thuận:**
  - [x] Loại bỏ triệt để lệnh `clearStorageData({ storages: ["cookies"] })` khi khởi động trong `electron/main.cjs`.
  - [x] Hàm `initialize()` trong `public/app.js` tự động kiểm tra `api("/api/session")` từ cookie phiên đã lưu.
  - [x] Tự động tải dữ liệu học tập cá nhân (`loadAuthenticatedData()`) nếu phiên còn hiệu lực mà không cần nhập lại mật khẩu.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #54: Sprint 6 – Hệ sinh thái 3TG AI Đa tầng (Multi-tier AI Pipeline) & Xử lý dán ảnh Clipboard (Ctrl + V)
- **Người thực hiện:** Nguyễn Như Quỳnh ([`@nguyennhuuquynhh07-07`](https://github.com/nguyennhuuquynhh07-07))
- **Nhãn (Labels):** `ai`, `feature`, `sprint-6`
- **Mô tả:** Nâng cấp hệ sinh thái AI trợ lý học tập 3TG thành cấu trúc dự phòng đa tầng (DeepSeek Primary -> Groq High-Speed Fallback `openai/gpt-oss-120b` & Vision `qwen/qwen3.8-27b`). Bổ sung khả năng dán ảnh từ Clipboard (`Ctrl + V`) trực tiếp vào khung chat AI Pomodoro để giải bài tập từ ảnh chụp màn hình.
- **Tiêu chuẩn chấp thuận:**
  - [x] Tự động chuyển tiếp thông minh sang Groq API với độ trễ phản hồi cực thấp (<0.3s) khi API chính lỗi.
  - [x] Bắt sự kiện dán ảnh Clipboard (`Ctrl + V`) trong phòng học và preview ảnh đính kèm.
  - [x] Tự động xóa sạch nội dung input sau khi gửi tin nhắn, không để sót văn bản cũ.
  - [x] Chẩn đoán chính xác mã lỗi 401 khi người dùng nhập nhầm key bên thứ 3.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #55: Sprint 6 – Tối ưu hóa mượt mà thanh Resizer AI Panel bằng RAF & Nhận diện phần cứng máy yếu
- **Người thực hiện:** Nguyễn Như Quỳnh ([`@nguyennhuuquynhh07-07`](https://github.com/nguyennhuuquynhh07-07))
- **Nhãn (Labels):** `ui/ux`, `performance`, `sprint-6`
- **Mô tả:** Tối ưu hóa thao tác kéo giãn kích thước thanh phân chia giữa tài liệu và khung chat trợ lý AI trong phòng học bằng `requestAnimationFrame` (RAF), loại bỏ hiện tượng giật lag khung hình khi xem tệp PDF nhiều trang trên các máy tính cấu hình văn phòng.
- **Tiêu chuẩn chấp thuận:**
  - [x] Sử dụng cờ RAF `isResizing` để gom các thao tác tính toán lại vào chu kỳ vẽ màn hình tiếp theo.
  - [x] Tự động vô hiệu hóa `pointer-events` trên các iframe / embed tài liệu trong lúc đang kéo giãn.
  - [x] Giảm tải tài nguyên GPU và duy trì khung hình ổn định 60 FPS trong suốt quá trình học tập.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #56: Sprint 6 – Master Test Suite: Kiểm thử tự động E2E Full All-System (38/38 Pass 100%)
- **Người thực hiện:** Nguyễn Tú ([`@tus-sud`](https://github.com/tus-sud))
- **Nhãn (Labels):** `testing`, `qa`, `sprint-6`
- **Mô tả:** Xây dựng và thực thi bộ kịch bản kiểm thử tích hợp tự động toàn diện (`scripts/test_sprint6_full_suite.cjs`) kiểm tra mọi thành phần kỹ thuật cốt lõi trước khi đóng gói phát hành sản phẩm.
- **Tiêu chuẩn chấp thuận:**
  - [x] Kiểm tra cấu trúc CSDL SQLite / D1 Local Replica với đầy đủ các bảng dữ liệu cốt lõi.
  - [x] Kiểm thử luồng Groq AI LLM sinh câu trả lời thành công.
  - [x] Kiểm thử nhị phân C++ Kiosk Guard, đa màn hình Zen và kiểm tra cookie khởi động.
  - [x] Kiểm thử đường dẫn stream nhạc local HTTP 206 Byte-Range.
  - [x] Kiểm thử xử lý tài liệu PDF và cơ chế tự động khôi phục phiên.
  - [x] Đạt kết quả 38/38 tiêu chí kiểm thử PASS 100%.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #57: Sprint 6 – Đóng gói phát hành Release V29.9.07 & Hoàn thiện Báo cáo Tổng kết Đồ án Sprint 6
- **Người thực hiện:** Nguyễn Như Quỳnh ([`@nguyennhuuquynhh07-07`](https://github.com/nguyennhuuquynhh07-07))
- **Nhãn (Labels):** `documentation`, `release`, `sprint-6`
- **Mô tả:** Tổng kết toàn bộ chu kỳ phát triển của dự án đồ án môn học Công nghệ phần mềm: Biên soạn tài liệu `Sprint_6.md` và danh mục GitHub Issues Sprint 6, đóng gói bản phát hành Desktop Portable `3TG Học Vui Mỗi Ngày V29.9.07.exe`.
- **Tiêu chuẩn chấp thuận:**
  - [x] Hoàn thiện file `tổng kết dự án/Sprint_6.md` chuẩn mẫu báo cáo khoa học.
  - [x] Hoàn thiện file `tổng kết dự án/GitHub_Issues_Sprint_6.md`.
  - [x] Đồng bộ toàn bộ 10 Issues Sprint 6 lên GitHub với đầy đủ Assignees, Labels và Milestone.
  - [x] Đóng dấu nghiệm thu sản phẩm đạt chuẩn A+ của nhóm TONE PINK.
- **Trạng thái:** ✅ **Closed / Done**
