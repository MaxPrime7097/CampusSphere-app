import { Combobox } from "@/components/ui/combobox-grouped";

interface FacultyComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const faculties = [
  {
    "label": "Sciences de la Santé et Biomédicales",
    "options": [
      { "value": "medecine", "label": "Médecine générale" },
      { "value": "pharmacie", "label": "Pharmacie" },
      { "value": "veterinaire", "label": "Véterinaire" },
      { "value": "odontostomatologie", "label": "Odontostomatologie (Chirurgie dentaire)" },
      { "value": "sciences_infirmieres", "label": "Sciences infirmières" },
      { "value": "sage_femme", "label": "Sage-femme / Maïeutique" },
      { "value": "techniques_laboratoire", "label": "Techniques de laboratoire médical" },
      { "value": "radiologie", "label": "Radiologie / Imagerie médicale" },
      { "value": "sante_publique", "label": "Santé publique" },
      { "value": "biotechnologies", "label": "Biotechnologies" },
      { "value": "science_laboratoire_medicale", "label": "Sciences de laboratoire médical" },
      { "value": "sciences_biomedicales", "label": "Sciences biomédicales" },
      { "value": "physiotherapie", "label": "Physiothérapie / Kinésithérapie" },
      { "value": "nutrition", "label": "Nutrition et diététique" }
    ]
  },
  {
    "label": "Sciences et Technologies",
    "options": [
      { "value": "mathematiques", "label": "Mathématiques" },
      { "value": "physique", "label": "Physique" },
      { "value": "chimie", "label": "Chimie" },
      { "value": "biologie", "label": "Biologie" },
      { "value": "sciences_terre", "label": "Sciences de la Terre et Géologie" },
      { "value": "environnement", "label": "Sciences de l’Environnement" },
      { "value": "energies_renouvelables", "label": "Énergies renouvelables" },
      { "value": "geomatique", "label": "Géomatique / Géographie physique" },
      { "value": "statistiques", "label": "Statistiques et Probabilités" },
      { "value": "informatique_generale", "label": "Informatique générale" },
      { "value": "developpement_web", "label": "Développement Web (Full Stack / Front-End / Back-End)" },
      { "value": "developpement_mobile", "label": "Développement d'applications mobiles" },
      { "value": "intelligence_artificielle", "label": "Intelligence Artificielle (IA)" },
      { "value": "machine_learning", "label": "Machine Learning / Deep Learning" },
      { "value": "science_donnees", "label": "Science des données (Data Science)" },
      { "value": "big_data", "label": "Big Data et Analyse de données" },
      { "value": "cybersécurité", "label": "Cybersécurité / Sécurité informatique" },
      { "value": "reseaux_telecom", "label": "Réseaux et Télécommunications" },
      { "value": "systemes_reseaux", "label": "Systèmes et Administration Réseaux" },
      { "value": "cloud_computing", "label": "Cloud Computing" },
      { "value": "systemes_embarques", "label": "Systèmes embarqués / IoT" },
      { "value": "informatique_industrielle", "label": "Informatique industrielle / Automatisme" },
      { "value": "base_donnees", "label": "Bases de données et Administration BDD" },
      { "value": "genie_informatique", "label": "Génie Informatique" },
      { "value": "informatique_theorique", "label": "Informatique théorique et Algorithmique" },
      { "value": "multimedia_jeux", "label": "Multimédia et Développement de jeux vidéo" },
      { "value": "informatique_gestion", "label": "Informatique de gestion / Systèmes d'information" }
    ]
  },
  {
    "label": "Ingénierie et Technologies Industrielles",
    "options": [
      { "value": "genie_civil", "label": "Génie Civil" },
      { "value": "genie_electrique", "label": "Génie Électrique / Électrotechnique" },
      { "value": "genie_mecanique", "label": "Génie Mécanique" },
      { "value": "genie_electronique", "label": "Génie Electronique" },
      { "value": "genie_automatique", "label": "Génie Automatique" },
      { "value": "genie_electromecanique", "label": "Génie Electromécanique" },
      { "value": "genie_chimique", "label": "Génie Chimique" },
      { "value": "genie_logiciel", "label": "Génie logiciel / Développement logiciel" },
      { "value": "genie_informatique", "label": "Génie Informatique et Télécommunications" },
      { "value": "genie_industriel", "label": "Génie Industriel" },
      { "value": "genie_procedes", "label": "Génie des Procédés / Chimie industrielle" },
      { "value": "genie_energies", "label": "Génie des Énergies" },
      { "value": "genie_automobile", "label": "Génie Automobile" },
      { "value": "genie_aeronautique", "label": "Génie Aéronautique et Spatial" },
      { "value": "genie_robotique", "label": "Génie Robotique" },
      { "value": "genie_minier", "label": "Génie minier" },
      { "value": "maintenance_systemes_industriels", "label": "Maintenance des systèmes industrielle" },
      { "value": "maintenance_systemes_informatique", "label": "Maintenance des systèmes informatique" },
      { "value": "automatisation_industrielle", "label": "Automatisation industrielle" },
      { "value": "tic", "label": "Technologies de l’Information et de la Communication (TIC)" },
      { "value": "logistique", "label": "Logistique et Transport" }
    ]
  },
  {
    "label": "Agronomie, Sciences Agricoles et Vétérinaires",
    "options": [
      { "value": "agronomie", "label": "Agronomie générale" },
      { "value": "productions_vegetales", "label": "Productions végétales" },
      { "value": "productions_animales", "label": "Productions animales / Élevage" },
      { "value": "sciences_forestieres", "label": "Sciences forestières" },
      { "value": "aquaculture", "label": "Aquaculture et Pêche" },
      { "value": "agribusiness", "label": "Agribusiness / Économie rurale" },
      { "value": "technologie_agroalimentaire", "label": "Technologie agroalimentaire" },
      { "value": "medecine_veterinaire", "label": "Sciences vétérinaires / Médecine vétérinaire" },
      { "value": "gestion_environnement", "label": "Gestion des ressources naturelles" }
    ]
  },
  {
    "label": "Sciences Économiques et de Gestion",
    "options": [
      { "value": "economie", "label": "Économie" },
      { "value": "gestion_entreprises", "label": "Gestion des Entreprises / Management" },
      { "value": "comptabilite_finance", "label": "Comptabilité / Finance / Audit" },
      { "value": "banque_assurance", "label": "Banque et Assurance" },
      { "value": "marketing", "label": "Marketing / Commerce international" },
      { "value": "grh", "label": "Gestion des Ressources Humaines" },
      { "value": "administration_affaires", "label": "Administration des Affaires" }
    ]
  },
  {
    "label": "Droit, Sciences Politiques et Relations Internationales",
    "options": [
      { "value": "droit_prive", "label": "Droit privé" },
      { "value": "droit_public", "label": "Droit public" },
      { "value": "sciences_politiques", "label": "Sciences politiques" },
      { "value": "relations_internationales", "label": "Relations internationales / Diplomatie" },
      { "value": "droit_international", "label": "Droit international" }
    ]
  },
  {
    "label": "Lettres, Arts et Sciences Humaines",
    "options": [
      { "value": "histoire", "label": "Histoire" },
      { "value": "geographie", "label": "Géographie humaine" },
      { "value": "philosophie", "label": "Philosophie" },
      { "value": "litterature", "label": "Littérature (française, anglaise, africaine)" },
      { "value": "linguistique", "label": "Linguistique / Langues modernes" },
      { "value": "anthropologie", "label": "Anthropologie / Sociologie" },
      { "value": "psychologie", "label": "Psychologie" },
      { "value": "communication", "label": "Communication / Journalisme" },
      { "value": "tourisme", "label": "Tourisme / Patrimoine culturel" }
    ]
  },
  {
    "label": "Sciences de l’Éducation",
    "options": [
      { "value": "sciences_education", "label": "Sciences de l’Éducation" },
      { "value": "formation_enseignants", "label": "Formation des enseignants du secondaire (ENS)" },
      { "value": "enseignement_technique", "label": "Formation technique et professionnelle (ENSET)" },
      { "value": "pedagogie", "label": "Pédagogie / Didactique" },
      { "value": "administration_scolaire", "label": "Administration scolaire" },
      { "value": "eps", "label": "Éducation physique et sportive" }
    ]
  },
  {
    "label": "Autres Domaines Spécialisés",
    "options": [
      { "value": "sciences_maritimes", "label": "Sciences maritimes / Océanographie" },
      { "value": "mines_geologie", "label": "Mines et Géologie appliquée" },
      { "value": "hydraulique", "label": "Hydraulique et Maîtrise des Eaux" },
      { "value": "autre", "label": "Autre filière" }
    ]
  }
];

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
  );
}