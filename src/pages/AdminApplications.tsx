/**
 * /admin/applications — invites and submitted applications.
 *
 * THREE VIEWS, ONE ROUTE:
 *   - the list: one row per PROPERTY (see groupByProperty), the one with the
 *     latest submitted application first, under two headings — properties with
 *     applications in, and properties still waiting for one;
 *   - `?property=<key>`: one property — its applications and the links handed
 *     out for it, and where its address is corrected;
 *   - `?id=<uuid>`: one application, read-only, using the SAME
 *     RentalApplicationForm the applicant filled in — so the admin's copy cannot
 *     quietly omit a field the form collects.
 *
 * It was every property's applications and links on one page, one card each
 * (until 2026-10-18), which was fine at three properties and is a long scroll at
 * thirty: Kevin asked for the properties as rows, the latest on top, each opening
 * its own page.
 *
 * Like /rentals, the views are query params rather than dynamic segments: a
 * /admin/applications/:id route could not be prerendered and would need its own
 * rewrite in vercel.json, and that file has exactly two scoped rewrites for a
 * reason.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Copy,
  FileSignature,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Plus,
  X,
} from 'lucide-react';
import AdminShell, { ADMIN_BUTTON, AdminCard, adminActionClass } from '@/components/AdminShell';
import AdminList, { type AdminColumn } from '@/components/admin/AdminList';
import RentalApplicationForm from '@/components/rental/RentalApplicationForm';
import StatusBadge from '@/components/rental/StatusBadge';
import DownloadPdfButton from '@/components/rental/DownloadPdfButton';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import AddressAutocomplete from '@/components/admin/AddressAutocomplete';
import type { AddressSuggestion } from '@/lib/massgis';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useViewScroll } from '@/hooks/useViewScroll';
import { sentenceList } from '@/lib/utils';
import { SITE } from '@/lib/siteConfig';
import {
  APPLICATION_FORMS,
  APPLICATION_STATUSES,
  STATUS_TONE,
  createInvite,
  formatProperty,
  formatTenancyAddress,
  groupByProperty,
  inviteState,
  inviteUrl,
  listApplications,
  listInvites,
  moveApplicationAddress,
  previousProperties,
  propertyKey,
  propertyOfInvite,
  revokeInvite,
  sendInvite,
  setApplicationStatus,
  STATUS_LABEL,
  updateInviteProperty,
  type ApplicationForm,
  type ApplicationStatus,
  type PreviousProperty,
  type PropertyGroup,
  type PropertyParts,
  type PropertyPartsInput,
  type RentalApplicationRecord,
  type RentalInviteRecord,
} from '@/lib/rentalApplication';

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

/** "Nov 1, 2026" from the "2026-11-01" a date field stores, read in UTC so it never slips a day. */
const shortDay = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

const STATE_TONE: Record<string, string> = {
  live: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  started: 'bg-blue-50 text-blue-800 border-blue-200',
  expired: 'bg-gray-100 text-gray-600 border-gray-200',
  revoked: 'bg-red-50 text-red-800 border-red-200',
};

const STATE_LABEL: Record<string, string> = {
  live: 'Not opened',
  started: 'Started',
  expired: 'Expired',
  revoked: 'Revoked',
};

/** The small text buttons on a link's row. `py-1` so a thumb can hit one. */
const ROW_ACTION =
  'inline-flex items-center gap-1.5 py-1 text-xs font-medium text-champagne-ink hover:underline disabled:opacity-60';

const fullName = (r: RentalApplicationRecord) =>
  `${r.applicantFirstName ?? ''} ${r.applicantLastName ?? ''}`.trim();

/* ------------------------------------------------------------------ */
/* The address fields                                                  */
/* ------------------------------------------------------------------ */

const blankProperty = (): PropertyPartsInput => ({
  propertyAddress: '',
  unit: '',
  propertyTown: '',
  // Every property on this site is in Massachusetts; it is still a field
  // rather than a constant because the relocation work is cross-border.
  propertyState: 'MA',
  propertyZip: '',
});

const draftOf = (p: PropertyParts): PropertyPartsInput => ({
  propertyAddress: p.propertyAddress ?? '',
  unit: p.unit ?? '',
  propertyTown: p.propertyTown ?? '',
  propertyState: p.propertyState ?? 'MA',
  propertyZip: p.propertyZip ?? '',
});

/**
 * Street, unit, town, state, ZIP — and a picker of the properties already used.
 *
 * ONE SET OF FIELDS for the two things that write an address: a new link, and
 * the correction of a wrong one. Two copies is how the correction would end up
 * missing the MassGIS suggestions, and an address typed by hand is exactly how
 * the wrong one got there.
 *
 * Rendered as grid children: the form around it owns the two-column grid.
 */
