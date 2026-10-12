import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isSupabaseConfigured } from '../lib/supabase';
import * as api from '../lib/api/eventsApi';
import {
  fetchPublicEventBySlug,
  submitRsvpRpc,
  type PublicRsvpPayload,
} from '../lib/api/publicApi';
import { normalizeName } from '../lib/eventUtils';

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  rsvp: 'pending' | 'confirmed' | 'declined';
  plusOne: boolean;
  plusOneName?: string;
  table?: string;
  notes?: string;
  respondedAt?: string;
  respondedVia?: 'host' | 'public';
}

export interface GiftItem {
  id: string;
  name: string;
  category: string;
  image: string;
  options: GiftOption[];
  received: boolean;
  receivedBy?: string;
}

export interface GiftOption {
  store: string;
  price: number;
  url: string;
}

export interface EventPersonalization {
  primaryColor: string;
  secondaryColor: string;
  heroImage: string;
  tagline: string;
  showGuestCount: boolean;
  showGiftList: boolean;
  showRsvp: boolean;
  showCountdown: boolean;
}

export interface Event {
  id: string;
  name: string;
  type: 'casamento' | '15 anos' | 'aniversario' | 'corporativo' | 'outro';
  date: string;
  time: string;
  venue: string;
  city: string;
  description: string;
  hosts: string;
  guests: Guest[];
  gifts: GiftItem[];
  personalization: EventPersonalization;
  createdAt: string;
  published: boolean;
  slug: string;
  publishedAt?: string;
}

type NewEventInput = Omit<
  Event,
  'id' | 'createdAt' | 'guests' | 'gifts' | 'personalization' | 'published' | 'slug' | 'publishedAt'
>;

interface AppState {
  events: Event[];
  activeEventId: string | null;
  /** true quando a hidratação inicial terminou (Supabase ou demo). */
  hydrated: boolean;
  /** Último erro de sincronização com o banco (UI pode exibir). */
  lastSyncError: string | null;

  // Supabase
  hydrate: () => Promise<void>;
  loadPublicEvent: (slug: string) => Promise<void>;
  submitPublicRsvp: (slug: string, payload: PublicRsvpPayload) => Promise<void>;
  clearSyncError: () => void;
  resetLocalState: () => void;

  // Event actions
  createEvent: (event: NewEventInput) => Promise<string>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  setActiveEvent: (id: string | null) => void;
  getActiveEvent: () => Event | undefined;

  // Guest actions
  addGuest: (eventId: string, guest: Omit<Guest, 'id'>) => Promise<void>;
  updateGuest: (eventId: string, guestId: string, updates: Partial<Guest>) => Promise<void>;
  removeGuest: (eventId: string, guestId: string) => Promise<void>;

  // Gift actions
  addGift: (eventId: string, gift: Omit<GiftItem, 'id'>) => Promise<void>;
  updateGift: (eventId: string, giftId: string, updates: Partial<GiftItem>) => Promise<void>;
  removeGift: (eventId: string, giftId: string) => Promise<void>;
  toggleGiftReceived: (eventId: string, giftId: string, receivedBy?: string) => Promise<void>;

  // Personalization
  updatePersonalization: (eventId: string, updates: Partial<EventPersonalization>) => Promise<void>;
}

const defaultPersonalization: EventPersonalization = {
  primaryColor: '#D4A89C',
  secondaryColor: '#C47D6B',
  heroImage: '',
  tagline: 'Celebre conosco este momento especial',
  showGuestCount: true,
  showGiftList: true,
  showRsvp: true,
  showCountdown: true,
};

let idCounter = 0;
const genId = () => `${Date.now()}-${++idCounter}-${Math.random().toString(36).slice(2, 7)}`;

