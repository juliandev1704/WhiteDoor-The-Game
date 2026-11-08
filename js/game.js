'use strict';
/* =========================================================
   WHITE DOOR — Núcleo del tycoon (tiempo, canciones, economía)
   ========================================================= */

const WEEK_MS = DAY_MS * 7;
const SAVE_KEY = 'whitedoor_save_v1';
const G = { s: null, speed: 1, paused: false, modals: 0, running: false, acc: 0, events: [] };

const GEAR_BY_ID = Object.fromEntries(GEAR.map(g => [g.id, g]));
const DECOR_BY_ID = Object.fromEntries(DECOR.map(d => [d.id, d]));
const COURSE_BY_ID = Object.fromEntries(COURSES.map(c => [c.id, c]));
const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/* ---------- utilidades ---------- */
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = str => String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function fmtMoney(n) {
  const sign = n < 0 ? '-' : ''; n = Math.abs(n);
  if (n >= 1e6) return sign + '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e5) return sign + '$' + (n / 1e3).toFixed(0) + 'K';
  return sign + '$' + Math.round(n).toLocaleString('es-CO');
}
function fmtNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1) + 'K';
  return Math.round(n).toLocaleString('es-CO');
}
function dateLabel(s) {
  const w = s.week;
  const y = Math.floor(w / 48) + 1, m = Math.floor((w % 48) / 4) + 1, wk = (w % 4) + 1, d = DAY_NAMES[s.day % 7];
  if (typeof window !== 'undefined' && window.innerWidth <= 420) return `A${y} · M${m} · S${wk} · ${d}`;
  return `Año ${y} · Mes ${m} · Sem ${wk} · ${d}`;
}

/* ---------- estado inicial ---------- */
function newState(name) {
  return {
    version: 2,
    producer: name || 'Julian',
    week: 0, day: 0, money: 5000, fans: 0, prestige: 0,
    level: 1, xp: 0, skillPts: 0,
    skills: { composicion: 0, grabacion: 0, produccion: 0, manitas: 0 },
    equip: { mic: 0, pc: 0, monitor: 0 },
    items: [], room: 0, modules: [], view: 0, loc: 'studio',
    genres: Object.keys(GENRES).filter(g => GENRES[g].start),
    topics: Object.keys(TOPICS).filter(t => TOPICS[t].start),
    flags: {}, courses: [],
    songs: [], best: 0, lastCombo: null,
    insights: {}, combosKnown: {},
    offers: [], artists: {}, dev: null, study: null,
    trend: { genre: pick(['pop', 'hiphop', 'lofi']), until: rint(16, 26) },
    negWeeks: 0, nextOffer: 3, lastIncome: 0, lastExpense: 0, uid: 1,
    // v2
    needs: { energia: 90, hambre: 80, animo: 75 }, salud: 100,
    broken: {}, staff: [], roster: [], label: null,
    candidates: [], scouts: [], auditions: [],
    life: { outfit: 'blanco', outfits: ['blanco'], personal: [], partner: null, goals: {}, awards: [], inspired: 0, eventCool: 3 },
  };
}

// Convierte partidas viejas (v1) al formato nuevo
function migrate(s) {
  if (!s) return null;
  if (s.version === 2) return s;
  const base = newState(s.producer);
  for (const k of Object.keys(base)) if (s[k] === undefined) s[k] = base[k];
  s.skills.manitas = s.skills.manitas || 0;
  s.day = s.week * 7;
  s.version = 2;
  return s;
}

/* ---------- bonificaciones ---------- */
function hasModule(id, s = G.s) { return s.modules.includes(id); }
function moduleCount(id, s = G.s) { return s.modules.filter(m => m === id).length; }
function hasStaff(type, s = G.s) { return s.staff.some(x => x.type === type); }

