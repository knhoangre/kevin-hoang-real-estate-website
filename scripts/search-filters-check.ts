/**
 * Assertions for src/lib/searchFilters.ts: which homes /search asks for, and
 * what its links mean.
 *
 *   node scripts/search-filters-check.ts
 *
 * Same arrangement as valuation-check.ts: Node runs the TypeScript directly, so
 * this imports the real module rather than a copy of it.
 *
 * It exists for three things nothing else would catch. A link Kevin texted a
 * client months ago has to keep meaning what it meant. A status left out of
 * every button is a home nobody can reach, which is what happened to Coming
 * Soon. And the status list in the migration's indexes has to match the one
 * here, or a mix quietly stops using them and times out.
 */
import { readFileSync } from 'node:fs';
import {
  EMPTY_FILTERS,
  MARKET_STATUSES,
  filtersFromParams,
  isRentSearch,
  isSoldSearch,
  paramsFromFilters,
  pressKind,
  pressPriceCut,
  statusesFor,
  type ListingKind,
  type SearchFilters,
} from '../src/lib/searchFilters.ts';
import { AVAILABLE_STATUSES, isAvailable, isClosed } from '../src/lib/idxDecode.ts';

let failures = 0;
const is = (actual: unknown, expected: unknown, label: string) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`ok   ${label}`);
  } else {
    console.error(`FAIL ${label} (got ${a}, expected ${e})`);
    failures += 1;
  }
};

const read = (query: string) => filtersFromParams(new URLSearchParams(query));
const write = (f: SearchFilters) => decodeURIComponent(paramsFromFilters(f).toString());
const showing = (...show: ListingKind[]) => ({ ...EMPTY_FILTERS, show });

// --- Every link sent before the buttons could be combined ---
is(read('').show, ['sale'], 'no parameter: for sale');
is(read('for=sale').show, ['sale'], 'for=sale: for sale');
is(read('for=uag').show, ['uag'], 'for=uag: under agreement');
is(read('for=ctg').show, ['ctg'], 'for=ctg: contingent');
is(read('for=sold').show, ['sold'], 'for=sold: sold');
is(read('for=rent').show, ['rent'], 'for=rent: for rent');
is(read('for=all').show, ['sale', 'soon', 'ctg', 'uag'], 'for=all: the whole market');
is(read('for=pricecut').show, ['sale', 'ctg'], 'for=pricecut looks through for sale and contingent');
is(read('for=pricecut').priceCut, true, 'for=pricecut narrows to price cuts');
is(read('for=nonsense').show, ['sale'], 'an unknown value falls back to for sale');
is(read('town=Newton&max=900000').town, 'Newton', 'the other filters are read as before');

// --- A mix, in the URL ---
is(read('for=uag&for=sale').show, ['sale', 'uag'], 'a mix is read in reading order');
is(read('for=sale,uag').show, ['sale', 'uag'], 'a hand-typed comma list works too');
is(read('for=sale&for=sold').show, ['sold'], 'a separate list cannot be mixed, even by hand');
is(read('for=sale&for=sale').show, ['sale'], 'one of each');
is(read('for=sold&cut=1').priceCut, false, 'sold has no price cuts to narrow to');
is(write(EMPTY_FILTERS), '', 'the default writes nothing');
is(write(showing('rent')), 'for=rent', 'one kind writes the same link it always did');
is(write(showing('sale', 'uag')), 'for=sale&for=uag', 'a mix repeats the parameter');
is(write({ ...showing('sale'), priceCut: true }), 'cut=1', 'for sale with price cuts');
for (const query of ['for=sale&for=ctg&for=uag&cut=1&town=Newton', 'for=soon', 'for=rent&town=Boston&page=3']) {
  is(write(read(query)), query, `survives a round trip: ${query}`);
}

