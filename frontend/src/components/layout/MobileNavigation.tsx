import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/services/api";
import { getNavigationSections, type NavigationUser } from "./navigationConfig";

export function MobileNavigation() {
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

  const { mobileItems } = getNavigationSections(user);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex justify-around items-center py-2 px-4">
        {mobileItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            aria-label={item.title}
            title={item.title}
            data-testid={`mobile-nav-${item.title.toLowerCase()}`}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )
            }
          >
            <item.icon className="h-5 w-5" />
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
