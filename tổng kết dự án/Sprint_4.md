# 💬 BÁO CÁO TỔNG KẾT SPRINT 4 — DỰ ÁN 3TG STUDY AI
**Môn học:** Công nghệ phần mềm | **Giảng viên hướng dẫn:** ThS. Vân Anh  
**Nhóm thực hiện:** TONE PINK | **Repository:** [Anniehatani/appstudyAI](https://github.com/Anniehatani/appstudyAI)

---

## 📌 PHẦN 1: TỔNG QUAN SPRINT 4 (MẠNG XÃ HỘI HỌC TẬP & TRỢ LÝ BOT 3TG)

### 1. Mục tiêu Sprint 4
Sprint 4 đánh dấu bước chuyển mình quan trọng của dự án 3TG Study, phát triển hệ sinh thái Mạng xã hội học tập sinh viên và Trợ lý ảo tương tác nhóm:
1. **Nâng cấp 3TG Messenger toàn màn hình chuẩn Facebook Messenger:**
   - Ứng dụng kỹ thuật **Optimistic UI rendering** phản hồi 0ms độ trễ khi bấm gửi tin nhắn.
   - Khắc phục lỗi video bị dừng hoặc thanh cuộn bị giật nảy khi xem đa phương tiện bằng thuật toán hòa giải DOM `reconcileMessengerThread`.
   - Hỗ trợ đầy đủ tính năng trích dẫn trả lời tin nhắn (`↩️ Quote/Reply`) có banner xem trước và tự cuộn mượt đến tin nhắn gốc.
   - Tích hợp Lightbox phóng to ảnh chất lượng cao, trình phát tin nhắn thoại (Voice Message ghi âm trực tiếp qua `MediaRecorder`), video và tệp tài liệu.
2. **Tích hợp Trợ lý Bot 3TG Native siêu nhẹ vào runtime Node của App:**
   - Xóa bỏ hoàn toàn thư mục `node_modules` cồng kềnh của bot Discord cũ, giải phóng hàng trăm MB bộ nhớ.
   - Xây dựng module `src/bot3tg.js` chạy song song trên cùng runtime của Electron/Node.js, tiêu thụ gần như 0 RAM bổ sung và phản hồi ngay lập tức.
   - Tự động nạp sẵn Bot 3TG vào mọi nhóm học tập mới tạo.
3. **Kho lệnh Media giải trí & Cơ chế Báo sai lệnh thông minh:**
   - Hỗ trợ kho video/ảnh sống động từ Supabase CDN: `!ff` (Free Fire), `!anime`, `!gai`, `!sad`, `!trai`, `!anh`, `!sing` (nhạc Pomodoro), `!troll`.
   - Bổ sung bộ lệnh tiện ích học đường: `!help`, `!ping`, `!uptime`, `!chao`, `!info`, `!bot`, `!clean`, `!ai [câu hỏi]`.
   - Cơ chế bắt lỗi và Báo sai lệnh (`sailenh`): bot không im lặng khi người dùng gõ sai cú pháp hoặc chỉ gõ dấu `!`, mà phản hồi hướng dẫn mở menu lệnh kèm video vui nhộn.
4. **Hệ thống Phân quyền Quản trị Nhóm chuẩn RBAC & Quản lý Bot:**
   - Phân cấp 4 vai trò rõ rệt: `admin` (Trưởng nhóm - Key holder), `deputy` (Phó nhóm), `member` (Thành viên), `bot` (Trợ lý bot).
   - Cho phép Chuyển nhượng quyền Trưởng nhóm, Bổ nhiệm/Hạ cấp Phó nhóm, Kick thành viên vi phạm với cơ chế chống vượt quyền chặt chẽ.
   - Cho phép Trưởng nhóm/Phó nhóm linh hoạt Mời Bot ra ngoài (`!bot out`) hoặc Thêm Bot trở lại (`!bot in`).
5. **Quy trình Kết bạn 2 chiều an toàn & Thời gian hoạt động thực (Heartbeat):**
   - Thiết lập luồng kiểm duyệt 2 chiều (`pending` ➔ `accepted`/`rejected`), bảo vệ quyền riêng tư sinh viên.
   - Cập nhật thời gian hoạt động thực tế qua endpoint `/api/user/heartbeat` định kỳ 40 giây, phân biệt chuẩn xác chấm xanh "Đang hoạt động" và chấm xám "Hoạt động X phút/giờ trước".
6. **Đồng bộ hóa Schema & Di trú toàn diện Cloudflare D1 Remote & SQLite Local Replica:**
   - Di trú toàn bộ các bảng: `chat_groups`, `chat_group_members`, `chat_group_messages`, `direct_messages`, `friendships`.
   - Đảm bảo cơ chế SQLite Local Replica hoạt động trơn tru ngay cả khi rớt mạng hoặc Cloudflare D1 vượt hạn ngạch.

---

### 2. Phân công vai trò thành viên nhóm TONE PINK trong Sprint 4

| STT | Thành viên | Tài khoản GitHub | Vai trò trong Sprint 4 | Nhiệm vụ cụ thể |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Lê Văn An** *(Lead)* | [`@Anniehatani`](https://github.com/Anniehatani) | **Team Lead, Messenger & Architecture** | - Triển khai kỹ thuật Optimistic UI 0ms và thuật toán DOM `reconcileMessengerThread`.<br>- Tái cấu trúc Trợ lý Bot 3TG thành module Native `src/bot3tg.js`.<br>- Thiết kế cơ chế phân quyền Quản trị Nhóm (Chuyển Key, Phó nhóm, Kick thành viên).<br>- Di trú schema các bảng Messenger trên Cloudflare D1 và SQLite Local Replica.<br>- Điều phối tiến độ Sprint 4, quản lý GitHub Issues và hợp nhất mã nguồn. |
| **2** | **Nguyễn Như Quỳnh** | [`@nguyennhuuquynhh07-07`](https://github.com/nguyennhuuquynhh07-07) | **Frontend Lead, Media Bot & UI/UX** | - Xây dựng kho lệnh Media đa dạng (`!ff`, `!anime`, `!gai`, `!sad`, `!trai`, `!anh`, `!sing`).<br>- Thiết kế giao diện Lightbox phóng to ảnh, trình phát Video/Audio và thẻ tệp đính kèm.<br>- Hiện thực hóa luồng kết bạn 2 chiều (`pending` ➔ `accepted`) và quản lý lời mời.<br>- Thiết kế bộ Slide thuyết trình PowerPoint Sprint 4 chuẩn nhận diện Tone Pink. |
| **3** | **Nguyễn Tú** | [`@tus-sud`](https://github.com/tus-sud) | **Real-time Engine, QA Lead & Báo cáo** | - Xây dựng cơ chế Heartbeat định kỳ 40s xác định trạng thái online/offline thực tế.<br>- Lập trình cơ chế xử lý Báo sai lệnh (`sailenh`) khi người dùng gõ lệnh lạ hoặc ký tự `!`.<br>- Thực hiện kiểm thử toàn diện 10 Test Cases cho các tính năng mới trong Sprint 4.<br>- Biên soạn hoàn chỉnh hồ sơ Báo cáo kỹ thuật Sprint 4 Word (`.docx`). |

---

## 📌 PHẦN 2: DANH SÁCH ISSUES SPRINT 4 TRÊN GITHUB

> Toàn bộ 10 Issues của Sprint 4 được tạo, phân công và nghiệm thu trực tiếp trên GitHub repository [`Anniehatani/appstudyAI/issues`](https://github.com/Anniehatani/appstudyAI/issues) (Milestone: `Sprint 4: 3TG Messenger, Trợ lý Bot 3TG & Quản trị nhóm`).

### 📌 Issue #24: Sprint 4 – Tối ưu hóa phản hồi nhắn tin Optimistic UI (0ms delay), xóa thanh gợi ý rườm rà
* **Người phụ trách:** Lê Văn An (`@Anniehatani`)
* **Nhãn (Labels):** `frontend`, `ui/ux`, `enhancement`, `sprint-4`
* **Mục tiêu:** Khắc phục triệt để độ trễ 1-2s khi nhấn gửi tin nhắn trong 3TG Messenger.
* **Các công việc thực hiện:**
  - [x] Áp dụng kỹ thuật Optimistic UI rendering: hiển thị tin nhắn lên giao diện người gửi tức thì (0ms) ngay khi bấm Gửi/Enter.
  - [x] Làm sạch ô nhập liệu và các thanh đính kèm/reply ngay tức khắc.
  - [x] Gửi bất đồng bộ lên máy chủ ở chế độ nền mà không gây nghẽn giao diện.
  - [x] Xóa bỏ hoàn toàn thanh gợi ý `.chat-quick-emojis` để giao diện sạch sẽ, chuyên nghiệp chuẩn Facebook Messenger.
* **Kết quả:** Trải nghiệm nhắn tin mượt mà, phản hồi tức thì 0ms, không còn cảm giác bị trễ.
* **Trạng thái:** ✅ **Closed / Done**

---

### 📌 Issue #25: Sprint 4 – Khắc phục lỗi video bị dừng và chống giật thanh cuộn khi phát đa phương tiện
* **Người phụ trách:** Lê Văn An (`@Anniehatani`)
* **Nhãn (Labels):** `bug`, `frontend`, `ui/ux`, `sprint-4`
* **Mục tiêu:** Sửa lỗi mở video trong nhóm chat được vài giây đầu thì video tự động bị dừng và thanh cuộn bị giật nảy lên.
* **Các công việc thực hiện:**
  - [x] Thay thế cơ chế so sánh chuỗi gán đè `thread.innerHTML` bằng thuật toán hòa giải thông minh `reconcileMessengerThread`.
  - [x] Không can thiệp vào DOM nếu không có tin nhắn mới, giúp video và audio tiếp tục phát liên tục không bị ngắt quãng.
  - [x] Chỉ chèn nối tiếp các tin nhắn mới vào cuối khung chat (`insertAdjacentHTML("beforeend")`).
  - [x] Bổ sung cờ `isPlayingMedia` và thuộc tính `playsinline`, `webkit-playsinline` khóa vị trí cuộn khi người dùng đang thưởng thức nội dung.
* **Kết quả:** Video/audio phát mượt mà từ đầu đến cuối, không bị khựng hay giật thanh cuộn.
* **Trạng thái:** ✅ **Closed / Done**

---

### 📌 Issue #26: Sprint 4 – Tích hợp Trợ lý Bot 3TG Native siêu nhẹ vào runtime Node của App
* **Người phụ trách:** Lê Văn An (`@Anniehatani`)
* **Nhãn (Labels):** `backend`, `feature`, `architecture`, `sprint-4`
* **Mục tiêu:** Tích hợp bot hỗ trợ học tập và giải trí trực tiếp vào ứng dụng, tối ưu hóa kích thước và hiệu năng.
* **Các công việc thực hiện:**
  - [x] Xóa bỏ thư mục `node_modules` cồng kềnh của bot cũ, giải phóng hàng trăm MB dung lượng lưu trữ.
  - [x] Xây dựng engine Native `src/bot3tg.js` chạy chung với Node runtime của ứng dụng.
  - [x] Không tốn thêm tiến trình riêng, tiêu thụ gần như 0 RAM bổ sung, phản hồi tức thời.
  - [x] Tự động nạp Trợ lý Bot 3TG vào mọi nhóm học tập mới tạo.
* **Kết quả:** Bot 3TG hoạt động ổn định, nhẹ nhàng, tự động tương tác giải đáp và giải trí cho nhóm học tập.
* **Trạng thái:** ✅ **Closed / Done**

---

### 📌 Issue #27: Sprint 4 – Kho lệnh Media & Báo sai lệnh thông minh (!ff, !anime, !gai, !sad, !trai, !anh, !sing)
* **Người phụ trách:** Nguyễn Như Quỳnh (`@nguyennhuuquynhh07-07`)
* **Nhãn (Labels):** `feature`, `ai`, `media`, `sprint-4`
* **Mục tiêu:** Cung cấp kho nội dung giải trí và tiện ích đa dạng giúp học viên xả stress và tăng tương tác nhóm.
* **Các công việc thực hiện:**
  - [x] Nạp kho video/ảnh chất lượng cao từ Supabase CDN: `!ff` (Free Fire), `!anime`, `!gai` (gái xinh), `!sad` (nhạc tâm trạng), `!trai` (trai đẹp), `!anh` (ảnh nghệ thuật), `!sing` (gợi ý âm nhạc Pomodoro), `!troll` (meme học đường).
  - [x] Bổ sung bộ lệnh tiện ích: `!help`, `!ping`, `!uptime`, `!chao`, `!info`, `!bot`, `!clean`, `!ai [câu hỏi]`.
  - [x] Xây dựng cơ chế bắt lỗi và Báo sai lệnh (`sailenh`): phản hồi hướng dẫn gõ `!help` kèm video vui nhộn khi người dùng gõ sai lệnh hoặc chỉ gõ dấu `!`.
* **Kết quả:** Học viên tương tác nhóm hào hứng, bot phản hồi nhanh và chính xác 100% các lệnh media.
* **Trạng thái:** ✅ **Closed / Done**

---

### 📌 Issue #28: Sprint 4 – Phân quyền Quản trị Nhóm: Chuyển Key Trưởng nhóm, Phó nhóm, Kick thành viên
* **Người phụ trách:** Lê Văn An (`@Anniehatani`)
* **Nhãn (Labels):** `security`, `backend`, `database`, `sprint-4`
* **Mục tiêu:** Xây dựng hệ thống phân quyền nhóm học tập chặt chẽ theo chuẩn RBAC (`admin`, `deputy`, `member`, `bot`).
* **Các công việc thực hiện:**
  - [x] Chức năng Chuyển Key Trưởng nhóm: nhượng quyền sở hữu nhóm cho thành viên khác, trưởng nhóm cũ trở thành phó nhóm.
  - [x] Chức năng Bổ nhiệm / Hạ cấp Phó nhóm: Trưởng nhóm có quyền phân quyền hoặc thu hồi chức vụ.
  - [x] Chức năng Kick thành viên: Trưởng nhóm và Phó nhóm có thể kick thành viên vi phạm (chống vượt quyền: phó nhóm không thể kick trưởng nhóm hoặc phó nhóm khác).
  - [x] Quản lý Bot 3TG: Cho phép Trưởng/Phó nhóm mời Bot ra ngoài hoặc thêm Bot trở lại nhóm bất kỳ lúc nào.
  - [x] Modal thành viên hiển thị huy hiệu trực quan: 👑 Trưởng nhóm, 🛡️ Phó nhóm, 🤖 Trợ lý Bot, 👤 Thành viên.
* **Kết quả:** Quản lý nhóm học tập khoa học, bảo mật, ngăn chặn phá hoại nhóm.
* **Trạng thái:** ✅ **Closed / Done**

---

### 📌 Issue #29: Sprint 4 – Thời gian hoạt động thực tế (Real-time Active Status) qua Heartbeat định kỳ
* **Người phụ trách:** Nguyễn Tú (`@tus-sud`)
* **Nhãn (Labels):** `backend`, `frontend`, `sprint-4`
* **Mục tiêu:** Khắc phục hoàn toàn lỗi hiển thị 'Đang hoạt động' ảo khi bạn bè không online.
* **Các công việc thực hiện:**
  - [x] Bổ sung trường `last_active_at` trên bảng `profiles`.
  - [x] Xây dựng endpoint `/api/user/heartbeat` đồng bộ trạng thái định kỳ 40 giây.
  - [x] Phân loại chuẩn xác: 'Đang hoạt động' (chấm xanh nếu tương tác dưới 3 phút), 'Hoạt động X phút trước' / 'Hoạt động X giờ trước' (chấm xám).
* **Kết quả:** Trạng thái online của danh sách bạn bè hiển thị chuẩn xác theo thời gian thực.
* **Trạng thái:** ✅ **Closed / Done**

---

### 📌 Issue #30: Sprint 4 – Trả lời trích dẫn tin nhắn (Message Quoting) & Chia sẻ Đa phương tiện
* **Người phụ trách:** Lê Văn An (`@Anniehatani`)
* **Nhãn (Labels):** `frontend`, `feature`, `ui/ux`, `sprint-4`
* **Mục tiêu:** Nâng cấp trải nghiệm nhắn tin chuyên nghiệp với tính năng trích dẫn và đa phương tiện sống động.
* **Các công việc thực hiện:**
  - [x] Nút trả lời nhanh `↩️` trích dẫn nội dung người gửi.
  - [x] Banner xem trước trích dẫn phía trên ô soạn thảo; nhấp vào trích dẫn để tự cuộn mượt đến tin nhắn gốc.
  - [x] Gửi hình ảnh kèm Lightbox xem trước phóng to sắc nét.
  - [x] Trình phát video (MP4/WebM) và trình phát tin nhắn thoại ghi âm trực tiếp qua microphone (`MediaRecorder`).
  - [x] Thẻ tải tệp đính kèm tài liệu học tập kèm hiển thị dung lượng KB/MB.
* **Kết quả:** Khung chat học tập đa phương tiện phong phú, chuyên nghiệp như các ứng dụng chat hàng đầu.
* **Trạng thái:** ✅ **Closed / Done**

---

### 📌 Issue #31: Sprint 4 – Quy trình kết bạn 2 chiều an toàn (Pending -> Accepted) & Chống kết bạn ảo
* **Người phụ trách:** Nguyễn Như Quỳnh (`@nguyennhuuquynhh07-07`)
* **Nhãn (Labels):** `backend`, `security`, `feature`, `sprint-4`
* **Mục tiêu:** Xây dựng luồng kết bạn chuẩn mực, tôn trọng quyền riêng tư của người dùng.
* **Các công việc thực hiện:**
  - [x] Thiết lập luồng kiểm duyệt 2 chiều chặt chẽ: Khi gửi lời mời, trạng thái quan hệ là `pending`.
  - [x] Người nhận có quyền duyệt 'Chấp nhận' hoặc 'Từ chối'.
  - [x] Chỉ khi đối phương đồng ý, quan hệ bạn bè mới chính thức chuyển sang `accepted`.
  - [x] Tách tab trực quan: 'Bạn bè hiện tại', 'Lời mời kết bạn đã nhận', 'Lời mời đã gửi'.
* **Kết quả:** Luồng kết bạn văn minh, không bị spam lời mời và không tạo bạn ảo.
* **Trạng thái:** ✅ **Closed / Done**

---

### 📌 Issue #32: Sprint 4 – Đồng bộ hóa Schema & Di trú toàn diện Cloudflare D1 & SQLite Local Replica
* **Người phụ trách:** Lê Văn An (`@Anniehatani`)
* **Nhãn (Labels):** `database`, `backend`, `sprint-4`
* **Mục tiêu:** Khắc phục triệt để lỗi `SQLITE_ERROR: no such table: chat_groups` trên Cloudflare D1 Remote Endpoint.
* **Các công việc thực hiện:**
  - [x] Di trú thành công cấu trúc các bảng: `chat_groups`, `chat_group_members`, `chat_group_messages`, `direct_messages`, `friendships` trên Cloudflare D1.
  - [x] Tự động nạp Bot 3TG vào toàn bộ các nhóm hiện có trong cơ sở dữ liệu.
  - [x] Đảm bảo cơ chế SQLite Local Replica hoạt động đồng bộ 100% với Remote D1.
* **Kết quả:** Database đồng nhất, không phát sinh lỗi thiếu bảng khi thao tác nhắn tin và quản lý nhóm.
* **Trạng thái:** ✅ **Closed / Done**

---

### 📌 Issue #33: Sprint 4 – Hoàn thiện Slide thuyết trình PowerPoint và Báo cáo tổng kết đồ án Word
* **Người phụ trách:** Nhóm TONE PINK
* **Nhãn (Labels):** `documentation`, `sprint-4`
* **Mục tiêu:** Tổng hợp tài liệu nghiệm thu Sprint 4 đầy đủ và chuyên nghiệp theo chuẩn môn Công nghệ phần mềm.
* **Các công việc thực hiện:**
  - [x] Biên soạn Báo cáo Word: `Bao_Cao_Sprint_4_Do_An_3TG_Study_TONE_PINK.docx`.
  - [x] Thiết kế Slide thuyết trình: `Slide_Thuyet_Trinh_Sprint_4_TONE_PINK_MoiNhat.pptx` chuẩn Tone Pink 16:9.
  - [x] Xuất bản danh mục GitHub Issues Markdown: `GitHub_Issues_Sprint_4.md` và `Sprint_4.md`.
* **Kết quả:** Bộ tài liệu hoàn chỉnh, chỉn chu, sẵn sàng báo cáo trước giảng viên ThS. Vân Anh.
* **Trạng thái:** ✅ **Closed / Done**

---

## 📌 PHẦN 3: BẢNG TỔNG KẾT KẾT QUẢ KIỂM THỬ SPRINT 4

| STT | Kịch bản kiểm thử (Test Case) | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **TC01** | Nhấn gửi tin nhắn văn bản trong nhóm chat | Tin nhắn xuất hiện tức thì (0ms) trên khung chat nhờ Optimistic UI | Tin nhắn hiện ngay, input xóa sạch, đồng bộ nền lên server | **PASS** |
| **TC02** | Xem video trong nhóm chat khi có người nhắn tin mới | Video tiếp tục phát bình thường, thanh cuộn không bị nhảy giật | Video phát liên tục không ngắt quãng nhờ DOM reconciliation | **PASS** |
| **TC03** | Gọi lệnh Media Bot 3TG (`!ff`, `!anime`, `!gai`, `!sad`) | Bot phản hồi video/ảnh tương ứng từ Supabase CDN | Nhận diện đúng alias, gửi media kèm caption sinh động | **PASS** |
| **TC04** | Nhập lệnh sai cú pháp (`!xyz`) hoặc chỉ gõ ký tự `!` | Bot báo sai lệnh và hướng dẫn gõ `!help` kèm video vui nhộn | Bot phản hồi thông minh, không bị im lặng | **PASS** |
| **TC05** | Trưởng nhóm chuyển quyền sở hữu (Chuyển Key) | Thành viên mới trở thành Admin, Trưởng nhóm cũ thành Phó nhóm | Quyền sở hữu chuyển giao thành công, cập nhật huy hiệu | **PASS** |
| **TC06** | Phó nhóm cố tình kick Trưởng nhóm | Hệ thống từ chối hành động và báo lỗi không đủ quyền hạn | Cơ chế chống vượt quyền hoạt động chính xác, chặn kick admin | **PASS** |
| **TC07** | Trưởng/Phó nhóm mời Bot ra ngoài hoặc thêm lại | Bot rời nhóm hoặc gia nhập lại nhóm kèm thông báo hệ thống | Bot được thêm/xóa tức thời qua API `POST /api/groups/:id/bot` | **PASS** |
| **TC08** | Người dùng tắt app hoặc không thao tác quá 3 phút | Trạng thái chuyển từ 'Đang hoạt động' sang 'Hoạt động X phút trước' | Heartbeat tính toán chính xác thời gian ngưng tương tác | **PASS** |
| **TC09** | Nhấn nút trả lời `↩️` trích dẫn tin nhắn cũ | Khung chat hiển thị banner trích dẫn; click vào tự cuộn đến tin gốc | Banner trích dẫn rõ ràng, cuộn mượt `scrollIntoView` chuẩn | **PASS** |
| **TC10** | Gửi lời mời kết bạn và đối phương nhấn Chấp nhận | Quan hệ bạn bè chuyển từ `pending` sang `accepted` | Danh sách bạn bè cập nhật cả 2 phía, mở khóa khung chat 1-1 | **PASS** |

---

## 📌 PHẦN 4: KẾT LUẬN & ĐÁNH GIÁ SPRINT 4

1. **Về tiến độ & mục tiêu:** Nhóm TONE PINK đã hoàn thành **100% các công việc trong Sprint 4**. Hệ sinh thái mạng xã hội 3TG Messenger và Trợ lý ảo Bot 3TG Native đã hoạt động trơn tru, đem lại trải nghiệm học nhóm gắn kết, thú vị và giàu tính tương tác cho sinh viên.
2. **Về kỹ thuật & hiệu năng:**
   - Việc loại bỏ `node_modules` của bot Discord cũ và chuyển sang module Native giúp ứng dụng nhẹ hơn, giảm hàng trăm MB bộ nhớ.
   - Thuật toán hòa giải DOM `reconcileMessengerThread` giải quyết dứt điểm các lỗi giật cuộn và dừng video khi xem đa phương tiện.
3. **Mức độ đóng góp của các thành viên trong Sprint 4:**
   - **Lê Văn An (Leader):** 100% — Chủ trì kiến trúc 3TG Messenger, Optimistic UI, DOM reconciliation, Bot 3TG Native, RBAC Quản trị nhóm và Cloudflare D1 migration.
   - **Nguyễn Như Quỳnh:** 100% — Chủ trì kho media bot, thiết kế giao diện đa phương tiện (Lightbox, Voice, File), luồng kết bạn 2 chiều và Slide thuyết trình Sprint 4.
   - **Nguyễn Tú:** 100% — Chủ trì engine Heartbeat trạng thái thực, xử lý báo sai lệnh bot, kiểm thử QA toàn diện 10 Test Cases và biên soạn Báo cáo kỹ thuật Word Sprint 4.

*Hà Nội, ngày 12 tháng 11 năm 2026*  
**Đại diện nhóm TONE PINK — Nhóm trưởng: Lê Văn An**
