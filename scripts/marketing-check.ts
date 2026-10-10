/**
 * Assertions for src/lib/marketing.ts — the booklets and the expense and
 * upgrade sheets at /admin/marketing.
 *
 *   node scripts/marketing-check.ts
 *
 * Same arrangement as valuation-check.ts: Node runs the TypeScript directly, so
 * this imports the real module rather than a copy of it. No network, no
 * database, nothing from node_modules.
 *
 * What is checked is what would look fine on screen and be wrong on paper:
 *
 *   * a fact MLS does not have printing as 0, or a $1 placeholder as a price;
 *   * a crop that can be dragged until an empty edge shows;
 *   * a total that adds up only the rows it could read;
 *   * a long list running into the footer instead of onto a second page;
 *   * a stored document from before a field existed failing to open;
 *   * on the neighborhood page: a school that is nearer but not public being
 *     ticked for him, a park measured to the wrong parcel, a pin numbered for
 *     a place that is not on the map, tiles that leave a gap.
 */
import {
  MANUAL_PREFIX,
  MAP_FRAME,
  TILE_DRAWN,
  blankAround,
  formatMiles,
  gradeSpan,
  highwayName,
  highwaysFrom,
  hydrateAround,
  mapMilesAcross,
  mapPoint,
  mapTiles,
  mergeFound,
  milesBetween,
  parksFrom,
  placesFromPhoton,
  schoolsFrom,
  shownPlaces,
  sourcesOf,
  transitFrom,
  type ArcFeature,
  type Around,
  type LatLon,
  type MbtaStop,
  type PhotonFeature,
  type Place,
  type PlaceGroup,
} from '../src/lib/around.ts';
import {
  DENSITY,
  DESIGNS,
  SOFT_PPI,
  bathsLine,
  blankAgent,
  blankDoc,
  cityLineOf,
  dealPhotos,
  designOf,
  designsFor,
  docTitle,
  drawnOffset,
  drawnSize,
  getPhoto,
  hydrateDoc,
  layoutSheet,
  panBy,
  parseMoney,
  placed,
  priceLine,
  printPpi,
  refreshPrice,
  rowsFromText,
  seedFromListing,
  setPhoto,
  slotsOf,
  statsFrom,
  sumValues,
  type ListingFacts,
  type Photo,
  type Row,
} from '../src/lib/marketing.ts';

let failures = 0;
const is = (actual: unknown, expected: unknown, label: string) => {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  if (same) {
    console.log(`ok   ${label}`);
  } else {
    console.error(`FAIL ${label} (got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)})`);
    failures += 1;
  }
};
const yes = (cond: boolean, label: string) => is(cond, true, label);

const me = { ...blankAgent(), name: 'Kevin Hoang', brokerage: 'LPT Realty' };

/* A single-family, as the feed sends one: shouted address, every fact present. */
const house: ListingFacts = {
  mls_number: '73000001',
  address: '151 WASHINGTON ST',
  town: 'Medford',
  state: 'ma',
  zip: '02155',
  prop_type: 'SF',
  list_price: 1349000,
  bedrooms: 5,
  full_baths: 3,
  half_baths: 1,
  living_area: 4200,
  lot_size: 7405,
  year_built: 2016,
  garage_spaces: 2,
  parking_spaces: 6,
  total_rooms: 11,
  hoa_fee: null,
  num_units: null,
  remarks: '  Stunning, freshly painted single-family home.  ',
  photo_count: 38,
};

/* A condo with most of it missing. */
const condo: ListingFacts = {
  ...house,
  mls_number: '73000002',
  address: '3 Pond View Way Unit B',
  town: 'NORTHBOROUGH',
  state: 'MA',
  zip: '01532',
  prop_type: 'CC',
  list_price: 549900,
  bedrooms: 2,
  full_baths: 2,
  half_baths: 1,
  living_area: 1552,
  lot_size: 435600,
  year_built: null,
  garage_spaces: 0,
  parking_spaces: null,
  total_rooms: null,
  hoa_fee: 425,
  photo_count: 4,
};

/* ---------------------------------------------------------------- MLS -> page */

const seeded = seedFromListing(blankDoc('booklet', me), house, 'Some Other Realty');

is(seeded.street, '151 Washington St', 'a shouted address is cased the way it is written');
is(seeded.cityLine, 'Medford, MA 02155', 'the city line keeps the ZIP and its leading zero');
is(seeded.price, '$1,349,000', 'the price is whole dollars');
is(seeded.description, 'Stunning, freshly painted single-family home.', 'the description is the remarks, trimmed');
is(seeded.office, 'Some Other Realty', 'the listing office is kept for the editor');
is(seeded.mls, '73000001', 'the MLS number is kept');
is(
  seeded.stats.slice(0, 5),
  [
    { label: 'Square feet', value: '4,200' },
    { label: 'Bedrooms', value: '5' },
    { label: 'Bathrooms', value: '3.5' },
    { label: 'Garage', value: '2' },
    { label: 'Year built', value: '2016' },
  ],
  'a house leads with size, beds, baths, garage and year — the five his own booklet shows'
);
yes(seeded.stats.some((s) => s.label === 'Lot (sq ft)' && s.value === '7,405'), 'a house offers its lot size');
yes(!seeded.stats.some((s) => s.label === 'HOA fee'), 'a house with no fee has no HOA line at all');

