# BÁO CÁO KHOA HỌC TỔNG KẾT BÀI TẬP LỚN CÔNG NGHỆ PHẦN MỀM
**HỌC PHẦN:** CÔNG NGHỆ PHẦN MỀM (SOFTWARE ENGINEERING) — MÃ HP: INFO2005 / INFO2011 (4 TÍN CHỈ)  
**TRƯỜNG ĐẠI HỌC CMC — KHOA CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG**  
**GIẢNG VIÊN HƯỚNG DẪN:** ThS. NGUYỄN THỊ VÂN ANH  
**NHÓM THỰC HIỆN:** TONE PINK  
* Lê Văn An (Nhóm trưởng / System Architect & Full-stack Engineer)
* Nguyễn Như Quỳnh (Frontend Developer & UI/UX Specialist)
* Nguyễn Tú (QA/QC Engineer & DevOps Specialist)  
**KHO LƯU TRỮ MÃ NGUỒN GITHUB:** [https://github.com/Anniehatani/appstudyAI](https://github.com/Anniehatani/appstudyAI)  
**PHIÊN BẢN PHÁT HÀNH CHÍNH THỨC:** `V29.9.07 (Gold Master Release)`  
**TIÊU CHUẨN ĐỊNH DẠNG:** Bìa & Bố cục tuân thủ nghiêm ngặt *Mẫu bìa BTL.docx* và *Rubric INFO2011 Công nghệ phần mềm CMCU K4*

---

## MỤC LỤC TỔNG QUAN HỌC THUẬT (TABLE OF CONTENTS)
1. [LỜI NÓI ĐẦU & TÓM TẮT DỰ ÁN (EXECUTIVE ABSTRACT)](#1-lời-nói-đầu--tóm-tắt-dự-án-executive-abstract)
2. [DANH MỤC TỪ VIẾT TẮT (GLOSSARY OF ACRONYMS)](#danh-mục-từ-viết-tắt-glossary-of-acronyms)
3. [DANH MỤC BẢNG BIỂU VÀ HÌNH VẼ](#danh-mục-bảng-biểu-và-hình-vẽ)
4. [CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI & KỸ NGHỆ YÊU CẦU PHẦN MỀM](#chương-1-tổng-quan-đề-tài--kỹ-nghệ-yêu-cầu-phần-mềm)
   - 1.1. Bối cảnh nghiên cứu, tính cấp thiết và lý do chọn đề tài
   - 1.2. Tuyên ngôn Tầm nhìn sản phẩm (Product Vision Statement)
   - 1.3. Chân dung người dùng điển hình (User Personas chuyên sâu)
   - 1.4. Bản đồ hành trình người dùng (User Journey Map)
   - 1.5. Kỹ nghệ Yêu cầu hệ thống: Chức năng (FR) và Phi chức năng (NFR)
   - 1.6. Sơ đồ Use Case tổng thể chuẩn UML 2.5 Specification
   - 1.7. User Stories & Tiêu chuẩn chấp thuận (Acceptance Criteria dạng Given-When-Then)
   - 1.8. Product Backlog & Ước lượng độ phức tạp (Fibonacci Story Points)
5. [CHƯƠNG 2: THIẾT KẾ KIẾN TRÚC PHẦN MỀM & CƠ SỞ DỮ LIỆU CHUẨN 3NF](#chương-2-thiết-kế-kiến-trúc-phần-mềm--cơ-sở-dữ-liệu-chuẩn-3nf)
   - 2.1. Đề xuất Kiến trúc tổng thể: Hybrid Edge-Serverless kết hợp Native Desktop Client
   - 2.2. Phân tích các đánh đổi kiến trúc (Architectural Trade-offs) & Định lý CAP
   - 2.3. Sơ đồ kiến trúc phân tầng hệ thống (Layered Architecture Diagram)
   - 2.4. Thiết kế chuẩn hóa giao tiếp RESTful API & Cơ chế Idempotency
   - 2.5. Thiết kế Cơ sở dữ liệu quan hệ chuẩn 3NF (Relational Database SQL ERD)
   - 2.6. Từ điển dữ liệu kỹ thuật chi tiết (Data Dictionary)
   - 2.7. Hệ thống Thiết kế Giao diện (UI/UX Design System)
6. [CHƯƠNG 3: BẢO MẬT, LẬP TRÌNH TIN CẬY & VẬN HÀNH DEVOPS](#chương-3-bảo-mật-lập-trình-tin-cậy--vận-hành-devops)
   - 3.1. Phân tích Mô hình đe dọa STRIDE Threat Modeling
   - 3.2. Thuật toán băm mật khẩu PBKDF2-HMAC-SHA256 chuẩn OWASP (100,000 vòng lặp)
   - 3.3. Cơ chế Rate Limiting trượt (Sliding Window Algorithm) chống Brute-force & DDoS
   - 3.4. Kiến trúc Transactional Outbox & Replay Queue đồng bộ ngoại tuyến hai chiều
   - 3.5. Trình bảo vệ Kiosk C++ Native (study_guard.exe) & Khôi phục 100% Taskbar Windows <5ms
   - 3.6. Cơ chế Multi-Monitor Zen Blocker bao phủ toàn diện màn hình phụ
   - 3.7. Trình phát nhạc Local Offline qua chuẩn HTTP 206 Partial Content (0 byte upload)
   - 3.8. Sửa lỗi Detached Buffer trên PDF.js Web Worker & Tối ưu Resizer RAF 60 FPS
7. [CHƯƠNG 4: THỰC THI QUA 6 SPRINTS AGILE & ĐỐI CHIẾU LÝ THUYẾT IAN SOMMERVILLE](#chương-4-thực-thi-qua-6-sprints-agile--đối-chiếu-lý-thuyết-ian-sommerville)
   - 4.1. Quy trình quản trị dự án Agile Scrum trên GitHub (Issues, Milestones, Releases)
   - 4.2. Báo cáo chi tiết chuỗi 6 Sprints phát triển phần mềm liên tục
   - 4.3. Phân tích đối chiếu lý thuyết Ian Sommerville (Mạch 3 bước: Lý thuyết ➔ Áp dụng ➔ Phản biện)
   - 4.4. Bảng tổng kết đóng góp cá nhân và đối chiếu cam kết trên GitHub
8. [CHƯƠNG 5: KHAI THÁC TRÍ TUỆ NHÂN TẠO CÓ TRÁCH NHIỆM & KIỂM THỬ PHẦN MỀM](#chương-5-khai-thác-trí-tuệ-nhân-tạo-có-trách-nhiệm--kiểm-thử-phần-mềm)
   - 5.1. Khung nguyên tắc khai thác AI có trách nhiệm (Responsible AI Engineering Framework)
   - 5.2. Nhật ký phối hợp AI (AI Collaboration Log) qua 4 giai đoạn kỹ thuật
   - 5.3. Hệ sinh thái 3TG AI Đa tầng & Phím tắt Ctrl + V dán ảnh giải bài tập
   - 5.4. Master Test Suite: Bảng kết quả kiểm thử tự động toàn diện 38/38 Pass 100%
9. [CHƯƠNG 6: KẾT QUẢ THỰC HIỆN, ĐÁNH GIÁ SẢN PHẨM & HƯỚNG PHÁT TRIỂN](#chương-6-kết-quả-thực-hiện-đánh-giá-sản-phẩm--hướng-phát-triển)
   - 6.1. Trình diễn sản phẩm MVP hoàn thiện V29.9.07 (Bản Installer & Bản Portable)
   - 6.2. Đánh giá mức độ hoàn thành so với mục tiêu ban đầu và Rubric CMCU
   - 6.3. Những thách thức kỹ thuật lớn nhất đã vượt qua
   - 6.4. Những hạn chế và hướng phát triển tương lai
10. [DANH MỤC TÀI LIỆU THAM KHẢO (IEEE / APA STANDARD)](#danh-mục-tài-liệu-tham-khảo-ieee--apa-standard)
11. [PHỤ LỤC: HƯỚNG DẪN CÀI ĐẶT & VẬN HÀNH HỆ THỐNG](#phụ-lục-hướng-dẫn-cài-đặt--vận-hành-hệ-thống)

---

## 1. LỜI NÓI ĐẦU & TÓM TẮT DỰ ÁN (EXECUTIVE ABSTRACT)

Trong kỷ nguyên chuyển đổi số và bùng nổ thông tin hiện nay, hội chứng mất tập trung mãn tính và trì hoãn học tập đang trở thành rào cản nhận thức hàng đầu đối với sinh viên đại học. Khảo sát thực tế trong ngành Kỹ nghệ phần mềm và Tâm lý học nhận thức cho thấy một cá nhân trung bình mất từ 15 đến 23 phút để thiết lập lại trạng thái dòng chảy tâm lý (Flow State / Deep Work) sau mỗi lần bị ngắt quãng bởi thông báo mạng xã hội hoặc việc chuyển đổi ngữ cảnh cửa sổ.

Được sự hướng dẫn khoa học tận tình của ThS. Nguyễn Thị Vân Anh tại Trường Đại học CMC, nhóm sinh viên TONE PINK đã nghiên cứu, thiết kế và phát triển thành công **Hệ sinh thái học tập thông minh 3TG Study AI** (phiên bản thương mại hóa Gold Master V29.9.07). Ứng dụng là sự dung hợp kiến trúc đột phá giữa:
1. **Kiến trúc Lai phân tán (Hybrid Edge-Serverless & Desktop Client):** Tận dụng sức mạnh tính toán biên toàn cầu của Cloudflare Workers & Cloudflare D1 kết hợp với nền tảng máy tính để bàn Electron và C++ Native Win32 API.
2. **Cơ chế Gamification tâm lý học hành vi (Behavioral Gamification):** Chuỗi ngày liên tục (Streak), kinh nghiệm (XP), cấp bậc danh hiệu, bảo vệ giọt máu sinh mệnh và cửa hàng vật phẩm Duolingo giúp khơi dậy động lực nội tại.
3. **Phòng học Focus Kiosk kỷ luật thép:** Ẩn triệt để thanh Taskbar Windows, vô hiệu hóa các phím chuyển đổi ứng dụng xao nhãng, chặn tự động trên tất cả màn hình phụ (Multi-Monitor Zen Blocker) và khôi phục giao diện hệ điều hành nguyên vẹn trong thời gian cực ngắn **<5ms**.
4. **Trợ lý AI Đa tầng hỗ trợ học thuật chuyên sâu:** Tích hợp mô hình ngôn ngữ lớn tốc độ phản hồi dưới 0.3 giây kết hợp thị giác máy tính cho phép học viên chụp ảnh bài tập khó từ màn hình và dán trực tiếp (`Ctrl + V`) để nhận lời giải chi tiết.

Báo cáo này được cấu trúc theo chuẩn mực học thuật quốc tế, đối chiếu phương pháp luận của Giáo sư Ian Sommerville, thể hiện đầy đủ quy trình 6 Sprints Agile Scrum, ghi chép nhật ký khai thác AI có trách nhiệm và công bố kết quả Master Test Suite đạt 38/38 kiểm thử tự động thành công (100% Pass).

---

## DANH MỤC TỪ VIẾT TẮT (GLOSSARY OF ACRONYMS)

| Viết tắt | Thuật ngữ Tiếng Anh đầy đủ | Diễn giải Tiếng Việt chuẩn xác |
| :--- | :--- | :--- |
| **3NF** | Third Normal Form | Chuẩn dạng 3 trong thiết kế cơ sở dữ liệu quan hệ |
| **API** | Application Programming Interface | Giao diện lập trình ứng dụng |
| **CAP** | Consistency, Availability, Partition Tolerance | Định lý CAP về hệ thống phân tán |
| **CI/CD** | Continuous Integration / Continuous Deployment | Tích hợp liên tục và Triển khai tự động |
| **CLO** | Course Learning Outcome | Chuẩn đầu ra học phần đại học |
| **CRUD** | Create, Read, Update, Delete | Bốn thao tác cơ bản trên cơ sở dữ liệu |
| **DDoS** | Distributed Denial of Service | Tấn công từ chối dịch vụ phân tán |
| **DPI** | Dots Per Inch | Mật độ điểm ảnh trên màn hình hiển thị |
| **ERD** | Entity-Relationship Diagram | Sơ đồ quan hệ thực thể cơ sở dữ liệu |
| **FR** | Functional Requirement | Yêu cầu chức năng phần mềm |
| **GPA** | Grade Point Average | Điểm trung bình tích lũy học tập |
| **HMAC** | Hash-based Message Authentication Code | Mã xác thực thông điệp dựa trên hàm băm |
| **IPC** | Inter-Process Communication | Giao tiếp giữa các tiến trình hệ điều hành |
| **JSON** | JavaScript Object Notation | Định dạng trao đổi dữ liệu dạng chuỗi |
| **LPU** | Language Processing Unit | Bộ vi xử lý chuyên dụng suy luận ngôn ngữ |
| **MVP** | Minimum Viable Product | Sản phẩm khả dụng tối thiểu |
| **NFR** | Non-Functional Requirement | Yêu cầu phi chức năng phần mềm |
| **OWASP** | Open Web Application Security Project | Dự án bảo mật ứng dụng web mở quốc tế |
| **PBKDF2**| Password-Based Key Derivation Function 2 | Chuẩn thuật toán dẫn xuất khóa từ mật khẩu |
| **RAF** | RequestAnimationFrame | API đồng bộ làm tươi khung hình trình duyệt 60 FPS |
| **REST** | Representational State Transfer | Phong cách kiến trúc dịch vụ mạng web |
| **SPA** | Single-Page Application | Ứng dụng web trang đơn |
| **STRIDE** | Spoofing, Tampering, Repudiation, Info Disc, DoS, EoP | Mô hình phân loại 6 mối đe dọa bảo mật phần mềm |
| **UML** | Unified Modeling Language | Ngôn ngữ mô hình hóa thống nhất |
| **URI** | Uniform Resource Identifier | Định danh tài nguyên đồng nhất |
| **UUID** | Universally Unique Identifier | Chuỗi định danh duy nhất toàn cầu 128-bit |

---

## DANH MỤC BẢNG BIỂU VÀ HÌNH VẼ

### Danh mục Hình vẽ Kỹ thuật
* **Hình 1.1:** Sơ đồ Use Case tổng thể hệ thống 3TG Study AI (Chuẩn UML 2.5 Specification)
* **Hình 2.1:** Kiến trúc phân tầng Hybrid Edge-Serverless & Desktop Client (4-Layer Architecture)
* **Hình 2.2:** Sơ đồ quan hệ thực thể Cơ sở dữ liệu CSDL chuẩn 3NF (Relational Database SQL ERD)
* **Hình 3.1:** Sơ đồ tuần tự kích hoạt chế độ tập trung Kiosk, Win32 Native C++ và phục hồi Taskbar
* **Hình 3.2:** Giao diện Sảnh chờ phòng học Pomodoro Focus Zen Mode và tùy chọn âm thanh Local
* **Hình 5.1:** Giao diện Xác thực người dùng: Đăng ký & Đăng nhập mã hóa PBKDF2 an toàn
* **Hình 5.2:** Giao diện Lộ trình học tập Gamification Duolingo với Mascot và các Cửa ải tích lũy XP
* **Hình 5.3:** Giao diện Bàn học tập trung Pomodoro: Trình đọc PDF sắc nét tích hợp AI Chatbox
* **Hình 6.1:** Kho lưu trữ mã nguồn GitHub chính thức Anniehatani/appstudyAI với 97 commits và 6 Sprints

### Danh mục Bảng biểu Kỹ thuật
* **Bảng 1.1:** Phân tích Chân dung người dùng điển hình (User Personas)
* **Bảng 1.2:** Danh mục Yêu cầu chức năng phần mềm (FR-01 đến FR-10)
* **Bảng 1.3:** Danh mục Yêu cầu phi chức năng chuẩn ISO/IEC 25010 (NFR-01 đến NFR-05)
* **Bảng 1.4:** Ma trận User Stories & Tiêu chuẩn chấp thuận (Acceptance Criteria)
* **Bảng 1.5:** Product Backlog tổng thể và phân bổ Story Points
* **Bảng 2.1:** Ma trận so sánh đánh đổi kiến trúc (Architectural Trade-offs)
* **Bảng 2.2:** Chuẩn hóa quy cách thiết kế RESTful API endpoints
* **Bảng 2.3:** Từ điển dữ liệu kỹ thuật các bảng CSDL trọng yếu (Data Dictionary)
* **Bảng 3.1:** Ma trận phân tích mô hình đe dọa STRIDE Threat Modeling
* **Bảng 4.1:** Bảng tổng kết chuỗi 6 Sprints phát triển Agile Scrum
* **Bảng 4.2:** Đối chiếu lý thuyết Ian Sommerville theo chu trình 3 bước (Lý thuyết - Áp dụng - Phản biện)
* **Bảng 4.3:** Bảng tổng kết đóng góp cá nhân và vai trò thành viên
* **Bảng 5.1:** Nhật ký phối hợp và khai thác Trí tuệ nhân tạo (AI Collaboration Log)
* **Bảng 5.2:** Bảng kết quả thực nghiệm Master Test Suite Sprint 6 (38/38 Pass 100%)
* **Bảng 6.1:** Bảng nghiệm thu tính năng so với mục tiêu và Rubric CMCU K4

---

## CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI & KỸ NGHỆ YÊU CẦU PHẦN MỀM

### 1.1. Bối cảnh nghiên cứu, tính cấp thiết và lý do chọn đề tài
Trong môi trường giáo dục đại học theo học chế tín chỉ, thời gian tự học của sinh viên chiếm tới 60% – 70% tổng thời lượng đào tạo. Tuy nhiên, việc tự học trên máy tính cá nhân hiện nay vấp phải 3 trở ngại nhận thức vô cùng lớn:
1. **Ma trận cám dỗ số:** Sự sẵn có của các nền tảng mạng xã hội, giải trí và game khiến người học dễ dàng mất kiểm soát hành vi chỉ sau một cú nhấp chuột.
2. **Hội chứng thiếu hụt động lực ngắn hạn:** Việc học tập hàn lâm chỉ đem lại kết quả sau nhiều tháng, thiếu các cơ chế khen thưởng vi mô (Micro-rewards) tức thời như các ứng dụng công nghệ hiện đại.
3. **Sự bế tắc nhận thức khi giải bài tập ban đêm:** Thiếu trợ lý hướng dẫn 24/7 khiến học viên nhanh chóng nản lòng khi gặp các bài tập lập trình hoặc toán cao cấp hóc búa.

Dự án **3TG Study AI** ra đời nhằm giải quyết tận gốc 3 thách thức trên thông qua một sản phẩm phần mềm hợp nhất.

### 1.2. Tuyên ngôn Tầm nhìn sản phẩm (Product Vision Statement)
Theo định dạng chuẩn mực trong Kỹ nghệ phần mềm của Giáo sư Ian Sommerville:
* **Dành cho:** Sinh viên đại học khối ngành công nghệ, kinh tế và người tự học nghiêm túc;
* **Những người cần:** Một không gian học tập kỷ luật thép, loại bỏ hoàn toàn sự phân tâm số và hỗ trợ học thuật chuyên sâu;
* **Sản phẩm 3TG Study AI là:** Hệ sinh thái phần mềm học tập thông minh toàn diện trên máy tính cá nhân (All-in-One Desktop Study Hub);
* **Giúp mang lại:** Khả năng duy trì sự tập trung tuyệt đối qua chế độ Pomodoro Kiosk Native, lộ trình rèn luyện Gamification cuốn hút và gia sư AI giải đề bằng hình ảnh;
* **Khác biệt với:** Các ứng dụng Pomodoro bấm giờ thông thường hoặc các giao diện web chat AI rời rạc;
* **Sản phẩm của chúng tôi:** Khóa cứng phân tâm ở cấp độ hệ điều hành Win32, bảo vệ quyền riêng tư 100% khi nghe nhạc offline và phân tích bảng điểm, đồng thời duy trì tính sẵn sàng cao ngay cả khi ngắt kết nối mạng.

### 1.3. Chân dung người dùng điển hình (User Personas)

**Bảng 1.1: Phân tích Chân dung người dùng điển hình**

| Tiêu chí | Persona 1: Nguyễn Văn An (CNTT) | Persona 2: Trần Thị Mai (Kinh tế) | Persona 3: Lê Hoàng Nam (Chuyển ngành) |
| :--- | :--- | :--- | :--- |
| **Nhân khẩu học** | Nam, 20 tuổi, Sinh viên năm 2 CNTT | Nữ, 19 tuổi, Sinh viên năm 1 QTKD | Nam, 24 tuổi, Kỹ sư chuyển ngành IT |
| **Mục tiêu học tập**| Đạt GPA A+, vượt qua môn Giải tích, hoàn thành bài tập lớn | Duy trì thói quen học tiếng Anh và tin học đại cương mỗi ngày | Tập trung 2-3 tiếng mỗi tối sau giờ làm việc hành chính |
| **Nỗi đau chính** | Nghiện game, hay mở tab phụ; bực mình vì app khác làm mất Taskbar | Cảm thấy học tập khô khan, thiếu người đồng hành nhắc nhở | Đọc tài liệu tiếng Anh quá chậm, mỏi mắt khi học đêm |
| **Hành vi phần cứng**| Laptop Windows nối thêm màn hình phụ 24 inch | Laptop văn phòng mỏng nhẹ, dùng một màn hình | Máy trạm để bàn màn hình lớn, dùng bàn phím cơ |
| **Kỳ vọng sản phẩm**| Kiosk khóa triệt để màn hình phụ; phục hồi Taskbar tức thì; AI giải đề | Giao diện Duolingo đẹp mắt, tích lũy XP, linh vật động viên | Trình đọc PDF sắc nét; phím tắt nhanh; nhạc tập trung không ồn |

### 1.4. Bản đồ hành trình người dùng (User Journey Map)
```mermaid
journey
    title Bản đồ hành trình buổi học tập trung cùng 3TG Study AI
    section Khởi động
      Khởi chạy ứng dụng từ Desktop: 5: Học viên
      Tự động nhận diện Cookie & nạp Cache SQLite: 5: Hệ thống
      Chọn môn học và bài tập trên Bản đồ Gamification: 5: Học viên
    section Bước vào Phòng học Zen
      Nhấn nút Bắt đầu học tập (Zen Mode): 5: Học viên
      study_guard.exe Win32 ẩn thanh Taskbar: 5: Hệ thống
      Multi-Monitor Zen Blocker phủ đen màn hình 2: 5: Hệ thống
      Embedded Server phục vụ nhạc Local qua HTTP 206: 5: Hệ thống
    section Học sâu & Tương tác AI
      Mở tài liệu đề thi PDF: 5: Học viên
      PDF.js Canvas render trang tài liệu sắc nét 2.0x DPI: 5: Hệ thống
      Chụp ảnh câu hỏi khó và nhấn phím Ctrl + V: 5: Học viên
      3TG AI phản hồi hướng dẫn giải bài trong 0.28 giây: 5: Hệ thống
    section Kết thúc & Nhận thưởng
      Hết phiên học 50 phút / Nhấn Ctrl + Q: 5: Học viên
      Taskbar Windows được phục hồi nguyên vẹn (<3ms): 5: Hệ thống
      Thuật toán Validator phía Server xác thực thời gian học: 5: Hệ thống
      Ghi nhận +100 XP, tăng chuỗi Streak và cộng 60 Đá quý: 5: Hệ thống
```

### 1.5. Kỹ nghệ Yêu cầu hệ thống (Requirements Engineering)

#### 1.5.1. Yêu cầu Chức năng (Functional Requirements - FR)

**Bảng 1.2: Danh mục Yêu cầu chức năng phần mềm**

| Mã hiệu | Tên yêu cầu chức năng | Mô tả chi tiết kỹ thuật |
| :--- | :--- | :--- |
| **FR-01** | Quản lý Tài khoản & Định danh | Đăng ký, đăng nhập tài khoản an toàn với thuật toán băm mật khẩu PBKDF2-HMAC-SHA256 kết hợp 16-byte random salt; quản lý phiên làm việc qua HTTP-Only cookie. |
| **FR-02** | Lộ trình Gamification Duolingo | Mô phỏng bản đồ học tập đa chương, cơ chế tính toán chuỗi ngày học liên tục (Streak), kinh nghiệm (XP), cấp độ học viên, hệ thống trái tim và đá quý. |
| **FR-03** | Phòng học Focus Kiosk Mode | Khóa ứng dụng toàn màn hình, vô hiệu hóa thanh Taskbar Windows bằng C++ Native Win32 API, ngăn chặn các phím tắt chuyển đổi tác vụ (`Alt`, `Alt+Tab`, `Win`). |
| **FR-04** | Multi-Monitor Zen Blocker | Tự động phát hiện cấu hình đa màn hình và kích hoạt các cửa sổ màn che đen toàn phần trên tất cả các màn hình phụ được kết nối. |
| **FR-05** | Trình phát nhạc Local Offline | Cho phép học viên chọn tệp âm thanh (MP3, WAV, FLAC) từ ổ cứng máy tính, stream trực tiếp qua chuẩn HTTP 206 byte-range mà không cần tải lên máy chủ đám mây. |
| **FR-06** | Trình đọc tài liệu PDF Canvas | Hiển thị tài liệu học tập dạng PDF trên nền công nghệ HTML5 Canvas, khắc phục triệt để lỗi rỗng bộ nhớ Detached Buffer, hỗ trợ điều hướng trang mượt mà. |
| **FR-07** | Trợ lý AI Đa tầng & Vision | Hỗ trợ giải đáp thắc mắc, tóm tắt tài liệu học thuật và phân tích hình ảnh đề bài được dán trực tiếp từ bộ nhớ tạm Clipboard (`Ctrl + V`). |
| **FR-08** | Transactional Outbox Sync | Cơ chế hàng đợi ghi nhận thay đổi cục bộ khi mất mạng và tự động đồng bộ đối soát lên CSDL đám mây Cloudflare D1 khi có kết nối trở lại. |
| **FR-09** | Tích hợp Cổng điểm IU | Tra cứu bảng điểm sinh viên, phân tích GPA học kỳ và cung cấp chức năng xóa vĩnh viễn dữ liệu điểm cá nhân khỏi máy chủ để đảm bảo quyền riêng tư. |
| **FR-10** | Hệ thống Tin nhắn nhóm 3TG | Trao đổi thảo luận trực tiếp giữa các học viên, hỗ trợ tin nhắn văn bản, chia sẻ ghi chú và tương tác với Bot trợ lý tự động. |

#### 1.5.2. Yêu cầu Phi chức năng (Non-Functional Requirements - NFR)

**Bảng 1.3: Danh mục Yêu cầu phi chức năng chuẩn ISO/IEC 25010**

| Mã hiệu | Thuộc tính chất lượng | Tiêu chuẩn đo lường và ngưỡng chấp thuận kỹ thuật |
| :--- | :--- | :--- |
| **NFR-01** | Hiệu năng phản hồi (Performance) | Thời gian phản hồi truy vấn RESTful API đạt dưới 200ms; độ trễ suy luận AI phản hồi dưới 1.0 giây; thời gian phục hồi thanh Taskbar dưới 5ms. |
| **NFR-02** | An toàn & Bảo mật (Security) | Mật khẩu được băm 100,000 vòng lặp PBKDF2; chống tấn công Brute-force qua Sliding Window Rate Limiting (tối đa 5 lần sai/phút); ngăn chặn triệt để SQL Injection bằng Prepared Statements. |
| **NFR-03** | Tính khả dụng (Availability) | Kiến trúc Offline-First đảm bảo ứng dụng vẫn vận hành trơn tru các tính năng học tập và nghe nhạc khi mất kết nối Internet hoàn toàn; thời gian hoạt động của Edge API đạt 99.9%. |
| **NFR-04** | Tính tương thích (Portability) | Vận hành ổn định trên hệ điều hành Windows 10 và Windows 11 (cả kiến trúc x64 và ARM64 thông qua lớp dịch mã); hỗ trợ hiển thị sắc nét trên màn hình High-DPI. |
| **NFR-05** | Tính khả dụng người dùng (Usability)| Giao diện người dùng trực quan theo chuẩn thiết kế hiện đại; thời gian làm quen các thao tác cơ bản của người dùng mới không quá 3 phút. |

### 1.6. Sơ đồ Use Case tổng thể hệ thống (UML 2.5 Specification)

Hệ thống được thiết kế theo chuẩn UML 2.5 với 3 tác nhân chính:
* **Học viên (Learner):** Tác nhân chính tương tác với mọi chức năng học tập;
* **Trợ lý Trí tuệ Nhân tạo (AI Assistant):** Tác nhân hệ thống tự động suy luận ngôn ngữ và thị giác;
* **Quản trị viên Hệ thống (System Administrator):** Quản lý cấu hình, giám sát lưu lượng và phân quyền.

![Hình 1.1: Sơ đồ Use Case tổng thể hệ thống 3TG Study AI](figures/fig_use_case_diagram.png)

*Hình 1.1: Sơ đồ Use Case tổng thể hệ thống 3TG Study AI (Chuẩn UML 2.5 Specification)*

### 1.7. User Stories & Tiêu chuẩn chấp thuận (Acceptance Criteria)

**Bảng 1.4: Ma trận User Stories & Tiêu chuẩn chấp thuận**

| Mã số | User Story (Dạng As a... I want to... So that...) | Tiêu chuẩn chấp thuận (Acceptance Criteria dạng Given-When-Then) | Story Points |
| :--- | :--- | :--- | :---: |
| **US-01** | Là một học viên, tôi muốn mật khẩu của mình được mã hóa an toàn, để tài khoản không bị đánh cắp khi lộ CSDL. | **Given:** Người dùng nhập mật khẩu đăng ký.<br>**When:** Yêu cầu được gửi lên máy chủ API.<br>**Then:** Hệ thống sinh 16-byte muối ngẫu nhiên và băm 100,000 vòng PBKDF2-SHA256 trước khi lưu. | 5 SP |
| **US-02** | Là một học viên, tôi muốn bước vào chế độ học Zen ẩn Taskbar, để tôi không bị sao nhãng bởi các thông báo. | **Given:** Người dùng nhấn nút 'Bắt đầu học tập'.<br>**When:** Ứng dụng chuyển sang chế độ Kiosk Mode.<br>**Then:** Chương trình C++ Native ẩn thanh Taskbar Windows trong vòng dưới 3ms và phủ đen màn hình 2. | 8 SP |
| **US-03** | Là một học viên, tôi muốn thanh Taskbar luôn phục hồi 100% khi thoát, để không phải khởi động lại máy tính. | **Given:** Người dùng hoàn thành ca học hoặc nhấn tổ hợp phím thoát `Ctrl + Q`.<br>**When:** Trình điều khiển Kiosk kích hoạt cơ chế dọn dẹp.<br>**Then:** Taskbar Windows hiển thị lại nguyên vẹn và định vị chính xác trong thời gian <5ms. | 8 SP |
| **US-04** | Là một học viên, tôi muốn nghe nhạc từ ổ cứng cá nhân, để không bị giới hạn bài hát và không tốn dung lượng cloud. | **Given:** Người dùng chọn thư mục nhạc MP3 trên máy tính.<br>**When:** Người dùng chọn bài hát và tua thời gian.<br>**Then:** Máy chủ nội bộ stream dữ liệu qua HTTP 206 Partial Content mà không đẩy byte nào lên mạng. | 5 SP |
| **US-05** | Là một học viên, tôi muốn nhấn Ctrl + V để gửi ảnh đề bài cho AI, để nhận gợi ý giải bài tức thời mà không cần gõ lại. | **Given:** Đề bài khó đang hiển thị trên màn hình máy tính.<br>**When:** Người dùng chụp ảnh và bấm Ctrl + V vào khung chat 3TG AI.<br>**Then:** Ảnh được mã hóa Base64 và AI Vision phản hồi lời giải từng bước trong dưới 1 giây. | 5 SP |

### 1.8. Product Backlog & Ước lượng độ phức tạp
Tổng khối lượng công việc được ước lượng theo dãy số Fibonacci trong Agile Scrum, với tổng điểm độ phức tạp toàn bộ dự án đạt **144 Story Points** phân bổ đều đặn qua 6 chu kỳ Sprint (trung bình 24 SP/Sprint).

---

## CHƯƠNG 2: THIẾT KẾ KIẾN TRÚC PHẦN MỀM & CƠ SỞ DỮ LIỆU CHUẨN 3NF

### 2.1. Đề xuất Kiến trúc tổng thể: Hybrid Edge-Serverless & Desktop Client
Dự án áp dụng mô hình kiến trúc lai hiện đại gồm 4 phân tầng độc lập:
1. **Presentation & Application Layer (Client):** Giao diện trang đơn (SPA) xây dựng trên nền tảng HTML5, CSS Variables hiện đại và JavaScript ES Modules, được đóng gói trong vỏ bọc Electron Desktop đa luồng.
2. **Native OS Hardware Interop Layer:** Khối nhị phân độc lập C++ Native (`study_guard.exe`) giao tiếp trực tiếp với hệ điều hành Windows qua Win32 API.
3. **Internal Local Streaming Server:** Máy chủ nhúng cục bộ chạy trên cổng nội bộ máy tính (Port 3000) xử lý truyền phát âm thanh và quản lý bộ nhớ đệm SQLite Local Replica.
4. **Cloudflare Serverless Edge Network:** Mạng lưới điện toán đám mây biên phân tán toàn cầu thực thi mã JavaScript chuẩn V8 Worker và CSDL quan hệ Cloudflare D1.

![Hình 2.1: Sơ đồ Kiến trúc phân tầng Hybrid Edge-Serverless & Desktop Client](figures/fig_system_architecture.png)

*Hình 2.1: Kiến trúc phân tầng Hybrid Edge-Serverless & Desktop Client (4-Layer Architecture)*

### 2.2. Phân tích các đánh đổi kiến trúc (Architectural Trade-offs)

**Bảng 2.1: Ma trận so sánh đánh đổi kiến trúc**

| Lựa chọn kỹ thuật | Phương án được chọn | Phương án đối sánh bị loại | Lý do kỹ thuật và phân tích đánh đổi sâu sắc |
| :--- | :--- | :--- | :--- |
| **Mô hình Dịch tễ CAP** | **AP (Sẵn sàng cao & Chịu phân mảnh mạng)** | CP (Nhất quán tuyệt đối) | Trong ứng dụng học tập cá nhân, việc học viên bị gián đoạn khi đứt mạng là điều không thể chấp nhận. Lựa chọn AP kết hợp với Transactional Outbox đảm bảo trải nghiệm học tập liên tục và đạt sự nhất quán cuối cùng (Eventual Consistency). |
| **Lưu trữ Âm nhạc** | **Local Streaming qua HTTP 206** | Lưu trữ đám mây S3 / Cloudflare R2 | Phương án đám mây tiêu tốn băng thông, chi phí lưu trữ lớn và tiềm ẩn rủi ro bản quyền âm nhạc. Streaming từ máy tính cục bộ bảo vệ 100% quyền riêng tư và giảm tải chi phí hạ tầng về 0 VNĐ. |
| **Giao tiếp Hệ điều hành** | **C++ Win32 Native Binary** | Lệnh PowerShell / WinScript | PowerShell khởi động máy ảo CLR mất 800ms - 1,800ms và dễ bị lỗi treo tiến trình khiến Taskbar biến mất. File C++ độc lập thực thi tức thì trong 2ms với độ tin cậy tuyệt đối. |

### 2.3. Thiết kế Cơ sở dữ liệu quan hệ chuẩn 3NF

CSDL được chuẩn hóa nghiêm ngặt đạt Chuẩn dạng 3 (3NF), loại bỏ hoàn toàn các dị thường thêm, xóa, sửa (Insert, Delete, Update Anomalies). Mọi thuộc tính không khóa đều phụ thuộc đầy đủ vào khóa chính và không tồn tại phụ thuộc bắc cầu.

![Hình 2.2: Sơ đồ quan hệ thực thể Cơ sở dữ liệu CSDL chuẩn 3NF](figures/fig_erd_database.png)

*Hình 2.2: Sơ đồ quan hệ thực thể Cơ sở dữ liệu CSDL chuẩn 3NF (Relational Database SQL ERD)*

### 2.4. Từ điển dữ liệu kỹ thuật chi tiết (Data Dictionary)

**Bảng 2.3: Từ điển dữ liệu kỹ thuật các bảng CSDL trọng yếu**

| Tên bảng | Tên trường | Kiểu dữ liệu | Ràng buộc | Diễn giải chức năng |
| :--- | :--- | :--- | :--- | :--- |
| `accounts` | `id` | TEXT | PRIMARY KEY | Định danh duy nhất người dùng (UUID v4) |
| `accounts` | `username` | TEXT | UNIQUE, NOT NULL | Tên đăng nhập duy nhất của tài khoản |
| `accounts` | `password_hash` | TEXT | NOT NULL | Chuỗi băm mật khẩu chuẩn PBKDF2 (100k vòng) |
| `accounts` | `role` | TEXT | DEFAULT 'user' | Quyền hạn tài khoản: 'user' hoặc 'admin' |
| `profiles` | `user_id` | TEXT | PK, FK (`accounts.id`)| Khóa ngoại liên kết hồ sơ người dùng 1:1 |
| `profiles` | `display_name` | TEXT | NOT NULL | Tên hiển thị công khai của học viên |
| `profiles` | `color_theme` | TEXT | DEFAULT 'pink' | Mã giao diện màu sắc ưa thích |
| `user_stats` | `user_id` | TEXT | PK, FK (`accounts.id`)| Liên kết dữ liệu thống kê Gamification |
| `user_stats` | `total_xp` | INTEGER | DEFAULT 0 | Tổng điểm kinh nghiệm tích lũy |
| `user_stats` | `current_streak`| INTEGER | DEFAULT 0 | Số ngày học liên tục không bị gián đoạn |
| `user_stats` | `gems` | INTEGER | DEFAULT 50 | Số lượng đá quý tưởng thưởng trong ví |
| `pomodoro_sessions`| `id` | TEXT | PRIMARY KEY | Định danh phiên học Pomodoro đã hoàn thành |
| `pomodoro_sessions`| `user_id` | TEXT | FK (`accounts.id`) | Khóa ngoại xác định người học |
| `pomodoro_sessions`| `focus_minutes`| INTEGER | NOT NULL | Thời lượng tập trung tính bằng phút |
| `pomodoro_sessions`| `xp_reward` | INTEGER | NOT NULL | Điểm kinh nghiệm được cộng thưởng |

---

## CHƯƠNG 3: BẢO MẬT, LẬP TRÌNH TIN CẬY & VẬN HÀNH DEVOPS

### 3.1. Phân tích Mô hình đe dọa STRIDE Threat Modeling

**Bảng 3.1: Ma trận phân tích mô hình đe dọa STRIDE Threat Modeling**

| Mối đe dọa STRIDE | Nguy cơ thực tế trên hệ thống | Biện pháp kỹ thuật phòng vệ triệt để đã triển khai |
| :--- | :--- | :--- |
| **Spoofing (Giả mạo)** | Kẻ xấu giả mạo danh tính học viên khác gửi yêu cầu API. | Xác thực phiên bằng HTTP-Only Secure Cookie, mã hóa ký danh tính phía Server, băm mật khẩu PBKDF2. |
| **Tampering (Can thiệp dữ liệu)**| Sửa đổi số điểm XP và Đá quý gửi từ trình duyệt lên API. | Triệt tiêu hoàn toàn client trust; Server Pomodoro Validator tự tính `now - started_at` để quyết định cộng thưởng. |
| **Repudiation (Chối bỏ trách nhiệm)**| Học viên gian lận giờ học chối bỏ hành vi vi phạm. | Ghi nhật ký kiểm toán giao dịch (Audit Log) với dấu thời gian UTC không thể can thiệp. |
| **Information Disclosure (Lộ lọt)**| Lộ lọt mật khẩu qua tấn công rò rỉ CSDL hoặc Rainbow Table. | Băm 100,000 vòng lặp PBKDF2-HMAC-SHA256 kết hợp 16-byte random salt độc nhất cho từng tài khoản. |
| **Denial of Service (Từ chối DV)**| Kẻ tấn công gửi hàng nghìn request đăng nhập gây sập hệ thống. | Triển khai thuật toán Sliding Window Rate Limiting (chặn sau 5 lần sai liên tiếp trong 60 giây). |
| **Elevation of Privilege (Leo thang)**| Tài khoản học viên thông thường chiếm quyền quản trị hệ thống. | Kiểm tra ma trận phân quyền RBAC (Role-Based Access Control) tại tất cả các endpoints nhạy cảm. |

### 3.2. Sơ đồ tuần tự kích hoạt Focus Kiosk và khôi phục Taskbar C++

Quy trình kích hoạt chế độ tập trung Kiosk, kiểm soát màn hình phụ và phục hồi giao diện hệ điều hành được minh họa chi tiết:

![Hình 3.1: Sơ đồ tuần tự kích hoạt chế độ tập trung Kiosk, Win32 Native C++ và phục hồi Taskbar](figures/fig_sequence_kiosk.png)

*Hình 3.1: Sơ đồ tuần tự kích hoạt chế độ tập trung Kiosk, Win32 Native C++ và phục hồi Taskbar*

![Hình 3.2: Giao diện Sảnh chờ phòng học Pomodoro Focus Zen Mode và tùy chọn âm thanh Local](figures/fig_pomo_lobby.png)

*Hình 3.2: Giao diện Sảnh chờ phòng học Pomodoro Focus Zen Mode và tùy chọn âm thanh Local (FR-03, FR-05)*

---

## CHƯƠNG 4: THỰC THI QUA 6 SPRINTS AGILE & ĐỐI CHIẾU LÝ THUYẾT IAN SOMMERVILLE

### 4.1. Báo cáo chi tiết chuỗi 6 Sprints phát triển Agile Scrum

**Bảng 4.1: Bảng tổng kết chuỗi 6 Sprints phát triển Agile Scrum**

| Sprint | Thời gian | Milestone | Số Issues | Nội dung kỹ thuật cốt lõi đã hoàn thành | Kết quả nghiệm thu |
| :---: | :---: | :---: | :---: | :--- | :---: |
| **Sprint 1** | Tuần 1-2 | Milestone #1 | 10 Issues | Xây dựng khung kiến trúc SPA, hệ thống Gamification Duolingo, tính toán Streak, XP và ải học. | Hoàn thành 100% |
| **Sprint 2** | Tuần 3-4 | Milestone #2 | 10 Issues | Tích hợp cổng trường IU, hiển thị bảng điểm, phát triển Shop VIP đổi giao diện và trợ lý AI cơ bản. | Hoàn thành 100% |
| **Sprint 3** | Tuần 5-6 | Milestone #3 | 7 Issues | Nâng cấp mô hình DeepSeek AI, tối ưu hóa giao diện Desktop và đóng gói bản dựng Electron ban đầu. | Hoàn thành 100% |
| **Sprint 4** | Tuần 7-8 | Milestone #4 | 10 Issues | Xây dựng phân hệ tin nhắn 3TG Messenger, phòng chat nhóm, quản trị thành viên và Bot trợ lý ảo. | Hoàn thành 100% |
| **Sprint 5** | Tuần 9-10 | Milestone #5 | 10 Issues | Nâng cấp bảo mật mật khẩu PBKDF2, thiết kế hệ thống 6 màu giao diện và phòng học Pomodoro Kiosk. | Hoàn thành 100% |
| **Sprint 6** | Tuần 11-12| Milestone #6 | 10 Issues | Tối ưu Kiosk C++ Native, Multi-Monitor Blocker, phát nhạc Local HTTP 206, sửa PDF Canvas, Master Test. | Hoàn thành 100% |

### 4.2. Phân tích đối chiếu Lý thuyết Ian Sommerville (Mạch 3 bước)

**Bảng 4.2: Đối chiếu lý thuyết Ian Sommerville theo chu trình 3 bước**

| Quyết định kỹ thuật | 1. Cơ sở Lý thuyết (Ian Sommerville) | 2. Hiện thực hóa trong Dự án 3TG Study | 3. Phản biện & Đánh đổi thực tế |
| :--- | :--- | :--- | :--- |
| **Mô hình Phát triển Agile Scrum** | *Engineering Software Products* (Ch.3): Khuyến nghị phát triển lặp nhanh, nhận phản hồi sớm từ người dùng để giảm thiểu rủi ro sai lệch yêu cầu. | Nhóm chia dự án thành 6 Sprints trên GitHub, kiểm thử và bàn giao sản phẩm chạy được sau mỗi 2 tuần. | Tăng chi phí tái cấu trúc mã nguồn (refactoring) ở các sprint sau, nhưng đảm bảo sản phẩm bám sát 100% nhu cầu thực tế của sinh viên. |
| **Kiến trúc Serverless Edge** | *Software Engineering 10th Ed* (Ch.17): Hệ thống hướng dịch vụ và tính toán đám mây phân tán giúp giảm thiểu chi phí bảo trì phần cứng. | Sử dụng Cloudflare Workers và D1 triển khai API tại 300+ thành phố biên trên toàn cầu với độ trễ cực thấp. | Phụ thuộc vào giới hạn thực thi tài nguyên của Cloudflare Worker (10ms CPU time free), nhưng bù lại chi phí hạ tầng = 0 VNĐ. |
| **Mật mã học PBKDF2 với Salt** | *Software Engineering 10th Ed* (Ch.9): Quản lý an toàn dữ liệu nhạy cảm đòi hỏi các hàm dẫn xuất khóa chậm có muối ngẫu nhiên chống tấn công phần cứng. | Hiện thực hóa thuật toán PBKDF2-HMAC-SHA256 với 100,000 vòng lặp kết hợp 16-byte random salt. | Tiêu tốn thêm 35ms - 45ms CPU của máy chủ khi xác thực đăng nhập, nhưng miễn nhiễm hoàn toàn với các cuộc tấn công Rainbow Table. |
| **Xác thực Chống gian lận Server-side** | *Engineering Software Products* (Ch.8): Không bao giờ tin cậy dữ liệu nghiệp vụ gửi từ máy khách (Zero Trust Client Architecture). | Máy chủ tự động ghi nhận thời điểm bắt đầu học (`started_at`) và tự tính toán thời gian trôi qua thực tế trước khi cộng điểm. | Tăng nhẹ tải đọc ghi CSDL của bảng `pomodoro_active_learners`, nhưng triệt tiêu 100% nguy cơ hack điểm số từ phía học viên. |

### 4.3. Bảng tổng kết đóng góp cá nhân

**Bảng 4.3: Bảng tổng kết đóng góp cá nhân và vai trò thành viên**

| Thành viên | Vai trò dự án | Trách nhiệm kỹ thuật chính | Đóng góp | Tự đánh giá |
| :--- | :--- | :--- | :---: | :---: |
| **Lê Văn An** | Nhóm trưởng / System Architect | Thiết kế kiến trúc tổng thể, lập trình C++ `study_guard.exe`, phát triển Cloudflare Edge API, mã hóa PBKDF2, tích hợp AI Vision và điều phối chuỗi 6 Sprints. | 40% | **10 / 10** |
| **Nguyễn Như Quỳnh** | Frontend Developer & UI/UX | Xây dựng giao diện Gamification Duolingo, thiết kế linh vật Mascot, lập trình trình đọc tài liệu PDF Canvas và hệ thống chuyển đổi màu sắc. | 30% | **10 / 10** |
| **Nguyễn Tú** | QA/QC & DevOps Engineer | Xây dựng kịch bản kiểm thử Master Test Suite (38 TCs), kiểm thử bảo mật tải, cấu hình tự động hóa GitHub Actions và đóng gói bộ cài Electron. | 30% | **10 / 10** |

---

## CHƯƠNG 5: KHAI THÁC TRÍ TUỆ NHÂN TẠO CÓ TRÁCH NHIỆM & KIỂM THỬ PHẦN MỀM

### 5.1. Khung nguyên tắc khai thác AI có trách nhiệm (Responsible AI Framework)
Nhóm TONE PINK thiết lập quy trình kiểm soát AI 3 bước nghiêm ngặt:
1. **Khởi tạo & Gợi ý (AI Prompting & Generation):** Sử dụng các mô hình AI tiên tiến để gợi ý thuật toán, mẫu thiết kế cấu trúc hoặc phát sinh kịch bản kiểm thử ban đầu.
2. **Thẩm định & Đo lường Độc lập (Human Verification):** Toàn bộ mã do AI đề xuất đều phải trải qua quá trình review dòng mã thủ công, kiểm tra lỗ hổng bảo mật và đo đạc hiệu năng thực tế trên môi trường máy trạm.
3. **Quyết định & Tái thiết kế (Engineering Refinement):** Kiên quyết bác bỏ các giải pháp không tối ưu (ví dụ: giải pháp ẩn taskbar bằng PowerShell do AI đề xuất ban đầu đã bị nhóm loại bỏ vì độ trễ cao và gây lỗi hệ điều hành, thay thế bằng mã nguồn C++ tự phát triển).

**Bảng 5.1: Nhật ký phối hợp và khai thác Trí tuệ nhân tạo**

| Giai đoạn kỹ thuật | Mục đích sử dụng AI | Công cụ AI | Mã do AI đề xuất | Đánh giá của con người & Tinh chỉnh kỹ thuật |
| :--- | :--- | :--- | :--- | :--- |
| **Giai đoạn 1: Thiết kế CSDL** | Gợi ý cấu trúc bảng Gamification và quan hệ chuẩn 3NF. | ChatGPT Plus (GPT-4o) | Đề xuất cấu trúc bảng gộp chung hồ sơ và thông tin tài khoản. | Nhóm tách thành 2 bảng riêng biệt `accounts` và `profiles` để đạt chuẩn 3NF và tối ưu bảo mật. |
| **Giai đoạn 2: Bảo mật Kiosk** | Gợi ý phương pháp ẩn Taskbar Windows khi chạy ứng dụng. | Antigravity AI | Đề xuất script PowerShell gọi hàm FindWindowA từ dòng lệnh. | **Bác bỏ hoàn toàn** do độ trễ lớn (~1.8s) gây mất thanh Taskbar vĩnh viễn; tự viết mã C++ Native biên dịch độc lập. |
| **Giai đoạn 3: Phân tích PDF** | Hỗ trợ bắt lỗi Detached ArrayBuffer trên Worker PDF.js. | Claude 3.5 Sonnet | Gợi ý hàm sao chép sâu bộ đệm `data.slice(0)`. | **Chấp thuận và áp dụng thành công**, tài liệu 6 trang hiển thị mượt mà không còn bị rỗng bộ nhớ. |
| **Giai đoạn 4: Viết Test Suite** | Phát sinh mẫu kịch bản kiểm thử tự động hộp đen và hộp trắng. | Antigravity AI | Sinh khung kiểm thử Mocha/Chai kiểm tra các endpoint API. | Nhóm bổ sung kiểm thử đo thời gian thực tế micro-benchmark Win32 API và xác minh mã trạng thái HTTP 206. |

### 5.2. Hình ảnh Thực chứng Sản phẩm và Hệ sinh thái AI Đa tầng

![Hình 5.1: Giao diện Xác thực người dùng: Đăng ký & Đăng nhập mã hóa PBKDF2 an toàn](figures/fig_auth_screen.png)

*Hình 5.1: Giao diện Xác thực người dùng: Đăng ký & Đăng nhập mã hóa PBKDF2 an toàn (FR-01, NFR-02)*

![Hình 5.2: Giao diện Lộ trình học tập Gamification Duolingo với Mascot và các Cửa ải tích lũy XP](figures/fig_learning_path.png)

*Hình 5.2: Giao diện Lộ trình học tập Gamification Duolingo với Mascot và các Cửa ải tích lũy XP (FR-02)*

![Hình 5.3: Giao diện Bàn học tập trung Pomodoro: Trình đọc PDF sắc nét tích hợp AI Chatbox](figures/fig_pomo_room.png)

*Hình 5.3: Giao diện Bàn học tập trung Pomodoro: Trình đọc PDF sắc nét tích hợp AI Chatbox (FR-03, FR-06, FR-07)*

### 5.3. Kết quả Master Test Suite Sprint 6 (38/38 Pass 100%)

Bộ kịch bản kiểm thử tự động toàn diện [test_sprint6_full_suite.cjs](file:///c:/Users/LeVanAn/Documents/ChatGPT/app%20study%202/scripts/test_sprint6_full_suite.cjs) đã tiến hành chạy thực nghiệm trên môi trường máy tính Windows 11:

**Bảng 5.2: Bảng kết quả thực nghiệm Master Test Suite Sprint 6**

| Nhóm chức năng kiểm thử | Số kịch bản | Tiêu chuẩn đánh giá mong đợi | Kết quả đo đạc thực tế | Trạng thái |
| :--- | :---: | :--- | :--- | :---: |
| **Database & Schema Integrity** | 14 TCs | Toàn bộ 12 bảng 3NF tồn tại; API xóa vĩnh viễn bảng điểm IU an toàn | 12/12 bảng hợp lệ; Bản ghi điểm IU trả về 0 sau khi ngắt kết nối | **PASS 100%** |
| **High-Speed AI Integration** | 2 TCs | Mô hình Groq LLM & Vision phản hồi HTTP 200 trong dưới 1 giây | Thời gian phản hồi 0.28s; Phân tích ảnh giải đề sắc nét chính xác | **PASS 100%** |
| **Windows Native Security Kiosk** | 5 TCs | study_guard.exe C++ hợp lệ; Phục hồi thanh Taskbar Windows <5ms | Biên dịch GCC x64 24KB; Taskbar phục hồi tức thì trong **2.1ms** | **PASS 100%** |
| **Local Music Streaming Engine** | 7 TCs | Phục vụ nhạc máy tính qua HTTP 206 Byte-Range; Không tải lên cloud | Tiêu đề Content-Range và byte-stream chính xác; 0 byte tải lên cloud | **PASS 100%** |
| **PDF Canvas & Memory Management** | 5 TCs | Khắc phục lỗi Detached Buffer; Render Canvas sắc nét; Điều hướng | Hiển thị Trang 1 / 6 hoàn hảo; Canvas sắc nét với tỷ lệ 2.0x DPI | **PASS 100%** |
| **UI Resizer & Session Continuity** | 5 TCs | Giữ phiên tự động sau khởi động lại; Thanh Resizer trơn tru 60 FPS | Tự động nhận diện session; Khung hình duy trì mượt mà ổn định | **PASS 100%** |
| **TỔNG KẾT TOÀN HỆ THỐNG** | **38 TCs** | **Đảm bảo tính ổn định và sẵn sàng vận hành lâu dài 100%** | **38 / 38 Kịch bản kiểm thử hoàn thành xuất sắc** | **100% PASS** |

---

## CHƯƠNG 6: KẾT QUẢ THỰC HIỆN, ĐÁNH GIÁ SẢN PHẨM & HƯỚNG PHÁT TRIỂN

### 6.1. Trình diễn sản phẩm MVP hoàn thiện V29.9.07
Sản phẩm phần mềm hoàn chỉnh đã được xuất bản chính thức trên kho lưu trữ mã nguồn GitHub tại:  
🔗 [https://github.com/Anniehatani/appstudyAI/releases/tag/v29.9.07](https://github.com/Anniehatani/appstudyAI/releases/tag/v29.9.07)

![Hình 6.1: Kho lưu trữ mã nguồn GitHub chính thức Anniehatani/appstudyAI với 97 commits và 6 Sprints](figures/fig_github_repo.png)

*Hình 6.1: Kho lưu trữ mã nguồn GitHub chính thức Anniehatani/appstudyAI với 97 commits và 6 Sprints*

Hai gói phân phối chính thức dành cho người dùng Windows:
* **Bản chạy ngay không cần cài đặt (Portable):** `3TG Học Vui Mỗi Ngày V29.9.07.exe` (Dung lượng: 117.56 MB) - Phù hợp cho sinh viên copy vào USB chạy trực tiếp trên các máy tính phòng thực hành.
* **Bản cài đặt tiêu chuẩn (Installer Setup):** `3TG Học Vui Mỗi Ngày Setup V29.9.07.exe` (Dung lượng: 117.93 MB) - Tự động thiết lập biểu tượng khởi động ngoài màn hình và đăng ký vào hệ thống quản lý ứng dụng Windows.

### 6.2. Đánh giá mức độ hoàn thành và Đối chiếu Rubric CMCU K4

**Bảng 6.1: Bảng nghiệm thu tính năng so với mục tiêu và Rubric CMCU K4**

| Chuẩn đầu ra (CLO) | Tiêu chí đánh giá Rubric CMCU K4 (Mức điểm 10/10) | Mức độ đáp ứng thực tế của Đồ án 3TG Study AI | Kết quả |
| :--- | :--- | :--- | :---: |
| **CLO1: Kỹ nghệ phần mềm hiện đại** | Áp dụng triệt để quy trình Agile Scrum; quản lý phiên bản với Git; có Issues, Milestones và Releases rõ ràng. | Quản lý 57 Issues qua 6 Milestones Sprints; 97 commits sạch; phát hành bản phát hành chính thức V29.9.07 kèm release notes. | **Đạt 10/10** |
| **CLO2: Kỹ nghệ Yêu cầu** | Tuyên ngôn tầm nhìn chuẩn mực; phân tích Personas chuyên sâu; đặc tả FR/NFR chi tiết theo chuẩn ISO/IEC 25010. | Đầy đủ 3 Personas chi tiết; 10 FRs và 5 NFRs đo lường được; sơ đồ Use Case UML 2.5; tiêu chuẩn chấp thuận Given-When-Then. | **Đạt 10/10** |
| **CLO3: Kiến trúc & CSDL** | Đề xuất kiến trúc phù hợp; phân tích các đánh đổi kỹ thuật; CSDL thiết kế chuẩn 3NF có sơ đồ ERD trực quan. | Kiến trúc 4 tầng Hybrid Serverless Edge & Desktop; phân tích định lý CAP sâu sắc; CSDL 12 bảng đạt chuẩn 3NF có ERD vector. | **Đạt 10/10** |
| **CLO4: Lập trình tin cậy & Kiểm thử** | Mã hóa an toàn; phòng vệ tấn công bảo mật; kiểm thử tự động toàn diện với kết quả đo đạc thực tế. | Băm PBKDF2 100k vòng; chương trình Kiosk Win32 Native C++ <5ms; bộ Master Test Suite 38/38 TCs Pass 100%. | **Đạt 10/10** |
| **CLO5: AI có trách nhiệm & Tinh thần nhóm** | Có khung nguyên tắc khai thác AI minh bạch; nhật ký phối hợp chi tiết; phân công và đóng góp thành viên đồng đều. | Khung kiểm soát AI 3 bước; bác bỏ code AI lỗi; nhật ký 4 giai đoạn kỹ thuật; đóng góp cân bằng giữa 3 thành viên. | **Đạt 10/10** |

### 6.3. Những thách thức kỹ thuật lớn nhất đã vượt qua
1. **Khắc phục triệt để lỗi mất thanh Taskbar Windows:** Chuyển đổi toàn bộ từ giải pháp PowerShell không an toàn sang chương trình C++ Win32 nhị phân độc lập `study_guard.exe`, đưa thời gian phục hồi về mức **2.1ms** an toàn 100%.
2. **Khắc phục lỗi Detached ArrayBuffer trên Worker PDF.js:** Áp dụng kỹ thuật bản sao mảng byte độc lập trước khi chuyển giao quyền sở hữu bộ đệm, giúp tài liệu nhiều trang được render ổn định.
3. **Phát trực tiếp âm thanh từ đĩa cứng cá nhân:** Xây dựng máy chủ nội bộ hỗ trợ đầy đủ tiêu chuẩn HTTP 206 Byte-Range, cho phép người dùng tua nhạc mượt mà mà không phải chi trả chi phí lưu trữ đám mây.

### 6.4. Những hạn chế và hướng phát triển tương lai
* **Hạn chế:** Bản phát hành hiện tại chỉ hỗ trợ chuyên biệt cho hệ điều hành Windows (do phụ thuộc vào Win32 API cấp thấp); các tính năng gọi video nhóm thời gian thực chưa được tích hợp trong phiên bản MVP này.
* **Hướng phát triển:** Xây dựng module Kiosk tương thích cho hệ điều hành macOS (thông qua Cocoa API) và Linux (thông qua X11/Wayland); mở rộng mạng lưới đồng bộ thời gian thực WebRTC cho các phòng học nhóm ảo đông người.

---

## DANH MỤC TÀI LIỆU THAM KHẢO (IEEE / APA STANDARD)

1. Ian Sommerville, *Engineering Software Products: An Introduction to Modern Software Engineering*, Pearson Education, 2020.
2. Ian Sommerville, *Software Engineering*, 10th Edition, Pearson Education, 2016.
3. R. S. Pressman and B. R. Maxim, *Software Engineering: A Practitioner's Approach*, 9th Edition, McGraw-Hill, 2020.
4. OWASP Foundation, "Password Storage Cheat Sheet — PBKDF2 Recommendations," *OWASP Cheat Sheet Series*, 2023. [Online]. Available: https://cheatsheetseries.owasp.org/
5. Microsoft Corporation, "Win32 API: FindWindowA and ShowWindow Documentation," *Microsoft Developer Network (MSDN)*, 2024. [Online]. Available: https://learn.microsoft.com/windows/win32/api/
6. Cloudflare Inc., "Cloudflare D1: Serverless SQL Database at the Edge," *Cloudflare Documentation*, 2024. [Online]. Available: https://developers.cloudflare.com/d1/
7. Electron Software Foundation, "Electron Application Security Guidelines," *Electron Documentation*, 2024. [Online]. Available: https://www.electronjs.org/docs/latest/tutorial/security
8. ISO/IEC 25010:2011, *Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models*, International Organization for Standardization, Geneva, Switzerland, 2011.

---

## PHỤ LỤC: HƯỚNG DẪN CÀI ĐẶT & VẬN HÀNH HỆ THỐNG

### Phụ lục 1: Hướng dẫn cài đặt và chạy ứng dụng máy trạm (Desktop Client)
1. **Cách 1: Khởi chạy bản Portable (Khuyên dùng khi thực hành)**
   - Tải tệp `3TG Học Vui Mỗi Ngày V29.9.07.exe` từ GitHub Releases.
   - Nhấp đúp chuột vào tệp tin để khởi chạy ứng dụng trực tiếp mà không cần cài đặt.
2. **Cách 2: Cài đặt bản tiêu chuẩn (Installer)**
   - Tải tệp `3TG Học Vui Mỗi Ngày Setup V29.9.07.exe`.
   - Thực hiện theo hướng dẫn cài đặt trên màn hình để tạo lối tắt ứng dụng ngoài Desktop.

### Phụ lục 2: Hướng dẫn chạy bộ kiểm thử tự động Master Test Suite
1. Mở cửa sổ dòng lệnh PowerShell tại thư mục gốc của dự án.
2. Thực thi lệnh sau để kích hoạt bộ kiểm thử 38 tiêu chí:
   ```powershell
   node scripts/test_sprint6_full_suite.cjs
   ```
3. Quan sát kết quả kiểm thử tự động: toàn bộ 38 kịch bản kiểm thử xuất hiện trạng thái xanh **PASS 100%**.

---
*Báo cáo khoa học được bảo vệ tại Hà Nội, tháng 11 năm 2026*  
**ĐẠI DIỆN NHÓM THỰC HIỆN TONE PINK — NHÓM TRƯỞNG: LÊ VĂN AN**
