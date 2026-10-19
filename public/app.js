import { renderThoBayMau, generateThoBayMauSvg, THO_STATES, THO_METADATA } from "./tho-bay-mau.js";
window.renderThoBayMau = renderThoBayMau;
window.generateThoBayMauSvg = generateThoBayMauSvg;
window.THO_STATES = THO_STATES;
window.THO_METADATA = THO_METADATA;

const view = document.getElementById("app-view");
const toastStack = document.getElementById("toast-stack");
const modalRoot = document.getElementById("modal-root");

const subjectIcons = ["🧠", "✨", "📚", "💝", "💻", "⚖️", "∑", "✏️", "🧱", "🌷"];

const state = {
  subjects: [],
  currentSubjectId: null,
  currentStageIndex: 0,
  subjectDetail: null,
  overview: null,
  profile: null,
  account: null,
  stats: { total_xp: 0, current_streak: 0, longest_streak: 0, hearts: 5, gems: 50 },
  inventory: [],
  page: "home", // home | courses | notes | leaderboard | shop | achievements | review | chat | settings
  apiError: "",
  lesson: null,
  questionIndex: 0,
  selectedOption: "",
  checkedAnswer: null,
  checkingAnswer: false,
  submittingLesson: false,
  answers: [],
  finish: null,
  search: "",
  chatSubjectId: "",
  chatDraft: "",
  chatAttachments: [],
  chatPendingFiles: [],
  chatMessages: [],
  chatBusy: false,
  chatConversationId: null,
  chatConversations: [],
  notes: [],
  notesLoading: false,
  noteSubjectId: "",
  noteLessonId: "",
  noteSearch: "",
  noteSaveTimers: new Map(),
  activeNoteLesson: null,
  activeQuickLessonId: null,
  quickDrawerTab: "guide",
  isChatDropdownOpen: false,
  reviewMistakes: [],
  reviewCurrentIndex: 0,
  reviewPracticeActive: false,
  authTab: "register", // register | login
  fbProfileTab: "intro" // intro | badges | inventory
};

window.state = state;
window.switchAuthTab = function(tab) {
  playSound("click");
  state.authTab = tab;
  render();
};
window.stopReview = function() {
  state.reviewPracticeActive = false;
  render();
};
window.startReview = function() {
  state.reviewPracticeActive = true;
  state.reviewCurrentIndex = 0;
  render();
};
window.goToShop = function() {
  closeModal();
  state.page = "shop";
  render();
};

// ========================================================
// SOUND EFFECTS (WEB AUDIO API CHIMES)
// ========================================================
let audioCtx = null;
function playSound(type) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === "correct") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === "wrong") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(160, now + 0.25);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === "click") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === "fanfare") {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        o.type = "sine";
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.18, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.35);
        o.start(now + i * 0.1);
        o.stop(now + i * 0.1 + 0.35);
      });
    }
  } catch {
    // Ignore audio exceptions if browser blocks sound
  }
}

// ========================================================
// GLOBAL FLOATING COMPANION & 30S IDLE DETECTOR
// ========================================================
let companionTimeout = null;
let isUserAfk = false;
let idleTimer = null;
const IDLE_LIMIT_MS = 30000; // 30 seconds inactivity

function getPageDefaultState(page) {
  switch (page) {
    case "home": return THO_STATES.IDLE;
    case "courses": return THO_STATES.CLOUD_FLOAT;
    case "chat": return THO_STATES.AI_PROFESSOR;
    case "leaderboard": return THO_STATES.KING_CHAMPION;
    case "shop": return THO_STATES.GEM_RICH;
    case "achievements": return THO_STATES.SWORD_MASTER;
    case "review": return THO_STATES.DETECTIVE_FIX;
    case "settings": return THO_STATES.MAID_SERVICE;
    default: return THO_STATES.IDLE;
  }
}

export function updateGlobalCompanion(overrideState = null, overrideSpeech = null) {
  let container = document.getElementById("global-mascot-companion");
  if (!container) {
    container = document.createElement("div");
    container.id = "global-mascot-companion";
    container.className = "tho-companion-floating-wrap";
    document.body.appendChild(container);
  }

  // Inline mascots belong to their page; use the floating one where a page has none.
  const inlineMascot = document.querySelector("#app-view .page-inline-mascot");
  if (state.lesson || inlineMascot || (state.page === "chat" && !state.chatMessages.length)) {
    container.style.display = "none";
    container.classList.add("hidden-in-quiz");
    return;
  } else {
    container.style.display = "";
    container.classList.remove("hidden-in-quiz");
  }

  const curState = overrideState || (isUserAfk ? THO_STATES.SLEEPY_AFK : getPageDefaultState(state.page));
  const pageSpeech = {
    home: "Cố lên bạn ơi! Chinh phục từng bài học để tích XP lên cấp nhé! 🌸✨",
    notes: "Ghi chú lại bí kíp ngay kẻo quên! Chữ đẹp điểm cao nha! 📝💖",
    chat: "Để Giáo sư Thỏ giảng công thức từng bước cho bạn nghe! 🎓📘",
    settings: "Kính chào chủ nhân! Hôm nay người muốn học bài nào ạ? 🎀",
    review: "Ngã ở đâu mình gấp đôi XP ở đó! Quét sạch câu sai thôi nào! 🎯💪",
    shop: "Đá quý rủng rỉnh quá! Sắm đồ đẹp hoặc đua Top giải đấu thôi! 💎🏆",
    leaderboard: "Đá quý rủng rỉnh quá! Sắm đồ đẹp hoặc đua Top giải đấu thôi! 💎🏆"
  }[state.page];
  const curSpeech = overrideSpeech !== null 
    ? overrideSpeech 
    : (isUserAfk ? "Khò... khò... Ngủ gật mất tiêu rồi! Zzz... 💤" : (pageSpeech || THO_METADATA[curState]?.quote || ""));

  container.innerHTML = `
    <div class="tho-companion-inner" onclick="handleCompanionClick(event)" title="Bấm vào Thỏ Bảy Màu để đổi 20 Animation & nghe câu thoại hài hước!">
      ${curSpeech ? `<div class="tho-companion-bubble">${esc(curSpeech)}</div>` : ''}
      <div style="width:115px; height:115px; filter:drop-shadow(0 8px 20px rgba(225, 29, 72, 0.22));">
        ${generateThoBayMauSvg({ state: curState, size: 115 })}
      </div>
    </div>
  `;
}
window.updateGlobalCompanion = updateGlobalCompanion;

window.handleCompanionClick = function(e) {
  e.stopPropagation();
  playSound("fanfare");
  const allStates = Object.values(THO_STATES);
  const randomState = allStates[Math.floor(Math.random() * allStates.length)];
  const quote = THO_METADATA[randomState]?.quote || "Học vui vẻ cùng 3TG nhé! 🌸";
  updateGlobalCompanion(randomState, quote);

  if (companionTimeout) clearTimeout(companionTimeout);
  companionTimeout = setTimeout(() => {
    updateGlobalCompanion();
  }, 4500);
};

function resetIdleTimer() {
  if (isUserAfk) {
    isUserAfk = false;
    updateGlobalCompanion();
  }
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    isUserAfk = true;
    updateGlobalCompanion(THO_STATES.SLEEPY_AFK, "Khò... khò... Treo máy lâu quá ngủ gật luôn rồi! Zzz... 💤");
  }, IDLE_LIMIT_MS);
}

["mousemove", "keydown", "touchstart", "scroll", "click"].forEach(evt => {
  window.addEventListener(evt, resetIdleTimer, { passive: true });
});
resetIdleTimer();

// ========================================================
// TOPBAR POPOVER INTERACTIVE MASCOTS
// ========================================================
function setupTopbarPopovers() {
  let activePopover = null;

  function showPopover(anchorEl, stateName, title, desc) {
    closePopover();
    const pop = document.createElement("div");
    pop.className = "top-stat-popover";
    pop.innerHTML = `
      <div class="top-stat-popover-text">
        <strong>${title}</strong>
        <small>${desc}</small>
      </div>
    `;
    anchorEl.appendChild(pop);
    activePopover = pop;
    playSound("click");
  }

  function closePopover() {
    if (activePopover) {
      activePopover.remove();
      activePopover = null;
    }
  }

  const streakEl = document.querySelector(".top-streak");
  const gemsEl = document.querySelector(".top-gems");
  const heartsEl = document.querySelector(".top-hearts");
  const xpEl = document.querySelector(".top-xp");

  if (streakEl) {
    streakEl.addEventListener("click", (e) => {
      e.stopPropagation();
      closePopover();
      openStreakModal();
    });
  }

  if (gemsEl) {
    gemsEl.addEventListener("click", (e) => {
      e.stopPropagation();
      const g = Number(state.stats.gems) || 0;
      if (activePopover && activePopover.parentElement === gemsEl) {
        closePopover();
      } else {
        showPopover(gemsEl, THO_STATES.GEM_RICH, `${g} Đá Quý Tích Lũy 💎`, "Đá quý dùng để mua Đóng băng chuỗi và các vật phẩm đặc biệt trong Cửa hàng!");
      }
    });
  }

  if (heartsEl) {
    heartsEl.addEventListener("click", (e) => {
      e.stopPropagation();
      if (activePopover && activePopover.parentElement === heartsEl) {
        closePopover();
      } else {
        showPopover(heartsEl, THO_STATES.MAID_SERVICE, `Vô Hạn Trái Tim (∞) ❤️`, "Bạn đang có Trái tim vĩnh viễn không giới hạn! Thoải mái làm bài học mà không bao giờ bị trừ tim.");
      }
    });
  }

  if (xpEl) {
    xpEl.addEventListener("click", (e) => {
      e.stopPropagation();
      const x = Number(state.stats.total_xp) || 0;
      if (activePopover && activePopover.parentElement === xpEl) {
        closePopover();
      } else {
        showPopover(xpEl, THO_STATES.XP_BOOST, `${x} Điểm Kinh Nghiệm (XP) ⭐`, "Mỗi bài học hoàn thành sẽ cộng dồn XP giúp bạn leo top Bảng xếp hạng!");
      }
    });
  }

  document.addEventListener("click", () => {
    closePopover();
  });
}
window.setupTopbarPopovers = setupTopbarPopovers;

// ========================================================
// API CLIENT
// ========================================================
async function api(path, options) {
  const config = Object.assign({ method: "GET", credentials: "same-origin" }, options || {});
  config.headers = Object.assign({}, config.headers || {});
  if (config.body && !(config.body instanceof FormData) && typeof config.body !== "string") {
    config.headers["content-type"] = "application/json";
    config.body = JSON.stringify(config.body);
  }
  const response = await fetch(path, config);
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) {
    const error = new Error(data.error || "Lumi chưa tải được dữ liệu.");
    error.status = response.status;
    throw error;
  }
  return data;
}

function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char];
  });
}

function showToast(message, isError) {
  const toast = document.createElement("div");
  toast.className = "toast" + (isError ? " error" : "");
  toast.textContent = message;
  toastStack.appendChild(toast);
  window.setTimeout(function () { toast.remove(); }, 3600);
}

// ========================================================
function animateNumber(element, targetVal) {
  if (!element) return;
  const currentVal = Number(element.textContent.replace(/[^0-9]/g, "")) || 0;
  if (currentVal === targetVal) {
    element.textContent = targetVal;
    return;
  }
  const diff = targetVal - currentVal;
  const duration = 400;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(currentVal + diff * ease);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.textContent = targetVal;
    }
  }
  requestAnimationFrame(step);
}

// TOPBAR & SHELL UPDATE
// ========================================================
function updateShell() {
  const streak = Number(state.stats.current_streak) || 0;
  const gems = Number(state.stats.gems) || 0;
  const hearts = state.stats.hearts == null ? 5 : Number(state.stats.hearts);
  const xp = Number(state.stats.total_xp) || 0;

  const headerStreak = document.getElementById("header-streak");
  const headerGems = document.getElementById("header-gems");
  const headerHearts = document.getElementById("header-hearts");
  const headerXp = document.getElementById("header-xp");
  const sideStreak = document.getElementById("side-streak");

  if (headerStreak) animateNumber(headerStreak, streak);
  if (headerGems) animateNumber(headerGems, gems);
  if (headerHearts) headerHearts.innerHTML = '<span class="infinite-hearts-badge" title="Vô hạn tim vĩnh viễn (∞)">∞</span>';
  if (headerXp) animateNumber(headerXp, xp);
  if (sideStreak) animateNumber(sideStreak, streak);

  // Active Navigation item
  document.querySelectorAll(".nav-item[data-page]").forEach(button => {
    button.classList.toggle("active", button.dataset.page === state.page);
  });

  // Course Count
  const courseCount = document.getElementById("course-count");
  if (courseCount) courseCount.textContent = state.subjects.length;

  // Review Count
  const reviewCount = document.getElementById("nav-review-count");
  if (reviewCount) reviewCount.textContent = state.reviewMistakes.length;

  // Top Subject Quick Selector
  const currentSub = state.subjects.find(s => Number(s.id) === Number(state.currentSubjectId)) || state.subjects[0];
  const topSubIcon = document.getElementById("top-subject-icon");
  const topSubName = document.getElementById("top-subject-name");
  if (currentSub) {
    if (topSubIcon) topSubIcon.textContent = subjectIcon(currentSub);
    if (topSubName) topSubName.textContent = currentSub.subject_name;
  }

  // Profile display in sidebar & topbar
  const sideName = document.getElementById("side-name");
  const sideAvatar = document.getElementById("side-avatar");
  const topAvatar = document.getElementById("top-avatar");
  const loginBtn = document.getElementById("header-login-btn");
  const avatarBtn = document.getElementById("header-avatar-btn");
  const accountType = document.getElementById("side-account-type");

  if (!state.profile) {
    if (sideName) sideName.textContent = "Chưa đăng nhập";
    if (accountType) accountType.textContent = "Bấm để đăng nhập / tạo tài khoản";
    if (loginBtn) loginBtn.style.display = "block";
    if (avatarBtn) avatarBtn.style.display = "none";
    if (sideAvatar) sideAvatar.textContent = "✿";
    if (topAvatar) topAvatar.textContent = "✿";
  } else {
    const name = state.profile.full_name || state.profile.username || "Học viên Lumi";
    if (sideName) sideName.textContent = name;
    if (accountType) accountType.textContent = "Học viên Lumi";
    if (loginBtn) loginBtn.style.display = "none";
    if (avatarBtn) avatarBtn.style.display = "flex";

    let avatarHtml = "";
    if (state.profile.avatar_url) {
      if (state.profile.avatar_url.startsWith("mascot:")) {
        avatarHtml = state.profile.avatar_url.slice(7);
      } else {
        avatarHtml = `<img src="${esc(state.profile.avatar_url)}" alt="">`;
      }
    } else {
      avatarHtml = Array.from(name.trim())[0] || "L";
    }
    if (sideAvatar) sideAvatar.innerHTML = avatarHtml;
    if (topAvatar) topAvatar.innerHTML = avatarHtml;
  }

  // Side week tracker
  const weekNode = document.getElementById("side-week");
  if (weekNode && state.overview) {
    weekNode.innerHTML = renderWeek(state.overview.week, state.overview.today);
  }
}

function subjectIcon(subject) {
  const id = Number(subject && subject.id) || 1;
  return subjectIcons[(id - 1) % subjectIcons.length];
}

function renderWeek(rows, today) {
  const history = new Map((rows || []).map(r => [String(r.activity_date).slice(0, 10), r.status]));
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const days = [];
  const refDate = today || new Date().toISOString().slice(0, 10);
  const [tY, tM, tD] = refDate.split("-").map(Number);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.UTC(tY, tM - 1, tD - i));
    const key = d.toISOString().slice(0, 10);
    const weekday = dayNames[d.getUTCDay()];
    const status = history.get(key) || "";
    const isToday = key === refDate;
    const done = status === "completed" || status === "freeze_used";
    days.push(
      `<span class="week-day ${done ? 'done' : ''} ${isToday ? 'today' : ''}" title="${key}${done ? ' (Đã học)' : ''}">
        <span>${esc(weekday)}</span>
        <b class="week-dot">${done ? '✓' : isToday ? '•' : '·'}</b>
      </span>`
    );
  }
  return days.join("");
}

// ========================================================
// AUTH ENTRY SCREEN (BẮT BUỘC ĐĂNG NHẬP / TẠO TÀI KHOẢN)
// ========================================================
function renderAuthScreen() {
  const isRegister = state.authTab === "register";

  return `
    <div class="auth-entry-screen">
      <div style="display:flex; justify-content:center; margin-bottom:12px;">
        ${renderThoBayMau({ state: THO_STATES.IDLE, size: 130, speech: "Chào mừng bạn đến với Lumi! Đăng ký ngay để nhận 50 Đá quý tân thủ nhé! 🌸", speechDirection: "top" })}
      </div>
      <h1 class="auth-entry-title">Lumi — Học Vui Mỗi Ngày</h1>
      <p class="auth-entry-subtitle">
        Trải nghiệm học tập phong cách Duolingo với hơn 29.000 câu hỏi từ Cloudflare D1. Vui lòng đăng nhập hoặc tạo tài khoản để bắt đầu!
      </p>

      <div class="auth-switch-tabs">
        <button type="button" class="auth-switch-tab ${isRegister ? 'active' : ''}" data-auth-tab="register" onclick="switchAuthTab('register')">
          Tạo tài khoản mới
        </button>
        <button type="button" class="auth-switch-tab ${!isRegister ? 'active' : ''}" data-auth-tab="login" onclick="switchAuthTab('login')">
          Đăng nhập
        </button>
      </div>

      ${isRegister ? `
        <div class="auth-bonus-pill">
          <span>🎁</span> Tặng ngay 50 Đá quý 💎 và 1 Đóng băng chuỗi ❄️ khi tạo tài khoản!
        </div>
        <form onsubmit="handleRegisterSubmit(event)" style="display:flex; flex-direction:column; gap:16px;">
          <div class="form-group">
            <label class="form-label">Họ và tên</label>
            <input type="text" id="reg-fullname" class="form-input" placeholder="Ví dụ: Lê Văn An" required />
          </div>
          <div class="form-group">
            <label class="form-label">Tên đăng nhập</label>
            <input type="text" id="reg-username" class="form-input" placeholder="Chữ thường, số, ví dụ: levanan01" required />
          </div>
          <div class="form-group">
            <label class="form-label">Mật khẩu</label>
            <div class="password-input-wrap">
              <input type="password" id="reg-password" class="form-input" placeholder="Từ 6 ký tự trở lên" required />
              <button type="button" class="password-toggle-btn" onclick="togglePasswordVisibility('reg-password', this)" title="Hiện mật khẩu" aria-label="Hiện mật khẩu">
                👁️
              </button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Nhập lại mật khẩu</label>
            <div class="password-input-wrap">
              <input type="password" id="reg-password-confirm" class="form-input" placeholder="Nhập lại chính xác mật khẩu" required />
              <button type="button" class="password-toggle-btn" onclick="togglePasswordVisibility('reg-password-confirm', this)" title="Hiện mật khẩu" aria-label="Hiện mật khẩu">
                👁️
              </button>
            </div>
          </div>
          <button type="submit" class="btn-duo btn-duo-pink" style="margin-top:8px; padding:15px;">
            Tạo tài khoản & Bắt đầu học ➔
          </button>
        </form>
      ` : `
        <form onsubmit="handleLoginSubmit(event)" style="display:flex; flex-direction:column; gap:16px;">
          <div class="form-group">
            <label class="form-label">Tên đăng nhập</label>
            <input type="text" id="login-username" class="form-input" placeholder="Nhập tên đăng nhập" required />
          </div>
          <div class="form-group">
            <label class="form-label">Mật khẩu</label>
            <div class="password-input-wrap">
              <input type="password" id="login-password" class="form-input" placeholder="Nhập mật khẩu" required />
              <button type="button" class="password-toggle-btn" onclick="togglePasswordVisibility('login-password', this)" title="Hiện mật khẩu" aria-label="Hiện mật khẩu">
                👁️
              </button>
            </div>
          </div>
          <button type="submit" class="btn-duo btn-duo-pink" style="margin-top:8px; padding:15px;">
            Đăng nhập vào Lumi ➔
          </button>
        </form>
        <div class="auth-quick-hint">
          Tài khoản mẫu: <span class="auth-quick-fill-btn" onclick="quickFillDemoLogin()">Điền nhanh (duo_learner / password123)</span>
        </div>
      `}
    </div>
  `;
}

window.togglePasswordVisibility = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  playSound("click");
  if (input.type === "password") {
    input.type = "text";
    if (btn) {
      btn.textContent = "🙈";
      btn.setAttribute("title", "Ẩn mật khẩu");
      btn.setAttribute("aria-label", "Ẩn mật khẩu");
    }
  } else {
    input.type = "password";
    if (btn) {
      btn.textContent = "👁️";
      btn.setAttribute("title", "Hiện mật khẩu");
      btn.setAttribute("aria-label", "Hiện mật khẩu");
    }
  }
};

window.quickFillDemoLogin = function() {
  const uInput = document.getElementById("login-username");
  const pInput = document.getElementById("login-password");
  if (uInput && pInput) {
    uInput.value = "duo_learner";
    pInput.value = "password123";
  }
};

