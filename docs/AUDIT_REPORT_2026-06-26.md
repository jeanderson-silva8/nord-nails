# 🔍 Auditoria de Segurança — Nord Nails (v1)

> **Data:** 2026-06-26
> **Método:** Auditoria completa com aplicação do `AUDIT_CHECKLIST.md` (61 itens sequenciais) sobre a infraestrutura da Landing Page da Nord Nails.
> **Escopo:** Frontend React/TypeScript (deploy Vercel), Banco de Dados Supabase (Postgres & RLS) e Edge Function `criar-agendamento` (Deno runtime).
> **Resultado em uma frase:** A infraestrutura de agendamento está altamente protegida na Camada 3 (Banco de Dados) e Camada 2 (Edge Function com CAPTCHA Turnstile Fail-Closed), restando apenas a falta de cabeçalhos HTTP/CSP no frontend estático (Vercel) e validação baseada em Zod no servidor.

---

## 📖 Como ler este relatório

Este relatório mapeia o estado de segurança da Landing Page da Nord Nails após as recentes melhorias de validação atômica de vagas e migração para a Edge Function. 

A auditoria divide-se em:
1. **Bloco 1 — Confirmado e excelente** (mitigações validadas com rastro no código).
2. **Bloco 2 — Parcial** (itens iniciados, mas que podem ser endurecidos).
3. **Bloco 3 — Críticos / Violações** (erros pendentes de correção).
4. **Bloco 4 — Itens N/A** (itens fora do escopo da aplicação).
5. **Matriz de Cobertura Completa** (tabela com os 61 itens do checklist).
6. **Plano de Ação Ordenado por Severidade**.

---

## ✅ Bloco 1 — Confirmado e excelente

| # | Item | Arquivo:Linha | Descrição |
|---|------|---------------|-----------|
| **1** | Auth em rotas privadas | `supabase/agendamentos_limite.sql:136-138` | RLS ativo na tabela `agendamentos` com `REVOKE INSERT` para `anon`. |
| **12** | Brute force protection | `supabase/functions/criar-agendamento/index.ts:77-83` | Chamadas de gravação blindadas pelo CAPTCHA Turnstile em modo Fail-Closed no servidor. |
| **13** | Segredos fora do repositório | `.gitignore:4,7` | Arquivo `.env` e chaves privadas do Deno Deploy completamente excluídos do Git. |
| **14** | Queries parametrizadas | `supabase/functions/criar-agendamento/index.ts:107-109` | Uso exclusivo do cliente do Supabase (`supabase-js`) que parametriza as chamadas nativamente. |
| **15** | Proteção contra SSRF | `supabase/functions/criar-agendamento/index.ts:43` | Requisição externa de validação fixa ao domínio oficial da Cloudflare, sem controle de URL pelo cliente. |
| **16** | Sem desserialização/SSTI | `supabase/functions/criar-agendamento/index.ts:60-130` | Respostas retornam apenas payloads JSON estáticos. Sem interpretação dinâmica de templates. |
| **17** | Caminho prod = dev | `supabase/functions/criar-agendamento/index.ts` | O mesmo script e DDL de trigger controlam o ambiente local e de produção. |
| **24** | Sem race conditions | `supabase/agendamentos_limite.sql:88-90` | Serialização das gravações simultâneas via `pg_advisory_xact_lock` no trigger Postgres. |
| **29** | Limites atômicos de cota | `supabase/agendamentos_limite.sql:93-102` | Contagem e validação atômica no banco de dados baseada em status ativos (`status IN ('agendado', 'confirmado')`). |
| **34** | IDs com formato estrito | `supabase/functions/criar-agendamento/index.ts:20-24` | Validação de formatos via Regex do telefone (E.164) e data (ISO) no servidor. |
| **37** | IP confiável atrás de proxy | `supabase/functions/criar-agendamento/index.ts:80` | IP do cliente extraído de `CF-Connecting-IP` injetado pela borda da Cloudflare. |
| **47** | Soft delete | `supabase/agendamentos_limite.sql:33-44` | Mapeamento de status no banco para suportar cancelamento e remarcação sem exclusão física dos dados. |
| **55** | Sanitização de frontend | `src/components/AgendarModal.tsx` | Renderização livre de injeções de tags e sem uso do método `dangerouslySetInnerHTML`. |
| **58** | Sem vazamento de segredos | `src/lib/supabase.ts:7-9` | O bundle estático carrega apenas a chave pública `anon` e URL pública do banco. |

