'use strict';
/* =========================================================
   WHITE DOOR — Dibujo de módulos, personal y averías
   ========================================================= */

const ROLE_COLOR = { asistente: '#ff77a8', ingeniero: '#29adff', productor: '#ffec27', manager: '#00e436', community: '#ffa300' };

function smoke(x, y, t) {
  for (let i = 0; i < 4; i++) {
    const ph = ((t / 40) + i * 25) % 100;
    const sz = 2 + ph / 30;
    R(x + Math.sin(ph / 12 + i) * 3 - sz / 2, y - ph * 0.35, sz, sz, `rgba(170,170,180,${0.55 - ph / 190})`);
  }
}
function sparks(x, y, t) {
  if (((t / 90) | 0) % 3 === 0) return;
  for (let i = 0; i < 4; i++) P(x + ((t / 30 + i * 7) % 7) - 3, y + ((t / 20 + i * 5) % 6) - 3, i % 2 ? '#ffec27' : '#fff1e8');
}

function drawBrokenFx(s, L, t) {
  const b = s.broken || {};
  if (b.pc) {
    R(L.cx - 10, 82, 20, 9, '#ff004d'); pixText('ERR', L.cx - 5, 84, '#fff1e8');
    smoke(L.cx + 6, 78, t);
  }
  if (b.mic) {
    if (s.equip.mic === 0) sparks(L.cx - 31, 92, t); else sparks(L.mx, 98, t);
  }
  if (b.monitor) {
    if (s.equip.monitor >= 2) { smoke(L.cx - 42, 86, t); smoke(L.cx + 41, 86, t + 300); }
    else sparks(L.cx + 8, 108, t);
  }
  if (b.gotera) {
    const dx = L.cx - 28, ph = (t / 12) % 110;
    R(dx - 3, 2, 8, 2, '#1d2b53');
    R(dx, 4 + ph, 1, 2, '#7fd0ff');
    R(dx - 9, 156, 20, 3, 'rgba(41,173,255,.55)'); R(dx - 6, 155, 14, 1, 'rgba(127,208,255,.6)');
  }
}

function drawAC(x, y, t, broken) {
  R(x, y, 26, 10, '#e0e0e8'); R(x, y + 9, 26, 1, '#a8a8b4');
  for (let i = 0; i < 4; i++) R(x + 3, y + 3 + i * 1.5, 20, 1, '#c2c3c7');
  P(x + 23, y + 2, broken ? '#ff004d' : '#00e436');
  if (broken) smoke(x + 13, y + 2, t);
  else if (((t / 300) | 0) % 2) { R(x + 4, y + 12, 1, 2, 'rgba(255,255,255,.3)'); R(x + 14, y + 13, 1, 2, 'rgba(255,255,255,.3)'); }
}

/* ---------- Base de cualquier módulo ---------- */
function drawModuleBase(s, title, t) {
  const st = ROOM_STYLE[s.room];
  R(0, 0, 320, 112, st.wall);
  if (st.pattern === 'slats' || st.pattern === 'gold') {
    R(0, 60, 320, 48, st.wall2);
    for (let x = 3; x < 320; x += 6) R(x, 60, 1, 48, 'rgba(0,0,0,.25)');
  } else {
    for (let y = 6; y < 104; y += 10) for (let x = ((y / 10) % 2 ? 4 : 9); x < 320; x += 10) P(x, y, st.wall2);
  }
  R(0, 0, 320, 4, 'rgba(0,0,0,.35)');
  R(0, 108, 320, 4, st.base);
  R(0, 112, 320, 68, st.floor);
  let row = 0;
  for (let y = 118; y < 182; y += 7, row++) {
    R(0, y, 320, 1, st.floor2);
    for (let x = (row * 13) % 30; x < 320; x += 34) R(x, y - 6, 1, 6, st.floor2);
  }
}
function drawPlate(title) {
  const tw = title.length * 4 - 1;
  R(160 - tw / 2 - 4, 6, tw + 8, 10, '#1a1a22'); R(160 - tw / 2 - 3, 7, tw + 6, 8, '#2a2238');
  pixText(title, Math.round(160 - tw / 2), 8, '#ffec27');
}

