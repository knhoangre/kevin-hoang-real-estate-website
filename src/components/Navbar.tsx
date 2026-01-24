import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { X, Menu } from "lucide-react";
import Logo from "./Logo";
import ProfileDropdown from "./ProfileDropdown";
import LanguageSwitcher from "./LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.3,
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white shadow-md" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <RouterLink to="/" className="relative z-10">
            <Logo className="h-20 w-auto" />
          </RouterLink>

          {/* Desktop Navigation */}
          <div className="hidden min-[1011px]:flex items-center space-x-8">
            <button
              onClick={() => handleNavigation('/properties')}
              className={`text-sm uppercase tracking-wider ${getTextColorClass()} ${getHoverColorClass()} transition-colors relative group ${
                location.pathname === '/properties' ? 'font-bold' : ''
              }`}
            >
              PROPERTIES
              <span
                className={`absolute bottom-[-4px] left-1/2 w-0 h-0.5 ${getUnderlineColorClass()} group-hover:w-full transition-all duration-300 -translate-x-1/2 ${
                  location.pathname === '/properties' ? 'w-full' : ''
                }`}
              />
            </button>

            <button
              onClick={() => handleNavigation('/faq')}
              className={`text-sm uppercase tracking-wider ${getTextColorClass()} ${getHoverColorClass()} transition-colors relative group ${
                location.pathname === '/faq' ? 'font-bold' : ''
              }`}
            >
              {t('nav.faq')}
              <span
                className={`absolute bottom-[-4px] left-1/2 w-0 h-0.5 ${getUnderlineColorClass()} group-hover:w-full transition-all duration-300 -translate-x-1/2 ${
                  location.pathname === '/faq' ? 'w-full' : ''
                }`}
              />
            </button>

            <button
              onClick={() => handleNavigation('/contact')}
              className={`text-sm uppercase tracking-wider ${getTextColorClass()} ${getHoverColorClass()} transition-colors relative group ${
                location.pathname === '/contact' ? 'font-bold' : ''
              }`}
            >
              {t('nav.contact')}
              <span
                className={`absolute bottom-[-4px] left-1/2 w-0 h-0.5 ${getUnderlineColorClass()} group-hover:w-full transition-all duration-300 -translate-x-1/2 ${
                  location.pathname === '/contact' ? 'w-full' : ''
                }`}
              />
            </button>

            {/* Language Switcher */}
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`text-[0.9375rem] ${getTextColorClass()} ${getHoverColorClass()} hover:bg-transparent p-0 h-auto font-normal relative group`}
                    aria-label="Phone number"
                  >
                    860-682-2251
                    <span className={`absolute bottom-[-4px] left-1/2 w-0 h-0.5 ${getUnderlineColorClass()} group-hover:w-full transition-all duration-300 -translate-x-1/2`} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer"
                  >
                    <a
                      href="tel:8606822251"
                      className="w-full"
                    >
                      CALL
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer"
                  >
                    <a
                      href="sms:8606822251"
                      className="w-full"
                    >
                      TEXT
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Menu Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`p-1 ${getTextColorClass()} ${getHoverColorClass()} hover:bg-transparent`}
                  aria-label="Menu"
                >
                  <Menu className="h-8 w-8" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => handleNavigation('/buyer')}
                  className={`cursor-pointer uppercase ${
                    location.pathname === '/buyer' ? 'font-bold bg-accent' : ''
                  }`}
                >
                  {t('nav.buyer')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigation('/seller')}
                  className={`cursor-pointer uppercase ${
                    location.pathname === '/seller' ? 'font-bold bg-accent' : ''
                  }`}
                >
                  {t('nav.seller')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigation('/relocation')}
                  className={`cursor-pointer uppercase ${
                    location.pathname === '/relocation' ? 'font-bold bg-accent' : ''
                  }`}
                >
                  {t('nav.relocation')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigation('/neighborhoods')}
                  className={`cursor-pointer uppercase ${
                    location.pathname === '/neighborhoods' ? 'font-bold bg-accent' : ''
                  }`}
                >
                  {t('nav.neighborhoods')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigation('/blog')}
                  className={`cursor-pointer uppercase ${
                    location.pathname === '/blog' ? 'font-bold bg-accent' : ''
                  }`}
                >
                  {t('nav.blog')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigation('/calculator')}
                  className={`cursor-pointer uppercase ${
                    location.pathname === '/calculator' ? 'font-bold bg-accent' : ''
                  }`}
                >
                  {t('nav.calculator')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <ProfileDropdown onItemClick={() => {}} />
            ) : (
              <RouterLink
                to="/auth"
                className={`text-sm uppercase tracking-wider ${getTextColorClass()} ${getHoverColorClass()} transition-colors relative group`}
              >
                {t('nav.login')}
                <span className={`absolute bottom-[-4px] left-1/2 w-0 h-0.5 ${getUnderlineColorClass()} group-hover:w-full transition-all duration-300 -translate-x-1/2`} />
              </RouterLink>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="max-[1010px]:flex min-[1011px]:hidden items-center gap-4">
            <LanguageSwitcher />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative z-10 p-2"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-5 relative">
                <span
                  className={`absolute h-0.5 w-6 ${isHomePage && !isScrolled ? 'bg-white' : 'bg-black'} transform transition-all duration-300 ${
                    mobileMenuOpen ? "rotate-45 top-2" : "rotate-0 top-0"
                  }`}
                />
                <span
                  className={`absolute h-0.5 w-6 ${isHomePage && !isScrolled ? 'bg-white' : 'bg-black'} top-2 transition-all duration-300 ${
                    mobileMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute h-0.5 w-6 ${isHomePage && !isScrolled ? 'bg-white' : 'bg-black'} transform transition-all duration-300 ${
                    mobileMenuOpen ? "-rotate-45 top-2" : "rotate-0 top-4"
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-white z-40"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={mobileMenuVariants}
          >
            {/* Close X Button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 text-black hover:text-gray-600 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="container mx-auto px-4 pt-24 pb-8 h-full flex flex-col">
              <motion.div className="flex flex-col space-y-6 flex-grow items-center" variants={itemVariants}>
                <button
                  onClick={() => handleNavigation('/buyer')}
                  className={`text-sm uppercase tracking-wider text-black hover:text-gray-600 transition-colors relative group inline-block text-center ${
                    location.pathname === '/buyer' ? 'font-bold' : ''
                  }`}
                >
                  {t('nav.buyer')}
                  <span
                    className={`absolute bottom-[-4px] left-0 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300 ${
                      location.pathname === '/buyer' ? 'w-full' : ''
                    }`}
                  />
                </button>

                <button
                  onClick={() => handleNavigation('/seller')}
                  className={`text-sm uppercase tracking-wider text-black hover:text-gray-600 transition-colors relative group inline-block text-center ${
                    location.pathname === '/seller' ? 'font-bold' : ''
                  }`}
                >
                  {t('nav.seller')}
                  <span
                    className={`absolute bottom-[-4px] left-0 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300 ${
                      location.pathname === '/seller' ? 'w-full' : ''
                    }`}
                  />
                </button>

                <button
                  onClick={() => handleNavigation('/relocation')}
                  className={`text-sm uppercase tracking-wider text-black hover:text-gray-600 transition-colors relative group inline-block text-center ${
                    location.pathname === '/relocation' ? 'font-bold' : ''
                  }`}
                >
                  {t('nav.relocation')}
                  <span
                    className={`absolute bottom-[-4px] left-0 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300 ${
                      location.pathname === '/relocation' ? 'w-full' : ''
                    }`}
                  />
                </button>

                <button
                  onClick={() => handleNavigation('/neighborhoods')}
                  className={`text-sm uppercase tracking-wider text-black hover:text-gray-600 transition-colors relative group inline-block text-center ${
                    location.pathname === '/neighborhoods' ? 'font-bold' : ''
                  }`}
                >
                  {t('nav.neighborhoods')}
                  <span
                    className={`absolute bottom-[-4px] left-0 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300 ${
                      location.pathname === '/neighborhoods' ? 'w-full' : ''
                    }`}
                  />
                </button>

                <button
                  onClick={() => handleNavigation('/blog')}
                  className={`text-sm uppercase tracking-wider text-black hover:text-gray-600 transition-colors relative group inline-block text-center ${
                    location.pathname === '/blog' ? 'font-bold' : ''
                  }`}
                >
                  {t('nav.blog')}
                  <span
                    className={`absolute bottom-[-4px] left-0 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300 ${
                      location.pathname === '/blog' ? 'w-full' : ''
                    }`}
                  />
                </button>

                <button
                  onClick={() => handleNavigation('/calculator')}
                  className={`text-sm uppercase tracking-wider text-black hover:text-gray-600 transition-colors relative group inline-block text-center ${
                    location.pathname === '/calculator' ? 'font-bold' : ''
                  }`}
                >
                  {t('nav.calculator')}
                  <span
                    className={`absolute bottom-[-4px] left-0 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300 ${
                      location.pathname === '/calculator' ? 'w-full' : ''
                    }`}
                  />
                </button>

                <button
                  onClick={() => handleNavigation('/properties')}
                  className={`text-sm uppercase tracking-wider text-black hover:text-gray-600 transition-colors relative group inline-block text-center ${
                    location.pathname === '/properties' ? 'font-bold' : ''
                  }`}
                >
                  PROPERTIES
                  <span
                    className={`absolute bottom-[-4px] left-0 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300 ${
                      location.pathname === '/properties' ? 'w-full' : ''
                    }`}
                  />
                </button>

                <button
                  onClick={() => handleNavigation('/faq')}
                  className={`text-sm uppercase tracking-wider text-black hover:text-gray-600 transition-colors relative group inline-block text-center ${
                    location.pathname === '/faq' ? 'font-bold' : ''
                  }`}
                >
                  {t('nav.faq')}
                  <span
                    className={`absolute bottom-[-4px] left-0 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300 ${
                      location.pathname === '/faq' ? 'w-full' : ''
                    }`}
                  />
                </button>

                <button
                  onClick={() => handleNavigation('/contact')}
                  className={`text-sm uppercase tracking-wider text-black hover:text-gray-600 transition-colors relative group inline-block text-center ${
                    location.pathname === '/contact' ? 'font-bold' : ''
                  }`}
                >
                  {t('nav.contact')}
                  <span
                    className={`absolute bottom-[-4px] left-0 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300 ${
                      location.pathname === '/contact' ? 'w-full' : ''
                    }`}
                  />
                </button>

                {user ? (
                  <div className="flex justify-center">
                    <ProfileDropdown onItemClick={() => setMobileMenuOpen(false)} align="center" />
                  </div>
                ) : (
                  <RouterLink
                    to="/auth"
                    className="text-sm uppercase tracking-wider text-black hover:text-gray-600 transition-colors relative group inline-block text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.login')}
                    <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300" />
                  </RouterLink>
                )}
              </motion.div>
              
              {/* Exit Menu Button */}
              <motion.div variants={itemVariants} className="mt-auto pb-8 flex justify-center">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm uppercase tracking-wider text-black hover:text-gray-600 transition-colors relative group inline-block text-center py-4 border-t border-gray-200"
                >
                  EXIT MENU
                  <span className="absolute bottom-2 left-0 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300" />
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
