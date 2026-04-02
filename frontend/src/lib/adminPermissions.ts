export type AdminAction = "view" | "create" | "update" | "delete" | "export";

export type AdminPermissions = Record<AdminAction, boolean>;

export type AdminRole = "super_admin" | "admin" | "moderator" | "viewer" | "none";

export const ADMIN_PERMISSIONS_MATRIX: Record<Exclude<AdminRole, "none">, AdminPermissions> = {
  super_admin: { view: true, create: true, update: true, delete: true, export: true },
  admin: { view: true, create: true, update: true, delete: true, export: true },
  moderator: { view: true, create: false, update: true, delete: false, export: false },
  viewer: { view: true, create: false, update: false, delete: false, export: false },
};

const NO_ADMIN_PERMISSIONS: AdminPermissions = {
  view: false,
  create: false,
  update: false,
  delete: false,
  export: false,
};

export function resolveAdminRole(user?: any): AdminRole {
  if (!user) return "none";

  if (user.is_superuser) return "super_admin";
  if (user.is_staff) return "admin";

  const rawRole = String(user.role ?? user.user_type ?? "").trim().toLowerCase();
  if (rawRole === "super_admin") return "super_admin";
  if (rawRole === "admin") return "admin";
  if (rawRole === "moderator") return "moderator";
  if (rawRole === "viewer") return "viewer";

  return "none";
}

export function getAdminPermissions(user?: any, backendPermissions?: Partial<AdminPermissions> | null): AdminPermissions {
  if (backendPermissions) {
    return {
      view: Boolean(backendPermissions.view),
      create: Boolean(backendPermissions.create),
      update: Boolean(backendPermissions.update),
      delete: Boolean(backendPermissions.delete),
      export: Boolean(backendPermissions.export),
    };
  }

  const role = resolveAdminRole(user);
  return role === "none" ? NO_ADMIN_PERMISSIONS : ADMIN_PERMISSIONS_MATRIX[role];
}

export function canAdmin(user: any, action: AdminAction, backendPermissions?: Partial<AdminPermissions> | null): boolean {
  return getAdminPermissions(user, backendPermissions)[action];
}
