
import { Link as ScrollLink } from "react-scroll";
import { Link as RouterLink, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

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
                  <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </ScrollLink>
              
              <RouterLink 
                to="/neighborhoods" 
                className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase"
              >
                <span className="relative">
                  NEIGHBORHOODS
                  <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </RouterLink>
              
              <RouterLink 
                to="/blog" 
                className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase"
              >
                <span className="relative">
                  BLOG
                  <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
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
                  <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </ScrollLink>

              <ScrollLink 
                to="faq" 
                smooth={true} 
                duration={500}
                className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase"
              >
                <span className="relative">
                  FAQ
                  <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </ScrollLink>
            </>
          ) : (
            <>
              <RouterLink 
                to="/" 
                className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase"
              >
                <span className="relative">
                  ABOUT
                  <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </RouterLink>
              
              <RouterLink 
                to="/neighborhoods" 
                className={`text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase ${location.pathname === '/neighborhoods' ? 'font-semibold' : ''}`}
              >
                <span className="relative">
                  NEIGHBORHOODS
                  <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </RouterLink>
              
              <RouterLink 
                to="/blog" 
                className={`text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase ${location.pathname === '/blog' ? 'font-semibold' : ''}`}
              >
                <span className="relative">
                  BLOG
                  <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </RouterLink>
              
              <RouterLink 
                to="/#contact" 
                className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase"
              >
                <span className="relative">
                  CONTACT
                  <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </RouterLink>

              <RouterLink 
                to="/#faq" 
                className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase"
              >
                <span className="relative">
                  FAQ
                  <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </span>
              </RouterLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
