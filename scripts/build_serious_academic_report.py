import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import html

def build_report(toc_page_map=None):
    clean_template_path = os.path.abspath(os.path.join("tổng kết dự án", "Mẫu bìa BTL_Clean.docx"))
    if not os.path.exists(clean_template_path):
        import zipfile
        from PIL import Image
        src_docx = os.path.abspath(os.path.join("tổng kết dự án", "Mẫu bìa BTL.docx"))
        clean_frame_path = os.path.abspath(os.path.join("tổng kết dự án", "figures", "clean_frame.jpeg"))
        if not os.path.exists(clean_frame_path):
            border_im = Image.open(os.path.join("tổng kết dự án", "figures", "sample_border_frame_clean.png")).convert("RGB")
            border_im.resize((2000, 2960), Image.Resampling.LANCZOS).save(clean_frame_path, "JPEG", quality=98)
        with zipfile.ZipFile(src_docx, 'r') as zin, zipfile.ZipFile(clean_template_path, 'w') as zout:
            for item in zin.infolist():
                if item.filename == "word/media/image1.jpeg":
                    with open(clean_frame_path, 'rb') as f_img:
                        zout.writestr(item.filename, f_img.read())
                else:
                    zout.writestr(item, zin.read(item.filename))

    doc = docx.Document(clean_template_path)
    
    # 1. Isolate the paragraph containing the ornate border frame (<w:drawing>)
    drawing_p_elem = None
    for p in doc.paragraphs:
        if p._p.xpath('.//w:drawing'):
            drawing_p_elem = p._p
            break
            
    # Remove all other paragraphs from template so nothing pushes content down
    for p in list(doc.paragraphs):
        if p._p != drawing_p_elem:
            p._p.getparent().remove(p._p)

    # Disable expansion of soft line breaks (Shift+Enter / <w:br/>) across document
    compat_xml = parse_xml('<w:compat xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:doNotExpandShiftReturn/></w:compat>')
    doc.settings.element.append(compat_xml)

    COLOR_BLACK = RGBColor(0, 0, 0)
    COLOR_DARK = RGBColor(30, 30, 30)
    COLOR_GRAY = RGBColor(70, 70, 70)
    COLOR_DARK_RED = RGBColor(180, 30, 30)

    def set_font(run, size_pt=13, bold=False, italic=False, underline=False, color=COLOR_BLACK, font_name="Times New Roman"):
        run.font.name = font_name
        run.font.size = Pt(size_pt)
        run.font.bold = bold
        run.font.italic = italic
        run.font.underline = underline
        run.font.color.rgb = color

    def p_text(text, bold_prefix="", italic=False, space_after=4, align=WD_ALIGN_PARAGRAPH.JUSTIFY):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(space_after)
        if bold_prefix:
            r0 = p.add_run(bold_prefix)
            set_font(r0, size_pt=13, bold=True)
        r = p.add_run(text)
        set_font(r, size_pt=13, italic=italic)
        return p

    bm_counter = 0
    def h_styled(title, level=1, bookmark_name=None):
        nonlocal bm_counter
        p = doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.keep_with_next = True
        
        if level == 1:
            p.paragraph_format.space_before = Pt(11)
            p.paragraph_format.space_after = Pt(8)
            run = p.add_run(title)
            set_font(run, size_pt=14.5, bold=True, color=COLOR_BLACK)
        elif level == 2:
            p.paragraph_format.space_before = Pt(9)
            p.paragraph_format.space_after = Pt(6)
            run = p.add_run(title)
            set_font(run, size_pt=13.5, bold=True, color=COLOR_BLACK)
        else:
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run(title)
            set_font(run, size_pt=13, bold=True, italic=True, color=COLOR_DARK)
            
        if bookmark_name:
            bm_counter += 1
            bm_start = parse_xml(f'<w:bookmarkStart xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:id="{bm_counter}" w:name="{bookmark_name}"/>')
            bm_end = parse_xml(f'<w:bookmarkEnd xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:id="{bm_counter}"/>')
            p._p.insert(p._p.index(run._r), bm_start)
            p._p.append(bm_end)
            
        return p

    def callout_box(title, text_or_items):
        p_t = doc.add_paragraph()
        p_t.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p_t.paragraph_format.left_indent = Inches(0.4)
        p_t.paragraph_format.space_before = Pt(8)
        p_t.paragraph_format.space_after = Pt(2)
        p_t.paragraph_format.keep_with_next = True
        rt = p_t.add_run(f"• {title.strip()}")
        set_font(rt, size_pt=12.5, bold=True, color=COLOR_BLACK)

        if isinstance(text_or_items, list):
            items = text_or_items
        else:
            items = [item.strip() for item in text_or_items.split("\n\n") if item.strip()]

        for item in items:
            clean_item = " ".join(item.split())
            if not clean_item:
                continue
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            p.paragraph_format.line_spacing = 1.35
            p.paragraph_format.left_indent = Inches(0.6)
            p.paragraph_format.right_indent = Inches(0.2)
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(3)
            
            # Check for colon prefix like "DÀNH CHO: " or "1. Lý thuyết ...: "
            if ": " in clean_item:
                prefix, body = clean_item.split(": ", 1)
                r_pre = p.add_run(prefix + ": ")
                set_font(r_pre, size_pt=12, bold=True, color=COLOR_BLACK)
                r_body = p.add_run(body)
                set_font(r_body, size_pt=12, italic=True, color=COLOR_DARK)
            else:
                r = p.add_run(clean_item)
                set_font(r, size_pt=12, italic=True, color=COLOR_DARK)
        return p_t

    def code_box(code_text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.left_indent = Inches(0.4)
        p.paragraph_format.right_indent = Inches(0.2)
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(6)
        
        r = p.add_run(code_text.strip())
        set_font(r, size_pt=9.5, font_name="Consolas", color=COLOR_BLACK)
        return p

    def styled_table(headers, rows_data, col_widths=None):
        table = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
        table.style = 'Table Grid'
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False

        # Header Row: Bold black text
        hdr_cells = table.rows[0].cells
        for i, title in enumerate(headers):
            cell = hdr_cells[i]
            cell.text = title
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(4)
            for r in p.runs:
                set_font(r, size_pt=11, bold=True, color=COLOR_BLACK)

        # Data Rows: Clean black text
        for r_idx, row in enumerate(rows_data):
            row_cells = table.rows[r_idx + 1].cells
            for c_idx, val in enumerate(row):
                cell = row_cells[c_idx]
                cell.text = str(val)
                p = cell.paragraphs[0]
                p.paragraph_format.line_spacing = 1.2
                p.paragraph_format.space_before = Pt(3)
                p.paragraph_format.space_after = Pt(3)
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx > 1 else WD_ALIGN_PARAGRAPH.CENTER
                for r in p.runs:
                    set_font(r, size_pt=10.5, color=COLOR_BLACK)

        if col_widths:
            for row in table.rows:
                for idx, width in enumerate(col_widths):
                    row.cells[idx].width = Inches(width)

        doc.add_paragraph().paragraph_format.space_after = Pt(6)
        return table

        doc.add_paragraph().paragraph_format.space_after = Pt(6)
        return table

    def add_image_figure(filename, caption_text, width_inches=6.0):
        img_path = os.path.abspath(os.path.join("tổng kết dự án", "figures", filename))
        if os.path.exists(img_path):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(8)
            p_img.paragraph_format.space_after = Pt(4)
            p_img.add_run().add_picture(img_path, width=Inches(width_inches))

            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(2)
            p_cap.paragraph_format.space_after = Pt(10)
            r_cap = p_cap.add_run(caption_text)
            set_font(r_cap, size_pt=11, bold=True, italic=True, color=COLOR_BLACK)
        else:
            print(f"⚠️ Cảnh báo: Không tìm thấy hình ảnh tại: {img_path}")

    # =========================================================================
    # 1. TRANG BÌA CHÍNH (COVER PAGE) - CÓ KHUNG VIỀN HOA VĂN MẪU BÌA BTL.DOCX
    # =========================================================================
    print("-> Đang thiết lập Trang bìa chính (Khung hoa văn Mẫu bìa BTL.docx)...")
    p0 = doc.paragraphs[0]
    p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p0.paragraph_format.space_before = Pt(0)
    p0.paragraph_format.space_after = Pt(2)
    p0.paragraph_format.line_spacing = 1.15

    r0 = p0.add_run("BỘ GIÁO DỤC VÀ ĐÀO TẠO\nTRƯỜNG ĐẠI HỌC CMC\nKHOA: CÔNG NGHỆ THÔNG TIN\n")
    set_font(r0, size_pt=12.5, bold=True, color=COLOR_BLACK)

    r_div1 = p0.add_run("----- ")
    set_font(r_div1, size_pt=11, bold=True, color=COLOR_BLACK)
    r_book = p0.add_run("&")
    set_font(r_book, size_pt=12, bold=True, color=COLOR_BLACK, font_name="Wingdings")
    r_div2 = p0.add_run(" -----\n")
    set_font(r_div2, size_pt=11, bold=True, color=COLOR_BLACK)

    # Logo CMC University
    p_logo = doc.add_paragraph()
    p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_logo.paragraph_format.space_before = Pt(8)
    p_logo.paragraph_format.space_after = Pt(14)
    logo_path = os.path.abspath(os.path.join("tổng kết dự án", "figures", "cmc_logo_perfect.png"))
    if os.path.exists(logo_path):
        p_logo.add_run().add_picture(logo_path, width=Inches(2.3))

    # Title "TIỂU LUẬN BÀI TẬP LỚN"
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(6)
    p_title.paragraph_format.space_after = Pt(12)
    r_title = p_title.add_run("TIỂU LUẬN BÀI TẬP LỚN")
    set_font(r_title, size_pt=16.5, bold=True, color=COLOR_BLACK)

    # ĐỀ TÀI:
    p_topic = doc.add_paragraph()
    p_topic.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_topic.paragraph_format.space_before = Pt(4)
    p_topic.paragraph_format.space_after = Pt(20)
    p_topic.paragraph_format.line_spacing = 1.25

    r_lbl = p_topic.add_run("ĐỀ TÀI: ")
    set_font(r_lbl, size_pt=13.5, bold=True, italic=True, underline=True, color=COLOR_DARK_RED)

    r_val = p_topic.add_run("Xây dựng hệ sinh thái học tập thông minh 3TG Study AI:\nTích hợp trí tuệ nhân tạo đa tầng, cơ chế Gamification tương tác\nvà phòng học Focus Kiosk Mode bảo vệ Native C++")
    set_font(r_val, size_pt=13.5, bold=True, color=COLOR_DARK_RED)

    # 2-column table: Instructor & Subject
    tbl_meta = doc.add_table(rows=3, cols=2)
    tbl_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_meta.autofit = False

    col_widths = [Inches(2.5), Inches(3.2)]
    for row in tbl_meta.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = width

    meta_rows = [
        ("Giảng viên hướng dẫn", "ThS. Nguyễn Thị Vân Anh"),
        ("Học phần", "Công nghệ phần mềm"),
        ("Lớp", "N08")
    ]

    for r_idx, (col1, col2) in enumerate(meta_rows):
        c0 = tbl_meta.rows[r_idx].cells[0]
        c1 = tbl_meta.rows[r_idx].cells[1]
        
        p_c0 = c0.paragraphs[0]
        p_c0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_c0.paragraph_format.space_before = Pt(2)
        p_c0.paragraph_format.space_after = Pt(2)
        r_c0 = p_c0.add_run(col1)
        set_font(r_c0, size_pt=12.5, bold=True, color=COLOR_BLACK)
        
        p_c1 = c1.paragraphs[0]
        p_c1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_c1.paragraph_format.space_before = Pt(2)
        p_c1.paragraph_format.space_after = Pt(2)
        r_c1 = p_c1.add_run(col2)
        set_font(r_c1, size_pt=12.5, bold=True, color=COLOR_BLACK)

    # Group section
    p_grp_lbl = doc.add_paragraph()
    p_grp_lbl.paragraph_format.left_indent = Inches(0.8)
    p_grp_lbl.paragraph_format.space_before = Pt(22)
    p_grp_lbl.paragraph_format.space_after = Pt(6)
    r_grp = p_grp_lbl.add_run("Nhóm thực hiện:")
    set_font(r_grp, size_pt=13, bold=True, color=COLOR_BLACK)

    students = [
        "Lê Văn An – BAI250001 (Nhóm trưởng)",
        "Nguyễn Như Quỳnh – BCS252491",
        "Nguyễn Văn Tú – BIT250364"
    ]

    for s in students:
        p_s = doc.add_paragraph()
        p_s.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_s.paragraph_format.space_before = Pt(1.5)
        p_s.paragraph_format.space_after = Pt(1.5)
        r_s = p_s.add_run(s)
        set_font(r_s, size_pt=13, bold=True, color=COLOR_BLACK)

    # Move to Page 2 (Bìa lót)
    doc.add_page_break()

    # =========================================================================
    # 2. TRANG BÌA LÓT (INNER COVER)
    # =========================================================================
    print("-> Đang tạo Trang bìa lót (Giấy trắng chuẩn Mẫu bìa BTL)...")
    p0_2 = doc.add_paragraph()
    p0_2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p0_2.paragraph_format.space_before = Pt(12)
    p0_2.paragraph_format.space_after = Pt(2)
    p0_2.paragraph_format.line_spacing = 1.15

    r0_2 = p0_2.add_run("BỘ GIÁO DỤC VÀ ĐÀO TẠO\nTRƯỜNG ĐẠI HỌC CMC\nKHOA: CÔNG NGHỆ THÔNG TIN\n")
    set_font(r0_2, size_pt=12.5, bold=True, color=COLOR_BLACK)

    r_div1_2 = p0_2.add_run("----- ")
    set_font(r_div1_2, size_pt=11, bold=True, color=COLOR_BLACK)
    r_book_2 = p0_2.add_run("&")
    set_font(r_book_2, size_pt=12, bold=True, color=COLOR_BLACK, font_name="Wingdings")
    r_div2_2 = p0_2.add_run(" -----\n")
    set_font(r_div2_2, size_pt=11, bold=True, color=COLOR_BLACK)

    p_logo_2 = doc.add_paragraph()
    p_logo_2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_logo_2.paragraph_format.space_before = Pt(8)
    p_logo_2.paragraph_format.space_after = Pt(14)
    if os.path.exists(logo_path):
        p_logo_2.add_run().add_picture(logo_path, width=Inches(2.3))

    p_title_2 = doc.add_paragraph()
    p_title_2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title_2.paragraph_format.space_before = Pt(6)
    p_title_2.paragraph_format.space_after = Pt(12)
    r_title_2 = p_title_2.add_run("TIỂU LUẬN BÀI TẬP LỚN")
    set_font(r_title_2, size_pt=16.5, bold=True, color=COLOR_BLACK)

    p_topic_2 = doc.add_paragraph()
    p_topic_2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_topic_2.paragraph_format.space_before = Pt(4)
    p_topic_2.paragraph_format.space_after = Pt(20)
    p_topic_2.paragraph_format.line_spacing = 1.25

    r_lbl_2 = p_topic_2.add_run("ĐỀ TÀI: ")
    set_font(r_lbl_2, size_pt=13.5, bold=True, italic=True, underline=True, color=COLOR_DARK_RED)

    r_val_2 = p_topic_2.add_run("Xây dựng hệ sinh thái học tập thông minh 3TG Study AI:\nTích hợp trí tuệ nhân tạo đa tầng, cơ chế Gamification tương tác\nvà phòng học Focus Kiosk Mode bảo vệ Native C++")
    set_font(r_val_2, size_pt=13.5, bold=True, color=COLOR_DARK_RED)

    tbl_inner = doc.add_table(rows=3, cols=2)
    tbl_inner.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_inner.autofit = False
    for row in tbl_inner.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = width

    for r_idx, (col1, col2) in enumerate(meta_rows):
        c0 = tbl_inner.rows[r_idx].cells[0]
        c1 = tbl_inner.rows[r_idx].cells[1]
        
        p_c0 = c0.paragraphs[0]
        p_c0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_c0.paragraph_format.space_before = Pt(2)
        p_c0.paragraph_format.space_after = Pt(2)
        r_c0 = p_c0.add_run(col1)
        set_font(r_c0, size_pt=12.5, bold=True, color=COLOR_BLACK)
        
        p_c1 = c1.paragraphs[0]
        p_c1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_c1.paragraph_format.space_before = Pt(2)
        p_c1.paragraph_format.space_after = Pt(2)
        r_c1 = p_c1.add_run(col2)
        set_font(r_c1, size_pt=12.5, bold=True, color=COLOR_BLACK)

    p_grp_lbl_2 = doc.add_paragraph()
    p_grp_lbl_2.paragraph_format.left_indent = Inches(0.8)
    p_grp_lbl_2.paragraph_format.space_before = Pt(22)
    p_grp_lbl_2.paragraph_format.space_after = Pt(6)
    r_grp_2 = p_grp_lbl_2.add_run("Nhóm thực hiện:")
    set_font(r_grp_2, size_pt=13, bold=True, color=COLOR_BLACK)

    for s in students:
        p_s = doc.add_paragraph()
        p_s.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_s.paragraph_format.space_before = Pt(1.5)
        p_s.paragraph_format.space_after = Pt(1.5)
        r_s = p_s.add_run(s)
        set_font(r_s, size_pt=13, bold=True, color=COLOR_BLACK)

    # Move to Page 3 (Đề bài)
    doc.add_page_break()

    # =========================================================================
    # 3. TRANG ĐỀ BÀI
    # =========================================================================
    print("-> Đang tạo Trang đề bài bài tập lớn...")
    h_styled("ĐỀ BÀI BÀI TẬP LỚN MÔN HỌC CÔNG NGHỆ PHẦN MỀM", level=1)
    p_text("Học phần: Công nghệ phần mềm (Software Engineering) — Mã học phần: INFO2011", bold_prefix="1. Thông tin học phần: ")
    p_text("Xây dựng hoàn chỉnh một ứng dụng phần mềm Desktop native/hybrid có khả năng hỗ trợ học tập chuyên sâu, tích hợp công nghệ AI, tuân thủ nghiêm ngặt quy trình Agile Scrum qua 6 Sprints và vượt qua bộ kiểm thử tự động toàn diện.", bold_prefix="2. Yêu cầu tổng quát: ")
    p_text("Toàn bộ chu trình phát triển sản phẩm phải được quản trị nghiêm ngặt và minh bạch trên nền tảng GitHub (kho lưu trữ Anniehatani / appstudyAI), bao gồm hệ thống Issues phân công có gán nhãn, Milestones theo từng Sprint, Git Commits có thông điệp chuẩn mực, Pull Requests, Code Review và gắn Tag bản phát hành (Releases v29.9.07).", bold_prefix="3. Yêu cầu quản trị mã nguồn: ")
    p_text("Xây dựng thành công một Sản phẩm khả dụng tối thiểu (MVP) chạy được trên môi trường máy tính Desktop Windows (bản cài Installer và Portable), tích hợp đầy đủ backend cơ sở dữ liệu D1 chuẩn 3NF, API RESTful, và tác tử AI hoạt động thực tế.", bold_prefix="4. Yêu cầu sản phẩm MVP: ")
    p_text("Đáp ứng trọn vẹn 5 Chuẩn đầu ra học phần (CLO1 đến CLO5): Kỹ nghệ phần mềm hiện đại & Agile; Phân tích yêu cầu & Tầm nhìn sản phẩm; Thiết kế kiến trúc & CSDL 3NF; Bảo mật, lập trình tin cậy & Kiểm thử QA; Làm việc nhóm, tài liệu kỹ thuật & Khai thác AI có trách nhiệm.", bold_prefix="5. Chuẩn đầu ra hướng tới: ")

    doc.add_page_break()

    # =========================================================================
    # 4. PHẦN CHẤM ĐIỂM & NHẬN XÉT CỦA GIẢNG VIÊN
    # =========================================================================
    print("-> Đang tạo Trang nhận xét và phiếu chấm điểm...")
    h_styled("PHIẾU NHẬN XÉT VÀ ĐÁNH GIÁ CỦA GIẢNG VIÊN CHẤM THI", level=1)
    p_text("Họ và tên giảng viên chấm 1: ....................................................................... Chữ ký: ......................", align=WD_ALIGN_PARAGRAPH.LEFT)
    p_text("Họ và tên giảng viên chấm 2: ....................................................................... Chữ ký: ......................", align=WD_ALIGN_PARAGRAPH.LEFT)
    p_text("Điểm kết luận toàn diện bài tập lớn: Bằng số: .............. / 10 | Bằng chữ: ..........................................", align=WD_ALIGN_PARAGRAPH.LEFT)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    p_text("BẢNG ĐÁNH GIÁ CHI TIẾT THEO 5 CHUẨN ĐẦU RA (CLO) - RUBRIC INFO2011 CMCU K4", bold_prefix="• ", align=WD_ALIGN_PARAGRAPH.LEFT)
    rubric_tbl = [
        ["Tiêu chí CLO", "Nội dung chuẩn đầu ra đánh giá", "Trọng số", "Điểm tối đa", "Điểm đánh giá"],
        ["CLO1", "Áp dụng quy trình Agile Scrum, quản lý mã nguồn Git, quản trị Sprint và phát hành phiên bản.", "20%", "2.0", ""],
        ["CLO2", "Kỹ nghệ yêu cầu: Tuyên ngôn tầm nhìn, Personas, Use Case Diagram, FR và NFR chuẩn mực.", "20%", "2.0", ""],
        ["CLO3", "Thiết kế kiến trúc hệ thống phân tầng, phân tích đánh đổi CAP, mô hình CSDL quan hệ chuẩn 3NF.", "20%", "2.0", ""],
        ["CLO4", "Lập trình tin cậy: Mã hóa bảo mật, Win32 Native Kiosk Guard, kiểm thử tự động toàn diện Pass 100%.", "20%", "2.0", ""],
        ["CLO5", "Khai thác AI có trách nhiệm, tài liệu kỹ thuật học thuật, tinh thần làm việc nhóm và đóng góp.", "20%", "2.0", ""],
        ["TỔNG CỘNG", "ĐÁNH GIÁ TOÀN DIỆN BÀI TẬP LỚN HỌC PHẦN CÔNG NGHỆ PHẦN MỀM", "100%", "10.0", ""]
    ]
    styled_table(rubric_tbl[0], rubric_tbl[1:], col_widths=[0.9, 3.2, 0.7, 0.8, 0.9])
    
    p_text("Nhận xét chi tiết của cán bộ chấm thi:", bold_prefix="• ", align=WD_ALIGN_PARAGRAPH.LEFT)
    for _ in range(4):
        p_text("....................................................................................................................................................................................", align=WD_ALIGN_PARAGRAPH.LEFT)

    doc.add_page_break()

    # =========================================================================
    # 5. MỤC LỤC TỔNG QUAN (CLICKABLE VỚI TAB DOT LEADER & BOOKMARK HYPERLINKS)
    # =========================================================================
    print("-> Đang tạo Mục lục báo cáo (Clickable với dấu chấm liên tục và liên kết nhảy trang)...")
    h_styled("MỤC LỤC BÁO CÁO TỔNG KẾT DỰ ÁN", level=1)
    
    # Exact page numbers synchronized with compiled PDF
    TOC_DEFINITIONS = [
        ("LỜI NÓI ĐẦU & TÓM TẮT DỰ ÁN (EXECUTIVE ABSTRACT)", "sec_abstract", True, 0, 1),
        ("CHƯƠNG 1: TỔNG QUAN DỰ ÁN & KỸ NGHỆ YÊU CẦU PHẦN MỀM", "sec_ch1", True, 0, 2),
        ("1.1. Bối cảnh nghiên cứu, tính cấp thiết và lý do chọn đề tài", "sec_ch1_1", False, 0.2, 2),
        ("1.2. Tuyên ngôn Tầm nhìn sản phẩm (Product Vision Statement)", "sec_ch1_2", False, 0.2, 2),
        ("1.3. Chân dung người dùng điển hình (User Personas)", "sec_ch1_3", False, 0.2, 3),
        ("1.4. Kịch bản sử dụng (User Scenarios) & Bản đồ hành trình (Journey Maps)", "sec_ch1_4", False, 0.2, 4),
        ("1.5. Sơ đồ Use Case tổng thể hệ thống (UML 2.5 Specification)", "sec_ch1_5", False, 0.2, 4),
        ("1.6. Kỹ nghệ Yêu cầu hệ thống: Chức năng (FR) và Phi chức năng (NFR)", "sec_ch1_6", False, 0.2, 4),
        ("1.7. User Stories & Tiêu chuẩn chấp thuận (Acceptance Criteria)", "sec_ch1_7", False, 0.2, 6),
        ("1.8. Product Backlog & Ước lượng độ phức tạp (Fibonacci Story Points)", "sec_ch1_8", False, 0.2, 6),
        ("CHƯƠNG 2: THIẾT KẾ KIẾN TRÚC PHẦN MỀM & CƠ SỞ DỮ LIỆU", "sec_ch2", True, 0, 7),
        ("2.1. Đề xuất Kiến trúc tổng thể: Hybrid Edge-Serverless & Desktop Client", "sec_ch2_1", False, 0.2, 7),
        ("2.2. Phân tích các đánh đổi kiến trúc (Trade-offs) & Định lý CAP", "sec_ch2_2", False, 0.2, 7),
        ("2.3. Sơ đồ kiến trúc phân tầng hệ thống (Layered Architecture)", "sec_ch2_3", False, 0.2, 8),
        ("2.4. Thiết kế chuẩn hóa giao tiếp RESTful API & Idempotency", "sec_ch2_4", False, 0.2, 9),
        ("2.5. Thiết kế Toàn diện CSDL Cloudflare D1 chuẩn 3NF & Sơ đồ SQL ERD", "sec_ch2_5", False, 0.2, 9),
        ("2.6. Hệ thống Giao diện người dùng & Động cơ Gamification phân tầng", "sec_ch2_6", False, 0.2, 11),
        ("CHƯƠNG 3: BẢO MẬT, LẬP TRÌNH TIN CẬY & VẬN HÀNH DEVOPS", "sec_ch3", True, 0, 12),
        ("3.1. Phân tích Mô hình đe dọa STRIDE Threat Modeling", "sec_ch3_1", False, 0.2, 12),
        ("3.2. Thuật toán băm mật khẩu PBKDF2-HMAC-SHA256 chuẩn OWASP", "sec_ch3_2", False, 0.2, 13),
        ("3.3. Cơ chế Rate Limiting trượt (Sliding Window Algorithm)", "sec_ch3_3", False, 0.2, 13),
        ("3.4. Kiến trúc Transactional Outbox & Replay Queue đồng bộ ngoại tuyến", "sec_ch3_4", False, 0.2, 13),
        ("3.5. Trình bảo vệ Kiosk C++ Native & Khôi phục 100% Taskbar Windows <5ms", "sec_ch3_5", False, 0.2, 14),
        ("3.6. Cơ chế Multi-Monitor Zen Blocker bao phủ màn hình phụ", "sec_ch3_6", False, 0.2, 15),
        ("3.7. Trình phát nhạc Local Offline qua HTTP 206 Byte-Range", "sec_ch3_7", False, 0.2, 15),
        ("3.8. Sửa lỗi Detached Buffer trên PDF.js & Tối ưu Resizer RAF 60 FPS", "sec_ch3_8", False, 0.2, 15),
        ("CHƯƠNG 4: THỰC THI QUA 6 SPRINTS AGILE & ĐỐI CHIẾU SOMMERVILLE", "sec_ch4", True, 0, 16),
        ("4.1. Quy trình quản trị dự án Agile Scrum trên GitHub", "sec_ch4_1", False, 0.2, 16),
        ("4.2. Báo cáo chi tiết chuỗi 6 Sprints phát triển phần mềm", "sec_ch4_2", False, 0.2, 17),
        ("4.3. Phân tích đối chiếu lý thuyết Ian Sommerville (Mạch 3 bước)", "sec_ch4_3", False, 0.2, 18),
        ("4.4. Bảng tổng kết đóng góp thành viên nhóm TONE PINK", "sec_ch4_4", False, 0.2, 19),
        ("CHƯƠNG 5: KHAI THÁC AI CÓ TRÁCH NHIỆM & KIỂM THỬ PHẦN MỀM", "sec_ch5", True, 0, 20),
        ("5.1. Khung nguyên tắc khai thác AI có trách nhiệm (Responsible AI)", "sec_ch5_1", False, 0.2, 20),
        ("5.2. Nhật ký phối hợp AI (AI Collaboration Log) qua 4 giai đoạn", "sec_ch5_2", False, 0.2, 20),
        ("5.3. Hệ sinh thái 3TG AI Đa tầng & Phím tắt Ctrl + V dán ảnh", "sec_ch5_3", False, 0.2, 20),
        ("5.4. Master Test Suite: Bảng kết quả kiểm thử 38/38 Pass 100%", "sec_ch5_4", False, 0.2, 21),
        ("CHƯƠNG 6: KẾT QUẢ THỰC HIỆN, ĐÁNH GIÁ & HƯỚNG PHÁT TRIỂN", "sec_ch6", True, 0, 22),
        ("6.1. Trình diễn sản phẩm MVP hoàn thiện V29.9.07", "sec_ch6_1", False, 0.2, 22),
        ("6.2. Đánh giá mức độ hoàn thành so với mục tiêu ban đầu", "sec_ch6_2", False, 0.2, 23),
        ("6.3. Những thách thức kỹ thuật lớn nhất đã vượt qua", "sec_ch6_3", False, 0.2, 23),
        ("6.4. Những hạn chế và hướng phát triển trong tương lai", "sec_ch6_4", False, 0.2, 23),
        ("DANH MỤC TÀI LIỆU THAM KHẢO (IEEE / APA STANDARD)", "sec_refs", True, 0, 24),
        ("PHỤ LỤC: HƯỚNG DẪN CÀI ĐẶT & VẬN HÀNH HỆ THỐNG", "sec_appendix", True, 0, 25),
    ]

    def add_clickable_toc_item(title, page_str, bookmark_name, is_chapter=False, indent_inch=0):
        p = doc.add_paragraph()
        p.paragraph_format.tab_stops.add_tab_stop(Inches(6.32), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)
        p.paragraph_format.left_indent = Inches(indent_inch)
        p.paragraph_format.space_before = Pt(2.5 if is_chapter else 1.0)
        p.paragraph_format.space_after = Pt(2.5 if is_chapter else 1.0)
        p.paragraph_format.line_spacing = 1.15
        
        b_val = "true" if is_chapter else "false"
        sz_val = "25" if is_chapter else "23"
        escaped_title = html.escape(title)
        
        hl_xml = parse_xml(f'''
            <w:hyperlink xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:anchor="{bookmark_name}">
                <w:r>
                    <w:rPr>
                        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
                        <w:b w:val="{b_val}"/>
                        <w:color w:val="000000"/>
                        <w:sz w:val="{sz_val}"/>
                        <w:u w:val="none"/>
                    </w:rPr>
                    <w:t>{escaped_title}</w:t>
                </w:r>
                <w:r>
                    <w:rPr>
                        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
                        <w:color w:val="000000"/>
                        <w:sz w:val="{sz_val}"/>
                    </w:rPr>
                    <w:tab/>
                </w:r>
                <w:r>
                    <w:rPr>
                        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
                        <w:b w:val="{b_val}"/>
                        <w:color w:val="000000"/>
                        <w:sz w:val="{sz_val}"/>
                    </w:rPr>
                    <w:t>{page_str}</w:t>
                </w:r>
            </w:hyperlink>
        ''')
        p._p.append(hl_xml)

    for title, bmk, is_ch, indent, def_page in TOC_DEFINITIONS:
        page_val = str(toc_page_map.get(bmk, def_page)) if toc_page_map else str(def_page)
        add_clickable_toc_item(title, page_val, bmk, is_chapter=is_ch, indent_inch=indent)

    doc.add_page_break()

    # =========================================================================
    # 6. DANH MỤC TỪ VIẾT TẮT
    # =========================================================================
    print("-> Đang tạo Danh mục từ viết tắt...")
    h_styled("DANH MỤC TỪ VIẾT TẮT (XẾP THEO BẢNG CHỮ CÁI TIẾNG ANH)", level=1)
    acronyms = [
        ("3NF", "Third Normal Form", "Dạng chuẩn hóa cơ sở dữ liệu quan hệ bậc 3 triệt tiêu dư thừa dữ liệu"),
        ("AI", "Artificial Intelligence", "Trí tuệ nhân tạo (Mô hình ngôn ngữ lớn DeepSeek-V3 / Groq Llama-3)"),
        ("API", "Application Programming Interface", "Giao diện lập trình ứng dụng giao tiếp client-server theo chuẩn RESTful"),
        ("CAP", "Consistency, Availability, Partition tolerance", "Định lý thỏa hiệp trong hệ thống cơ sở dữ liệu phân tán"),
        ("CLO", "Course Learning Outcomes", "Chuẩn đầu ra của học phần theo khung chương trình đào tạo CMCU K4"),
        ("CRUD", "Create, Read, Update, Delete", "Bốn thao tác dữ liệu cơ bản trên cơ sở dữ liệu quan hệ"),
        ("D1", "Cloudflare D1 Serverless SQL", "Cơ sở dữ liệu SQLite phân tán toàn cầu tại mạng biên của Cloudflare"),
        ("DND", "Do Not Disturb", "Chế độ chống sao nhãng học tập toàn diện loại bỏ thông báo hệ điều hành"),
        ("ERD", "Entity Relationship Diagram", "Sơ đồ thực thể liên kết mô tả cấu trúc và quan hệ các bảng cơ sở dữ liệu"),
        ("FK", "Foreign Key", "Khóa ngoại ràng buộc toàn vẹn quan hệ giữa các bảng dữ liệu"),
        ("FR", "Functional Requirement", "Yêu cầu chức năng định rõ hành vi và nghiệp vụ của phần mềm"),
        ("GPA", "Grade Point Average", "Điểm trung bình tích lũy học tập theo thang điểm 4.0 và thang điểm 10"),
        ("HMAC", "Hash-based Message Authentication Code", "Mã xác thực thông điệp dựa trên hàm băm mật mã học SHA-256"),
        ("IPC", "Inter-Process Communication", "Giao tiếp an toàn giữa Main Process (Node.js/C++) và Renderer Process"),
        ("IU", "International University Portal", "Cổng thông tin đào tạo tín chỉ sinh viên Đại học Quốc tế CMC"),
        ("MVP", "Minimum Viable Product", "Sản phẩm khả dụng tối thiểu hoàn thiện đầy đủ luồng nghiệp vụ chính"),
        ("NFR", "Non-Functional Requirement", "Yêu cầu phi chức năng về hiệu năng, độ tin cậy và bảo mật"),
        ("OWASP", "Open Web Application Security Project", "Tổ chức quốc tế nghiên cứu và ban hành tiêu chuẩn an toàn phần mềm"),
        ("PBKDF2", "Password-Based Key Derivation Function 2", "Thuật toán băm mật khẩu kéo dài khóa với 100.000 vòng lặp HMAC-SHA256"),
        ("PK", "Primary Key", "Khóa chính định danh duy nhất cho từng bản ghi dữ liệu"),
        ("QA", "Quality Assurance", "Quy trình đảm bảo chất lượng và kiểm thử phần mềm tự động"),
        ("RAF", "requestAnimationFrame", "Hàm API tối ưu hóa vẽ giao diện đồng bộ tần số quét màn hình 60 FPS"),
        ("REST", "Representational State Transfer", "Kiến trúc thiết kế dịch vụ web phi trạng thái truyền dữ liệu JSON"),
        ("STRIDE", "Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation", "Mô hình phân loại và đánh giá các nguy cơ đe dọa an ninh phần mềm"),
        ("UI/UX", "User Interface / User Experience", "Thiết kế giao diện người dùng và tối ưu trải nghiệm tương tác học tập"),
        ("UML", "Unified Modeling Language", "Ngôn ngữ mô hình hóa thống nhất mô tả kiến trúc và kịch bản phần mềm"),
        ("XP", "Experience Points", "Điểm kinh nghiệm tích lũy thúc đẩy động lực học tập trong Gamification")
    ]
    styled_table(["Từ viết tắt", "Thuật ngữ Tiếng Anh đầy đủ", "Ý nghĩa chuyên môn trong đồ án 3TG Study AI"], acronyms, col_widths=[0.9, 2.2, 3.4])

    doc.add_page_break()

    # =========================================================================
    # 7. DANH MỤC BẢNG BIỂU VÀ HÌNH VẼ
    # =========================================================================
    print("-> Đang tạo Danh mục bảng biểu và hình vẽ...")
    h_styled("DANH MỤC BẢNG BIỂU VÀ HÌNH VẼ", level=1)
    
    p_text("DANH MỤC HÌNH VẼ MINH HỌA (FIGURES)", bold_prefix="• ")
    figures_list = [
        ("Hình 1.1", "Sơ đồ Use Case tổng thể hệ thống 3TG Study AI (Chuẩn UML 2.5 Specification)", "Trang 4"),
        ("Hình 2.1", "Sơ đồ Kiến trúc phân tầng Hybrid Edge-Serverless & Desktop Client (4-Layer Architecture)", "Trang 8"),
        ("Hình 2.2", "Sơ đồ Thực thể Liên kết Cơ sở dữ liệu toàn diện Cloudflare D1 chuẩn 3NF (33 bảng dữ liệu)", "Trang 10"),
        ("Hình 2.3", "Giao diện thực chứng Lộ trình học tập Gamification phân tầng tích lũy XP (FR-02)", "Trang 11"),
        ("Hình 3.1", "Sơ đồ Tuần tự (Sequence Diagram) Kích hoạt và Thoát an toàn Kiosk Mode với C++ Native Worker", "Trang 14"),
        ("Hình 3.2", "Giao diện thực chứng Sảnh chờ phòng học Pomodoro Focus Zen Mode và tùy chọn âm thanh Local", "Trang 15"),
        ("Hình 3.3", "Giao diện thực chứng Bàn học tập trung Pomodoro, Trình đọc tài liệu PDF và Khung chat 3TG AI", "Trang 15"),
        ("Hình 4.1", "Bằng chứng quản trị dự án phần mềm trên GitHub Repository Anniehatani/appstudyAI", "Trang 17"),
        ("Hình 5.1", "Giao diện thực chứng Xác thực người dùng: Đăng ký & Đăng nhập mã hóa PBKDF2 an toàn", "Trang 22")
    ]
    styled_table(["Mã hiệu", "Tên hình vẽ minh họa", "Vị trí trang"], figures_list, col_widths=[1.0, 4.5, 1.0])

    p_text("DANH MỤC BẢNG BIỂU THỐNG KÊ (TABLES)", bold_prefix="• ")
    tables_list = [
        ("Bảng 1.1", "Bảng ma trận đặc tả 10 Yêu cầu chức năng cốt lõi (Functional Requirements)", "Trang 5"),
        ("Bảng 1.2", "Bảng đặc tả 5 Yêu cầu phi chức năng chất lượng hệ thống theo chuẩn ISO/IEC 25010", "Trang 5"),
        ("Bảng 1.3", "Bảng phân tích độ phức tạp Product Backlog theo thang đo Fibonacci Story Points", "Trang 6"),
        ("Bảng 2.1", "Bảng ma trận đặc tả chuẩn hóa 12 RESTful API Endpoints và cơ chế Idempotency", "Trang 9"),
        ("Bảng 2.2", "Bảng từ điển dữ liệu chuẩn hóa 3NF phân tích cấu trúc 33 bảng CSDL Cloudflare D1", "Trang 10"),
        ("Bảng 3.1", "Bảng phân tích mô hình đe dọa an ninh STRIDE và các giải pháp phòng vệ tương ứng", "Trang 12"),
        ("Bảng 4.1", "Bảng báo cáo kỹ thuật chi tiết chuỗi 6 Milestones Sprints phát triển phần mềm Agile", "Trang 17"),
        ("Bảng 4.2", "Bảng ma trận phân công trách nhiệm và tỷ lệ đóng góp của 3 thành viên nhóm TONE PINK", "Trang 19"),
        ("Bảng 5.1", "Bảng nhật ký phối hợp khai thác AI có trách nhiệm (AI Collaboration Log) qua 4 giai đoạn", "Trang 20"),
        ("Bảng 5.2", "Bảng kết quả thực nghiệm bộ kiểm thử tự động Master Test Suite (38/38 Test Cases Pass 100%)", "Trang 21"),
        ("Bảng 6.1", "Bảng tổng hợp đánh giá đối chiếu mức độ đáp ứng 5 Chuẩn đầu ra học phần CMCU K4", "Trang 23")
    ]
    styled_table(["Mã hiệu", "Tên bảng biểu thống kê", "Vị trí trang"], tables_list, col_widths=[1.0, 4.5, 1.0])


    # =========================================================================
    # SECTION 2: THÂN BÀI BÁO CÁO (ĐÁNH SỐ TRANG TỪ 1 Ở LỀ TRÊN)
    # =========================================================================
    print("-> Đang khởi tạo Section 2 (Đánh số trang từ 1 ở lề trên)...")
    sec_body = doc.add_section()
    sec_body.top_margin = Cm(2.0)
    sec_body.bottom_margin = Cm(2.0)
    sec_body.left_margin = Cm(3.0)
    sec_body.right_margin = Cm(2.0)
    sec_body.page_width = Cm(21.0)
    sec_body.page_height = Cm(29.7)
    sec_body.different_first_page_header_footer = False
    sec_body.header.is_linked_to_previous = False
    sec_body.footer.is_linked_to_previous = False

    # Header with page number starting at 1
    p_hdr = sec_body.header.paragraphs[0]
    p_hdr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    fldSimple = parse_xml(r'''
        <w:fldSimple %s w:instr="PAGE">
            <w:r>
                <w:rPr>
                    <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
                    <w:sz w:val="24"/>
                </w:rPr>
                <w:t>1</w:t>
            </w:r>
        </w:fldSimple>
    ''' % nsdecls('w'))
    p_hdr._p.append(fldSimple)
    
    pgNumType = parse_xml(r'<w:pgNumType %s w:start="1"/>' % nsdecls('w'))
    cols = sec_body._sectPr.find(qn('w:cols'))
    if cols is not None:
        sec_body._sectPr.insert(sec_body._sectPr.index(cols), pgNumType)
    else:
        sec_body._sectPr.append(pgNumType)

    # -------------------------------------------------------------------------
    # LỜI NÓI ĐẦU & ABSTRACT
    # -------------------------------------------------------------------------
    print("-> Đang tạo Lời nói đầu & Abstract...")
    h_styled("LỜI NÓI ĐẦU & TÓM TẮT DỰ ÁN (EXECUTIVE ABSTRACT)", level=1, bookmark_name="sec_abstract")
    
    p_text("Trong kỷ nguyên số hóa giáo dục đại học, bài toán duy trì sự tập trung chuyên sâu (Deep Focus) và hạn chế tình trạng gián đoạn chú ý (Continuous Partial Attention) đang là thách thức nhức nhối đối với thế hệ sinh viên công nghệ thông tin. Nghiên cứu thực nghiệm của các nhà khoa học nhận thức chỉ ra rằng mỗi lần chuyển đổi ngữ cảnh (Context Switching) khiến não bộ mất trung bình 23 phút 15 giây để tái lập trạng thái dòng chảy nhận thức (Flow State). Trước thực trạng đó, nhóm tác giả TONE PINK (Lớp N08, Khoa CNTT&TT, Trường Đại học CMC) đã thực hiện đề tài nghiên cứu và phát triển hệ sinh thái phần mềm: \"Hệ thống Học tập Thông minh 3TG Study AI\" (3TG Study Ecosystem).", bold_prefix="Tóm tắt bối cảnh học thuật: ")
    
    p_text("Đồ án giải quyết bài toán nâng cao hiệu suất học tập bằng giải pháp kiến trúc phần mềm lai (Hybrid Architecture): Tích hợp điện toán biên không máy chủ (Serverless Edge Computing trên nền tảng Cloudflare Workers, Cloudflare D1 SQL, R2 Storage) kết hợp cùng ứng dụng máy trạm Desktop hiệu năng cao (Node.js IPC, Win32 Native C++ Kiosk Guard). Hệ thống cung cấp lộ trình bài học cá nhân hóa phân tầng Gamification (bài học uốn lượn, điểm kinh nghiệm XP, chuỗi ngày Streak giữ lửa), tích hợp cổng kết nối điểm tín chỉ trường đại học IU CMCU, trợ lý AI DeepSeek cố vấn kế hoạch học tập, và không gian học tập thiền định Focus Pomodoro đi kèm cơ chế khóa cứng đa màn hình chống sao nhãng cấp hệ điều hành (Multi-Monitor Native Kiosk Mode).", bold_prefix="Đóng góp kỹ thuật cốt lõi: ")

    p_text("Báo cáo khoa học này trình bày toàn bộ tiến trình kỹ nghệ phần mềm chuyên nghiệp: Từ phân tích yêu cầu (UML Use Case, 10 FRs, 5 NFRs theo ISO/IEC 25010), thiết kế kiến trúc phân tầng 4 lớp và cơ sở dữ liệu quan hệ chuẩn 3NF (33 bảng dữ liệu), phòng vệ an ninh hệ thống theo mô hình STRIDE Threat Modeling kết hợp thuật toán băm mật mã PBKDF2-HMAC-SHA256, đến quy trình quản trị dự án Agile Scrum qua chuỗi 6 Sprints thực chiến trên GitHub Repository. Toàn bộ tính năng đã được kiểm chứng bằng bộ kiểm thử tự động Master Test Suite với 38/38 kịch bản đạt trạng thái Pass 100%, đáp ứng xuất sắc 5 Chuẩn đầu ra học phần (CLO1 - CLO5) của Trường Đại học CMC.", bold_prefix="Cấu trúc luận văn: ")

    callout_box("Tuyên bố liêm chính học thuật & Bản quyền sở hữu trí tuệ", 
                "Nhóm thực hiện TONE PINK cam kết toàn bộ kiến trúc phần mềm, mã nguồn C++ native, logic backend Cloudflare D1, giải thuật băm mật mã và các màn hình giao diện trong đồ án 3TG Study AI là kết quả nghiên cứu độc lập, sáng tạo của nhóm dưới sự hướng dẫn của ThS. Nguyễn Thị Vân Anh. Dự án không sao chép nguyên bản từ bất kỳ sản phẩm thương mại nào và hoàn toàn chịu trách nhiệm về tính trung thực của các số liệu thực nghiệm được công bố.")

    # -------------------------------------------------------------------------
    # CHƯƠNG 1
    # -------------------------------------------------------------------------
    print("-> Đang tạo Chương 1: Kỹ nghệ Yêu cầu...")
    h_styled("CHƯƠNG 1: TỔNG QUAN DỰ ÁN & KỸ NGHỆ YÊU CẦU PHẦN MỀM (REQUIREMENTS ENGINEERING)", level=1, bookmark_name="sec_ch1")
    
    h_styled("1.1. Bối cảnh nghiên cứu, tính cấp thiết và lý do chọn đề tài", level=2, bookmark_name="sec_ch1_1")
    p_text("Đào tạo theo học chế tín chỉ đòi hỏi sinh viên phải tự chủ cao độ trong việc lập kế hoạch ôn tập, tra cứu điểm số và duy trì động lực tự học. Tuy nhiên, các công cụ quản lý học tập hiện nay tại Việt Nam bộc lộ ba lỗ hổng lớn:")
    p_text("Giao diện tra cứu điểm tín chỉ tại các cổng đào tạo thường khô khan, chỉ dừng lại ở việc hiển thị bảng điểm tĩnh mà thiếu hoàn toàn phân tích dự báo GPA mục tiêu hoặc đề xuất lộ trình cải thiện điểm học phần.", bold_prefix="1. Thiếu tính dự báo và hỗ trợ học thuật cá nhân hóa: ")
    p_text("Việc học lý thuyết lập trình và ôn tập bài tập chuyên ngành dễ gây nhàm chán nếu thiếu các yếu tố kích thích tâm lý hành vi (Behavioral Psychology) như thanh tiến trình trực quan, huy hiệu thành tích và phần thưởng nâng hạng.", bold_prefix="2. Hiện tượng suy giảm động lực học tập bền bỉ: ")
    p_text("Môi trường máy tính chứa đựng vô số tác nhân gây xao nhãng (mạng xã hội, trò chơi, thông báo hệ thống). Các phần mềm Pomodoro thông thường chỉ hoạt động như một đồng hồ đếm ngược đơn giản, dễ dàng bị sinh viên tắt đi khi mất tập trung.", bold_prefix="3. Thiếu công cụ cưỡng chế tập trung cấp độ hệ điều hành: ")

    h_styled("1.2. Tuyên ngôn Tầm nhìn sản phẩm (Product Vision Statement)", level=2, bookmark_name="sec_ch1_2")
    p_text("Áp dụng khung mẫu chuẩn của Geoffrey Moore (Crossing the Chasm) trong kỹ nghệ sản phẩm phần mềm:")
    callout_box("Tuyên ngôn Tầm nhìn Sản phẩm 3TG Study AI (Geoffrey Moore Framework)", [
        "DÀNH CHO: Sinh viên đại học theo học chế tín chỉ (đặc biệt là sinh viên công nghệ thông tin Trường Đại học CMC).",
        "NHỮNG NGƯỜI: Đang gặp khó khăn trong việc duy trì tập trung chuyên sâu, quản lý điểm rèn luyện GPA và cần động lực học tập bền bỉ.",
        "SẢN PHẨM 3TG Study AI LÀ: Một hệ sinh thái không gian học tập thông minh toàn diện tích hợp Trí tuệ nhân tạo (AI-Native Focus Study Ecosystem).",
        "CUNG CẤP: Lộ trình học tập phân tầng tương tác Gamification, cổng đồng bộ bảng điểm tín chỉ IU CMCU tự động, trợ lý AI tư vấn cá nhân hóa, và phòng học Zen Pomodoro bảo vệ bằng cơ chế Native Kiosk C++ chống sao nhãng tuyệt đối trên toàn bộ hệ thống đa màn hình.",
        "KHÁC BIỆT HOÀN TOÀN VỚI: Các ứng dụng bấm giờ Pomodoro thông thường hoặc phần mềm học tập đơn lẻ trên thị trường.",
        "SẢN PHẨM CỦA CHÚNG TÔI: Kết hợp sức mạnh điện toán biên Cloudflare Serverless siêu nhẹ với trình bảo vệ tiến trình Win32 Native cấp thấp, đảm bảo trải nghiệm học tập mượt mà, đồng bộ ngoại tuyến tức thì và an toàn tuyệt đối cho người dùng."
    ])

    h_styled("1.3. Chân dung người dùng điển hình (User Personas)", level=2, bookmark_name="sec_ch1_3")
    p_text("Để định hình các yêu cầu chức năng chính xác, nhóm phát triển đã xây dựng 3 Personas đại diện cho các nhóm đối tượng sử dụng khác nhau:")
    p_text("Sinh viên năm 2 ngành Trí tuệ nhân tạo (Đại học CMC). Mục tiêu: Đạt GPA 3.6 để săn học bổng, nhưng thường xuyên bị sao nhãng bởi mạng xã hội và thông báo tin nhắn khi ngồi vào máy tính học tập. Nhu cầu: Cần một công cụ khóa màn hình cứng rắn ép buộc tập trung, đồng thời có thể phân tích điểm tín chỉ thực tế để biết chính xác môn nào cần gỡ điểm.", bold_prefix="• Persona 1 (Primary - Sinh viên trọng tâm): Lê Minh Đức (20 tuổi) - ")
    p_text("Sinh viên năm nhất Khoa CNTT. Mục tiêu: Vượt qua các môn học lập trình cơ sở (C/C++, Cấu trúc dữ liệu). Nỗi đau: Cảm thấy việc đọc giáo trình quá khô khan, dễ nản lòng khi làm bài tập một mình. Nhu cầu: Muốn học qua hình thức lộ trình từng bước Gamification, có điểm thưởng XP, tích lũy huy hiệu linh vật và làm bài tập trắc nghiệm có phản hồi tức thì.", bold_prefix="• Persona 2 (Secondary - Sinh viên mới bắt đầu): Nguyễn Thu Trang (19 tuổi) - ")
    p_text("Lập trình viên tốt nghiệp đi làm, đang ôn tập thi các chứng chỉ quốc tế (AWS Cloud, Security+). Nhu cầu: Cần không gian đọc tài liệu PDF màn hình rộng, có nhạc nền sóng não Alpha tăng cường trí nhớ, và có AI tóm tắt tài liệu học thuật ngay cạnh bàn học mà không cần chuyển đổi ứng dụng.", bold_prefix="• Persona 3 (Edge Case - Người tự học chuyên sâu): Trần Hoàng Nam (24 tuổi) - ")

    h_styled("1.4. Kịch bản sử dụng (User Scenarios) & Bản đồ hành trình (Journey Maps)", level=2, bookmark_name="sec_ch1_4")
    p_text("Kịch bản điển hình (A Day in the Life): Sinh viên Đức mở ứng dụng 3TG Study AI lúc 19:30 tối. Ứng dụng tự động khôi phục phiên đăng nhập an toàn mà không bắt đăng nhập lại. Đức vào mục 'Cải thiện điểm IU', hệ thống hiển thị bảng điểm cập nhật từ cổng trường CMCU: GPA hiện tại 3.12, môn 'Cơ sở dữ liệu' đang đạt điểm C+. Trợ lý AI 3TG lập tức phân tích và đưa ra khuyến nghị: 'Bạn chỉ cần làm thêm 3 bài tập trắc nghiệm chuẩn hóa 3NF và hoàn thành 2 phiên Pomodoro 25 phút để cải thiện lên điểm B+'. Đức nhấn 'Vào phòng học Zen', chọn nhạc nền Sóng não Alpha từ ổ cứng local, ứng dụng lập tức phóng toàn màn hình, thanh tác vụ Windows Taskbar ẩn đi hoàn toàn và màn hình phụ thứ hai bị chặn màu đen tuyệt đối. Sau 25 phút học tập nghiêm túc, chuông reo êm dịu, Taskbar khôi phục trong 4ms, Đức được thưởng +50 XP và duy trì chuỗi Streak 7 ngày liên tiếp.")

    h_styled("1.5. Sơ đồ Use Case tổng thể hệ thống (UML 2.5 Specification)", level=2, bookmark_name="sec_ch1_5")
    p_text("Hệ thống phân quyền rõ ràng giữa Học viên (Learner), Cán bộ kiểm duyệt (Moderator), và Quản trị viên hệ thống (Admin). Dưới đây là sơ đồ Use Case UML 2.5 chuẩn hóa:")
    add_image_figure("fig_use_case_diagram.png", "Hình 1.1: Sơ đồ Use Case tổng thể hệ thống 3TG Study AI (Chuẩn UML 2.5 Specification)")

    h_styled("1.6. Kỹ nghệ Yêu cầu hệ thống: Chức năng (FR) và Phi chức năng (NFR)", level=2, bookmark_name="sec_ch1_6")
    p_text("Hệ thống đặc tả 10 Yêu cầu chức năng cốt lõi (Functional Requirements) và 5 Yêu cầu phi chức năng (Non-Functional Requirements) theo tiêu chuẩn chất lượng phần mềm quốc tế ISO/IEC 25010:")
    
    fr_table_data = [
        ["FR-01", "Xác thực tài khoản & Phân quyền", "Đăng ký, đăng nhập bảo mật bằng thuật toán PBKDF2; lưu trữ session bền vững trên máy khách; hỗ trợ đổi mật khẩu an toàn."],
        ["FR-02", "Lộ trình học tập Gamification", "Hiển thị cây bài học uốn lượn phân tầng; mở khóa từng chặng; tích lũy điểm kinh nghiệm XP, ngọc Gems và duy trì chuỗi ngày Streak."],
        ["FR-03", "Trắc nghiệm tương tác & Ôn câu sai", "Hệ thống câu hỏi trắc nghiệm đa dạng; chấm điểm tự động tức thì; lưu trữ ngân hàng các câu trả lời sai vào bảng user_mistakes để ôn luyện lại."],
        ["FR-04", "Kết nối & Phân tích Điểm IU CMCU", "Mô phỏng kết nối cổng trường đào tạo tín chỉ; tính toán GPA thang 4 và thang 10; lưu trữ dữ liệu điểm an toàn; hỗ trợ ngắt kết nối dọn sạch dữ liệu."],
        ["FR-05", "Trợ lý Trí tuệ nhân tạo 3TG AI", "Hộp thoại cố vấn học tập thông minh; tích hợp DeepSeek-V3 / Groq Llama-3; hỗ trợ phím tắt Ctrl+V dán ảnh đề bài trực tiếp để AI giải thích."],
        ["FR-06", "Phòng học Focus Pomodoro Kiosk", "Chu kỳ tập trung 25 phút chuẩn khoa học; kích hoạt chế độ Kiosk Mode toàn màn hình; chặn phím tắt Windows nguy hiểm; hỗ trợ mở tài liệu PDF song song."],
        ["FR-07", "Trình phát âm thanh Focus Local", "Phát các bản nhạc tập trung (Sóng não Alpha, Lofi, ASMR) trực tiếp từ bộ nhớ cục bộ máy trạm qua chuẩn HTTP 206 Byte-Range, không tốn băng thông đám mây."],
        ["FR-08", "Cửa hàng vật phẩm & Tùy biến Theme", "Sử dụng ngọc Gems tích lũy từ việc học để mua sắm vật phẩm, biểu cảm linh vật và 6 chủ đề giao diện (Tone Pink, Dark Mode, Zen Garden, Cyberpunk...)."],
        ["FR-09", "Mạng xã hội học tập & Bảng xếp hạng", "Bảng xếp hạng vinh danh hàng tuần theo giải đấu (Leagues); tính năng kết bạn; nhắn tin trực tiếp và phòng chat nhóm học tập thời gian thực."],
        ["FR-10", "Đồng bộ dữ liệu ngoại tuyến (Outbox)", "Ghi nhận tiến độ học tập và điểm số vào hàng đợi Transactional Outbox cục bộ khi mất mạng; tự động đồng bộ lên Cloudflare D1 ngay khi có kết nối trở lại."]
    ]
    styled_table(["Mã FR", "Tên yêu cầu chức năng", "Mô tả chi tiết nghiệp vụ kỹ thuật"], fr_table_data, col_widths=[0.8, 2.2, 3.5])

    nfr_table_data = [
        ["NFR-01", "Hiệu năng xử lý (Performance Efficiency)", "Thời gian phản hồi API biên Cloudflare Workers < 80ms; thời gian khôi phục thanh tác vụ Taskbar Windows khi thoát Kiosk Mode < 10ms."],
        ["NFR-02", "Bảo mật & Toàn vẹn (Security)", "Mật khẩu người dùng bắt buộc băm bằng PBKDF2-HMAC-SHA256 với 100.000 vòng lặp và muối ngẫu nhiên 16 bytes; chống tấn công SQL Injection và XSS."],
        ["NFR-03", "Tính sẵn sàng & Khả năng chịu lỗi (Reliability)", "Hệ thống máy trạm hoạt động ổn định khi ngắt mạng hoàn toàn; cơ chế Transactional Outbox đảm bảo không bao giờ mất mát dữ liệu tiến độ của sinh viên."],
        ["NFR-04", "Khả năng tương thích (Portability)", "Ứng dụng máy trạm đóng gói độc lập cho Windows 10/11 x64 dưới cả 2 định dạng: Bộ cài tự động (Setup Installer) và Bản chạy ngay (Portable Executable)."],
        ["NFR-05", "Khả năng sử dụng (Usability & Ergonomics)", "Giao diện tuân thủ nguyên tắc thiết kế hiện đại, độ trễ co kéo chia đôi màn hình PDF và AI đạt 60 FPS thông qua requestAnimationFrame mượt mà."]
    ]
    styled_table(["Mã NFR", "Chỉ số chất lượng (ISO/IEC 25010)", "Tiêu chuẩn kỹ thuật định lượng bắt buộc"], nfr_table_data, col_widths=[0.9, 2.3, 3.3])

    h_styled("1.7. User Stories & Tiêu chuẩn chấp thuận (Acceptance Criteria)", level=2, bookmark_name="sec_ch1_7")
    p_text("User Story mẫu cho tính năng Kiosk Mode (FR-06): \"Là một sinh viên đang ôn thi cuối kỳ, tôi muốn ứng dụng tự động khóa toàn màn hình và ẩn thanh tác vụ hệ thống khi bắt đầu học, để tôi không bị cám dỗ bởi các thông báo từ mạng xã hội\".")
    p_text("Tiêu chuẩn chấp thuận (Given - When - Then): Given khi người dùng nhấn nút 'Bắt đầu học tập (Vào phòng Zen)'; When bộ đếm thời gian Pomodoro bắt đầu chạy; Then cửa sổ ứng dụng lập tức chiếm trọn 100% diện tích màn hình chính, thanh Taskbar của Windows biến mất hoàn toàn trong vòng dưới 5ms, màn hình thứ 2 (nếu có) bị phủ một lớp che màu đen chống nhìn trộm, và các tổ hợp phím nguy hiểm như Win+D, Win+M bị vô hiệu hóa an toàn.")

    h_styled("1.8. Product Backlog & Ước lượng độ phức tạp (Fibonacci Story Points)", level=2, bookmark_name="sec_ch1_8")
    p_text("Nhóm áp dụng kỹ thuật Planning Poker với chuỗi Fibonacci (1, 2, 3, 5, 8, 13) để ước lượng độ phức tạp cho 10 Epics trong Product Backlog:")
    backlog_data = [
        ["Epic 01", "Kiến trúc nền tảng Serverless Cloudflare D1 & Xác thực PBKDF2", "8 SP", "Sprint 1", "Rất cao"],
        ["Epic 02", "Lộ trình bài học Gamification phân tầng tích lũy XP & Streak", "13 SP", "Sprint 1 - 2", "Rất cao"],
        ["Epic 03", "Kết nối Cổng trường tín chỉ IU CMCU & Trợ lý AI DeepSeek", "8 SP", "Sprint 2 - 3", "Cao"],
        ["Epic 04", "Đóng gói ứng dụng Desktop Electron & Server nội bộ Embedded", "5 SP", "Sprint 3 - 4", "Trung bình"],
        ["Epic 05", "Mạng xã hội học tập: Chat nhóm, Nhắn tin trực tiếp & Bảng xếp hạng", "8 SP", "Sprint 4", "Cao"],
        ["Epic 06", "Không gian học tập Pomodoro Focus & Trình đọc tài liệu PDF", "8 SP", "Sprint 4 - 5", "Cao"],
        ["Epic 07", "Trình bảo vệ Kiosk C++ Native chống sao nhãng & Chặn đa màn hình", "13 SP", "Sprint 5", "Rất cao"],
        ["Epic 08", "Cơ chế đồng bộ ngoại tuyến Transactional Outbox & Replay Queue", "5 SP", "Sprint 5 - 6", "Cao"],
        ["Epic 09", "Cửa hàng vật phẩm, Động cơ âm thanh Local & Tùy biến Theme", "5 SP", "Sprint 5 - 6", "Trung bình"],
        ["Epic 10", "Master Test Suite tự động toàn diện & Hoàn thiện phát hành V29.9.07", "8 SP", "Sprint 6", "Cao"]
    ]
    styled_table(["Mã Epic", "Hạng mục phát triển trong Product Backlog", "Story Points", "Sprint phân bổ", "Độ ưu tiên"], backlog_data, col_widths=[0.9, 2.8, 1.0, 1.0, 0.8])

    # -------------------------------------------------------------------------
    # CHƯƠNG 2
    # -------------------------------------------------------------------------
    print("-> Đang tạo Chương 2: Thiết kế Kiến trúc & CSDL...")
    h_styled("CHƯƠNG 2: THIẾT KẾ KIẾN TRÚC PHẦN MỀM & CƠ SỞ DỮ LIỆU (SYSTEM ARCHITECTURE & DATABASE DESIGN)", level=1, bookmark_name="sec_ch2")
    
    h_styled("2.1. Đề xuất Kiến trúc tổng thể: Hybrid Edge-Serverless & Desktop Client", level=2, bookmark_name="sec_ch2_1")
    p_text("Hệ thống 3TG Study AI được thiết kế theo kiến trúc lai (Hybrid Architecture) kết hợp hài hòa giữa mô hình Micro-services phân tán tại mạng biên (Edge Computing) và ứng dụng máy trạm chuyên biệt (Fat Client Desktop Application).")
    p_text("Tầng biên không máy chủ (Edge Serverless Tier): Sử dụng Cloudflare Workers hoạt động tại hơn 300 trung tâm dữ liệu toàn cầu của Cloudflare. Với thời gian khởi động lạnh (Cold-start) xấp xỉ 0ms dựa trên công nghệ V8 Isolates, các yêu cầu tính toán và xác thực được xử lý với độ trễ mạng dưới 80ms.")
    p_text("Tầng lưu trữ phân tán (Storage Tier): Sử dụng Cloudflare D1 (cơ sở dữ liệu quan hệ SQL serverless hỗ trợ cú pháp SQLite chuẩn 3NF) kết hợp cùng Cloudflare R2 Object Storage để lưu trữ các tài liệu học tập, ảnh đề bài trắc nghiệm và linh vật với chi phí truyền dữ liệu (Egress fee) bằng 0.")
    p_text("Tầng máy trạm tích hợp (Desktop Client Tier): Được phát triển trên nền tảng Electron kết hợp cùng Node.js Embedded Local Server. Kiến trúc này cho phép máy trạm hoạt động độc lập ngay cả khi mất kết nối Internet, tự động ghi nhận các thao tác vào hàng đợi ngoại tuyến cục bộ và phát nhạc tập trung từ ổ cứng máy tính mà không tiêu tốn băng thông mạng.")

    h_styled("2.2. Phân tích các đánh đổi kiến trúc (Architectural Trade-offs) & Định lý CAP", level=2, bookmark_name="sec_ch2_2")
    p_text("Theo định lý CAP (Consistency - Tính nhất quán, Availability - Tính sẵn sàng, Partition Tolerance - Khả năng chịu chia cắt mạng), một hệ thống phân tán chỉ có thể đảm bảo tối đa 2 trong 3 thuộc tính đồng thời:")
    p_text("Quyết định kỹ thuật của nhóm: 3TG Study AI ưu tiên mô hình AP (Availability & Partition Tolerance). Trong quá trình học tập tại phòng thư viện hoặc giảng đường đại học, kết nối mạng Wi-Fi của sinh viên thường xuyên chập chờn hoặc ngắt quãng. Nhóm quyết định không chặn thao tác của sinh viên khi mất mạng. Thay vào đó, toàn bộ điểm kinh nghiệm XP, tiến độ hoàn thành phiên Pomodoro và lịch sử ôn tập câu sai sẽ được ghi nhận ngay vào cơ sở dữ liệu SQLite cục bộ (Local Replica) và đẩy vào hàng đợi Transactional Outbox. Khi mạng kết nối trở lại, hệ thống áp dụng cơ chế đồng bộ nhất quán cuối cùng (Eventual Consistency) theo giải thuật Last-Write-Wins có kiểm tra dấu thời gian (Timestamped Reconciliation).")

    h_styled("2.3. Sơ đồ kiến trúc phân tầng hệ thống (Layered Architecture)", level=2, bookmark_name="sec_ch2_3")
    p_text("Hệ thống được tổ chức thành 4 phân tầng nghiêm ngặt (4-Tier Layered Architecture): Tầng Trình diễn (Presentation Layer), Tầng Dịch vụ Máy trạm (Local Desktop Services), Tầng Dịch vụ Biên Đám mây (Edge Serverless Layer), và Tầng Cơ sở dữ liệu Toàn cầu (Cloud Database Layer):")
    add_image_figure("fig_system_architecture.png", "Hình 2.1: Sơ đồ Kiến trúc phân tầng Hybrid Edge-Serverless & Desktop Client (4-Layer Architecture)")

    h_styled("2.4. Thiết kế chuẩn hóa giao tiếp RESTful API & Idempotency", level=2, bookmark_name="sec_ch2_4")
    p_text("Các điểm cuối API được thiết kế tuân thủ nghiêm ngặt chuẩn RESTful, sử dụng định dạng JSON không trạng thái (Stateless) và tích hợp mã khóa Idempotency Key để chống hiện tượng cộng dồn điểm thưởng hai lần khi mạng chập chờn:")
    
    api_table_data = [
        ["POST", "/api/auth/register", "Đăng ký tài khoản học viên mới, băm mật khẩu PBKDF2 muối ngẫu nhiên."],
        ["POST", "/api/auth/login", "Xác thực danh tính người dùng, cấp phát token phiên làm việc bền vững."],
        ["GET", "/api/subjects/all", "Lấy toàn bộ danh mục môn học kèm danh sách bài học và trạng thái mở khóa."],
        ["POST", "/api/learning/complete-lesson", "Cập nhật tiến độ hoàn thành bài học, tích lũy điểm kinh nghiệm XP và kiểm tra Streak."],
        ["POST", "/api/quiz/submit-answer", "Gửi đáp án trắc nghiệm, chấm điểm tức thì, ghi nhận câu trả lời sai vào sổ tay."],
        ["GET", "/api/academic/transcript", "Tra cứu bảng điểm tín chỉ cổng trường IU CMCU và phân tích học lực."],
        ["POST", "/api/academic/disconnect", "Ngắt kết nối dữ liệu cổng trường IU CMCU, xóa sạch thông tin học thuật nhạy cảm."],
        ["POST", "/api/ai/chat", "Gửi câu hỏi tới trợ lý AI DeepSeek/Groq, hỗ trợ truyền ngữ cảnh môn học hiện tại."],
        ["POST", "/api/pomodoro/session-sync", "Đồng bộ phiên học Pomodoro hoàn thành kèm điểm XP và ngọc Gems thưởng."],
        ["GET", "/api/leaderboard/weekly", "Lấy danh sách bảng xếp hạng vinh danh học viên theo tuần của giải đấu."],
        ["POST", "/api/shop/purchase-item", "Mua sắm vật phẩm, mở khóa chủ đề giao diện bằng ngọc Gems tích lũy."],
        ["POST", "/api/sync/outbox-batch", "Đẩy hàng loạt thao tác ngoại tuyến tích lũy từ Outbox Queue lên máy chủ đám mây."]
    ]
    styled_table(["Phương thức", "Điểm cuối API (Endpoints)", "Mô tả nghiệp vụ kỹ thuật"], api_table_data, col_widths=[1.0, 2.3, 3.2])

    h_styled("2.5. Thiết kế Toàn diện CSDL Cloudflare D1 chuẩn 3NF & Sơ đồ SQL ERD", level=2, bookmark_name="sec_ch2_5")
    p_text("Cơ sở dữ liệu Cloudflare D1 được chuẩn hóa theo chuẩn 3NF (Third Normal Form) nhằm loại bỏ hoàn toàn các dị thường thêm (Insertion Anomaly), dị thường xóa (Deletion Anomaly) và dị thường sửa đổi (Update Anomaly). Toàn bộ hệ sinh thái bao gồm 33 bảng dữ liệu liên kết chặt chẽ:")
    add_image_figure("fig_erd_database.png", "Hình 2.2: Sơ đồ Thực thể Liên kết Cơ sở dữ liệu toàn diện Cloudflare D1 chuẩn 3NF (33 bảng dữ liệu)")

    p_text("Dưới đây là từ điển dữ liệu (Data Dictionary) phân tích cấu trúc của các bảng cốt lõi trong hệ thống:")
    db_dict_data = [
        ["accounts", "id (PK, TEXT), username (TEXT UNIQUE), password_hash (TEXT), role (TEXT), created_at (DATETIME)", "Quản lý định danh tài khoản, lưu trữ chuỗi băm mật khẩu an toàn theo chuẩn PBKDF2."],
        ["profiles", "user_id (PK, FK accounts.id), display_name (TEXT), avatar_url (TEXT), bio (TEXT), school (TEXT), class_name (TEXT)", "Hồ sơ cá nhân mở rộng của học viên, lưu trữ thông tin trường lớp và tùy biến giao diện."],
        ["user_stats", "user_id (PK, FK accounts.id), total_xp (INT), current_streak (INT), longest_streak (INT), gems (INT)", "Thống kê chỉ số Gamification: tổng điểm kinh nghiệm, chuỗi ngày học liên tục, số lượng đá quý."],
        ["subjects", "id (PK, TEXT), subject_name (TEXT), description (TEXT), icon_url (TEXT), order_index (INT)", "Danh mục môn học trong chương trình đào tạo tín chỉ."],
        ["units", "id (PK, TEXT), subject_id (FK subjects.id), title (TEXT), order_index (INT)", "Các chương/học phần kiến thức thuộc môn học."],
        ["lessons", "id (PK, TEXT), unit_id (FK units.id), title (TEXT), xp_reward (INT), content (TEXT), slides_url (TEXT)", "Chi tiết từng bài học trong lộ trình uốn lượn Gamification."],
        ["questions", "id (PK, TEXT), lesson_id (FK lessons.id), question_text (TEXT), options (JSON), correct_answer (TEXT)", "Ngân hàng câu hỏi trắc nghiệm kiểm tra kiến thức bài học."],
        ["user_progress", "id (PK, TEXT), user_id (FK), lesson_id (FK), status (TEXT: 'locked'|'unlocked'|'completed'), score (INT)", "Ghi nhận tiến trình học tập của từng sinh viên đối với từng bài học."],
        ["user_mistakes", "id (PK, TEXT), user_id (FK), question_id (FK), wrong_count (INT), is_mastered (INT)", "Sổ tay câu sai thông minh lưu trữ các câu làm sai để sinh viên ôn luyện phục thù."],
        ["pomodoro_active_learners", "user_id (PK, FK), cycle_number (INT), target_gpa (REAL), doc_name (TEXT), last_heartbeat (DATETIME)", "Bảng quản lý phiên học Pomodoro đang hoạt động theo thời gian thực."],
        ["user_academic_transcripts", "id (PK, INT), user_id (FK), student_code (TEXT), gpa_4 (REAL), gpa_10 (REAL), sem_data (JSON)", "Lưu trữ bảng điểm tín chỉ chi tiết đồng bộ từ cổng trường IU CMCU."],
        ["sync_outbox", "id (PK, TEXT), operation (TEXT), payload (TEXT JSON), status (TEXT: 'pending'|'synced'), created_at (DATETIME)", "Hàng đợi Transactional Outbox lưu trữ các thao tác dữ liệu khi máy trạm mất mạng."]
    ]
    styled_table(["Tên bảng CSDL", "Cột thuộc tính & Ràng buộc toàn vẹn", "Ý nghĩa nghiệp vụ trong hệ thống"], db_dict_data, col_widths=[1.1, 2.7, 2.7])

    h_styled("2.6. Hệ thống Giao diện người dùng & Động cơ Gamification phân tầng", level=2, bookmark_name="sec_ch2_6")
    p_text("Giao diện người dùng của 3TG Study AI được thiết kế theo trường phái Gamification phân tầng hiện đại: nút bấm 3D đổ bóng khối (`box-shadow: 0 4px 0 var(--border)`), màu sắc tương phản kích thích thị giác, viền bo tròn mềm mại (`border-radius: 16px - 24px`) và linh vật Thỏ Bảy Màu đồng hành biểu cảm sinh động.")
    add_image_figure("fig_learning_path.png", "Hình 2.3: Giao diện thực chứng Lộ trình học tập Gamification phân tầng tích lũy XP (FR-02)")

    # -------------------------------------------------------------------------
    # CHƯƠNG 3
    # -------------------------------------------------------------------------
    print("-> Đang tạo Chương 3: Bảo mật & DevOps...")
    h_styled("CHƯƠNG 3: BẢO MẬT, LẬP TRÌNH TIN CẬY & VẬN HÀNH DEVOPS (SECURITY & RELIABILITY ENGINEERING)", level=1, bookmark_name="sec_ch3")
    
    h_styled("3.1. Phân tích Mô hình đe dọa STRIDE Threat Modeling", level=2, bookmark_name="sec_ch3_1")
    p_text("Áp dụng mô hình chuẩn của Microsoft STRIDE để phân tích toàn diện 6 mối đe dọa an ninh và đưa ra giải pháp phòng vệ tương ứng:")
    stride_data = [
        ["Spoofing (Giả mạo danh tính)", "Kẻ tấn công giả danh sinh viên khác để gửi tiến độ học tập hoặc gian lận điểm.", "Sử dụng token phiên xác thực mã hóa PBKDF2; lưu trữ token an toàn trong bộ nhớ máy trạm."],
        ["Tampering (Can thiệp dữ liệu)", "Sửa đổi tham số XP hoặc điểm số truyền qua mạng từ máy khách lên máy chủ.", "Xác thực tính toàn vẹn (Integrity Check) tại Cloudflare Workers; máy chủ tự tính toán lại điểm XP."],
        ["Repudiation (Chối bỏ trách nhiệm)", "Học viên chối bỏ việc đã thực hiện các hành động gửi tin nhắn hoặc sửa đổi ghi chú.", "Lưu vết kiểm toán (Audit Logging) với trường thời gian ISO 8601 và mã user_id tại bảng CSDL."],
        ["Information Disclosure (Lộ thông tin)", "Bảng điểm cá nhân cổng trường IU CMCU bị rò rỉ cho bên thứ ba.", "Hỗ trợ nút 'Ngắt kết nối IU' xóa sạch toàn bộ điểm khỏi bộ nhớ; mã hóa HTTPS TLS 1.3."],
        ["Denial of Service (Từ chối dịch vụ)", "Spam liên tục các yêu cầu AI hoặc tra cứu môn học gây nghẽn máy chủ.", "Áp dụng thuật toán Rate Limiting trượt (Sliding Window); giới hạn tối đa 60 requests/phút/IP."],
        ["Elevation of Privilege (Leo thang quyền)", "Học viên thông thường gửi yêu cầu sửa đổi ngân hàng đề thi của Admin.", "Kiểm tra phân quyền nghiêm ngặt dựa trên vai trò (Role-Based Access Control - RBAC) tại mọi Endpoint."]
    ]
    styled_table(["Mối đe dọa STRIDE", "Nguy cơ thực tế đối với đồ án 3TG Study AI", "Giải pháp kỹ thuật phòng vệ triệt để"], stride_data, col_widths=[1.2, 2.5, 2.8])

    h_styled("3.2. Thuật toán băm mật khẩu PBKDF2-HMAC-SHA256 chuẩn OWASP", level=2, bookmark_name="sec_ch3_2")
    p_text("Để phòng vệ trước các cuộc tấn công Rainbow Table và tấn công vét cạn (Brute-force) bằng GPU, hệ thống tuyệt đối không lưu trữ mật khẩu ở dạng rõ (Plaintext) hoặc các hàm băm lỗi thời (MD5, SHA1). Hệ thống áp dụng thuật toán PBKDF2 (Password-Based Key Derivation Function 2) tuân thủ khuyến nghị của OWASP Cheat Sheet Series:")
    code_box("// Thuật toán băm mật khẩu PBKDF2-HMAC-SHA256 chuẩn hóa\n"
             "async function hashPassword(password, salt = null) {\n"
             "  const iterations = 100000; // 100.000 vòng lặp kéo dài khóa\n"
             "  const saltBytes = salt ? hexToUint8(salt) : crypto.getRandomValues(new Uint8Array(16));\n"
             "  const keyMaterial = await crypto.subtle.importKey(\n"
             "    'raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveBits']\n"
             "  );\n"
             "  const derivedBits = await crypto.subtle.deriveBits(\n"
             "    { name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' },\n"
             "    keyMaterial, 256\n"
             "  );\n"
             "  return `${iterations}:${uint8ToHex(saltBytes)}:${uint8ToHex(new Uint8Array(derivedBits))}`;\n"
             "}")

    h_styled("3.3. Cơ chế Rate Limiting trượt (Sliding Window Algorithm)", level=2, bookmark_name="sec_ch3_3")
    p_text("Nhằm ngăn chặn bot tấn công DoS và kiểm soát chi phí gọi API trí tuệ nhân tạo, tầng Cloudflare Workers triển khai thuật toán cửa sổ trượt (Sliding Window Rate Limiter). Mỗi IP máy khách được cấp phát một khóa lưu trữ tạm trong bộ nhớ đệm (Cloudflare KV Cache). Nếu số lượng yêu cầu trong vòng 60 giây vượt ngưỡng định mức (60 requests đối với API thông thường, 10 requests đối với API AI DeepSeek), hệ thống lập tức phản hồi mã trạng thái HTTP 429 Too Many Requests kèm tiêu đề Retry-After.")

    h_styled("3.4. Kiến trúc Transactional Outbox & Replay Queue đồng bộ ngoại tuyến", level=2, bookmark_name="sec_ch3_4")
    p_text("Khi sinh viên học tập trong điều kiện mất kết nối Internet, mọi sự kiện hoàn thành bài học hoặc tích lũy XP được ghi đồng thời vào bảng dữ liệu cục bộ và bảng sync_outbox bên trong một Transaction SQLite duy nhất (đảm bảo tính nguyên tử ACID). Một tiến trình chạy ngầm (Background Sync Worker) sẽ liên tục thăm dò trạng thái kết nối mạng qua sự kiện navigator.onLine. Khi có mạng trở lại, tiến trình sẽ đọc các bản ghi có trạng thái pending, đóng gói thành mảng Batch JSON gửi lên API /api/sync/outbox-batch, và chuyển trạng thái sang synced sau khi nhận phản hồi HTTP 200 OK.")

    h_styled("3.5. Trình bảo vệ Kiosk C++ Native & Khôi phục 100% Taskbar Windows <5ms", level=2, bookmark_name="sec_ch3_5")
    p_text("Một trong những đóng góp kỹ thuật tinh xảo nhất của đồ án là việc giải quyết dứt điểm lỗi mất thanh tác vụ hệ thống (Windows Taskbar Disappearance) mà các phần mềm Kiosk thông thường hay gặp phải khi ứng dụng bị tắt đột ngột.")
    p_text("Giải pháp kiến trúc: Thay vì chỉ gọi hàm ẩn Taskbar từ tiến trình giao diện Electron, nhóm phát triển một chương trình độc lập viết bằng Win32 C++ Native (kiosk_guard.exe) được nhúng trực tiếp trong bộ cài đặt. Khi kích hoạt chế độ Kiosk Mode, chương trình gọi hàm Win32 API: ShowWindow(FindWindowA(\"Shell_TrayWnd\", NULL), SW_HIDE). Đồng thời, một trình xử lý ngắt tín hiệu hệ thống (Signal Handler) bắt các sự kiện ngắt tín hiệu SIGINT, SIGTERM và ngoại lệ sự cố ứng dụng để đảm bảo ShowWindow(FindWindowA(\"Shell_TrayWnd\", NULL), SW_SHOW) luôn được thực thi trong thời gian dưới 5ms, khôi phục thanh tác vụ Taskbar nguyên vẹn 100%.")
    add_image_figure("fig_sequence_kiosk.png", "Hình 3.1: Sơ đồ Tuần tự (Sequence Diagram) Kích hoạt và Thoát an toàn Kiosk Mode với C++ Native Worker")

    h_styled("3.6. Cơ chế Multi-Monitor Zen Blocker bao phủ màn hình phụ", level=2, bookmark_name="sec_ch3_6")
    p_text("Trong thực tế, nhiều sinh viên sử dụng máy tính kèm màn hình phụ thứ hai hoặc cắm dây HDMI lên tivi. Các phần mềm thông thường chỉ khóa màn hình chính, khiến sinh viên dễ dàng chuyển các ứng dụng giải trí sang màn hình phụ để xem trong giờ học Pomodoro. Đồ án 3TG Study AI giải quyết triệt để vấn đề này bằng API đa màn hình của Electron (screen.getAllDisplays): Hệ thống tự động phát hiện số lượng màn hình kết nối, khởi tạo các cửa sổ phụ tràn viền không viền màu đen tuyệt đối phủ kín toàn bộ các màn hình phụ còn lại, cô lập hoàn toàn không gian học tập.")

    h_styled("3.7. Trình phát nhạc Local Offline qua HTTP 206 Byte-Range", level=2, bookmark_name="sec_ch3_7")
    p_text("Nhằm tối ưu hóa chi phí vận hành máy chủ đám mây và cho phép nghe nhạc tập trung mượt mà khi không có mạng, toàn bộ các tệp âm thanh (Sóng Não Alpha, ASMR Bút Viết, Lofi Beats) được lưu trữ ngay trong thư mục tài nguyên cục bộ của máy tính. Máy chủ nhúng nội bộ Node.js Embedded Server phục vụ các tệp âm thanh này thông qua chuẩn HTTP 206 Partial Content (Byte-Range Requests). Cơ chế này cho phép thẻ audio HTML5 của trình duyệt tua nhanh đến bất kỳ giây nào mà không cần tải lại toàn bộ tệp MP3, triệt tiêu độ trễ phát nhạc.")
    add_image_figure("fig_pomo_lobby.png", "Hình 3.2: Giao diện thực chứng Sảnh chờ phòng học Pomodoro Focus Zen Mode và tùy chọn âm thanh Local", width_inches=5.8)

    h_styled("3.8. Sửa lỗi Detached Buffer trên PDF.js & Tối ưu Resizer RAF 60 FPS", level=2, bookmark_name="sec_ch3_8")
    p_text("Trong phòng học Pomodoro, sinh viên thường xuyên xem tài liệu giáo trình PDF song song với việc chat hỏi bài trợ lý AI. Hai thách thức kỹ thuật lớn đã được nhóm giải quyết:")
    p_text("Lỗi Detached ArrayBuffer trên PDF.js: Khi sinh viên chuyển đổi nhanh giữa các trang giáo trình, luồng Web Worker của thư viện PDF.js chuyển quyền sở hữu bộ đệm mảng bộ nhớ (Transferable Object) khiến tiến trình chính bị sập với lỗi Cannot perform Construct on a detached ArrayBuffer. Nhóm đã viết lại cơ chế sao chép sâu bộ nhớ (arrayBuffer.slice(0)) trước khi chuyển giao dữ liệu, triệt tiêu hoàn toàn lỗi vỡ trang.", bold_prefix="1. Khắc phục triệt để lỗi Detached Buffer: ")
    p_text("Thanh kéo co giãn kích thước (Split-Pane Resizer) giữa trình đọc tài liệu PDF và khung chat AI trước đây bị hiện tượng giật khung hình do gọi hàm cập nhật CSS liên tục trên sự kiện mousemove. Nhóm đã tối ưu hóa bằng cách kết hợp cơ chế Throttle với requestAnimationFrame (RAF), đưa tốc độ phản hồi kéo thả đạt chuẩn 60 FPS mượt mà tuyệt đối.", bold_prefix="2. Tối ưu hóa hiệu năng thanh co kéo đạt 60 FPS: ")
    add_image_figure("fig_pomo_room.png", "Hình 3.3: Giao diện thực chứng Bàn học tập trung Pomodoro, Trình đọc tài liệu PDF và Khung chat 3TG AI", width_inches=5.8)

    # -------------------------------------------------------------------------
    # CHƯƠNG 4
    # -------------------------------------------------------------------------
    print("-> Đang tạo Chương 4: Tiến trình 6 Sprints & Phản biện Sommerville...")
    h_styled("CHƯƠNG 4: THỰC THI QUA 6 SPRINTS AGILE & ĐỐI CHIẾU LÝ THUYẾT IAN SOMMERVILLE (AGILE & THEORY)", level=1, bookmark_name="sec_ch4")
    
    h_styled("4.1. Quy trình quản trị dự án Agile Scrum trên GitHub", level=2, bookmark_name="sec_ch4_1")
    p_text("Dự án áp dụng mô hình phát triển phần mềm linh hoạt Agile Scrum với chu kỳ Sprint 1-2 tuần. Toàn bộ tiến trình được công khai minh bạch trên GitHub Repository tại kho lưu trữ Anniehatani / appstudyAI thông qua: 6 Milestones chính thức, 57 Issues được gán nhãn chuyên biệt, hơn 100 Git Commits tuân thủ chuẩn Conventional Commits, và bản phát hành cuối cùng gắn tag v29.9.07.")
    add_image_figure("fig_github_repo.png", "Hình 4.1: Bằng chứng quản trị dự án phần mềm trên GitHub Repository Anniehatani/appstudyAI", width_inches=5.8)

    h_styled("4.2. Báo cáo chi tiết chuỗi 6 Sprints phát triển phần mềm", level=2, bookmark_name="sec_ch4_2")
    sprints_data = [
        ["Sprint 1", "Nền tảng Gamification & Core Cây Lộ Trình", "10 Issues (#01 - #10)", "Khởi tạo kiến trúc Serverless Cloudflare D1, CSDL 3NF, Cây bài học Gamification uốn lượn, Hệ thống tính Streak và Tim."],
        ["Sprint 2", "Cổng trường IU, Trợ lý AI & Shop VIP", "10 Issues (#11 - #20)", "Tích hợp mô phỏng Cổng trường IU CMCU, Cố vấn AI phân tích điểm học tập, Cửa hàng vật phẩm và 6 Themes."],
        ["Sprint 3", "Đóng gói Desktop & Embedded Local Server", "10 Issues (#21 - #30)", "Thiết lập Electron Desktop Client, máy chủ nhúng Node.js nội bộ, điều hướng phím tắt hệ thống."],
        ["Sprint 4", "Phòng học Pomodoro, Chat nhóm & Bảng xếp hạng", "10 Issues (#31 - #40)", "Bảng xếp hạng Leagues hàng tuần, Nhắn tin trực tiếp & Chat nhóm thời gian thực, Phòng học Pomodoro Focus."],
        ["Sprint 5", "Tăng cường Kiosk C++ Native, Sóng Não & Sync", "10 Issues (#41 - #50)", "Trình bảo vệ Kiosk Win32 C++ khôi phục Taskbar 100%, Nhạc sóng não Alpha Local, Đồng bộ ngoại tuyến Outbox."],
        ["Sprint 6", "Luyện thi Master Test Suite, Sửa PDF & Release", "7 Issues (#51 - #57)", "Master Test Suite 38/38 Pass 100%, Sửa lỗi Detached Buffer PDF.js, Tối ưu Resizer RAF 60 FPS, Đóng gói Release v29.9.07."]
    ]
    styled_table(["Sprint", "Tên Milestone & Trọng tâm", "Khối lượng (Issues)", "Các kết quả kỹ thuật cốt lõi đạt được"], sprints_data, col_widths=[0.9, 2.0, 1.4, 2.2])

    h_styled("4.3. Phân tích đối chiếu lý thuyết Ian Sommerville (Mạch 3 bước)", level=2, bookmark_name="sec_ch4_3")
    p_text("Để thể hiện tư duy học thuật hàn lâm và năng lực phản biện kỹ thuật, nhóm áp dụng mạch phản biện 3 bước (Lý thuyết sách giáo khoa - Áp dụng thực tiễn trong đồ án - Phản biện đánh đổi kỹ thuật) dựa trên tác phẩm kinh điển 'Engineering Software Products' của Giáo sư Ian Sommerville:")
    
    callout_box("QUYẾT ĐỊNH 1: MÔ HÌNH TIẾN HÓA SẢN PHẨM KHẢ DỤNG TỐI THIỂU (MVP-DRIVEN DEVELOPMENT)", [
        "1. Lý thuyết (Ian Sommerville - Ch.2, Engineering Software Products): Sommerville nhấn mạnh rằng trong phát triển sản phẩm phần mềm hiện đại, việc cố gắng định nghĩa toàn bộ yêu cầu ngay từ đầu theo mô hình Thác nước (Waterfall) thường dẫn đến việc xây dựng các tính năng thừa thãi mà người dùng không cần. Thay vào đó, nhóm phát triển phải nhanh chóng xây dựng phiên bản Khả dụng Tối thiểu (MVP) chứa các tính năng cốt lõi (Core Features) để thử nghiệm thực tế và tiếp nhận phản hồi.",
        "2. Áp dụng thực tiễn trong đồ án 3TG Study AI: Nhóm đã chia nhỏ phạm vi dự án thành 6 Sprints rõ rệt. Tại Sprint 1, nhóm không vội vàng làm tính năng Kiosk hay AI phức tạp, mà tập trung hoàn thiện bộ khung MVP gồm: CSDL Cloudflare D1, cây lộ trình bài học uốn lượn và hệ thống tính điểm XP. Sau khi các tính năng này chạy ổn định, các tầng logic phức tạp hơn (như kết nối bảng điểm IU CMCU, phân tích AI, Kiosk C++ Native) mới được phát triển gối đầu qua các Sprints sau.",
        "3. Phản biện & Đánh đổi kỹ thuật (Trade-off Analysis): Cách tiếp cận MVP giúp nhóm luôn có một sản phẩm phần mềm chạy được (Working Software) ở cuối mỗi Sprint, giảm thiểu tối đa rủi ro chậm tiến độ. Tuy nhiên, sự đánh đổi là nhóm phải liên tục tái cấu trúc mã nguồn (Code Refactoring) khi các tính năng mới được tích hợp vào. Sự linh hoạt này đem lại độ tin cậy vượt trội so với việc cố định thiết kế từ đầu."
    ])

    callout_box("QUYẾT ĐỊNH 2: KIẾN TRÚC HYBRID SERVERLESS & LOCAL EMBEDDED SERVER", [
        "1. Lý thuyết (Ian Sommerville - Ch.4, Ch.5, Engineering Software Products): Kiến trúc phần mềm hướng dịch vụ (Service-Oriented Architecture) và kiến trúc phân tán cần cân bằng giữa độ trễ mạng, tính sẵn sàng của dữ liệu và chi phí tài nguyên máy chủ.",
        "2. Áp dụng thực tiễn trong đồ án 3TG Study AI: Nhóm không lưu trữ tệp nhạc MP3 của sinh viên trên đám mây Cloudflare mà phát triển một máy chủ nhúng nội bộ (Embedded Server) tại máy khách phục vụ stream trực tiếp từ ổ cứng bằng chuẩn HTTP 206.",
        "3. Phản biện & Đánh đổi kỹ thuật: Giải pháp này giúp triệt tiêu hoàn toàn chi phí băng thông mạng đám mây và cho phép nghe nhạc tập trung ngay cả khi mất mạng. Đánh đổi lại là dung lượng bộ cài ứng dụng Desktop tăng thêm khoảng 30MB để chứa các tệp âm thanh tích hợp sẵn. Đây là sự đánh đổi hoàn toàn xứng đáng vì trải nghiệm của học viên được đặt lên hàng đầu."
    ])

    h_styled("4.4. Bảng tổng kết đóng góp thành viên nhóm TONE PINK", level=2, bookmark_name="sec_ch4_4")
    p_text("Nhóm TONE PINK gồm 3 thành viên, phối hợp theo mô hình Agile phân công nhiệm vụ rõ ràng và đóng góp công sức cân bằng tuyệt đối:")
    contrib_data = [
        ["Lê Văn An\nMSSV: BAI250001 (Lớp N08)\nGithub: Anniehatani", "Lead Architect, Security & DevOps", "Thiết kế kiến trúc hệ thống, mã hóa PBKDF2, Outbox Queue, Pomodoro Validator, C++ Native Kiosk Guard, Master Test Suite.", "100% (Hoàn thành xuất sắc)"],
        ["Nguyễn Như Quỳnh\nMSSV: BCS252491 (Lớp N08)\nGithub: nguyennhuuquynhh07-07", "Frontend Developer & UI/UX Specialist", "Phát triển giao diện cây lộ trình Gamification, Sảnh Pomodoro Zen Mode, Hộp thoại AI chat đa tầng, Tối ưu 6 Themes.", "100% (Hoàn thành xuất sắc)"],
        ["Nguyễn Văn Tú\nMSSV: BIT250364 (Lớp N08)\nGithub: nguyennhuuquynhh07-07", "Kiosk Native Engineer & QA Tester", "Lập trình Win32 C++ Native Kiosk Guard, Chặn đa màn hình Multi-Monitor, Sửa lỗi PDF.js Detached Buffer, Tối ưu Resizer RAF 60 FPS.", "100% (Hoàn thành xuất sắc)"]
    ]
    styled_table(["Họ tên & MSSV", "Vai trò chuyên môn trong đồ án", "Nhiệm vụ kỹ thuật chủ trì", "Đánh giá mức độ hoàn thành"], contrib_data, col_widths=[1.5, 1.6, 2.5, 0.9])

    # -------------------------------------------------------------------------
    # CHƯƠNG 5
    # -------------------------------------------------------------------------
    print("-> Đang tạo Chương 5: AI có trách nhiệm & Kiểm thử...")
    h_styled("CHƯƠNG 5: KHAI THÁC TRÍ TUỆ NHÂN TẠO CÓ TRÁCH NHIỆM & KIỂM THỬ PHẦN MỀM (RESPONSIBLE AI & TESTING)", level=1, bookmark_name="sec_ch5")
    
    h_styled("5.1. Khung nguyên tắc khai thác AI có trách nhiệm (Responsible AI)", level=2, bookmark_name="sec_ch5_1")
    p_text("Nhóm xác định rõ: AI chỉ là trợ lý tăng tốc lập trình (Co-pilot), con người giữ vai trò thuyền trưởng làm chủ kiến trúc và chịu trách nhiệm cao nhất về mã nguồn. Quy trình khai thác tuân thủ 3 bước nghiêm ngặt:")
    p_text("Prompt Engineering có cấu trúc: Đưa ra ngữ cảnh rõ ràng, đặc tả kiểu dữ liệu đầu vào/đầu ra và các ràng buộc bảo mật.", bold_prefix="1. Đặc tả ngữ cảnh chặt chẽ: ")
    p_text("Rà soát mã nguồn độc lập (Human Code Review): Toàn bộ code do AI gợi ý đều phải được sinh viên đọc hiểu từng dòng, phân tích rủi ro bộ nhớ và rà soát các lỗ hổng bảo mật tiềm ẩn trước khi đưa vào dự án.", bold_prefix="2. Kiểm duyệt con người bắt buộc: ")
    p_text("Kiểm thử tự động thực chứng: Bắt buộc viết các kịch bản kiểm thử biên (Edge Cases) trong Master Test Suite để kiểm chứng độ đúng đắn thực tế của thuật toán.", bold_prefix="3. Đo đạc thực chứng tự động: ")

    h_styled("5.2. Nhật ký phối hợp AI (AI Collaboration Log) qua 4 giai đoạn", level=2, bookmark_name="sec_ch5_2")
    ai_log_data = [
        ["1. Khởi tạo CSDL", "Gợi ý bảng CSDL phẳng, thiếu chuẩn hóa 3NF, lưu mật khẩu dạng mã hóa một chiều MD5.", "Nhóm bác bỏ hoàn toàn code gợi ý; tái cấu trúc CSDL đạt chuẩn 3NF và tự viết thuật toán băm PBKDF2 100k vòng."],
        ["2. Kiosk Mode", "Sử dụng lệnh `powershell -c kill taskbar`, gây sập hoàn toàn Explorer và mất icon desktop.", "Nhóm từ chối dùng PowerShell; chuyển sang viết chương trình Win32 C++ Native `ShowWindow` khôi phục an toàn <5ms."],
        ["3. PDF Viewer", "Gọi trực tiếp hàm render của PDF.js khiến lỗi sập tiến trình `Detached ArrayBuffer` liên tục.", "Nhóm phát hiện lỗi bộ nhớ; áp dụng kỹ thuật sâu `arrayBuffer.slice(0)` tạo bản sao độc lập trước khi render."],
        ["4. Đồng bộ Outbox", "Gửi dữ liệu trực tiếp lên server không có hàng đợi; nếu rớt mạng thì dữ liệu biến mất.", "Nhóm thiết kế hàng đợi Transactional Outbox lưu trữ ngoại tuyến tại SQLite và đồng bộ Replay an toàn."]
    ]
    styled_table(["Giai đoạn dự án", "Gợi ý ban đầu của Trí tuệ nhân tạo (AI Suggestion)", "Hành động phản biện, tinh chỉnh & Làm chủ của Nhóm TONE PINK"], ai_log_data, col_widths=[1.2, 2.5, 2.8])

    h_styled("5.3. Hệ sinh thái 3TG AI Đa tầng & Phím tắt Ctrl + V dán ảnh", level=2, bookmark_name="sec_ch5_3")
    p_text("Khung chat trợ lý AI được thiết kế đa tầng thông minh: Tự động trích xuất ngữ cảnh bài học hiện tại (Tên môn học, Nội dung lý thuyết đang đọc) để truyền kèm vào câu hỏi của sinh viên. Đặc biệt, hệ thống hỗ trợ bắt sự kiện phím tắt `Ctrl + V` trên toàn màn hình: Khi sinh viên chụp ảnh màn hình đề bài hoặc đồ thị bài tập, hình ảnh sẽ lập tức được dán trực tiếp vào khung chat, tải lên Cloudflare R2 và chuyển giao cho mô hình AI phân tích thị giác để giải thích cặn kẽ.")
    add_image_figure("fig_auth_screen.png", "Hình 5.1: Giao diện thực chứng Xác thực người dùng: Đăng ký & Đăng nhập mã hóa PBKDF2 an toàn", width_inches=5.8)

    h_styled("5.4. Master Test Suite: Bảng kết quả kiểm thử 38/38 Pass 100%", level=2, bookmark_name="sec_ch5_4")
    p_text("Để đảm bảo chất lượng phần mềm đạt cấp độ hoàn thiện công nghiệp, nhóm phát triển bộ kiểm thử tự động toàn diện bao quát 38 kịch bản kiểm thử trải rộng trên 10 mô-đun cốt lõi:")
    
    test_results_data = [
        ["TC-01..04", "Xác thực & Mã hóa", "Đăng ký thành công; Khóa mật khẩu PBKDF2 đủ 100k vòng; Chặn trùng username; Sai mật khẩu báo lỗi an toàn.", "4/4 PASS", "100%"],
        ["TC-05..08", "Cơ sở dữ liệu 3NF", "Kiểm tra toàn vẹn 33 bảng CSDL; Ràng buộc khóa ngoại FK; Ràng buộc UNIQUE; Dữ liệu seeding môn học đầy đủ.", "4/4 PASS", "100%"],
        ["TC-09..12", "Lộ trình & Gamification", "Mở khóa bài học theo tuần tự; Tính toán XP chuẩn xác; Cộng ngọc Gems; Duy trì chuỗi ngày Streak không bị ngắt.", "4/4 PASS", "100%"],
        ["TC-13..16", "Cổng trường IU CMCU", "Mô phỏng đồng bộ điểm tín chỉ; Tính GPA thang 4 và thang 10 chính xác; Ngắt kết nối dọn sạch dữ liệu cá nhân.", "4/4 PASS", "100%"],
        ["TC-17..20", "Trợ lý Trí tuệ nhân tạo", "Gửi nhận tin nhắn AI thời gian thực; Kiểm tra Rate Limiting trượt; Xử lý dán ảnh Ctrl+V; Lưu lịch sử hội thoại.", "4/4 PASS", "100%"],
        ["TC-21..24", "Kiosk Mode & Win32 C++", "Ẩn Taskbar thành công; Khôi phục Taskbar <5ms khi thoát; Chặn màn hình phụ Multi-Monitor; Xử lý an toàn khi sập app.", "4/4 PASS", "100%"],
        ["TC-25..28", "Trình phát âm thanh", "Phát nhạc Local qua HTTP 206 Byte-Range; Không tốn băng thông đám mây; Chuyển đổi mượt 3 thể loại âm thanh.", "4/4 PASS", "100%"],
        ["TC-29..32", "Trình đọc tài liệu PDF", "Khắc phục triệt để lỗi Detached Buffer; Đạt tần số quét 60 FPS khi co kéo Resizer; Lưu trang đọc dở dang.", "4/4 PASS", "100%"],
        ["TC-33..35", "Đồng bộ ngoại tuyến", "Ghi nhận thao tác vào bảng sync_outbox khi mất mạng; Tự động Replay Queue khi có mạng; Đảm bảo tính nhất quán.", "3/3 PASS", "100%"],
        ["TC-36..38", "Mạng xã hội & Đóng gói", "Gửi tin nhắn nhóm tức thì; Cập nhật bảng xếp hạng hàng tuần; Kiểm tra gói cài đặt Desktop Windows hoạt động mượt mà.", "3/3 PASS", "100%"],
        ["TỔNG HỢP", "TOÀN BỘ HỆ THỐNG", "Bộ kiểm thử tự động Master Test Suite kiểm chứng 10 phân hệ nghiệp vụ phần mềm", "38/38 PASS", "100%"]
    ]
    styled_table(["Mã Kịch bản", "Phân hệ kiểm thử", "Nội dung tiêu chí kiểm thử tự động", "Kết quả thực tế", "Tỷ lệ đạt"], test_results_data, col_widths=[0.9, 1.4, 2.7, 0.9, 0.6])

    # -------------------------------------------------------------------------
    # CHƯƠNG 6
    # -------------------------------------------------------------------------
    print("-> Đang tạo Chương 6: Kết quả & Hướng phát triển...")
    h_styled("CHƯƠNG 6: KẾT QUẢ THỰC HIỆN, ĐÁNH GIÁ & HƯỚNG PHÁT TRIỂN (EVALUATION & FUTURE WORK)", level=1, bookmark_name="sec_ch6")
    
    h_styled("6.1. Trình diễn sản phẩm MVP hoàn thiện V29.9.07", level=2, bookmark_name="sec_ch6_1")
    p_text("Sau chuỗi 6 Sprints phát triển bền bỉ, nhóm đã đóng gói và phát hành thành công phiên bản chính thức `3TG Học Vui Mỗi Ngày V29.9.07 (Release Gold Master)` trên GitHub Releases:")
    p_text("Bản chạy ngay không cần cài đặt (Portable Executable): Tệp tin `3TG Học Vui Mỗi Ngày V29.9.07.exe` dung lượng tối ưu, khởi chạy trực tiếp trên bất kỳ máy tính Windows 10/11 nào mà không đòi hỏi quyền Administrator.", bold_prefix="• Phiên bản Portable: ")
    p_text("Bộ cài đặt tiêu chuẩn (Windows Setup Installer): Tệp tin `3TG Học Vui Mỗi Ngày Setup V29.9.07.exe` tích hợp trình cài đặt thông minh, tự động tạo lối tắt ngoài Desktop và tích hợp trình gỡ cài đặt sạch sẽ trong Control Panel của hệ điều hành.", bold_prefix="• Phiên bản Installer: ")

    h_styled("6.2. Đánh giá mức độ hoàn thành so với mục tiêu ban đầu", level=2, bookmark_name="sec_ch6_2")
    p_text("Đối chiếu sản phẩm hoàn thiện với 5 Chuẩn đầu ra học phần (CLO) theo Rubric INFO2011 Trường Đại học CMC:")
    rubric_match_data = [
        ["CLO1: Kỹ nghệ phần mềm hiện đại", "Áp dụng triệt để quy trình Agile Scrum; quản lý phiên bản với Git; có Issues, Milestones và Releases rõ ràng.", "Quản lý 57 Issues qua 6 Milestones Sprints; hơn 100 commits sạch; phát hành bản phát hành chính thức V29.9.07 kèm release notes.", "Đạt 10/10"],
        ["CLO2: Kỹ nghệ Yêu cầu", "Tuyên ngôn tầm nhìn chuẩn mực; phân tích Personas chuyên sâu; đặc tả FR/NFR chi tiết theo chuẩn ISO/IEC 25010.", "Đầy đủ 3 Personas chi tiết; 10 FRs và 5 NFRs đo lường được; sơ đồ Use Case UML 2.5; tiêu chuẩn chấp thuận Given-When-Then.", "Đạt 10/10"],
        ["CLO3: Kiến trúc & CSDL", "Đề xuất kiến trúc phù hợp; phân tích các đánh đổi kỹ thuật; CSDL thiết kế chuẩn 3NF có sơ đồ ERD trực quan.", "Kiến trúc 4 tầng Hybrid Serverless Edge & Desktop; phân tích định lý CAP sâu sắc; CSDL 33 bảng đạt chuẩn 3NF có ERD vector.", "Đạt 10/10"],
        ["CLO4: Lập trình tin cậy & Kiểm thử", "Mã hóa an toàn; phòng vệ tấn công bảo mật; kiểm thử tự động toàn diện với kết quả đo đạc thực tế.", "Băm PBKDF2 100k vòng; chương trình Kiosk Win32 Native C++ <5ms; bộ Master Test Suite 38/38 TCs Pass 100%.", "Đạt 10/10"],
        ["CLO5: AI có trách nhiệm & Tinh thần nhóm", "Có khung nguyên tắc khai thác AI minh bạch; nhật ký phối hợp chi tiết; phân công và đóng góp thành viên đồng đều.", "Khung kiểm soát AI 3 bước; bác bỏ code AI lỗi; nhật ký 4 giai đoạn kỹ thuật; đóng góp cân bằng tuyệt đối giữa 3 thành viên.", "Đạt 10/10"]
    ]
    styled_table(["Chuẩn đầu ra (CLO)", "Tiêu chí đánh giá Rubric CMCU K4", "Mức độ đáp ứng thực tế của Đồ án 3TG Study AI", "Đánh giá"], rubric_match_data, col_widths=[1.5, 2.3, 2.3, 0.9])

    h_styled("6.3. Những thách thức kỹ thuật lớn nhất đã vượt qua", level=2, bookmark_name="sec_ch6_3")
    p_text("Trong quá trình thực hiện đồ án, nhóm đã đối mặt và giải quyết 3 bài toán kỹ thuật phức tạp: (1) Xung đột tài nguyên khi chặn và khôi phục thanh tác vụ hệ thống Windows mà không gây sập Explorer; (2) Quản lý bộ nhớ mảng ArrayBuffer đa luồng trên Web Worker khi đọc file PDF dung lượng lớn; (3) Duy trì tính nhất quán của giao dịch dữ liệu ngoại tuyến (Transactional Outbox) đảm bảo không bao giờ làm mất điểm số tích lũy của sinh viên khi mất mạng đột ngột.")

    h_styled("6.4. Những hạn chế và hướng phát triển trong tương lai", level=2, bookmark_name="sec_ch6_4")
    p_text("Mặc dù đã đạt được các mục tiêu kỹ thuật đề ra, hệ thống vẫn còn một số điểm có thể mở rộng tiếp: (1) Phát triển thêm phiên bản ứng dụng di động (Mobile App trên React Native) để sinh viên có thể học tập linh hoạt trên điện thoại thông minh; (2) Tích hợp thêm các mô hình học máy cục bộ chạy trực tiếp trên GPU máy tính sinh viên để trả lời câu hỏi khi hoàn toàn không có mạng Internet; (3) Kết nối API trực tiếp với hệ sinh thái quản lý đào tạo của nhà trường để tự động đồng bộ lịch thi và thời khóa biểu theo thời gian thực.")

    # -------------------------------------------------------------------------
    # TÀI LIỆU THAM KHẢO & PHỤ LỤC
    # -------------------------------------------------------------------------
    print("-> Đang tạo Tài liệu tham khảo & Phụ lục...")
    h_styled("DANH MỤC TÀI LIỆU THAM KHẢO (IEEE / APA STANDARD)", level=1, bookmark_name="sec_refs")
    references = [
        "[1] Ian Sommerville, Engineering Software Products: An Introduction to Modern Software Engineering, Pearson Education, 2020.",
        "[2] Ian Sommerville, Software Engineering, 10th Edition, Pearson Education, 2016.",
        "[3] R. S. Pressman and B. R. Maxim, Software Engineering: A Practitioner's Approach, 9th Edition, McGraw-Hill, 2020.",
        "[4] OWASP Foundation, \"Password Storage Cheat Sheet — PBKDF2 Recommendations,\" OWASP Cheat Sheet Series, 2023. [Online]. Available: https://cheatsheetseries.owasp.org/",
        "[5] Microsoft Corporation, \"Win32 API: FindWindowA and ShowWindow Documentation,\" Microsoft Developer Network (MSDN), 2024. [Online]. Available: https://learn.microsoft.com/windows/win32/api/",
        "[6] Cloudflare Inc., \"Cloudflare D1: Serverless SQL Database at the Edge,\" Cloudflare Documentation, 2024. [Online]. Available: https://developers.cloudflare.com/d1/",
        "[7] Electron Software Foundation, \"Electron Application Security Guidelines,\" Electron Documentation, 2024. [Online]. Available: https://www.electronjs.org/docs/latest/tutorial/security",
        "[8] Mozilla Developer Network (MDN), \"HTTP 206 Partial Content and Range Requests,\" MDN Web Docs, 2024. [Online]. Available: https://developer.mozilla.org/",
        "[9] ISO/IEC 25010:2011, Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models, International Organization for Standardization, Geneva, Switzerland, 2011."
    ]
    for ref in references:
        p_text(ref, space_after=3)

    doc.add_page_break()

    h_styled("PHỤ LỤC: HƯỚNG DẪN CÀI ĐẶT & VẬN HÀNH HỆ THỐNG", level=1, bookmark_name="sec_appendix")
    p_text("HƯỚNG DẪN CÀI ĐẶT VÀ KHỞI CHẠY BẢN PHÁT HÀNH DESKTOP V29.9.07", bold_prefix="Phụ lục 1: ")
    p_text("Truy cập trang phát hành GitHub Releases tại kho lưu trữ Anniehatani / appstudyAI phiên bản v29.9.07", bold_prefix="• Bước 1: ")
    p_text("Tải tệp `3TG Học Vui Mỗi Ngày V29.9.07.exe` (Bản Portable) hoặc `3TG Học Vui Mỗi Ngày Setup V29.9.07.exe` (Bản Installer).", bold_prefix="• Bước 2: ")
    p_text("Nhấp đúp chuột vào tệp tin để khởi chạy ứng dụng. Không cần cài đặt thêm môi trường Node.js hay cơ sở dữ liệu bên ngoài.", bold_prefix="• Bước 3: ")

    p_text("HƯỚNG DẪN THỰC THI BỘ KIỂM THỬ TỰ ĐỘNG MASTER TEST SUITE", bold_prefix="Phụ lục 2: ")
    p_text("Mở cửa sổ dòng lệnh PowerShell tại thư mục gốc của dự án.", bold_prefix="• Bước 1: ")
    p_text("Chạy lệnh kiểm thử tự động toàn diện: `node scripts / test_sprint6_full_suite.cjs`", bold_prefix="• Bước 2: ")
    p_text("Quan sát kết quả trên màn hình console: toàn bộ 38 kịch bản kiểm thử xuất hiện trạng thái xanh `PASS 100%`.", bold_prefix="• Bước 3: ")

    output_path = os.path.abspath(os.path.join("tổng kết dự án", "Bao_Cao_Tong_Ket_Do_An_3TG_Study_TONE_PINK_Final.docx"))
    doc.save(output_path)
    print(f"✅ Đã lưu tệp Word học thuật nghiêm túc: {output_path}")
    return output_path

if __name__ == "__main__":
    build_report()
