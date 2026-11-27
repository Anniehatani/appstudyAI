# -*- coding: utf-8 -*-
import os
import math
from PIL import Image, ImageDraw
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ==========================================
# BẢNG MÀU CHUẨN DOANH NGHIỆP & ĐẠI HỌC CMC
# ==========================================
CMC_DARK = RGBColor(0, 72, 138)       # #00488A - Xanh dương CMC đậm
CMC_BLUE = RGBColor(0, 108, 184)      # #006CB8 - Xanh dương CMC chủ đạo
CMC_LIGHT = RGBColor(14, 165, 233)    # #0EA5E9 - Xanh nhấn sáng
CMC_TINT = RGBColor(239, 246, 255)    # #EFF6FF - Nền xanh cực nhẹ
CMC_PALE = RGBColor(224, 242, 254)    # #E0F2FE - Nền badge xanh nhạt

INK_900 = RGBColor(15, 23, 42)        # #0F172A - Chữ đậm tiêu đề
INK_700 = RGBColor(51, 65, 85)        # #334155 - Chữ nội dung
INK_500 = RGBColor(100, 116, 139)     # #64748B - Chú thích phụ
BORDER = RGBColor(203, 213, 225)      # #CBD5E1 - Viền thẻ mảnh
BG_CANVAS = RGBColor(248, 250, 252)   # #F8FAFC - Nền slide sáng sạch
WHITE = RGBColor(255, 255, 255)

GREEN_DARK = RGBColor(4, 120, 87)     # #047857 - Trạng thái đạt
GREEN_TINT = RGBColor(236, 253, 245)  # #ECFDF5

FONT_MAIN = "Segoe UI"
ASSETS_DIR = os.path.join("sprint", "slide_assets")
LOGO_WHITE = os.path.join(ASSETS_DIR, "white_logo_CMC.png")
LOGO_BLUE = os.path.join("sprint", "blue_logo_CMC.png")
COVER_BG = os.path.join(ASSETS_DIR, "cmc_cover_bg.png")
HEADER_BG = os.path.join(ASSETS_DIR, "cmc_header_bar.png")

OUT_PPTX = os.path.join("sprint", "Slide_Bao_Ve_Do_An_3TG_Study_CMC.pptx")


def generate_cmc_backgrounds():
    """Tạo ảnh nền xanh dương CMC gradient + họa tiết chấm công nghệ và tách nền logo trắng trong suốt 100%."""
    os.makedirs(ASSETS_DIR, exist_ok=True)

    # 0. Tách nền xanh của white_logo_CMC.webp thành PNG nền trong suốt hoàn toàn
    raw_webp = os.path.join("sprint", "white_logo_CMC.webp")
    if os.path.exists(raw_webp):
        lw_img = Image.open(raw_webp).convert("RGBA")
        px = lw_img.load()
        width_l, height_l = lw_img.size
        for y in range(height_l):
            for x in range(width_l):
                r, g, b, a = px[x, y]
                # Nền là xanh dương (b cao, r thấp), chữ là màu trắng (r, g, b đều cao)
                # Tính độ "trắng" dựa trên kênh đỏ R (vì màu nền xanh CMC có R gần 0..30, chữ trắng có R ~255)
                whiteness = r / 255.0
                if r < 45:
                    new_a = 0
                else:
                    # Smooth anti-aliasing viền chữ trắng
                    t = min(1.0, max(0.0, (r - 45) / 180.0))
                    new_a = int(t * a)
                px[x, y] = (255, 255, 255, new_a)
        lw_img.save(LOGO_WHITE, "PNG")

    # 1. Nền trang bìa 1920x1080
    w, h = 1920, 1080
    img = Image.new("RGB", (w, h))
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / (h - 1)
        # Gradient mượt từ xanh đậm (#00549E) -> sáng nhẹ ở giữa (#007BC4) -> đậm vừa ở đáy (#004B8D)
        if t < 0.55:
            k = t / 0.55
            r = int(0 * (1 - k) + 0 * k)
            g = int(84 * (1 - k) + 123 * k)
            b = int(158 * (1 - k) + 196 * k)
        else:
            k = (t - 0.55) / 0.45
            r = int(0 * (1 - k) + 0 * k)
            g = int(123 * (1 - k) + 75 * k)
            b = int(196 * (1 - k) + 141 * k)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # Vẽ họa tiết lưới chấm hình cầu công nghệ mờ tinh tế ở nửa dưới
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    cx, cy = w * 0.5, h * 0.86
    rx, ry = 760, 420
    step = 18
    for gx in range(int(cx - rx), int(cx + rx), step):
        for gy in range(int(cy - ry), int(h), step):
            nx = (gx - cx) / rx
            ny = (gy - cy) / ry
            dist = nx * nx + ny * ny
            if dist <= 1.0:
                # Tạo hoa văn bản đồ / sóng nhẹ
                wave = math.sin(gx * 0.013) * math.cos(gy * 0.017) + math.sin((gx + gy) * 0.008)
                if wave > -0.25:
                    alpha = int(max(12, min(85, (1.0 - dist) * 95)))
                    rad = 2.6 if wave > 0.35 else 1.8
                    od.ellipse([gx - rad, gy - rad, gx + rad, gy + rad], fill=(165, 225, 255, alpha))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    img.save(COVER_BG, "PNG")

    # 2. Thanh header trang nội dung 1920x136
    hw, hh = 1920, 136
    himg = Image.new("RGB", (hw, hh))
    hd = ImageDraw.Draw(himg)
    for x in range(hw):
        k = x / (hw - 1)
        r = int(0 * (1 - k) + 0 * k)
        g = int(88 * (1 - k) + 130 * k)
        b = int(166 * (1 - k) + 204 * k)
        hd.line([(x, 0), (x, hh)], fill=(r, g, b))

    hover = Image.new("RGBA", (hw, hh), (0, 0, 0, 0))
    hod = ImageDraw.Draw(hover)
    for gx in range(560, hw - 360, 16):
        for gy in range(12, hh - 10, 16):
            wave = math.sin(gx * 0.015) * math.cos(gy * 0.025)
            if wave > 0.05:
                alpha = int(20 + 35 * (1 - abs(gx - hw * 0.62) / (hw * 0.4)))
                if alpha > 8:
                    hod.ellipse([gx - 2, gy - 2, gx + 2, gy + 2], fill=(180, 230, 255, min(65, alpha)))
    himg = Image.alpha_composite(himg.convert("RGBA"), hover).convert("RGB")
    himg.save(HEADER_BG, "PNG")


generate_cmc_backgrounds()

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
blank_layout = prs.slide_layouts[6]


def set_bg(slide, color=BG_CANVAS):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_card(slide, left, top, width, height, fill_color=WHITE, border_color=BORDER, border_pt=0.85,
             radius=0.04, rounded=True):
    stype = MSO_SHAPE.ROUNDED_RECTANGLE if rounded else MSO_SHAPE.RECTANGLE
    shp = slide.shapes.add_shape(stype, Inches(left), Inches(top), Inches(width), Inches(height))
    shp.shadow.inherit = False
    if rounded:
        try:
            shp.adjustments[0] = radius
        except Exception:
            pass
    if fill_color is not None:
        shp.fill.solid()
        shp.fill.fore_color.rgb = fill_color
    else:
        shp.fill.background()
    if border_color is not None:
        shp.line.color.rgb = border_color
        shp.line.width = Pt(border_pt)
    else:
        shp.line.fill.background()
    return shp


def add_circle(slide, cx, cy, diameter, fill_color=CMC_BLUE, text="", text_color=WHITE, font_size=12, bold=True):
    shp = slide.shapes.add_shape(
        MSO_SHAPE.OVAL,
        Inches(cx - diameter / 2), Inches(cy - diameter / 2),
        Inches(diameter), Inches(diameter)
    )
    shp.shadow.inherit = False
    shp.fill.solid()
    shp.fill.fore_color.rgb = fill_color
    shp.line.fill.background()
    if text:
        tf = shp.text_frame
        tf.word_wrap = False
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = Inches(0)
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run()
        r.text = text
        r.font.name = FONT_MAIN
        r.font.size = Pt(font_size)
        r.font.bold = bold
        r.font.color.rgb = text_color
    return shp


def add_pill(slide, left, top, width, height, text, bg_color=CMC_PALE, text_color=CMC_DARK, font_size=9.5, bold=True):
    shp = add_card(slide, left, top, width, height, fill_color=bg_color, border_color=None, radius=0.45, rounded=True)
    tf = shp.text_frame
    tf.word_wrap = False
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    tf.margin_left = Inches(0.06)
    tf.margin_right = Inches(0.06)
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = text
    r.font.name = FONT_MAIN
    r.font.size = Pt(font_size)
    r.font.bold = bold
    r.font.color.rgb = text_color
    return shp


def add_arrow(slide, left, top, width, height, fill_color=CMC_LIGHT):
    shp = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(left), Inches(top), Inches(width), Inches(height))
    shp.shadow.inherit = False
    shp.fill.solid()
    shp.fill.fore_color.rgb = fill_color
    shp.line.fill.background()
    return shp


