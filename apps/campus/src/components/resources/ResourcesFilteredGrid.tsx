import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, GridFour as LayoutGrid, List } from "@phosphor-icons/react";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { ResourceTile } from "@/components/resources/ResourceTile";
import { ResourceSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
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
  viewMode: controlledViewMode,
  onViewModeChange,
}: ResourcesFilteredGridProps) {
  const { t } = useTranslation("resources");
  const [internalViewMode, setInternalViewMode] = useState<"grid" | "list">("grid");
  const viewMode = controlledViewMode ?? internalViewMode;

  const handleToggle = (mode: "grid" | "list") => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    } else {
      setInternalViewMode(mode);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Header with counter and Grid / List Switcher */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-muted-foreground">
          {resources.length > 1
            ? t("page.found_other", { count: resources.length })
            : t("page.found_one", { count: resources.length })}
        </span>

        <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/40">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2.5 rounded-md text-xs gap-1.5 transition-all",
              viewMode === "grid"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => handleToggle("grid")}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("page.grid")}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2.5 rounded-md text-xs gap-1.5 transition-all",
              viewMode === "list"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => handleToggle("list")}
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("page.list")}</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 min-[440px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 animate-pulse">
                <div className="aspect-[4/3] w-full rounded-2xl bg-muted/60" />
                <div className="space-y-1.5 pt-1">
                  <div className="h-3.5 w-3/4 bg-muted/60 rounded" />
                  <div className="h-3 w-1/2 bg-muted/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col">
            {Array.from({ length: 8 }).map((_, i) => (
              <ResourceSkeleton key={i} />
            ))}
          </div>
        )
      ) : resources.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t("page.emptyTitle")}
          description={t("page.emptyDesc")}
          actionLabel={t("page.emptyReset")}
          onAction={onResetFilters}
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 min-[440px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-2">
          {resources.map((resource) => (
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
