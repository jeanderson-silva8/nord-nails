# Runbook — Implementação do Limite Seguro de Agendamento

> **Como usar este runbook:** percorra as fases na ordem. Em cada 🔵 **CHECKPOINT**,
> responda mentalmente sim ou não.
> - ✅ **SIM** → está certo, siga pro próximo.
> - ❌ **NÃO** → a solução completa está logo abaixo, pronta pra aplicar.
>
> A ordem importa. Pular etapa ou inverter a Fase 2 pode derrubar o site.

---

## FASE 0 — Pré-requisitos

Colunas confirmadas por você: `unidade` (text), `dia` (date), `horario` (text). ✅
Pode seguir sem ajustar nomes no script.

---

## FASE 1 — A lei do cofre (banco de dados)

Esta fase **não quebra nada** do que já existe. Só adiciona a trava. Pode rodar com confiança.

### 🔵 CHECKPOINT 1.1 — Você já rodou o `agendamentos_limite.sql`?

**❌ SE NÃO:** abra o SQL Editor do Supabase, cole o conteúdo do arquivo e rode. Ele cria a coluna `status`, a constraint, o índice, a função `check_limite_vagas` (com `SECURITY DEFINER` + `search_path` travado) e o trigger `BEFORE INSERT`. É idempotente — pode rodar de novo sem medo.

### 🔵 CHECKPOINT 1.2 — A view `vagas_ocupadas` filtra só os status ativos?

A view que o site lê pra mostrar disponibilidade precisa **ignorar cancelados** — senão o site mostra "lotado" num turno que tem gente que cancelou.

**❌ SE NÃO:**
```sql
CREATE OR REPLACE VIEW public.vagas_ocupadas AS
SELECT unidade, dia, horario
FROM public.agendamentos
WHERE status IN ('agendado', 'confirmado');
```
(Tirei o `id` de propósito: a view de disponibilidade não precisa dele, e menos exposição é melhor. Se teu front usa o id daqui, recoloca.)

### 🔵 CHECKPOINT 1.3 — O `anon` consegue LER a view? (a armadilha silenciosa)

Esse é o bug que faz o limite "sumir" do site sem dar erro nenhum. Em Postgres 15+, se a view foi criada com `security_invoker = true`, ela lê a tabela como o `anon` — que (com RLS ligado) não enxerga nada — e a view volta **vazia**. O site então acha que tudo está livre, sempre.

Teste rápido: no SQL Editor, rode como `anon` ou simplesmente confirme no app que a disponibilidade aparece.

**❌ SE NÃO (view volta vazia / disponibilidade sumiu):**
```sql
-- garante que o anon pode ler a view
GRANT SELECT ON public.vagas_ocupadas TO anon;

-- garante que a view lê a tabela com privilégio do dono (não do anon),
-- expondo só as 3 colunas não-sensíveis — sem vazar nome/telefone
ALTER VIEW public.vagas_ocupadas SET (security_invoker = false);
```

### ✅ VERIFICAÇÃO DA FASE 1
Supabase → **Advisors → Database Linter**: o aviso **"Function Search Path Mutable"** na `check_limite_vagas` deve ter sumido.

---

## FASE 2 — Fechar a porta dos fundos (Edge Function + RLS)

> ⚠️ **ORDEM CRÍTICA — leia antes de tocar em qualquer coisa.**
> A sequência é: **função no ar → site chamando ela → testar → SÓ ENTÃO revogar o anon.**
> Se você revogar o anon antes do site estar 100% na função, **todo agendamento quebra na hora.**

### 🔵 CHECKPOINT 2.1 — A Edge Function `criar-agendamento` está no ar e respondendo?

**❌ SE NÃO:** crie `supabase/functions/criar-agendamento/index.ts` com o código abaixo. Ele já faz tudo: valida campos no servidor, normaliza o telefone pra E.164, verifica o captcha, insere com a `service_role` e traduz o erro do trigger.

