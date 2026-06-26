// =============================================================================
// Edge Function: criar-agendamento
// =============================================================================
// Único caminho de gravação de agendamentos. O navegador NÃO insere mais direto
// na tabela (o RLS bloqueia o anon). Esta função:
//   1. Verifica o CAPTCHA (Cloudflare Turnstile) no servidor  -> barra bots/spam
//   2. Revalida os dados no servidor (nome, telefone, data)    -> não confia no front
//   3. Insere com a service_role; o trigger no Postgres ainda  -> limite atômico
//      valida o limite de turno de forma atômica.
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*', // Permite o acesso a partir de qualquer origem em dev/prod
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Telefone BR -> E.164 (55 + DDD + número). Retorna null se inválido.
function normalizarTelefone(raw: string): string | null {
  let n = (raw || '').replace(/\D/g, '')         // mantém apenas dígitos
  if (!n.startsWith('55')) n = '55' + n
  if (!/^55\d{2}9?\d{8}$/.test(n)) return null    // formato 55 + DDD + (9 opcional) + 8 dígitos
  return n
}

async function captchaOk(token: string, ip: string): Promise<boolean> {
  const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')
  // Se o secret não estiver configurado, ignora a validação para evitar travamentos
  if (!turnstileSecret) {
    console.warn('TURNSTILE_SECRET_KEY não configurado no servidor. CAPTCHA ignorado.')
    return true
  }

  const form = new FormData()
  form.append('secret', turnstileSecret)
  form.append('response', token)
  if (ip) form.append('remoteip', ip)

  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form
    })
    const data = await r.json()
    return data.success === true
  } catch (err) {
    console.error('Erro ao validar CAPTCHA Turnstile:', err)
    return false
  }
}

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' }
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { unidade, nome, telefone, dia, horario, captchaToken } = await req.json()

    // 1. Campos obrigatórios
    if (!unidade || !nome || !telefone || !dia || !horario)
      return json({ ok: false, error: 'CAMPOS', message: 'Preencha todos os campos.' })

    // 2. Anti-robô (Turnstile)
    // Só exige se o site key e secret estiverem ativos
    const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')
    if (turnstileSecret) {
      if (!captchaToken) {
        return json({ ok: false, error: 'CAPTCHA', code: 'CAPTCHA_AUSENTE', message: 'Verificação anti-robô ausente.' })
      }
      const ip = req.headers.get('CF-Connecting-IP') || req.headers.get('x-forwarded-for') || ''
      if (!(await captchaOk(captchaToken, ip))) {
        return json({ ok: false, error: 'CAPTCHA', code: 'CAPTCHA_INVALIDO', message: 'Verificação anti-robô falhou.' })
      }
    }

    // 3. Validação de Nome
    const nomeLimpo = String(nome).trim()
    if (nomeLimpo.length < 2 || nomeLimpo.length > 100)
      return json({ ok: false, error: 'NOME', message: 'Nome inválido (mínimo 2 caracteres).' })

    // 4. Telefone -> Normalização E.164
    const tel = normalizarTelefone(telefone)
    if (!tel) return json({ ok: false, error: 'TELEFONE', code: 'TELEFONE_INVALIDO', message: 'Telefone inválido.' })

    // 5. Data não pode ser no passado
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    if (new Date(dia + 'T00:00:00') < hoje)
      return json({ ok: false, error: 'DATA', code: 'DATA_INVALIDA', message: 'Escolha uma data futura.' })

    // 6. Insere com a service_role (ignora RLS, dispara o trigger de limite)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { data, error } = await supabase
      .from('agendamentos')
      .insert({ unidade, nome: nomeLimpo, telefone: tel, dia, horario })
      .select('id').single()

    // 7. Trigger barrou por lotação?
    if (error) {
      if (error.hint === 'LIMITE_VAGAS' || (error.message || '').includes('Limite de vagas')) {
        return json({ 
          ok: false, 
          error: 'LIMITE_VAGAS', 
          code: 'LIMITE_TURNO_ATINGIDO', 
          message: error.message 
        })
      }
      console.error('Erro ao inserir agendamento:', error.message)
      return json({ ok: false, error: 'ERRO', message: 'Não foi possível agendar.' }, 500)
    }

    return json({ ok: true, id: data.id })
  } catch (err) {
    console.error('Erro interno na Edge Function:', err)
    return json({ ok: false, error: 'ERRO', message: 'Erro interno no servidor.' }, 500)
  }
})
