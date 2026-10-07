"use client";

import * as React from "react";
import { Check, CaretUpDown as ChevronsUpDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ACADEMIC_DOMAINS,
  getDomainById,
  getDomainForFaculty,
  getFacultyBilingualLabel,
  AcademicDomain,
} from "@/constants/academicData";

export interface FacultyComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  domain?: string;
  onDomainChange?: (domainId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function FacultyCombobox({
  value,
  onValueChange,
  domain,
  onDomainChange,
  placeholder = "Sélectionner votre filière",
  className,
  disabled = false,
}: FacultyComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // Si un domaine est spécifié, on cible ce domaine, sinon on affiche tous les domaines
  const activeDomain: AcademicDomain | undefined = React.useMemo(() => {
    if (domain) return getDomainById(domain);
    if (value) {
      const derivedDomainId = getDomainForFaculty(value);
      if (derivedDomainId) return getDomainById(derivedDomainId);
    }
    return undefined;
  }, [domain, value]);

  // Récupérer le label d'affichage de la filière sélectionnée
  const selectedLabel = React.useMemo(() => {
    if (!value) return undefined;
    return getFacultyBilingualLabel(value);
  }, [value]);

  const displayedDomains = React.useMemo(() => {
    if (activeDomain) {
      return [activeDomain];
    }
    return ACADEMIC_DOMAINS;
  }, [activeDomain]);

  const handleSelect = (facultyValue: string, domainId: string) => {
    onValueChange?.(facultyValue);
    if (onDomainChange) {
      onDomainChange(domainId);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-w-0 whitespace-normal break-words text-left font-normal",
            !selectedLabel && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <span className="truncate">{selectedLabel ?? placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] min-w-[280px] sm:min-w-[340px] p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Rechercher / Search (ex: Software, Droit, Nursing...)"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>Aucune filière trouvée / No field found.</CommandEmpty>

            {displayedDomains.map((dom) => (
              <CommandGroup
                key={dom.id}
                heading={`${dom.icon} ${dom.label}`}
              >
                {dom.faculties.map((fac) => {
                  const isSelected = value?.toLowerCase() === fac.value.toLowerCase();
                  // Richesse de recherche cmdk : inclut français, anglais, mots-clés et slug
                  const searchPayload = `${fac.label} ${fac.labelFr} ${fac.labelEn} ${fac.keywords || ""} ${fac.value}`.toLowerCase();

                  return (
                    <CommandItem
                      key={fac.value}
                      value={searchPayload}
                      onSelect={() => handleSelect(fac.value, dom.id)}
                      className="cursor-pointer py-2"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0 text-primary",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-foreground text-sm leading-tight">
                          {fac.label}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}