import { useTranslation } from "react-i18next";

interface ConnectionsHeaderProps {
  mutualCountStatus: string | null;
}

export function ConnectionsHeader({ mutualCountStatus }: ConnectionsHeaderProps) {
  const { t } = useTranslation("connections");
  return (
    <div className="mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {t("subtitle")}
        </p>
      </div>
      {mutualCountStatus && (
        <p className="text-xs text-muted-foreground mt-1">{mutualCountStatus}</p>
      )}
    </div>
  );
}
