'use strict';
/* =========================================================
   WHITE DOOR — Arranque y bucle principal
   ========================================================= */
const canvas = $('#scene');
const ctx = canvas.getContext('2d');
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
  const scale = Math.max(1, Math.min(w / SCENE_W, h / SCENE_H));
  $('#screen').style.width = Math.floor(SCENE_W * scale) + 'px';
  $('#screen').style.height = Math.floor(SCENE_H * scale) + 'px';
}
window.addEventListener('resize', fit);

/* ---------- Bucle ---------- */
let last = performance.now(), bubT = 0, uiT = 0;
function frame(now) {
  const dt = Math.min(100, now - last);
  last = now;
  const live = G.running && G.s;
  const s = live ? G.s : demo;
  const flowing = live && !G.paused && G.modals === 0;
  if (flowing) {
    const d = dt * G.speed;
    if (s.dev && !s.dev.finished) devAdvance(d / WEEK_MS);
    G.acc += d;
    while (G.acc >= WEEK_MS && G.running && G.modals === 0) { G.acc -= WEEK_MS; advanceWeek(); }
  }
  drawScene(ctx, s, now, { frozen: live && !flowing });
  bubT += dt;
  if (bubT > 650) { bubT = 0; if (live) UI.flushBubbles(); }
  uiT += dt;
  if (uiT > 200) { uiT = 0; if (live) UI.updateDev(); }
  requestAnimationFrame(frame);
}

/* ---------- Título ---------- */
function showTitle() {
  G.running = false;
  SFX.stopMusic();
  $('#modal-root').innerHTML = '';
  G.modals = 0;
  $('#title-screen').hidden = false;
  $('#app').classList.add('blur');
  $('#btn-continue').hidden = !hasSave();
  const sv = loadGame();
  if (sv) $('#title-name').value = sv.producer;
}

function startGame(state, isNew) {
  SFX.init();
  G.s = state; G.running = true; G.paused = false; G.speed = 1; G.acc = 0;
  $('#title-screen').hidden = true;
  $('#app').classList.remove('blur');
  UI.refresh();
  if (isNew) { saveGame(); UI.help(true); }
  else if (state.dev) {
    if (state.dev.finished) UI.devFinished();
    else SFX.startMusic(state.dev.genre);
  }
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
const ACTIONS = {
  'b-song': () => UI.newSong(),
  'b-inbox': () => UI.inbox(),
  'b-shop': () => UI.shop(),
  'b-studio': () => UI.studio(),
  'b-academy': () => UI.academy(),
  'b-producer': () => UI.producer(),
  'b-disco': () => UI.discography(),
  'b-menu': () => UI.menu(),
};
const ICON_FOR = { 'b-song': 'note', 'b-inbox': 'mail', 'b-shop': 'mic', 'b-studio': 'house', 'b-academy': 'book', 'b-producer': 'star', 'b-disco': 'vinyl', 'b-menu': 'gear' };
for (const [id, fn] of Object.entries(ACTIONS)) {
  const b = document.getElementById(id);
  b.insertAdjacentHTML('afterbegin', iconImg(ICON_FOR[id]));
  b.addEventListener('click', () => { if (!G.running) return; SFX.init(); SFX.click(); fn(); });
}
document.querySelectorAll('[data-speed]').forEach(b => b.addEventListener('click', () => {
  const v = +b.dataset.speed;
  if (v === 0) G.paused = !G.paused; else { G.paused = false; G.speed = v; }
  SFX.click(); UI.refresh();
}));
$('#t-logo').insertAdjacentHTML('afterbegin', iconImg('door'));
document.querySelectorAll('[data-icon]').forEach(el => el.insertAdjacentHTML('afterbegin', iconImg(el.dataset.icon)));

// Atajos de teclado
window.addEventListener('keydown', e => {
  if (!G.running || e.target.tagName === 'INPUT') return;
  if (e.key === ' ') { e.preventDefault(); G.paused = !G.paused; UI.refresh(); }
  if (e.key === '1' || e.key === '2' || e.key === '3') { G.paused = false; G.speed = [1, 2, 4][+e.key - 1]; UI.refresh(); }
  if (e.key === 'Escape') { const x = document.querySelector('.modal-wrap:last-child [data-x]'); if (x) x.click(); }
});
window.addEventListener('beforeunload', () => { if (G.running) saveGame(); });

fit();
showTitle();
requestAnimationFrame(frame);
