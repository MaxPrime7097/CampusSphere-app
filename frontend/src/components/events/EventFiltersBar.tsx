import {
  Calendar,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  Code,
  Mic,
  BookOpen,
  Compass,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_CATEGORY_OPTIONS } from "@/constants/eventCategories";
import type { EventFilters } from "@/types/events.types";

interface EventFiltersBarProps {
  filters: EventFilters;
  onFilterChange: (newFilters: Partial<EventFilters>) => void;
  onReset?: () => void;
  onCreateClick?: () => void;
  totalCount?: number;
}

const CategoryIconMap: Record<string, any> = {
  all: Calendar,
  party: Sparkles,
  competition: Trophy,
  hackathon: Code,
  conference: Mic,
  workshop: BookOpen,
  other: Compass,
};

export function EventFiltersBar({
  filters,
  onFilterChange,
  onReset,
  onCreateClick,
  totalCount,
}: EventFiltersBarProps) {
  const activeCategory = filters.category || "all";
  const activeTimeframe = filters.timeframe || "all";
  const hasActiveFilters =
    (filters.category && filters.category !== "all") ||
    (filters.timeframe && filters.timeframe !== "all") ||
    Boolean(filters.search);

  return (
    <div className="space-y-4">
      {/* Top Search & Actions Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un événement, Welcome Week, MathScam, amphi..."
            value={filters.search || ""}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="pl-10 pr-9 rounded-xl bg-card border-border/80 text-sm focus-visible:ring-primary shadow-xs"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters and CTA */}
        <div className="flex items-center gap-2">
          {/* Timeframe Select */}
          <Select
            value={activeTimeframe}
            onValueChange={(val) => onFilterChange({ timeframe: val as any })}
          >
            <SelectTrigger className="w-[160px] rounded-xl bg-card border-border/80 text-xs">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes dates</SelectItem>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="this_week">Cette semaine</SelectItem>
              <SelectItem value="this_month">Ce mois-ci</SelectItem>
              <SelectItem value="past">Passés</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Réinitialiser
            </Button>
          )}

          {/* Create button */}
          {onCreateClick && (
            <Button
              onClick={onCreateClick}
              size="sm"
              className="rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm ml-auto sm:ml-0"
            >
              + Créer un événement
            </Button>
          )}
        </div>
      </div>

      {/* Category Pills List */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {EVENT_CATEGORY_OPTIONS.map((cat) => {
          const isSelected = activeCategory === cat.value;
          const Icon = CategoryIconMap[cat.value] || Calendar;

          return (
            <button
              key={cat.value}
              onClick={() => onFilterChange({ category: isSelected ? "all" : cat.value })}
              className={`group flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all shrink-0 border ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]"
                  : "bg-card hover:bg-accent text-muted-foreground hover:text-foreground border-border/70"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-primary-foreground" : "text-primary"}`} />
              <span>{cat.shortLabel || cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
