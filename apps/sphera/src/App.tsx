// Force Vite HMR reload
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useSpheraAuth } from './contexts/SpheraAuthContext';
import Landing from './pages/Landing';
import AppPage from './pages/AppPage';
import Login from './pages/Login';
import Register from './pages/Register';
import GuestResult from './pages/GuestResult';
import Dashboard from './pages/Dashboard';
import SessionDetail from './pages/SessionDetail';
import AnnaleDetail from './pages/AnnaleDetail';
import CreateSession from './pages/CreateSession';
import ChatPage from './pages/ChatPage';
import Pricing from './pages/Pricing';
import Blogs from './pages/Blogs';
import BlogDetail from './pages/BlogDetail';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import LegalNotice from './pages/LegalNotice';
import TermsOfSale from './pages/TermsOfSale';
import SpheraLiveShowcase from './pages/SpheraLiveShowcase';
import QuizLiveHome from './pages/QuizLiveHome';
import QuizLiveHost from './pages/QuizLiveHost';
import QuizLiveJoin from './pages/QuizLiveJoin';
import { SidebarLayout } from './components/layout/SidebarLayout';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}

function SSOCatcher() {
  const navigate = useNavigate();
  const { setUser } = useSpheraAuth();
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
    const hashParams = new URLSearchParams(hash);
    const token = hashParams.get('access_token') || searchParams.get('access_token');
    const refresh = hashParams.get('refresh_token') || searchParams.get('refresh_token');
    if (token) {
      localStorage.setItem('sphera_access', token);
      if (refresh) localStorage.setItem('sphera_refresh', refresh);
      // Clean URL (both query and hash)
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      // Fetch user and update auth context BEFORE navigating so ProtectedRoute
      // sees isAuthenticated=true immediately (fixes SSO-redirects-to-login bug).
      import('./services/spheraApi').then(({ getCurrentUser }) => {
        getCurrentUser()
          .then((u) => {
            if (u) setUser(u);
          })
          .catch(() => { /* token invalid — leave boot() to handle it */ })
          .finally(() => {
            navigate('/app', { replace: true });
          });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useSpheraAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="flex items-center justify-center relative overflow-hidden">
          <img
            src="/sphera_logo.svg"
            alt="Sphera"
            className="w-20 h-auto animate-[spin_3s_linear_infinite] relative z-10"
          />
        </div>
        <p className="text-sphera-text-muted text-sm font-medium tracking-wide animate-pulse">
          Initialisation...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      {/* SEO meta tags */}
      <Helmet>
        <title>Sphera — Fiches, Corrigés d’Examens & Quiz IA · CampusSphere</title>
        <meta
          name="description"
          content="Sphera transforme tes cours en fiches par chapitres, corrigés d’examens, quiz d’entraînement, cartes mémoire, cours en audio et sessions Sphera Live."
        />
        <link rel="canonical" href="https://sphera.campussphere.app/" />
        <meta property="og:title" content="Sphera — Fiches, Corrigés d’Examens & Quiz IA · CampusSphere" />
        <meta
          property="og:description"
          content="Fiches de cours, corrigés d’examens, quiz, cartes mémoire, cours en audio et Sphera Live — 10 générations offertes / semaine."
        />
        <meta property="og:url" content="https://sphera.campussphere.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://sphera.campussphere.app/sphera_preview.webp" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sphera — Assistante IA de Révision · CampusSphere" />
        <meta
          name="twitter:description"
          content="Ton assistante IA pour réviser, générer des quiz, flashcards, corriger d’anciennes épreuves et jouer sur Sphera Live."
        />
        <meta name="twitter:image" content="https://sphera.campussphere.app/sphera_preview.webp" />
      </Helmet>
      <SSOCatcher />
      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/sphera-live" element={<SpheraLiveShowcase />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/:slug" element={<BlogDetail />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/legal-notice" element={<LegalNotice />} />
          <Route path="/mentions-legales" element={<Navigate to="/legal-notice" replace />} />
          <Route path="/terms-of-sale" element={<TermsOfSale />} />
          <Route path="/cgv" element={<Navigate to="/terms-of-sale" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/result" element={<GuestResult />} />
          {/* Protected */}
          <Route element={<ProtectedRoute><SidebarLayout /></ProtectedRoute>}> 
            <Route path="/app" element={<Dashboard />} />
            <Route path="/dashboard" element={<Navigate to="/app" replace />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:threadId" element={<ChatPage />} />
            <Route path="/create" element={<CreateSession />} />
            <Route path="/sessions/:id" element={<SessionDetail type="session" />} />
            <Route path="/annales/:id" element={<SessionDetail type="annale" />} />
            <Route path="/live" element={<QuizLiveHome />} />
          </Route>
          
          {/* Sphera Live Fullscreen Routes */}
          <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
            <Route path="/live/host" element={<QuizLiveHost />} />
          </Route>
          <Route path="/live/join" element={<QuizLiveJoin />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
