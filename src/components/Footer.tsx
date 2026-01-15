import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import useScrollToTop from "@/hooks/useScrollToTop";
import ContactQRCode from "./ContactQRCode";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const scrollToTop = useScrollToTop();
  const { t } = useTranslation();

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
              <a href="tel:+16175551234" className="group relative text-gray-300 hover:text-white transition-colors">
                (860) 682-2251
                <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 -translate-x-1/2" />
              </a>
            </div>
            <div className="flex items-center space-x-4 mb-2">
              <Mail className="h-4 w-4" />
              <a href="mailto:KNHOANGRE@GMAIL.COM" className="group relative text-gray-300 hover:text-white transition-colors">
                KNHOANGRE@GMAIL.COM
                <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 -translate-x-1/2" />
              </a>
            </div>
            <div className="flex items-center space-x-4 mb-2">
              <MapPin className="h-4 w-4" />
              <a
                href="https://maps.google.com/?q=150+WEST+ST,+NEEDHAM,+MA+02494"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative text-gray-300 hover:text-white transition-colors"
              >
                150 WEST ST, NEEDHAM, MA 02494
                <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 -translate-x-1/2" />
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <Calendar className="h-4 w-4" />
              <a
                href="https://calendar.app.google/P297MnAu7ei6turA6"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative text-gray-300 hover:text-white transition-colors uppercase"
              >
                SET AN APPOINTMENT WITH ME
                <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 -translate-x-1/2" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">{t('footer.quick_links')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" onClick={handleLinkClick} className="group relative text-gray-300 hover:text-white transition-colors inline-block uppercase">
                  {t('nav.home')}
                  <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </Link>
              </li>
              <li>
                <Link to="/about" onClick={handleLinkClick} className="group relative text-gray-300 hover:text-white transition-colors inline-block uppercase">
                  {t('footer.about')}
                  <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </Link>
              </li>
              <li>
                <Link to="/blog" onClick={handleLinkClick} className="group relative text-gray-300 hover:text-white transition-colors inline-block uppercase">
                  {t('nav.blog')}
                  <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </Link>
              </li>
              <li>
                <Link to="/contact" onClick={handleLinkClick} className="group relative text-gray-300 hover:text-white transition-colors inline-block uppercase">
                  {t('footer.contact')}
                  <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">{t('footer.legal')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy-policy" onClick={handleLinkClick} className="group relative text-gray-300 hover:text-white transition-colors inline-block uppercase">
                  {t('footer.privacy_policy')}
                  <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" onClick={handleLinkClick} className="group relative text-gray-300 hover:text-white transition-colors inline-block uppercase">
                  {t('footer.terms_of_service')}
                  <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" onClick={handleLinkClick} className="group relative text-gray-300 hover:text-white transition-colors inline-block uppercase">
                  {t('footer.disclaimer')}
                  <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 -translate-x-1/2" />
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