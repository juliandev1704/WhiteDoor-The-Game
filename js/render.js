'use strict';
/* =========================================================
   WHITE DOOR — Motor gráfico 8-bit
   Todo se dibuja con píxeles en un lienzo de 320x180.
   ========================================================= */

const SCENE_W = 320, SCENE_H = 180;
let X = null; // contexto de dibujo actual

function R(x, y, w, h, c) { X.fillStyle = c; X.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function P(x, y, c) { R(x, y, 1, 1, c); }

/* ---------- Fuente de píxeles 3x5 ---------- */
const FONT = {
  A: ['010', '101', '111', '101', '101'], B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'], D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'], F: ['111', '100', '110', '100', '100'],
  G: ['011', '100', '101', '101', '011'], H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'], K: ['101', '101', '110', '101', '101'],
  L: ['100', '100', '100', '100', '111'], M: ['101', '111', '111', '101', '101'],
  N: ['110', '101', '101', '101', '101'], O: ['010', '101', '101', '101', '010'],
  P: ['110', '101', '110', '100', '100'], R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'], T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'], V: ['101', '101', '101', '101', '010'],
  W: ['101', '101', '111', '111', '101'], Y: ['101', '101', '010', '010', '010'],
  J: ['001', '001', '001', '101', '010'], Q: ['010', '101', '101', '110', '011'],
  X: ['101', '101', '010', '101', '101'], Z: ['111', '001', '010', '100', '111'],
  0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'],
  2: ['110', '001', '010', '100', '111'], 3: ['110', '001', '010', '001', '110'],
  4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '110', '001', '110'],
  6: ['011', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'],
  8: ['111', '101', '111', '101', '111'], 9: ['111', '101', '111', '001', '110'],
  '-': ['000', '000', '111', '000', '000'], '.': ['000', '000', '000', '000', '010'],
  ' ': ['000', '000', '000', '000', '000'],
};
function pixText(str, x, y, c) {
  for (const ch of str.toUpperCase()) {
    const g = FONT[ch] || FONT[' '];
    for (let r = 0; r < 5; r++) for (let k = 0; k < 3; k++) if (g[r][k] === '1') P(x + k, y + r, c);
    x += 4;
  }
}

/* ---------- Estilo de cada habitación ---------- */
const ROOM_STYLE = [
  { wall: '#3a2f5b', wall2: '#463a6e', base: '#241c3d', floor: '#8a4b2c', floor2: '#74401f', deskTop: '#a0673f', deskBody: '#7a4a2c', pattern: 'dots' },
  { wall: '#2c4a5e', wall2: '#355a70', base: '#1c3040', floor: '#9a6a3c', floor2: '#80552e', deskTop: '#e0d8cc', deskBody: '#a8a8b4', pattern: 'stripes' },
  { wall: '#4a4a55', wall2: '#3e3e48', base: '#2e2e36', floor: '#5d5d68', floor2: '#50505a', deskTop: '#3a3a44', deskBody: '#2a2a33', pattern: 'blocks' },
  { wall: '#2b2440', wall2: '#5c3a2a', base: '#1a1528', floor: '#5c3a2a', floor2: '#4a2e20', deskTop: '#1d1d28', deskBody: '#121219', pattern: 'slats' },
  { wall: '#1c2540', wall2: '#2a3658', base: '#10162a', floor: '#3b2a22', floor2: '#30221b', deskTop: '#0f0f16', deskBody: '#1a1a24', pattern: 'slats' },
  { wall: '#141b2e', wall2: '#c9a227', base: '#c9a227', floor: '#2c2c34', floor2: '#3a3a44', deskTop: '#fff1e8', deskBody: '#c2c3c7', pattern: 'gold' },
];

function layout(s) {
  const w = ROOMS[s.room].w, x0 = (SCENE_W - w) >> 1, x1 = x0 + w;
  const cx = x1 - 82;
  return { w, x0, x1, cx, mx: cx - 58, door: x0 + 6, win: x0 + 42, fw: x0 + 90 };
}

function has(s, id) { return s.items.includes(id); }

/* ---------- Partículas (notas musicales) ---------- */
const PARTICLES = [];
function spawnNote(x, y, c) {
  PARTICLES.push({ x, y, vx: (Math.random() - 0.5) * 0.25, vy: -0.25 - Math.random() * 0.2, life: 1, c });
}
function drawNote(x, y, c) { R(x, y, 2, 2, c); R(x + 1, y - 4, 1, 4, c); P(x + 2, y - 4, c); P(x + 3, y - 3, c); }

/* =========================================================
   ESCENA PRINCIPAL
   ========================================================= */
