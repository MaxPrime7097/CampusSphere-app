import { Combobox } from "@/components/ui/combobox";

interface DegreeComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const degrees = [
  { value: "gce_a", label: "GCE A Level" },
  { value: "gce_o", label: "GCE O Level" },
  { value: "bac", label: "Baccalauréat" },
  { value: "probatoire", label: "Probatoire" },
  { value: "bepc", label: "BEPC" },
  { value: "bts", label: "BTS" },
  { value: "hnd", label: "HND" },
  { value: "licence", label: "Licence" },
  { value: "bachelor", label: "Bachelor" },
  { value: "master", label: "Master" },
  { value: "mba", label: "MBA" },
  { value: "doctorat", label: "Doctorat" },
  { value: "phd", label: "PhD" },
  { value: "cap", label: "CAP" },
  { value: "bep", label: "BEP" },
  { value: "deug", label: "DEUG" },
  { value: "dut", label: "DUT" },
  { value: "dess", label: "DESS" },
  { value: "dea", label: "DEA" },
  { value: "ingenieur", label: "Diplôme d'Ingénieur" },
  { value: "medecine", label: "Diplôme de Médecine" },
  { value: "pharmacie", label: "Diplôme de Pharmacie" },
  { value: "veterinaire", label: "Diplôme Vétérinaire" },
  { value: "architecture", label: "Diplôme d'Architecture" },
  { value: "autre", label: "Autre diplôme" }
];

export function DegreeCombobox({
  value,
  onValueChange,
  placeholder = "Sélectionner un diplôme",
  className,
  disabled = false,
}: DegreeComboboxProps) {
  return (
    <Combobox
      options={degrees}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder="Rechercher un diplôme..."
      emptyMessage="Aucun diplôme trouvé."
      className={className}
      disabled={disabled}
      allowCustomValue={true}
    />
  );
}