'use strict';
/* =========================================================
   WHITE DOOR — La ciudad (mundo abierto caminable)
   ========================================================= */

const PLACES = [
  { id: 'studio',  name: 'Estudio White Door',     sign: 'WHITE DOOR', x: 6,   y: 22, w: 46, h: 42, wall: '#fff1e8', roof: '#c2c3c7', text: '#1d2b53' },
  { id: 'cafe',    name: 'Café La Corchea',        sign: 'CAFE',       x: 58,  y: 30, w: 34, h: 34, wall: '#ab5236', roof: '#6b3a2a', text: '#ffec27' },
  { id: 'shop',    name: 'Tienda de música Do Re Mi', sign: 'MUSICA',  x: 114, y: 24, w: 46, h: 40, wall: '#29adff', roof: '#1d2b53', text: '#fff1e8' },
  { id: 'radio',   name: 'Radio FM Pixel',         sign: 'RADIO',      x: 166, y: 30, w: 36, h: 34, wall: '#ff004d', roof: '#7e2553', text: '#fff1e8' },
  { id: 'academy', name: 'Academia de Música',     sign: 'ACADEMIA',   x: 224, y: 18, w: 50, h: 46, wall: '#83769c', roof: '#5f574f', text: '#fff1e8' },
  { id: 'realty',  name: 'Bienes Raíces Pixel',    sign: 'CASAS',      x: 280, y: 30, w: 36, h: 34, wall: '#00a83a', roof: '#007a2a', text: '#fff1e8' },
  { id: 'club',    name: 'Club Neón 8',            sign: 'CLUB',       x: 6,   y: 92, w: 56, h: 40, wall: '#1d1b2e', roof: '#0d0b1a', text: '#ff77a8' },
  { id: 'agency',  name: 'Agencia de Talentos',    sign: 'TALENTOS',   x: 114, y: 90, w: 88, h: 42, wall: '#c2c3c7', roof: '#83769c', text: '#1d2b53' },
  { id: 'mall',    name: 'Centro Comercial',       sign: 'MALL',       x: 224, y: 90, w: 92, h: 42, wall: '#ffccaa', roof: '#ff77a8', text: '#7e2553' },
  { id: 'park',    name: 'Parque Central', park: true, x: 112, y: 152, w: 92, h: 28 },
];
const PLACE_BY_ID = Object.fromEntries(PLACES.map(p => [p.id, p]));
for (const p of PLACES) p.entry = p.park ? { x: 158, y: 156 } : { x: Math.round(p.x + p.w / 2), y: p.y + p.h + 4 };

const ROADS = [
  { x: 0, y: 70, w: 320, h: 14 }, { x: 0, y: 136, w: 320, h: 14 },
  { x: 96, y: 0, w: 14, h: 180 }, { x: 206, y: 0, w: 14, h: 180 },
];
const BLOCKERS = [
  ...PLACES.filter(p => !p.park).map(p => ({ x: p.x, y: p.y - 6, w: p.w, h: p.h + 6 })),
  { x: 64, y: 96, w: 28, h: 36 },     // casa decorativa
  { x: 224, y: 156, w: 92, h: 22 },   // lago
  { x: 40, y: 158, w: 16, h: 12 },    // fuente
  { x: 0, y: 0, w: 320, h: 4 },
];
const TREES = [[56, 8], [278, 8], [8, 146], [88, 160], [70, 172], [196, 158], [150, 172], [176, 170], [130, 174]];

