'use strict';
/* =========================================================
   WHITE DOOR — Banco Pixel, la DIAN, séquito
   y personalización del productor
   ========================================================= */

/* ---------- Estado (se crea solo en partidas viejas) ---------- */
function bankState(s = G.s) { return s.bank || (s.bank = { savings: 0, cdts: [], loan: null, score: 50, earned: 0 }); }
function taxState(s = G.s) { return s.tax || (s.tax = { gross: 0, costs: 0, paid: 0, lastProfit: 0, lastTax: 0 }); }
function lookState(s = G.s) {
  const L = s.life;
  if (!L.look) L.look = { skin: '#c48a5e', hair: '#2a1810', style: 0, hat: null, chain: null, phones: 'rojo' };
  if (!L.owned) L.owned = ['rojo'];
  return L.look;
}
function seqState(s = G.s) { return s.seq || (s.seq = []); }
function hasEntourage(id, s = G.s) { return !!(s && s.seq && s.seq.some(m => m.id === id)); }

// Cobra primero del efectivo y luego de los ahorros
function charge(amount, s = G.s) {
  amount = Math.max(0, Math.round(amount));
  const B = bankState(s);
  const short = amount - Math.max(0, s.money);
  if (short > 0 && B.savings > 0) { const take = Math.min(B.savings, short); B.savings -= take; s.money += take; }
  s.money -= amount;
  return amount;
}
const round50 = v => Math.round(v / 50) * 50;
const pctTxt = v => Math.round(v * 100) + '%';

/* =========================================================
   LA DIAN — impuestos por tramos sobre las GANANCIAS del año
   (antes cobraba 5% de todo tu dinero, por eso dolía tanto)
   ========================================================= */
const TAX_BRACKETS = [
  { upTo: 25000, rate: 0 },
  { upTo: 100000, rate: 0.04 },
  { upTo: 400000, rate: 0.08 },
  { upTo: Infinity, rate: 0.12 },
];
function taxFor(profit) {
  let t = 0, prev = 0;
  for (const b of TAX_BRACKETS) { if (profit > prev) t += (Math.min(profit, b.upTo) - prev) * b.rate; prev = b.upTo; }
  return t;
}
function yearProfit(s = G.s) { const T = taxState(s); return Math.max(0, T.gross - T.costs); }
function taxEstimate(s = G.s) {
  let tax = taxFor(yearProfit(s));
  if (hasEntourage('contador', s)) tax *= 0.8;
  const wealth = Math.max(0, s.money) + bankState(s).savings;
  tax = Math.min(tax, wealth * 0.05); // tope: nunca más del 5% de lo que tienes
  return Math.round(tax / 10) * 10;
}
function weeksToTax(s = G.s) { const w = s.week % 48; return w < 20 ? 20 - w : 68 - w; }

function taxEvent() {
  const s = G.s, T = taxState(s);
  const profit = yearProfit(s), tax = taxEstimate(s);
  T.lastProfit = profit; T.lastTax = tax; T.gross = 0; T.costs = 0;
  if (tax < 100) { UI.toast(`DIAN: ganaste ${fmtMoney(profit)} este año. Estás por debajo del mínimo: no pagas impuestos.`, 'muted'); return null; }
  const acct = round50(300 + tax * 0.03);
  const cuota = Math.round(tax * 1.08 / 4);
  return {
    title: 'La DIAN: declaración de renta', icon: 'coin',
    text: `Tus ganancias del último año fueron ${fmtMoney(profit)} (ingresos menos arriendo, salarios y séquito). Por tramos te toca pagar ${fmtMoney(tax)}, el ${pctTxt(tax / Math.max(1, profit))} de tus ganancias.`,
    options: [
      { label: `Pagar ${fmtMoney(tax)}`, desc: 'Al día con la DIAN.', run() { charge(tax); T.paid += tax; return 'Pagaste tus impuestos. Duermes tranquilo.'; } },
      { label: `Contratar un contador (${fmtMoney(acct)})`, desc: `Deducciones legales: pagas ${fmtMoney(tax * 0.7)}`, run() { const t = Math.round(tax * 0.7); charge(t + acct); T.paid += t; return `El contador encontró deducciones. Pagaste ${fmtMoney(t)}.`; } },
      { label: 'Pagar en 4 cuotas', desc: `${fmtMoney(cuota)} por semana durante 4 semanas (8% de recargo)`, run() { T.plan = { cuota, left: 4 }; return 'Acordaste un plan de pagos con la DIAN.'; } },
    ],
  };
}

