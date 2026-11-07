'use strict';
/* =========================================================
   WHITE DOOR — Escenas animadas a pantalla completa
   (Premios Pixel, dormir en tu cuarto, toques de DJ y festivales),
   vista previa de la ropa y seguridad del estudio
   ========================================================= */

/* ---------- El productor de frente ---------- */
function drawProducerFront(x, fy, look, outfitId, t, pose = 'idle') {
  const of = OUTFITS.find(o => o.id === outfitId) || OUTFITS[0];
  const skin = look.skin || '#c48a5e', hair = look.hair || '#2a1810', c = of.color, sh = of.shade;
  const hat = HATS.find(h => h.id === look.hat), ch = CHAINS.find(h => h.id === look.chain);
  const ph = PHONES.find(p => p.id === look.phones) || PHONES[0];
  const beat = ((t / 250) | 0) % 2;
  let lift = 0;
  if (pose === 'cheer') lift = Math.round(Math.abs(Math.sin(t / 160)) * 4);
  if (pose === 'dj') lift = beat;
  const by = fy - lift;
  const pants = of.id === 'traje' ? '#0d0b1a' : '#1d2b53';
  // piernas y zapatos
  R(x - 4, by - 14, 3, 13, pants); R(x + 1, by - 14, 3, 13, pants);
  R(x - 5, by - 2, 4, 2, '#1a1a1a'); R(x + 1, by - 2, 4, 2, '#1a1a1a');
  // torso
  R(x - 6, by - 30, 12, 17, c); R(x - 6, by - 14, 12, 1, sh);
  R(x - 4, by - 20, 8, 4, sh); // bolsillo
  if (of.stripe) R(x - 6, by - 24, 12, 2, of.stripe);
  if (of.collar) { R(x - 3, by - 30, 2, 3, of.collar); R(x + 1, by - 30, 2, 3, of.collar); }
  // brazos según la pose
  const arm = (ax, ay, w, h) => R(ax, ay, w, h, c);
  if (pose === 'cheer') {
    arm(x - 8, by - 41, 2, 12); R(x - 8, by - 43, 2, 2, skin);
    arm(x + 6, by - 41, 2, 12); R(x + 6, by - 43, 2, 2, skin);
  } else if (pose === 'clap') {
    const k = beat ? 1 : 3;
    arm(x - 8, by - 29, 2, 7); arm(x + 6, by - 29, 2, 7);
    R(x - 6, by - 23, 4, 2, c); R(x + 2, by - 23, 4, 2, c);
    R(x - 1 - k, by - 25, 2, 3, skin); R(x - 1 + k, by - 25, 2, 3, skin);
  } else if (pose === 'dj') {
    arm(x - 8, by - 29, 2, 8); arm(x + 6, by - 29, 2, 8);
    R(x - 10 + beat, by - 22, 3, 2, skin); R(x + 7 - beat, by - 22, 3, 2, skin);
  } else {
    arm(x - 8, by - 29, 2, 12); arm(x + 6, by - 29, 2, 12);
    R(x - 8, by - 17, 2, 2, skin); R(x + 6, by - 17, 2, 2, skin);
  }
  // cuello, capucha y cabeza
  R(x - 6, by - 32, 12, 2, sh);
  R(x - 1, by - 32, 3, 2, skin);
  const hy = pose === 'sad' ? 1 : 0;
  R(x - 5, by - 42 + hy, 10, 10, skin);
  const H = (a, b, w, h) => R(x + a, by + b + hy, w, h, hair);
  switch (look.style || 0) {
    case 1: H(-6, -44, 12, 4); H(-6, -41, 2, 13); H(4, -41, 2, 13); break;            // largo
    case 2: H(-7, -48, 14, 7); H(-7, -42, 2, 5); H(5, -42, 2, 5); break;               // afro
    case 3: H(-5, -43, 10, 1); for (let i = 0; i < 5; i++) P(x - 4 + i * 2, by - 42 + hy, hair); break; // rapado
    case 4: H(-5, -44, 10, 3); H(-5, -42, 1, 3); H(4, -42, 1, 3); H(-2, -48, 4, 4); break; // moña
    case 5: H(-5, -44, 10, 3); for (let j = 0; j < 6; j++) { H(-7, -41 + j * 2, 2, 1); H(5, -40 + j * 2, 2, 1); } break; // trenzas
    case 6: H(-1, -48, 3, 6); H(-5, -42, 1, 2); H(4, -42, 1, 2); break;                // cresta
    default: H(-5, -44, 10, 3); H(-5, -42, 1, 4); H(4, -42, 1, 4);                     // corto
  }
  if (hat) {
    const Y = by - 45 + hy;
    if (hat.kind === 'gorra') { R(x - 6, Y, 12, 4, hat.color); R(x - 7, Y + 3, 14, 1, hat.shade); }
    if (hat.kind === 'gorro') { R(x - 6, Y - 1, 12, 5, hat.color); R(x - 6, Y + 3, 12, 1, hat.shade); R(x - 1, Y - 3, 2, 2, hat.shade); }
    if (hat.kind === 'bandana') { R(x - 5, Y + 2, 10, 2, hat.color); R(x + 4, Y + 3, 2, 3, hat.shade); }
  }
  // cara
  const ey = by - 38 + hy + (pose === 'sad' ? 1 : 0);
  if (pose === 'sleep') { R(x - 4, ey, 2, 1, '#0d0b1a'); R(x + 2, ey, 2, 1, '#0d0b1a'); }
  else { P(x - 3, ey, '#0d0b1a'); P(x + 2, ey, '#0d0b1a'); }
  if (pose === 'cheer') R(x - 2, by - 35, 4, 2, '#7e2553');
  else if (pose === 'sad') { R(x - 1, by - 34, 3, 1, '#8a4a3a'); P(x - 2, by - 33, '#8a4a3a'); P(x + 2, by - 33, '#8a4a3a'); }
  else R(x - 1, by - 35, 3, 1, '#8a4a3a');
  // audífonos al cuello
  R(x - 5, by - 31, 10, 1, '#1a1a1a'); R(x - 6, by - 32, 2, 3, ph.color); R(x + 4, by - 32, 2, 3, ph.color);
  // cadena
  if (ch) {
    P(x - 3, by - 29, ch.color); P(x - 2, by - 28, ch.color); R(x - 1, by - 27, 3, 1, ch.color); P(x + 2, by - 28, ch.color); P(x + 3, by - 29, ch.color);
    P(x, by - 26, ch.color);
    if (ch.sparkle && ((t / 300) | 0) % 3 === 0) P(x + 1, by - 27, '#ffffff');
  }
}

