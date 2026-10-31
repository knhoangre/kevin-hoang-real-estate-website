/**
 * What /search is showing, and how that is written in its URL.
 *
 * Pure, with no Supabase import, so `node scripts/search-filters-check.ts` can
 * run it. The query itself is `matching()` in idxSearch.ts, which re-exports
 * everything here.
 *
 * The filter state lives entirely in the URL query string. Deliberately not
 * component state: `?town=Needham&max=900000` is itself a link Kevin can text
 * to a client, which is the whole point of this feature. State held in a
 * component is a search only the person who typed it can see.
 */
import { AVAILABLE_STATUSES } from './idxDecode.ts';

/**
 * The buttons at the top of the page.
 *
 * ANY MIX OF THE FOUR MARKET KINDS IS ONE LIST, sorted by asking price (Kevin,
 * 2026-10-30: "under agreement, contingent, for sale, etc together"). They were
 * tabs, one at a time, until then.
 *
 * SOLD AND FOR RENT STAY LISTS OF THEIR OWN, and pressing one replaces the mix.
 * A rent is per month, so mixing sorts a $4,000 apartment above a $2M house. A
 * closing is ordered by when it closed rather than by price — last week's sales
 * would otherwise sit behind a mansion that closed eleven months ago — and it
 * filters on what it sold for rather than what it asked. Sold listings are also
 * moving to a second database (soldApi.ts), and a page of 24 cannot be cut from
 * two databases at once.
 *
 * `sale` means what the words say: available to buy today. Coming soon is not
 * in it, because it cannot be shown or bought yet, and for the same reason it
 * is not in AVAILABLE_STATUSES.
 */
export type MarketKind = 'sale' | 'soon' | 'ctg' | 'uag';
export type SeparateKind = 'sold' | 'rent';
export type ListingKind = MarketKind | SeparateKind;

export const MARKET_KINDS: { value: MarketKind; label: string }[] = [
  { value: 'sale', label: 'For sale' },
  { value: 'soon', label: 'Coming soon' },
  { value: 'ctg', label: 'Contingent' },
  { value: 'uag', label: 'Under agreement' },
];

export const SEPARATE_KINDS: { value: SeparateKind; label: string }[] = [
  { value: 'sold', label: 'Sold' },
  { value: 'rent', label: 'For rent' },
];

const STATUSES_OF: Record<MarketKind, readonly string[]> = {
  sale: AVAILABLE_STATUSES,
  soon: ['CSO'],
  ctg: ['CTG'],
  uag: ['UAG'],
};

/**
 * The MLS status codes a mix of market kinds covers.
 *
 * The status decides, not the feed. Under agreement is filed in the SOLD feed
 * and everything else here in the active one, which is why the Under agreement
 * tab looked in the active feed, found nothing and showed nothing until
 * 2026-10-30, while its 6,976 homes sat at the far end of Sold.
 */
export const statusesFor = (show: readonly ListingKind[]): string[] =>
  show.flatMap((kind) => STATUSES_OF[kind as MarketKind] ?? []);

/** Every status the market kinds can ask for. The two indexes in 20261030150000 list these. */
export const MARKET_STATUSES = statusesFor(MARKET_KINDS.map((k) => k.value));

export interface SearchFilters {
  /** Never empty, and a separate kind is always alone. See normalizeShow. */
  show: ListingKind[];
  /**
   * Only homes whose price was cut. A narrowing of `show`, not another kind:
   * a price cut is something that happened to a home that is for sale or
   * contingent, so pressing it beside For sale has to mean "the ones for sale
   * that were cut". As one more kind in the mix it would add the 416 contingent
   * homes with a cut to the 16,370 for sale, and appear to do nothing.
   */
  priceCut: boolean;
  /** Free text, matched against address, town and MLS number. */
  q: string;
  town: string;
  propType: string;
  minPrice: string;
  maxPrice: string;
  beds: string;
  baths: string;
  page: number;
}

const DEFAULT_SHOW: ListingKind[] = ['sale'];

export const EMPTY_FILTERS: SearchFilters = {
  show: DEFAULT_SHOW,
  priceCut: false,
  q: '',
  town: '',
  propType: '',
  minPrice: '',
  maxPrice: '',
  beds: '',
  baths: '',
  page: 1,
};

const isSeparate = (kind: ListingKind): kind is SeparateKind => kind === 'sold' || kind === 'rent';

