import { describe, it, expect } from 'vitest';
import { setupI18n } from './instance.ts';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './types.ts';

describe('@cs/i18n core (fr & en)', () => {
  it('defines correct supported languages and default language', () => {
    expect(DEFAULT_LANGUAGE).toBe('fr');
    expect(SUPPORTED_LANGUAGES.map((l) => l.code)).toEqual(['fr', 'en']);
  });

  it('translates common keys in French by default', () => {
    const i18n = setupI18n({ lng: 'fr' });
    expect(i18n.t('actions.save')).toBe('Enregistrer');
    expect(i18n.t('actions.cancel')).toBe('Annuler');
    expect(i18n.t('status.success')).toBe('Succès');
  });

  it('translates common keys in English when language is switched', async () => {
    const i18n = setupI18n({ lng: 'fr' });
    await i18n.changeLanguage('en');
    expect(i18n.t('actions.save')).toBe('Save');
    expect(i18n.t('actions.cancel')).toBe('Cancel');
    expect(i18n.t('status.success')).toBe('Success');
  });

  it('supports custom namespaces and resources', () => {
    const i18n = setupI18n({
      lng: 'fr',
      resources: {
        fr: {
          custom: { hello: 'Bonjour le monde' },
        },
        en: {
          custom: { hello: 'Hello world' },
        },
      },
    });

    expect(i18n.t('hello', { ns: 'custom' })).toBe('Bonjour le monde');
    i18n.changeLanguage('en');
    expect(i18n.t('hello', { ns: 'custom' })).toBe('Hello world');
  });
});
