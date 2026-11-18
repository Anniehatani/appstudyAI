import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

fig_dir = r'tổng kết dự án/figures'
os.makedirs(fig_dir, exist_ok=True)

# Common styling
NAVY = '#0A2540'
STEEL = '#20639B'
LIGHT_BLUE = '#EDF5FC'
BORDER_COLOR = '#1E3A8A'
DARK_TEXT = '#0F172A'
WHITE = '#FFFFFF'
ACCENT_GREEN = '#10B981'
ACCENT_GOLD = '#F59E0B'
ACCENT_GRAY = '#64748B'

def draw_use_case():
    fig, ax = plt.subplots(figsize=(12, 8), dpi=300)
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 8)
    ax.axis('off')
    
    # Title
    ax.text(6, 7.6, 'SƠ ĐỒ USE CASE TỔNG THỂ HỆ THỐNG 3TG STUDY AI (UML 2.5)', 
            fontsize=13, fontweight='bold', ha='center', color=NAVY, fontfamily='serif')

    # System Boundary Box
    rect = patches.FancyBboxPatch((2.4, 0.4), 7.2, 6.8, boxstyle="round,pad=0.1",
                                  facecolor='#F8FAFC', edgecolor=NAVY, linewidth=1.5, linestyle='--')
    ax.add_patch(rect)
    ax.text(6, 6.9, 'Boundary: Hệ Thống Học Tập 3TG Study AI Desktop & Cloud', 
            fontsize=10.5, fontweight='bold', ha='center', color=NAVY, fontfamily='serif')

    # Actors
    # Actor 1: Học viên (Learner)
    ax.plot([1.2, 1.2], [4.5, 4.0], color=NAVY, lw=2) # body
    circle = patches.Circle((1.2, 4.8), 0.25, facecolor='#E2E8F0', edgecolor=NAVY, lw=2) # head
    ax.add_patch(circle)
    ax.plot([0.8, 1.6], [4.3, 4.3], color=NAVY, lw=2) # arms
    ax.plot([1.2, 0.9], [4.0, 3.4], color=NAVY, lw=2) # left leg
    ax.plot([1.2, 1.5], [4.0, 3.4], color=NAVY, lw=2) # right leg
    ax.text(1.2, 3.0, 'Học Viên\n(Sinh viên đại học)', fontsize=9.5, fontweight='bold', ha='center', color=NAVY, fontfamily='serif')

    # Actor 2: Trợ lý 3TG AI
    ax.plot([10.8, 10.8], [5.5, 5.0], color=STEEL, lw=2)
    circle2 = patches.Circle((10.8, 5.8), 0.25, facecolor='#E0F2FE', edgecolor=STEEL, lw=2)
    ax.add_patch(circle2)
    ax.plot([10.4, 11.2], [5.3, 5.3], color=STEEL, lw=2)
    ax.plot([10.8, 10.5], [5.0, 4.4], color=STEEL, lw=2)
    ax.plot([10.8, 11.1], [5.0, 4.4], color=STEEL, lw=2)
    ax.text(10.8, 4.0, 'Hệ Thống 3TG AI\n(Groq LLM/Vision)', fontsize=9.5, fontweight='bold', ha='center', color=STEEL, fontfamily='serif')

    # Actor 3: Quản trị viên (Admin)
    ax.plot([10.8, 10.8], [2.2, 1.7], color='#475569', lw=2)
    circle3 = patches.Circle((10.8, 2.5), 0.25, facecolor='#F1F5F9', edgecolor='#475569', lw=2)
    ax.add_patch(circle3)
    ax.plot([10.4, 11.2], [2.0, 2.0], color='#475569', lw=2)
    ax.plot([10.8, 10.5], [1.7, 1.1], color='#475569', lw=2)
    ax.plot([10.8, 11.1], [1.7, 1.1], color='#475569', lw=2)
    ax.text(10.8, 0.7, 'Quản Trị Viên\n(Giảng viên/Admin)', fontsize=9.5, fontweight='bold', ha='center', color='#475569', fontfamily='serif')

    # Use cases (Ovals)
    use_cases = [
        ('UC-01: Đăng ký / Đăng nhập bảo mật PBKDF2', 4.2, 6.2),
        ('UC-02: Chinh phục lộ trình học Gamification', 7.5, 6.2),
        ('UC-03: Học tập Pomodoro Zen Focus Kiosk', 4.2, 4.8),
        ('UC-04: Nghe nhạc Local Offline (HTTP 206)', 7.5, 4.8),
        ('UC-05: Đọc tài liệu PDF & Soạn thảo Sổ tay', 4.2, 3.4),
        ('UC-06: Tham vấn Trợ lý AI (Text & Ảnh Ctrl+V)', 7.5, 3.4),
        ('UC-07: Tra cứu & Đồng bộ Bảng điểm IU', 4.2, 2.0),
        ('UC-08: Nhắn tin nhóm 3TG Messenger', 7.5, 2.0),
        ('UC-09: Quản lý kho bài học & Ngân hàng đề thi', 6.0, 0.9)
    ]

    for title, x, y in use_cases:
        ellipse = patches.Ellipse((x, y), 2.8, 0.75, facecolor=WHITE, edgecolor=BORDER_COLOR, linewidth=1.2)
        ax.add_patch(ellipse)
        ax.text(x, y, title, fontsize=8, ha='center', va='center', color=DARK_TEXT, fontfamily='serif', fontweight='semibold')

    # Connection lines from Actor 1 (Learner)
    learner_targets = [(4.2, 6.2), (7.5, 6.2), (4.2, 4.8), (7.5, 4.8), (4.2, 3.4), (7.5, 3.4), (4.2, 2.0), (7.5, 2.0)]
    for tx, ty in learner_targets:
        ax.annotate('', xy=(tx - 1.3, ty), xytext=(1.6, 4.2),
                    arrowprops=dict(arrowstyle="-", color='#64748B', lw=1, alpha=0.8))

    # Connection lines from Actor 2 (AI)
    ax.annotate('', xy=(7.5 + 1.3, 3.4), xytext=(10.4, 5.2),
                arrowprops=dict(arrowstyle="-", color=STEEL, lw=1.2))

    # Connection lines from Actor 3 (Admin)
    ax.annotate('', xy=(6.0 + 1.4, 0.9), xytext=(10.4, 1.8),
                arrowprops=dict(arrowstyle="-", color='#475569', lw=1.2))

    plt.tight_layout()
    out_path = os.path.join(fig_dir, 'fig_use_case_diagram.png')
    plt.savefig(out_path, dpi=300, bbox_inches='tight')
    plt.close()
    print("✅ Created fig_use_case_diagram.png")

