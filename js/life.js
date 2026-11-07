'use strict';
/* =========================================================
   WHITE DOOR — Vida del productor (estilo Sims)
   Necesidades, averías, eventos con decisiones y relaciones
   ========================================================= */

const NEED_NAMES = { energia: 'Energía', hambre: 'Hambre', animo: 'Ánimo' };

function addNeeds(o) {
  const s = G.s;
  for (const k of ['energia', 'hambre', 'animo']) if (o[k]) s.needs[k] = clamp(s.needs[k] + o[k], 0, 100);
  if (o.salud) s.salud = clamp(s.salud + o.salud, 0, 100);
}

/* ---------- Cada día ---------- */
function dailyLife() {
  const s = G.s, n = s.needs, L = s.life;
  const asist = hasStaff('asistente');
  const partnerHappy = L.partner && L.partner.love > 50;
  // Ritmo suave: ~2 meses de juego para vaciar una barra llena
  n.energia -= (canWork() ? 1.45 : 1.0) * (asist ? 0.75 : 1) * (s.broken.aire ? 1.4 : 1);
  n.hambre -= 1.5;
  n.animo -= Math.max(0.1, 0.4 + (n.energia < 20 ? 0.3 : 0) + (n.hambre < 20 ? 0.3 : 0) + (s.broken.gotera ? 0.5 : 0)
    - (partnerHappy ? 0.2 : 0) - (hasModule('lounge') ? 0.15 : 0) - (s.items.includes('dec_gato') ? 0.1 : 0));
  for (const k of Object.keys(n)) n[k] = clamp(n[k], 0, 100);
  if (L.inspired > 0) L.inspired = Math.max(0, L.inspired - 0.25);

  if (asist && n.hambre < 30 && s.money >= 20) {
    s.money -= 20; n.hambre = clamp(n.hambre + 60, 0, 100);
    UI.toast('Tu asistente te trajo comida (−$20)', 'good');
  }
  if (L.routine) autoRoutine();

  // Salud
  if (n.energia < 8 || n.hambre < 8 || n.animo < 8) s.salud -= 1.2;
  else s.salud = Math.min(100, s.salud + 0.6);

  // Avisos
  L.warned = L.warned || {};
  for (const k of Object.keys(n)) {
    if (n[k] < 25 && !L.warned[k]) { L.warned[k] = true; UI.toast(`${NEED_NAMES[k]} baja: ${k === 'energia' ? 'necesitas dormir' : k === 'hambre' ? 'necesitas comer' : 'necesitas despejarte'}.`, 'bad'); }
    if (n[k] > 40) L.warned[k] = false;
  }

  // Emergencias
  if (n.hambre <= 0 && s.money >= 40) {
    s.money -= 40; n.hambre = 50; s.salud -= 5;
    UI.toast('Comiste comida rápida de emergencia (−$40, −salud)', 'bad');
  }
  if (n.energia <= 0 && !L.collapsing) { L.collapsing = true; UI.queue(() => collapse()); }
  if (s.salud <= 0 && !L.hospital) { L.hospital = true; UI.queue(() => hospital()); }

  // Reparaciones en curso
  for (const k of Object.keys(s.broken)) {
    const b = s.broken[k];
    if (b.fixDays != null) {
      b.fixDays--;
      if (b.fixDays <= 0) { delete s.broken[k]; UI.toast(`Reparado: ${BREAKABLES[k].name}`, 'good'); }
    }
  }

  if (Math.random() < 0.006) breakdown();
  L.eventCool -= 1 / 7;
  if (L.eventCool <= 0 && Math.random() < 0.035) lifeEvent();
}

