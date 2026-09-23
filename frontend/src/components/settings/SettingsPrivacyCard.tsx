import { Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
    { label: "Blocages", action: onOpenBlockList },
  ];

  return (
    <Card className="campus-card">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <Shield className="h-4 w-4 md:h-5 md:w-5" />
          Confidentialité
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-4 md:p-6 pt-0">
        {items.map((item, index) => (
          <div key={item.label}>
            <Button
              variant="ghost"
              className="w-full justify-between h-auto p-3 md:p-4 text-sm md:text-base"
              onClick={item.action}
            >
              <span>{item.label}</span>
              <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            {index < items.length - 1 && <Separator />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
