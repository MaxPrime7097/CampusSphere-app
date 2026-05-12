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
  { value: "yaounde", label: "Yaoundé" },
  { value: "garoua", label: "Garoua" },
  { value: "bamenda", label: "Bamenda" },
  { value: "maroua", label: "Maroua" },
  { value: "bafoussam", label: "Bafoussam" },
  { value: "ngaoundere", label: "Ngaoundéré" },
  { value: "bertoua", label: "Bertoua" },
  { value: "ebolowa", label: "Ebolowa" },
  { value: "buea", label: "Buea" },
  { value: "dschang", label: "Dschang" },
  { value: "kribi", label: "Kribi" },
  { value: "limbe", label: "Limbe" },
  { value: "foumban", label: "Foumban" },
  { value: "nkongsamba", label: "Nkongsamba" },
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
