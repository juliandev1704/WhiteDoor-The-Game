'use strict';
/* =========================================================
   WHITE DOOR — Discográfica, artistas firmados y personal
   ========================================================= */

/* ---------- Personal ---------- */
function staffCapacity(s = G.s) { return 4 * moduleCount('oficina', s); }
function staffName() { return pick(STAFF_NAMES.first) + ' ' + pick(STAFF_NAMES.last); }

function genStaffCandidate() {
  const s = G.s;
  const type = pick(Object.keys(STAFF_TYPES));
  const skill = clamp(rint(1, 3) + (producerTier() >= 2 ? 1 : 0) + (Math.random() < 0.15 ? 1 : 0), 1, 5);
  const salary = Math.round(STAFF_TYPES[type].base * (0.6 + 0.3 * skill) / 10) * 10;
  return { id: s.uid++, type, name: staffName(), look: randomLook(0), skill, salary, xp: 0, assign: null };
}
function refreshCandidates(force) {
  const s = G.s;
  if (force || !s.candidates.length || s.week % 4 === 0) s.candidates = Array.from({ length: 4 }, genStaffCandidate);
}
function hireStaff(id) {
  const s = G.s;
  const c = s.candidates.find(x => x.id === id);
  if (!c) return 'Ese candidato ya no está disponible.';
  if (s.staff.length >= staffCapacity()) return staffCapacity() ? 'La oficina está llena. Compra otra oficina.' : 'Necesitas una Oficina (Bienes Raíces) para contratar.';
  if (s.money < c.salary * 2) return 'Necesitas al menos 2 semanas de salario en el banco.';
  s.candidates = s.candidates.filter(x => x !== c);
  s.staff.push(c);
  completeGoal('empleado');
  saveGame(); return null;
}
function fireStaff(id) {
  const s = G.s, st = s.staff.find(x => x.id === id);
  if (!st) return;
  s.money -= st.salary * 2;
  s.staff = s.staff.filter(x => x !== st);
  for (const a of s.roster) if (a.producerId === id) setRosterTask(a, 'descanso', true);
  fixRosterTasks();
  saveGame();
}
function freeProducer(s = G.s) {
  return s.staff.find(x => x.type === 'productor' && !s.roster.some(a => a.producerId === x.id));
}

/* ---------- Sello ---------- */
const LABEL_COST = 6000;
function foundLabel() {
  const s = G.s;
  if (s.label) return 'Ya tienes un sello.';
  if (s.money < LABEL_COST) return 'No te alcanza el dinero.';
  s.money -= LABEL_COST;
  s.label = { name: 'White Door Records', founded: s.week };
  completeGoal('sello');
  saveGame(); return null;
}
function rosterCap(s = G.s) { return s.label ? 1 + s.room : 0; }

function genRosterCandidate(kind) {
  const s = G.s;
  const genre = Math.random() < 0.7 ? pick(s.genres) : pick(Object.keys(GENRES));
  const scout = kind === 'scout';
  const talent = Math.round(scout ? rnd(35, 80) : rnd(10, 60));
  const fans = Math.round(scout ? rnd(1000, 25000) * (1 + producerTier() * 0.6) : rnd(40, 900));
  return makeRosterCandidate({ name: artistName(genre), genre, talent, fans, look: randomLook(scout ? 1 : 0) });
}
function makeRosterCandidate(o) {
  const s = G.s;
  return {
    id: s.uid++, name: o.name, genre: o.genre, talent: o.talent, fans: o.fans, look: o.look,
    signFee: Math.round((300 + o.fans * 0.3 + o.talent * 40) / 50) * 50,
    salary: Math.round((60 + o.talent * 3 + Math.sqrt(o.fans)) / 10) * 10,
  };
}
// Artistas con los que ya trabajaste y quedaron contentos
function contactCandidates() {
  const s = G.s;
  return Object.values(s.artists)
    .filter(a => a.happy > 0 && !s.roster.some(r => r.name === a.name))
    .map(a => {
      const c = makeRosterCandidate({ name: a.name, genre: a.genre, talent: clamp(40 + a.tier * 10, 0, 95), fans: a.fans, look: a.look });
      c.id = 'c_' + a.name; c.contact = true;
      return c;
    });
}
function signArtist(c) {
  const s = G.s;
  if (!s.label) return 'Primero funda tu sello en la Agencia de Talentos.';
  if (s.roster.length >= rosterCap()) return `Tu sello está lleno (${rosterCap()}). Múdate a una propiedad más grande.`;
  if (s.money < c.signFee) return 'No te alcanza para el bono de firma.';
  s.money -= c.signFee;
  s.roster.push({
    id: s.uid++, name: c.name, genre: c.genre, talent: c.talent, fans: c.fans, look: c.look, salary: c.salary,
    energy: 100, mood: 75, task: 'descanso', prog: 0, producerId: null, songs: 0, contract: 48,
  });
  s.scouts = s.scouts.filter(x => x.id !== c.id);
  s.auditions = s.auditions.filter(x => x.id !== c.id);
  completeGoal('firmar');
  saveGame(); return null;
}
function releaseArtist(id) {
  const s = G.s;
  s.roster = s.roster.filter(a => a.id !== id);
  saveGame();
}

