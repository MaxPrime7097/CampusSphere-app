import type { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { Landing } from "./pages/public/Landing";
import { Login } from "./pages/public/Login";
import { Register } from "./pages/public/Register";
import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";
import { Messages } from "./pages/Messages";
import { Settings } from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { Notifications } from "./pages/Notifications";
import { SearchResults } from "./pages/SearchResults";
import { EditProfile } from "./pages/EditProfile";
import { SavedItems } from "./pages/SavedItems";
import { Resources } from "./pages/Resources";
import { ResourceDetailRoute } from "./pages/ResourceDetailRoute";
import { PostDetail } from "./pages/PostDetail";
import { Spheres } from "./pages/Spheres";
import { SphereDetail } from "./pages/SphereDetail";
import { AdminPanelRouter } from "./pages/admin/AdminPanelRouter";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { About } from "./pages/public/About";
import { Contact } from "./pages/public/Contact";
import { FAQ } from "./pages/public/FAQ";
import { ForgotPassword } from "./pages/public/ForgotPassword";
import { AuthCallback } from "./pages/public/AuthCallback";
import { CompleteProfile } from "./pages/public/CompleteProfile";
import { Privacy } from "./pages/public/Privacy";
import { Terms } from "./pages/public/Terms";
import { Connections } from "./pages/Connections";
import { CommunityGuidelines } from "./pages/public/CommunityGuidelines";
import { Copyright } from "./pages/public/Copyright";
import { CookiePolicy } from "./pages/public/CookiePolicy";
import { DataDeletion } from "./pages/public/DataDeletion";
import { Waitinglist } from "./pages/public/Waitinglist";
import { Policies } from "./pages/public/Policies";
import { RequireAdminRole } from "./components/auth/RequireAdminRole";
import Forbidden from "./pages/public/Forbidden";
import { AdminLayout } from "./admin/components/AdminLayout";
import { AdminDashboardPage } from "./admin/pages/AdminDashboardPage";
import { AdminUsersPage } from "./admin/pages/AdminUsersPage";
import { AdminSpheresPage } from "./admin/pages/AdminSpheresPage";
import { AdminModerationPage } from "./admin/pages/AdminModerationPage";
import { AdminResourcesPage } from "./admin/pages/AdminResourcesPage";
import { AdminLogsPage } from "./admin/pages/AdminLogsPage";
import { AdminContactMessagesPage } from "./admin/pages/AdminContactMessagesPage";


const queryClient = new QueryClient();

const Protected = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem("access");
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Helmet>
      <title>CampusSphere - Le réseau social qui connecte les étudiants</title>
      <meta name="description" content="CampusSphere est le réseau social moderne dédié aux étudiants. Connectez-vous, partagez et grandissez avec la communauté." />
      <link rel="canonical" href="https://campussphere.app/" />
    </Helmet>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/register/complete" element={<CompleteProfile />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Protected routes with layout */}
          <Route path="/" element={
            <Protected>
              <AppLayout>
                <Home />
              </AppLayout>
            </Protected>
          } />
          <Route path="/profile" element={
            <Protected>
              <AppLayout>
                <Profile />
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
          <Route path="/profile/edit" element={
            <Protected>
              <AppLayout>
                <EditProfile />
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
          <Route path="/connections" element={
            <Protected>
              <AppLayout>
                <Connections />
              </AppLayout>
            </Protected>
          } />

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
          <Route path="/cs-inc/contact" element={<Contact />} />
          <Route path="/cs-inc/faq" element={<FAQ />} />
          <Route path="/cs-inc/policies" element={<Policies />} />
          <Route path="/cs-inc/policies/privacy" element={<Privacy />} />
          <Route path="/cs-inc/policies/terms" element={<Terms />} />
          <Route path="/cs-inc/policies/community-guidelines" element={<CommunityGuidelines />} />
          <Route path="/cs-inc/policies/copyright" element={<Copyright />} />
          <Route path="/cs-inc/policies/cookiepolicy" element={<CookiePolicy />} />
          <Route path="/cs-inc/policies/datadeletion" element={<DataDeletion />} />
          <Route path="/cs-inc/waitlist" element={<Waitinglist />} />
          <Route path="/403" element={<Forbidden />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
