'use strict';
/* =========================================================
   WHITE DOOR v2 — Datos de mundo abierto, vida, discográfica
   ========================================================= */
const DAY_MS = 1600; // un día de juego a velocidad 1x (antes 1000: el tiempo volaba)

SKILLS.manitas = { name: 'Manitas', desc: 'Reparas averías tú mismo con más éxito.' };
COURSES.push(
  { id: 'manitas1', group: 'Habilidades', name: 'Electrónica básica', cost: 1200, weeks: 2, skill: ['manitas', 2], desc: '+2 Manitas (reparar averías)' },
  { id: 'manitas2', group: 'Habilidades', name: 'Técnico de estudio', cost: 7000, weeks: 3, skill: ['manitas', 3], req: 'manitas1', level: 4, desc: '+3 Manitas' },
  { id: 'sello', group: 'Negocio', name: 'Gestión de sello discográfico', cost: 9000, weeks: 3, flag: 'gestion', level: 3, desc: 'Tus artistas firmados rinden +20%' },
);

// Módulos: cuartos extra del estudio (cada propiedad tiene espacios limitados)
const MODULES = {
  oficina:    { name: 'Oficina',             price: 20000, icon: 'pc',    desc: '4 escritorios para tu personal. Sin oficina no puedes contratar.' },
  cabina:     { name: 'Cabina de grabación', price: 35000, icon: 'mic',   p: [0, 4, 0], desc: 'Tus artistas firmados graban aquí (2 a la vez). +4 Grabación.' },
  ensayo:     { name: 'Sala de ensayo',      price: 28000, icon: 'keys',  desc: 'La academia de tus artistas: entrenan y suben su talento (3 a la vez).' },
  lounge:     { name: 'Lounge y cocina',     price: 15000, icon: 'sofa',  amb: 4, desc: 'Comes mejor, te relajas más y tus artistas descansan aquí.' },
  dormitorio: { name: 'Dormitorio',          price: 10000, icon: 'house', desc: 'Una cama de verdad: duermes más rápido y despiertas al 100%.' },
};

const STAFF_TYPES = {
  asistente: { name: 'Asistente',           base: 350, icon: 'mail',    desc: 'Te trae comida, organiza tu agenda y consigue más contactos. Te cansas más lento.' },
  ingeniero: { name: 'Ingeniero de sonido', base: 700, icon: 'speaker', desc: 'Menos ruido en tus mezclas y repara averías en 1 día.' },
  productor: { name: 'Productor',           base: 900, icon: 'note',    desc: 'Produce canciones con los artistas de tu sello en la cabina.' },
  manager:   { name: 'Mánager',             base: 800, icon: 'star',    desc: 'Organiza giras para tus artistas y negocia mejores contratos (+20%).' },
  community: { name: 'Community manager',   base: 500, icon: 'fans',    desc: 'Hace crecer tus fans en redes cada semana.' },
};
const STAFF_NAMES = {
  first: ['Camila', 'Andrés', 'Laura', 'Santiago', 'Valeria', 'Felipe', 'Daniela', 'Sebastián', 'Mariana', 'Juan',
          'Paula', 'Tomás', 'Isabella', 'Samuel', 'Gabriela', 'David', 'Lucía', 'Martín', 'Sara', 'Diego'],
  last: ['Rojas', 'Gómez', 'Vargas', 'Torres', 'Díaz', 'Moreno', 'Castro', 'Ortiz', 'Ruiz', 'Herrera', 'Suárez', 'Mejía'],
};

const ROSTER_TASKS = {
  descanso:   { name: 'Descansar',   desc: 'Recupera energía y ánimo.' },
  entrenar:   { name: 'Entrenar',    desc: 'Sube su talento en la Sala de ensayo.' },
  grabar:     { name: 'Grabar',      desc: 'Graba una canción con un productor de tu equipo.' },
  gira:       { name: 'Gira',        desc: 'Conciertos organizados por tu mánager: dinero y fans.' },
  coproducir: { name: 'Co-producir', desc: 'Te ayuda en tus canciones: más puntos (y más si es su género).' },
};

