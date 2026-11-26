/* Smoke test: roda app.js em Node com um DOM minimo e valida o init + fluxo de salvar. */

const path = require('path');
const assert = require('assert');

/* ---------- DOM falso ---------- */
const store = new Map();

function makeEl(tag) {
  const el = {
    tagName: tag || 'div',
    id: '',
    className: '',
    value: '',
    hidden: false,
    disabled: false,
    offsetWidth: 0,
    style: {},
    dataset: {},
    _text: '',
    _html: '',
    _l: {},
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); },
      toggle(c, on) { if (on === undefined) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); } else if (on) this._s.add(c); else this._s.delete(c); },
      contains(c) { return this._s.has(c); }
    },
    addEventListener(t, fn) { (this._l[t] = this._l[t] || []).push(fn); },
    removeEventListener() {},
    _attrs: {},
    setAttribute(k, v) { this._attrs[k] = String(v); },
    removeAttribute(k) { delete this._attrs[k]; },
    hasAttribute(k) { return k in this._attrs; },
    appendChild() {}, remove() {}, focus() {}, click() {},
    closest() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
  Object.defineProperty(el, 'textContent', {
    get() { return this._text; },
    set(v) { this._text = String(v); }
  });
  Object.defineProperty(el, 'innerHTML', {
    get() { return this._html; },
    set(v) { this._html = String(v); }
  });
  return el;
}

function getById(id) {
  if (!store.has(id)) { const e = makeEl('div'); e.id = id; store.set(id, e); }
  return store.get(id);
}

const docHandlers = {};
global.document = {
  getElementById: getById,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: (t) => makeEl(t),
  body: makeEl('body'),
  addEventListener(t, fn) { (docHandlers[t] = docHandlers[t] || []).push(fn); }
};

global.window = {
  confirm: () => true,
  scrollTo: () => {},
  addEventListener: () => {}
};
global.navigator = {};

const mem = {};
global.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; }
};

global.requestAnimationFrame = (fn) => { fn(performance.now() + 9999); return 1; };
global.cancelAnimationFrame = () => {};

/* sem rede: exercita o caminho de fallback da cotacao */
global.fetch = () => Promise.reject(new Error('offline'));

/* ---------- executa o app ---------- */
require(path.join(__dirname, '..', 'app.js'));

const checks = [];
function ok(name, cond, extra) {
  checks.push({ name, cond, extra });
  if (!cond) console.log('FALHOU:', name, extra === undefined ? '' : extra);
}

const money = /^−?R\$\s[\d.]+,\d{2}$/;

/* estado inicial */
ok('saldo formatado', money.test(getById('balanceNum').textContent), getById('balanceNum').textContent);
ok('entradas formatadas', money.test(getById('incomeNum').textContent), getById('incomeNum').textContent);
ok('saidas formatadas', money.test(getById('expenseNum').textContent), getById('expenseNum').textContent);
ok('saudacao preenchida', /^(Bom dia|Boa tarde|Boa noite),$/.test(getById('helloText').textContent), getById('helloText').textContent);
ok('nome no titulo', getById('nameText').innerHTML.includes('Dayanne'), getById('nameText').innerHTML);
ok('inicial do avatar', getById('avatarInitial').textContent === 'D', getById('avatarInitial').textContent);
ok('tag do saldo', getById('balanceTag').innerHTML.length > 0, getById('balanceTag').innerHTML);

const rail = getById('catRail').innerHTML;
ok('cards de categoria', (rail.match(/class="cat-card"/g) || []).length > 0);
ok('barra de categoria', rail.includes('cat-bar'));

const homeList = getById('homeList').innerHTML;
ok('lista recente', (homeList.match(/class="tx"/g) || []).length === 5, (homeList.match(/class="tx"/g) || []).length);

const groups = getById('txGroups').innerHTML;
ok('grupos de registros', groups.includes('tx-group-h'));
ok('itens de registros', (groups.match(/class="tx"/g) || []).length > 0);

const legend = getById('legend').innerHTML;
ok('legenda do grafico', (legend.match(/class="leg-row"/g) || []).length > 0);
ok('icone na legenda', (legend.match(/leg-ico/g) || []).length > 0);

/* nenhum emoji em qualquer saida renderizada */
const everything = ['balanceNum', 'incomeNum', 'expenseNum', 'balanceTag', 'catRail',
  'homeList', 'homeEmpty', 'txGroups', 'txEmpty', 'legend', 'donutSegs', 'donutTotal',
  'bars', 'inEmpty'].map((id) => getById(id).innerHTML + ' ' + getById(id).textContent).join(' ');