/* =========================================================
   BANCO PIXEL
   ========================================================= */
const SAVINGS_RATE = 0.001; // semanal (~5% al año)
const CDT_PLANS = [
  { weeks: 12, rate: 0.04 },
  { weeks: 24, rate: 0.10 },
  { weeks: 48, rate: 0.25 },
];
const LOAN_PLANS = [
  { weeks: 12, rate: 0.10 },
  { weeks: 24, rate: 0.18 },
  { weeks: 48, rate: 0.30 },
];
function loanLimit(s = G.s) {
  const B = bankState(s);
  if (B.score < 20) return 0;
  const base = 3000 + s.prestige * 30 + s.fans * 0.05 + s.level * 800;
  return Math.min(300000, Math.floor(base * (B.score / 50) / 500) * 500);
}
function weeklyBank(s) {
  const B = bankState(s), T = taxState(s);
  if (B.savings > 0) { const i = B.savings * SAVINGS_RATE; B.savings += i; B.earned += i; T.gross += i; }
  for (const c of B.cdts) {
    c.left--;
    if (c.left <= 0) {
      const pay = Math.round(c.amount * (1 + c.rate));
      B.savings += pay; B.earned += pay - c.amount; T.gross += pay - c.amount;
      UI.toast(`Tu CDT venció: ${fmtMoney(pay)} pasaron a tus ahorros.`, 'good');
    }
  }
  B.cdts = B.cdts.filter(c => c.left > 0);
  if (T.plan) {
    charge(T.plan.cuota); T.paid += T.plan.cuota;
    if (--T.plan.left <= 0) { T.plan = null; UI.toast('Terminaste de pagar tus impuestos.', 'good'); }
  }
  const Ln = B.loan;
  if (!Ln) return;
  const due = Math.min(Ln.owed, Ln.weekly);
  if (s.money + B.savings >= due) {
    charge(due); Ln.owed -= due; Ln.missed = 0; B.score = Math.min(100, B.score + 1);
    if (Ln.owed <= 1) { B.loan = null; B.score = Math.min(100, B.score + 10); UI.toast('¡Pagaste tu crédito completo! Tu puntaje en el banco subió.', 'good'); }
    return;
  }
  Ln.missed++; Ln.owed += Math.round(due * 0.05); B.score = Math.max(0, B.score - 12);
  UI.toast(`No pudiste pagar la cuota del crédito (${Ln.missed}/4). Te cobran intereses de mora.`, 'bad');
  if (Ln.missed >= 4) {
    let owed = Ln.owed;
    for (const c of B.cdts) owed -= Math.min(owed, c.amount);
    B.cdts = [];
    const t = Math.min(owed, B.savings); B.savings -= t; owed -= t;
    s.money -= owed; s.prestige = Math.max(0, s.prestige - 20);
    B.loan = null; B.score = 5;
    UI.queue(() => UI.choice({ title: 'Embargo del Banco Pixel', icon: 'coin', text: 'Dejaste de pagar 4 cuotas. El banco embargó tus ahorros y CDTs, y lo que faltaba se descontó de tu cuenta.', options: [{ label: 'Qué vergüenza...', run() { addNeeds({ animo: -20 }); return null; } }] }));
  }
}

/* =========================================================
   SÉQUITO
   ========================================================= */
