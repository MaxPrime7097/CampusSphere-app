// Force Vite HMR reload
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import Pricing from './pages/Pricing';
import Blogs from './pages/Blogs';
import BlogDetail from './pages/BlogDetail';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import { SidebarLayout } from './components/layout/SidebarLayout';

function SSOCatcher() {
  const navigate = useNavigate();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('access_token');
    const refresh = params.get('refresh_token');
    if (token) {
      localStorage.setItem('sphera_access', token);
      if (refresh) localStorage.setItem('sphera_refresh', refresh);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Navigate to dashboard without full reload
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useSpheraAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="flex items-center justify-center relative overflow-hidden">
          <img
            src="/sphera-logo-dark.png"
            alt="Sphera"
            className="w-24 h-auto animate-[spin_3s_linear_infinite] relative z-10"
          />
        </div>
        <p className="text-sphera-text-muted text-sm font-medium tracking-wide animate-pulse uppercase">
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
      {/* SEO meta tags */}
      <Helmet>
        <title>Sphera – Assistante IA · CampusSphere</title>
        <meta
          name="description"
          content="Sphera, l’assistante IA académique, propose fiches de révision, quiz, flashcards, correction d’annales et un chat IA en direct. Connectez votre compte CampusSphere pour une expérience fluide."
        />
        <link rel="canonical" href="https://sphera.campussphere.app/" />
        <meta property="og:title" content="Sphera – Application IA" />
        <meta
          property="og:description"
          content="Explorez Sphera : génération de fiches, quiz, flashcards, correction d’annales et chat IA en temps réel, intégré à CampusSphere."
        />
        <meta property="og:url" content="https://sphera.campussphere.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://sphera.campussphere.app/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sphera – Application IA" />
        <meta
          name="twitter:description"
          content="Votre assistante IA pour réviser, créer des quiz, flashcards, corriger des annales et discuter en direct."
        />
        <meta name="twitter:image" content="https://sphera.campussphere.app/og-image.png" />
      </Helmet>
      <SSOCatcher />
      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/:id" element={<BlogDetail />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/app" element={localStorage.getItem('sphera_access') ? <Navigate to="/dashboard" replace /> : <AppPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/result" element={<GuestResult />} />
          {/* Protected */}
          <Route element={<ProtectedRoute><SidebarLayout /></ProtectedRoute>}> 
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<CreateSession />} />
            <Route path="/sessions/:id" element={<SessionDetail type="session" />} />
            <Route path="/annales/:id" element={<SessionDetail type="annale" />} />
          </Route>
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