let lastNoteT = 0;
function drawScene(ctx, s, t, opts = {}) {
  X = ctx;
  if (s.loc === 'city') return drawCity(ctx, s, t);
  const view = s.view || 0;
  if (view > 0 && s.modules[view - 1]) return drawModuleScene(ctx, s, s.modules[view - 1], view - 1, t, opts);
  drawControl(ctx, s, t, opts);
}
function drawControl(ctx, s, t, opts = {}) {
  X = ctx;
  const L = layout(s), st = ROOM_STYLE[s.room];
  const dev = s.dev;
  const working = canWork(s) && !opts.frozen;
  const singing = working && dev.artist && dev.phase === 1 && dev.prog <= dev.weeksTotal;
  const studying = !!s.study;

  // Exterior
  R(0, 0, SCENE_W, SCENE_H, '#08070f');
  for (let y = 0; y < SCENE_H; y += 6) for (let x = ((y / 6) % 2) * 6 - 6; x < SCENE_W; x += 12) R(x, y, 10, 5, '#0e0c18');

  // Pared
  R(L.x0, 0, L.w, 112, st.wall);
  if (st.pattern === 'dots') {
    for (let y = 6; y < 104; y += 10) for (let x = L.x0 + ((y / 10) % 2 ? 4 : 9); x < L.x1; x += 10) P(x, y, st.wall2);
  } else if (st.pattern === 'stripes') {
    for (let x = L.x0 + 6; x < L.x1; x += 12) R(x, 0, 4, 108, st.wall2);
  } else if (st.pattern === 'blocks') {
    for (let y = 0; y < 108; y += 9) { R(L.x0, y, L.w, 1, st.wall2); for (let x = L.x0 + ((y / 9) % 2 ? 0 : 10); x < L.x1; x += 20) R(x, y, 1, 9, st.wall2); }
  } else if (st.pattern === 'slats') {
    R(L.x0, 60, L.w, 48, st.wall2);
    for (let x = L.x0 + 3; x < L.x1; x += 6) R(x, 60, 1, 48, 'rgba(0,0,0,.25)');
    R(L.x0, 59, L.w, 1, 'rgba(255,255,255,.08)');
  } else if (st.pattern === 'gold') {
    for (let x = L.x0 + 20; x < L.x1; x += 40) R(x, 0, 1, 108, 'rgba(201,162,39,.35)');
    R(L.x0, 58, L.w, 1, 'rgba(201,162,39,.5)');
  }
  R(L.x0, 0, L.w, 4, 'rgba(0,0,0,.35)');
  R(L.x0, 108, L.w, 4, st.base);

  // Piso
  R(L.x0, 112, L.w, 68, st.floor);
  if (st.pattern === 'gold') {
    for (let y = 112; y < 180; y += 17) for (let x = L.x0; x < L.x1; x += 34) { R(x, y, 34, 1, st.floor2); R(x, y, 1, 17, st.floor2); }
  } else {
    let row = 0;
    for (let y = 118; y < 182; y += 7, row++) {
      R(L.x0, y, L.w, 1, st.floor2);
      for (let x = L.x0 + ((row * 13) % 30); x < L.x1; x += 34) R(x, y - 6, 1, 6, st.floor2);
    }
  }

  // Luces LED
  if (has(s, 'dec_led')) {
    for (let x = L.x0; x < L.x1; x += 2) {
      const h = (x * 2 + t / 12) % 360;
      R(x, 4, 2, 1, `hsl(${h},100%,60%)`);
      R(x, 5, 2, 6, `hsla(${h},100%,60%,0.10)`);
    }
  }

  drawWindow(L.win, 16, t, s.room);
  drawDoor(L.door, 40, t, working);

  // Decoración de pared
  if (has(s, 'dec_neon')) drawNeon(L.cx, 8, t);
  if (has(s, 'dec_paneles')) { drawPanel(L.cx - 62, 22); drawPanel(L.cx + 52, 22); }
  if (has(s, 'dec_poster')) drawPoster(L.x1 - 20, 18);
  if (has(s, 'dec_vinilos')) drawVinyls(L.fw, 50);
  if (has(s, 'dec_discos')) drawGold(L.fw, 16);

  // Objetos del fondo (contra la pared)
  if (has(s, 'dec_lampara')) drawLamp(L.x0 + 37, t);
  if (has(s, 'inst_synth')) drawSynth(L.win + 4, t, working);
  if (has(s, 'inst_piano')) drawPiano(L.fw + 2);
  if (has(s, 'dec_planta')) drawPlant(L.x1 - 22, t);
  if (has(s, 'inst_guitarra')) drawGuitar(L.x1 - 30);

  // Escritorio y computador
  drawDesk(L.cx, st);
  drawSpeakers(L.cx, s.equip.monitor, t, working);
  drawComputer(L.cx, s.equip.pc, t, working);
  if (has(s, 'inst_teclado')) drawMidiKeys(L.cx);

  // Alfombra
  if (has(s, 'dec_alfombra')) drawRug(L.cx);

  // Artista invitado + micrófono
  if (dev && dev.artist) {
    drawPerson(L.mx - 14, 148, dev.artist.look, t, singing);
  }
  if (s.roster && s.roster.length) { // co-productores junto a la consola
    const cops = s.roster.filter(a => a.task === 'coproducir' && !(dev && dev.rosterId === a.id));
    if (cops[0] && !(dev && dev.artist)) drawPerson(L.mx - 14, 148, cops[0].look, t, working);
    else if (cops[0]) drawPerson(L.cx + 26, 150, cops[0].look, t, working);
  }
  drawMic(L.mx, s.equip.mic, L.cx);

  // Productor
  // Averías
  drawBrokenFx(s, L, t);
  if (s.room >= 2) drawAC(L.x1 - 48, 6, t, !!s.broken.aire);

  drawProducer(L.cx, t, working ? 'work' : (studying ? 'study' : 'idle'), s.life && s.life.outfit);

  // Primer plano
  if (has(s, 'inst_bateria')) drawDrums(L.x0 + 12, 166, t, working);
  if (has(s, 'dec_sofa')) drawSofa(L.x0 + 64, 150);
  if (has(s, 'dec_arcade')) { X.save(); X.translate(L.x1 - 26, 38); drawArcade(0, t); X.restore(); }
  if (has(s, 'dec_gato')) {
    if (has(s, 'dec_sofa')) drawCat(L.x0 + 100, 152, t);
    else drawCat(L.cx - 40, 166, t);
  }

  // Notas musicales
  if (working && t - lastNoteT > 450) {
    lastNoteT = t;
    const cols = ['#ff77a8', '#29adff', '#ffec27', '#00e436'];
    spawnNote(L.cx + (Math.random() * 30 - 15), 92, cols[(Math.random() * 4) | 0]);
    if (singing) spawnNote(L.mx - 12, 100, '#fff1e8');
  }
  for (let i = PARTICLES.length - 1; i >= 0; i--) {
    const p = PARTICLES[i];
    p.x += p.vx; p.y += p.vy; p.life -= 0.006;
    if (p.life <= 0) { PARTICLES.splice(i, 1); continue; }
    X.globalAlpha = Math.min(1, p.life * 2);
    drawNote(p.x | 0, p.y | 0, p.c);
    X.globalAlpha = 1;
  }

  // Sombra lateral / viñeta
  R(L.x0, 0, 3, 180, 'rgba(0,0,0,.35)');
  R(L.x1 - 3, 0, 3, 180, 'rgba(0,0,0,.35)');
  R(0, 174, SCENE_W, 6, 'rgba(0,0,0,.25)');
  if (s.broken && s.broken.luz && ((t / 140) | 0) % 5 !== 0) R(0, 0, SCENE_W, SCENE_H, 'rgba(5,4,15,.45)');
}

