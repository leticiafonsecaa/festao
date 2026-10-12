import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useAuth } from './store/useAuth'

// Restaura a sessão do Supabase antes das renderizações (estado initialized
// evita flicker de redirecionamento em rotas protegidas).
void useAuth.getState().initAuth()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
