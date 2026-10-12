/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL do projeto Supabase (ex.: https://xyzcompany.supabase.co) */
  readonly VITE_SUPABASE_URL: string
  /** Chave pública PUBLISHABLE (sb_publishable_*) do Supabase (segura no browser com RLS) */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
