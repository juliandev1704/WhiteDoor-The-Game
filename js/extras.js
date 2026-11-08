'use strict';
/* =========================================================
   WHITE DOOR — Objetivos con recompensas y formas extra de ganar dinero
   ========================================================= */

/* ---------- Estado (se crea solo en partidas viejas) ---------- */
function exState(s = G.s) {
  if (!s.ex) s.ex = {};
  const e = s.ex;
  for (const k of ['beats', 'mixes', 'lessons', 'gigs', 'jingles', 'packsMade', 'coproSongs', 'sideIncome', 'merch', 'merchSold'])
    if (typeof e[k] !== 'number') e[k] = 0;
  e.claimed = e.claimed || {};
  e.packs = e.packs || [];
  e.cd = e.cd || {};        // enfriamientos: id -> semana en que vuelve a estar disponible
  e.uses = e.uses || {};    // usos esta semana: id -> { week, n }
  if (e.rentCabina === undefined) e.rentCabina = false;
  return e;
}

/* =========================================================
   TRABAJOS: formas de ganar dinero
   ========================================================= */
const skillSum = s => s.skills.composicion + s.skills.grabacion + s.skills.produccion;

const JOBS = {
  beat: {
    name: 'Vender un beat online', icon: 'note', place: 'studio', perWeek: 2,
    desc: 'Haces un beat en un día y lo vendes en tu tienda online.',
    act: { days: 1, energia: -8, hambre: -3 },
    req: s => s.broken.pc ? 'Tu computador está dañado.' : null,
    pay: s => (110 + skillSum(s) * 18 + s.equip.pc * 40) * (1 + Math.sqrt(s.fans) / 300) * rnd(0.8, 1.3),
    stat: 'beats',
  },
  lessons: {
    name: 'Dar clases online', icon: 'book', place: 'studio', perWeek: 3, level: 3,
    desc: 'Enseñas producción por videollamada a principiantes.',
    act: { days: 0.5, energia: -5, animo: 2 },
    pay: s => (60 + s.level * 22) * rnd(0.9, 1.1),
    stat: 'lessons',
  },
  mix: {
    name: 'Mezclar para un cliente', icon: 'pc', place: 'studio', perWeek: 1, level: 2,
    desc: 'Un músico independiente te paga por mezclar su canción.',
    act: { days: 2, energia: -14, hambre: -4 },
    req: s => s.broken.pc ? 'Tu computador está dañado.' : s.broken.monitor ? 'Tus monitores están dañados.' : null,
    pay: s => (280 + s.skills.produccion * 85 + s.equip.monitor * 110) * rnd(0.85, 1.2),
    stat: 'mixes',
  },
  pack: {
    name: 'Crear un sample pack', icon: 'vinyl', place: 'studio', cooldown: 8, level: 4, cost: 300,
    desc: 'Tres días grabando sonidos. Se vende solo durante 24 semanas (ingreso pasivo).',
    act: { days: 3, energia: -18, hambre: -5 },
    req: s => s.broken.pc ? 'Tu computador está dañado.' : null,
    pay: () => 0,
    after(s) {
      const weekly = Math.round(50 + skillSum(s) * 9 + Math.sqrt(s.fans) * 0.6);
      exState(s).packs.push({ weeks: 24, weekly });
      return `Publicaste tu sample pack. Venderá unos ${fmtMoney(weekly)}/sem al principio.`;
    },
    stat: 'packsMade',
  },
  dj: {
    name: 'Pinchar un set de DJ', icon: 'star', place: 'club', perWeek: 1, prestige: 25,
    desc: 'Pones música toda la noche en el Club Neón 8. Pagan según tu fama.',
    act: { days: 0.5, energia: -16, animo: 8, hambre: -4 },
    pay: s => (150 + Math.sqrt(s.fans) * 4.5) * rnd(0.85, 1.2),
    after(s) { s.fans += Math.round(20 + Math.sqrt(s.fans) * 0.8); return null; },
    stat: 'gigs',
  },
  jingle: {
    name: 'Componer un jingle', icon: 'mic', place: 'radio', cooldown: 3, prestige: 60,
    desc: 'Una marca quiere un jingle para su comercial en FM Pixel.',
    act: { days: 1.5, energia: -10, hambre: -3 },
    pay: s => (550 + s.room * 450 + s.skills.composicion * 90) * rnd(0.9, 1.2),
    stat: 'jingles',
  },
};
const PLACE_LABEL = { studio: 'En tu estudio', club: 'Club Neón 8', radio: 'Radio FM Pixel' };

