'use strict';
/* =========================================================
   WHITE DOOR — Datos del juego
   Todo el contenido (géneros, tienda, cursos, artistas...)
   ========================================================= */

// Las 9 áreas de producción, agrupadas en 3 fases.
// cre = proporción de puntos que son Creatividad (el resto es Técnica)
const AREAS = [
  { id: 'melodia',      name: 'Melodía',      phase: 0, cre: 0.8 },
  { id: 'armonia',      name: 'Armonía',      phase: 0, cre: 0.5 },
  { id: 'ritmo',        name: 'Ritmo',        phase: 0, cre: 0.35 },
  { id: 'voces',        name: 'Voces',        phase: 1, cre: 0.6 },
  { id: 'instrumentos', name: 'Instrumentos', phase: 1, cre: 0.45 },
  { id: 'letra',        name: 'Letra',        phase: 1, cre: 0.9 },
  { id: 'mezcla',       name: 'Mezcla',       phase: 2, cre: 0.15 },
  { id: 'efectos',      name: 'Efectos',      phase: 2, cre: 0.7 },
  { id: 'master',       name: 'Master',       phase: 2, cre: 0.1 },
];

const PHASES = [
  { name: 'Composición', skill: 'composicion' },
  { name: 'Grabación',   skill: 'grabacion' },
  { name: 'Producción',  skill: 'produccion' },
];

const SKILLS = {
  composicion: { name: 'Composición', desc: 'Más puntos en la fase de Composición.' },
  grabacion:   { name: 'Grabación',   desc: 'Más puntos en la fase de Grabación.' },
  produccion:  { name: 'Producción',  desc: 'Más puntos en Producción y menos ruido.' },
};

// w = importancia de cada área (0-3) en el orden de AREAS
const GENRES = {
  pop:         { name: 'Pop',         w: [3,2,2, 3,1,2, 2,1,2], start: true,  color: '#ff77a8' },
  hiphop:      { name: 'Hip Hop',     w: [1,1,3, 2,1,3, 2,2,1], start: true,  color: '#ffa300' },
  lofi:        { name: 'Lo-fi',       w: [2,3,2, 0,2,0, 2,3,1], start: true,  color: '#83769c' },
  reggaeton:   { name: 'Reggaetón',   w: [2,1,3, 3,1,2, 2,2,2], color: '#ffec27' },
  rnb:         { name: 'R&B',         w: [2,3,1, 3,1,2, 2,1,2], color: '#7e2553' },
  trap:        { name: 'Trap',        w: [1,1,3, 2,0,2, 2,3,2], color: '#ff004d' },
  rock:        { name: 'Rock',        w: [2,2,2, 2,3,2, 2,1,1], color: '#c2c3c7' },
  electronica: { name: 'Electrónica', w: [2,1,3, 0,1,0, 2,3,3], color: '#29adff' },
  cumbia:      { name: 'Cumbia',      w: [2,1,3, 2,3,1, 1,1,1], color: '#00e436' },
  salsa:       { name: 'Salsa',       w: [2,3,3, 2,3,1, 2,0,1], color: '#ff6c24' },
  vallenato:   { name: 'Vallenato',   w: [3,2,2, 2,3,3, 1,0,1], color: '#ab5236' },
  indie:       { name: 'Indie',       w: [3,2,1, 2,2,3, 1,2,1], color: '#a8e72e' },
  metal:       { name: 'Metal',       w: [1,2,3, 2,3,1, 2,2,2], color: '#5f574f' },
  jazz:        { name: 'Jazz',        w: [2,3,2, 1,3,0, 2,0,1], color: '#1d2b53' },
};

const TOPICS = {
  amor:       { name: 'Amor',        start: true },
  desamor:    { name: 'Desamor',     start: true },
  fiesta:     { name: 'Fiesta',      start: true },
  calle:      { name: 'La calle',    start: true },
  nostalgia:  { name: 'Nostalgia',   start: true },
  superacion: { name: 'Superación',  start: true },
  verano:     { name: 'Verano',      start: true },
  noche:      { name: 'La noche',    start: true },
  dinero:     { name: 'Dinero' },
  viajes:     { name: 'Viajes' },
  naturaleza: { name: 'Naturaleza' },
  espacio:    { name: 'El espacio' },
  baile:      { name: 'Baile' },
  rebeldia:   { name: 'Rebeldía' },
  familia:    { name: 'Familia' },
};