window.handleRegisterSubmit = async function(e) {
  e.preventDefault();
  const fullName = document.getElementById("reg-fullname").value.trim();
  const username = document.getElementById("reg-username").value.trim();
  const password = document.getElementById("reg-password").value;
  const passwordConfirm = document.getElementById("reg-password-confirm") ? document.getElementById("reg-password-confirm").value : "";

  if (!fullName) {
    showToast("Vui lòng nhập họ và tên của bạn.", true);
    return;
  }
  if (!username || username.length < 3) {
    showToast("Tên đăng nhập cần từ 3 ký tự trở lên.", true);
    return;
  }
  if (!password || password.length < 6) {
    showToast("Mật khẩu cần từ 6 ký tự trở lên.", true);
    return;
  }
  if (password !== passwordConfirm) {
    playSound("wrong");
    showToast("Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.", true);
    document.getElementById("reg-password-confirm")?.focus();
    return;
  }

  try {
    playSound("click");
    const res = await api("/api/auth/register", {
      method: "POST",
      body: { username, password, fullName }
    });
    playSound("fanfare");
    showToast(res.message);
    state.profile = res.user;
    state.stats = res.stats;
    await loadAuthenticatedData();
  } catch (err) {
    playSound("wrong");
    showToast(err.message, true);
  }
};

window.handleLoginSubmit = async function(e) {
  e.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  if (!username || !password) {
    showToast("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.", true);
    return;
  }

  try {
    playSound("click");
    const res = await api("/api/auth/login", {
      method: "POST",
      body: { username, password }
    });
    playSound("fanfare");
    showToast(res.message);
    state.profile = res.user;
    state.stats = res.stats;
    await loadAuthenticatedData();
  } catch (err) {
    playSound("wrong");
    showToast(err.message, true);
  }
};

async function loadAuthenticatedData() {
  try {
    const [subRes, overviewRes, reviewRes] = await Promise.all([
      api("/api/subjects"),
      api("/api/overview").catch(() => null),
      api("/api/review").catch(() => ({ mistakes: [] }))
    ]);
    state.subjects = subRes.subjects || [];
    if (state.subjects.length && !state.currentSubjectId) {
      state.currentSubjectId = state.subjects[0].id;
    }
    state.overview = overviewRes;
    state.reviewMistakes = reviewRes.mistakes || [];
    if (overviewRes && overviewRes.stats) {
      state.stats = overviewRes.stats;
    }
    if (state.currentSubjectId) {
      state.subjectDetail = await api(`/api/subjects/${state.currentSubjectId}`);
    }
    state.page = "home";
    updateShell();
    render();
  } catch (err) {
    showToast(err.message, true);
  }
}

// ========================================================
// "CỨ 1 CHƯƠNG LÀ 1 CỬA ẢI" (HOME LEARNING PATH)
// ========================================================
async function loadSubjectPath(subjectId) {
  state.currentSubjectId = Number(subjectId);
  state.currentStageIndex = 0;
  try {
    state.subjectDetail = await api(`/api/subjects/${state.currentSubjectId}`);
    updateShell();
    render();
  } catch (err) {
    showToast(err.message, true);
  }
}

window.scrollStagePills = function(offset) {
  const wrap = document.getElementById("stage-pills-wrap");
  if (wrap) {
    wrap.scrollBy({ left: offset, behavior: "smooth" });
  }
};

window.setupStagePillsScroll = function() {
  const wrap = document.getElementById("stage-pills-wrap");
  if (!wrap) return;

  const activePill = wrap.querySelector(".stage-pill-item.active");
  if (activePill) {
    activePill.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  if (wrap._scrollSetupDone) return;
  wrap._scrollSetupDone = true;

  // Mouse wheel horizontal scroll
  wrap.addEventListener("wheel", (e) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      wrap.scrollLeft += e.deltaY;
    }
  }, { passive: false });

  // Mouse drag to scroll
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  wrap.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.pageX - wrap.offsetLeft;
    scrollLeft = wrap.scrollLeft;
  });

  window.addEventListener("mouseup", () => {
    isDown = false;
  });

  wrap.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    const x = e.pageX - wrap.offsetLeft;
    const walk = (x - startX) * 1.5;
    wrap.scrollLeft = scrollLeft - walk;
  });
};

window.goToStage = function(stageIndex) {
  if (!state.subjectDetail || !state.subjectDetail.units) return;
  const units = state.subjectDetail.units;
  if (stageIndex < 0 || stageIndex >= units.length) return;
  playSound("click");
  state.currentStageIndex = stageIndex;
  render();
  setTimeout(() => {
    setupStagePillsScroll();
  }, 40);
  window.scrollTo({ top: 0, behavior: "smooth" });
};

function renderHome() {
  if (!state.subjectDetail) {
    return `<div class="loading-shell"><span class="loading-flower">✿</span><span>Đang tải lộ trình học...</span></div>`;
  }

  const data = state.subjectDetail;
  const units = data.units || [];
  if (!units.length) {
    return `
      <div class="path-container">
        <h1 class="page-title">${esc(data.subject.subject_name)}</h1>
        <div class="empty-state">Môn học này chưa có cửa ải nào.</div>
      </div>
    `;
  }

  // Ensure currentStageIndex is within valid range
  if (state.currentStageIndex < 0) state.currentStageIndex = 0;
  if (state.currentStageIndex >= units.length) state.currentStageIndex = units.length - 1;

  const currentIdx = state.currentStageIndex;
  const unit = units[currentIdx];
  const lessons = unit.lessons || [];
  const noteTargetLesson = lessons.find(l => l.unlocked && !l.completed) || lessons.find(l => l.unlocked) || lessons[0] || null;

  const completedCount = lessons.filter(l => l.completed).length;
  const isStageAllCompleted = lessons.length > 0 && completedCount === lessons.length;
  const progressPercent = lessons.length ? Math.round((completedCount * 100) / lessons.length) : 0;

  // Build Stage Navigator Bar
  const stagePillsHtml = units.map((u, idx) => {
    const uDone = u.lessons && u.lessons.length > 0 && u.lessons.every(l => l.completed);
    return `
      <button class="stage-pill-item ${idx === currentIdx ? 'active' : ''}" onclick="goToStage(${idx})">
        Ải ${idx + 1} ${uDone ? '⭐' : ''}
      </button>
    `;
  }).join("");

  const nodesHtml = lessons.map((lesson, idx) => {
    const current = lesson.unlocked && !lesson.completed;
    const statusClass = lesson.completed ? "node-completed" : current ? "node-current" : "node-locked";
    const icon = lesson.completed ? "⭐" : current ? "★" : "🔒";
    const tooltip = current ? `<div class="node-tooltip">BẮT ĐẦU</div>` : "";
    const starsBadge = lesson.completed ? `<div class="node-stars"><span>⭐</span><span>⭐</span><span>⭐</span></div>` : "";

    return `
      <div class="path-node-wrap">
        ${tooltip}
        <button class="node-btn ${statusClass}" data-lesson="${Number(lesson.id)}" ${!lesson.unlocked ? 'disabled' : ''} title="${esc(lesson.title)}">
          ${starsBadge}
          <span>${icon}</span>
        </button>
        <div class="node-title-label">${esc(lesson.title)}</div>
      </div>
    `;
  }).join("");

  const stageStatusText = isStageAllCompleted
    ? "🏆 ĐÃ VƯỢT ẢI THÀNH CÔNG"
    : "⚔️ ĐANG CHINH PHỤC CỬA ẢI";

  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < units.length - 1;

  return `
    <div class="path-container">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
        <div>
          <h1 class="page-title">${esc(data.subject.subject_name)}</h1>
          <p class="page-subtitle">1 Chương là 1 Cửa Ải. Chinh phục từng ải để tích lũy XP và lên cấp!</p>
        </div>
        <button class="btn-duo btn-duo-pink" data-page="courses">Đổi môn học 📚</button>
      </div>

      <!-- STAGE NAVIGATOR (CHUYỂN CỬA ẢI) -->
      <div class="stage-navigator-bar">
        <button class="stage-nav-arrow" ${!hasPrev ? 'disabled' : ''} onclick="goToStage(${currentIdx - 1})" title="Về ải trước">
          ❮ Ải trước
        </button>
        <div class="stage-pills-carousel">
          <button class="pills-scroll-arrow left" type="button" onclick="scrollStagePills(-180)" title="Cuộn sang trái">‹</button>
          <div class="stage-pills-wrap" id="stage-pills-wrap">
            ${stagePillsHtml}
          </div>
          <button class="pills-scroll-arrow right" type="button" onclick="scrollStagePills(180)" title="Cuộn sang phải">›</button>
        </div>
        <button class="stage-nav-arrow" ${!hasNext ? 'disabled' : ''} onclick="goToStage(${currentIdx + 1})" title="Tới ải sau">
          Ải sau ❯
        </button>
      </div>

      <!-- ONLY LOAD & DISPLAY CURRENT STAGE -->
      <section class="stage-section">
        <div class="stage-banner ${isStageAllCompleted ? 'stage-completed' : (currentIdx % 2 === 1 ? 'stage-alt' : '')}">
          <div class="stage-banner-left">
            <span class="stage-badge-tag">🏰 CỬA ẢI ${currentIdx + 1} / ${units.length} • ${stageStatusText}</span>
            <h2 class="stage-title">${esc(unit.title)}</h2>
            <div class="stage-progress-bar-wrap">
              <div class="stage-progress-bar">
                <div class="stage-progress-fill" style="width:${progressPercent}%;"></div>
              </div>
              <span class="stage-progress-text">Đã hoàn thành ${completedCount} / ${lessons.length} bài học (${progressPercent}%)</span>
            </div>
          </div>
          <div class="page-inline-mascot stage-banner-mascot">
            ${renderThoBayMau({ state: THO_STATES.CLOUD_FLOAT, size: 92, speech: "Cùng chinh phục cửa ải này nhé!", speechDirection: "top" })}
          </div>
          <div class="stage-banner-actions">
            <button class="stage-guidebook-btn" onclick="openQuickLessonDrawer(${Number(noteTargetLesson?.id || 0)}, 'guide')" ${noteTargetLesson ? '' : 'disabled'}>
              <span>📖</span> Cẩm nang
            </button>
            <button class="stage-note-btn" onclick="openQuickLessonDrawer(${Number(noteTargetLesson?.id || 0)}, 'note')" ${noteTargetLesson ? '' : 'disabled'}>
              <span>✏️</span> Ghi chú bài này
            </button>
          </div>
        </div>

        <div class="stage-path-nodes">
          ${nodesHtml || '<div class="empty-state">Cửa ải này đang được cập nhật câu hỏi.</div>'}

          <!-- Final Stage Trophy / Boss Checkpoint with Thỏ Bảy Màu -->
          <div class="stage-trophy-node" style="display:flex; flex-direction:column; align-items:center; gap:8px;">
            <button class="trophy-btn ${isStageAllCompleted ? '' : 'locked'}" onclick="handleStageTrophyClick(${currentIdx + 1}, ${isStageAllCompleted})">
              ${isStageAllCompleted ? '🏆' : '🏁'}
            </button>
            <span class="trophy-label">
              ${isStageAllCompleted ? `Đã nhận Cúp Cửa ải ${currentIdx + 1}` : `Vượt hết bài để nhận Cúp`}
            </span>
          </div>
        </div>

        <!-- STAGE FOOTER ACTION: LOAD NEXT STAGE -->
        <div class="stage-footer-actions">
          <div style="font-size:32px;">${isStageAllCompleted ? '🎉' : '🗺️'}</div>
          <h3 style="font-size:20px; font-weight:900; color:var(--ink-900);">
            ${isStageAllCompleted
              ? `Chúc mừng bạn đã chinh phục Cửa ải ${currentIdx + 1}!`
              : `Bạn đang ở Cửa ải ${currentIdx + 1}: ${esc(unit.title)}`}
          </h3>
          <p style="font-size:14.5px; color:var(--ink-500); max-width:480px; margin:-4px 0 8px;">
            ${isStageAllCompleted
              ? `Tất cả bài học trong chương này đã hoàn thành. Hãy tiến vào Cửa ải tiếp theo để tiếp tục bài học mới!`
              : `Chinh phục các mốc bài học phía trên để tích lũy điểm XP và mở khóa toàn bộ Cúp Cửa ải.`}
          </p>
          ${hasNext ? `
            <button class="stage-next-btn" onclick="goToStage(${currentIdx + 1})">
              Sang Cửa ải ${currentIdx + 2}: ${esc(units[currentIdx + 1].title.split(':')[0] || 'Ải kế tiếp')} ➔
            </button>
          ` : `
            <div style="font-weight:900; color:var(--lumi-pink); font-size:16px;">
              🌟 Bạn đã đi đến Cửa ải cuối cùng của môn học này!
            </div>
          `}
        </div>
      </section>
    </div>
  `;
}

window.handleStageTrophyClick = function(stageNum, isCompleted) {
  if (isCompleted) {
    playSound("fanfare");
    showModal(`
      <div class="modal-dialog" style="text-align:center;">
        <span class="modal-close" onclick="closeModal()">✕</span>
        <span style="font-size:64px; animation: trophyShine 2s infinite ease;">🏆</span>
        <h2 style="font-size:24px; font-weight:900; color:var(--ink-900); margin-top:8px;">
          Chúc mừng bạn đã vượt Cửa ải ${stageNum}!
        </h2>
        <p style="font-size:15px; color:var(--ink-700); margin:12px 0 20px; line-height:1.5;">
          Bạn đã hoàn thành xuất sắc toàn bộ bài học trong cửa ải này. Hãy tiếp tục tiến tới các Cửa ải tiếp theo để thăng hạng!
        </p>
        <button class="btn-duo btn-duo-pink" style="width:100%;" onclick="closeModal()">Tiếp tục ➔</button>
      </div>
    `);
  } else {
    playSound("click");
    showToast(`Hãy hoàn thành tất cả các bài học trong Cửa ải ${stageNum} để nhận Cúp này nhé!`);
  }
};

window.openGuidebook = function(unitTitle) {
  const unit = state.subjectDetail?.units?.[state.currentStageIndex];
  const lesson = unit?.lessons?.find(l => l.unlocked && !l.completed) || unit?.lessons?.find(l => l.unlocked);
  if (lesson) window.openQuickLessonDrawer(lesson.id, "guide");
  else showToast("Chưa có bài học để mở cẩm nang.");
};

// ========================================================
// STUDENT NOTES + QUICK LESSON DRAWER
// ========================================================
async function loadNotes() {
  state.notesLoading = true;
  if (state.page === "notes") render();
  try {
    const result = await api("/api/notes");
    state.notes = result.notes || [];
  } catch (err) {
    showToast("Không tải được sổ tay: " + err.message, true);
  } finally {
    state.notesLoading = false;
    if (state.page === "notes") render();
  }
}

function noteSubjectsOptions(selected) {
  return '<option value="">Chưa gắn môn học</option>' + state.subjects.map(subject =>
    `<option value="${Number(subject.id)}" ${Number(selected) === Number(subject.id) ? "selected" : ""}>${esc(subject.subject_name)}</option>`
  ).join("");
}

function noteSubjectFilterOptions() {
  return '<option value="">Tất cả môn học</option>' + state.subjects.map(subject =>
    `<option value="${Number(subject.id)}" ${String(state.noteSubjectId) === String(subject.id) ? "selected" : ""}>${esc(subject.subject_name)}</option>`
  ).join("");
}

const NOTE_CONTENT_PREFIX = "__3TG_NOTE_V1__:";
const NOTE_PAPERS = { lined: "Giấy kẻ ngang", grid: "Giấy ô li", dotted: "Giấy chấm", plain: "Giấy trắng" };
const NOTE_FONTS = { sans: "Gọn gàng", serif: "Serif", mono: "Mã / công thức", hand: "Viết tay" };

function cleanNoteStyle(style) {
  const source = style && typeof style === "object" ? style : {};
  const strokes = Array.isArray(source.strokes) ? source.strokes.slice(-12).map(stroke => ({
    d: String(stroke?.d || "").slice(0, 1600),
    color: /^#[0-9a-f]{6}$/i.test(String(stroke?.color || "")) ? String(stroke.color) : "#d63376",
    width: Math.max(1, Math.min(14, Number(stroke?.width) || 3))
  })).filter(stroke => stroke.d) : [];
  return {
    paper: Object.prototype.hasOwnProperty.call(NOTE_PAPERS, source.paper) ? source.paper : "lined",
    font: Object.prototype.hasOwnProperty.call(NOTE_FONTS, source.font) ? source.font : "sans",
    strokes: strokes
  };
}

function parseNoteContent(value) {
  const raw = String(value || "");
  if (!raw.startsWith(NOTE_CONTENT_PREFIX)) return { body: raw, style: cleanNoteStyle(null), rich: false };
  try {
    const parsed = JSON.parse(raw.slice(NOTE_CONTENT_PREFIX.length));
    return { body: String(parsed.body || ""), style: cleanNoteStyle(parsed.style), rich: parsed.format === "html" };
  } catch {
    return { body: raw.slice(NOTE_CONTENT_PREFIX.length), style: cleanNoteStyle(null), rich: false };
  }
}

function sanitizeNoteHtml(value) {
  const doc = new DOMParser().parseFromString(String(value || ""), "text/html");
  const allowed = { B: "strong", STRONG: "strong", I: "em", EM: "em", U: "u", MARK: "mark", BR: "br", P: "p", DIV: "div", UL: "ul", OL: "ol", LI: "li", SUB: "sub", SUP: "sup" };
  function clean(node) {
    if (node.nodeType === 3) return esc(node.nodeValue || "");
    if (node.nodeType !== 1) return "";
    const children = Array.from(node.childNodes).map(clean).join("");
    const tag = allowed[node.tagName];
    return tag ? (tag === "br" ? "<br>" : `<${tag}>${children}</${tag}>`) : children;
  }
  return Array.from(doc.body.childNodes).map(clean).join("");
}

function noteBodyHtml(parsed) {
  if (parsed.rich) return sanitizeNoteHtml(parsed.body);
  return esc(parsed.body)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/==(.+?)==/g, "<mark>$1</mark>")
    .replace(/\$([^$\n]+)\$/g, '<span class="note-math">$1</span>')
    .replace(/\$(?=<strong>)/g, "")
    .replace(/\r?\n/g, "<br>");
}

function noteBodyText(parsed) {
  return new DOMParser().parseFromString(noteBodyHtml(parsed), "text/html").body.textContent || "";
}

function serializeNoteContent(body, style) {
  const safeStyle = cleanNoteStyle(style);
  let safeBody = sanitizeNoteHtml(body).slice(0, 30000);
  let serialized = NOTE_CONTENT_PREFIX + JSON.stringify({ body: safeBody, style: safeStyle, format: "html" });
  while (serialized.length > 29990 && safeStyle.strokes.length) {
    safeStyle.strokes.shift();
    serialized = NOTE_CONTENT_PREFIX + JSON.stringify({ body: safeBody, style: safeStyle, format: "html" });
  }
  while (serialized.length > 29990 && safeBody.length) {
    const excess = serialized.length - 29990;
    safeBody = safeBody.slice(0, Math.max(0, safeBody.length - Math.max(16, Math.ceil(excess / 2))));
    serialized = NOTE_CONTENT_PREFIX + JSON.stringify({ body: safeBody, style: safeStyle, format: "html" });
  }
  return serialized;
}

function renderNoteStyleBar(style) {
  return `<div class="note-style-bar">
    <label>Phông<select data-note-style-field="font" onchange="setNoteStyle(this, 'font', this.value)">${Object.entries(NOTE_FONTS).map(([key, label]) => `<option value="${key}" ${style.font === key ? "selected" : ""}>${label}</option>`).join("")}</select></label>
    <label>Giấy<select data-note-style-field="paper" onchange="setNoteStyle(this, 'paper', this.value)">${Object.entries(NOTE_PAPERS).map(([key, label]) => `<option value="${key}" ${style.paper === key ? "selected" : ""}>${label}</option>`).join("")}</select></label>
    <button type="button" onclick="toggleNoteDrawing(this)">✏️ Vẽ / hình học</button>
    <button type="button" onmousedown="event.preventDefault()" onclick="openStudyCalculator(this)">🧮 Máy tính</button>
    <button type="button" data-note-fullscreen onclick="toggleNoteFullscreen(this)" title="Mở rộng vùng ghi chú">⛶ Toàn màn hình</button>
  </div>`;
}

function renderNoteFormatBar() {
  const tokens = [
    ["f(x)", "f(x) = ", "Chèn hàm số"], ["x²", "x²", "Lũy thừa"], ["a⁄b", "□/□", "Phân số"],
    ["√", "√( )", "Căn thức"], ["∫", "∫_{a}^{b} f(x) dx", "Tích phân"], ["Σ", "∑ᵢ₌₁ⁿ i", "Tổng sigma"],
    ["d/dx", "d/dx", "Đạo hàm"], ["lim", "limₓ→ₐ", "Giới hạn"], ["∂", "∂/∂x", "Đạo hàm riêng"],
    ["∞", "∞", "Vô cực"], ["∈", "∈", "Thuộc tập hợp"], ["∩", "∩", "Giao hai tập hợp"],
    ["∠", "∠ABC", "Góc hình học"], ["△", "△ABC", "Tam giác"], ["⊥", "⊥", "Vuông góc"], ["∥", "∥", "Song song"]
  ];
  return `<div class="note-format-bar" aria-label="Định dạng, công thức và hình học">
    <button type="button" onmousedown="event.preventDefault()" onclick="formatNoteSelection(this, 'bold')" title="In đậm"><strong>B</strong></button>
    <button type="button" onmousedown="event.preventDefault()" onclick="formatNoteSelection(this, 'highlight')" title="Tô sáng">🖍️</button>
    ${tokens.map(([label, token, title]) => `<button type="button" onmousedown="event.preventDefault()" data-note-token="${esc(token)}" onclick="insertNoteToken(this)" title="${esc(title)}">${esc(label)}</button>`).join("")}
  </div>`;
}

