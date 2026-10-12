# Configuração do Supabase — Festão

Guia manual das etapas que dependem de você (conta, painel e variáveis).
Nada aqui é executado automaticamente pelo app.

## Status da implementação (atualização: Fases 0–3)

### Concluído em código (branch `feat/supabase-fase-1-infra`)

| Fase | Entrega | Commits |
|---|---|---|
| 0 | `.gitignore` protege `.env*`; `.env.example` documenta as variáveis públicas | `bf2758b` |
| 1 | Migrations `0001`–`0003` (schema, RLS, função `submit_rsvp`); cliente `src/lib/supabase.ts`; dependência `@supabase/supabase-js` | `bf2758b` |
| 2 | Telas `/entrar`, `/cadastro` (com confirmação de e-mail), `/esqueci-senha`, `/redefinir-senha`; `RequireAuth` nas rotas privadas; menu de usuário na Navbar; este guia | `8db0a6d` |
| 3 | Camada de API (`src/lib/api/`); store com modo duplo Supabase/demo (localStorage preservado sem env vars); hidratação por sessão com limpeza no logout; debounce de 400ms em edições de digitação; RSVP da página pública via RPC `submit_rsvp`; página pública carrega evento por slug no modo remoto | `337cce5` |
| 6 | Capas no Supabase Storage: migration `0004_storage.sql` (bucket `covers` + policies), `src/lib/api/coverStorage.ts`, PersonalizaçãoPage envia para o Storage no modo remoto (data URL mantida no modo demo) | *sem commit — aguardando autorização* |

### Testado de fato (executado no ambiente)

- `npm run typecheck`: **0 erros** (após cada fase).
- `npm run build`: **OK** (após cada fase).
- Leitura/inspeção dos fluxos de código (nenhuma tela executada em navegador com banco real).

### NÃO testado ainda (depende do projeto Supabase real)

- Aplicação das migrations num banco real e validação das policies RLS.
- Checklist da seção 3 (confirmação de e-mail) e checklist da seção 7 (dados).
- Teste de RSVP entre dois dispositivos/rede anônima.

### Pendências conhecidas (não bloqueiam o deploy de preview)

- Testes automatizados (Vitest + CI) = Fase 7.
- Deploy de produção e smoke test = Fase 8 (ver `deploy-vercel.md`).
- Aviso de bundle >500 kB no build (framer-motion + supabase-js + zod); otimização com code-split futura.
- Capas: **Fase 6 entregue em código** (migration `0004_storage.sql`); ver seção 8 para aplicação e testes.

## 1. Criar o projeto

1. Acesse <https://supabase.com> → New project (região recomendada: `sa-east-1`).
2. Anote (sem versionar!) a **Project URL** e a **publishable key**
   (`sb_publishable_*`; a anon legada também funciona temporariamente) em
   *Settings → API*.
3. A **secret key (`sb_secret_*`) / service_role** nunca deve sair do painel
   nem entrar em `.env`/`VITE_*`.

## 2. Aplicar as migrations

