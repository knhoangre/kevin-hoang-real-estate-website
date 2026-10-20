/**
 * Assertions for the investment pages — the math, the rents and the parcels.
 *
 *   node scripts/investment-check.ts          offline, no dependencies
 *   node scripts/investment-check.ts --live   also asks MassGIS about a known house
 *
 * Every number below was worked out by hand first. The check exists because
 * this kind of code is wrong quietly: a cash flow a few hundred dollars a month
 * too kind, a refinance that returns cash Fannie Mae would not lend, a rent
 * median dragged by one $45,000 typo, or a land value from the house next door.
 * None of those error. They just tell an investor a bad deal is a good one.
 */
import { monthlyPayment, investmentReturns } from '../src/lib/mortgage.ts';
import { deedExcise } from '../src/lib/sellerProceeds.ts';
import {
  adu,
  aduMaxSqft,
  brrrr,
  build,
  byMetric,
  constructionInterest,
  fieldFlags,
  flip,
  holdAnalysis,
  isDwelling,
  operatingStatement,
  refinance,
  remarkFlags,
  screenMetrics,
  sensitivity,
  type HardMoney,
  type OperatingInputs,
  type RefiInputs,
  type ScreenDefaults,
} from '../src/lib/investment.ts';
import { cleanRents, describeRent, estimateRent, kindFor, rentForListing, unitMix, type RentRow } from '../src/lib/rentComps.ts';
import {
  addressParts,
  canonicalStreet,
  lotSquareFeet,
  matchParcel,
  normalNumber,
  numberVariants,
  parcelWhere,
  parseParcel,
  lotStatsWhere,
  parcelFits,
  parseLotStats,
  pickRecord,
  PARCEL_FIELDS,
  PARCELS_LAYER,
  type ParcelAttributes,
} from '../src/lib/parcels.ts';
import { ASSUMPTIONS, screenDefaults } from '../src/lib/investmentAssumptions.ts';
import { COST_BOOK, scopeTotal, seedScope, withOverrides, type Scope } from '../src/lib/rehabCosts.ts';
import { aduOperating, arvSeed, buildInputs, flipInputs, hydrateScenario, monthlyCarry, operatingFrom, seedScenario, summarizeScenario } from '../src/lib/scenario.ts';
import { newBuildExit, newBuilds, typicalNewSize, type SaleRow } from '../src/lib/newBuild.ts';
import { demolitionDelayMonths, RULES, rulesFor, TOWN_RULES } from '../src/lib/investmentRules.ts';
import { decodeCodes } from '../src/lib/idxDecode.ts';

let failures = 0;
const ok = (cond: boolean, label: string) => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}`);
  if (!cond) failures += 1;
};
const near = (actual: number | null | undefined, expected: number, label: string, tol = 0.01) =>
  ok(
    actual !== null && actual !== undefined && Math.abs(actual - expected) <= tol,
    `${label}${actual !== null && actual !== undefined && Math.abs(actual - expected) <= tol ? '' : ` — got ${actual}, want ${expected}`}`
  );
const eq = (actual: unknown, expected: unknown, label: string) =>
  ok(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label}${JSON.stringify(actual) === JSON.stringify(expected) ? '' : ` — got ${JSON.stringify(actual)}`}`
  );

/* -------------------------------------------------------------------------- */
console.log('--- the mortgage payment it builds on ---');
const pay = (principal: number) =>
  monthlyPayment({ price: principal, downPayment: 0, rate: 6.5, termYears: 30, annualTaxes: 0, annualInsurance: 0, monthlyHoa: 0 })
    .principalAndInterest;
near(pay(300_000), 1896.2, '$300k at 6.5% over 30 years is $1,896.20 a month');
near(pay(400_000), 2528.27, '$400k is $2,528.27');

/* -------------------------------------------------------------------------- */
console.log('--- buy and hold ---');
const op: OperatingInputs = {
  grossMonthlyRent: 3000,
  otherMonthlyIncome: 0,
  vacancyPct: 5,
  managementPct: 10,
  annualTaxes: 6000,
  annualInsurance: 1200,
  monthlyHoa: 0,
  annualMaintenance: 5000,
  capexPct: 5,
  monthlyOwnerUtilities: 120,
  leasingFeeMonths: 1,
  turnoversPerYear: 0.5,
  otherAnnual: 0,
};
const st = operatingStatement(op);
near(st.effective, 2850, 'vacancy at 5% leaves $2,850 collected');
near(st.lines.find((l) => l.key === 'management')?.monthly, 285, 'management is 10% of rent COLLECTED: $285');
near(st.lines.find((l) => l.key === 'capex')?.monthly, 150, 'capital reserve 5% of gross rent: $150');
near(st.lines.find((l) => l.key === 'leasing')?.monthly, 125, 'one month to a broker every two years: $125 a month');
near(st.noi, 1153.33, 'NOI $1,153.33');

const hold = holdAnalysis(
  op,
  { price: 400_000, downPct: 25, ratePct: 6.5, termYears: 30, pmiRatePct: 0.5, pointsPct: 0 },
  { closingCosts: 8000, upfrontRepairs: 2000 }
);
near(hold.capRate, 3.46, 'cap rate 3.46% at $400k');
near(hold.monthlyCashFlow, -742.87, 'cash flow −$742.87 a month at 25% down');
near(hold.dscr, 0.61, 'DSCR 0.61', 0.005);
near(hold.cashInvested, 110_000, 'cash in is down payment + closing + up-front work: $110,000');
near(hold.cashOnCash, (-742.87 * 12 / 110_000) * 100, 'cash-on-cash divides by ALL cash in', 0.01);
near(hold.grm, 400_000 / 36_000, 'GRM is price over a year of gross rent');
ok((hold.breakEvenOccupancyPct ?? 0) > 100, 'a deal that loses money before any vacancy needs over 100% occupancy');
ok(hold.financing.monthlyPmi === 0, 'no mortgage insurance at 25% down');

