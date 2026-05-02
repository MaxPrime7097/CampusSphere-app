import { Home, Shield, Menu } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ADMIN_NAVIGATION } from "./adminNavigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const getBreadcrumbLabel = (pathname: string): string => {
  const current = ADMIN_NAVIGATION.find((item) => pathname.startsWith(item.to));
  return current?.label ?? "Dashboard";
};

export function AdminLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 text-foreground">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-4 px-4 py-5 md:py-8">
        <aside className="hidden w-72 shrink-0 rounded-2xl border bg-card p-4 md:block">
          <div className="mb-6 flex items-center gap-2">
            <div className="rounded-lg bg-primary p-2 text-primary-foreground">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">CampusSphere Admin</p>
              <p className="text-xs text-muted-foreground">Espace de pilotage</p>
            </div>
          </div>

          <nav className="space-y-2">
            {ADMIN_NAVIGATION.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-lg border px-3 py-2 transition ${
                    isActive ? "border-primary bg-primary/10" : "border-transparent hover:border-border hover:bg-muted"
                  }`
                }
              >
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <div className="mb-4 rounded-2xl border bg-card/90 p-4 backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground">
                    <Home className="h-3 w-3" /> App
                  </Link>
                  <span>/</span>
                  <span>Admin</span>
                  <span>/</span>
                  <span className="text-foreground">{getBreadcrumbLabel(pathname)}</span>
                </div>
                <h1 className="text-xl font-semibold">{getBreadcrumbLabel(pathname)}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-4">
                    <div className="mb-6 flex items-center gap-2">
                      <div className="rounded-lg bg-primary p-2 text-primary-foreground">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">CampusSphere Admin</p>
                        <p className="text-xs text-muted-foreground">Espace de pilotage</p>
                      </div>
                    </div>
                    <nav className="space-y-2">
                      {ADMIN_NAVIGATION.map((item) => (
                        <NavLink
                          key={item.key}
                          to={item.to}
                          className={({ isActive }) =>
                            `block rounded-lg border px-3 py-2 transition ${
                              isActive ? "border-primary bg-primary/10" : "border-transparent hover:border-border hover:bg-muted"
                            }`
                          }
                        >
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </NavLink>
                      ))}
                    </nav>
                  </SheetContent>
                </Sheet>
                <Badge variant="outline">Accès privé</Badge>
                <Button asChild size="sm" variant="outline">
                  <Link to="/">Retour application</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
