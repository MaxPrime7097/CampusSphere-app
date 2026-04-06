import { Combobox } from "@/components/ui/combobox-grouped";

interface InstitutionComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const institutions = [
  {
    label: "Universités Publiques",
    options: [
      { value: "universite_yaounde_1", label: "Université de Yaoundé I" },
      { value: "universite_yaounde_2", label: "Université de Yaoundé II (Soa)" },
      { value: "universite_douala", label: "Université de Douala" },
      { value: "universite_dschang", label: "Université de Dschang" },
      { value: "universite_buea", label: "University of Buea" },
      { value: "universite_bamenda", label: "University of Bamenda" },
      { value: "universite_ngaoundere", label: "Université de Ngaoundéré" },
      { value: "universite_maroua", label: "Université de Maroua" },
    ]
  },
  {
    label: "Grandes Écoles & Instituts Supérieurs Publics",
    options: [
      { value: "ensp_yaounde", label: "École Nationale Supérieure Polytechnique de Yaoundé (ENSP)" },
      { value: "enset_douala", label: "ENSET de Douala" },
      { value: "enset_bambili", label: "ENSET de Bambili" },
      { value: "ens_yaounde", label: "École Normale Supérieure de Yaoundé (ENS)" },
      { value: "ens_bambili", label: "École Normale Supérieure de Bambili" },
      { value: "enam", label: "ENAM (École Nationale d'Administration et de Magistrature)" },
      { value: "iric", label: "IRIC (Institut des Relations Internationales du Cameroun)" },
      { value: "essec_douala", label: "ESSEC de Douala" },
      { value: "fasa_dschang", label: "FASA (Faculté d'Agronomie et des Sciences Agricoles)" },
      { value: "iut_ngaoundere", label: "IUT de Ngaoundéré" },
      { value: "iut_douala", label: "IUT de Douala" },
    ]
  },
  {
    label: "Instituts Supérieurs Privés",
    options: [
      { value: "ict_university", label: "ICT University" },
      { value: "catholic_university", label: "Catholic University of Cameroon (CATUC)" },
      { value: "university_siantou", label: "University of Siantou" },
      { value: "istag", label: "ISTAG" },
      { value: "pigier", label: "Pigier Cameroun" },
      { value: "esam", label: "ESAM" },
      { value: "sup_management", label: "Sup Management" },
      { value: "isma", label: "ISMA" },
      { value: "ibs", label: "IBS (Institut Burkinabè de Sciences)" },
      { value: "hec_cameroun", label: "HEC Cameroun" },
      { value: "istt", label: "ISTT" },
      { value: "iut_fotso_victor", label: "IUT Fotso Victor (Bandjoun)" },
      { value: "autre_superieur", label: "Autre établissement supérieur" },
    ]
  },
  {
    label: "Lycées & Collèges Techniques",
    options: [
      { value: "lycee_technique_yaounde", label: "Lycée Technique de Yaoundé" },
      { value: "lycee_technique_douala", label: "Lycée Technique de Douala" },
      { value: "lycee_technique_bafoussam", label: "Lycée Technique de Bafoussam" },
      { value: "cetic_yaounde", label: "CETIC de Yaoundé" },
      { value: "cetic_douala", label: "CETIC de Douala" },
      { value: "sap_yaounde", label: "SAP de Yaoundé" },
    ]
  },
  {
    label: "Lycées d'Enseignement Général",
    options: [
      { value: "lycee_bilingue_yaounde", label: "Lycée Bilingue de Yaoundé" },
      { value: "lycee_bilingue_buea", label: "Lycée Bilingue de Buea" },
      { value: "lycee_general_leclerc", label: "Lycée Général Leclerc" },
      { value: "lycee_de_nkolbisson", label: "Lycée de Nkolbisson" },
      { value: "college_de_la_retraite", label: "Collège de la Retraite" },
      { value: "college_libermann", label: "Collège Libermann" },
      { value: "college_vogt", label: "Collège Vogt" },
      { value: "saker_baptist_college", label: "Saker Baptist College" },
      { value: "presbyterian_secondary", label: "Presbyterian Secondary School" },
      { value: "autre_secondaire", label: "Autre lycée / collège" },
    ]
  }
];

export function InstitutionCombobox({
  value,
  onValueChange,
  placeholder = "Sélectionner une institution",
  className,
  disabled = false,
}: InstitutionComboboxProps) {
  return (
    <Combobox
      options={institutions}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder="Rechercher une institution..."
      emptyMessage="Aucune institution trouvée."
      className={className}
      disabled={disabled}
    />
  );
}