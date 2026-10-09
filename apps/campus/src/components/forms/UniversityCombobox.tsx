import { Combobox } from "@/components/ui/combobox"

interface UniversityComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export interface UniversityItem {
  value: string
  label: string
}

export const CAMEROON_PRIVATE_UNIVERSITIES: UniversityItem[] = [
  { value: "iuc", label: "Institut Universitaire de la Côte (IUC)" },
  { value: "iug", label: "Institut Universitaire du Golfe de Guinée (IUG)" },
  { value: "saint_jerome", label: "Institut Catholique Saint Jérôme de Douala" },
  { value: "ucac", label: "Université Catholique d'Afrique Centrale (UCAC)" },
  { value: "siantou", label: "Institut Universitaire Siantou (IUS)" },
  { value: "ict_university", label: "ICT University" },
  { value: "isj", label: "Institut Saint Jean (ISJ)" },
  { value: "isma", label: "Institut Supérieur de Management (ISMA)" },
  { value: "jfn", label: "JFN University / JFN Center" },
  { value: "istag", label: "Institut Supérieur de Technologie Appliquée et de Gestion (ISTAG)" },
  { value: "pigier", label: "Pigier Cameroun" },
  { value: "other", label: "Autre établissement" },
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
      options={CAMEROON_PRIVATE_UNIVERSITIES}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder="Rechercher une université ou un institut..."
      emptyMessage="Aucun établissement trouvé."
      className={className}
      disabled={disabled}
    />
  )
}
