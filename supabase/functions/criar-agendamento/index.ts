// =============================================================================
// Edge Function: criar-agendamento
// =============================================================================
// Único caminho de gravação de agendamentos. O navegador NÃO insere mais direto
// na tabela (o RLS bloqueia o anon). Esta função:
//   1. Verifica o CAPTCHA (Cloudflare Turnstile) no servidor  -> barra bots/spam
//   2. Revalida os dados no servidor (nome, telefone, data)    -> não confia no front
//   3. Insere com a service_role; o trigger no Postgres ainda  -> limite atômico
//      valida o limite de turno de forma atômica.
//
// Sempre responde 200 com um corpo { ok, code? } para o cliente tratar de forma
// simples (sucesso, vaga cheia, captcha inválido, etc.).
//
// Variáveis de ambiente:
//   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  -> injetadas automaticamente
//   - TURNSTILE_SECRET_KEY                      -> definir via `supabase secrets set`
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, code: 'METHOD' }, 405);

  try {
    const { unidade, nome, telefone, dia, horario, captchaToken } =
      await req.json();

    // --- 1) Validação de entrada no SERVIDOR (não confiar no navegador) -------
    if (!unidade || !nome || !nome.trim() || !dia || !horario) {
      return json({ ok: false, code: 'DADOS_INCOMPLETOS' });
    }
    const phoneDigits = String(telefone ?? '').replace(/\D/g, '');
    if (phoneDigits.length !== 11) {
      return json({ ok: false, code: 'TELEFONE_INVALIDO' });
    }
    // Data não pode ser no passado (compara em UTC, data pura).
    const hoje = new Date();
    const hojeStr = hoje.toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || dia < hojeStr) {
      return json({ ok: false, code: 'DATA_INVALIDA' });
    }

    // --- 2) CAPTCHA (Cloudflare Turnstile) verificado no servidor ------------
    const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY');
    if (turnstileSecret) {
      if (!captchaToken) return json({ ok: false, code: 'CAPTCHA_AUSENTE' });
      const verify = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            secret: turnstileSecret,
            response: captchaToken,
            remoteip: req.headers.get('CF-Connecting-IP') ?? '',
          }),
        }
      );
      const outcome = await verify.json();
      if (!outcome.success) return json({ ok: false, code: 'CAPTCHA_INVALIDO' });
    }

    // --- 3) Insert com service_role (bypassa RLS); trigger valida o limite ---
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error } = await supabase.from('agendamentos').insert([
      {
        unidade,
        nome: nome.trim(),
        telefone: telefone.trim(),
        dia,
        horario,
      },
    ]);

    if (error) {
      if (error.message.includes('LIMITE_TURNO_ATINGIDO')) {
        return json({ ok: false, code: 'LIMITE_TURNO_ATINGIDO' });
      }
      console.error('Erro ao inserir agendamento:', error.message);
      return json({ ok: false, code: 'ERRO_INSERT' });
    }

    return json({ ok: true });
  } catch (err) {
    console.error('Erro inesperado na função:', err);
    return json({ ok: false, code: 'ERRO_INTERNO' }, 500);
  }
});
