import { TriangleAlert, LogOut, UserX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SettingsDangerZoneCardProps {
  isLoading: boolean;
  onLogout: () => void;
  onOpenDeleteModal: () => void;
}

export function SettingsDangerZoneCard({
  isLoading,
  onLogout,
  onOpenDeleteModal,
}: SettingsDangerZoneCardProps) {
  const items = [
    { label: "Déconnexion", icon: LogOut, action: onLogout, danger: true },
    { label: "Supprimer le compte", icon: UserX, action: onOpenDeleteModal, danger: true },
  ];

  return (
    <Card className="campus-card">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-destructive hover:text-destructive text-lg md:text-xl">
          <TriangleAlert className="h-4 w-4 md:h-5 md:w-5" />
          Danger Zone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-4 md:p-6 pt-0">
        {items.map((item, index) => (
          <div key={item.label}>
            <Button
              variant="ghost"
              className={`w-full justify-between h-auto p-3 md:p-4 text-sm md:text-base ${
                item.danger ? "text-destructive hover:text-destructive" : ""
              }`}
              onClick={item.action}
              disabled={isLoading}
            >
              <span>{item.label}</span>
              {isLoading ? (
                <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
              ) : (
                <item.icon className="h-3 w-3 md:h-4 md:w-4" />
              )}
            </Button>
            {index < items.length - 1 && <Separator />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