// With the extra lines at zero this must be the listing calculator exactly.
const plain = holdAnalysis(
  { ...op, capexPct: 0, monthlyOwnerUtilities: 0, leasingFeeMonths: 0 },
  { price: 400_000, downPct: 25, ratePct: 6.5, termYears: 30, pmiRatePct: 0.5, pointsPct: 0 },
  { closingCosts: 0, upfrontRepairs: 0 }
);
const listingCalc = investmentReturns(
  {
    price: 400_000,
    monthlyRent: 3000,
    vacancyRate: 5,
    annualTaxes: 6000,
    annualInsurance: 1200,
    monthlyHoa: 0,
    annualMaintenance: 5000,
    managementRate: 10,
    monthlyPrincipalAndInterest: pay(300_000),
    monthlyPmi: 0,
  },
  100_000
);
near(plain.statement.noi, listingCalc.noi, 'NOI equals the listing calculator when the extra lines are zero', 1e-9);
near(plain.monthlyCashFlow, listingCalc.monthlyCashFlow, 'and so does the cash flow', 1e-9);
near(plain.capRate, listingCalc.capRate ?? NaN, 'and the cap rate', 1e-9);

const odd = operatingStatement({ ...op, vacancyPct: 140, managementPct: -5 });
ok(odd.effective === 0 && odd.lines[0].monthly === 0, 'vacancy past 100 empties the unit rather than inventing negative rent');

/* -------------------------------------------------------------------------- */
console.log('--- flip ---');
const hm: HardMoney = { ltcPct: 90, maxArvPct: 70, ratePct: 12, pointsPct: 2, fees: 0, dutchInterest: false };
const sale = { commissionPct: 5, otherClosing: 1500, sellerCredits: 0 };
const f = flip({
  price: 500_000,
  buyerClosing: 7500,
  rehab: 110_000,
  rehabMonths: 6,
  holdMonths: 6,
  monthlyCarry: 1000,
  arv: 800_000,
  finance: { kind: 'hardMoney', hm },
  sale,
});
near(f.loan?.loan, 549_000, 'loan is 90% of cost ($549,000), under 70% of ARV ($560,000)');
near(f.loan?.points, 10_980, 'two points: $10,980');
near(f.loan?.interest, 29_970, 'interest $29,970: purchase share all along, renovation share half-drawn');
near(f.proceeds.costOfSale, 45_148, 'cost of selling $45,148: 5% commission + $3,648 deed excise + $1,500');
near(f.profit, 90_402, 'profit $90,402');
near(f.proceeds.net - f.cashIn, 90_402, 'the same profit from proceeds after payoff, less cash in');
near(f.cashIn, 115_450, 'cash in $115,450');
near(f.mao70, 450_000, '70% rule: 0.7 × $800k − $110k = $450,000');
const dutch = flip({ price: 500_000, buyerClosing: 7500, rehab: 110_000, rehabMonths: 6, holdMonths: 6, monthlyCarry: 1000, arv: 800_000, finance: { kind: 'hardMoney', hm: { ...hm, dutchInterest: true } }, sale });
near(dutch.loan?.interest, 32_940, 'Dutch interest charges the whole loan from day one: $32,940');
const cashFlip = flip({ price: 500_000, buyerClosing: 7500, rehab: 110_000, rehabMonths: 6, holdMonths: 6, monthlyCarry: 1000, arv: 800_000, finance: { kind: 'cash' }, sale });
near(cashFlip.profit, 800_000 - 500_000 - 7500 - 110_000 - 6000 - 45_148, 'all cash: no interest, no points');

const sens = sensitivity(
  (x: number) => flip({ price: 500_000, buyerClosing: 7500, rehab: 110_000, rehabMonths: 6, holdMonths: 6, monthlyCarry: 1000, arv: x, finance: { kind: 'cash' }, sale }).profit,
  800_000,
  [{ label: 'ARV −10%', apply: (x) => x * 0.9 }]
);
ok(sens[0].delta < -70_000, 'ARV 10% lower costs more than the ARV drop less selling costs saved');

/* -------------------------------------------------------------------------- */
console.log('--- refinance and BRRRR ---');
const rules = { titleMonths: 6, noteMonths: 12 };
const refi = (over: Partial<RefiInputs>): RefiInputs => ({
  program: 'conventional',
  units: 1,
  monthsOnTitle: 6,
  acquisition: 'cash',
  ltvPct: 75,
  ratePct: 7.25,
  termYears: 30,
  closingPct: 2,
  rules,
  ...over,
});
const project = {
  price: 300_000,
  buyerClosing: 4500,
  rehab: 60_000,
  rehabMonths: 4,
  holdMonths: 6,
  monthlyCarry: 800,
  arv: 450_000,
  finance: { kind: 'cash' as const },
};
const b6 = brrrr(project, refi({}), { ...op, grossMonthlyRent: 3200 });
eq(b6.refi.kind, 'cash-out', 'cash purchase, six months on title: cash-out');
near(b6.cashIn, 369_300, 'cash in $369,300');
near(b6.refi.newLoan, 337_500, 'new loan 75% of $450k: $337,500');
near(b6.cashLeftIn, 38_550, 'cash left in $38,550 after 2% refinance costs');
near(b6.equityAfter, 112_500, 'equity after the refinance $112,500');
const b4 = brrrr({ ...project, holdMonths: 4 }, refi({ monthsOnTitle: 4 }), { ...op, grossMonthlyRent: 3200 });
eq(b4.refi.kind, 'delayed-financing', 'cash purchase at four months: delayed financing');
near(b4.refi.newLoan, 304_500, 'capped at purchase plus closing: $304,500');
near(b4.cashLeftIn, 369_300 - 1600 - (304_500 - 6090), 'cash left in after the cap');
const hmProject = { ...project, finance: { kind: 'hardMoney' as const, hm: { ...hm, ratePct: 11, maxArvPct: 75 } } };
const bh6 = brrrr(hmProject, refi({ acquisition: 'hardMoney' }), { ...op, grossMonthlyRent: 3200 });
eq(bh6.refi.kind, 'limited-cash-out', 'hard money six months old: only a limited cash-out');
ok(bh6.refi.cashToBorrower <= 2000 + 1e-6, 'limited cash-out returns at most $2,000');
const bh12 = brrrr({ ...hmProject, holdMonths: 12 }, refi({ acquisition: 'hardMoney', monthsOnTitle: 12 }), { ...op, grossMonthlyRent: 3200 });
eq(bh12.refi.kind, 'cash-out', 'hard money twelve months old: cash-out');
const two = refinance(450_000, 0, 304_500, refi({ units: 2, ltvPct: 70 }));
near(two.newLoan, 315_000, 'two units: 70% of value');
const dscr = refinance(450_000, 0, 304_500, refi({ program: 'dscr', monthsOnTitle: 1, ltvPct: 75 }));
eq(dscr.kind, 'cash-out', 'a DSCR loan takes its lender’s terms, with no Fannie seasoning');
const allBack = brrrr({ ...project, arv: 600_000 }, refi({}), { ...op, grossMonthlyRent: 4200 });
ok(allBack.cashLeftIn < 0 && allBack.cashOnCashAfter === null, 'every dollar back: no cash-on-cash to state');