/* ---------- Rejilla para caminar ---------- */
const CELL = 4, GW = 80, GH = 45;
const WALK = new Uint8Array(GW * GH);
(function buildGrid() {
  for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
    const x = gx * CELL + 2, y = gy * CELL + 2;
    WALK[gy * GW + gx] = BLOCKERS.some(b => x >= b.x - 2 && x < b.x + b.w + 2 && y >= b.y - 1 && y < b.y + b.h + 2) ? 0 : 1;
  }
})();
function walkable(x, y) {
  const gx = Math.floor(x / CELL), gy = Math.floor(y / CELL);
  return gx >= 0 && gy >= 0 && gx < GW && gy < GH && WALK[gy * GW + gx] === 1;
}
function findPath(x0, y0, x1, y1) {
  const sx = clamp(Math.floor(x0 / CELL), 0, GW - 1), sy = clamp(Math.floor(y0 / CELL), 0, GH - 1);
  let tx = clamp(Math.floor(x1 / CELL), 0, GW - 1), ty = clamp(Math.floor(y1 / CELL), 0, GH - 1);
  if (!WALK[ty * GW + tx]) { // busca la celda libre más cercana
    let best = null, bd = 1e9;
    for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) if (WALK[gy * GW + gx]) {
      const d = (gx - tx) ** 2 + (gy - ty) ** 2; if (d < bd) { bd = d; best = [gx, gy]; }
    }
    if (!best) return []; [tx, ty] = best;
  }
  const prev = new Int32Array(GW * GH).fill(-1);
  const start = sy * GW + sx, goal = ty * GW + tx;
  const q = [start]; prev[start] = start;
  for (let h = 0; h < q.length; h++) {
    const c = q[h];
    if (c === goal) break;
    const cx = c % GW, cy = (c / GW) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
      const n = ny * GW + nx;
      if (prev[n] !== -1 || !WALK[n]) continue;
      prev[n] = c; q.push(n);
    }
  }
  if (prev[goal] === -1) return [];
  const path = [];
  for (let c = goal; c !== start; c = prev[c]) path.push({ x: (c % GW) * CELL + 2, y: ((c / GW) | 0) * CELL + 2 });
  return path.reverse();
}

/* ---------- Estado de la ciudad (no se guarda) ---------- */
const CITY = {
  player: { x: 29, y: 68, dir: 'down', step: 0, path: [], target: null },
  npcs: [], cars: [], keys: {}, near: null,
};
function initCity() {
  CITY.npcs = Array.from({ length: 9 }, () => {
    let x, y;
    do { x = rnd(4, 316); y = rnd(4, 176); } while (!walkable(x, y));
    return { x, y, dir: 'down', step: 0, path: [], wait: rnd(0, 3), look: randomLook(0) };
  });
  const cc = ['#ff004d', '#29adff', '#ffec27', '#00e436', '#ffa300', '#c2c3c7'];
  CITY.cars = [
    { x: 0, y: 72, vx: 34, c: cc[0] }, { x: 180, y: 78, vx: -28, c: cc[1] },
    { x: 60, y: 138, vx: 30, c: cc[2] }, { x: 260, y: 144, vx: -36, c: cc[3] },
    { x: 98, y: 20, vy: 26, c: cc[4], v: true }, { x: 214, y: 120, vy: -30, c: cc[5], v: true },
  ];
}
initCity();

function enterCity() {
  const s = G.s;
  s.loc = 'city';
  const e = PLACE_BY_ID.studio.entry;
  Object.assign(CITY.player, { x: e.x, y: e.y + 2, dir: 'down', path: [], target: null });
  SFX.stopMusic();
}
function enterStudio() {
  const s = G.s;
  s.loc = 'studio';
  if (s.dev && !s.dev.finished) SFX.startMusic(s.dev.genre);
}

function playerSpeed() {
  const p = G.s.life.personal;
  return p.includes('auto') ? 95 : p.includes('bici') ? 60 : 40;
}

function cityClick(x, y) {
  const pl = CITY.player;
  const hit = PLACES.find(p => x >= p.x && x < p.x + p.w && y >= p.y - 6 && y < p.y + p.h + 4);
  const tx = hit ? hit.entry.x : x, ty = hit ? hit.entry.y : y;
  pl.path = findPath(pl.x, pl.y, tx, ty);
  pl.target = hit ? hit.id : null;
  if (hit && !pl.path.length && Math.hypot(pl.x - tx, pl.y - ty) < 8) arrive(hit.id);
}
function arrive(id) {
  CITY.player.target = null;
  CITY.player.path = [];
  UI.place(id);
}

