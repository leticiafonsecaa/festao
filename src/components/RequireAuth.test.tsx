import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RequireAuth, { safeNextPath } from './RequireAuth';
import { useAuth } from '../store/useAuth';

vi.mock('../store/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <p>Área privada</p>
            </RequireAuth>
          }
        />
        <Route path="/entrar" element={<p>Página de login</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('safeNextPath', () => {
  it('aceita apenas caminhos internos e barra redirecionamentos externos', () => {
    expect(safeNextPath('/dashboard/abc')).toBe('/dashboard/abc');
    expect(safeNextPath('https://malicioso.com')).toBe('/dashboard');
    expect(safeNextPath('//malicioso.com')).toBe('/dashboard');
    expect(safeNextPath('/x://y')).toBe('/dashboard');
    expect(safeNextPath(null)).toBe('/dashboard');
  });
});

describe('RequireAuth', () => {
  it('mostra loading enquanto a sessão restaura', () => {
    mockedUseAuth.mockReturnValue({
      session: null,
      user: null,
      initialized: false,
      setSession: () => undefined,
      initAuth: () => Promise.resolve(),
      signOut: () => Promise.resolve(),
    });
    renderAt('/dashboard');
    expect(screen.getByText('Carregando…')).toBeInTheDocument();
  });

  it('bloqueia acesso sem sessão e libera com sessão', () => {
    mockedUseAuth.mockReturnValue({
      session: null,
      user: null,
      initialized: true,
      setSession: () => undefined,
      initAuth: () => Promise.resolve(),
      signOut: () => Promise.resolve(),
    });
    const { unmount } = renderAt('/dashboard');
    expect(screen.getByText('Página de login')).toBeInTheDocument();
    unmount();

    mockedUseAuth.mockReturnValue({
      session: { user: { id: 'u1', email: 'a@b.c' } } as never,
      user: { id: 'u1', email: 'a@b.c' } as never,
      initialized: true,
      setSession: () => undefined,
      initAuth: () => Promise.resolve(),
      signOut: () => Promise.resolve(),
    });
    renderAt('/dashboard');
    expect(screen.getByText('Área privada')).toBeInTheDocument();
  });
});