/* -------------------------------------------------------------------------- */
console.log('--- teardown and build ---');
near(constructionInterest(1_142_400, 0, 9, 12, 4), 85_680, 'construction interest $85,680: half-drawn for 12 months, all of it for 4');
near(constructionInterest(1_000_000, 400_000, 9, 12, 4, 6), 400_000 * 0.0075 * 22 + 600_000 * 0.0075 * 10, 'the land share is carried for the whole term');
const bld = build({
  price: 1_000_000,
  buyerClosing: 20_000,
  demolition: 30_000,
  demoExtras: 10_000,
  newSqft: 4000,
  hardPerSqft: 400,
  siteWork: 40_000,
  softPct: 10,
  contingencyPct: 10,
  loan: { ltcPct: 80, ratePct: 9, pointsPct: 1, financeLand: false },
  months: { permitting: 3, delay: 0, build: 12, sale: 3 },
  monthlyCarry: 2000,
  exitPrice: 2_900_000,
  sale,
});
const hard = 4000 * 400 + 40_000;
const construction = 40_000 + hard + hard * 0.1 + (hard + 40_000) * 0.1;
near(bld.loan, construction * 0.8, 'the loan is 80% of construction when land is not financed');
near(bld.months, 18, 'eighteen months, permitting to sale');
near(
  bld.profit,
  2_900_000 - (1_020_000 + construction + bld.interest + bld.points + 2000 * 18 + bld.proceeds.costOfSale),
  'profit is the exit less every cost line'
);
ok(bld.costLines.reduce((s, l) => s + l.amount, 0) === bld.totalCost, 'the cost lines add up to the total');

console.log('--- ADU ---');
eq(aduMaxSqft(3056), 900, 'a 3,056 sq ft house: the 900 sq ft cap');
eq(aduMaxSqft(1500), 750, 'a 1,500 sq ft house: half its floor area, 750');
const a = adu({ mainGrossArea: 1500, sqft: 750, perSqft: 400, fixed: 50_000, op: { ...op, grossMonthlyRent: 2500 } });
near(a.cost, 350_000, 'ADU cost: 750 × $400 + $50,000');
ok(a.paybackYears !== null && a.paybackYears > 0, 'a positive payback');

/* -------------------------------------------------------------------------- */
console.log('--- deed excise, reused ---');
near(deedExcise(800_000), 3648, '$800,000 pays $3,648');
near(deedExcise(800_001), 3650.28, '$800,001 rounds up to the next $500: $3,650.28');

/* -------------------------------------------------------------------------- */
console.log('--- rents ---');
const lease = (rent: number, bedrooms: number, subtype = 'D', zip = '02459', date = '2026-05-01'): RentRow => ({ rent, bedrooms, subtype, zip, date });
eq(
  cleanRents([lease(100, 2), lease(45_000, 2), lease(2500, 2), lease(800, 2, 'G')]).map((r) => r.rent),
  [2500],
  'a $100 typo, a $45,000 building and a parking space are not rents'
);
const five = [2400, 2450, 2500, 2550, 2600].map((r) => lease(r, 2));
const r1 = estimateRent([...five, lease(100, 2), lease(45_000, 2)], [], { kind: 'apartment', beds: 2, zip: '02459' });
eq([r1?.rent, r1?.n, r1?.scope, r1?.source], [2500, 5, 'zip', 'leased'], 'five two-bed leases in the ZIP: median $2,500');
const four = [2400, 2450, 2500, 2550].map((r) => lease(r, 2));
const r2 = estimateRent([...four, lease(2600, 2, 'D', '02460')], [], { kind: 'apartment', beds: 2, zip: '02459' });
eq(r2?.scope, 'town', 'four leases in the ZIP falls through to the town');
const r3 = estimateRent([...[3000, 3100, 3200, 3300, 3400].map((r) => lease(r, 3, 'B'))], [], { kind: 'house', beds: 3, zip: null });
eq([r3?.nearKinds, r3?.rent], [true, 3200], 'no single-family leases: attached homes, labelled as the neighbour kind');
const r4 = estimateRent([lease(2000, 2)], [lease(2200, 2), lease(2300, 2), lease(2400, 2)], { kind: 'apartment', beds: 2, zip: null });
eq([r4?.source, r4?.rent], ['asking', 2300], 'one lease is not enough: three asking rents, labelled as asking');
eq(estimateRent([lease(2000, 2)], [lease(2200, 2)], { kind: 'apartment', beds: 2, zip: null }), null, 'too little evidence is no answer');
const r5 = estimateRent(five, [], { kind: 'apartment', beds: 2, zip: null }, true);
eq([r5?.capped, r5?.from, r5?.to], [true, '2026-05-01', '2026-05-01'], 'a capped result says so, with its dates');
eq([r1?.low, r1?.high], [2450, 2550], 'the middle half is a real lease at each end');
eq([kindFor('SF'), kindFor('CC'), kindFor('MF')], ['house', 'condo', 'apartment'], 'kinds');
eq(
  describeRent({ ...(r1 as NonNullable<typeof r1>), from: '2025-11-03', to: '2026-10-10' }, { town: 'Newton', zip: '02459' }),
  'median of 5 two-bed apartment leases in ZIP 02459, Nov 2025\u2013Oct 2026',
  'the rent says where it came from'
);
eq(describeRent(r4 as NonNullable<typeof r4>, { town: 'Newton', zip: null }), 'median of 3 two-bed home asking rents on the market now in Newton', 'and says when it is only asking rents');