/* ---------- Ventana con ciudad de noche ---------- */
function drawWindow(x, y, t, room) {
  const w = 44, h = 34;
  R(x - 3, y - 3, w + 6, h + 6, '#221c33');
  R(x - 2, y - 2, w + 4, h + 4, '#c2c3c7');
  R(x, y, w, h, '#0f1638'); R(x, y + 12, w, 10, '#162050'); R(x, y + 22, w, 12, '#1d2b53');
  for (let i = 0; i < 10; i++) {
    const sx = x + ((i * 37 + 5) % w), sy = y + ((i * 17) % 14) + 1;
    if (((t / 500 + i * 7) | 0) % 6) P(sx, sy, '#fff1e8');
  }
  R(x + 33, y + 4, 5, 5, '#fff1e8'); R(x + 35, y + 3, 4, 5, '#0f1638');
  const bh = [12, 18, 9, 22, 14, 8, 16, 11, 19];
  let bx = x;
  for (let i = 0; i < bh.length && bx < x + w; i++) {
    const bw = 5 + (i % 2);
    R(bx, y + h - bh[i], Math.min(bw, x + w - bx), bh[i], '#120e24');
    for (let wy = y + h - bh[i] + 2; wy < y + h - 1; wy += 3) {
      if ((i * 3 + wy + ((t / 2000) | 0)) % 4 === 0 && bx + 2 < x + w) P(bx + 2, wy, '#ffec27');
    }
    bx += bw + 1;
  }
  R(x + w / 2 - 1, y, 2, h, '#c2c3c7'); R(x, y + h / 2 - 1, w, 2, '#c2c3c7');
  R(x - 5, y + h + 2, w + 10, 3, '#e0d8cc');
  if (room >= 1) { // cortinas
    R(x - 8, y - 5, 6, h + 6, '#7e2553'); R(x + w + 2, y - 5, 6, h + 6, '#7e2553');
    R(x - 6, y - 5, 1, h + 6, '#5e1a3e'); R(x + w + 4, y - 5, 1, h + 6, '#5e1a3e');
    R(x - 10, y - 6, w + 20, 2, '#3a3a44');
  }
}

/* ---------- La Puerta Blanca ---------- */
function drawDoor(x, y, t, onAir) {
  for (let i = 0; i < 10; i++) R(x - i, y + 72 + i, 28 + i * 2, 1, `rgba(255,241,232,${0.13 - i * 0.012})`);
  R(x - 3, y - 3, 34, 75, '#b8b0a8');
  R(x - 3, y - 3, 34, 1, '#d8d0c8');
  R(x, y, 28, 72, '#fff1e8');
  R(x + 4, y + 5, 20, 26, '#e2d8cc'); R(x + 5, y + 6, 18, 24, '#fff8f0');
  R(x + 4, y + 37, 20, 30, '#e2d8cc'); R(x + 5, y + 38, 18, 28, '#fff8f0');
  R(x + 21, y + 35, 4, 3, '#ffa300'); P(x + 22, y + 35, '#ffec27');
  R(x + 27, y, 1, 72, '#e2d8cc');
  // Letrero ON AIR
  const lit = onAir && ((t / 600) | 0) % 2 === 0;
  R(x, y - 13, 28, 9, '#1a1a1a');
  if (lit) R(x - 1, y - 14, 30, 11, 'rgba(255,0,77,.25)');
  pixText('ON AIR', x + 3, y - 11, lit ? '#ff004d' : '#4a1020');
}

/* ---------- Escritorio ---------- */
function drawDesk(cx, st) {
  R(cx - 46, 139, 92, 2, 'rgba(0,0,0,.25)');
  R(cx - 44, 109, 14, 30, st.deskBody); R(cx + 30, 109, 14, 30, st.deskBody);
  R(cx - 30, 109, 60, 4, st.deskBody);
  R(cx - 42, 116, 10, 1, 'rgba(0,0,0,.3)'); R(cx - 42, 126, 10, 1, 'rgba(0,0,0,.3)');
  R(cx + 32, 116, 10, 1, 'rgba(0,0,0,.3)'); R(cx + 32, 126, 10, 1, 'rgba(0,0,0,.3)');
  P(cx - 37, 112, '#c2c3c7'); P(cx - 37, 121, '#c2c3c7'); P(cx + 37, 112, '#c2c3c7'); P(cx + 37, 121, '#c2c3c7');
  R(cx - 46, 103, 92, 4, st.deskTop); R(cx - 46, 107, 92, 2, 'rgba(0,0,0,.3)');
  R(cx - 46, 103, 92, 1, 'rgba(255,255,255,.15)');
}

function drawScreen(x, y, w, h, t, active) {
  R(x - 3, y - 3, w + 6, h + 6, 'rgba(41,173,255,0.07)');
  R(x, y, w, h, '#0e1424');
  const colors = ['#ff77a8', '#29adff', '#00e436', '#ffa300', '#ffec27', '#83769c'];
  const rows = Math.floor((h - 2) / 3);
  for (let r = 0; r < rows; r++) {
    let px = x + 2 + ((r * 5) % 4);
    while (px < x + w - 2) {
      const bw = 3 + ((px * 7 + r * 3) % 6);
      R(px, y + 1 + r * 3, Math.min(bw, x + w - 1 - px), 2, colors[r % 6]);
      px += bw + 2 + ((px + r) % 3);
    }
  }
  if (active) R(x + 1 + Math.floor((t / 45) % (w - 2)), y, 1, h, '#fff1e8');
}

function drawComputer(cx, tier, t, active) {
  if (tier === 0) {
    R(cx - 13, 100, 26, 3, '#8a8c94'); R(cx - 12, 86, 24, 15, '#3a3a44');
    drawScreen(cx - 11, 87, 22, 12, t, active);
  } else if (tier === 1) {
    R(cx - 15, 74, 30, 22, '#1a1a22'); drawScreen(cx - 14, 75, 28, 19, t, active);
    R(cx - 2, 96, 4, 5, '#3a3a44'); R(cx - 7, 101, 14, 2, '#3a3a44');
    R(cx + 22, 84, 9, 19, '#2a2a33'); P(cx + 24, 87, '#00e436'); R(cx + 24, 90, 5, 1, '#555');
  } else if (tier === 2) {
    for (const ox of [-31, 1]) {
      R(cx + ox, 74, 30, 21, '#1a1a22'); drawScreen(cx + ox + 1, 75, 28, 18, t + ox * 50, active);
      R(cx + ox + 13, 95, 4, 6, '#3a3a44'); R(cx + ox + 9, 101, 12, 2, '#3a3a44');
    }
    drawTower(cx + 14, t, false);
  } else if (tier === 3) {
    R(cx - 28, 70, 56, 25, '#101018'); drawScreen(cx - 27, 71, 54, 22, t, active);
    R(cx - 2, 95, 4, 6, '#3a3a44'); R(cx - 9, 101, 18, 2, '#3a3a44');
    drawTower(cx + 14, t, false);
  } else {
    R(cx - 37, 74, 19, 24, '#101018'); drawScreen(cx - 36, 75, 17, 21, t + 300, active);
    R(cx + 18, 74, 19, 24, '#101018'); drawScreen(cx + 19, 75, 17, 21, t + 900, active);
    R(cx - 19, 68, 38, 27, '#101018'); drawScreen(cx - 18, 69, 36, 24, t, active);
    R(cx - 2, 95, 4, 6, '#3a3a44'); R(cx - 10, 101, 20, 2, '#3a3a44');
    drawTower(cx + 14, t, true);
  }
  R(cx - 10, 101, 17, 2, '#c2c3c7'); R(cx + 9, 101, 3, 2, '#c2c3c7');
}

