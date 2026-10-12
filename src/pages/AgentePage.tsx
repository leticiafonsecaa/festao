import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, ChevronLeft } from 'lucide-react';
import { responder, sugestoes } from '../lib/agente';

interface Mensagem {
  autor: 'voce' | 'agente';
  texto: string;
}

const abertura: Mensagem = {
  autor: 'agente',
  texto: 'Olá! Sou o assistente de demonstração do Festivity. Pergunte o que quiser sobre a plataforma.',
};

export default function AgentePage() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([abertura]);
  const [entrada, setEntrada] = useState('');

  const enviar = (texto: string) => {
    const pergunta = texto.trim();
    if (!pergunta) return;
    setMensagens((m) => [
      ...m,
      { autor: 'voce', texto: pergunta },
      { autor: 'agente', texto: responder(pergunta) },
    ]);
    setEntrada('');
  };

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="max-w-2xl mx-auto section-padding">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-charcoal-light hover:text-charcoal mb-6">
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </Link>

        <div className="bg-white rounded-3xl border border-charcoal/5 shadow-card overflow-hidden">
          <div className="bg-charcoal text-ivory p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-blush/20 rounded-xl flex items-center justify-center">
              <img src="/branding/icone-dark.svg" alt="" className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Assistente Festivity</p>
              <p className="text-xs text-ivory/60">Demonstração</p>
            </div>
          </div>

          <div className="h-96 overflow-y-auto p-4 space-y-3 bg-cream/50">
            {mensagens.map((m, i) => (
              <div key={i} className={`flex ${m.autor === 'voce' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.autor === 'voce'
                      ? 'bg-charcoal text-ivory rounded-br-md'
                      : 'bg-white text-charcoal border border-charcoal/5 rounded-bl-md'
                  }`}
                >
                  {m.texto}
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 pt-3 flex flex-wrap gap-2">
            {sugestoes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => enviar(s)}
                className="text-xs bg-cream text-charcoal-light px-3 py-1.5 rounded-full hover:bg-charcoal/5 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviar(entrada);
            }}
            className="p-4 flex gap-2"
          >
            <input
              type="text"
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              placeholder="Digite sua pergunta..."
              className="flex-1 bg-cream rounded-xl px-4 py-2.5 text-sm border border-charcoal/10 outline-none focus:ring-2 focus:ring-blush/30"
            />
            <button
              type="submit"
              aria-label="Enviar"
              className="w-11 h-11 bg-charcoal text-ivory rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
