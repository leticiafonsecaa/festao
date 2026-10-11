-- 0001_init.sql — Schema inicial do Festão (Supabase / PostgreSQL).
-- NÃO executar no navegador nem no app: aplicar via Supabase CLI ou SQL editor.
-- Ordem: 0001_init.sql → 0002_rls.sql → 0003_rsvp.sql

create extension if not exists pgcrypto;
create extension if not exists unaccent;

-- unaccent não é "immutable" nativamente; wrapper declarado immutable para uso
-- em colunas geradas (mesma semântica de normalizeName() do frontend).
create or replace function public.f_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
as $$ select public.unaccent('public.unaccent', $1) $$;

-- Normalização de nome de convidado (espelha src/lib/eventUtils.ts normalizeName).
create or replace function public.normalize_name(p_name text)
returns text
language sql
immutable
parallel safe
strict
as $$ select regexp_replace(lower(public.f_unaccent(trim(p_name))), '\s+', ' ', 'g') $$;

-- ---------------------------------------------------------------------------
-- profiles: registro básico criado automaticamente no signup
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- events: um evento pertence a um usuário autenticado
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  type text not null default 'outro'
    check (type in ('casamento', '15 anos', 'aniversario', 'corporativo', 'outro')),
  date date,
  time time,
  venue text not null default '',
  city text not null default '',
  description text not null default '',
  hosts text not null default '',
  published boolean not null default false,
  slug text unique,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_user_id_idx on public.events (user_id);
create index events_published_idx on public.events (published) where published;

-- ---------------------------------------------------------------------------
-- event_personalization: 1:1 com events (capa salva como URL, não data URL)
-- ---------------------------------------------------------------------------
create table public.event_personalization (
  event_id uuid primary key references public.events(id) on delete cascade,
  primary_color text not null default '#D4A89C'
    check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  secondary_color text not null default '#C47D6B'
    check (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  hero_image_url text not null default '',
  tagline text not null default 'Celebre conosco este momento especial',
  show_guest_count boolean not null default true,
  show_gift_list boolean not null default true,
  show_rsvp boolean not null default true,
  show_countdown boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- guests: lista de convidados por evento
-- ---------------------------------------------------------------------------
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  name_normalized text generated always as (public.normalize_name(name)) stored,
  email text not null default '',
  phone text not null default '',
  rsvp text not null default 'pending'
    check (rsvp in ('pending', 'confirmed', 'declined')),
  plus_one boolean not null default false,
  plus_one_name text,
  table_name text,
  notes text,
  responded_at timestamptz,
  responded_via text check (responded_via in ('host', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index guests_event_id_idx on public.guests (event_id);
create unique index guests_event_name_norm_uidx
  on public.guests (event_id, name_normalized);

-- ---------------------------------------------------------------------------
-- gifts + gift_options: lista de presentes com opções de loja/preço
-- ---------------------------------------------------------------------------
create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 300),
  category text not null default 'outro',
  image_url text not null default '',
  received boolean not null default false,
  received_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gifts_event_id_idx on public.gifts (event_id);

create table public.gift_options (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts(id) on delete cascade,
  store text not null default '',
  price numeric(12, 2) not null default 0 check (price >= 0),
  url text not null default ''
);

create index gift_options_gift_id_idx on public.gift_options (gift_id);

-- ---------------------------------------------------------------------------
-- rsvp_log: trilha simples para rate limiting de RSVP anônimo
-- ---------------------------------------------------------------------------
create table public.rsvp_log (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  ip_hash text not null default '',
  created_at timestamptz not null default now()
);

create index rsvp_log_ip_created_idx on public.rsvp_log (ip_hash, created_at);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create trigger personalization_updated_at
  before update on public.event_personalization
  for each row execute function public.set_updated_at();

create trigger guests_updated_at
  before update on public.guests
  for each row execute function public.set_updated_at();

create trigger gifts_updated_at
  before update on public.gifts
  for each row execute function public.set_updated_at();

-- Perfil criado junto com o usuário no signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Personalização padrão criada junto com o evento.
create or replace function public.handle_new_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.event_personalization (event_id) values (new.id);
  return new;
end;
$$;

create trigger on_event_created
  after insert on public.events
  for each row execute function public.handle_new_event();