function drawTower(x, t, quantum) {
  R(x, 115, 12, 24, '#15151c'); R(x + 1, 116, 10, 22, '#22222c');
  for (let i = 0; i < 20; i += 2) {
    const h = quantum ? 190 + Math.sin((t / 300) + i) * 30 : (i * 18 + t / 8) % 360;
    R(x + 2, 117 + i, 1, 2, `hsl(${h},100%,60%)`);
  }
  R(x + 5, 120, 4, 4, '#3a3a44'); R(x + 6, 121, 2, 2, quantum ? '#29adff' : '#ff77a8');
}

function drawSpeakers(cx, tier, t, active) {
  if (tier < 2) return;
  const big = tier >= 3, sw = big ? 10 : 8, sh = big ? 20 : 16;
  const pulse = active && ((t / 140) | 0) % 2;
  for (const sx of [cx - 46, cx + 46 - sw]) {
    const sy = 103 - sh;
    R(sx, sy, sw, sh, '#15151c'); R(sx + 1, sy + 1, sw - 2, sh - 2, '#24242e');
    R(sx + (sw >> 1) - 1, sy + 3, 2, 2, '#8a8c94');
    const wr = sw - 4 + (pulse ? 1 : 0);
    R(sx + (sw - wr) / 2, sy + sh - wr - 2, wr, wr, '#4a4a55');
    R(sx + (sw >> 1) - 1, sy + sh - (wr >> 1) - 3, 2, 2, '#15151c');
    if (tier >= 4) R(sx, sy + sh - 1, sw, 1, '#29adff');
  }
}

function drawMidiKeys(cx) {
  R(cx - 44, 99, 22, 4, '#2a2a33');
  for (let i = 0; i < 20; i += 2) R(cx - 43 + i, 101, 1, 2, '#fff1e8');
  P(cx - 42, 100, '#ff004d'); P(cx - 39, 100, '#00e436');
}

/* ---------- Micrófonos por nivel ---------- */
function drawMic(mx, tier, cx) {
  if (tier === 0) {
    const x = cx - 32;
    R(x, 95, 3, 8, '#5f574f'); R(x - 1, 91, 5, 5, '#c2c3c7'); R(x, 92, 3, 1, '#8a8c94'); R(x - 2, 102, 7, 1, '#3a3a44');
    return;
  }
  R(mx, 108, 1, 38, '#3a3a44');
  R(mx - 6, 146, 13, 1, '#3a3a44'); R(mx - 5, 144, 2, 2, '#3a3a44'); R(mx + 4, 144, 2, 2, '#3a3a44');
  R(mx - 1, 106, 3, 3, '#3a3a44');
  if (tier === 1) {
    R(mx - 2, 98, 5, 9, '#2a2a33'); R(mx - 2, 98, 5, 4, '#8a8c94'); P(mx - 1, 99, '#c2c3c7'); P(mx + 1, 100, '#c2c3c7');
  } else {
    // filtro anti-pop
    R(mx - 9, 94, 1, 10, '#1a1a1a'); R(mx - 8, 93, 1, 1, '#1a1a1a'); R(mx - 8, 104, 1, 1, '#1a1a1a');
    R(mx - 8, 95, 1, 8, 'rgba(0,0,0,.45)'); R(mx - 7, 99, 6, 1, '#3a3a44');
    if (tier === 2) {
      R(mx - 3, 93, 7, 14, '#c2c3c7'); R(mx - 2, 94, 5, 6, '#8a8c94'); R(mx - 4, 102, 9, 1, '#5f574f');
      for (let i = 0; i < 3; i++) P(mx - 1 + i, 96 + i, '#e0e0e8');
    } else if (tier === 3) {
      R(mx - 3, 91, 7, 16, '#1a1a22'); R(mx - 2, 92, 5, 6, '#5f574f'); R(mx - 3, 99, 7, 1, '#ffa300');
      R(mx - 4, 103, 9, 1, '#ffa300'); P(mx, 94, '#8a8c94');
    } else {
      R(mx - 3, 89, 7, 18, '#ffa300'); R(mx - 2, 90, 5, 7, '#ffec27'); R(mx - 3, 98, 7, 1, '#ab5236');
      for (let i = 0; i < 3; i++) R(mx - 2, 91 + i * 2, 5, 1, '#c9a227');
      R(mx - 4, 103, 9, 1, '#ff004d');
    }
  }
}

/* ---------- Productor (de espaldas) ---------- */
function drawProducer(cx, t, state, outfitId) {
  const bob = state === 'work' ? ((t / 180) | 0) % 2 : ((t / 700) | 0) % 2;
  const of = (typeof OUTFITS !== 'undefined' && OUTFITS.find(o => o.id === outfitId)) || { color: '#e8e0d8', shade: '#c2bab2' };
  const hood = of.color, hood2 = of.shade, hair = '#2a1810';
  const ay = state === 'work' ? ((t / 110) | 0) % 2 : 0;
  // brazos
  R(cx - 15, 115 + ay, 4, 9, hood2); R(cx + 11, 115 + (state === 'work' ? 1 - ay : 0), 4, 9, hood2);
  // torso y capucha
  R(cx - 12, 113 + bob, 24, 14, hood); R(cx - 11, 112 + bob, 22, 1, hood);
  R(cx - 6, 110 + bob, 12, 4, hood2); R(cx - 5, 113 + bob, 10, 2, hood2);
  // cabeza
  R(cx - 6, 98 + bob, 12, 13, hair); R(cx - 5, 97 + bob, 10, 1, hair); R(cx - 4, 110 + bob, 8, 1, '#c48a5e');
  // audífonos
  R(cx - 6, 96 + bob, 12, 2, '#1a1a1a'); R(cx - 7, 97 + bob, 1, 4, '#1a1a1a'); R(cx + 6, 97 + bob, 1, 4, '#1a1a1a');
  R(cx - 8, 101 + bob, 3, 7, '#ff004d'); R(cx + 5, 101 + bob, 3, 7, '#ff004d');
  P(cx - 8, 101 + bob, '#ff77a8'); P(cx + 5, 101 + bob, '#ff77a8');
  // libro cuando estudia
  if (state === 'study') {
    R(cx + 9, 106 + bob, 9, 7, '#29adff'); R(cx + 10, 107 + bob, 7, 5, '#fff1e8'); R(cx + 13, 107 + bob, 1, 5, '#c2c3c7');
  }
  // silla (delante del cuerpo)
  R(cx - 11, 120, 22, 19, '#2b2b3a'); R(cx - 10, 121, 20, 1, '#3d3d52'); R(cx - 11, 120, 1, 19, '#232331');
  R(cx - 12, 139, 24, 3, '#1d1d28'); R(cx - 1, 142, 2, 8, '#3a3a44');
  R(cx - 11, 150, 22, 2, '#3a3a44'); P(cx - 11, 152, '#1a1a1a'); P(cx + 10, 152, '#1a1a1a'); P(cx, 152, '#1a1a1a');
}