// Imagen de cómo te verías con un look o una prenda
const PREVIEW_CACHE = new Map();
function lookPreviewURL(look, outfitId, scale = 3) {
  const key = JSON.stringify([look, outfitId, scale]);
  if (PREVIEW_CACHE.has(key)) return PREVIEW_CACHE.get(key);
  const c = document.createElement('canvas');
  c.width = 30; c.height = 54;
  const prev = X;
  X = c.getContext('2d');
  drawProducerFront(15, 52, look, outfitId, 0, 'idle');
  X = prev;
  const big = document.createElement('canvas');
  big.width = 30 * scale; big.height = 54 * scale;
  const g = big.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(c, 0, 0, big.width, big.height);
  const url = big.toDataURL();
  if (PREVIEW_CACHE.size > 120) PREVIEW_CACHE.clear();
  PREVIEW_CACHE.set(key, url);
  return url;
}
function outfitPreviewURL(s, outfitId) { return lookPreviewURL(lookState(s), outfitId, 2); }

/* =========================================================
   MOTOR DE ESCENAS
   ========================================================= */
const Cutscene = {
  playing: false,
  held: [],
  play(kind, opts = {}) {
    const scene = SCENES[kind];
    if (!scene || this.playing) return Promise.resolve();
    this.playing = true;
    const wrap = document.createElement('div');
    wrap.className = 'cutscene';
    wrap.innerHTML = '<div class="cs-frame"><canvas width="320" height="180"></canvas><div class="cs-cap"></div></div><div class="cs-skip">Toca para saltar</div>';
    document.body.appendChild(wrap);
    G.modals++;
    const cv = wrap.querySelector('canvas'), ctx = cv.getContext('2d'), cap = wrap.querySelector('.cs-cap');
    ctx.imageSmoothingEnabled = false;
    const state = scene.setup ? scene.setup(opts) : {};
    const audio = csAudio();
    if (scene.sound) scene.sound(audio, opts, state);
    const t0 = performance.now();
    let lastCap = null, done = false;
    return new Promise(resolve => {
      const finish = () => {
        if (done) return; done = true;
        audio.stop();
        wrap.classList.add('out');
        setTimeout(() => {
          wrap.remove(); G.modals--; this.playing = false;
          const h = this.held; this.held = [];
          h.forEach(a => UI.toast(...a));
          UI.refresh();
          resolve();
        }, 350);
      };
      wrap.addEventListener('click', () => { if (performance.now() - t0 > 400) { SFX.click(); finish(); } });
      const frame = now => {
        if (done) return;
        const t = now - t0;
        const prev = X;
        X = ctx;
        try { scene.draw(t, opts, state); } catch (err) { console.error(err); X = prev; finish(); return; }
        // entrada y salida en negro
        const a = t < 300 ? 1 - t / 300 : t > scene.dur - 350 ? (t - (scene.dur - 350)) / 350 : 0;
        if (a > 0) R(0, 0, 320, 180, `rgba(0,0,0,${Math.min(1, a)})`);
        X = prev;
        const c = scene.caption(t, opts, state);
        if (c !== lastCap) { cap.innerHTML = c; cap.classList.toggle('on', !!c); lastCap = c; }
        if (t >= scene.dur) finish(); else requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  },
};

// Sonidos de las escenas: se pueden cortar si saltas la escena
function csAudio() {
  const ac = SFX.on && SFX.ctx;
  if (!ac) return { tone() {}, stop() {} };
  const out = ac.createGain(); out.gain.value = 1; out.connect(ac.destination);
  return {
    tone(freq, dur, type = 'square', vol = 0.03, delay = 0) {
      const t = ac.currentTime + delay;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (type === 'sine' && freq < 120) o.frequency.exponentialRampToValueAtTime(40, t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02);
    },
    stop() { try { out.gain.setValueAtTime(0, ac.currentTime); setTimeout(() => out.disconnect(), 100); } catch (e) { /* nada */ } },
  };
}

/* ---------- Ayudas de dibujo ---------- */
const csBig = (map, x0, y0, k) => map.forEach((row, y) => { for (let x = 0; x < 12; x++) { const ch = row[x]; if (ch !== '.' && ICON_PAL[ch]) R(x0 + x * k, y0 + y * k, k, k, ICON_PAL[ch]); } });
function csBeam(x, top, x2, w, color) {
  X.save(); X.globalCompositeOperation = 'lighter'; X.fillStyle = color;
  X.beginPath(); X.moveTo(x - 3, top); X.lineTo(x + 3, top); X.lineTo(x2 + w, 180); X.lineTo(x2 - w, 180); X.closePath(); X.fill();
  X.restore();
}
function csGlow(x, y, rx, ry, color) {
  X.save(); X.globalCompositeOperation = 'lighter';
  X.translate(x, y); X.scale(1, ry / rx);
  const g = X.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  X.fillStyle = g; X.beginPath(); X.arc(0, 0, rx, 0, Math.PI * 2); X.fill(); X.restore();
}
function csCrowd(st, t, y0, rows, beatMs, hype) {
  st.crowd.forEach(p => {
    if (p.row >= rows) return;
    const jump = Math.max(0, Math.sin((t + p.ph) / beatMs * Math.PI)) * hype * (p.row + 2) * 0.8;
    const y = y0 + p.row * 9 - jump;
    const sz = 6 + p.row * 2;
    R(p.x - sz / 2 - 1, y + sz - 2, sz + 2, 12, p.shirt);
    R(p.x - sz / 2 + 1, y, sz - 2, sz - 1, p.skin);
    R(p.x - sz / 2 + 1, y - 1, sz - 2, 2, p.hair);
    if (p.hands && hype > 0.3 && ((t + p.ph) / beatMs | 0) % 2) { R(p.x - sz / 2 - 2, y - 6, 2, 8, p.skin); R(p.x + sz / 2, y - 7, 2, 8, p.skin); }
  });
}
function makeCrowd(n, rows) {
  const out = [];
  for (let i = 0; i < n; i++) out.push({
    x: Math.random() * 330 - 5, row: i % rows, ph: Math.random() * 1000, hands: Math.random() < 0.35,
    skin: pick(LOOKS.skin), hair: pick(LOOKS.hair), shirt: pick(LOOKS.shirt),
  });
  return out.sort((a, b) => a.row - b.row);
}
function drawZ(x, y, k, c) {
  ['11111', '00010', '00100', '01000', '11111'].forEach((r, j) => { for (let i = 0; i < 5; i++) if (r[i] === '1') R(x + i * k, y + j * k, k, k, c); });
}
const TROPHY = ['.yyyyyyyy.', 'yywyyyyyyy', 'y.ywyyyy.y', 'y.yyyyyy.y', '.yyyyyyyy.', '..yyyyyy..', '...yyyy...', '....yy....', '....yy....', '..oooooo..', '..oooooo..'];
function drawTrophy(x, y, k = 2) {
  TROPHY.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = r[i]; if (c !== '.') R(x + i * k, y + j * k, k, k, c === 'y' ? '#ffc61a' : c === 'w' ? '#fff1e8' : '#a07e10'); } });
}

