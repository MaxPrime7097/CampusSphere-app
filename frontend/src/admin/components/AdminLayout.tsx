import { useState, useEffect } from "react";
import {
  Home,
  Shield,
  Menu,
  ArrowUpRight,
  UserCheck,
  Bell,
  Sparkles,
  ChevronRight,
  X,
} from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ADMIN_NAVIGATION } from "./adminNavigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminStats, getAdminVerificationQueue, getContactMessages } from "@/services/api";

const getBreadcrumbLabel = (pathname: string): string => {
  const current = ADMIN_NAVIGATION.find((item) => pathname.startsWith(item.to));
  return current?.label ?? "Dashboard";
};

const getBreadcrumbDescription = (pathname: string): string => {
  const current = ADMIN_NAVIGATION.find((item) => pathname.startsWith(item.to));
  return current?.description ?? "Pilotage et supervision de la plateforme";
};

export function AdminLayout({ children }: { children?: React.ReactNode } = {}) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
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
          pendingVerification =
            verifyRes.value?.meta?.pagination?.total_items ?? (verifyRes.value?.data?.length || 0);
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
    return () => {
      isMounted = false;
    };
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
    <div className="space-y-6">
      {groups.map((group) => {
        const items = ADMIN_NAVIGATION.filter((item) => item.group === group);
        return (
          <div key={group} className="space-y-1.5">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
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
                    onClick={() => {
                      if (onItemClick) onItemClick();
                    }}
                    className={({ isActive }) =>
                      `group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-semibold"
                          : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`h-4 w-4 flex-shrink-0 transition-colors ${
                              isActive
                                ? "text-primary-foreground"
                                : "text-muted-foreground group-hover:text-foreground"
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
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col md:flex-row selection:bg-primary/20">
      {/* ─── SIDEBAR DESKTOP (STICKY & FULL HEIGHT) ─── */}
      <aside className="hidden md:flex w-64 lg:w-72 shrink-0 flex-col justify-between border-r border-border bg-card/60 backdrop-blur sticky top-0 h-screen p-4 lg:p-5 overflow-y-auto">
        <div className="space-y-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 border-b border-border/80 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm leading-tight tracking-tight font-automata truncate">
                  CampusSphere
                </span>
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-bold uppercase tracking-wider">
                  Admin
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">Console d'Administration</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav>{renderNavLinks()}</nav>
        </div>

        {/* Footer Sidebar: User Profile + Back to App */}
        <div className="border-t border-border/80 pt-4 mt-6 space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-2.5 border border-border/50">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src={user?.avatar || undefined} />
              <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                {(user?.firstName || user?.username || "A")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-bold text-foreground">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.username || "Administrateur"}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {user?.is_superuser ? "Super Administrateur" : "Modérateur"}
              </p>
            </div>
          </div>

          <Button
            asChild
            size="sm"
            variant="outline"
            className="w-full justify-center gap-2 rounded-xl text-xs h-9 font-medium"
          >
            <Link to="/">
              <Home className="h-3.5 w-3.5 text-muted-foreground" />
              Retour à l'application
            </Link>
          </Button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA (FULL-WIDTH) ─── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* ─── MOBILE TOPBAR (STICKY ON MOBILE) ─── */}
        <header className="sticky top-0 z-40 flex md:hidden items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl border-border bg-background shadow-xs"
                  aria-label="Ouvrir le menu de navigation"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[340px] p-5 flex flex-col justify-between">
                <div>
                  <SheetHeader className="text-left mb-6 border-b border-border pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <SheetTitle className="text-sm font-bold font-automata">CampusSphere Admin</SheetTitle>
                        <p className="text-xs text-muted-foreground">Console de Gestion</p>
                      </div>
                    </div>
                  </SheetHeader>
                  <nav className="overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
                    {renderNavLinks(() => setMobileOpen(false))}
                  </nav>
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 p-2 border border-border/50 text-xs">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar || undefined} />
                      <AvatarFallback className="text-xs font-bold">
                        {(user?.firstName || user?.username || "A")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold truncate">{user?.username || "Admin"}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>

                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="w-full justify-center gap-2 rounded-xl text-xs h-9"
                  >
                    <Link to="/" onClick={() => setMobileOpen(false)}>
                      <Home className="h-4 w-4" />
                      Retour à l'application
                    </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-sm font-automata text-foreground truncate">
                {getBreadcrumbLabel(pathname)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground gap-1"
            >
              <Link to="/">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">App</span>
              </Link>
            </Button>
          </div>
        </header>

        {/* ─── DESKTOP HEADER (FULL-WIDTH & RESPONSIVE) ─── */}
        <header className="hidden md:flex items-center justify-between border-b border-border bg-card/60 px-6 lg:px-8 py-4 backdrop-blur">
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                <Home className="h-3.5 w-3.5" /> Accueil
              </Link>
              <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
              <Link to="/admin/dashboard" className="hover:text-foreground transition-colors">
                Admin
              </Link>
              <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
              <span className="font-semibold text-foreground">{getBreadcrumbLabel(pathname)}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground font-automata">
                {getBreadcrumbLabel(pathname)}
              </h1>
              <span className="text-xs text-muted-foreground hidden sm:inline-block">
                — {getBreadcrumbDescription(pathname)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-xl text-xs font-medium h-8 px-3"
            >
              <Link to="/">
                Application principale
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </Button>
          </div>
        </header>

        {/* ─── MAIN CONTENT CONTAINER (FULL-WIDTH) ─── */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}


