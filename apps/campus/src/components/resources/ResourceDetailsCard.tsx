import { Card, CardContent } from "@/components/ui/card";
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

const EmptyField = () => (
  <span className="italic text-muted-foreground text-xs font-normal">Aucun</span>
);

export function ResourceDetailsCard({
  level,
  size,
  uploadDate,
  tags,
}: ResourceDetailsCardProps) {
  return (
    <Card className="campus-card mb-4">
      <CardContent className="p-4 md:p-6">
        <h3 className="font-semibold text-lg mb-4">Détails</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Public cible</p>
            <p className="font-medium">{getAudienceLabel(level)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Taille du fichier</p>
            <p className="font-medium">{formatFileSize(size)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Date d'upload</p>
            <p className="font-medium">
              {uploadDate ? formatFrenchDate(uploadDate) : <EmptyField />}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Tags</p>
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
      </CardContent>
    </Card>
  );
}