/* =========================================================
   ESCENAS
   ========================================================= */
const SCENES = {
  /* ---------- Premios Pixel ---------- */
  awards: {
    dur: 7600,
    setup(o) {
      const s = G.s;
      const noms = [
        { name: o.rivals[0], look: randomLook(1) },
        { name: s.producer, me: true },
        { name: o.rivals[1], look: randomLook(1) },
      ];
      const winner = o.win ? 1 : (Math.random() < 0.5 ? 0 : 2);
      const confetti = Array.from({ length: 70 }, () => ({ x: Math.random() * 320, y: -Math.random() * 160, v: 0.03 + Math.random() * 0.04, c: pick(['#ff004d', '#ffec27', '#29adff', '#00e436', '#ff77a8', '#fff1e8']), w: Math.random() * 6 }));
      return { noms, winner, confetti, crowd: makeCrowd(46, 2), look: lookState(s), outfit: s.life.outfit };
    },
    sound(a, o) {
      for (let i = 0; i < 34; i++) a.tone(i % 2 ? 98 : 110, 0.07, 'triangle', 0.05, 1.3 + i * 0.062); // redoble
      a.tone(65, 0.4, 'sine', 0.12, 3.5);
      if (o.win) [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => a.tone(f, i === 7 ? 0.6 : 0.12, 'square', 0.035, 3.6 + i * 0.13));
      else [392, 370, 349, 330].forEach((f, i) => a.tone(f, i === 3 ? 0.5 : 0.22, 'triangle', 0.05, 3.7 + i * 0.25));
    },
    draw(t, o, st) {
      const reveal = t > 3500;
      // Fondo del teatro
      R(0, 0, 320, 180, '#120d24');
      for (let y = 0; y < 140; y += 8) R(50, y, 220, 4, '#17112e');
      // Letrero con bombillos
      R(96, 14, 128, 28, '#2a1f10'); R(99, 17, 122, 22, '#3a2a12');
      pixText('PREMIOS PIXEL', 160 - 26, 26, reveal && o.win ? '#ffec27' : '#ffc61a');
      for (let i = 0; i < 16; i++) {
        const on = ((t / 180) | 0) % 2 === i % 2;
        const c = on ? '#fff1a8' : '#6b4a12';
        P(100 + i * 8, 15, c); P(100 + i * 8, 40, c);
      }
      // Escenario
      R(40, 140, 240, 12, '#3b2418'); R(40, 140, 240, 2, '#6b3a2a'); R(40, 152, 240, 4, '#24130c');
      for (let x = 44; x < 280; x += 16) R(x, 143, 1, 9, '#2e1c12');
      // Atril con micrófono
      R(260, 116, 14, 24, '#5a3a2a'); R(259, 115, 16, 2, '#7a5a3a'); R(266, 106, 1, 10, '#c2c3c7'); R(265, 104, 3, 3, '#1a1a1a');
      // Telón
      for (const [x0, w] of [[0, 52], [268, 52]]) {
        R(x0, 0, w, 180, '#7e2553');
        for (let x = x0 + 3; x < x0 + w; x += 7) R(x, 0, 2, 180, '#5e1a3e');
      }
      R(0, 0, 320, 9, '#7e2553');
      for (let x = 0; x < 320; x += 12) R(x + 2, 9, 8, 3, '#7e2553');
      // Nominados
      const xs = [100, 160, 220];
      st.noms.forEach((n, i) => {
        const win = reveal && i === st.winner;
        const pose = !reveal ? 'idle' : win ? 'cheer' : n.me ? (t > 4700 ? 'sad' : 'clap') : 'clap';
        if (n.me) drawProducerFront(xs[i], 140, st.look, st.outfit, t, pose);
        else {
          const lk = n.look;
          drawPerson(xs[i], 140 - (win ? Math.round(Math.abs(Math.sin(t / 160)) * 4) : 0), lk, t, win);
        }
        if (win && t > 3800) drawTrophy(xs[i] - 10, 70 - Math.round(Math.abs(Math.sin(t / 160)) * 4), 2);
        R(xs[i] - 16, 156, 32, 6, n.me ? '#ff77a8' : '#5f574f'); R(xs[i] - 15, 157, 30, 4, n.me ? '#7e2553' : '#3a3548');
      });
      // Oscuridad y reflectores
      R(0, 0, 320, 180, 'rgba(4,2,12,.5)');
      if (!reveal) {
        const k = t < 1300 ? 0.5 : 0.5 + (t - 1300) / 600;
        const sx = 160 + Math.sin(t / 1000 * k * 2) * 70;
        const sx2 = 160 + Math.sin(t / 1000 * k * 2 + 2.2) * 70;
        csBeam(110, 0, sx, 22, 'rgba(255,241,200,.13)'); csGlow(sx, 146, 24, 5, 'rgba(255,241,200,.18)');
        csBeam(210, 0, sx2, 22, 'rgba(200,220,255,.10)'); csGlow(sx2, 146, 24, 5, 'rgba(200,220,255,.14)');
      } else {
        const wx = xs[st.winner];
        csBeam(wx, 0, wx, 26, 'rgba(255,241,200,.22)'); csGlow(wx, 146, 28, 6, 'rgba(255,241,200,.25)');
        if (o.win) csGlow(160, 30, 70, 20, 'rgba(255,198,26,.08)');
      }
      // Público
      csCrowd(st, t, 160, 2, 300, reveal ? (o.win ? 1 : 0.4) : 0);
      // Confeti
      if (reveal && o.win) st.confetti.forEach(p => {
        const y = (p.y + (t - 3500) * p.v * 1.6) % 190, x = p.x + Math.sin(t / 300 + p.w) * 4;
        R(x, y, 2, ((t / 120 + p.w) | 0) % 2 ? 2 : 1, p.c);
      });
    },
    caption(t, o, st) {
      if (t < 1300) return `<small>Premios Pixel</small>Mejor Producción del Año`;
      if (t < 3500) return 'Y el premio es para...';
      const w = st.noms[st.winner];
      return o.win ? `<b class="cs-gold">¡${esc(w.name)}!</b> por "${esc(o.song)}"` : `<b>${esc(w.name)}</b><small>Esta vez no fue... pero la nominación ya es un honor.</small>`;
    },
  },

  /* ---------- Dormir en tu cuarto ---------- */
  sleep: {
    dur: 3400,
    setup() { const s = G.s; return { look: lookState(s), outfit: s.life.outfit, stars: Array.from({ length: 14 }, () => [Math.random() * 54, Math.random() * 30]) }; },
    sound(a) {
      [659, 587, 523, 440, 392].forEach((f, i) => a.tone(f, 0.45, 'triangle', 0.035, 0.2 + i * 0.32));
      [523, 659, 784, 1047].forEach((f, i) => a.tone(f, 0.18, 'square', 0.025, 2.35 + i * 0.09));
    },
    draw(t, o, st) {
      const day = clamp((t - 2000) / 500, 0, 1);
      // Cuarto
      R(0, 0, 320, 180, '#3a2f5b');
      for (let x = 6; x < 320; x += 14) R(x, 0, 6, 120, '#41356a');
      R(0, 120, 320, 60, '#8a4b2c');
      for (let y = 124; y < 180; y += 8) R(0, y, 320, 1, '#74401f');
      R(0, 118, 320, 3, '#241c3d');
      // Ventana: noche → día
      const wx = 212, wy = 30;
      R(wx - 3, wy - 3, 66, 50, '#5a3a2a');
      R(wx, wy, 60, 44, day < 1 ? '#0d0b1a' : '#29adff');
      if (day > 0) R(wx, wy, 60, 44, `rgba(41,173,255,${day})`);
      if (day < 1) {
        st.stars.forEach(([sx, sy], i) => { if (((t / 300 + i) | 0) % 4) P(wx + 3 + sx, wy + 3 + sy, `rgba(255,241,232,${1 - day})`); });
        const my = wy + 8 + t / 240;
        R(wx + 40, my, 8, 8, `rgba(255,241,200,${1 - day})`); R(wx + 43, my, 5, 6, `rgba(13,11,26,${1 - day})`);
      }
      if (day > 0) { const sy = wy + 44 - day * 26; R(wx + 12, sy, 10, 10, '#ffec27'); R(wx + 10, sy + 3, 14, 4, '#ffec27'); }
      R(wx + 29, wy, 2, 44, '#5a3a2a'); R(wx, wy + 21, 60, 2, '#5a3a2a');
      // Cuadro y lámpara
      R(40, 34, 30, 22, '#ffc61a'); R(42, 36, 26, 18, '#1d2b53'); pixText('WD', 50, 42, '#ff77a8');
      R(258, 96, 16, 22, '#5a3a2a'); R(262, 82, 8, 14, '#ffa300'); R(265, 90, 2, 6, '#c2c3c7');
      if (day < 1) csGlow(266, 88, 22, 18, `rgba(255,163,0,${0.15 * (1 - day)})`);
      // Cama
      R(70, 100, 8, 44, '#6b3a2a'); R(70, 98, 8, 2, '#8a4a3a');
      R(78, 116, 150, 20, '#fff1e8'); R(78, 134, 150, 10, '#6b3a2a'); R(222, 112, 8, 32, '#6b3a2a');
      R(82, 110, 30, 10, '#fff1e8'); R(82, 118, 30, 2, '#c2c3c7');
      const awake = t > 2400;
      // Cabeza en la almohada (o sentado al despertar)
      const lk = st.look;
      if (!awake) {
        R(90, 104, 12, 11, lk.skin); R(89, 102, 14, 4, lk.hair); R(89, 104, 2, 6, lk.hair);
        R(93, 109, 2, 1, '#0d0b1a'); R(98, 109, 2, 1, '#0d0b1a');
      } else {
        drawProducerFront(48, 156, lk, st.outfit, t, t > 2700 ? 'cheer' : 'idle');
      }
      const br = awake ? 0 : Math.round(Math.sin(t / 380) * 1.5);
      R(108, 114 - br, 116, 22 + br, '#7e2553'); R(108, 114 - br, 116, 2, '#a83a6a');
      for (let x = 116; x < 220; x += 14) R(x, 120 - br, 6, 6, '#a83a6a');
      // Zzz
      if (!awake) for (let i = 0; i < 3; i++) {
        const p = ((t + i * 600) % 1800) / 1800;
        drawZ(104 + p * 26 + i * 4, 98 - p * 50, 1 + (p > 0.5 ? 1 : 0), `rgba(255,241,232,${1 - p})`);
      }
      // Noche
      if (day < 1) R(0, 0, 320, 180, `rgba(8,6,30,${0.55 * (1 - day)})`);
    },
    caption(t) { return t < 2400 ? 'Zzz...' : '¡Como nuevo! Energía al 100%'; },
  },

  /* ---------- Toque: DJ en el club o festival ---------- */
  gig: {
    dur: 5600,
    setup(o) {
      const s = G.s;
      return { look: lookState(s), outfit: s.life.outfit, crowd: makeCrowd(o.big ? 90 : 42, o.big ? 4 : 3),
        sparks: Array.from({ length: 30 }, () => ({ a: Math.random() * Math.PI, v: 0.04 + Math.random() * 0.05, side: Math.random() < 0.5 })) };
    },
    sound(a, o) {
      const b = 0.48, bass = [55, 55, 65, 49];
      for (let i = 0; i < 11; i++) {
        const tt = 0.3 + i * b;
        a.tone(70, 0.22, 'sine', 0.14, tt);
        a.tone(5200, 0.03, 'square', 0.008, tt + b / 2);
        a.tone(bass[(i >> 1) % 4] * 2, b * 0.45, 'sawtooth', 0.018, tt + b / 2);
        if (i > 3) a.tone([523, 659, 784, 659][i % 4] * (o.big ? 1 : 0.5), 0.12, 'square', 0.02, tt + b * 0.25);
      }
      a.tone(1047, 0.5, 'square', 0.025, 0.3 + 11 * b);
    },
    draw(t, o, st) {
      const beat = 480, ph = ((t - 300) % beat) / beat, pulse = t > 300 ? Math.max(0, 1 - ph * 2.2) : 0;
      if (o.big) {
        // Festival al aire libre
        R(0, 0, 320, 180, '#0d0b1a');
        R(0, 0, 320, 60, '#1d1640');
        for (let i = 0; i < 30; i++) P((i * 53) % 320, (i * 29) % 70, '#c2c3c7');
        // Tarima con estructura
        R(30, 30, 260, 4, '#5f574f'); R(30, 30, 4, 120, '#5f574f'); R(286, 30, 4, 120, '#5f574f');
        for (let x = 34; x < 286; x += 10) { P(x, 31, '#3a3548'); P(x + 5, 32, '#3a3548'); }
        // Pantalla LED con ecualizador
        R(70, 42, 180, 66, '#06050d');
        for (let i = 0; i < 18; i++) {
          const h = 6 + Math.abs(Math.sin(t / 140 + i * 0.7)) * 40 * (0.5 + pulse * 0.5);
          R(76 + i * 10, 104 - h, 7, h, i % 3 === 0 ? '#ff77a8' : i % 3 === 1 ? '#29adff' : '#ffec27');
        }
        pixText((o.name || 'FESTIVAL').toUpperCase().slice(0, 28), 160 - Math.min(28, (o.name || 'FESTIVAL').length) * 2, 48, '#fff1e8');
        R(34, 128, 252, 22, '#2a2433'); R(34, 128, 252, 2, '#5f574f');
      } else {
        // Club
        R(0, 0, 320, 180, '#0b0918');
        for (let x = 0; x < 320; x += 20) R(x, 0, 1, 130, '#141028');
        pixText('CLUB NEON', 142, 18, ((t / 90) | 0) % 37 ? '#ff77a8' : '#5e1a3e');
        R(138, 14, 44, 13, 'rgba(255,119,168,.08)');
        // Bola de disco
        R(159, 28, 1, 8, '#5f574f'); R(154, 36, 12, 12, '#c2c3c7');
        for (let i = 0; i < 4; i++) P(155 + ((t / 100 + i * 3) % 10), 38 + i * 2, '#ffffff');
      }
      // Bafles
      for (const sx of o.big ? [40, 252] : [26, 262]) {
        R(sx, 80, 30, 60, '#1a1a22'); R(sx + 1, 81, 28, 58, '#24242e');
        const r = 9 + pulse * 2;
        X.fillStyle = '#0d0b1a'; X.beginPath(); X.arc(sx + 15, 118, r, 0, Math.PI * 2); X.fill();
        X.fillStyle = '#3a3548'; X.beginPath(); X.arc(sx + 15, 118, 3, 0, Math.PI * 2); X.fill();
        X.fillStyle = '#0d0b1a'; X.beginPath(); X.arc(sx + 15, 92, 5, 0, Math.PI * 2); X.fill();
      }
      // Productor y mesa de DJ
      drawProducerFront(160, 140, st.look, st.outfit, t, 'dj');
      R(110, 118, 100, 24, '#1a1a22'); R(110, 118, 100, 2, '#3a3548');
      for (let i = 0; i < 24; i++) R(113 + i * 4, 136, 3, 2, ['#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#ff77a8'][(i + ((t / 120) | 0)) % 6]);
      for (const dx of [128, 192]) {
        X.fillStyle = '#0d0b1a'; X.beginPath(); X.arc(dx, 124, 7, 0, Math.PI * 2); X.fill();
        const a = t / 120 + dx;
        R(dx + Math.cos(a) * 5 - 1, 124 + Math.sin(a) * 5 - 1, 2, 2, '#c2c3c7');
      }
      R(170, 112, 16, 7, '#5f574f'); R(171, 113, 14, 5, '#29adff'); // laptop
      // Luces
      R(0, 0, 320, 180, `rgba(0,0,0,${0.25 - pulse * 0.15})`);
      const cols = ['rgba(255,119,168,.16)', 'rgba(41,173,255,.16)', 'rgba(255,236,39,.13)', 'rgba(0,228,54,.12)'];
      const n = o.big ? 6 : 4;
      for (let i = 0; i < n; i++) {
        const ox = 40 + i * (240 / (n - 1));
        csBeam(ox, o.big ? 32 : 0, ox + Math.sin(t / 600 + i * 1.7) * 120, 18, cols[(i + ((t / beat) | 0)) % 4]);
      }
      if (!o.big) csGlow(160, 42, 30 + pulse * 10, 10, 'rgba(255,255,255,.06)');
      // Chispas del festival
      if (o.big && ((t - 300) / (beat * 4) | 0) % 2 === 1) st.sparks.forEach(p => {
        const k = ((t / 1000) * p.v * 20) % 1, x = (p.side ? 50 : 270) + Math.cos(p.a) * k * 30, y = 128 - Math.sin(p.a) * k * 60;
        R(x, y, 2, 2, k < 0.5 ? '#ffec27' : '#ffa300');
      });
      // Público
      csCrowd(st, t, o.big ? 146 : 150, o.big ? 4 : 3, beat / 2, 0.6 + pulse * 0.6);
    },
    caption(t, o) {
      if (t < 3900) return o.big ? `<small>En vivo</small>${esc(o.name || 'Festival')}` : '<small>Club Neón 8</small>Tu set de DJ';
      return o.result ? esc(o.result) : '¡El público enloqueció!';
    },
  },
};