eq(unitMix({ prop_subtype: 'G', num_units: 2, bedrooms: 6 }), { units: 2, atLeast: false, bedsPerUnit: [3, 3], agrees: true }, 'a two-family with six bedrooms: 3 and 3');
eq(unitMix({ prop_subtype: 'J', num_units: null, bedrooms: 7 })?.bedsPerUnit, [3, 2, 2], 'a three-family with seven: 3, 2, 2');
eq(unitMix({ prop_subtype: 'A', num_units: 3, bedrooms: 4 })?.agrees, false, 'MF_TYPE two-family with num_units 3: they disagree, and it says so');
eq(unitMix({ prop_subtype: 'E', num_units: 8, bedrooms: 16 })?.units, 8, 'five-plus takes the listed count when it is higher');
eq(unitMix({ prop_subtype: 'Z', num_units: 2, bedrooms: 4 }), null, 'an unknown code is not guessed at');
const threeBeds = [3000, 3050, 3100, 3150, 3200].map((r) => lease(r, 3));
const twoFam = rentForListing({ prop_type: 'MF', prop_subtype: 'G', num_units: 2, bedrooms: 6, zip: '02459' }, threeBeds, []);
eq([twoFam.gross, twoFam.units.length], [6200, 2], 'a two-family of 3+3 bedrooms: two units at $3,100');
const fourBeds = [3600, 3700, 3800, 3900, 4000].map((r) => lease(r, 4));
const missingUnit = rentForListing({ prop_type: 'MF', prop_subtype: 'J', num_units: 3, bedrooms: 7, zip: '02459' }, fourBeds, []);
eq(missingUnit.units.map((u) => u?.rent ?? null), [3800, null, null], 'the three-bed unit reaches four-bed leases; the two-beds cannot');
eq(missingUnit.gross, null, 'a unit with no evidence leaves the building with no total, not a smaller one');
eq(rentForListing({ prop_type: 'SF', prop_subtype: 'A', num_units: null, bedrooms: 3, zip: null }, threeBeds.map((r) => ({ ...r, subtype: 'A' })), []).gross, 3100, 'a house is one estimate');

/* -------------------------------------------------------------------------- */
console.log('--- parcels ---');
eq(canonicalStreet('Elinor Road'), 'ELINOR RD', '"Elinor Road" is ELINOR RD');
eq(canonicalStreet('Glen Rd'), canonicalStreet('GLEN ROAD'), '"Glen Rd" matches "GLEN ROAD"');
eq(canonicalStreet('Court St'), 'COURT ST', '"Court St" is never "CT ST"');
eq(canonicalStreet('Mystic Av'), 'MYSTIC AVE', 'Medford’s AV is AVE');
eq(canonicalStreet('Mystic Street Ext'), 'MYSTIC ST EXT', 'an extension keeps its suffix');
eq(canonicalStreet('South River St'), canonicalStreet('S RIVER ST'), 'directions spelled out or not');
eq(canonicalStreet('Fellsway West'), 'FELLSWAY W', 'a trailing direction');
eq(canonicalStreet('Saint Claire St'), canonicalStreet('ST CLAIRE ST'), 'Saint or St');
eq(canonicalStreet('Second Street'), '2ND ST', 'ordinals as numbers');
eq(canonicalStreet('Fayette Street (Rear)'), 'FAYETTE ST', 'a note in brackets is dropped');
eq(normalNumber('90 -96'), '90-96', 'Waltham files "90 -96"');
eq(normalNumber('84 86'), '84-86', '"84 86" is a range');
eq(normalNumber('819 & 825'), '819-825', '"819 & 825" is a range');
eq(numberVariants('82-84'), ['82-84', '82', '84'], '"82-84" in every form');
eq(numberVariants('70A'), ['70A', '70'], '"70A" or "70"');
eq(numberVariants('0'), [], 'a zero is not a house number');
eq(numberVariants('Lot 3'), [], 'nor is "Lot 3"');

