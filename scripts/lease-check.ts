/**
 * Assertions for the lease made on /admin/applications — src/lib/lease.ts.
 *
 *   node scripts/lease-check.ts
 *
 * What is promised here is what Kevin reads on the lease before a tenant does:
 *
 *   - The property and the rent come from the property's link, the people
 *     from the applications chosen, and nothing the landlord has not decided
 *     (a deposit, a last month's rent, who pays for heat) is filled in for them.
 *   - The term ends the day before its anniversary, including at a month's end.
 *   - A lease saved before a field existed still opens.
 *   - A deposit over the legal limit is said out loud.
 *
 * No dependencies, no network.
 */
import {
  blankLease,
  DEFAULT_CLAUSES,
  formatLeaseDate,
  formatMoney,
  hydrateLease,
  leaseFromApplications,
  leasesForProperty,
  leaseWarnings,
  moneyValue,
  moveInTotal,
  ordinalDay,
  tenantNames,
  termEnd,
  termMonths,
  type LeaseSummary,
} from '../src/lib/lease.ts';
import type { RentalApplicationRecord } from '../src/lib/rentalApplication.ts';
import type { PropertyGroup } from '../src/lib/rentalProperty.ts';

let failures = 0;
const ok = (cond: boolean, label: string) => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}`);
  if (!cond) failures += 1;
};
const eq = (actual: unknown, expected: unknown, label: string) => {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  ok(same, same ? label : `${label} — got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
};

const AGENT = { name: 'Kevin Hoang', brokerage: 'LPT Realty', phone: '(860) 682-2251', email: 'k@example.com' };

/** An application with only what a lease reads from one. */
const app = (
  id: string,
  {
    first,
    last,
    mi = '',
    email = `${first.toLowerCase()}@example.com`,
    phone = '617-555-0100',
    moveIn = '',
    months = '',
    baseRent = '',
    kids = [] as { name: string; age: string }[],
    pets = [] as { type: string; breed: string; weight: string }[],
    car = { make: '', model: '', year: '', plate: '', plateState: '' },
  }: {
    first: string;
    last: string;
    mi?: string;
    email?: string;
    phone?: string;
    moveIn?: string;
    months?: string;
    baseRent?: string;
    kids?: { name: string; age: string }[];
    pets?: { type: string; breed: string; weight: string }[];
    car?: { make: string; model: string; year: string; plate: string; plateState: string };
  }
): RentalApplicationRecord =>
  ({
    id,
    inviteId: `inv-${id}`,
    applicantUserId: `user-${id}`,
    status: 'submitted',
    applicantFirstName: first,
    applicantLastName: last,
    applicantEmail: email,
    applicantPhone: phone,
    submittedAt: '2026-10-20T12:00:00Z',
    createdAt: '2026-10-19T12:00:00Z',
    updatedAt: '2026-10-20T12:00:00Z',
    data: {
      applicant: { firstName: first, lastName: last, middleInitial: mi, email, phone },
      household: { minorChildren: kids, pets, coTenants: [] },
      vehicle: car,
      tenancy: {
        propertyAddress: '',
        unit: '',
        desiredOccupancyDate: moveIn,
        leaseTermMonths: months,
        baseRent,
        otherMonthlyCharges: '',
      },
    },
  }) as unknown as RentalApplicationRecord;

// ---------------------------------------------------------------------------
// The term
// ---------------------------------------------------------------------------

eq(termEnd('2026-09-01', 12), '2027-08-31', 'September 1 for twelve months ends August 31');
eq(termEnd('2026-03-15', 12), '2027-03-14', 'March 15 for twelve months ends March 14');
eq(termEnd('2026-01-01', 1), '2026-01-31', 'January 1 for a month ends January 31');
eq(termEnd('2026-12-01', 1), '2026-12-31', 'December 1 for a month ends December 31, not in November');
eq(termEnd('2026-01-31', 1), '2026-02-28', 'January 31 for a month ends on the last day of February');
eq(termEnd('2028-01-31', 1), '2028-02-29', '…which in a leap year is the 29th');
eq(termEnd('2026-03-31', 1), '2026-04-30', 'March 31 for a month ends April 30');
eq(termEnd('2026-11-15', 18), '2028-05-14', 'eighteen months crosses a year boundary twice');
eq(termEnd('2026-02-30', 12), null, 'a date that does not exist has no end');
eq(termEnd('', 12), null, 'no start, no end');
eq(termEnd('2026-09-01', 0), null, 'a term of no months has no end');
eq(termMonths('2026-09-01', '2027-08-31'), 12, 'a twelve-month term is read back as twelve months');
eq(termMonths('2026-09-01', '2027-08-30'), null, 'an end a day short is not a whole number of months');

