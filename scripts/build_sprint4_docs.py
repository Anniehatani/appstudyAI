# -*- coding: utf-8 -*-
"""
Script tạo Báo cáo DOCX, Slide PPTX và GitHub Issues cho SPRINT 4
Nhóm: TONE PINK - Môn Công nghệ phần mềm - GV: Vân Anh
Thành viên: Lê Văn An (Lead), Nguyễn Như Quỳnh, Nguyễn Tú
"""
import os
import datetime
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

from pptx import Presentation
from pptx.util import Inches as PptxInches, Pt as PptxPt
from pptx.dml.color import RGBColor as PptxRGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

OUTPUT_DIR = r"c:\Users\LeVanAn\Documents\ChatGPT\app study 2\tổng kết dự án"
os.makedirs(OUTPUT_DIR, exist_ok=True)

DOCX_PATH = os.path.join(OUTPUT_DIR, "Bao_Cao_Sprint_4_Do_An_3TG_Study_TONE_PINK.docx")
PPTX_PATH = os.path.join(OUTPUT_DIR, "Slide_Thuyet_Trinh_Sprint_4_TONE_PINK.pptx")
ISSUES_MD_PATH = os.path.join(OUTPUT_DIR, "GitHub_Issues_Sprint_4.md")

# ==========================================
# 1. BUILD DOCX REPORT SPRINT 4
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
    COLOR_DARK_HEX = "1A1F2C"
    COLOR_GRAY_HEX = "64748B"
    COLOR_LIGHT_PINK_HEX = "FFF0F5"

    COLOR_PINK = RGBColor(232, 62, 140)
    COLOR_DARK = RGBColor(26, 31, 44)
    COLOR_GRAY = RGBColor(100, 116, 139)

    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(4)
    run_sub = p_title.add_run("BÁO CÁO KẾT THÚC SPRINT 4\n")
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(13)
    run_sub.font.bold = True
    run_sub.font.color.rgb = COLOR_GRAY

    run_title = p_title.add_run("HỆ THỐNG MẠNG XÃ HỘI HỌC TẬP 3TG MESSENGER,\nTRỢ LÝ BOT 3TG & QUẢN TRỊ NHÓM HỌC TẬP")
    run_title.font.name = "Arial"
    run_title.font.size = Pt(18)
    run_title.font.bold = True
    run_title.font.color.rgb = COLOR_PINK

    # Subtitle / Metadata
    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_after = Pt(18)
    run_meta = p_meta.add_run("Môn học: Công nghệ phần mềm | Giảng viên hướng dẫn: Cô Vân Anh\nNhóm thực hiện: TONE PINK (Lê Văn An - Lead, Nguyễn Như Quỳnh, Nguyễn Tú)")
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
    r_box_title = p_box.add_run("🎯 TỔNG QUAN MỤC TIÊU SPRINT 4:\n")
    r_box_title.font.name = "Arial"
    r_box_title.font.bold = True
    r_box_title.font.size = Pt(11)
    r_box_title.font.color.rgb = COLOR_PINK
    r_box_text = p_box.add_run(
        "Sprint 4 tập trung hoàn thiện toàn diện hệ sinh thái Kết nối & Học tập nhóm của đồ án 3TG Study. "
        "Bao gồm: (1) 3TG Messenger toàn màn hình chuẩn Facebook Messenger; (2) Tối ưu hóa phản hồi nhắn tin Optimistic UI (0ms delay), "
        "loại bỏ hoàn toàn các thanh gợi ý rườm rà; (3) Tích hợp Bot 3TG chạy Native cực nhẹ thay thế botdiscord cũ; "
        "(4) Bộ lệnh Media & Tiện ích đầy đủ (!ff, !anime, !gai, !sad, !trai, !anh, !sing, !troll, !info, !bot, !clean, !ai, sailenh); "
        "(5) Phân quyền quản trị nhóm học tập: Trưởng nhóm (Key holder), Phó nhóm, Thành viên (chuyển key, thăng/hạ phó nhóm, kick, bật/tắt bot); "
        "(6) Trả lời trích dẫn tin nhắn (Message Quoting); (7) Thời gian hoạt động thực tế (Real-time Active Status) qua Heartbeat; "
        "(8) Kết bạn 2 chiều kiểm duyệt an toàn; (9) Đồng bộ 100% cơ sở dữ liệu Cloudflare D1 & SQLite Local Replica."
    )
    r_box_text.font.name = "Arial"
    r_box_text.font.size = Pt(10)
    r_box_text.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 1: Detailed Features
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)
    r_h1 = h1.add_run("1. CÁC TÍNH NĂNG VÀ CẢI TIẾN ĐÃ HOÀN THIỆN TRONG SPRINT 4")
    r_h1.font.name = "Arial"
    r_h1.font.bold = True
    r_h1.font.size = Pt(13)
    r_h1.font.color.rgb = COLOR_PINK

    features = [
        ("Tối ưu hóa phản hồi nhắn tin Optimistic UI (0ms Delay):",
         "Khắc phục triệt để độ trễ 1-2s khi nhấn gửi tin nhắn. Ứng dụng ngay lập tức hiển thị tin nhắn lên giao diện người gửi (Optimistic render), làm sạch ô nhập và phát âm thanh phản hồi tức thì (0ms), đồng thời kích hoạt gửi bất đồng bộ lên server. Loại bỏ hoàn toàn thanh gợi ý tin nhắn rườm rà để giao diện thông thoáng, chuẩn trải nghiệm Messenger chuyên nghiệp."),

        ("Tích hợp Trợ lý Bot 3TG chạy Native siêu nhẹ:",
         "Xóa bỏ hoàn toàn thư mục `node_modules` cồng kềnh của botdiscord cũ (giảm hàng trăm MB). Chuyển đổi toàn bộ logic sang chạy trực tiếp trên runtime Node của App (`src/bot3tg.js`), không tốn thêm tiến trình, không độ trễ, tự động nạp vào mọi nhóm mới tạo để đồng hành cùng học viên."),

        ("Bộ lệnh Media & Tiện ích đầy đủ của Bot 3TG:",
         "Bot hỗ trợ nhận diện và phản hồi toàn bộ các lệnh với tiền tố `!` và `/`:\n"
         "• !help / !menu: Bảng hướng dẫn chi tiết toàn bộ lệnh.\n"
         "• !ff: Gửi video highlights Free Fire cực cháy ngẫu nhiên từ kho dữ liệu.\n"
         "• !anime: Gửi video/gif anime truyền động lực học tập.\n"
         "• !gai: Gửi video gái xinh năng lượng ngày mới.\n"
         "• !sad: Gửi video tâm trạng sâu lắng thư giãn.\n"
         "• !trai: Gửi video trai đẹp ngầu.\n"
         "• !anh: Gửi ảnh nghệ thuật chất lượng cao.\n"
         "• !sing [tên bài]: Tìm kiếm và gợi ý giai điệu bài hát yêu thích.\n"
         "• !troll: Meme hài hước giải tỏa áp lực thi cử.\n"
         "• !info: Tóm tắt thông tin nhóm, Key holder, Phó nhóm, sĩ số.\n"
         "• !bot: Giới thiệu về Bot 3TG và sứ mệnh đồng hành học tập.\n"
         "• !ping, !uptime, !chao: Tiện ích kiểm tra độ trễ, thời gian chạy và lời chào theo khung giờ.\n"
         "• !ai [câu hỏi]: Gọi trí tuệ nhân tạo giải đáp mọi chủ đề (tình cảm, đời sống, học tập) ngắn gọn, dí dỏm.\n"
         "• Xử lý Sai lệnh (sailenh): Khi người dùng gõ lệnh không tồn tại (VD: !abc) hoặc chỉ gõ dấu !, Bot phản hồi lịch sự hướng dẫn gõ !help kèm video vui nhộn."),

        ("Phân quyền & Quản trị Nhóm học tập chuyên sâu:",
         "Xây dựng Modal thành viên với huy hiệu nhận diện rõ ràng (👑 Trưởng nhóm, 🛡️ Phó nhóm, 🤖 Trợ lý Bot, 👤 Thành viên):\n"
         "• Chuyển Key Trưởng nhóm (Key holder): Trao quyền quản trị cao nhất cho thành viên khác, người cũ chuyển thành Phó nhóm.\n"
         "• Bổ nhiệm / Hạ cấp Phó nhóm: Trưởng nhóm có thể chọn thành viên làm Phó nhóm để hỗ trợ quản lý, hoặc hạ về thành viên thường.\n"
         "• Kick thành viên: Trưởng nhóm và Phó nhóm có quyền mời thành viên vi phạm ra khỏi nhóm (Phó nhóm không thể kick Trưởng nhóm hay Phó nhóm khác).\n"
         "• Quản lý Bot 3TG: Trưởng/Phó nhóm có quyền mời Bot ra khỏi nhóm hoặc thêm Bot trở lại bất kỳ lúc nào."),

        ("Thời gian hoạt động thực tế (Real-time Active Status):",
         "Khắc phục hiển thị hoạt động ảo khi bạn bè offline. Bổ sung trường `last_active_at`, đồng bộ qua Heartbeat định kỳ. Hiển thị chuẩn xác: 'Đang hoạt động' (chấm xanh nếu tương tác dưới 3 phút), 'Hoạt động X phút trước' / 'Hoạt động X giờ trước' (chấm xám)."),

        ("Chia sẻ đa phương tiện & Trích dẫn trả lời (Quote/Reply):",
         "Hỗ trợ gửi hình ảnh (lightbox phóng to), video player, tin nhắn thoại audio player và tệp tài liệu học tập kèm dung lượng. Nút reply `↩️` cho phép trích dẫn tin nhắn và nhấp vào để cuộn mượt đến tin nhắn gốc."),

        ("Quy trình kết bạn 2 chiều & Đồng bộ Cloudflare D1:",
         "Kết bạn 2 chiều an toàn (Pending -> Accepted). Di trú và đồng bộ 100% dữ liệu các bảng chat nhóm, tin nhắn, bạn bè trên Cloudflare D1 và SQLite Local Replica.")
    ]

    for title, desc in features:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.space_after = Pt(4)
        r_t = p.add_run(f"• {title} ")
        r_t.font.name = "Arial"
        r_t.font.bold = True
        r_t.font.size = Pt(10.5)
        r_t.font.color.rgb = COLOR_DARK
        r_d = p.add_run(desc)
        r_d.font.name = "Arial"
        r_d.font.size = Pt(10)
        r_d.font.color.rgb = COLOR_DARK

    # Section 2: Technical Architecture
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)
    r_h2 = h2.add_run("2. BẢNG TỔNG KẾT KIẾN TRÚC KỸ THUẬT SPRINT 4")
    r_h2.font.name = "Arial"
    r_h2.font.bold = True
    r_h2.font.size = Pt(13)
    r_h2.font.color.rgb = COLOR_PINK

    tbl_tech = doc.add_table(rows=1, cols=3)
    tbl_tech.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = tbl_tech.rows[0].cells
    headers = ["Thành phần", "Công nghệ / Triển khai", "Ý nghĩa & Giá trị"]
    for i, h in enumerate(headers):
        hdr[i].text = h
        hdr[i].paragraphs[0].runs[0].font.name = "Arial"
        hdr[i].paragraphs[0].runs[0].font.bold = True
        hdr[i].paragraphs[0].runs[0].font.size = Pt(10)
        hdr[i].paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        set_cell_background(hdr[i], COLOR_PINK_HEX)
        set_cell_margins(hdr[i], top=100, bottom=100, left=120, right=120)

    tech_rows = [
        ("Optimistic Chat UI", "DOM insertion tức thì (0ms) + Async fetch", "Gửi tin nhắn mượt mà, không giật lag, loại bỏ độ trễ."),
        ("Bot 3TG Engine", "Native ES Module (`src/bot3tg.js`)", "Không cần node_modules ngoài, tiêu thụ RAM cực thấp, phản hồi tức thời."),
        ("Media Repository", "JSON Database + Supabase CDN", "Kho video Free Fire, Anime, Gái xinh, Nhạc buồn, Trai đẹp chất lượng cao."),
        ("Group Authorization", "RBAC: admin (Key), deputy, member, bot", "Bảo mật cao, chống vượt quyền, linh hoạt chuyển giao quyền quản trị."),
        ("Database Backend", "Cloudflare D1 REST + SQLite DatabaseSync", "Đồng bộ hóa 2 chiều đám mây và bản sao cục bộ offline.")
    ]
    for comp, tech, val in tech_rows:
        row = tbl_tech.add_row().cells
        row[0].text = comp
        row[1].text = tech
        row[2].text = val
        for c in row:
            c.paragraphs[0].runs[0].font.name = "Arial"
            c.paragraphs[0].runs[0].font.size = Pt(9.5)
            set_cell_background(c, "FFFFFF")
            set_cell_margins(c, top=80, bottom=80, left=100, right=100)

    # Section 3: GITHUB ISSUES SPRINT 4
    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(16)
    h3.paragraph_format.space_after = Pt(6)
    r_h3 = h3.add_run("3. DANH MỤC GITHUB ISSUES SPRINT 4 (TONE PINK)")
    r_h3.font.name = "Arial"
    r_h3.font.bold = True
    r_h3.font.size = Pt(13)
    r_h3.font.color.rgb = COLOR_PINK

    tbl_issues = doc.add_table(rows=1, cols=5)
    tbl_issues.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_iss = tbl_issues.rows[0].cells
    iss_headers = ["Issue ID", "Tiêu đề Issue", "Người phụ trách", "Nhãn (Labels)", "Trạng thái"]
    for i, h in enumerate(iss_headers):
        hdr_iss[i].text = h
        hdr_iss[i].paragraphs[0].runs[0].font.name = "Arial"
        hdr_iss[i].paragraphs[0].runs[0].font.bold = True
        hdr_iss[i].paragraphs[0].runs[0].font.size = Pt(9.5)
        hdr_iss[i].paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        set_cell_background(hdr_iss[i], COLOR_PINK_HEX)
        set_cell_margins(hdr_iss[i], top=80, bottom=80, left=100, right=100)

    issues_data = [
        ("#SP4-01", "Optimistic UI: Gửi tin nhắn tức thì 0ms, xóa thanh gợi ý", "Lê Văn An (Lead)", "enhancement, ui/ux", "✅ Closed / Done"),
        ("#SP4-02", "Tích hợp Bot 3TG Native cực nhẹ vào runtime Node của App", "Lê Văn An (Lead)", "feature, backend", "✅ Closed / Done"),
        ("#SP4-03", "Bộ lệnh Media: !ff, !anime, !gai, !sad, !trai, !anh, !sing", "Nguyễn Như Quỳnh", "feature, media", "✅ Closed / Done"),
        ("#SP4-04", "Xử lý Báo sai lệnh (sailenh) khi gõ lệnh lạ hoặc dấu !", "Nguyễn Tú", "enhancement, bot", "✅ Closed / Done"),
        ("#SP4-05", "Phân quyền Quản trị Nhóm: Chuyển Key, Phó nhóm, Kick thành viên", "Lê Văn An (Lead)", "security, backend", "✅ Closed / Done"),
        ("#SP4-06", "Quản lý Bot 3TG: Cho phép Trưởng/Phó nhóm thêm và mời Bot ra", "Nguyễn Như Quỳnh", "feature, group", "✅ Closed / Done"),
        ("#SP4-07", "Đồng bộ thời gian hoạt động thực tế (Real-time Active Status)", "Nguyễn Tú", "bug, real-time", "✅ Closed / Done"),
        ("#SP4-08", "Chia sẻ đa phương tiện & Trích dẫn trả lời (Quote/Reply)", "Lê Văn An (Lead)", "feature, messenger", "✅ Closed / Done"),
        ("#SP4-09", "Đồng bộ hóa Schema & Di trú toàn diện Cloudflare D1", "Lê Văn An (Lead)", "database, devops", "✅ Closed / Done")
    ]

    for i_id, title, assignee, labels, status in issues_data:
        row = tbl_issues.add_row().cells
        row[0].text = i_id
        row[1].text = title
        row[2].text = assignee
        row[3].text = labels
        row[4].text = status
        for c in row:
            c.paragraphs[0].runs[0].font.name = "Arial"
            c.paragraphs[0].runs[0].font.size = Pt(9)
            set_cell_background(c, "FFFFFF")
            set_cell_margins(c, top=60, bottom=60, left=80, right=80)

    # Section 4: Evaluation
    h4 = doc.add_paragraph()
    h4.paragraph_format.space_before = Pt(16)
    h4.paragraph_format.space_after = Pt(6)
    r_h4 = h4.add_run("4. ĐÁNH GIÁ KẾT THÚC SPRINT 4 & KẾT LUẬN")
    r_h4.font.name = "Arial"
    r_h4.font.bold = True
    r_h4.font.size = Pt(13)
    r_h4.font.color.rgb = COLOR_PINK

    p_eval = doc.add_paragraph()
    p_eval.paragraph_format.space_after = Pt(6)
    r_eval = p_eval.add_run(
        "Sprint 4 đã hoàn thành xuất sắc 100% mục tiêu đề ra đúng tiến độ của môn Công nghệ phần mềm. "
        "Ứng dụng 3TG Study Hub hiện đã sở hữu một hệ sinh thái học tập và kết nối xã hội hoàn chỉnh, "
        "từ giao diện Messenger toàn màn hình chuẩn Facebook, phản hồi siêu tốc 0ms không độ trễ, "
        "đến trợ lý thông minh Bot 3TG đa năng và hệ thống phân quyền quản trị nhóm chặt chẽ, bảo mật cao. "
        "Sản phẩm sẵn sàng cho đợt báo cáo và nghiệm thu đề tài trước giảng viên Vân Anh!"
    )
    r_eval.font.name = "Arial"
    r_eval.font.size = Pt(10)
    r_eval.font.color.rgb = COLOR_DARK

    doc.save(DOCX_PATH)
    print("✅ Đã tạo thành công DOCX Sprint 4:", DOCX_PATH)


