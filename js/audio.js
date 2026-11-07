'use strict';
/* =========================================================
   WHITE DOOR — Sonido chiptune (WebAudio, sin archivos)
   ========================================================= */
const SFX = {
  ctx: null, on: true, music: true, musicTimer: null, step: 0,

  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; }
  },

  tone(freq, dur = 0.08, type = 'square', vol = 0.04, delay = 0) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  },

  click() { this.tone(660, 0.04, 'square', 0.025); },
  pop(kind) { this.tone(kind === 'tec' ? 988 : kind === 'noise' ? 196 : 784, 0.05, 'square', 0.018); },
  coin() { this.tone(988, 0.07, 'square', 0.035); this.tone(1319, 0.18, 'square', 0.035, 0.07); },
  mail() { this.tone(880, 0.08, 'triangle', 0.06); this.tone(1175, 0.12, 'triangle', 0.06, 0.09); },
  bad() { this.tone(220, 0.15, 'sawtooth', 0.03); this.tone(165, 0.25, 'sawtooth', 0.03, 0.15); },
  level() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.12, 'square', 0.035, i * 0.08)); },
  fanfare() { [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => this.tone(f, i === 7 ? 0.4 : 0.1, 'square', 0.035, i * 0.11)); },
  review(score) { this.tone(score >= 7 ? 1047 : score >= 5 ? 784 : 330, 0.12, 'square', 0.035); },

  // Pequeño loop musical mientras produces
  startMusic(genre) {
    this.stopMusic();
    if (!this.ctx || !this.music) return;
    const scales = {
      default: [0, 3, 5, 7, 10], pop: [0, 2, 4, 7, 9], lofi: [0, 3, 7, 10, 14], jazz: [0, 4, 7, 11, 14],
      reggaeton: [0, 3, 7, 8, 10], salsa: [0, 4, 7, 9, 12], metal: [0, 1, 5, 7, 8], electronica: [0, 3, 7, 10, 12],
    };
    const sc = scales[genre] || scales.default;
    const prog = [0, 5, 3, 7];
    const base = 220;
    const bpm = { lofi: 80, jazz: 100, reggaeton: 95, trap: 70, metal: 150, electronica: 128, salsa: 180 }[genre] || 110;
    const stepMs = 60000 / bpm / 2;
    this.step = 0;
    this.musicTimer = setInterval(() => {
      if (!this.on || !this.music || G.modals > 0 || G.paused) return;
      const bar = Math.floor(this.step / 8) % 4, s = this.step % 8;
      const root = base * Math.pow(2, prog[bar] / 12);
      if (s % 4 === 0) this.tone(root / 2, 0.22, 'triangle', 0.05);
      if (s % 2 === 0 || Math.random() < 0.3) {
        const n = sc[(s * 3 + bar + ((Math.random() * 2) | 0)) % sc.length];
        this.tone(root * Math.pow(2, n / 12), 0.09, 'square', 0.012);
      }
      if (s === 2 || s === 6) this.noise(0.05, 0.02);
      this.step++;
    }, stepMs);
  },
  stopMusic() { if (this.musicTimer) clearInterval(this.musicTimer); this.musicTimer = null; },
  noise(dur, vol) {
    if (!this.on || !this.ctx) return;
    const n = this.ctx.sampleRate * dur, buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ctx.createBufferSource(), g = this.ctx.createGain();
    src.buffer = buf; g.gain.value = vol; src.connect(g); g.connect(this.ctx.destination); src.start();
  },
};
