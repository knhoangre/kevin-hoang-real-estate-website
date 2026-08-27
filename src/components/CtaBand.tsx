import { Link } from 'react-router-dom';
import { Phone, Mail, ArrowRight } from 'lucide-react';
import { SITE, telHref } from '@/lib/siteConfig';

/**
 * The dark closing band.
 *
 * It existed four times over — LandingPage, ViPage, /about and /faq each had
 * their own copy of the same markup, which meant a change to the button
 * treatment had to be made in four places or the pages diverged.
 */
const CtaBand = ({
  heading,
  body,
  button,
}: {
  heading: string;
  body: string;
  button?: string;
}) => (
  <section className="relative overflow-hidden bg-ink-deep py-24 text-white">
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-champagne to-transparent"
      aria-hidden
    />
    <div className="container px-4 mx-auto">
      <div className="max-w-3xl mx-auto text-center enter">
        <h2 className="font-display text-3xl md:text-5xl font-semibold leading-tight">{heading}</h2>
        <p className="mt-5 mx-auto max-w-2xl text-lg leading-relaxed text-gray-300">{body}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-champagne px-7 py-3.5 text-sm font-semibold tracking-wide text-ink-deep transition-colors hover:bg-white"
          >
            {button ?? 'Send a message'}
            <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
          <a
            href={telHref}
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            <Phone className="w-4 h-4" aria-hidden />
            {SITE.phone}
          </a>
          <a
            href={`mailto:${SITE.email}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            <Mail className="w-4 h-4" aria-hidden />
            {SITE.email}
          </a>
        </div>
      </div>
    </div>
  </section>
);

export default CtaBand;
