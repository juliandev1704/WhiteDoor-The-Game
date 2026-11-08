'use strict';
/* =========================================================
   WHITE DOOR — v2.8: la relación cobra vida
   Escenas de citas, mudanza, boda y momentos en pareja; la
   pareja vive en tu casa (estudio, lounge y dormitorio) y se
   puede tocar para interactuar; app de Chats en el celular.
   ========================================================= */

/* ---------- Ayudas de dibujo ---------- */
const HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
function drawHeart(x, y, k = 1, c = '#ff004d') {
  HEART.forEach((r, j) => { for (let i = 0; i < 7; i++) if (r[i] === '#') R(x + i * k, y + j * k, k, k, c); });
  if (k >= 2) R(x + k, y + k, k, k, '#ff9fb8');
}
// Corazones que suben
function heartsUp(t, x, y, n = 3, from = 0, spread = 30) {
  if (t < from) return;
  for (let i = 0; i < n; i++) {
    const p = ((t - from + i * 700) % 2100) / 2100;
    drawHeart(x + Math.sin(p * 6 + i * 2) * 6 + (i - (n - 1) / 2) * (spread / n), y - p * 46, p < 0.5 ? 1 : 2, `rgba(255,${60 + i * 30},${120 + i * 20},${1 - p})`);
  }
}
const isWoman = p => p && p.gender === 'm';
// La pareja (mira al frente). En la boda: vestido o traje.
function drawPartnerFig(x, fy, p, t, o = {}) {
  const lk = { ...p.look };
  if (o.wedding) { lk.shirt = isWoman(p) ? '#fff1e8' : '#1d1b2e'; lk.pants = isWoman(p) ? '#fff1e8' : '#1d1b2e'; }
  const jump = o.jump ? Math.round(Math.abs(Math.sin(t / 160)) * 3) : 0;
  drawPerson(x, fy - jump, lk, t, !!o.sing);
  const by = fy - jump;
  if (o.wedding && isWoman(p)) {
    R(x - 8, by - 16, 16, 15, '#fff1e8'); R(x - 9, by - 4, 18, 3, '#fff1e8'); R(x - 8, by - 16, 16, 1, '#c2c3c7');
    R(x - 6, by - 46, 12, 2, '#fff1e8'); R(x + 5, by - 45, 3, 22, 'rgba(255,241,232,.65)'); R(x - 8, by - 45, 3, 22, 'rgba(255,241,232,.65)');
    R(x - 3, by - 20, 6, 4, '#ff77a8'); P(x - 1, by - 21, '#00e436'); // ramo
  }
  if (o.wedding && !isWoman(p)) { R(x - 1, by - 30, 2, 8, '#fff1e8'); P(x - 3, by - 27, '#ff004d'); }
  if (o.blush) { P(x - 4, by - 36, '#ff77a8'); P(x + 3, by - 36, '#ff77a8'); }
}
function meLook(s = G.s) { return lookState(s); }
function weddingOutfit(s) { return OUTFITS.some(o => o.id === 'traje') ? 'traje' : s.life.outfit; }

/* ---------- Fondos ---------- */
function bgHome(t, night) {
  R(0, 0, 320, 180, '#3a2f5b');
  for (let x = 6; x < 320; x += 14) R(x, 0, 6, 122, '#41356a');
  R(0, 122, 320, 58, '#8a4b2c'); for (let y = 128; y < 180; y += 8) R(0, y, 320, 1, '#74401f');
  R(0, 120, 320, 3, '#241c3d');
  R(222, 26, 60, 44, '#5a3a2a'); R(225, 29, 54, 38, night ? '#0d0b1a' : '#29adff');
  if (night) for (let i = 0; i < 8; i++) if (((t / 400 + i) | 0) % 3) P(229 + i * 6, 33 + (i % 3) * 7, '#fff1e8');
  R(251, 29, 2, 38, '#5a3a2a'); R(225, 47, 54, 2, '#5a3a2a');
  R(36, 34, 30, 22, '#ffc61a'); R(38, 36, 26, 18, '#1d2b53'); drawHeart(47, 41, 1, '#ff77a8');
  // repisa con libros y discos, y una planta
  R(74, 62, 32, 60, '#5a3a2a'); for (let j = 0; j < 3; j++) { R(76, 64 + j * 19, 28, 16, '#3a2418'); for (let i = 0; i < 5; i++) R(78 + i * 5, 68 + j * 19, 4, 12, ['#ff004d', '#29adff', '#ffec27', '#00e436', '#ff77a8'][(i + j) % 5]); }
  R(290, 106, 14, 16, '#ab5236'); R(286, 88, 22, 20, '#00a83a'); R(292, 80, 10, 10, '#00a83a'); P(294, 92, '#008751'); P(300, 98, '#008751');
}
function bgPark(t, sunset) {
  const sky = sunset ? ['#ff77a8', '#ffa300', '#ffcc66'] : ['#29adff', '#5fc8ff', '#a8e4ff'];
  sky.forEach((c, i) => R(0, i * 34, 320, 34, c));
  R(0, 102, 320, 18, sunset ? '#ffd9a0' : '#c8f0ff');
  if (sunset) { R(214, 78, 28, 28, '#ffec27'); R(208, 86, 40, 12, '#ffec27'); }
  else { R(40, 20, 16, 16, '#ffec27'); R(36, 25, 24, 6, '#ffec27'); }
  for (let i = 0; i < 4; i++) { const cx = (i * 97 + t / 60) % 380 - 30; R(cx, 22 + i * 9, 26, 6, 'rgba(255,255,255,.7)'); R(cx + 5, 18 + i * 9, 14, 5, 'rgba(255,255,255,.7)'); }
  R(0, 112, 320, 68, sunset ? '#3e8a3a' : '#00a83a');
  for (let x = 4; x < 320; x += 9) P(x, 116 + (x % 5), sunset ? '#2e6a2a' : '#008751');
  for (const tx of [22, 290]) { R(tx + 6, 72, 6, 44, '#6b3a2a'); R(tx - 4, 52, 26, 26, sunset ? '#2e6a2a' : '#008751'); R(tx, 44, 18, 12, sunset ? '#2e6a2a' : '#008751'); }
}

/* =========================================================
   ESCENAS
   ========================================================= */
const loveTune = (a, notes, start = 0.15, step = 0.26, type = 'triangle') => notes.forEach((f, i) => { if (f) a.tone(f, step * 1.6, type, 0.032, start + i * step); });

