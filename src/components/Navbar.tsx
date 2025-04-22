
import { Link as ScrollLink } from "react-scroll";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "./UserAvatar";
import { Menu } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const Navbar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isHomePage = location.pathname === "/";

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

  return (
    <nav className="fixed w-full bg-white/80 backdrop-blur-sm z-50 border-b">
      <div className="container mx-auto flex justify-between items-center h-16 px-4">
        {isHomePage ? (
          <ScrollLink to="home" smooth={true} duration={500} className="text-2xl font-bold text-[#1a1a1a] cursor-pointer">
            KH
          </ScrollLink>
        ) : (
          <RouterLink to="/" className="text-2xl font-bold text-[#1a1a1a]">
            KH
          </RouterLink>
        )}
        
        <div className="md:hidden">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2"
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
        </div>
        
        <div className="hidden md:flex space-x-8 items-center">
          {isHomePage ? (
            <>
              <ScrollLink 
                to="about" 
                smooth={true} 
                duration={500}
                className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase"
              >
                <span className="relative">
                  ABOUT
                  <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </ScrollLink>
              
              <RouterLink 
                to="/buyer" 
                className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase"
              >
                <span className="relative">
                  BUYER
                  <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </RouterLink>
              
              <RouterLink 
                to="/seller" 
                className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase"
              >
                <span className="relative">
                  SELLER
                  <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </RouterLink>
              
              <RouterLink 
                to="/neighborhoods" 
                className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase"
              >
                <span className="relative">
                  NEIGHBORHOODS
                  <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </RouterLink>
              
              <RouterLink 
                to="/blog" 
                className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase"
              >
                <span className="relative">
                  BLOG
                  <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </RouterLink>
              
              <RouterLink 
                to="/faq" 
                className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase"
              >
                <span className="relative">
                  FAQ
                  <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </RouterLink>
              
              <ScrollLink 
                to="contact" 
                smooth={true} 
                duration={500}
                className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase"
              >
                <span className="relative">
                  CONTACT
                  <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </ScrollLink>

              {user ? (
                <RouterLink to="/" onClick={() => signOut()} className="flex items-center gap-2">
                  <UserAvatar />
                </RouterLink>
              ) : (
                <RouterLink 
                  to="/auth" 
                  className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase"
                >
                  <span className="relative">
                    LOGIN
                    <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                  </span>
                </RouterLink>
              )}
            </>
          ) : (
            <>
              <RouterLink 
                to="/" 
                className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase"
              >
                <span className="relative">
                  ABOUT
                  <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </RouterLink>
              
              <RouterLink 
                to="/buyer" 
                className={`text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase ${location.pathname === '/buyer' ? 'font-semibold' : ''}`}
              >
                <span className="relative">
                  BUYER
                  <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </RouterLink>
              
              <RouterLink 
                to="/seller" 
                className={`text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase ${location.pathname === '/seller' ? 'font-semibold' : ''}`}
              >
                <span className="relative">
                  SELLER
                  <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </RouterLink>
              
              <RouterLink 
                to="/neighborhoods" 
                className={`text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase ${location.pathname === '/neighborhoods' ? 'font-semibold' : ''}`}
              >
                <span className="relative">
                  NEIGHBORHOODS
                  <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </RouterLink>
              
              <RouterLink 
                to="/blog" 
                className={`text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase ${location.pathname === '/blog' ? 'font-semibold' : ''}`}
              >
                <span className="relative">
                  BLOG
                  <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </RouterLink>
              
              <RouterLink 
                to="/faq" 
                className={`text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase ${location.pathname === '/faq' ? 'font-semibold' : ''}`}
              >
                <span className="relative">
                  FAQ
                  <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </RouterLink>
              
              <RouterLink 
                to="/#contact" 
                className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase"
              >
                <span className="relative">
                  CONTACT
                  <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </RouterLink>

              {user ? (
                <RouterLink to="/" onClick={() => signOut()} className="flex items-center gap-2">
                  <UserAvatar />
                </RouterLink>
              ) : (
                <RouterLink 
                  to="/auth" 
                  className={`text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase ${location.pathname === '/auth' ? 'font-semibold' : ''}`}
                >
                  <span className="relative">
                    LOGIN
                    <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                  </span>
                </RouterLink>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="md:hidden bg-white border-b"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {isHomePage ? (
                <>
                  <motion.div variants={itemVariants}>
                    <ScrollLink 
                      to="about" 
                      smooth={true} 
                      duration={500}
                      className="block py-2 text-[#1a1a1a] uppercase"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      ABOUT
                    </ScrollLink>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <RouterLink 
                      to="/buyer" 
                      className="block py-2 text-[#1a1a1a] uppercase"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      BUYER
                    </RouterLink>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <RouterLink 
                      to="/seller" 
                      className="block py-2 text-[#1a1a1a] uppercase"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      SELLER
                    </RouterLink>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <RouterLink 
                      to="/neighborhoods" 
                      className="block py-2 text-[#1a1a1a] uppercase"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      NEIGHBORHOODS
                    </RouterLink>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <RouterLink 
                      to="/blog" 
                      className="block py-2 text-[#1a1a1a] uppercase"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      BLOG
                    </RouterLink>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <RouterLink 
                      to="/faq" 
                      className="block py-2 text-[#1a1a1a] uppercase"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      FAQ
                    </RouterLink>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <ScrollLink 
                      to="contact" 
                      smooth={true} 
                      duration={500}
                      className="block py-2 text-[#1a1a1a] uppercase"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      CONTACT
                    </ScrollLink>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    {user ? (
                      <div className="flex items-center py-2 justify-between">
                        <UserAvatar />
                        <button 
                          onClick={() => {
                            signOut();
                            setMobileMenuOpen(false);
                          }}
                          className="text-sm text-gray-600"
                        >
                          Sign Out
                        </button>
                      </div>
                    ) : (
                      <RouterLink 
                        to="/auth" 
                        className="block py-2 text-[#1a1a1a] uppercase"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        LOGIN
                      </RouterLink>
                    )}
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div variants={itemVariants}>
                    <RouterLink 
                      to="/" 
                      className="block py-2 text-[#1a1a1a] uppercase"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      ABOUT
                    </RouterLink>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <RouterLink 
                      to="/buyer" 
                      className={`block py-2 text-[#1a1a1a] uppercase ${location.pathname === '/buyer' ? 'font-semibold' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      BUYER
                    </RouterLink>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <RouterLink 
                      to="/seller" 
                      className={`block py-2 text-[#1a1a1a] uppercase ${location.pathname === '/seller' ? 'font-semibold' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      SELLER
                    </RouterLink>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <RouterLink 
                      to="/neighborhoods" 
                      className={`block py-2 text-[#1a1a1a] uppercase ${location.pathname === '/neighborhoods' ? 'font-semibold' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      NEIGHBORHOODS
                    </RouterLink>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <RouterLink 
                      to="/blog" 
                      className={`block py-2 text-[#1a1a1a] uppercase ${location.pathname === '/blog' ? 'font-semibold' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      BLOG
                    </RouterLink>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <RouterLink 
                      to="/faq" 
                      className={`block py-2 text-[#1a1a1a] uppercase ${location.pathname === '/faq' ? 'font-semibold' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      FAQ
                    </RouterLink>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <RouterLink 
                      to="/#contact" 
                      className="block py-2 text-[#1a1a1a] uppercase"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      CONTACT
                    </RouterLink>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    {user ? (
                      <div className="flex items-center py-2 justify-between">
                        <UserAvatar />
                        <button 
                          onClick={() => {
                            signOut();
                            setMobileMenuOpen(false);
                          }}
                          className="text-sm text-gray-600"
                        >
                          Sign Out
                        </button>
                      </div>
                    ) : (
                      <RouterLink 
                        to="/auth" 
                        className={`block py-2 text-[#1a1a1a] uppercase ${location.pathname === '/auth' ? 'font-semibold' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        LOGIN
                      </RouterLink>
                    )}
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
