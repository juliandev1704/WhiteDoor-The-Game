'use strict';
/* =========================================================
   WHITE DOOR — v2.7: DIAN más justa (deduce los gastos del
   negocio) y Spoony, el perrito alcancía
   ========================================================= */

/* ---------- Spoony ---------- */
Object.assign(ICONS, {
  spoony: ['.....yy.....', '.....kk.....', 'kk.wwwwww.kk', 'kkwwwwwwwwkk', 'kkwkwwwwkwkk', 'kkwwwwwwwwkk',
           '.kwwwkkwwwk.', '..wwwwwwww..', '..rrrryrrr..', '.wwwwwwwwww.', '.wwgwwwwgww.', '.gg..gg..gg.'],
});
const hasSpoony = (s = G.s) => !!(s && s.items.includes('dec_spoony'));

(function () {
  const wealth = s => Math.max(0, s.money) + bankState(s).savings;

  /* ---------- DIAN: gastos del negocio que se descuentan ---------- */
  const deductible = ['buyEquip', 'buyItem', 'buyRoom', 'buyModule', 'enrollCourse', 'hireStaff', 'signArtist', 'buyMerch', 'hireEntourage', 'startSong', 'studioRobbery'];
  for (const fn of deductible) {
    const base = window[fn];
    if (typeof base !== 'function') continue;
    window[fn] = function (...a) {
      const s = G.s, w0 = s ? wealth(s) : 0;
      const r = base.apply(this, a);
      if (s && G.s === s) { const spent = w0 - wealth(s); if (spent > 0) taxState(s).costs += spent; }
      return r;
    };
  }
  // Las reparaciones también cuentan como gasto
  const baseBreak = breakdownEvent;
  breakdownEvent = function (...a) {
    const ev = baseBreak.apply(this, a);
    if (ev && ev.options) ev.options.forEach(o => {
      const run = o.run;
      if (typeof run === 'function') o.run = function (...b) {
        const s = G.s, w0 = wealth(s);
        const r = run.apply(this, b);
        const spent = w0 - wealth(s); if (spent > 0) taxState(s).costs += spent;
        return r;
      };
    });
    return ev;
  };

  /* ---------- Semana: aviso de la DIAN y Spoony ---------- */
  const baseWeek = advanceWeek;
  advanceWeek = function () {
    const s = G.s;
    baseWeek();
    if (!G.running || G.s !== s) return;
    if (weeksToTax(s) === 4) {
      const est = taxEstimate(s);
      UI.toast(est >= 100 ? `La DIAN cobra en 4 semanas: unos ${fmtMoney(est)}. Revisa el Banco > DIAN.` : 'La DIAN declara en 4 semanas. Por ahora no te toca pagar.', 'muted');
    }
    if (hasSpoony(s)) {
      const B = bankState(s), T = taxState(s);
      if (B.savings > 0) { const i = B.savings * SAVINGS_RATE; B.savings += i; B.earned += i; T.gross += i; }
      const coins = Math.round(Math.min(3000, 100 + ((s.lastIncome || 0) + (s.lastSide || 0)) * 0.02));
      s.money += coins; T.gross += coins;
      s.life.spoonyCoins = (s.life.spoonyCoins || 0) + coins;
      if (s.week % 4 === 0) UI.toast(`Spoony soltó ${fmtMoney(coins)} en monedas esta semana.`, 'good');
    }
  };
  /* ---------- Spoony: +5% en pagos de canciones y trabajos ---------- */
  for (const fn of ['finishJob', 'releaseSong']) {
    const base = window[fn];
    window[fn] = function (...a) {
      const s = G.s, m0 = s.money;
      const r = base.apply(this, a);
      if (hasSpoony(s) && s.money > m0) { const x = Math.round((s.money - m0) * 0.05); s.money += x; taxState(s).gross += x; }
      return r;
    };
  }

  /* ---------- Spoony en el estudio: alcancía sobre el escritorio ---------- */
  const baseCtl = drawControl;
  drawControl = function (ctx, s, t, opts) {
    baseCtl(ctx, s, t, opts);
    if (!hasSpoony(s)) return;
    const L = layout(s);
    X = ctx;
    // Extremo derecho del escritorio (la tapa está en y 103); si hay parlantes, se sube al derecho
    const mt = s.equip.monitor, sh = mt >= 2 ? (mt >= 3 ? 20 : 16) : 0;
    const x0 = sh ? L.cx + 35 : L.cx + 33, y0 = 91 - sh;
    R(x0 + 1, y0 + 12, 11, 1, 'rgba(0,0,0,.35)');
    ICONS.spoony.forEach((row, y) => {
      if (y < 2) return; // la moneda se anima aparte
      for (let x = 0; x < 12; x++) { const c = row[x]; if (c !== '.' && ICON_PAL[c]) P(x0 + x, y0 + y, ICON_PAL[c]); }
    });
    if (((t / 300) | 0) % 2) P(x0 + 12, y0 + 8, ICON_PAL.w); else P(x0 + 12, y0 + 9, ICON_PAL.w); // colita
    // Una moneda cae por la ranura de vez en cuando
    const ph = (t % 4000) / 4000;
    if (ph < 0.3) { const cy = Math.round(y0 - 6 + ph / 0.3 * 7); R(x0 + 5, cy, 2, 2, ICON_PAL.y); }
    R(x0 + 5, y0 + 2, 2, 1, ICON_PAL.k); // ranura
  };
})();
