import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  MagnifyingGlass as Search,
  X,
  Funnel as Filter,
  Stack as Layers,
  BookOpen,
  GraduationCap,
  FolderSimple as FolderGit2,
  BookBookmark,
  Notepad,
  Question as QuestionMark,
} from "@phosphor-icons/react";
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

export const RESOURCE_CHIP_DEFS = [
  { value: "all",          icon: Layers },
  { value: "course_notes", icon: BookOpen },
  { value: "td_tp",        icon: Notepad },
  { value: "exams",        icon: GraduationCap },
  { value: "project",      icon: FolderGit2 },
  { value: "book",         icon: BookBookmark },
  { value: "other",        icon: QuestionMark },
] as const;

export const FILE_FORMAT_DEFS = [
  { value: "all" },
  { value: "pdf" },
  { value: "doc" },
  { value: "image" },
] as const;

// Backward compatibility export
export const RESOURCE_CHIPS = [
  { value: "all",          label: "Toutes",             icon: Layers },
  { value: "course_notes", label: "Cours",              icon: BookOpen },
  { value: "td_tp",        label: "TD / TP",            icon: Notepad },
  { value: "exams",        label: "Anciennes épreuves", icon: GraduationCap },
  { value: "project",      label: "Projet",             icon: FolderGit2 },
  { value: "book",         label: "Livre",              icon: BookBookmark },
  { value: "other",        label: "Autre",              icon: QuestionMark },
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
  const { t } = useTranslation("resources");

  const chips = useMemo(
    () =>
      RESOURCE_CHIP_DEFS.map((c) => ({
        ...c,
        label: t(`page.chips.${c.value}` as any, { defaultValue: c.value }),
      })),
    [t]
  );

  const fileFormats = useMemo(
    () =>
      FILE_FORMAT_DEFS.map((f) => ({
        ...f,
        label: t(`page.formats.${f.value}` as any, { defaultValue: f.value }),
      })),
    [t]
  );

  return (
    <div className="space-y-3">
      {/* Top Row: Search Input + Format Select */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("page.searchPlaceholder")}
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
          title={t("page.filters")}
        >
          <Filter className="h-4 w-4" />
        </Button>

        {/* Desktop Format Select */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <Select value={selectedFileFormat} onValueChange={onSelectFileFormat}>
            <SelectTrigger className="w-52 h-10 rounded-xl text-xs border-border/80 bg-card">
              <SelectValue placeholder={t("page.formatPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {fileFormats.map((f) => (
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
              {t("page.reset")}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Collapsible Filters */}
      {showMobileFilters && (
        <div className="flex items-center gap-2 sm:hidden animate-in fade-in duration-200">
          <Select value={selectedFileFormat} onValueChange={onSelectFileFormat}>
            <SelectTrigger className="w-full h-10 rounded-xl text-xs border-border/80 bg-card">
              <SelectValue placeholder={t("page.formatPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {fileFormats.map((f) => (
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
              {t("page.clear")}
            </Button>
          )}
        </div>
      )}

      {/* Bottom Row: Horizontal Type Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pt-1 border-t border-border/40">
        {chips.map((chip) => {
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
