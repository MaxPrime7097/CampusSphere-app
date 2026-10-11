import { useTranslation } from "react-i18next";
import { FileText } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { ResourceTile } from "@/components/resources/ResourceTile";
import { ResourceSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { RESOURCE_TYPE_OPTIONS } from "@/constants/resourceTypes";
import type { ResourceCardData } from "@/types";

const MAX_CAROUSEL_ITEMS = 15;
const MAX_CAROUSEL_LIST_ITEMS = 8;
const MAX_SUGGESTIONS_ITEMS = 12;

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
  viewMode?: "grid" | "list";
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
  viewMode = "grid",
}: ResourcesCategoryCarouselsProps) {
  const { t } = useTranslation("resources");

  // If user selected "Voir tout" on a category
  if (viewAllCategory) {
    const categoryResources =
      viewAllCategory === "all"
        ? resources
        : resources.filter((r) => r.type === viewAllCategory);

    const categoryTitle =
      viewAllCategory === "all"
        ? t("carousels.allResources")
        : t(`page.chips.${viewAllCategory}` as any, {
            defaultValue:
              RESOURCE_TYPE_OPTIONS.find((opt) => opt.value === viewAllCategory)?.label ||
              viewAllCategory,
          });

    return (
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3 pb-2 border-b border-border/40">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectCategory(null)}
            className="rounded-lg text-xs h-7 px-2.5"
          >
            {t("carousels.back")}
          </Button>
          <h2 className="text-base sm:text-lg font-bold text-foreground capitalize">
            {categoryTitle}
          </h2>
          <span className="text-xs text-muted-foreground">({categoryResources.length})</span>
        </div>

        {categoryResources.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t("page.emptyTitle")}
            description={t("page.emptyDesc")}
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 min-[440px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-2">
            {categoryResources.map((resource) => (
              <ResourceTile
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
        ) : (
          <div className="flex flex-col">
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
        )}
      </div>
    );
  }

  const suggestions = [...resources]
    .sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0))
    .slice(0, MAX_SUGGESTIONS_ITEMS);

  return (
    <div className="space-y-8">
      {/* Suggestions Populaires */}
      {suggestions.length > 0 && !isLoading && (
        <section className="space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-border/40 px-1">
            <h2 className="text-sm font-semibold tracking-wide text-foreground">
              {t("carousels.recommended")}
            </h2>
            {resources.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground font-medium h-7 px-2"
                onClick={() => onSelectCategory("all")}
              >
                {t("carousels.viewAllCount", { count: resources.length })}
              </Button>
            )}
          </div>

          {viewMode === "grid" ? (
            <div
              className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {suggestions.map((resource) => (
                <div
                  key={resource.id}
                  className="w-[200px] sm:w-[220px] md:w-[235px] shrink-0 snap-start"
                >
                  <ResourceTile
                    resource={resource}
                    isDownloading={downloadingIds.has(String(resource.id))}
                    isSaved={savedResources.has(String(resource.id))}
                    onDownload={(e) => onDownload(e, String(resource.id))}
                    onSave={(e) => onSave(e, String(resource.id))}
                    onPreview={(e) => onPreview(e, String(resource.id))}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col">
              {suggestions.map((resource) => (
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
        </section>
      )}

      {/* Par Catégorie / Type */}
      {RESOURCE_TYPE_OPTIONS.map((opt) => {
        const categoryResources = resources.filter((r) => r.type === opt.value);
        if (categoryResources.length === 0 && !isLoading) return null;

        return (
          <section key={opt.value} className="space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-border/40 px-1">
              <h2 className="text-sm font-semibold tracking-wide text-foreground">
                {t(`page.chips.${opt.value}` as any, { defaultValue: opt.label })}
              </h2>
              {categoryResources.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground font-medium h-7 px-2"
                  onClick={() => onSelectCategory(opt.value)}
                >
                  {t("carousels.viewAllCount", { count: categoryResources.length })}
                </Button>
              )}
            </div>

            {viewMode === "grid" ? (
              <div
                className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-[200px] sm:w-[220px] md:w-[235px] shrink-0 animate-pulse flex flex-col gap-2"
                    >
                      <div className="aspect-[4/3] w-full rounded-2xl bg-muted/60" />
                      <div className="space-y-1.5 pt-1">
                        <div className="h-3.5 w-3/4 bg-muted/60 rounded" />
                        <div className="h-3 w-1/2 bg-muted/60 rounded" />
                      </div>
                    </div>
                  ))
                ) : (
                  categoryResources.slice(0, MAX_CAROUSEL_ITEMS).map((resource) => (
                    <div
                      key={resource.id}
                      className="w-[200px] sm:w-[220px] md:w-[235px] shrink-0 snap-start"
                    >
                      <ResourceTile
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
              </div>
            ) : (
              <div className="flex flex-col">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <ResourceSkeleton key={i} />
                  ))
                ) : (
                  categoryResources.slice(0, MAX_CAROUSEL_LIST_ITEMS).map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      isDownloading={downloadingIds.has(String(resource.id))}
                      isSaved={savedResources.has(String(resource.id))}
                      onDownload={(e) => onDownload(e, String(resource.id))}
                      onSave={(e) => onSave(e, String(resource.id))}
                      onPreview={(e) => onPreview(e, String(resource.id))}
                    />
                  ))
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