function bonuses(s = G.s) {
  const b = { p: [0, 0, 0], spd: 1, noise: 0, amb: ROOMS[s.room].amb || 0 };
  const add = it => {
    if (!it) return;
    if (it.p) for (let i = 0; i < 3; i++) b.p[i] += it.p[i];
    if (it.spd) b.spd *= it.spd;
    if (it.noise) b.noise += it.noise;
    if (it.amb) b.amb += it.amb;
  };
  for (const cat of Object.keys(EQUIP)) if (!s.broken[cat]) add(EQUIP[cat][s.equip[cat]]);
  for (const id of s.items) add(GEAR_BY_ID[id] || DECOR_BY_ID[id]);
  for (const m of s.modules) add(MODULES[m]);
  return b;
}

// Qué tan productivo estás (necesidades, inspiración, averías)
function workMult(s = G.s) {
  const n = s.needs;
  const low = Math.min(n.energia, n.hambre, n.animo);
  let m = 0.4 + 0.6 * clamp(low / 50, 0, 1);
  if (n.animo >= 80) m *= 1.1;
  if (s.life.inspired > 0) m *= 1.15;
  if (s.broken.luz) m *= 0.5;
  return m;
}

function phaseRate(ph, b, s = G.s) {
  const copro = s.dev ? coproBonus(s.dev.genre) : 0;
  return (10 + s.skills[PHASES[ph].skill] * 4 + b.p[ph] + copro) * b.spd * (1 + b.amb * 0.008) * workMult(s);
}

function producerTier(s = G.s) {
  let t = 0;
  ARTIST_TIERS.forEach((x, i) => { if (s.prestige >= x.prestige) t = i; });
  return t;
}
function xpNeeded(level) { return Math.round(90 * Math.pow(level, 1.6)); }

function comboType(genre, topic) {
  const c = COMBOS[genre];
  if (!c) return 'neutral';
  if (c.good.includes(topic)) return 'good';
  if (c.bad.includes(topic)) return 'bad';
  return 'neutral';
}
const COMBO_LABEL = { good: '¡Excelente!', neutral: 'Normal', bad: 'Mala' };
function randomSongName() { return pick(SONG_WORDS.a) + ' ' + pick(SONG_WORDS.b); }

/* =========================================================
   PRODUCCIÓN DE CANCIONES
   ========================================================= */
function canStartSong() {
  const s = G.s;
  if (s.dev) return 'Ya estás produciendo una canción.';
  if (s.study) return 'Estás estudiando. Termina el curso primero.';
  if (s.loc !== 'studio') return 'Vuelve al estudio para producir.';
  return null;
}
// ¿Estás trabajando ahora mismo en tu canción?
function canWork(s = G.s) {
  return !!(s.dev && !s.dev.finished && s.loc === 'studio' && !s.broken.pc);
}

function startSong(cfg) {
  const s = G.s;
  const sz = SIZES[cfg.size];
  if (s.money < sz.cost) return 'No tienes suficiente dinero.';
  let artist = null, offer = null, rosterId = null;
  if (cfg.offerId) {
    offer = s.offers.find(o => o.id === cfg.offerId);
    if (!offer) return 'La oferta ya no está disponible.';
    s.offers = s.offers.filter(o => o !== offer);
    artist = offer.artist;
    const advance = Math.round(offer.fee * 0.4);
    s.money += advance;
    UI.toast(`${artist.name} pagó un adelanto de ${fmtMoney(advance)}`, 'good');
    SFX.coin();
  } else if (cfg.rosterId) {
    const r = s.roster.find(a => a.id === cfg.rosterId);
    if (!r) return 'Ese artista ya no está en tu sello.';
    rosterId = r.id;
    artist = { name: r.name, tier: 0, genre: r.genre, fans: r.fans, look: r.look };
    if (r.task !== 'coproducir') setRosterTask(r, 'descanso', true); // co-produce su propia canción
  }
  s.money -= sz.cost;
  s.dev = {
    name: cfg.name, genre: cfg.genre, topic: cfg.topic, size: cfg.size,
    sliders: cfg.sliders, artist, rosterId, offer: offer ? { fee: offer.fee, minScore: offer.minScore } : null,
    weeksTotal: sz.weeks, extra: 0, prog: 0, tickAcc: 0, phase: 0,
    cre: 0, tec: 0, noise: 0, finished: false,
  };
  SFX.startMusic(cfg.genre);
  return null;
}

