export interface AcademicFaculty {
  value: string;
  label: string;
  labelFr: string;
  labelEn: string;
  keywords?: string;
}

export interface AcademicDomain {
  id: string;
  label: string;
  labelFr: string;
  labelEn: string;
  icon: string;
  faculties: AcademicFaculty[];
}

export const ACADEMIC_DOMAINS: AcademicDomain[] = [
  {
    id: "tech_sciences",
    label: "Sciences & Technologies / Science & Technology",
    labelFr: "Sciences & Technologies",
    labelEn: "Science & Technology",
    icon: "💻",
    faculties: [
      {
        value: "genie_logiciel",
        label: "Génie Logiciel / Software Engineering",
        labelFr: "Génie Logiciel",
        labelEn: "Software Engineering",
        keywords: "dev logiciel software developer web mobile frontend backend coding fullstack programming",
      },
      {
        value: "informatique_generale",
        label: "Informatique Fondamentale / Computer Science",
        labelFr: "Informatique Fondamentale",
        labelEn: "Computer Science",
        keywords: "cs informatique algo algorithm programmation data systems software",
      },
      {
        value: "developpement_web",
        label: "Développement Web / Web Development",
        labelFr: "Développement Web",
        labelEn: "Web Development",
        keywords: "web html css javascript react vue node dev web designer fullstack",
      },
      {
        value: "developpement_mobile",
        label: "Développement Mobile / Mobile App Development",
        labelFr: "Développement Mobile",
        labelEn: "Mobile App Development",
        keywords: "mobile app android ios flutter react native swift kotlin",
      },
      {
        value: "intelligence_artificielle",
        label: "Intelligence Artificielle & Data / AI & Data Science",
        labelFr: "Intelligence Artificielle & Data",
        labelEn: "AI & Data Science",
        keywords: "ia ai machine learning ml deep learning data science big data analyse analyseur",
      },
      {
        value: "reseaux_telecom",
        label: "Réseaux & Télécommunications / Networks & Telecom",
        labelFr: "Réseaux & Télécommunications",
        labelEn: "Networks & Telecom",
        keywords: "reseaux telecom telecommunications networking cisco routers routeurs fibre satellite",
      },
      {
        value: "cybersécurité",
        label: "Cybersécurité / Cybersecurity & InfoSec",
        labelFr: "Cybersécurité",
        labelEn: "Cybersecurity & InfoSec",
        keywords: "securite info cybersecurity infosec ethical hacking audit pentest protection crypto",
      },
      {
        value: "systemes_reseaux",
        label: "Systèmes, Cloud & DevOps / Cloud & Systems Administration",
        labelFr: "Systèmes, Cloud & DevOps",
        labelEn: "Cloud & Systems Administration",
        keywords: "cloud aws azure devops sysadmin linux docker kubernetes systemes",
      },
      {
        value: "mathematiques",
        label: "Mathématiques & Statistiques / Mathematics & Statistics",
        labelFr: "Mathématiques & Statistiques",
        labelEn: "Mathematics & Statistics",
        keywords: "maths mathematiques stats probabilites analyse calcul algebre actuarial",
      },
      {
        value: "physique",
        label: "Physique & Sciences Physiques / Physics",
        labelFr: "Physique & Sciences Physiques",
        labelEn: "Physics",
        keywords: "physique mecanique optique electricite thermodynamique physique appliquee",
      },
      {
        value: "chimie",
        label: "Chimie & Procédés / Chemistry",
        labelFr: "Chimie & Procédés",
        labelEn: "Chemistry",
        keywords: "chimie laboratoire biochimie molecules synthese chimie organique analytique",
      },
      {
        value: "biologie",
        label: "Biologie & Sciences de la Vie / Biology & Life Sciences",
        labelFr: "Biologie & Sciences de la Vie",
        labelEn: "Biology & Life Sciences",
        keywords: "biologie bio sciences de la vie ecologie botanique zoologie microbiologie",
      },
      {
        value: "systemes_embarques",
        label: "Systèmes Embarqués & IoT / Embedded Systems & IoT",
        labelFr: "Systèmes Embarqués & IoT",
        labelEn: "Embedded Systems & IoT",
        keywords: "iot hardware microcontroleur arduino raspberry pi electronique embarquee",
      },
      {
        value: "genie_informatique",
        label: "Génie Informatique / Computer Engineering",
        labelFr: "Génie Informatique",
        labelEn: "Computer Engineering",
        keywords: "computer engineering architecture materiel processeur conception logicielle",
      },
      {
        value: "multimedia_jeux",
        label: "Multimédia & Jeux Vidéo / Multimedia & Game Development",
        labelFr: "Multimédia & Jeux Vidéo",
        labelEn: "Multimedia & Game Development",
        keywords: "jeux video gaming design 3d animation unity unreal infographie media",
      },
    ],
  },
  {
    id: "health",
    label: "Sciences de la Santé & Biomédicales / Health & Biomedical Sciences",
    labelFr: "Sciences de la Santé & Biomédicales",
    labelEn: "Health & Biomedical Sciences",
    icon: "🏥",
    faculties: [
      {
        value: "medecine",
        label: "Médecine Générale / General Medicine",
        labelFr: "Médecine Générale",
        labelEn: "General Medicine",
        keywords: "medecin docteur medecine clinique hospitalier chirurgie sante praticien",
      },
      {
        value: "pharmacie",
        label: "Pharmacie / Pharmacy",
        labelFr: "Pharmacie",
        labelEn: "Pharmacy",
        keywords: "pharmacien pharmacie medicaments officine galenique pharmacology",
      },
      {
        value: "sciences_infirmieres",
        label: "Sciences Infirmières / Nursing Sciences",
        labelFr: "Sciences Infirmières",
        labelEn: "Nursing Sciences",
        keywords: "infirmier infirmiere soins soignant soignante hopital sante nursing",
      },
      {
        value: "sage_femme",
        label: "Sage-Femme & Maïeutique / Midwifery",
        labelFr: "Sage-Femme & Maïeutique",
        labelEn: "Midwifery",
        keywords: "sage femme maieutique accouchement maternite obstetrique naissances",
      },
      {
        value: "odontostomatologie",
        label: "Odontostomatologie / Dental Surgery & Dentistry",
        labelFr: "Odontostomatologie",
        labelEn: "Dental Surgery & Dentistry",
        keywords: "dentiste chirurgie dentaire dents odonto stomatologie buccal",
      },
      {
        value: "techniques_laboratoire",
        label: "Analyses Médicales & Labo / Medical Laboratory Science",
        labelFr: "Analyses Médicales & Labo",
        labelEn: "Medical Laboratory Science",
        keywords: "laboratoire labo analyses prelevements biologie medicale hematologie bacterio",
      },
      {
        value: "radiologie",
        label: "Radiologie & Imagerie Médicale / Radiology & Medical Imaging",
        labelFr: "Radiologie & Imagerie Médicale",
        labelEn: "Radiology & Medical Imaging",
        keywords: "radio radiologie irm scanner imagerie echographie rayons x",
      },
      {
        value: "sante_publique",
        label: "Santé Publique & Épidémiologie / Public Health",
        labelFr: "Santé Publique & Épidémiologie",
        labelEn: "Public Health",
        keywords: "sante publique prevention epidemiologie oms hygiene communautaire",
      },
      {
        value: "physiotherapie",
        label: "Kinésithérapie & Physiothérapie / Physiotherapy",
        labelFr: "Kinésithérapie & Physiothérapie",
        labelEn: "Physiotherapy",
        keywords: "kinesitherapie kine reeducation readaptation massage motricite physio",
      },
      {
        value: "nutrition",
        label: "Nutrition & Diététique / Nutrition & Dietetics",
        labelFr: "Nutrition & Diététique",
        labelEn: "Nutrition & Dietetics",
        keywords: "nutrition dietetique alimentation regimes equilibre alimentaire",
      },
      {
        value: "veterinaire",
        label: "Médecine Vétérinaire / Veterinary Medicine",
        labelFr: "Médecine Vétérinaire",
        labelEn: "Veterinary Medicine",
        keywords: "veterinaire animaux clinique sante animale zoologie elevage",
      },
    ],
  },
  {
    id: "business_management",
    label: "Sciences Économiques & Gestion / Economics & Management",
    labelFr: "Sciences Économiques & Gestion",
    labelEn: "Economics & Management",
    icon: "💼",
    faculties: [
      {
        value: "comptabilite_finance",
        label: "Comptabilité, Finance & Audit / Accounting, Finance & Audit",
        labelFr: "Comptabilité, Finance & Audit",
        labelEn: "Accounting, Finance & Audit",
        keywords: "compta comptabilite finance cpa audit bilan fiscalite tresorerie tenue de comptes",
      },
      {
        value: "banque_assurance",
        label: "Banque, Monnaie & Assurance / Banking & Insurance",
        labelFr: "Banque, Monnaie & Assurance",
        labelEn: "Banking & Insurance",
        keywords: "banque assurance credit microfinance investissement marche financier",
      },
      {
        value: "marketing",
        label: "Marketing & Commerce International / Marketing & Trade",
        labelFr: "Marketing & Commerce International",
        labelEn: "Marketing & Trade",
        keywords: "marketing vente commerce commercial digital communication publicite negociations",
      },
      {
        value: "gestion_entreprises",
        label: "Management & Gestion d'Entreprise / Business Administration",
        labelFr: "Management & Gestion d'Entreprise",
        labelEn: "Business Administration",
        keywords: "gestion administration management pme entrepreneuriat affaires strategie",
      },
      {
        value: "grh",
        label: "Gestion des Ressources Humaines / Human Resource Management",
        labelFr: "Gestion des Ressources Humaines",
        labelEn: "Human Resource Management",
        keywords: "rh ressources humaines recrutement paie relations sociales personnel talents",
      },
      {
        value: "economie",
        label: "Sciences Économiques / Economics",
        labelFr: "Sciences Économiques",
        labelEn: "Economics",
        keywords: "economie macroeconomie microeconomie developpement economiste finances publiques",
      },
      {
        value: "logistique",
        label: "Logistique & Transport / Logistics & Supply Chain",
        labelFr: "Logistique & Transport",
        labelEn: "Logistics & Supply Chain",
        keywords: "logistique transport supply chain transit douane fret entrepot approvisionnement",
      },
    ],
  },
  {
    id: "law_politics",
    label: "Droit & Sciences Politiques / Law & Political Science",
    labelFr: "Droit & Sciences Politiques",
    labelEn: "Law & Political Science",
    icon: "⚖️",
    faculties: [
      {
        value: "droit_prive",
        label: "Droit Privé & Carrières Judiciaires / Private Law",
        labelFr: "Droit Privé & Carrières Judiciaires",
        labelEn: "Private Law",
        keywords: "droit civil affaires commercial contentieux juriste avocat magistrat tribunal penal",
      },
      {
        value: "droit_public",
        label: "Droit Public & Administration / Public Law",
        labelFr: "Droit Public & Administration",
        labelEn: "Public Law",
        keywords: "droit constitutionnel administratif fiscal fonction publique collectes etat",
      },
      {
        value: "droit_international",
        label: "Droit International / International Law",
        labelFr: "Droit International",
        labelEn: "International Law",
        keywords: "droit international humanitaire traites cours justice arbitrage mondial",
      },
      {
        value: "sciences_politiques",
        label: "Sciences Politiques / Political Science",
        labelFr: "Sciences Politiques",
        labelEn: "Political Science",
        keywords: "sciences politiques gouvernance diplomatie politiques publiques elections sc po",
      },
      {
        value: "relations_internationales",
        label: "Relations Internationales & Diplomatie / International Relations & Diplomacy",
        labelFr: "Relations Internationales & Diplomatie",
        labelEn: "International Relations & Diplomacy",
        keywords: "relations internationales diplomate diplomatie ong ambassade geopolitique cooperation",
      },
    ],
  },
  {
    id: "engineering",
    label: "Ingénierie & Industrie / Engineering & Industry",
    labelFr: "Ingénierie & Industrie",
    labelEn: "Engineering & Industry",
    icon: "⚙️",
    faculties: [
      {
        value: "genie_civil",
        label: "Génie Civil & BTP / Civil Engineering & Construction",
        labelFr: "Génie Civil & BTP",
        labelEn: "Civil Engineering & Construction",
        keywords: "genie civil batiment btp travaux publics routes ponts structures chantiers architecture",
      },
      {
        value: "genie_electrique",
        label: "Génie Électrique & Électronique / Electrical & Electronic Engineering",
        labelFr: "Génie Électrique & Électronique",
        labelEn: "Electrical & Electronic Engineering",
        keywords: "electrique electro electrotechnique electricite puissance reseaux cables circuits",
      },
      {
        value: "genie_mecanique",
        label: "Génie Mécanique / Mechanical Engineering",
        labelFr: "Génie Mécanique",
        labelEn: "Mechanical Engineering",
        keywords: "mecanique machines conception moteurs cao usinage materiaux maintenance",
      },
      {
        value: "genie_industriel",
        label: "Génie Industriel & Maintenance / Industrial Engineering",
        labelFr: "Génie Industriel & Maintenance",
        labelEn: "Industrial Engineering",
        keywords: "industriel usine production fabrication qualite maintenance methode process",
      },
      {
        value: "genie_chimique",
        label: "Génie Chimique & des Procédés / Chemical Engineering",
        labelFr: "Génie Chimique & des Procédés",
        labelEn: "Chemical Engineering",
        keywords: "chimie industrielle petrole raffinage procedes transformation plastiques",
      },
      {
        value: "genie_energies",
        label: "Énergies & Énergies Renouvelables / Energy & Renewables",
        labelFr: "Énergies & Énergies Renouvelables",
        labelEn: "Energy & Renewables",
        keywords: "energie renouvelable solaire thermique eolien hydroelectrique transition",
      },
      {
        value: "genie_minier",
        label: "Génie Minier & Métallurgie / Mining Engineering & Metallurgy",
        labelFr: "Génie Minier & Métallurgie",
        labelEn: "Mining Engineering & Metallurgy",
        keywords: "mines minier carriere extraction forage geologie appliquee minerais",
      },
      {
        value: "genie_automobile",
        label: "Génie Automobile & Aéronautique / Automotive & Aerospace Engineering",
        labelFr: "Génie Automobile & Aéronautique",
        labelEn: "Automotive & Aerospace Engineering",
        keywords: "automobile voiture moteurs aviation aeronautique transport mecanique",
      },
      {
        value: "genie_robotique",
        label: "Robotique & Automatisme / Robotics & Industrial Automation",
        labelFr: "Robotique & Automatisme",
        labelEn: "Robotics & Industrial Automation",
        keywords: "robotique automatisme automate capteur servomoteur mecatronique industrie",
      },
    ],
  },
  {
    id: "agriculture",
    label: "Agronomie, Agriculture & Végétal / Agriculture & Forestry",
    labelFr: "Agronomie, Agriculture & Végétal",
    labelEn: "Agriculture & Forestry",
    icon: "🌾",
    faculties: [
      {
        value: "agronomie",
        label: "Agronomie Générale / General Agronomy",
        labelFr: "Agronomie Générale",
        labelEn: "General Agronomy",
        keywords: "agronomie agriculture cultures plantations sol engrais production vegetale",
      },
      {
        value: "productions_animales",
        label: "Productions Animales & Élevage / Animal Production & Husbandry",
        labelFr: "Productions Animales & Élevage",
        labelEn: "Animal Production & Husbandry",
        keywords: "elevage zootechnie aviculture bovin porcin betail sante animale fermes",
      },
      {
        value: "sciences_forestieres",
        label: "Eaux, Forêts & Ressources Naturelles / Forestry & Natural Resources",
        labelFr: "Eaux, Forêts & Ressources Naturelles",
        labelEn: "Forestry & Natural Resources",
        keywords: "forets bois faune flore conservation biodiversite environnement ressources",
      },
      {
        value: "aquaculture",
        label: "Aquaculture & Pêche / Fisheries & Aquaculture",
        labelFr: "Aquaculture & Pêche",
        labelEn: "Fisheries & Aquaculture",
        keywords: "poissons peche pisciculture aquaculture halieutique etangs mer",
      },
      {
        value: "agribusiness",
        label: "Agribusiness & Économie Rurale / Agribusiness & Rural Development",
        labelFr: "Agribusiness & Économie Rurale",
        labelEn: "Agribusiness & Rural Development",
        keywords: "agribusiness economie rurale filiere agricole commercialisation cooperative",
      },
      {
        value: "technologie_agroalimentaire",
        label: "Technologie Agroalimentaire / Food Science & Processing",
        labelFr: "Technologie Agroalimentaire",
        labelEn: "Food Science & Processing",
        keywords: "agroalimentaire transformation alimentaire conservation emballage qualite hygiène",
      },
    ],
  },
  {
    id: "humanities",
    label: "Lettres, Arts & Sciences Humaines / Arts & Humanities",
    labelFr: "Lettres, Arts & Sciences Humaines",
    labelEn: "Arts & Humanities",
    icon: "📚",
    faculties: [
      {
        value: "communication",
        label: "Communication, Médias & Journalisme / Communication & Media",
        labelFr: "Communication, Médias & Journalisme",
        labelEn: "Communication & Media",
        keywords: "communication journalisme medias radio tv presse relations publiques redac",
      },
      {
        value: "litterature",
        label: "Lettres & Littérature / Modern Languages & Literature",
        labelFr: "Lettres & Littérature",
        labelEn: "Modern Languages & Literature",
        keywords: "lettres litterature francais anglais bilinguisme ecriture redaction langues",
      },
      {
        value: "linguistique",
        label: "Linguistique, Traduction & Interprétation / Translation & Linguistics",
        labelFr: "Linguistique, Traduction & Interprétation",
        labelEn: "Translation & Linguistics",
        keywords: "traduction interprete linguistique langues vivantes traduction bilingue",
      },
      {
        value: "psychologie",
        label: "Psychologie & Sciences du Comportement / Psychology",
        labelFr: "Psychologie & Sciences du Comportement",
        labelEn: "Psychology",
        keywords: "psychologie psy comportement therapie soutien mental clinique social",
      },
      {
        value: "anthropologie",
        label: "Sociologie & Anthropologie / Sociology & Anthropology",
        labelFr: "Sociologie & Anthropologie",
        labelEn: "Sociology & Anthropology",
        keywords: "sociologie anthropologie societe sociologique cultures communautes enquete",
      },
      {
        value: "histoire",
        label: "Histoire & Géographie / History & Geography",
        labelFr: "Histoire & Géographie",
        labelEn: "History & Geography",
        keywords: "histoire geographie cartographie patrimoine archives memoire passe geographie humaine",
      },
      {
        value: "philosophie",
        label: "Philosophie / Philosophy",
        labelFr: "Philosophie",
        labelEn: "Philosophy",
        keywords: "philosophie ethique reflexion critique logique pensee metaphysique",
      },
      {
        value: "tourisme",
        label: "Tourisme, Hôtellerie & Patrimoine / Tourism & Hospitality",
        labelFr: "Tourisme, Hôtellerie & Patrimoine",
        labelEn: "Tourism & Hospitality",
        keywords: "tourisme hotellerie voyage patrimoine culturel accueil guidage loisirs",
      },
    ],
  },
  {
    id: "education",
    label: "Sciences de l'Éducation & Enseignement / Education & Teaching",
    labelFr: "Sciences de l'Éducation & Enseignement",
    labelEn: "Education & Teaching",
    icon: "🎓",
    faculties: [
      {
        value: "sciences_education",
        label: "Sciences de l'Éducation / Educational Sciences",
        labelFr: "Sciences de l'Éducation",
        labelEn: "Educational Sciences",
        keywords: "education enseignement pedagogie didactique ecole apprentissage formation",
      },
      {
        value: "formation_enseignants",
        label: "Formation des Enseignants du Secondaire (ENS) / Teacher Training (ENS)",
        labelFr: "Formation des Enseignants du Secondaire (ENS)",
        labelEn: "Teacher Training (ENS)",
        keywords: "ens professeur enseignant lycee college lettres sciences education secondaire",
      },
      {
        value: "enseignement_technique",
        label: "Formation Technique & Professionnelle (ENSET) / Technical Education (ENSET)",
        labelFr: "Formation Technique & Professionnelle (ENSET)",
        labelEn: "Technical Education (ENSET)",
        keywords: "enset technique professionnel prof metiers ingenierie pedagogie",
      },
      {
        value: "administration_scolaire",
        label: "Administration & Gestion Scolaire / School Administration",
        labelFr: "Administration & Gestion Scolaire",
        labelEn: "School Administration",
        keywords: "direction censeur proviseur inspection encadrement etablissement scolaire",
      },
      {
        value: "eps",
        label: "Éducation Physique & Sportive (INJS) / Physical Education & Sports",
        labelFr: "Éducation Physique & Sportive (INJS)",
        labelEn: "Physical Education & Sports",
        keywords: "injs sport athletisme professeur eps gymnastique entrainement activite physique",
      },
    ],
  },
  {
    id: "other",
    label: "Autres Domaines Spécialisés / Other Specialities",
    labelFr: "Autres Domaines Spécialisés",
    labelEn: "Other Specialities",
    icon: "🌐",
    faculties: [
      {
        value: "sciences_maritimes",
        label: "Sciences Maritimes & Portuaires / Maritime & Port Sciences",
        labelFr: "Sciences Maritimes & Portuaires",
        labelEn: "Maritime & Port Sciences",
        keywords: "mer marine navigation portuaire navire oceanographie littoral",
      },
      {
        value: "mines_geologie",
        label: "Mines & Géologie Appliquée / Mines & Applied Geology",
        labelFr: "Mines & Géologie Appliquée",
        labelEn: "Mines & Applied Geology",
        keywords: "geologie roches sous sol hydrocarbures minerais cartographie",
      },
      {
        value: "hydraulique",
        label: "Hydraulique & Maîtrise des Eaux / Hydraulics & Water Resources",
        labelFr: "Hydraulique & Maîtrise des Eaux",
        labelEn: "Hydraulics & Water Resources",
        keywords: "eau hydraulique assainissement barrage forage hydrographie canaux",
      },
      {
        value: "autre",
        label: "Autre filière / Other field of study",
        labelFr: "Autre filière",
        labelEn: "Other field of study",
        keywords: "autre divers specialite specifique non liste other",
      },
    ],
  },
];

