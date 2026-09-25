import i18n, { type InitOptions, type Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonFr from './locales/fr/common.json';
import commonEn from './locales/en/common.json';
import { DEFAULT_LANGUAGE, STORAGE_KEY_LANGUAGE } from './types.ts';

const defaultResources: Resource = {
  fr: { common: commonFr },
  en: { common: commonEn },
};

export function setupI18n(options?: InitOptions) {
  const mergedResources: Resource = {
    fr: { ...defaultResources.fr, ...options?.resources?.fr },
    en: { ...defaultResources.en, ...options?.resources?.en },
  };

  const instance = i18n.createInstance();

  instance
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: ['fr', 'en'],
      defaultNS: 'common',
      fallbackNS: 'common',
      ns: ['common'],
      resources: mergedResources,
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: STORAGE_KEY_LANGUAGE,
        caches: ['localStorage'],
      },
      interpolation: {
        escapeValue: false,
      },
      ...options,
    });

  // Keep HTML document lang attribute in sync
  if (typeof document !== 'undefined') {
    document.documentElement.lang = instance.language || DEFAULT_LANGUAGE;
    instance.on('languageChanged', (lng: string) => {
      document.documentElement.lang = lng;
    });
  }

  return instance;
}

// Global default singleton instance
export const defaultI18n = setupI18n();

export default defaultI18n;
