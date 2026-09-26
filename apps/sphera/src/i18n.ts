import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonFr from '@cs/i18n/locales/fr/common.json';
import commonEn from '@cs/i18n/locales/en/common.json';

import authFr from './locales/fr/auth.json';
import authEn from './locales/en/auth.json';

import blogFr from './locales/fr/blog.json';
import blogEn from './locales/en/blog.json';

import landingFr from './locales/fr/landing.json';
import landingEn from './locales/en/landing.json';

import legalFr from './locales/fr/legal.json';
import legalEn from './locales/en/legal.json';

import liveFr from './locales/fr/live.json';
import liveEn from './locales/en/live.json';

import navigationFr from './locales/fr/navigation.json';
import navigationEn from './locales/en/navigation.json';

import pricingFr from './locales/fr/pricing.json';
import pricingEn from './locales/en/pricing.json';

import settingsFr from './locales/fr/settings.json';
import settingsEn from './locales/en/settings.json';

import showcaseFr from './locales/fr/showcase.json';
import showcaseEn from './locales/en/showcase.json';

import studyFr from './locales/fr/study.json';
import studyEn from './locales/en/study.json';

import { DEFAULT_LANGUAGE, STORAGE_KEY_LANGUAGE } from '@cs/i18n';

export const resources = {
  fr: {
    common: commonFr,
    auth: authFr,
    blog: blogFr,
    landing: landingFr,
    legal: legalFr,
    live: liveFr,
    navigation: navigationFr,
    pricing: pricingFr,
    settings: settingsFr,
    showcase: showcaseFr,
    study: studyFr,
  },
  en: {
    common: commonEn,
    auth: authEn,
    blog: blogEn,
    landing: landingEn,
    legal: legalEn,
    live: liveEn,
    navigation: navigationEn,
    pricing: pricingEn,
    settings: settingsEn,
    showcase: showcaseEn,
    study: studyEn,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: ['fr', 'en'],
    load: 'languageOnly',
    cleanCode: true,
    nonExplicitSupportedLngs: true,
    defaultNS: 'common',
    ns: [
      'common',
      'auth',
      'blog',
      'landing',
      'legal',
      'live',
      'navigation',
      'pricing',
      'settings',
      'showcase',
      'study',
    ],
    resources,
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: STORAGE_KEY_LANGUAGE,
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Keep HTML document lang in sync
if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language || DEFAULT_LANGUAGE;
  i18n.on('languageChanged', (lng: string) => {
    document.documentElement.lang = lng;
  });
}

export default i18n;