def draw_erd():
    fig, ax = plt.subplots(figsize=(14, 9), dpi=300)
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 9)
    ax.axis('off')

    ax.text(7, 8.6, 'SƠ ĐỒ THỰC THỂ LIÊN KẾT CƠ SỞ DỮ LIỆU SQL (RELATIONAL ERD - 3NF)', 
            fontsize=13, fontweight='bold', ha='center', color=NAVY, fontfamily='serif')

    # Helper to draw entity table
    def draw_entity(x, y, w, h, table_name, pk_cols, normal_cols):
        # Outer box
        box = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.04", facecolor=WHITE, edgecolor=NAVY, lw=1.4)
        ax.add_patch(box)
        # Header bar
        hdr = patches.Rectangle((x, y + h - 0.5), w, 0.5, facecolor=NAVY, edgecolor=NAVY)
        ax.add_patch(hdr)
        ax.text(x + w/2, y + h - 0.28, table_name, fontsize=8.5, fontweight='bold', ha='center', color=WHITE, fontfamily='serif')
        
        # PK text
        curr_y = y + h - 0.8
        for pk in pk_cols:
            ax.text(x + 0.15, curr_y, 'PK', fontsize=7.5, fontweight='bold', color='#DC2626', fontfamily='serif')
            ax.text(x + 0.55, curr_y, pk, fontsize=7.5, fontweight='bold', color=DARK_TEXT, fontfamily='serif')
            curr_y -= 0.32
            
        # Line separator
        ax.plot([x, x + w], [curr_y + 0.12, curr_y + 0.12], color='#CBD5E1', lw=0.8)
        curr_y -= 0.1
        
        # Normal columns
        for col in normal_cols:
            is_fk = '(FK)' in col
            prefix = 'FK' if is_fk else '•'
            pcolor = '#2563EB' if is_fk else '#64748B'
            ax.text(x + 0.15, curr_y, prefix, fontsize=7, fontweight='bold', color=pcolor, fontfamily='serif')
            ax.text(x + 0.55, curr_y, col.replace('(FK)', ''), fontsize=7, color=DARK_TEXT, fontfamily='serif')
            curr_y -= 0.28

    # Table 1: accounts (Master Auth)
    draw_entity(0.5, 5.0, 2.8, 2.8, 'accounts', ['id: TEXT'], ['username: TEXT (UQ)', 'password_hash: TEXT', 'role: TEXT', 'created_at: DATETIME'])

    # Table 2: profiles (1-1)
    draw_entity(4.0, 5.2, 2.8, 2.6, 'profiles', ['user_id: TEXT (FK)'], ['display_name: TEXT', 'color_theme: TEXT', 'status_icon: TEXT', 'social_links: TEXT'])

    # Table 3: user_stats (1-1)
    draw_entity(7.5, 5.2, 2.8, 2.6, 'user_stats', ['user_id: TEXT (FK)'], ['total_xp: INT', 'current_streak: INT', 'gems: INT', 'hearts: INT'])

    # Table 4: pomodoro_active_learners
    draw_entity(11.0, 5.6, 2.6, 2.2, 'pomodoro_active', ['user_id: TEXT (FK)'], ['started_at: DATETIME', 'target_cycles: INT'])

    # Table 5: user_pomodoro_sessions (1-N)
    draw_entity(11.0, 2.2, 2.6, 2.7, 'pomodoro_sessions', ['id: TEXT'], ['user_id: TEXT (FK)', 'cycles: INT', 'focus_minutes: INT', 'xp_reward: INT', 'completed_at: DATETIME'])

    # Table 6: user_academic_transcripts
    draw_entity(0.5, 1.4, 2.8, 2.8, 'academic_transcripts', ['id: INTEGER (AUTO)'], ['user_id: TEXT (FK, UQ)', 'student_code: TEXT', 'full_name: TEXT', 'gpa_4: REAL', 'created_at: DATETIME'])

    # Table 7: user_notes
    draw_entity(4.0, 1.6, 2.8, 2.6, 'user_notes', ['id: TEXT'], ['user_id: TEXT (FK)', 'title: TEXT', 'content: TEXT', 'updated_at: DATETIME'])

    # Table 8: sync_outbox
    draw_entity(7.5, 1.6, 2.8, 2.6, 'sync_outbox', ['id: TEXT'], ['operation: TEXT', 'payload: JSON TEXT', 'status: TEXT (pending)', 'created_at: DATETIME'])

    # Relationships (Lines)
    # accounts -> profiles (1-1)
    ax.annotate('', xy=(4.0, 6.4), xytext=(3.3, 6.4), arrowprops=dict(arrowstyle="<->", color=NAVY, lw=1.5))
    ax.text(3.65, 6.55, '1:1', fontsize=7.5, fontweight='bold', color=NAVY, ha='center')

    # accounts -> user_stats (1-1)
    ax.annotate('', xy=(7.5, 6.4), xytext=(6.8, 6.4), arrowprops=dict(arrowstyle="<->", color=NAVY, lw=1.5))
    ax.text(7.15, 6.55, '1:1', fontsize=7.5, fontweight='bold', color=NAVY, ha='center')

    # user_stats -> pomodoro_active
    ax.annotate('', xy=(11.0, 6.6), xytext=(10.3, 6.6), arrowprops=dict(arrowstyle="<->", color=NAVY, lw=1.5))

    # accounts -> pomodoro_sessions (1-N)
    ax.annotate('', xy=(11.0, 3.5), xytext=(3.3, 5.2), arrowprops=dict(arrowstyle="->", color=NAVY, lw=1.2, connectionstyle="arc3,rad=-0.15"))
    ax.text(7.0, 4.0, '1 : N', fontsize=7.5, fontweight='bold', color=NAVY)

    # accounts -> academic_transcripts (1-1)
    ax.annotate('', xy=(1.9, 4.2), xytext=(1.9, 5.0), arrowprops=dict(arrowstyle="<->", color=NAVY, lw=1.5))
    ax.text(2.15, 4.6, '1:1', fontsize=7.5, fontweight='bold', color=NAVY)

    # accounts -> user_notes (1-N)
    ax.annotate('', xy=(4.0, 3.2), xytext=(3.1, 5.0), arrowprops=dict(arrowstyle="->", color=NAVY, lw=1.2))
    ax.text(3.2, 4.0, '1:N', fontsize=7.5, fontweight='bold', color=NAVY)

    plt.tight_layout()
    out_path = os.path.join(fig_dir, 'fig_erd_database.png')
    plt.savefig(out_path, dpi=300, bbox_inches='tight')
    plt.close()
    print("✅ Created fig_erd_database.png")

