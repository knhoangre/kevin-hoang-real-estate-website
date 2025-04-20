
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="fixed w-full bg-white/80 backdrop-blur-sm z-50 border-b">
      <div className="container mx-auto flex justify-between items-center h-16 px-4">
        <Link to="/" className="text-2xl font-bold text-realDark">KH</Link>
        
        <div className="hidden md:flex space-x-8">
          <Link to="/" className="text-realDark hover:text-realPurple transition-colors">Home</Link>
          <a href="#about" className="text-realDark hover:text-realPurple transition-colors">About</a>
          <a href="#services" className="text-realDark hover:text-realPurple transition-colors">Services</a>
          <a href="#testimonials" className="text-realDark hover:text-realPurple transition-colors">Testimonials</a>
        </div>
        
        <Button asChild className="bg-realPurple hover:bg-realDark transition-colors">
          <a href="#contact">Contact</a>
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
