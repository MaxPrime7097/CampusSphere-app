import type { LucideIcon } from "lucide-react";
import {
  Scale,
  Bookmark,
  FolderOpen,
  Home,
  Info,
  LifeBuoy,
  MessageSquare,
  ScrollText,
  Settings,
  Shield,
  User,
  Globe,
  Bell,
  Plus,
  Link,
} from "lucide-react";

export interface NavigationUser {
  username?: string | null;
  role?: string | null;
  user_type?: string | null;
  is_staff?: boolean;
  is_superuser?: boolean;
}

export interface NavigationItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface NavigationSections {
  navigationItems: NavigationItem[];
  quickActions: NavigationItem[];
  utilities: NavigationItem[];
  mobileItems: NavigationItem[];
}

function isAdminUser(user?: NavigationUser | null) {
  if (!user) return false;

  const role = `${user.role ?? ""}`.toLowerCase();
  const userType = `${user.user_type ?? ""}`.toLowerCase();

  return Boolean(user.is_staff || user.is_superuser || role === "admin" || userType === "admin");
}

export function getNavigationSections(user?: NavigationUser | null): NavigationSections {
  const profileUrl = `/profile/${user?.username || "current"}`;
  const newPost = "#create-post";
  const adminEntry = isAdminUser(user) ? [{ title: "Admin", url: "cs-inc/private/admin", icon: Shield }] : [];

  const navigationItems: NavigationItem[] = [
    { title: "Accueil", url: "/", icon: Home },
    { title: "Profil", url: profileUrl, icon: User },
    { title: "Ressources", url: "/resources", icon: FolderOpen },
    { title: "Sphères", url: "/spheres", icon: Globe },
  ];

  const quickActions: NavigationItem[] = [
    { title: "Connexions", url:"/connections", icon: Link },
    { title: "Messages", url: "/messages", icon: MessageSquare },
    { title: "Enregistrements", url: "/saved", icon: Bookmark },
    { title: "Paramètres", url: "/settings", icon: Settings },
    ...adminEntry,
  ];

  const utilities: NavigationItem[] = [
    { title: "À propos", url: "/cs-inc/about", icon: Info },
    { title: "Politiques", url: "/cs-inc/policies", icon: Scale },
    { title: "Aide", url: "/cs-inc/contact", icon: LifeBuoy },
  ];

  const mobileItems: NavigationItem[] = [
    { title: "Accueil", url: "/", icon: Home },
    { title: "Ressources", url: "/resources", icon: FolderOpen },
    { title: "NouveauPost", url: newPost, icon: Plus },
    { title: "Sphères", url: "/spheres", icon: Globe },
    { title: "Notifications", url: "/notifications", icon: Bell },
    // Admin retiré de la mobile navbar — disponible dans MenuDropdown
  ];

  return {
    navigationItems,
    quickActions,
    utilities,
    mobileItems,
  };
}
