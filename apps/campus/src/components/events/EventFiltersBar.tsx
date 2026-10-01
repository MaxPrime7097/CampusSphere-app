import { useState } from "react";
import {
  Calendar,
  Search,
  Filter,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_CATEGORY_OPTIONS } from "@/constants/eventCategories";
import { cn } from "@/lib/utils";
import type { EventFilters } from "@/types/events.types";

interface EventFiltersBarProps {
  filters: EventFilters;
  onFilterChange: (newFilters: Partial<EventFilters>) => void;
  onReset?: () => void;
  onCreateClick?: () => void;
  totalCount?: number;
}

export function EventFiltersBar({
  filters,
  onFilterChange,
  onReset,
}: EventFiltersBarProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const activeCategory = filters.category || "all";
  const activeTimeframe = filters.timeframe || "all";
  const hasActiveFilters =
    (filters.category && filters.category !== "all") ||
    (filters.timeframe && filters.timeframe !== "all") ||
    Boolean(filters.search);

  return (
    <div className="space-y-3">
      {/* Top Search & Actions Row */}
      <div className="flex items-center gap-2">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un événement, Welcome Week, MathScam, amphi..."
            value={filters.search || ""}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="pl-10 pr-9 rounded-xl bg-card border-border/80 text-xs focus-visible:ring-primary shadow-xs h-10"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Mobile Filter Toggle Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowMobileFilters((v) => !v)}
          className={cn(
            "sm:hidden h-10 w-10 rounded-xl shrink-0 border-border/80",
            showMobileFilters || activeTimeframe !== "all" ? "border-primary text-primary bg-primary/5" : ""
          )}
          title="Filtres"
        >
          <Filter className="h-4 w-4" />
        </Button>

        {/* Desktop Timeframe Select & Reset */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <Select
            value={activeTimeframe}
            onValueChange={(val) => onFilterChange({ timeframe: val as any })}
          >
            <SelectTrigger className="w-[160px] h-10 rounded-xl bg-card border-border/80 text-xs">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Toutes dates</SelectItem>
              <SelectItem value="today" className="text-xs">Aujourd'hui</SelectItem>
              <SelectItem value="this_week" className="text-xs">Cette semaine</SelectItem>
              <SelectItem value="this_month" className="text-xs">Ce mois-ci</SelectItem>
              <SelectItem value="past" className="text-xs">Passés</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-xs text-muted-foreground hover:text-foreground h-10"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Collapsible Filters */}
      {showMobileFilters && (
        <div className="flex items-center gap-2 sm:hidden animate-in fade-in duration-200">
          <Select
            value={activeTimeframe}
            onValueChange={(val) => onFilterChange({ timeframe: val as any })}
          >
            <SelectTrigger className="w-full h-10 rounded-xl bg-card border-border/80 text-xs">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Toutes dates</SelectItem>
              <SelectItem value="today" className="text-xs">Aujourd'hui</SelectItem>
              <SelectItem value="this_week" className="text-xs">Cette semaine</SelectItem>
              <SelectItem value="this_month" className="text-xs">Ce mois-ci</SelectItem>
              <SelectItem value="past" className="text-xs">Passés</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-xs text-muted-foreground hover:text-foreground shrink-0 h-10"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Effacer
            </Button>
          )}
        </div>
      )}

      {/* Category Pills List (Sans barre de défilement visible) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {EVENT_CATEGORY_OPTIONS.map((cat) => {
          const isSelected = activeCategory === cat.value;

          return (
            <button
              key={cat.value}
              onClick={() => onFilterChange({ category: isSelected ? "all" : cat.value })}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer",
                isSelected
                  ? "bg-primary/15 text-primary border border-primary/30 shadow-xs font-semibold"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
              )}
            >
              <span>{cat.shortLabel || cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