/** Mapping rapide de tous les slugs vers leur libellé bilingue */
export const FACULTY_BILINGUAL_MAP: Record<string, string> = {};
export const FACULTY_TO_DOMAIN_MAP: Record<string, string> = {};

// Remplir le mapping avec toutes les facultés définies
for (const domain of ACADEMIC_DOMAINS) {
  for (const faculty of domain.faculties) {
    FACULTY_BILINGUAL_MAP[faculty.value] = faculty.label;
    FACULTY_TO_DOMAIN_MAP[faculty.value] = domain.id;
  }
}

// Slugs historiques supplémentaires pour compatibilité totale avec la base existante
const LEGACY_FACULTY_ALIASES: Record<string, { label: string; domainId: string }> = {
  biotechnologies: { label: "Biotechnologies / Biotechnology", domainId: "health" },
  science_laboratoire_medicale: { label: "Analyses Médicales & Labo / Medical Laboratory Science", domainId: "health" },
  sciences_biomedicales: { label: "Sciences Biomédicales / Biomedical Sciences", domainId: "health" },
  medecine_veterinaire: { label: "Médecine Vétérinaire / Veterinary Medicine", domainId: "health" },
  machine_learning: { label: "Intelligence Artificielle & Data / AI & Data Science", domainId: "tech_sciences" },
  science_donnees: { label: "Science des Données / Data Science", domainId: "tech_sciences" },
  big_data: { label: "Big Data & Analyse / Big Data Analytics", domainId: "tech_sciences" },
  cloud_computing: { label: "Cloud Computing & DevOps", domainId: "tech_sciences" },
  informatique_theorique: { label: "Informatique Fondamentale / Computer Science", domainId: "tech_sciences" },
  informatique_industrielle: { label: "Systèmes Embarqués & IoT / Embedded Systems & IoT", domainId: "tech_sciences" },
  informatique_gestion: { label: "Informatique de Gestion / Business Information Systems", domainId: "tech_sciences" },
  base_donnees: { label: "Bases de Données & Data / Database Administration", domainId: "tech_sciences" },
  sciences_terre: { label: "Géologie & Sciences de la Terre / Earth Sciences", domainId: "tech_sciences" },
  environnement: { label: "Sciences de l'Environnement / Environmental Science", domainId: "tech_sciences" },
  energies_renouvelables: { label: "Énergies Renouvelables / Renewable Energy", domainId: "engineering" },
  geomatique: { label: "Géomatique / Geomatics", domainId: "tech_sciences" },
  statistiques: { label: "Statistiques & Données / Statistics & Data", domainId: "tech_sciences" },
  genie_electronique: { label: "Génie Électronique / Electronic Engineering", domainId: "engineering" },
  genie_automatique: { label: "Automatique & Robotique / Automation Engineering", domainId: "engineering" },
  genie_electromecanique: { label: "Génie Électromécanique / Electromechanical Engineering", domainId: "engineering" },
  genie_procedes: { label: "Génie des Procédés / Process Engineering", domainId: "engineering" },
  genie_aeronautique: { label: "Génie Aéronautique & Spatial / Aerospace Engineering", domainId: "engineering" },
  maintenance_systemes_industriels: { label: "Maintenance Industrielle / Industrial Maintenance", domainId: "engineering" },
  maintenance_systemes_informatique: { label: "Maintenance Informatique & Réseaux / IT Maintenance", domainId: "tech_sciences" },
  automatisation_industrielle: { label: "Automatisation Industrielle / Industrial Automation", domainId: "engineering" },
  tic: { label: "Technologies de l'Information (TIC) / ICT", domainId: "tech_sciences" },
  productions_vegetales: { label: "Productions Végétales / Crop Production", domainId: "agriculture" },
  gestion_environnement: { label: "Gestion des Ressources Naturelles / Environmental Management", domainId: "agriculture" },
  administration_affaires: { label: "Administration des Affaires / Business Administration", domainId: "business_management" },
  pedagogie: { label: "Pédagogie & Didactique / Pedagogy & Didactics", domainId: "education" },
};

for (const [slug, data] of Object.entries(LEGACY_FACULTY_ALIASES)) {
  if (!FACULTY_BILINGUAL_MAP[slug]) {
    FACULTY_BILINGUAL_MAP[slug] = data.label;
  }
  if (!FACULTY_TO_DOMAIN_MAP[slug]) {
    FACULTY_TO_DOMAIN_MAP[slug] = data.domainId;
  }
}

/** Trouve le domaine associé à un slug de filière */
export function getDomainForFaculty(facultyValue?: string | null): string | undefined {
  if (!facultyValue) return undefined;
  return FACULTY_TO_DOMAIN_MAP[facultyValue.toLowerCase().trim()];
}

/** Trouve le domaine par son ID */
export function getDomainById(domainId?: string | null): AcademicDomain | undefined {
  if (!domainId) return undefined;
  return ACADEMIC_DOMAINS.find((d) => d.id === domainId);
}

/** Récupère le label bilingue d'une filière */
export function getFacultyBilingualLabel(facultyValue?: string | null): string {
  if (!facultyValue) return "";
  const key = facultyValue.toLowerCase().trim();
  return FACULTY_BILINGUAL_MAP[key] || facultyValue;
}