const COMBOS = {
  pop:         { good: ['amor', 'verano', 'baile', 'superacion'],       bad: ['calle', 'rebeldia'] },
  hiphop:      { good: ['calle', 'dinero', 'superacion', 'rebeldia'],   bad: ['naturaleza', 'verano'] },
  lofi:        { good: ['nostalgia', 'noche', 'naturaleza', 'viajes'],  bad: ['fiesta', 'dinero'] },
  reggaeton:   { good: ['fiesta', 'baile', 'noche', 'amor'],            bad: ['naturaleza', 'familia'] },
  rnb:         { good: ['amor', 'desamor', 'noche'],                    bad: ['rebeldia', 'fiesta'] },
  trap:        { good: ['dinero', 'calle', 'noche'],                    bad: ['familia', 'naturaleza'] },
  rock:        { good: ['rebeldia', 'desamor', 'viajes'],               bad: ['baile', 'dinero'] },
  electronica: { good: ['fiesta', 'espacio', 'noche', 'baile'],         bad: ['familia', 'desamor'] },
  cumbia:      { good: ['fiesta', 'baile', 'familia'],                  bad: ['espacio', 'rebeldia'] },
  salsa:       { good: ['baile', 'amor', 'fiesta', 'desamor'],          bad: ['espacio', 'rebeldia'] },
  vallenato:   { good: ['desamor', 'amor', 'nostalgia', 'familia'],     bad: ['espacio', 'dinero'] },
  indie:       { good: ['nostalgia', 'viajes', 'naturaleza', 'desamor'], bad: ['dinero', 'fiesta'] },
  metal:       { good: ['rebeldia', 'espacio', 'calle'],                bad: ['amor', 'verano'] },
  jazz:        { good: ['noche', 'nostalgia', 'amor'],                  bad: ['dinero', 'fiesta'] },
};

const SIZES = {
  sencillo: { name: 'Sencillo', weeks: 8,  mult: 1,   cost: 0 },
  ep:       { name: 'EP',       weeks: 16, mult: 2.6, cost: 3000, flag: 'ep',    lockMsg: 'Curso: Producción de EP' },
  album:    { name: 'Álbum',    weeks: 30, mult: 6,   cost: 15000, flag: 'album', lockMsg: 'Curso: Producción de álbum' },
};

/* ---------- Tienda: equipo por niveles ----------
   p = puntos extra por semana en cada fase [Comp, Grab, Prod]
   spd = multiplicador de velocidad, noise = reducción de ruido */
