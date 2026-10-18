/**
 * A rental property as the admin and the applicant see it: one line of
 * address, the key that says two records are the same unit, and the grouping
 * /admin/applications is built from.
 *
 * Its own module, and pure — no Supabase, no zod — so that
 * `node scripts/applications-check.ts` can run it. What it decides is the thing
 * Kevin reads every day: which applications sit together under one address, in
 * what order, and where a link goes once its address has been corrected.
 * rentalApplication.ts re-exports all of it, so nothing that imported these from
 * there had to change.
 */
import type { RentalApplicationRecord, RentalInviteRecord } from './rentalApplication';
import { formatStreet } from './massgis.ts';

/**
 * The property as one line, from whatever parts are present.
 *
 * ONE formatter, used by the admin list, the applicant's "Applying for" card,
 * the invite label and the seeded tenancy address. Three hand-composed template
 * strings is how `formatPrice` ended up as three private copies that had already
 * drifted — and here a drift would show the applicant a different address than
 * the admin thinks they sent.
 *
 * Absent parts are omitted rather than placeheld, so an invite created before
 * town/state/zip existed still reads as the street line it always was.
 */
export interface PropertyParts {
  propertyAddress?: string | null;
  unit?: string | null;
  propertyTown?: string | null;
  propertyState?: string | null;
  propertyZip?: string | null;
}

export const formatProperty = (p: PropertyParts, { withUnit = true } = {}): string => {
  const street = [p.propertyAddress?.trim(), withUnit && p.unit?.trim() && `Unit ${p.unit.trim()}`]
    .filter(Boolean)
    .join(' · ');
  const region = [p.propertyState?.trim(), p.propertyZip?.trim()].filter(Boolean).join(' ');
  const place = [p.propertyTown?.trim(), region].filter(Boolean).join(', ');
  return [street, place].filter(Boolean).join(', ');
};

/**
 * The tenancy section's address, for display.
 *
 * `tenancy` keeps the address and the unit as SEPARATE fields, so anything
 * showing both has to join them — and the unit belongs against the STREET, not
 * at the end of the line. Appending it produced two spellings of one address in
 * the same admin list, because what sits in `propertyAddress` depends on when
 * the row was seeded: the old seeding wrote the whole formatted property, unit
 * included, giving "42 Newman St · Unit 3, Malden, MA 02148", while the current
 * one writes the address without it and the unit was appended after the ZIP —
 * "42 Newman St, Malden, MA 02148 · Unit 3". Same unit, two renderings, and an
 * address that renders two ways is an address no list can group.
 *
 * So the unit is inserted after the first comma-separated part, which is the
 * street line in every shape this field has ever held, and skipped entirely when
 * the address already names it. Rows written before either fix read the same as
 * rows written today.
 */
