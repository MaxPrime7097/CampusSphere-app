import { 
  Home, 
  User,
  FolderOpen, 
  Users, 
  Calendar, 
  ShoppingBag,  
  LibraryBig, 
  Bookmark, 
  MessageSquare,
  Settings,
  Info,
  LifeBuoy,
  BookLock,
  ScrollText
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/services/api";



const quickActions = [
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Enregistrements", url: "/saved", icon: Bookmark },
  { title: "Paramètres", url: "/settings", icon: Settings },
];

const utils = [
  {title: "À propos", url: "/cs-inc/about", icon: Info },
  {title: "Politique de confidentialité", url: "/cs-inc/policies/privacy", icon: BookLock },
  {title: "Conditions d'utilisation", url: "/cs-inc/policies/terms", icon: ScrollText },
  {title: "Aide", url: "/cs-inc/contact", icon: LifeBuoy },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const [user, setUser] = useState<any>({
    name: "Utilisateur",
    username: "user",
    avatar: "/placeholder-avatar.jpg",
    email: "user@university.cm"
  }); 

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await getCurrentUser();
        if (isMounted && data) {
          setUser({
            name: data.name || data.first_name + ' ' + data.last_name || "Utilisateur",
            username: data.username || "user",
            avatar: data.avatar || "/placeholder-avatar.jpg",
            email: data.email || "user@university.cm"
          });
        }
      } catch (e) {
        // User not logged in or error
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);
  
  const navigationItems = [
    { title: "Accueil", url: "/", icon: Home },
    { title: "Profil", url: `/profile/${user?.username || "current"}`, icon: User },
    { title: "Ressources", url: "/resources", icon: FolderOpen },
    { title: "Sphères", url: "/spheres", icon: Users },
  ];

  return (
    <Sidebar className={isCollapsed ? "w-20" : "w-60"} collapsible="icon">
      <SidebarContent className="pt-20">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end 
                      className={isActive(item.url) ? "bg-accent text-primary font-medium hover:bg-primary/10" : "text-foreground font-medium hover:bg-primary/10 hover:text-foreground"}>
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end 
                      className={isActive(item.url) ? "bg-accent text-primary font-medium hover:bg-primary/10" : "text-foreground font-medium hover:bg-primary/10 hover:text-foreground"}>
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Utilitaires</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {utils.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end 
                      className={isActive(item.url) ? "bg-accent text-primary font-medium hover:bg-primary/10" : "text-foreground font-medium hover:bg-primary/10 hover:text-foreground"}>
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  );
}