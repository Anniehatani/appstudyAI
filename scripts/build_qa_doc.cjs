const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🚀 Bắt đầu tạo 100 Câu hỏi & Đáp vấn đáp Công nghệ phần mềm...");

// Dữ liệu 100 câu hỏi
const chapters = [
  {
    chapterId: 1,
    title: "Chương 1: Kiến trúc phần mềm & Công nghệ nền tảng (Architecture & Tech Stack)",
    desc: "Bao gồm 15 câu hỏi trọng tâm về mô hình hệ thống, Serverless Edge Computing, Single Page Application, RESTful API và tối ưu hiệu năng mạng biên.",
    questions: [
      {
        q: "Kiến trúc tổng thể của hệ thống 3TG Study AI thuộc loại kiến trúc nào?",
        keywords: "Client-Server, Jamstack, Serverless Edge Computing, Hybrid Desktop (Electron)",
        a: "Hệ thống áp dụng kiến trúc **Client-Server hiện đại** kết hợp mô hình **Serverless Edge Computing (Điện toán biên)** và **Hybrid Desktop**. Cụ thể:\n- **Frontend:** Single Page Application (SPA) viết bằng Vanilla JavaScript chuẩn ES Modules hiện đại, hoạt động đa nền tảng (Web Browser & Electron Desktop).\n- **Backend:** Chạy trên nền tảng Cloudflare Workers sử dụng công nghệ V8 Isolates siêu nhẹ, xử lý logic RESTful API trực tiếp tại các Data Center biên (Edge POPs) gần người dùng nhất.\n- **Data Layer:** Cloudflare D1 (Cơ sở dữ liệu quan hệ SQLite phân tán toàn cầu) kết hợp Cloudflare R2 (Object Storage lưu trữ avatar, video, tệp tin đa phương tiện).",
        tip: "Nhấn mạnh từ khóa 'Serverless Edge Computing' và 'V8 Isolates'. Giảng viên đánh giá rất cao việc không dùng VPS cồng kềnh mà đưa toàn bộ backend lên mạng biên toàn cầu."
      },
      {
        q: "Serverless Edge Computing trong dự án hoạt động như thế nào và khác gì so với kiến trúc Client-Server truyền thống?",
        keywords: "Cloudflare Workers, Cold Start ~0ms, Edge CDN, V8 Isolates vs Docker Containers",
        a: "Trong mô hình truyền thống (Client-Server dạng Monolith như Express/Node trên VPS hoặc Spring Boot), mọi request từ người dùng đều phải bay về một máy chủ trung tâm đặt cố định tại một khu vực địa lý, gây độ trễ cao và chịu rủi ro sập server khi nghẽn mạng.\nNgược lại, với Serverless Edge Computing trên Cloudflare Workers:\n- Mã nguồn backend được phân tán tới hơn 300 thành phố trên thế giới.\n- Request của sinh viên Việt Nam sẽ được phục vụ bởi Data Center ngay tại Hà Nội hoặc TP.HCM với độ trễ mạng biên cực thấp (<50ms).\n- Không có khái niệm khởi động lạnh (Cold Start = 0ms) nhờ cơ chế V8 Isolates nhẹ hơn hàng trăm lần so với việc khởi chạy Container Docker.",
        tip: "Dẫn chứng ngay chỉ số đo đạc thực tế: Độ trễ phản hồi API của hệ thống đo được chỉ từ 8ms - 35ms khi gọi các endpoint kiểm thử."
      },
      {
        q: "Tại sao nhóm lại lựa chọn Cloudflare Workers mà không sử dụng Node.js Express hay NestJS truyền thống?",
        keywords: "Chi phí vận hành, Zero-maintenance, Auto-scaling, Tích hợp sẵn D1 và R2",
        a: "Lựa chọn này dựa trên 4 tiêu chí công nghệ phần mềm:\n1. **Khả năng tự động mở rộng (Auto-scaling vô hạn):** Có thể xử lý hàng chục nghìn sinh viên cùng truy cập mùa thi cử mà không cần cấu hình Load Balancer hay Kubernetes cluster.\n2. **Tối ưu chi phí:** Mô hình Serverless chỉ tính phí khi có request thực tế phát sinh (Pay-per-request), không mất tiền duy trì VPS chạy ngầm 24/7.\n3. **Bảo mật và chống DDoS:** Tận dụng lớp bảo vệ DDoS hàng đầu thế giới của Cloudflare ngay từ tầng DNS và CDN.\n4. **Hệ sinh thái đồng nhất:** Tích hợp liền mạch với D1 Database, R2 Storage và Web Assets qua cơ chế Worker Bindings trực tiếp trong bộ nhớ (Zero-network hop).",
        tip: "Trả lời theo 4 góc độ: Hiệu năng - Khả năng mở rộng - Bảo mật - Chi phí (Cost-efficiency)."
      },
      {
        q: "Phân tích mô hình kiến trúc của ứng dụng Frontend (SPA)? Vì sao nhóm không dùng React/Vue mà lại dùng Vanilla JS?",
        keywords: "Single Page Application (SPA), Component-based Vanilla JS, Zero-build Overhead, Siêu nhẹ (<350KB)",
        a: "Frontend được xây dựng theo kiến trúc **Single Page Application (SPA)** thuần túy:\n- **Cơ chế điều hướng (Client-side Routing):** Sử dụng hàm chuyển đổi view `switchPage(page)` và quản lý trạng thái tập trung trong biến toàn cục `state`, DOM chỉ cập nhật đúng vùng thay đổi mà không cần tải lại toàn bộ trang web (No full-page reload).\n- **Lý do không dùng React/Vue:**\n  1. **Hiệu năng & Kích thước bundle:** Ứng dụng không cần nạp 2-3MB thư viện `node_modules` của React/Vue. Toàn bộ bundle mã nguồn frontend chỉ nặng ~320KB, đạt điểm Google Lighthouse Speed Index gần như tuyệt đối (99/100).\n  2. **Tương thích hoàn hảo với Kiosk Desktop (Electron):** Không có quá trình webpack/vite phức tạp, giảm thiểu tối đa rủi ro xung đột bộ nhớ trong môi trường đóng băng Kiosk Guard.\n  3. **Làm chủ mã nguồn:** Mọi tương tác DOM, hiệu ứng âm thanh và State Machine của Mascot đều được viết thuần, minh bạch và dễ bảo trì.",
        tip: "Nêu rõ: 'Công nghệ phần mềm tốt là chọn công nghệ giải quyết đúng bài toán, không chạy theo phong trào framework khi bài toán cần sự siêu nhẹ và tốc độ tức thì'."
      },
      {
        q: "Kiến trúc Hybrid Desktop với Electron hoạt động ra sao? Electron kết nối với Web như thế nào?",
        keywords: "Main Process, Renderer Process, Context Isolation, Preload Script, IPC (Inter-Process Communication)",
        a: "Ứng dụng máy tính (Desktop) áp dụng kiến trúc **Electron đa tiến trình (Multi-process Architecture)**:\n- **Main Process (`electron/main.cjs`):** Chạy trên môi trường Node.js native của hệ điều hành Windows, có toàn quyền can thiệp phần cứng, quản trị cửa sổ Kiosk, điều khiển màn hình phụ và khởi chạy tiến trình bảo vệ `study_guard.exe`.\n- **Renderer Process (`public/index.html`, `app.js`):** Chạy trong môi trường Chromium an toàn, hiển thị giao diện học tập.\n- **Cầu nối bảo mật (ContextBridge & Preload):** Tuân thủ tuyệt đối chuẩn bảo mật Electron hiện đại (`contextIsolation: true`, `nodeIntegration: false`). Giao tiếp giữa 2 tiến trình thông qua cơ chế IPC an toàn (`ipcRenderer.invoke` và `ipcMain.handle`).",
        tip: "Giảng viên thường gài bẫy hỏi: 'Electron có bị lỗ hổng XSS can thiệp phá máy tính không?'. Hãy khẳng định ngay: Nhờ bật Context Isolation và tắt Node Integration trong Renderer, mã web hoàn toàn bị cô lập khỏi hệ điều hành."
      },
      {
        q: "RESTful API là gì? Hệ thống tuân thủ các nguyên tắc thiết kế RESTful như thế nào?",
        keywords: "Stateless, Resource-oriented, HTTP Verbs (GET, POST, PATCH, DELETE), Chuẩn hóa URI",
        a: "RESTful API là chuẩn kiến trúc truyền thông dựa trên giao thức HTTP, định hướng tài nguyên (Resource-based) và không lưu trạng thái (Stateless).\nHệ thống tuân thủ nghiêm ngặt chuẩn RESTful:\n- **Định danh tài nguyên qua danh từ số nhiều:** `/api/subjects`, `/api/lessons`, `/api/groups`, `/api/messages`, `/api/notes`.\n- **Phân định rõ chức năng qua HTTP Verbs:**\n  - `GET`: Truy vấn tài nguyên (idempotent, an toàn, không thay đổi dữ liệu).\n  - `POST`: Tạo mới tài nguyên (`POST /api/groups`, `POST /api/messages`).\n  - `PATCH`: Cập nhật một phần tài nguyên (`PATCH /api/notes/:id`, `PATCH /api/profile`).\n  - `DELETE`: Xóa tài nguyên (`DELETE /api/notes/:id`, `DELETE /api/profile/avatar`).\n- **Định dạng dữ liệu chuẩn:** 100% Request và Response sử dụng `application/json` đồng bộ.",
        tip: "Chỉ ra điểm đặc biệt: Hệ thống dùng `PATCH` thay vì `PUT` cho việc sửa ghi chú và cập nhật profile vì chỉ cập nhật các trường thay đổi, tiết kiệm băng thông mạng biên."
      },
      {
        q: "Các mã phản hồi HTTP Status Codes phổ biến được hệ thống sử dụng là gì và ý nghĩa trong xử lý lỗi?",
        keywords: "200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests, 500 Internal Error",
        a: "Hệ thống xây dựng lớp `HttpError(status, message)` kế thừa chuẩn `Error` của JavaScript, trả về các mã chuẩn:\n- `200 OK`: Thành công cho các tác vụ GET, PATCH thông thường.\n- `201 Created`: Tạo mới thành công (Ví dụ: tạo nhóm chat, đăng ký tài khoản).\n- `400 Bad Request`: Dữ liệu đầu vào sai định dạng hoặc thiếu trường bắt buộc.\n- `401 Unauthorized`: Người dùng chưa đăng nhập hoặc Cookie phiên đã hết hạn.\n- `403 Forbidden`: Người dùng không có quyền (Ví dụ: thành viên thường cố tình xóa nhóm hoặc thêm bot).\n- `404 Not Found`: Không tìm thấy tài nguyên (Ví dụ: bài học hoặc nhóm không tồn tại).\n- `429 Too Many Requests`: Vượt quá tần suất cho phép (Rate limiting đăng nhập quá 5 lần sai trong 15 phút).\n- `500 Internal Server Error`: Lỗi phát sinh bất ngờ phía server.",
        tip: "Hãy đề cập rằng mã lỗi được đóng gói nhất quán dạng JSON: `{ ok: false, error: 'Thông báo lỗi chi tiết' }`."
      },
      {
        q: "Mô hình kiến trúc hướng sự kiện (Event-Driven Architecture) được áp dụng ở đâu trong đồ án?",
        keywords: "Pomodoro Timer Tick, State Machine Transition, Web Audio Synthesizer, Heartbeat Polling",
        a: "Kiến trúc hướng sự kiện được thể hiện rõ nét ở 3 phân hệ:\n1. **Đồng hồ Pomodoro:** Phát sinh các sự kiện theo chu kỳ thời gian (Timer Tick, Phase Transition giữa Học 25 phút và Nghỉ 5 phút), kích hoạt chuỗi sự kiện âm thanh và cảnh báo trên giao diện.\n2. **Mascot Thỏ Bảy Màu:** Chuyển đổi trạng thái (FSM State Transition) dựa trên các sự kiện tương tác của người dùng: Trả lời đúng (`CORRECT_ANSWER` -> `CHEERING`), trả lời sai (`WRONG_ANSWER` -> `PANIC`), hoàn thành cửa ải (`COMPLETE` -> `GENIUS`).\n3. **Phân hệ Học cùng nhau (Live Study Room):** Sự kiện `heartbeat` gửi định kỳ 10 giây để cập nhật danh sách bạn cùng học trong phòng mà không làm nghẽn server.",
        tip: "Liên hệ sự kiện với mô hình phản xạ tự nhiên của người dùng, chứng minh phần mềm có độ tương tác cao (High Interactivity)."
      },
      {
        q: "Trình bày cơ chế Outbox Pattern và khả năng phục hồi dữ liệu khi mất kết nối trong dự án?",
        keywords: "Outbox Queue, Local Replica, Replay Sync, Eventual Consistency, Idempotency",
        a: "Để đảm bảo hệ thống có thể hoạt động ngay cả khi mạng chập chờn hoặc phục vụ chế độ thi offline trong Electron:\n- **Outbox Pattern:** Khi người dùng thực hiện ghi dữ liệu (ví dụ cập nhật tiến độ học tập hoặc ghi chú), dữ liệu trước hết được ghi vào bảng hàng đợi cục bộ `outbox_events` trong SQLite local với trạng thái `pending`.\n- **Cơ chế Replay Sync (`/api/sync/replay`):** Một tiến trình nền định kỳ kiểm tra kết nối mạng. Khi có internet trở lại, hệ thống sẽ đẩy tuần tự các sự kiện trong Outbox lên Cloudflare D1 theo đúng thứ tự thời gian, đảm bảo tính nhất quán cuối cùng (**Eventual Consistency**).\n- Các thao tác đều thiết kế mang tính **Idempotent** (thực thi nhiều lần không làm sai lệch kết quả).",
        tip: "Outbox Pattern là một mẫu kiến trúc kinh điển của hệ thống phân tán cấp doanh nghiệp (Enterprise Architecture). Giảng viên sẽ cực kỳ ấn tượng nếu bạn nêu bật được thuật ngữ này."
      },
      {
        q: "Làm thế nào hệ thống đạt được tốc độ tải trang dưới 100ms trên toàn cầu?",
        keywords: "Global CDN Edge, Asset Compression (Gzip/Brotli), Cache-Control Immutable, Zero Runtime Dependencies",
        a: "Tốc độ dưới 100ms đạt được nhờ kết hợp 4 giải pháp công nghệ:\n1. **Cloudflare Edge CDN:** Toàn bộ tệp tĩnh (HTML, CSS, JS, SVG) được phân phối tức thì từ máy chủ proxy biên đặt sát người dùng.\n2. **Kỹ thuật nén dữ liệu:** Tự động kích hoạt nén Gzip và Brotli, giảm dung lượng truyền tải từ 326KB xuống chỉ còn 76KB gzip.\n3. **Chiến lược bộ nhớ đệm thông minh (Cache Busting):** Tệp tĩnh được gắn version query hash (`styles.css?v=4.0.8`), đi kèm header `Cache-Control: public, max-age=31536000, immutable`, giúp trình duyệt tải gần như 0ms ở các lần truy cập tiếp theo.\n4. **Không phụ thuộc thư viện nặng ngoài:** Không import bundle React 2MB hay thư viện UI bên ngoài, DOM được render bằng Native JavaScript Template Literals.",
        tip: "Chỉ ra rằng trên Network tab của Chrome DevTools, kích thước tài nguyên gzip tải qua mạng chỉ vỏn vẹn 76.4 KiB."
      },
      {
        q: "So sánh Serverless Edge với Container Docker / Kubernetes trong việc triển khai ứng dụng giáo dục?",
        keywords: "Quản trị hạ tầng, Chi phí ban đầu, Tốc độ mở rộng, Mức độ phức tạp DevOps",
        a: "- **Docker / Kubernetes:** Phù hợp với các hệ thống phức tạp có nhiều service chạy nền liên tục (background daemons), yêu cầu cấu hình hạ tầng mạng phức tạp, tốn chi phí thuê máy chủ cố định (ít nhất 20-50$/tháng) và cần kỹ sư DevOps quản trị cụm máy chủ.\n- **Serverless Edge (Cloudflare):** Không cần máy chủ (Zero Server Management), chi phí ban đầu là 0 đồng, triển khai chỉ bằng 1 dòng lệnh `wrangler deploy`, tự động phân tán ra 300+ thành phố trên toàn cầu chỉ trong 5 giây. Đối với bài toán học tập của sinh viên, Serverless Edge vượt trội hoàn toàn về tốc độ, chi phí và khả năng chống sập.",
        tip: "Nhấn mạnh tiêu chí 'Phù hợp ngữ cảnh' (Context-driven Architecture) trong Công nghệ phần mềm."
      },
      {
        q: "Tính độc lập nền tảng (Cross-platform) của đồ án được kiểm soát và duy trì như thế nào?",
        keywords: "Web Standards, Electron Wrapper, Feature Detection (`window.electronAPI`), Responsive CSS",
        a: "Hệ thống sử dụng nguyên tắc **'Write Once, Run Everywhere' (Viết một lần, chạy khắp nơi)**:\n- **Phần lõi dùng Web Standards:** Sử dụng HTML5, CSS3 hiện đại (Grid, Flexbox, CSS Variables) và ES Modules thuần túy, hoạt động chuẩn xác trên mọi trình duyệt (Chrome, Safari, Edge, Firefox trên cả PC và Mobile).\n- **Kỹ thuật Feature Detection:** Trong mã JavaScript, hệ thống kiểm tra sự tồn tại của `window.electronAPI` để kích hoạt các tính năng đặc thù của Desktop (như Kiosk Native Guard, Stream nhạc cục bộ 206), trong khi trên Web Browser hệ thống chuyển sang chế độ Web an toàn tương ứng mà không làm gián đoạn trải nghiệm người dùng.",
        tip: "Nêu ví dụ cụ thể: Chức năng đăng nhập Cổng trường IU trên Desktop thì dùng Electron BrowserWindow cào cookie tự động, còn trên Web thì dùng Bookmarklet 1-chạm."
      },
      {
        q: "Làm thế nào hệ thống xử lý bài toán CORS (Cross-Origin Resource Sharing) trong môi trường phân tán?",
        keywords: "CORS Headers, Access-Control-Allow-Origin, Same-Origin Policy, Bookmarklet Injection",
        a: "- Đối với API nội bộ: Backend Cloudflare Workers được cấu hình bộ lọc CORS trả về các header chuẩn:\n  - `Access-Control-Allow-Origin: *` hoặc whitelist domain ứng dụng.\n  - `Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS`.\n  - `Access-Control-Allow-Headers: Content-Type, Authorization, Cookie`.\n- Xử lý Request OPTIONS (Preflight Request) tự động với mã HTTP 204 No Content.\n- Đối với bài toán đọc điểm từ Cổng trường đại học CMC (`iu.cmcu.edu.vn`) có chính sách Same-Origin nghiêm ngặt trên Web: Nhóm phát minh giải pháp Bookmarklet/Console 1-chạm chạy trực tiếp trong ngữ cảnh trang trường để truyền dữ liệu về 3TG Study một cách hợp pháp và an toàn.",
        tip: "Giải thích rõ ràng: CORS là cơ chế bảo mật của trình duyệt, không phải lỗi server, và nhóm đã giải quyết nó một cách bài bản."
      },
      {
        q: "Nguyên lý phân tách mối quan tâm (Separation of Concerns - SoC) được thể hiện như thế nào trong cấu trúc thư mục dự án?",
        keywords: "Mô đun hóa, MVC/Layered Structure, `src/`, `public/`, `electron/`, `sprint/`",
        a: "Mã nguồn đồ án được phân chia thành các lớp rõ rệt theo nguyên lý SoC:\n1. **Lớp Giao diện & Hiển thị (`public/`):** Tách biệt `index.html` (cấu trúc khung), `styles.css` (giao diện, theme và responsive), `app.js` (logic điều hướng và tương tác người dùng), `tho-bay-mau.js` (bộ máy hoạt hình Mascot SVG độc lập).\n2. **Lớp Nghiệp vụ & Dịch vụ Biên (`src/`):** `index.js` (API Gateway, router, middleware xác thực), `bot3tg.js` (trung tâm xử lý media và NLP bot), `academic_service.js` (thuật toán giải mã và phân tích GPA học thuật).\n3. **Lớp Nền tảng Hệ điều hành (`electron/`):** Chứa các tiến trình Native Wrapper của Windows và logic Kiosk Guard.\n4. **Lớp Quản trị Quy trình (`sprint/`):** Chứa tài liệu quản trị Scrum từ Sprint 1 đến Sprint 6.",
        tip: "Chỉ ra rằng tính mô-đun hóa giúp nhóm dễ dàng bảo trì, sửa lỗi một phân hệ mà không làm ảnh hưởng phân hệ khác (Low Coupling, High Cohesion)."
      },
      {
        q: "Single Point of Failure (SPOF - Điểm lỗi đơn lẻ) được giảm thiểu như thế nào trong kiến trúc này?",
        keywords: "Edge Replication, Multi-Region Fallback, Dual-Mode Storage (R2 & Data URI), Groq Multi-model",
        a: "Hệ thống triệt tiêu SPOF qua 3 giải pháp:\n1. **Phân tán Data Center:** Không có một máy chủ vật lý duy nhất. Nếu một trạm CDN của Cloudflare gặp sự cố, DNS tự động định tuyến sang trạm gần nhất trong vài mili-giây.\n2. **Cơ chế Fallback lưu trữ:** Khi tải ảnh avatar hoặc file, nếu R2 Storage tạm thời gián đoạn, hệ thống tự động fallback sang lưu trữ Data URI mã hóa Base64 trong database D1 để dịch vụ không bao giờ bị đứt quãng.\n3. **Xử lý AI thông minh:** Khi API AI Groq quá tải, Bot 3TG tự động kích hoạt bộ quy tắc NLP rule-based và kho media nội bộ đóng gói sẵn để phản hồi ngay cho sinh viên.",
        tip: "Khẳng định: 'Hệ thống thiết kế theo triết lý Graceful Degradation - suy giảm tính năng nhưng không bao giờ sập hoàn toàn'."
      }
    ]
  },
  {
    chapterId: 2,
    title: "Chương 2: Cơ sở dữ liệu & Mô hình hóa dữ liệu (Database Design, ERD & 3NF)",
    desc: "Bao gồm 17 câu hỏi chuyên sâu về kiến trúc CSDL quan hệ Cloudflare D1 (SQLite), các dạng chuẩn hóa 1NF, 2NF, 3NF, cấu trúc 33 bảng, chỉ mục và bảo mật chống SQL Injection.",
    questions: [
      {
        q: "Cơ sở dữ liệu của dự án sử dụng công nghệ gì và bản chất hoạt động của nó?",
        keywords: "Cloudflare D1, SQLite Engine, Serverless SQL Database, Global Read-Replication",
        a: "Hệ thống sử dụng **Cloudflare D1** làm Cơ sở dữ liệu quan hệ chính (RDBMS):\n- **Bản chất:** D1 được xây dựng dựa trên nhân **SQLite**, một công cụ CSDL quan hệ mạnh mẽ, đáng tin cậy và có tốc độ xử lý trong bộ nhớ cực nhanh.\n- **Kiến trúc phân tán:** D1 kết hợp công nghệ nhân bản đọc toàn cầu (Global Read-Replication), cho phép truy vấn đọc (SELECT) chạy ngay tại Data Center biên với độ trễ chỉ vài mili-giây, trong khi các truy vấn ghi (INSERT, UPDATE, DELETE) được đồng bộ an toàn qua giao thức Raft consensus.",
        tip: "Nhắc lại rằng SQLite không phải là 'đồ chơi' mà là CSDL được triển khai nhiều nhất hành tinh (trên hàng tỷ smartphone và máy bay), khi đưa lên Cloudflare D1 nó trở thành hệ CSDL phân tán cấp đám mây."
      },
      {
        q: "Dạng chuẩn 1 (1NF - First Normal Form) trong cơ sở dữ liệu của dự án là gì?",
        keywords: "Tính nguyên tử (Atomicity), Không chứa mảng đa trị, Phân tách bảng con",
        a: "**Định nghĩa 1NF:** Một bảng đạt 1NF khi và chỉ khi mọi thuộc tính đều chứa các giá trị nguyên tử (Atomic values), không có thuộc tính lặp và không chứa danh sách/mảng giá trị trong một cột.\n**Áp dụng trong dự án:**\n- Thay vì lưu danh sách môn học của một học kỳ dưới dạng mảng trong bảng sinh viên, hệ thống tách thành bảng `user_academic_subjects` độc lập với mỗi dòng là một môn học nguyên tử.\n- Bảng bài học `lessons`: Mỗi bài học chỉ đại diện cho một thực thể đơn nhất, các câu hỏi trắc nghiệm được tách thành bảng riêng `questions` liên kết qua khóa ngoại `lesson_id`.\n- Đối với các trường đặc biệt như `social_links` (Facebook, GitHub, Instagram) hoặc `options` câu hỏi trắc nghiệm, hệ thống lưu dưới dạng JSON có cấu trúc chuẩn hóa để đảm bảo tính toàn vẹn ngữ nghĩa.",
        tip: "Nhấn mạnh từ khóa 'Tính nguyên tử của dữ liệu (Atomic Values)'."
      },
      {
        q: "Dạng chuẩn 2 (2NF - Second Normal Form) trong cơ sở dữ liệu của dự án là gì?",
        keywords: "Đạt 1NF, Phụ thuộc hàm đầy đủ vào khóa chính, Khắc phục phụ thuộc một phần",
        a: "**Định nghĩa 2NF:** Một bảng đạt 2NF khi nó đã đạt 1NF và **mọi thuộc tính không khóa đều phải phụ thuộc hàm đầy đủ vào toàn bộ khóa chính**, không được phụ thuộc vào một phần của khóa chính (đối với các bảng có khóa chính hỗn hợp - Composite Primary Key).\n**Áp dụng trong dự án:**\n- Xét bảng liên kết nhiều - nhiều `chat_group_members(group_id, user_id, role, joined_at)`:\n  - Khóa chính là cặp `(group_id, user_id)`.\n  - Thuộc tính `role` (admin, deputy, member) và `joined_at` phụ thuộc vào cả `group_id` lẫn `user_id` (học viên X đóng vai trò Trưởng nhóm trong nhóm Y nhưng là thành viên trong nhóm Z).\n  - Hệ thống **không** lưu `group_name` hay `user_full_name` trong bảng này (vì `group_name` chỉ phụ thuộc vào `group_id`, `user_full_name` chỉ phụ thuộc vào `user_id`). Nhờ đó loại bỏ hoàn toàn sự phụ thuộc một phần, đạt 2NF chuẩn xác.",
        tip: "Lấy ngay ví dụ bảng `chat_group_members` để minh họa khóa chính tổ hợp và sự phụ thuộc hàm đầy đủ."
      },
      {
        q: "3NF (Dạng chuẩn 3 - Third Normal Form) trong dự án là gì? Phân tích một ví dụ cụ thể trong mã nguồn?",
        keywords: "Đạt 2NF, Không có phụ thuộc bắc cầu (No Transitive Dependency), X -> Y và Y -> Z",
        a: "**Định nghĩa 3NF:** Một bảng đạt 3NF khi nó đã đạt 2NF và **không tồn tại bất kỳ thuộc tính không khóa nào phụ thuộc bắc cầu vào khóa chính** (nghĩa là nếu có $X \\to Y$ và $Y \\to Z$ thì $Z$ không được nằm chung bảng với $X$).\n**Ví dụ kinh điển trong dự án 3TG Study:**\n- Xem xét cây phân cấp giáo trình: Môn học (`subjects`) $\\to$ Chương học (`units`) $\\to$ Bài học (`lessons`).\n  - Bảng `lessons` có khóa chính là `id`.\n  - `lessons` chỉ lưu khóa ngoại `unit_id` (Bài học thuộc về Chương nào).\n  - `lessons` **tuyệt đối không lưu cột `subject_id` hay `subject_name`** trong bảng `lessons`! Bởi vì:\n    $$\\text{lesson\\_id} \\to \\text{unit\\_id} \\quad \\text{và} \\quad \\text{unit\\_id} \\to \\text{subject\\_id}$$\n  - Nếu lưu cả `subject_id` trong `lessons`, khi đổi tên hoặc cập nhật môn học, ta sẽ gặp hiện tượng **Dư thừa dữ liệu (Data Redundancy)** và **Bất thường khi cập nhật (Update Anomaly)**.\n- Bằng cách chỉ liên kết `unit_id`, cấu trúc dữ liệu đạt chuẩn 3NF hoàn hảo.",
        tip: "Đây là câu hỏi 'ăn điểm 10' tuyệt đối. Hãy vẽ hoặc chỉ ra mối quan hệ: Lesson -> Unit -> Subject để chứng minh không có phụ thuộc bắc cầu."
      },
      {
        q: "Có trường hợp nào trong hệ thống chấp nhận phi chuẩn hóa (Denormalization) không? Vì sao lại làm như vậy?",
        keywords: "Denormalization, Tối ưu đọc (Read Optimization), Bảng `user_stats`, Giảm tải JOIN",
        a: "Trong công nghệ phần mềm thực tế, đôi khi ta chủ động **Phi chuẩn hóa có kiểm soát (Controlled Denormalization)** để tối ưu tốc độ đọc:\n- **Ví dụ trong dự án:** Bảng `user_stats` lưu trữ trực tiếp các thuộc tính tính toán sẵn: `total_xp`, `current_streak`, `longest_streak`, `gems`, `hearts`.\n- **Lý do kỹ thuật:**\n  - Về mặt lý thuyết chuẩn hóa thuần túy, `total_xp` có thể tính bằng `SUM(xp)` từ bảng lịch sử `user_progress`, và `current_streak` có thể tính bằng cách quét bảng nhật ký `user_streak_history`.\n  - Tuy nhiên, mỗi khi người dùng tải trang hoặc mở app, việc chạy câu lệnh `SUM()` và thuật toán quét ngày tháng trên hàng triệu bản ghi sẽ gây nghẽn CPU và làm chậm ứng dụng.\n  - Việc lưu sẵn giá trị tổng hợp trong `user_stats` và cập nhật bằng Transaction nguyên tử (`UPDATE user_stats SET total_xp = total_xp + ?`) giúp tốc độ hiển thị đạt tức thì (O(1)).",
        tip: "Khẳng định: 'Kỹ sư phần mềm giỏi là người hiểu rõ lý thuyết 3NF nhưng biết khi nào cần phi chuẩn hóa để bảo vệ hiệu năng hệ thống'."
      },
      {
        q: "Cấu trúc cơ sở dữ liệu của dự án bao gồm bao nhiêu bảng? Phân loại theo các nhóm chức năng?",
        keywords: "33 bảng, 7 phân hệ chính, Tính toàn vẹn thực thể",
        a: "Cơ sở dữ liệu của dự án gồm **33 bảng**, phân bổ khoa học thành 7 nhóm phân hệ chức năng:\n1. **Phân hệ Người dùng & Xác thực:** `accounts`, `profiles`, `user_stats`, `user_inventory`.\n2. **Phân hệ Giáo trình & Nội dung học:** `subjects`, `units`, `lessons`, `questions`, `user_progress`, `user_mistakes`.\n3. **Phân hệ Gamification & Động lực:** `weekly_leaderboards`, `user_achievements`, `achievements`, `user_streak_history`, `daily_quests`.\n4. **Phân hệ Tập trung Pomodoro Kiosk:** `user_pomodoro_sessions`, `pomodoro_active_learners`, `user_custom_audio`.\n5. **Phân hệ Mạng xã hội & Chat nhóm:** `chat_groups`, `chat_group_members`, `chat_group_messages`, `friendships`, `user_direct_messages`.\n6. **Phân hệ Học thuật Cổng trường CMCU:** `user_academic_transcripts`, `academic_semesters`, `academic_subjects`, `academic_ai_advisors`.\n7. **Phân hệ Đồng bộ Ngoại tuyến & Hệ thống:** `outbox_events`, `system_audit_logs`, `chat_notifications`.",
        tip: "Nêu con số 33 bảng để thể hiện quy mô đồ án lớn, đạt tiêu chuẩn một hệ thống phần mềm thương mại hoàn chỉnh."
      },
      {
        q: "So sánh chiến lược sử dụng khóa chính: UUID v4 (chuỗi 36 ký tự) và Integer Auto-increment?",
        keywords: "UUID v4 (Distributed ID), Auto-increment Integer, ID Enumeration Attack, Sharding",
        a: "Hệ thống kết hợp thông minh cả 2 chiến lược tùy theo bản chất của từng bảng:\n- **Sử dụng UUID v4 (ví dụ `user_id`, `group_id`, `conversation_id`):**\n  - *Ưu điểm:* Không thể bị tấn công đoán mã ID (Chống ID Enumeration Attack / Insecure Direct Object References - IDOR). Đảm bảo tính duy nhất trên toàn cầu (Globally Unique), cho phép Client tự sinh ID khi offline mà không lo trùng lặp khi đồng bộ lên Cloud.\n- **Sử dụng Integer Auto-increment (ví dụ `messages.id`, `notes.id`, `lessons.id`):**\n  - *Ưu điểm:* Tiết kiệm dung lượng lưu trữ chỉ mục (B-Tree Index gọn gàng), tốc độ sắp xếp theo thứ tự thời gian (`ORDER BY id ASC/DESC`) cực nhanh, giúp hiển thị tin nhắn tuần tự chính xác.",
        tip: "Chỉ ra đây là quyết định thiết kế (Design Decision) có chủ đích rõ ràng, kết hợp bảo mật và hiệu năng."
      },
      {
        q: "Khóa ngoại (Foreign Key) và chiến lược toàn vẹn tham chiếu `ON DELETE CASCADE` được áp dụng như thế nào?",
        keywords: "Referential Integrity, ON DELETE CASCADE, Mồ côi dữ liệu (Orphan Records)",
        a: "Khóa ngoại đảm bảo **Tính toàn vẹn tham chiếu (Referential Integrity)**:\n- Khi một thực thể cha bị xóa, toàn bộ các bản ghi con phụ thuộc cũng phải được tự động dọn dẹp để tránh tình trạng 'dữ liệu mồ côi' (Orphan Records) gây rác bộ nhớ.\n- **Ví dụ trong dự án:**\n  - Khi xóa một nhóm chat `chat_groups`, ràng buộc `ON DELETE CASCADE` sẽ tự động xóa sạch toàn bộ thành viên trong `chat_group_members` và tin nhắn trong `chat_group_messages` liên quan đến nhóm đó.\n  - Khi xóa một bài học `lessons`, các câu hỏi trắc nghiệm `questions` thuộc bài học đó tự động biến mất.\n- Ràng buộc khóa ngoại được D1 SQLite kiểm soát chặt chẽ với cờ `PRAGMA foreign_keys = ON;`.",
        tip: "Cảnh báo giảng viên biết rằng nếu không có CASCADE, hệ thống sẽ bị lỗi Foreign Key Constraint Violation khi xóa cha."
      },
      {
        q: "Đánh chỉ mục (Indexing) là gì? Những cột nào trong cơ sở dữ liệu bắt buộc phải đánh chỉ mục?",
        keywords: "B-Tree Index, Tìm kiếm O(log N) vs Full Table Scan O(N), `user_id`, `group_id`, `created_at`",
        a: "Chỉ mục (Index) là cấu trúc dữ liệu phụ trợ (thường là B-Tree) giúp máy chủ tìm kiếm dữ liệu với độ phức tạp $O(\\log N)$ thay vì phải quét toàn bộ bảng (Full Table Scan $O(N)$).\n**Các trường được đánh chỉ mục trọng yếu trong dự án:**\n1. `chat_group_messages(group_id, id DESC)`: Tối ưu tải 50 tin nhắn mới nhất của phòng chat trong chớp mắt.\n2. `user_progress(user_id, lesson_id)`: Kiểm tra trạng thái hoàn thành bài học của sinh viên với tốc độ tức thì.\n3. `accounts(username)`: Đảm bảo tìm kiếm đăng nhập duy nhất chỉ trong 1ms.\n4. `friendships(user_id, friend_id)`: Tối ưu tra cứu danh sách bạn bè và lời mời kết bạn 2 chiều.",
        tip: "Nêu rõ sự đánh đổi (Trade-off): Đánh chỉ mục tăng tốc độ đọc (Read) nhưng làm chậm nhẹ thao tác ghi (Write) và tốn dung lượng đĩa, vì vậy nhóm chỉ đánh chỉ mục trên các cột thường xuyên nằm trong mệnh đề `WHERE` và `JOIN`."
      },
      {
        q: "Khái niệm Transaction (Giao dịch) và phương thức `env.DB.batch()` được sử dụng trong trường hợp nào?",
        keywords: "ACID Properties, Atomicity (Nguyên tử), `db.batch()`, Rollback",
        a: "Transaction đảm bảo 4 thuộc tính **ACID (Atomicity, Consistency, Isolation, Durability)**. Nguyên tử (Atomicity) nghĩa là: 'Tất cả cùng thành công hoặc tất cả cùng thất bại (All-or-Nothing)', không có trạng thái lấp lửng.\n**Áp dụng cụ thể trong đồ án:**\n- Khi người dùng đăng ký tài khoản mới: Cần thực hiện đồng thời 4 thao tác:\n  1. Chèn thông tin vào `accounts`.\n  2. Chèn hồ sơ vào `profiles`.\n  3. Khởi tạo số liệu mặc định trong `user_stats` (50 gems, 5 tim).\n  4. Tặng bùa bảo vệ chuỗi trong `user_inventory`.\n- Nhóm sử dụng phương thức `await env.DB.batch([op1, op2, op3, op4])` của Cloudflare D1 để đóng gói toàn bộ 4 câu lệnh vào một Transaction duy nhất. Nếu bất kỳ câu lệnh nào thất bại (ví dụ username bị trùng), toàn bộ giao dịch được Rollback an toàn.",
        tip: "Dẫn chứng việc dùng Transaction khi mua đồ trong Shop: Trừ tiền đá quý (gems) và cộng vật phẩm vào kho đồ phải nằm trong cùng một Transaction để chống gian lận trừ tiền mà không nhận đồ."
      },
      {
        q: "Vì sao hệ thống lưu tệp tin đa phương tiện trên Cloudflare R2 mà không lưu trực tiếp dạng BLOB trong Database?",
        keywords: "Object Storage (S3-compatible), Database Bloat, Giảm tải I/O, Chi phí băng thông",
        a: "Đây là bài toán kinh điển trong Kỹ nghệ phần mềm về quản lý tài nguyên:\n1. **Chống phình to CSDL (Prevent Database Bloat):** Các file video MP4, ảnh avatar chất lượng cao có dung lượng từ vài trăm KB đến hàng chục MB. Nếu lưu nhị phân (BLOB) vào CSDL quan hệ, kích thước database sẽ tăng vọt, làm chậm các thao tác backup, restore, index và cache RAM của SQLite.\n2. **Hiệu năng truyền phát:** Cloudflare R2 là hệ thống Object Storage tương thích S3 chuẩn, hỗ trợ truyền phát trực tiếp (Streaming) và phân phối CDN tốc độ cao, giải phóng hoàn toàn gánh nặng I/O cho CSDL.\n3. **Mô hình kết hợp:** Database chỉ lưu đường dẫn URL dạng văn bản (`/media/avatars/...`), còn dữ liệu nhị phân thực tế nằm trên R2.",
        tip: "Nhắc thêm ưu điểm của Cloudflare R2: Miễn phí hoàn toàn băng thông tải về (Zero Egress Fee), giúp ứng dụng vận hành thương mại mà không sợ phát sinh chi phí ẩn."
      },
      {
        q: "Mô hình quan hệ Nhiều - Nhiều (N - N) giữa Người dùng và Nhóm chat được hiện thực hóa như thế nào?",
        keywords: "Junction Table (Bảng trung gian), Khóa chính kết hợp, `chat_group_members`",
        a: "- Một người dùng có thể tham gia nhiều nhóm học tập, và một nhóm học tập chứa nhiều người dùng $\\to$ Đây là quan hệ Nhiều - Nhiều (N-N).\n- Trong CSDL quan hệ, không thể đặt khóa ngoại trực tiếp giữa 2 bảng `accounts` và `chat_groups`. Bắt buộc phải sử dụng **Bảng liên kết trung gian (Junction Table)** là `chat_group_members`.\n- Bảng này chứa 2 khóa ngoại tham chiếu về 2 bảng cha:\n  - `user_id REFERENCES accounts(user_id)`\n  - `group_id REFERENCES chat_groups(id)`\n- Bổ sung thêm các thuộc tính mô tả mối quan hệ: `role` (admin, deputy, member), `joined_at`.",
        tip: "Vẽ nhẩm sơ đồ quan hệ: Users (1) --- (N) Group_Members (N) --- (1) Groups."
      },
      {
        q: "Hệ thống quản lý dữ liệu lịch sử chuỗi ngày học (Streaks) theo thời gian như thế nào?",
        keywords: "Time-series evaluation, `user_streak_history`, Bùa đông băng (Freeze), Idempotent logic",
        a: "- Dữ liệu chuỗi Streak được theo dõi hàng ngày qua bảng `user_streak_history(user_id, activity_date, status)` với các trạng thái: `completed`, `freeze_used`, `missed`.\n- **Thuật toán đánh giá chuỗi (`evaluateUserStreak`):**\n  - So sánh ngày hoạt động gần nhất (`last_active_date`) với ngày hiện tại của Việt Nam (`vietDate()` theo múi giờ UTC+7).\n  - Nếu người dùng học liên tục hôm nay và hôm qua: Giữ nguyên và cộng chuỗi.\n  - Nếu nghỉ 1 ngày: Hệ thống tự động kiểm tra kho đồ (`user_inventory`), nếu có bùa `streak_freeze`, tự động tiêu thụ 1 bùa để đóng băng ngày nghỉ và bảo toàn chuỗi.\n  - Nếu nghỉ quá số ngày bảo vệ: Đặt lại chuỗi `current_streak = 0` một cách minh bạch.",
        tip: "Nhấn mạnh việc xử lý múi giờ UTC+7 chuẩn xác để tránh trường hợp học lúc 23h59 bị tính nhầm sang ngày mới."
      },
      {
        q: "Làm thế nào hệ thống đảm bảo tính toàn vẹn dữ liệu (Data Integrity)?",
        keywords: "Entity Integrity, Referential Integrity, Domain Integrity, Check Constraints",
        a: "Hệ thống bảo vệ toàn vẹn dữ liệu qua 3 cấp độ:\n1. **Toàn vẹn thực thể (Entity Integrity):** Mọi bảng đều có Khóa chính (`PRIMARY KEY`) duy nhất, không rỗng (`NOT NULL`).\n2. **Toàn vẹn tham chiếu (Referential Integrity):** Sử dụng các ràng buộc khóa ngoại `FOREIGN KEY` với cơ chế kiểm tra tự động `ON DELETE CASCADE` hoặc `ON DELETE SET NULL`.\n3. **Toàn vẹn miền giá trị (Domain Integrity):** Giới hạn miền dữ liệu hợp lệ qua các ràng buộc kiểu dữ liệu, mệnh đề `CHECK` (ví dụ: `hearts >= 0`, `gems >= 0`, `role IN ('admin', 'deputy', 'member')`) và giá trị mặc định `DEFAULT`.",
        tip: "Trả lời theo 3 trụ cột Integrity chuẩn lý thuyết CSDL: Thực thể - Tham chiếu - Miền giá trị."
      },
      {
        q: "Bảo mật CSDL: Hệ thống ngăn chặn triệt để lỗ hổng SQL Injection bằng cách nào?",
        keywords: "Prepared Statements, Parameterized Queries (`.bind()`), Không nối chuỗi SQL",
        a: "- **Nguyên nhân SQL Injection:** Do lập trình viên ghép chuỗi đầu vào của người dùng trực tiếp vào câu lệnh SQL (`'SELECT * FROM users WHERE name = ' + input`), kẻ tấn công có thể chèn các ký tự như `' OR '1'='1` để phá hủy CSDL.\n- **Giải pháp triệt để trong dự án:**\n  - 100% các câu lệnh truy vấn trong `src/index.js` đều sử dụng **Prepared Statements với Parameter Binding** của Cloudflare D1:\n  - Ví dụ: `env.DB.prepare('SELECT * FROM accounts WHERE username = ?').bind(username).first()`.\n  - Trình phân tích cú pháp SQL sẽ biên dịch trước cấu trúc lệnh, dữ liệu đầu vào trong hàm `.bind()` luôn được đối xử thuần túy là tham số (Literals), ngăn chặn 100% nguy cơ tiêm mã độc SQL.",
        tip: "Mở mã nguồn chỉ trực tiếp cho cô thấy tất cả các câu lệnh đều có dấu hỏi chấm `?` và hàm `.bind()`, tuyệt đối không có nối chuỗi `+`."
      },
      {
        q: "Bảng `user_academic_transcripts` lưu trữ dữ liệu điểm như thế nào để phục vụ thuật toán cố vấn AI?",
        keywords: "JSON Document Storage, Structured GPA Hierarchy, What-If Simulation Data",
        a: "- Bảng `user_academic_transcripts` lưu trữ toàn bộ dữ liệu bảng điểm cào từ cổng trường CMCU:\n  - Cột `student_info`: Lưu thông tin sinh viên (MSSV, lớp, ngành học, số tín chỉ tích lũy).\n  - Cột `raw_subjects`: Lưu danh sách các môn đã học đi kèm điểm thành phần (chuyên cần, bài tập, giữa kỳ, cuối kỳ, điểm hệ 10, hệ 4 và điểm chữ).\n  - Cột `ai_advisor_analysis`: Lưu trữ phân tích chiến lược của AI.\n- **Lợi ích:** Cấu trúc này cho phép thuật toán What-If mô phỏng cải thiện điểm ngay lập tức trên máy khách mà không cần gọi truy vấn phức tạp tới server.",
        tip: "Nhắc đến việc hệ thống có hàm khử trùng lặp điểm học lại (`deduplicateClientActiveCourses`), lấy điểm cao nhất của môn cải thiện."
      },
      {
        q: "Sự khác biệt giữa lưu trữ SQL truyền thống và SQLite phân tán D1 trong việc xử lý đồng thời (Concurrency)?",
        keywords: "Optimistic Concurrency, Single-writer Multiple-readers, Cloudflare Pipeline",
        a: "- **SQL truyền thống (như MySQL/PostgreSQL):** Sử dụng các cơ chế khóa hàng (Row-level Locking) hoặc MVCC phức tạp trên máy chủ đơn lẻ.\n- **Cloudflare D1:** Áp dụng mô hình **Single-writer Multiple-readers** kết hợp giao thức đồng thuận Raft. Mọi node biên trên thế giới đều có thể đọc dữ liệu đồng thời với tốc độ song song không giới hạn. Các thao tác ghi được điều phối tuần tự qua pipeline an toàn, loại bỏ hoàn toàn hiện tượng deadlock (khoá chết).",
        tip: "Nhấn mạnh: Với ứng dụng học tập, 90% tác vụ là Đọc (xem bài, xem bảng điểm, xem tin nhắn) nên mô hình D1 tối ưu hiệu năng vượt trội."
      }
    ]
  },
  {
    chapterId: 3,
    title: "Chương 3: Quy trình phát triển phần mềm Agile/Scrum (Agile/Scrum Methodology)",
    desc: "Bao gồm 16 câu hỏi về mô hình Agile Scrum qua 6 Sprints, User Stories, Acceptance Criteria, Definition of Done, các nghi thức họp và đo lường tiến độ dự án.",
    questions: [
      {
        q: "Dự án áp dụng mô hình quy trình phát triển phần mềm nào và tại sao?",
        keywords: "Agile Scrum, Lặp và tăng trưởng (Iterative & Incremental), 6 Sprints, Thích ứng nhanh",
        a: "Dự án áp dụng mô hình **Agile Scrum**:\n- **Lý do lựa chọn:** Dự án có phạm vi tính năng đa dạng (học tập, mạng xã hội, bot media, kiosk guard native, tích hợp AI). Mô hình truyền thống Waterfall (thác nước) quá cứng nhắc và không thể ứng phó kịp thời với các rủi ro kỹ thuật (như thay đổi cổng trường hay lỗi detached buffer của PDF).\n- **Đặc trưng:** Phát triển theo phương pháp **lặp và tăng trưởng (Iterative & Incremental)**, chia thành 6 Sprints rõ ràng. Mỗi Sprint đều tạo ra một phiên bản phần mềm có thể chạy được (Potentially Shippable Product Increment).",
        tip: "Trả lời nhấn mạnh vào tính 'thích ứng với sự thay đổi' (Embracing Change) của Tuyên ngôn Agile."
      },
      {
        q: "Tuyên ngôn Agile (Agile Manifesto) có 4 giá trị cốt lõi gì và nhóm đã áp dụng như thế nào?",
        keywords: "Cá nhân và sự tương tác, Phần mềm chạy tốt, Hợp tác với khách hàng, Phản hồi với thay đổi",
        a: "4 giá trị cốt lõi của Agile được hiện thực hóa trong đồ án:\n1. **Cá nhân và sự tương tác hơn là quy trình và công cụ:** Nhóm trao đổi trực tiếp hàng ngày, thống nhất nhanh các giải pháp kiến trúc.\n2. **Phần mềm chạy tốt hơn là tài liệu đầy đủ:** Ưu tiên bàn giao sản phẩm chạy thực tế sau mỗi Sprint (thể hiện qua URL live `workers.dev` và bộ test 38 PASS).\n3. **Hợp tác với khách hàng hơn là đàm phán hợp đồng:** Thường xuyên lấy ý kiến phản hồi từ chính các bạn sinh viên CMCU đang tự học để bổ sung tính năng phù hợp.\n4. **Phản hồi với thay đổi hơn là bám sát kế hoạch:** Linh hoạt bổ sung tính năng Bookmarklet 1-chạm khi phát hiện rào cản CORS trên Web.",
        tip: "Thuộc lòng 4 giá trị này, giảng viên môn CNPM rất thích sinh viên đối chiếu lý thuyết Agile vào thực tế dự án."
      },
      {
        q: "Các vai trò (Roles) trong mô hình Scrum của nhóm được phân công như thế nào?",
        keywords: "Product Owner (PO), Scrum Master (SM), Development Team (Dev)",
        a: "- **Product Owner (PO):** Đại diện cho tiếng nói người dùng (sinh viên), quản lý và sắp xếp độ ưu tiên của Product Backlog, quyết định tiêu chí chấp nhận cho các tính năng cốt lõi.\n- **Scrum Master (SM):** Đảm bảo quy trình Scrum được tuân thủ, điều phối các buổi họp Daily Standup, tháo gỡ các trở ngại kỹ thuật (Impediments) cho nhóm.\n- **Development Team:** Nhóm kỹ sư đa năng (Full-stack) chịu trách nhiệm thiết kế, lập trình Frontend, Backend, Native Guard Windows và xây dựng bộ kiểm thử tự động.",
        tip: "Nêu rõ vai trò của bản thân trong nhóm để chứng minh sự đóng góp thực tế."
      },
      {
        q: "Trình bày tổng quan mục tiêu và kết quả chính của Sprint 1?",
        keywords: "Khởi tạo nền tảng, CSDL D1, Xác thực PBKDF2, Khung giao diện Duolingo",
        a: "**Mục tiêu Sprint 1:** Thiết lập kiến trúc cốt lõi, cơ sở dữ liệu và hệ thống xác thực người dùng an toàn.\n**Kết quả đạt được:**\n- Thiết kế 33 bảng cơ sở dữ liệu trên Cloudflare D1.\n- Hiện thực hóa cơ chế băm mật khẩu chuẩn quân đội PBKDF2-HMAC-SHA256 kết hợp mã hóa Salt ngẫu nhiên.\n- Xây dựng khung giao diện Single Page Application phong cách Duolingo với thanh điều hướng Sidebar và hệ thống Theme Sáng/Tối Neo-brutalism.",
        tip: "Tham chiếu trực tiếp đến tài liệu `sprint/Sprint_1.md`."
      },
      {
        q: "Trình bày mục tiêu và kết quả chính của Sprint 2?",
        keywords: "Mascot Thỏ Bảy Màu FSM, Cây bài học Gamification, Hệ thống Tim/XP/Streak",
        a: "**Mục tiêu Sprint 2:** Xây dựng cơ chế tương tác học tập thông minh và hệ thống tạo động lực (Gamification).\n**Kết quả đạt được:**\n- Lập trình bộ máy hữu hạn trạng thái (FSM) cho Linh vật Thỏ Bảy Màu bằng SVG động, biểu cảm thay đổi theo ngữ cảnh.\n- Xây dựng lộ trình học tập dạng cây kỹ năng với các Cửa ải (Stages), Nút bài học (Lesson Nodes), rương kho báu và câu hỏi trắc nghiệm tương tác.\n- Hiện thực hóa cơ chế Streak bảo vệ chuỗi ngày học, thưởng Tim và Đá quý.",
        tip: "Tham chiếu trực tiếp đến tài liệu `sprint/Sprint_2.md`."
      },
      {
        q: "Trình bày mục tiêu và kết quả chính của Sprint 3?",
        keywords: "Pomodoro Kiosk, Windows Native Guard (`study_guard.exe`), Âm thanh Byte-Range 206",
        a: "**Mục tiêu Sprint 3:** Xây dựng phòng học tập trung Pomodoro chống gian lận đa màn hình trên Windows Desktop.\n**Kết quả đạt được:**\n- Tích hợp tệp nhị phân native `study_guard.exe` can thiệp Windows Hook, khóa phím và vô hiệu hóa các màn hình phụ khi học.\n- Xây dựng máy phát nhạc sóng não Lo-fi hỗ trợ chuẩn HTTP 206 Byte-Range streaming.\n- Sảnh chờ phòng học hiển thị danh sách người cùng học thời gian thực.",
        tip: "Tham chiếu trực tiếp đến tài liệu `sprint/Sprint_3.md`."
      },
      {
        q: "Trình bày mục tiêu và kết quả chính của Sprint 4?",
        keywords: "Mạng xã hội học tập, Chat nhóm/1-1, Bot 3TG Media Hub, Quản trị phòng chat",
        a: "**Mục tiêu Sprint 4:** Xây dựng phân hệ mạng xã hội sinh viên, kết bạn và nhóm học tập tích hợp Trợ lý Bot 3TG.\n**Kết quả đạt được:**\n- Hệ thống Messenger hỗ trợ nhắn tin trực tiếp 1-1 và tạo nhóm chat học tập.\n- Tích hợp Bot 3TG đa năng hỗ trợ các lệnh media giải trí (`!ff`, `!anime`, `!gai`, `!sad`, `!sing`, `!troll`) và tra cứu thông tin nhóm.\n- Phân quyền Trưởng nhóm (Key holder), Phó nhóm và thành viên.",
        tip: "Tham chiếu trực tiếp đến tài liệu `sprint/Sprint_4.md`."
      },
      {
        q: "Trình bày mục tiêu và kết quả chính của Sprint 5?",
        keywords: "Cổng trường IU CMCU, Cố vấn học tập 3TG AI, Giải mã XOR/Base64, Mô phỏng What-If GPA",
        a: "**Mục tiêu Sprint 5:** Tích hợp cổng thông tin sinh viên Đại học CMC (`iu.cmcu.edu.vn`) và Trợ giảng AI cố vấn học tập.\n**Kết quả đạt được:**\n- Thuật toán giải mã bảng điểm cổng trường với chuẩn mã hóa nội bộ XOR và Base64.\n- Tính toán chính xác GPA hệ 10, GPA hệ 4, phân loại học lực và phát hiện các môn điểm C/D/F cần cải thiện.\n- Trợ giảng 3TG AI phân tích lộ trình gỡ điểm 4 tuần theo phương pháp Active Recall.\n- Công cụ mô phỏng What-If dự đoán điểm GPA tương lai.",
        tip: "Tham chiếu trực tiếp đến tài liệu `sprint/Sprint_5.md`."
      },
      {
        q: "Trình bày mục tiêu và kết quả chính của Sprint 6?",
        keywords: "Kiểm thử toàn diện 38 PASS, Tối ưu Mobile 375px, Cloudflare Workers Deploy, Master Release",
        a: "**Mục tiêu Sprint 6:** Kiểm thử toàn diện toàn hệ thống, tối ưu hóa giao diện di động và phát hành bản Release chính thức.\n**Kết quả đạt được:**\n- Xây dựng Test Suite tự động đạt **38 PASS, 0 FAIL** bao quát cả 6 phân hệ cốt lõi.\n- Tối ưu hóa 100% giao diện di động chuẩn màn hình nhỏ 375px (iPhone SE):\n  - Menu sidebar đóng mở mượt mà kèm nút ✕ đóng nhanh.\n  - Bố cục 2 cột dạng thẻ Facebook cho Khóa học, Cửa hàng và Nhóm bạn.\n  - Sửa lỗi tràn màn hình, avatar nhóm méo và thứ tự tin nhắn.\n- Triển khai thành công lên Cloudflare Workers tại tên miền `https://lumi-study.3tgstudy.workers.dev`.",
        tip: "Tham chiếu trực tiếp đến tài liệu `sprint/Sprint_6.md`."
      },
      {
        q: "User Story là gì? Cho ví dụ một User Story hoàn chỉnh trong dự án?",
        keywords: "As a [role], I want [feature], So that [benefit]",
        a: "**Định nghĩa:** User Story là bản mô tả ngắn gọn, phi kỹ thuật về một tính năng phần mềm dưới góc nhìn của người dùng cuối.\n**Cấu trúc chuẩn:** `Là một [Vai trò], tôi muốn [Hành động/Tính năng], để [Lợi ích/Giá trị]`.\n**Ví dụ trong dự án 3TG Study:**\n*\"Là một sinh viên Đại học CMC chuẩn bị thi hết môn, tôi muốn kết nối tài khoản trường để xem phân tích các môn điểm thấp C/D/F và mô phỏng GPA What-If, để tôi có thể lên kế hoạch ôn thi cải thiện điểm hiệu quả nhất và nâng học lực lên Giỏi.\"*",
        tip: "Giảng viên đánh giá rất cao khi bạn nêu rõ cả 3 vế: Ai? Muốn gì? Để làm gì?"
      },
      {
        q: "Tiêu chí chấp nhận (Acceptance Criteria - AC) có vai trò gì và viết như thế nào?",
        keywords: "Acceptance Criteria, Given - When - Then, Ranh giới kiểm thử",
        a: "- **Vai trò:** AC xác định ranh giới rõ ràng khi nào một User Story được coi là hoàn thành, là căn cứ để nhóm lập trình và viết Test Cases kiểm thử.\n- **Định dạng chuẩn Given - When - Then:**\n  - *Given (Ngữ cảnh):* Học viên đang ở sảnh chờ Pomodoro với 0 tim còn lại.\n  - *When (Hành động):* Học viên hoàn thành đủ một chu kỳ học tập 25 phút không vi phạm Kiosk Guard.\n  - *Then (Kết quả mong đợi):* Hệ thống phải cộng 1 Tim thưởng, cộng 50 điểm XP và cập nhật số liệu hiển thị trên topbar mà không cần tải lại trang.",
        tip: "Nêu rõ AC chính là bản hợp đồng giữa Product Owner và Development Team."
      },
      {
        q: "Định nghĩa hoàn thành (Definition of Done - DoD) của nhóm gồm những tiêu chí nào?",
        keywords: "Definition of Done (DoD), Code Review, Unit Tests Pass, Responsive, No Critical Bugs",
        a: "Một tính năng chỉ được đánh dấu 'Done' khi thỏa mãn toàn bộ checklist DoD của nhóm:\n1. Mã nguồn được viết theo chuẩn Clean Code, không có biến thừa hoặc hàm trùng lặp.\n2. Vượt qua 100% các ca kiểm thử trong bộ Test Suite tự động (38/38 PASS).\n3. Đã kiểm tra tương thích giao diện trên cả Desktop và Mobile màn hình nhỏ 375px.\n4. Được đồng thuận duyệt qua quy trình Code Review của nhóm.\n5. Đã đóng gói và triển khai thành công lên môi trường Cloudflare Workers Production không có lỗi runtime console.",
        tip: "Khẳng định: 'Viết code xong chưa gọi là Done, phải thỏa mãn toàn bộ DoD mới được nghiệm thu Sprint'."
      },
      {
        q: "Product Backlog và Sprint Backlog khác nhau như thế nào?",
        keywords: "Product Backlog (Tổng thể, Ưu tiên), Sprint Backlog (Cam kết, Chi tiết trong Sprint)",
        a: "- **Product Backlog:** Là danh sách tổng hợp toàn bộ các yêu cầu, tính năng, cải tiến và bản sửa lỗi mong muốn cho toàn bộ vòng đời sản phẩm. Được quản lý bởi Product Owner và liên tục được cập nhật, sắp xếp theo độ ưu tiên nghiệp vụ.\n- **Sprint Backlog:** Là tập con các hạng mục được đội ngũ phát triển chọn lọc từ Product Backlog trong buổi họp Sprint Planning để cam kết hoàn thành trong một Sprint cụ thể (kèm kế hoạch công việc chi tiết để hiện thực hóa chúng).",
        tip: "Dùng hình ảnh: Product Backlog là kho nguyên liệu tổng, Sprint Backlog là thực đơn nấu ăn trong tuần."
      },
      {
        q: "Các buổi họp trong Scrum (Ceremonies) được nhóm tổ chức như thế nào?",
        keywords: "Sprint Planning, Daily Scrum (15 phút), Sprint Review (Demo), Sprint Retrospective",
        a: "Nhóm duy trì nghiêm túc 4 nghi thức Scrum:\n1. **Sprint Planning:** Đầu mỗi Sprint, nhóm họp chọn các User Story và phân rã thành các Task kỹ thuật.\n2. **Daily Standup:** Họp nhanh 15 phút đầu ngày trả lời 3 câu hỏi: *Hôm qua đã làm gì? Hôm nay sẽ làm gì? Có gặp trở ngại gì không?*\n3. **Sprint Review:** Cuối Sprint, nhóm demo phần mềm chạy thực tế cho các thành viên và lấy ý kiến đánh giá.\n4. **Sprint Retrospective (Cải tiến):** Rút kinh nghiệm: *Cái gì làm tốt? Cái gì chưa tốt? Cần cải tiến điều gì ở Sprint tiếp theo?*",
        tip: "Kể một ví dụ thực tế ở Sprint Retrospective 5: Nhóm nhận thấy giao diện mobile bị tràn chữ nên đã thống nhất đặt trọng tâm Sprint 6 vào Mobile Responsive."
      },
      {
        q: "Cách nhóm đo lường tiến độ và năng suất phát triển (Velocity & Burndown Chart)?",
        keywords: "Story Points, Team Velocity, Burndown Chart, Ước lượng độ phức tạp",
        a: "- **Story Points:** Nhóm sử dụng dãy số Fibonacci (1, 2, 3, 5, 8, 13) để ước lượng độ phức tạp tương đối của mỗi User Story thay vì dùng giờ làm việc thuần túy.\n- **Velocity (Vận tốc nhóm):** Tính bằng tổng số Story Points nhóm hoàn thành thực tế trong mỗi Sprint (trung bình nhóm đạt 25 - 30 Story Points / Sprint).\n- **Burndown Chart (Biểu đồ cháy):** Đồ thị thể hiện khối lượng công việc còn lại theo từng ngày của Sprint, giúp nhóm nhận diện sớm nguy cơ trễ hạn để kịp thời điều chỉnh phạm vi.",
        tip: "Nhắc rằng việc ước lượng bằng Story Points giúp tránh sai số do kinh nghiệm lập trình của từng cá nhân."
      }
    ]
  },
  {
    chapterId: 4,
    title: "Chương 4: Kỹ nghệ yêu cầu phần mềm (Requirements Engineering)",
    desc: "Bao gồm 12 câu hỏi phân biệt Yêu cầu chức năng (FR) và phi chức năng (NFR), ma trận truy vết RTM, kỹ thuật thu thập và kiểm soát thay đổi yêu cầu.",
    questions: [
      {
        q: "Phân biệt Yêu cầu chức năng (FR) và Yêu cầu phi chức năng (NFR) trong dự án?",
        keywords: "Functional Requirements (Hệ thống làm gì?), Non-Functional Requirements (Hệ thống chạy thế nào?)",
        a: "- **Yêu cầu chức năng (Functional Requirements - FR):** Mô tả các hành vi, dịch vụ hoặc chức năng cụ thể mà hệ thống phần mềm bắt buộc phải cung cấp cho người dùng.\n  - *Ví dụ:* Học viên có thể trả lời câu hỏi trắc nghiệm, tạo nhóm học tập, tra cứu điểm thi cổng trường, nói chuyện với AI Tutor.\n- **Yêu cầu phi chức năng (Non-Functional Requirements - NFR):** Mô tả các tiêu chuẩn chất lượng, ràng buộc kỹ thuật và đặc tính vận hành của hệ thống.\n  - *Ví dụ:* Thời gian tải trang dưới 100ms, bảo mật mật khẩu bằng thuật toán PBKDF2, giao diện co giãn tốt trên màn hình nhỏ 375px, độ sẵn sàng đạt 99.9%.",
        tip: "Nhớ câu châm ngôn: 'FR là phần mềm làm ĐÚNG VIỆC (Do the right things), NFR là phần mềm làm VIỆC ĐÚNG CÁCH (Do things right)'."
      },
      {
        q: "Kể tên 6 phân hệ Yêu cầu chức năng cốt lõi (FR) của hệ thống 3TG Study AI?",
        keywords: "Học tập Duolingo, Mascot FSM, Pomodoro Focus, Mạng xã hội & Chat, Cổng trường CMCU, 3TG AI Tutor",
        a: "6 phân hệ chức năng chính bao gồm:\n1. **Phân hệ Học tập & Cây bài học Gamification (FR-01):** Học theo lộ trình cửa ải, làm bài trắc nghiệm tương tác, quản lý tiến độ, thưởng Tim, XP và Chuỗi ngày học Streak.\n2. **Phân hệ Linh vật Thỏ Bảy Màu FSM (FR-02):** Đổi biểu cảm và lời thoại động theo hành vi học bài của sinh viên.\n3. **Phân hệ Sảnh học Pomodoro Focus Kiosk (FR-03):** Đếm giờ 25/5, khóa môi trường gian lận đa màn hình, phát nhạc tập trung, hiển thị danh sách người cùng học.\n4. **Phân hệ Mạng xã hội & Chat nhóm (FR-04):** Nhắn tin 1-1, lập nhóm học tập, đổi avatar nhóm lên Cloudflare R2, tích hợp Bot 3TG giải trí media.\n5. **Phân hệ Quản trị Học thuật Cổng trường CMCU (FR-05):** Cào bảng điểm, phân loại môn điểm C/D/F, mô phỏng điểm GPA What-If.\n6. **Phân hệ Trợ lý Trí tuệ Nhân tạo 3TG AI (FR-06):** Giải thích bài tập từng bước, tư vấn chiến lược cải thiện điểm học kỳ theo phương pháp Active Recall.",
        tip: "Trình bày mạch lạc theo đúng 6 phân hệ lớn tương ứng với mục tiêu 6 Sprints."
      },
      {
        q: "Nêu các Yêu cầu phi chức năng (NFR) về Hiệu năng (Performance) mà hệ thống đạt được?",
        keywords: "Độ trễ API <100ms, Bundle size <350KB, Google Lighthouse >95, CPU Usage <5%",
        a: "Hệ thống đáp ứng các chỉ số NFR định lượng khắt khe:\n- **Thời gian phản hồi API:** Dưới 100ms cho 95% các request thông thường tại Data Center biên Việt Nam.\n- **Dung lượng trang web:** Toàn bộ mã nguồn tệp tĩnh sau nén gzip chỉ vỏn vẹn 76.4 KiB, tổng dung lượng bộ nhớ tải trang <350KB.\n- **Thời gian khởi động Kiosk:** Dưới 1.5 giây trên hệ điều hành Windows 10/11.\n- **Tải tài nguyên máy tính:** Tiến trình chạy ngầm của Electron Kiosk chiếm dưới 5% CPU và dưới 85MB RAM, đảm bảo mượt mà ngay cả trên các laptop cấu hình thấp của sinh viên.",
        tip: "Luôn đưa ra các con số định lượng cụ thể (Metrics), không trả lời chung chung 'nhanh' hay 'mượt'."
      },
      {
        q: "Nêu các NFR về Bảo mật (Security) trong quản lý mật khẩu và phiên làm việc?",
        keywords: "PBKDF2-HMAC-SHA256, Salt ngẫu nhiên 16 bytes, HttpOnly Cookie, Rate Limiting",
        a: "Hệ thống bảo vệ người dùng theo tiêu chuẩn an ninh quốc tế:\n1. **Bảo mật lưu trữ mật khẩu:** Sử dụng thuật toán PBKDF2 (Password-Based Key Derivation Function 2) với 100,000 vòng lặp HMAC-SHA256 và chuỗi muối ngẫu nhiên (Cryptographic Salt) 16 bytes, vô hiệu hóa hoàn toàn các cuộc tấn công tra từ điển (Rainbow Table Attack).\n2. **Bảo mật phiên làm việc (Session Security):** Định danh phiên qua chuỗi token ngẫu nhiên mã hóa trong Cookie với các cờ bảo vệ `HttpOnly` (chống đánh cắp cookie qua XSS) và `SameSite=Lax` (chống tấn công CSRF).\n3. **Chống Brute-force:** Bộ lọc Rate Limiter chặn tự động khi phát hiện đăng nhập sai quá 5 lần trong 15 phút từ cùng một địa chỉ IP.",
        tip: "Nêu rõ: Dự án có cơ chế tự động nâng cấp mã băm (Auto-upgrade hash) từ chuẩn SHA-256 cũ lên PBKDF2 khi sinh viên đăng nhập."
      },
      {
        q: "Nêu các NFR về Khả năng tương thích thiết bị (Responsive Design) của đồ án?",
        keywords: "Mobile First, Viewport 375px (iPhone SE), CSS Grid / Flexbox, Touch Target 44px",
        a: "- **Khả năng tương thích:** Hệ thống hiển thị tối ưu trên dải màn hình từ 375px (điện thoại cỡ nhỏ như iPhone SE) đến 2560px (màn hình máy tính 2K/4K).\n- **Chuẩn công thái học di động (Mobile Usability):**\n  - Mọi nút bấm (Touch Targets) có kích thước tối thiểu $44 \\times 44\\text{px}$ theo khuyến nghị của Apple Human Interface Guidelines.\n  - Bố cục lưới tự động chuyển đổi từ 3-4 cột trên máy tính thành 2 cột đều trên di động.\n  - Không bao giờ xuất hiện thanh cuộn ngang ngoài ý muốn (Zero horizontal scrollbar).",
        tip: "Dẫn chứng ngay việc ở Sprint 6 nhóm đã test trực tiếp trên DevTools mobile 375px và điện thoại thật."
      },
      {
        q: "NFR về Tính dễ sử dụng (Usability) và Tâm lý học người dùng (Gamification) được thiết kế thế nào?",
        keywords: "Dopamine Loop, Duolingo Neo-brutalism, Micro-interactions, Sound FX",
        a: "- **Vòng lặp tạo động lực (Dopamine Loop):** Mỗi hành động tích cực của sinh viên (trả lời đúng, hoàn thành bài, duy trì chuỗi Streak) đều được khen thưởng tức thì bằng âm thanh leng keng vui nhộn, hiệu ứng pháo hoa Confetti và lời khen từ Thỏ Bảy Màu.\n- **Phong cách Neo-brutalism:** Sử dụng viền đen đậm, đổ bóng khối 3D cứng cáp và bảng màu tươi sáng, tạo cảm giác thân thiện, xua tan sự căng thẳng và nhàm chán khi ôn thi đại học.",
        tip: "Nêu rõ: 'Phần mềm giáo dục thành công không chỉ cần đúng chức năng mà phải khiến người dùng muốn quay lại học mỗi ngày'."
      },
      {
        q: "Các kỹ thuật thu thập yêu cầu (Requirements Elicitation Techniques) nào đã được nhóm áp dụng?",
        keywords: "Phỏng vấn sâu (Interviews), Quan sát thực tế (Observation), Khảo sát bảng hỏi (Surveys)",
        a: "Nhóm đã kết hợp 3 kỹ thuật thu thập yêu cầu trong môn CNPM:\n1. **Phỏng vấn sâu (Interviews):** Phỏng vấn trực tiếp 15 sinh viên Đại học CMC về những khó khăn lớn nhất khi tự học ở nhà (phân tâm lướt mạng, chán nản, không biết mình yếu môn nào).\n2. **Quan sát hành vi (Observation):** Quan sát thói quen học tập của sinh viên trong phòng tự học để phát hiện nhu cầu phòng Kiosk chặn sao nhãng và nhu cầu học nhóm.\n3. **Nghiên cứu sản phẩm tương tự (Benchmarking):** Phân tích điểm mạnh của Duolingo (giữ chuỗi Streak, gamification) và Forest (tập trung Pomodoro) để chắt lọc những tinh hoa vào 3TG Study.",
        tip: "Chứng minh yêu cầu phần mềm xuất phát từ nỗi đau có thật (Real Pain-points) của sinh viên."
      },
      {
        q: "Ma trận truy vết yêu cầu (Requirements Traceability Matrix - RTM) có tác dụng gì trong đồ án?",
        keywords: "Traceability Matrix, Liên kết Yêu cầu - Thiết kế - Code - Test Case, Chống sót tính năng",
        a: "- **Khái niệm:** RTM là bảng ma trận liên kết đa chiều giữa: Yêu cầu của người dùng $\\to$ Yêu cầu phần mềm (FR) $\\to$ Module thiết kế $\\to$ File mã nguồn $\\to$ Test Cases kiểm thử.\n- **Tác dụng trong dự án:**\n  - Đảm bảo 100% các yêu cầu đặt ra đều được lập trình đầy đủ (không bị bỏ sót).\n  - Giúp đánh giá tác động (Impact Analysis) khi có thay đổi: Nếu sửa một yêu cầu, nhóm biết chính xác những file code và test case nào cần được cập nhật theo.",
        tip: "Khẳng định toàn bộ 38 test cases trong bộ kiểm thử Sprint 6 đều được truy vết ngược về các FR ban đầu."
      },
      {
        q: "Nhóm xử lý bài toán xung đột yêu cầu (Conflict Resolution) như thế nào? (Ví dụ: Chống gian lận vs Quyền riêng tư)?",
        keywords: "Trade-off, Privacy-preserving Kiosk, Không quay màn hình, Không đọc dữ liệu cá nhân",
        a: "- **Xung đột phát sinh:** Yêu cầu Chống gian lận đòi hỏi giám sát học viên, nhưng yêu cầu Phi chức năng về Quyền riêng tư (Privacy) đòi hỏi không được xâm phạm máy tính cá nhân của sinh viên.\n- **Giải pháp dung hòa của nhóm:**\n  - Thay vì cài phần mềm gián điệp theo dõi webcam hay quét tệp tin máy tính (như một số phần mềm thi cử cực đoan gây phản cảm),\n  - 3TG Study chỉ sử dụng kỹ thuật **Hộp cát tự nguyện (Voluntary Kiosk Guard)**: Tự động che các màn hình phụ và phát âm thanh cảnh báo khi chuột rời khỏi vùng học bài.\n  - Tuyệt đối không thu thập hình ảnh, không đọc lịch sử duyệt web của sinh viên, bảo vệ quyền riêng tư 100%.",
        tip: "Đây là câu trả lời thể hiện tư duy đạo đức nghề nghiệp và giải quyết xung đột yêu cầu xuất sắc."
      },
      {
        q: "Làm thế nào để kiểm định và xác nhận yêu cầu (Requirements Validation) với người dùng?",
        keywords: "Sprint Review Demo, UAT Testing, Người dùng trải nghiệm thực tế",
        a: "Sau mỗi Sprint, nhóm tiến hành xác nhận yêu cầu qua 2 bước:\n1. **Nghiệm thu tiêu chí chấp nhận (AC Verification):** Kiểm tra xem tính năng có vượt qua toàn bộ các kịch bản Given-When-Then đã cam kết hay không.\n2. **Thử nghiệm chấp nhận người dùng (User Acceptance Testing - UAT):** Đưa link web `lumi-study.3tgstudy.workers.dev` cho nhóm sinh viên trải nghiệm thực tế trên điện thoại và laptop, thu nhận phản hồi để điều chỉnh ngay trong Sprint tiếp theo.",
        tip: "Nhấn mạnh chu kỳ phản hồi ngắn (Short Feedback Loop) giúp sản phẩm luôn bám sát kỳ vọng của sinh viên."
      },
      {
        q: "Hiện tượng thay đổi phạm vi yêu cầu (Scope Creep) là gì và nhóm đã kiểm soát nó như thế nào?",
        keywords: "Scope Creep, Đóng băng phạm vi (Scope Freeze), Đưa vào Product Backlog tương lai",
        a: "- **Scope Creep:** Là hiện tượng phạm vi dự án liên tục bị phình to do các yêu cầu mới phát sinh ngoài kế hoạch ban đầu, dẫn đến nguy cơ vỡ tiến độ (trễ deadline).\n- **Cách nhóm kiểm soát:**\n  - Áp dụng nguyên tắc **Đóng băng phạm vi Sprint (Sprint Scope Freeze)**: Khi Sprint đã bắt đầu, tuyệt đối không chèn thêm tính năng mới vào Sprint đó.\n  - Mọi ý tưởng mới (ví dụ: làm thêm tính năng diễn đàn thảo luận hay gọi video nhóm) đều được ghi nhận vào Product Backlog để đánh giá và ưu tiên cho các phiên bản tương lai.",
        tip: "Khẳng định: 'Biết từ chối đúng lúc là phẩm chất quan trọng của người quản trị dự án phần mềm'."
      },
      {
        q: "Tài liệu hóa yêu cầu phần mềm (Software Requirements Specification - SRS) trong dự án gồm những mục gì?",
        keywords: "Mục đích, Phạm vi, Mô tả tổng quan, Yêu cầu giao diện, FR & NFR, Phụ lục",
        a: "Tài liệu SRS của đồ án được cấu trúc theo chuẩn quốc tế IEEE 830, gồm:\n1. **Giới thiệu:** Mục đích tài liệu, phạm vi đề tài 3TG Study AI, đối tượng độc giả.\n2. **Mô tả tổng quan:** Phác thảo sản phẩm, các lớp người dùng, môi trường vận hành (Web & Windows).\n3. **Yêu cầu giao diện bên ngoài:** Giao diện người dùng, giao diện phần cứng, giao diện truyền thông API.\n4. **Yêu cầu chức năng chi tiết (System Features):** 6 phân hệ cốt lõi với use case cụ thể.\n5. **Yêu cầu phi chức năng:** Hiệu năng, bảo mật, độ tin cậy, tính bảo trì.",
        tip: "Nhắc lại các mục chính chuẩn IEEE 830 để chứng minh kiến thức học thuật vững chắc."
      }
    ]
  },
  {
    chapterId: 5,
    title: "Chương 5: Thiết kế hệ thống & Mô hình hóa UML (System Design & UML)",
    desc: "Bao gồm 12 câu hỏi giải thích các loại sơ đồ UML (Use Case, Sequence, State Machine, Activity, Class, Deployment) và Design Patterns trong mã nguồn.",
    keywords: "UML, Use Case, Sequence Diagram, State Machine, Design Patterns, Class Diagram",
    questions: [
      {
        q: "Sơ đồ Use Case tổng quát của hệ thống gồm những Actor nào và mối quan hệ giữa chúng?",
        keywords: "Actor: Sinh viên (Student), Trưởng nhóm (Admin), Hệ thống AI / Cổng trường (External System)",
        a: "Sơ đồ Use Case của 3TG Study xác định 3 Actor chính:\n1. **Sinh viên (Học viên - Primary Actor):** Thực hiện học bài trắc nghiệm, tham gia phòng Pomodoro, nhắn tin, xem điểm và trò chuyện với AI.\n2. **Trưởng nhóm học tập (Admin - Specialized Actor):** Kế thừa toàn bộ quyền của Sinh viên, có thêm các Use Case đặc quyền: Đổi tên/avatar nhóm, mời/kick thành viên, thêm/bớt Bot 3TG, chuyển giao quyền quản trị.\n3. **Hệ thống ngoài (Secondary / External Actors):**\n   - *Cổng thông tin IU CMCU:* Cung cấp nguồn dữ liệu bảng điểm.\n   - *Groq AI Cloud Engine:* Đóng vai trò máy chủ suy luận trí tuệ nhân tạo.",
        tip: "Nhớ giải thích quan hệ kế thừa giữa Actor Trưởng nhóm và Học viên."
      },
      {
        q: "Phân biệt quan hệ <<include>> và <<extend>> trong sơ đồ Use Case của dự án?",
        keywords: "Include (Bắt buộc phải có), Extend (Mở rộng có điều kiện), Điểm mở rộng (Extension Point)",
        a: "- **Quan hệ `<<include>>` (Bao hàm - Bắt buộc):**\n  - *Ví dụ:* Use Case *'Làm bài học'* `<<include>>` Use Case *'Xác thực đăng nhập'*. Bạn bắt buộc phải đăng nhập thì mới lưu được điểm và tiến độ học tập vào hệ thống.\n- **Quan hệ `<<extend>>` (Mở rộng - Tùy chọn có điều kiện):**\n  - *Ví dụ:* Use Case *'Phân tích lộ trình điểm bằng 3TG AI'* `<<extend>>` Use Case *'Xem bảng điểm môn học'*. Chỉ khi học viên có nhu cầu cải thiện điểm hoặc bấm nút nhờ AI trợ giúp thì hành vi mở rộng này mới được kích hoạt tại điểm mở rộng (Extension Point).",
        tip: "Include là mũi tên nét đứt hướng từ Base Use Case đến Included Use Case, Extend hướng từ Extension Use Case về Base Use Case."
      },
      {
        q: "Phân tích Sơ đồ tuần tự (Sequence Diagram) luồng xử lý Nộp bài học và Chấm điểm?",
        keywords: "Lifeline: Client UI -> App Controller -> API Gateway -> Database D1 -> UI Feedback",
        a: "Luồng tuần tự gồm 5 bước thông điệp:\n1. **User $\\to$ Client UI:** Chọn đáp án và bấm nút 'Kiểm tra' (`submitAnswer`).\n2. **Client UI $\\to$ API Gateway (`/api/lessons/:id/check`):** Gửi mã câu hỏi và đáp án lựa chọn.\n3. **API Gateway $\\to$ Database D1:** Truy vấn đáp án đúng trong bảng `questions`, so sánh kết quả:\n   - Nếu đúng: Chuẩn bị thông điệp cộng XP, tính toán Streak trong `user_stats`.\n   - Nếu sai: Trừ 1 Tim, ghi bản ghi vào bảng `user_mistakes` để phục vụ ôn tập câu sai.\n4. **Database D1 $\\to$ API Gateway:** Xác nhận hoàn thành transaction.\n5. **API Gateway $\\to$ Client UI:** Trả về kết quả JSON. Giao diện Client kích hoạt âm thanh, cập nhật thanh tiến độ và chuyển trạng thái Thỏ Bảy Màu sang `CHEERING` hoặc `PANIC`.",
        tip: "Nhấn mạnh thứ tự thời gian từ trên xuống dưới theo đúng bản chất của Sequence Diagram."
      },
      {
        q: "Sơ đồ máy trạng thái hữu hạn (FSM) của Linh vật Thỏ Bảy Màu được thiết kế như thế nào?",
        keywords: "Finite State Machine (FSM), Trạng thái: IDLE, STUDYING, GENIUS, PANIC, CHEERING, SULKING",
        a: "Linh vật Thỏ Bảy Màu được mô hình hóa bằng **Finite State Machine (FSM)** với các trạng thái rõ rệt:\n- **`IDLE` (Nghỉ ngơi):** Trạng thái mặc định khi sinh viên vừa mở app.\n- **`STUDYING` (Chăm chỉ):** Kích hoạt khi sinh viên bắt đầu đọc đề hoặc gõ bàn phím.\n- **`CHEERING` (Cổ vũ/Vui sướng):** Kích hoạt khi sinh viên trả lời đúng câu hỏi hoặc duy trì chuỗi Streak.\n- **`PANIC` (Hoảng sợ/Thất thần):** Kích hoạt khi sinh viên trả lời sai hoặc bị trừ Tim.\n- **`GENIUS` (Bác học/Đắc thắng):** Kích hoạt khi sinh viên vượt qua toàn bộ Cửa ải bài học với điểm tuyệt đối 3 sao.\n- **`SULKING` (Hờn dỗi):** Kích hoạt khi sinh viên lâu ngày không vào học bài.\nMỗi chuyển trạng thái đều đi kèm hình vẽ SVG hoạt hình và câu thoại độc quyền tương ứng.",
        tip: "Mascot FSM là một điểm sáng thiết kế độc đáo của đồ án, hãy tự tin trình bày tính sáng tạo này."
      },
      {
        q: "Sơ đồ hoạt động (Activity Diagram) của phiên học Pomodoro Kiosk diễn ra như thế nào?",
        keywords: "Fork/Join, Decision Node, Timer Loop, Native Hook Guard, Break Phase",
        a: "Quy trình Activity Diagram:\n1. **Bắt đầu (Initial Node):** Sinh viên bấm nút 'Bắt đầu học 25 phút'.\n2. **Phân nhánh song song (Fork Node):**\n   - Nhánh 1: Khởi động bộ đếm giờ lùi 25 phút trên giao diện.\n   - Nhánh 2: Gửi lệnh IPC tới Main Process kích hoạt `study_guard.exe` để che màn hình phụ và bắt sự kiện bàn phím.\n3. **Điểm kiểm tra (Decision Node):**\n   - Nếu người dùng di chuột ra khỏi màn hình hoặc mở ứng dụng cấm $\\to$ Kích hoạt chuông báo động, hiển thị cảnh báo phạt.\n   - Nếu hoàn thành đủ 25 phút $\\to$ Hợp nhất tiến trình (Join Node).\n4. **Chuyển pha:** Tự động giải phóng màn hình phụ, chuyển sang pha 'Nghỉ giải lao 5 phút', phát âm thanh chúc mừng và cộng đá quý thưởng.",
        tip: "Chỉ ra cách dùng Fork/Join để mô tả 2 tiến trình chạy song song (Timer giao diện và Native Guard hệ điều hành)."
      },
      {
        q: "Sơ đồ lớp (Class Diagram) cho phân hệ Quản lý Điểm & Cố vấn học tập được cấu trúc ra sao?",
        keywords: "Lớp `Transcript`, `Semester`, `Subject`, `GradeCalculator`, `AcademicAdvisor`",
        a: "- **Lớp `AcademicTranscript`:** Chứa thuộc tính `studentInfo`, `totalCredits`, danh sách các `Semester` và các phương thức `calculateGPA()`, `findWeakSubjects()`.\n- **Lớp `Semester`:** Chứa thuộc tính `semesterName`, `semesterYear` và danh sách các đối tượng `Subject` (Quan hệ Composition 1 - N).\n- **Lớp `Subject`:** Chứa `subjectCode`, `subjectName`, `credits`, `componentScores` (chuyên cần, bài tập, giữa kỳ, cuối kỳ) và điểm chữ (`diemChu`), điểm hệ 4 (`diemHe4`).\n- **Lớp `AcademicAdvisor`:** Nhận dữ liệu từ `AcademicTranscript` để thực hiện phương thức `generateStudyPlan()` và `simulateWhatIfGPA(targetScore)`.",
        tip: "Nhắc lại quan hệ Composition: Nếu bảng điểm bị xóa thì các học kỳ và môn học trong bảng điểm đó cũng biến mất."
      },
      {
        q: "Sơ đồ triển khai (Deployment Diagram) của hệ thống gồm những Node phần cứng nào?",
        keywords: "Client PC/Mobile, Cloudflare Global Edge Network, D1 Distributed Node, R2 Bucket, Groq API",
        a: "Hệ thống phân tán trên 4 nút mạng (Nodes):\n1. **User Device Node (PC/Laptop/Smartphone):** Chạy ứng dụng Electron hoặc Web Browser (HTML5/JS Engine).\n2. **Cloudflare Edge Worker Node:** Hơn 300 trạm trung chuyển biên toàn cầu, chạy V8 Isolates xử lý logic điều hướng và API.\n3. **Cloudflare Data Storage Node:**\n   - *D1 Storage Server:* Quản lý cơ sở dữ liệu quan hệ SQLite phân tán.\n   - *R2 Storage Server:* Lưu trữ tệp tin đa phương tiện tương thích Amazon S3.\n4. **AI Inference Cloud Node (Groq Cloud):** Cụm máy chủ tăng tốc phần cứng LPU (Language Processing Unit) chạy mô hình LLaMA 3.3.",
        tip: "Vẽ nhẩm các khối Node và đường truyền giao thức HTTPS/WSS kết nối giữa chúng."
      },
      {
        q: "Thiết kế giao diện UI/UX của đồ án tuân theo những nguyên lý thẩm mỹ nào?",
        keywords: "Neo-brutalism, Bảng màu Duolingo, Micro-interactions, Tương phản cao",
        a: "Giao diện được thiết kế theo xu hướng **Neo-brutalism hiện đại** kết hợp phong cách giáo dục của **Duolingo**:\n- **Đường viền đậm nét (Thick Borders):** Viền đen dứt khoát `2px - 3px solid var(--ink-900)`, tạo cảm giác xúc giác (tactile feeling) chân thật như những nút bấm vật lý.\n- **Đổ bóng cứng (Hard Drop Shadows):** Đổ bóng không làm mờ (`box-shadow: 0 4px 0 var(--ink-900)`), khi bấm nút thì phần tử dịch chuyển xuống 2px tạo phản hồi bấm cực kỳ đã tay.\n- **Bảng màu cảm xúc:** Màu hồng Lumi Pink (`#ff7597`) biểu trưng cho sự trẻ trung, màu vàng Gold (`#fbbf24`) cho thành tựu và màu xanh Emerald (`#10b981`) cho kết quả chính xác.",
        tip: "Nhấn mạnh: UI đẹp là một yếu tố phi chức năng quan trọng giúp giảm tỷ lệ bỏ học (Churn rate) của sinh viên."
      },
      {
        q: "Design Pattern: Mẫu thiết kế Singleton Pattern được áp dụng ở đâu trong mã nguồn?",
        keywords: "Singleton Pattern, Duy nhất một thể hiện, `window.pomodoroState`, `SessionManager`",
        a: "- **Định nghĩa Singleton:** Đảm bảo một lớp hoặc đối tượng chỉ có duy nhất một thực thể (Single Instance) trong suốt vòng đời ứng dụng và cung cấp điểm truy cập toàn cục.\n- **Áp dụng trong dự án:**\n  - Đối tượng trạng thái Pomodoro (`pomodoroState`) được quản lý theo mô hình Singleton. Trong toàn bộ ứng dụng, chỉ có duy nhất một bộ đếm giờ Pomodoro được phép chạy tại một thời điểm, tránh tình trạng mở 2 tab làm chạy song song 2 bộ đếm giờ gây sai lệch dữ liệu học tập.\n  - Bộ điều khiển âm thanh `AudioContext` cũng được khởi tạo dạng Singleton để tái sử dụng kênh âm thanh hệ thống.",
        tip: "Chỉ ra cơ chế kiểm tra `if (!instance) instance = new ...` chuẩn mực của Singleton."
      },
      {
        q: "Design Pattern: Mẫu thiết kế State Pattern được hiện thực hóa ở phân hệ nào?",
        keywords: "State Pattern, Trạng thái Mascot Thỏ Bảy Màu, Đóng gói hành vi theo trạng thái",
        a: "- **Định nghĩa State:** Cho phép một đối tượng thay đổi hành vi của nó khi trạng thái nội bộ thay đổi.\n- **Áp dụng:** Mascot Thỏ Bảy Màu áp dụng State Pattern triệt để. Thay vì viết hàng trăm câu lệnh `if-else` lồng nhau rối rắm trong code hiển thị, mỗi trạng thái (`THO_STATES.CHEERING`, `THO_STATES.PANIC`, `THO_STATES.GENIUS`...) được đóng gói thành một cấu trúc siêu dữ liệu độc lập (`THO_METADATA`), bao gồm hình vẽ SVG, màu sắc và danh sách các câu thoại ngẫu nhiên tương ứng.",
        tip: "Khẳng định: Nhờ State Pattern, khi muốn thêm một trạng thái mới cho Thỏ (ví dụ trạng thái Ngủ gật), ta chỉ cần khai báo thêm mà không phải sửa code lõi (Tuân thủ nguyên lý Open/Closed)."
      },
      {
        q: "Design Pattern: Mẫu thiết kế Strategy Pattern được áp dụng ở đâu?",
        keywords: "Strategy Pattern, Tính toán GPA theo quy chế đào tạo, Đa chiến lược",
        a: "- **Định nghĩa Strategy:** Định nghĩa một họ các thuật toán, đóng gói từng thuật toán lại và làm cho chúng có thể hoán đổi cho nhau linh hoạt.\n- **Áp dụng trong `academic_service.js`:**\n  - Thuật toán quy đổi điểm áp dụng Strategy Pattern để hỗ trợ chuyển đổi linh hoạt giữa các thang điểm đào tạo: Thang điểm 10 $\\to$ Thang điểm 4 $\\to$ Thang điểm chữ (A+, A, B+, B, C, D, F) theo Quy chế đào tạo tín chỉ của Bộ Giáo dục.\n  - Khi cần đổi cách tính GPA tích lũy (ví dụ cách tính điểm cải thiện lấy điểm cao nhất vs tính điểm trung bình), hệ thống chỉ cần hoán đổi chiến lược tính toán tương ứng.",
        tip: "Liên hệ trực tiếp với môn Công nghệ phần mềm: Strategy Pattern giúp mã nguồn không bị gán cứng (Hard-coded)."
      },
      {
        q: "Sơ đồ tuần tự cho tính năng Đăng nhập một chạm Cổng trường CMCU qua Bookmarklet diễn ra như thế nào?",
        keywords: "Cross-origin bridge, Token injection, Cookie passing, Scrape & Parse",
        a: "Luồng hoạt động tuần tự của giải pháp kỹ thuật Bookmarklet:\n1. Sinh viên đăng nhập tài khoản Microsoft trên tab cổng trường `iu.cmcu.edu.vn`.\n2. Sinh viên bấm mã 1-chạm Bookmarklet trên trình duyệt.\n3. Script Bookmarklet thực thi trong ngữ cảnh trang trường, đọc cookie phiên hợp lệ `document.cookie`.\n4. Script gửi lệnh `POST` kèm cookie về endpoint `/api/academic/import` của 3TG Study.\n5. Backend Cloudflare Workers nhận cookie, gọi ngược lại API cổng trường để cào dữ liệu bảng điểm, giải mã XOR/Base64, chuẩn hóa 3NF và lưu vào database D1.\n6. Thông báo thành công hiển thị cho sinh viên và bảng điểm được tải lên tức thì.",
        tip: "Đây là một giải pháp kiến trúc cực kỳ sáng tạo vượt qua rào cản CORS của trình duyệt web."
      }
    ]
  },
  {
    chapterId: 6,
    title: "Chương 6: Kiểm thử & Đảm bảo chất lượng phần mềm (Testing & Quality Assurance)",
    desc: "Bao gồm 13 câu hỏi về các cấp độ Unit/Integration/System Test, bộ test tự động 38/38 PASS, Black-box, White-box, kiểm thử bảo mật và hồi quy.",
    keywords: "Unit Test, Integration Test, Test Suite 38 PASS, Black-box, White-box, Security Test",
    questions: [
      {
        q: "Phân biệt Unit Testing, Integration Testing và System Testing trong đồ án?",
        keywords: "Unit Test (Đơn vị), Integration Test (Tích hợp), System Test (Hệ thống toàn diện)",
        a: "Hệ thống kiểm thử được xây dựng theo mô hình Kim tự tháp kiểm thử (Test Pyramid):\n1. **Unit Testing (Kiểm thử đơn vị):** Kiểm tra các hàm logic độc lập nhỏ nhất. *Ví dụ:* Hàm giải mã `giai_ma_iu()`, hàm tính điểm GPA `processAcademicTranscript()`, hàm tạo chuỗi mã hóa mật khẩu `hashPassword()`.\n2. **Integration Testing (Kiểm thử tích hợp):** Kiểm tra sự kết hợp ăn khớp giữa 2 hay nhiều module. *Ví dụ:* Kiểm tra luồng gửi tin nhắn gọi Bot 3TG và lưu đồng thời vào CSDL; kiểm tra luồng hoàn thành Pomodoro cập nhật số liệu `user_stats`.\n3. **System Testing (Kiểm thử hệ thống):** Kiểm thử toàn diện trên môi trường hoàn chỉnh từ giao diện người dùng, API, cơ sở dữ liệu đến các dịch vụ bên thứ ba (được tự động hóa qua bộ Test Suite 38 test cases).",
        tip: "Vẽ hình tam giác Kim tự tháp kiểm thử: Đáy là Unit Test (nhiều nhất), giữa là Integration Test, đỉnh là E2E/System Test."
      },
      {
        q: "Trình bày cấu trúc và kết quả của bộ Test Suite tự động 38 test case (`test_sprint6_full_suite.cjs`)?",
        keywords: "38 PASS 0 FAIL, 6 phân khu kiểm thử toàn diện",
        a: "Bộ Test Suite tự động kiểm tra nghiêm ngặt 6 phân khu chức năng và đạt kết quả tuyệt đối **38 PASS, 0 FAIL**:\n- **Phần 1: CSDL & Schema:** Kiểm tra sự tồn tại của 13 bảng trọng yếu và tính toàn vẹn khi ngắt kết nối cổng trường (13 tests).\n- **Phần 2: Trí tuệ nhân tạo Groq AI Pipeline:** Kiểm tra endpoint phản hồi HTTP 200 và sinh câu trả lời thông minh (2 tests).\n- **Phần 3: Bảo mật Kiosk & Native Guard:** Kiểm tra tệp nhị phân `study_guard.exe`, hàm khóa và giải phóng màn hình phụ (5 tests).\n- **Phần 4: Trình phát nhạc Local (HTTP 206):** Kiểm tra byte-range tua nhạc, lưu và xóa nhạc cá nhân (7 tests).\n- **Phần 5: Trình đọc tài liệu PDF:** Kiểm tra chống lỗi detached buffer bằng `buffer.slice(0)`, nhảy trang và thanh co giãn (5 tests).\n- **Phần 6: Quản lý phiên & Giao diện:** Kiểm tra khởi tạo phiên từ cookie, tự động tải dữ liệu và các nút bấm CSS (6 tests).",
        tip: "Mở terminal chạy lệnh `node scripts/test_sprint6_full_suite.cjs` trực tiếp trước mặt giảng viên để chứng minh 38 test xanh mướt 100%."
      },
      {
        q: "Kiểm thử hộp đen (Black-box Testing) được áp dụng như thế nào trong dự án?",
        keywords: "Kiểm thử chức năng, Phân vùng tương đương (Equivalence Partitioning), Phân tích giá trị biên (Boundary Value Analysis)",
        a: "Kiểm thử hộp đen kiểm tra phần mềm dựa trên đặc tả yêu cầu mà không cần quan tâm đến cấu trúc mã nguồn bên trong:\n1. **Phân vùng tương đương (Equivalence Partitioning):**\n   - Kiểm thử nhập điểm GPA mục tiêu (Thang điểm 0.0 đến 4.0):\n     - Phân vùng hợp lệ: `[0.0, 4.0]` (ví dụ nhập 3.2, 3.6).\n     - Phân vùng không hợp lệ: Số âm (`-1.0`) hoặc lớn hơn 4.0 (`4.5`, `10.0`).\n2. **Phân tích giá trị biên (Boundary Value Analysis):**\n   - Kiểm tra tại các giá trị biên: `0.0`, `0.1`, `3.9`, `4.0`.\n   - Kiểm tra giới hạn tải ảnh đại diện: Biên 4MB (3.9MB cho phép, 4.1MB báo lỗi 413 Payload Too Large ngay lập tức).",
        tip: "Nêu rõ 2 kỹ thuật cốt lõi của kiểm thử hộp đen: Phân vùng tương đương và Giá trị biên."
      },
      {
        q: "Kiểm thử hộp trắng (White-box Testing) và độ bao phủ mã nguồn (Code Coverage) được thực hiện ra sao?",
        keywords: "Kiểm thử cấu trúc, Statement Coverage, Branch Coverage, Path Testing",
        a: "- **Bản chất:** Kiểm thử viên nắm rõ cấu trúc mã nguồn, thiết kế test case đi qua các nhánh rẽ (`if-else`, `switch-case`, `try-catch`).\n- **Áp dụng trong dự án:**\n  - Kiểm tra hàm `evaluateUserStreak`:\n    - Nhánh 1: Chưa từng học (`last_active_date = null`) $\\to$ Gán streak = 0.\n    - Nhánh 2: Học hôm nay hoặc hôm qua $\\to$ Giữ nguyên chuỗi an toàn.\n    - Nhánh 3: Nghỉ hôm qua và có bùa đông băng $\\to$ Trừ 1 bùa, bảo lưu streak.\n    - Nhánh 4: Nghỉ hôm qua nhưng hết bùa $\\to$ Reset streak về 0.\n  - Đảm bảo độ bao phủ nhánh (**Branch Coverage**) đạt trên 90% cho các module nghiệp vụ quan trọng.",
        tip: "Vẽ sơ đồ luồng điều khiển (Control Flow Graph - CFG) của hàm đánh giá Streak để chứng minh mọi nhánh đều có test case chạy qua."
      },
      {
        q: "Kiểm thử hồi quy (Regression Testing) có vai trò gì khi sửa lỗi trong đồ án?",
        keywords: "Chống lỗi dây chuyền (Side-effects), Tự động hóa kiểm thử trước Deploy",
        a: "- **Khái niệm:** Khi sửa một lỗi hoặc thêm tính năng mới, kiểm thử hồi quy đảm bảo những tính năng cũ đang chạy tốt không bị hỏng ngoài ý muốn (Không gây ra lỗi dây chuyền - Side-effects).\n- **Áp dụng thực tế:**\n  - Ví dụ ở Sprint 6 khi sửa lỗi avatar nhóm bị méo trên mobile, nhóm lập tức chạy lại toàn bộ test suite `test_sprint6_full_suite.cjs` để đảm bảo logic đăng nhập, chấm điểm và kiosk guard vẫn hoạt động trơn tru 38/38 test.\n  - Mọi bản release trước khi chạy lệnh `wrangler deploy` đều phải vượt qua bài kiểm tra hồi quy tự động này.",
        tip: "Nêu quy tắc: 'Không bao giờ deploy lên Production nếu chưa chạy kiểm thử hồi quy'."
      },
      {
        q: "Kiểm thử bảo mật: Cơ chế chống Brute-force đăng nhập được kiểm thử như thế nào?",
        keywords: "Rate Limiting, Tấn công vét cạn, Giới hạn 5 lần/15 phút, HTTP 429",
        a: "- **Kịch bản kiểm thử bảo mật:**\n  - Viết script giả lập kẻ tấn công gửi liên tục 6 request đăng nhập sai mật khẩu từ cùng một địa chỉ IP.\n  - *Kết quả mong đợi:* 5 request đầu tiên server trả về mã `401 Unauthorized`. Từ request thứ 6 trở đi, server phải kích hoạt lá chắn Rate Limiting, từ chối xử lý và trả về mã `429 Too Many Requests` đi kèm thông báo thời gian chờ (`retryAfter`).\n  - Khi người dùng đăng nhập đúng: Bộ đếm thất bại được tự động xóa (`resetRateLimit`).",
        tip: "Chỉ ra đây là tiêu chuẩn bảo mật chống tấn công từ chối dịch vụ và dò mật khẩu theo chuẩn OWASP Top 10."
      },
      {
        q: "Kiểm thử bảo mật: Cơ chế ngăn chặn Cross-Site Scripting (XSS) được kiểm tra ra sao?",
        keywords: "XSS Stored, XSS Reflected, Hàm khử trùng `esc()`, HTML Encoding",
        a: "- **Lỗ hổng XSS:** Kẻ xấu cố tình nhập tên người dùng hoặc tin nhắn chứa mã độc JavaScript dạng `<script>alert('hack')</script>` hoặc `<img src=x onerror=stealCookie()>`.\n- **Giải pháp kiểm thử và xử lý:**\n  - Tất cả các trường hiển thị ra DOM đều đi qua hàm mã hóa thực thể HTML `esc()`:\n    - Ký tự `<` chuyển thành `&lt;`\n    - Ký tự `>` chuyển thành `&gt;`\n    - Ký tự `\"` chuyển thành `&quot;`\n    - Ký tự `'` chuyển thành `&#39;`\n  - Kiểm thử tiêm mã độc vào ô chat và tên nhóm: Toàn bộ mã độc hiển thị an toàn dưới dạng chuỗi văn bản thuần túy, tuyệt đối không bị trình duyệt thực thi.",
        tip: "Hàm `esc()` nhỏ nhưng có võ, thể hiện tư duy phòng thủ chiều sâu (Defense in Depth)."
      },
      {
        q: "Kiểm thử giao diện (UI Testing) trên màn hình nhỏ di động 375px (iPhone SE) tập trung vào những điểm gì?",
        keywords: "Responsive Testing, Viewport 375px, Tràn ngang (Overflow-X), Bố cục 2 cột",
        a: "Nhóm tập trung kiểm thử 5 khía cạnh then chốt trên thiết bị di động:\n1. **Loại bỏ tràn ngang:** Kiểm tra `document.documentElement.scrollWidth <= window.innerWidth` để cam kết không có thanh cuộn ngang gây vỡ khung hình.\n2. **Khả năng bấm nút (Touch Target):** Các nút chuyển bài, menu, đóng ✕ đều có kích thước bấm ngón tay thoải mái.\n3. **Độ tương phản chữ:** Cỡ chữ nội dung tối thiểu 12px, đảm bảo đọc rõ ràng dưới ánh sáng ban ngày.\n4. **Bố cục co giãn:** Danh sách môn học và cửa hàng tự động chuyển sang lưới 2 cột cân đối như giao diện Facebook di động.\n5. **Bàn phím ảo không che khuất:** Khi bàn phím ảo bật lên trên điện thoại, thanh nhập tin nhắn Messenger tự động đẩy lên trên mà không che mất nội dung chat.",
        tip: "Nhắc lại các ảnh chụp thực tế màn hình iPhone SE 375px trong báo cáo Sprint 6."
      },
      {
        q: "Cơ chế xử lý ngoại lệ (Exception Handling) tập trung của hệ thống hoạt động như thế nào?",
        keywords: "Global Try-Catch, Lớp `HttpError`, Logging tập trung, Trải nghiệm người dùng",
        a: "- Toàn bộ luồng xử lý API được bọc trong một khối `try-catch` tổng thể tại hàm `fetch()` của Cloudflare Workers:\n  - Nếu bắt được lỗi nghiệp vụ chủ động (`err instanceof HttpError`): Trả về đúng mã HTTP tương ứng (400, 401, 403, 404, 429) cùng thông báo lỗi tiếng Việt thân thiện.\n  - Nếu phát sinh lỗi hệ thống chưa biết (Uncaught Exception): Tự động bắt lỗi, ghi log phục vụ chẩn đoán và trả về mã `500 Internal Server Error`, không bao giờ làm sập tiến trình Worker.\n- Phía Client: Hàm gọi API `api()` tự động bắt lỗi và hiển thị thanh thông báo lỗi Toast Popup mượt mà góc màn hình.",
        tip: "Khẳng định: Ứng dụng không bao giờ để lộ vết ngăn xếp lỗi (Stack Trace) ra cho người dùng cuối vì lý do an toàn thông tin."
      },
      {
        q: "Quy trình quản lý lỗi (Bug Life Cycle) được nhóm thực hiện như thế nào qua các Sprint?",
        keywords: "New -> Assigned -> Open -> Fixed -> Verified -> Closed",
        a: "Mọi con Bug phát hiện được đều tuân thủ vòng đời 6 bước:\n1. **New:** Phát hiện lỗi (ví dụ: lỗi video gửi trước câu lệnh hoặc avatar nhóm bị méo).\n2. **Assigned:** Phân công cho thành viên phụ trách module đó.\n3. **Open:** Thành viên tái hiện lỗi, điều tra nguyên nhân gốc rễ (Root Cause Analysis).\n4. **Fixed:** Viết code sửa lỗi và viết test case kiểm tra.\n5. **Verified:** Thành viên khác trong nhóm kiểm thử lại trên môi trường staging.\n6. **Closed:** Đóng lỗi sau khi xác nhận không còn phát sinh lỗi phụ.",
        tip: "Nêu ví dụ về việc xử lý dứt điểm 7 lỗi người dùng phản hồi ngay trong ngày ở Sprint 6."
      },
      {
        q: "Kiểm thử chấp nhận người dùng (User Acceptance Testing - UAT) mang lại bài học gì cho nhóm?",
        keywords: "UAT Feedback, Phát hiện lỗi thực tế, Tinh chỉnh trải nghiệm",
        a: "UAT là bước kiểm thử mang tính quyết định:\n- Khi nhóm đưa bản thử nghiệm cho sinh viên thật sử dụng, nhóm phát hiện ra những vấn đề mà môi trường giả lập không thấy được:\n  - Hiện tượng sinh viên vừa bật video vừa bấm video khác làm 2 âm thanh bị đè lên nhau $\\to$ Nhóm lập tức bổ sung cơ chế tự động Pause video cũ.\n  - Trình duyệt chặn cookie cross-origin cổng trường $\\to$ Nhóm phát minh ra tính năng Bookmarklet 1-chạm.\n- Nhờ UAT, sản phẩm đạt độ hoàn thiện cao nhất và thực sự giải quyết được nhu cầu của người học.",
        tip: "Chứng minh tinh thần cầu thị và cải tiến liên tục của nhóm phát triển phần mềm."
      },
      {
        q: "Continuous Integration & Deployment (CI/CD) trong đồ án được thiết lập như thế nào?",
        keywords: "Automated Pipeline, `npm run test`, `wrangler deploy`, Tự động kiểm tra trước phát hành",
        a: "Quy trình CI/CD được thiết lập tinh gọn và tự động hóa cao:\n1. **Continuous Integration (Tích hợp liên tục):** Mỗi khi có commit mới, script kiểm thử tự động `node scripts/test_sprint6_full_suite.cjs` được kích hoạt để kiểm tra tính tương thích của CSDL, API và các module native.\n2. **Continuous Deployment (Triển khai liên tục):** Khi toàn bộ test suite vượt qua (38 PASS), lệnh `npm run deploy` tự động đóng gói tài sản tĩnh, biên dịch mã backend và đẩy lên mạng lưới toàn cầu Cloudflare Workers chỉ trong chưa đầy 10 giây, gán mã Version ID duy nhất để dễ dàng rollback khi cần.",
        tip: "Chỉ ra Version ID mới nhất trên hệ thống Cloudflare để làm bằng chứng trực quan."
      },
      {
        q: "Nếu hệ thống gặp sự cố sau khi Deploy, quy trình khôi phục phiên bản (Rollback) diễn ra như thế nào?",
        keywords: "Version Rollback, Cloudflare Deployments History, Zero Downtime Recovery",
        a: "- Cloudflare Workers lưu trữ lịch sử mọi lần triển khai với các Version ID bất biến.\n- Nếu một bản release phát sinh lỗi nghiêm trọng trên Production:\n  - Nhóm chỉ cần vào Dashboard Cloudflare Workers hoặc chạy lệnh `wrangler rollback <version-id>`.\n  - Hệ thống sẽ chuyển hướng toàn bộ lưu lượng truy cập toàn cầu quay trở lại phiên bản ổn định trước đó chỉ trong vòng 1 giây mà không có bất kỳ thời gian chết nào (**Zero Downtime**).",
        tip: "Rollback là kỹ năng sống còn của kỹ sư phần mềm khi vận hành hệ thống thực tế."
      }
    ]
  },
  {
    chapterId: 7,
    title: "Chương 7: Các tính năng công nghệ đặc thù & Điểm sáng đồ án (Advanced Features)",
    desc: "Bao gồm 10 câu hỏi về các giải pháp kỹ thuật độc đáo: Kiosk Guard chống gian lận Windows, giải mã bảng điểm CMCU, khắc phục lỗi detached buffer PDF, HTTP 206 streaming nhạc và YouTube bot integration.",
    keywords: "Kiosk Guard, study_guard.exe, Giải mã XOR/Base64, Detached Buffer, HTTP 206 Streaming, YouTube Embed",
    questions: [
      {
        q: "Tính năng Kiosk Guard chống gian lận đa màn hình trong phòng học Pomodoro hoạt động như thế nào?",
        keywords: "Windows Native Hook, Multi-monitor blackout, Mouse trap, Kiosk containment",
        a: "Kiosk Guard là tính năng độc quyền trên bản Desktop Electron giải quyết triệt để nạn gian lận phân tâm khi tự học:\n- Khi học viên bấm bắt đầu phiên Pomodoro 25 phút, ứng dụng kích hoạt chế độ Kiosk toàn màn hình (`kiosk: true`, `alwaysOnTop: true`).\n- **Xử lý đa màn hình:** Quét toàn bộ danh sách màn hình phụ (`screen.getAllDisplays()`), tự động tạo các cửa sổ đen trong suốt khóa cứng trên tất cả các màn hình thứ hai, thứ ba, ngăn không cho học viên lén mở tài liệu hay chat trên màn hình phụ.\n- Con trỏ chuột bị khóa chặt trong phạm vi cửa sổ học bài.",
        tip: "Nhấn mạnh đây là tính năng hiếm có đồ án sinh viên nào làm được vì đòi hỏi can thiệp sâu vào API hệ điều hành."
      },
      {
        q: "Tệp nhị phân `study_guard.exe` can thiệp vào Windows API như thế nào?",
        keywords: "Win32 API, SetWindowsHookEx, Low-Level Keyboard Hook (WH_KEYBOARD_LL), Chặn Alt+Tab, Windows Key",
        a: "- `study_guard.exe` là một module native được viết bằng C++/Win32 biên dịch mã máy tối ưu:\n- Sử dụng hàm Windows API `SetWindowsHookEx(WH_KEYBOARD_LL, ...)` để cài đặt một móc chặn bàn phím cấp thấp (Low-Level Keyboard Hook).\n- Chặn đứng các tổ hợp phím tắt thoát ứng dụng phổ biến: `Alt + Tab`, `Alt + F4`, phím `Windows (Start Menu)`, `Ctrl + Esc`.\n- Khi phiên học kết thúc hoặc học viên bấm nút xác nhận rời phòng hợp lệ, tiến trình giải phóng móc hook (`UnhookWindowsHookEx`) và trả lại quyền điều khiển bình thường cho máy tính.",
        tip: "Giải thích rõ tệp `study_guard.exe` được đóng gói trực tiếp trong thư mục `build/` của dự án."
      },
      {
        q: "Cơ chế giải mã dữ liệu bảng điểm từ cổng trường CMCU (iu.cmcu.edu.vn) hoạt động ra sao?",
        keywords: "XOR Cipher, Base64 Encoding, Reverse Engineering Portal, Secret Key AzzSystem",
        a: "Hệ thống cổng thông tin đào tạo của trường Đại học CMC sử dụng cơ chế bảo vệ payload đặc thù:\n- Các request gửi đi và dữ liệu trả về được mã hóa kết hợp giữa thuật toán **XOR đối xứng** và **Base64**:\n  - Phép toán: $\\text{CipherChar} = \\text{Char} \\oplus \\text{KeyChar}$\n  - Khóa giải mã mặc định: `AzzSystem` hoặc trích xuất từ action header.\n- Nhóm đã nghiên cứu cấu trúc truyền thông API của cổng trường (Reverse Engineering hợp pháp), viết thành công 2 hàm lõi `ma_hoa_iu()` và `giai_ma_iu()` trong `src/academic_service.js`, giải mã hoàn hảo dữ liệu kết quả học tập cá nhân và điểm tích lũy của sinh viên.",
        tip: "Dẫn chứng việc phần mềm giải mã được điểm hệ 10, điểm hệ 4 và điểm chữ của từng học kỳ hiển thị mượt mà trên dashboard."
      },
      {
        q: "Làm thế nào nhóm khắc phục rào cản Same-Origin Policy (CORS) khi đăng nhập trường trên Web?",
        keywords: "Same-Origin Policy, Bookmarklet 1-chạm, Console Injection, Cross-domain Data Transfer",
        a: "- **Vấn đề kỹ thuật:** Do chính sách bảo mật Same-Origin của trình duyệt, trang web `workers.dev` không có quyền truy cập vào Cookie hoặc LocalStorage của popup mở cổng trường `iu.cmcu.edu.vn`.\n- **Giải pháp kỹ thuật của nhóm:**\n  - Xây dựng công cụ **Mã đồng bộ 1-chạm (Bookmarklet)**:\n  - Người dùng đăng nhập cổng trường ở một tab, sau đó chạy đoạn mã JavaScript nhỏ từ thanh Bookmark hoặc F12 Console.\n  - Đoạn mã này thực thi trực tiếp tại miền `iu.cmcu.edu.vn`, lấy cookie phiên hợp lệ và gửi thẳng về máy chủ 3TG Study qua API `/api/academic/import`.\n  - Giúp sinh viên dùng bản Web vẫn đồng bộ được toàn bộ điểm thi chỉ trong 2 giây mà không cần cài thêm Extension trình duyệt phức tạp.",
        tip: "Mở modal đăng nhập IU trên web, chỉ cho cô xem nút 'Chép mã 1-chạm' và ô dán cookie tiện lợi."
      },
      {
        q: "Trợ lý 3TG AI phân tích lộ trình cải thiện GPA theo phương pháp Active Recall như thế nào?",
        keywords: "Groq Cloud LLaMA 3.3, Active Recall, Spaced Repetition, Phân tích môn C/D/F",
        a: "- Khi bảng điểm được đồng bộ, hệ thống tự động lọc ra danh sách các môn học có điểm thấp (C, D, F hoặc điểm hệ 10 < 6.5) đang kéo tụt GPA nhiều nhất.\n- Dữ liệu này được đóng gói vào Prompt gửi tới mô hình AI LLaMA 3.3 qua Groq Cloud:\n  - AI sẽ lập lộ trình học tập cá nhân hóa 4 tuần.\n  - Hướng dẫn áp dụng kỹ thuật **Chủ động hồi tưởng (Active Recall)** và **Lặp lại ngắt quãng (Spaced Repetition)** thay vì đọc thụ động.\n  - Phân tích môn nào học lại sẽ giúp GPA tăng nhanh nhất với chi phí tín chỉ thấp nhất.",
        tip: "Nêu bật tính ứng dụng cao của AI trong việc cố vấn học tập thực tế cho sinh viên."
      },
      {
        q: "Lỗi 'Detached ArrayBuffer' trong Web Worker khi xem tài liệu PDF là gì và cách nhóm khắc phục?",
        keywords: "Web Worker, Structured Clone Algorithm, Transferable Objects, `buffer.slice(0)`",
        a: "- **Nguyên nhân lỗi:** Khi đọc file PDF bằng thư viện PDF.js trong môi trường Web Worker, theo cơ chế truyền dữ liệu của HTML5 (Transferable Objects), vùng nhớ `ArrayBuffer` của file PDF sau khi gửi sang Worker sẽ bị xóa quyền sở hữu ở luồng chính (trở thành **Detached ArrayBuffer**). Nếu người dùng chuyển trang hoặc vẽ lại canvas, ứng dụng sẽ sập ngay lập tức.\n- **Cách khắc phục triệt để:**\n  - Nhóm xử lý nhân bản mảng nhị phân trước khi chuyển giao bằng kỹ thuật sao chép sâu vùng nhớ: `new Uint8Array(buffer.slice(0))`.\n  - Đảm bảo luồng chính luôn giữ một bản sao bộ nhớ nguyên vẹn, người dùng có thể lật trang, phóng to, thu nhỏ và nhảy trang tài liệu PDF mượt mà không bao giờ bị crash.",
        tip: "Đây là một lỗi kỹ thuật ngầm rất khó chịu trong xử lý nhị phân của trình duyệt, sửa được chứng tỏ nhóm có năng lực debug chuyên sâu."
      },
      {
        q: "Trình phát nhạc cục bộ hỗ trợ chuẩn HTTP 206 Partial Content Byte-Range Streaming như thế nào?",
        keywords: "HTTP 206 Partial Content, Header `Range: bytes=start-end`, Tua nhạc mượt mà, Node HTTP Server",
        a: "- **Vấn đề:** Khi người dùng tua một bài hát dài, nếu server chỉ hỗ trợ mã `200 OK` thông thường, trình duyệt buộc phải tải lại toàn bộ file từ đầu, gây giật lag và tốn băng thông.\n- **Giải pháp:** Trong file `embedded-server.cjs`, nhóm xây dựng luồng phát trực tiếp hỗ trợ mã phản hồi **`HTTP 206 Partial Content`**:\n  - Đọc header `Range: bytes=x-y` từ request của trình duyệt.\n  - Sử dụng luồng đọc file theo đoạn `fs.createReadStream(filePath, { start, end })`.\n  - Trả về header `Content-Range: bytes start-end/totalSize`.\n  - Cho phép người dùng tua tới bất kỳ giây nào của bài hát và âm thanh phát ngay tức thì.",
        tip: "Đây là cơ chế chuẩn mực được các nền tảng streaming lớn như YouTube, Spotify sử dụng."
      },
      {
        q: "Cơ chế chống xung đột âm thanh (`handleMediaPlay`) khi người dùng mở nhiều video cùng lúc hoạt động ra sao?",
        keywords: "Audio Conflict Prevention, `window.handleMediaPlay`, Event Delegation, Pause All",
        a: "- **Vấn đề người dùng phản ánh:** Khi học viên bấm xem video này trong khung chat, sau đó bấm tiếp video khác, cả 2 video cùng phát làm âm thanh bị trộn lẫn vào nhau.\n- **Giải pháp kỹ thuật:**\n  - Nhóm xây dựng hàm điều phối trung tâm `window.handleMediaPlay(currentEl)` gắn vào sự kiện `onplay` của mọi thẻ `<video>` và `<audio>`.\n  - Khi một phương tiện bắt đầu phát, hàm sẽ tự động duyệt toàn bộ DOM qua `document.querySelectorAll('video, audio')`, tự động gọi lệnh `.pause()` trên tất cả các trình phát khác và gỡ bỏ cờ đang phát.\n  - Đảm bảo tại một thời điểm chỉ có duy nhất một nguồn âm thanh được cất lên trong toàn bộ ứng dụng.",
        tip: "Một chi tiết nhỏ nhưng nâng cao chất lượng trải nghiệm người dùng (UX) đạt chuẩn chuyên nghiệp."
      },
      {
        q: "Cơ chế tìm kiếm và nhúng YouTube Video ID tự động cho lệnh `!sing` của Bot 3TG hoạt động như thế nào?",
        keywords: "YouTube Video Extraction, Regex `/watch?v=([a-zA-Z0-9_-]{11})/`, Responsive Iframe Embed",
        a: "- Khi sinh viên gõ lệnh `!sing [tên bài]` trong nhóm chat (ví dụ `!sing yêu`):\n  1. Bot 3TG gửi truy vấn tìm kiếm ngầm tới YouTube Search.\n  2. Trích xuất mã định danh video 11 ký tự chuẩn xác qua biểu thức chính quy (Regex): `/\/watch\\?v=([a-zA-Z0-9_-]{11})/`.\n  3. Trả về tin nhắn chứa đường dẫn xem trực tiếp kèm cấu trúc thẻ nhúng `iframe` bảo mật `https://www.youtube-nocookie.com/embed/${ytId}`.\n  4. Giao diện Messenger tự động dựng khung phát nhạc tỷ lệ 16:9 với giao diện gọn gàng, sinh viên có thể nghe nhạc chill học bài ngay trong chat.",
        tip: "Giải thích rõ việc dùng domain `youtube-nocookie.com` để tôn trọng quyền riêng tư và chặn quảng cáo theo dõi sinh viên."
      },
      {
        q: "Chức năng đổi Avatar nhóm học tập kết nối lưu trữ trực tiếp vào Cloudflare R2 được xây dựng ra sao?",
        keywords: "POST /api/groups/:id/avatar, R2 Put Object, Multipart FormData, Cập nhật đa giao diện",
        a: "Quy trình đổi avatar nhóm diễn ra qua 3 bước:\n1. **Phía Client:** Người dùng bấm vào biểu tượng máy ảnh trên avatar nhóm trong Messenger, chọn file ảnh từ máy tính (hỗ trợ JPG, PNG, WebP, GIF dung lượng <6MB). Dữ liệu được đóng gói vào đối tượng `FormData`.\n2. **Phía Backend:** Endpoint `POST /api/groups/:id/avatar` kiểm tra quyền thành viên trong bảng `chat_group_members`. Sau đó tạo một key định danh duy nhất `avatars/groups/${groupId}/${uuid}.${ext}` và đẩy thẳng lên Cloudflare R2 Bucket (`env.AVATARS.put()`).\n3. **Lưu trữ & Phản hồi:** Cập nhật trường `avatar_url` trong bảng `chat_groups`. Giao diện tự động cập nhật avatar mới hình tròn đồng bộ trên cả thanh tiêu đề chat, danh sách sidebar và trang mạng xã hội Bạn bè.",
        tip: "Khẳng định đây là tính năng vừa được cập nhật hoàn thiện ở phiên bản Release v4.0.8."
      }
    ]
  },
  {
    chapterId: 8,
    title: "Chương 8: Quản trị dự án, Mã nguồn sạch & Hướng phát triển (Maintenance, Clean Code & Future Scope)",
    desc: "Bao gồm 5 câu hỏi chiến lược về quản lý mã nguồn Git, nguyên lý SOLID, quản trị rủi ro phần mềm, định hướng thương mại hóa SaaS và bài học kinh nghiệm.",
    keywords: "Git Flow, SOLID, Clean Code, Risk Management, Commercialization, Lessons Learned",
    questions: [
      {
        q: "Chiến lược quản trị mã nguồn (Git Flow) và quy tắc viết Commit Message của nhóm là gì?",
        keywords: "Git Flow, Main / Feature Branches, Conventional Commits (feat, fix, docs, refactor, chore)",
        a: "- **Quy trình nhánh (Branching Strategy):**\n  - Nhánh `main`: Đại diện cho phiên bản Production ổn định, chỉ nhận merge khi đã vượt qua toàn bộ 38 test cases.\n  - Các nhánh tính năng (`feature/pomodoro`, `feature/academic`, `fix/mobile-layout`): Dùng để phát triển độc lập từng User Story.\n- **Quy tắc viết Commit chuẩn quốc tế (Conventional Commits):**\n  - Mọi commit đều có tiền tố rõ ràng:\n    - `feat:` Thêm tính năng mới (ví dụ: `feat: integrate YouTube music player in !sing command`).\n    - `fix:` Sửa lỗi (ví dụ: `fix: prevent group avatar distortion on 375px mobile`).\n    - `docs:` Viết tài liệu báo cáo Sprint.\n    - `refactor:` Tái cấu trúc code nhưng không thay đổi hành vi.\n    - `chore:` Dọn dẹp tệp tin rác và tối ưu cấu hình.",
        tip: "Mở `git log --oneline -n 10` để chứng minh lịch sử commit cực kỳ sạch đẹp, chuẩn chỉ."
      },
      {
        q: "Nguyên lý thiết kế mã nguồn sạch (SOLID Principles) được thể hiện ở những vị trí nào trong dự án?",
        keywords: "Single Responsibility (S), Open/Closed (O), Liskov Substitution (L), Interface Segregation (I), Dependency Inversion (D)",
        a: "Nhóm vận dụng linh hoạt các nguyên lý SOLID:\n1. **S - Single Responsibility Principle (Đơn trách nhiệm):** Mỗi module chỉ làm một nhiệm vụ duy nhất. `academic_service.js` chỉ chuyên trách giải mã và tính điểm, `bot3tg.js` chỉ xử lý lệnh media của bot, `pomodoro.js` chỉ quản lý chu kỳ đếm giờ và kiosk.\n2. **O - Open/Closed Principle (Mở rộng nhưng đóng thay đổi):** Mascot Thỏ Bảy Màu cho phép thêm trạng thái biểu cảm mới (`THO_STATES`) mà không cần đụng chạm hay viết lại hàm render cốt lõi.\n3. **D - Dependency Inversion (Đảo ngược phụ thuộc):** Tầng giao tiếp CSDL sử dụng lớp trừu tượng `env.DB` (Binding interface của Cloudflare), cho phép dễ dàng chuyển đổi hoặc chạy thử nghiệm giữa SQLite cục bộ và D1 Cloud mà không phải sửa logic nghiệp vụ.",
        tip: "Nhắc lại: 'Tuân thủ SOLID giúp đồ án sinh viên đạt chất lượng như một sản phẩm phần mềm doanh nghiệp'."
      },
      {
        q: "Quản trị rủi ro phần mềm (Risk Management): Phân tích 3 rủi ro kỹ thuật lớn nhất và biện pháp phòng ngừa của nhóm?",
        keywords: "Rủi ro 1: Thay đổi cổng trường, Rủi ro 2: Quá tải quota AI, Rủi ro 3: Xung đột bộ nhớ Worker",
        a: "Nhóm đã lập ma trận quản trị rủi ro ngay từ Sprint 1:\n1. **Rủi ro 1: Cổng trường CMCU thay đổi định dạng hoặc chặn IP:**\n   - *Giải pháp phòng ngừa:* Xây dựng đồng thời 3 cơ chế nạp điểm: Cào trực tiếp qua tài khoản trường, nhập cookie qua Bookmarklet 1-chạm, và tải lên file dữ liệu JSON/Excel dự phòng.\n2. **Rủi ro 2: Giới hạn tần suất gọi API AI của Groq (Rate limit exceeded):**\n   - *Giải pháp phòng ngừa:* Bot 3TG có sẵn hệ thống phản hồi luật ngữ nghĩa nội bộ (Rule-based NLP) và kho media tĩnh dự phòng để trả lời tức thì khi AI quá tải.\n3. **Rủi ro 3: Lỗi Detached ArrayBuffer làm sập trình đọc PDF:**\n   - *Giải pháp phòng ngừa:* Nhân bản sâu vùng nhớ nhị phân `buffer.slice(0)` trước khi chuyển giao vào Web Worker.",
        tip: "Khẳng định: 'Quản trị rủi ro tốt là luôn có ít nhất một phương án B (Fallback plan) cho mọi tính năng cốt lõi'."
      },
      {
        q: "Định hướng mở rộng và tiềm năng thương mại hóa (Commercialization) của sản phẩm 3TG Study AI?",
        keywords: "SaaS Multi-tenant, Mở rộng liên trường đại học, Gói Premium B2B, Gamification Shop",
        a: "Đồ án có tiềm năng phát triển thành sản phẩm khởi nghiệp công nghệ (EdTech Startup) thực thụ:\n1. **Mô hình SaaS Đa trường học (Multi-tenant Platform):** Mở rộng kiến trúc giải mã điểm để kết nối thêm cổng đào tạo của các trường đại học khác (Bách Khoa, Quốc Gia, FPT, Kinh Tế Quốc Dân).\n2. **Mô hình kinh doanh B2C & B2B:**\n   - *B2C (Freemium):* Miễn phí tính năng học tập cơ bản; thu phí gói Premium cho tính năng Cố vấn AI chuyên sâu không giới hạn và kho hình nền Discord Wallpaper động.\n   - *B2B:* Bán giải pháp phòng học Kiosk chống gian lận và giám sát kỳ thi trực tuyến cho các trường học và trung tâm đào tạo.\n3. **Hệ sinh thái Gamification:** Hợp tác với các thương hiệu sinh viên để đổi đá quý (gems) lấy voucher trà sữa, sách học tập thật.",
        tip: "Nhấn mạnh tính khả thi kinh doanh (Business Viability) sẽ giúp đồ án ghi điểm tuyệt đối trong mắt hội đồng giám khảo."
      },
      {
        q: "Nếu được làm lại dự án từ đầu, nhóm sẽ cải tiến điều gì về mặt Công nghệ Phần mềm?",
        keywords: "TypeScript, Automated E2E Cypress/Playwright, WebRTC Voice Room, CI/CD GitHub Actions",
        a: "Nhìn lại toàn bộ hành trình 6 Sprints, nhóm đúc rút được 3 cải tiến chiến lược:\n1. **Áp dụng TypeScript ngay từ đầu:** Giúp phát hiện sớm các lỗi sai kiểu dữ liệu ngay trong quá trình biên dịch (Compile-time Type Safety), đặc biệt khi xử lý các cấu trúc dữ liệu bảng điểm phức tạp.\n2. **Bổ sung kiểm thử tự động giao diện End-to-End (E2E):** Tích hợp Playwright hoặc Cypress vào quy trình CI/CD để tự động chạy thử kịch bản click chuột trên trình duyệt di động trước mỗi lần deploy.\n3. **Nâng cấp tính năng học nhóm sang WebRTC:** Thay vì chỉ hiển thị danh sách bạn cùng học và chat văn bản, nhóm sẽ nâng cấp phòng Pomodoro thành kênh thoại Voice/Video P2P trực tiếp để sinh viên có cảm giác như đang ngồi chung bàn học thực sự.",
        tip: "Đây là câu hỏi kết thúc vấn đáp kinh điển của giảng viên để đánh giá mức độ trưởng thành và khả năng tự phản biện (Self-reflection) của sinh viên. Trả lời khiêm tốn nhưng định hướng tương lai sắc sảo."
      }
    ]
  }
];

