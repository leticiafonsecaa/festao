import { describe, expect, it } from 'vitest';
import { authErrorMessage } from './authErrors';

describe('authErrorMessage', () => {
  it('traduz erros conhecidos do Supabase Auth para pt-BR', () => {
    expect(authErrorMessage(new Error('Invalid login credentials'))).toContain(
      'E-mail ou senha inválidos'
    );
    expect(authErrorMessage(new Error('Email not confirmed'))).toContain('Confirme seu e-mail');
    expect(authErrorMessage(new Error('User already registered'))).toContain('Já existe uma conta');
    expect(authErrorMessage(new Error('Password should be at least 8 characters'))).toContain(
      'senha'
    );
  });

  it('preserva o estado interno para erros físicos ou de rede', () => {
    expect(authErrorMessage(undefined)).toBe(
      'Não foi possível concluir a operação. Tente novamente.'
    );
    expect(authErrorMessage('algum erro inesperado')).toBe(
      'Não foi possível concluir a operação. Tente novamente.'
    );
  });
});
