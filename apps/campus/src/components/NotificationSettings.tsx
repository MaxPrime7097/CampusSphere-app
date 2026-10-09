import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Gear as Settings, Spinner as Loader2 } from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("notifications");
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
        title: t("toasts.error"),
        description: t("settings.toasts.loadFailed"),
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
        title: t("settings.toasts.updated"),
        description: t("settings.toasts.updatedDesc"),
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      // Revert local state on error
      setNotificationSettings(prev => ({ ...prev, [key]: !value }));
      toast({
        title: t("toasts.error"),
        description: t("settings.toasts.saveFailed"),
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
          <span className="ml-2">{t("settings.loading")}</span>
        </div>
      ) : (
        <>
          {/* Email Notifications */}
          <div>
            <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
              {t("settings.emailSection")}
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="email_post_likes" className="text-sm">{t("settings.postLikes")}</Label>
                <Switch
                  id="email_post_likes"
                  checked={notificationSettings.email_post_likes}
                  onCheckedChange={(value) => handleSettingsChange("email_post_likes", value)}
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email_post_comments" className="text-sm">{t("settings.postComments")}</Label>
                <Switch
                  id="email_post_comments"
                  checked={notificationSettings.email_post_comments}
                  onCheckedChange={(value) => handleSettingsChange("email_post_comments", value)}
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email_sphere_invitations" className="text-sm">{t("settings.sphereInvitations")}</Label>
                <Switch
                  id="email_sphere_invitations"
                  checked={notificationSettings.email_sphere_invitations}
                  onCheckedChange={(value) => handleSettingsChange("email_sphere_invitations", value)}
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email_task_assignments" className="text-sm">{t("settings.taskAssignments")}</Label>
                <Switch
                  id="email_task_assignments"
                  checked={notificationSettings.email_task_assignments}
                  onCheckedChange={(value) => handleSettingsChange("email_task_assignments", value)}
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email_messages" className="text-sm">{t("settings.messages")}</Label>
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
              {t("settings.pushSection")}
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="push_post_likes" className="text-sm">{t("settings.postLikes")}</Label>
                <Switch
                  id="push_post_likes"
                  checked={notificationSettings.push_post_likes}
                  onCheckedChange={(value) => handleSettingsChange("push_post_likes", value)}
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push_post_comments" className="text-sm">{t("settings.postComments")}</Label>
                <Switch
                  id="push_post_comments"
                  checked={notificationSettings.push_post_comments}
                  onCheckedChange={(value) => handleSettingsChange("push_post_comments", value)}
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push_messages" className="text-sm">{t("settings.messages")}</Label>
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
              {t("settings.inAppSection")}
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="in_app_post_likes" className="text-sm">{t("settings.postLikes")}</Label>
                <Switch
                  id="in_app_post_likes"
                  checked={notificationSettings.in_app_post_likes}
                  onCheckedChange={(value) => handleSettingsChange("in_app_post_likes", value)}
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="in_app_post_comments" className="text-sm">{t("settings.postComments")}</Label>
                <Switch
                  id="in_app_post_comments"
                  checked={notificationSettings.in_app_post_comments}
                  onCheckedChange={(value) => handleSettingsChange("in_app_post_comments", value)}
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="in_app_messages" className="text-sm">{t("settings.messages")}</Label>
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
              {t("settings.systemSection")}
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="system_updates" className="text-sm">{t("settings.systemUpdates")}</Label>
                <Switch
                  id="system_updates"
                  checked={notificationSettings.system_updates}
                  onCheckedChange={(value) => handleSettingsChange("system_updates", value)}
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="marketing_emails" className="text-sm">{t("settings.marketingEmails")}</Label>
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
            {t("settings.trigger")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("settings.dialogTitle")}</DialogTitle>
        </DialogHeader>
        {settingsContent}
      </DialogContent>
    </Dialog>
  );
}
