// Mapeia erros do Supabase Auth para mensagens amigáveis em pt-BR.
// Nunca expõe detalhes internos: mensagens genéricas para erros desconhecidos.

export function authErrorMessage(error: unknown): string {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error ?? '');

  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials') || lower.includes('e-mail ou senha inválidos')) {
    return 'E-mail ou senha inválidos. Verifique os dados e tente novamente.';
  }
  if (lower.includes('email not confirmed') || lower.includes('confirme seu e-mail antes')) {
    return 'Confirme seu e-mail antes de entrar. Caixa de entrada e spam.';
  }
  if (
    lower.includes('already registered') ||
    lower.includes('already been registered') ||
    lower.includes('já existe uma conta')
  ) {
    return 'Já existe uma conta com este e-mail. Use "Entrar" ou recupere a senha.';
  }
  if (lower.includes('password should be') || lower.includes('password')) {
    return 'A senha não atende aos requisitos mínimos. Use pelo menos 8 caracteres.';
  }
  if (lower.includes('rate limit') || lower.includes('too many') || lower.includes('security purposes')) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.';
  }
  if (lower.includes('signup is disabled')) {
    return 'Cadastro temporariamente indisponível. Tente mais tarde.';
  }
  if (lower.includes('invalid email') || lower.includes('unable to validate email')) {
    return 'Informe um e-mail válido.';
  }
  if (lower.includes('both password and password confirmation')) {
    return 'As duas senhas não coincidem.';
  }
  if (lower.includes('new password')) {
    return 'A nova senha precisa ser diferente da atual.';
  }
  if (lower.includes('same password')) {
    return 'A nova senha precisa ser diferente da atual.';
  }
  if (lower.includes('token') || lower.includes('expired') || linkRelated(message)) {
    return 'O link expirou ou já foi usado. Solicite um novo.';
  }

  return 'Não foi possível concluir a operação. Tente novamente.';
}

function linkRelated(message: string): boolean {
  return /link/i.test(message);
}
