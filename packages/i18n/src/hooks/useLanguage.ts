import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_LANGUAGE,
  STORAGE_KEY_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '../types.ts';

function normalizeLanguage(lang: string | undefined): SupportedLanguage {
  if (!lang) return DEFAULT_LANGUAGE;
  const prefix = lang.split('-')[0].toLowerCase();
  if (prefix === 'en') return 'en';
  return 'fr';
}

export function useLanguage() {
  const { i18n, t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() =>
    normalizeLanguage(i18n.language)
  );

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      const normalized = normalizeLanguage(lng);
      setCurrentLanguage(normalized);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_LANGUAGE, normalized);
        window.dispatchEvent(
          new CustomEvent('cs:language-change', { detail: { language: normalized } })
        );
      }
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const changeLanguage = useCallback(
    async (lang: SupportedLanguage) => {
      await i18n.changeLanguage(lang);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_LANGUAGE, lang);
      }
    },
    [i18n]
  );

  return {
    currentLanguage,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isFrench: currentLanguage === 'fr',
    isEnglish: currentLanguage === 'en',
    t,
    i18n,
  };
}