const condoStats = statsFrom(condo);
is(
  condoStats,
  [
    { label: 'Square feet', value: '1,552' },
    { label: 'Bedrooms', value: '2' },
    { label: 'Bathrooms', value: '2.5' },
    { label: 'HOA fee', value: '$425/mo' },
  ],
  'a condo shows its fee, and NOTHING for the garage, parking, year and rooms MLS does not have'
);
yes(!condoStats.some((s) => s.label.startsWith('Lot')), 'a condo never prints a lot: that is the whole complex');
yes(condoStats.every((s) => s.value !== '' && s.value !== '0'), 'no fact prints as empty or as zero');

is(bathsLine(2, 0), '2', 'two full baths is 2');
is(bathsLine(2, 1), '2.5', 'two full and a half is 2.5');
is(bathsLine(2, 2), '2 full, 2 half', 'two half baths are spelled out, not rounded up to 3');
is(bathsLine(null, null), '', 'unknown baths is nothing');
is(statsFrom({ ...condo, bedrooms: 0 })[1], { label: 'Bedrooms', value: 'Studio' }, 'no bedrooms is a studio, not a 0');

is(priceLine({ list_price: 1, prop_type: 'SF' }), '', 'a $1 placeholder is not printed as a price');
is(priceLine({ list_price: null, prop_type: 'SF' }), '', 'no price is blank, not "Price on request"');
is(priceLine({ list_price: 3200, prop_type: 'RN' }), '$3,200/mo', 'a rent is per month and is not mistaken for a placeholder');
is(cityLineOf({ town: 'NORTHBOROUGH', state: 'MA', zip: '01532' }), 'Northborough, MA 01532', 'a shouted town is cased');
is(cityLineOf({ town: 'Newton', state: null, zip: null }), 'Newton', 'a town alone has no stray comma');

/* ------------------------------------------------------------------- photos */

is(seeded.photos.cover, placed({ type: 'mls', mls: '73000001', n: 0 }), 'the first MLS photo is the cover');
is(seeded.photos.in1?.src, { type: 'mls', mls: '73000001', n: 1 }, 'the second is the first inside frame');
is(seeded.photos.header?.src, { type: 'mls', mls: '73000001', n: 0 }, 'a sheet opens on the same front photo');

const few = dealPhotos('73000002', 4);
is(Object.keys(few).sort(), ['cover', 'header', 'in1', 'in2', 'in3'], 'four photos fill four frames and repeat none');
is(dealPhotos('73000003', 0), {}, 'a listing with no photos fills nothing');

const upload: Photo = placed({ type: 'upload', path: 'doc/plan.png' });
const withUpload = { ...seeded, photos: { ...seeded.photos, in2: upload }, rows: [{ label: 'Gas', date: '', value: '$60' }] };
const reseeded = seedFromListing(withUpload, condo, null);
is(reseeded.photos.in2, upload, 'choosing another listing keeps the picture Kevin uploaded');
is(reseeded.photos.in4, undefined, 'and empties the frames the new listing has no photo for');
is(reseeded.rows, withUpload.rows, 'and leaves the rows he typed alone');
is(reseeded.agents, withUpload.agents, 'and the agents');

is(refreshPrice({ ...seeded, description: 'Reworded by hand.' }, { ...house, list_price: 1299000 }).price, '$1,299,000', 'updating from MLS takes the new price');
is(refreshPrice({ ...seeded, description: 'Reworded by hand.' }, { ...house, list_price: 1299000 }).description, 'Reworded by hand.', 'and touches nothing Kevin reworded');
is(refreshPrice(seeded, { ...house, list_price: null }).price, '$1,349,000', 'a listing whose price has gone keeps the one printed');

/* --------------------------------------------------------------- the designs */

for (const design of DESIGNS) {
  yes(design.slots.length > 0, `${design.family} "${design.label}" declares its picture frames`);
  is(new Set(design.slots.map((s) => s.key)).size, design.slots.length, `${design.family} "${design.label}" has no frame twice`);
}
is(designsFor('booklet').map((d) => d.id), ['classic', 'welcome', 'noir', 'gallery'], 'four booklets: two of his, two new');
is(designsFor('expenses').map((d) => d.id), ['sheet-classic', 'sheet-noir', 'sheet-gallery'], 'three sheets, one of his');
is(designsFor('upgrades').map((d) => d.id), designsFor('expenses').map((d) => d.id), 'expenses and upgrades share them');
is(designOf({ kind: 'expenses', design: 'classic' }).id, 'sheet-classic', 'a booklet design named on a sheet falls back to a sheet design');

