# 📋 Danh Sách GitHub Issues Sprint 4 • Nhóm TONE PINK
**Đồ án:** 3TG Study Hub • **Môn:** Công nghệ phần mềm • **GV:** Cô Vân Anh  
**Nhóm thực hiện:** TONE PINK (Lê Văn An - Lead, Nguyễn Như Quỳnh, Nguyễn Tú)

---

## 📌 Issue #SP4-01: [UI/UX] Tối ưu hóa phản hồi nhắn tin Optimistic UI (0ms delay) & Bỏ thanh gợi ý rườm rà
- **Người thực hiện:** Lê Văn An (Lead)
- **Nhãn (Labels):** `enhancement`, `ui/ux`, `sprint-4`
- **Mô tả:** Khắc phục triệt để độ trễ 1-2s khi gửi tin nhắn trong 3TG Messenger. Áp dụng Optimistic UI rendering để tin nhắn hiển thị ngay lập tức (0ms). Xóa bỏ hoàn toàn thanh gợi ý emoji/lời nhắn rườm rà ở chân chat để khung chat sạch sẽ, chuyên nghiệp.
- **Tiêu chuẩn chấp thuận (Acceptance Criteria):**
  - [x] Tin nhắn xuất hiện tức thì trong khung chat khi nhấn Enter hoặc bấm Gửi.
  - [x] Input và các thanh đính kèm xóa sạch ngay tức khắc.
  - [x] Xóa sạch thẻ `.chat-quick-emojis`.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP4-02: [Backend] Tích hợp Trợ lý Bot 3TG Native cực nhẹ vào runtime Node của App
- **Người thực hiện:** Lê Văn An (Lead)
- **Nhãn (Labels):** `feature`, `backend`, `sprint-4`
- **Mô tả:** Xóa bỏ thư mục `node_modules` nặng nề của botdiscord cũ. Chuyển đổi toàn bộ engine lệnh bot sang module Native `src/bot3tg.js` chạy chung với Node runtime của App, tiêu thụ gần như 0 RAM bổ sung và không phụ thuộc thư viện ngoài.
- **Tiêu chuẩn chấp thuận:**
  - [x] Đã xóa vĩnh viễn `botdiscord-main/node_modules`.
  - [x] Module `src/bot3tg.js` nạp trơn tru qua ES Module.
  - [x] Tự động thêm Bot 3TG vào mọi nhóm mới tạo.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP4-03: [Media] Kho lệnh Media phong phú (!ff, !anime, !gai, !sad, !trai, !anh, !sing)
- **Người thực hiện:** Nguyễn Như Quỳnh
- **Nhãn (Labels):** `feature`, `media`, `sprint-4`
- **Mô tả:** Nạp kho dữ liệu video/ảnh từ `data/media/*.json` vào Bot 3TG. Hỗ trợ đầy đủ các lệnh giải trí: Free Fire (`!ff`), Anime (`!anime`), Gái xinh (`!gai`), Tâm trạng buồn (`!sad`), Trai đẹp (`!trai`), Ảnh ngẫu nhiên (`!anh`), và Phát nhạc (`!sing`).
- **Tiêu chuẩn chấp thuận:**
  - [x] Nhận diện alias phong phú (`!ff`, `!freefire`, `!vdff`, `!gai`, `!girl`...).
  - [x] Trả về link video CDN Supabase sắc nét phát trực tiếp trong nhóm.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP4-04: [Bot] Xử lý Báo sai lệnh (sailenh) khi gõ lệnh lạ hoặc ký tự !
- **Người thực hiện:** Nguyễn Tú
- **Nhãn (Labels):** `enhancement`, `bot`, `sprint-4`
- **Mô tả:** Đảm bảo Bot 3TG luôn phản hồi và không im lặng khi người dùng gõ sai lệnh hoặc chỉ gõ ký tự `!`. Gợi ý người dùng gõ `!help` để khám phá toàn bộ lệnh.
- **Tiêu chuẩn chấp thuận:**
  - [x] Khi gõ lệnh chưa hỗ trợ (VD: `!test`), Bot phản hồi thông báo sai lệnh kèm video/gif vui nhộn.
  - [x] Khi gõ `!`, Bot phản hồi hướng dẫn mở menu lệnh.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP4-05: [Security] Phân quyền Quản trị Nhóm (Chuyển key, Phó nhóm, Kick thành viên)
