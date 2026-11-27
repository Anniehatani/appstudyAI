/**
 * 🎧 PHÒNG HỌC ẢO POMODORO & LOFI CÙNG THỎ BẢY MÀU (STUDY WITH ME / ZEN ROOM)
 * =========================================================================
 * - Chu kỳ chuẩn 25m Focus / 5m Break
 * - Thưởng +50 XP và 30 💎 mỗi ca 25 phút hoàn thành
 * - Tích lũy theo ca (1 ca = 1x, 2 ca = 2x, v.v.)
 * - Chế độ Siêu Tập Trung / Fullscreen & DND Kiosk Mode chống xao nhãng
 * - Phím tắt thoát khẩn cấp: Ctrl + Q (hủy ca dở dang nếu chưa hết 25p)
 * - 4 Kênh âm thanh chill 100% Offline (Lofi beat, Mưa rơi, Quán cafe, Tiếng lật sách) + Chuông báo (Zen Bell)
 * - Mascot Thỏ Bảy Màu động (Cắm cúi viết bài cực hài hước / Nghỉ ngơi trà sữa boba)
 * - HỖ TRỢ NHIỀU TÀI LIỆU (Thêm bao nhiêu file cũng được!):
 *   + Bên trái: Tab danh sách các file tài liệu & Sổ tay đã thêm
 *   + Ở giữa: Trình đọc mở file tài liệu toàn màn hình
 *   + Góc trên: Đồng hồ Pomodoro thu gọn thông minh (Clock Widget)
 *   + Bên phải: Tab Cố vấn AI Bot 3TG đọc ngữ cảnh ngay trên màn hình (có công tắc bật/tắt quyền xem)
 * - Đồng bộ và lưu trữ lịch sử học tập vào Cloudflare D1 & SQLite
 */

import { renderThoBayMau, THO_STATES } from "./tho-bay-mau.js";
import { syncPomodoroCalculatorVisibility } from "./pomodoro-calculator.js";
import { renderLatex, formatAiRichText, formatInlineRichText, renderPlainWithMath } from "./math-renderer.js";

// Safe API caller helper (Guaranteed no window.api error)
async function callApi(path, options = {}) {
  const config = Object.assign({ method: "GET", credentials: "same-origin" }, options);
  config.headers = Object.assign({}, config.headers || {});
  if (config.body && !(config.body instanceof FormData) && typeof config.body !== "string") {
    config.headers["content-type"] = "application/json";
    config.body = JSON.stringify(config.body);
  }
  const res = await fetch(path, config);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Lỗi kết nối máy chủ");
  return data;
}

function safeEsc(value) {
  if (typeof window.esc === "function") return window.esc(value);
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char];
  });
}

function formatAudioTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ========================================================
// 1. CLOUDFLARE R2 STREAMING MUSIC ENGINE ("YOUTUBE-STYLE BUFFER")
// ========================================================
export const POMODORO_PLAYLIST = [
  { id: "capzlock", title: "CapzLock Has To Be", artist: "Instrumental Loop Beat", tag: "Lofi Beat", icon: "🎧", file: "CapzLock Has To Be [Instrumental loop].mp3", sizeMb: 6.67 },
  { id: "lil-uzi", title: "The Way Life Goes", artist: "Lil Uzi Vert - Instrumental Chill", tag: "Lofi Hip-Hop", icon: "🎵", file: "Lil Uzi Vert - The Way Life Goes - instrumental.mp3", sizeMb: 6.20 },
  { id: "alpha-brain", title: "Alpha Brainwave Focus", artist: "Sóng Não Alpha Kích Thích Tư Duy", tag: "Sóng Não Focus", icon: "🧠", file: "Alpha Brain Music.mp3", sizeMb: 86.58 },
  { id: "lofi-rain", title: "Lofi & Tiếng Mưa Rơi", artist: "Lofi Beats x Rain Chill Ambient", tag: "Lofi & Tiếng Mưa", icon: "🌧️", file: "lofi and rain.mp3", sizeMb: 197.32 },
  { id: "rain-piano", title: "Rain & Piano", artist: "Dương Cầm Dưới Mưa Đêm", tag: "Piano & Mưa", icon: "🎹", file: "rain and piano.mp3", sizeMb: 57.59 },
  { id: "pure-rain", title: "Pure Rain Ambient", artist: "Tiếng Mưa Rào Rì Rầm Thư Giãn Não Bộ", tag: "Tiếng Mưa", icon: "☔", file: "rain.mp3", sizeMb: 58.49 },
  { id: "writing-asmr", title: "Writing ASMR Focus", artist: "Tiếng Bút Dạ & Giấy Tập Trung Cao Độ", tag: "ASMR Bút Viết", icon: "📖", file: "Writing sound.mp3", sizeMb: 115.20 },
  { id: "nature-sound", title: "Nature Forest Sounds", artist: "Âm Thanh Suối Rừng & Gió Cây Tự Nhiên", tag: "Thiên Nhiên", icon: "🌲", file: "nature sound.mp3", sizeMb: 57.14 },
  { id: "dark-fantasy", title: "Dark Fantasy Ambient", artist: "Deep Focus Cinematic Background", tag: "Deep Focus", icon: "🌌", file: "Dark fantasy.mp3", sizeMb: 115.44 },
  { id: "killswitch", title: "Killswitch Lullaby x Wind", artist: "Flawed Mangoes - Gió Rì Rào Chill", tag: "Ambient Chill", icon: "🍃", file: "flawed mangoes - killswitch lullaby x Wind.mp3", sizeMb: 4.12 },
  { id: "ibiza", title: "I Took A Pill In Ibiza", artist: "Instrumental Acoustic Lofi", tag: "Acoustic Chill", icon: "🎸", file: "i took a pill in ibiza - instrumental.mp3", sizeMb: 4.06 },
  { id: "hopecore", title: "There Is Hopecore", artist: "Truyền Cảm Hứng & Động Lực Vượt Khó", tag: "Hopecore", icon: "✨", file: "there is hopecore.mp3", sizeMb: 35.84 },
  { id: "ngay-mai", title: "Rồi Ngày Mai Sẽ Khác...", artist: "Acoustic V-Chill Hoài Niệm", tag: "V-Chill", icon: "☕", file: "Rồi ngày mai sẽ khác... .mp3", sizeMb: 24.43 },
  { id: "are-you-lost", title: "Are You Lost", artist: "Chill Out Lofi Dream", tag: "Lofi Chill", icon: "☁️", file: "Are You lost.mp3", sizeMb: 2.51 },
  { id: "rough-days", title: "Rough Days", artist: "Vượt Qua Những Ngày Giông Bão", tag: "Lofi Chill", icon: "💧", file: "Rough Days.mp3", sizeMb: 1.84 },
  { id: "tourist", title: "Tourist", artist: "Bước Đi Thong Thả Giữa Thành Phố", tag: "Chillout", icon: "🌿", file: "Tourist.mp3", sizeMb: 1.42 },
  { id: "yinyun", title: "氤氲之森 (Rừng Mù Sương)", artist: "Yinyun Forest Oriental Ambient", tag: "Oriental Ambient", icon: "🎍", file: "氤氲之森.mp3", sizeMb: 2.62 }
];

export class PomodoroMusicEngine {
  constructor() {
    this.playlist = [...POMODORO_PLAYLIST];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.volume = 0.65;
    this.audio = null;
    this.activeChannel = "lofi";
    this.isScrubbing = false;
    this.loadSavedLocalTracks();
    this.initAudio();
  }

  loadSavedLocalTracks() {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("3tg_local_music_tracks");
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          const valid = list.filter(t => t && t.id && (t.streamUrl || t.localPath));
          for (const item of valid) {
            if (!this.playlist.some(p => p.id === item.id)) {
              this.playlist.unshift(item);
            }
          }
        }
      }
    } catch (e) {
      console.warn("loadSavedLocalTracks error:", e);
    }
  }

  saveLocalTracks() {
    if (typeof window === "undefined") return;
    try {
      const locals = this.playlist.filter(t => t.isLocal && !t.blobUrl);
      localStorage.setItem("3tg_local_music_tracks", JSON.stringify(locals));
    } catch {}
  }

  removeLocalTrack(trackId) {
    const idx = this.playlist.findIndex(t => t.id === trackId);
    if (idx !== -1) {
      const isCurrent = this.currentIndex === idx;
      if (isCurrent && this.isPlaying) {
        this.pause();
      }
      this.playlist.splice(idx, 1);
      this.saveLocalTracks();
      if (isCurrent) {
        this.currentIndex = Math.max(0, Math.min(this.currentIndex, this.playlist.length - 1));
        if (this.playlist.length > 0) {
          this.playTrack(this.currentIndex, false);
        }
      }
      if (window.render) window.render();
      const popoverEl = document.getElementById("pomo-playlist-popover");
      if (popoverEl) {
        popoverEl.outerHTML = renderPomodoroPlaylistPopover();
      }
    }
  }

  initAudio() {
    if (typeof window === "undefined") return;
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.preload = "auto";
      this.audio.volume = this.volume;

      this.audio.addEventListener("progress", () => this.updateBufferProgress());
      this.audio.addEventListener("timeupdate", () => this.updateTimeProgress());
      this.audio.addEventListener("play", () => {
        this.isPlaying = true;
        this.updatePlayStateInDom(true);
      });
      this.audio.addEventListener("pause", () => {
        this.isPlaying = false;
        this.updatePlayStateInDom(false);
      });
      this.audio.addEventListener("ended", () => {
        this.next();
      });
      this.audio.addEventListener("error", (e) => {
        console.warn("[Pomodoro Audio] Lỗi nạp nhạc:", e);
      });
    }
  }

  getCurrentTrack() {
    if (!this.playlist || this.playlist.length === 0) {
      return { id: "default", title: "Nhạc tập trung", artist: "3TG Lofi", tag: "Lofi", icon: "🎧", file: "" };
    }
    return this.playlist[this.currentIndex] || this.playlist[0];
  }

  getTrackUrl(track) {
    if (!track) return "";
    if (track.blobUrl) return track.blobUrl;
    if (track.streamUrl) return track.streamUrl;
    if (track.file && (track.file.startsWith("blob:") || track.file.startsWith("data:") || track.file.startsWith("http:") || track.file.startsWith("https:"))) {
      return track.file;
    }
    if (!track.file) return "";
    return `/media/pomodoro_music/${encodeURIComponent(track.file)}`;
  }

  async playTrack(index, autoPlay = true) {
    this.initAudio();
    if (index >= 0 && index < this.playlist.length) {
      this.currentIndex = index;
    }
    const track = this.getCurrentTrack();
    if (!track) return;

    const url = this.getTrackUrl(track);
    if (!url) return;
    const origin = (typeof window !== "undefined" && window.location && window.location.origin) ? window.location.origin : "";
    const targetSrc = origin + url;
    const currentSrc = String(this.audio && this.audio.src ? this.audio.src : "");
    if (this.audio && currentSrc !== targetSrc && !currentSrc.endsWith(url)) {
      this.audio.src = url;
      if (typeof this.audio.load === "function") this.audio.load();
    }

    this.updateTrackMetaInDom();

    if (autoPlay) {
      try {
        await this.audio.play();
        this.isPlaying = true;
      } catch (err) {
        console.warn("[Pomodoro Audio] AutoPlay bị chặn hoặc chờ tương tác:", err.message);
        this.isPlaying = false;
      }
    }
    this.updatePlayStateInDom(this.isPlaying);
  }

  togglePlay() {
    this.initAudio();
    if (!this.audio.src || this.audio.src === "") {
      this.playTrack(this.currentIndex, true);
      return;
    }
    if (this.audio.paused) {
      this.audio.play().then(() => {
        this.isPlaying = true;
        this.updatePlayStateInDom(true);
      }).catch(() => {});
    } else {
      this.audio.pause();
      this.isPlaying = false;
      this.updatePlayStateInDom(false);
    }
  }

  next() {
    const nextIdx = (this.currentIndex + 1) % this.playlist.length;
    this.playTrack(nextIdx, true);
  }

  prev() {
    if (this.audio && this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }
    const prevIdx = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    this.playTrack(prevIdx, true);
  }

  seek(seconds) {
    if (!this.audio || !this.audio.duration) return;
    const clamped = Math.max(0, Math.min(seconds, this.audio.duration));
    this.audio.currentTime = clamped;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, Number(val) || 0));
    if (this.audio) this.audio.volume = this.volume;
    const valText = document.querySelector(".volume-value-text");
    if (valText) valText.textContent = `${Math.round(this.volume * 100)}%`;
    const rangeSliders = document.querySelectorAll(".pomo-volume-range");
    rangeSliders.forEach(s => { s.value = this.volume; });
  }

  stopAll() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.isPlaying = false;
    this.updatePlayStateInDom(false);
  }

  playChannel(channelName) {
    this.activeChannel = channelName;
    if (channelName === "none") {
      this.stopAll();
      return;
    }
    let targetIdx = 0;
    if (channelName === "rain") {
      targetIdx = this.playlist.findIndex(t => t.id === "pure-rain" || t.id === "lofi-rain");
    } else if (channelName === "cafe") {
      targetIdx = this.playlist.findIndex(t => t.id === "ngay-mai" || t.id === "ibiza");
    } else if (channelName === "book") {
      targetIdx = this.playlist.findIndex(t => t.id === "writing-asmr");
    } else if (channelName === "brain") {
      targetIdx = this.playlist.findIndex(t => t.id === "alpha-brain" || t.id === "hopecore");
    } else {
      targetIdx = this.playlist.findIndex(t => t.id === "capzlock" || t.id === "lil-uzi");
    }
    if (targetIdx === -1) targetIdx = 0;
    this.playTrack(targetIdx, true);
  }

  updateBufferProgress() {
    if (!this.audio || !this.audio.duration) return;
    const buf = this.audio.buffered;
    if (!buf || buf.length === 0) return;
    let end = 0;
    for (let i = 0; i < buf.length; i++) {
      if (buf.start(i) <= this.audio.currentTime && this.audio.currentTime <= buf.end(i)) {
        end = buf.end(i);
        break;
      }
      if (buf.end(i) > end) end = buf.end(i);
    }
    const pct = Math.min(100, Math.max(0, (end / this.audio.duration) * 100));
    const bufEl = document.getElementById("pomo-audio-buffer-bar");
    if (bufEl) bufEl.style.width = pct + "%";
  }

  updateTimeProgress() {
    if (!this.audio || !this.audio.duration || this.isScrubbing) return;
    const cur = this.audio.currentTime;
    const dur = this.audio.duration;
    const pct = Math.min(100, Math.max(0, (cur / dur) * 100));

    const playedEl = document.getElementById("pomo-audio-played-bar");
    const thumbEl = document.getElementById("pomo-audio-scrub-thumb");
    const curEl = document.getElementById("pomo-audio-time-current");
    const durEl = document.getElementById("pomo-audio-time-duration");

    if (playedEl) playedEl.style.width = pct + "%";
    if (thumbEl) thumbEl.style.left = pct + "%";
    if (curEl) curEl.textContent = formatAudioTime(cur);
    if (durEl) durEl.textContent = formatAudioTime(dur);
  }

  updatePlayStateInDom(isPlaying) {
    const playBtn = document.getElementById("pomo-music-play-btn");
    if (playBtn) {
      playBtn.innerHTML = isPlaying 
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>' 
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
      playBtn.title = isPlaying ? "Tạm dừng nhạc" : "Phát nhạc";
    }
    const centerEq = document.getElementById("pomo-center-eq");
    if (centerEq) {
      centerEq.classList.toggle("playing", Boolean(isPlaying));
    }
    const currentTrack = this.getCurrentTrack();
    const dropdownItems = document.querySelectorAll(".pomo-playlist-track-row");
    dropdownItems.forEach((row) => {
      const rowId = row.getAttribute("data-track-id");
      const isCurrent = currentTrack && rowId === currentTrack.id;
      row.classList.toggle("active-track", isCurrent);
      const waveEl = row.querySelector(".pomo-soundwave");
      if (waveEl) waveEl.style.display = (isCurrent && isPlaying) ? "inline-flex" : "none";
      const iconBtn = row.querySelector(".pomo-track-play-icon");
      if (iconBtn) iconBtn.textContent = (isCurrent && isPlaying) ? "⏸" : "▶";
    });
  }

  updateTrackMetaInDom() {
    const track = this.getCurrentTrack();
    if (!track) return;
    const titleEl = document.getElementById("pomo-current-music-title");
    if (titleEl) {
      titleEl.innerHTML = `${track.icon} ${safeEsc(track.title)}`;
      titleEl.title = `${track.title} - ${track.artist}`;
    }
    const durEl = document.getElementById("pomo-audio-time-duration");
    if (durEl && this.audio && !isNaN(this.audio.duration) && this.audio.duration > 0) {
      durEl.textContent = formatAudioTime(this.audio.duration);
    }
    const curEl = document.getElementById("pomo-audio-time-current");
    if (curEl && this.audio) {
      curEl.textContent = formatAudioTime(this.audio.currentTime || 0);
    }
  }

  playCompletionBell() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const freqs = [587.33, 880.0, 1174.66]; // D5, A5, D6 harmonic chime
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        g.gain.setValueAtTime(0.25 / (idx + 1), now + idx * 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + 3.0);
      });
    } catch {}
  }
}

export const pomodoroAudio = new PomodoroMusicEngine();

// ========================================================
// 2. POMODORO STATE & QUOTES
// ========================================================
export const pomodoroState = {
  active: false,
  mode: "focus", // "focus" (25m) | "break" (5m)
  remainingSeconds: 25 * 60,
  focusDuration: 25 * 60, // 1500s
  breakDuration: 5 * 60,   // 300s
  timerId: null,
  isPaused: false,
  completedCycles: 0,
  
  // MULTI-DOCUMENT ARCHITECTURE
  docs: [], // Array of { id, name, type: "pdf"|"text"|"image"|"note"|"docx"|"pptx"|"code"|"video"|"audio", content, active }
  activeDocId: null,
  docZoom: typeof localStorage !== "undefined" && localStorage.getItem("pomo_doc_zoom") ? parseFloat(localStorage.getItem("pomo_doc_zoom")) || 1.0 : 1.0,
  sidebarOpen: typeof localStorage !== "undefined" && localStorage.getItem("pomo_sidebar_open") !== null ? localStorage.getItem("pomo_sidebar_open") !== "false" : true,
  sidebarWidth: typeof localStorage !== "undefined" ? Math.max(180, Math.min(480, parseInt(localStorage.getItem("pomo_sidebar_w") || "260", 10))) : 260,
  
  // AI CONTEXT READING TOGGLE & RESIZABLE DOCK
  aiReadScreenContext: true,
  aiDockOpen: typeof localStorage !== "undefined" && localStorage.getItem("pomo_ai_dock_open") !== null ? localStorage.getItem("pomo_ai_dock_open") !== "false" : true,
  aiDockWidth: typeof localStorage !== "undefined" ? Math.max(260, Math.min(680, parseInt(localStorage.getItem("pomo_ai_w") || "360", 10))) : 360,

  history: [],
  totalFocusMinutes: 0,
  totalCycles: 0,
  todayCycles: 0,
  peersCount: 0,
  peers: [],
  peerStatusText: "Chưa có ai trong phòng. Bạn hãy là người đầu tiên vào học nhé! 🚀",
  heartbeatTimerId: null,
  showLearnersModal: false,
  quotesTimer: null,
  currentQuote: "Học đi không là sau này đi bốc vác đấy! ✍️",
  aiChatHistory: [
    { sender: "bot", text: "Xin chào! Mình là Cố vấn AI Bot 3TG trong phòng học Pomodoro 🎧 Bật tùy chọn 'Đọc tài liệu trên màn hình' để mình xem và giải thích bài ngay cho bạn nhé!" }
  ],
  aiInput: "",
  pastedImage: null,
  isAskingAi: false,
  showExitModal: false,
  mobileTab: "clock", // clock | docs | note | ai
  webFocusInterrupted: false,
  webFocusWarnings: 0,
  webDisqualified: false,
  builtinNote: {
    id: "",
    title: "Ghi chú nhanh Pomodoro",
    paper: "lined",
    text: ""
  },
  showCelebrationModal: false,
  showPlaylistDropdown: false,
  playlistSearch: "",
  playlistCategory: "all",
  lastRewardXp: 0,
  lastRewardGems: 0
};

const FOCUS_QUOTES = [
  "Học đi không là sau này đi bốc vác đấy! ✍️",
  "Học 1 ngày bằng người ta lướt TikTok 1 năm! Cố lên! 🔥",
  "Ủa cái đề này ai ra mà ác thế nhờ... Nhưng Thỏ giải được! 🐰",
  "Tập trung cao độ! Cấm sờ vào điện thoại nghe chưa! 📵",
  "Sắp hết 25 phút rồi, +50 XP và 30 💎 đang chờ bạn rinh về! 💎",
  "Đề thi không tự sinh ra cũng không tự mất đi, chỉ chuyển từ đề vào đầu ta thôi! 🧠",
  "Chiến thần săn A+, thánh cày đêm của IU xuất kích! 🚀",
  "Tập trung thêm xíu nữa là xong ca học rồi! Bạn đỉnh lắm! ✨"
];