def draw_architecture():
    fig, ax = plt.subplots(figsize=(13, 8), dpi=300)
    ax.set_xlim(0, 13)
    ax.set_ylim(0, 8)
    ax.axis('off')

    ax.text(6.5, 7.6, 'SƠ ĐỒ KIẾN TRÚC PHÂN TẦNG HỆ THỐNG 3TG STUDY AI (HYBRID EDGE-SERVERLESS)', 
            fontsize=13, fontweight='bold', ha='center', color=NAVY, fontfamily='serif')

    # Layer 1: Client Presentation Layer
    box1 = patches.FancyBboxPatch((0.5, 5.4), 12.0, 1.8, boxstyle="round,pad=0.08", facecolor='#F1F5F9', edgecolor=NAVY, lw=1.2)
    ax.add_patch(box1)
    ax.text(1.0, 6.9, 'TẦNG 1: PRESENTATION & CLIENT UI LAYER (Electron Single Page Application)', fontsize=9.5, fontweight='bold', color=NAVY, fontfamily='serif')
    
    sub1_1 = patches.Rectangle((0.8, 5.6), 2.5, 1.1, facecolor=WHITE, edgecolor='#94A3B8')
    ax.add_patch(sub1_1)
    ax.text(2.05, 6.15, 'Lộ Trình Gamification\n(Cây bài học, Streak, XP)', fontsize=8, ha='center', color=DARK_TEXT, fontfamily='serif')

    sub1_2 = patches.Rectangle((3.6, 5.6), 2.7, 1.1, facecolor=WHITE, edgecolor='#94A3B8')
    ax.add_patch(sub1_2)
    ax.text(4.95, 6.15, 'Phòng Học Focus Kiosk\n(Timer, Zen Multi-Monitor)', fontsize=8, ha='center', color=DARK_TEXT, fontfamily='serif')

    sub1_3 = patches.Rectangle((6.6, 5.6), 2.7, 1.1, facecolor=WHITE, edgecolor='#94A3B8')
    ax.add_patch(sub1_3)
    ax.text(7.95, 6.15, 'Trình Đọc PDF.js Canvas\n(Render Canvas, Buffer Slice)', fontsize=8, ha='center', color=DARK_TEXT, fontfamily='serif')

    sub1_4 = patches.Rectangle((9.6, 5.6), 2.6, 1.1, facecolor=WHITE, edgecolor='#94A3B8')
    ax.add_patch(sub1_4)
    ax.text(10.9, 6.15, 'Khung Chat Trợ Lý AI\n(Hỏi đáp, Paste Ctrl+V)', fontsize=8, ha='center', color=DARK_TEXT, fontfamily='serif')

    # Layer 2: Client Runtime & Native Guard Layer
    box2 = patches.FancyBboxPatch((0.5, 3.4), 12.0, 1.6, boxstyle="round,pad=0.08", facecolor='#E2E8F0', edgecolor=NAVY, lw=1.2)
    ax.add_patch(box2)
    ax.text(1.0, 4.7, 'TẦNG 2: DESKTOP RUNTIME & NATIVE SECURITY LAYER (Win32 Hook & Embedded Server)', fontsize=9.5, fontweight='bold', color=NAVY, fontfamily='serif')

    sub2_1 = patches.Rectangle((0.8, 3.6), 3.4, 0.9, facecolor=WHITE, edgecolor='#64748B')
    ax.add_patch(sub2_1)
    ax.text(2.5, 4.05, 'Electron Main (main.cjs & preload.cjs)\nContext Isolation & IPC Handlers', fontsize=7.5, ha='center', color=DARK_TEXT, fontfamily='serif')

    sub2_2 = patches.Rectangle((4.5, 3.6), 3.8, 0.9, facecolor='#FEF3C7', edgecolor='#D97706', lw=1.2)
    ax.add_patch(sub2_2)
    ax.text(6.4, 4.05, 'C++ Native Guard (study_guard.exe)\nWin32 API Hook <5ms Taskbar Restore', fontsize=8, fontweight='bold', ha='center', color='#92400E', fontfamily='serif')

    sub2_3 = patches.Rectangle((8.6, 3.6), 3.6, 0.9, facecolor='#E0F2FE', edgecolor='#0284C7', lw=1.2)
    ax.add_patch(sub2_3)
    ax.text(10.4, 4.05, 'Embedded Node Server (Port 3000)\nHTTP 206 Local Audio Stream (0 Cloud)', fontsize=8, fontweight='bold', ha='center', color='#075985', fontfamily='serif')

    # Layer 3: Cloud Edge & Backend Services
    box3 = patches.FancyBboxPatch((0.5, 1.4), 12.0, 1.6, boxstyle="round,pad=0.08", facecolor='#F8FAFC', edgecolor=NAVY, lw=1.2)
    ax.add_patch(box3)
    ax.text(1.0, 2.7, 'TẦNG 3: CLOUD SERVERLESS EDGE & PERSISTENCE LAYER (Cloudflare Workers & D1)', fontsize=9.5, fontweight='bold', color=NAVY, fontfamily='serif')

    sub3_1 = patches.Rectangle((0.8, 1.6), 3.2, 0.9, facecolor=WHITE, edgecolor='#64748B')
    ax.add_patch(sub3_1)
    ax.text(2.4, 2.05, 'Cloudflare Worker Router (index.js)\nRESTful APIs & Cookie Session Auth', fontsize=7.5, ha='center', color=DARK_TEXT, fontfamily='serif')

    sub3_2 = patches.Rectangle((4.3, 1.6), 3.8, 0.9, facecolor=WHITE, edgecolor='#64748B')
    ax.add_patch(sub3_2)
    ax.text(6.2, 2.05, 'Security & Logic Modules\n(crypto.js, pomodoro_validator.js)', fontsize=7.5, ha='center', color=DARK_TEXT, fontfamily='serif')

    sub3_3 = patches.Rectangle((8.4, 1.6), 3.8, 0.9, facecolor=WHITE, edgecolor='#64748B')
    ax.add_patch(sub3_3)
    ax.text(10.3, 2.05, 'Cloudflare D1 Distributed SQLite\n(Transactional Outbox & 3NF Schema)', fontsize=7.5, ha='center', color=DARK_TEXT, fontfamily='serif')

    # External AI Services Layer
    box4 = patches.Rectangle((3.5, 0.2), 6.0, 0.9, facecolor='#ECFDF5', edgecolor=ACCENT_GREEN, lw=1.2)
    ax.add_patch(box4)
    ax.text(6.5, 0.65, 'TẦNG 4: HIGH-SPEED AI PIPELINE (Groq LPU)\nopenai/gpt-oss-120b & qwen/qwen3.8-27b Vision (<0.3s)', 
            fontsize=8, fontweight='bold', ha='center', color='#065F46', fontfamily='serif')

    # Connecting vertical arrows
    ax.annotate('', xy=(6.5, 5.4), xytext=(6.5, 5.0), arrowprops=dict(arrowstyle="->", color=NAVY, lw=1.5))
    ax.annotate('', xy=(6.5, 3.4), xytext=(6.5, 3.0), arrowprops=dict(arrowstyle="->", color=NAVY, lw=1.5))
    ax.annotate('', xy=(6.5, 1.4), xytext=(6.5, 1.1), arrowprops=dict(arrowstyle="->", color=ACCENT_GREEN, lw=1.5))

    plt.tight_layout()
    out_path = os.path.join(fig_dir, 'fig_system_architecture.png')
    plt.savefig(out_path, dpi=300, bbox_inches='tight')
    plt.close()
    print("✅ Created fig_system_architecture.png")

