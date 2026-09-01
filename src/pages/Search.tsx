import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bed, Bath, Square, Search as SearchIcon, X } from 'lucide-react';
import PageShell, { ShellSection } from '@/components/PageShell';
import IdxDisclosure from '@/components/IdxDisclosure';
import { formatPrice, formatBaths } from '@/lib/listings';
import {
  EMPTY_FILTERS,
  PAGE_SIZE,
  PROP_TYPES,
  filtersFromParams,
  hasAnyFilter,
  paramsFromFilters,
  photoUrl,
  propTypeLabel,
  searchListings,
  townsWithListings,
  type IdxListing,
  type SearchFilters,
} from '@/lib/idxSearch';

/**
 * Search over the live MLS PIN IDX feed.
 *
 * THIS PAGE BREAKS THREE OF THE SITE'S RULES, AND EACH BREAK IS DELIBERATE.
 *
 * 1. It is `noindex`. Every other public page here exists to be found; this one
 *    must not be. MLS PIN's rules require IDX displays be non-indexable, and the
 *    SEO case agrees independently: this is the same syndicated data as
 *    thousands of other agent sites, so indexing it would add duplicate pages to
 *    a corpus whose whole strength is that every page is first-party. The sold
 *    listings under /properties are the opposite case and stay indexable.
 *
 * 2. It is not prerendered with content. The other dynamic page on this site,
 *    /properties, renders from a committed snapshot because a crawler had to see
 *    listings in the HTML. Nothing crawls this page, and the feed changes hourly
 *    — a snapshot would be stale before it deployed.
 *
 * 3. It is reached through a rewrite. vercel.json has no SPA fallback on
 *    purpose, so unknown paths 404 rather than soft-404. /search/:mls cannot be
 *    prerendered, so it gets one narrowly-scoped rewrite — scoped to /search
 *    alone, which is why it cannot bring the sitewide soft-404 problem back.
 *
 * The filters live in the query string rather than in component state, because
 * `?town=Needham&max=900000` is a link that can be sent to a client. A search
 * held in component state is one only the person who typed it can see, which
 * defeats the purpose of building this instead of sending people to Zillow.
 */

const Skeleton = () => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }, (_, i) => (
      <div key={i} className="overflow-hidden rounded-xl border border-gray-200">
        <div className="aspect-[4/3] animate-pulse bg-gray-100" />
        <div className="space-y-3 p-4">
          <div className="h-6 w-1/2 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    ))}
  </div>
);

