/* Roda o supabase/schema.sql no projeto via Management API do Supabase.
   É o único caminho daqui: a chave publishable só mexe em dados (PostgREST),
   e o banco direto (db.thclnvlqrdlhnwwpnguf.supabase.co:5432) é IPv6-only,
   então não dá pra conectar com psql desta máquina.

   Uso (PowerShell):
     $env:SUPABASE_ACCESS_TOKEN = 'sbp_...'
     node tools/run-schema.js

   O token é o "Personal Access Token" da conta (Dashboard → avatar →
   Access Tokens). Ele não entra no app e pode ser revogado depois.
*/

const fs = require('fs');
const path = require('path');

const REF = 'thclnvlqrdlhnwwpnguf';
const ANON = 'sb_publishable_pMRt5831Z1sY443DYnoiJQ_turTVtwW';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';

async function main() {
  if (!TOKEN) {
    console.error('Falta o token. Rode assim:\n' +
      "  $env:SUPABASE_ACCESS_TOKEN = 'sbp_...'\n" +
      '  node tools/run-schema.js');
    process.exit(2);
  }

  const file = path.join(__dirname, '..', 'supabase', 'schema.sql');
  const sql = fs.readFileSync(file, 'utf8');
  console.log('rodando ' + file + ' (' + sql.split('\n').length + ' linhas)...');

  const res = await fetch('https://api.supabase.com/v1/projects/' + REF + '/database/query', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
  });

  const text = await res.text();
  if (!res.ok) {
    console.error('falhou (' + res.status + '): ' + text.slice(0, 400));
    process.exit(1);
  }
  console.log('ok: ' + text.slice(0, 200));

  /* conferência 1: a tabela existe e o anon NÃO tem acesso (RLS/grants) */
  const rest = await fetch('https://' + REF + '.supabase.co/rest/v1/finance_state?select=user_id&limit=1', {
    headers: { apikey: ANON }
  });
  const body = await rest.text();
  console.log('REST sem login: ' + rest.status + ' ' + body.slice(0, 200));
  if (rest.status === 404) {
    console.error('a tabela ainda não aparece no schema cache — espera alguns segundos e olha de novo');
    process.exit(1);
  }
  if (rest.status === 200) {
    console.error('ATENÇÃO: o anon conseguiu ler a tabela. Confere se a RLS ficou ligada.');
    process.exit(1);
  }
  console.log('tudo certo: tabela criada e fechada pro anon.');
}

main().catch((e) => {
  console.error('explodiu:', (e && e.message) || e);
  process.exit(1);
});