const emojis = everything.match(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu);
ok('sem emoji na renderizacao', !emojis, emojis && emojis.join(','));
ok('icones svg presentes', (everything.match(/<svg /g) || []).length > 0);
ok('categoria com icone', /cat-ico/.test(rail));
ok('transacao com icone', /tx-ico/.test(groups));

const segs = getById('donutSegs').innerHTML;
ok('segmentos da rosquinha', (segs.match(/class="donut-seg"/g) || []).length > 0);
ok('dasharray coerente', !/stroke-dasharray="-/.test(segs));

/* geometria da rosquinha: vaos iguais, sem sobreposicao, anel fechado */
const RING = 2 * Math.PI * 48;
const GAP = RING * 0.011;
const segRe = /stroke-dasharray="([\d.]+) [\d.]+" stroke-dashoffset="(-?[\d.]+)"/g;
const segData = [];
let sm = segRe.exec(segs);
while (sm) {
  segData.push({ dash: Number(sm[1]), off: -Number(sm[2]) });
  sm = segRe.exec(segs);
}
ok('geometria le todos os segmentos', segData.length >= 8, segData.length);
ok('segmento com comprimento positivo', segData.every((s) => s.dash > 0));

const ringGaps = segData.map((s, i) => {
  const next = i + 1 < segData.length ? segData[i + 1].off : RING;
  return next - (s.off + s.dash);
});
ok('nenhum segmento invade o vizinho', ringGaps.every((g) => g > 0.9), ringGaps.map((g) => g.toFixed(2)).join(' '));
ok('vaos iguais entre segmentos', ringGaps.filter((g) => Math.abs(g - GAP) < 0.05).length >= ringGaps.length - 1,
  ringGaps.map((g) => g.toFixed(2)).join(' '));
const ringTotal = segData.reduce((a, s) => a + s.dash, 0) + ringGaps.reduce((a, g) => a + g, 0);
ok('anel fecha sem sobra', Math.abs(ringTotal - RING) < 0.05, ringTotal.toFixed(2) + ' vs ' + RING.toFixed(2));

const bars = getById('bars').innerHTML;
ok('barras de 6 meses', (bars.match(/class="bar-fill/g) || []).length === 6, (bars.match(/class="bar-fill/g) || []).length);
ok('rotulos das barras', (bars.match(/bar-lbl/g) || []).length === 6);

ok('persistiu no storage', !!mem['dayanne.financas.v1']);
const saved = JSON.parse(mem['dayanne.financas.v1']);
ok('seed com 24 registros', saved.txs.length === 24, saved.txs.length);
ok('modelo v2', saved.v === 2, saved.v);
ok('moeda padrao BRL', saved.currency === 'BRL', saved.currency);
ok('seed sem data invalida', saved.txs.every((t) => /^\d{4}-\d{2}-\d{2}$/.test(t.date)));
ok('seed com valores positivos', saved.txs.every((t) => t.amount > 0));
ok('seed em reais (nao centavos)', saved.txs.some((t) => t.amount < 100), saved.txs[0].amount);

/* mascara de valor */
const amount = getById('amountInput');
amount.value = '1234';
amount._l.input.forEach((fn) => fn());
ok('mascara de centavos', amount.value === '12,34', amount.value);

amount.value = '12345678';
amount._l.input.forEach((fn) => fn());
ok('mascara 9 digitos', amount.value === '123.456,78', amount.value);

/* fluxo de salvar */
const before = JSON.parse(mem['dayanne.financas.v1']).txs.length;
const form = getById('txForm');
let prevented = false;
form._l.submit.forEach((fn) => fn({ preventDefault: () => { prevented = true; } }));
const after = JSON.parse(mem['dayanne.financas.v1']).txs.length;
ok('preventDefault chamado', prevented);
ok('registro adicionado', after === before + 1, before + ' -> ' + after);
const last = JSON.parse(mem['dayanne.financas.v1']).txs.slice(-1)[0];
ok('valor salvo em reais', Math.abs(last.amount - 123456.78) < 0.001, last.amount);
ok('data preenchida', /^\d{4}-\d{2}-\d{2}$/.test(last.date), last.date);
ok('categoria valida', typeof last.cat === 'string' && last.cat.length > 0, last.cat);

/* ---------- troca de moeda para Guarani ---------- */
const curSegEl = getById('curSeg');
ok('seletor de moeda ligado', !!(curSegEl._l.click && curSegEl._l.click.length));
curSegEl._l.click.forEach((fn) => fn({ target: { closest: () => ({ dataset: { cur: 'PYG' } }) } }));

const afterCur = JSON.parse(mem['dayanne.financas.v1']);
ok('moeda salva como PYG', afterCur.currency === 'PYG', afterCur.currency);
ok('saldo exibido em guarani', /^−?Gs [\d.]+$/.test(getById('balanceNum').textContent), getById('balanceNum').textContent);
ok('saldo sem centavos', getById('balanceNum').textContent.indexOf(',') === -1, getById('balanceNum').textContent);

/* entrada de gasto em guarani */
const amt2 = getById('amountInput');
amt2.value = '25000';
amt2._l.input.forEach((fn) => fn());
ok('mascara em guarani', amt2.value === '25.000', amt2.value);

const beforeGs = JSON.parse(mem['dayanne.financas.v1']).txs.length;
getById('txForm')._l.submit.forEach((fn) => fn({ preventDefault: () => {} }));
const savedGs = JSON.parse(mem['dayanne.financas.v1']);
const lastGs = savedGs.txs.slice(-1)[0];
ok('registro em guarani adicionado', savedGs.txs.length === beforeGs + 1);
ok('25.000 Gs convertido para reais', Math.abs(lastGs.amount - 22.727273) < 0.001, lastGs.amount);

/* ---------- conversor ---------- */
ok('abre zerado', getById('fxDisplay').textContent === '0', getById('fxDisplay').textContent);
ok('resultado zerado', getById('fxResult').textContent === '0', getById('fxResult').textContent);

const pad = getById('fxPad');
const press = (k) => pad._l.click.forEach((fn) => fn({ target: { closest: () => ({ dataset: { k: k } }) } }));

['1', '0', '0'].forEach(press);
ok('teclado monta o valor', getById('fxDisplay').textContent === '1,00', getById('fxDisplay').textContent);
ok('conversao 1 real -> guarani', getById('fxResult').textContent === '1.100', getById('fxResult').textContent);
ok('simbolos nas caixas', getById('fxFromSym').textContent === 'R$' && getById('fxToSym').textContent === 'Gs',
  getById('fxFromSym').textContent + '/' + getById('fxToSym').textContent);
ok('cotacao do par exibida', getById('fxRate').textContent.indexOf('1 R$ = ') === 0, getById('fxRate').textContent);

press('b');
ok('apagar tira um digito', getById('fxDisplay').textContent === '0,10', getById('fxDisplay').textContent);
press('c');
ok('limpar zera o visor', getById('fxDisplay').textContent === '0', getById('fxDisplay').textContent);

/* ---------- fixos ---------- */
getById('descInput').value = 'Aluguel';
getById('fixedToggle').checked = true;
getById('txForm')._l.submit.forEach((fn) => fn({ preventDefault: () => {} }));

const savedFix = JSON.parse(mem['dayanne.financas.v1']);
ok('fixo criado', (savedFix.recurring || []).length === 1, (savedFix.recurring || []).length);
const rec = (savedFix.recurring || [])[0] || {};
ok('fixo com dia valido', rec.day >= 1 && rec.day <= 31, rec.day);
ok('fixo ativo', rec.active === true, rec.active);
ok('fixo com mes de inicio', /^\d{4}-\d{2}$/.test(rec.from || ''), rec.from);
ok('fixo guardado em reais', Math.abs((rec.amount || 0) - 22.727273) < 0.001, rec.amount);
ok('fixo com descricao', rec.desc === 'Aluguel', rec.desc);
ok('fixo entra na lista do mes', getById('txGroups').innerHTML.indexOf('tx-fix-tag') !== -1);
ok('fixo listado nos ajustes', getById('fixList').innerHTML.indexOf('data-fix') !== -1);

/* pausar o fixo */
const fakeTarget = {
  closest: (sel) => (sel === '[data-act="toggle"]'
    ? { closest: () => ({ dataset: { fix: rec.id } }) }
    : null)
};
getById('fixList')._l.click.forEach((fn) => fn({ target: fakeTarget }));
const paused = JSON.parse(mem['dayanne.financas.v1']);
ok('fixo pausado', paused.recurring[0].active === false, paused.recurring[0].active);
ok('fixo some ao pausar', getById('txGroups').innerHTML.indexOf('tx-fix-tag') === -1);

/* ---------- botao + so na home ---------- */
function goTo(name) {
  const target = {
    dataset: { goto: name },
    closest(sel) { return sel === '[data-goto]' ? target : null; }
  };
  (docHandlers.click || []).forEach((fn) => fn({ target, preventDefault: () => {} }));
}

const fabEl = getById('fab');
goTo('home');
ok('fab aparece na home', !fabEl.classList.contains('is-hidden'));
ok('fab focavel na home', fabEl.tabIndex === 0, fabEl.tabIndex);

['tx', 'in', 'fx'].forEach(function (screenName) {
  goTo(screenName);
  ok('fab some em ' + screenName, fabEl.classList.contains('is-hidden'));
  ok('fab nao focavel em ' + screenName, fabEl.tabIndex === -1, fabEl.tabIndex);
  ok('fab aria-hidden em ' + screenName, fabEl._attrs['aria-hidden'] === 'true', fabEl._attrs['aria-hidden']);
});

goTo('home');
ok('fab volta ao voltar pra home', !fabEl.classList.contains('is-hidden'));
ok('fab aria-hidden removido', !fabEl.hasAttribute('aria-hidden'));

/* ---------- busca e filtro por categoria ---------- */
function fire(el, evt, arg) {
  (el._l[evt] || []).forEach((fn) => fn(arg || {}));
}
function clickWith(sel, dataset) {
  const alvo = { dataset: dataset, closest: (s) => (s === sel ? alvo : null) };
  fire(getById('catChips'), 'click', { target: alvo }); /* no-op se nao houver */
  (docHandlers.click || []).forEach((fn) => fn({ target: alvo, preventDefault: () => {} }));
}

ok('chips de categoria montados', getById('catChips').innerHTML.indexOf('data-catf="food"') !== -1);
ok('sem chip "todas" fixo', getById('catChips').innerHTML.indexOf('data-catf="all"') === -1);

getById('searchInput').value = 'uber';
fire(getById('searchInput'), 'input');
const busca = getById('txGroups').innerHTML;
ok('busca filtra a lista', busca.indexOf('Uber') !== -1 && busca.indexOf('Mercado') === -1);
ok('botao limpar aparece na busca', getById('searchClear').hidden === false);

getById('searchClear')._l.click.forEach((fn) => fn({}));
ok('limpar busca devolve a lista', getById('txGroups').innerHTML.indexOf('Mercado') !== -1);
ok('botao limpar some', getById('searchClear').hidden === true);

getById('searchInput').value = 'zzzz';
fire(getById('searchInput'), 'input');
ok('busca sem resultado mostra aviso', getById('txEmpty').hidden === false &&
  getById('txEmpty').innerHTML.indexOf('Nada encontrado') !== -1);
getById('searchClear')._l.click.forEach((fn) => fn({}));

clickWith('[data-catf]', { catf: 'food' });
const soComida = getById('txGroups').innerHTML;
ok('filtro por categoria', soComida.indexOf('Mercado') !== -1 && soComida.indexOf('Uber') === -1);
ok('chip de limpar filtro aparece', getById('catChips').innerHTML.indexOf('data-catf="all"') !== -1);

clickWith('[data-catf]', { catf: 'food' });   /* tocar de novo desliga */
ok('tocar de novo limpa o filtro', getById('txGroups').innerHTML.indexOf('Uber') !== -1);
ok('chip de limpar filtro some', getById('catChips').innerHTML.indexOf('data-catf="all"') === -1);

/* ---------- prazo do fixo ---------- */
getById('descInput').value = 'Empréstimo';
getById('dateInput').value = '2025-01-10';
getById('fixedToggle').checked = true;
fire(getById('fixedToggle'), 'change');
ok('campo de prazo aparece no fixo', getById('fixDates').hidden === false);
ok('comeca em mostra o mes', /^[a-z]{3}\/\d{4}$/.test(getById('fixFrom').textContent), getById('fixFrom').textContent);

getById('endToggle').checked = true;
fire(getById('endToggle'), 'change');
ok('termina em aparece', getById('endBox').hidden === false);
const fimAntes = getById('fixTo').textContent;
const seta = { dataset: { fd: 'to', step: '1' } };
fire(getById('fixDates'), 'click', {
  target: { closest: (s) => (s === '[data-fd]' ? seta : null) },
  preventDefault: () => {}
});
ok('seta muda o termina em', getById('fixTo').textContent !== fimAntes);

getById('txForm')._l.submit.forEach((fn) => fn({ preventDefault: () => {} }));
const comPrazo = JSON.parse(mem['dayanne.financas.v1']).recurring.filter((r) => r.desc === 'Empréstimo')[0] || {};
ok('fixo guarda o inicio', comPrazo.from === '2025-01', comPrazo.from);
ok('fixo guarda o fim', /^\d{4}-\d{2}$/.test(comPrazo.to || ''), comPrazo.to);
ok('fixo guarda dia certo', comPrazo.day === 10, comPrazo.day);
ok('lista mostra o prazo', getById('fixList').innerHTML.indexOf('até ') !== -1);

/* ---------- categorias proprias ---------- */
getById('openCatBtn')._l.click.forEach((fn) => fn({}));
ok('lista de categorias monta', getById('catList').innerHTML.indexOf('data-cat="food"') !== -1);

getById('newCatBtn')._l.click.forEach((fn) => fn({}));
ok('editor de categoria abre', getById('catEditView').hidden === false);
getById('catNameInput').value = 'Faculdade';
fire(getById('catSwatches'), 'click', {
  target: { closest: (s) => (s === '[data-color]' ? { dataset: { color: '#518CC2' } } : null) }
});
fire(getById('catIcons'), 'click', {
  target: { closest: (s) => (s === '[data-icon]' ? { dataset: { icon: 'book' } } : null) }
});
getById('catSaveBtn')._l.click.forEach((fn) => fn({}));

const comCat = JSON.parse(mem['dayanne.financas.v1']);
const nova = (comCat.cats.expense || []).filter((c) => c.name === 'Faculdade')[0] || {};
ok('categoria criada', !!nova.id, nova.id);
ok('categoria com a cor escolhida', nova.color === '#518CC2', nova.color);
ok('categoria com o icone escolhido', nova.icon === 'book', nova.icon);
ok('categoria aparece no seletor', getById('catPick').innerHTML.indexOf('Faculdade') !== -1);

/* esconder tira do seletor mas mantem na lista */
fire(getById('catList'), 'click', {
  target: { closest: (s) => (s === '[data-cat]' ? { dataset: { cat: nova.id } } : null) }
});
ok('editor abre na categoria', getById('catEditView').hidden === false);
getById('catHideToggle').checked = true;
fire(getById('catHideToggle'), 'change');
getById('catSaveBtn')._l.click.forEach((fn) => fn({}));
ok('categoria oculta sai do seletor', getById('catPick').innerHTML.indexOf('Faculdade') === -1);
ok('categoria oculta fica na lista', getById('catList').innerHTML.indexOf('Faculdade') !== -1);

/* zerar tudo nao apaga as categorias */

const askBox = getById('askBox');
getById('resetBtn')._l.click.forEach((fn) => fn({}));
ok('zerar pede confirmacao', askBox.classList.contains('is-on'));
ok('titulo da confirmacao', getById('askTitle').textContent.indexOf('Zerar') === 0, getById('askTitle').textContent);
ok('nada apagado antes de confirmar', JSON.parse(mem['dayanne.financas.v1']).txs.length > 0);

/* cancelar nao apaga */
getById('askNo')._l.click.forEach((fn) => fn({}));
ok('cancelar fecha a caixinha', !askBox.classList.contains('is-on'));
ok('cancelar mantem os dados', JSON.parse(mem['dayanne.financas.v1']).txs.length > 0);

/* confirmar apaga: o trabalho roda num then, entao valida na proxima volta */
getById('resetBtn')._l.click.forEach((fn) => fn({}));
getById('askYes')._l.click.forEach((fn) => fn({}));

Promise.resolve().then(function () {
  const zerado = JSON.parse(mem['dayanne.financas.v1']);
  ok('zerar apaga os registros', zerado.txs.length === 0, zerado.txs.length);
  ok('zerar apaga os fixos', zerado.recurring.length === 0, zerado.recurring.length);
  ok('zerar tira o fixo da lista', getById('fixList').innerHTML.indexOf('data-fix') === -1);
  ok('zerar fecha a caixinha', !askBox.classList.contains('is-on'));

  /* ---------- resultado ---------- */
  const fails = checks.filter((c) => !c.cond);
  console.log('\n' + (checks.length - fails.length) + '/' + checks.length + ' verificacoes passaram');
  if (fails.length) {
    console.log('FALHAS:', fails.map((f) => f.name).join(', '));
    process.exit(1);
  }
  console.log('Smoke test OK');
});
