'use strict';
/* =========================================================
   WHITE DOOR — Interfaz v2: ciudad, vida, sello y personal
   ========================================================= */

Object.assign(UI, {
  /* ---------- Cola de eventos (se muestran sin pisarse) ---------- */
  queue(fn) { G.events.push(fn); },
  runQueue() {
    if (!G.running || G.modals > 0 || !G.events.length) return;
    const fn = G.events.shift();
    fn();
  },

  // Ventana de decisión estilo Sims
  choice(ev) {
    const m = this.modal(esc(ev.title), `
      <div class="choice">
        <div class="choice-head">${ev.portrait ? `<img class="portrait" src="${portraitURL(ev.portrait)}" alt="">` : iconImg(ev.icon || 'star', 'xl')}
        <p>${esc(ev.text)}</p></div>
        <div class="choice-opts">${ev.options.map((o, i) => `<button class="opt" data-i="${i}" ${o.disabled ? 'disabled' : ''}>
          <b>${esc(o.label)}</b>${o.desc ? `<span>${esc(o.desc)}</span>` : ''}</button>`).join('')}</div>
      </div>`, { noClose: true });
    SFX.mail();
    m.body.addEventListener('click', e => {
      const b = e.target.closest('.opt'); if (!b || b.disabled) return;
      SFX.click();
      m.close();
      const msg = ev.options[+b.dataset.i].run();
      if (msg) this.toast(msg, 'event');
      saveGame(); this.refresh();
    });
  },

  fade(text) {
    const f = $('#fade');
    f.textContent = text || '';
    f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
  },

  /* ---------- HUD de necesidades ---------- */
  updateNeeds() {
    const s = G.s; if (!s) return;
    for (const k of ['energia', 'hambre', 'animo']) {
      const v = s.needs[k], el = $('#n-' + k);
      el.style.width = v + '%';
      el.className = v < 25 ? 'low' : v < 50 ? 'mid' : '';
      $('#v-' + k).textContent = Math.round(v);
    }
    const h = $('#n-salud');
    h.style.width = s.salud + '%'; h.className = s.salud < 40 ? 'low' : s.salud < 70 ? 'mid' : '';
    $('#v-salud').textContent = Math.round(s.salud);
    $('#needs-actions').hidden = s.loc !== 'studio';
    const insp = $('#n-insp'); insp.hidden = !(s.life.inspired > 0);
  },
  updateNav() {
    const s = G.s; if (!s) return;
    const nav = $('#viewnav');
    if (s.loc !== 'studio' || !s.modules.length) { nav.hidden = true; if (s.view) s.view = 0; return; }
    nav.hidden = false;
    if (s.view > s.modules.length) s.view = 0;
    $('#view-name').textContent = s.view ? MODULES[s.modules[s.view - 1]].name : 'Sala de control';
  },
  cycleView(d) {
    const s = G.s, n = s.modules.length + 1;
    s.view = (s.view + d + n) % n;
    SFX.click(); this.updateNav();
  },

  homeAction(kind) {
    const s = G.s;
    if (s.loc !== 'studio') return;
    let msg;
    if (kind === 'sleep') { this.fade('Zzz...'); msg = doSleep(); }
    if (kind === 'eat') { msg = doEat(); }
    if (kind === 'relax') { this.fade('...'); msg = doRelax(); }
    SFX.click();
    if (msg) this.toast(msg, msg.startsWith('No ') ? 'bad' : 'good');
    saveGame(); this.refresh();
  },

  /* =========================================================
     LUGARES DE LA CIUDAD
     ========================================================= */
  place(id) {
    SFX.init(); SFX.click();
    if (id === 'studio') { enterStudio(); this.fade('White Door'); this.refresh(); return; }
    if (id === 'shop') return this.shop('equipo', false);
    if (id === 'academy') return this.academy();
    if (id === 'realty') return this.realty();
    if (id === 'mall') return this.mall();
    if (id === 'agency') return this.agency();
    if (id === 'bank') return this.bank();
    if (id === 'shop247') return this.shop247();
    if (id === 'stocks') return this.invest();
    this.venue(id);
  },

  venueActions(id) {
    const s = G.s, p = s.life.partner;
    const A = {
      cafe: [
        { label: 'Comer algo rico', desc: '+Hambre, +Ánimo · 2 horas', cost: 45, act: { days: 0.1, hambre: 90, animo: 10 } },
        { label: 'Café y laptop', desc: 'Te inspiras: +15% productividad un buen rato', cost: 15, act: { days: 0.25, animo: 5, energia: 10, inspired: 5 } },
        { label: 'Hacer networking', desc: 'Puedes conseguir un contacto nuevo', cost: 30, act: { days: 0.3, animo: 5 },
          after: () => Math.random() < 0.4 ? (addOffer(), 'Un artista te dejó su número.') : 'Nadie interesante hoy.' },
      ],
      club: [
        { label: 'Salir de fiesta', desc: '+Ánimo mucho, −Energía', cost: 80, act: { days: 0.5, animo: 40, energia: -25, hambre: -10 },
          after: () => {
            if (!p && Math.random() < 0.3) { s.life.partner = newPartner(); return `Bailaste toda la noche con ${s.life.partner.name}. ¡Ahora están saliendo!`; }
            if (Math.random() < 0.25) { addOffer(); return 'Conociste a un artista en la pista.'; }
            return '¡Noche épica!';
          } },
        { label: 'Noche de talentos', desc: 'Audiciones: descubre artistas para tu sello', cost: 200, cond: !!s.label, act: { days: 0.5, energia: -8 },
          after: () => { s.auditions = Array.from({ length: 3 }, () => genRosterCandidate('audition')); this.queue(() => this.signList('Audiciones', () => s.auditions)); return null; } },
        { label: 'Concierto de tu sello', desc: 'Tus artistas tocan en vivo: dinero y fans', cost: 0, cond: s.roster.length > 0, act: { days: 0.5, energia: -10, animo: 15 },
          after: () => {
            let inc = 0;
            for (const a of s.roster) { inc += (100 + Math.pow(a.fans, 0.6)) * a.talent / 50; a.fans += 20 + a.fans * 0.01; a.energy = clamp(a.energy - 10, 0, 100); }
            s.money += inc; s.fans += Math.round(inc * 0.3);
            return `¡Lleno total! Ganaste ${fmtMoney(inc)}.`;
          } },
      ],
      park: [
        { label: 'Relajarte en un banco', desc: '+Ánimo, +Energía', cost: 0, act: { days: 0.3, animo: 25, energia: 5 } },
        { label: 'Buscar inspiración', desc: 'Inspiración duradera: +15% productividad', cost: 0, act: { days: 0.5, animo: 10, inspired: 10 } },
        { label: 'Salir a trotar', desc: '+Salud, +Ánimo, −Energía', cost: 0, act: { days: 0.3, energia: -10, animo: 12, salud: 10 } },
        { label: `Picnic con ${p ? p.name : ''}`, desc: '+Amor, +Ánimo', cost: 40, cond: !!p, act: { days: 0.4, hambre: 40, animo: 20 },
          after: () => { p.love = clamp(p.love + 12, 0, 100); return `${p.name} la pasó increíble.`; } },
      ],
      radio: [
        { label: 'Entrevista en vivo', desc: '+Fans y prestigio (1 vez por mes)', cost: 0, cond: s.prestige >= 120, act: { days: 0.3, energia: -5, animo: 5 },
          disabled: s.life.radioMonth === Math.floor(s.week / 4),
          after: () => { s.life.radioMonth = Math.floor(s.week / 4); const f = Math.round(200 + s.fans * 0.02); s.fans += f; s.prestige += 3; return `+${fmtNum(f)} fans y +3 prestigio.`; } },
      ],
    };
    return (A[id] || []).filter(a => a.cond === undefined || a.cond);
  },

  venue(id) {
    const s = G.s, P = PLACE_BY_ID[id];
    const info = {
      cafe: 'Huele a café recién molido. Buen lugar para comer, pensar y conocer gente.',
      club: 'Luces de neón y bajos que retumban. Aquí nacen las estrellas... y las resacas.',
      park: 'Árboles, un lago pequeño y aire fresco. Perfecto para despejarte.',
      radio: 'La emisora más escuchada de la ciudad. Aquí se hacen los hits.',
    }[id];
    const m = this.modal(P.name, '', { wide: id === 'radio' });
    const render = () => {
      const acts = this.venueActions(id);
      let h = `<p class="muted">${info}</p><div class="money-line">Dinero: <b>${fmtMoney(s.money)}</b></div><div class="grid">`;
      h += acts.map((a, i) => `<div class="card">${iconImg({ cafe: 'coin', club: 'star', park: 'plant', radio: 'mic' }[id])}
        <div class="cinfo"><b>${a.label}</b><div class="muted">${a.desc}</div></div>
        <div class="cbuy"><button class="btn primary small" data-act="${i}" ${a.disabled || s.money < a.cost ? 'disabled' : ''}>${a.cost ? fmtMoney(a.cost) : 'Ir'}</button></div></div>`).join('');
      h += '</div>';
      if (id === 'radio') {
        const act = s.songs.filter(x => x.active && !x.promoted);
        h += `<h3>Promocionar una canción</h3><p class="muted small">La radio la pondrá en rotación: +40% reproducciones el resto de su vida.</p>`;
        h += act.length ? '<div class="grid">' + act.map(so => {
          const cost = Math.round((300 + so.base * 0.04) / 50) * 50;
          return `<div class="card">${iconImg('vinyl')}<div class="cinfo"><b>${esc(so.name)}</b><div class="muted">${esc(so.artist || 'White Door')} · ${fmtNum(so.last)} reprod./sem</div></div>
            <div class="cbuy"><button class="btn primary small" data-promo="${so.id}" data-cost="${cost}" ${s.money < cost ? 'disabled' : ''}>${fmtMoney(cost)}</button></div></div>`;
        }).join('') + '</div>' : '<p class="muted">No tienes canciones sonando para promocionar.</p>';
      }
      m.set(h);
    };
    m.body.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.promo) {
        const so = s.songs.find(x => x.id === +b.dataset.promo), cost = +b.dataset.cost;
        if (s.money < cost) return;
        s.money -= cost; so.base *= 1.4; so.promoted = true;
        SFX.coin(); this.toast(`"${so.name}" ya suena en FM Pixel.`, 'good');
        render(); this.refresh(); return;
      }
      const a = this.venueActions(id)[+b.dataset.act];
      if (!a) return;
      const err = activity({ cost: a.cost, ...a.act });
      if (err) { this.toast(err, 'bad'); return; }
      SFX.coin();
      const msg = a.after ? a.after() : null;
      this.toast(msg || `${a.label}: ¡listo!`, 'good');
      saveGame(); m.close();
    });
    render();
  },

  /* ---------- Bienes raíces: propiedades y módulos ---------- */
  realty(tab = 'prop') {
    const s = G.s;
    let cur = tab;
    const m = this.modal('Bienes Raíces Pixel', '', { wide: true });
    const render = () => {
      let h = this.tabs([['prop', 'Propiedades'], ['mod', `Módulos (${s.modules.length}/${moduleSlots()})`]], cur) +
        `<div class="money-line">Dinero: <b>${fmtMoney(s.money)}</b></div>`;
      if (cur === 'prop') {
        h += '<div class="grid">' + ROOMS.map((r, i) => {
          let right;
          if (i === s.room) right = '<span class="ok">✓ Actual</span>';
          else if (i < s.room) right = '<span class="muted">Superado</span>';
          else if (i === s.room + 1) right = `<button class="btn primary small" data-room="${i}" ${s.money < r.price ? 'disabled' : ''}>${fmtMoney(r.price)}</button>`;
          else right = `<span class="muted small">${fmtMoney(r.price)}<br>Mejora el anterior</span>`;
          return `<div class="card ${i <= s.room ? 'owned' : ''}">${iconImg('house')}<div class="cinfo"><b>${r.name}</b>
            <div class="muted">${r.desc}</div><div class="bonus">Arriendo ${fmtMoney(r.rent)}/sem · ${r.slots} módulo${r.slots === 1 ? '' : 's'} · ${r.slots + 1} artistas en tu sello</div></div>
            <div class="cbuy">${right}</div></div>`;
        }).join('') + '</div>';
      } else {
        h += `<p class="muted">Los módulos son cuartos extra de tu estudio. Recórrelos con las flechas ◀ ▶ de la pantalla.</p>`;
        if (s.modules.length) {
          h += '<h3>Tus módulos</h3><div class="grid">' + s.modules.map((id, i) => `<div class="card owned">${iconImg(MODULES[id].icon)}
            <div class="cinfo"><b>${MODULES[id].name}</b><div class="muted">${MODULES[id].desc}</div></div>
            <div class="cbuy"><button class="btn small" data-sell="${i}">Vender (${fmtMoney(MODULES[id].price / 2)})</button></div></div>`).join('') + '</div>';
        }
        h += '<h3>Construir</h3>';
        if (!moduleSlots()) h += '<p class="warn">Tu propiedad actual no tiene espacio para módulos. Múdate a una Habitación amplia o más.</p>';
        h += '<div class="grid">' + Object.entries(MODULES).map(([id, md]) => `<div class="card">${iconImg(md.icon)}
          <div class="cinfo"><b>${md.name}</b><div class="muted">${md.desc}</div>${md.p || md.amb ? `<div class="bonus">${this.bonusText(md)}</div>` : ''}</div>
          <div class="cbuy"><button class="btn primary small" data-mod="${id}" ${s.money < md.price || s.modules.length >= moduleSlots() ? 'disabled' : ''}>${fmtMoney(md.price)}</button></div></div>`).join('') + '</div>';
      }
      m.set(h);
    };
    m.body.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.tab) { SFX.click(); cur = b.dataset.tab; render(); return; }
      let err, ok;
      if (b.dataset.room) { err = buyRoom(+b.dataset.room); ok = `¡Te mudaste a: ${ROOMS[+b.dataset.room].name}!`; }
      if (b.dataset.mod) { err = buyModule(b.dataset.mod); ok = `Construiste: ${MODULES[b.dataset.mod].name}. Míralo con ◀ ▶ en tu estudio.`; }
      if (b.dataset.sell) {
        askConfirm('Te devuelven la mitad de lo que pagaste y el espacio queda libre.', { title: '¿Vender este módulo?', ok: 'Vender', icon: 'house' }).then(yes => {
          if (!yes) return;
          const e2 = sellModule(+b.dataset.sell);
          if (e2) { this.toast(e2, 'bad'); SFX.bad(); } else { this.toast('Módulo vendido.', 'good'); SFX.coin(); }
          render(); this.refresh();
        });
        return;
      }
      if (err) { this.toast(err, 'bad'); SFX.bad(); } else { this.toast(ok, 'good'); SFX.coin(); }
      render(); this.refresh();
    });
    render();
  },

  /* ---------- Centro comercial: decoración, ropa, objetos y viajes ---------- */
  mall(tab = 'deco') {
    const s = G.s, L = s.life;
    let cur = tab;
    const TRIPS = [
      { id: 'playa', name: 'Una semana en la playa', price: 2500, days: 7, desc: 'Todas tus necesidades al 100% e inspiración por 2 semanas.', insp: 14 },
      { id: 'europa', name: 'Gira por Europa (2 semanas)', price: 12000, days: 14, desc: 'Vuelves renovado, inspirado por un mes y con historias para contar. +15 prestigio.', insp: 28, prestige: 15 },
    ];
    const m = this.modal('Centro Comercial', '', { wide: true });
    const render = () => {
      let h = this.tabs([['deco', 'Decoración'], ['ropa', 'Ropa'], ['obj', 'Objetos'], ['viajes', 'Viajes']], cur) +
        `<div class="money-line">Dinero: <b>${fmtMoney(s.money)}</b></div><div class="grid">`;
      if (cur === 'deco') {
        h += DECOR.map(it => this.card(it, s.items.includes(it.id) ? 'owned' : (it.room && s.room < it.room ? 'locked' : 'buy'), `data-item="${it.id}"`)).join('');
      } else if (cur === 'ropa') {
        h += OUTFITS.map(o => {
          const own = L.outfits.includes(o.id), on = L.outfit === o.id;
          return `<div class="card ${own ? 'owned' : ''}"><img class="outfit-prev" src="${outfitPreviewURL(s, o.id)}" alt="Así te verías con ${o.name}"><div class="cinfo"><b>${o.name}</b>
            <div class="muted">Así te verías. Se ve en el estudio y en la ciudad.</div></div><div class="cbuy">${on ? '<span class="ok">✓ Puesto</span>' : own ? `<button class="btn small" data-wear="${o.id}">Ponerse</button>` :
            `<button class="btn primary small" data-outfit="${o.id}" ${s.money < o.price ? 'disabled' : ''}>${fmtMoney(o.price)}</button>`}</div></div>`;
        }).join('');
      } else if (cur === 'obj') {
        h += PERSONAL.map(it => `<div class="card ${L.personal.includes(it.id) ? 'owned' : ''}">${iconImg(it.icon)}<div class="cinfo"><b>${it.name}</b><div class="muted">${it.desc}</div></div>
          <div class="cbuy">${L.personal.includes(it.id) ? '<span class="ok">✓ Tuyo</span>' : `<button class="btn primary small" data-pers="${it.id}" ${s.money < it.price ? 'disabled' : ''}>${fmtMoney(it.price)}</button>`}</div></div>`).join('');
      } else {
        h += TRIPS.map(tr => `<div class="card">${iconImg('star')}<div class="cinfo"><b>${tr.name}</b><div class="muted">${tr.desc}</div><div class="bonus">Tu canción en curso se pausa · tu equipo sigue trabajando</div></div>
          <div class="cbuy"><button class="btn primary small" data-trip="${tr.id}" ${s.money < tr.price ? 'disabled' : ''}>${fmtMoney(tr.price)}</button></div></div>`).join('');
      }
      m.set(h + '</div>');
    };
    m.body.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.tab) { SFX.click(); cur = b.dataset.tab; render(); return; }
      if (b.dataset.item) {
        const err = buyItem(b.dataset.item);
        if (err) { this.toast(err, 'bad'); SFX.bad(); } else { this.toast(`Compraste: ${DECOR_BY_ID[b.dataset.item].name}`, 'good'); SFX.coin(); }
      }
      if (b.dataset.outfit) { const o = OUTFITS.find(x => x.id === b.dataset.outfit); s.money -= o.price; L.outfits.push(o.id); L.outfit = o.id; SFX.coin(); }
      if (b.dataset.wear) { L.outfit = b.dataset.wear; SFX.click(); }
      if (b.dataset.pers) {
        const it = PERSONAL.find(x => x.id === b.dataset.pers);
        s.money -= it.price; L.personal.push(it.id); SFX.coin();
        if (it.id === 'auto') completeGoal('auto');
        this.toast(`Compraste: ${it.name}`, 'good');
      }
      if (b.dataset.trip) {
        const tr = TRIPS.find(x => x.id === b.dataset.trip);
        s.money -= tr.price; m.close();
        this.fade('De viaje...');
        passTime(tr.days);
        s.needs = { energia: 100, hambre: 100, animo: 100 }; s.salud = 100;
        L.inspired = Math.max(L.inspired, tr.insp);
        if (tr.prestige) s.prestige += tr.prestige;
        completeGoal('viaje');
        this.toast(`Volviste de ${tr.name.toLowerCase()}. ¡Renovado e inspirado!`, 'good');
        saveGame(); this.refresh(); return;
      }
      saveGame(); render(); this.refresh();
    });
    render();
  },

  /* ---------- Agencia de talentos: personal y sello ---------- */
  agency(tab = 'staff') {
    const s = G.s;
    let cur = tab;
    if (!s.candidates.length) refreshCandidates(true);
    const m = this.modal('Agencia de Talentos', '', { wide: true });
    const render = () => {
      let h = this.tabs([['staff', 'Contratar personal'], ['label', 'Sello y artistas']], cur) +
        `<div class="money-line">Dinero: <b>${fmtMoney(s.money)}</b></div>`;
      if (cur === 'staff') {
        h += `<p class="muted">Escritorios: ${s.staff.length}/${staffCapacity()}. ${staffCapacity() ? '' : '<span class="warn">Necesitas construir una Oficina en Bienes Raíces.</span>'} Nuevos candidatos cada mes.</p><div class="grid">`;
        h += s.candidates.map(c => `<div class="card"><img class="portrait sm" src="${portraitURL(c.look)}" alt="">
          <div class="cinfo"><b>${esc(c.name)}</b><div class="muted">${STAFF_TYPES[c.type].name} · nivel ${'★'.repeat(c.skill)}</div>
          <div class="muted small">${STAFF_TYPES[c.type].desc}</div><div class="bonus">Salario ${fmtMoney(c.salary)}/sem</div></div>
          <div class="cbuy"><button class="btn primary small" data-hire="${c.id}" ${s.staff.length >= staffCapacity() ? 'disabled' : ''}>Contratar</button></div></div>`).join('') || '<p class="muted">No hay candidatos ahora.</p>';
        h += '</div>';
      } else {
        if (!s.label) {
          h += `<div class="empty">${iconImg('gold', 'xl')}<p>Funda <b>White Door Records</b> y firma tus propios artistas.</p>
            <p class="muted">Tus artistas podrán entrenar, grabar con tus productores, salir de gira y ayudarte a producir.</p>
            <button class="btn primary" data-found="1" ${s.money < LABEL_COST ? 'disabled' : ''}>Fundar sello (${fmtMoney(LABEL_COST)})</button></div>`;
        } else {
          h += `<p class="muted">Artistas en tu sello: ${s.roster.length}/${rosterCap()}. Nuevos prospectos cada 6 semanas. También puedes buscar talentos en la Noche de talentos del Club Neón.</p>`;
          h += '<h3>Prospectos de la agencia</h3>' + this.signCards(s.scouts);
          const cc = contactCandidates();
          if (cc.length) h += '<h3>Artistas con los que trabajaste</h3>' + this.signCards(cc);
        }
      }
      m.set(h);
    };
    m.body.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.tab) { SFX.click(); cur = b.dataset.tab; render(); return; }
      let err, ok;
      if (b.dataset.hire) { const c = s.candidates.find(x => x.id === +b.dataset.hire); err = hireStaff(+b.dataset.hire); ok = c && `${c.name} se une a tu equipo.`; }
      if (b.dataset.found) { err = foundLabel(); ok = '¡Nació White Door Records!'; }
      if (b.dataset.sign) {
        const c = [...s.scouts, ...contactCandidates()].find(x => String(x.id) === b.dataset.sign);
        err = c ? signArtist(c) : 'Ya no está disponible.'; ok = c && `¡${c.name} firmó con White Door Records!`;
      }
      if (err) { this.toast(err, 'bad'); SFX.bad(); } else if (ok) { this.toast(ok, 'good'); SFX.coin(); }
      render(); this.refresh();
    });
    render();
  },
  signCards(list) {
    const s = G.s;
    if (!list.length) return '<p class="muted">Nadie por ahora.</p>';
    return '<div class="grid">' + list.map(c => `<div class="card"><img class="portrait sm" src="${portraitURL(c.look)}" alt="">
      <div class="cinfo"><b>${esc(c.name)}</b><div class="muted">${GENRES[c.genre].name} · ${fmtNum(c.fans)} fans</div>
      <div class="bar-mini"><span>Talento</span><i><em style="width:${c.talent}%"></em></i><span>${Math.round(c.talent)}</span></div>
      <div class="bonus">Firma ${fmtMoney(c.signFee)} · Salario ${fmtMoney(c.salary)}/sem</div>
      ${s.genres.includes(c.genre) ? '' : `<div class="warn small">Aún no sabes producir ${GENRES[c.genre].name}</div>`}</div>
      <div class="cbuy"><button class="btn primary small" data-sign="${c.id}" ${s.money < c.signFee || s.roster.length >= rosterCap() ? 'disabled' : ''}>Firmar</button></div></div>`).join('') + '</div>';
  },
  signList(title, getList) {
    const s = G.s;
    const m = this.modal(title, '', { wide: true });
    const render = () => m.set(`<p class="muted">Artistas en tu sello: ${s.roster.length}/${rosterCap()}</p>` + this.signCards(getList()));
    m.body.addEventListener('click', e => {
      const b = e.target.closest('[data-sign]'); if (!b || b.disabled) return;
      const c = getList().find(x => String(x.id) === b.dataset.sign);
      const err = c ? signArtist(c) : 'Ya no está disponible.';
      if (err) { this.toast(err, 'bad'); SFX.bad(); } else { this.toast(`¡${c.name} firmó con White Door Records!`, 'good'); SFX.coin(); }
      render(); this.refresh();
    });
    render();
  },

  /* =========================================================
     PANEL DEL SELLO
     ========================================================= */
  label() {
    const s = G.s;
    const m = this.modal(s.label ? 'White Door Records' : 'Sello discográfico', '', { wide: true });
    const render = () => {
      if (!s.label) {
        m.set(`<div class="empty">${iconImg('gold', 'xl')}<p>Todavía no tienes sello.</p>
          <p class="muted">Ve a la <b>Agencia de Talentos</b> en la ciudad para fundar White Door Records (${fmtMoney(LABEL_COST)}).</p></div>`);
        return;
      }
      const labelSongs = s.songs.filter(x => x.label);
      let h = `<div class="money-line">Artistas: <b>${s.roster.length}/${rosterCap()}</b> · Lanzamientos: <b>${labelSongs.length}</b> · Ganancias del sello: <b>${fmtMoney(labelSongs.reduce((a, x) => a + x.revenue, 0))}</b></div>
        <p class="muted small">Entrenar requiere Sala de ensayo · Grabar requiere Cabina y un Productor libre · Gira requiere Mánager · Co-producir te da puntos y menos ruido en tus canciones (el artista de la canción siempre ayuda).</p>`;
      if (!s.roster.length) h += `<div class="empty"><p>Tu sello no tiene artistas.</p><p class="muted">Firma talentos en la Agencia de Talentos o en la Noche de talentos del Club Neón.</p></div>`;
      for (const a of s.roster) {
        const prod = a.producerId ? s.staff.find(x => x.id === a.producerId) : null;
        h += `<div class="offer roster">
          <img class="portrait" src="${portraitURL(a.look)}" alt="">
          <div class="offer-info">
            <div class="oname">${esc(a.name)} <span class="tag">${GENRES[a.genre].name}</span> <span class="tag good">${ROSTER_TASKS[a.task].name}</span></div>
            <div class="muted">${fmtNum(a.fans)} fans · ${a.songs} canciones · salario ${fmtMoney(a.salary)}/sem · contrato ${Math.max(0, a.contract)} sem</div>
            <div class="bars3">
              <div class="bar-mini"><span>Talento</span><i><em style="width:${a.talent}%"></em></i><span>${Math.round(a.talent)}</span></div>
              <div class="bar-mini"><span>Energía</span><i><em class="${a.energy < 25 ? 'low' : ''}" style="width:${a.energy}%"></em></i><span>${Math.round(a.energy)}</span></div>
              <div class="bar-mini"><span>Ánimo</span><i><em class="${a.mood < 25 ? 'low' : ''}" style="width:${a.mood}%"></em></i><span>${Math.round(a.mood)}</span></div>
            </div>
            ${a.task === 'grabar' ? `<div class="bonus">Grabando con ${prod ? esc(prod.name) : '—'}: ${Math.round(a.prog * 100)}%</div>` : ''}
            <div class="chips tasks">${Object.entries(ROSTER_TASKS).map(([k, t]) => {
              const err = taskError(a, k);
              return `<button class="chip ${a.task === k ? 'on' : ''} ${err ? 'off' : ''}" data-task="${k}" data-id="${a.id}" title="${esc(err || t.desc)}">${t.name}</button>`;
            }).join('')}</div>
          </div>
          <div class="offer-actions"><button class="btn small" data-free="${a.id}">Liberar</button></div></div>`;
      }
      m.set(h);
    };
    m.body.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      SFX.click();
      if (b.dataset.task) {
        const a = s.roster.find(x => x.id === +b.dataset.id);
        const err = setRosterTask(a, b.dataset.task);
        if (err) this.toast(err, 'bad');
      }
      if (b.dataset.free) {
        const a = s.roster.find(x => x.id === +b.dataset.free);
        askConfirm(`${esc(a.name)} dejará White Door Records y ya no grabará contigo.`, { title: '¿Liberar del contrato?', ok: 'Liberar', danger: true, icon: 'fans' }).then(yes => {
          if (!yes) return;
          releaseArtist(a.id); this.toast(`${a.name} dejó el sello.`, 'muted');
          saveGame(); render(); this.refresh();
        });
        return;
      }
      saveGame(); render(); this.refresh();
    });
    render();
  },

  /* ---------- Personal ---------- */
  staffPanel() {
    const s = G.s;
    const m = this.modal('Tu equipo', '', { wide: true });
    const render = () => {
      const pay = s.staff.reduce((a, x) => a + x.salary, 0);
      let h = `<div class="money-line">Escritorios: <b>${s.staff.length}/${staffCapacity()}</b> · Nómina: <b>${fmtMoney(pay)}/sem</b></div>
        <p class="muted small">Contrata en la Agencia de Talentos (ciudad). Tu equipo trabaja aunque estés de viaje o en la calle. Despedir cuesta 2 semanas de salario.</p>`;
      if (!s.staff.length) h += `<div class="empty">${iconImg('pc', 'xl')}<p>Aún no tienes empleados.</p><p class="muted">Construye una Oficina en Bienes Raíces y contrata en la Agencia de Talentos.</p></div>`;
      h += '<div class="grid">' + s.staff.map(st => {
        const art = s.roster.find(a => a.producerId === st.id);
        const doing = st.type === 'productor' ? (art ? `Grabando con ${esc(art.name)}` : 'Libre: asígnale un artista en Sello') :
          { asistente: 'Te ayuda con comida y contactos', ingeniero: 'Cuida tus mezclas y repara averías', manager: s.roster.some(a => a.task === 'gira') ? 'Organizando giras' : 'Negociando contratos', community: 'Haciendo crecer tus redes' }[st.type];
        return `<div class="card"><img class="portrait sm" src="${portraitURL(st.look)}" alt="">
          <div class="cinfo"><b>${esc(st.name)}</b><div class="muted">${STAFF_TYPES[st.type].name} · ${'★'.repeat(st.skill)}</div>
          <div class="bonus">${doing}</div><div class="muted small">${fmtMoney(st.salary)}/sem</div></div>
          <div class="cbuy"><button class="btn small" data-fire="${st.id}">Despedir</button></div></div>`;
      }).join('') + '</div>';
      m.set(h);
    };
    m.body.addEventListener('click', e => {
      const b = e.target.closest('[data-fire]'); if (!b) return;
      const st = s.staff.find(x => x.id === +b.dataset.fire);
      askConfirm(`Le pagas ${fmtMoney(st.salary * 2)} de liquidación.`, { title: `¿Despedir a ${esc(st.name)}?`, ok: 'Despedir', danger: true, icon: 'fans' }).then(yes => {
        if (!yes) return;
        fireStaff(st.id); SFX.click(); render(); this.refresh();
      });
    });
    render();
  },

  /* ---------- Vida ---------- */
  life() {
    const s = G.s, L = s.life;
    const m = this.modal(`La vida de ${esc(s.producer)}`, '', { wide: true });
    const render = () => {
      const n = s.needs;
      const bar = (label, v, low) => `<div class="bar-mini big"><span>${label}</span><i><em class="${v < (low || 25) ? 'low' : ''}" style="width:${v}%"></em></i><span>${Math.round(v)}</span></div>`;
      let h = `<div class="row life-links"><button class="btn small" data-open="look">Personalizar</button><button class="btn small" data-open="seq">Séquito (${(s.seq || []).length})</button><button class="btn small" data-open="sec">Seguridad</button></div>
        <div class="life-grid"><div>
        <h3>Necesidades</h3>${bar('Energía', n.energia)}${bar('Hambre', n.hambre)}${bar('Ánimo', n.animo)}${bar('Salud', s.salud, 40)}
        <p class="muted small">Productividad actual: <b>${Math.round(workMult() * 100)}%</b>${L.inspired > 0 ? ' · Inspirado' : ''}${L.job ? ` · Trabajo de medio tiempo (${L.job} sem)` : ''}</p>
        ${s.loc === 'studio' ? `<div class="row"><button class="btn small" data-home="sleep">Dormir</button><button class="btn small" data-home="eat">Comer</button><button class="btn small" data-home="relax">Relajarte</button></div>` : '<p class="muted small">Vuelve al estudio para dormir o comer en casa (o visita el café y el parque).</p>'}
        <div class="row"><button class="btn small ${L.routine ? 'primary' : ''}" data-routine="1">Rutina automática: ${L.routine ? 'ON' : 'OFF'}</button></div>
        <p class="muted small">Con la rutina activa, en el estudio comes, duermes y descansas solo cuando una barra está muy baja.</p>
      </div><div>
        <h3>Relación</h3>${L.partner ? `<div class="artist-line"><img class="portrait sm" src="${portraitURL(L.partner.look)}" alt=""><div><b>${esc(L.partner.name)}</b><br><span class="muted">${STAGES[L.partner.stage]}${L.partner.kind && PARTNER_TYPES[L.partner.kind] ? ' · ' + PARTNER_TYPES[L.partner.kind].name : ''}</span>
          <div class="bar-mini"><span>Amor</span><i><em style="width:${L.partner.love}%"></em></i><span>${Math.round(L.partner.love)}</span></div></div></div>
          <div class="row"><button class="btn small" data-date="1" ${s.money < 60 ? 'disabled' : ''}>Salir juntos ($60)</button><button class="btn small" data-call="1" ${L.lastCall === s.day ? 'disabled' : ''}>Llamar</button></div>` :
          '<p class="muted">Soltero/a. Sal de fiesta o al club: quizás conozcas a alguien.</p>'}
        <h3>Premios Pixel</h3>${L.awards.length ? L.awards.map(a => `<div>${iconImg('gold')} Año ${a.year}: "${esc(a.song)}"</div>`).join('') : '<p class="muted">Aún ninguno. Se entregan cada año a la mejor canción (nota 7.5+).</p>'}
      </div></div>`;
      const broken = Object.keys(s.broken);
      if (broken.length) {
        h += '<h3>Averías</h3><div class="grid">' + broken.map(k => `<div class="card locked">${iconImg('gear')}<div class="cinfo"><b>${BREAKABLES[k].name}</b><div class="muted">${BREAKABLES[k].effect}</div>
          ${s.broken[k].fixDays ? `<div class="bonus">En reparación: ${s.broken[k].fixDays} día(s)</div>` : ''}</div>
          <div class="cbuy">${s.broken[k].fixDays ? '' : `<button class="btn primary small" data-fix="${k}">Reparar</button>`}</div></div>`).join('') + '</div>';
      }
      h += '<h3>Aspiraciones</h3><div class="goals">' + GOALS.map(g => {
        const done = L.goals[g.id] !== undefined;
        return `<div class="goal ${done ? 'done' : ''}">${iconImg(done ? 'star' : 'note')}<div><b>${g.name}</b><span class="muted small">${g.desc}</span></div></div>`;
      }).join('') + '</div>';
      m.set(h);
    };
    m.body.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.home) { m.close(); this.homeAction(b.dataset.home); return; }
      if (b.dataset.open) { m.close(); SFX.click(); ({ look: () => this.customize(), seq: () => this.entourage(), sec: () => this.security() })[b.dataset.open](); return; }
      if (b.dataset.routine) { L.routine = !L.routine; this.toast(L.routine ? 'Rutina automática activada.' : 'Rutina automática desactivada.', 'muted'); }
      if (b.dataset.fix) { m.close(); this.choice(breakdownEvent(b.dataset.fix)); return; }
      if (b.dataset.date) { activity({ cost: 60, days: 0.4, animo: 12 }); L.partner.love = clamp(L.partner.love + 10, 0, 100); this.toast(`Pasaste una linda tarde con ${L.partner.name}.`, 'good'); }
      if (b.dataset.call) { L.lastCall = s.day; L.partner.love = clamp(L.partner.love + 3, 0, 100); addNeeds({ animo: 3 }); this.toast(`Hablaste un rato con ${L.partner.name}.`, 'good'); }
      SFX.click(); saveGame(); render(); this.refresh();
    });
    render();
  },
});
