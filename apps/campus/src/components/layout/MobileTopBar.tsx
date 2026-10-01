import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MagnifyingGlass as Search, List as Menu, X, Bell } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { MenuDropdown } from "./MenuDropdown";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { SearchDropdown } from "./SearchDropdown";

interface MobileTopBarProps {
  onMenuClick?: () => void;
  user?: any;
  isLoading?: boolean;
}

export function MobileTopBar({ onMenuClick, user, isLoading }: MobileTopBarProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const location = useLocation();
  const counts = useUnreadCounts();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchDropdownVisible, setIsSearchDropdownVisible] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border md:hidden">
      {searchOpen ? (
        <div className="flex items-center gap-2 px-4 h-14">
          <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 relative">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
              <Input
                placeholder="Rechercher..."
                className="pl-11 h-10 rounded-xl"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchDropdownVisible(true);
                }}
                onFocus={() => setIsSearchDropdownVisible(true)}
                autoFocus
              />
              {isSearchDropdownVisible && searchQuery.trim().length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50">
                   <SearchDropdown 
                     query={searchQuery}
                     isVisible={isSearchDropdownVisible}
                     onClose={() => {
                       setIsSearchDropdownVisible(false);
                       setSearchOpen(false);
                     }} 
                   />
                </div>
              )}
            </div>
          </form>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 p-0 rounded-full flex items-center justify-center shrink-0"
            onClick={() => setSearchOpen(false)}
            aria-label="Fermer la recherche"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 h-14">
          {/* Left: Menu or Logo */}
          <div className="flex items-center gap-3">
            {onMenuClick ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 p-0 rounded-full flex items-center justify-center hover:bg-muted text-foreground"
                onClick={onMenuClick}
                aria-label="Menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            ) : (
              <button onClick={() => navigate(`/`)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img src="/CS.svg" alt="CampusSphere" className="h-7 w-7" />
                <span className="text-lg font-bold font-automata tracking-wide text-primary">
                  CampusSphere
                </span>
              </button>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-10 w-10 p-0 rounded-full flex items-center justify-center hover:bg-muted text-foreground active:scale-95 transition-transform"
              onClick={() => setSearchOpen(true)}
              aria-label="Rechercher"
            >
              <Search className="h-6 w-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/notifications")}
              className="relative h-10 w-10 p-0 rounded-full flex items-center justify-center hover:bg-muted text-foreground active:scale-95 transition-transform"
              aria-label="Notifications"
            >
              <Bell className="h-6 w-6" weight={counts.notifications > 0 ? "fill" : "regular"} />
              {counts.notifications > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-background">
                  {counts.notifications > 99 ? "99+" : counts.notifications}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { if (location.pathname === "/menu") { navigate(-1); } else { navigate("/menu"); } }}
              className="h-10 w-10 p-0 rounded-full flex items-center justify-center hover:bg-muted text-foreground active:scale-95 transition-transform"
              aria-label="Menu"
            >
              {location.pathname === "/menu" ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
