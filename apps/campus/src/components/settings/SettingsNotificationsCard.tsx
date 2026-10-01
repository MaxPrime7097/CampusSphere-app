import { Bell } from "@phosphor-icons/react";
import { NotificationSettings } from "@/components/NotificationSettings";

export function SettingsNotificationsCard() {
  return (
    <div className="py-5 border-b border-border/40 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-secondary/60 flex items-center justify-center text-muted-foreground flex-shrink-0">
          <Bell className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">Notifications</h2>
          <p className="text-xs text-muted-foreground">Alertes par e-mail, push et dans l'application</p>
        </div>
      </div>
      <NotificationSettings />
    </div>
  );
}