function renderNoteDrawingPanel() {
  return `<div class="note-draw-panel" hidden>
    <div class="note-draw-tools">
      <label>Dụng cụ<select data-note-draw-tool><option value="pen">Bút tự do</option><option value="line">Đoạn thẳng</option><option value="circle">Đường tròn</option><option value="triangle">Tam giác</option><option value="point">Điểm</option><option value="erase">Tẩy hết</option></select></label>
      <label>Màu<input type="color" data-note-draw-color value="#d63376"></label>
      <label>Nét<input type="range" data-note-draw-width min="1" max="12" value="3"></label>
      <button type="button" onclick="clearNoteDrawing(this)">Xóa hình</button>
    </div>
    <canvas class="note-draw-canvas" data-note-canvas width="1000" height="320" aria-label="Bảng vẽ ghi chú"></canvas>
    <small>Kéo để vẽ; chọn đoạn thẳng, đường tròn, tam giác hoặc điểm để dựng hình.</small>
  </div>`;
}

function renderNoteDrawingPreview(style) {
  if (!style.strokes.length) return "";
  return `<svg class="note-drawing-preview" viewBox="0 0 1000 320" role="img" aria-label="Hình vẽ trong ghi chú">${style.strokes.map(stroke => `<path d="${esc(stroke.d)}" fill="none" stroke="${esc(stroke.color)}" stroke-width="${stroke.width}" stroke-linecap="round" stroke-linejoin="round"/>`).join("")}</svg>`;
}

function renderNoteCard(note, index) {
  const tempKey = note._tempId || "";
  const noteKey = note.id == null ? tempKey : String(note.id);
  const linkedLesson = note.lesson_id != null;
  const palettes = ["rose", "butter", "lilac", "mint"];
  const meta = linkedLesson
    ? `${esc(note.subject_name || "Môn học")} · ${esc(note.lesson_title || "Bài học")}`
    : (note.subject_name ? esc(note.subject_name) : "Ghi chú tự do");
  const parsedContent = parseNoteContent(note.content);
  const styleJson = esc(JSON.stringify(parsedContent.style));
  return `
    <article class="note-card note-card-${palettes[index % palettes.length]} note-paper-${parsedContent.style.paper} note-font-${parsedContent.style.font} note-editor" data-note-style="${styleJson}" data-note-id="${esc(noteKey)}" data-note-subject="${esc(note.subject_id || "")}" data-note-lesson="${esc(note.lesson_id || "")}">
      <div class="note-card-topline"><span class="note-card-meta">${meta}</span><span class="note-save-state">${note.id ? "Đã lưu" : "Bản nháp"}</span></div>
      <input class="note-title-input" data-note-field="title" maxlength="160" aria-label="Tiêu đề ghi chú" value="${esc(note.title || "Ghi chú mới")}" oninput="queueNoteSave(this)">
      ${renderNoteStyleBar(parsedContent.style)}
      ${renderNoteFormatBar()}
      ${renderNoteDrawingPanel()}
      <div class="note-content-input" data-note-field="content" contenteditable="true" role="textbox" aria-multiline="true" data-placeholder="Ghi lại điều quan trọng để ôn tập sau này…" oninput="queueNoteSave(this)" onpaste="pasteNotePlainText(event)">${noteBodyHtml(parsedContent)}</div>
      ${renderNoteDrawingPreview(parsedContent.style)}
      <div class="note-card-footer">
        ${linkedLesson
          ? `<span class="note-linked-label">📌 Gắn với bài học</span>`
          : `<select class="note-subject-select" data-note-field="subject" aria-label="Môn học" onchange="queueNoteSave(this)">${noteSubjectsOptions(note.subject_id)}</select>`}
        <button type="button" class="note-save-btn" data-note-save onclick="saveNoteNow(this)">💾 Lưu ghi chú</button>
        <button type="button" class="note-delete-btn" onclick="deleteStudentNote(this)" aria-label="Xóa ghi chú">Xóa</button>
      </div>
    </article>`;
}

function renderNotes() {
  const notes = state.notes || [];
  const subjectId = String(state.noteSubjectId || "");
  const eligible = notes.filter(note => !subjectId || String(note.subject_id || "") === subjectId);
  const lessonIds = [...new Map(eligible.filter(n => n.lesson_id != null).map(n => [String(n.lesson_id), n])).values()];
  const lessonFilter = '<option value="">Tất cả bài học</option>' + lessonIds.map(note =>
    `<option value="${Number(note.lesson_id)}" ${String(state.noteLessonId) === String(note.lesson_id) ? "selected" : ""}>${esc(note.lesson_title || `Bài ${note.lesson_id}`)}</option>`
  ).join("");
  const search = state.noteSearch.trim().toLocaleLowerCase("vi");
  const filtered = eligible.filter(note =>
    (!state.noteLessonId || String(note.lesson_id || "") === String(state.noteLessonId)) &&
    (!search || `${note.title || ""} ${noteBodyText(parseNoteContent(note.content))} ${note.subject_name || ""} ${note.lesson_title || ""}`.toLocaleLowerCase("vi").includes(search))
  );
  return `
    <section class="notes-page">
      <header class="notes-heading">
        <div><span class="notes-kicker">GÓC ÔN TẬP CỦA BẠN ✨</span><h1 class="page-title">Sổ tay ghi chú</h1><p class="page-subtitle">Bí kíp bài học và lời giải 3TG AI được lưu gọn trong một chỗ.</p></div>
        <div class="notes-heading-actions"><button type="button" class="notes-tool-btn" onclick="openStudyCalculator()">🧮 Máy tính</button><button class="btn-duo btn-duo-pink" onclick="addStudentNote()">＋ Ghi chú mới</button></div>
      </header>
      <div class="notes-toolbar">
        <label class="notes-search">🔎 <input id="notes-search" type="search" placeholder="Tìm tiêu đề hoặc nội dung…" value="${esc(state.noteSearch)}" oninput="filterStudentNotes(this.value)"></label>
        <select aria-label="Lọc theo môn học" onchange="setNotesSubject(this.value)">${noteSubjectFilterOptions()}</select>
        <select aria-label="Lọc theo bài học" onchange="setNotesLesson(this.value)">${lessonFilter}</select>
      </div>
      ${state.notesLoading && !notes.length ? '<div class="loading-shell"><span class="loading-flower">✿</span><span>Đang tải sổ tay…</span></div>' : ""}
      ${filtered.length ? `<div class="notes-grid">${filtered.map(renderNoteCard).join("")}</div><div class="notes-filter-empty" id="notes-filter-empty" hidden>Không tìm thấy ghi chú khớp với từ khóa này.</div>` : `
        <div class="notes-empty"><div>📝</div><h2>${notes.length ? "Chưa có ghi chú phù hợp" : "Bắt đầu cuốn sổ của bạn"}</h2><p>${notes.length ? "Thử đổi bộ lọc hoặc từ khóa tìm kiếm nhé." : "Lưu một bí kíp từ bài học hoặc tạo ghi chú đầu tiên của bạn."}</p><button class="btn-duo btn-duo-pink" onclick="addStudentNote()">Tạo ghi chú đầu tiên</button></div>`}
    </section>`;
}

window.filterStudentNotes = function(query) {
  state.noteSearch = query || "";
  const needle = state.noteSearch.trim().toLocaleLowerCase("vi");
  let visibleCount = 0;
  document.querySelectorAll(".note-card").forEach(card => {
    const title = card.querySelector("[data-note-field='title']")?.value || "";
    const content = card.querySelector("[data-note-field='content']")?.innerText || "";
    card.hidden = Boolean(needle && !`${card.textContent} ${title} ${content}`.toLocaleLowerCase("vi").includes(needle));
    if (!card.hidden) visibleCount++;
  });
  const empty = document.getElementById("notes-filter-empty");
  if (empty) empty.hidden = visibleCount > 0;
};

window.setNotesSubject = function(value) {
  state.noteSubjectId = value || "";
  state.noteLessonId = "";
  render();
};

window.setNotesLesson = function(value) {
  state.noteLessonId = value || "";
  render();
};

window.addStudentNote = function() {
  state.noteSearch = "";
  const tempId = "draft-" + crypto.randomUUID();
  state.notes.unshift({ id: null, _tempId: tempId, subject_id: state.noteSubjectId || null, lesson_id: null, title: "Ghi chú mới", content: "", subject_name: "", lesson_title: "" });
  state.noteLessonId = "";
  render();
  const card = document.querySelector(`[data-note-id="${tempId}"]`);
  card?.querySelector("[data-note-field='content']")?.focus();
  if (card) window.queueNoteSave(card.querySelector("[data-note-field='title']"));
};

function getNoteEditor(element) {
  return element?.closest(".note-editor");
}

let activeFullscreenNoteEditor = null;
let noteFullscreenBackdrop = null;

window.toggleNoteFullscreen = function(control) {
  const editor = getNoteEditor(control);
  if (!editor) return;
  if (editor.classList.contains("note-editor-fullscreen")) {
    window.closeNoteFullscreen();
    return;
  }
  if (activeFullscreenNoteEditor) window.closeNoteFullscreen();
  noteFullscreenBackdrop = document.createElement("div");
  noteFullscreenBackdrop.className = "note-fullscreen-backdrop";
  noteFullscreenBackdrop.addEventListener("click", window.closeNoteFullscreen);
  document.body.appendChild(noteFullscreenBackdrop);
  activeFullscreenNoteEditor = editor;
  const placeholder = document.createComment("note-editor-fullscreen-position");
  editor.before(placeholder);
  editor._noteFullscreenPlaceholder = placeholder;
  document.body.appendChild(editor);
  editor.classList.add("note-editor-fullscreen");
  document.body.classList.add("note-fullscreen-open");
  const toggle = editor.querySelector("[data-note-fullscreen]");
  if (toggle) {
    toggle.textContent = "↙ Thu nhỏ";
    toggle.title = "Thu nhỏ ghi chú";
  }
  editor.querySelector("[data-note-field='content']")?.focus();
};

window.closeNoteFullscreen = function() {
  if (activeFullscreenNoteEditor) {
    const editor = activeFullscreenNoteEditor;
    editor.classList.remove("note-editor-fullscreen");
    const placeholder = editor._noteFullscreenPlaceholder;
    if (placeholder?.parentNode) {
      placeholder.parentNode.insertBefore(editor, placeholder);
      placeholder.remove();
    }
    delete editor._noteFullscreenPlaceholder;
    const toggle = editor.querySelector("[data-note-fullscreen]");
    if (toggle) {
      toggle.textContent = "⛶ Toàn màn hình";
      toggle.title = "Mở rộng vùng ghi chú";
    }
  }
  noteFullscreenBackdrop?.remove();
  noteFullscreenBackdrop = null;
  activeFullscreenNoteEditor = null;
  document.body.classList.remove("note-fullscreen-open");
};

window.queueNoteSave = function(element) {
  const editor = getNoteEditor(element);
  if (!editor) return;
  if (element.dataset.noteField === "subject") editor.dataset.noteSubject = element.value || "";
  const key = editor.dataset.noteId || ("draft-" + crypto.randomUUID());
  editor.dataset.noteId = key;
  const timers = state.noteSaveTimers;
  if (timers.has(key)) clearTimeout(timers.get(key));
  const status = editor.querySelector(".note-save-state");
  if (status) status.textContent = "Đang lưu…";
  timers.set(key, setTimeout(() => {
    timers.delete(key);
    persistNoteEditor(editor, key);
  }, 500));
};

async function persistNoteEditor(editor, key) {
  if (editor._noteSaving) {
    try { await editor._noteSaving; } catch {}
    return persistNoteEditor(editor, editor.dataset.noteId || key);
  }
  key = editor.dataset.noteId || key;
  const fields = field => editor.querySelector(`[data-note-field="${field}"]`);
  const title = (fields("title")?.value || "").trim() || "Ghi chú mới";
  const body = {
    title,
    content: serializeNoteContent(fields("content")?.innerHTML || "", readNoteEditorStyle(editor)),
    subjectId: editor.dataset.noteSubject || null,
    lessonId: editor.dataset.noteLesson || null
  };
  const isDraft = String(key).startsWith("draft-") || !/^\d+$/.test(String(key));
  const savePromise = api(isDraft ? "/api/notes" : `/api/notes/${Number(key)}`, {
      method: isDraft ? "POST" : "PATCH", body
    });
  editor._noteSaving = savePromise;
  try {
    const result = await savePromise;
    const saved = result.note;
    if (!saved) throw new Error("Không nhận được ghi chú đã lưu.");
    const oldTemp = editor.dataset.noteId;
    editor.dataset.noteId = String(saved.id);
    editor.dataset.noteSubject = saved.subject_id == null ? "" : String(saved.subject_id);
    editor.dataset.noteLesson = saved.lesson_id == null ? "" : String(saved.lesson_id);
    const index = state.notes.findIndex(note => String(note.id) === String(saved.id) || note._tempId === oldTemp);
    if (index >= 0) state.notes[index] = saved;
    else state.notes.unshift(saved);
    if (state.activeQuickLessonId && Number(saved.lesson_id) === Number(state.activeQuickLessonId)) state.quickNote = saved;
    const status = editor.querySelector(".note-save-state");
    if (status) status.textContent = "Đã lưu";
    return true;
  } catch (err) {
    const status = editor.querySelector(".note-save-state");
    if (status) status.textContent = "Lưu lỗi · thử lại";
    console.error("Note autosave failed", err);
    return false;
  } finally {
    if (editor._noteSaving === savePromise) editor._noteSaving = null;
  }
}

window.saveNoteNow = async function(button) {
  const editor = getNoteEditor(button);
  if (!editor) return;
  const key = editor.dataset.noteId || ("draft-" + crypto.randomUUID());
  editor.dataset.noteId = key;
  const timers = state.noteSaveTimers;
  if (timers.has(key)) {
    clearTimeout(timers.get(key));
    timers.delete(key);
  }
  button.disabled = true;
  button.textContent = "Đang lưu…";
  const saved = await persistNoteEditor(editor, key);
  if (button.isConnected) {
    button.disabled = false;
    button.textContent = saved ? "Đã lưu ✓" : "Lưu lại";
    setTimeout(() => {
      if (button.isConnected) button.textContent = "💾 Lưu ghi chú";
    }, 1400);
  }
};

window.formatNoteSelection = function(button, format) {
  const editor = button.closest(".note-editor");
  const input = editor?.querySelector("[data-note-field='content']");
  if (!input) return;
  input.focus();
  const selection = window.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  if (!range || !input.contains(range.commonAncestorContainer)) {
    input.append(document.createTextNode("ý chính"));
    const newRange = document.createRange();
    newRange.selectNodeContents(input.lastChild);
    selection?.removeAllRanges();
    selection?.addRange(newRange);
  }
  if (format === "bold") {
    document.execCommand("bold", false);
  } else {
    const current = selection?.rangeCount ? selection.getRangeAt(0) : null;
    if (current && input.contains(current.commonAncestorContainer)) {
      const mark = document.createElement("mark");
      try { current.surroundContents(mark); }
      catch {
        mark.append(current.extractContents());
        current.insertNode(mark);
      }
      const after = document.createRange();
      after.selectNodeContents(mark);
      selection?.removeAllRanges();
      selection?.addRange(after);
    }
  }
  window.queueNoteSave(input);
};

window.pasteNotePlainText = function(event) {
  event.preventDefault();
  const text = event.clipboardData?.getData("text/plain") || "";
  insertNoteTextAtCursor(event.currentTarget, text);
};

function insertNoteTextAtCursor(input, text, storedRange = null) {
  if (!input || !text) return null;
  input.focus();
  const selection = window.getSelection();
  let range = storedRange?.startContainer?.isConnected ? storedRange.cloneRange() : null;
  if (!range || !input.contains(range.commonAncestorContainer)) {
    const current = selection?.rangeCount ? selection.getRangeAt(0) : null;
    range = current && input.contains(current.commonAncestorContainer) ? current.cloneRange() : null;
  }
  if (!range) {
    range = document.createRange();
    range.selectNodeContents(input);
    range.collapse(false);
  }
  range.deleteContents();
  const textNode = document.createTextNode(text);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.collapse(true);
  selection?.removeAllRanges();
  selection?.addRange(range);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  return range.cloneRange();
}

function readNoteEditorStyle(editor) {
  try { return cleanNoteStyle(JSON.parse(editor?.dataset.noteStyle || "{}")); }
  catch { return cleanNoteStyle(null); }
}

function updateNoteEditorStyle(editor, nextStyle, save = true) {
  if (!editor) return;
  const style = cleanNoteStyle(nextStyle);
  const previous = readNoteEditorStyle(editor);
  editor.classList.remove(`note-paper-${previous.paper}`, `note-font-${previous.font}`);
  editor.classList.add(`note-paper-${style.paper}`, `note-font-${style.font}`);
  editor.dataset.noteStyle = JSON.stringify(style);
  const preview = editor.querySelector(".note-drawing-preview");
  const previewHtml = renderNoteDrawingPreview(style);
  if (preview && previewHtml) preview.outerHTML = previewHtml;
  else if (preview) preview.remove();
  else if (previewHtml) editor.querySelector("[data-note-field='content']")?.insertAdjacentHTML("afterend", previewHtml);
  const canvas = editor.querySelector("[data-note-canvas]");
  const panel = editor.querySelector(".note-draw-panel");
  if (canvas && panel && !panel.hidden) paintNoteCanvas(editor);
  if (save) window.queueNoteSave(editor.querySelector("[data-note-field='content']"));
}

window.setNoteStyle = function(control, styleKey, value) {
  const editor = getNoteEditor(control);
  const style = readNoteEditorStyle(editor);
  style[styleKey] = value;
  updateNoteEditorStyle(editor, style);
};

window.insertNoteToken = function(button) {
  const editor = getNoteEditor(button);
  const input = editor?.querySelector("[data-note-field='content']");
  if (!input) return;
  input.focus();
  const selection = window.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  if (!range || !input.contains(range.commonAncestorContainer)) {
    const end = document.createRange();
    end.selectNodeContents(input);
    end.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(end);
  }
  const token = button.dataset.noteToken || "";
  insertNoteTextAtCursor(input, token);
};

function paintNoteCanvas(editor) {
  const canvas = editor?.querySelector("[data-note-canvas]");
  const context = canvas?.getContext("2d");
  if (!canvas || !context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (const stroke of readNoteEditorStyle(editor).strokes) {
    try {
      context.strokeStyle = stroke.color;
      context.lineWidth = stroke.width;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.stroke(new Path2D(stroke.d));
    } catch { /* Ignore malformed legacy drawing paths. */ }
  }
}

window.toggleNoteDrawing = function(button) {
  const editor = getNoteEditor(button);
  const panel = editor?.querySelector(".note-draw-panel");
  if (!panel) return;
  panel.hidden = !panel.hidden;
  if (!panel.hidden) paintNoteCanvas(editor);
};

window.clearNoteDrawing = function(button) {
  const editor = getNoteEditor(button);
  if (!editor) return;
  const style = readNoteEditorStyle(editor);
  style.strokes = [];
  updateNoteEditorStyle(editor, style);
};

function noteCanvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(1000, Math.round((event.clientX - rect.left) * 1000 / rect.width))),
    y: Math.max(0, Math.min(320, Math.round((event.clientY - rect.top) * 320 / rect.height)))
  };
}

