import { Bell } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationSettings } from "@/components/NotificationSettings";

export function SettingsNotificationsCard() {
  return (
    <Card className="campus-card">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="flex items-center justify-between text-lg md:text-xl">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 md:h-5 md:w-5" />
            Notifications
          </div>
          <NotificationSettings />
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
