import { Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsPrivacyCardProps {
  onOpenProfileVisibility: () => void;
  onOpenPostVisibility: () => void;
  onOpenDataExport: () => void;
  onOpenBlockList: () => void;
}

export function SettingsPrivacyCard({
  onOpenProfileVisibility,
  onOpenPostVisibility,
  onOpenDataExport,
  onOpenBlockList,
}: SettingsPrivacyCardProps) {
  const items = [
    { label: "Qui peut voir mon profil", action: onOpenProfileVisibility },
    { label: "Visibilité des posts", action: onOpenPostVisibility },
    { label: "Données et téléchargements", action: onOpenDataExport },
    { label: "Comptes bloqués", action: onOpenBlockList },
  ];

  return (
    <div className="py-5 border-b border-border/40 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-secondary/60 flex items-center justify-center text-muted-foreground flex-shrink-0">
          <Shield className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">Confidentialité</h2>
          <p className="text-xs text-muted-foreground">Contrôlez vos données et la visibilité de vos activités</p>
        </div>
      </div>
      <div className="divide-y divide-border/40 pt-1">
        {items.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className="w-full justify-between h-auto py-3 px-2 text-sm hover:bg-muted/40 font-normal rounded-lg transition-colors"
            onClick={item.action}
          >
            <span className="text-foreground/90">{item.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        ))}
      </div>
    </div>
  );
}