function devAdvance(dw) {
  const d = G.s.dev;
  if (!d || d.finished) return;
  d.prog += dw; d.tickAcc += dw;
  while (d.tickAcc >= 0.2) { d.tickAcc -= 0.2; devTick(d); }
  if (d.prog >= d.weeksTotal + d.extra) {
    d.prog = d.weeksTotal + d.extra;
    d.finished = true;
    SFX.stopMusic();
    UI.queue(() => UI.devFinished());
  }
}

function devTick(d) {
  const s = G.s, b = bonuses();
  if (d.prog > d.weeksTotal) { // puliendo
    const red = (6 + s.skills.produccion * 1.5 + b.noise * 2 + (hasStaff('ingeniero') ? 4 : 0)) * 0.2 * rnd(0.7, 1.3) * workMult();
    const before = d.noise;
    d.noise = Math.max(0, d.noise - red);
    UI.bubble('noise', -(before - d.noise));
    return;
  }
  const ph = Math.min(2, Math.floor(d.prog / (d.weeksTotal / 3)));
  d.phase = ph;
  const rate = phaseRate(ph, b) * 0.2;
  const sl = d.sliders[ph], sum = sl.reduce((a, c) => a + c, 0) || 1;
  let cre = 0, tec = 0;
  for (let i = 0; i < 3; i++) {
    const a = AREAS[ph * 3 + i], pts = rate * sl[i] / sum;
    cre += pts * a.cre; tec += pts * (1 - a.cre);
  }
  cre *= rnd(0.7, 1.3); tec *= rnd(0.7, 1.3);
  d.cre += cre; d.tec += tec;
  let nz = Math.max(0.15, 3.2 - s.skills.produccion * 0.35 - b.noise * 0.5) * 0.2 * rnd(0.4, 1.6);
  if (hasStaff('ingeniero')) nz *= 0.6;
  if (s.broken.monitor) nz *= 1.6;
  const cops = coproducers().length;
  if (cops) { nz *= coproNoise(); d.copro = Math.max(d.copro || 0, cops); }
  d.noise += nz;
  if (ph === 2) {
    const mm = (sl[0] + sl[2]) / sum;
    d.noise = Math.max(0, d.noise - rate * mm * 0.25);
  }
  UI.bubble('cre', cre); UI.bubble('tec', tec);
  if (nz > 0.45) UI.bubble('noise', nz);
}

function polishSong() {
  const d = G.s.dev;
  d.extra += 1; d.finished = false;
  SFX.startMusic(d.genre);
}

function songStreamsBase(avg, sz, artistFans, genre) {
  const s = G.s;
  const qf = Math.pow(avg / 6, 2.5);
  let b = (2000 + 8 * Math.pow(s.fans, 0.7) + (artistFans ? 3 * Math.pow(artistFans, 0.7) : 0)) * qf * Math.pow(sz.mult, 0.8);
  if (s.trend.genre === genre) b *= 1.3;
  if (s.flags.marketing) b *= 1.25;
  if (hasStaff('community')) b *= 1.15;
  return b * rnd(0.85, 1.15);
}

