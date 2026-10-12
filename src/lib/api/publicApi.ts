// Leituras públicas (anônimas) da página /e/<slug> e envio de RSVP.
// Usa as views definer de 20261011190000_rls.sql (somente eventos publicados, sem PII)
// e a função submit_rsvp de 20261012083000_rsvp.sql (único caminho de escrita anônima).

import { supabase } from '../supabase';
import type { Event } from '../../store/useStore';
import {
  defaultPersonalization,
  mapEvent,
  type EventRow,
  type GiftOptionRow,
  type GiftRow,
  type PersonalizationRow,
} from './mappers';

interface PublicEventRow {
  id: string;
  name: string;
  type: Event['type'];
  date: string | null;
  time: string | null;
  venue: string;
  city: string;
  description: string;
  hosts: string;
  slug: string | null;
  published_at: string | null;
  created_at: string;
}

export async function fetchPublicEventBySlug(slug: string): Promise<Event | null> {
  const { data: eventRow, error } = await supabase
    .from('public_events')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  if (!eventRow) return null;

  const [persRes, giftsRes] = await Promise.all([
    supabase
      .from('public_event_personalization')
      .select('*')
      .eq('event_id', (eventRow as PublicEventRow).id)
      .maybeSingle(),
    supabase.from('public_gifts').select('*, gift_options:public_gift_options(*)').eq(
      'event_id',
      (eventRow as PublicEventRow).id
    ),
  ]);
  if (persRes.error) throw persRes.error;
  if (giftsRes.error) throw giftsRes.error;

  // Reaproveita o mapper do domínio montando uma linha composta; guests fica
  // vazio de propósito — a página pública nunca lista pessoas.
  const composed: EventRow = {
    ...(eventRow as PublicEventRow),
    published: true,
    slug: (eventRow as PublicEventRow).slug ?? '',
    personalization: (persRes.data as PersonalizationRow | null) ?? {
      event_id: (eventRow as PublicEventRow).id,
      ...toPersRow(defaultPersonalization),
    },
    guests: [],
    gifts: (giftsRes.data as GiftRow[]).map((g) => ({
      ...g,
      gift_options: (g.gift_options as unknown as GiftOptionRow[]) ?? [],
    })),
  };
  return mapEvent(composed);
}

function toPersRow(p: Event['personalization']) {
  return {
    primary_color: p.primaryColor,
    secondary_color: p.secondaryColor,
    hero_image_url: p.heroImage,
    tagline: p.tagline,
    show_guest_count: p.showGuestCount,
    show_gift_list: p.showGiftList,
    show_rsvp: p.showRsvp,
    show_countdown: p.showCountdown,
  };
}

export interface PublicRsvpPayload {
  name: string;
  choice: 'confirmed' | 'declined';
  email?: string;
  phone?: string;
  plusOne?: boolean;
  plusOneName?: string;
  notes?: string;
}

// Identificador anônimo do visitante (surrogato de IP para o rate limit da
// função submit_rsvp). Guardado no localStorage do visitante.
export function visitorId(): string {
  const KEY = 'festsao-vid';
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

export async function submitRsvpRpc(slug: string, payload: PublicRsvpPayload): Promise<void> {
  const { error } = await supabase.rpc('submit_rsvp', {
    p_event_slug: slug,
    p_name: payload.name,
    p_choice: payload.choice,
    p_email: payload.email ?? '',
    p_phone: payload.phone ?? '',
    p_plus_one: payload.plusOne ?? false,
    p_plus_one_name: payload.plusOneName ?? null,
    p_notes: payload.notes ?? null,
    p_ip_hash: visitorId(),
  });
  if (error) throw error;
}
