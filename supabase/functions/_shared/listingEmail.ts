/**
 * A listing as a block in an email, and the link back to it on this site.
 *
 * Two emails name a specific house — the open-house confirmation a guest gets
 * at the door, and the showing schedule sent before a tour — and before this
 * neither linked to it. The guest was told an address and went to Zillow to
 * look at it again. Both now carry this card.
 *
 * THE LISTING IS READ HERE, FROM THE DATABASE, BY MLS NUMBER. Nothing a request
 * says about a house — its price, its photo, its address — is ever put into an
 * email. `submit-open-house-signin` is callable by anyone holding the anon key,
 * so a card built from the request body would be a way to send a stranger a
 * Kevin Hoang email with any picture and any link in it.
 *
 * THE LISTING OFFICE IS NAMED, as it is on every listing page. MLS PIN requires
 * the attribution wherever its listing content is displayed, and an email that
 * shows the photo and the price is a display.
 *
 * Four small pieces below are DELIBERATE MIRRORS of the app's own
 * (`formatPrice`/`formatBaths` in src/lib/listings.ts, `photoUrl` and the status
 * labels in src/lib/idxSearch.ts, `listingSlug` in src/lib/listingUrl.ts). An
 * edge function cannot import from the app bundle, and the alternative — the
 * email and the page describing one house two ways — is the failure this
 * comment exists to prevent. Change one, change both. For `listingSlug` that is
 * checked rather than trusted: `node scripts/listing-url-check.ts` runs both
 * copies over the same addresses.
 */
import type { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

type Db = ReturnType<typeof createClient>;

/**
 * `www`, not the apex. kevinhoang.co 307-redirects to www, and a link that goes
 * straight there is one hop shorter in a mail client's in-app browser.
 */
export const SITE_ORIGIN = 'https://www.kevinhoang.co';

export const escapeHtml = (text: unknown): string =>
  String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** An MLS number is digits. Anything else is not looked up, and not stored. */
export const isMlsNumber = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{5,12}$/.test(value);

/** What a link to a listing is built from. Only `mls_number` is required. */
export interface ListingRef {
  mls_number: string;
  address?: string | null;
  town?: string | null;
  state?: string | null;
  zip?: string | null;
}

/*
 * MIRROR of `cased`, `words` and `listingSlug` in src/lib/listingUrl.ts, where
 * the reasoning for each line is written down. In short: the address is in the
 * link so the person reading it knows which house it is; the MLS number is at
 * the end and is the only part the page reads, so a link built here from a
 * stop's snapshot opens the same page as one built from the live feed.
 */
const cased = (word: string): string => {
  if (/\d/.test(word)) return word.toUpperCase();
  if (word === word.toUpperCase() || word === word.toLowerCase()) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }
  return word;
};

const words = (text: string): string[] =>
  text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’.]/g, '')
    .replace(/&/g, ' and ')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);

/** "170-Gore-St-Unit-417-Cambridge-MA-02141-73568135" */
export const listingSlug = (listing: ListingRef): string => {
  const state = (listing.state ?? '').trim();
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

/**
 * The listing's page on this site, with its address in the link.
 *
 * `source` becomes utm_source so GA4 can say how many guests came back through
 * the email — which is the whole question this feature was built to answer.
 * It is one of our own fixed strings, never anything from a request.
 *
 * The slug is letters, digits and hyphens by construction, so it needs no
 * encoding — and the address in it comes from the database, like everything
 * else in these emails.
 */
export const listingUrl = (listing: ListingRef, source?: string): string =>
  `${SITE_ORIGIN}/search/${listingSlug(listing)}${
    source ? `?utm_source=${encodeURIComponent(source)}&utm_medium=email` : ''
  }`;

/** Everything on the market in a town. */
export const townSearchUrl = (town: string, source?: string): string =>
  `${SITE_ORIGIN}/search?town=${encodeURIComponent(town)}${
    source ? `&utm_source=${encodeURIComponent(source)}&utm_medium=email` : ''
  }`;

/** Mirror of `photoUrl(mls, n, 'card')`. MLS PIN's own media host, hot-linked. */
export const listingPhotoUrl = (mls: string, n = 0): string =>
  `https://media.mlspin.com/photo.aspx?nopadding=1&w=600&h=450&mls=${encodeURIComponent(mls)}&o=&n=${n}`;

export interface EmailListing {
  mls_number: string;
  address: string | null;
  town: string | null;
  state: string | null;
  zip: string | null;
  status: string | null;
  prop_type: string | null;
  list_price: number | null;
  bedrooms: number | null;
  full_baths: number | null;
  half_baths: number | null;
  living_area: number | null;
  photo_count: number | null;
  /** The listing office's name, for the attribution line. Null if unknown. */
  office_name: string | null;
}

const LISTING_COLUMNS =
  'mls_number,address,town,state,zip,status,prop_type,list_price,bedrooms,full_baths,half_baths,living_area,photo_count,list_office_id';

/**
 * One listing by MLS number, with its office. Null when the number is not in
 * the feed — and null on any error too: this is decoration on an email whose
 * real job (recording a sign-in, sending a schedule) must not fail because a
 * lookup did.
 */
export const fetchEmailListing = async (db: Db, mls: unknown): Promise<EmailListing | null> => {
  if (!isMlsNumber(mls)) return null;
  try {
    const { data: row, error } = await db
      .from('idx_listings')
      .select(LISTING_COLUMNS)
      .eq('mls_number', mls)
      .maybeSingle();
    if (error || !row) return null;

    let office: string | null = null;
    if (row.list_office_id) {
      const { data: officeRow } = await db
        .from('idx_offices')
        .select('name')
        .eq('office_id', row.list_office_id)
        .maybeSingle();
      office = officeRow?.name ?? null;
    }
    return { ...row, office_name: office } as EmailListing;
  } catch (err) {
    console.error('Listing lookup for email failed:', err);
    return null;
  }
};

/** Mirror of `formatPrice`. */
export const formatPrice = (value: number | null): string =>
  value === null
    ? 'Price on request'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(value));

