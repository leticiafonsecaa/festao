import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/useAuth';
import { Sparkles } from 'lucide-react';

// Protege rotas autenticadas: sem sessão válida redireciona para /entrar,
// preservando o destino original no parâmetro ?next= (somente caminhos
// internos — previne open redirect).

export function safeNextPath(next: string | null): string {
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.includes('://')) {
    return next;
  }
  return '/dashboard';
}

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { session, initialized } = useAuth();
  const location = useLocation();

  if (!initialized) {
    // Aguarda a restauração da sessão antes de decidir (evita flicker de redirect).
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-8 h-8 text-blush mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-charcoal-light">Carregando…</p>
        </div>
      </main>
    );
  }

  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/entrar?next=${next}`} replace />;
  }

  return <>{children}</>;
}