Object.assign(SCENES, {
  /* ---------- Citas ---------- */
  date: {
    dur: 4800,
    setup(o) { const s = G.s; return { look: meLook(s), outfit: s.life.outfit, p: s.life.partner, flies: Array.from({ length: 6 }, () => [Math.random() * 320, 120 + Math.random() * 50, Math.random() * 6]) }; },
    sound(a, o) {
      const mel = o.kind === 'cine' ? [392, 0, 440, 0, 494, 523, 0, 587, 659, 0, 587, 523] : [523, 659, 784, 659, 587, 698, 880, 698, 659, 784, 1047, 784];
      loveTune(a, mel);
      [131, 175, 196, 131].forEach((f, i) => a.tone(f, 0.9, 'sine', 0.05, 0.15 + i * 0.95));
    },
    draw(t, o, st) {
      const p = st.p; if (!p) return;
      const close = clamp((t - 1800) / 700, 0, 1);
      if (o.kind === 'cena') {
        R(0, 0, 320, 180, '#3b1a2a'); for (let x = 0; x < 320; x += 20) R(x, 0, 2, 120, '#4a2236');
        R(110, 18, 100, 50, '#2a1f10'); R(113, 21, 94, 44, '#0d0b1a');
        for (let i = 0; i < 12; i++) R(116 + i * 7, 46 - (i * 13) % 20, 5, 19 + (i * 13) % 20, '#1d2b53');
        for (let i = 0; i < 18; i++) if (((t / 500 + i) | 0) % 4) P(118 + (i * 11) % 88, 30 + (i * 7) % 30, '#ffec27');
        R(0, 120, 320, 60, '#2a1018');
        const gx = 6 * close;
        drawProducerFront(128 + gx, 168, st.look, st.outfit, t, 'idle');
        drawPartnerFig(192 - gx, 168, p, t, { blush: close > 0.5 });
        // mesa con mantel y vela
        R(90, 142, 140, 5, '#fff1e8'); R(94, 147, 132, 33, '#e8ddd0'); R(94, 147, 132, 2, '#c2b8aa');
        R(158, 130, 4, 12, '#fff1e8'); const fl = ((t / 120) | 0) % 2; R(159, 126 - fl, 2, 4, '#ffec27'); P(159, 125 - fl, '#ffa300');
        csGlow(160, 128, 44, 30, 'rgba(255,170,60,.2)');
        R(118, 139, 18, 3, '#fff1e8'); R(184, 139, 18, 3, '#fff1e8'); R(122, 137, 8, 2, '#ab5236'); R(188, 137, 8, 2, '#00a83a');
        const lift = t > 2600 && t < 3400 ? 5 : 0;
        for (const gx2 of [144, 172]) { R(gx2, 128 - lift, 4, 6, '#ff004d'); R(gx2 + 1, 134 - lift, 2, 8 + lift, '#c2c3c7'); }
        if (t > 2900 && t < 3300) { P(160, 120, '#fff1e8'); P(158, 118, '#fff1e8'); P(162, 118, '#fff1e8'); }
        heartsUp(t, 157, 108, 3, 3300);
      } else if (o.kind === 'paseo' || o.kind === 'picnic') {
        bgPark(t, o.kind === 'paseo');
        if (o.kind === 'picnic') {
          R(110, 142, 100, 22, '#ff004d'); for (let i = 0; i < 10; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2) R(110 + i * 10, 142 + j * 11, 10, 11, '#fff1e8');
          R(192, 132, 16, 12, '#ab5236'); R(194, 128, 12, 2, '#6b3a2a'); R(196, 136, 5, 3, '#ff004d');
          drawProducerFront(140 + 4 * close, 150, st.look, st.outfit, t, t > 3000 ? 'cheer' : 'idle');
          drawPartnerFig(176 - 4 * close, 150, p, t, { blush: close > 0.5, jump: t > 3000 });
          st.flies.forEach(([fx, fy, ph]) => { const x = (fx + t / 40) % 320, y = fy - 40 + Math.sin(t / 300 + ph) * 6; R(x, y, 2, 1, ((t / 120 + ph) | 0) % 2 ? '#ff77a8' : '#ffec27'); });
        } else {
          R(0, 146, 320, 12, '#c9a26a'); for (let x = 0; x < 320; x += 16) R(x, 151, 6, 1, '#b08a58');
          const walk = clamp(t / 2200, 0, 1), x0 = -30 + walk * 170;
          const step = walk < 1 ? ((t / 180) | 0) % 2 : 0;
          drawProducerFront(x0, 156 - step, st.look, st.outfit, t, 'idle');
          drawPartnerFig(x0 + 22 - (walk >= 1 ? 4 * close : 0), 156 - (1 - step) * (walk < 1 ? 1 : 0), p, t, { blush: walk >= 1 });
          R(x0 + 6, 140, 9, 2, st.look.skin || '#c48a5e'); // de la mano
        }
        heartsUp(t, 152, 92, 3, 2600);
      } else {
        // cine
        R(0, 0, 320, 180, '#0d0b1a');
        const hue = (t / 8) % 360;
        R(40, 12, 240, 90, '#1a1a22'); R(44, 16, 232, 82, `hsl(${hue},45%,30%)`);
        R(80 + Math.sin(t / 400) * 30, 40, 40, 30, `hsl(${(hue + 140) % 360},60%,50%)`); R(180, 30 + Math.cos(t / 500) * 10, 50, 40, `hsl(${(hue + 260) % 360},50%,45%)`);
        csGlow(160, 60, 160, 50, `hsla(${hue},70%,60%,.08)`);
        for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) {
          const sx = 20 + i * 34, sy = 120 + r * 22;
          if (r === 1 && (i === 4 || i === 5)) continue;
          R(sx, sy, 26, 18, '#7e2553'); R(sx, sy, 26, 3, '#a83a6a');
          if ((i * 7 + r * 3) % 4 === 0) { R(sx + 8, sy - 12, 10, 10, '#1a1a1a'); }
        }
        // nosotros dos, de espaldas
        const lean = Math.round(2 * close);
        const hx = 156, hy = 130;
        R(hx - 20, hy + 12, 52, 18, '#7e2553'); R(hx - 20, hy + 12, 52, 3, '#a83a6a');
        R(hx - 14 + lean, hy - 2, 12, 12, st.look.hair || '#2a1810'); R(hx - 16 + lean, hy + 9, 16, 6, '#ff77a8');
        R(hx + 6 - lean, hy - 2, 12, 12, p.look.hair); R(hx + 4 - lean, hy + 9, 16, 6, p.look.shirt);
        R(hx + 22, hy + 4, 8, 9, '#ff004d'); R(hx + 22, hy + 1, 8, 4, '#fff1e8'); for (let i = 0; i < 4; i++) P(hx + 23 + i * 2, hy + (i % 2), '#ffec27');
        heartsUp(t, hx - 1, hy - 6, 2, 2600, 10);
        R(0, 0, 320, 180, 'rgba(0,0,0,.15)');
      }
    },
    caption(t, o, st) {
      const n = st.p ? esc(st.p.name) : '';
      const T = { cena: ['Cena a la luz de las velas', `¡Salud! ${n} no deja de sonreír`], paseo: ['Paseo al atardecer', `Caminan de la mano con ${n}`], picnic: ['Picnic en el parque', `${n} la está pasando increíble`], cine: ['Noche de cine', `${n} se recuesta en tu hombro`] }[o.kind] || ['Una cita', 'Qué buen plan'];
      return t < 2300 ? `<small>Cita con ${n}</small>${T[0]}` : T[1];
    },
  },

  /* ---------- Se mudan juntos ---------- */
  movein: {
    dur: 5000,
    setup() { const s = G.s; return { look: meLook(s), outfit: s.life.outfit, p: s.life.partner }; },
    sound(a) { loveTune(a, [392, 494, 587, 784, 0, 659, 784, 988, 0, 784, 988, 1175], 0.15, 0.24, 'square'); },
    draw(t, o, st) {
      const p = st.p; if (!p) return;
      R(0, 0, 320, 120, '#29adff'); R(0, 80, 320, 40, '#a8e4ff');
      // fachada con la puerta blanca
      R(150, 34, 130, 88, '#c2c3c7'); R(146, 28, 138, 8, '#5f574f');
      R(196, 70, 30, 52, '#fff1e8'); R(200, 74, 22, 44, '#f0e8dc'); P(219, 96, '#ffc61a');
      R(160, 50, 26, 20, '#162050'); R(240, 50, 26, 20, '#162050');
      pixText('WHITE DOOR', 182, 40, '#1d2b53');
      R(0, 120, 320, 60, '#5f574f'); R(0, 120, 320, 3, '#3a3548');
      // camión de mudanzas
      const tx = Math.min(0, -120 + t / 8);
      R(tx + 10, 92, 80, 40, '#ffa300'); R(tx + 90, 104, 30, 28, '#ff004d'); R(tx + 98, 108, 16, 10, '#162050');
      pixText('MUDANZA', tx + 22, 108, '#7e2553');
      R(tx + 22, 130, 12, 12, '#1a1a1a'); R(tx + 96, 130, 12, 12, '#1a1a1a'); R(tx + 26, 134, 4, 4, '#c2c3c7'); R(tx + 100, 134, 4, 4, '#c2c3c7');
      // cajas apiladas
      for (const [bx, by] of [[110, 136], [124, 136], [117, 124]]) { R(bx, by, 14, 12, '#ab5236'); R(bx, by + 5, 14, 2, '#c9a26a'); }
      // la pareja carga una caja hacia la puerta
      const walk = clamp((t - 900) / 1800, 0, 1);
      const px = 120 + walk * 90, step = walk > 0 && walk < 1 ? ((t / 170) | 0) % 2 : 0;
      drawProducerFront(176, 156, st.look, st.outfit, t, t > 3200 ? 'cheer' : 'idle');
      drawPartnerFig(px, 156 - step, p, t, { jump: t > 3200 });
      if (t < 3200) { R(px - 8, 124 - step, 16, 12, '#ab5236'); R(px - 8, 129 - step, 16, 2, '#c9a26a'); }
      heartsUp(t, 206, 64, 3, 3300, 20);
    },
    caption(t, o, st) { const n = st.p ? esc(st.p.name) : ''; return t < 3000 ? `<small>Nueva etapa</small>¡${n} se muda contigo!` : `Ahora viven juntos. Búscale en tu casa.`; },
  },

  /* ---------- La boda ---------- */
  wedding: {
    dur: 8600,
    setup() {
      const s = G.s;
      return { look: meLook(s), outfit: weddingOutfit(s), p: s.life.partner, crowd: makeCrowd(26, 2), priest: { skin: '#e8b48a', hair: '#c2c3c7', shirt: '#1a1a1a', pants: '#1a1a1a', style: 0, glasses: true },
        petals: Array.from({ length: 60 }, () => ({ x: Math.random() * 320, y: -Math.random() * 180, v: 0.02 + Math.random() * 0.03, c: pick(['#ff77a8', '#fff1e8', '#ffec27', '#ff004d', '#29adff']), w: Math.random() * 6 })) };
    },
    sound(a) {
      // marcha nupcial propia
      loveTune(a, [523, 0, 523, 523, 0, 659, 587, 523, 587, 0, 659, 0, 784, 784, 698, 659, 587, 659, 523], 0.2, 0.3, 'triangle');
      [131, 175, 196, 131, 175, 196].forEach((f, i) => a.tone(f, 1, 'sine', 0.05, 0.2 + i * 1));
      [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => a.tone(f, i === 6 ? 0.8 : 0.16, 'square', 0.03, 5.5 + i * 0.14));
    },
    draw(t, o, st) {
      const p = st.p; if (!p) return;
      bgPark(t, false);
      // pasillo blanco
      X.fillStyle = '#fff1e8'; X.beginPath(); X.moveTo(150, 128); X.lineTo(170, 128); X.lineTo(210, 180); X.lineTo(110, 180); X.closePath(); X.fill();
      // arco de flores
      R(118, 46, 6, 86, '#fff1e8'); R(196, 46, 6, 86, '#fff1e8'); R(118, 40, 84, 8, '#fff1e8');
      for (let i = 0; i < 14; i++) { const c = ['#ff77a8', '#ff004d', '#ffec27'][i % 3]; R(116 + i * 6, 37 + (i % 2) * 3, 4, 4, c); R(115 + (i % 2) * 7, 50 + i * 6, 4, 4, c); R(195 + (i % 2) * 7, 50 + i * 6, 4, 4, c); }
      drawPerson(160, 128, st.priest, t, t > 2400 && t < 3600);
      R(152, 106, 8, 6, '#7e2553'); // libro
      // invitados a los lados
      const hype = t > 5400 ? 1 : 0;
      X.save(); X.beginPath(); X.rect(0, 0, 104, 180); X.rect(216, 0, 104, 180); X.clip();
      csCrowd(st, t, 150, 2, 280, hype);
      X.restore();
      // la pareja camina hasta el altar
      const walk = clamp(t / 2400, 0, 1), y = 190 - walk * 46;
      const step = walk < 1 ? ((t / 200) | 0) % 2 : 0;
      const kiss = clamp((t - 4200) / 500, 0, 1);
      const gap = 12 - 6 * kiss;
      drawProducerFront(160 - gap, y - step, st.look, st.outfit, t, t > 5400 ? 'cheer' : 'idle');
      drawPartnerFig(160 + gap, y - (1 - step) * (walk < 1 ? 1 : 0), p, t, { wedding: true, blush: kiss > 0, jump: t > 5400 });
      // anillos
      if (t > 3300 && t < 4200) { const k = ((t / 150) | 0) % 2; R(156, 112, 3, 3, '#ffc61a'); R(162, 112, 3, 3, '#ffc61a'); if (k) P(158, 111, '#ffffff'); }
      if (kiss > 0) drawHeart(153, 84 - kiss * 6, 2, '#ff004d');
      heartsUp(t, 157, 80, 4, 4800, 30);
      if (t > 5400) st.petals.forEach(q => {
        const yy = (q.y + (t - 5400) * q.v * 1.6) % 190, xx = q.x + Math.sin(t / 300 + q.w) * 4;
        R(xx, yy, 2, ((t / 120 + q.w) | 0) % 2 ? 2 : 1, q.c);
      });
    },
    caption(t, o, st) {
      const n = st.p ? esc(st.p.name) : '';
      if (t < 2400) return `<small>El gran día</small>La boda con ${n}`;
      if (t < 3300) return '¿Aceptas compartir tu vida, tu música y tus desvelos?';
      if (t < 4200) return '<b class="cs-gold">¡Sí, acepto!</b>';
      if (t < 5400) return 'Puede besar a su pareja...';
      return '<b class="cs-gold">¡Recién casados!</b><small>La mejor fiesta de la historia</small>';
    },
  },

  /* ---------- Momentos en persona ---------- */
  moment: {
    dur: 3400,
    setup() { const s = G.s; return { look: meLook(s), outfit: s.life.outfit, p: s.life.partner }; },
    sound(a, o) {
      if (o.kind === 'bailar') { for (let i = 0; i < 12; i++) a.tone(i % 2 ? 196 : 131, 0.12, 'square', 0.04, 0.1 + i * 0.25); loveTune(a, [659, 784, 880, 784, 659, 523, 587, 659], 0.1, 0.36, 'square'); return; }
      loveTune(a, [659, 784, 1047, 988, 784, 880, 784, 659], 0.15, 0.3);
    },
    draw(t, o, st) {
      const p = st.p; if (!p) return;
      const k = o.kind, close = clamp((t - 500) / 700, 0, 1);
      if (k === 'cocinar') {
        R(0, 0, 320, 180, '#e0d8cc'); for (let i = 0; i < 8; i++) R(10 + i * 38, 14, 34, 30, '#f0e8dc');
        R(0, 112, 320, 68, '#a0673f'); for (let y = 118; y < 180; y += 7) R(0, y, 320, 1, '#8a5a3a');
        R(40, 92, 240, 6, '#c2c3c7'); R(44, 98, 232, 30, '#7a4a2c'); for (let i = 0; i < 5; i++) P(70 + i * 44, 112, '#ffec27');
        R(146, 80, 28, 12, '#3a3a44'); R(144, 78, 32, 3, '#5f574f');
        for (let i = 0; i < 3; i++) { const q = ((t + i * 400) % 1200) / 1200; R(152 + i * 7, 74 - q * 26, 3, 4, `rgba(255,255,255,${0.6 * (1 - q)})`); }
        R(80, 86, 20, 6, '#fff1e8'); R(84, 84, 12, 3, '#ff004d'); R(220, 86, 20, 6, '#fff1e8'); R(224, 84, 12, 3, '#00e436');
        drawProducerFront(136, 164, st.look, st.outfit, t, 'idle');
        drawPartnerFig(184, 164, p, t, { blush: t > 1800 });
        R(150, 132, 6, 3, '#c2c3c7'); R(155, 128, 2, 6, '#ab5236'); // cuchara
        heartsUp(t, 157, 60, 2, 2000);
      } else if (k === 'pelicula') {
        bgHome(t, true);
        const hue = (t / 10) % 360;
        csGlow(160, 120, 140, 70, `hsla(${hue},70%,60%,.12)`);
        const lean = Math.round(3 * close);
        drawProducerFront(144 + lean, 150, st.look, st.outfit, t, 'idle');
        drawPartnerFig(176 - lean, 150, p, t, { blush: close > 0.7 });
        R(100, 124, 120, 16, '#ff77a8'); R(96, 136, 128, 18, '#c2507e'); R(94, 126, 6, 28, '#c2507e'); R(220, 126, 6, 28, '#c2507e');
        R(156, 118, 10, 8, '#ff004d'); R(156, 116, 10, 3, '#fff1e8');
        R(0, 0, 320, 180, 'rgba(10,6,30,.35)');
        heartsUp(t, 157, 90, 2, 1800);
      } else if (k === 'bailar') {
        bgHome(t, true);
        R(0, 0, 320, 180, 'rgba(10,6,30,.4)');
        for (let i = 0; i < 5; i++) { const c = ['#ff004d', '#29adff', '#00e436', '#ffec27', '#ff77a8'][(i + ((t / 250) | 0)) % 5]; csBeam(40 + i * 60, 0, 60 + i * 50 + Math.sin(t / 300 + i) * 30, 18, `${c}22`); }
        const sw = Math.round(Math.sin(t / 250) * 4);
        drawProducerFront(146 + sw, 152, st.look, st.outfit, t, 'cheer');
        drawPartnerFig(176 + sw, 152, p, t, { jump: true, sing: true });
        for (let i = 0; i < 3; i++) { const q = ((t + i * 500) % 1500) / 1500; drawNote(120 + i * 40 + Math.sin(q * 5) * 6, 90 - q * 40, ['#ffec27', '#29adff', '#ff77a8'][i]); }
      } else {
        // abrazo, beso o "son novios"
        bgHome(t, false);
        const g = k === 'abrazo' ? 10 : 7;
        const x1 = 146 + g * close, x2 = 176 - g * close;
        drawProducerFront(x1, 152, st.look, st.outfit, t, 'idle');
        drawPartnerFig(x2, 152, p, t, { blush: close > 0.6 });
        if (k === 'abrazo' && close >= 1) { R(x1 + 4, 128, 12, 3, st.look.skin || '#c48a5e'); R(x2 - 14, 132, 12, 3, p.look.skin); }
        if (close >= 1) drawHeart(157, 90 - Math.round(Math.abs(Math.sin(t / 200)) * 3), 2);
        heartsUp(t, 157, 80, 3, 1500);
      }
    },
    caption(t, o, st) {
      const n = st.p ? esc(st.p.name) : '';
      if (o.caption) return t < 1600 ? o.caption[0] : o.caption[1];
      const T = { abrazo: ['Un abrazo largo...', `${n} no te quiere soltar`], beso: [`Te acercas a ${n}...`, 'Un beso de película'], cocinar: ['Cocinan juntos', '¡Quedó delicioso!'],
        pelicula: ['Película en el sofá', `${n} se queda ${isWoman(st.p) ? 'dormida' : 'dormido'} en tu hombro`], bailar: ['Bailan en la sala', '¡Qué pasos!'] }[o.kind] || ['', ''];
      return t < 1600 ? T[0] : T[1];
    },
  },

  /* ---------- Pasar la noche juntos (con mucho tacto) ---------- */
  night: {
    dur: 5600,
    setup() { const s = G.s; return { look: meLook(s), p: s.life.partner }; },
    sound(a) {
      loveTune(a, [440, 523, 659, 523, 494, 587, 698, 587, 440, 523, 659, 880], 0.2, 0.32, 'sine');
      [523, 659, 784, 1047].forEach((f, i) => a.tone(f, 0.18, 'triangle', 0.03, 4.4 + i * 0.1));
    },
    draw(t, o, st) {
      const p = st.p; if (!p) return;
      const off = t > 1200, day = clamp((t - 4000) / 500, 0, 1);
      bgHome(t, day < 1);
      // cama doble
      R(60, 96, 8, 50, '#6b3a2a'); R(252, 96, 8, 50, '#6b3a2a'); R(60, 94, 200, 4, '#8a4a3a');
      R(68, 112, 184, 24, '#fff1e8'); R(68, 134, 184, 10, '#6b3a2a');
      R(74, 104, 32, 12, '#fff8f0'); R(74, 118, 32, 2, '#c2c3c7');
      // dos cabezas en las almohadas
      const lk = st.look;
      R(80, 100, 11, 10, lk.skin); R(79, 98, 13, 3, lk.hair);
      R(93, 101, 11, 10, p.look.skin); R(92, 99, 13, 3, p.look.hair);
      if (isWoman(p) || p.look.style === 1) R(103, 101, 3, 10, p.look.hair);
      if (day >= 1) { P(83, 104, '#0d0b1a'); P(88, 104, '#0d0b1a'); P(96, 105, '#0d0b1a'); P(101, 105, '#0d0b1a'); R(84, 107, 3, 1, '#8a4a3a'); R(97, 108, 3, 1, '#8a4a3a'); }
      else { R(82, 104, 2, 1, '#0d0b1a'); R(87, 104, 2, 1, '#0d0b1a'); R(95, 105, 2, 1, '#0d0b1a'); R(100, 105, 2, 1, '#0d0b1a'); }
      const br = Math.round(Math.sin(t / 420) * 1.2);
      R(104, 110 - br, 148, 26 + br, '#7e2553'); R(104, 110 - br, 148, 2, '#a83a6a');
      for (let x = 112; x < 248; x += 14) R(x, 116 - br, 6, 6, '#a83a6a');
      // lámpara de noche
      R(270, 104, 18, 30, '#5a3a2a'); R(274, 90, 10, 12, off && day < 1 ? '#5f574f' : '#ffa300'); R(278, 102, 2, 2, '#c2c3c7');
      if (!off) csGlow(279, 96, 30, 24, 'rgba(255,163,0,.2)');
      // oscuridad: solo la luna y corazones
      if (day < 1) {
        const dk = off ? Math.min(0.78, (t - 1200) / 600 * 0.78) : 0;
        R(0, 0, 320, 180, `rgba(6,4,22,${dk * (1 - day)})`);
        if (off) {
          csGlow(252, 50, 60, 40, `rgba(160,180,255,${0.12 * (1 - day)})`);
          heartsUp(t, 150, 100, 4, 1700, 40);
        }
      }
      if (day > 0) { R(0, 0, 320, 180, `rgba(255,236,180,${0.12 * day})`); }
    },
    caption(t, o, st) {
      const n = st.p ? esc(st.p.name) : '';
      if (t < 1200) return `Una noche tranquila con ${n}`;
      if (t < 4000) return '<small>Las luces se apagan...</small>';
      return 'Buenos días, amor';
    },
  },
});