function drawSmallWindow(x, y, t) {
  R(x - 2, y - 2, 34, 28, '#c2c3c7');
  R(x, y, 30, 24, '#162050');
  for (let i = 0; i < 5; i++) if (((t / 600 + i * 3) | 0) % 5) P(x + 3 + i * 6, y + 3 + (i % 3) * 3, '#fff1e8');
  R(x, y + 16, 30, 8, '#120e24'); R(x + 14, y, 2, 24, '#c2c3c7');
}

/* ---------- Persona sentada en un escritorio (mirando al frente) ---------- */
function drawStation(cx, dy, st, t, wide) {
  const w = wide ? 50 : 36;
  R(cx - 7, dy - 24, 14, 16, '#2b2b3a');
  if (st) {
    const typing = ((t / 160 + cx) | 0) % 2;
    drawPerson(cx - 2, dy + 18 - typing, st.look, t, false);
  }
  R(cx - w / 2, dy, w, 3, '#a0673f'); R(cx - w / 2, dy, w, 1, 'rgba(255,255,255,.15)');
  R(cx - w / 2 + 1, dy + 3, w - 2, 17, '#7a4a2c');
  R(cx - w / 2 + 3, dy + 20, 2, 6, '#5e3a26'); R(cx + w / 2 - 5, dy + 20, 2, 6, '#5e3a26');
  R(cx + 4, dy - 12, 13, 10, '#2a2a33'); R(cx + 9, dy - 2, 3, 2, '#3a3a44');
  if (st) {
    R(cx - w / 2 + 4, dy + 7, 6, 6, ROLE_COLOR[st.type] || '#c2c3c7');
    R(cx - w / 2 + 5, dy + 8, 4, 4, 'rgba(0,0,0,.2)');
  }
}

/* ---------- Dispatcher ---------- */
function drawModuleScene(ctx, s, id, idx, t, opts) {
  X = ctx;
  const nth = s.modules.slice(0, idx).filter(m => m === id).length; // cuál copia de este módulo es
  ({ oficina: drawOffice, cabina: drawBooth, ensayo: drawRehearsal, lounge: drawLounge, dormitorio: drawDorm })[id](s, t, nth);
  drawPlate(({ oficina: 'OFICINA', cabina: 'CABINA', ensayo: 'SALA DE ENSAYO', lounge: 'LOUNGE', dormitorio: 'DORMITORIO' })[id]);
  R(0, 0, 3, 180, 'rgba(0,0,0,.35)'); R(317, 0, 3, 180, 'rgba(0,0,0,.35)'); R(0, 174, 320, 6, 'rgba(0,0,0,.25)');
  if (s.broken && s.broken.luz && ((t / 140) | 0) % 5 !== 0) R(0, 0, 320, 180, 'rgba(5,4,15,.45)');
}

function producersInBooth(s) {
  return s.roster.filter(a => a.task === 'grabar' && a.producerId).map(a => a.producerId);
}

function drawOffice(s, t, nth) {
  drawModuleBase(s, 'OFICINA', t);
  drawSmallWindow(24, 28, t); drawSmallWindow(266, 28, t);
  // Pizarra con gráfica
  R(118, 24, 84, 40, '#e8e8f0'); R(118, 24, 84, 2, '#a8a8b4'); R(118, 62, 84, 2, '#a8a8b4');
  const pts = [34, 30, 32, 24, 26, 18, 14, 16];
  for (let i = 0; i < pts.length - 1; i++) { R(124 + i * 10, 24 + pts[i], 10, 1, '#ff004d'); R(124 + i * 10 + 9, 24 + Math.min(pts[i], pts[i + 1]), 1, Math.abs(pts[i] - pts[i + 1]) + 1, '#ff004d'); }
  pixText('VENTAS', 124, 28, '#1d2b53');
  // Dispensador de agua y planta
  R(300, 76, 10, 32, '#c2c3c7'); R(301, 64, 8, 12, '#7fd0ff'); P(302, 90, '#29adff');
  drawPlant(6, t);
  // Escritorios
  const booth = hasModule('cabina', s) ? producersInBooth(s) : [];
  const team = s.staff.filter(x => !booth.includes(x.id)).slice(nth * OFFICE_DESKS, (nth + 1) * OFFICE_DESKS);
  const desks = [[62, 116], [160, 116], [258, 116], [100, 150], [198, 150], [282, 150]];
  desks.forEach(([cx, dy], i) => drawStation(cx, dy, team[i], t));
}

