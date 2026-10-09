import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Map, ExternalLink, Gift, Heart } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Guest } from '../store/useStore';
import { eventTypeMeta, safeHex, getCountdown, formatBRL, normalizeName } from '../lib/eventUtils';
import { averageImageColor, pickTextColor, HERO_TEXT_DARK, HERO_TEXT_LIGHT } from '../lib/heroContrast';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  })
};

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

export default function PublicEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const events = useStore((s) => s.events);
  const addGuest = useStore((s) => s.addGuest);
  const updateGuest = useStore((s) => s.updateGuest);
  const event = events.find((e) => e.slug === slug && e.published);
  const [heroFailed, setHeroFailed] = useState(false);
  const [coverAverage, setCoverAverage] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const coverSrc = event?.personalization.heroImage ?? '';

  // Cor média da capa importada: define se o texto do topo fica claro ou escuro.
  useEffect(() => {
    let cancelled = false;
    if (!coverSrc || heroFailed) {
      setCoverAverage(null);
      return;
    }
    averageImageColor(coverSrc).then((color) => {
      if (!cancelled) setCoverAverage(color);
    });
    return () => {
      cancelled = true;
    };
  }, [coverSrc, heroFailed]);

  // RSVP form (hooks always run, before any early return)
  const [rsvpChoice, setRsvpChoice] = useState<'confirmed' | 'declined' | ''>('');
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpEmail, setRsvpEmail] = useState('');
  const [rsvpPhone, setRsvpPhone] = useState('');
  const [rsvpPlusOne, setRsvpPlusOne] = useState(false);
  const [rsvpPlusOneName, setRsvpPlusOneName] = useState('');
  const [rsvpNotes, setRsvpNotes] = useState('');
  const [rsvpErrors, setRsvpErrors] = useState<{ name?: string; choice?: string }>({});
  const [rsvpDone, setRsvpDone] = useState<{ name: string; choice: 'confirmed' | 'declined' } | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const handleSubmitRsvp = () => {
    if (!event) return;
    const errors: { name?: string; choice?: string } = {};
    if (!rsvpChoice) errors.choice = 'Escolha uma das opções.';
    if (!rsvpName.trim()) errors.name = 'Informe seu nome completo.';
    setRsvpErrors(errors);
    if (errors.choice || errors.name || !rsvpChoice) return;

    const choice: Guest['rsvp'] = rsvpChoice;
    const respondedAt = new Date().toISOString();
    const base = {
      rsvp: choice,
      plusOne: rsvpPlusOne,
      plusOneName: rsvpPlusOne && rsvpPlusOneName.trim() ? rsvpPlusOneName.trim() : undefined,
      notes: rsvpNotes.trim() || undefined,
      respondedAt,
      respondedVia: 'public' as const,
    };

    const existing = event.guests.find(
      (g) => normalizeName(g.name) === normalizeName(rsvpName)
    );
    if (existing) {
      updateGuest(event.id, existing.id, {
        ...base,
        ...(rsvpEmail.trim() ? { email: rsvpEmail.trim() } : {}),
        ...(rsvpPhone.trim() ? { phone: rsvpPhone.trim() } : {}),
      });
    } else {
      addGuest(event.id, {
        ...base,
        name: rsvpName.trim(),
        email: rsvpEmail.trim(),
        phone: rsvpPhone.trim(),
      });
    }
    setRsvpDone({ name: rsvpName.trim(), choice: rsvpChoice });
  };

  if (!event) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="max-w-2xl mx-auto section-padding py-12 sm:py-16">
          <div className="card-base text-center">
            <span className="text-4xl block mb-4">🎉</span>
            <h1 className="font-display text-2xl font-semibold mb-3">Página não encontrada</h1>
            <p className="text-sm text-charcoal-light mb-6 leading-relaxed">
              Esta página não está disponível. Ela pode não ter sido publicada ou foi aberta em outro
              navegador (nesta demonstração os dados ficam salvos no navegador onde o evento foi criado).
            </p>
            <Link to="/" className="btn-primary inline-flex items-center gap-2 text-sm">
              Voltar ao início
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const meta = eventTypeMeta[event.type] ?? eventTypeMeta.outro;
  const p = event.personalization;
  const primaryHex = safeHex(p.primaryColor, '#D4A89C');
  const secondaryHex = safeHex(p.secondaryColor, '#C47D6B');
  // A capa é mostrada sem nenhuma cor por cima. O texto do topo só muda quando há capa.
  const hasCover = Boolean(p.heroImage) && !heroFailed;
  // Se a capa não puder ser analisada, usa texto claro com sombra (a maioria das fotos é escura).
  const heroTextColor = !hasCover
    ? HERO_TEXT_DARK
    : coverAverage
      ? pickTextColor(coverAverage)
      : HERO_TEXT_LIGHT;
  const heroTextStyle = hasCover
    ? {
        color: heroTextColor,
        textShadow: heroTextColor === HERO_TEXT_LIGHT ? '0 1px 3px rgba(0,0,0,0.45)' : undefined,
      }
    : undefined;
  const countdown = getCountdown(event.date, event.time, now);
  const mapQuery = encodeURIComponent(`${event.venue} ${event.city}`.trim());

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto section-padding py-8 sm:py-12 space-y-6">
        {/* Hero */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <div
            className="relative overflow-hidden rounded-3xl border border-charcoal/5 shadow-soft"
            style={{ backgroundColor: primaryHex + '15' }}
          >
            {p.heroImage && !heroFailed && (
              <>
                <img
                  src={p.heroImage}
                  alt=""
                  onError={() => setHeroFailed(true)}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </>
            )}
            <div className="relative px-6 py-10 text-center">
              <span className="text-4xl block mb-3">{meta.emoji}</span>
              <p
                className="text-xs uppercase tracking-widest mb-3"
                style={hasCover ? heroTextStyle : { color: secondaryHex }}
              >
                {meta.label}
              </p>
              <p className={`text-sm mb-1 ${hasCover ? '' : 'text-charcoal-light'}`} style={heroTextStyle}>{event.hosts}</p>
              <h1
                className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-3"
                style={heroTextStyle}
              >
                {event.name || 'Evento sem nome'}
              </h1>
              {p.tagline && (
                <p className={`text-sm italic ${hasCover ? '' : 'text-charcoal-light'}`} style={heroTextStyle}>"{p.tagline}"</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Countdown */}
        {p.showCountdown && (
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
            <div className="card-base text-center">
              {countdown.status === 'future' ? (
                <>
                  <p className="text-xs uppercase tracking-widest text-charcoal-light mb-4">Faltam</p>
                  <div className="flex justify-center gap-3">
                    {[
                      { v: String(countdown.days), l: 'dias' },
                      { v: String(countdown.hours), l: 'horas' },
                      { v: String(countdown.minutes), l: 'min' },
                    ].map((u, i) => (
                      <div
                        key={i}
                        className="rounded-xl px-4 py-3 shadow-soft min-w-[4.5rem]"
                        style={{ backgroundColor: primaryHex + '15' }}
                      >
                        <p className="font-display text-2xl font-semibold" style={{ color: secondaryHex }}>
                          {u.v}
                        </p>
                        <p className="text-[10px] text-charcoal-light">{u.l}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="font-display text-xl font-semibold" style={{ color: secondaryHex }}>
                  {countdown.status === 'today' ? 'É hoje! 🎉' : 'Evento realizado'}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Detalhes */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <div className="card-base">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: secondaryHex }} />
                <span>
                  {event.date
                    ? new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Data a definir'}
                </span>
              </li>
              {event.time && (
                <li className="flex items-center gap-3">
                  <Clock className="w-4 h-4 flex-shrink-0" style={{ color: secondaryHex }} />
                  <span>{event.time}</span>
                </li>
              )}
              {(event.venue || event.city) && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: secondaryHex }} />
                  <span className="flex-1">
                    {event.venue}
                    {event.city ? `, ${event.city}` : ''}
                  </span>
                </li>
              )}
            </ul>
            {(event.venue || event.city) && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs inline-flex items-center gap-1.5 mt-4"
              >
                <Map className="w-3.5 h-3.5" />
                Ver no mapa
              </a>
            )}
          </div>
        </motion.div>

        {/* Mensagem */}
        {event.description && (
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
            <div className="card-base">
              <p className="text-xs uppercase tracking-widest text-charcoal-light mb-2">
                Mensagem para os convidados
              </p>
              <p className="text-sm text-charcoal-light leading-relaxed italic">
                "{event.description}"
              </p>
            </div>
          </motion.div>
        )}

        {/* RSVP */}
        {p.showRsvp && (
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
            <div className="card-base">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-5 h-5" style={{ color: secondaryHex }} />
                <h2 className="font-display text-lg font-semibold">Confirme sua presença</h2>
              </div>
              <p className="text-xs text-charcoal-light mb-4">
                Sua resposta ajuda os anfitriões a organizar tudo. Leva menos de um minuto.
              </p>

              {rsvpDone ? (
                <div className="text-center py-4">
                  <span className="text-4xl block mb-3">
                    {rsvpDone.choice === 'confirmed' ? '🎉' : '💌'}
                  </span>
                  <p className="font-display text-xl font-semibold mb-2">
                    {rsvpDone.choice === 'confirmed'
                      ? `Presença confirmada! Obrigado, ${rsvpDone.name.split(' ')[0]}.`
                      : 'Tudo bem, obrigado por responder! Vamos sentir sua falta.'}
                  </p>
                  <p className="text-sm text-charcoal-light mb-5">
                    {rsvpDone.choice === 'confirmed'
                      ? 'Já registramos a sua confirmação.'
                      : 'Você pode alterar a resposta quando quiser.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setRsvpDone(null)}
                    className="btn-secondary text-xs"
                  >
                    Alterar resposta
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmitRsvp();
                  }}
                  className="space-y-4"
                >
                  {/* Opções */}
                  <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {([
                        { value: 'confirmed' as const, label: 'Vou com certeza' },
                        { value: 'declined' as const, label: 'Não poderei ir' },
                      ]).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setRsvpChoice(opt.value)}
                          className="px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px] border"
                          style={
                            rsvpChoice === opt.value
                              ? { backgroundColor: primaryHex, borderColor: primaryHex, color: '#fff' }
                              : { backgroundColor: '#fff', borderColor: 'rgba(45,41,38,0.15)', color: '#4A4543' }
                          }
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {rsvpErrors.choice && <p className="text-rose text-xs mt-1.5">{rsvpErrors.choice}</p>}
                  </div>

                  {/* Nome */}
                  <div>
                    <label className="text-xs font-medium text-charcoal-light block mb-1.5">
                      Nome completo *
                    </label>
                    <input
                      type="text"
                      value={rsvpName}
                      onChange={(e) => setRsvpName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blush/30"
                    />
                    {rsvpErrors.name && <p className="text-rose text-xs mt-1.5">{rsvpErrors.name}</p>}
                  </div>

                  {/* Contato */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-charcoal-light block mb-1.5">
                        E-mail (opcional)
                      </label>
                      <input
                        type="email"
                        value={rsvpEmail}
                        onChange={(e) => setRsvpEmail(e.target.value)}
                        placeholder="voce@email.com"
                        className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blush/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-charcoal-light block mb-1.5">
                        Telefone (opcional)
                      </label>
                      <input
                        type="tel"
                        value={rsvpPhone}
                        onChange={(e) => setRsvpPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blush/30"
                      />
                    </div>
                  </div>

                  {/* Acompanhante */}
                  <div className="bg-cream/50 rounded-xl p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rsvpPlusOne}
                        onChange={(e) => setRsvpPlusOne(e.target.checked)}
                        className="w-4 h-4 rounded accent-blush"
                      />
                      <span className="text-sm">Vou levar acompanhante</span>
                    </label>
                    {rsvpPlusOne && (
                      <input
                        type="text"
                        value={rsvpPlusOneName}
                        onChange={(e) => setRsvpPlusOneName(e.target.value)}
                        placeholder="Nome do acompanhante"
                        className="w-full mt-3 bg-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blush/30"
                      />
                    )}
                  </div>

                  {/* Observações */}
                  <div>
                    <label className="text-xs font-medium text-charcoal-light block mb-1.5">
                      Observações (opcional)
                    </label>
                    <textarea
                      value={rsvpNotes}
                      onChange={(e) => setRsvpNotes(e.target.value)}
                      placeholder="Restrições alimentares, alergias..."
                      rows={3}
                      className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blush/30 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full text-white text-sm font-medium rounded-xl px-5 py-3 transition-colors duration-150 min-h-[44px]"
                    style={{ backgroundColor: secondaryHex }}
                  >
                    Enviar resposta
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}

        {/* Presentes */}
        {p.showGiftList && event.gifts.length > 0 && (
          <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
            <div className="card-base">
              <div className="flex items-center gap-2 mb-4">
                <Gift className="w-5 h-5" style={{ color: secondaryHex }} />
                <h2 className="font-display text-lg font-semibold">Lista de presentes</h2>
              </div>
              <div className="space-y-1">
                {event.gifts.map((gift) => {
                  const bestPrice = gift.options.length > 0
                    ? Math.min(...gift.options.map((o) => o.price))
                    : null;
                  const bestOption = gift.options.find((o) => o.price === bestPrice);
                  return (
                    <div
                      key={gift.id}
                      className="flex items-start justify-between gap-3 py-3 border-b border-charcoal/5 last:border-0 last:pb-0 first:pt-0"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{gift.image}</span>
                          <p className="font-medium text-sm">{gift.name}</p>
                          {gift.received && (
                            <span className="text-[10px] bg-sage/10 text-sage px-2 py-0.5 rounded-full">
                              Já presenteado
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-charcoal-light mt-0.5">{gift.category}</p>
                        {bestOption && bestOption.url && isHttpUrl(bestOption.url) && (
                          <a
                            href={bestOption.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs inline-flex items-center gap-1 mt-1 hover:underline"
                            style={{ color: secondaryHex }}
                          >
                            Ver na loja
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      {bestPrice !== null && (
                        <span
                          className="font-display text-base font-semibold whitespace-nowrap"
                          style={{ color: secondaryHex }}
                        >
                          {formatBRL(bestPrice)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Rodapé */}
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="text-center pt-2 pb-2">
          <p className="text-xs text-charcoal-light">
            Criado com{' '}
            <Link to="/" className="font-semibold hover:underline" style={{ color: secondaryHex }}>
              Festão
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
