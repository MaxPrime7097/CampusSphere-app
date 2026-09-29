import { Fragment, Suspense, lazy, useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getNavigationSections, type NavigationUser } from "./navigationConfig";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { useToast } from "@/hooks/use-toast";
import { openVerificationModal } from "@/lib/events";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import { useAuth } from "@/contexts/AuthContext";

const CreatePostModal = lazy(() => import("@/components/modals/CreatePostModal").then((module) => ({ default: module.CreatePostModal })));

export function MobileNavigation({ user: externalUser }: { user?: NavigationUser }) {
  const { toast } = useToast();
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const { user: authUser } = useAuth();
  const user = externalUser || authUser || {};
  const { mobileItems } = getNavigationSections(user);
  const counts = useUnreadCounts();

  const getBadge = (url: string) => {
    if (url === "/notifications" && counts.notifications > 0) return counts.notifications;
    if (url === "/messages" && counts.messages > 0) return counts.messages;
    return null;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {mobileItems.map((item) => {
          const badge = getBadge(item.url);
          const baseStyles = "flex flex-col items-center justify-center w-full h-full transition-colors";
          const inactiveStyles = "text-muted-foreground hover:text-foreground";

          const isVerified = (user as any)?.isVerified;

          if (item.url === "#create-post") {
            return isVerified ? (
              <Fragment key={item.title}>
                <div className="flex items-center justify-center w-full h-full relative">
                  <button
                    type="button"
                    className="absolute bottom-3 flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-95"
                    aria-label={item.title}
                    onClick={() => setIsCreatePostModalOpen(true)}
                  >
                    <item.icon className="h-6 w-6" />
                  </button>
                </div>
                {isCreatePostModalOpen && (
                  <Suspense fallback={<ModalLoadingFallback />}>
                    <CreatePostModal
                      open={isCreatePostModalOpen}
                      onOpenChange={setIsCreatePostModalOpen}
                    />
                  </Suspense>
                )}
              </Fragment>
            ) : (
              <div key={item.title} className="flex items-center justify-center w-full h-full relative">
                <button 
                  type="button" 
                  className="absolute bottom-3 flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-95" 
                  aria-label={item.title}
                  onClick={() => {
                    toast({
                      title: "Compte non vérifié",
                      description: "Vous devez certifier votre compte pour publier.",
                      variant: "destructive",
                      action: (
                        <button className="text-xs font-bold underline" onClick={() => openVerificationModal()}>Vérifier</button>
                      )
                    });
                  }}
                >
                  <item.icon className="h-6 w-6" />
                </button>
              </div>
            );
          }

          return (
            <NavLink
              key={item.title}
              to={item.url}
              aria-label={item.title}
              className={({ isActive }) => cn(baseStyles, isActive ? "text-primary" : inactiveStyles)}
            >
              {({ isActive }) => (
                <div className="relative flex flex-col items-center">
                  <item.icon className={cn("h-6 w-6 mb-0.5", isActive ? "fill-primary/20" : "")} />
                  <span className="text-[10px] font-medium leading-none">{item.title}</span>
                  {badge !== null && (
                    <span className="absolute -top-1 -right-2 min-w-[16px] h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
