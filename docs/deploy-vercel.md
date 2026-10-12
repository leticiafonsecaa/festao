# Deploy na Vercel — Festão (resumo técnico)

Documento preparado para a **Fase 8**. Nenhum passo aqui foi executado —
tudo depende de ações suas no painel da Vercel e do GitHub. Não exponha
chaves secretas em nenhum momento; as únicas variáveis do frontend são
públicas por natureza (`VITE_*`).

## 1. Pré-condições

- [ ] Projeto Supabase criado e migrations `0001`–`0003` aplicadas
      (`docs/supabase-setup.md` seções 1–2).
- [ ] Auth configurado com confirmação de e-mail ON (seção 3 do guia).
- [ ] Checklists das seções 3 e 7 do guia aprovados em dev.
- [ ] Repositório canônico confirmado (**K6**): o já existente no GitHub
      (`origin`), branch `main`. Não criar novo repositório nem reescrever
      histórico.

## 2. Conexão com a Vercel

1. Acesse <https://vercel.com> → **Add New → Project** → *Import Git
   Repository* → selecione o repositório canônico (permissão do GitHub
   necessária — ação sua).
2. A Vercel detecta o **Vite** automaticamente. Configuração esperada
   (não exige `vercel.json` novo — o arquivo atual com rewrite SPA já
   existe e basta):
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install` (padrão)

## 3. Variáveis de ambiente

Em *Project → Settings → Environment Variables* (somente valores
públicos — publishable key é segura no cliente com RLS ativo):

| Nome | Valor | Onde obter |
|---|---|---|
| `VITE_SUPABASE_URL` | Project URL | Supabase → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | publishable key (`sb_publishable_*`; anon legada válida como alternativa temporária) | Supabase → Settings → API |

- Marcar para **Production, Preview e Development**.
- **Nunca** adicionar `service_role` ou qualquer `SUPABASE_SECRET` aqui —
  variáveis `VITE_*` são embutidas no bundle entregue ao navegador.

## 4. Ambientes e estratégia de deploy

- `main` → deploy automático de **Produção** após cada merge.
- Qualquer branch → **Preview** automático com URL própria
  (`https://<branch>-<projeto>.vercel.app`) — use o preview para rodar os
  checklists antes do merge.
- Estratégia recomendada: desenvolver em branches
  (`feat/…`, `fix/…`), validar no preview, abrir PR, revisar e só então
  merge em `main`.
- **Rollback**: Vercel mantém histórico de deploys → *Deployments →
  Instant Rollback* para a versão anterior. As migrations são **aditivas**
  (nenhuma coluna existente é alterada de forma incompatível), então
  reverter o frontend não exige reverter o banco.

## 5. Domínio e callbacks de autenticação

- **Domínio**: Settings → Domains (ação sua; opcional — o
  `<projeto>.vercel.app` funciona para testes).
- Após definir o domínio final, atualizar no Supabase
  (*Authentication → URL Configuration*):
  - **Site URL**: `https://<dominio-de-producao>`
  - **Redirect URLs**: `http://localhost:5173/**`,
    `https://<projeto>.vercel.app/**`, `https://<dominio>/**`
- O app usa `window.location.origin` como retorno de confirmação/
  recuperação de senha — por isso **toda origem usada em teste** (preview
  incluída) precisa estar na allow-list do Supabase, senão o link de
  confirmação falha com "redirect not allowed".

## 6. Sincronização migrations ↔ frontend

Ordem segura para qualquer mudança de schema futura:

1. Migration aplicada no Supabase (aditiva, com defaults).
2. Deploy do frontend que passa a usar a coluna/tabela.
3. Rollback de frontend sempre possível; rollback de migration só se
   aditiva e reversível (evitar `drop` sem consulta).

## 7. Smoke test pós-deploy (produção)

- [ ] Landing carrega; build de produção sem erros de console.
- [ ] Cadastro → e-mail de confirmação chega → link funciona no domínio
      de produção → login entra.
- [ ] Criar evento, adicionar convidado e presente, personalizar e
      publicar.
- [ ] Abrir `/e/<slug>` em outro dispositivo/rede anônima; RSVP chega no
      painel.
- [ ] Logout/login em outro navegador reflete os dados (multi-dispositivo).
- [ ] Recuperar senha de ponta a ponta no domínio de produção.

## 8. Checklist de ações manuais suas (resumo)

1. Conta Supabase + projeto novo + migrations aplicadas.
2. Auth: confirm email ON; Site URL e Redirect URLs.
3. SMTP próprio recomendado para produção (limites do provedor padrão).
4. Vercel: importar repositório canônico, definir as duas env vars.
5. (Opcional) domínio custom + atualizar allow-list no Supabase.
6. Aprovar checklists das seções 3 e 7 do `supabase-setup.md`.

## 9. O que NÃO fazer

- Não desabilitar RLS para "facilitar" testes em produção.
- Não commitar `.env.local`, chaves ou tokens de qualquer tipo.
- Não criar um `vercel.json` adicional: o atual já cobre o rewrite SPA.
- Não fazer push em `main` sem passar por preview/PR (fluxo da seção 4).
