import { Fragment, Suspense, lazy, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getNavigationSections, type NavigationUser } from "./navigationConfig";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import { useAuth } from "@/contexts/AuthContext";

const CreateHubModal = lazy(() =>
  import("@/components/modals/CreateHubModal").then((module) => ({
    default: module.CreateHubModal,
  }))
);

export function MobileNavigation({ user: externalUser }: { user?: NavigationUser }) {
  const [isCreateHubModalOpen, setIsCreateHubModalOpen] = useState(false);
  const { user: authUser } = useAuth();
  const user = externalUser || authUser || {};
  const { mobileItems } = getNavigationSections(user);
  const counts = useUnreadCounts();
  const location = useLocation();

  const getBadge = (url: string) => {
    if (url === "/notifications" && counts.notifications > 0) return counts.notifications;
    if (url === "/messages" && counts.messages > 0) return counts.messages;
    return null;
  };

  const centerIndex = mobileItems.findIndex(
    (item) => item.url.startsWith("#create") || item.url === "#create-post"
  );
  const effectiveCenterIndex =
    centerIndex !== -1 ? centerIndex : Math.floor(mobileItems.length / 2);

  const leftItems = mobileItems.slice(0, effectiveCenterIndex);
  const centerItem = mobileItems[effectiveCenterIndex];
  const rightItems = mobileItems.slice(effectiveCenterIndex + 1);

  const isCenterActive =
    isCreateHubModalOpen || location.pathname === "/events/create";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-card/85 backdrop-blur-md border-t border-border/60 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]"
      aria-label="Navigation mobile"
    >
      <div className="relative flex items-center justify-between h-[64px] px-2 max-w-lg mx-auto w-full select-none">
        {/* Left Wing Items (Accueil, Ressources) */}
        <div className="flex-1 flex items-center justify-around h-full">
          {leftItems.map((item) => {
            const badge = getBadge(item.url);
            return (
              <NavLink
                key={item.title}
                to={item.url}
                end={item.url === "/"}
                aria-label={item.title}
                className={({ isActive }) =>
                  cn(
                    "flex-1 flex flex-col items-center justify-center h-full min-w-[52px] py-1 cursor-pointer select-none transition-all active:scale-95 duration-150 relative",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground/45 hover:text-foreground/75"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Top Active Indicator Bar in Brand Orange */}
                    {isActive && (
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 w-9 h-[3.5px] rounded-b-full bg-primary shadow-xs shadow-primary/50 animate-in fade-in duration-200" />
                    )}

                    <div className="relative flex flex-col items-center justify-center">
                      <item.icon
                        weight={isActive ? "fill" : "regular"}
                        className={cn(
                          "transition-all duration-200",
                          isActive
                            ? "h-6 w-6 text-primary scale-105"
                            : "h-6 w-6 text-muted-foreground/60"
                        )}
                      />

                      {/* Active label in Brand Orange */}
                      {isActive && (
                        <span className="text-[10.5px] font-semibold tracking-tight mt-1 text-primary animate-in fade-in duration-200 leading-none">
                          {item.title}
                        </span>
                      )}

                      {badge !== null && (
                        <span className="absolute -top-1 -right-2 min-w-[16px] h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-background shadow-xs">
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Center Button (Publier / +) Flush & Centered */}
        <div className="w-16 h-full relative flex items-center justify-center shrink-0">
          {centerItem && (
            <button
              type="button"
              className={cn(
                "flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30 cursor-pointer active:scale-90 transition-all duration-150",
                isCenterActive && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
              )}
              aria-label={centerItem.title}
              onClick={() => setIsCreateHubModalOpen(true)}
            >
              <centerItem.icon
                weight="bold"
                className={cn(
                  "h-6 w-6 transition-transform duration-300",
                  isCreateHubModalOpen ? "rotate-45" : ""
                )}
              />
            </button>
          )}

          {/* Top Indicator Bar if Center action is active */}
          {isCenterActive && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-9 h-[3.5px] rounded-b-full bg-primary shadow-xs shadow-primary/50 animate-in fade-in duration-200" />
          )}
        </div>

        {/* Right Wing Items (Événements, Sphères) */}
        <div className="flex-1 flex items-center justify-around h-full">
          {rightItems.map((item) => {
            const badge = getBadge(item.url);
            return (
              <NavLink
                key={item.title}
                to={item.url}
                aria-label={item.title}
                className={({ isActive }) =>
                  cn(
                    "flex-1 flex flex-col items-center justify-center h-full min-w-[52px] py-1 cursor-pointer select-none transition-all active:scale-95 duration-150 relative",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground/45 hover:text-foreground/75"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Top Active Indicator Bar in Brand Orange */}
                    {isActive && (
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 w-9 h-[3.5px] rounded-b-full bg-primary shadow-xs shadow-primary/50 animate-in fade-in duration-200" />
                    )}

                    <div className="relative flex flex-col items-center justify-center">
                      <item.icon
                        weight={isActive ? "fill" : "regular"}
                        className={cn(
                          "transition-all duration-200",
                          isActive
                            ? "h-6 w-6 text-primary scale-105"
                            : "h-6 w-6 text-muted-foreground/60"
                        )}
                      />

                      {/* Active label in Brand Orange */}
                      {isActive && (
                        <span className="text-[10.5px] font-semibold tracking-tight mt-1 text-primary animate-in fade-in duration-200 leading-none">
                          {item.title}
                        </span>
                      )}

                      {badge !== null && (
                        <span className="absolute -top-1 -right-2 min-w-[16px] h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-background shadow-xs">
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {isCreateHubModalOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <CreateHubModal
            open={isCreateHubModalOpen}
            onOpenChange={setIsCreateHubModalOpen}
          />
        </Suspense>
      )}
    </nav>
  );
}