const OUTFITS = [
  { id: 'blanco', name: 'Hoodie blanco',   price: 0,    color: '#e8e0d8', shade: '#c2bab2' },
  { id: 'negro',  name: 'Hoodie negro',    price: 150,  color: '#3a3548', shade: '#24202e' },
  { id: 'rojo',   name: 'Hoodie rojo',     price: 150,  color: '#ff004d', shade: '#c00038' },
  { id: 'verde',  name: 'Hoodie verde',    price: 300,  color: '#00a83a', shade: '#007a2a' },
  { id: 'azul',   name: 'Chaqueta azul',   price: 400,  color: '#29adff', shade: '#1a7cc0' },
  { id: 'morado', name: 'Hoodie morado',   price: 200,  color: '#83429c', shade: '#5e2e72' },
  { id: 'rosa',   name: 'Hoodie rosado',   price: 200,  color: '#ff77a8', shade: '#d0507f' },
  { id: 'neon',   name: 'Hoodie neón',     price: 450,  color: '#00e436', shade: '#00a82a', stripe: '#1d2b53' },
  { id: 'depor',  name: 'Sudadera deportiva', price: 600, color: '#1d2b53', shade: '#121b38', stripe: '#fff1e8' },
  { id: 'cuero',  name: 'Chaqueta de cuero', price: 1800, color: '#5a3a2a', shade: '#3b2418', collar: '#3b2418' },
  { id: 'jean',   name: 'Chaqueta de jean', price: 900,  color: '#4a7ab8', shade: '#335a8a', collar: '#c2c3c7' },
  { id: 'traje',  name: 'Traje elegante',  price: 4500, color: '#1d1b2e', shade: '#0d0b1a', collar: '#fff1e8' },
  { id: 'oro',    name: 'Chaqueta dorada', price: 6000, color: '#ffc61a', shade: '#c99510' },
];
// Personalización del productor
const SKINS = ['#ffd9c0', '#ffccaa', '#e8b48a', '#c48a5e', '#9a6440', '#6b4428', '#4a2e1c'];
const HAIR_COLORS = ['#2a1810', '#1a1210', '#6b3a2a', '#a0522d', '#c9a227', '#fff1e8', '#c2c3c7', '#ff77a8', '#29adff', '#ff004d', '#00e436', '#83429c'];
const HAIR_STYLES = ['Corto', 'Largo', 'Afro', 'Rapado', 'Moña', 'Trenzas', 'Cresta'];
const HATS = [
  { id: 'gorra_n', name: 'Gorra negra',     kind: 'gorra',   price: 120,  color: '#1a1a1a', shade: '#3a3548' },
  { id: 'gorra_r', name: 'Gorra roja',      kind: 'gorra',   price: 120,  color: '#ff004d', shade: '#c00038' },
  { id: 'gorra_w', name: 'Gorra White Door', kind: 'gorra',  price: 300,  color: '#fff1e8', shade: '#ff77a8' },
  { id: 'gorro',   name: 'Gorro de lana',   kind: 'gorro',   price: 90,   color: '#29adff', shade: '#1a7cc0' },
  { id: 'gorro_m', name: 'Gorro mostaza',   kind: 'gorro',   price: 90,   color: '#c9a227', shade: '#a07e10' },
  { id: 'bandana', name: 'Bandana',         kind: 'bandana', price: 60,   color: '#ff004d', shade: '#c00038' },
];
const CHAINS = [
  { id: 'plata',    name: 'Cadena de plata',   price: 800,   color: '#c2c3c7' },
  { id: 'oro',      name: 'Cadena de oro',     price: 2500,  color: '#ffc61a' },
  { id: 'diamante', name: 'Cadena de diamantes', price: 15000, color: '#bff4ff', sparkle: true },
];
const PHONES = [
  { id: 'rojo',   name: 'Audífonos rojos',   price: 0,    color: '#ff004d', light: '#ff77a8' },
  { id: 'negro',  name: 'Audífonos negros',  price: 200,  color: '#2b2b3a', light: '#5f574f' },
  { id: 'blanco', name: 'Audífonos blancos', price: 400,  color: '#e8e0d8', light: '#ffffff' },
  { id: 'cyan',   name: 'Audífonos cian',    price: 250,  color: '#29adff', light: '#7fd0ff' },
  { id: 'oro',    name: 'Audífonos dorados', price: 3000, color: '#ffc61a', light: '#fff1a8' },
];
const PERSONAL = [
  { id: 'consola', name: 'Consola de videojuegos', price: 900,   icon: 'arcade', desc: 'Relajarte en casa da más ánimo.' },
  { id: 'bici',    name: 'Bicicleta',              price: 500,   icon: 'star',   desc: 'Te mueves por la ciudad 50% más rápido.' },
  { id: 'auto',    name: 'Auto retro',             price: 22000, icon: 'house',  desc: 'Recorres la ciudad mucho más rápido.' },
];

