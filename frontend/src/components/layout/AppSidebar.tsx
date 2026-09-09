import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { ExternalLink } from "lucide-react";
import { getNavigationSections, type NavigationUser, type NavigationItem } from "./navigationConfig";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { SpheraIcon } from "@/components/ui/sphera-icon";

export function AppSidebar({ user: externalUser }: { user?: NavigationUser }) {
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";
  const counts = useUnreadCounts();
  const { user: authUser } = useAuth();
  const user = externalUser || authUser || {};

  const { navigationItems, quickActions, utilities } = getNavigationSections(user);

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const getBadge = (url: string): number | null => {
    if (url === "/notifications" && counts.notifications > 0) return counts.notifications;
    if (url === "/messages" && counts.messages > 0) return counts.messages;
    return null;
  };

  const renderItem = (item: NavigationItem) => {
    const badge = getBadge(item.url);
    const active = isActive(item.url);
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end
            className={[
              "relative flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors duration-150",
              active
                ? "bg-accent text-foreground font-semibold"
                : "text-muted-foreground font-medium hover:bg-accent hover:text-foreground",
            ].join(" ")}
          >
            {/* Orange left-bar indicator on active — not orange background */}
            {active && !isCollapsed && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-primary" />
            )}
            <div className="relative flex-shrink-0 flex items-center justify-center">
              {item.url === "/sphera" ? (
                <SpheraIcon size="md" className={!active ? "opacity-70 grayscale" : ""} />
              ) : (
                <item.icon className={["h-[18px] w-[18px]", active ? "text-primary" : ""].join(" ")} />
              )}
              {badge !== null && isCollapsed && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <span className="flex items-center justify-between flex-1 min-w-0">
                <span className="truncate">{item.title}</span>
                {item.external && (
                  <ExternalLink className="h-3 w-3 text-muted-foreground/40 flex-shrink-0 ml-1" />
                )}
                {badge !== null && (
                  <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5 flex-shrink-0 min-w-[18px] text-center">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </span>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar className={isCollapsed ? "w-20" : "w-60"} collapsible="icon">
      <SidebarContent className="pt-[60px]">
        {navigationItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="cs-section-title px-3 mb-1">Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{navigationItems.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {quickActions.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="cs-section-title px-3 mb-1">Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{quickActions.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {utilities.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="cs-section-title px-3 mb-1">Utilitaires</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{utilities.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