const plan = { ...seeded, back: 'plan' as const };
yes(!slotsOf(plan).some((s) => s.key === 'back1'), 'with a floor plan on the back, the back photos are not frames');
yes(slotsOf(plan).some((s) => s.key === 'plan1' && s.fit === 'contain'), 'and a floor plan is shown whole, never cropped to fill');
yes(slotsOf(seeded).some((s) => s.key === 'agent0.photo'), 'every agent has a headshot frame');
yes(slotsOf({ ...seeded, design: 'noir' }).every((s) => s.key !== 'in7'), 'a design does not list frames it does not draw');

const logo = placed({ type: 'upload', path: 'doc/logo.png' });
is(getPhoto(setPhoto(seeded, 'agent0.logo', logo), 'agent0.logo'), logo, "an agent's logo is set and read through the same two functions as any frame");
is(getPhoto(setPhoto(seeded, 'cover', null), 'cover'), null, 'a frame can be emptied');
is(getPhoto(seeded, 'agent1.photo'), null, 'an agent who is not there has no picture');

/* ------------------------------------------------------------------ the crop */

// A 3:2 photograph in a square frame: it overflows sideways and has slack to pan.
const wide = drawnSize(300, 300, 1500, 1000, 1, 'cover');
is(wide, { w: 450, h: 300 }, 'a wide photo covers a square frame by its height');

let worst = 0;
for (const zoom of [1, 1.3, 2, 4]) {
  for (const x of [0, 0.25, 0.5, 1]) {
    for (const y of [0, 0.6, 1]) {
      for (const [nw, nh] of [[1500, 1000], [481, 640], [2048, 1365], [800, 800]]) {
        for (const [fw, fh] of [[455, 303], [300, 300], [168, 168], [212, 141]]) {
          const drawn = drawnSize(fw, fh, nw, nh, zoom, 'cover');
          const at = drawnOffset({ x, y }, fw, fh, drawn);
          // How far any frame edge is from being covered. Positive is a gap.
          worst = Math.max(worst, at.left, at.top, fw - (at.left + drawn.w), fh - (at.top + drawn.h));
        }
      }
    }
  }
}
yes(worst < 1e-6, 'no crop position, zoom, photo shape or frame shape leaves an empty edge');

const start: Photo = { src: { type: 'mls', mls: '1', n: 0 }, x: 0.5, y: 0.5, zoom: 1 };
const dragged = panBy(start, 30, 40, 300, 300, 1500, 1000, 'cover');
yes(dragged.x < 0.5, 'dragging right shows more of the left of the photo');
is(dragged.y, 0.5, 'and does not move it on the axis where it has no room');
is(panBy(start, 100000, 0, 300, 300, 1500, 1000, 'cover').x, 0, 'a drag stops at the edge of the photo');
is(panBy(start, -100000, 0, 300, 300, 1500, 1000, 'cover').x, 1, 'in both directions');
const before = drawnOffset(start, 300, 300, wide).left;
const after = drawnOffset(dragged, 300, 300, wide).left;
yes(Math.abs(after - before - 30) < 1e-6, 'the photo moves exactly as far as the pointer did');
yes(panBy({ ...start, zoom: 2 }, 0, 25, 300, 300, 1500, 1000, 'cover').y < 0.5, 'zoomed in, it can be moved on both axes');

// A floor plan shown whole: smaller than its frame one way, and it must not jump.
const planDrawn = drawnSize(400, 300, 600, 900, 1, 'contain');
is(planDrawn, { w: 200, h: 300 }, 'a tall floor plan is shown whole');
is(drawnOffset({ x: 0.5, y: 0.5 }, 400, 300, planDrawn), { left: 100, top: 0 }, 'and centred');

yes(printPpi(455, 303, 2048, 1365, 1, 'cover') > 300, 'a 2048px MLS photo on the cover is print quality');
yes(printPpi(455, 303, 481, 640, 1, 'cover') < SOFT_PPI, 'a 481px one is flagged as soft');
yes(printPpi(455, 303, 2048, 1365, 4, 'cover') < printPpi(455, 303, 2048, 1365, 1, 'cover'), 'zooming in costs resolution');

/* ----------------------------------------------------------------- the total */

// Keys in the order the module writes them: `is` compares JSON text.
const row = (label: string, value = '', date = ''): Row => ({ label, date, value });

is(parseMoney('$31,186.00'), 31186, '"$31,186.00" is a dollar amount');
is(parseMoney('980'), 980, 'so is "980"');
is(parseMoney('$70 - $80 / MONTH'), null, 'a range is not');
is(parseMoney('$1,2,3'), null, 'nor is a mangled one');
is(parseMoney(''), null, 'nor is nothing');

