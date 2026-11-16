/**
 * 🎧 PHÒNG HỌC ẢO POMODORO & LOFI CÙNG THỎ BẢY MÀU (STUDY WITH ME / ZEN ROOM)
 * =========================================================================
 * - Chu kỳ chuẩn 25m Focus / 5m Break
 * - Thưởng +50 XP và 30 💎 mỗi ca 25 phút hoàn thành
 * - Tích lũy theo ca (1 ca = 1x, 2 ca = 2x, v.v.)
 * - Chế độ Safe Exam Browser / Fullscreen & DND Mode chống phân tâm
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
    this.initAudio();
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
    return this.playlist[this.currentIndex] || this.playlist[0];
  }

  getTrackUrl(track) {
    if (!track) return "";
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
    const targetSrc = window.location.origin + url;
    if (this.audio.src !== targetSrc && !this.audio.src.endsWith(url)) {
      this.audio.src = url;
      this.audio.load();
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
      playBtn.innerHTML = isPlaying ? "⏸" : "▶";
      playBtn.title = isPlaying ? "Tạm dừng nhạc" : "Phát nhạc";
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
  docs: [], // Array of { id, name, type: "pdf"|"text"|"image"|"note", content, active }
  activeDocId: null,
  
  // AI CONTEXT READING TOGGLE
  aiReadScreenContext: true,
  aiDockOpen: true,

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
  isAskingAi: false,
  showExitModal: false,
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
// 3. FULLSCREEN & SAFE EXAM BROWSER KIOSK HANDLING
// ========================================================
export async function enterPomodoroKiosk() {
  window._isPomodoroActive = true;

  try {
    if (window.electronAPI && typeof window.electronAPI.setKiosk === "function") {
      await window.electronAPI.setKiosk(true);
    } else if (window.electronAPI && typeof window.electronAPI.setFullscreen === "function") {
      await window.electronAPI.setFullscreen(true);
    } else if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen().catch(() => {});
    }
  } catch {}

  document.body.classList.add("pomodoro-kiosk-mode");
}

export async function exitPomodoroKiosk() {
  window._isPomodoroActive = false;

  try {
    if (window.electronAPI && typeof window.electronAPI.setKiosk === "function") {
      await window.electronAPI.setKiosk(false);
    } else if (window.electronAPI && typeof window.electronAPI.setFullscreen === "function") {
      await window.electronAPI.setFullscreen(false);
    } else if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen().catch(() => {});
    }
  } catch {}

  document.body.classList.remove("pomodoro-kiosk-mode");
}

// Chống sao nhãng / Auto refocus khi mất focus trong lúc đang trong ca học
if (typeof window !== "undefined") {
  window.addEventListener("blur", () => {
    if (pomodoroState.active && !pomodoroState.showExitModal && !pomodoroState.showCelebrationModal) {
      window.focus();
    }
  });

  // Emergency Exit (Ctrl + Q)
  window.addEventListener("keydown", (e) => {
    if (pomodoroState.active && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "q") {
      e.preventDefault();
      e.stopPropagation();
      openPomodoroExitConfirm();
    }
  });
}

// ========================================================
// 4. POMODORO TIMER ENGINE & CYCLE CONTROLLER
// ========================================================
export function startPomodoroSession() {
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

  enterPomodoroKiosk();

  // Kích hoạt nhịp tim trực tuyến báo danh đang học trong phòng Pomodoro
  sendPomodoroHeartbeat();
  if (pomodoroState.heartbeatTimerId) clearInterval(pomodoroState.heartbeatTimerId);
  pomodoroState.heartbeatTimerId = setInterval(sendPomodoroHeartbeat, 25000);

  // Start sound if selected
  const soundSelect = document.getElementById("pomo-ambient-select");
  const selectedChannel = soundSelect ? soundSelect.value : (pomodoroAudio.activeChannel !== "none" ? pomodoroAudio.activeChannel : "lofi");
  pomodoroAudio.playChannel(selectedChannel);

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

export function abandonPomodoroSession() {
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

  exitPomodoroKiosk();

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

export function renderMathFormula(latex) {
  if (!latex) return "";
  let s = String(latex).trim();

  // Strip brackets wrapper \left / \right
  s = s.replace(/\\left\s*([(\[{|])/g, "$1").replace(/\\right\s*([)\]}|])/g, "$1");

  // Handle \frac{numerator}{denominator}
  let prev;
  do {
    prev = s;
    s = s.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, (match, num, den) => {
      return `<span class="math-frac"><span class="frac-num">${renderMathFormula(num)}</span><span class="frac-den">${renderMathFormula(den)}</span></span>`;
    });
  } while (s !== prev);

  // Partial derivative \partial -> ∂
  s = s.replace(/\\partial/g, "∂");

  // Limits: \lim_{(x,y) \to (a,b)} -> lim<sub>(x,y) → (a,b)</sub>
  s = s.replace(/\\lim_\s*\{([^{}]+)\}/g, "lim<sub>$1</sub>");
  s = s.replace(/\\lim/g, "lim");

  // Arrows & symbols
  s = s.replace(/\\to\b/g, " → ");
  s = s.replace(/\\rightarrow\b/g, " → ");
  s = s.replace(/\\leftarrow\b/g, " ← ");
  s = s.replace(/\\infty\b/g, "∞");
  s = s.replace(/\\(ne|neq)\b/g, " ≠ ");
  s = s.replace(/\\(le|leq)\b/g, " ≤ ");
  s = s.replace(/\\(ge|geq)\b/g, " ≥ ");
  s = s.replace(/\\pm\b/g, " ± ");
  s = s.replace(/\\times\b/g, " × ");
  s = s.replace(/\\cdot\b/g, " · ");
  s = s.replace(/\\approx\b/g, " ≈ ");
  s = s.replace(/\\int\b/g, " ∫ ");
  s = s.replace(/\\iint\b/g, " ∬ ");
  s = s.replace(/\\sum\b/g, " ∑ ");
  s = s.replace(/\\prod\b/g, " ∏ ");
  s = s.replace(/\\sqrt\s*\{([^{}]+)\}/g, "√<span style=\"text-decoration:overline;\">$1</span>");

  // Greek letters
  s = s.replace(/\\alpha\b/g, "α")
       .replace(/\\beta\b/g, "β")
       .replace(/\\gamma\b/g, "γ")
       .replace(/\\delta\b/g, "δ")
       .replace(/\\Delta\b/g, "Δ")
       .replace(/\\theta\b/g, "θ")
       .replace(/\\lambda\b/g, "λ")
       .replace(/\\pi\b/g, "π")
       .replace(/\\sigma\b/g, "σ")
       .replace(/\\omega\b/g, "ω")
       .replace(/\\mu\b/g, "μ");

  // Clean math functions: \sin, \cos, \tan, \ln, \log
  s = s.replace(/\\(sin|cos|tan|cot|ln|log|exp)\b/g, "$1");

  // Superscripts & Subscripts: x^{2} or x^2, x_{1} or x_1
  s = s.replace(/\^\s*\{([^{}]+)\}/g, "<sup>$1</sup>");
  s = s.replace(/\^([0-9a-zA-Z+-]+)/g, "<sup>$1</sup>");
  s = s.replace(/_\s*\{([^{}]+)\}/g, "<sub>$1</sub>");
  s = s.replace(/_([0-9a-zA-Z+-]+)/g, "<sub>$1</sub>");

  // Strip remaining solitary backslashes
  s = s.replace(/\\([a-zA-Z]+)/g, "$1");

  return s;
}

export function formatInlineMarkdown(text) {
  if (!text) return "";
  let s = safeEsc(text);

  // Inline Math: \( ... \) or $ ... $
  s = s.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, (match, formula) => {
    return `<span class="pomo-math-inline">${renderMathFormula(formula)}</span>`;
  });
  s = s.replace(/\$([^\$\n]+)\$/g, (match, formula) => {
    return `<span class="pomo-math-inline">${renderMathFormula(formula)}</span>`;
  });

  // Bold: **text**
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong class="pomo-ai-strong">$1</strong>');

  // Italic: *text*
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Inline code: `code`
  s = s.replace(/`([^`]+)`/g, '<code class="pomo-ai-code">$1</code>');

  return s;
}

export function formatPomodoroAiText(raw) {
  if (!raw) return "";

  // 1. Extract and preserve Block Math: \[ ... \] or $$ ... $$
  const mathBlocks = [];
  let text = String(raw).replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (match, code) => {
    const idx = mathBlocks.length;
    mathBlocks.push(renderMathFormula(code));
    return `___MATH_BLOCK_${idx}___`;
  });
  text = text.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (match, code) => {
    const idx = mathBlocks.length;
    mathBlocks.push(renderMathFormula(code));
    return `___MATH_BLOCK_${idx}___`;
  });

  // 2. Pre-process ">>" step delimiters into clean newlines so steps aren't clumped
  text = text.replace(/>>\s*/g, "\n\n>> ");

  // 3. Split into lines / blocks
  const lines = text.split("\n");
  const htmlParts = [];
  let currentList = null;

  const flushList = () => {
    if (currentList) {
      htmlParts.push(`<ul class="pomo-ai-bullet-list">${currentList.join("")}</ul>`);
      currentList = null;
    }
  };

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    // Step Block (e.g., ">> **Bước 1** ...", "**Bước 1**:", "Bước 1:")
    if (trimmed.startsWith(">>") || /^\*\*(Bước|Cách|Ví dụ|Mẹo nhớ)\s*[\d]*\*\*/i.test(trimmed) || /^(Bước|Cách)\s+\d+:/i.test(trimmed)) {
      flushList();
      const content = trimmed.replace(/^>>\s*/, "");
      htmlParts.push(`<div class="pomo-ai-step-block">${formatInlineMarkdown(content)}</div>`);
      continue;
    }

    // Callout quote: starts with ">"
    if (trimmed.startsWith(">")) {
      flushList();
      const calloutContent = trimmed.replace(/^>\s*/, "");
      htmlParts.push(`<div class="pomo-ai-callout">${formatInlineMarkdown(calloutContent)}</div>`);
      continue;
    }

    // Bullet item (* or -)
    if (/^[*\-•]\s+/.test(trimmed)) {
      if (!currentList) currentList = [];
      const itemText = trimmed.replace(/^[*\-•]\s+/, "");
      currentList.push(`<li>${formatInlineMarkdown(itemText)}</li>`);
      continue;
    }

    // Numbered list item (1. or 2.)
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    if (numMatch) {
      flushList();
      htmlParts.push(`
        <div class="pomo-ai-list-row">
          <span class="pomo-ai-list-num">${numMatch[1]}.</span>
          <span class="pomo-ai-list-body">${formatInlineMarkdown(numMatch[2])}</span>
        </div>
      `);
      continue;
    }

    // Regular paragraph
    flushList();
    htmlParts.push(`<p class="pomo-ai-para">${formatInlineMarkdown(trimmed)}</p>`);
  }
  flushList();

  let finalHtml = htmlParts.join("");

  // Restore Math Blocks
  mathBlocks.forEach((renderedMath, i) => {
    finalHtml = finalHtml.replace(`___MATH_BLOCK_${i}___`, `<div class="pomo-math-block">${renderedMath}</div>`);
  });

  return finalHtml;
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

