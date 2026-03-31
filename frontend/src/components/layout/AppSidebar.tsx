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
  useSidebar,
} from "@/components/ui/sidebar";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/services/api";
import { getNavigationSections, type NavigationUser } from "./navigationConfig";

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

  const [user, setUser] = useState<NavigationUser>({});
  const appVersion = import.meta.env.VITE_APP_VERSION || "2.0.0";

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
  
  const { navigationItems, quickActions, utilities } = getNavigationSections(user);

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
              {utilities.map((item) => (
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

        <div className="mt-6 border-t border-border pt-4 px-3">
          <div className="text-sm font-semibold text-center">CampusSphere</div>
          <div className="text-xs text-muted-foreground text-center">Version {appVersion}</div>
          <div className="text-xs text-muted-foreground text-center">Full menu from API routes</div>
        </div>

      </SidebarContent>
    </Sidebar>
  );
}
