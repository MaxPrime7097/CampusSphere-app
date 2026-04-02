import { RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { ReactNode } from "react";

interface SharedFilterSortBarProps {
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  searchPlaceholder?: string;
  controls?: ReactNode;
  hasActiveFilters: boolean;
  onReset: () => void;
  className?: string;
}

export function SharedFilterSortBar({
  searchValue,
  onSearchValueChange,
  searchPlaceholder = "Rechercher...",
  controls,
  hasActiveFilters,
  onReset,
  className,
}: SharedFilterSortBarProps) {
  return (
    <Card className={cn("campus-card", className)}>
      <CardContent className="space-y-3 p-3 md:p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(event) => onSearchValueChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="pl-10"
            />
          </div>
          {controls}
        </div>

        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="gap-2"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Réinitialiser
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
