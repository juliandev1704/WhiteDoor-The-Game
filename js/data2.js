'use strict';
/* =========================================================
   WHITE DOOR v2 — Datos de mundo abierto, vida, discográfica
   ========================================================= */
const DAY_MS = 1000; // un día de juego a velocidad 1x

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
  { id: 'oro',    name: 'Chaqueta dorada', price: 6000, color: '#ffc61a', shade: '#c99510' },
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