function releaseSong() {
  const s = G.s, d = s.dev, g = GENRES[d.genre], sz = SIZES[d.size];

  let fitSum = 0;
  const tips = [];
  for (let p = 0; p < 3; p++) {
    const sl = d.sliders[p], ss = sl.reduce((a, c) => a + c, 0) || 1;
    const w = g.w.slice(p * 3, p * 3 + 3), ws = w.reduce((a, c) => a + c, 0) || 1;
    let ov = 0, worst = -1, worstDiff = 0.12;
    for (let i = 0; i < 3; i++) {
      ov += Math.min(sl[i] / ss, w[i] / ws);
      const diff = w[i] / ws - sl[i] / ss;
      if (diff > worstDiff) { worstDiff = diff; worst = i; }
    }
    fitSum += ov;
    if (worst >= 0) tips.push(`Le faltó más ${AREAS[p * 3 + worst].name.toLowerCase()}.`);
  }
  const fit = fitSum / 3;
  const fitF = 0.55 + 0.6 * Math.pow(fit, 2);
  const ct = comboType(d.genre, d.topic);
  const comboF = ct === 'good' ? 1.15 : ct === 'bad' ? 0.75 : 1;
  const key = d.genre + '|' + d.topic;
  const repeatF = s.lastCombo === key ? 0.85 : 1;
  // Repetir el mismo género seguido cansa a la crítica
  const sameGenre = s.songs.slice(0, 3).filter(x => x.genre === d.genre).length;
  const genreF = 1 - 0.05 * sameGenre;
  const pts = d.cre + d.tec;
  const noiseF = 1 - Math.min(0.35, d.noise / Math.max(1, pts) * 0.6);
  const q = (pts / d.weeksTotal) * fitF * comboF * repeatF * genreF * noiseF;

  // Igualar tu mejor canción da ~8. Para un 9-10 hay que superarla de verdad (+35%)
  const ref = Math.max(10, s.best);
  const ratio = q / ref;
  const base = ratio <= 1.05
    ? 1 + 7 * clamp((ratio - 0.4) / 0.65, 0, 1)
    : 8 + 2 * clamp((ratio - 1.05) / 0.35, 0, 1);
  // Un 10 exige todo: combinación genial, reparto casi perfecto y mezcla limpia
  let cap = 10;
  const capWhy = [];
  if (ct !== 'good') { cap = 9; capWhy.push('una combinación genial de género y tema'); }
  if (fit < 0.93) { cap = Math.min(cap, fit < 0.8 ? 8 : 9); capWhy.push('un reparto de enfoque más preciso'); }
  if (noiseF < 0.93) { cap = Math.min(cap, 9); capWhy.push('una mezcla más limpia (pule el ruido)'); }
  const critics = CRITICS.map(name => ({ name, score: clamp(Math.round(base + rnd(-0.8, 0.5)), 1, cap) }));
  const avg = critics.reduce((a, c) => a + c.score, 0) / critics.length;
  if (q > s.best) s.best = q;

  const insights = [];
  if (!s.combosKnown[key]) {
    s.combosKnown[key] = ct;
    insights.push(`${g.name} + ${TOPICS[d.topic].name}: combinación ${COMBO_LABEL[ct].toLowerCase()}`);
  }
  const known = s.insights[d.genre] || (s.insights[d.genre] = []);
  for (let k = 0; k < (avg >= 7 ? 2 : 1); k++) {
    const unknown = [...Array(9).keys()].filter(i => !known.includes(i));
    if (!unknown.length) break;
    const i = pick(unknown);
    known.push(i);
    insights.push(`${AREAS[i].name} en ${g.name}: ${importanceLabel(g.w[i])}`);
  }
  if (repeatF < 1) tips.push('El público se cansó de la misma combinación.');
  if (sameGenre >= 2) tips.push(`Ya sacaste mucho ${g.name} seguido; cambia de género para sorprender.`);
  if (base >= 9 && cap < 10 && capWhy.length) tips.push(`Para un 10 te faltó ${capWhy.join(', ')}.`);
  if (noiseF < 0.85) tips.push('Se escuchaba mucho ruido en la mezcla.');

  const artist = d.artist;
  const roster = d.rosterId ? s.roster.find(a => a.id === d.rosterId) : null;
  const baseStreams = songStreamsBase(avg, sz, artist ? artist.fans : 0, d.genre);

  const song = {
    id: s.uid++, name: d.name, genre: d.genre, topic: d.topic, size: d.size,
    artist: artist ? artist.name : null, artistTier: artist ? artist.tier : null,
    label: !!roster, rosterId: roster ? roster.id : null, producer: s.producer,
    score: Math.round(avg * 10) / 10, critics: critics.map(c => c.score),
    week: s.week, base: baseStreams, weeks: 0, streams: 0, revenue: 0, last: 0,
    chart: null, peak: null, active: true,
  };
  s.songs.unshift(song);
  if (d.copro) exState().coproSongs++;
  s.lastCombo = key;

  const rewards = [];
  if (artist && d.offer) {
    const rest = Math.round(d.offer.fee * 0.6);
    s.money += rest;
    rewards.push(`Pago final de ${artist.name}: ${fmtMoney(rest)}`);
    const rel = s.artists[artist.name] || (s.artists[artist.name] = { ...artist, songs: 0, happy: 0, totalScore: 0 });
    rel.songs++; rel.totalScore += avg; rel.fans = artist.fans;
    if (avg >= d.offer.minScore) {
      const bonus = Math.round(d.offer.fee * 0.5);
      s.money += bonus; rel.happy++;
      rewards.push(`¡Bono por calidad! +${fmtMoney(bonus)} (pedía ${d.offer.minScore}+)`);
    } else {
      rel.happy--;
      s.prestige = Math.max(0, s.prestige - 5);
      rewards.push(`${artist.name} esperaba ${d.offer.minScore}+ y quedó decepcionado (−5 prestigio)`);
    }
  }
  if (roster) {
    roster.songs++;
    roster.mood = clamp(roster.mood + (avg >= 7 ? 15 : avg < 5 ? -10 : 3), 0, 100);
    rewards.push(`Lanzamiento de White Door Records con ${roster.name}`);
  }

  let pg = Math.round((Math.pow(Math.max(0, avg - 4.5), 1.6) * 5 * Math.pow(sz.mult, 0.6) + (artist && d.offer ? artist.tier * 4 : 0)) * 0.7);
  if (avg < 4) pg = -3;
  s.prestige = Math.max(0, s.prestige + pg);
  rewards.push(`${pg >= 0 ? '+' : ''}${pg} prestigio`);
  const xp = Math.round(pts / 3 + avg * 4);
  rewards.push(`+${xp} XP`);
  const levels = gainXP(xp);
  if (avg >= 9) s.fans += Math.round(baseStreams * 0.05);
  s.needs.animo = clamp(s.needs.animo + (avg >= 7.5 ? 15 : avg < 4 ? -15 : 0), 0, 100);

  s.dev = null;
  SFX.stopMusic();
  completeGoal('cancion1');
  saveGame();
  return { song, critics, avg, insights, tips: tips.slice(0, 2), rewards, levels, artist, combo: ct };
}

