import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import useScrollToTop from "@/hooks/useScrollToTop";
import ContactQRCode from "./ContactQRCode";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const scrollToTop = useScrollToTop();

  // Function to handle link clicks
  const handleLinkClick = () => {
    scrollToTop();
  };

  return (
    <footer className="bg-[#1a1a1a] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4">KEVIN HOANG</h3>
            <div className="flex items-center space-x-4 mb-2">
              <Phone className="h-4 w-4" />
              <a href="tel:+16175551234" className="text-gray-300 hover:text-white transition-colors">
                (860) 682-2251
              </a>
            </div>
            <div className="flex items-center space-x-4 mb-2">
              <Mail className="h-4 w-4" />
              <a href="mailto:KNHOANGRE@GMAIL.COM" className="text-gray-300 hover:text-white transition-colors">
                KNHOANGRE@GMAIL.COM
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <MapPin className="h-4 w-4" />
              <a
                href="https://maps.google.com/?q=150+WEST+ST,+NEEDHAM,+MA+02494"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors"
              >
                150 WEST ST, NEEDHAM, MA 02494
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">QUICK LINKS</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" onClick={handleLinkClick} className="text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" onClick={handleLinkClick} className="text-gray-300 hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/buyer" onClick={handleLinkClick} className="text-gray-300 hover:text-white transition-colors">
                  Buyer's Guide
                </Link>
              </li>
              <li>
                <Link to="/seller" onClick={handleLinkClick} className="text-gray-300 hover:text-white transition-colors">
                  Seller's Guide
                </Link>
              </li>
              <li>
                <Link to="/blog" onClick={handleLinkClick} className="text-gray-300 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/contact" onClick={handleLinkClick} className="text-gray-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">LEGAL</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy-policy" onClick={handleLinkClick} className="text-gray-300 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" onClick={handleLinkClick} className="text-gray-300 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" onClick={handleLinkClick} className="text-gray-300 hover:text-white transition-colors">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex justify-center md:justify-end">
            <ContactQRCode />
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            &copy; {currentYear} Kevin Hoang. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm">
            Created by <span className="font-semibold">Kevin Hoang</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;