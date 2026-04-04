import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { featureFlags } from "@/config/featureFlags";
import { AdminLayout } from "@/admin/components/AdminLayout";
import { AdminDashboardPage } from "@/admin/pages/AdminDashboardPage";
import { AdminUsersPage } from "@/admin/pages/AdminUsersPage";
import { AdminSpheresPage } from "@/admin/pages/AdminSpheresPage";
import { AdminModerationPage } from "@/admin/pages/AdminModerationPage";
import { AdminResourcesPage } from "@/admin/pages/AdminResourcesPage";
import { AdminLogsPage } from "@/admin/pages/AdminLogsPage";
import { AdminDashboard } from "./AdminDashboard";

export function AdminPanelRouter() {
  const { pathname } = useLocation();
  const isV2Enabled = featureFlags.ADMIN_PANEL_V2;
  const isRootRoute = pathname === "/admin" || pathname === "/admin/";

  if (!isV2Enabled) {
    if (isRootRoute || pathname === "/admin/legacy") {
      return <AdminDashboard />;
    }

    return <Navigate to="/admin/legacy" replace />;
  }

  if (isRootRoute || pathname === "/admin/legacy") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="spheres" element={<AdminSpheresPage />} />
        <Route path="moderation" element={<AdminModerationPage />} />
        <Route path="resources" element={<AdminResourcesPage />} />
        <Route path="logs" element={<AdminLogsPage />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
