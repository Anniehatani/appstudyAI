# Lumi Study

Lumi là web app học tập tiếng Việt với giao diện hồng, lộ trình theo môn học trong Cloudflare D1, bài trắc nghiệm, XP, chuỗi học, hồ sơ cá nhân và trợ giảng AI.

## Dữ liệu đang kết nối

Ứng dụng dùng các bảng có sẵn trong D1: subjects, units, lessons, questions, user_progress, user_stats, profiles, user_mistakes, user_streak_history và weekly_leaderboards.

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

Trong chế độ local, Wrangler đọc biến môi trường từ file .env ở thư mục project. Worker lấy khóa DeepSeek ở phía server từ DEEPSEEK_API_KEY hoặc VITE_DEEPSEEK_API_KEY; khóa không nằm trong JavaScript gửi cho trình duyệt. VITE_DEEPSEEK_MODEL được dùng làm model nếu có, mặc định là deepseek-chat.

Khi triển khai Worker, đặt khóa AI bằng lệnh:

       npx wrangler secret put DEEPSEEK_API_KEY

Các file .env và .dev.vars được loại khỏi Git.

## Triển khai

- Chạy npm run deploy để đưa Worker và thư mục public/ lên Cloudflare.
- Trước khi dùng chat ở môi trường đã triển khai, thêm secret DEEPSEEK_API_KEY.
- Tài khoản Cloudflare/Wrangler cần quyền truy cập D1 và R2 đã khai báo trong wrangler.jsonc.

Ảnh đại diện được giới hạn ở JPG, PNG hoặc WebP, tối đa 4 MB. URL ảnh đi qua route media của Worker; bucket không cần public.

## Ghi chú về hồ sơ

Lumi tạo một hồ sơ khách ngẫu nhiên khi người học bắt đầu. Cookie phiên được giữ trên thiết bị và dùng để nối hồ sơ với các bảng tiến độ hiện có. Tên và avatar được lưu ở D1; mục tiêu bài học, âm thanh, giao diện tối và giảm chuyển động được lưu trên thiết bị này. Chưa có luồng đăng ký bằng email hoặc đồng bộ hồ sơ giữa nhiều thiết bị.

## Tài liệu Cloudflare

- D1 Worker bindings: https://developers.cloudflare.com/d1/worker-api/
- Worker static assets: https://developers.cloudflare.com/workers/static-assets/
- R2 Worker bindings: https://developers.cloudflare.com/r2/api/workers/workers-api-usage/
