import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MailCheck } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { authErrorMessage } from '../lib/authErrors';

const emailSchema = z.string().trim().email('Informe um e-mail válido.');

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Verifique o e-mail.');
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      // Mesmo com e-mail inexistente respondemos com sucesso (não vaza
      // quais e-mails têm conta).
      if (err) {
        setError(authErrorMessage(err));
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
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
            <h1 className="font-display text-2xl font-semibold mb-2">Confira seu e-mail</h1>
            <p className="text-sm text-charcoal-light mb-6 leading-relaxed">
              Se existir uma conta com <strong>{email.trim()}</strong>, você receberá um link
              para criar uma nova senha. O link expira em alguns minutos.
            </p>
            <Link to="/entrar" className="btn-primary inline-block w-full text-sm text-center">
              Voltar para o login
            </Link>
          </motion.div>
        </div>
      </main>
    );
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
          <h1 className="font-display text-2xl font-semibold mb-2">Esqueci minha senha</h1>
          <p className="text-sm text-charcoal-light mb-6">
            Informe seu e-mail e enviaremos um link para criar uma nova senha.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {error && <p className="text-rose text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-sm font-medium disabled:opacity-60"
            >
              {loading ? 'Enviando…' : 'Enviar link de recuperação'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-charcoal-light">
            Lembrou a senha?{' '}
            <Link to="/entrar" className="font-semibold hover:underline">
              Entrar
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
