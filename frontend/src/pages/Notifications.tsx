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
      <div className="container max-w-4xl mx-auto py-4 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-muted-foreground">
                Notifications
              </h1>
              <p className="text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} nouvelles notifications` : "Aucune nouvelle notification"}
              </p>
              {statusText && <p className="text-xs text-muted-foreground mt-1">{statusText}</p>}
            </div>
          </div>
          
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleMarkAllAsRead}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              <span className="hidden md:block">Tout marquer comme lu</span>
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading && (
            <div className="rounded-lg border bg-card p-12 text-center">
              <Loader2 className="h-12 w-12 text-muted-foreground mb-4 mx-auto animate-spin" />
              <p className="text-muted-foreground">Chargement des notifications...</p>
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="rounded-lg border bg-card p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Aucune notification</h3>
              <p className="text-muted-foreground text-center">
                Vous n'avez pas encore de notifications. Elles apparaîtront ici quand vous recevrez des invitations, messages ou mises à jour.
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
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleNotificationClick(notification);
                  }
                }}
                className={`rounded-lg border bg-card p-4 transition-all duration-200 hover:shadow-md cursor-pointer ${
                  !notification.read ? 'border-primary/20 bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{new Date(notification.createdAt).toLocaleDateString('fr-FR')}</span>
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              {notification.sender?.avatar ? (
                                <AvatarImage src={notification.sender.avatar} />
                              ) : (
                                <AvatarImage src="/placeholder-avatar.jpg" />
                              )}
                              <AvatarFallback className="text-xs">?</AvatarFallback>
                            </Avatar>
                            <span>
                              {notification.sender?.name || (notification.type === 'system' ? 'Système' : 'Membre')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="h-8 w-8"
                          >
                            <CheckCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
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
