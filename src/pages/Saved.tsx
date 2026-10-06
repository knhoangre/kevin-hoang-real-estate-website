/**
 * /saved — a signed-in visitor's saved homes, what to look at next, and what
 * they have looked at already.
 *
 * Reached from the profile menu and from the heart on any listing. Three lists:
 *
 *   Saved homes         what they pressed the heart on.
 *   Recommended for you homes on the market that fit the pattern of what they
 *                       saved and opened — see recommendations.ts.
 *   Recently viewed     the way back to something seen yesterday.
 *
 * WHAT IS LIVE AND WHAT IS A SNAPSHOT. Every saved and viewed row carries the
 * address and price as they were, because idx_listings is a cache of the feed
 * and a home leaves it the day it goes under agreement. Each list first asks
 * the feed for the current row and renders the ordinary ListingCard from it; a
 * home that is no longer there is shown from its snapshot and says so, rather
 * than vanishing from a list somebody made on purpose.
 *
 * KEVIN CAN SEE THIS. The admin reads every client's saved and viewed homes —
 * that is half of why the feature exists — and the page says so in plain words
 * at the bottom, as the privacy policy does.
 *
 * noindex, prerendered as a shell: at build time nobody is signed in, so the
 * static HTML is the spinner and the client fills it in.
 */
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Heart, Loader2 } from 'lucide-react';
import PageShell, { ShellSection } from '@/components/PageShell';
import SectionHeading from '@/components/SectionHeading';
import ListingCard from '@/components/listing/ListingCard';
import IdxDisclosure from '@/components/IdxDisclosure';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { rememberReturnPath } from '@/lib/authReturn';
import { formatPrice } from '@/lib/listings';
import { describeProfile } from '@/lib/recommendations';
import { listingsByMls, listViews, recommendFor, type FavoriteRow } from '@/lib/favorites';
import { paramsFromFilters, EMPTY_FILTERS, type IdxListing } from '@/lib/idxSearch';

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Saved homes', path: '/saved' },
];

const GRID = 'mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3';

const Spinner = () => (
  <div className="flex min-h-[30vh] items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-champagne-ink" aria-hidden />
  </div>
);

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-8 rounded-xl border border-gray-200 bg-bone p-8 text-sm leading-relaxed text-gray-700">
    {children}
  </div>
);

/**
 * A saved home that has left the feed, drawn from its snapshot.
 *
 * Not a link: there is no page behind it any more, and a card that leads to
 * "this listing is no longer available" is a small lie about what clicking
 * will do. It keeps the one action that still applies.
 */
const GoneCard = ({ row, onRemove }: { row: FavoriteRow; onRemove: () => void }) => (
  <div className="flex h-full flex-col rounded-xl border border-dashed border-gray-300 bg-white p-5">
    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
      No longer on the market
    </p>
    <p className="numeral mt-3 text-lg font-semibold text-ink">
      {row.list_price !== null ? formatPrice(row.list_price) : 'Price not recorded'}
      {row.prop_type === 'RN' && row.list_price !== null && (
        <span className="text-sm font-medium text-gray-500"> /mo</span>
      )}
    </p>
    <p className="mt-1 text-sm text-gray-600">
      {[row.address, row.town].filter(Boolean).join(', ') || `MLS ${row.mls_number}`}
    </p>
    <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">
      It has sold, gone under agreement or been withdrawn since you saved it. Kevin can tell you
      which, and what it means for the others on your list.
    </p>
    <button
      type="button"
      onClick={onRemove}
      className="mt-4 self-start text-sm font-medium text-champagne-ink underline decoration-champagne underline-offset-4 hover:decoration-2"
    >
      Remove from saved
    </button>
  </div>
);

