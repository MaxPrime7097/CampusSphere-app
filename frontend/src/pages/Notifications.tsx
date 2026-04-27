import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, listNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification as deleteNotificationApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CheckCheck, 
  Bell,
  X, 
  Users, 
  MessageSquare, 
  FileText, 
  Calendar,
  Settings,
  Loader2
} from "lucide-react";
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

export function Notifications() {
  const [notifications, setNotifications] = useState<NotificationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await listNotifications();
        if (isMounted) {
          // Map backend notifications to frontend format
          const safeNotifications = Array.isArray(data) ? data : [];
          const mapped = safeNotifications.map((n: any) => {
            const senderName =
              n.sender?.name ||
              n.data?.sender_name ||
              n.data?.user_full_name ||
              n.data?.user_name ||
              n.data?.inviter_name ||
              n.data?.assigner_name ||
              n.data?.requester_name ||
              null;
            const senderAvatar = n.sender?.avatar || n.data?.sender_avatar || null;

            const notificationType = toCanonicalType(n.notification_type || n.type);
            const normalizedData = normalizeNotificationData(n);
            const actionUrl = buildActionUrl(notificationType, normalizedData);
            if (!actionUrl && CLICKABLE_NOTIFICATION_TYPES.has(notificationType)) {
              console.debug("[Notifications] Missing actionUrl for clickable notification", {
                notificationId: n.id,
                notificationType,
                normalizedData,
                rawData: n.data,
              });
            }

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
          setNotifications(mapped);
        }
      } catch (e: any) {
        toast({
          title: "Erreur",
          description: e?.message || "Impossible de charger les notifications",
          variant: "destructive",
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="max-w-4xl mx-auto py-4 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-muted-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} nouvelles notifications` : "Aucune nouvelle notification"}
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
        {/* Sur mobile: pas d'espace entre les cartes, pas d'arrondi, bord à bord */}
        <div className="-mx-4 md:mx-0 md:space-y-2">
          {loading && (
            <div className="space-y-2 w-full">
              <div className="rounded-none md:rounded-lg border-y md:border bg-card">
                <NotificationSkeleton />
              </div>
              <div className="rounded-none md:rounded-lg border-y md:border bg-card">
                <NotificationSkeleton />
              </div>
              <div className="rounded-none md:rounded-lg border-y md:border bg-card">
                <NotificationSkeleton />
              </div>
              <div className="rounded-none md:rounded-lg border-y md:border bg-card">
                <NotificationSkeleton />
              </div>
              <div className="rounded-none md:rounded-lg border-y md:border bg-card">
                <NotificationSkeleton />
              </div>
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="rounded-none md:rounded-lg border-y md:border bg-card p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Aucune notification</h3>
              <p className="text-muted-foreground text-center">
                Vous n'avez pas encore de notifications.
              </p>
            </div>
          )}

          {!loading && notifications.length > 0 && (
            notifications.map((notification) => (
              <div
                key={notification.id}
                role="button"
                tabIndex={0}
                onClick={() => handleNotificationClick(notification)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleNotificationClick(notification);
                }}
                className={`rounded-none md:rounded-lg border-y md:border bg-card transition-all duration-200 hover:bg-accent/30 cursor-pointer ${
                  !notification.read ? 'border-primary/30 bg-primary/5' : ''
                }`}
              >
                <div className="flex items-stretch">
                  {/* Bande colorée non-lu */}
                  {!notification.read && (
                    <div className="w-1 rounded-l-lg bg-primary flex-shrink-0" />
                  )}

                  <div className="flex-1 p-3 min-w-0">
                    {/* Ligne 1 : icône + titre + dot + heure */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                      <span className={`font-semibold text-sm truncate flex-1 ${
                        !notification.read ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
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
                        <Avatar className="h-5 w-5 flex-shrink-0">
                          <AvatarImage src={notification.sender?.avatar ?? undefined} />
                          <AvatarFallback className="text-[9px]">?</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate">
                          {notification.sender?.name || (notification.type === 'system' ? 'Système' : 'Membre')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                            className="h-7 w-7"
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
