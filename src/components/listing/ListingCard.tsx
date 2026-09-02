import { Link } from 'react-router-dom';
import { Bed, Bath, Square, TrendingDown, TrendingUp } from 'lucide-react';
import { formatPrice, formatBathsShort, formatSoldMonth } from '@/lib/listings';
import {
  headlinePrice,
  photoUrl,
  priceChange,
  propTypeLabel,
  statusLabel,
  isAvailable,
  type IdxListing,
} from '@/lib/idxSearch';

/**
 * One listing, as a card.
 *
 * Lifted out of Search.tsx when /search/<mls> grew a "similar listings" block
 * at the bottom. It was module-private there, and the alternative — copying
 * this markup into the second surface — is how the site ended up with three
 * private formatPrice implementations that had already drifted over their own
 * fallback string. One card, so a fix to the badge, the alt text or the price
 * line reaches the grid and the similar-listings row together.
 *
 * Importing it from the page module rather than moving it would have worked and
 * been worse: every route that shows a card would then pull the whole /search
 * page — its filter state, its town dropdown, its pager — into its chunk.
 */

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
          EVERY status, top right, in one badge.
          It used to be shown only when the listing was not plainly available,
          on the reasoning that badging 14,000 "Active" listings is noise. The
          reasoning was half right: what is noise is the WORD, not the position.
          A card with a badge and a card without one differ in a way the reader
          has to learn, and "no badge" is the one state that never says what it
          means — so a scan of a grid could not tell an active listing from one
          whose status simply had no label. Now the corner always answers the
          only question a buyer is asking, and the colour carries the urgency:
          available is quiet, everything else is dark.
        */}
        {statusLabel(listing.status) && (
          <span
            className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm ${
              isAvailable(listing.status)
                ? 'bg-white/90 text-ink'
                : 'bg-ink-deep/85 text-white'
            }`}
          >
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
        {/*
          A price cut, stated as both numbers. The old price struck through is
          what makes it read as a change rather than as a second price, and the
          percentage is what makes it comparable across a $600k condo and a $3M
          house. Shown only where we actually watched the price move — see
          priceChange().
        */}
        {(() => {
          const change = priceChange(listing);
          if (!change) return null;
          const Icon = change.direction === 'down' ? TrendingDown : TrendingUp;
          return (
            <p className="numeral mt-1 flex flex-wrap items-center gap-x-2 text-sm">
              <span className="text-gray-400 line-through">{formatPrice(change.from)}</span>
              <span
                className={
                  change.direction === 'down'
                    ? 'inline-flex items-center gap-1 font-semibold text-emerald-700'
                    : 'inline-flex items-center gap-1 font-semibold text-red-700'
                }
              >
                <Icon className="h-4 w-4" aria-hidden />
                {change.direction === 'down' ? 'Price cut' : 'Price raised'} {change.percent}%
              </span>
            </p>
          );
        })()}
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

export default ListingCard;
