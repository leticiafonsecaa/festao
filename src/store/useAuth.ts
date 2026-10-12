import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Estado global de autenticação. Mesmo padrão da store do projeto (zustand),
// mas sem persistência em localStorage: a sessão é gerenciada pelo SDK do
// Supabase (cookies/localStorage próprios, com refresh automático).

interface AuthState {
  session: Session | null;
  user: User | null;
  initialized: boolean;
  setSession: (session: Session | null) => void;
  initAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  session: null,
  user: null,
  initialized: false,

  setSession: (session) => set({ session, user: session?.user ?? null }),

  initAuth: async () => {
    // Restaura sessão existente (se houver) e assina mudanças futuras.
    const { data } = await supabase.auth.getSession();
    set({
      session: data.session,
      user: data.session?.user ?? null,
      initialized: true,
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, initialized: true });
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));
