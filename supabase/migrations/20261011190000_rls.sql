-- 20261011190000_rls.sql — Row Level Security do Festão.
-- Princípio: nenhuma tabela acessível pelo cliente opera sem política.
-- Anônimo só vê dados de eventos publicados (via views) e só escreve RSVP
-- através da função submit_rsvp() da 20261012083000_rsvp.sql.

-- ---------------------------------------------------------------------------
-- Habilitar RLS em todas as tabelas
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_personalization enable row level security;
alter table public.guests enable row level security;
alter table public.gifts enable row level security;
alter table public.gift_options enable row level security;
alter table public.rsvp_log enable row level security;

-- Revoga o acesso padrão concedido pelo Supabase no schema public.
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
revoke all on all functions in schema public from anon;
revoke all on all functions in schema public from authenticated;

-- ---------------------------------------------------------------------------
-- Helper: verificar propriedade de evento (security definer evita loop de RLS)
-- ---------------------------------------------------------------------------
create or replace function public.is_event_owner(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id and e.user_id = auth.uid()
  );
$$;

grant execute on function public.is_event_owner(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- profiles: o usuário lê/edita apenas o próprio perfil
-- ---------------------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- events: dono tem CRUD; anônimo/autenticado NÃO lê eventos não publicados.
-- Leitura pública acontece apenas pelas views definer mais abaixo.
-- ---------------------------------------------------------------------------
create policy "events_select_own" on public.events
  for select to authenticated using (user_id = auth.uid());

create policy "events_insert_own" on public.events
  for insert to authenticated with check (user_id = auth.uid());

create policy "events_update_own" on public.events
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "events_delete_own" on public.events
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- event_personalization: dono do evento correspondente
-- ---------------------------------------------------------------------------
create policy "personalization_select_own" on public.event_personalization
  for select to authenticated using (public.is_event_owner(event_id));

create policy "personalization_insert_own" on public.event_personalization
  for insert to authenticated with check (public.is_event_owner(event_id));

create policy "personalization_update_own" on public.event_personalization
  for update to authenticated
  using (public.is_event_owner(event_id)) with check (public.is_event_owner(event_id));

create policy "personalization_delete_own" on public.event_personalization
  for delete to authenticated using (public.is_event_owner(event_id));

-- ---------------------------------------------------------------------------
-- guests: dono tem CRUD; anônimo não tem acesso direto (só via função RSVP)
-- ---------------------------------------------------------------------------
create policy "guests_select_own" on public.guests
  for select to authenticated using (public.is_event_owner(event_id));

create policy "guests_insert_own" on public.guests
  for insert to authenticated with check (public.is_event_owner(event_id));

create policy "guests_update_own" on public.guests
  for update to authenticated
  using (public.is_event_owner(event_id)) with check (public.is_event_owner(event_id));

create policy "guests_delete_own" on public.guests
  for delete to authenticated using (public.is_event_owner(event_id));

-- ---------------------------------------------------------------------------
-- gifts: dono tem CRUD
-- ---------------------------------------------------------------------------
create policy "gifts_select_own" on public.gifts
  for select to authenticated using (public.is_event_owner(event_id));

create policy "gifts_insert_own" on public.gifts
  for insert to authenticated with check (public.is_event_owner(event_id));

create policy "gifts_update_own" on public.gifts
  for update to authenticated
  using (public.is_event_owner(event_id)) with check (public.is_event_owner(event_id));

create policy "gifts_delete_own" on public.gifts
  for delete to authenticated using (public.is_event_owner(event_id));

-- ---------------------------------------------------------------------------
-- gift_options: dono do evento correspondente ao gift
-- ---------------------------------------------------------------------------
create or replace function public.is_gift_owner(p_gift_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.gifts gi
    where gi.id = p_gift_id and public.is_event_owner(gi.event_id)
  );
$$;

grant execute on function public.is_gift_owner(uuid) to authenticated;

create policy "gift_options_select_own" on public.gift_options
  for select to authenticated using (public.is_gift_owner(gift_id));

create policy "gift_options_insert_own" on public.gift_options
  for insert to authenticated with check (public.is_gift_owner(gift_id));

create policy "gift_options_update_own" on public.gift_options
  for update to authenticated
  using (public.is_gift_owner(gift_id)) with check (public.is_gift_owner(gift_id));

create policy "gift_options_delete_own" on public.gift_options
  for delete to authenticated using (public.is_gift_owner(gift_id));

-- ---------------------------------------------------------------------------
-- rsvp_log: nenhuma política de cliente — só a função submit_rsvp (security
-- definer) escreve; leitura fica restrita ao dono do evento.
-- ---------------------------------------------------------------------------
create policy "rsvp_log_select_own" on public.rsvp_log
  for select to authenticated using (public.is_event_owner(event_id));

-- ---------------------------------------------------------------------------
-- Views públicas (definer): expõem SOMENTE eventos publicados e SOMENTE as
-- colunas necessárias — nunca user_id, e-mail, telefone ou received_by.
-- ---------------------------------------------------------------------------
create or replace view public.public_events as
select e.id, e.name, e.type, e.date, e.time, e.venue, e.city, e.description,
       e.hosts, e.slug, e.published_at, e.created_at
from public.events e
where e.published = true;

create or replace view public.public_event_personalization as
select p.event_id, p.primary_color, p.secondary_color, p.hero_image_url,
       p.tagline, p.show_guest_count, p.show_gift_list, p.show_rsvp,
       p.show_countdown
from public.event_personalization p
join public.events e on e.id = p.event_id
where e.published = true;

-- Contagens agregadas de RSVP para a página pública (sem listar pessoas).
create or replace view public.public_guest_counts as
select e.id as event_id,
       count(g.id) as total,
       count(*) filter (where g.rsvp = 'confirmed') as confirmed,
       count(*) filter (where g.rsvp = 'declined') as declined,
       count(*) filter (where g.rsvp = 'pending') as pending
from public.events e
left join public.guests g on g.event_id = e.id
where e.published = true
group by e.id;

create or replace view public.public_gifts as
select g.id, g.event_id, g.name, g.category, g.image_url, g.received
from public.gifts g
join public.events e on e.id = g.event_id
where e.published = true;

create or replace view public.public_gift_options as
select o.id, o.gift_id, o.store, o.price, o.url
from public.gift_options o
join public.gifts g on g.id = o.gift_id
join public.events e on e.id = g.event_id
where e.published = true;

-- ---------------------------------------------------------------------------
-- Grants das views (leitura anônima e autenticada)
-- ---------------------------------------------------------------------------
grant select on public.public_events to anon, authenticated;
grant select on public.public_event_personalization to anon, authenticated;
grant select on public.public_guest_counts to anon, authenticated;
grant select on public.public_gifts to anon, authenticated;
grant select on public.public_gift_options to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Grants de tabela para o usuário autenticado (RLS restringe às linhas do
-- dono; anon não recebe grant de tabela algum — só views + função de RSVP).
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.event_personalization to authenticated;
grant select, insert, update, delete on public.guests to authenticated;
grant select, insert, update, delete on public.gifts to authenticated;
grant select, insert, update, delete on public.gift_options to authenticated;
grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;
grant select on public.rsvp_log to authenticated;