function geometryPath(tool, start, end) {
  if (tool === "line") return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  if (tool === "triangle") return `M ${start.x} ${start.y} L ${end.x} ${end.y} L ${(start.x + end.x) / 2} ${start.y} Z`;
  if (tool === "circle") {
    const rx = Math.max(1, Math.abs(end.x - start.x) / 2);
    const ry = Math.max(1, Math.abs(end.y - start.y) / 2);
    const cx = (start.x + end.x) / 2;
    const cy = (start.y + end.y) / 2;
    return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`;
  }
  if (tool === "point") return `M ${end.x - 4} ${end.y} a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0`;
  return "";
}

document.addEventListener("pointerdown", function(event) {
  const canvas = event.target.closest("[data-note-canvas]");
  if (!canvas) return;
  const editor = getNoteEditor(canvas);
  const panel = canvas.closest(".note-draw-panel");
  if (!editor || !panel || panel.hidden) return;
  const tool = panel.querySelector("[data-note-draw-tool]")?.value || "pen";
  if (tool === "erase") { window.clearNoteDrawing(canvas); return; }
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  const start = noteCanvasPoint(canvas, event);
  const color = panel.querySelector("[data-note-draw-color]")?.value || "#d63376";
  const width = Number(panel.querySelector("[data-note-draw-width]")?.value) || 3;
  canvas._noteDrawing = { tool, start, previous: start, color, width, d: `M ${start.x} ${start.y}` };
  if (tool === "pen") {
    const context = canvas.getContext("2d");
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.strokeStyle = color;
    context.lineWidth = width;
    context.lineCap = "round";
    context.lineJoin = "round";
  }
});

document.addEventListener("pointermove", function(event) {
  const canvas = event.target.closest("[data-note-canvas]");
  const drawing = canvas?._noteDrawing;
  if (!canvas || !drawing || !(event.buttons & 1)) return;
  const point = noteCanvasPoint(canvas, event);
  if (drawing.tool === "pen" && drawing.d.length < 1500) {
    drawing.d += ` L ${point.x} ${point.y}`;
    const context = canvas.getContext("2d");
    context.lineTo(point.x, point.y);
    context.stroke();
  } else if (drawing.tool !== "pen") {
    drawing.previous = point;
    const editor = getNoteEditor(canvas);
    paintNoteCanvas(editor);
    const context = canvas.getContext("2d");
    const previewPath = geometryPath(drawing.tool, drawing.start, point);
    if (previewPath) {
      context.strokeStyle = drawing.color;
      context.lineWidth = drawing.width;
      context.stroke(new Path2D(previewPath));
    }
  }
  drawing.previous = point;
});

function finishNoteCanvasStroke(canvas) {
  const drawing = canvas?._noteDrawing;
  if (!drawing) return;
  const editor = getNoteEditor(canvas);
  const end = drawing.previous || drawing.start;
  const d = drawing.tool === "pen" ? drawing.d : geometryPath(drawing.tool, drawing.start, end);
  if (d) {
    const style = readNoteEditorStyle(editor);
    style.strokes.push({ d: d.slice(0, 1600), color: drawing.color, width: drawing.width });
    updateNoteEditorStyle(editor, style);
  }
  canvas._noteDrawing = null;
}

document.addEventListener("pointerup", event => finishNoteCanvasStroke(event.target.closest("[data-note-canvas]")));
document.addEventListener("pointercancel", event => finishNoteCanvasStroke(event.target.closest("[data-note-canvas]")));

function tokenizeCalculator(expression) {
  const source = String(expression || "");
  const tokens = source.match(/(?:\d+\.?\d*|\.\d+)|[a-zA-Z]+|[()+\-*/%^]/g) || [];
  if (tokens.join("").toLowerCase() !== source.replace(/\s/g, "").toLowerCase()) throw new Error("Có ký tự chưa được hỗ trợ.");
  return tokens;
}

function calculateExpression(expression) {
  if (String(expression || "").length > 512) throw new Error("Phép tính dài quá; hãy rút gọn biểu thức.");
  const tokens = tokenizeCalculator(expression);
  let cursor = 0;
  const peek = () => tokens[cursor];
  const take = () => tokens[cursor++];
  const parseAddSub = () => {
    let value = parseMulDiv();
    while (["+", "-"].includes(peek())) {
      const operator = take();
      const right = parseMulDiv();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  };
  const parsePrimary = () => {
    const token = take();
    if (token === "(") {
      const value = parseAddSub();
      if (take() !== ")") throw new Error("Thiếu dấu ngoặc đóng.");
      return value;
    }
    if (/^\d|^\./.test(token || "")) return Number(token);
    const name = String(token || "").toLowerCase();
    if (name === "pi") return Math.PI;
    if (name === "e") return Math.E;
    const functions = { sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan, log: Math.log10, ln: Math.log, abs: Math.abs };
    if (functions[name]) {
      if (peek() === "(") take();
      const argument = parseAddSub();
      if (peek() === ")") take();
      return functions[name](argument);
    }
    throw new Error(`Không hiểu ký hiệu “${token || ""}”.`);
  };
  const parsePower = () => {
    const left = parsePrimary();
    if (peek() === "^") { take(); return Math.pow(left, parseUnary()); }
    return left;
  };
  const parseUnary = () => peek() === "+" ? (take(), parseUnary()) : peek() === "-" ? (take(), -parseUnary()) : parsePower();
  const parseMulDiv = () => {
    let value = parseUnary();
    while (["*", "/", "%"].includes(peek())) {
      const operator = take();
      const right = parseUnary();
      value = operator === "*" ? value * right : operator === "/" ? value / right : value % right;
    }
    return value;
  };
  if (!tokens.length) throw new Error("Nhập phép tính trước nhé.");
  const result = parseAddSub();
  if (cursor < tokens.length) throw new Error("Biểu thức còn phần chưa tính được.");
  if (!Number.isFinite(result)) throw new Error("Kết quả không xác định.");
  return result;
}

let calculatorNoteEditor = null;
let calculatorNoteRange = null;
let lastFocusedNoteEditor = null;

document.addEventListener("focusin", event => {
  const editor = getNoteEditor(event.target);
  if (editor) lastFocusedNoteEditor = editor;
});

window.openStudyCalculator = function(control) {
  const selection = window.getSelection();
  const selectedNode = selection?.anchorNode;
  const selectedEditor = selectedNode ? getNoteEditor(selectedNode.nodeType === 1 ? selectedNode : selectedNode.parentElement) : null;
  calculatorNoteEditor = getNoteEditor(control) || activeFullscreenNoteEditor || selectedEditor || (lastFocusedNoteEditor?.isConnected ? lastFocusedNoteEditor : null);
  calculatorNoteRange = null;
  const noteInput = calculatorNoteEditor?.querySelector("[data-note-field='content']");
  const selectedRange = selection?.rangeCount ? selection.getRangeAt(0) : null;
  if (noteInput && selectedRange && noteInput.contains(selectedRange.commonAncestorContainer)) {
    calculatorNoteRange = selectedRange.cloneRange();
  }
  let layer = document.getElementById("study-calculator-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "study-calculator-layer";
    layer.className = "study-calculator-layer";
    document.body.appendChild(layer);
  }
  layer.innerHTML = `<div class="study-calculator-backdrop" onclick="if(event.target===this) closeStudyCalculator()"><div class="study-calculator" onclick="event.stopPropagation()">
    <button type="button" class="modal-close" onclick="closeStudyCalculator()" aria-label="Đóng máy tính">×</button>
    <span class="notes-kicker">CÔNG CỤ HỌC TẬP</span><h2>Máy tính khoa học</h2>
    <input id="study-calc-expression" type="text" inputmode="decimal" placeholder="Ví dụ: sqrt(25) + 2^3" onkeydown="if(event.key==='Enter') evaluateStudyCalculator()">
    <div class="study-calc-result" id="study-calc-result">Nhập phép tính để bắt đầu · góc dùng radian</div>
    <div class="study-calc-keys">${["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "(", "+", ")", "^", "pi", "sqrt(", "sin(", "cos(", "log(", "ln("].map(key => `<button type="button" onclick="appendCalculatorToken('${key}')">${key === "sqrt(" ? "√" : key}</button>`).join("")}</div>
    <button type="button" class="btn-duo btn-duo-pink study-calc-evaluate" onclick="evaluateStudyCalculator()">Tính kết quả</button>
    ${calculatorNoteEditor ? '<button type="button" class="study-calc-insert" id="study-calc-insert" onclick="insertCalculatorResultIntoNote()" disabled>↳ Chèn kết quả vào ghi chú</button><div class="study-calc-note-status" id="study-calc-note-status" aria-live="polite"></div>' : ''}
  </div></div>`;
  document.getElementById("study-calc-expression")?.focus();
};

window.closeStudyCalculator = function() {
  document.getElementById("study-calculator-layer")?.remove();
  const input = calculatorNoteEditor?.isConnected ? calculatorNoteEditor.querySelector("[data-note-field='content']") : null;
  if (input) {
    input.focus();
    if (calculatorNoteRange && input.contains(calculatorNoteRange.commonAncestorContainer)) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(calculatorNoteRange);
    }
  }
  calculatorNoteEditor = null;
  calculatorNoteRange = null;
};

window.appendCalculatorToken = function(token) {
  const input = document.getElementById("study-calc-expression");
  if (!input) return;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  input.value = input.value.slice(0, start) + token + input.value.slice(end);
  input.focus();
  input.setSelectionRange(start + token.length, start + token.length);
};

window.evaluateStudyCalculator = function() {
  const result = document.getElementById("study-calc-result");
  const insertButton = document.getElementById("study-calc-insert");
  try {
    const value = calculateExpression(document.getElementById("study-calc-expression")?.value || "");
    if (result) result.textContent = `= ${Number(value.toPrecision(12))}`;
    if (insertButton) insertButton.disabled = false;
  } catch (err) {
    if (result) result.textContent = err.message;
    if (insertButton) insertButton.disabled = true;
  }
};

window.insertCalculatorResultIntoNote = function() {
  const editor = calculatorNoteEditor;
  const input = editor?.isConnected ? editor.querySelector("[data-note-field='content']") : null;
  const result = document.getElementById("study-calc-result")?.textContent?.trim() || "";
  const status = document.getElementById("study-calc-note-status");
  if (!input) {
    if (status) status.textContent = "Ghi chú đã đóng; hãy mở máy tính từ ghi chú cần chèn.";
    return;
  }
  if (!result.startsWith("=")) {
    if (status) status.textContent = "Hãy tính xong kết quả trước.";
    return;
  }
  calculatorNoteRange = insertNoteTextAtCursor(input, `\n${result}\n`, calculatorNoteRange);
  if (status) status.textContent = "Đã chèn vào ghi chú và đang tự lưu.";
  document.getElementById("study-calc-expression")?.focus();
};

window.deleteStudentNote = async function(button) {
  const editor = getNoteEditor(button);
  if (!editor) return;
  let key = editor.dataset.noteId;
  const timers = state.noteSaveTimers;
  if (timers.has(key)) { clearTimeout(timers.get(key)); timers.delete(key); }
  if (editor._noteSaving) {
    try { await editor._noteSaving; } catch {}
    key = editor.dataset.noteId;
  }
  if (key && !String(key).startsWith("draft-") && /^\d+$/.test(key)) {
    if (!window.confirm("Xóa ghi chú này khỏi sổ tay?")) return;
    try { await api(`/api/notes/${Number(key)}`, { method: "DELETE" }); }
    catch (err) { showToast("Không xóa được ghi chú: " + err.message, true); return; }
  }
  state.notes = state.notes.filter(note => String(note.id) !== String(key) && note._tempId !== key);
  render();
  showToast("Đã xóa ghi chú.");
};

function renderQuickLessonDrawer() {
  const detail = state.quickLessonData;
  const lesson = detail?.lesson || {};
  const activeTab = state.quickDrawerTab;
  const note = state.quickNote || { id: null, _tempId: "quick-" + lesson.id, title: lesson.title || "Ghi chú bài học", content: "", subject_id: lesson.subject_id, lesson_id: lesson.id };
  const video = lesson.video_url ? (() => {
    try {
      const url = new URL(lesson.video_url);
      if (!["https:", "http:"].includes(url.protocol)) return { href: "", embed: "" };
      let embed = "";
      if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) {
        const pathMatch = url.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})/);
        const id = url.searchParams.get("v") || (pathMatch && pathMatch[1]);
        if (id && /^[\w-]{11}$/.test(id)) embed = `https://www.youtube-nocookie.com/embed/${id}`;
      } else if (url.hostname === "youtu.be" && /^[\w-]{11}$/.test(url.pathname.slice(1))) {
        embed = `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
      } else if (["vimeo.com", "www.vimeo.com"].includes(url.hostname) && /^\d+$/.test(url.pathname.slice(1))) {
        embed = `https://player.vimeo.com/video/${url.pathname.slice(1)}`;
      }
      return { href: url.href, embed };
    } catch { return { href: "", embed: "" }; }
  })() : { href: "", embed: "" };
  const content = String(lesson.content || "").trim();
  const quickNoteContent = parseNoteContent(note.content);
  const quickNoteStyleJson = esc(JSON.stringify(quickNoteContent.style));
  modalRoot.innerHTML = `
    <div class="quick-drawer-backdrop" onclick="closeQuickLessonDrawer(event)"></div>
    <aside class="quick-lesson-drawer" role="dialog" aria-modal="true" aria-label="Cẩm nang và ghi chú bài học">
      <header class="quick-drawer-header"><div><span class="notes-kicker">${esc(lesson.subject_name || "3TG · BÀI HỌC")}</span><h2>${esc(lesson.title || "Cẩm nang bài học")}</h2><p>${esc(lesson.unit_title || "")}</p></div><button class="quick-drawer-close" onclick="closeQuickLessonDrawer()" aria-label="Đóng">×</button></header>
      <div class="quick-drawer-tabs"><button class="${activeTab === "guide" ? "active" : ""}" onclick="switchQuickDrawerTab('guide')">📖 Cẩm nang</button><button class="${activeTab === "note" ? "active" : ""}" onclick="switchQuickDrawerTab('note')">✏️ Ghi chú nhanh</button></div>
      ${!detail ? '<div class="loading-shell">Đang tải nội dung bài học…</div>' : activeTab === "guide" ? `
        <div class="quick-guide-content">${video.embed ? `<iframe class="quick-video-frame" src="${esc(video.embed)}" title="Video bài học: ${esc(lesson.title || "3TG")}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>` : ""}${video.href ? `<a class="quick-video-link" href="${esc(video.href)}" target="_blank" rel="noopener noreferrer">▶ Mở video bài học ↗</a>` : ""}${content ? `<div class="quick-lesson-text">${esc(content).replace(/\n/g, "<br>")}</div>` : '<div class="notes-empty compact"><div>📚</div><h3>Nội dung đang được cập nhật</h3><p>Bạn có thể xem video nếu bài học có liên kết hoặc ghi chú lại phần giảng trên lớp.</p></div>'}</div>` : `
        <div class="quick-note-editor note-editor note-paper-${quickNoteContent.style.paper} note-font-${quickNoteContent.style.font}" data-note-style="${quickNoteStyleJson}" data-note-id="${esc(note.id || note._tempId)}" data-note-subject="${esc(note.subject_id || lesson.subject_id || "")}" data-note-lesson="${Number(lesson.id)}">
          <div class="quick-note-autosave"><span class="note-save-state">${note.id ? "Đã lưu tự động" : "Tự lưu sau 500ms"}</span><span>📌 ${esc(lesson.subject_name || "Môn học")}</span><button type="button" class="note-save-btn" data-note-save onclick="saveNoteNow(this)">💾 Lưu ghi chú</button></div>
          <input class="note-title-input" data-note-field="title" maxlength="160" value="${esc(note.title || lesson.title || "Ghi chú bài học")}" oninput="queueNoteSave(this)" aria-label="Tiêu đề ghi chú">
          ${renderNoteStyleBar(quickNoteContent.style)}
          ${renderNoteFormatBar()}
          ${renderNoteDrawingPanel()}
          <div class="quick-note-textarea" data-note-field="content" contenteditable="true" role="textbox" aria-multiline="true" data-placeholder="Ghi lại ý chính, câu hỏi hoặc mẹo làm bài…" oninput="queueNoteSave(this)" onpaste="pasteNotePlainText(event)">${noteBodyHtml(quickNoteContent)}</div>
          ${renderNoteDrawingPreview(quickNoteContent.style)}
        </div>`}
    </aside>`;
}

window.openQuickLessonDrawer = async function(lessonId, tab = "guide") {
  if (!lessonId) return;
  state.activeQuickLessonId = Number(lessonId);
  state.quickDrawerTab = tab;
  state.quickLessonData = null;
  state.quickNote = null;
  modalRoot.classList.add("drawer-modal-root");
  renderQuickLessonDrawer();
  try {
    const [detail, notesResult] = await Promise.all([api(`/api/lessons/${Number(lessonId)}`), api(`/api/notes?lessonId=${Number(lessonId)}`)]);
    if (state.activeQuickLessonId !== Number(lessonId) || !modalRoot.classList.contains("drawer-modal-root")) return;
    state.quickLessonData = detail;
    state.quickNote = (notesResult.notes || []).find(note => Number(note.lesson_id) === Number(lessonId)) || {
      id: null, _tempId: "quick-" + lessonId, title: detail.lesson.title, content: "",
      subject_id: detail.lesson.subject_id, lesson_id: detail.lesson.id
    };
    renderQuickLessonDrawer();
  } catch (err) {
    if (state.activeQuickLessonId !== Number(lessonId)) return;
    modalRoot.innerHTML = `<div class="quick-drawer-backdrop" onclick="closeQuickLessonDrawer(event)"></div><aside class="quick-lesson-drawer"><button class="quick-drawer-close" onclick="closeQuickLessonDrawer()">×</button><div class="notes-empty"><div>🌷</div><h2>Chưa mở được cẩm nang</h2><p>${esc(err.message)}</p></div></aside>`;
  }
};

async function flushQuickNote() {
  const editor = modalRoot.querySelector(".quick-note-editor");
  if (!editor) return;
  const key = editor.dataset.noteId;
  const timers = state.noteSaveTimers;
  if (timers.has(key)) {
    clearTimeout(timers.get(key));
    timers.delete(key);
    await persistNoteEditor(editor, key);
  } else if (editor._noteSaving) {
    try { await editor._noteSaving; } catch {}
  }
}

window.switchQuickDrawerTab = async function(tab) {
  if (state.quickDrawerTab === "note" && tab !== "note") await flushQuickNote();
  state.quickDrawerTab = tab === "note" ? "note" : "guide";
  renderQuickLessonDrawer();
};

window.closeQuickLessonDrawer = async function(event) {
  if (event && event.target !== event.currentTarget) return;
  await flushQuickNote();
  state.activeQuickLessonId = null;
  modalRoot.innerHTML = "";
  modalRoot.classList.remove("drawer-modal-root");
};

// ========================================================
// COURSES GRID (10 MÔN HỌC THỰC TẾ)
// ========================================================
function renderCourses() {
  const subjects = (state.overview && state.overview.subjects) || state.subjects || [];
  const query = state.search.trim().toLowerCase();
  const filtered = subjects.filter(s => s.subject_name.toLowerCase().includes(query));

  const cardsHtml = filtered.map(subject => {
    const progress = Number(subject.progress_percent) || 0;
    const lessons = Number(subject.lesson_count) || 0;
    const units = Number(subject.unit_count) || 0;
    const isCurrent = Number(subject.id) === Number(state.currentSubjectId);

    return `
      <div class="course-tile" data-subject="${Number(subject.id)}">
        <div class="course-tile-top">
          <span class="course-tile-icon">${subjectIcon(subject)}</span>
          <span class="course-tile-pill">${progress}% Hoàn thành</span>
        </div>
        <h3 class="course-tile-name">${esc(subject.subject_name)}</h3>
        <div class="course-tile-meta">
          <span>🏰 ${units} Cửa ải</span>
          <span>✦ ${lessons} Bài học</span>
        </div>
        <div class="course-progress-track">
          <div class="course-progress-fill" style="width:${progress}%;"></div>
        </div>
        <button class="btn-duo ${isCurrent ? 'btn-duo-pink' : 'btn-duo-white'}" style="width:100%; padding:10px;" data-subject="${Number(subject.id)}">
          ${isCurrent ? 'Đang học ➔' : 'Vào học ngay'}
        </button>
      </div>
    `;
  }).join("");

  return `
    <div>
      <div class="banner-with-mascot">
        <div>
          <h1 class="page-title" style="margin-bottom:6px;">Khám phá 10 Môn học</h1>
          <p class="page-subtitle" style="margin:0 0 14px 0;">Dữ liệu thực tế từ Cloudflare D1 với hơn 4.000 bài học và 29.000 câu hỏi</p>
          <input type="search" id="course-search-input" placeholder="🔍 Tìm kiếm môn học..." value="${esc(state.search)}"
            style="padding:10px 16px; border-radius:14px; border:2px solid var(--lumi-pink-border); font-weight:700; width:280px; max-width:100%;"
            oninput="state.search = this.value; render();" />
        </div>
        <div class="banner-mascot-aside page-inline-mascot">
          ${renderThoBayMau({ state: THO_STATES.CLOUD_FLOAT, size: 126, speech: "Chọn môn bạn muốn khám phá nha!", speechDirection: "top" })}
        </div>
      </div>
      <div class="courses-grid">
        ${cardsHtml || '<div class="empty-state">Không tìm thấy môn học nào.</div>'}
      </div>
    </div>
  `;
}

// ========================================================
// LEADERBOARD (BẢNG XẾP HẠNG - 100% REAL USERS)
// ========================================================
let leaderboardData = null;
async function fetchLeaderboard() {
  try {
    leaderboardData = await api("/api/leaderboard");
    render();
  } catch (err) {
    showToast(err.message, true);
  }
}

function renderLeaderboard() {
  if (!leaderboardData) {
    fetchLeaderboard();
    return `<div class="loading-shell"><span class="loading-flower">✿</span><span>Đang tải bảng xếp hạng...</span></div>`;
  }

  const rows = leaderboardData.rows || [];

  const rowsHtml = rows.map((row) => {
    const isMe = row.isMe;
    const medal = row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : `${row.rank}`;
    const avatarHtml = row.avatar_url
      ? `<img src="${esc(row.avatar_url)}" alt="">`
      : Array.from(row.full_name || "L")[0] || "L";

    return `
      <div class="leader-row ${isMe ? 'me' : ''}">
        <span class="leader-rank">${medal}</span>
        <span class="avatar avatar-small" style="font-size:14px;">${avatarHtml}</span>
        <span class="leader-name">
          ${esc(row.full_name)} ${isMe ? '<strong style="color:var(--lumi-pink);">(Bạn)</strong>' : ''}
        </span>
        <span class="leader-xp">${row.weekly_xp} XP</span>
      </div>
    `;
  }).join("");

  return `
    <div class="leaderboard-wrap">
      <div class="league-banner" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div style="flex:1; min-width:260px;">
          <span style="font-size:42px;">🏆</span>
          <h1 style="font-size:26px; font-weight:900; margin-top:8px;">Giải đấu Đồng (Bronze League)</h1>
          <p style="font-size:14px; opacity:0.95; margin-top:4px;">
            Bảng xếp hạng tuần từ Cloudflare D1. Tích lũy XP qua các bài học để dẫn đầu bảng xếp hạng!
          </p>
        </div>
        <div class="banner-mascot-aside page-inline-mascot">
          ${renderThoBayMau({ state: THO_STATES.KING_CHAMPION, size: 132, speech: "Tích XP rồi leo hạng thôi!", speechDirection: "top" })}
        </div>
      </div>

      <div class="leader-list">
        ${rowsHtml || `
          <div class="empty-state" style="background:#fff; border:2px dashed var(--lumi-pink-border); border-radius:20px; padding:32px;">
            <span style="font-size:42px;">✨</span>
            <h3 style="font-weight:900; color:var(--ink-900); margin-top:8px;">Chưa có học viên nào trong giải tuần này!</h3>
            <p style="font-size:14px; color:var(--ink-500); margin-top:4px;">
              Hãy hoàn thành bài học ngay bây giờ để trở thành người đầu tiên dẫn đầu bảng xếp hạng 🥇
            </p>
          </div>
        `}
      </div>
    </div>
  `;
}

// ========================================================
// SHOP (CỬA HÀNG ĐÁ QUÝ)
// ========================================================
let shopData = null;
async function fetchShop() {
  try {
    shopData = await api("/api/shop");
    render();
  } catch (err) {
    showToast(err.message, true);
  }
}

function renderShop() {
  if (!shopData) {
    fetchShop();
    return `<div class="loading-shell"><span class="loading-flower">✿</span><span>Đang tải cửa hàng...</span></div>`;
  }

  const items = shopData.items || [];
  const icons = { streak_freeze: "🧊", refill_hearts: "❤️", xp_boost: "⚡" };

  const itemsHtml = items.map(item => {
    const isHearts = item.item_code === "refill_hearts";
    const displayName = isHearts ? "Trái Tim Vô Hạn (Vĩnh viễn)" : item.name;
    const displayDesc = isHearts ? "Đặc quyền VIP: Bạn đang sở hữu Vô Hạn Tim (∞) vĩnh viễn, không bao giờ bị trừ tim khi trả lời sai!" : item.description;
    const buyButton = isHearts
      ? `<button class="btn-duo btn-duo-green" style="padding:8px 16px; opacity:0.95; cursor:default;" disabled>✓ Đã sở hữu (∞)</button>`
      : `<button class="btn-duo btn-duo-pink" style="padding:8px 20px;" onclick="buyItem('${esc(item.item_code)}')">Mua</button>`;

    return `
      <div class="shop-card">
        <div class="shop-card-top">
          <span class="shop-icon">${icons[item.item_code] || "🎁"}</span>
          <div>
            <h3 class="shop-item-name">${esc(displayName)}</h3>
            <span class="shop-owned-count">${isHearts ? "Trạng thái: Vĩnh viễn (∞)" : `Đang sở hữu: ${item.owned}`}</span>
          </div>
        </div>
        <p class="shop-item-desc">${esc(displayDesc)}</p>
        <div class="shop-card-foot">
          <span class="shop-price-tag">${isHearts ? "Miễn phí" : `💎 ${item.price_gems}`}</span>
          ${buyButton}
        </div>
      </div>
    `;
  }).join("");

  return `
    <div>
      <div class="banner-with-mascot">
        <div>
          <h1 class="page-title" style="margin-bottom:6px;">Tiệm Tạp Hóa 3TG 🏪</h1>
          <p class="page-subtitle" style="margin:0 0 12px 0;">Dùng Đá quý 💎 tích lũy từ các bài học để sắm vật phẩm bảo vệ chuỗi học!</p>
          <div class="top-stat top-gems" style="font-size:18px; display:inline-flex;">
            <span>💎</span> <b>${state.stats.gems || 0}</b> Đá quý hiện có
          </div>
        </div>
        <div class="banner-mascot-aside page-inline-mascot">
          ${renderThoBayMau({ state: THO_STATES.GEM_RICH, size: 126, speech: "Đổi đá quý lấy món xịn nào!", speechDirection: "top" })}
        </div>
      </div>
      <div class="shop-grid">
        ${itemsHtml}
      </div>
    </div>
  `;
}

window.buyItem = async function(itemCode) {
  try {
    playSound("click");
    const res = await api("/api/shop/buy", {
      method: "POST",
      body: { itemCode }
    });
    showToast(res.message);
    state.stats = res.stats;
    shopData = res.shop;
    playSound("correct");
    updateShell();
    render();
  } catch (err) {
    playSound("wrong");
    showToast(err.message, true);
  }
};

// ========================================================
// ACHIEVEMENTS (THÀNH TÍCH HUY HIỆU)
// ========================================================
let achievementsData = null;
async function fetchAchievements() {
  try {
    achievementsData = await api("/api/achievements");
    render();
  } catch (err) {
    showToast(err.message, true);
  }
}

function renderAchievements() {
  if (!achievementsData) {
    fetchAchievements();
    return `<div class="loading-shell"><span class="loading-flower">✿</span><span>Đang tải thành tích...</span></div>`;
  }

  const items = achievementsData.achievements || [];
  const badges = ["🌟", "🔥", "⚡", "👑", "🎯", "💎", "🏆", "🎓", "🚀", "🪐"];

  const itemsHtml = items.map((item, idx) => {
    const badge = badges[idx % badges.length];
    const progress = Math.min(100, Math.round((item.current_value / item.required_value) * 100));

    return `
      <div class="achievement-card ${item.unlocked ? 'unlocked' : ''}">
        <span class="achievement-badge">${badge}</span>
        <div class="achievement-info">
          <h3 class="achievement-title">${esc(item.title)} ${item.unlocked ? '✓' : ''}</h3>
          <p class="achievement-desc">${esc(item.description)}</p>
          <div class="achievement-progress-bar">
            <div class="achievement-progress-fill" style="width:${progress}%;"></div>
          </div>
          <small style="font-size:12px; font-weight:800; color:var(--ink-500); margin-top:4px; display:block;">
            ${item.unlocked ? 'Đã hoàn thành! (+10 💎)' : `${item.current_value} / ${item.required_value}`}
          </small>
        </div>
      </div>
    `;
  }).join("");

  return `
    <div>
      <div class="banner-with-mascot">
        <div>
          <h1 class="page-title" style="margin-bottom:6px;">Huy hiệu Thành tích 🎖️</h1>
          <p class="page-subtitle" style="margin:0;">Mỗi cột mốc hoàn thành sẽ thưởng thêm Đá quý 💎 để mua sắm trong Cửa hàng.</p>
        </div>
        <div class="banner-mascot-aside page-inline-mascot">
          ${renderThoBayMau({ state: THO_STATES.SWORD_MASTER, size: 126, speech: "Thêm một huy hiệu sắp mở khóa!", speechDirection: "top" })}
        </div>
      </div>
      <div class="achievements-grid">
        ${itemsHtml}
      </div>
    </div>
  `;
}

// ========================================================
// REVIEW / ÔN CÂU SAI
// ========================================================
async function fetchReview() {
  try {
    const res = await api("/api/review");
    state.reviewMistakes = res.mistakes || [];
    render();
  } catch (err) {
    showToast(err.message, true);
  }
}

function renderReview() {
  const mistakes = state.reviewMistakes || [];

  if (state.reviewPracticeActive && mistakes.length > 0) {
    const cur = mistakes[state.reviewCurrentIndex];
    if (!cur) {
      state.reviewPracticeActive = false;
      return renderReview();
    }
    return `
      <div style="max-width:640px; margin:30px auto; display:flex; flex-direction:column; gap:20px;">
        <div class="page-inline-mascot" style="display:flex; justify-content:flex-end;">
          ${renderThoBayMau({ state: THO_STATES.DETECTIVE_FIX, size: 100, speech: "Mình cùng gỡ từng câu nhé!", speechDirection: "left" })}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <button type="button" class="btn-duo btn-duo-white" onclick="stopReview()">✕ Dừng ôn tập</button>
          <span style="font-weight:800; color:var(--lumi-pink);">Câu ${state.reviewCurrentIndex + 1} / ${mistakes.length}</span>
        </div>
        <div style="background:#fff; border:2px solid var(--lumi-pink-border); border-radius:24px; padding:32px; box-shadow:0 8px 24px rgba(255, 75, 130, 0.08);">
          <span style="font-size:13px; font-weight:900; color:var(--lumi-pink); text-transform:uppercase;">${esc(cur.subject_name)} • ${esc(cur.lesson_title)}</span>
          <h2 style="font-size:22px; font-weight:900; color:var(--ink-900); margin-top:10px; line-height:1.4;">${esc(cur.question_text)}</h2>
          <div style="display:flex; gap:12px; margin-top:32px;">
            <button class="btn-duo btn-duo-pink" style="flex:1;" onclick="solveMistakeCurrent(${Number(cur.id)}, true)">
              ✓ Đã nhớ & Làm đúng (+5 XP ⭐)
            </button>
            <button class="btn-duo btn-duo-white" style="flex:1;" onclick="solveMistakeCurrent(${Number(cur.id)}, false)">
              Cần ôn lại thêm
            </button>
          </div>
        </div>
      </div>
    `;
  }

  const itemsHtml = mistakes.map(m => {
    return `
      <div class="leader-row" style="padding:18px 24px;">
        <div style="flex:1;">
          <small style="font-weight:900; color:var(--lumi-pink);">${esc(m.subject_name)}</small>
          <h4 style="font-size:16px; font-weight:800; color:var(--ink-900); margin-top:4px;">${esc(m.question_text)}</h4>
          <span style="font-size:12px; color:var(--ink-500); margin-top:4px; display:block;">Đã sai ${m.wrong_count} lần</span>
        </div>
      </div>
    `;
  }).join("");

  return `
    <div style="max-width:760px; margin:0 auto;">
      <div class="banner-with-mascot">
        <div>
          <h1 class="page-title" style="margin-bottom:6px;">Ôn tập Câu sai 🎯</h1>
          <p class="page-subtitle" style="margin:0 0 12px 0;">Khắc phục các câu đã làm sai để củng cố kiến thức và tích lũy thêm XP ⭐</p>
          ${mistakes.length ? `
            <button type="button" class="btn-duo btn-duo-pink" onclick="startReview()">
              Luyện tập ngay (${mistakes.length} câu) 🎯
            </button>
          ` : ''}
        </div>
        <div class="banner-mascot-aside page-inline-mascot">
          ${renderThoBayMau({ state: THO_STATES.DETECTIVE_FIX, size: 126, speech: "Ôn lại là nhớ lâu hơn đó!", speechDirection: "top" })}
        </div>
      </div>
      <div>
        ${itemsHtml || `
          <div class="empty-state" style="background:#fff; border:2px dashed var(--lumi-pink-border); border-radius:24px; padding:48px 24px; text-align:center;">
            <span style="font-size:54px;">🎉</span>
            <h3 style="font-weight:900; color:var(--ink-900); margin-top:12px;">Tuyệt vời! Bạn không có câu sai nào!</h3>
            <p style="font-size:15px; color:var(--ink-500); margin-top:4px;">Tiếp tục học bài mới để giữ vững phong độ nhé!</p>
          </div>
        `}
      </div>
    </div>
  `;
}

window.solveMistakeCurrent = async function(mistakeId, isCorrect) {
  try {
    playSound(isCorrect ? "correct" : "click");
    const res = await api("/api/review/solve", {
      method: "POST",
      body: { mistakeId, isCorrect }
    });
    state.stats = res.stats;
    updateShell();
    if (state.reviewCurrentIndex + 1 < state.reviewMistakes.length) {
      state.reviewCurrentIndex++;
    } else {
      state.reviewPracticeActive = false;
      showToast("Đã hoàn thành buổi ôn tập câu sai!");
      fetchReview();
    }
    render();
  } catch (err) {
    showToast(err.message, true);
  }
};

// ========================================================
// QUIZ ENGINE (INTERACTIVE WITH REAL QUESTIONS FROM D1)
// ========================================================
async function openLesson(lessonId) {
  if (state.stats.hearts <= 0) {
    showModal(`
      <div class="modal-dialog" style="text-align:center;">
        <span class="modal-close" onclick="closeModal()">✕</span>
        <span style="font-size:54px;">💔</span>
        <h2 style="font-size:22px; font-weight:900; color:var(--ink-900);">Bạn đã hết Trái tim!</h2>
        <p style="font-size:15px; color:var(--ink-700); margin:10px 0 20px;">
          Hãy vào Cửa hàng dùng Đá quý để hồi phục Tim, hoặc vào mục "Ôn câu sai" để nhận thêm Tim nhé!
        </p>
        <button type="button" class="btn-duo btn-duo-pink" style="width:100%;" onclick="goToShop()">
          Vào Cửa hàng 🏪
        </button>
      </div>
    `);
    return;
  }

  try {
    playSound("click");
    const data = await api(`/api/lessons/${Number(lessonId)}`);
    if (!data.questions || !data.questions.length) {
      showToast("Bài học này đang được chuẩn bị câu hỏi. Bạn thử bài khác nhé!", true);
      return;
    }
    state.lesson = data;
    state.questionIndex = 0;
    state.selectedOption = "";
    state.checkedAnswer = null;
    state.checkingAnswer = false;
    state.submittingLesson = false;
    state.answers = [];
    state.finish = null;
    render();
  } catch (err) {
    showToast(err.message, true);
  }
}

function renderLessonQuiz() {
  if (!state.lesson) return "";
  if (state.finish) return renderLessonFinish();

  const questions = state.lesson.questions;
  const question = questions[state.questionIndex];
  if (!question) return "";

  const progress = Math.round((state.questionIndex / questions.length) * 100);
  const checked = state.checkedAnswer;
  const options = question.options || [];

  const optionsHtml = options.map((opt, idx) => {
    const isSelected = state.selectedOption === opt.key;
    const isCorrectOption = checked && checked.correctAnswer === opt.key;
    const isWrongSelection = checked && isSelected && !checked.isCorrect;

    let extraClass = isSelected ? "selected" : "";
    let inlineStyle = "";
    if (checked) {
      if (isCorrectOption) {
        extraClass = "selected";
        inlineStyle = 'style="border-color:var(--feedback-green); background:var(--feedback-green-light); color:var(--feedback-green-text);"';
      } else if (isWrongSelection) {
        extraClass = "selected";
        inlineStyle = 'style="border-color:var(--duo-red); background:var(--duo-red-light); color:var(--duo-red-dark);"';
      }
    }

    return `
      <button class="quiz-choice-btn ${extraClass}" data-choice-key="${esc(opt.key)}" aria-pressed="${isSelected ? "true" : "false"}" ${inlineStyle} onclick="selectChoice('${esc(opt.key)}')" ${checked || state.checkingAnswer ? 'disabled' : ''}>
        <span class="quiz-key-pill">${idx + 1}</span>
        <span class="quiz-choice-text">${esc(opt.text || opt.key)}</span>
      </button>
    `;
  }).join("");

  let footerStatusClass = "";
  let feedbackHtml = `
    <button id="quiz-check-btn" class="btn-duo btn-duo-pink" style="min-width:180px;" onclick="checkAnswer()" ${!state.selectedOption || state.checkingAnswer ? 'disabled' : ''}>
      ${state.checkingAnswer ? '<span class="quiz-spinner" aria-hidden="true"></span> Đang kiểm tra…' : 'Kiểm tra'}
    </button>
  `;

  if (checked) {
    if (checked.isCorrect) {
      footerStatusClass = "status-correct";
      feedbackHtml = `
        <div class="quiz-feedback-box">
          <span class="feedback-icon-badge">✓</span>
          <div class="feedback-text">
            <span class="feedback-headline">Chính xác! Làm rất tốt!</span>
            <span class="feedback-explanation">${esc(checked.explanation || "Tiếp tục giữ vững phong độ nhé!")}</span>
          </div>
        </div>
        <button id="quiz-next-btn" class="btn-duo btn-duo-pink" style="min-width:180px;" onclick="nextQuestion()" ${state.submittingLesson ? "disabled" : ""}>
          ${state.submittingLesson ? '<span class="quiz-spinner" aria-hidden="true"></span> Đang lưu kết quả…' : 'Tiếp tục ➔'}
        </button>
      `;
    } else {
      footerStatusClass = "status-wrong";
      feedbackHtml = `
        <div class="quiz-feedback-box">
          <span class="feedback-icon-badge">✕</span>
          <div class="feedback-text">
            <span class="feedback-headline">Chưa chính xác rồi!</span>
            <span class="feedback-explanation">Đáp án đúng là: <strong>${esc(checked.correctAnswer)}</strong>. ${esc(checked.explanation || "")}</span>
          </div>
        </div>
        <button id="quiz-next-btn" class="btn-duo btn-duo-red" style="min-width:180px;" onclick="nextQuestion()" ${state.submittingLesson ? "disabled" : ""}>
          ${state.submittingLesson ? '<span class="quiz-spinner" aria-hidden="true"></span> Đang lưu kết quả…' : 'Đã hiểu ➔'}
        </button>
      `;
    }
  }

  let mascotState = "idle";
  if (checked) {
    mascotState = checked.isCorrect ? "correct" : "wrong";
  } else if (state.selectedOption) {
    mascotState = "thinking";
  }

  return `
    <div class="quiz-overlay">
      <div class="quiz-header">
        <span class="quiz-close-btn" onclick="confirmQuitQuiz()">✕</span>
        <div class="quiz-progress-track">
          <div class="quiz-progress-fill" style="width:${progress}%;"></div>
        </div>
        <div class="quiz-hearts-box" title="Vô hạn tim vĩnh viễn (∞)">
          <span class="quiz-heart-icon">❤️</span>
          <span style="font-size:20px; font-weight:900; line-height:1;">∞</span>
        </div>
      </div>

      <div class="quiz-body">
        <div class="quiz-mascot-row" style="align-items:flex-end; gap:16px;">
          <div style="flex-shrink:0;">
            ${generateThoBayMauSvg({ state: mascotState, size: 140 })}
          </div>
          <div class="quiz-bubble">
            <div class="quiz-prompt">${esc(question.question_text)}</div>
          </div>
        </div>
        <div class="quiz-options-grid">
          ${optionsHtml}
        </div>
      </div>

      <div class="quiz-footer ${footerStatusClass}">
        ${feedbackHtml}
      </div>
    </div>
  `;
}

window.selectChoice = function(key) {
  if (state.checkedAnswer || state.checkingAnswer) return;
  playSound("click");
  state.selectedOption = key;
  view.querySelectorAll(".quiz-choice-btn[data-choice-key]").forEach(function (button) {
    const selected = button.dataset.choiceKey === String(key);
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });
  view.querySelector(".quiz-mascot-row")?.classList.add("has-selection");
  const checkButton = document.getElementById("quiz-check-btn");
  if (checkButton) checkButton.disabled = false;
};

window.checkAnswer = async function() {
  if (!state.selectedOption || state.checkedAnswer || state.checkingAnswer) return;
  const question = state.lesson.questions[state.questionIndex];
  state.checkingAnswer = true;
  view.querySelectorAll(".quiz-choice-btn").forEach(button => { button.disabled = true; });
  const checkButton = document.getElementById("quiz-check-btn");
  if (checkButton) {
    checkButton.disabled = true;
    checkButton.setAttribute("aria-busy", "true");
    checkButton.innerHTML = '<span class="quiz-spinner" aria-hidden="true"></span> Đang kiểm tra…';
  }
  try {
    const res = await api(`/api/lessons/${state.lesson.lesson.id}/check`, {
      method: "POST",
      body: { questionId: question.id, selected: state.selectedOption }
    });
    state.checkedAnswer = res;
    state.checkingAnswer = false;
    state.answers.push({ questionId: question.id, selected: state.selectedOption, isCorrect: res.isCorrect });
    if (res.isCorrect) {
      playSound("correct");
    } else {
      playSound("wrong");
      // Vô hạn tim vĩnh viễn: không bao giờ trừ tim!
      state.stats.hearts = 999;
      updateShell();
    }
    render();
  } catch (err) {
    state.checkingAnswer = false;
    view.querySelectorAll(".quiz-choice-btn").forEach(button => { button.disabled = false; });
    if (checkButton) {
      checkButton.disabled = !state.selectedOption;
      checkButton.removeAttribute("aria-busy");
      checkButton.textContent = "Kiểm tra";
    }
    showToast(err.message, true);
  }
};

window.nextQuestion = async function() {
  if (state.checkingAnswer || state.submittingLesson) return;
  playSound("click");
  if (state.questionIndex + 1 < state.lesson.questions.length) {
    state.questionIndex++;
    state.selectedOption = "";
    state.checkedAnswer = null;
    state.checkingAnswer = false;
    state.submittingLesson = false;
    render();
  } else {
    state.submittingLesson = true;
    const nextButton = document.getElementById("quiz-next-btn");
    if (nextButton) {
      nextButton.disabled = true;
      nextButton.setAttribute("aria-busy", "true");
      nextButton.innerHTML = '<span class="quiz-spinner" aria-hidden="true"></span> Đang lưu kết quả…';
    }
    try {
      const finishRes = await api(`/api/lessons/${state.lesson.lesson.id}/submit`, {
        method: "POST",
        body: { answers: state.answers }
      });
      playSound("fanfare");
      state.finish = finishRes;
      state.submittingLesson = false;
      state.stats = finishRes.stats;
      updateShell();
      api(`/api/subjects/${state.currentSubjectId}`).then(d => { state.subjectDetail = d; });
      api("/api/overview").then(o => { state.overview = o; });
      render();
    } catch (err) {
      state.submittingLesson = false;
      if (nextButton) {
        nextButton.disabled = false;
        nextButton.removeAttribute("aria-busy");
        nextButton.textContent = state.checkedAnswer?.isCorrect ? "Tiếp tục ➔" : "Đã hiểu ➔";
      }
      showToast(err.message, true);
    }
  }
};

function renderLessonFinish() {
  const f = state.finish;
  return `
    <div class="quiz-overlay" style="overflow-y:auto;">
      <div class="finish-card" style="display:flex; flex-direction:column; align-items:center;">
        <div style="margin-bottom:12px;">
          ${renderThoBayMau({ state: "floating", size: 190, speech: "Tuyệt đỉnh! Bạn đã hoàn thành xuất sắc bài học này! ☁️✨" })}
        </div>
        <h1 class="finish-title">Hoàn thành bài học xuất sắc!</h1>
        <p style="font-size:16px; color:var(--ink-500); margin-top:-6px;">Bạn đã hoàn thành tất cả các câu hỏi của bài học này.</p>
        <div class="finish-stat-row">
          <div class="finish-stat-box">
            <span class="finish-stat-label">ĐIỂM SỐ</span>
            <span class="finish-stat-val" style="color:var(--lumi-pink);">${f.score}%</span>
          </div>
          <div class="finish-stat-box">
            <span class="finish-stat-label">KINH NGHIỆM</span>
            <span class="finish-stat-val" style="color:var(--duo-gold-dark);">+${f.xpAwarded} XP</span>
          </div>
          <div class="finish-stat-box">
            <span class="finish-stat-label">ĐÁ QUÝ</span>
            <span class="finish-stat-val" style="color:var(--duo-blue-dark);">+${f.gemsAwarded} 💎</span>
          </div>
        </div>
        <button class="btn-duo btn-duo-pink" style="width:100%; padding:15px;" onclick="closeQuiz()">
          Tiếp tục lộ trình học ➔
        </button>
      </div>
    </div>
  `;
}

window.confirmQuitQuiz = function() {
  showModal(`
    <div class="modal-dialog" style="text-align:center;">
      <span class="modal-close" onclick="closeModal()">✕</span>
      <span style="font-size:54px;">⚠️</span>
      <h2 style="font-size:22px; font-weight:900; color:var(--ink-900);">Bạn có chắc muốn rời đi?</h2>
      <p style="font-size:15px; color:var(--ink-700); margin:10px 0 20px;">
        Tiến trình chưa hoàn thành của bài học này sẽ không được lưu.
      </p>
      <div style="display:flex; gap:12px;">
        <button class="btn-duo btn-duo-white" style="flex:1;" onclick="closeModal()">Ở lại học</button>
        <button class="btn-duo btn-duo-red" style="flex:1;" onclick="closeModal(); closeQuiz();">Thoát ra</button>
      </div>
    </div>
  `);
};

window.closeQuiz = function() {
  state.lesson = null;
  state.finish = null;
  updateShell();
  render();
};

// ========================================================
// FORMAT CHAT TEXT: MARKDOWN & MATH/LOGIC SYMBOLS
// ========================================================
function formatChatText(text) {
  if (!text) return "";
  let html = esc(text);

  // Bold **...**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="chat-strong">$1</strong>');
  // Italic *...*
  html = html.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');

  // Math & logic formulas: wrap in .math-token for crisp monospace & pink badge styling
  html = html.replace(/(?:¬[pqr]|[pqr]\s*(?:→|↔|∧|∨)\s*[pqr]|NOT\s*\([^)]+\)|AND\s*\([^)]+\)|OR\s*\([^)]+\)|[pqr]\s*đúng\s*→\s*¬[pqr]\s*sai|[pqr]\s*đúng|[pqr]\s*sai)/gi, function(match) {
    return '<span class="math-token">' + match + '</span>';
  });

  const lines = html.split("\n");
  const result = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Numbered list items
    const numMatch = line.match(/^(?:<strong[^>]*>)?(\d+)[\.\)](?:<\/strong>)?\s*(.*)$/);
    if (numMatch) {
      result.push('<div class="chat-list-row"><span class="chat-list-num">' + numMatch[1] + '.</span><div class="chat-list-content">' + numMatch[2] + '</div></div>');
      continue;
    }

    // Bullet points
    const bulletMatch = line.match(/^[-•*]\s+(.*)$/);
    if (bulletMatch) {
      result.push('<div class="chat-bullet-row"><span class="chat-bullet-dot">✦</span><div>' + bulletMatch[1] + '</div></div>');
      continue;
    }

    result.push('<div class="chat-para">' + line + '</div>');
  }

  return result.join("");
}

