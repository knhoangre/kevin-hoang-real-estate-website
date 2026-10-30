/**
 * A residential lease: what one is, how it is started from a rental property
 * and the applicants chosen for it, and what about it is worth a warning.
 *
 * Kevin asked on 2026-10-29 to pick applicants on a property's page and have
 * the lease made from them — the property, the people, the rent — and opened
 * for him to work on. /admin/applications?lease=<id> is that document; this
 * file is its contract, the way rentalApplication.ts is an application's and
 * marketing.ts a booklet's. The stored row is one jsonb column, and
 * `hydrateLease` lays it over a blank lease field by field so a lease saved
 * before a field existed still opens.
 *
 * Pure — no Supabase, no React — so `node scripts/lease-check.ts` runs it.
 *
 * THE WORDS ARE COPIED INTO THE LEASE WHEN IT IS MADE. The standard clauses
 * (`defaultClauses`) are written into the document at creation and edited
 * there; a lease never re-renders from the defaults. A wording change here
 * reaches the next lease made, never one already sent to a tenant — a signed
 * lease that rewords itself on the next deploy is the failure this prevents.
 * The numbered sections built from the fields (rent, money at the start,
 * utilities…) are the exception, and those are only the fields themselves
 * set out in sentences.
 *
 * IT IS THE SITE'S OWN DOCUMENT, NOT GBREB'S FORM. The Greater Boston Real
 * Estate Board's Standard Form Lease is copyrighted, like its RH101
 * application, and nothing here copies its wording or layout. The legal
 * sentences that are not a choice — the deposit's bank account, receipt and
 * interest, when a late charge may start, when the landlord may enter — follow
 * G.L. c.186 §15B, read from malegislature.gov on 2026-10-29.
 */
import type { RentalApplicationRecord } from './rentalApplication';
import type { PropertyGroup, PropertyParts } from './rentalProperty';

// ---------------------------------------------------------------------------
// The document
// ---------------------------------------------------------------------------

export interface LeaseTenant {
  /** Made once and kept: how a corrected name is told apart from another person. */
  id: string;
  name: string;
  email: string;
  phone: string;
  /** The application this person came from. Null for someone typed in by hand. */
  applicationId: string | null;
}

export interface LeaseClause {
  id: string;
  title: string;
  body: string;
}

/** Who pays for a utility. Empty is "not decided yet" and prints as a blank to fill in. */
export type UtilityPayer = '' | 'landlord' | 'tenant' | 'none';

export const UTILITIES: { id: UtilityId; label: string }[] = [
  { id: 'heat', label: 'Heat' },
  { id: 'hotWater', label: 'Hot water' },
  { id: 'electricity', label: 'Electricity' },
  { id: 'cookingGas', label: 'Cooking gas' },
  { id: 'water', label: 'Water and sewer' },
  { id: 'trash', label: 'Trash removal' },
  { id: 'snow', label: 'Snow and ice removal' },
  { id: 'lawn', label: 'Lawn and yard care' },
  { id: 'internet', label: 'Internet and cable' },
];
export type UtilityId =
  | 'heat'
  | 'hotWater'
  | 'electricity'
  | 'cookingGas'
  | 'water'
  | 'trash'
  | 'snow'
  | 'lawn'
  | 'internet';

export const PAYER_LABEL: Record<Exclude<UtilityPayer, ''>, string> = {
  landlord: 'Landlord',
  tenant: 'Tenant',
  none: 'Not applicable',
};

/**
 * When the building was built, as far as the lead law cares. Empty is "not
 * known yet": the lease then prints both boxes for whoever does know.
 */
export type LeadStatus = '' | 'before1978' | 'after1978';

export interface LeaseDoc {
  landlord: { name: string; address: string; phone: string; email: string };
  /** Whoever prepared the lease for the landlord. Starts as Kevin; may be cleared. */
  agent: { name: string; brokerage: string; phone: string; email: string };
  tenants: LeaseTenant[];
  /** Others who will live there — children, mostly. One per line. */
  occupants: string;
  premises: { street: string; unit: string; town: string; state: string; zip: string };
  /** Parking, storage, appliances that come with it. Free text. */
  includes: string;
  /** Wall-clock dates, YYYY-MM-DD. Never an instant: see `formatLeaseDate`. */
  start: string;
  end: string;
  rent: string;
  /** Day of the month rent is due, as typed: "1". */
  dueDay: string;
  payTo: string;
  payHow: string;
  /** Empty means the lease names no late charge at all. */
  lateFee: string;
  firstMonth: string;
  lastMonth: string;
  security: string;
  lockFee: string;
  /** One per line. */
  pets: string;
  /** One per line. */
  vehicles: string;
  utilities: Record<UtilityId, UtilityPayer>;
  lead: LeadStatus;
  clauses: LeaseClause[];
}