// Kevin's Natick sheet, all 26 lines.
const natick: Row[] = [
  ['Painting', '$31,186.00'], ['Refinish floor', '$13,086.00'], ['Water soften system', '$10,973.05'],
  ['Solar panel', '$134,629.38'], ['Basement floor', '$6,298.74'],
  ['Basement foundation settle protection', '$8,879.00'], ['ERV & humidifier', '$13,890.79'],
  ['Water pump for basement', '$1,200.00'], ['Leach field checking point', '$2,975.00'],
  ['Backyard construction', '$85,653.74'], ['Heat pump', '$13,400.00'], ['Power wall', '$9,700.00'],
  ['Tankless water heater', '$10,098.00'], ['HVAC damper', '$325.00'], ['Vent hood', '$2,492.06'],
  ['Backyard shed', '$8,600.00'], ['Backyard screen', '$2,000.00'], ['New washer and dryer', '$3,240.00'],
  ['Garage floor upgrade', '$8,900.00'], ['Refrigerator', '$3,700.00'], ['Electric bowl seat', '$3,800.00'],
  ['Garage ceiling seal and checking point', '$3,200.00'], ['Wifi controlled switch', '$3,200.00'],
  ['Wifi controlled door lock', '$980.00'],
  ['Solar panel charged cameral and wifi control state', '$1,560.00'],
  ['Wifi controlled irrigation system', '$2,300.00'],
].map(([label, value]) => row(label, value));

is(sumValues(natick), '$386,266.76', "his Natick sheet's 26 lines add up to the total printed on it");
is(sumValues([row('Paint', '$1,000'), row('Floors', '$2,500')]), '$3,500', 'whole dollars total in whole dollars');
is(sumValues([row('Paint', '$1,000'), row('Gas', '$70 - $80 / month')]), null, 'one row that is not a plain amount, and there is no total');
is(sumValues([row('Paint', '$1,000'), row('New fence')]), null, 'one row with no figure, and there is no total');
is(sumValues([row('Paint', '$1,000'), row('', ''), row('Floors', '$2,500')]), '$3,500', 'an empty row is not a row');
is(sumValues([row('Paint', '$1,000')]), null, 'one line is not a total');
is(sumValues([row('a', '$0.10'), row('b', '$0.20')]), '$0.30', 'cents add up without drifting');

/* ------------------------------------------------------------------- pasting */

is(
  rowsFromText('PAINTING $31,186.00\nREFINISH FLOOR $13,086.00\n\nHVAC DAMPER $325.00', 'upgrades'),
  [row('PAINTING', '$31,186.00'), row('REFINISH FLOOR', '$13,086.00'), row('HVAC DAMPER', '$325.00')],
  'pasted lines become rows, split at the dollar sign, with blank lines dropped'
);
is(
  rowsFromText('WATER & SEWER $70 - $80 / MONTH\nMASTER INSURANCE', 'expenses'),
  [row('WATER & SEWER', '$70 - $80 / MONTH'), row('MASTER INSURANCE')],
  'a range stays whole in the value, and a line with no figure is a label alone'
);
is(
  rowsFromText('2017 NEW RANGE HOOD\nNEW TOILET\n2019 NEW AIR CONDITIONER', 'upgrades'),
  [row('NEW RANGE HOOD', '', '2017'), row('NEW TOILET'), row('NEW AIR CONDITIONER', '', '2019')],
  'a leading year is the date, and a line without one does not borrow the year above'
);
is(rowsFromText('2017 NEW RANGE HOOD', 'expenses'), [row('2017 NEW RANGE HOOD')], 'an expense sheet has no dates to find');
is(
  rowsFromText('2024\tHeat pump\t$13,400.00\nSolar\t$134,629.38', 'upgrades'),
  [row('Heat pump', '$13,400.00', '2024'), row('Solar', '$134,629.38')],
  'cells pasted from a spreadsheet are taken as they are'
);
is(rowsFromText('  \n  ', 'upgrades'), [], 'pasting nothing adds nothing');

/* ------------------------------------------------------------------ the pages */

const natickLayout = layoutSheet({ kind: 'upgrades', rows: natick });
is(natickLayout.pages.length, 2, 'his 26-line sheet takes two pages, as his own does');
is(natickLayout.pages.flat().length, 26, 'and every line is on one of them');
is(natickLayout.density, 'compact', 'set small, as his is');
yes(natickLayout.showValue && !natickLayout.showDate, 'with a value column and no date column');
is(natickLayout.total, '$386,266.76', 'and the total');
yes(
  natickLayout.pages.every((p) => p.length <= DENSITY.compact.linesPerPage),
  'no page holds more lines than fit above the footer'
);
yes(
  natickLayout.pages[natickLayout.pages.length - 1].length < DENSITY.compact.linesPerPage,
  'and the last page has a line free for the total'
);

// His Billerica sheet: years that head a group.
const billerica = [
  row('New range hood', '', '2017'), row('New bathroom exhaust fan', '', '2017'), row('New toilet', '', '2017'),
  row('New air conditioner', '', '2019'), row('New dishwasher', '', '2026'), row('New garbage disposal', '', '2026'),
];
const dated = layoutSheet({ kind: 'upgrades', rows: billerica });
yes(dated.showDate && !dated.showValue, 'dates and no values: a date column and no value column');
is(dated.pages[0].map((r) => r.dateCell), ['2017', '', '', '2019', '2026', ''], 'a year is printed once, at the head of its group');
is(dated.total, null, 'and with no values there is no total');
is(dated.density, 'airy', 'six lines are set large');

