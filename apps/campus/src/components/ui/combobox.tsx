import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  options: { value: string; label: string }[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
  allowCustomValue?: boolean
  onSearchValueChange?: (value: string) => void
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucun résultat trouvé.",
  className,
  disabled = false,
  allowCustomValue = false,
  onSearchValueChange,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const selectedOption = options.find((option) => option.value === value)
  const displayValue = selectedOption ? selectedOption.label : (allowCustomValue && value ? value : "")

  const handleSelect = (currentValue: string) => {
    onValueChange?.(currentValue === value ? "" : currentValue)
    setOpen(false)
    setSearchValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && allowCustomValue && searchValue.trim()) {
      e.preventDefault()
      onValueChange?.(searchValue.trim())
      setOpen(false)
      setSearchValue("")
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between min-w-0 whitespace-normal break-words text-left", className)}
          disabled={disabled}
        >
          {displayValue || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[240px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={searchValue}
            onValueChange={(v) => {
              setSearchValue(v);
              onSearchValueChange?.(v);
            }}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            <CommandEmpty>
              {allowCustomValue && searchValue.trim() ? (
                <div className="p-2">
                  <div className="text-sm text-muted-foreground mb-2">{emptyMessage}</div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={() => handleSelect(searchValue.trim())}
                  >
                    Ajouter "{searchValue.trim()}"
                  </Button>
                </div>
              ) : (
                emptyMessage
              )}
            </CommandEmpty>
            <CommandGroup>
              {allowCustomValue && searchValue.trim() && !options.some(o => o.label.toLowerCase() === searchValue.trim().toLowerCase()) && (
                <CommandItem
                  value={searchValue.trim()}
                  onSelect={() => handleSelect(searchValue.trim())}
                  className="text-primary font-medium border-b border-border/50 mb-1"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter "{searchValue.trim()}"
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
