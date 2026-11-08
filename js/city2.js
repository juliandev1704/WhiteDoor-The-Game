'use strict';
/* =========================================================
   WHITE DOOR — Tienda 24/7 (efectos buenos y malos), seguridad
   del estudio (robos, hackeos, estafas), Bolsa Pixel y negocios,
   festivales y el Chocheiner
   ========================================================= */

/* ---------- Sprites de la tienda y de Stiwai ---------- */
Object.assign(ICONS, {
  cafe: ['....w..w....', '...w..w.....', '....w..w....', '............', '.wwwwwwww...', '.wmmmmmmwww.', '.wmmmmmmw.w.', '.wwwwwwwwww.', '.wwwwwwww...', '..wwwwww....', '.gggggggggg.', '............'],
  iso: ['....gggg....', '....kkkk....', '...bbbbbb...', '...bwbbbb...', '...bwbbbb...', '...bbbbbb...', '...wwwwww...', '...wbbbbw...', '...wwwwww...', '...bwbbbb...', '...bbbbbb...', '....bbbb....'],
  energy: ['...gggggg...', '..gddddddg..', '..kkkkkkkk..', '..klllllek..', '..kllylllk..', '..klyyllek..', '..klyyyyek..', '..kllyylek..', '..kllyllek..', '..klllllek..', '..kkkkkkkk..', '...gggggg...'],
  vitaminas: ['...wwwwww...', '...wwwwww...', '...gggggg...', '..oooooooo..', '..owwwwwwo..', '..owrrrrwo..', '..owwwwwwo..', '..oooooooo..', '..oooooooo..', '..oooooooo..', '...oooooo...', '............'],
  cerveza: ['.....gg.....', '.....mm.....', '.....mm.....', '....mmmm....', '...mmmmmm...', '...mwwwwm...', '...mwyywm...', '...mwwwwm...', '...mmmmmm...', '...mmmmmm...', '...mmmmmm...', '....mmmm....'],
  aguardiente: ['.....rr.....', '.....rr.....', '.....ww.....', '....wggw....', '...wggggw...', '...wbbbbw...', '...wbrrbw...', '...wbbbbw...', '...wggggw...', '...wggggw...', '...wggggw...', '....wwww....'],
  whisky: ['....kkkk....', '.....oo.....', '.....oo.....', '...oooooo...', '..oooooooo..', '..okkkkkko..', '..okyyyyko..', '..okkkkkko..', '..oooooooo..', '..oooooooo..', '..oooooooo..', '..mmmmmmmm..'],
  cigarrillos: ['...w.w.w....', '...o.o.o....', '..wwwwwwww..', '..wwwwwwww..', '..rrrrrrrr..', '..rwwwwwwr..', '..rwrrrrwr..', '..rwwwwwwr..', '..rrrrrrrr..', '..rrrrrrrr..', '..rrrrrrrr..', '............'],
  vape: ['.......ww...', '......w..w..', '.....w......', '.....kk.....', '....kddk....', '....kvvk....', '....kvvk....', '....kvpk....', '....kvvk....', '....kvvk....', '....kddk....', '.....kk.....'],
  chicle: ['............', '............', '.wwwwwwwwww.', '.wllllllllw.', '.wlwwwwwwlw.', '.wlwllllwlw.', '.wlwwwwwwlw.', '.wllllllllw.', '.wwwwwwwwww.', '............', '............', '............'],
  pouch: ['............', '............', '..gggggggg..', '.gbbbbbbbbg.', '.gbwwwwwwbg.', '.gbbbbbbbbg.', '.gggggggggg.', '.gddddddddg.', '.gddddddddg.', '..gggggggg..', '............', '............'],
  stiwai: ['...kkkkkk...', '..kkkkkkkk..', '.oooooooooo.', '.onnnnnnnno.', '.oonnnnnnoo.', '.kkddddddkk.', '.kddkddkddk.', 'kkkddddddkkk', 'kkkkkkkkkkkk', 'kkkkkkkkkkkk', '.kkkk..kkkk.', '.dddd..dddd.'],
});

function fxState(s = G.s) {
  const L = s.life;
  if (!L.fx) L.fx = [];
  if (typeof L.nic !== 'number') L.nic = 0;
  if (typeof L.lastSmoke !== 'number') L.lastSmoke = -99;
  if (!L.drinksDay) L.drinksDay = { day: -1, n: 0 };
  if (!L.security) L.security = [];
  return L.fx;
}
function hasFx(id, s = G.s) { return fxState(s).some(f => f.id === id && f.until > s.day); }
function addFx(id, days, s = G.s) {
  const fx = fxState(s), f = fx.find(x => x.id === id && x.until > s.day);
  if (f) f.until += days; else fx.push({ id, until: s.day + days });
}
const FX_INFO = {
  wired:  { name: 'Energía a tope', good: true },
  crash:  { name: 'Bajón de energía', good: false },
  resaca: { name: 'Resaca', good: false },
  vape:   { name: 'Vapeando', good: false },
  vit:    { name: 'Vitaminas', good: true },
  ansia:  { name: 'Ansiedad por nicotina', good: false },
};