// His Dedham sheet: upgrades alone.
const bare = layoutSheet({ kind: 'upgrades', rows: [row('New fence'), row('Pollinator garden')] });
yes(!bare.showDate && !bare.showValue, 'upgrades alone: one column');

// His Waltham expenses.
const waltham = layoutSheet({
  kind: 'expenses',
  rows: [
    row('Water & sewer', '$70 - $80 / month'), row('Electricity', '$150 / month'), row('Gas', '$60 / month'),
    row('Landscaping', '$100 - $120 / month / unit'), row('Snow removal', '$50 - $60 / visit / unit'),
    row('Master insurance', '$3,806 total / year\n(split between 3 units)'), row('', ''),
  ],
});
is(waltham.pages.length, 1, 'his six expenses are one page');
is(waltham.pages[0].length, 6, 'and the empty row at the end is not printed');
is(waltham.total, null, 'an expense sheet is never totalled: its lines are ranges and per-visit prices');
yes(waltham.showValue, 'an expense sheet always has its price column');

is(layoutSheet({ kind: 'expenses', rows: [] }).pages, [[]], 'an empty sheet is still one page');

// A year that continues over a page break is printed again at the top.
const long = Array.from({ length: 20 }, (_, i) => row(`Upgrade ${i + 1}`, '', '2024'));
const broken = layoutSheet({ kind: 'upgrades', rows: long });
is(broken.pages.length, 2, 'twenty lines break onto a second page');
is(broken.pages[1][0].dateCell, '2024', 'and the year is printed again at the top of it');

// A label too long for its column counts for more than one line.
const wordy = Array.from({ length: 14 }, (_, i) =>
  row(`Upgrade ${i + 1} — ${'a very long description of the work that was carried out '.repeat(2)}`, '$1,000')
);
yes(layoutSheet({ kind: 'upgrades', rows: wordy }).pages.length > 1, 'fourteen long lines do not all go on one page');

// The total never lands alone on the footer.
const full = Array.from({ length: 14 }, (_, i) => row(`Upgrade ${i + 1}`, '$1,000'));
const fullLayout = layoutSheet({ kind: 'upgrades', rows: full });
is(fullLayout.pages.map((p) => p.length), [13, 1], 'a full page gives up its last line so the total has one');

/* ------------------------------------------------------------ stored documents */

const blank = blankDoc('booklet', me);
is(hydrateDoc(JSON.parse(JSON.stringify(seeded)), 'booklet', me), seeded, 'a saved document opens exactly as it was saved');
is(hydrateDoc(null, 'booklet', me), blank, 'nothing stored opens as a blank document');
is(hydrateDoc('not an object', 'upgrades', me).kind, 'upgrades', 'so does something that is not a document');
is(hydrateDoc({ street: '1 Elm St' }, 'booklet', me).agents, [me], 'a document saved before agents existed gets Kevin');
is(hydrateDoc({ street: 42, stats: 'no', photos: [1] }, 'booklet', me).street, '', 'a field of the wrong type is dropped, not trusted');
is(hydrateDoc({ design: 'retired-design' }, 'booklet', me).design, 'classic', 'a design that no longer exists falls back');
is(
  hydrateDoc({ photos: { cover: { src: { type: 'mls', mls: '7', n: 2 }, x: 9, y: -3, zoom: 99 } } }, 'booklet', me).photos.cover,
  { src: { type: 'mls', mls: '7', n: 2 }, x: 1, y: 0, zoom: 4 },
  'a crop outside its range is brought back inside it'
);
is(
  hydrateDoc({ photos: { cover: { src: { type: 'url', path: 'https://example.com/x.jpg' } } } }, 'booklet', me).photos.cover,
  undefined,
  'a picture from a source this does not know is not shown'
);
is(hydrateDoc({ agents: [me, me, me] }, 'booklet', me).agents.length, 2, 'at most two agents');
is(docTitle({ street: ' 151 Washington St ', cityLine: 'Medford, MA 02155' }), '151 Washington St, Medford, MA 02155', 'a document is listed under its address');
is(docTitle({ street: '', cityLine: '' }), '', 'and under nothing until it has one');

/* =========================================================== around the home */

const home: LatLon = { lat: 42.334944, lon: -71.224472 };
/** A point so many miles north and east of the house. */
const off = (north: number, east = 0): { x: number; y: number } => ({
  y: home.lat + north / 69.09,
  x: home.lon + east / (69.17 * Math.cos((home.lat * Math.PI) / 180)),
});
const near = (a: number, b: number, tolerance = 0.02) => Math.abs(a - b) <= tolerance;

yes(near(milesBetween(home, { lat: off(1).y, lon: off(1).x }), 1), 'a point a mile north is a mile away');
yes(near(milesBetween(home, { lat: off(0, 1).y, lon: off(0, 1).x }), 1), 'and so is one a mile east');
is(formatMiles(0.04), 'under 0.1 mi', 'next door is "under 0.1 mi", never "0.0 mi"');
is(formatMiles(0.449), '0.4 mi', 'distances are to one decimal');
is(formatMiles(12.3), '12 mi', 'and to the mile past ten');

