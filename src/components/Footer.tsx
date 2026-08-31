import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ChevronDown, Mail, MapPin, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { VI_ROUTES } from "@/lib/viRoutes";
import { SITE, telHref } from "@/lib/siteConfig";

/**
 * One definition for the footer link treatment. Every link here used to repeat
 * the same underline <span> inline, which is how a set of links drifts apart.
 */
const UNDERLINE =
  'absolute bottom-[-4px] left-1/2 h-0.5 w-0 -translate-x-1/2 bg-champagne transition-all duration-300 group-hover:w-full';

/** The contact rows. Same type treatment as FooterLink, but an <a>, not a Link. */
const CONTACT_LINK =
  'group relative min-w-0 break-words text-sm uppercase tracking-wide text-gray-300 transition-colors hover:text-champagne';

const FooterLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link
    to={to}
    className="group relative inline-block text-sm uppercase tracking-wide text-gray-300 transition-colors hover:text-champagne"
  >
    {children}
    <span className="absolute bottom-[-4px] left-1/2 h-0.5 w-0 -translate-x-1/2 bg-champagne transition-all duration-300 group-hover:w-full" />
  </Link>
);

/**
 * A footer column that shows its first FOOTER_VISIBLE links and reveals the
 * rest behind a toggle.
 *
 * The hidden links stay MOUNTED and are hidden with the `hidden` attribute,
 * never `{open && ...}`. This footer is the site's crawlable link graph — the
 * navbar renders its dropdowns through AnimatePresence, so those links are not
 * in the prerendered HTML at all — and unmounting the overflow would delete
 * the only inbound internal link several routes have. It is the same rule the
 * FAQ answers follow.
 */
const FOOTER_VISIBLE = 4;

const FooterColumn = ({
  title,
  items,
}: {
  title: string;
  items: { to: string; label: React.ReactNode }[];
}) => {
  const [open, setOpen] = useState(false);
  const overflow = items.length > FOOTER_VISIBLE;

  return (
    <div>
      <h3 className="mb-4 h-6 text-sm font-bold uppercase tracking-[0.15em] text-white">
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={item.to} hidden={!open && i >= FOOTER_VISIBLE}>
            <FooterLink to={item.to}>{item.label}</FooterLink>
          </li>
        ))}
      </ul>
      {overflow && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 transition-colors hover:text-champagne"
        >
          {open ? 'Show less' : 'Show more'}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      )}
    </div>
  );
};

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();

  return (
    <footer className="bg-ink text-white py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/*
            The NAP column. Its heading and row rhythm now match FooterColumn
            exactly — same `mb-4 h-6` heading box and same `space-y-2` list — so
            the five columns sit on one baseline grid instead of this one
            starting a line higher than the other four.

            Both the href and the label come from SITE. They used to be written
            out separately here and had drifted apart: the link dialled
            +1 617 555 1234 while the text said (860) 682-2251. NAP has to be
            identical everywhere or it suppresses local ranking — and in this
            case the call button did not work.
          */}
          <div>
            <h3 className="mb-4 h-6 text-sm font-bold uppercase tracking-[0.15em] text-white">
              Kevin Hoang
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-3">
                <Phone className="mt-1 h-4 w-4 shrink-0" aria-hidden />
                <a href={telHref} className={CONTACT_LINK}>
                  {SITE.phone}
                  <span className={UNDERLINE} />
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-1 h-4 w-4 shrink-0" aria-hidden />
                <a href={`mailto:${SITE.email}`} className={CONTACT_LINK}>
                  {SITE.email}
                  <span className={UNDERLINE} />
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden />
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(`${SITE.address.streetAddress}, ${SITE.address.addressLocality}, ${SITE.address.addressRegion} ${SITE.address.postalCode}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={CONTACT_LINK}
                >
                  {`${SITE.address.streetAddress}, ${SITE.address.addressLocality}, ${SITE.address.addressRegion} ${SITE.address.postalCode}`}
                  <span className={UNDERLINE} />
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Calendar className="mt-1 h-4 w-4 shrink-0" aria-hidden />
                <a
                  href={SITE.appointmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={CONTACT_LINK}
                >
                  Set an appointment
                  <span className={UNDERLINE} />
                </a>
              </li>
            </ul>
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
          <FooterColumn
            title={t('footer.quick_links')}
            items={[
              { to: '/', label: t('nav.home') },
              // /about is a real route again — the person page. It was pointed
              // at /needham-real-estate-agent while no such route existed; that
              // page owns hiring intent, not the biography.
              { to: '/about', label: t('footer.about') },
              { to: '/properties', label: 'Properties' },
              { to: '/contact', label: t('footer.contact') },
              { to: '/needham-real-estate-agent', label: 'Needham Real Estate' },
              { to: '/neighborhoods', label: 'Areas Served' },
              { to: '/blog', label: t('nav.blog') },
              { to: '/testimonials', label: 'Reviews' },
            ]}
          />

          <FooterColumn
            title="Guides & Services"
            items={[
              { to: '/home-valuation', label: 'Free Home Valuation' },
              { to: '/buyer', label: 'Buyer\u2019s Guide' },
              { to: '/seller', label: 'Seller\u2019s Guide' },
              { to: '/first-time-buyers', label: 'First-Time Buyers' },
              { to: '/relocation', label: 'Relocating to MA' },
              // The ENGLISH page about Vietnamese service. The Vietnamese-language
              // tree is its own column — a different thing.
              { to: '/vietnamese-speaking-real-estate-agent', label: t('nav.vietnamese') },
              { to: '/calculator', label: 'Calculators' },
              { to: '/faq', label: 'FAQ' },
            ]}
          />

          {/*
            The Vietnamese tree, rendered from VI_ROUTES so a route added there
            lands in the crawlable link graph without anyone remembering to add
            it here. Labels come from the same array and are literal Vietnamese,
            never t() — i18n is pinned to 'en' during static generation, so a
            translated label would prerender in English on all ~127 pages.
          */}
          <FooterColumn
            title="Tiếng Việt"
            items={VI_ROUTES.map((route) => ({ to: route.vi, label: route.label }))}
          />

          <FooterColumn
            title={t('footer.legal')}
            items={[
              { to: '/privacy-policy', label: t('footer.privacy_policy') },
              { to: '/terms-of-service', label: t('footer.terms_of_service') },
              { to: '/disclaimer', label: t('footer.disclaimer') },
            ]}
          />
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