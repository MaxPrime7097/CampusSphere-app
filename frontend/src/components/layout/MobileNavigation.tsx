import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CreatePostModal } from "@/components/modals/CreatePostModal";
import { getCurrentUser } from "@/services/api";
import { getNavigationSections, type NavigationUser } from "./navigationConfig";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";

export function MobileNavigation() {
  const [user, setUser] = useState<NavigationUser>({});
  const { mobileItems } = getNavigationSections(user);
  const counts = useUnreadCounts();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await getCurrentUser();
        if (isMounted && data) setUser(data);
      } catch { /* ignore */ }
    })();
    return () => { isMounted = false; };
  }, []);

  const getBadge = (url: string) => {
    if (url === "/notifications" && counts.notifications > 0) return counts.notifications;
    if (url === "/messages" && counts.messages > 0) return counts.messages;
    return null;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-100 bg-card border-t border-border md:hidden">
      <div className="flex justify-around items-center py-2 px-4">
        {mobileItems.map((item) => {
          const badge = getBadge(item.url);
          const baseStyles = "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors";
          const inactiveStyles = "text-muted-foreground hover:text-foreground hover:bg-accent";

          if (item.url === "#create-post") {
            return (
              <CreatePostModal key={item.title}>
                <button type="button" className="py-2 px-3 rounded-lg text-primary bg-primary/10" aria-label={item.title}>
                  <item.icon className="h-5 w-5" />
                </button>
              </CreatePostModal>
            );
          }

          return (
            <NavLink
              key={item.title}
              to={item.url}
              aria-label={item.title}
              className={({ isActive }) => cn(baseStyles, isActive ? "text-primary bg-primary/10" : inactiveStyles)}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {badge !== null && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
