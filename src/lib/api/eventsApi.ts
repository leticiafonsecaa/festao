// Operações do dono (autenticado) sobre eventos, convidados e presentes.
// Todas dependem das policies RLS de 0002_rls.sql — o banco filtra por
// auth.uid(); nada aqui envia user_id manualmente em inserts (a policy
// confirma o dono no WITH CHECK).

import { supabase } from '../supabase';
import type { Event, GiftItem, Guest } from '../../store/useStore';
import {
  EVENT_COLUMN_MAP,
  GIFT_COLUMN_MAP,
  GUEST_COLUMN_MAP,
  PERSONALIZATION_COLUMN_MAP,
  mapEvent,
  pickColumns,
  type EventRow,
} from './mappers';

const COMPOSED_SELECT =
  '*, personalization:event_personalization(*), guests(*), gifts(*, gift_options(*))';

export async function fetchMyEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select(COMPOSED_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as EventRow[]).map(mapEvent);
}

export type NewEventData = Pick<
  Event,
  'name' | 'type' | 'date' | 'time' | 'venue' | 'city' | 'description' | 'hosts'
>;

export async function insertEvent(input: NewEventData): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      name: input.name,
      type: input.type,
      date: input.date || null,
      time: input.time || null,
      venue: input.venue,
      city: input.city,
      description: input.description,
      hosts: input.hosts,
    })
    .select(COMPOSED_SELECT)
    .single();
  if (error) throw error;
  return mapEvent(data as EventRow);
}

export async function patchEvent(eventId: string, updates: Partial<Event>): Promise<void> {
  const payload = pickColumns(updates, EVENT_COLUMN_MAP);
  if (Object.keys(payload).length === 0) return;
  if ('date' in payload && !payload.date) payload.date = null;
  if ('time' in payload && !payload.time) payload.time = null;
  const { error } = await supabase.from('events').update(payload).eq('id', eventId);
  if (error) throw error;
}

export async function deleteEventRow(eventId: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) throw error;
}

export async function patchPersonalization(
  eventId: string,
  updates: Partial<Event['personalization']>
): Promise<void> {
  const payload = pickColumns(updates, PERSONALIZATION_COLUMN_MAP);
  if (Object.keys(payload).length === 0) return;
  const { error } = await supabase
    .from('event_personalization')
    .update(payload)
    .eq('event_id', eventId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Convidados
// ---------------------------------------------------------------------------
export type NewGuest = Omit<Guest, 'id'>;

export async function insertGuest(eventId: string, guest: NewGuest): Promise<Guest> {
  const { data, error } = await supabase
    .from('guests')
    .insert({
      event_id: eventId,
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      rsvp: guest.rsvp,
      plus_one: guest.plusOne,
      plus_one_name: guest.plusOneName ?? null,
      table_name: guest.table ?? null,
      notes: guest.notes ?? null,
      responded_at: guest.respondedAt ?? null,
      responded_via: guest.respondedVia ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  const row = data as { id: string };
  return { ...guest, id: row.id };
}

export async function patchGuest(
  eventId: string,
  guestId: string,
  updates: Partial<Guest>
): Promise<void> {
  const payload = pickColumns(updates, GUEST_COLUMN_MAP);
  if (Object.keys(payload).length === 0) return;
  const { error } = await supabase
    .from('guests')
    .update(payload)
    .eq('id', guestId)
    .eq('event_id', eventId);
  if (error) throw error;
}

export async function deleteGuest(eventId: string, guestId: string): Promise<void> {
  const { error } = await supabase
    .from('guests')
    .delete()
    .eq('id', guestId)
    .eq('event_id', eventId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Presentes (+ opções)
// ---------------------------------------------------------------------------
export type NewGift = Omit<GiftItem, 'id'>;

export async function insertGift(eventId: string, gift: NewGift): Promise<GiftItem> {
  const { data, error } = await supabase
    .from('gifts')
    .insert({
      event_id: eventId,
      name: gift.name,
      category: gift.category,
      image_url: gift.image,
      received: gift.received,
      received_by: gift.receivedBy ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  const row = data as { id: string };

  if (gift.options.length > 0) {
    const { error: optError } = await supabase.from('gift_options').insert(
      gift.options.map((o) => ({
        gift_id: row.id,
        store: o.store,
        price: o.price,
        url: o.url,
      }))
    );
    if (optError) throw optError;
  }

  return { ...gift, id: row.id };
}

export async function patchGift(
  eventId: string,
  giftId: string,
  updates: Partial<GiftItem>
): Promise<void> {
  const { options, ...rest } = updates;
  const payload = pickColumns(rest, GIFT_COLUMN_MAP);
  if (Object.keys(payload).length > 0) {
    const { error } = await supabase
      .from('gifts')
      .update(payload)
      .eq('id', giftId)
      .eq('event_id', eventId);
    if (error) throw error;
  }
  // Opções são substituídas integralmente quando enviadas (modelo da UI).
  if (options !== undefined) {
    const { error: delError } = await supabase.from('gift_options').delete().eq('gift_id', giftId);
    if (delError) throw delError;
    if (options.length > 0) {
      const { error: insError } = await supabase.from('gift_options').insert(
        options.map((o) => ({ gift_id: giftId, store: o.store, price: o.price, url: o.url }))
      );
      if (insError) throw insError;
    }
  }
}

export async function deleteGift(eventId: string, giftId: string): Promise<void> {
  const { error } = await supabase
    .from('gifts')
    .delete()
    .eq('id', giftId)
    .eq('event_id', eventId);
  if (error) throw error;
}