```ts
import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*', // troque pelo teu domínio em produção
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Telefone BR -> E.164 (55 + DDD + número). Retorna null se inválido.
function normalizarTelefone(raw: string): string | null {
  let n = (raw || '').replace(/\D/g, '')         // só dígitos
  if (!n.startsWith('55')) n = '55' + n
  if (!/^55\d{2}9?\d{8}$/.test(n)) return null    // 55 + DDD(2) + (9?) + 8 dígitos
  return n
}

async function captchaOk(token: string, ip: string): Promise<boolean> {
  const form = new FormData()
  form.append('secret', Deno.env.get('TURNSTILE_SECRET_KEY')!)
  form.append('response', token)
  if (ip) form.append('remoteip', ip)
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',
    { method: 'POST', body: form })
  return (await r.json()).success === true
}

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj),
    { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { unidade, nome, telefone, dia, horario, captchaToken } = await req.json()

    // 1. Obrigatórios
    if (!unidade || !nome || !telefone || !dia || !horario || !captchaToken)
      return json({ ok: false, error: 'CAMPOS', message: 'Preencha todos os campos.' })

    // 2. Anti-robô
    const ip = req.headers.get('CF-Connecting-IP') || req.headers.get('x-forwarded-for') || ''
    if (!(await captchaOk(captchaToken, ip)))
      return json({ ok: false, error: 'CAPTCHA', message: 'Verificação anti-robô falhou.' })

    // 3. Nome
    const nomeLimpo = String(nome).trim()
    if (nomeLimpo.length < 2 || nomeLimpo.length > 100)
      return json({ ok: false, error: 'NOME', message: 'Nome inválido.' })

    // 4. Telefone -> E.164
    const tel = normalizarTelefone(telefone)
    if (!tel) return json({ ok: false, error: 'TELEFONE', message: 'Telefone inválido.' })

    // 5. Data não pode ser no passado
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
    if (new Date(dia + 'T00:00:00') < hoje)
      return json({ ok: false, error: 'DATA', message: 'Escolha uma data futura.' })

    // 6. Insere com service_role (passa pelo trigger de limite)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { data, error } = await supabase
      .from('agendamentos')
      .insert({ unidade, nome: nomeLimpo, telefone: tel, dia, horario })
      .select('id').single()

    // 7. Trigger barrou por lotação?
    if (error) {
      if (error.hint === 'LIMITE_VAGAS' || (error.message || '').includes('Limite de vagas'))
        return json({ ok: false, error: 'LIMITE_VAGAS', message: error.message })
      return json({ ok: false, error: 'ERRO', message: 'Não foi possível agendar.' }, 500)
    }

    return json({ ok: true, id: data.id })
  } catch (_e) {
    return json({ ok: false, error: 'ERRO', message: 'Erro interno.' }, 500)
  }
})
```

**Deploy + segredos:**
```bash
# SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já são injetados automaticamente.
# Você só precisa setar o segredo do captcha:
supabase secrets set TURNSTILE_SECRET_KEY=xxxxxxxx

# Deploy. O --no-verify-jwt deixa o site público chamar sem login.
# (O controle de acesso aqui é o captcha + a validação, não o JWT.)
supabase functions deploy criar-agendamento --no-verify-jwt
```

> **Convenção do código acima:** ela responde **200** com `{ ok: true }` no sucesso e `{ ok: false, error, message }` nos erros esperados (campo, captcha, limite). Isso deixa o tratamento no front simples — você lê `data.ok` direto, sem ter que cavar `error.context`. Só erro inesperado volta 500.

### 🔵 CHECKPOINT 2.2 — A função valida nome/telefone/data **no servidor** e normaliza o telefone pra E.164?

Se a tua função já existia mas só inseria (confiando no que veio do front), ela está incompleta — e o telefone vai sair fora do padrão que a Cloud API do WhatsApp exige.

**❌ SE NÃO:** use o código do Checkpoint 2.1 — a validação e o `normalizarTelefone` já estão lá. O telefone E.164 (`55` + DDD + número) é **pré-requisito** da fase do WhatsApp; resolver agora é de graça.

### 🔵 CHECKPOINT 2.3 — A função verifica o CAPTCHA (Turnstile)?

