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
  academicTranscript: null,
  academicLoginModalOpen: false,
  academicActiveTab: "login",
  academicSemesterFilter: "all",
  academicGradeFilter: "all",
  academicExpandedSubjects: new Set(),
  academicSimulatedScores: new Map(),
  academicAdvisorTarget: 3.2,
  academicAdvisorBusy: false,
  page: "home", // home | courses | grades | notes | leaderboard | shop | achievements | review | chat | settings
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
  editingNoteIds: new Set(),
  activeNoteLesson: null,
  activeQuickLessonId: null,
  quickDrawerTab: "guide",
  isChatDropdownOpen: false,
  reviewMistakes: [],
  reviewCurrentIndex: 0,
  reviewPracticeActive: false,
  reviewSubjectFilter: "all",
  reviewSelectedChoice: "",
  reviewCheckedResult: null,
  reviewChecking: false,
  reviewPracticeList: [],
  authTab: "register", // register | login
  fbProfileTab: "intro", // intro | badges | inventory
  isOffline: typeof navigator !== "undefined" ? !navigator.onLine : false,
  networkChecking: false
};

window.state = state;

// ========================================================
// CUTE MASCOT SPLASH LOADER CONTROLLER (SIÊU ĐẸP & MƯỢT)
// ========================================================
const splashLoader = document.getElementById("app-splash-loader");
const splashMascotBox = document.getElementById("splash-mascot-container");
const splashLoadingText = document.getElementById("splash-loading-text");
const splashProgressBar = document.getElementById("splash-progress-bar");
const splashTips = document.getElementById("splash-tips");

const CUTE_LOADING_TIPS = [
  "Thỏ Bảy Màu đang nạp năng lượng và đồng bộ bài học cho bạn… 🥕",
  "Mỗi ngày học 15 phút cùng 3TG để thắp sáng ngọn lửa tri thức! 🔥",
  "Đang tải hơn 29.000 câu hỏi chất lượng cao từ Cloudflare D1… ✨",
  "Bạn có biết: Giữ chuỗi học liên tục sẽ nhận được nhiều Đá quý hơn đấy! 💎",
  "Học vui, nhớ lâu cùng Mascot Thỏ Bảy Màu và Trợ giảng AI! 🌸",
  "Sắp hoàn tất rồi, cùng chuẩn bị chinh phục đỉnh cao tri thức nhé! 🏆"
];
let tipRotateTimer = null;

function initSplashMascot() {
  if (splashMascotBox && !splashMascotBox.querySelector("svg")) {
    const svgHtml = generateThoBayMauSvg({ state: THO_STATES.CLOUD_FLOAT, size: 160 });
    const div = document.createElement("div");
    div.innerHTML = svgHtml;
    if (div.firstElementChild) {
      splashMascotBox.prepend(div.firstElementChild);
    }
  }
}

let hideLoaderTimeout = null;
let closeClassTimeout = null;

export function showAppLoader(text = "Đang chuẩn bị kho bài học 3TG… 🌸", tip = null) {
  if (!splashLoader) return;
  if (hideLoaderTimeout) { clearTimeout(hideLoaderTimeout); hideLoaderTimeout = null; }
  if (closeClassTimeout) { clearTimeout(closeClassTimeout); closeClassTimeout = null; }
  initSplashMascot();
  splashLoader.style.display = "flex";
  splashLoader.classList.remove("hidden", "closing");
  if (splashLoadingText) splashLoadingText.textContent = text;
  if (splashProgressBar) splashProgressBar.style.width = "40%";
  if (splashTips) {
    splashTips.textContent = tip || CUTE_LOADING_TIPS[Math.floor(Math.random() * CUTE_LOADING_TIPS.length)];
  }
  if (!tipRotateTimer) {
    tipRotateTimer = setInterval(() => {
      if (splashTips && !splashLoader.classList.contains("hidden")) {
        splashTips.style.opacity = "0";
        setTimeout(() => {
          splashTips.textContent = CUTE_LOADING_TIPS[Math.floor(Math.random() * CUTE_LOADING_TIPS.length)];
          splashTips.style.opacity = "1";
        }, 200);
      }
    }, 2800);
  }
}

export function setAppLoaderProgress(percent) {
  if (splashProgressBar) {
    splashProgressBar.style.width = `${Math.min(100, Math.max(10, percent))}%`;
  }
}

export function hideAppLoader() {
  if (!splashLoader) return;
  if (splashProgressBar) splashProgressBar.style.width = "100%";
  if (tipRotateTimer) {
    clearInterval(tipRotateTimer);
    tipRotateTimer = null;
  }
  if (hideLoaderTimeout) clearTimeout(hideLoaderTimeout);
  if (closeClassTimeout) clearTimeout(closeClassTimeout);
  hideLoaderTimeout = setTimeout(() => {
    splashLoader.classList.add("closing");
    closeClassTimeout = setTimeout(() => {
      splashLoader.classList.add("hidden");
      splashLoader.classList.remove("closing");
      splashLoader.style.display = "none";
    }, 380);
  }, 220);
}

window.showAppLoader = showAppLoader;
window.hideAppLoader = hideAppLoader;
window.setAppLoaderProgress = setAppLoaderProgress;
// Khởi tạo ngay SVG linh vật trong splash loader khi tệp JS được nạp
initSplashMascot();

// ========================================================
// OFFLINE & LOST NETWORK CONTROLLER (MẤT KẾT NỐI MẠNG)
// ========================================================
const offlineBanner = document.getElementById("app-offline-banner");
const connectionStatusEl = document.getElementById("connection-status");
const offlineRetryBtn = document.getElementById("offline-retry-btn");

function updateNetworkUI(isOffline) {
  state.isOffline = isOffline;
  if (offlineBanner) {
    if (isOffline) {
      offlineBanner.classList.remove("hidden");
    } else {
      offlineBanner.classList.add("hidden");
    }
  }
  if (connectionStatusEl) {
    if (isOffline) {
      connectionStatusEl.className = "footer-live footer-offline";
      connectionStatusEl.innerHTML = `<i></i> Mất kết nối mạng`;
      connectionStatusEl.setAttribute("title", "Không có mạng Internet! Nhấn để thử kết nối lại");
    } else {
      connectionStatusEl.className = "footer-live";
      connectionStatusEl.innerHTML = `<i></i> Active`;
      connectionStatusEl.setAttribute("title", "Hệ thống đang trực tuyến (Online) và kết nối Cloudflare D1");
    }
  }
}

export function handleOffline() {
  if (state.isOffline) return;
  updateNetworkUI(true);
  try { playSound("wrong"); } catch {}
  showToast("Mất kết nối mạng! Bạn đang ở chế độ ngoại tuyến.", true);
}

export async function handleOnline() {
  updateNetworkUI(false);
  try { playSound("fanfare"); } catch {}
  showToast("Đã kết nối lại mạng thành công! Đang đồng bộ…");
  if (state.profile) {
    try {
      await loadAuthenticatedData();
    } catch {}
  } else if (!state.subjects.length) {
    try {
      const subRes = await api("/api/subjects").catch(() => ({ subjects: [] }));
      state.subjects = subRes.subjects || [];
      render();
    } catch {}
  }
}

window.checkNetworkAndRetry = async function() {
  if (offlineRetryBtn) offlineRetryBtn.classList.add("loading");
  try {
    playSound("click");
    const res = await fetch("/api/health?t=" + Date.now(), { method: "GET", cache: "no-store" });
    if (res.ok) {
      await handleOnline();
      return;
    }
    throw new Error("Chưa có phản hồi từ máy chủ");
  } catch (err) {
    updateNetworkUI(true);
    playSound("wrong");
    showToast("Vẫn chưa có kết nối mạng. Hãy kiểm tra lại Wi-Fi hoặc 4G/5G nhé!", true);
  } finally {
    if (offlineRetryBtn) offlineRetryBtn.classList.remove("loading");
  }
};

window.addEventListener("online", handleOnline);
window.addEventListener("offline", handleOffline);
if (typeof navigator !== "undefined" && !navigator.onLine) {
  updateNetworkUI(true);
}

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

export function updateGlobalCompanion() {
  const container = document.getElementById("global-mascot-companion");
  if (container) container.remove();
}
window.updateGlobalCompanion = updateGlobalCompanion;

