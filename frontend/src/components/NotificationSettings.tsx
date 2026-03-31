import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getNotificationSettings, updateNotificationSettings } from "@/services/api";

interface NotificationSettingsProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "button" | "inline";
}

export function NotificationSettings({ 
  children, 
  className = "",
  variant = "button" 
}: NotificationSettingsProps) {
  const { toast } = useToast();
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    // Email notifications
    email_post_likes: true,
    email_post_comments: true,
    email_sphere_invitations: true,
    email_task_assignments: true,
    email_messages: true,
    // Push notifications
    push_post_likes: false,
    push_post_comments: true,
    push_sphere_invitations: true,
    push_task_assignments: true,
    push_messages: true,
    // In-app notifications
    in_app_post_likes: true,
    in_app_post_comments: true,
    in_app_sphere_invitations: true,
    in_app_task_assignments: true,
    in_app_messages: true,
    // System notifications
    system_updates: true,
    marketing_emails: false
  });

  // Load notification settings when dialog opens
  useEffect(() => {
    if (showSettings && !isLoading) {
      loadNotificationSettings();
    }
  }, [showSettings]);

  const loadNotificationSettings = async () => {
    setIsLoading(true);
    try {
      const settings = await getNotificationSettings();
      setNotificationSettings(prev => ({
        ...prev,
        ...settings
      }));
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres de notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsChange = async (key: string, value: boolean) => {
    // Update local state immediately for UI responsiveness
    setNotificationSettings(prev => ({ ...prev, [key]: value }));

    // Save to API
    setIsSaving(true);
    try {
      await updateNotificationSettings({ [key]: value });
      toast({
        title: "Paramètre modifié",
        description: "Vos préférences de notifications ont été mises à jour",
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      // Revert local state on error
      setNotificationSettings(prev => ({ ...prev, [key]: !value }));
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le paramètre",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const settingsContent = (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Chargement...</span>
        </div>
      ) : (
        <>
          {/* Email Notifications */}
          <div>
            <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
              Notifications par email
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="email_post_likes" className="text-sm">J'aimes sur mes posts</Label>
                <Switch
                  id="email_post_likes"
                  checked={notificationSettings.email_post_likes}
                  onCheckedChange={(value) => handleSettingsChange("email_post_likes", value)}
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email_post_comments" className="text-sm">Commentaires sur mes posts</Label>
                <Switch
                  id="email_post_comments"
                  checked={notificationSettings.email_post_comments}
                  onCheckedChange={(value) => handleSettingsChange("email_post_comments", value)}
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email_sphere_invitations" className="text-sm">Invitations à des sphères</Label>
                <Switch
                  id="email_sphere_invitations"
                  checked={notificationSettings.email_sphere_invitations}
                  onCheckedChange={(value) => handleSettingsChange("email_sphere_invitations", value)}
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email_task_assignments" className="text-sm">Nouvelles tâches</Label>
                <Switch
                  id="email_task_assignments"
                  checked={notificationSettings.email_task_assignments}
                  onCheckedChange={(value) => handleSettingsChange("email_task_assignments", value)}
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email_messages" className="text-sm">Messages privés</Label>
                <Switch
                  id="email_messages"
                  checked={notificationSettings.email_messages}
                  onCheckedChange={(value) => handleSettingsChange("email_messages", value)}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          {/* Push Notifications */}
          <div>
            <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
              Notifications push
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="push_post_likes" className="text-sm">J'aimes sur mes posts</Label>
                <Switch
                  id="push_post_likes"
                  checked={notificationSettings.push_post_likes}
                  onCheckedChange={(value) => handleSettingsChange("push_post_likes", value)}
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push_post_comments" className="text-sm">Commentaires sur mes posts</Label>
                <Switch
                  id="push_post_comments"
                  checked={notificationSettings.push_post_comments}
                  onCheckedChange={(value) => handleSettingsChange("push_post_comments", value)}
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push_messages" className="text-sm">Messages privés</Label>
                <Switch
                  id="push_messages"
                  checked={notificationSettings.push_messages}
                  onCheckedChange={(value) => handleSettingsChange("push_messages", value)}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          {/* In-App Notifications */}
          <div>
            <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
              Notifications dans l'app
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="in_app_post_likes" className="text-sm">J'aimes sur mes posts</Label>
                <Switch
                  id="in_app_post_likes"
                  checked={notificationSettings.in_app_post_likes}
                  onCheckedChange={(value) => handleSettingsChange("in_app_post_likes", value)}
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="in_app_post_comments" className="text-sm">Commentaires sur mes posts</Label>
                <Switch
                  id="in_app_post_comments"
                  checked={notificationSettings.in_app_post_comments}
                  onCheckedChange={(value) => handleSettingsChange("in_app_post_comments", value)}
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="in_app_messages" className="text-sm">Messages privés</Label>
                <Switch
                  id="in_app_messages"
                  checked={notificationSettings.in_app_messages}
                  onCheckedChange={(value) => handleSettingsChange("in_app_messages", value)}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          {/* System Notifications */}
          <div>
            <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
              Notifications système
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="system_updates" className="text-sm">Mises à jour et maintenance</Label>
                <Switch
                  id="system_updates"
                  checked={notificationSettings.system_updates}
                  onCheckedChange={(value) => handleSettingsChange("system_updates", value)}
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="marketing_emails" className="text-sm">Emails marketing et promotions</Label>
                <Switch
                  id="marketing_emails"
                  checked={notificationSettings.marketing_emails}
                  onCheckedChange={(value) => handleSettingsChange("marketing_emails", value)}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (variant === "inline") {
    return settingsContent;
  }

  return (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className={className}>
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Paramètres de notifications</DialogTitle>
        </DialogHeader>
        {settingsContent}
      </DialogContent>
    </Dialog>
  );
}