Ordem obrigatória (SQL Editor → New query, um arquivo por vez, ou Supabase CLI):

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_rls.sql`
3. `supabase/migrations/0003_rsvp.sql`
4. `supabase/migrations/0004_storage.sql` (bucket `covers` — Fase 6)

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
| `VITE_SUPABASE_PUBLISHABLE_KEY` | publishable key (`sb_publishable_*`) |

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

## 7. Checklist de testes da Fase 3 — camada de dados (Supabase)

Pré-condições: migrations aplicadas (seção 2), Auth configurado (seção 3),
`.env.local` preenchido, `npm run dev` rodando. Execute **dois navegadores**
(A = dono logado; B = anônimo/outra conta) para validar isolamento.

### Dados do dono (isolamento entre usuários)

- [ ] Criar evento no navegador A → fazer logout → login → evento aparece.
- [ ] Abrir o mesmo login no navegador C (outro dispositivo/máquina) →
      eventos, convidados e presentes aparecem (multi-dispositivo).
- [ ] Editar nome/data/hora/local no Dashboard/Personalização (digitação
      rápida) → recarregar após ~2s → alterações persistidas (debounce OK).
- [ ] Criar conta em outro e-mail (navegador B) → **não vê** os eventos de A
      (RLS); digitar o id de um evento de A em `/dashboard/<id>` → "Nenhum
      evento selecionado" (acesso negado).
- [ ] CRUD de convidados: adicionar, editar, mudar RSVP no select, remover →
      persiste após recarregar; filtro por RSVP continua correto.
- [ ] CRUD de presentes: adicionar com opções de loja/preço BRL, editar,
      marcar recebido/remover → persiste; totais corretos.
- [ ] Personalização: cores, tagline, toggles e capa (data URL, por enquanto)
      → persistem; preview reflete o banco.
- [ ] Excluir evento → some da lista e a URL direta não abre mais.

### Publicação e página pública

- [ ] Publicar página → link `/e/<slug>` abre no navegador B (anônimo) com
      dados reais do banco (capa, countdown, presentes).
- [ ] Despublicar → B vê "página não encontrada"; publicar de novo → o
      **mesmo link** volta a funcionar.
- [ ] RSVP anônimo em B com nome **não cadastrado** → cria convidado novo;
      aparece no painel de A com selo "via página".
- [ ] RSVP em B com nome **já cadastrado** (ex.: "maria silva" vs "Maria
      Silva") → atualiza o mesmo convidado, sem duplicar.
- [ ] A página pública **não** lista nomes/e-mails de convidados (só
      presentes e contagens).
- [ ] Enviar RSVP 11 vezes do mesmo navegador em curto período → mensagem
      de "Muitas tentativas" (rate limit).
- [ ] Logout no navegador A → eventos somem do painel (cache limpo em
      navegador compartilhado).

### Regressão do modo demo (sem env vars)

- [ ] Renomear `.env.local` (ou esvaziar as `VITE_*`) → `npm run dev` →
      todo o fluxo antigo de localStorage funciona como antes (criar evento,
      publicar, RSVP na mesma origem, sync entre abas).

Critério de aceitação da Fase 3: todos os itens acima marcados, com
`npm run typecheck` e `npm run build` verdes e nenhum erro de console
relacionado a rede/RLS durante os testes.

## 8. Storage de capas (Fase 6)

### Como funciona

- Bucket `covers` criado pela migration `0004_storage.sql` (**aditiva** —
  as migrations 0001–0003 e a coluna `hero_image_url` não foram alteradas).
- Path do arquivo: `covers/{user_id}/{event_id}.jpg` — o primeiro segmento
  é o `auth.uid()` do dono (namespaces isolados por usuário) e o segundo é
  o `event_id`.
- No app: a capa é comprimida no cliente (~500 KB JPEG), enviada ao bucket
  (`upsert` no mesmo path substitui a capa) e **só a URL pública** fica
  gravada em `event_personalization.hero_image_url`. O URL retornado traz
  `?v=<timestamp>` (cache-buster) — sem isso, o cache de CDN poderia servir
  a capa antiga após uma substituição.
- **Modo demo** (sem env vars): continua gravando data URL no localStorage —
  nada muda sem Supabase configurado.

### Políticas implementadas (resumo da 0004, revisadas na auditoria)

| Política | Quem | O quê |
|---|---|---|
| `covers_owner_select` | autenticado, **apenas seu próprio namespace** (`path[1] = auth.uid()`) | SELECT mínimo exigido pelo **upsert** (doc oficial); dono só enxerga os próprios arquivos |
| *(anon sem policy de SELECT)* | — | `list()`/metadados **negados** para anônimos; exibição pública funciona apenas pela flag de bucket público (`/object/public/...`), que não passa por policies |
| `covers_owner_insert` | autenticado: `path[1] = auth.uid()`, `path[2]` = uuid de **evento real do próprio usuário** (`is_event_owner`), extensão jpg/jpeg/png/webp | upload |
| `covers_owner_update` | autenticado, dono do namespace (cobertura do `upsert` junto ao SELECT) | substituição |
| `covers_owner_delete` | autenticado, dono do namespace | exclusão |

Proteções extras do bucket: limite de 5 MB por arquivo e tipos
`image/jpeg`, `image/png`, `image/webp` (validação server-side; o cliente
já envia JPEG comprimido).

### Limitações registradas (auditoria)

1. **Idempotência da 0004**: `ON CONFLICT DO NOTHING` não atualiza um bucket
   `covers` pré-existente com outra configuração (ex.: privado) — verifique
   no Dashboard → Storage e use o `update` de exemplo comentado no SQL se
   preciso.
2. **EXECUTE (auditoria)**: `CREATE FUNCTION` concede `EXECUTE TO PUBLIC`
   por padrão — a 0004 revoga isso dos helpers (`f_unaccent`,
   `normalize_name`, `is_event_owner`, `is_gift_owner`) e mantém grants
   mínimos: `anon` só executa `submit_rsvp` (K8); `authenticated` só as
   funções necessárias. Triggers intocadas.
2. **SELECT do dono**: foi adicionado estritamente ao namespace próprio por
   exigência do upsert na doc oficial. Efeito colateral aceito: o dono pode
   listar os **próprios** arquivos (que ele mesmo enviou) — nunca terceiros.
   Refinamento por operação (`allow_any_operation`) fica pendente de
   validação do nome exato da operação de upsert em projeto real.
2. **Cache de CDN**: substituições usam `?v=` para fugir do cache; a URL
   antiga **sem** sufixo pode continuar respondendo pelo cache até expirar.
3. **Remoção da capa**: a UI limpa `hero_image_url` **primeiro** e só então
   tenta excluir o arquivo (melhor esforço). Assim, uma falha na exclusão
   nunca deixa o banco apontando para arquivo inexistente; o arquivo fica
   recuperável no bucket pelo path conhecido `{uid}/{eventId}.jpg`.
4. **Leitura pública**: bucket público = URL acessível a qualquer pessoa
   que a tenha, inclusive via cache — não usar o bucket para nada privado.

### Checklist de testes da Fase 6 (requer projeto Supabase configurado)

- [ ] Aplicar `0004_storage.sql` no SQL Editor (após 0001–0003).
- [ ] Enviar imagem na Personalização → aparece "Enviando..." → preview
      mostra a capa via URL pública (`.../storage/v1/object/public/covers/...`).
- [ ] Recarregar a página → capa continua (URL persistida no banco).
- [ ] Substituir a capa → mesmo path substituído; preview atualiza.
- [ ] Remover capa → campo limpo **e** arquivo removido do bucket
      (Storage browser do Supabase).
- [ ] Abrir `/e/<slug>` em navegador anônimo → capa visível (leitura pública
      via URL do bucket, sem policy de SELECT).
- [ ] No console do navegador (anônimo), `supabase.storage.from('covers').list()`
      → **falha/negado** (metadados e listagem protegidos).
- [ ] Tentar enviar sem sessão (token expirado) → mensagem "Sessão expirada".
- [ ] Usuário B (outra conta) **não** consegue sobrescrever/excluir a capa
      de A via API do Storage (policies negam; testar pelo SQL Editor com
      papel `authenticated` ou console do navegador).
- [ ] Página pública com capa >5 MB ou em formato não suportado → bucket
      rejeita (erro amigável na UI).
- [ ] Modo demo (sem env vars): upload de capa continua como data URL.

Critério de aceitação da Fase 6: checklist acima aprovado, com
`npm run typecheck` e `npm run build` verdes no modo remoto e no modo demo.