/* ---------- Cada semana ---------- */
function weeklyLife() {
  const s = G.s, L = s.life;
  if (L.partner) {
    L.partner.love -= L.partner.stage >= 2 ? 1 : 2;
    if (L.partner.love <= 0) {
      const name = L.partner.name;
      L.partner = null;
      UI.queue(() => UI.choice({
        title: 'Ruptura', icon: 'fans',
        text: `${name} sintió que siempre estabas en el estudio y decidió terminar la relación.`,
        options: [{ label: 'Lo entiendo...', run() { addNeeds({ animo: -30 }); return null; } }],
      }));
    }
  }
  if (L.job > 0) {
    L.job--; s.money += 350; addNeeds({ energia: -8 });
    if (L.job === 0) UI.toast('Terminó tu trabajo de medio tiempo.', 'muted');
  }
  if (L.loan) {
    L.loan.weeks--;
    if (L.loan.weeks <= 0) {
      if (Math.random() < 0.5) { s.money += L.loan.amount * 2; UI.toast(`Tu amigo te devolvió el doble: +${fmtMoney(L.loan.amount * 2)}`, 'good'); }
      else UI.toast('Tu amigo nunca te devolvió el dinero...', 'bad');
      L.loan = null;
    }
  }
  if (s.week % 48 === 20) { const tx = taxEvent(); if (tx) UI.queue(() => UI.choice(tx)); }
}

/* ---------- Rutina automática (opcional, panel Vida) ----------
   Si estás en el estudio come y duerme solo cuando hace falta. */
function autoRoutine() {
  const s = G.s, n = s.needs, L = s.life;
  if (s.loc !== 'studio' || L.autoBusy) return;
  L.autoBusy = true;
  if (n.hambre < 25 && s.money >= 25) { doEat(); UI.toast('Rutina: comiste algo.', 'muted'); }
  if (n.energia < 18) { doSleep(); UI.toast('Rutina: dormiste un rato.', 'muted'); }
  if (n.animo < 22) { doRelax(); UI.toast('Rutina: te tomaste un descanso.', 'muted'); }
  L.autoBusy = false;
}

/* ---------- Acciones en casa ---------- */
function activity(o) {
  const s = G.s;
  if (o.cost && s.money < o.cost) return 'No te alcanza el dinero.';
  s.money -= o.cost || 0;
  passTime(o.days || 0);
  addNeeds(o);
  if (o.inspired) s.life.inspired = Math.max(s.life.inspired, o.inspired);
  return null;
}
function doSleep() {
  const s = G.s, dorm = hasModule('dormitorio');
  passTime(dorm ? 0.35 : 0.6);
  s.needs.energia = dorm ? 100 : 85;
  addNeeds({ animo: dorm ? 8 : 2 });
  s.life.collapsing = false;
  return dorm ? 'Dormiste como un bebé en tu cama.' : 'Dormiste en el sofá del estudio.';
}
function doEat() {
  const lounge = hasModule('lounge');
  const err = activity({ cost: lounge ? 15 : 20, days: 0.1, hambre: lounge ? 85 : 60, animo: lounge ? 6 : 2 });
  return err || (lounge ? 'Cocinaste algo delicioso en el lounge.' : 'Comiste algo de la nevera.');
}
function doRelax() {
  const s = G.s;
  const bonus = (s.life.personal.includes('consola') ? 10 : 0) + (s.items.includes('dec_arcade') ? 8 : 0) +
    (hasModule('lounge') ? 7 : 0) + (s.items.includes('dec_gato') ? 5 : 0);
  activity({ days: 0.3, animo: 15 + bonus, energia: 3 });
  return bonus >= 15 ? 'Te relajaste a lo grande. ¡Qué buen descanso!' : 'Te relajaste un rato.';
}

function collapse() {
  UI.choice({
    title: 'Te desmayaste', icon: 'book',
    text: 'Llevabas demasiado tiempo sin dormir y te quedaste dormido sobre el teclado. Perdiste un día y medio.',
    options: [{ label: 'Despertar', run() { passTime(1.5); G.s.needs.energia = 60; addNeeds({ animo: -15 }); G.s.life.collapsing = false; return null; } }],
  });
}
function hospital() {
  const s = G.s, cost = Math.round(500 + Math.min(2000, Math.max(0, s.money) * 0.1));
  UI.choice({
    title: 'Hospital', icon: 'fans',
    text: `Descuidaste tu salud y terminaste en el hospital. Pasarás 5 días internado y la cuenta es de ${fmtMoney(cost)}.`,
    options: [{ label: 'Recuperarme', run() {
      s.money -= cost; passTime(5);
      s.needs = { energia: 70, hambre: 70, animo: 50 }; s.salud = 70; s.life.hospital = false;
      return 'Saliste del hospital. Cuídate más.';
    } }],
  });
}

