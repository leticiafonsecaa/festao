import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const DEMO_ACCOUNTS_KEY = 'festao-demo-accounts';
const DEMO_SESSION_KEY = 'festao-demo-session';
export const DEMO_ACCOUNT = {
  email: 'demo@festao.com',
  password: 'Festao123!',
  name: 'Conta de demonstração',
};

interface DemoAccount {
  id: string;
  email: string;
  password: string;
  name: string;
}

interface AuthResult {
  error: string | null;
  needsConfirmation?: boolean;
}

// O Supabase gerencia sessões remotas; sem backend, a sessão demo fica no
// localStorage e só serve para testar o fluxo neste navegador.

interface AuthState {
  session: Session | null;
  user: User | null;
  initialized: boolean;
  setSession: (session: Session | null) => void;
  initAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  session: null,
  user: null,
  initialized: false,

  setSession: (session) => set({ session, user: session?.user ?? null }),

  initAuth: async () => {
    if (!isSupabaseConfigured()) {
      const saved = localStorage.getItem(DEMO_SESSION_KEY);
      if (saved) {
        try {
          const account = JSON.parse(saved) as Pick<DemoAccount, 'id' | 'email' | 'name'>;
          const user = {
            id: account.id,
            email: account.email,
            user_metadata: { display_name: account.name },
          } as User;
          set({ session: { user } as Session, user, initialized: true });
          return;
        } catch {
          localStorage.removeItem(DEMO_SESSION_KEY);
        }
      }
      set({ session: null, user: null, initialized: true });
      return;
    }

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

  signIn: async (email, password) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) return { error: error.message };
      if (!data.session) return { error: 'Confirme seu e-mail antes de entrar. Verifique a caixa de entrada e o spam.' };
      return { error: null };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const accounts = getDemoAccounts();
    const account = accounts.find((item) => item.email === normalizedEmail && item.password === password);
    if (!account) return { error: 'E-mail ou senha inválidos. Verifique os dados e tente novamente.' };
    persistDemoSession(account, set);
    return { error: null };
  },

  signUp: async (name, email, password) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: name.trim() },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) return { error: error.message };
      if (data.session) return { error: null };
      return { error: null, needsConfirmation: true };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const accounts = getDemoAccounts();
    if (accounts.some((account) => account.email === normalizedEmail)) {
      return { error: 'Já existe uma conta com este e-mail. Use "Entrar" ou recupere a senha.' };
    }
    const account = {
      id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email: normalizedEmail,
      password,
      name: name.trim(),
    };
    localStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
    persistDemoSession(account, set);
    return { error: null };
  },

  signOut: async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem(DEMO_SESSION_KEY);
    }
    set({ session: null, user: null });
  },
}));

function getDemoAccounts(): DemoAccount[] {
  const saved = localStorage.getItem(DEMO_ACCOUNTS_KEY);
  let accounts: DemoAccount[] = [];
  if (saved) {
    try {
      accounts = JSON.parse(saved) as DemoAccount[];
    } catch {
      localStorage.removeItem(DEMO_ACCOUNTS_KEY);
    }
  }
  if (!accounts.some((account) => account.email === DEMO_ACCOUNT.email)) {
    accounts.push({ id: 'demo-default', ...DEMO_ACCOUNT });
    localStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(accounts));
  }
  return accounts;
}

function persistDemoSession(account: DemoAccount, set: (state: Partial<AuthState>) => void) {
  localStorage.setItem(
    DEMO_SESSION_KEY,
    JSON.stringify({ id: account.id, email: account.email, name: account.name })
  );
  const user = {
    id: account.id,
    email: account.email,
    user_metadata: { display_name: account.name },
  } as User;
  set({ session: { user } as Session, user, initialized: true });
}
