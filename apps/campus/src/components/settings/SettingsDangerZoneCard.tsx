import { TriangleAlert, LogOut, UserX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="py-5 border-b border-border/40 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive flex-shrink-0">
          <TriangleAlert className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-destructive">Zone sensible</h2>
          <p className="text-xs text-muted-foreground">Actions irréversibles et déconnexion</p>
        </div>
      </div>
      <div className="divide-y divide-border/40 pt-1">
        {items.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className="w-full justify-between h-auto py-3 px-2 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 font-normal rounded-lg transition-colors"
            onClick={item.action}
            disabled={isLoading}
          >
            <span>{item.label}</span>
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <item.icon className="h-4 w-4" />
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}