const BREAK_QUOTES = [
  "Chill tí đã! Uống ngụm trà sữa mát lạnh rồi lát chiến tiếp ca nữa! 🧋",
  "Bạn vừa hoàn thành 1 ca học siêu cháy! Giờ vươn vai hít thở sâu nào! 🧘",
  "5 phút nghỉ giải lao bắt đầu! Đứng dậy vặn mình xíu cho đỡ mỏi lưng nè! 🌸",
  "Tuyệt đỉnh! Chuẩn bị tinh thần để chinh phục ca tiếp theo nhé! ☕",
  "Uống miếng nước đi bạn ơi! Bộ não vừa hoạt động hết công suất rồi! 💧"
];

function getRandomQuote(mode) {
  const list = mode === "focus" ? FOCUS_QUOTES : BREAK_QUOTES;
  return list[Math.floor(Math.random() * list.length)];
}

// ========================================================
// 3. FULLSCREEN & FOCUS KIOSK MODE CHỐNG XAO NHÃNG (DESKTOP + WEB)
// ========================================================
let _webWakeLock = null;
let _webFocusHandlersBound = false;

function triggerWebFocusViolation(reason) {
  if (!pomodoroState.active || window.electronAPI) return;
  if (pomodoroState.mode !== "focus" || pomodoroState.showExitModal) return;

  // Dừng đồng hồ ngay lập tức và hủy thưởng ca hiện tại
  pomodoroState.isPaused = true;
  pomodoroState.webDisqualified = true;

  if (!pomodoroState.webFocusInterrupted) {
    pomodoroState.webFocusWarnings += 1;
  }
  pomodoroState.webFocusInterrupted = true;
  updatePomodoroDisplayInDom();

  const overlay = document.getElementById("pomo-web-lock-overlay");
  if (overlay) {
    overlay.style.display = "flex";
    const countEl = document.getElementById("pomo-web-lock-warn-count");
    if (countEl) countEl.textContent = String(pomodoroState.webFocusWarnings);
  }
  if (window.showToast) {
    window.showToast(reason || "⛔ Đã thoát toàn màn hình! Đồng hồ đã dừng và không tính thưởng ca này.", true);
  }
}

function onWebFullscreenChange() {
  if (!pomodoroState.active || window.electronAPI) return;
  if (!document.fullscreenElement && pomodoroState.mode === "focus" && !pomodoroState.showExitModal) {
    triggerWebFocusViolation("⛔ Bạn vừa thoát chế độ toàn màn hình! Đồng hồ đã dừng và hủy thưởng ca này.");
  }
}

function onWebVisibilityChange() {
  if (!pomodoroState.active || window.electronAPI) return;
  if (document.hidden && pomodoroState.mode === "focus" && !pomodoroState.showExitModal) {
    triggerWebFocusViolation("⛔ Bạn vừa rời tab học tập! Đồng hồ đã dừng và hủy thưởng ca này.");
  }
}

function onWebBeforeUnload(e) {
  if (pomodoroState.active && pomodoroState.mode === "focus") {
    e.preventDefault();
    e.returnValue = "Bạn đang trong ca học Pomodoro. Rời trang sẽ mất tiến độ ca học!";
    return e.returnValue;
  }
}

function onWebContextMenu(e) {
  if (!pomodoroState.active || window.electronAPI) return;
  const tag = (e.target && e.target.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || e.target?.isContentEditable) return;
  e.preventDefault();
}

async function activateWebFocusLock() {
  pomodoroState.webFocusInterrupted = false;
  if (!_webFocusHandlersBound && typeof document !== "undefined") {
    _webFocusHandlersBound = true;
    document.addEventListener("fullscreenchange", onWebFullscreenChange);
    document.addEventListener("visibilitychange", onWebVisibilityChange);
    window.addEventListener("beforeunload", onWebBeforeUnload);
    document.addEventListener("contextmenu", onWebContextMenu);
  }
  try {
    if (navigator.wakeLock && navigator.wakeLock.request) {
      _webWakeLock = await navigator.wakeLock.request("screen");
    }
  } catch {}
}

function deactivateWebFocusLock() {
  pomodoroState.webFocusInterrupted = false;
  pomodoroState.webFocusWarnings = 0;
  pomodoroState.webDisqualified = false;
  if (_webFocusHandlersBound && typeof document !== "undefined") {
    _webFocusHandlersBound = false;
    document.removeEventListener("fullscreenchange", onWebFullscreenChange);
    document.removeEventListener("visibilitychange", onWebVisibilityChange);
    window.removeEventListener("beforeunload", onWebBeforeUnload);
    document.removeEventListener("contextmenu", onWebContextMenu);
  }
  try {
    if (_webWakeLock) {
      _webWakeLock.release().catch(() => {});
      _webWakeLock = null;
    }
  } catch {}
}

export async function resumeWebFocusLock() {
  pomodoroState.webFocusInterrupted = false;
  pomodoroState.isPaused = false;
  updatePomodoroDisplayInDom();
  const overlay = document.getElementById("pomo-web-lock-overlay");
  if (overlay) overlay.style.display = "none";
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen().catch(() => {});
    }
    if (navigator.wakeLock && navigator.wakeLock.request && !_webWakeLock) {
      _webWakeLock = await navigator.wakeLock.request("screen");
    }
  } catch {}
}

export async function enterPomodoroKiosk() {
  window._isPomodoroActive = true;

  try {
    if (window.electronAPI && typeof window.electronAPI.setKiosk === "function") {
      await window.electronAPI.setKiosk(true);
    } else if (window.electronAPI && typeof window.electronAPI.setFullscreen === "function") {
      await window.electronAPI.setFullscreen(true);
    } else {
      await activateWebFocusLock();
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
    }
  } catch {}

  if (document.body) document.body.classList.add("pomodoro-kiosk-mode");
}

export async function exitPomodoroKiosk() {
  window._isPomodoroActive = false;
  deactivateWebFocusLock();

  try {
    if (window.electronAPI && typeof window.electronAPI.setKiosk === "function") {
      await window.electronAPI.setKiosk(false);
    } else if (window.electronAPI && typeof window.electronAPI.setFullscreen === "function") {
      await window.electronAPI.setFullscreen(false);
    } else if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen().catch(() => {});
    }
  } catch {}

  try {
    if (window.electronAPI && typeof window.electronAPI.restoreTaskbar === "function") {
      await window.electronAPI.restoreTaskbar();
    }
  } catch {}

  if (document.body) document.body.classList.remove("pomodoro-kiosk-mode");
}

