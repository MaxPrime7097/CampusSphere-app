import { useState, useEffect, useMemo } from "react";
import { listNotifications, markNotificationRead, markAllNotificationsRead } from "@/services/api";
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

export function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await listNotifications();
        if (isMounted) {
          // Map backend notifications to frontend format
          const mapped = (data || []).map((n: any) => ({
            id: String(n.id),
            type: n.notification_type || n.type || 'system',
            title: n.title || 'Notification',
            message: n.message || n.content || '',
            read: n.is_read || n.read || false,
            createdAt: n.created_at || n.createdAt || new Date().toISOString(),
            sender: n.sender || null,
          }));
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'sphere_invite':
      case 'sphere_join_request':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'task':
      case 'task_assigned':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'resource':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'system':
        return <Settings className="h-4 w-4 text-gray-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
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

  const deleteNotification = (id: string) => {
    // TODO: Add delete endpoint to API if available
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast({
      title: "Notification supprimée",
      duration: 1000,
    });
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
          {loading ? (
            <div className="rounded-lg border bg-card p-12 text-center">
              <Loader2 className="h-12 w-12 text-muted-foreground mb-4 mx-auto animate-spin" />
              <p className="text-muted-foreground">Chargement des notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-lg border bg-card p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Aucune notification</h3>
              <p className="text-muted-foreground text-center">
                Vous n'avez pas encore de notifications. Elles apparaîtront ici quand vous recevrez des invitations, messages ou mises à jour.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`rounded-lg border bg-card p-4 transition-all duration-200 hover:shadow-md ${
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
                                <AvatarImage src="/placeholder-avatar.jpg" />
                                <AvatarFallback className="text-xs">?</AvatarFallback>
                              </Avatar>
                                <span>Par un membre</span>
                              </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => markAsRead(notification.id)}
                              className="h-8 w-8"
                            >
                              <CheckCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNotification(notification.id)}
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