const GOALS = [
  { id: 'cancion1', name: 'Primer lanzamiento', desc: 'Lanza tu primera canción',       xp: 20 },
  { id: 'top10',    name: 'Top 10',             desc: 'Mete una canción en el Top 10', prestige: 20 },
  { id: 'numero1',  name: 'Número 1',           desc: 'Llega al #1 de las listas',     prestige: 60 },
  { id: 'empleado', name: 'Jefe',               desc: 'Contrata a tu primer empleado', xp: 40 },
  { id: 'sello',    name: 'Fundador',           desc: 'Funda White Door Records',      prestige: 40 },
  { id: 'firmar',   name: 'Cazatalentos',       desc: 'Firma a tu primer artista',     xp: 40 },
  { id: 'pareja',   name: 'Amor de estudio',    desc: 'Ten una relación seria',        xp: 30 },
  { id: 'boda',     name: '¡Sí, acepto!',       desc: 'Cásate',                        prestige: 30 },
  { id: 'auto',     name: 'Sobre ruedas',       desc: 'Cómprate un auto',              xp: 30 },
  { id: 'viaje',    name: 'Trotamundos',        desc: 'Tómate unas vacaciones',        xp: 20 },
  { id: 'premio',   name: 'Premio Pixel',       desc: 'Gana un Premio Pixel',          prestige: 80 },
  { id: 'fans100k', name: 'Fenómeno',           desc: 'Llega a 100.000 fans',          prestige: 40 },
  { id: 'millon',   name: 'Millonario',         desc: 'Ten $1.000.000 en el banco',    prestige: 50 },
  { id: 'hq',       name: 'Leyenda',            desc: 'Abre White Door Records HQ',    prestige: 0 },
];

// Cosas que se pueden dañar en el estudio (costo del técnico según la propiedad)
const BREAKABLES = {
  pc:      { name: 'Computador',            effect: 'No puedes producir hasta repararlo.',     cost: [150, 300, 600, 1200, 2500, 4000] },
  mic:     { name: 'Micrófono',             effect: 'Pierdes su bonificación de grabación.',   cost: [80, 150, 300, 600, 1200, 2000] },
  monitor: { name: 'Monitores',             effect: 'Mezclas a ciegas: más ruido.',            cost: [80, 150, 300, 600, 1200, 2000] },
  luz:     { name: 'Instalación eléctrica', effect: 'Todo funciona a media marcha.',           cost: [200, 300, 500, 900, 1500, 2500] },
  gotera:  { name: 'Tubería del techo',     effect: 'Gotea agua: te baja el ánimo cada día.',  cost: [150, 250, 400, 700, 1200, 2000] },
  aire:    { name: 'Aire acondicionado',    effect: 'Hace calor: te cansas el doble.',         cost: [0, 0, 400, 700, 1200, 2000], room: 2 },
};
