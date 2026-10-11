import type { Icon as LucideIcon } from "@phosphor-icons/react";
import { Scales as Scale, BookmarkSimple, FolderOpen, House as Home, Info, Lifebuoy as LifeBuoy, ChatCircle as MessageSquare, Scroll as ScrollText, Gear as Settings, Shield, User, Sphere, Bell, Plus, Link, Calendar, MagnifyingGlass as Search, Lightning as Zap } from "@phosphor-icons/react";
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

export function getNavigationSections(
  user?: NavigationUser | null,
  t?: (key: string, options?: { defaultValue?: string }) => string
): NavigationSections {
  const tr = (key: string, fallback: string) => (t ? t(key, { defaultValue: fallback }) : fallback);
  const isAuthenticated = Boolean(user?.username) || Boolean(localStorage.getItem("access"));
  const profileUrl = `/profile/${user?.username || "current"}`;
  const newPost = "#create-post";
  const adminEntry = isAdminUser(user) ? [{ title: tr("admin", "Admin"), url: "/admin/dashboard", icon: Shield }] : [];

  // Define basic navigation items
  const navigationItems: NavigationItem[] = [
    { title: tr("home", "Accueil"), url: "/", icon: Home },
  ];

  // Add protected items only if authenticated
  if (isAuthenticated) {
    navigationItems.push({ title: tr("profile", "Profil"), url: profileUrl, icon: User });
  }
  
  // Resources is now public-read
  navigationItems.push({ title: tr("resources", "Ressources"), url: "/resources", icon: FolderOpen });
  navigationItems.push({ title: tr("events", "Événements"), url: "/events", icon: Calendar });
  
  if (isAuthenticated) {
    navigationItems.push({ title: tr("spheres", "Sphères"), url: "/spheres", icon: Sphere });
  }

  const quickActions: NavigationItem[] = [];
  if (isAuthenticated) {
    quickActions.push(
      { title: tr("connections", "Connexions"), url:"/connections", icon: Link },
      { title: tr("messages", "Messages"), url: "/messages", icon: MessageSquare },
      { title: tr("saved", "Enregistrements"), url: "/saved", icon: BookmarkSimple },
      { title: tr("settings", "Paramètres"), url: "/settings", icon: Settings }
    );
  }

  const utilities: NavigationItem[] = [
    { title: tr("openSphera", "Ouvrir Sphera"), url: "/sphera/sso", icon: SpheraIcon, external: true },
    ...adminEntry,
    { title: tr("impactScore", "Impact Score"), url: "/cs-inc/impact-score", icon: Zap, external: true },
    { title: tr("about", "À propos"), url: "/cs-inc/about", icon: Info, external: true },
    { title: tr("policies", "Politiques"), url: "/cs-inc/policies", icon: Scale, external: true },
    { title: tr("help", "Aide"), url: "/cs-inc/contact", icon: LifeBuoy, external: true },
  ];

  const mobileItems: NavigationItem[] = [
    { title: tr("home", "Accueil"), url: "/", icon: Home },
    { title: tr("resources", "Ressources"), url: "/resources", icon: FolderOpen },
    { title: tr("publish", "Publier"), url: newPost, icon: Plus },
    { title: tr("events", "Événements"), url: "/events", icon: Calendar },
    { title: tr("spheres", "Sphères"), url: "/spheres", icon: Sphere },
  ];

  return {
    navigationItems,
    quickActions,
    utilities,
    mobileItems,
  };
}
