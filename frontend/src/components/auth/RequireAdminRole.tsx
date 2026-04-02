import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser, getAdminPermissions as getAdminPermissionsFromApi, type AdminPermissions as ApiAdminPermissions } from "@/services/api";
import { canAdmin } from "@/lib/adminPermissions";

interface RequireAdminRoleProps {
  action?: "view" | "create" | "update" | "delete" | "export";
  children: ReactNode;
}

export function RequireAdminRole({ action = "view", children }: RequireAdminRoleProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [backendPermissions, setBackendPermissions] = useState<ApiAdminPermissions | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const me = await getCurrentUser();
        if (!mounted) return;
        setUser(me);
        try {
          const permissionPayload = await getAdminPermissionsFromApi();
          if (mounted) {
            setBackendPermissions(permissionPayload.permissions);
          }
        } catch {
          // Fallback to frontend matrix if endpoint is unavailable.
        }
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const allowed = useMemo(() => canAdmin(user, action, backendPermissions), [user, action, backendPermissions]);

  if (!localStorage.getItem("access")) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Vérification des permissions…</div>;
  }

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
