# Relatório final — Fase 6 (Festão)

> Documento de fechamento das alterações da branch `feat/supabase-fase-1-infra`
> em relação à branch-base `main` (`8b02827`).
>
> **Não contém credenciais.** Todas as chaves, URLs de projeto e tokens ficam
> fora do repositório (ver `.env.example`, que traz apenas placeholders).

---

## 1. Resumo geral

**Objetivo da fase:** concluir a camada de infraestrutura Supabase do Festão
(esquema, segurança, autenticação, dados, RSVP público, Storage de capas),
integrar a store do app a esse backend e adicionar uma suíte de testes
automatizados que trave o comportamento essencial.

**Resultado alcançado:**

- Backend modelado em 4 migrations versionadas com timestamps do Supabase CLI,
  com RLS habilitado em todas as tabelas e um caminho único de escrita anônima
  (RSVP) via função `security definer`.
- Aplicação conectada ao Supabase em **modo duplo**: com as variáveis `VITE_*`
  configuradas usa o banco remoto; sem elas, cai automaticamente para o modo
  demonstração em `localStorage` (comportamento original preservado).
- Autenticação completa (login, cadastro com confirmação de e-mail, recuperação
  e redefinição de senha) e rotas privadas protegidas.
- Upload/substituição/remoção de capas de evento no Supabase Storage.
- Suíte Vitest + jsdom com **4 arquivos e 16 testes** aprovados.

**Estado:** implementação concluída e verificada localmente
(`typecheck`, `build`, `test` verdes). **Pendente** de validação em ambiente
Supabase real, fluxo de ponta a ponta no navegador e deploy na Vercel.

---

## 2. Funcionalidades implementadas

### 2.1 Infraestrutura e banco de dados (Supabase)

- **Esquema relacional** (`profiles`, `events`, `event_personalization`,
  `guests`, `gifts`, `gift_options`, `rsvp_log`) com chaves, FKs
  `on delete cascade`, `check constraints`, índices e triggers de `updated_at`.
- **Criação automática** de perfil no signup (`handle_new_user`) e de
  personalização padrão na criação de evento (`handle_new_event`), ambas
  `security definer`.
- **Row Level Security (RLS)** habilitado em todas as tabelas; dono tem CRUD
  escopado a `auth.uid()`; anônimo **não** tem grant de tabela — só lê
  **views** `definer` de eventos publicados (sem PII) e escreve RSVP via função.
- **Views públicas** (`public_events`, `public_event_personalization`,
  `public_guest_counts`, `public_gifts`, `public_gift_options`) que expõem
  somente eventos publicados e nunca `user_id`, e-mail, telefone ou
  `received_by`.
- **RSVP público** pela função `submit_rsvp(...)`: valida escolha, nome,
  contatos e tamanhos; exige evento publicado; faz **upsert por nome
  normalizado**; e aplica **rate limit** (10 envios por IP/hora) via `rsvp_log`.
- **Storage de capas**: bucket público `covers` (5 MB, `image/jpeg|png|webp`),
  path `covers/{user_id}/{event_id}.jpg`, com policies de INSERT (valida
  propriedade real do evento via `is_event_owner`), SELECT/UPDATE/DELETE
  restritos ao namespace do dono. Sem policy de SELECT para `anon`.
