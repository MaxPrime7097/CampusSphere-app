import {
  Menu, Shield, ExternalLink, BadgeCheck
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
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
import { getNavigationSections, type NavigationUser } from "./navigationConfig";
import { resolveAdminRole } from "@/lib/adminPermissions";
import { useAuth } from "@/contexts/AuthContext";

export function MenuDropdown({ user: externalUser }: { user?: NavigationUser }) {
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
  const { quickActions, utilities, navigationItems } = getNavigationSections(user);
  const profileUrl = navigationItems.find((item) => item.title === "Profil")?.url || "/profile/current";

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
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Menu
          </h1>
        </SheetHeader>
        
        {isAuthenticated ? (
          <Card
            className="campus-card mt-5 cursor-pointer"
            onClick={() => {
              closeMenu();
              navigate(profileUrl);
            }}
          >
            <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
              <div 
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="bg-input text-muted-foreground font-semibold">
                    {displayName.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm hover:underline">{displayName}</h4>
                    {user?.isVerified && (
                      <BadgeCheck className="h-4 w-4 text-primary fill-primary/10" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{displayUsername}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            <Button onClick={() => { closeMenu(); navigate('/login'); }} className="campus-gradient text-white w-full">
              Se connecter
            </Button>
            <Button variant="outline" onClick={() => { closeMenu(); navigate('/register'); }} className="w-full">
              Créer un compte
            </Button>
          </div>
        )}

        {/* Section Navigation Principale (Accueil, Événements, Sphères, Ressources) */}
        {navigationItems.length > 0 && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
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
            <SidebarGroupLabel>Actions</SidebarGroupLabel>
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
            <SidebarGroupLabel>Utilitaires</SidebarGroupLabel>
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
