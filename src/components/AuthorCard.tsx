import { Link } from 'react-router-dom';
import { Phone, ArrowRight } from 'lucide-react';
import { SITE, telHref } from '@/lib/siteConfig';

/**
 * The byline block that closes every article and town guide.
 *
 * Three jobs, in order of how much they matter:
 *
 * 1. It attaches a named, credentialed, contactable human to the writing.
 *    `blogPosting().author` already points at the #kevin Person node, but a
 *    machine-readable claim with nothing visible behind it is the weaker half
 *    of an authorship signal — the visible byline is the half a reader and a
 *    quality rater actually see.
 * 2. It gives 100-odd pages an inbound link to /about, which is what makes
 *    /about resolvable as the site's answer to "who wrote this".
 * 3. It turns dead-end pages into pages with somewhere to go.
 *
 * Every fact on it comes from siteConfig. Nothing here is an adjective.
 */
const AuthorCard = ({ className = '' }: { className?: string }) => (
  <aside
    className={`rounded-2xl border border-gray-200 bg-bone p-6 sm:p-8 ${className}`}
  >
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <img
        src="/kevin_hoang.jpg"
        alt={`${SITE.agentName}, real estate broker in Needham, Massachusetts`}
        width={160}
        height={160}
        className="h-20 w-20 shrink-0 rounded-full object-cover ring-1 ring-champagne/40"
        loading="lazy"
        decoding="async"
      />

      <div className="min-w-0">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gray-500">
          Written by
        </p>
        {/* Deliberately a <p>, not a heading. This block appears on every post
            and every town guide, and "Kevin Hoang" as an <h2> would inject the
            same entry into the heading outline of a hundred documents where it
            is a byline rather than a section of the article. */}
        <p className="mt-2 font-display text-2xl font-semibold text-ink">
          {SITE.agentName}
        </p>
        <p className="mt-3 text-base leading-relaxed text-gray-700">
          Licensed Massachusetts real estate broker with {SITE.brokerage}, based in
          Needham. He represents buyers and sellers across{' '}
          {SITE.areaServed.length} towns in MetroWest and Greater Boston, and works
          in English and Vietnamese.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            to="/about"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-ink"
          >
            More about Kevin
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <a
            href={telHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-ink"
          >
            <Phone className="h-4 w-4" aria-hidden />
            {SITE.phone}
          </a>
        </div>
      </div>
    </div>
  </aside>
);

export default AuthorCard;
