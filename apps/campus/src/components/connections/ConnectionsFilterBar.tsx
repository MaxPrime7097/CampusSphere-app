import { MagnifyingGlass as Search, Funnel as Filter } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ConnectionFilter } from "./types";

interface ConnectionsFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeFilter: ConnectionFilter;
  onFilterChange: (value: ConnectionFilter) => void;
  showMobileFilters: boolean;
  onToggleMobileFilters: () => void;
}

export function ConnectionsFilterBar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  showMobileFilters,
  onToggleMobileFilters,
}: ConnectionsFilterBarProps) {
  return (
    <div className="mb-6">
      {/* Mobile */}
      <div className="flex gap-2 sm:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des connexions..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleMobileFilters}
          className={showMobileFilters ? "border-primary text-primary" : ""}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>
      {showMobileFilters && (
        <div className="mt-2 sm:hidden">
          <Select value={activeFilter} onValueChange={(v) => onFilterChange(v as ConnectionFilter)}>
            <SelectTrigger><SelectValue placeholder="Filtrer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="university">Université</SelectItem>
              <SelectItem value="faculty">Filière</SelectItem>
              <SelectItem value="mutual">Amis communs</SelectItem>
              <SelectItem value="impact">Impact</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {/* Desktop */}
      <div className="hidden sm:flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des connexions..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Select value={activeFilter} onValueChange={(v) => onFilterChange(v as ConnectionFilter)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Filtrer" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="university">Université</SelectItem>
            <SelectItem value="faculty">Filière</SelectItem>
            <SelectItem value="mutual">Amis communs</SelectItem>
            <SelectItem value="impact">Impact</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