def draw_sequence():
    fig, ax = plt.subplots(figsize=(13, 8), dpi=300)
    ax.set_xlim(0, 13)
    ax.set_ylim(0, 8)
    ax.axis('off')

    ax.text(6.5, 7.6, 'SƠ ĐỒ TUẦN TỰ: CHU TRÌNH PHÒNG HỌC FOCUS KIOSK & KHÔI PHỤC TASKBAR (UML)', 
            fontsize=12.5, fontweight='bold', ha='center', color=NAVY, fontfamily='serif')

    # Lifelines
    lifelines = [
        ('Học Viên\n(User)', 1.5),
        ('Renderer UI\n(pomodoro.js)', 4.0),
        ('Electron Main\n(main.cjs)', 6.8),
        ('study_guard.exe\n(Win32 C++)', 9.5),
        ('Server Backend\n(Cloudflare D1)', 11.8)
    ]

    for name, x in lifelines:
        box = patches.Rectangle((x - 0.9, 6.7), 1.8, 0.6, facecolor=NAVY, edgecolor=NAVY)
        ax.add_patch(box)
        ax.text(x, 7.0, name, fontsize=8, fontweight='bold', ha='center', va='center', color=WHITE, fontfamily='serif')
        ax.plot([x, x], [6.7, 0.4], color='#94A3B8', lw=1, linestyle='--')

    # Sequence Messages
    steps = [
        (1.5, 4.0, 6.3, '1. Bấm "Bắt đầu học tập (Zen Mode)"', False),
        (4.0, 11.8, 5.8, '2. POST /api/pomodoro/start (Khởi tạo ca)', False),
        (11.8, 4.0, 5.4, '3. HTTP 200 OK (Ghi nhận ca active)', True),
        (4.0, 6.8, 4.9, '4. IPC: window:set-kiosk (true)', False),
        (6.8, 9.5, 4.4, '5. Thực thi study_guard.exe hide', False),
        (9.5, 6.8, 4.0, '6. Win32: ShowWindow(hTaskbar, SW_HIDE)', True),
        (6.8, 6.8, 3.6, '7. createSecondaryBlockers() (Khóa màn hình 2)', False),
        (1.5, 4.0, 3.0, '8. Tập trung học tập, đọc PDF, nghe nhạc local...', False),
        (1.5, 4.0, 2.3, '9. Hết ca học 50 phút / Bấm Ctrl + Q', False),
        (4.0, 6.8, 1.8, '10. IPC: window:set-kiosk (false)', False),
        (6.8, 9.5, 1.4, '11. Thực thi study_guard.exe restore (<3ms)', False),
        (9.5, 6.8, 1.0, '12. Win32: ShowWindow(hTaskbar, SW_SHOW)', True),
        (4.0, 11.8, 0.6, '13. POST /api/pomodoro/complete (Cộng +100 XP, +60 Gems)', False)
    ]

    for x1, x2, y, msg, is_return in steps:
        ls = '--' if is_return else '-'
        col = '#0284C7' if is_return else NAVY
        if x1 == x2: # self call
            ax.plot([x1, x1 + 0.6, x1 + 0.6, x1], [y, y, y - 0.25, y - 0.25], color='#D97706', lw=1.2)
            ax.text(x1 + 0.7, y - 0.12, msg, fontsize=7.5, color='#92400E', fontfamily='serif')
        else:
            ax.annotate('', xy=(x2, y), xytext=(x1, y),
                        arrowprops=dict(arrowstyle="->", color=col, lw=1.2, linestyle=ls))
            mid_x = (x1 + x2) / 2
            ax.text(mid_x, y + 0.08, msg, fontsize=7.5, ha='center', color=col, fontfamily='serif', fontweight='semibold')

    plt.tight_layout()
    out_path = os.path.join(fig_dir, 'fig_sequence_kiosk.png')
    plt.savefig(out_path, dpi=300, bbox_inches='tight')
    plt.close()
    print("✅ Created fig_sequence_kiosk.png")

if __name__ == '__main__':
    draw_use_case()
    draw_erd()
    draw_architecture()
    draw_sequence()
    print("🎉 All 4 diagrams successfully generated in high resolution!")