const rec = (o: Partial<ParcelAttributes>): ParcelAttributes => ({ ADDR_NUM: '52', FULL_STR: 'ELINOR RD', USE_CODE: '1010', LAND_VAL: 962_300, BLDG_VAL: 30_400, TOTAL_VAL: 992_700, ...o });
const elinor = addressParts({ street_no: '52', street_name: 'Elinor Road' });
ok(elinor !== null, '"52 Elinor Road" splits');
ok(matchParcel(elinor!, [rec({})]) !== null, '"52 Elinor Road" matches ELINOR RD');
ok(matchParcel(elinor!, [rec({ FULL_STR: 'ELINOR AVE' })]) === null, 'not ELINOR AVE');
ok(matchParcel(addressParts({ street_no: '52', street_name: 'Elinor' })!, [rec({})]) !== null, 'no suffix: matches the only street it could be');
ok(
  matchParcel(addressParts({ street_no: '148', street_name: 'Pearl' })!, [
    rec({ ADDR_NUM: '148', FULL_STR: 'PEARL ST' }),
    rec({ ADDR_NUM: '148', FULL_STR: 'PEARL AVE' }),
  ]) === null,
  'no suffix and two streets carry the number: no match rather than a guess'
);
ok(
  matchParcel(addressParts({ street_no: '148', street_name: 'Pearl' })!, [
    rec({ ADDR_NUM: '148', FULL_STR: 'PEARL ST' }),
    rec({ ADDR_NUM: '12', FULL_STR: 'PEARL AVE' }),
  ])?.record.FULL_STR === 'PEARL ST',
  'another listing’s record on a similar street does not cancel a match'
);
ok(matchParcel(addressParts({ street_no: '90-96', street_name: 'Bacon St' })!, [rec({ ADDR_NUM: '90 -96', FULL_STR: 'BACON ST' })]) !== null, 'Waltham’s "90 -96" matches "90-96"');
ok(
  matchParcel(addressParts({ street_no: '131', street_name: 'Holworthy St' })!, [
    rec({ ADDR_NUM: '129-131', FULL_STR: 'HOLWORTHY ST', TOTAL_VAL: 2_000_000 }),
    rec({ ADDR_NUM: '131', FULL_STR: 'HOLWORTHY ST', TOTAL_VAL: 900_000 }),
  ])?.record.ADDR_NUM === '131',
  'an exact number beats a range that contains it'
);
const condo = addressParts({ street_no: '170', street_name: 'Gore St', unit_no: '#308' });
eq(
  pickRecord(
    [rec({ ADDR_NUM: '170', FULL_STR: 'GORE ST', LOCATION: '307', USE_CODE: '102' }), rec({ ADDR_NUM: '170', FULL_STR: 'GORE ST', LOCATION: '308', USE_CODE: '102' })],
    condo!.unit
  )?.record.LOCATION,
  '308',
  'a condo unit "#308" finds LOCATION 308'
);
eq(
  pickRecord(
    [rec({ ADDR_NUM: '170', FULL_STR: 'GORE ST', LOCATION: '307', USE_CODE: '102' }), rec({ ADDR_NUM: '170', FULL_STR: 'GORE ST', LOCATION: '309', USE_CODE: '102' })],
    condo!.unit
  ),
  null,
  'a unit not among several records gets none, not a neighbour\u2019s'
);
const unitParcel = parseParcel(rec({ USE_CODE: '102', LOCATION: '308' }), true);
ok(parcelFits('CC', unitParcel) !== null, 'a condo shows its own unit\u2019s record');
ok(parcelFits('CC', parseParcel(rec({ USE_CODE: '102' }), false)) === null, 'but not a condo record chosen without its unit');
ok(parcelFits('CC', parseParcel(rec({ USE_CODE: '1010' }), true)) === null, 'nor a house record beside a condo listing');
ok(parcelFits('SF', parseParcel(rec({}), false)) !== null, 'a house needs no unit');
eq(lotSquareFeet({ LOT_SIZE: 0.1859, LOT_UNITS: 'Acres' }), { sqft: 8098, source: 'assessor' }, '0.1859 acres is 8,098 sq ft');
eq(lotSquareFeet({ LOT_SIZE: 9000, LOT_UNITS: 'Sq. Ft.' }), { sqft: 9000, source: 'assessor' }, 'square feet stay square feet');
eq(lotSquareFeet({ LOT_SIZE: 0, Shape__Area: 694.63 }), { sqft: 7477, source: 'polygon' }, 'no lot size: the mapped area, 694.63 m² = 7,477 sq ft');
const p = parseParcel(rec({ FY: 2026, ZONING: 'SR3', LOT_SIZE: 0.1859, LOT_UNITS: 'Acres', LS_DATE: '20221026', LS_PRICE: 894_000 }));
near(p.landShare, 0.9694, 'land is 96.9% of 52 Elinor Rd’s assessed value', 0.0001);
eq([p.useLabel, p.zoning, p.lastSale?.price], ['Single-family', 'SR3', 894_000], 'use, zoning and last sale');
eq(parseParcel(rec({ LS_DATE: '19000101', LS_PRICE: 1 })).lastSale, null, 'a $1 transfer is not a sale');
eq(parseParcel(rec({ USE_CODE: '102' })).landShare, null, 'a condo has no land share of its own');
const where = parcelWhere("O'Brien Town", [addressParts({ street_no: '5', street_name: "O'Neil Rd" })!]);
ok(!where.replace(/'(?:[^']|'')*'/g, '').includes("'"), 'quotes cannot break out of the where clause');
const quoted = parcelWhere('Newton', [{ number: "5'", numbers: ["5'"], street: "O'NEIL RD", unit: null }]);
ok(!quoted.replace(/'(?:[^']|'')*'/g, '').includes("'"), 'even a quote that reaches it is doubled');
ok(!PARCEL_FIELDS.some((f) => f.startsWith('OWN')), 'the owner is never asked for');

/* -------------------------------------------------------------------------- */
console.log('--- flags ---');
eq(remarkFlags('Real estate taxes are low. Lovely home.'), [], '"real estate taxes" is not an estate sale');
eq(remarkFlags('Being sold AS-IS. Needs TLC.').map((x) => x.key), ['as-is', 'tlc'], 'AS-IS and TLC');
eq(remarkFlags('sold as is, a tear down').map((x) => x.key), ['as-is', 'teardown'], '"as is" and "tear down"');
eq(remarkFlags('This home has issues').length, 0, '"has issues" is not "as-is"');
eq(remarkFlags('Teardown or renovate')[0]?.detail, 'Remarks: “Teardown”', 'the matched words are quoted back');
eq(
  fieldFlags({ year_built: 1950, heatingLabel: 'Oil, Hot Water Baseboard', sewerLabel: 'Private Sewerage', price_cut: true }).map((x) => x.key),
  ['lead', 'septic', 'oil', 'price-cut'],
  'built 1950, septic, oil heat, a price cut'
);
eq(fieldFlags({ year_built: 1978, heatingLabel: 'Gas', sewerLabel: 'Public Sewer' }), [], '1978 is not before 1978');
eq([decodeCodes('HEATING', 'M', 'SF'), decodeCodes('HEATING', 'H', 'MF')], ['Oil', 'Oil'], 'oil heat is M on a single-family and H on a multi-family');
eq(fieldFlags({ year_built: 2001, heatingLabel: null, sewerLabel: decodeCodes('SEWER', 'G', 'SF') }).map((x) => x.key), ['septic'], 'a tight tank is an on-site system too');

