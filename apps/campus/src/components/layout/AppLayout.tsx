import { ReactNode, Suspense, lazy, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { openVerificationModal } from "@/lib/events";
import { Moon, Sun, Search, Plus, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MobileNavigation } from "./MobileNavigation";
import { MobileTopBar } from "./MobileTopBar";
import { ProfileBubble } from "./ProfileBubble";
import { useIsMobile } from "@/hooks/use-mobile";
import { CookieBanner } from "./CookieBanner";
import { OfflineBanner } from "./OfflineBanner";
import { getCurrentUser } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { SearchDropdown } from "./SearchDropdown";
import { useUnreadCounts, refreshCounts } from "@/hooks/useUnreadCounts";
import { useAuth } from "@/contexts/AuthContext";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";

const CreateHubModal = lazy(() => import("@/components/modals/CreateHubModal").then((module) => ({ default: module.CreateHubModal })));
const VerificationModal = lazy(() => import("@/components/modals/VerificationModal").then((module) => ({ default: module.VerificationModal })));


interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const counts = useUnreadCounts();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchDropdownVisible, setIsSearchDropdownVisible] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isCreateHubModalOpen, setIsCreateHubModalOpen] = useState(false);

  // ⌘K / Ctrl+K keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleOpen = () => setIsVerificationModalOpen(true);
    window.addEventListener("open-verification-modal", handleOpen);
    return () => window.removeEventListener("open-verification-modal", handleOpen);
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    } else if (storedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
      setDarkMode(prefersDark);
    }
  }, []);

  const isInConversation = location.pathname.startsWith('/messages/') && location.pathname.split('/').length > 2;
  const hideNavOnMobile = isMobile && isInConversation;
  const isMenuPage = isMobile && location.pathname === '/menu';
  
  const toggleTheme = () => {
    const nextMode = !darkMode;
    document.documentElement.classList.toggle('dark', nextMode);
    localStorage.setItem('theme', nextMode ? 'dark' : 'light');
    setDarkMode(nextMode);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const isProfileLoading = isAuthLoading;
  const isVerified = user?.isVerified ?? false;

  // Real-time notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) || "";
    const host = (import.meta.env.VITE_API_WS_HOST as string | undefined) ||
      (apiUrl ? apiUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") : window.location.host);
    const token = localStorage.getItem("access_token") || localStorage.getItem("access");
    const wsUrl = `${proto}://${host}/ws/notifications/${token ? `?token=${token}` : ""}`;
    
    let socket: WebSocket | null = null;
    let retryTimeout: number | null = null;

    const connect = () => {
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "connected") {
            return;
          }

          toast({
            title: data.title || "Nouvelle notification",
            description: data.message,
            duration: 5000,
          });
          // Refresh global counts
          refreshCounts();
        } catch (e) {
          console.error("Notification WS Error:", e);
        }
      };

      socket.onclose = () => {
        retryTimeout = window.setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (socket) socket.close();
      if (retryTimeout) window.clearTimeout(retryTimeout);
    };
  }, [isAuthenticated, toast]);

  const handleCreateAction = (e: React.MouseEvent, callback: () => void) => {
    if (isProfileLoading) return;
    
    if (!isVerified) {
      e.preventDefault();
      e.stopPropagation();
      toast({
        title: "Compte non vérifié",
        description: "Vous devez certifier votre compte pour effectuer cette action.",
        variant: "destructive",
        action: (
          <Button 
            className="text-primary hover:text-primary/80 transition-colors cursor-pointer"
            variant="outline" 
            size="sm" 
            onClick={() => openVerificationModal()}
          >
            Vérifier
          </Button>
        ),
      });
      return;
    }
    callback();
  };

  if (isAuthenticated && isProfileLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
        <div className="relative">
          <img src="/CS.svg" alt="Loading..." className="h-16 w-16 animate-pulse" />
          <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
        <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">
          Chargement...
        </p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background overflow-x-clip">
        <div className="hidden md:block shrink-0">
          <AppSidebar user={user} />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Top Bar*/}
          {!hideNavOnMobile && <MobileTopBar user={user} isLoading={isProfileLoading} />}
          
          {/* Desktop Top Navigation - Fixed */}
          <header className="hidden md:flex h-14 w-full border-b border-border/60 bg-card/80 backdrop-blur-md fixed top-0 right-0 left-0 z-40">
            <div className="flex items-center justify-between px-4 h-full w-full gap-4">
              <button onClick={() => navigate(`/`)} className="flex items-center gap-2 hover:opacity-75 transition-opacity shrink-0">
                <img src="/CS.svg" alt="Logo CampusSphere" className="h-8 w-8"/>
                <span className="text-xl font-bold font-automata tracking-wide text-primary">
                  CampusSphere
                </span>
              </button>

              <form onSubmit={handleSearch} className="flex-1 max-w-xl lg:max-w-2xl xl:max-w-3xl relative mx-2">
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Rechercher"
                    className="pl-10 pr-4 h-9.5 text-sm bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border/40 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl transition-all w-full"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchDropdownVisible(e.target.value.length > 0);
                    }}
                    onFocus={() => {
                      if (searchQuery.length > 0) setIsSearchDropdownVisible(true);
                    }}
                  />
                  <SearchDropdown
                    query={searchQuery}
                    isVisible={isSearchDropdownVisible}
                    onClose={() => setIsSearchDropdownVisible(false)}
                  />
                </div>
              </form>

              <div className="flex items-center gap-1.5 shrink-0">
                {isAuthenticated && (
                  <>
                    <Button variant="primary" size="sm" onClick={() => setIsCreateHubModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-1.5" />
                      Créer
                    </Button>
                    {isCreateHubModalOpen && (
                      <Suspense fallback={<ModalLoadingFallback />}>
                        <CreateHubModal
                          open={isCreateHubModalOpen}
                          onOpenChange={setIsCreateHubModalOpen}
                        />
                      </Suspense>
                    )}

                    <Button variant="ghost" size="icon-sm" onClick={() => navigate('/notifications')} className="relative text-muted-foreground hover:text-foreground">
                      <Bell className="h-4 w-4" />
                      {counts.notifications > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                          {counts.notifications > 99 ? "99+" : counts.notifications}
                        </span>
                      )}
                    </Button>
                  </>
                )}

                <ProfileBubble user={user} isLoading={isProfileLoading} />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className={`flex-1 ${hideNavOnMobile || isMenuPage ? 'pt-0 pb-0' : 'pt-0 pb-24'} md:pb-0 md:pt-14`}>
            {children}
          </main>
          
          {/* Mobile Bottom Navigation - Fixed */}
          {!hideNavOnMobile && !isMenuPage && <MobileNavigation user={user} />}
        </div>
      </div>
      <CookieBanner />
      <OfflineBanner />
      {isVerificationModalOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <VerificationModal
            open={isVerificationModalOpen}
            onOpenChange={setIsVerificationModalOpen}
          />
        </Suspense>
      )}
    </SidebarProvider>
  );
}
