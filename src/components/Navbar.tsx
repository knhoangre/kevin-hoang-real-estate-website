import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { X, Menu } from "lucide-react";
import Logo from "./Logo";
import ProfileDropdown from "./ProfileDropdown";
import LanguageSwitcher from "./LanguageSwitcher";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [phoneDropdownOpen, setPhoneDropdownOpen] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const phoneContentRef = useRef<HTMLDivElement>(null);
  const menuContentRef = useRef<HTMLDivElement>(null);
  const phoneWrapperRef = useRef<HTMLDivElement>(null);
  const menuWrapperRef = useRef<HTMLDivElement>(null);
  const phoneHoveringRef = useRef(false);
  const menuHoveringRef = useRef(false);
  const phoneIsOpenRef = useRef(false);
  const menuIsOpenRef = useRef(false);
  const phoneCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phoneGraceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuGraceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);
  const HOVER_CLOSE_DELAY_MS = 0;
  const OPEN_GRACE_PERIOD_MS = 0;
  const isHomePage = location.pathname === '/';

  const isOverPhoneArea = (el: Element | null) =>
    el &&
    (phoneWrapperRef.current?.contains(el) || phoneContentRef.current?.contains(el));

  const isOverMenuArea = (el: Element | null) =>
    el &&
    (menuWrapperRef.current?.contains(el) || menuContentRef.current?.contains(el));

  const closePhone = () => {
    if (phoneCloseTimeoutRef.current) {
      clearTimeout(phoneCloseTimeoutRef.current);
      phoneCloseTimeoutRef.current = null;
    }
    if (phoneGraceTimeoutRef.current) {
      clearTimeout(phoneGraceTimeoutRef.current);
      phoneGraceTimeoutRef.current = null;
    }
    phoneHoveringRef.current = false;
    phoneIsOpenRef.current = false;
    setPhoneDropdownOpen(false);
  };

  const closeMenu = () => {
    if (menuCloseTimeoutRef.current) {
      clearTimeout(menuCloseTimeoutRef.current);
      menuCloseTimeoutRef.current = null;
    }
    if (menuGraceTimeoutRef.current) {
      clearTimeout(menuGraceTimeoutRef.current);
      menuGraceTimeoutRef.current = null;
    }
    menuHoveringRef.current = false;
    menuIsOpenRef.current = false;
    setMenuDropdownOpen(false);
  };

  const runClosePhone = () => {
    const el = document.elementFromPoint(lastMouseX.current, lastMouseY.current);
    if (isOverPhoneArea(el)) return;
    closePhone();
  };

  const runCloseMenu = () => {
    const el = document.elementFromPoint(lastMouseX.current, lastMouseY.current);
    if (isOverMenuArea(el)) return;
    closeMenu();
  };

  const phoneOpenByHover = () => {
    if (phoneCloseTimeoutRef.current) {
      clearTimeout(phoneCloseTimeoutRef.current);
      phoneCloseTimeoutRef.current = null;
    }
    if (phoneGraceTimeoutRef.current) {
      clearTimeout(phoneGraceTimeoutRef.current);
      phoneGraceTimeoutRef.current = null;
    }
    phoneHoveringRef.current = true;
    phoneIsOpenRef.current = true;
    setPhoneDropdownOpen(true);
    phoneGraceTimeoutRef.current = setTimeout(() => {
      phoneGraceTimeoutRef.current = null;
      if (phoneIsOpenRef.current) {
        const el = document.elementFromPoint(lastMouseX.current, lastMouseY.current);
        if (!isOverPhoneArea(el)) closePhone();
      }
    }, OPEN_GRACE_PERIOD_MS);
  };

  const menuOpenByHover = () => {
    if (menuCloseTimeoutRef.current) {
      clearTimeout(menuCloseTimeoutRef.current);
      menuCloseTimeoutRef.current = null;
    }
    if (menuGraceTimeoutRef.current) {
      clearTimeout(menuGraceTimeoutRef.current);
      menuGraceTimeoutRef.current = null;
    }
    menuHoveringRef.current = true;
    menuIsOpenRef.current = true;
    setMenuDropdownOpen(true);
    menuGraceTimeoutRef.current = setTimeout(() => {
      menuGraceTimeoutRef.current = null;
      if (menuIsOpenRef.current) {
        const el = document.elementFromPoint(lastMouseX.current, lastMouseY.current);
        if (!isOverMenuArea(el)) closeMenu();
      }
    }, OPEN_GRACE_PERIOD_MS);
  };

  const handlePhoneTriggerLeave = () => {
    if (phoneGraceTimeoutRef.current) return;
    if (phoneCloseTimeoutRef.current) clearTimeout(phoneCloseTimeoutRef.current);
    phoneCloseTimeoutRef.current = setTimeout(runClosePhone, HOVER_CLOSE_DELAY_MS);
  };

  const handleMenuTriggerLeave = () => {
    if (menuGraceTimeoutRef.current) return;
    if (menuCloseTimeoutRef.current) clearTimeout(menuCloseTimeoutRef.current);
    menuCloseTimeoutRef.current = setTimeout(runCloseMenu, HOVER_CLOSE_DELAY_MS);
  };

  const handlePhoneContentEnter = () => {
    if (phoneGraceTimeoutRef.current) {
      clearTimeout(phoneGraceTimeoutRef.current);
      phoneGraceTimeoutRef.current = null;
    }
    if (phoneCloseTimeoutRef.current) {
      clearTimeout(phoneCloseTimeoutRef.current);
      phoneCloseTimeoutRef.current = null;
    }
    phoneHoveringRef.current = true;
    if (!phoneIsOpenRef.current) {
      phoneIsOpenRef.current = true;
      setPhoneDropdownOpen(true);
    }
  };

  const handleMenuContentEnter = () => {
    if (menuGraceTimeoutRef.current) {
      clearTimeout(menuGraceTimeoutRef.current);
      menuGraceTimeoutRef.current = null;
    }
    if (menuCloseTimeoutRef.current) {
      clearTimeout(menuCloseTimeoutRef.current);
      menuCloseTimeoutRef.current = null;
    }
    menuHoveringRef.current = true;
    if (!menuIsOpenRef.current) {
      menuIsOpenRef.current = true;
      setMenuDropdownOpen(true);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (phoneCloseTimeoutRef.current) clearTimeout(phoneCloseTimeoutRef.current);
      if (menuCloseTimeoutRef.current) clearTimeout(menuCloseTimeoutRef.current);
      if (phoneGraceTimeoutRef.current) clearTimeout(phoneGraceTimeoutRef.current);
      if (menuGraceTimeoutRef.current) clearTimeout(menuGraceTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const track = (e: MouseEvent) => {
      lastMouseX.current = e.clientX;
      lastMouseY.current = e.clientY;
    };
    document.addEventListener("mousemove", track, { passive: true });
    return () => document.removeEventListener("mousemove", track);
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
            <LanguageSwitcher />

            {/* Phone Number - hover to open (custom panel, no Radix) */}
            <div
              ref={phoneWrapperRef}
              className="relative"
              onMouseEnter={phoneOpenByHover}
              onMouseLeave={handlePhoneTriggerLeave}
            >
              <Button
                variant="ghost"
                className={`text-sm uppercase tracking-wider ${getTextColorClass()} ${getHoverColorClass()} hover:bg-transparent p-0 h-auto font-normal`}
                aria-label="Phone number"
              >
                860-682-2251
              </Button>
              <AnimatePresence>
                {phoneDropdownOpen && (
                  <motion.div
                    ref={phoneContentRef}
                    key="phone-panel"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full z-50 min-w-[8rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
                  >
                    <a
                      href="tel:8606822251"
                      className="flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent"
                    >
                      CALL
                    </a>
                    <a
                      href="sms:8606822251"
                      className="flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent"
                    >
                      TEXT
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Menu Dropdown - hover to open (custom panel, no Radix) */}
            <div
              ref={menuWrapperRef}
              className="relative"
              onMouseEnter={menuOpenByHover}
              onMouseLeave={handleMenuTriggerLeave}
            >
              <Button
                variant="ghost"
                className={`p-1 ${getTextColorClass()} ${getHoverColorClass()} hover:bg-transparent`}
                aria-label="Menu"
              >
                <Menu className="h-8 w-8" />
              </Button>
              <AnimatePresence>
                {menuDropdownOpen && (
                  <motion.div
                    ref={menuContentRef}
                    key="menu-panel"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full z-50 w-48 min-w-[8rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
                  >
                    <button
                      type="button"
                      onClick={() => handleNavigation('/buyer')}
                      className={`flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent uppercase ${
                        location.pathname === '/buyer' ? 'font-bold bg-accent' : ''
                      }`}
                    >
                      {t('nav.buyer')}
                    </button>
                    <div className="-mx-1 my-1 h-px bg-muted" />
                    <button
                      type="button"
                      onClick={() => handleNavigation('/seller')}
                      className={`flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent uppercase ${
                        location.pathname === '/seller' ? 'font-bold bg-accent' : ''
                      }`}
                    >
                      {t('nav.seller')}
                    </button>
                    <div className="-mx-1 my-1 h-px bg-muted" />
                    <button
                      type="button"
                      onClick={() => handleNavigation('/relocation')}
                      className={`flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent uppercase ${
                        location.pathname === '/relocation' ? 'font-bold bg-accent' : ''
                      }`}
                    >
                      {t('nav.relocation')}
                    </button>
                    <div className="-mx-1 my-1 h-px bg-muted" />
                    <button
                      type="button"
                      onClick={() => handleNavigation('/neighborhoods')}
                      className={`flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent uppercase ${
                        location.pathname === '/neighborhoods' ? 'font-bold bg-accent' : ''
                      }`}
                    >
                      {t('nav.neighborhoods')}
                    </button>
                    <div className="-mx-1 my-1 h-px bg-muted" />
                    <button
                      type="button"
                      onClick={() => handleNavigation('/blog')}
                      className={`flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent uppercase ${
                        location.pathname === '/blog' ? 'font-bold bg-accent' : ''
                      }`}
                    >
                      {t('nav.blog')}
                    </button>
                    <div className="-mx-1 my-1 h-px bg-muted" />
                    <button
                      type="button"
                      onClick={() => handleNavigation('/calculator')}
                      className={`flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent uppercase ${
                        location.pathname === '/calculator' ? 'font-bold bg-accent' : ''
                      }`}
                    >
                      {t('nav.calculator')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
              <motion.div className="flex flex-col space-y-3 flex-grow items-center w-full max-w-xs mx-auto px-4" variants={itemVariants}>
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
                <div className="w-full h-px bg-border -mx-4"></div>

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
                <div className="w-full h-px bg-border -mx-4"></div>

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
                <div className="w-full h-px bg-border -mx-4"></div>

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
                <div className="w-full h-px bg-border -mx-4"></div>

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
                <div className="w-full h-px bg-border -mx-4"></div>

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
                <div className="w-full h-px bg-border -mx-4"></div>

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
                <div className="w-full h-px bg-border -mx-4"></div>

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
                <div className="w-full h-px bg-border -mx-4"></div>

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
                <div className="w-full h-px bg-border -mx-4"></div>

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
