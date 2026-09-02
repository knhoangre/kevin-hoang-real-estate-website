import { useEffect, useState } from 'react';
import ListingCard from '@/components/listing/ListingCard';
import { similarListings, type IdxListing } from '@/lib/idxSearch';

/**
 * A few comparable homes, so the listing page is not a dead end.
 *
 * Before this the only way onward from a listing was the "Back to search" link
 * at the top — so someone who liked a house but not that house had to
 * reconstruct their search from scratch. These are the same cards they were
 * scanning a moment ago, which is why <ListingCard> was lifted out of Search.tsx
 * rather than reimplemented here.
 *
 * RENDERS NOTHING WHEN THERE IS NOTHING. Six of the seventeen town guides carry
 * a TownSoldListings block and eleven do not, for the same reason: a heading
 * over an empty box is the thin templated filler this site was cleaned of once.
 * A thin town, or a house with no peer in its price band, gets silence.
 *
 * The heading interpolates the town, so two listings in the same town do not
 * both emit an identical <h2> — the topical-distinctness rule the property
 * detail pages already follow.
 */
const SimilarListings = ({ listing }: { listing: IdxListing }) => {
  const [rows, setRows] = useState<IdxListing[]>([]);

  useEffect(() => {
    let cancelled = false;
    setRows([]);
    // similarListings swallows its own errors and resolves to [], so there is
    // nothing to catch: this block is context, and a failed comp query must
    // never take down the listing it sits under.
    similarListings(listing).then((found) => {
      if (!cancelled) setRows(found);
    });
    return () => {
      cancelled = true;
    };
  }, [listing]);

  if (rows.length === 0) return null;

  return (
    <section className="mt-16 border-t border-gray-200 pt-10 print:hidden">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
        {listing.feed === 'sold'
          ? `Other recent sales in ${listing.town}`
          : `Similar homes in ${listing.town}`}
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        Comparable in price and size — a starting point, not the whole market.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <ListingCard key={row.mls_number} listing={row} />
        ))}
      </div>
    </section>
  );
};

export default SimilarListings;
