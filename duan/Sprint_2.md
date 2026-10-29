# 🚀 BÁO CÁO TỔNG KẾT SPRINT 2 — DỰ ÁN 3TG (LUMI STUDY AI)
**Môn học:** Công nghệ phần mềm | **Giảng viên hướng dẫn:** ThS. Vân Anh  
**Nhóm thực hiện:** TONE PINK | **Repository:** [Anniehatani/appstudyAI](https://github.com/Anniehatani/appstudyAI)

---

## 📌 PHẦN 1: TỔNG QUAN SPRINT 2

### 1. Mục tiêu Sprint 2
* **Tích hợp cổng trường IU CMCU (`iu.cmcu.edu.vn`):** Cơ chế đăng nhập 1-Click qua tài khoản Microsoft Office 365 nhà trường cấp, tự động bóc tách bảng điểm toàn khóa, lịch học 6 tuần và thông tin sinh viên.
* **Tính toán học thuật & Cố vấn AI:** Xây dựng công cụ tính GPA thang 10, thang 4 theo tín chỉ và tích hợp Trợ lý AI DeepSeek phân tích bảng điểm, định hướng mục tiêu Target GPA cải thiện học tập.
* **Mạng xã hội học tập sinh viên:** Xây dựng tính năng tìm kiếm bạn học, kết bạn, xem trang cá nhân (Public Profile) và khung chat trò chuyện 1-1 realtime giữa sinh viên.
* **Nâng cấp giao diện VIP phong cách Discord Nitro:** Hoàn thiện 4 tab Shop (Vật phẩm, Mascot, Khung Avatar động, Hình nền Profile R2) và Chế độ tối Midnight Velvet Dark Mode bảo vệ mắt ban đêm.

---

### 2. Phân công vai trò thành viên nhóm TONE PINK trong Sprint 2

| STT | Thành viên | Tài khoản GitHub | Vai trò trong nhóm | Nhiệm vụ chính trong Sprint 2 |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Lê Văn An** *(Lead)* | [`@Anniehatani`](https://github.com/Anniehatani) | **Nhóm trưởng, AI & Cổng trường Lead** | - Xây dựng cơ chế đăng nhập 1-Click cổng trường IU qua Microsoft 365.<br>- Phát triển bộ cào và bóc tách bảng điểm, thời khóa biểu sinh viên.<br>- Tích hợp Trợ lý AI DeepSeek phân tích GPA và Target GPA.<br>- Quản lý tiến độ Sprint 2, review code và hỗ trợ các thành viên. |
| **2** | **Nguyễn Như Quỳnh** | [`@nguyennhuuquynhh07-07`](https://github.com/nguyennhuuquynhh07-07) | **Frontend & Giao diện, Hiệu ứng** | - Thiết kế hệ thống Khung Avatar động và hiệu ứng Discord Nitro.<br>- Xây dựng giao diện Khung chat bạn bè 1-1 trực quan, sinh động.<br>- Nâng cấp Chế độ tối Midnight Velvet Dark Mode đồng bộ toàn app.<br>- Đảm bảo trải nghiệm UI/UX mượt mà, thân thiện với sinh viên. |
| **3** | **Nguyễn Tú** | [`@tus-sud`](https://github.com/tus-sud) | **Database, Mạng xã hội & QA** | - Thiết kế CSDL và API Mạng xã hội: Kết bạn, danh sách bạn bè, tin nhắn.<br>- Xây dựng thuật toán tính GPA thang 10/thang 4, lọc môn cải thiện.<br>- Kiểm thử luồng tích hợp dữ liệu cổng trường IU và chat realtime.<br>- Tổng hợp biên bản nghiệm thu kỹ thuật Sprint 2. |

---

## 📌 PHẦN 2: DANH SÁCH ISSUES SPRINT 2 TRÊN GITHUB

> Toàn bộ 8 Issue tính năng của Sprint 2 được quản lý trực tiếp tại [`Anniehatani/appstudyAI/issues`](https://github.com/Anniehatani/appstudyAI/issues) (thuộc Milestone: `Sprint 2: Cổng trường IU, Trợ lý AI & Mạng xã hội`).

### Issue #13: Sprint 2 – Đăng nhập 1-Click cổng trường IU qua Microsoft 365
* **Người phụ trách:** `@Anniehatani`
* **Nhãn (Labels):** `backend`, `integration`, `sprint-2`
* **Mục tiêu:** Tích hợp đăng nhập cổng đào tạo trường Đại học IU CMCU (`iu.cmcu.edu.vn`) bằng tài khoản Office 365 trường cấp chỉ với 1 cú click chuột.
* **Các công việc thực hiện:**
  - [x] Mở popup đăng nhập Microsoft trường an toàn trong ứng dụng.
  - [x] Tự động bắt cookie phiên `ASP.NET_SessionId` và token sinh viên từ hệ thống trường.
  - [x] Tự động đóng popup sau khi đăng nhập thành công.
  - [x] Loại bỏ hoàn toàn việc phải copy cookie hay nhập mật khẩu thủ công.
* **Kết quả:** Sinh viên bấm 1 nút là kết nối xong với cổng trường cực kỳ tiện lợi và bảo mật.

---

### Issue #14: Sprint 2 – Cào và bóc tách bảng điểm, thời khóa biểu từ cổng IU
* **Người phụ trách:** `@Anniehatani`
* **Nhãn (Labels):** `backend`, `database`, `integration`, `sprint-2`
* **Mục tiêu:** Tự động lấy dữ liệu học tập thật từ cổng trường IU về app để phục vụ theo dõi và phân tích.
* **Các công việc thực hiện:**
  - [x] Cào dữ liệu bảng điểm toàn khóa: Điểm chuyên cần, giữa kỳ, cuối kỳ, điểm chữ và điểm hệ 4.
  - [x] Cào thời khóa biểu lịch học 6 tuần (2 tuần trước đến 4 tuần tới) để biết các môn đang học.
  - [x] Cào thông tin sinh viên: Họ tên, mã sinh viên, ngành học và lớp sinh hoạt.
  - [x] Lưu trữ dữ liệu bảng điểm đồng bộ vào Cloudflare D1 và Local SQLite.
* **Kết quả:** Sinh viên có ngay bảng điểm và lịch học cá nhân trên app chỉ sau vài giây đồng bộ.

---

### Issue #15: Sprint 2 – Tính toán điểm GPA thang 10, thang 4 và lọc môn cải thiện
* **Người phụ trách:** `@tus-sud`
* **Nhãn (Labels):** `backend`, `sprint-2`
* **Mục tiêu:** Xây dựng thuật toán tính điểm trung bình tích lũy GPA chuẩn quy chế tín chỉ đại học và phát hiện môn cần cải thiện điểm.
* **Các công việc thực hiện:**
  - [x] Tính GPA thang 10 và GPA thang 4 theo trọng số tín chỉ của từng môn học.
  - [x] Tự động lọc các môn học lại, cập nhật điểm mới nhất (chuẩn 28 tín chỉ đạt GPA 2.73 / 6.99).
  - [x] Phân loại học lực: Xuất sắc, Giỏi, Khá, Trung bình.
  - [x] Gợi ý danh sách các môn điểm C, D hoặc F cần học cải thiện để nâng học bổng.
* **Kết quả:** Điểm số tính toán chính xác 100% khớp với bảng điểm cổng trường, giúp sinh viên nắm rõ năng lực.

---

### Issue #16: Sprint 2 – Trợ lý AI DeepSeek phân tích bảng điểm và lập kế hoạch Target GPA
* **Người phụ trách:** `@Anniehatani`
* **Nhãn (Labels):** `ai`, `backend`, `sprint-2`
* **Mục tiêu:** Tích hợp trí tuệ nhân tạo DeepSeek làm gia sư ảo phân tích thế mạnh, điểm yếu và gợi ý mục tiêu học tập.
* **Các công việc thực hiện:**
  - [x] Kết nối API mô hình DeepSeek AI xử lý ngôn ngữ tự nhiên.
  - [x] Gửi prompt phân tích bảng điểm: Môn nào điểm cao, môn nào bị kéo điểm.
  - [x] Tính toán công thức Target GPA: Để đạt GPA 3.2 hay 3.6 thì kỳ tới cần học bao nhiêu tín chỉ và đạt điểm bao nhiêu.
  - [x] AI tạo lộ trình ôn tập cụ thể cho từng môn sắp thi.
* **Kết quả:** Trợ lý ảo phản hồi thông minh, đưa ra lời khuyên học tập sát sườn và hữu ích cho sinh viên.

---

### Issue #17: Sprint 2 – Hệ thống kết bạn và quản lý danh sách bạn học
* **Người phụ trách:** `@tus-sud`
* **Nhãn (Labels):** `database`, `backend`, `sprint-2`
* **Mục tiêu:** Xây dựng mạng xã hội nội bộ giúp sinh viên tìm kiếm và kết nối bạn bè cùng trường.
* **Các công việc thực hiện:**
  - [x] Tìm kiếm bạn bè theo mã sinh viên, tên hoặc email.
  - [x] Gửi lời mời kết bạn, chấp nhận hoặc hủy kết bạn.
  - [x] Danh sách bạn bè trực quan kèm trạng thái hoạt động online/offline.
  - [x] Xem trang cá nhân của bạn bè: Cấp độ, điểm XP, chuỗi Streak và avatar.
* **Kết quả:** Sinh viên dễ dàng kết nối, theo dõi tiến độ học cùng bạn bè trong trường.

---

### Issue #18: Sprint 2 – Khung chat trò chuyện 1-1 realtime giữa bạn bè
* **Người phụ trách:** `@tus-sud`, `@nguyennhuuquynhh07-07`
* **Nhãn (Labels):** `backend`, `frontend`, `sprint-2`
* **Mục tiêu:** Xây dựng phòng chat trực tiếp 1-1 để sinh viên thảo luận bài tập và trao đổi tài liệu học tập.
* **Các công việc thực hiện:**
  - [x] Thiết kế khung chat hiện đại, hỗ trợ cuộn tin nhắn mượt mà.
  - [x] API gửi và nhận tin nhắn tức thì giữa 2 người dùng.
  - [x] Đánh dấu trạng thái tin nhắn đã gửi, đã nhận và thời gian gửi.
  - [x] Tích hợp bộ icon cảm xúc sinh động khi nhắn tin.
* **Kết quả:** Sinh viên có thể trò chuyện, trao đổi bài học ngay trong ứng dụng mà không cần qua ứng dụng khác.

---

### Issue #19: Sprint 2 – Khung avatar động và hiệu ứng hồ sơ phong cách Discord Nitro
* **Người phụ trách:** `@nguyennhuuquynhh07-07`
* **Nhãn (Labels):** `frontend`, `ui/ux`, `sprint-2`
* **Mục tiêu:** Thiết kế hệ thống trang trí hồ sơ người dùng cao cấp với hiệu ứng chuyển động lấp lánh như Discord Nitro.
* **Các công việc thực hiện:**
  - [x] Thiết kế 6 bộ khung avatar động: Cyberpunk, Hoa anh đào Neon, Hào quang thiên thần, Lửa rực cháy...
  - [x] Hiệu ứng phát sáng Glow và viền Gradient chuyển động mượt mà bằng CSS3 Keyframes.
  - [x] Tích hợp vào Cửa hàng Shop Nitro: Người dùng đổi bằng đá quý kiếm được từ việc học chăm chỉ.
  - [x] Áp dụng khung avatar đồng bộ trên Bảng xếp hạng, Khung chat và Trang cá nhân.
* **Kết quả:** Tăng tính cá nhân hóa và tạo động lực to lớn cho sinh viên cày điểm XP và đá quý.

---

### Issue #20: Sprint 2 – Hình nền Profile lưu Cloudflare R2 và chế độ tối Midnight Velvet
* **Người phụ trách:** `@nguyennhuuquynhh07-07`
* **Nhãn (Labels):** `frontend`, `ui/ux`, `sprint-2`
* **Mục tiêu:** Mở rộng kho hình nền trang cá nhân chất lượng cao trên Cloudflare R2 và hoàn thiện Chế độ tối Midnight Velvet bảo vệ mắt ban đêm.
* **Các công việc thực hiện:**
  - [x] Lưu trữ và phân phối 14 hình nền Anime / Aesthetic trên Cloudflare R2 Bucket tốc độ cao.
  - [x] Xây dựng bảng màu Chế độ tối Midnight Velvet (`#12111a`) sang trọng, tương phản cao, dịu mắt.
  - [x] Đồng bộ Dark Mode trên toàn bộ các màn hình: Cây bài học, Bảng điểm IU, Khung Chat, Shop và Sổ tay.
  - [x] Nút bật tắt chế độ sáng/tối mượt mà và ghi nhớ lựa chọn của người dùng.
* **Kết quả:** Giao diện đêm đẹp mắt, học tập ban đêm không bị mỏi mắt hay chói sáng.

---

## 📌 PHẦN 3: KẾT QUẢ KANBAN SPRINT 2

Toàn bộ 8 Issue tính năng của Sprint 2 đã được hoàn thành nghiệm thu trên bảng Kanban GitHub Projects:

| Cột Kanban | Mã Issue | Tên công việc Sprint 2 | Người phụ trách | Trạng thái |
| :---: | :---: | :--- | :---: | :---: |
| **Done** | **#13** | Đăng nhập 1-Click cổng trường IU qua Microsoft 365 | `@Anniehatani` | Đã nghiệm thu |
| **Done** | **#14** | Cào và bóc tách bảng điểm, thời khóa biểu từ cổng IU | `@Anniehatani` | Đã nghiệm thu |
| **Done** | **#15** | Tính toán điểm GPA thang 10, thang 4 và lọc môn | `@tus-sud` | Đã nghiệm thu |
| **Done** | **#16** | Trợ lý AI DeepSeek phân tích GPA & Target GPA | `@Anniehatani` | Đã nghiệm thu |
| **Done** | **#17** | Hệ thống kết bạn và quản lý danh sách bạn học | `@tus-sud` | Đã nghiệm thu |
| **Done** | **#18** | Khung chat trò chuyện 1-1 realtime giữa bạn bè | `@tus-sud`, `@nguyennhuuquynhh07-07` | Đã nghiệm thu |
| **Done** | **#19** | Khung avatar động và hiệu ứng Discord Nitro | `@nguyennhuuquynhh07-07` | Đã nghiệm thu |
| **Done** | **#20** | Hình nền Profile R2 và chế độ tối Midnight Velvet | `@nguyennhuuquynhh07-07` | Đã nghiệm thu |

---

## 📌 PHẦN 4: TỔNG KẾT VÀ BÀN GIAO SANG SPRINT 3

Sprint 2 đã hoàn thành xuất sắc toàn bộ các tính năng đột phá: Cổng trường IU CMCU, Trợ lý AI DeepSeek, Mạng xã hội kết bạn & Chat 1-1, Khung Avatar Nitro VIP và Dark Mode. 

Toàn bộ công việc về **Tối ưu hóa hiệu năng, Đóng gói Desktop Electron v9.9.9, Kiểm thử hệ thống E2E, Tẩy sạch bảo mật dữ liệu và Chuẩn bị hồ sơ báo cáo đồ án** được tách biệt chuyên môn sang **Sprint 3 (Sprint Tổng kết & Đóng gói phát hành)**.