export const isSoldSearch = (f: Pick<SearchFilters, 'show'>) => f.show[0] === 'sold';
export const isRentSearch = (f: Pick<SearchFilters, 'show'>) => f.show[0] === 'rent';

/** Reading order, one of each; a separate kind alone; and never nothing. */
const normalizeShow = (kinds: readonly ListingKind[]): ListingKind[] => {
  const separate = kinds.find(isSeparate);
  if (separate) return [separate];
  const mix = MARKET_KINDS.map((k) => k.value).filter((k) => kinds.includes(k));
  return mix.length > 0 ? mix : DEFAULT_SHOW;
};

/**
 * Pressing a button. A market kind joins or leaves the mix; a separate kind
 * replaces it. Turning off the last one falls back to For sale, so there is no
 * state in which the page has nothing to ask for.
 */
export const pressKind = (f: SearchFilters, kind: ListingKind): SearchFilters => {
  const separateNow = isSeparate(f.show[0]);
  let show: ListingKind[];
  if (isSeparate(kind)) show = f.show[0] === kind ? DEFAULT_SHOW : [kind];
  else if (separateNow) show = [kind];
  else show = f.show.includes(kind) ? f.show.filter((k) => k !== kind) : [...f.show, kind];

  const next = normalizeShow(show);
  return {
    ...f,
    show: next,
    // Only the market has price cuts to narrow to.
    priceCut: isSeparate(next[0]) ? false : f.priceCut,
    // "Rental" is only offered on the rent list, and on any other it matches nothing.
    propType: next[0] !== 'rent' && f.propType === 'RN' ? '' : f.propType,
    // Staying on page 7 of a search that now has two results is how a filter
    // appears broken.
    page: 1,
  };
};

/** From Sold or For rent, this returns to the market it narrows. */
export const pressPriceCut = (f: SearchFilters): SearchFilters =>
  isSeparate(f.show[0])
    ? { ...pressKind(f, 'sale'), priceCut: true }
    : { ...f, priceCut: !f.priceCut, page: 1 };

/**
 * What every link sent before the buttons could be combined still means. `all`
 * was the whole market, and `pricecut` looked through what was for sale and
 * what was contingent.
 */
const OLD_LINKS: Record<string, ListingKind[]> = {
  all: MARKET_KINDS.map((k) => k.value),
  pricecut: ['sale', 'ctg'],
};

const isKind = (value: string): value is ListingKind =>
  [...MARKET_KINDS, ...SEPARATE_KINDS].some((k) => k.value === value);

export const filtersFromParams = (params: URLSearchParams): SearchFilters => {
  const asked = params.getAll('for').flatMap((value) => value.split(','));
  const show = normalizeShow(
    asked.flatMap((value) => OLD_LINKS[value] ?? (isKind(value) ? [value] : []))
  );
  return {
    show,
    priceCut: !isSeparate(show[0]) && (params.get('cut') === '1' || asked.includes('pricecut')),
    q: params.get('q') ?? '',
    town: params.get('town') ?? '',
    propType: params.get('type') ?? '',
    minPrice: params.get('min') ?? '',
    maxPrice: params.get('max') ?? '',
    beds: params.get('beds') ?? '',
    baths: params.get('baths') ?? '',
    page: Math.max(1, Number(params.get('page') ?? '1') || 1),
  };
};

/**
 * Only non-empty values are written, so a shared URL stays readable. For sale
 * alone is the default, so it stays out of the URL too — a link should carry
 * what was chosen, not restate the defaults. A mix repeats the parameter
 * (`for=sale&for=uag`), which needs no escaping and leaves every older
 * one-kind link meaning what it always did.
 */
export const paramsFromFilters = (f: SearchFilters): URLSearchParams => {
  const p = new URLSearchParams();
  if (!(f.show.length === 1 && f.show[0] === 'sale')) {
    for (const kind of f.show) p.append('for', kind);
  }
  if (f.priceCut) p.set('cut', '1');
  if (f.q) p.set('q', f.q);
  if (f.town) p.set('town', f.town);
  if (f.propType) p.set('type', f.propType);
  if (f.minPrice) p.set('min', f.minPrice);
  if (f.maxPrice) p.set('max', f.maxPrice);
  if (f.beds) p.set('beds', f.beds);
  if (f.baths) p.set('baths', f.baths);
  if (f.page > 1) p.set('page', String(f.page));
  return p;
};