const Saved = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { favorites, favoritesLoading, toggle, userId } = useFavorites();

  const views = useQuery({
    queryKey: ['listing-views', userId],
    queryFn: () => listViews(userId as string),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
  const viewRows = useMemo(() => views.data ?? [], [views.data]);

  // One request for the current state of everything on the page, keyed on the
  // set of numbers so saving a home refetches and re-rendering does not.
  const wanted = useMemo(
    () =>
      [...new Set([...favorites.map((f) => f.mls_number), ...viewRows.map((v) => v.mls_number)])].sort(),
    [favorites, viewRows]
  );
  const live = useQuery({
    queryKey: ['saved-live', wanted],
    queryFn: () => listingsByMls(wanted),
    enabled: wanted.length > 0,
    staleTime: 60_000,
  });

  const recommendations = useQuery({
    queryKey: ['recommendations', userId, wanted],
    queryFn: () => recommendFor(favorites, viewRows),
    // Wait for both histories, or the first answer is built from half of one.
    enabled: Boolean(userId) && !favoritesLoading && !views.isLoading,
    staleTime: 5 * 60_000,
  });

  const signIn = () => {
    rememberReturnPath();
    navigate('/auth');
  };

  const body = () => {
    // Also what the prerendered HTML contains: at build time there is no session.
    if (authLoading) return <Spinner />;

    if (!user) {
      return (
        <Panel>
          <h2 className="text-xl font-semibold uppercase tracking-wide text-ink">
            Sign in to keep a list
          </h2>
          <p className="mt-3">
            Save the homes you like from any listing, and come back to them here — along with
            others like them that have just come on the market.
          </p>
          <button
            type="button"
            onClick={signIn}
            className="mt-6 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/80"
          >
            Sign in
          </button>
        </Panel>
      );
    }

    if (favoritesLoading || views.isLoading) return <Spinner />;

    const liveMap = live.data ?? new Map<string, IdxListing>();
    const profile = recommendations.data?.profile ?? null;
    const recommended = recommendations.data?.listings ?? [];
    const savedSet = new Set(favorites.map((f) => f.mls_number));
    // Saved homes are already in the first list; showing them again here would
    // make "recently viewed" mostly a second copy of it.
    // Only what is still in the feed: a card is a link, and this list is the
    // way BACK to something, which a home that has gone no longer offers.
    const recent = viewRows
      .filter((v) => !savedSet.has(v.mls_number))
      .map((v) => liveMap.get(v.mls_number))
      .filter((listing): listing is IdxListing => Boolean(listing))
      .slice(0, 9);

    // The search this profile describes, for when nothing new fits it.
    const searchLink = profile
      ? `/search?${paramsFromFilters({
          ...EMPTY_FILTERS,
          listingType: profile.market === 'rent' ? 'rent' : 'sale',
          town: profile.towns[0]?.town ?? '',
          minPrice: String(profile.minPrice),
          maxPrice: String(profile.maxPrice),
        }).toString()}`
      : '/search';

    return (
      <div className="space-y-20">
        {/* ---- Saved ---- */}
        <section aria-labelledby="saved-heading">
          <SectionHeading id="saved-heading">
            Saved homes{' '}
            {favorites.length > 0 && (
              <span className="numeral text-2xl font-normal text-gray-500">({favorites.length})</span>
            )}
          </SectionHeading>

          {favorites.length === 0 ? (
            <Panel>
              <p className="flex items-start gap-3">
                <Heart className="mt-0.5 h-5 w-5 shrink-0 text-champagne-ink" aria-hidden />
                <span>
                  Nothing saved yet. Press the heart on any listing and it will be kept here.{' '}
                  <Link
                    to="/search"
                    className="font-medium text-champagne-ink underline decoration-champagne underline-offset-4"
                  >
                    Search what is on the market
                  </Link>
                  .
                </span>
              </p>
            </Panel>
          ) : (
            <div className={GRID}>
              {favorites.map((row) => {
                const listing = liveMap.get(row.mls_number);
                // Still loading the current rows: hold the place rather than
                // flashing every home as "no longer on the market" first.
                if (!listing && live.isLoading) {
                  return (
                    <div
                      key={row.mls_number}
                      className="aspect-[4/5] animate-pulse rounded-xl bg-gray-100"
                    />
                  );
                }
                if (!listing) {
                  return (
                    <GoneCard
                      key={row.mls_number}
                      row={row}
                      onRemove={() => void toggle(row.mls_number)}
                    />
                  );
                }
                return (
                  <div key={row.mls_number} className="flex h-full flex-col">
                    <div className="flex-1">
                      <ListingCard listing={listing} />
                    </div>
                    {/* A sold listing's card carries no heart — there is nothing
                        to go and see — so removing it from the list has to be
                        offered here instead. */}
                    {listing.feed === 'sold' && (
                      <button
                        type="button"
                        onClick={() => void toggle(row.mls_number)}
                        className="mt-2 self-start text-sm font-medium text-champagne-ink underline decoration-champagne underline-offset-4 hover:decoration-2"
                      >
                        Remove from saved
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ---- Recommended ---- */}
        <section aria-labelledby="recommended-heading">
          <SectionHeading id="recommended-heading">Recommended for you</SectionHeading>

          {recommendations.isLoading ? (
            <Spinner />
          ) : !profile ? (
            <Panel>
              Save or open a few homes and suggestions will appear here. They are worked out from
              what you look at — the towns, the kind of home and the price range — not from
              anything you have to fill in.
            </Panel>
          ) : (
            <>
              <p className="numeral mt-4 max-w-3xl text-gray-600">
                Homes on the market you have not opened yet, in the places and price range you
                have been looking at: {describeProfile(profile, formatPrice)}.
              </p>
              {recommended.length === 0 ? (
                <Panel>
                  Nothing new fits that right now — you have seen what is there.{' '}
                  <Link
                    to={searchLink}
                    className="font-medium text-champagne-ink underline decoration-champagne underline-offset-4"
                  >
                    Open that search
                  </Link>{' '}
                  to widen it, or check back: this list changes as homes come on the market.
                </Panel>
              ) : (
                <div className={GRID}>
                  {recommended.map((listing) => (
                    <ListingCard key={listing.mls_number} listing={listing} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* ---- Recently viewed ---- */}
        {recent.length > 0 && (
          <section aria-labelledby="recent-heading">
            <SectionHeading id="recent-heading">Recently viewed</SectionHeading>
            <div className={GRID}>
              {recent.map((listing) => (
                <ListingCard key={listing.mls_number} listing={listing} />
              ))}
            </div>
          </section>
        )}

        <div>
          <p className="max-w-3xl text-sm leading-relaxed text-gray-600">
            Kevin can see the homes you save and the listings you open while signed in, so he can
            tell you about a price change or something similar before you have to ask. Nobody else
            can. The{' '}
            <Link
              to="/privacy-policy"
              className="font-medium text-champagne-ink underline decoration-champagne underline-offset-4"
            >
              privacy policy
            </Link>{' '}
            has the detail.
          </p>
          <IdxDisclosure className="mt-8" />
        </div>
      </div>
    );
  };

  return (
    <PageShell
      path="/saved"
      seo={{
        title: 'Your Saved Homes',
        description: 'The homes you have saved, and others like them.',
        noindex: true,
      }}
      crumbs={CRUMBS}
      eyebrow="Your search"
      hero={{
        // The /search hero, sized the same way, so it is already in cache for
        // anyone who arrives from there.
        image:
          'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?auto=format&fit=crop&w=1600&q=65',
        alt: '',
      }}
      h1="Saved homes"
      lede="What you have saved, what to look at next, and what you have seen."
      heroSize="compact"
      width="wide"
      strip={false}
      actions={false}
      cta={false}
    >
      <ShellSection width="wide" inner="">
        {body()}
      </ShellSection>
    </PageShell>
  );
};

export default Saved;
