"""
Script: generate_sprint1_html_slides.py
Generates an interactive, animated HTML slide deck for Sprint 1 presentation
Theme: Thỏ 7 Màu Kawaii & Professional Agile Sprint Presentation
Output: 'c:\\Users\\LeVanAn\\Documents\\ChatGPT\\app study 2\\tổng kết sprint 1\\slide_thuyet_trinh_tho_7_mau.html'
"""

import os

def generate_html_slides():
    out_path = r"c:\Users\LeVanAn\Documents\ChatGPT\app study 2\tổng kết sprint 1\slide_thuyet_trinh_tho_7_mau.html"

    html_content = '''<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo Cáo Tổng Kết Sprint 1 • Thỏ 7 Màu • Nhóm 3TG</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Nunito:wght@600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-cream: #FFF7FA;
      --primary-pink: #FF5C8A;
      --deep-berry: #E11D48;
      --pastel-border: #FECDD3;
      --card-bg: #FFFFFF;
      --callout-bg: #FFF0F5;
      --text-dark: #1E293B;
      --text-muted: #64748B;
      --accent-yellow: #F59E0B;
      --accent-purple: #8B5CF6;
      --accent-green: #10B981;
      --accent-blue: #0284C7;
      --shadow-sm: 0 4px 12px rgba(225, 29, 72, 0.08);
      --shadow-md: 0 10px 25px rgba(225, 29, 72, 0.12);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Nunito', 'Inter', -apple-system, sans-serif;
      background: #0F172A;
      color: var(--text-dark);
      overflow: hidden;
      height: 100vh;
      display: flex;
      flex-direction: column;
      user-select: none;
    }

    /* Top Control Bar */
    .top-bar {
      height: 52px;
      background: #1E293B;
      border-bottom: 2px solid #334155;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      color: #F8FAFC;
      z-index: 100;
    }

    .top-bar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-pill {
      background: linear-gradient(135deg, #FF5C8A, #E11D48);
      color: white;
      padding: 4px 12px;
      border-radius: 999px;
      font-weight: 900;
      font-size: 13px;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .top-title {
      font-size: 14px;
      font-weight: 700;
      color: #E2E8F0;
    }

    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-ctl {
      background: #334155;
      color: white;
      border: 1px solid #475569;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .btn-ctl:hover {
      background: var(--primary-pink);
      border-color: var(--deep-berry);
      transform: translateY(-1px);
    }

    /* Slide Stage Container */
    .stage {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      position: relative;
    }

    /* Slide Card (Fixed 16:9 Aspect Ratio) */
    .slide {
      width: 1280px;
      height: 720px;
      max-width: 95vw;
      max-height: 85vh;
      background: var(--bg-cream);
      border-radius: 20px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
      position: absolute;
      opacity: 0;
      transform: scale(0.96) translateY(20px);
      pointer-events: none;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      border: 4px solid #FFFFFF;
    }

    .slide.active {
      opacity: 1;
      transform: scale(1) translateY(0);
      pointer-events: auto;
      z-index: 10;
    }

    /* Top Rainbow Stripe */
    .rainbow-ribbon {
      height: 8px;
      width: 100%;
      background: linear-gradient(90deg, #EF4444 0%, #F97316 16%, #EAB308 33%, #22C55E 50%, #06B6D4 66%, #3B82F6 83%, #A855F7 100%);
    }

    /* Slide Header Area */
    .slide-header {
      padding: 18px 36px 8px 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .category-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #FFE4EB;
      color: var(--deep-berry);
      padding: 3px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
      width: fit-content;
      border: 1px solid var(--primary-pink);
    }

    .slide-title {
      font-size: 24px;
      font-weight: 900;
      color: var(--text-dark);
      letter-spacing: -0.3px;
    }

    .slide-counter {
      background: #FFFFFF;
      border: 1.5px solid var(--pastel-border);
      color: var(--primary-pink);
      padding: 6px 14px;
      border-radius: 999px;
      font-weight: 900;
      font-size: 13px;
    }

    /* Slide Content Body */
    .slide-body {
      flex: 1;
      padding: 10px 36px 16px 36px;
      display: flex;
      gap: 20px;
      position: relative;
    }

    /* Content Cards */
    .card {
      background: var(--card-bg);
      border-radius: 16px;
      border: 1.5px solid var(--pastel-border);
      padding: 18px 22px;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
    }

    .card.primary-border { border-color: var(--primary-pink); }
    .card.purple-border { border-color: var(--accent-purple); }
    .card.yellow-border { border-color: var(--accent-yellow); }
    .card.green-border { border-color: var(--accent-green); }

    .card-title {
      font-size: 14px;
      font-weight: 800;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Mascot Callout Bubble */
    .mascot-bottom-bar {
      margin-top: auto;
      background: var(--callout-bg);
      border: 1.5px solid var(--primary-pink);
      border-radius: 16px;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: var(--shadow-sm);
    }

    .mascot-thumb {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: 2px solid var(--primary-pink);
      background: white;
      object-fit: cover;
      box-shadow: 0 4px 10px rgba(255, 92, 138, 0.25);
      animation: gentleBounce 2.5s ease-in-out infinite;
    }

    @keyframes gentleBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    .bubble-content {
      flex: 1;
    }

    .bubble-author {
      font-size: 12px;
      font-weight: 900;
      color: var(--deep-berry);
      margin-bottom: 2px;
    }

    .bubble-text {
      font-size: 13.5px;
      font-style: italic;
      color: var(--text-dark);
      font-weight: 600;
      line-height: 1.35;
    }

    /* Bottom Navigation Bar */
    .nav-bar {
      height: 60px;
      background: #1E293B;
      border-top: 2px solid #334155;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 36px;
    }

    .nav-btn {
      background: linear-gradient(135deg, #FF5C8A, #E11D48);
      color: white;
      border: none;
      padding: 10px 22px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(225, 29, 72, 0.3);
      transition: all 0.2s;
    }

    .nav-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(225, 29, 72, 0.4);
    }

    .nav-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .slide-dots {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #475569;
      cursor: pointer;
      transition: all 0.3s;
    }

    .dot.active {
      background: var(--primary-pink);
      width: 26px;
      border-radius: 999px;
    }

    /* Specific Slide Helpers */
    .col-2 { display: flex; gap: 20px; width: 100%; }
    .col-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; width: 100%; }
    .col-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; width: 100%; }
    .col-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; width: 100%; }

    ul.check-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    ul.check-list li {
      font-size: 13.5px;
      line-height: 1.4;
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    ul.check-list li b { color: var(--text-dark); }
    ul.check-list li span { color: var(--text-muted); }

    /* Tables */
    .custom-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .custom-table th {
      background: var(--deep-berry);
      color: white;
      padding: 10px;
      text-align: left;
      font-weight: 800;
    }

    .custom-table td {
      padding: 7px 10px;
      border-bottom: 1px solid var(--pastel-border);
      background: white;
    }

    .custom-table tr:nth-child(even) td {
      background: #FFF1F5;
    }

    .stat-number {
      font-size: 38px;
      font-weight: 900;
      line-height: 1;
      margin-bottom: 6px;
    }

    .img-frame {
      border-radius: 12px;
      border: 2px solid var(--pastel-border);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .img-frame img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: white;
      display: block;
    }
  </style>
</head>
<body>

  <!-- Top Bar -->
  <div class="top-bar">
    <div class="top-bar-left">
      <div class="brand-pill">🐰 3TG • THỎ 7 MÀU</div>
      <div class="top-title">BÁO CÁO TỔNG KẾT SPRINT 1 • MÔN CÔNG NGHỆ PHẦN MỀM K4 (ĐẠI HỌC CMC)</div>
    </div>
    <div class="top-bar-right">
      <button class="btn-ctl" id="btnSound">🔊 Âm thanh: BẬT</button>
      <button class="btn-ctl" id="btnFullscreen">⛶ Toàn màn hình</button>
    </div>
  </div>

  <!-- Presentation Stage -->
  <div class="stage">

    <!-- SLIDE 1: COVER -->
    <div class="slide active" id="slide-1">
      <div class="rainbow-ribbon"></div>
      <div class="slide-header">
        <div class="header-left">
          <div class="category-chip">🏛️ TRƯỜNG ĐẠI HỌC CMC • KHOA CNTT</div>
          <div class="slide-title" style="font-size: 32px; color: var(--deep-berry);">BÁO CÁO TỔNG KẾT SPRINT 1</div>
          <div style="font-size: 14px; font-weight: 800; color: var(--text-dark);">ĐỀ TÀI: NỀN TẢNG QUẢN LÝ HỌC TẬP GAMIFICATION "3TG" ALL-IN-ONE</div>
        </div>
        <div class="slide-counter">01 / 14</div>
      </div>
      <div class="slide-body">
        <div class="card" style="flex: 1.4; justify-content: center;">
          <div class="card-title" style="color: var(--deep-berry); font-size: 16px;">📌 THÔNG TIN HỌC PHẦN & ĐỘI NGŨ THỰC HIỆN:</div>
          <ul class="check-list" style="gap: 12px;">
            <li><b>Học phần:</b> <span>Công nghệ phần mềm - K4 (Mã môn: INFO2011)</span></li>
            <li><b>Đội ngũ Scrum:</b> <span>Nhóm 3TG (3 thành viên tinh nhuệ)</span></li>
            <li><b>1. Lê Văn An (Trưởng nhóm):</b> <span>Scrum Master & AI / Cloud Architect</span></li>
            <li><b>2. Nguyễn Như Quỳnh:</b> <span>Product Owner & Lead UI/UX / Frontend</span></li>
            <li><b>3. Nguyễn Văn Tú:</b> <span>Database Engineer, Backend & QA/Tester</span></li>
            <li><b>Khung thời gian:</b> <span>05/10/2026 – 18/10/2026 (2 tuần chuẩn Scrum)</span></li>
            <li><b>Kết quả nghiệm thu:</b> <span style="color: var(--deep-berry); font-weight: 800;">38/38 Story Points (100% Hoàn thành, 0 Bug)</span></li>
          </ul>
        </div>
        <div class="card primary-border" style="flex: 1; align-items: center; justify-content: center; background: white;">
          <img src="../character/download.jpg" style="width: 220px; border-radius: 16px; margin-bottom: 12px; border: 2px solid var(--pastel-border);" alt="Thỏ Bảy Màu">
          <div style="background: var(--callout-bg); border: 1.5px solid var(--primary-pink); padding: 12px; border-radius: 12px; text-align: center;">
            <div style="font-weight: 900; color: var(--deep-berry); font-size: 13px;">💬 Thỏ Bảy Màu chào cả nhà:</div>
            <div style="font-size: 13px; font-style: italic; color: var(--text-dark); margin-top: 4px;">
              "Chào mừng Thầy Cô và các bạn đến với buổi báo cáo Sprint 1 của team 3TG! Cùng khám phá cách tụi mình biến việc học thành game cực cuốn nhé! 🐰✨"
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SLIDE 2: TEAM -->
    <div class="slide" id="slide-2">
      <div class="rainbow-ribbon"></div>
      <div class="slide-header">
        <div class="header-left">
          <div class="category-chip">🌸 CƠ CẤU ĐỘI NGŨ</div>
          <div class="slide-title">ĐỘI NGŨ DỰ ÁN & PHÂN VAI TRÁCH NHIỆM SCRUM</div>
        </div>
        <div class="slide-counter">02 / 14</div>
      </div>
      <div class="slide-body" style="flex-direction: column;">
        <div class="col-3" style="flex: 1;">
          <div class="card primary-border">
            <div class="card-title" style="color: var(--deep-berry);">👤 LÊ VĂN AN</div>
            <div style="font-size: 12px; font-weight: 800; color: var(--primary-pink); margin-top: -6px;">Scrum Master & AI / Cloud Architect</div>
            <hr style="border: none; border-top: 1px dashed var(--pastel-border); margin: 8px 0;">
            <ul class="check-list">
              <li>✓ Điều phối nhịp độ Scrum, chủ trì Daily & Retro</li>
              <li>✓ Loại bỏ blocker kỹ thuật & tối ưu tiến độ</li>
              <li>✓ Thiết kế kiến trúc Cloudflare D1 & RAG AI Engine</li>
              <li>✓ Bảo đảm chuẩn mực Definition of Done (DoD)</li>
            </ul>
          </div>
          <div class="card purple-border">
            <div class="card-title" style="color: var(--accent-purple);">👤 NGUYỄN NHƯ QUỲNH</div>
            <div style="font-size: 12px; font-weight: 800; color: var(--accent-purple); margin-top: -6px;">Product Owner & Lead UI/UX / Frontend</div>
            <hr style="border: none; border-top: 1px dashed var(--pastel-border); margin: 8px 0;">
            <ul class="check-list">
              <li>✓ Quản lý & làm mịn Product Backlog</li>
              <li>✓ Thiết kế Design System & Mascot Thỏ 7 Màu 20 trạng thái</li>
              <li>✓ Xây dựng giao diện Gamification & Tủ huy hiệu</li>
              <li>✓ Nghiệm thu User Story theo Acceptance Criteria</li>
            </ul>
          </div>
          <div class="card yellow-border">
            <div class="card-title" style="color: var(--accent-yellow);">👤 NGUYỄN VĂN TÚ</div>
            <div style="font-size: 12px; font-weight: 800; color: var(--accent-yellow); margin-top: -6px;">Database Engineer & Lead QA/Tester</div>
            <hr style="border: none; border-top: 1px dashed var(--pastel-border); margin: 8px 0;">
            <ul class="check-list">
              <li>✓ Chuẩn hóa toàn diện CSDL 3NF (21 bảng, 108 trường)</li>
              <li>✓ Xây dựng RESTful API cho học liệu và ghi chú</li>
              <li>✓ Viết kịch bản kiểm thử tự động (Unit & Integration Test)</li>
              <li>✓ Tối ưu độ trễ truy vấn SQLite Edge dưới 50ms</li>
            </ul>
          </div>
        </div>
        <div class="mascot-bottom-bar">
          <img src="../character/download (2)9.jpg" class="mascot-thumb" alt="Mascot">
          <div class="bubble-content">
            <div class="bubble-author">💬 Thỏ Kiếm Sĩ khích lệ:</div>
            <div class="bubble-text">"Đội hình tam giác vàng 3TG: Phối hợp nhịp nhàng, chia việc rõ ràng theo RACI, không ai bị bỏ lại phía sau! ⚔️🔥"</div>
          </div>
        </div>
      </div>
    </div>

    <!-- SLIDE 3: PROBLEM & SOLUTION -->
    <div class="slide" id="slide-3">
      <div class="rainbow-ribbon"></div>
      <div class="slide-header">
        <div class="header-left">
          <div class="category-chip">⚠️ BỐI CẢNH & Ý TƯỞNG</div>
          <div class="slide-title">BỐI CẢNH DỰ ÁN & NỖI ĐAU HỆ THỐNG TRUYỀN THỐNG</div>
        </div>
        <div class="slide-counter">03 / 14</div>
      </div>
      <div class="slide-body" style="flex-direction: column;">
        <div class="col-2" style="flex: 1;">
          <div class="card" style="border-color: #F87171; flex: 1;">
            <div class="card-title" style="color: #DC2626;">⚠️ HẠN CHẾ CỦA HỆ THỐNG TRUYỀN THỐNG (EduX):</div>
            <ul class="check-list" style="gap: 12px;">
              <li><b>• Giao diện khô khan, buồn ngủ:</b> <span>Danh mục tĩnh xơ cứng, không tạo động lực tương tác mỗi ngày.</span></li>
              <li><b>• Công cụ học tập rời rạc:</b> <span>Học một nơi, ghi chú mở file khác, làm bài tập chuyển link khác.</span></li>
              <li><b>• Thiếu cơ chế duy trì thói quen:</b> <span>Không có chuỗi ngày học (streak) hay vinh danh thành tích cá nhân.</span></li>
              <li><b>• Khó khăn khi cần trợ giúp:</b> <span>Giảng viên không thể hỗ trợ 24/7, câu hỏi khó dễ gây nản lòng.</span></li>
            </ul>
          </div>
          <div class="card primary-border" style="flex: 1;">
            <div class="card-title" style="color: var(--deep-berry);">✨ ĐỘT PHÁ NỀN TẢNG 3TG ALL-IN-ONE:</div>
            <ul class="check-list" style="gap: 12px;">
              <li><b style="color: var(--deep-berry);">★ Gamification Duolingo-style:</b> <span>10 môn học biến thành 106 cửa ải kỳ thú với Tim, Gems, Streak.</span></li>
              <li><b style="color: var(--deep-berry);">★ All-in-One Cẩm nang thông minh:</b> <span>Ghi chú, code mẫu và công thức trọng tâm lưu trực tiếp theo bài học.</span></li>
              <li><b style="color: var(--deep-berry);">★ Trợ giảng AI RAG an toàn 24/7:</b> <span>Giải thích cặn kẽ thuật toán bám sát giáo trình mà không lộ đề thi.</span></li>
              <li><b style="color: var(--deep-berry);">★ Mascot Thỏ 7 Màu vui nhộn:</b> <span>Đồng hành khích lệ, tạo cảm xúc tích cực và gắn kết sinh viên.</span></li>
            </ul>
          </div>
        </div>
        <div class="mascot-bottom-bar">
          <img src="../character/Thỏ bảy màu.jpg" class="mascot-thumb" alt="Mascot">
          <div class="bubble-content">
            <div class="bubble-author">💬 Thỏ Bảy Màu trăn trở:</div>
            <div class="bubble-text">"Học đại học đâu cần phải khô khan! Thỏ và 3TG muốn mỗi ngày mở app lên, sinh viên đều cảm thấy hào hứng như mở một tựa game yêu thích! 💡🎒"</div>
          </div>
        </div>
      </div>
    </div>

    <!-- SLIDE 4: 5 PILLARS -->
    <div class="slide" id="slide-4">
      <div class="rainbow-ribbon"></div>
      <div class="slide-header">
        <div class="header-left">
          <div class="category-chip">🌟 TRỤ CỘT CỐT LÕI</div>
          <div class="slide-title">NĂM TRỤ CỘT CỐT LÕI TẠO NÊN SỨC MẠNH CỦA 3TG</div>
        </div>
        <div class="slide-counter">04 / 14</div>
      </div>
      <div class="slide-body" style="flex-direction: column;">
        <div class="col-5" style="flex: 1;">
          <div class="card primary-border">
            <div class="card-title" style="font-size: 12px; color: var(--deep-berry);">1. GAMIFICATION</div>
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">Động lực tự giác</div>
            <ul class="check-list" style="font-size: 12px;">
              <li>• Cơ chế 5 Tim thử thách</li>
              <li>• Đá quý (Gems) & XP</li>
              <li>• Chuỗi ngày học Streak</li>
              <li>• Tủ 12 danh hiệu vinh danh</li>
            </ul>
          </div>
          <div class="card purple-border">
            <div class="card-title" style="font-size: 12px; color: var(--accent-purple);">2. TRỢ GIẢNG AI</div>
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">Trí tuệ nhân tạo RAG</div>
            <ul class="check-list" style="font-size: 12px;">
              <li>• Hỏi đáp chuyên sâu môn</li>
              <li>• Mô hình cục bộ bảo mật</li>
              <li>• Không lộ ngân hàng đề</li>
              <li>• Streaming phản hồi tức thì</li>
            </ul>
          </div>
          <div class="card primary-border">
            <div class="card-title" style="font-size: 12px; color: var(--primary-pink);">3. CẨM NANG ALL-IN-1</div>
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">Học sâu nhớ lâu</div>
            <ul class="check-list" style="font-size: 12px;">
              <li>• Tóm tắt cốt lõi bài học</li>
              <li>• Ghi chú tự động lưu</li>
              <li>• Kho câu hỏi làm sai ôn tập</li>
              <li>• Tích hợp đề chính khóa CMC</li>
            </ul>
          </div>
          <div class="card yellow-border">
            <div class="card-title" style="font-size: 12px; color: var(--accent-yellow);">4. SERVERLESS D1</div>
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">Kiến trúc tương lai</div>
            <ul class="check-list" style="font-size: 12px;">
              <li>• Cloudflare D1 Edge SQLite</li>
              <li>• Độ trễ truy vấn &lt; 50ms</li>
              <li>• Chuẩn hóa CSDL 3NF</li>
              <li>• Sẵn sàng chịu tải lớn</li>
            </ul>
          </div>
          <div class="card green-border">
            <div class="card-title" style="font-size: 12px; color: var(--accent-green);">5. ĐA NỀN TẢNG</div>
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">Mọi lúc mọi nơi</div>
            <ul class="check-list" style="font-size: 12px;">
              <li>• Chuẩn di động Responsive</li>
              <li>• Mascot 20 animation sinh động</li>
              <li>• Lưu trữ & tự đồng bộ</li>
              <li>• Trình duyệt hiện đại mượt mà</li>
            </ul>
          </div>
        </div>
        <div class="mascot-bottom-bar">
          <img src="../character/download (1)9.jpg" class="mascot-thumb" alt="Mascot">
          <div class="bubble-content">
            <div class="bubble-author">💬 Thỏ Hầu Gái phục vụ chu đáo:</div>
            <div class="bubble-text">"5 trụ cột vững như bàn thạch! Thỏ cam kết vừa mang lại trải nghiệm giải trí mê mẩn, vừa chuẩn mực học thuật tuyệt đối cho sinh viên! 🎀🧹"</div>
          </div>
        </div>
      </div>
    </div>

    <!-- SLIDE 5: SPRINT GOAL & DoD -->
    <div class="slide" id="slide-5">
      <div class="rainbow-ribbon"></div>
      <div class="slide-header">
        <div class="header-left">
          <div class="category-chip">🎯 MỤC TIÊU SPRINT 1</div>
          <div class="slide-title">MỤC TIÊU SPRINT 1 & TIÊU CHUẨN HOÀN THÀNH (DoD)</div>
        </div>
        <div class="slide-counter">05 / 14</div>
      </div>
      <div class="slide-body" style="flex-direction: column;">
        <div class="col-2" style="flex: 1;">
          <div class="card primary-border" style="flex: 1;">
            <div class="card-title" style="color: var(--deep-berry);">🎯 TUYÊN BỐ MỤC TIÊU SPRINT 1 (SPRINT GOAL):</div>
            <div style="font-size: 11.5px; font-weight: 800; color: var(--primary-pink); margin-bottom: 8px;">⏱️ Khung thời gian: 05/10/2026 – 18/10/2026 (14 ngày chuẩn Scrum)</div>
            <ul class="check-list">
              <li>✓ <b>Khởi tạo kiến trúc Serverless:</b> <span>Thiết lập Cloudflare D1 Edge & Worker REST API.</span></li>
              <li>✓ <b>Chuẩn hóa toàn diện CSDL 3NF:</b> <span>Xây dựng 21 bảng, 108 trường, 11 quan hệ phẳng.</span></li>
              <li>✓ <b>Bản đồ học tập vượt ải:</b> <span>Tích hợp 10 môn học, 106 cửa ải, 4.094 slide bài học.</span></li>
              <li>✓ <b>Động cơ Gamification:</b> <span>Trừ Tim khi làm sai, thưởng Gems, duy trì Streak ngày học.</span></li>
              <li>✓ <b>Trợ giảng AI RAG môn học:</b> <span>Hỏi đáp bám sát giáo trình, bảo mật ngân hàng đề thi.</span></li>
            </ul>
          </div>
          <div class="card green-border" style="flex: 1;">
            <div class="card-title" style="color: var(--accent-green);">🛡️ ĐỊNH NGHĨA HOÀN THÀNH (DEFINITION OF DONE - DoD):</div>
            <ul class="check-list">
              <li>★ <b>Code Review & Version Control:</b> <span>100% PR được review bởi ít nhất 1 thành viên trước khi merge main.</span></li>
              <li>★ <b>Đạt tiêu chí chấp nhận (AC):</b> <span>Tất cả Acceptance Criteria trong User Story đều được kiểm chứng.</span></li>
              <li>★ <b>Kiểm thử tự động & API Test:</b> <span>Vượt qua toàn bộ kịch bản test API và dữ liệu mock.</span></li>
              <li>★ <b>0 Bug Blocking:</b> <span>Không tồn đọng lỗi mức Critical/High blocker khi đóng Sprint.</span></li>
              <li>★ <b>Tài liệu hóa kỹ thuật:</b> <span>Hoàn thiện sơ đồ CSDL ERD, cập nhật báo cáo tổng kết.</span></li>
            </ul>
          </div>
        </div>
        <div class="mascot-bottom-bar">
          <img src="../character/download99.jpg" class="mascot-thumb" alt="Mascot">
          <div class="bubble-content">
            <div class="bubble-author">💬 Thỏ Bảy Màu kiểm tra checklist:</div>
            <div class="bubble-text">"Làm việc chuẩn Scrum là nói có sách, mách có chứng! 5 tiêu chí DoD được kiểm tra nghiêm ngặt từng ly từng tí trước khi bấm nghiệm thu! 📱✅"</div>
          </div>
        </div>
      </div>
    </div>

    <!-- SLIDE 6: BACKLOG 100% DONE -->
    <div class="slide" id="slide-6">
      <div class="rainbow-ribbon"></div>
      <div class="slide-header">
        <div class="header-left">
          <div class="category-chip">📋 KẾT QUẢ NGHIỆM THU</div>
          <div class="slide-title">BẢNG SPRINT 1 BACKLOG & NGHIỆM THU (100% DONE)</div>
        </div>
        <div class="slide-counter">06 / 14</div>
      </div>
      <div class="slide-body" style="flex-direction: column;">
        <table class="custom-table" style="flex: 1;">
          <thead>
            <tr>
              <th style="width: 10%;">MÃ US</th>
              <th style="width: 45%;">NỘI DUNG USER STORY</th>
              <th style="width: 20%;">NGƯỜI PHỤ TRÁCH</th>
              <th style="width: 10%; text-align: center;">ĐIỂM (SP)</th>
              <th style="width: 15%; text-align: center;">TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><b>US-01</b></td><td>Khởi tạo kiến trúc Serverless & Cloudflare D1</td><td>Lê Văn An</td><td style="text-align: center;"><b>3 SP</b></td><td style="text-align: center; color: var(--accent-green); font-weight: 800;">✅ 100% DONE</td></tr>
            <tr><td><b>US-02</b></td><td>Thiết kế & chuẩn hóa CSDL 3NF (21 bảng)</td><td>Nguyễn Văn Tú</td><td style="text-align: center;"><b>5 SP</b></td><td style="text-align: center; color: var(--accent-green); font-weight: 800;">✅ 100% DONE</td></tr>
            <tr><td><b>US-03</b></td><td>Bản đồ học tập vượt ải & 106 cửa ải chương</td><td>Nguyễn Như Quỳnh</td><td style="text-align: center;"><b>5 SP</b></td><td style="text-align: center; color: var(--accent-green); font-weight: 800;">✅ 100% DONE</td></tr>
            <tr><td><b>US-04</b></td><td>Trình xem slide bài học lý thuyết & code mẫu</td><td>Nguyễn Như Quỳnh</td><td style="text-align: center;"><b>5 SP</b></td><td style="text-align: center; color: var(--accent-green); font-weight: 800;">✅ 100% DONE</td></tr>
            <tr><td><b>US-05</b></td><td>Hệ thống câu hỏi trắc nghiệm & giải thích</td><td>Lê Văn An</td><td style="text-align: center;"><b>5 SP</b></td><td style="text-align: center; color: var(--accent-green); font-weight: 800;">✅ 100% DONE</td></tr>
            <tr><td><b>US-06</b></td><td>Cơ chế Gamification (Hearts, Gems, Streak)</td><td>Nguyễn Như Quỳnh</td><td style="text-align: center;"><b>3 SP</b></td><td style="text-align: center; color: var(--accent-green); font-weight: 800;">✅ 100% DONE</td></tr>
            <tr><td><b>US-07</b></td><td>Hồ sơ cá nhân & Tủ 12 danh hiệu học viên</td><td>Nguyễn Như Quỳnh</td><td style="text-align: center;"><b>3 SP</b></td><td style="text-align: center; color: var(--accent-green); font-weight: 800;">✅ 100% DONE</td></tr>
            <tr><td><b>US-08</b></td><td>Trợ giảng AI RAG chuyên sâu từng môn học</td><td>Lê Văn An</td><td style="text-align: center;"><b>5 SP</b></td><td style="text-align: center; color: var(--accent-green); font-weight: 800;">✅ 100% DONE</td></tr>
            <tr><td><b>US-09</b></td><td>Cẩm nang ghi chú All-in-One theo bài học</td><td>Nguyễn Văn Tú</td><td style="text-align: center;"><b>2 SP</b></td><td style="text-align: center; color: var(--accent-green); font-weight: 800;">✅ 100% DONE</td></tr>
            <tr><td><b>US-10</b></td><td>Kiểm thử tự động & Tối ưu hiệu năng tải</td><td>Nguyễn Văn Tú</td><td style="text-align: center;"><b>2 SP</b></td><td style="text-align: center; color: var(--accent-green); font-weight: 800;">✅ 100% DONE</td></tr>
          </tbody>
        </table>
        <div class="mascot-bottom-bar" style="margin-top: 8px;">
          <img src="../character/AoV.jpg" class="mascot-thumb" alt="Mascot">
          <div class="bubble-content">
            <div class="bubble-author">💬 Thỏ Bảy Màu ăn mừng nón lá:</div>
            <div class="bubble-text">"38 trên 38 Story Points hoàn thành xuất sắc! Tỷ lệ cam kết 100%, không nợ một dòng code nào sang Sprint sau! Đỉnh nóc kịch trần luôn! 🎉✨"</div>
          </div>
        </div>
      </div>
    </div>

    <!-- SLIDE 7: ERD ARCHITECTURE -->
    <div class="slide" id="slide-7">
      <div class="rainbow-ribbon"></div>
      <div class="slide-header">
        <div class="header-left">
          <div class="category-chip">📐 KIẾN TRÚC HỆ THỐNG</div>
          <div class="slide-title">KIẾN TRÚC CƠ SỞ DỮ LIỆU ERD CHUẨN ĐẠI HỌC</div>
        </div>
        <div class="slide-counter">07 / 14</div>
      </div>
      <div class="slide-body" style="flex-direction: column;">
        <div class="col-2" style="flex: 1;">
          <div class="img-frame" style="flex: 1.8;">
            <img src="./erd_preview.png" alt="Sơ đồ ERD chuẩn đại học">
          </div>
          <div class="card" style="flex: 1; justify-content: center;">
            <div class="card-title" style="color: var(--deep-berry);">📐 THÔNG SỐ CSDL CHUẨN 3NF:</div>
            <ul class="check-list" style="gap: 10px;">
              <li><b>• 21 Thực thể (Tables):</b> <span>Phân chia khoa học giữa User, Lộ trình học liệu và Trợ giảng AI.</span></li>
              <li><b>• 108 Thuộc tính (Fields):</b> <span>Chuẩn hóa kiểu dữ liệu, định danh khóa chính PK, khóa ngoại FK, UQ.</span></li>
              <li><b>• 11 Quan hệ chính:</b> <span>Đồ thị phẳng (Planar Graph), luồng 1-N rõ ràng, 0 dây chéo nhau.</span></li>
              <li><b>• Động cơ Cloudflare D1:</b> <span>Lưu trữ Edge SQLite phân tán, truy vấn đọc dưới 30ms.</span></li>
              <li><b>• Phân cấp chuẩn mực:</b> <span>Subjects → Units → Lessons → Questions → User Mistakes.</span></li>
            </ul>
          </div>
        </div>
        <div class="mascot-bottom-bar" style="margin-top: 8px;">
          <img src="../character/download99.jpg" class="mascot-thumb" alt="Mascot">
          <div class="bubble-content">
            <div class="bubble-author">💬 Thỏ Bảy Màu tự hào:</div>
            <div class="bubble-text">"Sơ đồ ERD 21 bảng đi dây mạch in phẳng lì không chéo cọng nào! Vừa chuẩn chỉnh môn CSDL vừa sẵn sàng cho hàng triệu lượt thi đua! 📐⚡"</div>
          </div>
        </div>
      </div>
    </div>

    <!-- SLIDE 8: DEMO 1 - LEARNING MAP -->
    <div class="slide" id="slide-8">
      <div class="rainbow-ribbon"></div>
      <div class="slide-header">
        <div class="header-left">
          <div class="category-chip">🗺️ SẢN PHẨM BÀN GIAO 1</div>
          <div class="slide-title">BẢN ĐỒ LỘ TRÌNH VƯỢT ẢI & CẨM NANG HỌC TẬP</div>
        </div>
        <div class="slide-counter">08 / 14</div>
      </div>
      <div class="slide-body" style="flex-direction: column;">
        <div class="col-2" style="flex: 1;">
          <div class="img-frame" style="flex: 1.4;">
            <img src="./Screenshot 2026-10-18 180117.png" alt="Bản đồ lộ trình môn học">
          </div>
          <div class="card primary-border" style="flex: 1; justify-content: center;">
            <div class="card-title" style="color: var(--deep-berry);">🗺️ ĐỘT PHÁ LỘ TRÌNH HỌC VƯỢT ẢI:</div>
            <ul class="check-list" style="gap: 10px;">
              <li><b style="color: var(--primary-pink);">★ 10 Môn học chính thức:</b> <span>Toán rời rạc, Cấu trúc dữ liệu, Lập trình Web, CSDL...</span></li>
              <li><b style="color: var(--primary-pink);">★ 106 Cửa ải chương học:</b> <span>Lộ trình uốn lượn Duolingo-style, mở khóa tuần tự kích thích chinh phục.</span></li>
              <li><b style="color: var(--primary-pink);">★ 4.094 Slide bài học:</b> <span>Lý thuyết cô đọng, code mẫu trực quan, công thức sinh động.</span></li>
              <li><b style="color: var(--primary-pink);">★ 29.460 Câu trắc nghiệm:</b> <span>Ngân hàng câu hỏi đồ sộ kèm giải thích chi tiết khi trả lời sai.</span></li>
              <li><b style="color: var(--primary-pink);">★ Cẩm nang ghi chú All-in-One:</b> <span>Tự động liên kết và lưu trữ ghi chú của sinh viên theo từng bài.</span></li>
            </ul>
          </div>
        </div>
        <div class="mascot-bottom-bar" style="margin-top: 8px;">
          <img src="../character/download (2)9.jpg" class="mascot-thumb" alt="Mascot">
          <div class="bubble-content">
            <div class="bubble-author">💬 Thỏ Kiếm Sĩ xung trận:</div>
            <div class="bubble-text">"Hơn 29 ngàn câu hỏi và 106 cửa ải thử thách! Cứ vượt qua 1 ải là tích lũy kinh nghiệm, thăng cấp vùn vụt, học mà mê như chơi game! ⚔️🏰"</div>
          </div>
        </div>
      </div>
    </div>

    <!-- SLIDE 9: DEMO 2 - PROFILE & GAMIFICATION -->
    <div class="slide" id="slide-9">
      <div class="rainbow-ribbon"></div>
      <div class="slide-header">
        <div class="header-left">
          <div class="category-chip">🏆 SẢN PHẨM BÀN GIAO 2</div>
          <div class="slide-title">HỒ SƠ HỌC VIÊN & GAMIFICATION DUOLINGO-STYLE</div>
        </div>
        <div class="slide-counter">09 / 14</div>
      </div>
      <div class="slide-body" style="flex-direction: column;">
        <div class="col-2" style="flex: 1;">
          <div class="img-frame" style="flex: 1.4;">
            <img src="./Screenshot 2026-10-18 180227.png" alt="Hồ sơ cá nhân và Gamification">
          </div>
          <div class="card purple-border" style="flex: 1; justify-content: center;">
            <div class="card-title" style="color: var(--accent-purple);">🏆 HỆ SINH THÁI GAMIFICATION ĐỈNH CAO:</div>
            <ul class="check-list" style="gap: 10px;">
              <li><b>• ❤️ Hệ thống 5 Tim (Hearts):</b> <span>Mất tim khi làm sai, thôi thúc suy nghĩ cẩn thận, tự hồi tim theo thời gian.</span></li>
              <li><b>• 💎 Đá Quý (Gems) & XP:</b> <span>Phần thưởng xứng đáng cho mỗi bài học hoàn thành, dùng mua vật phẩm bổ trợ.</span></li>
              <li><b>• 🔥 Chuỗi Ngày Học (Streak Lửa):</b> <span>Đếm chuỗi ngày tự học liên tục, thôi thúc sinh viên vào app mỗi ngày.</span></li>
              <li><b>• 🎖️ Tủ Huy Hiệu 12 Danh Hiệu:</b> <span>Ghi nhận cột mốc (Học sinh chăm ngoan, Chiến thần code, Bậc thầy thuật toán...).</span></li>
              <li><b>• 🎒 Túi Đồ & Trang Bị Cá Nhân:</b> <span>Lưu trữ bình máu, bùa bảo vệ streak và avatar tùy biến cho học viên.</span></li>
            </ul>
          </div>
        </div>
        <div class="mascot-bottom-bar" style="margin-top: 8px;">
          <img src="../character/download.jpg" class="mascot-thumb" alt="Mascot">
          <div class="bubble-content">
            <div class="bubble-author">💬 Thỏ Bảy Màu trao giải:</div>
            <div class="bubble-text">"Trang cá nhân lung linh với tủ huy hiệu sáng choang! Ai chăm học là Thỏ phát thưởng Gems rủng rỉnh, chuỗi Streak cháy rực rỡ luôn! ⭐🏆"</div>
          </div>
        </div>
      </div>
    </div>

    <!-- SLIDE 10: DEMO 3 - AI TUTOR -->
    <div class="slide" id="slide-10">
      <div class="rainbow-ribbon"></div>
      <div class="slide-header">
        <div class="header-left">
          <div class="category-chip">🤖 SẢN PHẨM BÀN GIAO 3</div>
          <div class="slide-title">TRỢ GIẢNG "HỎI 3TG AI" THEO MÔN HỌC BẢO MẬT</div>
        </div>
        <div class="slide-counter">10 / 14</div>
      </div>
      <div class="slide-body" style="flex-direction: column;">
        <div class="col-2" style="flex: 1;">
          <div class="img-frame" style="flex: 1.4;">
            <img src="./Screenshot 2026-10-18 180301.png" alt="Trợ giảng AI theo môn học">
          </div>
          <div class="card primary-border" style="flex: 1; justify-content: center;">
            <div class="card-title" style="color: var(--deep-berry);">🤖 CÔNG NGHỆ TRỢ GIẢNG AI ĐỘT PHÁ:</div>
            <ul class="check-list" style="gap: 10px;">
              <li><b style="color: var(--accent-purple);">★ 🔒 RAG Riêng Tư & Bảo Mật Tuyệt Đối:</b> <span>Tra cứu ngữ cảnh từ giáo trình thuần văn bản, cách ly hoàn toàn không lộ đề thi.</span></li>
              <li><b style="color: var(--accent-purple);">★ 🎯 Chọn Ngữ Cảnh Từng Môn Chuyên Sâu:</b> <span>Học môn nào AI trả lời chuyên sâu môn đó, giải thích cặn kẽ từng bước.</span></li>
              <li><b style="color: var(--accent-purple);">★ ⚡ Streaming Phản Hồi Tức Thì:</b> <span>Truyền tin tốc độ cao, không gián đoạn cảm xúc học tập.</span></li>
              <li><b style="color: var(--accent-purple);">★ 💡 Định Dạng Markdown & Code Highlighter:</b> <span>Hiển thị code Python, C++, Java, SQL thụt lề chuẩn chỉ.</span></li>
              <li><b style="color: var(--accent-purple);">★ 💬 Phong Cách Sư Phạm Tận Tụy:</b> <span>Gợi ý tư duy thay vì làm hộ, giúp sinh viên thực sự hiểu sâu bài học.</span></li>
            </ul>
          </div>
        </div>
        <div class="mascot-bottom-bar" style="margin-top: 8px;">
          <img src="../character/Thỏ bảy màu.jpg" class="mascot-thumb" alt="Mascot">
          <div class="bubble-content">
            <div class="bubble-author">💬 Thỏ Giáo Sư AI:</div>
            <div class="bubble-text">"Gặp bài tập khó? Đừng hoang mang! Có Trợ giảng AI 3TG giải thích tận tình từng dòng code, học đêm học ngày không lo cô đơn nha! 🤖💡"</div>
          </div>
        </div>
      </div>
    </div>

    <!-- SLIDE 11: METRICS & VELOCITY -->
    <div class="slide" id="slide-11">
      <div class="rainbow-ribbon"></div>
      <div class="slide-header">
        <div class="header-left">
          <div class="category-chip">📊 HIỆU SUẤT AGILE</div>
          <div class="slide-title">CHỈ SỐ HIỆU SUẤT SPRINT 1 (VELOCITY & METRICS)</div>
        </div>
        <div class="slide-counter">11 / 14</div>
      </div>
      <div class="slide-body" style="flex-direction: column;">
        <div class="col-4">
          <div class="card primary-border" style="text-align: center;">
            <div class="stat-number" style="color: var(--deep-berry);">38 SP</div>
            <div style="font-weight: 800; font-size: 13px;">VELOCITY HOÀN THÀNH</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">100% mục tiêu cam kết</div>
          </div>
          <div class="card purple-border" style="text-align: center;">
            <div class="stat-number" style="color: var(--accent-purple);">10 / 10</div>
            <div style="font-weight: 800; font-size: 13px;">USER STORIES DONE</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Nghiệm thu đạt chuẩn DoD</div>
          </div>
          <div class="card green-border" style="text-align: center;">
            <div class="stat-number" style="color: var(--accent-green);">0 BUG</div>
            <div style="font-weight: 800; font-size: 13px;">CRITICAL / BLOCKING</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Chất lượng code ổn định cao</div>
          </div>
          <div class="card yellow-border" style="text-align: center;">
            <div class="stat-number" style="color: var(--accent-yellow);">&lt; 38 ms</div>
            <div style="font-weight: 800; font-size: 13px;">ĐỘ TRỄ API D1</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Tốc độ đọc ghi Edge SQLite</div>
          </div>
        </div>
        <div class="card" style="flex: 1; margin-top: 10px;">
          <div class="card-title" style="color: var(--deep-berry);">📈 PHÂN TÍCH TIẾN ĐỘ BURNDOWN & SỨC KHỎE DỰ ÁN SPRINT 1:</div>
          <ul class="check-list" style="gap: 8px;">
            <li><b>• Nhịp độ Burndown lý tưởng:</b> <span>Đường khối lượng công việc giảm đều đặn từ 38 SP về 0 SP trong suốt 14 ngày, không dồn việc vào phút chót.</span></li>
            <li><b>• Hiệu quả phối hợp Agile:</b> <span>Daily Standup 15 phút mỗi sáng giải quyết ngay các blocker liên quan đến đồng bộ dữ liệu và chuẩn giao tiếp API.</span></li>
            <li><b>• Chất lượng kỹ thuật (Clean Code):</b> <span>Tuân thủ nghiêm ngặt quy chuẩn Clean Code, chuẩn hóa 3NF giúp backend và frontend ăn khớp hoàn hảo.</span></li>
            <li><b>• Không phát sinh nợ kỹ thuật:</b> <span>Toàn bộ tài liệu ERD, API schema và test case đều được hoàn thiện song song với quá trình phát triển.</span></li>
          </ul>
        </div>
        <div class="mascot-bottom-bar" style="margin-top: 8px;">
          <img src="../character/AoV.jpg" class="mascot-thumb" alt="Mascot">
          <div class="bubble-content">
            <div class="bubble-author">💬 Thỏ Bảy Màu tự hào:</div>
            <div class="bubble-text">"Biểu đồ tiến độ dốc đều tăm tắp, không có cảnh thức trắng đêm 'chữa cháy'! Đúng chuẩn phong cách Agile chuyên nghiệp của 3TG! 📊🚀"</div>
          </div>
        </div>
      </div>
    </div>

    <!-- SLIDE 12: RETROSPECTIVE -->
    <div class="slide" id="slide-12">
      <div class="rainbow-ribbon"></div>
      <div class="slide-header">
        <div class="header-left">
          <div class="category-chip">🔄 CẢI TIẾN QUY TRÌNH</div>
          <div class="slide-title">HỌP CẢI TIẾN SPRINT RETROSPECTIVE (RÚT KINH NGHIỆM)</div>
        </div>
        <div class="slide-counter">12 / 14</div>
      </div>
      <div class="slide-body" style="flex-direction: column;">
        <div class="col-3" style="flex: 1;">
          <div class="card green-border">
            <div class="card-title" style="color: var(--accent-green);">🌟 ĐIỂM LÀM TỐT (WENT WELL)</div>
            <hr style="border: none; border-top: 1px dashed var(--pastel-border); margin: 6px 0;">
            <ul class="check-list">
              <li>• Tinh thần đồng đội cao, hỗ trợ nhiệt tình</li>
              <li>• Thiết kế CSDL 3NF chuẩn từ đầu giúp code mượt mà</li>
              <li>• Mascot Thỏ 7 Màu tạo điểm nhấn thương hiệu độc đáo</li>
              <li>• Hoàn thành 100% mục tiêu đúng hạn, không delay</li>
              <li>• Giao diện Gamification nhận phản hồi rất tích cực</li>
            </ul>
          </div>
          <div class="card yellow-border">
            <div class="card-title" style="color: var(--accent-yellow);">⚠️ ĐIỂM CẦN CẢI THIỆN (TO IMPROVE)</div>
            <hr style="border: none; border-top: 1px dashed var(--pastel-border); margin: 6px 0;">
            <ul class="check-list">
              <li>• Hiệu ứng animation đôi lúc tốn tài nguyên máy yếu</li>
              <li>• Công tác import dữ liệu câu hỏi ban đầu còn thủ công</li>
              <li>• Cần tăng độ phủ kiểm thử giao diện tự động (E2E)</li>
              <li>• Chưa có tính năng thi đấu thời gian thực giữa sinh viên</li>
            </ul>
          </div>
          <div class="card primary-border">
            <div class="card-title" style="color: var(--deep-berry);">🔧 HÀNH ĐỘNG CỤ THỂ (ACTION ITEMS)</div>
            <hr style="border: none; border-top: 1px dashed var(--pastel-border); margin: 6px 0;">
            <ul class="check-list">
              <li>• Áp dụng Code Splitting & tối ưu CSS Hardware Acceleration</li>
              <li>• Xây dựng script tự động import đề thi từ Excel/Word</li>
              <li>• Thiết lập bộ test Cypress / Playwright cho giao diện</li>
              <li>• Bổ sung tính năng Đấu trường PvP 1v1 ngay trong Sprint 2</li>
            </ul>
          </div>
        </div>
        <div class="mascot-bottom-bar">
          <img src="../character/Thỏ bảy màu8.jpg" class="mascot-thumb" alt="Mascot">
          <div class="bubble-content">
            <div class="bubble-author">💬 Thỏ Bảy Màu rút kinh nghiệm:</div>
            <div class="bubble-text">"Có nhìn lại mới thấy mình trưởng thành! Những vấp váp nhỏ của Sprint 1 sẽ là đòn bẩy để Sprint 2 bùng nổ dữ dội hơn nữa! 🐾📝"</div>
          </div>
        </div>
      </div>
    </div>

    <!-- SLIDE 13: SPRINT 2 ROADMAP -->
    <div class="slide" id="slide-13">
      <div class="rainbow-ribbon"></div>
      <div class="slide-header">
        <div class="header-left">
          <div class="category-chip">🚀 KẾ HOẠCH TƯƠNG LAI</div>
          <div class="slide-title">KẾ HOẠCH HÀNH ĐỘNG CHI TIẾT SPRINT 2 (ROADMAP)</div>
        </div>
        <div class="slide-counter">13 / 14</div>
      </div>
      <div class="slide-body" style="flex-direction: column;">
        <div class="col-4" style="flex: 1;">
          <div class="card primary-border">
            <div class="card-title" style="color: var(--deep-berry); font-size: 13px;">⚔️ 1. ĐẤU TRƯỜNG PvP</div>
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">Thách đấu 1v1 trực tiếp</div>
            <ul class="check-list" style="font-size: 12px;">
              <li>• Ghép cặp ngẫu nhiên / thách đấu bạn bè</li>
              <li>• Giải nhanh 5 câu trắc nghiệm thời gian thực</li>
              <li>• Hiển thị thanh máu & tốc độ đối thủ</li>
              <li>• Cộng trừ cúp xếp hạng (Trophies)</li>
            </ul>
          </div>
          <div class="card yellow-border">
            <div class="card-title" style="color: var(--accent-yellow); font-size: 13px;">🛒 2. SHOP 3TG</div>
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">Kinh tế Gamification</div>
            <ul class="check-list" style="font-size: 12px;">
              <li>• Đổi Gems lấy Bình hồi máu (Full Hearts)</li>
              <li>• Bùa bảo vệ chuỗi Streak khi bận việc</li>
              <li>• Mở khóa skin trang phục Thỏ 7 Màu</li>
              <li>• Huy hiệu danh giá độc quyền trong Shop</li>
            </ul>
          </div>
          <div class="card purple-border">
            <div class="card-title" style="color: var(--accent-purple); font-size: 13px;">🏆 3. LEAGUES TUẦN</div>
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">Bảng xếp hạng thi đua</div>
            <ul class="check-list" style="font-size: 12px;">
              <li>• 5 Bậc giải đấu: Đồng, Bạc, Vàng, KC, Thần Thoại</li>
              <li>• Top 10 sinh viên thăng hạng hàng tuần</li>
              <li>• Reset bảng xếp hạng tối Chủ Nhật</li>
              <li>• Vinh danh quà tặng Gems và danh hiệu</li>
            </ul>
          </div>
          <div class="card green-border">
            <div class="card-title" style="color: var(--accent-green); font-size: 13px;">📊 4. AI PHÂN TÍCH</div>
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">Cá nhân hóa thông minh</div>
            <ul class="check-list" style="font-size: 12px;">
              <li>• Thống kê dạng câu hỏi hay làm sai</li>
              <li>• Gợi ý lộ trình ôn tập lấp lỗ hổng</li>
              <li>• Dự báo xác suất đỗ kỳ thi hết môn</li>
              <li>• Báo cáo học tập trực quan cho sinh viên</li>
            </ul>
          </div>
        </div>
        <div class="mascot-bottom-bar">
          <img src="../character/download (2)9.jpg" class="mascot-thumb" alt="Mascot">
          <div class="bubble-content">
            <div class="bubble-author">💬 Thỏ Bảy Màu hào hứng:</div>
            <div class="bubble-text">"Sprint 2 sẽ là sân chơi so trình cực gắt với tính năng PvP thời gian thực! Mời anh em mài sắc kiếm sẵn sàng leo rank cùng Thỏ nha! ⚔️🔥"</div>
          </div>
        </div>
      </div>
    </div>

    <!-- SLIDE 14: THANK YOU & Q&A -->
    <div class="slide" id="slide-14">
      <div class="rainbow-ribbon"></div>
      <div class="slide-header">
        <div class="header-left">
          <div class="category-chip">💖 LỜI CẢM ƠN</div>
          <div class="slide-title" style="color: var(--deep-berry);">CHÂN THÀNH CẢM ƠN THẦY CÔ & CÁC BẠN!</div>
        </div>
        <div class="slide-counter">14 / 14</div>
      </div>
      <div class="slide-body">
        <div class="card primary-border" style="flex: 1.4; justify-content: center;">
          <div class="card-title" style="font-size: 18px; color: var(--deep-berry);">🌸 TỔNG KẾT & PHIÊN HỎI ĐÁP (Q&A SESSION):</div>
          <ul class="check-list" style="gap: 14px; margin-top: 10px;">
            <li><b style="color: var(--primary-pink); font-size: 15px;">★ Hoàn thành xuất sắc sứ mệnh Sprint 1:</b> <span>100% mục tiêu cốt lõi đã được hiện thực hóa, tạo nền móng vững chắc cho nền tảng 3TG.</span></li>
            <li><b style="color: var(--primary-pink); font-size: 15px;">★ Lời tri ân sâu sắc:</b> <span>Xin chân thành cảm ơn sự hướng dẫn tận tình, những góp ý chuyên môn quý báu của Giảng viên bộ môn Công nghệ phần mềm - Đại học CMC!</span></li>
            <li><b style="color: var(--primary-pink); font-size: 15px;">★ Cam kết chặng đường tiếp theo:</b> <span>Đội ngũ 3TG cam kết tiếp tục nỗ lực phát huy cao độ tinh thần Agile, đưa sản phẩm phục vụ sinh viên tốt nhất.</span></li>
            <li><b style="color: var(--primary-pink); font-size: 15px;">★ Mời đặt câu hỏi thảo luận:</b> <span>Rất mong nhận được những câu hỏi, đánh giá và đóng góp ý kiến từ Thầy Cô và các bạn!</span></li>
          </ul>
        </div>
        <div class="card primary-border" style="flex: 1; align-items: center; justify-content: center; background: white;">
          <img src="../character/AoV.jpg" style="width: 230px; border-radius: 16px; margin-bottom: 12px; border: 2px solid var(--pastel-border);" alt="Thỏ Bảy Màu ăn mừng">
          <div style="background: var(--callout-bg); border: 1.5px solid var(--primary-pink); padding: 12px; border-radius: 12px; text-align: center;">
            <div style="font-weight: 900; color: var(--deep-berry); font-size: 13px;">💬 Thỏ Bảy Màu nhắn nhủ:</div>
            <div style="font-size: 13px; font-style: italic; color: var(--text-dark); margin-top: 4px;">
              "Buổi báo cáo kết thúc rồi nè! Thầy Cô và các bạn có câu hỏi gì cứ hỏi tự nhiên nha, đừng hỏi đề thi hóc búa quá Thỏ giận á nghen! Cảm ơn mọi người nhiều ạ! 💖🎉"
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>

  <!-- Bottom Navigation Bar -->
  <div class="nav-bar">
    <button class="nav-btn" id="btnPrev">← Trang Trước (Left)</button>
    <div class="slide-dots" id="dotsContainer"></div>
    <button class="nav-btn" id="btnNext">Trang Tiếp (Right) →</button>
  </div>

  <!-- Audio Context for Kawaii Sound Effects (Web Audio API) -->
  <script>
    let currentSlide = 1;
    const totalSlides = 14;
    let soundEnabled = true;

    // Web Audio API Synthesizer
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;

    function playPopSound() {
      if (!soundEnabled) return;
      try {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.13);
      } catch (e) {
        console.log("Audio not supported", e);
      }
    }

    // Initialize Dots
    const dotsContainer = document.getElementById('dotsContainer');
    for (let i = 1; i <= totalSlides; i++) {
      const dot = document.createElement('div');
      dot.className = `dot ${i === 1 ? 'active' : ''}`;
      dot.title = `Chuyển tới slide ${i}`;
      dot.onclick = () => goToSlide(i);
      dotsContainer.appendChild(dot);
    }

    function updateSlide() {
      document.querySelectorAll('.slide').forEach((s, idx) => {
        s.classList.toggle('active', (idx + 1) === currentSlide);
      });
      document.querySelectorAll('.dot').forEach((d, idx) => {
        d.classList.toggle('active', (idx + 1) === currentSlide);
      });
      document.getElementById('btnPrev').disabled = (currentSlide === 1);
      document.getElementById('btnNext').disabled = (currentSlide === totalSlides);
      playPopSound();
    }

    function goToSlide(n) {
      if (n >= 1 && n <= totalSlides) {
        currentSlide = n;
        updateSlide();
      }
    }

    document.getElementById('btnPrev').onclick = () => {
      if (currentSlide > 1) {
        currentSlide--;
        updateSlide();
      }
    };

    document.getElementById('btnNext').onclick = () => {
      if (currentSlide < totalSlides) {
        currentSlide++;
        updateSlide();
      }
    };

    // Keyboard Navigation
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        if (currentSlide < totalSlides) {
          currentSlide++;
          updateSlide();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (currentSlide > 1) {
          currentSlide--;
          updateSlide();
        }
      } else if (e.key === 'Home') {
        currentSlide = 1;
        updateSlide();
      } else if (e.key === 'End') {
        currentSlide = totalSlides;
        updateSlide();
      }
    });

    // Sound Toggle
    const btnSound = document.getElementById('btnSound');
    btnSound.onclick = () => {
      soundEnabled = !soundEnabled;
      btnSound.innerText = soundEnabled ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
    };

    // Fullscreen Toggle
    const btnFullscreen = document.getElementById('btnFullscreen');
    btnFullscreen.onclick = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        btnFullscreen.innerText = '⛶ Thu nhỏ';
      } else {
        document.exitFullscreen();
        btnFullscreen.innerText = '⛶ Toàn màn hình';
      }
    };
  </script>
</body>
</html>
'''
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"Generated HTML Slide Deck: {out_path}")
    return out_path

if __name__ == "__main__":
    generate_html_slides()
