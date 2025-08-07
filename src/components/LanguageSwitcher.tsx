import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

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
    const newLanguage = i18n.language === 'en' ? 'vi' : 'en';
    i18n.changeLanguage(newLanguage);
  };

  const buttonText = i18n.language === 'en' ? 'TIẾNG VIỆT' : 'ENGLISH';

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