/* Teste de ponta a ponta contra o Supabase de verdade (usa rede).
   Cria 2 contas de teste, confirma por SQL, grava, lê e prova a RLS.

   Uso:
     $env:SUPABASE_ACCESS_TOKEN = 'sbp_...'
     node tools/e2e.js
     node tools/e2e.js --clean     (apaga as contas de teste)
*/

const REF = 'thclnvlqrdlhnwwpnguf';
const BASE = 'https://' + REF + '.supabase.co';
const ANON = 'sb_publishable_pMRt5831Z1sY443DYnoiJQ_turTVtwW';
const PAT = process.env.SUPABASE_ACCESS_TOKEN || '';
const PASS = 'TesteSync2026!';
const U1 = 'teste.a.dayanne@example.com';
const U2 = 'teste.b.dayanne@example.com';

let checks = 0;
let fails = 0;
function ok(name, cond, extra) {
  checks++;
  if (!cond) { fails++; console.log('FALHOU: ' + name + (extra === undefined ? '' : ' → ' + extra)); }
  else console.log('  ok  ' + name);
}

async function req(url, opts) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
  return { status: res.status, ok: res.ok, data, text };
}

function jsonHeaders(extra) {
  return Object.assign({ apikey: ANON, 'Content-Type': 'application/json' }, extra || {});
}

async function sql(query) {
  const r = await req('https://api.supabase.com/v1/projects/' + REF + '/database/query', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + PAT, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: query })
  });
  if (!r.ok) throw new Error('SQL falhou: ' + r.status + ' ' + r.text.slice(0, 300));
  return r.data;
}

async function signUp(email) {
  return req(BASE + '/auth/v1/signup', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ email: email, password: PASS })
  });
}

/* cria o usuário direto no auth (o cadastro público recusa example.com e
   ainda mandaria e-mail de confirmação — aqui não sai e-mail nenhum) */
async function makeUser(email) {
  const rows = await sql(
    'with u as (' +
    '  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,' +
    '    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,' +
    '    confirmation_token, recovery_token, email_change_token_new, email_change,' +
    '    phone_change, phone_change_token, email_change_token_current, reauthentication_token)' +
    "  values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'," +
    "    '" + email + "', crypt('" + PASS + "', gen_salt('bf')), now(), now(), now()," +
    "    '{\"provider\":\"email\",\"providers\":[\"email\"]}'::jsonb, '{}'::jsonb," +
    "    '', '', '', '', '', '', '', '')" +
    '  returning id' +
    ')' +
    ' insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)' +
    " select gen_random_uuid(), u.id, jsonb_build_object('sub', u.id::text, 'email', '" + email + "')," +
    "        'email', u.id::text, now(), now(), now() from u" +
    ' returning user_id'
  );
  return rows[0].user_id;
}

async function signIn(email) {
  const r = await req(BASE + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ email: email, password: PASS })
  });
  if (!r.ok) throw new Error('login falhou para ' + email + ': ' + r.status + ' ' + r.text.slice(0, 200));
  return r.data;
}

async function confirmUser(email) {
  await sql("update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now()) " +
    "where email = '" + email + "'");
}

async function userIdOf(email) {
  const rows = await sql("select id from auth.users where email = '" + email + "'");
  return rows && rows[0] && rows[0].id;
}

async function clean() {
  await sql("delete from auth.users where email in ('" + U1 + "','" + U2 + "')");
  const left = await sql("select email from auth.users where email in ('" + U1 + "','" + U2 + "')");
  const rows = await sql("select user_id from public.finance_state");
  console.log('contas de teste restantes: ' + (left ? left.length : 0));
  console.log('linhas em finance_state: ' + (rows ? rows.length : 0));
}

const amostra = {
  v: 2, name: 'Dayanne', currency: 'BRL', seeded: true,
  txs: [
    { id: 'e2e1', type: 'expense', cat: 'food', amount: 35.6, desc: 'Café com as amigas', date: '2026-11-25' },
    { id: 'e2e2', type: 'expense', cat: 'trans', amount: 24.9, desc: 'Uber', date: '2026-11-24' },
    { id: 'e2e3', type: 'income', cat: 'salary', amount: 3200, desc: 'Salário', date: '2026-11-21' }
  ],
  recurring: [{ id: 'r1', type: 'expense', cat: 'home', amount: 1200, desc: 'Aluguel', day: 5, from: '2026-11', to: '', active: true }],
  cats: {
    expense: [{ id: 'food', name: 'Alimentação', icon: 'food', color: '#BE7345', hidden: false }],
    income: [{ id: 'salary', name: 'Salário', icon: 'money', color: '#33691E', hidden: false }]
  }
};

