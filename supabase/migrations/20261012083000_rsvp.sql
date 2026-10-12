-- 20261012083000_rsvp.sql — Caminho único de escrita anônima (RSVP da página pública).
-- Decisão aprovada (K8): upsert por nome normalizado + rate limit por IP.
-- A função é SECURITY DEFINER: executa com privilégio do owner e valida tudo
-- internamente; o cliente nunca escreve diretamente na tabela guests.

create or replace function public.submit_rsvp(
  p_event_slug text,
  p_name text,
  p_choice text,
  p_email text default '',
  p_phone text default '',
  p_plus_one boolean default false,
  p_plus_one_name text default null,
  p_notes text default null,
  p_ip_hash text default ''
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_name_norm text;
  v_guest_id uuid;
  v_recent int;
  constant RATE_LIMIT_WINDOW_MINUTES int := 60;
  constant RATE_LIMIT_MAX_PER_WINDOW int := 10;
begin
  -- Validações de entrada
  if p_choice not in ('confirmed', 'declined') then
    raise exception 'invalid_choice';
  end if;

  p_name := trim(coalesce(p_name, ''));
  if char_length(p_name) < 1 or char_length(p_name) > 200 then
    raise exception 'invalid_name';
  end if;

  if char_length(coalesce(p_email, '')) > 254 or char_length(coalesce(p_phone, '')) > 40 then
    raise exception 'invalid_contact';
  end if;

  if char_length(coalesce(p_notes, '')) > 1000 or char_length(coalesce(p_plus_one_name, '')) > 200 then
    raise exception 'invalid_fields';
  end if;

  -- Evento deve existir e estar publicado
  select e.id into v_event_id
  from public.events e
  where e.slug = p_event_slug and e.published = true;

  if v_event_id is null then
    raise exception 'event_not_found';
  end if;

  -- Rate limit: máximo de envios por (evento, ip_hash) na janela
  if p_ip_hash <> '' then
    select count(*) into v_recent
    from public.rsvp_log l
    where l.event_id = v_event_id
      and l.ip_hash = p_ip_hash
      and l.created_at > now() - (RATE_LIMIT_WINDOW_MINUTES || ' minutes')::interval;

    if v_recent >= RATE_LIMIT_MAX_PER_WINDOW then
      raise exception 'rate_limited';
    end if;
  end if;

  -- Upsert por nome normalizado (mesma semântica do frontend atual)
  v_name_norm := public.normalize_name(p_name);

  select g.id into v_guest_id
  from public.guests g
  where g.event_id = v_event_id and g.name_normalized = v_name_norm;

  if v_guest_id is not null then
    update public.guests g
    set rsvp = p_choice,
        plus_one = p_plus_one,
        plus_one_name = nullif(trim(coalesce(p_plus_one_name, '')), ''),
        notes = nullif(trim(coalesce(p_notes, '')), ''),
        responded_at = now(),
        responded_via = 'public',
        email = case when trim(coalesce(p_email, '')) <> '' then trim(p_email) else g.email end,
        phone = case when trim(coalesce(p_phone, '')) <> '' then trim(p_phone) else g.phone end
    where g.id = v_guest_id;
  else
    insert into public.guests (
      event_id, name, email, phone, rsvp, plus_one, plus_one_name, notes,
      responded_at, responded_via
    ) values (
      v_event_id, p_name,
      trim(coalesce(p_email, '')), trim(coalesce(p_phone, '')),
      p_choice, p_plus_one,
      nullif(trim(coalesce(p_plus_one_name, '')), ''),
      nullif(trim(coalesce(p_notes, '')), ''),
      now(), 'public'
    );
  end if;

  -- Trilha para o rate limit (não bloqueia o RSVP se falhar)
  begin
    insert into public.rsvp_log (event_id, ip_hash) values (v_event_id, p_ip_hash);
  exception when others then
    null;
  end;
end;
$$;

-- Qualquer cliente (anônimo incluído) pode executar; a função internamente
-- valida evento publicado, campos e rate limit.
revoke all on function public.submit_rsvp(text, text, text, text, text, boolean, text, text, text) from public;
grant execute on function public.submit_rsvp(text, text, text, text, text, boolean, text, text, text) to anon, authenticated;
