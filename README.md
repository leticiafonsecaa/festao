# Festivity

**Festivity** é uma plataforma web de planejamento e organização de eventos — casamentos, festas de 15 anos, aniversários, eventos corporativos e outras celebrações. Ela reúne, em um só lugar, a criação do evento, a lista de convidados com controle de confirmações (RSVP), a lista de presentes, a personalização e a publicação de uma página pública do evento, acessível por link compartilhável.

## Sobre o projeto

Organizar um evento envolve muitas informações espalhadas: convidados e suas confirmações, presentes, data, local, visual da página do evento e muito mais. O Festivity foi criado para centralizar esse controle em uma única plataforma, com uma interface voltada a quem organiza o evento (o anfitrião) e uma página pública simples para os convidados acessarem informações e confirmarem presença sem precisar criar conta.

**Público-alvo:** anfitriões de eventos pessoais (casamentos, festas de 15 anos, aniversários) e organizadores de eventos corporativos, além dos próprios convidados, que interagem apenas com a página pública do evento.

A aplicação funciona em dois modos (ver [Banco de dados e integrações](#banco-de-dados-e-integrações)):

- **Modo remoto:** com as variáveis do Supabase configuradas, dados e autenticação ficam no Supabase (banco, RLS e Storage).
- **Modo demo:** sem as variáveis, tudo é persistido no `localStorage` do navegador (chave `festsao-storage`), o que permite testar o fluxo completo sem backend — porém os dados ficam restritos ao navegador onde foram criados.

## Funcionalidades

### Concluídas

- **Autenticação** (`/cadastro`, `/entrar`, `/esqueci-senha`, `/redefinir-senha`): cadastro com confirmação de e-mail, login, recuperação e redefinição de senha via Supabase Auth, com mensagens de erro em pt-BR (`src/lib/authErrors.ts`) e validação de formulários com Zod.
- **Rotas protegidas:** `/criar-evento`, `/dashboard` e `/eventos/*` exigem sessão (`src/components/RequireAuth.tsx`), redirecionando para `/entrar?next=...` e preservando o destino (com proteção contra open redirect).
- **Criação de evento** (`/criar-evento`): assistente de 4 etapas (tipo, detalhes, descrição, confirmação) com validação, cobrindo os tipos casamento, 15 anos, aniversário, corporativo e outro.
- **Dashboard** (`/dashboard` e `/dashboard/:id`): lista de eventos, estatísticas (convidados, confirmações, presentes, dias restantes), atalhos, atividade recente e card de publicação com cópia do link.
- **Convidados** (`/eventos/:id/convidados`): cadastro, edição e remoção, busca, filtro por RSVP (pendente/confirmado/recusado), acompanhante (plus-one), mesa e observações; respostas dadas pela página pública recebem o selo "via página".
- **Lista de presentes** (`/eventos/:id/presentes`): itens por categoria, opções de loja/preço em BRL, busca, marcação de presente recebido (com quem presenteou) e totais.
- **Personalização e publicação** (`/eventos/:id/personalizar`): cores, frase de efeito, capa (recorte de imagem no navegador), toggles do que exibir e informações do evento, com preview ao vivo; **publicar** gera um slug único (`/e/<slug>`), permite copiar o link, abrir a página, despublicar e republicar mantendo o mesmo endereço. No modo remoto a capa é enviada ao Supabase Storage; no modo demo fica como data URL no `localStorage`.
- **Página pública do evento** (`/e/:slug`): sem Navbar/Footer/assistente, exibe capa, contagem regressiva, local, presentes e formulário de RSVP completo (nome, resposta, contato, acompanhante, observações), com validação e tela de sucesso/alteração de resposta. No modo remoto, o RSVP é registrado via função `submit_rsvp` (com rate limit); no modo demo, o convidado existente é atualizado por nome normalizado ou um novo é criado.
- **Conexão com Supabase:** cliente em `src/lib/supabase.ts`, camada de API em `src/lib/api/` (eventos/convidados/presentes, leituras públicas por slug, capas), store em modo duplo com atualização otimista, debounce de 400 ms nas edições de digitação e tratamento de erro de sincronização (`lastSyncError`).
- **Testes automatizados:** suíte Vitest + jsdom + Testing Library (4 arquivos, 16 testes) cobrindo utilitários, erros de auth, store em modo demo e o guarda de rotas.

### Demonstrativas (conteúdo fictício, sem backend)

- **Serviços e fornecedores** (`/servicos`) e **perfil do profissional** (`/profissional/:id`): listas e perfis com dados mockados no próprio código (fotografia, decoração, buffet, música/DJ, maquiagem, espaços). Não há busca, contato ou contratação reais.
- **Assistente** (widget flutuante e rota `/agente`): conversa por palavras-chave com respostas prontas em `src/lib/agente.ts`. **Não usa IA nem chave de API** — é um roteiro de demonstração offline.
- **Landing page:** seções institucionais com mockup ilustrativo do produto.

### Não implementadas

- **Orçamento/controle financeiro:** citado apenas nas respostas do assistente; não existe tela nem rota de orçamento no código.
- **Link de convite individual por convidado:** citado no texto do assistente; a implementação atual compartilha apenas o link público do evento (`/e/<slug>`).
- **Envio de e-mails/SMS de convite, notificações e upload de mídia além da capa.**
- **Testes de integração com Supabase real, CI e script de lint** (ver [Limitações e próximos passos](#limitações-e-próximos-passos)).

## Tecnologias utilizadas

| Tecnologia | Finalidade |
|---|---|
| [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Interface e tipagem estática do código |
| [Vite 7](https://vite.dev/) | Servidor de desenvolvimento e build de produção |
| [React Router 6](https://reactrouter.com/) | Navegação por rotas (SPA), incluindo rotas privadas e a página pública |
| [Tailwind CSS 3](https://tailwindcss.com/) + PostCSS/Autoprefixer | Estilização utilitária e tema visual (`tailwind.config.js`, `src/index.css`) |
| [Zustand](https://github.com/pmndrs/zustand) | Estado global: dados do evento (`src/store/useStore.ts`) e sessão (`src/store/useAuth.ts`) |
| [Supabase JS SDK](https://supabase.com/docs/reference/javascript) | Autenticação, banco de dados (PostgreSQL) e Storage |
| [Zod](https://zod.dev/) | Validação dos formulários de autenticação |
| [Framer Motion](https://www.framer.com/motion/) | Animações e transições da interface |
| [Lucide React](https://lucide.dev/) | Ícones |
| [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) + jsdom | Testes unitários e de componente |
| [Vercel](https://vercel.com/) | Plataforma de deploy prevista (`vercel.json` com rewrite de SPA) |

> Observação: o `package.json` declara também dependências que não são usadas no código-fonte (ex.: `three`, `gsap`, `matter-js`, `cannon-es`, `i18next`, `react-use`, `@headlessui/react`, `clsx`). Elas existem apenas no manifesto, sem imports em `src/`.

## Estrutura do projeto

```
festao/
├── docs/                        # Documentação de configuração e relatórios
│   ├── supabase-setup.md        # Guia manual do Supabase (conta, migrations, auth, checklists)
│   ├── deploy-vercel.md         # Roteiro de deploy na Vercel (ainda não executado)
│   └── relatorio-final-fase-6.md
├── public/                      # Ícones e arquivos estáticos (branding, favicon)
├── supabase/
│   └── migrations/              # 4 migrations SQL (schema, RLS, RSVP, Storage)
│       ├── 20261011180000_init.sql
│       ├── 20261011190000_rls.sql
│       ├── 20261012083000_rsvp.sql
│       └── 20261012103000_storage.sql
├── src/
│   ├── components/              # Navbar, Footer, AIAssistant, ImageCropper, RequireAuth
│   ├── lib/
│   │   ├── api/                 # eventsApi, publicApi, coverStorage, mappers
│   │   ├── supabase.ts          # Cliente Supabase + isSupabaseConfigured()
│   │   ├── agente.ts            # Assistente de demonstração (regras por palavras-chave)
│   │   ├── authErrors.ts        # Erros de auth traduzidos para pt-BR
│   │   ├── eventUtils.ts        # slugify, normalização, preços BRL, contagem etc.
│   │   └── heroContrast.ts      # Contraste de texto sobre a capa
│   ├── pages/                   # Todas as telas (landing, auth, dashboard, pública...)
│   ├── store/
│   │   ├── useStore.ts          # Estado dos eventos (modo Supabase/demo, persist local)
│   │   └── useAuth.ts           # Sessão do Supabase Auth
│   ├── test/setup.ts            # Setup do Vitest (jest-dom)
│   ├── App.tsx                  # Rotas e shell da aplicação
│   └── main.tsx                 # Bootstrap (restaura sessão e renderiza)
├── .env.example                 # Variáveis de ambiente necessárias (placeholders)
├── vercel.json                  # Rewrite de SPA para produção
├── vite.config.ts               # Configuração do Vite
└── vitest.config.ts             # Configuração dos testes (jsdom)
```

**Responsabilidades principais:**

- `src/App.tsx` — define todas as rotas e o shell: páginas privadas ficam atrás de `RequireAuth`; a rota `/e/:slug` é renderizada sem Navbar, Footer nem assistente.
- `src/store/useStore.ts` — núcleo dos dados. Decide entre Supabase (função `remote()`) e `localStorage`; concentra as ações de eventos, convidados, presentes, personalização, publicação e RSVP.
- `src/store/useAuth.ts` — sessão do usuário (restauração, listener de mudanças e logout) sobre o SDK do Supabase.
- `src/lib/api/` — única camada que fala com o banco/Storage no modo remoto; `mappers.ts` converte snake_case ↔ camelCase.
- `supabase/migrations/` — esquema relacional, Row Level Security, função `submit_rsvp` e bucket de capas.

## Pré-requisitos

- **Node.js** `^20.19.0 || >=22.12.0` (exigido pelo Vite 7 — `engines` declarado no pacote do Vite).
- **npm** (verificado com a versão 11 neste ambiente).
- **Git**, para clonar o repositório.
- **Conta no [Supabase](https://supabase.com)** — opcional: sem ela, o app roda no modo demo (`localStorage`). Necessária apenas para usar autenticação, dados remotos e Storage de verdade.
- **Conta na [Vercel](https://vercel.com)** — apenas se for fazer o deploy (opcional; passos em `docs/deploy-vercel.md`).

## Como executar o projeto

```bash
# 1. Clonar o repositório
git clone https://github.com/leticiafonsecaa/festao.git
cd festao

# 2. Instalar dependências
npm install

# 3. (Opcional) configurar o Supabase — ver "Configuração do ambiente"
cp .env.example .env.local
# edite .env.local com a URL e a chave públicas do seu projeto

# 4. Iniciar em desenvolvimento
npm run dev
# a aplicação abre em http://localhost:5173
```

### Comandos disponíveis

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o servidor de desenvolvimento do Vite (HMR) |
| `npm run build` | Gera o build de produção em `dist/` |
| `npm run preview` | Serve localmente o build de `dist/` |
| `npm run typecheck` | Verifica tipos com `tsc -p tsconfig.app.json --noEmit` (sem gerar arquivos) |
| `npm test` | Executa a suíte de testes uma vez (Vitest, `vitest run`) |
| `npm run test:watch` | Executa os testes em modo watch |

Verificação registrada neste ambiente: `npm run typecheck` sem erros, `npm test` com **4 arquivos / 16 testes aprovados** e `npm run build` concluído com sucesso (com o aviso de bundle >500 kB, tratado em [Limitações e próximos passos](#limitações-e-próximos-passos)).

> Não existe script de lint no `package.json`. O arquivo `eslint.config.js` é resquício do template e o ESLint **não** está entre as dependências instaladas — não há como executar lint sem antes adicioná-lo.

## Configuração do ambiente

O projeto usa apenas **variáveis públicas** do cliente (o Vite embute no bundle tudo que começa com `VITE_`). O arquivo `.env.example` na raiz documenta os nomes:

```bash
# .env.example (somente placeholders — copie para .env.local)
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=cole-aqui-a-publishable-key-do-projeto
```

**Como utilizar:**

1. Crie `.env.local` a partir do exemplo: `cp .env.example .env.local` — o `.gitignore` ignora `.env*`, exceto o exemplo, então valores reais nunca entram no Git.
2. Preencha os dois valores com os dados do seu projeto Supabase (*Settings → API*: Project URL e publishable key).
3. Reinicie `npm run dev` após alterar variáveis (o Vite só lê arquivos `.env` na inicialização).

**Regras de segurança (documentadas no próprio `.env.example`):**

- A publishable key (`sb_publishable_*`) é pública por natureza e segura no frontend desde que as políticas RLS estejam aplicadas.
- Chaves secretas (`sb_secret_*` / `service_role`) **nunca** devem aparecer no `.env`, no Git ou em qualquer variável `VITE_*`.
- Sem as duas variáveis, o app exibe um aviso no console e opera no modo demo (`localStorage`), sem autenticação funcional nem dados remotos.

**Configurações externas necessárias** (guia completo em `docs/supabase-setup.md`):

- Aplicar as 4 migrations em ordem no SQL Editor do Supabase (ou via Supabase CLI: `supabase link --project-ref <ref>` + `supabase db push`).
- Auth → Providers → Email habilitado com **Confirm email** ON.
- Auth → URL Configuration: Site URL e Redirect URLs incluindo `http://localhost:5173/**` e o domínio de produção (o app usa `window.location.origin` como retorno de confirmação/recuperação de senha).

## Banco de dados e integrações

### Supabase (modo remoto)

Quando `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` estão definidas, a aplicação usa o Supabase como backend:

- **Tabelas** (criadas em `supabase/migrations/20261011180000_init.sql`): `profiles`, `events`, `event_personalization`, `guests`, `gifts`, `gift_options` e `rsvp_log`.
- **Row Level Security** (`20261011190000_rls.sql`): RLS habilitado em todas as tabelas; o dono só acessa os próprios eventos; o anônimo só lê as **views** de eventos publicados (sem PII) e escreve RSVP através da função `submit_rsvp`.
- **RSVP público** (`20261012083000_rsvp.sql`): função `security definer` com validações, upsert por nome normalizado e rate limit de 10 envios por IP/hora.
- **Storage** (`20261012103000_storage.sql`): bucket público `covers` (leitura por URL, escrita restrita ao dono, limite de 5 MB, formatos jpg/png/webp) para as capas dos eventos.
- **Camada de aplicação**: `src/lib/supabase.ts` (cliente), `src/lib/api/eventsApi.ts` (CRUD do dono), `src/lib/api/publicApi.ts` (leitura pública por slug + RPC de RSVP) e `src/lib/api/coverStorage.ts` (upload/remoção de capas).

### Modo demo (sem variáveis)

- Persistência local via Zustand `persist` na chave `festsao-storage` do `localStorage`, com sincronização entre abas (listener do evento `storage`).
- Limitação aceita: a página pública só enxerga os dados do mesmo navegador/perfil.
- A capa fica como data URL no próprio `localStorage`.

> **Importante:** as migrations foram versionadas no repositório, mas, segundo `docs/supabase-setup.md` e `docs/relatorio-final-fase-6.md`, ainda **não foram aplicadas em um projeto Supabase real** — a validação de RLS, autenticação e RSVP entre dispositivos está pendente. Não há outro serviço externo, API de terceiros ou webhook integrado.

## Limitações e próximos passos

**Limitações atuais (verificadas na análise do código):**

- **Validação em ambiente real pendente:** migrations, políticas RLS, confirmação de e-mail, RSVP entre dois dispositivos e upload de capas ainda não foram testados em um projeto Supabase real (conforme `docs/supabase-setup.md`); o deploy na Vercel também não foi executado (`docs/deploy-vercel.md`).
- **Bundle grande:** `npm run build` emite o aviso `Some chunks are larger than 500 kB` (≈751 kB minificado / ≈210 kB gzip), puxado por `framer-motion`, `@supabase/supabase-js` e `zod`. Code-split não foi feito.
- **Modo demo restrito ao navegador:** sem Supabase, os dados (inclusive a página pública `/e/<slug>`) só existem no navegador que os criou.
- **Conteúdo demonstrativo:** serviços, perfil de profissionais e assistente usam dados/respostas fixos — não são integrações reais.
- **Testes de integração ausentes:** a suíte cobre apenas funções puras, a store em modo demo e o guarda de rotas; não há testes contra o Supabase nem pipeline de CI.
- **Dependências ociosas:** várias dependências declaradas no `package.json` não são importadas em `src/` (ver [Tecnologias utilizadas](#tecnologias-utilizadas)).
- **Sem script de lint:** o ESLint não está instalado, apesar do `eslint.config.js` existir.

**Sugestões de melhoria (não são funcionalidades existentes):**

- Aplicar as migrations num projeto Supabase de teste e seguir os checklists de `docs/supabase-setup.md`.
- Concluir o deploy na Vercel conforme `docs/deploy-vercel.md` e executar o smoke test pós-deploy.
- Adicionar code-split (lazy loading das rotas) para reduzir o bundle inicial.
- Remover ou justificar as dependências não usadas e habilitar ESLint com um script `npm run lint`.
- Implementar, se o produto evoluir, as funcionalidades hoje apenas citadas pelo assistente (orçamento, links de convite individuais).

## Contribuição

Contribuições são bem-vindas! Fluxo básico:

1. Faça um fork do repositório e crie uma branch para a mudança (`git checkout -b feat/minha-melhoria`).
2. Mantenha o padrão do projeto: TypeScript, componentes funcionais, Tailwind para estilos e Zustand para estado.
3. Antes de abrir o Pull Request, valide localmente:
   ```bash
   npm run typecheck
   npm test
   npm run build
   ```
4. Descreva claramente o que a mudança faz e como foi testada.
5. Não commite arquivos `.env*` preenchidos, chaves ou credenciais.

## Documentação útil

- `docs/supabase-setup.md` — guia passo a passo do Supabase, checklists de aceitação e limitações conhecidas.
- `docs/deploy-vercel.md` — roteiro de deploy, variáveis de ambiente na Vercel e smoke test.
- `docs/relatorio-final-fase-6.md` — relatório da infraestrutura Supabase (escopo, arquivos e pendências).