is(gradeSpan('K,01,02,03,04,05'), 'K–5', 'an elementary school is K–5');
is(gradeSpan('PK,K,01,02,03,04,05'), 'PK–5', 'with pre-K, PK–5');
is(gradeSpan('09,10,11,12'), '9–12', 'a high school is 9–12');
is(gradeSpan('PK'), 'Pre-K', 'one grade is named');
is(gradeSpan(null), '', 'no grades is nothing');

const school = (NAME: string, GRADES: string, TYPE_DESC: string, miles: number): ArcFeature => ({
  attributes: { NAME, GRADES, TYPE_DESC },
  geometry: off(miles),
});
const schools = schoolsFrom(
  [
    school('Mason-Rice School', 'K,01,02,03,04,05', 'Public Elementary', 1.3),
    school('Zervas School', 'K,01,02,03,04,05', 'Public Elementary', 0.5),
    school('Learning Prep School', '02,03,04,05,06,07,08,09,10,11,12', 'Special Education (Approved)', 0.9),
    school('Peirce School', 'K,01,02,03,04,05', 'Public Elementary', 0.6),
    school('Newton North High School', '09,10,11,12', 'Public Secondary', 1.1),
    school('F.A. Day Middle School', '06,07,08', 'Public Middle', 1.7),
    school('Wellan Montessori School', 'PK,K,01,02,03,04,05,06,07,08', 'Private', 0.2),
    school('Newton Early Childhood Program', 'PK', 'Public Elementary', 0.3),
    school('Zervas School', 'K,01,02,03,04,05', 'Public Elementary', 0.5),
    { attributes: { NAME: '  ', GRADES: '', TYPE_DESC: '' }, geometry: off(0.1) },
  ],
  home
);
is(
  schools.map((p) => p.name),
  ['Wellan Montessori School', 'Newton Early Childhood Program', 'Zervas School', 'Peirce School', 'Learning Prep School', 'Newton North High School', 'Mason-Rice School', 'F.A. Day Middle School'],
  'schools are listed nearest first, once each, and a nameless row is dropped'
);
is(
  schools.filter((p) => p.show).map((p) => p.name),
  ['Zervas School', 'Peirce School', 'Newton North High School', 'Mason-Rice School', 'F.A. Day Middle School'],
  'the public schools are ticked — the middle and high school even though others are nearer'
);
yes(!schools.find((p) => p.name.startsWith('Wellan'))!.show, 'a private school is listed but not ticked, though it is the nearest');
yes(!schools.find((p) => p.name.includes('Early Childhood'))!.show, 'nor is a pre-K programme');
// A dense area: a dozen private schools nearer than any public high school.
const dense = schoolsFrom(
  [
    ...Array.from({ length: 14 }, (_, i) => school(`Private Academy ${i + 1}`, 'K,01,02,03', 'Private', 0.1 + i * 0.05)),
    school('Alternative High School', '09,10,11,12', 'Public Secondary', 1.1),
    school('Town High School', '09,10,11,12', 'Public Secondary', 1.7),
    school('Third High School', '09,10,11,12', 'Public Secondary', 2.0),
    school('Town Middle School', '06,07,08', 'Public Middle', 2.2),
    school('Far Elementary', 'K,01,02,03,04,05', 'Public Elementary', 2.4),
  ],
  home
);
is(
  dense.filter((p) => p.show).map((p) => p.name),
  ['Alternative High School', 'Town High School', 'Third High School', 'Town Middle School', 'Far Elementary'],
  'where a dozen other schools are nearer, the public middle and high schools are still found and ticked'
);
yes(dense.findIndex((p) => p.name === 'Town High School') > dense.findIndex((p) => p.name === 'Private Academy 12'),
  'and they sit in the list in order of distance, after the nearer ones');
is(dense.filter((p) => p.name.startsWith('Private')).length, 12, 'the nearest dozen of everything else are offered, unticked');

is(schools[2].note, 'K–5 · Public', 'a school says its grades and that it is public');
is(schools[4].note, '2–12 · Special education', 'and a special-education school says so');
is(schools[2].distance, '0.5 mi', 'with its distance');