const EQUIP = {
  mic: [
    { name: 'Mic USB de juguete',       price: 0,      p: [0, 0, 0],  icon: 'mic', desc: 'Suena como una lata... pero es tuyo.' },
    { name: 'Micrófono dinámico',       price: 2000,    p: [0, 4, 0],  icon: 'mic', desc: 'Resistente y confiable. Un clásico de escenario.' },
    { name: 'Condensador de estudio',   price: 10000,   p: [0, 9, 1],  icon: 'mic', desc: 'Captura cada detalle de la voz. Incluye filtro anti-pop.' },
    { name: 'Micrófono de válvulas',    price: 45000,  p: [0, 16, 2], icon: 'mic', desc: 'Calidez analógica de los 60s.', room: 2 },
    { name: 'Micrófono Vintage Dorado', price: 200000,  p: [1, 26, 3], icon: 'mic', desc: 'Una leyenda. Dicen que grabó a los grandes.', room: 3 },
  ],
  pc: [
    { name: 'Laptop vieja',             price: 0,      p: [0, 0, 0],  spd: 1,    icon: 'pc', desc: 'Se calienta con solo abrir el DAW.' },
    { name: 'PC de escritorio',         price: 3750,   p: [1, 1, 2],  spd: 1.15, icon: 'pc', desc: 'Más RAM, menos congelamientos.' },
    { name: 'PC Gamer RGB',             price: 17500,   p: [2, 2, 4],  spd: 1.3,  icon: 'pc', desc: 'Dos pantallas y luces que van al ritmo.' },
    { name: 'Workstation de audio',     price: 75000,  p: [3, 3, 7],  spd: 1.5,  icon: 'pc', desc: 'Pantalla ultra ancha. Cientos de pistas sin sudar.' },
    { name: 'Estación Cuántica WD-9000',price: 375000, p: [5, 5, 12], spd: 1.8,  icon: 'pc', desc: 'Tecnología del futuro, hoy en White Door.', room: 3 },
  ],
  monitor: [
    { name: 'Audífonos baratos',        price: 0,      p: [0, 0, 0],  noise: 0,   icon: 'phones', desc: 'Les falta todo el bajo.' },
    { name: 'Audífonos de estudio',     price: 1250,    p: [0, 0, 3],  noise: 0.5, icon: 'phones', desc: 'Sonido plano y honesto.' },
    { name: 'Monitores de 5"',          price: 7500,   p: [0, 1, 6],  noise: 1,   icon: 'speaker', desc: 'Tus primeros parlantes de estudio.' },
    { name: 'Monitores de referencia',  price: 37500,  p: [1, 1, 10], noise: 1.5, icon: 'speaker', desc: 'Escuchas la mezcla como realmente es.', room: 1 },
    { name: 'Sistema de monitoreo Pro', price: 175000,  p: [2, 2, 16], noise: 2,   icon: 'speaker', desc: 'El sonido de los grandes estudios.', room: 3 },
  ],
};
const EQUIP_CATS = { mic: 'Micrófono', pc: 'Computador', monitor: 'Monitoreo' };

// Instrumentos y software (se pueden tener varios)
const GEAR = [
  { id: 'inst_teclado',  cat: 'inst', name: 'Teclado MIDI',            price: 900,   p: [4, 1, 0], icon: 'keys',   desc: '25 teclas de pura inspiración.' },
  { id: 'inst_guitarra', cat: 'inst', name: 'Guitarra eléctrica',      price: 2650,  p: [3, 3, 0], icon: 'guitar', desc: 'Roja, como debe ser.' },
  { id: 'inst_synth',    cat: 'inst', name: 'Sintetizador analógico',  price: 13200,  p: [6, 1, 2], icon: 'synth',  desc: 'Perillas, cables y sonidos imposibles.', room: 1 },
  { id: 'inst_bateria',  cat: 'inst', name: 'Batería acústica',        price: 26400, p: [4, 5, 0], icon: 'drum',   desc: 'Necesita espacio... y vecinos pacientes.', room: 2 },
  { id: 'inst_piano',    cat: 'inst', name: 'Piano de cola',           price: 99000, p: [10, 4, 0], icon: 'piano', desc: 'Elegancia pura en negro brillante.', room: 3 },
  { id: 'plug_vst',      cat: 'soft', name: 'Pack de VSTs',            price: 650,   p: [2, 0, 2], icon: 'disk',   desc: 'Sintes y efectos virtuales.' },
  { id: 'plug_tune',     cat: 'soft', name: 'Afinador vocal',          price: 5500,  p: [0, 4, 1], icon: 'disk',   desc: 'Cualquiera canta afinado... casi.' },
  { id: 'plug_master',   cat: 'soft', name: 'Suite de masterización',  price: 19800,  p: [0, 0, 7], noise: 1, icon: 'disk', desc: 'Volumen y brillo de nivel comercial.' },
  { id: 'plug_ai',       cat: 'soft', name: 'Asistente creativo IA',   price: 88000, p: [5, 3, 3], icon: 'disk',   desc: 'Te sugiere acordes cuando te bloqueas.' },
];

