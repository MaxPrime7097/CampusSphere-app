import { useState, useEffect, useMemo } from "react";
import { mockDB } from "@/services/mockDatabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Utilise l'interface Notification du mock database

export function Notifications() {
  // Charger l'utilisateur actuel
  useEffect(() => {
    mockDB.loadCurrentUser();
  }, []);

  const currentUser = mockDB.getCurrentUser();

  // Notifications depuis le mock database
  const notifications = useMemo(() => {
    if (!currentUser) return [];
    return mockDB.getNotificationsByUser(currentUser.id);
  }, [currentUser]);

  // Supprimé les données mock - utilise maintenant le mock database

  const { toast } = useToast();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'sphere_invite':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'task':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'resource':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'system':
        return <Settings className="h-4 w-4 text-gray-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const markAsRead = (id: string) => {
    // Marquer comme lu dans le mock database
    if (currentUser) {
      mockDB.markNotificationAsRead(currentUser.id, id);
    }
    toast({
      title: "Notification marquée comme lue",
      duration: 1000,
    });
  };

  const markAllAsRead = () => {
    // Marquer toutes comme lues dans le mock database
    if (currentUser) {
      const userNotifications = mockDB.getNotificationsByUser(currentUser.id);
      userNotifications.forEach(notif => {
        mockDB.markNotificationAsRead(currentUser.id, notif.id);
      });
    }
    toast({
      title: "Toutes les notifications ont été marquées comme lues",
      duration: 2000,
    });
  };

  const deleteNotification = (id: string) => {
    // Supprimer la notification dans le mock database
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
              onClick={markAllAsRead}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              <span className="hidden md:block">Tout marquer comme lu</span>
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
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