/* ---------- Tareas de los artistas ---------- */
function countTask(t, s = G.s) { return s.roster.filter(a => a.task === t).length; }
function taskError(a, task) {
  const s = G.s;
  if (a.task === task) return null;
  if (task === 'entrenar') {
    if (!hasModule('ensayo')) return 'Necesitas una Sala de ensayo.';
    if (countTask('entrenar') >= 3 * moduleCount('ensayo')) return 'La sala de ensayo está llena.';
  }
  if (task === 'grabar') {
    if (!hasModule('cabina')) return 'Necesitas una Cabina de grabación.';
    if (countTask('grabar') >= 2 * moduleCount('cabina')) return 'La cabina está ocupada.';
    if (!freeProducer()) return 'Necesitas un Productor libre en tu equipo.';
  }
  if (task === 'gira') {
    if (!hasStaff('manager')) return 'Necesitas un Mánager para organizar giras.';
    if (a.energy < 30) return 'Está muy cansado para salir de gira.';
  }
  if (task === 'coproducir' && countTask('coproducir') >= 3) return 'Máximo 3 co-productores a la vez.';
  return null;
}
function setRosterTask(a, task, force) {
  const err = force ? null : taskError(a, task);
  if (err) return err;
  if (a.task === 'grabar' && task !== 'grabar') a.producerId = null;
  if (task === 'grabar') { const p = freeProducer(); a.producerId = p ? p.id : null; }
  a.task = task;
  return null;
}
function fixRosterTasks() {
  const s = G.s;
  for (const a of s.roster) {
    const t = a.task;
    if (t === 'descanso' || t === 'coproducir') continue;
    if (t === 'grabar' && a.producerId && s.staff.some(x => x.id === a.producerId) && hasModule('cabina')) continue;
    if (t === 'entrenar' && hasModule('ensayo')) continue;
    if (t === 'gira' && hasStaff('manager')) continue;
    a.task = 'descanso'; a.producerId = null;
  }
}

// Artistas que te ayudan en la canción actual: los que tienen la tarea
// "Co-producir" y, siempre, el artista de tu sello para quien es la canción.
function coproducers(s = G.s) {
  const rid = s.dev && s.dev.rosterId;
  return s.roster.filter(a => a.task === 'coproducir' || a.id === rid);
}
// Puntos extra por semana que te dan tus co-productores
function coproBonus(genre, s = G.s) {
  return coproducers(s).reduce((sum, a) =>
    sum + (2 + a.talent / 15) * (a.genre === genre ? 1.4 : 1) * (s.flags.gestion ? 1.2 : 1) * (a.energy > 15 ? 1 : 0.5), 0);
}
// Los co-productores también limpian la mezcla (menos ruido)
function coproNoise(s = G.s) { return 1 - Math.min(0.3, coproducers(s).length * 0.1); }

