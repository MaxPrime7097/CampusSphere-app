import { useState, useEffect } from "react";
import {
  Home,
  Shield,
  Menu,
  ArrowUpRight,
  UserCheck,
  Bell,
  Sparkles,
} from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ADMIN_NAVIGATION } from "./adminNavigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminStats, getAdminVerificationQueue, getContactMessages } from "@/services/api";

const getBreadcrumbLabel = (pathname: string): string => {
  const current = ADMIN_NAVIGATION.find((item) => pathname.startsWith(item.to));
  return current?.label ?? "Dashboard";
};

const getBreadcrumbDescription = (pathname: string): string => {
  const current = ADMIN_NAVIGATION.find((item) => pathname.startsWith(item.to));
  return current?.description ?? "Pilotage de la plateforme";
};

export function AdminLayout() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [counts, setCounts] = useState<{
    pendingVerification: number;
    pendingReports: number;
    unreadContact: number;
  }>({
    pendingVerification: 0,
    pendingReports: 0,
    unreadContact: 0,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchBadges = async () => {
      try {
        const [statsRes, verifyRes, contactRes] = await Promise.allSettled([
          getAdminStats(),
          getAdminVerificationQueue({ page: 1 }),
          getContactMessages(),
        ]);

        if (!isMounted) return;

        let pendingReports = 0;
        if (statsRes.status === "fulfilled" && statsRes.value) {
          pendingReports = statsRes.value.pendingReports || 0;
        }

        let pendingVerification = 0;
        if (verifyRes.status === "fulfilled" && verifyRes.value) {
          pendingVerification = verifyRes.value?.meta?.pagination?.total_items ?? (verifyRes.value?.data?.length || 0);
        }

        let unreadContact = 0;
        if (contactRes.status === "fulfilled" && contactRes.value) {
          const list = Array.isArray(contactRes.value)
            ? contactRes.value
            : (contactRes.value as any)?.data || [];
          unreadContact = list.filter((m: any) => !m.is_read).length;
        }

        setCounts({
          pendingReports,
          pendingVerification,
          unreadContact,
        });
      } catch {
        // Non-blocking
      }
    };

    void fetchBadges();
  }, [pathname]);

  const groups = Array.from(new Set(ADMIN_NAVIGATION.map((item) => item.group)));

  const getBadgeValue = (badgeKey?: string) => {
    if (!badgeKey) return 0;
    if (badgeKey === "pendingVerification") return counts.pendingVerification;
    if (badgeKey === "pendingReports") return counts.pendingReports;
    if (badgeKey === "unreadContact") return counts.unreadContact;
    return 0;
  };

  const renderNavLinks = (onItemClick?: () => void) => (
    <div className="space-y-5">
      {groups.map((group) => {
        const items = ADMIN_NAVIGATION.filter((item) => item.group === group);
        return (
          <div key={group} className="space-y-1.5">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group}
            </p>
            <div className="space-y-1">
              {items.map((item) => {
                const Icon = item.icon;
                const badgeVal = getBadgeValue(item.badgeKey);
                return (
                  <NavLink
                    key={item.key}
                    to={item.to}
                    onClick={onItemClick}
                    className={({ isActive }) =>
                      `group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`h-4 w-4 flex-shrink-0 transition-colors ${
                              isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {badgeVal > 0 && (
                          <span
                            className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold transition-transform ${
                              isActive
                                ? "bg-white text-primary"
                                : "bg-destructive text-destructive-foreground animate-pulse"
                            }`}
                          >
                            {badgeVal > 99 ? "99+" : badgeVal}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-5 px-3 py-4 md:px-6 md:py-6">
        {/* Sidebar desktop */}
        <aside className="hidden w-72 shrink-0 flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm md:flex">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm leading-tight tracking-tight font-automata">CampusSphere</span>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-semibold uppercase">
                      Admin
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Console de Gestion</p>
                </div>
              </div>
            </div>

            <nav>{renderNavLinks()}</nav>
          </div>

          <div className="border-t border-border pt-4 mt-6 space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-2.5">
              <Avatar className="h-9 w-9 border border-border/80">
                <AvatarImage src={user?.avatar || undefined} />
                <AvatarFallback className="text-xs font-bold">
                  {(user?.firstName || user?.username || "A")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">
                  {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || "Administrateur"}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {user?.is_superuser ? "Super Administrateur" : "Modérateur Staff"}
                </p>
              </div>
            </div>

            <Button asChild size="sm" variant="outline" className="w-full justify-center gap-2 rounded-xl text-xs">
              <Link to="/">
                <Home className="h-3.5 w-3.5" />
                Retour à l'application
              </Link>
            </Button>
          </div>
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Header moderne */}
          <header className="rounded-2xl border border-border bg-card/90 px-4 py-3.5 shadow-sm backdrop-blur md:px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                    <Home className="h-3.5 w-3.5" /> Accueil
                  </Link>
                  <span>/</span>
                  <Link to="/admin/dashboard" className="hover:text-foreground transition-colors">
                    Admin
                  </Link>
                  <span>/</span>
                  <span className="font-semibold text-foreground">{getBreadcrumbLabel(pathname)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl font-automata">
                    {getBreadcrumbLabel(pathname)}
                  </h1>
                  <span className="hidden text-xs text-muted-foreground sm:inline-block">
                    — {getBreadcrumbDescription(pathname)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end md:self-auto">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl md:hidden">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-5 flex flex-col justify-between">
                    <div>
                      <div className="mb-6 flex items-center gap-3 border-b pb-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                          <Shield className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">CampusSphere Admin</p>
                          <p className="text-xs text-muted-foreground">Console de Gestion</p>
                        </div>
                      </div>
                      <nav>{renderNavLinks()}</nav>
                    </div>

                    <div className="border-t pt-4">
                      <Button asChild size="sm" variant="outline" className="w-full justify-center gap-2 rounded-xl">
                        <Link to="/">
                          <Home className="h-4 w-4" />
                          Retour application
                        </Link>
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>

                <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex gap-1.5 rounded-xl text-xs font-medium">
                  <Link to="/">
                    App principale
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                </Button>
              </div>
            </div>
          </header>

          {/* Corps de page */}
          <div className="flex-1">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

