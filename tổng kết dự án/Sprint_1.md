# 🌸 BÁO CÁO TỔNG KẾT SPRINT 1 — DỰ ÁN 3TG (3TG STUDY AI)
**Môn học:** Công nghệ phần mềm | **Giảng viên hướng dẫn:** ThS. Vân Anh  
**Nhóm thực hiện:** TONE PINK | **Repository:** [Anniehatani/appstudyAI](https://github.com/Anniehatani/appstudyAI)

---

## 📌 PHẦN 1: TỔNG QUAN SPRINT 1

### 1. Mục tiêu Sprint 1
* Khởi tạo kiến trúc dự án Fullstack Serverless trên nền tảng Cloudflare (Worker + D1 Database + R2 Storage).
* Thiết kế mô hình cơ sở dữ liệu quan hệ đạt chuẩn 3NF với 10 môn học, 106 chương, hơn 4.000 bài học và gần 30.000 câu hỏi trắc nghiệm.
* Xây dựng giao diện học tập cốt lõi phong cách Duolingo: Lộ trình bài học uốn lượn, trắc nghiệm tương tác chấm điểm tức thì, âm thanh sinh động.
* Tích hợp hệ thống Game hóa (Gamification): Trái tim, điểm thưởng XP, Đá quý tân thủ, Chuỗi ngày học Streak, Đóng băng chuỗi Streak Freeze, Bảng xếp hạng tuần và Mascot Thỏ Bảy Màu động viên học tập.

---

### 2. Phân công vai trò thành viên nhóm TONE PINK

| STT | Thành viên | Tài khoản GitHub | Vai trò trong nhóm | Nhiệm vụ chính trong Sprint 1 |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Lê Văn An** *(Lead)* | [`@Anniehatani`](https://github.com/Anniehatani) | **Nhóm trưởng, Backend & Kiến trúc** | - Khởi tạo dự án, thiết lập Cloudflare Workers & D1 Database.<br>- Xây dựng hệ thống API lộ trình bài học và nộp bài trắc nghiệm.<br>- Xây dựng tính năng đăng ký, đăng nhập tài khoản và lưu phiên học tập.<br>- Quản lý tiến độ nhóm, phân chia công việc trên GitHub và review code. |
| **2** | **Nguyễn Như Quỳnh** | [`@nguyennhuuquynhh07-07`](https://github.com/nguyennhuuquynhh07-07) | **Frontend & Giao diện, Mascot** | - Thiết kế giao diện cây bài học Duolingo Path và màn hình làm trắc nghiệm.<br>- Tích hợp hiệu ứng âm thanh đúng/sai/hoàn thành sống động.<br>- Vẽ và lập trình Mascot Thỏ Bảy Màu với các biểu cảm động.<br>- Thiết kế giao diện Cửa hàng vật phẩm và Bảng xếp hạng tuần. |
| **3** | **Nguyễn Tú** | [`@tus-sud`](https://github.com/tus-sud) | **Database, Logic Game hóa & QA** | - Thiết kế mô hình CSDL quan hệ chuẩn 3NF trên Cloudflare D1.<br>- Lập trình logic Trái tim năng lượng, điểm kinh nghiệm XP và Đá quý.<br>- Xây dựng thuật toán chuỗi ngày học Streak và Đóng băng chuỗi.<br>- Kiểm thử toàn diện các chức năng và hoàn thành báo cáo Sprint 1. |

---

## 📌 PHẦN 2: DANH SÁCH ISSUES SPRINT 1 TRÊN GITHUB

> Tất cả các Issue của Sprint 1 đã được tạo và hoàn thành trực tiếp trên GitHub repository [`Anniehatani/appstudyAI/issues`](https://github.com/Anniehatani/appstudyAI/issues).

### 🏷️ 1. Các Issue phân công vai trò thành viên:
* **Issue #1:** `Lê Văn An – Nhóm trưởng, Fullstack và Tích hợp AI / Cổng trường`
  * **Người phụ trách:** `@Anniehatani`
  * **Nhãn (Labels):** `backend`, `ai`, `desktop`, `sprint-1`, `sprint-2`, `sprint-3`
  * **Trạng thái:** Closed (Đã hoàn thành)
* **Issue #2:** `Nguyễn Như Quỳnh – Frontend, Thiết kế giao diện và Mascot Thỏ Bảy Màu`
  * **Người phụ trách:** `@nguyennhuuquynhh07-07`
  * **Nhãn (Labels):** `frontend`, `ui/ux`, `documentation`, `sprint-1`, `sprint-2`, `sprint-3`
  * **Trạng thái:** Closed (Đã hoàn thành)
* **Issue #3:** `Nguyễn Tú – Database, Mạng xã hội kết bạn và Kiểm thử QA`
  * **Người phụ trách:** `@tus-sud`
  * **Nhãn (Labels):** `database`, `qa`, `bug`, `sprint-1`, `sprint-2`, `sprint-3`
  * **Trạng thái:** Closed (Đã hoàn thành)

---

### 🚀 2. Các Issue tính năng cốt lõi Sprint 1:

#### Issue #4: Sprint 1 – Thiết kế CSDL môn học và câu hỏi trắc nghiệm Cloudflare D1
* **Người phụ trách:** `@tus-sud`
* **Nhãn (Labels):** `database`, `backend`, `sprint-1`
* **Mục tiêu:** Xây dựng mô hình cơ sở dữ liệu quan hệ chuẩn hóa 3NF trên Cloudflare D1 cho 10 môn học, hơn 4.000 bài học và gần 30.000 câu hỏi trắc nghiệm.
* **Các công việc thực hiện:**
  - [x] Thiết kế ERD các bảng môn học, chương, bài học và câu hỏi.
  - [x] Tạo bảng thông tin người dùng, tiến độ học tập và vật phẩm.
  - [x] Nạp dữ liệu câu hỏi mẫu cho 10 môn công nghệ thông tin.
  - [x] Đánh chỉ mục (Index) tối ưu hóa tốc độ truy vấn bài học.
* **Kết quả:** CSDL hoạt động ổn định, truy vấn bài học và câu hỏi trắc nghiệm dưới 50ms.

#### Issue #5: Sprint 1 – Xây dựng API lộ trình học tập và nộp bài trắc nghiệm
* **Người phụ trách:** `@Anniehatani`
* **Nhãn (Labels):** `backend`, `sprint-1`
* **Mục tiêu:** Phát triển hệ thống API Backend trên Cloudflare Worker để lấy danh sách bài học và chấm điểm trắc nghiệm.
* **Các công việc thực hiện:**
  - [x] Viết API lấy danh sách môn học và chi tiết các chương bài học.
  - [x] Viết API kiểm tra đáp án từng câu hỏi và trả về lời giải thích.
  - [x] Viết API chấm điểm hoàn thành bài học và ghi nhận tiến độ.
  - [x] Xử lý mở khóa bài học tiếp theo theo thứ tự.
* **Kết quả:** Học viên làm bài trắc nghiệm và nhận phản hồi đúng/sai tức thì.

#### Issue #6: Sprint 1 – Giao diện lộ trình bài học uốn lượn và màn hình làm bài
* **Người phụ trách:** `@nguyennhuuquynhh07-07`
* **Nhãn (Labels):** `frontend`, `ui/ux`, `sprint-1`
* **Mục tiêu:** Thiết kế giao diện cây bài học phong cách Duolingo với các nút tròn 3D và màn hình trắc nghiệm sinh động.
* **Các công việc thực hiện:**
  - [x] Thiết kế đường đi bài học uốn lượn có hiệu ứng mở khóa theo cấp độ.
  - [x] Xây dựng màn hình làm trắc nghiệm với thanh tiến trình hiển thị phần trăm.
  - [x] Thêm hiệu ứng âm thanh sống động khi chọn đúng, chọn sai và hoàn thành bài.
  - [x] Tối ưu hiển thị tương thích trên cả máy tính và điện thoại.
* **Kết quả:** Giao diện học tập bắt mắt, tạo cảm giác như đang chơi game học tập.

#### Issue #7: Sprint 1 – Hệ thống Trái tim, điểm thưởng XP và Đá quý
* **Người phụ trách:** `@tus-sud`
* **Nhãn (Labels):** `backend`, `frontend`, `sprint-1`
* **Mục tiêu:** Xây dựng cơ chế thưởng phạt trong học tập với Trái tim năng lượng (tối đa 5 tim), điểm kinh nghiệm XP và Đá quý tân thủ.
* **Các công việc thực hiện:**
  - [x] Cấp 5 tim và 50 Đá quý chào mừng khi tạo tài khoản mới.
  - [x] Trừ 1 tim khi trả lời sai; khóa học bài khi hết tim để người học nghỉ ngơi hoặc mua tim.
  - [x] Cộng điểm kinh nghiệm XP dựa trên số câu trả lời chính xác.
  - [x] Cập nhật số liệu hiển thị tức thời trên thanh trạng thái Topbar.
* **Kết quả:** Tạo động lực để người học cẩn thận hơn khi làm bài trắc nghiệm.

#### Issue #8: Sprint 1 – Chuỗi ngày học liên tục và vật phẩm Đóng băng chuỗi
* **Người phụ trách:** `@tus-sud`
* **Nhãn (Labels):** `backend`, `sprint-1`
* **Mục tiêu:** Tạo thói quen học tập đều đặn mỗi ngày bằng cơ chế chuỗi ngày học Streak (theo giờ Việt Nam UTC+7).
* **Các công việc thực hiện:**
  - [x] Thuật toán kiểm tra ngày học: Học tiếp hôm sau tăng Streak lên 1 ngày.
  - [x] Tự động dùng vật phẩm Đóng băng chuỗi (Streak Freeze) nếu học viên lỡ quên học 1 ngày.
  - [x] Reset chuỗi về ngày 1 nếu nghỉ học mà không có vật phẩm bảo vệ.
  - [x] Hiển thị ngọn lửa Streak rực sáng trên giao diện.
* **Kết quả:** Giúp người học có thói quen vào app ôn bài ít nhất 1 bài mỗi ngày.

#### Issue #9: Sprint 1 – Tích hợp Mascot Thỏ Bảy Màu tương tác động viên học tập
* **Người phụ trách:** `@nguyennhuuquynhh07-07`
* **Nhãn (Labels):** `frontend`, `ui/ux`, `sprint-1`
* **Mục tiêu:** Tạo điểm nhấn vui nhộn cho ứng dụng với nhân vật Thỏ Bảy Màu đồng hành và cổ vũ người học.
* **Các công việc thực hiện:**
  - [x] Vẽ Mascot Thỏ Bảy Màu bằng SVG và hiệu ứng chuyển động CSS animation.
  - [x] Thiết lập các trạng thái cảm xúc: vẫy tay chào, nhảy mừng khi làm đúng, ôm mặt khóc khi làm sai.
  - [x] Thêm bong bóng thoại phát ra các câu nói hài hước khi click vào Thỏ.
* **Kết quả:** Nhân vật Mascot gần gũi, giúp việc học bớt căng thẳng và thú vị hơn.

#### Issue #10: Sprint 1 – Cửa hàng vật phẩm và Bảng xếp hạng tuần
* **Người phụ trách:** `@nguyennhuuquynhh07-07`
* **Nhãn (Labels):** `frontend`, `backend`, `sprint-1`
* **Mục tiêu:** Xây dựng Cửa hàng dùng Đá quý mua vật phẩm và Bảng xếp hạng thi đua điểm số hàng tuần giữa các bạn học.
* **Các công việc thực hiện:**
  - [x] Xây dựng tab Cửa hàng: Bán Hồi máu tim và Đóng băng chuỗi bảo vệ Streak.
  - [x] Viết API mua đồ, trừ đá quý và cộng vật phẩm vào túi đồ người dùng.
  - [x] Xây dựng tab Bảng xếp hạng: Xếp thứ hạng người học theo điểm XP trong tuần.
  - [x] Gắn huy hiệu vàng, bạc, đồng cho top 3 học viên dẫn đầu.
* **Kết quả:** Tạo môi trường thi đua học tập tích cực giữa các thành viên.

#### Issue #11: Sprint 1 – Đăng ký, đăng nhập tài khoản và lưu phiên học tập
* **Người phụ trách:** `@Anniehatani`
* **Nhãn (Labels):** `backend`, `sprint-1`
* **Mục tiêu:** Xây dựng tính năng đăng ký, đăng nhập tài khoản an toàn và duy trì trạng thái đăng nhập qua Cookie.
* **Các công việc thực hiện:**
  - [x] Form đăng ký tài khoản mới kèm họ tên và mật khẩu.
  - [x] Mã hóa mật khẩu an toàn với thuật toán SHA-256 kèm chuỗi Salt bí mật.
  - [x] Form đăng nhập và cấp cookie phiên làm việc trên trình duyệt.
  - [x] Tự động kiểm tra phiên và tải thông tin người học khi mở lại app.
* **Kết quả:** Người học có tài khoản riêng, dữ liệu điểm số và tiến độ được lưu trữ an toàn.

#### Issue #12: Sprint 1 – Kiểm thử chức năng và hoàn thiện báo cáo Sprint 1
* **Người phụ trách:** `@tus-sud`
* **Nhãn (Labels):** `backend`, `frontend`, `sprint-1`
* **Mục tiêu:** Kiểm tra toàn bộ các tính năng của Sprint 1, sửa lỗi phát sinh và hoàn thành hồ sơ báo cáo giai đoạn 1.
* **Các công việc thực hiện:**
  - [x] Kiểm thử toàn bộ quy trình: Đăng ký -> Học bài -> Trừ/Cộng tim -> Mua đồ -> Xếp hạng.
  - [x] Kiểm tra độ tương thích trên các trình duyệt Chrome, Edge, Cốc Cốc.
  - [x] Soạn thảo báo cáo tiến độ và slide thuyết trình Sprint 1 nộp cho giảng viên.
* **Kết quả:** Sprint 1 hoàn thành 100% mục tiêu đề ra, hệ thống chạy trơn tru không lỗi.

---

## 📌 PHẦN 3: KẾT QUẢ KANBAN SPRINT 1

Toàn bộ 12 Issue của Sprint 1 đều đã được nghiệm thu và chuyển sang cột **Done (Hoàn thành)** trên bảng GitHub Projects của nhóm:

| Cột Kanban | Danh sách Issues Sprint 1 | Người phụ trách | Kết quả |
| :--- | :--- | :---: | :---: |
| **Done** | #1: Lê Văn An – Nhóm trưởng, Fullstack và Tích hợp | `@Anniehatani` | Hoàn thành |
| **Done** | #2: Nguyễn Như Quỳnh – Frontend và Mascot Thỏ | `@nguyennhuuquynhh07-07` | Hoàn thành |
| **Done** | #3: Nguyễn Tú – Database và Kiểm thử QA | `@tus-sud` | Hoàn thành |
| **Done** | #4: Thiết kế CSDL môn học và câu hỏi trắc nghiệm | `@tus-sud` | Hoàn thành |
| **Done** | #5: API lộ trình học tập và nộp bài trắc nghiệm | `@Anniehatani` | Hoàn thành |
| **Done** | #6: Giao diện lộ trình bài học và màn hình làm bài | `@nguyennhuuquynhh07-07` | Hoàn thành |
| **Done** | #7: Hệ thống Trái tim, điểm thưởng XP và Đá quý | `@tus-sud` | Hoàn thành |
| **Done** | #8: Chuỗi ngày học liên tục và Đóng băng chuỗi | `@tus-sud` | Hoàn thành |
| **Done** | #9: Tích hợp Mascot Thỏ Bảy Màu tương tác | `@nguyennhuuquynhh07-07` | Hoàn thành |
| **Done** | #10: Cửa hàng vật phẩm và Bảng xếp hạng tuần | `@nguyennhuuquynhh07-07` | Hoàn thành |
| **Done** | #11: Đăng ký, đăng nhập tài khoản và lưu phiên | `@Anniehatani` | Hoàn thành |
| **Done** | #12: Kiểm thử chức năng và báo cáo Sprint 1 | `@tus-sud` | Hoàn thành |
