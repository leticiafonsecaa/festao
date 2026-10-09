import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Camera,
  CalendarHeart,
  Check,
  Gift,
  Globe,
  Heart,
  ListChecks,
  Palette,
  Sparkles,
  Users,
} from 'lucide-react';

const eventTypes = ['Casamentos', 'Festas de 15 anos', 'Aniversários', 'Corporativo', 'Outras celebrações'];

const features = [
  {
    icon: Users,
    title: 'Convidados',
    text: 'Cadastre seus convidados e acompanhe quem confirmou, quem recusou e quem ainda não respondeu.',
  },
  {
    icon: Gift,
    title: 'Lista de presentes',
    text: 'Adicione presentes com preços de lojas diferentes. Seus convidados escolhem onde comprar.',
  },
  {
    icon: Palette,
    title: 'Personalização',
    text: 'Escolha cores, capa, frase e o que aparece na página. O preview mostra o resultado na hora.',
  },
  {
    icon: Globe,
    title: 'Página do evento',
    text: 'Publique uma página com link próprio para compartilhar no WhatsApp e nas redes sociais.',
  },
  {
    icon: ListChecks,
    title: 'Informações do evento',
    text: 'Data, horário, local e mensagem para os convidados, sempre atualizados em um só lugar.',
  },
  {
    icon: Sparkles,
    title: 'Assistente',
    text: 'Tire dúvidas sobre a plataforma e receba orientações em cada etapa do planejamento.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Crie seu evento',
    text: 'Escolha o tipo de evento e preencha nome, data, local e descrição em quatro passos simples.',
  },
  {
    number: '02',
    title: 'Personalize e publique',
    text: 'Ajuste cores, capa e informações, depois publique a página do evento com um clique.',
  },
  {
    number: '03',
    title: 'Compartilhe e acompanhe',
    text: 'Envie o link para os convidados e veja as confirmações e os presentes escolhidos chegarem.',
  },
];

const pageHighlights = [
  'Contagem regressiva até o grande dia',
  'Confirmação de presença direto na página',
  'Lista de presentes com preços em reais',
  'Mapa do local e mensagem para os convidados',
];

