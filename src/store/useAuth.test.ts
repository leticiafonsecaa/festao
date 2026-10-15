import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: () => false,
  supabase: { auth: {} },
}));

import { DEMO_ACCOUNT, useAuth } from './useAuth';

describe('useAuth no modo demo', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuth.setState({ session: null, user: null, initialized: false });
  });

  it('permite entrar com a conta pronta', async () => {
    const result = await useAuth.getState().signIn(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password);

    expect(result.error).toBeNull();
    expect(useAuth.getState().user?.email).toBe(DEMO_ACCOUNT.email);
  });

  it('cria conta, encerra sessão e permite entrar novamente', async () => {
    const signup = await useAuth.getState().signUp('Pessoa Teste', 'teste@exemplo.com', 'senha1234');
    expect(signup.error).toBeNull();
    expect(useAuth.getState().user?.email).toBe('teste@exemplo.com');

    await useAuth.getState().signOut();
    const login = await useAuth.getState().signIn('teste@exemplo.com', 'senha1234');
    expect(login.error).toBeNull();

    await useAuth.getState().initAuth();
    expect(useAuth.getState().user?.email).toBe('teste@exemplo.com');
  });
});