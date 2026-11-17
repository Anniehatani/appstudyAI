# -*- coding: utf-8 -*-
"""
Script tái tạo Slide PPTX và Báo cáo DOCX Tổng kết Môn học Công nghệ phần mềm
Đổi mới 100% cấu trúc slide: Mỗi slide là một layout kiến trúc riêng biệt,
loại bỏ hoàn toàn sự trùng lặp 2x2 grid, nâng cấp thẩm mỹ TONE PINK cao cấp.
Nhóm thực hiện: TONE PINK (Lê Văn An - Lead, Nguyễn Như Quỳnh, Nguyễn Tú)
Giảng viên hướng dẫn: ThS. Vân Anh
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

OUTPUT_DIR = r"c:\Users\LeVanAn\Documents\ChatGPT\app study 2\tổng kết dự án"
os.makedirs(OUTPUT_DIR, exist_ok=True)
PPTX_PATH = os.path.join(OUTPUT_DIR, "Slide_Thuyet_Trinh_Tong_Ket_Mon_Hoc_TONE_PINK.pptx")

# ==========================================
# COLOR PALETTE (TONE PINK DESIGN SYSTEM)
# ==========================================
DARK_BG      = RGBColor(15, 23, 42)      # #0F172A Deep Navy
DARKER_BG    = RGBColor(11, 15, 25)      # #0B0F19 Near Black
CARD_DARK    = RGBColor(30, 41, 59)      # #1E293B Slate Navy
WHITE        = RGBColor(255, 255, 255)  # #FFFFFF Pure White
PINK_PRIMARY = RGBColor(232, 62, 140)    # #E83E8C Vibrant Pink
PINK_NEON    = RGBColor(255, 46, 147)    # #FF2E93 Neon Pink
PINK_SOFT    = RGBColor(255, 240, 245)   # #FFF0F5 Light Pink
PINK_MUTED   = RGBColor(255, 228, 238)   # #FFE4EE
SLATE_50     = RGBColor(248, 250, 252)   # #F8FAFC
SLATE_100    = RGBColor(241, 245, 249)   # #F1F5F9
SLATE_200    = RGBColor(226, 232, 240)   # #E2E8F0 Border
SLATE_600    = RGBColor(71, 85, 105)     # #475569
SLATE_700    = RGBColor(51, 65, 85)      # #334155
SLATE_900    = RGBColor(15, 23, 42)      # #0F172A Dark Text
EMERALD      = RGBColor(16, 185, 129)    # #10B981 Green
AMBER        = RGBColor(245, 158, 11)    # #F59E0B Gold
INDIGO       = RGBColor(99, 102, 241)    # #6366F1 Purple-Indigo


from docx import Document
from docx.shared import Inches as DocxInches, Pt as DocxPt, RGBColor as DocxRGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOCX_PATH = os.path.join(OUTPUT_DIR, "Bao_Cao_Tong_Ket_Mon_Hoc_TONE_PINK.docx")

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

def add_header_styled(doc, text, level=1):
    h = doc.add_paragraph()
    h.paragraph_format.keep_with_next = True
    if level == 1:
        h.paragraph_format.space_before = DocxPt(16)
        h.paragraph_format.space_after = DocxPt(6)
        r = h.add_run(text)
        r.font.name = "Arial"
        r.font.size = DocxPt(14)
        r.font.bold = True
        r.font.color.rgb = DocxRGBColor(232, 62, 140) # Pink
    elif level == 2:
        h.paragraph_format.space_before = DocxPt(12)
        h.paragraph_format.space_after = DocxPt(4)
        r = h.add_run(text)
        r.font.name = "Arial"
        r.font.size = DocxPt(12)
        r.font.bold = True
        r.font.color.rgb = DocxRGBColor(26, 31, 44) # Dark
    elif level == 3:
        h.paragraph_format.space_before = DocxPt(8)
        h.paragraph_format.space_after = DocxPt(3)
        r = h.add_run(text)
        r.font.name = "Arial"
        r.font.size = DocxPt(11)
        r.font.bold = True
        r.font.italic = True
        r.font.color.rgb = DocxRGBColor(100, 116, 139) # Gray
    return h

def add_callout(doc, title, text, bg_hex="FFF0F5", border_hex="E83E8C"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    cell.width = DocxInches(6.8)
    set_cell_background(cell, bg_hex)
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = DocxPt(0)
    r_t = p.add_run(title + "\n")
    r_t.font.name = "Arial"
    r_t.font.bold = True
    r_t.font.size = DocxPt(10.5)
    r_t.font.color.rgb = DocxRGBColor(232, 62, 140) if border_hex == "E83E8C" else DocxRGBColor(26, 31, 44)
    r_c = p.add_run(text)
    r_c.font.name = "Arial"
    r_c.font.size = DocxPt(10)
    r_c.font.color.rgb = DocxRGBColor(26, 31, 44)
    doc.add_paragraph().paragraph_format.space_after = DocxPt(6)

def add_styled_table(doc, headers, data, col_widths=None):
    tbl = doc.add_table(rows=len(data) + 1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    # Header row
    hdr_cells = tbl.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], "E83E8C")
        set_cell_margins(hdr_cells[i], top=100, bottom=100, left=120, right=120)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in p.runs:
            run.font.name = "Arial"
            run.font.bold = True
            run.font.size = DocxPt(9.5)
            run.font.color.rgb = DocxRGBColor(255, 255, 255)
            
    # Data rows
    for r_idx, row_data in enumerate(data):
        row_cells = tbl.rows[r_idx + 1].cells
        bg_color = "FFF0F5" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, cell_value in enumerate(row_data):
            row_cells[c_idx].text = str(cell_value)
            set_cell_background(row_cells[c_idx], bg_color)
            set_cell_margins(row_cells[c_idx], top=80, bottom=80, left=100, right=100)
            p = row_cells[c_idx].paragraphs[0]
            if c_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.name = "Arial"
                run.font.size = DocxPt(9)
                run.font.color.rgb = DocxRGBColor(26, 31, 44)
                
    if col_widths:
        for row in tbl.rows:
            for idx, width in enumerate(col_widths):
                row.cells[idx].width = DocxInches(width)
                
    doc.add_paragraph().paragraph_format.space_after = DocxPt(8)

# ==========================================
# 1. BUILD COMPREHENSIVE DOCX
# ==========================================
def build_docx_report():
    print("-> Bắt đầu tạo Báo cáo Word Tổng kết Môn học...")
    doc = Document()
    for s in doc.sections:
        s.top_margin = DocxInches(0.8)
        s.bottom_margin = DocxInches(0.8)
        s.left_margin = DocxInches(0.8)
        s.right_margin = DocxInches(0.8)
        
    COLOR_PINK = DocxRGBColor(232, 62, 140)
    COLOR_DARK = DocxRGBColor(26, 31, 44)
    COLOR_GRAY = DocxRGBColor(100, 116, 139)
    
    # Title & Metadata
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = DocxPt(16)
    p_title.paragraph_format.space_after = DocxPt(4)
    r_sub = p_title.add_run("BÁO CÁO TỔNG KẾT MÔN HỌC CÔNG NGHỆ PHẦN MỀM\n")
    r_sub.font.name = "Arial"
    r_sub.font.size = DocxPt(13)
    r_sub.font.bold = True
    r_sub.font.color.rgb = COLOR_GRAY
    
    r_main = p_title.add_run("TỔNG HỢP KIẾN THỨC MÔN HỌC, ĐỐI CHIẾU THỰC TIỄN ÁP DỤNG\nTRONG ĐỒ ÁN 3TG STUDY & BẢN TỰ ĐÁNH GIÁ KẾT QUẢ")
    r_main.font.name = "Arial"
    r_main.font.size = DocxPt(17)
    r_main.font.bold = True
    r_main.font.color.rgb = COLOR_PINK
    
    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_after = DocxPt(14)
    r_meta = p_meta.add_run(
        "Giảng viên hướng dẫn: ThS. Vân Anh\n"
        "Nhóm thực hiện: TONE PINK (Lê Văn An - Lead, Nguyễn Như Quỳnh, Nguyễn Tú)\n"
        "Đề tài cuối kỳ: Hệ sinh thái học tập thông minh 3TG Study (3TG Study AI) | Phiên bản hoàn thiện: v9.9.9"
    )
    r_meta.font.name = "Arial"
    r_meta.font.size = DocxPt(10.5)
    r_meta.font.italic = True
    r_meta.font.color.rgb = COLOR_DARK
    
    # Callout overview
    add_callout(
        doc,
        "📌 TỔNG QUAN BÁO CÁO TỔNG KẾT MÔN HỌC:",
        "Báo cáo này được cấu trúc thành 3 phần trọng tâm theo đúng yêu cầu của Giảng viên:\n"
        "1. Tóm tắt toàn diện hệ thống lý thuyết cốt lõi đã tiếp thu trong môn học Công nghệ phần mềm: Từ quy trình phát triển SDLC (Agile/Scrum), kỹ nghệ yêu cầu, thiết kế kiến trúc phân tầng & cơ sở dữ liệu 3NF, UI/UX & Gamification, quản trị mã nguồn Git/GitHub, chiến lược kiểm thử chất lượng, đến đóng gói, bảo mật OWASP và DevOps.\n"
        "2. Trình bày chi tiết nội dung nhóm TONE PINK đã ứng dụng thực tiễn vào đồ án bài tập lớn 3TG Study qua 5 Sprint hoàn chỉnh: Kèm số liệu minh chứng, kiến trúc hệ thống, và toàn bộ lịch sử git commits, pull requests, issues trên GitHub.\n"
        "3. Tự đánh giá khách quan kết quả đạt được sau môn học: Về mức độ hoàn thiện sản phẩm, năng lực kỹ thuật và kỹ năng làm việc nhóm, các thách thức kỹ thuật lớn đã vượt qua và định hướng phát triển trong tương lai."
    )
    
    # ==========================================
    # PHẦN 1: LÝ THUYẾT MÔN HỌC
    # ==========================================
    add_header_styled(doc, "PHẦN I: TỔNG HỢP KIẾN THỨC ĐÃ HỌC TRONG MÔN CÔNG NGHỆ PHẦN MỀM", level=1)
    
    add_header_styled(doc, "1. Tổng quan Công nghệ phần mềm & Quy trình phát triển (SDLC)", level=2)
    p = doc.add_paragraph()
    p.add_run(
        "Công nghệ phần mềm (Software Engineering - SE) là ngành khoa học ứng dụng các nguyên lý toán học, kỹ thuật và quản lý "
        "vào việc xây dựng, vận hành và bảo trì các hệ thống phần mềm một cách có hệ thống, kỷ luật và định lượng được. "
        "Môn học đã trang bị nền tảng về Vòng đời phát triển phần mềm (Software Development Life Cycle - SDLC) và so sánh chuyên sâu các mô hình quy trình:\n"
        "• Mô hình Thác nước (Waterfall Model): Tiếp cận tuần tự tuyến tính qua các giai đoạn Xác định yêu cầu -> Phân tích thiết kế -> Cài đặt mã nguồn -> Kiểm thử -> Triển khai & Bảo trì. Ưu điểm là chặt chẽ, dễ quản lý mốc bàn giao, nhưng nhược điểm chí mạng là kém linh hoạt, khó thích ứng với các thay đổi yêu cầu phát sinh.\n"
        "• Mô hình Tăng trưởng & Tiến hóa (Incremental & Evolutionary): Cho phép xây dựng hệ thống theo từng phần chức năng bàn giao dần cho khách hàng.\n"
        "• Khung làm việc Linh hoạt (Agile / Scrum): Triết lý phát triển thích ứng, chia nhỏ dự án thành các chu kỳ ngắn hạn gọi là Sprint (thường từ 1-4 tuần). Mỗi Sprint là một chu trình SDLC thu nhỏ, kết thúc bằng một Sản phẩm có thể chuyển giao được (Potentially Shippable Increment). Môn học đã đào tạo chi tiết 3 vai trò (Product Owner, Scrum Master, Development Team), 4 sự kiện (Sprint Planning, Daily Scrum, Sprint Review, Sprint Retrospective) và 3 tạo tác (Product Backlog, Sprint Backlog, Increment)."
    )
    
    add_header_styled(doc, "2. Kỹ nghệ Yêu cầu phần mềm (Requirements Engineering)", level=2)
    p = doc.add_paragraph()
    p.add_run(
        "Kỹ nghệ yêu cầu là bước khởi đầu quyết định sự thành bại của dự án phần mềm, bao gồm các hoạt động: Thu thập (Elicitation), Phân tích (Analysis), Đặc tả (Specification), và Thẩm định (Validation):\n"
        "• Phân loại yêu cầu: Yêu cầu chức năng (Functional Requirements - FR) mô tả những gì hệ thống phải thực hiện (các dịch vụ, tính năng, hành vi tính toán); Yêu cầu phi chức năng (Non-Functional Requirements - NFR) mô tả các ràng buộc về hiệu năng, độ sẵn sàng, bảo mật, tính khả dụng và khả năng mở rộng.\n"
        "• Kỹ thuật User Story: Viết dưới dạng mẫu tiêu chuẩn: 'As a [role], I want [feature], so that [business value]'. Tiêu chuẩn đánh giá INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable).\n"
        "• Tiêu chuẩn nghiệm thu (Acceptance Criteria): Định nghĩa cụ thể điều kiện chấp nhận tính năng thông qua cấu trúc BDD Given-When-Then.\n"
        "• Mô hình hóa yêu cầu phần mềm: Sử dụng ngôn ngữ mô hình hóa thống nhất (UML) để phác thảo biểu đồ Use Case, Activity Diagram và Sequence Diagram biểu diễn tương tác giữa tác nhân (Actor) và hệ thống."
    )
    
    add_header_styled(doc, "3. Thiết kế Kiến trúc phần mềm & Cơ sở dữ liệu (Architecture & DB Design)", level=2)
    p = doc.add_paragraph()
    p.add_run(
        "Kiến trúc phần mềm định hình cấu trúc tổng thể và mối quan hệ giữa các thành phần logic trong hệ thống:\n"
        "• Phong cách kiến trúc (Architectural Styles): So sánh giữa Kiến trúc nguyên khối (Monolith), Kiến trúc phân tầng (Layered 3-Tier), Kiến trúc vi dịch vụ (Microservices), và Kiến trúc Serverless Edge Computing hiện đại (xử lý phân tán tại biên mạng, mở rộng quy mô tức thì với chi phí tối ưu).\n"
        "• Chuẩn hóa Cơ sở dữ liệu quan hệ (Database Normalization): Quy trình tổ chức dữ liệu nhằm giảm dư thừa và ngăn ngừa dị thường cập nhật, đạt chuẩn 1NF (tính nguyên tố của thuộc tính), 2NF (loại bỏ phụ thuộc hàm từng phần vào khóa chính), và 3NF (loại bỏ phụ thuộc bắc cầu).\n"
        "• Mẫu thiết kế phần mềm (Design Patterns): Áp dụng các mẫu thiết kế kinh điển như Factory, Proxy, Module, Observer/Pub-Sub, và đặc biệt là Transactional Outbox Pattern nhằm đảm bảo tính nhất quán cuối cùng (Eventual Consistency) trong việc đồng bộ dữ liệu giữa các kho lưu trữ phân tán."
    )
    
    add_header_styled(doc, "4. Thiết kế Giao diện người dùng & Tâm lý học Gamification (UI/UX & HCI)", level=2)
    p = doc.add_paragraph()
    p.add_run(
        "Thiết kế giao diện và trải nghiệm người dùng hiện đại dựa trên nguyên lý tương tác người - máy (HCI):\n"
        "• 10 nguyên tắc thẩm định công thái học của Jakob Nielsen: Hiển thị trạng thái hệ thống rõ ràng, nhất quán chuẩn mực, ngăn ngừa lỗi trước khi xảy ra, tự do điều khiển cho người dùng, và tối ưu hóa tính linh hoạt.\n"
        "• Tâm lý học Gamification trong học tập: Vận dụng Thuyết Tự quyết (Self-Determination Theory - SDT) nhằm kích thích động lực nội tại của người học thông qua 3 yếu tố: Tính tự chủ (Autonomy - tự do chọn môn học và chủ đề), Tính năng lực (Competence - chinh phục bài học nhận XP, duy trì Streak), và Tính gắn kết (Relatedness - bạn bè, mạng xã hội, phòng học chung Pomodoro)."
    )
    
    add_header_styled(doc, "5. Quản trị Phiên bản & Quy trình làm việc nhóm (Git & GitHub Collaboration)", level=2)
    p = doc.add_paragraph()
    p.add_run(
        "Quản lý mã nguồn phân tán bằng Git là kỹ năng sống còn trong quy trình công nghệ phần mềm thực tế:\n"
        "• Chiến lược phân nhánh (Branching Strategy): Áp dụng mô hình Feature Branching kết hợp Trunk-Based Development, mỗi tính năng phát triển trên nhánh độc lập, kiểm thử kỹ lưỡng trước khi mở Pull Request hợp nhất vào nhánh `main`.\n"
        "• Chuẩn mực ghi chú commit (Conventional Commits): Tuân thủ cú pháp `type(scope): subject` (`feat`, `fix`, `perf`, `docs`, `chore`, `refactor`) giúp lịch sử repository rõ ràng, minh bạch và tự động hóa sinh Release Notes.\n"
        "• Quản lý dự án tích hợp trên GitHub: Khai thác GitHub Issues để theo dõi đầu việc, gán nhãn (labels), người chịu trách nhiệm (assignees), và gắn kết trực tiếp với các commit giải quyết sự cố."
    )
    
    add_header_styled(doc, "6. Kiểm thử phần mềm & Đảm bảo chất lượng (Software Quality Assurance & Testing)", level=2)
    p = doc.add_paragraph()
    p.add_run(
        "Kiểm thử là mắt xích cốt lõi để đảm bảo phần mềm hoạt động chính xác và tin cậy theo đúng đặc tả yêu cầu:\n"
        "• Kim tự tháp kiểm thử (Test Pyramid): Tầng đáy Unit Testing (kiểm thử hàm tính toán GPA, băm mật khẩu, thuật toán streak), Tầng giữa Integration Testing (kiểm thử kết nối API, truy vấn cơ sở dữ liệu D1/SQLite, đồng bộ outbox), Tầng đỉnh E2E/UI Testing (kiểm thử luồng người dùng thực tế từ đăng nhập, học trắc nghiệm, chat đến xuất báo cáo).\n"
        "• Kỹ thuật thiết kế ca kiểm thử: Hộp đen (Black-box testing: Phân hoạch tương đương, Phân tích giá trị biên) và Hộp trắng (White-box testing: Statement coverage, Branch coverage).\n"
        "• Vòng đời quản lý lỗi (Defect Life Cycle): Từ New -> Assigned -> Open -> Fixed -> Retested -> Closed."
    )
    
    add_header_styled(doc, "7. Triển khai, Đóng gói Desktop, An toàn bảo mật & Tối ưu hóa (DevOps & Security)", level=2)
    p = doc.add_paragraph()
    p.add_run(
        "Kỹ thuật đưa phần mềm ra môi trường thực tế an toàn và đạt hiệu năng tối ưu:\n"
        "• Đóng gói Desktop đa nền tảng bằng Electron: Sử dụng Electron Builder, đóng gói ứng dụng trong kho lưu trữ ASAR bảo vệ mã nguồn, cấu hình Single Instance Lock ngăn ngừa đa tiến trình xung đột, tối ưu hóa kích thước bộ cài.\n"
        "• An toàn bảo mật theo chuẩn OWASP Top 10: Chống SQL Injection bằng kỹ thuật Prepared Statements & Tham số hóa; Mã hóa và băm mật khẩu chuyên dụng với PBKDF2/Argon2 kèm Salt ngẫu nhiên chống Rainbow Table; Rate Limiting kiểm soát tần suất chống tấn công Brute-force; Cách ly an toàn biến môi trường và bí mật hệ thống.\n"
        "• Tối ưu hóa trải nghiệm trên thiết bị hạn chế tài nguyên: Kỹ thuật ảo hóa hiển thị DOM (`content-visibility: auto`), chia tách tầng GPU rendering (`transform: translateZ(0)`), và khởi tạo cửa sổ song song rút ngắn thời gian Cold Launch."
    )
    
    # ==========================================
    # PHẦN 2: NỘI DUNG NHÓM ĐÃ ÁP DỤNG TRONG 3TG STUDY
    # ==========================================
    add_header_styled(doc, "PHẦN II: NỘI DUNG NHÓM TONE PINK ĐÃ ÁP DỤNG TRONG ĐỒ ÁN 3TG STUDY", level=1)
    
    add_header_styled(doc, "1. Tổng quan Đề tài & Tổ chức nhân sự nhóm TONE PINK", level=2)
    p = doc.add_paragraph()
    p.add_run(
        "Đề tài của nhóm là '3TG Study — Học Vui Mỗi Ngày' (3TG Study AI), một nền tảng học tập thông minh kết hợp Gamification "
        "phong cách Duolingo, Trợ lý Trí tuệ Nhân tạo DeepSeek AI giải bài tập, Mạng xã hội kết nối sinh viên và Không gian học siêu tập trung Pomodoro Zen Kiosk. "
        "Dự án được triển khai bài bản qua 5 Sprint liên tục theo chuẩn Agile/Scrum."
    )
    
    team_headers = ["STT", "Thành viên", "Tài khoản GitHub", "Vai trò trong Đồ án", "Trách nhiệm chính đảm nhiệm"]
    team_data = [
        ["1", "Lê Văn An (Lead)", "@Anniehatani", "Nhóm trưởng, Kiến trúc, Backend, AI & Security Lead", "Thiết lập kiến trúc Serverless Cloudflare, phát triển toàn bộ REST API, tích hợp DeepSeek AI Vision, bảo mật OWASP PBKDF2, AI Anti-Abuse Shield, đóng gói Electron Desktop."],
        ["2", "Nguyễn Như Quỳnh", "@nguyennhuuquynhh07-07", "Frontend Lead, Mascot, Themes & UI/UX Design", "Hiện thực hóa giao diện Duolingo Path, hệ sinh thái 6 Themes sống động, thiết kế Mascot Thỏ Bảy Màu động, làm đẹp trang cá nhân, slide thuyết trình và trải nghiệm người dùng."],
        ["3", "Nguyễn Tú", "@tus-sud", "Database, Gamification Logic, Kiosk & QA Lead", "Thiết kế CSDL quan hệ 3NF (10 môn, 29.000 câu hỏi), lập trình logic Trái tim, Streak, Gems, kiểm soát xác thực thời gian Pomodoro Kiosk, bộ tài liệu Test Case và quản trị chất lượng."]
    ]
    add_styled_table(doc, team_headers, team_data, [0.5, 1.3, 1.4, 1.5, 2.1])
    
    add_header_styled(doc, "2. Chi tiết hiện thực hóa qua 5 Sprint thực chiến", level=2)
    
    # Sprint 1
    add_header_styled(doc, "Sprint 1: Khởi tạo Kiến trúc Serverless, CSDL 3NF & Gamification Cốt Lõi", level=3)
    p = doc.add_paragraph()
    p.add_run(
        "• Áp dụng lý thuyết: Kiến trúc Serverless Edge (Cloudflare Workers + D1 SQL + R2 Object Storage), Thiết kế CSDL 3NF với 10 môn học, 106 chương, hơn 4.000 bài học và 29.000 câu trắc nghiệm thực tế; Vận dụng tâm lý học Gamification.\n"
        "• Sản phẩm bàn giao: Giao diện lộ trình cây bài học Duolingo Path uốn lượn, hệ thống Trái tim (mỗi lượt làm sai trừ 1 tim, hồi tim theo chu kỳ), Kim cương thưởng khi vượt ải, Chuỗi ngày học Streak liên tục và trợ thủ Mascot Thỏ Bảy Màu tạo động lực.\n"
        "• Minh chứng Git & Issue: Issue #SP1-01 -> #SP1-05; Commits khởi tạo kiến trúc hạ tầng và nạp bộ CSDL 29.000 câu hỏi."
    )
    
    # Sprint 2
    add_header_styled(doc, "Sprint 2: Tích hợp Cổng trường IU CMCU, Cố vấn Học thuật AI & Cửa hàng Vật phẩm VIP", level=3)
    p = doc.add_paragraph()
    p.add_run(
        "• Áp dụng lý thuyết: Kỹ nghệ yêu cầu & tích hợp API bên thứ ba, Thuật toán tính toán học thuật chính xác, Mẫu thiết kế Module.\n"
        "• Sản phẩm bàn giao: Cơ chế đăng nhập 1-Click cổng trường IU (iu.cmcu.edu.vn) qua tài khoản Microsoft 365, bóc tách bảng điểm và lịch học 6 tuần; Thuật toán tính điểm GPA thang 10 và thang 4; Trợ lý 3TG AI phân tích học bạ đề xuất Target GPA; Cửa hàng vật phẩm phong cách Nitro (Mascot, Avatar Frames động, hình nền Profile R2, chế độ tối Midnight Velvet Dark Mode).\n"
        "• Minh chứng Git: Commits 6d5eb0b, 5284ed0, 30dc37e, 5eecdc8."
    )
    
    # Sprint 3
    add_header_styled(doc, "Sprint 3: Trí tuệ Nhân tạo DeepSeek AI Vision, Sổ tay Thông minh & Đóng gói Electron", level=3)
    p = doc.add_paragraph()
    p.add_run(
        "• Áp dụng lý thuyết: Tích hợp mô hình ngôn ngữ lớn (LLM API), Trình biên dịch Markdown tương tác, Kỹ thuật đóng gói Desktop Packaging.\n"
        "• Sản phẩm bàn giao: Trợ lý 3TG AI giải đáp thắc mắc chuyên sâu, nhận diện và giải toán trực tiếp qua ảnh chụp bài tập (Vision RAG); Sổ tay ghi chú thông minh (Smart Notes) định dạng phong phú; Đóng gói ứng dụng Desktop Windows Electron v9.9.9 (Setup.exe và Portable.exe) tối ưu mở app trong 1-2 giây nhờ ASAR và Single Instance Lock.\n"
        "• Minh chứng Git: Commit 95226db (feat: sprint-3 release final)."
    )
    
    # Sprint 4
    add_header_styled(doc, "Sprint 4: Mạng Xã Hội Học Tập 3TG Messenger, Bot 3TG Native & Tối ưu Optimistic UI", level=3)
    p = doc.add_paragraph()
    p.add_run(
        "• Áp dụng lý thuyết: Thiết kế hệ thống thời gian thực (Real-time Messaging Architecture), Tối ưu trải nghiệm phản hồi (Optimistic UI Pattern), Quản trị phân quyền Role-Based Access Control (RBAC).\n"
        "• Sản phẩm bàn giao: Không gian 3TG Messenger toàn màn hình, hỗ trợ chat 1-1 và tạo nhóm học tập phân quyền Admin/Member; Phản hồi tin nhắn tức thời 0ms (Optimistic UI) không còn cảm giác giật lag; Trợ lý Bot 3TG Native siêu nhẹ tích hợp thẳng vào runtime Node của app, giải đáp học tập tự động trong nhóm chat.\n"
        "• Minh chứng Git & Issue: Issue #SP4-01 -> #SP4-06; Commits 0846bd2, fea4193."
    )
    
    # Sprint 5
    add_header_styled(doc, "Sprint 5: Nâng cấp Toàn diện Bảo mật OWASP, Outbox Replay, Hệ thống 6 Themes & Pomodoro Kiosk", level=3)
    p = doc.add_paragraph()
    p.add_run(
        "• Áp dụng lý thuyết: Chuẩn an toàn bảo mật phần mềm OWASP Top 10, Transactional Outbox Pattern cho dữ liệu ngoại tuyến, Công thái học thiết kế đa chủ đề giao diện, Kỹ thuật giám sát hệ điều hành (OS-Level Keyboard Hook & Window State Management).\n"
        "• Sản phẩm bàn giao:\n"
        "  1. Bảo mật: Cách ly triệt để secret (.dev.vars) khỏi bản cài Electron; Chuyển đổi mã hóa sang PBKDF2-HMAC-SHA256 với Salt 16B ngẫu nhiên và 100.000 vòng lặp, so sánh timing-safe; Rate Limiting 5 lần/15 phút; 6 lớp AI Anti-Abuse Shield với HMAC client signature token và bộ đếm ngược cooldown 3s, quota 60 câu/ngày ngăn chặn hành vi khai thác API trái phép.\n"
        "  2. Tính toàn vẹn dữ liệu: Xây dựng bảng sync_outbox và cơ chế Replay FIFO xử lý ngoại tuyến, tự động đối soát và phát lại lên Cloudflare D1 khi có mạng.\n"
        "  3. Giao diện: Bộ 6 Theme Duolingo rực rỡ phủ sóng 100% màu sắc toàn hệ thống; Tối ưu hóa cực hạn cho máy yếu (content-visibility: auto, hardware layers) và khởi tạo cửa sổ song song.\n"
        "  4. Pomodoro Zen Kiosk: Focus Kiosk Mode khóa màn hình và phím xao nhãng; Cơ chế xác thực thời gian học phía máy chủ chống gian lận Gamification (+50 XP, 30 Gems); Trình đọc tài liệu đa định dạng tích hợp Zoom cử chỉ 2 ngón tay và âm thanh Lofi offline.\n"
        "• Minh chứng Git: Commits 3126c36, 979db01, 4bf8ddc, 5ede215."
    )
    
    # Bảng ma trận đối chiếu Lý thuyết vs Thực tế
    add_header_styled(doc, "3. Bảng Ma trận đối chiếu Kiến thức Lý thuyết và Thực tiễn Áp dụng trong 3TG Study", level=2)
    
    matrix_headers = ["Lĩnh vực Lý thuyết CNPM", "Nguyên lý được giảng dạy", "Hiện thực hóa trong Đồ án 3TG Study", "Minh chứng Kỹ thuật / Git"]
    matrix_data = [
        ["Quy trình phần mềm", "Mô hình Agile / Scrum, Sprint, Backlog, DoD", "Chia dự án thành 5 Sprint rõ ràng, quản lý Backlog và hoàn thiện Product Increment chuẩn 100%", "5 bản báo cáo Sprint, GitHub Issues tracking"],
        ["Kỹ nghệ yêu cầu", "User Stories INVEST, Acceptance Criteria Given/When/Then", "Đặc tả chi tiết từng tính năng: làm bài trắc nghiệm, cào điểm IU, trò chuyện AI, chat nhóm 3TG", "Tài liệu Use Case & Test Case chi tiết"],
        ["Kiến trúc phần mềm", "Serverless Edge, Phân tầng Layered, Transactional Outbox", "Cloudflare Workers + D1 SQL + R2 Storage; Kiến trúc hàng đợi sync_outbox đối soát ngoại tuyến", "src/index.js, src/modules/sync_outbox.js"],
        ["Thiết kế CSDL", "Chuẩn hóa quan hệ 3NF, Toàn vẹn tham chiếu", "Cơ sở dữ liệu 10 môn, 106 chương, 4.000 bài, 29.000 câu hỏi, bảng quan hệ user, chats, pomodoro", "build/local_replica.sqlite, schema D1"],
        ["UI/UX & Gamification", "10 Heuristics Nielsen, Thuyết Tự quyết SDT", "Cây học tập Duolingo, Trái tim, Kim cương, Streak, Mascot Thỏ Bảy Màu, 6 Theme Duolingo", "public/app.js, public/style.css"],
        ["Quản trị mã nguồn", "Git Feature Branching, Conventional Commits", "Phân nhánh làm việc, ghi nhận hơn 50+ commits chuẩn format, giải quyết conflicts an toàn", "Repo Anniehatani/appstudyAI"],
        ["Kiểm thử phần mềm", "Test Pyramid, Black-box & White-box Testing", "Xây dựng 85+ ca kiểm thử chi tiết, kiểm thử luồng E2E đăng nhập, học tập, AI, bảo mật", "Tai_Lieu_Test_Case_Do_An_3TG_Study.docx"],
        ["Bảo mật & DevOps", "OWASP Top 10, Prepared SQL, PBKDF2, Electron ASAR", "PBKDF2 100k vòng, AI Anti-Abuse HMAC, Rate Limiting, đóng gói Setup.exe mở trong 1s", "Commit 3126c36, 4bf8ddc, 5ede215"]
    ]
    add_styled_table(doc, matrix_headers, matrix_data, [1.1, 1.6, 2.3, 1.8])
    
    # ==========================================
    # PHẦN 3: TỰ ĐÁNH GIÁ KẾT QUẢ ĐẠT ĐƯỢC
    # ==========================================
    add_header_styled(doc, "PHẦN III: TỰ ĐÁNH GIÁ KẾT QUẢ ĐẠT ĐƯỢC SAU MÔN HỌC", level=1)
    
    add_header_styled(doc, "1. Đánh giá Chất lượng Sản phẩm phần mềm", level=2)
    p = doc.add_paragraph()
    p.add_run(
        "• Độ hoàn thiện và tính toàn vẹn: Đồ án hoàn thành 100% mục tiêu đề ra ban đầu, không có tính năng nào bị bỏ dở hoặc mang tính chất 'giao diện giả'. "
        "Mọi nút bấm, luồng dữ liệu đều được kết nối thực tế tới Cloudflare D1 và SQLite Local.\n"
        "• Quy mô dữ liệu ấn tượng: Hệ thống sở hữu kho học liệu đồ sộ với 29.000 câu trắc nghiệm thực tế, 4.000 bài học thuộc 10 môn đại cương và chuyên ngành, "
        "kết nối thành công hệ thống dữ liệu sinh viên cổng trường IU CMCU.\n"
        "• Hiệu năng và Độ ổn định: Đạt chuẩn 60 FPS trên cả máy cấu hình yếu nhờ áp dụng ảo hóa hiển thị DOM và chia tách layer GPU; "
        "thời gian khởi động ứng dụng Desktop được nén xuống chỉ còn 1 - 2 giây; Hệ thống bảo mật 6 lớp chống gian lận và chống lạm dụng AI hoạt động ổn định."
    )
    
    add_header_styled(doc, "2. Đánh giá Mức độ Trưởng thành về Kỹ năng & Tinh thần Nhóm TONE PINK", level=2)
    p = doc.add_paragraph()
    p.add_run(
        "• Lê Văn An (Lead): Trưởng thành vượt bậc về tư duy Kiến trúc hệ thống (System Design), năng lực quản lý mã nguồn, "
        "khả năng ứng biến nhanh trước sự cố kỹ thuật hạ tầng (như rào cản push protection của GitHub, đồng bộ dữ liệu ngoại tuyến, bảo mật AI) và dẫn dắt nhóm đi đúng lộ trình Agile.\n"
        "• Nguyễn Như Quỳnh: Nâng cao trình độ tư duy thiết kế trải nghiệm người dùng (UX Design), làm chủ kiến trúc biến CSS3 phân tầng, "
        "xây dựng thành công hệ thống 6 theme Duolingo rực rỡ và các biểu cảm sinh động của Mascot Thỏ Bảy Màu tạo sự hứng thú cho người học.\n"
        "• Nguyễn Tú: Nắm vững kỹ thuật chuẩn hóa CSDL quan hệ 3NF trên quy mô lớn, xây dựng logic Gamification chặt chẽ, "
        "rèn luyện tính kỷ luật thông qua việc thiết lập bộ ma trận Test Case toàn diện và trực tiếp kiểm thử nghiệm thu từng Sprint.\n"
        "• Tinh thần làm việc nhóm: Nhóm duy trì liên lạc thường xuyên, phân chia trách nhiệm minh bạch, hỗ trợ nhau giải quyết các lỗi khó và luôn tôn trọng kỷ luật chung."
    )
    
    add_header_styled(doc, "3. Những Thách thức Kỹ thuật Lớn đã Vượt qua", level=2)
    p = doc.add_paragraph()
    p.add_run(
        "Trong suốt quá trình thực hiện đồ án, nhóm đã đối mặt và giải quyết triệt để 4 thử thách kỹ thuật mang tính sống còn:\n"
        "1. Thách thức Rò rỉ Secret & Khóa cài đặt Electron: Bản cài đặt Desktop tiềm ẩn nguy cơ bị giải nén app.asar để trích xuất API Token. Nhóm đã giải quyết bằng cách loại bỏ biến nhạy cảm khỏi files đóng gói, bảo mật trên server và mã hóa runtime an toàn.\n"
        "2. Thách thức Lệch pha Dữ liệu giữa Offline SQLite và Cloudflare D1: Khi mất kết nối mạng hoặc D1 vượt ngưỡng hạn ngạch, dữ liệu cục bộ dễ bị xung đột. Nhóm đã áp dụng Transactional Outbox Pattern với bảng `sync_outbox` và cơ chế Replay hàng đợi FIFO đối soát tự động khi trực tuyến.\n"
        "3. Thách thức Gian lận Điểm Gamification & Lạm dụng Trộm API AI: Người dùng có thể chỉnh sửa request Pomodoro hoặc dùng chat để gọi AI miễn phí. Nhóm đã chuyển toàn bộ logic xác thực thời gian về phía server, thiết lập chữ ký bảo mật HMAC Client Token, bộ đếm ngược 3s và hạn ngạch 60 câu/ngày.\n"
        "4. Thách thức Tối ưu hóa Máy Cấu Hình Thấp: Bản cài Desktop ban đầu ngốn nhiều tài nguyên và khởi động chậm trên máy sinh viên. Nhóm đã can thiệp cờ Chromium, tối ưu bộ nhớ đệm SQLite WAL, áp dụng content-visibility: auto và khởi tạo cửa sổ song song giúp mở app mượt mà trong 1 giây."
    )
    
    add_header_styled(doc, "4. Bài học Kinh nghiệm & Định hướng Phát triển Tương lai", level=2)
    p = doc.add_paragraph()
    p.add_run(
        "• Bài học kinh nghiệm: Quy trình phần mềm chuẩn mực (Agile/Scrum) không hề làm chậm tiến độ mà là kim chỉ nam giúp nhóm kiểm soát rủi ro; "
        "Tư duy Bảo mật từ khâu thiết kế (Security by Design) cần được quán triệt ngay từ đầu thay vì chỉ chắp vá ở giai đoạn cuối; "
        "Việc viết tài liệu kỹ thuật và thiết kế Test Case chi tiết giúp việc bàn giao và bảo trì trở nên vô cùng thuận lợi.\n"
        "• Định hướng phát triển: Mở rộng phiên bản ứng dụng di động đa nền tảng (React Native); Phát triển mô hình Trợ lý AI Gia sư Cá nhân hóa (Adaptive AI Tutor) "
        "tự động điều chỉnh độ khó bài học dựa trên lịch sử làm bài và học bạ của từng sinh viên; Kết nối trực tiếp hệ thống cố vấn học tập của Nhà trường."
    )
    
    # Conclusion & Thanks
    add_callout(
        doc,
        "💖 LỜI CẢM ƠN TỪ NHÓM TONE PINK:",
        "Nhóm TONE PINK xin bày tỏ lòng biết ơn sâu sắc nhất tới Giảng viên hướng dẫn — ThS. Vân Anh. "
        "Những bài giảng tận tâm, những buổi góp ý chuyên môn sắc bén và định hướng quý báu của Cô trong suốt môn học Công nghệ phần mềm "
        "đã giúp nhóm không chỉ hoàn thành một bài tập lớn trên giảng đường, mà thực sự trưởng thành thành những kỹ sư phần mềm có tư duy kỷ luật, "
        "bản lĩnh kỹ thuật và tình yêu sâu sắc với nghề lập trình phần mềm! 🌸✨"
    )
    
    doc.save(DOCX_PATH)
    print(f"-> Đã tạo thành công Báo cáo Word tại: {DOCX_PATH}")

# ==========================================
# 2. BUILD COMPREHENSIVE PPTX (EXACTLY 11 SLIDES)
# ==========================================
def add_header(slide, tag_text, title_text, dark_mode=False):
    """Tạo Header đồng bộ nhưng cực kỳ tinh tế với Badge tag & Tiêu đề chính"""
    # Tag Badge
    badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.4), Inches(3.2), Inches(0.36))
    badge.fill.solid()
    badge.fill.fore_color.rgb = PINK_PRIMARY if dark_mode else PINK_SOFT
    badge.line.fill.background()
    p_b = badge.text_frame.paragraphs[0]
    p_b.alignment = PP_ALIGN.CENTER
    r_b = p_b.add_run()
    r_b.text = tag_text
    r_b.font.bold = True
    r_b.font.size = Pt(10.5)
    r_b.font.color.rgb = WHITE if dark_mode else PINK_PRIMARY

    # Main Title
    tx = slide.shapes.add_textbox(Inches(0.8), Inches(0.78), Inches(11.7), Inches(0.65))
    tf = tx.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    r = p.add_run()
    r.text = title_text
    r.font.bold = True
    r.font.size = Pt(22)
    r.font.color.rgb = WHITE if dark_mode else SLATE_900

    # Thin Pink Accent Line
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.42), Inches(11.733), Inches(0.03))
    line.fill.solid()
    line.fill.fore_color.rgb = PINK_PRIMARY
    line.line.fill.background()

def build_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # ==========================================
    # SLIDE 1: HERO COVER (Sleek Dark Cyber & Tone Pink)
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = DARKER_BG
    bg1.line.fill.background()

    # Top Pink Glow Bar
    glow = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.2))
    glow.fill.solid()
    glow.fill.fore_color.rgb = PINK_NEON
    glow.line.fill.background()

    # University & Department Tag
    uni_pill = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(0.9), Inches(4.5), Inches(0.42))
    uni_pill.fill.solid()
    uni_pill.fill.fore_color.rgb = CARD_DARK
    uni_pill.line.color.rgb = PINK_PRIMARY
    uni_pill.line.width = Pt(1.5)
    p_uni = uni_pill.text_frame.paragraphs[0]
    p_uni.alignment = PP_ALIGN.CENTER
    r_uni = p_uni.add_run()
    r_uni.text = "🌸 KHOA CÔNG NGHỆ THÔNG TIN • ĐỒ ÁN MÔN HỌC"
    r_uni.font.bold = True
    r_uni.font.size = Pt(11)
    r_uni.font.color.rgb = PINK_NEON

    # Big Title Box
    tx1 = s1.shapes.add_textbox(Inches(1.2), Inches(1.45), Inches(10.9), Inches(2.2))
    tf1 = tx1.text_frame
    tf1.word_wrap = True
    
    p_t1 = tf1.paragraphs[0]
    r_t1 = p_t1.add_run()
    r_t1.text = "CÔNG NGHỆ PHẦN MỀM"
    r_t1.font.bold = True
    r_t1.font.size = Pt(36)
    r_t1.font.color.rgb = WHITE

    p_t2 = tf1.add_paragraph()
    p_t2.space_before = Pt(8)
    r_t2 = p_t2.add_run()
    r_t2.text = "BÁO CÁO TỔNG KẾT & HIỆN THỰC HÓA ĐỒ ÁN CUỐI KỲ"
    r_t2.font.bold = True
    r_t2.font.size = Pt(22)
    r_t2.font.color.rgb = PINK_PRIMARY

    p_t3 = tf1.add_paragraph()
    p_t3.space_before = Pt(6)
    r_t3 = p_t3.add_run()
    r_t3.text = "Hệ sinh thái học tập thông minh 3TG Study — Học Vui Mỗi Ngày (Study With Me & Smart AI)"
    r_t3.font.size = Pt(14)
    r_t3.font.color.rgb = SLATE_200

    # 3 Member Profile Cards
    members = [
        ("Lê Văn An (Lead)", "Nhóm trưởng • Kiến trúc hệ thống\nBackend, AI Vision & Security Lead", "@Anniehatani"),
        ("Nguyễn Như Quỳnh", "Frontend Lead • Themes & UI/UX\nMascot Thỏ Bảy Màu & Slide Design", "@nguyennhuuquynhh07-07"),
        ("Nguyễn Tú", "Database Lead • CSDL chuẩn 3NF\nGamification Logic, Kiosk & QA Lead", "@tus-sud")
    ]
    card_w = Inches(3.45)
    card_h = Inches(1.85)
    for i, (m_name, m_role, m_git) in enumerate(members):
        x = Inches(1.2 + i * 3.74)
        y = Inches(3.9)
        m_card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, card_w, card_h)
        m_card.fill.solid()
        m_card.fill.fore_color.rgb = CARD_DARK
        m_card.line.color.rgb = PINK_PRIMARY if i == 0 else SLATE_600
        m_card.line.width = Pt(1.5)

        tx_m = s1.shapes.add_textbox(x + Inches(0.2), y + Inches(0.15), card_w - Inches(0.4), card_h - Inches(0.3))
        tf_m = tx_m.text_frame
        tf_m.word_wrap = True

        p1 = tf_m.paragraphs[0]
        r1 = p1.add_run()
        r1.text = m_name
        r1.font.bold = True
        r1.font.size = Pt(14)
        r1.font.color.rgb = PINK_NEON if i == 0 else WHITE

        p2 = tf_m.add_paragraph()
        p2.space_before = Pt(4)
        r2 = p2.add_run()
        r2.text = m_role
        r2.font.size = Pt(10.5)
        r2.font.color.rgb = SLATE_200

        p3 = tf_m.add_paragraph()
        p3.space_before = Pt(6)
        r3 = p3.add_run()
        r3.text = f"GitHub: {m_git}"
        r3.font.size = Pt(10)
        r3.font.bold = True
        r3.font.color.rgb = EMERALD

    # Footer Metadata Pill
    foot = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(6.1), Inches(10.933), Inches(0.65))
    foot.fill.solid()
    foot.fill.fore_color.rgb = RGBColor(20, 27, 45)
    foot.line.color.rgb = PINK_PRIMARY
    foot.line.width = Pt(1)
    p_f = foot.text_frame.paragraphs[0]
    p_f.alignment = PP_ALIGN.CENTER
    r_f = p_f.add_run()
    r_f.text = "🎓 Giảng viên hướng dẫn: ThS. VÂN ANH  |  Nhóm thực hiện: TONE PINK  |  Phiên bản hoàn thiện: v9.9.9 Final Release"
    r_f.font.size = Pt(12)
    r_f.font.bold = True
    r_f.font.color.rgb = WHITE

    # ==========================================
    # SLIDE 2: EXECUTIVE SUMMARY & STAT METRICS (Left Metrics Column + Right 3 Ecosystem Cards)
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "PHẦN I • TỔNG QUAN", "TỔNG QUAN ĐỀ TÀI & CÁC CHỈ SỐ HOÀN THIỆN ĐỒ ÁN")

    # Left Column: Big Metrics Display Card
    left_card = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.6), Inches(3.8), Inches(5.3))
    left_card.fill.solid()
    left_card.fill.fore_color.rgb = PINK_SOFT
    left_card.line.color.rgb = PINK_PRIMARY
    left_card.line.width = Pt(2)

    stats = [
        ("29,000+", "Câu hỏi trắc nghiệm thực tế"),
        ("4,000+", "Bài học (10 Môn Đại cương & CN)"),
        ("5 Sprints", "Quy trình Agile/Scrum 100%"),
        ("< 1 Giây", "Cold-start mở app Desktop Windows")
    ]
    for idx, (num, desc) in enumerate(stats):
        box_y = Inches(1.8 + idx * 1.25)
        s_box = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.05), box_y, Inches(3.3), Inches(1.1))
        s_box.fill.solid()
        s_box.fill.fore_color.rgb = WHITE
        s_box.line.color.rgb = SLATE_200
        s_box.line.width = Pt(1)

        tx_s = s2.shapes.add_textbox(Inches(1.1), box_y + Inches(0.08), Inches(3.2), Inches(0.95))
        tf_s = tx_s.text_frame
        tf_s.word_wrap = True
        p_n = tf_s.paragraphs[0]
        p_n.alignment = PP_ALIGN.CENTER
        r_n = p_n.add_run()
        r_n.text = num
        r_n.font.bold = True
        r_n.font.size = Pt(20)
        r_n.font.color.rgb = PINK_PRIMARY

        p_d = tf_s.add_paragraph()
        p_d.alignment = PP_ALIGN.CENTER
        r_d = p_d.add_run()
        r_d.text = desc
        r_d.font.size = Pt(10)
        r_d.font.color.rgb = SLATE_700

    # Right Column: 3 Horizontal Feature Stream Cards
    features = [
        ("🎮 Vòng lặp Gamification Cốt lõi phong cách Duolingo", 
         "Cây bài học uốn lượn, năng lượng Trái tim, Kim cương tích lũy, Chuỗi ngày Streak, Cửa hàng vật phẩm và Mascot Thỏ Bảy Màu hoạt hình tương tác kích thích động lực học tập."),
        ("🤖 Trí tuệ Nhân tạo DeepSeek AI & Sổ tay Thông minh (Smart Notes)", 
         "Giải bài tập chuyên sâu, nhận diện và bóc tách đề bài qua ảnh chụp (Vision RAG), định dạng công thức toán học và trình biên tập ghi chú phong phú đa phương tiện."),
        ("🏫 Kết nối Cổng trường IU CMCU & Mạng xã hội 3TG Messenger", 
         "Đăng nhập 1-Click tài khoản Microsoft 365, bóc tách bảng điểm toàn khóa và tính GPA thang 10 & 4; Không gian chat thời gian thực Optimistic UI 0ms delay và Bot 3TG trợ lý.")
    ]
    for idx, (f_title, f_desc) in enumerate(features):
        fy = Inches(1.6 + idx * 1.8)
        f_card = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.85), fy, Inches(7.68), Inches(1.65))
        f_card.fill.solid()
        f_card.fill.fore_color.rgb = SLATE_50
        f_card.line.color.rgb = SLATE_200
        f_card.line.width = Pt(1.5)

        # Left Pink Accent Bar
        p_bar = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.85), fy, Inches(0.18), Inches(1.65))
        p_bar.fill.solid()
        p_bar.fill.fore_color.rgb = PINK_PRIMARY
        p_bar.line.fill.background()

        tx_f = s2.shapes.add_textbox(Inches(5.2), fy + Inches(0.15), Inches(7.1), Inches(1.35))
        tf_f = tx_f.text_frame
        tf_f.word_wrap = True

        p1 = tf_f.paragraphs[0]
        r1 = p1.add_run()
        r1.text = f_title
        r1.font.bold = True
        r1.font.size = Pt(13.5)
        r1.font.color.rgb = SLATE_900

        p2 = tf_f.add_paragraph()
        p2.space_before = Pt(6)
        r2 = p2.add_run()
        r2.text = f_desc
        r2.font.size = Pt(11)
        r2.font.color.rgb = SLATE_600

    # ==========================================
    # SLIDE 3: SDLC PROCESS & AGILE/SCRUM (Horizontal 4-Step Chevron Flow + Waterfall vs Agile Cards)
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "PHẦN II • LÝ THUYẾT CNPM", "QUY TRÌNH PHÁT TRIỂN PHẦN MỀM SDLC & KHUNG LÀM VIỆC AGILE / SCRUM")

    # Top Half: 4-Step Horizontal Agile Flow Pipeline
    steps = [
        ("BƯỚC 1: PRODUCT BACKLOG", "Khảo sát bài toán học tập, thu thập yêu cầu người dùng, viết User Stories theo chuẩn INVEST và định nghĩa Acceptance Criteria (BDD)."),
        ("BƯỚC 2: SPRINT PLANNING", "Ước lượng độ phức tạp (Story Points), chọn lọc đầu việc vào Sprint Backlog, phân bổ trách nhiệm minh bạch cho 3 thành viên."),
        ("BƯỚC 3: SPRINT EXECUTION", "Lập trình Feature Branching trên Git, họp ngắn giải quyết vướng mắc kỹ thuật, liên tục tích hợp và kiểm thử đơn vị độc lập."),
        ("BƯỚC 4: REVIEW & RETRO", "Trình diễn Product Increment chạy được 100%, đối chiếu Định nghĩa Hoàn thành (DoD), rút kinh nghiệm cải tiến quy trình Sprint kế.")
    ]
    step_w = Inches(2.78)
    for i, (s_title, s_desc) in enumerate(steps):
        sx = Inches(0.8 + i * 2.98)
        s_box = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, sx, Inches(1.6), step_w, Inches(2.35))
        s_box.fill.solid()
        s_box.fill.fore_color.rgb = SLATE_50
        s_box.line.color.rgb = PINK_PRIMARY if i == 3 else SLATE_200
        s_box.line.width = Pt(1.5)

        # Header Pill in step
        s_hdr = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, sx, Inches(1.6), step_w, Inches(0.48))
        s_hdr.fill.solid()
        s_hdr.fill.fore_color.rgb = PINK_PRIMARY if i % 2 == 1 else RGBColor(26, 31, 44)
        s_hdr.line.fill.background()

        p_h = s_hdr.text_frame.paragraphs[0]
        p_h.alignment = PP_ALIGN.CENTER
        r_h = p_h.add_run()
        r_h.text = s_title
        r_h.font.bold = True
        r_h.font.size = Pt(9.5)
        r_h.font.color.rgb = WHITE

        tx_b = s3.shapes.add_textbox(sx + Inches(0.12), Inches(2.15), step_w - Inches(0.24), Inches(1.75))
        tf_b = tx_b.text_frame
        tf_b.word_wrap = True
        p_c = tf_b.paragraphs[0]
        r_c = p_c.add_run()
        r_c.text = s_desc
        r_c.font.size = Pt(10)
        r_c.font.color.rgb = SLATE_700

    # Bottom Half: Waterfall vs Agile Comparative Cards
    wf_card = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(4.2), Inches(5.7), Inches(2.7))
    wf_card.fill.solid()
    wf_card.fill.fore_color.rgb = SLATE_50
    wf_card.line.color.rgb = SLATE_200
    wf_card.line.width = Pt(1.5)

    tx_wf = s3.shapes.add_textbox(Inches(1.0), Inches(4.3), Inches(5.3), Inches(2.5))
    tf_wf = tx_wf.text_frame
    tf_wf.word_wrap = True
    p_w1 = tf_wf.paragraphs[0]
    r_w1 = p_w1.add_run()
    r_w1.text = "⚠️ Mô hình Thác nước Truyền thống (Waterfall)"
    r_w1.font.bold = True
    r_w1.font.size = Pt(13)
    r_w1.font.color.rgb = SLATE_900

    p_w2 = tf_wf.add_paragraph()
    p_w2.space_before = Pt(6)
    r_w2 = p_w2.add_run()
    r_w2.text = "• Tiếp cận tuyến tính tuần tự: Yêu cầu ➔ Thiết kế ➔ Cài đặt ➔ Kiểm thử ➔ Triển khai.\n" \
                "• Nhược điểm chí mạng: Kém linh hoạt; Không có sản phẩm chạy được cho đến cuối dự án; Chi phí sửa lỗi cực lớn nếu sai sót phát sinh từ giai đoạn đầu."
    r_w2.font.size = Pt(10.5)
    r_w2.font.color.rgb = SLATE_600

    ag_card = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(4.2), Inches(5.733), Inches(2.7))
    ag_card.fill.solid()
    ag_card.fill.fore_color.rgb = PINK_SOFT
    ag_card.line.color.rgb = PINK_PRIMARY
    ag_card.line.width = Pt(2)

    tx_ag = s3.shapes.add_textbox(Inches(7.0), Inches(4.3), Inches(5.3), Inches(2.5))
    tf_ag = tx_ag.text_frame
    tf_ag.word_wrap = True
    p_a1 = tf_ag.paragraphs[0]
    r_a1 = p_a1.add_run()
    r_a1.text = "🚀 Mô hình Linh hoạt Agile / Scrum (Được áp dụng)"
    r_a1.font.bold = True
    r_a1.font.size = Pt(13)
    r_a1.font.color.rgb = PINK_PRIMARY

    p_a2 = tf_ag.add_paragraph()
    p_a2.space_before = Pt(6)
    r_a2 = p_a2.add_run()
    r_a2.text = "• Phát triển tăng trưởng theo các chu kỳ Sprint ngắn hạn (1-2 tuần/Sprint).\n" \
                "• Bàn giao Increment chạy thực tế sau mỗi chu kỳ; Thích ứng linh hoạt với thay đổi.\n" \
                "• Phối hợp liên tục giữa 3 vai trò: Product Owner, Scrum Master & Development Team."
    r_a2.font.size = Pt(10.5)
    r_a2.font.color.rgb = SLATE_900

    # ==========================================
    # SLIDE 4: ARCHITECTURE & 3NF DATABASE (3 Vertical Column Architectural Blueprint)
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "PHẦN II • LÝ THUYẾT CNPM", "KỸ NGHỆ YÊU CẦU, KIẾN TRÚC PHẦN MỀM & CSDL CHUẨN HÓA 3NF")

    cols = [
        ("📋 1. KỸ NGHỆ YÊU CẦU", [
            ("Phân loại Yêu cầu:", "Yêu cầu Chức năng (FR) & Yêu cầu Phi chức năng (NFR: hiệu năng < 200ms, bảo mật, khả dụng 99.9%)."),
            ("User Story INVEST:", "Độc lập (Independent), Thương lượng (Negotiable), Giá trị (Valuable), Ước lượng (Estimable), Nhỏ (Small), Kiểm thử được (Testable)."),
            ("Mô hình hóa UML:", "Use Case Diagram, Activity Diagram & Sequence Diagram mô hình hóa luồng thông điệp hệ thống.")
        ], SLATE_50, SLATE_200),
        ("🏗️ 2. KIẾN TRÚC 3 TẦNG & EDGE", [
            ("Presentation Layer:", "Ứng dụng Desktop Electron Windows & Web Client HTML5/CSS3/ES Modules mượt mà 60 FPS."),
            ("Business Logic Layer:", "Cloudflare Workers chạy phân tán tại biên mạng (Edge Computing) xử lý REST API tức thì."),
            ("Data Access Layer:", "Cloudflare D1 Distributed SQL + R2 Object Storage lưu trữ ảnh/âm thanh và SQLite Local.")
        ], PINK_SOFT, PINK_PRIMARY),
        ("🗄️ 3. CHUẨN HÓA CSDL 3NF", [
            ("Dạng chuẩn 1 (1NF):", "Mọi thuộc tính đều mang giá trị nguyên tố (Atomic values), không có mảng lặp lại."),
            ("Dạng chuẩn 2 (2NF):", "Đạt 1NF và mọi thuộc tính không khóa phụ thuộc hàm đầy đủ vào khóa chính (Primary Key)."),
            ("Dạng chuẩn 3 (3NF):", "Đạt 2NF và loại bỏ hoàn toàn phụ thuộc bắc cầu; bảo vệ toàn vẹn tham chiếu khóa ngoại.")
        ], SLATE_50, SLATE_200)
    ]
    c_w = Inches(3.75)
    for i, (c_title, c_items, c_bg, c_border) in enumerate(cols):
        cx = Inches(0.8 + i * 3.99)
        c_shape = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, Inches(1.6), c_w, Inches(5.3))
        c_shape.fill.solid()
        c_shape.fill.fore_color.rgb = c_bg
        c_shape.line.color.rgb = c_border
        c_shape.line.width = Pt(1.5)

        # Header Banner inside column
        c_hdr = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, Inches(1.6), c_w, Inches(0.6))
        c_hdr.fill.solid()
        c_hdr.fill.fore_color.rgb = c_border if c_border != SLATE_200 else RGBColor(30, 41, 59)
        c_hdr.line.fill.background()

        p_ch = c_hdr.text_frame.paragraphs[0]
        p_ch.alignment = PP_ALIGN.CENTER
        r_ch = p_ch.add_run()
        r_ch.text = c_title
        r_ch.font.bold = True
        r_ch.font.size = Pt(12)
        r_ch.font.color.rgb = WHITE

        tx_items = s4.shapes.add_textbox(cx + Inches(0.2), Inches(2.3), c_w - Inches(0.4), Inches(4.5))
        tf_it = tx_items.text_frame
        tf_it.word_wrap = True

        for idx, (label, val) in enumerate(c_items):
            p_lbl = tf_it.paragraphs[0] if idx == 0 else tf_it.add_paragraph()
            if idx > 0:
                p_lbl.space_before = Pt(14)
            r_l = p_lbl.add_run()
            r_l.text = f"• {label}\n"
            r_l.font.bold = True
            r_l.font.size = Pt(11)
            r_l.font.color.rgb = PINK_PRIMARY if c_border == PINK_PRIMARY else SLATE_900

            r_v = p_lbl.add_run()
            r_v.text = val
            r_v.font.size = Pt(10)
            r_v.font.color.rgb = SLATE_700

    # ==========================================
    # SLIDE 5: SPRINT 1 & 2 SHOWCASE (Split Screen Dual-Sprint Showcase with Visual Badges)
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "PHẦN III • THỰC TIỄN ÁP DỤNG", "SPRINT 1 & 2: HẠ TẦNG SERVERLESS, GAMIFICATION & CỔNG TRƯỜNG IU")

    # Left Half: Sprint 1 Box
    sp1_box = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.3))
    sp1_box.fill.solid()
    sp1_box.fill.fore_color.rgb = SLATE_50
    sp1_box.line.color.rgb = SLATE_200
    sp1_box.line.width = Pt(1.5)

    badge1 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(1.8), Inches(3.2), Inches(0.4))
    badge1.fill.solid()
    badge1.fill.fore_color.rgb = RGBColor(30, 41, 59)
    badge1.line.fill.background()
    p_b1 = badge1.text_frame.paragraphs[0]
    p_b1.alignment = PP_ALIGN.CENTER
    r_b1 = p_b1.add_run()
    r_b1.text = "SPRINT 1 • NỀN TẢNG CỐT LÕI"
    r_b1.font.bold = True
    r_b1.font.size = Pt(10)
    r_b1.font.color.rgb = WHITE

    tx_sp1 = s5.shapes.add_textbox(Inches(1.0), Inches(2.3), Inches(5.3), Inches(4.4))
    tf_sp1 = tx_sp1.text_frame
    tf_sp1.word_wrap = True

    p = tf_sp1.paragraphs[0]
    r = p.add_run()
    r.text = "Kiến Trúc Serverless & Gamification Duolingo\n"
    r.font.bold = True
    r.font.size = Pt(14)
    r.font.color.rgb = SLATE_900

    sp1_bullets = [
        "🌐 Hạ tầng Cloudflare Serverless: Worker + D1 SQL + R2 Storage tối ưu chi phí và co giãn tức thời.",
        "📊 CSDL đồ sộ chuẩn 3NF: 10 môn học, 106 chương, 4.000 bài học và 29.000 câu trắc nghiệm thực tế.",
        "❤️ Vòng lặp Gamification: Năng lượng Trái tim (hồi theo giờ), thưởng Đá quý, Chuỗi ngày Streak liên tục và vật phẩm Freeze.",
        "🐰 Trợ thủ Mascot Thỏ Bảy Màu: Biểu cảm động tương tác động viên người học vượt qua từng ải bài học.",
        "📌 Minh chứng: GitHub Issues #SP1-01 -> #SP1-05; Khởi tạo CSDL 29.000 câu hỏi thành công 100%."
    ]
    for b in sp1_bullets:
        p_b = tf_sp1.add_paragraph()
        p_b.space_before = Pt(8)
        r_b = p_b.add_run()
        r_b.text = b
        r_b.font.size = Pt(10.5)
        r_b.font.color.rgb = SLATE_700

    # Right Half: Sprint 2 Box
    sp2_box = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.6), Inches(5.733), Inches(5.3))
    sp2_box.fill.solid()
    sp2_box.fill.fore_color.rgb = PINK_SOFT
    sp2_box.line.color.rgb = PINK_PRIMARY
    sp2_box.line.width = Pt(2)

    badge2 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.0), Inches(1.8), Inches(3.2), Inches(0.4))
    badge2.fill.solid()
    badge2.fill.fore_color.rgb = PINK_PRIMARY
    badge2.line.fill.background()
    p_b2 = badge2.text_frame.paragraphs[0]
    p_b2.alignment = PP_ALIGN.CENTER
    r_b2 = p_b2.add_run()
    r_b2.text = "SPRINT 2 • CỔNG TRƯỜNG & AI"
    r_b2.font.bold = True
    r_b2.font.size = Pt(10)
    r_b2.font.color.rgb = WHITE

    tx_sp2 = s5.shapes.add_textbox(Inches(7.0), Inches(2.3), Inches(5.3), Inches(4.4))
    tf_sp2 = tx_sp2.text_frame
    tf_sp2.word_wrap = True

    p = tf_sp2.paragraphs[0]
    r = p.add_run()
    r.text = "Cổng Trường IU CMCU & Cố Vấn Học Thuật\n"
    r.font.bold = True
    r.font.size = Pt(14)
    r.font.color.rgb = PINK_PRIMARY

    sp2_bullets = [
        "🎓 1-Click Đăng nhập Cổng IU (iu.cmcu.edu.vn): Tích hợp tài khoản Microsoft 365 cấp bởi nhà trường.",
        "📈 Bóc tách học thuật tự động: Trích xuất bảng điểm toàn khóa và thời khóa biểu 6 tuần chuẩn xác.",
        "🧮 Tính GPA & Cố vấn AI: Thuật toán GPA thang 10 & 4, Trợ lý 3TG AI phân tích môn nợ và gợi ý Target GPA.",
        "💎 Cửa hàng Shop VIP Nitro: 4 Tab vật phẩm (Mascot, Khung Avatar động, Ảnh nền R2) và Chế độ tối Midnight Velvet.",
        "📌 Minh chứng Git: Commits 6d5eb0b, 5284ed0, 30dc37e, 5eecdc8."
    ]
    for b in sp2_bullets:
        p_b = tf_sp2.add_paragraph()
        p_b.space_before = Pt(8)
        r_b = p_b.add_run()
        r_b.text = b
        r_b.font.size = Pt(10.5)
        r_b.font.color.rgb = SLATE_900

    # ==========================================
    # SLIDE 6: SPRINT 3 & 4 SHOWCASE (Top Full-Width AI Feature + Bottom 2 Split Cards)
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, "PHẦN III • THỰC TIỄN ÁP DỤNG", "SPRINT 3 & 4: TRÍ TUỆ NHÂN TẠO DEEPSEEK AI, ELECTRON & 3TG MESSENGER")

    # Top Wide Card: Sprint 3 (DeepSeek AI Vision & Electron Packaging)
    top_card = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.6), Inches(11.733), Inches(2.45))
    top_card.fill.solid()
    top_card.fill.fore_color.rgb = PINK_SOFT
    top_card.line.color.rgb = PINK_PRIMARY
    top_card.line.width = Pt(1.5)

    badge3 = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.05), Inches(1.8), Inches(4.2), Inches(0.36))
    badge3.fill.solid()
    badge3.fill.fore_color.rgb = PINK_PRIMARY
    badge3.line.fill.background()
    p_b3 = badge3.text_frame.paragraphs[0]
    p_b3.alignment = PP_ALIGN.CENTER
    r_b3 = p_b3.add_run()
    r_b3.text = "SPRINT 3 • AI VISION RAG & ELECTRON v9.9.9"
    r_b3.font.bold = True
    r_b3.font.size = Pt(9.5)
    r_b3.font.color.rgb = WHITE

    tx_top = s6.shapes.add_textbox(Inches(1.05), Inches(2.22), Inches(11.2), Inches(1.7))
    tf_top = tx_top.text_frame
    tf_top.word_wrap = True

    p = tf_top.paragraphs[0]
    r = p.add_run()
    r.text = "Trợ Lý Trí Tuệ Nhân Tạo DeepSeek AI Vision & Đóng Gói Desktop Khởi Động 1 Giây"
    r.font.bold = True
    r.font.size = Pt(13)
    r.font.color.rgb = SLATE_900

    p_body = tf_top.add_paragraph()
    p_body.space_before = Pt(4)
    r_body = p_body.add_run()
    r_body.text = "• Tích hợp mô hình AI giải toán và phân tích đề bài trực tiếp qua ảnh chụp (Vision RAG), định dạng KaTeX chuẩn mực.\n" \
                 "• Sổ tay ghi chú thông minh (Smart Notes): Hỗ trợ Markdown, tải tệp đính kèm và đồng bộ nội dung học tập.\n" \
                 "• Xuất bản bộ cài đặt Windows Setup 9.9.9.exe & Portable 9.9.9.exe (~111MB), tối ưu ASAR mở app trong 1-2s (Commit 95226db)."
    r_body.font.size = Pt(10.5)
    r_body.font.color.rgb = SLATE_700

    # Bottom Left: Sprint 4 Messenger
    b_left = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(4.3), Inches(5.7), Inches(2.6))
    b_left.fill.solid()
    b_left.fill.fore_color.rgb = SLATE_50
    b_left.line.color.rgb = SLATE_200
    b_left.line.width = Pt(1.5)

    tx_bl = s6.shapes.add_textbox(Inches(1.0), Inches(4.45), Inches(5.3), Inches(2.3))
    tf_bl = tx_bl.text_frame
    tf_bl.word_wrap = True
    p_bl = tf_bl.paragraphs[0]
    r_bl = p_bl.add_run()
    r_bl.text = "💬 Sprint 4: Mạng Xã Hội 3TG Messenger\n"
    r_bl.font.bold = True
    r_bl.font.size = Pt(13)
    r_bl.font.color.rgb = SLATE_900

    p_bl2 = tf_bl.add_paragraph()
    r_bl2 = p_bl2.add_run()
    r_bl2.text = (
        "• Không gian nhắn tin toàn màn hình: Chat 1-1 và tạo nhóm học tập phân quyền Admin/Member chuyên nghiệp.\n"
        "• Optimistic UI: Phản hồi tin nhắn tức thời 0ms delay, xóa bỏ hoàn toàn cảm giác giật lag khi chat.\n"
        "• Minh chứng: Issue #SP4-01 -> #SP4-04; Commit fea4193."
    )
    r_bl2.font.size = Pt(10)
    r_bl2.font.color.rgb = SLATE_700

    # Bottom Right: Sprint 4 Bot 3TG Native
    b_right = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(4.3), Inches(5.733), Inches(2.6))
    b_right.fill.solid()
    b_right.fill.fore_color.rgb = SLATE_50
    b_right.line.color.rgb = SLATE_200
    b_right.line.width = Pt(1.5)

    tx_br = s6.shapes.add_textbox(Inches(7.0), Inches(4.45), Inches(5.3), Inches(2.3))
    tf_br = tx_br.text_frame
    tf_br.word_wrap = True
    p_br = tf_br.paragraphs[0]
    r_br = p_br.add_run()
    r_br.text = "⚡ Sprint 4: Trợ Lý Bot 3TG Native Node\n"
    r_br.font.bold = True
    r_br.font.size = Pt(13)
    r_br.font.color.rgb = SLATE_900

    p_br2 = tf_br.add_paragraph()
    r_br2 = p_br2.add_run()
    r_br2.text = (
        "• Module hóa triệt để: Xóa bỏ thư mục node_modules cồng kềnh, chuyển engine sang module Native cực nhẹ.\n"
        "• Tiêu thụ xấp xỉ ~0 RAM bổ sung, chạy trực tiếp trong Node runtime của ứng dụng.\n"
        "• Tự động tham gia nhóm chat và giải đáp câu hỏi học tập (Commit 0846bd2)."
    )
    r_br2.font.size = Pt(10)
    r_br2.font.color.rgb = SLATE_700

    # ==========================================
    # SLIDE 7: SPRINT 5 SHOWCASE (3 Pillar Security & Zen Kiosk Layout)
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    add_header(s7, "PHẦN III • THỰC TIỄN ÁP DỤNG", "SPRINT 5: NÂNG CẤP BẢO MẬT OWASP, TRANSACTIONAL OUTBOX & POMODORO KIOSK")

    sp5_cols = [
        ("🛡️ 1. BẢO MẬT OWASP & AI SHIELD", [
            ("Mã hóa PBKDF2 100k Vòng:", "Salt ngẫu nhiên 16 bytes riêng biệt từng user, so sánh timing-safe chống tấn công phân tích thời gian."),
            ("Rate Limiting Chống Brute-force:", "Bộ đếm trượt khóa 15 phút khi nhập sai 5 lần (HTTP 429)."),
            ("AI Anti-Abuse Shield 6 Lớp:", "Bắt buộc đăng nhập, HMAC client signature token, Cooldown 3s đếm ngược, quota 60 câu/ngày ngăn trích xuất API free.")
        ], SLATE_50, SLATE_200),
        ("☁️ 2. TRANSACTIONAL OUTBOX REPLAY", [
            ("Hàng đợi sync_outbox:", "Ghi nhận mọi thao tác ngoại tuyến vào SQLite khi mất mạng hoặc D1 chạm hạn ngạch."),
            ("Cơ chế Replay FIFO:", "Tiến trình nền tự động đối soát và phát lại dữ liệu lên Cloudflare D1 khi có mạng kèm Exponential Backoff."),
            ("Toàn vẹn Dữ liệu:", "Đảm bảo tính nhất quán tuyệt đối giữa bản sao máy khách và máy chủ phân tán.")
        ], SLATE_50, SLATE_200),
        ("⏱️ 3. POMODORO KIOSK & 6 THEMES", [
            ("Focus Kiosk Mode:", "Khóa toàn màn hình, ẩn Taskbar, chặn phím xao nhãng (Alt, Win, Esc); phục hồi Taskbar bằng Ctrl+Q."),
            ("Server-side Verification:", "Server tự tính giờ thực tế (now - started_at), chống can thiệp request khống (+50 XP, 30 Gems)."),
            ("Hệ thống 6 Theme Duolingo:", "Phủ sóng 100% biến CSS3; Zoom tài liệu 2 ngón trackpad; Tối ưu hóa cực hạn cho máy yếu.")
        ], PINK_SOFT, PINK_PRIMARY)
    ]
    p_w = Inches(3.75)
    for i, (p_title, p_items, p_bg, p_border) in enumerate(sp5_cols):
        px = Inches(0.8 + i * 3.99)
        p_shape = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, px, Inches(1.6), p_w, Inches(5.3))
        p_shape.fill.solid()
        p_shape.fill.fore_color.rgb = p_bg
        p_shape.line.color.rgb = p_border
        p_shape.line.width = Pt(1.5)

        p_hdr = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, px, Inches(1.6), p_w, Inches(0.6))
        p_hdr.fill.solid()
        p_hdr.fill.fore_color.rgb = p_border if p_border != SLATE_200 else RGBColor(30, 41, 59)
        p_hdr.line.fill.background()

        p_ph = p_hdr.text_frame.paragraphs[0]
        p_ph.alignment = PP_ALIGN.CENTER
        r_ph = p_ph.add_run()
        r_ph.text = p_title
        r_ph.font.bold = True
        r_ph.font.size = Pt(11)
        r_ph.font.color.rgb = WHITE

        tx_it = s7.shapes.add_textbox(px + Inches(0.2), Inches(2.3), p_w - Inches(0.4), Inches(4.5))
        tf_it = tx_it.text_frame
        tf_it.word_wrap = True

        for idx, (lbl, desc) in enumerate(p_items):
            p_l = tf_it.paragraphs[0] if idx == 0 else tf_it.add_paragraph()
            if idx > 0:
                p_l.space_before = Pt(14)
            r_l = p_l.add_run()
            r_l.text = f"• {lbl}\n"
            r_l.font.bold = True
            r_l.font.size = Pt(11)
            r_l.font.color.rgb = PINK_PRIMARY if p_border == PINK_PRIMARY else SLATE_900

            r_d = p_l.add_run()
            r_d.text = desc
            r_d.font.size = Pt(10)
            r_d.font.color.rgb = SLATE_700

    # ==========================================
    # SLIDE 8: THEORY VS PRACTICE COMPARATIVE MATRIX (Full Width Sleek Table with Badges)
    # ==========================================
    s8 = prs.slides.add_slide(blank_layout)
    add_header(s8, "PHẦN IV • ĐỐI CHIẾU THỰC TIỄN", "MA TRẬN ĐỐI CHIẾU LÝ THUYẾT CNPM VÀ HIỆN THỰC HÓA TRONG 3TG STUDY")

    matrix_rows = [
        ("Quy trình phần mềm", "Mô hình Agile / Scrum, 5 Sprints liên tục", "Hoàn thành 100% mục tiêu, bàn giao Product Increment sau mỗi chu kỳ", "5 Báo cáo Sprint"),
        ("Kỹ nghệ yêu cầu", "User Stories INVEST, BDD Acceptance Criteria", "Đặc tả chi tiết từng luồng nghiệp vụ: trắc nghiệm, cào điểm IU, hỏi AI", "Tài liệu Use Case"),
        ("Kiến trúc phần mềm", "Serverless Edge, Phân tầng Layered, Outbox Pattern", "Cloudflare Worker + D1 + R2; Hàng đợi sync_outbox đối soát ngoại tuyến", "src/index.js"),
        ("Thiết kế Cơ sở dữ liệu", "Chuẩn hóa quan hệ 3NF, Toàn vẹn tham chiếu", "14 bảng quan hệ chuẩn 3NF: 10 môn, 106 chương, 29.000 câu trắc nghiệm", "local_replica.sqlite"),
        ("UI/UX & Gamification", "10 Heuristics Nielsen, Thuyết Tự quyết SDT", "Cây bài Duolingo, Mascot Thỏ Bảy Màu, 6 Theme rực rỡ, chat 0ms", "public/style.css"),
        ("Kiểm thử chất lượng", "Kim tự tháp kiểm thử, Black-box & White-box", "Xây dựng 85+ ca kiểm thử chi tiết, nghiệm thu E2E toàn diện sản phẩm", "85+ Test Cases DOCX"),
        ("Bảo mật & DevOps", "OWASP Top 10, PBKDF2 Hashing, ASAR Packaging", "PBKDF2 100k vòng, AI Anti-Abuse HMAC, Kiosk Mode, Setup.exe mở 1s", "Commit 3126c36")
    ]
    tbl_shape = s8.shapes.add_table(len(matrix_rows) + 1, 4, Inches(0.8), Inches(1.6), Inches(11.733), Inches(5.3))
    tbl = tbl_shape.table
    tbl.columns[0].width = Inches(2.2)
    tbl.columns[1].width = Inches(3.4)
    tbl.columns[2].width = Inches(4.333)
    tbl.columns[3].width = Inches(1.8)

    hdrs = ["LĨNH VỰC CNPM", "NGUYÊN LÝ GIẢNG DẠY", "HIỆN THỰC HÓA TRONG 3TG STUDY", "MINH CHỨNG"]
    for c_i, h_text in enumerate(hdrs):
        cell = tbl.cell(0, c_i)
        cell.fill.solid()
        cell.fill.fore_color.rgb = PINK_PRIMARY
        p = cell.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run()
        r.text = h_text
        r.font.bold = True
        r.font.size = Pt(11)
        r.font.color.rgb = WHITE

    for r_i, (c1, c2, c3, c4) in enumerate(matrix_rows):
        bg = PINK_SOFT if r_i % 2 == 1 else WHITE
        cells = [tbl.cell(r_i + 1, 0), tbl.cell(r_i + 1, 1), tbl.cell(r_i + 1, 2), tbl.cell(r_i + 1, 3)]
        for c_idx, val in enumerate([c1, c2, c3, c4]):
            cell = cells[c_idx]
            cell.fill.solid()
            cell.fill.fore_color.rgb = bg
            p = cell.text_frame.paragraphs[0]
            r = p.add_run()
            r.text = val
            r.font.size = Pt(9.5)
            r.font.color.rgb = SLATE_900
            if c_idx == 0:
                p.alignment = PP_ALIGN.LEFT
                r.font.bold = True
                r.font.color.rgb = PINK_PRIMARY
            elif c_idx == 3:
                p.alignment = PP_ALIGN.CENTER
                r.font.bold = True
                r.font.color.rgb = EMERALD

    # ==========================================
    # SLIDE 9: GIT COMMITS & RELEASE EVIDENCE (Terminal Dark Log Box + Release Metrics Card)
    # ==========================================
    s9 = prs.slides.add_slide(blank_layout)
    add_header(s9, "PHẦN V • MINH CHỨNG PHẦN MỀM", "QUẢN TRỊ MÃ NGUỒN GIT/GITHUB, LỊCH SỬ COMMITS & PHÁT HÀNH BẢN CÀI")

    # Left: Terminal Dark Git Log Box
    term_box = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.6), Inches(6.8), Inches(5.3))
    term_box.fill.solid()
    term_box.fill.fore_color.rgb = DARK_BG
    term_box.line.color.rgb = SLATE_600
    term_box.line.width = Pt(1.5)

    # Terminal Header Bar with Red/Yellow/Green dots
    term_hdr = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.6), Inches(6.8), Inches(0.45))
    term_hdr.fill.solid()
    term_hdr.fill.fore_color.rgb = CARD_DARK
    term_hdr.line.fill.background()

    p_th = term_hdr.text_frame.paragraphs[0]
    p_th.alignment = PP_ALIGN.LEFT
    r_th = p_th.add_run()
    r_th.text = "  🔴 🟡 🟢  bash - git log --oneline (Repository: Anniehatani/appstudyAI)"
    r_th.font.bold = True
    r_th.font.size = Pt(9.5)
    r_th.font.color.rgb = SLATE_200

    tx_log = s9.shapes.add_textbox(Inches(1.0), Inches(2.15), Inches(6.4), Inches(4.6))
    tf_log = tx_log.text_frame
    tf_log.word_wrap = True

    git_commits = [
        ("5ede215", "fix(embedded-server): secure base64 decoding for credentials"),
        ("4bf8ddc", "feat(security): mandatory auth gate & AI anti-abuse shield"),
        ("979db01", "perf(startup): parallel window init for instant cold launch"),
        ("3126c36", "fix(security & arch): PBKDF2 hashing, sync outbox & kiosk"),
        ("64cf09e", "fix(db): add missing content/video_url & auto-migrate D1"),
        ("4c92ab3", "perf: low-end PC optimizations, SQLite WAL & CSS caching"),
        ("0846bd2", "feat(sprint-4): Bot 3TG full media, optimistic 0ms chat"),
        ("95226db", "feat(sprint-3): release final v9.9.9, ASAR 1s launch")
    ]
    for idx, (sha, msg) in enumerate(git_commits):
        p_c = tf_log.paragraphs[0] if idx == 0 else tf_log.add_paragraph()
        if idx > 0:
            p_c.space_before = Pt(6)
        r_sha = p_c.add_run()
        r_sha.text = f"{sha} "
        r_sha.font.bold = True
        r_sha.font.size = Pt(10)
        r_sha.font.color.rgb = AMBER

        r_msg = p_c.add_run()
        r_msg.text = msg
        r_msg.font.size = Pt(9.5)
        r_msg.font.color.rgb = SLATE_100

    # Right: Release & QA Cards
    right_y = Inches(1.6)
    r_cards = [
        ("📦 Bộ Cài Đặt Desktop Chính Thức", 
         "• 3TG Học Vui Mỗi Ngày Setup 9.9.9.exe (~111MB)\n• Bản chạy ngay Portable 9.9.9.exe\n• Tối ưu khởi động cực nhanh chỉ trong 1 - 2 giây."),
        ("📊 Quản Lý GitHub Issues", 
         "• Hơn 30+ GitHub Issues được đóng thành công.\n• Gán nhãn minh bạch: enhancement, security, bug.\n• Theo dõi tiến độ Sprint qua GitHub Projects."),
        ("🧪 Nghiệm Thu 85+ Test Cases", 
         "• Bộ tài liệu kiểm thử Tai_Lieu_Test_Case DOCX.\n• Độ bao phủ toàn diện luồng người dùng E2E.\n• Nghiệm thu 100% chức năng không phát sinh lỗi.")
    ]
    for i, (rtitle, rdesc) in enumerate(r_cards):
        ry = Inches(1.6 + i * 1.8)
        rc = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.8), ry, Inches(4.733), Inches(1.65))
        rc.fill.solid()
        rc.fill.fore_color.rgb = PINK_SOFT if i == 0 else SLATE_50
        rc.line.color.rgb = PINK_PRIMARY if i == 0 else SLATE_200
        rc.line.width = Pt(1.5)

        tx_rc = s9.shapes.add_textbox(Inches(8.0), ry + Inches(0.12), Inches(4.3), Inches(1.4))
        tf_rc = tx_rc.text_frame
        tf_rc.word_wrap = True

        p1 = tf_rc.paragraphs[0]
        r1 = p1.add_run()
        r1.text = rtitle
        r1.font.bold = True
        r1.font.size = Pt(12)
        r1.font.color.rgb = PINK_PRIMARY if i == 0 else SLATE_900

        p2 = tf_rc.add_paragraph()
        p2.space_before = Pt(4)
        r2 = p2.add_run()
        r2.text = rdesc
        r2.font.size = Pt(10)
        r2.font.color.rgb = SLATE_700

    # ==========================================
    # SLIDE 10: SELF-EVALUATION & CHALLENGES OVERCOME (3 Team Cards + 4 Challenge Badges)
    # ==========================================
    s10 = prs.slides.add_slide(blank_layout)
    add_header(s10, "PHẦN VI • TỰ ĐÁNH GIÁ", "TỰ ĐÁNH GIÁ KẾT QUẢ ĐẠT ĐƯỢC SAU MÔN HỌC & THÁCH THỨC ĐÃ VƯỢT QUA")

    # Top: 3 Team Growth Cards
    t_cards = [
        ("Lê Văn An (Nhóm trưởng)", "Trưởng thành vượt bậc về tư duy Kiến trúc hệ thống phân tán, làm chủ Serverless Edge, giải quyết sự cố bảo mật OWASP và dẫn dắt nhóm theo chuẩn Agile."),
        ("Nguyễn Như Quỳnh", "Nâng cao năng lực UX Design, làm chủ hệ thống biến CSS3 đa tầng, thiết kế Mascot tương tác sinh động và bộ 6 Theme Duolingo hiện đại."),
        ("Nguyễn Tú", "Làm chủ chuẩn hóa CSDL quan hệ 3NF trên quy mô lớn (29.000 câu hỏi), xây dựng thuật toán Gamification chặt chẽ và thiết lập 85+ ca kiểm thử chi tiết.")
    ]
    t_w = Inches(3.75)
    for i, (t_name, t_eval) in enumerate(t_cards):
        tx = Inches(0.8 + i * 3.99)
        tc = s10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, tx, Inches(1.6), t_w, Inches(2.2))
        tc.fill.solid()
        tc.fill.fore_color.rgb = PINK_SOFT if i == 0 else SLATE_50
        tc.line.color.rgb = PINK_PRIMARY if i == 0 else SLATE_200
        tc.line.width = Pt(1.5)

        tx_t = s10.shapes.add_textbox(tx + Inches(0.18), Inches(1.75), t_w - Inches(0.36), Inches(1.9))
        tf_t = tx_t.text_frame
        tf_t.word_wrap = True

        p1 = tf_t.paragraphs[0]
        r1 = p1.add_run()
        r1.text = f"👤 {t_name}"
        r1.font.bold = True
        r1.font.size = Pt(13)
        r1.font.color.rgb = PINK_PRIMARY if i == 0 else SLATE_900

        p2 = tf_t.add_paragraph()
        p2.space_before = Pt(6)
        r2 = p2.add_run()
        r2.text = t_eval
        r2.font.size = Pt(10)
        r2.font.color.rgb = SLATE_700

    # Bottom: 4 Challenges Overcome
    ch_box = s10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(4.05), Inches(11.733), Inches(2.85))
    ch_box.fill.solid()
    ch_box.fill.fore_color.rgb = SLATE_50
    ch_box.line.color.rgb = SLATE_200
    ch_box.line.width = Pt(1.5)

    tx_ch = s10.shapes.add_textbox(Inches(1.05), Inches(4.15), Inches(11.2), Inches(2.65))
    tf_ch = tx_ch.text_frame
    tf_ch.word_wrap = True

    p_ch_t = tf_ch.paragraphs[0]
    r_ch_t = p_ch_t.add_run()
    r_ch_t.text = "🎯 4 THÁCH THỨC KỸ THUẬT LỚN ĐÃ ĐỐI ĐẦU VÀ GIẢI QUYẾT TRIỆT ĐỂ"
    r_ch_t.font.bold = True
    r_ch_t.font.size = Pt(13)
    r_ch_t.font.color.rgb = PINK_PRIMARY

    challenges = [
        ("1. Rò rỉ Secret trong bản cài Electron:", "Cách ly hoàn toàn .dev.vars khỏi gói cài; Giải mã runtime base64 an toàn; Vượt qua cơ chế kiểm duyệt tự động GitHub Push Protection."),
        ("2. Lệch pha CSDL ngoại tuyến:", "Áp dụng Transactional Outbox Pattern với bảng sync_outbox; Hàng đợi FIFO tự động phát lại và đối soát dữ liệu khi có mạng."),
        ("3. Gian lận Pomodoro & Hack API AI:", "Server tự động tính giờ thực tế (now - started_at); Thiết lập 6 tầng AI Anti-Abuse Shield HMAC client signature token & Cooldown 3s."),
        ("4. Tối ưu hóa cực hạn máy yếu:", "Can thiệp cờ phần cứng Chromium; Áp dụng CSS content-visibility: auto (giảm 70% render DOM); Mở app dưới 1 giây.")
    ]
    for ch_title, ch_sol in challenges:
        p_c = tf_ch.add_paragraph()
        p_c.space_before = Pt(4)
        r_ct = p_c.add_run()
        r_ct.text = f"• {ch_title} "
        r_ct.font.bold = True
        r_ct.font.size = Pt(10)
        r_ct.font.color.rgb = SLATE_900

        r_cs = p_c.add_run()
        r_cs.text = ch_sol
        r_cs.font.size = Pt(9.5)
        r_cs.font.color.rgb = SLATE_600

    # ==========================================
    # SLIDE 11: CONCLUSION, FUTURE ROADMAP & ACKNOWLEDGEMENT (Hero Split Layout)
    # ==========================================
    s11 = prs.slides.add_slide(blank_layout)
    bg11 = s11.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg11.fill.solid()
    bg11.fill.fore_color.rgb = DARKER_BG
    bg11.line.fill.background()

    # Pink Neon Accent Line
    glow11 = s11.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.2))
    glow11.fill.solid()
    glow11.fill.fore_color.rgb = PINK_NEON
    glow11.line.fill.background()

    # Top Success Tag
    succ_tag = s11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(0.8), Inches(6.2), Inches(0.45))
    succ_tag.fill.solid()
    succ_tag.fill.fore_color.rgb = CARD_DARK
    succ_tag.line.color.rgb = PINK_PRIMARY
    succ_tag.line.width = Pt(1.5)
    p_st = succ_tag.text_frame.paragraphs[0]
    p_st.alignment = PP_ALIGN.CENTER
    r_st = p_st.add_run()
    r_st.text = "🌸 ĐỒ ÁN HOÀN THÀNH XUẤT SẮC 100% MỤC TIÊU MÔN HỌC"
    r_st.font.bold = True
    r_st.font.size = Pt(11)
    r_st.font.color.rgb = PINK_NEON

    # Left: Future Roadmap Card
    r_box = s11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(1.5), Inches(5.3), Inches(4.6))
    r_box.fill.solid()
    r_box.fill.fore_color.rgb = CARD_DARK
    r_box.line.color.rgb = SLATE_600
    r_box.line.width = Pt(1.5)

    tx_rb = s11.shapes.add_textbox(Inches(1.4), Inches(1.7), Inches(4.9), Inches(4.2))
    tf_rb = tx_rb.text_frame
    tf_rb.word_wrap = True

    p_rt = tf_rb.paragraphs[0]
    r_rt = p_rt.add_run()
    r_rt.text = "🚀 ĐỊNH HƯỚNG PHÁT TRIỂN TƯƠNG LAI\n"
    r_rt.font.bold = True
    r_rt.font.size = Pt(15)
    r_rt.font.color.rgb = PINK_NEON

    roadmap_points = [
        ("📱 Ứng Dụng Di Động Đa Nền Tảng:", "Phát triển phiên bản React Native / Flutter cho iOS và Android, đồng bộ dữ liệu thời gian thực."),
        ("🧠 Trợ Lý AI Gia Sư Cá Nhân Hóa:", "Xây dựng Adaptive AI Tutor tự động điều chỉnh độ khó bài học và phân tích điểm yếu học bạ."),
        ("🏫 Kết Nối Hệ Thống Các Trường Đại Học:", "Mở rộng giao thức đồng bộ dữ liệu điểm số tới nhiều trường đại học trên cả nước.")
    ]
    for r_title, r_desc in roadmap_points:
        p_rp = tf_rb.add_paragraph()
        p_rp.space_before = Pt(10)
        r_pt = p_rp.add_run()
        r_pt.text = f"{r_title}\n"
        r_pt.font.bold = True
        r_pt.font.size = Pt(11)
        r_pt.font.color.rgb = WHITE

        r_pd = p_rp.add_run()
        r_pd.text = r_desc
        r_pd.font.size = Pt(10)
        r_pd.font.color.rgb = SLATE_200

    # Right: Thank You & Tribute Card
    t_box = s11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.5), Inches(5.333), Inches(4.6))
    t_box.fill.solid()
    t_box.fill.fore_color.rgb = RGBColor(26, 31, 54)
    t_box.line.color.rgb = PINK_PRIMARY
    t_box.line.width = Pt(2)

    tx_tb = s11.shapes.add_textbox(Inches(7.0), Inches(1.7), Inches(4.9), Inches(4.2))
    tf_tb = tx_tb.text_frame
    tf_tb.word_wrap = True

    p_tt = tf_tb.paragraphs[0]
    r_tt = p_tt.add_run()
    r_tt.text = "💖 LỜI TRI ÂN SÂU SẮC\n"
    r_tt.font.bold = True
    r_tt.font.size = Pt(15)
    r_tt.font.color.rgb = PINK_PRIMARY

    p_tp = tf_tb.add_paragraph()
    p_tp.space_before = Pt(6)
    r_tp = p_tp.add_run()
    r_tp.text = "Nhóm TONE PINK xin chân thành cảm ơn:\n"
    r_tp.font.size = Pt(11)
    r_tp.font.color.rgb = WHITE

    p_gv = tf_tb.add_paragraph()
    p_gv.space_before = Pt(4)
    r_gv = p_gv.add_run()
    r_gv.text = "Giảng viên hướng dẫn — ThS. VÂN ANH\n"
    r_gv.font.bold = True
    r_gv.font.size = Pt(13)
    r_gv.font.color.rgb = AMBER

    p_tmsg = tf_tb.add_paragraph()
    p_tmsg.space_before = Pt(6)
    r_tmsg = p_tmsg.add_run()
    r_tmsg.text = "Những bài giảng tâm huyết, những lời góp ý chuyên môn sắc bén và định hướng quý báu của Cô trong suốt môn học Công nghệ phần mềm đã giúp nhóm thực sự trưởng thành và hoàn thiện một sản phẩm phần mềm chuyên nghiệp!\n\n" \
                  "Nhóm xin chân thành cảm ơn Cô và các bạn đã chú ý lắng nghe! 🌸✨"
    r_tmsg.font.size = Pt(10.5)
    r_tmsg.font.color.rgb = SLATE_200

    # Bottom Pill
    foot11 = s11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(6.3), Inches(10.933), Inches(0.55))
    foot11.fill.solid()
    foot11.fill.fore_color.rgb = CARD_DARK
    foot11.line.color.rgb = PINK_PRIMARY
    foot11.line.width = Pt(1)
    p_f11 = foot11.text_frame.paragraphs[0]
    p_f11.alignment = PP_ALIGN.CENTER
    r_f11 = p_f11.add_run()
    r_f11.text = "TONE PINK GROUP  •  3TG STUDY AI  •  Q&A - SẴN SÀNG TRẢ LỜI CÂU HỎI"
    r_f11.font.size = Pt(11)
    r_f11.font.bold = True
    r_f11.font.color.rgb = PINK_NEON

    target_paths = [
        os.path.join(OUTPUT_DIR, "Slide_Thuyet_Trinh_Tong_Ket_Mon_Hoc_TONE_PINK_MoiNhat.pptx"),
        os.path.join(OUTPUT_DIR, "Slide_Thuyet_Trinh_Tong_Ket_Mon_Hoc_TONE_PINK.pptx")
    ]
    for p in target_paths:
        try:
            prs.save(p)
            print(f"-> ĐÃ TÁI TẠO XONG SLIDE PPTX ĐẸP MẮT (11 SLIDES KHÁC BIỆT 100%) TẠI: {p}")
        except PermissionError:
            print(f"[CẢNH BÁO] Không thể ghi đè {p} vì PowerPoint đang mở file này. Vui lòng đóng PowerPoint để ghi đè!")
        except Exception as e:
            print(f"[LỖI] Lưu {p}: {e}")

if __name__ == "__main__":
    build_docx_report()
    build_presentation()
    print("=== TẤT CẢ TÀI LIỆU VÀ SLIDE ĐÃ ĐƯỢC XUẤT BẢN THÀNH CÔNG ===")
