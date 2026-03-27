import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { listNotifications, markNotificationRead } from "@/services/api";
import { formatRelativeTime } from "@/lib/date";

interface NotificationItem {
  id: string;
  user: {
    name: string;
    avatar?: string | null;
  };
  content: string;
  timestamp: string | null;
  read: boolean;
}

export function NotificationDropdown() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const data = await listNotifications();
        if (!isMounted) return;

        const mapped = (data || []).map((notification: any) => ({
          id: String(notification.id),
          user: {
            name: notification.data?.sender_name || notification.data?.user_name || notification.title || "Notification",
            avatar: notification.data?.sender_avatar || notification.data?.user_avatar || null,
          },
          content: notification.message || notification.title || "",
          timestamp: notification.created_at || notification.createdAt || null,
          read: Boolean(notification.is_read || notification.isRead),
        }));
        setNotifications(mapped);
      } catch {
        setNotifications([]);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const handleNotificationClick = (notificationId: string) => {
    void markNotificationRead(notificationId).catch(() => null);
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      )
    );
    navigate("/notifications");
  };

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
          {notifications.length === 0 && (
            <div className="rounded-lg border p-4 text-sm text-muted-foreground">
              Aucune notification pour le moment.
            </div>
          )}

          {notifications.slice(0, 5).map((notif) => (
            <div
              key={notif.id}
              className={`p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors ${
                !notif.read ? "bg-primary/5" : ""
              }`}
              onClick={() => handleNotificationClick(notif.id)}
            >
              <div className="flex gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={notif.user.avatar || undefined} />
                  <AvatarFallback>{notif.user.name[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">{notif.user.name}</span>{" "}
                    {notif.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTime(notif.timestamp)}
                  </p>
                </div>

                {!notif.read && (
                  <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full flex-shrink-0" />
                )}
              </div>
            </div>
          ))}

          <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/notifications")}>
            Voir toutes les notifications
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
