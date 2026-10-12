-- 20261012103000_storage.sql — Bucket de capas (Supabase Storage). ADITIVA.
-- Não altera 20261011180000_init – 20261012083000_rsvp; a coluna
-- hero_image_url (init) já persiste a URL.
--
-- Identificação (revisada na auditoria final da Fase 6):
--   • Evento:PK events.id (uuid gerado pelo banco).
--   • Dono:events.user_id = auth.uid() (garantido por RLS na 0002).
--   • Arquivo: covers/{user_id}/{event_id}.jpg — 1º segmento do path é o
--     user_id (namespaces isolados por usuário), 2º é o event_id.
--
-- Leitura pública:pela flag de bucket público (URL
-- /storage/v1/object/public/covers/...), SEM policy de SELECT para anon —
-- anônimos NÃO conseguem list() nem consultar metadados via API. (Doc
-- Supabase Storage: "This is not needed for public buckets, as they are
-- already publicly accessible".)
--
-- SELECT do dono:necessário para o upsert substituir capa existente. Doc
-- Supabase Storage: "To allow overwriting files using the upsert
-- functionality you will need to additionally grant SELECT and UPDATE
-- permissions". A policy covers_owner_select abaixo é estritamente ao
-- namespace do próprio usuário — não abre listagem pública (anon continua
-- sem policy de SELECT) nem acesso a capas de terceiros. Refinamento
-- futuro: escopar por operação com storage.allow_any_operation(), após
-- validar o nome exato da operação de upsert em projeto real.
--
-- INSERT valida, além do namespace, a propriedade REAL do evento em
-- public.events (helper is_event_owner da 0002) — impede arquivos órfãos
-- apontando para eventos inexistentes ou de terceiros. UPDATE/DELETE usam
-- apenas o check de namespace: um arquivo só existe no diretório do dono
-- que o criou (INSERT já validado), e o namespace isola usuários.
--
-- Upsert: o endpoint de upsert do Storage exige INSERT (objeto novo) ou
-- UPDATE (objeto existente) — ambos restritos ao dono pelas policies abaixo.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'covers',
  'covers',
  true,                 -- leitura via URL pública (página do evento)
  5242880,              -- 5 MB (compressImage do cliente já entrega ~500 KB)
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- LIMITAÇÃO DE IDEMPOTÊNCIA: se o bucket 'covers' já existir com outra
-- configuração (ex.: privado, sem limite de tamanho ou com outros tipos),
-- o comando acima NÃO a atualiza — a migration "pula" silenciosamente.
-- Verifique em Dashboard → Storage → covers:
--   público = sim · limite 5 MB · tipos image/jpeg, image/png, image/webp.
-- Se necessário, ajuste no painel ou descomente:
-- update storage.buckets
-- set public = true,
--     file_size_limit = 5242880,
--     allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
-- where id = 'covers';

-- Helper: extrai o event_id do path com segurança (CASE garante avaliação
-- condicional — sem tentar cast de segmento que não é uuid). Execução
-- restrita: o papel anon não precisa disto.
create or replace function public.covers_path_event_id(p_name text)
returns uuid
language sql
immutable
parallel safe
as $$
  select case
    when (storage.foldername(p_name))[2]
      ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then ((storage.foldername(p_name))[2])::uuid
    else null
  end;
$$;

revoke execute on function public.covers_path_event_id(text) from public, anon;
grant execute on function public.covers_path_event_id(text) to authenticated;

-- Upload: só o dono, só para eventos reais dele, só imagens jpeg/png/webp.
create policy "covers_owner_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'covers'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_event_owner(public.covers_path_event_id(name))
  and name ~* '\.(jpe?g|png|webp)$'
);

-- SELECT do dono: exigido pelo upsert (doc oficial — ver cabeçalho).
-- Escopo mínimo: apenas o namespace do próprio usuário. Não há policy de
-- SELECT para anon (list() público continua negado) e o dono só enxerga
-- os próprios arquivos (nunca capas de terceiros).
create policy "covers_owner_select" on storage.objects
for select to authenticated
using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);

-- Substituição (upsert): namespace do dono (objeto já existe e foi criado
-- pelo INSERT validado acima).
create policy "covers_owner_update" on storage.objects
for update to authenticated
using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text)
with check (
  bucket_id = 'covers'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Exclusão: apenas o dono do namespace.
create policy "covers_owner_delete" on storage.objects
for delete to authenticated
using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Endurecimento de EXECUTE (auditoria final da Fase 6)
-- ---------------------------------------------------------------------------
-- CREATE FUNCTION concede EXECUTE TO PUBLIC por padrão. Como as revogações
-- da 0002 ocorreram ANTES da criação de is_event_owner/is_gift_owner, esses
-- helpers (e os utilitários da 0001) nasceram com EXECUTE TO PUBLIC — e
-- revogar de anon/authenticated não remove o grant de PUBLIC, do qual ambos
-- herdam. Sem o ajuste abaixo, anon executaria helpers (inofensivos, pois só
-- retornam booleanos escopados ao próprio auth.uid() ou operam strings, mas
-- desnecessários pelo princípio do menor privilégio).
--
-- EXECUTE final por papel (instalação limpa), após esta seção:
--   • anon: SOMENTE submit_rsvp (RSVP público, decisão K8);
--   • authenticated: f_unaccent + normalize_name (coluna gerada
--     guests.name_normalized é computada no INSERT do dono),
--     is_event_owner + is_gift_owner (quals das policies de tabelas e do
--     Storage — grants já existentes na 0002), submit_rsvp,
--     covers_path_event_id;
--   • funções de trigger (set_updated_at/handle_new_user/handle_new_event):
--     intocadas — executam pelo mecanismo de trigger, sem chamada RPC direta.
revoke execute on function public.f_unaccent(text) from public;
revoke execute on function public.normalize_name(text) from public;
revoke execute on function public.is_event_owner(uuid) from public;
revoke execute on function public.is_gift_owner(uuid) from public;

grant execute on function public.f_unaccent(text) to authenticated;
grant execute on function public.normalize_name(text) to authenticated;
-- (is_event_owner/is_gift_owner já têm grant a authenticated na 0002;
--  submit_rsvp e covers_path_event_id já estão corretos na 0003/0004.)