/* ---------- Mientras pasa una escena, los avisos esperan ---------- */
(function () {
  const baseToast = UI.toast;
  UI.toast = function (...a) {
    if (Cutscene.playing) { Cutscene.held.push(a); return; }
    return baseToast.apply(this, a);
  };
})();

/* =========================================================
   SEGURIDAD DEL ESTUDIO (más opciones y su propio panel)
   ========================================================= */
SECURITY.unshift({ id: 'cerradura', name: 'Cerradura reforzada', price: 900, icon: 'keys', desc: 'Una puerta blanca difícil de forzar (−40% robos).' });
SECURITY.push(
  { id: 'vigilante', name: 'Vigilante nocturno', price: 0, weekly: 300, icon: 'fans', desc: 'Cuida el estudio de noche (−60% robos y casi siempre atrapa a los ladrones). Cobra cada semana.' },
  { id: 'seguro', name: 'Seguro contra robos', price: 0, weekly: 120, icon: 'book', desc: 'Si te roban, el seguro te devuelve el 75% del efectivo y repone el equipo. Cobra cada semana.' },
);
function secRobMult(s = G.s) {
  let m = 1;
  if (hasSec('cerradura', s)) m *= 0.6;
  if (hasSec('alarma', s)) m *= 0.2;
  if (hasSec('vigilante', s)) m *= 0.4;
  if (hasEntourage('guardaespaldas', s)) m *= 0.5;
  return m;
}
function secWeekly(s = G.s) { return SECURITY.filter(it => it.weekly && hasSec(it.id, s)).reduce((a, it) => a + it.weekly, 0); }

