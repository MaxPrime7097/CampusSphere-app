import { Combobox } from "@/components/ui/combobox"

interface StudyLevelComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const studyLevels = [
  { value: "bts1", label: "BTS 1/HND 1" },
  { value: "bts2", label: "BTS 2/HND 2" },
  { value: "l1", label: "Licence 1/Bachelor 1" },
  { value: "l2", label: "Licence 2/Bachelor 2" },
  { value: "l3", label: "Licence 3/Bachelor 3" },
  { value: "l4", label: "Licence 4/Bachelor 4" },
  { value: "m1", label: "Master 1" },
  { value: "m2", label: "Master 2" },
  { value: "d1", label: "Doctorat 1/PhD 1" },
  { value: "d2", label: "Doctorat 2/PhD 2" },
  { value: "d3", label: "Doctorat 3/PhD 3" },
  { value: "other", label: "Autre niveau" }
]

export function StudyLevelCombobox({
  value,
  onValueChange,
  placeholder = "Sélectionner votre niveau",
  className,
  disabled = false,
}: StudyLevelComboboxProps) {
  return (
    <Combobox
      options={studyLevels}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder="Rechercher un niveau..."
      emptyMessage="Aucun niveau trouvé."
      className={className}
      disabled={disabled}
    />
  )
}
