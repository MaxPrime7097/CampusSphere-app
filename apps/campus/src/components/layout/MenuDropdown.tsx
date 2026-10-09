import { List as Menu, Shield, ArrowSquareOut as ExternalLink, SealCheck as BadgeCheck } from "@phosphor-icons/react";
import { NavLink, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { type MouseEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { getNavigationSections, type NavigationUser } from "./navigationConfig";
import { resolveAdminRole } from "@/lib/adminPermissions";
import { useAuth } from "@/contexts/AuthContext";

export function MenuDropdown({ user: externalUser }: { user?: NavigationUser }) {
  const { t } = useTranslation("navigation");
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { user: authUser } = useAuth();
  const user = externalUser || authUser || {};

  const getNavClasses = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-accent text-foreground font-medium" 
      : "hover:bg-accent text-primary";
  const { quickActions, utilities, navigationItems } = getNavigationSections(user, t);
  const profileUrl = navigationItems.find((item) => item.title === t("profile", { defaultValue: "Profil" }))?.url || "/profile/current";

  const isAuthenticated = Boolean(user?.username);
  const displayName = user?.name || user?.username || "Invité";
  const displayUsername = user?.username ? `@${user.username}` : "@guest";
  const avatarUrl = user?.avatar || "/placeholder-avatar.jpg";
  const appVersion = import.meta.env.VITE_APP_VERSION || "2.0.0";
  const closeMenu = () => setOpen(false);
  const handleContainerClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    const interactiveElement = target?.closest("a,button");

    if (interactiveElement) {
      setOpen(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative hover:bg-accent">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="pt-5 overflow-y-auto" onClickCapture={handleContainerClickCapture}>
        <SheetHeader>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {t("menu")}
          </h1>
        </SheetHeader>
        
        {isAuthenticated ? (
          <div
            className="mt-5 p-3 rounded-xl border border-border/40 hover:bg-muted/40 cursor-pointer transition-colors"
            onClick={() => {
              closeMenu();
              navigate(profileUrl);
            }}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-input text-muted-foreground font-semibold">
                  {displayName.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm truncate">{displayName}</h4>
                  {user?.isVerified && (
                    <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" weight="fill" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{displayUsername}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            <Button onClick={() => { closeMenu(); navigate('/login'); }} className="bg-secondary hover:bg-muted text-secondary-foreground border border-border/60 w-full">
              {t("login")}
            </Button>
            <Button variant="outline" onClick={() => { closeMenu(); navigate('/register'); }} className="w-full">
              {t("register")}
            </Button>
          </div>
        )}

        {/* Section Navigation Principale (Accueil, Événements, Sphères, Ressources) */}
        {navigationItems.length > 0 && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel>{t("navigation")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClasses} onClick={closeMenu}>
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Section Actions Rapides (Connexions, Messages, Sphera, Sauvegardes, Paramètres) */}
        {quickActions.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("quickActions")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {quickActions.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClasses} onClick={closeMenu}>
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {utilities.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("utilities")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {utilities.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end className={getNavClasses} onClick={closeMenu}>
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && <span className="flex-1">{item.title}</span>}
                        {!isCollapsed && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-60" />}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <div className="mt-8 mb-4 text-center">
          <h3 className="font-automata text-primary/60 text-lg md:text-xl">CampusSphere</h3>
          <p className="text-xs text-muted-foreground/60">Version {appVersion}</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
