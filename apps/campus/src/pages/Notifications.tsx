import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getUser, listNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification as deleteNotificationApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checks as CheckCheck, Bell, X, UsersThree as Users, ChatCircle as MessageSquare, FileText, Calendar, Gear as Settings, Spinner as Loader2 } from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";
import { CanonicalNotificationType } from "@/constants/notificationTypes";
import { buildActionUrl, normalizeNotificationData, resolveConnectionProfileUrl, toCanonicalType } from "@/lib/notifications";
import { NotificationSkeleton } from "@/components/ui/skeletons";

type NotificationListItem = {
  id: string;
  type: CanonicalNotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  sender: {
    name: string | null;
    avatar: string | null;
    id: string | null;
  };
  profileUsername: string | null;
  actionUrl: string | null;
};

const CLICKABLE_NOTIFICATION_TYPES = new Set<CanonicalNotificationType>([
  "post_like",
  "post_comment",
  "comment_reply",
  "sphere_invitation",
  "sphere_join_request",
  "task_assigned",
  "task_completed",
  "resource_shared",
  "connection_request",
  "connection_accepted",
  "message",
]);

function mapNotificationsList(data: any): NotificationListItem[] {
  const safeNotifications = Array.isArray(data) ? data : [];
  return safeNotifications.map((n: any) => {
    const senderName =
      n.sender?.name ||
      n.data?.sender_name ||
      n.data?.user_full_name ||
      n.data?.user_name ||
      n.data?.inviter_name ||
      n.data?.assigner_name ||
      n.data?.requester_name ||
      n.data?.author_name ||
      n.data?.sender_username ||
      n.data?.requester_username ||
      null;
    const senderAvatar = n.sender?.avatar || n.data?.sender_avatar || n.data?.author_avatar || null;

    const notificationType = toCanonicalType(n.notification_type || n.type);
    const normalizedData = normalizeNotificationData(n);
    const actionUrl = buildActionUrl(notificationType, normalizedData);

    return {
      id: String(n.id),
      type: notificationType,
      title: n.title || 'Notification',
      message: n.message || n.content || '',
      read: n.is_read || n.read || false,
      createdAt: n.created_at || n.createdAt || new Date().toISOString(),
      sender: {
        name: senderName,
        avatar: senderAvatar,
        id: normalizedData.senderId,
      },
      profileUsername: normalizedData.profileUsername,
      actionUrl,
    };
  });
}

export function Notifications() {
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<NotificationListItem[]>(() => {
    const cached = queryClient.getQueryData<any>(["notifications"]);
    return cached ? mapNotificationsList(cached) : [];
  });
  const [statusText, setStatusText] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications(),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const loading = notificationsQuery.isLoading && notifications.length === 0 && !notificationsQuery.data;

  useEffect(() => {
    if (notificationsQuery.data) {
      setNotifications(mapNotificationsList(notificationsQuery.data));
    } else if (notificationsQuery.error) {
      toast({
        title: "Erreur",
        description: (notificationsQuery.error as any)?.message || "Impossible de charger les notifications",
        variant: "destructive",
      });
    }
  }, [notificationsQuery.data, notificationsQuery.error, toast]);

  const getNotificationIcon = (type: CanonicalNotificationType) => {
    switch (type) {
      case "sphere_invitation":
      case "sphere_join_request":
      case "connection_request":
      case "connection_accepted":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "message":
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case "post_like":
      case "post_comment":
      case "comment_reply":
        return <Bell className="h-4 w-4 text-pink-500" />;
      case "task_assigned":
      case "task_completed":
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case "resource_shared":
        return <FileText className="h-4 w-4 text-purple-500" />;
      case "system":
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      toast({
        title: "Notification marquée comme lue",
        duration: 1000,
      });
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: "Impossible de marquer la notification comme lue",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast({
        title: "Toutes les notifications ont été marquées comme lues",
        duration: 2000,
      });
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: "Impossible de marquer toutes les notifications comme lues",
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (id: string) => {
    const previousNotifications = [...notifications];
    const targetNotification = notifications.find((notification) => notification.id === id);
    setStatusText("Suppression de la notification...");
    setNotifications(prev => prev.filter(n => n.id !== id));

    try {
      await deleteNotificationApi(id);
      setStatusText("Notification supprimée.");
      toast({
        title: "Notification supprimée",
        duration: 1000,
      });
    } catch (error: any) {
      setNotifications(previousNotifications);
      setStatusText(null);
      toast({
        title: "Erreur",
        description: error?.message || `Impossible de supprimer la notification${targetNotification?.title ? ` "${targetNotification.title}"` : ""}`,
        variant: "destructive",
      });
    }
  };

  const getUsernameById = async (senderId: string): Promise<string | null> => {
    try {
      const user = await getUser(senderId);
      const username = typeof user?.username === "string" ? user.username.trim() : "";
      return username || null;
    } catch {
      return null;
    }
  };


  const handleNotificationClick = async (notification: NotificationListItem) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      return;
    }

    if (notification.type === "connection_request" || notification.type === "connection_accepted") {
      const profileUrl = await resolveConnectionProfileUrl(
        notification.profileUsername,
        notification.sender?.id || null,
        getUsernameById
      );
      navigate(profileUrl || "/notifications");
      return;
    }

    navigate("/notifications");
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-6 md:py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount > 0 ? `${unreadCount} nouvelles notifications` : "Toutes vos notifications sont à jour"}
            </p>
            {statusText && <p className="text-xs text-muted-foreground mt-1">{statusText}</p>}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              <span className="hidden md:block">Tout marquer comme lu</span>
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="w-full">
          {loading && (
            <div className="flex flex-col">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border-b border-border/40 py-2">
                  <NotificationSkeleton />
                </div>
              ))}
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="py-16 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/60 mb-3 mx-auto" />
              <h3 className="text-base font-semibold mb-1">Aucune notification</h3>
              <p className="text-sm text-muted-foreground">
                Vous n'avez pas encore de notifications.
              </p>
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotificationClick(notification)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleNotificationClick(notification);
                  }}
                  className={`py-3.5 px-3 border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer rounded-lg ${
                    !notification.read ? 'bg-primary/[0.03]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Unread indicator dot */}
                    <div className="pt-1.5 flex-shrink-0">
                      {!notification.read ? (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-transparent" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Ligne 1 : icône + titre + heure */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                        <span className={`font-semibold text-sm truncate flex-1 ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {new Date(notification.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>

                      {/* Ligne 2 : message */}
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {notification.message}
                      </p>

                      {/* Ligne 3 : avatar + sender + actions */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {notification.type === "system" || (!notification.sender?.avatar && !notification.sender?.name) ? (
                            <div className="h-5 w-5 rounded-full bg-muted/60 p-0.5 flex items-center justify-center flex-shrink-0 border border-border/40 overflow-hidden">
                              <img src="/CS.svg" alt="CampusSphere" className="h-full w-full object-contain" />
                            </div>
                          ) : (
                            <Avatar className="h-5 w-5 flex-shrink-0">
                              <AvatarImage src={notification.sender?.avatar ?? undefined} />
                              <AvatarFallback className="text-[9px] font-bold">
                                {(notification.sender?.name || notification.sender?.id || "CS").slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <span className="text-xs text-muted-foreground truncate">
                            {notification.sender?.name || (notification.type === "system" ? "CampusSphere" : "Membre")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Marquer comme lu"
                            >
                              <CheckCheck className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title="Supprimer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
