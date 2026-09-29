import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { getUser, listNotifications, markNotificationRead } from "@/services/api";
import { formatRelativeTime } from "@/lib/date";
import { buildActionUrl, normalizeNotificationData, resolveConnectionProfileUrl, toCanonicalType } from "@/lib/notifications";
import { CanonicalNotificationType } from "@/constants/notificationTypes";

interface NotificationItem {
  id: string;
  type: CanonicalNotificationType;
  user: {
    name: string;
    avatar?: string | null;
  };
  content: string;
  timestamp: string | null;
  read: boolean;
  actionUrl: string | null;
  profileUsername: string | null;
  senderId: string | null;
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

        const safeNotifications = Array.isArray(data) ? data : [];
        const mapped = safeNotifications.map((notification: any) => {
          const notificationType = toCanonicalType(notification.notification_type || notification.type);
          const normalizedData = normalizeNotificationData(notification);
          return {
            id: String(notification.id),
            type: notificationType,
            user: {
              name: notification.data?.sender_name || notification.data?.user_name || (notificationType === "system" ? "CampusSphere" : (notification.title || "CampusSphere")),
              avatar: notification.data?.sender_avatar || notification.data?.user_avatar || null,
            },
            content: notification.message || notification.title || "",
            timestamp: notification.created_at || notification.createdAt || null,
            read: Boolean(notification.is_read || notification.isRead),
            actionUrl: buildActionUrl(notificationType, normalizedData),
            profileUsername: normalizedData.profileUsername,
            senderId: normalizedData.senderId,
          };
        });
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

  const getUsernameById = async (senderId: string): Promise<string | null> => {
    try {
      const user = await getUser(senderId);
      const username = typeof user?.username === "string" ? user.username.trim() : "";
      return username || null;
    } catch {
      return null;
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    void markNotificationRead(notification.id).catch((): void => {});
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item
      )
    );

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      return;
    }

    if (notification.type === "connection_request" || notification.type === "connection_accepted") {
      const profileUrl = await resolveConnectionProfileUrl(
        notification.profileUsername,
        notification.senderId,
        getUsernameById
      );
      navigate(profileUrl || "/notifications");
      return;
    }

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
              className={`p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors ${!notif.read ? "bg-primary/5" : ""
                }`}
              onClick={() => void handleNotificationClick(notif)}
            >
              <div className="flex gap-3">
                {notif.type === "system" || (!notif.user.avatar && !notif.senderId && !notif.profileUsername) ? (
                  <div className="h-10 w-10 rounded-full bg-muted/60 p-1.5 flex items-center justify-center flex-shrink-0 border border-border/40 overflow-hidden">
                    <img src="/CS.svg" alt="CampusSphere" className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={notif.user.avatar || undefined} />
                    <AvatarFallback className="font-bold">
                      {(notif.user.name || "CS").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}

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
