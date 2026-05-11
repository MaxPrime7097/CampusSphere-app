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
  Sparkles,
} from "lucide-react";

export interface NavigationUser {
  username?: string | null;
  name?: string | null;
  avatar?: string | null;
  isVerified?: boolean;
  role?: string | null;
  user_type?: string | null;
  is_staff?: boolean;
  is_superuser?: boolean;
}

export interface NavigationItem {
  title: string;
  url: string;
  icon: LucideIcon;
  external?: boolean;
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
  const isAuthenticated = Boolean(user?.username) || Boolean(localStorage.getItem("access"));
  const profileUrl = `/profile/${user?.username || "current"}`;
  const newPost = "#create-post";
  const adminEntry = isAdminUser(user) ? [{ title: "Admin", url: "/admin/dashboard", icon: Shield }] : [];

  // Define basic navigation items
  const navigationItems: NavigationItem[] = [
    { title: "Accueil", url: "/", icon: Home },
  ];

  // Add protected items only if authenticated
  if (isAuthenticated) {
    navigationItems.push({ title: "Profil", url: profileUrl, icon: User });
  }
  
  // Resources is now public-read
  navigationItems.push({ title: "Ressources", url: "/resources", icon: FolderOpen });
  
  if (isAuthenticated) {
    navigationItems.push({ title: "Sphères", url: "/spheres", icon: Globe });
  }

  const quickActions: NavigationItem[] = [];
  if (isAuthenticated) {
    quickActions.push(
      { title: "Connexions", url:"/connections", icon: Link },
      { title: "Messages", url: "/messages", icon: MessageSquare },
      { title: "Mes révisions", url: "/study-sessions", icon: Sparkles },
      { title: "Enregistrements", url: "/saved", icon: Bookmark },
      { title: "Paramètres", url: "/settings", icon: Settings }
    );
  }

  const utilities: NavigationItem[] = [
    ...adminEntry,
    { title: "À propos", url: "/cs-inc/about", icon: Info, external: true },
    { title: "Politiques", url: "/cs-inc/policies", icon: Scale, external: true },
    { title: "Aide", url: "/cs-inc/contact", icon: LifeBuoy, external: true },
  ];

  const mobileItems: NavigationItem[] = [
    { title: "Accueil", url: "/", icon: Home },
    { title: "Ressources", url: "/resources", icon: FolderOpen },
  ];

  if (isAuthenticated) {
    mobileItems.push(
      { title: "NouveauPost", url: newPost, icon: Plus },
      { title: "Sphères", url: "/spheres", icon: Globe },
      { title: "Notifications", url: "/notifications", icon: Bell }
    );
  } else {
    // For guests on mobile, maybe add a search or info icon
    mobileItems.push({ title: "À propos", url: "/cs-inc/about", icon: Info });
  }

  return {
    navigationItems,
    quickActions,
    utilities,
    mobileItems,
  };
}