(function () {
  // Las mensualidades de la seguridad
  const baseWeek = advanceWeek;
  advanceWeek = function () {
    const s = G.s;
    baseWeek();
    if (!G.running || G.s !== s) return;
    const cost = secWeekly(s);
    if (cost) { charge(cost); taxState(s).costs += cost; }
  };

  // El estudio muestra la seguridad instalada
  const baseCtl = drawControl;
  drawControl = function (ctx, s, t, opts) {
    baseCtl(ctx, s, t, opts);
    if (!s.life || !s.life.security) return;
    const L = layout(s);
    X = ctx;
    if (hasSec('alarma', s)) {
      // cámara en la esquina
      const cx = L.x0 + 4;
      R(cx, 5, 4, 2, '#5f574f'); R(cx + 2, 7, 10, 6, '#c2c3c7'); R(cx + 12, 8, 3, 4, '#5f574f');
      if (((t / 500) | 0) % 2) P(cx + 4, 9, '#ff004d');
      // teclado de la alarma junto a la puerta
      const kx = L.door + 30;
      R(kx, 62, 9, 12, '#1a1a22'); R(kx + 1, 63, 7, 3, '#00e436');
      for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) P(kx + 2 + i * 2, 68 + j * 2, '#c2c3c7');
      if (((t / 700) | 0) % 2) P(kx + 7, 63, '#ff004d');
    }
    if (hasSec('cerradura', s)) { R(L.door + 22, 80, 3, 5, '#ffc61a'); P(L.door + 23, 83, '#1a1a1a'); }
    if (hasSec('firewall', s)) { const fx = L.cx - 26; R(fx, 100, 6, 8, '#1a1a22'); P(fx + 1, 101, ((t / 300) | 0) % 2 ? '#00e436' : '#0a5a1a'); P(fx + 3, 101, '#29adff'); }
  };

  // Celular: app de seguridad
  PHONE_APPS.push({ id: 'segur', name: 'Seguridad', icon: 'keys', color: '#5f574f', open: () => UI.security() });

  MENU_HELP.push([/^Seguridad del estudio/, 'Protege tu estudio. La alarma y la cerradura se compran una vez; el vigilante y el seguro cobran cada semana. Los ladrones atacan más cuando tienes mejor equipo. Los robos solo pasan mientras no estás.']);

  // En la Tienda 24/7 la pestaña Seguridad abre el panel nuevo
  const baseShop = UI.shop247;
  UI.shop247 = function (tab = 'tienda') { if (tab === 'seguridad') return this.security(); return baseShop.call(this, tab); };
})();