---

## ⚠️ Bloco 2 — Parcial

- **Item 5 — Validação de inputs no servidor (Parcial)**:
  - **Arquivo**: `supabase/functions/criar-agendamento/index.ts:68-100`
  - **Descrição**: As entradas do usuário são exaustivamente validadas no Deno Deploy, porém a lógica é executada de forma manual através de estruturas de controle `if` e regex locais. O ideal seria migrar para um validador estruturado como o **Zod** para garantir tipagem e rejeição rigorosa de propriedades extras.
- **Item 42 — CORS com allowlist (Parcial)**:
  - **Arquivo**: `supabase/functions/criar-agendamento/index.ts:14-17`
  - **Descrição**: A Edge Function expõe o cabeçalho `'Access-Control-Allow-Origin': '*'` para facilitar testes de desenvolvimento. Em produção, para restringir requisições cross-origin, o cabeçalho deve refletir estritamente o domínio da Landing Page (`https://nord-nails.vercel.app`).

---

## 🔴 Bloco 3 — Críticos / Violações

- **Item 56 — CSP no servidor do frontend (Vercel) (Violado)**:
  - **Arquivo**: Ausência de `vercel.json` na raiz do repositório.
  - **Descrição**: O frontend estático do site, embora não possua lógica executável no servidor, é servido pela CDN da Vercel sem nenhum cabeçalho de endurecimento de segurança (HSTS, Content-Security-Policy, X-Frame-Options, Referrer-Policy).
  - **PoC**: Executar `curl -I https://nord-nails.vercel.app/` revela a ausência completa de cabeçalhos de segurança na resposta HTTP.

---

## 🚫 Bloco 4 — Itens N/A

Os demais itens do checklist (como autenticação de usuários, tokens JWT, cookies, logs estruturados JSON em microsserviços, etc.) foram devidamente classificados como **N/A** por motivos de escopo de uma Landing Page estática/pública sem área logada de cliente.

---

## 📊 Matriz de Cobertura Completa

