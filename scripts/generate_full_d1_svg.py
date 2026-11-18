import os
import subprocess
import tempfile
import sqlite3

def generate_full_d1_svg():
    # Load actual table schema from SQLite
    con = sqlite3.connect('build/local_replica.sqlite')
    
    # We will lay out all 33 tables across a clean 2800 x 1900 canvas in pure black and white
    svg = ['''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2800 1950" width="100%" height="100%">
  <defs>
    <style>
      .bg { fill: #FFFFFF; }
      .main-title { font-family: 'Times New Roman', serif; font-size: 28px; font-weight: bold; fill: #000000; letter-spacing: 0.5px; }
      .main-sub { font-family: 'Times New Roman', serif; font-size: 15px; fill: #333333; font-style: italic; }
      .cluster-box { fill: #FFFFFF; stroke: #000000; stroke-width: 1.5; stroke-dasharray: 6,4; rx: 8; }
      .cluster-title { font-family: 'Times New Roman', serif; font-size: 15px; font-weight: bold; fill: #000000; }
      .tbl-card { fill: #FFFFFF; stroke: #000000; stroke-width: 1.2; rx: 4; }
      .tbl-hdr { fill: #F8F9FA; stroke: #000000; stroke-width: 1.2; rx: 4; }
      .tbl-name { font-family: 'Consolas', 'Courier New', monospace; font-size: 13px; font-weight: bold; fill: #000000; }
      .fld-pk { font-family: 'Consolas', 'Courier New', monospace; font-size: 11.5px; font-weight: bold; fill: #000000; }
      .fld-fk { font-family: 'Consolas', 'Courier New', monospace; font-size: 11.5px; font-weight: bold; fill: #333333; }
      .fld-norm { font-family: 'Consolas', 'Courier New', monospace; font-size: 11px; fill: #111111; }
      .fld-type { font-family: 'Consolas', 'Courier New', monospace; font-size: 10.5px; fill: #555555; text-anchor: end; }
      .row-div { stroke: #E5E7EB; stroke-width: 0.8; }
      .hdr-div { stroke: #000000; stroke-width: 1.2; }
      .conn-line { stroke: #000000; stroke-width: 1.4; fill: none; }
      .conn-arrow { fill: #000000; }
    </style>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#000000" />
    </marker>
  </defs>

  <rect width="100%" height="100%" class="bg" />

  <!-- Main Header -->
  <g transform="translate(60, 50)">
    <text class="main-title" x="0" y="0">SƠ ĐỒ THỰC THỂ QUAN HỆ TOÀN DIỆN CƠ SỞ DỮ LIỆU CLOUDFLARE D1 (3NF RELATIONAL ERD)</text>
    <text class="main-sub" x="0" y="24">Hệ thống 33 bảng dữ liệu chuẩn hóa Chuẩn dạng 3 (3NF) • Hệ sinh thái học tập thông minh 3TG Study AI • Khóa ngoại và ràng buộc toàn vẹn</text>
    <line x1="0" y1="36" x2="2680" y2="36" stroke="#000000" stroke-width="2" />
  </g>
''']

    # Function to render a single table
    def draw_table(x, y, w, name, cols_info):
        row_h = 20
        hdr_h = 26
        total_h = hdr_h + len(cols_info) * row_h + 8
        out = []
        out.append(f'<g transform="translate({x}, {y})">')
        out.append(f'  <rect width="{w}" height="{total_h}" class="tbl-card" />')
        out.append(f'  <rect width="{w}" height="{hdr_h}" class="tbl-hdr" />')
        out.append(f'  <line x1="0" y1="{hdr_h}" x2="{w}" y2="{hdr_h}" class="hdr-div" />')
        out.append(f'  <text class="tbl-name" x="10" y="18">{name}</text>')
        
        curr_y = hdr_h + 15
        for col_name, col_type, is_pk, is_fk in cols_info:
            cls = "fld-pk" if is_pk else ("fld-fk" if is_fk else "fld-norm")
            prefix = "[PK] " if is_pk else ("[FK] " if is_fk else "")
            out.append(f'  <text class="{cls}" x="10" y="{curr_y}">{prefix}{col_name}</text>')
            out.append(f'  <text class="fld-type" x="{w-10}" y="{curr_y}">{col_type}</text>')
            out.append(f'  <line x1="0" y1="{curr_y+5}" x2="{w}" y2="{curr_y+5}" class="row-div" />')
            curr_y += row_h
        out.append('</g>')
        return '\n'.join(out), total_h

    # ================= CLUSTER 1: ACADEMIC & LEARNING HIERARCHY (LEFT COLUMN) =================
    svg.append('<!-- CLUSTER 1: HỌC PHẦN & CÂY BÀI HỌC -->')
    svg.append('<rect x="50" y="110" width="460" height="1780" class="cluster-box" />')
    svg.append('<text class="cluster-title" x="70" y="136">PHÂN HỆ 1: HỌC PHẦN &amp; LỘ TRÌNH HỌC TẬP</text>')

    # subjects
    t1, h1 = draw_table(70, 155, 420, "subjects", [
        ("id", "INTEGER", True, False),
        ("subject_name", "TEXT", False, False),
        ("description", "TEXT", False, False),
        ("icon_url", "TEXT", False, False),
        ("created_at", "DATETIME", False, False)
    ])
    svg.append(t1)

    # units
    t2, h2 = draw_table(70, 155 + h1 + 25, 420, "units", [
        ("id", "INTEGER", True, False),
        ("subject_id", "INTEGER", False, True),
        ("title", "TEXT", False, False),
        ("order_index", "INTEGER", False, False)
    ])
    svg.append(t2)

    # lessons
    y_lessons = 155 + h1 + 25 + h2 + 25
    t3, h3 = draw_table(70, y_lessons, 420, "lessons", [
        ("id", "INTEGER", True, False),
        ("unit_id", "INTEGER", False, True),
        ("title", "TEXT", False, False),
        ("order_index", "INTEGER", False, False),
        ("xp_reward", "INTEGER", False, False),
        ("content", "TEXT", False, False),
        ("video_url", "TEXT", False, False)
    ])
    svg.append(t3)

    # questions
    y_questions = y_lessons + h3 + 25
    t4, h4 = draw_table(70, y_questions, 420, "questions", [
        ("id", "INTEGER", True, False),
        ("lesson_id", "INTEGER", False, True),
        ("question_type", "TEXT", False, False),
        ("question_text", "TEXT", False, False),
        ("options", "JSON", False, False),
        ("correct_answer", "TEXT", False, False),
        ("explanation", "TEXT", False, False)
    ])
    svg.append(t4)

    # user_progress
    y_progress = y_questions + h4 + 25
    t5, h5 = draw_table(70, y_progress, 420, "user_progress", [
        ("id", "INTEGER", True, False),
        ("user_id", "TEXT", False, True),
        ("lesson_id", "INTEGER", False, True),
        ("status", "TEXT", False, False),
        ("score", "INTEGER", False, False),
        ("completed_at", "DATETIME", False, False)
    ])
    svg.append(t5)

    # user_mistakes
    y_mistakes = y_progress + h5 + 25
    t6, h6 = draw_table(70, y_mistakes, 420, "user_mistakes", [
        ("id", "INTEGER", True, False),
        ("user_id", "TEXT", False, True),
        ("question_id", "INTEGER", False, True),
        ("wrong_count", "INTEGER", False, False),
        ("last_wrong_at", "DATETIME", False, False),
        ("is_mastered", "BOOLEAN", False, False)
    ])
    svg.append(t6)

    # user_notes
    y_notes = y_mistakes + h6 + 25
    t7, h7 = draw_table(70, y_notes, 420, "user_notes", [
        ("id", "INTEGER", True, False),
        ("user_id", "INTEGER", False, True),
        ("subject_id", "INTEGER", False, True),
        ("lesson_id", "INTEGER", False, True),
        ("title", "TEXT", False, False),
        ("content", "TEXT", False, False),
        ("created_at", "TEXT", False, False),
        ("updated_at", "TEXT", False, False)
    ])
    svg.append(t7)

    # ================= CLUSTER 2: GAMIFICATION & REWARDS (MID-LEFT) =================
    svg.append('<!-- CLUSTER 2: GAMIFICATION & VẬT PHẨM -->')
    svg.append('<rect x="530" y="110" width="460" height="1780" class="cluster-box" />')
    svg.append('<text class="cluster-title" x="550" y="136">PHÂN HỆ 2: GAMIFICATION &amp; TƯỞNG THƯỞNG</text>')

    # user_stats
    t_stats, h_stats = draw_table(550, 155, 420, "user_stats", [
        ("user_id", "TEXT", True, True),
        ("total_xp", "INTEGER", False, False),
        ("current_streak", "INTEGER", False, False),
        ("longest_streak", "INTEGER", False, False),
        ("hearts", "INTEGER", False, False),
        ("gems", "INTEGER", False, False),
        ("last_active_date", "DATE", False, False)
    ])
    svg.append(t_stats)

    # user_streak_history
    y_streak = 155 + h_stats + 25
    t_strk, h_strk = draw_table(550, y_streak, 420, "user_streak_history", [
        ("id", "INTEGER", True, False),
        ("user_id", "TEXT", False, True),
        ("activity_date", "DATE", False, False),
        ("status", "TEXT", False, False)
    ])
    svg.append(t_strk)

    # weekly_leaderboards
    y_board = y_streak + h_strk + 25
    t_board, h_board = draw_table(550, y_board, 420, "weekly_leaderboards", [
        ("id", "INTEGER", True, False),
        ("user_id", "TEXT", False, True),
        ("league_name", "TEXT", False, False),
        ("weekly_xp", "INTEGER", False, False),
        ("week_start_date", "DATE", False, False)
    ])
    svg.append(t_board)

    # user_leaderboard_rewards
    y_lrew = y_board + h_board + 25
    t_lrew, h_lrew = draw_table(550, y_lrew, 420, "user_leaderboard_rewards", [
        ("id", "INTEGER", True, False),
        ("user_id", "TEXT", False, True),
        ("week_start_date", "TEXT", False, False),
        ("rank", "INTEGER", False, False),
        ("gems", "INTEGER", False, False),
        ("claimed_at", "TEXT", False, False)
    ])
    svg.append(t_lrew)

    # user_daily_quests
    y_quest = y_lrew + h_lrew + 25
    t_quest, h_quest = draw_table(550, y_quest, 420, "user_daily_quests", [
        ("id", "INTEGER", True, False),
        ("user_id", "TEXT", False, True),
        ("quest_date", "TEXT", False, False),
        ("quest_code", "TEXT", False, False),
        ("claimed_at", "TEXT", False, False)
    ])
    svg.append(t_quest)

    # shop_items
    y_shop = y_quest + h_quest + 25
    t_shop, h_shop = draw_table(550, y_shop, 420, "shop_items", [
        ("id", "INTEGER", True, False),
        ("item_code", "TEXT", False, False),
        ("name", "TEXT", False, False),
        ("description", "TEXT", False, False),
        ("price_gems", "INTEGER", False, False)
    ])
    svg.append(t_shop)

    # user_inventory
    y_inv = y_shop + h_shop + 25
    t_inv, h_inv = draw_table(550, y_inv, 420, "user_inventory", [
        ("id", "INTEGER", True, False),
        ("user_id", "TEXT", False, True),
        ("item_code", "TEXT", False, True),
        ("quantity", "INTEGER", False, False)
    ])
    svg.append(t_inv)

    # achievements
    y_ach = y_inv + h_inv + 25
    t_ach, h_ach = draw_table(550, y_ach, 420, "achievements", [
        ("id", "INTEGER", True, False),
        ("title", "TEXT", False, False),
        ("description", "TEXT", False, False),
        ("badge_icon_url", "TEXT", False, False),
        ("required_value", "INTEGER", False, False)
    ])
    svg.append(t_ach)

    # user_achievements
    y_uach = y_ach + h_ach + 25
    t_uach, h_uach = draw_table(550, y_uach, 420, "user_achievements", [
        ("id", "INTEGER", True, False),
        ("user_id", "TEXT", False, True),
        ("achievement_id", "INTEGER", False, True),
        ("unlocked_at", "DATETIME", False, False)
    ])
    svg.append(t_uach)

    # ================= CLUSTER 3: AUTH, IDENTITY & PROFILES (CENTER) =================
    svg.append('<!-- CLUSTER 3: TÀI KHOẢN & HỒ SƠ -->')
    svg.append('<rect x="1010" y="110" width="480" height="780" class="cluster-box" />')
    svg.append('<text class="cluster-title" x="1030" y="136">PHÂN HỆ 3: TÀI KHOẢN &amp; HỒ SƠ CÁ NHÂN</text>')

    # accounts
    t_acc, h_acc = draw_table(1030, 155, 440, "accounts", [
        ("id", "TEXT", True, False),
        ("user_id", "TEXT", False, False),
        ("service_name", "TEXT", False, False),
        ("username", "TEXT", False, False),
        ("encrypted_password", "TEXT", False, False),
        ("created_at", "TEXT", False, False)
    ])
    svg.append(t_acc)

    # profiles
    y_prof = 155 + h_acc + 25
    t_prof, h_prof = draw_table(1030, y_prof, 440, "profiles", [
        ("id", "TEXT", True, False),
        ("user_id", "TEXT", False, True),
        ("full_name", "TEXT", False, False),
        ("avatar_url", "TEXT", False, False),
        ("bio", "TEXT", False, False),
        ("cover_url", "TEXT", False, False),
        ("school", "TEXT", False, False),
        ("major", "TEXT", False, False),
        ("avatar_decoration", "TEXT", False, False),
        ("profile_effect", "TEXT", False, False),
        ("profile_theme", "TEXT", False, False),
        ("social_links", "TEXT", False, False),
        ("status_icon", "TEXT", False, False),
        ("last_active_at", "TEXT", False, False),
        ("created_at", "TEXT", False, False)
    ])
    svg.append(t_prof)

    # friendships
    y_fr = y_prof + h_prof + 25
    t_fr, h_fr = draw_table(1030, y_fr, 440, "friendships", [
        ("id", "INTEGER", True, False),
        ("user_id", "INTEGER", False, True),
        ("friend_id", "INTEGER", False, True),
        ("status", "TEXT", False, False),
        ("created_at", "TEXT", False, False)
    ])
    svg.append(t_fr)

    # ================= CLUSTER 4: SOCIAL & MESSAGING (BOTTOM CENTER) =================
    svg.append('<!-- CLUSTER 4: TIN NHẮN & HỌC NHÓM -->')
    svg.append('<rect x="1010" y="910" width="480" height="980" class="cluster-box" />')
    svg.append('<text class="cluster-title" x="1030" y="936">PHÂN HỆ 4: TIN NHẮN TRỰC TIẾP &amp; HỌC NHÓM</text>')

    # direct_messages
    t_dm, h_dm = draw_table(1030, 955, 440, "direct_messages", [
        ("id", "INTEGER", True, False),
        ("sender_id", "TEXT", False, True),
        ("receiver_id", "TEXT", False, True),
        ("message", "TEXT", False, False),
        ("media_url", "TEXT", False, False),
        ("media_type", "TEXT", False, False),
        ("media_size", "INTEGER", False, False),
        ("reply_to_id", "INTEGER", False, False),
        ("reply_to_name", "TEXT", False, False),
        ("is_read", "INTEGER", False, False),
        ("created_at", "TEXT", False, False)
    ])
    svg.append(t_dm)

    # friend_messages
    y_fmsg = 955 + h_dm + 20
    t_fmsg, h_fmsg = draw_table(1030, y_fmsg, 440, "friend_messages", [
        ("id", "INTEGER", True, False),
        ("sender_id", "INTEGER", False, True),
        ("receiver_id", "INTEGER", False, True),
        ("message", "TEXT", False, False),
        ("is_read", "INTEGER", False, False),
        ("created_at", "TEXT", False, False)
    ])
    svg.append(t_fmsg)

    # chat_groups
    y_cg = y_fmsg + h_fmsg + 20
    t_cg, h_cg = draw_table(1030, y_cg, 440, "chat_groups", [
        ("id", "TEXT", True, False),
        ("name", "TEXT", False, False),
        ("avatar_url", "TEXT", False, False),
        ("created_by", "TEXT", False, True),
        ("created_at", "TEXT", False, False)
    ])
    svg.append(t_cg)

    # chat_group_members
    y_cgm = y_cg + h_cg + 20
    t_cgm, h_cgm = draw_table(1030, y_cgm, 440, "chat_group_members", [
        ("id", "INTEGER", True, False),
        ("group_id", "TEXT", False, True),
        ("user_id", "TEXT", False, True),
        ("role", "TEXT", False, False),
        ("joined_at", "TEXT", False, False)
    ])
    svg.append(t_cgm)

    # chat_group_messages
    y_cgmsg = y_cgm + h_cgm + 20
    t_cgmsg, h_cgmsg = draw_table(1030, y_cgmsg, 440, "chat_group_messages", [
        ("id", "INTEGER", True, False),
        ("group_id", "TEXT", False, True),
        ("sender_id", "TEXT", False, True),
        ("message", "TEXT", False, False),
        ("media_url", "TEXT", False, False),
        ("created_at", "TEXT", False, False)
    ])
    svg.append(t_cgmsg)

    # ================= CLUSTER 5: POMODORO & ACADEMIC TRANSCRIPTS (MID-RIGHT) =================
    svg.append('<!-- CLUSTER 5: POMODORO & BẢNG ĐIỂM -->')
    svg.append('<rect x="1510" y="110" width="480" height="920" class="cluster-box" />')
    svg.append('<text class="cluster-title" x="1530" y="136">PHÂN HỆ 5: FOCUS KIOSK &amp; BẢNG ĐIỂM IU</text>')

    # pomodoro_active_learners
    t_pact, h_pact = draw_table(1530, 155, 440, "pomodoro_active_learners", [
        ("user_id", "TEXT", True, True),
        ("cycle_number", "INTEGER", False, False),
        ("mode", "TEXT", False, False),
        ("doc_name", "TEXT", False, False),
        ("started_at", "TEXT", False, False),
        ("last_heartbeat", "TEXT", False, False)
    ])
    svg.append(t_pact)

    # user_pomodoro_sessions
    y_psess = 155 + h_pact + 25
    t_psess, h_psess = draw_table(1530, y_psess, 440, "user_pomodoro_sessions", [
        ("id", "TEXT", True, False),
        ("user_id", "TEXT", False, True),
        ("cycles", "INTEGER", False, False),
        ("focus_minutes", "INTEGER", False, False),
        ("xp_reward", "INTEGER", False, False),
        ("gems_reward", "INTEGER", False, False),
        ("doc_name", "TEXT", False, False),
        ("completed_at", "TEXT", False, False)
    ])
    svg.append(t_psess)

    # user_academic_transcripts
    y_trans = y_psess + h_psess + 25
    t_trans, h_trans = draw_table(1530, y_trans, 440, "user_academic_transcripts", [
        ("id", "INTEGER", True, False),
        ("user_id", "TEXT", False, True),
        ("student_code", "TEXT", False, False),
        ("full_name", "TEXT", False, False),
        ("major", "TEXT", False, False),
        ("class_name", "TEXT", False, False),
        ("gpa_10", "REAL", False, False),
        ("gpa_4", "REAL", False, False),
        ("total_credits", "INTEGER", False, False),
        ("raw_data", "TEXT", False, False),
        ("ai_analysis", "TEXT", False, False),
        ("target_gpa", "REAL", False, False),
        ("last_synced_at", "TEXT", False, False),
        ("created_at", "TEXT", False, False)
    ])
    svg.append(t_trans)

    # ================= CLUSTER 6: AI ENGINE & SYNC OUTBOX (FAR RIGHT) =================
    svg.append('<!-- CLUSTER 6: AI ASSISTANT & SYNC ENGINE -->')
    svg.append('<rect x="2010" y="110" width="460" height="1780" class="cluster-box" />')
    svg.append('<text class="cluster-title" x="2030" y="136">PHÂN HỆ 6: TRỢ LÝ AI &amp; ĐỒNG BỘ OUTBOX</text>')

    # ai_conversations
    t_aiconv, h_aiconv = draw_table(2030, 155, 420, "ai_conversations", [
        ("id", "TEXT", True, False),
        ("user_id", "TEXT", False, True),
        ("title", "TEXT", False, False),
        ("created_at", "TEXT", False, False),
        ("updated_at", "TEXT", False, False)
    ])
    svg.append(t_aiconv)

    # ai_messages
    y_aimsg = 155 + h_aiconv + 25
    t_aimsg, h_aimsg = draw_table(2030, y_aimsg, 420, "ai_messages", [
        ("id", "INTEGER", True, False),
        ("conversation_id", "TEXT", False, True),
        ("role", "TEXT", False, False),
        ("content", "TEXT", False, False),
        ("sender", "TEXT", False, False),
        ("created_at", "TEXT", False, False)
    ])
    svg.append(t_aimsg)

    # ai_chats
    y_aichat = y_aimsg + h_aimsg + 25
    t_aichat, h_aichat = draw_table(2030, y_aichat, 420, "ai_chats", [
        ("id", "INTEGER", True, False),
        ("user_id", "INTEGER", False, True),
        ("subject_id", "INTEGER", False, True),
        ("title", "TEXT", False, False),
        ("created_at", "TEXT", False, False)
    ])
    svg.append(t_aichat)

    # user_ai_usage
    y_aiuse = y_aichat + h_aichat + 25
    t_aiuse, h_aiuse = draw_table(2030, y_aiuse, 420, "user_ai_usage", [
        ("user_id", "TEXT", True, True),
        ("date", "TEXT", True, False),
        ("count", "INTEGER", False, False),
        ("last_req_ms", "INTEGER", False, False)
    ])
    svg.append(t_aiuse)

    # subject_data
    y_sdata = y_aiuse + h_aiuse + 25
    t_sdata, h_sdata = draw_table(2030, y_sdata, 420, "subject_data", [
        ("id", "TEXT", True, False),
        ("user_id", "TEXT", False, True),
        ("subject_name", "TEXT", False, False),
        ("content", "TEXT", False, False),
        ("created_at", "DATETIME", False, False)
    ])
    svg.append(t_sdata)

    # sync_outbox
    y_outbox = y_sdata + h_sdata + 25
    t_outbox, h_outbox = draw_table(2030, y_outbox, 420, "sync_outbox", [
        ("id", "TEXT", True, False),
        ("sql", "TEXT", False, False),
        ("params", "TEXT", False, False),
        ("status", "TEXT", False, False),
        ("retry_count", "INTEGER", False, False),
        ("last_error", "TEXT", False, False),
        ("created_at", "TEXT", False, False),
        ("synced_at", "TEXT", False, False)
    ])
    svg.append(t_outbox)

    # ================= RELATIONSHIP CONNECTOR PATHS (BLACK ORTHOGONAL LINES) =================
    # subjects -> units
    svg.append('<path d="M 280 280 L 280 325" class="conn-line" marker-end="url(#arrow)" />')
    # units -> lessons
    svg.append(f'<path d="M 280 {325+h2} L 280 {y_lessons}" class="conn-line" marker-end="url(#arrow)" />')
    # lessons -> questions
    svg.append(f'<path d="M 280 {y_lessons+h3} L 280 {y_questions}" class="conn-line" marker-end="url(#arrow)" />')
    # questions -> user_mistakes
    svg.append(f'<path d="M 120 {y_questions+h4} L 120 {y_mistakes}" class="conn-line" marker-end="url(#arrow)" />')
    # lessons -> user_progress
    svg.append(f'<path d="M 380 {y_questions+h4} L 380 {y_progress}" class="conn-line" marker-end="url(#arrow)" />')

    # accounts -> profiles
    svg.append(f'<path d="M 1250 {155+h_acc} L 1250 {y_prof}" class="conn-line" marker-end="url(#arrow)" />')

    # ai_conversations -> ai_messages
    svg.append(f'<path d="M 2240 {155+h_aiconv} L 2240 {y_aimsg}" class="conn-line" marker-end="url(#arrow)" />')

    # chat_groups -> chat_group_members
    svg.append(f'<path d="M 1150 {y_cg+h_cg} L 1150 {y_cgm}" class="conn-line" marker-end="url(#arrow)" />')
    # chat_groups -> chat_group_messages
    svg.append(f'<path d="M 1350 {y_cg+h_cg} L 1350 {y_cgmsg}" class="conn-line" marker-end="url(#arrow)" />')

    # shop_items -> user_inventory
    svg.append(f'<path d="M 760 {y_shop+h_shop} L 760 {y_inv}" class="conn-line" marker-end="url(#arrow)" />')
    # achievements -> user_achievements
    svg.append(f'<path d="M 760 {y_ach+h_ach} L 760 {y_uach}" class="conn-line" marker-end="url(#arrow)" />')

    svg.append('</svg>')
    return '\n'.join(svg)