/* ---------- Tienda 24/7 ---------- */
const STORE247 = [
  { id: 'cafe', name: 'Café doble', price: 6, icon: 'cafe',
    desc: '+20 energía.', side: 'Sin efectos secundarios.',
    use(s, n) { addNeeds({ energia: 20 }); } },
  { id: 'iso', name: 'Bebida hidratante', price: 9, icon: 'iso',
    desc: '+12 energía, +4 salud.', side: 'Sin efectos secundarios.',
    use() { addNeeds({ energia: 12, salud: 4 }); } },
  { id: 'energy', name: 'Energizante', price: 14, icon: 'energy',
    desc: 'Energía ilimitada por 1 semana (+15% productividad).', side: 'Después, 2 semanas de bajón: te cansas mucho más rápido y rindes menos. Tomar más alarga el bajón y baja tu salud.',
    use(s) { const again = hasFx('wired') || hasFx('crash'); addFx('wired', 7); addFx('crash', again ? 7 : 21); if (again) addNeeds({ salud: -6 }); s.needs.energia = 100; } },
  { id: 'vitaminas', name: 'Vitaminas', price: 35, icon: 'vitaminas',
    desc: '+15 salud y recuperas salud más rápido por 2 semanas.', side: 'Sin efectos secundarios.',
    use() { addNeeds({ salud: 15 }); addFx('vit', 14); } },
  { id: 'cerveza', name: 'Six-pack de cerveza', price: 20, icon: 'cerveza',
    desc: '+18 ánimo.', side: '−8 energía. Si tomas 2 veces el mismo día, mañana amaneces con resaca.',
    use(s) { addNeeds({ animo: 18, energia: -8 }); drink(s, 1); } },
  { id: 'aguardiente', name: 'Botella de aguardiente', price: 40, icon: 'aguardiente',
    desc: '+35 ánimo y un rato de inspiración.', side: 'Resaca de 2 días: −15 energía y rindes 40% menos.',
    use(s) { addNeeds({ animo: 35 }); s.life.inspired = Math.max(s.life.inspired, 6); drink(s, 2); addFx('resaca', 2); } },
  { id: 'whisky', name: 'Whisky premium', price: 260, icon: 'whisky',
    desc: '+40 ánimo. Lo compartes con tus artistas: +2 prestigio.', side: 'Resaca de 1 día.',
    use(s) { addNeeds({ animo: 40 }); s.prestige += 2; drink(s, 2); addFx('resaca', 1); } },
  { id: 'cigarrillos', name: 'Cajetilla de cigarrillos', price: 14, icon: 'cigarrillos',
    desc: '+12 ánimo al momento.', side: '−3 salud y crea dependencia: si fumas seguido y paras, te da ansiedad (−ánimo cada día).',
    use(s) { addNeeds({ animo: 12, salud: -3 }); useNicotine(s, 1); } },
  { id: 'vape', name: 'Vape', price: 70, icon: 'vape',
    desc: '+10 ánimo y +ánimo cada día por 2 semanas.', side: 'Pierdes salud cada día que vapeas y crea más dependencia que el cigarrillo.',
    use(s) { addNeeds({ animo: 10 }); addFx('vape', 14); useNicotine(s, 2); } },
  { id: 'velos', name: 'Velos (bolsitas de nicotina)', price: 22, icon: 'pouch',
    desc: '+8 ánimo y +5 energía, sin humo.', side: 'Menos daño que fumar (−1 salud), pero igual crean dependencia y ansiedad si paras.',
    use(s) { addNeeds({ animo: 8, energia: 5, salud: -1 }); useNicotine(s, 1); } },
  { id: 'chicle', name: 'Chicles de nicotina', price: 25, icon: 'chicle',
    desc: 'Bajan tu dependencia a la nicotina y calman la ansiedad.', side: 'Sin efectos secundarios.',
    use(s) { s.life.nic = Math.max(0, s.life.nic - 3); s.life.lastSmoke = s.day; } },
];
function drink(s, n) {
  const L = s.life; fxState(s);
  if (L.drinksDay.day !== s.day) L.drinksDay = { day: s.day, n: 0 };
  L.drinksDay.n += n;
  if (L.drinksDay.n >= 2 && !hasFx('resaca')) addFx('resaca', 1);
}
function useNicotine(s, n) { const L = s.life; fxState(s); L.nic = Math.min(20, L.nic + n); L.lastSmoke = s.day; }

