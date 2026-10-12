import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Sparkles, LogOut, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../store/useAuth';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { session, initialized, signOut } = useAuth();

  const navLinks = [
    { path: '/', label: 'Início' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/servicos', label: 'Serviços' },
  ];

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    navigate('/', { replace: true });
  };

  const emailLabel = session?.user?.email ?? '';
  const shortEmail = emailLabel.length > 22 ? `${emailLabel.slice(0, 20)}…` : emailLabel;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/80 backdrop-blur-xl border-b border-charcoal/5">
      <div className="max-w-7xl mx-auto section-padding">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-charcoal rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-5 h-5 text-blush" />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">
              Festão
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.path
                    ? 'bg-charcoal text-ivory'
                    : 'text-charcoal-light hover:bg-charcoal/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA / sessão */}
          <div className="hidden md:flex items-center gap-3">
            {initialized && session ? (
              <>
                <span
                  className="inline-flex items-center gap-1.5 text-xs text-charcoal-light max-w-[180px]"
                  title={emailLabel}
                >
                  <UserIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{shortEmail}</span>
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 text-xs text-charcoal-light hover:text-charcoal transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair
                </button>
                <Link to="/criar-evento" className="btn-primary text-xs px-6 py-2.5">
                  Criar evento
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/entrar"
                  className="text-xs font-medium text-charcoal-light hover:text-charcoal transition-colors"
                >
                  Entrar
                </Link>
                <Link to="/cadastro" className="btn-secondary text-xs px-5 py-2.5">
                  Criar conta
                </Link>
                <Link to="/criar-evento" className="btn-primary text-xs px-6 py-2.5">
                  Criar evento
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden shrink-0 inline-flex items-center justify-center p-2 rounded-xl text-charcoal hover:bg-charcoal/5 transition-colors"
            aria-label="Menu de navegação"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-cream border-b border-charcoal/5 overflow-hidden"
          >
            <div className="section-padding py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? 'bg-charcoal text-ivory'
                      : 'text-charcoal-light hover:bg-charcoal/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/criar-evento"
                onClick={() => setIsOpen(false)}
                className="block btn-primary text-center text-xs mt-3"
              >
                Criar evento
              </Link>
              {initialized && session ? (
                <div className="pt-3 mt-3 border-t border-charcoal/5 space-y-1">
                  <p className="px-4 text-xs text-charcoal-light truncate" title={emailLabel}>
                    {shortEmail}
                  </p>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-3 rounded-2xl text-sm font-medium text-charcoal-light hover:bg-charcoal/5 transition-colors"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <div className="pt-3 mt-3 border-t border-charcoal/5 space-y-1">
                  <Link
                    to="/entrar"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 rounded-2xl text-sm font-medium text-charcoal-light hover:bg-charcoal/5 transition-colors"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/cadastro"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 rounded-2xl text-sm font-medium text-charcoal-light hover:bg-charcoal/5 transition-colors"
                  >
                    Criar conta
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