eq(formatLeaseDate('2026-09-01'), 'September 1, 2026', 'a date prints as the day it is, never the evening before');
eq(formatLeaseDate('next spring'), 'next spring', 'what is not a date prints as typed');
eq(['1', '2', '3', '4', '11', '12', '13', '21', '22', '31'].map(ordinalDay),
  ['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '31st'], 'days of the month take the right suffix');

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

eq(moneyValue('$2,400'), 2400, '"$2,400" is 2400');
eq(moneyValue('2400.5'), 2400.5, '"2400.5" is 2400.50');
eq(moneyValue('two grand'), null, 'words are not an amount');
eq(moneyValue(''), null, 'an empty field is not zero');
eq(formatMoney(2400), '$2,400', 'whole dollars print without cents');
eq(formatMoney(2400.5), '$2,400.50', 'cents print as two digits');

// ---------------------------------------------------------------------------
// A lease from a property and its applicants
// ---------------------------------------------------------------------------

const property = {
  propertyAddress: '42 Newman St',
  unit: '3',
  propertyTown: 'Malden',
  propertyState: 'MA',
  propertyZip: '02148',
};
const jane = app('a1', {
  first: 'Jane',
  last: 'Doe',
  mi: 'Q',
  moveIn: '2026-12-01',
  months: '12',
  kids: [{ name: 'Sam Doe', age: '7' }],
  pets: [{ type: 'Dog', breed: 'Beagle', weight: '25' }],
  car: { make: 'Honda', model: 'Civic', year: '2019', plate: 'ABC123', plateState: 'MA' },
});
const john = app('a2', {
  first: 'John',
  last: 'Smith',
  moveIn: '2026-11-15',
  baseRent: '2,100',
  kids: [{ name: 'sam doe', age: '7' }],
  pets: [{ type: 'Dog', breed: 'Beagle', weight: '25' }],
});

const lease = leaseFromApplications({ property, rent: 2400, applications: [jane, john], agent: AGENT });

eq(lease.premises, { street: '42 Newman St', unit: '3', town: 'Malden', state: 'MA', zip: '02148' },
  'the premises are the property’s link, unit and all');
eq(lease.tenants.map((t) => t.name), ['Jane Q. Doe', 'John Smith'], 'each applicant is a tenant, by full name');
eq(lease.tenants.map((t) => t.applicationId), ['a1', 'a2'], 'each tenant remembers the application they came from');
ok(lease.tenants[0].id !== lease.tenants[1].id, 'tenants have ids of their own');
eq(lease.tenants[0].email, 'jane@example.com', 'a tenant’s email is the one on their application');
eq(lease.rent, '$2,400', 'the rent is the link’s, not an applicant’s asking figure');
eq(lease.firstMonth, '$2,400', 'the first month’s rent is the rent');
eq([lease.lastMonth, lease.security, lease.lockFee], ['', '', ''],
  'last month, deposit and lock are left for the landlord to decide');
eq(lease.start, '2026-11-15', 'the start is the earliest move-in anyone asked for');
eq(lease.end, '2027-11-14', 'and the term is the length asked for');
eq(lease.occupants, 'Sam Doe, age 7', 'a child on two applications is one occupant');
eq(lease.pets, 'Dog (Beagle), 25 lb', 'a pet on two applications is one pet');
eq(lease.vehicles, '2019 Honda Civic, MA plate ABC123', 'a vehicle reads as year, make, model and plate');
eq(lease.landlord.name, '', 'the landlord is not guessed');
ok(Object.values(lease.utilities).every((v) => v === ''), 'no utility is assigned to anyone until decided');
eq(lease.lead, '', 'the building’s age is not guessed');
eq(lease.clauses.map((c) => c.title), DEFAULT_CLAUSES.map((c) => c.title), 'the standard clauses are copied in');
eq(lease.agent, AGENT, 'the agent block is whoever prepared it');
eq(tenantNames(lease), 'Jane Q. Doe and John Smith', 'two tenants read "A and B"');

const fallback = leaseFromApplications({ property, rent: null, applications: [john], agent: AGENT });
eq(fallback.rent, '$2,100', 'with no rent on the link, the applicant’s asking rent is the starting point');
eq(fallback.end, '2027-11-14', 'with no length asked for, the term is twelve months');

const undated = leaseFromApplications({ property, rent: 2400, applications: [app('a3', { first: 'Ann', last: 'Lee' })], agent: AGENT });
eq([undated.start, undated.end], ['', ''], 'no move-in date asked for, no dates on the lease');

// ---------------------------------------------------------------------------
// Money at the start, and what is worth a warning
// ---------------------------------------------------------------------------

const priced = { ...lease, landlord: { ...lease.landlord, name: 'Pat Owner' }, lastMonth: '2,400', security: '2400', lockFee: '75' };
eq(moveInTotal(priced), 7275, 'the total is every line with an amount');
eq(moveInTotal({ ...blankLease(), rent: '2400' }), null, 'a lease asking for nothing up front has no total');
eq(leaseWarnings(priced), [], 'a lease within the limits has nothing to warn about');

const greedy = { ...priced, security: '3,000', lastMonth: '2,500' };
const warnings = leaseWarnings(greedy);
ok(warnings.some((w) => w.includes('security deposit ($3,000) is more than one month’s rent')),
  'a deposit over a month’s rent is called out');
ok(warnings.some((w) => w.includes('Last month’s rent ($2,500) is not the monthly rent')),
  'a last month at a different rate is called out');
ok(leaseWarnings({ ...priced, start: '2026-12-01', end: '2026-11-30' }).includes('The lease ends before it starts.'),
  'an end before the start is called out');
ok(leaseWarnings({ ...priced, lateFee: 'five percent' }).some((w) => w.startsWith('Late charge is not an amount')),
  'a late charge that is not an amount is called out');
ok(leaseWarnings({ ...priced, tenants: [] }).includes('The lease names no tenant yet.'), 'a lease with no tenant is called out');
ok(leaseWarnings({ ...priced, firstMonth: '', lastMonth: '', security: '', lockFee: '' })
  .some((w) => w.startsWith('Nothing is entered under money at the start')),
  'a lease asking for nothing up front says so before it is printed');
ok(leaseWarnings({ ...priced, utilities: { ...priced.utilities, water: 'tenant' } })
  .some((w) => w.startsWith('Water and sewer are marked as the tenant’s')),
  'water billed to the tenant is called out, since the law wants it spelled out');

// ---------------------------------------------------------------------------
// Reading a stored lease
// ---------------------------------------------------------------------------

const old = hydrateLease({ rent: '$1,900', premises: { street: '1 Main St' }, tenants: [{ name: 'Old Tenant' }] }, AGENT);
eq(old.rent, '$1,900', 'a stored field comes back');
eq(old.premises.state, 'MA', 'a field the stored lease lacks comes back blank (here, its default)');
eq(old.tenants[0].name, 'Old Tenant', 'a stored tenant comes back');
eq(old.tenants[0].applicationId, null, 'a tenant stored without an application has none');
ok(typeof old.tenants[0].id === 'string' && old.tenants[0].id.length > 0, 'and gets an id to be edited by');
eq(old.utilities.heat, '', 'utilities a stored lease never had are undecided');
eq(old.agent, AGENT, 'a lease stored with no agent block starts with the agent');
eq(old.clauses, [], 'stored clauses are the lease’s own — none stored, none invented');

const odd = hydrateLease({ rent: 1900, utilities: { heat: 'tenant', water: 'whoever' }, lead: 'maybe', agent: { name: '' } }, AGENT);
eq(odd.rent, '', 'a value of the wrong type does not come through');
eq([odd.utilities.heat, odd.utilities.water], ['tenant', ''], 'a payer that is not one of the four is dropped');
eq(odd.lead, '', 'a lead answer that is not one of the three is dropped');
eq(odd.agent.name, '', 'an agent Kevin cleared stays cleared');

const roundTrip = hydrateLease(JSON.parse(JSON.stringify(lease)), AGENT);
eq(roundTrip, lease, 'a lease saved and opened again is the same lease');

// ---------------------------------------------------------------------------
// Where a lease is filed
// ---------------------------------------------------------------------------

const group = { key: '42 newman st|3|malden', applications: [jane, john] } as unknown as PropertyGroup;
const summary = (id: string, fields: Partial<LeaseSummary>): LeaseSummary => ({
  id,
  title: '',
  tenantNames: '',
  propertyKey: '',
  applicationIds: [],
  updatedAt: '2026-10-29T12:00:00Z',
  ...fields,
});
eq(
  leasesForProperty(group, [
    summary('l1', { applicationIds: ['a1'], propertyKey: 'somewhere else' }),
    summary('l2', { propertyKey: '42 newman st|3|malden' }),
    summary('l3', { applicationIds: ['zz'], propertyKey: '42 newman st|3|malden' }),
    summary('l4', { propertyKey: '1 main st||boston' }),
  ]).map((l) => l.id),
  ['l1', 'l2'],
  'a lease is filed with its applicants’ property, and by address only when it has no applicants'
);

console.log(failures === 0 ? '\nAll lease assertions passed.' : `\n${failures} failed.`);
process.exit(failures === 0 ? 0 : 1);
