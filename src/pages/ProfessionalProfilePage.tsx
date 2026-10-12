import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight, Star, MapPin, Heart, Share2, Camera,
  Phone, Mail, Instagram, MessageCircle,
  Calendar, Clock, Award, CheckCircle2, ChevronLeft
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  })
};

const professionalsData: Record<string, {
  name: string;
  category: string;
  location: string;
  rating: number;
  reviews: number;
  description: string;
  price: string;
  image: string;
  bio: string;
  services: string[];
  gallery: string[];
  social: { platform: string; handle: string }[];
  reviewsList: { name: string; rating: number; text: string; date: string }[];
}> = {
  '1': {
    name: 'Luz & Arte Fotografia',
    category: 'Fotografia',
    location: 'São Paulo, SP',
    rating: 4.9,
    reviews: 127,
    description: 'Fotografia artística para casamentos e eventos especiais.',
    price: 'A partir de R$ 2.500',
    image: '📸',
    bio: 'Há mais de 10 anos capturando momentos únicos. Nosso time de fotógrafos é apaixonado por contar histórias através das imagens. Trabalhamos com equipamentos de última geração e entregamos álbuns digitais e impressos de alta qualidade. Cada evento é tratado com dedicação total, desde o pré-evento até a entrega final.',
    services: [
      'Cobertura completa do evento',
      'Sessão de fotos antes do evento',
      'Álbum digital e impresso',
      'Fotos editadas em alta resolução',
      'Fotógrafo + cinegrafista',
      'Drone aéreo (adicional)',
    ],
    gallery: ['📸', '📷', '🎞️', '🎥', '🖼️', '✨'],
    social: [
      { platform: 'Instagram', handle: '@luzarte.foto' },
      { platform: 'Facebook', handle: 'Luz & Arte Fotografia' },
    ],
    reviewsList: [
      { name: 'Fernanda M.', rating: 5, text: 'Excepcional! As fotos do nosso casamento ficaram incríveis. Cada momento foi capturado com muito carinho e profissionalismo. Super recomendo!', date: 'Jan 2026' },
      { name: 'Ricardo P.', rating: 5, text: 'Equipe muito profissional e atenciosa. O álbum ficou lindo e entregaram antes do prazo. Nosso evento de 15 anos ficou eternizado!', date: 'Dez 2025' },
      { name: 'Ana Clara S.', rating: 5, text: 'Melhor escolha que fizemos! As fotos ficaram maravilhosas e o atendimento foi impecável do início ao fim.', date: 'Nov 2025' },
      { name: 'Marcos L.', rating: 4, text: 'Muito bom trabalho! Fotos lindas e entrega rápida. Só não dei 5 estrelas porque o drone teve um pequeno atraso.', date: 'Out 2025' },
    ],
  },
};

const defaultProfessional = {
  name: 'Profissional',
  category: 'Serviços',
  location: 'Brasil',
  rating: 4.8,
  reviews: 100,
  description: 'Profissional verificado no Festivity.',
  price: 'Sob consulta',
  image: '⭐',
  bio: 'Profissional dedicado e experiente, pronto para transformar seu evento em algo especial. Com anos de experiência no mercado, oferecemos qualidade, compromisso e satisfação garantida.',
  services: ['Serviço personalizado', 'Atendimento dedicado', 'Qualidade garantida', 'Prazo cumprido'],
  gallery: ['⭐', '🌟', '💫', '✨', '🎨', '🏆'],
  social: [
    { platform: 'Instagram', handle: '@profissional' },
  ],
  reviewsList: [
    { name: 'Cliente Satisfeito', rating: 5, text: 'Excelente profissional! Super recomendo para eventos.', date: 'Jan 2026' },
  ],
};

