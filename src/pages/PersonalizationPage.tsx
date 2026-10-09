import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import {
  ChevronRight, Palette, Type, Eye,
  CheckCircle2, Heart, Gift, Clock,
  Globe, ExternalLink, Copy, Image as ImageIcon, Info
} from 'lucide-react';
import { copyText, slugify, safeHex, getCountdown, compressImage } from '../lib/eventUtils';
import ImageCropper from '../components/ImageCropper';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  })
};

const colorPresets = [
  { name: 'Rosé', primary: '#D4A89C', secondary: '#C47D6B' },
  { name: 'Elegante', primary: '#2D2926', secondary: '#4A4543' },
  { name: 'Jardim', primary: '#8B9A7E', secondary: '#A8B89E' },
  { name: 'Premium', primary: '#B8877A', secondary: '#8B6F65' },
  { name: 'Noturno', primary: '#3D3B4A', secondary: '#5A5872' },
  { name: 'Dourado', primary: '#C4A35A', secondary: '#A68B4B' },
  { name: 'Lavanda', primary: '#9B8EC4', secondary: '#7B6FAA' },
  { name: 'Coral', primary: '#E07A5F', secondary: '#C4614A' },
];

export default function PersonalizationPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const events = useStore((s) => s.events);
  const updatePersonalization = useStore((s) => s.updatePersonalization);
  const updateEvent = useStore((s) => s.updateEvent);
  const event = events.find((e) => e.id === eventId);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [draftPrimary, setDraftPrimary] = useState(() => event?.personalization.primaryColor ?? '');
  const [draftSecondary, setDraftSecondary] = useState(() => event?.personalization.secondaryColor ?? '');
  const [heroDraft, setHeroDraft] = useState(() =>
    event?.personalization.heroImage.startsWith('http') ? event.personalization.heroImage : ''
  );
  const [heroError, setHeroError] = useState('');
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroFailed, setHeroFailed] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [now, setNow] = useState(() => new Date());

  // Sincroniza os rascunhos quando a store muda (presets, seletor de cor, upload/remover capa).
  useEffect(() => {
    setDraftPrimary(event?.personalization.primaryColor ?? '');
    setDraftSecondary(event?.personalization.secondaryColor ?? '');
  }, [event?.personalization.primaryColor, event?.personalization.secondaryColor]);

  useEffect(() => {
    const hero = event?.personalization.heroImage ?? '';
    setHeroDraft(hero.startsWith('http') ? hero : '');
    setHeroFailed(false);
  }, [event?.personalization.heroImage]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);

  if (!event) {
    return (
      <main className="pt-24 pb-16 min-h-screen">
        <div className="max-w-7xl mx-auto section-padding text-center py-20">
          <Palette className="w-16 h-16 text-charcoal-light/20 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-semibold mb-2">Nenhum evento selecionado</h1>
          <p className="text-charcoal-light mb-6">Crie um evento primeiro para personalizar.</p>
          <Link to="/criar-evento" className="btn-primary inline-flex items-center gap-2 text-xs">
            Criar evento
          </Link>
        </div>
      </main>
    );
  }

  const p = event.personalization;
  const primaryHex = safeHex(p.primaryColor, '#D4A89C');
  const secondaryHex = safeHex(p.secondaryColor, '#C47D6B');
  const countdown = getCountdown(event.date, event.time, now);

  const handlePublish = () => {
    if (event.published) return;
    let slug = event.slug;
    if (!slug) {
      const base = slugify(event.name) || 'evento';
      slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
      while (events.some((ev) => ev.slug === slug)) {
        slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
      }
    }
    updateEvent(event.id, {
      published: true,
      slug,
      publishedAt: new Date().toISOString(),
    });
  };

  const handleCopyLink = async () => {
    const ok = await copyText(`${window.location.origin}/e/${event.slug}`);
    setCopyState(ok ? 'copied' : 'failed');
    setTimeout(() => setCopyState('idle'), 2500);
  };

  const isHex = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);

  const handleHexChange = (field: 'primaryColor' | 'secondaryColor', value: string) => {
    if (field === 'primaryColor') {
      setDraftPrimary(value);
    } else {
      setDraftSecondary(value);
    }
    if (isHex(value)) {
      updatePersonalization(event.id, { [field]: value });
    }
  };

  const handleHeroUrl = () => {
    const url = heroDraft.trim();
    if (!url || url === p.heroImage) return;
    updatePersonalization(event.id, { heroImage: url.startsWith('http') ? url : '' });
  };

  // Ao escolher uma imagem, abre o recorte antes de salvar.
  const handleHeroFile = (file: File | null | undefined) => {
    if (!file) return;
    setHeroError('');
    if (!file.type.startsWith('image/')) {
      setHeroError('O arquivo selecionado não é uma imagem.');
      return;
    }
    setCropFile(file);
  };

  const handleCropConfirm = async (cropped: File) => {
    setCropFile(null);
    setHeroUploading(true);
    try {
      const dataUrl = await compressImage(cropped);
      updatePersonalization(event.id, { heroImage: dataUrl });
      setHeroFailed(false);
    } catch (err) {
      setHeroError(err instanceof Error ? err.message : 'Não foi possível enviar a imagem.');
    } finally {
      setHeroUploading(false);
    }
  };

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto section-padding">
        {/* Breadcrumb */}
        <motion.div initial="hidden" animate="visible">
          <motion.div custom={0} variants={fadeUp} className="flex items-center gap-2 text-sm text-charcoal-light mb-2">
            <Link to="/" className="hover:text-charcoal transition-colors">Início</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to={`/dashboard/${event.id}`} className="hover:text-charcoal transition-colors">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-charcoal">Personalização</span>
          </motion.div>
        </motion.div>

        {/* Header */}
        <motion.div initial="hidden" animate="visible" className="mb-8">
          <motion.div custom={1} variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl lg:text-4xl font-semibold mb-1 tracking-tight">
                <span className="italic text-rose">Personalizar</span> evento
              </h1>
              <p className="text-charcoal-light">{event.name}</p>
              <p className="text-xs text-charcoal-light/70 mt-1">As alterações são salvas automaticamente</p>
            </div>
            {event.published ? (
              <a
                href={`/e/${event.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex items-center justify-center gap-2 text-xs"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir página
              </a>
            ) : (
              <button
                onClick={handlePublish}
                className="btn-primary inline-flex items-center justify-center gap-2 text-xs"
              >
                <Globe className="w-4 h-4" />
                Publicar página
              </button>
            )}
          </motion.div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event info */}
            <motion.div initial="hidden" animate="visible">
              <motion.div custom={2} variants={fadeUp} className="card-base">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-blush" />
                  <h2 className="font-display text-lg font-semibold">Informações do evento</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-charcoal-light block mb-1.5">Nome do evento</label>
                    <input
                      type="text"
                      value={event.name}
                      onChange={(e) => updateEvent(event.id, { name: e.target.value })}
                      placeholder="Ex.: Casamento de Ana & Lucas"
                      className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blush/30"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-charcoal-light block mb-1.5">Organizadores</label>
                    <input
                      type="text"
                      value={event.hosts}
                      onChange={(e) => updateEvent(event.id, { hosts: e.target.value })}
                      placeholder="Ex.: Ana & Lucas"
                      className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blush/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-charcoal-light block mb-1.5">Data</label>
                    <input
                      type="date"
                      value={event.date}
                      onChange={(e) => updateEvent(event.id, { date: e.target.value })}
                      className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blush/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-charcoal-light block mb-1.5">Horário</label>
                    <input
                      type="time"
                      value={event.time}
                      onChange={(e) => updateEvent(event.id, { time: e.target.value })}
                      className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blush/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-charcoal-light block mb-1.5">Local</label>
                    <input
                      type="text"
                      value={event.venue}
                      onChange={(e) => updateEvent(event.id, { venue: e.target.value })}
                      placeholder="Ex.: Salão de festas"
                      className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blush/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-charcoal-light block mb-1.5">Cidade</label>
                    <input
                      type="text"
                      value={event.city}
                      onChange={(e) => updateEvent(event.id, { city: e.target.value })}
                      placeholder="Ex.: São Paulo"
                      className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blush/30"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-charcoal-light block mb-1.5">Mensagem para os convidados</label>
                    <textarea
                      value={event.description}
                      onChange={(e) => updateEvent(event.id, { description: e.target.value })}
                      placeholder="Escreva uma mensagem especial..."
                      rows={3}
                      className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blush/30 transition-shadow resize-none"
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Colors */}
            <motion.div initial="hidden" animate="visible">
              <motion.div custom={3} variants={fadeUp} className="card-base">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-5 h-5 text-blush" />
                  <h2 className="font-display text-lg font-semibold">Cores</h2>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-6">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => updatePersonalization(event.id, {
                        primaryColor: preset.primary,
                        secondaryColor: preset.secondary,
                      })}
                      className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                        p.primaryColor === preset.primary
                          ? 'bg-cream ring-2 ring-blush'
                          : 'hover:bg-cream/50'
                      }`}
                    >
                      <div className="flex gap-0.5">
                        <div
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: preset.secondary }}
                        />
                      </div>
                      <span className="text-[10px] text-charcoal-light">{preset.name}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-charcoal-light block mb-1.5">Cor principal</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={safeHex(p.primaryColor, '#D4A89C')}
                        onChange={(e) => updatePersonalization(event.id, { primaryColor: e.target.value })}
                        className="w-10 h-10 rounded-xl border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={draftPrimary}
                        onChange={(e) => handleHexChange('primaryColor', e.target.value)}
                        placeholder="#D4A89C"
                        className={`flex-1 min-w-0 bg-cream rounded-xl px-3 py-2 text-sm font-mono outline-none focus:ring-2 ${
                          isHex(draftPrimary) ? 'focus:ring-blush/30' : 'ring-2 ring-rose'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-charcoal-light block mb-1.5">Cor secundária</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={safeHex(p.secondaryColor, '#C47D6B')}
                        onChange={(e) => updatePersonalization(event.id, { secondaryColor: e.target.value })}
                        className="w-10 h-10 rounded-xl border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={draftSecondary}
                        onChange={(e) => handleHexChange('secondaryColor', e.target.value)}
                        placeholder="#C47D6B"
                        className={`flex-1 min-w-0 bg-cream rounded-xl px-3 py-2 text-sm font-mono outline-none focus:ring-2 ${
                          isHex(draftSecondary) ? 'focus:ring-blush/30' : 'ring-2 ring-rose'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Cover */}
            <motion.div initial="hidden" animate="visible">
              <motion.div custom={4} variants={fadeUp} className="card-base">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="w-5 h-5 text-blush" />
                  <h2 className="font-display text-lg font-semibold">Capa</h2>
                </div>

                {p.heroImage && !heroFailed && (
                  <img
                    src={p.heroImage}
                    alt="Capa do evento"
                    onError={() => setHeroFailed(true)}
                    className="w-full h-40 object-cover rounded-xl mb-4 border border-charcoal/5"
                  />
                )}

                <label className="text-xs font-medium text-charcoal-light block mb-1.5">URL da imagem</label>
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <input
                    type="url"
                    value={heroDraft}
                    onChange={(e) => setHeroDraft(e.target.value)}
                    onBlur={handleHeroUrl}
                    placeholder="https://..."
                    className="flex-1 min-w-0 bg-cream rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blush/30"
                  />
                  <button
                    type="button"
                    onClick={handleHeroUrl}
                    className="btn-secondary text-xs whitespace-nowrap"
                  >
                    Salvar URL
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <label className={`btn-secondary text-xs inline-flex items-center gap-1.5 cursor-pointer ${heroUploading ? 'opacity-60 pointer-events-none' : ''}`}>
                    <ImageIcon className="w-3.5 h-3.5" />
                    {heroUploading ? 'Enviando...' : 'Enviar imagem'}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={heroUploading}
                      onChange={(e) => {
                        handleHeroFile(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  {p.heroImage && (
                    <button
                      type="button"
                      onClick={() => {
                        updatePersonalization(event.id, { heroImage: '' });
                        setHeroError('');
                      }}
                      className="btn-secondary text-xs text-rose"
                    >
                      Remover capa
                    </button>
                  )}
                </div>
                {heroError && <p className="text-rose text-xs mt-2">{heroError}</p>}
              </motion.div>
            </motion.div>

            {/* Tagline */}
            <motion.div initial="hidden" animate="visible">
              <motion.div custom={5} variants={fadeUp} className="card-base">
                <div className="flex items-center gap-2 mb-4">
                  <Type className="w-5 h-5 text-blush" />
                  <h2 className="font-display text-lg font-semibold">Frase de destaque</h2>
                </div>
                <input
                  type="text"
                  value={p.tagline}
                  onChange={(e) => updatePersonalization(event.id, { tagline: e.target.value })}
                  placeholder="Uma frase especial para seus convidados..."
                  className="w-full bg-cream rounded-xl px-4 py-3 text-sm outline-none
                             focus:ring-2 focus:ring-blush/30 transition-shadow"
                />
              </motion.div>
            </motion.div>

            {/* Visibility toggles */}
            <motion.div initial="hidden" animate="visible">
              <motion.div custom={6} variants={fadeUp} className="card-base">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-5 h-5 text-blush" />
                  <h2 className="font-display text-lg font-semibold">Visibilidade</h2>
                </div>
                <p className="text-sm text-charcoal-light mb-4">
                  Escolha o que aparecer na página pública do seu evento.
                </p>
                <div className="space-y-3">
                  {[
                    { key: 'showCountdown' as const, label: 'Countdown', desc: 'Mostrar contagem regressiva', icon: Clock },
                    { key: 'showGiftList' as const, label: 'Lista de presentes', desc: 'Mostrar lista de presentes', icon: Gift },
                    { key: 'showRsvp' as const, label: 'Confirmação de presença', desc: 'Permitir RSVP na página', icon: Heart },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between py-3 px-4 bg-cream/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-charcoal-light" />
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-charcoal-light">{item.desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => updatePersonalization(event.id, { [item.key]: !p[item.key] })}
                        className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${
                          p[item.key] ? 'bg-sage' : 'bg-charcoal/20'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform duration-200 ${
                          p[item.key] ? 'translate-x-5.5 left-0.5' : 'translate-x-0 left-0.5'
                        }`} style={{ transform: p[item.key] ? 'translateX(22px)' : 'translateX(2px)' }} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Publication */}
            <motion.div initial="hidden" animate="visible">
              <motion.div custom={7} variants={fadeUp} className="card-base">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-blush" />
                  <h2 className="font-display text-lg font-semibold">Publicação</h2>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${
                    event.published ? 'bg-sage/10 text-sage' : 'bg-charcoal/5 text-charcoal-light'
                  }`}>
                    {event.published ? 'Publicada' : 'Rascunho'}
                  </span>
                  {event.published && event.publishedAt && (
                    <span className="text-[10px] text-charcoal-light">
                      {new Date(event.publishedAt).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>

                {event.published && event.slug ? (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/e/${event.slug}`}
                        onFocus={(e) => e.target.select()}
                        className="flex-1 min-w-0 bg-cream rounded-xl px-4 py-2.5 text-xs text-charcoal-light outline-none focus:ring-2 focus:ring-blush/30"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="btn-secondary text-xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        {copyState === 'copied' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copyState === 'copied' ? 'Copiado!' : copyState === 'failed' ? 'Selecione e copie' : 'Copiar link'}
                      </button>
                    </div>
                    <button
                      onClick={() => updateEvent(event.id, { published: false })}
                      className="btn-secondary text-xs w-full sm:w-auto"
                    >
                      Despublicar
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-charcoal-light">
                    Sua página ainda não foi publicada. Use o botão "Publicar página" no topo para gerar o link.
                  </p>
                )}
              </motion.div>
            </motion.div>
          </div>

          {/* Preview */}
          <div>
            <motion.div initial="hidden" animate="visible">
              <motion.div custom={8} variants={fadeUp} className="lg:sticky lg:top-24">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-charcoal-light" />
                  <span className="text-sm font-medium">Pré-visualização</span>
                </div>
                <div className="rounded-3xl overflow-hidden shadow-card-hover border border-charcoal/5">
                  {/* Preview card */}
                  <div
                    className="p-6 text-center"
                    style={{ backgroundColor: primaryHex + '15' }}
                  >
                    {p.heroImage && !heroFailed && (
                      <img
                        src={p.heroImage}
                        alt=""
                        onError={() => setHeroFailed(true)}
                        className="w-full h-24 object-cover rounded-xl mb-3"
                      />
                    )}
                    <div
                      className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                      style={{ backgroundColor: primaryHex + '25' }}
                    >
                      <Heart className="w-7 h-7" style={{ color: primaryHex }} />
                    </div>
                    <h3 className="font-display text-lg font-semibold mb-1">{event.hosts}</h3>
                    <p className="text-xs text-charcoal-light mb-3">{event.name || 'Evento sem nome'}</p>
                    {p.tagline && (
                      <p className="text-xs italic text-charcoal-light mb-4">"{p.tagline}"</p>
                    )}
                    {p.showCountdown && (
                      countdown.status === 'future' ? (
                        <div className="flex justify-center gap-3 mb-4">
                          {[
                            { v: String(countdown.days), l: 'dias' },
                            { v: String(countdown.hours), l: 'horas' },
                            { v: String(countdown.minutes), l: 'min' },
                          ].map((u, i) => (
                            <div key={i} className="bg-white rounded-xl px-3 py-2 shadow-soft">
                              <p className="font-display text-lg font-semibold" style={{ color: primaryHex }}>{u.v}</p>
                              <p className="text-[9px] text-charcoal-light">{u.l}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm font-medium mb-4" style={{ color: secondaryHex }}>
                          {countdown.status === 'today' ? 'É hoje! 🎉' : 'Evento realizado'}
                        </p>
                      )
                    )}
                    <div className="flex justify-center gap-1.5">
                      {p.showRsvp && (
                        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-charcoal-light flex items-center gap-1">
                          <Heart className="w-2.5 h-2.5" /> RSVP
                        </span>
                      )}
                      {p.showGiftList && (
                        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-charcoal-light flex items-center gap-1">
                          <Gift className="w-2.5 h-2.5" /> Presentes
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white p-4">
                    <div className="h-2 bg-cream rounded-full mb-2" />
                    <div className="h-2 bg-cream rounded-full w-3/4" />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
      {cropFile && (
        <ImageCropper
          file={cropFile}
          aspect={16 / 9}
          onCancel={() => setCropFile(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </main>
  );
}