/** The agent block, as the store fills it from SITE — passed in so this module needs no config. */
export type LeaseAgent = LeaseDoc['agent'];

const blankUtilities = (): Record<UtilityId, UtilityPayer> =>
  Object.fromEntries(UTILITIES.map((u) => [u.id, ''])) as Record<UtilityId, UtilityPayer>;

export const blankLease = (agent?: LeaseAgent): LeaseDoc => ({
  landlord: { name: '', address: '', phone: '', email: '' },
  agent: agent ?? { name: '', brokerage: '', phone: '', email: '' },
  tenants: [],
  occupants: '',
  premises: { street: '', unit: '', town: '', state: 'MA', zip: '' },
  includes: '',
  start: '',
  end: '',
  rent: '',
  dueDay: '1',
  payTo: '',
  payHow: '',
  lateFee: '',
  firstMonth: '',
  lastMonth: '',
  security: '',
  lockFee: '',
  pets: '',
  vehicles: '',
  utilities: blankUtilities(),
  lead: '',
  clauses: [],
});

/**
 * Ids for tenants and clauses. `crypto.randomUUID` where there is one (every
 * browser that runs the admin, and Node); a counter otherwise, which only has
 * to be unique within one lease.
 */
let counter = 0;
export const newId = (): string =>
  typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${(counter++).toString(36)}`;

// ---------------------------------------------------------------------------
// The standard clauses
// ---------------------------------------------------------------------------

/**
 * The clauses every lease starts with, after the numbered sections built from
 * the fields. Plain English, each one editable and removable in the lease
 * itself — these are a starting point, not a form.
 *
 * "Entry by the Landlord" is the one whose substance is not a choice: a
 * Massachusetts lease may let the landlord in only to inspect, repair or show
 * the premises, and otherwise only under a court order, when the premises look
 * abandoned, or to inspect for damage in the last thirty days (G.L. c.186
 * §15B(1)(a)). A clause giving the landlord more is unenforceable, so the
 * default says exactly that much.
 */
export const DEFAULT_CLAUSES: { title: string; body: string }[] = [
  {
    title: 'Use of the premises',
    body:
      'The Tenant will use the premises only as a private home for the people named in this lease. ' +
      'The Tenant will obey the law and any condominium or building rules the Landlord gives the Tenant ' +
      'in writing, and will not disturb the neighbors or do anything that would void the Landlord’s ' +
      'insurance or raise its cost.',
  },
  {
    title: 'Repairs and upkeep',
    body:
      'The Landlord will keep the premises in the condition the State Sanitary Code requires and will ' +
      'make repairs within a reasonable time after being told of them. The Tenant will keep the premises ' +
      'clean and safe, will tell the Landlord promptly, in writing, of any repair that is needed, and will ' +
      'pay for damage beyond ordinary wear and tear caused by the Tenant, the household or their guests.',
  },
  {
    title: 'Smoke and carbon monoxide alarms',
    body:
      'The Tenant will not disconnect, remove or disable any smoke or carbon monoxide alarm, and will tell ' +
      'the Landlord at once if one is not working.',
  },
  {
    title: 'Entry by the Landlord',
    body:
      'The Landlord, or the Landlord’s agent, may enter the premises at reasonable times and after ' +
      'reasonable notice to inspect them, to make repairs, or to show them to a prospective tenant, buyer ' +
      'or lender. In an emergency the Landlord may enter without notice to make repairs. The Landlord may ' +
      'also enter under a court order, if the premises appear to have been abandoned, or, in the last ' +
      'thirty days of the tenancy or after either party has given notice to end it, to inspect for damage.',
  },
  {
    title: 'Changes to the premises',
    body:
      'The Tenant will not paint, make alterations, add or change locks, or attach anything permanently to ' +
      'the walls, floors or ceilings without the Landlord’s written permission.',
  },
  {
    title: 'Subletting',
    body:
      'The Tenant will not sublet the premises, or assign this lease, in whole or in part, without the ' +
      'Landlord’s written permission.',
  },
  {
    title: 'Smoking',
    body:
      'No one may smoke or vape anything — tobacco, marijuana or otherwise — inside the premises or in ' +
      'any common area of the building.',
  },
  {
    title: 'Renter’s insurance',
    body:
      'The Landlord’s insurance does not cover the Tenant’s belongings or the Tenant’s liability. The ' +
      'Tenant is encouraged to carry renter’s insurance.',
  },
  {
    title: 'Moving out',
    body:
      'At the end of the tenancy the Tenant will leave the premises clean and in the condition they were ' +
      'in at the start, except for ordinary wear and tear, will return every key, and will give the ' +
      'Landlord a forwarding address in writing.',
  },
  {
    title: 'Staying after the lease ends',
    body:
      'If the Tenant stays after the end of the term without a new written lease and the Landlord accepts ' +
      'rent, the tenancy continues as a tenancy at will on the same terms, which either party may end by ' +
      'giving the written notice Massachusetts law requires.',
  },
  {
    title: 'Notices',
    body:
      'Notices under this lease must be in writing, delivered by hand, by mail, or by email to the ' +
      'addresses in this lease.',
  },
  {
    title: 'The whole agreement',
    body:
      'This lease, with anything attached to it and signed, is the whole agreement between the Landlord ' +
      'and the Tenant. It may be changed only in writing signed by the Landlord and every Tenant. If any ' +
      'part of it is found to be unenforceable, the rest of it still applies.',
  },
];

export const defaultClauses = (): LeaseClause[] =>
  DEFAULT_CLAUSES.map((c) => ({ id: newId(), title: c.title, body: c.body }));

// ---------------------------------------------------------------------------
// Money and dates
// ---------------------------------------------------------------------------

/** A dollar amount as typed — "$2,400", "2400.50" — or null when it is not one. */
export const moneyValue = (typed: string): number | null => {
  const cleaned = typed.trim().replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Number(cleaned);
};

/** "$2,400", or "$2,400.50" when there are cents. */
export const formatMoney = (amount: number): string =>
  `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;