function importanceLabel(w) {
  return w >= 3 ? '★ CLAVE' : w === 2 ? 'importante' : w === 1 ? 'poco importante' : '✕ no importa';
}

function gainXP(n) {
  const s = G.s;
  s.xp += n;
  let ups = 0;
  while (s.xp >= xpNeeded(s.level)) {
    s.xp -= xpNeeded(s.level);
    s.level++; s.skillPts++; ups++;
  }
  return ups;
}

function chartPos(streams) {
  if (streams < 300) return null;
  const p = Math.round(118 - 19.5 * Math.log10(streams));
  return p > 100 ? null : Math.max(1, p);
}

/* =========================================================
   ARTISTAS QUE TE CONTACTAN
   ========================================================= */
function randomLook(tier = 0) {
  return {
    skin: pick(LOOKS.skin), hair: pick(LOOKS.hair), shirt: pick(LOOKS.shirt), pants: pick(LOOKS.pants),
    style: rint(0, 4), glasses: Math.random() < 0.15 + tier * 0.12,
  };
}
function artistName(genre) {
  if (['rock', 'metal', 'indie', 'salsa', 'cumbia'].includes(genre) && Math.random() < 0.5) return pick(ARTIST_NAMES.bands);
  const pre = pick(ARTIST_NAMES.pre);
  return (pre ? pre + ' ' : '') + pick(ARTIST_NAMES.name);
}

