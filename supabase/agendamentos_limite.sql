-- =============================================================================
-- agendamentos_limite.sql  —  FONTE ÚNICA da segurança do agendamento no banco
-- =============================================================================
-- Este arquivo é o ÚNICO SQL de configuração do servidor. Ele junta, num só
-- lugar, tudo o que antes estava espalhado/divergente em dois arquivos:
--
--   * Limite de vagas ATÔMICO por turno  (trigger)   -> mata race condition + bypass do front
--   * Filtro de status                                -> cancelado/remarcado/no_show liberam a vaga
--   * HINT = 'LIMITE_VAGAS' no erro                   -> a Edge Function distingue "lotou" de erro genérico
--   * RLS selando a tabela `agendamentos`             -> esconde PII e bloqueia INSERT direto da anon key
--   * View pública `vagas_ocupadas` SEM PII           -> o site lê disponibilidade só por aqui
--
-- Como aplicar: cole este arquivo INTEIRO no SQL Editor do Supabase e rode.
-- Idempotente: pode rodar de novo sem quebrar.
--
-- Colunas assumidas: agendamentos(unidade text, dia date, horario text 'HH:MM',
-- status text). Se algum nome divergir na sua tabela, ajuste ANTES de rodar.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0) Limpa versões ANTIGAS/divergentes (de implementações anteriores)
-- -----------------------------------------------------------------------------
-- Garante que não fique um trigger/função desatualizado convivendo com o atual.
drop trigger  if exists trg_limite_agendamento     on public.agendamentos;
drop function if exists public.enforce_limite_agendamento();
drop function if exists public.turno_do_horario(text);


-- -----------------------------------------------------------------------------
-- 1) Coluna de status (soft delete: cancelar = mudar status, nunca DELETE)
-- -----------------------------------------------------------------------------
alter table public.agendamentos
  add column if not exists status text not null default 'agendado';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'agendamentos_status_check'
  ) then
    alter table public.agendamentos
      add constraint agendamentos_status_check
      check (status in ('agendado','confirmado','cancelado','remarcado','concluido','no_show'));
  end if;
end $$;


-- -----------------------------------------------------------------------------
-- 2) Índice usado pelo trigger o tempo todo (filtro por unidade + dia)
-- -----------------------------------------------------------------------------
create index if not exists idx_agendamentos_unidade_dia
  on public.agendamentos (unidade, dia);


-- -----------------------------------------------------------------------------
-- 3) Função de validação ATÔMICA do limite de turno
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER: roda como dono -> a contagem enxerga TODAS as linhas mesmo
--   com o RLS ligado (sem isso o count veria 0 e o limite nunca bloquearia).
-- SET search_path = '': trava o caminho contra escalada de privilégio.
create or replace function public.check_limite_vagas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total_minutes integer;
  v_turno text;
  v_limit integer;
  v_current_count integer;
begin
  -- Turno a partir do horário 'HH:MM'  (<= 12:00 = manhã, senão tarde)
  v_total_minutes := split_part(NEW.horario, ':', 1)::integer * 60
                   + split_part(NEW.horario, ':', 2)::integer;

  if v_total_minutes <= 720 then
    v_turno := 'manha';
    v_limit := 3;
  else
    v_turno := 'tarde';
    v_limit := 5;
  end if;

  -- BLOQUEIO ATÔMICO: trava o "conceito" unidade+dia+turno (não uma linha),
  -- então funciona mesmo com o turno vazio. Duas inserções simultâneas da mesma
  -- vaga viram fila aqui. Liberado sozinho no fim da transação.
  perform pg_advisory_xact_lock(
    hashtext(NEW.unidade || '|' || NEW.dia::text || '|' || v_turno)
  );

  -- Conta SOMENTE vagas ativas (cancelado/remarcado/no_show liberam a vaga)
  select count(*) into v_current_count
  from public.agendamentos
  where unidade = NEW.unidade
    and dia     = NEW.dia
    and status in ('agendado','confirmado')
    and case
          when v_turno = 'manha'
            then (split_part(horario, ':', 1)::integer * 60 + split_part(horario, ':', 2)::integer) <= 720
          else (split_part(horario, ':', 1)::integer * 60 + split_part(horario, ':', 2)::integer) >  720
        end;

  if v_current_count >= v_limit then
    raise exception
      'Limite de vagas atingido para o turno da % no dia %. Máximo de % vagas nesta unidade.',
      case when v_turno = 'manha' then 'manhã' else 'tarde' end,
      to_char(NEW.dia, 'DD/MM/YYYY'),
      v_limit
      using errcode = 'P0001', hint = 'LIMITE_VAGAS';
      -- HINT viaja até o supabase-js como error.hint -> a Edge Function
      -- distingue "lotou" de "erro genérico" sem depender do texto.
  end if;

  return NEW;
end;
$$;


-- -----------------------------------------------------------------------------
-- 4) Trigger BEFORE INSERT
-- -----------------------------------------------------------------------------
drop trigger if exists trigger_check_limite_vagas on public.agendamentos;
create trigger trigger_check_limite_vagas
  before insert on public.agendamentos
  for each row
  execute function public.check_limite_vagas();


-- -----------------------------------------------------------------------------
-- 5) RLS: sela a tabela `agendamentos` (esconde PII + bloqueia escrita direta)
-- -----------------------------------------------------------------------------
-- Sem nenhuma policy para anon/authenticated => SELECT e INSERT diretos ficam
-- bloqueados para a chave pública. A service_role (Edge Function) e a dona
-- postgres (trigger/view) seguem isentas (não usamos FORCE ROW LEVEL SECURITY).
alter table public.agendamentos enable row level security;

revoke insert on public.agendamentos from anon, authenticated;
drop policy if exists "anon insere agendamento" on public.agendamentos;


-- -----------------------------------------------------------------------------
-- 6) View pública SEM PII: o site lê disponibilidade só por aqui
-- -----------------------------------------------------------------------------
-- Expõe apenas unidade/dia/horario (zero dado pessoal) e SÓ das vagas ativas,
-- para o contador do site bater com o que o trigger realmente bloqueia.
drop view if exists public.vagas_ocupadas;
create view public.vagas_ocupadas as
  select unidade, dia, horario
  from public.agendamentos
  where status in ('agendado','confirmado');

grant select on public.vagas_ocupadas to anon, authenticated;


-- =============================================================================
-- DEPOIS DE RODAR:
--   1. Supabase -> Advisors -> Database Linter (não deve sobrar
--      "Function Search Path Mutable" em check_limite_vagas).
--   2. Teste de concorrência: 2 inserções da última vaga ao mesmo tempo ->
--      só uma passa; a outra recebe o erro com HINT = 'LIMITE_VAGAS'.
-- =============================================================================
