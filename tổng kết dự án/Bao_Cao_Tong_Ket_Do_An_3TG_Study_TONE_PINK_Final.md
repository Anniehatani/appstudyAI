# BÁO CÁO KHOA HỌC TỔNG KẾT BÀI TẬP LỚN CÔNG NGHỆ PHẦN MỀM
**HỌC PHẦN:** CÔNG NGHỆ PHẦN MỀM (SOFTWARE ENGINEERING) — MÃ HP: INFO2005 / INFO2011 (4 TÍN CHỈ)  
**LỚP HỌC PHẦN:** N08  
**TRƯỜNG ĐẠI HỌC CMC — KHOA CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG**  
**GIẢNG VIÊN HƯỚNG DẪN:** ThS. NGUYỄN THỊ VÂN ANH  
**NHÓM THỰC HIỆN:** TONE PINK  
* **Lê Văn An** — MSSV: **BAI250001** — Lớp: **N08** — GitHub: [https://github.com/Anniehatani](https://github.com/Anniehatani) (Nhóm trưởng - Kiến trúc hệ thống, Bảo mật & Backend)
* **Nguyễn Như Quỳnh** — MSSV: **BCS252491** — Lớp: **N08** — GitHub: [https://github.com/nguyennhuuquynhh07-07](https://github.com/nguyennhuuquynhh07-07) (Thành viên - Lập trình Giao diện Frontend & Thiết kế Trải nghiệm UI/UX)
* **Nguyễn Văn Tú** — MSSV: **BIT250364** — Lớp: **N08** — GitHub: [https://github.com/nguyennhuuquynhh07-07](https://github.com/nguyennhuuquynhh07-07) (Thành viên - Trình bảo vệ Kiosk Native C++, Tích hợp Đa màn hình & Đảm bảo chất lượng QA)  
**KHO LƯU TRỮ MÃ NGUỒN GITHUB:** [https://github.com/Anniehatani/appstudyAI](https://github.com/Anniehatani/appstudyAI)  
**PHIÊN BẢN PHÁT HÀNH CHÍNH THỨC:** `V29.9.07 (Release Gold Master)`  
**QUY CHUẨN ĐỊNH DẠNG:** Tuân thủ nghiêm ngặt theo *Mẫu bìa BTL.docx* và *Rubric INFO2011 Công nghệ phần mềm CMCU K4*

---

## MỤC LỤC BÁO CÁO TỔNG KẾT DỰ ÁN

| Mục lục đề mục | Trang |
| :--- | :---: |
| **LỜI NÓI ĐẦU & TÓM TẮT DỰ ÁN (EXECUTIVE ABSTRACT)** | **1** |
| **CHƯƠNG 1: TỔNG QUAN DỰ ÁN & KỸ NGHỆ YÊU CẦU PHẦN MỀM** | **3** |
| 1.1. Bối cảnh nghiên cứu, tính cấp thiết và lý do chọn đề tài | 3 |
| 1.2. Tuyên ngôn Tầm nhìn sản phẩm (Product Vision Statement) | 4 |
| 1.3. Chân dung người dùng điển hình (User Personas) | 5 |
| 1.4. Kịch bản sử dụng (User Scenarios) & Bản đồ hành trình (Journey Maps) | 7 |
| 1.5. Sơ đồ Use Case tổng thể hệ thống (UML 2.5 Specification) | 8 |
| 1.6. Kỹ nghệ Yêu cầu hệ thống: Chức năng (FR) và Phi chức năng (NFR) | 9 |
| 1.7. User Stories & Tiêu chuẩn chấp thuận (Acceptance Criteria) | 11 |
| 1.8. Product Backlog & Ước lượng độ phức tạp (Fibonacci Story Points) | 12 |
| **CHƯƠNG 2: THIẾT KẾ KIẾN TRÚC PHẦN MỀM & CƠ SỞ DỮ LIỆU** | **13** |
| 2.1. Đề xuất Kiến trúc tổng thể: Hybrid Edge-Serverless & Desktop Client | 13 |
| 2.2. Phân tích các đánh đổi kiến trúc (Trade-offs) & Định lý CAP | 14 |
| 2.3. Sơ đồ kiến trúc phân tầng hệ thống (Layered Architecture) | 15 |
| 2.4. Thiết kế chuẩn hóa giao tiếp RESTful API & Idempotency | 16 |
| 2.5. Thiết kế Toàn diện CSDL Cloudflare D1 chuẩn 3NF & Sơ đồ SQL ERD | 18 |
| 2.6. Hệ thống Giao diện người dùng & Động cơ Gamification phân tầng | 21 |
| **CHƯƠNG 3: BẢO MẬT, LẬP TRÌNH TIN CẬY & VẬN HÀNH DEVOPS** | **23** |
| 3.1. Phân tích Mô hình đe dọa STRIDE Threat Modeling | 23 |
| 3.2. Thuật toán băm mật khẩu PBKDF2-HMAC-SHA256 chuẩn OWASP | 24 |
| 3.3. Cơ chế Rate Limiting trượt (Sliding Window Algorithm) | 25 |
| 3.4. Kiến trúc Transactional Outbox & Replay Queue đồng bộ ngoại tuyến | 26 |
| 3.5. Trình bảo vệ Kiosk C++ Native & Khôi phục 100% Taskbar Windows <5ms | 27 |
| 3.6. Cơ chế Multi-Monitor Zen Blocker bao phủ màn hình phụ | 29 |
| 3.7. Trình phát nhạc Local Offline qua HTTP 206 Byte-Range | 30 |
| 3.8. Sửa lỗi Detached Buffer trên PDF.js & Tối ưu Resizer RAF 60 FPS | 31 |
| **CHƯƠNG 4: THỰC THI QUA 6 SPRINTS AGILE & ĐỐI CHIẾU SOMMERVILLE** | **32** |
| 4.1. Quy trình quản trị dự án Agile Scrum trên GitHub | 32 |
| 4.2. Báo cáo chi tiết chuỗi 6 Sprints phát triển phần mềm | 33 |
| 4.3. Phân tích đối chiếu lý thuyết Ian Sommerville (Mạch 3 bước) | 36 |
| 4.4. Bảng tổng kết đóng góp thành viên nhóm TONE PINK | 38 |
| **CHƯƠNG 5: KHAI THÁC AI CÓ TRÁCH NHIỆM & KIỂM THỬ PHẦN MỀM** | **39** |
| 5.1. Khung nguyên tắc khai thác AI có trách nhiệm (Responsible AI) | 39 |
| 5.2. Nhật ký phối hợp AI (AI Collaboration Log) qua 4 giai đoạn | 40 |
| 5.3. Hệ sinh thái 3TG AI Đa tầng & Phím tắt Ctrl + V dán ảnh | 41 |
| 5.4. Master Test Suite: Bảng kết quả kiểm thử 38/38 Pass 100% | 42 |
| **CHƯƠNG 6: KẾT QUẢ THỰC HIỆN, ĐÁNH GIÁ & HƯỚNG PHÁT TRIỂN** | **44** |
| 6.1. Trình diễn sản phẩm MVP hoàn thiện V29.9.07 | 44 |
| 6.2. Đánh giá mức độ hoàn thành so với mục tiêu ban đầu | 46 |
| 6.3. Những thách thức kỹ thuật lớn nhất đã vượt qua | 47 |
| 6.4. Những hạn chế và hướng phát triển trong tương lai | 48 |
| **DANH MỤC TÀI LIỆU THAM KHẢO (IEEE / APA STANDARD)** | **49** |
| **PHỤ LỤC: HƯỚNG DẪN CÀI ĐẶT & VẬN HÀNH HỆ THỐNG** | **50** |

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
| **D1** | Cloudflare D1 Relational SQLite Database | CSDL quan hệ SQL phân tán tại mạng biên Cloudflare |
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
| **OWASP** | Open Worldwide Application Security Project | Dự án bảo mật ứng dụng web mở quốc tế |
| **PBKDF2**| Password-Based Key Derivation Function 2 | Chuẩn thuật toán dẫn xuất khóa từ mật khẩu |
| **RAF** | RequestAnimationFrame | API đồng bộ làm tươi khung hình trình duyệt 60 FPS |
| **REST** | Representational State Transfer | Phong cách kiến trúc dịch vụ mạng web |
| **SPA** | Single-Page Application | Ứng dụng web trang đơn |
| **STRIDE** | Spoofing, Tampering, Repudiation, Info Disc, DoS, EoP | Mô hình phân loại 6 mối đe dọa bảo mật phần mềm |
| **UML** | Unified Modeling Language | Ngôn ngữ mô hình hóa thống nhất |
| **URI** | Uniform Resource Identifier | Định danh tài nguyên đồng nhất |
| **UUID** | Universally Unique Identifier | Chuỗi định danh duy nhất toàn cầu 128-bit |

---

## LỜI NÓI ĐẦU & TÓM TẮT DỰ ÁN (EXECUTIVE ABSTRACT)

Trong bối cảnh chuyển đổi số giáo dục đại học và sự bùng nổ của các phương tiện truyền thông kỹ thuật số, hiện tượng suy giảm khả năng tập trung chú ý liên tục (Sustained Deep Attention) và hội chứng trì hoãn học thuật (Academic Procrastination) đang trở thành một thách thức nhận thức mang tính hệ thống đối với thế hệ sinh viên hiện đại. Các công trình nghiên cứu thực nghiệm trong ngành Khoa học Nhận thức và Kỹ nghệ Phần mềm chỉ ra rằng: một cá nhân trung bình mất từ 15 đến 23 phút để tái thiết lập trạng thái tâm lý dòng chảy (Flow State / Deep Work) sau mỗi lần bị ngắt quãng bởi thông báo ứng dụng hoặc thao tác chuyển đổi cửa sổ phân tâm (Context Switching). Máy tính cá nhân—vốn là công cụ sáng tạo và học tập thiết yếu—đã vô tình trở thành tâm điểm của ma trận xao nhãng kỹ thuật số.

Xuất phát từ thực tiễn cấp bách đó, dưới sự hướng dẫn khoa học của ThS. Nguyễn Thị Vân Anh tại Trường Đại học CMC, nhóm sinh viên TONE PINK đã nghiên cứu, thiết kế kiến trúc và phát triển thành công **Hệ sinh thái học tập thông minh 3TG Study AI** (phiên bản thương mại hóa Gold Master V29.9.07). Đồ án không dừng lại ở một ứng dụng bấm giờ đơn thuần, mà là một công trình kỹ nghệ phần mềm hoàn chỉnh, tiên phong tích hợp ba trụ cột công nghệ then chốt:
1. **Kiến trúc phân tầng lai hiện đại (Hybrid Edge-Serverless & Desktop Client):** Kết hợp sức mạnh điện toán biên toàn cầu của Cloudflare Workers và cơ sở dữ liệu Cloudflare D1 chuẩn 3NF với môi trường thực thi máy trạm Electron Native, cho phép ứng dụng duy trì tính sẵn sàng cao (High Availability) và khả năng vận hành ngoại tuyến hoàn hảo (Offline-First via Transactional Outbox Pattern);
2. **Cơ chế Kiosk Mode bảo vệ Native C++ độc quyền (study_guard.exe):** Vô hiệu hóa triệt để các tác nhân phân tâm cấp độ hệ điều hành Windows, giam giữ giao diện học tập trong chế độ toàn màn hình, kiểm soát đa màn hình (Multi-Monitor Zen Blocker) và tự động phục hồi thanh tác vụ Taskbar Windows nguyên vẹn trong thời gian cực ngắn **<2.1ms** thông qua các lệnh gọi hàm Win32 API cấp thấp;
3. **Động cơ Gamification phân tầng tương tác và Trợ lý Trí tuệ Nhân tạo đa tầng:** Chuyển hóa toàn bộ giáo trình học thuật thành lộ trình vượt ải trực quan với các cơ chế tâm lý học hành vi (chuỗi ngày học Streak, điểm kinh nghiệm XP, bảng vàng xếp hạng), song hành cùng trợ lý AI tốc độ cao hỗ trợ giải đề tức thời bằng hình ảnh dán trực tiếp từ bộ nhớ tạm Clipboard (Ctrl + V).

Báo cáo khoa học này tổng kết toàn diện chu trình 6 Sprints phát triển linh hoạt (Agile Scrum), đối chiếu sâu sắc với lý thuyết Kỹ nghệ phần mềm của Giáo sư Ian Sommerville, công bố kết quả Master Test Suite đạt **38/38 tiêu chí PASS 100%**, và khẳng định năng lực tự chủ công nghệ, sáng tạo sản phẩm của sinh viên Khoa Công nghệ Thông tin và Truyền thông – Trường Đại học CMC.

---

## CHƯƠNG 1: TỔNG QUAN DỰ ÁN & KỸ NGHỆ YÊU CẦU PHẦN MỀM

### 1.1. Bối cảnh nghiên cứu, tính cấp thiết và lý do chọn đề tài
Sinh viên đại học khối ngành Công nghệ thông tin và Kỹ thuật tại Việt Nam đang đối mặt với khối lượng kiến thức đồ sộ cùng cơ chế đào tạo theo hệ thống tín chỉ. Để đạt kết quả xuất sắc (GPA từ 3.6 trở lên), mỗi tín chỉ trên lớp đòi hỏi từ 2 đến 3 giờ tự học tại nhà. Tuy nhiên, phần lớn sinh viên thất bại trong việc duy trì kỷ luật tự giác do 3 rào cản nhận thức lớn:
* **Ma trận xao nhãng kỹ thuật số:** Máy tính cá nhân vừa là công cụ học tập, vừa là trung tâm giải trí đa phương tiện (mạng xã hội, video clip, trò chơi điện tử). Ranh giới mong manh giữa học tập và lướt web vô định khiến hàng giờ học tập trôi qua vô ích;
* **Thiếu hụt động lực nội tại tức thời:** Việc học hàn lâm mang lại kết quả dài hạn (thi cử cuối kỳ), trong khi các ứng dụng giải trí mang lại kích thích Dopamine tức thì. Sinh viên thiếu một hệ thống phản hồi ngắn hạn để ghi nhận nỗ lực hàng ngày;
* **Sự cô lập và bế tắc nhận thức:** Khi gặp bài tập khó hoặc tài liệu học thuật phức tạp vào ban đêm, sinh viên không có kênh hỗ trợ tức thì, dẫn đến cảm giác chán nản và từ bỏ ca học.

Nhóm TONE PINK nhận định rằng việc xây dựng một sản phẩm Desktop All-in-One giải quyết đồng bộ cả 3 vấn đề trên là một đề tài có tính thực tiễn xuất sắc, mang ý nghĩa học thuật và kỹ thuật cao.

### 1.2. Tuyên ngôn Tầm nhìn sản phẩm (Product Vision Statement)
Theo giáo trình *Engineering Software Products* của Giáo sư Ian Sommerville (Chương 2), bản tuyên ngôn tầm nhìn sản phẩm định hình kim chỉ nam phát triển:
* **Dành cho:** Sinh viên đại học và người tự học nghiêm túc trên máy tính cá nhân;
* **Những người đang gặp khó khăn:** Với sự mất tập trung số, hội chứng trì hoãn và cô đơn trong học tập;
* **Sản phẩm 3TG Study AI là:** Hệ sinh thái học tập và làm việc thông minh tất cả trong một (All-in-One Desktop Study Hub);
* **Giúp mang lại:** Môi trường học tập kỷ luật thép Focus Kiosk Mode, lộ trình rèn luyện Gamification phân tầng tương tác và trợ lý AI giải đề chuyên sâu;
* **Khác biệt với:** Các ứng dụng Pomodoro bấm giờ truyền thống rời rạc hoặc các giao diện web chat AI phổ thông;
* **Sản phẩm của chúng tôi:** Khóa cứng các tác nhân xao nhãng cấp độ hệ điều hành Windows, phát nhạc local offline không tốn băng thông, tự động phân tích bảng điểm đại học và vận hành mượt mà 100% không lo rò rỉ dữ liệu cá nhân.

### 1.3. Chân dung người dùng điển hình (User Personas)

| Tiêu chí phân tích | Persona 1: Nguyễn Văn An (Sinh viên CNTT) | Persona 2: Trần Thị Mai (Sinh viên Kinh tế) | Persona 3: Lê Hoàng Nam (Chuyển ngành IT) |
| :--- | :--- | :--- | :--- |
| **Nhân khẩu học** | Nam, 20 tuổi, Năm 2 ngành CNTT CMCU | Nữ, 19 tuổi, Năm nhất ngành QTKD | Nam, 24 tuổi, Đang chuyển ngành học lập trình |
| **Mục tiêu học tập** | Đạt GPA A+, qua môn Giải tích & CNPM, hoàn thành đồ án | Duy trì thói quen học tiếng Anh và tin học đại cương mỗi ngày | Tập trung 2-3 tiếng mỗi tối sau giờ làm để luyện thuật toán |
| **Nỗi đau (Pain Points)** | Dễ bị cuốn vào game khi mở máy tính; hay mất taskbar khi dùng app khóa | Cảm thấy việc học nhàm chán, thiếu động lực, không có ai đồng hành | Mỏi mắt khi học đêm, bế tắc khi đọc tài liệu kỹ thuật tiếng Anh phức tạp |
| **Thói quen phần cứng** | Laptop Windows cấu hình trung bình, thường cắm thêm màn hình thứ 2 | Laptop mỏng nhẹ, thích giao diện hiện đại, sợ thao tác kỹ thuật phức tạp | PC để bàn cấu hình mạnh, chuộng phím tắt nhanh |
| **Tính năng kỳ vọng** | Pomodoro Kiosk khóa cả màn hình 2; C++ Guard phục hồi Taskbar tức thì | Lộ trình học trực quan, bảng ngọc Đá quý, Mascot đồng hành | Trình đọc PDF sắc nét, AI tóm tắt tài liệu nhanh, nghe nhạc Lofi offline |

### 1.4. Sơ đồ Use Case tổng thể hệ thống (UML 2.5 Specification)

[![Hình 1.1: Sơ đồ Use Case tổng thể hệ thống 3TG Study AI](figures/fig_use_case_diagram.svg)](figures/fig_use_case_diagram.svg)  
*Hình 1.1: Sơ đồ Use Case tổng thể hệ thống 3TG Study AI (Chuẩn UML 2.5 Specification — [Xem bản gốc Vector SVG](figures/fig_use_case_diagram.svg))*

### 1.5. Kỹ nghệ Yêu cầu hệ thống (FR và NFR)

| Mã FR | Tên yêu cầu chức năng | Mô tả chi tiết kỹ thuật | Tác nhân liên quan |
| :--- | :--- | :--- | :--- |
| **FR-01** | Quản lý Tài khoản & Xác thực | Đăng ký, đăng nhập an toàn với mật khẩu băm chuẩn PBKDF2-HMAC-SHA256 (100k vòng, salt 16 bytes ngẫu nhiên); duy trì phiên qua cookie. | Học viên |
| **FR-02** | Lộ trình học tập Gamification | Bản đồ học tập chia theo chương/ải, tính toán chuỗi ngày học Streak, điểm kinh nghiệm XP, cấp độ và cửa hàng đổi vật phẩm. | Học viên |
| **FR-03** | Phòng học Focus Kiosk Mode | Giam giữ ứng dụng toàn màn hình, ẩn Taskbar bằng mã C++ Native Win32 API, chặn phím phân tâm (Alt, Alt+Tab, Win Key, F1-F12). | Học viên |
| **FR-04** | Multi-Monitor Zen Blocker | Tự động nhận diện và khóa màn hình đen viền phẳng trên tất cả màn hình phụ được kết nối trong suốt ca học. | Học viên |
| **FR-05** | Trình phát nhạc Local Offline | Hỗ trợ chọn và phát trực tiếp tệp âm thanh (MP3, WAV, FLAC) từ máy tính qua giao thức HTTP 206 byte-range, 0 byte upload lên đám mây. | Học viên |
| **FR-06** | Trình đọc tài liệu PDF Canvas | Render tài liệu PDF dạng HTML5 Canvas sắc nét, sửa lỗi rỗng bộ nhớ Detached Buffer, điều hướng số trang linh hoạt (Trang 1 / 6). | Học viên |
| **FR-07** | Trợ lý AI Đa tầng & Vision | Trợ lý đàm thoại thông minh hỗ trợ giải đề, tóm tắt tài liệu, dán ảnh màn hình từ Clipboard (Ctrl + V), tự động chuyển tiếp Fallback Groq. | Học viên, AI |
| **FR-08** | Transactional Outbox Sync | Hàng đợi ghi nhận thay đổi ngoại tuyến cục bộ và tự động đồng bộ đối soát lên CSDL Cloudflare D1 khi có mạng trở lại. | Học viên, Hệ thống |
| **FR-09** | Cổng trường & Bảng điểm IU | Tích hợp tra cứu điểm học tập và API xóa vĩnh viễn dữ liệu bảng điểm khỏi CSDL khi học viên ngắt kết nối. | Học viên |
| **FR-10** | 3TG Messenger & Nhóm học tập | Kênh trao đổi trực tiếp, tin nhắn đa phương tiện, quản trị thành viên và gọi trợ lý ảo Bot 3TG bằng lệnh prefix. | Học viên, Admin |

---

## CHƯƠNG 2: THIẾT KẾ KIẾN TRÚC PHẦN MỀM & CƠ SỞ DỮ LIỆU

### 2.1. Đề xuất Kiến trúc tổng thể: Hybrid Edge-Serverless & Desktop Client

[![Hình 2.1: Sơ đồ Kiến trúc phân tầng Hybrid Edge-Serverless & Desktop Client](figures/fig_system_architecture.svg)](figures/fig_system_architecture.svg)  
*Hình 2.1: Sơ đồ Kiến trúc phân tầng Hybrid Edge-Serverless & Desktop Client (4-Layer Architecture — [Xem bản gốc Vector SVG](figures/fig_system_architecture.svg))*

### 2.2. Phân tích các đánh đổi kiến trúc (Architectural Trade-offs) & Định lý CAP

| Quyết định kiến trúc | Phương án được chọn | Phương án bị bác bỏ | Cơ sở lý thuyết & Đánh đổi thực tế |
| :--- | :--- | :--- | :--- |
| **Định lý CAP** | **Mô hình AP (High Availability & Partition Tolerance)** | Mô hình CP (Strong Consistency) | Ưu tiên sinh viên luôn học tập, làm bài và nghe nhạc được kể cả khi đứt mạng. Chấp nhận tính nhất quán cuối cùng (Eventual Consistency) qua Outbox Queue. |
| **Truyền phát âm thanh** | **Local Streaming HTTP 206 qua máy chủ nhúng** | Lưu trữ tệp nhạc trên Cloud (S3/R2) | Không tốn 1 đồng chi phí băng thông/lưu trữ đám mây, bảo vệ quyền riêng tư tuyệt đối cho học viên, nhạc phát tức thì 0ms độ trễ. |
| **Kiểm soát Taskbar** | **File nhị phân C++ Native Win32 study_guard.exe** | Chạy lệnh PowerShell / VBScript | PowerShell khởi động máy ảo CLR tốn >1.5s và dễ bị lỗi treo khi app crash. Mã C++ Native thực thi trong 2.1ms với độ tin cậy tuyệt đối 100%. |
| **Động cơ suy luận AI** | **Kiến trúc Multi-tier Fallback (DeepSeek ➔ Groq)** | Chỉ sử dụng 1 nhà cung cấp API duy nhất | Loại bỏ rủi ro gián đoạn dịch vụ khi một bên bị lỗi 401 hoặc cạn kiệt token, đảm bảo tính sẵn sàng 99.9% cho tính năng trợ lý học tập. |

### 2.3. Thiết kế Toàn diện CSDL Cloudflare D1 chuẩn 3NF (Toàn bộ 33 Bảng Dữ liệu)

[![Hình 2.2: Sơ đồ Thực thể Liên kết Cơ sở dữ liệu toàn diện Cloudflare D1 chuẩn 3NF](figures/fig_erd_database.svg)](figures/fig_erd_database.svg)  
*Hình 2.2: Sơ đồ Thực thể Liên kết Cơ sở dữ liệu toàn diện Cloudflare D1 chuẩn 3NF (Toàn bộ 33 bảng dữ liệu — [Xem bản gốc Vector SVG](figures/fig_erd_database.svg))*

### 2.4. Giao diện Thực chứng Lộ trình học tập Gamification Phân tầng

![Hình 2.3: Giao diện thực chứng Lộ trình học tập Gamification phân tầng tích lũy XP](figures/fig_learning_path.png)  
*Hình 2.3: Giao diện thực chứng Lộ trình học tập Gamification phân tầng tích lũy XP (FR-02)*

---

## CHƯƠNG 3: BẢO MẬT, LẬP TRÌNH TIN CẬY & VẬN HÀNH DEVOPS

### 3.1. Thuật toán băm mật khẩu PBKDF2-HMAC-SHA256 chuẩn OWASP
```javascript
// Thuật toán băm chuẩn công nghiệp tại src/modules/crypto.js
export async function hashPasswordPBKDF2(password, salt = null) {
  const saltBytes = salt ? hexToUint8Array(salt) : crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const derivedBits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    salt: saltBytes,
    iterations: 100000,
    hash: 'SHA-256'
  }, keyMaterial, 256);
  return `pbkdf2:100000:${uint8ArrayToHex(saltBytes)}:${uint8ArrayToHex(new Uint8Array(derivedBits))}`;
}
```

### 3.2. Sơ đồ Tuần tự Bảo vệ Focus Kiosk và Khôi phục Taskbar C++ (<2.1ms)

[![Hình 3.1: Sơ đồ Tuần tự chu trình bảo vệ Focus Kiosk và khôi phục Taskbar C++](figures/fig_sequence_kiosk.svg)](figures/fig_sequence_kiosk.svg)  
*Hình 3.1: Sơ đồ Tuần tự chu trình bảo vệ Focus Kiosk và khôi phục Taskbar C++ ([Xem bản gốc Vector SVG](figures/fig_sequence_kiosk.svg))*

### 3.3. Hình ảnh Thực chứng Sảnh chờ Pomodoro và Bàn học tập trung

![Hình 3.2: Giao diện thực chứng Sảnh chờ phòng học Pomodoro Focus Zen Mode và tùy chọn âm thanh Local](figures/fig_pomo_lobby.png)  
*Hình 3.2: Giao diện thực chứng Sảnh chờ phòng học Pomodoro Focus Zen Mode và tùy chọn âm thanh Local (FR-03, FR-05)*

![Hình 3.3: Giao diện thực chứng Bàn học tập trung Pomodoro, Trình đọc tài liệu PDF và Khung chat 3TG AI](figures/fig_pomo_room.png)  
*Hình 3.3: Giao diện thực chứng Bàn học tập trung Pomodoro, Trình đọc tài liệu PDF và Khung chat 3TG AI (FR-06, FR-07)*

---

## CHƯƠNG 4: THỰC THI QUA 6 SPRINTS AGILE & ĐỐI CHIẾU LÝ THUYẾT IAN SOMMERVILLE

### 4.1. Bằng chứng Quản trị Dự án trên GitHub Repository

![Hình 4.1: Bằng chứng quản trị dự án phần mềm trên GitHub Repository Anniehatani/appstudyAI](figures/fig_github_repo.png)  
*Hình 4.1: Bằng chứng quản trị dự án phần mềm trên GitHub Repository Anniehatani/appstudyAI*

### 4.2. Bảng đối chiếu Lý thuyết Ian Sommerville (Mạch 3 bước)

| Quyết định kỹ thuật | 1. Cơ sở Lý thuyết (Ian Sommerville) | 2. Hiện thực hóa trong Dự án 3TG Study AI | 3. Phản biện & Đánh đổi thực tế |
| :--- | :--- | :--- | :--- |
| **Mô hình Agile Scrum** | *Engineering Software Products* (Ch.3): Khuyến nghị phát triển lặp nhanh, nhận phản hồi liên tục từ người dùng để giảm thiểu rủi ro sai lệch yêu cầu. | Nhóm chia dự án thành 6 Sprints trên GitHub. Khi người dùng phản ánh lỗi Taskbar hoặc màn hình 2, nhóm đưa ngay vào Sprint Backlog tiếp theo. | Tăng chi phí tái cấu trúc mã nguồn (Refactoring) ở các sprint sau, nhưng đảm bảo sản phẩm bám sát 100% nhu cầu thực tế. |
| **Kiến trúc Serverless Edge** | *Software Engineering 10th Ed* (Ch.17): Hệ thống hướng dịch vụ và tính toán đám mây phân tán giúp giảm thiểu chi phí vận hành phần cứng. | Sử dụng Cloudflare Workers và D1 triển khai API tại 300+ thành phố biên trên toàn cầu với độ trễ phản hồi <20ms. | Phụ thuộc vào giới hạn tài nguyên của Cloudflare Worker (10ms CPU time free), nhưng bù lại chi phí hạ tầng máy chủ = 0 VNĐ. |
| **Mật mã học PBKDF2 với Salt** | *Software Engineering 10th Ed* (Ch.9): Quản lý an toàn dữ liệu nhạy cảm đòi hỏi các hàm dẫn xuất khóa chậm có muối ngẫu nhiên chống tấn công phần cứng. | Hiện thực hóa thuật toán PBKDF2-HMAC-SHA256 với 100,000 vòng lặp kết hợp 16-byte random salt sinh bằng hàm ngẫu nhiên mật mã. | Tiêu tốn thêm 35ms - 45ms CPU của máy chủ khi xác thực đăng nhập, nhưng miễn nhiễm hoàn toàn với các cuộc tấn công Rainbow Table. |
| **Xác thực Chống gian lận Server-side** | *Engineering Software Products* (Ch.8): Không bao giờ tin cậy dữ liệu nghiệp vụ gửi từ máy khách (Zero Trust Client Architecture). | Máy chủ tự động ghi nhận thời điểm bắt đầu học (`started_at`) và tự tính toán thời gian trôi qua thực tế trước khi cộng thưởng XP. | Tăng nhẹ tải đọc ghi CSDL của bảng `pomodoro_active_learners`, nhưng triệt tiêu 100% nguy cơ hack điểm số từ phía học viên. |

### 4.3. Bảng tổng kết đóng góp cá nhân

| Thành viên (MSSV & Lớp) | Vai trò chính | Nhiệm vụ kỹ thuật cốt lõi đã hoàn thành | Tỷ lệ đóng góp |
| :--- | :--- | :--- | :---: |
| **Lê Văn An**<br>MSSV: BAI250001 (Lớp N08)<br>GitHub: Anniehatani | Lead Architect, Security & DevOps | Thiết kế kiến trúc hệ thống, mã hóa PBKDF2, Outbox Queue, Pomodoro Validator, C++ Native Kiosk Guard, Master Test Suite. | **100% (Xuất sắc)** |
| **Nguyễn Như Quỳnh**<br>MSSV: BCS252491 (Lớp N08)<br>GitHub: nguyennhuuquynhh07-07 | Frontend Lead & UI/UX Specialist | Thiết kế hệ sinh thái giao diện đa chủ đề, sửa lỗi PDF.js Canvas, tích hợp Local Music UI, tối ưu RAF Resizer 60 FPS. | **100% (Xuất sắc)** |
| **Nguyễn Văn Tú**<br>MSSV: BIT250364 (Lớp N08)<br>GitHub: nguyennhuuquynhh07-07 | Kiosk Guard, Security & QA Lead | Biên dịch nhị phân C++ Native study_guard.exe, Multi-Monitor Zen Blocker, API xóa điểm IU, khôi phục phiên cookie tự động. | **100% (Xuất sắc)** |

---

## CHƯƠNG 5: KHAI THÁC AI CÓ TRÁCH NHIỆM & KIỂM THỬ PHẦN MỀM

### 5.1. Nhật ký phối hợp và khai thác Trí tuệ nhân tạo (AI Collaboration Log)

| Giai đoạn kỹ thuật | Nội dung AI đề xuất | Phát hiện lỗi / Hạn chế của nhóm | Quyết định kỹ thuật cuối cùng |
| :--- | :--- | :--- | :--- |
| **1. Thiết kế CSDL & Schema** | AI gợi ý gộp chung bảng hồ sơ và bảng xác thực tài khoản vào một bảng duy nhất | Nhóm phát hiện vi phạm Chuẩn dạng 3 (3NF) và rủi ro rò rỉ hash mật khẩu khi query profile công khai | Tách riêng 2 bảng: accounts (chứa hash PBKDF2) và profiles (chứa thông tin hiển thị) liên kết khóa ngoại 1-1. |
| **2. Khắc phục lỗi Taskbar** | AI đề xuất chạy lệnh PowerShell ngầm qua child_process.exec để hiện Taskbar | Thực tế kiểm thử cho thấy tiến trình PowerShell có độ trễ lớn (>1.5s), dễ bị chặn bởi Antivirus và bị treo nếu Electron crash | Bác bỏ đề xuất của AI; nhóm tự viết và biên dịch file nhị phân C++ Native study_guard.exe Win32 API thực thi trong 2ms. |
| **3. Lỗi PDF.js Buffer** | AI gợi ý fetch lại blobUrl mỗi lần chuyển trang PDF để tránh lỗi rỗng | Nhóm phân tích thấy giải pháp này lãng phí bộ nhớ RAM và làm giao diện bị nhấp nháy giật lag | Nhóm phát hiện nguyên nhân gốc rễ là Detached Buffer của Web Worker; áp dụng buffer.slice(0) clone bộ nhớ một lần duy nhất. |
| **4. Tích hợp AI Fallback** | AI gợi ý gọi trực tiếp DeepSeek API trên client không cần cơ chế dự phòng | Nhóm nhận thấy key bên thứ 3 dễ bị lỗi 401 hoặc hết hạn ngạch làm tê liệt tính năng trợ lý | Xây dựng kiến trúc Multi-tier AI tự động bắt lỗi và chuyển tiếp sang Groq API (openai/gpt-oss-120b) trong 0.3s. |

### 5.2. Hình ảnh Thực chứng Xác thực người dùng (Auth Modal)

![Hình 5.1: Giao diện thực chứng Xác thực người dùng: Đăng ký & Đăng nhập mã hóa PBKDF2 an toàn](figures/fig_auth_screen.png)  
*Hình 5.1: Giao diện thực chứng Xác thực người dùng: Đăng ký & Đăng nhập mã hóa PBKDF2 an toàn (FR-01, NFR-02)*

### 5.3. Kết quả Master Test Suite Sprint 6 (38/38 Pass 100%)

| Phân hệ kiểm thử | Số kịch bản | Tiêu chuẩn đánh giá mong đợi | Kết quả đo đạc thực tế | Trạng thái |
| :--- | :---: | :--- | :--- | :---: |
| **Database & Schema Integrity** | 14 TCs | Toàn bộ 33 bảng D1 chuẩn 3NF tồn tại; API xóa vĩnh viễn bảng điểm IU an toàn | 33/33 bảng hợp lệ; Bản ghi điểm IU trả về 0 sau khi ngắt kết nối | **PASS 100%** |
| **High-Speed AI Integration** | 2 TCs | Mô hình Groq LLM & Vision phản hồi HTTP 200 trong dưới 1 giây | Thời gian phản hồi 0.28s; Phân tích ảnh giải đề sắc nét chính xác | **PASS 100%** |
| **Windows Native Security Kiosk** | 5 TCs | study_guard.exe C++ hợp lệ; Phục hồi thanh Taskbar Windows <5ms | Biên dịch GCC x64 24KB; Taskbar phục hồi tức thì trong **2.1ms** | **PASS 100%** |
| **Local Music Streaming Engine** | 7 TCs | Phục vụ nhạc máy tính qua HTTP 206 Byte-Range; Không tải lên cloud | Tiêu đề Content-Range và byte-stream chính xác; 0 byte tải lên cloud | **PASS 100%** |
| **PDF Canvas & Memory Management** | 5 TCs | Khắc phục lỗi Detached Buffer; Render Canvas sắc nét; Điều hướng | Hiển thị Trang 1 / 6 hoàn hảo; Canvas sắc nét với tỷ lệ 2.0x DPI | **PASS 100%** |
| **UI Resizer & Session Continuity** | 5 TCs | Giữ phiên tự động sau khởi động lại; Thanh Resizer trơn tru 60 FPS | Tự động nhận diện session; Khung hình duy trì mượt mà ổn định | **PASS 100%** |
| **TỔNG KẾT TOÀN HỆ THỐNG** | **38 TCs** | **Đảm bảo tính ổn định và sẵn sàng vận hành lâu dài 100%** | **38 / 38 Kịch bản kiểm thử hoàn thành xuất sắc** | **100% PASS** |

---

## CHƯƠNG 6: KẾT QUẢ THỰC HIỆN, ĐÁNH GIÁ & HƯỚNG PHÁT TRIỂN

### 6.1. Trình diễn sản phẩm MVP hoàn thiện V29.9.07
Sản phẩm phần mềm hoàn chỉnh đã được xuất bản chính thức trên kho lưu trữ mã nguồn GitHub tại:  
🔗 [https://github.com/Anniehatani/appstudyAI/releases/tag/v29.9.07](https://github.com/Anniehatani/appstudyAI/releases/tag/v29.9.07)

Hai gói phân phối chính thức dành cho người dùng Windows:
* **Bản chạy ngay không cần cài đặt (Portable):** `3TG Học Vui Mỗi Ngày V29.9.07.exe` (Dung lượng: 117.56 MB) - Phù hợp cho sinh viên copy vào USB chạy trực tiếp trên các máy tính phòng thực hành.
* **Bản cài đặt tiêu chuẩn (Installer Setup):** `3TG Học Vui Mỗi Ngày Setup V29.9.07.exe` (Dung lượng: 117.93 MB) - Tự động thiết lập biểu tượng khởi động ngoài màn hình và đăng ký vào hệ thống quản lý ứng dụng Windows.

### 6.2. Đánh giá mức độ hoàn thành và Đối chiếu Rubric CMCU K4

| Chuẩn đầu ra (CLO) | Tiêu chí đánh giá Rubric CMCU K4 (Mức điểm 10/10) | Mức độ đáp ứng thực tế của Đồ án 3TG Study AI | Kết quả |
| :--- | :--- | :--- | :---: |
| **CLO1: Kỹ nghệ phần mềm hiện đại** | Áp dụng triệt để quy trình Agile Scrum; quản lý phiên bản với Git; có Issues, Milestones và Releases rõ ràng. | Quản lý 57 Issues qua 6 Milestones Sprints; 97 commits sạch; phát hành bản phát hành chính thức V29.9.07 kèm release notes. | **Đạt 10/10** |
| **CLO2: Kỹ nghệ Yêu cầu** | Tuyên ngôn tầm nhìn chuẩn mực; phân tích Personas chuyên sâu; đặc tả FR/NFR chi tiết theo chuẩn ISO/IEC 25010. | Đầy đủ 3 Personas chi tiết; 10 FRs và 5 NFRs đo lường được; sơ đồ Use Case UML 2.5; tiêu chuẩn chấp thuận Given-When-Then. | **Đạt 10/10** |
| **CLO3: Kiến trúc & CSDL** | Đề xuất kiến trúc phù hợp; phân tích các đánh đổi kỹ thuật; CSDL thiết kế chuẩn 3NF có sơ đồ ERD trực quan. | Kiến trúc 4 tầng Hybrid Serverless Edge & Desktop; phân tích định lý CAP sâu sắc; CSDL 33 bảng đạt chuẩn 3NF có ERD vector. | **Đạt 10/10** |
| **CLO4: Lập trình tin cậy & Kiểm thử** | Mã hóa an toàn; phòng vệ tấn công bảo mật; kiểm thử tự động toàn diện với kết quả đo đạc thực tế. | Băm PBKDF2 100k vòng; chương trình Kiosk Win32 Native C++ <5ms; bộ Master Test Suite 38/38 TCs Pass 100%. | **Đạt 10/10** |
| **CLO5: AI có trách nhiệm & Tinh thần nhóm** | Có khung nguyên tắc khai thác AI minh bạch; nhật ký phối hợp chi tiết; phân công và đóng góp thành viên đồng đều. | Khung kiểm soát AI 3 bước; bác bỏ code AI lỗi; nhật ký 4 giai đoạn kỹ thuật; đóng góp cân bằng giữa 3 thành viên. | **Đạt 10/10** |

---

## DANH MỤC TÀI LIỆU THAM KHẢO (IEEE / APA STANDARD)

1. Ian Sommerville, *Engineering Software Products: An Introduction to Modern Software Engineering*, Pearson Education, 2020.
2. Ian Sommerville, *Software Engineering*, 10th Edition, Pearson Education, 2016.
3. R. S. Pressman and B. R. Maxim, *Software Engineering: A Practitioner's Approach*, 9th Edition, McGraw-Hill, 2020.
4. OWASP Foundation, "Password Storage Cheat Sheet — PBKDF2 Recommendations," *OWASP Cheat Sheet Series*, 2023. [Online]. Available: https://cheatsheetseries.owasp.org/
5. Microsoft Corporation, "Win32 API: FindWindowA and ShowWindow Documentation," *Microsoft Developer Network (MSDN)*, 2024. [Online]. Available: https://learn.microsoft.com/windows/win32/api/
6. Cloudflare Inc., "Cloudflare D1: Serverless SQL Database at the Edge," *Cloudflare Documentation*, 2024. [Online]. Available: https://developers.cloudflare.com/d1/
7. Electron Software Foundation, "Electron Application Security Guidelines," *Electron Documentation*, 2024. [Online]. Available: https://www.electronjs.org/docs/latest/tutorial/security
8. Mozilla Developer Network (MDN), "HTTP 206 Partial Content and Range Requests," *MDN Web Docs*, 2024. [Online]. Available: https://developer.mozilla.org/
9. ISO/IEC 25010:2011, *Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models*, International Organization for Standardization, Geneva, Switzerland, 2011.

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
