/**
 * ========================================================
 * THỎ BẢY MÀU - 20 STATES ANIMATED MASCOT ENGINE (FIXED PRO)
 * Full-body seamless vector rigging based on Thỏ bảy màu8.jpg
 * ViewBox: 0 0 260 260
 * ========================================================
 */

export const THO_STATES = {
  // Nhóm A: 9 Animation dựng từ 9 ảnh mẫu
  IDLE: "idle",
  THINKING: "thinking",
  CALM_WRONG: "calm-wrong",
  VIETNAM_CELEBRATE: "vietnam-celebrate",
  CLOUD_FLOAT: "cloud-float",
  SWORD_MASTER: "sword-master",
  MAID_SERVICE: "maid-service",
  SHOCKED_WALKING: "shocked-walking",
  CONFUSED_PHONE: "confused-phone",

  // Nhóm B: 11 Animation mở rộng cho hệ sinh thái học tập Lumi
  AI_PROFESSOR: "ai-professor",
  STREAK_FIRE: "streak-fire",
  GEM_RICH: "gem-rich",
  KING_CHAMPION: "king-champion",
  DETECTIVE_FIX: "detective-fix",
  HEART_BROKEN: "heart-broken",
  XP_BOOST: "xp-boost",
  SLEEPY_AFK: "sleepy-afk",
  CHEERING_POM: "cheering-pom",
  TYPING_FAST: "typing-fast",
  ANGRY_REMIND: "angry-remind"
};

// Aliases for backward compatibility
export const STATE_ALIASES = {
  correct: THO_STATES.VIETNAM_CELEBRATE,
  wrong: THO_STATES.CALM_WRONG,
  floating: THO_STATES.CLOUD_FLOAT
};

export const THO_METADATA = {
  [THO_STATES.IDLE]: {
    name: "Nghỉ ngơi (Idle)",
    category: "Ảnh mẫu",
    ref: "download.jpg",
    quote: "Hôm nay bạn muốn học môn gì nào? Cùng chiến nhé! 🌸"
  },
  [THO_STATES.THINKING]: {
    name: "Suy nghĩ (Thinking)",
    category: "Ảnh mẫu",
    ref: "Thỏ bảy màu.jpg",
    quote: "Hừm... Đố bạn biết câu này đáp án nào là đúng đấy! 🤔"
  },
  [THO_STATES.CALM_WRONG]: {
    name: "Tịnh tâm an ủi (Calm)",
    category: "Ảnh mẫu",
    ref: "Thỏ bảy màu (1).jpg",
    quote: "Thôi bình tĩnh, hít một hơi thật sâu rồi làm lại nhé! 🧘❤️"
  },
  [THO_STATES.VIETNAM_CELEBRATE]: {
    name: "Ăn mừng (Việt Nam)",
    category: "Ảnh mẫu",
    ref: "AoV.jpg",
    quote: "ĐỈNH QUÁ BẠN ƠI! Nón lá khăn rằn lên sàn! 🎉✨"
  },
  [THO_STATES.CLOUD_FLOAT]: {
    name: "Lướt mây (Level-up)",
    category: "Ảnh mẫu",
    ref: "Top 65 Ảnh Avatar...",
    quote: "Thăng cấp rồi! Cùng cưỡi mây về đích nào! ☁️✨"
  },
  [THO_STATES.SWORD_MASTER]: {
    name: "Kiếm sĩ (Yasuo)",
    category: "Ảnh mẫu",
    ref: "download (2)9.jpg",
    quote: "Cửa ải Boss này cứ để thanh kiếm của Thỏ lo! ⚔️🌪️"
  },
  [THO_STATES.MAID_SERVICE]: {
    name: "Hầu gái chu đáo (Maid)",
    category: "Ảnh mẫu",
    ref: "download (1)9.jpg",
    quote: "Kính chào chủ nhân! Hôm nay người muốn học bài nào ạ? 🎀🧹"
  },
  [THO_STATES.SHOCKED_WALKING]: {
    name: "Lạch bạch bất ngờ (Shocked)",
    category: "Ảnh mẫu",
    ref: "Thỏ bảy màu8.jpg",
    quote: "Ối dồi ôi! Đi thi mà đề khó dữ vậy trời?! 😱👣"
  },
  [THO_STATES.CONFUSED_PHONE]: {
    name: "Xem điện thoại (Confused)",
    category: "Ảnh mẫu",
    ref: "download99.jpg",
    quote: "Ủa alo? Thông báo bài học mới ting ting kìa! 📱❓"
  },
  [THO_STATES.AI_PROFESSOR]: {
    name: "Giáo sư AI (Professor)",
    category: "Mở rộng",
    ref: "3TG AI Chat",
    quote: "Để giáo sư Thỏ giảng giải công thức từng bước cho bạn nghe! 🎓📖"
  },
  [THO_STATES.STREAK_FIRE]: {
    name: "Bùng cháy Streak (Fire)",
    category: "Mở rộng",
    ref: "Chuỗi ngày học",
    quote: "LỬA HỪNG HỰC! Giữ vững chuỗi ngày học rực lửa nào! 🔥🥊"
  },
  [THO_STATES.GEM_RICH]: {
    name: "Đại gia Đá quý (Rich)",
    category: "Mở rộng",
    ref: "Cửa hàng vật phẩm",
    quote: "Đá quý đầy rương! Ghé Shop sắm đồ thôi bạn ơi! 💎✨"
  },
  [THO_STATES.KING_CHAMPION]: {
    name: "Vua Vô Địch (King)",
    category: "Mở rộng",
    ref: "Bảng xếp hạng",
    quote: "Nhà vô địch 3TG đã xuất hiện! Nhận cúp vinh quang! 👑🏆"
  },
  [THO_STATES.DETECTIVE_FIX]: {
    name: "Thám tử bắt lỗi (Detective)",
    category: "Mở rộng",
    ref: "Ôn câu sai",
    quote: "Soi kính lúp tìm ngay câu sai để sửa triệt để! 🕵️🔍"
  },
  [THO_STATES.HEART_BROKEN]: {
    name: "Mất tim mếu máo (Broken)",
    category: "Mở rộng",
    ref: "Trừ tim/mạng",
    quote: "Đừng lo lắng, bạn có Vô hạn tim (∞)! Bình tĩnh thử lại câu sau nhé! 💪❤️"
  },
  [THO_STATES.XP_BOOST]: {
    name: "Bay cùng sao XP (Boost)",
    category: "Mở rộng",
    ref: "Nhận điểm XP",
    quote: "XP nhân đôi, bay vút lên đỉnh vinh quang! ⭐⚡"
  },
  [THO_STATES.SLEEPY_AFK]: {
    name: "Ngủ gật treo máy (AFK)",
    category: "Mở rộng",
    ref: "AFK 30s Detector",
    quote: "Khò khò... Bạn đi đâu lâu thế, Thỏ ngủ gật rồi nè... 💤😴"
  },
  [THO_STATES.CHEERING_POM]: {
    name: "Cổ vũ Pom-Pom (Cheer)",
    category: "Mở rộng",
    ref: "Combo câu đúng",
    quote: "COMBO XUẤT SẮC! Cố lên, bạn làm được mà! 📣🎀"
  },
  [THO_STATES.TYPING_FAST]: {
    name: "Gõ phím thần tốc (Typing)",
    category: "Mở rộng",
    ref: "3TG AI Đang sinh câu trả lời",
    quote: "Chờ xíu, Thỏ đang gõ đáp án với tốc độ bàn thờ! 💻💨"
  },
  [THO_STATES.ANGRY_REMIND]: {
    name: "Nhắc nhở giận dỗi (Angry)",
    category: "Mở rộng",
    ref: "Cảnh báo mất Streak",
    quote: "Sắp hết ngày rồi mà chưa học bài hả?! Vào học ngay! 😤💢"
  }
};

