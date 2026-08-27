import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LANGUAGE_STORAGE_KEY } from '@/i18n';
import { hasDarkHero } from '@/lib/navItems';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  // Same rule as the rest of the bar: transparent chrome over any ink-deep
  // hero, not just the homepage. This used to check `pathname === '/'`, so on
  // /about and the landing pages the label rendered near-black on near-black.
  const overDark = hasDarkHero(location.pathname) && !isScrolled;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    // If we see "TIẾNG VIỆT" (current language is 'en'), switch to 'vi'
    // If we see "ENGLISH" (current language is 'vi'), switch to 'en'
    const newLanguage = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLanguage);
    document.documentElement.lang = newLanguage;
    // Persisting the choice used to be i18next-browser-languagedetector's job
    // via `caches: ['localStorage']`. That detector was removed because it read
    // storage during module init and broke hydration, so the write lives here
    // now. <LanguagePreference/> reads this key back on the next page load.
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
    } catch {
      // Private windows / blocked site data: the toggle still works for this
      // session, it just will not be remembered.
    }
  };

  // Always show Vietnamese first, then English
  const buttonText = i18n.language === 'vi' ? 'ENGLISH' : 'TIẾNG VIỆT';

  return (
    <button
      onClick={toggleLanguage}
      className={`group relative text-sm uppercase tracking-wider transition-colors ${
        overDark ? 'text-white hover:text-champagne' : 'text-ink hover:text-champagne-ink'
      }`}
      aria-label="Toggle language"
    >
      {buttonText}
      <span
        className={`absolute bottom-[-4px] left-1/2 h-0.5 w-0 -translate-x-1/2 transition-all duration-300 group-hover:w-full ${
          overDark ? 'bg-champagne' : 'bg-champagne-ink'
        }`}
      />
    </button>
  );
};

export default LanguageSwitcher;