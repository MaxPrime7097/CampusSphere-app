import { Combobox } from "@/components/ui/combobox";

interface CompanyComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const companies = [
  // CampusSphere et AgriGuard en premier 😄
  { value: "campussphere", label: "CampusSphere" },
  { value: "agriguard", label: "AgriGuard" },
  
  // Grandes entreprises camerounaises
  { value: "mtn_cameroon", label: "MTN Cameroon" },
  { value: "orange_cameroon", label: "Orange Cameroun" },
  { value: "camtel", label: "CAMTEL" },
  { value: "eneo", label: "ENEO" },
  { value: "sonara", label: "SONARA" },
  { value: "camwater", label: "CAMWATER" },
  { value: "campost", label: "CAMPOST" },
  { value: "cdc", label: "CDC (Cameroon Development Corporation)" },
  { value: "socapalm", label: "SOCAPALM" },
  { value: "alucam", label: "ALUCAM" },
  
  // Banques
  { value: "afriland_first_bank", label: "Afriland First Bank" },
  { value: "bicec", label: "BICEC" },
  { value: "sgbc", label: "SGBC" },
  { value: "uba_cameroon", label: "UBA Cameroun" },
  { value: "ecobank", label: "Ecobank" },
  { value: "commercial_bank", label: "Commercial Bank of Cameroon" },
  
  // Secteur pétrolier
  { value: "total_cameroon", label: "Total Cameroun" },
  { value: "shell_cameroon", label: "Shell Cameroun" },
  { value: "perenco", label: "Perenco" },
  
  // Technologie
  { value: "nexttel", label: "Nexttel" },
  { value: "camtel_mobile", label: "Camtel Mobile" },
  { value: "it_news_africa", label: "IT News Africa" },
  
  // Secteur public
  { value: "ministere_education", label: "Ministère de l'Éducation" },
  { value: "ministere_sante", label: "Ministère de la Santé" },
  { value: "primature", label: "Services du Premier Ministre" },
  { value: "mairie_yaounde", label: "Mairie de Yaoundé" },
  { value: "mairie_douala", label: "Mairie de Douala" },
  
  // Organisations internationales
  { value: "onu_cameroun", label: "ONU Cameroun" },
  { value: "banque_mondiale", label: "Banque Mondiale" },
  { value: "unicef", label: "UNICEF" },
  { value: "unesco", label: "UNESCO" },
  
  // Startups et PME
  { value: "startup", label: "Startup" },
  { value: "pme", label: "PME" },
  { value: "ong", label: "ONG" },
  { value: "freelance", label: "Freelance" },
  { value: "autre", label: "Autre entreprise" }
];

export function CompanyCombobox({
  value,
  onValueChange,
  placeholder = "Sélectionner une entreprise",
  className,
  disabled = false,
}: CompanyComboboxProps) {
  return (
    <Combobox
      options={companies}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder="Rechercher une entreprise..."
      emptyMessage="Aucune entreprise trouvée."
      className={className}
      disabled={disabled}
      allowCustomValue={true}
    />
  );
}