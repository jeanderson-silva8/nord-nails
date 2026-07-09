-- BLOQUEIO DE DIAS (feriado / imprevisto) — fundação de banco
-- =====================================================================
-- "Bloquear o dia" é DIFERENTE de "cancelar agendamento":
--   * cancelar  -> a vaga LIBERA (a cliente saiu, o horário volta).
--   * bloquear  -> a vaga FECHA (o salão não abre; ninguém pode entrar).
--
-- Este arquivo implementa a FUNDAÇÃO: a tabela, a proteção e a checagem
-- no trigger. O que DISPARA MENSAGEM pras clientes já agendadas naquele
-- dia (avisar + recomendar remarcação) fica na Edge Function `bloquear-dia`,
-- construída na fase da Opção C — porque envolve a API do WhatsApp.
--
-- Idempotente: pode rodar de novo sem quebrar.
-- =====================================================================

-- 1. Tabela de dias bloqueados -----------------------------------------
create table if not exists public.dias_bloqueados (
  id            bigint generated always as identity primary key,
  unidade       text not null,
  dia           date not null,
  motivo        text,                    -- por que fechou (feriado, imprevisto) -> vira histórico
  bloqueado_por text,                    -- email do atendente que bloqueou
  created_at    timestamptz default now(),
  unique (unidade, dia)                  -- não bloqueia o mesmo dia/unidade duas vezes
);

-- 2. Índice (o trigger consulta por unidade+dia a cada agendamento) ----
create index if not exists idx_dias_bloqueados_unidade_dia
  on public.dias_bloqueados (unidade, dia);

-- 3. RLS: só atendente autenticado gerencia; anon nunca toca direto ----
alter table public.dias_bloqueados enable row level security;

drop policy if exists "atendente le bloqueios"     on public.dias_bloqueados;
drop policy if exists "atendente cria bloqueios"   on public.dias_bloqueados;
drop policy if exists "atendente remove bloqueios" on public.dias_bloqueados;

create policy "atendente le bloqueios"     on public.dias_bloqueados for select to authenticated using (true);
create policy "atendente cria bloqueios"   on public.dias_bloqueados for insert to authenticated with check (true);
create policy "atendente remove bloqueios" on public.dias_bloqueados for delete to authenticated using (true);
-- (delete existe porque bloquear é REVERSÍVEL: imprevisto resolvido -> desbloqueia)

-- 4. View pública: o site vê só unidade/dia bloqueado (esconde o motivo interno)
drop view if exists public.dias_indisponiveis;
create view public.dias_indisponiveis as
  select unidade, dia from public.dias_bloqueados;
grant select on public.dias_indisponiveis to anon, authenticated;

-- 5. Trigger de limite updated: recusa agendamento em dia bloqueado --
--    (mesma função check_limite_vagas de sempre, com a checagem no topo)
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
  -- 0. DIA BLOQUEADO? -> recusa antes de qualquer coisa
  if exists (
    select 1 from public.dias_bloqueados
    where unidade = NEW.unidade and dia = NEW.dia
  ) then
    raise exception 'Este dia está bloqueado para agendamentos nesta unidade.'
      using errcode = 'P0001', hint = 'DIA_BLOQUEADO';
  end if;

  -- 1. Identifica o turno
  v_total_minutes := split_part(NEW.horario, ':', 1)::integer * 60
                   + split_part(NEW.horario, ':', 2)::integer;
  if v_total_minutes <= 720 then
    v_turno := 'manha'; v_limit := 3;
  else
    v_turno := 'tarde'; v_limit := 5;
  end if;

  -- 2. Lock atômico (unidade+dia+turno), cobre turno vazio
  perform pg_advisory_xact_lock(
    hashtext(NEW.unidade || '|' || NEW.dia::text || '|' || v_turno)
  );

  -- 3. Conta só vagas ativas
  select count(*) into v_current_count
  from public.agendamentos
  where unidade = NEW.unidade
    and dia     = NEW.dia
    and status in ('agendado','confirmado')
    and case
          when v_turno = 'manha'
            then (split_part(horario,':',1)::int*60 + split_part(horario,':',2)::int) <= 720
          else (split_part(horario,':',1)::int*60 + split_part(horario,':',2)::int) >  720
        end;

  -- 4. Barra se o turno estourou
  if v_current_count >= v_limit then
    raise exception 'Limite de vagas atingido para o turno da % no dia %. Máximo de % vagas nesta unidade.',
      case when v_turno = 'manha' then 'manhã' else 'tarde' end,
      to_char(NEW.dia, 'DD/MM/YYYY'),
      v_limit
      using errcode = 'P0001', hint = 'LIMITE_VAGAS';
  end if;

  return NEW;
end;
$$;