const PropertyFields = ({
  idPrefix,
  value,
  onChange,
  previous,
  reuseLabel,
  reuseHint,
  onReuse,
}: {
  idPrefix: string;
  value: PropertyPartsInput;
  onChange: (next: PropertyPartsInput) => void;
  /** Properties already used. The picker is left out when there are none. */
  previous: PreviousProperty[];
  reuseLabel: string;
  reuseHint: string;
  /** Picking one. Fills the fields unless the parent wants more than that. */
  onReuse?: (choice: PreviousProperty) => void;
}) => {
  /*
   * The building's unit range, when MassGIS knows it ("#1-12"). Shown under the
   * Unit field as a hint and never written into it: a range says the building
   * has units, not which one is being let.
   */
  const [unitHint, setUnitHint] = useState<string | null>(null);
  const unitRef = useRef<HTMLInputElement>(null);

  // The form was emptied after a save, so the hint is for nothing on screen.
  useEffect(() => {
    if (!value.propertyAddress) setUnitHint(null);
  }, [value.propertyAddress]);

  const set = (k: keyof PropertyPartsInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [k]: e.target.value });

  /** A MassGIS suggestion was picked: fill everything it knows. */
  const applyAddress = (s: AddressSuggestion) => {
    onChange({
      ...value,
      propertyAddress: s.street,
      propertyTown: s.town,
      propertyState: s.state,
      propertyZip: s.zip,
    });
    setUnitHint(s.unitHint);
    // A multi-unit building needs a unit, so that is where the cursor goes next.
    if (s.unitHint) window.setTimeout(() => unitRef.current?.focus(), 0);
  };

  const reuse = (choice: PreviousProperty) => {
    setUnitHint(null);
    if (onReuse) onReuse(choice);
    else onChange(draftOf(choice));
  };

  return (
    <>
      {previous.length > 0 && (
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-reuse`}>{reuseLabel}</Label>
          <NativeSelect
            id={`${idPrefix}-reuse`}
            value=""
            onChange={(e) => {
              const choice = previous.find((p) => p.key === e.target.value);
              if (choice) reuse(choice);
            }}
            className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-ink focus:border-champagne focus:outline-none focus:ring-1 focus:ring-champagne"
          >
            <option value="">Choose a property…</option>
            {previous.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </NativeSelect>
          <p className="text-xs text-gray-500">{reuseHint}</p>
        </div>
      )}

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-address`}>Street address</Label>
        <AddressAutocomplete
          id={`${idPrefix}-address`}
          required
          placeholder="Start typing — 151 wash…"
          value={value.propertyAddress}
          onChange={(v) => {
            setUnitHint(null);
            onChange({ ...value, propertyAddress: v });
          }}
          onSelect={applyAddress}
        />
        <p className="text-xs text-gray-500">
          Pick a suggestion to fill in the town and ZIP as well.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-unit`}>Unit</Label>
        <Input
          ref={unitRef}
          id={`${idPrefix}-unit`}
          autoComplete="off"
          value={value.unit}
          onChange={set('unit')}
          aria-describedby={unitHint ? `${idPrefix}-unit-hint` : undefined}
        />
        {unitHint && (
          <p id={`${idPrefix}-unit-hint`} className="numeral text-xs text-gray-500">
            This building has units {unitHint}.
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-town`}>Town</Label>
        <Input
          id={`${idPrefix}-town`}
          autoComplete="off"
          placeholder="Needham"
          value={value.propertyTown}
          onChange={set('propertyTown')}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-state`}>State</Label>
        <Input
          id={`${idPrefix}-state`}
          autoComplete="off"
          maxLength={2}
          className="uppercase"
          value={value.propertyState}
          onChange={set('propertyState')}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-zip`}>ZIP code</Label>
        <Input
          id={`${idPrefix}-zip`}
          // Not inputMode="numeric": a leading zero is exactly what a numeric
          // field eats, and 8 of 10 ZIPs on this site start with one.
          autoComplete="off"
          maxLength={10}
          placeholder="02492"
          value={value.propertyZip}
          onChange={set('propertyZip')}
        />
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* New invite                                                          */
/* ------------------------------------------------------------------ */

/** The most applicants one press of the button invites. Roommates, not a mailing list. */
const MAX_INVITEES = 6;

/**
 * ONE FORM, ONE LINK PER APPLICANT.
 *
 * A unit is often let to two or three people, and each of them is an applicant:
 * their own income, their own references, their own signature on the consents.
 * So several addresses here do not share a link — an invite is claimed by the
 * first account that opens it and is `{valid:false}` to everyone after, which is
 * the point of it. Each address gets its own invite and its own email, all for
 * the same property, and they arrive together under that property because an
 * application takes its property from its invite (see groupByProperty).
 */
