import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import useScrollToTop from "@/hooks/useScrollToTop";
import ContactQRCode from "./ContactQRCode";
import { SITE, telHref } from "@/lib/siteConfig";

/**
 * One definition for the footer link treatment. Every link here used to repeat
 * the same underline <span> inline, which is how a set of links drifts apart.
 */
const FooterLink = ({
  to,
  onClick,
  children,
}: {
  to: string;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <li>
    <Link
      to={to}
      onClick={onClick}
      className="group relative text-gray-300 hover:text-white transition-colors inline-block uppercase"
    >
      {children}
      <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 -translate-x-1/2" />
    </Link>
  </li>
);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4">KEVIN HOANG</h3>
            <div className="flex items-center space-x-4 mb-2">
              <Phone className="h-4 w-4" />
              {/* Both the href and the label come from SITE now. They used to be
                  written out separately here and had drifted apart: the link
                  dialled +1 617 555 1234 while the text said (860) 682-2251.
                  NAP has to be identical everywhere or it suppresses local
                  ranking — and in this case the call button did not work. */}
              <a href={telHref} className="group relative text-gray-300 hover:text-white transition-colors">
                {SITE.phone}
                <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 -translate-x-1/2" />
              </a>
            </div>
            <div className="flex items-center space-x-4 mb-2">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${SITE.email}`} className="group relative text-gray-300 hover:text-white transition-colors uppercase">
                {SITE.email}
                <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 -translate-x-1/2" />
              </a>
            </div>
            <div className="flex items-center space-x-4 mb-2">
              <MapPin className="h-4 w-4" />
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(
                  `${SITE.address.streetAddress}, ${SITE.address.addressLocality}, ${SITE.address.addressRegion} ${SITE.address.postalCode}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative text-gray-300 hover:text-white transition-colors"
              >
                {`${SITE.address.streetAddress}, ${SITE.address.addressLocality}, ${SITE.address.addressRegion} ${SITE.address.postalCode}`}
                <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 -translate-x-1/2" />
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <Calendar className="h-4 w-4" />
              <a
                href={SITE.appointmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative text-gray-300 hover:text-white transition-colors uppercase"
              >
                SET AN APPOINTMENT WITH ME
                <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 -translate-x-1/2" />
              </a>
            </div>
          </div>

          {/*
            These columns are the site's crawlable link graph.

            The Navbar renders its dropdown menus through AnimatePresence, so
            those links are mounted only after a user opens the menu and are
            absent from the prerendered HTML entirely. Before this, /buyer,
            /faq, /properties and the Vietnamese page had no inbound internal
            link on any page — findable only through the sitemap, which is a far
            weaker signal. The footer is prerendered on all 122 pages, so
            listing them here gives every page a real inbound link.
          */}
          <div>
            <h3 className="text-xl font-bold mb-4">{t('footer.quick_links')}</h3>
            <ul className="space-y-2">
              <FooterLink to="/" onClick={handleLinkClick}>{t('nav.home')}</FooterLink>
              {/* Was `/about`, which has no route and 404d from the footer of
                  every page on the site. */}
              <FooterLink to="/needham-real-estate-agent" onClick={handleLinkClick}>
                {t('footer.about')}
              </FooterLink>
              <FooterLink to="/neighborhoods" onClick={handleLinkClick}>Areas Served</FooterLink>
              <FooterLink to="/properties" onClick={handleLinkClick}>Listings</FooterLink>
              <FooterLink to="/blog" onClick={handleLinkClick}>{t('nav.blog')}</FooterLink>
              <FooterLink to="/testimonials" onClick={handleLinkClick}>Reviews</FooterLink>
              <FooterLink to="/contact" onClick={handleLinkClick}>{t('footer.contact')}</FooterLink>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Guides &amp; Services</h3>
            <ul className="space-y-2">
              <FooterLink to="/home-valuation" onClick={handleLinkClick}>Free Home Valuation</FooterLink>
              <FooterLink to="/buyer" onClick={handleLinkClick}>Buyer&rsquo;s Guide</FooterLink>
              <FooterLink to="/seller" onClick={handleLinkClick}>Seller&rsquo;s Guide</FooterLink>
              <FooterLink to="/first-time-buyers" onClick={handleLinkClick}>First-Time Buyers</FooterLink>
              <FooterLink to="/relocation" onClick={handleLinkClick}>Relocating to MA</FooterLink>
              <FooterLink to="/vietnamese-speaking-real-estate-agent" onClick={handleLinkClick}>
                Tiếng Việt
              </FooterLink>
              <FooterLink to="/calculator" onClick={handleLinkClick}>Calculators</FooterLink>
              <FooterLink to="/faq" onClick={handleLinkClick}>FAQ</FooterLink>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">{t('footer.legal')}</h3>
            <ul className="space-y-2">
              <FooterLink to="/privacy-policy" onClick={handleLinkClick}>
                {t('footer.privacy_policy')}
              </FooterLink>
              <FooterLink to="/terms-of-service" onClick={handleLinkClick}>
                {t('footer.terms_of_service')}
              </FooterLink>
              <FooterLink to="/disclaimer" onClick={handleLinkClick}>
                {t('footer.disclaimer')}
              </FooterLink>
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