function updateCity(dt) {
  const pl = CITY.player, k = CITY.keys;
  const sp = playerSpeed() * dt / 1000;
  let dx = (k.right ? 1 : 0) - (k.left ? 1 : 0), dy = (k.down ? 1 : 0) - (k.up ? 1 : 0);
  if (dx || dy) { pl.path = []; pl.target = null; }
  else if (pl.path.length) {
    const wp = pl.path[0];
    const ddx = wp.x - pl.x, ddy = wp.y - pl.y, d = Math.hypot(ddx, ddy);
    if (d < sp + 0.5) { pl.x = wp.x; pl.y = wp.y; pl.path.shift(); if (!pl.path.length && pl.target) arrive(pl.target); }
    else { dx = ddx / d; dy = ddy / d; }
  }
  if (dx || dy) {
    const len = Math.hypot(dx, dy) || 1;
    const nx = pl.x + dx / len * sp, ny = pl.y + dy / len * sp;
    if (walkable(nx, pl.y)) pl.x = nx;
    if (walkable(pl.x, ny)) pl.y = ny;
    pl.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    pl.step += sp;
  }
  // ¿Cerca de una puerta?
  CITY.near = PLACES.find(p => Math.hypot(pl.x - p.entry.x, pl.y - p.entry.y) < 10) || null;

  // Peatones
  for (const n of CITY.npcs) {
    if (n.wait > 0) { n.wait -= dt / 1000; continue; }
    if (!n.path.length) {
      const dest = pick(PLACES).entry;
      n.path = findPath(n.x, n.y, dest.x + rnd(-6, 6), dest.y + rnd(0, 6)).filter((_, i) => i % 2 === 0);
      n.wait = rnd(1, 5);
      continue;
    }
    const wp = n.path[0], ddx = wp.x - n.x, ddy = wp.y - n.y, d = Math.hypot(ddx, ddy), v = 18 * dt / 1000;
    if (d < v + 0.5) { n.x = wp.x; n.y = wp.y; n.path.shift(); }
    else { n.x += ddx / d * v; n.y += ddy / d * v; n.dir = Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? 'right' : 'left') : (ddy > 0 ? 'down' : 'up'); n.step += v; }
  }
  // Autos
  for (const c of CITY.cars) {
    if (c.v) { c.y += c.vy * dt / 1000; if (c.y > 190) c.y = -14; if (c.y < -14) c.y = 190; }
    else { c.x += c.vx * dt / 1000; if (c.x > 330) c.x = -14; if (c.x < -14) c.x = 330; }
  }
}

/* =========================================================
   DIBUJO DE LA CIUDAD
   ========================================================= */
