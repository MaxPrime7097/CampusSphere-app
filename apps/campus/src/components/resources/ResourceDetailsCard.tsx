import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { formatFrenchDate } from "@/lib/date";
import { formatFileSize } from "@/lib/utils";
import { getAudienceLabel } from "@/lib/resourceMetadata";

interface ResourceDetailsCardProps {
  level: string;
  size: string;
  uploadDate: string | null;
  tags: string[];
}

export function ResourceDetailsCard({
  level,
  size,
  uploadDate,
  tags,
}: ResourceDetailsCardProps) {
  const { t } = useTranslation("resources");

  const EmptyField = () => (
    <span className="italic text-muted-foreground text-xs font-normal">{t("detail.none")}</span>
  );

  return (
    <div className="py-4 border-b border-border/40 space-y-4">
      <h3 className="font-semibold text-base">{t("detail.detailsTitle")}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{t("detail.targetAudience")}</p>
          <p className="font-medium">{getAudienceLabel(level)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">{t("detail.fileSize")}</p>
          <p className="font-medium">{formatFileSize(size)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">{t("detail.uploadDate")}</p>
          <p className="font-medium">
            {uploadDate ? formatFrenchDate(uploadDate) : <EmptyField />}
          </p>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-2">{t("detail.tags")}</p>
        <div className="flex flex-wrap gap-2">
          {(tags || []).length > 0 ? (
            (tags || []).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
              >
                {tag}
              </Badge>
            ))
          ) : (
            <EmptyField />
          )}
        </div>
      </div>
    </div>
  );
}