export default function LandingPage() {
  return (
    <main className="pt-24 pb-16 bg-cream text-charcoal">
      {/* Hero */}
      <section className="max-w-7xl mx-auto section-padding grid gap-12 lg:grid-cols-2 items-center py-12 lg:py-20">
        <div className="animate-slide-up">
          <div className="inline-flex items-center gap-2 rounded-full bg-rose/10 px-4 py-2 text-sm text-rose mb-6">
            <Sparkles className="w-4 h-4" />
            Seu evento, simplificado
          </div>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.02] mb-6">
            Tudo para o seu <span className="italic text-rose">evento</span>, em um só lugar.
          </h1>
          <p className="text-lg text-charcoal-light max-w-xl mb-8">
            Organize casamentos, festas de 15 anos, aniversários e muito mais. Gerencie convidados,
            presentes, serviços e a página do seu evento em uma plataforma feita para você.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/criar-evento"
              className="inline-flex items-center gap-2 rounded-xl bg-charcoal px-6 py-3 font-medium text-ivory hover:bg-charcoal-light transition-colors"
            >
              Criar meu evento
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/servicos"
              className="inline-flex items-center gap-2 rounded-xl border border-charcoal/15 bg-transparent px-6 py-3 font-medium text-charcoal hover:bg-white transition-colors"
            >
              Explorar serviços
            </Link>
          </div>
        </div>

        {/* Mockup ilustrativo */}
        <div className="relative min-h-[420px] flex items-center justify-center">
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-blush-light/60 via-cream to-sage/10" />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blush-light/60">
                <Heart className="w-5 h-5 text-rose" />
              </div>
              <div>
                <p className="font-display text-lg font-semibold leading-tight">Ana &amp; Lucas</p>
                <p className="text-xs text-charcoal-light">Casamento • 15 mar 2026</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Users, value: '187', label: 'convidados' },
                { icon: Gift, value: '34', label: 'presentes' },
                { icon: ListChecks, value: '85%', label: 'já responderam' },
                { icon: CalendarHeart, value: '47', label: 'dias restantes' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-cream p-4">
                  <item.icon className="w-4 h-4 text-rose mb-2" />
                  <p className="font-display text-2xl font-semibold">{item.value}</p>
                  <p className="text-xs text-charcoal-light">{item.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-charcoal-light/70 text-center">Exemplo ilustrativo</p>
          </div>

          <div className="absolute -top-4 right-0 md:-right-4 rounded-2xl bg-white px-4 py-3 shadow-card flex items-center gap-3 animate-fade-in">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sage/15">
              <Check className="w-4 h-4 text-sage" />
            </div>
            <div>
              <p className="text-xs font-medium">Presença confirmada</p>
              <p className="text-[11px] text-charcoal-light">Maria confirmou pela página</p>
            </div>
          </div>

          <div className="absolute -bottom-4 left-0 md:-left-4 rounded-2xl bg-white px-4 py-3 shadow-card flex items-center gap-3 animate-fade-in">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose/10">
              <Gift className="w-4 h-4 text-rose" />
            </div>
            <div>
              <p className="text-xs font-medium">Novo presente!</p>
              <p className="text-[11px] text-charcoal-light">Air Fryer adicionada</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tipos de evento */}
      <section className="border-y border-charcoal/5 bg-ivory">
        <div className="max-w-7xl mx-auto section-padding py-10 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-charcoal-light mb-6">Para todo tipo de celebração</p>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
            {eventTypes.map((type) => (
              <span key={type} className="font-display text-xl md:text-2xl text-charcoal-light/70">
                {type}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="max-w-7xl mx-auto section-padding py-20">
        <div className="text-center mb-14">
          <span className="inline-block rounded-full bg-sage/15 px-4 py-1.5 text-sm text-charcoal-light mb-5">
            Funcionalidades
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-semibold mb-4">
            Tudo que você precisa, <span className="italic text-rose">nada que não precisa.</span>
          </h2>
          <p className="text-charcoal-light max-w-2xl mx-auto">
            Ferramentas pensadas para deixar a organização do seu evento simples, prazerosa e completa.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl bg-white p-7 shadow-soft border border-charcoal/5 hover:shadow-card-hover transition-shadow duration-300"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-blush-light/50">
                <feature.icon className="w-5 h-5 text-rose" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-charcoal-light">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-charcoal text-ivory">
        <div className="max-w-7xl mx-auto section-padding py-24">
          <div className="text-center mb-16">
            <span className="inline-block rounded-full bg-blush/20 px-4 py-1.5 text-sm text-blush mb-5">
              Como funciona
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-semibold">
              Simples como <span className="italic text-blush">1, 2, 3</span>
            </h2>
          </div>

          <div className="grid gap-12 md:grid-cols-3 max-w-6xl mx-auto">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <span className="font-display text-7xl font-semibold text-ivory/10 absolute -top-8 -left-2 select-none">
                  {step.number}
                </span>
                <div className="relative pt-10">
                  <div className="mb-4 inline-flex h-9 items-center justify-center rounded-xl bg-blush/20 px-3 text-xs font-medium text-blush">
                    {step.number}
                  </div>
                  <h3 className="font-display text-2xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-ivory/70 leading-relaxed">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Página do evento */}
      <section className="max-w-7xl mx-auto section-padding py-24 grid gap-14 lg:grid-cols-2 items-center">
        <div>
          <span className="inline-block rounded-full bg-rose/10 px-4 py-1.5 text-sm text-rose mb-5">
            Página do evento
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-semibold mb-6">
            Sua página, <span className="italic text-rose">pronta para compartilhar.</span>
          </h2>
          <p className="text-charcoal-light mb-8 max-w-lg">
            Depois de publicar, seus convidados acessam um link com todas as informações do evento e
            podem confirmar a presença sem precisar criar conta.
          </p>
          <ul className="space-y-4">
            {pageHighlights.map((item) => (
              <li key={item} className="flex items-center gap-3 text-charcoal-light">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sage text-white">
                  <Check className="w-3 h-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[2.5rem] bg-blush-light/40" />
          <div className="relative overflow-hidden rounded-3xl bg-white shadow-card-hover">
            <div className="h-36 bg-gradient-to-br from-rose via-blush to-blush-light flex items-center justify-center">
              <Camera className="w-8 h-8 text-white/80" />
            </div>
            <div className="p-7 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-charcoal-light mb-2">Casamento</p>
              <h3 className="font-display text-3xl font-semibold mb-2">Ana &amp; Lucas</h3>
              <p className="text-sm text-charcoal-light italic mb-6">Celebre conosco este momento especial</p>
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[
                  { v: '47', l: 'dias' },
                  { v: '08', l: 'horas' },
                  { v: '23', l: 'min' },
                  { v: '10', l: 'seg' },
                ].map((t) => (
                  <div key={t.l} className="rounded-xl bg-cream py-3">
                    <p className="font-display text-xl font-semibold">{t.v}</p>
                    <p className="text-[10px] uppercase tracking-wide text-charcoal-light">{t.l}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <div className="flex-1 rounded-xl bg-rose py-3 text-sm font-medium text-white">Vou com certeza</div>
                <div className="flex-1 rounded-xl border border-charcoal/15 py-3 text-sm text-charcoal">
                  Não poderei ir
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-7xl mx-auto section-padding pb-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-charcoal px-8 py-20 text-center text-ivory">
          <div className="absolute inset-0 bg-gradient-to-br from-rose/20 via-transparent to-sage/10 pointer-events-none" />
          <div className="relative">
            <h2 className="font-display text-4xl md:text-5xl font-semibold mb-4">Pronto para começar?</h2>
            <p className="text-ivory/70 max-w-xl mx-auto mb-10">
              Crie seu evento agora e veja como é fácil organizar tudo com o Festão.
            </p>
            <Link
              to="/criar-evento"
              className="inline-flex items-center gap-2 rounded-xl bg-blush px-8 py-3.5 font-medium text-charcoal hover:bg-blush-light transition-colors"
            >
              Começar agora
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
