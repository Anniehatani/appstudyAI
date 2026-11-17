# -*- coding: utf-8 -*-
"""
Script tạo Báo cáo Word (DOCX) và Slide Thuyết trình (PPTX) Tổng kết Môn học Công nghệ phần mềm
Đề tài: Ứng dụng Học Tập Thông Minh 3TG Study (3TG Study AI)
Nhóm thực hiện: TONE PINK (Lê Văn An - Lead, Nguyễn Như Quỳnh, Nguyễn Tú)
Giảng viên hướng dẫn: ThS. Vân Anh
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

DOCX_PATH = os.path.join(OUTPUT_DIR, "Bao_Cao_Tong_Ket_Mon_Hoc_TONE_PINK.docx")
PPTX_PATH = os.path.join(OUTPUT_DIR, "Slide_Thuyet_Trinh_Tong_Ket_Mon_Hoc_TONE_PINK.pptx")

# ==========================================
# HELPER FUNCTIONS FOR DOCX
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

def add_header_styled(doc, text, level=1):
    h = doc.add_paragraph()
    h.paragraph_format.keep_with_next = True
    if level == 1:
        h.paragraph_format.space_before = Pt(16)
        h.paragraph_format.space_after = Pt(6)
        r = h.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(14)
        r.font.bold = True
        r.font.color.rgb = RGBColor(232, 62, 140) # Pink
    elif level == 2:
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)
        r = h.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(12)
        r.font.bold = True
        r.font.color.rgb = RGBColor(26, 31, 44) # Dark
    elif level == 3:
        h.paragraph_format.space_before = Pt(8)
        h.paragraph_format.space_after = Pt(3)
        r = h.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(11)
        r.font.bold = True
        r.font.italic = True
        r.font.color.rgb = RGBColor(100, 116, 139) # Gray
    return h

def add_callout(doc, title, text, bg_hex="FFF0F5", border_hex="E83E8C"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.8)
    set_cell_background(cell, bg_hex)
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    r_t = p.add_run(title + "\n")
    r_t.font.name = "Arial"
    r_t.font.bold = True
    r_t.font.size = Pt(10.5)
    r_t.font.color.rgb = RGBColor(232, 62, 140) if border_hex == "E83E8C" else RGBColor(26, 31, 44)
    r_c = p.add_run(text)
    r_c.font.name = "Arial"
    r_c.font.size = Pt(10)
    r_c.font.color.rgb = RGBColor(26, 31, 44)
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

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
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(255, 255, 255)
            
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
                run.font.size = Pt(9)
                run.font.color.rgb = RGBColor(26, 31, 44)
                
    if col_widths:
        for row in tbl.rows:
            for idx, width in enumerate(col_widths):
                row.cells[idx].width = Inches(width)
                
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

# ==========================================
# 1. BUILD COMPREHENSIVE DOCX
# ==========================================
def build_docx_report():
    print("-> Bắt đầu tạo Báo cáo Word Tổng kết Môn học...")
    doc = Document()
    for s in doc.sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)
        
    COLOR_PINK = RGBColor(232, 62, 140)
    COLOR_DARK = RGBColor(26, 31, 44)
    COLOR_GRAY = RGBColor(100, 116, 139)
    
    # Title & Metadata
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(16)
    p_title.paragraph_format.space_after = Pt(4)
    r_sub = p_title.add_run("BÁO CÁO TỔNG KẾT MÔN HỌC CÔNG NGHỆ PHẦN MỀM\n")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(13)
    r_sub.font.bold = True
    r_sub.font.color.rgb = COLOR_GRAY
    
    r_main = p_title.add_run("TỔNG HỢP KIẾN THỨC MÔN HỌC, ĐỐI CHIẾU THỰC TIỄN ÁP DỤNG\nTRONG ĐỒ ÁN 3TG STUDY & BẢN TỰ ĐÁNH GIÁ KẾT QUẢ")
    r_main.font.name = "Arial"
    r_main.font.size = Pt(17)
    r_main.font.bold = True
    r_main.font.color.rgb = COLOR_PINK
    
    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_after = Pt(14)
    r_meta = p_meta.add_run(
        "Giảng viên hướng dẫn: ThS. Vân Anh\n"
        "Nhóm thực hiện: TONE PINK (Lê Văn An - Lead, Nguyễn Như Quỳnh, Nguyễn Tú)\n"
        "Đề tài cuối kỳ: Hệ sinh thái học tập thông minh 3TG Study (3TG Study AI) | Phiên bản hoàn thiện: v9.9.9"
    )
    r_meta.font.name = "Arial"
    r_meta.font.size = Pt(10.5)
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
def build_pptx_slides():
    print("-> Bắt đầu tạo Slide Thuyết trình PowerPoint (11 Slides)...")
    prs = Presentation()
    prs.slide_width = PptxInches(13.333)
    prs.slide_height = PptxInches(7.5)
    blank_layout = prs.slide_layouts[6]
    
    PINK_COLOR = PptxRGBColor(232, 62, 140)
    DARK_COLOR = PptxRGBColor(26, 31, 44)
    LIGHT_PINK = PptxRGBColor(255, 240, 245)
    WHITE_COLOR = PptxRGBColor(255, 255, 255)
    GRAY_COLOR = PptxRGBColor(100, 116, 139)
    CARD_BG = PptxRGBColor(250, 250, 252)
    BORDER_COLOR = PptxRGBColor(226, 232, 240)
    
    # Content of EXACTLY 11 SLIDES
    slides_content = [
        # SLIDE 1: Cover
        {
            "type": "cover",
            "title": "BÁO CÁO TỔNG KẾT MÔN HỌC CÔNG NGHỆ PHẦN MỀM",
            "subtitle": "HỆ SINH THÁI HỌC TẬP THÔNG MINH 3TG STUDY (3TG STUDY AI)",
            "meta": "Giảng viên hướng dẫn: ThS. Vân Anh\nNhóm thực hiện: TONE PINK (Lê Văn An - Lead, Nguyễn Như Quỳnh, Nguyễn Tú)"
        },
        # SLIDE 2: Executive Summary & Project Intro
        {
            "type": "grid_2x2",
            "title": "TỔNG QUAN ĐỀ TÀI & NỘI DUNG BÁO CÁO TỔNG KẾT",
            "items": [
                ("🎯 Mục Tiêu Báo Cáo Môn Học", "Tổng hợp toàn diện kiến thức lý thuyết CNPM đã học; Trình bày các nội dung nhóm đã áp dụng vào đồ án cuối kỳ; Tự đánh giá kết quả đạt được sau môn học."),
                ("📱 Đề Tài: 3TG Study (3TG Study AI)", "Nền tảng học tập thông minh kết hợp Gamification Duolingo, Trợ lý DeepSeek AI giải bài tập, Mạng xã hội sinh viên và Phòng Pomodoro Zen Kiosk."),
                ("👥 Nhóm Thực Hiện: TONE PINK", "Lê Văn An (Nhóm trưởng, Kiến trúc, Backend, AI & Bảo mật Lead), Nguyễn Như Quỳnh (Frontend, UI/UX, Themes & Slide Lead), Nguyễn Tú (Database, Gamification & QA Lead)."),
                ("🚀 Quy Trình Thực Hiện Dự Án", "Áp dụng nghiêm ngặt khung làm việc Agile / Scrum qua 5 Sprint liên tục, kiểm soát mã nguồn 100% bằng Git/GitHub và phát hành bản cài Desktop hoàn chỉnh.")
            ]
        },
        # SLIDE 3: Theory Summary 1 (SDLC & Requirements)
        {
            "type": "grid_2x2",
            "title": "LÝ THUYẾT CNPM (P1): QUY TRÌNH SDLC & KỸ NGHỆ YÊU CẦU",
            "items": [
                ("🔄 Vòng Đời Phần Mềm & Mô Hình SDLC", "So sánh Waterfall tuần tự và Agile/Scrum linh hoạt. Khung làm việc Scrum: 3 vai trò (PO, SM, Dev), 4 sự kiện (Planning, Daily, Review, Retro) và 3 tạo tác (Product Backlog, Sprint Backlog, Increment)."),
                ("📋 Phân Loại Yêu Cầu Phần Mềm", "Yêu cầu chức năng (FR - tính năng, dịch vụ cụ thể) và Yêu cầu phi chức năng (NFR - hiệu năng, độ tin cậy, bảo mật, tính khả dụng)."),
                ("📝 Kỹ Thuật User Story & INVEST", "Đặc tả theo mẫu chuẩn: 'As a... I want to... So that...'. Đảm bảo tiêu chuẩn INVEST và Tiêu chuẩn nghiệm thu (Acceptance Criteria) với cấu trúc Given-When-Then."),
                ("📐 Mô Hình Hóa Hệ Thống (UML)", "Biểu đồ Use Case Diagram phân rã chức năng tác nhân, Activity Diagram mô tả quy trình nghiệp vụ và Sequence Diagram mô hình hóa luồng thông điệp tương tác.")
            ]
        },
        # SLIDE 4: Theory Summary 2 (Architecture, Testing & DevOps)
        {
            "type": "grid_2x2",
            "title": "LÝ THUYẾT CNPM (P2): KIẾN TRÚC, KIỂM THỬ & BẢO MẬT",
            "items": [
                ("🏗️ Kiến Trúc Hệ Thống & CSDL 3NF", "Kiến trúc phân tầng (Layered 3-Tier), Serverless Edge Computing; Chuẩn hóa CSDL quan hệ 1NF, 2NF, 3NF nhằm loại bỏ dị thường và bảo vệ toàn vẹn dữ liệu."),
                ("🧪 Kim Tự Tháp Kiểm Thử (Testing)", "Unit Testing kiểm thử logic hàm, Integration Testing kiểm tra giao tiếp giữa các module, và E2E Testing kiểm thử toàn bộ trải nghiệm người dùng thực tế."),
                ("🛡️ An Toàn Bảo Mật Theo Chuẩn OWASP", "Ngăn chặn SQL Injection bằng Prepared Statements, mã hóa và băm mật khẩu bằng PBKDF2/Argon2 kèm Salt ngẫu nhiên, Rate Limiting chống Brute-force."),
                ("⚡ Đóng Gói Desktop & Quản Trị Git", "Đóng gói Desktop đa nền tảng bằng Electron ASAR; Quản lý mã nguồn phân tán Git Feature Branching, Conventional Commits và quy trình CI/CD tích hợp.")
            ]
        },
        # SLIDE 5: Practice Sprint 1 & 2
        {
            "type": "grid_2x2",
            "title": "ÁP DỤNG THỰC TẾ: SPRINT 1 & 2 (NỀN TẢNG & GAMIFICATION)",
            "items": [
                ("🌐 Sprint 1: Hạ Tầng Serverless Cloudflare", "Triển khai Worker + D1 Database + R2 Object Storage. Chuẩn hóa CSDL 3NF với 10 môn học, 106 chương, 4.000 bài học và 29.000 câu hỏi trắc nghiệm."),
                ("🎮 Sprint 1: Vòng Lặp Gamification Duolingo", "Lộ trình học uốn lượn, hệ thống Trái tim năng lượng, Kim cương thưởng, Chuỗi ngày Streak, Đóng băng Streak và Mascot Thỏ Bảy Màu động viên học tập."),
                ("🎓 Sprint 2: Tích Hợp Cổng Trường IU CMCU", "Cơ chế đăng nhập 1-Click cổng trường qua Microsoft 365, bóc tách tự động bảng điểm toà khoá và lịch học 6 tuần; Thuật toán tính GPA chuẩn thang 10 & 4."),
                ("💎 Sprint 2: Trợ Lý AI & Cửa Hàng Shop VIP", "Trợ lý 3TG AI phân tích học bạ đề xuất Target GPA; Shop vật phẩm phong cách Nitro với Mascot, Khung Avatar động, Ảnh nền R2 và Dark Mode.")
            ]
        },
        # SLIDE 6: Practice Sprint 3 & 4
        {
            "type": "grid_2x2",
            "title": "ÁP DỤNG THỰC TẾ: SPRINT 3 & 4 (TRÍ TUỆ NHÂN TẠO & MẠNG XÃ HỘI)",
            "items": [
                ("🤖 Sprint 3: DeepSeek AI Vision RAG", "Tích hợp mô hình AI giải đáp thắc mắc chuyên sâu, nhận diện và phân tích đề bài trực tiếp qua ảnh chụp bài tập; Sổ tay ghi chú thông minh Smart Notes Markdown."),
                ("💻 Sprint 3: Đóng Gói Desktop Electron v9.9.9", "Xuất bản bộ cài đặt Windows Setup 9.9.9.exe và Portable. Tối ưu ASAR và Single Instance Lock, rút ngắn thời gian khởi động app từ 15s xuống 1 - 2s."),
                ("💬 Sprint 4: Mạng Xã Hội 3TG Messenger", "Giao diện chat toàn màn hình, hỗ trợ nhắn tin 1-1 và tạo nhóm học tập phân quyền Admin/Member; Đồng bộ thời gian thực mượt mà."),
                ("⚡ Sprint 4: Optimistic UI & Bot 3TG Native", "Áp dụng cơ chế Optimistic UI phản hồi tin nhắn tức thì 0ms; Chuyển đổi Trợ lý Bot 3TG thành module Native siêu nhẹ chạy trực tiếp trong Node runtime.")
            ]
        },
        # SLIDE 7: Practice Sprint 5
        {
            "type": "grid_2x2",
            "title": "ÁP DỤNG THỰC TẾ: SPRINT 5 (BẢO MẬT OWASP, THEMES & POMODORO)",
            "items": [
                ("🔒 Nâng Cấp Bảo Mật Chuẩn OWASP", "Cách ly tuyệt đối .dev.vars khỏi file cài đặt; Mã hóa PBKDF2-HMAC-SHA256 với Salt 16B và 100k vòng; Rate Limiting 5 lần/15ph chống dò mật khẩu."),
                ("🛡️ 6 Lớp AI Anti-Abuse Shield", "HMAC Client Signature Token, Bộ đếm ngược Cooldown 3s, Quota giới hạn 60 câu/ngày, bảo vệ API AI không bị khai thác làm dịch vụ free trái phép."),
                ("📦 Transactional Outbox Replay Queue", "Hàng đợi sync_outbox lưu trữ thao tác khi mất mạng hoặc nghẽn quota D1, tự động đối soát và phát lại theo thứ tự FIFO khi trực tuyến."),
                ("⏱️ Phòng Pomodoro Zen Kiosk & 6 Theme", "Focus Kiosk Mode khóa màn hình và phím xao nhãng; Server xác thực giờ học thực tế chống gian lận (+50 XP, 30 Gems); Hệ thống 6 Theme Duolingo phủ sóng 100%.")
            ]
        },
        # SLIDE 8: Matrix Table
        {
            "type": "matrix",
            "title": "ĐỐI CHIẾU LÝ THUYẾT CNPM VÀ THỰC TIỄN ÁP DỤNG TRONG 3TG",
            "rows": [
                ("Quy trình SDLC", "Agile / Scrum, 5 Sprints liên tục", "Hoàn thành 100% mục tiêu, báo cáo từng Sprint, GitHub tracking"),
                ("Kỹ nghệ yêu cầu", "User Stories INVEST, Acceptance Criteria", "Đặc tả chi tiết luồng học, cào điểm, chat AI, pomodoro kiosk"),
                ("Kiến trúc & CSDL", "Serverless Edge, 3NF, Outbox Pattern", "Cloudflare Worker + D1 + R2; sync_outbox; CSDL 29.000 câu trắc nghiệm"),
                ("UI/UX & HCI", "10 Heuristics Nielsen, Gamification", "Cây học tập Duolingo, Mascot Thỏ Bảy Màu, 6 Theme rực rỡ, 0ms chat"),
                ("Kiểm thử & QA", "Test Pyramid, Black-box & White-box", "Xây dựng 85+ ca kiểm thử chi tiết, nghiệm thu E2E toàn diện"),
                ("Bảo mật & DevOps", "OWASP, PBKDF2, AI Shield, Electron", "PBKDF2 100k vòng, HMAC Token, Kiosk Mode, Setup 9.9.9.exe 1s")
            ]
        },
        # SLIDE 9: Git Commits Evidence
        {
            "type": "grid_2x2",
            "title": "MINH CHỨNG QUY TRÌNH PHẦN MỀM: GIT COMMITS & PHÁT HÀNH",
            "items": [
                ("🌿 Quy Chuẩn Git Workflow", "Phân nhánh làm việc Feature Branching, kiểm soát xung đột mã nguồn chặt chẽ và tuân thủ định dạng Conventional Commits (feat, fix, perf, docs, chore)."),
                ("📜 Lịch Sử Commit Tiêu Biểu", "Commit 5ede215 (Bảo vệ API D1/DeepSeek); Commit 4bf8ddc (AI Anti-Abuse Shield & Mandatory Auth); Commit 3126c36 (Bảo mật PBKDF2 & Outbox Replay)."),
                ("📊 Quản Lý Đầu Việc GitHub Issues", "Hơn 30+ GitHub Issues được khởi tạo và đóng hoàn thiện xuyên suốt các Sprint (#SP1-01 -> #SP1-05, #SP4-01 -> #SP4-06, Sprint 5 Issues)."),
                ("📦 Xuất Bản Sản Phẩm Hoàn Chỉnh", "Bộ cài đặt Desktop Windows chính thức '3TG Học Vui Mỗi Ngày Setup 9.9.9.exe' và bản Portable mở tức thì trong 1 giây nhờ tối ưu hóa Cold-start song song.")
            ]
        },
        # SLIDE 10: Self Evaluation & Challenges
        {
            "type": "grid_2x2",
            "title": "TỰ ĐÁNH GIÁ KẾT QUẢ ĐẠT ĐƯỢC & THÁCH THỨC VƯỢT QUA",
            "items": [
                ("🌟 Kết Quả Sản Phẩm & Năng Lực Nhóm", "Sản phẩm đạt độ hoàn thiện cao, dữ liệu thật 29.000 câu hỏi, hiệu năng 60 FPS mượt mà. Cả 3 thành viên trưởng thành vượt bậc về tư duy kỹ thuật và làm việc nhóm."),
                ("🛡️ Vượt Qua Thử Thách Bảo Mật Khắc Nghiệt", "Giải quyết rào cản push protection của GitHub, bảo vệ API token, ngăn chặn triệt để nguy cơ trích xuất bí mật từ bản cài Electron."),
                ("☁️ Giải Quyết Xung Đột Dữ Liệu Ngoại Tuyến", "Xây dựng thành công cơ chế Transactional Outbox Replay, bảo đảm tính toàn vẹn dữ liệu giữa SQLite Local và Cloudflare D1 khi mất mạng."),
                ("💡 Bài Học Kinh Nghiệm Quý Báu", "Quy trình Agile/Scrum là kim chỉ nam giúp kiểm soát rủi ro; Tư duy bảo mật ngay từ đầu (Security by Design) giúp tiết kiệm 80% chi phí khắc phục lỗi sau này.")
            ]
        },
        # SLIDE 11: Conclusion & Thanks
        {
            "type": "conclusion",
            "title": "KẾT LUẬN, ĐỊNH HƯỚNG TƯƠNG LAI & LỜI CẢM ƠN",
            "subtitle": "ĐỒ ÁN 3TG STUDY HOÀN THÀNH XUẤT SẮC 100% MỤC TIÊU MÔN HỌC",
            "roadmap": "🚀 Định hướng phát triển: Mở rộng phiên bản Mobile đa nền tảng (React Native), xây dựng mô hình AI Gia sư cá nhân hóa (Adaptive AI Tutor) theo tiến độ học bạ.",
            "meta": "Nhóm TONE PINK xin chân thành cảm ơn sự hướng dẫn tận tình, tâm huyết của Giảng viên ThS. Vân Anh! 🌸✨"
        }
    ]
    
    for s_idx, s_data in enumerate(slides_content):
        slide = prs.slides.add_slide(blank_layout)
        
        # Base White Background
        bg_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, PptxInches(0), PptxInches(0), PptxInches(13.333), PptxInches(7.5))
        bg_shape.fill.solid()
        bg_shape.fill.fore_color.rgb = WHITE_COLOR
        bg_shape.line.fill.background()
        
        if s_data["type"] == "cover":
            # Pink Accent Bar
            accent = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, PptxInches(0), PptxInches(0), PptxInches(13.333), PptxInches(0.4))
            accent.fill.solid()
            accent.fill.fore_color.rgb = PINK_COLOR
            accent.line.fill.background()
            
            # Card Box
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
            r1.font.size = PptxPt(32)
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
            
        elif s_data["type"] == "grid_2x2":
            # Header Pink Banner
            banner = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, PptxInches(0), PptxInches(0), PptxInches(13.333), PptxInches(1.1))
            banner.fill.solid()
            banner.fill.fore_color.rgb = PINK_COLOR
            banner.line.fill.background()
            
            tx_title = slide.shapes.add_textbox(PptxInches(0.8), PptxInches(0.18), PptxInches(11.733), PptxInches(0.75))
            tf_t = tx_title.text_frame
            p_t = tf_t.paragraphs[0]
            r_t = p_t.add_run()
            r_t.text = f"{s_idx + 1}. {s_data['title']}"
            r_t.font.bold = True
            r_t.font.size = PptxPt(23)
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
                card.fill.fore_color.rgb = CARD_BG
                card.line.color.rgb = BORDER_COLOR
                card.line.width = PptxPt(1.5)
                
                # Header Accent in Card
                card_bar = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, PptxInches(0.55))
                card_bar.fill.solid()
                card_bar.fill.fore_color.rgb = LIGHT_PINK
                card_bar.line.fill.background()
                
                tx_c = slide.shapes.add_textbox(x + PptxInches(0.2), y + PptxInches(0.08), w - PptxInches(0.4), PptxInches(0.4))
                tf_c = tx_c.text_frame
                tf_c.word_wrap = True
                p_c = tf_c.paragraphs[0]
                r_ct = p_c.add_run()
                r_ct.text = item_title
                r_ct.font.bold = True
                r_ct.font.size = PptxPt(14)
                r_ct.font.color.rgb = PINK_COLOR
                
                tx_d = slide.shapes.add_textbox(x + PptxInches(0.25), y + PptxInches(0.65), w - PptxInches(0.5), h - PptxInches(0.75))
                tf_d = tx_d.text_frame
                tf_d.word_wrap = True
                p_d = tf_d.paragraphs[0]
                r_cd = p_d.add_run()
                r_cd.text = item_desc
                r_cd.font.size = PptxPt(12)
                r_cd.font.color.rgb = DARK_COLOR
                
        elif s_data["type"] == "matrix":
            # Header Pink Banner
            banner = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, PptxInches(0), PptxInches(0), PptxInches(13.333), PptxInches(1.1))
            banner.fill.solid()
            banner.fill.fore_color.rgb = PINK_COLOR
            banner.line.fill.background()
            
            tx_title = slide.shapes.add_textbox(PptxInches(0.8), PptxInches(0.18), PptxInches(11.733), PptxInches(0.75))
            tf_t = tx_title.text_frame
            p_t = tf_t.paragraphs[0]
            r_t = p_t.add_run()
            r_t.text = f"{s_idx + 1}. {s_data['title']}"
            r_t.font.bold = True
            r_t.font.size = PptxPt(23)
            r_t.font.color.rgb = WHITE_COLOR
            
            # Table
            rows_cnt = len(s_data["rows"]) + 1
            tbl_shape = slide.shapes.add_table(rows_cnt, 3, PptxInches(0.8), PptxInches(1.5), PptxInches(11.733), PptxInches(5.4))
            tbl = tbl_shape.table
            tbl.columns[0].width = PptxInches(2.5)
            tbl.columns[1].width = PptxInches(4.2)
            tbl.columns[2].width = PptxInches(5.033)
            
            headers = ["Lĩnh Vực Lý Thuyết CNPM", "Nguyên Lý Được Giảng Dạy", "Hiện Thực Hoá Thực Tế Trong 3TG Study"]
            for c_i, h_text in enumerate(headers):
                cell = tbl.cell(0, c_i)
                cell.fill.solid()
                cell.fill.fore_color.rgb = PINK_COLOR
                p = cell.text_frame.paragraphs[0]
                p.alignment = PP_ALIGN.CENTER
                r = p.add_run()
                r.text = h_text
                r.font.bold = True
                r.font.size = PptxPt(13)
                r.font.color.rgb = WHITE_COLOR
                
            for r_i, (col1, col2, col3) in enumerate(s_data["rows"]):
                row_cells = [tbl.cell(r_i + 1, 0), tbl.cell(r_i + 1, 1), tbl.cell(r_i + 1, 2)]
                bg = LIGHT_PINK if r_i % 2 == 1 else WHITE_COLOR
                for c_i, val in enumerate([col1, col2, col3]):
                    cell = row_cells[c_i]
                    cell.fill.solid()
                    cell.fill.fore_color.rgb = bg
                    p = cell.text_frame.paragraphs[0]
                    r = p.add_run()
                    r.text = val
                    r.font.size = PptxPt(11)
                    r.font.color.rgb = DARK_COLOR
                    if c_i == 0:
                        r.font.bold = True
                        r.font.color.rgb = PINK_COLOR
                        
        elif s_data["type"] == "conclusion":
            # Header Accent Bar
            accent = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, PptxInches(0), PptxInches(0), PptxInches(13.333), PptxInches(0.4))
            accent.fill.solid()
            accent.fill.fore_color.rgb = PINK_COLOR
            accent.line.fill.background()
            
            card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, PptxInches(1.2), PptxInches(1.2), PptxInches(10.933), PptxInches(5.4))
            card.fill.solid()
            card.fill.fore_color.rgb = LIGHT_PINK
            card.line.color.rgb = PINK_COLOR
            card.line.width = PptxPt(3)
            
            tx_box = slide.shapes.add_textbox(PptxInches(1.5), PptxInches(1.6), PptxInches(10.333), PptxInches(4.6))
            tf = tx_box.text_frame
            tf.word_wrap = True
            
            p1 = tf.paragraphs[0]
            p1.alignment = PP_ALIGN.CENTER
            r1 = p1.add_run()
            r1.text = s_data["title"]
            r1.font.bold = True
            r1.font.size = PptxPt(28)
            r1.font.color.rgb = PINK_COLOR
            
            p2 = tf.add_paragraph()
            p2.alignment = PP_ALIGN.CENTER
            p2.space_before = PptxPt(14)
            r2 = p2.add_run()
            r2.text = s_data["subtitle"]
            r2.font.bold = True
            r2.font.size = PptxPt(18)
            r2.font.color.rgb = DARK_COLOR
            
            p3 = tf.add_paragraph()
            p3.alignment = PP_ALIGN.CENTER
            p3.space_before = PptxPt(18)
            r3 = p3.add_run()
            r3.text = s_data["roadmap"]
            r3.font.size = PptxPt(14)
            r3.font.color.rgb = DARK_COLOR
            
            p4 = tf.add_paragraph()
            p4.alignment = PP_ALIGN.CENTER
            p4.space_before = PptxPt(22)
            r4 = p4.add_run()
            r4.text = s_data["meta"]
            r4.font.size = PptxPt(15)
            r4.font.italic = True
            r4.font.bold = True
            r4.font.color.rgb = PINK_COLOR
            
    prs.save(PPTX_PATH)
    print(f"-> Đã tạo thành công Slide PowerPoint (11 Slides) tại: {PPTX_PATH}")

if __name__ == "__main__":
    build_docx_report()
    build_pptx_slides()
    print("=== HOÀN TẤT XUẤT BẢN TOÀN BỘ TÀI LIỆU TỔNG KẾT MÔN HỌC ===")