window.toggleChatDropdown = function(e) {
  if (e) e.stopPropagation();
  playSound("click");
  state.isChatDropdownOpen = !state.isChatDropdownOpen;
  render();
};

window.selectChatSubject = function(subId) {
  playSound("click");
  state.chatSubjectId = subId === "free" ? "free" : Number(subId);
  state.isChatDropdownOpen = false;
  render();
};

// Global click-outside to close chat dropdown
document.addEventListener("click", function(e) {
  if (state.isChatDropdownOpen && !e.target.closest("#chat-dropdown-wrap")) {
    state.isChatDropdownOpen = false;
    render();
  }
});

// ========================================================
// CHAT / LUMI AI
// ========================================================
function renderChat() {
  const isFreeMode = state.chatSubjectId === "free";
  const currentSub = isFreeMode ? null : (state.subjects.find(s => Number(s.id) === Number(state.chatSubjectId || state.currentSubjectId)) || state.subjects[0]);
  const currentSubjectLabel = isFreeMode ? "AI tự do · mọi môn" : (currentSub?.subject_name || "Chọn môn học");
  const currentSubjectIcon = isFreeMode ? "✨" : subjectIcon(currentSub);
  const conversationOptions = `<option value="">Cuộc trò chuyện mới</option>` + state.chatConversations.map(item =>
    `<option value="${esc(item.id)}" ${item.id === state.chatConversationId ? "selected" : ""}>${esc(item.title || "Phiên hỏi đáp")}</option>`
  ).join("");
  const chatAttachmentsHtml = state.chatAttachments.length ? `
    <div class="chat-attachment-list" aria-label="Tệp đính kèm">
      ${state.chatAttachments.map((file, index) => `<span class="chat-attachment-chip">${file.kind === "image" ? "🖼️" : "📄"} ${esc(file.name)}<button type="button" onclick="removeChatAttachment(${index})" aria-label="Gỡ ${esc(file.name)}">×</button></span>`).join("")}
    </div>` : "";
  const chatPendingHtml = state.chatPendingFiles.length ? `
    <div class="chat-attachment-list" role="status" aria-live="polite">
      ${state.chatPendingFiles.map(file => `<span class="chat-attachment-chip pending"><span class="chat-file-spinner" aria-hidden="true"></span>Đang đọc ${esc(file.name)}</span>`).join("")}
    </div>` : "";

  const messagesHtml = state.chatMessages.map((m, idx) => `
    <div class="chat-row ${m.role === 'user' ? 'user' : 'assistant'}">
      <div id="chat-bubble-${idx}" class="chat-bubble ${m.role === 'user' ? 'user' : 'assistant'}">
        ${m.isStreaming && !m.content ? `
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="typing-indicator-wrap">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span style="font-size:13px; color:var(--lumi-pink); font-weight:800; margin-left:6px;">Thỏ Bảy Màu đang gõ phím lia lịa…</span>
            </div>
          </div>
        ` : `${formatChatText(m.content)}${m.role === 'assistant' ? `<button type="button" class="chat-save-note" onclick="saveAiReplyToNotes(${idx})">📌 Lưu vào Sổ tay</button>` : ""}`}
      </div>
    </div>
  `).join("");

  return `
    <div class="chat-container">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div>
          <h1 class="page-title">Hỏi 3TG AI ✧</h1>
          <p class="page-subtitle">Trợ giảng 3TG AI giải thích chi tiết, từng bước kèm công thức dễ hiểu</p>
        </div>

        <div class="chat-header-actions">
        <div class="chat-conversation-actions"><select aria-label="Chọn cuộc trò chuyện" onchange="loadChatConversation(this.value)">${conversationOptions}</select><button type="button" onclick="startNewChat()">＋ Mới</button></div>
        <!-- CUSTOM ANIMATED DROPDOWN FOR SUBJECT SELECTION -->
        <div class="lumi-dropdown-wrapper" id="chat-dropdown-wrap">
          <button type="button" class="lumi-dropdown-btn ${state.isChatDropdownOpen ? 'active' : ''}" onclick="toggleChatDropdown(event)">
            <span style="font-size:18px;">${currentSubjectIcon}</span>
            <span>${esc(currentSubjectLabel)}</span>
            <span class="chevron-arrow">▾</span>
          </button>
          ${state.isChatDropdownOpen ? `
            <div class="lumi-dropdown-panel">
              <div class="lumi-dropdown-item ${isFreeMode ? 'selected' : ''}" onclick="selectChatSubject('free')">
                <div class="lumi-dropdown-item-left"><span style="font-size:18px;">✨</span><span>AI tự do · mọi môn</span></div>
                ${isFreeMode ? '<span class="lumi-dropdown-check">✓</span>' : ''}
              </div>
              ${state.subjects.map(s => `
                <div class="lumi-dropdown-item ${!isFreeMode && Number(s.id) === Number(currentSub?.id) ? 'selected' : ''}" onclick="selectChatSubject(${Number(s.id)})">
                  <div class="lumi-dropdown-item-left">
                    <span style="font-size:18px;">${subjectIcon(s)}</span>
                    <span>${esc(s.subject_name)}</span>
                  </div>
                  ${!isFreeMode && Number(s.id) === Number(currentSub?.id) ? '<span class="lumi-dropdown-check">✓</span>' : ''}
                </div>
              `).join("")}
            </div>
          ` : ''}
        </div>
        </div>
      </div>

      <div class="chat-messages-area" id="chat-messages-area">
        ${messagesHtml || `
          <div style="text-align:center; padding:40px 20px; color:var(--ink-500); display:flex; flex-direction:column; align-items:center;">
            ${renderThoBayMau({
              state: THO_STATES.AI_PROFESSOR,
              size: 165,
              speech: isFreeMode
                ? "Chào bạn! Mình là Trợ giảng AI tự do. Cứ hỏi bất kỳ môn nào hoặc gửi tài liệu để mình cùng học nhé! 🎓📖"
                : `Chào bạn! Mình là Trợ giảng 3TG AI cùng Giáo sư Thỏ Bảy Màu! Bạn có thắc mắc gì về bài học môn ${esc(currentSub?.subject_name || "này")} cứ hỏi mình nhé! 🎓📖`,
              speechDirection: "top"
            })}
            <h3 style="font-weight:900; color:var(--ink-900); margin-top:14px; font-size:22px;">Trợ giảng 3TG AI luôn sẵn sàng phục vụ bạn!</h3>
            <p style="font-size:15px; margin-top:6px; color:var(--ink-700); max-width:520px;">
              ${isFreeMode ? "Hỏi đa môn, gửi ảnh hoặc tài liệu để AI đọc và hỗ trợ học." : "Giải thích từng bước, chi tiết công thức toán học và kiến thức đại học từ Cloudflare D1."}
            </p>
          </div>
        `}
      </div>

      <form class="chat-composer" onsubmit="handleSendChat(event)">
        ${chatAttachmentsHtml}
        ${chatPendingHtml}
        <div class="chat-composer-row">
          <label class="chat-attach-btn" title="Ảnh, PDF, DOCX, PPTX, XLSX hoặc tệp văn bản · tối đa 5 tệp, 10 MB mỗi tệp">📎<span>Tệp</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif,.pdf,.docx,.pptx,.xlsx,.txt,.md,.csv,.json,.log" multiple onchange="handleChatFiles(this.files)" ${state.chatBusy || state.chatPendingFiles.length ? 'disabled' : ''}></label>
          <input type="text" id="chat-input" placeholder="Hỏi AI hoặc mô tả nội dung cần đọc…" value="${esc(state.chatDraft)}" oninput="state.chatDraft=this.value" style="flex:1; padding:15px 22px; border-radius:20px; border:2px solid var(--lumi-pink-border); font-size:15px; font-weight:700;" ${state.chatBusy ? 'disabled' : ''} />
          <button type="submit" id="chat-submit-btn" class="btn-duo btn-duo-pink" style="padding:15px 30px; font-size:15px;" ${state.chatBusy || state.chatPendingFiles.length ? 'disabled' : ''}>
            ${state.chatBusy ? 'Đang gửi…' : 'Gửi ➔'}
          </button>
        </div>
        <small class="chat-file-hint">Ảnh · PDF · DOCX · PPTX · XLSX · TXT · MD · CSV · JSON</small>
      </form>
    </div>
  `;
}

