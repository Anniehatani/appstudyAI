# 🤖 HƯỚNG DẪN CẤU HÌNH & CHẠY DISCORD BOT (PHIÊN BẢN TINH GIẢN)

Dự án đã được lọc sạch toàn bộ code rác, chuyển đổi hoàn toàn sang **Discord Bot thuần túy (Discord.js v14)**:
- Hỗ trợ cả **Slash Commands (`/`)** và **Prefix Commands (`!`)**.
- Không phụ thuộc vào bất kỳ module Facebook / Mirai nào.
- Bộ nhớ nhẹ, khởi động tức thì, hoạt động ổn định.

---

## 📌 BƯỚC 1: Cấu hình Bot

File [config.json](file:///c:/Users/LeVanAn/Downloads/linux-master-20260924T020924Z-1-001/linux-master/config.json) đã được tinh giản:
```json
{
    "BOTNAME": "Annie🌷",
    "PREFIX": "!",
    "DISCORD": {
        "TOKEN": "YOUR_DISCORD_BOT_TOKEN_HERE",
        "CLIENT_ID": "YOUR_CLIENT_ID_HERE",
        "PREFIX": "!",
        "ADMINBOT": [],
        "NDH": []
    }
}
```
*(Nếu bạn muốn đổi Token hoặc thêm ID của bạn vào `ADMINBOT`, hãy chỉnh sửa trực tiếp trong file `config.json` hoặc tạo file `.env`)*.

---

## 📌 BƯỚC 2: Khởi chạy Bot

Mở Terminal tại thư mục này và gõ:
```bash
npm start
# hoặc
node index.js
```

Khi bot online thành công, bot sẽ tự động đăng ký toàn bộ **16 Slash Commands** lên máy chủ Discord và hiển thị bảng thông tin trạng thái.

---

## 👑 DANH SÁCH CÁC LỆNH ĐÃ ĐƯỢC CHỌN LỌC

### 1. Nhóm Quản trị & Hệ thống (Admin & System)
| Lệnh Prefix | Slash Command | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `!admin` | `/admin list` | NDH / Admin | Xem danh sách ADMIN BOT và NGƯỜI HỖ TRỢ |
| `!admin add @User` | `/admin add <user>` | Admin Bot | Thêm ADMIN BOT mới |
| `!admin remove @User` | `/admin remove <user>` | Admin Bot | Gỡ ADMIN BOT |
| `!admin addndh @User` | `/admin addndh <user>` | Admin Bot | Thêm Người hỗ trợ (NDH) |
| `!admin removendh @User`| `/admin removendh <user>` | Admin Bot | Gỡ Người hỗ trợ |
| `!admin only` | `/admin only` | Admin Bot | Bật/tắt chế độ chỉ Admin mới dùng được bot |
| `!admin qtvonly` | `/admin qtvonly` | Admin Bot | Bật/tắt chế độ chỉ QTV server dùng được bot |
| `!ban @User [lý do]` | `/ban <user> [lý do]` | QTV Server | Cấm thành viên khỏi máy chủ |
| `!kick @User [lý do]` | `/kick <user> [lý do]` | QTV Server | Đá thành viên ra khỏi máy chủ |
| `!clean <số lượng>` | `/clean <amount>` | QTV Server | Xóa tin nhắn hàng loạt trong kênh (1 - 100 tin) |
| `!setprefix <kí tự>` | `/setprefix <prefix>` | QTV Server | Đổi tiền tố lệnh riêng cho máy chủ này |
| `!welcome` / `!chaomung` | `/welcome` | QTV Server | Cấu hình kênh chào mừng thành viên mới & tự động chào hỏi |
| `!server` / `!sever` | `/server` | Admin Bot | Xem danh sách máy chủ bot tham gia & gửi lệnh out server từ xa |
| `!rs` hoặc `!restart` | `/rs` | Admin Bot | Khởi động lại Bot an toàn |
| `!rscm` / `!reload` | `/rscm` | Admin Bot | Chạy lại toàn bộ bộ lệnh & cập nhật Slash Commands tức thì |

### 2. Nhóm Tiện ích & Thông tin
| Lệnh Prefix | Slash Command | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `!ping` | `/ping` | Mọi người | Kiểm tra độ trễ mạng WebSocket và Roundtrip |
| `!uptime` hoặc `!upt` | `/uptime` | Mọi người | Xem thời gian hoạt động, RAM, CPU, OS, Node.js |
| `!info [@User]` | `/info [user]` | Mọi người | Xem thông tin chi tiết người dùng Discord |
| `!help` hoặc `!menu` | `/help [command]` | Mọi người | Bảng danh mục lệnh (Tự động thu hồi sau 6s) |
| `!unsend` (reply tin) | `/unsend` | Mọi người | Gỡ tin nhắn gần nhất của Bot |
| `!annie <nội dung>` | `/annie <message>` | Mọi người | Nhắn tin riêng (DM) trực tiếp cho Chủ Bot cần hỗ trợ |
| `!chao on` / `!chao off` | `/chao on` / `/chao off` | QTV Server | Bật/tắt tự động chào 4 mốc giờ: 7H (Sáng), 11H (Trưa), 18H (Tối), 22H (Đêm) |
| `!bot` / `!anh` | `/bot` | Mọi người (QTV on/off)| Bot Trợ lý AI (Groq): Trò chuyện thông minh khi gọi "bot", tự mở nhạc bài đầu tiên, dí dỏm |
| `!sing <bài hát>` / `!ytdl` | `/sing <song>` / `/ytdl` | Mọi người | Tự động tải và phát ngay bài hát đầu tiên lên Discord (không cần chọn tay, tự xóa cache) |

### 3. Nhóm Đa phương tiện & Video (Media)
| Lệnh Prefix | Slash Command | Mô tả |
| :--- | :--- | :--- |
| `!ytb <video>` | `/ytb <query>` | Tìm video YouTube (hỗ trợ tới 1 tiếng rưỡi), chọn 1-5 tải và gửi trực tiếp video MP4 |
| `!ff` | `/ff` | Gửi clip Free Fire TikTok ngẫu nhiên |
| `!gai` hoặc `!gái` | `/gai` | Gửi video gái xinh ngẫu nhiên |
| `!sad` | `/sad` | Gửi video tâm trạng / buồn ngẫu nhiên |
| `!trai` | `/trai` | Gửi video trai đẹp ngẫu nhiên |
| `!anime` | `/anime` | Gửi video Anime ngẫu nhiên |


---

## 🎉 HƯỚNG DẪN TÍNH NĂNG CHÀO MỪNG & TỰ ĐỘNG CHÀO HỎI

### 1. Chào mừng thành viên mới tham gia server
- **Cách hoạt động**: Khi có thành viên mới vào server (`GuildMemberAdd`), bot sẽ tự động tạo một Embed màu xanh ngọc cực đẹp gồm ảnh đại diện, tên người dùng, thứ tự thành viên `#thứ_tự`, ngày tạo tài khoản, ngày tham gia,... và gửi vào kênh chào mừng được cài đặt.
- **Lưu ý quan trọng**: Đảm bảo bạn đã bật **SERVER MEMBERS INTENT** trong [Discord Developer Portal](https://discord.com/developers/applications) > Chọn Bot của bạn > Mục **Bot** > Bật **Server Members Intent** và **Message Content Intent**.
- **Các lệnh quản lý (`!welcome` hoặc `/welcome`)**:
  - `!welcome` hoặc `/welcome status`: Xem kênh chào mừng hiện tại, trạng thái Bật/Tắt và lời chào tùy chỉnh.
  - `!welcome set #kênh` hoặc `/welcome set channel:#kênh`: Đặt kênh gửi tin nhắn chào mừng.
  - `!welcome on` / `!welcome off`: Bật hoặc tắt tính năng chào mừng thành viên mới.
  - `!welcome test`: Gửi thử tin nhắn chào mừng mẫu ngay lập tức để xem trước hiển thị.
  - `!welcome message <nội dung>`: Tùy chỉnh lời chào mừng (hỗ trợ biến `{user}`, `{username}`, `{server}`, `{memberCount}`).
    - Gõ `!welcome message default` để đặt lại lời chào mặc định.

### 2. Tự động chào lại khi thành viên nhắn "hi", "chào", "hello",...
- **Cách hoạt động**: Khi bất kỳ thành viên nào nhắn tin chào hỏi thông dụng (như `hi`, `hello`, `chào`, `xin chào`, `chào bot`, `chào cả nhà`, `chào mn`, `alo bot`, `good morning`,...):
  - Bot sẽ tự động trả lời (reply) trực tiếp kèm tag người đó với các lời chúc ngọt ngào, tràn đầy năng lượng và ngẫu nhiên.
  - Tích hợp sẵn cơ chế **Cooldown chống spam** (8 giây/người) để tránh làm trôi tin nhắn trong kênh.
  - Không kích hoạt nhầm khi người dùng gõ lệnh bot (`!chao`, `/help`,...) hay những câu trò chuyện thông thường chứa từ giống nhau.
- **Bật / Tắt**:
  - `!welcome autogreet on` / `!welcome autogreet off`
  - Hoặc dùng Slash: `/welcome autogreet status:Bật tự động chào / Tắt tự động chào`.

### 3. Tự động gửi lời chào theo 4 khung giờ: 7H (Sáng) - 11H (Trưa) - 18H (Tối) - 22H (Đêm)
- **Cách hoạt động**: Bot tự động canh theo giờ Việt Nam (UTC+7) và gửi lời chúc phù hợp vào kênh chào mừng của từng server:
  - 🌅 **07:00 (Sáng)**: Chúc ngày mới tràn đầy năng lượng, làm việc/học tập hiệu quả, nhắc nhở ăn sáng.
  - ☀️ **11:00 (Trưa)**: Chúc bữa trưa ngon miệng, nghỉ ngơi sau buổi sáng bận rộn.
  - 🌇 **18:00 (Tối)**: Chào buổi tối ấm áp, thư giãn và quây quần bên gia đình.
  - 🌙 **22:00 (Đêm)**: Nhắc nhở nghỉ ngơi, chúc toàn thể máy chủ ngủ ngon và có giấc mơ đẹp.
- **Bật / Tắt**:
  - Bật / tắt bằng lệnh `chao`: `!chao on` / `!chao off` hoặc `/chao on` / `/chao off`
  - Hoặc tích hợp trong lệnh `welcome`: `!welcome chao on` / `!welcome chao off` (hoặc `/welcome chao status:...`)
  - Gửi thử nghiệm ngay: `!chao test 7` (sáng), `!chao test 11` (trưa), `!chao test 18` (tối), `!chao test 22` (đêm).

### 4. Quản lý danh sách máy chủ & Lệnh Out Server (`!server` / `/server`) - Quyền Admin Bot
- **Xem danh sách server bot tham gia**: `!server list` hoặc `/server list` (hiển thị STT, Tên, ID, Số lượng thành viên, Chủ sở hữu).
- **Lệnh out server từ xa**:
  - Gõ: `!server out <stt>` (Ví dụ: `!server out 2` để out server số 2).
  - Hoặc gõ: `!server out <id_server>` (Ví dụ: `!server out 123456789012345678`).
  - Dùng Slash: `/server out target:<stt_hoặc_id>`.

### 5. Lệnh liên hệ hỗ trợ trực tiếp tới Chủ Bot (`!annie` / `/annie`)
- Người dùng gõ: `!annie <nội dung cần hỗ trợ>` hoặc `/annie message:<nội dung>`.
- Bot sẽ tự động chuyển tiếp toàn bộ thông tin người gửi, máy chủ, kênh chat và nội dung vào **tin nhắn riêng (DM)** của tất cả các **ADMIN BOT** đã cấu hình.
- Admin có thể đọc và nhắn tin riêng hỗ trợ trực tiếp người dùng.

### 6. Menu trợ giúp tự động thu hồi sau 6s (`!help` / `!menu`)
- Khi người dùng gõ `!help`, `!menu` hoặc `/help`, bot sẽ gửi bảng menu lệnh và **tự động xóa (thu hồi)** tin nhắn sau đúng 6 giây để giữ cho kênh chat luôn gọn gàng, sạch sẽ.

### 7. Bé Ánh AI (Groq Llama/Qwen) - Cô bé AI cute, sến súa & đanh đá
- **Tính cách**:
  - Cực kỳ dễ thương, mong manh, sến súa, hay dỗi hờn vu vơ và nhõng nhẽo.
  - Trả lời ngắn gọn (1 - 3 câu), tự nhiên, mượt mà giống người thật đang chat.
  - **ĐẶC BIỆT**: Nếu ai chửi bới, xúc phạm, toxic hay nói bậy với Ánh thì Ánh sẽ **đanh đá chửi lại xéo xắt cực gắt**, không kiêng nể!
- **Cách kích hoạt trò chuyện**:
  - Nhắn tin có chứa từ `Ánh` hoặc `ánh` (ví dụ: `Ánh ơi`, `chào bé Ánh`, `Ánh ăn cơm chưa`,...).
  - Hoặc **Reply (trả lời)** bất kỳ tin nhắn nào của Bot trong kênh chat.
  - Hoặc tag bot: `@Bot em có người yêu chưa?`
  - Hoặc gõ lệnh chat trực tiếp: `!anh <nội dung>` hoặc `/anh chat message:<nội dung>`.
- **Bật / Tắt theo máy chủ (QTV Server)**:
  - `!anh on` / `!anh off` (hoặc `/anh on` / `/anh off`).
  - `!anh status`: Xem trạng thái hoạt động hiện tại của Bé Ánh.

### 8. Lệnh Khởi động lại Bot (`!rs` / `/rs`) - Quyền Admin Bot
- Cú pháp: `!rs` hoặc `!restart` (hoặc `/rs`).
- Tác dụng: Khởi động lại toàn bộ tiến trình Bot Discord an toàn.

### 9. Lệnh Chạy lại Bộ Lệnh (`!rscm` / `/rscm`) - Quyền Admin Bot
- Cú pháp: `!rscm` hoặc `!reload` (hoặc `/rscm`).
- Tác dụng: Quét và nạp lại toàn bộ code mới trong thư mục `src/commands` mà **không cần phải tắt hay khởi động lại bot**, đồng thời tự động đồng bộ lại Slash Commands lên Discord API.

### 10. Lệnh Nghe Nhạc (`!sing` / `/sing`) - Gửi File Âm Thanh Trực Tiếp
- **Cách hoạt động**:
  - Gõ `!sing <tên bài>` hoặc `/sing song:<tên bài>`.
  - Bot tìm kiếm và hiển thị danh sách **5 bài hát đầu tiên** kèm thời lượng, kênh và 5 nút bấm `1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣`.
  - Bạn chỉ cần bấm nút (hoặc gõ số `1 - 5`), bot sẽ tự động tải file âm thanh `.m4a` và **gửi đính kèm trực tiếp vào Discord** (phát nghe trực tiếp với thanh sóng âm và tiến trình).
  - Gửi xong bot tự động **format xóa sạch file tạm trong ổ đĩa** để không tốn dung lượng máy chủ.

### 11. Lệnh Xem Video YouTube (`!ytb` / `/ytb`) - Gửi File Video MP4 Trực Tiếp
- **Cách hoạt động**:
  - Gõ `!ytb <tên video>` hoặc `/ytb query:<tên video>`.
  - Bot tìm kiếm và hiển thị danh sách **5 video đầu tiên** kèm thời lượng, kênh và 5 nút bấm `1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣`.
  - Bạn chỉ cần bấm nút (hoặc gõ số `1 - 5`), bot sẽ tự động tải file video `.mp4` và **gửi đính kèm trực tiếp vào Discord** (xem video player ngay trên chat).
  - Gửi xong bot tự động **format xóa sạch file tạm trong ổ đĩa** để bảo vệ bộ nhớ.

---




## 📁 Cấu trúc thư mục mới:
```
linux-master/
├── config.json          # Cấu hình Discord & Admin
├── index.js             # Bộ xử lý chính Discord.js v14
├── package.json         # Danh sách 6 thư viện tối giản
├── data/
│   ├── media/           # 5 tệp JSON video: ff, gai, sad, trai, anime
│   └── settings.json    # Cài đặt server & phân quyền
├── src/
│   ├── commands/
│   │   ├── admin/       # admin, ban, kick, clean, setprefix
│   │   ├── general/     # ping, info, uptime, help, restart, unsend
│   │   └── media/       # ff, gai, sad, trai, anime
│   └── utils/
│       └── settings.js  # Helper quản lý prefix & quyền
└── utils/
    └── log.js           # Logger màu gradient đẹp mắt
```
