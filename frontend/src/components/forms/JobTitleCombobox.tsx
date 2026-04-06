import { Combobox } from "@/components/ui/combobox";

interface JobTitleComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const jobTitles = [
  // Informatique & Tech
  { value: "developpeur_web", label: "Développeur Web" },
  { value: "developpeur_mobile", label: "Développeur Mobile" },
  { value: "developpeur_fullstack", label: "Développeur Full Stack" },
  { value: "data_scientist", label: "Data Scientist" },
  { value: "analyste_donnees", label: "Analyste de Données" },
  { value: "administrateur_systeme", label: "Administrateur Système" },
  { value: "ingenieur_logiciel", label: "Ingénieur Logiciel" },
  { value: "chef_projet_it", label: "Chef de Projet IT" },
  { value: "consultant_it", label: "Consultant IT" },
  { value: "technicien_informatique", label: "Technicien Informatique" },
  
  // Marketing & Communication
  { value: "charge_marketing", label: "Chargé de Marketing" },
  { value: "community_manager", label: "Community Manager" },
  { value: "charge_communication", label: "Chargé de Communication" },
  { value: "graphiste", label: "Graphiste" },
  { value: "redacteur_web", label: "Rédacteur Web" },
  
  // Finance & Comptabilité
  { value: "comptable", label: "Comptable" },
  { value: "auditeur", label: "Auditeur" },
  { value: "analyste_financier", label: "Analyste Financier" },
  { value: "controleur_gestion", label: "Contrôleur de Gestion" },
  { value: "charge_clientele", label: "Chargé de Clientèle" },
  
  // Ressources Humaines
  { value: "charge_rh", label: "Chargé des Ressources Humaines" },
  { value: "recruteur", label: "Recruteur" },
  { value: "responsable_formation", label: "Responsable Formation" },
  
  // Vente & Commercial
  { value: "commercial", label: "Commercial" },
  { value: "charge_affaires", label: "Chargé d'Affaires" },
  { value: "responsable_ventes", label: "Responsable des Ventes" },
  { value: "vendeur", label: "Vendeur" },
  
  // Éducation
  { value: "enseignant", label: "Enseignant" },
  { value: "professeur", label: "Professeur" },
  { value: "formateur", label: "Formateur" },
  { value: "repetiteur", label: "Répétiteur" },
  
  // Santé
  { value: "medecin", label: "Médecin" },
  { value: "infirmier", label: "Infirmier" },
  { value: "pharmacien", label: "Pharmacien" },
  { value: "aide_soignant", label: "Aide-Soignant" },
  
  // Ingénierie
  { value: "ingenieur_civil", label: "Ingénieur Civil" },
  { value: "ingenieur_mecanique", label: "Ingénieur Mécanique" },
  { value: "ingenieur_electrique", label: "Ingénieur Électrique" },
  { value: "architecte", label: "Architecte" },
  { value: "technicien", label: "Technicien" },
  
  // Autres
  { value: "stagiaire", label: "Stagiaire" },
  { value: "assistant", label: "Assistant" },
  { value: "secretaire", label: "Secrétaire" },
  { value: "receptionniste", label: "Réceptionniste" },
  { value: "chauffeur", label: "Chauffeur" },
  { value: "agent_securite", label: "Agent de Sécurité" },
  { value: "autre", label: "Autre poste" }
];

export function JobTitleCombobox({
  value,
  onValueChange,
  placeholder = "Sélectionner un poste",
  className,
  disabled = false,
}: JobTitleComboboxProps) {
  return (
    <Combobox
      options={jobTitles}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder="Rechercher un poste..."
      emptyMessage="Aucun poste trouvé."
      className={className}
      disabled={disabled}
      allowCustomValue={true}
    />
  );
}