/* ---------- Artistas (de frente) ---------- */
function drawPerson(x, fy, look, t, singing) {
  const { skin, hair, shirt, pants, style, glasses } = look;
  const bob = singing ? ((t / 250) | 0) % 2 : 0;
  fy -= 0;
  // piernas
  R(x - 4, fy - 14, 3, 13, pants); R(x + 1, fy - 14, 3, 13, pants);
  R(x - 5, fy - 2, 4, 2, '#1a1a1a'); R(x + 1, fy - 2, 4, 2, '#1a1a1a');
  // cuerpo
  const by = fy - bob;
  R(x - 6, by - 30, 12, 17, shirt); R(x - 6, by - 30, 12, 1, 'rgba(255,255,255,.2)'); R(x - 6, by - 14, 12, 1, 'rgba(0,0,0,.25)');
  if (singing) {
    R(x - 8, by - 29, 2, 11, shirt); R(x - 8, by - 18, 2, 2, skin);
    R(x + 6, by - 29, 2, 5, shirt); R(x + 6, by - 34, 2, 5, shirt); R(x + 5, by - 36, 2, 2, skin);
  } else {
    R(x - 8, by - 29, 2, 12, shirt); R(x + 6, by - 29, 2, 12, shirt);
    R(x - 8, by - 17, 2, 2, skin); R(x + 6, by - 17, 2, 2, skin);
  }
  R(x - 1, by - 32, 3, 2, skin);
  R(x - 5, by - 42, 10, 10, skin);
  switch (style) {
    case 0: R(x - 5, by - 44, 10, 3, hair); R(x - 5, by - 42, 1, 4, hair); R(x + 4, by - 42, 1, 4, hair); break;
    case 1: R(x - 6, by - 44, 12, 4, hair); R(x - 6, by - 41, 2, 13, hair); R(x + 4, by - 41, 2, 13, hair); break;
    case 2: R(x - 7, by - 48, 14, 7, hair); R(x - 7, by - 42, 2, 5, hair); R(x + 5, by - 42, 2, 5, hair); break;
    case 3: R(x - 5, by - 44, 10, 3, shirt); R(x - 6, by - 42, 12, 1, shirt); R(x + 4, by - 42, 4, 1, shirt); R(x - 5, by - 41, 1, 3, hair); break;
    default: R(x - 5, by - 43, 10, 2, hair); R(x - 1, by - 47, 3, 4, hair); break;
  }
  if (glasses) { R(x - 4, by - 39, 9, 2, '#0d0b1a'); P(x - 3, by - 39, '#5f574f'); }
  else { P(x - 3, by - 38, '#0d0b1a'); P(x + 2, by - 38, '#0d0b1a'); }
  const open = singing && ((t / 160) | 0) % 3 !== 0;
  R(x - 1, by - 35, 3, open ? 2 : 1, open ? '#7e2553' : '#8a4a3a');
}

