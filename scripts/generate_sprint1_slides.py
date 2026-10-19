"""
Script: generate_sprint1_slides.py
Creates:
1. PowerPoint (.pptx): 'SLIDE_THUYET_TRINH_SPRINT_1_THO_7_MAU.pptx' in 'tổng kết sprint 1'
2. Interactive HTML Deck: 'slide_thuyet_trinh_tho_7_mau.html' in 'tổng kết sprint 1'

Theme: Thỏ 7 Màu Kawaii & Professional Agile Sprint Presentation
"""

import os
import pptx
from pptx.util import Inches, Pt
from pptx.enum.shapes import MSO_SHAPE
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

# Color Palette Constants (Kawaii Thỏ 7 Màu & Clean Professional UI)
COLOR_BG = RGBColor(255, 247, 250)         # Soft Cream Blush #FFF7FA
COLOR_WHITE = RGBColor(255, 255, 255)      # Pure White #FFFFFF
COLOR_PRIMARY_PINK = RGBColor(255, 92, 138)# Vibrant Kawaii Pink #FF5C8A
COLOR_DEEP_BERRY = RGBColor(225, 29, 72)   # Deep Berry Rose #E11D48
COLOR_DARK_TEXT = RGBColor(30, 41, 59)     # Charcoal Slate #1E293B
COLOR_MUTED_TEXT = RGBColor(100, 116, 139) # Slate Muted #64748B
COLOR_CARD_BORDER = RGBColor(254, 205, 211)# Soft Pink Border #FECDD3
COLOR_CALLOUT_BG = RGBColor(255, 241, 242) # Callout Blush #FFF1F2
COLOR_ACCENT_YELLOW = RGBColor(245, 158, 11)# Gold Yellow #F59E0B
COLOR_ACCENT_PURPLE = RGBColor(139, 92, 246)# Soft Purple #8B5CF6
COLOR_ACCENT_GREEN = RGBColor(16, 185, 129)# Mint Green #10B981

def add_full_background(slide):
    """Draws full slide soft blush background with rainbow accent strip at top."""
    # Base background
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg.fill.solid()
    bg.fill.fore_color.rgb = COLOR_BG
    bg.line.fill.background()

    # Top Rainbow Accent Ribbon (Thỏ 7 Màu signature)
    colors = [
        RGBColor(239, 68, 68),   # Red
        RGBColor(249, 115, 22),  # Orange
        RGBColor(234, 179, 8),   # Yellow
        RGBColor(34, 197, 94),   # Green
        RGBColor(6, 182, 212),   # Cyan
        RGBColor(59, 130, 246),  # Blue
        RGBColor(168, 85, 247)   # Purple
    ]
    seg_w = 13.333 / 7.0
    for idx, c in enumerate(colors):
        ribbon = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(idx * seg_w), 0, Inches(seg_w + 0.05), Inches(0.08))
        ribbon.fill.solid()
        ribbon.fill.fore_color.rgb = c
        ribbon.line.fill.background()

def add_slide_header(slide, title, category="TỔNG KẾT SPRINT 1 • DỰ ÁN 3TG ALL-IN-ONE", slide_num=1, total_slides=14):
    """Creates a cute, modern header with category chip, title and slide counter."""
    # Category Chip
    chip = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.28), Inches(4.5), Inches(0.32))
    chip.fill.solid()
    chip.fill.fore_color.rgb = RGBColor(255, 228, 235)
    chip.line.color.rgb = COLOR_PRIMARY_PINK
    chip.line.width = Pt(1)
    tf_c = chip.text_frame
    tf_c.word_wrap = False
    p_c = tf_c.paragraphs[0]
    p_c.text = f"🌸 {category}"
    p_c.font.name = "Arial"
    p_c.font.size = Pt(9.5)
    p_c.font.bold = True
    p_c.font.color.rgb = COLOR_DEEP_BERRY

    # Main Title
    tb_tit = slide.shapes.add_textbox(Inches(0.8), Inches(0.62), Inches(9.5), Inches(0.65))
    tf_t = tb_tit.text_frame
    tf_t.word_wrap = True
    p_t = tf_t.paragraphs[0]
    p_t.text = title
    p_t.font.name = "Arial"
    p_t.font.size = Pt(21)
    p_t.font.bold = True
    p_t.font.color.rgb = COLOR_DARK_TEXT

    # Counter Pill at Top Right
    pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(11.4), Inches(0.35), Inches(1.1), Inches(0.35))
    pill.fill.solid()
    pill.fill.fore_color.rgb = COLOR_WHITE
    pill.line.color.rgb = COLOR_CARD_BORDER
    pill.line.width = Pt(1)
    tf_p = pill.text_frame
    p_p = tf_p.paragraphs[0]
    p_p.alignment = PP_ALIGN.CENTER
    p_p.text = f"{slide_num:02d} / {total_slides:02d}"
    p_p.font.name = "Arial"
    p_p.font.size = Pt(10)
    p_p.font.bold = True
    p_p.font.color.rgb = COLOR_PRIMARY_PINK

def add_mascot_with_speech(slide, left, top, img_path, quote, char_title="Thỏ Bảy Màu cố vấn", img_width=1.8, bubble_width=3.6):
    """Adds a cute framed mascot image and an adjoining speech bubble card."""
    # Mascot Image Frame
    frame = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(img_width + 0.1), Inches(img_width * 1.05))
    frame.fill.solid()
    frame.fill.fore_color.rgb = COLOR_WHITE
    frame.line.color.rgb = COLOR_PRIMARY_PINK
    frame.line.width = Pt(1.5)

    if os.path.exists(img_path):
        slide.shapes.add_picture(
            img_path,
            Inches(left + 0.05),
            Inches(top + 0.05),
            width=Inches(img_width)
        )

    # Speech Bubble Card
    b_left = left + img_width + 0.18
    b_top = top
    bubble = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(b_left), Inches(b_top), Inches(bubble_width), Inches(1.4))
    bubble.fill.solid()
    bubble.fill.fore_color.rgb = COLOR_CALLOUT_BG
    bubble.line.color.rgb = COLOR_PRIMARY_PINK
    bubble.line.width = Pt(1.5)

    tf_b = bubble.text_frame
    tf_b.word_wrap = True
    tf_b.margin_left = Inches(0.15)
    tf_b.margin_right = Inches(0.15)
    tf_b.margin_top = Inches(0.12)
    tf_b.margin_bottom = Inches(0.1)

    p1 = tf_b.paragraphs[0]
    p1.text = f"💬 {char_title}:"
    p1.font.name = "Arial"
    p1.font.size = Pt(10)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_DEEP_BERRY

    p2 = tf_b.add_paragraph()
    p2.text = f'"{quote}"'
    p2.font.name = "Arial"
    p2.font.size = Pt(9.5)
    p2.font.italic = True
    p2.font.color.rgb = COLOR_DARK_TEXT

def add_card(slide, left, top, width, height, bg_color=COLOR_WHITE, border_color=COLOR_CARD_BORDER, border_width=1.2):
    """Draws a crisp white rounded content card."""
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    card.fill.solid()
    card.fill.fore_color.rgb = bg_color
    card.line.color.rgb = border_color
    card.line.width = Pt(border_width)
    return card