function playLove(kind, opts = {}) {
  if (typeof Cutscene === 'undefined' || !G.s || !G.s.life.partner) return Promise.resolve();
  return Cutscene.play(kind, opts);
}

/* =========================================================
   CITAS, MOMENTOS Y LA PAREJA EN CASA
   ========================================================= */
function loveDone(p, s = G.s) {
  if (!p.did || p.did.day !== s.day) p.did = { day: s.day, ids: [] };
  return p.did.ids;
}
function loveAdd(p, n) { p.love = clamp(p.love + n, 0, 100); }

// Las cuatro citas posibles (las usan el evento, la pestaña Vida y el chat)
function dateOptions(s, p) {
  const done = loveDone(p).includes('cita');
  const D = (label, desc, cost, kind, act, love, msg) => ({
    label: cost ? `${label} (${fmtMoney(cost)})` : label, desc: done ? 'Ya salieron hoy' : desc, disabled: done || s.money < cost,
    run() {
      const err = activity({ cost, ...act }); if (err) return err;
      loveAdd(p, love); loveDone(p).push('cita');
      s.life.dates = (s.life.dates || 0) + 1;
      playLove('date', { kind });
      return msg;
    },
  });
  return [
    D('Cena elegante', '+Amor mucho, +Ánimo', 200, 'cena', { days: 0.3, animo: 12, hambre: 50 }, 20, 'Una noche perfecta.'),
    D('Cine', '+Amor, +Ánimo', 60, 'cine', { days: 0.3, animo: 14 }, 12, `${p.name} quiere repetir.`),
    D('Picnic en el parque', '+Amor, +Hambre', 40, 'picnic', { days: 0.3, animo: 10, hambre: 40 }, 12, 'El mejor picnic.'),
    D('Paseo al atardecer', '+Amor, gratis', 0, 'paseo', { days: 0.3, animo: 8 }, 10, 'Caminaron y hablaron por horas.'),
  ];
}
UI.dateMenu = function () {
  const s = G.s, p = s.life.partner; if (!p) return;
  this.choice({ title: `Cita con ${p.name}`, portrait: p.look, text: `¿A dónde llevas a ${p.name}?`,
    options: [...dateOptions(s, p), { label: 'Otro día', run() { return null; } }] });
};

