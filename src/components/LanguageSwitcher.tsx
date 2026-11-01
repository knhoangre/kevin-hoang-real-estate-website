import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LANGUAGE_STORAGE_KEY } from '@/i18n';
import { hasDarkHero } from '@/lib/navItems';
import { alternatesFor } from '@/lib/viRoutes';
import { isZhPath, zhPairFor } from '@/lib/zhRoutes';

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

  const className = `group relative text-sm uppercase tracking-wider transition-colors ${
    overDark ? 'text-white hover:text-champagne' : 'text-ink hover:text-champagne-ink'
  }`;
  const underline = (
    <span
      className={`absolute bottom-[-4px] left-1/2 h-0.5 w-0 -translate-x-1/2 transition-all duration-300 group-hover:w-full ${
        overDark ? 'bg-champagne' : 'bg-champagne-ink'
      }`}
    />
  );

  // Chinese is its own set of pages, not a toggle over this one's copy, so both
  // of these are links: to this page's other version where it has one, and to
  // the other tree's home where it does not.
  if (isZhPath(location.pathname)) {
    return (
      <Link to={alternatesFor(location.pathname)?.en ?? '/'} lang="en" className={className}>
        ENGLISH
        {underline}
      </Link>
    );
  }

  return (
    <>
      <button onClick={toggleLanguage} className={className} aria-label="Toggle language">
        {buttonText}
        {underline}
      </button>
      <Link
        to={zhPairFor(location.pathname)?.zh ?? '/zh'}
        lang="zh-Hans"
        aria-label="中文 (Chinese)"
        className={className}
      >
        中文
        {underline}
      </Link>
    </>
  );
};

export default LanguageSwitcher;
