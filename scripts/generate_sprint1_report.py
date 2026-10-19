import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def create_report():
    doc = docx.Document()
    
    # Page setup - Margins: 0.8 inch (approx 2cm) for spacious modern layout
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        section.different_first_page_header_footer = True
        
        # Header for normal pages
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("BÁO CÁO TỔNG KẾT SPRINT 1 | DỰ ÁN 3TG ALL-IN-ONE - ĐẠI HỌC CMC")
        hrun.font.name = "Calibri"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)
        
        # Footer for normal pages
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("Trường Đại học CMC • Khoa CNTT • Môn: Công nghệ phần mềm - K4")
        frun.font.name = "Calibri"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)

    # Base styling
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(0x1F, 0x29, 0x37) # Dark charcoal
    normal_style.paragraph_format.line_spacing = 1.2
    normal_style.paragraph_format.space_after = Pt(4)

    # Color Constants
    NAVY_HEX = "1E3A8A"      # Primary Headings & Tables
    ROSE_HEX = "DB2777"      # Accents & 3TG Brand
    DARK_NAVY_HEX = "0F172A" # High Contrast text
    BG_LIGHT_HEX = "F8FAFC"  # Table alternating rows
    BG_CALLOUT_HEX = "FDF2F8"# Pink callout fill
    BORDER_HEX = "CBD5E1"    # Clean table borders

    # Helper functions
    def set_cell_background(cell, hex_color):
        tcPr = cell._tc.get_or_add_tcPr()
        for child in list(tcPr):
            if child.tag.endswith('shd'):
                tcPr.remove(child)
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(
            f'<w:tcMar {nsdecls("w")}>'
            f'<w:top w:w="{top}" w:type="dxa"/>'
            f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
            f'<w:left w:w="{left}" w:type="dxa"/>'
            f'<w:right w:w="{right}" w:type="dxa"/>'
            f'</w:tcMar>'
        )
        tcPr.append(tcMar)

    def set_table_borders(table, color=BORDER_HEX, sz="4"):
        tblPr = table._tbl.tblPr
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:left w:val="none"/>'
            f'<w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:right w:val="none"/>'
            f'<w:insideH w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:insideV w:val="none"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(borders)

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = 'Calibri'
        run.font.size = Pt(14.5)
        run.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = 'Calibri'
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(0xDB, 0x27, 0x77) # 3TG Rose
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = 'Calibri'
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        return p

    def add_bullet(bold_prefix, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        r_bold = p.add_run(bold_prefix)
        r_bold.bold = True
        r_bold.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        r_text = p.add_run(text)
        r_text.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
        return p

    def add_callout(title, text):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.8)
        set_cell_background(cell, BG_CALLOUT_HEX)
        set_cell_margins(cell, top=130, bottom=130, left=200, right=180)
        
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{ROSE_HEX}"/>'
            f'<w:top w:val="none"/>'
            f'<w:bottom w:val="none"/>'
            f'<w:right w:val="none"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(borders)
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        rt = p.add_run(f"💡 {title}: ")
        rt.bold = True
        rt.font.name = "Calibri"
        rt.font.size = Pt(10)
        rt.font.color.rgb = RGBColor(0x9D, 0x17, 0x4D)
        
        rb = p.add_run(text)
        rb.font.name = "Calibri"
        rb.font.size = Pt(9.5)
        rb.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
        
        # breathing space
        p_sp = doc.add_paragraph()
        p_sp.paragraph_format.space_before = Pt(0)
        p_sp.paragraph_format.space_after = Pt(4)

    def add_figure(image_path, caption, width_inch=6.2):
        if not os.path.exists(image_path):
            print(f"Warning: Image not found at {image_path}")
            return
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(4)
        run_img = p_img.add_run()
        run_img.add_picture(image_path, width=Inches(width_inch))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(2)
        p_cap.paragraph_format.space_after = Pt(8)
        run_cap = p_cap.add_run(caption)
        run_cap.italic = True
        run_cap.font.name = "Calibri"
        run_cap.font.size = Pt(9.5)
        run_cap.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    # Paths
    base_folder = r"c:\Users\LeVanAn\Documents\ChatGPT\app study 2"
    sprint_folder = os.path.join(base_folder, "tổng kết sprint 1")
    mascot_img = os.path.join(base_folder, "character", "Thỏ bảy màu.jpg")
    erd_img = os.path.join(sprint_folder, "erd_page_1.png")
    ss1_img = os.path.join(sprint_folder, "Screenshot 2026-10-18 180117.png")
    ss2_img = os.path.join(sprint_folder, "Screenshot 2026-10-18 180227.png")
    ss3_img = os.path.join(sprint_folder, "Screenshot 2026-10-18 180301.png")

    # ==========================================
    # TRANG BÌA (COVER PAGE)
    # ==========================================
    p_uni = doc.add_paragraph()
    p_uni.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_uni.paragraph_format.space_before = Pt(10)
    p_uni.paragraph_format.space_after = Pt(2)
    r = p_uni.add_run("TRƯỜNG ĐẠI HỌC CMC • CMC UNIVERSITY\nKHOA CÔNG NGHỆ THÔNG TIN")
    r.bold = True
    r.font.name = "Calibri"
    r.font.size = Pt(13)
    r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(2)
    p_sub.paragraph_format.space_after = Pt(24)
    r_sub = p_sub.add_run("BỘ MÔN: CÔNG NGHỆ PHẦN MỀM - K4 (MÃ MÔN: INFO2011)")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(11)
    r_sub.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    if os.path.exists(mascot_img):
        p_cov_img = doc.add_paragraph()
        p_cov_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cov_img.paragraph_format.space_before = Pt(10)
        p_cov_img.paragraph_format.space_after = Pt(10)
        p_cov_img.add_run().add_picture(mascot_img, width=Inches(1.8))

    p_tit = doc.add_paragraph()
    p_tit.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_tit.paragraph_format.space_before = Pt(10)
    p_tit.paragraph_format.space_after = Pt(6)
    r_tit = p_tit.add_run("BÁO CÁO TỔNG KẾT SPRINT 1")
    r_tit.bold = True
    r_tit.font.name = "Calibri"
    r_tit.font.size = Pt(22)
    r_tit.font.color.rgb = RGBColor(0xDB, 0x27, 0x77) # 3TG Rose

    p_subtit = doc.add_paragraph()
    p_subtit.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_subtit.paragraph_format.space_before = Pt(2)
    p_subtit.paragraph_format.space_after = Pt(20)
    r_subtit = p_subtit.add_run("ĐỀ TÀI: NỀN TẢNG QUẢN LÝ HỌC TẬP GAMIFICATION \"3TG\" ALL-IN-ONE\nTÍCH HỢP HỆ SINH THÁI DUOLINGO VÀ TRỢ GIẢNG AI BẢO MẬT")
    r_subtit.bold = True
    r_subtit.font.name = "Calibri"
    r_subtit.font.size = Pt(13)
    r_subtit.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    # Box thông tin nhóm thực hiện
    tbl_cov = doc.add_table(rows=5, cols=2)
    tbl_cov.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_cov, color="E2E8F0", sz="6")
    cov_rows = [
        ("Nhóm sinh viên thực hiện:", "NHÓM 3TG (Agile / Scrum Team)"),
        ("1. Lê Văn An (Trưởng nhóm):", "Scrum Master & AI / Cloud Architect"),
        ("2. Nguyễn Như Quỳnh:", "Product Owner & Lead UI/UX / Frontend Developer"),
        ("3. Nguyễn Văn Tú:", "Database Engineer, Backend Developer & QA/Tester"),
        ("Thời gian thực hiện Sprint 1:", "05/10/2026 – 18/10/2026 (Khung thời gian chuẩn 2 tuần)")
    ]
    for idx, (c1, c2) in enumerate(cov_rows):
        cell1, cell2 = tbl_cov.cell(idx, 0), tbl_cov.cell(idx, 1)
        cell1.width = Inches(2.6)
        cell2.width = Inches(4.2)
        set_cell_background(cell1, "F8FAFC")
        set_cell_background(cell2, "FFFFFF")
        set_cell_margins(cell1, top=100, bottom=100, left=140, right=140)
        set_cell_margins(cell2, top=100, bottom=100, left=140, right=140)
        
        p1 = cell1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run(c1)
        r1.bold = True
        r1.font.size = Pt(10)
        r1.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        
        p2 = cell2.paragraphs[0]
        p2.paragraph_format.space_after = Pt(0)
        r2 = p2.add_run(c2)
        r2.font.size = Pt(10)
        r2.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    p_loc = doc.add_paragraph()
    p_loc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_loc.paragraph_format.space_before = Pt(36)
    p_loc.paragraph_format.space_after = Pt(0)
    r_loc = p_loc.add_run("Hà Nội, Tháng 10 Năm 2026")
    r_loc.italic = True
    r_loc.font.name = "Calibri"
    r_loc.font.size = Pt(10.5)
    r_loc.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    doc.add_page_break()

    # ==========================================
    # MỤC LỤC & TỔNG QUAN TÀI LIỆU
    # ==========================================
    add_h1("MỤC LỤC BÁO CÁO")
    toc_items = [
        ("PHẦN 1: BỐI CẢNH & Ý TƯỞNG DỰ ÁN (PROJECT VISION)", "3"),
        ("  1.1. Hiện trạng và hạn chế của hệ thống EduX truyền thống", "3"),
        ("  1.2. Giải pháp đột phá: Nền tảng học tập Gamification 3TG All-in-1", "3"),
        ("  1.3. Bảng so sánh trực diện EduX truyền thống và giải pháp 3TG", "4"),
        ("  1.4. Năm trụ cột cốt lõi tạo nên sức mạnh của 3TG", "5"),
        ("PHẦN 2: MỤC TIÊU SPRINT 1 (SPRINT GOAL)", "6"),
        ("  2.1. Tuyên bố mục tiêu Sprint 1 (Sprint Goal Statement)", "6"),
        ("  2.2. Khung thời gian và nhịp độ Scrum (Scrum Cadence)", "6"),
        ("  2.3. Định nghĩa hoàn thành (Definition of Done - DoD)", "7"),
        ("PHẦN 3: PHÂN CÔNG VAI TRÒ & TRÁCH NHIỆM CHI TIẾT (SCRUM TEAM)", "8"),
        ("  3.1. Cơ cấu đội ngũ Scrum dự án 3TG", "8"),
        ("  3.2. Ma trận phân công trách nhiệm chi tiết (RACI Matrix)", "8"),
        ("PHẦN 4: BẢNG SPRINT 1 BACKLOG & KẾT QUẢ THỰC HIỆN", "10"),
        ("  4.1. Tổng quan kế hoạch Sprint 1 Backlog", "10"),
        ("  4.2. Bảng chi tiết User Stories & Trạng thái nghiệm thu (100% DONE)", "10"),
        ("PHẦN 5: MÔ TẢ CHI TIẾT CÁC SẢN PHẨM BÀN GIAO (INCREMENT) TRONG SPRINT 1", "12"),
        ("  5.1. Thiết kế Cơ sở dữ liệu ERD & Kiến trúc Cloudflare D1 + Local AI", "12"),
        ("  5.2. Phân hệ Lộ trình học vượt ải & Cẩm nang (Notes)", "14"),
        ("  5.3. Phân hệ Hồ sơ học viên, Tủ huy hiệu, Túi đồ & Chỉ số Gamification", "16"),
        ("  5.4. Phân hệ Trợ giảng \"Hỏi 3TG AI\" chọn ngữ cảnh theo từng môn học", "18"),
        ("PHẦN 6: BÁO CÁO SPRINT REVIEW & SPRINT RETROSPECTIVE", "20"),
        ("  6.1. Báo cáo nghiệm thu Sprint Review", "20"),
        ("  6.2. Báo cáo họp cải tiến quy trình Sprint Retrospective", "20"),
        ("  6.3. Kế hoạch hành động chi tiết cho Sprint 2 (Sprint 2 Action Plan)", "21"),
        ("PHẦN KẾT LUẬN & CHỮ KÝ NGHIỆM THU", "22")
    ]
    for title, pg in toc_items:
        p_t = doc.add_paragraph()
        p_t.paragraph_format.space_before = Pt(1)
        p_t.paragraph_format.space_after = Pt(2)
        r_title = p_t.add_run(title)
        r_title.font.size = Pt(10)
        if title.startswith("PHẦN"):
            r_title.bold = True
            r_title.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
        else:
            r_title.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
        
        # Dots and page
        p_t.add_run(" " + "." * (85 - len(title) * 2) + " ").font.color.rgb = RGBColor(0xCB, 0xD5, 0xE1)
        r_pg = p_t.add_run(pg)
        r_pg.bold = True
        r_pg.font.color.rgb = RGBColor(0xDB, 0x27, 0x77)

    doc.add_page_break()

    # ==========================================
    # PHẦN 1: BỐI CẢNH & Ý TƯỞNG DỰ ÁN
    # ==========================================
    add_h1("PHẦN 1: BỐI CẢNH & Ý TƯỞNG DỰ ÁN (PROJECT VISION)")
    
    add_h2("1.1. Hiện trạng và hạn chế của hệ thống EduX truyền thống")
    p = doc.add_paragraph()
    p.add_run(
        "Trong bối cảnh chuyển đổi số giáo dục đại học tại Trường Đại học CMC, hệ thống học trực tuyến hiện tại (EduX) "
        "đóng vai trò là cổng cung cấp tài liệu bài giảng và bài tập chính khóa. Tuy nhiên, qua quá trình sử dụng thực tế "
        "của sinh viên ngành Công nghệ Thông tin, nhóm nghiên cứu đã ghi nhận nhiều rào cản tâm lý và kỹ thuật "
        "khiến hiệu quả tự học suy giảm rõ rệt:"
    )
    add_bullet("Giao diện truyền thống và khô khan: ", "Bố cục chủ yếu dạng danh mục thư mục (tree view) hoặc bảng danh sách tĩnh, thiếu hoàn toàn các hiệu ứng thị giác hiện đại, gây cảm giác nặng nề, nhàm chán như đang làm việc hành chính thay vì tiếp thu tri thức.")
    add_bullet("Thiếu cơ chế tạo động lực tự học (Gamification Gap): ", "Sinh viên không có chuỗi ngày học tập (Streak), không có điểm kinh nghiệm (XP), không có bảng xếp hạng thi đua hay phần thưởng hữu hình. Đa số sinh viên chỉ học dồn vào những ngày cận kề kỳ thi thay vì duy trì thói quen học tập đều đặn mỗi ngày.")
    add_bullet("Công cụ ghi chú và ôn tập bị phân tán: ", "Khi sinh viên cần ghi lại kiến thức trọng tâm (Notes) hoặc ôn lại các câu hỏi trắc nghiệm đã làm sai, họ phải sử dụng các ứng dụng ngoài (Notion, Word, sổ tay rời) khiến mạch học bị ngắt quãng, thiếu khả năng truy vết lỗi sai thông minh.")
    add_bullet("Chưa có sự hỗ trợ tức thời từ Trợ giảng AI: ", "Khi gặp các khái niệm trừu tượng (như thuật toán đồ thị trong Cấu trúc dữ liệu, chuẩn hóa BCNF trong Cơ sở dữ liệu, hay biểu thức logic trong Toán rời rạc), sinh viên không có người giải đáp ngay mà phải chờ đợi giảng viên phản hồi qua email hoặc diễn đàn.")

    add_h2("1.2. Giải pháp đột phá: Nền tảng học tập Gamification 3TG All-in-1")
    p = doc.add_paragraph()
    p.add_run(
        "Để giải quyết triệt để các hạn chế trên, Nhóm 3TG đã tiến hành nghiên cứu và phát triển sản phẩm mang tên: "
    )
    r_name = p.add_run("Nền tảng quản lý học tập \"3TG\" All-in-1")
    r_name.bold = True
    p.add_run(
        ". Tên gọi \"3TG\" đại diện cho phương châm cốt lõi: \"Tự giác – Thông minh – Tăng tốc – Gắn kết\". "
        "Dự án ứng dụng toàn diện triết lý Trò chơi hóa (Gamification) lấy cảm hứng từ thành công vượt bậc của Duolingo "
        "trên toàn cầu, kết hợp kiến trúc điện toán đám mây biên (Cloudflare Edge D1/R2) và mô hình Trí tuệ Nhân tạo chạy cục bộ "
        "(Local AI) bảo mật tuyệt đối."
    )

    add_callout(
        "Tuyên ngôn Giá trị của Dự án (Core Value Proposition)",
        "Biến toàn bộ giáo trình học đại học khô khan thành những 'Cửa Ải' trò chơi hấp dẫn, giúp sinh viên duy trì ngọn lửa "
        "học tập mỗi ngày với Mascot Giáo sư Thỏ Bảy Màu và Trợ giảng AI thông minh, bảo mật 100% học liệu nội bộ."
    )

    add_h2("1.3. Bảng so sánh trực diện EduX truyền thống và giải pháp 3TG All-in-1")
    p = doc.add_paragraph()
    p.add_run("Bảng 1 dưới đây đối chiếu chi tiết 8 tiêu chí kỹ thuật và trải nghiệm người dùng giữa hai hệ thống:")

    tbl_comp = doc.add_table(rows=9, cols=3)
    tbl_comp.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_comp, color="CBD5E1", sz="4")
    
    comp_headers = ["Tiêu Chí Đối Chiếu", "Hệ Thống EduX Truyền Thống", "Giải Pháp Đột Phá 3TG All-in-1"]
    for c_idx, h_text in enumerate(comp_headers):
        cell = tbl_comp.cell(0, c_idx)
        set_cell_background(cell, NAVY_HEX)
        set_cell_margins(cell, top=140, bottom=140, left=140, right=140)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx > 0 else WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(h_text)
        run.bold = True
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        run.font.size = Pt(10)

    comp_data = [
        ("1. Triết lý Giao diện (UI/UX)", "Dạng danh sách tệp tin tĩnh, khô khan, màu sắc hành chính đơn điệu.", "Gamification hiện đại tông Pastel hồng Duolingo, thẻ bài học sinh động, hiệu ứng chuyển cảnh mượt mà."),
        ("2. Động lực học tập", "Không có cơ chế kích thích, học đối phó khi gần kỳ thi.", "Hệ thống Chuỗi học liên tiếp (Streak), Điểm XP, Đá quý (Gems), Trái tim (Hearts), Bảng xếp hạng tuần Bronze/Silver/Gold."),
        ("3. Linh vật đồng hành (Mascot)", "Không có linh vật, giao diện vô cảm.", "Linh vật 'Giáo sư Thỏ Bảy Màu' luôn tương tác, biểu cảm đa dạng, cổ vũ tinh thần học tập 24/7."),
        ("4. Phạm vi học liệu (Courseware)", "Các môn học rời rạc, khó theo dõi tiến độ tổng thể.", "Tích hợp sẵn sàng 10+ môn học đại học thực tế (106 chương, 4.094 bài học, 29.460 câu trắc nghiệm)."),
        ("5. Ghi chú tích hợp (Notes)", "Không có; sinh viên phải tự ghi chép bằng ứng dụng bên ngoài.", "Tích hợp sẵn mục 'Cẩm nang' (Notes) ngay tại từng Cửa Ải, tóm lược kiến thức trọng tâm bài học."),
        ("6. Xử lý câu hỏi làm sai", "Chỉ xem điểm tổng quát, không có hệ thống lưu vết câu sai.", "Hệ thống 'Ôn câu sai' chuyên biệt (Mistakes Engine), tự động lưu vết và phân loại mức độ thuần thục."),
        ("7. Trợ giảng Trí tuệ Nhân tạo", "Không có công cụ hỗ trợ thông minh.", "Trợ giảng 'Hỏi 3TG AI' phân tích chi tiết từng bước, định dạng công thức toán học và chọn đúng môn học."),
        ("8. Hạ tầng & Tốc độ", "Máy chủ tập trung truyền thống, dễ nghẽn mạng khi thi cử.", "Kiến trúc Serverless Edge Computing (Cloudflare D1 & R2), độ trễ cực thấp (<50ms), đồng bộ dữ liệu thời gian thực.")
    ]

    tbl_comp.columns[0].width = Inches(1.8)
    tbl_comp.columns[1].width = Inches(2.4)
    tbl_comp.columns[2].width = Inches(2.6)

    for r_idx, row in enumerate(comp_data):
        bg = BG_LIGHT_HEX if r_idx % 2 == 1 else "FFFFFF"
        for c_idx in range(3):
            cell = tbl_comp.cell(r_idx + 1, c_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(row[c_idx])
            run.font.size = Pt(9.5)
            if c_idx == 0:
                run.bold = True
                run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
            elif c_idx == 1:
                run.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)
            else:
                run.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    add_h2("1.4. Năm trụ cột cốt lõi tạo nên sức mạnh của 3TG")
    add_bullet("Trụ cột 1 – Gamification chuẩn hóa Duolingo: ", "Mỗi chương học là một 'Cửa Ải'. Hoàn thành bài học giúp tích lũy điểm kinh nghiệm (XP), nhận Đá quý (Gems), duy trì ngọn lửa Chuỗi ngày học liên tục (Streak) và thăng hạng trên Bảng xếp hạng tuần (Bronze, Silver, Gold, Diamond).")
    add_bullet("Trụ cột 2 – Linh vật Mascot 'Giáo sư Thỏ Bảy Màu': ", "Được thiết kế dựa trên hình tượng nhân vật hoạt hình quen thuộc với giới trẻ Việt Nam, mang phong cách trí thức hài hước (đeo kính, cầm sách, thắt nơ cổ), liên tục xuất hiện ở các vị trí chiến lược trên màn hình để đưa ra lời khuyên và giảm bớt căng thẳng thi cử.")
    add_bullet("Trụ cột 3 – Tính năng All-in-1 cho 10+ Môn học Đại học: ", "Tích hợp sẵn sàng hệ thống học liệu của 10 môn chuyên ngành CNTT (Công nghệ phần mềm - K4, Cấu trúc dữ liệu & Giải thuật, Cơ sở dữ liệu, Toán rời rạc, Pháp lý & Đạo đức nghề nghiệp...). Mỗi ải đều có Cẩm nang (Notes) tóm tắt, mục Ôn câu sai và Túi đồ vật phẩm.")
    add_bullet("Trụ cột 4 – Trợ giảng 'Hỏi 3TG AI' Bảo mật Cục bộ (Local AI): ", "Nhằm bảo vệ dữ liệu giáo trình nội bộ của nhà trường, phân hệ Trợ giảng AI được triển khai và huấn luyện trên máy chủ trạm cục bộ cấu hình cao (GPU NVIDIA GeForce RTX 5060 Ti 16GB, CPU Intel Core i5 14600KF, 32GB RAM DDR5). AI cho phép chọn chính xác ngữ cảnh môn học đang học để giải thích bài tập từng bước, viết công thức toán học và chữa lỗi lập trình mà tuyệt đối không rò rỉ dữ liệu ra bên ngoài.")
    add_bullet("Trụ cột 5 – Hạ tầng Đám mây Biên Cloudflare D1 & R2: ", "Sử dụng cơ sở dữ liệu phân tán Cloudflare D1 (SQLite tại Edge) kết hợp lưu trữ đối tượng Cloudflare R2, đảm bảo ứng dụng có thể chịu tải hàng nghìn sinh viên truy cập đồng thời với độ trễ phản hồi dưới 50ms.")

    doc.add_page_break()

    # ==========================================
    # PHẦN 2: MỤC TIÊU SPRINT 1
    # ==========================================
    add_h1("PHẦN 2: MỤC TIÊU SPRINT 1 (SPRINT GOAL)")
    
    add_h2("2.1. Tuyên bố mục tiêu Sprint 1 (Sprint Goal Statement)")
    p = doc.add_paragraph()
    p.add_run(
        "Mục tiêu cốt lõi của Sprint 1 trong dự án xây dựng ứng dụng 3TG được đội ngũ Scrum xác định rõ ràng như sau:\n"
    )
    add_callout(
        "Sprint 1 Goal",
        "\"Hoàn thiện toàn bộ khung kiến trúc cơ sở dữ liệu quan hệ Cloudflare D1 (18 bảng chuẩn hóa), "
        "kết nối thành công trạm Trợ giảng Local AI bảo mật trên GPU RTX 5060 Ti, "
        "và phát triển giao diện Gamification hoàn chỉnh sẵn sàng cho 3 phân hệ cốt lõi: "
        "Lộ trình học vượt ải kèm Cẩm nang, Hồ sơ học viên cá nhân hóa, và khung hội thoại Trợ giảng Hỏi 3TG AI theo môn học.\""
    )

    add_h2("2.2. Khung thời gian và nhịp độ Scrum (Scrum Cadence)")
    add_bullet("Thời gian thực hiện (Sprint Duration): ", "02 tuần làm việc liên tục (từ ngày 05/10/2026 đến ngày 18/10/2026).")
    add_bullet("Sprint Planning (Lập kế hoạch): ", "Tổ chức ngày 05/10/2026: Phân tích Product Backlog, làm rõ User Stories, ước lượng Story Points theo chuỗi Fibonacci và cam kết Sprint Backlog.")
    add_bullet("Daily Scrum (Họp hàng ngày): ", "Diễn ra 15 phút mỗi sáng (09:00 AM) qua kênh trao đổi nội bộ nhằm trả lời 3 câu hỏi kinh điển: Hôm qua đã làm gì? Hôm nay sẽ làm gì? Có gặp khó khăn/rào cản (impediments) gì không?")
    add_bullet("Sprint Review (Nghiệm thu bản dựng): ", "Tổ chức ngày 18/10/2026: Trình diễn trực tiếp bản dựng Increment chạy thực tế trên Cloudflare Worker và máy chủ Local AI trước toàn bộ thành viên.")
    add_bullet("Sprint Retrospective (Họp cải tiến): ", "Tổ chức chiều ngày 18/10/2026: Đánh giá quy trình làm việc, phân tích bài học kinh nghiệm và đưa ra kế hoạch hành động cụ thể cho Sprint 2.")

    add_h2("2.3. Định nghĩa Hoàn thành (Definition of Done - DoD)")
    p = doc.add_paragraph()
    p.add_run("Mỗi hạng mục công việc (User Story) trong Sprint 1 chỉ được đánh giá là 100% DONE khi đáp ứng đầy đủ các tiêu chuẩn khắt khe sau:")
    add_bullet("1. Tiêu chuẩn Mã nguồn (Code Quality): ", "Mã nguồn được viết theo chuẩn ES6+ / Modular JavaScript, tuân thủ Clean Code, không có lỗi linter (ESLint check pass), không hardcode mã bí mật (secrets/tokens) trong file công khai.")
    add_bullet("2. Tiêu chuẩn Cơ sở dữ liệu (Data Integrity): ", "Bảng dữ liệu Cloudflare D1 được chuẩn hóa theo dạng chuẩn 3NF, có khóa chính (PK), khóa ngoại (FK) ràng buộc toàn vẹn dữ liệu, hỗ trợ đồng bộ dữ liệu thời gian thực.")
    add_bullet("3. Tiêu chuẩn Kiểm thử (Testing & QA): ", "Vượt qua kiểm thử đơn vị (Unit Tests) và kiểm thử tích hợp (Integration Tests) với tỷ lệ lỗi nghiêm trọng (Critical Bugs) bằng 0.")
    add_bullet("4. Tiêu chuẩn Trải nghiệm (UI/UX Responsiveness): ", "Giao diện hoạt động trơn tru trên trình duyệt máy tính và máy tính bảng, tương thích các kích thước màn hình phổ biến (FHD 1920x1080, HD 1366x768).")
    add_bullet("5. Tiêu chuẩn Triển khai (Deployment): ", "Mã nguồn được commit sạch sẽ trên Git repository GitHub (nhánh main) và triển khai tự động qua Cloudflare Wrangler.")

    doc.add_page_break()

    # ==========================================
    # PHẦN 3: PHÂN CÔNG VAI TRÒ VÀ TRÁCH NHIỆM
    # ==========================================
    add_h1("PHẦN 3: BẢNG PHÂN CÔNG VAI TRÒ & TRÁCH NHIỆM CHI TIẾT")

    add_h2("3.1. Cơ cấu đội ngũ Scrum dự án 3TG")
    p = doc.add_paragraph()
    p.add_run(
        "Nhóm thực hiện dự án gồm 3 thành viên, được tổ chức theo mô hình Agile Scrum chuyên nghiệp, "
        "phân công vai trò rõ ràng dựa trên thế mạnh kỹ thuật chuyên sâu của từng cá nhân:"
    )

    tbl_team = doc.add_table(rows=4, cols=4)
    tbl_team.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_team, color="CBD5E1", sz="4")
    
    team_headers = ["Thành Viên", "Vai Trò Scrum", "Chuyên Môn Kỹ Thuật", "Phạm Vi Phụ Trách Chính"]
    for c_idx, h_text in enumerate(team_headers):
        cell = tbl_team.cell(0, c_idx)
        set_cell_background(cell, NAVY_HEX)
        set_cell_margins(cell, top=140, bottom=140, left=140, right=140)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx < 3 else WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(h_text)
        run.bold = True
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        run.font.size = Pt(10)

    team_data = [
        ("Lê Văn An", "Scrum Master (SM) / Team Lead", "AI & Cloud Solutions Architect", "Điều phối các sự kiện Scrum; thiết kế kiến trúc hệ thống Client-Worker-Cloudflare D1; tích hợp luồng Trợ giảng 'Hỏi 3TG AI' (Local AI GPU RTX 5060 Ti); xây dựng phân hệ Hồ sơ học viên & cơ chế bảo mật secrets."),
        ("Nguyễn Như Quỳnh", "Product Owner (PO)", "Lead UI/UX & Frontend Developer", "Nghiên cứu hạn chế EduX; xây dựng Product Backlog; thiết kế Design System Gamification chuẩn Duolingo; sáng tạo bộ linh vật Mascot 'Giáo sư Thỏ Bảy Màu'; lập trình giao diện Lộ trình vượt ải, Cẩm nang (Notes) và Thành tích."),
        ("Nguyễn Văn Tú", "Development Team Member", "Database Engineer, Backend & QA/Tester", "Thiết kế sơ đồ quan hệ thực thể ERD chi tiết (18 bảng); khởi tạo và tối ưu hóa D1 Database; lập trình thuật toán tính XP, Streak, Đá quý, Trái tim, Ôn câu sai; thiết kế kịch bản test và đóng gói tài liệu nghiệm thu.")
    ]

    tbl_team.columns[0].width = Inches(1.3)
    tbl_team.columns[1].width = Inches(1.6)
    tbl_team.columns[2].width = Inches(1.8)
    tbl_team.columns[3].width = Inches(2.1)

    for r_idx, row in enumerate(team_data):
        bg = BG_LIGHT_HEX if r_idx % 2 == 1 else "FFFFFF"
        for c_idx in range(4):
            cell = tbl_team.cell(r_idx + 1, c_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(row[c_idx])
            run.font.size = Pt(9.5)
            if c_idx == 0:
                run.bold = True
                run.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
            elif c_idx == 1:
                run.bold = True
                run.font.color.rgb = RGBColor(0xDB, 0x27, 0x77)
            else:
                run.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_h2("3.2. Ma trận phân công trách nhiệm chi tiết (RACI Matrix)")
    p = doc.add_paragraph()
    p.add_run("Quy chuẩn RACI: R (Responsible - Người thực hiện chính), A (Accountable - Người chịu trách nhiệm giải trình), C (Consulted - Người được tham vấn ý kiến), I (Informed - Người nhận thông tin kết quả).")

    tbl_raci = doc.add_table(rows=8, cols=4)
    tbl_raci.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_raci, color="CBD5E1", sz="4")

    raci_headers = ["Hạng Mục Công Việc Sprint 1", "Lê Văn An (SM/Arch)", "Nguyễn Như Quỳnh (PO/FE)", "Nguyễn Văn Tú (DB/BE/QA)"]
    for c_idx, h_text in enumerate(raci_headers):
        cell = tbl_raci.cell(0, c_idx)
        set_cell_background(cell, NAVY_HEX)
        set_cell_margins(cell, top=140, bottom=140, left=140, right=140)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx > 0 else WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(h_text)
        run.bold = True
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        run.font.size = Pt(10)

    raci_rows = [
        ("Khảo sát người dùng, phân tích EduX và lập Product Backlog", "C", "A / R", "C"),
        ("Thiết kế Sơ đồ quan hệ thực thể ERD (erd.pdf)", "C", "I", "A / R"),
        ("Khởi tạo và cấu hình cơ sở dữ liệu Cloudflare D1 (18 bảng)", "A", "I", "R"),
        ("Thiết kế Design System Gamification & Mascot Thỏ Bảy Màu", "I", "A / R", "C"),
        ("Lập trình giao diện Lộ trình vượt ải & Cẩm nang (Notes)", "C", "A / R", "C"),
        ("Lập trình phân hệ Hồ sơ học viên & Đồng bộ chỉ số Gamification", "A / R", "C", "R"),
        ("Tích hợp luồng Trợ giảng 'Hỏi 3TG AI' trên Local GPU RTX 5060 Ti", "A / R", "C", "I")
    ]

    tbl_raci.columns[0].width = Inches(3.2)
    tbl_raci.columns[1].width = Inches(1.2)
    tbl_raci.columns[2].width = Inches(1.2)
    tbl_raci.columns[3].width = Inches(1.2)

    for r_idx, row in enumerate(raci_rows):
        bg = BG_LIGHT_HEX if r_idx % 2 == 1 else "FFFFFF"
        for c_idx in range(4):
            cell = tbl_raci.cell(r_idx + 1, c_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=90, bottom=90, left=100, right=100)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx > 0 else WD_ALIGN_PARAGRAPH.LEFT
            run = p.add_run(row[c_idx])
            run.font.size = Pt(9.5)
            if c_idx == 0:
                run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
            else:
                run.bold = True
                run.font.color.rgb = RGBColor(0xDB, 0x27, 0x77) if "R" in row[c_idx] else RGBColor(0x4B, 0x55, 0x63)

    doc.add_page_break()

    # ==========================================
    # PHẦN 4: BẢNG SPRINT 1 BACKLOG
    # ==========================================
    add_h1("PHẦN 4: BẢNG SPRINT 1 BACKLOG & KẾT QUẢ THỰC HIỆN")
    
    add_h2("4.1. Tổng quan kế hoạch Sprint 1 Backlog")
    p = doc.add_paragraph()
    p.add_run(
        "Trong buổi họp Sprint Planning, nhóm đã phân tích và phân rã các yêu cầu người dùng thành 08 User Stories cốt lõi. "
        "Tổng số Story Points cam kết là "
    )
    r_sp = p.add_run("55 Story Points")
    r_sp.bold = True
    p.add_run(". Đến cuối Sprint 1 (ngày 18/10/2026), toàn bộ 8/8 User Stories đã được thực hiện, kiểm thử và nghiệm thu thành công, "
              "đạt tỷ lệ hoàn thành ")
    r_done = p.add_run("100% DONE")
    r_done.bold = True
    r_done.font.color.rgb = RGBColor(0x16, 0xA3, 0x4A) # Green
    p.add_run(".")

    add_h2("4.2. Bảng chi tiết User Stories & Trạng thái nghiệm thu")

    tbl_sprint = doc.add_table(rows=9, cols=5)
    tbl_sprint.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_sprint, color="CBD5E1", sz="4")

    sprint_headers = ["Mã US", "Tên Hạng Mục Công Việc (User Story)", "Người Phụ Trách", "Story Points", "Trạng Thái"]
    for c_idx, h_text in enumerate(sprint_headers):
        cell = tbl_sprint.cell(0, c_idx)
        set_cell_background(cell, NAVY_HEX)
        set_cell_margins(cell, top=140, bottom=140, left=140, right=140)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx in [0, 3, 4] else WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(h_text)
        run.bold = True
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        run.font.size = Pt(10)

    sprint_data = [
        ("US-01", "Thiết kế Sơ đồ quan hệ thực thể ERD 18 bảng chuẩn hóa (erd.pdf)", "Nguyễn Văn Tú", "8 SP", "100% DONE"),
        ("US-02", "Khởi tạo & cấu hình cơ sở dữ liệu Cloudflare D1 (app-study-db)", "Nguyễn Văn Tú, Lê Văn An", "5 SP", "100% DONE"),
        ("US-03", "Thiết kế Design System Gamification & bộ Mascot Giáo sư Thỏ Bảy Màu", "Nguyễn Như Quỳnh", "8 SP", "100% DONE"),
        ("US-04", "Xây dựng giao diện Lộ trình học vượt ải & tích hợp Cẩm nang (Notes)", "Nguyễn Như Quỳnh", "8 SP", "100% DONE"),
        ("US-05", "Xây dựng phân hệ Hồ sơ học viên (@anniehatani), Tủ huy hiệu & Túi đồ", "Lê Văn An", "5 SP", "100% DONE"),
        ("US-06", "Lập trình thuật toán đồng bộ chỉ số: XP, Streak, Đá quý, Trái tim", "Nguyễn Văn Tú, Lê Văn An", "5 SP", "100% DONE"),
        ("US-07", "Triển khai & tích hợp Trợ giảng 'Hỏi 3TG AI' trên trạm GPU RTX 5060 Ti", "Lê Văn An", "13 SP", "100% DONE"),
        ("US-08", "Kiểm thử tích hợp hệ thống (Integration Test) & Đóng gói sản phẩm", "Nguyễn Văn Tú, Cả nhóm", "3 SP", "100% DONE")
    ]

    tbl_sprint.columns[0].width = Inches(0.9)
    tbl_sprint.columns[1].width = Inches(3.1)
    tbl_sprint.columns[2].width = Inches(1.3)
    tbl_sprint.columns[3].width = Inches(0.7)
    tbl_sprint.columns[4].width = Inches(0.8)

    for r_idx, row in enumerate(sprint_data):
        bg = BG_LIGHT_HEX if r_idx % 2 == 1 else "FFFFFF"
        for c_idx in range(5):
            cell = tbl_sprint.cell(r_idx + 1, c_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=90, bottom=90, left=100, right=100)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            if c_idx in [0, 3, 4]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            
            run = p.add_run(row[c_idx])
            run.font.size = Pt(9)
            if c_idx == 0:
                run.bold = True
                run.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
            elif c_idx == 4:
                run.bold = True
                run.font.color.rgb = RGBColor(0x16, 0xA3, 0x4A) # Green status
            else:
                run.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    add_callout(
        "Đánh giá Hiệu suất Sprint 1 (Sprint Velocity)",
        "Đội ngũ đã hoàn thành trọn vẹn 55/55 Story Points cam kết, đạt tỷ lệ velocity lý tưởng là 100%. "
        "Không có bất kỳ User Story nào bị trễ hạn hay phải kéo dài sang Sprint 2."
    )

    doc.add_page_break()

    # ==========================================
    # PHẦN 5: MÔ TẢ CHI TIẾT SẢN PHẨM BÀN GIAO (INCREMENT)
    # ==========================================
    add_h1("PHẦN 5: MÔ TẢ CHI TIẾT CÁC SẢN PHẨM BÀN GIAO (INCREMENT)")
    p = doc.add_paragraph()
    p.add_run(
        "Trong Sprint 1, nhóm đã hoàn thành toàn diện 4 sản phẩm bàn giao kỹ thuật lớn (Deliverables / Increments). "
        "Dưới đây là mô tả kiến trúc, phân tích chức năng và hình ảnh chụp màn hình thực tế từ hệ thống:"
    )

    # ------------------------------------------
    # 5.1. Sơ đồ ERD & Kiến trúc Cloudflare D1 + Local AI
    # ------------------------------------------
    add_h2("5.1. Thiết kế Cơ sở dữ liệu ERD & Kiến trúc Cloudflare D1 + Local AI")
    p = doc.add_paragraph()
    p.add_run(
        "Để đáp ứng yêu cầu xử lý dữ liệu thực tế khổng lồ từ 10 môn học chính khóa của Đại học CMC "
        "(106 chương, 4.094 slide bài học và 29.460 câu trắc nghiệm), nhóm đã thiết kế Sơ đồ quan hệ thực thể (ERD) "
        "gồm 18 bảng dữ liệu quan hệ chặt chẽ. Hệ thống cơ sở dữ liệu được triển khai trực tiếp trên Cloudflare D1 "
        "(tên database: app-study-db), đảm bảo tính sẵn sàng cao và tốc độ truy vấn tức thời tại các điểm mạng biên (Edge)."
    )

    add_figure(erd_img, "Hình 1: Sơ đồ quan hệ thực thể (ERD) chi tiết gồm 18 bảng chuẩn hóa trên Cloudflare D1", width_inch=6.4)

    p_erd_desc = doc.add_paragraph()
    p_erd_desc.add_run(
        "Kiến trúc cơ sở dữ liệu được phân chia thành 5 nhóm bảng chức năng rõ rệt:\n"
    )
    add_bullet("1. Nhóm Học tập cốt lõi (Core Learning Tables): ", "Bao gồm subjects (thông tin 10 môn học chính thức), units (106 chương học phân cấp), lessons (4.094 trang bài học slide với phần thưởng 10 XP/bài) và questions (29.460 câu hỏi trắc nghiệm tương tác thật kèm mảng JSON 4 đáp án và lời giải chi tiết).")
    add_bullet("2. Nhóm Tài khoản & Tiến độ (User Accounts & Progress): ", "Bao gồm accounts (xác thực sinh viên), profiles (hồ sơ học viên trường CMCU) và user_progress (ghi nhận trạng thái hoàn thành bài học, điểm số và thời gian completed_at).")
    add_bullet("3. Nhóm Chuỗi học & Ôn luyện (Streak Engine & Review): ", "Bao gồm user_stats (tổng XP, chuỗi ngày streak hiện tại, kỷ lục streak, 5 trái tim, số đá quý gems), user_streak_history (nhật ký điểm danh từng ngày: completed, freeze_used, missed) và user_mistakes (kho lưu trữ câu hỏi làm sai để sinh viên ôn tập có trọng tâm).")
    add_bullet("4. Nhóm Gamification & Bảng xếp hạng: ", "Bao gồm shop_items (danh mục vật phẩm hồi tim, bảo vệ chuỗi), user_inventory (túi đồ sở hữu của học viên), weekly_leaderboards (giải đấu bảng tuần: Đồng, Bạc, Vàng, Kim Cương) và achievements, user_achievements (bộ huy hiệu thành tích vinh danh học viên).")
    add_bullet("5. Nhóm Dữ liệu toàn văn thuần (Plain Text RAG Engine): ", "Bảng subject_data lưu trữ 10 bản ghi văn bản thuần túy của 10 môn (~10.7 triệu ký tự) đóng vai trò làm kho tri thức nền tảng để cung cấp ngữ cảnh (RAG Context) cho Trợ giảng AI.")

    add_callout(
        "Kiến trúc Hạ tầng Local AI Bảo mật Cao",
        "Trạm Trợ giảng AI được xây dựng trên máy chủ trạm cục bộ trang bị GPU NVIDIA GeForce RTX 5060 Ti 16GB VRAM, "
        "CPU Intel Core i5 14600KF (14 nhân, 20 luồng), và 32GB RAM DDR5. Mô hình tiếp nhận ngữ cảnh môn học từ Cloudflare D1, "
        "thực hiện suy luận ngôn ngữ tự nhiên và sinh công thức toán học/lời giải từng bước với độ trễ thấp, "
        "đảm bảo toàn bộ tri thức bài giảng của trường được bảo mật 100% trong mạng nội bộ."
    )

    doc.add_page_break()

    # ------------------------------------------
    # 5.2. Phân hệ Lộ trình học vượt ải & Cẩm nang (Notes)
    # ------------------------------------------
    add_h2("5.2. Phân hệ Lộ trình học vượt ải & Cẩm nang (Notes)")
    p = doc.add_paragraph()
    p.add_run(
        "Phân hệ Lộ trình học vượt ải là màn hình trung tâm của ứng dụng 3TG. Thay vì giao diện danh sách EduX truyền thống, "
        "chương trình học được chia thành các 'Cửa Ải' nối tiếp nhau. Học viên phải hoàn thành các bài học trong từng ải "
        "để mở khóa ải tiếp theo, tạo cảm giác chinh phục thử thách như trong một tựa game nhập vai giáo dục."
    )

    add_figure(ss1_img, "Hình 2: Giao diện phân hệ Lộ trình học vượt ải và Cẩm nang (Notes) môn Kỹ năng mềm & Tư duy khởi nghiệp", width_inch=6.2)

    p_ss1_desc = doc.add_paragraph()
    p_ss1_desc.add_run("Các điểm nhấn thiết kế và tính năng nổi bật trên màn hình Hình 2:\n")
    add_bullet("Bộ điều hướng Cửa Ải trực quan: ", "Hiển thị thanh trượt 'Ải 1, Ải 2, Ải 3, Ải 4, Ải 5, Ải 6...' tương ứng với các chương học. Ải đang học được làm nổi bật với tông hồng cánh sen rực rỡ.")
    add_bullet("Thẻ bài học & Tiến độ thời gian thực: ", "Card thông tin 'CỬA ẢI 1 / 10 • ĐANG CHINH PHỤC CỬA ẢI - 01. Bài 1: Tự nhận thức bản thân' kèm thanh tiến độ hiển thị phần trăm hoàn thành bài học (ví dụ: Đã hoàn thành 1 / 29 bài học - 3%).")
    add_bullet("Tích hợp nút Cẩm nang (Notes): ", "Ngay trên thẻ bài học, nút 'Cẩm nang' màu hồng cho phép sinh viên mở nhanh bản tóm tắt lý thuyết cốt lõi, sơ đồ tư duy và công thức của ải đó mà không phải rời khỏi màn hình học tập.")
    add_bullet("Thanh chỉ số Gamification trên Topbar: ", "Đồng bộ thời gian thực 4 chỉ số: Chuỗi ngày học liên tiếp (Streak: 1 ngày), Đá quý tích lũy (Gems: 67), Trái tim học tập (Hearts: vô cực hoặc 5 tim), và Tổng điểm kinh nghiệm (15 XP).")
    add_bullet("Sự hiện diện của Mascot 'Giáo sư Thỏ Bảy Màu': ", "Linh vật Thỏ Bảy Màu đứng ở trung tâm và góc phải màn hình, chủ động tương tác với lời thoại: 'Cố lên bạn ơi! Chinh phục từng bài học nhé! 🙌✨' và 'Hôm nay bạn muốn học môn gì nào? Cùng chiến nhé! 🌸', tạo không khí học tập vô cùng thân thiện.")

    doc.add_page_break()

    # ------------------------------------------
    # 5.3. Phân hệ Hồ sơ học viên & Gamification
    # ------------------------------------------
    add_h2("5.3. Phân hệ Hồ sơ học viên (@anniehatani), Tủ huy hiệu, Túi đồ & Chỉ số Gamification")
    p = doc.add_paragraph()
    p.add_run(
        "Phân hệ Hồ sơ học viên đóng vai trò là không gian cá nhân hóa của sinh viên. Tại đây, mọi thành tích học tập, "
        "chỉ số phấn đấu và đồ đạc tích lũy trong quá trình học tập đều được thống kê một cách khoa học, đẹp mắt."
    )

    add_figure(ss2_img, "Hình 3: Giao diện Hồ sơ học viên Lê Văn An (@anniehatani) cùng bộ tứ chỉ số Gamification", width_inch=6.2)

    p_ss2_desc = doc.add_paragraph()
    p_ss2_desc.add_run("Các thành phần chức năng chi tiết thể hiện tại Hình 3:\n")
    add_bullet("Banner cá nhân & Ảnh đại diện Avatar: ", "Hỗ trợ tùy biến ảnh bìa gradient hồng tím hiện đại và ảnh đại diện tròn có nút đổi camera nhanh. Tên sinh viên hiển thị trang trọng kèm biểu tượng hoa đào: Lê Văn An 🌸, username định danh @anniehatani.")
    add_bullet("Thẻ Giới thiệu học viên chính thức: ", "Trích xuất trực tiếp thông tin trường học: 'Trường: Đại học CMC', chuyên ngành đào tạo: 'Chuyên ngành: Trí tuệ nhân tạo', Hạng giải đấu tuần: 'Bronze', Số bài học đã vượt: '1 bài', và Ngày tham gia hệ thống: '2026-10-12'.")
    add_bullet("Hệ thống Lưới 4 Chỉ số Gamification Trọng tâm: ", "Bố trí 4 khối số liệu nổi bật: (1) 15 TỔNG ĐIỂM XP; (2) 1 ngày CHUỖI NGÀY HỌC (Streak); (3) 67 ĐÁ QUÝ TÍCH LŨY (Gems); (4) 999 / 5 TRÁI TIM HỌC TẬP (Hearts).")
    add_bullet("Hệ thống Tab chức năng chuyên biệt: ", "Gồm 3 tab chuyển đổi mượt mà: 'Giới thiệu & Chỉ số', 'Tủ huy hiệu (0)' (nơi trưng bày huy hiệu khi đạt mốc học tập) và 'Túi đồ (0)' (nơi lưu trữ vật phẩm mua từ cửa hàng như Streak Freeze).")
    add_bullet("Linh vật Mascot tương tác tận tâm: ", "Giáo sư Thỏ Bảy Màu trong trang phục phục vụ dễ thương chào đón ở góc phải màn hình: 'Kính chào chủ nhân! Hôm nay người muốn học bài nào ạ? 🎀🧹'.")

    doc.add_page_break()

    # ------------------------------------------
    # 5.4. Phân hệ Trợ giảng "Hỏi 3TG AI" theo môn học
    # ------------------------------------------
    add_h2("5.4. Phân hệ Trợ giảng \"Hỏi 3TG AI\" chọn ngữ cảnh theo từng môn học")
    p = doc.add_paragraph()
    p.add_run(
        "Phân hệ Trợ giảng \"Hỏi 3TG AI\" là bước đột phá công nghệ lớn nhất trong Sprint 1. "
        "Khác với các chatbot AI thông thường chỉ trả lời chung chung, Trợ giảng 3TG AI được thiết kế "
        "đặc thù cho sinh viên đại học với khả năng chuyển đổi ngữ cảnh chuyên sâu theo từng môn học cụ thể."
    )

    add_figure(ss3_img, "Hình 4: Giao diện Trợ giảng 'Hỏi 3TG AI' với menu chọn ngữ cảnh 10 môn học chính khóa Đại học CMC", width_inch=6.2)

    p_ss3_desc = doc.add_paragraph()
    p_ss3_desc.add_run("Các đặc điểm công nghệ vượt trội của phân hệ Hỏi 3TG AI:\n")
    add_bullet("Trình đơn thả chọn môn học động (Dynamic Subject Dropdown): ", "Học viên có thể linh hoạt chọn ngữ cảnh môn học đang cần hỗ trợ từ danh sách 10 môn học đại học thực tế: Kỹ năng mềm và tư duy khởi nghiệp, Cấu trúc dữ liệu và giải thuật, Cơ sở dữ liệu, Công nghệ phần mềm - K4, Nhập môn CNTT, Pháp lý và Đạo đức nghề nghiệp, Toán rời rạc, Cơ sở lập trình...")
    add_bullet("Cơ chế nạp tri thức ngữ cảnh chuẩn xác (RAG Pipeline): ", "Khi người dùng chọn một môn học và đặt câu hỏi, hệ thống tự động liên kết với dữ liệu bài giảng môn đó trong bảng subject_data trên Cloudflare D1 để làm phong phú ngữ cảnh (Prompt Augmentation) cho mô hình AI cục bộ.")
    add_bullet("Giải thích chi tiết từng bước & Định dạng toán học: ", "Trợ giảng được thiết lập system prompt sư phạm: Không đưa ngay đáp án cụt lủn mà hướng dẫn phương pháp tư duy, phân tích từng bước (step-by-step) và định dạng công thức toán học/thuật toán rõ ràng.")
    add_bullet("Giao diện trò chuyện tối ưu hóa trải nghiệm: ", "Khung input chat 'Hỏi 3TG AI bất cứ câu hỏi nào...' kết hợp nút 'GỬI ➔' màu hồng nổi bật. Mascot Giáo sư Thỏ đeo kính thông thái cầm sách cổ vũ: 'Để giáo sư Thỏ giảng giải công thức từng bước cho bạn nghe! 🎓📖'.")

    doc.add_page_break()

    # ==========================================
    # PHẦN 6: BÁO CÁO SPRINT REVIEW & RETROSPECTIVE
    # ==========================================
    add_h1("PHẦN 6: BÁO CÁO SPRINT REVIEW & SPRINT RETROSPECTIVE")

    add_h2("6.1. Báo cáo nghiệm thu Sprint Review")
    p = doc.add_paragraph()
    p.add_run(
        "Vào ngày 18/10/2026, nhóm đã tổ chức phiên họp Sprint Review chính thức. Toàn bộ 4 phân hệ sản phẩm bàn giao "
        "đã được trình diễn trực tiếp (Live Demo) trên môi trường thử nghiệm. Kết quả nghiệm thu đạt 100% tiêu chí đề ra:"
    )
    add_bullet("Nghiệm thu Cơ sở dữ liệu: ", "18 bảng dữ liệu trên Cloudflare D1 được khởi tạo hoàn chỉnh, thực hiện thành công các truy vấn phức tạp (JOIN giữa subjects, units, lessons và user_stats) với thời gian thực thi dưới 15ms.")
    add_bullet("Nghiệm thu Giao diện người dùng: ", "Giao diện Gamification vận hành mượt mà, chuyển trang không có độ trễ, hình ảnh và biểu tượng hiển thị sắc nét trên cả màn hình desktop và tablet.")
    add_bullet("Nghiệm thu Trợ giảng AI: ", "Trợ giảng kết nối ổn định với GPU RTX 5060 Ti cục bộ, phản hồi câu hỏi bài tập môn Công nghệ phần mềm và Kỹ năng mềm trong vòng 1.5 – 3 giây, công thức toán học và giải thích sư phạm đạt độ chính xác cao.")

    add_h2("6.2. Báo cáo họp cải tiến quy trình Sprint Retrospective")
    p = doc.add_paragraph()
    p.add_run(
        "Ngay sau phiên Sprint Review, nhóm đã tổ chức cuộc họp Sprint Retrospective theo mô hình cải tiến liên tục Scrum "
        "(Continuous Improvement), phân tích 3 khía cạnh trọng tâm:"
    )

    # Bảng Retrospective
    tbl_retro = doc.add_table(rows=4, cols=3)
    tbl_retro.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_retro, color="CBD5E1", sz="4")

    retro_headers = ["Điểm Làm Rất Tốt (What Went Well)", "Khó Khăn Gặp Phải (What Could Be Improved)", "Giải Pháp Đã Khắc Phục (Solutions Applied)"]
    for c_idx, h_text in enumerate(retro_headers):
        cell = tbl_retro.cell(0, c_idx)
        set_cell_background(cell, NAVY_HEX)
        set_cell_margins(cell, top=140, bottom=140, left=140, right=140)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(h_text)
        run.bold = True
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        run.font.size = Pt(10)

    retro_data = [
        ("Tinh thần phối hợp nhịp nhàng giữa 3 vai trò (Scrum Master, Product Owner, Dev/QA); các buổi Daily Scrum diễn ra ngắn gọn, đúng trọng tâm.",
         "Ban đầu có sự lệch múi giờ khi tính toán Chuỗi ngày học liên tiếp (Streak Engine) giữa UTC của máy chủ và UTC+7 của Việt Nam.",
         "Đã chuẩn hóa toàn bộ hàm tính toán ngày sang múi giờ chuẩn Asia/Ho_Chi_Minh trong file Worker backend (Intl.DateTimeFormat)."),
        ("Áp dụng công nghệ điện toán đám mây biên Cloudflare D1/R2 giúp tốc độ tải ứng dụng cực nhanh và chi phí vận hành bằng 0.",
         "Tải lượng bộ nhớ VRAM khi xử lý các tài liệu giáo trình dài trên mô hình Local AI.",
         "Cấu hình phân đoạn văn bản (chunking) hợp lý, tối ưu hóa context window 4096 tokens để đạt tốc độ sinh chữ nhanh nhất trên GPU RTX 5060 Ti."),
        ("Dữ liệu học tập là 100% dữ liệu thực tế từ 10 môn học chính khóa Đại học CMC (29.460 câu trắc nghiệm), tính chân thực và ứng dụng rất cao.",
         "Việc bảo mật các khóa API Cloudflare và AI khi commit mã nguồn lên GitHub.",
         "Đưa toàn bộ token và biến môi trường nhạy cảm vào .env và .dev.vars, cấu hình .gitignore chuẩn hóa, tạo file mẫu .env.example.")
    ]

    tbl_retro.columns[0].width = Inches(2.2)
    tbl_retro.columns[1].width = Inches(2.2)
    tbl_retro.columns[2].width = Inches(2.4)

    for r_idx, row in enumerate(retro_data):
        bg = BG_LIGHT_HEX if r_idx % 2 == 1 else "FFFFFF"
        for c_idx in range(3):
            cell = tbl_retro.cell(r_idx + 1, c_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(row[c_idx])
            run.font.size = Pt(9)
            if c_idx == 0:
                run.font.color.rgb = RGBColor(0x16, 0x65, 0x34) # Dark Green
            elif c_idx == 1:
                run.font.color.rgb = RGBColor(0x99, 0x1B, 0x1B) # Dark Red
            else:
                run.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A) # Navy

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_h2("6.3. Kế hoạch hành động chi tiết cho Sprint 2 (Sprint 2 Action Plan)")
    p = doc.add_paragraph()
    p.add_run(
        "Kế thừa nền tảng vững chắc đã xây dựng trong Sprint 1, đội ngũ Scrum đã thống nhất Product Backlog và cam kết "
        "các mục tiêu đột phá cho Sprint 2 (dự kiến từ 19/10/2026 đến 01/11/2026):"
    )
    add_bullet("1. Hoàn thiện phân hệ Bảng xếp hạng tuần (Weekly Leaderboard): ", "Lập trình thuật toán tự động reset và kết chuyển hạng tuần vào 23:59 Chủ Nhật; vinh danh Top 3 sinh viên có XP cao nhất trên bục Podium bảng Đồng, Bạc, Vàng, Kim Cương.")
    add_bullet("2. Hoàn thiện phân hệ Cửa hàng vật phẩm (Shop & Inventory): ", "Cho phép sinh viên dùng Đá quý (Gems) kiếm được từ việc vượt ải để mua: 'Streak Freeze' (Đóng băng chuỗi ngày khi bận), 'Refill Hearts' (Hồi phục 5 tim học tập) và 'XP Boost x2' (Nhân đôi kinh nghiệm trong 30 phút).")
    add_bullet("3. Tích hợp Hệ sinh thái Âm thanh Gamification: ", "Bổ sung hiệu ứng âm thanh (Sound FX) vui nhộn khi trả lời đúng, tiếng 'buzz' nhắc nhở khi trả lời sai, và đoạn nhạc chiến thắng hào hùng khi vượt qua một Cửa Ải.")
    add_bullet("4. Phát triển tính năng Đấu trí Học tập 1vs1 (PvP Quiz Duel): ", "Tạo phòng thi đấu trắc nghiệm thời gian thực giữa hai sinh viên cùng trường, biến việc ôn thi cuối kỳ thành các cuộc so tài học thuật kịch tính.")

    doc.add_page_break()

    # ==========================================
    # PHẦN KẾT LUẬN & CHỮ KÝ NGHIỆM THU
    # ==========================================
    add_h1("PHẦN KẾT LUẬN & CHỮ KÝ NGHIỆM THU")
    p = doc.add_paragraph()
    p.add_run(
        "Sprint 1 của dự án Nền tảng học tập Gamification \"3TG\" All-in-One môn Công nghệ phần mềm - K4 đã khép lại "
        "với kết quả xuất sắc. Đội ngũ không chỉ đáp ứng 100% các tiêu chí học thuật của mô hình Agile/Scrum mà còn tạo ra "
        "một sản phẩm có tính ứng dụng thực tiễn cao, giải quyết trúng và đúng nỗi đau của sinh viên khi sử dụng hệ thống EduX truyền thống.\n\n"
        "Toàn thể thành viên cam kết tiếp tục giữ vững kỷ luật Scrum, phát huy năng lực sáng tạo để hoàn thành xuất sắc các chặng Sprint tiếp theo."
    )

    p_sig_date = doc.add_paragraph()
    p_sig_date.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_sig_date.paragraph_format.space_before = Pt(24)
    p_sig_date.paragraph_format.space_after = Pt(8)
    r_sd = p_sig_date.add_run("Hà Nội, ngày 18 tháng 10 năm 2026")
    r_sd.italic = True
    r_sd.font.size = Pt(10)
    r_sd.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    tbl_sig = doc.add_table(rows=3, cols=3)
    tbl_sig.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_sig, color="FFFFFF", sz="0") # invisible borders for clean signature layout

    sig_titles = [
        ("TEAM LEAD / SCRUM MASTER", "Lê Văn An"),
        ("PRODUCT OWNER", "Nguyễn Như Quỳnh"),
        ("DATABASE & QA ENGINEER", "Nguyễn Văn Tú")
    ]

    for c_idx, (role, name) in enumerate(sig_titles):
        c_top = tbl_sig.cell(0, c_idx)
        c_mid = tbl_sig.cell(1, c_idx)
        c_bot = tbl_sig.cell(2, c_idx)
        
        c_top.width = Inches(2.2)
        c_mid.width = Inches(2.2)
        c_bot.width = Inches(2.2)
        
        p_t = c_top.paragraphs[0]
        p_t.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_t.paragraph_format.space_after = Pt(2)
        r_t = p_t.add_run(role)
        r_t.bold = True
        r_t.font.size = Pt(10)
        r_t.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
        
        p_m = c_mid.paragraphs[0]
        p_m.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_m.paragraph_format.space_before = Pt(36) # space for signature
        p_m.paragraph_format.space_after = Pt(2)
        r_m = p_m.add_run("(Đã ký và xác nhận)")
        r_m.italic = True
        r_m.font.size = Pt(8.5)
        r_m.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)
        
        p_b = c_bot.paragraphs[0]
        p_b.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_b.paragraph_format.space_after = Pt(0)
        r_b = p_b.add_run(name)
        r_b.bold = True
        r_b.font.size = Pt(10.5)
        r_b.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

    # Output file
    output_docx = os.path.join(sprint_folder, "BÁO CÁO TỔNG KẾT SPRINT 1 - APP 3TG.docx")
    doc.save(output_docx)
    print(f"Báo cáo tổng kết Sprint 1 đã được tạo thành công tại: {output_docx}")

if __name__ == "__main__":
    create_report()