def add_text(slide, left, top, width, height, text="", size=11, bold=False, color=INK_900,
             align=PP_ALIGN.LEFT, valign=MSO_ANCHOR.TOP, line_spacing=1.22):
    tb = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = valign
    tf.margin_left = Inches(0.04)
    tf.margin_right = Inches(0.04)
    tf.margin_top = Inches(0.02)
    tf.margin_bottom = Inches(0.02)
    p = tf.paragraphs[0]
    p.alignment = align
    p.line_spacing = line_spacing
    r = p.add_run()
    r.text = text
    r.font.name = FONT_MAIN
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.color.rgb = color
    return tb


def add_rich_list(slide, left, top, width, height, items, size=10.5, color=INK_700, space_after=6, line_spacing=1.22):
    tb = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.04)
    tf.margin_right = Inches(0.04)
    tf.margin_top = Inches(0.02)
    tf.margin_bottom = Inches(0.02)
    for idx, item in enumerate(items):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.space_after = Pt(space_after)
        p.line_spacing = line_spacing
        if isinstance(item, tuple):
            prefix, body = item
            r1 = p.add_run()
            r1.text = prefix
            r1.font.name = FONT_MAIN
            r1.font.size = Pt(size)
            r1.font.bold = True
            r1.font.color.rgb = CMC_DARK
            r2 = p.add_run()
            r2.text = body
            r2.font.name = FONT_MAIN
            r2.font.size = Pt(size)
            r2.font.color.rgb = color
        else:
            r = p.add_run()
            r.text = item
            r.font.name = FONT_MAIN
            r.font.size = Pt(size)
            r.font.color.rgb = color
    return tb


def add_img(slide, img_path, left, top, max_w, max_h, border=True):
    im = Image.open(img_path)
    iw, ih = im.size
    ratio = iw / ih
    box_ratio = max_w / max_h
    if ratio > box_ratio:
        w = max_w
        h = max_w / ratio
    else:
        h = max_h
        w = max_h * ratio
    x = left + (max_w - w) / 2
    y = top + (max_h - h) / 2
    if border:
        add_card(slide, x - 0.03, y - 0.03, w + 0.06, h + 0.06, fill_color=WHITE, border_color=BORDER, border_pt=0.75, rounded=False)
    return slide.shapes.add_picture(img_path, Inches(x), Inches(y), width=Inches(w), height=Inches(h))


def add_cmc_chrome(slide, page_num, total_pages, kicker, title):
    set_bg(slide, BG_CANVAS)
    # Đường nhấn đen mỏng trên cùng + thanh xanh dương CMC chuẩn mẫu Trường
    add_card(slide, 0, 0, 13.333, 0.07, fill_color=RGBColor(15, 23, 42), border_color=None, rounded=False)
    slide.shapes.add_picture(HEADER_BG, Inches(0), Inches(0.07), width=Inches(13.333), height=Inches(0.95))

    # Kicker nhỏ màu xanh nhạt + Tiêu đề lớn màu trắng bên trái
    add_text(slide, 0.55, 0.14, 9.2, 0.24, kicker.upper(), size=9.5, bold=True, color=CMC_PALE)
    title_sz = 19.5 if len(title) > 58 else 21.5
    add_text(slide, 0.55, 0.38, 9.8, 0.54, title, size=title_sz, bold=True, color=WHITE, valign=MSO_ANCHOR.MIDDLE)

    # Logo CMC UNIVERSITY màu trắng góc phải trên thanh xanh
    if os.path.exists(LOGO_WHITE):
        lw = 2.15
        lh = lw * (219 / 1200)
        slide.shapes.add_picture(LOGO_WHITE, Inches(10.75), Inches(0.35), width=Inches(lw), height=Inches(lh))

    # Footer trắng thanh lịch
    add_card(slide, 0, 7.12, 13.333, 0.38, fill_color=WHITE, border_color=BORDER, border_pt=0.5, rounded=False)
    add_text(slide, 0.55, 7.15, 9.5, 0.30,
             "Trường Đại học CMC  •  Đồ án Công nghệ phần mềm (INFO2011)  •  Nhóm TONE PINK — 3TG Study",
             size=9, color=INK_500, valign=MSO_ANCHOR.MIDDLE)
    add_text(slide, 11.4, 7.15, 1.38, 0.30,
             f"Trang {page_num:02d} / {total_pages:02d}",
             size=9.5, bold=True, color=CMC_BLUE, align=PP_ALIGN.RIGHT, valign=MSO_ANCHOR.MIDDLE)


TOTAL = 12

# ==============================================================================
# SLIDE 1: TRANG BÌA CHUẨN DOANH NGHIỆP ĐẠI HỌC CMC
# ==============================================================================
s1 = prs.slides.add_slide(blank_layout)
s1.shapes.add_picture(COVER_BG, Inches(0), Inches(0), width=Inches(13.333), height=Inches(7.5))

# Logo trắng CMC ở trên chính giữa (chuẩn mẫu trường)
if os.path.exists(LOGO_WHITE):
    lw = 3.55
    lh = lw * (219 / 1200)
    s1.shapes.add_picture(LOGO_WHITE, Inches((13.333 - lw) / 2), Inches(0.55), width=Inches(lw), height=Inches(lh))

add_text(s1, 1.0, 1.32, 11.333, 0.35,
         "KHOA CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG  •  ĐỒ ÁN CÔNG NGHỆ PHẦN MỀM (INFO2011 - LỚP N08)",
         size=11.5, bold=True, color=CMC_PALE, align=PP_ALIGN.CENTER)

