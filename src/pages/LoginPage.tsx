import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { authErrorMessage } from '../lib/authErrors';
import { safeNextPath } from '../components/RequireAuth';
import { DEMO_ACCOUNT, useAuth } from '../store/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const signIn = useAuth((state) => state.signIn);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.error) {
        setError(authErrorMessage(result.error));
        return;
      }
      navigate(safeNextPath(searchParams.get('next')), { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="font-display text-2xl font-semibold">Entrar</h1>
          </div>

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

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-cream rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blush/30 transition-shadow"
                placeholder="Sua senha"
              />
            </div>

            {error && <p className="text-rose text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-sm font-medium disabled:opacity-60"
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <aside className="mt-5 rounded-xl bg-blush/15 p-4 text-xs text-charcoal-light">
            <p className="font-semibold text-charcoal">Acesso de demonstração</p>
            <p className="mt-1">E-mail: {DEMO_ACCOUNT.email}</p>
            <p>Senha: {DEMO_ACCOUNT.password}</p>
            <p className="mt-2">Sem Supabase configurado, contas e dados ficam apenas neste navegador.</p>
          </aside>

          <div className="mt-6 text-center space-y-2">
            <Link to="/esqueci-senha" className="block text-xs text-charcoal-light hover:text-charcoal transition-colors">
              Esqueci minha senha
            </Link>
            <p className="text-xs text-charcoal-light">
              Ainda não tem conta?{' '}
              <Link
                to={`/cadastro${searchParams.get('next') ? `?next=${encodeURIComponent(safeNextPath(searchParams.get('next')))}` : ''}`}
                className="font-semibold hover:underline"
              >
                Criar conta
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