/** Mirror of `formatBaths`: "2 full, 1 half", never the trade's "2.1". */
export const formatBaths = (full: number | null, half: number | null): string => {
  const f = full ?? 0;
  const h = half ?? 0;
  if (h > 0 && f > 0) return `${f} full, ${h} half`;
  if (h > 0) return `${h} half`;
  return `${f} full`;
};

/** Mirror of STATUS_LABELS. An unknown code falls through to itself, not to a guess. */
const STATUS_LABELS: Record<string, string> = {
  ACT: 'Active',
  NEW: 'New listing',
  BOM: 'Back on market',
  PCG: 'Price changed',
  EXT: 'Extended',
  RAC: 'Reactivated',
  CTG: 'Contingent',
  UAG: 'Under agreement',
  SLD: 'Sold',
  RNT: 'Rented',
};

export const statusLabel = (code: string | null): string | null =>
  code ? STATUS_LABELS[code.trim().toUpperCase()] ?? code : null;

/** "216 Tremont Street Unit 216, Newton, MA 02458" */
export const listingAddressLine = (l: EmailListing): string =>
  [l.address, l.town, [l.state, l.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');

/** "$1,250,000 · 4 bed · 2 full, 1 half bath · 2,400 sq ft" — only what is known. */
export const listingFactsLine = (l: EmailListing): string =>
  [
    `${formatPrice(l.list_price)}${l.prop_type === 'RN' ? '/mo' : ''}`,
    l.bedrooms !== null ? `${l.bedrooms} bed` : null,
    l.full_baths !== null ? `${formatBaths(l.full_baths, l.half_baths)} bath` : null,
    l.living_area !== null ? `${Number(l.living_area).toLocaleString('en-US')} sq ft` : null,
  ]
    .filter(Boolean)
    .join(' · ');

/**
 * The card, as one table row's worth of HTML.
 *
 * Tables and inline styles because that is what mail clients render; the type
 * and the champagne rule match the confirmation email it is dropped into. The
 * photo and the address are both links, since the photo is what gets tapped.
 */
export const listingCardHtml = (
  l: EmailListing,
  opts: { source?: string; cta?: string } = {}
): string => {
  const url = escapeHtml(listingUrl(l, opts.source));
  const hasPhoto = (l.photo_count ?? 0) > 0;
  const status = statusLabel(l.status);
  const cta = escapeHtml(opts.cta ?? 'See photos, price history and details');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e5e5;">
  ${
    hasPhoto
      ? `<tr><td style="padding:0;line-height:0;"><a href="${url}"><img src="${escapeHtml(
          listingPhotoUrl(l.mls_number)
        )}" width="518" alt="${escapeHtml(listingAddressLine(l))}" style="display:block;width:100%;max-width:100%;height:auto;border:0;" /></a></td></tr>`
      : ''
  }
  <tr><td style="padding:20px 22px 6px 22px;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:20px;line-height:1.3;color:#1a1a1a;">
    <a href="${url}" style="color:#1a1a1a;text-decoration:none;">${escapeHtml(listingAddressLine(l))}</a>
  </td></tr>
  <tr><td style="padding:0 22px 4px 22px;font-family:Inter,Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#444444;">
    ${escapeHtml(listingFactsLine(l))}${status ? ` · ${escapeHtml(status)}` : ''}
  </td></tr>
  <tr><td style="padding:14px 22px 6px 22px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td bgcolor="#1a1a1a" style="background-color:#1a1a1a;">
        <a href="${url}" style="display:inline-block;padding:12px 22px;font-family:Inter,Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#ffffff;text-decoration:none;">${cta}</a>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:10px 22px 18px 22px;font-family:Inter,Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#888888;">
    MLS #${escapeHtml(l.mls_number)}${
      l.office_name ? ` · Listing courtesy of ${escapeHtml(l.office_name)}` : ''
    } · Information from MLS PIN, deemed reliable but not guaranteed.
  </td></tr>
</table>`;
};