def build_presentation():
    base_folder = r"c:\Users\LeVanAn\Documents\ChatGPT\app study 2"
    char_dir = os.path.join(base_folder, "character")
    sprint_dir = os.path.join(base_folder, "tổng kết sprint 1")

    # Images
    img_welcome = os.path.join(char_dir, "download.jpg")
    img_warrior = os.path.join(char_dir, "download (2)9.jpg")
    img_thinking = os.path.join(char_dir, "Thỏ bảy màu.jpg")
    img_maid = os.path.join(char_dir, "download (1)9.jpg")
    img_phone = os.path.join(char_dir, "download99.jpg")
    img_celebrate = os.path.join(char_dir, "AoV.jpg")
    img_shocked = os.path.join(char_dir, "Thỏ bảy màu8.jpg")
    
    img_erd = os.path.join(sprint_dir, "erd_preview.png")
    img_ss1 = os.path.join(sprint_dir, "Screenshot 2026-10-18 180117.png")
    img_ss2 = os.path.join(sprint_dir, "Screenshot 2026-10-18 180227.png")
    img_ss3 = os.path.join(sprint_dir, "Screenshot 2026-10-18 180301.png")

    prs = pptx.Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # ========================================================
    # SLIDE 1: TRANG BÌA (COVER SLIDE)
    # ========================================================
    s1 = prs.slides.add_slide(blank_layout)
    add_full_background(s1)

    # University & Department Badge
    badge_u = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.7), Inches(6.0), Inches(0.4))
    badge_u.fill.solid()
    badge_u.fill.fore_color.rgb = COLOR_WHITE
    badge_u.line.color.rgb = COLOR_CARD_BORDER
    p = badge_u.text_frame.paragraphs[0]
    p.text = "🏛️ TRƯỜNG ĐẠI HỌC CMC • KHOA CÔNG NGHỆ THÔNG TIN"
    p.font.name = "Arial"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = COLOR_DARK_TEXT

    # Main Big Title Box
    t_box = s1.shapes.add_textbox(Inches(0.8), Inches(1.25), Inches(7.2), Inches(2.2))
    tf = t_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "BÁO CÁO TỔNG KẾT\nSPRINT 1"
    p.font.name = "Arial"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = COLOR_DEEP_BERRY

    p2 = tf.add_paragraph()
    p2.text = "ĐỀ TÀI: NỀN TẢNG QUẢN LÝ HỌC TẬP GAMIFICATION \"3TG\" ALL-IN-ONE"
    p2.font.name = "Arial"
    p2.font.size = Pt(13)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_DARK_TEXT

    p3 = tf.add_paragraph()
    p3.text = "Học phần: Công nghệ phần mềm - K4 (Mã môn: INFO2011) • Giảng viên hướng dẫn"
    p3.font.name = "Arial"
    p3.font.size = Pt(11)
    p3.font.color.rgb = COLOR_MUTED_TEXT

    # Left Metadata Card
    c_meta = add_card(s1, 0.8, 3.65, 6.8, 3.3)
    tf_m = c_meta.text_frame
    tf_m.word_wrap = True
    tf_m.margin_left = Inches(0.3)
    tf_m.margin_top = Inches(0.25)
    
    pm1 = tf_m.paragraphs[0]
    pm1.text = "📌 THÔNG TIN DỰ ÁN & ĐỘI NGŨ THỰC HIỆN:"
    pm1.font.bold = True
    pm1.font.size = Pt(12)
    pm1.font.color.rgb = COLOR_DEEP_BERRY

    meta_items = [
        ("Nhóm sinh viên:", "NHÓM 3TG (Agile / Scrum Team)"),
        ("1. Lê Văn An (Trưởng nhóm):", "Scrum Master & AI / Cloud Architect"),
        ("2. Nguyễn Như Quỳnh:", "Product Owner & Lead UI/UX / Frontend"),
        ("3. Nguyễn Văn Tú:", "Database Engineer, Backend & QA/Tester"),
        ("Thời gian thực hiện Sprint 1:", "05/10/2026 – 18/10/2026 (2 tuần chuẩn Scrum)"),
        ("Trạng thái nghiệm thu:", "38/38 Story Points (100% Hoàn thành, 0 Bug)")
    ]
    for lbl, val in meta_items:
        p = tf_m.add_paragraph()
        p.space_before = Pt(3)
        r1 = p.add_run(); r1.text = f"• {lbl} "
        r1.font.bold = True
        r1.font.size = Pt(10)
        r1.font.color.rgb = COLOR_DARK_TEXT
        r2 = p.add_run(); r2.text = val
        r2.font.size = Pt(10)
        r2.font.color.rgb = COLOR_DEEP_BERRY if "100%" in val else COLOR_MUTED_TEXT

    # Right Hero Mascot Card
    c_hero = add_card(s1, 7.9, 1.25, 4.6, 5.7, bg_color=COLOR_WHITE, border_color=COLOR_PRIMARY_PINK, border_width=2)
    if os.path.exists(img_welcome):
        s1.shapes.add_picture(img_welcome, Inches(8.35), Inches(1.5), width=Inches(3.7))

    # Speech box inside hero
    sp_box = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.15), Inches(5.1), Inches(4.1), Inches(1.6))
    sp_box.fill.solid()
    sp_box.fill.fore_color.rgb = COLOR_CALLOUT_BG
    sp_box.line.color.rgb = COLOR_PRIMARY_PINK
    sp_box.line.width = Pt(1.5)
    tf_sp = sp_box.text_frame
    tf_sp.word_wrap = True
    tf_sp.margin_left = Inches(0.2)
    tf_sp.margin_top = Inches(0.15)
    p = tf_sp.paragraphs[0]
    p.text = "💬 Thỏ Bảy Màu chào cả nhà:"
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = COLOR_DEEP_BERRY
    p2 = tf_sp.add_paragraph()
    p2.text = '"Chào mừng Thầy Cô và các bạn đến với buổi báo cáo Sprint 1 của team 3TG! Cùng khám phá cách tụi mình biến bài học thành game phiêu lưu cực cuốn nhé! 🐰✨"'
    p2.font.size = Pt(10)
    p2.font.italic = True
    p2.font.color.rgb = COLOR_DARK_TEXT

    # ========================================================
    # SLIDE 2: ĐỘI NGŨ DỰ ÁN & PHÂN VAI SCRUM
    # ========================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_full_background(s2)
    add_slide_header(s2, "ĐỘI NGŨ DỰ ÁN & PHÂN VAI TRÁCH NHIỆM SCRUM", slide_num=2)

    # 3 Member Cards
    team_members = [
        ("LÊ VĂN AN", "Trưởng nhóm • Scrum Master", "AI & Cloud Architect", [
            "Điều phối nhịp độ Scrum, chủ trì Daily & Retro",
            "Loại bỏ các rào cản kỹ thuật & tối ưu tiến độ",
            "Thiết kế kiến trúc Cloudflare D1 & RAG AI Engine",
            "Bảo đảm tuân thủ quy chuẩn DoD và chất lượng mã nguồn"
        ], COLOR_PRIMARY_PINK),
        ("NGUYỄN NHƯ QUỲNH", "Product Owner", "Lead UI/UX & Frontend Developer", [
            "Quản lý & ưu tiên hóa Product Backlog theo giá trị",
            "Thiết kế Design System & Mascot Thỏ Bảy Màu 20 trạng thái",
            "Xây dựng giao diện Gamification, Lộ trình học & Tủ huy hiệu",
            "Đại diện tiếng nói của sinh viên để nghiệm thu tính năng"
        ], COLOR_ACCENT_PURPLE),
        ("NGUYỄN VĂN TÚ", "Database & Backend Engineer", "Lead QA / Test Automation", [
            "Chuẩn hóa Cơ sở dữ liệu 3NF (21 bảng, 108 thuộc tính)",
            "Xây dựng RESTful API cho lộ trình và học liệu",
            "Viết kịch bản kiểm thử tự động (Unit & Integration Test)",
            "Tối ưu hóa độ trễ truy vấn Edge SQLite < 50ms"
        ], COLOR_ACCENT_YELLOW)
    ]

    for idx, (name, role, title, tasks, border_c) in enumerate(team_members):
        cx = 0.8 + idx * 4.0
        c = add_card(s2, cx, 1.45, 3.75, 4.2, border_color=border_c, border_width=1.8)
        tf = c.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.22)
        tf.margin_right = Inches(0.2)
        tf.margin_top = Inches(0.22)
        
        # Avatar placeholder badge
        p = tf.paragraphs[0]
        p.text = f"👤 {name}"
        p.font.name = "Arial"
        p.font.bold = True
        p.font.size = Pt(13)
        p.font.color.rgb = COLOR_DARK_TEXT

        p_r = tf.add_paragraph()
        p_r.text = role
        p_r.font.bold = True
        p_r.font.size = Pt(10.5)
        p_r.font.color.rgb = COLOR_DEEP_BERRY

        p_t = tf.add_paragraph()
        p_t.text = title
        p_t.font.italic = True
        p_t.font.size = Pt(9.5)
        p_t.font.color.rgb = COLOR_MUTED_TEXT

        p_div = tf.add_paragraph()
        p_div.text = "—" * 28
        p_div.font.size = Pt(8)
        p_div.font.color.rgb = COLOR_CARD_BORDER

        for t in tasks:
            pt = tf.add_paragraph()
            pt.space_before = Pt(3)
            r = pt.add_run(); r.text = f"✓ {t}"
            r.font.size = Pt(9.5)
            r.font.color.rgb = COLOR_DARK_TEXT

    # Bottom Mascot Callout
    add_mascot_with_speech(
        s2, left=0.8, top=5.8, img_path=img_warrior,
        quote="Đội hình tam giác vàng 3TG: Phối hợp nhịp nhàng, chia việc rõ ràng theo RACI, không ai bị bỏ lại phía sau! ⚔️🔥",
        char_title="Thỏ Chiến Binh khích lệ", img_width=1.2, bubble_width=9.5
    )

    # ========================================================
    # SLIDE 3: BỐI CẢNH & VẤN ĐỀ THỰC TẾ
    # ========================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_full_background(s3)
    add_slide_header(s3, "BỐI CẢNH DỰ ÁN & NỖI ĐAU HỆ THỐNG TRUYỀN THỐNG", slide_num=3)

    # Left: EduX Pain Points Card
    c_pain = add_card(s3, 0.8, 1.45, 5.6, 4.1, border_color=RGBColor(248, 113, 113), border_width=1.5)
    tf_p = c_pain.text_frame
    tf_p.word_wrap = True
    tf_p.margin_left = Inches(0.25)
    tf_p.margin_top = Inches(0.22)
    p = tf_p.paragraphs[0]
    p.text = "⚠️ HẠN CHẾ CỦA HỆ THỐNG TRUYỀN THỐNG (EduX):"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = RGBColor(220, 38, 38)

    pains = [
        ("Giao diện khô khan, buồn ngủ:", "Giao diện danh mục xơ cứng, thiếu tính tương tác sinh động, sinh viên cảm thấy áp lực và chán nản."),
        ("Công cụ học tập bị rời rạc:", "Học slide một nơi, ghi chú mở file Word/Notion riêng, làm bài tập chuyển qua link khác, khó tập trung."),
        ("Thiếu động lực duy trì thói quen:", "Không có cơ chế vinh danh, không có chuỗi ngày học (streak) nên sinh viên dễ bỏ dở giữa chừng."),
        ("Trợ giúp bài vở bị nghẽn:", "Giảng viên và trợ giảng không thể hỗ trợ 24/7, sinh viên gặp câu khó dễ nản lòng và tích tụ lỗ hổng kiến thức.")
    ]
    for h, b in pains:
        pt = tf_p.add_paragraph()
        pt.space_before = Pt(4)
        r1 = pt.add_run(); r1.text = f"• {h} "
        r1.font.bold = True
        r1.font.size = Pt(10)
        r1.font.color.rgb = COLOR_DARK_TEXT
        r2 = pt.add_run(); r2.text = b
        r2.font.size = Pt(9.5)
        r2.font.color.rgb = COLOR_MUTED_TEXT

    # Right: 3TG Breakthrough Card
    c_sol = add_card(s3, 6.7, 1.45, 5.8, 4.1, border_color=COLOR_PRIMARY_PINK, border_width=1.5)
    tf_s = c_sol.text_frame
    tf_s.word_wrap = True
    tf_s.margin_left = Inches(0.25)
    tf_s.margin_top = Inches(0.22)
    p = tf_s.paragraphs[0]
    p.text = "✨ ĐỘT PHÁ CỦA NỀN TẢNG 3TG ALL-IN-ONE:"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_DEEP_BERRY

    solutions = [
        ("Gamification Duolingo-style:", "Biến 10 môn học thành 106 cửa ải phiêu lưu, vượt ải mở rương, tích lũy XP, Tim và Đá quý."),
        ("All-in-One Cẩm nang tích hợp:", "Ghi chú, code mẫu và công thức trọng tâm tự động đồng bộ theo từng slide bài học."),
        ("Trợ giảng AI RAG an toàn 24/7:", "Hỏi đáp ngay tại cửa ải học tập, giải thích từng bước dựa trên tài liệu chuẩn mà không lộ đề thi."),
        ("Linh hồn Thỏ Bảy Màu vui nhộn:", "Mascot đồng hành động viên khi đúng, an ủi khi sai, tạo cảm xúc tích cực cho người học.")
    ]
    for h, b in solutions:
        pt = tf_s.add_paragraph()
        pt.space_before = Pt(4)
        r1 = pt.add_run(); r1.text = f"★ {h} "
        r1.font.bold = True
        r1.font.size = Pt(10)
        r1.font.color.rgb = COLOR_DEEP_BERRY
        r2 = pt.add_run(); r2.text = b
        r2.font.size = Pt(9.5)
        r2.font.color.rgb = COLOR_DARK_TEXT

    # Bottom Mascot Callout
    add_mascot_with_speech(
        s3, left=0.8, top=5.75, img_path=img_thinking,
        quote="Học đại học đâu cần phải khô khan! Thỏ và 3TG muốn mỗi ngày mở app lên, sinh viên đều cảm thấy hào hứng như mở một tựa game yêu thích! 💡🎒",
        char_title="Thỏ Bảy Màu trăn trở", img_width=1.25, bubble_width=9.5
    )

    # ========================================================
    # SLIDE 4: 5 TRỤ CỘT CỐT LÕI CỦA 3TG
    # ========================================================
    s4 = prs.slides.add_slide(blank_layout)
    add_full_background(s4)
    add_slide_header(s4, "NĂM TRỤ CỘT CỐT LÕI TẠO NÊN SỨC MẠNH CỦA 3TG", slide_num=4)

    pillars = [
        ("1. GAMIFICATION TƯƠNG TÁC", "Trái tim & Động lực", [
            "Cơ chế 5 Tim (Hearts) thử thách",
            "Đá quý (Gems) & Điểm kinh nghiệm (XP)",
            "Chuỗi ngày học rực lửa (Streak)",
            "Tủ huy hiệu vinh danh 12 thành tích"
        ], COLOR_DEEP_BERRY),
        ("2. TRỢ GIẢNG AI BẢO MẬT", "Trí tuệ nhân tạo RAG", [
            "Hỏi đáp bám sát ngữ cảnh từng môn học",
            "Mô hình cục bộ bảo mật, không lộ đề",
            "Giải thích cặn kẽ thuật toán & code",
            "Hỗ trợ streaming phản hồi siêu mượt"
        ], COLOR_ACCENT_PURPLE),
        ("3. CẨM NANG ALL-IN-1", "Học sâu & Nhớ lâu", [
            "Tóm tắt kiến thức cốt lõi từng bài",
            "Ghi chú cá nhân tự động đồng bộ",
            "Kho câu hỏi làm sai để ôn tập lại",
            "Tích hợp tài liệu chính khóa CMC"
        ], COLOR_PRIMARY_PINK),
        ("4. SERVERLESS CLOUDFLARE", "Kiến trúc tương lai", [
            "Cloudflare D1 SQLite phân tán",
            "Độ trễ API cực thấp (< 50ms)",
            "Chuẩn hóa CSDL 3NF (21 bảng)",
            "Chi phí vận hành tối ưu, sẵn sàng mở rộng"
        ], COLOR_ACCENT_YELLOW),
        ("5. TRẢI NGHIỆM ĐA NỀN TẢNG", "Mọi lúc mọi nơi", [
            "Giao diện Responsive chuẩn di động",
            "Hiệu ứng âm thanh & Mascot sinh động",
            "Lưu ngoại tuyến & tự đồng bộ",
            "Tương thích mọi trình duyệt hiện đại"
        ], COLOR_ACCENT_GREEN)
    ]

    for idx, (title, sub, bullets, p_color) in enumerate(pillars):
        cx = 0.8 + idx * 2.38
        c = add_card(s4, cx, 1.45, 2.25, 4.2, border_color=p_color, border_width=1.5)
        tf = c.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.12)
        tf.margin_right = Inches(0.12)
        tf.margin_top = Inches(0.18)
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.bold = True
        p.font.size = Pt(10)
        p.font.color.rgb = p_color

        p_s = tf.add_paragraph()
        p_s.text = sub
        p_s.font.size = Pt(8.5)
        p_s.font.italic = True
        p_s.font.color.rgb = COLOR_MUTED_TEXT

        p_div = tf.add_paragraph()
        p_div.text = "—" * 16
        p_div.font.size = Pt(7)
        p_div.font.color.rgb = COLOR_CARD_BORDER

        for b in bullets:
            pt = tf.add_paragraph()
            pt.space_before = Pt(3)
            r = pt.add_run(); r.text = f"• {b}"
            r.font.size = Pt(8.8)
            r.font.color.rgb = COLOR_DARK_TEXT

    # Bottom Mascot Callout
    add_mascot_with_speech(
        s4, left=0.8, top=5.8, img_path=img_maid,
        quote="5 trụ cột vững như bàn thạch! Thỏ cam kết vừa mang lại trải nghiệm giải trí mê mẩn, vừa chuẩn mực học thuật tuyệt đối cho sinh viên! 🎀🧹",
        char_title="Thỏ Hầu Gái phục vụ chu đáo", img_width=1.2, bubble_width=9.5
    )

    # ========================================================
    # SLIDE 5: MỤC TIÊU SPRINT 1 & TIÊU CHUẨN DoD
    # ========================================================
    s5 = prs.slides.add_slide(blank_layout)
    add_full_background(s5)
    add_slide_header(s5, "MỤC TIÊU SPRINT 1 & TIÊU CHUẨN HOÀN THÀNH (DoD)", slide_num=5)

    # Left: Sprint Goal Card
    c_goal = add_card(s5, 0.8, 1.45, 5.6, 4.1, border_color=COLOR_PRIMARY_PINK, border_width=1.5)
    tf_g = c_goal.text_frame
    tf_g.word_wrap = True
    tf_g.margin_left = Inches(0.25)
    tf_g.margin_top = Inches(0.22)
    p = tf_g.paragraphs[0]
    p.text = "🎯 TUYÊN BỐ MỤC TIÊU SPRINT 1 (SPRINT GOAL):"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_DEEP_BERRY

    p_cadence = tf_g.add_paragraph()
    p_cadence.space_before = Pt(4)
    p_cadence.text = "⏱️ Khung thời gian: 05/10/2026 – 18/10/2026 (14 ngày chuẩn Scrum)"
    p_cadence.font.bold = True
    p_cadence.font.size = Pt(10)
    p_cadence.font.color.rgb = COLOR_PRIMARY_PINK

    goals = [
        ("Xây dựng kiến trúc phân tán Serverless:", "Thiết lập Cloudflare D1 Edge Database và Worker API endpoints."),
        ("Chuẩn hóa toàn diện CSDL 3NF:", "Thiết kế 21 bảng, 108 thuộc tính và 11 quan hệ phẳng chuẩn đại học."),
        ("Giao diện bản đồ học tập vượt ải:", "Tích hợp 10 môn học chính khóa, 106 cửa ải chương và hơn 4.000 slide bài học."),
        ("Động cơ Gamification tương tác:", "Hoàn thiện cơ chế trừ Tim khi sai, thưởng Gems, duy trì Streak ngày học."),
        ("Tích hợp trợ giảng AI RAG môn học:", "Hỏi đáp tự động theo ngữ cảnh bài học, bảo mật câu hỏi kiểm tra.")
    ]
    for h, b in goals:
        pt = tf_g.add_paragraph()
        pt.space_before = Pt(3)
        r1 = pt.add_run(); r1.text = f"✓ {h} "
        r1.font.bold = True
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = COLOR_DARK_TEXT
        r2 = pt.add_run(); r2.text = b
        r2.font.size = Pt(9)
        r2.font.color.rgb = COLOR_MUTED_TEXT

    # Right: Definition of Done (DoD) Card
    c_dod = add_card(s5, 6.7, 1.45, 5.8, 4.1, border_color=COLOR_ACCENT_GREEN, border_width=1.5)
    tf_d = c_dod.text_frame
    tf_d.word_wrap = True
    tf_d.margin_left = Inches(0.25)
    tf_d.margin_top = Inches(0.22)
    p = tf_d.paragraphs[0]
    p.text = "🛡️ ĐỊNH NGHĨA HOÀN THÀNH (DEFINITION OF DONE - DoD):"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_ACCENT_GREEN

    dods = [
        ("Code Review & Version Control:", "100% mã nguồn được push lên GitHub, tạo PR và có ít nhất 1 thành viên review trước khi merge main."),
        ("Đáp ứng tiêu chí chấp nhận (AC):", "Tất cả Acceptance Criteria trong User Story đều được kiểm chứng và đạt kết quả mong muốn."),
        ("Kiểm thử tự động & API Test:", "Vượt qua toàn bộ kịch bản test API, dữ liệu mock và kiểm thử giao diện thực tế."),
        ("Không tồn đọng lỗi nghiêm trọng:", "0 lỗi mức Critical / High blocker tồn đọng tại thời điểm đóng Sprint."),
        ("Tài liệu hóa & Báo cáo kỹ thuật:", "Hoàn thành sơ đồ CSDL ERD, cập nhật tài liệu kỹ thuật và file báo cáo tổng kết.")
    ]
    for h, b in dods:
        pt = tf_d.add_paragraph()
        pt.space_before = Pt(4)
        r1 = pt.add_run(); r1.text = f"★ {h} "
        r1.font.bold = True
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = COLOR_ACCENT_GREEN
        r2 = pt.add_run(); r2.text = b
        r2.font.size = Pt(9)
        r2.font.color.rgb = COLOR_DARK_TEXT

    # Bottom Mascot Callout
    add_mascot_with_speech(
        s5, left=0.8, top=5.75, img_path=img_phone,
        quote="Làm việc chuẩn Scrum là nói có sách, mách có chứng! 5 tiêu chí DoD được kiểm tra nghiêm ngặt từng ly từng tí trước khi bấm nghiệm thu! 📱✅",
        char_title="Thỏ Bảy Màu kiểm tra tiến độ", img_width=1.25, bubble_width=9.5
    )

    # ========================================================
    # SLIDE 6: SPRINT 1 BACKLOG & KẾT QUẢ (100% DONE)
    # ========================================================
    s6 = prs.slides.add_slide(blank_layout)
    add_full_background(s6)
    add_slide_header(s6, "BẢNG SPRINT 1 BACKLOG & NGHIỆM THU (100% DONE)", slide_num=6)

    # Big Table of 10 User Stories
    tbl_shape = s6.shapes.add_table(11, 5, Inches(0.8), Inches(1.4), Inches(11.733), Inches(4.2))
    tbl = tbl_shape.table
    tbl.columns[0].width = Inches(1.1)
    tbl.columns[1].width = Inches(4.5)
    tbl.columns[2].width = Inches(2.2)
    tbl.columns[3].width = Inches(1.6)
    tbl.columns[4].width = Inches(2.333)

    headers = ["MÃ US", "NỘI DUNG USER STORY", "NGƯỜI PHỤ TRÁCH", "ĐIỂM (SP)", "TRẠNG THÁI"]
    for c_idx, h in enumerate(headers):
        cell = tbl.cell(0, c_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = COLOR_DEEP_BERRY
        p = cell.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.text = h
        p.font.bold = True
        p.font.size = Pt(10)
        p.font.color.rgb = COLOR_WHITE

    backlog_data = [
        ("US-01", "Khởi tạo kiến trúc Serverless & Cloudflare D1", "Lê Văn An", "3 SP", "✅ 100% DONE"),
        ("US-02", "Thiết kế & chuẩn hóa CSDL 3NF (21 bảng)", "Nguyễn Văn Tú", "5 SP", "✅ 100% DONE"),
        ("US-03", "Bản đồ học tập vượt ải & 106 cửa ải chương", "Nguyễn Như Quỳnh", "5 SP", "✅ 100% DONE"),
        ("US-04", "Trình xem slide bài học lý thuyết & code mẫu", "Nguyễn Như Quỳnh", "5 SP", "✅ 100% DONE"),
        ("US-05", "Hệ thống câu hỏi trắc nghiệm & giải thích", "Lê Văn An", "5 SP", "✅ 100% DONE"),
        ("US-06", "Cơ chế Gamification (Hearts, Gems, Streak)", "Nguyễn Như Quỳnh", "3 SP", "✅ 100% DONE"),
        ("US-07", "Hồ sơ cá nhân & Tủ 12 danh hiệu học viên", "Nguyễn Như Quỳnh", "3 SP", "✅ 100% DONE"),
        ("US-08", "Trợ giảng AI RAG chuyên sâu từng môn học", "Lê Văn An", "5 SP", "✅ 100% DONE"),
        ("US-09", "Cẩm nang ghi chú All-in-One theo bài học", "Nguyễn Văn Tú", "2 SP", "✅ 100% DONE"),
        ("US-10", "Kiểm thử tự động & Tối ưu hiệu năng tải", "Nguyễn Văn Tú", "2 SP", "✅ 100% DONE")
    ]

    for r_idx, row in enumerate(backlog_data, start=1):
        bg = RGBColor(255, 241, 245) if r_idx % 2 == 1 else COLOR_WHITE
        for c_idx, val in enumerate(row):
            cell = tbl.cell(r_idx, c_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = bg
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.size = Pt(9.5)
            if c_idx in [0, 3, 4]:
                p.alignment = PP_ALIGN.CENTER
                p.font.bold = True
                if c_idx == 4:
                    p.font.color.rgb = COLOR_ACCENT_GREEN
            elif c_idx == 1:
                p.font.bold = True if "US" in row[0] else False
                p.font.color.rgb = COLOR_DARK_TEXT

    # Bottom Mascot Callout
    add_mascot_with_speech(
        s6, left=0.8, top=5.8, img_path=img_celebrate,
        quote="38 trên 38 Story Points hoàn thành xuất sắc! Tỷ lệ cam kết 100%, không nợ một dòng code nào sang Sprint sau! Đỉnh nóc kịch trần luôn! 🎉✨",
        char_title="Thỏ Bảy Màu ăn mừng nón lá", img_width=1.2, bubble_width=9.5
    )

    # ========================================================
    # SLIDE 7: KIẾN TRÚC HỆ THỐNG & CSDL ERD
    # ========================================================
    s7 = prs.slides.add_slide(blank_layout)
    add_full_background(s7)
    add_slide_header(s7, "KIẾN TRÚC CƠ SỞ DỮ LIỆU ERD CHUẨN ĐẠI HỌC", slide_num=7)

    # Left: Actual ERD Diagram Preview Picture
    c_img = add_card(s7, 0.8, 1.45, 7.8, 4.2, border_color=COLOR_PRIMARY_PINK, border_width=1.5)
    if os.path.exists(img_erd):
        s7.shapes.add_picture(img_erd, Inches(0.9), Inches(1.55), width=Inches(7.6))

    # Right: Specifications Card
    c_spec = add_card(s7, 8.8, 1.45, 3.733, 4.2)
    tf_sp = c_spec.text_frame
    tf_sp.word_wrap = True
    tf_sp.margin_left = Inches(0.2)
    tf_sp.margin_top = Inches(0.2)

    p = tf_sp.paragraphs[0]
    p.text = "📐 THÔNG SỐ CSDL CHUẨN 3NF:"
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = COLOR_DEEP_BERRY

    specs = [
        ("21 Thực thể (Tables):", "Phân tầng rõ ràng giữa Người dùng, Học liệu và Trợ giảng AI."),
        ("108 Thuộc tính (Fields):", "Chuẩn hóa kiểu dữ liệu, định danh khóa chính PK, khóa ngoại FK và UQ."),
        ("11 Quan hệ chính cốt lõi:", "Đồ thị phẳng (Planar Graph), luồng 1-N rõ ràng, 0 dây chéo nhau."),
        ("Động cơ SQLite Cloudflare D1:", "Lưu trữ phân tán tại Edge, tốc độ đọc truy vấn dưới 30ms."),
        ("Phân hệ bài học phân cấp:", "Subjects → Units → Lessons → Questions → User Mistakes.")
    ]
    for h, b in specs:
        pt = tf_sp.add_paragraph()
        pt.space_before = Pt(3)
        r1 = pt.add_run(); r1.text = f"• {h} "
        r1.font.bold = True
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = COLOR_DARK_TEXT
        r2 = pt.add_run(); r2.text = b
        r2.font.size = Pt(9)
        r2.font.color.rgb = COLOR_MUTED_TEXT

    # Bottom Mascot Callout
    add_mascot_with_speech(
        s7, left=0.8, top=5.8, img_path=img_phone,
        quote="Sơ đồ ERD 21 bảng đi dây mạch in phẳng lì không chéo cọng nào! Vừa chuẩn chỉnh môn CSDL vừa sẵn sàng cho hàng triệu lượt thi đua! 📐⚡",
        char_title="Thỏ Bảy Màu tự hào", img_width=1.2, bubble_width=9.5
    )

    # ========================================================
    # SLIDE 8: DEMO 1 - BẢN ĐỒ VƯỢT ẢI & CẨM NANG
    # ========================================================
    s8 = prs.slides.add_slide(blank_layout)
    add_full_background(s8)
    add_slide_header(s8, "SẢN PHẨM BÀN GIAO 1: BẢN ĐỒ LỘ TRÌNH VƯỢT ẢI", slide_num=8)

    # Left: Screenshot 1 (Learning Map)
    c_ss1 = add_card(s8, 0.8, 1.45, 6.4, 4.2, border_color=COLOR_PRIMARY_PINK, border_width=1.5)
    if os.path.exists(img_ss1):
        s8.shapes.add_picture(img_ss1, Inches(0.9), Inches(1.55), width=Inches(6.2))

    # Right: Description & Metrics Card
    c_desc = add_card(s8, 7.4, 1.45, 5.133, 4.2)
    tf_d = c_desc.text_frame
    tf_d.word_wrap = True
    tf_d.margin_left = Inches(0.25)
    tf_d.margin_top = Inches(0.2)

    p = tf_d.paragraphs[0]
    p.text = "🗺️ ĐỘT PHÁ LỘ TRÌNH HỌC VƯỢT ẢI:"
    p.font.bold = True
    p.font.size = Pt(11.5)
    p.font.color.rgb = COLOR_DEEP_BERRY

    features_s1 = [
        ("10 Môn học chính thức:", "Tích hợp đầy đủ Toán rời rạc, Cấu trúc dữ liệu, Lập trình Web, Cơ sở dữ liệu..."),
        ("106 Cửa ải chương học:", "Lộ trình uốn lượn phong cách Duolingo, mở khóa từng ải tuần tự tạo cảm giác chinh phục."),
        ("4.094 Slide bài học lý thuyết:", "Nội dung cô đọng, tích hợp code mẫu trực quan, hình vẽ và công thức sinh động."),
        ("29.460 Câu trắc nghiệm thực tế:", "Ngân hàng câu hỏi đồ sộ kèm giải thích chi tiết khi trả lời sai."),
        ("Cẩm nang ghi chú All-in-One:", "Tự động liên kết và lưu trữ ghi chú của sinh viên ngay trong từng bài học.")
    ]
    for h, b in features_s1:
        pt = tf_d.add_paragraph()
        pt.space_before = Pt(3)
        r1 = pt.add_run(); r1.text = f"★ {h} "
        r1.font.bold = True
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = COLOR_PRIMARY_PINK
        r2 = pt.add_run(); r2.text = b
        r2.font.size = Pt(9)
        r2.font.color.rgb = COLOR_DARK_TEXT

    # Bottom Mascot Callout
    add_mascot_with_speech(
        s8, left=0.8, top=5.8, img_path=img_warrior,
        quote="Hơn 29 ngàn câu hỏi và 106 cửa ải thử thách! Cứ vượt qua 1 ải là tích lũy kinh nghiệm, thăng cấp vùn vụt, học mà mê như chơi game! ⚔️🏰",
        char_title="Thỏ Kiếm Sĩ xung trận", img_width=1.2, bubble_width=9.5
    )

    # ========================================================
    # SLIDE 9: DEMO 2 - HỒ SƠ HỌC VIÊN & GAMIFICATION
    # ========================================================
    s9 = prs.slides.add_slide(blank_layout)
    add_full_background(s9)
    add_slide_header(s9, "SẢN PHẨM BÀN GIAO 2: HỒ SƠ HỌC VIÊN & GAMIFICATION", slide_num=9)

    # Left: Screenshot 2 (Profile & Badges)
    c_ss2 = add_card(s9, 0.8, 1.45, 6.4, 4.2, border_color=COLOR_PRIMARY_PINK, border_width=1.5)
    if os.path.exists(img_ss2):
        s9.shapes.add_picture(img_ss2, Inches(0.9), Inches(1.55), width=Inches(6.2))

    # Right: Gamification Mechanism Card
    c_gami = add_card(s9, 7.4, 1.45, 5.133, 4.2)
    tf_g = c_gami.text_frame
    tf_g.word_wrap = True
    tf_g.margin_left = Inches(0.25)
    tf_g.margin_top = Inches(0.2)

    p = tf_g.paragraphs[0]
    p.text = "🏆 HỆ SINH THÁI GAMIFICATION ĐỈNH CAO:"
    p.font.bold = True
    p.font.size = Pt(11.5)
    p.font.color.rgb = COLOR_DEEP_BERRY

    gami_features = [
        ("❤️ Cơ chế 5 Trái Tim (Hearts):", "Sinh viên có 5 tim, làm sai trừ 1 tim. Tạo áp lực tư duy cẩn thận, tự hồi tim theo thời gian."),
        ("💎 Đá Quý (Gems) & Điểm XP:", "Phần thưởng xứng đáng cho mỗi bài học hoàn thành, dùng để mua vật phẩm bổ trợ."),
        ("🔥 Chuỗi Ngày Học (Streak Lửa):", "Đếm chuỗi ngày tự học liên tục, thôi thúc sinh viên vào app mỗi ngày để giữ lửa."),
        ("🎖️ Tủ Huy Hiệu 12 Danh Hiệu:", "Ghi nhận từng cột mốc (Học sinh chăm ngoan, Chiến thần code, Bậc thầy thuật toán...)."),
        ("🎒 Túi Đồ & Trang Bị Cá Nhân:", "Lưu trữ bình máu, bùa bảo vệ chuỗi streak và avatar tùy biến cho học viên.")
    ]
    for h, b in gami_features:
        pt = tf_g.add_paragraph()
        pt.space_before = Pt(3)
        r1 = pt.add_run(); r1.text = f"• {h} "
        r1.font.bold = True
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = COLOR_DARK_TEXT
        r2 = pt.add_run(); r2.text = b
        r2.font.size = Pt(9)
        r2.font.color.rgb = COLOR_MUTED_TEXT

    # Bottom Mascot Callout
    add_mascot_with_speech(
        s9, left=0.8, top=5.8, img_path=img_welcome,
        quote="Trang cá nhân lung linh với tủ huy hiệu sáng choang! Ai chăm học là Thỏ phát thưởng Gems rủng rỉnh, chuỗi Streak cháy rực rỡ luôn! ⭐🏆",
        char_title="Thỏ Bảy Màu trao giải", img_width=1.2, bubble_width=9.5
    )

    # ========================================================
    # SLIDE 10: DEMO 3 - TRỢ GIẢNG AI RAG THEO MÔN HỌC
    # ========================================================
    s10 = prs.slides.add_slide(blank_layout)
    add_full_background(s10)
    add_slide_header(s10, "SẢN PHẨM BÀN GIAO 3: TRỢ GIẢNG \"HỎI 3TG AI\"", slide_num=10)

    # Left: Screenshot 3 (AI Chat)
    c_ss3 = add_card(s10, 0.8, 1.45, 6.4, 4.2, border_color=COLOR_PRIMARY_PINK, border_width=1.5)
    if os.path.exists(img_ss3):
        s10.shapes.add_picture(img_ss3, Inches(0.9), Inches(1.55), width=Inches(6.2))

    # Right: AI Security & RAG Details
    c_ai = add_card(s10, 7.4, 1.45, 5.133, 4.2)
    tf_ai = c_ai.text_frame
    tf_ai.word_wrap = True
    tf_ai.margin_left = Inches(0.25)
    tf_ai.margin_top = Inches(0.2)

    p = tf_ai.paragraphs[0]
    p.text = "🤖 CÔNG NGHỆ TRỢ GIẢNG AI ĐỘT PHÁ:"
    p.font.bold = True
    p.font.size = Pt(11.5)
    p.font.color.rgb = COLOR_DEEP_BERRY

    ai_features = [
        ("🔒 RAG Riêng Tư & Bảo Mật Tuyệt Đối:", "Tra cứu ngữ cảnh từ giáo trình thuần văn bản, tuyệt đối cách ly không lộ ngân hàng đề thi."),
        ("🎯 Chọn Ngữ Cảnh Chuyên Sâu Từng Môn:", "Học viên học môn nào thì AI trả lời chuyên sâu môn đó, không bị lan man ngoài lề."),
        ("⚡ Phản Hồi Dạng Streaming Siêu Mượt:", "Công nghệ truyền tin tức thì, sinh viên không phải chờ đợi lâu."),
        ("💡 Định Dạng Markdown & Code Highlighter:", "Hiển thị code Python, C++, Java, SQL có màu sắc và thụt lề chuẩn chỉ."),
        ("💬 Phong Cách Sư Phạm Tận Tụy:", "Gợi ý từng bước tư duy thay vì làm hộ, giúp sinh viên thực sự hiểu bản chất bài học.")
    ]
    for h, b in ai_features:
        pt = tf_ai.add_paragraph()
        pt.space_before = Pt(3)
        r1 = pt.add_run(); r1.text = f"★ {h} "
        r1.font.bold = True
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = COLOR_ACCENT_PURPLE
        r2 = pt.add_run(); r2.text = b
        r2.font.size = Pt(9)
        r2.font.color.rgb = COLOR_DARK_TEXT

    # Bottom Mascot Callout
    add_mascot_with_speech(
        s10, left=0.8, top=5.8, img_path=img_thinking,
        quote="Gặp bài tập khó? Đừng hoang mang! Có Trợ giảng AI 3TG giải thích tận tình từng dòng code, học đêm học ngày không lo cô đơn nha! 🤖💡",
        char_title="Thỏ Giáo Sư AI", img_width=1.2, bubble_width=9.5
    )

    # ========================================================
    # SLIDE 11: CHỈ SỐ HIỆU SUẤT SPRINT 1 (METRICS & VELOCITY)
    # ========================================================
    s11 = prs.slides.add_slide(blank_layout)
    add_full_background(s11)
    add_slide_header(s11, "CHỈ SỐ HIỆU SUẤT SPRINT 1 (VELOCITY & METRICS)", slide_num=11)

    # 4 Key Stat Cards
    stat_boxes = [
        ("38 SP", "VELOCITY HOÀN THÀNH", "100% mục tiêu cam kết ban đầu", COLOR_DEEP_BERRY),
        ("10 / 10", "USER STORIES DONE", "Nghiệm thu đạt chuẩn DoD", COLOR_PRIMARY_PINK),
        ("0 BUG", "CRITICAL / BLOCKING", "Chất lượng code ổn định cao", COLOR_ACCENT_GREEN),
        ("< 38 ms", "ĐỘ TRỄ API CLOUDFLARE", "Tốc độ đọc ghi Edge SQLite", COLOR_ACCENT_YELLOW)
    ]

    for idx, (val, lbl, sub, col) in enumerate(stat_boxes):
        cx = 0.8 + idx * 2.98
        c = add_card(s11, cx, 1.45, 2.8, 1.8, border_color=col, border_width=1.8)
        tf = c.text_frame
        tf.word_wrap = True
        tf.margin_top = Inches(0.18)
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.text = val
        p.font.bold = True
        p.font.size = Pt(28)
        p.font.color.rgb = col

        p2 = tf.add_paragraph()
        p2.alignment = PP_ALIGN.CENTER
        p2.text = lbl
        p2.font.bold = True
        p2.font.size = Pt(10)
        p2.font.color.rgb = COLOR_DARK_TEXT

        p3 = tf.add_paragraph()
        p3.alignment = PP_ALIGN.CENTER
        p3.text = sub
        p3.font.size = Pt(8.5)
        p3.font.color.rgb = COLOR_MUTED_TEXT

    # Burndown Chart Description & Agile Health Card
    c_burn = add_card(s11, 0.8, 3.45, 11.733, 2.15)
    tf_b = c_burn.text_frame
    tf_b.word_wrap = True
    tf_b.margin_left = Inches(0.25)
    tf_b.margin_top = Inches(0.18)

    p = tf_b.paragraphs[0]
    p.text = "📈 PHÂN TÍCH TIẾN ĐỘ BURNDOWN & SỨC KHỎE DỰ ÁN SPRINT 1:"
    p.font.bold = True
    p.font.size = Pt(11.5)
    p.font.color.rgb = COLOR_DEEP_BERRY

    b_points = [
        ("Nhịp độ Burndown lý tưởng:", "Đường khối lượng công việc giảm đều đặn từ 38 SP về 0 SP trong suốt 14 ngày, không có hiện tượng dồn việc vào phút chót."),
        ("Hiệu quả phối hợp Agile:", "Daily Standup 15 phút mỗi sáng giải quyết ngay các blocker liên quan đến đồng bộ dữ liệu và chuẩn giao tiếp API."),
        ("Chất lượng kỹ thuật (Code Quality):", "Tuân thủ nghiêm ngặt quy chuẩn Clean Code, đặt tên biến rõ nghĩa, chuẩn hóa 3NF giúp backend và frontend ăn khớp hoàn hảo."),
        ("Không phát sinh nợ kỹ thuật (Technical Debt):", "Toàn bộ tài liệu ERD, API schema và test case đều được hoàn thiện song song với quá trình code.")
    ]
    for h, b in b_points:
        pt = tf_b.add_paragraph()
        pt.space_before = Pt(2)
        r1 = pt.add_run(); r1.text = f"• {h} "
        r1.font.bold = True
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = COLOR_DARK_TEXT
        r2 = pt.add_run(); r2.text = b
        r2.font.size = Pt(9)
        r2.font.color.rgb = COLOR_MUTED_TEXT

    # Bottom Mascot Callout
    add_mascot_with_speech(
        s11, left=0.8, top=5.8, img_path=img_celebrate,
        quote="Biểu đồ tiến độ dốc đều tăm tắp, không có cảnh thức trắng đêm 'chữa cháy'! Đúng chuẩn phong cách Agile chuyên nghiệp của 3TG! 📊🚀",
        char_title="Thỏ Bảy Màu tự hào", img_width=1.2, bubble_width=9.5
    )

    # ========================================================
    # SLIDE 12: SPRINT RETROSPECTIVE (LESSONS LEARNED)
    # ========================================================
    s12 = prs.slides.add_slide(blank_layout)
    add_full_background(s12)
    add_slide_header(s12, "HỌP CẢI TIẾN SPRINT RETROSPECTIVE (RÚT KINH NGHIỆM)", slide_num=12)

    retro_cols = [
        ("🌟 ĐIỂM LÀM TỐT (WHAT WENT WELL)", [
            "Tinh thần đồng đội cao, hỗ trợ nhau nhiệt tình",
            "Thiết kế CSDL 3NF chuẩn từ đầu giúp code trơn tru",
            "Mascot Thỏ 7 Màu tạo điểm nhấn thương hiệu độc đáo",
            "Hoàn thành 100% mục tiêu đúng hạn, không delay",
            "Giao diện Gamification nhận phản hồi rất tích cực"
        ], COLOR_ACCENT_GREEN),
        ("⚠️ ĐIỂM CẦN CẢI THIỆN (TO IMPROVE)", [
            "Hiệu ứng animation đôi lúc tốn tài nguyên máy yếu",
            "Công tác import dữ liệu câu hỏi ban đầu còn thủ công",
            "Cần tăng độ phủ kiểm thử giao diện tự động (E2E)",
            "Chưa có tính năng thi đấu thời gian thực giữa sinh viên"
        ], COLOR_ACCENT_YELLOW),
        ("🔧 HÀNH ĐỘNG CỤ THỂ (ACTION ITEMS)", [
            "Áp dụng Code Splitting & tối ưu CSS Hardware Acceleration",
            "Xây dựng script tự động import đề thi từ file Excel/Word",
            "Thiết lập bộ test Cypress / Playwright cho giao diện",
            "Bổ sung tính năng Đấu trường PvP 1v1 ngay trong Sprint 2"
        ], COLOR_DEEP_BERRY)
    ]

    for idx, (title, items, col) in enumerate(retro_cols):
        cx = 0.8 + idx * 4.0
        c = add_card(s12, cx, 1.45, 3.75, 4.2, border_color=col, border_width=1.8)
        tf = c.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.2)
        tf.margin_right = Inches(0.2)
        tf.margin_top = Inches(0.2)

        p = tf.paragraphs[0]
        p.text = title
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = col

        p_div = tf.add_paragraph()
        p_div.text = "—" * 26
        p_div.font.size = Pt(7)
        p_div.font.color.rgb = COLOR_CARD_BORDER

        for item in items:
            pt = tf.add_paragraph()
            pt.space_before = Pt(4)
            r = pt.add_run(); r.text = f"• {item}"
            r.font.size = Pt(9.5)
            r.font.color.rgb = COLOR_DARK_TEXT

    # Bottom Mascot Callout
    add_mascot_with_speech(
        s12, left=0.8, top=5.8, img_path=img_shocked,
        quote="Có nhìn lại mới thấy mình trưởng thành! Những vấp váp nhỏ của Sprint 1 sẽ là đòn bẩy để Sprint 2 bùng nổ dữ dội hơn nữa! 🐾📝",
        char_title="Thỏ Bảy Màu rút kinh nghiệm", img_width=1.2, bubble_width=9.5
    )

    # ========================================================
    # SLIDE 13: KẾ HOẠCH HÀNH ĐỘNG SPRINT 2 (ROADMAP)
    # ========================================================
    s13 = prs.slides.add_slide(blank_layout)
    add_full_background(s13)
    add_slide_header(s13, "KẾ HOẠCH HÀNH ĐỘNG CHI TIẾT SPRINT 2 (ROADMAP)", slide_num=13)

    sp2_features = [
        ("⚔️ 1. ĐẤU TRƯỜNG TRI THỨC (PvP REALTIME)", "Thách đấu 1v1 trực tiếp", [
            "Sinh viên ghép cặp ngẫu nhiên hoặc thách đấu bạn bè",
            "Thi đấu giải nhanh 5 câu trắc nghiệm cùng thời gian thực",
            "Hiển thị thanh máu và tốc độ trả lời của đối thủ",
            "Cộng trừ cúp xếp hạng (Trophies) kịch tính"
        ], COLOR_DEEP_BERRY),
        ("🛒 2. CỬA HÀNG VẬT PHẨM (SHOP 3TG)", "Kinh tế Gamification", [
            "Đổi Gems tích lũy lấy Bình hồi máu (Full Hearts)",
            "Mua Băng bảo vệ chuỗi Streak khi bận việc đột xuất",
            "Mở khóa các trang phục skin đặc biệt cho Thỏ 7 Màu",
            "Huy hiệu danh giá độc quyền trong cửa hàng"
        ], COLOR_ACCENT_YELLOW),
        ("🏆 3. BẢNG XẾP HẠNG TUẦN (LEAGUES)", "Thi đua leo hạng", [
            "Phân chia 5 bậc giải đấu: Đồng, Bạc, Vàng, Kim Cương, Thần Thoại",
            "Top 10 sinh viên thăng hạng, bottom 5 sinh viên xuống hạng",
            "Reset giải đấu vào tối Chủ Nhật hàng tuần",
            "Phần thưởng Gems và danh hiệu vinh danh tuần"
        ], COLOR_ACCENT_PURPLE),
        ("📊 4. AI PHÂN TÍCH ĐIỂM YẾU HỌC TẬP", "Cá nhân hóa thông minh", [
            "Tự động thống kê các dạng câu hỏi sinh viên hay làm sai",
            "AI gợi ý lộ trình ôn tập trọng tâm để bồi đắp kiến thức",
            "Dự báo xác suất vượt qua bài thi kết thúc môn",
            "Xuất báo cáo kết quả học tập cho phụ huynh/giảng viên"
        ], COLOR_ACCENT_GREEN)
    ]

    for idx, (title, sub, bullets, p_col) in enumerate(sp2_features):
        cx = 0.8 + idx * 2.98
        c = add_card(s13, cx, 1.45, 2.8, 4.2, border_color=p_col, border_width=1.8)
        tf = c.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.18)
        tf.margin_right = Inches(0.18)
        tf.margin_top = Inches(0.2)

        p = tf.paragraphs[0]
        p.text = title
        p.font.bold = True
        p.font.size = Pt(10)
        p.font.color.rgb = p_col

        p_s = tf.add_paragraph()
        p_s.text = sub
        p_s.font.size = Pt(9)
        p_s.font.italic = True
        p_s.font.color.rgb = COLOR_MUTED_TEXT

        p_div = tf.add_paragraph()
        p_div.text = "—" * 20
        p_div.font.size = Pt(7)
        p_div.font.color.rgb = COLOR_CARD_BORDER

        for b in bullets:
            pt = tf.add_paragraph()
            pt.space_before = Pt(3)
            r = pt.add_run(); r.text = f"• {b}"
            r.font.size = Pt(9)
            r.font.color.rgb = COLOR_DARK_TEXT

    # Bottom Mascot Callout
    add_mascot_with_speech(
        s13, left=0.8, top=5.8, img_path=img_warrior,
        quote="Sprint 2 sẽ là sân chơi so trình cực gắt với tính năng PvP thời gian thực! Mời anh em mài sắc kiếm sẵn sàng leo rank cùng Thỏ nha! ⚔️🔥",
        char_title="Thỏ Bảy Màu hào hứng", img_width=1.2, bubble_width=9.5
    )

    # ========================================================
    # SLIDE 14: LỜI KẾT & HỎI ĐÁP (Q&A & THANK YOU)
    # ========================================================
    s14 = prs.slides.add_slide(blank_layout)
    add_full_background(s14)

    # Left: Gratitude & Conclusion Card
    c_ty = add_card(s14, 0.8, 1.2, 7.2, 5.5, border_color=COLOR_PRIMARY_PINK, border_width=2)
    tf_ty = c_ty.text_frame
    tf_ty.word_wrap = True
    tf_ty.margin_left = Inches(0.35)
    tf_ty.margin_top = Inches(0.35)

    p = tf_ty.paragraphs[0]
    p.text = "🌸 LỜI CẢM ƠN & KẾT LUẬN"
    p.font.bold = True
    p.font.size = Pt(14)
    p.font.color.rgb = COLOR_DEEP_BERRY

    p_t = tf_ty.add_paragraph()
    p_t.space_before = Pt(8)
    p_t.text = "CHÂN THÀNH CẢM ƠN THẦY CÔ & CÁC BẠN!"
    p_t.font.bold = True
    p_t.font.size = Pt(22)
    p_t.font.color.rgb = COLOR_DARK_TEXT

    conclusions = [
        ("Hoàn thành xuất sắc sứ mệnh Sprint 1:", "Team 3TG đã hiện thực hóa 100% mục tiêu cốt lõi, xây dựng thành công nền móng vững chắc cho nền tảng học tập thông minh All-in-One."),
        ("Lời tri ân sâu sắc:", "Xin chân thành cảm ơn sự hướng dẫn tận tình, những góp ý chuyên môn quý báu của Giảng viên bộ môn Công nghệ phần mềm - Khoa CNTT - Đại học CMC."),
        ("Cam kết chặng đường tiếp theo:", "Đội ngũ 3TG cam kết tiếp tục nỗ lực phát huy cao độ tinh thần Agile, đưa sản phẩm đạt chất lượng cao nhất phục vụ sinh viên."),
        ("Phiên thảo luận & Hỏi đáp (Q&A):", "Rất mong nhận được những câu hỏi, đánh giá và đóng góp ý kiến quý báu từ Thầy Cô và các bạn sinh viên!")
    ]
    for h, b in conclusions:
        pt = tf_ty.add_paragraph()
        pt.space_before = Pt(6)
        r1 = pt.add_run(); r1.text = f"★ {h} "
        r1.font.bold = True
        r1.font.size = Pt(10.5)
        r1.font.color.rgb = COLOR_PRIMARY_PINK
        r2 = pt.add_run(); r2.text = b
        r2.font.size = Pt(10)
        r2.font.color.rgb = COLOR_DARK_TEXT

    # Right: Big Mascot Celebration Card
    c_cel = add_card(s14, 8.3, 1.2, 4.233, 5.5, border_color=COLOR_DEEP_BERRY, border_width=2)
    if os.path.exists(img_celebrate):
        s14.shapes.add_picture(img_celebrate, Inches(8.75), Inches(1.45), width=Inches(3.3))

    sp_cel = s14.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.55), Inches(4.7), Inches(3.75), Inches(1.8))
    sp_cel.fill.solid()
    sp_cel.fill.fore_color.rgb = COLOR_CALLOUT_BG
    sp_cel.line.color.rgb = COLOR_PRIMARY_PINK
    sp_cel.line.width = Pt(1.5)
    tf_c = sp_cel.text_frame
    tf_c.word_wrap = True
    tf_c.margin_left = Inches(0.15)
    tf_c.margin_top = Inches(0.12)
    p = tf_c.paragraphs[0]
    p.text = "💬 Thỏ Bảy Màu nhắn nhủ:"
    p.font.bold = True
    p.font.size = Pt(10.5)
    p.font.color.rgb = COLOR_DEEP_BERRY
    p2 = tf_c.add_paragraph()
    p2.text = '"Buổi báo cáo kết thúc rồi nè! Thầy Cô và các bạn có câu hỏi gì cứ hỏi tự nhiên nha, đừng hỏi đề thi hóc búa quá Thỏ giận á nghen! Cảm ơn mọi người nhiều ạ! 💖🎉"'
    p2.font.size = Pt(9.5)
    p2.font.italic = True
    p2.font.color.rgb = COLOR_DARK_TEXT

    # Save PPTX
    out_pptx = os.path.join(sprint_dir, "SLIDE_THUYET_TRINH_SPRINT_1_THO_7_MAU.pptx")
    prs.save(out_pptx)
    print(f"Generated PowerPoint: {out_pptx}")
    return out_pptx

if __name__ == "__main__":
    build_presentation()
