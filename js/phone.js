'use strict';
/* =========================================================
   WHITE DOOR — El celular (apps: banco, compras, domicilios,
   taxi, séquito, estilo, mensajes...)
   ========================================================= */

const PHONE_APPS = [
  { id: 'banco',   name: 'Banco',     icon: 'coin',   color: '#1d6fb0' },
  { id: 'domi',    name: 'PixelEats', icon: 'plant',  color: '#ff004d' },
  { id: 'taxi',    name: 'Taxi',      icon: 'keys',   color: '#c9a227' },
  { id: 'musica',  name: 'Do Re Mi',  icon: 'guitar', color: '#29adff', open: () => UI.shop('equipo', true) },
  { id: 'mall',    name: 'Pixel Mall', icon: 'sofa',  color: '#ff77a8', open: () => UI.mall() },
  { id: 'casas',   name: 'Casas',     icon: 'house',  color: '#00a83a', open: () => UI.realty() },
  { id: 'talento', name: 'Talentos',  icon: 'fans',   color: '#83769c', open: () => UI.agency() },
  { id: 'msg',     name: 'Mensajes',  icon: 'mail',   color: '#00e436', open: () => UI.inbox() },
  { id: 'seq',     name: 'Séquito',   icon: 'star',   color: '#3a3548', open: () => UI.entourage() },
  { id: 'estilo',  name: 'Estilo',    icon: 'phones', color: '#ab5236', open: () => UI.customize() },
  { id: 'metas',   name: 'Objetivos', icon: 'trophy', color: '#ffa300', open: () => UI.goals() },
  { id: 'chamba',  name: 'Trabajos',  icon: 'disk',   color: '#5f574f', open: () => UI.jobs() },
];
const FOOD = [
  { name: 'Hamburguesa', price: 30, hambre: 60, animo: 3 },
  { name: 'Bandeja paisa', price: 55, hambre: 95, animo: 8 },
  { name: 'Sushi', price: 90, hambre: 75, animo: 14 },
  { name: 'Café y pandebono', price: 18, hambre: 25, energia: 12 },
];
const TAXI_FARE = 25;

function taxiTo(id) {
  const s = G.s, P = PLACE_BY_ID[id];
  if (s.money < TAXI_FARE) return 'No te alcanza para el taxi.';
  s.money -= TAXI_FARE;
  passTime(0.05);
  if (id === 'studio') { enterStudio(); UI.fade('White Door'); UI.refresh(); return null; }
  if (s.loc !== 'city') enterCity();
  Object.assign(CITY.player, { x: P.entry.x, y: P.entry.y + (P.park ? 0 : 2), dir: 'up', path: [], target: null });
  CITY.trail = [];
  UI.fade(P.name); UI.refresh();
  setTimeout(() => arrive(id), 450);
  return null;
}

