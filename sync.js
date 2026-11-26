/* =========================================================
   Finanças da Dayanne — nuvem (Supabase)
   ---------------------------------------------------------
   O localStorage continua sendo a fonte de verdade do
   aparelho. Aqui só mora o login e a cópia na nuvem.

   Sem dependências: fetch direto no Auth e no REST do
   Supabase, então o service worker continua cacheando só
   os arquivos do app e nada quebra offline.
   ========================================================= */
(function (global) {
  'use strict';

  /* ---------------- configuração ---------------- */

  var URL_BASE = 'https://thclnvlqrdlhnwwpnguf.supabase.co';
  /* chave pública (publishable). Pode ficar no app: quem protege
     os dados é a RLS + o login, não o segredo da chave. */
  var ANON_KEY = 'sb_publishable_pMRt5831Z1sY443DYnoiJQ_turTVtwW';
  var TABLE = 'finance_state';
  var SESS_KEY = 'dayanne.sync.sess';
  var PUSH_DELAY = 2500;

  /* ---------------- estado ---------------- */

  var sess = null;        /* { access_token, refresh_token, expires_at, uid, email, lastSent } */
  var hooks = {};         /* snapshot, apply, ask, toast (o app injeta) */
  var subs = [];
  var state = 'off';      /* off | idle | syncing | error | conflict */
  var lastSync = 0;
  var lastError = '';
  var missingTable = false;
  var dirty = false;
  var timer = null;
  var running = false;
  var conflict = null;    /* { remote, nRemote, nLocal } */
  var hydrated = false;   /* já leu a nuvem ao menos uma vez nesta sessão */
  var booted = false;

  /* ---------------- utilidades ---------------- */

  function now() { return Date.now(); }

  function configured() {
    return !!URL_BASE && !!ANON_KEY && ANON_KEY.length > 24;
  }

  function logged() {
    return !!(sess && sess.access_token);
  }

  function deviceName() {
    var ua = (global.navigator && global.navigator.userAgent) || '';
    if (/iPhone|iPad|iPod|Android/i.test(ua)) return 'celular';
    return 'computador';
  }

  /* hash simples e estável: serve pra saber se o conteúdo mudou */
  function hash(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) {
      h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(36);
  }

  function money(v) {
    var n = Number(v);
    if (!isFinite(n)) return 0;
    return Math.round(n * 1e6) / 1e6;
  }

  /* forma canônica: só os campos que importam, na mesma ordem,
     pra comparar nuvem x aparelho sem falso positivo */
  function canon(data) {
    var d = data || {};
    var cats = d.cats || {};
    function cat(c) {
      return [c && c.id, c && c.name, c && c.icon, c && c.color, c && c.hidden ? 1 : 0].join('|');
    }
    return JSON.stringify({
      n: d.name || '',
      c: d.currency === 'PYG' ? 'PYG' : 'BRL',
      t: (d.txs || []).map(function (x) {
        return [x.id, x.type, x.cat, money(x.amount), x.desc || '', x.date].join('|');
      }),
      r: (d.recurring || []).map(function (x) {
        return [x.id, x.type, x.cat, money(x.amount), x.desc || '', x.day,
          x.from || '', x.to || '', x.active === false ? 0 : 1].join('|');
      }),
      k: [(cats.expense || []).map(cat).join(','), (cats.income || []).map(cat).join(',')].join('//')
    });
  }

  function countOf(data) {
    var d = data || {};
    return (d.txs || []).length + (d.recurring || []).length;
  }

  /* ---------------- sessão ---------------- */

  function persist() {
    try {
      if (sess && sess.access_token) global.localStorage.setItem(SESS_KEY, JSON.stringify(sess));
      else global.localStorage.removeItem(SESS_KEY);
    } catch (e) { /* sem espaço / modo privado */ }
  }

  function restore() {
    try {
      sess = JSON.parse(global.localStorage.getItem(SESS_KEY) || 'null');
    } catch (e) { sess = null; }
    if (sess && !sess.lastSent) sess.lastSent = '';
  }

  function adopt(j) {
    var prev = sess || {};
    sess = {
      access_token: j.access_token,
      refresh_token: j.refresh_token || prev.refresh_token,
      expires_at: now() + (Number(j.expires_in) || 3600) * 1000,
      uid: (j.user && j.user.id) || prev.uid,
      email: (j.user && j.user.email) || prev.email || '',
      lastSent: prev.lastSent || ''
    };
    persist();
  }

  /* ---------------- rede ---------------- */

  function request(path, opts) {
    var o = opts || {};
    var headers = { apikey: ANON_KEY };
    if (o.body !== undefined) headers['Content-Type'] = 'application/json';
    if (o.token) headers.Authorization = 'Bearer ' + o.token;
    if (o.prefer) headers.Prefer = o.prefer;

    return global.fetch(URL_BASE + path, {
      method: o.method || 'GET',
      headers: headers,
      body: o.body === undefined ? undefined : JSON.stringify(o.body)
    }).then(function (res) {
      return res.text().then(function (txt) {
        var data = null;
        try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = null; }
        return { ok: res.ok, status: res.status, data: data };
      });
    });
  }

  function fail(res) {
    var code = (res.data && (res.data.error_code || res.data.code)) || '';
    if (code === 'PGRST205' || res.status === 404) missingTable = true;

    var msg = 'Não deu pra falar com a nuvem';
    if (code === 'invalid_credentials') msg = 'E-mail ou senha não conferem';
    else if (code === 'email_not_confirmed') msg = 'Confirme o e-mail que te enviei primeiro';
    else if (code === 'user_already_exists' || code === 'email_exists') msg = 'Essa conta já existe — toque em Entrar';
    else if (code === 'weak_password') msg = 'Senha muito curta (mínimo 6 caracteres)';
    else if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') {
      msg = 'O Supabase só deixa 2 e-mails por hora. Tenta mais tarde (ou desligue a confirmação de e-mail no projeto)';
    } else if (code === 'signup_disabled') msg = 'As inscrições estão fechadas no projeto — use a conta que já existe';
    else if (code === 'email_provider_disabled') msg = 'Login por e-mail está desligado no projeto';
    else if (code === 'email_address_invalid' || code === 'validation_failed') msg = 'Esse e-mail não parece válido';
    else if (missingTable) msg = 'Falta criar a tabela no Supabase (rode o schema.sql)';
    else if (res.status === 401 || res.status === 403) msg = 'Sem permissão na nuvem — entre de novo';
    else if (res.data && res.data.message) msg = res.data.message;
    else if (res.status === 0) msg = 'Você está sem internet';

    var err = new Error(msg);
    err.status = res.status;
    err.code = code;
    return err;
  }

  function ensureToken() {
    if (!logged()) return Promise.reject(new Error('Entre na sua conta primeiro'));
    if (sess.expires_at - 90000 > now()) return Promise.resolve(sess.access_token);
    return request('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: { refresh_token: sess.refresh_token }
    }).then(function (res) {
      if (!res.ok) {
        clearSession();
        throw fail(res);
      }
      adopt(res.data);
      return sess.access_token;
    });
  }

  /* ---------------- login ---------------- */

  function signIn(email, password) {
    if (!configured()) return Promise.reject(new Error('Sincronização não configurada'));
    return request('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: { email: email, password: password }
    }).then(function (res) {
      if (!res.ok) throw fail(res);
      adopt(res.data);
      setState('idle');
      emit();
      return { ok: true };
    });
  }

  function signUp(email, password) {
    if (!configured()) return Promise.reject(new Error('Sincronização não configurada'));
    return request('/auth/v1/signup', {
      method: 'POST',
      body: { email: email, password: password }
    }).then(function (res) {
      if (!res.ok) throw fail(res);
      if (res.data && res.data.access_token) {
        adopt(res.data);
        setState('idle');
        emit();
        return { ok: true };
      }
      /* confirmação de e-mail ligada: a conta existe, mas ainda sem sessão */
      return { needsConfirm: true };
    });
  }

  /* manda o link de redefinir senha (o Supabase cuida do e-mail) */
  function recover(email) {
    return request('/auth/v1/recover', {
      method: 'POST',
      body: { email: email }
    }).then(function (res) {
      if (!res.ok) throw fail(res);
      return { ok: true };
    });
  }

  function clearSession() {
    sess = null;
    dirty = false;
    hydrated = false;
    conflict = null;
    clearTimeout(timer);
    try { global.localStorage.removeItem(SESS_KEY); } catch (e) {}
  }

  function signOut() {
    var token = sess && sess.access_token;
    clearSession();
    setState('off');
    lastSync = 0;
    lastError = '';
    emit();
    if (token) {
      request('/auth/v1/logout', { method: 'POST', token: token }).catch(function () {});
    }
  }

  /* ---------------- sincronização ---------------- */

  function queryPath() {
    return '/rest/v1/' + TABLE + '?select=data,updated_at&user_id=eq.' + encodeURIComponent(sess.uid);
  }

  function pullOnce(token) {
    return request(queryPath(), { token: token }).then(function (res) {
      if (res.status === 401) {
        sess.expires_at = 0;
        return ensureToken().then(function (fresh) {
          return request(queryPath(), { token: fresh }).then(function (r2) {
            if (!r2.ok) throw fail(r2);
            return (r2.data && r2.data[0]) || null;
          });
        });
      }
      if (!res.ok) throw fail(res);
      if (missingTable) throw fail(res);
      return (res.data && res.data[0]) || null;
    });
  }

  function pushNow() {
    var snap = hooks.snapshot ? hooks.snapshot() : null;
    if (!snap || !logged()) return Promise.resolve();

    return ensureToken().then(function (token) {
      return request('/rest/v1/' + TABLE, {
        method: 'POST',
        token: token,
        prefer: 'resolution=merge-duplicates,return=minimal',
        body: {
          user_id: sess.uid,
          data: snap,
          app_version: Number(snap.v) || 2,
          device: deviceName()
        }
      });
    }).then(function (res) {
      if (!res.ok) throw fail(res);
      sess.lastSent = hash(canon(snap));
      persist();
      dirty = false;
      lastSync = now();
      lastError = '';
      setState('idle');
    });
  }

  function applyRemote(data) {
    if (!hooks.apply) return;
    hooks.apply(data);
    var snap = hooks.snapshot ? hooks.snapshot() : null;
    sess.lastSent = snap ? hash(canon(snap)) : '';
    persist();
    dirty = false;      /* acabou de vir da nuvem: não tem nada pendente */
    lastSync = now();
    lastError = '';
    conflict = null;
    setState('idle');
    emit();
  }

  function useRemote() {
    if (!conflict) return Promise.resolve();
    applyRemote(conflict.remote);
    return Promise.resolve();
  }

  function keepLocal() {
    if (!conflict) return Promise.resolve();
    conflict = null;
    setState('syncing');
    return pushNow().then(function () {
      emit();
    }).catch(function (err) {
      lastError = err.message;
      setState('error');
      emit();
      throw err;
    });
  }

  /* decide o que fazer com o que veio da nuvem */
  function reconcile(row) {
    var snap = hooks.snapshot ? hooks.snapshot() : null;
    if (!snap) return Promise.resolve();

    var localHash = hash(canon(snap));

    if (!row) return pushNow();                       /* nuvem vazia: manda o local */

    var remoteHash = hash(canon(row.data));

    if (remoteHash === localHash) {                   /* iguais: nada a fazer */
      sess.lastSent = localHash;
      persist();
      lastSync = now();
      return Promise.resolve();
    }
    if (!sess.lastSent && !countOf(snap) && countOf(row.data)) {
      /* primeira vez neste aparelho e ele está vazio: a nuvem manda, sem perguntar */
      applyRemote(row.data);
      return Promise.resolve();
    }
    if (sess.lastSent && localHash === sess.lastSent) {   /* só a nuvem mudou */
      applyRemote(row.data);
      return Promise.resolve();
    }
    if (sess.lastSent && remoteHash === sess.lastSent) {  /* só o aparelho mudou */
      return pushNow();
    }

    /* os dois mudaram (ou é o primeiro login deste aparelho) */
    conflict = {
      remote: row.data,
      nRemote: countOf(row.data),
      nLocal: countOf(snap)
    };
    setState('conflict');
    emit();

    if (hooks.ask) {
      hooks.ask({
        title: 'Qual versão vale?',
        text: 'Na nuvem tem ' + conflict.nRemote + ' registro' + (conflict.nRemote === 1 ? '' : 's') +
          ' e neste aparelho ' + conflict.nLocal + '. Baixar a da nuvem e substituir a deste aparelho?',
        yes: 'Baixar a nuvem'
      }).then(function (yes) {
        if (yes) useRemote();
        else keepLocal().catch(function () {});
      });
    }
    return Promise.resolve();
  }

  function syncNow() {
    if (!configured() || !logged()) return Promise.resolve();
    if (running) return running;

    running = ensureToken()
      .then(function (token) { return pullOnce(token); })
      .then(function (row) { return reconcile(row); })
      .then(function () {
        running = false;
        if (missingTable) {
          lastError = 'Falta criar a tabela no Supabase (rode o schema.sql)';
          setState('error');
        } else if (conflict) {
          setState('conflict');
        } else {
          hydrated = true;
          lastError = '';
          setState('idle');
        }
        emit();
        /* tinha coisa salva esperando? agora que já leu a nuvem, pode subir */
        if (hydrated && dirty && !conflict) return flush();
      })
      .catch(function (err) {
        running = false;
        lastError = (err && err.message) || 'Deu erro ao sincronizar';
        setState('error');
        emit();
      });

    return running;
  }

  /* ---------- fila do que foi salvo no aparelho ---------- */

  function flush() {
    clearTimeout(timer);
    timer = null;
    if (!dirty || !logged()) return Promise.resolve();
    /* nunca sobe antes de ler a nuvem: evita mandar um estado vazio por cima
       do que já existe lá (acontece no primeiro login de um aparelho novo) */
    if (!hydrated) return Promise.resolve();
    if (global.navigator && global.navigator.onLine === false) return Promise.resolve();
    lastError = '';
    return pushNow().then(function () { emit(); }).catch(function (err) {
      lastError = err.message;
      setState('error');
      emit();
    });
  }

  function queuePush() {
    if (!configured() || !logged()) return;
    dirty = true;
    clearTimeout(timer);
    timer = setTimeout(flush, PUSH_DELAY);
  }

  /* ---------------- status / eventos ---------------- */

  function status() {
    return {
      configured: configured(),
      logged: logged(),
      email: (sess && sess.email) || '',
      state: state,
      lastSync: lastSync,
      lastError: lastError,
      dirty: dirty,
      conflict: conflict ? { nRemote: conflict.nRemote, nLocal: conflict.nLocal } : null
    };
  }

  function on(fn) {
    if (typeof fn !== 'function') return function () {};
    subs.push(fn);
    return function () {
      subs = subs.filter(function (f) { return f !== fn; });
    };
  }

  function emit() {
    var s = status();
    subs.forEach(function (fn) {
      try { fn(s); } catch (e) {}
    });
  }

  function setState(s) {
    state = s;
  }

  function provide(h) {
    hooks = h || {};
  }

  function boot() {
    restore();
    if (!configured()) {
      setState('off');
      emit();
      return;
    }
    if (!booted && global.addEventListener) {
      booted = true;
      global.addEventListener('online', function () {
        if (logged()) syncNow();
      });
    }
    if (logged()) {
      if (state !== 'syncing') setState('idle');
      emit();
      syncNow();
    } else {
      setState('off');
      emit();
    }
  }

  /* ---------------- api ---------------- */

  var Sync = {
    configured: configured,
    ready: logged,
    status: status,
    provide: provide,
    on: on,
    boot: boot,
    signIn: signIn,
    signUp: signUp,
    signOut: signOut,
    recover: recover,
    sync: syncNow,
    now: syncNow,
    queuePush: queuePush,
    flush: flush,
    useRemote: useRemote,
    keepLocal: keepLocal,
    canon: canon,
    hash: hash
  };

  global.Sync = Sync;
  if (typeof module !== 'undefined' && module.exports) module.exports = Sync;
})(typeof window !== 'undefined' ? window : globalThis);