- **Người thực hiện:** Lê Văn An (Lead)
- **Nhãn (Labels):** `security`, `backend`, `sprint-4`
- **Mô tả:** Xây dựng hệ thống phân quyền nhóm học tập chuẩn RBAC (`admin`, `deputy`, `member`, `bot`):
  - Chuyển giao quyền Trưởng nhóm (Key holder) cho thành viên khác.
  - Bổ nhiệm hoặc thu hồi quyền Phó nhóm.
  - Kick thành viên vi phạm khỏi nhóm (chặn phó nhóm kick trưởng nhóm).
- **Tiêu chuẩn chấp thuận:**
  - [x] API `POST /api/groups/:id/members/kick`
  - [x] API `POST /api/groups/:id/members/role`
  - [x] API `POST /api/groups/:id/members/transfer-owner`
  - [x] Modal hiển thị huy hiệu 👑 Trưởng nhóm, 🛡️ Phó nhóm, 🤖 Trợ lý Bot, 👤 Thành viên.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP4-06: [Group] Quản lý Bot 3TG: Cho phép Trưởng/Phó nhóm thêm và mời Bot ra
- **Người thực hiện:** Nguyễn Như Quỳnh
- **Nhãn (Labels):** `feature`, `group`, `sprint-4`
- **Mô tả:** Trưởng nhóm và Phó nhóm có toàn quyền linh hoạt mời Bot 3TG ra khỏi nhóm chat hoặc thêm lại Bot vào nhóm để hỗ trợ học tập khi cần.
- **Tiêu chuẩn chấp thuận:**
  - [x] API `POST /api/groups/:id/bot` (`action: 'add' | 'remove'`).
  - [x] Nút bấm trực quan trong Modal Thành viên (`[🚫 Mời Bot ra]` / `[➕ Thêm Bot]`).
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP4-07: [Real-time] Đồng bộ thời gian hoạt động thực tế (Active Status) qua Heartbeat
- **Người thực hiện:** Nguyễn Tú
- **Nhãn (Labels):** `bug`, `real-time`, `sprint-4`
- **Mô tả:** Sửa lỗi hiển thị online ảo. Bổ sung trường `last_active_at` và endpoint `/api/user/heartbeat`. Tính toán chuẩn xác trạng thái chấm xanh/xám theo thời gian thực.
- **Tiêu chuẩn chấp thuận:**
  - [x] Người dùng không hoạt động hiển thị đúng 'Hoạt động X phút trước'.
  - [x] Dưới 3 phút hiển thị 'Đang hoạt động' (chấm xanh).
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP4-08: [Messenger] Đa phương tiện & Trích dẫn trả lời tin nhắn (Quote/Reply)
- **Người thực hiện:** Lê Văn An (Lead)
- **Nhãn (Labels):** `feature`, `messenger`, `sprint-4`
- **Mô tả:** Hỗ trợ gửi ảnh kèm Lightbox phóng to, trình phát video, trình phát audio tin nhắn thoại và tệp đính kèm. Hỗ trợ nút reply `↩️` trích dẫn tin nhắn và tự cuộn mượt đến tin nhắn gốc.
- **Tiêu chuẩn chấp thuận:**
  - [x] Xem ảnh phóng to sắc nét khi nhấp.
  - [x] Ghi âm và gửi voice message trực tiếp.
  - [x] Cuộn mượt đến tin nhắn được trích dẫn.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP4-09: [Database] Đồng bộ hóa Schema & Di trú toàn diện Cloudflare D1
- **Người thực hiện:** Lê Văn An (Lead)
- **Nhãn (Labels):** `database`, `devops`, `sprint-4`
- **Mô tả:** Khắc phục lỗi `SQLITE_ERROR: no such table: chat_groups` trên Cloudflare D1 Remote Endpoint. Di trú toàn bộ bảng chat nhóm, tin nhắn, bạn bè và nạp sẵn Bot 3TG vào cơ sở dữ liệu.
- **Tiêu chuẩn chấp thuận:**
  - [x] D1 Remote phản hồi HTTP 200 không còn lỗi thiếu bảng.
  - [x] SQLite Local Replica đồng bộ cấu trúc 100%.
- **Trạng thái:** ✅ **Closed / Done**
