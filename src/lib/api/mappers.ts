// Mapeia linhas do Supabase (snake_case) para os tipos do domínio do app
// (camelCase) — mantém as páginas e a store intactas.

import type {
  Event,
  EventPersonalization,
  GiftItem,
  GiftOption,
  Guest,
} from '../../store/useStore';

export interface PersonalizationRow {
  event_id: string;
  primary_color: string;
  secondary_color: string;
  hero_image_url: string;
  tagline: string;
  show_guest_count: boolean;
  show_gift_list: boolean;
  show_rsvp: boolean;
  show_countdown: boolean;
}

export interface GuestRow {
  id: string;
  event_id: string;
  name: string;
  email: string;
  phone: string;
  rsvp: Guest['rsvp'];
  plus_one: boolean;
  plus_one_name: string | null;
  table_name: string | null;
  notes: string | null;
  responded_at: string | null;
  responded_via: Guest['respondedVia'];
}

export interface GiftOptionRow {
  id: string;
  gift_id: string;
  store: string;
  price: number | string;
  url: string;
}

export interface GiftRow {
  id: string;
  event_id: string;
  name: string;
  category: string;
  image_url: string;
  received: boolean;
  received_by: string | null;
  gift_options?: GiftOptionRow[];
}

export interface EventRow {
  id: string;
  user_id?: string;
  name: string;
  type: Event['type'];
  date: string | null;
  time: string | null;
  venue: string;
  city: string;
  description: string;
  hosts: string;
  published: boolean;
  slug: string | null;
  published_at: string | null;
  created_at: string;
  personalization?: PersonalizationRow | PersonalizationRow[] | null;
  guests?: GuestRow[] | null;
  gifts?: GiftRow[] | null;
}

export const defaultPersonalization: EventPersonalization = {
  primaryColor: '#D4A89C',
  secondaryColor: '#C47D6B',
  heroImage: '',
  tagline: 'Celebre conosco este momento especial',
  showGuestCount: true,
  showGiftList: true,
  showRsvp: true,
  showCountdown: true,
};

function mapPersonalization(row: PersonalizationRow | null | undefined): EventPersonalization {
  if (!row) return { ...defaultPersonalization };
  return {
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    heroImage: row.hero_image_url,
    tagline: row.tagline,
    showGuestCount: row.show_guest_count,
    showGiftList: row.show_gift_list,
    showRsvp: row.show_rsvp,
    showCountdown: row.show_countdown,
  };
}

function mapGuest(row: GuestRow): Guest {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    rsvp: row.rsvp,
    plusOne: row.plus_one,
    plusOneName: row.plus_one_name ?? undefined,
    table: row.table_name ?? undefined,
    notes: row.notes ?? undefined,
    respondedAt: row.responded_at ?? undefined,
    respondedVia: row.responded_via ?? undefined,
  };
}

function mapOption(row: GiftOptionRow): GiftOption {
  return {
    store: row.store,
    price: Number(row.price) || 0,
    url: row.url,
  };
}

function mapGift(row: GiftRow): GiftItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    image: row.image_url,
    options: (row.gift_options ?? []).map(mapOption),
    received: row.received,
    receivedBy: row.received_by ?? undefined,
  };
}

export function mapEvent(row: EventRow): Event {
  const personalization = Array.isArray(row.personalization)
    ? row.personalization[0]
    : row.personalization;
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    date: row.date ?? '',
    time: row.time ? row.time.slice(0, 5) : '',
    venue: row.venue,
    city: row.city,
    description: row.description,
    hosts: row.hosts,
    guests: (row.guests ?? []).map(mapGuest),
    gifts: (row.gifts ?? []).map(mapGift),
    personalization: mapPersonalization(personalization),
    createdAt: row.created_at,
    published: row.published,
    slug: row.slug ?? '',
    publishedAt: row.published_at ?? undefined,
  };
}

// Campos do domínio → colunas do banco (para updates).
export const EVENT_COLUMN_MAP = {
  name: 'name',
  type: 'type',
  date: 'date',
  time: 'time',
  venue: 'venue',
  city: 'city',
  description: 'description',
  hosts: 'hosts',
  published: 'published',
  slug: 'slug',
  publishedAt: 'published_at',
} as const;

export const PERSONALIZATION_COLUMN_MAP = {
  primaryColor: 'primary_color',
  secondaryColor: 'secondary_color',
  heroImage: 'hero_image_url',
  tagline: 'tagline',
  showGuestCount: 'show_guest_count',
  showGiftList: 'show_gift_list',
  showRsvp: 'show_rsvp',
  showCountdown: 'show_countdown',
} as const;

export const GUEST_COLUMN_MAP = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  rsvp: 'rsvp',
  plusOne: 'plus_one',
  plusOneName: 'plus_one_name',
  table: 'table_name',
  notes: 'notes',
  respondedAt: 'responded_at',
  respondedVia: 'responded_via',
} as const;

export const GIFT_COLUMN_MAP = {
  name: 'name',
  category: 'category',
  image: 'image_url',
  received: 'received',
  receivedBy: 'received_by',
} as const;

export function pickColumns<T extends Record<string, unknown>>(
  updates: Partial<T>,
  map: Record<keyof T, string>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(map) as (keyof T)[]) {
    if (key in updates && updates[key] !== undefined) {
      out[map[key]] = updates[key];
    }
  }
  return out;
}
