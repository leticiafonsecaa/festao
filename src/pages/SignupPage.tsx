import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, MailCheck } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { authErrorMessage } from '../lib/authErrors';
import { safeNextPath } from '../components/RequireAuth';

// Validação com zod (dependência existente no projeto, antes não usada).
const signupSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome (mínimo 2 caracteres).').max(100),
  email: z.string().trim().email('Informe um e-mail válido.'),
  password: z.string().min(8, 'A senha precisa de pelo menos 8 caracteres.').max(72),
});

// URL de retorno pós-confirmação: usa a origem atual (localhost, preview ou
// produção) e é configurada também no painel do Supabase (Redirect URLs).
function redirectTo(path: string): string {
  return `${window.location.origin}${path}`;
}

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // K2: confirmação de e-mail ON — após signUp mostramos a tela de confirmação.
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sent' | 'error'>('idle');

  const nextPath = safeNextPath(searchParams.get('next'));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = signupSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Verifique os campos.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: { display_name: parsed.data.name },
          emailRedirectTo: redirectTo('/'),
        },
      });
      if (err) {
        setError(authErrorMessage(err));
        return;
      }
      // Com confirmação ON, data.session é null até o clique no link do e-mail.
      // Com confirmação OFF, o Supabase já devolve sessão — segue direto.
      if (data.session) {
        window.location.assign(nextPath);
        return;
      }
      setConfirmationSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendState('idle');
    const { error: err } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: redirectTo('/') },
    });
    setResendState(err ? 'error' : 'sent');
  };

  if (confirmationSent) {
    return <ConfirmationScreen email={email} onResend={handleResend} resendState={resendState} />;
  }

  return (
    <main className="pt-24 pb-16 min-h-screen bg-cream">
      <div className="max-w-md mx-auto section-padding">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="card-base"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-charcoal rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blush" />
            </div>
            <h1 className="font-display text-2xl font-semibold">Criar conta</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1.5">
                Nome
              </label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blush/30 transition-shadow"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blush/30 transition-shadow"
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blush/30 transition-shadow"
                placeholder="Mínimo de 8 caracteres"
              />
            </div>

            {error && <p className="text-rose text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-sm font-medium disabled:opacity-60"
            >
              {loading ? 'Criando conta…' : 'Criar conta'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-charcoal-light">
            Já tem conta?{' '}
            <Link
              to={`/entrar${searchParams.get('next') ? `?next=${encodeURIComponent(nextPath)}` : ''}`}
              className="font-semibold hover:underline"
            >
              Entrar
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}

function ConfirmationScreen({
  email,
  onResend,
  resendState,
}: {
  email: string;
  onResend: () => void;
  resendState: 'idle' | 'sent' | 'error';
}) {
  return (
    <main className="pt-24 pb-16 min-h-screen bg-cream">
      <div className="max-w-md mx-auto section-padding">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="card-base text-center"
        >
          <MailCheck className="w-10 h-10 text-blush mx-auto mb-4" />
          <h1 className="font-display text-2xl font-semibold mb-2">Verifique seu e-mail</h1>
          <p className="text-sm text-charcoal-light mb-6 leading-relaxed">
            Enviamos um link de confirmação para <strong>{email.trim()}</strong>.
            Clique no link para ativar sua conta e poder entrar. Confira também a caixa de spam.
          </p>
          {resendState === 'sent' && (
            <p className="text-xs text-charcoal-light mb-4">E-mail reenviado. Aguarde alguns minutos.</p>
          )}
          {resendState === 'error' && (
            <p className="text-rose text-xs mb-4">
              Não foi possível reenviar agora. Aguarde alguns minutos e tente de novo.
            </p>
          )}
          <div className="space-y-3">
            <button type="button" onClick={onResend} className="btn-secondary w-full text-sm">
              Reenviar e-mail de confirmação
            </button>
            <Link to="/entrar" className="btn-primary inline-block w-full text-sm text-center">
              Já confirmei, entrar
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