// Decoración: amb = ambiente (aumenta tu productividad y atrae artistas)
const DECOR = [
  { id: 'dec_poster',   name: 'Póster retro',            price: 250,   amb: 1, icon: 'poster', desc: 'Arte de tu banda favorita.' },
  { id: 'dec_planta',   name: 'Planta',                  price: 300,   amb: 2, icon: 'plant',  desc: 'Un poco de vida verde.' },
  { id: 'dec_lampara',  name: 'Lámpara de pie',          price: 650,   amb: 2, icon: 'lamp',   desc: 'Luz cálida para sesiones nocturnas.' },
  { id: 'dec_alfombra', name: 'Alfombra',                price: 950,   amb: 2, icon: 'rug',    desc: 'Absorbe rebotes... y migas de pan.' },
  { id: 'dec_led',      name: 'Tira de luces LED',       price: 1300,   amb: 3, icon: 'led',    desc: 'Colores que cambian solos.' },
  { id: 'dec_gato',     name: 'Gato de estudio "Beat"',  price: 1600,  amb: 6, icon: 'cat',    desc: 'Adóptalo. Es el mejor crítico musical.' },
  { id: 'dec_paneles',  name: 'Paneles acústicos',       price: 4000,  amb: 1, p: [0, 1, 2], noise: 1, icon: 'panel', desc: 'Menos eco, mezclas más limpias.' },
  { id: 'dec_vinilos',  name: 'Repisa de vinilos',       price: 2900,  amb: 3, icon: 'vinyl',  desc: 'Clásicos para inspirarte.', room: 1 },
  { id: 'dec_neon',     name: 'Neón "WHITE DOOR"',       price: 8000,  amb: 5, icon: 'neon',   desc: 'Tu marca brillando en la pared.', room: 1 },
  { id: 'dec_sofa',     name: 'Sofá para artistas',      price: 6400,  amb: 4, icon: 'sofa',   desc: 'Los artistas se sienten como en casa.', room: 2 },
  { id: 'dec_arcade',   name: 'Máquina arcade',          price: 19200, amb: 6, icon: 'arcade', desc: 'Para los descansos entre tomas.', room: 3 },
  { id: 'dec_discos',   name: 'Discos de oro',           price: 32000, amb: 8, icon: 'gold',   desc: 'Que todos vean tus logros.', room: 3 },
  { id: 'dec_stiwai', name: 'Stiwai (peluche raro)', price: 35000, amb: 6, spd: 1.04, p: [1, 1, 1], icon: 'stiwai', room: 2, rare: true,
    desc: 'Gorila de peluche con gafas de esquí. Raro y con mucho flow: +4% velocidad, +1 en todas las fases, +ambiente y un poco de ánimo cada día.' },
  { id: 'dec_chocheiner', name: 'Chocheiner (peluche legendario)', price: 120000, amb: 10, spd: 1.1, p: [3, 3, 3], icon: 'chocheiner', room: 3, legend: true,
    desc: 'Único en el mundo. Te mira fijo mientras produces: +10% velocidad, +3 en todas las fases, +ambiente y +ánimo cada día.' },
];

const ROOMS = [
  { name: 'Mi habitación',        price: 0,        rent: 40,    w: 232, amb: 0,  slots: 0, desc: 'Donde empieza todo. Cama al lado, sueños enormes.' },
  { name: 'Habitación amplia',    price: 15000,    rent: 150,   w: 256, amb: 2,  slots: 1, desc: 'Más espacio y un cuarto extra para un módulo.' },
  { name: 'Garaje estudio',       price: 45000,    rent: 400,   w: 288, amb: 3,  slots: 2, desc: 'Aislado, amplio y con espacio para una batería.' },
  { name: 'Estudio en local',     price: 300000,   rent: 1200,  w: 320, amb: 5,  slots: 3, desc: 'Un estudio de verdad, con paredes tratadas.' },
  { name: 'White Door Studios',   price: 2500000,  rent: 4000,  w: 320, amb: 8,  slots: 4, desc: 'Estudio profesional. Las estrellas hacen fila.' },
  { name: 'White Door Records HQ',price: 15000000, rent: 10000, w: 320, amb: 12, slots: 5, desc: 'La sede de tu propio sello discográfico. El final del camino.' },
];

