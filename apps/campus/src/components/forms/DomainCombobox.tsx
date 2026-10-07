import { ACADEMIC_DOMAINS } from "@/constants/academicData";
import { Combobox } from "@/components/ui/combobox";

interface DomainComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const domainOptions = ACADEMIC_DOMAINS.map((domain) => ({
  value: domain.id,
  label: `${domain.icon} ${domain.label}`,
}));

export function DomainCombobox({
  value,
  onValueChange,
  placeholder = "Sélectionner votre domaine d'études",
  className,
  disabled = false,
}: DomainComboboxProps) {
  return (
    <Combobox
      options={domainOptions}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder="Rechercher un domaine (ex: Tech, Santé, Droit...)"
      emptyMessage="Aucun domaine trouvé."
      className={className}
      disabled={disabled}
    />
  );
}
