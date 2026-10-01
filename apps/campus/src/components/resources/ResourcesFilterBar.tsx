import {
  Search,
  X,
  Filter,
  Layers,
  BookOpen,
  FileText,
  FileSpreadsheet,
  GraduationCap,
  Archive,
  FolderGit2,
  Presentation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const RESOURCE_CHIPS = [
  { value: "all", label: "Toutes les ressources", icon: Layers },
  { value: "notes", label: "Notes de cours", icon: BookOpen },
  { value: "resumes", label: "Résumés & Fiches", icon: FileText },
  { value: "exercises", label: "Exercices & TD", icon: FileSpreadsheet },
  { value: "exam_papers", label: "Épreuves d'examen", icon: GraduationCap },
  { value: "annales", label: "Annales corrigées", icon: Archive },
  { value: "projects", label: "Projets & Rapports", icon: FolderGit2 },
  { value: "presentations", label: "Présentations / Slides", icon: Presentation },
] as const;

export const FILE_FORMATS = [
  { value: "all", label: "Tous les formats" },
  { value: "pdf", label: "Documents PDF" },
  { value: "doc", label: "Word (.docx)" },
  { value: "image", label: "Images" },
] as const;

interface ResourcesFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedType: string;
  onSelectType: (value: string) => void;
  selectedFileFormat: string;
  onSelectFileFormat: (value: string) => void;
  showMobileFilters: boolean;
  onToggleMobileFilters: () => void;
  isFiltering: boolean;
  onResetFilters: () => void;
}

export function ResourcesFilterBar({
  searchTerm,
  onSearchChange,
  selectedType,
  onSelectType,
  selectedFileFormat,
  onSelectFileFormat,
  showMobileFilters,
  onToggleMobileFilters,
  isFiltering,
  onResetFilters,
}: ResourcesFilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Top Row: Search Input + Format Select */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par matière, mot-clé, cours ou auteur..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-9 text-xs rounded-xl h-10 border-border/80 bg-card focus-visible:ring-primary shadow-xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Mobile Filter Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleMobileFilters}
          className={cn(
            "sm:hidden h-10 w-10 rounded-xl shrink-0 border-border/80",
            showMobileFilters || selectedFileFormat !== "all"
              ? "border-primary text-primary bg-primary/5"
              : ""
          )}
          title="Filtres"
        >
          <Filter className="h-4 w-4" />
        </Button>

        {/* Desktop Format Select */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <Select value={selectedFileFormat} onValueChange={onSelectFileFormat}>
            <SelectTrigger className="w-52 h-10 rounded-xl text-xs border-border/80 bg-card">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              {FILE_FORMATS.map((f) => (
                <SelectItem key={f.value} value={f.value} className="text-xs">
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isFiltering && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="rounded-xl text-xs h-10 text-muted-foreground hover:text-foreground"
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
          <Select value={selectedFileFormat} onValueChange={onSelectFileFormat}>
            <SelectTrigger className="w-full h-10 rounded-xl text-xs border-border/80 bg-card">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              {FILE_FORMATS.map((f) => (
                <SelectItem key={f.value} value={f.value} className="text-xs">
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isFiltering && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="text-xs text-muted-foreground hover:text-foreground shrink-0 h-10"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Effacer
            </Button>
          )}
        </div>
      )}

      {/* Bottom Row: Horizontal Type Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pt-1 border-t border-border/40">
        {RESOURCE_CHIPS.map((chip) => {
          const isSelected = selectedType === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => onSelectType(chip.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer",
                isSelected
                  ? "bg-primary/15 text-primary border border-primary/30 shadow-xs font-semibold"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
              )}
            >
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
