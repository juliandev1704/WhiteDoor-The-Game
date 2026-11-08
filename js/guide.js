'use strict';
/* =========================================================
   WHITE DOOR — Pantalla de carga, creación del personaje
   (nombre y género) y ayuda dentro de cada menú
   ========================================================= */

/* ---------- Género ---------- */
const GENDERS = { h: 'Hombre', m: 'Mujer', x: 'Otro' };
function gWord(masc, fem, neu, s = G.s) {
  const g = s && s.gender;
  return g === 'm' ? fem : g === 'x' ? (neu || masc) : masc;
}
function producerTitle(i, s = G.s) {
  const t = PRODUCER_TITLES[i];
  return s && s.gender === 'm' ? t.replace(/^Productor\b/, 'Productora') : t;
}

/* ---------- Ayuda de cada menú ---------- */
const MENU_HELP = [
  [/^Nueva canción|^Contrato con/, 'Ponle nombre, elige género, tema y formato. Luego reparte tu enfoque entre las 3 fases: cada género valora áreas distintas y vas descubriendo cuáles pesan más con las reseñas. Solo avanza mientras estás en el estudio.'],
  [/^Bandeja/, 'Artistas que quieren que les produzcas. Te pagan una parte al aceptar y el resto al lanzar; si superas la nota que piden, hay bono. Las ofertas vencen.'],
  [/^Tienda de música|^Tienda online/, 'Mejor equipo = más puntos por semana y menos ruido. Los instrumentos y el software suben fases específicas. En línea cuesta 20% más por el envío.'],
  [/^Academia/, 'Cursos que suben tus habilidades o desbloquean géneros y temas. Mientras estudias no produces.'],
  [/^Productor$/, 'Tus estadísticas. Cada nivel te da un punto de habilidad para Composición, Grabación, Producción o Manitas (reparar cosas tú mismo).'],
  [/^Discografía/, 'Todo lo que has lanzado: nota, reproducciones, ingresos y puesto en las listas.'],
  [/^Objetivos/, 'Metas con recompensa. Cuando completes una, reclámala aquí. El siguiente capítulo se abre al reclamar el 60% del anterior.'],
  [/^Trabajos/, 'Formas extra de ganar dinero: beats, clases, mezclas y sample packs en el estudio; DJ en el club y jingles en la radio. El merch se vende solo según tu éxito actual.'],
  [/^Banco Pixel/, 'Ahorros: ganan intereses y nadie te los roba. CDT: congelas plata por más interés. Crédito: cuota semanal automática; si dejas de pagar 4 cuotas te embargan. DIAN: cuánto pagarás de impuestos.'],
  [/^Tu séquito/, 'Gente que anda contigo y te da beneficios, pero cobra cada semana. Más prestigio = más cupos.'],
  [/^Personalizar/, 'Cambia tu piel, pelo y peinado gratis. La ropa y los accesorios se compran una vez y te los pones cuando quieras.'],
  [/^Bienes Raíces/, 'Mudarte a un espacio mejor sube el ambiente y abre cupos para módulos (oficina, cabina, ensayo, lounge, dormitorio). El arriendo también sube.'],
  [/^Centro Comercial/, 'Decoración para el ambiente del estudio, ropa, objetos personales y viajes para recargarte.'],
  [/^Agencia de Talentos/, 'Contrata personal (necesitas una Oficina) y artistas para tu sello.'],
  [/^White Door Records|^Sello/, 'Funda tu sello, firma artistas y asígnales tareas: entrenar, grabar, girar o co-producir contigo.'],
  [/^Tu equipo/, 'Tu personal trabaja solo cada semana. Vigila los sueldos: se cobran aunque no tengas canciones sonando.'],
  [/^La vida de/, 'Energía, hambre y ánimo bajan con los días. Si una llega a cero rindes menos y tu salud cae. Activa la rutina automática para que comas y duermas solo.'],
  [/^Tienda 24\/7/, 'Cosas que te suben una necesidad ya, pero casi todas tienen un costo después: cansancio, resaca, salud o ansiedad. Mira la letra pequeña.'],
  [/^Bolsa Pixel/, 'Acciones: los precios suben y bajan cada semana, puedes ganar o perder. Negocios: los compras una vez y te dejan ingresos semanales.'],
  [/^Café|^Club|^Radio|^Parque/, 'Actividades del lugar. Cada una gasta tiempo y cambia tus necesidades.'],
];
function helpFor(title) { const h = MENU_HELP.find(([re]) => re.test(title)); return h ? h[1] : null; }

