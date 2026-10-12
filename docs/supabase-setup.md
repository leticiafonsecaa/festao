# Configuração do Supabase — Festão

Guia manual das etapas que dependem de você (conta, painel e variáveis).
Nada aqui é executado automaticamente pelo app.

## 1. Criar o projeto

1. Acesse <https://supabase.com> → New project (região recomendada: `sa-east-1`).
2. Anote (sem versionar!) a **Project URL** e a **anon key** em *Settings → API*.
3. A **service_role key** nunca deve sair do painel nem entrar em `.env`/`VITE_*`.

## 2. Aplicar as migrations

Ordem obrigatória (SQL Editor → New query, um arquivo por vez, ou Supabase CLI):

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_rls.sql`
3. `supabase/migrations/0003_rsvp.sql`

Com a CLI (opcional): `supabase link --project-ref <ref>` e
`supabase db push`.

## 3. Autenticação — confirmação de e-mail (decisão K2: ON)

Em *Authentication → Providers → Email*:

- Provider **Email**: habilitado.
- **Confirm email**: marcado/ON (exigência aprovada).
- *Secure email change* e *Secure password change*: recomendados ON.

Em *Authentication → URL Configuration*:

- **Site URL**: URL de produção na Vercel (ex.
  `https://festao.vercel.app`).
- **Redirect URLs**: adicionar
  - `http://localhost:5173/**` (dev do Vite)
  - `https://<projeto>.vercel.app/**` (produção)
  - URLs de preview: `https://*-<team>.vercel.app/**` ou cada preview usada
    nos testes (o app usa `window.location.origin` como retorno).

## 4. E-mails transacionais

- *Authentication → Emails*: revisar os templates **Confirm signup**,
  **Magic Link** e **Reset Password** (o link usa `{{ .ConfirmationURL }}`).
- Limite diário do provedor padrão do Supabase é baixo; para produção,
  configurar SMTP próprio (Resend, Postmark, SES etc.) em
  *Authentication → Emails → SMTP settings* — você faz isso no painel,
  configurando as credenciais do provedor escolhido (não as coloque no Git).

## 5. Variáveis na Vercel

Em *Project → Settings → Environment Variables* (somente valores públicos):

| Nome | Valor |
|---|---|
| `VITE_SUPABASE_URL` | Project URL do Supabase |
| `VITE_SUPABASE_ANON_KEY` | anon key |

Repositório canônico (decisão K6): o já existente no GitHub
(`origin`), branch `main` — a Vercel deve apontar para ele, sem criar
novo repositório.

## 6. Checklist de testes do fluxo de confirmação (K2)

Executar em desenvolvimento (`npm run dev` com `.env.local` preenchido):

- [ ] Cadastro com e-mail novo → tela "Verifique seu e-mail" aparece.
- [ ] E-mail chega (Inbucket em dev: `http://localhost:54324` quando roda
      `supabase start`; no hosted, caixa de entrada/spam).
- [ ] Antes de confirmar, **login falha** com aviso "Confirme seu e-mail".
- [ ] Clicar no link confirma e redireciona para a origem correta.
- [ ] Após confirmar, login funciona e `?next=` é respeitado
      (ex.: `/entrar?next=%2Fdashboard` cai no dashboard).
- [ ] "Reenviar e-mail de confirmação" reenvia sem erro.
- [ ] Link de confirmação usado 2ª vez mostra mensagem de link inválido.
- [ ] "Esqueci minha senha" → e-mail → link → `/redefinir-senha` → nova
      senha grava e login com a nova senha funciona.
- [ ] Link de recuperação expirado mostra mensagem amigável.
- [ ] Rotas `/dashboard`, `/criar-evento` e `/eventos/*` redirecionam para
      `/entrar` sem sessão; voltam ao destino com `?next=` após login.
- [ ] Logout limpa a Navbar e redireciona para `/`.

Critério de aceitação da Fase 2: todos os itens acima marcados, com
`npm run typecheck` e `npm run build` verdes.
