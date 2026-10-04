import { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { Moon, Sun, SignOut as LogOut, CaretRight as ChevronRight, ArrowSquareOut as ExternalLink, SealCheck as BadgeCheck, Link as LinkIcon, ChatCircle as MessageSquare, BookmarkSimple, Gear as Settings, Shield, Info, Scales as Scale, Lifebuoy as LifeBuoy } from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SpheraIcon } from "@/components/ui/sphera-icon";
import { formatSlugToLabel } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getNavigationSections } from "@/components/layout/navigationConfig";

export function MobileMenu() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const { utilities } = getNavigationSections(user);
  const appVersion = import.meta.env.VITE_APP_VERSION || "2.0.0";
  const profileUrl = user?.username ? `/profile/${user.username}` : "/profile/current";

  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("access_token");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 animate-in fade-in duration-200">
      <div className="container max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* User Card / Auth Banner (starts immediately without redundant headers) */}
        {isAuthenticated && user ? (
          <div
            onClick={() => navigate(profileUrl)}
            className="flex items-center justify-between p-4 rounded-2xl border border-border/40 bg-card hover:bg-muted/30 transition-colors cursor-pointer group shadow-xs"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <Avatar className="h-12 w-12 border border-border/60 shrink-0">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-sm">
                  {user.name ? user.name.slice(0, 1).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sm truncate text-foreground group-hover:underline">
                    {user.name || user.username}
                  </span>
                  {user.isVerified && (
                    <BadgeCheck className="h-4 w-4 text-primary shrink-0" weight="fill" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  @{user.username || "user"}
                </p>
                {(user.faculty || user.university) && (
                  <p className="text-[11px] text-muted-foreground/80 truncate mt-0.5">
                    {formatSlugToLabel(user.faculty) || formatSlugToLabel(user.university)}
                  </p>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground transition-colors shrink-0" />
          </div>
        ) : (
          <div className="p-5 rounded-2xl border border-border/40 bg-card text-center space-y-3 shadow-xs">
            <h3 className="font-semibold text-sm text-foreground">Rejoignez la communauté</h3>
            <p className="text-xs text-muted-foreground">
              Connectez-vous pour échanger des ressources, rejoindre des sphères et participer aux événements.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => navigate("/login")}
                className="flex-1 bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30 font-medium"
              >
                Connexion
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/register")}
                className="flex-1 font-medium"
              >
                Créer un compte
              </Button>
            </div>
          </div>
        )}

        {/* Theme Mode Switcher */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 bg-card shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted text-foreground">
              {darkMode ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Thème d'affichage</p>
              <p className="text-[11px] text-muted-foreground">
                {darkMode ? "Mode sombre activé" : "Mode clair activé"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="rounded-lg text-xs font-semibold px-3 h-8 bg-muted/60 hover:bg-muted"
          >
            {darkMode ? "Clair" : "Sombre"}
          </Button>
        </div>

        {/* Sphera Standalone Direct Link Card */}
        <a
          href="/sphera/sso"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3.5 rounded-2xl border border-border/50 bg-card hover:border-primary/40 hover:bg-muted/30 transition-all group shadow-none cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <SpheraIcon size="xl" variant="primary" className="w-9 h-9 shrink-0 group-hover:scale-105 transition-transform" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                  Ouvrir Sphera
                </span>
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-4 font-semibold text-primary bg-primary/10 border border-primary/20"
                >
                  IA
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                Fiches, quiz, flashcards & corrections
              </p>
            </div>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 transition-all group-hover:translate-x-0.5" />
        </a>

        {/* Section: Fonctionnalités clés (Non présentes dans la barre inférieure) */}
        {isAuthenticated && (
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 px-2">
              Espaces & Outils
            </span>
            <div className="rounded-2xl border border-border/40 bg-card overflow-hidden divide-y divide-border/30">
              <NavLink
                to="/connections"
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 text-xs font-medium transition-colors hover:bg-muted/40 ${
                    isActive ? "bg-accent text-primary font-semibold" : "text-foreground"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Connexions</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
              </NavLink>

              <NavLink
                to="/messages"
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 text-xs font-medium transition-colors hover:bg-muted/40 ${
                    isActive ? "bg-accent text-primary font-semibold" : "text-foreground"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>Messages</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
              </NavLink>

              <NavLink
                to="/saved"
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 text-xs font-medium transition-colors hover:bg-muted/40 ${
                    isActive ? "bg-accent text-primary font-semibold" : "text-foreground"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <BookmarkSimple className="h-4 w-4 text-muted-foreground" />
                  <span>Enregistrements</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
              </NavLink>

              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 text-xs font-medium transition-colors hover:bg-muted/40 ${
                    isActive ? "bg-accent text-primary font-semibold" : "text-foreground"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Paramètres</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
              </NavLink>
            </div>
          </div>
        )}

        {/* Section: Informations & Aide */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 px-2">
            Informations & Aide
          </span>
          <div className="rounded-2xl border border-border/40 bg-card overflow-hidden divide-y divide-border/30">
            {utilities
              .filter((item) => !item.url.includes("sphera"))
              .map((item) => (
                <NavLink
                  key={item.title}
                  to={item.url}
                  className="flex items-center justify-between px-3.5 py-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{item.title}</span>
                  </div>
                  {item.external ? (
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                  )}
                </NavLink>
              ))}
          </div>
        </div>

        {/* Logout (if authenticated) */}
        {isAuthenticated && (
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full h-11 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive justify-center gap-2 border border-destructive/20 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Déconnexion</span>
          </Button>
        )}

        {/* Footer Brand */}
        <div className="text-center pt-2 pb-4 space-y-0.5">
          <span className="font-automata text-xs text-muted-foreground/70 tracking-wide">CampusSphere</span>
          <p className="text-[10px] text-muted-foreground/40">Version {appVersion}</p>
        </div>
      </div>
    </div>
  );
}
