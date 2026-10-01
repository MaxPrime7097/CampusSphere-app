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
  Calendar,
  Search,
} from "lucide-react";
import { SpheraIcon } from "@/components/ui/sphera-icon";

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
  icon: any; // Using any to support both LucideIcon and custom SVG/React components like SpheraIcon
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
  navigationItems.push({ title: "Événements", url: "/events", icon: Calendar });
  
  if (isAuthenticated) {
    navigationItems.push({ title: "Sphères", url: "/spheres", icon: Globe });
  }

  const quickActions: NavigationItem[] = [];
  if (isAuthenticated) {
    quickActions.push(
      { title: "Connexions", url:"/connections", icon: Link },
      { title: "Messages", url: "/messages", icon: MessageSquare },
      { title: "Enregistrements", url: "/saved", icon: Bookmark },
      { title: "Paramètres", url: "/settings", icon: Settings }
    );
  }

  const utilities: NavigationItem[] = [
    { title: "Ouvrir Sphera", url: "/sphera/sso", icon: SpheraIcon, external: true },
    ...adminEntry,
    { title: "À propos", url: "/cs-inc/about", icon: Info, external: true },
    { title: "Politiques", url: "/cs-inc/policies", icon: Scale, external: true },
    { title: "Aide", url: "/cs-inc/contact", icon: LifeBuoy, external: true },
  ];

  const mobileItems: NavigationItem[] = [
    { title: "Accueil", url: "/", icon: Home },
    { title: "Ressources", url: "/resources", icon: FolderOpen },
    { title: "Publier", url: newPost, icon: Plus },
    { title: "Événements", url: "/events", icon: Calendar },
    { title: "Sphères", url: "/spheres", icon: Globe },
  ];

  return {
    navigationItems,
    quickActions,
    utilities,
    mobileItems,
  };
}
