import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification as deleteNotificationApi } from "@/services/api";
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
import { CanonicalNotificationType, NOTIFICATION_TYPE_SET } from "@/constants/notificationTypes";


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
  actionUrl: string | null;
};

const debugFallbackType = (rawType: unknown, notificationId: unknown) => {
  console.debug("[Notifications] Unknown notification type, fallback to system", {
    notificationId,
    rawType,
  });
};

const LEGACY_TYPE_MAP: Record<string, CanonicalNotificationType> = {
  sphere_invite: "sphere_invitation",
  task: "task_assigned",
  resource: "resource_shared",
  message_received: "message",
};

const toCanonicalType = (rawType: unknown, notificationId: unknown): CanonicalNotificationType => {
  if (typeof rawType === "string" && NOTIFICATION_TYPE_SET.has(rawType)) {
    return rawType as CanonicalNotificationType;
  }

  if (typeof rawType === "string" && LEGACY_TYPE_MAP[rawType]) {
    return LEGACY_TYPE_MAP[rawType];
  }

  debugFallbackType(rawType, notificationId);
  return "system";
};

type NormalizedNotificationData = {
  postId: string | null;
  profileUsername: string | null;
  sphereId: string | null;
  taskId: string | null;
  resourceId: string | null;
  conversationId: string | null;
};

const toNullableString = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  return null;
};

const normalizeNotificationData = (n: any): NormalizedNotificationData => {
  const data = n?.data;
  const sender = n?.sender;

  return {
    postId: toNullableString(data?.post_id) || toNullableString(data?.post) || toNullableString(data?.postId),
    profileUsername:
      toNullableString(data?.requester_username) ||
      toNullableString(data?.username) ||
      toNullableString(sender?.id),
    sphereId: toNullableString(data?.sphere_id) || toNullableString(data?.sphereId),
    taskId: toNullableString(data?.task_id) || toNullableString(data?.taskId),
    resourceId: toNullableString(data?.resource_id) || toNullableString(data?.resourceId),
    conversationId: toNullableString(data?.conversation_id) || toNullableString(data?.conversationId),
  };
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

const buildActionUrl = (type: CanonicalNotificationType, data: NormalizedNotificationData): string | null => {
  switch (type) {
    case "post_like":
    case "post_comment":
    case "comment_reply":
      return data.postId ? `/posts/${data.postId}` : null;
    case "sphere_invitation":
    case "sphere_join_request":
      return data.sphereId ? `/spheres/${data.sphereId}` : null;
    case "task_assigned":
    case "task_completed":
      return data.taskId ? `/tasks/${data.taskId}` : null;
    case "resource_shared":
      return data.resourceId ? `/resources/${data.resourceId}` : null;
    case "connection_request":
    case "connection_accepted":
      return data.profileUsername ? `/profile/${data.profileUsername}` : null;
    case "message":
      return data.conversationId ? `/messages/${data.conversationId}` : "/messages";
    case "system":
    default:
      return null;
  }
};

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

            const notificationType = toCanonicalType(n.notification_type || n.type, n.id);
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
                id: n.data?.sender_id || n.data?.user_id || n.data?.requester_id || n.data?.assigner_id || n.data?.inviter_id || null,
              },
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

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
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
