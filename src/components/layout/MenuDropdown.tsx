import { cn } from "@/lib/utils";
import {
  Menu, 
  Home, 
  User,
  FolderOpen, 
  Users, 
  Calendar, 
  ShoppingBag,  
  LibraryBig, 
  Bookmark, 
  MessageSquare,
  Settings,
  Info,
  LifeBuoy,
  BookLock,
  ScrollText
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const quickActions = [
  { title: "Enregistrements", url: "/saved", icon: Bookmark },
  { title: "Paramètres", url: "/settings", icon: Settings },
];

const utils = [
  {title: "À propos", url: "/cs-inc/about", icon: Info },
  {title: "Politique de confidentialité", url: "/cs-inc/policies/privacy", icon: BookLock },
  {title: "Conditions d'utilisation", url: "/cs-inc/policies/terms", icon: ScrollText },
  {title: "Aide", url: "/cs-inc/contact", icon: LifeBuoy },
];

export function MenuDropdown() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";
  const navigate = useNavigate();

  const isActive = (path: string) => currentPath === path;
  const getNavClasses = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-accent text-foreground font-medium" 
      : "hover:bg-accent text-primary";

  return (
  <Sheet>
      <SheetTrigger>
        <Button variant="ghost" size="sm" className="relative hover:bg-accent">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="pt-5">
        <SheetHeader>
          <h1 className="text-3xl font-bold bg-clip-text text-muted-foreground">
            Menu
          </h1>
        </SheetHeader>
        <Card className="campus-card mt-5" onClick= {() => navigate("/profile")}>
          <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src= "/placeholder/.jpg" />
                <AvatarFallback className="bg-input text-muted-foreground font-semibold">
                  M                
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm hover:underline">Max Prime</h4>
                    <div className="w-4 h-4 campus-gradient rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">@cypher</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((item) => (
               <Card className="py-2">
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClasses}>
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
               </Card>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Utilitaires</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {utils.map((item) => (
               <Card className="py-2">
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavClasses}>
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
               </Card>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <Card className="campus-card mt-5">
          <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
            <div className="text-center space-y-4">
              <div>
                <h3 className="font-automata text-primary text-lg md:text-xl">CampusSphere</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Version 1.0.0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </SheetContent>
    </Sheet>
  );
}