# Lumi Study

3TG là ứng dụng học tập tiếng Việt chạy trên Cloudflare Worker, với giao diện hồng, lộ trình theo môn học trong Cloudflare D1, bài trắc nghiệm, XP, chuỗi học, hồ sơ, Sổ tay ghi chú và trợ giảng Local AI. Giao diện hiện tại dùng JavaScript module và CSS tĩnh; Worker là API/runtime.

## Dữ liệu đang kết nối

Worker hiện đọc/ghi các bảng học liệu, hồ sơ và gamification có sẵn trong D1, cùng `user_notes`, `ai_conversations` và `ai_messages`. Cẩm nang chỉ đọc `lessons.content`/`lessons.video_url`; app không sửa dữ liệu học liệu.

Lần kiểm tra D1 gần nhất có 10 môn, 106 chương, 4.094 bài học, 29.460 câu hỏi và 10 bản ghi subject_data. Bảng profiles, user_progress và user_stats chưa có hồ sơ người học. Lumi không thêm hoặc sửa dữ liệu môn học.

## Chạy ở máy

1. Cài Node.js và npm.
2. Mở thư mục dự án rồi chạy:

       npm install

3. Đăng nhập Wrangler vào tài khoản Cloudflare có quyền với D1 và R2:

       npx wrangler login

4. Chạy ứng dụng:

       npm run dev

5. Mở địa chỉ local mà Wrangler hiển thị.

wrangler.jsonc đã gắn D1 app-study-db và bucket R2 my-project-bucket. Cả hai binding đang dùng remote: true, vì vậy Worker local đọc/ghi trực tiếp tài nguyên Cloudflare thật. Bấm **Bắt đầu học** hoặc mở bài học đầu tiên sẽ tạo hồ sơ profiles/user_stats mới; hoàn thành bài sẽ ghi XP, tim, chuỗi học và tiến độ vào D1. Tải ảnh đại diện sẽ ghi object vào R2 và lưu đường dẫn trong profiles.avatar_url.

## Trợ giảng Lumi AI

Trong chế độ local, Wrangler đọc biến môi trường từ file .env ở thư mục project. Đặt `LOCAL_AI_ENDPOINT` trỏ tới endpoint tương thích OpenAI của máy chạy model, ví dụ `http://127.0.0.1:1234/v1/chat/completions`; model văn bản mặc định là `qwen2.5:14b-instruct` và có thể đổi bằng `LOCAL_AI_MODEL`. Có thể đặt `LOCAL_AI_VISION_MODEL` thành model hỗ trợ đọc ảnh; nếu bỏ trống, app dùng `LOCAL_AI_MODEL` cho ảnh. Nếu máy AI yêu cầu xác thực, đặt secret `LOCAL_AI_API_KEY`. Khi chưa cấu hình endpoint, API chat trả về thông báo cấu hình còn thiếu và không gửi câu hỏi tới nhà cung cấp AI bên ngoài.

Khi triển khai Worker, endpoint phải truy cập được từ môi trường Worker. Không dùng `127.0.0.1` cho Worker đã deploy trên Cloudflare; địa chỉ đó trỏ tới chính Worker runtime. Dùng mạng riêng hoặc cổng kết nối được bảo vệ tới máy GPU, và lưu khóa tùy chọn bằng lệnh:

       npx wrangler secret put LOCAL_AI_API_KEY

Các file .env và .dev.vars được loại khỏi Git.

## Triển khai

- Chạy npm run deploy để đưa Worker và thư mục public/ lên Cloudflare.
- Đặt `LOCAL_AI_ENDPOINT`, `LOCAL_AI_MODEL` và tùy chọn `LOCAL_AI_VISION_MODEL` cho Worker trước khi bật chat.
- Tài khoản Cloudflare/Wrangler cần quyền truy cập D1 và R2 đã khai báo trong wrangler.jsonc.

## Sổ tay ghi chú

Trang Sổ tay hỗ trợ lọc theo môn/bài, tìm tiêu đề và nội dung, lưu bản nháp tự động sau 500 ms, gắn ghi chú với bài học, và xóa ghi chú. Mỗi ghi chú lưu giấy kẻ ngang/ô li/chấm/trắng, phông chữ và nét vẽ ngay trong `user_notes.content`; có công cụ hình học, chèn ký hiệu công thức và máy tính khoa học. AI tự do nhận văn bản trích từ PDF, DOCX, PPTX, XLSX và các tệp văn bản; ảnh được gửi đến model vision nếu đã cấu hình. PDF scan không có lớp văn bản cần gửi từng trang dưới dạng ảnh. API `/api/notes` giới hạn mọi thao tác theo phiên người học. Trong lộ trình, Cẩm nang mở nội dung `lessons.content`/`lessons.video_url`; khung ghi chú nhanh lưu vào cùng bảng `user_notes`. Câu trả lời AI có nút lưu vào Sổ tay, còn lịch sử phiên hỏi đáp được ghi trong `ai_conversations` và `ai_messages`.

Ảnh đại diện được giới hạn ở JPG, PNG hoặc WebP, tối đa 4 MB. URL ảnh đi qua route media của Worker; bucket không cần public.

## Ghi chú về hồ sơ

Lumi tạo một hồ sơ khách ngẫu nhiên khi người học bắt đầu. Cookie phiên được giữ trên thiết bị và dùng để nối hồ sơ với các bảng tiến độ hiện có. Tên và avatar được lưu ở D1; mục tiêu bài học, âm thanh, giao diện tối và giảm chuyển động được lưu trên thiết bị này. Chưa có luồng đăng ký bằng email hoặc đồng bộ hồ sơ giữa nhiều thiết bị.

## Tài liệu Cloudflare

- D1 Worker bindings: https://developers.cloudflare.com/d1/worker-api/
- Worker static assets: https://developers.cloudflare.com/workers/static-assets/
- R2 Worker bindings: https://developers.cloudflare.com/r2/api/workers/workers-api-usage/
