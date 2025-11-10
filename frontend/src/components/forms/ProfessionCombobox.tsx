import { Combobox } from "@/components/ui/combobox"

interface ProfessionComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const professions = [
  { value: "developpeur", label: "Développeur" },
  { value: "ingenieur_logiciel", label: "Ingénieur Logiciel" },
  { value: "analyste_programmeur", label: "Analyste Programmeur" },
  { value: "architecte_logiciel", label: "Architecte Logiciel" },
  { value: "devops", label: "DevOps" },
  { value: "data_scientist", label: "Data Scientist" },
  { value: "data_analyst", label: "Data Analyst" },
  { value: "cybersecurite", label: "Cybersécurité" },
  { value: "reseau", label: "Administrateur Réseau" },
  { value: "systeme", label: "Administrateur Système" },
  { value: "designer_ui_ux", label: "Designer UI/UX" },
  { value: "product_manager", label: "Product Manager" },
  { value: "project_manager", label: "Project Manager" },
  { value: "scrum_master", label: "Scrum Master" },
  { value: "business_analyst", label: "Business Analyst" },
  { value: "consultant_it", label: "Consultant IT" },
  { value: "technicien_informatique", label: "Technicien Informatique" },
  { value: "support_technique", label: "Support Technique" },
  { value: "testeur_qa", label: "Testeur/QA" },
  { value: "chef_projet", label: "Chef de Projet" },
  { value: "directeur_technique", label: "Directeur Technique" },
  { value: "cto", label: "CTO" },
  { value: "entrepreneur", label: "Entrepreneur" },
  { value: "freelance", label: "Freelance" },
  { value: "enseignant", label: "Enseignant" },
  { value: "chercheur", label: "Chercheur" },
  { value: "medecin", label: "Médecin" },
  { value: "infirmier", label: "Infirmier" },
  { value: "pharmacien", label: "Pharmacien" },
  { value: "dentiste", label: "Dentiste" },
  { value: "veterinaire", label: "Vétérinaire" },
  { value: "avocat", label: "Avocat" },
  { value: "notaire", label: "Notaire" },
  { value: "juge", label: "Juge" },
  { value: "policier", label: "Policier" },
  { value: "militant", label: "Militant" },
  { value: "journaliste", label: "Journaliste" },
  { value: "communication", label: "Communication" },
  { value: "marketing", label: "Marketing" },
  { value: "commercial", label: "Commercial" },
  { value: "comptable", label: "Comptable" },
  { value: "auditeur", label: "Auditeur" },
  { value: "banquier", label: "Banquier" },
  { value: "assureur", label: "Assureur" },
  { value: "economiste", label: "Économiste" },
  { value: "statisticien", label: "Statisticien" },
  { value: "ingenieur_civil", label: "Ingénieur Civil" },
  { value: "ingenieur_mecanique", label: "Ingénieur Mécanique" },
  { value: "ingenieur_electrique", label: "Ingénieur Électrique" },
  { value: "ingenieur_chimique", label: "Ingénieur Chimique" },
  { value: "ingenieur_agronome", label: "Ingénieur Agronome" },
  { value: "architecte", label: "Architecte" },
  { value: "urbaniste", label: "Urbaniste" },
  { value: "geologue", label: "Géologue" },
  { value: "biologiste", label: "Biologiste" },
  { value: "chimiste", label: "Chimiste" },
  { value: "physicien", label: "Physicien" },
  { value: "mathematicien", label: "Mathématicien" },
  { value: "psychologue", label: "Psychologue" },
  { value: "sociologue", label: "Sociologue" },
  { value: "anthropologue", label: "Anthropologue" },
  { value: "historien", label: "Historien" },
  { value: "geographe", label: "Géographe" },
  { value: "philosophe", label: "Philosophe" },
  { value: "linguiste", label: "Linguiste" },
  { value: "traducteur", label: "Traducteur" },
  { value: "interprete", label: "Interprète" },
  { value: "artiste", label: "Artiste" },
  { value: "musicien", label: "Musicien" },
  { value: "acteur", label: "Acteur" },
  { value: "danseur", label: "Danseur" },
  { value: "photographe", label: "Photographe" },
  { value: "cuisinier", label: "Cuisinier" },
  { value: "hotelier", label: "Hôtelier" },
  { value: "guide_touristique", label: "Guide Touristique" },
  { value: "pilote", label: "Pilote" },
  { value: "chauffeur", label: "Chauffeur" },
  { value: "mecanicien", label: "Mécanicien" },
  { value: "electricien", label: "Électricien" },
  { value: "plombier", label: "Plombier" },
  { value: "menuisier", label: "Menuisier" },
  { value: "maçon", label: "Maçon" },
  { value: "peintre", label: "Peintre" },
  { value: "coiffeur", label: "Coiffeur" },
  { value: "esteticien", label: "Esthéticien" },
  { value: "massage", label: "Masseur" },
  { value: "sportif", label: "Sportif" },
  { value: "entraineur", label: "Entraîneur" },
  { value: "arbitre", label: "Arbitre" },
  { value: "agriculteur", label: "Agriculteur" },
  { value: "eleveur", label: "Éleveur" },
  { value: "forestier", label: "Forestier" },
  { value: "pecheur", label: "Pêcheur" },
  { value: "mineur", label: "Mineur" },
  { value: "autre", label: "Autre profession" }
]

export function ProfessionCombobox({
  value,
  onValueChange,
  placeholder = "Sélectionner votre profession",
  className,
  disabled = false,
}: ProfessionComboboxProps) {
  return (
    <Combobox
      options={professions}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder="Rechercher une profession..."
      emptyMessage="Aucune profession trouvée."
      className={className}
      disabled={disabled}
    />
  )
}