// Lo que se puede hacer en persona
const LOVE_ACTS = [
  { id: 'abrazo', label: 'Abrazar', desc: '+Amor, +Ánimo', act: { animo: 5 }, love: 3, msg: p => `${p.name} te abrazó fuerte.` },
  { id: 'beso', label: 'Dar un beso', desc: '+Amor, +Ánimo', act: { animo: 6 }, love: 4, msg: p => `${p.name} sonríe.` },
  { id: 'cocinar', label: 'Cocinar juntos', desc: '+Hambre, +Amor', cost: 25, act: { days: 0.1, hambre: 70, animo: 6 }, love: 6, msg: () => 'Cocinaron algo delicioso.' },
  { id: 'pelicula', label: 'Ver una película', desc: '+Ánimo, +Amor', act: { days: 0.15, animo: 15 }, love: 5, msg: () => 'Qué buena película.' },
  { id: 'bailar', label: 'Bailar en la sala', desc: '+Ánimo, +Amor, −Energía', act: { animo: 12, energia: -5 }, love: 4, msg: () => '¡Qué pasos!' },
  { id: 'noche', label: 'Pasar la noche juntos', desc: '+Amor mucho, +Ánimo y duermes', cond: p => p.stage >= 1, night: true, love: 12, msg: p => `Pasaste la noche con ${p.name}. Despiertas con energía y de buen ánimo.` },
];
UI.partnerMenu = function () {
  const s = G.s, p = s.life.partner; if (!p) return;
  const done = loveDone(p), home = p.stage >= 2;
  const options = LOVE_ACTS.filter(a => !a.cond || a.cond(p)).map(a => ({
    label: a.cost ? `${a.label} (${fmtMoney(a.cost)})` : a.label,
    desc: done.includes(a.id) ? 'Ya lo hicieron hoy' : a.desc,
    disabled: done.includes(a.id) || (a.cost && s.money < a.cost),
    run() {
      if (a.night) { doSleep(); addNeeds({ animo: 20 }); }
      else { const err = activity({ cost: a.cost || 0, ...a.act }); if (err) return err; }
      loveAdd(p, a.love); done.push(a.id);
      playLove(a.night ? 'night' : 'moment', { kind: a.id });
      return a.msg(p);
    },
  }));
  options.push({ label: 'Invitar a salir', desc: 'Cena, cine, picnic o paseo', run: () => { UI.queue(() => UI.dateMenu()); return null; } });
  options.push({ label: 'Nada por ahora', run() { return null; } });
  const where = home ? `${p.name} está ${SPOT_NAME[partnerSpot(s)]}.` : `${p.name} vino a visitarte.`;
  this.choice({ title: p.name, portrait: p.look, text: `${where} Amor: ${Math.round(p.love)}/100. ¿Qué quieres hacer?`, options });
};