/* ---------- Decoración ---------- */
function drawNeon(cx, y, t) {
  const flick = ((t / 90) | 0) % 47 === 0;
  const c = flick ? '#5e1a3e' : '#ff77a8';
  R(cx - 23, y - 3, 46, 11, 'rgba(255,119,168,0.10)');
  pixText('WHITE DOOR', cx - 19, y, c);
  if (!flick) for (let i = 0; i < 39; i += 3) P(cx - 19 + i, y + 6, 'rgba(255,119,168,.3)');
}
function drawPanel(x, y) {
  R(x, y, 10, 44, '#22222c');
  for (let j = 0; j < 11; j++) for (let i = 0; i < 2; i++) R(x + 1 + i * 5 + (j % 2) * 2 - (j % 2) * 2, y + 1 + j * 4, 3, 3, (i + j) % 2 ? '#34343f' : '#2c2c36');
}
function drawPoster(x, y) {
  R(x, y, 16, 22, '#1d2b53'); R(x + 1, y + 1, 14, 20, '#ff77a8');
  R(x + 4, y + 3, 8, 8, '#ffec27'); R(x + 3, y + 4, 10, 6, '#ffec27');
  R(x + 1, y + 9, 14, 4, '#7e2553');
  R(x + 3, y + 15, 10, 1, '#1d2b53'); R(x + 3, y + 17, 7, 1, '#1d2b53');
  P(x + 7, y, '#c2c3c7');
}
function drawVinyls(x, y) {
  const cs = ['#1a1a1a', '#ff004d', '#1a1a1a', '#29adff', '#ffec27', '#1a1a1a', '#00e436'];
  for (let i = 0; i < cs.length; i++) R(x + 1 + i * 3, y, 2, 10, cs[i]);
  R(x + 22, y + 2, 8, 8, '#1a1a1a'); R(x + 24, y + 4, 4, 4, '#ff77a8');
  R(x, y + 10, 32, 2, '#6b3a2a'); R(x + 2, y + 12, 2, 3, '#4a2818'); R(x + 28, y + 12, 2, 3, '#4a2818');
}
function drawGold(x, y) {
  for (let i = 0; i < 3; i++) {
    const fx = x + i * 15;
    R(fx, y, 13, 15, '#1a1a1a'); R(fx + 1, y + 1, 11, 13, '#2a2238');
    R(fx + 3, y + 3, 7, 7, '#ffa300'); R(fx + 4, y + 2, 5, 9, '#ffa300'); R(fx + 2, y + 4, 9, 5, '#ffa300');
    R(fx + 5, y + 5, 3, 3, '#ffec27'); P(fx + 6, y + 6, '#1a1a1a');
    R(fx + 3, y + 12, 7, 1, '#c2c3c7');
  }
}
function drawLamp(x, t) {
  const g = X.createRadialGradient(x, 70, 2, x, 70, 34);
  g.addColorStop(0, 'rgba(255,236,39,0.18)'); g.addColorStop(1, 'rgba(255,236,39,0)');
  X.fillStyle = g; X.fillRect(x - 34, 36, 68, 68);
  R(x - 1, 72, 2, 66, '#3a3a44'); R(x - 5, 137, 11, 2, '#3a3a44');
  R(x - 6, 64, 13, 9, '#ffa300'); R(x - 5, 65, 11, 7, '#ffec27'); R(x - 6, 72, 13, 1, '#c97a00');
}
function drawPlant(x, t) {
  const sw = ((t / 900) | 0) % 2;
  R(x + 5, 106, 2, 24, '#008751');
  R(x - 2 + sw, 108, 7, 3, '#00e436'); R(x + 7 - sw, 112, 7, 3, '#00e436');
  R(x - 1, 117, 6, 3, '#008751'); R(x + 7, 120, 6, 3, '#008751');
  R(x + 2 + sw, 101, 7, 4, '#00e436'); R(x + 4, 99, 3, 2, '#00e436');
  R(x, 128, 12, 12, '#ab5236'); R(x - 1, 127, 14, 2, '#c86a44'); R(x, 138, 12, 2, '#7a3a26');
}
function drawGuitar(x) {
  R(x, 98, 2, 26, '#6b3a2a'); R(x - 1, 94, 4, 5, '#1a1a1a'); P(x - 2, 95, '#c2c3c7'); P(x + 3, 96, '#c2c3c7');
  R(x - 3, 122, 7, 7, '#ff004d'); R(x - 4, 128, 9, 11, '#ff004d'); R(x - 3, 138, 7, 1, '#c00038');
  R(x - 2, 130, 5, 2, '#1a1a1a'); R(x - 2, 134, 5, 1, '#c2c3c7');
}
function drawSynth(x, t, active) {
  R(x + 6, 112, 2, 26, '#3a3a44'); R(x + 28, 112, 2, 26, '#3a3a44'); R(x + 4, 137, 28, 1, '#3a3a44');
  R(x + 7, 124, 22, 1, '#3a3a44');
  R(x, 104, 36, 8, '#3a3a44'); R(x + 1, 108, 34, 3, '#fff1e8');
  for (let i = 0; i < 34; i += 4) if (i % 12 !== 8) R(x + 3 + i, 108, 2, 2, '#1a1a1a');
  for (let i = 0; i < 6; i++) P(x + 3 + i * 5, 105, ['#ff004d', '#ffec27', '#29adff', '#00e436', '#ffa300', '#ff77a8'][i]);
  R(x + 2, 106, 10, 1, active ? '#00e436' : '#24242e');
}
function drawPiano(x) {
  R(x + 6, 80, 40, 2, '#0d0b1a'); R(x + 44, 80, 2, 12, '#0d0b1a'); R(x + 40, 82, 6, 1, '#2a2a33');
  R(x, 92, 50, 14, '#0d0b1a'); R(x, 92, 50, 1, '#3a3a44');
  R(x, 101, 22, 3, '#fff1e8'); for (let i = 1; i < 22; i += 3) P(x + i, 101, '#1a1a1a');
  R(x + 3, 106, 2, 32, '#0d0b1a'); R(x + 44, 106, 2, 32, '#0d0b1a');
  R(x + 2, 128, 18, 3, '#1a1a22'); R(x + 3, 131, 2, 7, '#1a1a22'); R(x + 17, 131, 2, 7, '#1a1a22');
}
function drawArcade(x, t) {
  R(x, 74, 18, 64, '#7e2553'); R(x + 1, 75, 16, 62, '#a0306a');
  R(x + 2, 77, 14, 4, '#ffec27'); pixText('WD', x + 5, 77, '#7e2553');
  R(x + 3, 83, 12, 11, '#0d0b1a');
  const f = ((t / 200) | 0);
  R(x + 4 + (f % 8), 88, 2, 2, '#00e436'); R(x + 10 - (f % 5), 85, 2, 1, '#ff004d'); R(x + 4, 92, 10, 1, '#29adff');
  R(x + 1, 96, 16, 5, '#1d2b53'); R(x + 4, 96, 1, 3, '#c2c3c7'); P(x + 4, 95, '#ff004d'); P(x + 11, 98, '#ffec27'); P(x + 13, 98, '#29adff');
  R(x, 136, 18, 2, '#4a1030');
}
function drawRug(cx) {
  R(cx - 36, 152, 72, 18, '#7e2553'); R(cx - 34, 154, 68, 14, '#a0306a');
  R(cx - 30, 158, 60, 6, '#ff77a8'); R(cx - 26, 160, 52, 2, '#ffec27');
  for (let i = cx - 36; i < cx + 36; i += 3) { P(i, 151, '#c2c3c7'); P(i, 170, '#c2c3c7'); }
}
function drawSofa(x, y) {
  R(x - 4, y + 2, 6, 20, '#1a6ea8'); R(x + 60, y + 2, 6, 20, '#1a6ea8');
  R(x, y, 62, 14, '#29adff'); R(x, y, 62, 1, '#7fd0ff');
  R(x + 30, y + 1, 1, 12, '#1a6ea8');
  R(x, y + 14, 62, 8, '#1a6ea8'); R(x - 4, y + 22, 70, 2, '#0d4a78');
  R(x, y + 24, 2, 2, '#1a1a1a'); R(x + 60, y + 24, 2, 2, '#1a1a1a');
}
function drawCat(x, y, t) {
  const c = '#1a1a22';
  R(x, y - 5, 9, 5, c); R(x + 1, y - 6, 7, 1, c);
  R(x + 6, y - 10, 5, 5, c); P(x + 6, y - 11, c); P(x + 10, y - 11, c);
  const blink = ((t / 150) | 0) % 30 === 0;
  if (!blink) { P(x + 7, y - 8, '#ffec27'); P(x + 9, y - 8, '#ffec27'); }
  P(x + 8, y - 7, '#ff77a8');
  const tf = ((t / 400) | 0) % 2;
  R(x - 1, y - 7 + tf, 1, 5 - tf, c); R(x - 2, y - 9 + tf, 1, 3, c);
}
function drawDrums(x, y, t, active) {
  const hit = active && ((t / 200) | 0) % 2;
  R(x + 2, y - 30 - (hit ? 1 : 0), 12, 1, '#ffec27'); R(x + 7, y - 29, 1, 27, '#8a8c94');
  R(x + 34, y - 26, 12, 1, '#ffec27'); R(x + 39, y - 25, 1, 23, '#8a8c94');
  R(x + 12, y - 18, 18, 16, '#ff004d'); R(x + 14, y - 16, 14, 12, '#fff1e8'); R(x + 19, y - 12, 4, 4, '#ff004d');
  R(x + 10, y - 22, 9, 5, '#ff004d'); R(x + 11, y - 23, 7, 1, '#fff1e8');
  R(x + 23, y - 22, 9, 5, '#ff004d'); R(x + 24, y - 23, 7, 1, '#fff1e8');
  R(x + 32, y - 12, 9, 5, '#c2c3c7'); R(x + 32, y - 13, 9, 1, '#fff1e8'); R(x + 36, y - 7, 1, 7, '#8a8c94');
  R(x + 10, y - 2, 22, 1, 'rgba(0,0,0,.3)');
}