UI.security = function () {
  const s = G.s;
  fxState(s);
  const m = this.modal('Seguridad del estudio', '', { wide: true });
  const render = () => {
    const L = s.life, risk = Math.round(secRobMult(s) * 100);
    let h = `<div class="money-line">Dinero: <b>${fmtMoney(s.money)}</b> · Riesgo de robo: <b class="${risk > 50 ? 'warn' : ''}">${risk}%</b> del normal${secWeekly(s) ? ` · Pagas ${fmtMoney(secWeekly(s))}/sem` : ''}</div>
      <p class="muted small">Entre mejor sea tu equipo, más ladrones lo quieren. ${L.blocked ? `Tu seguridad ya frenó ${L.blocked} intento(s) de robo.` : ''}</p><div class="grid">`;
    h += SECURITY.map(it => {
      const own = L.security.includes(it.id);
      const price = it.weekly ? `${fmtMoney(it.weekly)}/sem` : fmtMoney(it.price);
      return `<div class="card ${own ? 'owned' : ''}">${iconImg(it.icon)}<div class="cinfo"><b>${it.name}</b><div class="muted">${it.desc}</div></div>
        <div class="cbuy">${own ? (it.weekly ? `<button class="btn small" data-cancelsec="${it.id}">Cancelar</button>` : '<span class="ok">✓ Instalado</span>') :
          `<button class="btn primary small" data-sec="${it.id}" ${s.money < (it.price || it.weekly) ? 'disabled' : ''}>${price}</button>`}</div></div>`;
    }).join('') + '</div>';
    m.set(h);
  };
  m.body.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.sec) {
      const it = SECURITY.find(x => x.id === b.dataset.sec);
      if (it.price) s.money -= it.price;
      s.life.security.push(it.id); SFX.coin();
      this.toast(it.weekly ? `Contrataste: ${it.name}.` : `Instalaste: ${it.name}.`, 'good');
    }
    if (b.dataset.cancelsec) { s.life.security = s.life.security.filter(x => x !== b.dataset.cancelsec); SFX.click(); }
    saveGame(); render(); this.refresh();
  });
  render();
};

/* =========================================================
   GANCHOS DE LAS ESCENAS
   ========================================================= */
(function () {
  // Dormir con el cuarto comprado
  const baseHome = UI.homeAction;
  UI.homeAction = function (kind) {
    if (kind === 'sleep' && G.s && G.s.loc === 'studio' && hasModule('dormitorio')) {
      SFX.click();
      const msg = doSleep();
      saveGame(); this.refresh();
      Cutscene.play('sleep').then(() => { if (msg) this.toast(msg, 'good'); });
      return;
    }
    return baseHome.call(this, kind);
  };

  // Toque de DJ en el club
  const baseFinish = finishJob;
  finishJob = function (id) {
    const msg = baseFinish(id);
    if (id === 'dj') Cutscene.play('gig', { result: msg });
    return msg;
  };
})();
