import type { ReactNode } from "react";
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
import { ResourceDetail } from "./pages/ResourceDetail";
import { Spheres } from "./pages/Spheres";
import { SphereDetail } from "./pages/SphereDetail";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { About } from "./pages/public/About";
import { Contact } from "./pages/public/Contact";
import { FAQ } from "./pages/public/FAQ";
import { ForgotPassword } from "./pages/public/ForgotPassword";
import { Privacy } from "./pages/public/Privacy";
import { Terms } from "./pages/public/Terms";
import { Connections } from "./pages/Connections";
import { CommunityGuidelines } from "./pages/public/CommunityGuidelines";
import { Copyright } from "./pages/public/Copyright";
import { CookiePolicy } from "./pages/public/CookiePolicy";
import { DataDeletion } from "./pages/public/DataDeletion";
import { Waitinglist } from "./pages/public/Waitinglist";
import { Policies } from "./pages/public/Policies";


const queryClient = new QueryClient();

const isAccessTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  try {
    const [, payloadBase64] = token.split(".");
    if (!payloadBase64) return false;
    const payload = JSON.parse(atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/")));
    if (!payload?.exp) return true; // If exp is absent, keep legacy behavior and treat as present.
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp > nowInSeconds;
  } catch {
    return false;
  }
};

const Protected = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem("access");
  if (!isAccessTokenValid(token)) {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
            <Protected>
              <AppLayout>
                <ResourceDetail />
              </AppLayout>
            </Protected>
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

          {/* Admin routes */}
          <Route path="/cs-inc/private/admin" element={<AdminDashboard />} />
        
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

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