// Cho phép chụp màn hình (PrtSc / Win + Shift + S) - tạm thời không ép cướp lại focus khi blur
if (typeof window !== "undefined") {
  // Lắng nghe dán ảnh từ Clipboard (Ctrl + V) trong phòng Pomodoro để gửi trực tiếp cho AI
  window.addEventListener("paste", (e) => {
    if (!pomodoroState.active) return;
    const items = e.clipboardData?.items;
    if (!items || !items.length) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type && item.type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target.result;
          const commaIdx = dataUrl.indexOf(",");
          const base64 = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl;
          pomodoroState.pastedImage = {
            name: "Ảnh dán (" + new Date().toLocaleTimeString("vi-VN") + ").png",
            type: file.type || "image/png",
            data: base64,
            previewUrl: dataUrl
          };
          renderPomoPastedImageBadge();
          if (!pomodoroState.aiDockOpen) {
            pomodoroState.aiDockOpen = true;
            const dock = document.getElementById("pomo-ai-dock");
            if (dock) {
              dock.classList.remove("collapsed");
              dock.classList.add("open");
            }
          }
          const textInput = document.getElementById("pomo-ai-text-input");
          if (textInput) textInput.focus();
          if (window.showToast) window.showToast("📸 Đã nhận ảnh từ Clipboard! Bấm Gửi để hỏi Bot 3TG AI.");
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  });

  // Global Pomodoro Keyboard Guard: Chặn triệt để các phím chức năng khi đang học (trừ PrtSc, Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+X, Ctrl+Z, Ctrl+Q)
  window.addEventListener("keydown", (e) => {
    if (!pomodoroState.active) return;

    // Cho phép chụp màn hình (PrtSc) để chụp báo lỗi
    if (e.key === "PrintScreen") return;

    // Thoát khẩn cấp (Ctrl + Q)
    if ((e.ctrlKey || e.metaKey) && (e.key || "").toLowerCase() === "q") {
      e.preventDefault();
      e.stopPropagation();
      openPomodoroExitConfirm();
      return;
    }

    // Chặn triệt để phím Alt (Alt đơn, Alt+Tab, Alt+F4, Alt mở menu bar...)
    if (e.key === "Alt" || e.altKey) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Chặn toàn bộ phím F1 đến F12
    if (/^F\d+$/i.test(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      if (!window.electronAPI && e.key.toUpperCase() === "F11") {
        triggerWebFocusViolation("⛔ Bạn vừa nhấn phím F11 thoát toàn màn hình! Đồng hồ đã dừng và hủy thưởng ca này.");
      }
      return false;
    }

    // Chặn phím Escape để không thoát toàn màn hình
    if (e.key === "Escape") {
      if (pomodoroState.showPlaylist) {
        window.closePomodoroPlaylist();
      }
      e.preventDefault();
      e.stopPropagation();
      if (!window.electronAPI) {
        triggerWebFocusViolation("⛔ Bạn vừa nhấn phím Esc thoát toàn màn hình! Đồng hồ đã dừng và hủy thưởng ca này.");
      }
      return false;
    }

    // Nếu người dùng nhấn Ctrl / Meta: Cho phép soạn thảo (C, V, A, X, Z) và phóng to/thu nhỏ tài liệu (+, -, 0)
    if (e.ctrlKey || e.metaKey) {
      const k = (e.key || "").toLowerCase();
      if (k === "c" || k === "v" || k === "a" || k === "x" || k === "z") {
        return; // Cho phép copy, paste, select all, cut, undo
      }
      if (k === "=" || k === "+" || k === "add") {
        e.preventDefault();
        changeDocZoom(0.1);
        return;
      }
      if (k === "-" || k === "subtract") {
        e.preventDefault();
        changeDocZoom(-0.1);
        return;
      }
      if (k === "0") {
        e.preventDefault();
        resetDocZoom();
        return;
      }
      // Chặn mọi tổ hợp Ctrl khác (Ctrl+W, Ctrl+R, Ctrl+N, Ctrl+P, Ctrl+S, Ctrl+T, Ctrl+Shift+I...)
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);
}

// ========================================================
// 4. POMODORO TIMER ENGINE & CYCLE CONTROLLER
// ========================================================
export async function startPomodoroSession() {
  pomodoroState.active = true;
  pomodoroState.mode = "focus";
  pomodoroState.remainingSeconds = pomodoroState.focusDuration;
  pomodoroState.isPaused = false;
  pomodoroState.showExitModal = false;
  pomodoroState.showCelebrationModal = false;
  pomodoroState.currentQuote = getRandomQuote("focus");

  // Auto select first doc if available and none selected
  if (!pomodoroState.activeDocId && pomodoroState.docs.length > 0) {
    pomodoroState.activeDocId = pomodoroState.docs[0].id;
  }

  // 1. Phản hồi giao diện tức thì (0ms latency), đóng băng trang chủ
  if (document.body) document.body.classList.add("pomodoro-kiosk-mode");
  window._isPomodoroActive = true;
  if (window.render) window.render();

  // 2. Kích hoạt guard bảo vệ hệ thống & Kiosk
  await enterPomodoroKiosk();

  // Kích hoạt nhịp tim trực tuyến báo danh đang học trong phòng Pomodoro
  sendPomodoroHeartbeat();
  if (pomodoroState.heartbeatTimerId) clearInterval(pomodoroState.heartbeatTimerId);
  pomodoroState.heartbeatTimerId = setInterval(sendPomodoroHeartbeat, 25000);

  // Start music track or channel selected in lobby
  const trackSelect = document.getElementById("pomo-lobby-start-track");
  if (trackSelect && !isNaN(parseInt(trackSelect.value, 10))) {
    pomodoroAudio.playTrack(parseInt(trackSelect.value, 10), true);
  } else {
    const soundSelect = document.getElementById("pomo-ambient-select");
    const selectedChannel = soundSelect ? soundSelect.value : (pomodoroAudio.activeChannel !== "none" ? pomodoroAudio.activeChannel : "lofi");
    pomodoroAudio.playChannel(selectedChannel);
  }

  if (pomodoroState.timerId) clearInterval(pomodoroState.timerId);
  if (pomodoroState.quotesTimer) clearInterval(pomodoroState.quotesTimer);

  pomodoroState.timerId = setInterval(onPomodoroTick, 1000);
  pomodoroState.quotesTimer = setInterval(() => {
    pomodoroState.currentQuote = getRandomQuote(pomodoroState.mode);
    updatePomodoroQuoteInDom();
  }, 22000);

  if (window.render) window.render();
}

function onPomodoroTick() {
  if (pomodoroState.isPaused) return;

  if (pomodoroState.remainingSeconds > 0) {
    pomodoroState.remainingSeconds--;
    updatePomodoroDisplayInDom();
  } else {
    pomodoroAudio.playCompletionBell();

    if (pomodoroState.mode === "focus") {
      pomodoroState.completedCycles++;
      handleFocusCycleCompleted();
    } else {
      pomodoroState.mode = "focus";
      pomodoroState.remainingSeconds = pomodoroState.focusDuration;
      pomodoroState.currentQuote = getRandomQuote("focus");
      if (window.showToast) window.showToast("🔔 Hết 5 phút nghỉ! Bắt đầu ca học tiếp theo ngay nào! 🚀");
      if (window.render) window.render();
    }
  }
}

async function handleFocusCycleCompleted() {
  if (pomodoroState.webDisqualified) {
    pomodoroState.lastRewardXp = 0;
    pomodoroState.lastRewardGems = 0;
    pomodoroState.mode = "break";
    pomodoroState.remainingSeconds = pomodoroState.breakDuration;
    pomodoroState.currentQuote = getRandomQuote("break");
    pomodoroState.showCelebrationModal = true;
    if (window.showToast) {
      window.showToast("⚠️ Ca học hoàn tất nhưng KHÔNG ĐƯỢC THƯỞNG do đã thoát toàn màn hình giữa chừng!", true);
    }
    if (window.render) window.render();
    return;
  }

  const xpAwarded = 50;
  const gemsAwarded = 30;
  pomodoroState.lastRewardXp = xpAwarded;
  pomodoroState.lastRewardGems = gemsAwarded;

  const activeDoc = pomodoroState.docs.find(d => d.id === pomodoroState.activeDocId);
  const currentTrack = pomodoroAudio.getCurrentTrack();

  try {
    const res = await callApi("/api/pomodoro/complete", {
      method: "POST",
      body: {
        cycles: 1,
        focusMinutes: 25,
        docName: activeDoc ? activeDoc.name : (pomodoroState.docs.length > 0 ? pomodoroState.docs[0].name : null)
      }
    });
    if (res && res.ok) {
      if (window.state && window.state.stats) {
        window.state.stats.total_xp = res.totalXp;
        window.state.stats.gems = res.gems;
        window.state.stats.current_streak = res.streak;
        if (window.updateShell) window.updateShell();
      }
      pomodoroState.totalFocusMinutes += 25;
      pomodoroState.totalCycles += 1;
      pomodoroState.todayCycles += 1;
    }
  } catch (err) {
    console.warn("[Pomodoro] Lưu kết quả thất bại:", err);
  }

  pomodoroState.mode = "break";
  pomodoroState.remainingSeconds = pomodoroState.breakDuration;
  pomodoroState.currentQuote = getRandomQuote("break");
  pomodoroState.showCelebrationModal = true;

  if (window.render) window.render();
}

export function pausePomodoroTimer() {
  pomodoroState.isPaused = !pomodoroState.isPaused;
  updatePomodoroDisplayInDom();
}

export function openPomodoroExitConfirm() {
  pomodoroState.showExitModal = true;
  updatePomodoroModalsInDom();
}

export function closePomodoroExitConfirm() {
  pomodoroState.showExitModal = false;
  updatePomodoroModalsInDom();
}

export async function abandonPomodoroSession() {
  if (pomodoroState.timerId) clearInterval(pomodoroState.timerId);
  if (pomodoroState.quotesTimer) clearInterval(pomodoroState.quotesTimer);
  if (pomodoroState.heartbeatTimerId) {
    clearInterval(pomodoroState.heartbeatTimerId);
    pomodoroState.heartbeatTimerId = null;
  }
  callApi("/api/pomodoro/leave", { method: "POST" }).catch(() => {});
  pomodoroAudio.stopAll();

  pomodoroState.active = false;
  pomodoroState.showExitModal = false;
  pomodoroState.showCelebrationModal = false;
  pomodoroState.isPaused = false;
  pomodoroState.pastedImage = null;

  await exitPomodoroKiosk();
  window._isPomodoroActive = false;
  if (document.body) document.body.classList.remove("pomodoro-kiosk-mode");

  if (window.showToast) {
    if (pomodoroState.completedCycles > 0) {
      window.showToast(`Bạn đã hoàn thành ${pomodoroState.completedCycles} ca học hôm nay (+${pomodoroState.completedCycles * 50} XP, +${pomodoroState.completedCycles * 30} 💎)! 🌟`);
    } else {
      window.showToast("Đã dừng ca học dở dang. Hãy sẵn sàng cho lần tập trung tiếp theo nhé! 💪", true);
    }
  }

  pomodoroState.completedCycles = 0;
  if (window.render) window.render();
}

export function finishBreakAndContinue() {
  pomodoroState.showCelebrationModal = false;
  pomodoroState.mode = "focus";
  pomodoroState.remainingSeconds = pomodoroState.focusDuration;
  pomodoroState.currentQuote = getRandomQuote("focus");
  if (window.render) window.render();
}

export function finishBreakAndExit() {
  pomodoroState.showCelebrationModal = false;
  abandonPomodoroSession();
}

// ========================================================
// 5. DATA SYNC (PEERS & STUDY HISTORY)
// ========================================================
export async function loadPomodoroData() {
  try {
    const [peersRes, histRes] = await Promise.all([
      callApi("/api/pomodoro/peers").catch(() => null),
      callApi("/api/pomodoro/history").catch(() => null)
    ]);

    if (peersRes) {
      pomodoroState.peersCount = peersRes.peersCount != null ? peersRes.peersCount : 0;
      pomodoroState.peers = peersRes.peers || [];
      pomodoroState.peerStatusText = peersRes.statusText || "";
    }

    if (histRes) {
      pomodoroState.history = histRes.history || [];
      pomodoroState.totalFocusMinutes = histRes.totalFocusMinutes || 0;
      pomodoroState.totalCycles = histRes.totalCycles || 0;
      pomodoroState.todayCycles = histRes.todayCycles || 0;
    }
  } catch (err) {
    console.warn("[Pomodoro] Load data error:", err);
  }
}

export async function sendPomodoroHeartbeat() {
  if (!pomodoroState.active) return;
  const activeDoc = pomodoroState.docs.find(d => d.id === pomodoroState.activeDocId);
  try {
    await callApi("/api/pomodoro/heartbeat", {
      method: "POST",
      body: {
        cycle: pomodoroState.completedCycles + 1,
        mode: pomodoroState.mode,
        docName: activeDoc ? activeDoc.name : ""
      }
    });
  } catch {}
}

export async function openPomodoroLearnersList() {
  try {
    const peersRes = await callApi("/api/pomodoro/peers").catch(() => null);
    if (peersRes) {
      pomodoroState.peersCount = peersRes.peersCount != null ? peersRes.peersCount : 0;
      pomodoroState.peers = peersRes.peers || [];
      pomodoroState.peerStatusText = peersRes.statusText || "";
    }
  } catch {}
  pomodoroState.showLearnersModal = true;
  if (window.render) window.render();
}

export function closePomodoroLearnersList() {
  pomodoroState.showLearnersModal = false;
  if (window.render) window.render();
}

export function renderPomodoroLearnersModal() {
  return `
    <div class="pomo-modal-backdrop" id="pomo-learners-modal" style="display: ${pomodoroState.showLearnersModal ? 'flex' : 'none'};" onclick="if(event.target === this) window.closePomodoroLearnersList()">
      <div class="pomo-learners-card" onclick="event.stopPropagation()">
        <div class="pomo-learners-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="pomo-live-dot" style="width:10px; height:10px;"></span>
            <h3 class="pomo-learners-title">Bạn Học Đang Trong Phòng Pomodoro</h3>
            <span class="pomo-learners-count-pill">${pomodoroState.peersCount} người</span>
          </div>
          <button type="button" class="pomo-modal-close-x" onclick="window.closePomodoroLearnersList()" title="Đóng">✕</button>
        </div>

        <div class="pomo-learners-body">
          ${pomodoroState.peers && pomodoroState.peers.length > 0 ? `
            <div class="pomo-learners-grid">
              ${pomodoroState.peers.map(p => {
                const initial = (p.name || 'H').charAt(0).toUpperCase();
                return `
                  <div class="pomo-learner-row ${p.isMe ? 'is-me' : ''}">
                    <div class="pomo-learner-avatar-wrap" onclick="if(window.openUserProfileModal) window.openUserProfileModal('${safeEsc(p.userId)}')" style="cursor:pointer;" title="Xem hồ sơ">
                      ${p.avatarUrl && !p.avatarUrl.startsWith('mascot:') ? `
                        <img src="${safeEsc(p.avatarUrl)}" class="pomo-learner-avatar-img" alt="${safeEsc(p.name)}">
                      ` : `
                        <div class="pomo-learner-avatar-initial">${safeEsc(initial)}</div>
                      `}
                      ${p.avatarDecoration ? `<span class="pomo-learner-deco-badge">✨</span>` : ''}
                    </div>

                    <div class="pomo-learner-info" onclick="if(window.openUserProfileModal) window.openUserProfileModal('${safeEsc(p.userId)}')" style="cursor:pointer;">
                      <div class="pomo-learner-name-line">
                        <span class="pomo-learner-name">${safeEsc(p.name)}</span>
                        ${p.isMe ? `<span class="pomo-learner-me-tag">Bạn</span>` : ''}
                      </div>
                      <div class="pomo-learner-sub">
                        ${p.school ? safeEsc(p.school) : 'Học viên 3TG'} ${p.major ? '• ' + safeEsc(p.major) : ''}
                      </div>
                      <div class="pomo-learner-state-line">
                        <span class="pomo-learner-status-pill ${p.isLive ? 'live' : 'done'}">
                          ${p.isLive ? `🔴 Đang tập trung ca #${p.cycle}` : `⚪ Vừa hoàn thành ca hôm nay`}
                        </span>
                        ${p.docName ? `<span class="pomo-learner-doc-tag" title="${safeEsc(p.docName)}">📖 ${safeEsc(p.docName)}</span>` : ''}
                      </div>
                    </div>

                    <div class="pomo-learner-actions">
                      <button type="button" class="btn-duo btn-duo-white" style="padding:6px 12px; font-size:12px;" onclick="if(window.openUserProfileModal) window.openUserProfileModal('${safeEsc(p.userId)}')" title="Xem hồ sơ & kết bạn">
                        👤 Hồ sơ
                      </button>
                      ${!p.isMe ? `
                        <button type="button" class="btn-duo btn-duo-pink" style="padding:6px 12px; font-size:12px;" onclick="if(window.openDirectChat) { window.closePomodoroLearnersList(); window.openDirectChat('${safeEsc(p.userId)}', '${safeEsc(p.name)}'); }" title="Nhắn tin trò chuyện">
                          💬 Nhắn
                        </button>
                      ` : ''}
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          ` : `
            <div class="pomo-learners-empty">
              <div style="font-size:36px; margin-bottom:8px;">🛋️</div>
              <p style="font-weight:700; color:var(--ink-700); margin:0;">Phòng học hiện đang vắng người.</p>
              <p style="font-size:13px; color:var(--ink-400); margin:4px 0 0;">Bạn hãy bắt đầu ca học để trở thành người tiên phong dẫn đầu nhé! 🔥</p>
            </div>
          `}
        </div>

        <div class="pomo-learners-footer">
          <span style="font-size:12px; color:var(--ink-400);">💡 Nhấp vào bạn học để xem hồ sơ hoặc kết bạn</span>
          <button type="button" class="btn-duo btn-duo-white" style="padding:6px 16px; font-size:12px;" onclick="window.closePomodoroLearnersList()">Đóng</button>
        </div>
      </div>
    </div>
  `;
}

// ========================================================
// 5.5 MATH FORMULA & AI TEXT FORMATTERS
// ========================================================

export function renderMathFormula(latex, displayMode = false) {
  return renderLatex(latex, displayMode);
}

export function formatInlineMarkdown(text) {
  return formatInlineRichText(text, { variant: "pomo" });
}

export function formatPomodoroAiText(raw) {
  return formatAiRichText(raw, { variant: "pomo" });
}

export function formatOfficeTextToHtml(rawText) {
  if (!rawText) return `<div class="office-empty">Tài liệu không có nội dung văn bản để hiển thị.</div>`;
  const slides = rawText.split(/(?=\[SLIDE\s+\d+\])/i);
  if (slides.length > 1) {
    return slides.map(slide => {
      const trimmed = slide.trim();
      const match = trimmed.match(/^\[SLIDE\s+(\d+)\](.*)/is);
      const slideNum = match ? match[1] : "";
      const slideContent = match ? match[2].trim() : trimmed;
      return `
        <div class="office-slide-card">
          <div class="slide-card-header">
            <span class="slide-pill">Slide ${slideNum}</span>
          </div>
          <div class="slide-card-body">${safeEsc(slideContent).replace(/\n/g, '<br>')}</div>
        </div>
      `;
    }).join("");
  }
  // Word / regular document
  const paragraphs = rawText.split("\n\n").filter(p => p.trim());
  return `
    <div class="office-doc-sheet">
      ${paragraphs.map(p => `<p class="office-doc-p">${safeEsc(p.trim()).replace(/\n/g, '<br>')}</p>`).join("")}
    </div>
  `;
}

// ========================================================
// 5. ZIP CENTRAL DIRECTORY PARSER & DOCUMENT RENDERERS
// ========================================================

// Read zipped files (DOCX, PPTX) robustly by parsing the ZIP Central Directory
export async function readZipTextEntriesFromBuffer(buffer, targetRegex) {
  const entries = new Map();
  try {
    const view = new DataView(buffer);
    const byteLen = buffer.byteLength;
    let eocd = -1;

    // Search backward for End of Central Directory signature 0x06054b50
    for (let i = byteLen - 22; i >= Math.max(0, byteLen - 65558); i--) {
      if (view.getUint32(i, true) === 0x06054b50) {
        eocd = i;
        break;
      }
    }

    if (eocd !== -1) {
      const cdOffset = view.getUint32(eocd + 16, true);
      const cdRecords = view.getUint16(eocd + 10, true);
      let cdPtr = cdOffset;

      for (let r = 0; r < cdRecords && cdPtr + 46 <= byteLen; r++) {
        if (view.getUint32(cdPtr, true) !== 0x02014b50) break;
        const compression = view.getUint16(cdPtr + 10, true);
        const compSize = view.getUint32(cdPtr + 20, true);
        const fnLen = view.getUint16(cdPtr + 28, true);
        const extraLen = view.getUint16(cdPtr + 30, true);
        const commentLen = view.getUint16(cdPtr + 32, true);
        const localHeaderOffset = view.getUint32(cdPtr + 42, true);

        const fnBytes = new Uint8Array(buffer, cdPtr + 46, fnLen);
        const filename = new TextDecoder("utf-8").decode(fnBytes);

        if (!targetRegex || targetRegex.test(filename)) {
          if (localHeaderOffset + 30 <= byteLen && view.getUint32(localHeaderOffset, true) === 0x04034b50) {
            const locFnLen = view.getUint16(localHeaderOffset + 26, true);
            const locExtraLen = view.getUint16(localHeaderOffset + 28, true);
            const dataStart = localHeaderOffset + 30 + locFnLen + locExtraLen;

            if (dataStart + compSize <= byteLen) {
              const compData = new Uint8Array(buffer, dataStart, compSize);
              let text = "";
              if (compression === 0) {
                text = new TextDecoder("utf-8").decode(compData);
              } else if (compression === 8 && typeof DecompressionStream !== "undefined") {
                try {
                  const ds = new DecompressionStream("deflate-raw");
                  const writer = ds.writable.getWriter();
                  writer.write(compData);
                  writer.close();
                  const decompressed = await new Response(ds.readable).arrayBuffer();
                  text = new TextDecoder("utf-8").decode(decompressed);
                } catch (e) {
                  console.warn("Decompress error for", filename, e);
                }
              }
              if (text) entries.set(filename, text);
            }
          }
        }
        cdPtr += 46 + fnLen + extraLen + commentLen;
      }
    }
  } catch (err) {
    console.warn("readZipTextEntriesFromBuffer error:", err);
  }
  return entries;
}

// Parse Word document.xml into clean HTML (with tables, headings, paragraphs) and clean plain text for AI
export function parseDocxToHtmlAndText(xmlContent) {
  if (!xmlContent) return { html: "", text: "" };
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "application/xml");
    const body = xmlDoc.getElementsByTagName("w:body")[0];
    if (!body) return parseDocxRegexFallback(xmlContent);

    const htmlParts = [];
    const textParts = [];

    function extractRuns(node) {
      let runHtml = "";
      let runText = "";
      const rNodes = node.getElementsByTagName("w:r");
      for (let i = 0; i < rNodes.length; i++) {
        const r = rNodes[i];
        const isBold = r.getElementsByTagName("w:b").length > 0;
        const isItalic = r.getElementsByTagName("w:i").length > 0;
        const isUnderline = r.getElementsByTagName("w:u").length > 0;
        
        let tStr = "";
        const tNodes = r.getElementsByTagName("w:t");
        for (let j = 0; j < tNodes.length; j++) {
          tStr += tNodes[j].textContent || "";
        }
        if (!tStr) continue;

        runText += tStr;
        let escaped = safeEsc(tStr);
        if (isBold) escaped = `<strong>${escaped}</strong>`;
        if (isItalic) escaped = `<em>${escaped}</em>`;
        if (isUnderline) escaped = `<u>${escaped}</u>`;
        runHtml += escaped;
      }
      return { html: runHtml, text: runText };
    }

    const children = Array.from(body.childNodes);
    for (const child of children) {
      const nodeName = child.nodeName;

      if (nodeName === "w:tbl") {
        // Table
        const rows = child.getElementsByTagName("w:tr");
        let tblHtml = `<div class="docx-table-container"><table class="docx-table"><tbody>`;
        let tblText = "\n";
        for (let r = 0; r < rows.length; r++) {
          tblHtml += "<tr>";
          const cells = rows[r].getElementsByTagName("w:tc");
          const cellTexts = [];
          for (let c = 0; c < cells.length; c++) {
            const pInCell = cells[c].getElementsByTagName("w:p");
            const cellParts = [];
            for (let cp = 0; cp < pInCell.length; cp++) {
              const res = extractRuns(pInCell[cp]);
              if (res.html) cellParts.push(res.html);
            }
            const cellInnerHtml = cellParts.join("<br>") || "&nbsp;";
            tblHtml += `<td>${cellInnerHtml}</td>`;
            cellTexts.push(cellParts.join(" ").replace(/<[^>]+>/g, "").trim());
          }
          tblHtml += "</tr>";
          tblText += `| ${cellTexts.join(" | ")} |\n`;
        }
        tblHtml += "</tbody></table></div>";
        htmlParts.push(tblHtml);
        textParts.push(tblText);
      } else if (nodeName === "w:p") {
        // Paragraph or Heading
        const pStyle = child.getElementsByTagName("w:pStyle")[0];
        const styleVal = pStyle ? (pStyle.getAttribute("w:val") || "").toLowerCase() : "";
        const isHeading1 = styleVal.includes("heading1") || styleVal.includes("title");
        const isHeading2 = styleVal.includes("heading2") || styleVal.includes("subtitle");
        const isHeading3 = styleVal.includes("heading3");

        const { html: pHtml, text: pText } = extractRuns(child);
        if (!pText.trim()) continue;

        if (isHeading1) {
          htmlParts.push(`<h2 class="docx-heading docx-h1">${pHtml}</h2>`);
          textParts.push(`\n## ${pText.trim()}\n`);
        } else if (isHeading2) {
          htmlParts.push(`<h3 class="docx-heading docx-h2">${pHtml}</h3>`);
          textParts.push(`\n### ${pText.trim()}\n`);
        } else if (isHeading3) {
          htmlParts.push(`<h4 class="docx-heading docx-h3">${pHtml}</h4>`);
          textParts.push(`\n#### ${pText.trim()}\n`);
        } else {
          const numPr = child.getElementsByTagName("w:numPr").length > 0;
          if (numPr) {
            htmlParts.push(`<div class="docx-bullet-item"><span class="docx-bullet-dot">•</span><span>${pHtml}</span></div>`);
            textParts.push(`• ${pText.trim()}`);
          } else {
            htmlParts.push(`<p class="docx-paragraph">${pHtml}</p>`);
            textParts.push(pText.trim());
          }
        }
      }
    }

    const finalHtml = `<div class="docx-document-sheet">${htmlParts.join("\n")}</div>`;
    const finalText = textParts.join("\n\n");
    return { html: finalHtml, text: finalText };
  } catch (err) {
    console.warn("parseDocxToHtmlAndText DOM error:", err);
    return parseDocxRegexFallback(xmlContent);
  }
}

// Fallback regex parser for docx - never output raw XML tags
export function parseDocxRegexFallback(xmlContent) {
  if (!xmlContent) return { html: "", text: "" };
  const paragraphs = xmlContent.split(/<\/w:p>/g);
  const cleanParagraphs = [];
  for (const p of paragraphs) {
    const runs = [...p.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/g)].map(m => m[1]);
    const cleanText = runs.join("").trim();
    if (cleanText) cleanParagraphs.push(cleanText);
  }
  const finalText = cleanParagraphs.join("\n\n");
  const finalHtml = `
    <div class="docx-document-sheet">
      ${cleanParagraphs.map(p => `<p class="docx-paragraph">${safeEsc(p)}</p>`).join("")}
    </div>
  `;
  return { html: finalHtml, text: finalText };
}

// Parse Note data from Note prefix __3TG_NOTE_V1__:
export function parsePomoNoteData(raw) {
  const str = String(raw || "");
  const prefix = "__3TG_NOTE_V1__:";
  if (!str.startsWith(prefix)) {
    return {
      plainText: str,
      htmlBody: safeEsc(str).replace(/\n/g, "<br>"),
      style: { paper: "lined", font: "sans", strokes: [] }
    };
  }

  try {
    const json = JSON.parse(str.slice(prefix.length));
    const body = String(json.body || "");
    const style = json.style || {};
    const isHtml = json.format === "html";
    
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = body;
    const plainText = tempDiv.textContent || tempDiv.innerText || body;

    let htmlBody = "";
    if (isHtml) {
      htmlBody = body;
    } else {
      htmlBody = safeEsc(body)
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/==(.+?)==/g, "<mark>$1</mark>")
        .replace(/\$([^$\n]+)\$/g, '<span class="note-math">$1</span>')
        .replace(/\r?\n/g, "<br>");
    }

    return {
      plainText: plainText.trim(),
      htmlBody: htmlBody,
      style: {
        paper: style.paper || "lined",
        font: style.font || "sans",
        strokes: Array.isArray(style.strokes) ? style.strokes : []
      }
    };
  } catch (err) {
    return {
      plainText: str.slice(prefix.length),
      htmlBody: safeEsc(str.slice(prefix.length)),
      style: { paper: "lined", font: "sans", strokes: [] }
    };
  }
}

// Render rich student note view with paper lines, styled font, and stroke overlay
export function renderNoteDocView(doc) {
  const data = doc.noteData || parsePomoNoteData(doc.content);
  const paperClass = `note-paper-${data.style.paper || 'lined'}`;
  const fontClass = `note-font-${data.style.font || 'sans'}`;

  return `
    <div class="pomo-doc-note-container">
      <div class="pomo-note-sheet ${paperClass} ${fontClass}">
        <div class="pomo-note-title-badge">
          <span class="pomo-note-icon">📝</span>
          <h2 class="pomo-note-title">${safeEsc(doc.name)}</h2>
          <button type="button" class="btn-viewer-tool" style="margin-left:auto;" onclick="window.askPomodoroAi('Giải thích và mở rộng các điểm chính trong ghi chú này')">
            🤖 Hỏi AI về ghi chú này
          </button>
        </div>
        <div class="pomo-note-body-content">
          ${data.htmlBody}
        </div>
        ${data.style.strokes && data.style.strokes.length > 0 ? `
          <svg class="pomo-note-drawing-layer" viewBox="0 0 800 600" preserveAspectRatio="none">
            ${data.style.strokes.map(s => `
              <path d="${safeEsc(s.d)}" stroke="${safeEsc(s.color || '#d63376')}" stroke-width="${s.width || 3}" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            `).join("")}
          </svg>
        ` : ''}
      </div>
    </div>
  `;
}

// Extract text and HTML from Office PPTX / DOCX zip packages
export async function extractTextFromZipDoc(file, ext) {
  try {
    const buffer = await file.arrayBuffer();
    const isPpt = ext === "pptx" || ext === "ppt";
    const targetRegex = isPpt ? /^ppt\/slides\/slide\d+\.xml$/i : /^word\/document\.xml$/i;
    const zipEntries = await readZipTextEntriesFromBuffer(buffer, targetRegex);

    if (isPpt) {
      const slides = [];
      for (const [fn, xml] of zipEntries.entries()) {
        const slideNumMatch = fn.match(/\d+/);
        const num = slideNumMatch ? parseInt(slideNumMatch[0], 10) : 1;
        const tRuns = [...xml.matchAll(/<a:t[^>]*>(.*?)<\/a:t>/g)].map(m => m[1]);
        const combined = tRuns.join(" ").trim();
        if (combined) slides.push({ num, text: combined });
      }
      if (slides.length > 0) {
        slides.sort((a, b) => a.num - b.num);
        const plainText = slides.map(s => `[SLIDE ${s.num}]\n${s.text}`).join("\n\n");
        const html = slides.map(s => `
          <div class="office-slide-card">
            <div class="slide-card-header"><span class="slide-pill">Slide ${s.num}</span></div>
            <div class="slide-card-body">${safeEsc(s.text).replace(/\n/g, '<br>')}</div>
          </div>
        `).join("");
        return { text: plainText, html: html };
      }
    } else {
      // DOCX
      const docXml = zipEntries.get("word/document.xml");
      if (docXml) {
        return parseDocxToHtmlAndText(docXml);
      }
    }

    // Fallback: extract clean text chunks from buffer without raw XML tags
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const rawStr = decoder.decode(buffer);
    const cleanRuns = [...rawStr.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g)].map(m => m[1]);
    if (cleanRuns.length > 0) {
      const text = cleanRuns.join(" ");
      return { text, html: `<div class="docx-document-sheet"><p class="docx-paragraph">${safeEsc(text)}</p></div>` };
    }
    return { text: "", html: "" };
  } catch (err) {
    console.warn("extractTextFromZipDoc error:", err);
    return { text: "", html: "" };
  }
}

export async function extractTextFromPdfDoc(file, prefBuffer = null) {
  try {
    const buffer = prefBuffer || (file.arrayBuffer ? await file.arrayBuffer() : file);

    // 1. Ưu tiên PDF.js nếu có trong runtime (Trích xuất toàn bộ text chuẩn xác 100%)
    if (typeof window !== "undefined" && window.pdfjsLib) {
      try {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.js";
        const cloneData = buffer instanceof ArrayBuffer ? new Uint8Array(buffer.slice(0)) : (buffer.buffer ? new Uint8Array(buffer.buffer.slice(0)) : buffer);
        const loadingTask = window.pdfjsLib.getDocument({ data: cloneData });
        const pdf = await loadingTask.promise;
        const textPieces = [];
        const maxPages = Math.min(pdf.numPages, 30);
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const tc = await page.getTextContent();
          const pt = tc.items.map(it => it.str).join(" ");
          if (pt.trim()) textPieces.push(`[Trang ${i}]:\n${pt}`);
        }
        if (textPieces.length > 0) {
          return textPieces.join("\n\n");
        }
      } catch (e) {
        console.warn("pdfjs extractText error:", e);
      }
    }

    const decoder = new TextDecoder("latin1");
    const rawStr = decoder.decode(buffer);
    const textPieces = [];

    // 1. Trích xuất text thông thường (uncompressed Tj)
    const tjMatches = [...rawStr.matchAll(/\(([^()]{2,100})\)\s*Tj/g)];
    tjMatches.forEach(m => {
      const clean = m[1].replace(/\\([()\\])/g, "$1").trim();
      if (clean.length > 2) textPieces.push(clean);
    });

    // 2. Trích xuất từ các FlateDecode stream nén bằng DecompressionStream nguyên bản của Chromium/Electron
    if (typeof DecompressionStream !== "undefined") {
      const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
      let streamMatch;
      let decompCount = 0;
      while ((streamMatch = streamRegex.exec(rawStr)) !== null && decompCount < 30) {
        decompCount++;
        const rawPart = streamMatch[1];
        if (!rawPart || rawPart.length < 10) continue;
        const streamBytes = new Uint8Array(rawPart.length);
        for (let i = 0; i < rawPart.length; i++) {
          streamBytes[i] = rawPart.charCodeAt(i);
        }

        let decText = null;
        try {
          const ds = new DecompressionStream("deflate");
          const writer = ds.writable.getWriter();
          writer.write(streamBytes);
          writer.close();
          const reader = ds.readable.getReader();
          const chunks = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
          const merged = new Uint8Array(totalLen);
          let offset = 0;
          for (const c of chunks) {
            merged.set(c, offset);
            offset += c.length;
          }
          decText = new TextDecoder("utf-8", { fatal: false }).decode(merged);
        } catch {
          try {
            const ds = new DecompressionStream("deflate-raw");
            const writer = ds.writable.getWriter();
            writer.write(streamBytes);
            writer.close();
            const reader = ds.readable.getReader();
            const chunks = [];
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
            }
            const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
            const merged = new Uint8Array(totalLen);
            let offset = 0;
            for (const c of chunks) {
              merged.set(c, offset);
              offset += c.length;
            }
            decText = new TextDecoder("utf-8", { fatal: false }).decode(merged);
          } catch {}
        }

        if (decText) {
          const streamTj = [...decText.matchAll(/\(([^()]{2,140})\)\s*Tj/g)];
          streamTj.forEach(m => {
            const clean = m[1].replace(/\\([()\\])/g, "$1").trim();
            if (clean.length > 2) textPieces.push(clean);
          });
          const streamTJArr = [...decText.matchAll(/\[(.*?)\]\s*TJ/g)];
          streamTJArr.forEach(m => {
            const items = [...m[1].matchAll(/\(([^()]+)\)/g)];
            items.forEach(it => {
              const clean = it[1].replace(/\\([()\\])/g, "$1").trim();
              if (clean.length > 1) textPieces.push(clean);
            });
          });
        }
      }
    }

    if (textPieces.length > 0) {
      return textPieces.slice(0, 1000).join(" ");
    }
  } catch (err) {
    console.warn("extractTextFromPdfDoc error:", err);
  }
  return "";
}