export default function ProfessionalProfilePage() {
  const { id } = useParams();
  const pro = professionalsData[id || ''] || defaultProfessional;

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto section-padding">
        {/* Breadcrumb */}
        <motion.div initial="hidden" animate="visible">
          <motion.div custom={0} variants={fadeUp} className="flex items-center gap-2 text-sm text-charcoal-light mb-6">
            <Link to="/" className="hover:text-charcoal transition-colors">Início</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/servicos" className="hover:text-charcoal transition-colors">Serviços</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-charcoal">{pro.name}</span>
          </motion.div>
        </motion.div>

        {/* Back button */}
        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
          <Link
            to="/servicos"
            className="inline-flex items-center gap-1.5 text-sm text-charcoal-light hover:text-charcoal transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Hero */}
            <motion.div initial="hidden" animate="visible">
              <motion.div custom={1} variants={fadeUp} className="card-base overflow-hidden mb-6">
                {/* Gallery header */}
                <div className="h-64 sm:h-80 bg-cream rounded-2xl flex items-center justify-center text-6xl mb-6 relative">
                  {pro.image}
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    <button className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white transition-colors">
                      <Heart className="w-5 h-5" />
                    </button>
                    <button className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                  <div>
                    <h1 className="font-display text-2xl lg:text-3xl font-semibold mb-2">{pro.name}</h1>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm bg-cream px-3 py-1 rounded-xl flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5" />
                        {pro.category}
                      </span>
                      <span className="text-sm text-charcoal-light flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {pro.location}
                      </span>
                      <span className="text-sm flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-blush fill-blush" />
                        <strong>{pro.rating}</strong>
                        <span className="text-charcoal-light">({pro.reviews} avaliações)</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-semibold text-sage">{pro.price}</p>
                  </div>
                </div>

                <button className="btn-blush w-full sm:w-auto flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Solicitar orçamento
                </button>
              </motion.div>
            </motion.div>

            {/* About */}
            <motion.div initial="hidden" animate="visible">
              <motion.div custom={2} variants={fadeUp} className="card-base mb-6">
                <h2 className="font-display text-lg font-semibold mb-3">Sobre</h2>
                <p className="text-sm text-charcoal-light leading-relaxed">{pro.bio}</p>
              </motion.div>
            </motion.div>

            {/* Services */}
            <motion.div initial="hidden" animate="visible">
              <motion.div custom={3} variants={fadeUp} className="card-base mb-6">
                <h2 className="font-display text-lg font-semibold mb-4">Serviços inclusos</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {pro.services.map((service, i) => (
                    <div key={i} className="flex items-center gap-2.5 py-2">
                      <CheckCircle2 className="w-4 h-4 text-sage flex-shrink-0" />
                      <span className="text-sm">{service}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Gallery */}
            <motion.div initial="hidden" animate="visible">
              <motion.div custom={4} variants={fadeUp} className="card-base mb-6">
                <h2 className="font-display text-lg font-semibold mb-4">Portfólio</h2>
                <div className="grid grid-cols-3 gap-3">
                  {pro.gallery.map((item, i) => (
                    <div key={i} className="aspect-square bg-cream rounded-2xl flex items-center justify-center text-3xl
                                            hover:scale-105 transition-transform duration-300 cursor-pointer">
                      {item}
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Reviews */}
            <motion.div initial="hidden" animate="visible">
              <motion.div custom={5} variants={fadeUp} className="card-base">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-semibold">Avaliações</h2>
                  <div className="flex items-center gap-1.5 bg-cream px-3 py-1.5 rounded-xl">
                    <Star className="w-4 h-4 text-blush fill-blush" />
                    <span className="font-semibold text-sm">{pro.rating}</span>
                    <span className="text-xs text-charcoal-light">({pro.reviews})</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {pro.reviewsList.map((review, i) => (
                    <div key={i} className="pb-4 border-b border-charcoal/5 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blush/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-semibold text-blush-dark">{review.name.charAt(0)}</span>
                          </div>
                          <span className="text-sm font-medium">{review.name}</span>
                        </div>
                        <span className="text-xs text-charcoal-light">{review.date}</span>
                      </div>
                      <div className="flex items-center gap-0.5 mb-1.5">
                        {Array.from({ length: review.rating }).map((_, j) => (
                          <Star key={j} className="w-3 h-3 text-blush fill-blush" />
                        ))}
                      </div>
                      <p className="text-sm text-charcoal-light leading-relaxed">{review.text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Contact Card */}
            <motion.div initial="hidden" animate="visible">
              <motion.div custom={2} variants={fadeUp} className="card-base mb-6 sticky top-24">
                <h3 className="font-display font-semibold mb-4">Contato</h3>
                <div className="space-y-3">
                  <a href="#" className="flex items-center gap-3 p-3 rounded-xl hover:bg-cream transition-colors group">
                    <div className="w-10 h-10 bg-blush/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Phone className="w-5 h-5 text-blush" />
                    </div>
                    <div>
                      <p className="text-xs text-charcoal-light">Telefone</p>
                      <p className="text-sm font-medium">(11) 99999-0000</p>
                    </div>
                  </a>
                  <a href="#" className="flex items-center gap-3 p-3 rounded-xl hover:bg-cream transition-colors group">
                    <div className="w-10 h-10 bg-sage/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Mail className="w-5 h-5 text-sage" />
                    </div>
                    <div>
                      <p className="text-xs text-charcoal-light">E-mail</p>
                      <p className="text-sm font-medium">contato@luzarte.com.br</p>
                    </div>
                  </a>
                  <a href="#" className="flex items-center gap-3 p-3 rounded-xl hover:bg-cream transition-colors group">
                    <div className="w-10 h-10 bg-rose/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Instagram className="w-5 h-5 text-rose" />
                    </div>
                    <div>
                      <p className="text-xs text-charcoal-light">Instagram</p>
                      <p className="text-sm font-medium">@luzarte.foto</p>
                    </div>
                  </a>
                </div>

                <button className="btn-blush w-full mt-4 flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Enviar mensagem
                </button>

                <div className="mt-4 pt-4 border-t border-charcoal/5">
                  <div className="flex items-center gap-2 text-xs text-charcoal-light">
                    <Clock className="w-3.5 h-3.5" />
                    Resposta em até 2 horas
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div initial="hidden" animate="visible">
              <motion.div custom={3} variants={fadeUp} className="card-base">
                <h3 className="font-display font-semibold mb-4">Informações</h3>
                <div className="space-y-3">
                  {[
                    { icon: Award, label: 'Experiência', value: '10+ anos' },
                    { icon: Camera, label: 'Eventos realizados', value: '350+' },
                    { icon: CheckCircle2, label: 'Taxa de satisfação', value: '98%' },
                    { icon: Calendar, label: 'Disponibilidade', value: '2026' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-charcoal-light" />
                      <span className="text-xs text-charcoal-light flex-1">{item.label}</span>
                      <span className="text-xs font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