export const formatTenancyAddress = (t: { propertyAddress?: string; unit?: string }): string => {
  const address = (t.propertyAddress ?? '').trim();
  const unit = (t.unit ?? '').trim();
  if (!unit) return address;
  // "unit 3" as a whole word, so "3" does not match the 3 in a street number.
  const named = new RegExp(`\\bunit\\s*${unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  if (named.test(address)) return address;
  if (!address) return `Unit ${unit}`;
  const [street, ...rest] = address.split(',');
  return [`${street.trim()} · Unit ${unit}`, ...rest.map((part) => part.trim())]
    .filter(Boolean)
    .join(', ');
};

/**
 * The properties already used, most recent first, for the reuse picker.
 *
 * Keyed on street + unit + town rather than on the formatted line, so an invite
 * that recorded no zip still matches the same unit entered later with one — the
 * point is to stop the admin retyping an address, not to demand they retype it
 * identically.
 */
export interface PreviousProperty extends PropertyParts {
  key: string;
  monthlyRent: number | null;
  label: string;
}

/**
 * What makes two records the same property: street + unit + town. State and ZIP
 * are deliberately left out — see `previousProperties` — and so is the
 * formatted line, which changes shape with whatever parts happen to be present.
 *
 * The street is compared the way the USPS would write it, not as typed. Kevin
 * corrects a wrong address by typing it again (2026-10-18), and the correction
 * only joins the other applications for that unit if "12 Elm Street." and the
 * "12 Elm St" MassGIS filled in last time are one key. So punctuation goes, the
 * suffix is abbreviated by the same table the address suggestions use, and a
 * unit's own "#" or "Unit" is dropped: "#3", "Unit 3" and "3" are one unit.
 */
const streetKey = (street: string): string =>
  formatStreet(street.replace(/[.,]/g, ' ')).toLowerCase();

const unitKey = (unit: string): string =>
  unit
    .trim()
    .replace(/^(?:unit|apt|apartment|#)\.?\s*#?\s*/i, '')
    .toLowerCase();

export const propertyKey = (p: PropertyParts): string =>
  [streetKey(p.propertyAddress ?? ''), unitKey(p.unit ?? ''), (p.propertyTown ?? '').trim().toLowerCase()]
    .join('|');

/** The address parts of a link, for the forms that edit them. */
export const propertyOfInvite = (invite: RentalInviteRecord): PropertyParts => ({
  propertyAddress: invite.propertyAddress,
  unit: invite.unit,
  propertyTown: invite.propertyTown,
  propertyState: invite.propertyState,
  propertyZip: invite.propertyZip,
});

/**
 * An application's own copy of the address, moved with its link — or null when
 * it is not the link's to move.
 *
 * Opening a link copies the property into the applicant's tenancy section
 * (`seedFromInvite`), and the PDF and the application's own page read that copy.
 * So correcting a link's address alone would leave every application already
 * started on it still naming the wrong street. But that copy is a field on the
 * applicant's form, and they may have corrected it themselves; their own words
 * are not ours to overwrite. So the address moves only while it still says what
 * the link put there — in any of the shapes seeding has written over time: the
 * address without the unit (now), the address with it (before 2026-09-13), or
 * the link's label (before the address had fields). The unit moves with it,
 * unless the applicant changed that one. An empty address is left empty: the
 * applicant's form fills it from the corrected link the next time it opens.
 */
export const retargetTenancy = <T extends { propertyAddress?: string; unit?: string }>(
  tenancy: T,
  from: PropertyParts & { label?: string | null },
  to: PropertyParts
): T | null => {
  const same = (a: string, b: string) =>
    a.trim().replace(/\s+/g, ' ').toLowerCase() === b.trim().replace(/\s+/g, ' ').toLowerCase();
  const seeded = [formatProperty(from, { withUnit: false }), formatProperty(from), from.label ?? '']
    .filter(Boolean);

  if (!seeded.some((s) => same(s, tenancy.propertyAddress ?? ''))) return null;

  const next = {
    ...tenancy,
    propertyAddress: formatProperty(to, { withUnit: false }),
    unit: same(tenancy.unit ?? '', from.unit ?? '') ? (to.unit ?? '').trim() : tenancy.unit,
  };
  return next.propertyAddress === tenancy.propertyAddress && next.unit === tenancy.unit ? null : next;
};

export const previousProperties = (invites: RentalInviteRecord[]): PreviousProperty[] => {
  const seen = new Map<string, PreviousProperty>();
  for (const invite of invites) {
    if (!invite.propertyAddress) continue;
    const key = propertyKey(invite);
    // First wins: listInvites() is newest-first, so the most recent entry for a
    // property is the one whose rent and spelling are offered back.
    if (seen.has(key)) continue;
    seen.set(key, {
      key,
      propertyAddress: invite.propertyAddress,
      unit: invite.unit,
      propertyTown: invite.propertyTown,
      propertyState: invite.propertyState,
      propertyZip: invite.propertyZip,
      monthlyRent: invite.monthlyRent,
      label: formatProperty(invite),
    });
  }
  return [...seen.values()];
};

/**
 * Everything on /admin/applications, organised by the property it is about.
 *
 * The page used to be two flat lists — every application, then every link —
 * which is the order things arrived in and not the order anyone thinks in: the
 * question at a desk is "who has applied for Newman Street", and answering it
 * meant reading the Property column of every row.
 *
 * AN APPLICATION TAKES ITS PROPERTY FROM ITS INVITE, not from what the
 * applicant typed. `tenancy.propertyAddress` is an editable field on their
 * form, so two people applying for the same unit can spell it two ways and
 * would land in two groups; the invite is the admin's own record of what the
 * link was for, and it is structured. The typed address is the fallback only
 * for an application whose invite is gone.
 *
 * THE PROPERTY WITH THE LATEST SUBMITTED APPLICATION COMES FIRST (Kevin,
 * 2026-10-18: "the person who submitted last, the property should be on the
 * top"). A property nobody has submitted for yet comes after every one that has,
 * newest link first — sending a link is not news in the way an application is,
 * and sorting the two together let a link created this morning push yesterday's
 * application down the page. The page shows the two runs under two headings.
 */
export interface PropertyGroup {
  key: string;
  /** One line, from `formatProperty`. Empty for the "no property" group. */
  label: string;
  applications: RentalApplicationRecord[];
  invites: RentalInviteRecord[];
  /** ISO timestamp of the most recent application or link here. */
  latest: string;
  /** When the most recent application here was SUBMITTED. Null if none has been. */
  lastSubmitted: string | null;
}

const receivedAt = (r: RentalApplicationRecord) => r.submittedAt ?? r.createdAt;

export const groupByProperty = (
  applications: RentalApplicationRecord[],
  invites: RentalInviteRecord[]
): PropertyGroup[] => {
  const groups = new Map<string, PropertyGroup>();
  const group = (key: string, label: string): PropertyGroup => {
    let g = groups.get(key);
    if (!g) {
      g = { key, label, applications: [], invites: [], latest: '', lastSubmitted: null };
      groups.set(key, g);
    }
    return g;
  };
  const touch = (g: PropertyGroup, at: string) => {
    if (at > g.latest) g.latest = at;
  };

  const inviteGroup = (invite: RentalInviteRecord) =>
    invite.propertyAddress?.trim()
      ? group(propertyKey(invite), formatProperty(invite))
      : // A link made before the address was its own field has only a label.
        group(`label:${(invite.label ?? '').trim().toLowerCase()}`, invite.label?.trim() ?? '');

  const byId = new Map(invites.map((invite) => [invite.id, invite]));

  for (const invite of invites) {
    const g = inviteGroup(invite);
    g.invites.push(invite);
    touch(g, invite.createdAt);
  }

  for (const application of applications) {
    const invite = application.inviteId ? byId.get(application.inviteId) : undefined;
    let g: PropertyGroup;
    if (invite) {
      g = inviteGroup(invite);
    } else {
      const typed = formatTenancyAddress(application.data.tenancy);
      g = group(`typed:${typed.toLowerCase().replace(/\s+/g, ' ')}`, typed);
    }
    g.applications.push(application);
    touch(g, receivedAt(application));
    const sent = application.submittedAt;
    if (sent && (!g.lastSubmitted || sent > g.lastSubmitted)) g.lastSubmitted = sent;
  }

  for (const g of groups.values()) {
    g.applications.sort((a, b) => receivedAt(b).localeCompare(receivedAt(a)));
    g.invites.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return [...groups.values()].sort((a, b) =>
    a.lastSubmitted || b.lastSubmitted
      ? (b.lastSubmitted ?? '').localeCompare(a.lastSubmitted ?? '')
      : b.latest.localeCompare(a.latest)
  );
};
