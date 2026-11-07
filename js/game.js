'use strict';
/* =========================================================
   WHITE DOOR — Lógica del tycoon
   ========================================================= */

const WEEK_MS = 3200;           // duración de una semana a velocidad 1x
const SAVE_KEY = 'whitedoor_save_v1';
const G = { s: null, speed: 1, paused: false, modals: 0, running: false, acc: 0 };

const GEAR_BY_ID = Object.fromEntries(GEAR.map(g => [g.id, g]));
const DECOR_BY_ID = Object.fromEntries(DECOR.map(d => [d.id, d]));
const COURSE_BY_ID = Object.fromEntries(COURSES.map(c => [c.id, c]));

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
function dateLabel(w) {
  return `Año ${Math.floor(w / 48) + 1} · Mes ${Math.floor((w % 48) / 4) + 1} · Sem ${(w % 4) + 1}`;
}

/* ---------- estado inicial ---------- */
function newState(name) {
  return {
    version: 1,
    producer: name || 'Julian',
    week: 0, money: 5000, fans: 0, prestige: 0,
    level: 1, xp: 0, skillPts: 0,
    skills: { composicion: 0, grabacion: 0, produccion: 0 },
    equip: { mic: 0, pc: 0, monitor: 0 },
    items: [], room: 0,
    genres: Object.keys(GENRES).filter(g => GENRES[g].start),
    topics: Object.keys(TOPICS).filter(t => TOPICS[t].start),
    flags: {}, courses: [],
    songs: [], best: 0, lastCombo: null,
    insights: {}, combosKnown: {},
    offers: [], artists: {}, dev: null, study: null,
    trend: { genre: pick(['pop', 'hiphop', 'lofi']), until: rint(16, 26) },
    negWeeks: 0, nextOffer: 3, lastIncome: 0, lastExpense: 0, uid: 1,
  };
}

/* ---------- bonificaciones ---------- */
function bonuses(s = G.s) {
  const b = { p: [0, 0, 0], spd: 1, noise: 0, amb: ROOMS[s.room].amb || 0 };
  const add = it => {
    if (!it) return;
    if (it.p) for (let i = 0; i < 3; i++) b.p[i] += it.p[i];
    if (it.spd) b.spd *= it.spd;
    if (it.noise) b.noise += it.noise;
    if (it.amb) b.amb += it.amb;
  };
  for (const cat of Object.keys(EQUIP)) add(EQUIP[cat][s.equip[cat]]);
  for (const id of s.items) add(GEAR_BY_ID[id] || DECOR_BY_ID[id]);
  return b;
}
function phaseRate(ph, b, s = G.s) {
  return (10 + s.skills[PHASES[ph].skill] * 4 + b.p[ph]) * b.spd * (1 + b.amb * 0.008);
}

function producerTier(s = G.s) {
  let t = 0;
  ARTIST_TIERS.forEach((x, i) => { if (s.prestige >= x.prestige) t = i; });
  return t;
}
function xpNeeded(level) { return Math.round(60 * Math.pow(level, 1.5)); }

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
  return null;
}

function startSong(cfg) {
  const s = G.s;
  const sz = SIZES[cfg.size];
  if (s.money < sz.cost) return 'No tienes suficiente dinero.';
  let artist = null, offer = null;
  if (cfg.offerId) {
    offer = s.offers.find(o => o.id === cfg.offerId);
    if (!offer) return 'La oferta ya no está disponible.';
    s.offers = s.offers.filter(o => o !== offer);
    artist = offer.artist;
    const advance = Math.round(offer.fee * 0.4);
    s.money += advance;
    UI.toast(`${artist.name} pagó un adelanto de ${fmtMoney(advance)}`, 'good');
    SFX.coin();
  }
  s.money -= sz.cost;
  s.dev = {
    name: cfg.name, genre: cfg.genre, topic: cfg.topic, size: cfg.size,
    sliders: cfg.sliders, artist, offer: offer ? { fee: offer.fee, minScore: offer.minScore } : null,
    weeksTotal: sz.weeks, extra: 0, prog: 0, tickAcc: 0, phase: 0,
    cre: 0, tec: 0, noise: 0, finished: false,
  };
  SFX.startMusic(cfg.genre);
  return null;
}

