import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LANGUAGE_STORAGE_KEY } from '@/i18n';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const isHomePage = location.pathname === '/';

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

  // Determine text color based on page and scroll position
  const getTextColorClass = () => {
    if (isHomePage && !isScrolled) {
      return "text-white";
    }
    return "text-black";
  };

  // Determine hover color based on page and scroll position
  const getHoverColorClass = () => {
    if (isHomePage && !isScrolled) {
      return "hover:text-gray-200";
    }
    return "hover:text-gray-600";
  };

  // Determine underline color based on page and scroll position
  const getUnderlineColorClass = () => {
    if (isHomePage && !isScrolled) {
      return "bg-white";
    }
    return "bg-black";
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`text-sm uppercase tracking-wider ${getTextColorClass()} ${getHoverColorClass()} transition-colors relative group`}
      aria-label="Toggle language"
    >
      {buttonText}
      <span className={`absolute bottom-[-4px] left-1/2 w-0 h-0.5 ${getUnderlineColorClass()} group-hover:w-full transition-all duration-300 -translate-x-1/2`} />
    </button>
  );
};

export default LanguageSwitcher;