function jobUses(id, s = G.s) {
  const u = exState(s).uses[id];
  return u && u.week === s.week ? u.n : 0;
}
function jobError(id, s = G.s) {
  const j = JOBS[id], e = exState(s);
  if (j.level && s.level < j.level) return `Requiere nivel ${j.level}.`;
  if (j.prestige && s.prestige < j.prestige) return `Requiere ${j.prestige} de prestigio.`;
  if (j.perWeek && jobUses(id, s) >= j.perWeek) return 'Ya no hay más encargos esta semana.';
  if (j.cooldown && e.cd[id] > s.week) return `Disponible en ${e.cd[id] - s.week} semana(s).`;
  if (j.cost && s.money < j.cost) return 'No te alcanza el dinero.';
  if (j.req) { const r = j.req(s); if (r) return r; }
  return null;
}
// Paga el trabajo (el tiempo y las necesidades ya se aplicaron con activity)
function finishJob(id) {
  const s = G.s, j = JOBS[id], e = exState(s);
  const u = e.uses[id] && e.uses[id].week === s.week ? e.uses[id] : (e.uses[id] = { week: s.week, n: 0 });
  u.n++;
  if (j.cooldown) e.cd[id] = s.week + j.cooldown;
  e[j.stat]++;
  const amt = Math.round(j.pay(s) / 10) * 10;
  s.money += amt; e.sideIncome += amt;
  const extra = j.after ? j.after(s) : null;
  SFX.coin();
  return extra || `${j.name}: +${fmtMoney(amt)}`;
}
function doJob(id) {
  const s = G.s, j = JOBS[id];
  if (j.place === 'studio' && s.loc !== 'studio') return { err: 'Tienes que estar en tu estudio.' };
  const err = jobError(id) || activity({ cost: j.cost || 0, ...j.act });
  if (err) return { err };
  return { msg: finishJob(id) };
}

/* ---------- Ingresos pasivos semanales ---------- */
function weeklyExtras() {
  const s = G.s, e = exState(s);
  let passive = 0;
  // Sample packs: venden menos cada semana
  for (const p of e.packs) { passive += p.weekly; p.weekly *= 0.94; p.weeks--; }
  e.packs = e.packs.filter(p => p.weeks > 0);
  // Merch: se vende según tus fans
  // Merch: se vende según tu éxito actual y se satura si inundas el mercado
  e.merchSat = (e.merchSat || 0) * 0.9;
  // Fábrica de merch: repone sola lo que se va a vender
  if (typeof hasBiz === 'function' && hasBiz('merch', s) && s.fans >= MERCH.minFans) {
    const want = Math.ceil(merchDemand(s) * 1.1) - e.merch;
    if (want > 0) { const cost = Math.round(want * MERCH.auto); e.merch += want; e.merchMade = (e.merchMade || 0) + want; passive -= cost; taxState(s).costs += cost; }
  }
  if (e.merch > 0) {
    const sold = Math.min(e.merch, merchDemand(s));
    e.merch -= sold; e.merchSold += sold; e.merchSat += sold;
    const store = Math.round(e.merch * MERCH.storage);
    passive += sold * merchPrice(s) - store;
    if (e.merch === 0 && !(typeof hasBiz === 'function' && hasBiz('merch', s))) UI.toast('¡Se agotó tu merch! Pide más en Trabajos o compra la Fábrica de merch (Trabajos > Negocios).', 'muted');
  }
  // Alquiler de la cabina cuando tus artistas no la usan
  if (e.rentCabina && hasModule('cabina')) {
    const free = Math.max(0, 2 * moduleCount('cabina') - countTask('grabar'));
    passive += free * 180;
  }
  if (passive > 0) { s.money += passive; e.sideIncome += passive; s.lastSide = passive; } else s.lastSide = 0;
}

