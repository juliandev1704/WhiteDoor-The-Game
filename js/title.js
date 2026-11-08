'use strict';
/* =========================================================
   WHITE DOOR — Pantalla de inicio en dos pasos
   (Continuar / Nueva partida → creación del personaje)
   y preferencias de pareja
   ========================================================= */

const PARTNER_TYPES = {
  romantica: { name: 'Romántica', desc: 'El amor se enfría más despacio y las citas le encantan.' },
  fiestera:  { name: 'Fiestera', desc: 'Te sube el ánimo cada día, aunque a veces te trasnocha.' },
  tranquila: { name: 'Tranquila', desc: 'Te cuida: un poco más de salud y energía cada día.' },
  sorpresa:  { name: 'Sorpresa', desc: 'El destino decide qué tipo de persona conocerás.' },
};
const NAMES_BY_GENDER = {
  m: ['Camila', 'Laura', 'Valeria', 'Daniela', 'Mariana', 'Paula', 'Isabella', 'Gabriela', 'Lucía', 'Sara', 'Manuela', 'Juliana'],
  h: ['Andrés', 'Santiago', 'Felipe', 'Sebastián', 'Juan', 'Tomás', 'Samuel', 'David', 'Martín', 'Diego', 'Mateo', 'Nicolás'],
};
const titlePick = { love: 'm', type: 'sorpresa', touchedLove: false };
function titlePrefs() { return { love: titlePick.love, type: titlePick.type }; }

/* ---------- Pareja según las preferencias ---------- */
newPartner = function () {
  const s = G.s, pref = (s && s.life.pref) || { love: 't', type: 'sorpresa' };
  const g = pref.love === 't' ? pick(['h', 'm']) : pref.love;
  const kinds = ['romantica', 'fiestera', 'tranquila'];
  const kind = kinds.includes(pref.type) ? pref.type : pick(kinds);
  const look = randomLook(0);
  look.style = g === 'm' ? pick([1, 5]) : pick([0, 2, 3, 4]);
  return { name: pick(NAMES_BY_GENDER[g]), gender: g, kind, love: 40, stage: 0, look };
};

(function () {
  // Efectos según el tipo de pareja
  const baseDay = dailyLife;
  dailyLife = function () {
    baseDay();
    const s = G.s, p = s.life.partner;
    if (!p || !p.kind) return;
    if (p.kind === 'fiestera') { addNeeds({ animo: 0.4 }); if (Math.random() < 0.04) addNeeds({ energia: -8 }); }
    if (p.kind === 'tranquila') { s.salud = Math.min(100, s.salud + 0.2); addNeeds({ energia: 0.3 }); }
  };
  const baseWeek = weeklyLife;
  weeklyLife = function () {
    const s = G.s, p = s.life.partner, love0 = p ? p.love : 0;
    baseWeek();
    const p2 = s.life.partner;
    if (p2 && p2 === p && p.kind === 'romantica' && p.love < love0) p.love += (love0 - p.love) * 0.5;
  };

  /* ---------- Pantalla de inicio ---------- */
  const menu = $('#title-menu'), create = $('#title-create');
  const showStep = step => { menu.hidden = step !== 'menu'; create.hidden = step !== 'create'; menu.parentElement.classList.toggle('creating', step === 'create'); };
  const typeDesc = () => { $('#title-type-desc').textContent = PARTNER_TYPES[titlePick.type].desc; };
  const group = (sel, key, after) => document.querySelectorAll(`${sel} [data-v]`).forEach(b => b.addEventListener('click', () => {
    titlePick[key] = b.dataset.v; SFX.init(); SFX.click();
    document.querySelectorAll(`${sel} [data-v]`).forEach(x => x.classList.toggle('on', x === b));
    if (after) after();
  }));
  const setLove = v => {
    titlePick.love = v;
    document.querySelectorAll('#title-love [data-v]').forEach(x => x.classList.toggle('on', x.dataset.v === v));
  };
  group('#title-love', 'love', () => { titlePick.touchedLove = true; });
  group('#title-type', 'type', typeDesc);
  // Por defecto: si eres hombre te atraen mujeres y viceversa (puedes cambiarlo)
  document.querySelectorAll('#title-gender [data-g]').forEach(b => b.addEventListener('click', () => {
    if (titlePick.touchedLove) return;
    setLove(b.dataset.g === 'm' ? 'h' : b.dataset.g === 'h' ? 'm' : 't');
  }));
  typeDesc();

  $('#btn-new').addEventListener('click', () => {
    SFX.init(); SFX.click();
    showStep('create');
    $('#title-name').value = '';
    setTimeout(() => $('#title-name').focus(), 50);
  });
  $('#btn-back').addEventListener('click', () => { SFX.click(); showStep('menu'); });
  $('#title-name').addEventListener('keydown', e => { if (e.key === 'Enter') $('#btn-start').click(); });

  const baseTitle = showTitle;
  showTitle = function () { baseTitle(); showStep('menu'); };
  showStep('menu');
})();
