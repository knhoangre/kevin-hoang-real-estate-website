/**
 * The MLS PIN codebook, read: coded feed fields as words.
 *
 * Its own module, with no Supabase import, so that pure code — investment.ts,
 * run by scripts/investment-check.ts with plain Node — can tell oil heat from
 * gas and a septic system from a sewer. idxSearch.ts re-exports it, so every
 * existing caller is unchanged.
 */
import { IDX_CODES, type IdxPropType } from './idx-codes.ts';

/**
 * Expand one coded feed field into readable labels.
 *
 * The feed stores these as comma-separated letter codes — HEATING "B,N",
 * APPLIANCES "A,C,F,I,K,L". THE PROPERTY TYPE IS REQUIRED, not optional:
 * HEATING "C" is "Gas" on a rental, "Hot Air Gravity" on a single-family and
 * "Hot Water Baseboard" on a condo. A lookup that ignored it would mislabel
 * thousands of listings while looking entirely plausible.
 *
 * A code with no entry in the codebook is DROPPED rather than shown raw. The
 * reference is regenerated from MLS PIN, so an unknown code means the reference
 * is behind — and "Heating: Forced Air, N" is worse than "Heating: Forced Air".
 * If every code is unknown the field renders as nothing at all, which is the
 * same honest silence the rest of the site uses for data it does not have.
 */
export const decodeCodes = (
  field: string,
  value: string | null,
  propType: string | null
): string | null => {
  if (!value) return null;

  const byType = IDX_CODES[field];
  if (!byType) return null;

  const table = byType[(propType ?? '') as IdxPropType];
  if (!table) return null;

  const labels = value
    .split(',')
    .map((code) => table[code.trim()])
    .filter(Boolean);

  // De-duplicated: several codes can map to the same label across a revision
  // of the reference, and "Other (See Remarks), Other (See Remarks)" is noise.
  return labels.length ? [...new Set(labels)].join(', ') : null;
};

/**
 * Whether a status still means "you can buy this".
 *
 * Contingent and under-agreement listings are still shown — they fall through
 * often enough to matter — but they are marked, because presenting one as
 * simply available wastes a buyer's afternoon.
 */
export const AVAILABLE_STATUSES = ['ACT', 'NEW', 'BOM', 'PCG', 'EXT', 'RAC'];

export const isAvailable = (code: string | null) =>
  AVAILABLE_STATUSES.includes((code ?? '').trim().toUpperCase());

/**
 * Whether a row is a finished sale or lease. NOT the same as `feed === 'sold'`.
 *
 * MLS PIN files a home that goes under agreement in the sold feed, with no sale
 * price and no closing date, and it can still fall through. Every page that
 * tested the feed alone printed "Sold" under such a home's asking price and took
 * its estimate away, until 2026-10-30.
 */
export const isClosed = (listing: { feed: string | null; status: string | null }) =>
  listing.feed === 'sold' && (listing.status ?? '').trim().toUpperCase() !== 'UAG';
