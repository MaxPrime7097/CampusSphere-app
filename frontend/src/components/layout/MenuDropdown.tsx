import {
  Menu, Shield, ExternalLink
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
import { type MouseEvent, useEffect, useState } from "react";
import { getCurrentUser } from "@/services/api";
import { getNavigationSections, type NavigationUser } from "./navigationConfig";
import { resolveAdminRole } from "@/lib/adminPermissions";

export function MenuDropdown() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<NavigationUser>({});

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await getCurrentUser();
        if (isMounted && data) {
          setUser(data);
        }
      } catch {
        // User not logged in or error
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const getNavClasses = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-accent text-foreground font-medium" 
      : "hover:bg-accent text-primary";
  const { quickActions, utilities, navigationItems } = getNavigationSections(user);
  const profileUrl = navigationItems.find((item) => item.title === "Profil")?.url || "/profile/current";

  const displayName = user?.name || user?.username || "Utilisateur";
  const displayUsername = user?.username ? `@${user.username}` : "@user";
  const avatarUrl = user?.avatar || "/placeholder/.jpg";
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
          <h1 className="text-3xl font-bold bg-clip-text text-muted-foreground">
            Menu
          </h1>
        </SheetHeader>
        <Card
          className="campus-card mt-5"
          onClick={() => {
            closeMenu();
            navigate(profileUrl);
          }}
        >
          <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
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
                  <div className="w-4 h-4 campus-gradient rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{displayUsername}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((item) => (
               <Card className="py-2" key={item.title}>
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClasses} onClick={closeMenu}>
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
               </Card>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Utilitaires</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {utilities.map((item) => (
               <Card className="py-2" key={item.title}>
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavClasses} onClick={closeMenu}>
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span className="flex-1">{item.title}</span>}
                      {!isCollapsed && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-60" />}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
               </Card>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {resolveAdminRole(user) !== 'none' && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <Card className="py-2">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/admin/dashboard" className={getNavClasses} onClick={closeMenu}>
                        <Shield className="h-5 w-5 text-primary" />
                        <span>Panel Admin</span>
                        <Badge className="ml-auto campus-gradient text-white text-[10px] px-1.5 py-0.5 border-0">Admin</Badge>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </Card>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <Card className="campus-card mt-5">
          <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
            <div className="text-center space-y-4">
              <div>
                <h3 className="font-automata text-primary text-lg md:text-xl">CampusSphere</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Version {appVersion}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </SheetContent>
    </Sheet>
  );
}