/* ---------- La pareja vive en tu casa ---------- */
const SPOT_NAME = { main: 'en la sala de control', lounge: 'en la cocina del lounge', dorm: 'en el dormitorio' };
const LOVE = { hit: null };
function partnerSpot(s = G.s, t = performance.now()) {
  const spots = ['main'];
  if (s.modules.includes('lounge')) spots.push('lounge');
  if (s.modules.includes('dormitorio')) spots.push('dorm');
  return spots[Math.floor(t / 24000) % spots.length];
}
const partnerHome = s => { const p = s && s.life && s.life.partner; return p && p.stage >= 2 ? p : null; };
function partnerBubble(x, y, t) { if (((t / 1000) | 0) % 6 === 0) drawHeart(x - 3, y - 4 - Math.round(Math.abs(Math.sin(t / 200)) * 2), 1); }
function weddingPhoto(x, y, s, p) {
  R(x, y, 24, 20, '#ffc61a'); R(x + 2, y + 2, 20, 16, '#a8e4ff'); R(x + 2, y + 13, 20, 5, '#00a83a');
  const me = lookState(s);
  R(x + 6, y + 6, 4, 4, me.skin); R(x + 6, y + 5, 4, 1, me.hair); R(x + 5, y + 10, 6, 5, '#1d1b2e');
  R(x + 14, y + 6, 4, 4, p.look.skin); R(x + 14, y + 5, 4, 1, p.look.hair); R(x + 13, y + 10, 6, 5, isWoman(p) ? '#fff1e8' : '#1d1b2e');
  P(x + 11, y + 4, '#ff004d');
}

