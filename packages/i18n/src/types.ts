export type SupportedLanguage = 'fr' | 'en';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'fr', label: 'Français', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧' },
];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'fr';
export const STORAGE_KEY_LANGUAGE = 'cs_language';
