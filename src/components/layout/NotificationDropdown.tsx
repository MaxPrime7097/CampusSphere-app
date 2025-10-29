import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  read: boolean;
}

export function NotificationDropdown() {
  const navigate = useNavigate();
  const [notifications] = useState<Notification[]>([
    {
      id: "1",
      user: { name: "Marie Dubois", avatar: "/placeholder-avatar.jpg" },
      content: "a aimé votre post",
      timestamp: "il y a 5min",
      read: false
    },
    {
      id: "2",
      user: { name: "Thomas Martin", avatar: "/placeholder-avatar.jpg" },
      content: "a commenté votre post",
      timestamp: "il y a 10min",
      read: false
    },
    {
      id: "3",
      user: { name: "Sophie Chen", avatar: "/placeholder-avatar.jpg" },
      content: "a commencé à vous suivre",
      timestamp: "il y a 1h",
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative hover:bg-accent">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-3">
          {notifications.slice(0, 5).map((notif) => (
            <div
              key={notif.id}
              className={`p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors ${
                !notif.read ? "bg-primary/5" : ""
              }`}
            >
              <div className="flex gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={notif.user.avatar} />
                  <AvatarFallback>{notif.user.name[0]}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">{notif.user.name}</span>{" "}
                    {notif.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notif.timestamp}
                  </p>
                </div>
                
                {!notif.read && (
                  <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
          
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => navigate("/notifications")}
          >
            Voir toutes les notifications
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
