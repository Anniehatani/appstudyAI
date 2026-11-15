/**
 * 🎧 PHÒNG HỌC ẢO POMODORO & LOFI CÙNG THỎ BẢY MÀU (STUDY WITH ME / ZEN ROOM)
 * =========================================================================
 * - Chu kỳ chuẩn 25m Focus / 5m Break
 * - Thưởng +50 XP và 30 💎 mỗi ca 25 phút hoàn thành
 * - Tích lũy theo ca (1 ca = 1x, 2 ca = 2x, v.v.)
 * - Chế độ Siêu Tập Trung (Zen Mode) / Fullscreen chống phân tâm
 * - Chặn toàn bộ thông báo (DND Mode) khi đang trong phòng
 * - Phím tắt thoát khẩn cấp: Ctrl + Q (hủy ca dở dang nếu chưa hết 25p)
 * - 4 kênh âm thanh Synth Web Audio API chạy 100% Offline (Lofi beat, Mưa rơi, Quán cafe, Tiếng lật sách) + Chuông báo
 * - Mascot Thỏ Bảy Màu động (Cắm cúi viết bài cực hài hước / Nghỉ ngơi trà sữa)
 * - Đính kèm tài liệu học (PDF, Text, Ảnh, Sổ tay ghi chú) hiển thị Split-Screen
 * - Trợ lý Mini Bot 3TG AI hỗ trợ giải bài tức thì không cần rời phòng
 * - Đồng bộ và lưu trữ lịch sử học tập vào Cloudflare D1 & SQLite
 */

import { renderThoBayMau, THO_STATES } from "./tho-bay-mau.js";

// ========================================================
// 1. PROCEDURAL WEB AUDIO API SYNTHESIZER (100% OFFLINE)
// ========================================================
export class PomodoroAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.activeChannel = "none"; // "lofi" | "rain" | "cafe" | "book" | "none"
    this.volume = 0.7; // 0.0 -> 1.0
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
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.07;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(220, this.ctx.currentTime);
    lfo.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.65, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start();
    lfo.start();
    this.nodes.push(whiteNoise, filter, lfo, lfoGain, gain);
  }

  // --- Lofi Beats Generator (Rhodes E-Piano, Sub Kick, Rimshot & Tape Crackle) ---
  startLofiBeats() {
    // 1. Vinyl tape crackle
    const bufLen = this.ctx.sampleRate * 2;
    const crackleBuf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const data = crackleBuf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      if (Math.random() < 0.001) {
        data[i] = (Math.random() * 2 - 1) * 0.16;
      } else {
        data[i] = (Math.random() * 2 - 1) * 0.01;
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
    crackleGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    crackle.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(this.masterGain);
    crackle.start();
    this.nodes.push(crackle, crackleFilter, crackleGain);

    // 2. Chords sequencer (Cmaj7, Am7, Dm7, G7)
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
        chordGain.gain.exponentialRampToValueAtTime(0.055, now + 0.08);
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
        g.gain.setValueAtTime(0.2, now);
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
        g.gain.setValueAtTime(0.12, now);
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

  // --- Cafe Ambiance ---
  startCafeAmbiance() {
    const bufLen = this.ctx.sampleRate * 3;
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * 0.045;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.9, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
    this.nodes.push(noise, filter, gain);

    const clinkInterval = setInterval(() => {
      if (this.activeChannel !== "cafe" || !this.ctx) return;
      if (Math.random() < 0.4) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const cg = this.ctx.createGain();
        osc.frequency.setValueAtTime(1900 + Math.random() * 700, now);
        cg.gain.setValueAtTime(0.035, now);
        cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        osc.connect(cg);
        cg.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.16);
      }
    }, 4000);
    this.intervalIds.push(clinkInterval);
  }

  // --- Book / Library Ambiance ---
  startBookFlipAmbiance() {
    const bufLen = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * 0.012;
    const roomTone = this.ctx.createBufferSource();
    roomTone.buffer = buf;
    roomTone.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(550, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    roomTone.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    roomTone.start();
    this.nodes.push(roomTone, filter, gain);

    const flipPage = () => {
      if (this.activeChannel !== "book" || !this.ctx) return;
      const now = this.ctx.currentTime;
      const fBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.32), this.ctx.sampleRate);
      const fd = fBuf.getChannelData(0);
      for (let i = 0; i < fd.length; i++) {
        const env = Math.sin((i / fd.length) * Math.PI);
        fd[i] = (Math.random() * 2 - 1) * env * 0.11;
      }
      const pageSrc = this.ctx.createBufferSource();
      pageSrc.buffer = fBuf;
      const pFlt = this.ctx.createBiquadFilter();
      pFlt.type = "bandpass";
      pFlt.frequency.setValueAtTime(1500, now);
      pFlt.Q.setValueAtTime(1.4, now);
      const pGain = this.ctx.createGain();
      pGain.gain.setValueAtTime(0.3, now);
      pageSrc.connect(pFlt);
      pFlt.connect(pGain);
      pGain.connect(this.masterGain);
      pageSrc.start(now);
    };

    const bookInterval = setInterval(flipPage, 8000);
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

      g.gain.setValueAtTime(0.18 / (idx + 1), now + idx * 0.05);
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
  currentDoc: null, // { name: "", type: "text"|"pdf"|"image"|"note", content: "" }
  isDocExpanded: true,
  history: [],
  totalFocusMinutes: 0,
  totalCycles: 0,
  todayCycles: 0,
  peersCount: 5,
  groupName: "hú",
  peerStatusText: "Đang có 5 bạn trong nhóm 'hú' cùng ngồi học",
  quotesTimer: null,
  currentQuote: "Học đi không là sau này đi bốc vác đấy! ✍️",
  aiDrawerOpen: false,
  aiChatHistory: [
    { sender: "bot", text: "Xin chào! Mình là Trợ lý Bot 3TG trong phòng học Pomodoro 🎧 Bạn có câu hỏi nào về tài liệu hay bài học cần giải đáp không?" }
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
  window._isPomodoroActive = true; // DND: Block all notifications & popups

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
  window._isPomodoroActive = false; // Restore notifications

  try {
    if (window.electronAPI && typeof window.electronAPI.setFullscreen === "function") {
      await window.electronAPI.setFullscreen(false);
    } else if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen().catch(() => {});
    }
  } catch {}

  document.body.classList.remove("pomodoro-kiosk-mode");
}

