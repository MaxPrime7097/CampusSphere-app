import { Combobox } from "@/components/ui/combobox"

interface UniversityComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const universities = [
  { value: "iuc", label: "Institut Universitaire de la Côte" },
]

export function UniversityCombobox({
  value,
  onValueChange,
  placeholder = "Sélectionner votre université",
  className,
  disabled = false,
}: UniversityComboboxProps) {
  return (
    <Combobox
      options={universities}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder="Rechercher une université..."
      emptyMessage="Aucune université trouvée."
      className={className}
      disabled={disabled}
    />
  )
}
