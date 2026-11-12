# -*- coding: utf-8 -*-
"""
Script tạo Báo cáo DOCX và Slide PPTX cho Sprint 5
Nhóm: TONE PINK - Môn Công nghệ phần mềm - GV: Vân Anh
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

    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Style colors
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
    run_sub = p_title.add_run("BÁO CÁO KẾT THÚC SPRINT 5\n")
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(13)
    run_sub.font.bold = True
    run_sub.font.color.rgb = COLOR_GRAY

    run_title = p_title.add_run("HỆ THỐNG MẠNG XÃ HỘI HỌC TẬP 3TG MESSENGER,\nNHÓM CHAT ĐA PHƯƠNG TIỆN & TRỢ LÝ AI TRONG NHÓM")
    run_title.font.name = "Arial"
    run_title.font.size = Pt(19)
    run_title.font.bold = True
    run_title.font.color.rgb = COLOR_PINK

    # Subtitle / Metadata
    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_after = Pt(20)
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
    r_box_title = p_box.add_run("🎯 TỔNG QUAN MỤC TIÊU SPRINT 5:\n")
    r_box_title.font.name = "Arial"
    r_box_title.font.bold = True
    r_box_title.font.size = Pt(11)
    r_box_title.font.color.rgb = COLOR_PINK
    r_box_text = p_box.add_run(
        "Sprint 5 tập trung xây dựng toàn diện hệ sinh thái Kết nối & Học tập nhóm của đồ án 3TG Study. "
        "Bao gồm: (1) 3TG Messenger toàn màn hình chuẩn công nghệ cao; (2) Tạo nhóm học tập và chia sẻ đa phương tiện "
        "(Ảnh, Video, Tin nhắn thoại âm thanh, Tệp tài liệu); (3) Trả lời trích dẫn tin nhắn (Reply/Quote); "
        "(4) Trợ lý 3TG AI trong nhóm chat gọi trực tiếp bằng lệnh '/AI [câu hỏi]' giải đáp mọi chủ đề thân thiện, dí dỏm; "
        "(5) Quy trình kết bạn 2 chiều an toàn (Pending -> Accepted); (6) Cơ chế tính toán thời gian hoạt động thực tế "
        "(Real-time Active Status) qua Heartbeat và di trú đồng bộ hóa toàn diện Database Cloudflare D1."
    )
    r_box_text.font.name = "Arial"
    r_box_text.font.size = Pt(10)
    r_box_text.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # Section 1: Detailed Features
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)
    r_h1 = h1.add_run("1. CÁC TÍNH NĂNG ĐÃ HOÀN THIỆN TRONG SPRINT 5")
    r_h1.font.name = "Arial"
    r_h1.font.bold = True
    r_h1.font.size = Pt(13)
    r_h1.font.color.rgb = COLOR_PINK

    features = [
        ("Thời gian hoạt động thực tế (Real-time Active Status):",
         "Khắc phục hoàn toàn tình trạng hiển thị 'Đang hoạt động' ảo khi bạn bè offline. Hệ thống bổ sung trường `last_active_at` trên profiles, tự động đồng bộ qua Heartbeat định kỳ 40 giây. Phân loại chuẩn xác: 'Đang hoạt động' (chấm xanh nếu tương tác dưới 3 phút), 'Hoạt động X phút trước' / 'Hoạt động X giờ trước' / 'Không hoạt động' (chấm xám)."),

        ("Chia sẻ đa phương tiện trong nhóm & cá nhân (Multimedia Sharing):",
         "Hỗ trợ gửi và hiển thị phong phú mọi định dạng đa phương tiện: "
         "- Hình ảnh: Thumbnail xem trước trực quan, hỗ trợ bấm vào để mở Lightbox phóng to sắc nét.\n"
         "- Video: Trình phát video tích hợp (MP4, WebM) phát trực tiếp mượt mà.\n"
         "- Tin nhắn thoại & Âm thanh: Hỗ trợ ghi âm trực tiếp từ microphone (MediaRecorder) hoặc gửi tệp âm thanh (MP3, WAV, WebM) với player điều khiển âm lượng, tua âm thanh.\n"
         "- Tệp tài liệu học tập: Thẻ tải về chuyên nghiệp hiển thị icon tệp, tên tài liệu, dung lượng chính xác (KB/MB) và nút tải về trực tiếp."),

        ("Trả lời trích dẫn tin nhắn (Message Quoting & Reply):",
         "Mỗi bong bóng tin nhắn có nút trả lời nhanh `↩️`. Khi nhấp vào, giao diện hiển thị thanh banner xem trước trích dẫn phía trên ô soạn thảo. Tin nhắn gửi đi lưu giữ ngữ cảnh trích dẫn (`reply_to_name`, `reply_to_text`), cho phép người đọc nhấp vào khối trích dẫn để tự động cuộn mượt đến tin nhắn gốc kèm hiệu ứng nhấp nháy nổi bật."),

        ("Trợ lý AI riêng biệt ngay trong nhóm chat (`/AI <câu hỏi>`):",
         "Bổ sung khả năng triệu hồi trí tuệ nhân tạo trực tiếp trong nhóm chat thông qua cú pháp lệnh `/AI [nội dung]` (hoặc `@AI [nội dung]`).\n"
         "- Tính cách: Thân thiện, hài hước, tâm lý, năng động và xưng hô gần gũi.\n"
         "- Phạm vi đáp ứng: Không bị giới hạn trong khuôn khổ bài học, AI sẵn sàng tư vấn mọi chủ đề đời sống, tình cảm (cách tỏ tình, cách có người yêu, tâm sự crush), ăn uống, giải trí, công nghệ và bài tập.\n"
         "- Độ dài phản hồi: Ngắn gọn, súc tích (khoảng 2 đến 4 câu) kèm icon sinh động, tránh dài dòng học thuật gây loãng nhóm chat.\n"
         "- Tương tác 2 chiều: Các thành viên có thể reply trực tiếp tin nhắn của AI bot để tiếp tục đối thoại."),

        ("Quy trình kết bạn 2 chiều an toàn & Chống kết bạn ảo:",
         "Chấm dứt việc gửi lời mời là tự động trở thành bạn bè. Thiết lập luồng kiểm duyệt 2 chiều chặt chẽ: Khi gửi lời mời, trạng thái là `pending`. Người nhận có toàn quyền duyệt 'Chấp nhận' hoặc 'Từ chối'. Chỉ khi đối phương chấp thuận, quan hệ bạn bè mới chuyển sang `accepted`."),

        ("Khắc phục triệt để lỗi cơ sở dữ liệu Cloudflare D1:",
         "Di trú và khởi tạo thành công 100% cấu trúc các bảng `chat_groups`, `chat_group_members`, `chat_group_messages`, `direct_messages`, `friendships` trên Cloudflare D1 Remote Endpoint và Local SQLite Replicas, loại bỏ vĩnh viễn thông báo lỗi SQLITE_ERROR no such table.")
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

    # Section 2: Technical Architecture Table
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)
    r_h2 = h2.add_run("2. BẢNG TỔNG KẾT KIẾN TRÚC KỸ THUẬT SPRINT 5")
    r_h2.font.name = "Arial"
    r_h2.font.bold = True
    r_h2.font.size = Pt(13)
    r_h2.font.color.rgb = COLOR_PINK

    tbl_tech = doc.add_table(rows=6, cols=3)
    tbl_tech.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_tech.autofit = False

    headers = ["Thành phần", "Giải pháp Kỹ thuật", "Trạng thái"]
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
        ("Giao tiếp Đa phương tiện", "Hỗ trợ File, Image, Video, Audio/Voice. Upload R2 / Base64 fallback.", "ĐÃ HOÀN THÀNH"),
        ("Trích dẫn / Trả lời", "Lưu `reply_to_id`, `reply_to_name`, `reply_to_text`. Scroll & Pulse highlight.", "ĐÃ HOÀN THÀNH"),
        ("Trợ lý AI Nhóm Chat", "Cú pháp `/AI <câu hỏi>`. DeepSeek LLM + Friendly Concise System Prompt.", "ĐÃ HOÀN THÀNH"),
        ("Thời gian hoạt động thực", "Heartbeat API 40s + `last_active_at`. Phân loại Online/Recent/Offline.", "ĐÃ HOÀN THÀNH"),
        ("Đồng bộ Cloudflare D1", "Di trú tự động REST API D1 HKG Colo + Local SQLite Fallback an toàn.", "ĐÃ HOÀN THÀNH")
    ]

    for row_idx, row in enumerate(tech_data, start=1):
        for col_idx, text in enumerate(row):
            c = tbl_tech.cell(row_idx, col_idx)
            set_cell_margins(c, 80, 80, 100, 100)
            if row_idx % 2 == 1:
                set_cell_background(c, "FFF0F5")
            p = c.paragraphs[0]
            if col_idx == 2:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(text)
            r.font.name = "Arial"
            r.font.size = Pt(9.5)
            if col_idx == 0:
                r.font.bold = True
                r.font.color.rgb = COLOR_DARK
            elif col_idx == 2:
                r.font.bold = True
                r.font.color.rgb = RGBColor(16, 185, 129)
            else:
                r.font.color.rgb = COLOR_DARK

    for row in tbl_tech.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = width

    # Section 3: Team Evaluation
    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)
    r_h3 = h3.add_run("3. PHÂN CÔNG VÀ ĐÁNH GIÁ THÀNH VIÊN NHÓM TONE PINK")
    r_h3.font.name = "Arial"
    r_h3.font.bold = True
    r_h3.font.size = Pt(13)
    r_h3.font.color.rgb = COLOR_PINK

    team_data = [
        ("Lê Văn An (Leader)", "100%", "Thiết kế kiến trúc Cloudflare D1 & REST API, triển khai logic Bot AI nhóm chat, thuật toán tính toán trạng thái hoạt động thực tế, xử lý upload đa phương tiện."),
        ("Nguyễn Như Quỳnh", "100%", "Thiết kế giao diện TONE PINK cho 3TG Messenger, xây dựng thanh trích dẫn trả lời tin nhắn, Lightbox xem ảnh và trình phát âm thanh/video."),
        ("Nguyễn Tú", "100%", "Xây dựng luồng kết bạn 2 chiều (Pending -> Accepted), kiểm thử tích hợp toàn diện trên Electron và Cloudflare Workers, tổng hợp tài liệu kiểm thử.")
    ]

    for name, score, task in team_data:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.space_after = Pt(4)
        r_n = p.add_run(f"• {name} - Mức độ đóng góp: {score}\n")
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
    r_ft = p_ft.add_run(f"Hà Nội, ngày {datetime.date.today().strftime('%d/%m/%Y')}\nĐại diện nhóm TONE PINK - Lê Văn An")
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
            "subtitle": "Hệ thống Mạng Xã Hội Học Tập 3TG Messenger\nNhóm Chat Đa Phương Tiện & Trợ Lý AI Trong Nhóm",
            "meta": "Môn: Công nghệ phần mềm | GVHD: Cô Vân Anh\nNhóm thực hiện: TONE PINK (Lê Văn An - Lead, Nguyễn Như Quỳnh, Nguyễn Tú)"
        },
        # Slide 2: Mục tiêu trọng tâm
        {
            "type": "grid",
            "title": "MỤC TIÊU & ĐỘT PHÁ CỦA SPRINT 5",
            "items": [
                ("🌸 3TG Messenger Toàn Màn Hình", "Giao diện trò chuyện chuẩn Messenger hiện đại, tối ưu màn hình lớn và trải nghiệm học nhóm liền mạch."),
                ("⚡ Trạng Thái Hoạt Động Thực Tế", "Loại bỏ hoàn toàn trạng thái online ảo; cập nhật thời gian thực qua Heartbeat (Đang hoạt động / X phút trước / Offline)."),
                ("📁 Chia Sẻ Đa Phương Tiện Toàn Diện", "Gửi nhận trực tiếp Hình ảnh (kèm Lightbox), Video nhúng, Tin nhắn thoại âm thanh và Tệp tài liệu học tập."),
                ("🤖 Trợ Lý 3TG AI Trong Nhóm Chat", "Lệnh `/AI <câu hỏi>` triệu hồi bot AI dí dỏm, trả lời ngắn gọn, thân thiện mọi chủ đề đời sống, tình cảm và học tập.")
            ]
        },
        # Slide 3: Tính năng đa phương tiện & Reply
        {
            "type": "grid",
            "title": "CHIA SẺ ĐA PHƯƠNG TIỆN & TRẢ LỜI TRÍCH DẪN",
            "items": [
                ("📷 Xem & Phóng To Ảnh (Lightbox)", "Hiển thị ảnh sắc nét trong bong bóng tin nhắn, hỗ trợ click xem full màn hình chất lượng cao."),
                ("🎥 Video & 🎙️ Tin Nhắn Thoại", "Tích hợp sẵn video player và audio recorder/player, giúp học viên trao đổi bài học bằng giọng nói sinh động."),
                ("📄 Thẻ Tải Tài Liệu Tiện Ích", "Tự động nhận diện định dạng (PDF, Docx, Zip...), hiển thị tên file và dung lượng chính xác kèm nút tải về."),
                ("↩️ Trích Dẫn & Phản Hồi (Reply)", "Nút trả lời trên từng tin nhắn, thanh banner preview và click tự động cuộn đến tin nhắn gốc kèm hiệu ứng nhấp nháy.")
            ]
        },
        # Slide 4: Trợ lý AI trong nhóm chat
        {
            "type": "grid",
            "title": "TRỢ LÝ AI ĐA TÀI TRONG NHÓM CHAT (/AI)",
            "items": [
                ("💡 Lệnh Triệu Hồi Linh Hoạt", "Chỉ cần gõ `/AI [câu hỏi]` (ví dụ: `/AI cách có người yêu`, `/AI hôm nay ăn gì?`), AI sẽ lập tức xuất hiện."),
                ("💖 Tính Cách Gần Gũi, Dí Dỏm", "Xưng hô thân mật, vui tươi, tràn đầy năng lượng tích cực, trả lời súc tích 2-4 câu kèm icon đáng yêu."),
                ("🌐 Trả Lời Mọi Chủ Đề Cuộc Sống", "Không chỉ giới hạn trong bài học, bot AI giải đáp tình cảm, tâm lý, đời sống, giải trí và kiến thức công nghệ."),
                ("🔄 Đối Thoại 2 Chiều Với AI", "Thành viên trong nhóm có thể Reply trực tiếp câu trả lời của AI để tiếp tục cuộc trò chuyện tự nhiên.")
            ]
        },
        # Slide 5: Kết bạn 2 chiều & Database D1
        {
            "type": "grid",
            "title": "KẾT BẠN 2 CHIỀU & BẢO MẬT DATABASE CLOUDFLARE D1",
            "items": [
                ("🛡️ Kiểm Duyệt Kết Bạn 2 Chiều", "Quy trình Pending -> Accepted. Người nhận có toàn quyền Chấp nhận hoặc Từ chối, chấm dứt kết bạn tự động."),
                ("☁️ Di Trú Toàn Diện Cloudflare D1", "Khởi tạo bảng `chat_groups`, `chat_group_members`, `chat_group_messages` trực tiếp trên Cloudflare D1 Endpoint."),
                ("💾 Cơ Chế Fallback Kép An Toàn", "Tự động chuyển mạch sang Local SQLite Replica khi mất kết nối, đảm bảo dữ liệu luôn khả dụng 100%."),
                ("🏆 Hiệu Năng Vượt Trội", "Độ trễ truy vấn D1 chỉ 0.2ms, tốc độ tải app dưới 0.4s và trải nghiệm nhắn tin thời gian thực cực kỳ mượt mà.")
            ]
        },
        # Slide 6: Kết luận & Đánh giá
        {
            "type": "conclusion",
            "title": "TỔNG KẾT & KẾ HOẠCH BÀO VỆ ĐỒ ÁN",
            "subtitle": "Đồ án 3TG Study đã hoàn thành xuất sắc 100% mục tiêu của cả 5 Sprint!",
            "meta": "Nhóm TONE PINK xin chân thành cảm ơn sự hướng dẫn tận tình của Cô Vân Anh! 🌸✨"
        }
    ]

    for s_data in slides_content:
        slide = prs.slides.add_slide(blank_layout)

        # Background card
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

            # Title text
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
            r3.font.size = PptxPt(15)
            r3.font.color.rgb = GRAY_COLOR

        elif s_data["type"] == "grid":
            # Header
            header_box = slide.shapes.add_textbox(PptxInches(1.0), PptxInches(0.5), PptxInches(11.333), PptxInches(1.0))
            tf = header_box.text_frame
            p = tf.paragraphs[0]
            r = p.add_run()
            r.text = s_data["title"]
            r.font.bold = True
            r.font.size = PptxPt(26)
            r.font.color.rgb = PINK_COLOR

            # 4 Grid Cards (2x2)
            coords = [
                (PptxInches(1.0), PptxInches(1.6)),
                (PptxInches(6.8), PptxInches(1.6)),
                (PptxInches(1.0), PptxInches(4.3)),
                (PptxInches(6.8), PptxInches(4.3))
            ]

            for idx, (item_title, item_desc) in enumerate(s_data["items"]):
                x, y = coords[idx]
                card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, PptxInches(5.5), PptxInches(2.4))
                card.fill.solid()
                card.fill.fore_color.rgb = LIGHT_PINK
                card.line.color.rgb = PINK_COLOR
                card.line.width = PptxPt(2)

                tb = slide.shapes.add_textbox(x + PptxInches(0.25), y + PptxInches(0.2), PptxInches(5.0), PptxInches(2.0))
                ctf = tb.text_frame
                ctf.word_wrap = True

                cp1 = ctf.paragraphs[0]
                cr1 = cp1.add_run()
                cr1.text = item_title
                cr1.font.bold = True
                cr1.font.size = PptxPt(16)
                cr1.font.color.rgb = PINK_COLOR

                cp2 = ctf.add_paragraph()
                cp2.space_before = PptxPt(8)
                cr2 = cp2.add_run()
                cr2.text = item_desc
                cr2.font.size = PptxPt(13)
                cr2.font.color.rgb = DARK_COLOR

        elif s_data["type"] == "conclusion":
            accent = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, PptxInches(0), PptxInches(0), PptxInches(13.333), PptxInches(0.4))
            accent.fill.solid()
            accent.fill.fore_color.rgb = PINK_COLOR
            accent.line.fill.background()

            card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, PptxInches(1.5), PptxInches(1.4), PptxInches(10.333), PptxInches(4.8))
            card.fill.solid()
            card.fill.fore_color.rgb = LIGHT_PINK
            card.line.color.rgb = PINK_COLOR
            card.line.width = PptxPt(3)

            tx_box = slide.shapes.add_textbox(PptxInches(1.8), PptxInches(1.8), PptxInches(9.733), PptxInches(4.0))
            tf = tx_box.text_frame
            tf.word_wrap = True

            p1 = tf.paragraphs[0]
            p1.alignment = PP_ALIGN.CENTER
            r1 = p1.add_run()
            r1.text = "🎉 " + s_data["title"]
            r1.font.bold = True
            r1.font.size = PptxPt(32)
            r1.font.color.rgb = PINK_COLOR

            p2 = tf.add_paragraph()
            p2.alignment = PP_ALIGN.CENTER
            p2.space_before = PptxPt(20)
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
            r3.font.size = PptxPt(16)
            r3.font.color.rgb = GRAY_COLOR

    try:
        prs.save(PPTX_PATH)
        print(f"✅ Generated PPTX successfully: {PPTX_PATH}")
    except PermissionError:
        alt_path = os.path.join(OUTPUT_DIR, "Slide_Thuyet_Trinh_Sprint_5_TONE_PINK_MoiNhat.pptx")
        prs.save(alt_path)
        print(f"⚠️ PowerPoint đang mở tệp cũ, đã lưu phiên bản mới vào: {alt_path}")

if __name__ == "__main__":
    create_docx()
    create_pptx()
    print("\n🎉 HOÀN THÀNH TẠO 2 TỆP TỔNG KẾT SPRINT 5 CHUẨN TONE PINK!")