// Keyboard shortcut Ctrl + Q emergency exit listener
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

  enterPomodoroKiosk();

  // Start sound if selected
  const soundSelect = document.getElementById("pomo-ambient-select");
  const selectedChannel = soundSelect ? soundSelect.value : (pomodoroAudio.activeChannel !== "none" ? pomodoroAudio.activeChannel : "lofi");
  pomodoroAudio.playChannel(selectedChannel);

  // Clear previous intervals
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
    // Phase completion!
    pomodoroAudio.playCompletionBell();

    if (pomodoroState.mode === "focus") {
      // Completed 25 minutes Focus Cycle!
      pomodoroState.completedCycles++;
      handleFocusCycleCompleted();
    } else {
      // Completed 5 minutes Break Cycle -> Automatically start next focus cycle
      pomodoroState.mode = "focus";
      pomodoroState.remainingSeconds = pomodoroState.focusDuration;
      pomodoroState.currentQuote = getRandomQuote("focus");
      if (window.showToast) window.showToast("🔔 Hết 5 phút nghỉ! Bắt đầu ca học tiếp theo ngay nào! 🚀");
      if (window.render) window.render();
    }
  }
}

async function handleFocusCycleCompleted() {
  // Award +50 XP and 30 💎 via API
  const xpAwarded = 50;
  const gemsAwarded = 30;
  pomodoroState.lastRewardXp = xpAwarded;
  pomodoroState.lastRewardGems = gemsAwarded;

  try {
    const res = await window.api("/api/pomodoro/complete", {
      method: "POST",
      body: {
        cycles: 1,
        focusMinutes: 25,
        docName: pomodoroState.currentDoc ? pomodoroState.currentDoc.name : null
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

  // Switch to Break Mode (5 minutes)
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
  // Stops session and leaves kiosk mode
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
      window.api("/api/pomodoro/peers").catch(() => null),
      window.api("/api/pomodoro/history").catch(() => null)
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
// 6. MINI BOT 3TG AI ASSISTANT DRAWER
// ========================================================
export function togglePomodoroAiDrawer() {
  pomodoroState.aiDrawerOpen = !pomodoroState.aiDrawerOpen;
  const drawer = document.getElementById("pomodoro-ai-drawer");
  if (drawer) {
    drawer.classList.toggle("open", pomodoroState.aiDrawerOpen);
  }
}

export async function askPomodoroAi(customPrompt = null) {
  const prompt = customPrompt || pomodoroState.aiInput;
  if (!prompt || !prompt.trim() || pomodoroState.isAskingAi) return;

  pomodoroState.isAskingAi = true;
  pomodoroState.aiChatHistory.push({ sender: "user", text: prompt.trim() });
  pomodoroState.aiInput = "";
  renderPomodoroAiMessages();

  let contextDoc = "";
  if (pomodoroState.currentDoc && pomodoroState.currentDoc.content) {
    contextDoc = `\n[Tài liệu đang học: ${pomodoroState.currentDoc.name}]:\n${pomodoroState.currentDoc.content.slice(0, 1500)}`;
  }

  try {
    const res = await window.api("/api/chat", {
      method: "POST",
      body: {
        message: prompt + contextDoc
      }
    });

    const reply = res?.reply || res?.message || "Thỏ Bảy Màu đã hiểu bài này! Cố lên nhé bạn!";
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
        ${window.esc ? window.esc(m.text) : m.text}
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
    await window.api("/api/notes", {
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
// 7. DOCUMENT ATTACHMENT & SPLIT-VIEW CONTROLLER
// ========================================================
export function handleAttachLocalFile(file) {
  if (!file) return;

  const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
  const isImage = file.type.startsWith("image/");
  const isText = file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md");

  const reader = new FileReader();

  if (isImage) {
    reader.onload = (e) => {
      pomodoroState.currentDoc = {
        name: file.name,
        type: "image",
        content: e.target.result
      };
      if (window.showToast) window.showToast(`Đã đính kèm ảnh "${file.name}"! 🖼️`);
      if (window.render) window.render();
    };
    reader.readAsDataURL(file);
  } else if (isPdf) {
    reader.onload = (e) => {
      pomodoroState.currentDoc = {
        name: file.name,
        type: "pdf",
        content: e.target.result
      };
      if (window.showToast) window.showToast(`Đã đính kèm PDF "${file.name}"! 📑`);
      if (window.render) window.render();
    };
    reader.readAsDataURL(file);
  } else {
    reader.onload = (e) => {
      pomodoroState.currentDoc = {
        name: file.name,
        type: "text",
        content: e.target.result
      };
      if (window.showToast) window.showToast(`Đã đính kèm tài liệu "${file.name}"! 📄`);
      if (window.render) window.render();
    };
    reader.readAsText(file);
  }
}

export function handleAttachNote(noteId) {
  if (!window.state || !window.state.notes) return;
  const note = window.state.notes.find(n => String(n.id) === String(noteId));
  if (note) {
    pomodoroState.currentDoc = {
      name: note.title || "Ghi chú không tên",
      type: "note",
      content: note.content || ""
    };
    if (window.showToast) window.showToast(`Đã chọn ghi chú "${pomodoroState.currentDoc.name}"! 📝`);
    if (window.render) window.render();
  }
}

export function clearAttachedDoc() {
  pomodoroState.currentDoc = null;
  if (window.render) window.render();
}

export function toggleDocSplitView() {
  pomodoroState.isDocExpanded = !pomodoroState.isDocExpanded;
  const docPane = document.getElementById("pomo-doc-pane");
  const mainPane = document.getElementById("pomo-main-pane");
  if (docPane && mainPane) {
    docPane.classList.toggle("collapsed", !pomodoroState.isDocExpanded);
    mainPane.classList.toggle("full-zen", !pomodoroState.isDocExpanded);
  }
}

// ========================================================
// 8. RENDERERS (LOBBY & ACTIVE ROOM)
// ========================================================

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function updatePomodoroDisplayInDom() {
  const timeEl = document.getElementById("pomo-clock-time");
  if (timeEl) timeEl.textContent = formatTime(pomodoroState.remainingSeconds);

  const ringEl = document.getElementById("pomo-progress-ring-circle");
  if (ringEl) {
    const total = pomodoroState.mode === "focus" ? pomodoroState.focusDuration : pomodoroState.breakDuration;
    const progress = (total - pomodoroState.remainingSeconds) / total;
    const circumference = 2 * Math.PI * 110; // r = 110
    const offset = circumference * (1 - progress);
    ringEl.style.strokeDashoffset = offset;
  }

  const pauseBtn = document.getElementById("pomo-pause-btn");
  if (pauseBtn) {
    pauseBtn.innerHTML = pomodoroState.isPaused ? "▶ Tiếp tục" : "⏸ Tạm dừng";
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

// Master Render Function
export function renderPomodoro() {
  if (pomodoroState.active) {
    return renderPomodoroActiveRoom();
  }
  return renderPomodoroLobby();
}

// --- LOBBY SCREEN (Trước khi vào phòng) ---
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
            Cùng bạn bè ôn thi cuối kỳ, tập trung tuyệt đối không lướt điện thoại! Chu kỳ chuẩn 25 phút học / 5 phút nghỉ, âm thanh Lofi kích thích não bộ và nhận thưởng xứng đáng.
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

      <!-- REWARD RULES CALLOUT -->
      <div class="pomodoro-rules-card">
        <div class="rule-box">
          <div class="rule-icon">⏱️</div>
          <div class="rule-content">
            <strong>25 Phút Siêu Tập Trung</strong>
            <span>Khóa chế độ toàn màn hình, tắt thông báo máy tính để tập trung tối đa như Safe Exam Browser.</span>
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

      <!-- MAIN SETUP GRID -->
      <div class="pomodoro-setup-grid">
        <!-- LEFT: STUDY DOCUMENT SELECTION -->
        <div class="pomodoro-setup-card">
          <h2 class="setup-card-title">📑 Chọn tài liệu cần học (Tùy chọn)</h2>
          <p class="setup-card-desc">Gửi file hoặc chọn ghi chú để hiển thị chia đôi màn hình cùng đồng hồ học tập.</p>

          ${pomodoroState.currentDoc ? `
            <div class="attached-doc-banner">
              <span class="doc-icon">${pomodoroState.currentDoc.type === 'pdf' ? '📑' : pomodoroState.currentDoc.type === 'image' ? '🖼️' : '📝'}</span>
              <div class="doc-info">
                <strong>${window.esc ? window.esc(pomodoroState.currentDoc.name) : pomodoroState.currentDoc.name}</strong>
                <small>${pomodoroState.currentDoc.type.toUpperCase()}</small>
              </div>
              <button type="button" class="btn-remove-doc" onclick="window.clearAttachedDoc()">Gỡ bỏ ✕</button>
            </div>
          ` : `
            <div class="doc-upload-dropzone" onclick="document.getElementById('pomo-file-input').click()">
              <input type="file" id="pomo-file-input" style="display:none;" accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp" onchange="window.handlePomoFileSelected(this)">
              <div class="dropzone-icon">📁</div>
              <strong>Nhấp để tải tệp từ máy tính</strong>
              <span>Hỗ trợ PDF, Text (.txt, .md), hoặc Ảnh tóm tắt bài học</span>
            </div>

            <div class="doc-or-divider"><span>HOẶC CHỌN TỪ SỔ TAY GHI CHÚ</span></div>

            <select class="form-input pomo-notes-select" onchange="window.handlePomoNoteSelected(this.value)">
              <option value="">-- Chọn bài ghi chú từ Sổ tay 3TG --</option>
              ${notesList.map(n => `<option value="${n.id}">${window.esc ? window.esc(n.title || 'Ghi chú không tên') : n.title}</option>`).join("")}
            </select>
          `}
        </div>

        <!-- RIGHT: AMBIENCE & ACTION -->
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
                <small>Không gian ấm cúng</small>
              </div>
            </label>
            <label class="ambience-chip-label">
              <input type="radio" name="pomo-ambience" value="book" ${pomodoroAudio.activeChannel === 'book' ? 'checked' : ''} onchange="window.pomodoroAudio.playChannel('book')">
              <div class="ambience-chip-card">
                <span class="chip-icon">📖</span>
                <strong>Lật sách</strong>
                <small>Tiếng thư viện yên tĩnh</small>
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
                    <td><strong>${window.esc ? window.esc(s.doc_name || 'Học tập trung tự do') : (s.doc_name || 'Học tập trung tự do')}</strong></td>
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

// --- ACTIVE ROOM SCREEN (Toàn màn hình Zen & Chia đôi màn hình) ---
function renderPomodoroActiveRoom() {
  const isFocus = pomodoroState.mode === "focus";
  const hasDoc = Boolean(pomodoroState.currentDoc);

  return `
    <div class="pomodoro-active-room ${isFocus ? 'focus-phase' : 'break-phase'}">
      <!-- TOP STATUS & TOOLBAR BAR -->
      <header class="pomo-room-topbar">
        <div class="pomo-topbar-left">
          <div class="pomo-room-badge">
            <span class="pomo-live-dot"></span>
            <span>${isFocus ? '🎯 CA HỌC TẬP TRUNG #' + (pomodoroState.completedCycles + 1) : '☕ GIỜ NGHỈ GIẢI LAO'}</span>
          </div>
          <div class="pomo-topbar-peers">${pomodoroState.peerStatusText}</div>
        </div>

        <div class="pomo-topbar-right">
          <!-- Quick Sound Selector -->
          <div class="pomo-sound-controls">
            <button type="button" class="pomo-sound-btn ${pomodoroAudio.activeChannel === 'lofi' ? 'active' : ''}" title="Lofi Beats" onclick="window.pomodoroAudio.playChannel('lofi'); window.render();">🎵 Lofi</button>
            <button type="button" class="pomo-sound-btn ${pomodoroAudio.activeChannel === 'rain' ? 'active' : ''}" title="Tiếng mưa" onclick="window.pomodoroAudio.playChannel('rain'); window.render();">🌧️ Mưa</button>
            <button type="button" class="pomo-sound-btn ${pomodoroAudio.activeChannel === 'cafe' ? 'active' : ''}" title="Quán Cafe" onclick="window.pomodoroAudio.playChannel('cafe'); window.render();">☕ Cafe</button>
            <button type="button" class="pomo-sound-btn ${pomodoroAudio.activeChannel === 'book' ? 'active' : ''}" title="Lật sách" onclick="window.pomodoroAudio.playChannel('book'); window.render();">📖 Sách</button>
            <button type="button" class="pomo-sound-btn ${pomodoroAudio.activeChannel === 'none' ? 'active' : ''}" title="Tắt tiếng" onclick="window.pomodoroAudio.stopAll(); window.render();">🔇 Tắt</button>
          </div>

          <!-- Mini Bot 3TG Drawer Toggle -->
          <button type="button" class="btn-duo btn-duo-white pomo-ai-drawer-btn" onclick="window.togglePomodoroAiDrawer()">
            💬 Hỏi Bot 3TG
          </button>

          <!-- Emergency Exit Button -->
          <button type="button" class="btn-duo btn-pomo-exit-btn" onclick="window.openPomodoroExitConfirm()" title="Nhấn Ctrl + Q để thoát nhanh">
            🚪 Thoát (Ctrl + Q)
          </button>
        </div>
      </header>

      <!-- SPLIT WORKSPACE BODY -->
      <main class="pomo-room-body ${hasDoc && pomodoroState.isDocExpanded ? 'with-doc' : 'zen-only'}">
        <!-- LEFT: DOCUMENT VIEWER PANE (IF ATTACHED) -->
        ${hasDoc ? `
          <section class="pomo-doc-pane ${!pomodoroState.isDocExpanded ? 'collapsed' : ''}" id="pomo-doc-pane">
            <div class="pomo-doc-header">
              <div class="pomo-doc-title-row">
                <span class="doc-type-badge">${pomodoroState.currentDoc.type.toUpperCase()}</span>
                <strong class="pomo-doc-name">${window.esc ? window.esc(pomodoroState.currentDoc.name) : pomodoroState.currentDoc.name}</strong>
              </div>
              <button type="button" class="pomo-doc-toggle-btn" onclick="window.toggleDocSplitView()" title="Thu gọn / Mở rộng tài liệu">
                ${pomodoroState.isDocExpanded ? '◀ Thu gọn' : '▶ Xem tài liệu'}
              </button>
            </div>
            <div class="pomo-doc-content-viewer">
              ${renderDocContent(pomodoroState.currentDoc)}
            </div>
          </section>
        ` : ""}

        <!-- RIGHT / CENTER: POMODORO CLOCK & MASCOT ARENA -->
        <section class="pomo-main-pane ${!hasDoc || !pomodoroState.isDocExpanded ? 'full-zen' : ''}" id="pomo-main-pane">
          <!-- SPEECH BUBBLE -->
          <div class="pomo-mascot-speech-wrap">
            <div class="pomo-rabbit-speech-bubble" id="pomo-rabbit-speech-bubble">
              ${pomodoroState.currentQuote}
            </div>
          </div>

          <!-- MASCOT ANIMATION -->
          <div class="pomo-mascot-stage">
            ${isFocus 
              ? renderThoBayMau({ state: THO_STATES.POMODORO_FOCUS, size: 230 }) 
              : renderThoBayMau({ state: THO_STATES.POMODORO_BREAK, size: 230 })}
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
        </section>
      </main>

      <!-- SLIDE-OUT MINI AI DRAWER -->
      <aside class="pomodoro-ai-drawer ${pomodoroState.aiDrawerOpen ? 'open' : ''}" id="pomodoro-ai-drawer">
        <div class="pomo-ai-header">
          <div class="pomo-ai-title">💬 Cố vấn Học vụ Bot 3TG AI</div>
          <button type="button" class="pomo-ai-close-btn" onclick="window.togglePomodoroAiDrawer()">✕</button>
        </div>
        <div class="pomo-ai-quick-prompts">
          <button type="button" class="ai-chip" onclick="window.askPomodoroAi('Tóm tắt 3 ý trọng tâm của tài liệu này')">📌 Tóm tắt 3 ý chính</button>
          <button type="button" class="ai-chip" onclick="window.askPomodoroAi('Giải thích công thức này bằng ví dụ dễ hiểu')">💡 Giải thích dễ hiểu</button>
          <button type="button" class="ai-chip" onclick="window.askPomodoroAi('Cho tôi 2 câu hỏi trắc nghiệm tự luyện')">🎯 2 câu trắc nghiệm</button>
        </div>
        <div class="pomo-ai-chat-thread" id="pomo-ai-chat-thread">
          ${pomodoroState.aiChatHistory.map(m => `
            <div class="pomo-ai-bubble ${m.sender}">
              <div class="pomo-ai-avatar">${m.sender === "bot" ? "🐰" : "👤"}</div>
              <div class="pomo-ai-text">
                ${window.esc ? window.esc(m.text) : m.text}
                ${m.sender === "bot" ? `
                  <button type="button" class="pomo-ai-save-btn" onclick="window.savePomoAiToNotes('${encodeURIComponent(m.text)}')">
                    💾 Lưu vào Sổ tay
                  </button>
                ` : ""}
              </div>
            </div>
          `).join("")}
        </div>
        <div class="pomo-ai-footer">
          <input type="text" class="pomo-ai-input" placeholder="Hỏi Bot 3TG về bài học..." value="${pomodoroState.aiInput}" 
                 oninput="window.pomodoroState.aiInput = this.value" onkeydown="if(event.key === 'Enter') window.askPomodoroAi()">
          <button type="button" class="pomo-ai-send-btn" onclick="window.askPomodoroAi()">Gửi ➔</button>
        </div>
      </aside>

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
    return `<div class="pomo-doc-img-wrap"><img src="${doc.content}" alt="${doc.name}" class="pomo-doc-image"></div>`;
  }

  if (doc.type === "pdf") {
    return `
      <div class="pomo-doc-pdf-wrap">
        <iframe src="${doc.content}" class="pomo-pdf-iframe" title="${doc.name}"></iframe>
      </div>
    `;
  }

  return `
    <div class="pomo-doc-text-wrap">
      <pre class="pomo-doc-pre">${window.esc ? window.esc(doc.content) : doc.content}</pre>
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
window.togglePomodoroAiDrawer = togglePomodoroAiDrawer;
window.askPomodoroAi = askPomodoroAi;
window.handlePomoFileSelected = (input) => {
  if (input.files && input.files[0]) handleAttachLocalFile(input.files[0]);
};
window.handlePomoNoteSelected = handleAttachNote;
window.clearAttachedDoc = clearAttachedDoc;
window.toggleDocSplitView = toggleDocSplitView;
window.renderPomodoro = renderPomodoro;
window.loadPomodoroData = loadPomodoroData;