const COURSES = [
  // Habilidades
  { id: 'teoria1', group: 'Habilidades', name: 'Teoría musical I',        cost: 800,   weeks: 2, skill: ['composicion', 1], desc: '+1 Composición' },
  { id: 'teoria2', group: 'Habilidades', name: 'Teoría musical II',       cost: 6000,  weeks: 3, skill: ['composicion', 2], req: 'teoria1', level: 3, desc: '+2 Composición' },
  { id: 'teoria3', group: 'Habilidades', name: 'Armonía avanzada',        cost: 30000, weeks: 4, skill: ['composicion', 3], req: 'teoria2', level: 6, desc: '+3 Composición' },
  { id: 'voz1',    group: 'Habilidades', name: 'Grabación vocal',         cost: 1000,   weeks: 2, skill: ['grabacion', 1], desc: '+1 Grabación' },
  { id: 'voz2',    group: 'Habilidades', name: 'Microfonía avanzada',     cost: 7000,  weeks: 3, skill: ['grabacion', 2], req: 'voz1', level: 3, desc: '+2 Grabación' },
  { id: 'voz3',    group: 'Habilidades', name: 'Dirección de artistas',   cost: 32000, weeks: 4, skill: ['grabacion', 3], req: 'voz2', level: 6, desc: '+3 Grabación' },
  { id: 'mix1',    group: 'Habilidades', name: 'Mezcla I',                cost: 1200,   weeks: 2, skill: ['produccion', 1], desc: '+1 Producción' },
  { id: 'mix2',    group: 'Habilidades', name: 'Mezcla II',               cost: 8000,  weeks: 3, skill: ['produccion', 2], req: 'mix1', level: 3, desc: '+2 Producción' },
  { id: 'mix3',    group: 'Habilidades', name: 'Masterización profesional', cost: 36000, weeks: 4, skill: ['produccion', 3], req: 'mix2', level: 6, desc: '+3 Producción' },
  { id: 'letras',  group: 'Habilidades', name: 'Escritura creativa',      cost: 3000,  weeks: 2, topics: true, desc: 'Desbloquea 7 temas nuevos' },
  // Formatos y negocio
  { id: 'ep',        group: 'Negocio', name: 'Producción de EP',        cost: 10000,  weeks: 3, flag: 'ep', level: 3, desc: 'Desbloquea EPs (5 canciones)' },
  { id: 'album',     group: 'Negocio', name: 'Producción de álbum',     cost: 50000, weeks: 5, flag: 'album', req: 'ep', level: 6, desc: 'Desbloquea álbumes completos' },
  { id: 'negocios',  group: 'Negocio', name: 'Negociación de contratos', cost: 12000, weeks: 2, flag: 'negocios', level: 3, desc: '+25% en pagos de artistas' },
  { id: 'marketing', group: 'Negocio', name: 'Marketing musical',       cost: 16000,  weeks: 3, flag: 'marketing', level: 4, desc: '+25% reproducciones' },
  { id: 'redes',     group: 'Negocio', name: 'Redes sociales',          cost: 24000, weeks: 3, flag: 'redes', level: 5, desc: '+50% fans ganados' },
  // Géneros
  { id: 'g_reggaeton',   group: 'Géneros', name: 'Taller de Reggaetón',  cost: 2000, weeks: 2, genre: 'reggaeton' },
  { id: 'g_rnb',         group: 'Géneros', name: 'Taller de R&B',        cost: 2400, weeks: 2, genre: 'rnb' },
  { id: 'g_trap',        group: 'Géneros', name: 'Taller de Trap',       cost: 3000, weeks: 2, genre: 'trap' },
  { id: 'g_rock',        group: 'Géneros', name: 'Taller de Rock',       cost: 4000, weeks: 2, genre: 'rock', level: 2 },
  { id: 'g_cumbia',      group: 'Géneros', name: 'Taller de Cumbia',     cost: 4000, weeks: 2, genre: 'cumbia', level: 2 },
  { id: 'g_electronica', group: 'Géneros', name: 'Taller de Electrónica', cost: 5000, weeks: 3, genre: 'electronica', level: 2 },
  { id: 'g_salsa',       group: 'Géneros', name: 'Taller de Salsa',      cost: 6000, weeks: 3, genre: 'salsa', level: 3 },
  { id: 'g_vallenato',   group: 'Géneros', name: 'Taller de Vallenato',  cost: 6000, weeks: 3, genre: 'vallenato', level: 3 },
  { id: 'g_indie',       group: 'Géneros', name: 'Taller de Indie',      cost: 7000, weeks: 3, genre: 'indie', level: 3 },
  { id: 'g_metal',       group: 'Géneros', name: 'Taller de Metal',      cost: 10000, weeks: 3, genre: 'metal', level: 4 },
  { id: 'g_jazz',        group: 'Géneros', name: 'Conservatorio de Jazz', cost: 16000, weeks: 4, genre: 'jazz', level: 5 },
];