- **Cliente Supabase** (`src/lib/supabase.ts`) usando apenas variáveis públicas
  (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`), com fallback visível em
  dev quando ausentes e helper `isSupabaseConfigured()`.

### 2.2 Autenticação e sessão

- Store `useAuth` (zustand) sobre o SDK do Supabase: restaura sessão, assina
  mudanças de estado e expõe `signOut`.
- Páginas `/entrar` (login), `/cadastro` (signup com confirmação de e-mail),
  `/esqueci-senha` e `/redefinir-senha`.
- Componente `RequireAuth` protegendo rotas privadas, com `safeNextPath()` que
  **bloqueia open redirect** (aceita só caminhos internos).
- `authErrorMessage()` traduzindo erros do Supabase Auth para pt-BR sem expor
  detalhes internos.

### 2.3 Dados, eventos, convidados, presentes e RSVP

- Camada de API (`src/lib/api/`): CRUD de eventos, convidados e presentes do
  dono (`eventsApi.ts`), leituras públicas e envio de RSVP (`publicApi.ts`),
  upload/remoção de capas (`coverStorage.ts`) e mapeamento snake_case↔camelCase
  (`mappers.ts`).
- **Store em modo duplo** (`useStore.ts`): no modo remoto persiste no Supabase
  com **otimismo** (atualiza a UI e sincroniza em background), hidratação por
  sessão com limpeza no logout, **debounce** nas edições de digitação e
  tratamento de erro de sincronização (`lastSyncError`). No modo demo preserva o
  comportamento em `localStorage`.
- **RSVP público** no modo remoto via RPC `submit_rsvp`; no modo demo por
  nome normalizado (mesma semântica).


---

## 3. Arquivos alterados

Legenda: **A** = adicionado, **M** = modificado (relativo a `main`/`8b02827`).

| Arquivo | Tipo | Descrição resumida |
|---|---|---|
| `.env.example` | A | Documenta as variáveis públicas `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`; alerta que `sb_secret_*`/`service_role` nunca devem aparecer. |
| `.gitignore` | M | Passa a ignorar `.env*` para proteger credenciais. |
| `docs/supabase-setup.md` | A | Guia de configuração do Supabase, status das fases, policies, limitações e checklists de validação. |
| `docs/deploy-vercel.md` | A | Resumo técnico do deploy na Vercel, variáveis, ambientes e smoke test pós-deploy. |
| `package.json` | M | Adiciona `@supabase/supabase-js`, `vitest`, `jsdom`, `@testing-library/*` e scripts `test`/`test:watch`. |
| `package-lock.json` | M | Lockfile atualizado com as novas dependências. |
| `src/App.tsx` | M | Novas rotas de autenticação e aplicação de `RequireAuth` nas rotas privadas. |
| `src/components/Navbar.tsx` | M | Menu de usuário autenticado (entrar/cadastrar/sair). |
| `src/components/RequireAuth.tsx` | A | Guarda de rotas privadas + `safeNextPath()` (anti open-redirect). |
| `src/components/RequireAuth.test.tsx` | A | Testes de loading, bloqueio sem sessão, liberação com sessão e de `safeNextPath`. |
| `src/lib/supabase.ts` | A | Criação do cliente Supabase e `isSupabaseConfigured()`. |
| `src/lib/authErrors.ts` | A | Tradução de erros de auth para pt-BR. |
| `src/lib/authErrors.test.ts` | A | Testes dos mapeamentos de erro conhecidos e do fallback genérico. |
| `src/lib/eventUtils.test.ts` | A | Testes de `slugify`, `normalizeName`, `safeHex`, `parsePrice`, `formatBRL`, `getCountdown`, `timeAgo`. |
| `src/lib/api/mappers.ts` | A | Mapeamento linhas↔domínio e mapas de colunas para updates. |
| `src/lib/api/eventsApi.ts` | A | CRUD do dono (eventos, convidados, presentes e opções). |
| `src/lib/api/publicApi.ts` | A | Leitura pública por slug e `submitRsvpRpc` (usa `visitorId()` como surrogate de IP). |
| `src/lib/api/coverStorage.ts` | A | Upload com `upsert`, URL pública com cache-buster `?v=` e remoção de capa. |
| `src/pages/LoginPage.tsx` | A | Tela de login. |
| `src/pages/SignupPage.tsx` | A | Tela de cadastro (confirmação de e-mail). |
| `src/pages/ForgotPasswordPage.tsx` | A | Tela de recuperação de senha. |
| `src/pages/ResetPasswordPage.tsx` | A | Tela de redefinição de senha. |
| `src/pages/CreateEventPage.tsx` | M | Criação de evento integrada à store (modo remoto/demo). |
| `src/pages/PersonalizationPage.tsx` | M | Personalização; no modo remoto envia a capa ao Storage (data URL preservada no demo). |
| `src/pages/PublicEventPage.tsx` | M | Pública `/e/<slug>`: carrega evento publicado por slug no modo remoto; RSVP via RPC. |
| `src/store/useAuth.ts` | A | Estado de autenticação sobre o SDK do Supabase. |
| `src/store/useStore.ts` | M | Store em modo duplo Supabase/demo, hidratação, debounce, RSVP e tratamento de erro. |
| `src/store/useStore.test.ts` | A | Testes do modo demo: criação de evento, convidados, RSVP público e publicação. |
| `src/test/setup.ts` | A | Setup de testes (jest-dom). |
| `vitest.config.ts` | A | Configuração do Vitest com ambiente jsdom e setup. |
| `supabase/migrations/20261011180000_init.sql` | A | Esquema inicial, funções e triggers. |
| `supabase/migrations/20261011190000_rls.sql` | A | RLS, revogações, grants e views públicas. |
| `supabase/migrations/20261012083000_rsvp.sql` | A | Função `submit_rsvp` (security definer, rate limit, upsert). |
| `supabase/migrations/20261012103000_storage.sql` | A | Bucket `covers`, policies de Storage e endurecimento de EXECUTE. |

> Observação: `src/lib/eventUtils.ts` já existia em `main`; nesta branch foi

---

## 4. Supabase e banco de dados

- **Migrations (ordem obrigatória):**
  1. `20261011180000_init.sql` — esquema, funções (`normalize_name`, triggers).
  2. `20261011190000_rls.sql` — RLS, revogações/grants e views públicas.
  3. `20261012083000_rsvp.sql` — função `submit_rsvp`.
  4. `20261012103000_storage.sql` — bucket `covers`, policies e endurecimento
     de `EXECUTE` das funções auxiliares.

  As migrations são **aditivas** e já foram renomeadas para timestamps
  compatíveis com o Supabase CLI (tarefa concluída anteriormente; **não**
  repetida nesta atividade).
- **Políticas RLS:** nenhuma tabela é acessível sem política; dono restrito a
  `auth.uid()`; anônimo só lê views publicadas e executa `submit_rsvp`.
- **Funções:** helpers `security definer` (`is_event_owner`, `is_gift_owner`,
  `covers_path_event_id`) com `search_path` fixado; `submit_rsvp` valida tudo
  internamente (entrada, evento publicado e rate limit).
- **Storage:** bucket público com limite de 5 MB e tipos de imagem
  restritos; escrita restrita ao dono e a eventos reais dele.
- **Cliente:** `src/lib/supabase.ts` cria o cliente com `persistSession`,
  `autoRefreshToken` e `detectSessionInUrl`.

---

## 5. Testes e qualidade

Comandos executados nesta verificação e seus resultados **comprovados**:

| Comando | Resultado |
|---|---|
| `npm run typecheck` | ✅ 0 erros (`tsc -p tsconfig.app.json --noEmit`). |
| `npm run build` | ✅ Sucesso — `built in 5.53s`, 2112 módulos transformados. |
| `npm run test` | ✅ **4 arquivos, 16 testes aprovados** (`eventUtils` 7, `authErrors` 2, `useStore` 4, `RequireAuth` 3). |

**Avisos relevantes (não são erros):**

- Build: `Some chunks are larger than 500 kB after minification` — o bundle JS
  final tem **751.38 kB** (gzip ~210 kB), puxado por `framer-motion`,
  `@supabase/supabase-js` e `zod`. Otimização futura via code-split.

**Escopo dos testes:** cobrem funções puras (`eventUtils`), mapeamento de erros
de auth, a store em **modo demo** (localStorage) e o guarda de rotas. Não cobrem
integração real com Supabase (depende de banco/projeto configurado).

---

## 6. Segurança

Medidas implementadas:

- **RLS em todas as tabelas**; revogação do acesso padrão de `anon`/
  `authenticated` e concessão mínima por papel.
- **Princípio do menor privilégio em funções**: `anon` só executa `submit_rsvp`;
  helpers auxiliares têm `EXECUTE` restrito a `authenticated`; triggers
  intocadas.
- **RSVP público isolado**: escrita anônima somente pela função
  `security definer`, com validações de entrada, exigência de evento publicado e
  **rate limit por IP** (10/h).
- **Views sem PII**: página pública nunca expõe `user_id`, e-mail, telefone ou
  `received_by`.
- **Storage**: bucket público apenas para leitura por URL; escrita restrita ao
  namespace do dono e a eventos reais (anti arquivo órfão); limite de 5 MB e
  tipos de imagem validados.
- **Anti open-redirect** em `RequireAuth` (`safeNextPath`).
- **Proteção de credenciais**: `.gitignore` ignora `.env*`; apenas variáveis
  públicas `VITE_*` são usadas no cliente; `.env.example` documenta que
  `sb_secret_*`/`service_role` nunca devem ser versionadas.

**Limitações da revisão:** trata-se de **revisão estática de código**, não de
auditoria de segurança completa. As políticas RLS e de Storage **precisam ser
validadas em um projeto Supabase real** antes de irem a produção.

---

## 7. Pendências (validação externa)

Itens que **não** foram validados de ponta a ponta e dependem de ambiente real:

- **Supabase:** aplicar as 4 migrations num banco real e validar as políticas
  RLS e de Storage (ver `docs/supabase-setup.md`).
- **Navegador/banco real:** confirmação de e-mail, login/cadastro, criação de
  evento, convidados, presentes, publicação, RSVP anônimo entre dois
  dispositivos e upload/substituição/remoção de capas.
- **Vercel:** deploy depende de configurar as variáveis `VITE_SUPABASE_URL` e
  `VITE_SUPABASE_PUBLISHABLE_KEY` no painel e de conectar o repositório
  (ver `docs/deploy-vercel.md`). Nenhum deploy foi feito nesta atividade.

---

## 8. Conclusão

A Fase 6 entrega, **em código**, toda a infraestrutura Supabase do Festão
(schema, RLS, RSVP público, Storage), a integração da aplicação em modo duplo,
autenticação completa e uma suíte de testes que passa localmente. O que foi
**implementado e testado automaticamente** está verde (`typecheck`, `build`,
16 testes). O que ainda **depende de validação externa** é o comportamento com
banco real, as políticas aplicadas e o deploy.

**Próximos passos para homologação e entrega:**

1. Provisionar o projeto Supabase e aplicar as migrations na ordem indicada.
2. Configurar Auth (confirmação de e-mail ON, Site/Redirect URLs).
3. Rodar os checklists de `docs/supabase-setup.md` e o smoke test de
   `docs/deploy-vercel.md`.
4. Conectar o repositório à Vercel, definir as env vars públicas e validar no
   preview antes do merge em `main`.

> adicionado apenas o arquivo de testes correspondente.
