import { useState } from "react";
import { Combobox } from "@/components/ui/combobox";

interface LanguageComboboxProps {
  onLanguageAdd?: (language: string) => void;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onSearchValueChange?: (value: string) => void;
}

const languages = [
  { value: "francais", label: "Français" },
  { value: "anglais", label: "Anglais" },
  { value: "espagnol", label: "Espagnol" },
  { value: "allemand", label: "Allemand" },
  { value: "chinois", label: "Chinois (Mandarin)" },
  { value: "arabe", label: "Arabe" },
  { value: "portugais", label: "Portugais" },
  { value: "italien", label: "Italien" },
  { value: "japonais", label: "Japonais" },
  { value: "coreen", label: "Coréen" },
  { value: "russe", label: "Russe" },
  { value: "turc", label: "Turc" },
  { value: "wolof", label: "Wolof" },
  { value: "swahili", label: "Swahili" },
  { value: "lingala", label: "Lingala" },
  { value: "yoruba", label: "Yoruba" },
  { value: "haoussa", label: "Haoussa" },
  { value: "ewe", label: "Ewe" },
  { value: "douala", label: "Douala" },
  { value: "ewondo", label: "Ewondo" },
  { value: "bamiléké", label: "Bamiléké" },
  { value: "fulfulde", label: "Fulfulde" },
];

export function LanguageCombobox({
  onLanguageAdd,
  value: externalValue,
  onValueChange,
  placeholder = "Ajouter une langue",
  className,
  disabled = false,
  onSearchValueChange,
}: LanguageComboboxProps) {
  const [internalValue, setInternalValue] = useState("");

  const value = externalValue !== undefined ? externalValue : internalValue;
  const setValue = onValueChange !== undefined ? onValueChange : setInternalValue;

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    // If it's a selection from the list, we can add it immediately
    if (newValue && onLanguageAdd && languages.some(l => l.value === newValue || l.label === newValue)) {
      onLanguageAdd(newValue);
      setValue(""); 
    }
  };

  return (
    <Combobox
      options={languages}
      value={value}
      onValueChange={handleValueChange}
      placeholder={placeholder}
      searchPlaceholder="Rechercher une langue..."
      emptyMessage="Aucune langue trouvée."
      className={className}
      disabled={disabled}
      allowCustomValue={true}
      onSearchValueChange={onSearchValueChange}
    />
  );
}