/* ---------- Seguridad del estudio ---------- */
const SECURITY = [
  { id: 'alarma', name: 'Alarma con cámaras', price: 3500, icon: 'gear', desc: 'Los ladrones casi nunca se atreven a entrar a tu estudio (−80% robos).' },
  { id: 'firewall', name: 'Firewall y copias de seguridad', price: 2500, icon: 'pc', desc: 'Protege tus canciones de hackers (−85% filtraciones).' },
  { id: 'caja', name: 'Caja fuerte', price: 1800, icon: 'coin', desc: 'Si te roban, solo se llevan la mitad del efectivo.' },
];
function hasSec(id, s = G.s) { return fxState(s) && s.life.security.includes(id); }

function studioRobbery() {
  const s = G.s;
  if (hasSec('vigilante') && Math.random() < 0.7) {
    s.life.blocked = (s.life.blocked || 0) + 1;
    UI.toast('¡Tu vigilante atrapó a unos ladrones entrando al estudio! No se llevaron nada.', 'good');
    return;
  }
  const cats = Object.keys(EQUIP).filter(c => s.equip[c] > 0);
  let cash = Math.min(25000, Math.round(Math.max(0, s.money) * 0.15));
  if (hasSec('caja')) cash = Math.round(cash / 2);
  const cat = cats.length && Math.random() < 0.5 ? pick(cats) : null;
  s.money -= cash;
  const lostName = cat ? EQUIP[cat][s.equip[cat]].name : null;
  if (cat) s.equip[cat]--;
  const back = () => { s.money += cash; if (cat) s.equip[cat]++; };
  if (hasSec('seguro')) {
    const refund = Math.round(cash * 0.75);
    s.money += refund; if (cat) s.equip[cat]++;
    UI.queue(() => UI.choice({ title: '¡Robaron el estudio!', icon: 'door',
      text: `Forzaron la puerta blanca y se llevaron ${fmtMoney(cash)}${lostName ? ` y tu ${lostName}` : ''}. Tu seguro te devolvió ${fmtMoney(refund)}${lostName ? ' y repuso el equipo' : ''}.`,
      options: [{ label: 'Menos mal que tenía seguro', run() { addNeeds({ animo: -3 }); return null; } }] }));
    return;
  }
  UI.queue(() => UI.choice({
    title: '¡Robaron el estudio!', icon: 'door',
    text: `Llegaste y la puerta blanca estaba forzada. Se llevaron ${fmtMoney(cash)} en efectivo${lostName ? ` y tu ${lostName}` : ''}.${hasSec('alarma') ? '' : ' Una alarma lo habría evitado.'}`,
    options: [
      { label: 'Denunciar a la policía', desc: '30% de recuperar todo', run() { if (Math.random() < 0.3) { back(); return '¡La policía atrapó a los ladrones y te devolvió todo!'; } return 'Hiciste la denuncia, pero no apareció nada.'; } },
      { label: 'Contratar un investigador ($1.500)', desc: '65% de recuperar todo', disabled: s.money < 1500, run() { s.money -= 1500; if (Math.random() < 0.65) { back(); return 'El investigador encontró tus cosas en una casa de empeño.'; } return 'El investigador no encontró nada.'; } },
      { label: 'Dejarlo así', desc: 'A seguir adelante', run() { addNeeds({ animo: -10 }); return null; } },
    ],
  }));
}
function songLeak() {
  const s = G.s, d = s.dev;
  const fixCost = round50(800 + s.fans * 0.01);
  UI.queue(() => UI.choice({
    title: 'Hackearon tu computador', icon: 'pc',
    text: `Alguien entró a tu computador y subió "${d.name}" a internet antes de tiempo. La canción está circulando sin terminar.`,
    options: [
      { label: `Pagar a un experto (${fmtMoney(fixCost)})`, desc: '70% de bajarla de todas partes', disabled: s.money < fixCost, run() { s.money -= fixCost; if (Math.random() < 0.7) return 'El experto la borró de todas las páginas. Nadie la alcanzó a escuchar.'; d.leaked = true; return 'Llegó tarde: la canción ya está en todas partes.'; } },
      { label: 'Aprovechar el ruido', desc: 'Ganas fans ya, pero al lanzarla tendrá 25% menos reproducciones', run() { d.leaked = true; const f = Math.round(30 + s.fans * 0.03); s.fans += f; return `La filtración generó curiosidad: +${fmtNum(f)} fans.`; } },
    ],
  }));
}
const SCAMS = [
  s => {
    const fee = round50(2000 + s.money * 0.08), real = Math.random() < 0.2;
    return {
      title: 'Una colaboración "imperdible"', icon: 'mail',
      text: `Un supuesto productor de Miami te escribe: puede conseguirte una colaboración con una estrella si le pagas ${fmtMoney(fee)} por adelantado.`,
      options: [
        { label: `Pagar ${fmtMoney(fee)}`, desc: 'Puede ser tu gran oportunidad... o no', run() { s.money -= fee; if (real) { s.fans += 2000 + s.fans * 0.1; s.prestige += 15; return '¡Era real! La colaboración te dio fans y prestigio.'; } return 'El número dejó de existir. Te estafaron.'; } },
        { label: 'Investigarlo primero ($200)', desc: 'Averiguas si es real', run() { s.money -= 200; return real ? 'Es real, pero mientras investigabas se la dieron a otro productor.' : 'Era una estafa: la foto de perfil era de un banco de imágenes. Te salvaste.'; } },
        { label: 'Ignorarlo', run() { return null; } },
      ],
    };
  },
  s => ({
    title: 'Mensaje de texto', icon: 'mail',
    text: '"¡Felicitaciones! Ganaste un micrófono de estudio. Solo paga $150 del envío en este enlace."',
    options: [
      { label: 'Pagar $150', run() { s.money -= 150; return 'El micrófono nunca llegó. Era una estafa.'; } },
      { label: 'Borrar el mensaje', run() { return 'Bien hecho: nadie regala micrófonos por mensaje.'; } },
    ],
  }),
  s => {
    const amt = round50(Math.min(20000, 1000 + s.money * 0.2));
    return {
      title: 'Inversión "garantizada"', icon: 'coin',
      text: `Un conocido del club te ofrece meter ${fmtMoney(amt)} en un negocio que "paga el 50% cada semana, garantizado".`,
      options: [
        { label: `Meter ${fmtMoney(amt)}`, desc: 'Nadie garantiza 50% semanal...', run() { s.money -= amt; if (Math.random() < 0.15) { s.money += amt * 2; return 'Increíble: te devolvió el doble antes de desaparecer.'; } return 'A la segunda semana el "negocio" desapareció con tu plata.'; } },
        { label: 'No, gracias', run() { return 'Si suena demasiado bueno para ser cierto, probablemente no lo es.'; } },
      ],
    };
  },
  s => {
    const fee = round50(500 + s.prestige * 3);
    return {
      title: 'Contrato con letra pequeña', icon: 'book',
      text: `Una "disquera internacional" quiere distribuir tu música, pero pide ${fmtMoney(fee)} de "derechos de inscripción".`,
      options: [
        { label: `Pagar ${fmtMoney(fee)}`, run() { s.money -= fee; return 'La disquera no existía. Perdiste el dinero.'; } },
        { label: 'Pedir que lo revise un abogado ($100)', run() { s.money -= 100; return 'El abogado confirmó que era una estafa. Las disqueras serias no cobran por inscribirte.'; } },
        { label: 'Rechazar', run() { return null; } },
      ],
    };
  },
];

