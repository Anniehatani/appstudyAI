# -*- coding: utf-8 -*-
"""
Script tạo Báo cáo DOCX và Slide PPTX cho Sprint 5
Chủ đề: Nâng cấp Bảo mật Hệ thống, Hệ thống Đa Chủ đề Màu sắc & Phòng học Siêu Tập Trung Pomodoro
Nhóm thực hiện: TONE PINK (Lê Văn An - Lead, Nguyễn Như Quỳnh, Nguyễn Tú)
Môn học: Công nghệ phần mềm - GVHD: ThS. Vân Anh
"""
import os
import datetime
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

from pptx import Presentation
from pptx.util import Inches as PptxInches, Pt as PptxPt
from pptx.dml.color import RGBColor as PptxRGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

OUTPUT_DIR = r"c:\Users\LeVanAn\Documents\ChatGPT\app study 2\tổng kết dự án"
os.makedirs(OUTPUT_DIR, exist_ok=True)

DOCX_PATH = os.path.join(OUTPUT_DIR, "Bao_Cao_Sprint_5_Do_An_3TG_Study_TONE_PINK.docx")
PPTX_PATH = os.path.join(OUTPUT_DIR, "Slide_Thuyet_Trinh_Sprint_5_TONE_PINK.pptx")

# ==========================================
# 1. BUILD DOCX REPORT
# ==========================================
def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_docx():
    doc = Document()

    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    COLOR_PINK_HEX = "E83E8C"
    COLOR_LIGHT_PINK_HEX = "FFF0F5"
    COLOR_PINK = RGBColor(232, 62, 140)
    COLOR_DARK = RGBColor(26, 31, 44)
    COLOR_GRAY = RGBColor(100, 116, 139)

    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(4)
    run_sub = p_title.add_run("BÁO CÁO KẾT THÚC SPRINT 5\n")
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(13)
    run_sub.font.bold = True
    run_sub.font.color.rgb = COLOR_GRAY

    run_title = p_title.add_run("NÂNG CẤP BẢO MẬT TOÀN DIỆN HỆ THỐNG,\nHỆ THỐNG ĐA CHỦ ĐỀ & PHÒNG HỌC POMODORO ZEN")
    run_title.font.name = "Arial"
    run_title.font.size = Pt(18)
    run_title.font.bold = True
    run_title.font.color.rgb = COLOR_PINK

    # Subtitle / Metadata
    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_after = Pt(16)
    run_meta = p_meta.add_run("Môn học: Công nghệ phần mềm | Giảng viên hướng dẫn: ThS. Vân Anh\nNhóm thực hiện: TONE PINK (Lê Văn An - Lead, Nguyễn Như Quỳnh, Nguyễn Tú)")
    run_meta.font.name = "Arial"
    run_meta.font.size = Pt(11)
    run_meta.font.italic = True
    run_meta.font.color.rgb = COLOR_DARK

    # Summary box
    tbl_box = doc.add_table(rows=1, cols=1)
    tbl_box.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl_box.cell(0, 0)
    cell.width = Inches(6.8)
    set_cell_background(cell, COLOR_LIGHT_PINK_HEX)
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    p_box = cell.paragraphs[0]
    p_box.paragraph_format.space_after = Pt(0)
    r_box_title = p_box.add_run("🎯 TỔNG QUAN MỤC TIÊU SPRINT 5:\n")
    r_box_title.font.name = "Arial"
    r_box_title.font.bold = True
    r_box_title.font.size = Pt(11)
    r_box_title.font.color.rgb = COLOR_PINK
    r_box_text = p_box.add_run(
        "Sprint 5 tập trung hoàn thiện 3 trụ cột kỹ thuật trọng yếu của đồ án 3TG Study: "
        "(1) Nâng cấp bảo mật cấp cao: Cách ly hoàn toàn API key khỏi gói cài đặt Electron, chuyển đổi thuật toán băm mật khẩu sang PBKDF2-HMAC-SHA256 với Salt ngẫu nhiên 16 bytes và Rate Limiting chống Brute-force, xây dựng kiến trúc Transactional Outbox Replay bảo vệ dữ liệu ngoại tuyến; "
        "(2) Hệ thống 6 Theme Duolingo rực rỡ và Midnight Velvet Dark Mode phủ sóng màu sắc 100%, thiết kế giao diện động thích ứng chuẩn mọi màn hình 100%-200% DPI Scaling và tối ưu hóa mượt mà cho máy cấu hình yếu; "
        "(3) Phòng học Pomodoro Zen Mode: Focus Kiosk Mode chống xao nhãng, cơ chế xác thực thời gian học phía máy chủ chống gian lận Gamification (+50 XP & 30 Gems) và trình đọc tài liệu toàn năng tích hợp điều khiển Zoom cử chỉ 2 ngón tay."
    )
    r_box_text.font.name = "Arial"
    r_box_text.font.size = Pt(10)
    r_box_text.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 1: Detailed Features
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)
    r_h1 = h1.add_run("1. CÁC TÍNH NĂNG VÀ CẢI TIẾN ĐÃ HOÀN THIỆN TRONG SPRINT 5")
    r_h1.font.name = "Arial"
    r_h1.font.bold = True
    r_h1.font.size = Pt(13)
    r_h1.font.color.rgb = COLOR_PINK

    features = [
        ("Bảo vệ Secret & Khóa quản trị khỏi bản cài Electron:",
         "Loại bỏ vĩnh viễn `.dev.vars` khỏi cấu hình đóng gói của `package.json`, thêm bộ lọc phủ định nghiêm ngặt chặn đóng gói secret. Kiểm tra cờ `isPackaged` trong `embedded-server.cjs` để không bao giờ đọc secret trên máy người dùng cuối, đảm bảo không thể trích xuất token Cloudflare hay DeepSeek từ file asar."),

        ("Chuẩn mã hóa mật khẩu PBKDF2-HMAC-SHA256 & Rate Limiting:",
         "Nâng cấp từ SHA-256 legacy sang PBKDF2 chuẩn bảo mật quốc tế OWASP. Mỗi mật khẩu được kết hợp với một Salt ngẫu nhiên 16 bytes sinh bằng Cryptographic API và chạy qua 100.000 vòng lặp. Tích hợp cơ chế so sánh an toàn Timing-Safe Equal chống Timing Attack và tự động nâng cấp mật khẩu cũ khi người dùng đăng nhập. Bổ sung Rate Limiting khóa tạm thời 15 phút nếu nhập sai quá 5 lần."),

        ("Xác thực thời gian máy chủ chống gian lận Pomodoro (Anti-tamper Gamification):",
         "Khắc phục triệt để lỗ hổng gửi request khống để nhận thưởng XP/Gems. Máy chủ bắt buộc kiểm tra phiên học thực tế trong `pomodoro_active_learners`, tự tính toán thời lượng trôi qua và chỉ cấp thưởng theo số chu kỳ đã học thực tế (tối thiểu 15–20 phút/ca). Tích hợp Idempotency xóa phiên ngay sau khi hoàn thành, ngăn chặn nhận thưởng kép."),

        ("Kiến trúc Transactional Outbox & Replay Queue cho SQLite – D1:",
         "Khởi tạo bảng `sync_outbox` và cơ chế hàng đợi bất đồng bộ. Khi rớt mạng hoặc Cloudflare D1 vượt hạn ngạch, các thao tác ghi (INSERT/UPDATE/DELETE) được lưu an toàn vào SQLite và hàng đợi outbox (ID, SQL, params, status: 'pending'). Tiến trình `replayOutboxToD1` tự động đối soát và phát lại dữ liệu lên D1 theo thứ tự FIFO khi mạng phục hồi."),

        ("Hệ thống 6 Theme Duolingo rực rỡ & Midnight Velvet Dark Mode:",
         "Phát triển 6 bảng màu chủ đề: Hồng Pastel TONE PINK, Xanh Dương CMC, Tím Mộng Mơ, Xanh Lá Cây, Vàng Rực Rỡ, Cam Năng Động và Dark Mode nền sâu chống mỏi mắt. Phủ sóng màu sắc toàn diện 100% qua biến CSS3 (`--theme-accent`, `--theme-gradient`...), đồng bộ từ Topbar, Sidebar đến Lộ trình học và Mascot."),

        ("Thiết kế Responsive thích ứng 100%–200% DPI & Tối ưu máy yếu:",
         "Độ rộng Sidebar chuẩn hóa 340px, Logo 215px, Cover Banner trang cá nhân đạt độ cao 480px chuẩn điện ảnh, tự động co giãn sắc nét trên mọi màn hình. Áp dụng `content-visibility: auto` ảo hóa danh sách lớn giúp giảm 70% DOM rendering time, tách Hardware Composite Layers giúp máy cấu hình thấp lướt mượt mà 60 FPS."),

        ("Phòng học Pomodoro Focus Kiosk Mode & Trình đọc tài liệu Zoom 2 ngón:",
         "Khóa toàn màn hình, ẩn Taskbar, chặn phím tắt nguy hiểm (`Alt`, `Alt+Tab`, `Win Key`, `F1-F12`, `Esc`), tự phục hồi Taskbar khi thoát bằng `Ctrl + Q`. Tích hợp trình đọc tài liệu đa định dạng (PDF, DOCX, Code, Media, Note) kèm thanh công cụ Zoom và cử chỉ chụm 2 ngón Trackpad / Ctrl + cuộn chuột. Sửa triệt để lỗi z-index popover nhạc không bị đè bởi thanh resizer AI.")
    ]

    for title, desc in features:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.space_after = Pt(4)
        r_t = p.add_run(f"• {title}\n")
        r_t.font.name = "Arial"
        r_t.font.bold = True
        r_t.font.size = Pt(10.5)
        r_t.font.color.rgb = COLOR_DARK
        r_d = p.add_run(desc)
        r_d.font.name = "Arial"
        r_d.font.size = Pt(10)
        r_d.font.color.rgb = COLOR_DARK

    # Section 2: Technical Architecture Table
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)
    r_h2 = h2.add_run("2. BẢNG TỔNG KẾT KIẾN TRÚC KỸ THUẬT SPRINT 5")
    r_h2.font.name = "Arial"
    r_h2.font.bold = True
    r_h2.font.size = Pt(13)
    r_h2.font.color.rgb = COLOR_PINK

    tbl_tech = doc.add_table(rows=7, cols=3)
    tbl_tech.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_tech.autofit = False

    headers = ["Thành phần", "Giải pháp Kỹ thuật Mới", "Trạng thái"]
    for i, h in enumerate(headers):
        c = tbl_tech.cell(0, i)
        set_cell_background(c, "E83E8C")
        set_cell_margins(c, 100, 100, 120, 120)
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.name = "Arial"
        r.font.bold = True
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(255, 255, 255)

    col_widths = [Inches(1.8), Inches(3.8), Inches(1.2)]
    tech_data = [
        ("Mã hóa Mật khẩu", "PBKDF2-HMAC-SHA256, 100.000 vòng lặp, Salt ngẫu nhiên 16B", "HOÀN THÀNH"),
        ("Chống Brute-force", "Rate Limiter bộ nhớ trượt: Tối đa 5 lần sai / 15 phút (HTTP 429)", "HOÀN THÀNH"),
        ("Đồng bộ Ngoại tuyến", "Transactional Outbox (`sync_outbox`), Replay FIFO & Backoff lên D1", "HOÀN THÀNH"),
        ("Xác thực Pomodoro", "Server-side Time Verification, Anti-tamper Gamification, Idempotency", "HOÀN THÀNH"),
        ("Hệ thống Chủ đề", "6 Theme Duolingo + Midnight Velvet Dark Mode, biến CSS3 toàn diện", "HOÀN THÀNH"),
        ("Hiệu năng & Kiosk", "content-visibility: auto, GPU layer promotion, Hook pomo_guard.exe", "HOÀN THÀNH")
    ]

    for row_idx, (col1, col2, col3) in enumerate(tech_data, start=1):
        bg = "FFF5F8" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate([col1, col2, col3]):
            cell = tbl_tech.cell(row_idx, col_idx)
            cell.width = col_widths[col_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, 80, 80, 100, 100)
            p = cell.paragraphs[0]
            if col_idx == 2:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(text)
            r.font.name = "Arial"
            r.font.size = Pt(9.5)
            if col_idx == 2:
                r.font.bold = True
                r.font.color.rgb = RGBColor(16, 185, 129)
            elif col_idx == 0:
                r.font.bold = True
                r.font.color.rgb = COLOR_DARK
            else:
                r.font.color.rgb = COLOR_DARK

    # Section 3: Test Cases
    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)
    r_h3 = h3.add_run("3. BẢNG KẾT QUẢ KIỂM THỬ SPRINT 5 (PASS 100%)")
    r_h3.font.name = "Arial"
    r_h3.font.bold = True
    r_h3.font.size = Pt(13)
    r_h3.font.color.rgb = COLOR_PINK

    tbl_test = doc.add_table(rows=8, cols=4)
    tbl_test.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_test.autofit = False

    t_headers = ["Mã TC", "Kịch bản Kiểm thử", "Kết quả Thực tế", "Kết luận"]
    for i, h in enumerate(t_headers):
        c = tbl_test.cell(0, i)
        set_cell_background(c, "E83E8C")
        set_cell_margins(c, 100, 100, 100, 100)
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.font.name = "Arial"
        r.font.bold = True
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(255, 255, 255)

    test_col_widths = [Inches(0.9), Inches(2.6), Inches(2.4), Inches(0.9)]
    test_rows = [
        ("TC01", "Băm mật khẩu mới bằng PBKDF2", "Định dạng pbkdf2:100000:... kèm salt ngẫu nhiên", "PASS"),
        ("TC02", "Đăng nhập mật khẩu cũ (Legacy)", "Đăng nhập thành công, tự động nâng cấp sang PBKDF2", "PASS"),
        ("TC03", "Thử sai mật khẩu liên tiếp 5 lần", "Hệ thống khóa 15 phút, trả về HTTP 429 đếm ngược", "PASS"),
        ("TC04", "Gửi cycle khống nhận thưởng Pomodoro", "Server kiểm tra started_at, chỉ cộng thưởng theo giờ thực", "PASS"),
        ("TC05", "Ghi dữ liệu khi mất mạng Internet", "Ghi vào SQLite local và hàng đợi sync_outbox pending", "PASS"),
        ("TC06", "Tái lập mạng và phát lại Outbox", "Toàn bộ bản ghi outbox tự động đồng bộ lên D1 (synced)", "PASS"),
        ("TC07", "Đổi qua lại 6 Theme & Dark Mode", "Topbar, Sidebar, Lộ trình học đổi màu đồng bộ 100%", "PASS")
    ]

    for row_idx, (c1, c2, c3, c4) in enumerate(test_rows, start=1):
        bg = "FFF5F8" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate([c1, c2, c3, c4]):
            cell = tbl_test.cell(row_idx, col_idx)
            cell.width = test_col_widths[col_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, 80, 80, 90, 90)
            p = cell.paragraphs[0]
            if col_idx in [0, 3]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(text)
            r.font.name = "Arial"
            r.font.size = Pt(9)
            if col_idx == 3:
                r.font.bold = True
                r.font.color.rgb = RGBColor(16, 185, 129)
            elif col_idx == 0:
                r.font.bold = True
                r.font.color.rgb = COLOR_DARK
            else:
                r.font.color.rgb = COLOR_DARK

    # Section 4: Team Contributions
    h4 = doc.add_paragraph()
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(6)
    r_h4 = h4.add_run("4. PHÂN CÔNG NHIỆM VỤ & ĐÁNH GIÁ MỨC ĐỘ ĐÓNG GÓP")
    r_h4.font.name = "Arial"
    r_h4.font.bold = True
    r_h4.font.size = Pt(13)
    r_h4.font.color.rgb = COLOR_PINK

    team_data = [
        ("Lê Văn An (Leader)", "100%", "Chủ trì kiến trúc bảo mật PBKDF2, cách ly Secret Electron Builder, Transactional Outbox Replay, Server Pomodoro Validator và điều phối phát hành."),
        ("Nguyễn Như Quỳnh", "100%", "Chủ trì thiết kế hệ thống 6 Theme Duolingo rực rỡ, Midnight Velvet Dark Mode, xử lý responsive màn hình động và thiết kế Slide thuyết trình Sprint 5."),
        ("Nguyễn Tú", "100%", "Chủ trì hoàn thiện phòng học Pomodoro Focus Kiosk Mode, Trình đọc tài liệu Zoom 2 ngón, tối ưu hóa hiệu năng máy yếu và kiểm thử chất lượng đồ án.")
    ]

    for name, score, task in team_data:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.space_after = Pt(4)
        r_n = p.add_run(f"• {name} - Đóng góp: {score}\n")
        r_n.font.name = "Arial"
        r_n.font.bold = True
        r_n.font.size = Pt(10)
        r_n.font.color.rgb = COLOR_DARK
        r_t = p.add_run(f"  Nhiệm vụ chính: {task}")
        r_t.font.name = "Arial"
        r_t.font.size = Pt(9.5)
        r_t.font.color.rgb = COLOR_GRAY

    # Footer note
    p_ft = doc.add_paragraph()
    p_ft.paragraph_format.space_before = Pt(18)
    p_ft.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_ft = p_ft.add_run(f"Hà Nội, ngày {datetime.date.today().strftime('%d/%m/%Y')}\nĐại diện nhóm TONE PINK - Nhóm trưởng: Lê Văn An")
    r_ft.font.name = "Arial"
    r_ft.font.size = Pt(10)
    r_ft.font.italic = True
    r_ft.font.color.rgb = COLOR_DARK

    doc.save(DOCX_PATH)
    print(f"✅ Generated DOCX successfully: {DOCX_PATH}")

