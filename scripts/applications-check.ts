/**
 * Assertions for how /admin/applications files things — src/lib/rentalProperty.ts.
 *
 *   node scripts/applications-check.ts
 *
 * What is promised here is what Kevin reads at the desk:
 *
 *   - A link whose address is corrected joins the other links and applications
 *     for that address, however the correction was typed ("12 Elm Street." is
 *     the "12 Elm St" MassGIS filled in last time).
 *   - The property with the most recent SUBMITTED application is first, and a
 *     link created this morning does not push it down.
 *   - Correcting a link moves the address in the applications started on it,
 *     and never an address the applicant wrote themselves.
 *
 * No dependencies, no network.
 */
import {
  groupByProperty,
  previousProperties,
  propertyKey,
  retargetTenancy,
} from '../src/lib/rentalProperty.ts';
import type { RentalApplicationRecord, RentalInviteRecord } from '../src/lib/rentalApplication.ts';

let failures = 0;
const ok = (cond: boolean, label: string) => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}`);
  if (!cond) failures += 1;
};

const invite = (id: string, fields: Partial<RentalInviteRecord>): RentalInviteRecord => ({
  id,
  token: `tok-${id}`,
  label: null,
  propertyAddress: null,
  unit: null,
  propertyTown: null,
  propertyState: 'MA',
  propertyZip: null,
  monthlyRent: null,
  inviteeEmail: `${id}@example.com`,
  expiresAt: null,
  revokedAt: null,
  sentAt: null,
  createdAt: '2026-10-01T00:00:00Z',
  ...fields,
});

const application = (
  id: string,
  inviteId: string | null,
  fields: Partial<RentalApplicationRecord>,
  tenancy = { propertyAddress: '', unit: '' }
): RentalApplicationRecord =>
  ({
    id,
    inviteId,
    applicantUserId: `user-${id}`,
    status: 'submitted',
    data: { tenancy } as RentalApplicationRecord['data'],
    applicantFirstName: id,
    applicantLastName: 'Test',
    applicantEmail: `${id}@example.com`,
    applicantPhone: null,
    submittedAt: null,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    ...fields,
  }) as RentalApplicationRecord;

/* ---- One address, however it was typed -------------------------------- */

const key = (street: string, unit = '', town = 'Needham') =>
  propertyKey({ propertyAddress: street, unit, propertyTown: town });

ok(key('12 Elm Street') === key('12 Elm St'), '"12 Elm Street" and "12 Elm St" are one property');
ok(key('12 Elm St.') === key('12 elm st'), 'a full stop and capitals make no difference');
ok(key('12 ELM STREET', '', ' needham ') === key('12 Elm St'), 'nor does the town\'s case or spacing');
ok(
  key('42 Newman St', '#3') === key('42 Newman St', 'Unit 3') &&
    key('42 Newman St', 'unit 3') === key('42 Newman St', '3'),
  '"#3", "Unit 3" and "3" are one unit'
);
ok(key('42 Newman St', '3') !== key('42 Newman St', '4'), 'two units of one building are two properties');
ok(key('12 Elm St') !== key('12 Elm Stret'), 'a typo is still a different address');
ok(key('12 Court St') !== key('12 Ct St'), 'only the LAST word is a suffix: Court St is not Ct St');
ok(key('12 Elm St', '', 'Needham') !== key('12 Elm St', '', 'Newton'), 'the same street in two towns is two properties');

const reuse = previousProperties([
  invite('new', { propertyAddress: '12 Elm Street', propertyTown: 'Needham', createdAt: '2026-10-10T00:00:00Z' }),
  invite('old', { propertyAddress: '12 Elm St', propertyTown: 'Needham', createdAt: '2026-10-01T00:00:00Z' }),
]);
ok(reuse.length === 1, 'the reuse picker offers one entry for both spellings');

/* ---- A correction joins its property ---------------------------------- */

const elm = invite('elm', {
  propertyAddress: '12 Elm St',
  propertyTown: 'Needham',
  propertyZip: '02492',
  createdAt: '2026-10-10T00:00:00Z',
});
const typo = invite('typo', {
  propertyAddress: '12 Elm Stret',
  propertyTown: 'Needham',
  propertyZip: '02492',
  createdAt: '2026-10-16T00:00:00Z',
});
const apps = [
  application('bob', 'elm', { submittedAt: '2026-10-15T00:00:00Z' }),
  application('carol', 'typo', { submittedAt: '2026-10-17T00:00:00Z' }),
];

const before = groupByProperty(apps, [elm, typo]);
ok(before.length === 2, 'before the correction, the typo is a property of its own');

const corrected = { ...typo, propertyAddress: '12 Elm Street.' };
const after = groupByProperty(apps, [elm, corrected]);
ok(after.length === 1, 'after it, there is one property');
ok(
  after[0].applications.map((a) => a.id).join() === 'carol,bob',
  'holding both applications, the newest first'
);
ok(after[0].invites.length === 2, 'and both links');
ok(after[0].lastSubmitted === '2026-10-17T00:00:00Z', 'it was last submitted to when Carol sent hers');

/* ---- Order: the latest submission first -------------------------------- */

const order = groupByProperty(
  [
    application('older', 'a', { submittedAt: '2026-10-05T00:00:00Z' }),
    application('newer', 'b', { submittedAt: '2026-10-12T00:00:00Z' }),
    // Started but not sent: activity, not a submission.
    application('draft', 'c', { status: 'draft', createdAt: '2026-10-18T00:00:00Z' }),
  ],
  [
    invite('a', { propertyAddress: '1 A St', propertyTown: 'Newton', createdAt: '2026-10-01T00:00:00Z' }),
    invite('b', { propertyAddress: '2 B St', propertyTown: 'Newton', createdAt: '2026-10-02T00:00:00Z' }),
    invite('c', { propertyAddress: '3 C St', propertyTown: 'Newton', createdAt: '2026-10-03T00:00:00Z' }),
    // A link sent this morning, for a property nobody has applied to yet.
    invite('d', { propertyAddress: '4 D St', propertyTown: 'Newton', createdAt: '2026-10-18T09:00:00Z' }),
  ]
);
ok(
  order.map((g) => g.label.split(',')[0]).join(' / ') === '2 B St / 1 A St / 4 D St / 3 C St',
  'latest submission first; then the properties with none, newest activity first'
);
ok(
  order.filter((g) => g.lastSubmitted).length === 2,
  'a draft does not count as a submission'
);

/* ---- The applicant's copy of the address ------------------------------- */

const from = {
  propertyAddress: '12 Elm Stret',
  unit: '2',
  propertyTown: 'Needham',
  propertyState: 'MA',
  propertyZip: '02492',
  label: '12 Elm Stret · Unit 2, Needham, MA 02492',
};
const to = { ...from, propertyAddress: '12 Elm St', unit: '3' };

const seeded = retargetTenancy({ propertyAddress: '12 Elm Stret, Needham, MA 02492', unit: '2' }, from, to);
ok(
  seeded?.propertyAddress === '12 Elm St, Needham, MA 02492' && seeded.unit === '3',
  'what the link put there moves with the link, unit included'
);

const legacy = retargetTenancy(
  { propertyAddress: '12 Elm Stret · Unit 2, Needham, MA 02492', unit: '2' },
  from,
  to
);
ok(legacy?.propertyAddress === '12 Elm St, Needham, MA 02492', 'so does the older shape, unit in the line');

const ownUnit = retargetTenancy({ propertyAddress: '12 elm stret, needham, MA 02492', unit: '2B' }, from, to);
ok(
  ownUnit?.propertyAddress === '12 Elm St, Needham, MA 02492' && ownUnit.unit === '2B',
  'a unit the applicant changed stays theirs'
);

ok(
  retargetTenancy({ propertyAddress: '14 Elm Street, Needham', unit: '2' }, from, to) === null,
  'an address the applicant wrote themselves is never touched'
);
ok(
  retargetTenancy({ propertyAddress: '', unit: '' }, from, to) === null,
  'an empty one is left for their form to fill from the corrected link'
);
ok(
  retargetTenancy({ propertyAddress: '12 Elm St, Needham, MA 02492', unit: '3' }, to, to) === null,
  'nothing to move is reported as nothing'
);

if (failures > 0) {
  console.error(`\n${failures} failed`);
  process.exit(1);
}
console.log('\nall passed');
