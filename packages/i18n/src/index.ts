export * from './types.ts';
export * from './instance.ts';
export * from './hooks/useLanguage.ts';
export * from './components/LanguageSwitcher.tsx';
export * from './components/I18nProvider.tsx';

// Re-export common react-i18next primitives for convenience across apps
export { useTranslation, Trans, withTranslation } from 'react-i18next';
export type { TFunction, i18n as I18nInstance } from 'i18next';

export { default } from './instance.ts';