/** A typed amount, tidied for print. What is not an amount prints as typed. */
export const showMoney = (typed: string): string => {
  const value = moneyValue(typed);
  return value === null ? typed.trim() : formatMoney(value);
};

/** The money at the start, the lines that have an amount, and their total. */
export const MOVE_IN_LINES: { key: 'firstMonth' | 'lastMonth' | 'security' | 'lockFee'; label: string }[] = [
  { key: 'firstMonth', label: 'First month’s rent' },
  { key: 'lastMonth', label: 'Last month’s rent' },
  { key: 'security', label: 'Security deposit' },
  { key: 'lockFee', label: 'New lock and key' },
];

export const moveInLines = (doc: LeaseDoc): { label: string; amount: number }[] =>
  MOVE_IN_LINES.flatMap(({ key, label }) => {
    const amount = moneyValue(doc[key]);
    return amount === null || amount === 0 ? [] : [{ label, amount }];
  });

/** Null when nothing has an amount — a lease that asks for nothing up front prints no table. */
export const moveInTotal = (doc: LeaseDoc): number | null => {
  const lines = moveInLines(doc);
  return lines.length === 0 ? null : Math.round(lines.reduce((sum, l) => sum + l.amount, 0) * 100) / 100;
};

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const parseDate = (value: string): { y: number; m: number; d: number } | null => {
  const match = DATE.exec(value.trim());
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (m < 1 || m > 12 || d < 1 || d > daysIn(y, m)) return null;
  return { y, m, d };
};

/** Days in month `m` (1–12) of year `y`. Built in UTC, like every date here. */
const daysIn = (y: number, m: number): number => new Date(Date.UTC(y, m, 0)).getUTCDate();