**❌ SE NÃO:**
1. Crie um widget no Cloudflare Turnstile (grátis) → você recebe um **site key** (front) e um **secret key** (função).
2. `supabase secrets set TURNSTILE_SECRET_KEY=<secret>`
3. A verificação já está no código do 2.1 (`captchaOk`).
4. No front, renderize o widget com o **site key** e mande o token gerado no corpo como `captchaToken` (próximo checkpoint).

### 🔵 CHECKPOINT 2.4 — O site **em produção** chama `supabase.functions.invoke('criar-agendamento')` e NÃO o insert direto?

Confirme no código que **subiu** (não no seu local).

**❌ SE NÃO:** troque a lógica do `handleSubmit` no `AgendarModal.tsx`:
```tsx
const handleSubmit = async () => {
  if (!captchaToken) { setErro('Confirme que você não é um robô.'); return }
  setEnviando(true); setErro(null)

  const { data, error } = await supabase.functions.invoke('criar-agendamento', {
    body: { unidade, nome, telefone, dia, horario, captchaToken },
  })
  setEnviando(false)
  resetCaptcha() // o token é de uso único; reseta sempre após a tentativa

  if (error) {                      // falha de rede / 500
    setErro('Não foi possível agendar agora. Tente novamente.')
    return
  }
  if (!data.ok) {                   // erro de negócio (limite, validação, captcha)
    if (data.error === 'LIMITE_VAGAS')
      setErro('Esse turno já está lotado. Escolha outro horário ou dia.')
    else
      setErro(data.message || 'Confira os dados e tente de novo.')
    return
  }
  mostrarTelaSucesso(data.id)       // sucesso
}
```

### 🔵 CHECKPOINT 2.5 — O `handleSubmit` distingue "lotou" de erro genérico e reseta o captcha?

**❌ SE NÃO:** está resolvido no trecho do 2.4 — o `data.error === 'LIMITE_VAGAS'` mostra a mensagem certa, e o `resetCaptcha()` roda após toda tentativa (o token Turnstile é de uso único; sem reset, a 2ª tentativa falha sempre).

### 🔵 CHECKPOINT 2.6 — [SÓ DEPOIS DOS 4 ACIMA ✅] O RLS está ligado e o `anon` não escreve/lê a tabela direto?

> Só execute este passo depois de ter feito **um agendamento real, ponta a ponta, pela Edge Function, com sucesso.** Esta é a etapa que fecha a porta — se a função não estiver 100%, você tranca a si mesmo do lado de fora.

**❌ SE NÃO:**
```sql
-- 1. Liga o RLS na tabela
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- 2. Remove qualquer acesso direto do anon à TABELA física
REVOKE INSERT, SELECT, UPDATE, DELETE ON public.agendamentos FROM anon;

-- 3. NÃO crie policy de insert/select pro anon na tabela.
--    Resultado: anon não escreve nem lê a tabela direto.
--    Escrita = só pela Edge Function (service_role, que bypassa RLS).
--    Leitura de disponibilidade = só pela view vagas_ocupadas (Fase 1.3).
```

---

## FASE 3 — Soft delete e remarcação

### Regra de cancelamento (vale pra toda funcionalidade futura)
Cancelar = **`UPDATE status = 'cancelado'`**, nunca `DELETE`. A vaga libera sozinha (a contagem do trigger e a view só olham status ativos) e você não perde o histórico.

### 🔵 CHECKPOINT 3.1 — Você já decidiu como a remarcação vai funcionar?

Atenção: o trigger é `BEFORE INSERT`. Se a remarcação for um `UPDATE` do dia/horário na mesma linha, **ela escapa da validação de limite** — dá pra remarcar pra um turno lotado.

**❌ SE NÃO DECIDIU / SE FOR UPDATE:** faça a remarcação como **cancela + cria**:
```
1. UPDATE status = 'remarcado' no agendamento antigo
2. INSERT um novo agendamento com o novo dia/horário
   (o INSERT passa pelo trigger e revalida o limite do novo turno)
```
Assim a remarcação respeita a capacidade igual a um agendamento novo, e você mantém o rastro do que mudou.

---

## FASE 4 — Provar que fechou (tentando quebrar você mesmo)

