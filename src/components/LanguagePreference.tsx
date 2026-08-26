import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
} from '@/i18n';

/**
 * Applies the visitor's stored language preference AFTER mount.
 *
 * This deliberately does not run during render. Every page is prerendered in
 * English, so the client's first render must also be English or React cannot
 * hydrate the existing markup. Switching the language in an effect means the
 * swap happens on the second render, after hydration has already succeeded.
 *
 * Falls back to English on a stored value we do not recognise, and tolerates
 * localStorage being unavailable (private windows, blocked site data).
 */
const LanguagePreference = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    } catch {
      return;
    }

    const isSupported = (v: string | null): v is (typeof SUPPORTED_LANGUAGES)[number] =>
      v != null && (SUPPORTED_LANGUAGES as readonly string[]).includes(v);

    const next = isSupported(stored) ? stored : DEFAULT_LANGUAGE;
    if (next !== i18n.language) void i18n.changeLanguage(next);
    document.documentElement.lang = next;
  }, [i18n]);

  return null;
};

export default LanguagePreference;
