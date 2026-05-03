import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "@/services/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  Settings, 
  LogOut,
  ChevronDown,
  BadgeCheck
} from "lucide-react";

interface ProfileBubbleProps {
  user?: any;
  isLoading?: boolean;
}

export function ProfileBubble({ user: externalUser, isLoading: externalLoading }: ProfileBubbleProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [localIsLoading, setLocalIsLoading] = useState(true);
  const [localUser, setLocalUser] = useState<any>(null);

  // Determine which state to use
  const isLoading = externalLoading !== undefined ? externalLoading : localIsLoading;
  const user = externalUser !== undefined ? externalUser : localUser;

  useEffect(() => {
    // Only fetch if external data is not provided
    if (externalUser !== undefined) return;

    let isMounted = true;
    const token = localStorage.getItem("access");
    
    if (!token) {
      setLocalIsLoading(false);
      setLocalUser(null);
      return;
    }

    (async () => {
      try {
        const data = await getCurrentUser();
        if (isMounted && data) {
          setLocalUser({
            name: data.name || data.first_name + ' ' + data.last_name || "Utilisateur",
            username: data.username || "user",
            avatar: data.avatar || "/placeholder-avatar.jpg",
            email: data.email || "user@university.cm",
            isVerified: Boolean(data.is_verified ?? data.isVerified)
          });
        }
      } catch (e) {
        if (isMounted) setLocalUser(null);
      } finally {
        if (isMounted) setLocalIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login");
  };

  if (isLoading) {
    return <div className="h-8 w-8 rounded-full bg-accent animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="hidden sm:inline-flex">
          Connexion
        </Button>
        <Button size="sm" onClick={() => navigate("/register")} className="campus-gradient text-white">
          S'inscrire
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full p-0 hover:bg-accent"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-input text-muted-foreground font-bold text-sm">
              {user.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              {user.isVerified && <BadgeCheck className="h-3.5 w-3.5 text-primary fill-primary/10" />}
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              @{user.username}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => navigate(`/profile/${user.username || 'current'}`)}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profil</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => navigate("/settings")}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Paramètres</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Se déconnecter</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