Verificação não é "rodou sem erro". É **atacar o próprio sistema** e confirmar que ele resiste.

### Teste 1 — Fluxo normal
Agende num turno com vaga. Deve entrar e mostrar a tela de sucesso.

### Teste 2 — Cancelado não ocupa vaga
```sql
insert into agendamentos (unidade,nome,telefone,dia,horario,status)
values ('SUA_UNIDADE','Cancelada Teste','5511988887777','2026-07-21','09:00','cancelado');

select * from vagas_ocupadas where dia='2026-07-21' and unidade='SUA_UNIDADE';
-- ESPERADO: 0 linhas (o cancelado não aparece como vaga ocupada)
```

### 🔵 CHECKPOINT 4.1 — Você tem como testar concorrência REAL (paralela)?

Duas abas na mão **não testam concorrência** — você nunca clica no mesmo milissegundo, então uma sempre vai antes da outra e o teste passa mesmo sem o lock (falso positivo).

**❌ SE NÃO:** rode este script, que dispara N inserções no mesmo turno **ao mesmo tempo**, direto no banco (testando o trigger puro). Pegue a connection string em Settings → Database.
```js
// stress-concorrencia.mjs
// deno run --allow-net --allow-env stress-concorrencia.mjs
import postgres from 'https://deno.land/x/postgresjs/mod.js'
const sql = postgres(Deno.env.get('DB_URL'))   // connection string do Supabase

const unidade = 'SUA_UNIDADE', dia = '2026-07-15', horario = '09:00' // manhã, limite 3
const N = 10

await sql`delete from agendamentos where unidade=${unidade} and dia=${dia}` // limpa

const tentativas = Array.from({ length: N }, (_, i) =>
  sql`insert into agendamentos (unidade,nome,telefone,dia,horario)
      values (${unidade}, ${'Teste ' + i}, ${'5511999990' + i}, ${dia}, ${horario})`
    .then(() => 'ok')
    .catch((e) => String(e.message).includes('Limite de vagas') ? 'limite' : 'erro')
)

const r = await Promise.all(tentativas)
const ok = r.filter(x => x === 'ok').length
console.log(`Entraram: ${ok} | Barrados: ${r.filter(x => x === 'limite').length} / ${N}`)
console.log(ok === 3 ? '✅ PASSOU: exatamente 3 entraram' : `❌ FALHOU: entraram ${ok} (esperado 3)`)
await sql.end()
```
Tem que entrar **exatamente 3**. Se entrar 4+, o lock não está funcionando. (Esse print é ouro pro teu laudo.)

### 🔵 CHECKPOINT 4.2 — Você já testou o bypass pela `anon`?

Esse teste prova que a porta dos fundos fechou. É metade do motivo de toda a Fase 2.

**❌ SE NÃO:**
```js
// bypass-test.mjs — tenta inserir DIRETO pela anon, pulando a Edge Function
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://SEU_PROJETO.supabase.co', 'SUA_ANON_KEY')

const { error } = await supabase.from('agendamentos').insert({
  unidade: 'SUA_UNIDADE', nome: 'Invasor', telefone: '5511999999999',
  dia: '2026-07-20', horario: '10:00',
})
console.log(error
  ? '✅ PASSOU: anon foi barrado → ' + error.message
  : '❌ FALHOU: anon inseriu direto! A porta dos fundos ainda está aberta.')
```
O esperado é o anon ser **barrado**. Se ele inserir, volte ao Checkpoint 2.6.

### Teste 5 — Linter limpo
Advisors → Database Linter: zero alertas críticos na `check_limite_vagas`.

---

## TL;DR — Ordem de execução
1. **Fase 1:** roda o SQL → corrige a view → confirma que o anon lê a view → linter limpo.
2. **Fase 2 (ordem sagrada):** função no ar → site chamando ela → 1 agendamento real OK → **só então** revoga o anon.
3. **Fase 3:** cancelar = status; remarcar = cancela + cria.
4. **Fase 4:** prova com os 5 testes — principalmente concorrência real e bypass.

Quando os 5 testes passam, o limite não é mais promessa da tela. É lei do cofre — e você provou, tentando quebrar.
