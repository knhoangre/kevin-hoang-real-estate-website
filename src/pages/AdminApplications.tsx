/**
 * /admin/applications — invites and submitted applications.
 *
 * Two panels: the links Kevin has handed out, and the applications people have
 * filled in. `?id=<uuid>` opens one application read-only, using the SAME
 * RentalApplicationForm the applicant filled in — so the admin's copy cannot
 * quietly omit a field the form collects.
 *
 * Like /rentals, the detail view is a query param rather than a dynamic
 * segment: a /admin/applications/:id route could not be prerendered and would
 * need its own rewrite in vercel.json, and that file has exactly two scoped
 * rewrites for a reason.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy, Link2, Loader2, Mail, Pencil, Plus } from 'lucide-react';
import AdminShell, { AdminCard, adminActionClass } from '@/components/AdminShell';
import RentalApplicationForm from '@/components/rental/RentalApplicationForm';
import StatusBadge from '@/components/rental/StatusBadge';
import DownloadPdfButton from '@/components/rental/DownloadPdfButton';
import { Input } from '@/components/ui/input';
import AddressAutocomplete from '@/components/admin/AddressAutocomplete';
import type { AddressSuggestion } from '@/lib/massgis';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  APPLICATION_STATUSES,
  createInvite,
  formatProperty,
  formatTenancyAddress,
  inviteState,
  inviteUrl,
  listApplications,
  listInvites,
  previousProperties,
  revokeInvite,
  sendInvite,
  setApplicationStatus,
  STATUS_LABEL,
  type ApplicationStatus,
  type PreviousProperty,
  type RentalApplicationRecord,
  type RentalInviteRecord,
} from '@/lib/rentalApplication';

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

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

/* ------------------------------------------------------------------ */
/* New invite                                                          */
/* ------------------------------------------------------------------ */