def generate_black_white_use_case_svg():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1050" width="100%" height="100%">
  <defs>
    <style>
      .bg { fill: #FFFFFF; }
      .title { font-family: 'Times New Roman', serif; font-size: 26px; font-weight: bold; fill: #000000; letter-spacing: 0.5px; }
      .subtitle { font-family: 'Times New Roman', serif; font-size: 14px; fill: #333333; font-style: italic; }
      .sys-box { fill: #FFFFFF; stroke: #000000; stroke-width: 2; rx: 8; }
      .sys-header { fill: #FFFFFF; stroke: #000000; stroke-width: 1.5; }
      .sys-title { font-family: 'Times New Roman', serif; font-size: 16px; font-weight: bold; fill: #000000; }
      .actor-card { fill: #FFFFFF; stroke: #000000; stroke-width: 1.5; rx: 8; }
      .actor-title { font-family: 'Times New Roman', serif; font-size: 15px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .actor-role { font-family: 'Times New Roman', serif; font-size: 12px; fill: #333333; text-anchor: middle; }
      .uc-pill { fill: #FFFFFF; stroke: #000000; stroke-width: 1.5; rx: 28; }
      .uc-pill-bold { fill: #FFFFFF; stroke: #000000; stroke-width: 2.2; rx: 28; }
      .uc-code { font-family: 'Consolas', monospace; font-size: 11px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .uc-label { font-family: 'Times New Roman', serif; font-size: 13.5px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .assoc-line { stroke: #000000; stroke-width: 1.4; fill: none; }
      .include-line { stroke: #000000; stroke-width: 1.4; stroke-dasharray: 5,4; fill: none; marker-end: url(#arrow-bw); }
      .stereo-text { font-family: 'Times New Roman', serif; font-size: 11.5px; font-style: italic; fill: #000000; text-anchor: middle; }
    </style>
    <marker id="arrow-bw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#000000" />
    </marker>
  </defs>

  <rect width="100%" height="100%" class="bg" />

  <!-- Diagram Header -->
  <g transform="translate(60, 48)">
    <text class="title" x="0" y="0">SƠ ĐỒ USE CASE TỔNG THỂ HỆ THỐNG (UML 2.5 USE CASE SPECIFICATION)</text>
    <text class="subtitle" x="0" y="24">Mô hình hóa tương tác giữa 3 tác nhân nghiệp vụ và các ca sử dụng chuẩn mực • Đồ án Công nghệ phần mềm (INFO2005)</text>
    <line x1="0" y1="36" x2="1480" y2="36" stroke="#000000" stroke-width="1.8" />
  </g>

  <!-- ACTOR 1: HỌC VIÊN - LEFT -->
  <g transform="translate(60, 400)">
    <rect width="150" height="210" class="actor-card" />
    <circle cx="75" cy="46" r="20" fill="none" stroke="#000000" stroke-width="2.2" />
    <line x1="75" y1="66" x2="75" y2="120" stroke="#000000" stroke-width="2.2" />
    <line x1="40" y1="88" x2="110" y2="88" stroke="#000000" stroke-width="2.2" />
    <line x1="75" y1="120" x2="48" y2="165" stroke="#000000" stroke-width="2.2" />
    <line x1="75" y1="120" x2="102" y2="165" stroke="#000000" stroke-width="2.2" />
    <text class="actor-title" x="75" y="186">Học viên</text>
    <text class="actor-role" x="75" y="200">(Primary Learner)</text>
  </g>

  <!-- SYSTEM BOUNDARY -->
  <g transform="translate(260, 110)">
    <rect width="1020" height="900" class="sys-box" />
    <rect x="0" y="0" width="1020" height="42" class="sys-header" />
    <text class="sys-title" x="30" y="27">HỆ SINH THÁI HỌC TẬP THÔNG MINH 3TG STUDY AI (SYSTEM BOUNDARY)</text>

    <!-- COLUMN 1: USE CASES -->
    <g transform="translate(60, 80)">
      <rect width="400" height="64" class="uc-pill" />
      <text class="uc-code" x="200" y="25">USE CASE: UC-01</text>
      <text class="uc-label" x="200" y="46">Đăng ký &amp; Đăng nhập bảo mật (PBKDF2)</text>
    </g>

    <g transform="translate(60, 175)">
      <rect width="400" height="64" class="uc-pill-bold" />
      <text class="uc-code" x="200" y="25">USE CASE: UC-02 (CORE)</text>
      <text class="uc-label" x="200" y="46">Lộ trình học tập phân tầng tương tác Gamification</text>
    </g>

    <g transform="translate(60, 270)">
      <rect width="400" height="64" class="uc-pill-bold" />
      <text class="uc-code" x="200" y="25">USE CASE: UC-03 (CORE FOCUS)</text>
      <text class="uc-label" x="200" y="46">Kích hoạt Phòng học Focus Zen (Kiosk Mode)</text>
    </g>

    <g transform="translate(60, 365)">
      <rect width="400" height="64" class="uc-pill" />
      <text class="uc-code" x="200" y="25">USE CASE: UC-04</text>
      <text class="uc-label" x="200" y="46">Khóa chống sao nhãng Đa màn hình (Multi-Monitor)</text>
    </g>

    <g transform="translate(60, 460)">
      <rect width="400" height="64" class="uc-pill" />
      <text class="uc-code" x="200" y="25">USE CASE: UC-05</text>
      <text class="uc-label" x="200" y="46">Phát nhạc tập trung Local Offline (HTTP 206)</text>
    </g>

    <g transform="translate(60, 555)">
      <rect width="400" height="64" class="uc-pill" />
      <text class="uc-code" x="200" y="25">USE CASE: UC-06</text>
      <text class="uc-label" x="200" y="46">Đọc tài liệu học tập &amp; Đề thi PDF Canvas</text>
    </g>

    <g transform="translate(60, 650)">
      <rect width="400" height="64" class="uc-pill-bold" />
      <text class="uc-code" x="200" y="25">USE CASE: UC-07 (AI VISION)</text>
      <text class="uc-label" x="200" y="46">Hỏi đáp &amp; Dán ảnh giải bài tập (Ctrl + V)</text>
    </g>

    <g transform="translate(60, 745)">
      <rect width="400" height="64" class="uc-pill" />
      <text class="uc-code" x="200" y="25">USE CASE: UC-08</text>
      <text class="uc-label" x="200" y="46">Tra cứu &amp; Quản lý bảo mật Điểm học tập IU</text>
    </g>

    <!-- COLUMN 2: EXTENSIONS & INCLUDES -->
    <g transform="translate(560, 270)">
      <rect width="380" height="64" class="uc-pill" />
      <text class="uc-code" x="190" y="25">USE CASE: UC-09</text>
      <text class="uc-label" x="190" y="46">Ẩn Taskbar &amp; Chặn phím nóng C++ Native</text>
    </g>

    <g transform="translate(560, 460)">
      <rect width="380" height="64" class="uc-pill" />
      <text class="uc-code" x="190" y="25">USE CASE: UC-10</text>
      <text class="uc-label" x="190" y="46">Đồng bộ hai chiều Offline-First (Outbox Queue)</text>
    </g>

    <g transform="translate(560, 650)">
      <rect width="380" height="64" class="uc-pill" />
      <text class="uc-code" x="190" y="25">USE CASE: UC-11</text>
      <text class="uc-label" x="190" y="46">Phân tích hình ảnh OCR &amp; Suy luận Groq Vision</text>
    </g>

    <g transform="translate(560, 745)">
      <rect width="380" height="64" class="uc-pill" />
      <text class="uc-code" x="190" y="25">USE CASE: UC-12</text>
      <text class="uc-label" x="190" y="46">Xóa vĩnh viễn dữ liệu điểm cá nhân khỏi Server</text>
    </g>

    <!-- INCLUDES / EXTENDS -->
    <path d="M 460 302 L 560 302" class="include-line" />
    <text class="stereo-text" x="510" y="295">&lt;&lt;include&gt;&gt;</text>

    <path d="M 260 334 L 260 365" class="include-line" />
    <text class="stereo-text" x="295" y="352">&lt;&lt;include&gt;&gt;</text>

    <path d="M 460 682 L 560 682" class="include-line" />
    <text class="stereo-text" x="510" y="675">&lt;&lt;include&gt;&gt;</text>

    <path d="M 460 777 L 560 777" class="include-line" />
    <text class="stereo-text" x="510" y="770">&lt;&lt;extend&gt;&gt;</text>
  </g>

  <!-- ACTOR 2: AI ASSISTANT (RIGHT TOP) -->
  <g transform="translate(1360, 240)">
    <rect width="180" height="170" class="actor-card" />
    <rect x="65" y="24" width="50" height="42" rx="4" fill="#FFFFFF" stroke="#000000" stroke-width="2" />
    <circle cx="80" cy="42" r="5" fill="#000000" />
    <circle cx="100" cy="42" r="5" fill="#000000" />
    <path d="M 78 54 Q 90 60 102 54" stroke="#000000" stroke-width="2" fill="none" />
    <line x1="90" y1="24" x2="90" y2="12" stroke="#000000" stroke-width="2" />
    <circle cx="90" cy="10" r="4" fill="#000000" />
    <text class="actor-title" x="90" y="105">3TG AI Engine</text>
    <text class="actor-role" x="90" y="125">(Trợ lý Trí tuệ Nhân tạo)</text>
  </g>

  <!-- ACTOR 3: QUẢN TRỊ VIÊN (RIGHT BOTTOM) -->
  <g transform="translate(1360, 680)">
    <rect width="180" height="170" class="actor-card" />
    <circle cx="90" cy="42" r="18" fill="none" stroke="#000000" stroke-width="2.2" />
    <line x1="90" y1="60" x2="90" y2="105" stroke="#000000" stroke-width="2.2" />
    <line x1="60" y1="78" x2="120" y2="78" stroke="#000000" stroke-width="2.2" />
    <line x1="90" y1="105" x2="68" y2="140" stroke="#000000" stroke-width="2.2" />
    <line x1="90" y1="105" x2="112" y2="140" stroke="#000000" stroke-width="2.2" />
    <text class="actor-title" x="90" y="160">Administrator</text>
    <text class="actor-role" x="90" y="176">(Quản trị Hệ thống)</text>
  </g>

  <!-- ASSOCIATIONS -->
  <line x1="210" y1="480" x2="320" y2="222" class="assoc-line" />
  <line x1="210" y1="495" x2="320" y2="317" class="assoc-line" />
  <line x1="210" y1="505" x2="320" y2="412" class="assoc-line" />
  <line x1="210" y1="515" x2="320" y2="507" class="assoc-line" />
  <line x1="210" y1="525" x2="320" y2="602" class="assoc-line" />
  <line x1="210" y1="535" x2="320" y2="697" class="assoc-line" />
  <line x1="210" y1="545" x2="320" y2="792" class="assoc-line" />
  <line x1="210" y1="555" x2="320" y2="887" class="assoc-line" />
  <line x1="1200" y1="792" x2="1360" y2="340" class="assoc-line" />
  <line x1="1200" y1="602" x2="1360" y2="750" class="assoc-line" />
</svg>'''

def generate_black_white_architecture_svg():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="100%" height="100%">
  <defs>
    <style>
      .bg { fill: #FFFFFF; }
      .title { font-family: 'Times New Roman', serif; font-size: 26px; font-weight: bold; fill: #000000; letter-spacing: 0.5px; }
      .subtitle { font-family: 'Times New Roman', serif; font-size: 14px; fill: #333333; font-style: italic; }
      .layer-card { fill: #FFFFFF; stroke: #000000; stroke-width: 1.5; rx: 8; }
      .layer-header { fill: #FFFFFF; stroke: #000000; stroke-width: 1.5; }
      .layer-title { font-family: 'Times New Roman', serif; font-size: 15px; font-weight: bold; fill: #000000; letter-spacing: 0.5px; }
      .comp-box { fill: #FFFFFF; stroke: #000000; stroke-width: 1.2; rx: 4; }
      .comp-title { font-family: 'Times New Roman', serif; font-size: 13.5px; font-weight: bold; fill: #000000; }
      .comp-desc { font-family: 'Times New Roman', serif; font-size: 12px; fill: #222222; }
    </style>
  </defs>

  <rect width="100%" height="100%" class="bg" />

  <!-- Diagram Header -->
  <g transform="translate(60, 48)">
    <text class="title" x="0" y="0">KIẾN TRÚC PHÂN TẦNG HYBRID EDGE-SERVERLESS &amp; DESKTOP CLIENT</text>
    <text class="subtitle" x="0" y="24">Mô hình kiến trúc 4 phân tầng độc lập • Bản thiết kế chuẩn mực đen trắng Học thuật IEEE</text>
    <line x1="0" y1="36" x2="1480" y2="36" stroke="#000000" stroke-width="1.8" />
  </g>

  <!-- LAYER 1 -->
  <g transform="translate(60, 110)">
    <rect width="1480" height="175" class="layer-card" />
    <rect width="1480" height="36" class="layer-header" />
    <text class="layer-title" x="20" y="24">PHÂN TẦNG 1: GIAO DIỆN CLIENT &amp; ELECTRON DESKTOP RUNTIME</text>
    
    <g transform="translate(20, 52)">
      <rect width="330" height="100" class="comp-box" />
      <text class="comp-title" x="16" y="28">Single-Page App UI (HTML5/CSS)</text>
      <text class="comp-desc" x="16" y="50">• CSS Design System Tokens</text>
      <text class="comp-desc" x="16" y="68">• Động cơ Gamification (XP, Streak, Trái tim)</text>
      <text class="comp-desc" x="16" y="86">• Điều hướng đa chế độ (Focus, PDF, Sổ tay)</text>
    </g>

    <g transform="translate(380, 52)">
      <rect width="330" height="100" class="comp-box" />
      <text class="comp-title" x="16" y="28">PDF.js Canvas High-DPI Renderer</text>
      <text class="comp-desc" x="16" y="50">• Quản lý bộ nhớ Web Worker chuyên biệt</text>
      <text class="comp-desc" x="16" y="68">• Xử lý lỗi Detached ArrayBuffer qua slice(0)</text>
      <text class="comp-desc" x="16" y="86">• Tỷ lệ render Canvas 2.0x DPI sắc nét</text>
    </g>

    <g transform="translate(740, 52)">
      <rect width="330" height="100" class="comp-box" />
      <text class="comp-title" x="16" y="28">Clipboard AI OCR &amp; Vision Handler</text>
      <text class="comp-desc" x="16" y="50">• Bắt sự kiện phím tắt toàn cục Ctrl + V</text>
      <text class="comp-desc" x="16" y="68">• Chuyển đổi dữ liệu ảnh Blob sang Base64</text>
      <text class="comp-desc" x="16" y="86">• Hỗ trợ xem trước và gửi truy vấn đa phương thức</text>
    </g>

    <g transform="translate(1100, 52)">
      <rect width="355" height="100" class="comp-box" />
      <text class="comp-title" x="16" y="28">Electron Main Process (main.cjs)</text>
      <text class="comp-desc" x="16" y="50">• Cửa sổ BrowserWindow &amp; Bảo mật ContextIsolation</text>
      <text class="comp-desc" x="16" y="68">• API phát hiện cấu hình Đa màn hình (Screen API)</text>
      <text class="comp-desc" x="16" y="86">• Bộ điều phối giao tiếp tiến trình IPC Handlers</text>
    </g>
  </g>

  <!-- LAYER 2 -->
  <g transform="translate(60, 330)">
    <rect width="1480" height="175" class="layer-card" />
    <rect width="1480" height="36" class="layer-header" />
    <text class="layer-title" x="20" y="24">PHÂN TẦNG 2: TƯƠNG TÁC PHẦN CỨNG &amp; HỆ ĐIỀU HÀNH WIN32 C++ NATIVE</text>

    <g transform="translate(20, 52)">
      <rect width="450" height="100" class="comp-box" />
      <text class="comp-title" x="16" y="28">study_guard.exe (Trình nhị phân C++ Native)</text>
      <text class="comp-desc" x="16" y="50">• Biên dịch tối ưu hóa qua GCC cờ -O3 -s (Dung lượng 24KB)</text>
      <text class="comp-desc" x="16" y="68">• Win32 API: FindWindowA("Shell_TrayWnd")</text>
      <text class="comp-desc" x="16" y="86">• ShowWindow SW_HIDE / SW_SHOW &amp; UpdateWindow</text>
    </g>

    <g transform="translate(500, 52)">
      <rect width="450" height="100" class="comp-box" />
      <text class="comp-title" x="16" y="28">Multi-Monitor Zen Blocker Windows</text>
      <text class="comp-desc" x="16" y="50">• Lặp qua tất cả màn hình phụ screen.getAllDisplays()</text>
      <text class="comp-desc" x="16" y="68">• Cửa sổ toàn màn hình không viền che đen toàn phần</text>
      <text class="comp-desc" x="16" y="86">• Khóa tiêu điểm chuột và bàn phím về bàn học chính</text>
    </g>

    <g transform="translate(980, 52)">
      <rect width="475" height="100" class="comp-box" />
      <text class="comp-title" x="16" y="28">Hệ thống Watchdog khôi phục Taskbar an toàn 100%</text>
      <text class="comp-desc" x="16" y="50">• Thời gian thực thi thực tế đạt mức kỷ lục 2.1ms</text>
      <text class="comp-desc" x="16" y="68">• Hook thoát tiến trình Process Exit &amp; Chống crash app</text>
      <text class="comp-desc" x="16" y="86">• Tầng phòng thủ dự phòng kép qua PowerShell Native</text>
    </g>
  </g>

  <!-- LAYER 3 -->
  <g transform="translate(60, 550)">
    <rect width="1480" height="175" class="layer-card" />
    <rect width="1480" height="36" class="layer-header" />
    <text class="layer-title" x="20" y="24">PHÂN TẦNG 3: MÁY CHỦ NHÚNG CỤC BỘ (EMBEDDED LOCAL HTTP SERVER PORT 8787)</text>

    <g transform="translate(20, 52)">
      <rect width="450" height="100" class="comp-box" />
      <text class="comp-title" x="16" y="28">Trình phát nhạc cục bộ chuẩn HTTP 206 Byte-Range</text>
      <text class="comp-desc" x="16" y="50">• Đọc tệp âm thanh trực tiếp từ ổ cứng (MP3, WAV, FLAC)</text>
      <text class="comp-desc" x="16" y="68">• Phân tích tiêu đề Range Header phục vụ tua bài hát</text>
      <text class="comp-desc" x="16" y="86">• 0 byte tải lên đám mây: Bảo mật riêng tư 100%</text>
    </g>

    <g transform="translate(500, 52)">
      <rect width="450" height="100" class="comp-box" />
      <text class="comp-title" x="16" y="28">Bộ nhớ đệm SQLite Local Replica</text>
      <text class="comp-desc" x="16" y="50">• CSDL sao lưu cục bộ local_replica.sqlite (33 bảng 3NF)</text>
      <text class="comp-desc" x="16" y="68">• Phục vụ đọc tức thì, độ trễ giao diện = 0ms</text>
      <text class="comp-desc" x="16" y="86">• Hàng đợi Transactional Outbox ghi nhận thay đổi offline</text>
    </g>

    <g transform="translate(980, 52)">
      <rect width="475" height="100" class="comp-box" />
      <text class="comp-title" x="16" y="28">Internal API Gateway &amp; Reverse Proxy</text>
      <text class="comp-desc" x="16" y="50">• Thực thi mã nguồn Worker Engine nội bộ (src/index.js)</text>
      <text class="comp-desc" x="16" y="68">• Xác minh Session Token và kiểm tra quyền tài khoản</text>
      <text class="comp-desc" x="16" y="86">• Điều phối đồng bộ hai chiều giữa Local và Cloud</text>
    </g>
  </g>

  <!-- LAYER 4 -->
  <g transform="translate(60, 770)">
    <rect width="1480" height="175" class="layer-card" />
    <rect width="1480" height="36" class="layer-header" />
    <text class="layer-title" x="20" y="24">PHÂN TẦNG 4: ĐÁM MÂY BIÊN CLOUDFLARE SERVERLESS EDGE &amp; GROQ AI INFERENCE</text>

    <g transform="translate(20, 52)">
      <rect width="450" height="100" class="comp-box" />
      <text class="comp-title" x="16" y="28">Cloudflare Workers V8 Edge Router</text>
      <text class="comp-desc" x="16" y="50">• Triển khai trên 300+ thành phố biên toàn cầu (&lt;20ms)</text>
      <text class="comp-desc" x="16" y="68">• Băm mật khẩu PBKDF2-HMAC-SHA256 (100,000 vòng lặp)</text>
      <text class="comp-desc" x="16" y="86">• Bộ chặn tấn công Brute-force Sliding Window Rate Limiter</text>
    </g>

    <g transform="translate(500, 52)">
      <rect width="450" height="100" class="comp-box" />
      <text class="comp-title" x="16" y="28">Cloudflare D1 Distributed SQL (Chuẩn 3NF)</text>
      <text class="comp-desc" x="16" y="50">• Xác thực thời gian Pomodoro phía Server (Zero Client Trust)</text>
      <text class="comp-desc" x="16" y="68">• Truy vấn Prepared Statements: Chống tuyệt đối SQL Injection</text>
      <text class="comp-desc" x="16" y="86">• API xóa dữ liệu vĩnh viễn bảng điểm đảm bảo quyền riêng tư</text>
    </g>

    <g transform="translate(980, 52)">
      <rect width="475" height="100" class="comp-box" />
      <text class="comp-title" x="16" y="28">Động cơ suy luận Groq LPU &amp; Vision Engine</text>
      <text class="comp-desc" x="16" y="50">• Mô hình ngôn ngữ lớn tốc độ cao phản hồi &lt;0.3 giây</text>
      <text class="comp-desc" x="16" y="68">• Thị giác máy tính nhận diện và giải đáp bài tập qua ảnh</text>
      <text class="comp-desc" x="16" y="86">• Cơ chế tự động chuyển tiếp Fallback an toàn</text>
    </g>
  </g>

</svg>'''

def generate_black_white_sequence_svg():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1050" width="100%" height="100%">
  <defs>
    <style>
      .bg { fill: #FFFFFF; }
      .title { font-family: 'Times New Roman', serif; font-size: 26px; font-weight: bold; fill: #000000; letter-spacing: 0.5px; }
      .subtitle { font-family: 'Times New Roman', serif; font-size: 14px; fill: #333333; font-style: italic; }
      .part-box { fill: #FFFFFF; stroke: #000000; stroke-width: 1.5; rx: 4; }
      .part-title { font-family: 'Times New Roman', serif; font-size: 14px; font-weight: bold; fill: #000000; text-anchor: middle; }
      .part-sub { font-family: 'Times New Roman', serif; font-size: 11px; fill: #444444; text-anchor: middle; }
      .lifeline { stroke: #000000; stroke-width: 1.2; stroke-dasharray: 6,6; }
      .msg-sync { stroke: #000000; stroke-width: 1.6; fill: none; marker-end: url(#arr-bw); }
      .msg-reply { stroke: #000000; stroke-width: 1.4; stroke-dasharray: 5,4; fill: none; marker-end: url(#arr-bw); }
      .msg-text { font-family: 'Times New Roman', serif; font-size: 12.5px; font-weight: bold; fill: #000000; }
      .msg-note { font-family: 'Consolas', monospace; font-size: 11px; fill: #444444; }
      .loop-box { fill: #FFFFFF; stroke: #000000; stroke-width: 1.2; stroke-dasharray: 4,4; rx: 4; }
      .loop-tag { fill: #FFFFFF; stroke: #000000; stroke-width: 1.2; }
      .loop-text { font-family: 'Times New Roman', serif; font-size: 11px; font-weight: bold; fill: #000000; }
      .time-badge { font-family: 'Consolas', monospace; font-size: 11px; font-weight: bold; fill: #000000; }
    </style>
    <marker id="arr-bw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#000000" />
    </marker>
  </defs>

  <rect width="100%" height="100%" class="bg" />

  <!-- Diagram Header -->
  <g transform="translate(60, 48)">
    <text class="title" x="0" y="0">SƠ ĐỒ TUẦN TỰ KÍCH HOẠT FOCUS KIOSK &amp; KHÔI PHỤC TASKBAR C++</text>
    <text class="subtitle" x="0" y="24">Trình tự điều khiển Win32 Native API • Đo lường độ trễ phục hồi &lt;2.1ms • Đảm bảo toàn vẹn giao diện Windows 100%</text>
    <line x1="0" y1="36" x2="1480" y2="36" stroke="#000000" stroke-width="1.8" />
  </g>

  <!-- PARTICIPANTS (LIFELINES) -->
  <g transform="translate(100, 110)">
    <rect width="180" height="52" class="part-box" />
    <text class="part-title" x="90" y="24">Học viên (User)</text>
    <text class="part-sub" x="90" y="40">Giao diện tương tác</text>
    <line x1="90" y1="52" x2="90" y2="900" class="lifeline" />
  </g>

  <g transform="translate(380, 110)">
    <rect width="180" height="52" class="part-box" />
    <text class="part-title" x="90" y="24">Electron UI</text>
    <text class="part-sub" x="90" y="40">Renderer Process</text>
    <line x1="90" y1="52" x2="90" y2="900" class="lifeline" />
  </g>

  <g transform="translate(660, 110)">
    <rect width="180" height="52" class="part-box" />
    <text class="part-title" x="90" y="24">IPC Main Process</text>
    <text class="part-sub" x="90" y="40">main.cjs Controller</text>
    <line x1="90" y1="52" x2="90" y2="900" class="lifeline" />
  </g>

  <g transform="translate(940, 110)">
    <rect width="180" height="52" class="part-box" />
    <text class="part-title" x="90" y="24">study_guard.exe</text>
    <text class="part-sub" x="90" y="40">C++ Win32 Native</text>
    <line x1="90" y1="52" x2="90" y2="900" class="lifeline" />
  </g>

  <g transform="translate(1220, 110)">
    <rect width="200" height="52" class="part-box" />
    <text class="part-title" x="100" y="24">Windows OS Shell</text>
    <text class="part-sub" x="100" y="40">Shell_TrayWnd &amp; Explorer</text>
    <line x1="100" y1="52" x2="100" y2="900" class="lifeline" />
  </g>

  <!-- SEQUENCE STEPS -->
  <line x1="190" y1="200" x2="470" y2="200" class="msg-sync" />
  <text class="msg-text" x="200" y="192">1. Nhấn nút 'Bắt đầu học tập (Zen Mode)'</text>

  <line x1="470" y1="240" x2="750" y2="240" class="msg-sync" />
  <text class="msg-text" x="480" y="232">2. ipcRenderer.invoke('start-kiosk-mode')</text>

  <line x1="750" y1="280" x2="1030" y2="280" class="msg-sync" />
  <text class="msg-text" x="760" y="272">3. spawn('study_guard.exe', ['--parent-pid', pid])</text>

  <line x1="1030" y1="320" x2="1320" y2="320" class="msg-sync" />
  <text class="msg-text" x="1040" y="312">4. FindWindowA('Shell_TrayWnd') ➔ ShowWindow(SW_HIDE)</text>
  <text class="time-badge" x="1040" y="338">LATENCY: ~1.2ms</text>

  <line x1="1320" y1="360" x2="1030" y2="360" class="msg-reply" />
  <text class="msg-note" x="1090" y="352">Taskbar &amp; Start Button Hidden (0x0)</text>

  <line x1="1030" y1="400" x2="750" y2="400" class="msg-reply" />
  <text class="msg-note" x="790" y="392">stdout.write('GUARD_READY\n')</text>

  <path d="M 750 430 L 800 430 L 800 455 L 750 455" class="msg-sync" />
  <text class="msg-text" x="808" y="446">7. openSecondaryBlockers(screen.getAllDisplays())</text>

  <line x1="750" y1="485" x2="470" y2="485" class="msg-reply" />
  <text class="msg-note" x="510" y="478">{ ok: true, ready: true, pid: guardPid }</text>

  <!-- LOOP -->
  <rect x="150" y="520" width="1220" height="175" class="loop-box" />
  <rect x="150" y="520" width="130" height="24" class="loop-tag" />
  <text class="loop-text" x="160" y="536">LOOP: ZEN STUDY</text>
  <text class="msg-text" x="300" y="538">Phiên học tập trung sâu 50 phút • Phục vụ nhạc Local qua HTTP 206 • Chụp ảnh đề &amp; Ctrl + V hỏi AI</text>

  <line x1="190" y1="575" x2="470" y2="575" class="msg-sync" />
  <text class="msg-text" x="200" y="567">Học viên đọc tài liệu PDF.js Canvas &amp; thao tác bàn phím</text>

  <line x1="470" y1="615" x2="190" y2="615" class="msg-reply" />
  <text class="msg-note" x="200" y="607">Chặn toàn bộ Alt, Alt+Tab, Win Key; Cho phép phím soạn thảo và Ctrl+Q</text>

  <line x1="190" y1="655" x2="470" y2="655" class="msg-sync" />
  <text class="msg-text" x="200" y="647">Dán ảnh màn hình Ctrl + V ➔ 3TG AI Groq phản hồi gợi ý trong 0.28 giây</text>

  <!-- EXIT & RESTORE -->
  <line x1="190" y1="730" x2="470" y2="730" class="msg-sync" />
  <text class="msg-text" x="200" y="722">9. Nhấn phím 'Ctrl + Q' hoặc Hết giờ ca học</text>

  <line x1="470" y1="770" x2="750" y2="770" class="msg-sync" />
  <text class="msg-text" x="480" y="762">10. ipcRenderer.invoke('stop-kiosk-mode')</text>

  <line x1="750" y1="810" x2="1030" y2="810" class="msg-sync" />
  <text class="msg-text" x="760" y="802">11. spawnSync('study_guard.exe', ['--restore'])</text>

  <line x1="1030" y1="850" x2="1320" y2="850" class="msg-sync" />
  <text class="msg-text" x="1040" y="842">12. ShowWindow(SW_SHOW) &amp; UpdateWindow(hTaskbar)</text>
  <text class="time-badge" x="1040" y="868">KHÔI PHỤC HOÀN TOÀN TRONG: 2.1ms (100% TASKBAR RESTORED)</text>

  <line x1="750" y1="895" x2="470" y2="895" class="msg-reply" />
  <text class="msg-note" x="500" y="888">closeSecondaryBlockers() &amp; Hiển thị bảng tổng kết phiên học (+100 XP)</text>
</svg>'''

def main():
    target_dir = r'tổng kết dự án/figures'
    os.makedirs(target_dir, exist_ok=True)
    
    files = {
        'fig_erd_database.svg': generate_full_d1_svg(),
        'fig_use_case_diagram.svg': generate_black_white_use_case_svg(),
        'fig_system_architecture.svg': generate_black_white_architecture_svg(),
        'fig_sequence_kiosk.svg': generate_black_white_sequence_svg()
    }
    
    for fname, content in files.items():
        p = os.path.join(target_dir, fname)
        with open(p, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Generated B&W SVG: {fname} ({len(content)} bytes)")

    # Render ultra high resolution 300 DPI PNGs for Word document
    chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    temp_profile = os.path.join(tempfile.gettempdir(), 'chrome_svg_profile_bw')
    
    for fname in files.keys():
        svg_path = os.path.abspath(os.path.join(target_dir, fname))
        png_path = os.path.abspath(os.path.join(target_dir, fname.replace('.svg', '.png')))
        # Wide resolution for comprehensive ERD
        w = 3200 if 'erd' in fname else 2400
        h = 2200 if 'erd' in fname else 1600
        cmd = [
            chrome,
            '--headless',
            '--disable-gpu',
            f'--user-data-dir={temp_profile}',
            f'--screenshot={png_path}',
            f'--window-size={w},{h}',
            f'file:///{svg_path}'
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
        if os.path.exists(png_path):
            print(f"Rendered PNG: {png_path} ({os.path.getsize(png_path)} bytes)")
        else:
            print(f"Error rendering {fname}: {res.stderr}")

if __name__ == '__main__':
    main()