// Extract text from Office PPTX / DOCX zip packages
export async function extractTextFromZipDoc(file, ext) {
  try {
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);
    let offset = 0;
    const slides = [];
    let docxText = "";

    while (offset + 30 < buffer.byteLength) {
      const sig = view.getUint32(offset, true);
      if (sig !== 0x04034b50) break; // Local file header signature

      const compression = view.getUint16(offset + 8, true);
      const compSize = view.getUint32(offset + 18, true);
      const fnLen = view.getUint16(offset + 26, true);
      const extraLen = view.getUint16(offset + 28, true);

      const nameBytes = new Uint8Array(buffer, offset + 30, fnLen);
      const filename = new TextDecoder().decode(nameBytes);
      const dataStart = offset + 30 + fnLen + extraLen;

      if (dataStart + compSize <= buffer.byteLength) {
        const isTarget = filename === "word/document.xml" || /^ppt\/slides\/slide\d+\.xml$/i.test(filename);
        if (isTarget) {
          const compData = new Uint8Array(buffer, dataStart, compSize);
          let xmlContent = "";
          if (compression === 0) {
            xmlContent = new TextDecoder().decode(compData);
          } else if (compression === 8 && typeof DecompressionStream !== "undefined") {
            try {
              const ds = new DecompressionStream("deflate-raw");
              const writer = ds.writable.getWriter();
              writer.write(compData);
              writer.close();
              const decompressed = await new Response(ds.readable).arrayBuffer();
              xmlContent = new TextDecoder().decode(decompressed);
            } catch (e) {
              console.warn("Decompress error for", filename, e);
            }
          }

          if (xmlContent) {
            if (filename === "word/document.xml") {
              const pMatches = xmlContent.split(/<\/w:p>/g);
              const pTexts = pMatches.map(p => {
                const runs = [...p.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/g)].map(m => m[1]);
                return runs.join("");
              }).filter(t => t.trim());
              docxText = pTexts.join("\n\n");
            } else {
              const slideNum = (filename.match(/\d+/) || ["1"])[0];
              const tRuns = [...xmlContent.matchAll(/<a:t[^>]*>(.*?)<\/a:t>/g)].map(m => m[1]);
              const combined = tRuns.join(" ").trim();
              if (combined) {
                slides.push({ num: parseInt(slideNum, 10), text: combined });
              }
            }
          }
        }
      }
      offset = dataStart + compSize;
    }

    if (ext === "pptx" || ext === "ppt") {
      if (slides.length > 0) {
        slides.sort((a, b) => a.num - b.num);
        return slides.map(s => `[SLIDE ${s.num}]\n${s.text}`).join("\n\n");
      }
    } else if (docxText) {
      return docxText;
    }

    // Fallback: extract clean text chunks from buffer
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const rawStr = decoder.decode(buffer);
    const matches = rawStr.match(/[\p{L}\p{N}\s.,?!:;'"()\-+*/=]{4,}/gu) || [];
    const filtered = matches.filter(m => m.trim().length > 5 && !/[<>{}\\/]/.test(m));
    return filtered.slice(0, 50).join("\n");
  } catch (err) {
    console.warn("extractTextFromZipDoc error:", err);
    return "";
  }
}

