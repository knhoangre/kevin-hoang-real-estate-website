import { Link as ScrollLink } from "react-scroll";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "./UserAvatar";
import { Menu, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "./Logo";
import { 
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    if (isHomePage) {
      window.scrollTo(0, 0);
    }
  }, [isHomePage]);

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
        <Logo />
        
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2" aria-label="Toggle menu">
                <Menu size={24} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <div className="p-6 space-y-4">
                <div className="mb-8">
                  <Logo />
                </div>
                
                {isHomePage ? (
                  <ScrollLink 
                    to="about" 
                    smooth={true} 
                    duration={500}
                    offset={-80}
                    className="block py-2 text-[#1a1a1a] uppercase"
                    onClick={() => document.querySelector('[data-radix-popper-content-wrapper]')?.remove()}
                  >
                    ABOUT
                  </ScrollLink>
                ) : (
                  <RouterLink 
                    to="/" 
                    className="block py-2 text-[#1a1a1a] uppercase"
                  >
                    ABOUT
                  </RouterLink>
                )}
                
                <RouterLink 
                  to="/buyer" 
                  className={`block py-2 text-[#1a1a1a] uppercase ${location.pathname === '/buyer' ? 'font-semibold' : ''}`}
                >
                  BUYER
                </RouterLink>
                
                <RouterLink 
                  to="/seller" 
                  className={`block py-2 text-[#1a1a1a] uppercase ${location.pathname === '/seller' ? 'font-semibold' : ''}`}
                >
                  SELLER
                </RouterLink>
                
                <RouterLink 
                  to="/neighborhoods" 
                  className={`block py-2 text-[#1a1a1a] uppercase ${location.pathname === '/neighborhoods' ? 'font-semibold' : ''}`}
                >
                  NEIGHBORHOODS
                </RouterLink>
                
                <RouterLink 
                  to="/blog" 
                  className={`block py-2 text-[#1a1a1a] uppercase ${location.pathname === '/blog' ? 'font-semibold' : ''}`}
                >
                  BLOG
                </RouterLink>
                
                <RouterLink 
                  to="/faq" 
                  className={`block py-2 text-[#1a1a1a] uppercase ${location.pathname === '/faq' ? 'font-semibold' : ''}`}
                >
                  FAQ
                </RouterLink>
                
                {isHomePage ? (
                  <ScrollLink 
                    to="contact" 
                    smooth={true} 
                    duration={500}
                    offset={-80}
                    className="block py-2 text-[#1a1a1a] uppercase"
                    onClick={() => document.querySelector('[data-radix-popper-content-wrapper]')?.remove()}
                  >
                    CONTACT
                  </ScrollLink>
                ) : (
                  <RouterLink 
                    to="/contact" 
                    className="block py-2 text-[#1a1a1a] uppercase"
                  >
                    CONTACT
                  </RouterLink>
                )}

                {user ? (
                  <div className="flex items-center py-2 justify-between">
                    <UserAvatar />
                    <button 
                      onClick={() => signOut()}
                      className="text-sm text-gray-600"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <RouterLink 
                    to="/auth" 
                    className={`block py-2 text-[#1a1a1a] uppercase ${location.pathname === '/auth' ? 'font-semibold' : ''}`}
                  >
                    LOGIN
                  </RouterLink>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        <div className="hidden md:flex space-x-5 items-center">
          {isHomePage ? (
            <>
              <ScrollLink 
                to="about" 
                smooth={true} 
                duration={500}
                offset={-80}
                className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase text-sm"
              >
                <span className="relative">
                  ABOUT
                  <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </ScrollLink>
              
              <DropdownMenu>
                <DropdownMenuTrigger className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase flex items-center text-sm">
                  <span className="relative flex items-center">
                    BUYER
                    <ChevronDown size={16} className="ml-1" />
                    <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem asChild>
                    <RouterLink to="/buyer" className="w-full">Buyer Resources</RouterLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <RouterLink to="/first-time-buyers" className="w-full">First-Time Buyer Guide</RouterLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase flex items-center text-sm">
                  <span className="relative flex items-center">
                    SELLER
                    <ChevronDown size={16} className="ml-1" />
                    <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem asChild>
                    <RouterLink to="/seller" className="w-full">Seller Resources</RouterLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <RouterLink to="/blog?category=selling-tips" className="w-full">Selling Tips</RouterLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <RouterLink 
                to="/neighborhoods" 
                className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase text-sm"
              >
                <span className="relative">
                  NEIGHBORHOODS
                  <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </RouterLink>
              
              <DropdownMenu>
                <DropdownMenuTrigger className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase flex items-center text-sm">
                  <span className="relative flex items-center">
                    RESOURCES
                    <ChevronDown size={16} className="ml-1" />
                    <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem asChild>
                    <RouterLink to="/blog" className="w-full">BLOG</RouterLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <RouterLink to="/faq" className="w-full">FAQ</RouterLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <RouterLink 
                to="/contact" 
                className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase text-sm"
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
          ) : (
            <>
              <RouterLink 
                to="/" 
                className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase text-sm"
              >
                <span className="relative">
                  ABOUT
                  <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </RouterLink>
              
              <DropdownMenu>
                <DropdownMenuTrigger className={`text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase flex items-center text-sm ${location.pathname === '/buyer' ? 'font-semibold' : ''}`}>
                  <span className="relative flex items-center">
                    BUYER
                    <ChevronDown size={16} className="ml-1" />
                    <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem asChild>
                    <RouterLink to="/buyer" className="w-full">Buyer Resources</RouterLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <RouterLink to="/first-time-buyers" className="w-full">First-Time Buyer Guide</RouterLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger className={`text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase flex items-center text-sm ${location.pathname === '/seller' ? 'font-semibold' : ''}`}>
                  <span className="relative flex items-center">
                    SELLER
                    <ChevronDown size={16} className="ml-1" />
                    <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem asChild>
                    <RouterLink to="/seller" className="w-full">Seller Resources</RouterLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <RouterLink to="/blog?category=selling-tips" className="w-full">Selling Tips</RouterLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <RouterLink 
                to="/neighborhoods" 
                className={`text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase text-sm ${location.pathname === '/neighborhoods' ? 'font-semibold' : ''}`}
              >
                <span className="relative">
                  NEIGHBORHOODS
                  <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </RouterLink>
              
              <DropdownMenu>
                <DropdownMenuTrigger className={`text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase flex items-center text-sm ${location.pathname === '/blog' || location.pathname === '/faq' ? 'font-semibold' : ''}`}>
                  <span className="relative flex items-center">
                    RESOURCES
                    <ChevronDown size={16} className="ml-1" />
                    <span className="absolute -bottom-[6px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem asChild>
                    <RouterLink to="/blog" className="w-full">BLOG</RouterLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <RouterLink to="/faq" className="w-full">FAQ</RouterLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <RouterLink 
                to="/contact" 
                className={`text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase text-sm ${location.pathname === '/contact' ? 'font-semibold' : ''}`}
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
    </nav>
  );
};

export default Navbar;
