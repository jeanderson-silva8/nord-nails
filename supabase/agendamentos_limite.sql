-- =============================================================================
-- Segurança do agendamento NO SERVIDOR (Postgres / Supabase)
-- =============================================================================
-- Fecha três buracos da implementação que validava tudo no navegador:
--
--   Buraco 1 (race condition): duas clientes confirmam ao mesmo tempo, ambas
--   leem "2 ocupadas / limite 3" e ambas inserem -> estoura para 4.
--
--   Buraco 2 (bypass do front): a regra do limite só existia no JS. Com a anon
--   key (pública), dava para inserir direto via curl/Postman sem passar pela tela.
--
--   Buraco 3 (vazamento de PII): com a anon key, qualquer um fazia SELECT * em
--   `agendamentos` e lia NOME e TELEFONE de todas as clientes.
--
-- Como aplicar: cole este arquivo INTEIRO no SQL Editor do Supabase e rode.
-- Idempotente: pode rodar de novo sem quebrar.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Regra de turno (mesma do front: <= 12:00 = manhã, senão tarde)
-- -----------------------------------------------------------------------------
create or replace function public.turno_do_horario(horario text)
returns text
language sql
immutable
as $$
  select case when horario::time <= time '12:00' then 'manha' else 'tarde' end;
$$;

-- -----------------------------------------------------------------------------
-- 2) Trigger atômico: conta-e-valida o limite ANTES de gravar (buracos 1 e 2)
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER é OBRIGATÓRIO: a função roda como dona da tabela, então o
-- count(*) abaixo enxerga TODAS as linhas mesmo com o RLS selando a leitura
-- para a anon key. Sem isso, depois de ligar o RLS o count veria 0 e o limite
-- nunca bloquearia.
create or replace function public.enforce_limite_agendamento()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_turno  text;
  v_limite int;
  v_count  int;
begin
  v_turno  := public.turno_do_horario(NEW.horario);
  v_limite := case when v_turno = 'manha' then 3 else 5 end;

  -- Serializa concorrentes da MESMA (unidade, dia, turno): duas inserções
  -- simultâneas na mesma vaga não rodam em paralelo, então a contagem enxerga
  -- sempre o estado real. Lock por transação, liberado no commit/rollback.
  perform pg_advisory_xact_lock(
    hashtext(NEW.unidade || '|' || NEW.dia::text || '|' || v_turno)
  );

  select count(*) into v_count
  from public.agendamentos
  where unidade = NEW.unidade
    and dia     = NEW.dia
    and public.turno_do_horario(horario) = v_turno;

  if v_count >= v_limite then
    raise exception 'LIMITE_TURNO_ATINGIDO: turno % cheio (%/%)', v_turno, v_count, v_limite
      using errcode = 'P0001';
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_limite_agendamento on public.agendamentos;
create trigger trg_limite_agendamento
before insert on public.agendamentos
for each row execute function public.enforce_limite_agendamento();

-- -----------------------------------------------------------------------------
-- 3) RLS: sela a tabela `agendamentos` (buracos 3 e 4)
-- -----------------------------------------------------------------------------
-- Buraco 3 (PII): com RLS ligado e SEM policy de SELECT para a anon key,
--   ninguém lê a tabela -> nome/telefone ficam invisíveis.
-- Buraco 4 (spam/booking-DoS): a anon key também NÃO recebe mais INSERT direto.
--   A única forma de gravar é pela Edge Function `criar-agendamento`, que usa a
--   service_role (isenta de RLS) e só insere depois de validar o CAPTCHA. Assim
--   um bot não consegue mais encher a agenda com lixo via curl/Postman.
--
-- Resumo: a anon key fica SEM nenhuma policy -> sem SELECT, sem INSERT direto.
-- A service_role (Edge Function) e a dona postgres (trigger/view) seguem isentas
-- porque NÃO usamos FORCE ROW LEVEL SECURITY.
alter table public.agendamentos enable row level security;

-- Remove qualquer brecha de escrita direta da anon key (de versões anteriores).
revoke insert on public.agendamentos from anon, authenticated;
drop policy if exists "anon insere agendamento" on public.agendamentos;

-- (Sem nenhuma policy para anon/authenticated => leitura e escrita diretas
--  ficam totalmente bloqueadas para a chave pública.)

-- -----------------------------------------------------------------------------
-- 4) View pública SEM PII: o site lê disponibilidade só por aqui
-- -----------------------------------------------------------------------------
-- A view expõe apenas unidade/dia/horario (zero dado pessoal). Por ser uma view
-- comum (security definer, padrão do Postgres), ela roda como a dona e enxerga
-- as linhas por cima do RLS — então a anon key lê disponibilidade pela view sem
-- nunca tocar a tabela crua.
drop view if exists public.vagas_ocupadas;
create view public.vagas_ocupadas as
  select unidade, dia, horario
  from public.agendamentos;

grant select on public.vagas_ocupadas to anon, authenticated;

-- =============================================================================
-- Resultado para a anon key (chave pública no navegador):
--   * INSERT direto em agendamentos:           BLOQUEADO (só a Edge Function grava).
--   * SELECT em agendamentos (nome/telefone):  BLOQUEADO.
--   * SELECT em vagas_ocupadas (sem PII):       liberado (o site lê disponibilidade).
--
-- A escrita acontece só via Edge Function `criar-agendamento` (service_role),
-- depois de validar o CAPTCHA; e o trigger ainda garante o limite atômico.
-- =============================================================================