export async function extractTextFromPdfDoc(file) {
  try {
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder("latin1");
    const rawStr = decoder.decode(buffer);
    const textPieces = [];
    const tjMatches = [...rawStr.matchAll(/\(([^()]{2,100})\)\s*Tj/g)];
    tjMatches.forEach(m => {
      const clean = m[1].replace(/\\([()\\])/g, "$1").trim();
      if (clean.length > 2) textPieces.push(clean);
    });
    if (textPieces.length > 10) {
      return textPieces.slice(0, 300).join(" ");
    }
  } catch {}
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
      const blobUrl = URL.createObjectURL(file);
      const pdfText = await extractTextFromPdfDoc(file);
      pomodoroState.docs.push({
        id: docId,
        name: file.name,
        type: "pdf",
        content: blobUrl,
        blobUrl: blobUrl,
        extractedText: pdfText
      });
      if (!pomodoroState.activeDocId) pomodoroState.activeDocId = docId;
      if (window.render) window.render();
    } else if (ext === ".pptx" || ext === ".ppt") {
      const extracted = await extractTextFromZipDoc(file, "pptx");
      pomodoroState.docs.push({
        id: docId,
        name: file.name,
        type: "pptx",
        content: extracted,
        extractedText: extracted
      });
      if (!pomodoroState.activeDocId) pomodoroState.activeDocId = docId;
      if (window.render) window.render();
    } else if (ext === ".docx" || ext === ".doc") {
      const extracted = await extractTextFromZipDoc(file, "docx");
      pomodoroState.docs.push({
        id: docId,
        name: file.name,
        type: "docx",
        content: extracted,
        extractedText: extracted
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
    pomodoroState.docs.push({
      id: docId,
      name: note.title || "Ghi chú không tên",
      type: "note",
      content: note.content || "",
      extractedText: note.content || ""
    });
    pomodoroState.activeDocId = docId;
  }
  if (window.showToast) window.showToast(`Đã thêm ghi chú "${note.title}" vào bàn học! 📝`);
  if (window.render) window.render();
}

export function setActiveDoc(docId) {
  pomodoroState.activeDocId = docId;
  if (window.render) window.render();
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

export function togglePomoAiDock() {
  pomodoroState.aiDockOpen = !pomodoroState.aiDockOpen;
  const dock = document.getElementById("pomo-ai-dock");
  if (dock) dock.classList.toggle("collapsed", !pomodoroState.aiDockOpen);
}

export async function askPomodoroAi(customPrompt = null) {
  const prompt = customPrompt || pomodoroState.aiInput;
  if (!prompt || !prompt.trim() || pomodoroState.isAskingAi) return;

  pomodoroState.isAskingAi = true;
  pomodoroState.aiChatHistory.push({ sender: "user", text: prompt.trim() });
  pomodoroState.aiInput = "";
  renderPomodoroAiMessages();

  // Attach context of the document currently on screen if enabled
  let contextDoc = "";
  const activeDoc = pomodoroState.docs.find(d => d.id === pomodoroState.activeDocId);
  if (pomodoroState.aiReadScreenContext && activeDoc) {
    const rawContent = activeDoc.extractedText || activeDoc.content || "";
    if (activeDoc.type === "pptx" || activeDoc.type === "ppt") {
      contextDoc = `\n\n[NGỮ CẢNH BÀI THUYẾT TRÌNH POWERPOINT ĐANG MỞ TRÊN MÀN HÌNH - "${activeDoc.name}"]:\n${rawContent.slice(0, 4500)}\n[HÃY TẬP TRUNG GIẢI ĐÁP, GIẢNG GIẢI CÁC SLIDE TRÊN DỄ HIỂU NHẤT]`;
    } else if (activeDoc.type === "docx" || activeDoc.type === "doc") {
      contextDoc = `\n\n[NGỮ CẢNH TÀI LIỆU SOẠN THẢO WORD ĐANG MỞ TRÊN MÀN HÌNH - "${activeDoc.name}"]:\n${rawContent.slice(0, 4500)}\n[HÃY GIẢI ĐÁP THEO NỘI DUNG TÀI LIỆU TRÊN]`;
    } else if (activeDoc.type === "code") {
      contextDoc = `\n\n[NGỮ CẢNH SOURCE CODE ĐANG MỞ TRÊN MÀN HÌNH - "${activeDoc.name}"]:\n\`\`\`\n${rawContent.slice(0, 4500)}\n\`\`\`\n[HÃY GIẢI THÍCH THUẬT TOÁN, TÌM LỖI HOẶC TỐI ƯU ĐOẠN CODE NÀY NẾU ĐƯỢC HỎI]`;
    } else if (activeDoc.type === "pdf") {
      const pdfText = activeDoc.extractedText ? activeDoc.extractedText.slice(0, 4500) : "";
      contextDoc = `\n\n[NGỮ CẢNH GIÁO TRÌNH PDF ĐANG MỞ TRÊN MÀN HÌNH - "${activeDoc.name}"]:${pdfText ? '\n' + pdfText : ''}\n[HÃY HƯỚNG DẪN CHI TIẾT TỪNG BƯỚC, GIẢI CÔNG THỨC TOÁN HỌC HOẶC KHÁI NIỆM TRONG BÀI NÀY DỄ HIỂU NHẤT]`;
    } else if (activeDoc.type === "text" || activeDoc.type === "note") {
      contextDoc = `\n\n[NGỮ CẢNH BÀI HỌC/GHI CHÚ ĐANG MỞ TRÊN MÀN HÌNH - "${activeDoc.name}"]:\n${rawContent.slice(0, 4500)}\n[HÃY GIẢI ĐÁP, HƯỚNG DẪN CHI TIẾT THEO TÀI LIỆU TRÊN]`;
    } else if (activeDoc.type === "video" || activeDoc.type === "audio") {
      contextDoc = `\n\n[NGỮ CẢNH]: Người học đang nghe/xem bài giảng "${activeDoc.name}".`;
    } else if (activeDoc.type === "image") {
      contextDoc = `\n\n[NGỮ CẢNH]: Người học đang xem ảnh/sơ đồ "${activeDoc.name}".`;
    }
  }

  const formattingSystemRule = `\n\n[HƯỚNG DẪN ĐỊNH DẠNG CỦA BOT 3TG]:
1. Tuyệt đối KHÔNG viết thành 1 khối văn bản dính liền! Chia bài giải thành các bước rõ ràng: ">> **Bước 1**:", ">> **Bước 2**:", ">> **Mẹo nhớ**:".
2. Công thức toán học dùng cú pháp LaTeX: ví dụ đạo hàm riêng \\frac{\\partial f}{\\partial x}, phân số \\frac{a}{b}, giới hạn \\lim_{x \\to 0}, số mũ x^2.
3. Giải thích súc tích, dễ nhớ cho sinh viên ôn thi.`;

  try {
    const res = await callApi("/api/chat", {
      method: "POST",
      body: {
        message: prompt + contextDoc + formattingSystemRule
      }
    });

    const reply = res?.reply || res?.message || "Thỏ Bảy Màu đã nắm được kiến thức bài này! Cố lên nhé bạn!";
    pomodoroState.aiChatHistory.push({ sender: "bot", text: reply });
  } catch (err) {
    pomodoroState.aiChatHistory.push({ sender: "bot", text: "Ối, có lỗi nhỏ khi kết nối Bot 3TG: " + err.message });
  } finally {
    pomodoroState.isAskingAi = false;
    renderPomodoroAiMessages();
  }
}

function renderPomodoroAiMessages() {
  const container = document.getElementById("pomo-ai-chat-thread");
  if (!container) return;

  container.innerHTML = pomodoroState.aiChatHistory.map(m => `
    <div class="pomo-ai-bubble ${m.sender}">
      <div class="pomo-ai-avatar">${m.sender === "bot" ? "🐰" : "👤"}</div>
      <div class="pomo-ai-text">
        ${m.sender === "bot" ? formatPomodoroAiText(m.text) : safeEsc(m.text)}
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
      <div class="pomo-ai-text">Thỏ Bảy Màu đang gõ câu trả lời... ✨</div>
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
            <span>Khóa toàn màn hình & tắt thông báo tin nhắn (như Safe Exam Browser) để chống sao nhãng.</span>
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
          <h2 class="setup-card-title">🎵 Âm thanh kích thích não bộ (Cloudflare R2)</h2>
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
            <select class="pomo-lobby-select" onchange="window.pomodoroAudio.playTrack(parseInt(this.value, 10), true)" style="flex:1; padding:7px 12px; border-radius:12px; border:1.5px solid var(--border-light, #e2e8f0); font-weight:700; font-size:12px; background:var(--bg-page, #f8fafc); color:var(--ink-800);">
              ${pomodoroAudio.playlist.map((t, idx) => `
                <option value="${idx}" ${pomodoroAudio.currentIndex === idx ? 'selected' : ''}>
                  ${t.icon} ${t.title} (${t.tag})
                </option>
              `).join("")}
            </select>
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
  const activeDoc = pomodoroState.docs.find(d => d.id === pomodoroState.activeDocId);
  const notesList = (window.state && window.state.notes) || [];

  return `
    <div class="pomodoro-active-room ${isFocus ? 'focus-phase' : 'break-phase'}">
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

          <!-- CHỈ HIỂN THỊ SỐ NGƯỜI ĐANG HỌC - NHẤP VÀO SỔ RA DANH SÁCH -->
          <div class="pomo-topbar-peers" onclick="window.openPomodoroLearnersList()" style="cursor:pointer;" title="Nhấp để xem danh sách bạn học đang trong phòng 👥">
            <span class="pomo-live-dot"></span>
            <span>Đang có ${pomodoroState.peersCount} bạn cùng học tập trung ▾</span>
          </div>
        </div>

        <!-- 2. CENTER: YOUTUBE-STYLE MUSIC PLAYER WITH BUFFER BAR -->
        <div class="pomo-topbar-center-player">
          <!-- Controls row: Prev, Play/Pause, Next -->
          <div class="pomo-music-controls-row">
            <button type="button" class="pomo-music-ctrl-btn" onclick="window.pomodoroAudio.prev()" title="Bài trước (Prev)">
              ⏮
            </button>
            <button type="button" class="pomo-music-play-btn" id="pomo-music-play-btn" onclick="window.pomodoroAudio.togglePlay()" title="${pomodoroAudio.isPlaying ? 'Tạm dừng nhạc' : 'Phát nhạc'}">
              ${pomodoroAudio.isPlaying ? '⏸' : '▶'}
            </button>
            <button type="button" class="pomo-music-ctrl-btn" onclick="window.pomodoroAudio.next()" title="Bài tiếp theo (Next)">
              ⏭
            </button>
          </div>

          <!-- Title row -->
          <div class="pomo-music-title-wrap">
            <span class="pomo-music-title" id="pomo-current-music-title" title="${safeEsc(currentTrack.title)} - ${safeEsc(currentTrack.artist)}">
              ${currentTrack.icon} ${safeEsc(currentTrack.title)}
            </span>
          </div>

          <!-- YouTube-style Seekbar with progressive buffer bar -->
          <div class="pomo-music-seekbar-row">
            <span class="pomo-music-time" id="pomo-audio-time-current">00:00</span>
            <div class="pomo-youtube-seekbar-wrap" id="pomo-audio-seekbar-wrap" onclick="window.handlePomoAudioSeek(event)">
              <div class="pomo-seekbar-bg">
                <!-- Chunks load progressively like YouTube -->
                <div class="pomo-audio-buffer-bar" id="pomo-audio-buffer-bar" style="width: 0%;"></div>
                <!-- Played progress -->
                <div class="pomo-audio-played-bar" id="pomo-audio-played-bar" style="width: 0%;"></div>
              </div>
              <!-- Draggable scrub thumb -->
              <div class="pomo-audio-scrub-thumb" id="pomo-audio-scrub-thumb" style="left: 0%;"></div>
            </div>
            <span class="pomo-music-time" id="pomo-audio-time-duration">--:--</span>
          </div>
        </div>

        <!-- 3. RIGHT: PLAYLIST DROPDOWN BUTTON & EXIT -->
        <div class="pomo-topbar-right">
          <!-- PLAYLIST DROPDOWN TRIGGER BUTTON -->
          <button type="button" class="btn-duo btn-pomo-playlist-toggle ${pomodoroState.showPlaylistDropdown ? 'active' : ''}" id="pomo-playlist-btn" onclick="window.togglePomodoroPlaylist(event)" title="Mở danh sách 17 bài nhạc Pomodoro">
            🎵 Danh sách nhạc ⇩
          </button>

          <!-- EMERGENCY EXIT BUTTON (Ctrl + Q) -->
          <button type="button" class="btn-duo btn-pomo-exit-btn" onclick="window.openPomodoroExitConfirm()" title="Nhấn Ctrl + Q để thoát">
            🚪 Thoát (Ctrl + Q)
          </button>
        </div>

        <!-- 4. FLOATING PLAYLIST POPOVER (17 TRACKS) -->
        ${renderPomodoroPlaylistPopover()}
      </header>

      <!-- 3-PANE WORKSPACE: LEFT (DOC TABS) | CENTER (DOCUMENT VIEWER / FULL CLOCK) | RIGHT (AI ASSISTANT TAB) -->
      <main class="pomo-room-body">
        
        <!-- ==================== CỘT TRÁI: TAB DANH SÁCH FILE TÀI LIỆU ==================== -->
        <aside class="pomo-files-sidebar" id="pomo-files-sidebar">
          <div class="pomo-sidebar-header">
            <strong class="sidebar-title">📁 TÀI LIỆU HỌC (${pomodoroState.docs.length})</strong>
            <span class="sidebar-locked-badge" title="Để duy trì tập trung tuyệt đối (Safe Exam Mode), tệp chỉ được nạp ở sảnh trước khi vào phòng học">🔒 Đã khóa tệp</span>
          </div>

          <!-- Quick Notes Dropdown in sidebar -->
          <div class="sidebar-note-selector-wrap">
            <select class="sidebar-note-select" onchange="if(this.value){ window.addNoteToDocs(this.value); this.value=''; }">
              <option value="">＋ Thêm từ Sổ tay ghi chú...</option>
              ${notesList.map(n => `<option value="${n.id}">${safeEsc(n.title || 'Ghi chú không tên')}</option>`).join("")}
            </select>
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
                Chưa có tài liệu nào.<br>Tài liệu được chọn ở sảnh trước khi bắt đầu ca học.
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

        <!-- ==================== Ở GIỮA: MỞ FILE HOẶC ĐỒNG HỒ ZEN TOÀN PHẦN ==================== -->
        <section class="pomo-center-stage ${activeDoc ? 'doc-mode' : 'clock-mode'}">
          ${activeDoc ? `
            <!-- KHI ĐANG MỞ FILE TÀI LIỆU: TRÌNH ĐỌC TRUNG TÂM -->
            <div class="pomo-doc-full-viewer">
              <div class="doc-viewer-header">
                <div class="doc-viewer-title-row">
                  <span class="doc-badge-pill">${activeDoc.type.toUpperCase()}</span>
                  <strong class="doc-active-name">${safeEsc(activeDoc.name)}</strong>
                </div>
                <div class="doc-viewer-actions">
                  <button type="button" class="btn-viewer-tool" onclick="window.closeActiveDoc()" title="Đóng file xem đồng hồ">
                    Đóng tài liệu ✕
                  </button>
                </div>
              </div>
              <div class="doc-viewer-scrollable-body ${activeDoc.type === 'pdf' ? 'pdf-mode' : ''}">
                ${renderDocContent(activeDoc)}
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

        <!-- ==================== BÊN PHẢI: TAB CỐ VẤN BOT 3TG AI ĐỌC NGỮ CẢNH ==================== -->
        <aside class="pomo-ai-dock ${pomodoroState.aiDockOpen ? 'open' : 'collapsed'}" id="pomo-ai-dock" onclick="if(this.classList.contains('collapsed')) window.togglePomoAiDock()">
          <!-- Handle hiển thị khi dock thu gọn: Click vào là mở ra -->
          <div class="pomo-ai-collapsed-handle" title="Bấm để mở lại Cố vấn Bot 3TG AI">
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
            <button type="button" class="btn-dock-toggle" onclick="window.togglePomoAiDock()" title="Thu nhỏ / Mở rộng Tab AI">
              ${pomodoroState.aiDockOpen ? '➔' : '◀'}
            </button>
          </div>

          <!-- CONTEXT READING TOGGLE SWITCH -->
          <div class="pomo-ai-context-bar">
            <label class="pomo-ai-context-label" title="Khi bật, AI sẽ tự động đọc nội dung tài liệu đang mở ở màn hình giữa để giải thích và tóm tắt">
              <input type="checkbox" ${pomodoroState.aiReadScreenContext ? 'checked' : ''} onchange="window.togglePomoAiContext(this.checked)">
              <span class="pomo-switch-slider"></span>
              <span class="context-switch-text">👀 Đọc tài liệu trên màn hình</span>
            </label>
            ${activeDoc ? `<span class="context-active-indicator" title="Đang liên kết: ${safeEsc(activeDoc.name)}">● Đang liên kết</span>` : `<span class="context-idle-indicator">Chưa mở file</span>`}
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
                  ${m.sender === "bot" ? formatPomodoroAiText(m.text) : safeEsc(m.text)}
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
            <input type="text" class="pomo-ai-input" placeholder="Hỏi Bot 3TG về bài học..." value="${pomodoroState.aiInput}" 
                   oninput="window.pomodoroState.aiInput = this.value" onkeydown="if(event.key === 'Enter') window.askPomodoroAi()">
            <button type="button" class="pomo-ai-send-btn" onclick="window.askPomodoroAi()">Gửi ➔</button>
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
      <div class="pomo-doc-pdf-wrap">
        <object data="${doc.content}" type="application/pdf" class="pomo-pdf-iframe">
          <iframe src="${doc.content}" class="pomo-pdf-iframe" title="${safeEsc(doc.name)}">
            <div class="pomo-doc-empty">
              Trình duyệt không hỗ trợ xem trực tiếp PDF này. Bạn có thể nhấn vào "Tóm tắt tài liệu" bên phải để Cố vấn AI đọc nội dung cho bạn.
            </div>
          </iframe>
        </object>
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

  if (doc.type === "pptx" || doc.type === "ppt" || doc.type === "docx" || doc.type === "doc") {
    const isPpt = doc.type.startsWith("ppt");
    return `
      <div class="pomo-doc-office-wrap">
        <div class="office-doc-card">
          <div class="office-doc-header">
            <div class="office-icon">${isPpt ? '📊' : '📄'}</div>
            <div class="office-header-meta">
              <strong>${safeEsc(doc.name)}</strong>
              <span>${isPpt ? 'Bài thuyết trình PowerPoint' : 'Tài liệu văn bản Word'}</span>
            </div>
            <button type="button" class="btn-viewer-tool" style="margin-left:auto;" onclick="window.askPomodoroAi('Tóm tắt 3 ý trọng tâm của tài liệu trên màn hình')">
              🤖 Nhờ AI tóm tắt tài liệu
            </button>
          </div>
          <div class="office-doc-body">
            ${formatOfficeTextToHtml(doc.extractedText || doc.content)}
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
// 9. PLAYLIST POPOVER & AUDIO INTERACTION HELPERS
// ========================================================
export function renderPomodoroPlaylistPopover() {
  const currentTrack = pomodoroAudio.getCurrentTrack();
  const search = (pomodoroState.playlistSearch || "").trim().toLowerCase();
  const cat = pomodoroState.playlistCategory || "all";

  const categories = [
    { key: "all", label: `Tất cả (${POMODORO_PLAYLIST.length})` },
    { key: "lofi", label: "Lofi Beat" },
    { key: "rain", label: "Tiếng Mưa" },
    { key: "brain", label: "Sóng Não" },
    { key: "asmr", label: "ASMR" },
    { key: "ambient", label: "Ambient" }
  ];

  const filtered = pomodoroAudio.playlist.filter(t => {
    if (cat !== "all") {
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
          <strong>Nhạc Pomodoro (Cloudflare R2)</strong>
        </div>
        <button type="button" class="pomo-playlist-close-x" onclick="window.closePomodoroPlaylist()" title="Đóng">✕</button>
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
                <span class="track-row-size">${track.sizeMb} MB</span>
                <button type="button" class="pomo-track-play-btn" title="${isPlayingThis ? 'Tạm dừng' : 'Phát'}" onclick="event.stopPropagation(); ${isCurrent ? 'window.pomodoroAudio.togglePlay()' : `window.pomodoroAudio.playTrack(${globalIdx}, true)`}">
                  <span class="pomo-track-play-icon">${isPlayingThis ? '⏸' : '▶'}</span>
                </button>
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
window.setPomodoroPlaylistSearch = setPomodoroPlaylistSearch;
window.setPomodoroPlaylistCategory = setPomodoroPlaylistCategory;
