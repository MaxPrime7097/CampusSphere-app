import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Search, Plus, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CreatePostModal } from "@/components/modals/CreatePostModal";
import { MobileNavigation } from "./MobileNavigation";
import { MobileTopBar } from "./MobileTopBar";
import { ProfileBubble } from "./ProfileBubble";
import { useIsMobile } from "@/hooks/use-mobile";
import { CookieBanner } from "./CookieBanner";


interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);

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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        
        <div className="flex-1 flex flex-col">
          {/* Mobile Top Bar*/}
          {!hideNavOnMobile && <MobileTopBar />}
          
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
                <form onSubmit={handleSearch} className="pl-10 flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Rechercher..." 
                      className="pl-10 bg-background/50"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </form>
              </div>

              <div className="flex items-center gap-2">
                <CreatePostModal>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau post
                  </Button>
                </CreatePostModal>

                <Button variant="ghost" size="sm" onClick={() => navigate('/notifications')}>
                <Bell className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="hover:bg-accent"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>
                
                <ProfileBubble />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className={`flex-1 overflow-hidden ${hideNavOnMobile ? 'pt-0 pb-0' : 'pt-0 pb-16'} md:pb-0 md:pt-16`}>
            {children}
          </main>
          
          {/* Mobile Bottom Navigation - Fixed */}
          {!hideNavOnMobile && <MobileNavigation />}
        </div>
      </div>
      <CookieBanner />
    </SidebarProvider>
  );
}