import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from './useStore';

function makeEvent() {
  return {
    name: 'Casamento de Teste',
    type: 'casamento' as const,
    date: '2026-06-13',
    time: '19:00',
    venue: 'Salão',
    city: 'São Paulo',
    description: 'Venha!',
    hosts: 'Ana & Lucas',
  };
}

describe('useStore (modo demo/local)', () => {
  beforeEach(() => {
    useStore.setState({ events: [], activeEventId: null, hydrated: false, lastSyncError: null });
  });

  it('cria eventos com defaults e ativa o evento', async () => {
    const id = await useStore.getState().createEvent(makeEvent());
    const event = useStore.getState().events.find((e) => e.id === id);
    expect(event).toBeDefined();
    expect(event?.published).toBe(false);
    expect(event?.slug).toBe('');
    expect(event?.guests).toEqual([]);
    expect(useStore.getState().activeEventId).toBe(id);
  });

  it('adiciona e edita convidados sem duplicatas acidentais', async () => {
    const id = await useStore.getState().createEvent(makeEvent());
    await useStore.getState().addGuest(id, {
      name: 'Maria Silva',
      email: 'maria@exemplo.com',
      phone: '',
      rsvp: 'pending',
      plusOne: false,
    });
    const guests = useStore.getState().events.find((e) => e.id === id)?.guests ?? [];
    expect(guests).toHaveLength(1);

    await useStore
      .getState()
      .updateGuest(id, guests[0].id, { rsvp: 'confirmed', respondedVia: 'host' });
    const updated = useStore.getState().events.find((e) => e.id === id)?.guests[0];
    expect(updated?.rsvp).toBe('confirmed');
  });

  it('RSVP público local cria novo convidado ou atualiza o existente (match por nome)', async () => {
    const id = await useStore.getState().createEvent(makeEvent());
    useStore.getState().updateEvent(id, { published: true, slug: 'casamento-teste-ab12' });
    await new Promise((r) => setTimeout(r, 0));

    await useStore.getState().submitPublicRsvp('casamento-teste-ab12', {
      name: 'maria silva',
      choice: 'confirmed',
      email: 'maria@exemplo.com',
    });

    let guests = useStore.getState().events.find((e) => e.id === id)?.guests ?? [];
    expect(guests).toHaveLength(1);
    expect(guests[0].respondedVia).toBe('public');

    await useStore.getState().submitPublicRsvp('casamento-teste-ab12', {
      name: 'Maria Silva',
      choice: 'declined',
    });
    guests = useStore.getState().events.find((e) => e.id === id)?.guests ?? [];
    expect(guests).toHaveLength(1);
    expect(guests[0].rsvp).toBe('declined');
  });

  it('publicar/despublicar mantém o slug e alterna a visibilidade pública', async () => {
    const id = await useStore.getState().createEvent(makeEvent());
    await useStore
      .getState()
      .updateEvent(id, { published: true, slug: 'meu-evento-x1' });
    let event = useStore.getState().events.find((e) => e.id === id);
    expect(event?.slug).toBe('meu-evento-x1');

    await useStore.getState().updateEvent(id, { published: false });
    event = useStore.getState().events.find((e) => e.id === id);
    expect(event?.published).toBe(false);
    expect(event?.slug).toBe('meu-evento-x1');
  });
});