/* -------------------------------------------------------------------------- */
console.log('--- the screener ---');
const defaults: ScreenDefaults = {
  vacancyPct: 5, managementPct: 10, maintenancePctOfPrice: 1, capexPct: 5, leasingFeeMonths: 1, turnoversPerYear: 0.5,
  landlordInsuranceFactor: 1.25, ownerUtilitiesPerUnit: 60, downPct: 25, ratePct: 7.25, termYears: 30, pmiRatePct: 0.5, buyerClosingPct: 2,
};
const base = { price: 900_000, propType: 'MF', taxes: 9000, hoa: false, hoaFee: null, units: 2, grossRent: 6000, homeInsurance: 4410, assessedTotal: 1_000_000, landShare: 0.5 };
const m = screenMetrics(base, defaults);
ok(m.capRate !== null && Number.isFinite(m.capRate), 'a complete listing gets a cap rate');
near(m.priceToAssessed, 0.9, 'asking 90% of assessed');
const noRent = screenMetrics({ ...base, grossRent: null }, defaults);
ok(noRent.capRate === null && noRent.missing.includes('not enough leases to estimate rent'), 'no rent: no cap rate, and the reason');
const noFee = screenMetrics({ ...base, propType: 'CC', hoa: true, hoaFee: null }, defaults);
ok(noFee.capRate === null && noFee.missing.includes('association fee not listed'), 'an association with no fee is not a free condo');
const parking = screenMetrics({ ...base, propType: 'CC', grossRent: 1925, dwelling: false }, defaults);
ok(parking.capRate === null && parking.missing[0].startsWith('no bathroom'), 'a parking space gets no cap rate, and says why');
ok(!isDwelling({ full_baths: 0, living_area: 0 }) && isDwelling({ full_baths: 1, living_area: null }) && isDwelling({ full_baths: null, living_area: null }), 'no bath and no floor area is not a home; unknown is not "no"');
const placeholder = screenMetrics({ ...base, price: 1 }, defaults);
ok(placeholder.capRate === null && placeholder.priceToAssessed === null, 'a $1 auction price is no price');
const all = [m, noRent, placeholder, { ...m, capRate: 9 }];
const sorted = [...all].sort(byMetric((x) => x.capRate, 'desc'));
ok(sorted[0].capRate === 9 && sorted[sorted.length - 1].capRate === null, 'sorting puts the best first and the unknown last');
ok(
  [m, noRent, noFee, placeholder].every((x) =>
    [x.capRate, x.monthlyCashFlow, x.cashOnCash, x.grm, x.priceToAssessed].every((v) => v === null || Number.isFinite(v))
  ),
  'no NaN anywhere'
);

/* -------------------------------------------------------------------------- */
console.log('--- the cost book ---');
ok(new Set(COST_BOOK.map((c) => c.key)).size === COST_BOOK.length, 'every cost line has its own key');
for (const c of COST_BOOK) {
  ok(c.low <= c.mid && c.mid <= c.high && c.low >= 0, `${c.key}: low \u2264 mid \u2264 high`);
  ok(Boolean(c.source) && /^\d{4}-\d{2}-\d{2}$/.test(c.asOf) && (c.kind === 'assumption' || Boolean(c.url)), `${c.key}: sourced and dated${c.kind === 'assumption' ? ' (an assumption)' : ''}`);
}
const book = withOverrides([
  { key: 'roof', low: 20_000, mid: 25_000, high: 30_000, note: 'Smith Roofing, Oct 2026', updated_at: '2026-10-20T12:00:00Z' },
  { key: 'windows', low: 3000, mid: 2000, high: 1000, note: null, updated_at: '2026-10-20T12:00:00Z' },
  { key: 'no-such-line', low: 1, mid: 2, high: 3, note: null, updated_at: '2026-10-20T12:00:00Z' },
]);
const roof = book.find((c) => c.key === 'roof')!;
eq([roof.mid, roof.kind, roof.asOf], [25_000, 'contractor', '2026-10-20'], 'Kevin\u2019s roof price replaces the book\u2019s, dated and labelled');
ok(roof.source.includes('Smith Roofing'), 'with his note as its source');
eq(book.find((c) => c.key === 'windows')!.mid, COST_BOOK.find((c) => c.key === 'windows')!.mid, 'an override with its figures out of order is ignored');
eq(book.length, COST_BOOK.length, 'an override for a line that no longer exists adds nothing');

const scope: Scope = {
  contingencyPct: 15,
  lines: [
    { key: 'kitchen-refresh', on: true, qty: 1, tier: 'mid' },
    { key: 'bath-refresh', on: true, qty: 2, tier: 'mid' },
    { key: 'roof', on: false, qty: 1, tier: 'mid' },
    { key: 'permits', on: true, qty: 1, tier: 'mid' },
  ],
};
const st1 = scopeTotal(scope, COST_BOOK);
near(st1.work, 32_000 + 28_000 + 900, 'kitchen $32k + two baths $28k + permits 1.5% of that ($900)');
near(st1.total, 60_900 * 1.15, 'plus 15% contingency: $70,035');
eq(st1.lines.map((l) => l.key), ['kitchen-refresh', 'bath-refresh', 'permits'], 'a line switched off costs nothing and is not listed');
near(scopeTotal({ ...scope, lines: [{ key: 'kitchen-full', on: true, qty: 1, tier: 'mid', amount: 50_000 }] }, COST_BOOK).work, 50_000, 'the investor\u2019s own figure for a line replaces the book\u2019s');
near(scopeTotal({ ...scope, lines: [{ key: 'kitchen-full', on: true, qty: 1, tier: 'high' }] }, COST_BOOK).work, 95_000, 'the high end of the range');