const MERCH = {
  minFans: 500, storage: 0.05, auto: 5,
  batches: [{ n: 50, unit: 14 }, { n: 100, unit: 12 }, { n: 500, unit: 10 }, { n: 1000, unit: 9 }, { n: 5000, unit: 7.5 }],
};
// Éxito actual: qué tan buenas y sonadas están tus canciones activas
function merchHype(s = G.s) {
  const act = s.songs.filter(x => x.active);
  if (!act.length) return 0.3;
  const avg = act.reduce((a, x) => a + x.score, 0) / act.length;
  const top = act.filter(x => x.chart && x.chart <= 10).length, charting = act.filter(x => x.chart).length;
  return clamp(0.2 + avg / 10 * 0.8 + charting * 0.1 + top * 0.25, 0.3, 2.5);
}
function merchHypeLabel(h) { return h < 0.6 ? 'baja' : h < 1 ? 'normal' : h < 1.6 ? 'alta' : 'furor'; }
function merchPrice(s = G.s) { return Math.round(15 + Math.min(25, s.prestige / 40)); }
function merchDemand(s = G.s) {
  const e = exState(s);
  const base = 2 + Math.sqrt(s.fans) * 0.25 + s.fans * 0.0002;
  const sat = 1 / (1 + (e.merchSat || 0) / (s.fans * 0.15 + 50));
  return Math.max(0, Math.round(base * merchHype(s) * sat));
}
function buyMerch(n) {
  const s = G.s, e = exState(s), b = MERCH.batches.find(x => x.n === n) || MERCH.batches[1];
  if (s.fans < MERCH.minFans) return `Necesitas al menos ${fmtNum(MERCH.minFans)} fans para vender merch.`;
  const cost = Math.round(b.n * b.unit);
  if (s.money < cost) return 'No te alcanza el dinero.';
  s.money -= cost; e.merch += b.n;
  return null;
}

/* =========================================================
   OBJETIVOS CON RECOMPENSAS
   ========================================================= */
const ownSongs = s => s.songs.filter(x => !x.label);
const bestScore = s => ownSongs(s).reduce((m, x) => Math.max(m, x.score || 0), 0);

const MISSION_CHAPTERS = [
  { name: 'Primeros pasos', list: [
    { id: 'm_song1', name: 'Primer lanzamiento', desc: 'Publica tu primera canción.', prog: s => [ownSongs(s).length, 1], r: { money: 400, xp: 20 } },
    { id: 'm_beat', name: 'Beatmaker', desc: 'Vende 2 beats online (botón Trabajos).', prog: s => [exState(s).beats, 2], r: { money: 300 } },
    { id: 'm_client', name: 'Primer cliente', desc: 'Termina un encargo de un artista de la Bandeja.', prog: s => [ownSongs(s).filter(x => x.artist).length, 1], r: { money: 600 } },
    { id: 'm_course', name: 'A estudiar', desc: 'Completa un curso en la Academia.', prog: s => [s.courses.length, 1], r: { xp: 40 } },
    { id: 'm_deco', name: 'Hogar dulce hogar', desc: 'Ten 2 objetos de decoración.', prog: s => [s.items.filter(i => DECOR_BY_ID[i]).length, 2], r: { money: 300 } },
    { id: 'm_score6', name: 'Suena bien', desc: 'Saca una nota de 6 o más.', prog: s => [bestScore(s), 6], r: { money: 500, prestige: 5 } },
  ] },
  { name: 'Productor local', list: [
    { id: 'm_fans1k', name: 'Mil seguidores', desc: 'Llega a 1.000 fans.', prog: s => [s.fans, 1000], r: { money: 1200 } },
    { id: 'm_songs5', name: 'Catálogo', desc: 'Publica 5 canciones.', prog: s => [ownSongs(s).length, 5], r: { money: 1500 } },
    { id: 'm_mix', name: 'Ingeniero freelance', desc: 'Mezcla 3 canciones para clientes.', prog: s => [exState(s).mixes, 3], r: { money: 800, xp: 30 } },
    { id: 'm_dj', name: 'Noche de club', desc: 'Pincha 2 sets de DJ en el Club Neón.', prog: s => [exState(s).gigs, 2], r: { money: 1000, fans: 300 } },
    { id: 'm_room1', name: 'Más espacio', desc: 'Múdate a una Habitación amplia.', prog: s => [s.room, 1], r: { money: 2000 } },
    { id: 'm_equip2', name: 'Equipo serio', desc: 'Micrófono, PC y monitores en nivel 2 o más.', prog: s => [Math.min(s.equip.mic, s.equip.pc, s.equip.monitor), 2], r: { money: 2500 } },
    { id: 'm_score8', name: 'Hit en potencia', desc: 'Saca una nota de 8 o más.', prog: s => [bestScore(s), 8], r: { money: 3000, prestige: 15 } },
  ] },
  { name: 'Empresario', list: [
    { id: 'm_label', name: 'Tu propio sello', desc: 'Funda White Door Records.', prog: s => [s.label ? 1 : 0, 1], r: { money: 2000 } },
    { id: 'm_sign2', name: 'Familia musical', desc: 'Ten 2 artistas en tu sello.', prog: s => [s.roster.length, 2], r: { money: 3000 } },
    { id: 'm_copro', name: 'Trabajo en equipo', desc: 'Publica una canción con un co-productor.', prog: s => [exState(s).coproSongs, 1], r: { money: 2500, prestige: 10 } },
    { id: 'm_staff2', name: 'Jefe', desc: 'Ten 2 empleados.', prog: s => [s.staff.length, 2], r: { money: 4000 } },
    { id: 'm_jingle', name: 'Publicista', desc: 'Compón 2 jingles en la Radio.', prog: s => [exState(s).jingles, 2], r: { money: 3000 } },
    { id: 'm_pack', name: 'Ingresos pasivos', desc: 'Publica un sample pack.', prog: s => [exState(s).packsMade, 1], r: { money: 2000 } },
    { id: 'm_merch', name: 'Tienda de merch', desc: 'Vende 100 artículos de merch.', prog: s => [exState(s).merchSold, 100], r: { money: 2500, fans: 500 } },
    { id: 'm_side', name: 'Multitarea', desc: 'Gana $20.000 con trabajos extra.', prog: s => [exState(s).sideIncome, 20000], r: { prestige: 30 } },
  ] },
  { name: 'Estrella', list: [
    { id: 'm_fans50k', name: 'Fenómeno', desc: 'Llega a 50.000 fans.', prog: s => [s.fans, 50000], r: { money: 15000 } },
    { id: 'm_top10', name: 'Top 10', desc: 'Mete una canción en el Top 10.', prog: s => [s.songs.some(x => x.peak && x.peak <= 10) ? 1 : 0, 1], r: { money: 10000, prestige: 30 } },
    { id: 'm_lsongs', name: 'Máquina de hits', desc: 'Tu sello publica 10 canciones.', prog: s => [s.songs.filter(x => x.label).length, 10], r: { money: 20000 } },
    { id: 'm_room3', name: 'Estudio de verdad', desc: 'Múdate a la propiedad nivel 4.', prog: s => [s.room, 3], r: { money: 50000 } },
    { id: 'm_money', name: 'Cuarto de millón', desc: 'Ten $250.000 en el banco.', prog: s => [s.money, 250000], r: { prestige: 80 } },
    { id: 'm_score95', name: 'Obra maestra', desc: 'Saca una nota de 9.5 o más.', prog: s => [bestScore(s), 9.5], r: { money: 40000, prestige: 50 } },
    { id: 'm_fans500k', name: 'Leyenda', desc: 'Llega a 500.000 fans.', prog: s => [s.fans, 500000], r: { money: 100000, prestige: 100 } },
  ] },
];

