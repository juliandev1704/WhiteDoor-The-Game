'use strict';
/* =========================================================
   WHITE DOOR — Arranque y bucle principal
   ========================================================= */
const canvas = $('#scene');
const ctx = canvas.getContext('2d');
const TOUCH = window.matchMedia && matchMedia('(pointer: coarse)').matches;
ctx.imageSmoothingEnabled = false;

// Estado de demostración para la pantalla de título
function makeDemoState() {
  const d = newState('Demo');
  d.room = 2;
  d.equip = { mic: 2, pc: 2, monitor: 2 };
  d.items = ['dec_planta', 'dec_lampara', 'dec_alfombra', 'dec_led', 'dec_gato', 'dec_neon', 'dec_paneles', 'dec_poster', 'dec_vinilos', 'inst_guitarra', 'inst_synth'];
  d.dev = { name: 'Demo', genre: 'pop', topic: 'amor', artist: { look: { skin: '#e8b48a', hair: '#ff77a8', shirt: '#29adff', pants: '#1d2b53', style: 1, glasses: false } },
    weeksTotal: 6, extra: 0, prog: 2.5, phase: 1, cre: 0, tec: 0, noise: 0, finished: false };
  return d;
}
const demo = makeDemoState();

/* ---------- Tamaño del lienzo ---------- */
function fit() {
  const st = $('#stage');
  const w = st.clientWidth - 8, h = st.clientHeight - 8;
  if (window.innerWidth <= 760) { // móvil: ancho completo, el HUD fluye debajo
    $('#screen').style.width = w + 'px';
    $('#screen').style.height = '';
    return;
  }
  const scale = Math.max(1, Math.min(w / SCENE_W, h / SCENE_H));
  $('#screen').style.width = Math.floor(SCENE_W * scale) + 'px';
  $('#screen').style.height = Math.floor(SCENE_H * scale) + 'px';
}
window.addEventListener('resize', fit);

/* ---------- Bucle ---------- */
let last = performance.now(), bubT = 0, uiT = 0;
function frame(now) {
  const dt = Math.min(250, now - last);
  last = now;
  const live = G.running && G.s;
  const s = live ? G.s : demo;
  const flowing = live && !G.paused && !G.away && G.modals === 0;
  if (flowing) {
    const d = dt * G.speed;
    if (canWork()) devAdvance(d / WEEK_MS);
    G.acc += d;
    while (G.acc >= DAY_MS && G.running && G.modals === 0) { G.acc -= DAY_MS; advanceDay(); }
  }
  if (live && s.loc === 'city' && G.modals === 0 && !G.away) updateCity(dt);
  try { drawScene(ctx, s, now, { frozen: live && !flowing }); }
  catch (err) { if (!frame.warned) { frame.warned = true; console.error(err); } }
  if (live) {
    UI.runQueue();
    const pr = $('#prompt');
    if (s.loc === 'city' && CITY.near && G.modals === 0) {
      pr.hidden = false;
      pr.textContent = (TOUCH ? 'Tocar · Entrar: ' : 'E · Entrar: ') + CITY.near.name;
    } else pr.hidden = true;
  }
  bubT += dt;
  if (bubT > 650) { bubT = 0; if (live) UI.flushBubbles(); }
  uiT += dt;
  if (uiT > 250) { uiT = 0; if (live) { UI.updateDev(); UI.updateNeeds(); $('#t-date').textContent = dateLabel(G.s); } }
  requestAnimationFrame(frame);
}

/* ---------- Título ---------- */
function showTitle() {
  G.running = false;
  SFX.stopMusic();
  $('#modal-root').innerHTML = '';
  G.modals = 0; G.events = [];
  $('#title-screen').hidden = false;
  $('#app').classList.add('blur');
  $('#btn-continue').hidden = !hasSave();
  const sv = loadGame();
  if (sv) $('#title-name').value = sv.producer;
}

function startGame(state, isNew) {
  SFX.init();
  G.s = state; G.running = true; G.paused = false; G.speed = 1; G.acc = 0; G.events = [];
  if (state.loc === 'city') { const e = PLACE_BY_ID.studio.entry; Object.assign(CITY.player, { x: e.x, y: e.y + 2, path: [], target: null }); }
  $('#title-screen').hidden = true;
  $('#app').classList.remove('blur');
  refreshCandidates();
  UI.refresh();
  if (isNew) { saveGame(); UI.help(true); }
  else if (state.version === 2 && !state.life.seenV2) {
    state.life.seenV2 = true;
    UI.help(false);
  }
  if (state.dev) {
    if (state.dev.finished) UI.queue(() => UI.devFinished());
    else if (state.loc === 'studio') SFX.startMusic(state.dev.genre);
  }
  state.life.seenV2 = true;
}

$('#btn-new').addEventListener('click', () => {
  if (hasSave() && !confirm('Ya tienes una partida guardada. ¿Empezar una nueva? (Se perderá la anterior)')) return;
  const name = $('#title-name').value.trim() || 'Julian';
  startGame(newState(name), true);
});
$('#btn-continue').addEventListener('click', () => {
  const s = loadGame();
  if (s) startGame(s, false);
});