UI.phone = function (app = 'home') {
  const s = G.s, B = bankState(s);
  let cur = app;
  const m = this.modal('', '', {});
  m.el.querySelector('.modal').classList.add('phone');
  m.el.querySelector('.modal-head h2').textContent = '';
  const status = () => {
    const d = dateLabel(s).split('·').pop().trim();
    return `<div class="ph-status"><span>${d}</span><span>White Door</span><span>${fmtMoney(s.money)}</span></div>`;
  };
  const back = '<button class="ph-back" data-app="home">◀ Inicio</button>';
  const render = () => {
    let h = status();
    if (cur === 'home') {
      h += `<div class="ph-wall"><div class="ph-clock">${esc(s.producer)}</div><div class="ph-sub">Efectivo ${fmtMoney(s.money)} · Banco ${fmtMoney(B.savings)}</div></div>
        <div class="ph-grid">` + PHONE_APPS.map(a => `<button class="ph-app" data-app="${a.id}"><span class="ph-ico" style="background:${a.color}">${iconImg(a.icon)}</span><span>${a.name}</span></button>`).join('') + '</div>';
    } else if (cur === 'banco') {
      const amts = [1000, 5000, 20000];
      h += `${back}<h3>Banco Pixel</h3>
        <div class="ph-card"><div>Efectivo <b>${fmtMoney(s.money)}</b></div><div>Ahorros <b>${fmtMoney(B.savings)}</b></div>
        ${B.loan ? `<div class="muted">Crédito: debes ${fmtMoney(B.loan.owed)} (${fmtMoney(B.loan.weekly)}/sem)</div>` : ''}</div>
        <p class="muted small">Lo que guardas aquí gana intereses y nadie te lo roba en la calle.</p>
        <div class="ph-btns"><button class="btn primary" data-dep="all" ${s.money <= 0 ? 'disabled' : ''}>Guardar todo</button>
        <button class="btn" data-dep="half" ${s.money <= 0 ? 'disabled' : ''}>Guardar la mitad</button></div>
        <div class="ph-btns three">${amts.map(a => `<button class="btn small" data-wd="${a}" ${B.savings < a ? 'disabled' : ''}>Sacar ${fmtMoney(a)}</button>`).join('')}</div>
        <div class="ph-btns"><button class="btn" data-wd="all" ${B.savings < 1 ? 'disabled' : ''}>Sacar todo</button>
        <button class="btn" data-full="1">CDT y créditos</button></div>`;
    } else if (cur === 'domi') {
      h += `${back}<h3>PixelEats</h3><p class="muted small">Te lo llevan a donde estés en minutos.</p><div class="ph-list">` +
        FOOD.map((f, i) => `<button class="ph-row" data-food="${i}" ${s.money < f.price ? 'disabled' : ''}><span>${f.name}<small>+${f.hambre} hambre${f.animo ? ` · +${f.animo} ánimo` : ''}${f.energia ? ` · +${f.energia} energía` : ''}</small></span><b>${fmtMoney(f.price)}</b></button>`).join('') + '</div>';
    } else if (cur === 'taxi') {
      h += `${back}<h3>Taxi</h3><p class="muted small">Cualquier destino: ${fmtMoney(TAXI_FARE)}. Llegas en un momento.</p><div class="ph-list">` +
        PLACES.filter(p => !(p.id === 'studio' && s.loc === 'studio')).map(p => `<button class="ph-row" data-taxi="${p.id}" ${s.money < TAXI_FARE ? 'disabled' : ''}><span>${p.name}</span><b>Ir</b></button>`).join('') + '</div>';
    }
    m.set(h);
  };
  m.body.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const d = b.dataset;
    SFX.click();
    if (d.app) {
      const a = PHONE_APPS.find(x => x.id === d.app);
      if (a && a.open) { m.close(); a.open(); return; }
      cur = d.app; render(); return;
    }
    if (d.dep) {
      const v = Math.floor(d.dep === 'all' ? s.money : s.money / 2);
      if (v > 0) { s.money -= v; B.savings += v; SFX.coin(); this.toast(`Guardaste ${fmtMoney(v)} en el banco.`, 'good'); }
    }
    if (d.wd) {
      const v = d.wd === 'all' ? Math.floor(B.savings) : Math.min(+d.wd, Math.floor(B.savings));
      if (v > 0) { B.savings -= v; s.money += v; SFX.coin(); this.toast(`Sacaste ${fmtMoney(v)}.`, 'good'); }
    }
    if (d.full) { m.close(); this.bank(); return; }
    if (d.food) {
      const f = FOOD[+d.food];
      const err = activity({ cost: f.price, days: 0.05, hambre: f.hambre, animo: f.animo || 0, energia: f.energia || 0 });
      if (err) this.toast(err, 'bad'); else { SFX.coin(); this.toast(`Llegó tu ${f.name.toLowerCase()}. ¡Delicioso!`, 'good'); }
    }
    if (d.taxi) {
      m.close();
      const err = taxiTo(d.taxi);
      if (err) this.toast(err, 'bad');
      saveGame(); return;
    }
    saveGame(); render(); this.refresh();
  });
  render();
};

(function () {
  const btn = document.getElementById('phone-btn');
  btn.insertAdjacentHTML('afterbegin', iconImg('cel'));
  btn.addEventListener('click', () => { if (!G.running || G.modals > 0) return; SFX.init(); SFX.click(); UI.phone(); });
  window.addEventListener('keydown', e => {
    if (!G.running || G.modals > 0 || e.target.tagName === 'INPUT') return;
    if (e.code === 'KeyT') { SFX.click(); UI.phone(); }
  });
})();
