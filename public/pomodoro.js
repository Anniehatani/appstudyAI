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
    this.volume = 0.42; // Safe, pleasant background listening volume
    this.nodes = [];
    this.intervalIds = [];
    this.timeoutIds = [];
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
    this.timeoutIds.forEach(id => clearTimeout(id));
    this.timeoutIds = [];
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

  // --- Rain Generator (Deep Multi-layered Pink/Brown Noise + Gentle Droplets & Distant Thunder) ---
  startRainSound() {
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 8;
    const noiseBuffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    const left = noiseBuffer.getChannelData(0);
    const right = noiseBuffer.getChannelData(1);

    let b0L = 0, b1L = 0, b2L = 0, b3L = 0, b4L = 0, b5L = 0, b6L = 0;
    let b0R = 0, b1R = 0, b2R = 0, b3R = 0, b4R = 0, b5R = 0, b6R = 0;

    for (let i = 0; i < bufferSize; i++) {
      const whiteL = Math.random() * 2 - 1;
      b0L = 0.99886 * b0L + whiteL * 0.0555179;
      b1L = 0.99332 * b1L + whiteL * 0.0750759;
      b2L = 0.96900 * b2L + whiteL * 0.1538520;
      b3L = 0.86650 * b3L + whiteL * 0.3104856;
      b4L = 0.55000 * b4L + whiteL * 0.5329522;
      b5L = -0.7616 * b5L - whiteL * 0.0168980;
      left[i] = (b0L + b1L + b2L + b3L + b4L + b5L + b6L + whiteL * 0.5362) * 0.045;
      b6L = whiteL * 0.115926;

      const whiteR = Math.random() * 2 - 1;
      b0R = 0.99886 * b0R + whiteR * 0.0555179;
      b1R = 0.99332 * b1R + whiteR * 0.0750759;
      b2R = 0.96900 * b2R + whiteR * 0.1538520;
      b3R = 0.86650 * b3R + whiteR * 0.3104856;
      b4R = 0.55000 * b4R + whiteR * 0.5329522;
      b5R = -0.7616 * b5R - whiteR * 0.0168980;
      right[i] = (b0R + b1R + b2R + b3R + b4R + b5R + b6R + whiteR * 0.5362) * 0.045;
      b6R = whiteR * 0.115926;
    }

    const rainSrc = this.ctx.createBufferSource();
    rainSrc.buffer = noiseBuffer;
    rainSrc.loop = true;

    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = "lowpass";
    filter1.frequency.setValueAtTime(680, now);

    const filter2 = this.ctx.createBiquadFilter();
    filter2.type = "highpass";
    filter2.frequency.setValueAtTime(110, now);

    // Natural slow swell LFO
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.04, now);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(160, now);
    lfo.connect(filter1.frequency);

    // Smooth 0.8s fade in - never shocks the user's ears
    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.001, now);
    rainGain.gain.linearRampToValueAtTime(0.22, now + 0.8);

    rainSrc.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(rainGain);
    rainGain.connect(this.masterGain);

    rainSrc.start(now);
    lfo.start(now);
    this.nodes.push(rainSrc, filter1, filter2, lfo, lfoGain, rainGain);

    // Natural random water droplet clicks (Poisson distribution)
    const playDroplet = () => {
      if (this.activeChannel !== "rain" || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const baseFreq = 1900 + Math.random() * 1400;
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(650, t + 0.035);

      const dropVol = 0.02 + Math.random() * 0.03;
      g.gain.setValueAtTime(dropVol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.045);

      const nextDelay = 400 + Math.random() * 1000;
      const tid = setTimeout(playDroplet, nextDelay);
      this.timeoutIds.push(tid);
    };
    playDroplet();

    // Occasional gentle distant thunder rumble
    const playDistantThunder = () => {
      if (this.activeChannel !== "rain" || !this.ctx) return;
      const t = this.ctx.currentTime;
      const tDur = 4.0;
      const tBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * tDur), this.ctx.sampleRate);
      const td = tBuf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < td.length; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + (0.04 * white)) / 1.04;
        const progress = i / td.length;
        const env = Math.sin(progress * Math.PI) ** 1.8;
        td[i] = last * env * 2.2;
      }
      const tSrc = this.ctx.createBufferSource();
      tSrc.buffer = tBuf;
      const tFlt = this.ctx.createBiquadFilter();
      tFlt.type = "lowpass";
      tFlt.frequency.setValueAtTime(70, t);
      const tG = this.ctx.createGain();
      tG.gain.setValueAtTime(0.24, t);
      tSrc.connect(tFlt);
      tFlt.connect(tG);
      tG.connect(this.masterGain);
      tSrc.start(t);

      const nextThunder = 50000 + Math.random() * 40000;
      const thunderId = setTimeout(playDistantThunder, nextThunder);
      this.timeoutIds.push(thunderId);
    };
    const firstThunderId = setTimeout(playDistantThunder, 24000);
    this.timeoutIds.push(firstThunderId);
  }

  // --- Lofi Beats Generator (Authentic Groovy Boom-Bap Drums, Warm Rhodes Chords, Tape Flutter) ---
  startLofiBeats() {
    const now = this.ctx.currentTime;

    // 1. Subtle Vinyl Crackle & Tape Flutter Bed (soft & smooth)
    const bufLen = this.ctx.sampleRate * 4;
    const crackleBuf = this.ctx.createBuffer(2, bufLen, this.ctx.sampleRate);
    const cLeft = crackleBuf.getChannelData(0);
    const cRight = crackleBuf.getChannelData(1);
    for (let i = 0; i < bufLen; i++) {
      if (Math.random() < 0.0006) {
        cLeft[i] = (Math.random() * 2 - 1) * 0.08;
        cRight[i] = (Math.random() * 2 - 1) * 0.08;
      } else {
        cLeft[i] = (Math.random() * 2 - 1) * 0.005;
        cRight[i] = (Math.random() * 2 - 1) * 0.005;
      }
    }
    const crackle = this.ctx.createBufferSource();
    crackle.buffer = crackleBuf;
    crackle.loop = true;

    const crackleFilter = this.ctx.createBiquadFilter();
    crackleFilter.type = "bandpass";
    crackleFilter.frequency.setValueAtTime(1400, now);
    crackleFilter.Q.setValueAtTime(0.9, now);

    const crackleGain = this.ctx.createGain();
    crackleGain.gain.setValueAtTime(0.001, now);
    crackleGain.gain.linearRampToValueAtTime(0.12, now + 0.8);

    crackle.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(this.masterGain);
    crackle.start(now);
    this.nodes.push(crackle, crackleFilter, crackleGain);

    // 2. Rich 16-Bar Jazz Progression
    const progression = [
      [174.61, 261.63, 329.63, 392.00, 440.00], // Fmaj9
      [164.81, 246.94, 329.63, 392.00, 440.00], // Em7(b13)
      [146.83, 220.00, 261.63, 329.63, 349.23], // Dm9
      [130.81, 220.00, 261.63, 329.63, 392.00], // Am7/C
      [116.54, 233.08, 293.66, 349.23, 440.00], // Bbmaj7
      [110.00, 220.00, 261.63, 329.63, 392.00, 493.88], // Am9
      [98.00, 196.00, 261.63, 293.66, 349.23],  // Gm9
      [130.81, 196.00, 261.63, 349.23, 440.00], // C13sus4
      [146.83, 220.00, 261.63, 329.63, 349.23], // Dm9
      [98.00, 196.00, 246.94, 329.63, 349.23, 440.00], // G13
      [130.81, 196.00, 246.94, 293.66, 329.63, 392.00], // Cmaj9
      [110.00, 220.00, 277.18, 329.63, 370.00, 415.30], // A7alt
      [146.83, 220.00, 261.63, 329.63, 349.23], // Dm9
      [98.00, 196.00, 261.63, 293.66, 349.23, 392.00], // G9sus4
      [130.81, 196.00, 246.94, 329.63, 392.00], // Cmaj9
      [130.81, 196.00, 246.94, 329.63]          // Cmaj7
    ];

    let chordStep = 0;
    const bpm = 68;
    const beatSec = 60 / bpm; // ~0.882s
    const barSec = beatSec * 4;

    // Rhodes E-Piano with warm decay
    const playWarmRhodes = (freqs) => {
      if (!this.ctx || this.activeChannel !== "lofi") return;
      const t = this.ctx.currentTime;
      freqs.forEach((freq, idx) => {
        const strumOffset = idx * 0.022;
        const startTime = t + strumOffset;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        const flt = this.ctx.createBiquadFilter();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(freq, startTime);

        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(freq * 1.002, startTime);

        flt.type = "lowpass";
        flt.frequency.setValueAtTime(850, startTime);
        flt.frequency.exponentialRampToValueAtTime(450, startTime + barSec * 0.85);

        // Gentle volume velocity
        const velocity = (0.042 / (idx + 1)) * (0.8 + Math.random() * 0.3);
        noteGain.gain.setValueAtTime(0.0001, startTime);
        noteGain.gain.exponentialRampToValueAtTime(velocity, startTime + 0.08);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + barSec * 0.95);

        osc1.connect(flt);
        osc2.connect(flt);
        flt.connect(noteGain);
        noteGain.connect(this.masterGain);

        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + barSec);
        osc2.stop(startTime + barSec);
      });
    };

    // PUNCHY, AUDIBLE BOOM-BAP DRUM SYNTHESIS
    const playLofiDrum = (type) => {
      if (!this.ctx || this.activeChannel !== "lofi") return;
      const t = this.ctx.currentTime;

      if (type === "kick") {
        // 1. Low Punch Sine Sweep (160Hz -> 48Hz)
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(48, t + 0.18);
        g.gain.setValueAtTime(0.38, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.25);

        // 2. Click Transient (Makes kick clearly audible on laptops & phones)
        const clickBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.015), this.ctx.sampleRate);
        const cd = clickBuf.getChannelData(0);
        for (let i = 0; i < cd.length; i++) cd[i] = (Math.random() * 2 - 1) * Math.exp(-i / 100);
        const clickSrc = this.ctx.createBufferSource();
        clickSrc.buffer = clickBuf;
        const clickG = this.ctx.createGain();
        clickG.gain.setValueAtTime(0.16, t);
        clickG.gain.exponentialRampToValueAtTime(0.001, t + 0.014);
        clickSrc.connect(clickG);
        clickG.connect(this.masterGain);
        clickSrc.start(t);

      } else if (type === "snare") {
        // Snare Tone Body (210Hz)
        const tone = this.ctx.createOscillator();
        const tg = this.ctx.createGain();
        tone.frequency.setValueAtTime(210, t);
        tone.frequency.exponentialRampToValueAtTime(120, t + 0.08);
        tg.gain.setValueAtTime(0.24, t);
        tg.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        tone.connect(tg);
        tg.connect(this.masterGain);
        tone.start(t);
        tone.stop(t + 0.1);

        // Snappy Rimshot Noise Wire
        const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.14), this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / 500);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const flt = this.ctx.createBiquadFilter();
        flt.type = "bandpass";
        flt.frequency.setValueAtTime(2200, t);
        flt.Q.setValueAtTime(1.8, t);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.26, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
        src.connect(flt);
        flt.connect(g);
        g.connect(this.masterGain);
        src.start(t);

      } else if (type === "hihat") {
        const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.045), this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / 220);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const flt = this.ctx.createBiquadFilter();
        flt.type = "highpass";
        flt.frequency.setValueAtTime(7000, t);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.11 + Math.random() * 0.04, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        src.connect(flt);
        flt.connect(g);
        g.connect(this.masterGain);
        src.start(t);
      }
    };

    // Play initial chords and opening kick immediately!
    playWarmRhodes(progression[0]);
    playLofiDrum("kick");
    playLofiDrum("hihat");

    // 16th-note groovy rhythmic sequencer (4 beats = 16 sub-steps)
    const stepSec = beatSec / 4; // ~0.22s
    let stepCount = 0;

    const drumInterval = setInterval(() => {
      if (this.activeChannel !== "lofi") {
        clearInterval(drumInterval);
        return;
      }
      stepCount++;
      const barStep = stepCount % 16; // 0 to 15 within measure

      // Every new bar (step 0), change chords
      if (barStep === 0) {
        chordStep = (chordStep + 1) % progression.length;
        playWarmRhodes(progression[chordStep]);
      }

      // Classic Lofi Boom-Bap Pattern:
      // Beat 1 (step 0): Kick + Hihat
      if (barStep === 0) {
        playLofiDrum("kick");
        playLofiDrum("hihat");
      }
      // Beat 1 swing upbeat (step 2)
      else if (barStep === 2) {
        playLofiDrum("hihat");
      }
      // Beat 2 (step 4): Snare + Hihat
      else if (barStep === 4) {
        playLofiDrum("snare");
        playLofiDrum("hihat");
      }
      // Beat 2 swing upbeat (step 6)
      else if (barStep === 6) {
        playLofiDrum("hihat");
      }
      // Beat 2.75: Ghost Kick bounce!
      else if (barStep === 7 && Math.random() < 0.7) {
        playLofiDrum("kick");
      }
      // Beat 3 (step 8): Kick + Hihat
      else if (barStep === 8) {
        playLofiDrum("kick");
        playLofiDrum("hihat");
      }
      // Beat 3 swing upbeat (step 10)
      else if (barStep === 10) {
        playLofiDrum("hihat");
      }
      // Beat 4 (step 12): Snare + Hihat
      else if (barStep === 12) {
        playLofiDrum("snare");
        playLofiDrum("hihat");
      }
      // Beat 4 swing upbeat (step 14)
      else if (barStep === 14) {
        playLofiDrum("hihat");
      }
    }, stepSec * 1000);

    this.intervalIds.push(drumInterval);
  }

  // --- OUTDOOR SIDEWALK CAFE AMBIANCE (Pleasant White/Pink Noise Breeze & Lively "Tiếng Tí Tách") ---
  startCafeAmbiance() {
    const now = this.ctx.currentTime;

    // 1. Outdoor sidewalk breeze / white-pink noise background bed
    const bufLen = this.ctx.sampleRate * 6;
    const buf = this.ctx.createBuffer(2, bufLen, this.ctx.sampleRate);
    const dL = buf.getChannelData(0);
    const dR = buf.getChannelData(1);
    for (let i = 0; i < bufLen; i++) {
      dL[i] = (Math.random() * 2 - 1) * 0.04;
      dR[i] = (Math.random() * 2 - 1) * 0.04;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;

    // Outdoor acoustic filter
    const outdoorFlt = this.ctx.createBiquadFilter();
    outdoorFlt.type = "lowpass";
    outdoorFlt.frequency.setValueAtTime(620, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.19, now + 0.8);

    noise.connect(outdoorFlt);
    outdoorFlt.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    this.nodes.push(noise, outdoorFlt, gain);

    // 2. "Tiếng Tí Tách" (Ice Cubes clinking, Ceramic Saucers, Cutlery taps every 4-8s)
    const playTiTachSound = () => {
      if (this.activeChannel !== "cafe" || !this.ctx) return;
      const t = this.ctx.currentTime;
      const type = Math.floor(Math.random() * 3);

      if (type === 0) {
        // Ice cubes in glass clinking (delicate double ping: 3400Hz - 4200Hz)
        [0, 0.09].forEach((offset, idx) => {
          const osc = this.ctx.createOscillator();
          const cg = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(3600 + idx * 400 + Math.random() * 200, t + offset);
          cg.gain.setValueAtTime(0.18, t + offset);
          cg.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.12);
          osc.connect(cg);
          cg.connect(this.masterGain);
          osc.start(t + offset);
          osc.stop(t + offset + 0.14);
        });
      } else if (type === 1) {
        // Ceramic coffee cup & saucer clink (2200Hz - 2800Hz)
        const osc = this.ctx.createOscillator();
        const cg = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(2400 + Math.random() * 400, t);
        cg.gain.setValueAtTime(0.24, t);
        cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        osc.connect(cg);
        cg.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.24);
      } else {
        // Spoon stirring in glass mug (3 micro taps)
        [0, 0.11, 0.22].forEach((offset, idx) => {
          const osc = this.ctx.createOscillator();
          const cg = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(3100 + idx * 250, t + offset);
          cg.gain.setValueAtTime(0.12, t + offset);
          cg.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.08);
          osc.connect(cg);
          cg.connect(this.masterGain);
          osc.start(t + offset);
          osc.stop(t + offset + 0.09);
        });
      }

      // Schedule next "tí tách" at natural cafe intervals (4s - 8s)
      const nextDelay = 4200 + Math.random() * 4200;
      const tid = setTimeout(playTiTachSound, nextDelay);
      this.timeoutIds.push(tid);
    };

    // Play initial cafe clink right upon click
    playTiTachSound();

    // Occasional gentle barista steam wand (every 30s - 55s)
    const playSteam = () => {
      if (this.activeChannel !== "cafe" || !this.ctx) return;
      const t = this.ctx.currentTime;
      const dur = 2.0;
      const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const prog = i / d.length;
        d[i] = (Math.random() * 2 - 1) * Math.sin(prog * Math.PI) * 0.12;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const flt = this.ctx.createBiquadFilter();
      flt.type = "lowpass";
      flt.frequency.setValueAtTime(1800, t);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.16, t);
      src.connect(flt);
      flt.connect(g);
      g.connect(this.masterGain);
      src.start(t);

      const nextSteam = 30000 + Math.random() * 25000;
      const tid = setTimeout(playSteam, nextSteam);
      this.timeoutIds.push(tid);
    };
    const sId = setTimeout(playSteam, 14000);
    this.timeoutIds.push(sId);
  }

  // --- CRISP AUDIBLE BOOK & LIBRARY SOUNDS (Audible Page Rustles, Double Flips & Pencil Notes) ---
  startBookFlipAmbiance() {
    const now = this.ctx.currentTime;

    // 1. Gentle library room acoustic presence
    const bufLen = this.ctx.sampleRate * 4;
    const buf = this.ctx.createBuffer(2, bufLen, this.ctx.sampleRate);
    const dL = buf.getChannelData(0);
    const dR = buf.getChannelData(1);
    for (let i = 0; i < bufLen; i++) {
      dL[i] = (Math.random() * 2 - 1) * 0.035;
      dR[i] = (Math.random() * 2 - 1) * 0.035;
    }
    const roomTone = this.ctx.createBufferSource();
    roomTone.buffer = buf;
    roomTone.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(700, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.6);

    roomTone.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    roomTone.start(now);
    this.nodes.push(roomTone, filter, gain);

    // 2. CLEAR, SATISFYING STUDY SOUND EFFECTS (Every 6-10s)
    const playBookEffect = () => {
      if (this.activeChannel !== "book" || !this.ctx) return;
      const t = this.ctx.currentTime;
      const actionType = Math.floor(Math.random() * 3);

      if (actionType === 0) {
        // Crisp dual-friction paper turn (sliding and settling over 0.38s)
        const dur = 0.38;
        const fBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
        const fd = fBuf.getChannelData(0);
        for (let i = 0; i < fd.length; i++) {
          const progress = i / fd.length;
          const envelope = Math.sin(progress * Math.PI) ** 1.6;
          fd[i] = (Math.random() * 2 - 1) * envelope * 0.75;
        }
        const pageSrc = this.ctx.createBufferSource();
        pageSrc.buffer = fBuf;
        const pFlt = this.ctx.createBiquadFilter();
        pFlt.type = "bandpass";
        pFlt.frequency.setValueAtTime(1600, t);
        pFlt.Q.setValueAtTime(1.6, t);
        const pGain = this.ctx.createGain();
        pGain.gain.setValueAtTime(0.85, t);
        pageSrc.connect(pFlt);
        pFlt.connect(pGain);
        pGain.connect(this.masterGain);
        pageSrc.start(t);

      } else if (actionType === 1) {
        // Quick crisp page flip
        const dur = 0.22;
        const fBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
        const fd = fBuf.getChannelData(0);
        for (let i = 0; i < fd.length; i++) {
          const progress = i / fd.length;
          fd[i] = (Math.random() * 2 - 1) * Math.sin(progress * Math.PI) * 0.8;
        }
        const pageSrc = this.ctx.createBufferSource();
        pageSrc.buffer = fBuf;
        const pFlt = this.ctx.createBiquadFilter();
        pFlt.type = "highpass";
        pFlt.frequency.setValueAtTime(1400, t);
        const pGain = this.ctx.createGain();
        pGain.gain.setValueAtTime(0.72, t);
        pageSrc.connect(pFlt);
        pFlt.connect(pGain);
        pGain.connect(this.masterGain);
        pageSrc.start(t);

      } else {
        // Sột soạt bút chì ghi chú trên giấy học bài
        [0, 0.12, 0.24, 0.36].forEach((offset) => {
          const sDur = 0.07;
          const sBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * sDur), this.ctx.sampleRate);
          const sd = sBuf.getChannelData(0);
          for (let i = 0; i < sd.length; i++) {
            sd[i] = (Math.random() * 2 - 1) * (1 - i / sd.length) * 0.45;
          }
          const sSrc = this.ctx.createBufferSource();
          sSrc.buffer = sBuf;
          const sFlt = this.ctx.createBiquadFilter();
          sFlt.type = "bandpass";
          sFlt.frequency.setValueAtTime(2600, t + offset);
          sFlt.Q.setValueAtTime(2.0, t + offset);
          const sG = this.ctx.createGain();
          sG.gain.setValueAtTime(0.42, t + offset);
          sSrc.connect(sFlt);
          sFlt.connect(sG);
          sG.connect(this.masterGain);
          sSrc.start(t + offset);
        });
      }

      // Schedule next audible page turn (6 to 10 seconds)
      const nextDelay = 6000 + Math.random() * 4000;
      const tid = setTimeout(playBookEffect, nextDelay);
      this.timeoutIds.push(tid);
    };

    // Play immediate crisp page turn so user instantly hears it!
    playBookEffect();
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
window.formatPomodoroAiText = formatPomodoroAiText;
window.renderMathFormula = renderMathFormula;
window.formatOfficeTextToHtml = formatOfficeTextToHtml;