# ==========================================
# 2. BUILD PPTX SLIDES SPRINT 4
# ==========================================
def create_pptx():
    prs = Presentation()
    prs.slide_width = PptxInches(13.333)
    prs.slide_height = PptxInches(7.5)
    blank_layout = prs.slide_layouts[6]

    PINK_PRIMARY = PptxRGBColor(232, 62, 140)
    PINK_DARK = PptxRGBColor(216, 27, 96)
    BG_LIGHT_PINK = PptxRGBColor(255, 240, 245)
    DARK_TEXT = PptxRGBColor(26, 31, 44)
    GRAY_TEXT = PptxRGBColor(100, 116, 139)
    WHITE = PptxRGBColor(255, 255, 255)

    def add_bg(slide, color=BG_LIGHT_PINK):
        shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, PptxInches(13.333), PptxInches(7.5))
        shape.fill.solid()
        shape.fill.fore_color.rgb = color
        shape.line.color.rgb = color
        return shape

    def add_header(slide, title_text, category="SPRINT 4 REVIEW"):
        tx = slide.shapes.add_textbox(PptxInches(0.8), PptxInches(0.5), PptxInches(11.733), PptxInches(1.2))
        tf = tx.text_frame
        tf.word_wrap = True
        p_cat = tf.paragraphs[0]
        p_cat.text = f"3TG STUDY HUB • {category.upper()}"
        p_cat.font.size = PptxPt(11)
        p_cat.font.bold = True
        p_cat.font.color.rgb = PINK_PRIMARY

        p_tit = tf.add_paragraph()
        p_tit.text = title_text
        p_tit.font.size = PptxPt(22)
        p_tit.font.bold = True
        p_tit.font.color.rgb = DARK_TEXT

    # SLIDE 1: COVER
    s1 = prs.slides.add_slide(blank_layout)
    add_bg(s1, BG_LIGHT_PINK)

    card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, PptxInches(1.5), PptxInches(1.2), PptxInches(10.333), PptxInches(5.1))
    card.fill.solid()
    card.fill.fore_color.rgb = WHITE
    card.line.color.rgb = PINK_PRIMARY
    card.line.width = PptxPt(2.5)

    tx1 = s1.shapes.add_textbox(PptxInches(2.0), PptxInches(1.6), PptxInches(9.333), PptxInches(4.2))
    tf1 = tx1.text_frame
    tf1.word_wrap = True

    p = tf1.paragraphs[0]
    p.text = "BÁO CÁO NGHIỆM THU SPRINT 4"
    p.font.size = PptxPt(16)
    p.font.bold = True
    p.font.color.rgb = PINK_PRIMARY
    p.alignment = PP_ALIGN.CENTER

    p = tf1.add_paragraph()
    p.text = "HỆ THỐNG MẠNG XÃ HỘI HỌC TẬP 3TG MESSENGER,\nTRỢ LÝ BOT 3TG & QUẢN TRỊ NHÓM TOÀN DIỆN"
    p.font.size = PptxPt(26)
    p.font.bold = True
    p.font.color.rgb = DARK_TEXT
    p.alignment = PP_ALIGN.CENTER

    p = tf1.add_paragraph()
    p.text = "\nMôn học: Công nghệ phần mềm • GV hướng dẫn: Cô Vân Anh\nNhóm thực hiện: TONE PINK\nLê Văn An (Leader) • Nguyễn Như Quỳnh • Nguyễn Tú"
    p.font.size = PptxPt(13)
    p.font.color.rgb = GRAY_TEXT
    p.alignment = PP_ALIGN.CENTER

    # SLIDE 2: HIGHLIGHTS
    s2 = prs.slides.add_slide(blank_layout)
    add_bg(s2)
    add_header(s2, "CÁC ĐIỂM SÁNG CÔNG NGHỆ HOÀN THIỆN TRONG SPRINT 4")

    cards_data = [
        ("⚡ Phản hồi Optimistic UI (0ms)", "Gửi tin nhắn xuất hiện tức thì không delay, loại bỏ thanh gợi ý rườm rà giúp giao diện thoáng đãng chuẩn Messenger."),
        ("🤖 Tích hợp Bot 3TG Native", "Xóa sạch node_modules bot cũ, chạy trực tiếp trên Node runtime của App, siêu nhẹ, không tốn RAM, tự động nạp vào mọi nhóm."),
        ("🎬 Kho Lệnh Media Đa Dạng", "Hỗ trợ đầy đủ lệnh: !ff, !anime, !gai, !sad, !trai, !anh, !sing, !troll, !info, !bot, !clean, !ai và cơ chế bắt lỗi sailenh thông minh."),
        ("👑 Phân Quyền Quản Trị Nhóm", "Trưởng nhóm (Key holder), Phó nhóm, Thành viên. Hỗ trợ chuyển Key, bổ nhiệm/hạ cấp phó nhóm, kick thành viên, thêm/mời bot."),
        ("🎙️ Đa Phương Tiện & Trích Dẫn", "Gửi ảnh (Lightbox phóng to), Video, Tin nhắn thoại ghi âm trực tiếp, Tệp tài liệu học tập và Trích dẫn trả lời (Quote/Reply)."),
        ("🛡️ Bảo Mật & Đồng Bộ D1", "Kết bạn 2 chiều kiểm duyệt, đồng bộ trạng thái Online thực qua Heartbeat, di trú 100% Cloudflare D1 & SQLite Local.")
    ]

    col_w = PptxInches(3.7)
    row_h = PptxInches(2.2)
    for idx, (title, desc) in enumerate(cards_data):
        c_idx = idx % 3
        r_idx = idx // 3
        left = PptxInches(0.8) + c_idx * PptxInches(3.95)
        top = PptxInches(2.1) + r_idx * PptxInches(2.5)

        sh = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, col_w, row_h)
        sh.fill.solid()
        sh.fill.fore_color.rgb = WHITE
        sh.line.color.rgb = PINK_PRIMARY
        sh.line.width = PptxPt(1.5)

        tx = s2.shapes.add_textbox(left + PptxInches(0.15), top + PptxInches(0.15), col_w - PptxInches(0.3), row_h - PptxInches(0.3))
        tf = tx.text_frame
        tf.word_wrap = True
        p0 = tf.paragraphs[0]
        p0.text = title
        p0.font.size = PptxPt(13)
        p0.font.bold = True
        p0.font.color.rgb = PINK_PRIMARY

        p1 = tf.add_paragraph()
        p1.text = desc
        p1.font.size = PptxPt(11)
        p1.font.color.rgb = DARK_TEXT

    # SLIDE 3: GITHUB ISSUES SPRINT 4
    s3 = prs.slides.add_slide(blank_layout)
    add_bg(s3)
    add_header(s3, "DANH MỤC GITHUB ISSUES SPRINT 4 • TIẾN ĐỘ 100%")

    sh_tbl = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, PptxInches(0.8), PptxInches(2.0), PptxInches(11.733), PptxInches(4.8))
    sh_tbl.fill.solid()
    sh_tbl.fill.fore_color.rgb = WHITE
    sh_tbl.line.color.rgb = PINK_PRIMARY
    sh_tbl.line.width = PptxPt(1.5)

    tx3 = s3.shapes.add_textbox(PptxInches(1.0), PptxInches(2.1), PptxInches(11.333), PptxInches(4.6))
    tf3 = tx3.text_frame
    tf3.word_wrap = True

    iss_list = [
        ("• #SP4-01 [UI/UX] Optimistic Chat UI (0ms delay) & Bỏ thanh gợi ý rườm rà", "✅ Closed (Lê Văn An)"),
        ("• #SP4-02 [Backend] Tích hợp Trợ lý Bot 3TG Native cực nhẹ vào runtime Node của App", "✅ Closed (Lê Văn An)"),
        ("• #SP4-03 [Media] Kho lệnh Media: !ff, !anime, !gai, !sad, !trai, !anh, !sing", "✅ Closed (Nguyễn Như Quỳnh)"),
        ("• #SP4-04 [Bot] Xử lý Báo sai lệnh (sailenh) khi gõ lệnh lạ hoặc ký tự !", "✅ Closed (Nguyễn Tú)"),
        ("• #SP4-05 [Security] Phân quyền Quản trị Nhóm: Chuyển Key, Phó nhóm, Kick thành viên", "✅ Closed (Lê Văn An)"),
        ("• #SP4-06 [Group] Quản lý Bot 3TG: Cho phép Trưởng/Phó nhóm thêm và mời Bot ra", "✅ Closed (Nguyễn Như Quỳnh)"),
        ("• #SP4-07 [Real-time] Đồng bộ thời gian hoạt động thực tế qua Heartbeat định kỳ", "✅ Closed (Nguyễn Tú)"),
        ("• #SP4-08 [Messenger] Đa phương tiện (Ảnh, Video, Audio, File) & Trích dẫn Quote/Reply", "✅ Closed (Lê Văn An)"),
        ("• #SP4-09 [Database] Đồng bộ hóa Schema & Di trú toàn diện Cloudflare D1 & SQLite", "✅ Closed (Lê Văn An)")
    ]

    for title, status in iss_list:
        p = tf3.add_paragraph() if tf3.paragraphs[0].text else tf3.paragraphs[0]
        p.text = f"{title} ── {status}"
        p.font.size = PptxPt(11.5)
        p.font.color.rgb = DARK_TEXT

    # SLIDE 4: CONCLUSION
    s4 = prs.slides.add_slide(blank_layout)
    add_bg(s4)
    add_header(s4, "KẾT LUẬN & SẴN SÀNG NGHIỆM THU ĐỒ ÁN")

    sh4 = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, PptxInches(1.8), PptxInches(2.0), PptxInches(9.733), PptxInches(4.5))
    sh4.fill.solid()
    sh4.fill.fore_color.rgb = WHITE
    sh4.line.color.rgb = PINK_PRIMARY
    sh4.line.width = PptxPt(2)

    tx4 = s4.shapes.add_textbox(PptxInches(2.2), PptxInches(2.4), PptxInches(8.933), PptxInches(3.7))
    tf4 = tx4.text_frame
    tf4.word_wrap = True

    p = tf4.paragraphs[0]
    p.text = "🎉 CHÚC MỪNG NHÓM TONE PINK HOÀN THÀNH SPRINT 4!"
    p.font.size = PptxPt(18)
    p.font.bold = True
    p.font.color.rgb = PINK_PRIMARY
    p.alignment = PP_ALIGN.CENTER

    p = tf4.add_paragraph()
    p.text = (
        "\n✅ Hệ sinh thái 3TG Study Hub đáp ứng 100% yêu cầu đồ án Công nghệ phần mềm.\n"
        "✅ Trải nghiệm nhắn tin thời gian thực 0ms độ trễ, đa phương tiện sống động.\n"
        "✅ Trợ lý Bot 3TG thông minh cùng hệ thống phân quyền quản trị nhóm chặt chẽ.\n"
        "✅ Nhóm TONE PINK xin chân thành cảm ơn cô Vân Anh đã tận tình hướng dẫn!\n"
    )
    p.font.size = PptxPt(13.5)
    p.font.color.rgb = DARK_TEXT
    p.alignment = PP_ALIGN.CENTER

    try:
        prs.save(PPTX_PATH)
        print("✅ Đã tạo thành công PPTX Sprint 4:", PPTX_PATH)
    except PermissionError:
        alt_path = os.path.join(OUTPUT_DIR, "Slide_Thuyet_Trinh_Sprint_4_TONE_PINK_MoiNhat.pptx")
        prs.save(alt_path)
        print("✅ Đã tạo thành công PPTX Sprint 4 (Alt):", alt_path)


