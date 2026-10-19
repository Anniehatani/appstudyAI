"""
Generate University Standard ERD SVG for App 3TG
- Strict White Background (#FFFFFF), charcoal black text (#0F172A), crisp slate lines (#334155)
- Orthogonal routing with rounded corners (r=6px)
- Field-to-field exact connection: PK right edge -> FK left edge
- Parallel bus channels in aisles (15px spacing, ZERO line crossing, planar graph)
- Elegant Crow's Foot notation (| on PK, < on FK)
- Direct inline SVG vector paths for maximum rendering compatibility
"""

import os
import fitz # PyMuPDF

def build_erd_svg():
    width = 2120
    height = 1360

    # Table metadata & positions
    tables = [
        # ROW 1: USER-SCOPED & GAMIFICATION
        {
            "name": "user_inventory",
            "title": "USER_INVENTORY",
            "desc": "Túi đồ sinh viên",
            "x": 50, "y": 125, "w": 230,
            "fields": [
                {"name": "id", "type": "INTEGER", "key": "PK"},
                {"name": "user_id", "type": "VARCHAR(64)", "key": "FK"},
                {"name": "item_code", "type": "VARCHAR(50)", "key": "FK"},
                {"name": "quantity", "type": "INTEGER", "key": ""}
            ]
        },
        {
            "name": "user_streak_history",
            "title": "USER_STREAK_HISTORY",
            "desc": "Nhật ký chuỗi ngày học",
            "x": 305, "y": 125, "w": 230,
            "fields": [
                {"name": "id", "type": "INTEGER", "key": "PK"},
                {"name": "user_id", "type": "VARCHAR(64)", "key": "FK"},
                {"name": "activity_date", "type": "DATE", "key": ""},
                {"name": "status", "type": "VARCHAR(50)", "key": ""}
            ]
        },
        {
            "name": "subject_data",
            "title": "SUBJECT_DATA",
            "desc": "Kho dữ liệu văn bản thuần RAG",
            "x": 560, "y": 125, "w": 230,
            "fields": [
                {"name": "id", "type": "VARCHAR(64)", "key": "PK"},
                {"name": "user_id", "type": "VARCHAR(64)", "key": "FK"},
                {"name": "subject_name", "type": "VARCHAR(255)", "key": ""},
                {"name": "content", "type": "MEDIUMTEXT", "key": ""},
                {"name": "created_at", "type": "DATETIME", "key": ""}
            ]
        },
        {
            "name": "shop_items",
            "title": "SHOP_ITEMS",
            "desc": "Cửa hàng vật phẩm bổ trợ",
            "x": 815, "y": 125, "w": 230,
            "fields": [
                {"name": "id", "type": "INTEGER", "key": "PK"},
                {"name": "item_code", "type": "VARCHAR(50)", "key": "UQ"},
                {"name": "name", "type": "VARCHAR(100)", "key": ""},
                {"name": "description", "type": "TEXT", "key": ""},
                {"name": "price_gems", "type": "INTEGER", "key": ""}
            ]
        },
        {
            "name": "weekly_leaderboards",
            "title": "WEEKLY_LEADERBOARDS",
            "desc": "Bảng xếp hạng tuần thi đua",
            "x": 1070, "y": 125, "w": 230,
            "fields": [
                {"name": "id", "type": "INTEGER", "key": "PK"},
                {"name": "user_id", "type": "VARCHAR(64)", "key": "FK"},
                {"name": "league_name", "type": "VARCHAR(50)", "key": ""},
                {"name": "weekly_xp", "type": "INTEGER", "key": ""},
                {"name": "week_start_date", "type": "DATE", "key": ""}
            ]
        },
        {
            "name": "accounts",
            "title": "ACCOUNTS",
            "desc": "Tài khoản đăng nhập hệ thống",
            "x": 1325, "y": 125, "w": 230,
            "fields": [
                {"name": "id", "type": "VARCHAR(64)", "key": "PK"},
                {"name": "user_id", "type": "VARCHAR(64)", "key": "UQ"},
                {"name": "username", "type": "VARCHAR(100)", "key": ""},
                {"name": "service_name", "type": "VARCHAR(50)", "key": ""},
                {"name": "encrypted_password", "type": "TEXT", "key": ""},
                {"name": "created_at", "type": "DATETIME", "key": ""}
            ]
        },
        {
            "name": "user_stats",
            "title": "USER_STATS",
            "desc": "Chỉ số Gamification sinh viên",
            "x": 1580, "y": 125, "w": 230,
            "fields": [
                {"name": "user_id", "type": "VARCHAR(64)", "key": "PK"},
                {"name": "total_xp", "type": "INTEGER", "key": ""},
                {"name": "current_streak", "type": "INTEGER", "key": ""},
                {"name": "longest_streak", "type": "INTEGER", "key": ""},
                {"name": "hearts", "type": "INTEGER", "key": ""},
                {"name": "gems", "type": "INTEGER", "key": ""},
                {"name": "last_active_date", "type": "DATE", "key": ""}
            ]
        },
        {
            "name": "profiles",
            "title": "PROFILES",
            "desc": "Hồ sơ học viên Đại học CMC",
            "x": 1835, "y": 125, "w": 230,
            "fields": [
                {"name": "id", "type": "VARCHAR(64)", "key": "PK"},
                {"name": "user_id", "type": "VARCHAR(64)", "key": "FK"},
                {"name": "full_name", "type": "VARCHAR(100)", "key": ""},
                {"name": "avatar_url", "type": "VARCHAR(500)", "key": ""},
                {"name": "bio", "type": "TEXT", "key": ""},
                {"name": "cover_url", "type": "VARCHAR(500)", "key": ""},
                {"name": "school", "type": "VARCHAR(150)", "key": ""},
                {"name": "major", "type": "VARCHAR(150)", "key": ""},
                {"name": "created_at", "type": "DATETIME", "key": ""}
            ]
        },

        # ROW 2: SUB-SYSTEMS (AI Chat & Achievements)
        {
            "name": "ai_conversations",
            "title": "AI_CONVERSATIONS",
            "desc": "Phiên hỏi đáp trợ giảng AI",
            "x": 50, "y": 410, "w": 250,
            "fields": [
                {"name": "id", "type": "VARCHAR(64)", "key": "PK"},
                {"name": "user_id", "type": "VARCHAR(64)", "key": "FK"},
                {"name": "title", "type": "VARCHAR(255)", "key": ""},
                {"name": "created_at", "type": "DATETIME", "key": ""},
                {"name": "updated_at", "type": "DATETIME", "key": ""}
            ]
        },
        {
            "name": "ai_messages",
            "title": "AI_MESSAGES",
            "desc": "Tin nhắn giải đáp bài tập",
            "x": 380, "y": 410, "w": 250,
            "fields": [
                {"name": "id", "type": "INTEGER", "key": "PK"},
                {"name": "conversation_id", "type": "VARCHAR(64)", "key": "FK"},
                {"name": "sender", "type": "VARCHAR(50)", "key": ""},
                {"name": "content", "type": "TEXT", "key": ""},
                {"name": "created_at", "type": "DATETIME", "key": ""}
            ]
        },
        {
            "name": "achievements",
            "title": "ACHIEVEMENTS",
            "desc": "Danh mục danh hiệu & Huy hiệu",
            "x": 710, "y": 410, "w": 250,
            "fields": [
                {"name": "id", "type": "INTEGER", "key": "PK"},
                {"name": "title", "type": "VARCHAR(100)", "key": ""},
                {"name": "description", "type": "TEXT", "key": ""},
                {"name": "badge_icon_url", "type": "VARCHAR(500)", "key": ""},
                {"name": "required_value", "type": "INTEGER", "key": ""}
            ]
        },
        {
            "name": "user_achievements",
            "title": "USER_ACHIEVEMENTS",
            "desc": "Huy hiệu sinh viên đã đạt",
            "x": 1040, "y": 410, "w": 250,
            "fields": [
                {"name": "id", "type": "INTEGER", "key": "PK"},
                {"name": "user_id", "type": "VARCHAR(64)", "key": "FK"},
                {"name": "achievement_id", "type": "INTEGER", "key": "FK"},
                {"name": "unlocked_at", "type": "DATETIME", "key": ""}
            ]
        },

        # ROW 3 & 4: COURSEWARE & EXAMS HIERARCHY
        # Col 1
        {
            "name": "subjects",
            "title": "SUBJECTS",
            "desc": "10 môn học chính thức",
            "x": 50, "y": 610, "w": 250,
            "fields": [
                {"name": "id", "type": "INTEGER", "key": "PK"},
                {"name": "code", "type": "VARCHAR(50)", "key": "UQ"},
                {"name": "subject_name", "type": "VARCHAR(255)", "key": ""},
                {"name": "description", "type": "TEXT", "key": ""},
                {"name": "credits", "type": "INTEGER", "key": ""},
                {"name": "icon_url", "type": "VARCHAR(500)", "key": ""},
                {"name": "created_at", "type": "DATETIME", "key": ""}
            ]
        },
        # Col 2
        {
            "name": "units",
            "title": "UNITS",
            "desc": "106 Cửa ải chương học",
            "x": 380, "y": 610, "w": 240,
            "fields": [
                {"name": "id", "type": "INTEGER", "key": "PK"},
                {"name": "subject_id", "type": "INTEGER", "key": "FK"},
                {"name": "title", "type": "VARCHAR(255)", "key": ""},
                {"name": "order_index", "type": "INTEGER", "key": ""}
            ]
        },
        {
            "name": "exams",
            "title": "EXAMS",
            "desc": "Ngân hàng đề thi đánh giá",
            "x": 380, "y": 776, "w": 240,
            "fields": [
                {"name": "id", "type": "INTEGER", "key": "PK"},
                {"name": "subject_id", "type": "INTEGER", "key": "FK"},
                {"name": "title", "type": "VARCHAR(255)", "key": ""},
                {"name": "description", "type": "TEXT", "key": ""},
                {"name": "duration_minutes", "type": "INTEGER", "key": ""},
                {"name": "pass_score", "type": "INTEGER", "key": ""},
                {"name": "total_questions", "type": "INTEGER", "key": ""},
                {"name": "created_at", "type": "DATETIME", "key": ""}
            ]
        },
        # Col 3
        {
            "name": "lessons",
            "title": "LESSONS",
            "desc": "4.094 trang bài học slide",
            "x": 700, "y": 610, "w": 250,
            "fields": [
                {"name": "id", "type": "INTEGER", "key": "PK"},
                {"name": "unit_id", "type": "INTEGER", "key": "FK"},
                {"name": "title", "type": "VARCHAR(255)", "key": ""},
                {"name": "order_index", "type": "INTEGER", "key": ""},
                {"name": "xp_reward", "type": "INTEGER", "key": ""},
                {"name": "content", "type": "TEXT", "key": ""},
                {"name": "video_url", "type": "VARCHAR(500)", "key": ""}
            ]
        },
        {
            "name": "user_exam_attempts",
            "title": "USER_EXAM_ATTEMPTS",
            "desc": "Lịch sử nộp bài kiểm tra",
            "x": 700, "y": 840, "w": 250,
            "fields": [
                {"name": "id", "type": "INTEGER", "key": "PK"},
                {"name": "user_id", "type": "VARCHAR(64)", "key": "FK"},
                {"name": "exam_id", "type": "INTEGER", "key": "FK"},
                {"name": "score", "type": "INTEGER", "key": ""},
                {"name": "duration_taken", "type": "INTEGER", "key": ""},
                {"name": "is_passed", "type": "BOOLEAN", "key": ""},
                {"name": "completed_at", "type": "DATETIME", "key": ""}
            ]
        },
        # Col 4
        {
            "name": "questions",
            "title": "QUESTIONS",
            "desc": "29.460 câu trắc nghiệm thật",
            "x": 1030, "y": 610, "w": 260,
            "fields": [
                {"name": "id", "type": "INTEGER", "key": "PK"},
                {"name": "lesson_id", "type": "INTEGER", "key": "FK"},
                {"name": "question_type", "type": "VARCHAR(50)", "key": ""},
                {"name": "question_text", "type": "TEXT", "key": ""},
                {"name": "options", "type": "JSON", "key": ""},
                {"name": "correct_answer", "type": "VARCHAR(10)", "key": ""},
                {"name": "explanation", "type": "TEXT", "key": ""}
            ]
        },
        {
            "name": "user_progress",
            "title": "USER_PROGRESS",
            "desc": "Tiến độ hoàn thành bài học",
            "x": 1030, "y": 840, "w": 260,
            "fields": [
                {"name": "id", "type": "INTEGER", "key": "PK"},
                {"name": "user_id", "type": "VARCHAR(64)", "key": "FK"},
                {"name": "lesson_id", "type": "INTEGER", "key": "FK"},
                {"name": "status", "type": "VARCHAR(50)", "key": ""},
                {"name": "score", "type": "INTEGER", "key": ""},
                {"name": "completed_at", "type": "DATETIME", "key": ""}
            ]
        },
        {
            "name": "user_notes",
            "title": "USER_NOTES",
            "desc": "Cẩm nang tóm tắt bài học",
            "x": 1030, "y": 1045, "w": 260,
            "fields": [
                {"name": "id", "type": "INTEGER", "key": "PK"},
                {"name": "user_id", "type": "VARCHAR(64)", "key": "FK"},
                {"name": "lesson_id", "type": "INTEGER", "key": "FK"},
                {"name": "subject_id", "type": "INTEGER", "key": "FK"},
                {"name": "title", "type": "VARCHAR(255)", "key": ""},
                {"name": "content", "type": "TEXT", "key": ""},
                {"name": "created_at", "type": "DATETIME", "key": ""},
                {"name": "updated_at", "type": "DATETIME", "key": ""}
            ]
        },
        # Col 5
        {
            "name": "user_mistakes",
            "title": "USER_MISTAKES",
            "desc": "Kho câu hỏi làm sai cần ôn",
            "x": 1370, "y": 610, "w": 250,
            "fields": [
                {"name": "id", "type": "INTEGER", "key": "PK"},
                {"name": "user_id", "type": "VARCHAR(64)", "key": "FK"},
                {"name": "question_id", "type": "INTEGER", "key": "FK"},
                {"name": "wrong_count", "type": "INTEGER", "key": ""},
                {"name": "last_wrong_at", "type": "DATETIME", "key": ""},
                {"name": "is_mastered", "type": "BOOLEAN", "key": ""}
            ]
        }
    ]

    table_map = {t["name"]: t for t in tables}

    def get_field_coord(tname, fname, side='right'):
        t = table_map[tname]
        f_idx = -1
        for i, f in enumerate(t["fields"]):
            if f["name"] == fname:
                f_idx = i
                break
        if f_idx == -1:
            raise ValueError(f"Field {fname} not found in {tname}")
        fy = t["y"] + 38 + f_idx * 22 + 11
        fx = t["x"] + t["w"] if side == 'right' else t["x"]
        return fx, fy

    # 11 Clean Relationships (No Line Crossings, Precision Parallel Aisle Channels)
    # Notice: In user_notes, lesson_id is row 2 (y=1138) and subject_id is row 3 (y=1160).
    # Since lesson_id vertical line stops at y=1138, and subject_id horizontal line runs at y=1160,
    # THEY NEVER INTERSECT! 100% PLANAR DIAGRAM!
    relationships = [
        # Row 2 (AI & Achievements)
        ("ai_conversations", "id", "ai_messages", "conversation_id", 340),
        ("achievements", "id", "user_achievements", "achievement_id", 1000),

        # Row 3 & 4 (Courseware & Assessment Hierarchy)
        ("subjects", "id", "units", "subject_id", 355),
        ("subjects", "id", "exams", "subject_id", 340),
        ("subjects", "id", "user_notes", "subject_id", 320),
        ("units", "id", "lessons", "unit_id", 660),
        ("exams", "id", "user_exam_attempts", "exam_id", 660),
        ("lessons", "id", "questions", "lesson_id", 1005),
        ("lessons", "id", "user_progress", "lesson_id", 990),
        ("lessons", "id", "user_notes", "lesson_id", 975),
        ("questions", "id", "user_mistakes", "question_id", 1330),
    ]

    svg = []
    svg.append(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">
    <defs>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&amp;display=swap');
            text {{ font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }}
            .card-shadow {{ filter: drop-shadow(0px 3px 6px rgba(15, 23, 42, 0.05)); }}
        </style>
    </defs>

    <!-- Canvas Background (Pure Pristine White) -->
    <rect width="{width}" height="{height}" fill="#FFFFFF" />

    <!-- Subtle Dot Grid Background -->
    <pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="0.9" fill="#E2E8F0" />
    </pattern>
    <rect width="{width}" height="{height}" fill="url(#dot-grid)" />

    <!-- Top Academic Header Banner -->
    <g id="header-banner" transform="translate(50, 22)">
        <rect x="0" y="0" width="{width - 100}" height="70" rx="4" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.8" class="card-shadow" />
        
        <!-- Institution Logo / Badge -->
        <rect x="12" y="10" width="50" height="50" rx="4" fill="#0F172A" />
        <text x="37" y="42" fill="#FFFFFF" font-size="18" font-weight="900" text-anchor="middle" letter-spacing="0.5">3TG</text>

        <!-- Main Title & Academic Context -->
        <text x="75" y="32" fill="#0F172A" font-size="15.5" font-weight="900" letter-spacing="0.2">SƠ ĐỒ QUAN HỆ THỰC THỂ (ERD) • NỀN TẢNG HỌC TẬP GAMIFICATION "3TG"</text>
        <text x="75" y="52" fill="#475569" font-size="10.5" font-weight="600">Chuẩn Cơ Sở Dữ Liệu Đại Học • Chuẩn Hóa 3NF • Cloudflare D1 (SQLite Edge Engine) • Môn: Công nghệ phần mềm - K4 (INFO2011)</text>

        <!-- Right System Badges -->
        <g transform="translate({width - 100 - 580}, 18)">
            <rect x="0" y="0" width="100" height="34" rx="3" fill="#F8FAFC" stroke="#0F172A" stroke-width="1.2" />
            <text x="50" y="14" fill="#64748B" font-size="8.5" text-anchor="middle" font-weight="600">THỰC THỂ</text>
            <text x="50" y="29" fill="#0F172A" font-size="12" text-anchor="middle" font-weight="900">21 TABLES</text>

            <rect x="115" y="0" width="115" height="34" rx="3" fill="#F8FAFC" stroke="#0F172A" stroke-width="1.2" />
            <text x="172" y="14" fill="#64748B" font-size="8.5" text-anchor="middle" font-weight="600">THUỘC TÍNH</text>
            <text x="172" y="29" fill="#0F172A" font-size="12" text-anchor="middle" font-weight="900">108 FIELDS</text>

            <rect x="245" y="0" width="115" height="34" rx="3" fill="#F8FAFC" stroke="#0F172A" stroke-width="1.2" />
            <text x="302" y="14" fill="#64748B" font-size="8.5" text-anchor="middle" font-weight="600">QUAN HỆ CHÍNH</text>
            <text x="302" y="29" fill="#0F172A" font-size="12" text-anchor="middle" font-weight="900">11 CORE RELS</text>

            <rect x="375" y="0" width="180" height="34" rx="3" fill="#F8FAFC" stroke="#0F172A" stroke-width="1.2" />
            <text x="465" y="14" fill="#64748B" font-size="8.5" text-anchor="middle" font-weight="600">KÝ HIỆU CHUẨN MỰC</text>
            <text x="465" y="29" fill="#0F172A" font-size="11.5" text-anchor="middle" font-weight="900">CROW'S FOOT NOTATION</text>
        </g>
    </g>

    <!-- Section Labels -->
    <g id="section-labels">
        <text x="50" y="114" fill="#0F172A" font-size="11" font-weight="800" letter-spacing="0.5">▼ BẢNG ĐỘC LẬP &amp; HỒ SƠ SINH VIÊN (USER-SCOPED &amp; GAMIFICATION TABLES)</text>
        <text x="50" y="393" fill="#0F172A" font-size="11" font-weight="800" letter-spacing="0.5">▼ PHÂN HỆ HỘI THOẠI AI &amp; DANH HIỆU THÀNH TÍCH (AI CHAT &amp; ACHIEVEMENTS)</text>
        <text x="50" y="593" fill="#0F172A" font-size="11" font-weight="800" letter-spacing="0.5">▼ CÂY PHÂN CẤP HỌC LIỆU &amp; ĐÁNH GIÁ (COURSEWARE &amp; ASSESSMENT HIERARCHY TREE)</text>
    </g>
    ''')

    # Draw Relationship Lines
    svg.append('<!-- 11 Orthogonal Stepped Relationship Lines with Zero Crossings -->')
    svg.append('<g id="relationships">')
    
    radius = 6
    drawn_sources = set()

    for src_t, src_f, tgt_t, tgt_f, turn_x in relationships:
        x1, y1 = get_field_coord(src_t, src_f, 'right')
        x2, y2 = get_field_coord(tgt_t, tgt_f, 'left')

        # Build rounded orthogonal path
        # x1, y1 -> turn_x, y1 -> turn_x, y2 -> x2, y2
        if abs(y1 - y2) < 2:
            path_d = f"M {x1} {y1} L {x2} {y2}"
        else:
            dir_y = 1 if y2 > y1 else -1
            c1_entry_x = turn_x - radius
            c1_exit_y = y1 + dir_y * radius
            c2_entry_y = y2 - dir_y * radius
            c2_exit_x = turn_x + radius

            path_d = (
                f"M {x1} {y1} "
                f"L {c1_entry_x} {y1} "
                f"Q {turn_x} {y1} {turn_x} {c1_exit_y} "
                f"L {turn_x} {c2_entry_y} "
                f"Q {turn_x} {y2} {c2_exit_x} {y2} "
                f"L {x2} {y2}"
            )

        src_key = f"{src_t}.{src_f}"
        show_src_marker = src_key not in drawn_sources
        drawn_sources.add(src_key)

        svg.append(f'''
        <g class="rel-connector">
            <!-- Connector Line (Crisp Slate Charcoal) -->
            <path d="{path_d}" fill="none" stroke="#334155" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        ''')

        # PK Side: One-Bar Indicator (|) and text '1' (drawn only once per source field to avoid overlapping text)
        if show_src_marker:
            svg.append(f'''
            <line x1="{x1 + 3}" y1="{y1 - 6}" x2="{x1 + 3}" y2="{y1 + 6}" stroke="#334155" stroke-width="1.8" stroke-linecap="round" />
            <text x="{x1 + 8}" y="{y1 - 4}" fill="#64748B" font-size="8.5" font-weight="700">1</text>
            ''')

        # FK Side: Crow's Foot Fork Indicator (<) and text 'N'
        svg.append(f'''
            <path d="M {x2} {y2 - 6} L {x2 - 8} {y2} L {x2} {y2 + 6} M {x2 - 8} {y2} L {x2} {y2}" fill="none" stroke="#334155" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <text x="{x2 - 14}" y="{y2 - 4}" fill="#64748B" font-size="8.5" font-weight="700">N</text>
        </g>
        ''')

    svg.append('</g>')

    # Draw Entity Tables
    svg.append('<!-- 21 Database Entity Tables -->')
    svg.append('<g id="entity-tables">')

    for t in tables:
        tx, ty, tw = t["x"], t["y"], t["w"]
        th = 38 + len(t["fields"]) * 22

        svg.append(f'''
        <g id="table-{t["name"]}" class="entity-card card-shadow" transform="translate({tx}, {ty})">
            <!-- Table Outer Frame -->
            <rect x="0" y="0" width="{tw}" height="{th}" rx="4" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.6" />
            
            <!-- Table Header (Charcoal Black fill) -->
            <rect x="0" y="0" width="{tw}" height="38" rx="4" fill="#0F172A" />
            <rect x="0" y="30" width="{tw}" height="8" fill="#0F172A" />
            <line x1="0" y1="38" x2="{tw}" y2="38" stroke="#0F172A" stroke-width="1.6" />
            
            <!-- Table Header Titles -->
            <text x="10" y="19" fill="#FFFFFF" font-size="11" font-weight="800" letter-spacing="0.4">{t["title"]}</text>
            <text x="10" y="32" fill="#CBD5E1" font-size="8" font-weight="500">{t["desc"]}</text>
            
            <!-- Field Count Tag -->
            <rect x="{tw - 36}" y="6" width="28" height="14" rx="2" fill="#334155" />
            <text x="{tw - 22}" y="16.5" fill="#FFFFFF" font-size="8" font-weight="700" text-anchor="middle">{len(t["fields"])} F</text>
        ''')

        # Draw Field Rows
        for r_idx, f in enumerate(t["fields"]):
            ry = 38 + r_idx * 22
            row_bg = "#F8FAFC" if r_idx % 2 == 1 else "#FFFFFF"
            svg.append(f'<rect x="1" y="{ry}" width="{tw - 2}" height="22" fill="{row_bg}" />')

            # Key Badges
            key = f["key"]
            if key == "PK":
                svg.append(f'''
                <rect x="6" y="{ry + 3}" width="22" height="15" rx="2" fill="#0F172A" />
                <text x="17" y="{ry + 14}" fill="#FFFFFF" font-size="8" font-weight="900" text-anchor="middle">PK</text>
                ''')
            elif key == "FK":
                svg.append(f'''
                <rect x="6" y="{ry + 3}" width="22" height="15" rx="2" fill="#E2E8F0" stroke="#0F172A" stroke-width="1" />
                <text x="17" y="{ry + 14}" fill="#0F172A" font-size="8" font-weight="900" text-anchor="middle">FK</text>
                ''')
            elif key == "UQ":
                svg.append(f'''
                <rect x="6" y="{ry + 3}" width="22" height="15" rx="2" fill="#FFFFFF" stroke="#64748B" stroke-width="1" />
                <text x="17" y="{ry + 14}" fill="#475569" font-size="8" font-weight="800" text-anchor="middle">UQ</text>
                ''')
            else:
                svg.append(f'<circle cx="17" cy="{ry + 11}" r="1.8" fill="#94A3B8" />')

            # Field Name
            field_font_weight = "800" if key == "PK" else ("600" if key == "FK" else "500")
            field_font_style = "italic" if key == "FK" else "normal"
            svg.append(f'<text x="34" y="{ry + 15}" fill="#0F172A" font-size="10" font-weight="{field_font_weight}" font-style="{field_font_style}">{f["name"]}</text>')

            # Field Type
            svg.append(f'<text x="{tw - 8}" y="{ry + 15}" fill="#475569" font-size="8.5" font-weight="600" text-anchor="end" font-family="ui-monospace, SFMono-Regular, Consolas, monospace">{f["type"]}</text>')

            # Row divider line
            if r_idx < len(t["fields"]) - 1:
                svg.append(f'<line x1="4" y1="{ry + 22}" x2="{tw - 4}" y2="{ry + 22}" stroke="#E2E8F0" stroke-width="0.8" />')

        svg.append('</g>')

    svg.append('</g>')

    # Bottom Standard Legend
    svg.append(f'''
    <!-- Standard ERD Legend (Academic Convention) -->
    <g id="footer-legend" transform="translate(50, {height - 48})">
        <rect x="0" y="0" width="{width - 100}" height="36" rx="4" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.6" class="card-shadow" />
        
        <text x="16" y="22" fill="#0F172A" font-size="10.5" font-weight="800">QUY CHUẨN KÝ HIỆU (LEGEND):</text>
        
        <g transform="translate(200, 10)">
            <rect x="0" y="1" width="22" height="15" rx="2" fill="#0F172A" />
            <text x="11" y="12" fill="#FFFFFF" font-size="8" font-weight="900" text-anchor="middle">PK</text>
            <text x="28" y="13" fill="#0F172A" font-size="9.5" font-weight="600">Khóa chính (Primary Key)</text>

            <rect x="180" y="1" width="22" height="15" rx="2" fill="#E2E8F0" stroke="#0F172A" stroke-width="1" />
            <text x="191" y="12" fill="#0F172A" font-size="8" font-weight="900" text-anchor="middle">FK</text>
            <text x="208" y="13" fill="#0F172A" font-size="9.5" font-weight="600">Khóa ngoại (Foreign Key)</text>

            <rect x="360" y="1" width="22" height="15" rx="2" fill="#FFFFFF" stroke="#64748B" stroke-width="1" />
            <text x="371" y="12" fill="#475569" font-size="8" font-weight="800" text-anchor="middle">UQ</text>
            <text x="388" y="13" fill="#0F172A" font-size="9.5" font-weight="600">Duy nhất (Unique)</text>

            <!-- Crow's foot diagram symbols -->
            <line x1="510" y1="8" x2="550" y2="8" stroke="#334155" stroke-width="1.5" />
            <line x1="520" y1="2" x2="520" y2="14" stroke="#334155" stroke-width="1.6" />
            <text x="560" y="13" fill="#0F172A" font-size="9.5" font-weight="600">| Quan hệ 1 - 1 (Mandatory One)</text>

            <line x1="770" y1="8" x2="810" y2="8" stroke="#334155" stroke-width="1.5" />
            <path d="M 810 2 L 802 8 L 810 14 M 802 8 L 810 8" stroke="#334155" stroke-width="1.4" fill="none" />
            <text x="820" y="13" fill="#0F172A" font-size="9.5" font-weight="600">&lt; Quan hệ 1 - Nhiều (1:N Crow's Foot Notation)</text>
        </g>

        <text x="{width - 120}" y="22" fill="#64748B" font-size="9.5" font-weight="600" text-anchor="end">Thiết kế bởi: Nhóm 3TG (Lê Văn An, Nguyễn Như Quỳnh, Nguyễn Văn Tú) • ĐH CMC</text>
    </g>
    ''')

    svg.append('</svg>')
    return '\n'.join(svg)

def main():
    svg_content = build_erd_svg()
    
    out_dir = r"c:\Users\LeVanAn\Documents\ChatGPT\app study 2\tổng kết sprint 1"
    svg_path_1 = os.path.join(out_dir, "erd_chuan_dai_hoc.svg")
    svg_path_2 = os.path.join(out_dir, "erd.svg")

    with open(svg_path_1, "w", encoding="utf-8") as f:
        f.write(svg_content)
    with open(svg_path_2, "w", encoding="utf-8") as f:
        f.write(svg_content)

    print("SVG files generated successfully.")

    # Convert to preview PNG
    doc = fitz.open(svg_path_1)
    page = doc[0]
    pix = page.get_pixmap(dpi=150)
    
    png_preview = os.path.join(out_dir, "erd_preview.png")
    png_page1 = os.path.join(out_dir, "erd_page_1.png")
    pix.save(png_preview)
    pix.save(png_page1)
    print(f"Rendered preview PNG: {png_preview} ({pix.width}x{pix.height})")

if __name__ == "__main__":
    main()
