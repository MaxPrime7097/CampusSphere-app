import { Button } from "@/components/ui/button";
import { NetflixCarousel } from "@/components/ui/netflix-carousel";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { ResourceSkeleton } from "@/components/ui/skeletons";
import { RESOURCE_TYPE_OPTIONS } from "@/constants/resourceTypes";
import type { ResourceCardData } from "@/types";

interface ResourcesCategoryCarouselsProps {
  resources: ResourceCardData[];
  isLoading: boolean;
  viewAllCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  downloadingIds: Set<string>;
  savedResources: Set<string>;
  onDownload: (e: React.MouseEvent, id: string) => void;
  onSave: (e: React.MouseEvent, id: string) => void;
  onPreview: (e: React.MouseEvent, id: string) => void;
}

export function ResourcesCategoryCarousels({
  resources,
  isLoading,
  viewAllCategory,
  onSelectCategory,
  downloadingIds,
  savedResources,
  onDownload,
  onSave,
  onPreview,
}: ResourcesCategoryCarouselsProps) {
  if (viewAllCategory) {
    const categoryResources = resources.filter((r) => r.type === viewAllCategory);
    return (
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectCategory(null)}
            className="rounded-xl text-xs"
          >
            Retour
          </Button>
          <h2 className="text-lg font-bold text-foreground capitalize">
            {RESOURCE_TYPE_OPTIONS.find((opt) => opt.value === viewAllCategory)?.label ||
              viewAllCategory}
          </h2>
        </div>
        <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {categoryResources.map((resource) => (
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
      </div>
    );
  }

  const suggestions = [...resources]
    .sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0))
    .slice(0, 10);

  return (
    <>
      {/* Suggestions Populaires */}
      {suggestions.length > 0 && !isLoading && (
        <section>
          <h2 className="text-base sm:text-lg font-bold mb-3 px-1 text-foreground">
            Ressources Recommandées & Populaires
          </h2>
          <NetflixCarousel className="gap-3 pb-1">
            {suggestions.map((resource) => (
              <div key={resource.id} className="cs-scroll-item w-[160px] sm:w-[185px] md:w-[200px]">
                <ResourceCard
                  resource={resource}
                  isDownloading={downloadingIds.has(String(resource.id))}
                  isSaved={savedResources.has(String(resource.id))}
                  onDownload={(e) => onDownload(e, String(resource.id))}
                  onSave={(e) => onSave(e, String(resource.id))}
                  onPreview={(e) => onPreview(e, String(resource.id))}
                />
              </div>
            ))}
          </NetflixCarousel>
        </section>
      )}

      {/* Par Catégorie / Type */}
      {RESOURCE_TYPE_OPTIONS.map((opt) => {
        const categoryResources = resources.filter((r) => r.type === opt.value);
        if (categoryResources.length === 0 && !isLoading) return null;

        return (
          <section key={opt.value}>
            <div className="flex justify-between items-center mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-foreground">{opt.label}</h2>
              {categoryResources.length > 4 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground font-semibold"
                  onClick={() => onSelectCategory(opt.value)}
                >
                  Voir tout ({categoryResources.length})
                </Button>
              )}
            </div>
            <NetflixCarousel className="gap-3 pb-1">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="cs-scroll-item w-[160px] sm:w-[185px] md:w-[200px]">
                    <ResourceSkeleton />
                  </div>
                ))
              ) : (
                categoryResources.map((resource) => (
                  <div key={resource.id} className="cs-scroll-item w-[160px] sm:w-[185px] md:w-[200px]">
                    <ResourceCard
                      resource={resource}
                      isDownloading={downloadingIds.has(String(resource.id))}
                      isSaved={savedResources.has(String(resource.id))}
                      onDownload={(e) => onDownload(e, String(resource.id))}
                      onSave={(e) => onSave(e, String(resource.id))}
                      onPreview={(e) => onPreview(e, String(resource.id))}
                    />
                  </div>
                ))
              )}
            </NetflixCarousel>
          </section>
        );
      })}
    </>
  );
}
