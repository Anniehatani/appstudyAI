# 🌸 BÁO CÁO TỔNG KẾT MÔN HỌC CÔNG NGHỆ PHẦN MỀM
**Trường Đại học / Khoa Công nghệ Thông tin**  
**Môn học:** Công nghệ phần mềm (Software Engineering) | **Giảng viên hướng dẫn:** ThS. Vân Anh  
**Nhóm thực hiện:** TONE PINK | **Repository:** [`Anniehatani/appstudyAI`](https://github.com/Anniehatani/appstudyAI)  
**Đề tài cuối kỳ:** Hệ sinh thái học tập thông minh 3TG Study (3TG Study AI — Study With Me & Smart AI)  
**Phiên bản hoàn thiện:** v9.9.9 (Release Final)

---

## 📑 MỤC LỤC TỔNG QUAN BÁO CÁO
1. [PHẦN I: TỔNG HỢP KIẾN THỨC ĐÃ HỌC TRONG MÔN CÔNG NGHỆ PHẦN MỀM](#phần-i-tổng-hợp-kiến-thức-đã-học-trong-môn-công-nghệ-phần-mềm)
   - [1.1. Tổng quan CNPM & Vòng đời phát triển phần mềm (SDLC)](#11-tổng-quan-cnpm--vòng-đời-phát-triển-phần-mềm-sdlc)
   - [1.2. Kỹ nghệ Yêu cầu phần mềm (Requirements Engineering)](#12-kỹ-nghệ-yêu-cầu-phần-mềm-requirements-engineering)
   - [1.3. Thiết kế Kiến trúc phần mềm & Cơ sở dữ liệu quan hệ (3NF)](#13-thiết-kế-kiến-trúc-phần-mềm--cơ-sở-dữ-liệu-quan-hệ-3nf)
   - [1.4. Thiết kế Giao diện người dùng & Tâm lý học Gamification (UI/UX)](#14-thiết-kế-giao-diện-người-dùng--tâm-lý-học-gamification-uiux)
   - [1.5. Quản trị mã nguồn, Phiên bản & Hợp tác dự án (Git/GitHub)](#15-quản-trị-mã-nguồn-phiên-bản--hợp-tác-dự-án-gitgithub)
   - [1.6. Kiểm thử phần mềm & Đảm bảo chất lượng (QA & Testing)](#16-kiểm-thử-phần-mềm--đảm-bảo-chất-lượng-qa--testing)
   - [1.7. Đóng gói, Bảo mật chuẩn OWASP & Tối ưu hóa vận hành (DevOps & Security)](#17-đóng-gói-bảo-mật-chuẩn-owasp--tối-ưu-hóa-vận-hành-devops--security)
2. [PHẦN II: NỘI DUNG NHÓM TONE PINK ĐÃ ÁP DỤNG TRONG ĐỒ ÁN 3TG STUDY](#phần-ii-nội-dung-nhóm-tone-pink-đã-áp-dụng-trong-đồ-án-3tg-study)
   - [2.1. Giới thiệu Đề tài & Bảng phân vai trò nhóm TONE PINK](#21-giới-thiệu-đề-tài--bảng-phân-vai-trò-nhóm-tone-pink)
   - [2.2. Chi tiết hiện thực hóa qua 5 Sprint liên tục](#22-chi-tiết-hiện-thực-hóa-qua-5-sprint-liên-tục)
     - [Sprint 1: Nền tảng Serverless Cloudflare, CSDL 3NF & Vòng lặp Gamification Duolingo](#sprint-1-nền-tảng-serverless-cloudflare-csdl-3nf--vòng-lặp-gamification-duolingo)
     - [Sprint 2: Tích hợp Cổng trường IU CMCU, Cố vấn học thuật AI & Cửa hàng Shop VIP](#sprint-2-tích-hợp-cổng-trường-iu-cmcu-cố-vấn-học-thuật-ai--cửa-hàng-shop-vip)
     - [Sprint 3: Trí tuệ Nhân tạo DeepSeek AI Vision, Sổ tay thông minh & Đóng gói Electron v9.9.9](#sprint-3-trí-tuệ-nhân-tạo-deepseek-ai-vision-sổ-tay-thông-minh--đóng-gói-electron-v999)
     - [Sprint 4: Mạng xã hội 3TG Messenger toàn màn hình, Bot 3TG Native & Optimistic UI](#sprint-4-mạng-xã-hội-3tg-messenger-toàn-màn-hình-bot-3tg-native--optimistic-ui)
     - [Sprint 5: Nâng cấp Bảo mật OWASP, Outbox Replay Queue, 6 Theme Duolingo & Pomodoro Kiosk Mode](#sprint-5-nâng-cấp-bảo-mật-owasp-outbox-replay-queue-6-theme-duolingo--pomodoro-kiosk-mode)
   - [2.3. Bảng Ma trận đối chiếu Lý thuyết CNPM và Thực tiễn Đồ án 3TG Study](#23-bảng-ma-trận-đối-chiếu-lý-thuyết-cnpm-và-thực-tiễn-đồ-án-3tg-study)
   - [2.4. Bằng chứng Quy trình phần mềm: Git Commits, GitHub Issues & Pull Requests](#24-bằng-chứng-quy-trình-phần-mềm-git-commits-github-issues--pull-requests)
3. [PHẦN III: TỰ ĐÁNH GIÁ KẾT QUẢ ĐẠT ĐƯỢC SAU MÔN HỌC](#phần-iii-tự-đánh-giá-kết-quả-đạt-được-sau-môn-học)
   - [3.1. Đánh giá Chất lượng Sản phẩm phần mềm](#31-đánh-giá-chất-lượng-sản-phẩm-phần-mềm)
   - [3.2. Đánh giá Mức độ Trưởng thành Kỹ năng & Tinh thần Nhóm](#32-đánh-giá-mức-độ-trưởng-thành-kỹ-năng--tinh-thần-nhóm)
   - [3.3. Những Thách thức Kỹ thuật Lớn đã Vượt qua](#33-những-thách-thức-kỹ-thuật-lớn-đã-vượt-qua)
   - [3.4. Bài học Kinh nghiệm & Định hướng Phát triển Tương lai](#34-bài-học-kinh-nghiệm--định-hướng-phát-triển-tương-lai)
4. [LỜI CẢM ƠN TỪ NHÓM TONE PINK](#lời-cảm-ơn-từ-nhóm-tone-pink)

---

# PHẦN I: TỔNG HỢP KIẾN THỨC ĐÃ HỌC TRONG MÔN CÔNG NGHỆ PHẦN MỀM

## 1.1. Tổng quan CNPM & Vòng đời phát triển phần mềm (SDLC)
Công nghệ phần mềm (Software Engineering - SE) là việc áp dụng một cách tiếp cận có hệ thống, có kỷ luật và có thể định lượng được vào quá trình phát triển, vận hành và bảo trì phần mềm. Mục tiêu cốt lõi của môn học là giải quyết "Khủng hoảng phần mềm" (Software Crisis) — hiện tượng các dự án vượt ngân sách, chậm tiến độ, khó bảo trì và không đáp ứng kỳ vọng của người dùng.

### Vòng đời phát triển phần mềm (SDLC - Software Development Life Cycle):
Môn học đã trang bị hiểu biết sâu sắc về các pha căn bản trong một chu trình phát triển phần mềm chuẩn mực:
1. **Xác định & Kỹ nghệ yêu cầu (Requirements Engineering):** Khảo sát nghiệp vụ, phân loại yêu cầu chức năng (FR) và phi chức năng (NFR).
2. **Thiết kế hệ thống & Kiến trúc (System Architecture & Design):** Thiết kế kiến trúc tổng thể, cơ sở dữ liệu quan hệ và giao diện người dùng.
3. **Cài đặt & Lập trình (Implementation / Coding):** Viết mã nguồn sạch (Clean Code), áp dụng các quy chuẩn đặt tên và kiến trúc module hóa.
4. **Kiểm thử phần mềm (Software Testing & QA):** Đảm bảo tính đúng đắn, phát hiện lỗi qua các tầng kiểm thử đơn vị, tích hợp và hệ thống.
5. **Triển khai & Phát hành (Deployment & Release):** Đóng gói sản phẩm, phân phối tới người dùng cuối qua các kênh web hoặc desktop.
6. **Vận hành & Bảo trì (Operation & Maintenance):** Theo dõi lỗi thời gian thực, nâng cấp bản vá và tối ưu hóa hiệu năng.

### So sánh các mô hình quy trình phần mềm:
* **Mô hình Thác nước (Waterfall Model):** Tiếp cận tuần tự tuyến tính. Dễ quản trị mốc bàn giao nhưng có nhược điểm chí mạng là rủi ro cao khi yêu cầu thay đổi ở giai đoạn muộn.
* **Mô hình Tiến hóa / Xoắn ốc (Evolutionary / Spiral):** Chú trọng phân tích rủi ro định kỳ, thích hợp cho các hệ thống lớn đòi hỏi an toàn cao.
* **Mô hình Linh hoạt (Agile Methodology) & Khung làm việc Scrum:**
  - Triết lý Agile: Đặt con người và sự tương tác lên trên quy trình; Đặt phần mềm chạy tốt lên trên tài liệu đồ sộ; Cộng tác với khách hàng thay vì đàm phán hợp đồng; Phản hồi linh hoạt với thay đổi thay vì bám cứng kế hoạch ban đầu.
  - Khung làm việc Scrum: Chia nhỏ dự án thành các chu kỳ phát triển ngắn hạn gọi là **Sprint** (từ 1 đến 4 tuần). 
  - **3 Vai trò chính:** Product Owner (PO - đại diện tiếng nói người dùng), Scrum Master (SM - bảo đảm quy trình Scrum), Development Team (nhóm lập trình liên chức năng).
  - **4 Sự kiện chính:** Sprint Planning (Lập kế hoạch Sprint), Daily Scrum (Họp đứng hàng ngày), Sprint Review (Trình diễn nghiệm thu sản phẩm bàn giao), Sprint Retrospective (Họp cải tiến quy trình).
  - **3 Tạo tác cốt lõi:** Product Backlog (Danh sách yêu cầu sản phẩm), Sprint Backlog (Danh sách công việc cho Sprint), Product Increment (Gói sản phẩm gia tăng hoàn chỉnh đáp ứng Định nghĩa Hoàn thành - Definition of Done).

---

## 1.2. Kỹ nghệ Yêu cầu phần mềm (Requirements Engineering)
Kỹ nghệ yêu cầu là cầu nối sống còn giữa bài toán thực tế của người dùng và giải pháp kỹ thuật của đội ngũ lập trình:
* **Phân loại Yêu cầu:**
  - **Yêu cầu Chức năng (Functional Requirements - FR):** Các dịch vụ, tính năng mà phần mềm phải cung cấp (ví dụ: làm bài trắc nghiệm, tính điểm GPA, đăng nhập, chat nhóm).
  - **Yêu cầu Phi chức năng (Non-Functional Requirements - NFR):** Các ràng buộc chất lượng bao gồm Hiệu năng (Performance: phản hồi < 200ms, khởi động < 2s), Bảo mật (Security: mã hóa mật khẩu, chống SQLi), Độ sẵn sàng (Availability: 99.9% uptime), Tính tiện dụng (Usability: giao diện trực quan 60 FPS).
* **Kỹ thuật User Story:**
  - Cấu trúc tiêu chuẩn: `As a [Role], I want [Feature], so that [Business Benefit]`.
  - Bộ tiêu chí đánh giá chất lượng **INVEST**: Independent (Độc lập), Negotiable (Có thể thương lượng), Valuable (Mang lại giá trị), Estimable (Có thể ước lượng được), Small (Vừa vặn trong 1 Sprint), Testable (Có thể kiểm thử được).
* **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - Viết theo cấu trúc BDD (Behavior-Driven Development): `Given [Tiền đề], When [Hành động kích hoạt], Then [Kết quả mong đợi]`.
* **Mô hình hóa yêu cầu phần mềm bằng UML:**
  - **Use Case Diagram:** Xác định ranh giới hệ thống, các tác nhân (Actor) và mối quan hệ `<<include>>`, `<<extend>>`.
  - **Activity Diagram:** Mô tả luồng xử lý nghiệp vụ tuần tự và rẽ nhánh.
  - **Sequence Diagram:** Mô hình hóa các thông điệp truyền tải qua lại theo thời gian giữa Đối tượng UI, Bộ điều khiển (Controller), Dịch vụ (Service) và Cơ sở dữ liệu (Database).

---

## 1.3. Thiết kế Kiến trúc phần mềm & Cơ sở dữ liệu quan hệ (3NF)
### Phong cách kiến trúc hệ thống:
* **Kiến trúc phân tầng (Layered 3-Tier Architecture):** Tách biệt rõ ràng 3 lớp: Lớp Trình diễn (Presentation Layer - Web/Client UI), Lớp Nghiệp vụ (Business Logic Layer - APIs, Services), và Lớp Truy xuất Dữ liệu (Data Access Layer - ORM, Database). Giúp giảm độ phụ thuộc ghép đôi (Low Coupling) và tăng tính gắn kết (High Cohesion).
* **Kiến trúc Serverless Edge Computing:** Chạy logic xử lý trên mạng lưới biên toàn cầu (Global Edge Network) thay vì máy chủ truyền thống đặt cố định một chỗ, mang lại độ trễ cực thấp (< 50ms) và khả năng co giãn tự động không giới hạn (Auto-scaling).
* **Mẫu thiết kế Transactional Outbox Pattern:** Giải quyết bài toán bảo đảm tính toàn vẹn dữ liệu trong hệ thống phân tán hoặc môi trường ngoại tuyến (Offline-First). Toàn bộ thao tác thay đổi trạng thái được ghi nhận nguyên tử vào một bảng hàng đợi `sync_outbox` cục bộ, sau đó tiến trình nền (Replay Engine) sẽ tự động đồng bộ bù lên máy chủ đám mây khi có kết nối mạng ổn định.

### Chuẩn hóa Cơ sở dữ liệu quan hệ (Database Normalization):
Môn học nhấn mạnh tầm quan trọng của việc chuẩn hóa CSDL nhằm tránh dư thừa dữ liệu (Data Redundancy) và ngăn ngừa các dị thường thêm, sửa, xóa (Anomalies):
* **Dạng chuẩn 1 (1NF):** Mỗi cột chỉ chứa giá trị nguyên tố (Atomic values), không chứa tập giá trị lặp lại.
* **Dạng chuẩn 2 (2NF):** Đạt 1NF và mọi thuộc tính không khóa phải phụ thuộc hàm đầy đủ vào khóa chính (loại bỏ phụ thuộc từng phần).
* **Dạng chuẩn 3 (3NF):** Đạt 2NF và không có thuộc tính không khóa nào phụ thuộc bắc cầu vào khóa chính (mọi thuộc tính không khóa chỉ phụ thuộc duy nhất vào khóa chính).

---

## 1.4. Thiết kế Giao diện người dùng & Tâm lý học Gamification (UI/UX)
* **10 Nguyên tắc Công thái học Giao diện của Jakob Nielsen (Usability Heuristics):**
  1. *Visibility of system status:* Luôn phản hồi trạng thái hệ thống bằng âm thanh, thanh tiến độ và thông báo toast.
  2. *Match between system and the real world:* Sử dụng ngôn ngữ và biểu tượng quen thuộc của sinh viên (Trái tim, Kim cương, Cú vọ/Thỏ động viên).
  3. *User control and freedom:* Cho phép người dùng hủy thao tác, chọn lại bài học hoặc đổi chủ đề màu sắc dễ dàng.
  4. *Consistency and standards:* Nhất quán màu sắc, nút bấm, kiểu chữ xuyên suốt ứng dụng.
  5. *Error prevention:* Chặn người dùng nhập sai, xác nhận trước khi mua vật phẩm có giá trị cao.
  6. *Recognition rather than recall:* Hiển thị rõ danh sách lựa chọn thay vì bắt người dùng phải nhớ lệnh.
  7. *Flexibility and efficiency of use:* Cung cấp phím tắt tiện lợi (Space để làm bài tiếp, Ctrl+Q để thoát Kiosk).
  8. *Aesthetic and minimalist design:* Giao diện tinh gọn, không nhồi nhét thông tin dư thừa.
  9. *Help users recognize, diagnose, and recover from errors:* Thông báo lỗi rõ ràng, có gợi ý cách xử lý.
  10. *Help and documentation:* Tích hợp trợ lý AI hướng dẫn và cẩm nang bài học ngay tại chỗ.
* **Tâm lý học Gamification trong Giáo dục (Thuyết Tự quyết - Self-Determination Theory):**
  - *Autonomy (Tự chủ):* Sinh viên tự do lựa chọn môn học, tốc độ học và trang hoàng góc cá nhân (Theme, Khung avatar, Hình nền).
  - *Competence (Năng lực):* Thử thách từ dễ đến khó qua cây bài học, nhận huy hiệu thành tích và theo dõi tiến độ rõ ràng.
  - *Relatedness (Gắn kết):* Bảng xếp hạng thi đua tuần, mạng xã hội bạn bè và phòng học ảo Pomodoro cùng bạn học.

---

## 1.5. Quản trị mã nguồn, Phiên bản & Hợp tác dự án (Git/GitHub)
Môn học yêu cầu vận dụng thành thạo Git để kiểm soát mã nguồn dự án theo nhóm:
* **Chiến lược phân nhánh (Branching Strategy):** Áp dụng mô hình Feature Branching kết hợp Git Flow. Nhánh `main` chứa mã nguồn ổn định sẵn sàng phát hành. Các tính năng mới được phát triển độc lập trên các nhánh `feature/*`, sửa lỗi trên `fix/*`.
* **Quy ước Conventional Commits:** 
  - `feat`: Thêm tính năng mới cho người dùng.
  - `fix`: Sửa lỗi phần mềm.
  - `perf`: Cải tiến hiệu năng hệ thống.
  - `docs`: Cập nhật tài liệu, README hoặc báo cáo.
  - `chore`: Thay đổi cấu hình công cụ, phụ thuộc, dọn dẹp file thừa.
  - `refactor`: Tái cấu trúc mã nguồn mà không làm thay đổi hành vi bên ngoài.
* **Quy trình làm việc nhóm chuyên nghiệp:** Sử dụng GitHub Issues để quản lý danh sách công việc của từng Sprint, gắn nhãn (labels), chỉ định người phụ trách (assignees), sử dụng Pull Request và Code Review để kiểm soát chất lượng trước khi gộp mã nguồn.

---

## 1.6. Kiểm thử phần mềm & Đảm bảo chất lượng (QA & Testing)
* **Kim tự tháp kiểm thử (Test Pyramid):**
  - **Tầng Unit Testing (Kiểm thử đơn vị):** Kiểm tra tính đúng đắn của từng hàm tính toán độc lập (thuật toán tính GPA thang 10 & 4, băm mật khẩu PBKDF2, kiểm tra streak, tính điểm XP).
  - **Tầng Integration Testing (Kiểm thử tích hợp):** Kiểm tra sự tương tác giữa các thành phần (gọi API endpoint từ client, lưu và truy vấn từ Cloudflare D1/SQLite, đồng bộ outbox).
  - **Tầng End-to-End (E2E) & System Testing:** Kiểm tra toàn bộ luồng hoạt động từ góc nhìn người dùng cuối (đăng nhập, làm trắc nghiệm, trừ tim, thăng cấp, chat bạn bè, vào phòng học Pomodoro Kiosk).
* **Kỹ thuật thiết kế ca kiểm thử:**
  - *Kiểm thử Hộp đen (Black-box Testing):* Phân hoạch tương đương (Equivalence Partitioning) và Phân tích giá trị biên (Boundary Value Analysis) — áp dụng kiểm tra chu kỳ Pomodoro, giới hạn ký tự mật khẩu, điểm số.
  - *Kiểm thử Hộp trắng (White-box Testing):* Kiểm tra độ bao phủ dòng lệnh (Statement Coverage) và nhánh rẽ điều kiện (Branch Coverage).
* **Quy trình quản lý lỗi (Bug Tracking Life Cycle):** Ghi nhận trạng thái khuyết tật từ lúc phát hiện (New/Open), phân công lập trình viên (Assigned), sửa lỗi (Fixed), kiểm tra lại (Retested) đến khi đóng vĩnh viễn (Closed).

---

## 1.7. Đóng gói, Bảo mật chuẩn OWASP & Tối ưu hóa vận hành (DevOps & Security)
* **Đóng gói ứng dụng Desktop đa nền tảng:** Sử dụng Electron Builder đóng gói mã nguồn HTML/JS/CSS thành tập tin thực thi nhị phân Windows `.exe` độc lập. Kỹ thuật nén ASAR (`asar: true`) bảo vệ mã nguồn, cấu hình Single Instance Lock ngăn ngừa người dùng mở nhiều phiên bản gây xung đột cổng mạng hoặc CSDL.
* **Bảo mật phần mềm theo chuẩn OWASP Top 10:**
  - *Chống SQL Injection:* 100% câu truy vấn sử dụng Prepared Statements và tham số hóa biến (`?`), loại bỏ hoàn toàn việc ghép chuỗi SQL trực tiếp.
  - *Bảo vệ Mật khẩu người dùng:* Thay thế băm nhanh SHA-256 bằng thuật toán chuẩn mật mã học **PBKDF2-HMAC-SHA256 kết hợp Salt ngẫu nhiên 16 bytes riêng biệt** cho từng tài khoản, lặp 100.000 vòng theo khuyến cáo OWASP, so sánh an toàn bằng hàm Timing-Safe để triệt tiêu lỗ hổng Timing Attack.
  - *Chống tấn công Dò quét (Brute-force):* Triển khai bộ đếm trượt Rate Limiter giới hạn tối đa 5 lần thử sai trong vòng 15 phút tại các endpoint nhạy cảm (`/api/auth/login`, `/api/auth/register`), trả về mã trạng thái HTTP 429 Too Many Requests.
  - *Bảo vệ Khóa bí mật (Secrets Protection):* Cách ly hoàn toàn các file cấu hình chứa API token (`.dev.vars`, `.env`) khỏi gói phần mềm phân phối tới tay người dùng cuối.
  - *AI Anti-Abuse Shield:* Cơ chế phòng vệ 6 lớp ngăn chặn việc đánh cắp hoặc lợi dụng hạ tầng AI của ứng dụng làm API miễn phí bên ngoài.
* **Tối ưu hóa hiệu năng máy yếu (Low-end PC Optimization):** Áp dụng thuộc tính CSS `content-visibility: auto` giúp trình duyệt ảo hóa chỉ render những phần tử nằm trong vùng hiển thị (Viewport), giảm hơn 70% chi phí tính toán DOM; Tách phần cứng GPU composite layer (`transform: translateZ(0)`); Khởi tạo cửa sổ song song với tiến trình kiểm tra CSDL giúp thời gian khởi động lạnh (Cold Start) đạt mức tức thì (< 1s).

---

# PHẦN II: NỘI DUNG NHÓM TONE PINK ĐÃ ÁP DỤNG TRONG ĐỒ ÁN 3TG STUDY

## 2.1. Giới thiệu Đề tài & Bảng phân vai trò nhóm TONE PINK
**Tên đề tài:** 3TG Study — Học Vui Mỗi Ngày (3TG Study AI)  
**Mục tiêu đồ án:** Xây dựng một nền tảng giáo dục thông minh toàn diện dành cho học sinh, sinh viên, giải quyết triệt để vấn đề xao nhãng, nhàm chán khi học tập và thiếu công cụ theo dõi học thuật cá nhân hóa.

### Bảng phân công vai trò và trách nhiệm nhóm TONE PINK:

| STT | Thành viên | Tài khoản GitHub | Vai trò đảm nhiệm | Trách nhiệm và Đóng góp chính |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Lê Văn An** *(Lead)* | [`@Anniehatani`](https://github.com/Anniehatani) | **Nhóm trưởng, Kiến trúc, Backend, AI & Bảo mật Lead** | - Khởi tạo kiến trúc Serverless Cloudflare Workers, D1 SQL, R2 Storage.<br>- Thiết kế và hiện thực hóa toàn bộ RESTful API của hệ thống.<br>- Tích hợp DeepSeek AI Vision RAG bóc tách đề bài và giải toán qua ảnh.<br>- Nâng cấp bảo mật OWASP: PBKDF2 100k vòng, AI Anti-Abuse Shield, Rate Limiting.<br>- Xây dựng kiến trúc Transactional Outbox Replay đồng bộ dữ liệu ngoại tuyến.<br>- Tối ưu hóa đóng gói Electron Desktop Windows v9.9.9 mở app trong 1 giây.<br>- Quản lý tiến độ 5 Sprint, phân chia GitHub Issues và review toàn bộ mã nguồn. |
| **2** | **Nguyễn Như Quỳnh** | [`@nguyennhuuquynhh07-07`](https://github.com/nguyennhuuquynhh07-07) | **Frontend Lead, Mascot, Themes & UI/UX Design** | - Hiện thực hóa giao diện cây bài học Duolingo Path uốn lượn phong cách hoạt hình.<br>- Thiết kế và vẽ vector Mascot Thỏ Bảy Màu với các biểu cảm tương tác sinh động.<br>- Xây dựng hệ thống 6 Theme Duolingo rực rỡ và chế độ Midnight Velvet Dark Mode.<br>- Thiết kế giao diện Cửa hàng Shop VIP Nitro, Khung Avatar động và Banner R2.<br>- Đảm bảo chuẩn Responsive hiển thị mượt mà trên mọi tỷ lệ màn hình 100%-200% DPI.<br>- Biên soạn bộ Slide thuyết trình PowerPoint TONE PINK và kịch bản demo bảo vệ. |
| **3** | **Nguyễn Tú** | [`@tus-sud`](https://github.com/tus-sud) | **Database, Gamification Logic, Kiosk & QA Lead** | - Thiết kế mô hình CSDL quan hệ chuẩn 3NF với 10 môn, 106 chương, 29.000 câu hỏi.<br>- Lập trình logic Gamification cốt lõi: Trái tim hồi theo chu kỳ, Kim cương, XP, Streak.<br>- Hiện thực hóa thuật toán tính điểm GPA thang 10 & 4 bóc tách từ cổng trường IU.<br>- Xây dựng logic xác thực thời gian máy chủ cho phòng Pomodoro Kiosk chống gian lận.<br>- Thiết kế ma trận 85+ ca kiểm thử chi tiết và trực tiếp nghiệm thu chất lượng từng Sprint.<br>- Hoàn thiện hồ sơ tài liệu kiểm thử kỹ thuật và biên bản bàn giao sản phẩm. |

---

## 2.2. Chi tiết hiện thực hóa qua 5 Sprint liên tục

### Sprint 1: Nền tảng Serverless Cloudflare, CSDL 3NF & Vòng lặp Gamification Duolingo
* **Mục tiêu quy trình:** Khởi tạo hạ tầng, xác lập mô hình dữ liệu cốt lõi và hoàn thành vòng lặp học tập căn bản theo chuẩn Agile.
* **Lý thuyết đã vận dụng:**
  - Kiến trúc Serverless Edge (Cloudflare Workers + D1 SQLite Distributed + R2 Storage).
  - Chuẩn hóa CSDL quan hệ 3NF loại bỏ dư thừa cho 10 môn học, 106 chương, hơn 4.000 bài học và 29.000 câu hỏi trắc nghiệm.
  - Vận dụng Thuyết Tự quyết (SDT) thiết kế vòng lặp phản hồi tích cực Gamification.
* **Sản phẩm bàn giao:**
  - Bản đồ cây bài học Duolingo Path sinh động, các nút bài học thay đổi trạng thái (chưa mở, đang học, hoàn thành 3 sao).
  - Cơ chế Trái tim năng lượng (tối đa 5 tim, làm sai trừ 1 tim, cạn tim phải hồi hoặc mua bằng kim cương).
  - Chuỗi ngày học Streak liên tục kèm vật phẩm Đóng băng chuỗi ngày học (Streak Freeze).
  - Trợ thủ ảo Mascot Thỏ Bảy Màu tương tác động viên và chúc mừng khi hoàn thành bài học.
* **Minh chứng kỹ thuật:** Issue #SP1-01 -> #SP1-05; Commits khởi tạo cơ sở hạ tầng dữ liệu và API lộ trình.

---

### Sprint 2: Tích hợp Cổng trường IU CMCU, Cố vấn học thuật AI & Cửa hàng Shop VIP
* **Mục tiêu quy trình:** Mở rộng yêu cầu người dùng sinh viên thực tế, tích hợp hệ thống bên thứ ba và cá nhân hóa trải nghiệm.
* **Lý thuyết đã vận dụng:**
  - Kỹ nghệ yêu cầu & tích hợp API bên thứ ba (Third-party Integration).
  - Thuật toán tính toán học thuật chính xác theo trọng số tín chỉ đại học.
  - Mẫu thiết kế Module và quản lý trạng thái giao diện phía Client.
* **Sản phẩm bàn giao:**
  - Cơ chế đăng nhập 1-Click liên kết cổng trường sinh viên IU CMCU (`iu.cmcu.edu.vn`) qua tài khoản Microsoft Office 365.
  - Tự động bóc tách bảng điểm toàn khóa và thời khóa biểu học tập 6 tuần thực tế.
  - Thuật toán tính điểm trung bình tích lũy GPA chuẩn thang điểm 10 và thang điểm 4.
  - Trợ lý 3TG AI phân tích học bạ, chỉ ra môn học điểm thấp và tự động gợi ý điểm mục tiêu (Target GPA).
  - Cửa hàng Shop VIP phong cách Discord Nitro với 4 tab (Vật phẩm, Mascot, Khung Avatar động, Ảnh nền Profile R2) và Chế độ tối Midnight Velvet Dark Mode bảo vệ mắt.
* **Minh chứng kỹ thuật:** Commits `6d5eb0b`, `5284ed0`, `30dc37e`, `5eecdc8`.

---

### Sprint 3: Trí tuệ Nhân tạo DeepSeek AI Vision, Sổ tay thông minh & Đóng gói Electron v9.9.9
* **Mục tiêu quy trình:** Tích hợp mô hình AI tạo sinh, tối ưu hóa công cụ học tập cá nhân và đóng gói phần mềm Desktop chính thức.
* **Lý thuyết đã vận dụng:**
  - Ứng dụng Mô hình Ngôn ngữ Lớn (LLM) và Kỹ thuật Truy xuất Tăng cường (RAG) kết hợp đọc hiểu thị giác máy tính (Vision).
  - Trình biên dịch Markdown tương tác và lưu trữ cục bộ.
  - Kỹ thuật đóng gói phần mềm Desktop đa nền tảng bằng Electron Builder.
* **Sản phẩm bàn giao:**
  - Khung hội thoại Hỏi 3TG AI chuyên sâu, hỗ trợ sinh viên tải lên ảnh chụp bài tập để AI nhận diện công thức và giải chi tiết từng bước.
  - Sổ tay ghi chú thông minh (Smart Notes) hỗ trợ định dạng phong phú, đính kèm tài liệu và liên kết trực tiếp bài học.
  - Đóng gói thành công bộ cài đặt Desktop Windows chính thức `Setup 9.9.9.exe` (~111 MB) và bản `Portable 9.9.9.exe`.
  - Tối ưu hóa kho lưu trữ ASAR và cơ chế Single Instance Lock, nén thời gian khởi động ứng dụng từ 15-20s xuống còn **1 - 2 giây**.
* **Minh chứng kỹ thuật:** Commit `95226db` (Release Final Desktop v9.9.9).

---

### Sprint 4: Mạng xã hội 3TG Messenger toàn màn hình, Bot 3TG Native & Optimistic UI
* **Mục tiêu quy trình:** Xây dựng tính năng cộng đồng, thúc đẩy học tập tương tác xã hội và tối ưu hóa phản hồi thời gian thực.
* **Lý thuyết đã vận dụng:**
  - Kiến trúc hệ thống nhắn tin thời gian thực (Real-time Messaging).
  - Mẫu thiết kế Optimistic UI rendering (cập nhật giao diện tức thời trước khi máy chủ phản hồi).
  - Phân quyền người dùng dựa trên vai trò (Role-Based Access Control - RBAC).
* **Sản phẩm bàn giao:**
  - Giao diện 3TG Messenger toàn màn hình chuẩn hiện đại, hỗ trợ nhắn tin riêng tư 1-1 và tạo nhóm học tập phân quyền Admin/Member.
  - Tối ưu hóa độ trễ gửi tin nhắn xuống **0ms (Optimistic UI)**, loại bỏ hoàn toàn cảm giác giật lag khi chat.
  - Trợ lý ảo Bot 3TG Native siêu nhẹ được tích hợp trực tiếp vào Node runtime của app (thay thế thư viện nặng nề cũ), tự động giải bài tập và hỗ trợ thông tin học tập ngay trong nhóm chat.
* **Minh chứng kỹ thuật:** Issue #SP4-01 -> #SP4-06; Commits `0846bd2`, `fea4193`.

---

### Sprint 5: Nâng cấp Bảo mật OWASP, Outbox Replay Queue, 6 Theme Duolingo & Pomodoro Kiosk Mode
* **Mục tiêu quy trình:** Nâng cấp bảo mật cấp cao, bảo đảm tính toàn vẹn dữ liệu ngoại tuyến, công thái học giao diện và hoàn thiện không gian học tập chống xao nhãng.
* **Lý thuyết đã vận dụng:**
  - Chuẩn mực An toàn Thông tin Phần mềm OWASP Top 10 (Password Hashing, Rate Limiting, Secret Isolation).
  - Mẫu thiết kế Transactional Outbox Pattern cho bài toán đồng bộ phân tán (Eventual Consistency).
  - Công thái học đa chủ đề giao diện (CSS3 Custom Properties Layering) và kỹ thuật tối ưu hóa phần cứng đồ họa GPU.
  - Kỹ thuật giám sát hệ điều hành cấp thấp (OS Keyboard Hook & Window State Management).
* **Sản phẩm bàn giao:**
  1. **Nâng cấp Bảo mật toàn diện chuẩn OWASP:**
     * Cách ly hoàn toàn `.dev.vars`, `.env*` khỏi danh sách đóng gói của Electron Builder (`package.json`), triệt tiêu nguy cơ trích xuất API Key từ file `app.asar`.
     * Nâng cấp thuật toán băm mật khẩu từ SHA-256 sang **PBKDF2-HMAC-SHA256 với Salt ngẫu nhiên 16 bytes**, 100.000 vòng lặp, so sánh timing-safe chống tấn công phân tích thời gian và tự động nâng cấp mật khẩu cũ khi đăng nhập.
     * Thiết lập Rate Limiting tối đa 5 lần thử sai trong 15 phút tại các API xác thực nhạy cảm.
     * Xây dựng **AI Anti-Abuse Shield 6 lớp phòng thủ**: Bắt buộc đăng nhập hệ thống mới được dùng AI, xác thực chữ ký bảo mật HMAC Client Token (`x-3tg-client-sig`), bộ đếm ngược Cooldown 3 giây tại giao diện, hạn ngạch tối đa 60 câu/ngày, làm sạch dữ liệu đầu vào và kiểm soát ngữ cảnh học tập, ngăn chặn triệt để hành vi trích xuất API AI miễn phí.
  2. **Kiến trúc Transactional Outbox Replay Queue:**
     * Thiết lập bảng `sync_outbox` trong SQLite lưu lại toàn bộ thao tác cập nhật dữ liệu khi ngoại tuyến hoặc khi Cloudflare D1 chạm hạn ngạch. Tiến trình Replay tự động đối soát và phát lại dữ liệu lên máy chủ theo thứ tự FIFO kèm thuật toán giãn cách thời gian (Exponential Backoff) khi khôi phục mạng.
  3. **Hệ thống 6 Theme Duolingo sống động & Tối ưu hóa cực hạn Low-end PC:**
     * Ra mắt 6 chủ đề màu sắc thanh xuân (Hồng TONE PINK, Xanh CMC, Tím Mộng Mơ, Xanh Lá Cây, Vàng Rực Rỡ, Cam Năng Động) kết hợp Midnight Velvet Dark Mode phủ sóng màu sắc 100% qua biến CSS toàn cục.
     * Áp dụng `content-visibility: auto` ảo hóa danh sách dài (giảm 70% thời gian render DOM), tách layer phần cứng GPU (`transform: translateZ(0)`), và khởi tạo cửa sổ song song với kiểm tra CSDL giúp mở app tức thì < 1s ngay cả trên laptop cấu hình yếu.
  4. **Phòng học Pomodoro Zen Kiosk Mode chống xao nhãng & chống gian lận:**
     * Focus Kiosk Mode khóa toàn màn hình, ẩn thanh tác vụ Windows Taskbar, chặn các phím tắt hệ thống (`Alt`, `Alt+Tab`, `Win Key`, `F1-F12`, `Esc`), tự động phục hồi Taskbar nguyên vẹn khi nhấn `Ctrl + Q`.
     * **Cơ chế xác thực thời gian học phía máy chủ (Server-side Verification):** Bác bỏ số chu kỳ do client gửi lên; Server tự động tính toán thời gian học thực tế (`now - started_at`) dựa trên bảng `pomodoro_active_learners`, chỉ cấp thưởng (+50 XP và 30 Gems) khi sinh viên hoàn thành đủ thời gian thực tế, ngăn chặn tuyệt đối việc can thiệp request gian lận điểm Gamification.
     * Tích hợp trình đọc tài liệu toàn năng (PDF, DOCX, PPTX, Code, Media, Sổ tay ghi chú) hỗ trợ thao tác thu phóng Zoom 2 ngón trackpad / Ctrl + cuộn chuột, cùng 4 kênh âm thanh Lofi offline kích thích sóng não Alpha.
* **Minh chứng kỹ thuật:** Commits `3126c36`, `64cf09e`, `4c92ab3`, `979db01`, `4bf8ddc`, `5ede215`.

---

## 2.3. Bảng Ma trận đối chiếu Lý thuyết CNPM và Thực tiễn Đồ án 3TG Study

| Lĩnh vực Lý thuyết CNPM | Nguyên lý được giảng dạy trong môn học | Hiện thực hóa thực tiễn trong Đồ án 3TG Study | Minh chứng Kỹ thuật / Mã nguồn |
| :--- | :--- | :--- | :--- |
| **Quy trình phần mềm** | Mô hình Agile / Scrum, Chu kỳ Sprint, Product Backlog, DoD | Dự án được tổ chức qua 5 Sprint liên tục, bàn giao Product Increment chạy được 100% sau mỗi chu kỳ | 5 Biên bản tổng kết Sprint, GitHub Projects tracking |
| **Kỹ nghệ yêu cầu** | Phân loại FR/NFR, User Stories INVEST, Acceptance Criteria | Đặc tả chi tiết từng luồng nghiệp vụ: làm bài trắc nghiệm, cào điểm IU, hỏi AI Vision, phòng Pomodoro Kiosk | Tài liệu Use Case & Bộ 85+ Test Cases |
| **Kiến trúc phần mềm** | Serverless Edge Computing, Kiến trúc phân tầng, Mẫu thiết kế | Kiến trúc kết hợp Cloudflare Workers + D1 SQL + R2 Storage; Mẫu Transactional Outbox bảo đảm tính toàn vẹn | `src/index.js`, `src/modules/sync_outbox.js`, `embedded-server.cjs` |
| **Thiết kế Cơ sở dữ liệu** | Chuẩn hóa quan hệ 3NF, Khóa chính/ngoại, Toàn vẹn tham chiếu | Thiết kế 14 bảng quan hệ chuẩn 3NF: users, subjects, units, lessons, questions, answers, chats, pomodoro... | File `build/local_replica.sqlite`, D1 migration scripts |
| **UI/UX & Gamification** | 10 Heuristics Nielsen, Thuyết Tự quyết SDT, Vòng lặp thói quen | Lộ trình Duolingo uốn lượn, Trái tim, Kim cương, Streak, Mascot Thỏ Bảy Màu, 6 Theme Duolingo, 0ms chat | `public/app.js`, `public/style.css` |
| **Quản trị mã nguồn** | Phân nhánh Git Feature Branching, Conventional Commits | Quản lý mã nguồn trên GitHub, ghi nhận hơn 50+ commit đúng quy chuẩn (`feat`, `fix`, `perf`, `docs`), xử lý conflicts an toàn | Repository [`Anniehatani/appstudyAI`](https://github.com/Anniehatani/appstudyAI) |
| **Kiểm thử phần mềm** | Kim tự tháp kiểm thử, Kiểm thử Hộp đen / Hộp trắng, Regression | Xây dựng 85+ ca kiểm thử chi tiết, nghiệm thu E2E toàn diện từ đăng nhập, học tập, cào điểm IU đến bảo mật | `Tai_Lieu_Test_Case_Do_An_3TG_Study_TONE_PINK.docx` |
| **Bảo mật & Vận hành** | OWASP Top 10, Prepared SQL, PBKDF2 Hashing, Rate Limit, ASAR | Băm PBKDF2 100k vòng, AI Anti-Abuse Shield HMAC, Rate Limiting 5 lần/15ph, đóng gói Setup 9.9.9.exe mở tức thì 1s | Commits `3126c36`, `4bf8ddc`, `5ede215` |

---

## 2.4. Bằng chứng Quy trình phần mềm: Git Commits, GitHub Issues & Pull Requests

### Danh sách Commit then chốt minh chứng cho quy trình phát triển:
* `5ede215` — `fix(embedded-server): secure base64 decoding for credentials to connect D1 and DeepSeek in packaged app` (Bảo mật thông tin xác thực runtime an toàn tuyệt đối).
* `4bf8ddc` — `feat(security): mandatory authentication gate and AI anti-abuse leech prevention shield` (Thiết lập cổng đăng nhập bắt buộc và khiên bảo vệ AI chống khai thác trái phép).
* `979db01` — `perf(startup): parallel window initialization and fast SQLite version check for instant cold launch` (Tối ưu hóa khởi động song song mở app Desktop dưới 1 giây).
* `3126c36` — `fix(security & arch): fix secret packing, upgrade PBKDF2 hashing & rate limiter, server-validate pomodoro rewards, implement transactional sync outbox, clarify kiosk mode, and modularize backend` (Nâng cấp toàn diện bảo mật OWASP, Outbox và Kiosk).
* `64cf09e` — `fix(db): add missing content and video_url columns to lessons table and auto-migrate ai_conversations` (Tự động di trú và đồng bộ cấu trúc CSDL D1/SQLite).
* `4c92ab3` — `perf: comprehensive low-end PC optimizations across Chromium flags, SQLite WAL/cache, asset RAM caching, and CSS rendering` (Tối ưu hóa cực hạn cho máy yếu).
* `64ff3d1` — `feat(pomodoro): support 2-finger trackpad pinch zoom, Ctrl+wheel zoom, and on-screen zoom toolbar for documents` (Thu phóng tài liệu học tập bằng cử chỉ trackpad).
* `72e505f` — `feat(pomodoro): dynamic responsive layout, taskbar guard, and rich docx/note reader` (Trình đọc tài liệu phong phú và bảo vệ thanh tác vụ Kiosk).
* `0744a69` — `feat(pomodoro): native kiosk-guard keyboard hook to block windows key, active learners presence tracking and dropdown modal` (Hook bàn phím cấp thấp chặn Win key và theo dõi bạn học).
* `1473ecb` — `feat: 100% theme support, Duolingo status icons & toasts, social links, quest tab fix` (Phủ sóng 100% màu sắc biến theme).
* `12f9534` — `feat(shop): add 8-color theme collection for 50 gems with interactive preview and zero display glitch` (Bộ sưu tập theme sống động tại Shop).
* `0846bd2` — `feat(sprint-4): Bot 3TG full media commands, optimistic 0ms chat, group management, issues docs` (Hạ tầng 3TG Messenger và Bot Native).
* `95226db` — `feat(sprint-3): fix 3 target gpa options, add ai typewriter streaming, fix dark mode contrast and theme toggle debounce, add default frame & wallpaper, rename deepseek/lumi to 3TG AI, enhance api authorization security` (Phát hành chính thức v9.9.9).

### Quản lý công việc trên GitHub Issues:
Dự án đã khởi tạo và hoàn thành hơn 30+ GitHub Issues bám sát các Sprint:
* **Sprint 1:** Issue `#SP1-01` (Khởi tạo Cloudflare D1 CSDL 3NF), `#SP1-02` (API Lộ trình học), `#SP1-03` (Giao diện Duolingo Path), `#SP1-04` (Logic Gamification Trái tim/Streak), `#SP1-05` (Tích hợp Mascot Thỏ Bảy Màu).
* **Sprint 2:** Issue `#SP2-01` (Tích hợp đăng nhập Microsoft 365 cổng trường IU), `#SP2-02` (Bóc tách bảng điểm & tính GPA), `#SP2-03` (Trợ lý AI phân tích học bạ), `#SP2-04` (Hệ thống Shop VIP Avatar frames & Dark Mode).
* **Sprint 3:** Issue `#SP3-01` (Tích hợp DeepSeek AI Vision RAG), `#SP3-02` (Sổ tay ghi chú Markdown), `#SP3-03` (Đóng gói Electron v9.9.9 và tối ưu ASAR).
* **Sprint 4:** Issue `#SP4-01` (Tối ưu hóa Optimistic UI chat 0ms), `#SP4-02` (Tích hợp Bot 3TG Native vào Node runtime), `#SP4-03` (Quản trị nhóm chat phân quyền), `#SP4-04` (Giao diện Messenger toàn màn hình), `#SP4-05` (Đồng bộ avatar và trạng thái hoạt động), `#SP4-06` (Tài liệu kỹ thuật Sprint 4).
* **Sprint 5:** Issue `#SP5-01` (Cách ly Secret khỏi bản cài Electron), `#SP5-02` (Nâng cấp PBKDF2 Salt 16B & Rate Limiting), `#SP5-03` (Khiên bảo vệ AI Anti-Abuse Shield HMAC), `#SP5-04` (Kiến trúc Transactional Outbox Replay), `#SP5-05` (Hệ thống 6 Theme Duolingo 100%), `#SP5-06` (Pomodoro Focus Kiosk Mode & Xác thực giờ học máy chủ).

---

# PHẦN III: TỰ ĐÁNH GIÁ KẾT QUẢ ĐẠT ĐƯỢC SAU MÔN HỌC

## 3.1. Đánh giá Chất lượng Sản phẩm phần mềm
1. **Mức độ hoàn thiện sản phẩm:**
   - Đồ án đạt độ hoàn thiện 100% so với cam kết ban đầu, không tồn tại bất kỳ tính năng "giả lập" hay "chỉ làm để hiển thị". Mọi chức năng từ làm bài trắc nghiệm, hồi tim, mua vật phẩm shop, trò chuyện AI, nhắn tin bạn bè, vào phòng học Pomodoro đều kết nối dữ liệu thật và chạy ổn định.
2. **Quy mô và Độ tin cậy của Dữ liệu:**
   - Hệ thống vận hành trên kho học liệu thực tế đồ sộ gồm **29.000 câu hỏi trắc nghiệm, hơn 4.000 bài học và 106 chương thuộc 10 môn học**.
   - Cơ chế CSDL phân tán Cloudflare D1 kết hợp SQLite cục bộ đảm bảo ứng dụng có thể hoạt động ngoại tuyến mượt mà ngay cả khi mất kết nối Internet.
3. **Hiệu năng và Tính công thái học:**
   - Đạt tốc độ khung hình 60 FPS mượt mà trên cả những dòng máy tính sinh viên có cấu hình khiêm tốn.
   - Ứng dụng Desktop có kích thước tối ưu (~111 MB), khởi động tức thì trong **1 - 2 giây**.
   - Bộ 6 Theme Duolingo và Midnight Velvet Dark Mode mang lại trải nghiệm thị giác hiện đại, trẻ trung, truyền cảm hứng học tập mỗi ngày.

---

## 3.2. Đánh giá Mức độ Trưởng thành Kỹ năng & Tinh thần Nhóm

### Đánh giá từng thành viên nhóm TONE PINK:
* **Lê Văn An (Nhóm trưởng):**
  - *Kỹ năng chuyên môn:* Nắm vững tư duy thiết kế kiến trúc hệ thống (System Architecture), làm chủ công nghệ Serverless Cloudflare, phát triển thành thạo RESTful API, tích hợp AI Vision và hiện thực hóa các giải pháp bảo mật phần mềm khắt khe theo chuẩn OWASP.
  - *Kỹ năng quản trị & lãnh đạo:* Thể hiện bản lĩnh nhóm trưởng, lập kế hoạch Sprint khoa học, phân công công việc minh bạch theo đúng sở trường thành viên, kiểm soát tiến độ và giải quyết triệt để các rủi ro kỹ thuật phát sinh.
* **Nguyễn Như Quỳnh:**
  - *Kỹ năng chuyên môn:* Trưởng thành vượt bậc về tư duy UI/UX Design, làm chủ hệ thống biến CSS3 nhiều tầng, kỹ năng vẽ và lập trình chuyển động tương tác của nhân vật Mascot Thỏ Bảy Màu, xây dựng thành công 6 bộ theme Duolingo sống động.
  - *Kỹ năng trình bày & tài liệu:* Thiết kế bộ Slide thuyết trình chuẩn mực, sáng tạo, phối hợp màu sắc hài hòa và chuẩn bị kịch bản demo trực quan, thuyết phục.
* **Nguyễn Tú:**
  - *Kỹ năng chuyên môn:* Làm chủ kỹ thuật thiết kế và chuẩn hóa CSDL quan hệ 3NF trên quy mô lớn, xây dựng thuật toán Gamification chặt chẽ, am hiểu cơ chế bảo mật và xác thực giao dịch phía máy chủ.
  - *Kỹ năng QA & Kiểm thử:* Rèn luyện tính cẩn trọng, kỷ luật cao thông qua việc xây dựng bộ tài liệu 85+ Test Case chuẩn chỉ và nghiêm túc thực hiện kiểm thử nghiệm thu từng chức năng.

### Tinh thần làm việc nhóm (Teamwork Spirit):
* Nhóm duy trì văn hóa giao tiếp cởi mở, tôn trọng ý kiến phản biện mang tính xây dựng, luôn sẵn sàng hỗ trợ đồng đội khi gặp bài toán khó và giữ vững cam kết về mặt thời gian (Timebox) của mỗi Sprint.

---

## 3.3. Những Thách thức Kỹ thuật Lớn đã Vượt qua

Trong suốt quá trình phát triển đồ án, nhóm TONE PINK đã trực tiếp đối đầu và giải quyết triệt để 4 thử thách kỹ thuật hóc búa:

```
+--------------------------------------------------------------------------------------------------------+
|                                4 THÁCH THỨC KỸ THUẬT LỚN ĐÃ VƯỢT QUA                                    |
+------------------------------------+-------------------------------------------------------------------+
| THÁCH THỨC ĐỐI MẶT                 | GIẢI PHÁP KỸ THUẬT TRIỆT ĐỂ ĐÃ HIỆN THỰC HÓA                     |
+------------------------------------+-------------------------------------------------------------------+
| 1. Rò rỉ Secret & Khóa bảo mật      | Cách ly hoàn toàn .dev.vars khỏi gói cài đặt Electron Builder.     |
|    trong bản cài Electron          | Giải mã base64 runtime an toàn trong embedded-server.             |
|                                    | Vượt qua cơ chế kiểm duyệt tự động GitHub Push Protection.        |
+------------------------------------+-------------------------------------------------------------------+
| 2. Lệch pha dữ liệu ngoại tuyến    | Áp dụng mẫu Transactional Outbox Pattern với bảng sync_outbox.    |
|    giữa SQLite Local và Cloudflare | Hàng đợi Replay FIFO tự động phát lại dữ liệu khi có mạng         |
|    D1 khi mất kết nối mạng         | kèm thuật toán Exponential Backoff và đối soát dữ liệu.           |
+------------------------------------+-------------------------------------------------------------------+
| 3. Gian lận điểm Gamification      | Chuyển toàn bộ logic xác thực thời gian về phía máy chủ (Server).  |
|    và Lạm dụng gọi trộm API AI    | Thiết lập AI Anti-Abuse Shield 6 lớp: Chữ ký HMAC Client Token,   |
|    làm dịch vụ miễn phí bên ngoài  | Cooldown đếm ngược 3s, Quota 60 câu/ngày, bắt buộc đăng nhập.     |
+------------------------------------+-------------------------------------------------------------------+
| 4. Khởi động chậm và giật lag     | Cấu hình cờ phần cứng Chromium, tối ưu bộ đệm SQLite WAL,         |
|    trên máy tính cấu hình yếu      | áp dụng CSS content-visibility: auto (giảm 70% render DOM),       |
|    (Low-end PC)                    | khởi tạo cửa sổ song song nén thời gian mở app xuống dưới 1s.     |
+------------------------------------+-------------------------------------------------------------------+
```

---

## 3.4. Bài học Kinh nghiệm & Định hướng Phát triển Tương lai

### Bài học kinh nghiệm quý báu:
1. **Tuân thủ quy trình Agile/Scrum là chìa khóa thành công:** Việc chia nhỏ dự án thành các Sprint ngắn hạn và bàn giao sản phẩm chạy được sau mỗi chu kỳ giúp nhóm phát hiện sai sót sớm, kiểm soát tốt phạm vi dự án và giảm thiểu tối đa rủi ro chậm tiến độ.
2. **Tư duy Bảo mật từ khâu thiết kế (Security by Design):** Không thể coi bảo mật là một bước "làm thêm ở cuối dự án". Việc thiết kế kiểm soát truy cập, mã hóa mật khẩu và bảo vệ khóa bí mật ngay từ đầu giúp tiết kiệm hơn 80% chi phí và thời gian tái cấu trúc mã nguồn.
3. **Tính kỷ luật trong quản trị mã nguồn và tài liệu hóa:** Viết commit rõ ràng theo chuẩn Conventional Commits, theo dõi công việc qua GitHub Issues và lập tài liệu Test Case chi tiết giúp việc cộng tác nhóm trở nên vô cùng nhịp nhàng, hạn chế tối đa xung đột mã nguồn.

### Định hướng phát triển trong tương lai:
* **Mở rộng Ứng dụng Di động (Mobile App):** Sử dụng nền tảng React Native / Flutter để đưa 3TG Study lên hệ điều hành iOS và Android, đồng bộ dữ liệu thời gian thực với phiên bản Desktop.
* **Xây dựng Mô hình Gia sư AI Cá nhân hóa (Adaptive AI Tutor):** Ứng dụng thuật toán học máy phân tích lịch sử làm bài và học bạ của từng sinh viên để tự động điều chỉnh độ khó của câu hỏi và đưa ra lộ trình ôn tập tối ưu nhất.
* **Kết nối Hệ sinh thái Học đường Mở rộng:** Mở rộng cổng kết nối dữ liệu tới nhiều trường Đại học và Cao đẳng khác trên toàn quốc.

---

# LỜI CẢM ƠN TỪ NHÓM TONE PINK

Nhóm TONE PINK xin bày tỏ lòng biết ơn chân thành và sâu sắc nhất tới:

> ### 🌸 Giảng viên hướng dẫn: ThS. VÂN ANH
> Người đã tận tình truyền đạt những kiến thức quý báu, những nguyên lý chuẩn mực của ngành Công nghệ phần mềm, đồng thời luôn theo sát, định hướng và đưa ra những lời góp ý chuyên môn vô cùng xác đáng cho nhóm trong suốt quá trình thực hiện đồ án.
> 
> Nhờ sự chỉ dẫn tâm huyết của Cô, nhóm TONE PINK không chỉ hoàn thành xuất sắc một bài tập lớn trên giảng đường, mà thực sự đã có được một trải nghiệm làm dự án phần mềm chuyên nghiệp, rèn giũa được bản lĩnh kỹ thuật, tinh thần kỷ luật và ngọn lửa đam mê với nghề kỹ sư phần mềm trong tương lai!

---

*Hà Nội, ngày 17 tháng 11 năm 2026*  
**Đại diện nhóm TONE PINK — Nhóm trưởng:**  
*(Đã ký)*  
**Lê Văn An**