/* ---------- Semana del sello ---------- */
function weeklyLabel() {
  const s = G.s;
  if (s.week % 4 === 0 || !s.candidates.length) refreshCandidates(true);
  if (s.label && (s.week % 6 === 0 || !s.scouts.length)) s.scouts = Array.from({ length: 3 }, () => genRosterCandidate('scout'));
  const eqTier = (s.equip.mic + s.equip.pc + s.equip.monitor) / 3;
  const mgr = s.staff.filter(x => x.type === 'manager');
  const mgrF = mgr.length ? 0.75 + 0.25 * Math.max(...mgr.map(m => m.skill)) : 0;
  const gest = s.flags.gestion ? 1.2 : 1;
  let tourIncome = 0;

  for (const a of [...s.roster]) {
    a.contract--;
    a.mood -= 0.5;
    switch (a.task) {
      case 'descanso':
        a.energy += hasModule('lounge') ? 25 : 18; a.mood += hasModule('lounge') ? 6 : 4; break;
      case 'entrenar':
        a.talent += 3 * (1 - a.talent / 110) * gest; a.energy -= 6; a.mood -= 1; s.money -= 150; break;
      case 'grabar': {
        const p = s.staff.find(x => x.id === a.producerId);
        if (!p) { a.task = 'descanso'; break; }
        a.prog += (0.09 + p.skill * 0.02 + eqTier * 0.01) * (a.energy > 20 ? 1 : 0.4) * gest;
        a.energy -= 5;
        if (a.prog >= 1) { a.prog = 0; releaseLabelSong(a, p); }
        break;
      }
      case 'gira': {
        const inc = (150 + Math.pow(a.fans, 0.65) * 0.8) * (a.talent / 50) * mgrF * gest;
        tourIncome += inc;
        a.fans += (30 + a.fans * 0.02 * (a.talent / 50)) / (1 + a.fans / 2e5);
        a.energy -= 14; a.mood += 2;
        break;
      }
      case 'coproducir':
        if (s.dev) { a.energy -= 2; a.mood += 1; } else { a.energy += 8; a.mood += 1; }
        break;
    }
    a.energy = clamp(a.energy, 0, 100); a.mood = clamp(a.mood, 0, 100); a.talent = clamp(a.talent, 1, 100);
    if (a.energy <= 10 && a.task !== 'descanso') {
      setRosterTask(a, 'descanso', true);
      UI.toast(`${a.name} está agotado y se tomó un descanso.`, 'muted');
    }
    if (a.mood < 15 && !a.unhappy) { a.unhappy = true; UI.queue(() => UI.choice(unhappyEvent(a))); }
    if (a.contract <= 0 && !a.renewing) { a.renewing = true; UI.queue(() => UI.choice(renewEvent(a))); }
  }
  if (tourIncome > 0) {
    s.money += tourIncome;
    UI.toast(`Giras de tus artistas: +${fmtMoney(tourIncome)}`, 'good');
  }

  // El personal también aprende
  for (const st of s.staff) {
    st.xp += 0.25;
    if (st.xp >= st.skill * 8 && st.skill < 5) { st.xp = 0; st.skill++; UI.toast(`${st.name} mejoró como ${STAFF_TYPES[st.type].name} (nivel ${st.skill})`, 'good'); }
  }
}

function releaseLabelSong(a, p) {
  const s = G.s;
  const eqTier = (s.equip.mic + s.equip.pc + s.equip.monitor) / 3;
  const score = Math.round(clamp(1.5 + p.skill * 0.9 + a.talent / 18 + eqTier * 0.35 + (s.flags.gestion ? 0.4 : 0) + rnd(-1, 1), 1, 10) * 10) / 10;
  const good = (COMBOS[a.genre] || { good: [] }).good.filter(t => s.topics.includes(t));
  const topic = good.length && Math.random() < 0.6 ? pick(good) : pick(s.topics);
  const song = {
    id: s.uid++, name: randomSongName(), genre: a.genre, topic, size: 'sencillo',
    artist: a.name, artistTier: null, label: true, rosterId: a.id, producer: p.name,
    score, critics: [], week: s.week,
    base: songStreamsBase(score, SIZES.sencillo, a.fans, a.genre) * 0.8,
    weeks: 0, streams: 0, revenue: 0, last: 0, chart: null, peak: null, active: true,
  };
  s.songs.unshift(song);
  a.songs++;
  a.mood = clamp(a.mood + (score >= 7 ? 12 : score < 5 ? -8 : 2), 0, 100);
  s.prestige += Math.max(0, Math.round((score - 6) * 2));
  p.xp += 2;
  UI.toast(`White Door Records lanzó "${song.name}" de ${a.name} (prod. ${p.name}) — nota ${score.toFixed(1)}`, 'good');
  SFX.coin();
}

function unhappyEvent(a) {
  const s = G.s;
  return {
    title: `${a.name} no está feliz`, icon: 'fans', portrait: a.look,
    text: `${a.name} siente que no lo valoras en el sello y está pensando en irse.`,
    options: [
      { label: `Subirle el salario (+30%)`, run() { a.salary = Math.round(a.salary * 1.3 / 10) * 10; a.mood = 60; a.unhappy = false; return `${a.name} se queda, más motivado.`; } },
      { label: 'Darle una semana libre y hablar', run() { setRosterTask(a, 'descanso', true); a.mood = 40; a.unhappy = false; return 'Hablaron y las cosas mejoraron un poco.'; } },
      { label: 'Dejarlo ir', run() { releaseArtist(a.id); return `${a.name} dejó White Door Records.`; } },
    ],
  };
}
function renewEvent(a) {
  const s = G.s, fee = Math.round(a.salary * 6 / 50) * 50;
  return {
    title: `Contrato de ${a.name}`, icon: 'book', portrait: a.look,
    text: `El contrato de ${a.name} terminó. Pide un bono de ${fmtMoney(fee)} y +15% de salario para renovar por un año.`,
    options: [
      { label: `Renovar (${fmtMoney(fee)})`, disabled: s.money < fee, run() { s.money -= fee; a.salary = Math.round(a.salary * 1.15 / 10) * 10; a.contract = 48; a.renewing = false; a.mood = clamp(a.mood + 15, 0, 100); return `${a.name} renovó con White Door Records.`; } },
      { label: 'No renovar', run() { releaseArtist(a.id); return `${a.name} se despide del sello.`; } },
    ],
  };
}