function drawBooth(s, t, nth) {
  drawModuleBase(s, 'CABINA', t);
  // Lado de la cabina con espuma
  R(158, 0, 162, 112, '#22222c');
  for (let y = 18; y < 106; y += 6) for (let x = 162; x < 318; x += 6) R(x + ((y / 6) % 2) * 3, y, 3, 3, '#2e2e3a');
  R(158, 112, 162, 68, '#3a3048');
  for (let y = 118; y < 180; y += 7) R(158, y, 162, 1, '#2e2640');
  const recording = s.roster.filter(a => a.task === 'grabar').slice(nth * 2, nth * 2 + 2);
  // Letrero ON AIR
  const lit = recording.length && ((t / 600) | 0) % 2 === 0;
  R(214, 20, 30, 9, '#1a1a1a'); pixText('ON AIR', 217, 22, lit ? '#ff004d' : '#4a1020');
  // Micrófonos y artistas
  [210, 272].forEach((mx, i) => {
    const a = recording[i];
    if (a) drawPerson(mx - 14, 150, a.look, t, true);
    R(mx, 112, 1, 36, '#3a3a44'); R(mx - 6, 148, 13, 1, '#3a3a44');
    R(mx - 3, 96, 7, 14, '#c2c3c7'); R(mx - 2, 97, 5, 6, '#8a8c94');
    R(mx - 9, 97, 1, 10, '#1a1a1a'); R(mx - 8, 98, 1, 8, 'rgba(0,0,0,.45)');
    if (a && ((t / 500 + i) | 0) % 2) spawnNote(mx - 12, 100, '#fff1e8');
  });
  // Vidrio
  R(154, 0, 6, 180, '#8a8c94'); R(155, 0, 4, 180, 'rgba(127,208,255,.35)');
  // Consola del productor
  R(18, 104, 128, 6, '#2a2a33'); R(18, 104, 128, 1, '#4a4a55');
  for (let i = 0; i < 30; i++) R(22 + i * 4, 106, 1, 3, ['#ff004d', '#00e436', '#ffec27', '#29adff'][i % 4]);
  R(40, 76, 40, 24, '#101018'); drawScreen(41, 77, 38, 22, t, recording.length > 0);
  R(88, 80, 10, 18, '#15151c'); R(4, 80, 10, 18, '#15151c');
  const prods = recording.map(a => s.staff.find(x => x.id === a.producerId)).filter(Boolean);
  [56, 112].forEach((cx, i) => {
    const p = prods[i];
    if (p) drawPerson(cx, 133 - (((t / 200 + i) | 0) % 2), p.look, t, false);
  });
  R(14, 110, 136, 26, '#3a3a44'); R(14, 110, 136, 2, '#5a5a66');
  for (let i = 0; i < 16; i++) R(20 + i * 8, 114, 3, 6 + ((t / 120 + i * 3) | 0) % 6, '#1a1a22');
  // Partículas de notas
  for (let i = PARTICLES.length - 1; i >= 0; i--) {
    const p = PARTICLES[i];
    p.x += p.vx; p.y += p.vy; p.life -= 0.006;
    if (p.life <= 0) { PARTICLES.splice(i, 1); continue; }
    X.globalAlpha = Math.min(1, p.life * 2); drawNote(p.x | 0, p.y | 0, p.c); X.globalAlpha = 1;
  }
}

function drawRehearsal(s, t, nth) {
  drawModuleBase(s, 'SALA DE ENSAYO', t);
  // Espejos
  for (let i = 0; i < 5; i++) {
    const x = 30 + i * 54;
    R(x, 22, 50, 80, '#9ad8f0'); R(x + 2, 24, 46, 76, '#c4ecff');
    R(x + 8, 28, 3, 60, 'rgba(255,255,255,.6)');
  }
  R(20, 84, 280, 2, '#c2c3c7');
  // Tarima
  R(70, 142, 220, 10, '#6b3a2a'); R(70, 142, 220, 2, '#8a5a3a');
  drawSynth(16, t, true);
  R(296, 82, 12, 26, '#15151c'); R(298, 92, 8, 8, '#4a4a55');
  const train = s.roster.filter(a => a.task === 'entrenar').slice(nth * 3, nth * 3 + 3);
  [120, 180, 240].forEach((x, i) => {
    const a = train[i];
    if (!a) return;
    const hop = ((t / 260 + i) | 0) % 2;
    drawPerson(x, 144 - hop, a.look, t, hop === 1);
  });
}