function genOffer(minTier = 0) {
  const s = G.s;
  const maxT = Math.max(minTier, Math.min(producerTier(), s.room + 2));
  const r = Math.random();
  let tier = clamp(maxT - (r < 0.55 ? 0 : r < 0.85 ? 1 : 2), minTier, 5);
  const happy = Object.values(s.artists).filter(a => a.happy > 0);
  let artist;
  if (happy.length && Math.random() < 0.3) {
    const a = pick(happy);
    a.fans = Math.round(a.fans * rnd(1.2, 1.8));
    a.tier = Math.max(a.tier, ARTIST_TIERS.reduce((m, t, i) => a.fans >= t.fans[0] ? i : m, 0));
    artist = { name: a.name, tier: a.tier, genre: a.genre, fans: a.fans, look: a.look, returning: true };
    tier = a.tier;
  } else {
    const genre = Math.random() < 0.75 ? pick(s.genres) : pick(Object.keys(GENRES));
    const T = ARTIST_TIERS[tier];
    artist = { name: artistName(genre), tier, genre, fans: Math.round(rnd(T.fans[0], T.fans[1])), look: randomLook(tier) };
  }
  const T = ARTIST_TIERS[tier];
  let fee = rnd(T.fee[0], T.fee[1]) * (s.flags.negocios ? 1.25 : 1) * (artist.returning ? 1.2 : 1) * (hasStaff('manager') ? 1.2 : 1);
  fee = Math.round(fee / 50) * 50;
  const minScore = clamp(Math.round(5 + tier * 0.6 + rnd(-0.5, 1)), 5, 9);
  return { id: s.uid++, artist, fee, minScore, left: rint(5, 8) };
}
function addOffer(o) {
  const s = G.s;
  if (s.offers.length >= 6) return;
  s.offers.push(o || genOffer());
  UI.toast(`Nuevo mensaje: ${s.offers[s.offers.length - 1].artist.name} quiere trabajar contigo`, 'mail');
  SFX.mail();
}

/* =========================================================
   TIEMPO: DÍAS Y SEMANAS
   ========================================================= */
function advanceDay() {
  const s = G.s;
  s.day++;
  dailyLife();
  if (s.day % 7 === 0) advanceWeek();
}

// Adelanta el tiempo de golpe (dormir, viajar, comer fuera...)
function passTime(days) {
  const whole = Math.floor(days);
  for (let i = 0; i < whole && G.running; i++) advanceDay();
  G.acc += (days - whole) * DAY_MS;
  while (G.acc >= DAY_MS && G.running) { G.acc -= DAY_MS; advanceDay(); }
  UI.refresh();
}

