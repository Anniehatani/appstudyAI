# Hướng dẫn bot Messenger: hàng đợi và xử lý giới hạn

Bot hiện sử dụng `ws3-fca` và phiên cookie của tài khoản cá nhân. Đây là tích hợp không chính thức. Cooldown, độ trễ gõ phím và lưu cookie không bảo đảm tránh checkpoint hoặc khóa tài khoản. API chính thức cũng không miễn trừ các giới hạn và chính sách của Meta.

Phân tích mã, cấu trúc payload và header nằm trong [PHAN_TICH_FACEBOOK.md](PHAN_TICH_FACEBOOK.md).

## Hành vi hàng đợi

- Tin nhắn được xử lý tuần tự, với khoảng nghỉ giữa các tác vụ, kể cả khi gửi lỗi.
- Mỗi tác vụ gọi `api.sendMessage` một lần. Bot không tự gửi lại bỏ reply ID khi thất bại. Thư viện bên dưới vẫn có thể retry nội bộ; đây không phải cam kết giao tin đúng một lần.
- Mặc định nhận tối đa 100 tin đang chờ, ngoài tin đang xử lý. Đây là giới hạn bộ nhớ của bot, không phải hạn mức được Facebook cho phép.
- Khi thao tác gửi trả lỗi có status HTTP 429, hàng đợi dừng và từ chối các tin đang chờ, các tin gửi tiếp theo.
- Lỗi gửi có status HTTP 401/403 hoặc thông báo xác thực rõ ràng như `Not logged in`, `checkpoint` cũng làm dừng hàng đợi. Không tự đăng nhập lại hoặc tự tiếp tục gửi.
- Lỗi không có status/thông tin xác thực rõ ràng được báo thất bại, không được tự suy diễn thành checkpoint.

Các mã vận hành:

| Mã | Ý nghĩa | Cách xử lý |
| --- | --- | --- |
| `OUTBOX_FULL` | Tin chưa được nhận vào hàng đợi | Giảm tải đầu vào; không tạo vòng lặp gửi lại |
| `OUTBOX_RATE_LIMITED` | Đã nhận lỗi giới hạn truy cập | Dừng gửi; kiểm tra phản hồi và tuân thủ thời gian chờ do nền tảng cung cấp |
| `OUTBOX_AUTH_REQUIRED` | Cần kiểm tra phiên hoặc quyền truy cập | Kiểm tra bằng giao diện chính thức; không tự lặp đăng nhập |
| `OUTBOX_UNSUPPORTED_API` | `sendMessage` không trả Promise như phiên bản hiện dùng | Kiểm tra phiên bản/adapter; kết quả lần gọi vừa rồi chưa xác định |
| `SEND_FAILED` trong log | Lần gọi thất bại nhưng chưa phân loại được | Không tự gửi lại nếu chưa biết tin đã tới nơi hay chưa |

Hàng đợi dừng đến khi tiến trình khởi động lại. Chỉ khởi động lại sau khi đã giải quyết nguyên nhân và đáp ứng giới hạn/quyền truy cập. Các tin bị từ chối không được lưu bền hoặc tự phát lại.

## Cấu hình

Các khóa dưới đây thuộc phần `ANTI_BAN` trong `config.json`; tên cũ được giữ để tương thích:

```json
{
  "ANTI_BAN": {
    "MAX_OUTBOX_QUEUE_SIZE": 100,
    "OUTBOX_INTERVAL_MS": 1200,
    "USER_COOLDOWN_MS": 2500
  }
}
```

Đây là ví dụ phần cấu hình, không phải toàn bộ `config.json`. `MAX_OUTBOX_QUEUE_SIZE` phải là số nguyên dương. Các giá trị thời gian là thiết lập của ứng dụng, không chứng minh Facebook chấp thuận một tần suất cụ thể.

Cooldown hiện là giới hạn theo thời điểm thao tác gần nhất của mỗi người dùng, không phải thuật toán token bucket. Quản trị viên được miễn cooldown này. Kiểm tra người gửi có phải chính bot chỉ ngăn tự phản hồi, chưa ngăn được hai bot khác nhau phản hồi qua lại.

## Cookie và log

`appstate.json` chứa thông tin phiên nhạy cảm. `.gitignore` đã loại trừ file mặc định và file tạm `appstate.json.tmp`. Nếu đổi `APPSTATE_PATH`, cần loại trừ cả đường dẫn mới và file tạm tương ứng. `.gitignore` không xóa các bản đã được commit hay chia sẻ trước đó.

Tác vụ lưu AppState chỉ chép cookie đang có trong cookie jar xuống đĩa. Nó không gia hạn phiên hoặc gỡ checkpoint ở phía Facebook. Không chia sẻ cookie, token, nội dung `.env`, hay bản ghi request đầy đủ. Log proxy của bot hiện ẩn địa chỉ và thông tin xác thực; các log khác và log nội bộ của thư viện vẫn cần được rà soát trước khi chia sẻ.

## Kiểm tra ngoại tuyến

```powershell
npm.cmd test
node --check index.js
node --check src/utils/antiBan.js
```

Kiểm thử dùng API giả, không đăng nhập hoặc gửi tin lên Facebook. `npm.cmd` dùng được trên Windows khi PowerShell chặn `npm.ps1`.

## Hướng tích hợp lâu dài

Với bot dành cho Facebook Page, hướng triển khai là Messenger Platform chính thức: Page Access Token, webhook có xác minh chữ ký, quyền gửi tin phù hợp và xử lý giới hạn theo phản hồi API. Cần kiểm tra khả năng hỗ trợ tính năng trước khi chuyển; bot Page không mặc nhiên thay thế được bot tài khoản cá nhân trong các nhóm chat hiện tại.

Điểm bắt đầu tham khảo: [Messenger Platform](https://developers.facebook.com/docs/messenger-platform/). Quyền, phiên bản API và chính sách hiện hành phải được đối chiếu trước khi triển khai. Workspace hiện chưa chứa phần tích hợp Page này.
