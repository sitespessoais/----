/* Smoke test do sync.js (nuvem) — roda em Node com fetch/localStorage falsos. */

const path = require('path');
const assert = require('assert');

const SYNC_PATH = path.join(__dirname, '..', 'sync.js');

/* ---------- infra ---------- */

let checks = 0;
let fails = 0;

function ok(name, cond, extra) {
  checks++;
  if (!cond) {
    fails++;
    console.log('FALHOU:', name, extra === undefined ? '' : extra);
  }
}

function memStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); }
  };
}

function reply(status, data) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(data === undefined ? '' : JSON.stringify(data))
  });
}

/* servidor de mentira: guarda UMA linha por usuário */
function makeServer() {
  const s = {
    row: null,
    calls: [],
    auth: { email: 'dayanne@exemplo.com', password: 'segredo123' },
    accessToken: 'tok-1',
    refreshToken: 'ref-1',
    rejectToken: false,     /* força 401 no select */
    missingTable: false,
    failPush: 0
  };

  s.fetch = function (url, opts) {
    opts = opts || {};
    const method = opts.method || 'GET';
    const body = opts.body ? JSON.parse(opts.body) : null;
    s.calls.push({ url, method, headers: opts.headers, body });

    if (url.includes('/auth/v1/token?grant_type=password')) {
      if (!body || body.email !== s.auth.email || body.password !== s.auth.password) {
        return reply(400, { error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
      }
      return reply(200, {
        access_token: s.accessToken, refresh_token: s.refreshToken, expires_in: 3600,
        user: { id: 'user-1', email: s.auth.email }
      });
    }

    if (url.includes('/auth/v1/token?grant_type=refresh_token')) {
      if (!body || body.refresh_token !== s.refreshToken) {
        return reply(400, { error_code: 'invalid_grant', msg: 'Invalid Refresh Token' });
      }
      s.accessToken = 'tok-2';
      return reply(200, {
        access_token: s.accessToken, refresh_token: s.refreshToken, expires_in: 3600,
        user: { id: 'user-1', email: s.auth.email }
      });
    }

    if (url.includes('/auth/v1/signup')) {
      return reply(200, { id: 'user-1', email: body && body.email });
    }

    if (url.includes('/auth/v1/logout')) return reply(204, undefined);

    if (method === 'GET' && url.includes('/rest/v1/finance_state')) {
      if (s.missingTable) {
        return reply(404, { code: 'PGRST205', message: "Could not find the table 'public.finance_state'" });
      }
      if (s.rejectToken) {
        s.rejectToken = false;
        return reply(401, { message: 'JWT expired' });
      }
      return reply(200, s.row ? [s.row] : []);
    }

    if (method === 'POST' && url.includes('/rest/v1/finance_state')) {
      if (s.failPush) { s.failPush--; return reply(503, { message: 'indisponível' }); }
      s.row = { data: body.data, updated_at: new Date().toISOString() };
      return reply(201, undefined);
    }

    return reply(500, { message: 'rota não mapeada: ' + url });
  };

  s.postCount = () => s.calls.filter((c) => c.method === 'POST' && c.url.includes('/rest/v1/')).length;
  s.getCount = () => s.calls.filter((c) => c.method === 'GET' && c.url.includes('/rest/v1/')).length;
  return s;
}

/* carrega o sync.js limpo, com fetch/storage do teste */
function load(server) {
  globalThis.localStorage = memStorage();
  globalThis.fetch = server.fetch;
  delete require.cache[require.resolve(SYNC_PATH)];
  return require(SYNC_PATH);
}

function tx(id, amount, desc) {
  return { id: id, type: 'expense', cat: 'food', amount: amount, desc: desc || '', date: '2026-11-20' };
}

function sampleData(n, name) {
  const txs = [];
  for (let i = 0; i < n; i++) txs.push(tx('t' + i, 10 + i, 'conta ' + i));
  return {
    v: 2, name: name || 'Dayanne', currency: 'BRL',
    txs: txs, recurring: [],
    cats: {
      expense: [{ id: 'food', name: 'Alimentação', icon: 'food', color: '#BE7345', hidden: false }],
      income: [{ id: 'salary', name: 'Salário', icon: 'money', color: '#33691E', hidden: false }]
    },
    seeded: true
  };
}

/* ---------- testes ---------- */

(async function run() {
  /* 1. sem sessão: fica desligado e não fala com a rede */
  {
    const server = makeServer();
    const Sync = load(server);
    let local = sampleData(3);
    Sync.provide({ snapshot: () => local, apply: () => {} });
    Sync.boot();
    ok('sem login: status off', Sync.status().state === 'off', Sync.status().state);
    ok('sem login: não logado', Sync.ready() === false);
    await Sync.now();
    ok('sem login: nenhuma chamada REST', server.getCount() === 0 && server.postCount() === 0);
    Sync.queuePush();
    await Sync.flush();
    ok('sem login: queuePush não sobe nada', server.postCount() === 0);
  }

  /* 2. senha errada */
  {
    const server = makeServer();
    const Sync = load(server);
    Sync.provide({ snapshot: () => sampleData(3), apply: () => {} });
    Sync.boot();
    let msg = '';
    try { await Sync.signIn('dayanne@exemplo.com', 'errada'); } catch (e) { msg = e.message; }
    ok('senha errada: mensagem em português', /não conferem/i.test(msg), msg);
    ok('senha errada: continua deslogado', Sync.ready() === false);
  }

  /* 3. login com nuvem vazia → sobe o que está no aparelho */
  {
    const server = makeServer();
    const Sync = load(server);
    const local = sampleData(3);
    Sync.provide({ snapshot: () => local, apply: () => {} });
    Sync.boot();
    await Sync.signIn('dayanne@exemplo.com', 'segredo123');
    await Sync.now();
    ok('login: sessão salva', Sync.ready() === true);
    ok('login: status idle', Sync.status().state === 'idle', Sync.status().state);
    ok('login: subiu 1 vez', server.postCount() === 1, server.postCount());
    ok('login: nuvem tem os 3 registros', server.row && server.row.data.txs.length === 3);
    ok('login: user_id certo', server.calls.find((c) => c.method === 'POST' && c.url.includes('/rest')).body.user_id === 'user-1');
    ok('login: guardou na sessão', !!JSON.parse(globalThis.localStorage.getItem('dayanne.sync.sess')).lastSent);
    ok('login: marcou a hora', Sync.status().lastSync > 0);
  }

  /* 4. abrir de novo com tudo igual → não sobe nada de novo */
  {
    const server = makeServer();
    const Sync = load(server);
    const local = sampleData(3);
    Sync.provide({ snapshot: () => local, apply: () => {} });
    Sync.boot();
    await Sync.signIn('dayanne@exemplo.com', 'segredo123');
    await Sync.now();
    const posts = server.postCount();
    await Sync.now();
    ok('igual: não reenvia', server.postCount() === posts, server.postCount() + ' vs ' + posts);
    ok('igual: fica idle', Sync.status().state === 'idle');
  }

  /* 5. outro aparelho mudou e este não → baixa */
  {
    const server = makeServer();
    const Sync = load(server);
    let local = sampleData(3);
    let applied = null;
    Sync.provide({ snapshot: () => local, apply: (d) => { applied = d; local = d; } });
    Sync.boot();
    await Sync.signIn('dayanne@exemplo.com', 'segredo123');
    await Sync.now();

    /* o "outro aparelho" gravou 5 registros */
    server.row = { data: sampleData(5), updated_at: new Date().toISOString() };
    await Sync.now();
    ok('remoto novo: aplicou no aparelho', applied && applied.txs.length === 5, applied && applied.txs.length);
    ok('remoto novo: nada subiu por cima', server.postCount() === 1, server.postCount());
    ok('remoto novo: nuvem intacta', server.row.data.txs.length === 5);

    /* e agora os dois estão iguais: uma segunda sincronia não faz nada */
    const more = server.postCount();
    await Sync.now();
    ok('remoto novo: segunda passada silenciosa', server.postCount() === more);
  }

  /* 6. os dois mudaram → pergunta antes de decidir (e baixar quando disser sim) */
  {
    const server = makeServer();
    const Sync = load(server);
    let local = sampleData(3);
    let applied = null;
    let question = null;
    Sync.provide({
      snapshot: () => local,
      apply: (d) => { applied = d; local = d; },
      ask: (o) => { question = o; return Promise.resolve(true); }
    });
    Sync.boot();
    await Sync.signIn('dayanne@exemplo.com', 'segredo123');
    await Sync.now();

    local = sampleData(4);                                    /* mexeu aqui */
    server.row = { data: sampleData(6), updated_at: new Date().toISOString() };  /* mexeu lá */
    await Sync.now();

    ok('conflito: perguntou', !!question, question && question.title);
    ok('conflito: texto tem as duas contagens', !!question && /6/.test(question.text) && /4/.test(question.text), question && question.text);
    await new Promise((r) => setTimeout(r, 10));              /* deixa o .then da pergunta rodar */
    ok('conflito: escolheu a nuvem', applied && applied.txs.length === 6, applied && applied.txs.length);
    ok('conflito: depois fica idle', Sync.status().state === 'idle', Sync.status().state);
  }

  /* 7. conflito dizendo "não" → sobe o do aparelho */
  {
    const server = makeServer();
    const Sync = load(server);
    let local = sampleData(3);
    Sync.provide({
      snapshot: () => local,
      apply: (d) => { local = d; },
      ask: () => Promise.resolve(false)
    });
    Sync.boot();
    await Sync.signIn('dayanne@exemplo.com', 'segredo123');
    await Sync.now();

    local = sampleData(7);
    server.row = { data: sampleData(2), updated_at: new Date().toISOString() };
    await Sync.now();
    await new Promise((r) => setTimeout(r, 10));
    ok('conflito: mandou o do aparelho', server.row.data.txs.length === 7, server.row.data.txs.length);
    ok('conflito: estado final idle', Sync.status().state === 'idle', Sync.status().state);
  }

  /* 8. token vencido → renova e tenta de novo */
  {
    const server = makeServer();
    const Sync = load(server);
    const local = sampleData(3);
    Sync.provide({ snapshot: () => local, apply: () => {} });
    Sync.boot();
    await Sync.signIn('dayanne@exemplo.com', 'segredo123');
    await Sync.now();

    server.rejectToken = true;      /* o select responde 401 */
    await Sync.now();
    const refreshed = server.calls.some((c) => c.url.includes('grant_type=refresh_token'));
    ok('401: renovou o token', refreshed);
    ok('401: terminou sem erro', Sync.status().state === 'idle', Sync.status().state + ' / ' + Sync.status().lastError);
    ok('401: usou o token novo', server.calls.filter((c) => c.url.includes('/rest/v1/')).pop().headers.Authorization === 'Bearer tok-2');
  }

  /* 9. tabela não existe → aviso claro, não "erro qualquer" */
  {
    const server = makeServer();
    const Sync = load(server);
    Sync.provide({ snapshot: () => sampleData(2), apply: () => {} });
    Sync.boot();
    server.missingTable = true;
    await Sync.signIn('dayanne@exemplo.com', 'segredo123');
    await Sync.now();
    ok('sem tabela: estado de erro', Sync.status().state === 'error', Sync.status().state);
    ok('sem tabela: fala do schema.sql', /schema\.sql/i.test(Sync.status().lastError), Sync.status().lastError);
  }

  /* 10. fila do save com debounce */
  {
    const server = makeServer();
    const Sync = load(server);
    let local = sampleData(3);
    Sync.provide({ snapshot: () => local, apply: () => {} });
    Sync.boot();
    await Sync.signIn('dayanne@exemplo.com', 'segredo123');
    await Sync.now();
    const posts = server.postCount();

    local = sampleData(4);
    Sync.queuePush();
    Sync.queuePush();
    Sync.queuePush();
    ok('fila: marcou pendente', Sync.status().dirty === true);
    await Sync.flush();
    ok('fila: subiu uma vez só', server.postCount() === posts + 1, server.postCount() - posts);
    ok('fila: nuvem com 4', server.row.data.txs.length === 4);
    ok('fila: limpou o pendente', Sync.status().dirty === false);
  }

  /* 11. erro de rede ao subir → fica pendente e volta sozinho */
  {
    const server = makeServer();
    const Sync = load(server);
    let local = sampleData(3);
    Sync.provide({ snapshot: () => local, apply: () => {} });
    Sync.boot();
    await Sync.signIn('dayanne@exemplo.com', 'segredo123');
    await Sync.now();

    local = sampleData(4);
    server.failPush = 1;
    Sync.queuePush();
    await Sync.flush();
    ok('rede ruim: estado de erro', Sync.status().state === 'error', Sync.status().state);
    ok('rede ruim: guardou o motivo', !!Sync.status().lastError, Sync.status().lastError);
    ok('rede ruim: continua pendente', Sync.status().dirty === true);

    await Sync.flush();
    ok('rede volta: subiu', server.row.data.txs.length === 4, server.row.data.txs.length);
    ok('rede volta: fica idle', Sync.status().state === 'idle', Sync.status().state);
    ok('rede volta: limpou o pendente', Sync.status().dirty === false);
  }

  /* 12. canon: mesma coisa escrita de outro jeito dá o mesmo hash */
  {
    const server = makeServer();
    const Sync = load(server);
    const a = sampleData(3);
    const b = {
      seeded: false, cats: a.cats, recurring: [], txs: a.txs.map((t) => Object.assign({}, t)),
      currency: 'BRL', name: 'Dayanne', v: 2, extra: 'ignorado'
    };
    ok('canon: mesma coisa, mesmo hash', Sync.hash(Sync.canon(a)) === Sync.hash(Sync.canon(b)));
    const c = sampleData(3);
    c.txs[0].amount = 10.000001;
    ok('canon: valor diferente muda o hash', Sync.hash(Sync.canon(a)) !== Sync.hash(Sync.canon(c)));
  }

  /* 13. sair limpa a sessão e mantém os dados */
  {
    const server = makeServer();
    const Sync = load(server);
    const local = sampleData(3);
    Sync.provide({ snapshot: () => local, apply: () => {} });
    Sync.boot();
    await Sync.signIn('dayanne@exemplo.com', 'segredo123');
    await Sync.now();
    Sync.signOut();
    ok('sair: deslogado', Sync.ready() === false);
    ok('sair: estado off', Sync.status().state === 'off');
    ok('sair: sessão apagada do storage', globalThis.localStorage.getItem('dayanne.sync.sess') === null);
  }

  /* 14. criar conta com confirmação de e-mail ligada */
  {
    const server = makeServer();
    const Sync = load(server);
    Sync.provide({ snapshot: () => sampleData(0), apply: () => {} });
    Sync.boot();
    const r = await Sync.signUp('dayanne@exemplo.com', 'segredo123');
    ok('cadastro: pede confirmação', r && r.needsConfirm === true, JSON.stringify(r));
    ok('cadastro: segue deslogado', Sync.ready() === false);
  }

  /* 15. entrar não sai sincronizando sozinho (quem manda é o app, depois do init) */
  {
    const server = makeServer();
    const Sync = load(server);
    Sync.provide({ snapshot: () => sampleData(3), apply: () => {} });
    Sync.boot();
    const r = await Sync.signIn('dayanne@exemplo.com', 'segredo123');
    ok('login: responde ok', r && r.ok === true, JSON.stringify(r));
    ok('login: não sobe nada antes da hora', server.postCount() === 0 && server.getCount() === 0,
      server.postCount() + '/' + server.getCount());
    ok('login: sessão pronta', Sync.ready() === true);
  }

  /* 16. salvar antes de ler a nuvem não pode subir (risco de zerar a nuvem) */
  {
    const server = makeServer();
    server.row = { data: sampleData(9), updated_at: new Date().toISOString() };
    const Sync = load(server);
    let local = sampleData(0);
    Sync.provide({ snapshot: () => local, apply: () => {} });
    Sync.boot();
    await Sync.signIn('dayanne@exemplo.com', 'segredo123');

    Sync.queuePush();                 /* o app salvou antes de sincronizar */
    await Sync.flush();
    ok('antes de ler: nada subiu', server.postCount() === 0, server.postCount());
    ok('antes de ler: nuvem intacta', server.row.data.txs.length === 9);
  }

  /* 17. aparelho novo (vazio) puxa a nuvem sem encher de pergunta */
  {
    const server = makeServer();
    server.row = { data: sampleData(9), updated_at: new Date().toISOString() };
    const Sync = load(server);
    let local = sampleData(0);
    let applied = null;
    let asked = false;
    Sync.provide({
      snapshot: () => local,
      apply: (d) => { applied = d; local = d; },
      ask: () => { asked = true; return Promise.resolve(true); }
    });
    Sync.boot();
    await Sync.signIn('dayanne@exemplo.com', 'segredo123');
    await Sync.now();
    ok('aparelho novo: baixou sozinho', applied && applied.txs.length === 9, applied && applied.txs.length);
    ok('aparelho novo: não perguntou', asked === false);
    ok('aparelho novo: nada de push por cima', server.postCount() === 0, server.postCount());
  }

  /* 18. recuperar senha chama o endpoint certo */
  {
    const server = makeServer();
    const Sync = load(server);
    const original = server.fetch;
    let seen = null;
    server.fetch = function (url, opts) {
      if (url.includes('/auth/v1/recover')) { seen = JSON.parse(opts.body); return reply(200, {}); }
      return original(url, opts);
    };
    globalThis.fetch = server.fetch;
    Sync.provide({ snapshot: () => sampleData(1), apply: () => {} });
    await Sync.recover('dayanne@exemplo.com');
    ok('recuperar: mandou o e-mail', seen && seen.email === 'dayanne@exemplo.com', JSON.stringify(seen));
  }

  /* ---------- resultado ---------- */
  console.log('');
  if (fails) {
    console.log(fails + ' falha(s) de ' + checks + ' verificações');
    process.exit(1);
  }
  console.log(checks + '/' + checks + ' verificacoes passaram');
  console.log('Smoke do sync OK');
})().catch((e) => {
  console.error('explodiu:', e && e.stack || e);
  process.exit(1);
});