// --- Pressing the buttons ---
const pressed = (from: SearchFilters, kind: ListingKind) => pressKind(from, kind).show;
is(pressed(EMPTY_FILTERS, 'uag'), ['sale', 'uag'], 'a market button joins the mix');
is(pressed(showing('sale', 'uag'), 'sale'), ['uag'], 'and leaves it');
is(pressed(showing('uag', 'sale'), 'ctg'), ['sale', 'ctg', 'uag'], 'the mix stays in reading order');
is(pressed(showing('uag'), 'uag'), ['sale'], 'turning off the last one falls back to for sale');
is(pressed(EMPTY_FILTERS, 'sale'), ['sale'], 'for sale alone stays on');
is(pressed(showing('sale', 'ctg'), 'sold'), ['sold'], 'sold replaces the mix');
is(pressed(showing('sold'), 'rent'), ['rent'], 'for rent replaces sold');
is(pressed(showing('sold'), 'ctg'), ['ctg'], 'a market button replaces sold');
is(pressed(showing('sold'), 'sold'), ['sale'], 'turning sold off returns to for sale');
is(pressKind({ ...EMPTY_FILTERS, page: 7 }, 'uag').page, 1, 'a press returns to page 1');
is(pressKind({ ...EMPTY_FILTERS, priceCut: true }, 'uag').priceCut, true, 'price cuts survive a change of mix');
is(pressKind({ ...EMPTY_FILTERS, priceCut: true }, 'sold').priceCut, false, 'but not a move to sold');
is(pressKind({ ...showing('rent'), propType: 'RN' }, 'sale').propType, '', 'leaving rentals clears the Rental type');
is(pressKind({ ...showing('sale'), propType: 'SF' }, 'rent').propType, 'SF', 'any other type is kept');
is(pressPriceCut(EMPTY_FILTERS).priceCut, true, 'price cuts turn on');
is(pressPriceCut({ ...EMPTY_FILTERS, priceCut: true }).priceCut, false, 'and off');
is(pressPriceCut({ ...showing('sale', 'ctg'), page: 4 }).show, ['sale', 'ctg'], 'keeping the mix');
is(pressPriceCut({ ...showing('sale'), page: 4 }).page, 1, 'and returning to page 1');
is(pressPriceCut(showing('sold')).show, ['sale'], 'from sold it returns to the market');
is(pressPriceCut(showing('sold')).priceCut, true, 'with price cuts on');
is(isSoldSearch(showing('sold')), true, 'a sold search');
is(isRentSearch(showing('rent')), true, 'a rent search');
is(isSoldSearch(showing('sale', 'uag')), false, 'a mix is neither');

// --- Which homes a button means ---
is(statusesFor(['sale']), AVAILABLE_STATUSES, 'for sale is every status that can be bought today');
is(statusesFor(['sale']).includes('PCG'), true, 'a price-changed home is for sale');
is(statusesFor(['soon']), ['CSO'], 'coming soon');
is(statusesFor(['ctg', 'uag']), ['CTG', 'UAG'], 'a mix is the union');
is(statusesFor(['sold']), [], 'sold is not a market status');
is(isAvailable('CSO'), false, 'coming soon cannot be bought yet');

// Everything MLS PIN's IDX feed sends while a home is on the market has a button.
// Measured on the live feed 2026-10-30; CSO is the one that had none.
for (const code of ['ACT', 'NEW', 'BOM', 'PCG', 'EXT', 'RAC', 'CSO', 'CTG', 'UAG']) {
  is(MARKET_STATUSES.includes(code), true, `${code} is reachable from a button`);
}

// --- A sale that has closed, against a row that is merely in the sold feed ---
is(isClosed({ feed: 'sold', status: 'SLD' }), true, 'a closing is closed');
is(isClosed({ feed: 'sold', status: 'RNT' }), true, 'a signed lease is closed');
is(isClosed({ feed: 'sold', status: 'UAG' }), false, 'under agreement is in the sold feed and has not closed');
is(isClosed({ feed: 'sold', status: ' uag ' }), false, 'however the feed spells it');
is(isClosed({ feed: 'active', status: 'ACT' }), false, 'an active listing has not');

// --- The indexes a mix depends on ---
const migration = readFileSync(
  new URL('../supabase/migrations/20261030150000_idx_search_statuses.sql', import.meta.url),
  'utf8'
);
const predicates = [...migration.matchAll(/status IN \(([^)]*)\)/g)].map((m) =>
  m[1].split(',').map((code) => code.trim().replace(/'/g, ''))
);
is(predicates.length, 2, 'two indexes list the market statuses');
for (const listed of predicates) {
  is([...listed].sort(), [...MARKET_STATUSES].sort(), 'an index predicate matches MARKET_STATUSES');
}

if (failures > 0) {
  console.error(`\n${failures} failed`);
  process.exit(1);
}
console.log('\nAll passed');
