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

// Safe API caller helper
async function callApi(path, options = {}) {
  if (typeof window.api === "function") {
    return window.api(path, options);
  }
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

// ========================================================
// 1. PROCEDURAL WEB AUDIO API SYNTHESIZER (100% OFFLINE)
// ========================================================
export class PomodoroAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.activeChannel = "none"; // "lofi" | "rain" | "cafe" | "book" | "none"
    this.volume = 0.8; // 0.0 -> 1.0
    this.nodes = [];
    this.intervalIds = [];
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, Number(vol) || 0));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  stopAll() {
    this.intervalIds.forEach(id => clearInterval(id));
    this.intervalIds = [];
    for (const node of this.nodes) {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {}
    }
    this.nodes = [];
    this.activeChannel = "none";
  }

  playChannel(channelName) {
    this.init();
    this.stopAll();
    this.activeChannel = channelName;

    if (!this.ctx || channelName === "none") return;

    if (channelName === "lofi") {
      this.startLofiBeats();
    } else if (channelName === "rain") {
      this.startRainSound();
    } else if (channelName === "cafe") {
      this.startCafeAmbiance();
    } else if (channelName === "book") {
      this.startBookFlipAmbiance();
    }
  }

  // --- Rain Generator (Filtered Pink Noise with Slow Natural Swells) ---
  startRainSound() {
    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.085;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(850, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(240, this.ctx.currentTime);
    lfo.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.75, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start();
    lfo.start();
    this.nodes.push(whiteNoise, filter, lfo, lfoGain, gain);
  }

  // --- Lofi Beats Generator (Rhodes E-Piano Chords, Sub Kick, Rimshot & Tape Crackle) ---
  startLofiBeats() {
    const bufLen = this.ctx.sampleRate * 2;
    const crackleBuf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const data = crackleBuf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      if (Math.random() < 0.001) {
        data[i] = (Math.random() * 2 - 1) * 0.18;
      } else {
        data[i] = (Math.random() * 2 - 1) * 0.012;
      }
    }
    const crackle = this.ctx.createBufferSource();
    crackle.buffer = crackleBuf;
    crackle.loop = true;

    const crackleFilter = this.ctx.createBiquadFilter();
    crackleFilter.type = "bandpass";
    crackleFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    crackleFilter.Q.setValueAtTime(1.1, this.ctx.currentTime);

    const crackleGain = this.ctx.createGain();
    crackleGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    crackle.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(this.masterGain);
    crackle.start();
    this.nodes.push(crackle, crackleFilter, crackleGain);

    const chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [293.66, 349.23, 440.00, 523.25], // Dm7
      [196.00, 246.94, 293.66, 349.23]  // G7
    ];
    let chordIdx = 0;
    const bpm = 72;
    const beatSec = 60 / bpm;
    const barSec = beatSec * 4;

    const playRhodesChord = (freqs) => {
      if (!this.ctx || this.activeChannel !== "lofi") return;
      const now = this.ctx.currentTime;
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const chordGain = this.ctx.createGain();
        const f = this.ctx.createBiquadFilter();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.025);

        f.type = "lowpass";
        f.frequency.setValueAtTime(950, now);

        chordGain.gain.setValueAtTime(0.0001, now);
        chordGain.gain.exponentialRampToValueAtTime(0.065, now + 0.08);
        chordGain.gain.exponentialRampToValueAtTime(0.0001, now + barSec * 0.9);

        osc.connect(f);
        f.connect(chordGain);
        chordGain.connect(this.masterGain);

        osc.start(now + idx * 0.025);
        osc.stop(now + barSec);
      });
    };

    const playDrum = (type) => {
      if (!this.ctx || this.activeChannel !== "lofi") return;
      const now = this.ctx.currentTime;
      if (type === "kick") {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.frequency.setValueAtTime(105, now);
        osc.frequency.exponentialRampToValueAtTime(42, now + 0.15);
        g.gain.setValueAtTime(0.22, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === "snare") {
        const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.1), this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / 800);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const flt = this.ctx.createBiquadFilter();
        flt.type = "bandpass";
        flt.frequency.setValueAtTime(1700, now);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.14, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        src.connect(flt);
        flt.connect(g);
        g.connect(this.masterGain);
        src.start(now);
      }
    };

    playRhodesChord(chords[0]);
    let beatCount = 0;
    const interval = setInterval(() => {
      if (this.activeChannel !== "lofi") {
        clearInterval(interval);
        return;
      }
      beatCount++;
      if (beatCount % 4 === 0) {
        chordIdx = (chordIdx + 1) % chords.length;
        playRhodesChord(chords[chordIdx]);
      }
      if (beatCount % 4 === 0 || beatCount % 4 === 2) {
        playDrum("kick");
      }
      if (beatCount % 4 === 1 || beatCount % 4 === 3) {
        playDrum("snare");
      }
    }, beatSec * 1000);

    this.intervalIds.push(interval);
  }

  // --- ENHANCED CAFE AMBIANCE (Audible Chatter Murmur, Coffee Cup Clinks, Espresso Steam) ---
  startCafeAmbiance() {
    const bufLen = this.ctx.sampleRate * 3;
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * 0.12;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;

    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = "lowpass";
    filter1.frequency.setValueAtTime(850, this.ctx.currentTime);

    const filter2 = this.ctx.createBiquadFilter();
    filter2.type = "peaking";
    filter2.frequency.setValueAtTime(500, this.ctx.currentTime);
    filter2.gain.setValueAtTime(6, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.75, this.ctx.currentTime);

    noise.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
    this.nodes.push(noise, filter1, filter2, gain);

    // Play porcelain cup / saucer clink (frequent & clear)
    const playCupClink = () => {
      if (this.activeChannel !== "cafe" || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const cg = this.ctx.createGain();
      const freqs = [1950, 2400, 2850, 3200];
      const f = freqs[Math.floor(Math.random() * freqs.length)];
      osc.frequency.setValueAtTime(f, now);
      cg.gain.setValueAtTime(0.18, now);
      cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.connect(cg);
      cg.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.2);
    };

    // Trigger one immediately so user hears it upon selection
    playCupClink();
    const clinkInterval = setInterval(() => {
      if (Math.random() < 0.75) playCupClink();
    }, 2400);
    this.intervalIds.push(clinkInterval);
  }

  // --- ENHANCED BOOK / LIBRARY AMBIANCE (Audible Paper Rustles & Page Flips) ---
  startBookFlipAmbiance() {
    const bufLen = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * 0.05;
    const roomTone = this.ctx.createBufferSource();
    roomTone.buffer = buf;
    roomTone.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(750, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55, this.ctx.currentTime);

    roomTone.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    roomTone.start();
    this.nodes.push(roomTone, filter, gain);

    // Realistic crisp page turn sound
    const flipPage = () => {
      if (this.activeChannel !== "book" || !this.ctx) return;
      const now = this.ctx.currentTime;
      const duration = 0.35;
      const fBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * duration), this.ctx.sampleRate);
      const fd = fBuf.getChannelData(0);
      for (let i = 0; i < fd.length; i++) {
        const t = i / fd.length;
        const envelope = (Math.sin(t * Math.PI * 2) ** 2) * Math.sin(t * Math.PI);
        fd[i] = (Math.random() * 2 - 1) * envelope * 0.45;
      }
      const pageSrc = this.ctx.createBufferSource();
      pageSrc.buffer = fBuf;
      const pFlt = this.ctx.createBiquadFilter();
      pFlt.type = "bandpass";
      pFlt.frequency.setValueAtTime(1800, now);
      pFlt.Q.setValueAtTime(1.8, now);
      const pGain = this.ctx.createGain();
      pGain.gain.setValueAtTime(0.65, now);
      pageSrc.connect(pFlt);
      pFlt.connect(pGain);
      pGain.connect(this.masterGain);
      pageSrc.start(now);
    };

    // Trigger one immediately so user hears it upon selection
    flipPage();
    const bookInterval = setInterval(flipPage, 3200);
    this.intervalIds.push(bookInterval);
  }

  // --- Pleasant Completion Bell Chime (Zen Bell) ---
  playCompletionBell() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [587.33, 880.0, 1174.66]; // D5, A5, D6 harmonic chime
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      g.gain.setValueAtTime(0.2 / (idx + 1), now + idx * 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + 3.0);
    });
  }
}