(function () {
  const baseScene = drawScene;
  drawScene = function (ctx, s, t, opts) { LOVE.hit = null; return baseScene(ctx, s, t, opts); };

  // Sala de control: escucha tu música a tu lado
  const baseCtl = drawControl;
  drawControl = function (ctx, s, t, opts) {
    baseCtl(ctx, s, t, opts);
    const p = partnerHome(s);
    if (!p || partnerSpot(s, t) !== 'main' || !G.running) return;
    X = ctx;
    const L = layout(s), x = L.cx - 70, fy = 158;
    R(x - 7, fy - 1, 14, 2, 'rgba(0,0,0,.3)');
    drawPartnerFig(x, fy, p, t, { sing: !!(s.dev && !s.dev.finished) });
    partnerBubble(x, fy - 52, t);
    if (p.stage >= 3) weddingPhoto(L.win + 30, 74, s, p);
    LOVE.hit = { view: 0, x: x - 10, y: fy - 50, w: 20, h: 52 };
  };

  // Lounge y dormitorio
  const baseMod = drawModuleScene;
  drawModuleScene = function (ctx, s, id, idx, t, opts) {
    baseMod(ctx, s, id, idx, t, opts);
    const p = partnerHome(s);
    if (!p || !G.running || s.modules.indexOf(id) !== idx) return;
    X = ctx;
    const spot = partnerSpot(s, t);
    if (id === 'dormitorio') {
      R(192, 104, 24, 2, '#c2c3c7'); // segunda almohada
      if (p.stage >= 3) weddingPhoto(92, 36, s, p);
      if (spot === 'dorm') {
        drawPartnerFig(204, 128, p, t, {});
        R(190, 110, 34, 20, '#29adff'); R(190, 110, 34, 2, '#7fd0ff'); // cobija sobre las piernas
        const pg = ((t / 2500) | 0) % 2;
        R(195, 101, 18, 10, '#1a1a22'); R(196, 102, 7, 8, '#fff1e8'); R(205, 102, 7, 8, '#fff1e8'); R(198, 104 + pg, 3, 1, '#5f574f'); R(207, 105 - pg, 3, 1, '#5f574f'); R(198, 103, 1, 1, '#5f574f'); R(196, 109, 2, 2, p.look.skin); R(210, 109, 2, 2, p.look.skin);
        partnerBubble(204, 74, t);
        LOVE.hit = { view: idx + 1, x: 190, y: 78, w: 34, h: 52 };
      }
    } else if (id === 'lounge' && spot === 'lounge') {
      const x = 48, fy = 150;
      drawPartnerFig(x, fy, p, t, {});
      for (let i = 0; i < 2; i++) { const q = ((t + i * 500) % 1000) / 1000; R(26 + i * 6, 72 - q * 16, 2, 3, `rgba(255,255,255,${0.5 * (1 - q)})`); }
      partnerBubble(x, fy - 52, t);
      LOVE.hit = { view: idx + 1, x: x - 10, y: fy - 50, w: 20, h: 52 };
    }
  };

  // Tocar a la pareja abre lo que pueden hacer juntos
  canvas.addEventListener('click', e => {
    const s = G.s;
    if (!G.running || G.modals > 0 || !s || s.loc !== 'studio' || !LOVE.hit) return;
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * SCENE_W, y = (e.clientY - r.top) / r.height * SCENE_H;
    const h = LOVE.hit;
    if ((s.view || 0) !== h.view || x < h.x - 4 || x > h.x + h.w + 4 || y < h.y - 4 || y > h.y + h.h + 4) return;
    SFX.click(); UI.partnerMenu();
  });
  canvas.addEventListener('mousemove', e => {
    const s = G.s, h = LOVE.hit;
    let on = false;
    if (G.running && s && s.loc === 'studio' && h && (s.view || 0) === h.view) {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * SCENE_W, y = (e.clientY - r.top) / r.height * SCENE_H;
      on = x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h;
    }
    canvas.style.cursor = on ? 'pointer' : '';
  });
})();