function chapterUnlocked(i, s = G.s) {
  if (i === 0) return true;
  const prev = MISSION_CHAPTERS[i - 1].list;
  const claimed = prev.filter(m => exState(s).claimed[m.id]).length;
  return claimed >= Math.ceil(prev.length * 0.6) && chapterUnlocked(i - 1, s);
}
function missionDone(m, s = G.s) { const [c, t] = m.prog(s); return c >= t; }
function claimableMissions(s = G.s) {
  const out = [];
  MISSION_CHAPTERS.forEach((ch, i) => {
    if (!chapterUnlocked(i, s)) return;
    for (const m of ch.list) if (!exState(s).claimed[m.id] && missionDone(m, s)) out.push(m);
  });
  return out;
}
function rewardText(r) {
  const p = [];
  if (r.money) p.push(fmtMoney(r.money));
  if (r.xp) p.push(`${r.xp} XP`);
  if (r.prestige) p.push(`${r.prestige} prestigio`);
  if (r.fans) p.push(`${fmtNum(r.fans)} fans`);
  return p.join(' · ');
}
function claimMission(id) {
  const s = G.s, e = exState(s);
  const m = MISSION_CHAPTERS.flatMap(c => c.list).find(x => x.id === id);
  if (!m || e.claimed[id] || !missionDone(m)) return 'Aún no cumples este objetivo.';
  e.claimed[id] = s.week;
  const r = m.r;
  if (r.money) s.money += r.money;
  if (r.xp) gainXP(r.xp);
  if (r.prestige) s.prestige += r.prestige;
  if (r.fans) s.fans += r.fans;
  saveGame();
  return null;
}

/* =========================================================
   INTERFAZ
   ========================================================= */