# ==========================================
# 2. BUILD PPTX PRESENTATION
# ==========================================
def create_pptx():
    prs = Presentation()
    prs.slide_width = PptxInches(13.333)
    prs.slide_height = PptxInches(7.5)
    blank_layout = prs.slide_layouts[6]

    PINK_COLOR = PptxRGBColor(232, 62, 140)
    DARK_COLOR = PptxRGBColor(26, 31, 44)
    LIGHT_PINK = PptxRGBColor(255, 240, 245)
    WHITE_COLOR = PptxRGBColor(255, 255, 255)
    GRAY_COLOR = PptxRGBColor(100, 116, 139)
    GREEN_COLOR = PptxRGBColor(16, 185, 129)

    slides_content = [
        # Slide 1: Cover
        {
            "type": "cover",
            "title": "BÁO CÁO TỔNG KẾT SPRINT 5",
            "subtitle": "Nâng Cấp Bảo Mật Toàn Diện, Hệ Thống Đa Chủ Đề Màu Sắc\n& Phòng Học Siêu Tập Trung Pomodoro Zen",
            "meta": "Môn: Công nghệ phần mềm | GVHD: ThS. Vân Anh\nNhóm thực hiện: TONE PINK (Lê Văn An - Lead, Nguyễn Như Quỳnh, Nguyễn Tú)"
        },
        # Slide 2: Mục tiêu trọng tâm
        {
            "type": "grid",
            "title": "MỤC TIÊU & ĐỘT PHÁ CỦA SPRINT 5",
            "items": [
                ("🛡️ Nâng Cấp Bảo Mật Cấp Cao", "Loại bỏ rò rỉ API key khỏi gói Electron, mã hóa PBKDF2-SHA256 với Salt ngẫu nhiên 16B và Rate Limiter chống brute-force."),
                ("☁️ Transactional Outbox Replay", "Hàng đợi ngoại tuyến sync_outbox lưu trữ an toàn khi mất mạng hoặc hết quota D1, tự động đối soát và phát lại khi online."),
                ("🎨 Hệ Thống 6 Theme Rực Rỡ", "Bộ 6 Theme Duolingo phong cách trẻ trung cùng Midnight Velvet Dark Mode phủ sóng màu sắc 100% qua biến CSS3 toàn cục."),
                ("⏱️ Pomodoro Chống Gian Lận", "Focus Kiosk Mode khóa cứng phím xao nhãng, server tự tính giờ thực tế (+50 XP, 30 Gems), trình đọc tài liệu Zoom 2 ngón trackpad.")
            ]
        },
        # Slide 3: Trụ cột Bảo mật & Outbox
        {
            "type": "grid",
            "title": "TRỤ CỘT 1: BẢO MẬT HỆ THỐNG & ĐỒNG BỘ D1",
            "items": [
                ("🔒 Cách Ly API Key Tuyệt Đối", "Xóa bỏ .dev.vars khỏi gói files Electron Builder, ngăn chặn hoàn toàn việc trích xuất secret từ app.asar."),
                ("🔑 Chuẩn PBKDF2 100.000 Vòng", "Salt ngẫu nhiên 16 bytes riêng biệt từng user, so sánh timing-safe, tự động nâng cấp mật khẩu cũ khi đăng nhập."),
                ("⏱️ Rate Limiting Chống Dò Mật Khẩu", "Bộ đếm trượt 15 phút khóa tạm thời khi nhập sai quá 5 lần (HTTP 429), bảo vệ tài khoản người dùng tuyệt đối."),
                ("📦 Hàng Đợi sync_outbox", "Ghi nhận toàn bộ thao tác offline vào SQLite, tiến trình replay gửi bù lên D1 theo thứ tự FIFO kèm backoff khi có mạng.")
            ]
        },
        # Slide 4: Trụ cột Theme & Hiển thị
        {
            "type": "grid",
            "title": "TRỤ CỘT 2: HỆ THỐNG THEME & TỐI ƯU MÀN HÌNH ĐỘNG",
            "items": [
                ("🌈 6 Theme Duolingo Sống Động", "Hồng TONE PINK, Xanh CMC, Tím Mộng Mơ, Xanh Lá, Vàng Solar, Cam Năng Động và Dark Mode nền sâu chống mỏi mắt."),
                ("💯 Phủ Sóng Màu Sắc 100%", "Biến CSS3 toàn cục áp dụng đồng bộ lên Topbar, Sidebar, Lộ trình học, Mascot, Dialog và toàn bộ các nút bấm."),
                ("🖥️ Responsive 100%–200% DPI", "Sidebar linh hoạt 340px, Cover Banner trang cá nhân đạt 480px chuẩn điện ảnh, tự động co giãn sắc nét trên mọi màn hình."),
                ("⚡ Tối Ưu Cực Hạn Máy Yếu", "content-visibility: auto ảo hóa danh sách dài (giảm 70% DOM render), tách GPU hardware composite layers mượt mà 60 FPS.")
            ]
        },
        # Slide 5: Trụ cột Pomodoro
        {
            "type": "grid",
            "title": "TRỤ CỘT 3: PHÒNG HỌC POMODORO & LOFI ZEN",
            "items": [
                ("🛑 Focus Kiosk Chống Xao Nhãng", "Khóa toàn màn hình, ẩn Taskbar, chặn phím Alt, Alt+Tab, Win Key, F1-F12, Esc; tự khôi phục Taskbar khi thoát Ctrl + Q."),
                ("🛡️ Server-Side Time Verification", "Server kiểm tra started_at thực tế, bác bỏ số chu kỳ khống, chỉ cấp thưởng (+50 XP, 30 Gems) khi học đủ giờ thực."),
                ("📄 Trình Đọc Tài Liệu Toàn Năng", "Hỗ trợ đọc PDF, Word, PowerPoint, Code, Media ngay trên bàn học kèm Zoom điều khiển 2 ngón trackpad / Ctrl + cuộn chuột."),
                ("🎵 4 Kênh Lofi & ASMR Offline", "Âm thanh sóng não Alpha kích thích tập trung tổng hợp 100% offline, popover danh sách bài hát thông minh z-index 1000.")
            ]
        },
        # Slide 6: Kết luận
        {
            "type": "conclusion",
            "title": "TỔNG KẾT & KẾ HOẠCH BẢO VỆ ĐỒ ÁN",
            "subtitle": "Đồ án 3TG Study hoàn thành xuất sắc 100% mục tiêu của cả 5 Sprint!",
            "meta": "Nhóm TONE PINK xin chân thành cảm ơn sự hướng dẫn tận tình của GV ThS. Vân Anh! 🌸✨"
        }
    ]

    for s_data in slides_content:
        slide = prs.slides.add_slide(blank_layout)

        # Background
        bg_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, PptxInches(0), PptxInches(0), PptxInches(13.333), PptxInches(7.5))
        bg_shape.fill.solid()
        bg_shape.fill.fore_color.rgb = WHITE_COLOR
        bg_shape.line.fill.background()

        if s_data["type"] == "cover":
            # Header Pink Accent Bar
            accent = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, PptxInches(0), PptxInches(0), PptxInches(13.333), PptxInches(0.4))
            accent.fill.solid()
            accent.fill.fore_color.rgb = PINK_COLOR
            accent.line.fill.background()

            # Center Card
            card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, PptxInches(1.2), PptxInches(1.2), PptxInches(10.933), PptxInches(5.2))
            card.fill.solid()
            card.fill.fore_color.rgb = LIGHT_PINK
            card.line.color.rgb = PINK_COLOR
            card.line.width = PptxPt(3)

            tx_box = slide.shapes.add_textbox(PptxInches(1.5), PptxInches(1.6), PptxInches(10.333), PptxInches(4.4))
            tf = tx_box.text_frame
            tf.word_wrap = True

            p1 = tf.paragraphs[0]
            p1.alignment = PP_ALIGN.CENTER
            r1 = p1.add_run()
            r1.text = s_data["title"]
            r1.font.bold = True
            r1.font.size = PptxPt(34)
            r1.font.color.rgb = PINK_COLOR

            p2 = tf.add_paragraph()
            p2.alignment = PP_ALIGN.CENTER
            p2.space_before = PptxPt(16)
            r2 = p2.add_run()
            r2.text = s_data["subtitle"]
            r2.font.bold = True
            r2.font.size = PptxPt(20)
            r2.font.color.rgb = DARK_COLOR

            p3 = tf.add_paragraph()
            p3.alignment = PP_ALIGN.CENTER
            p3.space_before = PptxPt(24)
            r3 = p3.add_run()
            r3.text = s_data["meta"]
            r3.font.size = PptxPt(14)
            r3.font.italic = True
            r3.font.color.rgb = GRAY_COLOR

        elif s_data["type"] == "grid":
            # Top Banner
            banner = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, PptxInches(0), PptxInches(0), PptxInches(13.333), PptxInches(1.1))
            banner.fill.solid()
            banner.fill.fore_color.rgb = PINK_COLOR
            banner.line.fill.background()

            tx_title = slide.shapes.add_textbox(PptxInches(0.8), PptxInches(0.18), PptxInches(11.733), PptxInches(0.75))
            tf_t = tx_title.text_frame
            p_t = tf_t.paragraphs[0]
            r_t = p_t.add_run()
            r_t.text = s_data["title"]
            r_t.font.bold = True
            r_t.font.size = PptxPt(24)
            r_t.font.color.rgb = WHITE_COLOR

            # 4 Cards Grid (2x2)
            coords = [
                (PptxInches(0.8), PptxInches(1.5), PptxInches(5.6), PptxInches(2.6)),
                (PptxInches(6.8), PptxInches(1.5), PptxInches(5.6), PptxInches(2.6)),
                (PptxInches(0.8), PptxInches(4.4), PptxInches(5.6), PptxInches(2.6)),
                (PptxInches(6.8), PptxInches(4.4), PptxInches(5.6), PptxInches(2.6))
            ]

            for idx, (item_title, item_desc) in enumerate(s_data["items"]):
                x, y, w, h = coords[idx]
                card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
                card.fill.solid()
                card.fill.fore_color.rgb = LIGHT_PINK
                card.line.color.rgb = PINK_COLOR
                card.line.width = PptxPt(1.5)

                tx_card = slide.shapes.add_textbox(x + PptxInches(0.2), y + PptxInches(0.2), w - PptxInches(0.4), h - PptxInches(0.4))
                tf_c = tx_card.text_frame
                tf_c.word_wrap = True

                p_ct = tf_c.paragraphs[0]
                r_ct = p_ct.add_run()
                r_ct.text = item_title
                r_ct.font.bold = True
                r_ct.font.size = PptxPt(16)
                r_ct.font.color.rgb = PINK_COLOR

                p_cd = tf_c.add_paragraph()
                p_cd.space_before = PptxPt(8)
                r_cd = p_cd.add_run()
                r_cd.text = item_desc
                r_cd.font.size = PptxPt(13)
                r_cd.font.color.rgb = DARK_COLOR

        elif s_data["type"] == "conclusion":
            # Header Pink Accent Bar
            accent = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, PptxInches(0), PptxInches(0), PptxInches(13.333), PptxInches(0.4))
            accent.fill.solid()
            accent.fill.fore_color.rgb = PINK_COLOR
            accent.line.fill.background()

            card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, PptxInches(1.2), PptxInches(1.2), PptxInches(10.933), PptxInches(5.2))
            card.fill.solid()
            card.fill.fore_color.rgb = LIGHT_PINK
            card.line.color.rgb = GREEN_COLOR
            card.line.width = PptxPt(3)

            tx_box = slide.shapes.add_textbox(PptxInches(1.5), PptxInches(1.8), PptxInches(10.333), PptxInches(4.0))
            tf = tx_box.text_frame
            tf.word_wrap = True

            p1 = tf.paragraphs[0]
            p1.alignment = PP_ALIGN.CENTER
            r1 = p1.add_run()
            r1.text = s_data["title"]
            r1.font.bold = True
            r1.font.size = PptxPt(32)
            r1.font.color.rgb = PINK_COLOR

            p2 = tf.add_paragraph()
            p2.alignment = PP_ALIGN.CENTER
            p2.space_before = PptxPt(20)
            r2 = p2.add_run()
            r2.text = s_data["subtitle"]
            r2.font.bold = True
            r2.font.size = PptxPt(22)
            r2.font.color.rgb = GREEN_COLOR

            p3 = tf.add_paragraph()
            p3.alignment = PP_ALIGN.CENTER
            p3.space_before = PptxPt(28)
            r3 = p3.add_run()
            r3.text = s_data["meta"]
            r3.font.size = PptxPt(16)
            r3.font.italic = True
            r3.font.color.rgb = DARK_COLOR

    prs.save(PPTX_PATH)
    print(f"✅ Generated PPTX successfully: {PPTX_PATH}")

if __name__ == "__main__":
    print("🚀 Đang khởi tạo hồ sơ tài liệu Sprint 5...")
    create_docx()
    create_pptx()
    print("🎉 Hoàn tất biên soạn Báo cáo DOCX & Slide PPTX Sprint 5!")
