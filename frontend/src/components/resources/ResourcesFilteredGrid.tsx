import { FileText } from "lucide-react";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { ResourceSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import type { ResourceCardData } from "@/types";

interface ResourcesFilteredGridProps {
  resources: ResourceCardData[];
  isLoading: boolean;
  downloadingIds: Set<string>;
  savedResources: Set<string>;
  onDownload: (e: React.MouseEvent, id: string) => void;
  onSave: (e: React.MouseEvent, id: string) => void;
  onPreview: (e: React.MouseEvent, id: string) => void;
  onResetFilters: () => void;
}

export function ResourcesFilteredGrid({
  resources,
  isLoading,
  downloadingIds,
  savedResources,
  onDownload,
  onSave,
  onPreview,
  onResetFilters,
}: ResourcesFilteredGridProps) {
  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-muted-foreground">
          {resources.length}{" "}
          {resources.length > 1 ? "ressources trouvées" : "ressource trouvée"}
        </span>
      </div>

      {isLoading ? (
        <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <ResourceSkeleton key={i} />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucune ressource trouvée"
          description="Essayez d'ajuster vos filtres ou effectuez une recherche avec d'autres termes."
          actionLabel="Tout réinitialiser"
          onAction={onResetFilters}
        />
      ) : (
        <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              isDownloading={downloadingIds.has(String(resource.id))}
              isSaved={savedResources.has(String(resource.id))}
              onDownload={(e) => onDownload(e, String(resource.id))}
              onSave={(e) => onSave(e, String(resource.id))}
              onPreview={(e) => onPreview(e, String(resource.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