/**
 * Helper chuẩn 3 lớp Wrapper cho cánh tay mũm mĩm:
 * - Lớp 1: Cố định vị trí khớp vai (x, y) - tuyệt đối không gắn class CSS
 * - Lớp 2: Cố định góc xoay cơ bản (angle) - tuyệt đối không gắn class CSS
 * - Lớp 3: Chứa hình vẽ cánh tay (và đạo cụ cầm theo nếu có) + gắn class animation an toàn
 */
function renderChubbyArm(x, y, angle, length = 36, className = "", attachedPropSvg = "") {
  return `
    <g transform="translate(${x}, ${y})">
      <g transform="rotate(${angle})">
        <g ${className ? `class="${className}"` : ""} style="transform-box: fill-box; transform-origin: 50% 8px;">
          <rect x="-9" y="0" width="18" height="${length}" rx="9" fill="#FFFFFF" stroke="#18181b" stroke-width="3.8" stroke-linejoin="round" />
          ${attachedPropSvg}
        </g>
      </g>
    </g>
  `;
}

/**
 * Generate full SVG Vector markup for Thỏ Bảy Màu with ViewBox 0 0 260 260
 * Seamless plump mochi body matching Thỏ bảy màu8.jpg (no neck line cut)
 */
export function generateThoBayMauSvg({ state = "idle", size = 220, className = "" } = {}) {
  let normalizedState = STATE_ALIASES[state] || state;
  if (!THO_METADATA[normalizedState]) normalizedState = THO_STATES.IDLE;

  const isIdle = normalizedState === THO_STATES.IDLE;
  const isThinking = normalizedState === THO_STATES.THINKING;
  const isCalm = normalizedState === THO_STATES.CALM_WRONG;
  const isVietnam = normalizedState === THO_STATES.VIETNAM_CELEBRATE;
  const isCloud = normalizedState === THO_STATES.CLOUD_FLOAT;
  const isSword = normalizedState === THO_STATES.SWORD_MASTER;
  const isMaid = normalizedState === THO_STATES.MAID_SERVICE;
  const isShocked = normalizedState === THO_STATES.SHOCKED_WALKING;
  const isPhone = normalizedState === THO_STATES.CONFUSED_PHONE;

  const isProfessor = normalizedState === THO_STATES.AI_PROFESSOR;
  const isFire = normalizedState === THO_STATES.STREAK_FIRE;
  const isGem = normalizedState === THO_STATES.GEM_RICH;
  const isKing = normalizedState === THO_STATES.KING_CHAMPION;
  const isDetective = normalizedState === THO_STATES.DETECTIVE_FIX;
  const isHeartBroken = normalizedState === THO_STATES.HEART_BROKEN;
  const isXpBoost = normalizedState === THO_STATES.XP_BOOST;
  const isSleepy = normalizedState === THO_STATES.SLEEPY_AFK;
  const isPom = normalizedState === THO_STATES.CHEERING_POM;
  const isTyping = normalizedState === THO_STATES.TYPING_FAST;
  const isAngry = normalizedState === THO_STATES.ANGRY_REMIND;

  // 1. SEAMLESS PLUMP MOCHI BODY SILHOUETTE (Đầu tròn phúng phính liền thân mũm mĩm)
  let bodyPath = "";
  let bodyShadowPath = "";

  if (isCloud) {
    // Tư thế ngồi gọn trên mây (chiều cao vừa vặn trong viewBox)
    bodyPath = `
      M 130 50
      C 178 50 200 78 200 112
      C 200 138 184 152 174 160
      C 178 178 178 196 172 210
      C 168 220 154 222 144 218
      C 136 215 124 215 116 218
      C 106 222 92 220 88 210
      C 82 196 82 178 86 160
      C 76 152 60 138 60 112
      C 60 78 82 50 130 50 Z
    `;
    bodyShadowPath = `M 92 204 Q 130 216 168 204 Q 150 218 130 216 Q 110 218 92 204 Z`;
  } else {
    // Tư thế đứng toàn thân mũm mĩm chuẩn Thỏ bảy màu8.jpg
    // Đầu tròn to bè ngang (60 -> 200), thân bầu tròn mập mạp, 2 chân ngắn tũn (khấc chia chân chỉ cao 9px)
    bodyPath = `
      M 130 48
      C 178 48 200 76 200 112
      C 200 138 184 154 174 162
      C 178 182 176 208 172 228
      C 170 238 160 240 148 240
      C 138 240 134 236 132 231
      L 130 230
      L 128 231
      C 126 236 122 240 112 240
      C 100 240 90 238 88 228
      C 84 208 82 182 86 162
      C 76 154 60 138 60 112
      C 60 76 82 48 130 48 Z
    `;
    bodyShadowPath = `M 92 222 Q 130 232 168 222 Q 154 235 130 230 Q 106 235 92 222 Z`;
  }

  // 2. EARS (Hai tai bản to, tròn mềm mại, buông sát hai bên má)
  const earLeftPath = `M 74 106 C 50 116 42 146 46 184 C 48 210 64 222 76 216 C 86 210 88 186 86 160 C 84 136 80 118 74 106 Z`;
  const earRightPath = `M 186 106 C 210 116 218 146 214 184 C 212 210 196 222 184 216 C 174 210 172 186 174 160 C 176 136 180 118 186 106 Z`;

  // 3. FACIAL FEATURES (Đảm bảo 100% cả 20 trạng thái đều có đủ Mắt, Lông mày, Miệng, Má hồng)
  let eyesSvg = "";
  let eyebrowsSvg = "";
  let mouthSvg = "";
  let blushSvg = `
    <g id="blush">
      <ellipse cx="84" cy="126" rx="10.5" ry="6.5" class="tho-fill-blush" />
      <ellipse cx="176" cy="126" rx="10.5" ry="6.5" class="tho-fill-blush" />
    </g>
  `;

  if (isVietnam) {
    // 4. Ăn mừng Việt Nam: Mắt long lanh + Miệng cười lớn khoe lưỡi hồng
    eyesSvg = `
      <g class="tho-eyes-group">
        <ellipse cx="106" cy="112" rx="7" ry="10.5" class="tho-fill-black" />
        <circle cx="104" cy="107" r="3" fill="#ffffff" />
        <circle cx="108" cy="114" r="1.5" fill="#ffffff" />
        <ellipse cx="154" cy="112" rx="7" ry="10.5" class="tho-fill-black" />
        <circle cx="152" cy="107" r="3" fill="#ffffff" />
        <circle cx="156" cy="114" r="1.5" fill="#ffffff" />
      </g>
    `;
    eyebrowsSvg = `
      <path d="M 98 94 Q 106 87 114 94" class="tho-stroke-med" fill="none" />
      <path d="M 146 94 Q 154 87 162 94" class="tho-stroke-med" fill="none" />
    `;
    mouthSvg = `
      <path d="M 121 134 Q 130 152 139 134 Z" fill="#e11d48" class="tho-stroke-med" />
      <path d="M 125 141 Q 130 137 135 141 Q 130 149 125 141 Z" fill="#f472b6" />
    `;
  } else if (isCalm) {
    // 3. Tịnh tâm an ủi: Mắt nhắm cong nhẹ + ấn đường nhíu nhẹ + miệng mỉm bình tĩnh
    eyesSvg = `
      <g class="tho-eyes-group">
        <path d="M 97 116 Q 107 125 117 116" class="tho-stroke-main" fill="none" />
        <path d="M 143 116 Q 153 125 163 116" class="tho-stroke-main" fill="none" />
      </g>
    `;
    eyebrowsSvg = `
      <path d="M 126 99 L 128 106" class="tho-stroke-med" fill="none" />
      <path d="M 134 99 L 132 106" class="tho-stroke-med" fill="none" />
    `;
    mouthSvg = `<path d="M 125 137 Q 130 140 135 137" class="tho-stroke-med" fill="none" />`;
  } else if (isShocked) {
    // 8. Lạch bạch bất ngờ: Mắt tròn xoe + miệng há chữ O (Thỏ bảy màu8.jpg)
    eyesSvg = `
      <g class="tho-eyes-group">
        <ellipse cx="106" cy="112" rx="6" ry="9.5" class="tho-fill-black" />
        <circle cx="104" cy="108" r="2" fill="#ffffff" />
        <ellipse cx="154" cy="112" rx="6" ry="9.5" class="tho-fill-black" />
        <circle cx="152" cy="108" r="2" fill="#ffffff" />
      </g>
    `;
    eyebrowsSvg = `
      <path d="M 98 95 Q 106 90 113 96" class="tho-stroke-med" fill="none" />
      <path d="M 147 96 Q 154 90 162 95" class="tho-stroke-med" fill="none" />
    `;
    mouthSvg = `
      <ellipse cx="130" cy="138" rx="6.5" ry="5.5" fill="#991b1b" class="tho-stroke-med" />
      <path d="M 126 140 Q 130 137 134 140" fill="#f472b6" />
    `;
  } else if (isThinking || isPhone || isDetective) {
    // 2. Suy nghĩ, 9. Xem điện thoại, 14. Thám tử: Mắt đen rõ + 1 bên mày nhướng đăm chiêu + miệng ngang
    eyesSvg = `
      <g class="tho-eyes-group ${isThinking ? "tho-anim-glance" : "tho-anim-blink"}">
        <ellipse cx="106" cy="112" rx="5.5" ry="9" class="tho-fill-black" />
        <circle cx="104" cy="108" r="2" fill="#ffffff" />
        <ellipse cx="154" cy="112" rx="5.5" ry="9" class="tho-fill-black" />
        <circle cx="152" cy="108" r="2" fill="#ffffff" />
      </g>
    `;
    eyebrowsSvg = isDetective
      ? `
        <path d="M 98 98 L 114 102" class="tho-stroke-med" fill="none" />
        <path d="M 146 95 Q 154 90 162 95" class="tho-stroke-med" fill="none" />
      `
      : `
        <path d="M 98 95 Q 106 91 113 96" class="tho-stroke-med" fill="none" />
        <path d="M 147 98 Q 154 95 162 97" class="tho-stroke-med" fill="none" />
      `;
    mouthSvg = `<path d="M 125 136 L 135 136" class="tho-stroke-main" fill="none" />`;
  } else if (isSword) {
    // 6. Kiếm sĩ Yasuo: Mắt sắc lạnh tập trung + mày kiếm sĩ
    eyesSvg = `
      <g class="tho-eyes-group tho-anim-blink">
        <ellipse cx="106" cy="114" rx="5.5" ry="9" class="tho-fill-black" />
        <circle cx="104" cy="110" r="2" fill="#ffffff" />
        <ellipse cx="154" cy="114" rx="5.5" ry="9" class="tho-fill-black" />
        <circle cx="152" cy="110" r="2" fill="#ffffff" />
      </g>
    `;
    eyebrowsSvg = `
      <path d="M 98 98 L 114 103" class="tho-stroke-main" fill="none" />
      <path d="M 162 98 L 146 103" class="tho-stroke-main" fill="none" />
    `;
    mouthSvg = `<path d="M 125 138 L 135 138" class="tho-stroke-med" fill="none" />`;
  } else if (isMaid) {
    // 7. Hầu gái: Mắt long lanh dịu dàng + miệng cười mỉm lễ phép
    eyesSvg = `
      <g class="tho-eyes-group tho-anim-blink">
        <ellipse cx="106" cy="114" rx="5.8" ry="9.2" class="tho-fill-black" />
        <circle cx="104" cy="110" r="2.2" fill="#ffffff" />
        <ellipse cx="154" cy="114" rx="5.8" ry="9.2" class="tho-fill-black" />
        <circle cx="152" cy="110" r="2.2" fill="#ffffff" />
      </g>
    `;
    eyebrowsSvg = `
      <path d="M 100 100 Q 106 96 113 100" class="tho-stroke-med" fill="none" />
      <path d="M 147 100 Q 154 96 160 100" class="tho-stroke-med" fill="none" />
    `;
    mouthSvg = `<path d="M 125 136 Q 130 141 135 136" class="tho-stroke-med" fill="none" />`;
  } else if (isGem) {
    // 12. Đại gia Đá quý: Mắt kim cương xanh lấp lánh + miệng cười sảng khoái
    eyesSvg = `
      <g class="tho-eyes-group">
        <g transform="translate(106, 112)">
          <polygon points="0,-10 9,0 0,10 -9,0" fill="#38bdf8" stroke="#0284c7" stroke-width="2.2" class="tho-anim-pulse" style="transform-box: fill-box; transform-origin: center;" />
        </g>
        <g transform="translate(154, 112)">
          <polygon points="0,-10 9,0 0,10 -9,0" fill="#38bdf8" stroke="#0284c7" stroke-width="2.2" class="tho-anim-pulse" style="transform-box: fill-box; transform-origin: center;" />
        </g>
      </g>
    `;
    eyebrowsSvg = `
      <path d="M 98 94 Q 106 88 114 94" class="tho-stroke-med" fill="none" />
      <path d="M 146 94 Q 154 88 162 94" class="tho-stroke-med" fill="none" />
    `;
    mouthSvg = `<path d="M 122 134 Q 130 150 138 134 Z" fill="#e11d48" class="tho-stroke-med" />`;
  } else if (isHeartBroken) {
    // 15. Mất tim mếu máo: Mắt rưng rưng + nước mắt chảy + miệng mếu
    eyesSvg = `
      <g class="tho-eyes-group">
        <ellipse cx="106" cy="114" rx="7" ry="10" class="tho-fill-black" />
        <circle cx="104" cy="109" r="3" fill="#ffffff" />
        <circle cx="108" cy="116" r="1.5" fill="#ffffff" />
        <ellipse cx="154" cy="114" rx="7" ry="10" class="tho-fill-black" />
        <circle cx="152" cy="109" r="3" fill="#ffffff" />
        <circle cx="156" cy="116" r="1.5" fill="#ffffff" />
        <path d="M 106 125 C 102 133 108 140 106 147" stroke="#38bdf8" stroke-width="3.2" stroke-linecap="round" fill="none" />
        <path d="M 154 125 C 150 133 156 140 154 147" stroke="#38bdf8" stroke-width="3.2" stroke-linecap="round" fill="none" />
      </g>
    `;
    eyebrowsSvg = `
      <path d="M 98 103 L 112 96" class="tho-stroke-med" fill="none" />
      <path d="M 162 103 L 148 96" class="tho-stroke-med" fill="none" />
    `;
    mouthSvg = `<path d="M 123 140 Q 130 133 137 140" class="tho-stroke-med" fill="none" />`;
  } else if (isSleepy) {
    // 17. Ngủ gật treo máy: Mắt nhắm ngủ + miệng thở khò khò
    eyesSvg = `
      <g class="tho-eyes-group">
        <path d="M 98 115 L 114 115" class="tho-stroke-main" fill="none" />
        <path d="M 146 115 L 162 115" class="tho-stroke-main" fill="none" />
      </g>
    `;
    eyebrowsSvg = `
      <path d="M 100 102 Q 106 99 112 102" class="tho-stroke-fine" fill="none" />
      <path d="M 148 102 Q 154 99 160 102" class="tho-stroke-fine" fill="none" />
    `;
    mouthSvg = `<ellipse cx="130" cy="137" rx="4.5" ry="3.5" fill="#18181b" />`;
  } else if (isAngry) {
    // 20. Nhắc nhở giận dỗi: Mắt nhìn thẳng + mày xếch giận dữ + miệng gắt
    eyesSvg = `
      <g class="tho-eyes-group">
        <ellipse cx="106" cy="114" rx="5.8" ry="9" class="tho-fill-black" />
        <circle cx="104" cy="110" r="2" fill="#ffffff" />
        <ellipse cx="154" cy="114" rx="5.8" ry="9" class="tho-fill-black" />
        <circle cx="152" cy="110" r="2" fill="#ffffff" />
      </g>
    `;
    eyebrowsSvg = `
      <path d="M 95 96 L 115 105" class="tho-stroke-main" fill="none" />
      <path d="M 165 96 L 145 105" class="tho-stroke-main" fill="none" />
    `;
    mouthSvg = `<path d="M 122 140 Q 130 133 138 140" class="tho-stroke-main" fill="none" />`;
    blushSvg = `
      <g id="blush">
        <ellipse cx="84" cy="126" rx="12" ry="7.5" fill="#fb7185" opacity="0.85" />
        <ellipse cx="176" cy="126" rx="12" ry="7.5" fill="#fb7185" opacity="0.85" />
      </g>
    `;
  } else if (isPom) {
    // 18. Cổ vũ Pom-Pom: Mắt cười tít (^ ^) + miệng cười tươi hết cỡ
    eyesSvg = `
      <g class="tho-eyes-group">
        <path d="M 97 115 Q 106 103 115 115" class="tho-stroke-main" fill="none" />
        <path d="M 145 115 Q 154 103 163 115" class="tho-stroke-main" fill="none" />
      </g>
    `;
    eyebrowsSvg = `
      <path d="M 98 95 Q 106 89 114 95" class="tho-stroke-med" fill="none" />
      <path d="M 146 95 Q 154 89 162 95" class="tho-stroke-med" fill="none" />
    `;
    mouthSvg = `
      <path d="M 122 134 Q 130 149 138 134 Z" fill="#e11d48" class="tho-stroke-med" />
      <path d="M 125 140 Q 130 137 135 140 Q 130 147 125 140 Z" fill="#f472b6" />
    `;
  } else if (isFire || isKing || isXpBoost) {
    // 11. Bùng cháy Streak, 13. Vua Vô Địch, 16. Sao XP: Mắt sáng rực + mày quyết tâm + miệng cười tự hào
    eyesSvg = `
      <g class="tho-eyes-group tho-anim-blink">
        <ellipse cx="106" cy="112" rx="6.2" ry="9.5" class="tho-fill-black" />
        <circle cx="104" cy="108" r="2.5" fill="#ffffff" />
        <ellipse cx="154" cy="112" rx="6.2" ry="9.5" class="tho-fill-black" />
        <circle cx="152" cy="108" r="2.5" fill="#ffffff" />
      </g>
    `;
    eyebrowsSvg = `
      <path d="M 97 96 L 114 101" class="tho-stroke-main" fill="none" />
      <path d="M 163 96 L 146 101" class="tho-stroke-main" fill="none" />
    `;
    mouthSvg = `
      <path d="M 123 135 Q 130 146 137 135 Z" fill="#e11d48" class="tho-stroke-med" />
    `;
  } else {
    // NHÁNH MẶC ĐỊNH (Dành cho: 1. Idle, 5. Cloud-float, 10. AI-Professor, 19. Typing-fast và mọi trạng thái khác)
    // Đảm bảo luôn có 2 mắt đen to tròn, lông mày tự tin và miệng cười dễ thương chuẩn download.jpg!
    eyesSvg = `
      <g class="tho-eyes-group tho-anim-blink">
        <ellipse cx="106" cy="112" rx="5.8" ry="9.5" class="tho-fill-black" />
        <circle cx="104" cy="108" r="2.2" fill="#ffffff" />
        <ellipse cx="154" cy="112" rx="5.8" ry="9.5" class="tho-fill-black" />
        <circle cx="152" cy="108" r="2.2" fill="#ffffff" />
      </g>
    `;
    eyebrowsSvg = isIdle
      ? `
        <path d="M 98 94 L 112 99" class="tho-stroke-med" fill="none" />
        <path d="M 162 94 L 148 99" class="tho-stroke-med" fill="none" />
      `
      : `
        <path d="M 98 95 Q 106 90 114 95" class="tho-stroke-med" fill="none" />
        <path d="M 146 95 Q 154 90 162 95" class="tho-stroke-med" fill="none" />
      `;
    mouthSvg = isTyping
      ? `<ellipse cx="130" cy="137" rx="4.5" ry="3" fill="#e11d48" class="tho-stroke-fine" />`
      : `<path d="M 124 135 Q 130 142 136 135" class="tho-stroke-main" fill="none" />`;
  }

  // 4. ARMS & ACCESSORIES RIGGING FOR EACH STATE
  let accessoriesBack = "";
  let accessoriesFront = "";
  let armsSvg = "";

  // A. NÓN LÁ & KHĂN RẰN (4. VIETNAM_CELEBRATE)
  if (isVietnam) {
    accessoriesFront += `
      <!-- Nón Lá Việt Nam -->
      <g id="acc-non-la" transform="translate(130, 50)">
        <path d="M 0 -36 L 68 12 L -68 12 Z" fill="#fef08a" class="tho-stroke-main" />
        <path d="M -50 4 Q 0 15 50 4" fill="none" stroke="#ca8a04" stroke-width="2.5" />
        <path d="M -32 -10 Q 0 -2 32 -10" fill="none" stroke="#ca8a04" stroke-width="2.5" />
        <path d="M 0 -36 L -36 10 M 0 -36 L 0 12 M 0 -36 L 36 10" stroke="#ca8a04" stroke-width="2" />
      </g>
      <!-- Khăn Rằn Nam Bộ -->
      <g id="acc-khan-ran" transform="translate(130, 158)">
        <path d="M -46 0 C -20 12 20 12 46 0 C 50 12 42 24 24 28 C 0 32 -32 30 -46 16 Z" fill="#ffffff" class="tho-stroke-main" />
        <path d="M -36 4 L -38 18 M -22 6 L -24 24 M -8 7 L -8 26 M 8 7 L 6 26 M 22 6 L 20 24 M 36 4 L 36 18" stroke="#18181b" stroke-width="2.8" />
        <path d="M 12 22 L 20 56 L 36 54 L 28 22 Z" fill="#ffffff" class="tho-stroke-med" />
        <path d="M 14 34 L 31 32 M 16 45 L 33 43" stroke="#18181b" stroke-width="2.8" />
      </g>
      <!-- Pháo giấy lấp lánh (Wrapper Pattern) -->
      <g transform="translate(38, 48)">
        <g class="tho-anim-pulse" style="transform-box: fill-box; transform-origin: center;">
          <polygon points="0,-11 3,-3 11,0 3,3 0,11 -3,3 -11,0 -3,-3" fill="#fbbf24" stroke="#18181b" stroke-width="1.8" />
        </g>
      </g>
      <g transform="translate(222, 52)">
        <g class="tho-anim-pulse" style="transform-box: fill-box; transform-origin: center;">
          <polygon points="0,-10 2.5,-2.5 10,0 2.5,2.5 0,10 -2.5,2.5 -10,0 -2.5,-2.5" fill="#f43f5e" stroke="#18181b" stroke-width="1.8" />
        </g>
      </g>
    `;
    armsSvg = `
      ${renderChubbyArm(78, 160, 130, 38, "tho-anim-wave-l")}
      ${renderChubbyArm(182, 160, -130, 38, "tho-anim-wave-r")}
    `;
  }

  // B. KIẾM SĨ YASUO (6. SWORD_MASTER)
  else if (isSword) {
    accessoriesBack += `
      <!-- Búi tóc Samurai gắn chặt trên đỉnh đầu -->
      <g transform="translate(130, 52)">
        <g class="tho-anim-bob" style="transform-box: fill-box; transform-origin: bottom center;">
          <path d="M -44 -2 C -58 -26 -40 -52 -22 -44 C -16 -66 12 -76 26 -50 C 42 -54 54 -30 42 -2 C 34 12 -32 12 -44 -2 Z" 
                fill="#334155" class="tho-stroke-main" />
          <ellipse cx="2" cy="-2" rx="26" ry="11" fill="#1e293b" class="tho-stroke-med" />
        </g>
      </g>
    `;
    accessoriesFront += `
      <!-- Khăn choàng che cổ kiếm sĩ -->
      <g id="acc-ninja-scarf">
        <path d="M 78 146 L 182 146 L 190 172 L 130 192 L 70 172 Z" fill="#334155" class="tho-stroke-main" />
        <path d="M 96 158 Q 130 170 164 158" fill="none" stroke="#1e293b" stroke-width="3" />
      </g>
      <!-- Thanh kiếm Katana -->
      <g transform="translate(142, 178)">
        <g class="tho-anim-slash" style="transform-box: fill-box; transform-origin: center;">
          <path d="M -70 46 L 0 0" stroke="#94a3b8" stroke-width="7.5" stroke-linecap="round" />
          <path d="M -70 46 L 0 0" stroke="#f8fafc" stroke-width="3" stroke-linecap="round" />
          <ellipse cx="0" cy="0" rx="8" ry="4" transform="rotate(-35)" fill="#ca8a04" stroke="#18181b" stroke-width="2" />
          <path d="M 0 0 L 20 -13" stroke="#18181b" stroke-width="7" stroke-linecap="round" />
        </g>
      </g>
    `;
    armsSvg = `
      ${renderChubbyArm(80, 168, 40, 38)}
      ${renderChubbyArm(180, 168, -50, 40)}
    `;
  }

  // C. HẦU GÁI CHU ĐÁO (7. MAID_SERVICE)
  else if (isMaid) {
    accessoriesFront += `
      <!-- Bờm ren hầu gái -->
      <g id="acc-maid-headband">
        <path d="M 70 80 C 70 42 190 42 190 80" fill="none" stroke="#1e293b" stroke-width="6.5" stroke-linecap="round" />
        <path d="M 64 78 Q 68 62 80 60 Q 92 58 100 50 Q 116 42 130 42 Q 144 42 160 50 Q 168 58 180 60 Q 192 62 196 78" 
              fill="#ffffff" stroke="#18181b" stroke-width="3" />
      </g>
      <!-- Váy & Tạp dề hầu gái -->
      <g class="tho-maid-apron">
        <path d="M 88 166 L 172 166 L 174 224 L 86 224 Z" fill="#1e293b" class="tho-stroke-main" />
        <path d="M 98 176 L 162 176 L 160 218 C 150 226 110 226 100 218 Z" fill="#ffffff" class="tho-stroke-med" />
        <path d="M 102 158 L 108 176 M 158 158 L 152 176" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" />
      </g>
    `;
    armsSvg = `
      ${renderChubbyArm(78, 168, -32, 36)}
      ${renderChubbyArm(182, 168, 32, 36)}
    `;
  }

  // D. LƯỚT MÂY LEVEL-UP (5. CLOUD_FLOAT) - Đã sửa gọn dây túi đeo chéo & đám mây
  else if (isCloud) {
    accessoriesBack += `
      <!-- Đám mây bồng bềnh dưới chân -->
      <g transform="translate(0, -6)">
        <g class="tho-anim-float" style="transform-box: fill-box; transform-origin: center;">
          <path d="M 52 218 C 34 212 32 192 50 186 C 54 170 78 162 96 172 C 110 160 142 160 156 172 C 174 162 200 172 202 188 C 220 194 220 214 202 222 C 210 238 190 252 168 246 C 152 256 124 256 112 246 C 96 256 70 252 60 240 C 42 238 36 226 52 218 Z" 
                fill="#ffffff" class="tho-stroke-main" />
          <path d="M 82 220 C 74 214 82 204 90 210" fill="none" class="tho-stroke-fine" />
          <path d="M 176 220 C 184 214 176 204 168 210" fill="none" class="tho-stroke-fine" />
        </g>
      </g>
      <!-- Ngôi sao lấp lánh quanh mây -->
      <g transform="translate(36, 130)">
        <polygon points="0,-8 2,-2 8,0 2,2 0,8 -2,2 -8,0 -2,-2" fill="#fbbf24" stroke="#18181b" stroke-width="1.5" class="tho-anim-pulse" style="transform-box: fill-box; transform-origin: center;" />
      </g>
      <g transform="translate(224, 145)">
        <polygon points="0,-8 2,-2 8,0 2,2 0,8 -2,2 -8,0 -2,-2" fill="#38bdf8" stroke="#18181b" stroke-width="1.5" class="tho-anim-pulse" style="transform-box: fill-box; transform-origin: center;" />
      </g>
    `;
    accessoriesFront += `
      <!-- Dây túi đeo chéo ôm gọn qua vai và chiếc túi nhỏ bên sườn trái -->
      <path d="M 164 156 Q 130 182 94 198" stroke="#78350f" stroke-width="4.5" stroke-linecap="round" fill="none" />
      <rect x="84" y="188" width="20" height="16" rx="6" transform="rotate(-12 94 196)" fill="#d97706" stroke="#18181b" stroke-width="2.8" />
      <path d="M 86 194 Q 94 198 102 192" stroke="#18181b" stroke-width="2" fill="none" />
    `;
    armsSvg = `
      ${renderChubbyArm(78, 164, -22, 34)}
      ${renderChubbyArm(182, 164, 22, 34)}
    `;
  }

  // E. XEM ĐIỆN THOẠI (9. CONFUSED_PHONE)
  else if (isPhone) {
    accessoriesFront += `
      <!-- Điện thoại màu cam trước ngực -->
      <g id="acc-phone" transform="translate(115, 168)">
        <rect x="0" y="0" width="30" height="44" rx="6" fill="#fb923c" class="tho-stroke-main" />
        <rect x="4" y="4" width="22" height="34" rx="3" fill="#fed7aa" />
        <circle cx="15" cy="20" r="3" fill="#ea580c" />
      </g>
      <!-- Bong bóng dấu '?' cạnh thái dương -->
      <g transform="translate(182, 62)">
        <g class="tho-anim-bob" style="transform-box: fill-box; transform-origin: center;">
          <circle cx="0" cy="0" r="15" fill="#ffffff" class="tho-stroke-main" />
          <path d="M -4 13 L -8 20 L 2 15 Z" fill="#ffffff" class="tho-stroke-fine" />
          <text x="0" y="6" text-anchor="middle" font-size="19" font-weight="900" fill="#18181b" font-family="sans-serif">?</text>
        </g>
      </g>
    `;
    armsSvg = `
      ${renderChubbyArm(80, 168, -42, 36)}
      ${renderChubbyArm(180, 168, 42, 36)}
    `;
  }

  // F. SUY NGHĨ CHỐNG CẰM (2. THINKING)
  else if (isThinking) {
    accessoriesFront += `
      <!-- Bong bóng đèn sáng kiến -->
      <g transform="translate(182, 62)">
        <g class="tho-anim-bob" style="transform-box: fill-box; transform-origin: center;">
          <circle cx="0" cy="0" r="15" fill="#ffffff" class="tho-stroke-main" />
          <circle cx="-13" cy="15" r="4" fill="#ffffff" class="tho-stroke-fine" />
          <text x="0" y="6" text-anchor="middle" font-size="16" font-weight="900" fill="#18181b">💡</text>
        </g>
      </g>
    `;
    armsSvg = `
      <!-- Tay trái khoanh ngang bụng, tay phải đưa lên chống cằm -->
      ${renderChubbyArm(80, 170, -65, 38)}
      ${renderChubbyArm(178, 166, 138, 38, "tho-anim-wave-r")}
    `;
  }

  // G. TỊNH TÂM AN ỦI (3. CALM_WRONG) - Đã sửa lỗi tay bay ra góc trái
  else if (isCalm) {
    armsSvg = `
      ${renderChubbyArm(78, 168, 16, 36)}
      ${renderChubbyArm(180, 168, 58, 40, "tho-anim-breathe-arm")}
    `;
  }

  // H. GIÁO SƯ AI (10. AI_PROFESSOR)
  else if (isProfessor) {
    accessoriesFront += `
      <!-- Kính cận tròn Giáo sư -->
      <g class="tho-glasses">
        <circle cx="106" cy="112" r="14" fill="rgba(255,255,255,0.25)" stroke="#18181b" stroke-width="3.2" />
        <circle cx="154" cy="112" r="14" fill="rgba(255,255,255,0.25)" stroke="#18181b" stroke-width="3.2" />
        <path d="M 120 112 L 140 112" stroke="#18181b" stroke-width="3.2" />
      </g>
      <!-- Nơ đỏ lịch lãm -->
      <polygon points="120,154 130,160 120,166" fill="#dc2626" class="tho-stroke-fine" />
      <polygon points="140,154 130,160 140,166" fill="#dc2626" class="tho-stroke-fine" />
      <circle cx="130" cy="160" r="3.5" fill="#991b1b" />
      <!-- Sách học màu xanh -->
      <g transform="translate(88, 176)">
        <rect x="0" y="0" width="26" height="32" rx="3" fill="#3b82f6" class="tho-stroke-med" />
        <path d="M 6 8 L 20 8 M 6 15 L 20 15 M 6 22 L 15 22" stroke="#ffffff" stroke-width="2" />
      </g>
      <!-- Que chỉ bảng -->
      <g transform="translate(184, 152)">
        <path d="M 0 0 L 34 -36" stroke="#854d0e" stroke-width="4.5" stroke-linecap="round" />
        <circle cx="34" cy="-36" r="4" fill="#eab308" />
      </g>
    `;
    armsSvg = `
      ${renderChubbyArm(78, 168, -28, 36)}
      ${renderChubbyArm(182, 166, -110, 38, "tho-anim-wave-r")}
    `;
  }

  // I. BÙNG CHÁY STREAK (11. STREAK_FIRE)
  else if (isFire) {
    accessoriesBack += `
      <!-- Hào quang lửa sau lưng -->
      <g transform="translate(130, 145)">
        <g class="tho-anim-pulse" style="transform-box: fill-box; transform-origin: bottom center;">
          <path d="M -72 25 C -92 -25 -62 -88 -22 -105 C -38 -68 0 -88 10 -125 C 28 -88 58 -105 48 -68 C 78 -78 88 -25 72 25 Z" 
                fill="url(#fireGradient)" opacity="0.9" />
        </g>
      </g>
    `;
    accessoriesFront += `
      <!-- Băng đô đỏ quyết tâm -->
      <path d="M 70 82 Q 130 92 190 82" stroke="#dc2626" stroke-width="8" stroke-linecap="round" fill="none" />
      <circle cx="130" cy="87" r="6" fill="#fbbf24" stroke="#18181b" stroke-width="2" />
      <path d="M 70 82 Q 52 88 42 106" stroke="#dc2626" stroke-width="5.5" stroke-linecap="round" fill="none" />
      <path d="M 70 82 Q 56 96 48 118" stroke="#dc2626" stroke-width="5.5" stroke-linecap="round" fill="none" />
    `;
    const fistFlame = `<circle cx="0" cy="36" r="9" fill="#fbbf24" stroke="#ea580c" stroke-width="2.5" />`;
    armsSvg = `
      ${renderChubbyArm(76, 166, 35, 36, "tho-anim-wave-l", fistFlame)}
      ${renderChubbyArm(184, 166, -35, 36, "tho-anim-wave-r", fistFlame)}
    `;
  }

  // J. ĐẠI GIA ĐÁ QUÝ (12. GEM_RICH)
  else if (isGem) {
    accessoriesFront += `
      <!-- Rương kho báu kim cương -->
      <g id="acc-gem-chest" transform="translate(100, 178)">
        <rect x="0" y="10" width="60" height="32" rx="6" fill="#854d0e" class="tho-stroke-main" />
        <path d="M -4 10 Q 30 -4 64 10 Z" fill="#ca8a04" class="tho-stroke-main" />
        <polygon points="12,10 18,1 24,10 18,16" fill="#38bdf8" />
        <polygon points="26,8 34,-2 42,8 34,15" fill="#f43f5e" />
        <polygon points="40,11 46,2 52,11 46,17" fill="#22c55e" />
      </g>
    `;
    armsSvg = `
      ${renderChubbyArm(78, 168, -38, 36)}
      ${renderChubbyArm(182, 168, 38, 36)}
    `;
  }

  // K. VUA VÔ ĐỊCH (13. KING_CHAMPION)
  else if (isKing) {
    accessoriesBack += `
      <!-- Áo choàng đỏ Hoàng gia -->
      <g class="tho-cape">
        <path d="M 78 152 Q 58 205 52 240 L 208 240 Q 202 205 182 152 Z" fill="#b91c1c" class="tho-stroke-main" />
        <rect x="50" y="232" width="160" height="11" rx="4" fill="#f8fafc" stroke="#18181b" stroke-width="2.2" />
      </g>
    `;
    accessoriesFront += `
      <!-- Vương miện Vàng -->
      <g id="acc-crown" transform="translate(130, 50)">
        <polygon points="-32,4 -38,-22 -18,-8 0,-28 18,-8 38,-22 32,4" fill="#fbbf24" class="tho-stroke-main" />
        <circle cx="0" cy="-14" r="3.5" fill="#ef4444" />
        <circle cx="-22" cy="-6" r="3" fill="#3b82f6" />
        <circle cx="22" cy="-6" r="3" fill="#10b981" />
      </g>
      <!-- Cúp vô địch trên tay phải -->
      <g transform="translate(200, 102)">
        <g class="tho-anim-bob" style="transform-box: fill-box; transform-origin: bottom center;">
          <path d="M 0 0 L 24 0 L 20 20 Q 12 26 4 20 Z" fill="#fbbf24" class="tho-stroke-med" />
          <path d="M 0 5 C -7 5 -7 15 0 15 M 24 5 C 31 5 31 15 24 15" fill="none" stroke="#ca8a04" stroke-width="2.5" />
          <path d="M 12 23 L 12 32 M 4 32 L 20 32" stroke="#ca8a04" stroke-width="3" stroke-linecap="round" />
        </g>
      </g>
    `;
    armsSvg = `
      ${renderChubbyArm(78, 168, 16, 36)}
      ${renderChubbyArm(182, 164, -132, 40)}
    `;
  }

  // L. THÁM TỬ BẮT LỖI (14. DETECTIVE_FIX)
  else if (isDetective) {
    accessoriesFront += `
      <!-- Mũ Thám tử Sherlock -->
      <g id="acc-detective-hat" transform="translate(130, 52)">
        <path d="M -46 6 C -44 -26 44 -26 46 6 Z" fill="#a16207" class="tho-stroke-main" />
        <path d="M -56 6 Q 0 12 56 6" stroke="#78350f" stroke-width="4.5" stroke-linecap="round" />
      </g>
      <!-- Kính lúp soi ngang mắt phải -->
      <g transform="translate(154, 114)">
        <g class="tho-anim-pulse" style="transform-box: fill-box; transform-origin: center;">
          <circle cx="0" cy="0" r="18" fill="rgba(224, 242, 254, 0.45)" stroke="#18181b" stroke-width="4.2" />
          <path d="M 11 11 L 24 24" stroke="#854d0e" stroke-width="6" stroke-linecap="round" />
          <path d="M -8 -6 Q 0 -11 8 -6" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" fill="none" />
        </g>
      </g>
    `;
    armsSvg = `
      ${renderChubbyArm(78, 168, 16, 36)}
      ${renderChubbyArm(182, 166, 145, 42)}
    `;
  }

  // M. MẤT TIM MẾU MÁO (15. HEART_BROKEN)
  else if (isHeartBroken) {
    accessoriesFront += `
      <!-- Trái tim rạn nứt giữa ngực -->
      <g transform="translate(130, 182)">
        <g class="tho-anim-pulse" style="transform-box: fill-box; transform-origin: center;">
          <path d="M 0 15 C -22 -5 -32 -24 -15 -32 C -5 -36 0 -24 0 -18 C 0 -24 5 -36 15 -32 C 32 -24 22 -5 0 15 Z" 
                fill="#ef4444" class="tho-stroke-med" />
          <path d="M 0 -18 L -4 -9 L 4 -2 L -3 6 L 0 15" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
        </g>
      </g>
    `;
    armsSvg = `
      ${renderChubbyArm(78, 168, -52, 40)}
      ${renderChubbyArm(182, 168, 52, 40)}
    `;
  }

  // N. BAY CÙNG SAO XP (16. XP_BOOST)
  else if (isXpBoost) {
    accessoriesBack += `
      <!-- Ngôi sao vàng XP khổng lồ -->
      <g id="acc-xp-star" transform="translate(130, 206) scale(1.55)">
        <polygon points="0,-24 7,-7 24,-7 11,4 16,21 0,11 -16,21 -11,4 -24,-7 -7,-7" 
                 fill="#fbbf24" stroke="#18181b" stroke-width="2.5" />
      </g>
    `;
    accessoriesFront += `
      <!-- Kính râm cực ngầu -->
      <g id="acc-sunglasses">
        <polygon points="92,105 120,105 116,121 96,121" fill="#18181b" />
        <polygon points="140,105 168,105 164,121 144,121" fill="#18181b" />
        <path d="M 120 109 L 140 109" stroke="#18181b" stroke-width="3.5" />
        <path d="M 96 109 L 106 117 M 144 109 L 154 117" stroke="#ffffff" stroke-width="2" />
      </g>
      <!-- Tia chớp năng lượng -->
      <g transform="translate(36, 118)">
        <polygon points="6,0 0,12 8,12 2,24 16,8 8,8" fill="#eab308" class="tho-anim-pulse" style="transform-box: fill-box; transform-origin: center;" />
      </g>
      <g transform="translate(212, 118)">
        <polygon points="6,0 0,12 8,12 2,24 16,8 8,8" fill="#eab308" class="tho-anim-pulse" style="transform-box: fill-box; transform-origin: center;" />
      </g>
    `;
    armsSvg = `
      ${renderChubbyArm(78, 162, 120, 38, "tho-anim-wave-l")}
      ${renderChubbyArm(182, 162, -120, 38, "tho-anim-wave-r")}
    `;
  }

  // O. NGỦ GẬT TREO MÁY (17. SLEEPY_AFK)
  else if (isSleepy) {
    accessoriesFront += `
      <!-- Bong bóng ngủ gật -->
      <g transform="translate(142, 132)">
        <g class="tho-anim-pulse" style="transform-box: fill-box; transform-origin: center;">
          <circle cx="0" cy="0" r="10" fill="rgba(147, 197, 253, 0.7)" stroke="#3b82f6" stroke-width="2.2" />
          <circle cx="-3" cy="-3" r="2.5" fill="#ffffff" />
        </g>
      </g>
      <!-- Chữ Zzz bay lên -->
      <g transform="translate(162, 58)">
        <g class="tho-anim-float" style="transform-box: fill-box; transform-origin: center;">
          <text x="0" y="0" font-size="20" font-weight="900" fill="#6366f1" font-family="sans-serif">Z</text>
          <text x="13" y="-12" font-size="15" font-weight="900" fill="#818cf8" font-family="sans-serif">z</text>
          <text x="23" y="-22" font-size="12" font-weight="900" fill="#a5b4fc" font-family="sans-serif">z</text>
        </g>
      </g>
    `;
    armsSvg = `
      ${renderChubbyArm(78, 170, 20, 36)}
      ${renderChubbyArm(182, 170, -20, 36)}
    `;
  }

  // P. CỔ VŨ POM-POM (18. CHEERING_POM) - Gắn trực tiếp bông Pom-Pom vào đầu bàn tay để lắc đồng bộ!
  else if (isPom) {
    const pomBallSvg = `
      <g transform="translate(0, 38)">
        <circle cx="0" cy="0" r="16" fill="#f43f5e" stroke="#18181b" stroke-width="2.5" />
        <circle cx="-4" cy="-4" r="11" fill="#fbbf24" />
        <circle cx="4" cy="4" r="9" fill="#ec4899" />
      </g>
    `;
    armsSvg = `
      ${renderChubbyArm(78, 162, 125, 38, "tho-anim-wave-l", pomBallSvg)}
      ${renderChubbyArm(182, 162, -125, 38, "tho-anim-wave-r", pomBallSvg)}
    `;
  }

  // Q. GÕ PHÍM THẦN TỐC (19. TYPING_FAST)
  else if (isTyping) {
    accessoriesFront += `
      <!-- Laptop đặt phía trước -->
      <g id="acc-laptop" transform="translate(98, 182)">
        <rect x="0" y="14" width="64" height="24" rx="4" fill="#64748b" class="tho-stroke-med" />
        <polygon points="10,0 54,0 62,14 2,14" fill="#94a3b8" stroke="#18181b" stroke-width="2.2" />
        <rect x="14" y="3" width="36" height="9" rx="2" fill="#e0f2fe" />
      </g>
      <!-- Giọt mồ hôi văng ra -->
      <g transform="translate(188, 84)">
        <g class="tho-anim-bob" style="transform-box: fill-box; transform-origin: center;">
          <path d="M 0 0 C -5 8 5 12 4 6 Z" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5" />
        </g>
      </g>
    `;
    armsSvg = `
      ${renderChubbyArm(80, 168, -42, 36, "tho-anim-type-l")}
      ${renderChubbyArm(180, 168, 42, 36, "tho-anim-type-r")}
    `;
  }

  // R. NHẮC NHỞ GIẬN DỖI (20. ANGRY_REMIND)
  else if (isAngry) {
    accessoriesFront += `
      <!-- Khói bốc hai bên tai -->
      <g transform="translate(52, 92)">
        <g class="tho-anim-pulse" style="transform-box: fill-box; transform-origin: center;">
          <circle cx="0" cy="0" r="6.5" fill="#cbd5e1" />
          <circle cx="-7" cy="-8" r="4.5" fill="#e2e8f0" />
        </g>
      </g>
      <g transform="translate(208, 92)">
        <g class="tho-anim-pulse" style="transform-box: fill-box; transform-origin: center;">
          <circle cx="0" cy="0" r="6.5" fill="#cbd5e1" />
          <circle cx="7" cy="-8" r="4.5" fill="#e2e8f0" />
        </g>
      </g>
      <!-- Dấu gân máu tức giận trên trán -->
      <path d="M 162 78 L 174 78 M 168 72 L 168 84" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />
    `;
    armsSvg = `
      <!-- Hai tay chống nạnh mũm mĩm -->
      ${renderChubbyArm(78, 166, -32, 34)}
      ${renderChubbyArm(182, 166, 32, 34)}
    `;
  }

  // S. LẠCH BẠCH BẤT NGỜ (8. SHOCKED_WALKING) - Đã sửa lỗi tay bay ra góc trái
  else if (isShocked) {
    armsSvg = `
      ${renderChubbyArm(76, 166, 28, 36, "tho-anim-wave-l")}
      ${renderChubbyArm(184, 166, -28, 36, "tho-anim-wave-r")}
    `;
  }

  // T. NGHỈ NGƠI MẶC ĐỊNH (1. IDLE)
  else {
    armsSvg = `
      ${renderChubbyArm(76, 166, 14, 36, "tho-anim-breathe-arm")}
      ${renderChubbyArm(184, 166, -14, 36, "tho-anim-breathe-arm")}
    `;
  }

  // RETURN MASTER VECTOR SVG RIG (VIEWBOX: 0 0 260 260)
  return `
    <svg class="tho-mascot-svg tho-state-${normalizedState} ${className}" 
         viewBox="0 0 260 260" 
         width="${size}" 
         height="${size}" 
         xmlns="http://www.w3.org/2000/svg"
         role="img"
         aria-label="Linh vật Thỏ Bảy Màu - ${THO_METADATA[normalizedState]?.name || normalizedState}">
      
      <defs>
        <linearGradient id="fireGradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#ef4444" stop-opacity="0.1" />
          <stop offset="50%" stop-color="#f97316" stop-opacity="0.75" />
          <stop offset="100%" stop-color="#fbbf24" stop-opacity="0.95" />
        </linearGradient>

        <!-- Scoped Keyframe Animations đảm bảo không bao giờ làm bay tọa độ SVG -->
        <style>
          .tho-fill-white { fill: #ffffff; }
          .tho-fill-black { fill: #18181b; }
          .tho-fill-blush { fill: #fda4af; opacity: 0.85; }
          .tho-stroke-main { stroke: #18181b; stroke-width: 4px; stroke-linecap: round; stroke-linejoin: round; }
          .tho-stroke-med { stroke: #18181b; stroke-width: 3px; stroke-linecap: round; stroke-linejoin: round; }
          .tho-stroke-fine { stroke: #18181b; stroke-width: 2px; stroke-linecap: round; stroke-linejoin: round; }

          @keyframes thoBreathe {
            0%, 100% { transform: translateY(0px) scaleY(1); }
            50% { transform: translateY(-3px) scaleY(1.015); }
          }
          @keyframes thoBlink {
            0%, 92%, 100% { transform: scaleY(1); }
            96% { transform: scaleY(0.1); }
          }
          @keyframes thoGlance {
            0%, 100% { transform: translate(0px, 0px); }
            50% { transform: translate(3px, -3px); }
          }
          @keyframes thoWaveL {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(16deg); }
          }
          @keyframes thoWaveR {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(-16deg); }
          }
          @keyframes thoTypeL {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(-12deg); }
          }
          @keyframes thoTypeR {
            0%, 100% { transform: rotate(-12deg); }
            50% { transform: rotate(0deg); }
          }
          @keyframes thoFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-7px); }
          }
          @keyframes thoBob {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-5px) scale(1.05); }
          }
          @keyframes thoPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.12); }
          }
          @keyframes thoSlash {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(-8deg) translateX(-3px); }
          }

          .tho-rig-container {
            transform-box: fill-box;
            transform-origin: bottom center;
            animation: thoBreathe 2.8s ease-in-out infinite;
          }
          .tho-state-cloud-float .tho-rig-container,
          .tho-state-xp-boost .tho-rig-container {
            animation: thoFloat 2.4s ease-in-out infinite;
          }
          .tho-anim-blink {
            transform-box: fill-box;
            transform-origin: center;
            animation: thoBlink 3.6s infinite;
          }
          .tho-anim-glance {
            transform-box: fill-box;
            transform-origin: center;
            animation: thoGlance 2.2s ease-in-out infinite;
          }
          .tho-anim-wave-l {
            animation: thoWaveL 0.9s ease-in-out infinite;
          }
          .tho-anim-wave-r {
            animation: thoWaveR 0.9s ease-in-out infinite;
          }
          .tho-anim-breathe-arm {
            animation: thoWaveL 2.4s ease-in-out infinite;
          }
          .tho-anim-type-l {
            animation: thoTypeL 0.22s linear infinite;
          }
          .tho-anim-type-r {
            animation: thoTypeR 0.22s linear infinite;
          }
          .tho-anim-float {
            animation: thoFloat 2.4s ease-in-out infinite;
          }
          .tho-anim-bob {
            animation: thoBob 1.6s ease-in-out infinite;
          }
          .tho-anim-pulse {
            animation: thoPulse 1.4s ease-in-out infinite;
          }
          .tho-anim-slash {
            animation: thoSlash 1.2s ease-in-out infinite;
          }
        </style>
      </defs>

      <!-- 1. BACKGROUND ACCESSORIES (Clouds, capes, auras) -->
      ${accessoriesBack}

      <!-- 2. ENTIRE RIG CONTAINER -->
      <g id="tho-rig" class="tho-rig-container">

        <!-- LOP EARS (Hai tai thỏ ôm sát má) -->
        <g id="ear-left" class="tho-ear-l">
          <path d="${earLeftPath}" class="tho-stroke-main tho-fill-white" />
        </g>
        <g id="ear-right" class="tho-ear-r">
          <path d="${earRightPath}" class="tho-stroke-main tho-fill-white" />
        </g>

        <!-- SEAMLESS BODY CORE (Head + Plump Torso + 2 Stubby Legs) -->
        <g id="body-core" class="tho-body-core">
          
          <!-- Unified Silhouette -->
          <path d="${bodyPath}" class="tho-stroke-main tho-fill-white" />
          <!-- 2.5D Belly Soft Shadow -->
          <path d="${bodyShadowPath}" fill="#f1f5f9" />

          <!-- Blush -->
          ${blushSvg}

          <!-- Facial Features (Luôn hiển thị rõ ràng ở cả 20 trạng thái) -->
          <g id="eyebrows">${eyebrowsSvg}</g>
          <g id="eyes">${eyesSvg}</g>
          <g id="mouth">${mouthSvg}</g>

          <!-- Arms Layer (3-Layer Wrapper chống văng tay) -->
          <g id="arms">${armsSvg}</g>

          <!-- Front Accessories -->
          ${accessoriesFront}

        </g>
      </g>
    </svg>
  `;
}