const NewInviteForm = ({
  onCreated,
  previous,
}: {
  onCreated: (i: RentalInviteRecord) => void;
  /** Properties already used, for the reuse picker. */
  previous: PreviousProperty[];
}) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    propertyAddress: '',
    unit: '',
    propertyTown: '',
    // Every property on this site is in Massachusetts; it is still a field
    // rather than a constant because the relocation work is cross-border.
    propertyState: 'MA',
    propertyZip: '',
    monthlyRent: '',
    inviteeEmail: '',
    expiresInDays: '30',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  /*
   * The building's unit range, when MassGIS knows it ("#1-12"). Shown under the
   * Unit field as a hint and never written into it: a range says the building
   * has units, not which one is being let.
   */
  const [unitHint, setUnitHint] = useState<string | null>(null);
  const unitRef = useRef<HTMLInputElement>(null);

  /** A MassGIS suggestion was picked: fill everything it knows. */
  const applyAddress = (s: AddressSuggestion) => {
    setForm((p) => ({
      ...p,
      propertyAddress: s.street,
      propertyTown: s.town,
      propertyState: s.state,
      propertyZip: s.zip,
    }));
    setUnitHint(s.unitHint);
    // A multi-unit building needs a unit, so that is where the cursor goes next.
    if (s.unitHint) window.setTimeout(() => unitRef.current?.focus(), 0);
  };

  /** Fills the property fields from one already used, leaving the email alone. */
  const reuse = (choice: PreviousProperty) => {
    setUnitHint(null);
    setForm((p) => ({
      ...p,
      propertyAddress: choice.propertyAddress ?? '',
      unit: choice.unit ?? '',
      propertyTown: choice.propertyTown ?? '',
      propertyState: choice.propertyState ?? 'MA',
      propertyZip: choice.propertyZip ?? '',
      // The rent as it was last time, which is a starting point and not a
      // decision — it is the field most likely to have changed between tenants.
      monthlyRent: p.monthlyRent || (choice.monthlyRent != null ? String(choice.monthlyRent) : ''),
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const invite = await createInvite({
        // The label is what the applicant sees above the form. Derived from the
        // address rather than asked for separately: two fields that say the
        // same thing is how they drift apart. formatProperty is the one place
        // an address becomes a line, so the label cannot drift from the list.
        label: formatProperty({
          propertyAddress: form.propertyAddress,
          unit: form.unit,
          propertyTown: form.propertyTown,
          propertyState: form.propertyState,
          propertyZip: form.propertyZip,
        }),
        propertyAddress: form.propertyAddress,
        unit: form.unit,
        propertyTown: form.propertyTown,
        propertyState: form.propertyState,
        propertyZip: form.propertyZip,
        monthlyRent: form.monthlyRent,
        inviteeEmail: form.inviteeEmail,
        expiresInDays: Number(form.expiresInDays) || 0,
      });
      // Emailed straight away: the address is required, so a created link that
      // never went out is a link the admin has to remember to send by hand.
      let sent = false;
      try {
        await sendInvite(invite.id);
        sent = true;
      } catch (mailErr) {
        console.error('Could not email the invite:', mailErr);
      }

      onCreated(sent ? { ...invite, sentAt: new Date().toISOString() } : invite);
      setUnitHint(null);
      setForm({
        propertyAddress: '',
        unit: '',
        propertyTown: '',
        propertyState: 'MA',
        propertyZip: '',
        monthlyRent: '',
        inviteeEmail: '',
        expiresInDays: '30',
      });
      toast(
        sent
          ? { title: 'Link sent', description: `Emailed to ${form.inviteeEmail}.` }
          : {
              variant: 'destructive',
              title: 'Link created, but the email did not send',
              description: 'Copy the link and send it yourself, or use Resend email.',
            }
      );
    } catch (err) {
      console.error('Could not create invite:', err);
      toast({
        variant: 'destructive',
        title: 'Could not create the link',
        description: 'Please try again.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 p-6 sm:grid-cols-2">
      {/* Reuse first: re-letting the same unit is the common case, and it
          brings the rent with it. For a property not let before, the street
          field below suggests from MassGIS — which serves the same purpose this
          picker was built for, since both hand back one canonical spelling
          rather than letting "12 Elm St" and "12 Elm Street" become two
          properties no list can group. */}
      {previous.length > 0 && (
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="inv-reuse">Reuse a property</Label>
          <select
            id="inv-reuse"
            value=""
            onChange={(e) => {
              const choice = previous.find((p) => p.key === e.target.value);
              if (choice) reuse(choice);
            }}
            className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-ink focus:border-champagne focus:outline-none focus:ring-1 focus:ring-champagne"
          >
            <option value="">Start from a previous property…</option>
            {previous.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            Fills the fields below. Everything stays editable, and the rent is last
            time&rsquo;s.
          </p>
        </div>
      )}

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="inv-address">Street address</Label>
        <AddressAutocomplete
          id="inv-address"
          required
          placeholder="Start typing — 151 wash…"
          value={form.propertyAddress}
          onChange={(v) => {
            setUnitHint(null);
            setForm((p) => ({ ...p, propertyAddress: v }));
          }}
          onSelect={applyAddress}
        />
        <p className="text-xs text-gray-500">
          Pick a suggestion to fill in the town and ZIP as well.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="inv-unit">Unit</Label>
        <Input
          ref={unitRef}
          id="inv-unit"
          autoComplete="off"
          value={form.unit}
          onChange={set('unit')}
          aria-describedby={unitHint ? 'inv-unit-hint' : undefined}
        />
        {unitHint && (
          <p id="inv-unit-hint" className="numeral text-xs text-gray-500">
            This building has units {unitHint}.
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="inv-town">Town</Label>
        <Input
          id="inv-town"
          autoComplete="off"
          placeholder="Needham"
          value={form.propertyTown}
          onChange={set('propertyTown')}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="inv-state">State</Label>
        <Input
          id="inv-state"
          autoComplete="off"
          maxLength={2}
          className="uppercase"
          value={form.propertyState}
          onChange={set('propertyState')}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="inv-zip">ZIP code</Label>
        <Input
          id="inv-zip"
          // Not inputMode="numeric": a leading zero is exactly what a numeric
          // field eats, and 8 of 10 ZIPs on this site start with one.
          autoComplete="off"
          maxLength={10}
          placeholder="02492"
          value={form.propertyZip}
          onChange={set('propertyZip')}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="inv-rent">Monthly rent</Label>
        <Input id="inv-rent" inputMode="decimal" value={form.monthlyRent} onChange={set('monthlyRent')} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="inv-email">Applicant email</Label>
        <Input
          id="inv-email"
          type="email"
          required
          value={form.inviteeEmail}
          onChange={set('inviteeEmail')}
        />
        <p className="text-xs text-gray-500">
          The link is emailed here, and prefills their application.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="inv-expiry">Expires in (days)</Label>
        <Input
          id="inv-expiry"
          inputMode="numeric"
          value={form.expiresInDays}
          onChange={set('expiresInDays')}
        />
        <p className="text-xs text-gray-500">0 for no expiry.</p>
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/80 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Plus className="h-4 w-4" aria-hidden />
          )}
          Create application link
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
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-champagne-ink hover:underline"
    >
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
    <button
      type="button"
      onClick={send}
      disabled={busy}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-champagne-ink hover:underline disabled:opacity-60"
    >
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
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AdminApplications() {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const openId = params.get('id');

  const [invites, setInvites] = useState<RentalInviteRecord[]>([]);
  const [apps, setApps] = useState<RentalApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
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

  /** Which invites have an application against them. */
  const claimedInvites = useMemo(
    () => new Set(apps.map((a) => a.inviteId).filter(Boolean) as string[]),
    [apps]
  );

  /** The properties already invited on, newest first, for the reuse picker. */
  const previous = useMemo(() => previousProperties(invites), [invites]);

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

  /** Back to the list: drop out of edit mode and re-read what was written. */
  const closeApplication = () => {
    setEditing(false);
    setParams({}, { replace: true });
    // The form autosaves straight to the database, so the row in `apps` is
    // stale the moment anything was typed. Without this the list — and the next
    // application opened — would render the copy read before the edit.
    void load();
  };

  /* ---- One application --------------------------------------------- */
  if (openId) {
    const record = apps.find((r) => r.id === openId);
    return (
      <AdminShell
        title={
          record
            ? `${record.applicantFirstName ?? ''} ${record.applicantLastName ?? ''}`.trim() ||
              'Application'
            : 'Application'
        }
        description={record?.data.tenancy.propertyAddress || undefined}
        actions={
          <>
            <button
              type="button"
              onClick={closeApplication}
              className={adminActionClass('ghost')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
              All applications
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
              <div className="flex flex-wrap items-center gap-4 p-6">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                    Contact
                  </p>
                  <p className="mt-1 text-sm text-ink">
                    {record.applicantEmail}
                    {record.applicantPhone && ` · ${record.applicantPhone}`}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {record.submittedAt
                      ? `Submitted ${shortDate(record.submittedAt)}`
                      : `Started ${shortDate(record.createdAt)}`}
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
                  <select
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
                  </select>
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
            />
          </>
        )}
      </AdminShell>
    );
  }

  /* ---- List --------------------------------------------------------- */
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
            onCreated={(invite) => {
              setInvites((rows) => [invite, ...rows]);
              setShowNew(false);
            }}
          />
        </AdminCard>
      )}

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-champagne-ink" aria-hidden />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Applications */}
          <section>
            {/* `numeral` for the count: Inter's default figures are
                proportional, so (1) and (7) are different widths and the label
                shifts as the number changes. See the class in index.css. */}
            <h2 className="numeral mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              Applications ({apps.length})
            </h2>
            <AdminCard>
              {apps.length === 0 ? (
                <p className="p-6 text-sm text-gray-600">
                  Nothing yet. Create a link above and send it to an applicant.
                </p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Applicant</th>
                      <th className="px-6 py-3 font-semibold">Property</th>
                      <th className="px-6 py-3 font-semibold">Received</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => setParams({ id: r.id })}
                        className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-bone"
                      >
                        <td className="px-6 py-4">
                          <span className="font-medium text-ink">
                            {`${r.applicantFirstName ?? ''} ${r.applicantLastName ?? ''}`.trim() ||
                              '—'}
                          </span>
                          <span className="block text-xs text-gray-500">{r.applicantEmail}</span>
                        </td>
                        <td className="numeral px-6 py-4 text-gray-700">
                          {formatTenancyAddress(r.data.tenancy) || '—'}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {r.submittedAt ? shortDate(r.submittedAt) : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </AdminCard>
          </section>

          {/* Invites */}
          <section>
            <h2 className="numeral mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              Links ({invites.length})
            </h2>
            <AdminCard>
              {invites.length === 0 ? (
                <p className="p-6 text-sm text-gray-600">No links yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {invites.map((invite) => {
                    const state = inviteState(invite, claimedInvites.has(invite.id));
                    return (
                      <li key={invite.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                        <Link2 className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="numeral truncate text-sm font-medium text-ink">
                            {invite.label || formatProperty(invite) || 'Application link'}
                          </p>
                          <p className="numeral mt-0.5 text-xs text-gray-500">
                            Created {shortDate(invite.createdAt)}
                            {invite.inviteeEmail && ` · ${invite.inviteeEmail}`}
                            {invite.sentAt
                              ? ` · emailed ${shortDate(invite.sentAt)}`
                              : invite.inviteeEmail && ' · not emailed yet'}
                            {invite.expiresAt && ` · expires ${shortDate(invite.expiresAt)}`}
                          </p>
                        </div>
                        <span
                          // Matches StatusBadge's px-3 py-1: two pills sitting in
                          // the same list at different densities looks like a
                          // mistake even when neither is wrong on its own.
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold leading-5 ${STATE_TONE[state]}`}
                        >
                          {STATE_LABEL[state]}
                        </span>
                        {state !== 'revoked' && <CopyLink token={invite.token} />}
                        {state !== 'revoked' && state !== 'expired' && invite.inviteeEmail && (
                          <ResendButton invite={invite} onSent={markSent} />
                        )}
                        {state === 'live' && (
                          <button
                            type="button"
                            onClick={() => revoke(invite.id)}
                            className="text-xs font-medium text-red-700 hover:underline"
                          >
                            Revoke
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </AdminCard>
          </section>
        </div>
      )}
    </AdminShell>
  );
}
