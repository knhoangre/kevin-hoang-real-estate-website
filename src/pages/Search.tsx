import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bed, Bath, Square, Search as SearchIcon, X, MapPin } from 'lucide-react';
import PageShell, { ShellSection } from '@/components/PageShell';
import IdxDisclosure from '@/components/IdxDisclosure';
import { formatPrice, formatBathsShort, formatSoldMonth } from '@/lib/listings';
import {
  EMPTY_FILTERS,
  LISTING_TYPES,
  PAGE_SIZE,
  PROP_TYPES,
  headlinePrice,
  filtersFromParams,
  paramsFromFilters,
  photoUrl,
  propTypeLabel,
  searchListings,
  statusLabel,
  isAvailable,
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
        {/* Uppercase, matching the badges on /properties. */}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink backdrop-blur-sm">
          {propTypeLabel(listing.prop_type)}
        </span>
        {/*
          Only shown when the status is NOT plainly available. Badging all
          14,000 active listings "Active" is noise; badging the contingent and
          under-agreement ones is the whole point, because presenting those as
          simply for sale wastes a buyer's afternoon.
        */}
        {!isAvailable(listing.status) && statusLabel(listing.status) && (
          <span className="absolute right-3 top-3 rounded-full bg-ink-deep/85 px-3 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-sm">
            {statusLabel(listing.status)}
          </span>
        )}
      </div>

      <div className="p-4">
        <p className="numeral text-xl font-bold text-ink">
          {/* A sold listing's headline is what it CLOSED at, not what it asked. */}
          {formatPrice(headlinePrice(listing))}
          {listing.prop_type === 'RN' && (
            <span className="text-sm font-medium text-gray-500"> /mo</span>
          )}
        </p>
        {listing.feed === 'sold' && formatSoldMonth(listing.settled_date) && (
          <p className="numeral mt-0.5 text-xs font-semibold uppercase tracking-wide text-champagne-ink">
            Sold {formatSoldMonth(listing.settled_date)}
          </p>
        )}
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
              {formatBathsShort(listing.full_baths, listing.half_baths)}
              <span className="sr-only">
                {' '}
                baths, full and half
              </span>
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

  /*
   * Paging returns to the top OF THE RESULTS, not the top of the document.
   *
   * Clicking Next used to leave the scroll position untouched, so the reader
   * landed mid-grid on row four of the next page with no idea it had changed.
   * Scrolling to the very top would be almost as bad — it puts the filter form
   * back on screen and makes them scroll past it again every time.
   *
   * Only on a page change: re-running it for a filter edit would yank the page
   * while someone is still adjusting the form.
   */
  const resultsRef = useRef<HTMLParagraphElement>(null);
  const lastPageRef = useRef(filters.page);
  useEffect(() => {
    if (lastPageRef.current !== filters.page) {
      lastPageRef.current = filters.page;
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [filters.page]);

  /*
   * One chip per active criterion, each knowing how to clear only itself.
   * Built from the COMMITTED filters rather than the draft, so a chip always
   * describes the search that produced the results on screen.
   */
  const activeChips: { key: string; label: string; clear: Partial<SearchFilters> }[] = [
    filters.q && { key: 'q', label: `“${filters.q}”`, clear: { q: '' } },
    filters.town && { key: 'town', label: filters.town, clear: { town: '' } },
    filters.propType && {
      key: 'type',
      label: PROP_TYPES.find((p) => p.value === filters.propType)?.label ?? filters.propType,
      clear: { propType: '' },
    },
    filters.minPrice && {
      key: 'min',
      label: `${formatPrice(Number(filters.minPrice))}+`,
      clear: { minPrice: '' },
    },
    filters.maxPrice && {
      key: 'max',
      label: `Up to ${formatPrice(Number(filters.maxPrice))}`,
      clear: { maxPrice: '' },
    },
    filters.beds && { key: 'beds', label: `${filters.beds}+ beds`, clear: { beds: '' } },
    filters.baths && { key: 'baths', label: `${filters.baths}+ baths`, clear: { baths: '' } },
  ].filter(Boolean) as { key: string; label: string; clear: Partial<SearchFilters> }[];

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
      h1="Search Massachusetts listings"
      lede="Every home on the market, plus a year of recorded sales, straight from MLS PIN. Filter it, then send the link — it opens for whoever you send it to."
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
        {/*
          The search box is its own row above the filters, because typing where
          you want to live is the first thing anyone does — asking them to pick
          a town from a 400-entry dropdown first is backwards.
        */}
        <form
          className="mb-6 rounded-2xl border border-gray-200 bg-bone p-6"
          onSubmit={(e) => {
            e.preventDefault();
            // Any change to the criteria returns to page 1. Staying on page 7
            // of a search that now has two results is how a filter appears
            // broken.
            commit({ ...draft, page: 1 });
          }}
        >
          {/*
            For sale / Sold / For rent. A segmented control rather than another
            dropdown: it is the first decision, it changes what every other
            filter means, and it should be visible without opening anything.
          */}
          <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="What to search">
            {LISTING_TYPES.map((t) => {
              const active = draft.listingType === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    const next = { ...draft, listingType: t.value, page: 1 };
                    setDraft(next);
                    // Committed immediately: this is a mode switch, not a
                    // criterion, and leaving it pending behind the Search
                    // button makes the page look like it ignored the click.
                    commit(next);
                  }}
                  className={
                    active
                      ? 'rounded-full bg-ink-deep px-5 py-2 text-sm font-semibold text-white'
                      : 'rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-champagne-ink'
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <MapPin
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
              <label htmlFor="q" className="sr-only">
                Search by street address or town
              </label>
              <input
                id="q"
                type="search"
                className={`${inputClass} py-3.5 pl-12 text-base`}
                placeholder="Address, town, or MLS number"
                value={draft.q}
                onChange={(e) => setDraft({ ...draft, q: e.target.value })}
              />
            </div>
            <button
              type="submit"
              className="btn-pill btn-pill-light inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-ink-deep px-8 py-3.5 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-champagne hover:text-ink-deep"
            >
              <SearchIcon className="h-4 w-4" aria-hidden />
              Search
            </button>
          </div>

          <div className="mt-5 grid gap-4 border-t border-gray-200 pt-5 sm:grid-cols-2 lg:grid-cols-6">
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
                <option value="">All types</option>
                {/* Rentals are the listing-type control above, not a property type. */}
                {PROP_TYPES.filter((t) => t.value !== 'RN' || draft.listingType === 'rent').map((t) => (
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
          </div>
        </form>

        {/*
          Active filters as removable chips, on their own row.
          They used to be a bare "Clear filters" link sitting beside the Search
          button, which said nothing about WHAT was filtered and offered only
          all-or-nothing. A chip per criterion shows the current search at a
          glance and lets one be dropped without rebuilding the rest.
        */}
        {activeChips.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Filters
            </span>
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => commit({ ...filters, ...chip.clear, page: 1 })}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-ink transition-colors hover:border-champagne-ink hover:bg-bone"
              >
                {chip.label}
                <X className="h-3.5 w-3.5 text-gray-500" aria-hidden />
                <span className="sr-only">Remove this filter</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => commit(EMPTY_FILTERS)}
              className="ml-1 text-sm text-gray-600 underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:text-ink"
            >
              Clear all
            </button>
          </div>
        )}

        {/* aria-live so a screen reader hears the count change after a search. */}
        <p
          ref={resultsRef}
          className="numeral mb-6 scroll-mt-28 text-sm text-gray-600"
          aria-live="polite"
        >
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
