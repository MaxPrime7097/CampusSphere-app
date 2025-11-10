import { Combobox } from "@/components/ui/combobox"

interface FacultyComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const faculties = [
  { value: "informatique", label: "Informatique" },
  { value: "mathematiques", label: "Mathématiques" },
  { value: "physique", label: "Physique" },
  { value: "chimie", label: "Chimie" },
  { value: "biologie", label: "Biologie" },
  { value: "economie", label: "Économie" },
  { value: "droit", label: "Droit" },
  { value: "medecine", label: "Médecine" },
  { value: "pharmacie", label: "Pharmacie" },
  { value: "ingenierie", label: "Ingénierie" },
  { value: "lettres", label: "Lettres et Sciences Humaines" },
  { value: "sciences_education", label: "Sciences de l'Éducation" },
  { value: "psychologie", label: "Psychologie" },
  { value: "sociologie", label: "Sociologie" },
  { value: "histoire", label: "Histoire" },
  { value: "geographie", label: "Géographie" },
  { value: "philosophie", label: "Philosophie" },
  { value: "langues", label: "Langues Étrangères" },
  { value: "communication", label: "Communication" },
  { value: "journalisme", label: "Journalisme" },
  { value: "art", label: "Arts" },
  { value: "musique", label: "Musique" },
  { value: "sport", label: "Sciences et Techniques des Activités Physiques et Sportives" },
  { value: "agronomie", label: "Agronomie" },
  { value: "veterinaire", label: "Médecine Vétérinaire" },
  { value: "foresterie", label: "Foresterie" },
  { value: "geologie", label: "Géologie" },
  { value: "mining", label: "Mines et Géologie" },
  { value: "other", label: "Autre filière" }
]

export function FacultyCombobox({
  value,
  onValueChange,
  placeholder = "Sélectionner votre filière",
  className,
  disabled = false,
}: FacultyComboboxProps) {
  return (
    <Combobox
      options={faculties}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder="Rechercher une filière..."
      emptyMessage="Aucune filière trouvée."
      className={className}
      disabled={disabled}
    />
  )
}