/* =========================================================
   AVERÍAS
   ========================================================= */
function breakdown(forceId) {
  const s = G.s;
  const opts = Object.keys(BREAKABLES).filter(k => !s.broken[k] && (!BREAKABLES[k].room || s.room >= BREAKABLES[k].room));
  if (!opts.length) return;
  const id = forceId || pick(opts);
  s.broken[id] = { since: s.day };
  SFX.bad();
  if (hasStaff('ingeniero')) {
    s.broken[id].fixDays = 1;
    UI.toast(`Se dañó: ${BREAKABLES[id].name}. Tu ingeniero ya lo está arreglando.`, 'bad');
    return;
  }
  UI.queue(() => UI.choice(breakdownEvent(id)));
}
function repairCost(id) { const c = BREAKABLES[id].cost; return c[G.s.room] || c[c.length - 1]; }
function breakdownEvent(id) {
  const s = G.s, b = BREAKABLES[id], cost = repairCost(id);
  const intro = {
    pc: '¡Pantallazo azul! El computador no enciende.',
    mic: 'Una chispa y... el micrófono dejó de sonar.',
    monitor: 'Los monitores hacen un zumbido horrible.',
    luz: 'Los enchufes chisporrotean y las luces parpadean.',
    gotera: '¡Una gotera! Cae agua del techo junto al escritorio.',
    aire: 'El aire acondicionado echa humo y se apagó.',
  }[id];
  const chance = clamp(0.4 + s.skills.manitas * 0.1, 0, 0.95);
  return {
    title: `Avería: ${b.name}`, icon: 'gear',
    text: `${intro} ${b.effect}`,
    options: [
      { label: `Llamar técnico (${fmtMoney(cost)})`, desc: 'Lo deja como nuevo en 2 días.', disabled: s.money < cost,
        run() { if (!s.broken[id]) return null; s.money -= cost; s.broken[id].fixDays = 2; return 'El técnico viene en camino.'; } },
      { label: 'Arreglarlo yo mismo', desc: `Te toma 1 día · ${Math.round(chance * 100)}% de éxito (sube con Manitas)`,
        run() {
          if (!s.broken[id]) return null;
          passTime(1); addNeeds({ energia: -10 });
          if (Math.random() < chance) { delete s.broken[id]; gainXP(10); return '¡Lo arreglaste tú mismo! +10 XP'; }
          const parts = Math.round(cost * 0.2);
          s.money -= parts; addNeeds({ animo: -10 });
          return `No funcionó y gastaste ${fmtMoney(parts)} en repuestos. Sigue dañado.`;
        } },
      { label: 'Dejarlo así por ahora', desc: 'Puedes repararlo luego desde el panel Vida.', run() { return null; } },
    ],
  };
}

/* =========================================================
   EVENTOS DE VIDA (decisiones)
   ========================================================= */
function newPartner() {
  return { name: pick(STAFF_NAMES.first), love: 40, stage: 0, look: randomLook(0) };
}
const STAGES = ['Saliendo', 'Novios', 'Viviendo juntos', 'Casados'];