function drawLounge(s, t) {
  drawModuleBase(s, 'LOUNGE', t);
  // Cocina
  R(10, 26, 100, 30, '#e0d8cc'); for (let i = 0; i < 4; i++) R(12 + i * 25, 28, 23, 26, '#f0e8dc');
  R(10, 88, 100, 4, '#c2c3c7'); R(10, 92, 100, 40, '#a0673f');
  for (let i = 0; i < 4; i++) { R(12 + i * 25, 94, 23, 36, '#8a5a3a'); P(32 + i * 25, 110, '#ffec27'); }
  R(20, 76, 18, 12, '#3a3a44'); R(22, 78, 10, 8, '#1d2b53');
  R(60, 78, 8, 10, '#1a1a22'); R(61, 76, 6, 2, '#5f574f');
  if (((t / 400) | 0) % 2) R(63, 72, 1, 3, 'rgba(255,255,255,.4)');
  R(112, 56, 24, 76, '#e8e8f0'); R(112, 86, 24, 1, '#a8a8b4'); R(132, 66, 1, 12, '#5f574f'); R(132, 92, 1, 16, '#5f574f');
  // Mesa
  R(150, 120, 46, 4, '#a0673f'); R(154, 124, 3, 18, '#6b3a2a'); R(189, 124, 3, 18, '#6b3a2a');
  R(166, 114, 8, 6, '#fff1e8'); R(168, 112, 4, 2, '#ff004d');
  // TV
  R(236, 30, 56, 34, '#101018');
  const hue = (t / 20) % 360;
  R(239, 33, 50, 28, `hsl(${hue},60%,35%)`); R(250, 40, 20, 12, `hsl(${(hue + 120) % 360},70%,55%)`);
  // Sofá y artistas descansando
  const resting = s.roster.filter(a => a.task === 'descanso').slice(0, 3);
  R(218, 116, 88, 16, '#ff77a8'); R(218, 116, 88, 1, '#ffb3cf');
  resting.forEach((a, i) => drawPerson(238 + i * 26, 143, a.look, t, false));
  R(214, 130, 96, 16, '#c2507e'); R(214, 130, 96, 1, '#ff77a8'); R(212, 120, 6, 26, '#c2507e'); R(306, 120, 6, 26, '#c2507e');
  if (s.items.includes('dec_gato')) drawCat(286, 130, t);
}

function drawDorm(s, t) {
  drawModuleBase(s, 'DORMITORIO', t);
  drawSmallWindow(140, 30, t);
  // Armario
  R(24, 40, 46, 70, '#7a4a2c'); R(46, 40, 2, 70, '#5e3a26'); P(43, 76, '#ffec27'); P(50, 76, '#ffec27');
  // Cama
  R(180, 84, 6, 52, '#5e3a26'); R(180, 80, 120, 8, '#7a4a2c');
  R(186, 100, 118, 30, '#fff1e8'); R(190, 94, 26, 10, '#fff8f0');
  R(220, 98, 84, 32, '#29adff'); R(220, 98, 84, 2, '#7fd0ff');
  for (let i = 0; i < 6; i++) R(226 + i * 13, 106, 6, 6, '#1a7cc0');
  R(186, 130, 118, 6, '#7a4a2c');
  // Mesa de noche y lámpara
  R(150, 112, 22, 24, '#7a4a2c'); R(156, 98, 10, 8, '#ffec27'); R(160, 106, 2, 6, '#3a3a44');
  const g = X.createRadialGradient(161, 102, 2, 161, 102, 30);
  g.addColorStop(0, 'rgba(255,236,39,.18)'); g.addColorStop(1, 'rgba(255,236,39,0)');
  X.fillStyle = g; X.fillRect(131, 72, 60, 60);
  drawRug(110);
}
