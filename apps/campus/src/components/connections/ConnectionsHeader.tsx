interface ConnectionsHeaderProps {
  mutualCountStatus: string | null;
}

export function ConnectionsHeader({ mutualCountStatus }: ConnectionsHeaderProps) {
  return (
    <div className="mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Connexions
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Gérez vos connexions et découvrez de nouveaux étudiants
        </p>
      </div>
      {mutualCountStatus && (
        <p className="text-xs text-muted-foreground mt-1">{mutualCountStatus}</p>
      )}
    </div>
  );
}