function drawCity(ctx, s, t) {
  X = ctx;
  // Césped
  R(0, 0, 320, 180, '#3a7d44');
  for (let i = 0; i < 160; i++) P((i * 73) % 320, (i * 37 + (i >> 3) * 11) % 180, '#2f6a39');
  // Andenes
  for (const r of ROADS) R(r.x - 4, r.y - 4, r.w + 8, r.h + 8, '#8a8c94');
  for (const r of ROADS) {
    if (r.w > r.h) for (let x = 0; x < 320; x += 6) { P(x, r.y - 3, '#7a7c84'); P(x + 3, r.y + r.h + 2, '#7a7c84'); }
    else for (let y = 0; y < 180; y += 6) { P(r.x - 3, y, '#7a7c84'); P(r.x + r.w + 2, y + 3, '#7a7c84'); }
  }
  // Calles
  for (const r of ROADS) R(r.x, r.y, r.w, r.h, '#3a3a44');
  for (const r of ROADS) {
    if (r.w > r.h) for (let x = 2; x < 320; x += 12) R(x, r.y + 6, 6, 1, '#c2c3c7');
    else for (let y = 2; y < 180; y += 12) R(r.x + 6, y, 1, 6, '#c2c3c7');
  }
  // Cruces peatonales
  for (const vx of [96, 206]) for (const hy of [70, 136]) {
    R(vx, hy, 14, 14, '#3a3a44');
    for (let i = 0; i < 14; i += 3) { R(vx + i, hy - 4, 2, 4, '#e0e0e8'); R(vx + i, hy + 14, 2, 4, '#e0e0e8'); R(vx - 4, hy + i, 4, 2, '#e0e0e8'); R(vx + 14, hy + i, 4, 2, '#e0e0e8'); }
  }

  // Parque
  const pk = PLACE_BY_ID.park;
  R(pk.x, pk.y, pk.w, pk.h, '#4aa35a');
  R(pk.x + 4, pk.y + 10, pk.w - 8, 4, '#c8b48a');
  R(156, pk.y, 4, pk.h, '#c8b48a');
  R(pk.x + 14, pk.y + 16, 22, 9, '#29adff'); R(pk.x + 16, pk.y + 17, 6, 1, '#7fd0ff');
  R(pk.x + 60, pk.y + 4, 10, 3, '#6b3a2a'); R(pk.x + 60, pk.y + 7, 1, 2, '#3a2a1a'); R(pk.x + 69, pk.y + 7, 1, 2, '#3a2a1a');
  pixText('PARQUE', pk.x + 4, pk.y + 2, '#fff1e8');
  // Plaza con fuente
  R(0, 152, 94, 28, '#b8a890');
  for (let x = 0; x < 94; x += 8) for (let y = 152; y < 180; y += 8) P(x, y, '#a89880');
  R(40, 158, 16, 12, '#c2c3c7'); R(42, 160, 12, 8, '#29adff');
  const sp = ((t / 200) | 0) % 3;
  R(47, 156 - sp, 2, 4 + sp, '#7fd0ff');
  // Lago
  R(224, 156, 92, 22, '#1d6fb0'); R(226, 158, 88, 18, '#29adff');
  for (let i = 0; i < 6; i++) R(232 + i * 14 + ((t / 400 + i) | 0) % 4, 162 + (i % 3) * 4, 5, 1, '#7fd0ff');
  // Casa decorativa
  R(64, 100, 28, 32, '#ffccaa'); R(62, 96, 32, 6, '#ab5236'); R(74, 120, 8, 12, '#6b3a2a'); R(67, 106, 6, 6, '#7fd0ff'); R(83, 106, 6, 6, '#7fd0ff');

  // Edificios
  for (const p of PLACES) if (!p.park) drawBuilding(p, t);

  // Postes de luz
  for (const [lx, ly] of [[56, 66], [160, 66], [276, 66], [58, 132], [160, 132], [270, 132]]) {
    R(lx, ly - 12, 1, 12, '#3a3a44'); R(lx - 1, ly - 13, 3, 2, '#ffec27');
  }
  // Árboles
  for (const [tx, ty] of TREES) drawTree(tx, ty);

  // Autos
  for (const c of CITY.cars) drawCar(c.x, c.y, c.v ? (c.vy > 0 ? 'down' : 'up') : (c.vx > 0 ? 'right' : 'left'), c.c);

  // Personas (ordenadas por profundidad)
  const pl = CITY.player;
  const outfit = OUTFITS.find(o => o.id === s.life.outfit) || OUTFITS[0];
  const people = CITY.npcs.map(n => ({ ...n, npc: true }));
  people.push({ ...pl, player: true });
  people.sort((a, b) => a.y - b.y);
  for (const p of people) {
    if (p.player) {
      if (s.life.personal.includes('auto') && (pl.path.length || Object.values(CITY.keys).some(Boolean))) drawCar(p.x - 6, p.y - 6, p.dir, '#ff77a8', true);
      else drawWalker(p.x, p.y, p.dir, p.step, { skin: '#c48a5e', hair: '#2a1810', shirt: outfit.color, pants: '#1d2b53' }, true);
    } else drawWalker(p.x, p.y, p.dir, p.step, p.look, false);
  }
  // Indicador de destino
  if (pl.path.length) { const d = pl.path[pl.path.length - 1]; if (((t / 250) | 0) % 2) { R(d.x - 2, d.y, 5, 1, '#ffec27'); R(d.x, d.y - 2, 1, 5, '#ffec27'); } }
  // Flecha sobre el lugar cercano
  if (CITY.near) {
    const p = CITY.near, bob = ((t / 300) | 0) % 2;
    const ax = p.entry.x, ay = (p.park ? p.y : p.y + p.h) - 12 - bob;
    R(ax - 2, ay, 5, 2, '#ffec27'); R(ax - 1, ay + 2, 3, 1, '#ffec27'); P(ax, ay + 3, '#ffec27');
  }
}

