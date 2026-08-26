import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enTranslations from './locales/en.json';
import viTranslations from './locales/vi.json';

const resources = {
  en: {
    translation: enTranslations
  },
  vi: {
    translation: viTranslations
  }
};

/**
 * Initialised WITHOUT i18next-browser-languagedetector.
 *
 * The detector reads localStorage and navigator.language at module scope. This
 * module is in every route's graph, so at static-generation time those do not
 * exist — and worse, when they do exist the client's first render would pick
 * `vi` while the prerendered HTML says `en`, and React would fail to hydrate
 * the entire page.
 *
 * Every render therefore starts from the same language the pages were built
 * in, and the stored preference is applied after mount by
 * <LanguagePreference/> (src/components/LanguagePreference.tsx).
 */
export const DEFAULT_LANGUAGE = 'en';
export const SUPPORTED_LANGUAGES = ['en', 'vi'] as const;
export const LANGUAGE_STORAGE_KEY = 'i18nextLng';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    debug: false,

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