function advanceWeek() {
  const s = G.s;
  s.week++;
  const rent = ROOMS[s.room].rent;
  const salaries = s.staff.reduce((a, x) => a + x.salary, 0) + s.roster.reduce((a, x) => a + x.salary, 0);
  s.money -= rent + salaries;
  s.lastExpense = rent + salaries;

  let income = 0, newFans = 0;
  for (const so of s.songs) {
    if (!so.active) continue;
    const decay = 0.78 + 0.012 * so.score;
    let st = so.base * Math.pow(decay, so.weeks) * rnd(0.92, 1.08);
    if (s.trend.genre === so.genre) st *= 1.15;
    so.weeks++;
    const rate = so.label ? 0.035 : so.artist ? 0.02 : 0.05;
    const rev = st * rate;
    income += rev; so.streams += st; so.revenue += rev; so.last = st;
    newFans += st * (so.label ? 0.015 : so.artist ? 0.02 : 0.04) * (s.flags.redes ? 1.5 : 1) / Math.sqrt(1 + s.fans / 1e5);
    if (so.rosterId) { const r = s.roster.find(a => a.id === so.rosterId); if (r) r.fans += st * 0.04 / Math.sqrt(1 + r.fans / 1e5); }
    so.chart = chartPos(st);
    if (so.chart && (!so.peak || so.chart < so.peak)) {
      if (so.chart <= 10 && (!so.peak || so.peak > 10)) { UI.toast(`"${so.name}" entró al TOP 10 (#${so.chart})`, 'good'); completeGoal('top10'); }
      if (so.chart === 1) completeGoal('numero1');
      so.peak = so.chart;
    }
    if (st < 40 || so.weeks > 70) { so.active = false; so.chart = null; }
  }
  if (hasStaff('community')) {
    const cm = s.staff.filter(x => x.type === 'community').reduce((a, x) => a + x.skill, 0);
    newFans += (50 + Math.pow(s.fans, 0.6)) * cm * 0.5;
  }
  s.money += income;
  s.fans += newFans;
  s.lastIncome = income;

  weeklyLabel();
  weeklyLife();
  weeklyExtras();

  if (s.study) {
    s.study.left--;
    if (s.study.left <= 0) { const id = s.study.id; s.study = null; completeCourse(id); }
  }

  for (const o of s.offers) o.left--;
  const expired = s.offers.filter(o => o.left <= 0);
  if (expired.length) UI.toast(`La oferta de ${expired[0].artist.name} expiró`, 'muted');
  s.offers = s.offers.filter(o => o.left > 0);
  s.nextOffer--;
  if (s.nextOffer <= 0) {
    const amb = bonuses().amb;
    addOffer();
    s.nextOffer = Math.max(2, rint(4, 7) - (amb >= 20 ? 1 : 0) - (amb >= 40 ? 1 : 0) - (hasStaff('asistente') ? 1 : 0));
  }

  if (s.week >= s.trend.until) {
    s.trend = { genre: pick(Object.keys(GENRES)), until: s.week + rint(20, 32) };
    UI.toast(`Nueva tendencia: ¡el ${GENRES[s.trend.genre].name} está de moda!`, 'trend');
  }
  if (s.songs.length && Math.random() < 0.03) randomEvent();
  if (s.week % 48 === 46) pixelAwards();

  if (s.fans >= 1e5) completeGoal('fans100k');
  if (s.money >= 1e6) completeGoal('millon');

  if (s.money < 0) {
    s.negWeeks++;
    if (s.negWeeks === 1) UI.toast('¡Estás en números rojos! Tienes 12 semanas para recuperarte.', 'bad');
    if (s.negWeeks >= 12) { UI.gameOver(); return; }
  } else s.negWeeks = 0;

  if (s.week % 4 === 0) saveGame();
  UI.refresh();
}

function randomEvent() {
  const s = G.s;
  const active = s.songs.filter(x => x.active);
  const evs = [
    () => { const f = Math.round(Math.max(200, s.fans * rnd(0.04, 0.1))); s.fans += f; return `¡Un video tuyo produciendo se hizo viral! +${fmtNum(f)} fans`; },
    () => { if (!active.length) return null; const so = pick(active); so.base *= 1.4; return `"${so.name}" está sonando en la radio. ¡Las reproducciones suben!`; },
    () => { s.prestige += 6; return 'Te invitaron a un panel de productores. +6 prestigio'; },
    () => { const m = Math.round(rnd(200, 900) * (1 + s.room)); s.money += m; return `Vendiste un beat a un creador de contenido: +${fmtMoney(m)}`; },
  ];
  const msg = pick(evs)();
  if (msg) UI.toast(msg, 'event');
}

/* =========================================================
   COMPRAS, PROPIEDADES Y CURSOS
   ========================================================= */