/**
 * Render Mascot with Duolingo-style Speech Bubble
 */
export function renderThoBayMau({
  state = "idle",
  size = 220,
  speech = "",
  speechDirection = "top",
  className = "",
  id = ""
} = {}) {
  let normalizedState = STATE_ALIASES[state] || state;
  if (!THO_METADATA[normalizedState]) normalizedState = THO_STATES.IDLE;

  const quote = speech !== undefined && speech !== "" ? speech : (THO_METADATA[normalizedState]?.quote || "");
  const bubbleHtml = quote ? `
    <div class="tho-speech-bubble bubble-${speechDirection}">
      ${quote}
    </div>
  ` : "";

  return `
    <div class="tho-mascot-wrapper ${className}" ${id ? `id="${id}"` : ""} data-state="${normalizedState}">
      ${speechDirection === "top" ? bubbleHtml : ""}
      <div style="display:flex; align-items:center; justify-content:center; gap:14px;">
        ${speechDirection === "right" ? bubbleHtml : ""}
        <div class="tho-svg-container" style="width:${size}px; height:${size}px;">
          ${generateThoBayMauSvg({ state: normalizedState, size })}
        </div>
        ${speechDirection === "left" ? bubbleHtml : ""}
      </div>
    </div>
  `;
}

/**
 * Custom Web Component: <tho-bay-mau state="sword-master" size="220"></tho-bay-mau>
 */