// ========================================================
// 6. MULTI-DOCUMENT MANAGEMENT
// ========================================================
export async function addMultipleLocalFiles(fileList) {
  if (!fileList || fileList.length === 0) return;

  const blockedExts = [".exe", ".dll", ".bin", ".iso", ".msi", ".sys", ".bat", ".cmd", ".vbs", ".com", ".scr"];
  const codeExts = [".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".cpp", ".c", ".cs", ".html", ".css", ".json", ".sql", ".php", ".rs", ".go", ".sh", ".yml", ".yaml", ".xml"];
  const videoExts = [".mp4", ".webm", ".ogv", ".mov", ".mkv"];
  const audioExts = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"];

  for (const file of Array.from(fileList)) {
    const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase() : "";

    if (blockedExts.includes(ext)) {
      if (window.showToast) window.showToast(`⚠️ Không hỗ trợ file thực thi (${ext}) vì lý do an toàn!`, true);
      continue;
    }

    const docId = "doc_" + Math.random().toString(36).slice(2, 9);

    if (file.type.startsWith("image/") || [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        pomodoroState.docs.push({
          id: docId,
          name: file.name,
          type: "image",
          content: e.target.result,
          extractedText: `Hình ảnh tài liệu: ${file.name}`
        });
        if (!pomodoroState.activeDocId) pomodoroState.activeDocId = docId;
        if (window.render) window.render();
      };
      reader.readAsDataURL(file);
    } else if (file.type === "application/pdf" || ext === ".pdf") {
      let arrayBuffer = null;
      try {
        arrayBuffer = await file.arrayBuffer();
      } catch (abErr) {
        console.warn("arrayBuffer error:", abErr);
      }
      const pdfBlob = arrayBuffer ? new Blob([arrayBuffer], { type: "application/pdf" }) : (file.type === "application/pdf" ? file : new Blob([file], { type: "application/pdf" }));
      const blobUrl = URL.createObjectURL(pdfBlob);
      const pdfText = await extractTextFromPdfDoc(file, arrayBuffer);
      const pdfDocObj = {
        id: docId,
        name: file.name,
        type: "pdf",
        content: blobUrl,
        blobUrl: blobUrl,
        arrayBuffer: arrayBuffer,
        file: file,
        extractedText: pdfText,
        currentPage: 1,
        numPages: 1,
        viewMode: "continuous"
      };
      pomodoroState.docs.push(pdfDocObj);
      if (!pomodoroState.activeDocId) pomodoroState.activeDocId = docId;
      if (window.render) window.render();
      setTimeout(() => initPdfDocViewer(pdfDocObj), 60);
    } else if (ext === ".pptx" || ext === ".ppt") {
      const extracted = await extractTextFromZipDoc(file, "pptx");
      pomodoroState.docs.push({
        id: docId,
        name: file.name,
        type: "pptx",
        content: extracted.text,
        htmlContent: extracted.html,
        extractedText: extracted.text
      });
      if (!pomodoroState.activeDocId) pomodoroState.activeDocId = docId;
      if (window.render) window.render();
    } else if (ext === ".docx" || ext === ".doc") {
      const extracted = await extractTextFromZipDoc(file, "docx");
      pomodoroState.docs.push({
        id: docId,
        name: file.name,
        type: "docx",
        content: extracted.text,
        htmlContent: extracted.html,
        extractedText: extracted.text
      });
      if (!pomodoroState.activeDocId) pomodoroState.activeDocId = docId;
      if (window.render) window.render();
    } else if (videoExts.includes(ext) || file.type.startsWith("video/")) {
      const blobUrl = URL.createObjectURL(file);
      pomodoroState.docs.push({
        id: docId,
        name: file.name,
        type: "video",
        content: blobUrl,
        extractedText: `Video bài giảng: ${file.name}`
      });
      if (!pomodoroState.activeDocId) pomodoroState.activeDocId = docId;
      if (window.render) window.render();
    } else if (audioExts.includes(ext) || file.type.startsWith("audio/")) {
      const blobUrl = URL.createObjectURL(file);
      pomodoroState.docs.push({
        id: docId,
        name: file.name,
        type: "audio",
        content: blobUrl,
        extractedText: `Audio bài học: ${file.name}`
      });
      if (!pomodoroState.activeDocId) pomodoroState.activeDocId = docId;
      if (window.render) window.render();
    } else if (codeExts.includes(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        pomodoroState.docs.push({
          id: docId,
          name: file.name,
          type: "code",
          content: e.target.result,
          extractedText: e.target.result
        });
        if (!pomodoroState.activeDocId) pomodoroState.activeDocId = docId;
        if (window.render) window.render();
      };
      reader.readAsText(file);
    } else {
      // Default: Text / Markdown / Document
      const reader = new FileReader();
      reader.onload = (e) => {
        pomodoroState.docs.push({
          id: docId,
          name: file.name,
          type: "text",
          content: e.target.result,
          extractedText: e.target.result
        });
        if (!pomodoroState.activeDocId) pomodoroState.activeDocId = docId;
        if (window.render) window.render();
      };
      reader.readAsText(file);
    }
  }

  if (window.showToast) window.showToast(`Đã thêm ${fileList.length} tài liệu học tập! ✨`);
}

export function addNoteToDocs(noteId) {
  if (!window.state || !window.state.notes) return;
  const note = window.state.notes.find(n => String(n.id) === String(noteId));
  if (!note) return;

  const docId = "note_" + note.id;
  const existing = pomodoroState.docs.find(d => d.id === docId);
  if (existing) {
    pomodoroState.activeDocId = docId;
  } else {
    const parsed = parsePomoNoteData(note.content);
    pomodoroState.docs.push({
      id: docId,
      name: note.title || "Ghi chú không tên",
      type: "note",
      content: note.content || "",
      noteData: parsed,
      extractedText: parsed.plainText || note.title || ""
    });
    pomodoroState.activeDocId = docId;
  }
  if (window.showToast) window.showToast(`Đã thêm ghi chú "${note.title}" vào bàn học! 📝`);
  if (window.render) window.render();
}

export function setActiveDoc(docId) {
  pomodoroState.activeDocId = docId;
  if (window.render) window.render();
  const doc = pomodoroState.docs.find(d => d.id === docId);
  if (doc && doc.type === "pdf") {
    setTimeout(() => initPdfDocViewer(doc), 50);
  }
}

export function removeDoc(docId, event) {
  if (event) event.stopPropagation();
  pomodoroState.docs = pomodoroState.docs.filter(d => d.id !== docId);
  if (pomodoroState.activeDocId === docId) {
    pomodoroState.activeDocId = pomodoroState.docs.length > 0 ? pomodoroState.docs[0].id : null;
  }
  if (window.render) window.render();
}

export function closeActiveDoc() {
  pomodoroState.activeDocId = null;
  if (window.render) window.render();
}

// ========================================================
// 7. MINI BOT 3TG AI ASSISTANT (ON-SCREEN CONTEXT READING)
// ========================================================
export function togglePomoAiContext(checked) {
  pomodoroState.aiReadScreenContext = Boolean(checked);
  if (window.showToast) {
    window.showToast(checked ? "👀 Đã bật quyền đọc tài liệu trên màn hình cho AI!" : "🔒 Đã tắt quyền đọc tài liệu trên màn hình của AI.");
  }
}

export function togglePomoSidebar() {
  pomodoroState.sidebarOpen = !pomodoroState.sidebarOpen;
  try {
    localStorage.setItem("pomo_sidebar_open", String(pomodoroState.sidebarOpen));
  } catch {}
  if (window.render) window.render();
  setTimeout(() => initPomoResizers(), 40);
}

export function togglePomoAiDock(event) {
  if (event) {
    try {
      event.preventDefault();
      event.stopPropagation();
    } catch {}
  }
  pomodoroState.aiDockOpen = !pomodoroState.aiDockOpen;
  try {
    localStorage.setItem("pomo_ai_dock_open", String(pomodoroState.aiDockOpen));
  } catch {}

  const dock = document.getElementById("pomo-ai-dock");
  const rightResizer = document.getElementById("pomo-right-resizer");
  const reopenPill = document.getElementById("pomo-ai-reopen-pill");

  if (dock) {
    dock.classList.toggle("collapsed", !pomodoroState.aiDockOpen);
    dock.classList.toggle("open", pomodoroState.aiDockOpen);
    const toggleBtn = dock.querySelector(".btn-dock-toggle");
    if (toggleBtn) {
      toggleBtn.innerHTML = pomodoroState.aiDockOpen ? '➔' : '◀';
      toggleBtn.title = pomodoroState.aiDockOpen ? "Thu gọn Cố vấn AI" : "Mở rộng Cố vấn AI";
    }
  }

  if (rightResizer) {
    rightResizer.style.display = pomodoroState.aiDockOpen ? "" : "none";
  }

  if (reopenPill) {
    reopenPill.style.display = pomodoroState.aiDockOpen ? "none" : "flex";
  }

  setTimeout(() => initPomoResizers(), 40);
}

export async function triggerAddPomoFiles() {
  if (window.electronAPI && typeof window.electronAPI.openStudyFiles === "function") {
    try {
      const filesData = await window.electronAPI.openStudyFiles();
      if (Array.isArray(filesData) && filesData.length > 0) {
        const fileList = filesData.map(f => {
          const binary = atob(f.base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          let mime = "application/octet-stream";
          const ext = (f.ext || (f.name.includes(".") ? f.name.slice(f.name.lastIndexOf(".")) : "")).toLowerCase();
          if (ext === ".pdf") mime = "application/pdf";
          else if (ext === ".png") mime = "image/png";
          else if (ext === ".jpg" || ext === ".jpeg") mime = "image/jpeg";
          else if (ext === ".webp") mime = "image/webp";
          else if (ext === ".mp4") mime = "video/mp4";
          else if (ext === ".mp3") mime = "audio/mp3";
          return new File([bytes], f.name, { type: mime });
        });
        await addMultipleLocalFiles(fileList);
        return;
      }
    } catch (err) {
      console.warn("triggerAddPomoFiles electron error:", err);
    }
  }

  // Universal DOM fallback:
  let input = document.getElementById("pomo-hidden-file-input");
  if (!input) {
    input = document.createElement("input");
    input.id = "pomo-hidden-file-input";
    input.type = "file";
    input.multiple = true;
    input.style.display = "none";
    input.onchange = (e) => {
      if (e.target.files && e.target.files.length) {
        addMultipleLocalFiles(Array.from(e.target.files));
      }
      e.target.value = "";
    };
    document.body.appendChild(input);
  }
  input.click();
}

export function initPomoResizers() {
  const leftResizer = document.getElementById("pomo-left-resizer");
  const rightResizer = document.getElementById("pomo-right-resizer");
  const room = document.querySelector(".pomodoro-active-room");
  if (!room) return;

  if (leftResizer && !leftResizer._bound) {
    leftResizer._bound = true;
    const onStart = (e) => {
      e.preventDefault();
      closePomodoroPlaylist();
      leftResizer.classList.add("is-dragging");
      document.body.classList.add("pomo-is-resizing");
      const startX = e.clientX || (e.touches && e.touches[0].clientX);
      const startW = pomodoroState.sidebarWidth || 260;
      let rafId = null;
      let pendingW = startW;

      const onMove = (ev) => {
        const curX = ev.clientX || (ev.touches && ev.touches[0].clientX);
        const delta = curX - startX;
        pendingW = Math.max(180, Math.min(480, startW + delta));
        if (!rafId) {
          rafId = requestAnimationFrame(() => {
            rafId = null;
            pomodoroState.sidebarWidth = pendingW;
            room.style.setProperty("--pomo-sidebar-width", pendingW + "px");
          });
        }
      };

      const onEnd = () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        pomodoroState.sidebarWidth = pendingW;
        room.style.setProperty("--pomo-sidebar-width", pendingW + "px");
        leftResizer.classList.remove("is-dragging");
        document.body.classList.remove("pomo-is-resizing");
        try {
          localStorage.setItem("pomo_sidebar_w", String(pomodoroState.sidebarWidth));
        } catch {}
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onEnd);
        window.removeEventListener("touchmove", onMove);
        window.removeEventListener("touchend", onEnd);
      };

      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("mouseup", onEnd);
      window.addEventListener("touchmove", onMove, { passive: true });
      window.addEventListener("touchend", onEnd);
    };

    leftResizer.addEventListener("mousedown", onStart);
    leftResizer.addEventListener("touchstart", onStart, { passive: false });
  }

  if (rightResizer && !rightResizer._bound) {
    rightResizer._bound = true;
    const onStart = (e) => {
      e.preventDefault();
      closePomodoroPlaylist();
      rightResizer.classList.add("is-dragging");
      document.body.classList.add("pomo-is-resizing");
      const startX = e.clientX || (e.touches && e.touches[0].clientX);
      const startW = pomodoroState.aiDockWidth || 360;
      let rafId = null;
      let pendingW = startW;

      const onMove = (ev) => {
        const curX = ev.clientX || (ev.touches && ev.touches[0].clientX);
        const delta = startX - curX;
        pendingW = Math.max(260, Math.min(680, startW + delta));
        if (!rafId) {
          rafId = requestAnimationFrame(() => {
            rafId = null;
            pomodoroState.aiDockWidth = pendingW;
            room.style.setProperty("--pomo-ai-width", pendingW + "px");
          });
        }
      };

      const onEnd = () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        pomodoroState.aiDockWidth = pendingW;
        room.style.setProperty("--pomo-ai-width", pendingW + "px");
        rightResizer.classList.remove("is-dragging");
        document.body.classList.remove("pomo-is-resizing");
        try {
          localStorage.setItem("pomo_ai_w", String(pomodoroState.aiDockWidth));
        } catch {}
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onEnd);
        window.removeEventListener("touchmove", onMove);
        window.removeEventListener("touchend", onEnd);
      };

      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("mouseup", onEnd);
      window.addEventListener("touchmove", onMove, { passive: true });
      window.addEventListener("touchend", onEnd);
    };

    rightResizer.addEventListener("mousedown", onStart);
    rightResizer.addEventListener("touchstart", onStart, { passive: false });
  }
}

export async function askPomodoroAi(customPrompt = null) {
  const prompt = customPrompt || pomodoroState.aiInput;
  const pastedImg = pomodoroState.pastedImage;
  if ((!prompt || !prompt.trim()) && !pastedImg) return;
  if (pomodoroState.isAskingAi) return;

  const userQuestion = prompt && prompt.trim() ? prompt.trim() : (pastedImg ? "Hãy giải chi tiết bài tập/nội dung trong hình ảnh này giúp mình nhé!" : "");
  pomodoroState.isAskingAi = true;

  // Lưu tin nhắn người dùng (kèm ảnh nếu có dán qua Ctrl+V)
  pomodoroState.aiChatHistory.push({
    sender: "user",
    text: userQuestion,
    image: pastedImg ? pastedImg.previewUrl : null
  });
  pomodoroState.aiInput = "";
  pomodoroState.pastedImage = null;
  const inputEl = document.getElementById("pomo-ai-text-input");
  if (inputEl) {
    inputEl.value = "";
  }
  renderPomoPastedImageBadge();
  renderPomodoroAiMessages();

  let contextDoc = "";
  const attachments = [];
  const activeDoc = pomodoroState.docs.find(d => d.id === pomodoroState.activeDocId);

  // 1. Nếu có ảnh dán từ Clipboard (Ctrl + V): gửi ảnh đính kèm để AI phân tích trực quan
  if (pastedImg) {
    attachments.push({
      name: pastedImg.name || "Pasted Image.png",
      type: pastedImg.type || "image/png",
      data: pastedImg.data
    });
  }

  // 2. Nếu tùy chọn "Đọc tài liệu trên màn hình" được bật:
  if (pomodoroState.aiReadScreenContext && activeDoc) {
    const rawContent = activeDoc.extractedText || activeDoc.content || "";
    if (activeDoc.type === "image" && !pastedImg) {
      // Nếu màn hình đang mở ảnh tài liệu và người dùng chưa dán ảnh khác: tự động gửi ảnh này cho AI
      if (typeof activeDoc.content === "string" && activeDoc.content.startsWith("data:")) {
        const commaIdx = activeDoc.content.indexOf(",");
        const base64 = commaIdx !== -1 ? activeDoc.content.slice(commaIdx + 1) : "";
        let mime = "image/png";
        const mimeMatch = activeDoc.content.match(/^data:([^;]+);/);
        if (mimeMatch) mime = mimeMatch[1];
        attachments.push({
          name: activeDoc.name,
          type: mime,
          data: base64
        });
        contextDoc = `\n\n[HÌNH ẢNH ĐANG MỞ TRÊN MÀN HÌNH - "${activeDoc.name}"]: Hãy nhìn hình ảnh đính kèm và phân tích, giải đáp chi tiết cho người học.`;
      } else {
        contextDoc = `\n\n[HÌNH ẢNH TRÊN MÀN HÌNH]: Người học đang xem ảnh/sơ đồ "${activeDoc.name}".`;
      }
    } else if (activeDoc.type === "pdf") {
      const pdfText = activeDoc.extractedText ? activeDoc.extractedText.slice(0, 6000) : "";
      contextDoc = `\n\n[NGỮ CẢNH GIÁO TRÌNH/ĐỀ THI PDF ĐANG MỞ TRÊN MÀN HÌNH - "${activeDoc.name} - Trang ${activeDoc.currentPage || 1}"]:${pdfText ? '\n' + pdfText : '\n(Tài liệu PDF đề thi/bài học đang mở trên màn hình)'}\n[HÃY HƯỚNG DẪN CHI TIẾT TỪNG BƯỚC, GIẢI CÔNG THỨC TOÁN HỌC HOẶC KHÁI NIỆM TRONG BÀI NÀY DỄ HIỂU NHẤT]`;
      
      // Chụp trực tiếp canvas trang PDF hiện tại gửi cho Groq Multimodal Vision (Qwen2.5-VL)
      if (!pastedImg) {
        try {
          const pageCanvas = document.getElementById(`pdf-canvas-${activeDoc.id}-${activeDoc.currentPage || 1}`) 
                          || document.querySelector(`#pomo-pdf-pages-${activeDoc.id} canvas`);
          if (pageCanvas) {
            const dataUrl = pageCanvas.toDataURL("image/jpeg", 0.85);
            const commaIdx = dataUrl.indexOf(",");
            const b64 = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl;
            attachments.push({
              name: `${activeDoc.name} (Trang ${activeDoc.currentPage || 1}).jpg`,
              type: "image/jpeg",
              data: b64
            });
            contextDoc += `\n[ẢNH CHỤP TRỰC TIẾP TRANG ${activeDoc.currentPage || 1} ĐƯỢC ĐÍNH KÈM]: Hãy nhìn ảnh đính kèm để xem chính xác các biểu thức toán học, sơ đồ và đề bài.`;
          }
        } catch (cErr) {
          console.warn("Canvas capture error for PDF:", cErr);
        }
      }
    } else if (activeDoc.type === "pptx" || activeDoc.type === "ppt") {
      contextDoc = `\n\n[NGỮ CẢNH BÀI THUYẾT TRÌNH POWERPOINT ĐANG MỞ TRÊN MÀN HÌNH - "${activeDoc.name}"]:\n${rawContent.slice(0, 5000)}\n[HÃY TẬP TRUNG GIẢI ĐÁP, GIẢNG GIẢI CÁC SLIDE TRÊN DỄ HIỂU NHẤT]`;
    } else if (activeDoc.type === "docx" || activeDoc.type === "doc") {
      contextDoc = `\n\n[NGỮ CẢNH TÀI LIỆU SOẠN THẢO WORD ĐANG MỞ TRÊN MÀN HÌNH - "${activeDoc.name}"]:\n${rawContent.slice(0, 5000)}\n[HÃY GIẢI ĐÁP THEO NỘI DUNG TÀI LIỆU TRÊN]`;
    } else if (activeDoc.type === "code") {
      contextDoc = `\n\n[NGỮ CẢNH SOURCE CODE ĐANG MỞ TRÊN MÀN HÌNH - "${activeDoc.name}"]:\n\`\`\`\n${rawContent.slice(0, 5000)}\n\`\`\`\n[HÃY GIẢI THÍCH THUẬT TOÁN, TÌM LỖI HOẶC TỐI ƯU ĐOẠN CODE NÀY NẾU ĐƯỢC HỎI]`;
    } else if (activeDoc.type === "text" || activeDoc.type === "note") {
      contextDoc = `\n\n[NGỮ CẢNH BÀI HỌC/GHI CHÚ ĐANG MỞ TRÊN MÀN HÌNH - "${activeDoc.name}"]:\n${rawContent.slice(0, 5000)}\n[HÃY GIẢI ĐÁP, HƯỚNG DẪN CHI TIẾT THEO TÀI LIỆU TRÊN]`;
    } else if (activeDoc.type === "video" || activeDoc.type === "audio") {
      contextDoc = `\n\n[NGỮ CẢNH]: Người học đang nghe/xem bài giảng "${activeDoc.name}".`;
    }
  }

  const formattingSystemRule = `\n\n[HƯỚNG DẪN ĐỊNH DẠNG CỦA BOT 3TG]:
1. Tuyệt đối KHÔNG viết thành 1 khối văn bản dính liền! Chia bài giải thành các bước rõ ràng: ">> **Bước 1**:", ">> **Bước 2**:", ">> **Mẹo nhớ**:".
2. Mọi công thức toán học BẮT BUỘC dùng LaTeX đặt trong $...$ (cùng dòng) hoặc $$...$$ (đứng riêng một dòng), ví dụ: $\\frac{\\partial f}{\\partial x}$, $\\iint_D 6(x+2y)\\,dA$, $$\\int_{-1}^{1} f(x)\\,dx$$.
3. Giải thích súc tích, dễ nhớ cho sinh viên ôn thi.`;

  try {
    const userId = (window.state && window.state.profile && (window.state.profile.user_id || window.state.profile.id)) || "";
    const customHeaders = {};
    if (typeof window.computeAiClientSignature === "function" && userId) {
      try {
        customHeaders["x-3tg-client-sig"] = await window.computeAiClientSignature(userId);
      } catch {}
    }
    const customKey = localStorage.getItem("custom_groq_key") || localStorage.getItem("custom_deepseek_key") || "";
    const customBaseUrl = localStorage.getItem("custom_ai_base_url") || "";
    const res = await callApi("/api/chat", {
      method: "POST",
      headers: customHeaders,
      body: {
        message: userQuestion + contextDoc + formattingSystemRule,
        attachments: attachments.length ? attachments : undefined,
        apiKey: customKey || undefined,
        baseUrl: customBaseUrl || undefined
      }
    });

    const reply = res?.reply || res?.message || "Thỏ Bảy Màu đã nắm được kiến thức bài này! Cố lên nhé bạn!";
    pomodoroState.aiChatHistory.push({ sender: "bot", text: reply });
  } catch (err) {
    pomodoroState.aiChatHistory.push({
      sender: "bot",
      text: `> 💡 **Trợ giảng 3TG Offline (Chế độ Ngoại tuyến):**\n\n` +
            `Đã ghi nhận câu hỏi của bạn: *"${userQuestion}"*.\n\n` +
            `>> **Gợi ý học tập trọng tâm**:\n` +
            `- **Bước 1**: Nắm vững định nghĩa và mục tiêu bài học trước khi bắt đầu giải.\n` +
            `- **Bước 2**: Thực hiện từng bước biến đổi tuần tự theo công thức và tài liệu đính kèm.\n` +
            `- **Mẹo**: Bạn có thể dùng phím chụp màn hình (PrtSc) rồi bấm Ctrl+V vào ô chat để gửi ảnh đề bài cho Bot giải!`
    });
  } finally {
    pomodoroState.isAskingAi = false;
    renderPomodoroAiMessages();
  }
}