export const pomodoroAudio = new PomodoroAudioEngine();

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
  peersCount: 5,
  groupName: "hú",
  peerStatusText: "Đang có 5 bạn trong nhóm 'hú' cùng ngồi học",
  quotesTimer: null,
  currentQuote: "Học đi không là sau này đi bốc vác đấy! ✍️",
  aiChatHistory: [
    { sender: "bot", text: "Xin chào! Mình là Cố vấn AI Bot 3TG trong phòng học Pomodoro 🎧 Bật tùy chọn 'Đọc tài liệu trên màn hình' để mình xem và giải thích bài ngay cho bạn nhé!" }
  ],
  aiInput: "",
  isAskingAi: false,
  showExitModal: false,
  showCelebrationModal: false,
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
    if (window.electronAPI && typeof window.electronAPI.setFullscreen === "function") {
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
    if (window.electronAPI && typeof window.electronAPI.setFullscreen === "function") {
      await window.electronAPI.setFullscreen(false);
    } else if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen().catch(() => {});
    }
  } catch {}

  document.body.classList.remove("pomodoro-kiosk-mode");
}

// Emergency Exit (Ctrl + Q)
window.addEventListener("keydown", (e) => {
  if (pomodoroState.active && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "q") {
    e.preventDefault();
    e.stopPropagation();
    openPomodoroExitConfirm();
  }
});

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
      pomodoroState.peersCount = peersRes.groupPeers || 5;
      pomodoroState.groupName = peersRes.groupName || "hú";
      pomodoroState.peerStatusText = peersRes.statusText || `Đang có ${pomodoroState.peersCount} bạn trong nhóm '${pomodoroState.groupName}' cùng ngồi học`;
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

