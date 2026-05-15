import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { openVerificationModal } from "@/lib/events";
import { Moon, Sun, Search, Plus, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CreatePostModal } from "@/components/modals/CreatePostModal";
import { MobileNavigation } from "./MobileNavigation";
import { MobileTopBar } from "./MobileTopBar";
import { ProfileBubble } from "./ProfileBubble";
import { useIsMobile } from "@/hooks/use-mobile";
import { CookieBanner } from "./CookieBanner";
import { getCurrentUser } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { VerificationModal } from "@/components/modals/VerificationModal";
import { SearchDropdown } from "./SearchDropdown";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { useAuth } from "@/contexts/AuthContext";


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
  const [darkMode, setDarkMode] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

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
          toast({
            title: data.title || "Nouvelle notification",
            description: data.message,
            duration: 5000,
          });
          // Refresh global counts
          import("@/hooks/useUnreadCounts").then(m => m.refreshCounts());
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
      <div className="min-h-screen flex w-full bg-background">
        <div className="hidden md:block">
          <AppSidebar user={user} />
        </div>
        
        <div className="flex-1 flex flex-col">
          {/* Mobile Top Bar*/}
          {!hideNavOnMobile && <MobileTopBar user={user} isLoading={isProfileLoading} />}
          
          {/* Desktop Top Navigation - Fixed */}
          <header className="hidden md:flex h-16 w-full border-b bg-card/50 backdrop-blur-sm fixed top-0 right-0 left-0 z-40">
            <div className="flex items-center justify-between px-4 h-full w-full">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-accent" />
                <button onClick={() => navigate(`/`)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <img src="/CS.svg" alt="Logo CampusSphere" className="h-10 w-10"/>
                  <span className="text-2xl font-bold campus-gradient bg-clip-text text-transparent font-automata">
                    CampusSphere
                  </span>
                </button>
                <form onSubmit={handleSearch} className="pl-10 flex items-center gap-2 flex-1 max-w-md relative">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Rechercher..." 
                      className="pl-10 bg-background/50 focus-visible:ring-primary/50"
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
              </div>

              <div className="flex items-center gap-2">
                {isAuthenticated && (
                  <>
                    {isVerified ? (
                      <CreatePostModal>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Nouveau post
                        </Button>
                      </CreatePostModal>
                    ) : (
                      <Button variant="outline" size="sm" onClick={(e) => handleCreateAction(e as any, () => {})}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau post
                      </Button>
                    )}

                    <Button variant="ghost" size="sm" onClick={() => navigate('/notifications')} className="relative">
                      <Bell className="h-4 w-4" />
                      {counts.notifications > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                          {counts.notifications > 99 ? "99+" : counts.notifications}
                        </span>
                      )}
                    </Button>
                  </>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="hover:bg-accent"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>
                
                <ProfileBubble user={user} isLoading={isProfileLoading} />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className={`flex-1 overflow-hidden ${hideNavOnMobile ? 'pt-0 pb-0' : 'pt-0 pb-16'} md:pb-0 md:pt-16`}>
            {children}
          </main>
          
          {/* Mobile Bottom Navigation - Fixed */}
          {!hideNavOnMobile && <MobileNavigation user={user} />}
        </div>
      </div>
      <CookieBanner />
      <VerificationModal 
        open={isVerificationModalOpen} 
        onOpenChange={setIsVerificationModalOpen} 
      />
    </SidebarProvider>
  );
}