Object.assign(UI, {
  goals() {
    const s = G.s;
    const m = this.modal('Objetivos', '', { wide: true });
    const render = () => {
      const e = exState(s);
      let h = '<p class="muted">Cumple objetivos y reclama tu recompensa. Cada capítulo se abre al completar la mayoría del anterior.</p>';
      MISSION_CHAPTERS.forEach((ch, i) => {
        const open = chapterUnlocked(i);
        const n = ch.list.filter(x => e.claimed[x.id]).length;
        h += `<h3>${i + 1}. ${ch.name} <span class="muted small">${n}/${ch.list.length}</span></h3>`;
        if (!open) { h += '<p class="muted small">Bloqueado: completa más objetivos del capítulo anterior.</p>'; return; }
        h += '<div class="grid">' + ch.list.map(x => {
          const [c, t] = x.prog(s), done = c >= t, got = e.claimed[x.id] !== undefined;
          const pct = clamp(c / t * 100, 0, 100);
          const right = got ? '<span class="ok">✓ Cobrado</span>' :
            done ? `<button class="btn primary small" data-claim="${x.id}">Reclamar</button>` : `<span class="muted small">${t >= 1000 ? fmtNum(Math.min(c, t)) : Math.min(Math.round(c * 10) / 10, t)}/${t >= 1000 ? fmtNum(t) : t}</span>`;
          return `<div class="card ${got ? 'owned' : ''} ${done && !got ? 'ready' : ''}">${iconImg(got ? 'star' : done ? 'gold' : 'note')}
            <div class="cinfo"><b>${x.name}</b><div class="muted">${x.desc}</div>
            ${got ? '' : `<div class="bar-mini"><span>Progreso</span><i><em style="width:${pct}%"></em></i><span>${Math.round(pct)}%</span></div>`}
            <div class="bonus">Recompensa: ${rewardText(x.r)}</div></div>
            <div class="cbuy">${right}</div></div>`;
        }).join('') + '</div>';
      });
      m.set(h);
    };
    m.body.addEventListener('click', ev => {
      const b = ev.target.closest('[data-claim]'); if (!b) return;
      const x = MISSION_CHAPTERS.flatMap(c => c.list).find(q => q.id === b.dataset.claim);
      const err = claimMission(b.dataset.claim);
      if (err) { this.toast(err, 'bad'); SFX.bad(); }
      else { this.toast(`Objetivo "${x.name}": +${rewardText(x.r)}`, 'good'); SFX.level(); }
      render(); this.refresh();
    });
    render();
  },

  jobs(tab = 'trabajos') {
    const s = G.s;
    let cur = tab;
    const m = this.modal('Trabajos y otros ingresos', '', { wide: true });
    const render = () => {
      const e = exState(s);
      const top = this.tabs([['trabajos', 'Trabajos'], ['negocios', 'Negocios']], cur);
      if (cur === 'negocios') { m.set(top + `<div class="money-line">Dinero: <b>${fmtMoney(s.money)}</b></div>` + bizHTML(s)); return; }
      let h = top + `<div class="money-line">Dinero: <b>${fmtMoney(s.money)}</b> · Ganado con trabajos extra: <b>${fmtMoney(e.sideIncome)}</b></div>
        <p class="muted small">Mientras haces un trabajo pasa el tiempo y tu canción no avanza. Tu equipo y tu sello siguen trabajando.</p>
        <h3>Trabajos</h3><div class="grid">`;
      h += Object.entries(JOBS).map(([id, j]) => {
        const err = jobError(id);
        const here = j.place === 'studio' ? s.loc === 'studio' : false;
        const limit = j.perWeek ? `${j.perWeek} por semana (quedan ${j.perWeek - jobUses(id)})` : j.cooldown ? `cada ${j.cooldown} semanas` : '';
        let right;
        if (err) right = `<span class="muted small">${err}</span>`;
        else if (j.place !== 'studio') right = `<span class="muted small">Ve a ${PLACE_LABEL[j.place]}</span>`;
        else if (!here) right = '<span class="muted small">Vuelve al estudio</span>';
        else right = `<button class="btn primary small" data-job="${id}">${j.cost ? fmtMoney(j.cost) : 'Hacer'}</button>`;
        return `<div class="card">${iconImg(j.icon)}<div class="cinfo"><b>${j.name}</b><div class="muted">${j.desc}</div>
          <div class="bonus">${PLACE_LABEL[j.place]} · ${j.act.days >= 1 ? j.act.days + ' día(s)' : 'medio día'}${limit ? ' · ' + limit : ''}</div></div>
          <div class="cbuy">${right}</div></div>`;
      }).join('') + '</div>';

      h += '<h3>Ingresos pasivos</h3><div class="grid">';
      const packW = e.packs.reduce((a, p) => a + p.weekly, 0);
      h += `<div class="card">${iconImg('vinyl')}<div class="cinfo"><b>Sample packs</b><div class="muted">${e.packs.length ? `${e.packs.length} a la venta · ~${fmtMoney(packW)}/sem` : 'Aún no tienes packs a la venta.'}</div></div></div>`;
      const dem = merchDemand(s), hype = merchHype(s);
      h += `<div class="card merch-card">${iconImg('fans')}<div class="cinfo"><b>Merch</b><div class="muted">${fmtNum(e.merch)} en inventario · ${fmtNum(e.merchSold)} vendidos.
        Se vende según tu éxito actual: demanda <b>${merchHypeLabel(hype)}</b>, ~${fmtNum(dem)}/sem a ${fmtMoney(merchPrice(s))} c/u. Si inundas el mercado se satura, y guardar cada unidad cuesta ${fmtMoney(MERCH.storage)}/sem.</div>
        ${s.fans < MERCH.minFans ? `<div class="bonus">Necesitas ${fmtNum(MERCH.minFans)} fans</div>` : hasBiz('merch', s) ? `<div class="bonus">Tu Fábrica de merch lo produce sola cada semana (${fmtMoney(MERCH.auto)} c/u).</div>` : `<div class="bonus">Tip: la Fábrica de merch (pestaña Negocios) lo produce sola.</div><div class="merch-btns">${MERCH.batches.map(b => `<button class="btn small" data-merch="${b.n}" ${s.money < b.n * b.unit ? 'disabled' : ''}>${fmtNum(b.n)} · ${fmtMoney(b.n * b.unit)}</button>`).join('')}</div>`}</div></div>`;
      const cab = hasModule('cabina');
      h += `<div class="card">${iconImg('mic')}<div class="cinfo"><b>Alquilar tu cabina</b><div class="muted">Otros músicos pagan ${fmtMoney(180)}/sem por cada puesto libre de tu Cabina de grabación.</div></div>
        <div class="cbuy">${cab ? `<button class="btn small ${e.rentCabina ? 'primary' : ''}" data-rent="1">${e.rentCabina ? 'Alquilando ✓' : 'Alquilar'}</button>` : '<span class="muted small">Necesitas una Cabina</span>'}</div></div>`;
      h += '</div><p class="muted small">Otros ingresos: canciones propias y de clientes (Bandeja), giras y conciertos de tu sello, concursos y promoción en la radio.</p>';
      m.set(h);
    };
    m.body.addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b || b.disabled) return;
      const e = exState(s);
      if (b.dataset.tab) { cur = b.dataset.tab; SFX.click(); render(); return; }
      if (bizClick(b.dataset, render)) { if (b.dataset.sellbiz) return; saveGame(); render(); this.refresh(); return; }
      if (b.dataset.job) {
        const r = doJob(b.dataset.job);
        if (r.err) { this.toast(r.err, 'bad'); SFX.bad(); } else this.toast(r.msg, 'good');
      }
      if (b.dataset.merch) {
        const err = buyMerch(+b.dataset.merch);
        if (err) { this.toast(err, 'bad'); SFX.bad(); } else { this.toast(`Pediste ${fmtNum(+b.dataset.merch)} camisetas de White Door.`, 'good'); SFX.coin(); }
      }
      if (b.dataset.rent) { e.rentCabina = !e.rentCabina; SFX.click(); }
      saveGame(); render(); this.refresh();
    });
    render();
  },
});

// Los trabajos del club y la radio aparecen dentro de esos lugares
(function () {
  const base = UI.venueActions;
  UI.venueActions = function (id) {
    const list = base.call(this, id);
    for (const [jid, j] of Object.entries(JOBS)) {
      if (j.place !== id) continue;
      const err = jobError(jid);
      list.push({ label: j.name, desc: err || `${j.desc} (trabajo)`, cost: 0, act: j.act, disabled: !!err, after: () => finishJob(jid) });
    }
    return list;
  };
  // Insignia de objetivos por reclamar
  const refresh = UI.refresh;
  UI.refresh = function () {
    refresh.call(this);
    if (!G.s) return;
    const n = claimableMissions().length, gb = $('#b-goals .badge');
    gb.textContent = n; gb.hidden = !n;
  };
})();