/* ---------- Bolsa Pixel y negocios ---------- */
const STOCKS = [
  { id: 'onda',  name: 'OndaStream',      desc: 'Plataforma de streaming',  start: 50,  vol: 0.08, drift: 0.004 },
  { id: 'vinil', name: 'Vinilos Andinos', desc: 'Fábrica de vinilos',       start: 20,  vol: 0.05, drift: 0.002 },
  { id: 'pxa',   name: 'Pixel Audio Co.', desc: 'Equipos de audio',          start: 120, vol: 0.06, drift: 0.003 },
  { id: 'neon',  name: 'Neón Eventos',    desc: 'Conciertos y festivales',   start: 8,   vol: 0.14, drift: 0.002 },
];
const BUSINESSES = [
  { id: 'foodtruck', name: 'Food truck',          price: 15000,  base: 320,  icon: 'coin',   desc: 'Hamburguesas a la salida del club.' },
  { id: 'discos',    name: 'Tienda de discos',    price: 40000,  base: 760,  icon: 'vinyl',  desc: 'Vinilos y casetes para coleccionistas.' },
  { id: 'karaoke',   name: 'Bar karaoke',         price: 90000,  base: 1600, icon: 'mic',    desc: 'Gana más mientras más fans tengas.', fans: true },
  { id: 'escuela',   name: 'Escuela de música',   price: 180000, base: 3000, icon: 'book',   desc: 'Clases para la próxima generación.' },
  { id: 'merch',     name: 'Fábrica de merch',    price: 60000,  base: 0,    icon: 'shirt',  desc: 'Produce tu merch sola cada semana según la demanda, a $5 c/u. Ya no tienes que pedirlo a mano.', auto: true },
  { id: 'sala',      name: 'Sala de conciertos',  price: 650000, base: 9500, icon: 'speaker', desc: 'Tu propio escenario. Gana más con más fans.', fans: true },
];
function hasBiz(id, s = G.s) { return invState(s).biz.includes(id); }