// 1. Tạo file Markdown chi tiết
let mdContent = `# BỘ 100 CÂU HỎI & ĐÁP VẤN ĐÁP MÔN CÔNG NGHỆ PHẦN MỀM (SOFTWARE ENGINEERING)
## ĐỒ ÁN: NỀN TẢNG HỌC TẬP THÔNG MINH ĐA NỀN TẢNG 3TG STUDY AI (LUMI STUDY HUB)
**Trường Đại học CMC (CMC University) - Bộ môn Công nghệ Thông tin**  
**Mã học phần:** INFO2011 • **Học kỳ:** 2025 - 2026 • **Sinh viên thực hiện:** LÊ VĂN AN  
**Mô hình phát triển:** Agile / Scrum (6 Sprints) • **Hệ thống triển khai:** Cloudflare Workers + Windows Kiosk  
**Tập tin tài liệu lưu trữ tại:** \`sprint/100_cau_hoi_dap_van_dap_cnpm.md\` & \`sprint/100_cau_hoi_dap_van_dap_cnpm.pdf\`  

---

## MỤC LỤC TỔNG QUAN 100 CÂU HỎI
- **Chương 1:** Kiến trúc phần mềm & Công nghệ nền tảng *(Câu 1 - 15)*
- **Chương 2:** Cơ sở dữ liệu & Mô hình hóa dữ liệu (ERD & 3NF) *(Câu 16 - 32)*
- **Chương 3:** Quy trình phát triển phần mềm Agile/Scrum *(Câu 33 - 48)*
- **Chương 4:** Kỹ nghệ yêu cầu phần mềm (FR & NFR) *(Câu 49 - 60)*
- **Chương 5:** Thiết kế hệ thống & Mô hình hóa UML *(Câu 61 - 72)*
- **Chương 6:** Kiểm thử & Đảm bảo chất lượng phần mềm (QA/Testing) *(Câu 73 - 85)*
- **Chương 7:** Các tính năng công nghệ đặc thù & Điểm sáng đồ án *(Câu 86 - 95)*
- **Chương 8:** Quản trị dự án, Mã nguồn sạch & Hướng phát triển *(Câu 96 - 100)*

---
\n`;

