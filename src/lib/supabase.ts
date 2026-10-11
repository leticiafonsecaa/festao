import { createClient } from '@supabase/supabase-js';

// Cliente Supabase do Festão.
// Usa apenas variáveis PÚBLICAS (VITE_*) — a anon key é segura no cliente
// desde que as políticas RLS (supabase/migrations/0002_rls.sql) estejam
// aplicadas. A service_role key NUNCA deve ser usada aqui.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Falha visível em desenvolvimento; em produção o app cai para o modo
  // sem backend até as variáveis serem configuradas na Vercel.
  console.warn(
    '[festao] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes. ' +
      'Copie .env.example para .env.local e preencha os valores.'
  );
}

export const supabase = createClient(
  supabaseUrl ?? 'http://localhost:54321',
  supabaseAnonKey ?? 'anon-key-not-configured',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
