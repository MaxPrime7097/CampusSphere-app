import { useState } from "react";
import { Combobox } from "@/components/ui/combobox";

interface InterestsComboboxProps {
  onInterestAdd?: (interest: string) => void;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onSearchValueChange?: (value: string) => void;
}

const interests = [
  // Technologie
  { value: "programmation", label: "Programmation" },
  { value: "intelligence_artificielle", label: "Intelligence Artificielle" },
  { value: "robotique", label: "Robotique" },
  { value: "blockchain", label: "Blockchain" },
  { value: "cybersecurite", label: "Cybersécurité" },
  { value: "jeux_video", label: "Jeux Vidéo" },
  { value: "realite_virtuelle", label: "Réalité Virtuelle" },
  
  // Arts & Créativité
  { value: "dessin", label: "Dessin" },
  { value: "peinture", label: "Peinture" },
  { value: "photographie", label: "Photographie" },
  { value: "musique", label: "Musique" },
  { value: "chant", label: "Chant" },
  { value: "danse", label: "Danse" },
  { value: "theatre", label: "Théâtre" },
  { value: "ecriture", label: "Écriture" },
  { value: "cinema", label: "Cinéma" },
  
  // Sports
  { value: "football", label: "Football" },
  { value: "basketball", label: "Basketball" },
  { value: "tennis", label: "Tennis" },
  { value: "natation", label: "Natation" },
  { value: "course", label: "Course à Pied" },
  { value: "fitness", label: "Fitness" },
  { value: "yoga", label: "Yoga" },
  { value: "arts_martiaux", label: "Arts Martiaux" },
  { value: "cyclisme", label: "Cyclisme" },
  
  // Culture & Éducation
  { value: "lecture", label: "Lecture" },
  { value: "histoire", label: "Histoire" },
  { value: "philosophie", label: "Philosophie" },
  { value: "sciences", label: "Sciences" },
  { value: "mathematiques", label: "Mathématiques" },
  { value: "langues", label: "Apprentissage des Langues" },
  { value: "debat", label: "Débat" },
  { value: "conferences", label: "Conférences" },
  
  // Social & Communautaire
  { value: "benevolat", label: "Bénévolat" },
  { value: "aide_humanitaire", label: "Aide Humanitaire" },
  { value: "environnement", label: "Protection de l'Environnement" },
  { value: "politique", label: "Politique" },
  { value: "droits_humains", label: "Droits de l'Homme" },
  { value: "education", label: "Éducation" },
  
  // Voyage & Découverte
  { value: "voyage", label: "Voyage" },
  { value: "cultures", label: "Découverte des Cultures" },
  { value: "gastronomie", label: "Gastronomie" },
  { value: "cuisine", label: "Cuisine" },
  { value: "randonnee", label: "Randonnée" },
  { value: "camping", label: "Camping" },
  
  // Business & Entrepreneuriat
  { value: "entrepreneuriat", label: "Entrepreneuriat" },
  { value: "startup", label: "Startups" },
  { value: "investissement", label: "Investissement" },
  { value: "marketing", label: "Marketing" },
  { value: "vente", label: "Vente" },
  { value: "leadership", label: "Leadership" },
  
  // Loisirs
  { value: "jardinage", label: "Jardinage" },
  { value: "bricolage", label: "Bricolage" },
  { value: "collection", label: "Collection" },
  { value: "jeux_societe", label: "Jeux de Société" },
  { value: "echecs", label: "Échecs" },
  { value: "puzzle", label: "Puzzles" },
  
  // Mode & Style
  { value: "mode", label: "Mode" },
  { value: "beaute", label: "Beauté" },
  { value: "style", label: "Style" },
  { value: "shopping", label: "Shopping" },
  
  // Santé & Bien-être
  { value: "meditation", label: "Méditation" },
  { value: "nutrition", label: "Nutrition" },
  { value: "sante", label: "Santé" },
  { value: "developpement_personnel", label: "Développement Personnel" },
  
  // Autres
  { value: "animaux", label: "Animaux" },
  { value: "nature", label: "Nature" },
  { value: "astronomie", label: "Astronomie" },
  { value: "mecanique", label: "Mécanique" },
  { value: "electronique", label: "Électronique" },
];

export function InterestsCombobox({
  onInterestAdd,
  value: externalValue,
  onValueChange,
  placeholder = "Ajouter un centre d'intérêt",
  className,
  disabled = false,
  onSearchValueChange,
}: InterestsComboboxProps) {
  const [internalValue, setInternalValue] = useState("");

  const value = externalValue !== undefined ? externalValue : internalValue;
  const setValue = onValueChange !== undefined ? onValueChange : setInternalValue;

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    // If it's a selection from the list, we can add it immediately
    if (newValue && onInterestAdd && interests.some(i => i.value === newValue || i.label === newValue)) {
      onInterestAdd(newValue);
      setValue(""); 
    }
  };

  return (
    <Combobox
      options={interests}
      value={value}
      onValueChange={handleValueChange}
      placeholder={placeholder}
      searchPlaceholder="Rechercher un centre d'intérêt..."
      emptyMessage="Aucun centre d'intérêt trouvé."
      className={className}
      disabled={disabled}
      allowCustomValue={true}
      onSearchValueChange={onSearchValueChange}
    />
  );
}