async function main() {
  if (process.argv.includes('--clean')) { await clean(); return; }
  if (!PAT) { console.error('falta SUPABASE_ACCESS_TOKEN'); process.exit(2); }

  console.log('\n1) criando as duas contas de teste (direto no auth, sem e-mail)');
  const idA = await makeUser(U1);
  const idB = await makeUser(U2);
  ok('conta A criada', !!idA, idA);
  ok('conta B criada', !!idB, idB);

  console.log('\n2) login com as duas');
  const s1 = await signIn(U1);
  const s2 = await signIn(U2);
  ok('login A devolveu token', !!s1.access_token);
  ok('login B devolveu token', !!s2.access_token);
  ok('A e B são usuários diferentes', s1.user.id !== s2.user.id);
  globalThis.__t1 = s1.access_token;
  globalThis.__t2 = s2.access_token;
  const u1 = s1.user.id;

  console.log('\n3) A grava o estado (upsert igual ao do app)');
  const put = await req(BASE + '/rest/v1/finance_state', {
    method: 'POST',
    headers: jsonHeaders({
      Authorization: 'Bearer ' + s1.access_token,
      Prefer: 'resolution=merge-duplicates,return=representation'
    }),
    body: JSON.stringify({ user_id: u1, data: amostra, app_version: 2, device: 'teste' })
  });
  ok('upsert respondeu 201', put.status === 201, put.status + ' ' + put.text.slice(0, 200));
  ok('voltou com updated_at do servidor', !!(put.data && put.data[0] && put.data[0].updated_at),
    put.data && put.data[0] && put.data[0].updated_at);

  console.log('\n4) A lê de volta');
  const get1 = await req(BASE + '/rest/v1/finance_state?select=data,updated_at&user_id=eq.' + u1, {
    headers: jsonHeaders({ Authorization: 'Bearer ' + s1.access_token })
  });
  ok('A vê 1 linha', get1.status === 200 && get1.data.length === 1, get1.status + ' ' + JSON.stringify(get1.data).slice(0, 160));
  ok('os 3 registros chegaram inteiros', get1.data[0].data.txs.length === 3);
  ok('o fixo chegou junto', get1.data[0].data.recurring.length === 1);

  console.log('\n5) RLS: B não pode ver nem sobrescrever a linha de A');
  const get2 = await req(BASE + '/rest/v1/finance_state?select=user_id', {
    headers: jsonHeaders({ Authorization: 'Bearer ' + s2.access_token })
  });
  ok('B enxerga 0 linhas', get2.status === 200 && get2.data.length === 0, get2.status + ' ' + JSON.stringify(get2.data).slice(0, 160));

  const roubo = await req(BASE + '/rest/v1/finance_state', {
    method: 'POST',
    headers: jsonHeaders({ Authorization: 'Bearer ' + s2.access_token, Prefer: 'resolution=merge-duplicates' }),
    body: JSON.stringify({ user_id: u1, data: { v: 2, txs: [] }, app_version: 2 })
  });
  ok('B não consegue gravar como A (bloqueado)', !roubo.ok, roubo.status + ' ' + roubo.text.slice(0, 140));

  console.log('\n6) sem login não passa');
  const semLogin = await req(BASE + '/rest/v1/finance_state?select=user_id', { headers: { apikey: ANON } });
  ok('anon recebe 401', semLogin.status === 401, semLogin.status + ' ' + semLogin.text.slice(0, 120));

  console.log('\n7) atualizar muda o updated_at (trigger)');
  await new Promise((r) => setTimeout(r, 1200));
  const upd = await req(BASE + '/rest/v1/finance_state', {
    method: 'POST',
    headers: jsonHeaders({ Authorization: 'Bearer ' + s1.access_token, Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify({ user_id: u1, data: amostra, app_version: 2 })
  });
  const antes = put.data[0].updated_at;
  const depois = upd.data && upd.data[0] && upd.data[0].updated_at;
  ok('updated_at andou', !!depois && depois !== antes, antes + ' → ' + depois);
  ok('continua com 1 linha só (upsert)', (await sql('select user_id from public.finance_state')).length === 1);

  console.log('\n' + (fails ? fails + ' FALHA(S) de ' + checks : checks + '/' + checks + ' verificações passaram'));
  console.log('contas de teste: ' + U1 + ' / ' + U2 + ' (senha ' + PASS + ')');
  if (fails) process.exit(1);
}

main().catch((e) => {
  console.error('explodiu: ' + ((e && e.message) || e));
  process.exit(1);
});