const LIFE_EVENTS = [
  {
    id: 'fiesta', cond: () => true,
    make: s => ({
      title: 'Fiesta esta noche', icon: 'star',
      text: 'Un amigo te invita a una fiesta. Mañana tenías pensado trabajar temprano...',
      options: [
        { label: 'Ir a la fiesta', desc: '+Ánimo, −Energía, puedes conocer gente', run() {
          activity({ days: 0.5, animo: 30, energia: -25 });
          if (!s.life.partner && Math.random() < 0.35) { s.life.partner = newPartner(); return `Conociste a ${s.life.partner.name}. ¡Hay química! Ahora están saliendo.`; }
          if (Math.random() < 0.3) { addOffer(); return 'Hiciste contactos: un artista te escribió.'; }
          return '¡Qué noche!';
        } },
        { label: 'Quedarte trabajando', desc: '−Ánimo, +XP', run() { addNeeds({ animo: -8 }); gainXP(15); return 'Te concentraste en tu música. +15 XP'; } },
      ],
    }),
  },
  {
    id: 'mama', cond: () => true,
    make: s => ({
      title: 'Cumpleaños de mamá', icon: 'fans',
      text: 'Hoy es el cumpleaños de tu mamá. Vive al otro lado de la ciudad.',
      options: [
        { label: 'Visitarla (2 días, $100)', desc: '+Ánimo grande', disabled: s.money < 100, run() { activity({ cost: 100, days: 2, animo: 30, hambre: 40 }); return 'Pasaste un día hermoso en familia.'; } },
        { label: 'Enviarle un regalo ($250)', desc: '+Ánimo', disabled: s.money < 250, run() { activity({ cost: 250, animo: 8 }); return 'Le encantó el regalo.'; } },
        { label: 'Olvidarlo...', desc: '−Ánimo', run() { addNeeds({ animo: -20 }); return 'Te sientes fatal por haberlo olvidado.'; } },
      ],
    }),
  },
  {
    id: 'fan', cond: s => s.fans > 2000,
    make: s => ({
      title: '¡Un fan te reconoce!', icon: 'fans',
      text: 'Alguien en la calle grita tu nombre y te pide una foto.',
      options: [
        { label: 'Tomarte la foto', desc: '+Fans, +Ánimo', run() { const f = Math.round(150 + s.fans * 0.01); s.fans += f; addNeeds({ animo: 10 }); return `La foto se volvió viral: +${fmtNum(f)} fans.`; } },
        { label: 'Saludar rápido', run() { addNeeds({ animo: 3 }); return null; } },
      ],
    }),
  },
  {
    id: 'trabajo', cond: s => s.money < 4000 && !s.life.job && s.week < 60,
    make: s => ({
      title: 'Oferta de trabajo estable', icon: 'coin',
      text: 'Una tienda te ofrece medio tiempo por 12 semanas: $350 a la semana, pero te cansarás más.',
      options: [
        { label: 'Aceptar', desc: '+$350/sem, −Energía', run() { s.life.job = 12; return 'Empiezas el lunes. ¡A rendir el doble!'; } },
        { label: 'Rechazar y seguir tu sueño', desc: '+Ánimo', run() { addNeeds({ animo: 8 }); return null; } },
      ],
    }),
  },
  {
    id: 'cita', cond: s => s.life.partner && s.life.partner.stage < 3,
    make: s => {
      const p = s.life.partner;
      return {
        title: `Plan con ${p.name}`, icon: 'fans',
        text: `${p.name} quiere pasar tiempo contigo esta semana.`,
        options: [
          { label: 'Cena elegante ($200)', desc: '+Amor, +Ánimo', disabled: s.money < 200, run() { activity({ cost: 200, days: 0.3, animo: 12, hambre: 50 }); p.love = clamp(p.love + 20, 0, 100); return 'Una noche perfecta.'; } },
          { label: 'Paseo por el parque', desc: '+Amor', run() { activity({ days: 0.3, animo: 8 }); p.love = clamp(p.love + 10, 0, 100); return 'Caminaron y hablaron por horas.'; } },
          { label: 'Cancelar: tienes trabajo', desc: '−Amor', run() { p.love = clamp(p.love - 15, 0, 100); return `${p.name} se quedó triste.`; } },
        ],
      };
    },
  },
  {
    id: 'formalizar', cond: s => s.life.partner && s.life.partner.stage === 0 && s.life.partner.love >= 65,
    make: s => ({
      title: '¿Algo serio?', icon: 'fans',
      text: `Llevas un tiempo saliendo con ${s.life.partner.name}. ¿Le pides que sea tu pareja?`,
      options: [
        { label: '¡Sí!', run() { s.life.partner.stage = 1; s.life.partner.love += 10; completeGoal('pareja'); addNeeds({ animo: 20 }); return '¡Ahora son novios!'; } },
        { label: 'Todavía no', run() { s.life.partner.love -= 5; return null; } },
      ],
    }),
  },
  {
    id: 'convivir', cond: s => s.life.partner && s.life.partner.stage === 1 && s.life.partner.love >= 75,
    make: s => ({
      title: 'Vivir juntos', icon: 'house',
      text: `${s.life.partner.name} te propone que vivan juntos.`,
      options: [
        { label: 'Mudarnos juntos', desc: 'Tu ánimo baja más lento', run() { s.life.partner.stage = 2; addNeeds({ animo: 20 }); return '¡Nuevo hogar, nueva etapa!'; } },
        { label: 'Prefiero esperar', run() { s.life.partner.love -= 10; return null; } },
      ],
    }),
  },
  {
    id: 'boda', cond: s => s.life.partner && s.life.partner.stage === 2 && s.life.partner.love >= 85,
    make: s => ({
      title: '¿Propuesta de matrimonio?', icon: 'gold',
      text: `Llevas años con ${s.life.partner.name}. Crees que es el momento. La boda costaría $8.000.`,
      options: [
        { label: 'Proponer matrimonio ($8.000)', disabled: s.money < 8000, run() { s.money -= 8000; s.life.partner.stage = 3; s.life.partner.love = 100; s.needs.animo = 100; completeGoal('boda'); passTime(3); return '¡Se casaron! La mejor fiesta de la historia.'; } },
        { label: 'Más adelante', run() { return null; } },
      ],
    }),
  },
  {
    id: 'bloqueo', cond: s => !!s.dev,
    make: s => ({
      title: 'Bloqueo creativo', icon: 'note',
      text: `No te sale nada nuevo para "${s.dev.name}". La pantalla en blanco te mira.`,
      options: [
        { label: 'Salir a caminar', desc: 'Pierdes medio día, ganas inspiración', run() { activity({ days: 0.5, animo: 10, inspired: 7 }); return 'Volviste con ideas frescas. ¡Inspirado!'; } },
        { label: 'Forzarte a seguir', desc: 'Más ruido en la mezcla', run() { s.dev.noise += 10; addNeeds({ animo: -5 }); return 'Sacaste algo... pero suena forzado.'; } },
      ],
    }),
  },
  {
    id: 'vecino', cond: s => s.room <= 1,
    make: s => ({
      title: 'El vecino se queja', icon: 'house',
      text: 'Tu vecino golpea la pared: dice que tu música no lo deja dormir.',
      options: [
        { label: 'Disculparte y bajar el volumen', desc: '−Ánimo', run() { addNeeds({ animo: -6 }); return null; } },
        { label: 'Pagar la multa ($300)', disabled: s.money < 300, run() { s.money -= 300; return null; } },
        ...(!s.items.includes('dec_paneles') ? [{ label: `Comprar paneles acústicos (${fmtMoney(DECOR_BY_ID.dec_paneles.price)})`, disabled: s.money < DECOR_BY_ID.dec_paneles.price, run() { buyItem('dec_paneles'); return '¡Problema resuelto y mezclas más limpias!'; } }] : []),
      ],
    }),
  },
  {
    id: 'concurso', cond: () => true,
    make: s => {
      const chance = clamp(0.25 + (s.skills.composicion + s.skills.produccion) * 0.04 + s.equip.pc * 0.04, 0.1, 0.85);
      const prize = 1500 * (1 + s.room);
      return {
        title: 'Concurso de beats', icon: 'star',
        text: `Hay un concurso de beats este fin de semana. Premio: ${fmtMoney(prize)}.`,
        options: [
          { label: 'Participar (2 días)', desc: `${Math.round(chance * 100)}% de ganar`, run() {
            activity({ days: 2, energia: -15 });
            if (Math.random() < chance) { s.money += prize; s.prestige += 15; addNeeds({ animo: 20 }); return `¡GANASTE! +${fmtMoney(prize)} y +15 prestigio.`; }
            addNeeds({ animo: -5 }); gainXP(20); return 'No ganaste, pero aprendiste mucho. +20 XP';
          } },
          { label: 'No esta vez', run() { return null; } },
        ],
      };
    },
  },
  {
    id: 'gato', cond: s => s.items.includes('dec_gato'),
    make: s => ({
      title: 'Beat está enfermo', icon: 'cat',
      text: 'Tu gato no quiere comer y duerme todo el día.',
      options: [
        { label: 'Llevarlo al veterinario ($300)', disabled: s.money < 300, run() { s.money -= 300; addNeeds({ animo: 5 }); return 'Beat ya está mejor y ronronea en tu regazo.'; } },
        { label: 'Esperar a ver si mejora', run() {
          if (Math.random() < 0.5) return 'Por suerte se recuperó solo.';
          s.items = s.items.filter(i => i !== 'dec_gato'); addNeeds({ animo: -35 });
          return 'Beat se fue al cielo de los gatos... Te sientes destrozado.';
        } },
      ],
    }),
  },
  {
    id: 'podcast', cond: s => s.prestige >= 100,
    make: s => ({
      title: 'Invitación a un podcast', icon: 'mic',
      text: 'Un podcast musical muy escuchado quiere entrevistarte.',
      options: [
        { label: 'Ir a la entrevista', desc: '+Fans, −Energía', run() { const f = Math.round(300 + s.fans * 0.03); activity({ days: 0.5, energia: -10, animo: 8 }); s.fans += f; s.prestige += 5; return `+${fmtNum(f)} fans y +5 prestigio.`; } },
        { label: 'No tengo tiempo', run() { return null; } },
      ],
    }),
  },
  {
    id: 'prestamo', cond: s => s.money > 3000 && !s.life.loan,
    make: s => ({
      title: 'Un amigo necesita plata', icon: 'coin',
      text: 'Tu amigo de la infancia te pide $1.000 para un negocio. Promete devolverte el doble.',
      options: [
        { label: 'Prestarle $1.000', desc: '¿Confías en él?', run() { s.money -= 1000; s.life.loan = { weeks: 8, amount: 1000 }; return 'Ojalá cumpla...'; } },
        { label: 'No puedo', run() { addNeeds({ animo: -3 }); return null; } },
      ],
    }),
  },
];