/* =========================================================
   CHATS: hablar con tu pareja y con otros artistas
   ========================================================= */
function chatState(s = G.s) { if (!s.life.chats) s.life.chats = {}; return s.life.chats; }
function chatOf(key, s = G.s) { const C = chatState(s); return C[key] || (C[key] = { m: [], u: 0, cd: {}, last: 0 }); }
function chatPush(key, me, text, s = G.s) {
  const c = chatOf(key, s);
  c.m.push([me ? 1 : 0, text]); if (c.m.length > 40) c.m.splice(0, c.m.length - 40);
  c.last = s.day; if (!me) c.u++;
}
function chatUnread(s = G.s) { return s && s.life && s.life.chats ? Object.values(s.life.chats).reduce((a, c) => a + (c.u || 0), 0) : 0; }
function chatContacts(s) {
  const out = [];
  const p = s.life.partner;
  if (p) out.push({ key: 'p:' + p.name, name: p.name, look: p.look, kind: 'partner', sub: STAGES[p.stage] });
  s.roster.forEach(a => out.push({ key: 'r:' + a.name, name: a.name, look: a.look, kind: 'roster', ref: a, sub: 'Artista de tu sello' }));
  Object.values(s.artists).filter(a => a.look && !s.roster.some(r => r.name === a.name)).forEach(a =>
    out.push({ key: 'a:' + a.name, name: a.name, look: a.look, kind: 'artist', ref: a, sub: `${GENRES[a.genre] ? GENRES[a.genre].name : 'Artista'} · ${a.songs || 0} canción(es) contigo` }));
  const C = chatState(s);
  return out.sort((a, b) => (a.kind === 'partner' ? -1 : 0) - (b.kind === 'partner' ? -1 : 0) || ((C[b.key] || {}).last || 0) - ((C[a.key] || {}).last || 0));
}

const PARTNER_TEXTS = {
  romantica: ['Pienso en ti todo el día', '¿Ya comiste? Cuídate mucho', 'Te extraño, ¿nos vemos pronto?', 'Escuché tu última canción y me encantó'],
  fiestera: ['¡Esta noche hay fiesta en el club! ¿Vienes?', 'Quiero bailar contigo este fin de semana', 'Jajaja, vi un DJ sin audífonos y me acordé de ti'],
  tranquila: ['¿Cómo vas? No trabajes hasta tan tarde', 'Hice té, me hubiera gustado compartirlo contigo', 'Toma agua y duerme bien, ¿sí?'],
  sad: ['Siento que ya casi no hablamos...', '¿Todavía piensas en mí?', 'Te extraño, pero tú siempre estás ocupado/a'],
};
const pickText = arr => arr[Math.floor(Math.random() * arr.length)];

// Opciones para responder en cada chat
function chatReplies(s, c) {
  const p = s.life.partner, cs = chatOf(c.key, s), wk = s.week;
  const used = (id, weeks) => cs.cd[id] !== undefined && (weeks ? wk - cs.cd[id] < weeks : cs.cd[id] === 'd' + s.day);
  const mark = (id, weeks) => { cs.cd[id] = weeks ? wk : 'd' + s.day; };
  if (c.kind === 'partner') {
    const r = [
      { id: 'love', label: p.stage >= 1 ? 'Te quiero mucho' : 'Me encantas', off: used('love'), run() { mark('love'); loveAdd(p, 3); addNeeds({ animo: 2 }); return pickText(p.love > 50 ? ['¡Yo a ti! <3', 'Me hiciste el día', 'Ay, yo también <3'] : ['Gracias...', 'Ojalá lo demostraras más']); } },
      { id: 'how', label: '¿Cómo estás?', off: used('how'), run() { mark('how'); loveAdd(p, 1); return pickText(p.love > 60 ? ['¡Feliz! Pensando en ti', 'Bien, contando las horas para verte'] : p.love > 35 ? ['Bien, aquí trabajando', 'Normal, un poco cansado/a'] : ['Ahí... un poco triste la verdad']); } },
      { id: 'date', label: '¿Salimos?', go: () => UI.dateMenu() },
      { id: 'home', label: p.stage >= 2 ? 'Te espero en casa' : '¿Vienes a mi casa?', go: () => UI.partnerMenu() },
    ];
    return r;
  }
  const a = c.ref;
  if (c.kind === 'roster') {
    return [
      { id: 'how', label: '¿Cómo te sientes?', off: used('how'), run() { mark('how'); return a.energy < 25 ? 'Estoy agotado/a, necesito descansar.' : a.mood < 35 ? 'La verdad no muy bien... me siento desmotivado/a.' : a.mood > 75 ? '¡Feliz de estar en White Door Records!' : 'Bien, enfocado/a en la música.'; } },
      { id: 'cheer', label: '¡Eres lo máximo!', off: used('cheer'), run() { mark('cheer'); a.mood = clamp(a.mood + 6, 0, 100); return pickText(['¡Gracias jefe/a! A darle con todo', 'Eso me motiva mucho', '¡Vamos por ese disco de oro!']); } },
    ];
  }
  return [
    { id: 'hi', label: '¡Hola! ¿Cómo vas?', off: used('hi'), run() { mark('hi'); return a.happy > 0 ? pickText(['¡Hola! Todo bien, la canción que hicimos sigue sonando', '¡Qué más! Aquí componiendo']) : pickText(['Hola... bien', 'Ocupado/a, hablamos luego']); } },
    { id: 'collab', label: '¿Hacemos otra canción?', off: used('collab', 4), run() {
      mark('collab', 4);
      if (a.happy <= 0) return 'Mmm... la última no salió como esperaba. Más adelante.';
      if (s.offers.length >= 6 || Math.random() < 0.35) return 'Ahora estoy a full, te escribo más adelante.';
      const o = genOffer(); o.artist = { name: a.name, tier: a.tier || 0, genre: a.genre, fans: a.fans, look: a.look, returning: true }; addOffer(o);
      return '¡De una! Te mandé la propuesta a la bandeja.';
    } },
    { id: 'share', label: '¿Me compartes en tus redes?', off: used('share', 2), run() {
      mark('share', 2);
      if (a.happy <= 0) return 'No sé, no creo...';
      const f = Math.round(Math.min(800, (a.fans || 0) * 0.004) + 20); s.fans += f;
      return `¡Listo! Ya te etiqueté. (+${fmtNum(f)} fans)`;
    } },
  ];
}

