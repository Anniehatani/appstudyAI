# 💎 BÁO CÁO TỔNG KẾT SPRINT 3 & NGHIỆM THU ĐỒ ÁN — DỰ ÁN 3TG (LUMI STUDY AI)
**Môn học:** Công nghệ phần mềm | **Giảng viên hướng dẫn:** ThS. Vân Anh  
**Nhóm thực hiện:** TONE PINK | **Repository:** [Anniehatani/appstudyAI](https://github.com/Anniehatani/appstudyAI)

---

## 📌 PHẦN 1: TỔNG QUAN SPRINT 3 (SPRINT TỔNG KẾT & PHÁT HÀNH)

### 1. Mục tiêu Sprint 3
Sprint 3 là Sprint tổng kết, hoàn thiện và đóng gói phát hành sản phẩm cuối cùng của dự án:
* **Tối ưu hóa hiệu năng & Đóng gói Desktop Electron v9.9.9:** Khắc phục triệt để hiện tượng mở chậm (10-20 giây) bằng cơ chế ASAR (`asar: true`), cấu hình ngoại lệ `asarUnpack` cho Worker engine và CSDL SQLite, tích hợp Single Instance Lock giúp ứng dụng khởi động tức thì chỉ trong **1 - 2 giây**.
* **Bảo mật & Tẩy sạch dữ liệu thử nghiệm:** Xóa sạch toàn bộ tài khoản cá nhân của nhóm trong database, đảm bảo app mở lên là phiên bản sạch cho người dùng mới; chuẩn hóa thông báo lỗi trùng tài khoản rõ ràng, minh bạch.
* **Kiểm thử tích hợp toàn diện (E2E Testing):** Kiểm tra xuyên suốt luồng người dùng từ học tập trắc nghiệm, trừ/cộng tim, đồng bộ cổng trường IU qua Microsoft 365, trợ lý AI DeepSeek đến mạng xã hội và khung chat 1-1.
* **Xuất bản bộ cài đặt Desktop chính thức:** Build thành công 2 bản cài đặt: Bộ cài đặt tự động `Setup 9.9.9.exe` (~111 MB) và Bản chạy ngay không cần cài đặt `Portable 9.9.9.exe`.
* **Hoàn thiện hồ sơ báo cáo đồ án:** Biên soạn tài liệu Báo cáo tổng kết đồ án Word (`.docx`) và Slide thuyết trình PowerPoint (`.pptx`) chuyên nghiệp phục vụ buổi bảo vệ trước GV ThS. Vân Anh.

---

### 2. Phân công vai trò thành viên nhóm TONE PINK trong Sprint 3

| STT | Thành viên | Tài khoản GitHub | Vai trò trong Sprint 3 | Nhiệm vụ cụ thể |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Lê Văn An** *(Lead)* | [`@Anniehatani`](https://github.com/Anniehatani) | **Nhóm trưởng, Desktop & Release Lead** | - Cấu hình Electron Builder, tối ưu hóa ASAR mở app trong 1-2 giây.<br>- Xử lý cơ chế Worker engine fallback và Single Instance Lock.<br>- Xuất bản bộ cài đặt Setup và Portable v9.9.9.<br>- Điều phối tiến độ tổng kết đồ án và phân công thuyết trình. |
| **2** | **Nguyễn Như Quỳnh** | [`@nguyennhuuquynhh07-07`](https://github.com/nguyennhuuquynhh07-07) | **Frontend, Slide & Demo Lead** | - Kiểm tra thẩm mỹ giao diện Midnight Velvet Dark Mode trên bản exe.<br>- Thiết kế bộ Slide thuyết trình PowerPoint (`.pptx`) TONE PINK hiện đại.<br>- Chuẩn bị kịch bản demo tính năng trực tiếp trong buổi bảo vệ.<br>- Rà soát trải nghiệm người dùng trên môi trường máy sạch. |
| **3** | **Nguyễn Tú** | [`@tus-sud`](https://github.com/tus-sud) | **Database, QA Lead & Báo cáo** | - Tẩy sạch dữ liệu thử nghiệm cá nhân trong database SQLite.<br>- Chuẩn hóa thông báo lỗi trùng tên đăng nhập, xác thực an toàn.<br>- Thực hiện kiểm thử toàn diện E2E (End-to-End) các tính năng.<br>- Hoàn thiện hồ sơ Báo cáo kỹ thuật tổng kết đồ án Word (`.docx`). |

---

## 📌 PHẦN 2: DANH SÁCH ISSUES SPRINT 3 TRÊN GITHUB

> Toàn bộ các công việc của Sprint 3 được quản lý trực tiếp tại [`Anniehatani/appstudyAI/issues`](https://github.com/Anniehatani/appstudyAI/issues) (thuộc Milestone: `Sprint 3: Tổng kết, Đóng gói Desktop & Báo cáo đồ án`).

### Issue #21: Sprint 3 – Đóng gói ứng dụng Desktop Electron v9.9.9 và tối ưu mở nhanh 1-2s
* **Người phụ trách:** `@Anniehatani`
* **Nhãn (Labels):** `backend`, `desktop`, `sprint-3`
* **Mục tiêu:** Đóng gói phần mềm máy tính Desktop chạy độc lập trên Windows và khắc phục triệt để lỗi mở chậm (10-20 giây) giúp người dùng mở app tức thì.
* **Các công việc thực hiện:**
  - [x] Bật cơ chế nén ASAR (`asar: true`) đóng gói toàn bộ mã nguồn thành 1 file nhị phân duy nhất, tránh bị Windows Defender quét nghẽn I/O.
  - [x] Cấu hình ngoại lệ `asarUnpack` giải nén file cơ sở dữ liệu SQLite, icon và Worker engine để app hoạt động độc lập ngoại tuyến.
  - [x] Tích hợp cơ chế Single Instance Lock (`app.requestSingleInstanceLock()`) chống người dùng bấm nhiều lần làm mở trùng cửa sổ.
  - [x] Tối ưu hóa khởi động app và bộ cài đặt xuống chỉ còn 1 - 2 giây là hiển thị ngay lập tức.
* **Kết quả:** Ứng dụng Desktop mở lên tức thì trong 1-2 giây trên Windows, không phát sinh lỗi lag giật hay đơ máy.

---

### Issue #22: Sprint 3 – Tẩy sạch tài khoản thử nghiệm, chuẩn hóa lỗi đăng ký và bảo mật
* **Người phụ trách:** `@tus-sud`
* **Nhãn (Labels):** `bug`, `database`, `sprint-3`
* **Mục tiêu:** Dọn dẹp sạch sẽ toàn bộ tài khoản thử nghiệm cá nhân trong cơ sở dữ liệu và chuẩn hóa lại thông báo lỗi đăng ký để người dùng mới trải nghiệm mượt mà, minh bạch.
* **Các công việc thực hiện:**
  - [x] Tẩy sạch các tài khoản thử nghiệm cá nhân của nhóm trong database SQLite và Cloudflare D1.
  - [x] Đảm bảo khi mở app lên lần đầu là màn hình đăng nhập / đăng ký hoàn toàn mới, không bị lưu tài khoản cũ.
  - [x] Chuẩn hóa thông báo lỗi trùng tên đăng nhập rõ ràng, dễ hiểu: *"Tên tài khoản này đã được sử dụng, vui lòng chọn tên khác"*.
  - [x] Kiểm tra và xác thực các trường nhập liệu mật khẩu, email hợp lệ.
* **Kết quả:** Mở app lên hoàn toàn sạch sẽ, không lưu vết thông tin cá nhân, báo lỗi đăng ký chuẩn xác.

---

### Issue #23: Sprint 3 – Kiểm thử toàn diện hệ thống (E2E Testing) và rà soát lỗi tồn đọng
* **Người phụ trách:** `@tus-sud`
* **Nhãn (Labels):** `bug`, `integration`, `sprint-3`
* **Mục tiêu:** Tiến hành kiểm thử luồng tích hợp toàn diện E2E từ giao diện Desktop đến Serverless Worker, cơ sở dữ liệu Cloudflare D1 và các dịch vụ AI/Cổng trường.
* **Các công việc thực hiện:**
  - [x] Kiểm thử toàn bộ luồng đăng ký mới, đăng nhập, nộp bài tập trắc nghiệm và cộng điểm thưởng XP, Gems.
  - [x] Kiểm thử cơ chế rớt mạng: App tự động đồng bộ sang cơ sở dữ liệu cục bộ Local SQLite Replica không gián đoạn.
  - [x] Kiểm thử chức năng đồng bộ cổng IU CMCU 1-Click qua Microsoft 365, bóc tách bảng điểm và thời khóa biểu.
  - [x] Kiểm thử trợ lý AI DeepSeek phân tích Target GPA và luồng kết bạn, chat realtime 1-1.
  - [x] Rà soát và vá toàn bộ các lỗi nhỏ về giao diện Dark Mode và độ trễ phản hồi.
* **Kết quả:** 100% kịch bản kiểm thử cốt lõi đều Pass thành công; không có lỗi crash hay Worker engine chưa sẵn sàng.

---

### Issue #24: Sprint 3 – Xuất bản bộ cài đặt Setup và Portable v9.9.9 kiểm tra môi trường sạch
* **Người phụ trách:** `@Anniehatani`
* **Nhãn (Labels):** `desktop`, `integration`, `sprint-3`
* **Mục tiêu:** Build và đóng gói hoàn thiện bộ cài đặt chính thức phiên bản v9.9.9, kiểm tra cài đặt và khởi chạy trên môi trường máy tính độc lập (clean environment).
* **Các công việc thực hiện:**
  - [x] Chạy quy trình đóng gói Electron Builder cho ra 2 bản phát hành: File cài đặt `3TG Học Vui Mỗi Ngày Setup 9.9.9.exe` và File chạy trực tiếp `3TG Học Vui Mỗi Ngày 9.9.9.exe`.
  - [x] Kiểm tra quy trình cài đặt và gỡ cài đặt (Uninstall) sạch sẽ trong Control Panel của Windows.
  - [x] Kiểm tra khởi động nhanh trên máy tính Windows độc lập, icon hiển thị sắc nét và đầy đủ các tài nguyên.
  - [x] Lưu trữ các file thực thi phát hành an toàn tại thư mục `dist-electron`.
* **Kết quả:** Bộ cài đặt hoạt động hoàn hảo, dung lượng ~111 MB tối ưu, cài đặt nhanh chóng và chạy mượt mà.

---

### Issue #25: Sprint 3 – Hoàn thiện Slide thuyết trình PowerPoint và Báo cáo tổng kết đồ án Word
* **Người phụ trách:** `@nguyennhuuquynhh07-07`, `@Anniehatani`, `@tus-sud`
* **Nhãn (Labels):** `documentation`, `sprint-3`
* **Mục tiêu:** Tổng hợp toàn bộ thành quả của 3 Sprint, số liệu thực nghiệm và tài liệu kỹ thuật để tạo file Báo cáo tổng kết đồ án Word và Slide thuyết trình PowerPoint bảo vệ trước giảng viên.
* **Các công việc thực hiện:**
  - [x] Biên soạn tài liệu Báo cáo tổng kết đồ án Word (`.docx`) chi tiết về kiến trúc hệ thống, sơ đồ CSDL và kết quả 3 Sprint.
  - [x] Thiết kế Slide thuyết trình PowerPoint (`.pptx`) phong cách TONE PINK hiện đại, sinh động, trực quan.
  - [x] Chụp ảnh minh chứng thực tế: Cây bài học Duolingo, Bảng điểm IU, Chat 1-1, Avatar Discord Nitro và Trợ lý AI DeepSeek.
  - [x] Phân công phân vai thuyết trình và kịch bản demo trực tiếp sản phẩm cho từng thành viên trong nhóm.
* **Kết quả:** Bộ hồ sơ Word và PowerPoint hoàn chỉnh, sẵn sàng cho buổi bảo vệ đồ án trước GV ThS. Vân Anh.

---

## 📌 PHẦN 3: KẾT QUẢ KANBAN SPRINT 3

Toàn bộ 5 Issue của Sprint 3 đã được hoàn thành nghiệm thu trên bảng Kanban GitHub Projects:

| Cột Kanban | Mã Issue | Tên công việc Sprint 3 | Người phụ trách | Trạng thái |
| :---: | :---: | :--- | :---: | :---: |
| **Done** | **#21** | Đóng gói Desktop Electron v9.9.9 và tối ưu mở nhanh 1-2s | `@Anniehatani` | Đã nghiệm thu |
| **Done** | **#22** | Tẩy sạch tài khoản thử nghiệm, chuẩn hóa lỗi đăng ký | `@tus-sud` | Đã nghiệm thu |
| **Done** | **#23** | Kiểm thử toàn diện hệ thống (E2E Testing) và rà soát lỗi | `@tus-sud` | Đã nghiệm thu |
| **Done** | **#24** | Xuất bản bộ cài đặt Setup và Portable v9.9.9 kiểm tra máy sạch | `@Anniehatani` | Đã nghiệm thu |
| **Done** | **#25** | Hoàn thiện Slide thuyết trình PPTX và Báo cáo đồ án Word | `@nguyennhuuquynhh07-07` | Đã nghiệm thu |

---

## 📌 PHẦN 4: TỔNG KẾT NGHIỆM THU TOÀN DIỆN DỰ ÁN QUA 3 SPRINT

### 1. Bảng đối chiếu tiến độ 3 Sprint

| Giai đoạn | Tên Sprint | Số Issues | Trọng tâm công việc | Trạng thái |
| :---: | :--- | :---: | :--- | :---: |
| **Sprint 1** | **Nền tảng Gamification & Core Duolingo** | 9 | CSDL 3NF Cloudflare D1, Lộ trình Duolingo, Hearts, XP, Gems, Streak, Mascot Thỏ Bảy Màu, Shop & Leaderboards | **Hoàn thành 100%** |
| **Sprint 2** | **Cổng trường IU, Trợ lý AI & Mạng xã hội** | 8 | Đăng nhập 1-Click IU SSO qua Office 365, bóc tách bảng điểm & 6 tuần lịch học, GPA thang 10 & 4, Trợ lý AI DeepSeek, Kết bạn & Chat 1-1 realtime, Shop Nitro VIP, Dark Mode | **Hoàn thành 100%** |
| **Sprint 3** | **Tổng kết, Đóng gói Desktop & Báo cáo đồ án** | 5 | Tối ưu ASAR mở tức thì 1-2s, gỡ bỏ tài khoản thử nghiệm / bảo mật, kiểm thử E2E toàn diện, xuất bản Setup & Portable v9.9.9, Báo cáo Word & Slide PPTX | **Hoàn thành 100%** |
| **Toàn dự án** | **Tổng hợp 3 Sprint** | **22 công việc + 3 vai trò = 25 Issues** | **Hoàn thiện trọn vẹn sản phẩm từ Core Backend, Frontend, AI đến Bộ cài đặt Desktop** | **ĐẠT XUẤT SẮC** |

---

### 2. Sản phẩm bàn giao chính thức
1. **Ứng dụng Desktop Windows:**
   - Bộ cài đặt: `dist-electron/3TG Học Vui Mỗi Ngày Setup 9.9.9.exe` (~111 MB).
   - Bản Portable: `dist-electron/3TG Học Vui Mỗi Ngày 9.9.9.exe` (~111 MB).
2. **Kho mã nguồn & Quản lý dự án:**
   - Repository GitHub: [`https://github.com/Anniehatani/appstudyAI`](https://github.com/Anniehatani/appstudyAI)
   - 25 Issues phân công rõ ràng, 3 Milestones bám sát 3 Sprint, nhãn nhãn phân loại chuẩn mực.
3. **Bộ tài liệu bảo vệ đồ án:**
   - Báo cáo tổng kết đồ án Word (`.docx`) tại thư mục `tổng kết sprint 2` / dự án.
   - Slide thuyết trình PowerPoint (`.pptx`) phong cách TONE PINK hiện đại.
   - 3 File tài liệu Sprint chi tiết: `Sprint_1.md`, `Sprint_2.md`, `Sprint_3.md`.