export function renderPomoPastedImageBadge() {
  const badge = document.getElementById("pomo-ai-pasted-badge");
  const thumb = document.getElementById("pomo-pasted-thumb-img");
  const name = document.getElementById("pomo-pasted-name-text");
  if (!badge) return;
  if (pomodoroState.pastedImage) {
    badge.style.display = "flex";
    if (thumb) thumb.src = pomodoroState.pastedImage.previewUrl;
    if (name) name.textContent = pomodoroState.pastedImage.name;
  } else {
    badge.style.display = "none";
  }
}
if (typeof window !== "undefined") {
  window.renderPomoPastedImageBadge = renderPomoPastedImageBadge;
  window.removePomoPastedImage = function() {
    pomodoroState.pastedImage = null;
    renderPomoPastedImageBadge();
  };
}

function renderPomodoroAiMessages() {
  const container = document.getElementById("pomo-ai-chat-thread");
  if (!container) return;

  container.innerHTML = pomodoroState.aiChatHistory.map(m => `
    <div class="pomo-ai-bubble ${m.sender}">
      <div class="pomo-ai-avatar">${m.sender === "bot" ? "🐰" : "👤"}</div>
      <div class="pomo-ai-text">
        ${m.image ? `<img src="${m.image}" class="pomo-ai-chat-bubble-image" onclick="window.open(this.src)" title="Bấm để xem ảnh gốc" />` : ''}
        ${m.sender === "bot" ? formatPomodoroAiText(m.text) : renderPlainWithMath(m.text, { variant: "pomo" })}
        ${m.sender === "bot" ? `
          <button type="button" class="pomo-ai-save-btn" onclick="window.savePomoAiToNotes('${encodeURIComponent(m.text)}')">
            💾 Lưu vào Sổ tay
          </button>
        ` : ""}
      </div>
    </div>
  `).join("") + (pomodoroState.isAskingAi ? `
    <div class="pomo-ai-bubble bot typing">
      <div class="pomo-ai-avatar">🐰</div>
      <div class="pomo-ai-text">Thỏ Bảy Màu đang phân tích đề và giải bài... ✨</div>
    </div>
  ` : "");

  container.scrollTop = container.scrollHeight;
}

window.savePomoAiToNotes = async function(encodedText) {
  const text = decodeURIComponent(encodedText);
  try {
    await callApi("/api/notes", {
      method: "POST",
      body: {
        title: "Ghi chú từ Phòng Pomodoro",
        content: text,
        subjectId: null
      }
    });
    if (window.showToast) window.showToast("Đã lưu lời giải vào Sổ tay ghi chú thành công! ✨");
  } catch (err) {
    if (window.showToast) window.showToast("Không thể lưu ghi chú: " + err.message, true);
  }
};

// ========================================================
// 8. RENDERERS (LOBBY & WORKSPACE)
// ========================================================

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function updatePomodoroDisplayInDom() {
  // Update in central clock if present
  const timeEl = document.getElementById("pomo-clock-time");
  if (timeEl) timeEl.textContent = formatTime(pomodoroState.remainingSeconds);

  const ringEl = document.getElementById("pomo-progress-ring-circle");
  if (ringEl) {
    const total = pomodoroState.mode === "focus" ? pomodoroState.focusDuration : pomodoroState.breakDuration;
    const progress = (total - pomodoroState.remainingSeconds) / total;
    const circumference = 2 * Math.PI * 110;
    const offset = circumference * (1 - progress);
    ringEl.style.strokeDashoffset = offset;
  }

  // Update in top collapsed widget if present
  const topDigits = document.getElementById("pomo-top-widget-digits");
  if (topDigits) topDigits.textContent = formatTime(pomodoroState.remainingSeconds);

  const topProgress = document.getElementById("pomo-top-progress-bar");
  if (topProgress) {
    const total = pomodoroState.mode === "focus" ? pomodoroState.focusDuration : pomodoroState.breakDuration;
    const pct = ((total - pomodoroState.remainingSeconds) / total) * 100;
    topProgress.style.width = `${pct}%`;
  }

  const pauseBtn = document.getElementById("pomo-pause-btn");
  if (pauseBtn) {
    pauseBtn.innerHTML = pomodoroState.isPaused ? "▶ Tiếp tục" : "⏸ Tạm dừng";
  }
  const topPauseBtn = document.getElementById("pomo-top-pause-btn");
  if (topPauseBtn) {
    topPauseBtn.innerHTML = pomodoroState.isPaused ? "▶" : "⏸";
  }
}

function updatePomodoroQuoteInDom() {
  const quoteEl = document.getElementById("pomo-rabbit-speech-bubble");
  if (quoteEl) {
    quoteEl.style.opacity = "0";
    setTimeout(() => {
      quoteEl.textContent = pomodoroState.currentQuote;
      quoteEl.style.opacity = "1";
    }, 200);
  }
}

function updatePomodoroModalsInDom() {
  const exitModal = document.getElementById("pomo-exit-confirm-modal");
  if (exitModal) exitModal.style.display = pomodoroState.showExitModal ? "flex" : "none";

  const celebModal = document.getElementById("pomo-celebration-modal");
  if (celebModal) celebModal.style.display = pomodoroState.showCelebrationModal ? "flex" : "none";
}

// Master Router
export function renderPomodoro() {
  // Đồng bộ cửa sổ máy tính fx-580 sau khi phòng học được render lại
  setTimeout(syncPomodoroCalculatorVisibility, 0);
  if (pomodoroState.active) {
    return renderPomodoroActiveRoom();
  }
  return renderPomodoroLobby();
}