const ENTOURAGE = [
  { id: 'parcero', name: 'Parcero / hype man', salary: 150, req: {}, icon: 'fans', look: { shirt: '#ffec27', pants: '#1d2b53' },
    desc: '+ánimo cada semana. A veces se mete en líos que pagas tú.' },
  { id: 'chef', name: 'Chef personal', salary: 220, req: { prestige: 30 }, icon: 'coin', look: { shirt: '#fff1e8', pants: '#5f574f' },
    desc: 'El hambre baja mucho más lento.' },
  { id: 'chofer', name: 'Chofer', salary: 250, req: { prestige: 40 }, icon: 'house', look: { shirt: '#1d2b53', pants: '#1d2b53' },
    desc: 'Te lleva en auto por la ciudad, aunque no tengas auto.' },
  { id: 'estilista', name: 'Estilista', salary: 300, req: { fans: 1000 }, icon: 'star', look: { shirt: '#ff77a8', pants: '#1a1a1a' },
    desc: '+8% de fans nuevos cada semana y un poco de ánimo.' },
  { id: 'fotografo', name: 'Fotógrafo', salary: 280, req: { fans: 3000 }, icon: 'fans', look: { shirt: '#29adff', pants: '#3a3548' },
    desc: 'Contenido para redes: fans extra cada semana.' },
  { id: 'guardaespaldas', name: 'Guardaespaldas', salary: 350, req: { prestige: 60 }, icon: 'gear', look: { shirt: '#1a1a1a', pants: '#1a1a1a', glasses: true },
    desc: 'Nadie te roba en la calle y +1 prestigio al mes (te ves importante).' },
  { id: 'contador', name: 'Contador', salary: 400, req: { prestige: 100 }, icon: 'book', look: { shirt: '#c2c3c7', pants: '#3a3548', glasses: true },
    desc: 'Tus impuestos bajan 20% de forma legal.' },
  { id: 'mananger', name: 'Mánager personal', salary: 550, req: { prestige: 150 }, icon: 'mail', look: { shirt: '#3a3548', pants: '#3a3548' },
    desc: 'Negocia mejor: +15% en pagos de artistas y trabajos.' },
];
const ENT_BY_ID = Object.fromEntries(ENTOURAGE.map(e => [e.id, e]));
function seqSlots(s = G.s) { return Math.min(ENTOURAGE.length, 2 + Math.floor(s.prestige / 150)); }
function entError(id, s = G.s) {
  const e = ENT_BY_ID[id];
  if (hasEntourage(id, s)) return 'Ya está contigo.';
  if (e.req.prestige && s.prestige < e.req.prestige) return `Necesitas ${e.req.prestige} de prestigio.`;
  if (e.req.fans && s.fans < e.req.fans) return `Necesitas ${fmtNum(e.req.fans)} fans.`;
  if (seqState(s).length >= seqSlots(s)) return 'Tu séquito está lleno (más prestigio = más cupos).';
  if (s.money < e.salary * 2) return 'Necesitas 2 semanas de sueldo por adelantado.';
  return null;
}
function hireEntourage(id) {
  const s = G.s, e = ENT_BY_ID[id];
  const err = entError(id); if (err) return err;
  s.money -= e.salary * 2;
  seqState(s).push({ id, name: pick(STAFF_NAMES.first), look: { ...randomLook(1), ...e.look }, since: s.week });
  return null;
}
function fireEntourage(id) { const s = G.s; s.seq = seqState(s).filter(m => m.id !== id); }
function weeklyEntourage(s, fans0) {
  const seq = seqState(s);
  if (!seq.length) return;
  const pay = seq.reduce((a, m) => a + ENT_BY_ID[m.id].salary, 0);
  s.money -= pay; s.lastExpense += pay; taxState(s).costs += pay;
  if (hasEntourage('estilista', s)) { s.fans += Math.max(0, s.fans - fans0) * 0.08; addNeeds({ animo: 2 }); }
  if (hasEntourage('fotografo', s)) s.fans += Math.round(20 + s.fans * 0.004);
  if (hasEntourage('guardaespaldas', s) && s.week % 4 === 0) s.prestige += 1;
  if (hasEntourage('parcero', s)) {
    addNeeds({ animo: 5 });
    if (Math.random() < 0.06) {
      const c = round50(rnd(300, 1200)), m = seq.find(x => x.id === 'parcero');
      s.money -= c;
      UI.toast(`${m.name} chocó tu moto prestada y pagaste ${fmtMoney(c)} de arreglo.`, 'bad');
    }
  }
}

