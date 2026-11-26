-- ============================================================
--  Finanças da Dayanne · Supabase
--  Cole TUDO no SQL Editor do projeto e clique em "Run".
--  Projeto: thclnvlqrdlhnwwpnguf
-- ============================================================
--
--  O app é local-first: o localStorage continua sendo a fonte
--  de verdade no aparelho. Esta tabela é a cópia na nuvem, uma
--  linha por usuário, com o mesmo objeto que o app já salva.
--  Assim dá pra abrir no celular e no computador e ter a mesma
--  coisa, e recuperar tudo se trocar de iPhone.
--

create table if not exists public.finance_state (
  user_id     uuid        primary key references auth.users (id) on delete cascade,
  data        jsonb       not null default '{}'::jsonb,
  app_version int         not null default 1,
  device      text,
  updated_at  timestamptz not null default now()
);

comment on table  public.finance_state is 'Estado do app por usuário (registros, fixos, categorias, ajustes)';
comment on column public.finance_state.data is 'Mesmo objeto do localStorage, menos as cotações de câmbio';

-- ------------------------------------------------------------
--  RLS: cada usuário só enxerga a própria linha.
--  Sem isso, a chave anon (que é pública, vai no app) daria
--  acesso ao banco inteiro pra qualquer pessoa.
-- ------------------------------------------------------------
alter table public.finance_state enable row level security;
alter table public.finance_state force  row level security;

drop policy if exists "own row select" on public.finance_state;
drop policy if exists "own row insert" on public.finance_state;
drop policy if exists "own row update" on public.finance_state;
drop policy if exists "own row delete" on public.finance_state;

create policy "own row select" on public.finance_state
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "own row insert" on public.finance_state
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "own row update" on public.finance_state
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own row delete" on public.finance_state
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- a API só conversa com quem está logado
revoke all on public.finance_state from anon;
grant select, insert, update, delete on public.finance_state to authenticated;

-- ------------------------------------------------------------
--  updated_at sempre vem do relógio do servidor
-- ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_finance_state_touch on public.finance_state;
create trigger trg_finance_state_touch
  before update on public.finance_state
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
--  Conferência rápida (deve voltar rowsecurity = true)
-- ------------------------------------------------------------
select tablename, rowsecurity
  from pg_tables
 where schemaname = 'public' and tablename = 'finance_state';