window.handleCompanionClick = function(e) {
  // Floating mascot is disabled per user request
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
// API CLIENT (VỚI BẮT MẤT KẾT NỐI MẠNG & TỰ HỒI PHỤC)
// ========================================================
async function api(path, options) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    handleOffline();
    const error = new Error("Mất kết nối mạng! Vui lòng kiểm tra lại Internet.");
    error.isOffline = true;
    throw error;
  }
  const config = Object.assign({ method: "GET", credentials: "same-origin" }, options || {});
  config.headers = Object.assign({}, config.headers || {});
  if (config.body && !(config.body instanceof FormData) && typeof config.body !== "string") {
    config.headers["content-type"] = "application/json";
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(path, config);
  } catch (netErr) {
    handleOffline();
    const error = new Error("Không thể kết nối đến máy chủ. Mất mạng hoặc gián đoạn đường truyền.");
    error.isOffline = true;
    throw error;
  }

  if (state.isOffline) {
    handleOnline();
  }

  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) {
    const error = new Error(data.error || "3TG chưa tải được dữ liệu.");
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

function normalizeAnswer(value) {
  return String(value == null ? "" : value).trim().replace(/^[[(]\s*|\s*[)\].]$/g, "").toUpperCase();
}
window.normalizeAnswer = normalizeAnswer;

const MASCOT_DEFAULT_KEYS = ["idle", "thinking", "calm-wrong", "confused-phone", "sleepy-afk", "typing-fast"];

const MASCOT_PACKS = {
  mascot_pack_champions: {
    id: "mascot_pack_champions",
    name: "Gói Thỏ Chiến Thần & Đỉnh Cao",
    description: "Bộ 7 mascot phong cách chiến thần rực lửa: Vua Vô Địch, Kiếm Sĩ Yasuo, Ăn Mừng VN, Bùng Cháy Lửa Streak, Cưỡi Mây, Thám Tử Bắt Lỗi, Siêu Sao XP.",
    price: 150,
    keys: ["vietnam-celebrate", "cloud-float", "sword-master", "streak-fire", "king-champion", "xp-boost", "detective-fix"],
    aura: "glow-fire",
    tag: "7 Mascot Siêu Phẩm"
  },
  mascot_pack_cosplay: {
    id: "mascot_pack_cosplay",
    name: "Gói Thỏ Hóa Trang Anime & Siêu Dễ Thương",
    description: "Bộ 7 mascot hóa trang siêu cute: Hầu Gái Kawaii, Giáo Sư AI, Đại Gia Đá Quý, Cổ Vũ Pom-Pom, Hốt Hoảng, Mếu Máo, Giận Dỗi.",
    price: 150,
    keys: ["maid-service", "ai-professor", "gem-rich", "cheering-pom", "shocked-walking", "heart-broken", "angry-remind"],
    aura: "glow-sakura",
    tag: "7 Mascot Kawaii"
  }
};
window.MASCOT_PACKS = MASCOT_PACKS;
window.MASCOT_DEFAULT_KEYS = MASCOT_DEFAULT_KEYS;

function isMascotUnlocked(stateKey) {
  if (MASCOT_DEFAULT_KEYS.includes(stateKey)) return true;
  const invCodes = new Set((state.inventory || []).map(i => i.item_code));
  if (MASCOT_PACKS.mascot_pack_champions.keys.includes(stateKey) && invCodes.has("mascot_pack_champions")) return true;
  if (MASCOT_PACKS.mascot_pack_cosplay.keys.includes(stateKey) && invCodes.has("mascot_pack_cosplay")) return true;
  if (stateKey === "maid-service" && invCodes.has("mascot_maid_outfit")) return true;
  return false;
}
window.isMascotUnlocked = isMascotUnlocked;

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

  // Active Mobile Bottom Nav button
  document.querySelectorAll(".mobile-nav-btn[data-page]").forEach(button => {
    button.classList.toggle("active", button.dataset.page === state.page);
  });

  const mobileReviewBadge = document.getElementById("mobile-review-badge");
  if (mobileReviewBadge) {
    if (state.reviewMistakes.length > 0) {
      mobileReviewBadge.style.display = "block";
      mobileReviewBadge.textContent = state.reviewMistakes.length;
    } else {
      mobileReviewBadge.style.display = "none";
    }
  }

  // Course Count
  const courseCount = document.getElementById("course-count");
  if (courseCount) courseCount.textContent = state.subjects.length;

  // Review Count
  const reviewCount = document.getElementById("nav-review-count");
  if (reviewCount) reviewCount.textContent = state.reviewMistakes.length;

  // GPA Badge
  const gpaBadge = document.getElementById("nav-gpa-badge");
  if (gpaBadge) {
    if (state.academicTranscript?.transcript?.gpa?.overall_4) {
      gpaBadge.textContent = "GPA " + state.academicTranscript.transcript.gpa.overall_4;
      gpaBadge.classList.add("has-gpa");
    } else {
      gpaBadge.textContent = "IU";
      gpaBadge.classList.remove("has-gpa");
    }
  }

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

    const avatarHtml = renderDecoratedAvatar(state.profile.avatar_url, state.profile.avatar_decoration, 38, name);
    if (sideAvatar) {
      sideAvatar.classList.toggle("with-nitro", !!state.profile.avatar_decoration);
      sideAvatar.innerHTML = avatarHtml;
    }
    if (topAvatar) {
      topAvatar.classList.toggle("with-nitro", !!state.profile.avatar_decoration);
      topAvatar.innerHTML = avatarHtml;
    }
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
    const done = status === "completed";
    const frozen = status === "freeze_used";

    let stateClass = "";
    let dotHtml = "";
    let tooltip = "";

    if (done) {
      stateClass = "done";
      dotHtml = "✓";
      tooltip = `${key} - Đã học giữ lửa 🔥`;
    } else if (frozen) {
      stateClass = "frozen";
      dotHtml = "🧊";
      tooltip = `${key} - Được bảo vệ bằng Bùa Băng 🧊`;
    } else if (isToday) {
      stateClass = "today";
      dotHtml = "•";
      tooltip = `${key} - Hôm nay (chưa hoàn thành) ⚡`;
    } else {
      stateClass = "empty";
      dotHtml = "•";
      tooltip = `${key} - Chưa học`;
    }

    days.push(
      `<span class="week-day ${stateClass} ${isToday ? 'today' : ''}" title="${esc(tooltip)}">
        <span>${esc(weekday)}</span>
        <b class="week-dot">${dotHtml}</b>
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
    showAppLoader("Đang tạo tài khoản & nạp quà tân thủ… 🌸", "Tặng ngay 50 Đá quý 💎 và 1 Đóng băng chuỗi ❄️ chào mừng!");
    setAppLoaderProgress(35);
    const res = await api("/api/auth/register", {
      method: "POST",
      body: { username, password, fullName }
    });
    setAppLoaderProgress(70);
    playSound("fanfare");
    showToast(res.message);
    state.profile = res.user;
    state.stats = res.stats;
    await loadAuthenticatedData();
    setAppLoaderProgress(100);
  } catch (err) {
    playSound("wrong");
    showToast(err.message, true);
  } finally {
    hideAppLoader();
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
    showAppLoader("Đang đăng nhập vào 3TG… ✨", "Thỏ Bảy Màu đang mở khóa không gian học tập của bạn…");
    setAppLoaderProgress(35);
    const res = await api("/api/auth/login", {
      method: "POST",
      body: { username, password }
    });
    setAppLoaderProgress(70);
    playSound("fanfare");
    showToast(res.message);
    state.profile = res.user;
    state.stats = res.stats;
    await loadAuthenticatedData();
    setAppLoaderProgress(100);
  } catch (err) {
    playSound("wrong");
    showToast(err.message, true);
  } finally {
    hideAppLoader();
  }
};

async function loadAuthenticatedData() {
  try {
    const [subRes, overviewRes, reviewRes, academicRes] = await Promise.all([
      api("/api/subjects"),
      api("/api/overview").catch(() => null),
      api("/api/review").catch(() => ({ mistakes: [] })),
      api("/api/academic/transcript").catch(() => null)
    ]);
    state.subjects = subRes.subjects || [];
    if (state.subjects.length && !state.currentSubjectId) {
      state.currentSubjectId = state.subjects[0].id;
    }
    state.overview = overviewRes;
    state.reviewMistakes = reviewRes.mistakes || [];
    if (academicRes && academicRes.hasTranscript) {
      state.academicTranscript = academicRes;
    }
    if (overviewRes) {
      if (overviewRes.stats) state.stats = overviewRes.stats;
      if (overviewRes.profile) state.profile = Object.assign({}, state.profile, overviewRes.profile);
      if (overviewRes.inventory) state.inventory = overviewRes.inventory;
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
  const isEditing = note.id == null || state.editingNoteIds.has(noteKey);
  if (!isEditing) {
    const contentHtml = noteBodyHtml(parsedContent).trim();
    const linkedLabel = linkedLesson
      ? `📌 ${esc(note.subject_name || "Môn học")} · ${esc(note.lesson_title || "Bài học")}`
      : `📓 ${esc(note.subject_name || "Ghi chú tự do")}`;
    return `
      <article class="note-card note-card-readonly note-card-${palettes[index % palettes.length]} note-paper-${parsedContent.style.paper} note-font-${parsedContent.style.font} note-editor" data-note-index="${index}" data-note-style="${styleJson}" data-note-id="${esc(noteKey)}" data-note-subject="${esc(note.subject_id || "")}" data-note-lesson="${esc(note.lesson_id || "")}">
        <div class="note-card-topline"><span class="note-card-meta">${meta}</span><span class="note-save-state">Đã lưu</span></div>
        <h3 class="note-preview-title">${esc(note.title || "Ghi chú mới")}</h3>
        <div class="note-preview-content">${contentHtml || '<span class="note-content-empty">Chưa có nội dung ghi chú.</span>'}</div>
        ${renderNoteDrawingPreview(parsedContent.style)}
        <div class="note-card-view-footer"><span class="note-linked-label">${linkedLabel}</span><div class="note-view-actions"><button type="button" class="note-edit-btn" onclick="editStudentNote(this)">✏️ Chỉnh sửa</button><button type="button" class="note-delete-btn" onclick="deleteStudentNote(this)" aria-label="Xóa ghi chú">Xóa</button></div></div>
      </article>`;
  }
  return `
    <article class="note-card note-card-${palettes[index % palettes.length]} note-paper-${parsedContent.style.paper} note-font-${parsedContent.style.font} note-editor" data-note-index="${index}" data-note-style="${styleJson}" data-note-id="${esc(noteKey)}" data-note-subject="${esc(note.subject_id || "")}" data-note-lesson="${esc(note.lesson_id || "")}">
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
    const title = card.querySelector("[data-note-field='title']")?.value || card.querySelector(".note-preview-title")?.textContent || "";
    const content = card.querySelector("[data-note-field='content']")?.innerText || card.querySelector(".note-preview-content")?.innerText || "";
    const meta = card.querySelector(".note-card-meta")?.textContent || "";
    card.hidden = Boolean(needle && !`${title} ${content} ${meta}`.toLocaleLowerCase("vi").includes(needle));
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
  state.editingNoteIds.add(tempId);
  state.notes.unshift({ id: null, _tempId: tempId, subject_id: state.noteSubjectId || null, lesson_id: null, title: "Ghi chú mới", content: "", subject_name: "", lesson_title: "" });
  state.noteLessonId = "";
  render();
  const card = document.querySelector(`[data-note-id="${tempId}"]`);
  card?.querySelector("[data-note-field='content']")?.focus();
  if (card) window.queueNoteSave(card.querySelector("[data-note-field='title']"));
};

window.editStudentNote = function(button) {
  const card = button.closest(".note-card");
  const key = card?.dataset.noteId;
  const note = state.notes.find(item => String(item.id) === String(key) || item._tempId === key);
  if (!card || !note) return;
  state.editingNoteIds.add(String(note.id ?? note._tempId));
  const index = Number(card.dataset.noteIndex || 0);
  card.insertAdjacentHTML("beforebegin", renderNoteCard(note, index));
  const editor = card.previousElementSibling;
  card.remove();
  editor?.querySelector("[data-note-field='content']")?.focus();
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
    if (state.editingNoteIds.delete(String(oldTemp))) state.editingNoteIds.add(String(saved.id));
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
  if (saved && editor.classList.contains("note-card")) {
    const savedId = String(editor.dataset.noteId || key);
    state.editingNoteIds.delete(savedId);
    if (activeFullscreenNoteEditor === editor) window.closeNoteFullscreen();
    const note = state.notes.find(item => String(item.id) === savedId);
    if (note && editor.isConnected) {
      const index = Number(editor.dataset.noteIndex || 0);
      editor.outerHTML = renderNoteCard(note, index);
      return;
    }
  }
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
  state.editingNoteIds.delete(String(key));
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

window.claimLeaderboardReward = async function(weekStart) {
  try {
    playSound("click");
    const res = await api("/api/leaderboard/claim", {
      method: "POST",
      body: { weekStart }
    });
    playSound("fanfare");
    showToast(`Chúc mừng! Bạn đã nhận phần thưởng Top ${res.rank}: +${res.gemsAwarded} 💎 Đá quý! 🏆`);
    state.stats = res.stats;
    updateShell();
    if (leaderboardData) leaderboardData.pendingReward = null;
    render();
  } catch (err) {
    playSound("wrong");
    showToast(err.message, true);
  }
};

function renderLeaderboard() {
  if (!leaderboardData) {
    fetchLeaderboard();
    return `<div class="loading-shell"><span class="loading-flower">✿</span><span>Đang tải bảng xếp hạng...</span></div>`;
  }

  const rows = leaderboardData.rows || [];
  const pendingReward = leaderboardData.pendingReward;

  const rowsHtml = rows.map((row) => {
    const isMe = row.isMe;
    const medal = row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : `${row.rank}`;
    const avatarDecorated = renderDecoratedAvatar(row.avatar_url, row.avatar_decoration, 34, row.full_name);

    let prizeBadge = "";
    if (row.rank === 1) prizeBadge = '<span class="lb-prize-pill gold">+100 💎</span>';
    else if (row.rank === 2) prizeBadge = '<span class="lb-prize-pill silver">+60 💎</span>';
    else if (row.rank === 3) prizeBadge = '<span class="lb-prize-pill bronze">+40 💎</span>';

    return `
      <div class="leader-row ${isMe ? 'me' : ''}" onclick="openUserProfileModal('${esc(row.user_id)}')" title="Nhấp để xem hồ sơ & kết bạn 👤">
        <span class="leader-rank">${medal}</span>
        ${avatarDecorated}
        <span class="leader-name">
          ${esc(row.full_name)} ${isMe ? '<strong style="color:var(--lumi-pink);">(Bạn)</strong>' : ''}
        </span>
        <div style="display:flex; align-items:center; gap:8px; margin-left:auto;">
          ${prizeBadge}
          <span class="leader-xp">${row.weekly_xp} XP</span>
        </div>
        <span style="font-size:12px; color:var(--lumi-pink); font-weight:800; margin-left:12px;">Hồ sơ ➔</span>
      </div>
    `;
  }).join("");

  return `
    <div class="leaderboard-wrap">
      <div class="league-banner" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div style="flex:1; min-width:260px;">
          <span style="font-size:42px;">🏆</span>
          <h1 style="font-size:26px; font-weight:900; margin-top:8px;">Giải đấu Tuần — Thưởng Đá Quý 💎</h1>
          <p style="font-size:14px; opacity:0.95; margin-top:4px;">
            Bảng xếp hạng. Top 1, 2, 3 mỗi tuần nhận kim cương siêu khủng! Bấm vào bất kỳ học viên nào để <strong>Soi acc, kết bạn và nhắn tin</strong> nhé.
          </p>
        </div>
        <div class="banner-mascot-aside page-inline-mascot">
          ${renderThoBayMau({ state: THO_STATES.KING_CHAMPION, size: 132, speech: "Đua Top 1 2 3 tuần này để ẵm kim cương nào! 💎👑", speechDirection: "top" })}
        </div>
      </div>

      ${pendingReward ? `
        <div class="lb-claim-banner" style="background:linear-gradient(135deg, #fffbeb, #fef3c7); border:3px solid #f59e0b; border-radius:24px; padding:20px 24px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; gap:16px; box-shadow:0 6px 0 #d97706;">
          <div style="display:flex; align-items:center; gap:16px;">
            <span style="font-size:38px;">🎉</span>
            <div>
              <h3 style="margin:0; font-size:18px; font-weight:900; color:#92400e;">Chúc mừng bạn đã đạt Top ${pendingReward.rank} Tuần Trước!</h3>
              <p style="margin:4px 0 0; font-size:13.5px; color:#b45309;">Nhận ngay phần thưởng vinh quang: <strong>+${pendingReward.gems} 💎 Đá quý</strong></p>
            </div>
          </div>
          <button type="button" class="btn-duo btn-duo-pink" style="padding:12px 24px; font-size:15px; white-space:nowrap;" onclick="claimLeaderboardReward('${pendingReward.weekStart}')">
            🎁 Nhận Thưởng Ngay
          </button>
        </div>
      ` : ''}

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
// HỒ SƠ CÔNG KHAI HỌC VIÊN ("SOI ACC" & KẾT BẠN)
// ========================================================
window.openUserProfileModal = async function(userId) {
  if (!userId) return;
  playSound("click");
  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return;

  modalRoot.innerHTML = `
    <div class="user-profile-modal-overlay" onclick="closeUserProfileModal(event)">
      <div class="user-profile-card" onclick="event.stopPropagation()">
        <button type="button" class="user-profile-close-btn" onclick="closeUserProfileModal()">✕</button>
        <div style="padding:40px 20px; text-align:center;">
          <span class="quiz-spinner" style="width:24px; height:24px; border-width:3px;"></span>
          <p style="margin-top:10px; font-weight:700; color:var(--ink-500);">Đang lấy thông tin...</p>
        </div>
      </div>
    </div>
  `;

  try {
    const res = await api(`/api/users/${userId}`);
    const prof = res.profile;
    const stats = res.stats;
    const isSelf = res.isSelf;
    const isFriend = res.isFriend;

    let avatarContent = "";
    if (prof.avatar_url) {
      if (prof.avatar_url.startsWith("mascot:")) {
        const key = prof.avatar_url.slice(7);
        if (window.renderThoBayMau && window.THO_METADATA && window.THO_METADATA[key]) {
          avatarContent = renderThoBayMau({ state: key, size: 76 });
        } else {
          avatarContent = esc(key);
        }
      } else {
        avatarContent = `<img src="${esc(prof.avatar_url)}" alt="">`;
      }
    } else {
      avatarContent = esc(Array.from(prof.full_name || "L")[0] || "L");
    }

    const coverStyle = prof.cover_url
      ? `background-image: url('${esc(prof.cover_url)}');`
      : `background: linear-gradient(135deg, #ff71a2, #ff4b82, #c084fc);`;

    modalRoot.innerHTML = `
      <div class="user-profile-modal-overlay" onclick="closeUserProfileModal(event)">
        <div class="user-profile-card" style="position:relative; overflow:hidden;" onclick="event.stopPropagation()">
          ${renderProfileEffectHtml(prof.profile_effect)}
          <button type="button" class="user-profile-close-btn" style="z-index:10;" onclick="closeUserProfileModal()">✕</button>
          
          <div class="user-profile-cover" style="${coverStyle}"></div>

          <div class="user-profile-body" style="position:relative; z-index:2;">
            <div class="user-profile-avatar-row">
              <div class="user-profile-avatar-wrap" style="overflow:visible; display:flex; align-items:center; justify-content:center;">
                ${renderDecoratedAvatar(prof.avatar_url, prof.avatar_decoration, 84, prof.full_name)}
              </div>
              <div class="user-profile-actions">
                ${isSelf ? `
                  <button type="button" class="btn-duo btn-duo-purple" style="padding:8px 14px; font-size:12.5px; background:#5865f2; color:#fff;" onclick="closeUserProfileModal(); state.page='shop'; render();">
                    ✨ Hiệu ứng Nitro
                  </button>
                  <button type="button" class="btn-duo btn-duo-pink" style="padding:8px 16px; font-size:13px;" onclick="closeUserProfileModal(); state.page='settings'; render();">
                    ✏️ Sửa hồ sơ
                  </button>
                ` : `
                  <button type="button" id="btn-toggle-friend-${esc(prof.user_id)}" class="btn-duo ${isFriend ? 'btn-duo-white' : 'btn-duo-pink'}" style="padding:8px 16px; font-size:13px;" onclick="toggleFriendship('${esc(prof.user_id)}')">
                    ${isFriend ? '✓ Bạn bè (Hủy)' : '➕ Kết bạn'}
                  </button>
                  <button type="button" class="btn-duo btn-duo-pink" style="padding:8px 16px; font-size:13px;" onclick="closeUserProfileModal(); openDirectChat('${esc(prof.user_id)}')">
                    💬 Nhắn tin
                  </button>
                `}
              </div>
            </div>

            <h2 class="user-profile-name">${esc(prof.full_name || "Học viên 3TG")}</h2>
            <div class="user-profile-handle">@${esc(prof.username || "hocvien")}</div>

            ${prof.bio ? `<div class="user-profile-bio">${esc(prof.bio)}</div>` : ''}

            <div class="user-profile-meta">
              ${prof.school ? `<span>🏫 ${esc(prof.school)}</span>` : '<span>🏫 Đại học</span>'}
              ${prof.major ? `<span>🎓 ${esc(prof.major)}</span>` : '<span>🎓 Sinh viên</span>'}
              <span>📅 Tham gia: ${esc(String(prof.created_at || '').slice(0, 10))}</span>
            </div>

            <div class="user-profile-stats-grid">
              <div class="user-profile-stat-box">
                <span class="user-profile-stat-icon">⭐</span>
                <div>
                  <div class="user-profile-stat-val">${stats.total_xp || 0}</div>
                  <div class="user-profile-stat-lbl">Tổng điểm XP</div>
                </div>
              </div>
              <div class="user-profile-stat-box">
                <span class="user-profile-stat-icon">🔥</span>
                <div>
                  <div class="user-profile-stat-val">${stats.current_streak || 0} ngày</div>
                  <div class="user-profile-stat-lbl">Chuỗi Streak</div>
                </div>
              </div>
              <div class="user-profile-stat-box">
                <span class="user-profile-stat-icon">🏆</span>
                <div>
                  <div class="user-profile-stat-val">${esc(res.league || "Bronze")}</div>
                  <div class="user-profile-stat-lbl">Giải đấu tuần</div>
                </div>
              </div>
              <div class="user-profile-stat-box">
                <span class="user-profile-stat-icon">📚</span>
                <div>
                  <div class="user-profile-stat-val">${res.completedLessons || 0} bài</div>
                  <div class="user-profile-stat-lbl">Đã hoàn thành</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    showToast(err.message || "Không thể tải hồ sơ học viên.", true);
    closeUserProfileModal();
  }
};

window.closeUserProfileModal = function(e) {
  if (e && e.target && !e.target.classList.contains("user-profile-modal-overlay") && !e.target.classList.contains("user-profile-close-btn")) {
    return;
  }
  const modalRoot = document.getElementById("modal-root");
  if (modalRoot) modalRoot.innerHTML = "";
};

window.toggleFriendship = async function(targetUserId) {
  playSound("click");
  try {
    const res = await api("/api/friends/toggle", {
      method: "POST",
      body: { targetUserId }
    });
    showToast(res.message);
    const btn = document.getElementById(`btn-toggle-friend-${targetUserId}`);
    if (btn) {
      if (res.isFriend) {
        btn.className = "btn-duo btn-duo-white";
        btn.textContent = "✓ Bạn bè (Hủy)";
      } else {
        btn.className = "btn-duo btn-duo-pink";
        btn.textContent = "➕ Kết bạn";
      }
    }
    // Refresh friends list if currently on friends page
    if (state.page === "friends") {
      fetchFriends();
    }
  } catch (err) {
    showToast(err.message, true);
  }
};

// ========================================================
// HỘP THOẠI NHẮN TIN 1-1 TRỰC TIẾP (DIRECT MESSAGES)
// ========================================================
let chatPollInterval = null;

window.openDirectChat = async function(targetUserId) {
  if (!targetUserId) return;
  playSound("click");
  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return;

  modalRoot.innerHTML = `
    <div class="user-profile-modal-overlay" onclick="closeDirectChat(event)">
      <div class="direct-chat-modal" onclick="event.stopPropagation()">
        <div class="chat-header">
          <div class="chat-header-user">
            <span class="chat-header-avatar">✿</span>
            <div>
              <h4 class="chat-header-title">Đang kết nối tin nhắn...</h4>
              <span class="chat-header-subtitle">Trò chuyện trực tiếp</span>
            </div>
          </div>
          <button type="button" class="user-profile-close-btn" style="position:static;" onclick="closeDirectChat()">✕</button>
        </div>
        <div class="chat-messages-container" id="chat-messages-container">
          <div style="padding:40px; text-align:center;"><span class="quiz-spinner"></span></div>
        </div>
      </div>
    </div>
  `;

  async function loadChatMessages() {
    try {
      const data = await api(`/api/messages/${targetUserId}`);
      const targetUser = data.targetUser || {};
      const messages = data.messages || [];

      let avatarHtml = targetUser.avatar_url
        ? `<img src="${esc(targetUser.avatar_url)}" alt="">`
        : esc(Array.from(targetUser.full_name || "L")[0] || "L");

      const msgsHtml = messages.length ? messages.map(m => `
        <div class="chat-bubble-wrap ${m.isMine ? 'mine' : 'other'}">
          <div class="chat-bubble">${esc(m.message)}</div>
          <span class="chat-time">${esc(String(m.createdAt || '').slice(11, 16))}</span>
        </div>
      `).join("") : `
        <div style="text-align:center; padding:30px 16px; color:var(--ink-400);">
          ${renderThoBayMau({ state: THO_STATES.CHEERING, size: 100, speech: "Gửi lời chào đầu tiên nào! 💬" })}
          <p style="font-weight:700; margin-top:10px;">Chưa có tin nhắn nào giữa hai bạn.</p>
          <span style="font-size:13px;">Hãy gửi một tin nhắn hoặc sticker bên dưới để bắt đầu trò chuyện nhé!</span>
        </div>
      `;

      modalRoot.innerHTML = `
        <div class="user-profile-modal-overlay" onclick="closeDirectChat(event)">
          <div class="direct-chat-modal" onclick="event.stopPropagation()">
            <div class="chat-header">
              <div class="chat-header-user" onclick="openUserProfileModal('${esc(targetUserId)}')">
                <span class="chat-header-avatar">${avatarHtml}</span>
                <div>
                  <h4 class="chat-header-title">${esc(targetUser.full_name || "Học viên")}</h4>
                  <span class="chat-header-subtitle">● Đang hoạt động • Nhấp xem hồ sơ</span>
                </div>
              </div>
              <button type="button" class="user-profile-close-btn" style="position:static;" onclick="closeDirectChat()">✕</button>
            </div>

            <div class="chat-messages-container" id="chat-messages-container">
              ${msgsHtml}
            </div>

            <div class="chat-footer-bar">
              <div class="chat-quick-emojis">
                <span class="chat-emoji-pill" onclick="sendQuickEmoji('👋 Chào bạn!', '${esc(targetUserId)}')">👋 Chào bạn</span>
                <span class="chat-emoji-pill" onclick="sendQuickEmoji('🐰 Cùng học bài nhé!', '${esc(targetUserId)}')">🐰 Cùng học bài</span>
                <span class="chat-emoji-pill" onclick="sendQuickEmoji('🔥 Quyết tâm giữ Streak!', '${esc(targetUserId)}')">🔥 Giữ Streak</span>
                <span class="chat-emoji-pill" onclick="sendQuickEmoji('⭐ Cố lên nhé!', '${esc(targetUserId)}')">⭐ Cố lên</span>
                <span class="chat-emoji-pill" onclick="sendQuickEmoji('🎉 Chúc mừng bạn!', '${esc(targetUserId)}')">🎉 Chúc mừng</span>
              </div>
              <form class="chat-input-row" onsubmit="event.preventDefault(); sendDirectMessage('${esc(targetUserId)}');">
                <input type="text" id="direct-chat-input" class="chat-input" placeholder="Nhập tin nhắn..." autocomplete="off" maxlength="500">
                <button type="submit" class="btn-duo btn-duo-pink" style="padding:10px 18px; font-size:14px;">
                  Gửi ➔
                </button>
              </form>
            </div>
          </div>
        </div>
      `;

      const box = document.getElementById("chat-messages-container");
      if (box) box.scrollTop = box.scrollHeight;

      const inp = document.getElementById("direct-chat-input");
      if (inp) inp.focus();

    } catch (err) {
      showToast(err.message, true);
      closeDirectChat();
    }
  }

  await loadChatMessages();

  if (chatPollInterval) clearInterval(chatPollInterval);
  chatPollInterval = setInterval(async () => {
    const box = document.getElementById("chat-messages-container");
    if (!box) {
      clearInterval(chatPollInterval);
      chatPollInterval = null;
      return;
    }
    try {
      const data = await api(`/api/messages/${targetUserId}`);
      const messages = data.messages || [];
      const msgsHtml = messages.map(m => `
        <div class="chat-bubble-wrap ${m.isMine ? 'mine' : 'other'}">
          <div class="chat-bubble">${esc(m.message)}</div>
          <span class="chat-time">${esc(String(m.createdAt || '').slice(11, 16))}</span>
        </div>
      `).join("");
      box.innerHTML = msgsHtml;
    } catch {}
  }, 4000);
};

window.closeDirectChat = function(e) {
  if (e && e.target && !e.target.classList.contains("user-profile-modal-overlay") && !e.target.classList.contains("user-profile-close-btn")) {
    return;
  }
  if (chatPollInterval) {
    clearInterval(chatPollInterval);
    chatPollInterval = null;
  }
  const modalRoot = document.getElementById("modal-root");
  if (modalRoot) modalRoot.innerHTML = "";
};

window.sendDirectMessage = async function(targetUserId) {
  const inp = document.getElementById("direct-chat-input");
  if (!inp) return;
  const text = inp.value.trim();
  if (!text) return;
  inp.value = "";
  playSound("click");

  const box = document.getElementById("chat-messages-container");
  if (box) {
    const div = document.createElement("div");
    div.className = "chat-bubble-wrap mine";
    div.innerHTML = `<div class="chat-bubble">${esc(text)}</div><span class="chat-time">Vừa xong</span>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  try {
    await api(`/api/messages/${targetUserId}`, {
      method: "POST",
      body: { message: text }
    });
  } catch (err) {
    showToast(err.message, true);
  }
};

window.sendQuickEmoji = function(text, targetUserId) {
  const inp = document.getElementById("direct-chat-input");
  if (inp) inp.value = text;
  sendDirectMessage(targetUserId);
};

// ========================================================
// TRANG BẠN BÈ & KẾT NỐI (FRIENDS HUB)
// ========================================================
let friendsData = null;
let conversationsData = null;
let searchFriendsResults = null;
let currentFriendsTab = "messages"; // Tin nhắn là phần chính mặc định!

async function fetchFriends() {
  try {
    const res = await api("/api/friends");
    friendsData = res.friends || [];
    render();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function fetchConversations() {
  try {
    const res = await api("/api/messages/conversations");
    conversationsData = res.conversations || [];
    const totalUnread = conversationsData.reduce((s, c) => s + (Number(c.unreadCount) || 0), 0);
    
    // Cập nhật thông báo tin nhắn trên sidebar
    const navBadge = document.getElementById("nav-friends-count");
    if (navBadge) {
      if (totalUnread > 0) {
        navBadge.style.display = "inline-flex";
        navBadge.textContent = totalUnread;
        navBadge.className = "nav-count friends-count badge-unread-pulse";
      } else {
        navBadge.style.display = "none";
      }
    }
    const mobileBadge = document.getElementById("mobile-friends-badge");
    if (mobileBadge) {
      mobileBadge.style.display = totalUnread > 0 ? "inline-block" : "none";
      mobileBadge.textContent = totalUnread;
    }

    render();
  } catch (err) {
    showToast(err.message, true);
  }
}

window.searchFriendsInput = async function(val) {
  const q = String(val || "").trim();
  if (!q) {
    searchFriendsResults = null;
    render();
    return;
  }
  try {
    const res = await api(`/api/friends/search?q=${encodeURIComponent(q)}`);
    searchFriendsResults = res.users || [];
    render();
  } catch (err) {
    showToast(err.message, true);
  }
};

window.switchFriendsTab = function(tab) {
  playSound("click");
  currentFriendsTab = tab;
  if (tab === "friends" && !friendsData) fetchFriends();
  if (tab === "messages") fetchConversations();
  render();
};

function renderFriends() {
  if (currentFriendsTab === "messages" && !conversationsData) {
    fetchConversations();
    return `<div class="loading-shell"><span class="loading-flower">✿</span><span>Đang tải tin nhắn...</span></div>`;
  }
  if (currentFriendsTab === "friends" && !friendsData) {
    fetchFriends();
    return `<div class="loading-shell"><span class="loading-flower">✿</span><span>Đang tải danh sách bạn bè từ Cloudflare D1...</span></div>`;
  }

  const friends = friendsData || [];
  const convos = conversationsData || [];
  const totalUnread = convos.reduce((s, c) => s + (Number(c.unreadCount) || 0), 0);

  return `
    <div class="friends-hub-wrap">
      <div class="banner-with-mascot" style="margin-bottom:20px;">
        <div style="flex:1;">
          <h1 class="page-title" style="margin-bottom:6px;">Bạn bè & Nhắn tin 👥</h1>
          <p class="page-subtitle" style="margin:0 0 14px 0;">Trò chuyện 1-1 trực tiếp, kết bạn và học cùng nhau trên Cloudflare D1!</p>
          
          <!-- THANH TAB GỌN GÀNG ĐỒNG NHẤT KHÔNG RỚT DÒNG -->
          <div class="friends-tab-bar">
            <button type="button" class="friends-tab-btn ${currentFriendsTab === 'messages' ? 'active' : ''}" onclick="switchFriendsTab('messages')">
              <span>💬 Tin nhắn</span>
              ${totalUnread > 0 ? `<span class="tab-unread-pill">${totalUnread} mới</span>` : `<span class="tab-count-pill">${convos.length}</span>`}
            </button>
            <button type="button" class="friends-tab-btn ${currentFriendsTab === 'friends' ? 'active' : ''}" onclick="switchFriendsTab('friends')">
              <span>👥 Bạn bè</span>
              <span class="tab-count-pill">${friends.length}</span>
            </button>
            <button type="button" class="friends-tab-btn ${currentFriendsTab === 'search' ? 'active' : ''}" onclick="switchFriendsTab('search')">
              <span>🔍 Tìm học viên</span>
            </button>
          </div>
        </div>
        <div class="banner-mascot-aside page-inline-mascot">
          ${renderThoBayMau({ state: THO_STATES.CHEERING, size: 126, speech: "Học cùng bạn bè là vui nhất! 🌟", speechDirection: "top" })}
        </div>
      </div>

      ${currentFriendsTab === 'friends' ? `
        <div class="friends-list-container">
          ${friends.length ? friends.map(f => {
            const avatarHtml = f.avatar_url
              ? `<img src="${esc(f.avatar_url)}" alt="">`
              : Array.from(f.full_name || "L")[0] || "L";
            return `
              <div class="friend-card">
                <div class="friend-info-left" onclick="openUserProfileModal('${esc(f.friend_user_id)}')">
                  <span class="friend-avatar-badge">${avatarHtml}</span>
                  <div>
                    <h3 style="font-size:16.5px; font-weight:900; margin:0 0 2px 0; color:var(--ink-900);">
                      ${esc(f.full_name)}
                    </h3>
                    <div style="font-size:12.5px; color:var(--ink-500); font-weight:700;">
                      @${esc(f.username || 'hocvien')} • ⭐ ${f.total_xp} XP • 🔥 ${f.current_streak} ngày
                    </div>
                    ${f.school ? `<div style="font-size:11.5px; color:var(--lumi-pink); margin-top:2px;">🏫 ${esc(f.school)}</div>` : ''}
                  </div>
                </div>
                <div class="friend-card-actions">
                  <button type="button" class="btn-duo btn-duo-pink" style="padding:8px 16px; font-size:13px;" onclick="openDirectChat('${esc(f.friend_user_id)}')">
                    💬 Nhắn tin
                  </button>
                  <button type="button" class="btn-duo btn-duo-white" style="padding:8px 14px; font-size:13px;" onclick="openUserProfileModal('${esc(f.friend_user_id)}')">
                    Hồ sơ
                  </button>
                </div>
              </div>
            `;
          }).join("") : `
            <div class="empty-state" style="background:#fff; border:2.5px dashed var(--lumi-pink-border); border-radius:28px; padding:44px 20px; text-align:center;">
              <span style="font-size:48px;">👥</span>
              <h3 style="font-weight:900; color:var(--ink-900); font-size:20px; margin-top:12px;">Bạn chưa có người bạn nào!</h3>
              <p style="font-size:14.5px; color:var(--ink-500); max-width:420px; margin:6px auto 18px;">Hãy sang tab Tìm kiếm học viên hoặc vào Bảng xếp hạng để soi hồ sơ và bấm Kết bạn nhé!</p>
              <button type="button" class="btn-duo btn-duo-pink" style="padding:10px 22px;" onclick="switchFriendsTab('search')">
                🔍 Tìm kiếm học viên ngay ➔
              </button>
            </div>
          `}
        </div>
      ` : currentFriendsTab === 'search' ? `
        <div class="friends-search-container">
          <div style="background:#fff; border:2.5px solid var(--ink-900); border-radius:22px; padding:18px 24px; box-shadow:0 6px 0 var(--ink-900); margin-bottom:20px;">
            <div style="display:flex; gap:12px; align-items:center;">
              <span style="font-size:20px;">🔍</span>
              <input type="text" class="chat-input" placeholder="Tìm kiếm theo Tên học viên, Tên đăng nhập (@username) hoặc Trường..." oninput="searchFriendsInput(this.value)" autofocus style="font-size:15px; border-radius:14px;">
            </div>
            <p style="font-size:12.5px; color:var(--ink-500); margin:8px 0 0 32px;">Gợi ý: Nhập tên bạn bè hoặc trường học để kết nối trực tiếp từ Cloudflare D1.</p>
          </div>

          <div class="friends-search-results">
            ${searchFriendsResults ? (searchFriendsResults.length ? searchFriendsResults.map(u => {
              const avatarHtml = u.avatar_url
                ? `<img src="${esc(u.avatar_url)}" alt="">`
                : Array.from(u.full_name || "L")[0] || "L";
              return `
                <div class="friend-card">
                  <div class="friend-info-left" onclick="openUserProfileModal('${esc(u.user_id)}')">
                    <span class="friend-avatar-badge">${avatarHtml}</span>
                    <div>
                      <h3 style="font-size:16px; font-weight:900; margin:0 0 2px 0; color:var(--ink-900);">
                        ${esc(u.full_name)}
                      </h3>
                      <div style="font-size:12.5px; color:var(--ink-500); font-weight:700;">
                        @${esc(u.username || 'hocvien')} • ⭐ ${u.total_xp} XP
                      </div>
                      ${u.school ? `<div style="font-size:11.5px; color:var(--lumi-pink);">🏫 ${esc(u.school)}</div>` : ''}
                    </div>
                  </div>
                  <div class="friend-card-actions">
                    <button type="button" class="btn-duo ${u.is_friend ? 'btn-duo-white' : 'btn-duo-pink'}" style="padding:8px 16px; font-size:13px;" onclick="toggleFriendship('${esc(u.user_id)}')">
                      ${u.is_friend ? '✓ Đã kết bạn' : '➕ Kết bạn'}
                    </button>
                    <button type="button" class="btn-duo btn-duo-white" style="padding:8px 14px; font-size:13px;" onclick="openUserProfileModal('${esc(u.user_id)}')">
                      Hồ sơ
                    </button>
                  </div>
                </div>
              `;
            }).join("") : `
              <div style="text-align:center; padding:32px; color:var(--ink-400); font-weight:700;">
                Không tìm thấy học viên nào phù hợp với từ khóa này.
              </div>
            `) : `
              <div style="text-align:center; padding:36px; color:var(--ink-400); font-weight:700;">
                Nhập tên hoặc username vào ô tìm kiếm ở trên để tìm học viên nhé! 🔎
              </div>
            `}
          </div>
        </div>
      ` : `
        <div class="friends-messages-container">
          ${convos.length ? convos.map(c => {
            const u = c.user;
            const avatarHtml = u.avatar_url
              ? `<img src="${esc(u.avatar_url)}" alt="">`
              : Array.from(u.full_name || "L")[0] || "L";
            return `
              <div class="friend-card" style="cursor:pointer;" onclick="openDirectChat('${esc(u.user_id)}')">
                <div class="friend-info-left">
                  <span class="friend-avatar-badge">${avatarHtml}</span>
                  <div>
                    <h3 style="font-size:16px; font-weight:900; margin:0 0 3px 0; color:var(--ink-900);">
                      ${esc(u.full_name)}
                    </h3>
                    <div style="font-size:13.5px; color:var(--ink-700); font-weight:600; max-width:440px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                      ${c.isMine ? '<strong>Bạn:</strong> ' : ''}${esc(c.lastMessage)}
                    </div>
                  </div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
                  <span style="font-size:11px; font-weight:700; color:var(--ink-400);">${esc(String(c.lastTime || '').slice(11, 16))}</span>
                  ${c.unreadCount ? `<span style="background:#ef4444; color:#fff; font-size:10.5px; font-weight:900; padding:2px 7px; border-radius:999px;">${c.unreadCount} mới</span>` : ''}
                  <button type="button" class="btn-duo btn-duo-pink" style="padding:6px 12px; font-size:12.5px;">Mở chat ➔</button>
                </div>
              </div>
            `;
          }).join("") : `
            <div class="empty-state" style="background:#fff; border:2.5px dashed var(--lumi-pink-border); border-radius:28px; padding:40px 20px; text-align:center;">
              <div style="display:flex; justify-content:center; margin-bottom:12px;">
                ${renderThoBayMau({ state: THO_STATES.CONFUSED_PHONE, size: 120, speech: "Hộp thư chưa có tin nhắn nào nè! Kết bạn rồi trò chuyện nhé! 💬", speechDirection: "top" })}
              </div>
              <h3 style="font-weight:900; color:var(--ink-900); font-size:20px; margin-top:10px;">Chưa có tin nhắn nào</h3>
              <p style="font-size:14.5px; color:var(--ink-500); max-width:440px; margin:6px auto 20px;">Hộp thư của bạn hiện đang trống. Hãy kết bạn hoặc tìm kiếm học viên khác để bắt đầu trò chuyện nhé!</p>
              <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
                <button type="button" class="btn-duo btn-duo-pink" style="padding:10px 22px; font-size:14px;" onclick="switchFriendsTab('search')">
                  🔍 Tìm kiếm học viên ➔
                </button>
                <button type="button" class="btn-duo btn-duo-white" style="padding:10px 22px; font-size:14px;" onclick="switchFriendsTab('friends')">
                  👥 Danh sách bạn bè ➔
                </button>
              </div>
            </div>
          `}
        </div>
      `}
    </div>
  `;
}

// ========================================================
// DISCORD-STYLE PROFILE EFFECTS & AVATAR DECORATIONS
// ========================================================
export const DISCORD_EFFECTS_REGISTRY = {
  deco_cyber_neon: {
    code: "deco_cyber_neon",
    name: "Khung Neon Cyberpunk 2077",
    type: "avatar_decoration",
    category: "decoration",
    badge: "Cyber Nitro",
    color: "#00f0ff",
    description: "Vòng xoay năng lượng công nghệ cao phát quang tia sét neon xanh lam & tím rực rỡ chuẩn Discord Nitro.",
    price: 0
  },
  deco_sakura_bloom: {
    code: "deco_sakura_bloom",
    name: "Vòng Hoa Anh Đào Sakura",
    type: "avatar_decoration",
    category: "decoration",
    badge: "Sakura Nitro",
    color: "#ff71a2",
    description: "Cánh hoa anh đào lượn sóng xoay vòng và rơi lấp lánh nhẹ nhàng quanh ảnh đại diện.",
    price: 0
  },
  deco_flame_dragon: {
    code: "deco_flame_dragon",
    name: "Hào Quang Hỏa Long Siêu Cấp",
    type: "avatar_decoration",
    category: "decoration",
    badge: "Flame Nitro",
    color: "#ff7b00",
    description: "Ngọn lửa rực cháy đỏ cam bập bùng dữ dội bao quanh avatar cực kỳ chiến và nổi bật.",
    price: 0
  },
  deco_galaxy_portal: {
    code: "deco_galaxy_portal",
    name: "Cổng Vũ Trụ Tinh Vân Galaxy",
    type: "avatar_decoration",
    category: "decoration",
    badge: "Cosmic Nitro",
    color: "#a855f7",
    description: "Vòng xoáy không gian vũ trụ huyền ảo với bụi sao lấp lánh và tinh vân xoay tròn kỳ ảo.",
    price: 0
  },
  deco_retro_glitch: {
    code: "deco_retro_glitch",
    name: "Hiệu Ứng Glitch Hacker Ma Trận",
    type: "avatar_decoration",
    category: "decoration",
    badge: "Glitch Nitro",
    color: "#06b6d4",
    description: "Nhiễu sóng điện tử RGB glitch nhấp nháy chuyển động phong cách hacker công nghệ.",
    price: 0
  },
  fx_matrix_rain: {
    code: "fx_matrix_rain",
    name: "Hiệu Ứng Hồ Sơ: Ma Trận Số Cyber",
    type: "profile_effect",
    category: "effect",
    badge: "Matrix FX",
    color: "#22c55e",
    description: "Dòng mưa mã nhị phân màu xanh lá rơi mượt mà bao phủ toàn bộ thẻ hồ sơ cá nhân.",
    price: 0
  },
  fx_stardust_magic: {
    code: "fx_stardust_magic",
    name: "Hiệu Ứng Hồ Sơ: Bụi Sao Thần Thoại",
    type: "profile_effect",
    category: "effect",
    badge: "Stardust FX",
    color: "#f59e0b",
    description: "Những hạt bụi sao ánh kim lung linh bay bổng và phát sáng huyền ảo trên thẻ cá nhân.",
    price: 0
  },
  fx_fire_sparks: {
    code: "fx_fire_sparks",
    name: "Hiệu Ứng Hồ Sơ: Tàn Lửa Địa Ngục",
    type: "profile_effect",
    category: "effect",
    badge: "Inferno FX",
    color: "#ef4444",
    description: "Những tàn lửa than hồng bay lơ lửng bốc lên từ đáy hồ sơ, tạo vẻ đẹp rực cháy.",
    price: 0
  },
  deco_manga_ghoul: {
    code: "deco_manga_ghoul",
    name: "Quỷ Hồn Hắc Ám (Manga Ghoul)",
    type: "avatar_decoration",
    category: "decoration",
    badge: "Horror Nitro",
    color: "#64748b",
    description: "Linh hồn quỷ dị và bàn tay xương xẩu manga kinh dị Junji Ito ôm lấy avatar cực kỳ ma mị chuẩn Discord VIP.",
    price: 0
  },
  fx_peeking_cat: {
    code: "fx_peeking_cat",
    name: "Mèo Trắng Nằm Nóc & Ngôi Sao",
    type: "profile_effect",
    category: "effect",
    badge: "Kitty Nitro",
    color: "#f472b6",
    description: "Bé mèo trắng anime má hồng nằm ngủ gác cằm trên nóc hồ sơ, tai vẫy nhẹ cùng những vì sao lấp lánh ở góc trái y hệt Discord Nitro.",
    price: 0
  }
};
window.DISCORD_EFFECTS_REGISTRY = DISCORD_EFFECTS_REGISTRY;

export function generateAvatarDecorationSvg(decoCode) {
  if (decoCode === "deco_manga_ghoul") {
    return `
      <div class="discord-avatar-decoration deco-manga-ghoul-vip">
        <svg viewBox="0 0 100 100">
          <defs>
            <radialGradient id="ghoul-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stop-color="transparent"/>
              <stop offset="90%" stop-color="rgba(0,0,0,0.45)"/>
              <stop offset="100%" stop-color="rgba(0,0,0,0.85)"/>
            </radialGradient>
          </defs>

          <!-- Outer Dark Manga Shadow Aura -->
          <circle cx="50" cy="50" r="46" fill="url(#ghoul-shadow)" stroke="#09090b" stroke-width="2.5" stroke-dasharray="14 4 6 4" class="deco-ghoul-aura-ring"/>

          <!-- Top-Left Screaming Manga Spirits & Ghoul Faces (Junji Ito Style) -->
          <g class="deco-ghoul-faces">
            <path d="M12,28 C8,18 16,8 28,6 C38,4 46,10 50,14 C44,18 36,18 30,22 C24,26 18,34 12,28 Z" fill="#18181b" stroke="#ffffff" stroke-width="1.2"/>
            
            <!-- Ghoul Face 1 (Top Left) -->
            <ellipse cx="26" cy="14" rx="6" ry="7" fill="#f4f4f5" stroke="#09090b" stroke-width="1"/>
            <circle cx="24" cy="13" r="1.8" fill="#09090b"/>
            <circle cx="28" cy="13" r="1.8" fill="#09090b"/>
            <circle cx="24" cy="13" r="0.6" fill="#fff" class="ghoul-eye-glow"/>
            <circle cx="28" cy="13" r="0.6" fill="#fff" class="ghoul-eye-glow"/>
            <ellipse cx="26" cy="18" rx="2.2" ry="3.2" fill="#09090b"/>
            <path d="M25,18 L27,18" stroke="#fff" stroke-width="0.8"/>

            <!-- Ghoul Face 2 (Upper Center) -->
            <ellipse cx="40" cy="10" rx="5" ry="6" fill="#e4e4e7" stroke="#09090b" stroke-width="1"/>
            <circle cx="38" cy="9" r="1.5" fill="#09090b"/>
            <circle cx="42" cy="9" r="1.5" fill="#09090b"/>
            <circle cx="38" cy="9" r="0.5" fill="#fff" class="ghoul-eye-glow"/>
            <circle cx="42" cy="9" r="0.5" fill="#fff" class="ghoul-eye-glow"/>
            <ellipse cx="40" cy="13.5" rx="1.8" ry="2.2" fill="#09090b"/>

            <!-- Ghoul Face 3 (Left edge ~ 9 o'clock) -->
            <ellipse cx="14" cy="36" rx="5" ry="6.5" fill="#f4f4f5" stroke="#09090b" stroke-width="1"/>
            <circle cx="12" cy="35" r="1.5" fill="#09090b"/>
            <circle cx="16" cy="35" r="1.5" fill="#09090b"/>
            <ellipse cx="14" cy="39.5" rx="2" ry="2.5" fill="#09090b"/>

            <!-- Pen Ink Hatching Texture Marks -->
            <line x1="20" y1="8" x2="22" y2="12" stroke="#ffffff" stroke-width="0.8"/>
            <line x1="32" y1="6" x2="34" y2="10" stroke="#ffffff" stroke-width="0.8"/>
            <line x1="44" y1="12" x2="47" y2="15" stroke="#ffffff" stroke-width="0.8"/>
          </g>

          <!-- Bony Skeletal Hands Reaching & Gripping (Right & Bottom) -->
          <g class="deco-ghoul-hands">
            <g class="ghoul-hand-right">
              <path d="M98,42 L92,45 L92,55 L98,58 Z" fill="#f4f4f5" stroke="#09090b" stroke-width="1"/>
              <path d="M92,44 C88,42 84,43 83,46 C86,47 89,46 92,47 Z" fill="#ffffff" stroke="#09090b" stroke-width="0.9"/>
              <path d="M92,48 C86,47 80,49 79,52 C83,53 87,51 92,52 Z" fill="#ffffff" stroke="#09090b" stroke-width="0.9"/>
              <path d="M92,53 C87,53 82,56 81,59 C85,58 88,56 92,56 Z" fill="#ffffff" stroke="#09090b" stroke-width="0.9"/>
              <path d="M93,56 C89,57 85,61 85,64 C88,62 91,59 93,58 Z" fill="#ffffff" stroke="#09090b" stroke-width="0.9"/>
            </g>

            <g class="ghoul-hand-bottom">
              <path d="M22,86 C21,80 24,76 27,73 C26,78 24,82 25,87 Z" fill="#ffffff" stroke="#09090b" stroke-width="0.9"/>
              <path d="M28,88 C29,82 33,78 37,76 C35,80 32,84 31,89 Z" fill="#ffffff" stroke="#09090b" stroke-width="0.9"/>
              <path d="M34,91 C36,86 41,83 45,82 C42,86 39,89 37,92 Z" fill="#ffffff" stroke="#09090b" stroke-width="0.9"/>
            </g>
          </g>

          <!-- Shadow Smoke Trails & Floating Ghost Wisps -->
          <g class="deco-ghoul-wisps">
            <path d="M82,22 C86,18 90,20 92,24 C88,24 85,26 82,22 Z" fill="#ffffff" opacity="0.8"/>
            <path d="M68,92 C72,95 78,94 82,90 C78,90 73,93 68,92 Z" fill="#ffffff" opacity="0.8"/>
            <circle cx="86" cy="24" r="1.5" fill="#fff"/>
            <circle cx="65" cy="94" r="1.2" fill="#fff"/>
            <circle cx="8" cy="54" r="1.5" fill="#fff"/>
          </g>
        </svg>
      </div>
    `;
  }
  if (decoCode === "deco_flame_dragon") {
    return `
      <div class="discord-avatar-decoration deco-dragon-fire-vip">
        <svg viewBox="0 0 100 100">
          <defs>
            <linearGradient id="df-fire-body" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#dc2626"/>
              <stop offset="35%" stop-color="#ea580c"/>
              <stop offset="70%" stop-color="#f59e0b"/>
              <stop offset="100%" stop-color="#fef08a"/>
            </linearGradient>
            <linearGradient id="df-fire-core" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#f97316"/>
              <stop offset="50%" stop-color="#fde047"/>
              <stop offset="100%" stop-color="#ffffff"/>
            </linearGradient>
            <radialGradient id="df-flame-corona" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stop-color="transparent"/>
              <stop offset="85%" stop-color="rgba(255, 107, 0, 0.4)"/>
              <stop offset="100%" stop-color="rgba(255, 30, 0, 0.8)"/>
            </radialGradient>
          </defs>

          <!-- Outer Pulsating Flame Aura Ring -->
          <circle cx="50" cy="50" r="46" fill="url(#df-flame-corona)" stroke="url(#df-fire-body)" stroke-width="3" stroke-dasharray="24 8 16 6" class="deco-dragon-base-ring"/>

          <!-- Top Dragon Flaming Horns & Crown -->
          <g class="deco-dragon-horns">
            <path d="M44,15 C38,8 28,4 18,7 C25,12 30,16 38,20 Z" fill="url(#df-fire-body)"/>
            <path d="M43,16 C38,10 30,7 22,9 C27,13 32,16 38,20 Z" fill="url(#df-fire-core)"/>
            <path d="M56,15 C62,8 72,4 82,7 C75,12 70,16 62,20 Z" fill="url(#df-fire-body)"/>
            <path d="M57,16 C62,10 70,7 78,9 C73,13 68,16 62,20 Z" fill="url(#df-fire-core)"/>
            <path d="M50,-3 C44,6 45,13 50,17 C55,13 56,6 50,-3 Z" fill="url(#df-fire-body)"/>
            <path d="M50,1 C47,7 48,12 50,15 C52,12 53,7 50,1 Z" fill="url(#df-fire-core)"/>
          </g>

          <!-- Sinuous Curving Flame Tongues (Dynamic Flame Ring) -->
          <g class="deco-dragon-tongues-layer1">
            <path d="M85,18 C90,26 84,33 79,35 C85,32 92,25 85,18 Z" fill="url(#df-fire-body)"/>
            <path d="M97,44 C101,51 95,58 89,59 C95,55 101,49 97,44 Z" fill="url(#df-fire-body)"/>
            <path d="M94,46 C97,51 92,55 88,56 C93,53 96,49 94,46 Z" fill="url(#df-fire-core)"/>
            <path d="M86,77 C90,85 81,90 75,88 C81,87 88,83 86,77 Z" fill="url(#df-fire-body)"/>
            <path d="M50,103 C43,94 43,87 50,83 C57,87 57,94 50,103 Z" fill="url(#df-fire-body)"/>
            <path d="M50,99 C46,93 46,88 50,85 C54,88 54,93 50,99 Z" fill="url(#df-fire-core)"/>
            <path d="M14,77 C10,85 19,90 25,88 C19,87 12,83 14,77 Z" fill="url(#df-fire-body)"/>
            <path d="M3,44 C-1,51 5,58 11,59 C5,55 -1,49 3,44 Z" fill="url(#df-fire-body)"/>
            <path d="M6,46 C3,51 8,55 12,56 C7,53 4,49 6,46 Z" fill="url(#df-fire-core)"/>
            <path d="M15,18 C10,26 16,33 21,35 C15,32 8,25 15,18 Z" fill="url(#df-fire-body)"/>
          </g>

          <g class="deco-dragon-tongues-layer2">
            <path d="M68,5 C75,12 70,18 64,19 C70,17 76,11 68,5 Z" fill="url(#df-fire-core)"/>
            <path d="M93,33 C98,39 92,45 87,44 C92,43 97,37 93,33 Z" fill="url(#df-fire-body)"/>
            <path d="M83,67 C88,73 82,79 77,78 C82,76 87,71 83,67 Z" fill="url(#df-fire-core)"/>
            <path d="M32,5 C25,12 30,18 36,19 C30,17 24,11 32,5 Z" fill="url(#df-fire-core)"/>
            <path d="M7,33 C2,39 8,45 13,44 C8,43 3,37 7,33 Z" fill="url(#df-fire-body)"/>
            <path d="M17,67 C12,73 18,79 23,78 C18,76 13,71 17,67 Z" fill="url(#df-fire-core)"/>
          </g>

          <!-- Floating Fire Embers -->
          <g class="deco-dragon-sparks">
            <circle cx="26" cy="0" r="2.2" fill="#fff"/>
            <circle cx="74" cy="0" r="2.2" fill="#fff"/>
            <circle cx="98" cy="28" r="1.8" fill="#fde047"/>
            <circle cx="96" cy="68" r="1.8" fill="#f97316"/>
            <circle cx="2" cy="28" r="1.8" fill="#fde047"/>
            <circle cx="4" cy="68" r="1.8" fill="#f97316"/>
            <circle cx="38" cy="99" r="1.6" fill="#fde047"/>
            <circle cx="62" cy="99" r="1.6" fill="#fde047"/>
          </g>
        </svg>
      </div>
    `;
  }
  if (decoCode === "deco_cyber_neon") {
    return `
      <div class="discord-avatar-decoration deco-cyber-vip">
        <svg viewBox="0 0 100 100">
          <defs>
            <linearGradient id="cyber-neon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#00f0ff"/>
              <stop offset="35%" stop-color="#3b82f6"/>
              <stop offset="70%" stop-color="#a855f7"/>
              <stop offset="100%" stop-color="#ff007b"/>
            </linearGradient>
            <linearGradient id="cyber-laser-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="transparent"/>
              <stop offset="70%" stop-color="#00f0ff"/>
              <stop offset="100%" stop-color="#ffffff"/>
            </linearGradient>
          </defs>

          <!-- 4 Corner Tactical Reticles -->
          <g class="deco-cyber-corners">
            <path d="M14,4 L4,4 L4,14" fill="none" stroke="#00f0ff" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M86,4 L96,4 L96,14" fill="none" stroke="#ff007b" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M14,96 L4,96 L4,86" fill="none" stroke="#ff007b" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M86,96 L96,96 L96,86" fill="none" stroke="#00f0ff" stroke-width="2.5" stroke-linecap="round"/>
          </g>

          <!-- Outer High-Precision Segmented Tech HUD Ring -->
          <circle cx="50" cy="50" r="46" fill="none" stroke="url(#cyber-neon-grad)" stroke-width="3" stroke-dasharray="28 8 12 8 4 6" class="deco-cyber-outer-spin"/>

          <!-- High-Speed Traveling Electric Laser Pulse -->
          <circle cx="50" cy="50" r="46" fill="none" stroke="url(#cyber-laser-grad)" stroke-width="4" stroke-dasharray="35 255" class="deco-cyber-laser-pulse"/>

          <!-- Inner Tactical Reticle Counter-Rotating Ring -->
          <circle cx="50" cy="50" r="42" fill="none" stroke="#00f0ff" stroke-width="1.5" stroke-dasharray="4 6" class="deco-cyber-inner-spin"/>

          <!-- 4 Holographic Tactical Beacon Nodes -->
          <g class="deco-cyber-beacons">
            <polygon points="50,1 54,8 46,8" fill="#00f0ff"/>
            <circle cx="50" cy="5" r="1.5" fill="#fff"/>
            <polygon points="50,99 54,92 46,92" fill="#ff007b"/>
            <circle cx="50" cy="95" r="1.5" fill="#fff"/>
            <polygon points="1,50 8,46 8,54" fill="#3b82f6"/>
            <circle cx="5" cy="50" r="1.5" fill="#fff"/>
            <polygon points="99,50 92,46 92,54" fill="#00f0ff"/>
            <circle cx="95" cy="50" r="1.5" fill="#fff"/>
          </g>
        </svg>
      </div>
    `;
  }
  if (decoCode === "deco_sakura_bloom") {
    return `
      <div class="discord-avatar-decoration deco-sakura-vip">
        <svg viewBox="0 0 100 100">
          <defs>
            <linearGradient id="sakura-petal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fff0f5"/>
              <stop offset="45%" stop-color="#ff7eb3"/>
              <stop offset="100%" stop-color="#ff3385"/>
            </linearGradient>
            <linearGradient id="sakura-vine-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fbcfe8"/>
              <stop offset="50%" stop-color="#f472b6"/>
              <stop offset="100%" stop-color="#ec4899"/>
            </linearGradient>
          </defs>

          <!-- Arching Floral Vine Ring -->
          <circle cx="50" cy="50" r="45" fill="none" stroke="url(#sakura-vine-grad)" stroke-width="2.5" stroke-dasharray="20 6 10 5" class="deco-sakura-vine-ring"/>

          <!-- 3 Lush Cherry Blossom Flower Clusters -->
          <g transform="translate(76, 20) scale(0.85)" class="deco-sakura-flower">
            <path d="M0,0 C-4,-8 4,-8 0,0 Z" fill="url(#sakura-petal-grad)" transform="rotate(0)"/>
            <path d="M0,0 C-4,-8 4,-8 0,0 Z" fill="url(#sakura-petal-grad)" transform="rotate(72)"/>
            <path d="M0,0 C-4,-8 4,-8 0,0 Z" fill="url(#sakura-petal-grad)" transform="rotate(144)"/>
            <path d="M0,0 C-4,-8 4,-8 0,0 Z" fill="url(#sakura-petal-grad)" transform="rotate(216)"/>
            <path d="M0,0 C-4,-8 4,-8 0,0 Z" fill="url(#sakura-petal-grad)" transform="rotate(288)"/>
            <circle cx="0" cy="0" r="2.2" fill="#fbbf24"/>
            <circle cx="0" cy="0" r="1.2" fill="#fff"/>
          </g>

          <g transform="translate(24, 80) scale(0.9)" class="deco-sakura-flower">
            <path d="M0,0 C-4,-8 4,-8 0,0 Z" fill="url(#sakura-petal-grad)" transform="rotate(20)"/>
            <path d="M0,0 C-4,-8 4,-8 0,0 Z" fill="url(#sakura-petal-grad)" transform="rotate(92)"/>
            <path d="M0,0 C-4,-8 4,-8 0,0 Z" fill="url(#sakura-petal-grad)" transform="rotate(164)"/>
            <path d="M0,0 C-4,-8 4,-8 0,0 Z" fill="url(#sakura-petal-grad)" transform="rotate(236)"/>
            <path d="M0,0 C-4,-8 4,-8 0,0 Z" fill="url(#sakura-petal-grad)" transform="rotate(308)"/>
            <circle cx="0" cy="0" r="2.4" fill="#fbbf24"/>
            <circle cx="0" cy="0" r="1.3" fill="#fff"/>
          </g>

          <g transform="translate(82, 72) scale(0.7)" class="deco-sakura-flower">
            <path d="M0,0 C-4,-8 4,-8 0,0 Z" fill="url(#sakura-petal-grad)" transform="rotate(35)"/>
            <path d="M0,0 C-4,-8 4,-8 0,0 Z" fill="url(#sakura-petal-grad)" transform="rotate(107)"/>
            <path d="M0,0 C-4,-8 4,-8 0,0 Z" fill="url(#sakura-petal-grad)" transform="rotate(179)"/>
            <path d="M0,0 C-4,-8 4,-8 0,0 Z" fill="url(#sakura-petal-grad)" transform="rotate(251)"/>
            <path d="M0,0 C-4,-8 4,-8 0,0 Z" fill="url(#sakura-petal-grad)" transform="rotate(323)"/>
            <circle cx="0" cy="0" r="2" fill="#fbbf24"/>
          </g>

          <!-- 6 Floating Loose Petals in 3D Orbit -->
          <g class="deco-sakura-orbit-petals">
            <path d="M50,2 C47,6 50,11 50,11 C50,11 53,6 50,2 Z" fill="url(#sakura-petal-grad)" class="sakura-p1"/>
            <path d="M96,48 C92,51 94,56 94,56 C94,56 98,52 96,48 Z" fill="url(#sakura-petal-grad)" class="sakura-p2"/>
            <path d="M48,97 C45,93 47,88 47,88 C47,88 51,92 48,97 Z" fill="url(#sakura-petal-grad)" class="sakura-p3"/>
            <path d="M3,52 C6,48 5,43 5,43 C5,43 1,47 3,52 Z" fill="url(#sakura-petal-grad)" class="sakura-p4"/>
            <path d="M22,18 C19,22 22,27 22,27 C22,27 25,22 22,18 Z" fill="url(#sakura-petal-grad)" class="sakura-p5"/>
            <path d="M78,88 C81,84 79,79 79,79 C79,79 75,83 78,88 Z" fill="url(#sakura-petal-grad)" class="sakura-p6"/>
          </g>

          <!-- Magical Twinkling Sparkle Stars (✦) -->
          <g class="deco-sakura-sparkles">
            <path d="M50,7 Q50,11 46,11 Q50,11 50,15 Q50,11 54,11 Q50,11 50,7 Z" fill="#ffd700" class="sakura-sp1"/>
            <path d="M92,30 Q92,33 89,33 Q92,33 92,36 Q92,33 95,33 Q92,33 92,30 Z" fill="#fff" class="sakura-sp2"/>
            <path d="M12,70 Q12,73 9,73 Q12,73 12,76 Q12,73 15,73 Q12,73 12,70 Z" fill="#ffd700" class="sakura-sp3"/>
            <path d="M35,94 Q35,96 33,96 Q35,96 35,98 Q35,96 37,96 Q35,96 35,94 Z" fill="#fff" class="sakura-sp4"/>
          </g>
        </svg>
      </div>
    `;
  }
  if (decoCode === "deco_galaxy_portal") {
    return `
      <div class="discord-avatar-decoration deco-galaxy-vip">
        <svg viewBox="0 0 100 100">
          <defs>
            <linearGradient id="galaxy-vortex-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#8b5cf6"/>
              <stop offset="35%" stop-color="#3b82f6"/>
              <stop offset="70%" stop-color="#ec4899"/>
              <stop offset="100%" stop-color="#06b6d4"/>
            </linearGradient>
            <radialGradient id="galaxy-core-glow" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stop-color="transparent"/>
              <stop offset="90%" stop-color="rgba(139, 92, 246, 0.4)"/>
              <stop offset="100%" stop-color="rgba(236, 72, 153, 0.7)"/>
            </radialGradient>
          </defs>

          <!-- Outer Accretion Vortex Disk -->
          <circle cx="50" cy="50" r="46" fill="url(#galaxy-core-glow)" stroke="url(#galaxy-vortex-grad)" stroke-width="3.5" stroke-dasharray="32 10 20 8 10 6" class="deco-galaxy-vortex-spin"/>

          <!-- Secondary Swirling Nebula Waves -->
          <circle cx="50" cy="50" r="42" fill="none" stroke="#a855f7" stroke-width="1.8" stroke-dasharray="6 8" class="deco-galaxy-inner-waves"/>

          <!-- Orbiting Celestial Satellite / Moon with Light Trail -->
          <g class="deco-galaxy-satellite-orbit">
            <circle cx="50" cy="3" r="3.2" fill="#ffffff" filter="drop-shadow(0 0 4px #00f0ff)"/>
            <path d="M50,3 C45,3 38,5 34,7" fill="none" stroke="#00f0ff" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
          </g>

          <!-- 4-Point Starlight Sparkles (✦) -->
          <g class="deco-galaxy-stars">
            <path d="M22,18 Q22,23 17,23 Q22,23 22,28 Q22,23 27,23 Q22,23 22,18 Z" fill="#fff" class="gstar-1"/>
            <path d="M82,16 Q82,20 78,20 Q82,20 82,24 Q82,20 86,20 Q82,20 82,16 Z" fill="#fde047" class="gstar-2"/>
            <path d="M94,52 Q94,56 90,56 Q94,56 94,60 Q94,56 98,56 Q94,56 94,52 Z" fill="#67e8f9" class="gstar-3"/>
            <path d="M78,82 Q78,87 73,87 Q78,87 78,92 Q78,87 83,87 Q78,87 78,82 Z" fill="#fff" class="gstar-4"/>
            <path d="M24,84 Q24,88 20,88 Q24,88 24,92 Q24,88 28,88 Q24,88 24,84 Z" fill="#f472b6" class="gstar-5"/>
            <path d="M6,46 Q6,50 2,50 Q6,50 6,54 Q6,50 10,50 Q6,50 6,46 Z" fill="#c084fc" class="gstar-6"/>
          </g>
        </svg>
      </div>
    `;
  }
  if (decoCode === "deco_retro_glitch") {
    return `
      <div class="discord-avatar-decoration deco-glitch-vip">
        <svg viewBox="0 0 100 100">
          <defs>
            <linearGradient id="glitch-cyan-mag" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#00f0ff"/>
              <stop offset="100%" stop-color="#ff007b"/>
            </linearGradient>
          </defs>

          <!-- Cybernetic Visor Antennae -->
          <g class="deco-glitch-horns">
            <polygon points="26,12 34,4 40,16" fill="#00f0ff"/>
            <polygon points="74,12 66,4 60,16" fill="#ff007b"/>
          </g>

          <!-- Chromatic Aberration RGB Rings -->
          <circle cx="49" cy="50" r="45" fill="none" stroke="#00f0ff" stroke-width="2.5" stroke-dasharray="24 6 12 4" class="deco-glitch-cyan-ring"/>
          <circle cx="51" cy="50" r="45" fill="none" stroke="#ff007b" stroke-width="2.5" stroke-dasharray="20 8 16 6" class="deco-glitch-magenta-ring"/>
          <circle cx="50" cy="50" r="45" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="30 10" class="deco-glitch-main-ring"/>

          <!-- 4 Corner Cyber Visor Frame Nodes -->
          <rect x="2" y="47" width="6" height="6" fill="#00f0ff"/>
          <rect x="92" y="47" width="6" height="6" fill="#ff007b"/>
          <rect x="47" y="2" width="6" height="6" fill="#00f0ff"/>
          <rect x="47" y="92" width="6" height="6" fill="#ff007b"/>
        </svg>
        <span class="deco-glitch-vip-tag">CYBER 2077</span>
      </div>
    `;
  }
  return "";
}
window.generateAvatarDecorationSvg = generateAvatarDecorationSvg;

export function renderDecoratedAvatar(avatarUrl, decoCode, size = 48, name = "3TG") {
  let innerHtml = "";
  if (avatarUrl) {
    if (avatarUrl.startsWith("mascot:")) {
      const key = avatarUrl.slice(7);
      if (window.renderThoBayMau && window.THO_METADATA && window.THO_METADATA[key]) {
        innerHtml = renderThoBayMau({ state: key, size: Math.round(size * 0.9) });
      } else {
        innerHtml = esc(key);
      }
    } else {
      innerHtml = `<img src="${esc(avatarUrl)}" alt="">`;
    }
  } else {
    innerHtml = esc(Array.from(name || "L")[0] || "L");
  }

  let decoHtml = "";
  if (decoCode) {
    if (decoCode.endsWith(".webm") || decoCode.endsWith(".mp4")) {
      decoHtml = `
        <div class="discord-avatar-decoration">
          <video src="${esc(decoCode)}" autoplay loop muted playsinline style="width:100%; height:100%; object-fit:contain; pointer-events:none;"></video>
        </div>
      `;
    } else if (decoCode.startsWith("http") || decoCode.startsWith("data:") || decoCode.endsWith(".png") || decoCode.endsWith(".gif") || decoCode.endsWith(".webp")) {
      decoHtml = `
        <div class="discord-avatar-decoration">
          <img src="${esc(decoCode)}" alt="" style="width:100%; height:100%; object-fit:contain; pointer-events:none;">
        </div>
      `;
    } else {
      decoHtml = generateAvatarDecorationSvg(decoCode);
    }
  }

  return `
    <div class="discord-avatar-container" style="width:${size}px; height:${size}px; font-size:${Math.round(size * 0.42)}px;">
      <div class="avatar-base">
        ${innerHtml}
      </div>
      ${decoHtml}
    </div>
  `;
}
window.renderDecoratedAvatar = renderDecoratedAvatar;

export function renderProfileEffectHtml(fxCode) {
  if (fxCode) {
    if (fxCode.endsWith(".webm") || fxCode.endsWith(".mp4")) {
      return `
        <div class="discord-profile-fx-layer">
          <video src="${esc(fxCode)}" autoplay loop muted playsinline style="width:100%; height:100%; object-fit:cover; pointer-events:none;"></video>
        </div>
      `;
    }
    if (fxCode.startsWith("http") || fxCode.startsWith("data:") || fxCode.endsWith(".gif") || fxCode.endsWith(".png") || fxCode.endsWith(".webp")) {
      return `
        <div class="discord-profile-fx-layer">
          <img src="${esc(fxCode)}" alt="" style="width:100%; height:100%; object-fit:cover; pointer-events:none;">
        </div>
      `;
    }
  }

  if (fxCode === "fx_peeking_cat") {
    return `
      <div class="discord-profile-fx-layer discord-fx-peeking-cat">
        <!-- Glittering sparkle stars at top-left -->
        <div class="peeking-cat-sparkles">
          <span class="cat-sparkle s1">✦</span>
          <span class="cat-sparkle s2">✦</span>
          <span class="cat-sparkle s3">✦</span>
          <span class="cat-sparkle s4">✧</span>
        </div>

        <!-- Cute Anime White Cat Resting on Top Border -->
        <div class="peeking-cat-container">
          <svg viewBox="0 0 160 55" class="peeking-cat-svg">
            <defs>
              <linearGradient id="cat-body-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="100%" stop-color="#fff0f5"/>
              </linearGradient>
            </defs>

            <!-- Left Ear with Soft Pink Inner Ear -->
            <polygon points="34,22 42,2 54,16" fill="url(#cat-body-grad)" stroke="#fbcfe8" stroke-width="1.8" class="cat-left-ear"/>
            <polygon points="37,20 42,7 50,16" fill="#f472b6" opacity="0.85" class="cat-left-ear-inner"/>

            <!-- Right Ear with Soft Pink Inner Ear -->
            <polygon points="126,22 118,2 106,16" fill="url(#cat-body-grad)" stroke="#fbcfe8" stroke-width="1.8" class="cat-right-ear"/>
            <polygon points="123,20 118,7 110,16" fill="#f472b6" opacity="0.85" class="cat-right-ear-inner"/>

            <!-- Chubby Cat Head Base -->
            <ellipse cx="80" cy="28" rx="48" ry="24" fill="url(#cat-body-grad)" stroke="#fbcfe8" stroke-width="2"/>

            <!-- Soft Blushing Cheeks -->
            <ellipse cx="50" cy="33" rx="7" ry="4" fill="#fb7185" opacity="0.45"/>
            <ellipse cx="110" cy="33" rx="7" ry="4" fill="#fb7185" opacity="0.45"/>

            <!-- Closed Happy/Sleeping Cat Eyes (^ ^) -->
            <path d="M56,27 Q62,21 68,27" fill="none" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M92,27 Q98,21 104,27" fill="none" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>

            <!-- Little Pink Cat Nose & Curved Mouth (ㅅ) -->
            <polygon points="78,31 82,31 80,34" fill="#f43f5e"/>
            <path d="M74,35 Q80,39 80,35 Q80,39 86,35" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>

            <!-- Whiskers -->
            <line x1="32" y1="31" x2="44" y2="32" stroke="#cbd5e1" stroke-width="1.5"/>
            <line x1="30" y1="36" x2="43" y2="35" stroke="#cbd5e1" stroke-width="1.5"/>
            <line x1="128" y1="31" x2="116" y2="32" stroke="#cbd5e1" stroke-width="1.5"/>
            <line x1="130" y1="36" x2="117" y2="35" stroke="#cbd5e1" stroke-width="1.5"/>

            <!-- Left Front Paw Hanging Over Top Edge -->
            <g class="cat-paw-left">
              <rect x="42" y="38" width="18" height="14" rx="8" fill="#ffffff" stroke="#fbcfe8" stroke-width="1.6"/>
              <ellipse cx="51" cy="46" rx="4" ry="3" fill="#f472b6" opacity="0.8"/>
              <circle cx="46" cy="42" r="1.4" fill="#f472b6" opacity="0.8"/>
              <circle cx="51" cy="41" r="1.4" fill="#f472b6" opacity="0.8"/>
              <circle cx="56" cy="42" r="1.4" fill="#f472b6" opacity="0.8"/>
            </g>

            <!-- Right Front Paw Hanging Over Top Edge -->
            <g class="cat-paw-right">
              <rect x="100" y="38" width="18" height="14" rx="8" fill="#ffffff" stroke="#fbcfe8" stroke-width="1.6"/>
              <ellipse cx="109" cy="46" rx="4" ry="3" fill="#f472b6" opacity="0.8"/>
              <circle cx="104" cy="42" r="1.4" fill="#f472b6" opacity="0.8"/>
              <circle cx="109" cy="41" r="1.4" fill="#f472b6" opacity="0.8"/>
              <circle cx="114" cy="42" r="1.4" fill="#f472b6" opacity="0.8"/>
            </g>
          </svg>
        </div>
      </div>
    `;
  }
  if (fxCode === "fx_matrix_rain") {
    return `
      <div class="discord-profile-fx-layer discord-fx-matrix">
        <div class="discord-matrix-column" style="left:4%; animation-duration:2.8s; animation-delay:0s;"><span class="matrix-head">1</span>01011001</div>
        <div class="discord-matrix-column" style="left:13%; animation-duration:3.6s; animation-delay:0.8s;"><span class="matrix-head">0</span>11010101</div>
        <div class="discord-matrix-column" style="left:22%; animation-duration:3.0s; animation-delay:1.4s;"><span class="matrix-head">1</span>00110100</div>
        <div class="discord-matrix-column" style="left:31%; animation-duration:4.1s; animation-delay:0.3s;"><span class="matrix-head">0</span>10111001</div>
        <div class="discord-matrix-column" style="left:40%; animation-duration:3.3s; animation-delay:1.9s;"><span class="matrix-head">1</span>10010101</div>
        <div class="discord-matrix-column" style="left:50%; animation-duration:2.9s; animation-delay:0.5s;"><span class="matrix-head">0</span>11011010</div>
        <div class="discord-matrix-column" style="left:59%; animation-duration:3.8s; animation-delay:1.1s;"><span class="matrix-head">1</span>01001101</div>
        <div class="discord-matrix-column" style="left:68%; animation-duration:3.2s; animation-delay:0.2s;"><span class="matrix-head">0</span>11100101</div>
        <div class="discord-matrix-column" style="left:77%; animation-duration:4.0s; animation-delay:1.6s;"><span class="matrix-head">1</span>00101100</div>
        <div class="discord-matrix-column" style="left:86%; animation-duration:3.4s; animation-delay:0.7s;"><span class="matrix-head">0</span>10110101</div>
        <div class="discord-matrix-column" style="left:95%; animation-duration:3.7s; animation-delay:1.3s;"><span class="matrix-head">1</span>10011010</div>
      </div>
    `;
  }
  if (fxCode === "fx_stardust_magic") {
    return `
      <div class="discord-profile-fx-layer discord-fx-stardust">
        <div class="stardust-ambient-glow"></div>
        <div class="discord-stardust-star" style="left:8%; animation-delay:0s; animation-duration:3.6s;">✦</div>
        <div class="discord-stardust-star" style="left:22%; animation-delay:1.4s; animation-duration:4.2s; font-size:18px;">✦</div>
        <div class="discord-stardust-star" style="left:38%; animation-delay:0.6s; animation-duration:3.8s; font-size:12px;">✦</div>
        <div class="discord-stardust-star" style="left:54%; animation-delay:2.1s; animation-duration:4.5s; font-size:20px;">✦</div>
        <div class="discord-stardust-star" style="left:68%; animation-delay:1.1s; animation-duration:3.4s; font-size:14px;">✦</div>
        <div class="discord-stardust-star" style="left:82%; animation-delay:0.3s; animation-duration:4.0s; font-size:16px;">✦</div>
        <div class="discord-stardust-star" style="left:93%; animation-delay:1.8s; animation-duration:3.7s; font-size:13px;">✦</div>
        <div class="discord-stardust-particle" style="left:15%; animation-delay:0.5s; animation-duration:3.2s;"></div>
        <div class="discord-stardust-particle" style="left:29%; animation-delay:1.8s; animation-duration:4.0s; width:8px; height:8px;"></div>
        <div class="discord-stardust-particle" style="left:46%; animation-delay:0.9s; animation-duration:3.5s;"></div>
        <div class="discord-stardust-particle" style="left:62%; animation-delay:2.4s; animation-duration:4.3s; width:7px; height:7px;"></div>
        <div class="discord-stardust-particle" style="left:75%; animation-delay:1.2s; animation-duration:3.1s;"></div>
        <div class="discord-stardust-particle" style="left:88%; animation-delay:2.0s; animation-duration:3.9s;"></div>
      </div>
    `;
  }
  if (fxCode === "fx_fire_sparks") {
    return `
      <div class="discord-profile-fx-layer discord-fx-fire">
        <div class="fire-bottom-furnace-glow"></div>
        <div class="discord-fire-ember" style="left:7%; animation-delay:0s; animation-duration:2.4s; width:6px; height:6px;"></div>
        <div class="discord-fire-ember" style="left:15%; animation-delay:1.1s; animation-duration:3.0s; width:4px; height:4px;"></div>
        <div class="discord-fire-ember" style="left:24%; animation-delay:0.5s; animation-duration:2.6s; width:7px; height:7px;"></div>
        <div class="discord-fire-ember" style="left:33%; animation-delay:1.8s; animation-duration:3.3s; width:5px; height:5px;"></div>
        <div class="discord-fire-ember" style="left:42%; animation-delay:0.2s; animation-duration:2.8s; width:8px; height:8px;"></div>
        <div class="discord-fire-ember" style="left:51%; animation-delay:1.4s; animation-duration:3.1s; width:4px; height:4px;"></div>
        <div class="discord-fire-ember" style="left:60%; animation-delay:0.7s; animation-duration:2.5s; width:7px; height:7px;"></div>
        <div class="discord-fire-ember" style="left:69%; animation-delay:2.0s; animation-duration:3.4s; width:5px; height:5px;"></div>
        <div class="discord-fire-ember" style="left:78%; animation-delay:0.9s; animation-duration:2.7s; width:8px; height:8px;"></div>
        <div class="discord-fire-ember" style="left:87%; animation-delay:1.5s; animation-duration:3.2s; width:4px; height:4px;"></div>
        <div class="discord-fire-ember" style="left:94%; animation-delay:0.4s; animation-duration:2.3s; width:6px; height:6px;"></div>
      </div>
    `;
  }
  return "";
}
window.renderProfileEffectHtml = renderProfileEffectHtml;

window.equipDecoration = async function(type, itemCode) {
  try {
    playSound("click");
    const res = await api("/api/profile/equip", {
      method: "POST",
      body: { type, itemCode }
    });
    if (res.profile) {
      state.profile = Object.assign({}, state.profile, res.profile);
    }
    playSound("fanfare");
    showToast(itemCode ? "Đã trang bị hiệu ứng thành công! 🌸" : "Đã tháo hiệu ứng.");
    updateShell();
    render();
  } catch (err) {
    playSound("wrong");
    showToast(err.message, true);
    updateShell();
    render();
  }
};

window.previewDiscordItem = function(itemCode) {
  const item = DISCORD_EFFECTS_REGISTRY[itemCode];
  if (!item) return;

  const userAvatar = state.profile?.avatar_url || "";
  const userName = state.profile?.full_name || state.profile?.username || "Bạn học 3TG";
  const userHandle = state.profile?.username || "hocvien";

  const isDeco = item.type === "avatar_decoration";
  const previewDeco = isDeco ? item.code : (state.profile?.avatar_decoration || null);
  const previewFx = !isDeco ? item.code : (state.profile?.profile_effect || null);

  const owned = (state.inventory || []).some(i => i.item_code === itemCode && Number(i.quantity) > 0) ||
                (shopData?.items || []).some(i => i.item_code === itemCode && Number(i.owned) > 0);

  const isEquipped = isDeco
    ? (state.profile?.avatar_decoration === itemCode)
    : (state.profile?.profile_effect === itemCode);

  modalRoot.innerHTML = `
    <div class="discord-preview-modal-overlay" onclick="closeUserProfileModal(event)">
      <div class="discord-preview-card" onclick="event.stopPropagation()">
        ${renderProfileEffectHtml(previewFx)}
        <div class="discord-preview-banner">
          <button type="button" class="user-profile-close-btn" style="z-index:10;" onclick="closeUserProfileModal()">✕</button>
        </div>
        <div class="discord-preview-body">
          <div class="discord-preview-avatar-row">
            ${renderDecoratedAvatar(userAvatar, previewDeco, 92, userName)}
            <span class="discord-nitro-badge">✨ Live Preview</span>
          </div>
          <h2 style="font-size:20px; font-weight:900; margin:0 0 2px 0;">${esc(userName)}</h2>
          <div style="font-size:13px; color:#94a3b8; margin-bottom:12px;">@${esc(userHandle)}</div>
          
          <div style="background:rgba(255,255,255,0.06); border-radius:14px; padding:12px; margin-bottom:16px;">
            <div style="font-size:13px; font-weight:900; color:${item.color}; margin-bottom:4px;">
              ${esc(item.name)}
            </div>
            <div style="font-size:12px; color:#cbd5e1; line-height:1.4;">
              ${esc(item.description)}
            </div>
          </div>

          <div class="discord-preview-btn-row">
            ${isEquipped ? `
              <button type="button" class="btn-duo btn-duo-white" style="flex:1; padding:10px;" onclick="equipDecoration('${item.type}', null); closeUserProfileModal();">
                Tháo hiệu ứng
              </button>
            ` : owned ? `
              <button type="button" class="btn-duo btn-duo-green" style="flex:1; padding:10px; font-weight:900;" onclick="equipDecoration('${item.type}', '${esc(item.code)}'); closeUserProfileModal();">
                ✓ Trang bị ngay 🌸
              </button>
            ` : `
              <button type="button" class="btn-duo btn-duo-pink" style="flex:1; padding:10px; font-weight:900;" onclick="buyItem('${esc(item.code)}'); closeUserProfileModal();">
                Mua miễn phí (0 💎)
              </button>
            `}
            <button type="button" class="btn-duo btn-duo-white" style="padding:10px 18px;" onclick="closeUserProfileModal()">
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
};
window.previewDiscordItem = previewDiscordItem;

window.openMascotDetailModal = function(key) {
  try { playSound("click"); } catch {}
  const meta = THO_METADATA[key] || { name: key, quote: "" };
  const isUnlocked = isMascotUnlocked(key);
  const isEquipped = state.profile && (state.profile.avatar_url === `mascot:${key}`);

  let packName = "Mascot Mặc Định Sẵn Có";
  let packCode = null;
  if (MASCOT_PACKS.mascot_pack_champions.keys.includes(key)) {
    packName = "Gói 1: Thỏ Chiến Thần & Đỉnh Cao";
    packCode = "mascot_pack_champions";
  } else if (MASCOT_PACKS.mascot_pack_cosplay.keys.includes(key)) {
    packName = "Gói 2: Thỏ Hóa Trang Anime";
    packCode = "mascot_pack_cosplay";
  }

  modalRoot.innerHTML = `
    <div class="discord-preview-modal-overlay" onclick="closeUserProfileModal(event)">
      <div class="mascot-detail-modal-card" onclick="event.stopPropagation()">
        <button type="button" class="user-profile-close-btn" style="position:absolute; top:12px; right:12px; z-index:10;" onclick="closeUserProfileModal()">✕</button>
        
        <div class="mascot-detail-img-wrap">
          ${generateThoBayMauSvg({ state: key, size: 110 })}
        </div>

        <h3 style="font-size:18px; font-weight:900; color:var(--ink-900); margin:0 0 4px;">${esc(meta.name)}</h3>
        <span style="font-size:11.5px; font-weight:800; color:${isUnlocked ? '#16a34a' : '#d97706'}; background:${isUnlocked ? '#dcfce7' : '#fef3c7'}; padding:3px 10px; border-radius:999px;">
          ${isUnlocked ? '✓ Đã mở khóa' : '🔒 Đang khóa'} • ${esc(packName)}
        </span>

        <div class="mascot-detail-quote">
          "${esc(meta.quote || "Học bài đi đừng để tao nhắc! 🌸")}"
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          ${isEquipped ? `
            <button type="button" class="btn-duo btn-duo-green" style="width:100%; padding:10px;" disabled>
              ✓ Đang sử dụng làm Avatar
            </button>
          ` : isUnlocked ? `
            <button type="button" class="btn-duo btn-duo-pink" style="width:100%; padding:10px; font-weight:900;" onclick="equipMascot('${esc(key)}'); closeUserProfileModal();">
              🌸 Chọn dùng làm Avatar đại diện
            </button>
          ` : `
            <button type="button" class="btn-duo btn-duo-pink" style="width:100%; padding:10px; font-weight:900;" onclick="buyItem('${esc(packCode)}'); closeUserProfileModal();">
              Mở khóa trọn gói (💎 150)
            </button>
          `}
          <button type="button" class="btn-duo btn-duo-white" style="width:100%; padding:8px;" onclick="closeUserProfileModal()">
            Đóng
          </button>
        </div>
      </div>
    </div>
  `;
};

window.switchShopTab = function(tab) {
  try { playSound("click"); } catch {}
  state.shopTab = tab;
  render();
};

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

window.equipMascot = async function(stateKey) {
  try {
    playSound("click");
    const avatarUrl = `mascot:${stateKey}`;
    const res = await api("/api/profile/avatar/preset", {
      method: "POST",
      body: { preset: avatarUrl }
    });
    if (res.profile) state.profile = res.profile;
    playSound("fanfare");
    showToast(`Đã cài đặt Mascot "${THO_METADATA[stateKey]?.name || stateKey}" làm đại diện đồng hành! 🌸`);
    updateShell();
    render();
  } catch (err) {
    playSound("wrong");
    showToast(err.message, true);
  }
};

function renderShop() {
  if (!shopData) {
    fetchShop();
    return `<div class="loading-shell"><span class="loading-flower">✿</span><span>Đang tải cửa hàng...</span></div>`;
  }

  const items = shopData.items || [];
  const icons = { streak_freeze: "🧊", refill_hearts: "❤️", xp_boost: "⚡", double_xp_potion: "🧪" };

  const pack1Item = items.find(i => i.item_code === "mascot_pack_champions");
  const pack2Item = items.find(i => i.item_code === "mascot_pack_cosplay");
  const consumableItems = items.filter(i => !i.item_code.startsWith("mascot_pack") && !i.item_code.startsWith("deco_") && !i.item_code.startsWith("fx_"));

  const isPack1Owned = pack1Item && pack1Item.owned >= 1;
  const isPack2Owned = pack2Item && pack2Item.owned >= 1;

  // Mascot Card Renderer
  const renderMascotBadge = (key, isUnlocked, packName = "") => {
    const meta = THO_METADATA[key] || { name: key, quote: "" };
    const isEquipped = state.profile && (state.profile.avatar_url === `mascot:${key}`);

    return `
      <div class="mascot-wardrobe-card ${isUnlocked ? 'unlocked' : 'locked'} ${isEquipped ? 'equipped' : ''}" style="background:#fff; border:2px solid ${isEquipped ? 'var(--lumi-pink)' : isUnlocked ? '#fbcfe8' : '#e2e8f0'}; border-radius:20px; padding:12px; display:flex; flex-direction:column; align-items:center; text-align:center; position:relative; box-shadow:0 4px 0 ${isEquipped ? 'var(--lumi-pink)' : '#f1f5f9'};">
        ${isEquipped ? `<span style="position:absolute; top:8px; right:8px; background:var(--lumi-pink); color:#fff; font-size:10px; font-weight:900; padding:2px 8px; border-radius:999px;">Đang dùng</span>` : ''}
        ${!isUnlocked ? `<span style="position:absolute; top:8px; right:8px; background:#64748b; color:#fff; font-size:10px; font-weight:900; padding:2px 8px; border-radius:999px;">🔒 Khóa</span>` : ''}
        
        <div style="width:78px; height:78px; margin:4px 0; filter:${isUnlocked ? 'none' : 'grayscale(80%) opacity(0.6)'};">
          ${generateThoBayMauSvg({ state: key, size: 78 })}
        </div>

        <strong style="font-size:13px; font-weight:900; color:var(--ink-900); margin-top:4px;">${esc(meta.name.split('(')[0].trim())}</strong>
        <small style="font-size:11px; color:var(--ink-500); max-width:130px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-bottom:8px;">${esc(meta.quote)}</small>

        ${isUnlocked ? `
          <button type="button" class="btn-duo ${isEquipped ? 'btn-duo-green' : 'btn-duo-pink'}" style="padding:6px 12px; font-size:11.5px; width:100%;" onclick="equipMascot('${esc(key)}')">
            ${isEquipped ? '✓ Đang dùng' : 'Chọn dùng 🌸'}
          </button>
        ` : `
          <button type="button" class="btn-duo btn-duo-white" style="padding:6px 12px; font-size:11.5px; width:100%; opacity:0.85;" disabled>
            Gói ${esc(packName)}
          </button>
        `}
      </div>
    `;
  };

  const consumablesHtml = consumableItems.map(item => {
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

  state.shopTab = state.shopTab || "nitro";
  const userAvatar = state.profile?.avatar_url || "";
  const userName = state.profile?.full_name || state.profile?.username || "3TG";

  return `
    <div>
      <div class="banner-with-mascot" style="margin-bottom:20px; padding:18px 24px;">
        <div>
          <h1 class="page-title" style="margin-bottom:4px; font-size:24px;">Tiệm Tạp Hóa 3TG 🏪</h1>
          <p class="page-subtitle" style="margin:0 0 10px 0; font-size:13.5px;">Dùng Đá quý 💎 tích lũy từ các bài học để mở khóa Hiệu ứng Discord Nitro 0 💎, Mascot Thỏ và Bùa học tập!</p>
          <div class="top-stat top-gems" style="font-size:16px; display:inline-flex;">
            <span>💎</span> <b>${state.stats.gems || 0}</b> Đá quý hiện có
          </div>
        </div>
        <div class="banner-mascot-aside page-inline-mascot" style="transform:scale(0.85); transform-origin:right center;">
          ${renderThoBayMau({ state: THO_STATES.GEM_RICH, size: 100 })}
        </div>
      </div>

      <!-- SHOP CATEGORY TABS (SIÊU GỌN GÀNG, KHÔNG BỊ TO ĐÙNG) -->
      <div class="shop-category-tabs">
        <button type="button" class="shop-category-tab ${state.shopTab === 'nitro' ? 'active tab-nitro' : ''}" onclick="switchShopTab('nitro')">
          ⚡ Hiệu Ứng Nitro (0 💎)
        </button>
        <button type="button" class="shop-category-tab ${state.shopTab === 'mascot' ? 'active' : ''}" onclick="switchShopTab('mascot')">
          🐰 20 Mascot Thỏ Bảy Màu
        </button>
        <button type="button" class="shop-category-tab ${state.shopTab === 'items' ? 'active' : ''}" onclick="switchShopTab('items')">
          🛡️ Bùa Chuỗi & Vật Phẩm
        </button>
      </div>

      <!-- TAB 1: HIỆU ỨNG NITRO DISCORD (COMPACT GRID) -->
      ${state.shopTab === 'nitro' ? `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
            <div>
              <h2 style="font-size:18px; font-weight:900; color:var(--ink-900); margin:0;">
                Kho Hiệu Ứng Profile & Avatar Nitro (Discord Style) ✨
              </h2>
              <p style="font-size:13px; color:var(--ink-500); margin:2px 0 0;">
                Nhấp trực tiếp vào thẻ hoặc nút <b>👁️ Xem</b> để bung pop-up xem trước trực tiếp trên avatar của bạn.
              </p>
            </div>
            <span style="background:#22c55e; color:#fff; font-size:11px; font-weight:900; padding:3px 10px; border-radius:999px;">
              🎁 0 💎 Miễn Phí Trải Nghiệm
            </span>
          </div>

          <div class="discord-nitro-compact-grid">
            ${Object.values(DISCORD_EFFECTS_REGISTRY).map(item => {
              const isDeco = item.type === "avatar_decoration";
              const shopItem = items.find(i => i.item_code === item.code);
              const isOwned = (shopItem && shopItem.owned >= 1) || (state.inventory || []).some(inv => inv.item_code === item.code && Number(inv.quantity) >= 1);
              const isEquipped = isDeco
                ? (state.profile && state.profile.avatar_decoration === item.code)
                : (state.profile && state.profile.profile_effect === item.code);

              let previewHtml = "";
              if (isDeco) {
                previewHtml = renderDecoratedAvatar(userAvatar, item.code, 62, userName);
              } else {
                previewHtml = `
                  <div class="discord-nitro-fx-mini-stage">
                    ${renderProfileEffectHtml(item.code)}
                    <div class="mini-stage-avatar"></div>
                    <div class="mini-stage-line"></div>
                  </div>
                `;
              }

              return `
                <div class="discord-nitro-compact-card ${isEquipped ? 'equipped' : ''}" onclick="previewDiscordItem('${esc(item.code)}')">
                  <span class="discord-nitro-badge-pill" style="color:${item.color};">${esc(item.badge)}</span>
                  
                  <div class="discord-nitro-thumb-box">
                    ${previewHtml}
                  </div>

                  <h4 class="discord-nitro-card-name">${esc(item.name)}</h4>
                  
                  <div class="discord-nitro-card-bot" onclick="event.stopPropagation()">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span class="discord-nitro-price-tag">💎 0 ĐQ</span>
                      <button type="button" class="btn-duo btn-duo-white" style="padding:3px 8px; font-size:11px;" onclick="previewDiscordItem('${esc(item.code)}')">
                        👁️ Xem
                      </button>
                    </div>

                    ${isEquipped ? `
                      <button type="button" class="btn-duo btn-duo-green" style="padding:6px 10px; font-size:11.5px; width:100%;" onclick="equipDecoration('${esc(item.type)}', null)">
                        ✓ Đang dùng
                      </button>
                    ` : isOwned ? `
                      <button type="button" class="btn-duo btn-duo-pink" style="padding:6px 10px; font-size:11.5px; width:100%; font-weight:800;" onclick="equipDecoration('${esc(item.type)}', '${esc(item.code)}')">
                        Trang bị
                      </button>
                    ` : `
                      <button type="button" class="btn-duo btn-duo-pink" style="padding:6px 10px; font-size:11.5px; width:100%; font-weight:800;" onclick="buyItem('${esc(item.code)}')">
                        Nhận (0 💎)
                      </button>
                    `}
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      ` : ''}

      <!-- TAB 2: 20 MASCOTS COLLECTION (COMPACT WARDROBE) -->
      ${state.shopTab === 'mascot' ? `
        <div class="mascot-shop-container">
          <!-- 2 COMPACT PACK BANNERS -->
          <div class="mascot-packs-compact-row">
            <!-- GÓI 1: THỎ CHIẾN THẦN -->
            <div class="mascot-pack-compact-card fire">
              <div class="mascot-pack-info">
                <div class="mascot-pack-title-row">
                  <span>🔥</span>
                  <h4 class="mascot-pack-title">Gói 1: Thỏ Chiến Thần</h4>
                  <span style="font-size:10px; font-weight:900; background:#ea580c; color:#fff; padding:1px 6px; border-radius:999px;">7 Con</span>
                </div>
                <div class="mascot-pack-chips-row">
                  ${MASCOT_PACKS.mascot_pack_champions.keys.map(k => `
                    <div class="mascot-mini-chip" title="${esc(THO_METADATA[k]?.name || k)}" onclick="openMascotDetailModal('${esc(k)}')">
                      ${generateThoBayMauSvg({ state: k, size: 24 })}
                    </div>
                  `).join("")}
                </div>
              </div>
              <div class="mascot-pack-action-col">
                <span class="mascot-pack-price">💎 150</span>
                ${isPack1Owned ? `
                  <span style="font-size:11.5px; font-weight:900; color:#16a34a; background:#dcfce7; padding:4px 10px; border-radius:10px;">✓ Đã mở</span>
                ` : `
                  <button type="button" class="btn-duo btn-duo-pink" style="padding:6px 14px; font-size:12px; font-weight:900;" onclick="buyItem('mascot_pack_champions')">
                    Mở khóa
                  </button>
                `}
              </div>
            </div>

            <!-- GÓI 2: THỎ KAWAII COSPLAY -->
            <div class="mascot-pack-compact-card sakura">
              <div class="mascot-pack-info">
                <div class="mascot-pack-title-row">
                  <span>🎀</span>
                  <h4 class="mascot-pack-title">Gói 2: Thỏ Kawaii Cosplay</h4>
                  <span style="font-size:10px; font-weight:900; background:var(--lumi-pink); color:#fff; padding:1px 6px; border-radius:999px;">7 Con</span>
                </div>
                <div class="mascot-pack-chips-row">
                  ${MASCOT_PACKS.mascot_pack_cosplay.keys.map(k => `
                    <div class="mascot-mini-chip" title="${esc(THO_METADATA[k]?.name || k)}" onclick="openMascotDetailModal('${esc(k)}')">
                      ${generateThoBayMauSvg({ state: k, size: 24 })}
                    </div>
                  `).join("")}
                </div>
              </div>
              <div class="mascot-pack-action-col">
                <span class="mascot-pack-price" style="color:var(--lumi-pink-dark);">💎 150</span>
                ${isPack2Owned ? `
                  <span style="font-size:11.5px; font-weight:900; color:#16a34a; background:#dcfce7; padding:4px 10px; border-radius:10px;">✓ Đã mở</span>
                ` : `
                  <button type="button" class="btn-duo btn-duo-pink" style="padding:6px 14px; font-size:12px; font-weight:900;" onclick="buyItem('mascot_pack_cosplay')">
                    Mở khóa
                  </button>
                `}
              </div>
            </div>
          </div>

          <!-- TỦ ĐỒ 20 MASCOT: COMPACT GRID ("NHẤN VÀO LÀ XỔ RA") -->
          <div class="mascot-wardrobe-header">
            <div>
              <h3 style="font-size:15px; font-weight:900; margin:0; color:var(--ink-900);">🐰 Tủ Đồ 20 Mascot Thỏ Bảy Màu</h3>
              <p style="font-size:12px; color:var(--ink-500); margin:2px 0 0;">Nhấn vào bất kỳ biểu cảm nào để phóng to xem chi tiết & chọn làm Avatar đồng hành!</p>
            </div>
            <span class="unlocked-counter-badge">
              Đã mở khóa: <b>${[...MASCOT_DEFAULT_KEYS, ...MASCOT_PACKS.mascot_pack_champions.keys, ...MASCOT_PACKS.mascot_pack_cosplay.keys].filter(k => isMascotUnlocked(k)).length}</b> / 20
            </span>
          </div>

          <div class="mascot-tokens-grid">
            ${[...MASCOT_DEFAULT_KEYS, ...MASCOT_PACKS.mascot_pack_champions.keys, ...MASCOT_PACKS.mascot_pack_cosplay.keys].map(k => {
              const meta = THO_METADATA[k] || { name: k };
              const isUnlocked = isMascotUnlocked(k);
              const isEquipped = state.profile && (state.profile.avatar_url === `mascot:${k}`);
              return `
                <div class="mascot-token-tile ${isEquipped ? 'equipped' : isUnlocked ? 'unlocked' : 'locked'}" onclick="openMascotDetailModal('${esc(k)}')">
                  <div class="mascot-token-avatar">
                    ${generateThoBayMauSvg({ state: k, size: 46 })}
                  </div>
                  <div class="mascot-token-name">${esc(meta.name.split('(')[0].trim())}</div>
                  <span class="mascot-token-badge ${isEquipped ? 'mascot-badge-equipped' : isUnlocked ? 'mascot-badge-unlocked' : 'mascot-badge-locked'}">
                    ${isEquipped ? 'Đang dùng' : isUnlocked ? '✓ Có' : '🔒 Khóa'}
                  </span>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      ` : ''}

      <!-- TAB 3: VẬT PHẨM HỖ TRỢ HỌC TẬP & BÙA CHUỖI -->
      ${state.shopTab === 'items' ? `
        <div>
          <h2 style="font-size:18px; font-weight:900; color:var(--ink-900); margin:0 0 14px 0;">Vật Phẩm Hỗ Trợ Học Tập 🛡️✨</h2>
          <div class="shop-grid">
            ${consumablesHtml}
          </div>
        </div>
      ` : ''}
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
    state.stats = Object.assign({}, state.stats, res.stats || {});
    shopData = res.shop;
    if (res.shop && res.shop.items) {
      state.inventory = res.shop.items.filter(i => i.owned > 0).map(i => ({ item_code: i.item_code, quantity: i.owned }));
    }
    playSound("correct");
    if (itemCode.startsWith("deco_")) {
      await equipDecoration("avatar_decoration", itemCode);
    } else if (itemCode.startsWith("fx_")) {
      await equipDecoration("profile_effect", itemCode);
    } else {
      updateShell();
      render();
    }
  } catch (err) {
    playSound("wrong");
    showToast(err.message, true);
  }
};

// ========================================================
// ACHIEVEMENTS (THÀNH TÍCH HUY HIỆU)
// ========================================================
let achievementsData = null;
let dailyQuestsData = null;

async function fetchAchievements() {
  try {
    achievementsData = await api("/api/achievements");
    render();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function fetchDailyQuests() {
  try {
    dailyQuestsData = await api("/api/quests/daily");
    render();
  } catch (err) {
    showToast(err.message, true);
  }
}
window.fetchDailyQuests = fetchDailyQuests;

window.claimDailyQuest = async function(questCode) {
  try {
    playSound("click");
    const res = await api("/api/quests/claim", {
      method: "POST",
      body: { questCode }
    });
    playSound("fanfare");
    showToast(`Chúc mừng! Bạn đã nhận thưởng +${res.gemsAwarded} 💎 Đá quý! 🎉`);
    state.stats = res.stats;
    updateShell();
    if (dailyQuestsData) {
      const q = (dailyQuestsData.quests || []).find(x => x.code === questCode);
      if (q) q.isClaimed = true;
    }
    render();
  } catch (err) {
    playSound("wrong");
    showToast(err.message, true);
  }
};

function renderAchievements() {
  const currentTab = state.achievementTab || "quests";

  if (currentTab === "quests" && !dailyQuestsData) {
    fetchDailyQuests();
    return `<div class="loading-shell"><span class="loading-flower">✿</span><span>Đang tải nhiệm vụ hàng ngày...</span></div>`;
  }
  if (currentTab === "permanent" && !achievementsData) {
    fetchAchievements();
    return `<div class="loading-shell"><span class="loading-flower">✿</span><span>Đang tải thành tích...</span></div>`;
  }

  const items = (achievementsData && achievementsData.achievements) || [];
  const badges = ["🌟", "🔥", "⚡", "👑", "🎯", "💎", "🏆", "🎓", "🚀", "🪐"];

  const permanentHtml = items.map((item, idx) => {
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

  const quests = (dailyQuestsData && dailyQuestsData.quests) || [];
  const questsHtml = quests.map(q => {
    let actionBtn = "";
    if (q.isClaimed) {
      actionBtn = `<button type="button" class="btn-duo btn-duo-green" style="padding:10px 18px; font-size:13.5px; opacity:0.9;" disabled>✓ Đã nhận thưởng</button>`;
    } else if (q.isCompleted) {
      actionBtn = `<button type="button" class="btn-duo btn-duo-pink" style="padding:10px 20px; font-size:13.5px; font-weight:900;" onclick="claimDailyQuest('${esc(q.code)}')">🎁 Nhận +${q.gems} 💎</button>`;
    } else {
      actionBtn = `<button type="button" class="btn-duo btn-duo-white" style="padding:10px 18px; font-size:13px; opacity:0.75;" disabled>Đang làm (${q.current}/${q.target})</button>`;
    }

    return `
      <div class="quest-card ${q.isCompleted ? 'completed' : ''} ${q.isClaimed ? 'claimed' : ''}" style="background:#fff; border:2.5px solid var(--lumi-pink-border); border-radius:24px; padding:20px; box-shadow:0 6px 0 #ffd4e2; display:flex; flex-direction:column; justify-content:space-between; gap:14px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-size:32px; background:#fff0f5; width:52px; height:52px; border-radius:16px; display:grid; place-items:center; border:2px solid #ffd4e2;">${q.icon}</span>
            <div>
              <h3 style="margin:0; font-size:16.5px; font-weight:900; color:var(--ink-900);">${esc(q.title)}</h3>
              <p style="margin:4px 0 0; font-size:13px; color:var(--ink-500);">${esc(q.description)}</p>
            </div>
          </div>
          <span style="font-size:13px; font-weight:900; color:var(--lumi-pink); background:#fff0f5; padding:4px 10px; border-radius:999px; white-space:nowrap;">
            +${q.gems} 💎
          </span>
        </div>

        <div>
          <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:800; color:var(--ink-500); margin-bottom:6px;">
            <span>Tiến độ nhiệm vụ</span>
            <span style="color:var(--lumi-pink);">${q.current} / ${q.target}</span>
          </div>
          <div style="height:10px; background:#f1f5f9; border-radius:999px; overflow:hidden; border:1.5px solid #ffd4e2;">
            <div style="height:100%; width:${q.progressPercent}%; background:linear-gradient(90deg, #ff4b82, #ff2d78); transition:width 0.3s ease;"></div>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end;">
          ${actionBtn}
        </div>
      </div>
    `;
  }).join("");

  return `
    <div>
      <div class="banner-with-mascot" style="margin-bottom:20px;">
        <div>
          <h1 class="page-title" style="margin-bottom:6px;">Nhiệm Vụ & Thành Tích 🎖️</h1>
          <p class="page-subtitle" style="margin:0 0 14px 0;">Hoàn thành nhiệm vụ mỗi ngày và các cột mốc trọn đời để nhận kim cương 💎 sắm Mascot và vật phẩm!</p>
          <div class="top-stat top-gems" style="font-size:16px; display:inline-flex;">
            <span>💎</span> <b>${state.stats.gems || 0}</b> Đá quý hiện có
          </div>
        </div>
        <div class="banner-mascot-aside page-inline-mascot">
          ${renderThoBayMau({ state: THO_STATES.SWORD_MASTER, size: 126, speech: "Làm hết nhiệm vụ hôm nay chưa bạn ơi? 💎✨", speechDirection: "top" })}
        </div>
      </div>

      <!-- SWITCH TABS: NHIỆM VỤ HÀNG NGÀY vs THÀNH TÍCH TRỌN ĐỜI -->
      <div class="auth-switch-tabs" style="margin-bottom:24px; max-width:540px;">
        <button type="button" class="auth-switch-tab ${currentTab === 'quests' ? 'active' : ''}" onclick="state.achievementTab='quests'; render();">
          ⚡ Nhiệm vụ Hàng Ngày (Mỗi ngày 1 lần)
        </button>
        <button type="button" class="auth-switch-tab ${currentTab === 'permanent' ? 'active' : ''}" onclick="state.achievementTab='permanent'; render();">
          🎖️ Cột Mốc Trọn Đời
        </button>
      </div>

      ${currentTab === 'quests' ? `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
            <div>
              <h2 style="font-size:18px; font-weight:900; color:var(--ink-900); margin:0;">Nhiệm vụ Ngày ${dailyQuestsData ? esc(dailyQuestsData.date) : ''}</h2>
              <p style="font-size:13px; color:var(--ink-500); margin:2px 0 0;">Làm mới mỗi ngày lúc 00:00 (GMT+7) · Tích lũy tối đa 100 💎 mỗi ngày!</p>
            </div>
            <span style="font-size:12.5px; font-weight:800; color:var(--lumi-pink); background:#fff0f5; padding:6px 14px; border-radius:999px; border:1.5px solid #ffd4e2;">
              ⏳ Hết hạn: 23:59:59 hôm nay
            </span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:16px;">
            ${questsHtml}
          </div>
        </div>
      ` : `
        <div class="achievements-grid">
          ${permanentHtml}
        </div>
      `}
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
    const reviewCount = document.getElementById("nav-review-count");
    if (reviewCount) reviewCount.textContent = state.reviewMistakes.length;
    render();
  } catch (err) {
    showToast(err.message, true);
  }
}

function renderReview() {
  const mistakes = state.reviewMistakes || [];

  // Phân chia danh sách câu sai theo từng môn học
  const subjectGroups = new Map();
  mistakes.forEach(m => {
    const sId = m.subject_id || 0;
    const sName = m.subject_name || "Môn học khác";
    if (!subjectGroups.has(sId)) {
      subjectGroups.set(sId, { id: sId, name: sName, items: [] });
    }
    subjectGroups.get(sId).items.push(m);
  });
  const subjects = Array.from(subjectGroups.values());

  // 1. CHẾ ĐỘ LUYỆN TẬP LÀM LẠI CÂU HỎI TRẮC NGHIỆM THỰC THỤ
  if (state.reviewPracticeActive) {
    const practiceList = (state.reviewPracticeList && state.reviewPracticeList.length)
      ? state.reviewPracticeList
      : mistakes;
    const cur = practiceList[state.reviewCurrentIndex];

    // Khi đã hoàn thành toàn bộ câu hỏi trong danh sách ôn tập
    if (!cur) {
      return `
        <div style="max-width:640px; margin:40px auto; text-align:center; background:#fff; border:3px solid var(--ink-900); border-radius:32px; padding:44px 32px; box-shadow:0 12px 0 var(--ink-900);">
          ${renderThoBayMau({ state: THO_STATES.KING_CHAMPION, size: 160, speech: "Tuyệt đỉnh! Đã vượt qua toàn bộ câu ôn tập! 👑" })}
          <h2 style="font-size:26px; font-weight:900; color:var(--ink-900); margin:18px 0 8px;">Hoàn thành ôn tập câu sai!</h2>
          <p style="font-size:15px; color:var(--ink-500); max-width:440px; margin:0 auto 24px;">
            Bạn đã khắc phục thành công các câu hỏi chưa nhớ và tích lũy thêm điểm thưởng XP. Hãy tiếp tục giữ vững phong độ nhé!
          </p>
          <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
            <button type="button" class="btn-duo btn-duo-pink" style="padding:14px 28px;" onclick="stopReview()">
              Quay lại danh mục Ôn tập 🎯
            </button>
            <button type="button" class="btn-duo btn-duo-white" style="padding:14px 28px;" onclick="state.page='home'; state.reviewPracticeActive=false; render();">
              Về lộ trình học 🗺️
            </button>
          </div>
        </div>
      `;
    }

    const progressPercent = Math.round((state.reviewCurrentIndex / practiceList.length) * 100);
    const checked = state.reviewCheckedResult;
    const options = cur.options || [];

    const optionsHtml = options.map((opt, idx) => {
      const isSelected = state.reviewSelectedChoice === opt.key;
      const isCorrectOption = checked && normalizeAnswer(checked.correctAnswer) === normalizeAnswer(opt.key);
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
        <button type="button" class="quiz-choice-btn ${extraClass}" data-choice-key="${esc(opt.key)}" ${inlineStyle} onclick="selectReviewChoice('${esc(opt.key)}')" ${checked || state.reviewChecking ? 'disabled' : ''}>
          <span class="quiz-key-pill">${esc(opt.key || String(idx + 1))}</span>
          <span class="quiz-choice-text">${esc(opt.text || opt.key)}</span>
        </button>
      `;
    }).join("");

    let footerStatusClass = "";
    let feedbackHtml = `
      <button type="button" class="btn-duo btn-duo-pink" style="min-width:200px; padding:15px; font-size:15px;" onclick="checkReviewAnswer()" ${!state.reviewSelectedChoice || state.reviewChecking ? 'disabled' : ''}>
        ${state.reviewChecking ? '<span class="quiz-spinner"></span> Đang kiểm tra…' : 'Kiểm tra đáp án'}
      </button>
    `;

    if (checked) {
      if (checked.isCorrect) {
        footerStatusClass = "status-correct";
        feedbackHtml = `
          <div class="quiz-feedback-box">
            <span class="feedback-icon-badge">✓</span>
            <div class="feedback-text">
              <span class="feedback-headline">Chính xác! Đã khắc phục câu sai thành công! (+5 XP ⭐)</span>
              <span class="feedback-explanation">${esc(checked.explanation || "Rất tốt! Câu hỏi này đã được hoàn thành xuất sắc.")}</span>
            </div>
          </div>
          <button type="button" class="btn-duo btn-duo-pink" style="min-width:180px; padding:15px; font-size:15px;" onclick="nextReviewQuestion()">
            Tiếp tục ➔
          </button>
        `;
      } else {
        footerStatusClass = "status-wrong";
        feedbackHtml = `
          <div class="quiz-feedback-box">
            <span class="feedback-icon-badge">✕</span>
            <div class="feedback-text">
              <span class="feedback-headline">Chưa chính xác rồi! Đừng nản nhé.</span>
              <span class="feedback-explanation">Đáp án đúng là: <strong>${esc(checked.correctAnswer)}</strong>. ${esc(checked.explanation || "")}</span>
            </div>
          </div>
          <button type="button" class="btn-duo btn-duo-red" style="min-width:180px; padding:15px; font-size:15px;" onclick="nextReviewQuestion()">
            Tiếp tục ➔
          </button>
        `;
      }
    }

    return `
      <div style="max-width:720px; margin:20px auto 40px; display:flex; flex-direction:column; gap:16px;">
        <!-- Thanh tiến độ & Dừng làm -->
        <div style="display:flex; justify-content:space-between; align-items:center; gap:14px;">
          <button type="button" class="btn-duo btn-duo-white" style="padding:8px 16px; font-size:13.5px;" onclick="stopReview()">
            ✕ Dừng ôn tập
          </button>
          <div style="flex:1; max-width:320px; height:12px; background:#f1f5f9; border:2px solid var(--ink-900); border-radius:999px; overflow:hidden;">
            <div style="height:100%; width:${progressPercent}%; background:var(--lumi-pink); transition:width 0.3s ease;"></div>
          </div>
          <span style="font-weight:900; font-size:14px; color:var(--lumi-pink);">Câu ${state.reviewCurrentIndex + 1} / ${practiceList.length}</span>
        </div>

        <!-- Khung nội dung câu hỏi trắc nghiệm -->
        <div class="quiz-card" style="padding:28px 24px; border:3px solid var(--ink-900); border-radius:28px; box-shadow:0 8px 0 var(--ink-900); background:#fff;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
            <span style="font-size:13px; font-weight:900; color:var(--lumi-pink); text-transform:uppercase; letter-spacing:0.5px;">
              📚 ${esc(cur.subject_name)} • ${esc(cur.lesson_title)}
            </span>
            <span style="font-size:12px; font-weight:800; color:#ef4444; background:#fee2e2; border-radius:999px; padding:2px 10px;">
              Đã sai ${cur.wrong_count} lần
            </span>
          </div>

          <h2 style="font-size:20px; font-weight:900; color:var(--ink-900); line-height:1.45; margin:0 0 20px 0;">
            ${esc(cur.question_text)}
          </h2>

          <!-- Danh sách lựa chọn A, B, C, D -->
          <div class="quiz-choices-grid" style="display:flex; flex-direction:column; gap:10px;">
            ${optionsHtml}
          </div>
        </div>

        <!-- Khung phản hồi đáp án & nút tiếp tục -->
        <div class="quiz-footer ${footerStatusClass}" style="border-radius:24px; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; gap:16px; border:2.5px solid var(--ink-900); box-shadow:0 6px 0 var(--ink-900); background:#fff;">
          ${feedbackHtml}
        </div>
      </div>
    `;
  }

  // 2. MÀN HÌNH TỔNG QUAN CÂU SAI (PHÂN CHIA RÕ RÀNG THEO TỪNG MÔN HỌC)
  const activeSubjectId = state.reviewSubjectFilter || "all";
  const displaySubjects = (activeSubjectId === "all")
    ? subjects
    : subjects.filter(s => String(s.id) === String(activeSubjectId));

  const subjectTabsHtml = `
    <div style="display:flex; gap:8px; flex-wrap:wrap; margin:16px 0 24px;">
      <button type="button" class="btn-duo ${activeSubjectId === 'all' ? 'btn-duo-pink' : 'btn-duo-white'}" style="padding:8px 18px; font-size:13.5px;" onclick="filterReviewSubject('all')">
        Tất cả môn (${mistakes.length})
      </button>
      ${subjects.map(s => `
        <button type="button" class="btn-duo ${String(activeSubjectId) === String(s.id) ? 'btn-duo-pink' : 'btn-duo-white'}" style="padding:8px 18px; font-size:13.5px;" onclick="filterReviewSubject('${s.id}')">
          📚 ${esc(s.name)} (${s.items.length})
        </button>
      `).join("")}
    </div>
  `;

  const subjectSectionsHtml = displaySubjects.map(sub => {
    return `
      <div style="background:#fff; border:3px solid var(--ink-900); border-radius:28px; box-shadow:0 8px 0 var(--ink-900); padding:24px; margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; border-bottom:2px dashed #fbcfe8; padding-bottom:14px; flex-wrap:wrap; gap:12px;">
          <div>
            <h3 style="font-size:19px; font-weight:900; color:var(--ink-900); margin:0 0 4px 0;">
              📚 ${esc(sub.name)}
            </h3>
            <span style="font-size:13px; font-weight:800; color:var(--lumi-pink);">
              Có ${sub.items.length} câu trắc nghiệm cần củng cố
            </span>
          </div>
          <button type="button" class="btn-duo btn-duo-pink" style="padding:10px 20px; font-size:14px;" onclick="startReviewSubject('${sub.id}')">
            🎯 Luyện tập môn này (${sub.items.length} câu)
          </button>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px;">
          ${sub.items.map((m, idx) => `
            <div style="background:#fff7fa; border:2px solid #ffd6e5; border-radius:18px; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; gap:16px; transition:all 0.2s ease;">
              <div style="flex:1;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                  <span style="font-size:12px; font-weight:900; color:var(--lumi-pink); text-transform:uppercase;">Bài: ${esc(m.lesson_title)}</span>
                  <span style="font-size:11px; font-weight:800; color:#dc2626; background:#fee2e2; border-radius:999px; padding:2px 8px;">Đã sai ${m.wrong_count} lần</span>
                </div>
                <h4 style="font-size:15.5px; font-weight:900; color:var(--ink-900); margin:0; line-height:1.4;">
                  ${idx + 1}. ${esc(m.question_text)}
                </h4>
                <div style="font-size:12px; color:var(--ink-500); margin-top:6px;">
                  ${m.options && m.options.length ? `Gồm ${m.options.length} lựa chọn trắc nghiệm` : 'Câu hỏi trắc nghiệm'}
                </div>
              </div>
              <button type="button" class="btn-duo btn-duo-white" style="padding:8px 16px; font-size:13px; white-space:nowrap;" onclick="startReviewSingle(${Number(m.id)})">
                Làm lại câu này ➔
              </button>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");

  return `
    <div style="max-width:820px; margin:0 auto 40px;">
      <!-- Hero Banner -->
      <div class="banner-with-mascot" style="margin-bottom:16px;">
        <div>
          <h1 class="page-title" style="margin-bottom:6px;">Ôn tập Câu sai 🎯</h1>
          <p class="page-subtitle" style="margin:0 0 14px 0;">Khắc phục các câu đã làm sai, phân chia theo từng môn học để củng cố kiến thức và nhận +5 XP mỗi câu!</p>
          ${mistakes.length ? `
            <button type="button" class="btn-duo btn-duo-pink" style="padding:14px 28px; font-size:15px;" onclick="startReviewSubject('all')">
              Luyện tập tất cả (${mistakes.length} câu) 🎯
            </button>
          ` : ''}
        </div>
        <div class="banner-mascot-aside page-inline-mascot">
          ${renderThoBayMau({ state: THO_STATES.DETECTIVE_FIX, size: 126, speech: "Ôn lại câu sai là nhớ lâu nhất đó! 🔍", speechDirection: "top" })}
        </div>
      </div>

      <!-- Tab lọc theo từng môn học -->
      ${mistakes.length ? subjectTabsHtml : ''}

      <!-- Danh sách nhóm câu sai theo môn -->
      <div>
        ${mistakes.length ? subjectSectionsHtml : `
          <div class="empty-state" style="background:#fff; border:3px dashed var(--lumi-pink-border); border-radius:32px; padding:54px 24px; text-align:center;">
            <span style="font-size:58px;">🎉</span>
            <h3 style="font-weight:900; color:var(--ink-900); font-size:22px; margin-top:14px;">Tuyệt vời! Bạn không có câu sai nào!</h3>
            <p style="font-size:15px; color:var(--ink-500); margin-top:6px; max-width:440px; margin-left:auto; margin-right:auto;">Toàn bộ bài trắc nghiệm bạn làm đều đạt chuẩn hoặc đã được khắc phục hoàn toàn. Hãy tiếp tục học bài mới nhé!</p>
            <button type="button" class="btn-duo btn-duo-pink" style="margin-top:18px; padding:12px 24px;" onclick="state.page='home'; render();">
              Khám phá bài học mới ➔
            </button>
          </div>
        `}
      </div>
    </div>
  `;
}

window.filterReviewSubject = function(subjectId) {
  playSound("click");
  state.reviewSubjectFilter = subjectId;
  render();
};

window.startReviewSubject = function(subjectId) {
  playSound("click");
  const mistakes = state.reviewMistakes || [];
  const list = (subjectId === "all" || !subjectId)
    ? mistakes
    : mistakes.filter(m => String(m.subject_id) === String(subjectId));

  if (!list.length) {
    showToast("Không có câu sai nào cần ôn tập trong môn này!");
    return;
  }

  state.reviewSubjectFilter = subjectId;
  state.reviewPracticeList = list;
  state.reviewCurrentIndex = 0;
  state.reviewSelectedChoice = "";
  state.reviewCheckedResult = null;
  state.reviewChecking = false;
  state.reviewPracticeActive = true;
  render();
};

window.startReviewSingle = function(mistakeId) {
  playSound("click");
  const mistakes = state.reviewMistakes || [];
  const single = mistakes.filter(m => Number(m.id) === Number(mistakeId));
  if (!single.length) return;

  state.reviewPracticeList = single;
  state.reviewCurrentIndex = 0;
  state.reviewSelectedChoice = "";
  state.reviewCheckedResult = null;
  state.reviewChecking = false;
  state.reviewPracticeActive = true;
  render();
};

window.selectReviewChoice = function(key) {
  if (state.reviewCheckedResult || state.reviewChecking) return;
  playSound("click");
  state.reviewSelectedChoice = key;
  render();
};

window.checkReviewAnswer = async function() {
  if (!state.reviewSelectedChoice || state.reviewChecking) return;
  const practiceList = state.reviewPracticeList || [];
  const cur = practiceList[state.reviewCurrentIndex];
  if (!cur) return;

  state.reviewChecking = true;
  render();

  try {
    const res = await api("/api/review/solve", {
      method: "POST",
      body: {
        mistakeId: cur.id || cur.question_id,
        selectedChoice: state.reviewSelectedChoice
      }
    });

    state.reviewCheckedResult = res;
    if (res.isCorrect) {
      playSound("correct");
      if (res.stats) {
        state.stats = res.stats;
        updateShell();
      }
      // Loại câu hỏi này ra khỏi danh sách câu sai
      state.reviewMistakes = state.reviewMistakes.filter(m => Number(m.id) !== Number(cur.id) && Number(m.question_id) !== Number(cur.question_id));
      const reviewCount = document.getElementById("nav-review-count");
      if (reviewCount) reviewCount.textContent = state.reviewMistakes.length;
    } else {
      playSound("wrong");
    }
  } catch (err) {
    showToast(err.message, true);
  } finally {
    state.reviewChecking = false;
    render();
  }
};

window.nextReviewQuestion = function() {
  playSound("click");
  state.reviewSelectedChoice = "";
  state.reviewCheckedResult = null;
  state.reviewCurrentIndex++;
  const practiceList = state.reviewPracticeList || [];
  if (state.reviewCurrentIndex >= practiceList.length) {
    state.reviewPracticeActive = false;
    showToast("Chúc mừng bạn đã hoàn thành bài ôn tập! 🎉");
    fetchReview();
  }
  render();
};

window.stopReview = function() {
  playSound("click");
  state.reviewPracticeActive = false;
  state.reviewSelectedChoice = "";
  state.reviewCheckedResult = null;
  state.reviewChecking = false;
  render();
};

window.startReview = function() {
  window.startReviewSubject(state.reviewSubjectFilter || "all");
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
  if (state.isChatDropdownOpen) state.isChatConvoDropdownOpen = false;
  render();
};

window.toggleChatConvoDropdown = function(e) {
  if (e) e.stopPropagation();
  playSound("click");
  state.isChatConvoDropdownOpen = !state.isChatConvoDropdownOpen;
  if (state.isChatConvoDropdownOpen) state.isChatDropdownOpen = false;
  render();
};

window.selectChatConversation = function(convoId) {
  playSound("click");
  state.isChatConvoDropdownOpen = false;
  loadChatConversation(convoId);
};

window.selectChatSubject = function(subId) {
  playSound("click");
  state.chatSubjectId = subId === "free" ? "free" : Number(subId);
  state.isChatDropdownOpen = false;
  render();
};

// Global click-outside to close chat dropdowns
document.addEventListener("click", function(e) {
  let changed = false;
  if (state.isChatDropdownOpen && !e.target.closest("#chat-dropdown-wrap")) {
    state.isChatDropdownOpen = false;
    changed = true;
  }
  if (state.isChatConvoDropdownOpen && !e.target.closest("#chat-convo-dropdown-wrap")) {
    state.isChatConvoDropdownOpen = false;
    changed = true;
  }
  if (changed) render();
});

// ========================================================
// CHAT / LUMI AI
// ========================================================
function renderChat() {
  const isFreeMode = state.chatSubjectId === "free";
  const currentSub = isFreeMode ? null : (state.subjects.find(s => Number(s.id) === Number(state.chatSubjectId || state.currentSubjectId)) || state.subjects[0]);
  const currentSubjectLabel = isFreeMode ? "AI tự do · mọi môn" : (currentSub?.subject_name || "Chọn môn học");
  const currentSubjectIcon = isFreeMode ? "✨" : subjectIcon(currentSub);
  
  const activeConvo = state.chatConversations.find(c => c.id === state.chatConversationId);
  const activeConvoTitle = activeConvo ? (activeConvo.title || "Phiên hỏi đáp") : "Cuộc trò chuyện mới";

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

        <div class="chat-header-actions" style="display:flex; align-items:center; gap:10px;">
          <!-- CUSTOM ANIMATED DROPDOWN CHO LỊCH SỬ CHAT AI -->
          <div class="lumi-dropdown-wrapper" id="chat-convo-dropdown-wrap">
            <button type="button" class="lumi-dropdown-btn ${state.isChatConvoDropdownOpen ? 'active' : ''}" onclick="toggleChatConvoDropdown(event)" style="min-width:180px; max-width:240px;">
              <span style="font-size:16px;">💬</span>
              <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; text-align:left;">${esc(activeConvoTitle)}</span>
              <span class="chevron-arrow">▾</span>
            </button>
            ${state.isChatConvoDropdownOpen ? `
              <div class="lumi-dropdown-panel convo-history-panel" style="width:280px; max-height:360px; overflow-y:auto;">
                <div class="convo-panel-header">
                  <span>💬 Lịch sử trò chuyện</span>
                  <span class="tab-count-pill">${state.chatConversations.length}</span>
                </div>
                <div class="lumi-dropdown-item ${!state.chatConversationId ? 'selected' : ''}" onclick="selectChatConversation('')">
                  <div class="lumi-dropdown-item-left">
                    <span style="font-size:16px;">✨</span>
                    <strong style="color:var(--lumi-pink);">+ Cuộc trò chuyện mới</strong>
                  </div>
                  ${!state.chatConversationId ? '<span class="lumi-dropdown-check">✓</span>' : ''}
                </div>
                <div style="height:1px; background:#f4f4f5; margin:4px 0;"></div>
                ${state.chatConversations.length ? state.chatConversations.map(item => `
                  <div class="lumi-dropdown-item ${item.id === state.chatConversationId ? 'selected' : ''}" onclick="selectChatConversation('${esc(item.id)}')">
                    <div class="lumi-dropdown-item-left" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:210px;">
                      <span style="font-size:15px;">💭</span>
                      <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(item.title || "Phiên hỏi đáp")}</span>
                    </div>
                    ${item.id === state.chatConversationId ? '<span class="lumi-dropdown-check">✓</span>' : ''}
                  </div>
                `).join("") : `
                  <div style="padding:16px; text-align:center; color:var(--ink-400); font-size:12.5px;">
                    Chưa có lịch sử trò chuyện nào
                  </div>
                `}
              </div>
            ` : ''}
          </div>

          <button type="button" class="btn-duo btn-duo-pink" style="height:42px; padding:0 16px; font-size:13.5px; border-radius:14px; white-space:nowrap;" onclick="startNewChat()">
            ＋ Mới
          </button>

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
      <div class="fb-card" style="position:relative; overflow:hidden;">
        ${renderProfileEffectHtml(profile.profile_effect)}
        <!-- 1. FACEBOOK COVER BANNER (ẢNH BÌA) -->
        <div class="fb-cover-banner" style="${isCoverGradient ? `background:${coverBg};` : `background-image:url('${esc(coverBg)}');`}">
          <button type="button" class="fb-cover-edit-btn" onclick="openCoverModal()">
            📷 Chỉnh sửa ảnh bìa
          </button>
        </div>

        <!-- 2. FACEBOOK HEADER WITH OVERLAPPING AVATAR -->
        <div class="fb-header-body" style="position:relative; z-index:2;">
          <div class="fb-avatar-row">
            <div class="fb-avatar-container" style="overflow:visible;">
              <div class="fb-avatar-large with-nitro" style="overflow:visible; background:transparent; border:none; box-shadow:none;">
                ${renderDecoratedAvatar(profile.avatar_url, profile.avatar_decoration, 140, profile.full_name)}
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
              ${esc(profile.full_name || "Bạn học mới")}
              <span class="fb-verified-badge" title="Học viên chính thức">✿</span>
            </h1>
            <div class="fb-user-handle">${profile.username ? `@${esc(profile.username)}` : ""}</div>
            <p class="fb-user-bio">${profile.bio ? esc(profile.bio) : '<span style="color:var(--ink-500); font-style:italic;">(Chưa có tiểu sử. Nhấn "Chỉnh sửa tiểu sử" để thêm)</span>'}</p>
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
            <div class="fb-tab-item ${state.fbProfileTab === 'nitro' ? 'active' : ''}" onclick="switchFbTab('nitro')">
              ✨ Hiệu ứng Nitro (Discord)
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
          ` : state.fbProfileTab === 'inventory' ? `
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
          ` : `
            <div class="fb-side-card">
              <h3 class="fb-side-card-title">✨ Quản lý Hiệu ứng Discord Nitro</h3>
              <p style="font-size:13.5px; color:var(--ink-500); margin-bottom:16px;">
                Tùy chỉnh khung viền avatar chuyển động và hiệu ứng nền hồ sơ phong cách Discord Nitro của bạn.
              </p>
              
              <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:18px;">
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:#fff7fa; border-radius:14px; border-left:4px solid var(--lumi-pink);">
                  <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-size:24px;">🖼️</span>
                    <div>
                      <strong style="color:var(--ink-900); font-size:14px;">Khung Viền Avatar</strong>
                      <div style="font-size:12px; color:var(--ink-500);">${profile.avatar_decoration ? esc(DISCORD_EFFECTS_REGISTRY[profile.avatar_decoration]?.name || profile.avatar_decoration) : "Chưa trang bị khung viền"}</div>
                    </div>
                  </div>
                  ${profile.avatar_decoration ? `
                    <button type="button" class="btn-duo btn-duo-white" style="padding:6px 12px; font-size:12px;" onclick="equipDecoration('avatar_decoration', null)">
                      Tháo ra
                    </button>
                  ` : `
                    <button type="button" class="btn-duo btn-duo-pink" style="padding:6px 12px; font-size:12px;" onclick="state.page='shop'; state.shopTab='nitro'; render();">
                      Chọn khung
                    </button>
                  `}
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:#f5f3ff; border-radius:14px; border-left:4px solid #8b5cf6;">
                  <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-size:24px;">🎆</span>
                    <div>
                      <strong style="color:var(--ink-900); font-size:14px;">Hiệu Ứng Thẻ Hồ Sơ</strong>
                      <div style="font-size:12px; color:var(--ink-500);">${profile.profile_effect ? esc(DISCORD_EFFECTS_REGISTRY[profile.profile_effect]?.name || profile.profile_effect) : "Chưa trang bị hiệu ứng nền"}</div>
                    </div>
                  </div>
                  ${profile.profile_effect ? `
                    <button type="button" class="btn-duo btn-duo-white" style="padding:6px 12px; font-size:12px;" onclick="equipDecoration('profile_effect', null)">
                      Tháo ra
                    </button>
                  ` : `
                    <button type="button" class="btn-duo btn-duo-pink" style="padding:6px 12px; font-size:12px;" onclick="state.page='shop'; state.shopTab='nitro'; render();">
                      Chọn hiệu ứng
                    </button>
                  `}
                </div>
              </div>

              <button class="btn-duo btn-duo-purple" style="width:100%; background:#5865f2; color:#fff;" onclick="state.page='shop'; state.shopTab='nitro'; render();">
                Ghé Tiệm Nitro Nhận Thêm Hiệu Ứng 0 💎 ➔
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
  let freezeCountRendered = 0;
  for (let i = 27; i >= 0; i--) {
    const d = new Date(Date.UTC(tY, tM - 1, tD - i));
    const key = d.toISOString().slice(0, 10);
    const dayNum = d.getUTCDate();
    const isCurToday = key === refDate;
    const status = historyMap.get(key);
    const done = status === "completed";
    
    // Tối đa 2 lần hóa đá (bảo vệ chuỗi) theo đúng cơ chế Duolingo:
    const isFreezeUsed = (status === "freeze_used") && (freezeCountRendered < 2);
    if (isFreezeUsed) freezeCountRendered++;

    let cellClass = "streak-cell";
    let icon = dayNum;
    if (done) {
      cellClass += " done";
      icon = "🔥";
    } else if (isFreezeUsed) {
      cellClass += " frozen";
      icon = "🧊";
    } else if (isCurToday) {
      cellClass += " today";
      icon = dayNum;
    } else {
      // Tất cả ngày nghỉ thông thường khác hiển thị lịch số bình thường!
      cellClass += " normal-date";
      icon = dayNum;
    }

    cells.push(`
      <div class="${cellClass}" title="${key}${done ? ' - Đã hoàn thành 🔥' : isFreezeUsed ? ' - Đóng băng chuỗi 🧊' : isCurToday ? ' - Hôm nay ⚡' : ' - Ngày ' + dayNum}">
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
            <strong style="display:block; font-size:14px; color:#18181b;">Bảo Vệ Chuỗi Chuẩn Duolingo</strong>
            <small style="color:#71717a; font-size:12px;">Đang có: <strong>${freezeCount} / 2</strong> bùa bảo vệ. Tối đa 2 ngày nghỉ không đứt chuỗi. Quá 2 ngày lịch sẽ về số thường và mất chuỗi. Hết bùa thì mua trong Shop nhé!</small>
          </div>
          <button class="btn-duo btn-duo-pink" style="padding:8px 14px; font-size:12px; white-space:nowrap;" onclick="closeStreakModal(); state.page='shop'; render();">
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
// TRUNG TÂM CẢI THIỆN ĐIỂM & CỐ VẤN HỌC VỤ IU CMCU
// ========================================================

function formatAdvisorMarkdown(text) {
  if (!text) return "";

  // Loại bỏ các dòng rườm rà không cần thiết
  let clean = text
    .replace(/^Kính gửi:[^\n]*\n?/gim, "")
    .replace(/^Chủ đề:[^\n]*\n?/gim, "")
    .replace(/^---\s*$/gm, "")
    .trim();

  const rawLines = clean.split("\n");
  const blocks = [];
  let tableBuffer = [];

  const flushTable = () => {
    if (tableBuffer.length >= 2 && tableBuffer[1].includes("---")) {
      const parseCells = (row) => row.split("|").slice(1, -1).map(c => c.trim());
      const headerCells = parseCells(tableBuffer[0]);
      const bodyRows = tableBuffer.slice(2);

      let tableHtml = '<div class="advisor-table-wrap"><table class="advisor-markdown-table"><thead><tr>';
      for (const h of headerCells) {
        let fH = esc(h).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        tableHtml += `<th>${fH}</th>`;
      }
      tableHtml += '</tr></thead><tbody>';
      for (const b of bodyRows) {
        const cells = parseCells(b);
        tableHtml += '<tr>';
        for (const c of cells) {
          let fC = esc(c)
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
          tableHtml += `<td>${fC}</td>`;
        }
        tableHtml += '</tr>';
      }
      tableHtml += '</tbody></table></div>';
      blocks.push(tableHtml);
    } else {
      for (const line of tableBuffer) {
        blocks.push('<p class="advisor-p">' + esc(line) + '</p>');
      }
    }
    tableBuffer = [];
  };

  for (let line of rawLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      tableBuffer.push(trimmed);
      continue;
    } else if (tableBuffer.length > 0) {
      flushTable();
    }

    if (!trimmed) continue;

    let formatted = esc(trimmed)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');

    if (trimmed.startsWith("### ")) {
      blocks.push('<h4 class="advisor-h3">' + formatted.slice(4) + '</h4>');
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push('<h3 class="advisor-h2">' + formatted.slice(3) + '</h3>');
      continue;
    }
    if (trimmed.startsWith("# ")) {
      blocks.push('<h2 class="advisor-h1">' + formatted.slice(2) + '</h2>');
      continue;
    }

    const numMatch = trimmed.match(/^(\d+)[\.\)]\s*(.*)$/);
    if (numMatch) {
      const content = esc(numMatch[2]).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      blocks.push('<div class="advisor-list-item"><span class="advisor-num">' + numMatch[1] + '.</span><div>' + content + '</div></div>');
      continue;
    }

    const bulletMatch = trimmed.match(/^[-•*]\s+(.*)$/);
    if (bulletMatch) {
      const content = esc(bulletMatch[1]).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      blocks.push('<div class="advisor-bullet-item"><span class="advisor-bullet">💡</span><div>' + content + '</div></div>');
      continue;
    }

    if (trimmed.startsWith("&gt; ") || trimmed.startsWith("> ")) {
      const content = formatted.replace(/^(&gt;|>)\s*/, '');
      blocks.push('<div class="advisor-callout">' + content + '</div>');
      continue;
    }

    blocks.push('<p class="advisor-p">' + formatted + '</p>');
  }

  if (tableBuffer.length > 0) {
    flushTable();
  }

  return blocks.join("");
}

function renderGradesView() {
  const hasData = state.academicTranscript && state.academicTranscript.hasTranscript && state.academicTranscript.transcript;

  if (!hasData) {
    return `
      <div class="grades-onboarding-container">
        <div class="grades-hero-card">
          <div class="grades-hero-mascot">
            ${renderThoBayMau({
              state: THO_STATES.GENIUS,
              size: 170,
              speech: "Chào bạn học! Hãy kết nối tài khoản IU trường để Thỏ soi bảng điểm và bày mưu tính kế nâng GPA lên đỉnh chóp nhé! 🐰🎓",
              speechDirection: "top"
            })}
          </div>
          <div class="grades-hero-content">
            <span class="grades-pill-badge">CMC UNIVERSITY • CỔNG THÔNG TIN IU</span>
            <h1 class="grades-hero-title">Trung Tâm Cải Thiện Điểm & Cố Vấn Học Vụ 3TG AI</h1>
            <p class="grades-hero-desc">
              Kết nối trực tiếp tài khoản sinh viên cổng <strong>iu.cmcu.edu.vn</strong> để tra cứu điểm số, tổng kết GPA Hệ 10 & Hệ 4, bóc tách môn học theo từng học kỳ, tự động phát hiện "hòn đá tảng" kéo điểm và nhận lộ trình nâng điểm cá nhân hóa bằng <strong>Trợ giảng AI DeepSeek</strong>!
            </p>
            <div class="grades-hero-actions">
              <button type="button" class="btn-duo btn-duo-pink grades-main-btn" onclick="window.openAcademicLoginModal()">
                🚀 Đăng Nhập Cổng IU Trường Để Lấy Điểm
              </button>
            </div>
          </div>
        </div>

        <div class="grades-features-grid">
          <div class="grades-feature-card">
            <div class="feature-icon-wrap" style="background: rgba(255, 117, 151, 0.15); color: #ff4d80;">📊</div>
            <h3>Bảng Điểm Chia Kỳ Chuẩn Xác</h3>
            <p>Tra cứu điểm tích lũy hệ 10 và hệ 4, phân loại rõ ràng từng kỳ học, đầy đủ các cột điểm Chuyên cần, Bài tập, Giữa kỳ và Cuối kỳ.</p>
          </div>
          <div class="grades-feature-card">
            <div class="feature-icon-wrap" style="background: rgba(0, 180, 216, 0.15); color: #00b4d8;">🎯</div>
            <h3>Bắt Bệnh & Mô Phỏng Nâng Điểm</h3>
            <p>Thuật toán tự động tìm ra các môn điểm C, D, F kéo tụt GPA nhiều nhất. Mô phỏng ngay GPA mới nếu bạn học lại hoặc cải thiện môn đó.</p>
          </div>
          <div class="grades-feature-card">
            <div class="feature-icon-wrap" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">🤖</div>
            <h3>Cố Vấn AI DeepSeek Độc Quyền</h3>
            <p>Giáo sư Thỏ Bảy Màu phân tích chiến lược chọn môn gỡ điểm, hướng dẫn phương pháp học Active Recall và lập lịch ôn thi 4 tuần cụ thể.</p>
          </div>
        </div>
      </div>
    `;
  }

  const { transcript, aiAnalysis, targetGpa = 3.2, lastSyncedAt } = state.academicTranscript;
  const { student = {}, gpa = {}, semesters = [], weak_subjects = [], raw_subjects = [], active_courses = [] } = transcript || {};

  // Tính toán mô phỏng GPA What-If
  let simWeighted4 = gpa.overall_4 * gpa.total_credits;
  let simCount = 0;
  for (const [code, targetScore] of state.academicSimulatedScores.entries()) {
    const s = raw_subjects.find(x => x.ma_mon === code);
    if (s && targetScore > s.diem_he_4) {
      simWeighted4 += (targetScore - s.diem_he_4) * s.so_tin_chi;
      simCount++;
    }
  }
  const simulatedGpa4 = gpa.total_credits > 0 ? Math.round((simWeighted4 / gpa.total_credits) * 100) / 100 : gpa.overall_4;
  const simulatedDiff = Math.round((simulatedGpa4 - gpa.overall_4) * 100) / 100;

  // Lọc học kỳ và môn học
  const semFilter = state.academicSemesterFilter || "all";
  const gradeFilter = state.academicGradeFilter || "all";

  const filteredSemesters = semesters.filter(sem => {
    if (semFilter !== "all" && sem.semester_name !== semFilter) return false;
    return true;
  });

  return `
    <div class="grades-dashboard">
      <!-- HEADER SINH VIÊN IU -->
      <div class="grades-profile-header">
        <div class="grades-profile-info">
          <div class="grades-profile-avatar-wrap">
            <span class="grades-student-icon">🎓</span>
          </div>
          <div class="grades-profile-details">
            <div class="grades-student-tag">SINH VIÊN ĐẠI HỌC CMC (IU CMCU)</div>
            <h2 class="grades-student-name">${esc(student.ho_ten || "Sinh viên")}</h2>
            <div class="grades-student-meta">
              <span><strong>Mã SV:</strong> ${esc(student.ma_sinh_vien || "Chưa có")}</span>
              <span>•</span>
              <span><strong>Ngành:</strong> ${esc(student.nganh || "Công nghệ thông tin")}</span>
              ${student.lop ? `<span>•</span><span><strong>Lớp:</strong> ${esc(student.lop)}</span>` : ""}
            </div>
            ${lastSyncedAt ? `<div class="grades-last-sync">⏱️ Đồng bộ lúc: ${new Date(lastSyncedAt).toLocaleString('vi-VN')}</div>` : ""}
          </div>
        </div>
        <div class="grades-profile-actions">
          <button type="button" class="btn-duo btn-duo-pink btn-duo-sm" onclick="window.openAcademicLoginModal()">
            🔄 Cập nhật từ IU
          </button>
          <button type="button" class="btn-duo btn-duo-outline btn-duo-sm" onclick="window.resetAcademicTranscript()">
            🚪 Ngắt kết nối IU
          </button>
        </div>
      </div>

      <!-- 4 THẺ KPI ĐIỂM SỐ & HỌC LỰC -->
      <div class="grades-kpi-grid">
        <div class="grades-kpi-card kpi-gpa-4">
          <div class="kpi-top-row">
            <span class="kpi-label">GPA TÍCH LŨY (HỆ 4)</span>
            <span class="kpi-icon">🏆</span>
          </div>
          <div class="kpi-number-wrap">
            <span class="kpi-big-num">${gpa.overall_4}</span>
            <span class="kpi-max">/ 4.0</span>
          </div>
          <div class="kpi-badge-wrap">
            <span class="grades-rank-badge" style="background: ${gpa.badgeColor || '#ff7597'};">
              ${esc(gpa.classification || "Chưa xếp loại")}
            </span>
          </div>
        </div>

        <div class="grades-kpi-card kpi-gpa-10">
          <div class="kpi-top-row">
            <span class="kpi-label">GPA TÍCH LŨY (HỆ 10)</span>
            <span class="kpi-icon">⭐</span>
          </div>
          <div class="kpi-number-wrap">
            <span class="kpi-big-num">${gpa.overall_10}</span>
            <span class="kpi-max">/ 10.0</span>
          </div>
          <div class="kpi-sub-note">Thang điểm chuẩn đào tạo tín chỉ</div>
        </div>

        <div class="grades-kpi-card kpi-credits">
          <div class="kpi-top-row">
            <span class="kpi-label">TÍN CHỈ TÍCH LŨY</span>
            <span class="kpi-icon">📚</span>
          </div>
          <div class="kpi-number-wrap">
            <span class="kpi-big-num">${gpa.passed_credits}</span>
            <span class="kpi-max">/ ${gpa.total_credits} TC</span>
          </div>
          <div class="kpi-progress-bar">
            <div class="kpi-progress-fill" style="width: ${gpa.total_credits > 0 ? Math.min(100, Math.round((gpa.passed_credits / gpa.total_credits) * 100)) : 0}%;"></div>
          </div>
        </div>

        <div class="grades-kpi-card kpi-weak">
          <div class="kpi-top-row">
            <span class="kpi-label">MÔN CẦN CẢI THIỆN</span>
            <span class="kpi-icon">🎯</span>
          </div>
          <div class="kpi-number-wrap">
            <span class="kpi-big-num" style="color: ${weak_subjects.length > 0 ? '#f97316' : '#10b981'};">${weak_subjects.length}</span>
            <span class="kpi-max">môn</span>
          </div>
          <div class="kpi-sub-note">${weak_subjects.length > 0 ? 'Điểm C, D, F kéo tụt GPA' : 'Phong độ học tập xuất sắc!'}</div>
        </div>
      </div>

      <!-- KHU VỰC MÔN ĐANG HỌC KỲ NÀY (TỪ THỜI KHÓA BIỂU CỔNG TRƯỜNG IU) -->
      <div class="grades-section-box grades-active-courses-box" style="margin-bottom: 24px;">
        <div class="section-box-header">
          <div class="section-box-title">
            <span class="section-box-emoji">🎒</span>
            <div>
              <h3>Môn Đang Học Kỳ Này (Cào Từ Thời Khóa Biểu Cổng IU)</h3>
              <p>Các môn bạn đang học trong kỳ được tự động bóc tách từ lịch học IU để Thỏ Bảy Màu AI lập lộ trình học tập, tối ưu điểm chuyên cần, lab và săn A/A+!</p>
            </div>
          </div>
          <button type="button" class="btn-duo btn-duo-pink btn-duo-sm" onclick="window.requestAcademicAdvisor(${targetGpa})">
            ✨ Lập Lộ Trình Môn Đang Học (AI)
          </button>
        </div>

        ${active_courses.length === 0 ? `
          <div class="grades-clean-state" style="padding: 24px; text-align: center;">
            <span style="font-size:32px;">📅</span>
            <strong>Chưa có môn học trên thời khóa biểu tuần gần đây.</strong>
            <span>Nhấn nút "🔄 Cập nhật từ IU" ở góc trên để Thỏ tự động quét lịch học nhé!</span>
          </div>
        ` : `
          <div class="active-courses-grid">
            ${active_courses.map(c => `
              <div class="active-course-card">
                <div>
                  <div class="active-course-header">
                    <span class="active-course-code">${esc(c.ma_mon || "MÔN HỌC")}</span>
                    <span class="active-course-status">${esc(c.trang_thai || c.hinh_thuc || "Đang học")}</span>
                  </div>
                  <h4 class="active-course-name">${esc(c.ten_mon || c.ten_hoc_phan || "Học phần")}</h4>
                  <div class="active-course-meta">
                    ${c.so_tin_chi ? `<span>📚 <strong>${c.so_tin_chi}</strong> tín chỉ</span>` : ""}
                    ${c.giang_vien ? `<span>👨‍🏫 GV: <strong>${esc(c.giang_vien)}</strong></span>` : ""}
                    ${c.phong ? `<span>📍 Phòng: <strong>${esc(c.phong)}</strong></span>` : ""}
                  </div>
                </div>
                <div class="active-course-action">
                  <button type="button" class="btn-duo btn-duo-pink btn-duo-sm" style="width:100%;" onclick="window.focusCoursePlan('${esc(c.ten_mon || c.ma_mon)}')">
                    💡 Phương Pháp Học Môn Này (AI)
                  </button>
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>

      <!-- KHU VỰC BẮT BỆNH MÔN ĐIỂM THẤP & BỘ GIẢ LẬP NÂNG GPA -->
      <div class="grades-section-box grades-simulator-box">
        <div class="section-box-header">
          <div class="section-box-title">
            <span class="section-box-emoji">🎯</span>
            <div>
              <h3>Bắt Bệnh Môn Kéo Tụt GPA & Mô Phỏng Nâng Điểm (What-If)</h3>
              <p>Thỏ Bảy Màu đã lọc ra các môn học đang kéo tụt GPA nhiều nhất do số tín chỉ cao mà điểm thấp. Thử chọn điểm cải thiện để xem GPA tổng nhảy số tức thì nhé!</p>
            </div>
          </div>
          ${simCount > 0 ? `
            <button type="button" class="btn-duo btn-duo-outline btn-duo-sm" onclick="window.resetSimulatedScores()">
              🔄 Hoàn tác giả lập
            </button>
          ` : ""}
        </div>

        ${weak_subjects.length === 0 ? `
          <div class="grades-clean-state">
            <span style="font-size:36px;">🎉</span>
            <strong>Thật tuyệt vời! Không có môn nào điểm dưới 6.5.</strong>
            <span>Bạn đang duy trì phong độ học tập rất đáng khen ngợi!</span>
          </div>
        ` : `
          <div class="weak-subjects-table-wrap">
            <table class="grades-table">
              <thead>
                <tr>
                  <th>Mã môn</th>
                  <th>Tên học phần</th>
                  <th>Số TC</th>
                  <th>Kỳ học</th>
                  <th>Điểm Hệ 10</th>
                  <th>Hệ 4</th>
                  <th>Điểm chữ</th>
                  <th>Mô phỏng nâng điểm</th>
                  <th>Tiềm năng GPA</th>
                  <th>Chiến lược AI</th>
                </tr>
              </thead>
              <tbody>
                ${weak_subjects.map(s => {
                  const currentSim = state.academicSimulatedScores.get(s.ma_mon) || 0;
                  return `
                    <tr class="weak-row ${currentSim > 0 ? 'is-simulated' : ''}">
                      <td><code>${esc(s.ma_mon)}</code></td>
                      <td><strong>${esc(s.ten_hoc_phan)}</strong></td>
                      <td>${s.so_tin_chi}</td>
                      <td><small>${esc(s.hoc_ky || "")} ${esc(s.nam_hoc || "")}</small></td>
                      <td><b style="color:#f43f5e;">${s.diem_he_10}</b></td>
                      <td>${s.diem_he_4}</td>
                      <td><span class="grade-letter-pill grade-${s.diem_chu}">${s.diem_chu}</span></td>
                      <td>
                        <select class="sim-select" onchange="window.setSimulatedScore('${s.ma_mon}', this.value)">
                          <option value="0" ${currentSim === 0 ? 'selected' : ''}>-- Giữ nguyên (${s.diem_chu}) --</option>
                          <option value="3.5" ${currentSim === 3.5 ? 'selected' : ''}>Nâng lên B+ (3.5)</option>
                          <option value="4.0" ${currentSim === 4.0 ? 'selected' : ''}>Nâng lên A (4.0) 🌟</option>
                        </select>
                      </td>
                      <td>
                        <span class="gain-badge">+${s.gpaGainIfA} GPA</span>
                      </td>
                      <td>
                        <button type="button" class="btn-duo btn-duo-outline btn-duo-xs" onclick="window.focusCoursePlan('${esc(s.ten_hoc_phan || s.ma_mon)}')">
                          💡 Cách gỡ A
                        </button>
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>

          <!-- THANH KẾT QUẢ GIẢ LẬP TRỰC TIẾP -->
          <div class="sim-result-bar ${simCount > 0 ? 'active' : ''}">
            <div class="sim-result-left">
              <span class="sim-sparkle">✨</span>
              <div class="sim-result-text">
                ${simCount > 0 ? `
                  <strong>Dự báo kết quả: Cải thiện ${simCount} môn đã chọn sẽ đưa GPA từ <span class="old-gpa">${gpa.overall_4}</span> ➜ <span class="new-gpa">${simulatedGpa4}</span> (+${simulatedDiff} điểm)!</strong>
                  <span>Một bước nhảy vọt giúp bạn nâng hạng học lực và mở rộng cơ hội học bổng / việc làm!</span>
                ` : `
                  <strong>Hãy chọn mức điểm bạn muốn đạt ở các môn trên để xem dự báo GPA nhảy số tức thì!</strong>
                  <span>Học cải thiện môn 3-4 tín chỉ sẽ mang lại tỉ lệ tăng điểm (ROI) cao nhất.</span>
                `}
              </div>
            </div>
            <button type="button" class="btn-duo btn-duo-pink btn-duo-sm" onclick="window.requestAcademicAdvisor(${simulatedGpa4 > gpa.overall_4 ? simulatedGpa4 : targetGpa})">
              🐰 Nhờ Thỏ Lên Lộ Trình Nâng Điểm Ngay
            </button>
          </div>
        `}
      </div>

      <!-- KHU VỰC CỐ VẤN HỌC THUẬT & LỘ TRÌNH HỌC AI DEEPSEEK -->
      <div class="grades-section-box grades-ai-advisor-box" id="advisor-section">
        <div class="advisor-header-row">
          <div class="advisor-title-wrap">
            <span class="advisor-mascot-badge">🐰🎓</span>
            <div>
              <h3>Cố Vấn Học Vụ AI DeepSeek: Lộ Trình & Phương Pháp Học Từng Môn</h3>
              <p>Chọn bất kỳ môn học nào để AI đưa ra phương pháp học thực chiến, cạm bẫy dễ mất điểm và cẩm nang săn A/A+ riêng cho môn đó!</p>
            </div>
          </div>
          <div class="advisor-target-controls">
            <label>Mục tiêu GPA:</label>
            <div class="target-pills">
              <button type="button" class="target-pill ${targetGpa === 3.2 ? 'active' : ''}" onclick="window.requestAcademicAdvisor(3.2)">
                3.2 (Giỏi)
              </button>
              <button type="button" class="target-pill ${targetGpa === 3.6 ? 'active' : ''}" onclick="window.requestAcademicAdvisor(3.6)">
                3.6 (Xuất sắc)
              </button>
              <button type="button" class="target-pill ${targetGpa === 4.0 ? 'active' : ''}" onclick="window.requestAcademicAdvisor(4.0)">
                4.0 (Tuyệt đối)
              </button>
            </div>
            <button type="button" class="btn-duo btn-duo-pink btn-duo-sm" onclick="window.requestAcademicAdvisor(${targetGpa}, document.getElementById('advisor-subject-picker')?.value || state.academicAdvisorSubject)" ${state.academicAdvisorBusy ? 'disabled' : ''}>
              ${state.academicAdvisorBusy ? '<span class="spinner-dot"></span> Đang phân tích…' : '✨ Lên Phương Pháp Học Ngay'}
            </button>
          </div>
        </div>

        <!-- THANH CHỌN MÔN HỌC CỤ THỂ HOẶC TOÀN CẢNH -->
        <div class="advisor-subject-selector-bar">
          <label class="advisor-sel-label">📚 Chọn môn học cần tư vấn:</label>
          <select class="advisor-subject-select" id="advisor-subject-picker" onchange="window.selectAdvisorSubject(this.value)">
            <option value="all" ${(!state.academicAdvisorSubject || state.academicAdvisorSubject === 'all') ? 'selected' : ''}>
              📊 Toàn cảnh GPA & Bảng điểm tổng thể
            </option>
            ${active_courses.length > 0 ? `
              <optgroup label="🎒 Môn đang học kỳ này (Thời khóa biểu)">
                ${active_courses.map(c => {
                  const val = c.ten_mon || c.ma_mon;
                  return `<option value="${esc(val)}" ${state.academicAdvisorSubject === val ? 'selected' : ''}>🎒 ${esc(val)} (${esc(c.ma_mon || '')}) — Đang học</option>`;
                }).join("")}
              </optgroup>
            ` : ""}
            ${weak_subjects.length > 0 ? `
              <optgroup label="🎯 Môn cần cải thiện điểm (C, D, F)">
                ${weak_subjects.map(s => {
                  const val = s.ten_hoc_phan || s.ma_mon;
                  return `<option value="${esc(val)}" ${state.academicAdvisorSubject === val ? 'selected' : ''}>🎯 ${esc(val)} (${s.diem_chu} - ${s.diem_he_10}đ)</option>`;
                }).join("")}
              </optgroup>
            ` : ""}
            ${raw_subjects.length > 0 ? `
              <optgroup label="📚 Tất cả các môn đã học">
                ${raw_subjects.filter(s => !weak_subjects.some(w => w.ma_mon === s.ma_mon)).map(s => {
                  const val = s.ten_hoc_phan || s.ma_mon;
                  return `<option value="${esc(val)}" ${state.academicAdvisorSubject === val ? 'selected' : ''}>📘 ${esc(val)} (${s.diem_chu})</option>`;
                }).join("")}
              </optgroup>
            ` : ""}
          </select>
        </div>

        <div class="advisor-content-body">
          ${state.academicAdvisorBusy ? `
            <div class="advisor-loading-card">
              <div class="advisor-loading-mascot">
                ${renderThoBayMau({
                  state: THO_STATES.STUDY_LAPTOP,
                  size: 140,
                  speech: "Thỏ Bảy Màu đang cùng DeepSeek AI 'vắt óc' lập kế hoạch gỡ điểm cho bạn đây! Đợi Thỏ xíu nha... 🥕💻",
                  speechDirection: "top"
                })}
              </div>
              <div class="advisor-loading-text">
                <strong>Đang triệu hồi Trí Tuệ Nhân Tạo DeepSeek…</strong>
                <p>Hệ thống đang phân tích bản chất kiến thức, rà soát cấu trúc đề thi và thiết kế phương pháp học thực chiến.</p>
              </div>
            </div>
          ` : aiAnalysis ? `
            ${(state.academicAdvisorSubject && state.academicAdvisorSubject !== 'all') ? `
              <div class="advisor-active-subject-badge">
                🎯 Phương pháp học chuyên sâu & Săn điểm A môn: <strong>${esc(state.academicAdvisorSubject)}</strong>
              </div>
            ` : `
              <div class="advisor-active-subject-badge" style="border-color:#0078d4; color:#0078d4; background:#f0f7ff;">
                📊 Báo cáo chiến lược tổng thể GPA & Lộ trình bứt phá học thuật
              </div>
            `}
            <div class="advisor-report-view">
              ${formatAdvisorMarkdown(aiAnalysis)}
            </div>
            <div class="advisor-footer-row">
              <button type="button" class="btn-duo btn-duo-pink btn-duo-sm" onclick="state.page='chat'; render();">
                💬 Đặt Câu Hỏi Thêm Cho Trợ Giảng AI DeepSeek
              </button>
            </div>
          ` : `
            <div class="advisor-empty-prompt">
              ${renderThoBayMau({
                state: THO_STATES.SURPRISED_CARROT,
                size: 130,
                speech: "Chọn môn học bên trên rồi bấm 'Lên Phương Pháp Học Ngay' để Thỏ Bảy Màu mách nước chiến lược cho bạn nhé! 🐰✨",
                speechDirection: "top"
              })}
              <div style="margin-top:14px;">
                <button type="button" class="btn-duo btn-duo-pink" onclick="window.requestAcademicAdvisor(${targetGpa})">
                  ✨ Khởi Tạo Phương Pháp Học Ngay (AI DeepSeek)
                </button>
              </div>
            </div>
          `}
        </div>
      </div>

      <!-- BẢNG ĐIỂM CHI TIẾT PHÂN CHIA THEO TỪNG HỌC KỲ RÕ RÀNG -->
      <div class="grades-section-box">
        <div class="section-box-header">
          <div class="section-box-title">
            <span class="section-box-emoji">📚</span>
            <div>
              <h3>Bảng Điểm Chi Tiết Phân Chia Theo Từng Học Kỳ (Đại học CMC)</h3>
              <p>Toàn bộ học phần qua các kỳ, có đầy đủ điểm chữ, điểm hệ 10 & hệ 4 và chi tiết điểm thành phần (chuyên cần, bài tập, giữa kỳ, cuối kỳ).</p>
            </div>
          </div>

          <!-- BỘ LỌC KỲ HỌC -->
          <div class="grades-filter-bar">
            <div class="sem-filter-pills">
              <button type="button" class="sem-pill ${semFilter === 'all' ? 'active' : ''}" onclick="window.setAcademicSemesterFilter('all')">
                Tất cả học kỳ (${semesters.length})
              </button>
              ${semesters.map(sem => `
                <button type="button" class="sem-pill ${semFilter === sem.semester_name ? 'active' : ''}" onclick="window.setAcademicSemesterFilter('${esc(sem.semester_name)}')">
                  ${esc(sem.semester_name)}
                </button>
              `).join("")}
            </div>

            <div class="grade-filter-btns">
              <button type="button" class="grade-filter-btn ${gradeFilter === 'all' ? 'active' : ''}" onclick="window.setAcademicGradeFilter('all')">
                Tất cả môn (${raw_subjects.length})
              </button>
              <button type="button" class="grade-filter-btn ${gradeFilter === 'weak' ? 'active' : ''}" onclick="window.setAcademicGradeFilter('weak')">
                Cần gỡ điểm C/D/F (${weak_subjects.length})
              </button>
              <button type="button" class="grade-filter-btn ${gradeFilter === 'high' ? 'active' : ''}" onclick="window.setAcademicGradeFilter('high')">
                Điểm cao A/B+ (${raw_subjects.filter(s => ['A', 'A+', 'B+'].includes(s.diem_chu)).length})
              </button>
            </div>
          </div>
        </div>

        <div class="semesters-list-container">
          ${filteredSemesters.map(sem => {
            const subjectsToRender = sem.subjects.filter(s => {
              if (gradeFilter === "weak") return ['F', 'D', 'D+', 'C'].includes(s.diem_chu) || s.diem_he_10 < 6.5;
              if (gradeFilter === "high") return ['A', 'A+', 'B+'].includes(s.diem_chu);
              return true;
            });

            if (subjectsToRender.length === 0) return "";

            return `
              <div class="semester-card">
                <div class="semester-card-header">
                  <div class="semester-name-wrap">
                    <span class="semester-calendar-icon">📅</span>
                    <h4>${esc(sem.semester_name)}</h4>
                  </div>
                  <div class="semester-stats-wrap">
                    <span>GPA Kỳ Hệ 4: <strong>${sem.gpa_4}</strong></span>
                    <span>•</span>
                    <span>Hệ 10: <strong>${sem.gpa_10}</strong></span>
                    <span>•</span>
                    <span>Số tín chỉ: <strong>${sem.total_credits} TC</strong></span>
                    <span>•</span>
                    <span><strong>${subjectsToRender.length}</strong> môn</span>
                  </div>
                </div>

                <div class="semester-table-wrap">
                  <table class="grades-table">
                    <thead>
                      <tr>
                        <th>Mã môn</th>
                        <th>Tên học phần</th>
                        <th>Số TC</th>
                        <th>Điểm Hệ 10</th>
                        <th>Điểm Hệ 4</th>
                        <th>Điểm chữ</th>
                        <th>Đánh giá</th>
                        <th>Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${subjectsToRender.map(s => {
                        const isExpanded = state.academicExpandedSubjects.has(s.ma_mon);
                        const parts = s.chi_tiet_diem || {};
                        return `
                          <tr class="subject-row ${isExpanded ? 'expanded' : ''}" onclick="window.toggleAcademicSubjectDetail('${s.ma_mon}')">
                            <td><code>${esc(s.ma_mon)}</code></td>
                            <td>
                              <strong>${esc(s.ten_hoc_phan)}</strong>
                            </td>
                            <td>${s.so_tin_chi}</td>
                            <td><b>${s.diem_he_10}</b></td>
                            <td>${s.diem_he_4}</td>
                            <td><span class="grade-letter-pill grade-${s.diem_chu}">${s.diem_chu}</span></td>
                            <td>
                              <span class="status-pill ${s.passed ? 'status-pass' : 'status-fail'}">
                                ${s.passed ? 'Đạt ✓' : 'Chưa đạt ✗'}
                              </span>
                            </td>
                            <td>
                              <button type="button" class="btn-toggle-detail" aria-label="Xem chi tiết điểm thành phần">
                                ${isExpanded ? '▲ Thu gọn' : '▼ Điểm TP'}
                              </button>
                            </td>
                          </tr>
                          ${isExpanded ? `
                            <tr class="detail-row">
                              <td colspan="8">
                                <div class="detail-breakdown-card">
                                  <div class="breakdown-title">
                                    <span>🔍 Chi tiết điểm thành phần môn <strong>${esc(s.ten_hoc_phan)}</strong> (${esc(s.ma_mon)}):</span>
                                  </div>
                                  <div class="breakdown-grid">
                                    <div class="breakdown-item">
                                      <span class="breakdown-label">Chuyên cần (10%)</span>
                                      <span class="breakdown-val">${parts.chuyen_can !== null && parts.chuyen_can !== undefined ? parts.chuyen_can : '--'}</span>
                                    </div>
                                    <div class="breakdown-item">
                                      <span class="breakdown-label">Bài tập / Quá trình (20%)</span>
                                      <span class="breakdown-val">${parts.bai_tap !== null && parts.bai_tap !== undefined ? parts.bai_tap : '--'}</span>
                                    </div>
                                    <div class="breakdown-item">
                                      <span class="breakdown-label">Giữa kỳ (20%)</span>
                                      <span class="breakdown-val">${parts.giua_ky !== null && parts.giua_ky !== undefined ? parts.giua_ky : '--'}</span>
                                    </div>
                                    <div class="breakdown-item">
                                      <span class="breakdown-label">Cuối kỳ / Thi kết thúc (50%)</span>
                                      <span class="breakdown-val" style="color:#e11d48; font-weight:700;">${parts.cuoi_ky !== null && parts.cuoi_ky !== undefined ? parts.cuoi_ky : '--'}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ` : ""}
                        `;
                      }).join("")}
                    </tbody>
                  </table>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

// ========================================================
// MODAL ĐĂNG NHẬP CỔNG IU & NHẬP BẢNG ĐIỂM
// ========================================================

window.closeAcademicModal = function(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains("academic-modal-close")) return;
  if (window.academicSyncInterval) {
    clearInterval(window.academicSyncInterval);
    window.academicSyncInterval = null;
  }
  const modalRoot = document.getElementById("modal-root");
  if (modalRoot) modalRoot.innerHTML = "";
};

window.handleIuPortalLogin = async function() {
  const btn = document.getElementById("btn-iu-popup-login");
  const isDesktop = Boolean(window.electronAPI?.openIuLogin || window.__uniStudyIU?.loginIU);

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-dot"></span> Đang mở cửa sổ đăng nhập cổng IU…`;
  }

  // 1. CHẠY TRONG APP ELECTRON (Cơ chế 100% tự động như Smart Study Hub):
  if (isDesktop) {
    try {
      showAppLoader("Đang mở cửa sổ đăng nhập IU… 🎓", "Vui lòng đăng nhập tài khoản Microsoft trường trên cửa sổ cổng IU. Cửa sổ sẽ TỰ ĐỘNG ĐÓNG và bảng điểm sẽ được tự động đục về ngay sau khi đăng nhập!");
      const loginFn = window.electronAPI?.openIuLogin || window.__uniStudyIU?.loginIU;
      const res = await loginFn();
      if (res && res.ok && res.transcript) {
        state.academicTranscript = {
          hasTranscript: true,
          transcript: res.transcript,
          lastSyncedAt: res.lastSyncedAt || new Date().toISOString()
        };
        window.closeAcademicModal();
        showToast(`🎉 Tuyệt vời! Tool đã đục thành công bảng điểm của ${res.transcript.student.ho_ten}!`, false);
        if (typeof launchConfetti === "function") launchConfetti();
        updateShell();
        render();
      } else if (res && res.cancelled) {
        showToast("Đã đóng cửa sổ đăng nhập IU.", true);
      } else {
        showToast("Lỗi khi đục dữ liệu IU: " + (res?.error || res?.message || "Không thể tải bảng điểm"), true);
      }
    } catch (err) {
      showToast("Lỗi kết nối Electron: " + err.message, true);
    } finally {
      hideAppLoader();
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <svg width="22" height="22" viewBox="0 0 21 21">
            <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
            <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
          </svg>
          <span>Đăng Nhập Cổng Trường IU (Microsoft)</span>
        `;
      }
    }
    return;
  }

  // 2. CHẠY TRÊN TRÌNH DUYỆT WEB (Google Chrome / Edge):
  const loginUrl = "https://iu.cmcu.edu.vn/congthongtin/login.aspx";
  const popup = window.open(loginUrl, "iu_login_popup", "width=1000,height=780,left=200,top=100");
  window._activeIuPopup = popup;

  showToast("🐰 Đã mở cửa sổ đăng nhập Cổng IU! Bạn đăng nhập Microsoft xong bấm nút 'Đã đăng nhập xong' để Thỏ đóng cửa sổ và đồng bộ nhé!", false);

  const container = document.querySelector(".iu-single-action-box");
  if (container) {
    container.innerHTML = `
      <div class="iu-browser-sync-active">
        <p class="iu-browser-status-title">🌐 Đang mở cửa sổ cổng trường IU...</p>
        <p class="iu-browser-status-desc">Vui lòng đăng nhập tài khoản Microsoft trường trên cửa sổ vừa mở. Sau khi đăng nhập thành công, bấm nút bên dưới để đóng cửa sổ ngay:</p>
        <button type="button" class="btn-duo btn-duo-green iu-btn-confirm-done" onclick="window.confirmBrowserIuDone()">
          ✅ Tôi đã đăng nhập xong (Đóng cửa sổ & Đồng bộ)
        </button>
      </div>
    `;
  }

  // Polling tự động nếu cửa sổ đóng hoặc nếu có dữ liệu
  let hasScraped = false;
  const pollTimer = setInterval(async () => {
    try {
      const chk = await api("/api/academic/transcript");
      if (chk && chk.hasTranscript && chk.transcript) {
        clearInterval(pollTimer);
        try { if (popup && !popup.closed) popup.close(); } catch {}
        state.academicTranscript = chk;
        window.closeAcademicModal();
        showToast(`🎉 Tuyệt vời! Tool đã đục thành công bảng điểm của ${chk.transcript.student.ho_ten}!`, false);
        if (typeof launchConfetti === "function") launchConfetti();
        updateShell();
        render();
        return;
      }
    } catch {}

    if (popup && popup.closed && !hasScraped) {
      hasScraped = true;
      clearInterval(pollTimer);
    }
  }, 1200);
};

window.confirmBrowserIuDone = async function() {
  try {
    if (window._activeIuPopup && !window._activeIuPopup.closed) {
      window._activeIuPopup.close();
    }
  } catch {}

  showAppLoader("Đang kiểm tra dữ liệu bảng điểm IU… 🎓", "Đang đồng bộ dữ liệu kết quả học tập từ cổng trường…");
  try {
    const chk = await api("/api/academic/transcript");
    if (chk && chk.hasTranscript && chk.transcript) {
      state.academicTranscript = chk;
      window.closeAcademicModal();
      showToast(`🎉 Đã kết nối thành công bảng điểm của ${chk.transcript.student.ho_ten}!`, false);
      if (typeof launchConfetti === "function") launchConfetti();
      updateShell();
      render();
      return;
    }

    showToast("💡 Vui lòng hoàn tất đăng nhập Microsoft trên cổng trường để Thỏ tự động đồng bộ bảng điểm nhé!", true);
    renderAcademicLoginModal();
  } catch (err) {
    showToast("Chưa tải được bảng điểm: " + err.message, true);
    renderAcademicLoginModal();
  } finally {
    hideAppLoader();
  }
};

window.openAcademicLoginModal = function() {
  renderAcademicLoginModal();
};

function renderAcademicLoginModal() {
  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return;

  modalRoot.innerHTML = `
    <div class="modal-backdrop" onclick="window.closeAcademicModal(event)">
      <div class="academic-modal-card">
        <button type="button" class="academic-modal-close" onclick="window.closeAcademicModal()" aria-label="Đóng">×</button>

        <div class="academic-modal-header">
          <div class="academic-modal-mascot">
            ${renderThoBayMau({
              state: THO_STATES.GENIUS,
              size: 95,
              speech: "Đăng nhập một chạm bằng tài khoản Microsoft trường nhé! 🐰✨",
              speechDirection: "top"
            })}
          </div>
          <div>
            <h3 class="academic-modal-title">Đăng Nhập Cổng Trường IU</h3>
            <p class="academic-modal-subtitle">Trường Đại học CMC (CMC University) • <strong>iu.cmcu.edu.vn</strong></p>
          </div>
        </div>

        <div class="academic-modal-body" style="padding-top: 12px;">
          <!-- NÚT DUY NHẤT: ĐĂNG NHẬP BẰNG MICROSOFT -->
          <div class="iu-single-action-box">
            <button type="button" id="btn-iu-popup-login" class="btn-microsoft-primary" onclick="window.handleIuPortalLogin()">
              <svg width="22" height="22" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
              <span>ĐĂNG NHẬP BẰNG MICROSOFT TRƯỜNG</span>
            </button>
            <p class="iu-single-hint" style="margin-top: 14px; text-align: center; color: #64748b; font-size: 13px;">
              🔒 Xác thực an toàn qua hệ thống Microsoft Office 365 của CMC University
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
};

window.submitAcademicLogin = async function(e) {
  if (e) e.preventDefault();
  return window.handleIuPortalLogin();
};

window.selectAdvisorSubject = function(subject) {
  state.academicAdvisorSubject = subject;
  window.requestAcademicAdvisor(state.academicAdvisorTarget, subject);
};

window.focusCoursePlan = function(courseName) {
  state.academicAdvisorSubject = courseName;
  const el = document.getElementById("advisor-section");
  if (el) el.scrollIntoView({ behavior: "smooth" });
  window.requestAcademicAdvisor(state.academicAdvisorTarget || 3.6, courseName);
};

window.requestAcademicAdvisor = async function(targetGpa, subject) {
  if (state.academicAdvisorBusy) return;
  state.academicAdvisorBusy = true;
  state.academicAdvisorTarget = targetGpa || state.academicAdvisorTarget || 3.2;
  if (subject !== undefined) {
    state.academicAdvisorSubject = subject;
  }
  const currentSub = state.academicAdvisorSubject || "all";
  render();

  try {
    const isSpecific = currentSub && currentSub !== "all" && currentSub !== "toan-canh";
    showToast(isSpecific
      ? `🐰 Thỏ Bảy Màu đang gọi DeepSeek AI lên phương pháp học môn ${currentSub}...`
      : `🐰 Thỏ Bảy Màu đang gọi DeepSeek AI phân tích bảng điểm & lộ trình GPA...`, false);

    const res = await api("/api/academic/advisor", {
      method: "POST",
      body: {
        targetGpa: state.academicAdvisorTarget,
        subject: currentSub,
        transcript: state.academicTranscript?.transcript
      }
    });
    if (res.ok && res.advice) {
      if (state.academicTranscript) {
        state.academicTranscript.aiAnalysis = res.advice;
        state.academicTranscript.targetGpa = res.targetGpa;
        state.academicTranscript.advisorSubject = res.subject || currentSub;
      }
      showToast(isSpecific
        ? `🎉 Đã có bí kíp săn điểm A cho môn ${currentSub}!`
        : "🎉 Đã có lộ trình cải thiện điểm từ Giáo sư Thỏ Bảy Màu!", false);
    }
  } catch (err) {
    showToast("Lỗi khi tạo lộ trình AI: " + err.message, true);
  } finally {
    state.academicAdvisorBusy = false;
    render();
  }
};

window.toggleAcademicSubjectDetail = function(maMon) {
  if (state.academicExpandedSubjects.has(maMon)) {
    state.academicExpandedSubjects.delete(maMon);
  } else {
    state.academicExpandedSubjects.add(maMon);
  }
  render();
};

window.setAcademicSemesterFilter = function(semKey) {
  state.academicSemesterFilter = semKey;
  render();
};

window.setAcademicGradeFilter = function(filter) {
  state.academicGradeFilter = filter;
  render();
};

window.setSimulatedScore = function(maMon, score4) {
  const val = Number(score4);
  if (val <= 0) {
    state.academicSimulatedScores.delete(maMon);
  } else {
    state.academicSimulatedScores.set(maMon, val);
  }
  render();
};

window.resetSimulatedScores = function() {
  state.academicSimulatedScores.clear();
  render();
};

window.resetAcademicTranscript = function() {
  if (!confirm("Bạn có chắc chắn muốn ngắt kết nối và xóa dữ liệu bảng điểm IU hiện tại khỏi phiên học không?")) return;
  state.academicTranscript = null;
  state.academicSimulatedScores.clear();
  updateShell();
  render();
  showToast("Đã ngắt kết nối tài khoản IU.", false);
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

  // Nếu đang mất kết nối mạng và chưa có dữ liệu, hiển thị màn hình Mascot ngoại tuyến thân thiện
  if (state.isOffline && !state.profile && !state.subjects.length) {
    view.innerHTML = `
      <div class="offline-full-view">
        ${renderThoBayMau({ state: THO_STATES.CONFUSED_PHONE, size: 180, speech: "Ủa, sóng Wi-Fi đâu mất tiêu rồi?! 📡", speechDirection: "top" })}
        <h2 class="offline-full-title">Mất kết nối mạng rồi bạn ơi!</h2>
        <p class="offline-full-desc">
          Thỏ Bảy Màu không thể tải dữ liệu lúc này vì thiết bị đang ngoại tuyến. Bạn hãy kiểm tra lại Wi-Fi hoặc dữ liệu di động (4G/5G) rồi bấm nút bên dưới nhé!
        </p>
        <div class="offline-full-actions">
          <button type="button" class="btn-duo btn-duo-pink" style="padding:14px 28px; font-size:15px;" onclick="window.checkNetworkAndRetry()">
            🔄 Thử kết nối lại ngay
          </button>
        </div>
      </div>
    `;
    updateShell();
    const companion = document.getElementById("global-mascot-companion");
    if (companion) companion.style.display = "none";
    return;
  }

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
    case "grades":
      view.innerHTML = renderGradesView();
      break;
    case "notes":
      view.innerHTML = renderNotes();
      break;
    case "leaderboard":
      view.innerHTML = renderLeaderboard();
      break;
    case "friends":
      view.innerHTML = renderFriends();
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
  if (state.page === "notes" && targetPage !== "notes") state.editingNoteIds.clear();
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
    } else if (targetPage === "settings") {
      const sess = await api("/api/session").catch(() => null);
      if (sess && sess.profile) {
        state.profile = Object.assign({}, state.profile, sess.profile);
        updateShell();
        render();
      }
    }
  } catch (err) {
    console.warn("Live fetch error on tab change:", err);
  }
}

let lastSyncTime = 0;
async function syncLiveData(silent = true) {
  if (!state.profile || state.lesson) return;
  const now = Date.now();
  // Tránh spam D1: nếu chạy nền thì tối thiểu cách nhau 45 giây
  if (silent && (now - lastSyncTime < 45000)) return;
  lastSyncTime = now;
  try {
    const ov = await api("/api/overview");
    if (ov && ov.stats) {
      state.overview = ov;
      state.stats = ov.stats;
      if (ov.profile) state.profile = Object.assign({}, state.profile, ov.profile);
      if (ov.inventory) state.inventory = ov.inventory;
      updateShell();
      if (state.page === "home" || state.page === "settings") {
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

// Tự động đồng bộ số liệu khi người dùng chuyển lại tab trình duyệt (đã có throttle 45s)
window.addEventListener("focus", () => {
  syncLiveData(true);
});

// Tự động đồng bộ định kỳ mỗi 2 phút (thay vì 12s tránh cạn kiệt 5M lượt đọc D1)
setInterval(() => {
  if (document.visibilityState === "visible") {
    syncLiveData(true);
  }
}, 120000);

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


async function initialize() {
  try {
    showAppLoader("Đang chuẩn bị kho bài học 3TG… 🌸", "Thỏ Bảy Màu đang kiểm tra phiên học và đồng bộ Cloudflare D1…");
    setAppLoaderProgress(25);

    const sessionRes = await api("/api/session").catch(() => null);
    setAppLoaderProgress(55);
    if (sessionRes && sessionRes.profile) {
      state.profile = sessionRes.profile;
      state.account = sessionRes.account;
      await loadAuthenticatedData();
    } else {

      const subRes = await api("/api/subjects").catch(() => ({ subjects: [] }));
      state.subjects = subRes.subjects || [];
      state.profile = null;
      render();
    }
    setAppLoaderProgress(100);
  } catch (err) {
    state.apiError = err.message;
    view.innerHTML = `<div class="empty-state">Lỗi kết nối: ${esc(err.message)}</div>`;
  } finally {
    setupTopbarPopovers();
    updateGlobalCompanion();
    hideAppLoader();
  }
}

initialize();
