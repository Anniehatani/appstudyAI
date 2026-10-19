import os

tables = [
    # ----------------------------------------------------
    # ZONE 1: COURSEWARE HIERARCHY (Top Left)
    # ----------------------------------------------------
    {
        "name": "subjects",
        "domain": "courseware",
        "title": "MÔN HỌC (SUBJECTS)",
        "desc": "Danh mục 10+ môn học đại học chính khóa",
        "x": 60, "y": 140, "w": 280,
        "fields": [
            {"name": "id", "type": "INTEGER", "key": "PK", "desc": "Mã ID môn học"},
            {"name": "code", "type": "VARCHAR(50)", "key": "UQ", "desc": "Mã định danh (GENE1007...)"},
            {"name": "subject_name", "type": "VARCHAR(255)", "key": "", "desc": "Tên môn học chuẩn"},
            {"name": "description", "type": "TEXT", "key": "", "desc": "Mô tả đề cương chi tiết"},
            {"name": "credits", "type": "INTEGER", "key": "", "desc": "Số tín chỉ (2 - 4 TC)"},
            {"name": "icon_url", "type": "VARCHAR(500)", "key": "", "desc": "Đường dẫn biểu tượng"},
            {"name": "created_at", "type": "DATETIME", "key": "", "desc": "Thời điểm khởi tạo"}
        ]
    },
    {
        "name": "units",
        "domain": "courseware",
        "title": "CHƯƠNG HỌC (UNITS)",
        "desc": "106 Cửa ải tương ứng từng chương",
        "x": 380, "y": 140, "w": 270,
        "fields": [
            {"name": "id", "type": "INTEGER", "key": "PK", "desc": "Mã ID cửa ải / chương"},
            {"name": "subject_id", "type": "INTEGER", "key": "FK", "desc": "Liên kết subjects.id"},
            {"name": "title", "type": "VARCHAR(255)", "key": "", "desc": "Tên ải (Ải 1, Ải 2...)"},
            {"name": "order_index", "type": "INTEGER", "key": "", "desc": "Thứ tự sắp xếp chương"}
        ]
    },
    {
        "name": "lessons",
        "domain": "courseware",
        "title": "BÀI HỌC / SLIDE (LESSONS)",
        "desc": "4.094 trang bài học slide tương tác",
        "x": 690, "y": 140, "w": 280,
        "fields": [
            {"name": "id", "type": "INTEGER", "key": "PK", "desc": "Mã ID bài giảng"},
            {"name": "unit_id", "type": "INTEGER", "key": "FK", "desc": "Liên kết units.id"},
            {"name": "title", "type": "VARCHAR(255)", "key": "", "desc": "Tiêu đề trang bài học"},
            {"name": "order_index", "type": "INTEGER", "key": "", "desc": "Thứ tự trang slide"},
            {"name": "xp_reward", "type": "INTEGER", "key": "", "desc": "Thưởng kinh nghiệm (10 XP)"},
            {"name": "content", "type": "TEXT", "key": "", "desc": "Nội dung giải thích chi tiết"},
            {"name": "video_url", "type": "VARCHAR(500)", "key": "", "desc": "Video bài giảng kèm theo"}
        ]
    },
    {
        "name": "questions",
        "domain": "courseware",
        "title": "CÂU HỎI (QUESTIONS)",
        "desc": "29.460 câu trắc nghiệm tương tác thật",
        "x": 1010, "y": 140, "w": 290,
        "fields": [
            {"name": "id", "type": "INTEGER", "key": "PK", "desc": "Mã ID câu hỏi trắc nghiệm"},
            {"name": "lesson_id", "type": "INTEGER", "key": "FK", "desc": "Liên kết lessons.id"},
            {"name": "question_type", "type": "VARCHAR(50)", "key": "", "desc": "Loại: multiple_choice"},
            {"name": "question_text", "type": "TEXT", "key": "", "desc": "Nội dung đề bài câu hỏi"},
            {"name": "options", "type": "JSON", "key": "", "desc": "Mảng 4 đáp án [A, B, C, D]"},
            {"name": "correct_answer", "type": "VARCHAR(10)", "key": "", "desc": "Đáp án chuẩn xác"},
            {"name": "explanation", "type": "TEXT", "key": "", "desc": "Lời giải sư phạm chi tiết"}
        ]
    },

    # ----------------------------------------------------
    # ZONE 2: ASSESSMENTS & EXAMS (Mid-Left)
    # ----------------------------------------------------
    {
        "name": "exams",
        "domain": "assessments",
        "title": "BÀI THI & ĐÁNH GIÁ (EXAMS)",
        "desc": "Đề thi giữa kỳ, cuối kỳ các môn",
        "x": 380, "y": 420, "w": 270,
        "fields": [
            {"name": "id", "type": "INTEGER", "key": "PK", "desc": "Mã ID đề thi"},
            {"name": "subject_id", "type": "INTEGER", "key": "FK", "desc": "Liên kết subjects.id"},
            {"name": "title", "type": "VARCHAR(255)", "key": "", "desc": "Tên bài thi kiểm tra"},
            {"name": "description", "type": "TEXT", "key": "", "desc": "Mục tiêu & quy chế thi"},
            {"name": "duration_minutes", "type": "INTEGER", "key": "", "desc": "Thời gian làm bài (phút)"},
            {"name": "pass_score", "type": "INTEGER", "key": "", "desc": "Điểm chuẩn đạt yêu cầu"},
            {"name": "total_questions", "type": "INTEGER", "key": "", "desc": "Tổng số câu trong đề"},
            {"name": "created_at", "type": "DATETIME", "key": "", "desc": "Ngày khởi tạo đề thi"}
        ]
    },
    {
        "name": "user_exam_attempts",
        "domain": "assessments",
        "title": "LỊCH SỬ THI THỬ (EXAM LOGS)",
        "desc": "Kết quả các lượt làm bài của sinh viên",
        "x": 690, "y": 420, "w": 280,
        "fields": [
            {"name": "id", "type": "INTEGER", "key": "PK", "desc": "Mã lượt thi"},
            {"name": "user_id", "type": "VARCHAR(64)", "key": "FK", "desc": "Liên kết accounts.user_id"},
            {"name": "exam_id", "type": "INTEGER", "key": "FK", "desc": "Liên kết exams.id"},
            {"name": "score", "type": "INTEGER", "key": "", "desc": "Điểm số đạt được"},
            {"name": "duration_taken", "type": "INTEGER", "key": "", "desc": "Thời gian hoàn thành (giây)"},
            {"name": "is_passed", "type": "BOOLEAN", "key": "", "desc": "Đạt / Không đạt"},
            {"name": "completed_at", "type": "DATETIME", "key": "", "desc": "Thời điểm nộp bài"}
        ]
    },

    # ----------------------------------------------------
    # ZONE 3: IDENTITY & PROFILES (Top Center / Right)
    # ----------------------------------------------------
    {
        "name": "accounts",
        "domain": "identity",
        "title": "TÀI KHOẢN (ACCOUNTS)",
        "desc": "Định danh sinh viên & Bảo mật",
        "x": 1370, "y": 140, "w": 290,
        "fields": [
            {"name": "id", "type": "VARCHAR(64)", "key": "PK", "desc": "Khóa chính UUID tài khoản"},
            {"name": "user_id", "type": "VARCHAR(64)", "key": "UQ", "desc": "Mã sinh viên / Username định danh"},
            {"name": "username", "type": "VARCHAR(100)", "key": "", "desc": "Tên đăng nhập hệ thống"},
            {"name": "service_name", "type": "VARCHAR(50)", "key": "", "desc": "Dịch vụ xác thực (Lumi/CMCU)"},
            {"name": "encrypted_password", "type": "TEXT", "key": "", "desc": "Mật khẩu mã hóa bảo mật"},
            {"name": "created_at", "type": "DATETIME", "key": "", "desc": "Ngày tạo tài khoản"}
        ]
    },
    {
        "name": "profiles",
        "domain": "identity",
        "title": "HỒ SƠ HỌC VIÊN (PROFILES)",
        "desc": "Thông tin sinh viên Đại học CMC",
        "x": 1720, "y": 140, "w": 290,
        "fields": [
            {"name": "id", "type": "VARCHAR(64)", "key": "PK", "desc": "Mã ID hồ sơ cá nhân"},
            {"name": "user_id", "type": "VARCHAR(64)", "key": "FK", "desc": "Liên kết accounts.user_id (1:1)"},
            {"name": "full_name", "type": "VARCHAR(100)", "key": "", "desc": "Họ và tên đầy đủ sinh viên"},
            {"name": "avatar_url", "type": "VARCHAR(500)", "key": "", "desc": "URL ảnh đại diện R2"},
            {"name": "bio", "type": "TEXT", "key": "", "desc": "Tiểu sử / Châm ngôn học tập"},
            {"name": "cover_url", "type": "VARCHAR(500)", "key": "", "desc": "Ảnh bìa trang cá nhân"},
            {"name": "school", "type": "VARCHAR(150)", "key": "", "desc": "Trường: Đại học CMC"},
            {"name": "major", "type": "VARCHAR(150)", "key": "", "desc": "Chuyên ngành (Trí tuệ nhân tạo...)"},
            {"name": "created_at", "type": "DATETIME", "key": "", "desc": "Ngày gia nhập nền tảng"}
        ]
    },
    {
        "name": "user_stats",
        "domain": "identity",
        "title": "CHỈ SỐ GAMIFICATION (STATS)",
        "desc": "Bộ tứ chỉ số cốt lõi phong cách Duolingo",
        "x": 2070, "y": 140, "w": 280,
        "fields": [
            {"name": "user_id", "type": "VARCHAR(64)", "key": "PK", "desc": "Khóa chính & FK -> accounts.user_id"},
            {"name": "total_xp", "type": "INTEGER", "key": "", "desc": "Tổng điểm kinh nghiệm tích lũy"},
            {"name": "current_streak", "type": "INTEGER", "key": "", "desc": "Chuỗi ngày học liên tục"},
            {"name": "longest_streak", "type": "INTEGER", "key": "", "desc": "Kỷ lục chuỗi streak dài nhất"},
            {"name": "hearts", "type": "INTEGER", "key": "", "desc": "Số trái tim/mạng sống (Mặc định 5)"},
            {"name": "gems", "type": "INTEGER", "key": "", "desc": "Số đá quý dùng mua vật phẩm"},
            {"name": "last_active_date", "type": "DATE", "key": "", "desc": "Ngày học tập gần nhất (UTC+7)"}
        ]
    },

    # ----------------------------------------------------
    # ZONE 4: LEARNING PROGRESS & REVIEWS (Center)
    # ----------------------------------------------------
    {
        "name": "user_progress",
        "domain": "gamification",
        "title": "TIẾN ĐỘ BÀI HỌC (PROGRESS)",
        "desc": "Trạng thái vượt ải của sinh viên",
        "x": 1010, "y": 420, "w": 290,
        "fields": [
            {"name": "id", "type": "INTEGER", "key": "PK", "desc": "Mã ID tiến độ"},
            {"name": "user_id", "type": "VARCHAR(64)", "key": "FK", "desc": "Liên kết accounts.user_id"},
            {"name": "lesson_id", "type": "INTEGER", "key": "FK", "desc": "Liên kết lessons.id"},
            {"name": "status", "type": "VARCHAR(50)", "key": "", "desc": "unlocked / completed"},
            {"name": "score", "type": "INTEGER", "key": "", "desc": "Điểm số đạt được"},
            {"name": "completed_at", "type": "DATETIME", "key": "", "desc": "Thời điểm hoàn thành ải"}
        ]
    },
    {
        "name": "user_mistakes",
        "domain": "gamification",
        "title": "KHO ÔN CÂU SAI (MISTAKES)",
        "desc": "Hệ thống truy vết câu hỏi làm sai",
        "x": 1370, "y": 420, "w": 290,
        "fields": [
            {"name": "id", "type": "INTEGER", "key": "PK", "desc": "Mã ghi nhận lỗi sai"},
            {"name": "user_id", "type": "VARCHAR(64)", "key": "FK", "desc": "Liên kết accounts.user_id"},
            {"name": "question_id", "type": "INTEGER", "key": "FK", "desc": "Liên kết questions.id"},
            {"name": "wrong_count", "type": "INTEGER", "key": "", "desc": "Số lần làm sai câu này"},
            {"name": "last_wrong_at", "type": "DATETIME", "key": "", "desc": "Lần sai gần nhất"},
            {"name": "is_mastered", "type": "BOOLEAN", "key": "", "desc": "Đã thuần thục (làm đúng lại)"}
        ]
    },
    {
        "name": "user_streak_history",
        "domain": "gamification",
        "title": "NHẬT KÝ ĐIỂM DANH (STREAK)",
        "desc": "Lịch sử duy trì ngọn lửa học tập",
        "x": 2070, "y": 420, "w": 280,
        "fields": [
            {"name": "id", "type": "INTEGER", "key": "PK", "desc": "Mã lượt ghi nhận"},
            {"name": "user_id", "type": "VARCHAR(64)", "key": "FK", "desc": "Liên kết accounts.user_id"},
            {"name": "activity_date", "type": "DATE", "key": "", "desc": "Ngày điểm danh học tập"},
            {"name": "status", "type": "VARCHAR(50)", "key": "", "desc": "completed / freeze_used / missed"}
        ]
    },
    {
        "name": "weekly_leaderboards",
        "domain": "gamification",
        "title": "BẢNG XẾP HẠNG (LEADERBOARDS)",
        "desc": "Giải đấu tuần: Đồng, Bạc, Vàng, Kim Cương",
        "x": 1720, "y": 440, "w": 290,
        "fields": [
            {"name": "id", "type": "INTEGER", "key": "PK", "desc": "Mã xếp hạng"},
            {"name": "user_id", "type": "VARCHAR(64)", "key": "FK", "desc": "Liên kết accounts.user_id"},
            {"name": "league_name", "type": "VARCHAR(50)", "key": "", "desc": "Hạng giải: Bronze/Silver/Gold"},
            {"name": "weekly_xp", "type": "INTEGER", "key": "", "desc": "Điểm XP kiếm được trong tuần"},
            {"name": "week_start_date", "type": "DATE", "key": "", "desc": "Ngày bắt đầu tuần thi đua"}
        ]
    },

    # ----------------------------------------------------
    # ZONE 5: SHOP & ACHIEVEMENTS (Bottom Right)
    # ----------------------------------------------------
    {
        "name": "shop_items",
        "domain": "gamification",
        "title": "CỬA HÀNG VẬT PHẨM (SHOP)",
        "desc": "Danh mục trang bị & Phép bổ trợ",
        "x": 1370, "y": 680, "w": 290,
        "fields": [
            {"name": "id", "type": "INTEGER", "key": "PK", "desc": "Mã ID vật phẩm"},
            {"name": "item_code", "type": "VARCHAR(50)", "key": "UQ", "desc": "Mã code: streak_freeze, refill..."},
            {"name": "name", "type": "VARCHAR(100)", "key": "", "desc": "Tên vật phẩm hiển thị"},
            {"name": "description", "type": "TEXT", "key": "", "desc": "Công dụng hỗ trợ học tập"},
            {"name": "price_gems", "type": "INTEGER", "key": "", "desc": "Giá bán bằng Đá quý (Gems)"}
        ]
    },
    {
        "name": "user_inventory",
        "domain": "gamification",
        "title": "TÚI ĐỒ HỌC VIÊN (INVENTORY)",
        "desc": "Kho đồ đạc sở hữu của sinh viên",
        "x": 1720, "y": 680, "w": 290,
        "fields": [
            {"name": "id", "type": "INTEGER", "key": "PK", "desc": "Mã bản ghi sở hữu"},
            {"name": "user_id", "type": "VARCHAR(64)", "key": "FK", "desc": "Liên kết accounts.user_id"},
            {"name": "item_code", "type": "VARCHAR(50)", "key": "FK", "desc": "Liên kết shop_items.item_code"},
            {"name": "quantity", "type": "INTEGER", "key": "", "desc": "Số lượng đang sở hữu"}
        ]
    },
    {
        "name": "achievements",
        "domain": "gamification",
        "title": "TỦ HUY HIỆU (ACHIEVEMENTS)",
        "desc": "Danh mục danh hiệu & Mốc thưởng",
        "x": 1370, "y": 920, "w": 290,
        "fields": [
            {"name": "id", "type": "INTEGER", "key": "PK", "desc": "Mã danh hiệu"},
            {"name": "title", "type": "VARCHAR(100)", "key": "", "desc": "Tên huy hiệu (Chiến thần Streak...)"},
            {"name": "description", "type": "TEXT", "key": "", "desc": "Điều kiện hoàn thành"},
            {"name": "badge_icon_url", "type": "VARCHAR(500)", "key": "", "desc": "Icon huy hiệu vàng R2"},
            {"name": "required_value", "type": "INTEGER", "key": "", "desc": "Giá trị mốc cần đạt"}
        ]
    },
    {
        "name": "user_achievements",
        "domain": "gamification",
        "title": "HUY HIỆU ĐÃ ĐẠT (BADGES)",
        "desc": "Vinh danh thành tích học viên",
        "x": 1720, "y": 920, "w": 290,
        "fields": [
            {"name": "id", "type": "INTEGER", "key": "PK", "desc": "Mã ghi nhận danh hiệu"},
            {"name": "user_id", "type": "VARCHAR(64)", "key": "FK", "desc": "Liên kết accounts.user_id"},
            {"name": "achievement_id", "type": "INTEGER", "key": "FK", "desc": "Liên kết achievements.id"},
            {"name": "unlocked_at", "type": "DATETIME", "key": "", "desc": "Thời điểm mở khóa"}
        ]
    },

    # ----------------------------------------------------
    # ZONE 6: AI KNOWLEDGE & NOTES (Bottom Left)
    # ----------------------------------------------------
    {
        "name": "user_notes",
        "domain": "ai_assistant",
        "title": "CẨM NANG GHI CHÚ (NOTES)",
        "desc": "Sổ tay tóm tắt lý thuyết tích hợp trong ải",
        "x": 1010, "y": 700, "w": 290,
        "fields": [
            {"name": "id", "type": "INTEGER", "key": "PK", "desc": "Mã ghi chú cá nhân"},
            {"name": "user_id", "type": "VARCHAR(64)", "key": "FK", "desc": "Liên kết accounts.user_id"},
            {"name": "subject_id", "type": "INTEGER", "key": "FK", "desc": "Liên kết subjects.id"},
            {"name": "lesson_id", "type": "INTEGER", "key": "FK", "desc": "Liên kết lessons.id"},
            {"name": "title", "type": "VARCHAR(255)", "key": "", "desc": "Tiêu đề cẩm nang ghi chép"},
            {"name": "content", "type": "TEXT", "key": "", "desc": "Nội dung tóm tắt & sơ đồ tư duy"},
            {"name": "created_at", "type": "DATETIME", "key": "", "desc": "Ngày khởi tạo ghi chú"},
            {"name": "updated_at", "type": "DATETIME", "key": "", "desc": "Lần cập nhật gần nhất"}
        ]
    },
    {
        "name": "subject_data",
        "domain": "ai_assistant",
        "title": "DỮ LIỆU THUẦN (PLAIN TEXT)",
        "desc": "10.7M ký tự văn bản giáo trình phục vụ AI",
        "x": 60, "y": 720, "w": 280,
        "fields": [
            {"name": "id", "type": "VARCHAR(64)", "key": "PK", "desc": "Mã bản ghi văn bản"},
            {"name": "user_id", "type": "VARCHAR(64)", "key": "FK", "desc": "Liên kết accounts.user_id"},
            {"name": "subject_name", "type": "VARCHAR(255)", "key": "", "desc": "Tên môn học thuần"},
            {"name": "content", "type": "MEDIUMTEXT", "key": "", "desc": "Văn bản thuần FTS / Embeddings"},
            {"name": "created_at", "type": "DATETIME", "key": "", "desc": "Thời điểm đồng bộ"}
        ]
    },
    {
        "name": "ai_conversations",
        "domain": "ai_assistant",
        "title": "PHIÊN HỎI 3TG AI (SESSIONS)",
        "desc": "Phiên hỏi đáp trợ giảng AI bảo mật",
        "x": 380, "y": 720, "w": 270,
        "fields": [
            {"name": "id", "type": "VARCHAR(64)", "key": "PK", "desc": "Mã ID phiên hội thoại"},
            {"name": "user_id", "type": "VARCHAR(64)", "key": "FK", "desc": "Liên kết accounts.user_id"},
            {"name": "title", "type": "VARCHAR(255)", "key": "", "desc": "Tiêu đề chủ đề thảo luận"},
            {"name": "created_at", "type": "DATETIME", "key": "", "desc": "Thời điểm bắt đầu phiên"},
            {"name": "updated_at", "type": "DATETIME", "key": "", "desc": "Cập nhật tin nhắn mới nhất"}
        ]
    },
    {
        "name": "ai_messages",
        "domain": "ai_assistant",
        "title": "TIN NHẮN TRỢ GIẢNG (MESSAGES)",
        "desc": "Chi tiết từng bước giải & công thức toán",
        "x": 690, "y": 720, "w": 280,
        "fields": [
            {"name": "id", "type": "INTEGER", "key": "PK", "desc": "Mã tin nhắn"},
            {"name": "conversation_id", "type": "VARCHAR(64)", "key": "FK", "desc": "Liên kết ai_conversations.id"},
            {"name": "sender", "type": "VARCHAR(50)", "key": "", "desc": "user / assistant / system"},
            {"name": "content", "type": "TEXT", "key": "", "desc": "Lời giải chi tiết từng bước & LaTeX"},
            {"name": "created_at", "type": "DATETIME", "key": "", "desc": "Thời điểm gửi tin"}
        ]
    }
]

print("Updated 21 tables in refined layout.")
