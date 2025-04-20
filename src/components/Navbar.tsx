
import { Link as ScrollLink } from "react-scroll";
import { Link as RouterLink } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="fixed w-full bg-white/80 backdrop-blur-sm z-50 border-b">
      <div className="container mx-auto flex justify-between items-center h-16 px-4">
        <ScrollLink to="home" smooth={true} duration={500} className="text-2xl font-bold text-[#1a1a1a] cursor-pointer">
          KH
        </ScrollLink>
        
        <div className="hidden md:flex space-x-8 items-center">
          <ScrollLink 
            to="home" 
            smooth={true} 
            duration={500}
            className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase"
          >
            <span className="relative">
              HOME
              <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
            </span>
          </ScrollLink>
          
          <ScrollLink 
            to="about" 
            smooth={true} 
            duration={500}
            className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase"
          >
            <span className="relative">
              ABOUT
              <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
            </span>
          </ScrollLink>
          
          <RouterLink 
            to="/neighborhoods" 
            className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase"
          >
            <span className="relative">
              NEIGHBORHOODS
              <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
            </span>
          </RouterLink>
          
          <RouterLink 
            to="/blog" 
            className="text-[#1a1a1a] hover:text-[#1a1a1a] relative group uppercase"
          >
            <span className="relative">
              BLOG
              <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
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
              <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
            </span>
          </ScrollLink>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