if (typeof window !== "undefined" && !customElements.get("tho-bay-mau")) {
  class ThoBayMauElement extends HTMLElement {
    static get observedAttributes() {
      return ["state", "size", "speech", "speech-direction"];
    }

    connectedCallback() {
      this.render();
    }

    attributeChangedCallback() {
      this.render();
    }

    setState(newState, newSpeech) {
      if (newState) this.setAttribute("state", newState);
      if (newSpeech !== undefined) this.setAttribute("speech", newSpeech);
    }

    render() {
      const state = this.getAttribute("state") || "idle";
      const size = Number(this.getAttribute("size")) || 200;
      const speech = this.getAttribute("speech") || "";
      const direction = this.getAttribute("speech-direction") || "top";

      this.innerHTML = renderThoBayMau({
        state,
        size,
        speech,
        speechDirection: direction
      });
    }
  }

  customElements.define("tho-bay-mau", ThoBayMauElement);
  if (!customElements.get("lumi-mascot")) {
    customElements.define("lumi-mascot", class extends ThoBayMauElement {});
  }
}

if (typeof window !== "undefined") {
  window.THO_STATES = THO_STATES;
  window.THO_METADATA = THO_METADATA;
  window.STATE_ALIASES = STATE_ALIASES;
  window.renderThoBayMau = renderThoBayMau;
  window.generateThoBayMauSvg = generateThoBayMauSvg;
}