const CHAT_FILE_LIMIT = 10 * 1024 * 1024;
const CHAT_TOTAL_FILE_LIMIT = 16 * 1024 * 1024;
const CHAT_TEXT_LIMIT = 52000;

function chatFileKind(file) {
  const ext = String(file.name || "").toLowerCase().split(".").pop();
  const type = String(file.type || "").toLowerCase();
  if (["image/png", "image/jpeg", "image/webp", "image/gif"].includes(type) || ["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
    const imageType = type.startsWith("image/") ? type : ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" })[ext];
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(imageType)) throw new Error("Ảnh này chưa được hỗ trợ. Hãy chọn PNG, JPG, WEBP hoặc GIF.");
    return { kind: "image", type: imageType };
  }
  if (["pdf", "docx", "pptx", "xlsx", "txt", "md", "csv", "json", "log"].includes(ext)) {
    return { kind: "document", type: type || "application/octet-stream", ext };
  }
  throw new Error(`Chưa hỗ trợ tệp .${ext || "không rõ định dạng"}. Hãy dùng ảnh, PDF, DOCX, PPTX, XLSX, TXT, MD, CSV hoặc JSON.`);
}

async function fileToBase64(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)));
  }
  return btoa(binary);
}

async function inflateZipEntry(bytes, entry) {
  if (entry.size > CHAT_FILE_LIMIT * 4) throw new Error("Tài liệu giải nén quá lớn để đọc an toàn.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const offset = entry.localOffset;
  if (view.getUint32(offset, true) !== 0x04034b50) throw new Error("Tệp tài liệu ZIP không hợp lệ.");
  const nameLength = view.getUint16(offset + 26, true);
  const extraLength = view.getUint16(offset + 28, true);
  const start = offset + 30 + nameLength + extraLength;
  const packed = bytes.subarray(start, start + entry.compressedSize);
  if (entry.method === 0) return new TextDecoder("utf-8").decode(packed);
  if (entry.method !== 8 || typeof DecompressionStream === "undefined") {
    throw new Error("Trình duyệt chưa hỗ trợ giải nén định dạng tài liệu này.");
  }
  const stream = new Blob([packed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const unpacked = new Uint8Array(await new Response(stream).arrayBuffer());
  return new TextDecoder("utf-8").decode(unpacked);
}

async function readZipTextEntries(file, namePattern) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let pos = bytes.length - 22; pos >= Math.max(0, bytes.length - 65557); pos--) {
    if (view.getUint32(pos, true) === 0x06054b50) { eocd = pos; break; }
  }
  if (eocd < 0) throw new Error("Không đọc được cấu trúc tệp Office này.");
  const count = view.getUint16(eocd + 10, true);
  let cursor = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder("utf-8");
  const entries = [];
  for (let index = 0; index < count; index++) {
    if (view.getUint32(cursor, true) !== 0x02014b50) break;
    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const size = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const nameStart = cursor + 46;
    const name = decoder.decode(bytes.subarray(nameStart, nameStart + nameLength));
    if (namePattern.test(name)) entries.push({ name, method, compressedSize, size, localOffset });
    cursor = nameStart + nameLength + extraLength + commentLength;
  }
  return await Promise.all(entries.map(async entry => ({ name: entry.name, text: await inflateZipEntry(bytes, entry) })));
}

function xmlParagraphs(xmlText, paragraphTag = "p", textTag = "t") {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  if (doc.querySelector("parsererror")) return "";
  return Array.from(doc.getElementsByTagNameNS("*", paragraphTag)).map(paragraph =>
    Array.from(paragraph.getElementsByTagNameNS("*", textTag)).map(node => node.textContent || "").join("")
  ).filter(Boolean).join("\n");
}

async function extractOfficeText(file, ext) {
  if (ext === "docx") {
    const entries = await readZipTextEntries(file, /^word\/document\.xml$/);
    return entries.map(entry => xmlParagraphs(entry.text)).join("\n");
  }
  if (ext === "pptx") {
    const entries = await readZipTextEntries(file, /^ppt\/slides\/slide\d+\.xml$/);
    entries.sort((a, b) => Number(a.name.match(/slide(\d+)/)?.[1] || 0) - Number(b.name.match(/slide(\d+)/)?.[1] || 0));
    return entries.map((entry, index) => `Trang chiếu ${index + 1}:\n${xmlParagraphs(entry.text)}`).join("\n\n");
  }
  const entries = await readZipTextEntries(file, /^(?:xl\/sharedStrings\.xml|xl\/worksheets\/sheet\d+\.xml)$/);
  const sharedEntry = entries.find(entry => entry.name === "xl/sharedStrings.xml");
  const sharedDoc = sharedEntry ? new DOMParser().parseFromString(sharedEntry.text, "application/xml") : null;
  const shared = sharedDoc ? Array.from(sharedDoc.getElementsByTagNameNS("*", "si")).map(item =>
    Array.from(item.getElementsByTagNameNS("*", "t")).map(node => node.textContent || "").join("")
  ) : [];
  return entries.filter(entry => entry.name.includes("/worksheets/"))
    .sort((a, b) => Number(a.name.match(/sheet(\d+)/)?.[1] || 0) - Number(b.name.match(/sheet(\d+)/)?.[1] || 0))
    .map((entry, index) => {
      const doc = new DOMParser().parseFromString(entry.text, "application/xml");
      const rows = Array.from(doc.getElementsByTagNameNS("*", "row")).map(row =>
        Array.from(row.getElementsByTagNameNS("*", "c")).map(cell => {
          const value = cell.getElementsByTagNameNS("*", "v")[0]?.textContent || "";
          return cell.getAttribute("t") === "s" ? (shared[Number(value)] || "") : value;
        }).join("\t")
      ).filter(Boolean);
      return `Trang tính ${index + 1}:\n${rows.join("\n")}`;
    }).join("\n\n");
}

function decodePdfString(value, isHex = false) {
  let bytes;
  if (isHex) {
    const hex = value.replace(/\s/g, "");
    const padded = hex.length % 2 ? hex + "0" : hex;
    bytes = Uint8Array.from(padded.match(/.{2}/g) || [], pair => parseInt(pair, 16));
  } else {
    const unescaped = value.replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)))
      .replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t")
      .replace(/\\b/g, "\b").replace(/\\f/g, "\f").replace(/\\([\\()])/g, "$1")
      .replace(/\\\r?\n/g, "");
    bytes = Uint8Array.from(unescaped, char => char.charCodeAt(0) & 255);
  }
  if (bytes.length > 1 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    const words = [];
    for (let i = 2; i + 1 < bytes.length; i += 2) words.push((bytes[i] << 8) | bytes[i + 1]);
    return String.fromCharCode(...words);
  }
  return new TextDecoder("windows-1252").decode(bytes);
}

function textFromPdfStream(streamText) {
  const output = [];
  for (const block of streamText.matchAll(/BT([\s\S]*?)ET/g)) {
    const body = block[1];
    const operators = /\[((?:\\.|[^\]])*)\]\s*TJ|\(((?:\\.|[^\\)])*)\)\s*Tj|<([0-9a-f\s]+)>\s*Tj/gi;
    for (const match of body.matchAll(operators)) {
      if (match[1] !== undefined) {
        for (const literal of match[1].matchAll(/\(((?:\\.|[^\\)])*)\)|<([0-9a-f\s]+)>/gi)) {
          output.push(decodePdfString(literal[1] ?? literal[2] ?? "", literal[2] !== undefined));
        }
      } else {
        output.push(decodePdfString(match[2] ?? match[3] ?? "", match[3] !== undefined));
      }
    }
    output.push("\n");
  }
  return output.join("").replace(/[\t ]+/g, " ").replace(/\n{3,}/g, "\n\n");
}

async function extractPdfText(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const raw = new TextDecoder("latin1").decode(bytes);
  const chunks = [raw];
  const streamMarkers = /stream\r?\n/g;
  let marker;
  while ((marker = streamMarkers.exec(raw)) !== null && chunks.length < 80) {
    const end = raw.indexOf("endstream", streamMarkers.lastIndex);
    if (end < 0) break;
    const dict = raw.slice(Math.max(0, marker.index - 500), marker.index);
    if (/FlateDecode/.test(dict)) {
      let start = streamMarkers.lastIndex;
      let finish = end;
      while (finish > start && (bytes[finish - 1] === 10 || bytes[finish - 1] === 13)) finish--;
      const packed = bytes.subarray(start, finish);
      try {
        const stream = new Blob([packed]).stream().pipeThrough(new DecompressionStream("deflate"));
        chunks.push(new TextDecoder("latin1").decode(new Uint8Array(await new Response(stream).arrayBuffer())));
      } catch { /* Skip non-text or unsupported compressed streams. */ }
    }
    streamMarkers.lastIndex = end + 9;
  }
  const extracted = chunks.map(textFromPdfStream).join("\n").trim();
  if (!extracted) throw new Error("PDF này chưa có lớp văn bản đọc được. Nếu là bản scan, hãy chụp hoặc xuất trang thành ảnh rồi gửi cho AI.");
  return extracted;
}

