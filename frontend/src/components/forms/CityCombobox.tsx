import { Combobox } from "@/components/ui/combobox"

interface CityComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const cities = [
  { value: "douala", label: "Douala" },
]

export function CityCombobox({
  value,
  onValueChange,
  placeholder = "Sélectionner votre ville",
  className,
  disabled = false,
}: CityComboboxProps) {
  return (
    <Combobox
      options={cities}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder="Rechercher une ville..."
      emptyMessage="Aucune ville trouvée."
      className={className}
      disabled={disabled}
    />
  )
}
