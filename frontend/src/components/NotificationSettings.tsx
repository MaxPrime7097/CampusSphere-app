import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [notificationSettings, setNotificationSettings] = useState({
    likes: true,
    comments: true,
    follows: true,
    events: true,
    resources: true,
    mentions: true
  });

  const handleSettingsChange = (key: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Paramètre modifié",
      description: `${key} ${value ? 'activé' : 'désactivé'}`,
      duration: 2000,
    });
  };

  const settingsContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="likes">J'aimes</Label>
        <Switch
          id="likes"
          checked={notificationSettings.likes}
          onCheckedChange={(value) => handleSettingsChange("likes", value)}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="comments">Commentaires</Label>
        <Switch
          id="comments"
          checked={notificationSettings.comments}
          onCheckedChange={(value) => handleSettingsChange("comments", value)}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="follows">Nouveaux abonnements</Label>
        <Switch
          id="follows"
          checked={notificationSettings.follows}
          onCheckedChange={(value) => handleSettingsChange("follows", value)}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="events">Événements</Label>
        <Switch
          id="events"
          checked={notificationSettings.events}
          onCheckedChange={(value) => handleSettingsChange("events", value)}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="resources">Ressources</Label>
        <Switch
          id="resources"
          checked={notificationSettings.resources}
          onCheckedChange={(value) => handleSettingsChange("resources", value)}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="mentions">Mentions</Label>
        <Switch
          id="mentions"
          checked={notificationSettings.mentions}
          onCheckedChange={(value) => handleSettingsChange("mentions", value)}
        />
      </div>
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