const ListingCard = ({ listing }: { listing: IdxListing }) => {
  const hasPhoto = (listing.photo_count ?? 0) > 0;

  return (
    <Link
      to={`/search/${listing.mls_number}`}
      className="group block overflow-hidden rounded-xl border border-gray-200 transition-colors hover:border-champagne focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne-ink"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {hasPhoto ? (
          <img
            src={photoUrl(listing.mls_number, 0, 'card')}
            /*
              The address, not a description of the photograph. Nobody recorded
              what this image shows and inventing it would be the same
              fabrication the copy rules forbid — the same reasoning as the
              positional alt text on the sold listing pages.
            */
            alt={`${listing.address ?? 'Listing'}, ${listing.town ?? ''}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No photo
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold tracking-wide text-ink backdrop-blur-sm">
          {propTypeLabel(listing.prop_type)}
        </span>
      </div>

      <div className="p-4">
        <p className="numeral text-xl font-bold text-ink">
          {formatPrice(listing.list_price)}
          {listing.prop_type === 'RN' && (
            <span className="text-sm font-medium text-gray-500"> /mo</span>
          )}
        </p>
        <p className="mt-1 text-sm text-gray-600">
          {listing.address}
          {listing.town ? `, ${listing.town}` : ''}
          {listing.zip ? ` ${listing.zip}` : ''}
        </p>
        <div className="numeral mt-3 flex items-center gap-4 border-t pt-3 text-sm text-gray-500">
          {listing.bedrooms !== null && (
            <span className="flex items-center gap-1">
              <Bed className="h-4 w-4" aria-hidden />
              {listing.bedrooms}
              <span className="sr-only"> bedrooms</span>
            </span>
          )}
          {listing.full_baths !== null && (
            <span className="flex items-center gap-1">
              <Bath className="h-4 w-4" aria-hidden />
              {formatBaths(listing.full_baths, listing.half_baths)}
              <span className="sr-only"> baths</span>
            </span>
          )}
          {listing.living_area !== null && (
            <span className="flex items-center gap-1">
              <Square className="h-4 w-4" aria-hidden />
              {listing.living_area.toLocaleString()}
              <span className="sr-only"> square feet</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-ink focus:border-champagne-ink focus:outline-none focus:ring-1 focus:ring-champagne-ink';

const Search = () => {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => filtersFromParams(params), [params]);

  // Mirrors the URL. Editing a field should not re-run the query on every
  // keystroke — the form commits on submit, and the URL is the committed state.
  const [draft, setDraft] = useState<SearchFilters>(filters);
  useEffect(() => setDraft(filters), [filters]);

  const [listings, setListings] = useState<IdxListing[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [towns, setTowns] = useState<{ town: string; listings: number }[]>([]);

  useEffect(() => {
    townsWithListings().then(setTowns).catch(() => setTowns([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setListings(null);
    setError(null);

    searchListings(filters)
      .then(({ listings: rows, total: count }) => {
        if (cancelled) return;
        setListings(rows);
        setTotal(count);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Say so rather than rendering an empty grid. "No results" and "the
        // query failed" look identical to a user and mean opposite things.
        setError(err instanceof Error ? err.message : 'Could not load listings');
        setListings([]);
      });

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const commit = (next: SearchFilters) => setParams(paramsFromFilters(next));

  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstShown = total === 0 ? 0 : (filters.page - 1) * PAGE_SIZE + 1;
  const lastShown = Math.min(filters.page * PAGE_SIZE, total);

  return (
    <PageShell
      path="/search"
      seo={{
        title: 'Search Listings',
        description: 'Search active listings across Massachusetts.',
        noindex: true,
      }}
      eyebrow="Listings"
      h1="Search every active listing"
      lede="Everything on the market across Massachusetts, updated hourly from MLS PIN. Filter it, then send the link — it works for whoever opens it."
      heroSize="compact"
      width="wide"
      actions={false}
      strip={false}
      cta={{
        heading: 'Want to see one of these?',
        body:
          'Send me the link to anything here and I will set up a showing. Touring costs nothing and is the fastest way to learn what you actually want.',
      }}
    >
      <ShellSection width="wide" inner="">
        <form
          className="mb-10 grid gap-4 rounded-2xl border border-gray-200 bg-bone p-6 sm:grid-cols-2 lg:grid-cols-6"
          onSubmit={(e) => {
            e.preventDefault();
            // Any change to the criteria returns to page 1. Staying on page 7
            // of a search that now has two results is how a filter appears
            // broken.
            commit({ ...draft, page: 1 });
          }}
        >
          <div className="lg:col-span-2">
            <label htmlFor="town" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">
              Town
            </label>
            <select
              id="town"
              className={inputClass}
              value={draft.town}
              onChange={(e) => setDraft({ ...draft, town: e.target.value })}
            >
              <option value="">Anywhere in Massachusetts</option>
              {towns.map((t) => (
                <option key={t.town} value={t.town}>
                  {t.town} ({t.listings})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="type" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">
              Type
            </label>
            <select
              id="type"
              className={inputClass}
              value={draft.propType}
              onChange={(e) => setDraft({ ...draft, propType: e.target.value })}
            >
              <option value="">For sale (all)</option>
              {PROP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="min" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">
              Min price
            </label>
            <input
              id="min"
              className={`${inputClass} numeral`}
              inputMode="numeric"
              placeholder="Any"
              value={draft.minPrice}
              onChange={(e) => setDraft({ ...draft, minPrice: e.target.value.replace(/\D/g, '') })}
            />
          </div>

          <div>
            <label htmlFor="max" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">
              Max price
            </label>
            <input
              id="max"
              className={`${inputClass} numeral`}
              inputMode="numeric"
              placeholder="Any"
              value={draft.maxPrice}
              onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value.replace(/\D/g, '') })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="beds" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Beds
              </label>
              <select
                id="beds"
                className={inputClass}
                value={draft.beds}
                onChange={(e) => setDraft({ ...draft, beds: e.target.value })}
              >
                <option value="">Any</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}+</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="baths" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Baths
              </label>
              <select
                id="baths"
                className={inputClass}
                value={draft.baths}
                onChange={(e) => setDraft({ ...draft, baths: e.target.value })}
              >
                <option value="">Any</option>
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>{n}+</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-6">
            <button
              type="submit"
              className="btn-pill btn-pill-light inline-flex items-center gap-2 rounded-full bg-ink-deep px-6 py-3 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-champagne hover:text-ink-deep"
            >
              <SearchIcon className="h-4 w-4" aria-hidden />
              Search
            </button>
            {hasAnyFilter(filters) && (
              <button
                type="button"
                onClick={() => commit(EMPTY_FILTERS)}
                className="inline-flex items-center gap-1.5 text-sm text-gray-600 underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden />
                Clear filters
              </button>
            )}
          </div>
        </form>

        {/* aria-live so a screen reader hears the count change after a search. */}
        <p className="numeral mb-6 text-sm text-gray-600" aria-live="polite">
          {listings === null
            ? 'Searching…'
            : total === 0
              ? 'No listings match those filters.'
              : `Showing ${firstShown.toLocaleString()}–${lastShown.toLocaleString()} of ${total.toLocaleString()} listings`}
        </p>

        {error && (
          <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {listings === null ? (
          <Skeleton />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.mls_number} listing={listing} />
            ))}
          </div>
        )}

        {lastPage > 1 && (
          <nav className="mt-12 flex items-center justify-center gap-4" aria-label="Pagination">
            <button
              type="button"
              disabled={filters.page <= 1}
              onClick={() => commit({ ...filters, page: filters.page - 1 })}
              className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium transition-colors hover:border-champagne-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="numeral text-sm text-gray-600">
              Page {filters.page.toLocaleString()} of {lastPage.toLocaleString()}
            </span>
            <button
              type="button"
              disabled={filters.page >= lastPage}
              onClick={() => commit({ ...filters, page: filters.page + 1 })}
              className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium transition-colors hover:border-champagne-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        )}

        <IdxDisclosure className="mt-16" />
      </ShellSection>
    </PageShell>
  );
};

export default Search;