// avanza la producción (dw = semanas transcurridas, puede ser fracción)
function devAdvance(dw) {
  const d = G.s.dev;
  if (!d || d.finished) return;
  d.prog += dw; d.tickAcc += dw;
  while (d.tickAcc >= 0.2) { d.tickAcc -= 0.2; devTick(d); }
  if (d.prog >= d.weeksTotal + d.extra) {
    d.prog = d.weeksTotal + d.extra;
    d.finished = true;
    SFX.stopMusic();
    UI.devFinished();
  }
}

function devTick(d) {
  const s = G.s, b = bonuses();
  if (d.prog > d.weeksTotal) { // puliendo
    const red = (6 + s.skills.produccion * 1.5 + b.noise * 2) * 0.2 * rnd(0.7, 1.3);
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
  const nz = Math.max(0.15, 3.2 - s.skills.produccion * 0.35 - b.noise * 0.5) * 0.2 * rnd(0.4, 1.6);
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

function releaseSong() {
  const s = G.s, d = s.dev, g = GENRES[d.genre], sz = SIZES[d.size];

  // Ajuste de enfoque con el género
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
  const pts = d.cre + d.tec;
  const noiseF = 1 - Math.min(0.35, d.noise / Math.max(1, pts) * 0.6);
  const q = (pts / d.weeksTotal) * fitF * comboF * repeatF * noiseF;

  const ref = Math.max(10, s.best * 0.95);
  const ratio = q / ref;
  const base = 1 + 9 * clamp((ratio - 0.4) / 0.8, 0, 1);
  const critics = CRITICS.map(name => ({ name, score: clamp(Math.round(base + rnd(-0.8, 0.8)), 1, 10) }));
  const avg = critics.reduce((a, c) => a + c.score, 0) / critics.length;
  if (q > s.best) s.best = q;

  // Descubrimientos
  const insights = [];
  if (!s.combosKnown[key]) {
    s.combosKnown[key] = ct;
    insights.push(`${g.name} + ${TOPICS[d.topic].name}: combinación ${COMBO_LABEL[ct].toLowerCase()}`);
  }
  const known = s.insights[d.genre] || (s.insights[d.genre] = []);
  const reveal = avg >= 7 ? 2 : 1;
  for (let k = 0; k < reveal; k++) {
    const unknown = [...Array(9).keys()].filter(i => !known.includes(i));
    if (!unknown.length) break;
    const i = pick(unknown);
    known.push(i);
    insights.push(`${AREAS[i].name} en ${g.name}: ${importanceLabel(g.w[i])}`);
  }
  if (repeatF < 1) tips.push('El público se cansó de la misma combinación.');
  if (noiseF < 0.85) tips.push('Se escuchaba mucho ruido en la mezcla.');

  // Reproducciones y fans
  const artist = d.artist;
  const qf = Math.pow(avg / 6, 2.5);
  let baseStreams = (2000 + 6 * Math.pow(s.fans, 0.8) + (artist ? 2 * Math.pow(artist.fans, 0.8) : 0)) * qf * Math.pow(sz.mult, 0.8);
  if (s.trend.genre === d.genre) baseStreams *= 1.3;
  if (s.flags.marketing) baseStreams *= 1.25;
  baseStreams *= rnd(0.85, 1.15);

  const song = {
    id: s.uid++, name: d.name, genre: d.genre, topic: d.topic, size: d.size,
    artist: artist ? artist.name : null, artistTier: artist ? artist.tier : null,
    score: Math.round(avg * 10) / 10, critics: critics.map(c => c.score),
    week: s.week, base: baseStreams, weeks: 0, streams: 0, revenue: 0, last: 0,
    chart: null, peak: null, active: true,
  };
  s.songs.unshift(song);
  s.lastCombo = key;

  // Pago del artista
  const rewards = [];
  if (artist) {
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

  // Prestigio y experiencia
  let pg = Math.round(Math.pow(Math.max(0, avg - 4.5), 1.6) * 5 * Math.pow(sz.mult, 0.6) + (artist ? artist.tier * 4 : 0));
  if (avg < 4) pg = -3;
  s.prestige = Math.max(0, s.prestige + pg);
  rewards.push(`${pg >= 0 ? '+' : ''}${pg} prestigio`);
  const xp = Math.round(pts / 3 + avg * 4);
  rewards.push(`+${xp} XP`);
  const levels = gainXP(xp);
  if (avg >= 9) s.fans += Math.round(baseStreams * 0.05);

  s.dev = null;
  SFX.stopMusic();
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
   ARTISTAS Y OFERTAS
   ========================================================= */
function randomLook(tier) {
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

function genOffer() {
  const s = G.s;
  let maxT = Math.min(producerTier(), s.room + 2);
  const r = Math.random();
  let tier = clamp(maxT - (r < 0.55 ? 0 : r < 0.85 ? 1 : 2), 0, 5);

  // a veces vuelve un artista con el que ya trabajaste
  const happy = Object.values(s.artists).filter(a => a.happy > 0);
  let artist;
  if (happy.length && Math.random() < 0.3) {
    const a = pick(happy);
    a.fans = Math.round(a.fans * rnd(1.2, 1.8));
    a.tier = Math.max(a.tier, ARTIST_TIERS.reduce((m, t, i) => a.fans >= t.fans[0] ? i : m, 0));
    artist = { name: a.name, tier: a.tier, genre: a.genre, fans: a.fans, look: a.look, returning: true };
    tier = a.tier;
  } else {
    const all = Object.keys(GENRES);
    const genre = Math.random() < 0.75 ? pick(s.genres) : pick(all);
    const T = ARTIST_TIERS[tier];
    artist = { name: artistName(genre), tier, genre, fans: Math.round(rnd(T.fans[0], T.fans[1])), look: randomLook(tier) };
  }
  const T = ARTIST_TIERS[tier];
  let fee = rnd(T.fee[0], T.fee[1]) * (s.flags.negocios ? 1.25 : 1) * (artist.returning ? 1.2 : 1);
  fee = Math.round(fee / 50) * 50;
  const minScore = clamp(Math.round(5 + tier * 0.6 + rnd(-0.5, 1)), 5, 9);
  return { id: s.uid++, artist, fee, minScore, left: rint(5, 8) };
}

/* =========================================================
   SEMANAS
   ========================================================= */
function advanceWeek() {
  const s = G.s;
  s.week++;
  const rent = ROOMS[s.room].rent;
  s.money -= rent;
  s.lastExpense = rent;

  // Canciones en las listas
  let income = 0, newFans = 0;
  for (const so of s.songs) {
    if (!so.active) continue;
    const decay = 0.78 + 0.012 * so.score;
    let st = so.base * Math.pow(decay, so.weeks) * rnd(0.92, 1.08);
    if (s.trend.genre === so.genre) st *= 1.15;
    so.weeks++;
    const rev = st * (so.artist ? 0.03 : 0.08);
    income += rev; so.streams += st; so.revenue += rev; so.last = st;
    newFans += st * (so.artist ? 0.02 : 0.04) * (s.flags.redes ? 1.5 : 1) / Math.sqrt(1 + s.fans / 5e5);
    so.chart = chartPos(st);
    if (so.chart && (!so.peak || so.chart < so.peak)) {
      if (so.chart <= 10 && (!so.peak || so.peak > 10)) UI.toast(`"${so.name}" entró al TOP 10 (#${so.chart})`, 'good');
      so.peak = so.chart;
    }
    if (st < 40 || so.weeks > 70) { so.active = false; so.chart = null; }
  }
  s.money += income;
  s.fans += newFans;
  s.lastIncome = income;

  // Estudios
  if (s.study) {
    s.study.left--;
    if (s.study.left <= 0) { const id = s.study.id; s.study = null; completeCourse(id); }
  }

  // Ofertas
  for (const o of s.offers) o.left--;
  const expired = s.offers.filter(o => o.left <= 0);
  if (expired.length) UI.toast(`La oferta de ${expired[0].artist.name} expiró`, 'muted');
  s.offers = s.offers.filter(o => o.left > 0);
  s.nextOffer--;
  if (s.nextOffer <= 0) {
    const amb = bonuses().amb;
    if (s.offers.length < 5) {
      const o = genOffer();
      s.offers.push(o);
      UI.toast(`Nuevo mensaje: ${o.artist.name} quiere trabajar contigo`, 'mail');
      SFX.mail();
    }
    s.nextOffer = Math.max(2, rint(3, 6) - (amb >= 20 ? 1 : 0) - (amb >= 40 ? 1 : 0));
  }

  // Tendencias
  if (s.week >= s.trend.until) {
    s.trend = { genre: pick(Object.keys(GENRES)), until: s.week + rint(20, 32) };
    UI.toast(`Nueva tendencia: ¡el ${GENRES[s.trend.genre].name} está de moda!`, 'trend');
  }

  // Eventos aleatorios
  if (s.songs.length && Math.random() < 0.035) randomEvent();

  // Bancarrota
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
    () => {
      const f = Math.round(Math.max(200, s.fans * rnd(0.05, 0.15)));
      s.fans += f; return `¡Un video tuyo produciendo se hizo viral! +${fmtNum(f)} fans`;
    },
    () => {
      if (!active.length) return null;
      const so = pick(active); so.base *= 1.5;
      return `"${so.name}" está sonando en la radio. ¡Las reproducciones suben!`;
    },
    () => { s.prestige += 8; return 'Te invitaron a un panel de productores. +8 prestigio'; },
    () => {
      const m = Math.round(rnd(300, 1500) * (1 + s.room));
      s.money += m; return `Vendiste un beat a un creador de contenido: +${fmtMoney(m)}`;
    },
    () => {
      if (s.equip.pc !== 0) return null;
      s.money -= 200; return 'Tu laptop vieja se recalentó. Reparación: −$200';
    },
  ];
  const msg = pick(evs)();
  if (msg) UI.toast(msg, 'event');
}

/* =========================================================
   COMPRAS Y CURSOS
   ========================================================= */
function buyEquip(cat, tier) {
  const s = G.s, it = EQUIP[cat][tier];
  if (tier <= s.equip[cat]) return 'Ya tienes algo mejor.';
  if (it.room && s.room < it.room) return `Necesitas: ${ROOMS[it.room].name}`;
  if (s.money < it.price) return 'No te alcanza el dinero.';
  s.money -= it.price; s.equip[cat] = tier;
  saveGame(); return null;
}
function buyItem(id) {
  const s = G.s, it = GEAR_BY_ID[id] || DECOR_BY_ID[id];
  if (!it || s.items.includes(id)) return 'Ya lo tienes.';
  if (it.room && s.room < it.room) return `Necesitas: ${ROOMS[it.room].name}`;
  if (s.money < it.price) return 'No te alcanza el dinero.';
  s.money -= it.price; s.items.push(id);
  saveGame(); return null;
}
function buyRoom(i) {
  const s = G.s, r = ROOMS[i];
  if (i <= s.room) return 'Ya tienes este espacio o uno mejor.';
  if (i > s.room + 1) return 'Primero mejora al espacio anterior.';
  if (s.money < r.price) return 'No te alcanza el dinero.';
  s.money -= r.price; s.room = i;
  s.prestige += 25 * i;
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
  if (c.skill) { s.skills[c.skill[0]] += c.skill[1]; msg += ` +${c.skill[1]} ${SKILLS[c.skill[0]].name}`; }
  if (c.genre) { s.genres.push(c.genre); msg += ` ¡Ahora puedes producir ${GENRES[c.genre].name}!`; }
  if (c.topics) { for (const t of Object.keys(TOPICS)) if (!s.topics.includes(t)) s.topics.push(t); msg += ' Nuevos temas disponibles.'; }
  if (c.flag) s.flags[c.flag] = true;
  gainXP(15);
  UI.toast(msg, 'good');
  SFX.level();
  saveGame();
}

/* =========================================================
   GUARDADO
   ========================================================= */
function saveGame() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.s)); } catch (e) { /* sin almacenamiento */ }
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && s.version === 1 ? s : null;
  } catch (e) { return null; }
}
function hasSave() { return !!loadGame(); }
function deleteSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* nada */ } }