/* =========================================================
   ICONOS 12x12 (para menús)
   ========================================================= */
const ICON_PAL = {
  k: '#0d0b1a', w: '#fff1e8', g: '#c2c3c7', d: '#5f574f', r: '#ff004d', o: '#ffa300', y: '#ffec27',
  b: '#29adff', n: '#1d2b53', p: '#ff77a8', l: '#00e436', e: '#008751', m: '#ab5236', v: '#83769c', u: '#7e2553',
};
const ICONS = {
  note: ['....kkkkkk..', '....kpppppk.', '....kpkkkpk.', '....kpk..kpk', '....kpk..kpk', '....kpk..kpk',
         '..kkkpk.kkpk', '.kppppkkpppk', '.kppppkkpppk', '..kkkk..kkk.', '............', '............'],
  mail: ['............', 'kkkkkkkkkkkk', 'kwkwwwwwwkwk', 'kwwkwwwwkwwk', 'kwwwkwwkwwwk', 'kwwwwkkwwwwk',
         'kwwwwwwwwwwk', 'kwwwwwwwwwwk', 'kwwwwwwwwwwk', 'kkkkkkkkkkkk', '............', '............'],
  mic:  ['....kkkk....', '...kggggk...', '...kgdgdk...', '...kggggk...', '...kgdgdk...', '...kggggk...',
         '....kddk....', '..k..dd..k..', '...kkddkk...', '.....dd.....', '.....dd.....', '...dddddd...'],
  pc:   ['kkkkkkkkkkkk', 'knnnnnnnnnnk', 'knppnbbbnnnk', 'knnnnnnyynnk', 'knllnnnnnnnk', 'knnnbbbnnppk',
         'knnnnnnnnnnk', 'kkkkkkkkkkkk', '.....dd.....', '.....dd.....', '...dddddd...', '............'],
  speaker: ['..kkkkkkkk..', '..kddddddk..', '..kddggddk..', '..kddddddk..', '..kdggggdk..', '..kgkkkkgk..',
            '..kgkddkgk..', '..kgkddkgk..', '..kgkkkkgk..', '..kdggggdk..', '..kddddddk..', '..kkkkkkkk..'],
  phones: ['...kkkkkk...', '..k......k..', '.k........k.', '.k........k.', 'k..........k', 'k..........k',
           'krrk....krrk', 'krrk....krrk', 'krrk....krrk', 'krrk....krrk', '.kk......kk.', '............'],
  keys: ['............', '............', 'kkkkkkkkkkkk', 'kddrdldbdddk', 'kwkwkwwkwkwk', 'kwkwkwwkwkwk',
         'kwkwkwwkwkwk', 'kwwwwwwwwwwk', 'kwwwwwwwwwwk', 'kkkkkkkkkkkk', '............', '............'],
  synth: ['............', 'kkkkkkkkkkkk', 'knrnynbnlnnk', 'knnnnnnnnnnk', 'kwkwkwwkwkwk', 'kwkwkwwkwkwk',
          'kwwwwwwwwwwk', 'kkkkkkkkkkkk', '..d......d..', '...d....d...', '..d.d..d.d..', '.d...dd...d.'],
  guitar: ['.........kk.', '........kgk.', '.......kmk..', '......kmk...', '.....kmk....', '..rrrkmk....',
           '.rrrrmrr....', 'rrrkkrrr....', 'rrrkkrrr....', 'rrrrrrrr....', '.rrrrrr.....', '..rrrr......'],
  drum: ['y..........y', '.y........y.', '..yyy..yyy..', '....rrrr....', '...rwwwwr...', '..rwwwwwwr..',
         '..rwwrrwwr..', '..rwwrrwwr..', '..rwwwwwwr..', '...rwwwwr...', '....rrrr....', '...d....d...'],
  piano: ['............', '..kkkkkk....', '.kkkkkkkkk..', 'kkkkkkkkkkkk', 'kwkwkwkwkkkk', 'kwwwwwwwkkkk',
          'kkkkkkkkkkkk', '.k........k.', '.k........k.', '.k........k.', '.k........k.', '............'],
  disk: ['.kkkkkkkkkk.', '.kbbbbbbbbk.', '.kbwwwwwwbk.', '.kbwwwwwwbk.', '.kbbbbbbbbk.', '.kbbbbbbbbk.',
         '.kbkkkkkkbk.', '.kbkggkkkbk.', '.kbkggkkkbk.', '.kbkkkkkkbk.', '.kkkkkkkkkk.', '............'],
  house: ['.....kk.....', '....kwwk....', '...kwwwwk...', '..kwwwwwwk..', '.kwwwwwwwwk.', 'kkwwwwwwwwkk',
          '.kwwkkwwppk.', '.kwwkwkwppk.', '.kwwkwkwwwk.', '.kwwkwkwwwk.', '.kkkkkkkkkk.', '............'],
  book: ['............', '.kkkkk.kkkkk', 'kbbbbbkbbbbk', 'kbwwwbkbwwbk', 'kbbbbbkbbbbk', 'kbwwbbkbwwbk',
         'kbbbbbkbbbbk', 'kbwwwbkbwwbk', 'kbbbbbkbbbbk', 'kkkkkkkkkkkk', '.....kk.....', '............'],
  star: ['.....yy.....', '.....yy.....', '....yyyy....', 'yyyyyyyyyyyy', '.yyyyyyyyyy.', '..yyyyyyyy..',
         '...yyyyyy...', '...yyyyyy...', '..yyy..yyy..', '..yy....yy..', '.yy......yy.', '............'],
  vinyl: ['....kkkk....', '..kkkkkkkk..', '.kkkddkkkkk.', '.kkdkkkkkkk.', 'kkkkkppkkkkk', 'kkkkpwwpkkkk',
          'kkkkpwwpkkkk', 'kkkkkppkkkkk', '.kkkkkkkdkk.', '.kkkkkddkkk.', '..kkkkkkkk..', '....kkkk....'],
  gear: ['.....kk.....', '..k.kggk.k..', '.kgkggggkgk.', '..kggggggk..', '.kggkkkkggk.', 'kggk....kggk',
         'kggk....kggk', '.kggkkkkggk.', '..kggggggk..', '.kgkggggkgk.', '..k.kggk.k..', '.....kk.....'],
  plant: ['....l..l....', '...lll.ll...', '..lleelll...', '.lll.lle.ll.', '...llell....', '.ll..el.ll..',
          '..lllelll...', '.....e......', '..mmmmmmmm..', '...mmmmmm...', '...mmmmmm...', '....mmmm....'],
  lamp: ['...oooooo...', '..oyyyyyyo..', '.oyyyyyyyyo.', 'oooooooooooo', '.....dd.....', '.....dd.....',
         '.....dd.....', '.....dd.....', '.....dd.....', '.....dd.....', '...dddddd...', '............'],
  rug: ['............', '............', '.g.g.g.g.g..', 'uuuuuuuuuuuu', 'uppppppppppu', 'upyyyyyyyypu',
        'upyyyyyyyypu', 'uppppppppppu', 'uuuuuuuuuuuu', '.g.g.g.g.g..', '............', '............'],
  led: ['............', 'rrooyyllbbpp', 'rrooyyllbbpp', '............', '..r..y..b...', '............',
        '.o..l..p....', '............', '...r..l..y..', '............', '............', '............'],
  cat: ['............', '.......k...k', '.......kk.kk', '.......kkkkk', '..k....kykyk', '.k.....kkpkk',
        '.k..kkkkkkk.', '..kkkkkkkkk.', '..kkkkkkkkk.', '..kkkkkkkk..', '..k.k..k.k..', '............'],
  panel: ['dddddddddddd', 'dgdgdgdgdgdd', 'ddgdgdgdgdgd', 'dgdgdgdgdgdd', 'ddgdgdgdgdgd', 'dgdgdgdgdgdd',
          'ddgdgdgdgdgd', 'dgdgdgdgdgdd', 'ddgdgdgdgdgd', 'dgdgdgdgdgdd', 'ddgdgdgdgdgd', 'dddddddddddd'],
  poster: ['nnnnnnnnnnnn', 'nppppppppppn', 'nppyyyyyyppn', 'npyyyyyyyypn', 'npyyyyyyyypn', 'nuuuuuuuuuun',
           'nuuuuuuuuuun', 'nppppppppppn', 'nppnnnnnnppn', 'nppppppppppn', 'nppnnnnpppn.', 'nnnnnnnnnnnn'],
  neon: ['............', 'p.p.p.ppp...', 'p.p.p..p....', 'ppppp..p....', '.p.p..ppp...', '............',
         'pp..ppp.ppp.', 'p.p.p.p.p.p.', 'p.p.p.p.p.p.', 'pp..ppp.ppp.', '............', '............'],
  sofa: ['............', '............', '..bbbbbbbb..', '.bbbbbbbbbb.', '.bbbbbbbbbb.', 'nbbbbbbbbbbn',
         'nnnnnnnnnnnn', 'nnnnnnnnnnnn', 'nnnnnnnnnnnn', '.k........k.', '............', '............'],
  arcade: ['.uuuuuuuuu..', '.uyyyyyyyu..', '.uuuuuuuuu..', '.ukkkkkkku..', '.uklkkrkku..', '.ukkkbkkku..',
           '.ukkkkkkku..', 'uuuuuuuuuuu.', 'unnrnnnyynu.', '.uuuuuuuuu..', '.uuuuuuuuu..', '.uuuuuuuuu..'],
  gold: ['kkkkkkkkkkkk', 'knnnnnnnnnnk', 'knnoooooonnk', 'knoooooooonk', 'knooyyyyoonk', 'knooykkyoonk',
         'knooyyyyoonk', 'knoooooooonk', 'knnoooooonnk', 'knnnnnnnnnnk', 'kngggggggnnk', 'kkkkkkkkkkkk'],
  door: ['.dddddddddd.', '.dwwwwwwwwd.', '.dwggggggwd.', '.dwgwwwwgwd.', '.dwggggggwd.', '.dwwwwwwwwd.',
         '.dwggggggwd.', '.dwgwwwwgwd.', '.dwgwwwwgod.', '.dwggggggwd.', '.dwwwwwwwwd.', '.dddddddddd.'],
  coin: ['....yyyy....', '..yyyyyyyy..', '.yyoooooooy.', '.yoyyyyyyoy.', 'yyoyyoyyyoyy', 'yyoyoooyyoyy',
         'yyoyyoyyyoyy', 'yyoyoooyyoyy', '.yoyyoyyyoy.', '.yyoooooooy.', '..yyyyyyyy..', '....yyyy....'],
  fans: ['............', '..pp...pp...', '.pppp.pppp..', 'pppppppppppp', 'pppppppppppp', 'pppppppppppp',
         '.pppppppppp.', '..pppppppp..', '...pppppp...', '....pppp....', '.....pp.....', '............'],
};
const iconCache = {};
function iconURL(name, scale = 3) {
  const key = name + '@' + scale;
  if (iconCache[key]) return iconCache[key];
  const map = ICONS[name] || ICONS.star;
  const c = document.createElement('canvas');
  c.width = 12 * scale; c.height = 12 * scale;
  const g = c.getContext('2d');
  map.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch !== '.' && ICON_PAL[ch]) { g.fillStyle = ICON_PAL[ch]; g.fillRect(x * scale, y * scale, scale, scale); }
    }
  });
  return (iconCache[key] = c.toDataURL());
}
function iconImg(name, cls = '') { return `<img class="pxicon ${cls}" src="${iconURL(name)}" alt="">`; }

/* Retrato de artista (canvas pequeño) */
function portraitURL(look) {
  const c = document.createElement('canvas');
  c.width = 20; c.height = 26;
  const g = c.getContext('2d');
  const prev = X; X = g;
  R(0, 0, 20, 26, '#251f40');
  drawPerson(10, 52, look, 0, false);
  X = prev;
  const big = document.createElement('canvas');
  big.width = 60; big.height = 78;
  const bg = big.getContext('2d');
  bg.imageSmoothingEnabled = false;
  bg.drawImage(c, 0, 0, 60, 78);
  return big.toDataURL();
}