async function prepareChatFile(file) {
  if (file.size > CHAT_FILE_LIMIT) throw new Error(`Tệp “${file.name}” vượt giới hạn 10 MB.`);
  const info = chatFileKind(file);
  if (info.kind === "image") return { name: file.name, type: info.type, kind: "image", data: await fileToBase64(file), size: file.size };
  let text = "";
  if (info.ext === "pdf") text = await extractPdfText(file);
  else if (["docx", "pptx", "xlsx"].includes(info.ext)) text = await extractOfficeText(file, info.ext);
  else text = await file.text();
  text = String(text || "").replace(/\u0000/g, "").trim();
  if (!text) throw new Error(`Không tìm thấy văn bản để đọc trong “${file.name}”.`);
  return { name: file.name, type: info.type, kind: "document", text: text.slice(0, CHAT_TEXT_LIMIT), size: file.size };
}

window.handleChatFiles = async function(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  const room = 5 - state.chatAttachments.length - state.chatPendingFiles.length;
  if (files.length > room) showToast("Mỗi lượt gửi tối đa 5 tệp.", true);
  for (const file of files.slice(0, Math.max(0, room))) {
    const currentSize = state.chatAttachments.reduce((sum, item) => sum + item.size, 0) + state.chatPendingFiles.reduce((sum, item) => sum + item.size, 0);
    if (currentSize + file.size > CHAT_TOTAL_FILE_LIMIT) {
      showToast("Tổng dung lượng tệp trong một lượt tối đa 16 MB.", true);
      break;
    }
    const pending = { id: crypto.randomUUID(), name: file.name, size: file.size };
    state.chatPendingFiles.push(pending);
    render();
    try {
      const prepared = await prepareChatFile(file);
      state.chatAttachments.push(prepared);
    } catch (err) {
      showToast(err.message || `Không đọc được tệp “${file.name}”.`, true);
    } finally {
      state.chatPendingFiles = state.chatPendingFiles.filter(item => item.id !== pending.id);
      render();
    }
  }
};

window.removeChatAttachment = function(index) {
  state.chatAttachments.splice(Number(index), 1);
  render();
};

window.handleSendChat = async function(e) {
  e.preventDefault();
  const input = document.getElementById("chat-input");
  const btn = document.getElementById("chat-submit-btn");
  const msg = input ? input.value.trim() : String(state.chatDraft || "").trim();
  const attachments = state.chatAttachments.slice();
  if (state.chatPendingFiles.length) {
    showToast("Đợi AI đọc xong tệp rồi gửi nhé.", true);
    return;
  }
  if ((!msg && !attachments.length) || state.chatBusy) return;
  const prompt = msg || "Hãy đọc các tệp đính kèm, tóm tắt ý chính và giúp mình học nội dung quan trọng.";
  const visibleMessage = prompt + (attachments.length ? `\n\n📎 ${attachments.map(file => file.name).join(" · ")}` : "");
  state.chatDraft = "";
  if (input) input.value = "";
  playSound("click");
  state.chatMessages.push({ role: "user", content: visibleMessage });
  const assistantMsgIndex = state.chatMessages.length;
  state.chatMessages.push({ role: "assistant", content: "", isStreaming: true });
  state.chatBusy = true;
  state.chatAttachments = [];
  render();

  const container = document.getElementById("chat-messages-area");
  if (container) container.scrollTop = container.scrollHeight;

  try {
    const freeMode = state.chatSubjectId === "free";
    const subId = freeMode ? null : (state.chatSubjectId || state.currentSubjectId);
    const res = await api("/api/chat", {
      method: "POST",
      body: {
        message: prompt,
        subjectId: subId,
        freeMode,
        attachments: attachments.map(file => file.kind === "image"
          ? { name: file.name, type: file.type, data: file.data }
          : { name: file.name, type: file.type, text: file.text }),
        history: state.chatMessages.slice(0, -2),
        conversationId: state.chatConversationId
      }
    });
    if (res.conversationId) state.chatConversationId = res.conversationId;
    await streamAiResponse(res.reply, assistantMsgIndex);
    await loadChatConversations();
  } catch (err) {
    state.chatMessages[assistantMsgIndex] = {
      role: "assistant",
      content: "Xin lỗi, Lumi chưa kết nối được với AI lúc này: " + err.message,
      isStreaming: false
    };
    const targetBubble = document.getElementById("chat-bubble-" + assistantMsgIndex);
    if (targetBubble) targetBubble.innerHTML = formatChatText(state.chatMessages[assistantMsgIndex].content);
  } finally {
    state.chatBusy = false;
    const inputEl = document.getElementById("chat-input");
    const btnEl = document.getElementById("chat-submit-btn");
    if (inputEl) {
      inputEl.disabled = false;
      inputEl.focus();
    }
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.innerHTML = "Gửi ➔";
    }
    const attachInput = document.querySelector(".chat-attach-btn input");
    if (attachInput) attachInput.disabled = state.chatPendingFiles.length > 0;
    updateShell();
  }
};

window.startNewChat = function() {
  state.chatConversationId = null;
  state.chatMessages = [];
  state.chatDraft = "";
  render();
  document.getElementById("chat-input")?.focus();
};

window.loadChatConversation = async function(conversationId) {
  if (!conversationId) return window.startNewChat();
  try {
    const result = await api(`/api/chat/conversations/${encodeURIComponent(conversationId)}`);
    state.chatConversationId = result.conversation.id;
    state.chatMessages = (result.messages || []).map(message => ({ role: message.sender, content: message.content }));
    state.chatDraft = "";
    render();
    const container = document.getElementById("chat-messages-area");
    if (container) container.scrollTop = container.scrollHeight;
  } catch (err) {
    showToast("Không mở được cuộc trò chuyện: " + err.message, true);
  }
};

async function loadChatConversations() {
  try {
    const result = await api("/api/chat/conversations");
    state.chatConversations = result.conversations || [];
    const select = document.querySelector(".chat-conversation-actions select");
    if (select) {
      select.innerHTML = `<option value="">Cuộc trò chuyện mới</option>` + state.chatConversations.map(item =>
        `<option value="${esc(item.id)}">${esc(item.title || "Phiên hỏi đáp")}</option>`
      ).join("");
      select.value = state.chatConversationId || "";
    }
  } catch (err) {
    console.warn("Could not load AI conversation list", err);
  }
}

function streamAiResponse(fullText, msgIndex) {
  return new Promise((resolve) => {
    const words = fullText.split(" ");
    let currentWordIdx = 0;
    let accumulatedText = "";

    const timer = setInterval(() => {
      if (currentWordIdx < words.length) {
        accumulatedText += (currentWordIdx === 0 ? "" : " ") + words[currentWordIdx];
        currentWordIdx++;

        const targetBubble = document.getElementById("chat-bubble-" + msgIndex);
        const container = document.getElementById("chat-messages-area");
        if (targetBubble) {
          targetBubble.innerHTML = formatChatText(accumulatedText) + '<span class="typing-cursor"></span>';
          if (container) container.scrollTop = container.scrollHeight;
        }
      } else {
        clearInterval(timer);
        state.chatMessages[msgIndex] = {
          role: "assistant",
          content: fullText,
          isStreaming: false
        };
        const targetBubble = document.getElementById("chat-bubble-" + msgIndex);
        if (targetBubble) targetBubble.innerHTML = formatChatText(fullText) + `<button type="button" class="chat-save-note" onclick="saveAiReplyToNotes(${msgIndex})">📌 Lưu vào Sổ tay</button>`;
        resolve();
      }
    }, 18);
  });
};

window.saveAiReplyToNotes = async function(messageIndex) {
  const message = state.chatMessages[messageIndex];
  if (!message || message.role !== "assistant" || message.isStreaming || !message.content) return;
  const subjectId = state.chatSubjectId || state.currentSubjectId || null;
  const priorQuestion = state.chatMessages.slice(0, messageIndex).reverse().find(item => item.role === "user");
  const subject = state.subjects.find(item => Number(item.id) === Number(subjectId));
  const title = `3TG AI · ${subject?.subject_name || "Giải đáp"} · ${(priorQuestion?.content || "Ghi chú").slice(0, 55)}`;
  try {
    const result = await api("/api/notes", {
      method: "POST",
      body: { title, content: message.content, subjectId, lessonId: null }
    });
    if (result.note) state.notes.unshift(result.note);
    showToast("Đã lưu lời giải vào Sổ tay ghi chú ✨");
  } catch (err) {
    showToast("Chưa lưu được lời giải: " + err.message, true);
  }
};

// ========================================================
// FACEBOOK-STYLE STUDENT PROFILE (TRANG CÁ NHÂN FACEBOOK)
// ========================================================
const MASCOT_AVATARS = [
  { id: "owl", name: "Cú Bác Học", icon: "🦉" },
  { id: "rabbit", name: "Thỏ Cần Cù", icon: "🐰" },
  { id: "cat", name: "Mèo Thông Thái", icon: "🐱" },
  { id: "fox", name: "Cáo Chiến Binh", icon: "🦊" },
  { id: "bear", name: "Gấu Bác Học", icon: "🐻" },
  { id: "unicorn", name: "Kỳ Lân Phép Thuật", icon: "🦄" },
  { id: "penguin", name: "Chim Cánh Cụt", icon: "🐧" },
  { id: "flower", name: "Hoa Lumi", icon: "🌸" }
];

