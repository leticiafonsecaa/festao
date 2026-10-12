import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AIAssistant from './components/AIAssistant';
import RequireAuth from './components/RequireAuth';
import { useAuth } from './store/useAuth';
import { useStore } from './store/useStore';
import LandingPage from './pages/LandingPage';
import CreateEventPage from './pages/CreateEventPage';
import DashboardPage from './pages/DashboardPage';
import GuestsPage from './pages/GuestsPage';
import GiftListPage from './pages/GiftListPage';
import PersonalizationPage from './pages/PersonalizationPage';
import ServicesPage from './pages/ServicesPage';
import AgentePage from './pages/AgentePage';
import ProfessionalProfilePage from './pages/ProfessionalProfilePage';
import PublicEventPage from './pages/PublicEventPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function AppShell() {
  const location = useLocation();
  const isPublicEvent = location.pathname.startsWith('/e/');
  const session = useAuth((s) => s.session);
  const authInitialized = useAuth((s) => s.initialized);

  // Hidrata os eventos do usuário quando a sessão fica pronta (ou é limpa
  // no logout, evitando cache de dados privados em navegador compartilhado).
  useEffect(() => {
    if (authInitialized) {
      void useStore.getState().hydrate();
    }
  }, [authInitialized, session?.user?.id]);

  return (
    <div className="min-h-screen bg-cream font-body text-charcoal">
      {!isPublicEvent && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/agente" element={<AgentePage />} />
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/cadastro" element={<SignupPage />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        <Route path="/criar-evento" element={<RequireAuth><CreateEventPage /></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/dashboard/:id" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/eventos/:id/convidados" element={<RequireAuth><GuestsPage /></RequireAuth>} />
        <Route path="/eventos/:id/presentes" element={<RequireAuth><GiftListPage /></RequireAuth>} />
        <Route path="/eventos/:id/personalizar" element={<RequireAuth><PersonalizationPage /></RequireAuth>} />
        <Route path="/servicos" element={<ServicesPage />} />
        <Route path="/profissional/:id" element={<ProfessionalProfilePage />} />
        <Route path="/e/:slug" element={<PublicEventPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!isPublicEvent && <Footer />}
      {!isPublicEvent && <AIAssistant />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;