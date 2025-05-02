import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "./Logo";
import ProfileDropdown from "./ProfileDropdown";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
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
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => handleNavigation('/buyer')}
              className={`text-sm uppercase tracking-wider ${getTextColorClass()} ${getHoverColorClass()} transition-colors relative group ${
                location.pathname === '/buyer' ? 'font-bold' : ''
              }`}
            >
              BUYER
              <span
                className={`absolute bottom-[-4px] left-1/2 w-0 h-0.5 ${getUnderlineColorClass()} group-hover:w-full transition-all duration-300 -translate-x-1/2 ${
                  location.pathname === '/buyer' ? 'w-full' : ''
                }`}
              />
            </button>

            <button
              onClick={() => handleNavigation('/seller')}
              className={`text-sm uppercase tracking-wider ${getTextColorClass()} ${getHoverColorClass()} transition-colors relative group ${
                location.pathname === '/seller' ? 'font-bold' : ''
              }`}
            >
              SELLER
              <span
                className={`absolute bottom-[-4px] left-1/2 w-0 h-0.5 ${getUnderlineColorClass()} group-hover:w-full transition-all duration-300 -translate-x-1/2 ${
                  location.pathname === '/seller' ? 'w-full' : ''
                }`}
              />
            </button>

            <button
              onClick={() => handleNavigation('/neighborhoods')}
              className={`text-sm uppercase tracking-wider ${getTextColorClass()} ${getHoverColorClass()} transition-colors relative group ${
                location.pathname === '/neighborhoods' ? 'font-bold' : ''
              }`}
            >
              NEIGHBORHOODS
              <span
                className={`absolute bottom-[-4px] left-1/2 w-0 h-0.5 ${getUnderlineColorClass()} group-hover:w-full transition-all duration-300 -translate-x-1/2 ${
                  location.pathname === '/neighborhoods' ? 'w-full' : ''
                }`}
              />
            </button>

            <button
              onClick={() => handleNavigation('/blog')}
              className={`text-sm uppercase tracking-wider ${getTextColorClass()} ${getHoverColorClass()} transition-colors relative group ${
                location.pathname === '/blog' ? 'font-bold' : ''
              }`}
            >
              BLOG
              <span
                className={`absolute bottom-[-4px] left-1/2 w-0 h-0.5 ${getUnderlineColorClass()} group-hover:w-full transition-all duration-300 -translate-x-1/2 ${
                  location.pathname === '/blog' ? 'w-full' : ''
                }`}
              />
            </button>

            <button
              onClick={() => handleNavigation('/faq')}
              className={`text-sm uppercase tracking-wider ${getTextColorClass()} ${getHoverColorClass()} transition-colors relative group ${
                location.pathname === '/faq' ? 'font-bold' : ''
              }`}
            >
              FAQ
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
              CONTACT
              <span
                className={`absolute bottom-[-4px] left-1/2 w-0 h-0.5 ${getUnderlineColorClass()} group-hover:w-full transition-all duration-300 -translate-x-1/2 ${
                  location.pathname === '/contact' ? 'w-full' : ''
                }`}
              />
            </button>

            {user ? (
              <ProfileDropdown />
            ) : (
              <RouterLink
                to="/auth"
                className={`text-sm uppercase tracking-wider ${getTextColorClass()} ${getHoverColorClass()} transition-colors relative group`}
              >
                LOGIN
                <span className={`absolute bottom-[-4px] left-1/2 w-0 h-0.5 ${getUnderlineColorClass()} group-hover:w-full transition-all duration-300 -translate-x-1/2`} />
              </RouterLink>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
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
            <div className="container mx-auto px-4 pt-24 pb-8">
              <motion.div className="flex flex-col space-y-6" variants={itemVariants}>
                <button
                  onClick={() => handleNavigation('/buyer')}
                  className={`text-sm uppercase tracking-wider text-black hover:text-gray-600 transition-colors relative group ${
                    location.pathname === '/buyer' ? 'font-bold' : ''
                  }`}
                >
                  BUYER
                  <span
                    className={`absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300 -translate-x-1/2 ${
                      location.pathname === '/buyer' ? 'w-full' : ''
                    }`}
                  />
                </button>

                <button
                  onClick={() => handleNavigation('/seller')}
                  className={`text-sm uppercase tracking-wider text-black hover:text-gray-600 transition-colors relative group ${
                    location.pathname === '/seller' ? 'font-bold' : ''
                  }`}
                >
                  SELLER
                  <span
                    className={`absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300 -translate-x-1/2 ${
                      location.pathname === '/seller' ? 'w-full' : ''
                    }`}
                  />
                </button>

                <button
                  onClick={() => handleNavigation('/neighborhoods')}
                  className={`text-sm uppercase tracking-wider text-black hover:text-gray-600 transition-colors relative group ${
                    location.pathname === '/neighborhoods' ? 'font-bold' : ''
                  }`}
                >
                  NEIGHBORHOODS
                  <span
                    className={`absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300 -translate-x-1/2 ${
                      location.pathname === '/neighborhoods' ? 'w-full' : ''
                    }`}
                  />
                </button>

                <button
                  onClick={() => handleNavigation('/blog')}
                  className={`text-sm uppercase tracking-wider text-black hover:text-gray-600 transition-colors relative group ${
                    location.pathname === '/blog' ? 'font-bold' : ''
                  }`}
                >
                  BLOG
                  <span
                    className={`absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300 -translate-x-1/2 ${
                      location.pathname === '/blog' ? 'w-full' : ''
                    }`}
                  />
                </button>

                <button
                  onClick={() => handleNavigation('/faq')}
                  className={`text-sm uppercase tracking-wider text-black hover:text-gray-600 transition-colors relative group ${
                    location.pathname === '/faq' ? 'font-bold' : ''
                  }`}
                >
                  FAQ
                  <span
                    className={`absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300 -translate-x-1/2 ${
                      location.pathname === '/faq' ? 'w-full' : ''
                    }`}
                  />
                </button>

                <button
                  onClick={() => handleNavigation('/contact')}
                  className={`text-sm uppercase tracking-wider text-black hover:text-gray-600 transition-colors relative group ${
                    location.pathname === '/contact' ? 'font-bold' : ''
                  }`}
                >
                  CONTACT
                  <span
                    className={`absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300 -translate-x-1/2 ${
                      location.pathname === '/contact' ? 'w-full' : ''
                    }`}
                  />
                </button>

                {user ? (
                  <ProfileDropdown />
                ) : (
                  <RouterLink
                    to="/auth"
                    className="text-sm uppercase tracking-wider text-black hover:text-gray-600 transition-colors relative group"
                  >
                    LOGIN
                    <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                  </RouterLink>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