// Pestaña Negocios (en Trabajos)
function bizHTML(s) {
  const I = invState(s);
  return '<p class="muted">Los compras una vez y te dejan ingresos cada semana.</p><div class="grid">' + BUSINESSES.map(b => {
    const own = I.biz.includes(b.id);
    const info = b.auto ? `Fabrica ~${fmtNum(Math.ceil(merchDemand(s) * 1.1))} unidades/sem${s.fans < MERCH.minFans ? ` (desde ${fmtNum(MERCH.minFans)} fans)` : ''}` : `~${fmtMoney(b.base)}/semana (varía cada semana)`;
    return `<div class="card ${own ? 'owned' : ''}">${iconImg(b.icon)}<div class="cinfo"><b>${b.name}</b><div class="muted">${b.desc}</div>
      <div class="bonus">${info}</div></div>
      <div class="cbuy">${own ? `<button class="btn small" data-sellbiz="${b.id}">Vender ${fmtMoney(b.price * 0.7)}</button>` : `<button class="btn primary small" data-biz="${b.id}" ${s.money < b.price ? 'disabled' : ''}>${fmtMoney(b.price)}</button>`}</div></div>`;
  }).join('') + `</div><p class="muted small">Tus negocios te han dejado ${fmtMoney(I.bizEarned)}. Si vendes uno, recibes el 70% de lo que pagaste.</p>`;
}
// Comprar o vender un negocio; done() vuelve a dibujar
function bizClick(d, done) {
  const s = G.s, I = invState(s);
  if (d.biz) {
    const bz = BUSINESSES.find(x => x.id === d.biz);
    if (s.money < bz.price || I.biz.includes(bz.id)) return false;
    s.money -= bz.price; I.biz.push(bz.id); SFX.coin();
    UI.toast(bz.auto ? 'Compraste la Fábrica de merch: desde ahora el merch se produce solo.' : `Compraste: ${bz.name}.`, 'good');
    return true;
  }
  if (d.sellbiz) {
    const bz = BUSINESSES.find(x => x.id === d.sellbiz);
    askConfirm(`Te pagan ${fmtMoney(bz.price * 0.7)} (el 70% de lo que costó) y dejas de recibir ${bz.auto ? 'el merch automático' : 'sus ingresos semanales'}.`, { title: `¿Vender ${bz.name}?`, ok: 'Vender', icon: 'coin' }).then(yes => {
      if (!yes || !I.biz.includes(bz.id)) return;
      I.biz = I.biz.filter(x => x !== bz.id); s.money += Math.round(bz.price * 0.7);
      SFX.coin(); saveGame(); done(); UI.refresh();
    });
    return true;
  }
  return false;
}