(function () {
  const baseModal = UI.modal;
  UI.modal = function (title, html, opts = {}) {
    const m = baseModal.call(this, title, html, opts);
    const help = typeof title === 'string' && helpFor(title.replace(/<[^>]+>/g, ''));
    const s = G.s;
    if (help && s) {
      const key = MENU_HELP.find(([re]) => re.test(title))[0].source;
      const L = s.life; L.seenHelp = L.seenHelp || {};
      const head = m.el.querySelector('.modal-head');
      const box = document.createElement('div');
      box.className = 'modal-help';
      box.innerHTML = `<b>¿Cómo funciona?</b> ${help}`;
      box.hidden = !!L.seenHelp[key];
      head.insertAdjacentElement('afterend', box);
      const btn = document.createElement('button');
      btn.className = 'help-btn'; btn.textContent = '?'; btn.title = 'Cómo funciona';
      btn.setAttribute('aria-label', 'Cómo funciona este menú');
      btn.addEventListener('click', () => { box.hidden = !box.hidden; SFX.click(); });
      const x = head.querySelector('[data-x]');
      if (x) head.insertBefore(btn, x); else head.appendChild(btn);
      L.seenHelp[key] = true;
    }
    return m;
  };

  // Títulos y textos según el género
  const baseRefresh = UI.refresh;
  UI.refresh = function () {
    baseRefresh.call(this);
    if (G.s) $('#t-title').textContent = producerTitle(producerTier());
  };

  /* ---------- Creación del personaje ---------- */
  let gender = 'h';
  const nameIn = $('#title-name');
  document.querySelectorAll('#title-gender [data-g]').forEach(b => b.addEventListener('click', () => {
    gender = b.dataset.g; SFX.init(); SFX.click();
    document.querySelectorAll('#title-gender [data-g]').forEach(x => x.classList.toggle('on', x === b));
  }));
  // Botón Empezar de la creación del personaje: nombre, género y preferencias de pareja
  $('#btn-start').addEventListener('click', () => {
    const name = nameIn.value.trim();
    if (!name) { nameIn.focus(); nameIn.classList.add('need'); $('#title-err').hidden = false; return; }
    if (hasSave() && !confirm('Ya tienes una partida guardada. ¿Empezar una nueva? (Se perderá la anterior)')) return;
    const st = newState(name);
    st.gender = gender;
    lookState(st);
    if (gender === 'm') st.life.look.style = 1;
    st.life.pref = titlePrefs();
    startGame(st, true);
  });
  nameIn.addEventListener('input', () => { nameIn.classList.remove('need'); $('#title-err').hidden = true; });

  // Sin la ventana grande de instrucciones al empezar: la ayuda está en cada menú
  const baseHelp = UI.help;
  UI.help = function (first) {
    if (!first) return baseHelp.call(this, false);
    const s = G.s;
    this.toast(`¡${gWord('Bienvenido', 'Bienvenida', 'Bienvenide')} a White Door, ${s.producer}! Cada menú tiene su botón ? con instrucciones.`, 'good');
  };

  // El título ya no sugiere nombres
  const baseTitle = showTitle;
  showTitle = function () { baseTitle(); nameIn.value = ''; };
  nameIn.value = '';
})();

/* ---------- Pantalla de carga ---------- */
(function () {
  const el = $('#loader');
  if (!el) return;
  el.querySelector('.ld-door').innerHTML = iconImg('door', 'xl');
  const tips = ['Afinando los instrumentos...', 'Calentando los monitores...', 'Desenredando cables...', 'Alimentando al gato del estudio...', 'Abriendo la puerta blanca...'];
  let i = 0;
  const tipEl = el.querySelector('.ld-tip');
  const tick = setInterval(() => { i = (i + 1) % tips.length; tipEl.textContent = tips[i]; }, 600);
  const t0 = performance.now();
  const done = () => {
    const wait = Math.max(0, 1800 - (performance.now() - t0));
    setTimeout(() => { clearInterval(tick); el.classList.add('out'); setTimeout(() => el.remove(), 500); }, wait);
  };
  const ready = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.race([ready, new Promise(r => setTimeout(r, 3000))]).then(done);
})();
