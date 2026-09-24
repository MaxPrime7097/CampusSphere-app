import { Card, CardContent } from "@/components/ui/card";

interface SettingsAboutCardProps {
  appVersion: string;
}

export function SettingsAboutCard({ appVersion }: SettingsAboutCardProps) {
  return (
    <Card className="campus-card">
      <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
        <div className="text-center space-y-4">
          <div>
            <h3 className="font-automata text-primary text-lg md:text-xl">CampusSphere</h3>
            <p className="text-xs md:text-sm text-muted-foreground">Version {appVersion}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
