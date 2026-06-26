-- =====================================================================
-- agendamentos_limite.sql
-- Validação ATÔMICA de limite de vagas por turno.
-- Fecha: race condition (corrida pela última vaga) + bypass do front.
--
-- Correções aplicadas nesta versão:
--   1. pg_advisory_xact_lock  -> serializa até com o turno VAZIO (mata o phantom do FOR UPDATE)
--   2. filtro de status       -> cancelado/remarcado/no_show NÃO ocupam vaga
--   3. SECURITY DEFINER + SET search_path = '' + schema qualificado
--                             -> contagem enxerga tudo apesar do RLS, sem abrir escalada de privilégio
--
-- IMPORTANTE: confirme que os nomes de coluna batem com a SUA tabela.
-- Aqui assumo: agendamentos(unidade text, dia date, horario text 'HH:MM', status text).
-- Se algum nome for diferente, ajuste antes de rodar.
-- =====================================================================


-- 0. Coluna de status (soft delete: cancelar = mudar status, nunca DELETE) -------------
ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'agendado';

-- Garante que só status válidos entrem (idempotente — só cria a constraint se faltar)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agendamentos_status_check'
  ) THEN
    ALTER TABLE public.agendamentos
      ADD CONSTRAINT agendamentos_status_check
      CHECK (status IN ('agendado','confirmado','cancelado','remarcado','concluido','no_show'));
  END IF;
END $$;


-- 1. Índice que o trigger usa o tempo todo (filtro por unidade + dia) ------------------
CREATE INDEX IF NOT EXISTS idx_agendamentos_unidade_dia
  ON public.agendamentos (unidade, dia);


-- 2. Função de validação atômica ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_limite_vagas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER          -- roda como dono: a contagem enxerga TODAS as linhas mesmo com RLS ligado
SET search_path = ''      -- trava o caminho: impede que alguém "sequestre" a função (escalada de privilégio)
AS $$
DECLARE
  v_total_minutes INTEGER;
  v_turno TEXT;
  v_limit INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Identifica o turno a partir do horário 'HH:MM'
  v_total_minutes := split_part(NEW.horario, ':', 1)::INTEGER * 60
                   + split_part(NEW.horario, ':', 2)::INTEGER;

  IF v_total_minutes <= 720 THEN     -- até 12:00 -> manhã
    v_turno := 'manha';
    v_limit := 3;
  ELSE                               -- depois das 12:00 -> tarde
    v_turno := 'tarde';
    v_limit := 5;
  END IF;

  -- BLOQUEIO ATÔMICO --------------------------------------------------------------
  -- Trava o "conceito" unidade+dia+turno (não uma linha), então funciona mesmo com
  -- turno vazio — exatamente o caso onde o FOR UPDATE falhava. Duas inserções
  -- simultâneas da mesma vaga viram fila aqui. Liberado sozinho no fim da transação.
  PERFORM pg_advisory_xact_lock(
    hashtext(NEW.unidade || '|' || NEW.dia::text || '|' || v_turno)
  );

  -- Conta SOMENTE vagas ativas (cancelado/remarcado/no_show liberam a vaga) --------
  SELECT count(*) INTO v_current_count
  FROM public.agendamentos
  WHERE unidade = NEW.unidade
    AND dia     = NEW.dia
    AND status IN ('agendado','confirmado')
    AND CASE
          WHEN v_turno = 'manha'
            THEN (split_part(horario, ':', 1)::INTEGER * 60 + split_part(horario, ':', 2)::INTEGER) <= 720
          ELSE (split_part(horario, ':', 1)::INTEGER * 60 + split_part(horario, ':', 2)::INTEGER) >  720
        END;

  -- Bloqueia se o turno já estourou ------------------------------------------------
  IF v_current_count >= v_limit THEN
    RAISE EXCEPTION
      'Limite de vagas atingido para o turno da % no dia %. Máximo de % vagas nesta unidade.',
      CASE WHEN v_turno = 'manha' THEN 'manhã' ELSE 'tarde' END,
      to_char(NEW.dia, 'DD/MM/YYYY'),
      v_limit
      USING ERRCODE = 'P0001', HINT = 'LIMITE_VAGAS';
      -- HINT viaja até o supabase-js como error.hint -> o front distingue
      -- "lotou" de "erro genérico" sem depender do texto da mensagem.
  END IF;

  RETURN NEW;
END;
$$;


-- 3. Trigger BEFORE INSERT ------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_check_limite_vagas ON public.agendamentos;
CREATE TRIGGER trigger_check_limite_vagas
  BEFORE INSERT ON public.agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.check_limite_vagas();


-- =====================================================================
-- DEPOIS DE RODAR:
--   1. Supabase -> Advisors -> Database Linter  (deve sumir o aviso
--      "Function Search Path Mutable" no check_limite_vagas)
--   2. Teste de concorrência (2 abas / 2 conexões inserindo a última vaga
--      ao mesmo tempo): só uma passa, a outra recebe o erro LIMITE_VAGAS.
-- =====================================================================
