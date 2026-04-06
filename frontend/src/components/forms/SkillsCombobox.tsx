import { useState } from "react";
import { Combobox } from "@/components/ui/combobox";

interface SkillsComboboxProps {
  onSkillAdd?: (skill: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const skills = [
  // Langages de programmation
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "php", label: "PHP" },
  { value: "c++", label: "C++" },
  { value: "c#", label: "C#" },
  { value: "typescript", label: "TypeScript" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
  
  // Frameworks & Libraries
  { value: "react", label: "React" },
  { value: "vue", label: "Vue.js" },
  { value: "angular", label: "Angular" },
  { value: "nodejs", label: "Node.js" },
  { value: "django", label: "Django" },
  { value: "laravel", label: "Laravel" },
  { value: "spring", label: "Spring" },
  { value: "flutter", label: "Flutter" },
  { value: "react_native", label: "React Native" },
  
  // Bases de données
  { value: "mysql", label: "MySQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mongodb", label: "MongoDB" },
  { value: "sqlite", label: "SQLite" },
  { value: "redis", label: "Redis" },
  
  // Outils & Technologies
  { value: "git", label: "Git" },
  { value: "docker", label: "Docker" },
  { value: "kubernetes", label: "Kubernetes" },
  { value: "aws", label: "AWS" },
  { value: "azure", label: "Azure" },
  { value: "linux", label: "Linux" },
  { value: "windows", label: "Windows" },
  
  // Design & Créativité
  { value: "photoshop", label: "Photoshop" },
  { value: "illustrator", label: "Illustrator" },
  { value: "figma", label: "Figma" },
  { value: "canva", label: "Canva" },
  { value: "ui_ux", label: "UI/UX Design" },
  
  // Marketing & Communication
  { value: "marketing_digital", label: "Marketing Digital" },
  { value: "seo", label: "SEO" },
  { value: "google_ads", label: "Google Ads" },
  { value: "facebook_ads", label: "Facebook Ads" },
  { value: "content_marketing", label: "Content Marketing" },
  { value: "copywriting", label: "Copywriting" },
  
  // Langues
  { value: "francais", label: "Français" },
  { value: "anglais", label: "Anglais" },
  { value: "allemand", label: "Allemand" },
  { value: "espagnol", label: "Espagnol" },
  { value: "chinois", label: "Chinois" },
  
  // Compétences transversales
  { value: "gestion_projet", label: "Gestion de Projet" },
  { value: "leadership", label: "Leadership" },
  { value: "communication", label: "Communication" },
  { value: "travail_equipe", label: "Travail en Équipe" },
  { value: "resolution_problemes", label: "Résolution de Problèmes" },
  { value: "creativite", label: "Créativité" },
  { value: "organisation", label: "Organisation" },
  { value: "adaptabilite", label: "Adaptabilité" },
  
  // Autres
  { value: "excel", label: "Microsoft Excel" },
  { value: "powerpoint", label: "PowerPoint" },
  { value: "word", label: "Microsoft Word" },
  { value: "comptabilite", label: "Comptabilité" },
  { value: "analyse_donnees", label: "Analyse de Données" },
];

export function SkillsCombobox({
  onSkillAdd,
  placeholder = "Ajouter une compétence",
  className,
  disabled = false,
}: SkillsComboboxProps) {
  const [value, setValue] = useState("");

  const handleValueChange = (newValue: string) => {
    if (newValue && onSkillAdd) {
      onSkillAdd(newValue);
      setValue(""); // Reset après ajout
    }
  };

  return (
    <Combobox
      options={skills}
      value={value}
      onValueChange={handleValueChange}
      placeholder={placeholder}
      searchPlaceholder="Rechercher une compétence..."
      emptyMessage="Aucune compétence trouvée."
      className={className}
      disabled={disabled}
      allowCustomValue={true}
    />
  );
}