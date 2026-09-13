import React, { lazy, Suspense, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { RequireAdminRole } from "./components/auth/RequireAdminRole";
import { AdminLayout } from "./admin/components/AdminLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Lazy loaded pages
const Landing = lazy(() => import("./pages/public/Landing").then(m => ({ default: m.Landing })));
const Login = lazy(() => import("./pages/public/Login").then(m => ({ default: m.Login })));
const Register = lazy(() => import("./pages/public/Register").then(m => ({ default: m.Register })));
const Home = lazy(() => import("./pages/Home").then(m => ({ default: m.Home })));
const Profile = lazy(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
const Messages = lazy(() => import("./pages/Messages").then(m => ({ default: m.Messages })));
const Settings = lazy(() => import("./pages/Settings").then(m => ({ default: m.Settings })));
const NotFound = lazy(() => import("./pages/NotFound"));
const Notifications = lazy(() => import("./pages/Notifications").then(m => ({ default: m.Notifications })));
const SearchResults = lazy(() => import("./pages/SearchResults").then(m => ({ default: m.SearchResults })));
const EditProfile = lazy(() => import("./pages/EditProfile").then(m => ({ default: m.EditProfile })));
const SavedItems = lazy(() => import("./pages/SavedItems").then(m => ({ default: m.SavedItems })));
const Resources = lazy(() => import("./pages/Resources").then(m => ({ default: m.Resources })));
const ResourceDetailRoute = lazy(() => import("./pages/ResourceDetailRoute").then(m => ({ default: m.ResourceDetailRoute })));
const PostDetail = lazy(() => import("./pages/PostDetail").then(m => ({ default: m.PostDetail })));
const Spheres = lazy(() => import("./pages/Spheres").then(m => ({ default: m.Spheres })));
const SphereDetail = lazy(() => import("./pages/SphereDetail").then(m => ({ default: m.SphereDetail })));
const Events = lazy(() => import("./pages/Events").then(m => ({ default: m.Events })));
const EventDetail = lazy(() => import("./pages/EventDetail").then(m => ({ default: m.EventDetail })));
const EventCreate = lazy(() => import("./pages/EventCreate").then(m => ({ default: m.EventCreate })));
const EventEdit = lazy(() => import("./pages/EventEdit").then(m => ({ default: m.EventEdit })));
const AdminPanelRouter = lazy(() => import("./pages/admin/AdminPanelRouter").then(m => ({ default: m.AdminPanelRouter })));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const About = lazy(() => import("./pages/public/About").then(m => ({ default: m.About })));
const Contact = lazy(() => import("./pages/public/Contact").then(m => ({ default: m.Contact })));
const FAQ = lazy(() => import("./pages/public/FAQ").then(m => ({ default: m.FAQ })));
const ForgotPassword = lazy(() => import("./pages/public/ForgotPassword").then(m => ({ default: m.ForgotPassword })));
const AuthCallback = lazy(() => import("./pages/public/AuthCallback").then(m => ({ default: m.AuthCallback })));
const CompleteProfile = lazy(() => import("./pages/public/CompleteProfile").then(m => ({ default: m.CompleteProfile })));
const Onboarding = lazy(() => import("./pages/public/Onboarding").then(m => ({ default: m.Onboarding })));
const Privacy = lazy(() => import("./pages/public/Privacy").then(m => ({ default: m.Privacy })));
const Terms = lazy(() => import("./pages/public/Terms").then(m => ({ default: m.Terms })));
const Connections = lazy(() => import("./pages/Connections").then(m => ({ default: m.Connections })));
const SpheraHome = lazy(() => import("./sphera/pages/SpheraHome").then(m => ({ default: m.SpheraHome })));
const SpheraSSORedirect = lazy(() => import("./sphera/pages/SpheraSSORedirect").then(m => ({ default: m.SpheraSSORedirect })));
const SSOBridge = lazy(() => import("./pages/sso/SSOBridge").then(m => ({ default: m.SSOBridge })));
const SSOPopup = lazy(() => import("./pages/sso/SSOPopup").then(m => ({ default: m.SSOPopup })));
const StudySessionDetail = lazy(() => import("./sphera/pages/StudySessionDetail").then(m => ({ default: m.StudySessionDetail })));
const AnnaleDetail = lazy(() => import("./sphera/pages/AnnaleDetail").then(m => ({ default: m.AnnaleDetail })));
const CommunityGuidelines = lazy(() => import("./pages/public/CommunityGuidelines").then(m => ({ default: m.CommunityGuidelines })));
const Copyright = lazy(() => import("./pages/public/Copyright").then(m => ({ default: m.Copyright })));
const CookiePolicy = lazy(() => import("./pages/public/CookiePolicy").then(m => ({ default: m.CookiePolicy })));
const DataDeletion = lazy(() => import("./pages/public/DataDeletion").then(m => ({ default: m.DataDeletion })));
const LegalNotice = lazy(() => import("./pages/public/LegalNotice").then(m => ({ default: m.LegalNotice })));
const TermsOfSale = lazy(() => import("./pages/public/TermsOfSale").then(m => ({ default: m.TermsOfSale })));
const Waitinglist = lazy(() => import("./pages/public/Waitinglist").then(m => ({ default: m.Waitinglist })));
const Policies = lazy(() => import("./pages/public/Policies").then(m => ({ default: m.Policies })));
const Forbidden = lazy(() => import("./pages/public/Forbidden"));
const AdminDashboardPage = lazy(() => import("./admin/pages/AdminDashboardPage").then(m => ({ default: m.AdminDashboardPage })));
const AdminUsersPage = lazy(() => import("./admin/pages/AdminUsersPage").then(m => ({ default: m.AdminUsersPage })));
const AdminSpheresPage = lazy(() => import("./admin/pages/AdminSpheresPage").then(m => ({ default: m.AdminSpheresPage })));
const AdminModerationPage = lazy(() => import("./admin/pages/AdminModerationPage").then(m => ({ default: m.AdminModerationPage })));
const AdminResourcesPage = lazy(() => import("./admin/pages/AdminResourcesPage").then(m => ({ default: m.AdminResourcesPage })));
const AdminLogsPage = lazy(() => import("./admin/pages/AdminLogsPage").then(m => ({ default: m.AdminLogsPage })));
const AdminVerificationPage = lazy(() => import("./admin/pages/AdminVerificationPage").then(m => ({ default: m.AdminVerificationPage })));
const AdminContactMessagesPage = lazy(() => import("./admin/pages/AdminContactMessagesPage").then(m => ({ default: m.AdminContactMessagesPage })));

const PageLoader = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <img src="/CS.svg" alt="Loading..." className="h-16 w-16 animate-pulse" />
        <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        Chargement...
      </p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

const Protected = ({ children, requireCompleteProfile = true }: { children: ReactNode, requireCompleteProfile?: boolean }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-accent/20">
        <div className="relative flex flex-col items-center gap-6 animate-in fade-in duration-700">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
            <img
              src="/CS.svg"
              alt="CampusSphere"
              className="w-16 h-16 md:w-20 md:h-20 relative animate-bounce duration-[2000ms]"
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl md:text-3xl font-bold font-automata campus-gradient bg-clip-text text-transparent">
              CampusSphere
            </span>
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Chargement de votre univers...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireCompleteProfile && user && user.is_profile_complete === false) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return children;
};

const HomeOrLanding = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAuthenticated ? (
    <Protected>
      <AppLayout>
        <Home />
      </AppLayout>
    </Protected>
  ) : (
    <Landing />
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Helmet>
        <title>CampusSphere - Le réseau social qui connecte les étudiants</title>
        <meta name="description" content="CampusSphere est le réseau social moderne dédié aux étudiants. Connectez-vous, partagez et grandissez avec la communauté." />
        <link rel="canonical" href="https://campussphere.app/" />
      </Helmet>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/register/complete" element={<CompleteProfile />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/onboarding" element={
              <Protected requireCompleteProfile={false}>
                <Onboarding />
              </Protected>
            } />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* SSO endpoints for Sphera cross-app authentication */}
            <Route path="/sso/bridge" element={<SSOBridge />} />
            <Route path="/sso/popup" element={<SSOPopup />} />

            {/* Root: Landing for guests/crawlers, Home for authenticated members */}
            <Route path="/" element={<HomeOrLanding />} />
            <Route path="/profile" element={
              <Protected>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </Protected>
            } />
            <Route path="/profile/edit" element={
              <Protected>
                <AppLayout>
                  <EditProfile />
                </AppLayout>
              </Protected>
            } />
            <Route path="/profile/:username" element={
              <Protected>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </Protected>
            } />
            <Route path="/messages" element={
              <Protected>
                <AppLayout>
                  <Messages />
                </AppLayout>
              </Protected>
            } />
            <Route path="/messages/:conversationId" element={
              <Protected>
                <AppLayout>
                  <Messages />
                </AppLayout>
              </Protected>
            } />
            <Route path="/settings" element={
              <Protected>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </Protected>
            } />
            <Route path="/notifications" element={
              <Protected>
                <AppLayout>
                  <Notifications />
                </AppLayout>
              </Protected>
            } />
            <Route path="/search" element={
              <Protected>
                <AppLayout>
                  <SearchResults />
                </AppLayout>
              </Protected>
            } />
            <Route path="/saved" element={
              <Protected>
                <AppLayout>
                  <SavedItems />
                </AppLayout>
              </Protected>
            } />
            <Route path="/resources" element={
              <Protected>
                <AppLayout>
                  <Resources />
                </AppLayout>
              </Protected>
            } />
            <Route path="/resources/:id" element={
              <AppLayout>
                <ResourceDetailRoute />
              </AppLayout>
            } />
            <Route path="/posts/:id" element={
              <AppLayout>
                <PostDetail />
              </AppLayout>
            } />
            <Route path="/spheres" element={
              <Protected>
                <AppLayout>
                  <Spheres />
                </AppLayout>
              </Protected>
            } />
            <Route path="/spheres/:id" element={
              <Protected>
                <AppLayout>
                  <SphereDetail />
                </AppLayout>
              </Protected>
            } />
            <Route path="/events" element={
              <Protected>
                <AppLayout>
                  <Events />
                </AppLayout>
              </Protected>
            } />
            <Route path="/events/create" element={
              <Protected>
                <AppLayout>
                  <EventCreate />
                </AppLayout>
              </Protected>
            } />
            <Route path="/events/:id" element={
              <Protected>
                <AppLayout>
                  <EventDetail />
                </AppLayout>
              </Protected>
            } />
            <Route path="/events/:id/edit" element={
              <Protected>
                <AppLayout>
                  <EventEdit />
                </AppLayout>
              </Protected>
            } />
            <Route path="/connections" element={
              <Protected>
                <AppLayout>
                  <Connections />
                </AppLayout>
              </Protected>
            } />
            {/* ─── Sphera V2 ─── */}
            <Route path="/sphera" element={
              <Protected>
                <AppLayout>
                  <SpheraHome />
                </AppLayout>
              </Protected>
            } />
            <Route path="/sphera/sso" element={
              <Protected>
                <SpheraSSORedirect />
              </Protected>
            } />
            <Route path="/sphera/sessions/:id" element={
              <Protected>
                <AppLayout>
                  <StudySessionDetail />
                </AppLayout>
              </Protected>
            } />
            <Route path="/sphera/annales/:id" element={
              <Protected>
                <AppLayout>
                  <AnnaleDetail />
                </AppLayout>
              </Protected>
            } />

            {/* Rétrocompatibilité : anciennes URLs → nouvelles */}
            <Route path="/study-sessions" element={<Navigate to="/sphera" replace />} />
            <Route path="/study-sessions/:id" element={<Navigate to="/sphera/sessions/:id" replace />} />

            {/* Admin routes - v2 panel */}
            <Route path="/admin" element={
              <Protected>
                <RequireAdminRole>
                  <Navigate to="/admin/dashboard" replace />
                </RequireAdminRole>
              </Protected>
            } />
            <Route path="/admin/*" element={
              <Protected>
                <RequireAdminRole>
                  <AdminLayout />
                </RequireAdminRole>
              </Protected>
            }>
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="verification" element={<AdminVerificationPage />} />
              <Route path="spheres" element={<AdminSpheresPage />} />
              <Route path="moderation" element={<AdminModerationPage />} />
              <Route path="resources" element={<AdminResourcesPage />} />
              <Route path="logs" element={<AdminLogsPage />} />
              <Route path="contact" element={<AdminContactMessagesPage />} />
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Route>

            {/* Legacy admin route */}
            <Route path="/cs-inc/private/admin" element={
              <Protected>
                <RequireAdminRole>
                  <AdminDashboard />
                </RequireAdminRole>
              </Protected>
            } />

            {/* Public pages */}
            <Route path="/cs-inc" element={<Landing />} />
            <Route path="/cs-inc/about" element={<About />} />
            <Route path="/contact" element={<Navigate to="/cs-inc/contact" replace />} />
            <Route path="/cs-inc/contact" element={<Contact />} />
            <Route path="/cs-inc/faq" element={<FAQ />} />
            <Route path="/cs-inc/policies" element={<Policies />} />
            <Route path="/cs-inc/policies/privacy" element={<Privacy />} />
            <Route path="/cs-inc/policies/terms" element={<Terms />} />
            <Route path="/cs-inc/policies/community-guidelines" element={<CommunityGuidelines />} />
            <Route path="/cs-inc/policies/copyright" element={<Copyright />} />
            <Route path="/cs-inc/policies/cookiepolicy" element={<CookiePolicy />} />
            <Route path="/cs-inc/policies/cookie-policy" element={<Navigate to="/cs-inc/policies/cookiepolicy" replace />} />
            <Route path="/cs-inc/policies/datadeletion" element={<DataDeletion />} />
            <Route path="/cs-inc/policies/legal-notice" element={<LegalNotice />} />
            <Route path="/cs-inc/policies/mentions-legales" element={<LegalNotice />} />
            <Route path="/cs-inc/policies/terms-of-sale" element={<TermsOfSale />} />
            <Route path="/cs-inc/policies/cgv" element={<TermsOfSale />} />
            <Route path="/cs-inc/waitlist" element={<Waitinglist />} />
            <Route path="/403" element={<Forbidden />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <SpeedInsights />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