const square = (north: number, east: number, size = 0.02): number[][][] => {
  const a = off(north, east);
  const b = off(north + size, east + size);
  return [[[a.x, a.y], [b.x, a.y], [b.x, b.y], [a.x, b.y], [a.x, a.y]]];
};
const park = (SITE_NAME: string, GIS_ACRES: number, north: number, east: number, size?: number): ArcFeature => ({
  attributes: { SITE_NAME, GIS_ACRES },
  geometry: { rings: square(north, east, size) },
});
const parks = parksFrom(
  [
    park('Coldspring Park', 5.5, 0.9, 0),
    park('Coldspring Park', 60.4, 0.5, 0, 0.3),
    park('Lincoln Playground', 5.35, 0.4, 0),
    park('Zervas School', 3.8, 0.2, 0),
    park('Traffic Island', 0.2, 0.1, 0),
    park('Pocket Green', 0.3, 0.15, 0),
    park('Albemarle Playground', 1.2, 0.7, 0),
  ],
  home
);
is(parks.map((p) => p.name), ['Lincoln Playground', 'Coldspring Park', 'Albemarle Playground'], 'parks: nearest first; school grounds, traffic islands and planted corners are not parks');
is(parks[1].note, '66 acres', "a park in several parcels is one park, and its acres are added");
is(parks[1].distance, '0.5 mi', 'measured to its nearest edge, not to the parcel that happened to come first');
is(parks[2].note, '1 acre', 'one acre is "1 acre"');
yes(near(milesBetween(home, { lat: parks[1].lat!, lon: parks[1].lon! }), 0.68, 0.06), 'its pin is on the largest parcel');

const exit = (CORRIDOR: string, EXIT_NUM: string, JUNCTION: string, miles: number): ArcFeature => ({
  attributes: { CORRIDOR, EXIT_NUM, JUNCTION },
  geometry: off(0, miles),
});
const highways = highwaysFrom(
  [
    exit('I95', '37', 'Jct. RTE 16', 1.5),
    exit('I90', '125', 'Jct. RTE 16', 1.0),
    exit('I95', '36', 'Jct. RTE 9', 1.3),
    exit('SR2', '133', 'Park Ave.', 5.7),
    exit('I90', '123B', 'Jct. RTE 30', 2.0),
  ],
  home
);
is(
  highways.map((p) => `${p.name} | ${p.note} | ${p.distance}`),
  ['I-90 (Mass Pike) | Exit 125 · Route 16 | 1.0 mi', 'I-95 | Exit 36 · Route 9 | 1.3 mi', 'Route 2 | Exit 133 · Park Ave. | 5.7 mi'],
  'highways: one line each, at its nearest exit, named the way people say it'
);
is(highwayName('US3'), 'Route 3', 'a US route is "Route 3"');
is(highwayName('Lowell Connector'), 'Lowell Connector', 'a corridor with no number is printed as it came');

const stop = (name: string, description: string | null, miles: number, vehicle_type = 0): MbtaStop => ({
  attributes: { name, description, latitude: off(miles).y, longitude: off(miles).x, vehicle_type },
});
const transit = transitFrom(
  [
    stop('Waban', 'Waban - Green Line - (D) Riverside', 0.72),
    stop('Waban', 'Waban - Green Line - Park Street & North', 0.7),
    stop('Malden Center', 'Malden Center - Orange Line - Forest Hills', 1.3, 1),
    stop('Malden Center', 'Malden Center - Commuter Rail - Track 1', 1.31, 2),
    stop('West Newton', null, 0.9, 2),
    { attributes: { name: 'Nowhere', description: null, latitude: null, longitude: null } },
  ],
  home
);
is(
  transit.map((p) => `${p.name} | ${p.note} | ${p.distance}`),
  ['Waban | Green Line | 0.7 mi', 'West Newton | Commuter Rail | 0.9 mi', 'Malden Center | Orange Line, Commuter Rail | 1.3 mi'],
  'stations: one per station whatever its platforms, with every line it is on'
);

const osm = (name: string | null, osm_value: string, miles: number): PhotonFeature => ({
  geometry: { coordinates: [off(miles).x, off(miles).y] },
  properties: { name, osm_value },
});
const dining = placesFromPhoton(
  [
    osm('Boston Shawarma', 'restaurant', 0.94),
    osm('Boston Shawarma', 'restaurant', 0.95),
    osm(null, 'restaurant', 0.2),
    osm('Starbucks', 'cafe', 1.5),
    osm('Starbucks', 'cafe', 1.37),
    osm('Lavender Cafe', 'cafe', 0.96),
  ],
  'dining',
  home
);
is(
  dining.map((p) => `${p.name} | ${p.note} | ${p.distance}`),
  ['Boston Shawarma | Restaurant | 0.9 mi', 'Lavender Cafe | Café | 1.0 mi', 'Starbucks | Café | 1.4 mi'],
  'dining: a place mapped four times is one place, a chain is its nearest branch, and the nameless are dropped'
);
is(placesFromPhoton([osm('Waban Market', 'supermarket', 0.63)], 'groceries', home)[0].note, '', 'a grocery needs no note');

// The map.
const centre = mapPoint(home, 14, home);
is([centre.left, centre.top, centre.inside], [MAP_FRAME.w / 2, MAP_FRAME.h / 2, true], 'the house is the centre of the map');
const across = mapMilesAcross(home, 14);
yes(near(across, 2.6, 0.15), `at zoom 14 the frame is about two and a half miles across (${across.toFixed(2)})`);
const eastEdge = mapPoint(home, 14, { lat: home.lat, lon: off(0, across / 2).x });
yes(near(eastEdge.left, MAP_FRAME.w, 1.5), 'and a point half that far east is on its right edge');
yes(!eastEdge.inside, 'where a pin would be cut in half, so it gets none');
yes(mapPoint(home, 14, { lat: off(0.5).y, lon: home.lon }).top < MAP_FRAME.h / 2, 'north is up');
yes(mapMilesAcross(home, 15) < across / 1.9, 'one zoom closer shows half as much');