// ========================================================
// 6. MULTI-DOCUMENT MANAGEMENT
// ========================================================
export function addMultipleLocalFiles(fileList) {
  if (!fileList || fileList.length === 0) return;

  Array.from(fileList).forEach(file => {
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isImage = file.type.startsWith("image/");
    const docId = "doc_" + Math.random().toString(36).slice(2, 9);

    const reader = new FileReader();
    if (isImage) {
      reader.onload = (e) => {
        pomodoroState.docs.push({
          id: docId,
          name: file.name,
          type: "image",
          content: e.target.result
        });
        if (!pomodoroState.activeDocId) pomodoroState.activeDocId = docId;
        if (window.render) window.render();
      };
      reader.readAsDataURL(file);
    } else if (isPdf) {
      reader.onload = (e) => {
        pomodoroState.docs.push({
          id: docId,
          name: file.name,
          type: "pdf",
          content: e.target.result
        });
        if (!pomodoroState.activeDocId) pomodoroState.activeDocId = docId;
        if (window.render) window.render();
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (e) => {
        pomodoroState.docs.push({
          id: docId,
          name: file.name,
          type: "text",
          content: e.target.result
        });
        if (!pomodoroState.activeDocId) pomodoroState.activeDocId = docId;
        if (window.render) window.render();
      };
      reader.readAsText(file);
    }
  });

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
      content: note.content || ""
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
  if (pomodoroState.aiReadScreenContext && activeDoc && activeDoc.content) {
    const textSnippet = activeDoc.type === "image" 
      ? `(Người học đang mở ảnh sơ đồ/tài liệu: ${activeDoc.name})`
      : activeDoc.content.slice(0, 3500);
    contextDoc = `\n\n[NGỮ CẢNH TÀI LIỆU ĐANG HIỂN THỊ TRÊN MÀN HÌNH - "${activeDoc.name}"]:\n${textSnippet}\n[HÃY GIẢI ĐÁP DỰA TRÊN TÀI LIỆU TRÊN NẾU CÓ LIÊN QUAN]`;
  }

  try {
    const res = await callApi("/api/chat", {
      method: "POST",
      body: {
        message: prompt + contextDoc
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
        ${safeEsc(m.text)}
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

          <!-- PEER STATUS BANNER -->
          <div class="pomodoro-peers-banner">
            <span class="pomodoro-live-dot"></span>
            <span class="pomodoro-peers-text">${pomodoroState.peerStatusText}</span>
            <div class="pomodoro-peer-avatars">
              <span class="peer-avatar-circle" style="background:#ff4b82;">🐰</span>
              <span class="peer-avatar-circle" style="background:#1cb0f6;">🌸</span>
              <span class="peer-avatar-circle" style="background:#58cc02;">⭐</span>
              <span class="peer-avatar-plus">+${Math.max(1, pomodoroState.peersCount - 3)}</span>
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
          <input type="file" id="pomo-multi-file-input" style="display:none;" multiple accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp" onchange="window.handlePomoMultiFilesSelected(this)">

          <!-- Document List Box -->
          <div class="pomo-selected-docs-box">
            ${pomodoroState.docs.length > 0 ? `
              <div class="pomo-docs-chip-list">
                ${pomodoroState.docs.map(doc => `
                  <div class="pomo-doc-badge ${doc.id === pomodoroState.activeDocId ? 'active' : ''}">
                    <span class="doc-badge-icon">${doc.type === 'pdf' ? '📑' : doc.type === 'image' ? '🖼️' : '📝'}</span>
                    <span class="doc-badge-name" title="${safeEsc(doc.name)}">${safeEsc(doc.name)}</span>
                    <button type="button" class="doc-badge-del" title="Xóa" onclick="window.removeDoc('${doc.id}', event)">✕</button>
                  </div>
                `).join("")}
              </div>
            ` : `
              <div class="doc-upload-dropzone" onclick="document.getElementById('pomo-multi-file-input').click()">
                <div class="dropzone-icon">📁</div>
                <strong>Nhấp hoặc kéo thả nhiều tệp vào đây</strong>
                <span>Hỗ trợ chọn cùng lúc nhiều file PDF, Text (.txt, .md), hoặc Ảnh</span>
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
          <h2 class="setup-card-title">🎵 Chọn âm thanh kích thích não bộ</h2>
          <p class="setup-card-desc">Âm thanh phòng học tự nhiên giúp tăng 40% khả năng tập trung (100% Offline).</p>

          <div class="ambience-chips-grid">
            <label class="ambience-chip-label">
              <input type="radio" name="pomo-ambience" value="lofi" ${pomodoroAudio.activeChannel === 'lofi' || pomodoroAudio.activeChannel === 'none' ? 'checked' : ''} onchange="window.pomodoroAudio.playChannel('lofi')">
              <div class="ambience-chip-card">
                <span class="chip-icon">🎵</span>
                <strong>Lofi Beats</strong>
                <small>Piano & Vinyl chill</small>
              </div>
            </label>
            <label class="ambience-chip-label">
              <input type="radio" name="pomo-ambience" value="rain" ${pomodoroAudio.activeChannel === 'rain' ? 'checked' : ''} onchange="window.pomodoroAudio.playChannel('rain')">
              <div class="ambience-chip-card">
                <span class="chip-icon">🌧️</span>
                <strong>Mưa rơi</strong>
                <small>Tiếng mưa rơi êm dịu</small>
              </div>
            </label>
            <label class="ambience-chip-label">
              <input type="radio" name="pomo-ambience" value="cafe" ${pomodoroAudio.activeChannel === 'cafe' ? 'checked' : ''} onchange="window.pomodoroAudio.playChannel('cafe')">
              <div class="ambience-chip-card">
                <span class="chip-icon">☕</span>
                <strong>Quán Cafe</strong>
                <small>Chạm cốc & trò chuyện</small>
              </div>
            </label>
            <label class="ambience-chip-label">
              <input type="radio" name="pomo-ambience" value="book" ${pomodoroAudio.activeChannel === 'book' ? 'checked' : ''} onchange="window.pomodoroAudio.playChannel('book')">
              <div class="ambience-chip-card">
                <span class="chip-icon">📖</span>
                <strong>Lật sách</strong>
                <small>Tiếng lật sách sột soạt</small>
              </div>
            </label>
          </div>

          <div class="volume-slider-row">
            <span>🔊 Âm lượng:</span>
            <input type="range" min="0" max="1" step="0.05" value="${pomodoroAudio.volume}" oninput="window.pomodoroAudio.setVolume(this.value)">
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

          <div class="pomo-topbar-peers">${pomodoroState.peerStatusText}</div>
        </div>

        <div class="pomo-topbar-right">
          <!-- 4 CHILL AUDIO CHANNELS -->
          <div class="pomo-sound-controls">
            <button type="button" class="pomo-sound-btn ${pomodoroAudio.activeChannel === 'lofi' ? 'active' : ''}" title="Lofi Beats" onclick="window.pomodoroAudio.playChannel('lofi'); window.render();">🎵 Lofi</button>
            <button type="button" class="pomo-sound-btn ${pomodoroAudio.activeChannel === 'rain' ? 'active' : ''}" title="Tiếng mưa" onclick="window.pomodoroAudio.playChannel('rain'); window.render();">🌧️ Mưa</button>
            <button type="button" class="pomo-sound-btn ${pomodoroAudio.activeChannel === 'cafe' ? 'active' : ''}" title="Quán Cafe" onclick="window.pomodoroAudio.playChannel('cafe'); window.render();">☕ Cafe</button>
            <button type="button" class="pomo-sound-btn ${pomodoroAudio.activeChannel === 'book' ? 'active' : ''}" title="Lật sách" onclick="window.pomodoroAudio.playChannel('book'); window.render();">📖 Sách</button>
            <button type="button" class="pomo-sound-btn ${pomodoroAudio.activeChannel === 'none' ? 'active' : ''}" title="Tắt âm" onclick="window.pomodoroAudio.stopAll(); window.render();">🔇 Tắt</button>
          </div>

          <!-- EMERGENCY EXIT BUTTON (Ctrl + Q) -->
          <button type="button" class="btn-duo btn-pomo-exit-btn" onclick="window.openPomodoroExitConfirm()" title="Nhấn Ctrl + Q để thoát">
            🚪 Thoát (Ctrl + Q)
          </button>
        </div>
      </header>

      <!-- 3-PANE WORKSPACE: LEFT (DOC TABS) | CENTER (DOCUMENT VIEWER / FULL CLOCK) | RIGHT (AI ASSISTANT TAB) -->
      <main class="pomo-room-body">
        
        <!-- ==================== CỘT TRÁI: TAB DANH SÁCH FILE TÀI LIỆU ==================== -->
        <aside class="pomo-files-sidebar" id="pomo-files-sidebar">
          <div class="pomo-sidebar-header">
            <strong class="sidebar-title">📁 TÀI LIỆU HỌC (${pomodoroState.docs.length})</strong>
            <button type="button" class="btn-sidebar-add" onclick="document.getElementById('pomo-sidebar-file-input').click()" title="Thêm file từ máy">
              ＋ Tệp
            </button>
            <input type="file" id="pomo-sidebar-file-input" style="display:none;" multiple accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp" onchange="window.handlePomoMultiFilesSelected(this)">
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
            ${pomodoroState.docs.map(doc => `
              <div class="pomo-file-item ${doc.id === pomodoroState.activeDocId ? 'active' : ''}" onclick="window.setActiveDoc('${doc.id}')">
                <span class="file-item-icon">${doc.type === 'pdf' ? '📑' : doc.type === 'image' ? '🖼️' : '📝'}</span>
                <span class="file-item-name" title="${safeEsc(doc.name)}">${safeEsc(doc.name)}</span>
                <button type="button" class="file-item-close" title="Gỡ file" onclick="window.removeDoc('${doc.id}', event)">✕</button>
              </div>
            `).join("")}

            ${pomodoroState.docs.length === 0 ? `
              <div class="pomo-files-empty">
                Chưa có tài liệu nào.<br>Bấm <strong>＋ Tệp</strong> để thêm tài liệu học tập vào đây!
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
              <div class="doc-viewer-scrollable-body">
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

              <!-- MASCOT ANIMATION -->
              <div class="pomo-mascot-stage">
                ${isFocus 
                  ? renderThoBayMau({ state: THO_STATES.POMODORO_FOCUS, size: 240 }) 
                  : renderThoBayMau({ state: THO_STATES.POMODORO_BREAK, size: 240 })}
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
        <aside class="pomo-ai-dock ${pomodoroState.aiDockOpen ? 'open' : 'collapsed'}" id="pomo-ai-dock">
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
                  ${safeEsc(m.text)}
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
        <iframe src="${doc.content}" class="pomo-pdf-iframe" title="${safeEsc(doc.name)}"></iframe>
      </div>
    `;
  }

  return `
    <div class="pomo-doc-text-wrap">
      <pre class="pomo-doc-pre">${safeEsc(doc.content)}</pre>
    </div>
  `;
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

window.renderPomodoro = renderPomodoro;
window.loadPomodoroData = loadPomodoroData;
