import React from 'react';
import { I18nextProvider } from 'react-i18next';
import type { i18n as I18nInstance } from 'i18next';
import defaultI18n from '../instance.ts';

export interface I18nProviderProps {
  i18n?: I18nInstance;
  children: React.ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  i18n = defaultI18n,
  children,
}) => {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};