for (const zoom of [12, 14, 16]) {
  const tiles = mapTiles(home, zoom);
  const covers = (x: number, y: number) =>
    tiles.some((t) => x >= t.left - 1e-6 && x <= t.left + t.size + 1e-6 && y >= t.top - 1e-6 && y <= t.top + t.size + 1e-6);
  const gaps = [];
  for (let x = 0; x <= MAP_FRAME.w; x += 20) for (let y = 0; y <= MAP_FRAME.h; y += 20) if (!covers(x, y)) gaps.push([x, y]);
  is(gaps.length, 0, `zoom ${zoom}: the tiles cover the whole frame`);
  yes(tiles.length <= 16 && tiles.every((t) => t.z === zoom && t.size === TILE_DRAWN), `zoom ${zoom}: with ${tiles.length} tiles, each drawn whole`);
  is(new Set(tiles.map((t) => `${t.x}/${t.y}`)).size, tiles.length, `zoom ${zoom}: and none twice`);
}

// What the page draws.
const place = (group: PlaceGroup, name: string, miles: number | null, show = true): Place => ({
  id: `${group}-${name}`,
  group,
  name,
  note: '',
  distance: miles === null ? '' : formatMiles(miles),
  lat: miles === null ? null : off(miles).y,
  lon: miles === null ? null : off(miles).x,
  show,
});
const page: Around = {
  ...blankAround(),
  on: true,
  home,
  places: [
    place('highways', 'I-90 (Mass Pike)', 4.4),
    place('schools', 'Near School', 0.3),
    place('schools', 'Unticked School', 0.2, false),
    place('schools', 'Far School', 1.7),
    place('parks', 'Typed By Hand', null),
    place('parks', 'A Park', 0.4),
    ...Array.from({ length: 5 }, (_, i) => place('groceries', `Market ${i + 1}`, 0.1 * (i + 1))),
  ],
};
const shown = shownPlaces(page);
is(shown.schools.map((p) => [p.name, p.n]), [['Near School', 1], ['Far School', null]], 'an unticked place is not drawn, and one beyond the map has no number');
is(shown.parks.map((p) => [p.name, p.n]), [['Typed By Hand', null], ['A Park', 2]], 'a place typed by hand is listed without a number');
is(shown.groceries.map((p) => p.n), [3, 4, 5], 'a list stops at its limit, and numbers run on from the list before');
is(shown.highways[0].n, null, 'an exit four miles off is a line, not a pin');
is(sourcesOf(shown, true), ['MassGIS', 'OpenStreetMap'], 'the small print names only the sources that were used');
is(sourcesOf(shownPlaces({ ...page, places: [place('parks', 'Typed', null)] }), false), [], 'and none for a page typed entirely by hand');

// Stored pages.
is(hydrateAround(JSON.parse(JSON.stringify(page))), page, 'a saved neighborhood page opens as it was saved');
is(hydrateAround(undefined), blankAround(), 'a booklet saved before the page existed opens without one');
is(hydrateAround({ on: 'yes', zoom: 99, home: { lat: 'x', lon: 1 }, places: [{ group: 'casinos', name: 'x' }, 7] }),
  { ...blankAround(), zoom: 16 },
  'a page of the wrong shape opens blank, with its zoom brought into range');
is(hydrateAround({ places: [{ group: 'parks', name: 'Half', lat: 42.3 }] }).places[0].lon, null, 'half a coordinate is no coordinate');
is(hydrateDoc({ street: '1 Elm St' }, 'booklet', me).around, blankAround(), 'and so does the document around it');

// Finding again, and choosing another listing.
const typed: Place = { ...place('dining', 'The place Kevin knows', null), id: `${MANUAL_PREFIX}1` };
const before2: Around = { ...page, places: [place('schools', 'Old School', 0.3), place('dining', 'Old Diner', 0.2), typed] };
const merged = mergeFound(before2, home, [place('schools', 'New School', 0.4)], ['dining'], 'October 2026');
is(merged.places.map((p) => p.name), ['New School', 'Old Diner', 'The place Kevin knows'],
  'finding again replaces what was found, keeps what was typed, and keeps a list that could not be fetched');
is(merged.checked, 'October 2026', 'and records when');
const moved2 = seedFromListing({ ...blankDoc('booklet', me), around: before2 }, condo, null).around;
is([moved2.on, moved2.home, moved2.places.map((p) => p.name)], [true, null, ['The place Kevin knows']],
  'choosing another listing drops the old address\'s map and lists, and keeps the page and what was typed');

console.log('');
if (failures > 0) {
  console.error(`${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log('All assertions passed.');