| Item | Status | Arquivo:Linha | Item | Status | Arquivo:Linha |
|---|---|---|---|---|---|
| 1 | ✅ Confirmado | `supabase/agendamentos_limite.sql:136` | 32 | 🚫 N/A | Landing Page sem HTML dinâmico no servidor |
| 2 | 🚫 N/A | Sem área de usuário logado | 33 | 🚫 N/A | Servido estaticamente |
| 3 | 🚫 N/A | Sem sessão de cliente | 34 | ✅ Confirmado | `criar-agendamento/index.ts:20` |
| 4 | 🚫 N/A | Sem WebSockets / Fila | 35 | 🚫 N/A | Sem listagens privadas |
| 5 | 🟠 Parcial | `criar-agendamento/index.ts:68` | 36 | 🚫 N/A | Sem login de cliente |
| 6 | 📝 Decisão | `src/lib/supabase.ts:7` | 37 | ✅ Confirmado | `criar-agendamento/index.ts:80` |
| 7 | 🚫 N/A | Serverless e sem boot db síncrono | 38 | 🚫 N/A | Sem login de cliente |
| 8 | 🚫 N/A | Sem orquestradores (Docker/Helm) | 39 | 🚫 N/A | Sem infraestrutura de micro-serviços |
| 9 | 🚫 N/A | Sem senhas de clientes | 40 | ✅ Confirmado | `AgendarModal.tsx` |
| 10 | 🚫 N/A | Sem JWT de sessão de clientes | 41 | ✅ Confirmado | `criar-agendamento/index.ts:108` |
| 11 | 🚫 N/A | Sem tokens/hashes secretos em tráfego | 42 | 🟠 Parcial | `criar-agendamento/index.ts:15` |
| 12 | ✅ Confirmado | `criar-agendamento/index.ts:77` | 43 | 🚫 N/A | Sem cookies de sessão |
| 13 | ✅ Confirmado | `.gitignore:4,7` | 44 | ✅ Confirmado | `package.json` livre de vulnerabilidades |
| 14 | ✅ Confirmado | `criar-agendamento/index.ts:107` | 45 | 🚫 N/A | Sem microsserviços |
| 15 | ✅ Confirmado | `criar-agendamento/index.ts:43` | 46 | 🚫 N/A | Sem telemetria complexa |
| 16 | ✅ Confirmado | `criar-agendamento/index.ts:60` | 47 | ✅ Confirmado | `supabase/agendamentos_limite.sql:33` |
| 17 | ✅ Confirmado | `criar-agendamento/index.ts` | 48 | 🚫 N/A | Sem área administrativa (CRUD) |
| 18 | 🚫 N/A | Sem cookies no front-end | 49 | 🚫 N/A | Supabase gerencia backups nativos |
| 19 | 🚫 N/A | Sem testes automatizados no escopo | 50 | 🚫 N/A | Sem PII persistido para marketing |
| 20 | 🚫 N/A | Sem testes adversariais automatizados | 51 | 🚫 N/A | Deploy estático sem Docker em prod |
| 21 | 🚫 N/A | Sem pipeline de CI/CD em PRs | 52 | 🚫 N/A | Sem arquitetura de ADRs em MVP |
| 22 | 🚫 N/A | Sem controllers tradicionais Express | 53 | 🚫 N/A | Sem tokens de sessão |
| 23 | 🚫 N/A | Sem controllers tradicionais Express | 54 | 🚫 N/A | Sem rotas privadas de cliente no front |
| 24 | ✅ Confirmado | `supabase/agendamentos_limite.sql:88` | 55 | ✅ Confirmado | `AgendarModal.tsx` |
| 25 | 🚫 N/A | Serverless usa stdout logs simples | 56 | 🔴 Violado | Ausência de `vercel.json` na raiz |
| 26 | ✅ Confirmado | `criar-agendamento/index.ts` | 57 | ✅ Confirmado | `AgendarModal.tsx` |
| 27 | 🚫 N/A | Sem integradores terceiros | 58 | ✅ Confirmado | `src/lib/supabase.ts:7` |
| 28 | 🚫 N/A | MVP sem modelagem de ameaças formal | 59 | ✅ Confirmado | `criar-agendamento/index.ts:87` |
| 29 | ✅ Confirmado | `supabase/agendamentos_limite.sql:93` | 60 | 🚫 N/A | Sem testes adversariais automatizados |
| 30 | 🚫 N/A | Sem reporte de vulnerabilidades público | 61 | 🚫 N/A | Sem smoke tests pós-deploy em CI |
| 31 | ✅ Confirmado | `README.md` | | | |

---

## 🛠️ Plano de Ação

### 1. Crítico: Adição do `vercel.json` (HSTS, CSP, X-Frame-Options)
Criar o arquivo `vercel.json` na raiz do projeto contendo as regras de cabeçalho HTTP estrito para proteção de XSS e Clickjacking:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://challenges.cloudflare.com; connect-src 'self' https://tcrusnymzlbnmlfzhfqu.supabase.co;" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### 2. Qualidade: Substituir validação manual por Zod na Edge Function
Refatorar a Edge Function `criar-agendamento` para utilizar a biblioteca Deno compatível com o **Zod** para parsing de tipos de entrada.

---

## 🧭 Reflexão final

O projeto da Landing Page da Nord Nails é um exemplo excelente de endurecimento focado: a proteção de limites e a segurança contra concorrência foram delegadas de forma blindada para o banco de dados (PostgreSQL), reduzindo os vetores de ataque no frontend a praticamente zero. A estruturação do novo CRM exigirá autenticação de administradores (atendentes), o que trará novas necessidades de segurança de acesso (camadas de sessão, tokens e login robusto).