/* =========================================================
   GANCHOS CON EL RESTO DEL JUEGO
   ========================================================= */
(function () {
  const baseWeek = advanceWeek;
  advanceWeek = function () {
    const s = G.s, fans0 = s.fans;
    baseWeek();
    if (!G.running || G.s !== s) return;
    const T = taxState(s);
    T.gross += (s.lastIncome || 0) + (s.lastSide || 0);
    T.costs += s.lastExpense || 0;
    weeklyEntourage(s, fans0);
    weeklyBank(s);
  };

  const baseDay = dailyLife;
  dailyLife = function () {
    const s = G.s, n = s.needs;
    baseDay();
    s.salud = clamp(s.salud, 0, 100);
    if (hasEntourage('chef', s)) n.hambre = Math.min(100, n.hambre + 0.6);
    if (s.loc === 'city' && s.money > 3000 && !hasEntourage('guardaespaldas', s) && Math.random() < 0.008) {
      const lost = Math.min(6000, Math.round(s.money * 0.12));
      s.money -= lost;
      UI.toast(`¡Te robaron en la calle! Perdiste ${fmtMoney(lost)}. Guarda tu plata en el banco o contrata un guardaespaldas.`, 'bad');
    }
  };

  // Pagos de canciones y trabajos: el mánager negocia y todo cuenta para la DIAN
  for (const fn of ['finishJob', 'releaseSong']) {
    const base = window[fn];
    window[fn] = function (...a) {
      const s = G.s, m0 = s.money;
      const r = base.apply(this, a);
      if (s.money > m0) {
        if (hasEntourage('mananger', s)) s.money += Math.round((s.money - m0) * 0.15);
        taxState(s).gross += s.money - m0;
      }
      return r;
    };
  }

  // El séquito te sigue por la ciudad
  CITY.trail = [];
  const baseEnter = enterCity;
  enterCity = function () { baseEnter(); CITY.trail = []; };
  const baseUpd = updateCity;
  updateCity = function (dt) {
    baseUpd(dt);
    const pl = CITY.player, tr = CITY.trail, last = tr[0];
    if (!last || Math.hypot(pl.x - last.x, pl.y - last.y) >= 2) {
      tr.unshift({ x: pl.x, y: pl.y, dir: pl.dir, step: pl.step });
      if (tr.length > 60) tr.length = 60;
    }
  };
  const baseCity = drawCity;
  drawCity = function (ctx, s, t) {
    baseCity(ctx, s, t);
    const seq = s.seq || [];
    const driving = (s.life.personal.includes('auto') || hasEntourage('chofer', s)) && (CITY.player.path.length || Object.values(CITY.keys).some(Boolean));
    if (!seq.length || driving) return;
    seq.forEach((m, i) => {
      const p = CITY.trail[(i + 1) * 5] || CITY.trail[CITY.trail.length - 1];
      if (p) drawWalker(p.x, p.y, p.dir, p.step, m.look, false);
    });
  };
})();

function producerWalkLook(s, outfit) {
  const lk = lookState(s);
  const hat = HATS.find(h => h.id === lk.hat), ph = PHONES.find(p => p.id === lk.phones);
  return { skin: lk.skin, hair: hat ? hat.color : lk.hair, shirt: outfit.color, pants: '#1d2b53', ph: ph ? ph.color : '#ff004d' };
}

/* =========================================================
   PANELES
   ========================================================= */
function producerPreviewURL(s) {
  const c = document.createElement('canvas');
  c.width = 44; c.height = 52;
  const g = c.getContext('2d'), prev = X;
  X = g;
  R(0, 0, 44, 52, '#251f40');
  g.save(); g.translate(0, -86);
  drawProducer(22, 0, 'idle', s.life.outfit, lookState(s));
  g.restore();
  X = prev;
  const big = document.createElement('canvas');
  big.width = 132; big.height = 156;
  const bg = big.getContext('2d');
  bg.imageSmoothingEnabled = false;
  bg.drawImage(c, 0, 0, 132, 156);
  return big.toDataURL();
}