function priceOf(it, online) { return Math.round(it.price * (online ? 1.2 : 1)); }
function buyEquip(cat, tier, online) {
  const s = G.s, it = EQUIP[cat][tier], price = priceOf(it, online);
  if (tier <= s.equip[cat]) return 'Ya tienes algo mejor.';
  if (it.room && s.room < it.room) return `Necesitas: ${ROOMS[it.room].name}`;
  if (s.money < price) return 'No te alcanza el dinero.';
  s.money -= price; s.equip[cat] = tier; delete s.broken[cat];
  saveGame(); return null;
}
function buyItem(id, online) {
  const s = G.s, it = GEAR_BY_ID[id] || DECOR_BY_ID[id];
  if (!it || s.items.includes(id)) return 'Ya lo tienes.';
  const price = priceOf(it, online);
  if (it.room && s.room < it.room) return `Necesitas: ${ROOMS[it.room].name}`;
  if (s.money < price) return 'No te alcanza el dinero.';
  s.money -= price; s.items.push(id);
  saveGame(); return null;
}
function buyRoom(i) {
  const s = G.s, r = ROOMS[i];
  if (i <= s.room) return 'Ya tienes este espacio o uno mejor.';
  if (i > s.room + 1) return 'Primero mejora al espacio anterior.';
  if (s.money < r.price) return 'No te alcanza el dinero.';
  s.money -= r.price; s.room = i;
  s.prestige += 25 * i;
  if (i === ROOMS.length - 1) completeGoal('hq');
  saveGame(); return null;
}
function moduleSlots(s = G.s) { return ROOMS[s.room].slots; }
function buyModule(id) {
  const s = G.s, m = MODULES[id];
  if (s.modules.length >= moduleSlots()) return 'No tienes espacio. Múdate a una propiedad más grande.';
  if (s.money < m.price) return 'No te alcanza el dinero.';
  s.money -= m.price; s.modules.push(id);
  saveGame(); return null;
}
function sellModule(idx) {
  const s = G.s, id = s.modules[idx];
  if (!id) return 'No existe.';
  if (id === 'oficina' && s.staff.length > OFFICE_DESKS * (moduleCount('oficina') - 1)) return 'Primero despide personal: no cabrían en la oficina.';
  s.modules.splice(idx, 1);
  s.money += Math.round(MODULES[id].price * 0.5);
  s.view = 0;
  fixRosterTasks();
  saveGame(); return null;
}

function courseStatus(c, s = G.s) {
  if (s.courses.includes(c.id)) return 'done';
  if (c.genre && s.genres.includes(c.genre)) return 'done';
  if (c.req && !s.courses.includes(c.req)) return 'locked';
  if (c.level && s.level < c.level) return 'locked';
  return 'open';
}
function enrollCourse(id) {
  const s = G.s, c = COURSE_BY_ID[id];
  if (s.dev) return 'Termina tu canción antes de estudiar.';
  if (s.study) return 'Ya estás tomando un curso.';
  if (courseStatus(c) !== 'open') return 'Este curso no está disponible.';
  if (s.money < c.cost) return 'No te alcanza el dinero.';
  s.money -= c.cost;
  s.study = { id, left: c.weeks, total: c.weeks };
  saveGame(); return null;
}
function completeCourse(id) {
  const s = G.s, c = COURSE_BY_ID[id];
  s.courses.push(id);
  let msg = `Curso completado: ${c.name}.`;
  if (c.skill) { s.skills[c.skill[0]] = (s.skills[c.skill[0]] || 0) + c.skill[1]; msg += ` +${c.skill[1]} ${SKILLS[c.skill[0]].name}`; }
  if (c.genre) { s.genres.push(c.genre); msg += ` ¡Ahora puedes producir ${GENRES[c.genre].name}!`; }
  if (c.topics) { for (const t of Object.keys(TOPICS)) if (!s.topics.includes(t)) s.topics.push(t); msg += ' Nuevos temas disponibles.'; }
  if (c.flag) s.flags[c.flag] = true;
  gainXP(15);
  UI.toast(msg, 'good');
  SFX.level();
  saveGame();
}

/* ---------- Aspiraciones ---------- */
function completeGoal(id) {
  const s = G.s;
  if (!s || s.life.goals[id] !== undefined) return;
  const g = GOALS.find(x => x.id === id);
  if (!g) return;
  s.life.goals[id] = s.week;
  if (g.xp) gainXP(g.xp);
  if (g.prestige) s.prestige += g.prestige;
  UI.toast(`Aspiración cumplida: ${g.name}${g.prestige ? ` (+${g.prestige} prestigio)` : g.xp ? ` (+${g.xp} XP)` : ''}`, 'good');
  SFX.level();
  if (id === 'hq') UI.queue(() => UI.victory());
}

/* =========================================================
   GUARDADO
   ========================================================= */
function saveGame() {
  try { if (G.s) localStorage.setItem(SAVE_KEY, JSON.stringify(G.s)); } catch (e) { /* sin almacenamiento */ }
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && (s.version === 1 || s.version === 2) ? migrate(s) : null;
  } catch (e) { return null; }
}
function hasSave() { return !!loadGame(); }
function deleteSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* nada */ } }