function invState(s = G.s) {
  if (!s.inv) s.inv = { prices: {}, hist: {}, own: {}, biz: [], bizEarned: 0, stockGain: 0 };
  for (const st of STOCKS) {
    if (!s.inv.prices[st.id]) s.inv.prices[st.id] = st.start;
    if (!s.inv.hist[st.id]) s.inv.hist[st.id] = [st.start];
  }
  return s.inv;
}
function gauss() { return (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 1.2; }
function weeklyInvest(s) {
  const I = invState(s);
  const news = Math.random() < 0.04 ? pick(STOCKS) : null, up = Math.random() < 0.5;
  for (const st of STOCKS) {
    let p = I.prices[st.id] * Math.exp(st.drift + st.vol * gauss());
    if (st.id === 'onda' && s.trend) p *= 1.002;
    if (news === st) p *= up ? 1.25 : 0.75;
    I.prices[st.id] = Math.max(1, Math.round(p * 100) / 100);
    I.hist[st.id].push(I.prices[st.id]);
    if (I.hist[st.id].length > 16) I.hist[st.id].shift();
  }
  if (news) UI.toast(`Bolsa: ${news.name} ${up ? 'se disparó +25%' : 'se desplomó −25%'} por una noticia.`, up ? 'good' : 'bad');
  let inc = 0;
  for (const id of I.biz) {
    const b = BUSINESSES.find(x => x.id === id);
    inc += b.base * rnd(0.6, 1.4) * (b.fans ? 0.7 + Math.min(1.3, s.fans / 5e5) : 1);
  }
  if (inc) { inc = Math.round(inc); s.money += inc; I.bizEarned += inc; taxState(s).gross += inc; }
}
function sparkline(arr, w = 70, h = 20) {
  const min = Math.min(...arr), max = Math.max(...arr), span = max - min || 1;
  const pts = arr.map((v, i) => `${(i / Math.max(1, arr.length - 1) * w).toFixed(1)},${(h - (v - min) / span * h).toFixed(1)}`).join(' ');
  const up = arr[arr.length - 1] >= arr[0];
  return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline fill="none" stroke="${up ? '#00e436' : '#ff004d'}" stroke-width="2" points="${pts}"/></svg>`;
}

/* ---------- Festivales ---------- */
const FESTIVALS = ['Pixel Fest', 'Festival Estéreo Neón', 'Cumbia Bajo la Luna', 'Bassline Andino', 'Festival Puerta Blanca', 'Ritmos del Pacífico Pixel', 'Noches de Vinilo'];
function festState(s = G.s) { return s.fest || (s.fest = { next: s.week + rint(8, 14), played: 0, earned: 0 }); }
function festivalEvent() {
  const s = G.s, F = festState(s);
  const name = pick(FESTIVALS);
  let fee = round50(1500 + s.prestige * 12 + s.fans * 0.015);
  const play = (f) => {
    s.money += f; taxState(s).gross += f;
    passTime(3);
    addNeeds({ energia: -35, animo: 15 });
    const fans = Math.round(200 + s.fans * 0.04);
    s.fans += fans; s.prestige += 5; F.played++; F.earned += f;
    const msg = `¡Rompiste en ${name}! +${fmtMoney(f)}, +${fmtNum(fans)} fans y +5 prestigio.`;
    if (typeof Cutscene !== 'undefined') Cutscene.play('gig', { big: true, name, result: msg });
    return msg;
  };
  return {
    title: `${name} te quiere en tarima`, icon: 'speaker',
    text: `Los organizadores de ${name} quieren contratarte para un set en vivo. Ofrecen ${fmtMoney(fee)}. Son 3 días fuera del estudio y cansa bastante.`,
    options: [
      { label: `Aceptar (${fmtMoney(fee)})`, desc: '3 días · −35 energía · +fans y prestigio', run() { return play(fee); } },
      { label: 'Negociar más plata', desc: '55%: suben a ' + fmtMoney(round50(fee * 1.35)) + '. 45%: contratan a otro.', run() { if (Math.random() < 0.55) return 'Aceptaron tu precio. ' + play(round50(fee * 1.35)); return 'Dijeron que no y contrataron a otro productor.'; } },
      { label: 'Rechazar', run() { return null; } },
    ],
  };
}

/* =========================================================
   GANCHOS
   ========================================================= */
(function () {
  // Productividad: energizante, bajón y resaca
  const baseWM = workMult;
  workMult = function (s = G.s) {
    let m = baseWM(s);
    if (!s || !s.life) return m;
    if (hasFx('wired', s)) m *= 1.15;
    else if (hasFx('crash', s)) m *= 0.85;
    if (hasFx('resaca', s)) m *= 0.6;
    return m;
  };

  // Día: efectos de la tienda, ansiedad y el Chocheiner
  const baseDay = dailyLife;
  dailyLife = function () {
    const s = G.s, n = s.needs, L = s.life;
    fxState(s);
    baseDay();
    if (hasFx('wired')) n.energia = 100;
    else if (hasFx('crash')) { n.energia = Math.max(0, n.energia - 0.9); n.animo = Math.max(0, n.animo - 0.2); }
    if (hasFx('resaca') && L.hangDay !== s.day) { L.hangDay = s.day; addNeeds({ energia: -15 }); }
    if (hasFx('vape')) { addNeeds({ animo: 0.5 }); s.salud = Math.max(0, s.salud - 0.3); }
    if (hasFx('vit')) s.salud = Math.min(100, s.salud + 0.3);
    if (L.nic >= 4 && s.day - L.lastSmoke >= 3) { addNeeds({ animo: -1.5 }); if (!hasFx('ansia')) { addFx('ansia', 1); UI.toast('Te dio ansiedad por no fumar. Los chicles de nicotina ayudan.', 'bad'); } else addFx('ansia', 1); }
    if (s.day - L.lastSmoke >= 1) L.nic = Math.max(0, L.nic - 0.1);
    L.fx = L.fx.filter(f => f.until > s.day);
    if (s.items.includes('dec_chocheiner')) addNeeds({ animo: 0.35 });
    if (s.items.includes('dec_stiwai')) addNeeds({ animo: 0.15 });
  };

  // Semana: robos, hackeos, estafas, bolsa, negocios y festivales
  const baseWeek = advanceWeek;
  advanceWeek = function () {
    const s = G.s;
    baseWeek();
    if (!G.running || G.s !== s) return;
    fxState(s);
    weeklyInvest(s);
    const value = Object.keys(EQUIP).reduce((a, c) => a + s.equip[c], 0) + s.items.length * 0.2;
    const robBase = 0.003 + value * 0.0008, roll = Math.random();
    if (s.week > 4 && roll < robBase * secRobMult(s)) studioRobbery();
    else if (s.week > 4 && roll < robBase && secRobMult(s) < 1) {
      s.life.blocked = (s.life.blocked || 0) + 1;
      UI.toast(pick(['Tu alarma espantó a unos ladrones anoche.', 'Intentaron forzar la puerta del estudio, pero tu seguridad los detuvo.', 'Las cámaras grabaron a alguien rondando el estudio. Se fue sin entrar.']), 'good');
    }
    else if (s.dev && !s.dev.finished && !s.dev.leaked && s.dev.phase >= 1 && Math.random() < 0.015 * (hasSec('firewall') ? 0.15 : 1)) songLeak();
    else if (s.money > 3000 && s.week > 6 && Math.random() < 0.02) UI.queue(() => UI.choice(pick(SCAMS)(s)));
    const F = festState(s);
    if (s.week >= F.next) {
      F.next = s.week + rint(10, 16);
      if (s.prestige >= 40) UI.queue(() => UI.choice(festivalEvent()));
    }
  };

  // Una canción filtrada rinde menos al lanzarla
  const baseRelease = releaseSong;
  releaseSong = function (...a) {
    const leaked = G.s.dev && G.s.dev.leaked;
    const r = baseRelease.apply(this, a);
    if (leaked && G.s.songs[0]) { G.s.songs[0].base *= 0.75; G.s.songs[0].leaked = true; }
    return r;
  };

  // El Chocheiner en el estudio
  const baseCtl = drawControl;
  drawControl = function (ctx, s, t, opts) {
    baseCtl(ctx, s, t, opts);
    const L = layout(s);
    X = ctx;
    const plush = (map, x0, y0) => {
      R(x0 + 2, y0 + 23, 22, 2, 'rgba(0,0,0,.3)');
      map.forEach((row, y) => { for (let x = 0; x < 12; x++) { const c = row[x]; if (c !== '.' && ICON_PAL[c]) R(x0 + x * 2, y0 + y * 2, 2, 2, ICON_PAL[c]); } });
    };
    if (s.items.includes('dec_chocheiner')) {
      const x0 = L.cx + 18, y0 = 128 + (((t / 900) | 0) % 2);
      plush(ICONS.chocheiner, x0, y0);
      if (((t / 400) | 0) % 5 === 0) P(x0 + 11, y0 + 19, '#ffffff');
    }
    if (s.items.includes('dec_stiwai')) {
      const x0 = L.cx + 44, y0 = 127;
      plush(ICONS.stiwai, x0, y0);
      if (((t / 700) | 0) % 6 === 0) R(x0 + 4, y0 + 6, 3, 1, '#fff1e8'); // brillo en las gafas
    }
  };

  // Celular: apps de inversiones y agenda de festivales
  PHONE_APPS.push(
    { id: 'bolsa', name: 'Bolsa', icon: 'gold', color: '#1d2b53', open: () => UI.invest() },
    { id: 'agenda', name: 'Agenda', icon: 'speaker', color: '#7e2553', open: () => {
      const s = G.s, F = festState(s);
      UI.toast(s.prestige < 40 ? 'Los festivales te contratan cuando tengas 40 de prestigio.' : `Próxima propuesta de festival en unas ${Math.max(1, F.next - s.week)} semana(s). Has tocado en ${F.played} festival(es).`, 'muted');
    } },
  );
})();

/* =========================================================
   PANELES
   ========================================================= */
Object.assign(UI, {
  shop247(tab = 'tienda') {
    const s = G.s;
    let cur = tab;
    fxState(s);
    const m = this.modal('Tienda 24/7', '', { wide: true });
    const render = () => {
      const L = s.life;
      const act = L.fx.filter(f => f.until > s.day);
      let h = this.tabs([['tienda', 'Tienda'], ['seguridad', 'Seguridad']], cur) + `<div class="money-line">Dinero: <b>${fmtMoney(s.money)}</b></div>`;
      if (cur === 'tienda') {
        h += `<div class="fx-list">${act.length ? act.map(f => `<span class="fx-tag ${FX_INFO[f.id].good ? 'good' : 'bad'}">${FX_INFO[f.id].name} · ${Math.ceil(f.until - s.day)} día(s)</span>`).join('') : '<span class="muted">Sin efectos activos.</span>'}
          ${L.nic >= 1 ? `<span class="fx-tag bad">Dependencia a la nicotina: ${Math.round(L.nic)}</span>` : ''}</div><div class="grid">`;
        h += STORE247.map(it => `<div class="card">${iconImg(it.icon)}<div class="cinfo"><b>${it.name}</b><div class="muted">${it.desc}</div><div class="bonus">${it.side}</div></div>
          <div class="cbuy"><button class="btn primary small" data-buy="${it.id}" ${s.money < it.price ? 'disabled' : ''}>${fmtMoney(it.price)}</button></div></div>`).join('') + '</div>';
      } else {
        h += '<p class="muted">Protege tu estudio de ladrones y hackers. También puedes abrir este panel desde tu celular (app Seguridad) o desde tu vida.</p><div class="row"><button class="btn primary small" data-opensec="1">Ver todo: vigilante, seguro y riesgo</button></div><div class="grid">' + SECURITY.filter(it => !it.weekly).map(it => {
          const own = L.security.includes(it.id);
          return `<div class="card ${own ? 'owned' : ''}">${iconImg(it.icon)}<div class="cinfo"><b>${it.name}</b><div class="muted">${it.desc}</div></div>
            <div class="cbuy">${own ? '<span class="ok">✓ Instalado</span>' : `<button class="btn primary small" data-sec="${it.id}" ${s.money < it.price ? 'disabled' : ''}>${fmtMoney(it.price)}</button>`}</div></div>`;
        }).join('') + '</div>';
      }
      m.set(h);
    };
    m.body.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.tab) { cur = b.dataset.tab; SFX.click(); render(); return; }
      if (b.dataset.opensec) { m.close(); SFX.click(); this.security(); return; }
      if (b.dataset.buy) {
        const it = STORE247.find(x => x.id === b.dataset.buy);
        if (s.money < it.price) return;
        s.money -= it.price; it.use(s, s.needs); SFX.coin();
        this.toast(`${it.name}: ${it.desc}`, 'good');
      }
      if (b.dataset.sec) {
        const it = SECURITY.find(x => x.id === b.dataset.sec);
        s.money -= it.price; s.life.security.push(it.id); SFX.coin();
        this.toast(`Instalaste: ${it.name}.`, 'good');
      }
      saveGame(); render(); this.refresh();
    });
    render();
  },

  invest(tab = 'acciones') {
    const s = G.s, I = invState(s);
    let cur = 'acciones';
    const m = this.modal('Bolsa Pixel', '', { wide: true });
    const render = () => {
      let h = this.tabs([['acciones', 'Acciones']], 'acciones') + `<div class="money-line">Dinero: <b>${fmtMoney(s.money)}</b></div>`;
      if (cur === 'acciones') {
        let worth = 0;
        h += '<div class="grid">' + STOCKS.map(st => {
          const p = I.prices[st.id], hist = I.hist[st.id], prev = hist[hist.length - 2] || p, ch = (p - prev) / prev;
          const own = I.own[st.id] || { qty: 0, cost: 0 }; worth += own.qty * p;
          const gain = own.qty ? (p - own.cost) * own.qty : 0;
          return `<div class="card">${sparkline(hist)}<div class="cinfo"><b>${st.name} · ${fmtMoney(p)}</b>
            <div class="muted">${st.desc} · <span class="${ch >= 0 ? 'stock-up' : 'stock-down'}">${ch >= 0 ? '▲' : '▼'} ${Math.abs(ch * 100).toFixed(1)}%</span> esta semana</div>
            ${own.qty ? `<div class="bonus">Tienes ${fmtNum(own.qty)} (promedio ${fmtMoney(own.cost)}) · <span class="${gain >= 0 ? 'stock-up' : 'stock-down'}">${gain >= 0 ? '+' : '−'}${fmtMoney(Math.abs(gain))}</span></div>` : ''}
            <div class="merch-btns">${[1, 10, 100].map(q => `<button class="btn small" data-buy="${st.id}" data-q="${q}" ${s.money < p * q ? 'disabled' : ''}>Comprar ${q}</button>`).join('')}
            ${own.qty ? `<button class="btn small" data-sell="${st.id}" data-q="10">Vender 10</button><button class="btn small" data-sell="${st.id}" data-q="all">Vender todo</button>` : ''}</div></div></div>`;
        }).join('') + '</div>';
        h += `<p class="muted small">Tus acciones valen ${fmtMoney(worth)}. Los precios cambian cada semana: pueden subir o bajar. Ganancia realizada: ${fmtMoney(I.stockGain)}.</p>`;
      }
      h += '<p class="muted small">Los negocios (food truck, fábrica de merch, karaoke...) ahora están en <b>Trabajos &gt; Negocios</b>.</p><div class="row"><button class="btn small" data-gobiz="1">Ver negocios</button></div>';
      m.set(h);
    };
    m.body.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      const d = b.dataset;
      if (d.tab) { cur = d.tab; SFX.click(); render(); return; }
      if (d.buy) {
        const p = I.prices[d.buy], q = +d.q, cost = Math.round(p * q * 100) / 100;
        if (s.money < cost) return;
        const own = I.own[d.buy] || (I.own[d.buy] = { qty: 0, cost: 0 });
        own.cost = (own.cost * own.qty + cost) / (own.qty + q); own.qty += q;
        s.money -= cost; SFX.coin();
      }
      if (d.sell) {
        const own = I.own[d.sell], p = I.prices[d.sell];
        const q = d.q === 'all' ? own.qty : Math.min(own.qty, +d.q);
        const gain = (p - own.cost) * q;
        s.money += p * q; own.qty -= q; I.stockGain += gain;
        if (gain > 0) taxState(s).gross += gain; else taxState(s).costs -= gain; // las pérdidas se descuentan
        if (!own.qty) delete I.own[d.sell];
        SFX.coin(); this.toast(`Vendiste ${q} acciones: ${gain >= 0 ? 'ganaste' : 'perdiste'} ${fmtMoney(Math.abs(gain))}.`, gain >= 0 ? 'good' : 'bad');
      }
      if (d.gobiz) { m.close(); SFX.click(); this.jobs('negocios'); return; }
      saveGame(); render(); this.refresh();
    });
    render();
  },
});