UI.chats = function (startKey) {
  const s = G.s;
  let cur = startKey || null;
  const m = this.modal('', '', {});
  m.el.querySelector('.modal').classList.add('phone');
  m.el.querySelector('.modal-head h2').textContent = '';
  let typing = false;
  const render = () => {
    const d = dateLabel(s).split('·').pop().trim();
    let h = `<div class="ph-status"><span>${d}</span><span>Chats</span><span>${fmtMoney(s.money)}</span></div>`;
    const list = chatContacts(s);
    if (!cur) {
      h += '<button class="ph-back" data-phone="1">◀ Inicio</button><h3>Chats</h3>';
      if (!list.length) h += '<p class="muted">Aún no tienes contactos. Haz canciones con artistas o consigue pareja.</p>';
      h += '<div class="chat-list">' + list.map(c => {
        const ch = chatOf(c.key, s), lastM = ch.m[ch.m.length - 1];
        return `<button class="chat-row" data-c="${esc(c.key)}"><img class="portrait sm" src="${portraitURL(c.look)}" alt=""><span><b>${esc(c.name)}</b><small>${lastM ? (lastM[0] ? 'Tú: ' : '') + esc(lastM[1]) : esc(c.sub)}</small></span>${ch.u ? `<i class="chat-badge">${ch.u}</i>` : ''}</button>`;
      }).join('') + '</div>';
    } else {
      const c = list.find(x => x.key === cur);
      if (!c) { cur = null; return render(); }
      const ch = chatOf(c.key, s); ch.u = 0;
      h += `<button class="ph-back" data-back="1">◀ Chats</button><div class="chat-head"><img class="portrait sm" src="${portraitURL(c.look)}" alt=""><div><b>${esc(c.name)}</b><small>${esc(c.sub)}</small></div></div>
        <div class="chat-log">${ch.m.length ? ch.m.map(([me, tx]) => `<div class="chat-b ${me ? 'me' : ''}">${esc(tx)}</div>`).join('') : '<p class="muted small">Escríbele algo.</p>'}${typing ? '<div class="chat-b typing">escribiendo...</div>' : ''}</div>
        <div class="chat-replies">${chatReplies(s, c).map(r => `<button class="btn small" data-r="${r.id}" ${r.off || typing ? 'disabled' : ''}>${esc(r.label)}</button>`).join('')}</div>`;
    }
    m.set(h);
    const log = m.body.querySelector('.chat-log'); if (log) log.scrollTop = log.scrollHeight;
  };
  m.body.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    SFX.click();
    if (b.dataset.phone) { m.close(); UI.phone(); return; }
    if (b.dataset.back) { cur = null; render(); return; }
    if (b.dataset.c) { cur = b.dataset.c; render(); return; }
    if (b.dataset.r) {
      const c = chatContacts(s).find(x => x.key === cur); if (!c) return;
      const r = chatReplies(s, c).find(x => x.id === b.dataset.r); if (!r) return;
      chatPush(c.key, true, r.label);
      if (r.go) { saveGame(); m.close(); r.go(); return; }
      const ans = r.run();
      typing = true; render();
      setTimeout(() => {
        typing = false;
        if (G.s !== s) return;
        chatPush(c.key, false, ans); chatOf(c.key, s).u = 0;
        SFX.mail(); saveGame(); this.refresh();
        if (m.el.isConnected) render();
      }, 750);
    }
  });
  render();
};

// El celular: app Chats (con globito de no leídos)
PHONE_APPS.splice(Math.max(0, PHONE_APPS.findIndex(a => a.id === 'msg')), 0, {
  id: 'chats', icon: 'chat', color: '#00a8a0', open: () => UI.chats(),
  get name() { const n = chatUnread(G.s); return n ? `Chats<i class="ph-badge">${n}</i>` : 'Chats'; },
});

/* ---------- Mensajes que llegan solos ---------- */
(function () {
  const baseWeek = advanceWeek;
  advanceWeek = function () {
    const s = G.s;
    baseWeek();
    if (!G.running || G.s !== s) return;
    const p = s.life.partner;
    if (p && Math.random() < 0.55) {
      const pool = p.love < 35 ? PARTNER_TEXTS.sad : (PARTNER_TEXTS[p.kind] || PARTNER_TEXTS.romantica);
      const tx = pickText(pool);
      chatPush('p:' + p.name, false, tx);
      UI.toast(`${p.name}: "${tx}"`, 'mail');
    }
    const others = [...s.roster.map(a => ['r:' + a.name, a]), ...Object.values(s.artists).filter(a => a.happy > 0 && a.look).map(a => ['a:' + a.name, a])];
    if (others.length && Math.random() < 0.3) {
      const [key, a] = pick(others);
      const tx = key[0] === 'r' ? (a.energy < 25 ? 'Jefe/a, estoy muerto/a del cansancio' : pickText(['¿Cuándo grabamos algo nuevo?', 'Tengo una idea para una canción', '¡Gracias por la oportunidad!']))
        : pickText(['¡Nuestra canción sigue sonando en la radio!', 'Si un día quieres otra colaboración, escríbeme', 'Mis fans aman lo que hicimos']);
      chatPush(key, false, tx);
    }
  };
})();