const seeded = seedScope({ living_area: 1800, full_baths: 2, bedrooms: 3, year_built: 1950, units: 1, septic: true, oilHeat: true, renting: true, conditionFlags: ['tlc'], conditionWords: '\u201cneeds TLC\u201d' });
const on = seeded.lines.filter((l) => l.on).map((l) => l.key);
ok(on.includes('kitchen-refresh') && on.includes('bath-refresh') && on.includes('flooring'), 'remarks that say it needs work switch on a refresh');
ok(on.includes('lead') && on.includes('title-v'), 'a 1950 rental on septic budgets lead and a Title V inspection');
ok(!on.includes('roof') && !on.includes('rewire'), 'nothing the listing does not evidence is switched on');
ok(seeded.lines.find((l) => l.key === 'boiler')!.reason === 'The listing says oil heat.', 'oil heat is offered with its reason, off');
const clean = seedScope({ living_area: 1800, full_baths: 2, bedrooms: 3, year_built: 2005, units: 1, septic: false, oilHeat: false, renting: true, conditionFlags: [], conditionWords: null });
eq(clean.lines.filter((l) => l.on).length, 0, 'a newer house with nothing said about its condition starts with no work');

console.log('--- the scenario ---');
const sc = seedScenario({ price: 900_000, propType: 'MF', hoaFee: null, taxes: 9000, homeInsurance: 4410, units: 2, rents: [3000, 3000], scope: seeded, arv: 1_100_000, book: COST_BOOK, newSqft: 4000, exitPrice: 2_400_000, aduMaxSqft: 900, aduRent: 2900 });
eq([sc.refi.ltvPct, sc.project.flipMonths, sc.ownerUtilities, sc.annualInsurance], [70, 6, 120, 5513], 'a two-family: 70% refinance, six months to sell, water for two units, a landlord policy');
near(monthlyCarry(sc), 9000 / 12 + 5513 / 12 + 300, 'held empty: taxes, insurance and utilities');
eq(hydrateScenario('garbage', sc), sc, 'a stored value that is not a document opens as the seed');
const h = hydrateScenario({ price: '1', tab: 'nonsense', rents: [1, 2, 3], arv: 990_000, scope: { contingencyPct: 10, lines: [{ key: 'roof', on: true, tier: 'high' }, { key: 'gone-line', on: true }] }, project: { finance: 'cash', hm: { ratePct: 12 } } }, sc);
eq([h.price, h.tab, h.rents, h.arv], [900_000, 'hold', [3000, 3000], 990_000], 'a string price, an unknown tab and the wrong number of units fall back to the seed');
eq([h.scope.contingencyPct, h.scope.lines.find((l) => l.key === 'roof')?.on, h.scope.lines.find((l) => l.key === 'roof')?.tier], [10, true, 'high'], 'a stored scope line is kept');
ok(!h.scope.lines.some((l) => l.key === 'gone-line'), 'a line the book no longer has is dropped');
eq([h.project.finance, h.project.hm.ratePct, h.project.hm.pointsPct], ['cash', 12, sc.project.hm.pointsPct], 'project fields are kept one by one');
eq(hydrateScenario(JSON.parse(JSON.stringify(sc)), sc), sc, 'a saved scenario opens as it was saved');
eq([sc.build.newSqft, sc.build.hardPerSqft, sc.build.exitPrice, sc.adu.sqft, sc.adu.rent], [4000, 300, 2_400_000, 900, 2900], 'the build and ADU seeds come from the comps and the cost book');
const oldSave = JSON.parse(JSON.stringify(sc));
delete oldSave.build;
delete oldSave.adu;
oldSave.price = 850_000;
const reopened = hydrateScenario(oldSave, sc);
eq([reopened.price, reopened.build, reopened.adu], [850_000, sc.build, sc.adu], 'an analysis saved before the build tab existed opens, with today\u2019s build seed');
eq(hydrateScenario({ ...oldSave, tab: 'build', build: { financeLand: 'yes', newSqft: 3800 } }, sc).build.financeLand, false, 'a damaged boolean falls back to the seed');
const bi = buildInputs({ ...sc, build: { ...sc.build, delayMonths: 18 } });
eq([bi.months.delay, bi.exitPrice, bi.newSqft], [18, 2_400_000, 4000], 'the build reads the shared scenario, delay included');
const ao = aduOperating(sc, 300_000, 0.01);
eq([ao.grossMonthlyRent, Math.round(ao.annualTaxes), Math.round(ao.annualInsurance), ao.monthlyOwnerUtilities], [2900, 3000, 1838, 0], 'an ADU: its rent, its cost at the town\u2019s rate, and a landlord policy on its cost');
eq(summarizeScenario({ ...sc, tab: 'flip' }), { price: 900_000, rent: 6000, arv: 1_100_000, tab: 'flip' }, 'Kevin\u2019s summary: price, rent, ARV and strategy');
eq(summarizeScenario({ price: 'x', rents: 'y' }), { price: null, rent: null, arv: null, tab: 'hold' }, 'and nothing invented from a damaged document');
const fi = flipInputs(sc, COST_BOOK);
eq([fi.price, fi.arv, fi.holdMonths, fi.finance.kind], [900_000, 1_100_000, 6, 'hardMoney'], 'the flip reads the shared scenario');
near(fi.rehab, scopeTotal(sc.scope, COST_BOOK).total, 'and pays for the scoped renovation, contingency included');
eq(operatingFrom({ ...sc, liveInOne: true }).grossMonthlyRent, 6000, 'after a BRRRR every unit is let, whatever the rental tab assumed');
eq(arvSeed({ withheld: null, high: 1_234_567 }, false), 1_235_000, 'ARV seed: the top of the comps\u2019 range, to the thousand');
eq(arvSeed({ withheld: 'far-from-asking', high: 900_000 }, false), 900_000, 'a fixer far from its asking price still gets a seed');
eq(arvSeed({ withheld: 'larger-than-comps', high: 900_000 }, false), null, 'a house larger than every comp gets none');
eq(arvSeed({ withheld: null, high: 900_000 }, true), null, 'nor does a listing whose estimate is switched off');