// Niveles de fama de los artistas que te contactan (según tu prestigio)
const ARTIST_TIERS = [
  { name: 'Desconocido', prestige: 0,    fans: [50, 600],        fee: [250, 700] },
  { name: 'Emergente',   prestige: 100,  fans: [1500, 9000],     fee: [1000, 2800] },
  { name: 'Local',       prestige: 350,  fans: [12000, 60000],   fee: [4000, 10000] },
  { name: 'Nacional',    prestige: 900,  fans: [120000, 600000], fee: [14000, 35000] },
  { name: 'Estrella',    prestige: 2200, fans: [1.2e6, 6e6],     fee: [55000, 120000] },
  { name: 'Leyenda',     prestige: 5000, fans: [1.2e7, 5e7],     fee: [200000, 480000] },
];

const PRODUCER_TITLES = [
  'Productor de cuarto', 'Beatmaker emergente', 'Productor local',
  'Productor nacional', 'Hitmaker', 'Leyenda de la música',
];

const CRITICS = ['Revista Ritmo', 'El Oído Fino', 'OndaSonora', 'Vinilo Crítico'];

const SONG_WORDS = {
  a: ['Luna', 'Corazón', 'Ritmo', 'Noche', 'Fuego', 'Sueño', 'Cielo', 'Lluvia', 'Calle', 'Eco',
      'Brillo', 'Latido', 'Verano', 'Ciudad', 'Sombra', 'Puerta', 'Estrella', 'Mar', 'Café', 'Pixel'],
  b: ['de Neón', 'de Cristal', 'Salvaje', 'en Llamas', 'sin Final', 'de Medianoche', 'Digital',
      'del Sur', 'de Papel', 'a Mil', 'en 8 Bits', 'de Oro', 'en Reversa', 'sin Frenos', 'Azul',
      'Blanca', 'Eterna', 'de Plata', 'en Cámara Lenta', 'Fugaz'],
};

const ARTIST_NAMES = {
  pre: ['Lil', 'DJ', 'MC', 'La', 'El', 'Young', 'Big', '', '', '', ''],
  name: ['Cometa', 'Neblina', 'Valentina', 'Kai', 'Trueno', 'Coral', 'Zafiro', 'Jade', 'Nova', 'Brisa',
         'Fuego', 'Luz', 'Mango', 'Pixel', 'Eco', 'Volt', 'Selva', 'Río', 'Ámbar', 'Cuervo', 'Sol',
         'Mateo', 'Sofi', 'Nico', 'Lía', 'Bruno', 'Tadeo', 'Mía', 'Rayo', 'Kiara', 'Dante', 'Iris'],
  bands: ['Los Gatos Eléctricos', 'Neón Salvaje', 'Los Satélites', 'Volcán Azul', 'Los Fantasmas',
          'Marea Roja', 'Club Galaxia', 'Los Cometas', 'Ruido Blanco', 'Orquesta Tropical', 'Los Lobos de Neón'],
};

const LOOKS = {
  skin:  ['#ffccaa', '#e8b48a', '#c48a5e', '#9a6440', '#6b4428'],
  hair:  ['#1a1210', '#3b2418', '#6b3a2a', '#c9a227', '#ff77a8', '#29adff', '#c2c3c7', '#ff004d', '#00e436'],
  shirt: ['#ff004d', '#29adff', '#ffec27', '#00e436', '#ff77a8', '#ffa300', '#83769c', '#fff1e8', '#1d2b53', '#7e2553'],
  pants: ['#1d2b53', '#1a1a22', '#5f574f', '#3b2418', '#83769c'],
};