// --- LOBBY SCREEN (Chọn nhiều file, chọn âm thanh, xem lịch sử) ---
function renderPomodoroLobby() {
  const notesList = (window.state && window.state.notes) || [];

  return `
    <div class="pomodoro-lobby-container">
      <!-- HERO HEADER -->
      <div class="pomodoro-hero-card">
        <div class="pomodoro-hero-content">
          <div class="pomodoro-badge-pill">🎧 STUDY WITH ME • CHẾ ĐỘ SIÊU TẬP TRUNG ZEN</div>
          <h1 class="pomodoro-title">Phòng học Pomodoro cùng Thỏ Bảy Màu</h1>
          <p class="pomodoro-subtitle">
            Cùng bạn bè ôn thi cuối kỳ, tập trung tuyệt đối không lướt điện thoại! Chu kỳ 25 phút học / 5 phút nghỉ, âm thanh Lofi & Cafe chill kích thích não bộ và nhận thưởng +50 XP & 30 💎 mỗi ca.
          </p>

          <!-- PEER STATUS BANNER (NHẤP ĐỂ SỔ RA DANH SÁCH BẠN HỌC) -->
          <div class="pomodoro-peers-banner" onclick="window.openPomodoroLearnersList()" style="cursor:pointer;" title="Nhấp để xem danh sách bạn học đang trong phòng 👥">
            <span class="pomodoro-live-dot"></span>
            <span class="pomodoro-peers-text">${safeEsc(pomodoroState.peerStatusText)}</span>
            <div class="pomodoro-peer-avatars">
              ${(pomodoroState.peers || []).slice(0, 5).map(p => {
                const initial = (p.name || 'H').charAt(0).toUpperCase();
                return `
                  <div class="peer-avatar-click-wrap" title="${safeEsc(p.name)}">
                    ${p.avatarUrl && !p.avatarUrl.startsWith('mascot:') ? `
                      <img src="${safeEsc(p.avatarUrl)}" class="peer-avatar-img" alt="${safeEsc(p.name)}">
                    ` : `
                      <span class="peer-avatar-letter">${safeEsc(initial)}</span>
                    `}
                  </div>
                `;
              }).join("")}
              ${pomodoroState.peersCount > 5 ? `<span class="peer-avatar-plus">+${pomodoroState.peersCount - 5}</span>` : ''}
              <span style="font-size:12px; margin-left:6px; color:#ff4b82; font-weight:800;">▾ Xem</span>
            </div>
          </div>
        </div>
        <div class="pomodoro-hero-mascot">
          ${renderThoBayMau({ state: THO_STATES.POMODORO_FOCUS, size: 210, speech: "Vào phòng học với tui nè! Không lướt TikTok nha!", speechDirection: "left" })}
        </div>
      </div>

      <!-- RULES ROW -->
      <div class="pomodoro-rules-card">
        <div class="rule-box">
          <div class="rule-icon">⏱️</div>
          <div class="rule-content">
            <strong>25 Phút Siêu Tập Trung</strong>
            <span>Khóa toàn màn hình & chặn phím thoát (Chế độ Kiosk Siêu Tập Trung) để chống sao nhãng.</span>
          </div>
        </div>
        <div class="rule-box">
          <div class="rule-icon">💎</div>
          <div class="rule-content">
            <strong>Thưởng +50 XP & 30 💎</strong>
            <span>Hoàn thành mỗi ca 25 phút nhận ngay phần thưởng lớn, tích lũy theo số ca (2 ca = 100 XP & 60 💎).</span>
          </div>
        </div>
        <div class="rule-box">
          <div class="rule-icon">🚪</div>
          <div class="rule-content">
            <strong>Thoát Khẩn Cấp (Ctrl + Q)</strong>
            <span>Nghỉ ngơi nhận thưởng trong 5 phút giải lao. Nếu bỏ cuộc giữa chừng 25 phút, ca hiện tại sẽ bị hủy bỏ.</span>
          </div>
        </div>
      </div>

      <!-- SETUP GRID -->
      <div class="pomodoro-setup-grid">
        <!-- LEFT: MULTI-FILE SELECTION -->
        <div class="pomodoro-setup-card">
          <div class="setup-card-header-row">
            <div>
              <h2 class="setup-card-title">📑 Tài liệu cần học (Thêm không giới hạn)</h2>
              <p class="setup-card-desc">Tải nhiều tài liệu hoặc chọn từ Sổ tay để xem ngay trên bàn học.</p>
            </div>
            <button type="button" class="btn-duo btn-duo-white" onclick="document.getElementById('pomo-multi-file-input').click()">
              ＋ Thêm tệp
            </button>
          </div>

          <!-- Hidden Multi-file input -->
          <input type="file" id="pomo-multi-file-input" style="display:none;" multiple accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md,.js,.py,.java,.cpp,.c,.cs,.html,.css,.json,.sql,.mp4,.webm,.mp3,.wav,.png,.jpg,.jpeg,.webp" onchange="window.handlePomoMultiFilesSelected(this)">

          <!-- Document List Box -->
          <div class="pomo-selected-docs-box">
            ${pomodoroState.docs.length > 0 ? `
              <div class="pomo-docs-chip-list">
                ${pomodoroState.docs.map(doc => {
                  const icon = doc.type === 'pdf' ? '📑' 
                    : (doc.type === 'pptx' || doc.type === 'ppt') ? '📊' 
                    : (doc.type === 'docx' || doc.type === 'doc') ? '📄' 
                    : doc.type === 'code' ? '💻' 
                    : doc.type === 'video' ? '🎬' 
                    : doc.type === 'audio' ? '🎧' 
                    : doc.type === 'image' ? '🖼️' 
                    : '📝';
                  return `
                    <div class="pomo-doc-badge ${doc.id === pomodoroState.activeDocId ? 'active' : ''}">
                      <span class="doc-badge-icon">${icon}</span>
                      <span class="doc-badge-name" title="${safeEsc(doc.name)}">${safeEsc(doc.name)}</span>
                      <button type="button" class="doc-badge-del" title="Xóa" onclick="window.removeDoc('${doc.id}', event)">✕</button>
                    </div>
                  `;
                }).join("")}
              </div>
            ` : `
              <div class="doc-upload-dropzone" onclick="document.getElementById('pomo-multi-file-input').click()">
                <div class="dropzone-icon">📁</div>
                <strong>Nhấp hoặc kéo thả nhiều tệp vào đây</strong>
                <span>Hỗ trợ PowerPoint (.pptx, .ppt), Word (.docx, .doc), PDF, Code (.js, .py, .java, .cpp...), Video (.mp4), Audio (.mp3), Ảnh & Văn bản (Thêm không giới hạn)</span>
              </div>
            `}
          </div>

          <div class="doc-or-divider"><span>HOẶC CHỌN TỪ SỔ TAY GHI CHÚ</span></div>

          <select class="form-input pomo-notes-select" onchange="if(this.value){ window.addNoteToDocs(this.value); this.value=''; }">
            <option value="">-- Chọn bài ghi chú từ Sổ tay 3TG --</option>
            ${notesList.map(n => `<option value="${n.id}">${safeEsc(n.title || 'Ghi chú không tên')}</option>`).join("")}
          </select>
        </div>

        <!-- RIGHT: AMBIENCE & BIG START BUTTON -->
        <div class="pomodoro-setup-card">
          <h2 class="setup-card-title">🎵 Âm thanh kích thích não bộ</h2>
          <p class="setup-card-desc">17 bài nhạc độc quyền chất lượng cao tải mượt mà dạng stream từng đoạn như YouTube.</p>

          <div class="ambience-chips-grid">
            <label class="ambience-chip-label">
              <input type="radio" name="pomo-ambience" value="lofi" ${pomodoroAudio.activeChannel === 'lofi' || pomodoroAudio.activeChannel === 'none' ? 'checked' : ''} onchange="window.pomodoroAudio.playChannel('lofi')">
              <div class="ambience-chip-card">
                <span class="chip-icon">🎧</span>
                <strong>Lofi Beats</strong>
                <small>CapzLock & The Way Life Goes</small>
              </div>
            </label>
            <label class="ambience-chip-label">
              <input type="radio" name="pomo-ambience" value="rain" ${pomodoroAudio.activeChannel === 'rain' ? 'checked' : ''} onchange="window.pomodoroAudio.playChannel('rain')">
              <div class="ambience-chip-card">
                <span class="chip-icon">🌧️</span>
                <strong>Mưa rơi & Piano</strong>
                <small>Rain & Piano, Pure Rain Ambient</small>
              </div>
            </label>
            <label class="ambience-chip-label">
              <input type="radio" name="pomo-ambience" value="brain" ${pomodoroAudio.activeChannel === 'brain' ? 'checked' : ''} onchange="window.pomodoroAudio.playChannel('brain')">
              <div class="ambience-chip-card">
                <span class="chip-icon">🧠</span>
                <strong>Sóng Não Alpha</strong>
                <small>Alpha Brain Focus & Hopecore</small>
              </div>
            </label>
            <label class="ambience-chip-label">
              <input type="radio" name="pomo-ambience" value="book" ${pomodoroAudio.activeChannel === 'book' ? 'checked' : ''} onchange="window.pomodoroAudio.playChannel('book')">
              <div class="ambience-chip-card">
                <span class="chip-icon">📖</span>
                <strong>ASMR Bút Viết</strong>
                <small>Writing Sound & Rừng Thiên Nhiên</small>
              </div>
            </label>
          </div>

          <!-- Starting Track Selector -->
          <div class="lobby-track-picker-row" style="margin-top: 14px; display:flex; align-items:center; gap:10px;">
            <span style="font-weight:800; font-size:12px; color:var(--ink-700);">Bài bắt đầu:</span>
            <select class="pomo-lobby-select" id="pomo-lobby-start-track" onchange="window.pomodoroAudio.playTrack(parseInt(this.value, 10), true)" style="flex:1; padding:7px 12px; border-radius:12px; border:1.5px solid var(--border-light, #e2e8f0); font-weight:700; font-size:12px; background:var(--bg-page, #f8fafc); color:var(--ink-800);">
              ${pomodoroAudio.playlist.map((t, idx) => `
                <option value="${idx}" ${pomodoroAudio.currentIndex === idx ? 'selected' : ''}>
                  ${t.icon} ${t.title} (${t.tag})
                </option>
              `).join("")}
            </select>
            <button type="button" class="btn-lobby-add-music" onclick="window.triggerAddLocalMusic()" title="Thêm file nhạc từ máy tính (MP3, WAV, FLAC...) phát offline">
              ＋ Thêm tệp
            </button>
          </div>

          <div class="volume-slider-row" style="margin-top: 12px;">
            <span>🔊 Âm lượng:</span>
            <input type="range" class="pomo-volume-range" min="0" max="1" step="0.05" value="${pomodoroAudio.volume}" oninput="window.pomodoroAudio.setVolume(this.value)">
            <span class="volume-value-text">${Math.round(pomodoroAudio.volume * 100)}%</span>
          </div>

          <!-- BIG START BUTTON -->
          <div class="pomo-start-action-wrap">
            <button type="button" class="btn-duo btn-duo-pink btn-pomo-start" onclick="window.startPomodoroSession()">
              🚀 BẮT ĐẦU HỌC TẬP (VÀO PHÒNG ZEN)
            </button>
            <small class="start-hint">Khi bấm, ứng dụng sẽ vào chế độ toàn màn hình và bật DND chống sao nhãng.</small>
          </div>
        </div>
      </div>

      <!-- STUDY STATS & RECENT HISTORY -->
      <div class="pomodoro-history-card">
        <h2 class="setup-card-title">📊 Lịch sử rèn luyện Pomodoro của bạn</h2>
        <div class="pomo-stats-row">
          <div class="pomo-stat-box">
            <span class="stat-number">${pomodoroState.totalFocusMinutes}</span>
            <span class="stat-label">Tổng phút tập trung</span>
          </div>
          <div class="pomo-stat-box">
            <span class="stat-number">${pomodoroState.totalCycles}</span>
            <span class="stat-label">Tổng số ca đã hoàn thành</span>
          </div>
          <div class="pomo-stat-box">
            <span class="stat-number">${pomodoroState.todayCycles}</span>
            <span class="stat-label">Ca hoàn thành hôm nay</span>
          </div>
          <div class="pomo-stat-box">
            <span class="stat-number">+${pomodoroState.totalCycles * 30} 💎</span>
            <span class="stat-label">Đá quý đã gặt hái</span>
          </div>
        </div>

        ${pomodoroState.history.length > 0 ? `
          <div class="pomo-history-table-wrap">
            <table class="pomo-history-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Tài liệu / Nội dung</th>
                  <th>Số ca</th>
                  <th>Thời lượng</th>
                  <th>Phần thưởng</th>
                </tr>
              </thead>
              <tbody>
                ${pomodoroState.history.map(s => `
                  <tr>
                    <td>${new Date(s.completed_at).toLocaleString('vi-VN')}</td>
                    <td><strong>${safeEsc(s.doc_name || 'Học tập trung tự do')}</strong></td>
                    <td><span class="cycle-pill">${s.cycles} ca</span></td>
                    <td>${s.focus_minutes} phút</td>
                    <td><span class="reward-pill">+${s.xp_reward} XP • +${s.gems_reward} 💎</span></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="pomo-history-empty">Chưa có phiên học nào. Hãy bắt đầu ca đầu tiên để gặt hái thành tích nhé! 🌸</div>
        `}
      </div>

      <!-- MODAL: DANH SÁCH BẠN HỌC ĐANG TRONG PHÒNG -->
      ${renderPomodoroLearnersModal()}
    </div>
  `;
}

// --- ACTIVE WORKSPACE SCREEN (3 CỘT: Trái Tabs tài liệu - Giữa Reader/Zen - Phải Tab AI, Góc trên Clock Widget) ---
function renderPomodoroActiveRoom() {
  const isFocus = pomodoroState.mode === "focus";
  const isBuiltinNote = pomodoroState.activeDocId === "__pomo_builtin_note__";
  const activeDoc = isBuiltinNote ? null : pomodoroState.docs.find(d => d.id === pomodoroState.activeDocId);
  const notesList = (window.state && window.state.notes) || [];
  const currentTrack = pomodoroAudio.getCurrentTrack();
  const activeMobileTab = pomodoroState.mobileTab || (isBuiltinNote ? "note" : (activeDoc ? "docs" : "clock"));

  setTimeout(() => initPomoResizers(), 40);

  return `
    <div class="pomodoro-active-room ${isFocus ? 'focus-phase' : 'break-phase'}" data-mobile-tab="${activeMobileTab}" style="--pomo-sidebar-width:${pomodoroState.sidebarWidth}px; --pomo-ai-width:${pomodoroState.aiDockWidth}px;">
      <!-- TOP STATUS BAR WITH COLLAPSIBLE CLOCK WIDGET -->
      <header class="pomo-room-topbar">
        <div class="pomo-topbar-left">
          <div class="pomo-room-badge">
            <span class="pomo-live-dot"></span>
            <span>${isFocus ? '🎯 CA #' + (pomodoroState.completedCycles + 1) : '☕ GIỜ NGHỈ GIẢI LAO'}</span>
          </div>

          <!-- COMPACT COLLAPSIBLE POMODORO CLOCK WIDGET ON TOP -->
          <div class="pomo-top-clock-widget">
            <span class="widget-phase-label">${isFocus ? 'TẬP TRUNG' : 'GIẢI LAO'}</span>
            <strong class="widget-time-digits" id="pomo-top-widget-digits">${formatTime(pomodoroState.remainingSeconds)}</strong>
            <button type="button" class="widget-pause-btn" id="pomo-top-pause-btn" onclick="window.pausePomodoroTimer()" title="Tạm dừng / Tiếp tục">
              ${pomodoroState.isPaused ? '▶' : '⏸'}
            </button>
            <div class="widget-progress-track">
              <div class="widget-progress-fill" id="pomo-top-progress-bar" 
                   style="width: ${(( (isFocus ? 1500 : 300) - pomodoroState.remainingSeconds ) / (isFocus ? 1500 : 300)) * 100}%;"></div>
            </div>
          </div>

          <!-- CHỈ VIẾT VẬY THÔI KÈM TÍCH XANH LÁ HOẠT ĐỘNG - KHÔNG CHO NHẤP XEM HỒ SƠ ĐỂ TRÁNH XAO NHÃNG -->
          <div class="pomo-topbar-peers-static">
            <span class="pomo-active-green-badge">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="display:block;">
                <circle cx="8" cy="8" r="7.5" fill="#22c55e" stroke="#16a34a" stroke-width="1"/>
                <path d="M4.5 8L7 10.5L11.5 5.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="pomo-peers-static-text">Đang có ${Math.max(1, pomodoroState.peersCount)} bạn cùng học tập trung</span>
          </div>
        </div>

        <!-- 2. CENTER: FLOATING GLASS DOCK - YOUTUBE-STYLE MUSIC PLAYER -->
        <div class="pomo-topbar-center-player">
          <!-- Controls row: Prev, Play/Pause, Next with SVG icons & glowing hover -->
          <div class="pomo-music-controls-row">
            <button type="button" class="pomo-music-ctrl-btn" onclick="window.pomodoroAudio.prev()" title="Bài trước (Prev)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            <button type="button" class="pomo-music-play-btn" id="pomo-music-play-btn" onclick="window.pomodoroAudio.togglePlay()" title="${pomodoroAudio.isPlaying ? 'Tạm dừng nhạc' : 'Phát nhạc'}">
              ${pomodoroAudio.isPlaying 
                ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>' 
                : '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'}
            </button>
            <button type="button" class="pomo-music-ctrl-btn" onclick="window.pomodoroAudio.next()" title="Bài tiếp theo (Next)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
          </div>

          <!-- Title row: Equalizer wave + Song title + Time pill badge -->
          <div class="pomo-music-title-wrap">
            <div class="pomo-center-soundwave ${pomodoroAudio.isPlaying ? 'playing' : ''}" id="pomo-center-eq" title="Đang phát nhạc">
              <span></span><span></span><span></span>
            </div>
            <span class="pomo-music-title" id="pomo-current-music-title" title="${safeEsc(currentTrack.title)} - ${safeEsc(currentTrack.artist)}">
              ${currentTrack.icon} ${safeEsc(currentTrack.title)}
            </span>
            <span class="pomo-player-time-badge">
              <span id="pomo-audio-time-current">00:00</span> / <span id="pomo-audio-time-duration">--:--</span>
            </span>
          </div>
        </div>

        <!-- 3. RIGHT: SCIENTIFIC CALCULATOR, PLAYLIST DROPDOWN BUTTON & EXIT -->
        <div class="pomo-topbar-right">
          <!-- FLOATING SCIENTIFIC CALCULATOR (CASIO FX-580 STYLE) -->
          <button type="button" class="btn-pomo-calc-pill" id="pomo-calc-toggle-btn" onclick="window.togglePomodoroCalculator()" title="Máy tính khoa học fx-580: kéo thả, thu nhỏ, phóng to, đóng">
            <span class="calc-pill-icon">🧮</span>
            <span class="calc-pill-label">Máy tính</span>
          </button>

          <!-- PLAYLIST DROPDOWN TRIGGER BUTTON & ANCHOR (PURPLE CAPSULE PILL AS DRAWN BY USER) -->
          <div class="pomo-playlist-anchor">
            <button type="button" class="btn-pomo-playlist-pill ${pomodoroState.showPlaylistDropdown ? 'active' : ''}" id="pomo-playlist-btn" onclick="window.togglePomodoroPlaylist(event)" title="Mở danh sách 17 bài nhạc Pomodoro">
              <span>Danh sách nhạc</span>
              <span class="pill-arrow">▾</span>
            </button>
            ${renderPomodoroPlaylistPopover()}
          </div>

          <!-- EMERGENCY EXIT BUTTON (Ctrl + Q) -->
          <button type="button" class="btn-duo btn-pomo-exit-btn" onclick="window.openPomodoroExitConfirm()" title="Nhấn Ctrl + Q để thoát">
            🚪 Thoát (Ctrl + Q)
          </button>
        </div>

        <!-- 4. FULL-WIDTH TIMELINE SEEKBAR (SPANS HORIZONTALLY ACROSS BOTTOM OF HEADER) -->
        <div class="pomo-timeline-seekbar-wrap" id="pomo-audio-seekbar-wrap" 
             onmousedown="window.startPomoAudioScrub(event)" 
             onmousemove="window.hoverPomoAudioScrub(event)" 
             onmouseleave="window.leavePomoAudioScrub(event)" 
             title="Nhấp hoặc kéo để tua nhạc">
          <div class="pomo-timeline-bg">
            <div class="pomo-audio-buffer-bar" id="pomo-audio-buffer-bar" style="width: 0%;"></div>
            <div class="pomo-audio-played-bar" id="pomo-audio-played-bar" style="width: 0%;"></div>
          </div>
          <div class="pomo-audio-scrub-thumb" id="pomo-audio-scrub-thumb" style="left: 0%;"></div>
          <div class="pomo-timeline-time-tooltip" id="pomo-timeline-tooltip">00:00</div>
        </div>
      </header>

      <!-- MOBILE WORKSPACE TABS (CHỈ HIỆN TRÊN ĐIỆN THOẠI) -->
      <nav class="pomo-mobile-tabs" aria-label="Chuyển khu vực phòng học">
        <button type="button" class="pomo-mobile-tab-btn ${activeMobileTab === 'clock' ? 'active' : ''}" onclick="window.setPomoMobileTab('clock')">⏱️ Đồng hồ</button>
        <button type="button" class="pomo-mobile-tab-btn ${activeMobileTab === 'docs' ? 'active' : ''}" onclick="window.setPomoMobileTab('docs')">📁 Tài liệu (${pomodoroState.docs.length})</button>
        <button type="button" class="pomo-mobile-tab-btn ${activeMobileTab === 'note' ? 'active' : ''}" onclick="window.setPomoMobileTab('note')">📝 Sổ tay</button>
        <button type="button" class="pomo-mobile-tab-btn ${activeMobileTab === 'ai' ? 'active' : ''}" onclick="window.setPomoMobileTab('ai')">✨ Bot AI</button>
      </nav>

      <!-- 3-PANE WORKSPACE: LEFT (DOC TABS) | CENTER (DOCUMENT VIEWER / FULL CLOCK) | RIGHT (AI ASSISTANT TAB) -->
      <main class="pomo-room-body">
        
        <!-- ==================== CỘT TRÁI: TAB DANH SÁCH FILE TÀI LIỆU ==================== -->
        <aside class="pomo-files-sidebar ${pomodoroState.sidebarOpen ? '' : 'collapsed'}" id="pomo-files-sidebar">
          <div class="pomo-sidebar-header">
            <strong class="sidebar-title">📁 TÀI LIỆU (${pomodoroState.docs.length})</strong>
            <div class="pomo-sidebar-header-btns">
              <button type="button" class="btn-sidebar-add-inline" onclick="window.triggerAddPomoFiles()" title="Thêm tài liệu trực tiếp vào phòng">＋ Thêm tệp</button>
              <button type="button" class="btn-sidebar-toggle-inline" onclick="window.togglePomoSidebar()" title="Thu gọn danh sách tài liệu">❮</button>
            </div>
          </div>

          <!-- Quick Notes Dropdown & Built-in Notebook in sidebar -->
          <div class="sidebar-note-selector-wrap">
            <select class="sidebar-note-select" onchange="if(this.value){ window.addNoteToDocs(this.value); this.value=''; }">
              <option value="">＋ Thêm từ Sổ tay ghi chú...</option>
              ${notesList.map(n => `<option value="${n.id}">${safeEsc(n.title || 'Ghi chú không tên')}</option>`).join("")}
            </select>
            <button type="button" class="btn-pomo-open-note-inline ${isBuiltinNote ? 'active' : ''}" onclick="window.openPomodoroBuiltinNote()">
              📝 Mở Sổ tay nhanh
            </button>
          </div>

          <!-- List of Added Documents -->
          <div class="pomo-files-list">
            ${pomodoroState.docs.map(doc => {
              const icon = doc.type === 'pdf' ? '📑' 
                : (doc.type === 'pptx' || doc.type === 'ppt') ? '📊' 
                : (doc.type === 'docx' || doc.type === 'doc') ? '📄' 
                : doc.type === 'code' ? '💻' 
                : doc.type === 'video' ? '🎬' 
                : doc.type === 'audio' ? '🎧' 
                : doc.type === 'image' ? '🖼️' 
                : '📝';
              return `
                <div class="pomo-file-item ${doc.id === pomodoroState.activeDocId ? 'active' : ''}" onclick="window.setActiveDoc('${doc.id}')">
                  <span class="file-item-icon">${icon}</span>
                  <span class="file-item-name" title="${safeEsc(doc.name)}">${safeEsc(doc.name)}</span>
                  <button type="button" class="file-item-close" title="Gỡ file" onclick="window.removeDoc('${doc.id}', event)">✕</button>
                </div>
              `;
            }).join("")}

            ${pomodoroState.docs.length === 0 ? `
              <div class="pomo-files-empty">
                Chưa có tài liệu nào.<br>Bấm <b>＋ Thêm tệp</b> hoặc chọn Sổ tay ở trên để nạp bài học!
              </div>
            ` : ""}
          </div>

          <!-- View Mode Toggle Button -->
          <div class="pomo-sidebar-bottom">
            <button type="button" class="btn-zen-mode-toggle ${!pomodoroState.activeDocId ? 'active' : ''}" onclick="window.closeActiveDoc()">
              ${!pomodoroState.activeDocId ? '🎯 Đang ở Chế độ Zen' : '🧘 Thu gọn sang Chế độ Zen'}
            </button>
          </div>
        </aside>

        <!-- RESIZER CỘT TRÁI (KÉO CHỈNH ĐỘ RỘNG DANH SÁCH FILE) -->
        <div class="pomo-resizer left-resizer" id="pomo-left-resizer" title="Kéo ngang để chỉnh độ rộng danh sách tài liệu"></div>

        <!-- ==================== Ở GIỮA: MỞ FILE, SỔ TAY NHANH HOẶC ĐỒNG HỒ ZEN ==================== -->
        <section class="pomo-center-stage ${(activeDoc || isBuiltinNote) ? 'doc-mode' : 'clock-mode'}">
          ${!pomodoroState.sidebarOpen ? `
            <button type="button" class="pomo-sidebar-reopen-pill" onclick="window.togglePomoSidebar()" title="Mở lại danh sách tài liệu học">
              📁 Tài liệu ❯
            </button>
          ` : ""}

          ${!pomodoroState.aiDockOpen ? `
            <button type="button" class="pomo-ai-reopen-pill" id="pomo-ai-reopen-pill" onclick="window.togglePomoAiDock(event)" title="Mở lại Cố vấn Bot 3TG AI">
              ❮ ✨ Cố vấn AI
            </button>
          ` : ""}

          ${isBuiltinNote ? `
            <!-- SỔ TAY GHI CHÚ SẴN CÓ NGAY TRONG PHÒNG HỌC POMODORO -->
            <div class="pomo-builtin-note-wrap">
              <div class="pomo-builtin-note-card note-paper-${safeEsc(pomodoroState.builtinNote.paper || 'lined')}">
                <div class="pomo-builtin-note-toolbar">
                  <select onchange="window.selectPomodoroBuiltinNote(this.value)" title="Chọn ghi chú có sẵn hoặc tạo mới">
                    <option value="" ${!pomodoroState.builtinNote.id ? 'selected' : ''}>＋ Tạo ghi chú mới</option>
                    ${notesList.map(n => `<option value="${n.id}" ${String(pomodoroState.builtinNote.id) === String(n.id) ? 'selected' : ''}>${safeEsc(n.title || 'Ghi chú không tên')}</option>`).join("")}
                  </select>
                  <select onchange="window.pomodoroState.builtinNote.paper = this.value; window.render();" title="Kiểu giấy">
                    <option value="lined" ${pomodoroState.builtinNote.paper === 'lined' ? 'selected' : ''}>Giấy kẻ ngang</option>
                    <option value="grid" ${pomodoroState.builtinNote.paper === 'grid' ? 'selected' : ''}>Giấy ô li</option>
                    <option value="dotted" ${pomodoroState.builtinNote.paper === 'dotted' ? 'selected' : ''}>Giấy chấm bi</option>
                    <option value="plain" ${pomodoroState.builtinNote.paper === 'plain' ? 'selected' : ''}>Giấy trơn</option>
                  </select>
                  <button type="button" class="btn-viewer-tool" style="margin-left:auto;" onclick="window.closeActiveDoc()">Đóng Sổ tay ✕</button>
                </div>
                <input type="text" class="pomo-builtin-note-title" placeholder="Tiêu đề ghi chú..." value="${safeEsc(pomodoroState.builtinNote.title)}" oninput="window.pomodoroState.builtinNote.title = this.value">
                <textarea class="note-content-input pomo-builtin-note-editor" placeholder="Viết nhanh công thức, ý chính bài học ngay tại đây..." oninput="window.pomodoroState.builtinNote.text = this.value">${safeEsc(pomodoroState.builtinNote.text)}</textarea>
                <div class="pomo-builtin-note-footer">
                  <span style="font-size:12px;color:#795363;font-weight:700;">Ghi chú sẽ lưu trực tiếp vào Sổ tay của bạn</span>
                  <button type="button" class="btn-duo btn-duo-pink" onclick="window.savePomodoroBuiltinNote()">💾 Lưu vào Sổ tay</button>
                </div>
              </div>
            </div>
          ` : activeDoc ? `
            <!-- KHI ĐANG MỞ FILE TÀI LIỆU: TRÌNH ĐỌC TRUNG TÂM (CÓ HỖ TRỢ ZOOM TRACKPAD & CUỘN CHUỘT) -->
            <div class="pomo-doc-full-viewer" id="pomo-doc-full-viewer">
              <div class="doc-viewer-header">
                <div class="doc-viewer-title-row">
                  <span class="doc-badge-pill">${activeDoc.type.toUpperCase()}</span>
                  <strong class="doc-active-name">${safeEsc(activeDoc.name)}</strong>
                </div>
                <div class="doc-viewer-actions">
                  <!-- ZOOM CONTROLS (Trackpad 2-finger pinch, Ctrl + cuộn chuột, hoặc bấm +/-) -->
                  <div class="doc-zoom-toolbar" id="pomo-doc-zoom-toolbar" onwheel="window.handleDocZoomToolbarWheel(event)" title="Phóng to / thu nhỏ tài liệu: Chụm/vuốt 2 ngón trackpad, Ctrl + cuộn chuột hoặc bấm +/-">
                    <button type="button" class="btn-zoom-step" onclick="window.changeDocZoom(-0.1)" title="Thu nhỏ (Ctrl -)">−</button>
                    <button type="button" class="btn-zoom-badge" id="pomo-doc-zoom-badge" onclick="window.resetDocZoom()" title="Bấm để về 100% (Ctrl 0)">
                      ${Math.round((pomodoroState.docZoom || 1) * 100)}%
                    </button>
                    <button type="button" class="btn-zoom-step" onclick="window.changeDocZoom(0.1)" title="Phóng to (Ctrl +)">＋</button>
                    <button type="button" class="btn-zoom-reset" id="pomo-doc-zoom-reset" onclick="window.resetDocZoom()" title="Đặt lại 100%" style="${(pomodoroState.docZoom || 1) === 1 ? 'opacity: 0.4; pointer-events: none;' : ''}">↺</button>
                  </div>

                  <button type="button" class="btn-viewer-tool" onclick="window.triggerAddPomoFiles()" title="Thêm tài liệu mới">
                    ＋ Thêm tệp
                  </button>
                  <button type="button" class="btn-viewer-tool" onclick="window.closeActiveDoc()" title="Đóng file xem đồng hồ">
                    Đóng tài liệu ✕
                  </button>
                </div>
              </div>
              <div class="doc-viewer-scrollable-body ${activeDoc.type === 'pdf' ? 'pdf-mode' : ''}" id="pomo-doc-scroll-body">
                <div class="pomo-doc-zoom-content" id="pomo-doc-zoom-content" style="zoom: ${pomodoroState.docZoom || 1};">
                  ${renderDocContent(activeDoc)}
                </div>
              </div>
            </div>
          ` : `
            <!-- KHI CHƯA MỞ FILE: ĐỒNG HỒ POMODORO & MASCOT THỎ BẢY MÀU CHÍNH DIỆN -->
            <div class="pomo-zen-clock-arena">
              <!-- SPEECH BUBBLE -->
              <div class="pomo-mascot-speech-wrap">
                <div class="pomo-rabbit-speech-bubble" id="pomo-rabbit-speech-bubble">
                  ${pomodoroState.currentQuote}
                </div>
              </div>

              <!-- MASCOT ANIMATION (PHÓNG TO RÕ NÉT TRONG CHẾ ĐỘ ZEN) -->
              <div class="pomo-mascot-stage">
                ${isFocus 
                  ? renderThoBayMau({ state: THO_STATES.POMODORO_FOCUS, size: 340 }) 
                  : renderThoBayMau({ state: THO_STATES.POMODORO_BREAK, size: 340 })}
              </div>

              <!-- CIRCULAR SVG POMODORO TIMER -->
              <div class="pomo-clock-wrap">
                <svg class="pomo-clock-svg" viewBox="0 0 260 260">
                  <circle class="pomo-clock-track" cx="130" cy="130" r="110" />
                  <circle class="pomo-clock-fill" id="pomo-progress-ring-circle" cx="130" cy="130" r="110" 
                          style="stroke-dasharray: ${2 * Math.PI * 110}; stroke-dashoffset: ${2 * Math.PI * 110 * (1 - ((isFocus ? 1500 : 300) - pomodoroState.remainingSeconds) / (isFocus ? 1500 : 300))};" />
                </svg>
                <div class="pomo-clock-center">
                  <span class="pomo-clock-phase">${isFocus ? 'SIÊU TẬP TRUNG' : 'GIẢI LAO THẢ LỎNG'}</span>
                  <span class="pomo-clock-digits" id="pomo-clock-time">${formatTime(pomodoroState.remainingSeconds)}</span>
                  <span class="pomo-clock-reward">${isFocus ? '+50 XP • +30 💎' : 'Đang tính điểm ca ' + pomodoroState.completedCycles}</span>
                </div>
              </div>

              <!-- TIMER ACTIONS -->
              <div class="pomo-clock-actions">
                <button type="button" class="btn-duo btn-duo-white" id="pomo-pause-btn" onclick="window.pausePomodoroTimer()">
                  ${pomodoroState.isPaused ? '▶ Tiếp tục' : '⏸ Tạm dừng'}
                </button>
                ${!isFocus ? `
                  <button type="button" class="btn-duo btn-duo-pink" onclick="window.finishBreakAndContinue()">
                    ⚡ Vào ca tiếp theo ngay
                  </button>
                  <button type="button" class="btn-duo btn-duo-white" onclick="window.finishBreakAndExit()">
                    ✅ Nghỉ ngơi & Lưu kết quả
                  </button>
                ` : ""}
              </div>
            </div>
          `}
        </section>

        <!-- RESIZER CỘT PHẢI (KÉO CHỈNH ĐỘ RỘNG TAB CỐ VẤN AI) -->
        <div class="pomo-resizer right-resizer" id="pomo-right-resizer" style="display: ${pomodoroState.aiDockOpen ? '' : 'none'};" title="Kéo ngang để chỉnh độ rộng Cố vấn AI"></div>

        <!-- ==================== BÊN PHẢI: TAB CỐ VẤN BOT 3TG AI ĐỌC NGỮ CẢNH ==================== -->
        <aside class="pomo-ai-dock ${pomodoroState.aiDockOpen ? 'open' : 'collapsed'}" id="pomo-ai-dock">
          <!-- Handle hiển thị khi dock thu gọn: Click vào là mở ra -->
          <div class="pomo-ai-collapsed-handle" onclick="window.togglePomoAiDock(event)" title="Bấm để mở lại Cố vấn Bot 3TG AI">
            <span class="collapsed-handle-icon">✨</span>
            <span class="collapsed-handle-text">CỐ VẤN BOT 3TG AI</span>
            <span class="collapsed-handle-arrow">◀</span>
          </div>

          <!-- Dock Header -->
          <div class="pomo-ai-dock-header">
            <div class="ai-dock-title-wrap">
              <span class="ai-dock-sparkle">✨</span>
              <strong>Cố vấn Bot 3TG AI</strong>
            </div>
            <button type="button" class="btn-dock-toggle" onclick="window.togglePomoAiDock(event)" title="Thu nhỏ / Mở rộng Tab AI">
              ${pomodoroState.aiDockOpen ? '➔' : '◀'}
            </button>
          </div>

          <!-- CONTEXT READING TOGGLE SWITCH -->
          <div class="pomo-ai-context-bar">
            <label class="pomo-ai-context-label" title="Khi bật, AI sẽ tự động đọc nội dung tài liệu hoặc ảnh đang mở ở màn hình giữa">
              <input type="checkbox" ${pomodoroState.aiReadScreenContext ? 'checked' : ''} onchange="window.togglePomoAiContext(this.checked)">
              <span class="pomo-switch-slider"></span>
              <span class="context-switch-text">👀 Đọc tài liệu trên màn hình</span>
            </label>
            ${activeDoc ? `
              <span class="context-active-indicator" title="Đang liên kết: ${safeEsc(activeDoc.name)}">
                ● Đang xem: ${safeEsc(activeDoc.name.slice(0, 16))}${activeDoc.name.length > 16 ? '...' : ''} ${activeDoc.type === 'image' ? '📸' : activeDoc.type === 'pdf' ? '📑' : '📄'}
              </span>
            ` : `<span class="context-idle-indicator">Chưa mở file</span>`}
          </div>

          <!-- Quick Prompts Chips -->
          <div class="pomo-ai-quick-prompts">
            <button type="button" class="ai-chip" onclick="window.askPomodoroAi('Tóm tắt 3 ý trọng tâm của tài liệu trên màn hình')">📌 Tóm tắt 3 ý</button>
            <button type="button" class="ai-chip" onclick="window.askPomodoroAi('Giải thích công thức và kiến thức trên màn hình bằng ví dụ dễ hiểu')">💡 Giải thích dễ hiểu</button>
            <button type="button" class="ai-chip" onclick="window.askPomodoroAi('Tạo 3 câu hỏi trắc nghiệm kèm giải thích dựa vào bài này')">🎯 3 câu trắc nghiệm</button>
          </div>

          <!-- Chat Thread -->
          <div class="pomo-ai-chat-thread" id="pomo-ai-chat-thread">
            ${pomodoroState.aiChatHistory.map(m => `
              <div class="pomo-ai-bubble ${m.sender}">
                <div class="pomo-ai-avatar">${m.sender === "bot" ? "🐰" : "👤"}</div>
                <div class="pomo-ai-text">
                  ${m.sender === "bot" ? formatPomodoroAiText(m.text) : renderPlainWithMath(m.text, { variant: "pomo" })}
                  ${m.sender === "bot" ? `
                    <button type="button" class="pomo-ai-save-btn" onclick="window.savePomoAiToNotes('${encodeURIComponent(m.text)}')">
                      💾 Lưu vào Sổ tay
                    </button>
                  ` : ""}
                </div>
              </div>
            `).join("")}
          </div>

          <!-- Chat Composer Footer -->
          <div class="pomo-ai-footer">
            <div class="pomo-ai-pasted-badge" id="pomo-ai-pasted-badge" style="display: ${pomodoroState.pastedImage ? 'flex' : 'none'};">
              <img src="${pomodoroState.pastedImage?.previewUrl || ''}" class="pomo-pasted-thumb" id="pomo-pasted-thumb-img" />
              <span class="pomo-pasted-name" id="pomo-pasted-name-text">${safeEsc(pomodoroState.pastedImage?.name || 'Ảnh đính kèm')}</span>
              <button type="button" class="pomo-pasted-remove" onclick="window.removePomoPastedImage()" title="Xóa ảnh đính kèm">✕</button>
            </div>
            <div class="pomo-ai-footer-input-row">
              <input type="text" class="pomo-ai-input" id="pomo-ai-text-input" placeholder="Hỏi Bot 3TG hoặc dán ảnh (Ctrl + V)..." value="${pomodoroState.aiInput}" 
                     oninput="window.pomodoroState.aiInput = this.value" onkeydown="if(event.key === 'Enter') window.askPomodoroAi()">
              <button type="button" class="pomo-ai-send-btn" onclick="window.askPomodoroAi()">Gửi ➔</button>
            </div>
          </div>
        </aside>

      </main>

      <!-- MODAL: CONFIRM EMERGENCY EXIT (Ctrl + Q) -->
      <div class="pomo-modal-backdrop" id="pomo-exit-confirm-modal" style="display: ${pomodoroState.showExitModal ? 'flex' : 'none'};">
        <div class="pomo-modal-box">
          <div class="pomo-modal-icon">⚠️</div>
          <h3 class="pomo-modal-title">Từ bỏ ca học hiện tại?</h3>
          <p class="pomo-modal-desc">
            ${isFocus 
              ? `Bạn đang trong ca học 25 phút. Nếu thoát bây giờ, ca này sẽ <strong>KHÔNG ĐƯỢC NHẬN THƯỞNG</strong> (+50 XP và 30 💎). Các ca đã hoàn thành trước đó vẫn được lưu an toàn.` 
              : `Bạn đang trong giờ nghỉ giải lao 5 phút. Bạn có thể thoát an toàn và nhận đầy đủ phần thưởng!`}
          </p>
          <div class="pomo-modal-actions">
            <button type="button" class="btn-duo btn-duo-pink" onclick="window.closePomodoroExitConfirm()">
              ${isFocus ? 'Tiếp tục học 🎯' : 'Ở lại thư giãn 🌸'}
            </button>
            <button type="button" class="btn-duo btn-pomo-danger-btn" onclick="window.abandonPomodoroSession()">
              ${isFocus ? 'Từ bỏ ca này & Thoát (Ctrl + Q)' : 'Thoát an toàn & Về trang chủ'}
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: FOCUS CYCLE COMPLETED CELEBRATION -->
      <div class="pomo-modal-backdrop" id="pomo-celebration-modal" style="display: ${pomodoroState.showCelebrationModal ? 'flex' : 'none'};">
        <div class="pomo-modal-box celebration">
          <div class="pomo-modal-icon">🎉</div>
          <h3 class="pomo-modal-title">CHÚC MỪNG HOÀN THÀNH CA #${pomodoroState.completedCycles}!</h3>
          <p class="pomo-modal-desc">
            Bạn đã xuất sắc tập trung suốt 25 phút không rời mắt! Phần thưởng xứng đáng đã được cộng vào tài khoản:
          </p>
          <div class="pomo-rewards-banner">
            <div class="reward-tag">+${pomodoroState.lastRewardXp} XP ⭐</div>
            <div class="reward-tag">+${pomodoroState.lastRewardGems} 💎 Đá quý</div>
          </div>
          <div class="pomo-modal-actions">
            <button type="button" class="btn-duo btn-duo-pink" onclick="window.finishBreakAndContinue()">
              Nghỉ 5 phút rồi vào ca tiếp theo ☕
            </button>
            <button type="button" class="btn-duo btn-duo-white" onclick="window.finishBreakAndExit()">
              Nghỉ ngơi & Thoát phòng 🚪
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: DANH SÁCH BẠN HỌC ĐANG TRONG PHÒNG -->
      ${renderPomodoroLearnersModal()}

      <!-- WEB FOCUS LOCK SHIELD (HIỆN KHI THOÁT TOÀN MÀN HÌNH / CHUYỂN TAB TRÊN TRÌNH DUYỆT) -->
      <div class="pomo-web-lock-overlay" id="pomo-web-lock-overlay" style="display: ${pomodoroState.webFocusInterrupted ? 'flex' : 'none'};">
        <div class="pomo-web-lock-card">
          <div class="pomo-web-lock-icon">⛔</div>
          <h3>Đã dừng đồng hồ &amp; Hủy thưởng ca này!</h3>
          <p>
            Bạn vừa nhấn phím chức năng thoát toàn màn hình hoặc rời màn hình học (lần #<strong id="pomo-web-lock-warn-count">${pomodoroState.webFocusWarnings}</strong>).
            Đồng hồ đã <strong>DỪNG CHẠY NGAY LẬP TỨC</strong> và ca này <strong>KHÔNG ĐƯỢC NHẬN THƯỞNG (+50 XP / +30 💎)</strong>.
          </p>
          <div class="pomo-web-lock-actions">
            <button type="button" class="btn-duo btn-duo-pink" onclick="window.resumeWebFocusLock()">
              🎯 Quay lại toàn màn hình (Học tiếp không thưởng)
            </button>
            <button type="button" class="btn-duo btn-duo-white" onclick="window.abandonPomodoroSession()">
              🚪 Thoát phòng học ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderDocContent(doc) {
  if (!doc) return `<div class="pomo-doc-empty">Chưa có tài liệu</div>`;

  if (doc.type === "image") {
    return `
      <div class="pomo-doc-img-wrap">
        <img src="${doc.content}" alt="${safeEsc(doc.name)}" class="pomo-doc-image">
      </div>
    `;
  }

  if (doc.type === "pdf") {
    return `
      <div class="pomo-doc-pdf-wrap" id="pomo-pdf-wrap-${doc.id}">
        <div class="pomo-pdf-toolbar">
          <div class="pomo-pdf-nav">
            <button type="button" class="btn-pdf-nav" onclick="window.changePdfPage('${doc.id}', -1)" title="Trang trước (Phím ←)">◀ Trang trước</button>
            <span class="pomo-pdf-page-indicator">
              Trang <input type="number" class="pomo-pdf-page-input" id="pomo-pdf-page-input-${doc.id}" min="1" max="${doc.numPages || 1}" value="${doc.currentPage || 1}" onchange="window.goToPdfPage('${doc.id}', this.value)"> / <span id="pomo-pdf-total-pages-${doc.id}">${doc.numPages || 1}</span>
            </span>
            <button type="button" class="btn-pdf-nav" onclick="window.changePdfPage('${doc.id}', 1)" title="Trang sau (Phím →)">Trang sau ▶</button>
          </div>
          <div class="pomo-pdf-tools">
            <button type="button" class="btn-pdf-tool ${doc.viewMode === 'single' ? '' : 'active'}" onclick="window.togglePdfViewMode('${doc.id}')" id="btn-pdf-mode-${doc.id}" title="Chuyển chế độ: Từng trang / Cuộn liên tục tất cả các trang">
              ${doc.viewMode === 'single' ? '📄 Chế độ từng trang' : '📜 Chế độ cuộn liên tục'}
            </button>
            <button type="button" class="btn-pdf-tool" onclick="window.openDocInNewTab('${doc.id}')" title="Mở file gốc">
              ↗ Mở ngoài
            </button>
          </div>
        </div>
        <div class="pomo-pdf-viewport" id="pomo-pdf-viewport-${doc.id}">
          <div class="pomo-pdf-canvas-container" id="pomo-pdf-pages-${doc.id}">
            <div class="pomo-pdf-loading">
              <span class="pomo-spinner"></span> Đang nạp và kết xuất PDF chuẩn nét...
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (doc.type === "video") {
    return `
      <div class="pomo-doc-media-wrap">
        <video src="${doc.content}" controls autoplay class="pomo-center-video"></video>
      </div>
    `;
  }

  if (doc.type === "audio") {
    return `
      <div class="pomo-doc-audio-wrap">
        <div class="audio-banner">
          <div class="audio-banner-icon">🎧</div>
          <div class="audio-banner-info">
            <strong>${safeEsc(doc.name)}</strong>
            <span>Tệp bài giảng âm thanh đang phát</span>
          </div>
        </div>
        <audio src="${doc.content}" controls autoplay class="pomo-center-audio"></audio>
      </div>
    `;
  }

  if (doc.type === "note") {
    return renderNoteDocView(doc);
  }

  if (doc.type === "docx" || doc.type === "doc") {
    return `
      <div class="pomo-doc-office-wrap">
        <div class="office-doc-card">
          <div class="office-doc-header">
            <div class="office-icon">📄</div>
            <div class="office-header-meta">
              <strong>${safeEsc(doc.name)}</strong>
              <span>Tài liệu văn bản Word (.docx)</span>
            </div>
            <button type="button" class="btn-viewer-tool" style="margin-left:auto;" onclick="window.askPomodoroAi('Tóm tắt 3 ý trọng tâm của tài liệu trên màn hình')">
              🤖 Nhờ AI tóm tắt tài liệu
            </button>
          </div>
          <div class="office-doc-body">
            ${doc.htmlContent || formatOfficeTextToHtml(doc.extractedText || doc.content)}
          </div>
        </div>
      </div>
    `;
  }

  if (doc.type === "pptx" || doc.type === "ppt") {
    return `
      <div class="pomo-doc-office-wrap">
        <div class="office-doc-card">
          <div class="office-doc-header">
            <div class="office-icon">📊</div>
            <div class="office-header-meta">
              <strong>${safeEsc(doc.name)}</strong>
              <span>Bài thuyết trình PowerPoint (.pptx)</span>
            </div>
            <button type="button" class="btn-viewer-tool" style="margin-left:auto;" onclick="window.askPomodoroAi('Tóm tắt 3 ý trọng tâm của các slide trên màn hình')">
              🤖 Nhờ AI tóm tắt bài thuyết trình
            </button>
          </div>
          <div class="office-doc-body">
            ${doc.htmlContent || formatOfficeTextToHtml(doc.extractedText || doc.content)}
          </div>
        </div>
      </div>
    `;
  }

  if (doc.type === "code") {
    return `
      <div class="pomo-doc-code-wrap">
        <div class="code-viewer-bar">
          <span class="code-lang-pill">💻 ${safeEsc(doc.name)}</span>
          <button type="button" class="btn-copy-code" onclick="navigator.clipboard.writeText(decodeURIComponent('${encodeURIComponent(doc.content)}')).then(() => window.showToast('Đã sao chép mã nguồn! ✨'))">
            📋 Sao chép mã
          </button>
        </div>
        <pre class="pomo-doc-code-pre"><code>${safeEsc(doc.content)}</code></pre>
      </div>
    `;
  }

  return `
    <div class="pomo-doc-text-wrap">
      <pre class="pomo-doc-pre">${safeEsc(doc.content)}</pre>
    </div>
  `;
}

// ========================================================
// 8. ADVANCED PDF.JS RENDERING & PAGE CONTROLS
// ========================================================
export async function initPdfDocViewer(doc) {
  if (!doc || doc.type !== "pdf") return;
  const container = document.getElementById("pomo-pdf-pages-" + doc.id);
  if (!container) return;

  // Fallback nếu window.pdfjsLib chưa nạp kịp
  if (typeof window === "undefined" || !window.pdfjsLib) {
    container.innerHTML = `
      <embed src="${doc.blobUrl || doc.content}#toolbar=0&navpanes=0&scrollbar=1" type="application/pdf" class="pomo-pdf-iframe" style="width:100%;height:100%;min-height:calc(100vh - 180px);border:none;" />
    `;
    return;
  }

  try {
    try {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.js";
    } catch {}

    if (!doc._pdfDoc) {
      let source = null;
      if (doc.blobUrl) {
        source = { url: doc.blobUrl };
      } else if (doc.arrayBuffer && doc.arrayBuffer.byteLength > 0) {
        source = { data: new Uint8Array(doc.arrayBuffer.slice(0)) };
      } else if (doc.file) {
        try {
          const ab = await doc.file.arrayBuffer();
          source = { data: new Uint8Array(ab) };
        } catch {
          source = { url: doc.blobUrl || doc.content };
        }
      } else {
        source = { url: doc.blobUrl || doc.content };
      }

      const loadingTask = window.pdfjsLib.getDocument(source);
      doc._pdfDoc = await loadingTask.promise;
      doc.numPages = doc._pdfDoc.numPages;

      // Trích xuất text cho AI
      if (!doc.extractedText) {
        try {
          const textPieces = [];
          const maxP = Math.min(doc.numPages, 30);
          for (let p = 1; p <= maxP; p++) {
            const pg = await doc._pdfDoc.getPage(p);
            const tc = await pg.getTextContent();
            const str = tc.items.map(it => it.str).join(" ");
            if (str.trim()) textPieces.push(`[Trang ${p}]:\n${str}`);
          }
          doc.extractedText = textPieces.join("\n\n");
        } catch (tErr) {
          console.warn("PDF text extract error:", tErr);
        }
      }
    }

    const totalEl = document.getElementById("pomo-pdf-total-pages-" + doc.id);
    if (totalEl) totalEl.textContent = String(doc.numPages);
    const inputEl = document.getElementById("pomo-pdf-page-input-" + doc.id);
    if (inputEl) {
      inputEl.max = String(doc.numPages);
      inputEl.value = String(doc.currentPage || 1);
    }

    const isSingle = doc.viewMode === "single";
    const pagesToRender = isSingle ? [doc.currentPage || 1] : Array.from({ length: doc.numPages }, (_, i) => i + 1);

    container.innerHTML = "";

    for (const pageNum of pagesToRender) {
      const pageBox = document.createElement("div");
      pageBox.className = "pomo-pdf-page-box";
      pageBox.id = `pdf-page-box-${doc.id}-${pageNum}`;

      const badge = document.createElement("div");
      badge.className = "pomo-pdf-page-badge";
      badge.textContent = `Trang ${pageNum} / ${doc.numPages}`;
      pageBox.appendChild(badge);

      const canvas = document.createElement("canvas");
      canvas.className = "pomo-pdf-canvas";
      canvas.id = `pdf-canvas-${doc.id}-${pageNum}`;
      pageBox.appendChild(canvas);

      container.appendChild(pageBox);

      const page = await doc._pdfDoc.getPage(pageNum);
      const zoom = (pomodoroState.docZoom || 1) * 1.35;
      const viewport = page.getViewport({ scale: zoom });
      const pixelRatio = window.devicePixelRatio || 1;

      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = Math.floor(viewport.width) + "px";
      canvas.style.height = Math.floor(viewport.height) + "px";

      const ctx = canvas.getContext("2d");
      const transform = pixelRatio !== 1 ? [pixelRatio, 0, 0, pixelRatio, 0, 0] : null;
      await page.render({ canvasContext: ctx, transform, viewport }).promise;
    }
  } catch (err) {
    console.warn("[PDF Render Error]:", err);
    container.innerHTML = `
      <embed src="${doc.blobUrl || doc.content}#toolbar=0&navpanes=0&scrollbar=1" type="application/pdf" class="pomo-pdf-iframe" style="width:100%;height:100%;min-height:calc(100vh - 180px);border:none;" />
    `;
  }
}

if (typeof window !== "undefined") {
  window.initPdfDocViewer = initPdfDocViewer;
  window.changePdfPage = function(docId, delta) {
    const doc = pomodoroState.docs.find(d => d.id === docId);
    if (!doc || !doc.numPages) return;
    const target = Math.max(1, Math.min(doc.numPages, (doc.currentPage || 1) + delta));
    if (target === doc.currentPage) return;
    doc.currentPage = target;
    const inputEl = document.getElementById("pomo-pdf-page-input-" + doc.id);
    if (inputEl) inputEl.value = String(target);
    if (doc.viewMode === "single") {
      initPdfDocViewer(doc);
    } else {
      const el = document.getElementById(`pdf-page-box-${doc.id}-${target}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  window.goToPdfPage = function(docId, val) {
    const doc = pomodoroState.docs.find(d => d.id === docId);
    if (!doc || !doc.numPages) return;
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    const target = Math.max(1, Math.min(doc.numPages, num));
    doc.currentPage = target;
    if (doc.viewMode === "single") {
      initPdfDocViewer(doc);
    } else {
      const el = document.getElementById(`pdf-page-box-${doc.id}-${target}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  window.togglePdfViewMode = function(docId) {
    const doc = pomodoroState.docs.find(d => d.id === docId);
    if (!doc) return;
    doc.viewMode = doc.viewMode === "single" ? "continuous" : "single";
    const btn = document.getElementById("btn-pdf-mode-" + doc.id);
    if (btn) {
      btn.textContent = doc.viewMode === "single" ? "📄 Chế độ từng trang" : "📜 Chế độ cuộn liên tục";
      btn.classList.toggle("active", doc.viewMode !== "single");
    }
    initPdfDocViewer(doc);
  };

  window.openDocInNewTab = function(docId) {
    const doc = pomodoroState.docs.find(d => d.id === docId);
    if (!doc) return;
    if (doc.blobUrl || doc.content) {
      window.open(doc.blobUrl || doc.content, "_blank");
    }
  };
}


// ========================================================
// 9. PLAYLIST POPOVER & AUDIO INTERACTION HELPERS
// ========================================================
export function renderPomodoroPlaylistPopover() {
  const currentTrack = pomodoroAudio.getCurrentTrack();
  const search = (pomodoroState.playlistSearch || "").trim().toLowerCase();
  const cat = pomodoroState.playlistCategory || "all";

  const localTracksCount = pomodoroAudio.playlist.filter(t => t.isLocal).length;
  const categories = [
    { key: "all", label: `Tất cả (${pomodoroAudio.playlist.length})` },
    ...(localTracksCount > 0 ? [{ key: "local", label: `Của bạn (${localTracksCount}) 🎵` }] : []),
    { key: "lofi", label: "Lofi Beat" },
    { key: "rain", label: "Tiếng Mưa" },
    { key: "brain", label: "Sóng Não" },
    { key: "asmr", label: "ASMR" },
    { key: "ambient", label: "Ambient" }
  ];

  const filtered = pomodoroAudio.playlist.filter(t => {
    if (cat !== "all") {
      if (cat === "local" && !t.isLocal) return false;
      if (cat === "lofi" && !t.tag.toLowerCase().includes("lofi")) return false;
      if (cat === "rain" && !t.tag.toLowerCase().includes("mưa")) return false;
      if (cat === "brain" && !t.tag.toLowerCase().includes("não")) return false;
      if (cat === "asmr" && !t.tag.toLowerCase().includes("asmr")) return false;
      if (cat === "ambient" && !t.tag.toLowerCase().includes("ambient") && !t.tag.toLowerCase().includes("chill")) return false;
    }
    if (search) {
      const matchTitle = t.title.toLowerCase().includes(search);
      const matchArtist = t.artist.toLowerCase().includes(search);
      const matchTag = t.tag.toLowerCase().includes(search);
      return matchTitle || matchArtist || matchTag;
    }
    return true;
  });

  return `
    <div class="pomo-playlist-popover ${pomodoroState.showPlaylistDropdown ? 'active' : ''}" id="pomo-playlist-popover" onclick="event.stopPropagation()">
      <div class="pomo-playlist-header">
        <div class="pomo-playlist-header-title">
          <span class="pomo-playlist-header-icon">🎧</span>
          <strong>Nhạc Pomodoro</strong>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button type="button" class="btn-pomo-add-local-music" onclick="window.triggerAddLocalMusic()" title="Thêm file nhạc MP3, WAV, FLAC từ máy tính để nghe hoàn toàn offline (0 byte upload)">
            ＋ Thêm nhạc tệp
          </button>
          <button type="button" class="pomo-playlist-close-x" onclick="window.closePomodoroPlaylist()" title="Đóng">✕</button>
        </div>
      </div>

      <!-- Search bar -->
      <div class="pomo-playlist-search-wrap">
        <input type="text" class="pomo-playlist-search-input" placeholder="🔍 Tìm kiếm bài hát, thể loại..." value="${safeEsc(pomodoroState.playlistSearch || '')}" oninput="window.setPomodoroPlaylistSearch(this.value)">
      </div>

      <!-- Category Filter Pills -->
      <div class="pomo-playlist-cat-chips">
        ${categories.map(c => `
          <button type="button" class="pomo-cat-chip ${cat === c.key ? 'active' : ''}" onclick="window.setPomodoroPlaylistCategory('${c.key}')">
            ${c.label}
          </button>
        `).join("")}
      </div>

      <!-- Tracks List -->
      <div class="pomo-playlist-tracks-list">
        ${filtered.length > 0 ? filtered.map((track) => {
          const globalIdx = pomodoroAudio.playlist.findIndex(t => t.id === track.id);
          const isCurrent = currentTrack && currentTrack.id === track.id;
          const isPlayingThis = isCurrent && pomodoroAudio.isPlaying;
          return `
            <div class="pomo-playlist-track-row ${isCurrent ? 'active-track' : ''}" data-track-id="${track.id}" onclick="window.pomodoroAudio.playTrack(${globalIdx}, true)">
              <div class="track-row-left">
                <span class="track-row-icon">${track.icon}</span>
                <div class="track-row-info">
                  <div class="track-row-name-wrap">
                    <strong class="track-row-title">${safeEsc(track.title)}</strong>
                    ${isCurrent ? `
                      <span class="pomo-soundwave" style="${isPlayingThis ? 'display:inline-flex;' : 'display:none;'}">
                        <span></span><span></span><span></span>
                      </span>
                    ` : ""}
                  </div>
                  <span class="track-row-artist">${safeEsc(track.artist)}</span>
                </div>
              </div>
              <div class="track-row-right">
                <span class="track-row-tag">${safeEsc(track.tag)}</span>
                <span class="track-row-size">${track.sizeMb || (track.isLocal ? 'Offline' : '2.5 MB')}</span>
                <button type="button" class="pomo-track-play-btn" title="${isPlayingThis ? 'Tạm dừng' : 'Phát'}" onclick="event.stopPropagation(); ${isCurrent ? 'window.pomodoroAudio.togglePlay()' : `window.pomodoroAudio.playTrack(${globalIdx}, true)`}">
                  <span class="pomo-track-play-icon">${isPlayingThis ? '⏸' : '▶'}</span>
                </button>
                ${track.isLocal ? `
                  <button type="button" class="pomo-track-del-btn" title="Xóa bài hát khỏi danh sách" onclick="event.stopPropagation(); window.removeCustomAudioTrack('${track.id}')">
                    ✕
                  </button>
                ` : ""}
              </div>
            </div>
          `;
        }).join("") : `
          <div class="pomo-playlist-empty">Không tìm thấy bài hát nào phù hợp 🔍</div>
        `}
      </div>

      <!-- Footer: Volume Slider -->
      <div class="pomo-playlist-footer">
        <div class="pomo-footer-volume-row">
          <span class="volume-icon" onclick="window.pomodoroAudio.setVolume(pomodoroAudio.volume > 0 ? 0 : 0.65)" style="cursor:pointer;" title="Bật/Tắt âm">
            ${pomodoroAudio.volume === 0 ? '🔇' : (pomodoroAudio.volume < 0.5 ? '🔉' : '🔊')}
          </span>
          <input type="range" class="pomo-volume-range" min="0" max="1" step="0.05" value="${pomodoroAudio.volume}" oninput="window.pomodoroAudio.setVolume(this.value)" title="Điều chỉnh âm lượng">
          <span class="volume-value-text">${Math.round(pomodoroAudio.volume * 100)}%</span>
        </div>
      </div>
    </div>
  `;
}

export function togglePomodoroPlaylist(e) {
  if (e) e.stopPropagation();
  pomodoroState.showPlaylistDropdown = !pomodoroState.showPlaylistDropdown;
  const popover = document.getElementById("pomo-playlist-popover");
  const btn = document.getElementById("pomo-playlist-btn");
  if (popover) popover.classList.toggle("active", pomodoroState.showPlaylistDropdown);
  if (btn) btn.classList.toggle("active", pomodoroState.showPlaylistDropdown);
}

export function closePomodoroPlaylist() {
  pomodoroState.showPlaylistDropdown = false;
  const popover = document.getElementById("pomo-playlist-popover");
  const btn = document.getElementById("pomo-playlist-btn");
  if (popover) popover.classList.remove("active");
  if (btn) btn.classList.remove("active");
}

export function handlePomoAudioSeek(e) {
  const bar = document.getElementById("pomo-audio-seekbar-wrap");
  if (!bar || !pomodoroAudio.audio || !pomodoroAudio.audio.duration) return;
  const rect = bar.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const pct = Math.max(0, Math.min(1, clickX / rect.width));
  pomodoroAudio.seek(pct * pomodoroAudio.audio.duration);
  pomodoroAudio.updateTimeProgress();
}

export function startPomoAudioScrub(e) {
  if (!pomodoroAudio.audio || !pomodoroAudio.audio.duration) return;
  pomodoroAudio.isScrubbing = true;
  const bar = document.getElementById("pomo-audio-seekbar-wrap");
  if (!bar) return;

  const seekAtEvent = (ev) => {
    const rect = bar.getBoundingClientRect();
    const clickX = ev.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = pct * pomodoroAudio.audio.duration;

    const playedEl = document.getElementById("pomo-audio-played-bar");
    const thumbEl = document.getElementById("pomo-audio-scrub-thumb");
    const curEl = document.getElementById("pomo-audio-time-current");
    if (playedEl) playedEl.style.width = (pct * 100) + "%";
    if (thumbEl) thumbEl.style.left = (pct * 100) + "%";
    if (curEl) curEl.textContent = formatAudioTime(targetTime);

    return targetTime;
  };

  const initialTime = seekAtEvent(e);
  pomodoroAudio.seek(initialTime);

  const onMouseMove = (ev) => {
    seekAtEvent(ev);
  };

  const onMouseUp = (ev) => {
    const finalTime = seekAtEvent(ev);
    pomodoroAudio.seek(finalTime);
    pomodoroAudio.isScrubbing = false;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
}

export function hoverPomoAudioScrub(e) {
  const bar = document.getElementById("pomo-audio-seekbar-wrap");
  const tip = document.getElementById("pomo-timeline-tooltip");
  if (!bar || !tip || !pomodoroAudio.audio || !pomodoroAudio.audio.duration) return;
  const rect = bar.getBoundingClientRect();
  const hoverX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
  const pct = hoverX / rect.width;
  const hoverTime = pct * pomodoroAudio.audio.duration;

  tip.textContent = `${formatAudioTime(hoverTime)} / ${formatAudioTime(pomodoroAudio.audio.duration)}`;
  tip.style.left = `${hoverX}px`;
  tip.classList.add("active");
}

export function leavePomoAudioScrub() {
  const tip = document.getElementById("pomo-timeline-tooltip");
  if (tip) tip.classList.remove("active");
}

export function setPomodoroPlaylistSearch(q) {
  pomodoroState.playlistSearch = q || "";
  const popover = document.getElementById("pomo-playlist-popover");
  if (popover) {
    const parent = popover.parentElement;
    if (parent) {
      popover.outerHTML = renderPomodoroPlaylistPopover();
      const newSearch = document.querySelector(".pomo-playlist-search-input");
      if (newSearch) {
        newSearch.focus();
        newSearch.setSelectionRange(newSearch.value.length, newSearch.value.length);
      }
    }
  }
}

export function setPomodoroPlaylistCategory(cat) {
  pomodoroState.playlistCategory = cat || "all";
  const popover = document.getElementById("pomo-playlist-popover");
  if (popover) {
    popover.outerHTML = renderPomodoroPlaylistPopover();
  }
}

export async function triggerAddLocalMusic() {
  if (window.electronAPI && typeof window.electronAPI.openAudioFiles === "function") {
    try {
      const files = await window.electronAPI.openAudioFiles();
      if (Array.isArray(files) && files.length > 0) {
        for (const f of files) {
          const trackId = "local_" + Math.random().toString(36).slice(2, 9);
          const track = {
            id: trackId,
            title: f.name.replace(/\.[^/.]+$/, ""),
            artist: "Tệp cá nhân (Offline)",
            tag: "Của bạn",
            icon: "🎵",
            localPath: f.path,
            streamUrl: f.streamUrl,
            file: f.streamUrl,
            sizeMb: "Offline",
            isLocal: true
          };
          pomodoroAudio.playlist.unshift(track);
        }
        pomodoroAudio.saveLocalTracks();
        pomodoroAudio.playTrack(0, true);
        if (window.showToast) window.showToast(`Đã thêm ${files.length} bài hát từ máy tính vào danh sách phát! 🎶`);
        if (window.render) window.render();
        const popoverEl = document.getElementById("pomo-playlist-popover");
        if (popoverEl) popoverEl.outerHTML = renderPomodoroPlaylistPopover();
        return;
      }
    } catch (e) {
      console.warn("openAudioFiles error:", e);
    }
  }

  // Web input fallback
  let input = document.getElementById("pomo-local-audio-input");
  if (!input) {
    input = document.createElement("input");
    input.id = "pomo-local-audio-input";
    input.type = "file";
    input.accept = "audio/*";
    input.multiple = true;
    input.style.display = "none";
    input.onchange = (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      for (const f of files) {
        const blobUrl = URL.createObjectURL(f);
        const trackId = "local_" + Math.random().toString(36).slice(2, 9);
        const track = {
          id: trackId,
          title: f.name.replace(/\.[^/.]+$/, ""),
          artist: "Tệp cá nhân (Offline)",
          tag: "Của bạn",
          icon: "🎵",
          blobUrl: blobUrl,
          file: blobUrl,
          sizeMb: (f.size / (1024 * 1024)).toFixed(1) + " MB",
          isLocal: true
        };
        pomodoroAudio.playlist.unshift(track);
      }
      pomodoroAudio.playTrack(0, true);
      if (window.showToast) window.showToast(`Đã thêm ${files.length} bài hát từ máy tính! 🎶`);
      if (window.render) window.render();
      const popoverEl = document.getElementById("pomo-playlist-popover");
      if (popoverEl) popoverEl.outerHTML = renderPomodoroPlaylistPopover();
      input.value = "";
    };
    document.body.appendChild(input);
  }
  input.click();
}

// Click outside popover to close
if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    if (pomodoroState.showPlaylistDropdown) {
      const popover = document.getElementById("pomo-playlist-popover");
      const btn = document.getElementById("pomo-playlist-btn");
      if (popover && !popover.contains(e.target) && btn && !btn.contains(e.target)) {
        closePomodoroPlaylist();
      }
    }
  });
}

// Window global bridges
window.pomodoroAudio = pomodoroAudio;
window.pomodoroState = pomodoroState;
window.triggerAddLocalMusic = triggerAddLocalMusic;
window.removeCustomAudioTrack = (id) => pomodoroAudio.removeLocalTrack(id);
window.startPomodoroSession = startPomodoroSession;
window.pausePomodoroTimer = pausePomodoroTimer;
window.openPomodoroExitConfirm = openPomodoroExitConfirm;
window.closePomodoroExitConfirm = closePomodoroExitConfirm;
window.abandonPomodoroSession = abandonPomodoroSession;
window.finishBreakAndContinue = finishBreakAndContinue;
window.finishBreakAndExit = finishBreakAndExit;
window.askPomodoroAi = askPomodoroAi;
window.togglePomoAiContext = togglePomoAiContext;
window.togglePomoAiDock = togglePomoAiDock;
window.togglePomoSidebar = togglePomoSidebar;
window.triggerAddPomoFiles = triggerAddPomoFiles;
window.initPomoResizers = initPomoResizers;

window.handlePomoMultiFilesSelected = (input) => {
  if (input.files && input.files.length > 0) {
    addMultipleLocalFiles(input.files);
    input.value = "";
  }
};
window.addNoteToDocs = addNoteToDocs;
window.setActiveDoc = setActiveDoc;
window.removeDoc = removeDoc;
window.closeActiveDoc = closeActiveDoc;
window.resumeWebFocusLock = resumeWebFocusLock;
window.setPomoMobileTab = (tab) => {
  pomodoroState.mobileTab = tab || "clock";
  if (tab === "note") {
    pomodoroState.activeDocId = "__pomo_builtin_note__";
  } else if (tab === "clock") {
    if (pomodoroState.activeDocId === "__pomo_builtin_note__") pomodoroState.activeDocId = null;
  }
  if (window.render) window.render();
};
window.openPomodoroBuiltinNote = () => {
  pomodoroState.activeDocId = "__pomo_builtin_note__";
  pomodoroState.mobileTab = "note";
  if (window.render) window.render();
};
window.selectPomodoroBuiltinNote = (noteId) => {
  const notesList = (window.state && window.state.notes) || [];
  if (!noteId) {
    pomodoroState.builtinNote = { id: "", title: "Ghi chú nhanh Pomodoro", paper: pomodoroState.builtinNote.paper || "lined", text: "" };
  } else {
    const found = notesList.find(n => String(n.id) === String(noteId));
    if (found) {
      const parsed = parsePomoNoteData(found.content);
      pomodoroState.builtinNote = {
        id: String(found.id),
        title: found.title || "Ghi chú không tên",
        paper: parsed.style?.paper || "lined",
        text: parsed.plainText || ""
      };
    }
  }
  if (window.render) window.render();
};
window.savePomodoroBuiltinNote = async () => {
  const n = pomodoroState.builtinNote;
  const title = (n.title || "Ghi chú nhanh Pomodoro").trim();
  const payload = JSON.stringify({
    __richNote: 1,
    style: { paper: n.paper || "lined", font: "sans" },
    html: safeEsc(n.text || "").replace(/\n/g, "<br>")
  });
  try {
    let savedNote = null;
    if (n.id) {
      const res = await callApi(`/api/notes/${encodeURIComponent(n.id)}`, {
        method: "PUT",
        body: { title, content: payload }
      });
      savedNote = res?.note || { id: n.id, title, content: payload };
    } else {
      const res = await callApi("/api/notes", {
        method: "POST",
        body: { title, content: payload, subjectId: null }
      });
      savedNote = res?.note || null;
      if (savedNote && savedNote.id) n.id = String(savedNote.id);
    }
    if (window.state && Array.isArray(window.state.notes) && savedNote) {
      const idx = window.state.notes.findIndex(x => String(x.id) === String(savedNote.id));
      if (idx >= 0) window.state.notes[idx] = { ...window.state.notes[idx], ...savedNote };
      else window.state.notes.unshift(savedNote);
    }
    if (window.showToast) window.showToast("Đã lưu ghi chú vào Sổ tay thành công! 💾");
  } catch (err) {
    if (window.showToast) window.showToast("Không thể lưu ghi chú: " + err.message, true);
  }
};

window.openPomodoroLearnersList = openPomodoroLearnersList;
window.closePomodoroLearnersList = closePomodoroLearnersList;
window.sendPomodoroHeartbeat = sendPomodoroHeartbeat;
window.renderPomodoroLearnersModal = renderPomodoroLearnersModal;

window.renderPomodoro = renderPomodoro;
window.loadPomodoroData = loadPomodoroData;
window.formatPomodoroAiText = formatPomodoroAiText;
window.renderMathFormula = renderMathFormula;
window.formatOfficeTextToHtml = formatOfficeTextToHtml;
window.togglePomodoroPlaylist = togglePomodoroPlaylist;
window.closePomodoroPlaylist = closePomodoroPlaylist;
window.handlePomoAudioSeek = handlePomoAudioSeek;
window.startPomoAudioScrub = startPomoAudioScrub;
window.hoverPomoAudioScrub = hoverPomoAudioScrub;
window.leavePomoAudioScrub = leavePomoAudioScrub;
window.setPomodoroPlaylistSearch = setPomodoroPlaylistSearch;
window.setPomodoroPlaylistCategory = setPomodoroPlaylistCategory;

// ========================================================
// 10. DOCUMENT VIEWER ZOOM CONTROLLER (Trackpad Pinch & Ctrl + MouseWheel)
// ========================================================
export function setDocZoom(zoomLevel) {
  const clamped = Math.max(0.5, Math.min(2.5, Math.round(zoomLevel * 100) / 100));
  pomodoroState.docZoom = clamped;
  try {
    localStorage.setItem("pomo_doc_zoom", String(clamped));
  } catch {}

  const activeDoc = pomodoroState.docs.find(d => d.id === pomodoroState.activeDocId);
  if (activeDoc && activeDoc.type === "pdf") {
    initPdfDocViewer(activeDoc);
  } else {
    const zoomContent = document.getElementById("pomo-doc-zoom-content");
    if (zoomContent) {
      zoomContent.style.zoom = clamped;
    }
  }
  const badge = document.getElementById("pomo-doc-zoom-badge");
  if (badge) {
    badge.textContent = `${Math.round(clamped * 100)}%`;
  }
  const resetBtn = document.getElementById("pomo-doc-zoom-reset");
  if (resetBtn) {
    resetBtn.style.opacity = clamped === 1.0 ? "0.4" : "1";
    resetBtn.style.pointerEvents = clamped === 1.0 ? "none" : "auto";
  }
}

export function changeDocZoom(delta) {
  const cur = pomodoroState.docZoom || 1.0;
  setDocZoom(cur + delta);
}

export function resetDocZoom() {
  setDocZoom(1.0);
}

export function handleDocZoomToolbarWheel(e) {
  e.preventDefault();
  e.stopPropagation();
  const delta = e.deltaY < 0 ? 0.08 : -0.08;
  changeDocZoom(delta);
}

// Global Non-Passive Wheel Listener for Trackpad 2-finger Pinch & Ctrl + MouseWheel
if (typeof document !== "undefined") {
  document.addEventListener("wheel", (e) => {
    const scrollBody = document.getElementById("pomo-doc-scroll-body");
    if (!scrollBody) return;

    if (scrollBody.contains(e.target)) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        let step;
        if (Math.abs(e.deltaY) > 40) {
          step = e.deltaY < 0 ? 0.1 : -0.1;
        } else {
          step = -e.deltaY * 0.005;
        }
        changeDocZoom(step);
      }
    }
  }, { passive: false });
}

window.setDocZoom = setDocZoom;
window.changeDocZoom = changeDocZoom;
window.resetDocZoom = resetDocZoom;
window.handleDocZoomToolbarWheel = handleDocZoomToolbarWheel;
