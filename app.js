/* =========================================================
   Finanças da Dayanne — app
   ========================================================= */
(function () {
  'use strict';

  /* ---------------- constantes ---------------- */

  const KEY = 'dayanne.financas.v1';

  /* categorias de fábrica: só semeiam o store na primeira vez. Depois disso
     quem manda é store.cats, que ela pode editar em Ajustes → Categorias. */
  const DEFAULT_CATS = {
    /* uma cor por categoria: tons bem separados entre si, sino todas da
       mesma familia (antes eram 10 roxos e nao dava pra distinguir no grafico) */
    expense: [
      { id: 'food',    name: 'Alimentação', icon: 'food',     color: '#BE7345' },
      { id: 'trans',   name: 'Transporte',  icon: 'car',      color: '#518CC2' },
      { id: 'home',    name: 'Moradia',     icon: 'house',    color: '#BE65E4' },
      { id: 'shop',    name: 'Compras',     icon: 'bag',      color: '#D2509F' },
      { id: 'fun',     name: 'Lazer',       icon: 'drink',    color: '#3A9588' },
      { id: 'beauty',  name: 'Beleza',      icon: 'lipstick', color: '#D4555F' },
      { id: 'health',  name: 'Saúde',       icon: 'heart',    color: '#42955F' },
      { id: 'study',   name: 'Educação',    icon: 'book',     color: '#6C5BD6' },
      { id: 'pets',    name: 'Pets',        icon: 'paw',      color: '#998934' },
      { id: 'other',   name: 'Outros',      icon: 'sparkle',  color: '#7C8494' }
    ],
    /* entradas ficam na familia do verde: bate com o "+" da lista */
    income: [
      { id: 'salary',   name: 'Salário',   icon: 'money',   color: '#33691E' },
      { id: 'gift',     name: 'Presente',  icon: 'gift',    color: '#5C8F1F' },
      { id: 'other-in', name: 'Outros',    icon: 'sparkle', color: '#14614F' }
    ]
  };

  /* categorias que sairam do app: registros antigos passam a usar a nova */
  const CAT_ALIAS = { freela: 'other-in' };

  function catAlias(id) {
    return CAT_ALIAS[id] || id;
  }

  /* ---------------- ícones ----------------
     traço 1.8, cantos redondos, herdam currentColor */

  const SVG_ATTR = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

  const ICONS = {
    food: '<path d="M7.5 3v5.2a2.4 2.4 0 0 1-4.8 0V3"/><path d="M5.1 10.6V21"/><path d="M16.8 3.3c1.7 0 3 1.6 3 3.9s-1.3 3.9-3 3.9-3-1.6-3-3.9 1.3-3.9 3-3.9Z"/><path d="M16.8 11.1V21"/>',
    car: '<path d="M3 14.4v-2l2.3-4.3h13.4L21 12.4v2"/><circle cx="7.2" cy="15.4" r="1.8"/><circle cx="16.8" cy="15.4" r="1.8"/><path d="M9.2 15.4h5.6"/>',
    house: '<path d="M3.5 10.6 12 3.6l8.5 7"/><path d="M5.9 9v9.4a1.6 1.6 0 0 0 1.6 1.6h9a1.6 1.6 0 0 0 1.6-1.6V9"/><path d="M10 20v-4.4h4V20"/>',
    bag: '<path d="M5.2 8h13.6l-1 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5.2 8Z"/><path d="M9 8V6.2a3 3 0 0 1 6 0V8"/>',
    drink: '<path d="M4.6 4h14.8l-7.4 8.4L4.6 4Z"/><path d="M12 12.4v7.2"/><path d="M8.6 20.4h6.8"/>',
    lipstick: '<rect x="8.6" y="11.4" width="6.8" height="9.2" rx="1.6"/><path d="M9.9 11.4V7.7L12 4.9l2.1 2.8v3.7"/>',
    heart: '<path d="M12 20.3s-7.5-4.5-7.5-10a4.4 4.4 0 0 1 7.5-2.8 4.4 4.4 0 0 1 7.5 2.8c0 5.5-7.5 10-7.5 10Z"/>',
    book: '<path d="M12 6.6c-1.6-1.3-4-1.6-6-1v13.2c2-.6 4.4-.3 6 1 1.6-1.3 4-1.6 6-1V5.6c-2-.6-4.4-.3-6 1Z"/><path d="M12 6.6v13.2"/>',
    paw: '<ellipse cx="5.4" cy="9.7" rx="1.9" ry="2.3"/><ellipse cx="10" cy="6.7" rx="1.9" ry="2.4"/><ellipse cx="14" cy="6.7" rx="1.9" ry="2.4"/><ellipse cx="18.6" cy="9.7" rx="1.9" ry="2.3"/><path d="M12 11.3c2.9 0 5.2 2 5.2 4.5 0 2-1.6 3.4-3.2 3.4-.9 0-1.3-.3-2-.3s-1.1.3-2 .3c-1.6 0-3.2-1.4-3.2-3.4 0-2.5 2.3-4.5 5.2-4.5Z"/>',
    sparkle: '<path d="M12 3.2l1.9 5.9L20 12l-6.1 2.9L12 20.8l-1.9-5.9L4 12l6.1-2.9L12 3.2Z"/>',
    money: '<rect x="2.6" y="6.4" width="18.8" height="11.2" rx="2.2"/><circle cx="12" cy="12" r="2.6"/><path d="M5.6 9.4v5.2M18.4 9.4v5.2"/>',
    gift: '<rect x="3.6" y="9" width="16.8" height="11.4" rx="2"/><path d="M3.6 13.2h16.8M12 9v11.4"/><path d="M12 9C10.2 9 8 8.4 8 6.6A2.1 2.1 0 0 1 12 5.9a2.1 2.1 0 0 1 4 .7C16 8.4 13.8 9 12 9Z"/>',
    laptop: '<rect x="4.6" y="5.2" width="14.8" height="10" rx="1.8"/><path d="M2.4 18.4h19.2"/>',
    receive: '<path d="M12 4v13"/><path d="M6.5 11.5 12 17l5.5-5.5"/>',
    pie: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5V12h8.5"/>',
    receipt: '<path d="M6 3.2h12v17.6l-2.4-1.6-2.4 1.6-2.4-1.6-2.4 1.6L6 20.8V3.2Z"/><path d="M9.2 8h5.6M9.2 12h5.6"/>',
    check: '<path d="M4.6 12.6 9.6 17.6 19.4 7.8"/>',
    info: '<circle cx="12" cy="12" r="8.6"/><path d="M12 11.2v5.4"/><path d="M12 7.6v.02"/>',
    close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    search: '<circle cx="11" cy="11" r="6.4"/><path d="M15.9 15.9 20.6 20.6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    repeat: '<path d="M17 3.5 20 6.5 17 9.5"/><path d="M20 6.5H8a4 4 0 0 0-4 4v.5"/><path d="M7 20.5 4 17.5 7 14.5"/><path d="M4 17.5h12a4 4 0 0 0 4-4v-.5"/>'
  };

  function svg(name, cls) {
    return '<svg class="ic' + (cls ? ' ' + cls : '') + '" ' + SVG_ATTR + '>' +
      (ICONS[name] || ICONS.sparkle) + '</svg>';
  }

  let CATS = { expense: [], income: [] };
  const BY_ID = {};

  function defaultCats() {
    const out = { expense: [], income: [] };
    ['expense', 'income'].forEach(function (t) {
      DEFAULT_CATS[t].forEach(function (c) {
        out[t].push({ id: c.id, name: c.name, icon: c.icon, color: c.color, hidden: false });
      });
    });
    return out;
  }

  function normCat(c) {
    if (!c || typeof c !== 'object') return null;
    const id = String(c.id || '').slice(0, 40);
    const name = String(c.name == null ? '' : c.name).trim().slice(0, 18);
    if (!id || !name) return null;
    return {
      id: id,
      name: name,
      icon: typeof c.icon === 'string' && c.icon ? c.icon : 'sparkle',
      color: /^#[0-9a-fA-F]{6}$/.test(c.color) ? c.color : '#7C8494',
      hidden: c.hidden === true
    };
  }

  function normalizeCats(raw) {
    const out = { expense: [], income: [] };
    ['expense', 'income'].forEach(function (t) {
      const list = raw && Array.isArray(raw[t]) ? raw[t] : null;
      if (list) out[t] = list.map(normCat).filter(Boolean);
    });
    const padrao = defaultCats();
    if (!out.expense.length) out.expense = padrao.expense;
    if (!out.income.length) out.income = padrao.income;
    return out;
  }

  function buildCats() {
    CATS = { expense: [], income: [] };
    Object.keys(BY_ID).forEach(function (k) { delete BY_ID[k]; });
    ['expense', 'income'].forEach(function (type) {
      ((store && store.cats && store.cats[type]) || []).forEach(function (c) {
        const item = { id: c.id, name: c.name, icon: c.icon, color: c.color, hidden: !!c.hidden, type: type };
        BY_ID[c.id] = item;
        CATS[type].push(item);
      });
    });
  }

  /* categorias que aparecem nos seletores (as escondidas ficam de fora) */
  function visCats(type) {
    const all = CATS[type] || [];
    const vis = all.filter(function (c) { return !c.hidden; });
    return vis.length ? vis : all;
  }

  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const MESES_AB = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
                    'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  /* ---------------- utilidades ---------------- */

  /* ---------------- moedas e câmbio ---------------- */

  const RATE_KEY = 'dayanne.rates.v1';

  const CUR = {
    BRL: { sym: 'R$', dec: 2, name: 'Real' },
    PYG: { sym: 'Gs', dec: 0, name: 'Guarani' },
    USD: { sym: '$',  dec: 2, name: 'Dólar' }
  };

  const NF2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const NF0 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  /* quanto vale 1 real em cada moeda (valores de reserva, p/ funcionar offline) */
  let rates = { BRL: 1, PYG: 1100, USD: 0.172 };
  let ratesInfo = { at: 0, date: '', source: '' };
  let rateState = 'idle'; /* idle | loading | ok | offline */

  function fmtCur(value, cur) {
    const c = CUR[cur] || CUR.BRL;
    const s = (c.dec === 0 ? NF0 : NF2).format(Math.abs(value));
    return (value < 0 ? '−' : '') + c.sym + ' ' + s;
  }

  /* valor guardado em reais -> moeda escolhida no app */
  function fmtAmount(reais) {
    const cur = store ? (store.currency || 'BRL') : 'BRL';
    return fmtCur((reais || 0) * (rates[cur] || 1), cur);
  }

  /* taxa com casas adaptadas (0,1718 em vez de 0,17) */
  function fmtRateVal(v, cur) {
    const c = CUR[cur] || CUR.BRL;
    let dec = c.dec;
    if (dec === 2 && Math.abs(v) < 1) dec = 4;
    const s = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
      .format(Math.abs(v));
    return (v < 0 ? '−' : '') + c.sym + ' ' + s;
  }

  function saveRates() {
    try { localStorage.setItem(RATE_KEY, JSON.stringify({ rates: rates, info: ratesInfo })); } catch (e) { /* sem espaço */ }
  }

  function applyRates(next, date, source) {
    if (!next || !(next.PYG > 0) || !(next.USD > 0)) return;
    rates = { BRL: 1, PYG: next.PYG, USD: next.USD };
    ratesInfo = { at: Date.now(), date: date || '', source: source || '' };
    rateState = 'ok';
    saveRates();
    try {
      renderAll();
      renderFx();
      renderCurSeg();
      renderRateNote();
      renderFixList();
    } catch (e) { /* não perde a cotação por causa de um erro de render */ }
  }

  function fetchJSON(url, ms) {
    return new Promise(function (resolve, reject) {
      let done = false;
      const fail = setTimeout(function () {
        if (!done) { done = true; reject(new Error('tempo esgotado')); }
      }, ms);
      fetch(url, { cache: 'no-store' })
        .then(function (r) {
          if (!r.ok) throw new Error('http ' + r.status);
          return r.json();
        })
        .then(function (d) {
          if (done) return;
          done = true;
          clearTimeout(fail);
          resolve(d);
        })
        .catch(function (e) {
          if (done) return;
          done = true;
          clearTimeout(fail);
          reject(e);
        });
    });
  }

  function refreshRates(manual) {
    if (typeof fetch !== 'function') {
      rateState = ratesInfo.at ? 'ok' : 'offline';
      renderRateNote();
      return;
    }
    rateState = 'loading';
    renderRateNote();

    fetchJSON('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/brl.min.json', 9000)
      .then(function (d) {
        if (!d || !d.brl || !(d.brl.pyg > 0) || !(d.brl.usd > 0)) throw new Error('formato');
        applyRates({ PYG: d.brl.pyg, USD: d.brl.usd }, d.date || '', 'currency-api');
      })
      .catch(function () {
        return fetchJSON('https://open.er-api.com/v6/latest/BRL', 9000).then(function (d) {
          if (!d || !d.rates || !(d.rates.PYG > 0) || !(d.rates.USD > 0)) throw new Error('formato');
          applyRates({ PYG: d.rates.PYG, USD: d.rates.USD }, d.time_last_update_utc || '', 'er-api');
        });
      })
      .catch(function () {
        rateState = ratesInfo.at ? 'ok' : 'offline';
        renderRateNote();
        if (manual) toast('Sem internet. Usei a última cotação salva.', 'err');
      });
  }

  function loadRates() {
    try {
      const c = JSON.parse(localStorage.getItem(RATE_KEY) || 'null');
      if (c && c.rates && c.rates.PYG > 0 && c.rates.USD > 0) {
        rates = { BRL: 1, PYG: c.rates.PYG, USD: c.rates.USD };
        ratesInfo = c.info || { at: 0, date: '', source: '' };
      }
    } catch (e) { /* ignora */ }
    refreshRates(false);
  }

  function rateAgeLabel() {
    if (rateState === 'loading') return 'atualizando…';
    if (!ratesInfo.at) return 'cotação aproximada';
    const min = Math.round((Date.now() - ratesInfo.at) / 60000);
    if (min < 1) return 'agora mesmo';
    if (min < 60) return 'há ' + min + ' min';
    const h = Math.round(min / 60);
    if (h < 24) return 'há ' + h + 'h';
    return 'há ' + Math.round(h / 24) + 'd';
  }

  function renderRateNote() {
    const el = $('rateNote');
    if (!el) return;
    const head = rateState === 'offline' ? 'Sem internet · ' : '';
    el.textContent = head + '1 R$ = ' + fmtRateVal(rates.PYG, 'PYG') +
      '  ·  ' + fmtRateVal(rates.USD, 'USD') + '  ·  ' + rateAgeLabel();
  }

  function catOf(id) {
    return BY_ID[catAlias(id)] || { id: id, name: 'Outros', icon: 'sparkle', color: '#7C8494' };
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function isoOf(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function parseISO(s) {
    const p = String(s).split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function monthOf(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1);
  }

  function monthLabel(ym) {
    const p = ym.split('-');
    const n = MESES[Number(p[1]) - 1] || '';
    return n.charAt(0).toUpperCase() + n.slice(1) + ' ' + p[0];
  }

  function monthShort(ym) {
    if (!ym) return '';
    const p = ym.split('-');
    return (MESES_AB[Number(p[1]) - 1] || '') + '/' + p[0];
  }

  function shiftYM(ym, n) {
    const p = ym.split('-');
    return monthOf(new Date(Number(p[0]), Number(p[1]) - 1 + n, 1));
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function hexA(hex, a) {
    let h = String(hex).replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    const n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function sumArr(arr) {
    return arr.reduce(function (s, t) { return s + (Number(t.amount) || 0); }, 0);
  }

  function sumType(arr, type) {
    return sumArr(arr.filter(function (t) { return t.type === type; }));
  }

  function byDateDesc(a, b) {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return 0;
  }

  function greet() {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  function $(id) { return document.getElementById(id); }

  function validTx(t) {
    return !!t && typeof t === 'object' &&
      (t.type === 'income' || t.type === 'expense') &&
      typeof t.amount === 'number' && isFinite(t.amount) && t.amount > 0 &&
      typeof t.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.date) &&
      typeof t.cat === 'string';
  }

  function normTx(t) {
    return {
      id: t.id || ('x' + Math.random().toString(36).slice(2, 10)),
      type: t.type,
      cat: catAlias(t.cat),
      amount: Math.round(Number(t.amount) * 1e6) / 1e6,
      desc: String(t.desc == null ? '' : t.desc).slice(0, 60),
      date: t.date
    };
  }

  function validRec(r) {
    return !!r && typeof r === 'object' &&
      (r.type === 'income' || r.type === 'expense') &&
      typeof r.amount === 'number' && isFinite(r.amount) && r.amount > 0 &&
      typeof r.cat === 'string' &&
      typeof r.day === 'number' && r.day >= 1 && r.day <= 31 &&
      typeof r.from === 'string' && /^\d{4}-\d{2}$/.test(r.from);
  }

  function normRec(r) {
    return {
      id: r.id || ('r' + Math.random().toString(36).slice(2, 10)),
      type: r.type,
      cat: catAlias(r.cat),
      amount: Math.round(Number(r.amount) * 1e6) / 1e6,
      desc: String(r.desc == null ? '' : r.desc).slice(0, 60),
      day: Math.min(31, Math.max(1, Math.round(r.day))),
      from: r.from,
      to: (typeof r.to === 'string' && /^\d{4}-\d{2}$/.test(r.to)) ? r.to : '',
      active: r.active !== false
    };
  }

  /* ---------------- persistência ---------------- */

  let store = null;
  let view = monthOf(new Date());
  let filter = 'all';
  let query = '';          /* busca por texto em Registros */
  let catFilter = 'all';   /* categoria selecionada em Registros */
  let editing = null;
  let formType = 'expense';
  let formCat = 'food';
  let formFrom = '';      /* mês de início do fixo (YYYY-MM) */
  let formTo = '';        /* mês em que o fixo acaba ('' = pra sempre) */
  let formValue = 0;      /* valor digitado, na moeda do app */
  let editingFix = null;  /* id do fixo sendo editado */
  let justSeeded = false;
  let applyingRemote = false; /* true enquanto a nuvem está gravando no aparelho */

  /* transforma o objeto cru (do localStorage ou da nuvem) no store do app */
  function storeFrom(s) {
    const legacy = !s.v || Number(s.v) < 2;
    return {
      v: 2,
      name: (typeof s.name === 'string' && s.name.trim()) ? s.name.trim() : 'Dayanne',
      currency: s.currency === 'PYG' ? 'PYG' : 'BRL',
      /* v1 guardava centavos; v2 guarda reais */
      txs: s.txs.filter(validTx).map(function (t) {
        return normTx({
          id: t.id, type: t.type, cat: t.cat,
          amount: legacy ? Number(t.amount) / 100 : Number(t.amount),
          desc: t.desc, date: t.date
        });
      }),
      recurring: Array.isArray(s.recurring) ? s.recurring.filter(validRec).map(normRec) : [],
      cats: normalizeCats(s.cats),
      seeded: !!s.seeded
    };
  }

  function loadStore() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (raw == null) return null;
    try {
      const s = JSON.parse(raw);
      if (s && Array.isArray(s.txs)) return storeFrom(s);
    } catch (e) { /* arquivo corrompido */ }
    return { v: 2, name: 'Dayanne', currency: 'BRL', txs: [], recurring: [], cats: defaultCats(), seeded: true };
  }

  function saveStore() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* sem espaço */ }
    /* se quem gravou foi a nuvem, não devolve a mesma coisa pra ela */
    if (!applyingRemote && typeof window !== 'undefined' && window.Sync && window.Sync.ready()) {
      window.Sync.queuePush();
    }
  }

  function demoData() {
    /* valores em reais */
    const raw = [
      ['income',  'salary',   3200,    'Salário',            35],
      ['income',  'salary',   3200,    'Salário',             5],
      ['income',  'other-in',  450,    'Venda do vestido',   13],
      ['income',  'gift',      150,    'Presente da mamãe',  21],
      ['expense', 'home',     1200,    'Aluguel',            34],
      ['expense', 'home',      189,    'Conta de luz',       30],
      ['expense', 'home',       99,    'Internet',           30],
      ['expense', 'food',      187.40, 'Mercado da semana',   2],
      ['expense', 'food',       35.60, 'Café com as amigas',  1],
      ['expense', 'food',       67.90, 'iFood',               6],
      ['expense', 'food',      129,    'Mercado',            17],
      ['expense', 'trans',      24.90, 'Uber',                3],
      ['expense', 'trans',       8.90, 'Metrô',               9],
      ['expense', 'trans',      32,    'Uber',               19],
      ['expense', 'shop',      159.90, 'Tênis novo',         11],
      ['expense', 'shop',       45.90, 'Perfume',             8],
      ['expense', 'fun',        42,    'Cinema',             14],
      ['expense', 'fun',        80,    'Rolê com o povo',    22],
      ['expense', 'beauty',    120,    'Salão',              16],
      ['expense', 'beauty',     39,    'Acessórios',         26],
      ['expense', 'health',     32.50, 'Farmácia',            7],
      ['expense', 'study',      59.90, 'Livro',              23],
      ['expense', 'pets',       89.90, 'Ração da Nina',      12],
      ['expense', 'other',      50,    'Presente surpresa',   4]
    ];
    return raw.map(function (r, i) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - r[4]);
      return { id: 'seed' + i, type: r[0], cat: r[1], amount: r[2], desc: r[3], date: isoOf(d) };
    });
  }

  /* ---------------- seletores / helpers de dados ---------------- */

  function daysInMonth(ym) {
    const p = ym.split('-');
    return new Date(Number(p[0]), Number(p[1]), 0).getDate();
  }

  /* fixos válidos no mês ym, como registros virtuais */
  function recFor(ym) {
    const out = [];
    (store.recurring || []).forEach(function (r) {
      if (!r || r.active === false) return;
      if (ym < r.from) return;
      if (r.to && ym > r.to) return;
      const day = Math.min(r.day, daysInMonth(ym));
      out.push({
        id: 'r:' + r.id,
        type: r.type,
        cat: r.cat,
        amount: r.amount,
        desc: r.desc,
        date: ym + '-' + pad2(day),
        fixed: true
      });
    });
    return out;
  }

  function txsForMonth(ym) {
    return store.txs.filter(function (t) { return t.date.slice(0, 7) === ym; }).concat(recFor(ym));
  }

  function monthTx() {
    return txsForMonth(view);
  }

  function groupExpenses(txs) {
    const map = {};
    txs.forEach(function (t) {
      if (t.type !== 'expense') return;
      const c = catOf(t.cat);
      if (!map[c.id]) map[c.id] = { id: c.id, name: c.name, icon: c.icon, color: c.color, amount: 0 };
      map[c.id].amount += t.amount;
    });
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return b.amount - a.amount; });
  }

  function dayLabel(iso) {
    const d = parseISO(iso);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = Math.round((today - that) / 86400000);
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Ontem';
    return d.getDate() + ' de ' + MESES[d.getMonth()];
  }

  function shortDay(iso) {
    const d = parseISO(iso);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = Math.round((today - that) / 86400000);
    if (diff === 0) return 'hoje';
    if (diff === 1) return 'ontem';
    return d.getDate() + ' ' + MESES_AB[d.getMonth()];
  }

  /* ---------------- animação de números ---------------- */

  function animateMoney(id, target) {
    const el = $(id);
    if (!el) return;
    const from = Number(el.dataset.v || 0);
    el.dataset.v = target;
    if (from === target) {
      el.textContent = fmtAmount(target);
      return;
    }
    if (el._raf) cancelAnimationFrame(el._raf);
    const t0 = performance.now();
    const dur = 620;
    (function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmtAmount(from + (target - from) * e);
      if (p < 1) {
        el._raf = requestAnimationFrame(step);
      } else {
        el.textContent = fmtAmount(target);
      }
    })(t0);
  }

  /* ---------------- render: rótulos de mês ---------------- */

  function renderMonthLabels() {
    const cur = monthOf(new Date());
    document.querySelectorAll('[data-monthlabel]').forEach(function (el) {
      el.textContent = monthLabel(view);
    });
    document.querySelectorAll('[data-month="1"]').forEach(function (b) {
      b.disabled = view >= cur;
    });
  }

  /* ---------------- estado vazio (um só, pra todas as telas) ---------------- */

  /* opts: { icon, title, sub, cta, hint, add, clear }
     add   -> o botão abre a folha de novo registro
     clear -> o botão limpa busca/filtros                                    */
  function emptyHTML(o) {
    const btn = o.cta
      ? '<button class="btn-main empty-cta" type="button" ' +
        (o.clear ? 'data-empty-clear' : 'data-empty-add') + '>' + esc(o.cta) + '</button>'
      : '';
    const hint = o.hint ? '<p class="empty-hint">' + o.hint + '</p>' : '';
    return '<span class="empty-art"><span class="empty-ico">' + svg(o.icon || 'sparkle') + '</span></span>' +
      '<p class="empty-h">' + o.title + '</p>' +
      '<p class="empty-sub">' + o.sub + '</p>' +
      btn + hint;
  }

  /* ---------------- render: home ---------------- */

  function renderHome() {
    $('helloText').textContent = greet() + ',';
    $('nameText').innerHTML = esc(store.name) + ' <span class="dot-spark">' + svg('sparkle') + '</span>';
    $('avatarInitial').textContent = (store.name || 'D').charAt(0).toUpperCase();

    const txs = monthTx();
    const inc = sumType(txs, 'income');
    const exp = sumType(txs, 'expense');

    animateMoney('balanceNum', inc - exp);
    animateMoney('incomeNum', inc);
    animateMoney('expenseNum', exp);

    const tag = $('balanceTag');
    let tagIcon = 'sparkle';
    let tagText = 'sem registros';
    if (inc > 0) {
      const pct = Math.round((exp / inc) * 100);
      tagIcon = pct > 100 ? 'receive' : 'pie';
      tagText = pct + '% da renda';
    } else if (exp > 0) {
      tagIcon = 'receive';
      tagText = 'só saídas';
    }
    tag.innerHTML = svg(tagIcon) + '<span>' + tagText + '</span>';

    /* categorias */
    const rail = $('catRail');
    const byCat = groupExpenses(txs);
    const totalExp = sumArr(byCat);
    $('catNote').textContent = totalExp ? fmtAmount(totalExp) : '';

    /* mês sem NADA: some com o bloco de categorias (um título sem conteúdo
       embaixo só poluía) e deixa o convite do "últimos registros" mandar */
    const catBlock = rail ? rail.closest('.block') : null;
    if (catBlock) catBlock.hidden = !byCat.length && !txs.length;

    if (!byCat.length) {
      rail.innerHTML = '<div class="rail-empty">' +
        '<span class="rail-empty-ico">' + svg('pie') + '</span>' +
        '<span class="rail-empty-txt"><b>Nada por categoria ainda</b>' +
        '<small>Quando você anotar, cada gasto vira uma cartinha aqui.</small></span>' +
        '</div>';
    } else {
      const top = byCat.slice(0, 8);
      const max = top[0].amount || 1;
      rail.innerHTML = top.map(function (c, i) {
        return '<div class="cat-card" style="animation-delay:' + (i * 45) + 'ms">' +
          '<span class="cat-ico" style="background:' + hexA(c.color, 0.15) + ';color:' + c.color + '">' + svg(c.icon) + '</span>' +
          '<span class="cat-name">' + esc(c.name) + '</span>' +
          '<span class="cat-val">' + fmtAmount(c.amount) + '</span>' +
          '<span class="cat-bar"><i style="background:' + c.color + '" data-w="' + Math.max(8, Math.round((c.amount / max) * 100)) + '"></i></span>' +
          '</div>';
      }).join('');
      requestAnimationFrame(function () {
        rail.querySelectorAll('.cat-bar i').forEach(function (b) {
          b.style.width = b.dataset.w + '%';
        });
      });
    }

    /* últimos registros */
    const recent = txs.slice().sort(byDateDesc).slice(0, 5);
    const list = $('homeList');
    const empty = $('homeEmpty');
    /* "Ver todos" não faz sentido com a lista vazia */
    const verTodos = document.querySelector('#screen-home .block-head [data-goto="tx"]');
    if (verTodos) verTodos.hidden = !recent.length;
    if (!recent.length) {
      list.innerHTML = '';
      empty.hidden = false;
      empty.innerHTML = emptyHTML({
        icon: 'sparkle',
        title: 'Seu mês começa aqui',
        sub: 'Anote o primeiro gasto ou entrada que o resumo do mês se monta sozinho.',
        cta: 'Anotar o primeiro',
        add: true
      });
    } else {
      empty.hidden = true;
      list.innerHTML = recent.map(function (t, i) { return txHTML(t, i); }).join('');
    }
  }

  /* noDay: na lista de registros os itens já ficam agrupados por dia, então
     repetir a data em cada linha só poluía — o cabeçalho do grupo já diz tudo */
  function txHTML(t, i, noDay) {
    const c = catOf(t.cat);
    const isIn = t.type === 'income';
    const title = t.desc ? t.desc : c.name;
    const sub = noDay
      ? (t.desc ? c.name : '')
      : (t.desc ? c.name + ' · ' + shortDay(t.date) : shortDay(t.date));
    const tag = t.fixed ? '<span class="tx-fix-tag">' + svg('repeat') + 'fixo</span>' : '';
    return '<li class="tx' + (t.fixed ? ' is-fixed' : '') + '" data-id="' + esc(t.id) + '" style="animation-delay:' + Math.min(i, 9) * 42 + 'ms">' +
      '<span class="tx-ico" style="background:' + hexA(c.color, 0.15) + ';color:' + c.color + '">' + svg(c.icon) + '</span>' +
      '<span class="tx-main">' +
        '<span class="tx-t">' + esc(title) + '</span>' +
        '<span class="tx-s">' + esc(sub) + tag + '</span>' +
      '</span>' +
      '<span class="tx-amt ' + (isIn ? 'in' : 'out') + '">' + (isIn ? '+' : '−') + ' ' + fmtAmount(t.amount) + '</span>' +
      '</li>';
  }

  /* ---------------- render: registros ---------------- */

  function fold(s) {
    return String(s == null ? '' : s)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function matchesQuery(t) {
    if (!query) return true;
    const q = fold(query);
    const c = catOf(t.cat);
    return fold(t.desc).indexOf(q) >= 0 ||
      fold(c.name).indexOf(q) >= 0 ||
      fold(fmtAmount(t.amount)).indexOf(q) >= 0;
  }

  function renderCatChips(txs) {
    const box = $('catChips');
    if (!box) return;

    const total = {};
    txs.forEach(function (t) { total[t.cat] = (total[t.cat] || 0) + t.amount; });
    const ids = Object.keys(total).sort(function (a, b) { return total[b] - total[a]; });

    /* se a categoria escolhida não aparece neste mês, mantém o chip pra ela
       poder desmarcar e ver a lista inteira de novo */
    if (catFilter !== 'all' && ids.indexOf(catFilter) < 0) ids.unshift(catFilter);

    if (!ids.length) {
      box.innerHTML = '';
      box.hidden = true;
      return;
    }
    box.hidden = false;

    /* nada de "Todas" fixo: o filtro de categoria se limpa tocando no chip
       ativo de novo, ou no X que aparece só quando tem filtro ligado */
    let html = '';
    if (catFilter !== 'all') {
      html += '<button class="chip chip-clear" type="button" data-catf="all" ' +
        'aria-label="Limpar filtro de categoria">' + svg('close') + '</button>';
    }
    html += ids.map(function (id) {
      const c = catOf(id);
      return '<button class="chip' + (catFilter === id ? ' is-active' : '') +
        '" type="button" data-catf="' + esc(id) + '">' +
        '<span class="dot" style="background:' + c.color + '"></span>' + esc(c.name) + '</button>';
    }).join('');
    box.innerHTML = html;
  }

  function renderTx() {
    const monthAll = monthTx();
    const byType = monthAll.filter(function (t) { return filter === 'all' || t.type === filter; });
    renderCatChips(byType);

    const txs = byType
      .filter(function (t) { return catFilter === 'all' || t.cat === catFilter; })
      .filter(matchesQuery)
      .sort(byDateDesc);

    const wrap = $('txGroups');
    const empty = $('txEmpty');
    const clear = $('searchClear');
    if (clear) clear.hidden = !query;

    if (!txs.length) {
      wrap.innerHTML = '';
      empty.hidden = false;
      /* mensagem diferente quando é filtro, pra não parecer que o mês está vazio */
      const filtrando = !!query || catFilter !== 'all' || filter !== 'all';
      if (filtrando) {
        empty.innerHTML = emptyHTML({
          icon: 'search',
          title: 'Nada encontrado',
          sub: query
            ? 'Nenhum registro combina com “' + esc(query) + '”. Tente outro termo.'
            : 'Nenhum registro combina com esse filtro.',
          cta: 'Limpar filtros',
          clear: true
        });
      } else {
        empty.innerHTML = emptyHTML({
          icon: 'receipt',
          title: 'Nenhum registro ainda',
          sub: 'Tudo que entra e sai fica guardado aqui, agrupado por dia.',
          cta: 'Anotar o primeiro',
          add: true
        });
      }
      return;
    }
    empty.hidden = true;

    const groups = [];
    let curKey = null;
    txs.forEach(function (t) {
      if (t.date !== curKey) {
        curKey = t.date;
        groups.push({ date: t.date, items: [] });
      }
      groups[groups.length - 1].items.push(t);
    });

    let n = 0;
    wrap.innerHTML = groups.map(function (g) {
      const items = g.items.map(function (t) { return txHTML(t, n++, true); }).join('');
      return '<div class="tx-group">' +
        '<p class="tx-group-h">' + dayLabel(g.date) + '</p>' +
        '<ul class="tx-list">' + items + '</ul>' +
        '</div>';
    }).join('');
  }

  /* ---------------- render: resumo ---------------- */

  function renderIn() {
    const txs = monthTx();
    const byCat = groupExpenses(txs);
    const total = sumArr(byCat);

    animateMoney('donutTotal', total);

    const segs = $('donutSegs');
    const legend = $('legend');
    const emptyEl = $('inEmpty');

    /* sem dados a rosquinha vira um "fantasma": anel pontilhado em vez de um
       traço cinza vazio (que parecia gráfico quebrado) */
    const card = document.querySelector('.donut-card');
    if (card) card.classList.toggle('is-empty', !total);

    if (!total) {
      segs.innerHTML = '';
      legend.innerHTML = '';
      emptyEl.hidden = false;
      emptyEl.innerHTML = emptyHTML({
        icon: 'pie',
        title: 'Nada por aqui ainda',
        sub: 'Anote um gasto neste mês e o resumo aparece na hora, com a rosquinha e tudo.',
        cta: 'Anotar um gasto',
        add: true
      });
    } else {
      emptyEl.hidden = true;

      const R = 48;
      const CIRC = 2 * Math.PI * R;
      /* vão constante entre um segmento e o seguinte (em unidades de arco).
         A fatia de cada categoria já é calculada descontando todos os vãos, e o
         traço tem pontas retas: o vão fica igual pra todos, mesmo pros
         segmentos pequenininhos (que antes "vazavam" por cima do vizinho). */
      const GAP = CIRC * 0.011;
      const usable = Math.max(CIRC - byCat.length * GAP, 1);
      let offset = 0;

      segs.innerHTML = byCat.map(function (c) {
        const dash = Math.max((c.amount / total) * usable, 1.2);
        const el = '<circle class="donut-seg" cx="60" cy="60" r="' + R + '"' +
          ' stroke="' + c.color + '"' +
          ' stroke-dasharray="' + dash.toFixed(2) + ' ' + (CIRC - dash).toFixed(2) + '"' +
          ' stroke-dashoffset="' + (-offset).toFixed(2) + '"></circle>';
        offset += dash + GAP;
        return el;
      }).join('');

      legend.innerHTML = byCat.map(function (c, i) {
        return '<li class="leg-row" style="animation-delay:' + (i * 55) + 'ms">' +
          '<span class="leg-ico" style="color:' + c.color + '">' + svg(c.icon) + '</span>' +
          '<span class="leg-name">' + esc(c.name) + '</span>' +
          '<span class="leg-val">' + fmtAmount(c.amount) + '</span>' +
          '<span class="leg-pct">' + Math.round((c.amount / total) * 100) + '%</span>' +
          '</li>';
      }).join('');
    }

    /* últimos 6 meses */
    const months = [];
    const base = new Date();
    base.setDate(1);
    base.setHours(12, 0, 0, 0);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const key = monthOf(d);
      months.push({
        key: key,
        label: MESES_AB[d.getMonth()],
        amount: txsForMonth(key).filter(function (t) { return t.type === 'expense'; })
          .reduce(function (s, t) { return s + t.amount; }, 0)
      });
    }
    const maxAmt = Math.max.apply(null, months.map(function (m) { return m.amount; }).concat([1]));

    /* sem nenhum gasto nos 6 meses o gráfico não faz sentido: esconde o bloco
       inteiro em vez de mostrar 6 tracinhos de 2px (que pareciam bug) */
    const hasHistory = months.some(function (m) { return m.amount > 0; });
    const barsBlock = $('bars');
    const blockWrap = barsBlock ? barsBlock.closest('.block') : null;
    if (blockWrap) blockWrap.hidden = !hasHistory;

    if (hasHistory) {
      $('bars').innerHTML = months.map(function (m) {
        const h = m.amount ? Math.max(7, Math.round((m.amount / maxAmt) * 100)) : 2;
        return '<div class="bar-col">' +
          '<div class="bar-track">' +
            '<div class="bar-fill ' + (m.amount === maxAmt && m.amount > 0 ? 'hi' : '') + '"' +
            ' data-h="' + h + '" data-k="' + m.key + '"></div>' +
          '</div>' +
          '<span class="bar-lbl">' + m.label + '</span>' +
          '</div>';
      }).join('');
    } else {
      $('bars').innerHTML = '';
    }

    requestAnimationFrame(function () {
      document.querySelectorAll('#bars .bar-fill').forEach(function (b) {
        b.style.height = b.dataset.h + '%';
      });
    });
  }

  /* ---------------- render geral ---------------- */

  function renderAll() {
    renderMonthLabels();
    renderHome();
    renderTx();
    renderIn();
  }

  /* ---------------- navegação ---------------- */

  function go(name) {
    const target = $('screen-' + name);
    if (!target) return;
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('is-active'); });
    target.classList.add('is-active');
    document.querySelectorAll('.nav-btn').forEach(function (b) {
      const on = b.dataset.goto === name;
      b.classList.toggle('is-active', on);
      if (on) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);

    /* o botão + vive só na tela de início */
    const fab = $('fab');
    if (fab) {
      const showFab = name === 'home';
      fab.classList.toggle('is-hidden', !showFab);
      fab.tabIndex = showFab ? 0 : -1;
      if (showFab) fab.removeAttribute('aria-hidden');
      else fab.setAttribute('aria-hidden', 'true');
    }

    /* re-renderiza a tela que entrou, pra replay das animações */
    if (name === 'home') renderHome();
    else if (name === 'tx') renderTx();
    else if (name === 'in') renderIn();
    else if (name === 'fx') renderFx();
  }

  function shiftMonth(delta) {
    const p = view.split('-');
    const d = new Date(Number(p[0]), Number(p[1]) - 1 + delta, 1);
    view = monthOf(d);
    renderAll();
  }

  /* ---------------- folhas ---------------- */

  function openSheet(name) {
    $('scrim').classList.add('is-on');
    document.body.classList.add('no-scroll');
    document.querySelectorAll('.sheet').forEach(function (s) { s.classList.remove('is-on'); });
    const map = { tx: 'txSheet', set: 'setSheet', fix: 'fixSheet', cat: 'catSheet' };
    const el = $(map[name] || 'setSheet');
    if (el) el.classList.add('is-on');
    if (name === 'set') $('nameInput').value = store.name;
  }

  function closeSheets() {
    $('scrim').classList.remove('is-on');
    document.body.classList.remove('no-scroll');
    document.querySelectorAll('.sheet').forEach(function (s) { s.classList.remove('is-on'); });
  }

  /* ---------------- fixos ---------------- */

  function renderFixList() {
    const list = $('fixList');
    if (!list) return;
    const empty = $('fixEmpty');
    const all = (store.recurring || []).slice().sort(function (a, b) {
      if (a.type !== b.type) return a.type === 'income' ? -1 : 1;
      return a.day - b.day;
    });

    if (!all.length) {
      list.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    list.innerHTML = all.map(function (r) {
      const c = catOf(r.cat);
      const on = r.active !== false;
      const prazo = r.to ? ' · até ' + monthShort(r.to) : '';
      return '<li class="fix-row' + (on ? '' : ' is-off') + '" data-fix="' + esc(r.id) + '">' +
        '<span class="tx-ico" style="background:' + hexA(c.color, 0.15) + ';color:' + c.color + '">' + svg(c.icon) + '</span>' +
        '<span class="fix-main">' +
          '<span class="fix-t">' + esc(r.desc || c.name) + '</span>' +
          '<span class="fix-s">' + (r.type === 'income' ? '+' : '−') + ' ' + fmtAmount(r.amount) +
            ' · todo dia ' + r.day + prazo + '</span>' +
        '</span>' +
        '<button class="fix-toggle" type="button" role="switch" aria-checked="' + (on ? 'true' : 'false') + '" aria-label="' + (on ? 'Pausar' : 'Ativar') + ' fixo" data-act="toggle">' +
          '<span class="switch" aria-hidden="true"><i></i></span>' +
        '</button>' +
        '</li>';
    }).join('');
  }

  function openFixSheet() {
    renderFixList();
    openSheet('fix');
  }

  function toggleFix(id) {
    const r = (store.recurring || []).filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    r.active = r.active === false;
    saveStore();
    renderFixList();
    renderAll();
    toast(r.active ? 'Fixo ativado' : 'Fixo pausado', r.active ? 'ok' : 'info');
  }

  /* ---------------- categorias: gerenciar ---------------- */

  const SWATCHES = ['#BE65E4', '#D2509F', '#D4555F', '#BE7345', '#998934',
                    '#3A9588', '#42955F', '#518CC2', '#6C5BD6', '#7C8494',
                    '#33691E', '#5C8F1F', '#0B5E6E', '#14614F'];

  const ICON_CHOICES = ['food', 'car', 'house', 'bag', 'drink', 'lipstick',
                        'heart', 'book', 'paw', 'sparkle', 'money', 'gift',
                        'laptop', 'receive', 'pie', 'receipt', 'check', 'repeat'];

  let catType = 'expense';
  let editingCat = null;
  let catForm = { name: '', icon: 'sparkle', color: '#BE65E4', hidden: false };

  function countCat(id) {
    let n = 0;
    (store.txs || []).forEach(function (t) { if (t.cat === id) n++; });
    (store.recurring || []).forEach(function (r) { if (r.cat === id) n++; });
    return n;
  }

  function openCatSheet() {
    catType = 'expense';
    editingCat = null;
    showCatList();
    openSheet('cat');
  }

  function showCatList() {
    editingCat = null;
    $('catListView').hidden = false;
    $('catEditView').hidden = true;
    $('catSheetTitle').textContent = 'Categorias';
    renderCatSeg();
    renderCatList();
  }

  function renderCatSeg() {
    const seg = $('catSeg');
    if (!seg) return;
    seg.classList.toggle('income', catType === 'income');
    seg.querySelectorAll('[data-cattype]').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.cattype === catType);
    });
  }

  function renderCatList() {
    const box = $('catList');
    if (!box) return;
    const list = CATS[catType] || [];
    if (!list.length) {
      box.innerHTML = '<p class="fix-intro">Nenhuma categoria aqui ainda.</p>';
      return;
    }
    box.innerHTML = list.map(function (c) {
      const n = countCat(c.id);
      const sub = c.hidden ? 'oculta no app'
        : (n === 0 ? 'sem registros' : n + (n === 1 ? ' registro' : ' registros'));
      return '<button class="cat-row' + (c.hidden ? ' is-off' : '') + '" type="button" data-cat="' + esc(c.id) + '">' +
        '<span class="tx-ico" style="background:' + hexA(c.color, 0.15) + ';color:' + c.color + '">' + svg(c.icon) + '</span>' +
        '<span class="cr-main">' +
          '<span class="cr-name">' + esc(c.name) + '</span>' +
          '<span class="cr-sub">' + sub + '</span>' +
        '</span>' +
        '<span class="cr-go"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></span>' +
        '</button>';
    }).join('');
  }

  function openCatEditor(id) {
    if (id) {
      const c = BY_ID[id];
      if (!c) return;
      editingCat = id;
      catType = c.type;
      catForm = { name: c.name, icon: c.icon, color: c.color, hidden: !!c.hidden };
    } else {
      editingCat = null;
      catForm = {
        name: '',
        icon: catType === 'income' ? 'money' : 'sparkle',
        color: catType === 'income' ? '#42955F' : '#BE65E4',
        hidden: false
      };
    }
    $('catListView').hidden = true;
    $('catEditView').hidden = false;
    $('catSheetTitle').textContent = editingCat ? 'Editar categoria' : 'Nova categoria';
    $('catNameInput').value = catForm.name;
    $('catHideToggle').checked = !!catForm.hidden;
    $('catHideRow').classList.toggle('is-on', !!catForm.hidden);
    $('catDelBtn').hidden = !editingCat;
    renderSwatches();
    renderIconChoices();
  }

  function renderSwatches() {
    const box = $('catSwatches');
    if (!box) return;
    box.innerHTML = SWATCHES.map(function (cor) {
      const sel = cor.toLowerCase() === String(catForm.color).toLowerCase();
      return '<button type="button" class="sw' + (sel ? ' is-sel' : '') + '" data-color="' + cor +
        '" style="background:' + cor + '" aria-label="Cor ' + cor + '"></button>';
    }).join('');
  }

  function renderIconChoices() {
    const box = $('catIcons');
    if (!box) return;
    box.innerHTML = ICON_CHOICES.map(function (nome) {
      return '<button type="button" class="ico-opt' + (nome === catForm.icon ? ' is-sel' : '') +
        '" data-icon="' + nome + '" aria-label="Ícone ' + nome + '">' + svg(nome) + '</button>';
    }).join('');
  }

  function refreshAfterCats() {
    buildCats();
    if (catFilter !== 'all' && !BY_ID[catFilter]) catFilter = 'all';
    if (!BY_ID[formCat]) formCat = visCats(formType)[0].id;
    renderAll();
    renderFixList();
    renderPick();
  }

  function saveCat() {
    const nome = $('catNameInput').value.trim();
    if (!nome) {
      toast('Dá um nome pra ela', 'err');
      shake($('catNameInput'));
      $('catNameInput').focus();
      return;
    }
    catForm.name = nome;
    catForm.hidden = $('catHideToggle').checked;

    const list = store.cats[catType];
    if (editingCat) {
      const c = list.filter(function (x) { return x.id === editingCat; })[0];
      if (c) {
        c.name = nome;
        c.icon = catForm.icon;
        c.color = catForm.color;
        c.hidden = !!catForm.hidden;
      }
      toast('Categoria atualizada');
    } else {
      const id = (catType === 'expense' ? 'e-' : 'i-') + Date.now().toString(36) +
        Math.random().toString(36).slice(2, 5);
      list.push({
        id: id,
        name: nome,
        icon: catForm.icon,
        color: catForm.color,
        hidden: !!catForm.hidden
      });
      toast('Categoria criada');
    }

    saveStore();
    refreshAfterCats();
    showCatList();
  }

  function deleteCat() {
    if (!editingCat) return;
    const id = editingCat;
    const c = BY_ID[id];
    if (!c) return;
    if (id === 'other' || id === 'other-in') {
      toast('Essa é a categoria de reserva, não dá pra excluir', 'err');
      return;
    }
    ask({
      title: 'Excluir "' + c.name + '"?',
      text: 'Os registros dela passam pra "Outros". Nada é apagado.',
      yes: 'Excluir'
    }).then(function (ok) {
      if (!ok) return;
      const fallback = catType === 'income' ? 'other-in' : 'other';
      (store.txs || []).forEach(function (t) { if (t.cat === id) t.cat = fallback; });
      (store.recurring || []).forEach(function (r) { if (r.cat === id) r.cat = fallback; });
      store.cats[catType] = store.cats[catType].filter(function (x) { return x.id !== id; });
      if (!store.cats[catType].length) store.cats[catType] = defaultCats()[catType];
      editingCat = null;
      saveStore();
      refreshAfterCats();
      showCatList();
      toast('Categoria excluída');
    });
  }

  /* ---------------- formulário ---------------- */

  function setSeg() {
    const seg = document.querySelector('#txSheet .seg');
    if (!seg) return;
    seg.querySelectorAll('.seg-btn').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.type === formType);
    });
    seg.classList.toggle('income', formType === 'income');
  }

  function renderPick() {
    let list = visCats(formType);
    /* se o registro é de uma categoria que ela escondeu, mantém na lista pra
       não trocar a categoria dele sem querer */
    const orig = BY_ID[formCat];
    if (orig && orig.type === formType && list.indexOf(orig) < 0) {
      list = list.concat([orig]);
    }
    if (!list.some(function (c) { return c.id === formCat; })) {
      formCat = list[0].id;
    }
    const pick = $('catPick');
    pick.style.gridTemplateColumns = 'repeat(' + Math.min(list.length, 5) + ', 1fr)';
    pick.innerHTML = list.map(function (c) {
      return '<button type="button" class="cat-opt ' + (c.id === formCat ? 'is-sel' : '') + '" data-cat="' + c.id + '">' +
        '<span class="ce" style="color:' + c.color + '">' + svg(c.icon) + '</span>' +
        '<span class="co-n">' + esc(c.name) + '</span>' +
        '</button>';
    }).join('');
  }

  function openTx(id, forceFixed) {
    editing = null;
    editingFix = null;

    let t = null;
    let rec = null;

    if (id) {
      if (String(id).indexOf('r:') === 0) {
        rec = store.recurring.filter(function (x) { return x.id === id.slice(2); })[0];
        if (rec) editingFix = rec.id;
      } else {
        t = store.txs.filter(function (x) { return x.id === id; })[0];
        if (t) editing = t.id;
      }
    }

    const src = rec || t;

    formType = src ? src.type : 'expense';
    formValue = src ? src.amount * (rates[store.currency] || 1) : 0;
    formCat = src ? src.cat : visCats('expense')[0].id;

    $('delBtn').hidden = !(t || rec);
    $('amountCur').textContent = CUR[store.currency].sym;
    $('amountInput').placeholder = CUR[store.currency].dec ? '0,00' : '0';
    $('amountInput').value = amountText(formValue);
    $('descInput').value = src ? (src.desc || '') : '';
    $('dateInput').value = rec
      ? rec.from + '-' + pad2(Math.min(rec.day, daysInMonth(rec.from)))
      : (t ? t.date : isoOf(new Date()));
    $('fixedToggle').checked = !!rec || !!forceFixed;

    formFrom = rec ? rec.from : $('dateInput').value.slice(0, 7);
    formTo = rec ? (rec.to || '') : '';

    setSeg();
    renderPick();
    syncFixUI();
    openSheet('tx');
  }

  function syncFixUI() {
    const on = $('fixedToggle').checked;
    const row = $('fixRow');
    if (row) row.classList.toggle('is-on', on);

    const dates = $('fixDates');
    if (dates) dates.hidden = !on;

    const hint = $('fixHint');
    if (on) {
      const val = $('dateInput').value;
      const d = val ? parseISO(val) : new Date();
      if (!formFrom) formFrom = d.getFullYear() + '-' + pad2(d.getMonth() + 1);
      hint.textContent = 'Todo dia ' + d.getDate() + ' de cada mês';

      $('fixFrom').textContent = monthShort(formFrom);
      const endRow = $('endRow');
      const endBox = $('endBox');
      const endToggle = $('endToggle');
      if (endRow) endRow.classList.toggle('is-on', !!formTo);
      if (endToggle) endToggle.checked = !!formTo;
      if (endBox) endBox.hidden = !formTo;
      if (formTo) $('fixTo').textContent = monthShort(formTo);
    } else {
      hint.textContent = 'Vira um gasto ou ganho fixo';
    }

    if (on) {
      $('txSheetTitle').textContent = editingFix ? 'Editar fixo' : 'Novo fixo';
      $('saveBtn').textContent = editingFix ? 'Salvar fixo' : 'Criar fixo';
    } else {
      $('txSheetTitle').textContent = editing ? 'Editar registro' : 'Novo registro';
      $('saveBtn').textContent = editing ? 'Salvar mudanças' : 'Salvar';
    }
  }

  function saveTx(ev) {
    ev.preventDefault();

    if (!formValue || formValue <= 0) {
      toast('Coloca um valor', 'err');
      shake($('amountBox'));
      $('amountInput').focus();
      return;
    }

    const desc = $('descInput').value.trim();
    const date = $('dateInput').value || isoOf(new Date());
    const rate = rates[store.currency] || 1;
    const reais = Math.round((formValue / rate) * 1e6) / 1e6;
    const asFixed = $('fixedToggle').checked;
    const wasTx = !!editing;
    const wasFix = !!editingFix;
    let msg = '';

    if (asFixed) {
      const day = parseISO(date).getDate();
      if (wasFix) {
        const r = store.recurring.filter(function (x) { return x.id === editingFix; })[0];
        if (r) {
          r.type = formType;
          r.cat = formCat;
          r.amount = reais;
          r.desc = desc;
          r.day = day;
          r.from = formFrom || r.from;
          r.to = formTo || '';
        }
        msg = 'Fixo atualizado';
      } else {
        store.recurring.push({
          id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
          type: formType,
          cat: formCat,
          amount: reais,
          desc: desc,
          day: day,
          from: formFrom || date.slice(0, 7),
          to: formTo || '',
          active: true
        });
        if (wasTx) {
          store.txs = store.txs.filter(function (x) { return x.id !== editing; });
          msg = 'Virou fixo mensal';
        } else {
          msg = formType === 'income' ? 'Ganho fixo criado' : 'Gasto fixo criado';
        }
      }
    } else if (wasFix) {
      store.recurring = store.recurring.filter(function (x) { return x.id !== editingFix; });
      store.txs.push({
        id: 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        type: formType,
        cat: formCat,
        amount: reais,
        desc: desc,
        date: date
      });
      msg = 'Virou registro único';
    } else if (wasTx) {
      const t = store.txs.filter(function (x) { return x.id === editing; })[0];
      if (t) {
        t.type = formType;
        t.cat = formCat;
        t.amount = reais;
        t.desc = desc;
        t.date = date;
      }
      msg = 'Atualizado';
    } else {
      store.txs.push({
        id: 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        type: formType,
        cat: formCat,
        amount: reais,
        desc: desc,
        date: date
      });
      msg = formType === 'income' ? 'Entrada anotada' : 'Gasto anotado';
    }

    editing = null;
    editingFix = null;
    saveStore();

    const m = asFixed ? (formFrom || date.slice(0, 7)) : date.slice(0, 7);
    if (m !== view) view = m;

    closeSheets();
    renderAll();
    renderFixList();
    celebrate();
    toast(msg);
  }

  function deleteTx() {
    if (editingFix) {
      const fixId = editingFix;
      const r = store.recurring.filter(function (x) { return x.id === fixId; })[0];
      if (!r) return;
      ask({
        title: 'Excluir esse fixo?',
        text: 'Ele some de todos os meses, não só deste.',
        yes: 'Excluir'
      }).then(function (ok) {
        if (!ok) return;
        store.recurring = store.recurring.filter(function (x) { return x.id !== fixId; });
        editingFix = null;
        saveStore();
        closeSheets();
        renderAll();
        renderFixList();
        toast('Fixo excluído');
      });
      return;
    }

    if (!editing) return;
    const txId = editing;
    const t = store.txs.filter(function (x) { return x.id === txId; })[0];
    if (!t) return;
    ask({
      title: 'Excluir esse registro?',
      text: t.desc ? '“' + t.desc + '” sai da lista e do saldo do mês.' : 'Ele sai da lista e do saldo do mês.',
      yes: 'Excluir'
    }).then(function (ok) {
      if (!ok) return;
      store.txs = store.txs.filter(function (x) { return x.id !== txId; });
      editing = null;
      saveStore();
      closeSheets();
      renderAll();
      toast('Registro excluído');
    });
  }

  function celebrate() {
    const card = $('balanceCard');
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.animation = 'riseIn .6s cubic-bezier(.22,1,.36,1) both';
  }

  /* ---------------- nome / backup ---------------- */

  function setName(v) {
    store.name = (v || '').trim() || 'Dayanne';
    saveStore();
    $('nameText').innerHTML = esc(store.name) + ' <span class="dot-spark">' + svg('sparkle') + '</span>';
    $('avatarInitial').textContent = store.name.charAt(0).toUpperCase();
  }

  function exportData() {
    try {
      const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dayanne-financas-' + isoOf(new Date()) + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
      toast('Backup salvo em Arquivos');
    } catch (e) {
      toast('Não consegui salvar', 'err');
    }
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const s = JSON.parse(String(reader.result));
        if (!s || !Array.isArray(s.txs)) throw new Error('formato');
        const legacy = !s.v || Number(s.v) < 2;
        store = {
          v: 2,
          name: (typeof s.name === 'string' && s.name.trim()) ? s.name.trim() : 'Dayanne',
          currency: s.currency === 'PYG' ? 'PYG' : 'BRL',
          txs: s.txs.filter(validTx).map(function (t) {
            return normTx({
              id: t.id, type: t.type, cat: t.cat,
              amount: legacy ? Number(t.amount) / 100 : Number(t.amount),
              desc: t.desc, date: t.date
            });
          }),
          recurring: Array.isArray(s.recurring) ? s.recurring.filter(validRec).map(normRec) : [],
          cats: normalizeCats(s.cats),
          seeded: true
        };
        saveStore();
        buildCats();
        renderAll();
        renderFixList();
        renderCurSeg();
        renderPick();
        closeSheets();
        toast('Backup restaurado');
      } catch (e) {
        toast('Arquivo inválido', 'err');
      }
    };
    reader.readAsText(file);
  }

  function resetAll() {
    ask({
      title: 'Zerar tudo?',
      text: 'Apaga todos os registros e os fixos. Não dá pra desfazer.',
      yes: 'Zerar tudo'
    }).then(function (ok) {
      if (!ok) return;
      store.txs = [];
      store.recurring = [];
      view = monthOf(new Date());
      saveStore();
      closeSheets();
      renderAll();
      renderFixList();
      toast('Tudo limpo. Bora recomeçar');
    });
  }

  /* ---------------- confirmação ----------------
     O confirm() do navegador não abre em alguns contextos (app instalado na
     tela de início, navegador dentro do Instagram/WhatsApp) e aí o botão
     parecia não fazer nada. Esta caixinha é nossa, então sempre aparece. */

  let askResolve = null;

  function ask(opts) {
    const o = opts || {};
    const box = $('askBox');
    /* se o HTML ainda for uma versão antiga em cache, não quebra: cai no
       confirm do navegador */
    if (!box) return Promise.resolve(window.confirm(o.title || 'Tem certeza?'));
    $('askTitle').textContent = o.title || 'Tem certeza?';
    $('askText').textContent = o.text || '';
    $('askYes').textContent = o.yes || 'Apagar';
    box.classList.add('is-on');
    box.setAttribute('aria-hidden', 'false');
    return new Promise(function (resolve) { askResolve = resolve; });
  }

  function closeAsk(answer) {
    const done = askResolve;
    if (!done) return;
    askResolve = null;
    const box = $('askBox');
    if (box) {
      box.classList.remove('is-on');
      box.setAttribute('aria-hidden', 'true');
    }
    done(!!answer);
  }

  /* ---------------- feedback ---------------- */

  let toastTimer = null;

  function toast(msg, type) {
    $('toastMsg').textContent = msg;
    $('toastIco').innerHTML = svg(type === 'err' ? 'close' : type === 'info' ? 'info' : 'check');
    const el = $('toast');
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 2400);
  }

  function shake(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }

  /* ---------------- conversor de moedas ---------------- */

  let fxFrom = 'PYG';
  let fxTo = 'BRL';
  let fxDigits = '';   /* dígitos crus que vêm do teclado */

  function amountText(v) {
    const c = CUR[store.currency];
    return v ? (c.dec === 0 ? NF0 : NF2).format(v) : '';
  }

  function setThumb(seg, index) {
    if (!seg) return;
    const thumb = seg.querySelector('.seg-thumb');
    if (thumb) thumb.style.transform = 'translateX(' + (index * 100) + '%)';
    seg.querySelectorAll('button[data-cur]').forEach(function (b, i) {
      b.classList.toggle('is-active', i === index);
    });
  }

  function renderCurSeg() {
    const seg = $('curSeg');
    if (seg) setThumb(seg, store.currency === 'PYG' ? 1 : 0);
  }

  /* valor já na moeda de origem (as casas vêm da moeda) */
  function fxAmount() {
    const n = fxDigits ? parseInt(fxDigits, 10) : 0;
    return n / Math.pow(10, CUR[fxFrom].dec);
  }

  function numText(v, cur) {
    return (CUR[cur].dec === 0 ? NF0 : NF2).format(v);
  }

  function renderFxDisplay() {
    const v = fxAmount();
    const out = v / (rates[fxFrom] || 1) * (rates[fxTo] || 1);
    $('fxFromSym').textContent = CUR[fxFrom].sym;
    $('fxToSym').textContent = CUR[fxTo].sym;
    $('fxDisplay').textContent = v ? numText(v, fxFrom) : '0';
    $('fxResult').textContent = v ? numText(out, fxTo) : (CUR[fxTo].dec === 0 ? '0' : '0,00');
  }

  function renderFxPickers() {
    ['fxFromSeg', 'fxToSeg'].forEach(function (id) {
      const seg = $(id);
      if (!seg) return;
      const cur = id === 'fxFromSeg' ? fxFrom : fxTo;
      seg.querySelectorAll('button[data-cur]').forEach(function (b) {
        b.classList.toggle('is-on', b.dataset.cur === cur);
      });
    });
  }

  function renderFxRate() {
    const el = $('fxRate');
    if (!el) return;
    if (fxFrom === fxTo) { el.textContent = 'As duas moedas são iguais'; return; }
    const per = (rates[fxTo] || 1) / (rates[fxFrom] || 1);
    el.textContent = '1 ' + CUR[fxFrom].sym + ' = ' + fmtRateVal(per, fxTo) + '  ·  ' + rateAgeLabel();
  }

  function renderFx() {
    renderFxPickers();
    renderFxDisplay();
    renderFxRate();
  }

  function initFx() {
    fxFrom = store.currency || 'BRL';
    fxTo = fxFrom === 'PYG' ? 'BRL' : 'PYG';
    fxDigits = '';
    renderFx();
  }

  function setCurrency(c) {
    if (c !== 'BRL' && c !== 'PYG') return;
    if (store.currency === c) return;
    store.currency = c;
    saveStore();
    renderAll();
    renderCurSeg();
    renderRateNote();
    renderFixList();
    toast('Moeda do app: ' + CUR[c].name);
  }

  /* ---------------- surpresa: 5 toques em qualquer lugar ----------------
     Segredo do casal: cinco toques rápidos abrem um cartão com as duas fotos
     (fotos/1.jpg e fotos/2.jpg — se não existirem, o coração lilás segura a
     onda) e uma chuva de corações, confete e brilhos. Fecha no "fechar", no
     toque fora do cartão ou no Esc. */

  const LOVE_HEART = 'M12 20.3s-7.5-4.5-7.5-10a4.4 4.4 0 0 1 7.5-2.8 4.4 4.4 0 0 1 7.5 2.8c0 5.5-7.5 10-7.5 10Z';
  const LOVE_SPARK = 'M12 3.2l1.9 5.9L20 12l-6.1 2.9L12 20.8l-1.9-5.9L4 12l6.1-2.9L12 3.2Z';
  const LOVE_COLORS = ['#BE65E4', '#9B3DC7', '#D89BF0', '#E9B6F8', '#F09CC8', '#F2C879', '#FFFFFF'];

  function loveRnd(a, b) { return a + Math.random() * (b - a); }

  function loveConfetti(box) {
    let html = '';

    /* corações subindo */
    for (let i = 0; i < 24; i++) {
      html += '<span class="lp-heart" style="' +
        'left:' + loveRnd(2, 96).toFixed(1) + '%;' +
        '--s:' + loveRnd(.6, 1.5).toFixed(2) + ';' +
        '--d:' + loveRnd(3.8, 7).toFixed(2) + 's;' +
        '--delay:-' + loveRnd(0, 6).toFixed(2) + 's;' +
        '--sway:' + loveRnd(-46, 46).toFixed(0) + 'px;' +
        '--rot:' + loveRnd(-30, 30).toFixed(0) + 'deg;' +
        'color:' + LOVE_COLORS[i % LOVE_COLORS.length] + '">' +
        '<svg viewBox="0 0 24 24"><path d="' + LOVE_HEART + '" fill="currentColor"/></svg></span>';
    }

    /* confete caindo (uns redondos, outros em tirinha) */
    for (let i = 0; i < 34; i++) {
      html += '<span class="lp-bit" style="' +
        'left:' + loveRnd(0, 98).toFixed(1) + '%;' +
        '--d:' + loveRnd(3, 6.4).toFixed(2) + 's;' +
        '--delay:-' + loveRnd(0, 6).toFixed(2) + 's;' +
        '--sway:' + loveRnd(-70, 70).toFixed(0) + 'px;' +
        '--spin:' + loveRnd(360, 900).toFixed(0) + 'deg;' +
        'width:' + loveRnd(5, 9).toFixed(1) + 'px;' +
        'height:' + loveRnd(9, 16).toFixed(1) + 'px;' +
        'background:' + LOVE_COLORS[i % LOVE_COLORS.length] + ';' +
        'border-radius:' + (Math.random() < .3 ? '50%' : '3px') + '"></span>';
    }

    /* brilhos estourando do meio, em círculo */
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + loveRnd(-.22, .22);
      const r = loveRnd(90, 220);
      html += '<span class="lp-spark" style="' +
        '--x:' + (Math.cos(a) * r).toFixed(0) + 'px;' +
        '--y:' + (Math.sin(a) * r * .72).toFixed(0) + 'px;' +
        '--d:' + loveRnd(1.6, 2.7).toFixed(2) + 's;' +
        '--delay:-' + loveRnd(0, 2.4).toFixed(2) + 's">' +
        '<svg viewBox="0 0 24 24"><path d="' + LOVE_SPARK + '" fill="currentColor"/></svg></span>';
    }

    box.innerHTML = html;
  }

  function initLove() {
    const box = $('loveSecret');
    const parts = $('loveParticles');
    if (!box || !parts) return;

    /* foto que não existe (ainda) cai no coração lilás, sem ícone de imagem
       quebrada */
    box.querySelectorAll('.love-photo-img').forEach(function (img) {
      img.addEventListener('error', function () { img.style.display = 'none'; });
      if (img.complete && img.naturalWidth === 0) img.style.display = 'none';
    });

    let openedAt = 0;
    /* a faixa em volta das barras do Safari pode sair do theme-color ou do
       fundo do canvas — troco os dois enquanto a surpresa está aberta */
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const THEME_BASE = themeMeta ? themeMeta.getAttribute('content') : '';
    const LOVE_FLAT = '#F6E9FD';

    function open() {
      if (box.classList.contains('is-on')) return;
      openedAt = Date.now();
      box.classList.remove('is-out');
      box.classList.add('is-on');
      box.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('is-love');
      if (themeMeta) themeMeta.setAttribute('content', LOVE_FLAT);
      loveConfetti(parts);
      document.body.classList.add('no-scroll');
      if (navigator.vibrate) { try { navigator.vibrate([0, 22, 60, 22]); } catch (e) {} }
    }

    function close() {
      if (!box.classList.contains('is-on') || box.classList.contains('is-out')) return;
      box.classList.add('is-out');
      box.setAttribute('aria-hidden', 'true');
      setTimeout(function () {
        box.classList.remove('is-on', 'is-out');
        parts.innerHTML = '';
        document.documentElement.classList.remove('is-love');
        if (themeMeta && THEME_BASE) themeMeta.setAttribute('content', THEME_BASE);
        /* se uma folha estiver aberta, quem manda no scroll é ela */
        if (!document.querySelector('.sheet.is-on')) {
          document.body.classList.remove('no-scroll');
        }
      }, 340);
    }

    /* 5 toques rápidos DENTRO do cartão do saldo (o quadrado roxo). Toque fora
       dele zera a contagem, então só conta sequência mesmo. */
    const card = $('balanceCard');
    let taps = 0;
    let lastTap = 0;

    if (card) {
      card.addEventListener('pointerdown', function () {
        if (box.classList.contains('is-on')) return;
        const now = Date.now();
        taps = (now - lastTap <= 1100) ? taps + 1 : 1;
        lastTap = now;
        if (taps >= 5) { taps = 0; open(); }
      }, { passive: true });
    }

    /* qualquer toque fora do cartão quebra a sequência */
    document.addEventListener('pointerdown', function (ev) {
      if (taps && card && !(ev.target && ev.target.closest && ev.target.closest('#balanceCard'))) taps = 0;
    }, { passive: true });

    box.addEventListener('click', function (ev) {
      /* o click do próprio 5º toque chega depois do pointerdown que abriu o
         cartão — e cairia no véu, fechando na hora. Ignora essa sobra. */
      if (Date.now() - openedAt < 420) return;
      if (ev.target.closest('#loveClose') || !ev.target.closest('.love-stage')) close();
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') close();
    });
  }

  /* ---------------- eventos ---------------- */

  function bind() {
    /* navegação + mês + fechar */
    document.addEventListener('click', function (ev) {
      const t = ev.target;

      const goto = t.closest('[data-goto]');
      if (goto) { go(goto.dataset.goto); return; }

      const mo = t.closest('[data-month]');
      if (mo && !mo.disabled) { shiftMonth(Number(mo.dataset.month)); return; }

      if (t.closest('[data-close]') || t.closest('#scrim')) { closeSheets(); return; }

      const filterBtn = t.closest('[data-filter]');
      if (filterBtn) {
        filter = filterBtn.dataset.filter;
        catFilter = 'all';
        document.querySelectorAll('[data-filter]').forEach(function (b) {
          b.classList.toggle('is-active', b.dataset.filter === filter);
        });
        renderTx();
        return;
      }

      const catBtn = t.closest('[data-catf]');
      if (catBtn) {
        const id = catBtn.dataset.catf;
        /* tocar de novo no chip ativo desliga o filtro */
        catFilter = (id === 'all' || id === catFilter) ? 'all' : id;
        renderTx();
        return;
      }

      const txEl = t.closest('.tx[data-id]');
      if (txEl) { openTx(txEl.dataset.id); return; }

      const catOpt = t.closest('.cat-opt');
      if (catOpt) {
        formCat = catOpt.dataset.cat;
        document.querySelectorAll('.cat-opt').forEach(function (b) {
          b.classList.toggle('is-sel', b.dataset.cat === formCat);
        });
        return;
      }

      const segBtn = t.closest('.seg-btn');
      if (segBtn && segBtn.dataset.type) {
        formType = segBtn.dataset.type;
        setSeg();
        renderPick();
        return;
      }
    });

    /* valor com máscara, respeitando as casas da moeda */
    $('amountInput').addEventListener('input', function () {
      const dec = CUR[store.currency].dec;
      const digits = $('amountInput').value.replace(/\D/g, '').slice(0, 12);
      formValue = digits ? parseInt(digits, 10) / Math.pow(10, dec) : 0;
      $('amountInput').value = amountText(formValue);
    });

    /* tocar em QUALQUER lugar da caixa do valor foca o campo — antes só funcionava
       acertando o próprio input (o "R$" e a folga da caixa eram toque morto) */
    const amountBox = $('amountBox');
    if (amountBox) {
      amountBox.addEventListener('click', function (ev) {
        const inp = $('amountInput');
        if (ev.target !== inp) inp.focus();
      });
    }

    $('txForm').addEventListener('submit', saveTx);
    $('delBtn').addEventListener('click', deleteTx);
    $('fab').addEventListener('click', function () { openTx(null); });
    $('avatarBtn').addEventListener('click', function () { openSheet('set'); });

    /* botões dos estados vazios: "Anotar o primeiro" e "Limpar filtros" */
    document.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-empty-add]')) { openTx(null); return; }
      if (ev.target.closest('[data-empty-clear]')) {
        query = '';
        catFilter = 'all';
        filter = 'all';
        const si = $('searchInput');
        if (si) si.value = '';
        document.querySelectorAll('[data-filter]').forEach(function (b) {
          b.classList.toggle('is-active', b.dataset.filter === 'all');
        });
        renderTx();
      }
    });

    /* caixinha de confirmação */
    $('askYes').addEventListener('click', function () { closeAsk(true); });
    $('askNo').addEventListener('click', function () { closeAsk(false); });
    $('askBox').addEventListener('click', function (ev) {
      if (ev.target === $('askBox')) closeAsk(false);
    });

    $('nameInput').addEventListener('input', function (e) { setName(e.target.value); });

    /* busca em Registros */
    $('searchInput').addEventListener('input', function () {
      query = $('searchInput').value.trim();
      renderTx();
    });
    $('searchClear').addEventListener('click', function () {
      query = '';
      $('searchInput').value = '';
      renderTx();
      $('searchInput').focus();
    });
    $('exportBtn').addEventListener('click', exportData);
    $('importBtn').addEventListener('click', function () { $('importFile').click(); });
    $('importFile').addEventListener('change', function (e) {
      const f = e.target.files && e.target.files[0];
      if (f) importData(f);
      e.target.value = '';
    });
    $('resetBtn').addEventListener('click', resetAll);

    /* fixos */
    $('openFixBtn').addEventListener('click', openFixSheet);
    $('addFixBtn').addEventListener('click', function () { openTx(null, true); });
    $('fixedToggle').addEventListener('change', syncFixUI);
    ['input', 'change'].forEach(function (evt) {
      $('dateInput').addEventListener(evt, function () {
        if (!$('fixedToggle').checked) return;
        /* a data manda no dia e no mês de início; o stepper só refina */
        const d = $('dateInput').value;
        if (d) {
          formFrom = d.slice(0, 7);
          if (formTo && formTo < formFrom) formTo = formFrom;
        }
        syncFixUI();
      });
    });

    $('endToggle').addEventListener('change', function () {
      formTo = $('endToggle').checked ? (formTo || formFrom) : '';
      if (formTo && formFrom && formTo < formFrom) formTo = formFrom;
      syncFixUI();
    });

    $('fixDates').addEventListener('click', function (ev) {
      const b = ev.target.closest('[data-fd]');
      if (!b) return;
      ev.preventDefault();
      const step = Number(b.dataset.step) || 0;
      if (b.dataset.fd === 'from') {
        formFrom = shiftYM(formFrom || monthOf(new Date()), step);
        if (formTo && formTo < formFrom) formTo = formFrom;
      } else {
        formTo = formTo ? shiftYM(formTo, step) : formFrom;
        if (formTo < formFrom) formTo = formFrom;
      }
      syncFixUI();
    });
    $('fixList').addEventListener('click', function (ev) {
      const sw = ev.target.closest('[data-act="toggle"]');
      if (sw) {
        const rowSw = sw.closest('[data-fix]');
        if (rowSw) toggleFix(rowSw.dataset.fix);
        return;
      }
      const row = ev.target.closest('[data-fix]');
      if (row) openTx('r:' + row.dataset.fix);
    });

    /* categorias */
    $('openCatBtn').addEventListener('click', openCatSheet);
    $('catSeg').addEventListener('click', function (ev) {
      const b = ev.target.closest('[data-cattype]');
      if (!b) return;
      catType = b.dataset.cattype;
      showCatList();
    });
    $('catList').addEventListener('click', function (ev) {
      const row = ev.target.closest('[data-cat]');
      if (row) openCatEditor(row.dataset.cat);
    });
    $('newCatBtn').addEventListener('click', function () { openCatEditor(null); });
    $('catSwatches').addEventListener('click', function (ev) {
      const b = ev.target.closest('[data-color]');
      if (!b) return;
      catForm.color = b.dataset.color;
      renderSwatches();
    });
    $('catIcons').addEventListener('click', function (ev) {
      const b = ev.target.closest('[data-icon]');
      if (!b) return;
      catForm.icon = b.dataset.icon;
      renderIconChoices();
    });
    $('catHideToggle').addEventListener('change', function () {
      catForm.hidden = $('catHideToggle').checked;
      $('catHideRow').classList.toggle('is-on', catForm.hidden);
    });
    $('catSaveBtn').addEventListener('click', saveCat);
    $('catDelBtn').addEventListener('click', deleteCat);
    $('catBackBtn').addEventListener('click', showCatList);
    $('catNameInput').addEventListener('input', function () {
      catForm.name = $('catNameInput').value;
    });

    /* moeda do app + cotação */
    $('curSeg').addEventListener('click', function (ev) {
      const b = ev.target.closest('button[data-cur]');
      if (b) setCurrency(b.dataset.cur);
    });
    $('rateBtn').addEventListener('click', function () { refreshRates(true); });

    /* conversor */
    $('fxFromSeg').addEventListener('click', function (ev) {
      const b = ev.target.closest('button[data-cur]');
      if (!b) return;
      fxFrom = b.dataset.cur;
      if (fxFrom === fxTo) fxTo = fxFrom === 'PYG' ? 'BRL' : 'PYG';
      renderFx();
    });
    $('fxToSeg').addEventListener('click', function (ev) {
      const b = ev.target.closest('button[data-cur]');
      if (!b) return;
      fxTo = b.dataset.cur;
      renderFx();
    });
    $('fxSwap').addEventListener('click', function () {
      const swap = fxFrom;
      fxFrom = fxTo;
      fxTo = swap;
      renderFx();
    });
    $('fxPad').addEventListener('click', function (ev) {
      const b = ev.target.closest('button[data-k]');
      if (!b) return;
      const k = b.dataset.k;
      if (k === 'c') {
        fxDigits = '';
      } else if (k === 'b') {
        fxDigits = fxDigits.slice(0, -1);
      } else if (fxDigits.length < 10) {
        fxDigits = (fxDigits === '0' ? '' : fxDigits) + k;
      }
      renderFxDisplay();
    });

    /* teclado */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (askResolve) { closeAsk(false); return; }
      closeSheets();
    });

    /* service worker */
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () { /* sem https */ });
      });
    }
  }

  /* ---------------- conta na nuvem ----------------
     A nuvem é cópia, não dona: o localStorage manda no dia a dia.
     O sync.js conversa com o Supabase e chama de volta
     cloudSnapshot (o que subir) e cloudApply (o que baixar). */

  function cloudSnapshot() {
    return {
      v: 2,
      name: store.name,
      currency: store.currency,
      txs: store.txs,
      recurring: store.recurring,
      cats: store.cats,
      seeded: true
    };
  }

  function cloudApply(data) {
    if (!data || !Array.isArray(data.txs)) return;
    store = storeFrom(data);
    applyingRemote = true;
    saveStore();
    applyingRemote = false;
    buildCats();
    renderAll();
    renderFixList();
    renderCurSeg();
    renderRateNote();
    const ni = $('nameInput');
    if (ni) ni.value = store.name;
  }

  function cloudWhen(ts) {
    const sec = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (sec < 45) return 'agora mesmo';
    if (sec < 3600) return 'há ' + Math.max(1, Math.round(sec / 60)) + ' min';
    if (sec < 86400) return 'há ' + Math.round(sec / 3600) + ' h';
    return 'há ' + Math.round(sec / 86400) + ' d';
  }

  function renderCloud(s) {
    const box = $('cloudBox');
    const form = $('cloudForm');
    const actions = $('cloudActions');
    const merge = $('cloudMerge');
    if (!box || !form || !actions || !merge) return;
    if (!s) s = window.Sync.status();

    const err = !!s.logged && s.state === 'error' && !!s.lastError;
    box.classList.toggle('is-err', err);

    const title = $('cloudTitle');
    if (title) title.textContent = s.logged && s.email ? s.email : 'Conta na nuvem';

    let text;
    if (!s.logged) text = 'Entrar pra ter tudo em todos os aparelhos';
    else if (s.state === 'syncing') text = 'Sincronizando…';
    else if (s.conflict) text = 'Escolha qual versão vale';
    else if (err) text = s.lastError;
    else if (s.dirty) text = 'Salvando na nuvem…';
    else if (s.lastSync) text = 'Sincronizado ' + cloudWhen(s.lastSync);
    else text = s.email;
    $('cloudStatus').textContent = text;

    form.hidden = !!s.logged;
    actions.hidden = !s.logged;
    merge.hidden = !s.conflict;

    if (s.conflict) {
      $('cloudMergeTxt').textContent =
        'A nuvem tem ' + s.conflict.nRemote + ' registro' + (s.conflict.nRemote === 1 ? '' : 's') +
        ' e este aparelho tem ' + s.conflict.nLocal + '. Qual fica valendo?';
    }
  }

  function cloudCreds() {
    const email = ($('cloudEmail').value || '').trim();
    const pass = $('cloudPass').value || '';
    if (!email || email.indexOf('@') < 0) { toast('Digite o e-mail da conta', 'err'); return null; }
    if (pass.length < 6) { toast('A senha precisa de pelo menos 6', 'err'); return null; }
    return { email: email, password: pass };
  }

  function cloudRun(btn, run, okMsg) {
    if (!btn || !window.Sync) return;
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = '…';
    run().then(function (r) {
      btn.disabled = false;
      btn.textContent = label;
      if (r && r.needsConfirm) toast('Conta criada. Confirme o e-mail que te enviei', 'info');
      else if (okMsg) toast(okMsg);
    }).catch(function (err) {
      btn.disabled = false;
      btn.textContent = label;
      toast((err && err.message) || 'Não deu certo', 'err');
      shake(btn);
    });
  }

  function bindCloud() {
    if (typeof window === 'undefined' || !window.Sync) return;
    const S = window.Sync;
    S.provide({ snapshot: cloudSnapshot, apply: cloudApply, ask: ask, toast: toast });
    S.on(renderCloud);

    const signIn = $('cloudSignIn');
    const signUp = $('cloudSignUp');
    const out = $('cloudOut');
    const syncBtn = $('cloudSync');
    const pull = $('cloudPull');
    const push = $('cloudPush');

    if (signIn) {
      signIn.addEventListener('click', function () {
        const c = cloudCreds();
        if (!c) return;
        cloudRun(signIn, function () {
          return S.signIn(c.email, c.password).then(function () {
            $('cloudPass').value = '';
            return S.now();
          });
        }, 'Conectado');
      });
    }

    if (signUp) {
      signUp.addEventListener('click', function () {
        const c = cloudCreds();
        if (!c) return;
        cloudRun(signUp, function () { return S.signUp(c.email, c.password); }, 'Conta criada');
      });
    }

    if (out) {
      out.addEventListener('click', function () {
        S.signOut();
        showAuth('Você saiu. Entre de novo pra abrir o app.');
      });
    }

    if (syncBtn) {
      syncBtn.addEventListener('click', function () {
        cloudRun(syncBtn, function () { return S.now(); }, '');
      });
    }

    if (pull) {
      pull.addEventListener('click', function () {
        cloudRun(pull, function () { return S.useRemote(); }, 'Baixei da nuvem');
      });
    }

    if (push) {
      push.addEventListener('click', function () {
        cloudRun(push, function () { return S.keepLocal(); }, 'Enviei deste aparelho');
      });
    }

    renderCloud(S.status());
    S.boot();
  }

  /* ---------------- entrada (login obrigatório) ----------------
     O app só abre com uma sessão salva no aparelho. Quem já entrou
     continua entrando mesmo sem internet (a cópia na nuvem se
     resolve depois) — o login só é exigido quando não há sessão. */

  let authMode = 'in';
  let started = false;

  function hasAuthUI() {
    return !!$('authScreen');
  }

  function setAuthErr(msg) {
    const el = $('authErr');
    if (!el) return;
    el.textContent = msg || '';
    el.hidden = !msg;
  }

  function setAuthMode(mode) {
    authMode = mode === 'up' ? 'up' : 'in';
    const seg = $('authSeg');
    if (seg) seg.classList.toggle('income', authMode === 'up');
    document.querySelectorAll('[data-auth]').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.auth === authMode);
    });
    const go = $('authGo');
    if (go) go.textContent = authMode === 'up' ? 'Criar conta' : 'Entrar';
    const forgot = $('authForgot');
    if (forgot) forgot.hidden = authMode === 'up';
    const sub = $('authSub');
    if (sub) {
      sub.textContent = authMode === 'up'
        ? 'Crie sua conta pra guardar tudo na nuvem'
        : 'Entre pra continuar de onde parou';
    }
    setAuthErr('');
  }

  function authBusy(on) {
    const go = $('authGo');
    if (!go) return;
    go.disabled = !!on;
    go.textContent = on ? '…' : (authMode === 'up' ? 'Criar conta' : 'Entrar');
  }

  function showAuth(msg) {
    const gate = $('authScreen');
    const app = $('app');
    if (!gate || !app) return false;
    closeSheets();
    app.hidden = true;
    gate.hidden = false;
    authBusy(false);
    setAuthErr(msg || '');
    return true;
  }

  function start() {
    if (started) return;
    started = true;
    init();
  }

  function enterApp() {
    const gate = $('authScreen');
    const app = $('app');
    if (gate) gate.hidden = true;
    if (app) app.hidden = false;
    setAuthErr('');
    if (started) {
      if (typeof window !== 'undefined' && window.Sync) window.Sync.boot();
      renderAll();
      return;
    }
    start();
  }

  function bindAuth() {
    if (!hasAuthUI() || typeof window === 'undefined' || !window.Sync) return;
    const S = window.Sync;

    document.querySelectorAll('[data-auth]').forEach(function (b) {
      b.addEventListener('click', function () { setAuthMode(b.dataset.auth); });
    });

    const form = $('authForm');
    if (form) {
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const email = ($('authEmail').value || '').trim();
        const pass = $('authPass').value || '';
        if (!email || email.indexOf('@') < 0) {
          setAuthErr('Digite um e-mail válido');
          shake($('authEmail'));
          return;
        }
        if (pass.length < 6) {
          setAuthErr('A senha precisa de pelo menos 6 caracteres');
          shake($('authPass'));
          return;
        }
        setAuthErr('');
        authBusy(true);
        const job = authMode === 'up' ? S.signUp(email, pass) : S.signIn(email, pass);
        job.then(function (r) {
          authBusy(false);
          if (r && r.needsConfirm) {
            setAuthMode('in');
            setAuthErr('Conta criada. Confirme o e-mail que te enviei e entre.');
            return;
          }
          $('authPass').value = '';
          enterApp();
        }).catch(function (err) {
          authBusy(false);
          setAuthErr((err && err.message) || 'Não deu certo. Tenta de novo.');
          shake($('authPass'));
        });
      });
    }

    const forgot = $('authForgot');
    if (forgot) {
      forgot.addEventListener('click', function () {
        const email = ($('authEmail').value || '').trim();
        if (!email || email.indexOf('@') < 0) {
          setAuthErr('Escreva seu e-mail primeiro');
          return;
        }
        S.recover(email).then(function () {
          toast('Te mandei um link pra trocar a senha', 'info');
        }).catch(function (err) {
          setAuthErr((err && err.message) || 'Não deu pra enviar o e-mail');
        });
      });
    }
  }

  /* ---------------- início ---------------- */

  function init() {
    store = loadStore();
    if (!store) {
      /* com conta na nuvem o aparelho novo começa vazio: os registros
         chegam do servidor, então não semeia exemplos por cima */
      const naNuvem = typeof window !== 'undefined' && window.Sync && window.Sync.ready();
      store = {
        v: 2, name: 'Dayanne', currency: 'BRL',
        txs: naNuvem ? [] : demoData(),
        recurring: [], cats: defaultCats(), seeded: true
      };
      justSeeded = !naNuvem;
      saveStore();
    }
    if (!Array.isArray(store.recurring)) store.recurring = [];
    store.cats = normalizeCats(store.cats);
    buildCats();

    view = monthOf(new Date());
    $('dateInput').value = isoOf(new Date());

    bind();
    renderAll();
    initFx();
    initLove();
    renderCurSeg();
    renderRateNote();
    renderFixList();
    loadRates();
    bindCloud();

    if (justSeeded) {
      setTimeout(function () {
        toast('Deixei alguns exemplos pra você ver. Zerar em Ajustes.', 'info');
      }, 900);
    }
  }

  /* ---------------- porta de entrada ---------------- */

  bindAuth();

  if (typeof window !== 'undefined' && window.Sync) {
    window.Sync.boot();   /* aproveita a sessão já salva neste aparelho */
    if (hasAuthUI() && !window.Sync.ready()) showAuth();
    else enterApp();
  } else {
    enterApp();           /* sem o sync.js (cache antigo): entra direto */
  }
})();
