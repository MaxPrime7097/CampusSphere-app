interface SettingsAboutCardProps {
  appVersion: string;
}

export function SettingsAboutCard({ appVersion }: SettingsAboutCardProps) {
  return (
    <div className="py-6 text-center space-y-1 text-muted-foreground">
      <h3 className="font-automata text-sm font-semibold tracking-wider text-muted-foreground">CampusSphere</h3>
      <p className="text-xs">Version {appVersion}</p>
    </div>
  );
}