function drawBuilding(p, t) {
  const { x, y, w, h } = p;
  R(x + 2, y + h, w, 3, 'rgba(0,0,0,.25)');
  R(x, y - 6, w, 7, p.roof); R(x, y - 6, w, 1, 'rgba(255,255,255,.2)');
  R(x, y, w, h, p.wall);
  // Ventanas
  for (let wy = y + 12; wy < y + h - 14; wy += 9) for (let wx = x + 4; wx < x + w - 6; wx += 9) {
    const lit = ((wx * 7 + wy * 3 + ((t / 3000) | 0)) % 5) < 3;
    R(wx, wy, 5, 5, lit ? '#ffec27' : '#1d2b53'); R(wx, wy + 5, 5, 1, 'rgba(0,0,0,.3)');
  }
  // Letrero
  const tw = p.sign.length * 4 - 1;
  R(x + w / 2 - tw / 2 - 2, y + 2, tw + 4, 8, 'rgba(0,0,0,.35)');
  let tc = p.text;
  if (p.id === 'club' && ((t / 500) | 0) % 2) tc = '#29adff';
  pixText(p.sign, Math.round(x + w / 2 - tw / 2), y + 3, tc);
  // Puerta
  const dx = Math.round(x + w / 2 - 5);
  if (p.id === 'studio') {
    R(dx - 1, y + h - 15, 12, 15, '#c2c3c7'); R(dx, y + h - 14, 10, 14, '#ffffff'); P(dx + 8, y + h - 7, '#ffa300');
    for (let i = 0; i < 4; i++) R(dx - i, y + h + i, 10 + i * 2, 1, `rgba(255,255,255,${0.25 - i * 0.05})`);
  } else if (p.id === 'mall') {
    R(dx - 6, y + h - 12, 22, 12, '#7fd0ff'); R(dx + 4, y + h - 12, 1, 12, '#1d6fb0');
  } else {
    R(dx, y + h - 12, 10, 12, '#3a2418'); P(dx + 8, y + h - 6, '#ffec27');
  }
  if (p.id === 'radio') {
    R(x + w - 8, y - 22, 1, 16, '#c2c3c7'); R(x + w - 11, y - 16, 7, 1, '#c2c3c7');
    if (((t / 400) | 0) % 2) R(x + w - 9, y - 24, 3, 3, '#ff004d');
  }
  if (p.id === 'cafe') { for (let i = 0; i < w; i += 6) R(x + i, y + h - 18, 3, 3, i % 12 ? '#fff1e8' : '#ff004d'); }
}

function drawTree(x, y) {
  R(x - 1, y + 4, 3, 5, '#6b3a2a');
  R(x - 5, y - 3, 11, 8, '#008751'); R(x - 4, y - 5, 9, 2, '#008751'); R(x - 3, y - 4, 4, 3, '#00b43c');
  R(x - 4, y + 9, 9, 2, 'rgba(0,0,0,.2)');
}

function drawCar(x, y, dir, c, player) {
  const horiz = dir === 'left' || dir === 'right';
  const w = horiz ? 13 : 8, h = horiz ? 8 : 13;
  R(x + 1, y + h - 1, w, 2, 'rgba(0,0,0,.25)');
  R(x, y, w, h, c);
  if (horiz) {
    R(x + (dir === 'right' ? 7 : 2), y + 1, 4, 6, '#1d2b53');
    R(x + 1, y - 1, 3, 1, '#1a1a1a'); R(x + 9, y - 1, 3, 1, '#1a1a1a'); R(x + 1, y + h, 3, 1, '#1a1a1a'); R(x + 9, y + h, 3, 1, '#1a1a1a');
  } else {
    R(x + 1, y + (dir === 'down' ? 7 : 2), 6, 4, '#1d2b53');
    R(x - 1, y + 1, 1, 3, '#1a1a1a'); R(x + w, y + 1, 1, 3, '#1a1a1a'); R(x - 1, y + 9, 1, 3, '#1a1a1a'); R(x + w, y + 9, 1, 3, '#1a1a1a');
  }
  if (player) R(x + 2, y + 2, 2, 2, '#fff1e8');
}

function drawWalker(x, y, dir, step, look, isPlayer) {
  x = Math.round(x); y = Math.round(y);
  const f = Math.floor(step / 3) % 2;
  R(x - 3, y, 7, 2, 'rgba(0,0,0,.25)');
  R(x - 2, y - 3 + (f ? 0 : 1), 2, 3 - (f ? 0 : 1), look.pants); R(x + 1, y - 3 + (f ? 1 : 0), 2, 3 - (f ? 1 : 0), look.pants);
  R(x - 3, y - 8, 7, 5, look.shirt);
  R(x - 2, y - 12, 5, 4, look.skin);
  if (dir === 'up') R(x - 2, y - 12, 5, 4, look.hair);
  else {
    R(x - 2, y - 13, 5, 2, look.hair);
    if (dir === 'down') { P(x - 1, y - 10, '#0d0b1a'); P(x + 1, y - 10, '#0d0b1a'); }
    else if (dir === 'left') { R(x + 1, y - 12, 2, 3, look.hair); P(x - 2, y - 10, '#0d0b1a'); }
    else { R(x - 2, y - 12, 2, 3, look.hair); P(x + 2, y - 10, '#0d0b1a'); }
  }
  if (isPlayer) {
    R(x - 3, y - 14, 7, 1, '#1a1a1a');
    R(x - 3, y - 11, 1, 2, '#ff004d'); R(x + 3, y - 11, 1, 2, '#ff004d');
  }
}