const iso = (y: number, m: number, d: number): string =>
  `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/**
 * The last day of a term of `months` starting on `start`: the day before the
 * same date `months` later. September 1 for twelve months ends August 31.
 *
 * When that date does not exist — a term starting January 31 for one month —
 * the anniversary is taken as the first of the month after, so the term ends
 * on the last day of the month it lands in (February 28), not a day short of
 * it. Null for a start that is not a date or a length that is not a whole
 * number of months.
 */
export const termEnd = (start: string, months: number): string | null => {
  const s = parseDate(start);
  if (!s || !Number.isInteger(months) || months < 1 || months > 120) return null;
  const index = s.m - 1 + months;
  const y = s.y + Math.floor(index / 12);
  const m = (index % 12) + 1;
  if (s.d > daysIn(y, m)) return iso(y, m, daysIn(y, m));
  if (s.d === 1) {
    // The day before the first is the last of the month before.
    const pm = m === 1 ? 12 : m - 1;
    const py = m === 1 ? y - 1 : y;
    return iso(py, pm, daysIn(py, pm));
  }
  return iso(y, m, s.d - 1);
};

/** Whole months from `start` to `end` when `end` is exactly what `termEnd` gives; else null. */
export const termMonths = (start: string, end: string): number | null => {
  for (let months = 1; months <= 120; months += 1) {
    const candidate = termEnd(start, months);
    if (candidate === null) return null;
    if (candidate === end) return months;
    if (candidate > end) return null;
  }
  return null;
};

/**
 * "September 1, 2026". Built and formatted in UTC: `new Date('2026-09-01')` is
 * midnight UTC, which is the evening of August 31 in Boston, and formatting it
 * in local time prints the wrong day — the showing tours' rule.
 */
export const formatLeaseDate = (value: string): string => {
  const d = parseDate(value);
  if (!d) return value.trim();
  return new Date(Date.UTC(d.y, d.m - 1, d.d)).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

/** "1st", "2nd", "23rd". What is not a day of the month comes back as typed. */
export const ordinalDay = (typed: string): string => {
  const n = Number(typed.trim());
  if (!Number.isInteger(n) || n < 1 || n > 31) return typed.trim();
  const teen = n % 100 >= 11 && n % 100 <= 13;
  const suffix = teen ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
};

// ---------------------------------------------------------------------------
// Starting a lease from applications
// ---------------------------------------------------------------------------

const clean = (value: string | null | undefined): string => (value ?? '').trim();

/** "Jane Q. Doe" from an application's first section. */
export const applicantName = (a: RentalApplicationRecord): string => {
  const p = a.data.applicant;
  const first = clean(p.firstName) || clean(a.applicantFirstName);
  const last = clean(p.lastName) || clean(a.applicantLastName);
  const mi = clean(p.middleInitial).replace(/\.$/, '');
  return [first, mi && `${mi}.`, last].filter(Boolean).join(' ');
};

/** Lines, once each whatever the capitals, in the order first seen. */
const uniqueLines = (lines: string[]): string => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines.map((l) => l.trim()).filter(Boolean)) {
    const key = line.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out.join('\n');
};

/**
 * A lease made from a property and the applicants chosen for it.
 *
 * What comes from where, and what is deliberately left blank:
 *
 *   - The premises and the rent come from the property's LINK (the invite),
 *     the admin's structured record of what was offered — the same reason
 *     groupByProperty files an application by its invite rather than by the
 *     address the applicant typed. The applicant's own asking rent is the
 *     fallback only.
 *   - Each applicant is a tenant. The children listed on any of their
 *     applications are the other occupants; pets and vehicles are gathered
 *     the same way, once each.
 *   - The start is the EARLIEST move-in date any of them asked for, and the
 *     term the length they asked for, else twelve months.
 *   - The first month's rent is the rent. The last month's rent, the security
 *     deposit and a lock fee are each the landlord's choice, and are left
 *     empty rather than assumed: an empty amount is left off the lease, while
 *     a wrong one is a demand for money nobody decided on.
 *   - The landlord is not known to the site and is left for Kevin to fill in.
 *     The utilities and the building's age likewise: an unanswered question
 *     prints as a blank to fill in by hand, never as a guess.
 */
export const leaseFromApplications = ({
  property,
  rent,
  applications,
  agent,
}: {
  property: PropertyParts;
  rent: number | null;
  applications: RentalApplicationRecord[];
  agent: LeaseAgent;
}): LeaseDoc => {
  const doc = blankLease(agent);
  const tenancies = applications.map((a) => a.data.tenancy);

  const askedRent = tenancies.map((t) => moneyValue(t.baseRent)).find((v) => v !== null) ?? null;
  const monthly = rent ?? askedRent;
  const rentText = monthly === null ? '' : formatMoney(monthly);

  const starts = tenancies.map((t) => clean(t.desiredOccupancyDate)).filter((d) => parseDate(d)).sort();
  const start = starts[0] ?? '';
  const asked = tenancies.map((t) => Number(clean(t.leaseTermMonths))).find((n) => Number.isInteger(n) && n > 0);
  const months = asked ?? 12;

  return {
    ...doc,
    tenants: applications.map((a) => ({
      id: newId(),
      name: applicantName(a),
      email: clean(a.data.applicant.email) || clean(a.applicantEmail),
      phone: clean(a.data.applicant.phone) || clean(a.applicantPhone),
      applicationId: a.id,
    })),
    occupants: uniqueLines(
      applications.flatMap((a) =>
        a.data.household.minorChildren.map((c) =>
          [clean(c.name), clean(c.age) && `age ${clean(c.age)}`].filter(Boolean).join(', ')
        )
      )
    ),
    premises: {
      street: clean(property.propertyAddress),
      unit: clean(property.unit),
      town: clean(property.propertyTown),
      state: clean(property.propertyState) || 'MA',
      zip: clean(property.propertyZip),
    },
    start,
    end: start ? termEnd(start, months) ?? '' : '',
    rent: rentText,
    firstMonth: rentText,
    pets: uniqueLines(
      applications.flatMap((a) =>
        a.data.household.pets.map((p) => {
          const kind = [clean(p.type), clean(p.breed) && `(${clean(p.breed)})`].filter(Boolean).join(' ');
          const weight = clean(p.weight);
          return [kind, weight && (/\d$/.test(weight) ? `${weight} lb` : weight)].filter(Boolean).join(', ');
        })
      )
    ),
    vehicles: uniqueLines(
      applications.map((a) => {
        const v = a.data.vehicle;
        const car = [clean(v.year), clean(v.make), clean(v.model)].filter(Boolean).join(' ');
        const plate = clean(v.plate) && [clean(v.plateState), 'plate', clean(v.plate)].filter(Boolean).join(' ');
        return [car, plate].filter(Boolean).join(', ');
      })
    ),
    clauses: defaultClauses(),
  };
};

// ---------------------------------------------------------------------------
// Reading a stored lease
// ---------------------------------------------------------------------------

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

/** The string fields of `base`, taken from `stored` where they are strings. */
const strings = <T extends object>(base: T, stored: unknown): T => {
  if (!isRecord(stored)) return base;
  const out = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(base)) {
    if (typeof value === 'string' && typeof stored[key] === 'string') out[key] = stored[key];
  }
  return out as unknown as T;
};

const PAYERS: UtilityPayer[] = ['', 'landlord', 'tenant', 'none'];
const LEADS: LeadStatus[] = ['', 'before1978', 'after1978'];

/**
 * A stored lease, laid over a blank one field by field. A value is kept only
 * where its type is right, so a lease saved before a field existed — or after
 * one was removed — still opens, with the new field blank.
 */
export const hydrateLease = (stored: unknown, agent?: LeaseAgent): LeaseDoc => {
  const base = blankLease(agent);
  if (!isRecord(stored)) return base;
  const doc = strings(base, stored);

  const utilities = blankUtilities();
  if (isRecord(stored.utilities)) {
    for (const u of UTILITIES) {
      const v = stored.utilities[u.id];
      if (typeof v === 'string' && PAYERS.includes(v as UtilityPayer)) utilities[u.id] = v as UtilityPayer;
    }
  }

  const list = <T extends object>(value: unknown, blank: () => T): T[] =>
    Array.isArray(value) ? value.filter(isRecord).map((item) => strings(blank(), item)) : [];

  return {
    ...doc,
    landlord: strings(base.landlord, stored.landlord),
    // A stored agent block replaces the default whole, cleared fields included:
    // Kevin removing himself from a lease is a choice, not a gap to refill.
    agent: isRecord(stored.agent)
      ? strings({ name: '', brokerage: '', phone: '', email: '' }, stored.agent)
      : base.agent,
    premises: strings(base.premises, stored.premises),
    utilities,
    lead: LEADS.includes(stored.lead as LeadStatus) ? (stored.lead as LeadStatus) : '',
    tenants: Array.isArray(stored.tenants)
      ? stored.tenants.filter(isRecord).map((raw) => ({
          ...strings({ id: newId(), name: '', email: '', phone: '' }, raw),
          applicationId: typeof raw.applicationId === 'string' ? raw.applicationId : null,
        }))
      : [],
    clauses: list(stored.clauses, () => ({ id: newId(), title: '', body: '' })),
  };
};

// ---------------------------------------------------------------------------
// What the list shows, and where a lease is filed
// ---------------------------------------------------------------------------

/** The premises as the property helpers spell them, so a lease's address reads like its property's. */
export const leasePremises = (doc: LeaseDoc): PropertyParts => ({
  propertyAddress: doc.premises.street,
  unit: doc.premises.unit,
  propertyTown: doc.premises.town,
  propertyState: doc.premises.state,
  propertyZip: doc.premises.zip,
});

/** "Jane Doe and John Smith", for the list of leases. */
export const tenantNames = (doc: LeaseDoc): string => {
  const names = doc.tenants.map((t) => t.name.trim()).filter(Boolean);
  if (names.length <= 2) return names.join(' and ');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
};

export interface LeaseSummary {
  id: string;
  title: string;
  tenantNames: string;
  propertyKey: string;
  applicationIds: string[];
  updatedAt: string;
}

/**
 * The leases that belong on a property's page.
 *
 * By APPLICATION first: a lease made from that property's applicants is that
 * property's, wherever its own address has since been edited to — and when the
 * property's address is corrected, its applications move with it (they are
 * filed by their link), so the lease follows without being rewritten. The
 * property key the lease was made under is the fallback, for a lease whose
 * tenants were all typed in by hand.
 */
export const leasesForProperty = (group: PropertyGroup, leases: LeaseSummary[]): LeaseSummary[] => {
  const ids = new Set(group.applications.map((a) => a.id));
  return leases.filter(
    (l) => l.applicationIds.some((id) => ids.has(id)) || (l.applicationIds.length === 0 && l.propertyKey === group.key)
  );
};

// ---------------------------------------------------------------------------
// Warnings
// ---------------------------------------------------------------------------

/**
 * What about this lease is worth saying before it is printed. Nothing here
 * blocks anything — the lease prints whatever it says — but each of these is
 * either the law or a lease that contradicts itself.
 *
 * The money limits are G.L. c.186 §15B(1)(b): at or before the start a
 * landlord may ask for no more than the first month's rent, the last month's
 * at the same rate, a security deposit of no more than the first month's rent,
 * and the cost of a new lock and key.
 */
export const leaseWarnings = (doc: LeaseDoc): string[] => {
  const out: string[] = [];
  const rent = moneyValue(doc.rent);
  const first = moneyValue(doc.firstMonth);
  const last = moneyValue(doc.lastMonth);
  const security = moneyValue(doc.security);

  if (doc.tenants.filter((t) => t.name.trim()).length === 0) out.push('The lease names no tenant yet.');
  if (!doc.landlord.name.trim()) out.push('The landlord’s name is blank — it will print as a line to fill in.');

  if (doc.start && doc.end && parseDate(doc.start) && parseDate(doc.end) && doc.end < doc.start) {
    out.push('The lease ends before it starts.');
  }

  if (rent !== null) {
    if (security !== null && security > rent) {
      out.push(
        `The security deposit (${formatMoney(security)}) is more than one month’s rent (${formatMoney(rent)}). ` +
          'Massachusetts caps it at the first month’s rent.'
      );
    }
    if (last !== null && last !== 0 && last !== rent) {
      out.push(
        `Last month’s rent (${formatMoney(last)}) is not the monthly rent (${formatMoney(rent)}). ` +
          'Massachusetts requires it at the same rate as the first month.'
      );
    }
    if (first !== null && first > rent) {
      out.push(`The first month’s rent (${formatMoney(first)}) is more than the monthly rent (${formatMoney(rent)}).`);
    }
  }

  if (moveInTotal(doc) === null) {
    out.push('Nothing is entered under money at the start, so the lease will say none is due.');
  }

  // G.L. c.186 §22(f): water may be billed separately only under a written
  // rental agreement that "clearly and conspicuously" provides for it and
  // discloses the submetering arrangement in plain language. A "Tenant" in the
  // utilities table is not that disclosure.
  if (doc.utilities.water === 'tenant') {
    out.push(
      'Water and sewer are marked as the tenant’s. Massachusetts allows that only with a certified ' +
        'submeter, and the lease must describe the arrangement in plain language — add a clause for it.'
    );
  }

  for (const [label, typed] of [
    ['Rent', doc.rent],
    ['First month’s rent', doc.firstMonth],
    ['Last month’s rent', doc.lastMonth],
    ['Security deposit', doc.security],
    ['Lock and key', doc.lockFee],
    ['Late charge', doc.lateFee],
  ] as const) {
    if (typed.trim() && moneyValue(typed) === null) out.push(`${label} is not an amount: “${typed.trim()}”.`);
  }

  return out;
};
