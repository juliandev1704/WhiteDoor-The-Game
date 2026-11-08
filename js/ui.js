'use strict';
/* =========================================================
   WHITE DOOR — Interfaz (menús, ventanas, avisos)
   ========================================================= */
const $ = sel => document.querySelector(sel);

const OFFER_MSGS = [
  'Escuché tus beats y me encantaron. ¿Hacemos algo juntos?',
  'Necesito un productor con tu estilo para mi próximo sencillo.',
  'Mi manager dice que eres el indicado. ¿Te animas?',
  'Tengo una letra brutal, solo me falta tu magia.',
  'Vi lo que hiciste con tu última canción. ¡Quiero ese sonido!',
  'Dicen que detrás de la puerta blanca nacen los hits.',
  'Quiero algo que la gente no pueda dejar de escuchar.',
];

const UI = {
  _bub: { cre: 0, tec: 0, noise: 0 },

  /* ---------- Ventanas modales ---------- */
  modal(title, html, opts = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal ${opts.wide ? 'wide' : ''}">
      <div class="modal-head"><h2>${title}</h2>${opts.noClose ? '' : '<button class="x" data-x aria-label="Cerrar">X</button>'}</div>
      <div class="modal-body">${html}</div></div>`;
    $('#modal-root').appendChild(wrap);
    G.modals++;
    const m = {
      el: wrap, body: wrap.querySelector('.modal-body'),
      close() {
        if (!wrap.parentNode) return;
        wrap.remove(); G.modals--;
        if (opts.onClose) opts.onClose();
        UI.refresh();
      },
      set(h) { this.body.innerHTML = h; },
    };
    if (!opts.noClose) {
      wrap.querySelector('[data-x]').addEventListener('click', () => { SFX.click(); m.close(); });
      wrap.addEventListener('mousedown', e => { if (e.target === wrap) m.close(); });
    }
    return m;
  },

  tabs(list, cur) {
    return `<div class="tabs">${list.map(([k, label]) => `<button class="tab ${k === cur ? 'on' : ''}" data-tab="${k}">${label}</button>`).join('')}</div>`;
  },

  toast(msg, kind = '') {
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => el.classList.add('out'), 4200);
    setTimeout(() => el.remove(), 4800);
    while ($('#toasts').children.length > 5) $('#toasts').firstChild.remove();
  },

  /* ---------- Barra superior ---------- */
  refresh() {
    const s = G.s;
    if (!s) return;
    $('#t-date').textContent = dateLabel(s);
    const mo = $('#t-money');
    mo.textContent = fmtMoney(s.money);
    mo.classList.toggle('neg', s.money < 0);
    $('#t-fans').textContent = fmtNum(s.fans);
    $('#t-prestige').textContent = Math.round(s.prestige);
    $('#t-title').textContent = PRODUCER_TITLES[producerTier()];
    $('#t-level').textContent = 'Nv ' + s.level;
    $('#t-xp').style.width = clamp(s.xp / xpNeeded(s.level) * 100, 0, 100) + '%';
    $('#t-trend').textContent = 'Tendencia: ' + GENRES[s.trend.genre].name;
    const ib = $('#b-inbox .badge');
    ib.textContent = s.offers.length; ib.hidden = !s.offers.length;
    const lb = $('#b-label .badge');
    const unhappy = s.roster.filter(a => a.mood < 25 || a.energy < 15).length;
    lb.textContent = unhappy; lb.hidden = !unhappy;
    $('#b-city span').textContent = s.loc === 'city' ? 'Ir al estudio' : 'Ciudad';
    $('#b-city').dataset.short = s.loc === 'city' ? 'Estudio' : 'Ciudad';
    $('#dpad').hidden = !(TOUCH && s.loc === 'city');
    this.updateNeeds(); this.updateNav();
    const pb = $('#b-producer .badge');
    pb.textContent = s.skillPts; pb.hidden = !s.skillPts;
    document.querySelectorAll('[data-speed]').forEach(b => {
      const v = +b.dataset.speed;
      b.classList.toggle('on', v === 0 ? G.paused : (!G.paused && G.speed === v));
    });
    this.updateDev();
  },

  updateDev() {
    const s = G.s, dp = $('#devpanel');
    if (s && s.dev) {
      const d = s.dev;
      const total = d.weeksTotal + d.extra;
      const polishing = d.prog > d.weeksTotal;
      dp.hidden = false;
      const why = d.finished ? '' : s.loc !== 'studio' ? 'En pausa: estás fuera del estudio' : s.broken.pc ? 'En pausa: el computador está dañado' : '';
      dp.innerHTML = `<div class="dp-title">"${esc(d.name)}"</div>
        <div class="dp-sub">${GENRES[d.genre].name} · ${polishing ? 'Puliendo mezcla' : 'Fase: ' + PHASES[d.phase].name}${d.artist ? ' · ' + esc(d.artist.name) : ''}</div>
        ${why ? `<div class="dp-warn">${why}</div>` : ''}
        <div class="bar"><div class="fill" style="width:${(d.prog / total * 100).toFixed(1)}%"></div></div>
        ${coproducers().length ? `<div class="dp-copro">Co-producen: ${coproducers().map(a => esc(a.name)).join(', ')} (+${coproBonus(d.genre).toFixed(0)} pts/sem)</div>` : ''}
        <div class="dp-stats"><span class="c-cre">CRE ${Math.round(d.cre)}</span><span class="c-tec">TEC ${Math.round(d.tec)}</span><span class="c-noise">RUIDO ${Math.round(d.noise)}</span></div>`;
    } else if (s && s.study) {
      const c = COURSE_BY_ID[s.study.id];
      dp.hidden = false;
      dp.innerHTML = `<div class="dp-title">Estudiando</div><div class="dp-sub">${c.name}</div>
        <div class="bar study"><div class="fill" style="width:${((s.study.total - s.study.left) / s.study.total * 100).toFixed(0)}%"></div></div>
        <div class="dp-stats"><span>Faltan ${s.study.left} semana${s.study.left === 1 ? '' : 's'}</span></div>`;
    } else dp.hidden = true;
  },

  /* ---------- Burbujas de puntos ---------- */
  bubble(kind, v) { this._bub[kind] += v; },
  flushBubbles() {
    if (!G.s || !G.s.dev || G.s.loc !== 'studio' || G.s.view) { this._bub = { cre: 0, tec: 0, noise: 0 }; return; }
    const L = layout(G.s);
    let i = 0;
    for (const k of ['cre', 'tec', 'noise']) {
      const v = this._bub[k];
      if (Math.abs(v) < 0.6) continue;
      this._bub[k] = 0;
      const el = document.createElement('div');
      el.className = 'bubble b-' + k;
      el.textContent = (v > 0 ? '+' : '') + Math.round(v);
      el.style.left = ((L.cx + (i - 1) * 16 + rnd(-4, 4)) / SCENE_W * 100) + '%';
      el.style.top = (88 / SCENE_H * 100) + '%';
      $('#fx').appendChild(el);
      el.addEventListener('animationend', () => el.remove());
      SFX.pop(k);
      i++;
    }
  },

  /* =========================================================
     NUEVA CANCIÓN
     ========================================================= */
  newSong(offerId) {
    const err = canStartSong();
    if (err) { this.toast(err, 'bad'); return; }
    const s = G.s;
    const offer = offerId ? s.offers.find(o => o.id === offerId) : null;
    if (offer && !s.genres.includes(offer.artist.genre)) {
      this.toast(`Primero aprende ${GENRES[offer.artist.genre].name} en la Academia.`, 'bad'); return;
    }
    const cfg = {
      name: randomSongName(),
      genre: offer ? offer.artist.genre : (s.genres.includes(s.trend.genre) ? s.trend.genre : s.genres[0]),
      topic: pick(s.topics), size: 'sencillo',
      sliders: [[50, 50, 50], [50, 50, 50], [50, 50, 50]],
      offerId: offer ? offer.id : null, rosterId: null,
    };
    const rosterOK = s.roster.filter(a => a.task !== 'gira');
    const m = this.modal(offer ? `Contrato con ${esc(offer.artist.name)}` : 'Nueva canción', '', { wide: true });
    let step = 1;

    const comboHint = () => {
      const k = s.combosKnown[cfg.genre + '|' + cfg.topic];
      const g = GENRES[cfg.genre].name, t = TOPICS[cfg.topic].name;
      let h = k ? `${g} + ${t}: <b class="k-${k}">${COMBO_LABEL[k]}</b>` : `${g} + ${t}: <b>???</b> <span class="muted">(lo descubrirás al lanzarla)</span>`;
      if (s.trend.genre === cfg.genre) h += ` <span class="tag trend">¡${g} está de moda!</span>`;
      if (s.lastCombo === cfg.genre + '|' + cfg.topic) h += ` <span class="tag bad">Repetida</span>`;
      return h;
    };

    const step1 = () => `
      ${offer ? `<div class="artist-line"><img class="portrait sm" src="${portraitURL(offer.artist.look)}"><div><b>${esc(offer.artist.name)}</b><br><span class="muted">${ARTIST_TIERS[offer.artist.tier].name} · ${fmtNum(offer.artist.fans)} fans · pide nota ${offer.minScore}+</span></div></div>` : ''}
      ${!offer && rosterOK.length ? `<div class="field"><label>Artista</label><div class="chips">
        <button class="chip ${!cfg.rosterId ? 'on' : ''}" data-roster="0">White Door (tú)</button>
        ${rosterOK.map(a => `<button class="chip ${cfg.rosterId === a.id ? 'on' : ''}" data-roster="${a.id}" ${s.genres.includes(a.genre) ? '' : 'disabled'}>${esc(a.name)} · ${GENRES[a.genre].name}</button>`).join('')}
      </div></div>` : ''}
      <div class="field"><label>Nombre de la canción</label>
        <div class="row"><input id="ns-name" maxlength="32" value="${esc(cfg.name)}"><button class="btn small" data-a="dice">Aleatorio</button></div></div>
      <div class="field"><label>Género${offer || cfg.rosterId ? ' (el del artista)' : ''}</label><div class="chips">
        ${s.genres.map(g => `<button class="chip ${cfg.genre === g ? 'on' : ''}" data-genre="${g}" ${(offer || cfg.rosterId) && g !== cfg.genre ? 'disabled' : ''} style="--gc:${GENRES[g].color}"><i></i>${GENRES[g].name}${s.trend.genre === g ? ' ▲' : ''}</button>`).join('')}
      </div></div>
      <div class="field"><label>Tema</label><div class="chips">
        ${s.topics.map(t => { const k = s.combosKnown[cfg.genre + '|' + t]; return `<button class="chip ${cfg.topic === t ? 'on' : ''} ${k ? 'k-' + k : ''}" data-topic="${t}">${TOPICS[t].name}</button>`; }).join('')}
      </div></div>
      <div class="field"><label>Formato</label><div class="chips">
        ${Object.entries(SIZES).map(([k, z]) => { const locked = z.flag && !s.flags[z.flag]; return `<button class="chip ${cfg.size === k ? 'on' : ''}" data-size="${k}" ${locked ? 'disabled' : ''}>${z.name} · ${z.weeks} sem${z.cost ? ' · ' + fmtMoney(z.cost) : ''}${locked ? ' 🔒' : ''}</button>`; }).join('')}
      </div></div>
      <div class="combo-hint">${comboHint()}</div>
      ${s.roster.some(a => a.task === 'coproducir') ? `<p class="muted small">Co-productores: ${s.roster.filter(a => a.task === 'coproducir').map(a => esc(a.name)).join(', ')} (+${coproBonus(cfg.genre).toFixed(1)} puntos por semana)</p>` : ''}
      <div class="row end"><button class="btn" data-a="cancel">Cancelar</button><button class="btn primary" data-a="next">Siguiente ▶</button></div>`;

    const step2 = () => {
      const g = GENRES[cfg.genre], known = s.insights[cfg.genre] || [];
      return `<p class="muted">Reparte tu enfoque en cada fase. Descubre qué áreas son clave para <b style="color:${g.color}">${g.name}</b> lanzando canciones.</p>
        ${PHASES.map((ph, p) => `<div class="phase"><h3>Fase ${p + 1}: ${ph.name}</h3>
          ${[0, 1, 2].map(i => {
            const idx = p * 3 + i, kn = known.includes(idx);
            return `<div class="srow"><span class="aname">${AREAS[idx].name}</span>
              <input type="range" min="0" max="100" step="5" value="${cfg.sliders[p][i]}" data-p="${p}" data-i="${i}">
              <span class="pct" id="pct-${p}-${i}"></span>
              <span class="ins ${kn ? 'w' + g.w[idx] : ''}">${kn ? importanceLabel(g.w[idx]) : '?'}</span></div>`;
          }).join('')}</div>`).join('')}
        <div class="row end"><button class="btn" data-a="back">◀ Atrás</button><button class="btn primary" data-a="start">¡A producir!</button></div>`;
    };

    const pcts = () => {
      for (let p = 0; p < 3; p++) {
        const sum = cfg.sliders[p].reduce((a, c) => a + c, 0) || 1;
        for (let i = 0; i < 3; i++) { const el = $('#pct-' + p + '-' + i); if (el) el.textContent = Math.round(cfg.sliders[p][i] / sum * 100) + '%'; }
      }
    };
    const render = () => { m.set(step === 1 ? step1() : step2()); if (step === 2) pcts(); };

    m.body.addEventListener('input', e => {
      if (e.target.id === 'ns-name') cfg.name = e.target.value;
      if (e.target.type === 'range') { cfg.sliders[+e.target.dataset.p][+e.target.dataset.i] = +e.target.value; pcts(); }
    });
    m.body.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      SFX.click();
      if (b.dataset.roster !== undefined) {
        const r = s.roster.find(a => a.id === +b.dataset.roster);
        cfg.rosterId = r ? r.id : null; if (r) cfg.genre = r.genre; render();
      }
      else if (b.dataset.genre) { cfg.genre = b.dataset.genre; render(); }
      else if (b.dataset.topic) { cfg.topic = b.dataset.topic; render(); }
      else if (b.dataset.size) { cfg.size = b.dataset.size; render(); }
      else if (b.dataset.a === 'dice') { cfg.name = randomSongName(); render(); }
      else if (b.dataset.a === 'cancel') m.close();
      else if (b.dataset.a === 'next') { step = 2; render(); }
      else if (b.dataset.a === 'back') { step = 1; render(); }
      else if (b.dataset.a === 'start') {
        cfg.name = (cfg.name || '').trim() || randomSongName();
        const e2 = startSong(cfg);
        if (e2) { this.toast(e2, 'bad'); return; }
        m.close();
        this.toast(`¡Empezaste a producir "${cfg.name}"!`, 'good');
      }
    });
    render();
  },

  devFinished() {
    const d = G.s.dev;
    const pts = d.cre + d.tec, nr = d.noise / Math.max(1, pts);
    const m = this.modal(`"${esc(d.name)}" está lista`, `
      <div class="stats3">
        <div class="stat c-cre">Creatividad<b>${Math.round(d.cre)}</b></div>
        <div class="stat c-tec">Técnica<b>${Math.round(d.tec)}</b></div>
        <div class="stat c-noise">Ruido<b>${Math.round(d.noise)}</b></div>
      </div>
      <p>${nr > 0.15 ? 'Se escucha bastante ruido en la mezcla. Pulirla una semana más mejorará la calidad.' : nr > 0.05 ? 'Queda un poco de ruido. Puedes pulirla o lanzarla ya.' : 'La mezcla suena limpia. ¡Lista para el mundo!'}</p>
      <div class="row end"><button class="btn" data-a="polish">Pulir 1 semana</button><button class="btn primary" data-a="release">¡Lanzar!</button></div>`, { noClose: true });
    m.body.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      SFX.click();
      if (b.dataset.a === 'polish') { polishSong(); m.close(); }
      if (b.dataset.a === 'release') { const r = releaseSong(); m.close(); this.review(r); }
    });
  },

  review(r) {
    const so = r.song;
    const verdict = r.avg >= 9 ? '¡OBRA MAESTRA!' : r.avg >= 7.5 ? '¡Un éxito!' : r.avg >= 6 ? 'Buena recepción' : r.avg >= 4 ? 'Recepción tibia' : 'Un fracaso...';
    const li = arr => arr.map(x => `<li>${esc(x)}</li>`).join('');
    const m = this.modal('Reseñas', `
      <div class="review-head"><div class="rv-name">"${esc(so.name)}"</div>
        <div class="muted">${GENRES[so.genre].name} · ${TOPICS[so.topic].name} · ${SIZES[so.size].name}${so.artist ? ' · con ' + esc(so.artist) : ''}</div></div>
      <div class="critics">${r.critics.map((c, i) => `<div class="critic" id="cr-${i}"><div class="cname">${c.name}</div><div class="cscore">?</div></div>`).join('')}</div>
      <div class="verdict" id="rv-verdict" hidden><span class="avg">${r.avg.toFixed(1)}</span><span class="vtext">${verdict}</span></div>
      <div id="rv-details" hidden>
        ${r.insights.length ? `<h4>Descubriste</h4><ul class="ins-list">${li(r.insights)}</ul>` : ''}
        ${r.tips.length ? `<h4>Comentarios</h4><ul class="tip-list">${li(r.tips)}</ul>` : ''}
        <h4>Resultados</h4><ul class="rew-list">${li(r.rewards)}</ul>
        <div class="row end"><button class="btn primary" data-a="ok">Continuar</button></div>
      </div>`, { noClose: true });
    r.critics.forEach((c, i) => setTimeout(() => {
      const el = m.el.querySelector('#cr-' + i);
      if (!el) return;
      el.querySelector('.cscore').textContent = c.score;
      el.classList.add(c.score >= 8 ? 'hi' : c.score >= 5 ? 'mid' : 'lo', 'show');
      SFX.review(c.score);
    }, 500 + i * 650));
    setTimeout(() => {
      const v = m.el.querySelector('#rv-verdict'), d = m.el.querySelector('#rv-details');
      if (!v) return;
      v.hidden = false; d.hidden = false;
      if (r.avg >= 7.5) SFX.fanfare(); else if (r.avg < 4) SFX.bad();
    }, 500 + 4 * 650);
    m.body.addEventListener('click', e => {
      if (e.target.closest('[data-a="ok"]')) {
        SFX.click(); m.close();
        if (r.levels) this.levelUp();
      }
    });
  },

  levelUp() {
    const s = G.s;
    SFX.level();
    const m = this.modal('¡Subiste de nivel!', `
      <div class="center big-num">Nivel ${s.level}</div>
      <p class="center">Tienes <b>${s.skillPts}</b> punto${s.skillPts === 1 ? '' : 's'} de habilidad para mejorar como productor.</p>
      <div class="row end"><button class="btn" data-a="later">Luego</button><button class="btn primary" data-a="go">Mejorar habilidades</button></div>`);
    m.body.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      m.close(); if (b.dataset.a === 'go') this.producer();
    });
  },

  /* =========================================================
     BANDEJA DE ENTRADA
     ========================================================= */
  inbox() {
    const s = G.s;
    const m = this.modal('Bandeja de entrada', '', { wide: true });
    const render = () => {
      if (!s.offers.length) {
        m.set(`<div class="empty">${iconImg('mail', 'xl')}<p>No tienes mensajes nuevos.</p>
          <p class="muted">Con más prestigio y un mejor estudio, te escribirán artistas cada vez más famosos.</p></div>`);
        return;
      }
      const busy = !!(s.dev || s.study);
      m.set((busy ? `<p class="warn">Estás ocupado. Termina lo que estás haciendo para aceptar un contrato.</p>` : '') +
        s.offers.map(o => {
          const a = o.artist, locked = !s.genres.includes(a.genre);
          return `<div class="offer">
            <img class="portrait" src="${portraitURL(a.look)}" alt="">
            <div class="offer-info">
              <div class="oname">${esc(a.name)} ${a.returning ? '<span class="tag good">Regresa</span>' : ''} <span class="tag tier${a.tier}">${ARTIST_TIERS[a.tier].name}</span></div>
              <div class="muted">${fmtNum(a.fans)} fans · ${GENRES[a.genre].name}</div>
              <div class="msg">"${OFFER_MSGS[o.id % OFFER_MSGS.length]}"</div>
              <div class="terms">Pago: <b>${fmtMoney(o.fee)}</b> · Bono +50% con nota ≥ ${o.minScore} · Expira en ${o.left} sem</div>
              ${locked ? `<div class="warn">Necesitas aprender ${GENRES[a.genre].name} en la Academia.</div>` : ''}
            </div>
            <div class="offer-actions">
              <button class="btn primary small" data-accept="${o.id}" ${locked || busy ? 'disabled' : ''}>Aceptar</button>
              <button class="btn small" data-reject="${o.id}">Rechazar</button>
            </div></div>`;
        }).join(''));
    };
    m.body.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      SFX.click();
      if (b.dataset.accept) { m.close(); this.newSong(+b.dataset.accept); }
      if (b.dataset.reject) { s.offers = s.offers.filter(o => o.id !== +b.dataset.reject); render(); this.refresh(); }
    });
    render();
  },

  /* =========================================================
     TIENDA
     ========================================================= */
  bonusText(it) {
    const out = [];
    if (it.p) { if (it.p[0]) out.push(`Comp +${it.p[0]}`); if (it.p[1]) out.push(`Grab +${it.p[1]}`); if (it.p[2]) out.push(`Prod +${it.p[2]}`); }
    if (it.spd && it.spd > 1) out.push(`Velocidad x${it.spd}`);
    if (it.noise) out.push('Menos ruido');
    if (it.amb) out.push(`Ambiente +${it.amb}`);
    return out.join(' · ');
  },
  card(it, state, attr, online) {
    const s = G.s;
    const price = Math.round(it.price * (online ? 1.2 : 1));
    let right;
    if (state === 'owned') right = '<span class="ok">✓ Tuyo</span>';
    else if (state === 'locked') right = `<span class="warn small">Requiere<br>${ROOMS[it.room].name}</span>`;
    else right = `<button class="btn primary small" ${attr} ${s.money < price ? 'disabled' : ''}>${fmtMoney(price)}</button>`;
    return `<div class="card ${state}">${iconImg(it.icon)}<div class="cinfo"><b>${it.name}</b>
      <div class="muted">${it.desc}</div><div class="bonus">${this.bonusText(it)}</div></div><div class="cbuy">${right}</div></div>`;
  },

  shop(tab = 'equipo', online = false) {
    const s = G.s;
    let cur = tab;
    const m = this.modal(online ? 'Tienda online (+20% envío)' : 'Tienda de música Do Re Mi', '', { wide: true });
    const render = () => {
      let h = this.tabs([['equipo', 'Equipo'], ['inst', 'Instrumentos'], ['soft', 'Software']], cur) + `<div class="money-line">Dinero: <b>${fmtMoney(s.money)}</b></div>`;
      if (cur === 'equipo') {
        for (const cat of Object.keys(EQUIP)) {
          h += `<h3>${EQUIP_CATS[cat]} <span class="muted small">Actual: ${EQUIP[cat][s.equip[cat]].name}</span></h3><div class="grid">`;
          EQUIP[cat].forEach((it, tier) => {
            if (tier === 0) return;
            const state = tier <= s.equip[cat] ? 'owned' : (it.room && s.room < it.room ? 'locked' : 'buy');
            h += this.card(it, state, `data-equip="${cat}:${tier}"`, online);
          });
          h += '</div>';
        }
      } else {
        h += '<div class="grid">' + GEAR.filter(g => g.cat === cur).map(it => {
          const state = s.items.includes(it.id) ? 'owned' : (it.room && s.room < it.room ? 'locked' : 'buy');
          return this.card(it, state, `data-item="${it.id}"`, online);
        }).join('') + '</div>';
      }
      m.set(h);
    };
    m.body.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.tab) { SFX.click(); cur = b.dataset.tab; render(); return; }
      let err = null, name = '';
      if (b.dataset.equip) { const [c, t] = b.dataset.equip.split(':'); err = buyEquip(c, +t, online); name = EQUIP[c][+t].name; }
      else if (b.dataset.item) { err = buyItem(b.dataset.item, online); name = GEAR_BY_ID[b.dataset.item].name; }
      else return;
      if (err) { this.toast(err, 'bad'); SFX.bad(); }
      else { this.toast(`Compraste: ${name}`, 'good'); SFX.coin(); }
      render(); this.refresh();
    });
    render();
  },

  /* =========================================================
     ESTUDIO (habitación y decoración)
     ========================================================= */
  studio(tab = 'espacio') {
    const s = G.s;
    let cur = tab;
    const m = this.modal('Mi estudio', '', { wide: true });
    const render = () => {
      const b = bonuses();
      let h = this.tabs([['espacio', 'Espacio'], ['deco', 'Decoración']], cur) +
        `<div class="money-line">Dinero: <b>${fmtMoney(s.money)}</b> · Ambiente: <b>${b.amb}</b> (+${(b.amb * 0.8).toFixed(0)}% productividad)</div>`;
      if (cur === 'espacio') {
        h += '<div class="grid">' + ROOMS.map((r, i) => {
          let right;
          if (i === s.room) right = '<span class="ok">✓ Actual</span>';
          else if (i < s.room) right = '<span class="muted">Superado</span>';
          else if (i === s.room + 1) right = `<button class="btn primary small" data-room="${i}" ${s.money < r.price ? 'disabled' : ''}>${fmtMoney(r.price)}</button>`;
          else right = `<span class="muted small">${fmtMoney(r.price)}<br>Mejora el anterior</span>`;
          return `<div class="card ${i <= s.room ? 'owned' : ''}">${iconImg('house')}<div class="cinfo"><b>${r.name}</b>
            <div class="muted">${r.desc}</div><div class="bonus">Arriendo ${fmtMoney(r.rent)}/sem · Ambiente +${r.amb} · Artistas hasta nivel ${ARTIST_TIERS[Math.min(5, i + 2)].name}</div></div>
            <div class="cbuy">${right}</div></div>`;
        }).join('') + '</div>';
      } else {
        h += '<div class="grid">' + DECOR.map(it => {
          const state = s.items.includes(it.id) ? 'owned' : (it.room && s.room < it.room ? 'locked' : 'buy');
          return this.card(it, state, `data-item="${it.id}"`);
        }).join('') + '</div>';
      }
      m.set(h);
    };
    m.body.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.tab) { SFX.click(); cur = b.dataset.tab; render(); return; }
      let err, name;
      if (b.dataset.room) { const i = +b.dataset.room; err = buyRoom(i); name = ROOMS[i].name; }
      else if (b.dataset.item) { err = buyItem(b.dataset.item); name = DECOR_BY_ID[b.dataset.item].name; }
      else return;
      if (err) { this.toast(err, 'bad'); SFX.bad(); }
      else {
        SFX.coin();
        if (b.dataset.room) {
          this.toast(`¡Te mudaste a: ${name}!`, 'good');
          if (+b.dataset.room === ROOMS.length - 1) setTimeout(() => this.victory(), 300);
        } else this.toast(`Compraste: ${name}`, 'good');
      }
      render(); this.refresh();
    });
    render();
  },

  /* =========================================================
     ACADEMIA
     ========================================================= */
  academy() {
    const s = G.s;
    const m = this.modal('Academia', '', { wide: true });
    const render = () => {
      let h = s.study ? `<p class="warn">Estás estudiando: ${COURSE_BY_ID[s.study.id].name} (faltan ${s.study.left} sem).</p>` :
        s.dev ? '<p class="warn">Termina tu canción antes de empezar un curso.</p>' :
        '<p class="muted">Mientras estudias no puedes producir, pero el tiempo (y el arriendo) siguen corriendo.</p>';
      h += `<div class="money-line">Dinero: <b>${fmtMoney(s.money)}</b> · Nivel ${s.level}</div>`;
      for (const grp of ['Habilidades', 'Géneros', 'Negocio']) {
        h += `<h3>${grp}</h3><div class="grid">`;
        for (const c of COURSES.filter(x => x.group === grp)) {
          const st = courseStatus(c);
          const desc = c.desc || `Aprende a producir ${GENRES[c.genre].name}`;
          let right;
          if (st === 'done') right = '<span class="ok">✓ Hecho</span>';
          else if (st === 'locked') right = `<span class="muted small">${c.level && s.level < c.level ? 'Nivel ' + c.level : ''}${c.req && !s.courses.includes(c.req) ? '<br>Requiere ' + COURSE_BY_ID[c.req].name : ''}</span>`;
          else right = `<button class="btn primary small" data-course="${c.id}" ${s.money < c.cost || s.study || s.dev ? 'disabled' : ''}>${fmtMoney(c.cost)}</button>`;
          h += `<div class="card ${st === 'done' ? 'owned' : st === 'locked' ? 'locked' : ''}">${iconImg(c.genre ? 'note' : 'book')}
            <div class="cinfo"><b>${c.name}</b><div class="muted">${desc}</div><div class="bonus">${c.weeks} semanas</div></div><div class="cbuy">${right}</div></div>`;
        }
        h += '</div>';
      }
      m.set(h);
    };
    m.body.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled || !b.dataset.course) return;
      const err = enrollCourse(b.dataset.course);
      if (err) { this.toast(err, 'bad'); SFX.bad(); render(); return; }
      SFX.coin();
      this.toast(`Empezaste el curso: ${COURSE_BY_ID[b.dataset.course].name}`, 'good');
      m.close();
    });
    render();
  },

  /* =========================================================
     PRODUCTOR
     ========================================================= */
  producer() {
    const s = G.s;
    const m = this.modal('Productor', '', { wide: true });
    const render = () => {
      const released = s.songs.length;
      const avg = released ? s.songs.reduce((a, x) => a + x.score, 0) / released : 0;
      const best = s.songs.reduce((b, x) => (!b || x.score > b.score ? x : b), null);
      const totStreams = s.songs.reduce((a, x) => a + x.streams, 0);
      const totRev = s.songs.reduce((a, x) => a + x.revenue, 0);
      let h = `<div class="prof">
        <div><div class="pname">${esc(s.producer)}</div><div class="muted">${PRODUCER_TITLES[producerTier()]} · White Door</div></div>
        <div class="plevel">Nivel ${s.level}<div class="xpbar"><div style="width:${clamp(s.xp / xpNeeded(s.level) * 100, 0, 100)}%"></div></div><span class="muted small">${s.xp}/${xpNeeded(s.level)} XP</span></div></div>
        <h3>Habilidades ${s.skillPts ? `<span class="tag good">${s.skillPts} punto${s.skillPts === 1 ? '' : 's'} disponible${s.skillPts === 1 ? '' : 's'}</span>` : ''}</h3>`;
      for (const [k, sk] of Object.entries(SKILLS)) {
        const lv = s.skills[k];
        h += `<div class="skill"><span class="sname">${sk.name}</span>
          <span class="pips">${Array.from({ length: Math.max(10, lv) }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</span>
          <span class="muted small">${sk.desc}</span>
          <button class="btn small primary" data-skill="${k}" ${s.skillPts ? '' : 'disabled'}>+</button></div>`;
      }
      h += `<h3>Estadísticas</h3><div class="statgrid">
        <div>Canciones<b>${released}</b></div><div>Nota promedio<b>${avg.toFixed(1)}</b></div>
        <div>Reproducciones<b>${fmtNum(totStreams)}</b></div><div>Ganancias<b>${fmtMoney(totRev)}</b></div>
        <div>Prestigio<b>${Math.round(s.prestige)}</b></div><div>Mejor canción<b>${best ? esc(best.name) + ' (' + best.score + ')' : '—'}</b></div></div>`;
      h += `<h3>Libreta de combinaciones</h3><p class="muted small">Verde = excelente · Amarillo = normal · Rojo = mala · Se llena al lanzar canciones.</p>
        <div class="combo-table"><table><tr><th></th>${s.topics.map(t => `<th title="${TOPICS[t].name}">${TOPICS[t].name.replace('La ', '').replace('El ', '').slice(0, 4)}</th>`).join('')}</tr>
        ${s.genres.map(g => `<tr><th>${GENRES[g].name}</th>${s.topics.map(t => { const k = s.combosKnown[g + '|' + t]; return `<td class="${k ? 'k-' + k : ''}">${k ? (k === 'good' ? '+' : k === 'bad' ? '−' : '•') : ''}</td>`; }).join('')}</tr>`).join('')}
        </table></div>`;
      m.set(h);
    };
    m.body.addEventListener('click', e => {
      const b = e.target.closest('[data-skill]'); if (!b || b.disabled) return;
      if (s.skillPts > 0) { s.skillPts--; s.skills[b.dataset.skill]++; SFX.coin(); saveGame(); render(); this.refresh(); }
    });
    render();
  },

  /* =========================================================
     DISCOGRAFÍA
     ========================================================= */
  discography() {
    const s = G.s;
    const rows = s.songs.map(so => `<tr>
      <td><b>${esc(so.name)}</b><br><span class="muted small">${so.artist ? 'con ' + esc(so.artist) : 'White Door'} · ${SIZES[so.size].name}</span></td>
      <td>${GENRES[so.genre].name}<br><span class="muted small">${TOPICS[so.topic].name}</span></td>
      <td class="sc ${so.score >= 8 ? 'hi' : so.score >= 5 ? 'mid' : 'lo'}">${so.score.toFixed(1)}</td>
      <td>${fmtNum(so.streams)}</td><td>${fmtMoney(so.revenue)}</td>
      <td>${so.active ? (so.chart ? `<span class="tag good">#${so.chart}</span>` : '<span class="tag">Sonando</span>') : '<span class="muted small">Retirada</span>'}${so.peak ? `<br><span class="muted small">Mejor #${so.peak}</span>` : ''}</td></tr>`).join('');
    this.modal('Discografía', s.songs.length ? `<div class="table-wrap"><table class="disco"><tr><th>Canción</th><th>Género</th><th>Nota</th><th>Reprod.</th><th>Ganancias</th><th>Listas</th></tr>${rows}</table></div>` :
      `<div class="empty">${iconImg('vinyl', 'xl')}<p>Aún no has lanzado canciones.</p><p class="muted">¡Pulsa "Nueva canción" para empezar!</p></div>`, { wide: true });
  },

  /* =========================================================
     MENÚ
     ========================================================= */
  menu() {
    const m = this.modal('Menú', `<div class="menu-list">
      <button class="btn" data-a="save">Guardar partida</button>
      <button class="btn" data-a="online">Tienda online (+20% envío)</button>
      <button class="btn" data-a="academy">Academia online</button>
      <button class="btn" data-a="sound">Efectos: ${SFX.on ? 'ON' : 'OFF'}</button>
      <button class="btn" data-a="music">Música: ${SFX.music ? 'ON' : 'OFF'}</button>
      <button class="btn" data-a="help">Cómo jugar</button>
      <button class="btn" data-a="title">Volver al título</button>
      <button class="btn danger" data-a="wipe">Borrar partida</button></div>
      <p class="muted small center">White Door · Desarrollado por Julian Camilo Forero Daza</p>`);
    m.body.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      SFX.click();
      const a = b.dataset.a;
      if (a === 'save') { saveGame(); this.toast('Partida guardada', 'good'); }
      if (a === 'online') { m.close(); this.shop('equipo', true); }
      if (a === 'academy') { m.close(); this.academy(); }
      if (a === 'sound') { SFX.on = !SFX.on; b.textContent = 'Efectos: ' + (SFX.on ? 'ON' : 'OFF'); }
      if (a === 'music') {
        SFX.music = !SFX.music; b.textContent = 'Música: ' + (SFX.music ? 'ON' : 'OFF');
        if (!SFX.music) SFX.stopMusic(); else if (G.s.dev && !G.s.dev.finished) SFX.startMusic(G.s.dev.genre);
      }
      if (a === 'help') { m.close(); this.help(); }
      if (a === 'title') { saveGame(); m.close(); showTitle(); }
      if (a === 'wipe') {
        askConfirm('Se pierde todo tu progreso y no se puede deshacer.', { title: '¿Borrar tu partida?', ok: 'Borrar', danger: true, icon: 'disk' })
          .then(yes => { if (yes) { deleteSave(); m.close(); showTitle(); } });
      }
    });
  },

  help(first) {
    const s = G.s;
    const m = this.modal(first ? `¡Bienvenido a White Door, ${esc(s.producer)}!` : 'Cómo jugar', `
      <div class="help">
        <p>Tu sueño empieza aquí: un cuarto, una laptop vieja y una <b>puerta blanca</b>. Conviértelo en el estudio más famoso del mundo.</p>
        <ul>
          <li>${iconImg('note')} <b>Nueva canción:</b> elige nombre, género, tema y reparte tu enfoque en las 3 fases. Cada género valora cosas distintas: ¡experimenta!</li>
          <li>${iconImg('mail')} <b>Bandeja:</b> los artistas te escriben para producirles. Te pagan y, si la nota es alta, ¡bono extra!</li>
          <li>${iconImg('door')} <b>Ciudad:</b> sal del estudio y camina (flechas/WASD o clic). Ahí están la tienda, la academia, el café, el club, la radio, bienes raíces, la agencia de talentos y el centro comercial.</li>
          <li>${iconImg('fans')} <b>Vida:</b> duerme, come y relájate. Si descuidas tus necesidades rindes menos y puedes terminar en el hospital. ¡Y toma decisiones de vida!</li>
          <li>${iconImg('gold')} <b>Sello:</b> funda White Door Records, firma artistas, entrénalos y ponlos a grabar, girar o ayudarte a producir.</li>
          <li>${iconImg('pc')} <b>Personal:</b> compra una Oficina y contrata asistentes, ingenieros, productores y mánagers. Los verás trabajar en tu estudio.</li>
        </ul>
        <p class="muted">Las cosas se dañan: repáralas tú o llama a un técnico. Cada semana pagas arriendo y salarios; con 12 semanas en números rojos, quiebras. Usa las flechas ◀ ▶ de la pantalla para recorrer los cuartos de tu estudio.</p>
        <div class="row end"><button class="btn primary" data-a="ok">${first ? '¡A producir!' : 'Entendido'}</button></div>
      </div>`, { wide: true });
    m.body.addEventListener('click', e => { if (e.target.closest('[data-a="ok"]')) { SFX.click(); m.close(); } });
  },

  victory() {
    SFX.fanfare();
    const m = this.modal('¡Leyenda!', `<div class="center">${iconImg('gold', 'xl')}
      <p>White Door Records HQ abrió sus puertas. Pasaste de un cuarto con una laptop vieja a tener tu propio sello discográfico.</p>
      <p><b>${esc(G.s.producer)}</b>, eres una leyenda de la música.</p>
      <p class="muted">Puedes seguir jugando y produciendo éxitos.</p>
      <button class="btn primary" data-a="ok">Seguir jugando</button></div>`);
    m.body.addEventListener('click', e => { if (e.target.closest('button')) m.close(); });
  },

  gameOver() {
    G.running = false;
    SFX.stopMusic(); SFX.bad();
    deleteSave();
    const s = G.s;
    const m = this.modal('Bancarrota', `<div class="center">
      <p>Pasaste 12 semanas en números rojos y tuviste que cerrar la puerta blanca...</p>
      <p class="muted">Llegaste a la semana ${s.week}, lanzaste ${s.songs.length} canciones y reuniste ${fmtNum(s.fans)} fans.</p>
      <button class="btn primary" data-a="ok">Volver a empezar</button></div>`, { noClose: true });
    m.body.addEventListener('click', e => { if (e.target.closest('button')) { m.close(); showTitle(); } });
  },
};

/* ---------- Confirmación con el estilo del juego (reemplaza confirm() del navegador) ---------- */
function askConfirm(text, { title = '¿Seguro?', ok = 'Sí', cancel = 'Cancelar', danger = false, icon = 'door' } = {}) {
  return new Promise(resolve => {
    const wrap = document.createElement('div');
    wrap.className = 'ask-wrap';
    wrap.innerHTML = `<div class="ask" role="alertdialog" aria-modal="true" aria-labelledby="ask-t">
      <div class="ask-ico">${iconImg(icon, 'lg')}</div>
      <h2 id="ask-t">${title}</h2><p>${text}</p>
      <div class="ask-btns"><button class="btn" data-v="0">${cancel}</button><button class="btn ${danger ? 'danger' : 'primary'}" data-v="1">${ok}</button></div></div>`;
    document.body.appendChild(wrap);
    G.modals++;
    const done = v => {
      G.modals = Math.max(0, G.modals - 1);
      document.removeEventListener('keydown', key, true);
      wrap.remove(); resolve(v);
    };
    const key = e => {
      if (e.key === 'Escape') { e.stopPropagation(); done(false); }
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); done(true); }
    };
    document.addEventListener('keydown', key, true);
    wrap.addEventListener('click', e => {
      const b = e.target.closest('[data-v]');
      if (b) { SFX.click(); done(b.dataset.v === '1'); }
      else if (e.target === wrap) done(false);
    });
    setTimeout(() => wrap.querySelector('[data-v="1"]').focus(), 30);
  });
}