/* ---------- Botones de acción ---------- */
function toggleCity() {
  const s = G.s;
  if (s.loc === 'studio') {
    enterCity(); UI.fade('La ciudad'); UI.refresh();
  } else {
    cityClick(PLACE_BY_ID.studio.entry.x, PLACE_BY_ID.studio.entry.y);
    UI.toast('Caminando de vuelta al estudio...', 'muted');
  }
}
const ACTIONS = {
  'b-song': () => UI.newSong(),
  'b-inbox': () => UI.inbox(),
  'b-city': toggleCity,
  'b-goals': () => UI.goals(),
  'b-jobs': () => UI.jobs(),
  'b-label': () => UI.label(),
  'b-staff': () => UI.staffPanel(),
  'b-life': () => UI.life(),
  'b-producer': () => UI.producer(),
  'b-disco': () => UI.discography(),
  'b-menu': () => UI.menu(),
};
const ICON_FOR = { 'b-song': 'note', 'b-inbox': 'mail', 'b-city': 'door', 'b-goals': 'trophy', 'b-jobs': 'coin', 'b-label': 'gold', 'b-staff': 'pc', 'b-life': 'fans', 'b-producer': 'star', 'b-disco': 'vinyl', 'b-menu': 'gear' };
for (const [id, fn] of Object.entries(ACTIONS)) {
  const b = document.getElementById(id);
  b.insertAdjacentHTML('afterbegin', iconImg(ICON_FOR[id]));
  b.addEventListener('click', () => { if (!G.running || G.modals > 0) return; SFX.init(); SFX.click(); fn(); });
}
document.querySelectorAll('[data-speed]').forEach(b => b.addEventListener('click', () => {
  const v = +b.dataset.speed;
  if (v === 0) G.paused = !G.paused; else { G.paused = false; G.speed = v; }
  SFX.click(); UI.refresh();
}));
document.querySelectorAll('[data-home]').forEach(b => b.addEventListener('click', () => { if (G.running && G.modals === 0) UI.homeAction(b.dataset.home); }));
$('#nav-prev').addEventListener('click', () => UI.cycleView(-1));
$('#nav-next').addEventListener('click', () => UI.cycleView(1));
$('#prompt').addEventListener('click', () => { if (CITY.near) arrive(CITY.near.id); });
$('#t-logo').insertAdjacentHTML('afterbegin', iconImg('door'));
document.querySelectorAll('[data-icon]').forEach(el => el.insertAdjacentHTML('afterbegin', iconImg(el.dataset.icon)));

// Clic en la escena (caminar en la ciudad)
canvas.addEventListener('click', e => {
  if (!G.running || G.modals > 0 || G.s.loc !== 'city') return;
  const r = canvas.getBoundingClientRect();
  cityClick((e.clientX - r.left) / r.width * SCENE_W, (e.clientY - r.top) / r.height * SCENE_H);
});

// Teclado
const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
window.addEventListener('keydown', e => {
  if (!G.running || e.target.tagName === 'INPUT') return;
  const s = G.s;
  if (KEYMAP[e.code] && G.modals === 0) {
    if (s.loc === 'city') { CITY.keys[KEYMAP[e.code]] = true; e.preventDefault(); return; }
    if (KEYMAP[e.code] === 'left') UI.cycleView(-1);
    if (KEYMAP[e.code] === 'right') UI.cycleView(1);
  }
  if ((e.code === 'KeyE' || e.code === 'Enter') && s.loc === 'city' && CITY.near && G.modals === 0) { arrive(CITY.near.id); return; }
  if (e.key === ' ') { e.preventDefault(); G.paused = !G.paused; UI.refresh(); }
  if (e.key === '1' || e.key === '2' || e.key === '3') { G.paused = false; G.speed = [1, 2, 4][+e.key - 1]; UI.refresh(); }
  if (e.key === 'Escape') { const x = document.querySelector('.modal-wrap:last-child [data-x]'); if (x) x.click(); }
});
// Cruceta táctil para caminar en la ciudad
document.querySelectorAll('#dpad [data-dir]').forEach(b => {
  const on = e => { e.preventDefault(); CITY.keys[b.dataset.dir] = true; b.classList.add('on'); };
  const off = () => { CITY.keys[b.dataset.dir] = false; b.classList.remove('on'); };
  b.addEventListener('pointerdown', on);
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, off);
  b.addEventListener('contextmenu', e => e.preventDefault());
});
window.addEventListener('keyup', e => { if (KEYMAP[e.code]) CITY.keys[KEYMAP[e.code]] = false; });
window.addEventListener('blur', () => { CITY.keys = {}; });
window.addEventListener('beforeunload', () => { if (G.running) saveGame(); });

fit();
showTitle();
requestAnimationFrame(frame);

// App instalable y sin internet (PWA)
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

/* ---------- Segundo plano: el juego se detiene si sales de la app o cambias de pestaña ---------- */
(function () {
  const away = () => {
    if (G.away) return;
    G.away = true;
    SFX.stopMusic();
    try { if (SFX.ctx && SFX.ctx.state === 'running') SFX.ctx.suspend(); } catch (e) { /* nada */ }
    if (G.running && G.s) saveGame();
  };
  const back = () => {
    if (!G.away) return;
    G.away = false;
    last = performance.now(); G.acc = Math.min(G.acc, DAY_MS * 0.5);
    try { if (SFX.ctx && SFX.ctx.state === 'suspended') SFX.ctx.resume(); } catch (e) { /* nada */ }
    if (G.running && G.s && G.s.loc === 'studio' && G.s.dev && !G.s.dev.finished && SFX.music) SFX.startMusic(G.s.dev.genre);
  };
  document.addEventListener('visibilitychange', () => (document.hidden ? away() : back()));
  window.addEventListener('pagehide', away);
  window.addEventListener('pageshow', () => { if (!document.hidden) back(); });
  document.addEventListener('pause', away);   // eventos nativos de la app Android
  document.addEventListener('resume', back);
})();