const NewInviteForm = ({
  onCreated,
  onFinished,
  previous,
  initial,
}: {
  /** Links that now exist — possibly fewer than were asked for. */
  onCreated: (invites: RentalInviteRecord[]) => void;
  /** Every address has its link, so the form can close. Given the property's key. */
  onFinished: (key: string) => void;
  /** Properties already used, for the reuse picker. */
  previous: PreviousProperty[];
  /** Where to start: the property whose page the form was opened on. */
  initial?: { property: PropertyPartsInput; monthlyRent: string };
}) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [property, setProperty] = useState<PropertyPartsInput>(
    () => initial?.property ?? blankProperty()
  );
  const [terms, setTerms] = useState({
    monthlyRent: initial?.monthlyRent ?? '',
    expiresInDays: '30',
  });
  /** The full application, or documents only. Every link this press makes asks for the same one. */
  const [form, setForm] = useState<ApplicationForm>('full');
  /*
   * The addresses, one per applicant. Rows carry a key of their own because
   * they can be removed from the middle: keyed on position, the row after a
   * removed one would inherit its input — and its focus.
   */
  const nextKey = useRef(1);
  const [emails, setEmails] = useState([{ key: 0, value: '' }]);
  const setEmail = (key: number, value: string) =>
    setEmails((rows) => rows.map((r) => (r.key === key ? { ...r, value } : r)));

  const setTerm = (k: keyof typeof terms) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setTerms((p) => ({ ...p, [k]: e.target.value }));

  /** Fills the property fields from one already used, leaving the emails alone. */
  const reuse = (choice: PreviousProperty) => {
    setProperty(draftOf(choice));
    // The rent as it was last time, which is a starting point and not a
    // decision — it is the field most likely to have changed between tenants.
    setTerms((p) => ({
      ...p,
      monthlyRent: p.monthlyRent || (choice.monthlyRent != null ? String(choice.monthlyRent) : ''),
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    // Once each, whatever the capitals: the same address twice is two links for
    // one person, and the second would sit "Not opened" in the list for ever.
    const recipients = [
      ...new Set(emails.map((r) => r.value.trim().toLowerCase()).filter(Boolean)),
    ];
    if (recipients.length === 0) return;

    setBusy(true);
    const created: RentalInviteRecord[] = [];
    const mailed: string[] = [];
    const notMailed: string[] = [];
    const notCreated: string[] = [];

    // One at a time, on purpose. Each address is an invite AND an email; in
    // parallel a failure halfway leaves no telling which links exist.
    for (const email of recipients) {
      let invite: RentalInviteRecord;
      try {
        invite = await createInvite({
          // The label is what the applicant sees above the form. Derived from
          // the address rather than asked for separately: two fields that say
          // the same thing is how they drift apart. formatProperty is the one
          // place an address becomes a line, so the label cannot drift from
          // the list.
          label: formatProperty(property),
          ...property,
          monthlyRent: terms.monthlyRent,
          inviteeEmail: email,
          form,
          expiresInDays: Number(terms.expiresInDays) || 0,
        });
      } catch (err) {
        console.error('Could not create invite:', err);
        notCreated.push(email);
        continue;
      }
      // Emailed straight away: the address is required, so a created link that
      // never went out is a link the admin has to remember to send by hand.
      try {
        await sendInvite(invite.id);
        mailed.push(email);
        created.push({ ...invite, sentAt: new Date().toISOString() });
      } catch (mailErr) {
        console.error('Could not email the invite:', mailErr);
        notMailed.push(email);
        created.push(invite);
      }
    }
    setBusy(false);

    if (created.length > 0) onCreated(created);

    if (notCreated.length > 0) {
      // The property stays filled in and only the addresses that got no link
      // stay on the form, so pressing the button again finishes the job
      // without inviting the others twice.
      setEmails(notCreated.map((value) => ({ key: nextKey.current++, value })));
      toast({
        variant: 'destructive',
        title:
          created.length > 0
            ? `No link was created for ${sentenceList(notCreated)}`
            : 'Could not create the link',
        description:
          created.length > 0
            ? 'The others have been made. Press the button again to retry.'
            : 'Please try again.',
      });
      return;
    }

    const key = propertyKey(property);
    setProperty(blankProperty());
    setTerms({ monthlyRent: '', expiresInDays: '30' });
    setEmails([{ key: nextKey.current++, value: '' }]);
    onFinished(key);
    toast(
      notMailed.length === 0
        ? {
            title: mailed.length === 1 ? 'Link sent' : `${mailed.length} links sent`,
            description:
              mailed.length === 1
                ? `Emailed to ${mailed[0]}.`
                : `Each of ${sentenceList(mailed)} has their own link.`,
          }
        : {
            variant: 'destructive',
            title:
              recipients.length === 1
                ? 'Link created, but the email did not send'
                : `The email to ${sentenceList(notMailed)} did not send`,
            description: 'Copy the link and send it yourself, or use Resend email.',
          }
    );
  };

  return (
    <form onSubmit={submit} className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
      {/* Reuse first: re-letting the same unit is the common case, and it
          brings the rent with it. For a property not let before, the street
          field suggests from MassGIS — which serves the same purpose this
          picker was built for, since both hand back one canonical spelling
          rather than letting "12 Elm St" and "12 Elm Street" become two
          properties no list can group. */}
      <PropertyFields
        idPrefix="inv"
        value={property}
        onChange={setProperty}
        previous={previous}
        reuseLabel="Reuse a property"
        reuseHint="Fills the fields below. Everything stays editable, and the rent is last time’s."
        onReuse={reuse}
      />
      <div className="space-y-1.5">
        <Label htmlFor="inv-rent">Monthly rent</Label>
        <Input id="inv-rent" inputMode="decimal" value={terms.monthlyRent} onChange={setTerm('monthlyRent')} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="inv-expiry">Expires in (days)</Label>
        <Input
          id="inv-expiry"
          inputMode="numeric"
          value={terms.expiresInDays}
          onChange={setTerm('expiresInDays')}
        />
        <p className="text-xs text-gray-500">0 for no expiry.</p>
      </div>

      {/* What the link asks for (Kevin, 2026-10-29). Two cards rather than a
          dropdown: the difference is a sentence long, and both sentences should
          be on screen when choosing. */}
      <fieldset className="sm:col-span-2">
        <legend className="mb-2 text-sm font-medium leading-none text-ink">What they fill in</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {APPLICATION_FORMS.map((option) => (
            <label
              key={option.id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                form === option.id ? 'border-champagne bg-bone' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="inv-form"
                value={option.id}
                checked={form === option.id}
                onChange={() => setForm(option.id)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-champagne-ink"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">{option.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-gray-600">{option.blurb}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Last and full width: it is the one part of this form that grows. */}
      <fieldset className="space-y-2 sm:col-span-2">
        <legend className="mb-1.5 text-sm font-medium leading-none text-ink">
          {emails.length > 1 ? 'Applicant emails' : 'Applicant email'}
        </legend>
        {emails.map((row, i) => (
          <div key={row.key} className="flex items-center gap-2">
            <Input
              id={`inv-email-${row.key}`}
              type="email"
              // Only the first: a second row left empty is simply not sent to.
              required={i === 0}
              autoComplete="off"
              placeholder={i === 0 ? 'applicant@example.com' : 'Another applicant'}
              aria-label={emails.length > 1 ? `Applicant ${i + 1} email` : 'Applicant email'}
              value={row.value}
              onChange={(e) => setEmail(row.key, e.target.value)}
              className="sm:max-w-md"
            />
            {emails.length > 1 && (
              <button
                type="button"
                onClick={() => setEmails((rows) => rows.filter((r) => r.key !== row.key))}
                aria-label={`Remove ${row.value.trim() || `applicant ${i + 1}`}`}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-bone hover:text-red-700"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        ))}
        {emails.length < MAX_INVITEES && (
          <button
            type="button"
            onClick={() => setEmails((rows) => [...rows, { key: nextKey.current++, value: '' }])}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-champagne-ink hover:underline"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add another applicant
          </button>
        )}
        <p className="text-xs text-gray-500">
          {emails.length > 1
            ? form === 'documents'
              ? 'Each person is emailed their own link and sends their own documents. They appear together under this property.'
              : 'Each person is emailed their own link and fills in their own application. They appear together under this property.'
            : 'The link is emailed here, and prefills their application.'}
        </p>
      </fieldset>

      <div className="sm:col-span-2">
        <button type="submit" disabled={busy} className={ADMIN_BUTTON}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Plus className="h-4 w-4" aria-hidden />
          )}
          {emails.filter((r) => r.value.trim()).length > 1
            ? 'Create application links'
            : 'Create application link'}
        </button>
      </div>
    </form>
  );
};

/* ------------------------------------------------------------------ */
/* Correcting an address                                               */
/* ------------------------------------------------------------------ */

interface AddressSaved {
  invites: RentalInviteRecord[];
  /** Applications whose own copy of the address moved with their link. */
  applications: RentalApplicationRecord[];
  /** The property's key from the address as saved. */
  key: string;
}

/**
 * The address of a property's links, or of one link, corrected.
 *
 * Kevin types an address wrong now and then, and a wrong address is a property
 * of its own in the list, apart from the applications for the real one
 * (2026-10-18). Saving the right address files the link with them: grouping is
 * by address (propertyKey), so there is nothing to merge — the next render IS
 * the merge. Picking the property from the list is the surest way to match it,
 * since that is its spelling exactly; typed, the key still forgives "Street"
 * for "St".
 *
 * The applications started on these links move too, where their copy of the
 * address is still the one the link gave them — see retargetTenancy.
 */
const AddressEditor = ({
  invites,
  applications,
  previous,
  scope,
  onSaved,
  onCancel,
}: {
  /** The links being corrected — every link of a property, or one. */
  invites: RentalInviteRecord[];
  /** Every application, so the ones on these links can be moved with them. */
  applications: RentalApplicationRecord[];
  previous: PreviousProperty[];
  /** One sentence: what saving changes. */
  scope: string;
  onSaved: (saved: AddressSaved) => void;
  onCancel: () => void;
}) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [value, setValue] = useState<PropertyPartsInput>(() => {
    const first = invites[0];
    // A link made before the address had fields has only its label, which is
    // the nearest thing to a street line it has.
    return first?.propertyAddress?.trim()
      ? draftOf(propertyOfInvite(first))
      : { ...blankProperty(), propertyAddress: first?.label ?? '' };
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !value.propertyAddress.trim()) return;
    setBusy(true);
    // Typed by hand to a property already here ("12 Elm Street" for "12 Elm
    // St"): it joins that property either way, and takes its spelling too, so
    // the property's page does not read one way on one link and another on the
    // next. A part only the typed one has, a ZIP say, is kept.
    const match = previous.find((p) => p.key === propertyKey(value));
    const target: PropertyPartsInput = match
      ? (Object.fromEntries(
          Object.entries(draftOf(match)).map(([k, v]) => [
            k,
            v.trim() || value[k as keyof PropertyPartsInput],
          ])
        ) as PropertyPartsInput)
      : value;
    try {
      const saved = await updateInviteProperty(
        invites.map((i) => i.id),
        target
      );
      // One at a time, and each failure on its own: the links are already
      // corrected, so an application that could not be moved is a line to
      // report, not a reason to undo the rest.
      const moved: RentalApplicationRecord[] = [];
      let stuck = 0;
      for (const invite of invites) {
        for (const app of applications.filter((a) => a.inviteId === invite.id)) {
          try {
            const record = await moveApplicationAddress(
              app.id,
              { ...propertyOfInvite(invite), label: invite.label },
              target
            );
            if (record) moved.push(record);
          } catch (err) {
            console.error('Could not move the application address:', err);
            stuck += 1;
          }
        }
      }
      if (stuck > 0) {
        toast({
          variant: 'destructive',
          title: 'The address is saved, but not on every application',
          description: `${stuck} ${stuck === 1 ? 'application still shows' : 'applications still show'} the old address. Open it and use Edit answers.`,
        });
      }
      onSaved({ invites: saved, applications: moved, key: propertyKey(target) });
    } catch (err) {
      console.error('Could not change the address:', err);
      toast({ variant: 'destructive', title: 'Could not change the address', description: 'Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="grid gap-4 border-t border-gray-200 bg-gray-50/60 p-4 sm:grid-cols-2 sm:p-6">
      <p className="text-sm text-gray-700 sm:col-span-2">{scope}</p>
      <PropertyFields
        idPrefix={`fix-${invites[0]?.id ?? 'x'}`}
        value={value}
        onChange={setValue}
        previous={previous}
        reuseLabel="Same as a property already here"
        reuseHint="Pick it to use its address exactly, and this goes in with it."
      />
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={busy} className={ADMIN_BUTTON}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
          Save address
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-2 py-2 text-sm font-medium text-gray-600 hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

/* ------------------------------------------------------------------ */
/* Copyable link                                                       */
/* ------------------------------------------------------------------ */

const CopyLink = ({ token }: { token: string }) => {
  const [copied, setCopied] = useState(false);
  const url = inviteUrl(token);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard needs a secure context and a permission. Selecting the text
      // is the fallback that always works.
      window.prompt('Copy this link', url);
    }
  };

  return (
    <button type="button" onClick={copy} className={ROW_ACTION}>
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {copied ? 'Copied' : 'Copy link'}
    </button>
  );
};

/* ------------------------------------------------------------------ */
/* Resend the email                                                    */
/* ------------------------------------------------------------------ */

/**
 * The link is emailed when it is created; this is for the bounce, the typo
 * corrected in the address, or the applicant who deleted it. Copy link stays
 * alongside it as the fallback that needs nothing to be working.
 */
const ResendButton = ({
  invite,
  onSent,
}: {
  invite: RentalInviteRecord;
  onSent: (id: string) => void;
}) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await sendInvite(invite.id);
      onSent(invite.id);
      toast({ title: 'Email sent', description: `Sent to ${invite.inviteeEmail}.` });
    } catch (err) {
      console.error('Could not email the invite:', err);
      toast({
        variant: 'destructive',
        title: 'Could not send the email',
        description: err instanceof Error ? err.message : 'Please try again in a moment.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={send} disabled={busy} className={ROW_ACTION}>
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : (
        <Mail className="h-3.5 w-3.5" aria-hidden />
      )}
      {invite.sentAt ? 'Resend email' : 'Send email'}
    </button>
  );
};

/* ------------------------------------------------------------------ */
/* Lists                                                               */
/* ------------------------------------------------------------------ */

/** A property's page, as the query string the list links to. */
const propertyHref = (key: string) => `?${new URLSearchParams({ property: key }).toString()}`;

/**
 * The structured address of a property, from its newest link that has one —
 * the heading of its page, split so the street can be the big line.
 */
const headingOf = (g: PropertyGroup) => {
  const structured = g.invites.find((i) => i.propertyAddress?.trim());
  if (!structured) return { title: g.label || 'No property recorded', place: '' };
  return {
    title: formatProperty({ propertyAddress: structured.propertyAddress, unit: structured.unit }),
    place: formatProperty({
      propertyTown: structured.propertyTown,
      propertyState: structured.propertyState,
      propertyZip: structured.propertyZip,
    }),
  };
};

const PROPERTY_COLUMNS: AdminColumn[] = [
  { label: 'Property', primary: true },
  { label: 'Last application' },
  { label: 'Applications' },
  { label: 'Links' },
  { label: '', end: true },
];

/** The properties under one heading of the list. Each row opens its page. */
const PropertyRows = ({ groups, label }: { groups: PropertyGroup[]; label: string }) => (
  <AdminCard>
    <AdminList
      label={label}
      columns={PROPERTY_COLUMNS}
      grid="md:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.5fr)_1rem]"
      rows={groups.map((g) => {
        const latest = g.applications.find((a) => a.submittedAt === g.lastSubmitted);
        // Submitted and not yet moved on: what is waiting to be read.
        const unread = g.applications.filter((a) => a.status === 'submitted').length;
        return {
          key: g.key,
          to: propertyHref(g.key),
          cells: [
            <span key="p" className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-champagne-ink" aria-hidden />
              <span className="min-w-0">
                <span className="numeral block font-medium text-ink">
                  {g.label || 'No property recorded'}
                </span>
                <span className="numeral mt-0.5 block text-xs text-gray-500">
                  {latest
                    ? `Latest from ${fullName(latest) || latest.applicantEmail || 'an applicant'}`
                    : g.invites[0]
                      ? `Newest link ${shortDate(g.invites[0].createdAt)}`
                      : 'No link on record'}
                </span>
              </span>
            </span>,
            g.lastSubmitted ? shortDate(g.lastSubmitted) : 'None yet',
            <span key="a" className="inline-flex items-center gap-2">
              {g.applications.length}
              {unread > 0 && (
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE.submitted}`}
                >
                  {unread} new
                </span>
              )}
            </span>,
            g.invites.length,
            <ChevronRight key="c" className="hidden h-4 w-4 text-gray-400 md:block" aria-hidden />,
          ],
        };
      })}
    />
  </AdminCard>
);

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h2 className="numeral mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
    {children}
  </h2>
);

/* ------------------------------------------------------------------ */
/* Making a lease                                                      */
/* ------------------------------------------------------------------ */

/**
 * Choose who signs, and the lease is made in Kevin's paperwork app.
 *
 * The lease is the GBREB packet that app fills in and sends for signature, not
 * a document of this site's (Kevin, 2026-10-30). This page only says WHO: the
 * link carries the chosen application ids, and the app reads the address, the
 * rent and the applicants out of the database itself, under its own key — the
 * same way the site's functions take an id rather than the values.
 *
 * A list of checkboxes rather than a checkbox on each application's row: a row
 * in that list is one link, the whole row, and can hold no other control (see
 * AdminList). Those approved are ticked to start with — approving someone is
 * the decision a lease follows — and anyone can be ticked or unticked.
 *
 * Every application on the property is offered, drafts included: someone who
 * applied on another agency's paperwork and uploaded it may never press
 * Submit here, and is still the person signing.
 */
const LeasePicker = ({
  applications,
  onCancel,
}: {
  applications: RentalApplicationRecord[];
  onCancel: () => void;
}) => {
  const [chosen, setChosen] = useState<Set<string>>(
    () => new Set(applications.filter((a) => a.status === 'approved').map((a) => a.id))
  );

  const toggle = (id: string) =>
    setChosen((was) => {
      const next = new Set(was);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // In the order they are listed, which is the order they sign in.
  const ids = applications.filter((a) => chosen.has(a.id)).map((a) => a.id);
  const href = `${SITE.paperworkUrl}/#/from-website?apps=${ids.join(',')}`;

  return (
    <div className="p-4 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-champagne-ink">New lease</p>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        Choose who signs it. The lease is made in your paperwork app — the address and rent from this
        property’s link, the people and the move-in date from their applications — and opens there
        for you to finish. The paperwork app has to be running on your Mac.
      </p>
      <fieldset className="mt-4 space-y-2">
        <legend className="sr-only">Applicants on the lease</legend>
        {applications.map((a) => (
          <label
            key={a.id}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
              chosen.has(a.id) ? 'border-champagne bg-bone' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="checkbox"
              className="mt-0.5 h-5 w-5 shrink-0 accent-champagne-ink"
              checked={chosen.has(a.id)}
              onChange={() => toggle(a.id)}
            />
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-ink">{fullName(a) || 'No name yet'}</span>
              <span className="block break-words text-xs text-gray-500">
                {[
                  a.applicantEmail,
                  a.data.tenancy.desiredOccupancyDate &&
                    `moving in ${shortDay(a.data.tenancy.desiredOccupancyDate)}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </span>
            <StatusBadge status={a.status} />
          </label>
        ))}
      </fieldset>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {ids.length === 0 ? (
          <button type="button" className={ADMIN_BUTTON} disabled>
            <FileSignature className="h-4 w-4" aria-hidden />
            Choose who signs
          </button>
        ) : (
          // A new tab, so this page is still here when the lease is done.
          <a href={href} target="_blank" rel="noreferrer" className={ADMIN_BUTTON}>
            <FileSignature className="h-4 w-4" aria-hidden />
            {`Make the lease for ${ids.length} ${ids.length === 1 ? 'person' : 'people'}`}
          </a>
        )}
        <button type="button" onClick={onCancel} className={adminActionClass('ghost')}>
          Cancel
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AdminApplications() {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const openId = params.get('id');
  const openProperty = params.get('property');
  useViewScroll(`${openId ?? ''}|${openProperty ?? ''}`);

  const [invites, setInvites] = useState<RentalInviteRecord[]>([]);
  const [apps, setApps] = useState<RentalApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  /** Whose address is open for correcting: 'property' for all its links, or one link's id. */
  const [fixing, setFixing] = useState<string | null>(null);
  /**
   * Whether the open application is editable by the admin.
   *
   * Off by default, and that is the point: this is somebody else's document,
   * and a form that is live the moment it opens turns a stray keypress while
   * reading into a silent edit of a submitted application. The database already
   * permits it — `guard_submitted_rental_application` returns early for
   * `public.is_admin()`, so the freeze at submit was never the admin's — this is
   * the deliberate act of turning it on.
   */
  const [editing, setEditing] = useState(false);
  /** Whether the "who signs" list is open on the property's page. */
  const [choosingLease, setChoosingLease] = useState(false);

  const load = useCallback(async () => {
    try {
      const [i, a] = await Promise.all([listInvites(), listApplications()]);
      setInvites(i);
      setApps(a);
    } catch (err) {
      console.error('Could not load applications:', err);
      toast({
        variant: 'destructive',
        title: 'Could not load',
        description: 'Refresh the page to try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  // An open form belongs to the view it was opened on.
  useEffect(() => {
    setShowNew(false);
    setFixing(null);
    setChoosingLease(false);
  }, [openId, openProperty]);

  /** Which invites have an application against them. */
  const claimedInvites = useMemo(
    () => new Set(apps.map((a) => a.inviteId).filter(Boolean) as string[]),
    [apps]
  );

  /** The properties already invited on, newest first, for the reuse pickers. */
  const previous = useMemo(() => previousProperties(invites), [invites]);

  /** The list view: one group per property. See groupByProperty. */
  const groups = useMemo(() => groupByProperty(apps, invites), [apps, invites]);

  const changeStatus = async (id: string, status: ApplicationStatus) => {
    // Optimistic: the select should not sit on the old value while a round trip
    // completes. Reverted from the server copy if the write fails.
    const previous = apps;
    setApps((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await setApplicationStatus(id, status);
    } catch (err) {
      console.error('Could not change status:', err);
      setApps(previous);
      toast({ variant: 'destructive', title: 'Could not update the status' });
    }
  };

  const markSent = (id: string) =>
    setInvites((rows) =>
      rows.map((r) => (r.id === id ? { ...r, sentAt: new Date().toISOString() } : r))
    );

  const revoke = async (id: string) => {
    try {
      await revokeInvite(id);
      setInvites((rows) =>
        rows.map((r) => (r.id === id ? { ...r, revokedAt: new Date().toISOString() } : r))
      );
    } catch (err) {
      console.error('Could not revoke invite:', err);
      toast({ variant: 'destructive', title: 'Could not revoke the link' });
    }
  };

  /**
   * An address was corrected on the page of property `fromKey`. If that
   * property is now empty — every link on it moved — the page follows them to
   * where they went; otherwise it stays, one link fewer.
   */
  const addressSaved = (fromKey: string) => (saved: AddressSaved) => {
    const nextInvites = invites.map((r) => saved.invites.find((c) => c.id === r.id) ?? r);
    const nextApps = apps.map((r) => saved.applications.find((m) => m.id === r.id) ?? r);
    const joined = groups.find((g) => g.key === saved.key && g.key !== fromKey);
    setInvites(nextInvites);
    setApps(nextApps);
    setFixing(null);

    const moved = saved.applications.length;
    toast({
      title: joined ? `Now with ${joined.label}` : 'Address saved',
      description: [
        joined && 'It is filed with the other links and applications for that address.',
        moved > 0 &&
          `The address on ${moved} ${moved === 1 ? 'application' : 'applications'} moved with it.`,
      ]
        .filter(Boolean)
        .join(' ') || undefined,
    });

    const stillHere = groupByProperty(nextApps, nextInvites).some((g) => g.key === fromKey);
    if (!stillHere) setParams({ property: saved.key }, { replace: true });
  };

  /** Back from an application: drop out of edit mode and re-read what was written. */
  const closeApplication = (backTo: string | null) => {
    setEditing(false);
    setParams(backTo ? { property: backTo } : {}, { replace: true });
    // The form autosaves straight to the database, so the row in `apps` is
    // stale the moment anything was typed. Without this the list — and the next
    // application opened — would render the copy read before the edit.
    void load();
  };

  /* ---- One application --------------------------------------------- */
  if (openId) {
    const record = apps.find((r) => r.id === openId);
    const home = record ? groups.find((g) => g.applications.includes(record)) : undefined;
    return (
      <AdminShell
        title={record ? fullName(record) || 'Application' : 'Application'}
        description={
          record
            ? home?.label || formatTenancyAddress(record.data.tenancy) || undefined
            : undefined
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => closeApplication(home?.key ?? null)}
              className={adminActionClass('ghost')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
              {home ? 'Back to the property' : 'All properties'}
            </button>
            {record && (
              <button
                type="button"
                onClick={() => {
                  if (editing) void load();
                  setEditing((v) => !v);
                }}
                className={adminActionClass(editing ? 'primary' : 'ghost')}
              >
                {editing ? (
                  <>
                    <Check className="mr-2 h-4 w-4" aria-hidden />
                    Done editing
                  </>
                ) : (
                  <>
                    <Pencil className="mr-2 h-4 w-4" aria-hidden />
                    Edit answers
                  </>
                )}
              </button>
            )}
            {/* There is no Print button beside this. The browser's own dialog
                prints the page that is on screen, which can never include the
                attachments — two buttons producing two different PDFs of the
                same application is a choice nobody wants to have to make.
                Cmd-P still works for anyone who wants the page itself. */}
            {record && (
              <DownloadPdfButton record={record} className={adminActionClass('primary')} />
            )}
          </>
        }
      >
        {!record ? (
          <AdminCard>
            <p className="p-6 text-sm text-gray-600">
              {loading ? 'Loading…' : 'That application could not be found.'}
            </p>
          </AdminCard>
        ) : (
          <>
            <AdminCard className="mb-6 print:hidden">
              <div className="flex flex-wrap items-center gap-4 p-4 sm:p-6">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                    Contact
                  </p>
                  <p className="mt-1 break-words text-sm text-ink">
                    {record.applicantEmail}
                    {record.applicantPhone && ` · ${record.applicantPhone}`}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {record.submittedAt
                      ? `Submitted ${shortDate(record.submittedAt)}`
                      : `Started ${shortDate(record.createdAt)}`}
                    {record.form === 'documents' && ' · Documents only — their details and uploads'}
                  </p>
                </div>
                {/* `block` on the label: Radix renders a <label>, which is
                    inline, and a vertical margin on an inline element does
                    nothing — so space-y-1.5 could not separate them and the
                    select sat flush against the word "Status". */}
                <div className="space-y-1.5">
                  <Label htmlFor="app-status" className="block">
                    Status
                  </Label>
                  <NativeSelect
                    id="app-status"
                    value={record.status}
                    onChange={(e) => changeStatus(record.id, e.target.value as ApplicationStatus)}
                    className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-ink"
                  >
                    {APPLICATION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>
            </AdminCard>

            {editing && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 print:hidden">
                <strong className="font-semibold">You are editing this application.</strong>{' '}
                Changes save automatically, a couple of seconds after you stop typing, and the
                applicant will see them. There is no submit button here — submitting re-stamps
                the consent timestamps, and those are the record that a named person authorised
                a named version, so only they can do it.
              </div>
            )}

            {/* The applicant's own form. One rendering of an application on this
                site, so the admin copy cannot omit a field the form collects —
                which also means correcting a typo happens in the same document
                the applicant filled in, not in a second admin-only editor that
                would have to be kept in step with it. */}
            <RentalApplicationForm
              applicationId={record.id}
              initial={record.data}
              readOnly={!editing}
              showSubmit={false}
              adminDocuments
              form={record.form}
            />
          </>
        )}
      </AdminShell>
    );
  }

  /* ---- One property ------------------------------------------------- */
  if (openProperty) {
    const group = groups.find((g) => g.key === openProperty);
    const heading = group ? headingOf(group) : null;
    const newest = group?.invites[0];
    const rent = group?.invites.find((i) => i.monthlyRent != null)?.monthlyRent ?? null;
    // Picking the property itself would change nothing.
    const others = previous.filter((p) => p.key !== openProperty);

    return (
      <AdminShell
        title={heading?.title ?? 'Property'}
        description={
          [heading?.place, rent != null && `$${Number(rent).toLocaleString()} a month`]
            .filter(Boolean)
            .join(' · ') || undefined
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => setParams({})}
              className={adminActionClass('ghost')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
              All properties
            </button>
            {group && group.invites.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowNew(false);
                  setFixing((v) => (v === 'property' ? null : 'property'));
                }}
                className={adminActionClass('ghost')}
              >
                <Pencil className="mr-2 h-4 w-4" aria-hidden />
                Change address
              </button>
            )}
            {group && group.applications.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFixing(null);
                  setShowNew(false);
                  setChoosingLease((v) => !v);
                }}
                aria-expanded={choosingLease}
                className={adminActionClass('ghost')}
              >
                <FileSignature className="mr-2 h-4 w-4" aria-hidden />
                New lease
              </button>
            )}
            {group && (
              <button
                type="button"
                onClick={() => {
                  setFixing(null);
                  setChoosingLease(false);
                  setShowNew((v) => !v);
                }}
                className={adminActionClass('primary')}
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden />
                New link
              </button>
            )}
          </>
        }
      >
        {!group ? (
          <AdminCard>
            <p className="p-6 text-sm text-gray-600">
              {loading ? 'Loading…' : 'Nothing is filed under that address any more.'}
            </p>
          </AdminCard>
        ) : (
          <div className="space-y-8">
            {fixing === 'property' && (
              <AdminCard>
                <AddressEditor
                  invites={group.invites}
                  applications={apps}
                  previous={others}
                  scope={
                    group.invites.length === 1
                      ? 'Changes the address on this property’s link.'
                      : `Changes the address on all ${group.invites.length} of this property’s links.`
                  }
                  onSaved={addressSaved(group.key)}
                  onCancel={() => setFixing(null)}
                />
              </AdminCard>
            )}

            {showNew && (
              <AdminCard>
                <NewInviteForm
                  previous={previous}
                  initial={
                    newest?.propertyAddress?.trim()
                      ? {
                          property: draftOf(propertyOfInvite(newest)),
                          monthlyRent: rent != null ? String(rent) : '',
                        }
                      : undefined
                  }
                  onCreated={(created) => setInvites((rows) => [...created, ...rows])}
                  onFinished={(key) => {
                    setShowNew(false);
                    if (key !== group.key) setParams({ property: key });
                  }}
                />
              </AdminCard>
            )}

            {choosingLease && (
              <AdminCard>
                <LeasePicker
                  applications={group.applications}
                  onCancel={() => setChoosingLease(false)}
                />
              </AdminCard>
            )}

            <section>
              <SectionHeading>Applications ({group.applications.length})</SectionHeading>
              <AdminCard>
                {group.applications.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-gray-600 sm:px-6">No application yet.</p>
                ) : (
                  <AdminList
                    label="Applications"
                    columns={[
                      { label: 'Applicant', primary: true },
                      { label: 'Received' },
                      { label: 'Status' },
                      { label: '', end: true },
                    ]}
                    grid="md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_1rem]"
                    rows={group.applications.map((r) => ({
                      key: r.id,
                      to: `?id=${encodeURIComponent(r.id)}`,
                      cells: [
                        <span key="n" className="block min-w-0">
                          <span className="block font-medium text-ink">{fullName(r) || '—'}</span>
                          <span className="block break-words text-xs text-gray-500">
                            {r.form === 'documents' && (
                              <span className="font-semibold text-gray-700">Documents only · </span>
                            )}
                            {r.applicantEmail}
                          </span>
                        </span>,
                        r.submittedAt ? shortDate(r.submittedAt) : 'Not sent yet',
                        <StatusBadge key="s" status={r.status} />,
                        <ChevronRight key="c" className="hidden h-4 w-4 text-gray-400 md:block" aria-hidden />,
                      ],
                    }))}
                  />
                )}
              </AdminCard>
            </section>

            {group.invites.length > 0 && (
              <section>
                <SectionHeading>Links ({group.invites.length})</SectionHeading>
                <AdminCard>
                  <AdminList
                    label="Links"
                    columns={[{ label: 'Sent to', primary: true }, { label: 'Link' }, { label: '', end: true }]}
                    grid="md:grid-cols-[minmax(0,1fr)_auto_auto]"
                    rows={group.invites.map((invite) => {
                      const state = inviteState(invite, claimedInvites.has(invite.id));
                      return {
                        key: invite.id,
                        cells: [
                          <span key="e" className="block min-w-0">
                            {/* The recipient, not the address: every link here is
                                for the property in the heading, so what tells
                                them apart is who each went to. break-words, not
                                truncate — on a phone, truncating left "jane.d…",
                                which is not enough to know who it was. */}
                            <span className="block break-words font-medium text-ink">
                              {invite.inviteeEmail || 'No recipient recorded'}
                            </span>
                            <span className="numeral mt-0.5 block text-xs text-gray-500">
                              {invite.form === 'documents' && (
                                <span className="font-semibold text-gray-700">Documents only · </span>
                              )}
                              Created {shortDate(invite.createdAt)}
                              {invite.sentAt
                                ? ` · emailed ${shortDate(invite.sentAt)}`
                                : invite.inviteeEmail && ' · not emailed yet'}
                              {invite.expiresAt && ` · expires ${shortDate(invite.expiresAt)}`}
                            </span>
                          </span>,
                          <span
                            key="s"
                            // Matches StatusBadge's px-3 py-1: two pills sitting in
                            // the same list at different densities looks like a
                            // mistake even when neither is wrong on its own.
                            className={`inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold leading-5 ${STATE_TONE[state]}`}
                          >
                            {STATE_LABEL[state]}
                          </span>,
                          <span key="a" className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            {state !== 'revoked' && <CopyLink token={invite.token} />}
                            {state !== 'revoked' && state !== 'expired' && invite.inviteeEmail && (
                              <ResendButton invite={invite} onSent={markSent} />
                            )}
                            {group.invites.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowNew(false);
                                  setFixing((v) => (v === invite.id ? null : invite.id));
                                }}
                                aria-expanded={fixing === invite.id}
                                className={ROW_ACTION}
                              >
                                <MapPin className="h-3.5 w-3.5" aria-hidden />
                                Move
                              </button>
                            )}
                            {state === 'live' && (
                              <button
                                type="button"
                                onClick={() => revoke(invite.id)}
                                className="py-1 text-xs font-medium text-red-700 hover:underline"
                              >
                                Revoke
                              </button>
                            )}
                          </span>,
                        ],
                        detail:
                          fixing === invite.id ? (
                            <AddressEditor
                              invites={[invite]}
                              applications={apps}
                              previous={others}
                              scope={`Moves only the link sent to ${invite.inviteeEmail || 'this applicant'} — for when it went out with the wrong address. The other links stay here.`}
                              onSaved={addressSaved(group.key)}
                              onCancel={() => setFixing(null)}
                            />
                          ) : undefined,
                      };
                    })}
                  />
                </AdminCard>
              </section>
            )}
          </div>
        )}
      </AdminShell>
    );
  }

  /* ---- List --------------------------------------------------------- */
  const received = groups.filter((g) => g.lastSubmitted);
  const waiting = groups.filter((g) => !g.lastSubmitted);

  return (
    <AdminShell
      title="Rental applications"
      description="Create an application link, send it, and read what comes back."
      actions={
        <button
          type="button"
          onClick={() => setShowNew((v) => !v)}
          className={adminActionClass('primary')}
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden />
          New link
        </button>
      }
    >
      {showNew && (
        <AdminCard className="mb-8">
          <NewInviteForm
            previous={previous}
            onCreated={(created) => setInvites((rows) => [...created, ...rows])}
            // To the property the links were made for, which is where Copy
            // link is — and where they would otherwise have to be found.
            onFinished={(key) => {
              setShowNew(false);
              setParams({ property: key });
            }}
          />
        </AdminCard>
      )}

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-champagne-ink" aria-hidden />
        </div>
      ) : groups.length === 0 ? (
        <AdminCard>
          <p className="p-6 text-sm text-gray-600">
            Nothing yet. Create a link above and send it to an applicant.
          </p>
        </AdminCard>
      ) : (
        <>
          {/* `numeral` for the counts: Inter's default figures are
              proportional, so (1) and (7) are different widths and the label
              shifts as the number changes. See the class in index.css. */}
          <p className="numeral mb-6 text-sm text-gray-500">
            {groups.length} {groups.length === 1 ? 'property' : 'properties'} · {apps.length}{' '}
            {apps.length === 1 ? 'application' : 'applications'} · {invites.length}{' '}
            {invites.length === 1 ? 'link' : 'links'}
          </p>

          <div className="space-y-10">
            {received.length > 0 && (
              <section>
                <SectionHeading>Applications received</SectionHeading>
                <PropertyRows groups={received} label="Properties with applications" />
              </section>
            )}
            {waiting.length > 0 && (
              <section>
                <SectionHeading>Waiting for an application</SectionHeading>
                <PropertyRows groups={waiting} label="Properties waiting for an application" />
              </section>
            )}
          </div>
        </>
      )}
    </AdminShell>
  );
}
