import { createClient } from '@supabase/supabase-js';

// Cliente Supabase do Festão.
// Usa apenas variáveis PÚBLICAS (VITE_*) — a publishable key (sb_publishable_*)
// é segura no cliente desde que as políticas RLS
// (supabase/migrations/20261011190000_rls.sql) estejam aplicadas. A anon key legada
// (JWT) continua funcionando como alternativa temporária. A secret key
// (sb_secret_*) / service_role NUNCA deve ser usada aqui.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  | string
  | undefined;

if (!supabaseUrl || !supabasePublishableKey) {
  // Falha visível em desenvolvimento; em produção o app cai para o modo
  // sem backend até as variáveis serem configuradas na Vercel.
  console.warn(
    '[festao] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY ausentes. ' +
      'Copie .env.example para .env.local e preencha os valores.'
  );
}

export const supabase = createClient(
  supabaseUrl ?? 'http://localhost:54321',
  supabasePublishableKey ?? 'anon-key-not-configured',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// Verdadeiro quando as env vars estão preenchidas — o app só tenta falar com
// o Supabase nesse caso; caso contrário entra em modo demo (localStorage),
// preservando o comportamento original do projeto.
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabasePublishableKey);
}