# Tên đề tài chính giữa nổi bật
add_text(s1, 0.9, 1.85, 11.533, 0.85, "3TG STUDY — PHẦN MỀM HỖ TRỢ HỌC TẬP",
         size=38, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
add_text(s1, 1.2, 2.70, 10.933, 0.65,
         "Ứng dụng đa nền tảng (Windows & Web) giúp sinh viên học tập trung, ôn luyện trắc nghiệm,\n"
         "tra cứu bảng điểm cổng trường và hỏi đáp bài tập với trợ lý trí tuệ nhân tạo",
         size=14.5, color=CMC_PALE, align=PP_ALIGN.CENTER, line_spacing=1.25)

# Vẽ 3 Card vector thành viên chuẩn doanh nghiệp thay cho bảng xấu
add_text(s1, 0.85, 3.65, 11.633, 0.32,
         "THÀNH VIÊN NHÓM THỰC HIỆN (TONE PINK)   |   GIẢNG VIÊN HƯỚNG DẪN: THS. NGUYỄN THỊ VÂN ANH",
         size=10.5, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

members_cover = [
    ("LA", "Lê Văn An", "BAI250001 • Nhóm trưởng",
     "Kiến trúc hệ thống, xử lý máy chủ đám mây, tích hợp trợ lý AI, kết nối cổng trường & đóng gói"),
    ("NQ", "Nguyễn Như Quỳnh", "BCS252491 • Thành viên",
     "Thiết kế giao diện, lộ trình học, xem tệp PDF tại chỗ, chủ đề màu sắc & tài liệu báo cáo"),
    ("NT", "Nguyễn Văn Tú", "BIT250364 • Thành viên",
     "Cơ sở dữ liệu 3NF, tính năng chặn xao nhãng trên Windows, tính điểm GPA & kiểm thử chất lượng")
]
for idx, (ini, m_name, m_id, m_desc) in enumerate(members_cover):
    cx = 0.85 + idx * 3.95
    add_card(s1, cx, 4.10, 3.72, 2.35, fill_color=WHITE, border_color=None, radius=0.05)
    add_card(s1, cx, 4.10, 3.72, 0.08, fill_color=CMC_LIGHT, border_color=None, rounded=False)
    add_circle(s1, cx + 0.50, 4.62, 0.56, fill_color=CMC_BLUE, text=ini, font_size=13)
    add_text(s1, cx + 0.88, 4.34, 2.68, 0.30, m_name, size=13, bold=True, color=INK_900)
    add_text(s1, cx + 0.88, 4.64, 2.68, 0.24, m_id, size=10, bold=True, color=CMC_BLUE)
    add_card(s1, cx + 0.22, 5.02, 3.28, 0.012, fill_color=BORDER, border_color=None, rounded=False)
    add_text(s1, cx + 0.22, 5.14, 3.28, 1.15, m_desc, size=10.2, color=INK_700, line_spacing=1.25)

add_text(s1, 1.0, 6.78, 11.333, 0.35,
         "Hà Nội, ngày 27 tháng 12 năm 2026   •   Mã nguồn: github.com/Anniehatani/appstudyAI",
         size=11.5, bold=True, color=WHITE, align=PP_ALIGN.CENTER)


# ==============================================================================
# SLIDE 2: VẤN ĐỀ XÁC ĐỊNH SAU KHẢO SÁT
# ==============================================================================
s2 = prs.slides.add_slide(blank_layout)
add_cmc_chrome(s2, 2, TOTAL, "Phần 1 • Khảo sát & Đặt vấn đề",
               "Các Vấn Đề Thực Tế Xác Định Sau Khảo Sát Sinh Viên Tín Chỉ")

# Trái: 4 khối thẻ vector đánh số 01 - 04
probs = [
    ("01", "Dễ mất tập trung khi tự học trên máy tính",
     "Sinh viên dễ chuyển sang mạng xã hội hoặc màn hình phụ. Các công cụ đếm giờ thông thường chỉ đếm ngược đơn giản, không ẩn thanh tác vụ hay khóa phím chuyển cửa sổ."),
    ("02", "Ôn tập rời rạc, khó duy trì thói quen mỗi ngày",
     "Tài liệu chuyên ngành dài, làm trắc nghiệm xong hay quên câu đã sai; ghi chú nằm rời rạc khỏi bài đang học, thiếu động lực giữ nhịp học đều đặn."),
    ("03", "Bảng điểm cổng trường tĩnh, hỏi bài AI rườm rà",
     "Cổng đào tạo chỉ hiển thị điểm sau khi kết thúc môn, sinh viên khó thử tính môn nào cần học cải thiện để nâng GPA; chụp ảnh đề bài hỏi AI phải qua nhiều app."),
    ("04", "Học một mình nhanh nản và mất tiến độ khi rớt mạng",
     "Thiếu nhóm học gắn kết ngay trong phần mềm để trao đổi bài; các web học tập thông thường sẽ mất hết kết quả vừa làm nếu mất kết nối Internet.")
]
for idx, (num, ptitle, pdesc) in enumerate(probs):
    y = 1.22 + idx * 1.44
    add_card(s2, 0.55, y, 7.65, 1.28, fill_color=WHITE, border_color=BORDER, radius=0.05)
    add_circle(s2, 1.05, y + 0.64, 0.58, fill_color=CMC_BLUE if idx % 2 == 0 else CMC_DARK, text=num, font_size=13)
    add_text(s2, 1.50, y + 0.14, 6.50, 0.30, ptitle, size=12.5, bold=True, color=CMC_DARK)
    add_text(s2, 1.50, y + 0.46, 6.50, 0.74, pdesc, size=10.5, color=INK_700, line_spacing=1.22)

# Phải: Chân dung 3 nhóm sinh viên khảo sát
add_card(s2, 8.45, 1.22, 4.33, 5.60, fill_color=CMC_TINT, border_color=BORDER, radius=0.04)
add_pill(s2, 8.68, 1.40, 3.87, 0.34, "3 NHÓM SINH VIÊN ĐƯỢC KHẢO SÁT", bg_color=CMC_DARK, text_color=WHITE, font_size=10)

personas = [
    ("1. Sinh viên muốn nâng điểm GPA",
     "Điểm trung bình khoảng 2.7, cần gỡ các môn điểm thấp. Mong muốn khóa xao nhãng, xem đề cương PDF tại chỗ, dán ảnh hỏi AI và thử tính điểm nâng GPA."),
    ("2. Sinh viên năm nhất ngành CNTT",
     "Mới làm quen môn cơ sở ngành, tài liệu dài dễ chán. Cần chia nhỏ bài học từng chặng, tự gom các câu đã làm sai để ôn lại và ghi chú ngay tại bài."),
    ("3. Trưởng nhóm ôn thi môn học",
     "Phụ trách nhóm bạn cùng học và nhắc tiến độ. Cần phòng chat nhóm có phân quyền quản trị và trợ lý tự động hỗ trợ tra cứu.")
]
for idx, (pn, pd) in enumerate(personas):
    py = 1.92 + idx * 1.60
    add_card(s2, 8.68, py, 3.87, 1.44, fill_color=WHITE, border_color=BORDER, radius=0.05)
    add_card(s2, 8.68, py, 0.08, 1.44, fill_color=CMC_BLUE, border_color=None, rounded=False)
    add_text(s2, 8.90, py + 0.10, 3.52, 0.28, pn, size=11.5, bold=True, color=CMC_DARK)
    add_text(s2, 8.90, py + 0.40, 3.52, 0.96, pd, size=10, color=INK_700, line_spacing=1.22)


# ==============================================================================
# SLIDE 3: GIẢI PHÁP & KIẾN TRÚC TỔNG THỂ (DÙNG THẺ VECTOR ĐỐI CHIẾU, KHÔNG TABLE LỎ)
# ==============================================================================
s3 = prs.slides.add_slide(blank_layout)
add_cmc_chrome(s3, 3, TOTAL, "Phần 2 • Giải pháp & Kiến trúc hệ thống",
               "Các Giải Pháp Chính Giải Quyết Vấn Đề & Kiến Trúc 4 Tầng")

add_text(s3, 0.55, 1.15, 6.3, 0.30, "Đối chiếu 4 vấn đề khảo sát với giải pháp của 3TG Study", size=12.5, bold=True, color=CMC_DARK)

# 4 cặp thẻ Vector đối chiếu (Vấn đề -> Mũi tên -> Giải pháp) cực xịn!
pairs = [
    ("Mất tập trung,\nhở màn hình phụ", "Chế độ học tập trung: tự ẩn thanh tác vụ, khóa phím tắt & che màn hình phụ; tự mở lại dưới 5 mili-giây."),
    ("Ôn tập rời rạc,\ndễ quên câu sai", "Chia nhỏ 10 môn / 4.094 bài / 29.460 câu hỏi; tự gom câu sai để ôn lại; ghi chú ngay theo từng bài."),
    ("Bảng điểm tĩnh,\nhỏi AI bất tiện", "Đăng nhập 1 chạm cổng trường lấy bảng điểm; mô phỏng nâng GPA từng môn; dán ảnh đề bài cho AI giải."),
    ("Học một mình,\nrớt mạng mất bài", "Nhóm chat học tập có trợ lý tự động; tự lưu kết quả vào máy khi mất mạng và đồng bộ lại khi có mạng.")
]
for idx, (prob_txt, sol_txt) in enumerate(pairs):
    y = 1.54 + idx * 0.98
    # Khối trái (Vấn đề)
    add_card(s3, 0.55, y, 1.95, 0.86, fill_color=CMC_TINT, border_color=CMC_LIGHT, border_pt=0.8, radius=0.08)
    add_text(s3, 0.63, y + 0.06, 1.79, 0.74, prob_txt, size=9.8, bold=True, color=CMC_DARK, align=PP_ALIGN.CENTER, valign=MSO_ANCHOR.MIDDLE)
    # Mũi tên Vector
    add_arrow(s3, 2.57, y + 0.30, 0.28, 0.24, fill_color=CMC_BLUE)
    # Khối phải (Giải pháp)
    add_card(s3, 2.92, y, 3.92, 0.86, fill_color=WHITE, border_color=BORDER, border_pt=0.85, radius=0.06)
    add_text(s3, 3.04, y + 0.05, 3.70, 0.76, sol_txt, size=9.8, color=INK_700, valign=MSO_ANCHOR.MIDDLE, line_spacing=1.18)

# Khối công nghệ nền tảng dưới bên trái
add_card(s3, 0.55, 5.52, 6.29, 1.38, fill_color=CMC_DARK, border_color=None, radius=0.05)
add_text(s3, 0.75, 5.62, 5.9, 0.28, "Nền tảng công nghệ sử dụng:", size=11, bold=True, color=WHITE)
add_text(s3, 0.75, 5.92, 5.9, 0.88,
         "• Ứng dụng máy tính Windows & Web đám mây Cloudflare (tốc độ phản hồi nhanh).\n"
         "• Cơ sở dữ liệu chuẩn hóa 3NF gồm 33 bảng + bản sao lưu ngoại tuyến ngay trên máy.\n"
         "• Tích hợp trợ lý AI xử lý văn bản lẫn hình ảnh đề bài & mã hóa mật khẩu nhiều lớp.",
         size=9.8, color=CMC_PALE, line_spacing=1.25)

# Khối phải: Sơ đồ kiến trúc 4 tầng
add_card(s3, 7.05, 1.15, 5.73, 5.75, fill_color=WHITE, border_color=BORDER, radius=0.04)
add_pill(s3, 8.20, 1.28, 3.45, 0.30, "KIẾN TRÚC TỔNG THỂ 4 TẦNG", bg_color=CMC_PALE, text_color=CMC_DARK, font_size=9.5)
add_img(s3, os.path.join(ASSETS_DIR, "fig_architecture_uml.png"), 7.15, 1.66, 5.53, 4.92, border=False)
add_text(s3, 7.15, 6.60, 5.53, 0.24, "Sơ đồ kiến trúc phân tầng giữa ứng dụng máy tính và máy chủ đám mây", size=9, color=INK_500, align=PP_ALIGN.CENTER)


# ==============================================================================
# SLIDE 4: TÍNH NĂNG 1 — CHẶN XAO NHÃNG & HỌC TÀI LIỆU TẠI CHỖ
# ==============================================================================
s4 = prs.slides.add_slide(blank_layout)
add_cmc_chrome(s4, 4, TOTAL, "Phần 3 • Các tính năng chính (1/3)",
               "Phòng Học Tập Trung Chặn Xao Nhãng & Đọc Tài Liệu Tại Chỗ")

add_card(s4, 0.55, 1.20, 5.55, 5.66, fill_color=WHITE, border_color=BORDER, radius=0.04)
add_pill(s4, 0.75, 1.38, 4.15, 0.32, "GIẢI QUYẾT VẤN ĐỀ 1 • CHỐNG XAO NHÃNG", bg_color=CMC_BLUE, text_color=WHITE, font_size=9.5)

f1_items = [
    ("Chặn xao nhãng trên Windows: ",
     "Khi vào ca học, phần mềm tự động ẩn thanh tác vụ Windows, khóa các phím tắt thoát cửa sổ (Alt+Tab, phím Windows, F1–F12). Khi bấm thoát hoặc tắt đột ngột, thanh tác vụ tự hiện lại nguyên vẹn trong dưới 5 mili-giây."),
    ("Che kín màn hình phụ: ",
     "Tự động nhận diện nếu sinh viên dùng 2–3 màn hình và phủ đen màn hình phụ để không lướt web giải trí."),
    ("Kiểm tra giờ học thực tế trên máy chủ: ",
     "Máy chủ tính đúng khoảng thời gian học thực tế trước khi cộng điểm thưởng, tránh việc gửi yêu cầu ảo nhận điểm."),
    ("Xem tệp PDF & nghe nhạc từ máy tính: ",
     "Mở đọc tài liệu PDF trực tiếp với đủ số trang, nút chuyển trang rõ ràng; nghe nhạc cá nhân ngay từ ổ cứng máy tính không tốn dung lượng mạng."),
    ("Dán ảnh đề bài hỏi AI ngay lập tức: ",
     "Chụp màn hình câu hỏi và dán trực tiếp bằng tổ hợp phím Ctrl + V để trợ lý AI giải thích từng bước.")
]
add_rich_list(s4, 0.75, 1.82, 5.15, 4.92, f1_items, size=10.4, space_after=8)

# Phải trên: Ảnh thật Pomodoro
add_card(s4, 6.30, 1.20, 6.48, 3.55, fill_color=WHITE, border_color=BORDER, radius=0.04)
add_text(s4, 6.45, 1.27, 6.18, 0.26, "Ảnh thực tế: Phòng học tập trung, đọc tài liệu, chọn nhạc và hỏi AI", size=10.5, bold=True, color=CMC_DARK, align=PP_ALIGN.CENTER)
add_img(s4, os.path.join(ASSETS_DIR, "pomorodo_seb.png"), 6.42, 1.56, 6.24, 3.08, border=True)

# Phải dưới: Sơ đồ tuần tự + chú thích tiếng Việt
add_card(s4, 6.30, 4.88, 6.48, 1.98, fill_color=WHITE, border_color=BORDER, radius=0.04)
add_img(s4, os.path.join(ASSETS_DIR, "fig_kiosk_sequence.png"), 6.40, 4.95, 3.15, 1.84, border=False)
add_text(s4, 9.65, 5.02, 3.00, 1.68,
         "Quy trình khóa chống xao nhãng:\n"
         "1. Bắt đầu ca -> chạy khóa bảo vệ\n"
         "2. Ẩn thanh tác vụ & màn hình phụ\n"
         "3. Máy chủ ghi nhận mốc bắt đầu\n"
         "4. Kết thúc -> khôi phục màn hình <5ms",
         size=9.8, color=INK_700, line_spacing=1.28)


# ==============================================================================
# SLIDE 5: TÍNH NĂNG 2 — LỘ TRÌNH ÔN TẬP, CỔNG IU & TÍNH GPA
# ==============================================================================
s5 = prs.slides.add_slide(blank_layout)
add_cmc_chrome(s5, 5, TOTAL, "Phần 3 • Các tính năng chính (2/3)",
               "Lộ Trình Ôn Luyện, Đồng Bộ Cổng Trường & Mô Phỏng Điểm GPA")

add_card(s5, 0.55, 1.20, 6.08, 3.65, fill_color=WHITE, border_color=BORDER, radius=0.04)
add_text(s5, 0.68, 1.26, 5.82, 0.26, "Ảnh thực tế: Lộ trình ôn tập chia chặng và linh vật đồng hành", size=10.5, bold=True, color=CMC_DARK, align=PP_ALIGN.CENTER)
add_img(s5, os.path.join(ASSETS_DIR, "trang_hoc_chinh.png"), 0.68, 1.56, 5.82, 3.18, border=True)

add_card(s5, 0.55, 4.98, 6.08, 1.88, fill_color=WHITE, border_color=BORDER, radius=0.04)
add_img(s5, os.path.join(ASSETS_DIR, "shop_da_nang.png"), 0.66, 5.06, 3.05, 1.72, border=True)
add_text(s5, 3.82, 5.10, 2.70, 1.64,
         "Cơ chế giữ động lực học:\n"
         "• 38 vật phẩm (Hồi tim, Bùa giữ chuỗi)\n"
         "• 6 bộ màu sắc & Chế độ tối dịu mắt\n"
         "• 5 nhiệm vụ mỗi ngày & Bảng xếp hạng\n"
         "• Tính chuỗi ngày học liên tục",
         size=10, color=INK_700, line_spacing=1.26)

# Phải trên: Giải quyết vấn đề 2
add_card(s5, 6.82, 1.20, 5.96, 2.75, fill_color=WHITE, border_color=BORDER, radius=0.04)
add_pill(s5, 7.02, 1.34, 4.10, 0.30, "GIẢI QUYẾT VẤN ĐỀ 2 • ÔN TẬP CHỦ ĐỘNG", bg_color=CMC_PALE, text_color=CMC_DARK, font_size=9.5)
add_rich_list(s5, 7.02, 1.72, 5.56, 2.15, [
    ("Kho học liệu chia nhỏ: ", "10 môn cơ sở ngành, 106 chương, 4.094 bài học và 29.460 câu hỏi trắc nghiệm."),
    ("Sổ ôn câu sai & Ghi chú theo bài: ", "Các câu trả lời sai tự động gom vào mục Ôn câu sai để làm lại; phần ghi chú gắn liền với từng bài học."),
    ("Thưởng phạt rõ ràng: ", "5 trái tim năng lượng, điểm kinh nghiệm, đá quý và vật phẩm bảo vệ chuỗi ngày học.")
], size=10.3, space_after=6)

# Phải dưới: Giải quyết vấn đề 3
add_card(s5, 6.82, 4.08, 5.96, 2.78, fill_color=WHITE, border_color=BORDER, radius=0.04)
add_pill(s5, 7.02, 4.22, 4.35, 0.30, "GIẢI QUYẾT VẤN ĐỀ 3 • BẢNG ĐIỂM & DỰ BÁO GPA", bg_color=CMC_BLUE, text_color=WHITE, font_size=9.5)
add_rich_list(s5, 7.02, 4.60, 5.56, 2.18, [
    ("Kết nối cổng trường 1 chạm: ", "Mở đăng nhập tài khoản Microsoft của trường trên ứng dụng máy tính, tự lấy bảng điểm toàn khóa và lịch học."),
    ("Giả lập nâng điểm từng môn: ", "Tính điểm trung bình (GPA) hệ 4 và hệ 10 theo tín chỉ; chọn thử điểm mới cho môn điểm thấp để xem ngay mức tăng GPA."),
    ("Cố vấn AI & Quyền riêng tư: ", "Trợ lý AI gợi ý lộ trình đạt mục tiêu GPA; có nút ngắt kết nối xóa sạch bảng điểm khỏi cơ sở dữ liệu.")
], size=10.3, space_after=6)


# ==============================================================================
# SLIDE 6: TÍNH NĂNG 3 — NHÓM HỌC, NGOẠI TUYẾN & BẢO MẬT
# ==============================================================================
s6 = prs.slides.add_slide(blank_layout)
add_cmc_chrome(s6, 6, TOTAL, "Phần 3 • Các tính năng chính (3/3)",
               "Nhóm Học Tập, Hoạt Động Khi Mất Mạng & An Toàn Dữ Liệu")

add_card(s6, 0.55, 1.20, 6.08, 2.75, fill_color=WHITE, border_color=BORDER, radius=0.04)
add_pill(s6, 0.75, 1.34, 4.25, 0.30, "GIẢI QUYẾT VẤN ĐỀ 4 • KẾT NỐI NHÓM HỌC", bg_color=CMC_BLUE, text_color=WHITE, font_size=9.5)
add_rich_list(s6, 0.75, 1.72, 5.68, 2.15, [
    ("Kết bạn 2 chiều & Trạng thái thật: ", "Gửi/duyệt lời mời kết bạn; cập nhật trạng thái đang hoạt động hay nghỉ học theo thời gian thực."),
    ("Nhắn tin nhóm & Xem video mượt: ", "Gửi tin nhắn phản hồi tức thì; tự dừng video cũ khi mở video mới để không bị lẫn âm thanh."),
    ("Phân quyền nhóm & Trợ lý tự động: ", "Có Trưởng nhóm, Phó nhóm, Thành viên; trợ lý trong nhóm hỗ trợ giải đáp bài tập và gửi nhạc thư giãn.")
], size=10.3, space_after=6)

add_card(s6, 0.55, 4.08, 6.08, 2.78, fill_color=WHITE, border_color=BORDER, radius=0.04)
add_pill(s6, 0.75, 4.22, 4.45, 0.30, "HOẠT ĐỘNG NGOẠI TUYẾN & AN TOÀN BẢO MẬT", bg_color=CMC_DARK, text_color=WHITE, font_size=9.5)
add_rich_list(s6, 0.75, 4.60, 5.68, 2.18, [
    ("Lưu bài khi mất mạng: ", "Khi mất Internet, kết quả học vẫn lưu an toàn vào cơ sở dữ liệu trên máy và tự động đồng bộ lên máy chủ khi có mạng trở lại."),
    ("Mã hóa mật khẩu nhiều lớp: ", "Mật khẩu được trộn chuỗi ngẫu nhiên riêng từng tài khoản và băm 100.000 vòng, không lưu mật khẩu gốc."),
    ("Chống dò mật khẩu & Rò rỉ khóa: ", "Khóa tạm thời 15 phút nếu nhập sai quá 5 lần; tách toàn bộ khóa bí mật ra khỏi bộ cài đặt máy tính.")
], size=10.3, space_after=6)

add_card(s6, 6.82, 1.20, 5.96, 2.75, fill_color=WHITE, border_color=BORDER, radius=0.04)
add_text(s6, 6.92, 1.25, 5.76, 0.24, "Ảnh thực tế: Danh sách bạn bè và phòng chat nhóm", size=10, bold=True, color=CMC_DARK, align=PP_ALIGN.CENTER)
add_img(s6, os.path.join(ASSETS_DIR, "ket_ban_va_nhan_tin.png"), 6.92, 1.52, 5.76, 2.35, border=True)

add_card(s6, 6.82, 4.08, 5.96, 2.78, fill_color=WHITE, border_color=BORDER, radius=0.04)
add_text(s6, 6.92, 4.13, 5.76, 0.24, "Ảnh thực tế: Trang cá nhân, thành tích và bảng điểm", size=10, bold=True, color=CMC_DARK, align=PP_ALIGN.CENTER)
add_img(s6, os.path.join(ASSETS_DIR, "trang_ca_nhan.png"), 6.92, 4.40, 5.76, 2.38, border=True)


# ==============================================================================
# SLIDE 7: MỤC TIÊU CÁC SPRINT (VẼ TIMELINE VECTOR 6 KHỐI XỊN CHUẨN DOANH NGHIỆP)
# ==============================================================================
s7 = prs.slides.add_slide(blank_layout)
add_cmc_chrome(s7, 7, TOTAL, "Phần 4 • Mục tiêu các giai đoạn (Sprints)",
               "Mục Tiêu Và Kết Quả Bàn Giao Qua 6 Giai Đoạn Phát Triển")

# Vẽ thanh nối ngang Timeline ở trên
add_card(s7, 0.65, 1.22, 12.03, 0.04, fill_color=CMC_LIGHT, border_color=None, rounded=False)

sprints_meta = [
    ("1", "Giai đoạn 1", "Nền tảng & Lộ trình cốt lõi",
     "Mục tiêu: Dựng máy chủ, CSDL 3NF & luồng làm trắc nghiệm.\nKết quả: 10 môn, 4.094 bài, 29.460 câu; tính điểm XP, Tim, Chuỗi ngày học & Cửa hàng."),
    ("2", "Giai đoạn 2", "Cổng trường IU, AI & Chat 1-1",
     "Mục tiêu: Kết nối bảng điểm thật của sinh viên và thêm trợ lý AI.\nKết quả: Đăng nhập 1 chạm cổng trường, tính GPA, cố vấn AI, kết bạn và nhắn tin 1-1."),
    ("3", "Giai đoạn 3", "Đóng gói Windows & Bảo mật",
     "Mục tiêu: Đóng gói phần mềm chạy nhanh trên máy tính và siết bảo mật.\nKết quả: Bản cài đặt mở trong 1–2 giây, xóa sạch dữ liệu thử nghiệm và chặn truy cập trái phép."),
    ("4", "Giai đoạn 4", "Nhóm học tập & Trợ lý nhóm",
     "Mục tiêu: Phát triển không gian học nhóm và tối ưu gửi tin đa phương tiện.\nKết quả: Nhắn tin tức thì không giật video, phân quyền 4 vai trò nhóm & trợ lý giải trí."),
    ("5", "Giai đoạn 5", "Bảo mật & Tập trung",
     "Mục tiêu: Bảo vệ tài khoản, lưu ngoại tuyến và chống gian lận giờ học.\nKết quả: Mã hóa mật khẩu 100k vòng, lưu bài khi mất mạng, 6 bộ màu sắc & xác thực giờ học."),
    ("6", "Giai đoạn 6", "Chặn xao nhãng & Bàn giao",
     "Mục tiêu: Khóa triệt để màn hình Windows, xem PDF/nhạc tại chỗ & kiểm thử.\nKết quả: Khôi phục thanh tác vụ <5ms, đọc PDF mượt, nghe nhạc ổ cứng & đạt 38/38 kịch bản.")
]

# Bố trí 2 hàng x 3 khối thẻ Vector đẹp chuẩn doanh nghiệp (trên 3 giai đoạn 1-2-3, dưới 3 giai đoạn 4-5-6)
for idx, (snum, slabel, stitle, sbody) in enumerate(sprints_meta):
    row = idx // 3
    col = idx % 3
    sx = 0.55 + col * 4.18
    sy = 1.48 + row * 2.75

    # Thẻ chính
    add_card(s7, sx, sy, 3.88, 2.48, fill_color=WHITE, border_color=BORDER, radius=0.05)
    # Thanh header thẻ màu xanh CMC
    add_card(s7, sx, sy, 3.88, 0.56, fill_color=CMC_BLUE if row == 0 else CMC_DARK, border_color=None, rounded=False)
    add_circle(s7, sx + 0.36, sy + 0.28, 0.38, fill_color=WHITE, text=snum, text_color=CMC_DARK, font_size=12)
    add_text(s7, sx + 0.64, sy + 0.08, 3.12, 0.42, f"{slabel}: {stitle}", size=10.8, bold=True, color=WHITE, valign=MSO_ANCHOR.MIDDLE)

    # Nội dung Mục tiêu + Kết quả tách 2 dòng rõ
    parts = sbody.split("\n")
    add_card(s7, sx + 0.16, sy + 0.68, 3.56, 0.72, fill_color=CMC_TINT, border_color=None, radius=0.06)
    add_text(s7, sx + 0.24, sy + 0.72, 3.40, 0.64, parts[0], size=9.6, bold=True, color=CMC_DARK, line_spacing=1.18)

    add_card(s7, sx + 0.16, sy + 1.48, 3.56, 0.86, fill_color=BG_CANVAS, border_color=BORDER, border_pt=0.6, radius=0.06)
    add_text(s7, sx + 0.24, sy + 1.52, 3.40, 0.78, parts[1], size=9.6, color=INK_700, line_spacing=1.18)

    # Mũi tên nối giữa các khối cùng hàng
    if col < 2:
        add_arrow(s7, sx + 3.92, sy + 1.12, 0.22, 0.22, fill_color=CMC_LIGHT)


# ==============================================================================
# SLIDE 8: NHIỆM VỤ THÀNH VIÊN & KẾT QUẢ (GIAI ĐOẠN 1–3) — VẼ VECTOR CARD MATRIX
# ==============================================================================
s8 = prs.slides.add_slide(blank_layout)
add_cmc_chrome(s8, 8, TOTAL, "Phần 5 • Nhiệm vụ thành viên & Kết quả (1/2)",
               "Phân Công Công Việc Từng Thành Viên (Giai Đoạn 1 – 3)")

# Thanh tiêu đề cột vẽ vector
col_headers_s8 = [
    (0.55, 2.35, "THÀNH VIÊN"),
    (3.02, 3.18, "GIAI ĐOẠN 1 • NỀN TẢNG"),
    (6.32, 3.18, "GIAI ĐOẠN 2 • CỔNG IU & AI"),
    (9.62, 3.16, "GIAI ĐOẠN 3 • ĐÓNG GÓI")
]
for cx, cw, ctxt in col_headers_s8:
    add_card(s8, cx, 1.18, cw, 0.42, fill_color=CMC_DARK, border_color=None, radius=0.08)
    add_text(s8, cx + 0.08, 1.21, cw - 0.16, 0.36, ctxt, size=10, bold=True, color=WHITE, align=PP_ALIGN.CENTER, valign=MSO_ANCHOR.MIDDLE)

rows_s8 = [
    ("LA", "Lê Văn An", "BAI250001 • Nhóm trưởng",
     "• Dựng máy chủ đám mây, tạo luồng học và chấm điểm trắc nghiệm, đăng ký/đăng nhập.\n➔ Kết quả: Hệ thống chạy ổn định, phản hồi nhanh dưới 50 mili-giây.",
     "• Làm luồng đăng nhập 1 chạm cổng trường, bóc tách bảng điểm và lịch học 6 tuần, tích hợp trợ lý AI.\n➔ Kết quả: Lấy đúng bảng điểm thật 28 tín chỉ (GPA 2.73).",
     "• Đóng gói bản chạy Windows mở nhanh 1–2 giây, chống mở trùng cửa sổ, khóa truy cập chéo dữ liệu.\n➔ Kết quả: Bộ cài đặt chạy trơn tru trên máy tính sạch."),
    ("NQ", "Nguyễn Như Quỳnh", "BCS252491 • Thành viên",
     "• Thiết kế đường đi bài học, hiệu ứng âm thanh, nhân vật Thỏ Bảy Màu, Cửa hàng và Bảng xếp hạng.\n➔ Kết quả: Giao diện sinh động, dùng tốt trên cả máy tính lẫn điện thoại.",
     "• Thiết kế khung ảnh đại diện, khung nhắn tin 1-1, 14 ảnh bìa và Chế độ tối bảo vệ mắt ban đêm.\n➔ Kết quả: Giao diện tối đồng bộ toàn bộ các trang.",
     "• Sửa lỗi hiển thị chữ khi chuyển chế độ sáng/tối, thêm khung mặc định, làm slide và kịch bản trình bày.\n➔ Kết quả: Chuyển đổi giao diện mượt mà chỉ với 1 lần bấm."),
    ("NT", "Nguyễn Văn Tú", "BIT250364 • Thành viên",
     "• Thiết kế cơ sở dữ liệu chuẩn 3NF (10 môn, 4.094 bài), cơ chế Trái tim, Đá quý, Chuỗi ngày học.\n➔ Kết quả: Cơ sở dữ liệu hoàn chỉnh, truy vấn nhanh.",
     "• Viết công thức tính GPA hệ 4/10, lọc môn điểm thấp, cấu trúc kết bạn và kiểm thử cổng trường.\n➔ Kết quả: Điểm GPA khớp 100% với bảng điểm cổng trường.",
     "• Dọn sạch toàn bộ tài khoản thử nghiệm khỏi máy chủ, chuẩn hóa thông báo lỗi và kiểm thử toàn hệ thống.\n➔ Kết quả: Bản cài đặt sạch sẽ, không còn dữ liệu mẫu.")
]

for idx, (ini, mname, mcode, c1, c2, c3) in enumerate(rows_s8):
    ry = 1.72 + idx * 1.74
    # Cột tên thành viên
    add_card(s8, 0.55, ry, 2.35, 1.60, fill_color=CMC_TINT, border_color=CMC_LIGHT, radius=0.05)
    add_circle(s8, 1.72, ry + 0.44, 0.54, fill_color=CMC_BLUE, text=ini, font_size=12)
    add_text(s8, 0.65, ry + 0.78, 2.15, 0.34, mname, size=11.5, bold=True, color=INK_900, align=PP_ALIGN.CENTER)
    add_text(s8, 0.65, ry + 1.10, 2.15, 0.36, mcode, size=9.5, bold=True, color=CMC_BLUE, align=PP_ALIGN.CENTER)

    # 3 cột nội dung thẻ tách biệt sạch sẽ
    for col_idx, txt in enumerate([c1, c2, c3]):
        cx = 3.02 + col_idx * 3.30
        cw = 3.18 if col_idx < 2 else 3.16
        add_card(s8, cx, ry, cw, 1.60, fill_color=WHITE, border_color=BORDER, radius=0.05)
        parts = txt.split("\n➔ ")
        add_text(s8, cx + 0.12, ry + 0.08, cw - 0.24, 0.92, parts[0], size=9.7, color=INK_700, line_spacing=1.18)
        add_card(s8, cx + 0.10, ry + 1.02, cw - 0.20, 0.50, fill_color=GREEN_TINT, border_color=None, radius=0.06)
        add_text(s8, cx + 0.16, ry + 1.05, cw - 0.32, 0.44, "➔ " + parts[1], size=9.2, bold=True, color=GREEN_DARK, valign=MSO_ANCHOR.MIDDLE, line_spacing=1.12)


# ==============================================================================
# SLIDE 9: NHIỆM VỤ THÀNH VIÊN & KẾT QUẢ (GIAI ĐOẠN 4–6) — VẼ VECTOR CARD MATRIX
# ==============================================================================
s9 = prs.slides.add_slide(blank_layout)
add_cmc_chrome(s9, 9, TOTAL, "Phần 5 • Nhiệm vụ thành viên & Kết quả (2/2)",
               "Phân Công Công Việc Từng Thành Viên (Giai Đoạn 4 – 6)")

col_headers_s9 = [
    (0.55, 2.35, "THÀNH VIÊN"),
    (3.02, 3.18, "GIAI ĐOẠN 4 • NHÓM HỌC"),
    (6.32, 3.18, "GIAI ĐOẠN 5 • BẢO MẬT"),
    (9.62, 3.16, "GIAI ĐOẠN 6 • HOÀN THIỆN")
]
for cx, cw, ctxt in col_headers_s9:
    add_card(s9, cx, 1.18, cw, 0.42, fill_color=CMC_BLUE, border_color=None, radius=0.08)
    add_text(s9, cx + 0.08, 1.21, cw - 0.16, 0.36, ctxt, size=10, bold=True, color=WHITE, align=PP_ALIGN.CENTER, valign=MSO_ANCHOR.MIDDLE)

rows_s9 = [
    ("LA", "Lê Văn An", "BAI250001 • Nhóm trưởng",
     "• Làm nhắn tin tức thì, sửa lỗi dừng video khi có tin mới, tích hợp trợ lý tự động và phân quyền nhóm.\n➔ Kết quả: Tin nhắn phản hồi ngay, xem video liền mạch.",
     "• Nâng cấp mã hóa mật khẩu 100k vòng, giới hạn thử sai, lưu bài khi mất mạng & kiểm tra giờ học thực.\n➔ Kết quả: Bảo mật tài khoản, chống cộng điểm ảo.",
     "• Làm phát nhạc từ ổ cứng máy tính, thiết lập AI dự phòng, viết bộ 38 bài kiểm thử tự động & đóng gói.\n➔ Kết quả: 38/38 bài kiểm thử đạt 100%, phát hành 2 bản cài."),
    ("NQ", "Nguyễn Như Quỳnh", "BCS252491 • Thành viên",
     "• Xây dựng kho lệnh nhạc/ảnh cho trợ lý nhóm, xem ảnh phóng to, ghi âm thoại và duyệt kết bạn 2 chiều.\n➔ Kết quả: Trợ lý nhóm trả lời chính xác, kết bạn an toàn.",
     "• Thiết kế 6 chủ đề màu sắc đồng bộ toàn ứng dụng và căn chỉnh hiển thị sắc nét trên mọi kích cỡ màn hình.\n➔ Kết quả: Đổi màu phủ 100% giao diện.",
     "• Sửa lỗi trắng trang khi xem tệp PDF, làm nút chọn nhạc từ máy, dán ảnh bằng Ctrl+V cho AI & làm slide.\n➔ Kết quả: Xem PDF đủ số trang, kéo giãn khung học mượt."),
    ("NT", "Nguyễn Văn Tú", "BIT250364 • Thành viên",
     "• Cập nhật trạng thái Online/Offline thật theo chu kỳ 40 giây, xử lý khi gõ nhầm lệnh & viết 10 kịch bản test.\n➔ Kết quả: 10/10 kịch bản đạt, hiển thị đúng hoạt động.",
     "• Nâng cấp phóng to/thu nhỏ tài liệu, khóa phím gây xao nhãng và tối ưu tốc độ hiển thị cho máy yếu.\n➔ Kết quả: Giảm 70% thời gian tải danh sách dài.",
     "• Lập trình bộ chặn xao nhãng trên Windows (<5ms), khóa màn hình phụ & nút xóa sạch bảng điểm IU.\n➔ Kết quả: Thanh tác vụ luôn hồi phục tức thì, bảo vệ riêng tư.")
]

for idx, (ini, mname, mcode, c1, c2, c3) in enumerate(rows_s9):
    ry = 1.72 + idx * 1.74
    add_card(s9, 0.55, ry, 2.35, 1.60, fill_color=CMC_TINT, border_color=CMC_LIGHT, radius=0.05)
    add_circle(s9, 1.72, ry + 0.44, 0.54, fill_color=CMC_DARK, text=ini, font_size=12)
    add_text(s9, 0.65, ry + 0.78, 2.15, 0.34, mname, size=11.5, bold=True, color=INK_900, align=PP_ALIGN.CENTER)
    add_text(s9, 0.65, ry + 1.10, 2.15, 0.36, mcode, size=9.5, bold=True, color=CMC_BLUE, align=PP_ALIGN.CENTER)

    for col_idx, txt in enumerate([c1, c2, c3]):
        cx = 3.02 + col_idx * 3.30
        cw = 3.18 if col_idx < 2 else 3.16
        add_card(s9, cx, ry, cw, 1.60, fill_color=WHITE, border_color=BORDER, radius=0.05)
        parts = txt.split("\n➔ ")
        add_text(s9, cx + 0.12, ry + 0.08, cw - 0.24, 0.92, parts[0], size=9.7, color=INK_700, line_spacing=1.18)
        add_card(s9, cx + 0.10, ry + 1.02, cw - 0.20, 0.50, fill_color=GREEN_TINT, border_color=None, radius=0.06)
        add_text(s9, cx + 0.16, ry + 1.05, cw - 0.32, 0.44, "➔ " + parts[1], size=9.2, bold=True, color=GREEN_DARK, valign=MSO_ANCHOR.MIDDLE, line_spacing=1.12)


# ==============================================================================
# SLIDE 10: KẾT QUẢ ĐẠT ĐƯỢC & HẠN CHẾ (THẺ VECTOR DOANH NGHIỆP)
# ==============================================================================
s10 = prs.slides.add_slide(blank_layout)
add_cmc_chrome(s10, 10, TOTAL, "Phần 6 • Kết quả đạt được & Đánh giá",
               "Tổng Kết Kết Quả Toàn Dự Án, Hạn Chế & Hướng Phát Triển")

# 4 thẻ KPI Vector nổi bật
kpis = [
    ("108+ lần cập nhật", "57 đầu việc chia 6 giai đoạn hoàn thành 100%"),
    ("38 / 38 bài kiểm thử", "Kiểm tra tự động CSDL, AI, chặn xao nhãng, PDF"),
    ("33 bảng dữ liệu 3NF", "Lưu 10 môn học, 4.094 bài và 29.460 câu hỏi"),
    ("2 bản cài + Web chạy thật", "Bản cài Windows 64-bit và bản Web trực tuyến")
]
for idx, (kv, kd) in enumerate(kpis):
    kx = 0.55 + idx * 3.10
    add_card(s10, kx, 1.18, 2.93, 1.05, fill_color=WHITE, border_color=BORDER, radius=0.06)
    add_card(s10, kx, 1.18, 2.93, 0.08, fill_color=CMC_BLUE if idx % 2 == 0 else CMC_DARK, border_color=None, rounded=False)
    add_text(s10, kx + 0.10, 1.32, 2.73, 0.36, kv, size=13, bold=True, color=CMC_DARK, align=PP_ALIGN.CENTER)
    add_text(s10, kx + 0.10, 1.70, 2.73, 0.44, kd, size=9.3, color=INK_700, align=PP_ALIGN.CENTER)

# 5 Hàng thẻ đánh giá theo tiêu chí học phần (Vector Rows, không dùng table xấu)
eval_rows = [
    ("Tài liệu & Báo cáo (10%)", "Báo cáo tổng kết chuẩn mẫu ĐH CMC, đầy đủ sơ đồ thiết kế, nhật ký 6 giai đoạn và bộ 100 câu hỏi ôn tập vấn đáp.", "ĐẠT 100%"),
    ("Quản trị trên GitHub (20%)", "Đầy đủ đầu việc phân công theo 6 giai đoạn, gắn nhãn rõ ràng, đóng gói phiên bản hoàn chỉnh và bộ kiểm thử tự động.", "ĐẠT 100%"),
    ("Phân tích & Thiết kế (20%)", "Đặc tả 12 ca sử dụng, 10 yêu cầu chức năng, 5 yêu cầu phi chức năng, kiến trúc 4 tầng và 33 bảng dữ liệu chuẩn 3NF.", "ĐẠT 100%"),
    ("Sản phẩm thực tế & AI (30%)", "Ứng dụng chạy thật trên cả máy tính Windows và Web trực tuyến; có đối chiếu lý thuyết môn học và kiểm soát trả lời AI.", "ĐẠT 100%"),
    ("Bảo vệ & Minh chứng (20%)", "Làm rõ được lý do chọn giải pháp (ẩn thanh tác vụ <5ms, mã hóa mật khẩu, lưu ngoại tuyến) và sẵn sàng mở minh chứng.", "SẴN SÀNG")
]
for idx, (ecrit, edesc, estat) in enumerate(eval_rows):
    ey = 2.38 + idx * 0.62
    add_card(s10, 0.55, ey, 12.23, 0.54, fill_color=WHITE if idx % 2 == 0 else CMC_TINT, border_color=BORDER, radius=0.06)
    add_text(s10, 0.72, ey + 0.08, 2.85, 0.38, ecrit, size=10.5, bold=True, color=CMC_DARK, valign=MSO_ANCHOR.MIDDLE)
    add_text(s10, 3.65, ey + 0.06, 7.60, 0.42, edesc, size=9.8, color=INK_700, valign=MSO_ANCHOR.MIDDLE)
    add_pill(s10, 11.42, ey + 0.11, 1.20, 0.32, estat, bg_color=GREEN_TINT if "ĐẠT" in estat else CMC_PALE,
             text_color=GREEN_DARK if "ĐẠT" in estat else CMC_DARK, font_size=9)

# 2 Khối dưới: Hạn chế & Hướng phát triển
add_card(s10, 0.55, 5.60, 6.00, 1.32, fill_color=WHITE, border_color=BORDER, radius=0.05)
add_card(s10, 0.55, 5.60, 0.08, 1.32, fill_color=CMC_LIGHT, border_color=None, rounded=False)
add_text(s10, 0.78, 5.68, 5.60, 0.26, "Hạn chế nhìn nhận thẳng thắn:", size=10.5, bold=True, color=CMC_DARK)
add_text(s10, 0.78, 5.96, 5.60, 0.88,
         "• Tính năng khóa thanh tác vụ chỉ chạy trên máy tính Windows, chưa hỗ trợ macOS hay điện thoại.\n"
         "• Bộ đếm giới hạn đăng nhập sai chưa đồng bộ giữa các vùng máy chủ khác nhau; số lượng cập nhật mã nguồn trên nhánh chính còn tập trung nhiều ở nhóm trưởng.",
         size=9.4, color=INK_700, line_spacing=1.2)

add_card(s10, 6.78, 5.60, 6.00, 1.32, fill_color=WHITE, border_color=BORDER, radius=0.05)
add_card(s10, 6.78, 5.60, 0.08, 1.32, fill_color=CMC_BLUE, border_color=None, rounded=False)
add_text(s10, 7.00, 5.68, 5.60, 0.26, "Hướng phát triển tiếp theo:", size=10.5, bold=True, color=CMC_DARK)
add_text(s10, 7.00, 5.96, 5.60, 0.88,
         "• Phát triển phiên bản ứng dụng di động (Android và iOS) dùng chung hệ thống máy chủ hiện tại.\n"
         "• Mở rộng kết nối bảng điểm sang nhiều trường đại học khác và duy trì quy trình duyệt mã chéo đều hơn giữa các thành viên.",
         size=9.4, color=INK_700, line_spacing=1.2)


# ==============================================================================
# SLIDE 11: KHO MINH CHỨNG SẴN SÀNG MỞ XEM KHI HỎI (3 CỘT CARD VECTOR CỰC ĐẸP)
# ==============================================================================
s11 = prs.slides.add_slide(blank_layout)
add_cmc_chrome(s11, 11, TOTAL, "Phần 7 • Minh chứng thực hiện",
               "Minh Chứng Công Việc Từng Thành Viên (Mở Xem Trực Tiếp Khi Cô Hỏi)")

proof_cols = [
    ("LA", "Lê Văn An", "BAI250001 • Nhóm trưởng",
     [
         ("1. Máy chủ, bảo mật & AI: ", "Mã hóa mật khẩu 100k vòng, giới hạn thử sai, lưu bài ngoại tuyến, xác thực giờ học trên server & trợ lý nhóm."),
         ("2. Kết nối cổng trường & đóng gói: ", "Luồng tự mở Microsoft đăng nhập cổng IU lấy bảng điểm thật và xuất 2 bộ cài đặt trên Windows.")
     ],
     [
         ("Chạy kiểm thử trực tiếp: ", "Mở cửa sổ dòng lệnh chạy 38 bài kiểm tra tự động cho thấy Đạt 38/38 (100%)."),
         ("Mở trang Web trực tuyến: ", "Truy cập lumi-study.3tgstudy.workers.dev để xem hệ thống đang chạy thật."),
         ("Xem lịch sử GitHub & bộ cài: ", "Mở trang GitHub dự án (108+ cập nhật, 57 đầu việc) và 2 tệp cài đặt Windows.")
     ]),
    ("NQ", "Nguyễn Như Quỳnh", "BCS252491 • Thành viên",
     [
         ("1. Giao diện học & cá nhân hóa: ", "Thiết kế cây bài học 10 môn, nhân vật Thỏ Bảy Màu, Cửa hàng 38 món, 6 bộ màu sắc và Chế độ tối."),
         ("2. Tài liệu học & trình bày: ", "Sửa lỗi trắng trang khi xem tệp PDF, dán ảnh bằng Ctrl+V hỏi AI, kéo giãn mượt & làm Slide báo cáo.")
     ],
     [
         ("Mở trực tiếp trên ứng dụng: ", "Bấm qua các mục Lộ trình học, Cửa hàng vật phẩm, Bảng xếp hạng và đổi thử 6 chủ đề màu."),
         ("Thử mở tệp PDF trong phòng học: ", "Mở tài liệu PDF nhiều trang xem đủ số trang, thử kéo giãn khung chia đôi màn hình."),
         ("Thử dán ảnh đề bài hỏi AI: ", "Chụp một câu hỏi trắc nghiệm và bấm Ctrl+V trực tiếp để xem AI giải bài.")
     ]),
    ("NT", "Nguyễn Văn Tú", "BIT250364 • Thành viên",
     [
         ("1. Cơ sở dữ liệu & Nghiệp vụ: ", "Thiết kế 33 bảng chuẩn 3NF, công thức tính GPA, chuỗi ngày học và nút xóa sạch bảng điểm cổng trường."),
         ("2. Chặn xao nhãng & Kiểm thử: ", "Viết chương trình chặn xao nhãng khôi phục thanh tác vụ <5ms, che màn hình phụ & viết báo cáo 6 giai đoạn.")
     ],
     [
         ("Mở xem cấu trúc 33 bảng dữ liệu: ", "Mở tệp cơ sở dữ liệu kiểm tra các bảng chuẩn 3NF và kết quả xóa sạch bảng điểm về 0 dòng."),
         ("Demo khóa xao nhãng thực tế: ", "Bật ca học tập trung thấy thanh tác vụ ẩn + khóa phím; bấm Ctrl+Q thấy hiện lại tức thì."),
         ("Xem nhật ký 6 giai đoạn: ", "Mở các tệp tài liệu Sprint 1–6 trong thư mục sprint/ xem danh sách kiểm thử.")
     ])
]

for idx, (ini, pname, pcode, done_list, show_list) in enumerate(proof_cols):
    px = 0.55 + idx * 4.18
    # Card lớn từng thành viên
    add_card(s11, px, 1.20, 3.88, 5.70, fill_color=WHITE, border_color=BORDER, radius=0.04)
    # Header Card cùng tông xanh dương CMC chuẩn xác, đồng nhất
    add_card(s11, px, 1.20, 3.88, 0.85, fill_color=CMC_BLUE, border_color=None, rounded=False)
    add_circle(s11, px + 0.45, 1.62, 0.54, fill_color=WHITE, text=ini, text_color=CMC_DARK, font_size=12.5)
    add_text(s11, px + 0.82, 1.32, 2.95, 0.30, pname, size=12.5, bold=True, color=WHITE)
    add_text(s11, px + 0.82, 1.64, 2.95, 0.26, pcode, size=9.8, color=CMC_PALE)

    # Khối 1: Phần việc thực hiện
    add_pill(s11, px + 0.16, 2.18, 2.25, 0.28, "CÔNG VIỆC ĐÃ THỰC HIỆN", bg_color=CMC_PALE, text_color=CMC_DARK, font_size=9)
    add_rich_list(s11, px + 0.16, 2.52, 3.56, 1.72, done_list, size=9.6, space_after=6, line_spacing=1.18)

    # Đường ngăn mảnh
    add_card(s11, px + 0.16, 4.30, 3.56, 0.012, fill_color=BORDER, border_color=None, rounded=False)

    # Khối 2: Minh chứng show ngay
    add_pill(s11, px + 0.16, 4.44, 2.65, 0.28, "MINH CHỨNG MỞ XEM NGAY", bg_color=GREEN_TINT, text_color=GREEN_DARK, font_size=9)
    add_rich_list(s11, px + 0.16, 4.78, 3.56, 2.02, show_list, size=9.5, space_after=6, line_spacing=1.18)


# ==============================================================================
# SLIDE 12: KỊCH BẢN DEMO TRỰC TIẾP & CẢM ƠN
# ==============================================================================
s12 = prs.slides.add_slide(blank_layout)
add_cmc_chrome(s12, 12, TOTAL, "Phần 8 • Trình diễn sản phẩm & Cảm ơn",
               "Kịch Bản Trình Diễn Sản Phẩm Trực Tiếp (3 Phút) & Kết Thúc")

# Trái: 4 bước Demo nối nhau bằng thẻ vector
add_text(s12, 0.55, 1.18, 7.2, 0.30, "Trình tự mở phần mềm trình diễn trực tiếp trước hội đồng:", size=12, bold=True, color=CMC_DARK)

demos = [
    ("01", "Khởi động nhanh & đổi giao diện (30 giây)",
     "Mở bản cài đặt trên Windows (lên trong 1–2 giây), tự động vào tài khoản đã đăng nhập, thử đổi 6 màu sắc và Chế độ tối."),
    ("02", "Đồng bộ cổng trường & thử tính điểm GPA (45 giây)",
     "Bấm nút đăng nhập cổng trường 1 chạm, xem bảng điểm thật vừa kéo về và chọn thử điểm mới cho một môn để xem GPA tăng giảm ngay."),
    ("03", "Phòng tập trung chặn xao nhãng & hỏi đáp AI (60 giây)",
     "Mở tệp PDF tài liệu, chọn bài nhạc có sẵn trong máy, bật chế độ tập trung (ẩn thanh tác vụ & che màn hình phụ), dán ảnh đề bài bằng Ctrl+V cho AI giải, bấm Ctrl+Q trả lại màn hình."),
    ("04", "Nhóm chat học tập & chạy kiểm thử tự động (45 giây)",
     "Nhắn tin trong nhóm học, gọi thử trợ lý nhóm trả lời lệnh; mở màn hình dòng lệnh chạy bài kiểm tra tự động chứng minh đạt 38/38.")
]
for idx, (dnum, dtitle, ddesc) in enumerate(demos):
    dy = 1.60 + idx * 1.30
    add_card(s12, 0.55, dy, 7.45, 1.16, fill_color=WHITE, border_color=BORDER, radius=0.05)
    add_circle(s12, 1.02, dy + 0.58, 0.52, fill_color=CMC_BLUE if idx % 2 == 0 else CMC_DARK, text=dnum, font_size=12)
    add_text(s12, 1.42, dy + 0.12, 6.42, 0.28, dtitle, size=11.5, bold=True, color=CMC_DARK)
    add_text(s12, 1.42, dy + 0.42, 6.42, 0.68, ddesc, size=10, color=INK_700, line_spacing=1.2)

# Phải: Khối cảm ơn + 2 mã QR ở cuối slide
add_card(s12, 8.25, 1.22, 4.53, 5.62, fill_color=CMC_BLUE, border_color=None, radius=0.05)
if os.path.exists(LOGO_WHITE):
    lw = 2.55
    lh = lw * (219 / 1200)
    s12.shapes.add_picture(LOGO_WHITE, Inches(8.25 + (4.53 - lw) / 2), Inches(1.42), width=Inches(lw), height=Inches(lh))

add_text(s12, 8.40, 2.02, 4.23, 0.45, "TRÂN TRỌNG CẢM ƠN!", size=21, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
add_text(s12, 8.40, 2.48, 4.23, 0.72,
         "Nhóm TONE PINK kính mong nhận được\nnhững góp ý quý báu từ ThS. Nguyễn Thị Vân Anh\nvà quý thầy cô trong hội đồng.",
         size=10.5, color=CMC_PALE, align=PP_ALIGN.CENTER, line_spacing=1.22)

# Khung trắng bo góc chứa 2 mã QR Repo GitHub & Web Live
qr_path = os.path.join(ASSETS_DIR, "qr_codes.png")
if os.path.exists(qr_path):
    add_card(s12, 8.45, 3.35, 4.13, 2.25, fill_color=WHITE, border_color=CMC_PALE, border_pt=1.0, radius=0.05)
    add_img(s12, qr_path, 8.58, 3.46, 3.87, 2.03, border=False)

add_card(s12, 8.45, 5.75, 4.13, 0.88, fill_color=CMC_DARK, border_color=CMC_LIGHT, border_pt=0.8, radius=0.06)
add_text(s12, 8.55, 5.80, 3.93, 0.78,
         "• Web: lumi-study.3tgstudy.workers.dev\n"
         "• GitHub: github.com/Anniehatani/appstudyAI\n"
         "• Nhóm: Lê Văn An • Nguyễn Như Quỳnh • Nguyễn Văn Tú",
         size=8.8, color=WHITE, valign=MSO_ANCHOR.MIDDLE, line_spacing=1.22)

try:
    prs.save(OUT_PPTX)
    print("CREATED ENTERPRISE CMC BLUE PPTX:", OUT_PPTX, os.path.getsize(OUT_PPTX), "bytes")
except PermissionError:
    fallback_pptx = os.path.join("sprint", "Slide_Bao_Ve_Do_An_3TG_Study_CMC_Final.pptx")
    prs.save(fallback_pptx)
    print("CREATED ENTERPRISE CMC BLUE PPTX (NEW FILE):", fallback_pptx, os.path.getsize(fallback_pptx), "bytes")
