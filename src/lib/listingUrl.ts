/**
 * The address of a listing's page: /search/170-Gore-St-Unit-417-Cambridge-MA-02141-73568135
 *
 * It was /search/73568135. That is a link nobody can read: texted to a client
 * beside three others it says nothing about which house it is, and Kevin asked
 * on 2026-10-09 for the address to be in it.
 *
 * THE MLS NUMBER STAYS, AT THE END, AND IT IS THE ONLY PART THAT IS READ. The
 * words in front of it are for the person looking at the link. Two reasons it
 * cannot be the address alone:
 *
 *   - An address is not one listing. The same condo is routinely for sale and
 *     for rent at once under two MLS numbers, and comes back a year later under
 *     a third; "170 Gore St Unit 417" would have to pick one of them.
 *   - The feed respells addresses ("ST" becomes "Street", a unit gains a "#"),
 *     and a link keyed on the spelling breaks the day that happens.
 *
 * It is also what keeps every link already sent working. /search/73568135 is
 * still read as that listing — the whole segment is the number — and the page
 * then rewrites its own address bar to the full form, so a link copied from it
 * afterwards is the readable one. Nothing has to be redirected, and no old link
 * can go stale because of this.
 *
 * Because only the number is read, the words can be wrong without anything
 * breaking: a link built from a saved home's snapshot, which has no ZIP, opens
 * the same page as the full one. That is deliberate. It also means the mirror
 * of `listingSlug` in supabase/functions/_shared/listingEmail.ts drifting would
 * cost a cosmetic difference in an emailed link and nothing else —
 * `node scripts/listing-url-check.ts` holds the two together all the same.
 *
 * PURE: no imports, no DOM. That is what lets the check script, and the static
 * generator, load it.
 */

export interface ListingRef {
  mls_number: string;
  address?: string | null;
  town?: string | null;
  state?: string | null;
  zip?: string | null;
}

/**
 * One word of an address, cased the way an address is written.
 *
 * The feed is not consistent — "60 PATTISON ST Unit C14" is one real value —
 * and a link that shouts half its words reads as broken. So a word that arrives
 * all in one case is given a capital; a word that already has its own shape
 * ("McGrath") is left alone, because lower-casing the rest of it would be this
 * function inventing a spelling. Anything with a digit in it is a unit or a
 * number and goes upper ("c14" is unit C14).
 */
const cased = (word: string): string => {
  if (/\d/.test(word)) return word.toUpperCase();
  if (word === word.toUpperCase() || word === word.toLowerCase()) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }
  return word;
};

/**
 * An address line as it would be written by hand: "60 PATTISON ST Unit C14" ->
 * "60 Pattison St Unit C14". The same rule the slug uses, for text a reader
 * sees — the marketing booklets print the address large, and the feed's casing
 * is whatever the listing agent typed. Punctuation is kept; only case changes.
 */
export const casedAddress = (text: string): string =>
  text.trim().split(/\s+/).filter(Boolean).map(cased).join(' ');

/** Letters and digits only, in hyphen-separated words. Never empty hyphens, never a leading one. */
const words = (text: string): string[] =>
  text
    // "Café" -> "Cafe": split the accent off, then drop it with everything else
    // that is not a letter or a digit.
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    // Inside a word, not between two: "O'Brien" is one word and "St." is "St".
    .replace(/['’.]/g, '')
    .replace(/&/g, ' and ')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);

/**
 * "170-Gore-St-Unit-417-Cambridge-MA-02141-73568135". With nothing but a number
 * known, the number alone — which is exactly the old form of the link.
 */
export const listingSlug = (listing: ListingRef): string => {
  const state = (listing.state ?? '').trim();
  // Five digits. A ZIP+4 would put a second number in front of the MLS number.
  const zip = /^\d{5}/.exec((listing.zip ?? '').trim())?.[0] ?? '';

  const parts = [
    ...words(listing.address ?? '').map(cased),
    ...words(listing.town ?? '').map(cased),
    ...words(state).map((w) => (w.length === 2 ? w.toUpperCase() : cased(w))),
    zip,
    listing.mls_number,
  ].filter(Boolean);

  return parts.join('-');
};

/** The path on this site. Every link to a listing is built here. */
export const listingPath = (listing: ListingRef): string => `/search/${listingSlug(listing)}`;

/**
 * The MLS number in a /search/<segment>, or null if there is none.
 *
 * Two shapes are a listing:
 *
 *   73568135                    the segment IS the number — every link sent
 *                               before 2026-10-09, and they must keep working
 *   Any-Words-At-All-73568135   the number is the last word
 *
 * In the second shape the number has to be SIX digits or more. Without that, a
 * link that lost its number — "…-Cambridge-MA-02141" — would be read as MLS
 * 02141, and somebody would be shown "no longer available" for a listing that
 * was never looked up. Real MLS PIN numbers are eight digits.
 */
export const mlsFromListingParam = (segment: string | undefined | null): string | null => {
  const value = (segment ?? '').trim();
  if (/^\d{5,12}$/.test(value)) return value;
  return /-(\d{6,12})$/.exec(value)?.[1] ?? null;
};