const COVER_PRESETS = [
  { id: "cyber", name: "Cyber Study", bg: "linear-gradient(135deg, #ff758c 0%, #ff7eb3 50%, #7f7fd5 100%)" },
  { id: "galaxy", name: "Galaxy AI", bg: "linear-gradient(135deg, #654ea3 0%, #eaafc8 100%)" },
  { id: "sunrise", name: "Bình Minh Tri Thức", bg: "linear-gradient(135deg, #f857a6 0%, #ff5858 100%)" },
  { id: "forest", name: "Thư Viện Xanh", bg: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" },
  { id: "sunset", name: "Hoàng Hôn Tĩnh Lặng", bg: "linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)" },
  { id: "lumi", name: "Lumi Pastel Dream", bg: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)" }
];

function renderSettings() {
  const profile = state.profile || {};
  const stats = state.stats || {};
  const coverBg = profile.cover_url || "linear-gradient(135deg, #ff758c 0%, #ff7eb3 50%, #7f7fd5 100%)";
  const isCoverGradient = coverBg.startsWith("linear-gradient");

  const avatarDisplay = profile.avatar_url
    ? (profile.avatar_url.startsWith("mascot:")
        ? `<span style="font-size:68px;">${profile.avatar_url.slice(7)}</span>`
        : `<img src="${esc(profile.avatar_url)}" alt="">`)
    : (Array.from(profile.full_name || "L")[0] || "L");

  return `
    <div class="fb-profile-wrap">
      <div class="fb-card">
        <!-- 1. FACEBOOK COVER BANNER (ẢNH BÌA) -->
        <div class="fb-cover-banner" style="${isCoverGradient ? `background:${coverBg};` : `background-image:url('${esc(coverBg)}');`}">
          <button type="button" class="fb-cover-edit-btn" onclick="openCoverModal()">
            📷 Chỉnh sửa ảnh bìa
          </button>
        </div>

        <!-- 2. FACEBOOK HEADER WITH OVERLAPPING AVATAR -->
        <div class="fb-header-body">
          <div class="fb-avatar-row">
            <div class="fb-avatar-container">
              <div class="fb-avatar-large">
                ${avatarDisplay}
              </div>
              <button type="button" class="fb-avatar-camera-btn" onclick="openAvatarModal()" title="Đổi ảnh đại diện" aria-label="Đổi ảnh đại diện">
                📷
              </button>
            </div>

            <div class="fb-header-actions">
              <button type="button" class="fb-btn fb-btn-primary" onclick="openEditProfileModal()">
                ✏️ Chỉnh sửa tiểu sử
              </button>
              <button type="button" class="fb-btn fb-btn-secondary" onclick="openAvatarModal()">
                🖼️ Đổi Avatar
              </button>
              <button type="button" class="fb-btn fb-btn-secondary" onclick="openCoverModal()">
                📷 Đổi ảnh bìa
              </button>
              <button type="button" class="fb-btn fb-btn-logout" onclick="handleLogout()">
                🚪 Đăng xuất
              </button>
            </div>
          </div>

          <div class="fb-user-titles">
            <h1 class="fb-user-name">
              ${esc(profile.full_name || "Học viên Lumi")}
              <span class="fb-verified-badge" title="Học viên chính thức">✿</span>
            </h1>
            <div class="fb-user-handle">@${esc(profile.username || "hocvien")}</div>
            <p class="fb-user-bio">${profile.bio ? esc(profile.bio) : '<span style="color:var(--ink-500); font-style:italic;">Chưa có tiểu sử. Nhấn "Chỉnh sửa tiểu sử" để thêm.</span>'}</p>
          </div>

          <!-- TABS BAR -->
          <div class="fb-profile-tabs-bar">
            <div class="fb-tab-item ${state.fbProfileTab === 'intro' ? 'active' : ''}" onclick="switchFbTab('intro')">
              📌 Giới thiệu & Chỉ số
            </div>
            <div class="fb-tab-item ${state.fbProfileTab === 'badges' ? 'active' : ''}" onclick="switchFbTab('badges')">
              🎖️ Tủ huy hiệu (${state.overview ? state.overview.achievementsCount : 0})
            </div>
            <div class="fb-tab-item ${state.fbProfileTab === 'inventory' ? 'active' : ''}" onclick="switchFbTab('inventory')">
              🎒 Túi đồ (${state.inventory.length})
            </div>
          </div>
        </div>
      </div>

      <!-- 3. TWO COLUMN FACEBOOK LAYOUT -->
      <div class="fb-columns-grid">
        <!-- LEFT COLUMN: GIỚI THIỆU & HUY HIỆU -->
        <div class="fb-left-col">
          <div class="fb-side-card">
            <h3 class="fb-side-card-title">📌 Giới thiệu học viên</h3>
            <div class="fb-intro-item">
              <span class="fb-intro-icon">🏫</span>
              <span>Trường: <strong>${profile.school ? esc(profile.school) : '<span style="color:var(--ink-500); font-weight:normal; font-style:italic;">Chưa cập nhật</span>'}</strong></span>
            </div>
            <div class="fb-intro-item">
              <span class="fb-intro-icon">🎓</span>
              <span>Chuyên ngành: <strong>${profile.major ? esc(profile.major) : '<span style="color:var(--ink-500); font-weight:normal; font-style:italic;">Chưa cập nhật</span>'}</strong></span>
            </div>
            <div class="fb-intro-item">
              <span class="fb-intro-icon">🏆</span>
              <span>Hạng giải tuần: <strong>${esc(state.overview && state.overview.league ? state.overview.league : 'Chưa xếp hạng')}</strong></span>
            </div>
            <div class="fb-intro-item">
              <span class="fb-intro-icon">📚</span>
              <span>Bài học đã vượt: <strong>${state.overview && state.overview.completedCount != null ? state.overview.completedCount : 0} bài</strong></span>
            </div>
            <div class="fb-intro-item">
              <span class="fb-intro-icon">📅</span>
              <span>Ngày tham gia: <strong>${profile.created_at ? esc(profile.created_at.slice(0, 10)) : (stats.last_active_date ? esc(stats.last_active_date) : 'Chưa có dữ liệu')}</strong></span>
            </div>
            <button class="btn-duo btn-duo-white" style="width:100%; margin-top:14px; font-size:13.5px; padding:10px;" onclick="openEditProfileModal()">
              Chỉnh sửa thông tin
            </button>
          </div>

          <div class="fb-side-card">
            <h3 class="fb-side-card-title">🎖️ Huy hiệu tiêu biểu</h3>
            ${state.overview && state.overview.achievementsCount > 0 ? `
              <div style="display:flex; gap:12px; flex-wrap:wrap;">
                <span style="font-size:36px; cursor:pointer;" title="Khởi đầu hoàn hảo" onclick="state.page='achievements'; render();">🌟</span>
              </div>
            ` : `
              <p style="font-size:13.5px; color:var(--ink-500); margin:6px 0;">Chưa mở khóa huy hiệu nào. Hãy hoàn thành các bài học để nhận huy hiệu!</p>
            `}
            <a href="javascript:void(0)" onclick="state.page='achievements'; render();" style="display:block; font-size:13.5px; font-weight:800; color:var(--lumi-pink); margin-top:10px; text-decoration:none;">
              Xem tất cả huy hiệu ➔
            </a>
          </div>
        </div>

        <!-- RIGHT COLUMN: CHỈ SỐ HỌC TẬP & DÒNG TRẠNG THÁI -->
        <div class="fb-right-col">
          <!-- 4 STATS CARDS -->
          <div class="fb-stats-grid-4">
            <div class="fb-stat-box">
              <span class="fb-stat-box-icon">⭐</span>
              <div>
                <div class="fb-stat-box-num">${stats.total_xp || 0}</div>
                <div class="fb-stat-box-label">Tổng điểm XP</div>
              </div>
            </div>
            <div class="fb-stat-box">
              <span class="fb-stat-box-icon">🔥</span>
              <div>
                <div class="fb-stat-box-num">${stats.current_streak || 0} ngày</div>
                <div class="fb-stat-box-label">Chuỗi ngày học</div>
              </div>
            </div>
            <div class="fb-stat-box">
              <span class="fb-stat-box-icon">💎</span>
              <div>
                <div class="fb-stat-box-num">${stats.gems || 50}</div>
                <div class="fb-stat-box-label">Đá quý tích lũy</div>
              </div>
            </div>
            <div class="fb-stat-box">
              <span class="fb-stat-box-icon">❤️</span>
              <div>
                <div class="fb-stat-box-num">${stats.hearts == null ? 5 : stats.hearts} / 5</div>
                <div class="fb-stat-box-label">Trái tim học tập</div>
              </div>
            </div>
          </div>

          <!-- TAB CONTENT -->
          ${state.fbProfileTab === 'intro' ? `
            <div class="fb-side-card">
              <h3 class="fb-side-card-title">📚 Hoạt động học tập gần đây</h3>
              ${state.overview && state.overview.recent && state.overview.recent.length ? `
                <div style="display:flex; flex-direction:column; gap:12px;">
                  ${state.overview.recent.map(r => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:#fff7fa; border-radius:14px; border-left:4px solid var(--lumi-pink);">
                      <div>
                        <strong style="color:var(--ink-900); font-size:15px;">${esc(r.lesson_title)}</strong>
                        <div style="font-size:12.5px; color:var(--ink-500); margin-top:2px;">Hoàn thành: ${esc(r.completed_at ? r.completed_at.slice(0, 10) : 'Gần đây')}</div>
                      </div>
                      <span style="font-weight:900; color:var(--duo-gold-dark);">+${r.score || 10} XP ⭐</span>
                    </div>
                  `).join("")}
                </div>
              ` : `
                <div style="text-align:center; padding:24px; color:var(--ink-500);">
                  <span style="font-size:36px;">📖</span>
                  <div style="font-weight:800; margin-top:8px;">Bắt đầu học bài đầu tiên để ghi lại dấu mốc!</div>
                </div>
              `}
            </div>
          ` : state.fbProfileTab === 'badges' ? `
            <div class="fb-side-card">
              <h3 class="fb-side-card-title">🎖️ Danh sách thành tích mở khóa (${state.overview ? state.overview.achievementsCount : 0})</h3>
              <p style="font-size:14px; color:var(--ink-500); margin-bottom:16px;">Tất cả các mốc thành tích bạn đã chinh phục trong suốt quá trình rèn luyện tại Lumi.</p>
              <button class="btn-duo btn-duo-pink" style="width:100%;" onclick="state.page='achievements'; render();">
                Mở Tủ Huy Hiệu Chi Tiết ➔
              </button>
            </div>
          ` : `
            <div class="fb-side-card">
              <h3 class="fb-side-card-title">🎒 Túi đồ học tập</h3>
              ${state.inventory && state.inventory.length ? `
                <div style="display:flex; flex-direction:column; gap:12px;">
                  ${state.inventory.map(item => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:#f0f8ff; border-radius:14px;">
                      <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size:24px;">${item.item_code === 'streak_freeze' ? '🧊' : (item.item_code === 'heart_refill' ? '❤️' : '🎁')}</span>
                        <div>
                          <strong style="color:var(--ink-900);">${item.item_code === 'streak_freeze' ? 'Đóng băng chuỗi học' : esc(item.item_code)}</strong>
                          <div style="font-size:12px; color:var(--ink-500);">${item.item_code === 'streak_freeze' ? 'Bảo vệ chuỗi khi bạn nghỉ 1 ngày' : ''}</div>
                        </div>
                      </div>
                      <span style="font-weight:900; color:var(--duo-blue);">x${item.quantity || 1}</span>
                    </div>
                  `).join("")}
                </div>
              ` : `
                <div style="text-align:center; padding:24px; color:var(--ink-500);">
                  <span style="font-size:36px;">🎒</span>
                  <div style="font-weight:800; margin-top:8px;">Túi đồ hiện đang trống!</div>
                </div>
              `}
              <button class="btn-duo btn-duo-pink" style="margin-top:14px; width:100%;" onclick="goToShop()">
                Ghé Cửa Hàng Mua Sắm 🏪
              </button>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

window.switchFbTab = function(tab) {
  playSound("click");
  state.fbProfileTab = tab;
  render();
};

window.openEditProfileModal = function() {
  playSound("click");
  const p = state.profile || {};
  showModal(`
    <div class="modal-dialog">
      <span class="modal-close" onclick="closeModal()">✕</span>
      <h2 style="font-size:22px; font-weight:900; color:var(--ink-900); margin-bottom:16px;">
        ✏️ Chỉnh sửa Trang cá nhân
      </h2>
      <form onsubmit="handleSaveProfileForm(event)" style="display:flex; flex-direction:column; gap:14px;">
        <div class="form-group">
          <label class="form-label">Tên hiển thị</label>
          <input type="text" id="edit-fullname-input" class="form-input" value="${esc(p.full_name || '')}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Trường học</label>
          <input type="text" id="edit-school-input" class="form-input" placeholder="Ví dụ: Đại học FPT, Bách Khoa..." value="${esc(p.school || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">Chuyên ngành</label>
          <input type="text" id="edit-major-input" class="form-input" placeholder="Ví dụ: Kỹ thuật phần mềm, CNTT..." value="${esc(p.major || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">Tiểu sử (Bio)</label>
          <textarea id="edit-bio-input" class="form-input" rows="3" style="resize:none;" placeholder="Giới thiệu đôi nét về bản thân...">${esc(p.bio || '')}</textarea>
        </div>
        <button type="submit" class="btn-duo btn-duo-pink" style="padding:14px; font-size:15px; margin-top:8px;">
          Lưu thay đổi vào Cloudflare D1 💾
        </button>
      </form>
    </div>
  `);
};

window.handleSaveProfileForm = async function(e) {
  e.preventDefault();
  const fullName = document.getElementById("edit-fullname-input").value.trim();
  const school = document.getElementById("edit-school-input") ? document.getElementById("edit-school-input").value.trim() : "";
  const major = document.getElementById("edit-major-input") ? document.getElementById("edit-major-input").value.trim() : "";
  const bio = document.getElementById("edit-bio-input").value.trim();
  if (!fullName) return;

  try {
    playSound("click");
    const res = await api("/api/profile", {
      method: "PATCH",
      body: { fullName, bio, school, major }
    });
    state.profile = res.profile;
    closeModal();
    playSound("fanfare");
    showToast("Đã lưu hồ sơ thành công vào Cloudflare D1!");
    updateShell();
    render();
  } catch (err) {
    playSound("wrong");
    showToast(err.message, true);
  }
};

window.openAvatarModal = function() {
  playSound("click");
  showModal(`
    <div class="modal-dialog" style="max-width:540px;">
      <span class="modal-close" onclick="closeModal()">✕</span>
      <h2 style="font-size:22px; font-weight:900; color:var(--ink-900); margin-bottom:8px;">
        🖼️ Chọn Ảnh đại diện mới
      </h2>
      <p style="font-size:14px; color:var(--ink-500); margin-bottom:16px;">
        Tải ảnh thật từ máy tính lên hoặc chọn một Linh vật Lumi đáng yêu:
      </p>

      <!-- TAB 1: UPLOAD REAL PHOTO -->
      <div style="background:#fff7fa; border:2px dashed var(--lumi-pink-border); border-radius:18px; padding:20px; text-align:center; margin-bottom:20px;">
        <span style="font-size:36px;">📷</span>
        <h4 style="font-weight:900; color:var(--ink-900); margin:6px 0;">Tải ảnh từ thiết bị của bạn</h4>
        <input type="file" id="real-avatar-input" accept="image/png, image/jpeg, image/webp" style="display:none;" onchange="handleUploadAvatarFile(this)" />
        <button type="button" class="btn-duo btn-duo-pink" style="margin-top:10px; padding:10px 24px;" onclick="document.getElementById('real-avatar-input').click()">
          Chọn tệp ảnh tải lên ➔
        </button>
      </div>

      <!-- TAB 2: MASCOT AVATARS -->
      <h4 style="font-weight:900; color:var(--ink-900); margin-bottom:10px;">Hoặc chọn Linh vật Lumi:</h4>
      <div class="avatar-preset-grid">
        ${MASCOT_AVATARS.map(m => `
          <div class="avatar-preset-item" onclick="handleSelectMascotAvatar('${m.icon}')">
            <span class="avatar-preset-emoji">${m.icon}</span>
            <span class="avatar-preset-name">${m.name}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `);
};

window.handleUploadAvatarFile = async function(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("avatar", file);

  try {
    playSound("click");
    showToast("Đang tải ảnh lên Cloudflare D1...");
    const res = await api("/api/profile/avatar", {
      method: "POST",
      body: formData
    });
    state.profile = res.profile;
    closeModal();
    playSound("fanfare");
    showToast("Đã cập nhật ảnh đại diện vào Cloudflare D1!");
    updateShell();
    render();
  } catch (err) {
    playSound("wrong");
    showToast(err.message, true);
  }
};

window.handleSelectMascotAvatar = async function(icon) {
  try {
    playSound("click");
    const avatarUrl = "mascot:" + icon;
    const res = await api("/api/profile/avatar/preset", {
      method: "POST",
      body: { avatarUrl }
    });
    state.profile = res.profile;
    closeModal();
    playSound("fanfare");
    showToast("Đã đổi sang linh vật " + icon + " thành công!");
    updateShell();
    render();
  } catch (err) {
    playSound("wrong");
    showToast(err.message, true);
  }
};

window.openCoverModal = function() {
  playSound("click");
  showModal(`
    <div class="modal-dialog" style="max-width:540px;">
      <span class="modal-close" onclick="closeModal()">✕</span>
      <h2 style="font-size:22px; font-weight:900; color:var(--ink-900); margin-bottom:8px;">
        📷 Chọn Ảnh bìa Trang cá nhân
      </h2>
      <p style="font-size:14px; color:var(--ink-500); margin-bottom:16px;">
        Chọn một chủ đề màu sắc phong cách Facebook để làm nổi bật trang cá nhân:
      </p>

      <div class="cover-preset-grid">
        ${COVER_PRESETS.map(c => `
          <div class="cover-preset-item" style="background:${c.bg};" onclick="handleSelectCover('${c.bg}')">
            <span>${c.name}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `);
};

window.handleSelectCover = async function(coverBg) {
  try {
    playSound("click");
    const res = await api("/api/profile/cover", {
      method: "POST",
      body: { coverUrl: coverBg }
    });
    state.profile = res.profile;
    closeModal();
    playSound("fanfare");
    showToast("Đã lưu ảnh bìa mới vào Cloudflare D1!");
    render();
  } catch (err) {
    playSound("wrong");
    showToast(err.message, true);
  }
};

window.handleLogout = async function() {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } catch {}
  state.profile = null;
  state.account = null;
  state.authTab = "login";
  state.page = "home";
  updateShell();
  render();
  showToast("Đã đăng xuất thành công!");
};

// ========================================================
// MODAL SYSTEM
// ========================================================
window.showModal = function(html) {
  modalRoot.innerHTML = `<div class="modal-backdrop" onclick="if(event.target===this) closeModal()">${html}</div>`;
};

window.closeModal = function() {
  modalRoot.innerHTML = "";
};

// ========================================================
// KHU XEM STREAK XỊN XÒ (STREAK HUB MODAL)
// ========================================================
window.openStreakModal = function() {
  playSound("fanfare");
  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return;

  const streak = Number(state.stats?.current_streak) || 0;
  const longest = Number(state.stats?.longest_streak) || streak;
  const today = state.overview?.today || new Date().toISOString().slice(0, 10);
  
  // Kiểm tra hôm nay đã hoàn thành bài học chưa
  const historyRows = state.overview?.week || [];
  const todayRecord = historyRows.find(r => String(r.activity_date).slice(0, 10) === today);
  const isLearnedToday = todayRecord && (todayRecord.status === "completed" || todayRecord.status === "freeze_used");

  // Streak Freeze trong kho
  const freezeItem = state.shop?.inventory?.find(i => i.item_code === "streak_freeze");
  const freezeCount = freezeItem ? Number(freezeItem.quantity) : 0;

  // Render 28-day (4-week) Streak Calendar Grid
  const refDate = today || new Date().toISOString().slice(0, 10);
  const [tY, tM, tD] = refDate.split("-").map(Number);
  const historyMap = new Map((historyRows || []).map(r => [String(r.activity_date).slice(0, 10), r.status]));
  const cells = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(Date.UTC(tY, tM - 1, tD - i));
    const key = d.toISOString().slice(0, 10);
    const dayNum = d.getUTCDate();
    const isCurToday = key === refDate;
    const status = historyMap.get(key);
    const done = status === "completed";
    const frozen = status === "freeze_used";

    let cellClass = "streak-cell";
    let icon = dayNum;
    if (done) {
      cellClass += " done";
      icon = "🔥";
    } else if (frozen) {
      cellClass += " frozen";
      icon = "❄️";
    }
    if (isCurToday) cellClass += " today";

    cells.push(`
      <div class="${cellClass}" title="${key}${done ? ' - Đã hoàn thành' : isCurToday ? ' - Hôm nay' : ''}">
        <span>${icon}</span>
      </div>
    `);
  }

  // Mốc thưởng chuỗi
  const milestones = [
    { days: 3, title: "Mầm Lửa Nhỏ", reward: "+20 💎 Đá quý", icon: "🌱" },
    { days: 7, title: "Chiến Binh Rực Lửa", reward: "+50 💎 & Huy hiệu Lửa", icon: "⚔️" },
    { days: 14, title: "Ngọn Đuốc Bất Diệt", reward: "+100 💎 Đá quý", icon: "🕯️" },
    { days: 30, title: "Huyền Thoại 3TG", reward: "+300 💎 & Cúp Vàng", icon: "👑" },
  ];

  const milestonesHtml = milestones.map(m => {
    const reached = streak >= m.days;
    return `
      <div class="streak-milestone-item ${reached ? 'achieved' : ''}">
        <span class="milestone-icon">${m.icon}</span>
        <div class="milestone-info">
          <strong>${m.days} Ngày: ${m.title}</strong>
          <small>Thưởng: ${m.reward}</small>
        </div>
        <span class="milestone-badge">${reached ? '✓ Đã đạt' : `Còn ${m.days - streak} ngày`}</span>
      </div>
    `;
  }).join("");

  modalRoot.innerHTML = `
    <div class="streak-modal-backdrop" onclick="closeStreakModal(event)">
      <div class="streak-modal-card" onclick="event.stopPropagation()">
        <button class="streak-modal-close" onclick="closeStreakModal()" aria-label="Đóng">✕</button>
        
        <div class="streak-hub-hero">
          <div class="streak-flame-giant-wrap">
            <span class="streak-flame-giant">🔥</span>
          </div>
          <div class="streak-hub-count">${streak} NGÀY</div>
          <div class="streak-hub-sub">CHUỖI NGÀY HỌC LIÊN TỤC</div>

          <div>
            ${isLearnedToday 
              ? `<span class="streak-status-pill safe">✅ Chuỗi của bạn đang an toàn hôm nay!</span>`
              : `<span class="streak-status-pill warning">⚡ Hãy hoàn thành 1 bài học để thắp lửa hôm nay!</span>`
            }
          </div>
        </div>

        <div class="streak-calendar-section">
          <div class="streak-section-title">
            <span>📅 Nhật ký chuỗi 4 tuần qua</span>
            <small style="color:var(--ink-500); font-weight:700;">Kỷ lục cao nhất: ${longest} ngày</small>
          </div>
          <div class="streak-grid-30">
            ${cells.join("")}
          </div>
        </div>

        <div style="margin-top:22px;">
          <div class="streak-section-title">
            <span>🏆 Mốc thưởng chuỗi ngày học</span>
          </div>
          <div class="streak-milestones-list">
            ${milestonesHtml}
          </div>
        </div>

        <div style="margin-top:20px; background:#fff5f8; border:2px solid var(--lumi-pink-border); border-radius:20px; padding:16px; display:flex; align-items:center; gap:16px;">
          <div style="font-size:32px;">❄️</div>
          <div style="flex:1;">
            <strong style="display:block; font-size:14px; color:#18181b;">Bảo Vệ Chuỗi (Streak Freeze)</strong>
            <small style="color:#71717a; font-size:12px;">Bạn đang có: <strong>${freezeCount}</strong> lần bảo vệ khi lỡ quên học 1 ngày.</small>
          </div>
          <button class="btn-duo btn-duo-pink" style="padding:8px 14px; font-size:12px;" onclick="closeStreakModal(); state.page='shop'; render();">
            Mua thêm 💎
          </button>
        </div>

        <div style="margin-top:22px; display:flex; justify-content:center;">
          <button class="btn-duo btn-duo-pink" style="width:100%; height:52px; font-size:16px;" onclick="closeStreakModal(); if(state.page !== 'home'){ state.page='home'; render(); }">
            Học bài ngay để tăng chuỗi! 🚀
          </button>
        </div>
      </div>
    </div>
  `;
};

window.closeStreakModal = function(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains("streak-modal-close")) return;
  const modalRoot = document.getElementById("modal-root");
  if (modalRoot) modalRoot.innerHTML = "";
};

// ========================================================
// MAIN RENDER ENGINE
// ========================================================
function render() {
  // Animate real route changes only; quiz feedback and typing should not reflow the page.
  const appView = document.getElementById("app-view");
  const viewKey = !state.profile ? "auth" : state.lesson ? "lesson" : state.page;
  if (appView && viewKey !== lastRenderedViewKey) {
    appView.classList.remove("page-view-enter");
    void appView.offsetWidth; // force reflow
    appView.classList.add("page-view-enter");
  }
  lastRenderedViewKey = viewKey;

  // If not authenticated, always show the mandatory Login/Register screen
  if (!state.profile) {
    view.innerHTML = renderAuthScreen();
    updateShell();
    const companion = document.getElementById("global-mascot-companion");
    if (companion) companion.style.display = "none";
    return;
  }

  if (state.lesson) {
    view.innerHTML = renderLessonQuiz();
    const companion = document.getElementById("global-mascot-companion");
    if (companion) {
      companion.style.display = "none";
      companion.classList.add("hidden-in-quiz");
    }
    return;
  }

  switch (state.page) {
    case "home":
      view.innerHTML = renderHome();
      break;
    case "courses":
      view.innerHTML = renderCourses();
      break;
    case "notes":
      view.innerHTML = renderNotes();
      break;
    case "leaderboard":
      view.innerHTML = renderLeaderboard();
      break;
    case "shop":
      view.innerHTML = renderShop();
      break;
    case "achievements":
      view.innerHTML = renderAchievements();
      break;
    case "review":
      view.innerHTML = renderReview();
      break;
    case "chat":
      view.innerHTML = renderChat();
      break;
    case "settings":
      view.innerHTML = renderSettings();
      break;
    default:
      view.innerHTML = renderHome();
  }

  updateShell();
  updateGlobalCompanion();

  if (state.page === "home") {
    setTimeout(setupStagePillsScroll, 30);
  }
}
let lastRenderedViewKey = "";
window.render = render;

// Global click event listeners for data-page, data-subject, data-lesson, data-auth-tab
document.addEventListener("click", function (e) {
  const streakTrigger = e.target.closest("#side-streak-card, #top-streak-btn, .top-streak");
  if (streakTrigger) {
    e.stopPropagation();
    openStreakModal();
    return;
  }

  const authTabBtn = e.target.closest("[data-auth-tab]");
  if (authTabBtn) {
    playSound("click");
    state.authTab = authTabBtn.dataset.authTab;
    render();
    return;
  }

  const pageBtn = e.target.closest("[data-page]");
  if (pageBtn) {
    playSound("click");
    navigateToPage(pageBtn.dataset.page);
    return;
  }

  const subBtn = e.target.closest("[data-subject]");
  if (subBtn) {
    playSound("click");
    const subId = subBtn.dataset.subject;
    loadSubjectPath(subId);
    state.page = "home";
    closeMobileMenu();
    return;
  }

  const lessonBtn = e.target.closest("[data-lesson]");
  if (lessonBtn && !lessonBtn.disabled) {
    const lessonId = lessonBtn.dataset.lesson;
    openLesson(lessonId);
    return;
  }
});

async function navigateToPage(targetPage) {
  state.page = targetPage;
  closeMobileMenu();
  updateShell();
  render();

  if (!state.profile) return;
  try {
    if (targetPage === "home") {
      const [ov, sub] = await Promise.all([
        api("/api/overview").catch(() => null),
        state.currentSubjectId ? api(`/api/subjects/${state.currentSubjectId}`).catch(() => null) : null
      ]);
      if (ov) {
        state.overview = ov;
        if (ov.stats) state.stats = ov.stats;
        updateShell();
      }
      if (sub) state.subjectDetail = sub;
      render();
    } else if (targetPage === "courses") {
      const subRes = await api("/api/subjects").catch(() => null);
      if (subRes && subRes.subjects) {
        state.subjects = subRes.subjects;
        render();
      }
    } else if (targetPage === "notes") {
      await loadNotes();
    } else if (targetPage === "chat") {
      await loadChatConversations();
      render();
    } else if (targetPage === "leaderboard") {
      leaderboardData = await api("/api/leaderboard").catch(() => null);
      render();
    } else if (targetPage === "shop") {
      shopData = await api("/api/shop").catch(() => null);
      render();
    } else if (targetPage === "review") {
      const revRes = await api("/api/review").catch(() => null);
      if (revRes) {
        state.reviewMistakes = revRes.mistakes || [];
        updateShell();
        render();
      }
    }
  } catch (err) {
    console.warn("Live fetch error on tab change:", err);
  }
}

async function syncLiveData(silent = true) {
  if (!state.profile || state.lesson) return;
  try {
    const ov = await api("/api/overview");
    if (ov && ov.stats) {
      state.overview = ov;
      state.stats = ov.stats;
      updateShell();
      if (state.page === "home") {
        render();
      }
      if (!silent) {
        playSound("fanfare");
        showToast("⚡ Đã đồng bộ số liệu mới nhất từ Cloudflare D1!");
      }
    }
  } catch (err) {
    if (!silent) showToast("Lỗi đồng bộ: " + err.message, true);
  }
}

// Tự động đồng bộ số liệu khi người dùng chuyển lại tab trình duyệt
window.addEventListener("focus", () => {
  syncLiveData(true);
});

// Tự động đồng bộ số liệu định kỳ mỗi 12 giây trong nền
setInterval(() => {
  syncLiveData(true);
}, 12000);

document.getElementById("connection-status")?.addEventListener("click", () => {
  syncLiveData(false);
});

// Top Subject Quick Selector Click
document.getElementById("top-subject-selector")?.addEventListener("click", () => {
  if (!state.profile) return;
  playSound("click");
  navigateToPage("courses");
});

// Header Login button
document.getElementById("header-login-btn")?.addEventListener("click", () => {
  state.authTab = "login";
  render();
});

document.getElementById("side-profile-btn")?.addEventListener("click", () => {
  if (!state.profile) {
    state.authTab = "login";
    render();
  } else {
    navigateToPage("settings");
  }
});

document.getElementById("header-avatar-btn")?.addEventListener("click", () => {
  if (!state.profile) {
    state.authTab = "login";
    render();
  } else {
    navigateToPage("settings");
  }
});

// Keyboard shortcuts for Quiz (1, 2, 3, 4, Enter)
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && document.getElementById("study-calculator-layer")) {
    window.closeStudyCalculator();
    return;
  }
  if (e.key === "Escape" && activeFullscreenNoteEditor) {
    window.closeNoteFullscreen();
    return;
  }
  if (e.key === "Escape" && modalRoot.classList.contains("drawer-modal-root")) {
    window.closeQuickLessonDrawer();
    return;
  }
  if (state.lesson && !state.finish) {
    const questions = state.lesson.questions;
    const question = questions[state.questionIndex];
    if (question && question.options) {
      if (["1", "2", "3", "4"].includes(e.key)) {
        const idx = Number(e.key) - 1;
        if (question.options[idx]) {
          selectChoice(question.options[idx].key);
        }
      } else if (e.key === "Enter") {
        if (!state.checkedAnswer && state.selectedOption) {
          checkAnswer();
        } else if (state.checkedAnswer) {
          nextQuestion();
        }
      }
    }
  }
});

// Mobile menu
function openMobileMenu() {
  document.getElementById("sidebar")?.classList.add("mobile-open");
  document.getElementById("mobile-overlay")?.classList.add("active");
}
function closeMobileMenu() {
  document.getElementById("sidebar")?.classList.remove("mobile-open");
  document.getElementById("mobile-overlay")?.classList.remove("active");
}
document.getElementById("menu-toggle")?.addEventListener("click", openMobileMenu);
document.getElementById("mobile-overlay")?.addEventListener("click", closeMobileMenu);

// ========================================================
// INITIALIZATION
// ========================================================
async function initialize() {
  try {
    // Check if user already has an authenticated session
    const sessionRes = await api("/api/session").catch(() => null);
    if (sessionRes && sessionRes.profile) {
      state.profile = sessionRes.profile;
      state.account = sessionRes.account;
      await loadAuthenticatedData();
    } else {
      // Unauthenticated: fetch subjects for count, then render Auth Entry Screen
      const subRes = await api("/api/subjects").catch(() => ({ subjects: [] }));
      state.subjects = subRes.subjects || [];
      state.profile = null;
      render();
    }
  } catch (err) {
    state.apiError = err.message;
    view.innerHTML = `<div class="empty-state">Lỗi kết nối: ${esc(err.message)}</div>`;
  } finally {
    setupTopbarPopovers();
    updateGlobalCompanion();
  }
}

initialize();