let qCounter = 1;
for (const chap of chapters) {
  mdContent += `\n# ${chap.title}\n*${chap.desc}*\n\n`;
  for (const item of chap.questions) {
    mdContent += `### Câu ${qCounter}: ${item.q}\n`;
    mdContent += `- **Từ khóa trọng tâm:** \`${item.keywords}\`\n`;
    mdContent += `- **Câu trả lời chuẩn mực:**\n${item.a.split('\n').map(l => '  ' + l).join('\n')}\n`;
    mdContent += `- **💡 Mẹo vấn đáp ăn điểm:** *${item.tip}*\n\n`;
    mdContent += `---\n\n`;
    qCounter++;
  }
}

const mdPath = path.join(__dirname, '..', 'sprint', '100_cau_hoi_dap_van_dap_cnpm.md');
fs.writeFileSync(mdPath, mdContent, 'utf8');
console.log(`✅ Đã tạo thành công file Markdown: ${mdPath}`);

// 2. Tạo file HTML in ấn A4 chuẩn mực học thuật
let htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>100 Câu Hỏi Đáp Vấn Đáp Môn Công Nghệ Phần Mềm - 3TG Study AI</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 10pt;
      line-height: 1.55;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    /* COVER PAGE */
    .cover-page {
      padding: 40px 30px;
      border: 4px double #0f172a;
      text-align: center;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 240mm;
    }
    .cover-header {
      width: 100%;
    }
    .school-title {
      font-size: 13pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #0f172a;
      margin: 0;
    }
    .dept-title {
      font-size: 11pt;
      font-weight: 700;
      color: #334155;
      margin-top: 5px;
    }
    .cover-divider {
      width: 180px;
      height: 2px;
      background: #0f172a;
      margin: 15px auto 0;
    }
    .cover-body {
      margin: 30px 0;
    }
    .cover-doc-badge {
      display: inline-block;
      padding: 5px 16px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 999px;
      font-size: 9.5pt;
      font-weight: 700;
      color: #db2777;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 20px;
    }
    .cover-main-title {
      font-size: 20pt;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.3;
      text-transform: uppercase;
      margin: 0 0 15px;
    }
    .cover-sub-title {
      font-size: 13pt;
      font-weight: 700;
      color: #2563eb;
      margin: 0 0 12px;
    }
    .cover-desc {
      font-size: 10pt;
      color: #475569;
      max-width: 520px;
      margin: 0 auto;
      line-height: 1.6;
    }
    .cover-footer {
      width: 100%;
      border-top: 1px solid #e2e8f0;
      padding-top: 15px;
      display: flex;
      justify-content: space-between;
      text-align: left;
      font-size: 9.5pt;
    }
    .cover-info-block {
      line-height: 1.6;
    }
    .cover-info-block strong {
      color: #0f172a;
    }

    /* CHAPTER STYLES */
    .chapter-header {
      background: #f8fafc;
      border-left: 5px solid #db2777;
      border-top: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 16px;
      margin: 25px 0 15px;
      page-break-after: avoid;
    }
    .chapter-header h2 {
      font-size: 12pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px;
    }
    .chapter-header p {
      font-size: 8.5pt;
      color: #64748b;
      margin: 0;
      font-style: italic;
    }

    /* QUESTION CARD */
    .qa-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      margin-bottom: 12px;
      padding: 11px 13px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .qa-card:nth-child(even) {
      background: #fcfcfd;
    }
    .q-title {
      font-size: 10pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px;
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .q-badge {
      display: inline-block;
      background: #db2777;
      color: #ffffff;
      font-size: 7.5pt;
      font-weight: 900;
      padding: 2px 6px;
      border-radius: 3px;
      flex-shrink: 0;
    }
    .q-keywords {
      font-size: 8.5pt;
      color: #475569;
      background: #f1f5f9;
      padding: 2px 7px;
      border-radius: 4px;
      margin-bottom: 6px;
      display: inline-block;
    }
    .q-keywords strong {
      color: #0f172a;
    }
    .a-content {
      font-size: 9.5pt;
      color: #1e293b;
      line-height: 1.5;
      margin-bottom: 6px;
    }
    .a-content p {
      margin: 4px 0;
    }
    .a-content ul, .a-content ol {
      margin: 4px 0 4px 18px;
      padding: 0;
    }
    .a-content li {
      margin-bottom: 2px;
    }
    .pro-tip {
      background: #fef3c7;
      border-left: 3px solid #f59e0b;
      padding: 4px 9px;
      border-radius: 0 4px 4px 0;
      font-size: 8.5pt;
      color: #92400e;
      margin-top: 6px;
    }
    .pro-tip strong {
      color: #78350f;
    }
    .footer-note {
      text-align: center;
      font-size: 8.5pt;
      color: #94a3b8;
      margin-top: 25px;
      border-top: 1px dashed #cbd5e1;
      padding-top: 10px;
    }
  </style>
</head>
<body>

  <!-- TRANG BÌA CHÍNH THỨC -->
  <div class="cover-page">
    <div class="cover-header">
      <div class="school-title">BỘ GIÁO DỤC VÀ ĐÀO TẠO • TRƯỜNG ĐẠI HỌC CMC</div>
      <div class="dept-title">KHOA CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG</div>
      <div class="cover-divider"></div>
    </div>

    <div class="cover-body">
      <div class="cover-doc-badge">TÀI LIỆU ÔN TẬP VẤN ĐÁP BẢO VỆ ĐỒ ÁN MÔN HỌC</div>
      <h1 class="cover-main-title">100 CÂU HỎI & CÂU TRẢ LỜI VẤN ĐÁP<br>MÔN CÔNG NGHỆ PHẦN MỀM</h1>
      <div class="cover-sub-title">ĐỀ TÀI: NỀN TẢNG HỌC TẬP THÔNG MINH ĐA NỀN TẢNG 3TG STUDY AI</div>
      <p class="cover-desc">
        Hệ thống câu hỏi và câu trả lời mô hình hóa toàn diện: Chuẩn hóa dữ liệu 3NF, Cấu trúc Database Cloudflare D1/R2, Kiến trúc Serverless Edge & Hybrid Desktop, Quy trình Agile Scrum 6 Sprints, Kỹ nghệ yêu cầu, Thiết kế UML và Bộ kiểm thử 38 Test Cases.
      </p>
    </div>

    <div class="cover-footer">
      <div class="cover-info-block">
        <div><strong>Mã học phần:</strong> INFO2011 (Công nghệ phần mềm)</div>
        <div><strong>Học kỳ:</strong> Học kỳ 1 • Năm học 2025 - 2026</div>
        <div><strong>Cơ sở đào tạo:</strong> CMC University Campus</div>
      </div>
      <div class="cover-info-block" style="text-align: right;">
        <div><strong>Sinh viên thực hiện:</strong> LÊ VĂN AN</div>
        <div><strong>Lớp học phần:</strong> Lớp Công nghệ phần mềm</div>
        <div><strong>Phiên bản phát hành:</strong> Release v4.0.8 (Master Suite)</div>
      </div>
    </div>
  </div>

  <!-- NỘI DUNG 100 CÂU HỎI -->
`;

let qNum = 1;
for (const chap of chapters) {
  htmlContent += `
  <div class="chapter-header">
    <h2>${chap.title}</h2>
    <p>${chap.desc}</p>
  </div>
  `;

  for (const item of chap.questions) {
    // Escape HTML trước để tránh XSS alert làm treo Chrome headless
    const safeRawAnswer = item.a
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Format câu trả lời sang HTML
    let formattedAnswer = safeRawAnswer
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n- /g, '</li><li>')
      .replace(/\n  - /g, '</li><li style="margin-left: 15px;">')
      .replace(/\n1\. /g, '</p><ol><li>')
      .replace(/\n2\. /g, '</li><li>')
      .replace(/\n3\. /g, '</li><li>')
      .replace(/\n4\. /g, '</li><li>')
      .replace(/\n5\. /g, '</li><li>')
      .replace(/\n6\. /g, '</li><li>');

    if (formattedAnswer.includes('<li>')) {
      formattedAnswer = '<p>' + formattedAnswer + '</li></ol>';
    } else {
      formattedAnswer = '<p>' + formattedAnswer + '</p>';
    }

    htmlContent += `
    <div class="qa-card">
      <div class="q-title">
        <span class="q-badge">CÂU ${qNum}</span>
        <span>${item.q}</span>
      </div>
      <div class="q-keywords"><strong>Từ khóa cốt lõi:</strong> ${item.keywords}</div>
      <div class="a-content">${formattedAnswer}</div>
      <div class="pro-tip"><strong>💡 Bí quyết trả lời ăn điểm tối đa:</strong> ${item.tip}</div>
    </div>
    `;
    qNum++;
  }
}

htmlContent += `
  <div class="footer-note">
    Tài liệu lưu trữ nội bộ thuộc Thư viện Sprint đồ án 3TG Study AI • Trường Đại học CMC • Hoàn thành ngày 26/11/2026.
  </div>
</body>
</html>
`;

const htmlPath = path.join(__dirname, '..', 'sprint', '100_cau_hoi_dap_van_dap_cnpm.html');
fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log(`✅ Đã tạo thành công file HTML: ${htmlPath}`);

// 3. Biên dịch sang file PDF bằng Edge / Chrome Headless
const pdfPath = path.join(__dirname, '..', 'sprint', '100_cau_hoi_dap_van_dap_cnpm.pdf');
const edgePath1 = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const edgePath2 = 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

let browserExe = '';
if (fs.existsSync(edgePath1)) browserExe = edgePath1;
else if (fs.existsSync(edgePath2)) browserExe = edgePath2;
else if (fs.existsSync(chromePath)) browserExe = chromePath;

console.log(`⏳ Sử dụng trình duyệt: ${browserExe}`);
const tempProfile = path.join(require('os').tmpdir(), 'pdf_profile_' + Date.now());

try {
  const cmd = `"${browserExe}" --headless --disable-gpu --no-pdf-header-footer --user-data-dir="${tempProfile}" --print-to-pdf="${pdfPath}" "${htmlPath}"`;
  console.log("Thực thi:", cmd);
  execSync(cmd, { stdio: 'inherit', timeout: 90000 });
  const stats = fs.statSync(pdfPath);
  console.log(`🎉 XUẤT PDF THÀNH CÔNG RỰC RỠ!`);
  console.log(`📄 Đường dẫn: ${pdfPath}`);
  console.log(`📦 Dung lượng file: ${(stats.size / 1024 / 1024).toFixed(2)} MB (${stats.size} bytes)`);
  try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch {}
} catch (err) {
  console.error("❌ Lỗi khi xuất PDF:", err.message);
  process.exit(1);
}
