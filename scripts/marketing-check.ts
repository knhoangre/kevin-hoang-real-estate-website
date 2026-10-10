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
 *   * a stored document from before a field existed failing to open.
 */
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

console.log('');
if (failures > 0) {
  console.error(`${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log('All assertions passed.');