function lifeEvent() {
  const s = G.s;
  const pool = LIFE_EVENTS.filter(e => e.cond(s) && e.id !== s.life.lastEvent);
  if (!pool.length) return;
  const e = pick(pool);
  s.life.lastEvent = e.id;
  s.life.eventCool = rnd(5, 9);
  UI.queue(() => UI.choice(e.make(s)));
}

// taxEvent() (la DIAN) vive ahora en js/empire.js

/* ---------- Premios Pixel (una vez al año) ---------- */
function pixelAwards() {
  const s = G.s;
  const year = s.songs.filter(x => x.week > s.week - 48);
  const best = year.reduce((b, x) => (!b || x.score > b.score ? x : b), null);
  if (!best || best.score < 7.5) { UI.toast('Premios Pixel: este año no tuviste nominaciones.', 'muted'); return; }
  const chance = clamp((best.score - 7.5) / 2.5 * 0.7 + s.prestige / 5000 * 0.3, 0.1, 0.95);
  UI.queue(() => UI.choice({
    title: 'Premios Pixel', icon: 'gold',
    text: `"${best.name}" está nominada a Mejor Producción del Año. ¿Vas a la ceremonia?`,
    options: [
      { label: 'Ir a la ceremonia', desc: `${Math.round(chance * 100)}% de ganar`, run() {
        activity({ days: 1, energia: -10, animo: 10 });
        const win = Math.random() < chance;
        const rivals = [artistName(), artistName()];
        let msg = 'No ganaste esta vez, pero la nominación ya es un honor.';
        if (win) {
          s.life.awards.push({ year: Math.floor(s.week / 48) + 1, song: best.name });
          s.prestige += 60; s.fans += Math.round(s.fans * 0.05 + 500);
          msg = `¡GANASTE el Premio Pixel por "${best.name}"! +60 prestigio.`;
        } else addNeeds({ animo: -5 });
        if (typeof Cutscene !== 'undefined') Cutscene.play('awards', { win, song: best.name, rivals }).then(() => { if (win) completeGoal('premio'); });
        else if (win) completeGoal('premio');
        return msg;
      } },
      { label: 'Quedarte produciendo', run() { return null; } },
    ],
  }));
}
