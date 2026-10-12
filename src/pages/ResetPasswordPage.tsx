import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { authErrorMessage } from '../lib/authErrors';

const passwordSchema = z
  .string()
  .min(8, 'A senha precisa de pelo menos 8 caracteres.')
  .max(72, 'A senha é muito longa.');

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Verifique a senha.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password: parsed.data });
      if (err) {
        setError(authErrorMessage(err));
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="pt-24 pb-16 min-h-screen bg-cream">
        <div className="max-w-md mx-auto section-padding">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="card-base text-center"
          >
            <KeyRound className="w-10 h-10 text-blush mx-auto mb-4" />
            <h1 className="font-display text-2xl font-semibold mb-2">Senha atualizada</h1>
            <p className="text-sm text-charcoal-light mb-6">
              Sua senha foi alterada com sucesso. Use a nova senha para entrar.
            </p>
            <button
              type="button"
              onClick={() => navigate('/entrar', { replace: true })}
              className="btn-primary w-full text-sm"
            >
              Ir para o login
            </button>
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
          <h1 className="font-display text-2xl font-semibold mb-2">Criar nova senha</h1>
          <p className="text-sm text-charcoal-light mb-6">
            Você chegou aqui por um link de recuperação válido. Escolha uma nova senha.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                Nova senha
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

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium mb-1.5">
                Confirmar nova senha
              </label>
              <input
                id="confirm"
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blush/30 transition-shadow"
                placeholder="Repita a nova senha"
              />
            </div>

            {error && <p className="text-rose text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-sm font-medium disabled:opacity-60"
            >
              {loading ? 'Salvando…' : 'Salvar nova senha'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-charcoal-light">
            Link expirado?{' '}
            <Link to="/esqueci-senha" className="font-semibold hover:underline">
              Solicitar um novo
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
