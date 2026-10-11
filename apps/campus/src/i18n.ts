import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonFr from '@cs/i18n/locales/fr/common.json';
import commonEn from '@cs/i18n/locales/en/common.json';

import navigationFr from './locales/fr/navigation.json';
import navigationEn from './locales/en/navigation.json';

import settingsFr from './locales/fr/settings.json';
import settingsEn from './locales/en/settings.json';

import messagesFr from './locales/fr/messages.json';
import messagesEn from './locales/en/messages.json';

import resourcesFr from './locales/fr/resources.json';
import resourcesEn from './locales/en/resources.json';

import feedFr from './locales/fr/feed.json';
import feedEn from './locales/en/feed.json';

import spheresFr from './locales/fr/spheres.json';
import spheresEn from './locales/en/spheres.json';

import eventsFr from './locales/fr/events.json';
import eventsEn from './locales/en/events.json';

import authFr from './locales/fr/auth.json';
import authEn from './locales/en/auth.json';

import notificationsFr from './locales/fr/notifications.json';
import notificationsEn from './locales/en/notifications.json';

import connectionsFr from './locales/fr/connections.json';
import connectionsEn from './locales/en/connections.json';

import profileFr from './locales/fr/profile.json';
import profileEn from './locales/en/profile.json';

import { DEFAULT_LANGUAGE, STORAGE_KEY_LANGUAGE } from '@cs/i18n';

export const resources = {
  fr: {
    common: commonFr,
    navigation: navigationFr,
    settings: settingsFr,
    messages: messagesFr,
    resources: resourcesFr,
    feed: feedFr,
    spheres: spheresFr,
    events: eventsFr,
    auth: authFr,
    notifications: notificationsFr,
    connections: connectionsFr,
    profile: profileFr,
  },
  en: {
    common: commonEn,
    navigation: navigationEn,
    settings: settingsEn,
    messages: messagesEn,
    resources: resourcesEn,
    feed: feedEn,
    spheres: spheresEn,
    events: eventsEn,
    auth: authEn,
    notifications: notificationsEn,
    connections: connectionsEn,
    profile: profileEn,
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
    fallbackNS: [
      'common',
      'navigation',
      'settings',
      'messages',
      'resources',
      'feed',
      'spheres',
      'events',
      'auth',
      'notifications',
      'connections',
      'profile',
    ],
    ns: [
      'common',
      'navigation',
      'settings',
      'messages',
      'resources',
      'feed',
      'spheres',
      'events',
      'auth',
      'notifications',
      'connections',
      'profile',
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

// Keep HTML document lang attribute in sync
if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language || DEFAULT_LANGUAGE;
  i18n.on('languageChanged', (lng: string) => {
    document.documentElement.lang = lng;
  });
}

export default i18n;