# ==========================================
# 3. BUILD GITHUB ISSUES MARKDOWN
# ==========================================
def create_issues_md():
    md_content = """# 📋 Danh Sách GitHub Issues Sprint 4 • Nhóm TONE PINK
**Đồ án:** 3TG Study Hub • **Môn:** Công nghệ phần mềm • **GV:** Cô Vân Anh  
**Nhóm thực hiện:** TONE PINK (Lê Văn An - Lead, Nguyễn Như Quỳnh, Nguyễn Tú)

---

## 📌 Issue #SP4-01: [UI/UX] Tối ưu hóa phản hồi nhắn tin Optimistic UI (0ms delay) & Bỏ thanh gợi ý rườm rà
- **Người thực hiện:** Lê Văn An (Lead)
- **Nhãn (Labels):** `enhancement`, `ui/ux`, `sprint-4`
- **Mô tả:** Khắc phục triệt để độ trễ 1-2s khi gửi tin nhắn trong 3TG Messenger. Áp dụng Optimistic UI rendering để tin nhắn hiển thị ngay lập tức (0ms). Xóa bỏ hoàn toàn thanh gợi ý emoji/lời nhắn rườm rà ở chân chat để khung chat sạch sẽ, chuyên nghiệp.
- **Tiêu chuẩn chấp thuận (Acceptance Criteria):**
  - [x] Tin nhắn xuất hiện tức thì trong khung chat khi nhấn Enter hoặc bấm Gửi.
  - [x] Input và các thanh đính kèm xóa sạch ngay tức khắc.
  - [x] Xóa sạch thẻ `.chat-quick-emojis`.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP4-02: [Backend] Tích hợp Trợ lý Bot 3TG Native cực nhẹ vào runtime Node của App
- **Người thực hiện:** Lê Văn An (Lead)
- **Nhãn (Labels):** `feature`, `backend`, `sprint-4`
- **Mô tả:** Xóa bỏ thư mục `node_modules` nặng nề của botdiscord cũ. Chuyển đổi toàn bộ engine lệnh bot sang module Native `src/bot3tg.js` chạy chung với Node runtime của App, tiêu thụ gần như 0 RAM bổ sung và không phụ thuộc thư viện ngoài.
- **Tiêu chuẩn chấp thuận:**
  - [x] Đã xóa vĩnh viễn `botdiscord-main/node_modules`.
  - [x] Module `src/bot3tg.js` nạp trơn tru qua ES Module.
  - [x] Tự động thêm Bot 3TG vào mọi nhóm mới tạo.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP4-03: [Media] Kho lệnh Media phong phú (!ff, !anime, !gai, !sad, !trai, !anh, !sing)
- **Người thực hiện:** Nguyễn Như Quỳnh
- **Nhãn (Labels):** `feature`, `media`, `sprint-4`
- **Mô tả:** Nạp kho dữ liệu video/ảnh từ `data/media/*.json` vào Bot 3TG. Hỗ trợ đầy đủ các lệnh giải trí: Free Fire (`!ff`), Anime (`!anime`), Gái xinh (`!gai`), Tâm trạng buồn (`!sad`), Trai đẹp (`!trai`), Ảnh ngẫu nhiên (`!anh`), và Phát nhạc (`!sing`).
- **Tiêu chuẩn chấp thuận:**
  - [x] Nhận diện alias phong phú (`!ff`, `!freefire`, `!vdff`, `!gai`, `!girl`...).
  - [x] Trả về link video CDN Supabase sắc nét phát trực tiếp trong nhóm.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP4-04: [Bot] Xử lý Báo sai lệnh (sailenh) khi gõ lệnh lạ hoặc ký tự !
- **Người thực hiện:** Nguyễn Tú
- **Nhãn (Labels):** `enhancement`, `bot`, `sprint-4`
- **Mô tả:** Đảm bảo Bot 3TG luôn phản hồi và không im lặng khi người dùng gõ sai lệnh hoặc chỉ gõ ký tự `!`. Gợi ý người dùng gõ `!help` để khám phá toàn bộ lệnh.
- **Tiêu chuẩn chấp thuận:**
  - [x] Khi gõ lệnh chưa hỗ trợ (VD: `!test`), Bot phản hồi thông báo sai lệnh kèm video/gif vui nhộn.
  - [x] Khi gõ `!`, Bot phản hồi hướng dẫn mở menu lệnh.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP4-05: [Security] Phân quyền Quản trị Nhóm (Chuyển key, Phó nhóm, Kick thành viên)
- **Người thực hiện:** Lê Văn An (Lead)
- **Nhãn (Labels):** `security`, `backend`, `sprint-4`
- **Mô tả:** Xây dựng hệ thống phân quyền nhóm học tập chuẩn RBAC (`admin`, `deputy`, `member`, `bot`):
  - Chuyển giao quyền Trưởng nhóm (Key holder) cho thành viên khác.
  - Bổ nhiệm hoặc thu hồi quyền Phó nhóm.
  - Kick thành viên vi phạm khỏi nhóm (chặn phó nhóm kick trưởng nhóm).
- **Tiêu chuẩn chấp thuận:**
  - [x] API `POST /api/groups/:id/members/kick`
  - [x] API `POST /api/groups/:id/members/role`
  - [x] API `POST /api/groups/:id/members/transfer-owner`
  - [x] Modal hiển thị huy hiệu 👑 Trưởng nhóm, 🛡️ Phó nhóm, 🤖 Trợ lý Bot, 👤 Thành viên.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP4-06: [Group] Quản lý Bot 3TG: Cho phép Trưởng/Phó nhóm thêm và mời Bot ra
- **Người thực hiện:** Nguyễn Như Quỳnh
- **Nhãn (Labels):** `feature`, `group`, `sprint-4`
- **Mô tả:** Trưởng nhóm và Phó nhóm có toàn quyền linh hoạt mời Bot 3TG ra khỏi nhóm chat hoặc thêm lại Bot vào nhóm để hỗ trợ học tập khi cần.
- **Tiêu chuẩn chấp thuận:**
  - [x] API `POST /api/groups/:id/bot` (`action: 'add' | 'remove'`).
  - [x] Nút bấm trực quan trong Modal Thành viên (`[🚫 Mời Bot ra]` / `[➕ Thêm Bot]`).
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP4-07: [Real-time] Đồng bộ thời gian hoạt động thực tế (Active Status) qua Heartbeat
- **Người thực hiện:** Nguyễn Tú
- **Nhãn (Labels):** `bug`, `real-time`, `sprint-4`
- **Mô tả:** Sửa lỗi hiển thị online ảo. Bổ sung trường `last_active_at` và endpoint `/api/user/heartbeat`. Tính toán chuẩn xác trạng thái chấm xanh/xám theo thời gian thực.
- **Tiêu chuẩn chấp thuận:**
  - [x] Người dùng không hoạt động hiển thị đúng 'Hoạt động X phút trước'.
  - [x] Dưới 3 phút hiển thị 'Đang hoạt động' (chấm xanh).
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP4-08: [Messenger] Đa phương tiện & Trích dẫn trả lời tin nhắn (Quote/Reply)
- **Người thực hiện:** Lê Văn An (Lead)
- **Nhãn (Labels):** `feature`, `messenger`, `sprint-4`
- **Mô tả:** Hỗ trợ gửi ảnh kèm Lightbox phóng to, trình phát video, trình phát audio tin nhắn thoại và tệp đính kèm. Hỗ trợ nút reply `↩️` trích dẫn tin nhắn và tự cuộn mượt đến tin nhắn gốc.
- **Tiêu chuẩn chấp thuận:**
  - [x] Xem ảnh phóng to sắc nét khi nhấp.
  - [x] Ghi âm và gửi voice message trực tiếp.
  - [x] Cuộn mượt đến tin nhắn được trích dẫn.
- **Trạng thái:** ✅ **Closed / Done**

---

## 📌 Issue #SP4-09: [Database] Đồng bộ hóa Schema & Di trú toàn diện Cloudflare D1
- **Người thực hiện:** Lê Văn An (Lead)
- **Nhãn (Labels):** `database`, `devops`, `sprint-4`
- **Mô tả:** Khắc phục lỗi `SQLITE_ERROR: no such table: chat_groups` trên Cloudflare D1 Remote Endpoint. Di trú toàn bộ bảng chat nhóm, tin nhắn, bạn bè và nạp sẵn Bot 3TG vào cơ sở dữ liệu.
- **Tiêu chuẩn chấp thuận:**
  - [x] D1 Remote phản hồi HTTP 200 không còn lỗi thiếu bảng.
  - [x] SQLite Local Replica đồng bộ cấu trúc 100%.
- **Trạng thái:** ✅ **Closed / Done**
"""
    with open(ISSUES_MD_PATH, "w", encoding="utf-8") as f:
        f.write(md_content)
    print("✅ Đã tạo thành công GitHub Issues Sprint 4 Markdown:", ISSUES_MD_PATH)


if __name__ == "__main__":
    create_docx()
    create_pptx()
    create_issues_md()
    print("🎉 TẤT CẢ TÀI LIỆU SPRINT 4 ĐÃ ĐƯỢC TẠO HOÀN TẤT!")