Object.assign(UI, {
  /* ---------- Banco Pixel ---------- */
  bank(tab = 'ahorro') {
    const s = G.s, B = bankState(s), T = taxState(s);
    let cur = tab;
    const m = this.modal('Banco Pixel', '', { wide: true });
    const field = `<div class="field bank-amt"><input id="bank-amt" type="number" inputmode="numeric" min="0" step="100" placeholder="Monto"></div>`;
    const render = () => {
      let h = this.tabs([['ahorro', 'Ahorros'], ['cdt', 'CDT'], ['credito', 'Crédito'], ['dian', 'DIAN']], cur) +
        `<div class="money-line">Efectivo: <b>${fmtMoney(s.money)}</b> · Ahorros: <b>${fmtMoney(B.savings)}</b></div>`;
      if (cur === 'ahorro') {
        h += `<p class="muted">Tu plata en el banco gana <b>0,1% semanal</b> (~5% al año) y nadie te la puede robar en la calle. Si te falta efectivo para un pago, el banco lo toma de aquí.</p>
          ${field}
          <div class="row wrap"><button class="btn primary small" data-dep="amt">Depositar</button><button class="btn small" data-dep="all">Depositar todo</button>
          <button class="btn primary small" data-wd="amt">Retirar</button><button class="btn small" data-wd="all">Retirar todo</button></div>
          <p class="muted small">Intereses ganados en total: ${fmtMoney(B.earned)}</p>`;
      } else if (cur === 'cdt') {
        h += `<p class="muted">Un CDT congela tu dinero unas semanas a cambio de más intereses. Al vencer, todo pasa a tus ahorros. Mínimo $1.000.</p>${field}<div class="grid">` +
          CDT_PLANS.map((p, i) => `<div class="card">${iconImg('coin')}<div class="cinfo"><b>CDT a ${p.weeks} semanas</b><div class="muted">Ganas ${pctTxt(p.rate)} al final</div></div>
            <div class="cbuy"><button class="btn primary small" data-cdt="${i}">Abrir</button></div></div>`).join('') + '</div>';
        h += B.cdts.length ? '<h3>Tus CDT</h3><div class="grid">' + B.cdts.map((c, i) => `<div class="card">${iconImg('gold')}<div class="cinfo"><b>${fmtMoney(c.amount)} al ${pctTxt(c.rate)}</b>
            <div class="muted">Vence en ${c.left} semana(s): recibes ${fmtMoney(c.amount * (1 + c.rate))}</div></div>
            <div class="cbuy"><button class="btn small" data-cancel="${i}">Cancelar (−5%)</button></div></div>`).join('') + '</div>' : '';
      } else if (cur === 'credito') {
        const lim = loanLimit(s);
        h += `<div class="bar-mini big"><span>Puntaje</span><i><em class="${B.score < 30 ? 'low' : ''}" style="width:${B.score}%"></em></i><span>${Math.round(B.score)}</span></div>`;
        if (B.loan) {
          const L = B.loan;
          h += `<p>Debes <b>${fmtMoney(L.owed)}</b>. La cuota de <b>${fmtMoney(L.weekly)}</b> se cobra sola cada semana.${L.missed ? ` <span class="warn">Cuotas sin pagar: ${L.missed}/4</span>` : ''}</p>
            <p class="muted small">Si dejas de pagar 4 cuotas seguidas, el banco embarga tus ahorros.</p>
            <div class="row"><button class="btn primary small" data-payoff="1" ${s.money + B.savings < L.owed ? 'disabled' : ''}>Pagar todo (${fmtMoney(L.owed)})</button></div>`;
        } else if (!lim) {
          h += '<p class="warn">Tu puntaje es muy bajo. El banco no te presta por ahora: paga a tiempo para recuperarlo.</p>';
        } else {
          h += `<p class="muted">Te prestan hasta <b>${fmtMoney(lim)}</b> (sube con tu prestigio, fans, nivel y puntaje). Pagar a tiempo sube tu puntaje.</p>${field}<div class="grid">` +
            LOAN_PLANS.map((p, i) => `<div class="card">${iconImg('coin')}<div class="cinfo"><b>${p.weeks} semanas</b><div class="muted">Interés total ${pctTxt(p.rate)}</div></div>
              <div class="cbuy"><button class="btn primary small" data-loan="${i}">Pedir</button></div></div>`).join('') + '</div>';
        }
      } else {
        const profit = yearProfit(s), est = taxEstimate(s);
        h += `<p class="muted">La DIAN cobra una vez al año, solo sobre tus <b>ganancias</b> (ingresos menos arriendo, salarios y séquito), por tramos y con tope del 5% de lo que tienes.</p>
          <div class="grid">
            <div class="card">${iconImg('coin')}<div class="cinfo"><b>Este año llevas</b><div class="muted">Ingresos ${fmtMoney(T.gross)} · Gastos ${fmtMoney(T.costs)}</div><div class="bonus">Ganancia: ${fmtMoney(profit)}</div></div></div>
            <div class="card">${iconImg('book')}<div class="cinfo"><b>Impuesto estimado: ${fmtMoney(est)}</b><div class="muted">Declaración en ${weeksToTax(s)} semana(s)${hasEntourage('contador', s) ? ' · tu contador ya te ahorra 20%' : ''}</div>${T.plan ? `<div class="bonus">Plan de pagos: ${T.plan.left} cuota(s) de ${fmtMoney(T.plan.cuota)}</div>` : ''}</div></div>
          </div>
          <h3>Tramos</h3><div class="tax-table">` +
          TAX_BRACKETS.map((b, i) => `<div><span>${i ? 'Desde ' + fmtMoney(TAX_BRACKETS[i - 1].upTo) : 'Hasta ' + fmtMoney(b.upTo)}${i && b.upTo !== Infinity ? ' hasta ' + fmtMoney(b.upTo) : ''}</span><b>${pctTxt(b.rate)}</b></div>`).join('') +
          `</div><p class="muted small">El año pasado: ganancia ${fmtMoney(T.lastProfit)} · impuesto ${fmtMoney(T.lastTax)} · total pagado en tu carrera ${fmtMoney(T.paid)}.</p>`;
      }
      m.set(h);
    };
    m.body.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.tab) { SFX.click(); cur = b.dataset.tab; render(); return; }
      const amt = Math.max(0, Math.floor(+(($('#bank-amt') || {}).value) || 0));
      const fail = msg => { this.toast(msg, 'bad'); SFX.bad(); };
      if (b.dataset.dep) {
        const v = b.dataset.dep === 'all' ? Math.max(0, Math.floor(s.money)) : Math.min(amt, Math.max(0, Math.floor(s.money)));
        if (!v) return fail('Escribe un monto que tengas en efectivo.');
        s.money -= v; B.savings += v; SFX.coin(); this.toast(`Depositaste ${fmtMoney(v)}.`, 'good');
      }
      if (b.dataset.wd) {
        const v = b.dataset.wd === 'all' ? Math.floor(B.savings) : Math.min(amt, Math.floor(B.savings));
        if (!v) return fail('No tienes ese dinero ahorrado.');
        B.savings -= v; s.money += v; SFX.coin(); this.toast(`Retiraste ${fmtMoney(v)}.`, 'good');
      }
      if (b.dataset.cdt) {
        const p = CDT_PLANS[+b.dataset.cdt];
        if (amt < 1000) return fail('El mínimo para un CDT es $1.000.');
        if (s.money + B.savings < amt) return fail('No te alcanza el dinero.');
        charge(amt); B.cdts.push({ amount: amt, rate: p.rate, left: p.weeks });
        SFX.coin(); this.toast(`Abriste un CDT de ${fmtMoney(amt)} a ${p.weeks} semanas.`, 'good');
      }
      if (b.dataset.cancel) {
        const c = B.cdts.splice(+b.dataset.cancel, 1)[0];
        B.savings += Math.round(c.amount * 0.95);
        this.toast(`Cancelaste el CDT: recibiste ${fmtMoney(c.amount * 0.95)}.`, 'muted');
      }
      if (b.dataset.loan) {
        const p = LOAN_PLANS[+b.dataset.loan], lim = loanLimit(s);
        if (amt < 500) return fail('Pide al menos $500.');
        if (amt > lim) return fail(`El banco te presta máximo ${fmtMoney(lim)}.`);
        const owed = Math.round(amt * (1 + p.rate));
        B.loan = { owed, weekly: Math.ceil(owed / p.weeks), missed: 0 };
        s.money += amt; SFX.coin(); this.toast(`Te prestaron ${fmtMoney(amt)}. Cuota semanal: ${fmtMoney(B.loan.weekly)}.`, 'good');
      }
      if (b.dataset.payoff) { charge(B.loan.owed); B.loan = null; B.score = Math.min(100, B.score + 10); SFX.coin(); this.toast('¡Pagaste tu crédito completo!', 'good'); }
      saveGame(); render(); this.refresh();
    });
    render();
  },

  /* ---------- Séquito ---------- */
  entourage() {
    const s = G.s;
    const m = this.modal('Tu séquito', '', { wide: true });
    const render = () => {
      const seq = seqState(s);
      let h = `<p class="muted">La gente que anda contigo a todas partes. Te siguen por la ciudad y cada uno te da un beneficio, pero cobran cada semana. Cupos: <b>${seq.length}/${seqSlots(s)}</b> (más prestigio = más cupos).</p>
        <div class="money-line">Dinero: <b>${fmtMoney(s.money)}</b> · Sueldos del séquito: <b>${fmtMoney(seq.reduce((a, x) => a + ENT_BY_ID[x.id].salary, 0))}/sem</b></div><div class="grid">`;
      h += ENTOURAGE.map(e => {
        const mem = seq.find(x => x.id === e.id), err = mem ? null : entError(e.id);
        return `<div class="card ${mem ? 'owned' : err ? 'locked' : ''}">${mem ? `<img class="portrait sm" src="${portraitURL(mem.look)}" alt="">` : iconImg(e.icon)}
          <div class="cinfo"><b>${e.name}${mem ? ` · ${esc(mem.name)}` : ''}</b><div class="muted">${e.desc}</div><div class="bonus">${fmtMoney(e.salary)}/semana${err && !mem ? ' · ' + err : ''}</div></div>
          <div class="cbuy">${mem ? `<button class="btn small" data-fire="${e.id}">Despedir</button>` : `<button class="btn primary small" data-hire="${e.id}" ${err ? 'disabled' : ''}>Contratar</button>`}</div></div>`;
      }).join('') + '</div>';
      m.set(h);
    };
    m.body.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.hire) {
        const err = hireEntourage(b.dataset.hire);
        if (err) { this.toast(err, 'bad'); SFX.bad(); } else { SFX.coin(); this.toast(`${ENT_BY_ID[b.dataset.hire].name} se unió a tu séquito.`, 'good'); }
      }
      if (b.dataset.fire) { fireEntourage(b.dataset.fire); SFX.click(); }
      saveGame(); render(); this.refresh();
    });
    render();
  },

  /* ---------- Personalizar al productor ---------- */
  customize(tab = 'cuerpo') {
    const s = G.s, L = s.life, lk = lookState(s);
    let cur = tab;
    const m = this.modal('Personalizar', '', { wide: true });
    const sw = (attr, val, color, on) => `<button class="swatch-btn ${on ? 'on' : ''}" data-${attr}="${val}" style="background:${color}" aria-label="${val}"></button>`;
    const item = (kind, it, on, own, extra = '') => `<div class="card ${own ? 'owned' : ''}">${extra}<div class="cinfo"><b>${it.name}</b></div><div class="cbuy">${on ? `<button class="btn small" data-off="${kind}">Quitar</button>` :
      own ? `<button class="btn small" data-wear-${kind}="${it.id}">Ponerse</button>` : `<button class="btn primary small" data-buy-${kind}="${it.id}" ${s.money < it.price ? 'disabled' : ''}>${it.price ? fmtMoney(it.price) : 'Gratis'}</button>`}</div></div>`;
    const render = () => {
      let h = `<div class="custom-wrap"><img class="custom-preview" src="${producerPreviewURL(s)}" alt="Tu productor"><div class="custom-opts">` +
        this.tabs([['cuerpo', 'Cuerpo'], ['ropa', 'Ropa'], ['acces', 'Accesorios']], cur) + `<div class="money-line">Dinero: <b>${fmtMoney(s.money)}</b></div>`;
      if (cur === 'cuerpo') {
        h += `<h3>Piel</h3><div class="swatches">${SKINS.map(c => sw('skin', c, c, lk.skin === c)).join('')}</div>
          <h3>Color de pelo</h3><div class="swatches">${HAIR_COLORS.map(c => sw('hair', c, c, lk.hair === c)).join('')}</div>
          <h3>Peinado</h3><div class="row wrap">${HAIR_STYLES.map((n, i) => `<button class="btn small ${(lk.style || 0) === i ? 'primary' : ''}" data-style="${i}">${n}</button>`).join('')}</div>`;
      } else if (cur === 'ropa') {
        h += '<div class="grid">' + OUTFITS.map(o => {
          const own = L.outfits.includes(o.id), on = L.outfit === o.id;
          return `<div class="card ${own ? 'owned' : ''}"><span class="swatch" style="background:${o.color}"></span><div class="cinfo"><b>${o.name}</b></div><div class="cbuy">${on ? '<span class="ok">✓ Puesto</span>' : own ? `<button class="btn small" data-wear="${o.id}">Ponerse</button>` :
            `<button class="btn primary small" data-outfit="${o.id}" ${s.money < o.price ? 'disabled' : ''}>${fmtMoney(o.price)}</button>`}</div></div>`;
        }).join('') + '</div>';
      } else {
        const own = id => L.owned.includes(id);
        h += '<h3>Gorras</h3><div class="grid">' + HATS.map(it => item('hat', it, lk.hat === it.id, own(it.id), `<span class="swatch" style="background:${it.color}"></span>`)).join('') + '</div>';
        h += '<h3>Cadenas</h3><div class="grid">' + CHAINS.map(it => item('chain', it, lk.chain === it.id, own(it.id), `<span class="swatch" style="background:${it.color}"></span>`)).join('') + '</div>';
        h += '<h3>Audífonos</h3><div class="grid">' + PHONES.map(it => item('phones', it, lk.phones === it.id, own(it.id), `<span class="swatch" style="background:${it.color}"></span>`)).join('') + '</div>';
      }
      m.set(h + '</div></div>');
    };
    const LISTS = { hat: HATS, chain: CHAINS, phones: PHONES };
    m.body.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      const d = b.dataset;
      if (d.tab) cur = d.tab;
      if (d.skin) lk.skin = d.skin;
      if (d.hair) lk.hair = d.hair;
      if (d.style) lk.style = +d.style;
      if (d.outfit) { const o = OUTFITS.find(x => x.id === d.outfit); s.money -= o.price; L.outfits.push(o.id); L.outfit = o.id; SFX.coin(); }
      if (d.wear) L.outfit = d.wear;
      for (const k of Object.keys(LISTS)) {
        const buy = d['buy' + k[0].toUpperCase() + k.slice(1)], wear = d['wear' + k[0].toUpperCase() + k.slice(1)];
        if (buy) { const it = LISTS[k].find(x => x.id === buy); if (s.money < it.price) return; s.money -= it.price; L.owned.push(it.id); lk[k] = it.id; SFX.coin(); this.toast(`Compraste: ${it.name}`, 'good'); }
        if (wear) lk[k] = wear;
      }
      if (d.off) lk[d.off] = d.off === 'phones' ? 'rojo' : null;
      SFX.click(); saveGame(); render(); this.refresh();
    });
    render();
  },
});