const migrate = (persistedState: unknown): { events: Event[]; activeEventId: string | null } => {
  const state = (persistedState ?? {}) as { events?: unknown; activeEventId?: unknown };
  const events = (Array.isArray(state.events) ? state.events : []).map((item) => {
    const e = (item ?? {}) as Partial<Omit<Event, 'personalization'>> & {
      personalization?: Partial<EventPersonalization> | null;
    };
    return {
      ...e,
      id: e.id ?? genId(),
      name: e.name ?? '',
      type: e.type ?? 'outro',
      date: e.date ?? '',
      time: e.time ?? '',
      venue: e.venue ?? '',
      city: e.city ?? '',
      description: e.description ?? '',
      hosts: e.hosts ?? '',
      guests: e.guests ?? [],
      gifts: e.gifts ?? [],
      personalization: { ...defaultPersonalization, ...(e.personalization ?? {}) },
      createdAt: e.createdAt ?? new Date().toISOString(),
      published: e.published ?? false,
      slug: e.slug ?? '',
    };
  });
  return {
    events,
    activeEventId: typeof state.activeEventId === 'string' ? state.activeEventId : null,
  };
};

const remote = () => isSupabaseConfigured();

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      // Filas de patch com debounce — PersonalizationPage digita carácter a
      // carácter; agrupa os campos alterados e envia 1 request após 400ms.
      const evQueue = new Map<string, Partial<Event>>();
      const psQueue = new Map<string, Partial<EventPersonalization>>();
      const timers = new Map<string, number>();

      const scheduleFlush = (key: string, flush: () => Promise<void>) => {
        const existing = timers.get(key);
        if (existing) window.clearTimeout(existing);
        timers.set(
          key,
          window.setTimeout(() => {
            timers.delete(key);
            void flush();
          }, 400)
        );
      };

      const flushEventPatch = async (eventId: string) => {
        const payload = evQueue.get(eventId);
        if (!payload) return;
        evQueue.delete(eventId);
        try {
          await api.patchEvent(eventId, payload);
        } catch {
          set({ lastSyncError: 'Não foi possível salvar o evento. Verifique sua conexão.' });
        }
      };

      const flushPersonalizationPatch = async (eventId: string) => {
        const payload = psQueue.get(eventId);
        if (!payload) return;
        psQueue.delete(eventId);
        try {
          await api.patchPersonalization(eventId, payload);
        } catch {
          set({ lastSyncError: 'Não foi possível salvar a personalização.' });
        }
      };

      const flushAllPending = async (eventId: string) => {
        for (const key of [`ev:${eventId}`, `ps:${eventId}`]) {
          const t = timers.get(key);
          if (t) {
            window.clearTimeout(t);
            timers.delete(key);
          }
        }
        await flushEventPatch(eventId);
        await flushPersonalizationPatch(eventId);
      };

      return {
        events: [],
        activeEventId: null,
        hydrated: false,
        lastSyncError: null,

        clearSyncError: () => set({ lastSyncError: null }),

        resetLocalState: () => set({ events: [] }),

        hydrate: async () => {
          if (!remote()) {
            set({ hydrated: true });
            return;
          }
          try {
            const events = await api.fetchMyEvents();
            set({ events, hydrated: true, lastSyncError: null });
          } catch {
            // Sem sessão/RLS devolve vazio; erro de rede mantém cache local.
            set({ hydrated: true, lastSyncError: 'Não foi possível carregar seus eventos.' });
          }
        },

        loadPublicEvent: async (slug) => {
          if (!remote()) return; // modo demo: evento já está no localStorage
          try {
            const event = await fetchPublicEventBySlug(slug);
            if (!event) return;
            set((state) => ({
              events: state.events.some((e) => e.id === event.id)
                ? state.events.map((e) => (e.id === event.id ? event : e))
                : [...state.events, event],
            }));
          } catch {
            set({ lastSyncError: 'Não foi possível carregar a página do evento.' });
          }
        },

        submitPublicRsvp: async (slug, payload) => {
          if (remote()) {
            try {
              await submitRsvpRpc(slug, payload);
            } catch (err) {
              const message =
                typeof err === 'object' && err !== null && 'message' in err
                  ? String((err as { message: unknown }).message)
                  : '';
              if (message.includes('rate_limited')) {
                throw new Error('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
              }
              if (message.includes('event_not_found')) {
                throw new Error('Esta página não está mais disponível.');
              }
              throw new Error('Não foi possível registrar sua resposta. Tente novamente.');
            }
            return;
          }

          // Modo demo (localStorage): mesma semântica anterior da página pública.
          const event = get().events.find((e) => e.slug === slug && e.published);
          if (!event) throw new Error('Esta página não está mais disponível.');
          const norm = normalizeName(payload.name);
          const respondedAt = new Date().toISOString();
          const base = {
            rsvp: payload.choice,
            plusOne: payload.plusOne ?? false,
            plusOneName: payload.plusOneName?.trim() || undefined,
            notes: payload.notes?.trim() || undefined,
            respondedAt,
            respondedVia: 'public' as const,
          };
          const existing = event.guests.find((g) => normalizeName(g.name) === norm);
          if (existing) {
            void get().updateGuest(event.id, existing.id, {
              ...base,
              ...(payload.email?.trim() ? { email: payload.email.trim() } : {}),
              ...(payload.phone?.trim() ? { phone: payload.phone.trim() } : {}),
            });
          } else {
            void get().addGuest(event.id, {
              ...base,
              name: payload.name.trim(),
              email: payload.email?.trim() ?? '',
              phone: payload.phone?.trim() ?? '',
            });
          }
        },

        // -----------------------------------------------------------------
        // Eventos
        // -----------------------------------------------------------------
        createEvent: async (eventData) => {
          if (remote()) {
            const created = await api.insertEvent(eventData);
            set((state) => ({ events: [created, ...state.events], activeEventId: created.id }));
            return created.id;
          }
          const id = genId();
          const newEvent: Event = {
            ...eventData,
            id,
            guests: [],
            gifts: [],
            personalization: { ...defaultPersonalization },
            createdAt: new Date().toISOString(),
            published: false,
            slug: '',
          };
          set((state) => ({
            events: [...state.events, newEvent],
            activeEventId: id,
          }));
          return id;
        },

        updateEvent: async (id, updates) => {
          // Otimista: UI responde na hora; sincroniza com debounce.
          set((state) => ({
            events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
          }));
          if (!remote()) return;
          const queued = evQueue.get(id) ?? {};
          evQueue.set(id, { ...queued, ...updates });
          scheduleFlush(`ev:${id}`, () => flushEventPatch(id));
        },

        deleteEvent: async (id) => {
          if (remote()) {
            await flushAllPending(id);
            try {
              await api.deleteEventRow(id);
            } catch {
              set({ lastSyncError: 'Não foi possível excluir o evento.' });
              return;
            }
          }
          set((state) => ({
            events: state.events.filter((e) => e.id !== id),
            activeEventId: state.activeEventId === id ? null : state.activeEventId,
          }));
        },

        setActiveEvent: (id) => set({ activeEventId: id }),

        getActiveEvent: () => {
          const state = get();
          return state.events.find((e) => e.id === state.activeEventId);
        },

        // -----------------------------------------------------------------
        // Convidados
        // -----------------------------------------------------------------
        addGuest: async (eventId, guestData) => {
          if (remote()) {
            const tempId = `temp-${genId()}`;
            set((state) => ({
              events: state.events.map((e) =>
                e.id === eventId
                  ? { ...e, guests: [...e.guests, { ...guestData, id: tempId }] }
                  : e
              ),
            }));
            try {
              const saved = await api.insertGuest(eventId, guestData);
              set((state) => ({
                events: state.events.map((e) =>
                  e.id === eventId
                    ? { ...e, guests: e.guests.map((g) => (g.id === tempId ? saved : g)) }
                    : e
                ),
              }));
            } catch {
              set((state) => ({
                events: state.events.map((e) =>
                  e.id === eventId
                    ? { ...e, guests: e.guests.filter((g) => g.id !== tempId) }
                    : e
                ),
                lastSyncError: 'Não foi possível adicionar o convidado.',
              }));
            }
            return;
          }
          const guest: Guest = { ...guestData, id: genId() };
          set((state) => ({
            events: state.events.map((e) =>
              e.id === eventId ? { ...e, guests: [...e.guests, guest] } : e
            ),
          }));
        },

        updateGuest: async (eventId, guestId, updates) => {
          set((state) => ({
            events: state.events.map((e) =>
              e.id === eventId
                ? { ...e, guests: e.guests.map((g) => (g.id === guestId ? { ...g, ...updates } : g)) }
                : e
            ),
          }));
          if (!remote()) return;
          try {
            await api.patchGuest(eventId, guestId, updates);
          } catch {
            set({ lastSyncError: 'Não foi possível salvar o convidado.' });
          }
        },

        removeGuest: async (eventId, guestId) => {
          set((state) => ({
            events: state.events.map((e) =>
              e.id === eventId ? { ...e, guests: e.guests.filter((g) => g.id !== guestId) } : e
            ),
          }));
          if (!remote()) return;
          try {
            await api.deleteGuest(eventId, guestId);
          } catch {
            set({ lastSyncError: 'Não foi possível remover o convidado.' });
          }
        },

        // -----------------------------------------------------------------
        // Presentes
        // -----------------------------------------------------------------
        addGift: async (eventId, giftData) => {
          if (remote()) {
            const tempId = `temp-${genId()}`;
            set((state) => ({
              events: state.events.map((e) =>
                e.id === eventId
                  ? { ...e, gifts: [...e.gifts, { ...giftData, id: tempId }] }
                  : e
              ),
            }));
            try {
              const saved = await api.insertGift(eventId, giftData);
              set((state) => ({
                events: state.events.map((e) =>
                  e.id === eventId
                    ? { ...e, gifts: e.gifts.map((g) => (g.id === tempId ? saved : g)) }
                    : e
                ),
              }));
            } catch {
              set((state) => ({
                events: state.events.map((e) =>
                  e.id === eventId ? { ...e, gifts: e.gifts.filter((g) => g.id !== tempId) } : e
                ),
                lastSyncError: 'Não foi possível adicionar o presente.',
              }));
            }
            return;
          }
          const gift: GiftItem = { ...giftData, id: genId() };
          set((state) => ({
            events: state.events.map((e) =>
              e.id === eventId ? { ...e, gifts: [...e.gifts, gift] } : e
            ),
          }));
        },

        updateGift: async (eventId, giftId, updates) => {
          set((state) => ({
            events: state.events.map((e) =>
              e.id === eventId
                ? { ...e, gifts: e.gifts.map((g) => (g.id === giftId ? { ...g, ...updates } : g)) }
                : e
            ),
          }));
          if (!remote()) return;
          try {
            await api.patchGift(eventId, giftId, updates);
          } catch {
            set({ lastSyncError: 'Não foi possível salvar o presente.' });
          }
        },

        removeGift: async (eventId, giftId) => {
          set((state) => ({
            events: state.events.map((e) =>
              e.id === eventId ? { ...e, gifts: e.gifts.filter((g) => g.id !== giftId) } : e
            ),
          }));
          if (!remote()) return;
          try {
            await api.deleteGift(eventId, giftId);
          } catch {
            set({ lastSyncError: 'Não foi possível remover o presente.' });
          }
        },

        toggleGiftReceived: async (eventId, giftId, receivedBy) => {
          const target = get()
            .events.find((e) => e.id === eventId)
            ?.gifts.find((g) => g.id === giftId);
          if (!target) return;
          const next = {
            received: !target.received,
            receivedBy: target.received ? undefined : receivedBy,
          };
          set((state) => ({
            events: state.events.map((e) =>
              e.id === eventId
                ? {
                    ...e,
                    gifts: e.gifts.map((g) => (g.id === giftId ? { ...g, ...next } : g)),
                  }
                : e
            ),
          }));
          if (!remote()) return;
          try {
            await api.patchGift(eventId, giftId, next);
          } catch {
            set({ lastSyncError: 'Não foi possível atualizar o presente.' });
          }
        },

        // -----------------------------------------------------------------
        // Personalização
        // -----------------------------------------------------------------
        updatePersonalization: async (eventId, updates) => {
          set((state) => ({
            events: state.events.map((e) =>
              e.id === eventId
                ? { ...e, personalization: { ...e.personalization, ...updates } }
                : e
            ),
          }));
          if (!remote()) return;
          const queued = psQueue.get(eventId) ?? {};
          psQueue.set(eventId, { ...queued, ...updates });
          scheduleFlush(`ps:${eventId}`, () => flushPersonalizationPatch(eventId));
        },
      };
    },
    {
      name: 'festsao-storage',
      version: 1,
      migrate,
    }
  )
);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'festsao-storage') useStore.persist.rehydrate();
  });
}