console.log('--- new construction ---');
const soldHouse = (price: number, sqft: number, built: number, sold: string, lot = 10_000): SaleRow => ({ sale_price: price, living_area: sqft, year_built: built, settled_date: sold, lot_size: lot });
const town: SaleRow[] = [
  soldHouse(2_400_000, 4000, 2025, '2026-03-01'), soldHouse(2_500_000, 4200, 2026, '2026-06-01'), soldHouse(2_300_000, 3800, 2024, '2026-01-15'),
  soldHouse(3_600_000, 6200, 2025, '2026-05-01', 20_000), soldHouse(1_100_000, 1800, 1950, '2026-04-01'),
];
eq(newBuilds(town).length, 4, 'a 1950 house sold in 2026 is not a new build');
const ex = newBuildExit(town, 4000);
eq([ex?.n, ex?.medianPrice, ex?.bandPct, ex?.from, ex?.to], [3, 2_400_000, 25, '2026-01-15', '2026-06-01'], 'a planned 4,000 sq ft house exits at the median of the three new builds near that size');
eq(newBuildExit(town, 9000), null, 'nothing that size was built: no answer rather than a thin one');
eq(typicalNewSize(town, 10_500), { sqft: 4000, n: 3, basis: 'similar-lots' }, 'on a 10,500 sq ft lot, what was built on lots like it');
const tiny = typicalNewSize(town, 1456);
eq([tiny?.basis, tiny?.ratio, tiny?.sqft], ['ratio', 0.39, 550], 'a 1,456 sq ft lot gets the town’s house-to-lot ratio (0.39 here), not a 4,000 sq ft house');
eq(typicalNewSize(town, null)?.basis, 'town', 'no lot size known: the town’s new builds, and it says so');
const acre = typicalNewSize(town, 41_102);
eq([acre?.basis, acre?.capped, acre?.sqft], ['ratio', true, 6200], 'an acre is not a 16,000 sq ft house: capped at the largest new houses selling in town');

console.log('--- the lots around it ---');
const lc = parseLotStats([{ attributes: { LOT_UNITS: 'Acres', N: 5695, MEDIAN: 0.1835 } }, { attributes: { LOT_UNITS: 'Sq. Ft.', N: 3, MEDIAN: 9000 } }], 'district', 'SR3');
eq(lc, { scope: 'district', zoning: 'SR3', n: 5698, medianSqft: 7993 }, 'Newton SR3: the median single-family lot, in the unit most parcels use');
eq(parseLotStats([{ attributes: { LOT_UNITS: 'Acres', N: 12, MEDIAN: 0.5 } }], 'district', 'X'), null, 'twelve parcels are too few for a median');
ok(lotStatsWhere('Newton', 'SR3').includes("ZONING = 'SR3'") && !lotStatsWhere('Wellesley', null).includes('ZONING'), 'no zoning on record: the whole town\u2019s single-family lots');

console.log('--- town rules ---');
eq(Object.keys(TOWN_RULES).length, 17, 'every served town has an entry');
eq([demolitionDelayMonths('Newton'), demolitionDelayMonths('Quincy'), demolitionDelayMonths('Nowhere')], [18, null, null], 'Newton plans for 18 months; unknown is unknown');
const needham = rulesFor({ strategy: 'build', propType: 'SF', yearBuilt: 1950, septic: false, units: 1, town: 'Needham' })[0];
ok(needham.body.includes('could not be confirmed'), 'an unconfirmed delay is said to be unconfirmed');
ok(rulesFor({ strategy: 'build', propType: 'SF', yearBuilt: 1950, septic: false, units: 1, town: 'Newton' }).some((r) => r.id === 'fossil-free'), 'Newton builds all-electric');
ok(!rulesFor({ strategy: 'build', propType: 'SF', yearBuilt: 1950, septic: false, units: 1, town: 'Needham' }).some((r) => r.id === 'fossil-free'), 'Needham does not');
ok(rulesFor({ strategy: 'adu', propType: 'SF', yearBuilt: 1950, septic: true, units: 1, town: 'Dover' }).some((r) => r.id === 'adu-septic'), 'an ADU on septic meets Title V');
ok(!rulesFor({ strategy: 'flip', propType: 'SF', yearBuilt: 1950, septic: false, units: 1, town: 'Newton' }).some((r) => r.id === 'lead'), 'a flip is not a rental: no lead-law rental card');
for (const [name, t] of Object.entries(TOWN_RULES)) {
  if (t.demolition) ok(Boolean(t.demolition.source && t.demolition.url), `${name}: the demolition rule has a source`);
}

console.log('--- every assumption has a source ---');
const sd = screenDefaults();
ok(Object.values(sd).every((v) => Number.isFinite(v)), 'the screener defaults are all numbers');
for (const r of RULES) ok(Boolean(r.source && r.url) && /^\d{4}-\d{2}-\d{2}$/.test(r.asOf), `rule ${r.id}: sourced and dated`);
const today = new Date();
for (const [key, a] of Object.entries(ASSUMPTIONS)) {
  ok(Boolean(a.source) && /^\d{4}-\d{2}-\d{2}$/.test(a.asOf), `${key}: sourced and dated`);
  const age = (today.getTime() - new Date(a.asOf).getTime()) / 86_400_000;
  if (age > 365) console.log(`warn ${key} was last reviewed ${a.asOf}, over a year ago`);
}

/* -------------------------------------------------------------------------- */
if (process.argv.includes('--live')) {
  console.log('--- live: MassGIS ---');
  const parts = addressParts({ street_no: '52', street_name: 'Elinor Rd' })!;
  const body = new URLSearchParams({ where: parcelWhere('Newton', [parts]), outFields: PARCEL_FIELDS.join(','), returnGeometry: 'false', f: 'json' });
  const res = await fetch(`${PARCELS_LAYER}/query`, { method: 'POST', body });
  const data = (await res.json()) as { features?: { attributes: ParcelAttributes }[] };
  const hit = matchParcel(parts, (data.features ?? []).map((x) => x.attributes));
  ok(hit !== null, '52 Elinor Rd, Newton is found');
  if (hit) {
    const live = parseParcel(hit.record, hit.unitMatched);
    ok((live.landShare ?? 0) > 0.8, `and the house is a small share of its value (land ${Math.round((live.landShare ?? 0) * 100)}%)`);
    ok(live.zoning !== null && live.lotSqft !== null, `zoning ${live.zoning}, lot ${live.lotSqft} sq ft, FY${live.fy}`);
  }
}

console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
