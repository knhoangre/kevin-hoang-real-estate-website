import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, Plus, Printer, Trash2, X } from 'lucide-react';
import { ADMIN_BUTTON } from '@/components/AdminShell';
import DocFrame, { type DocFrameHandle } from '@/components/DocFrame';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  formatMoney,
  leasePremises,
  leaseWarnings,
  moneyValue,
  moveInTotal,
  newId,
  PAYER_LABEL,
  termEnd,
  tenantNames,
  termMonths,
  UTILITIES,
  type LeaseDoc,
  type LeaseTenant,
  type UtilityPayer,
} from '@/lib/lease';
import { deleteLease, loadLease, saveLease } from '@/lib/leaseStore';
import { formatPhoneInput } from '@/lib/phone';
import { formatProperty } from '@/lib/rentalProperty';
import LeaseDocument from './LeaseDocument';
import leaseCss from './lease.css?raw';

/**
 * The editor for one lease: the fields on the left, the lease itself on the
 * right — on a phone, one above the other.
 *
 * THE PAPER IS LIVE, as in the marketing editor: every field redraws it as it
 * is typed, and what is on the right is what prints (DocFrame).
 *
 * IT SAVES ITSELF a moment after the last change, and says so. Printing and
 * leaving wait for the save.
 *
 * Nothing is required and nothing blocks a print. What is worth saying before
 * a lease goes to a tenant — a deposit over the legal limit, a lease with no
 * landlord named — is said in the box at the top (`leaseWarnings`), and a
 * field left empty prints as a line to fill in by hand.
 */

const SAVE_AFTER_MS = 1200;

type SaveState = 'saved' | 'unsaved' | 'saving' | 'failed';

const SAVE_LABEL: Record<SaveState, string> = {
  saved: 'Saved',
  unsaved: 'Saving…',
  saving: 'Saving…',
  failed: 'Not saved — check your connection',
};

/** The lengths offered; anything else is "Other" and the end date is typed. */
const TERM_LENGTHS = [6, 9, 12, 18, 24];

const SMALL_BUTTON =
  'inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-champagne hover:bg-champagne hover:text-ink-deep disabled:pointer-events-none disabled:opacity-50';

const ICON_BUTTON =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-bone hover:text-ink disabled:pointer-events-none disabled:opacity-30';

const SELECT_CLASS =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-ink focus:border-champagne focus:outline-none focus:ring-1 focus:ring-champagne';

/*
  AdminCard's look without its `overflow-hidden`, for the same reason as the
  marketing editor's sections: nothing here needs clipping, and a card that
  clips is how a dropdown ends up found and invisible.
*/
const Section = ({ title, hint, children }: { title: string; hint?: React.ReactNode; children: React.ReactNode }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-champagne-ink">{title}</h2>
    {hint && <p className="mt-2 text-sm leading-relaxed text-gray-600">{hint}</p>}
    <div className="mt-4 space-y-4">{children}</div>
  </div>
);

const Field = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  hint?: React.ReactNode;
}) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      type={type}
      inputMode={inputMode}
      autoComplete="off"
      className="mt-1.5"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
    {hint && <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{hint}</p>}
  </div>
);

const Area = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: React.ReactNode;
}) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <Textarea
      id={id}
      rows={rows}
      className="mt-1.5 min-h-0"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
    {hint && <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{hint}</p>}
  </div>
);

/** Move item `from` one place up or down. Out of range, the list comes back as it was. */
const moved = <T,>(items: T[], from: number, by: -1 | 1): T[] => {
  const to = from + by;
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
};

const LeaseEditor = ({ id, onDeleted }: { id: string; onDeleted: () => void }) => {
  const { toast } = useToast();
  const [doc, setDoc] = useState<LeaseDoc | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>('saved');
  const [confirmDelete, setConfirmDelete] = useState(false);
  /** A length chosen before there is a start to count it from. */
  const [pendingLength, setPendingLength] = useState(12);

  const frame = useRef<DocFrameHandle>(null);
  // The latest lease, for the save that fires after the render that made it.
  const latest = useRef<LeaseDoc | null>(null);
  const dirty = useRef(false);
  const timer = useRef<number | null>(null);
  // Set once the lease is deleted, so leaving does not save it back.
  const gone = useRef(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const stored = await loadLease(id);
      if (!stored) {
        setLoadError('That lease no longer exists.');
        return;
      }
      latest.current = stored.doc;
      setDoc(stored.doc);
    } catch (err) {
      console.error('Could not open the lease:', err);
      setLoadError('Could not open the lease. Refresh the page to try again.');
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const flush = useCallback(async () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    if (gone.current || !dirty.current || !latest.current) return;
    dirty.current = false;
    setSave('saving');
    try {
      await saveLease(id, latest.current);
      // Something changed while that was in flight: it is not saved yet.
      setSave(dirty.current ? 'unsaved' : 'saved');
    } catch (err) {
      dirty.current = true;
      setSave('failed');
      console.error('Could not save the lease:', err);
    }
  }, [id]);

  /** Every edit goes through here: redraw now, save shortly. */
  const change = useCallback(
    (update: (doc: LeaseDoc) => LeaseDoc) => {
      setDoc((was) => {
        if (!was) return was;
        const next = update(was);
        latest.current = next;
        return next;
      });
      dirty.current = true;
      setSave('unsaved');
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void flush(), SAVE_AFTER_MS);
    },
    [flush]
  );

  // Leaving the page: whatever has not been saved is saved on the way out.
  useEffect(() => () => void flush(), [flush]);

  const warnings = useMemo(() => (doc ? leaseWarnings(doc) : []), [doc]);

  if (loadError) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">{loadError}</div>
    );
  }
  if (!doc) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">Opening the lease…</div>
    );
  }

  const set = <K extends keyof LeaseDoc>(key: K, value: LeaseDoc[K]) => change((d) => ({ ...d, [key]: value }));
  const setIn =
    <K extends 'landlord' | 'agent' | 'premises'>(key: K) =>
    (field: keyof LeaseDoc[K]) =>
    (value: string) =>
      change((d) => ({ ...d, [key]: { ...d[key], [field]: value } }));
  const landlord = setIn('landlord');
  const agent = setIn('agent');
  const premises = setIn('premises');

  const setTenant = (tenantId: string, patch: Partial<LeaseTenant>) =>
    change((d) => ({ ...d, tenants: d.tenants.map((t) => (t.id === tenantId ? { ...t, ...patch } : t)) }));

  const address = formatProperty(leasePremises(doc));
  const title = `Lease — ${address || 'untitled'}`;
  const rent = moneyValue(doc.rent);
  const total = moveInTotal(doc);
  const months = doc.start && doc.end ? termMonths(doc.start, doc.end) : null;
  const lengthChoice =
    months !== null && TERM_LENGTHS.includes(months) ? String(months) : doc.end ? 'other' : String(pendingLength);

  /** A new start keeps the term's length: the end moves with it. A typed, odd-length end stays put. */
  const setStart = (start: string) =>
    change((d) => {
      const current = d.start && d.end ? termMonths(d.start, d.end) : null;
      const length = current ?? (d.end ? null : pendingLength);
      return { ...d, start, end: length && start ? termEnd(start, length) ?? d.end : d.end };
    });

  const setLength = (value: string) => {
    if (value === 'other') return;
    const n = Number(value);
    setPendingLength(n);
    change((d) => ({ ...d, end: d.start ? termEnd(d.start, n) ?? d.end : d.end }));
  };

  const print = async () => {
    await flush();
    await frame.current?.print();
  };

  const remove = async () => {
    setConfirmDelete(false);
    try {
      gone.current = true;
      if (timer.current !== null) window.clearTimeout(timer.current);
      await deleteLease(id);
      onDeleted();
    } catch (err) {
      gone.current = false;
      console.error('Could not delete the lease:', err);
      toast({ variant: 'destructive', title: 'Could not delete the lease', description: 'Please try again.' });
    }
  };

  const sameAsRent = (key: 'lastMonth' | 'security') =>
    rent !== null && (
      <button type="button" className={SMALL_BUTTON} onClick={() => set(key, formatMoney(rent))}>
        Same as rent ({formatMoney(rent)})
      </button>
    );

  const deposit = (moneyValue(doc.security) ?? 0) > 0;
  const lastPaid = (moneyValue(doc.lastMonth) ?? 0) > 0;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {/* The tenants, not the address: the address is the page's own heading above. */}
          <p className="numeral break-words text-xl font-semibold tracking-tight text-ink">
            {tenantNames(doc) || 'No tenants named yet'}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Lease ·{' '}
            <span className={save === 'failed' ? 'font-medium text-red-700' : ''} aria-live="polite">
              {SAVE_LABEL[save]}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <button type="button" className={SMALL_BUTTON} onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Delete
          </button>
          <button type="button" className={ADMIN_BUTTON} onClick={() => void print()}>
            <Printer className="h-4 w-4" aria-hidden />
            Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
        {/* ------------------------------------------------------------ fields */}
        <div className="min-w-0 space-y-5">
          <div className="rounded-xl border border-gray-200 bg-bone p-5 text-sm leading-relaxed text-gray-700">
            <p>
              This is the site’s own plain-English lease for Massachusetts — not the Greater Boston Real Estate
              Board’s form, which is copyrighted. Read it through and have the landlord, or their attorney,
              agree to the wording before anyone signs it.
            </p>
            {(deposit || lastPaid || doc.lead === 'before1978') && (
              <>
                <p className="mt-3 font-semibold text-ink">Also give the tenant</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 marker:text-champagne">
                  {lastPaid && <li>A receipt for last month’s rent, when it is paid.</li>}
                  {deposit && (
                    <>
                      <li>
                        A statement of the condition of the premises, when the deposit is received or within ten
                        days of move-in, whichever is later.
                      </li>
                      <li>A receipt naming the bank, the account number and the amount, within thirty days.</li>
                    </>
                  )}
                  {doc.lead === 'before1978' && (
                    <li>The state’s Tenant Lead Law Notification and Tenant Certification form, before signing.</li>
                  )}
                </ul>
              </>
            )}
          </div>

          {warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                Before this is signed
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <Section title="Landlord">
            <Field id="ls-landlord" label="Name" value={doc.landlord.name} onChange={landlord('name')} />
            <Area
              id="ls-landlord-address"
              label="Address for notices"
              rows={2}
              value={doc.landlord.address}
              onChange={landlord('address')}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="ls-landlord-phone"
                label="Phone"
                type="tel"
                value={doc.landlord.phone}
                onChange={(v) => landlord('phone')(formatPhoneInput(v))}
              />
              <Field
                id="ls-landlord-email"
                label="Email"
                type="email"
                value={doc.landlord.email}
                onChange={landlord('email')}
              />
            </div>
          </Section>

          <Section title="Tenants" hint="Everyone who signs. Each is responsible for the whole rent.">
            {doc.tenants.map((t, i) => (
              <div key={t.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <Field
                      id={`ls-tenant-${t.id}`}
                      label={`Tenant ${i + 1}`}
                      value={t.name}
                      onChange={(name) => setTenant(t.id, { name })}
                      hint={t.applicationId ? 'From their application.' : undefined}
                    />
                  </div>
                  <button
                    type="button"
                    className={`${ICON_BUTTON} mt-6`}
                    aria-label={`Remove ${t.name || `tenant ${i + 1}`}`}
                    onClick={() => change((d) => ({ ...d, tenants: d.tenants.filter((x) => x.id !== t.id) }))}
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field
                    id={`ls-tenant-phone-${t.id}`}
                    label="Phone"
                    type="tel"
                    value={t.phone}
                    onChange={(phone) => setTenant(t.id, { phone: formatPhoneInput(phone) })}
                  />
                  <Field
                    id={`ls-tenant-email-${t.id}`}
                    label="Email"
                    type="email"
                    value={t.email}
                    onChange={(email) => setTenant(t.id, { email })}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              className={SMALL_BUTTON}
              onClick={() =>
                change((d) => ({
                  ...d,
                  tenants: [...d.tenants, { id: newId(), name: '', email: '', phone: '', applicationId: null }],
                }))
              }
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add a tenant
            </button>
            <Area
              id="ls-occupants"
              label="Others who will live there"
              value={doc.occupants}
              onChange={(v) => set('occupants', v)}
              placeholder="One per line — Sam Doe, age 7"
              hint="Children, and any adult who will live there without signing."
            />
          </Section>

          <Section title="Premises">
            <Field id="ls-street" label="Street address" value={doc.premises.street} onChange={premises('street')} />
            <div className="grid grid-cols-2 gap-4">
              <Field id="ls-unit" label="Unit" value={doc.premises.unit} onChange={premises('unit')} />
              <Field id="ls-town" label="Town" value={doc.premises.town} onChange={premises('town')} />
              <Field id="ls-state" label="State" value={doc.premises.state} onChange={premises('state')} />
              {/* Not inputMode="numeric": a leading zero is exactly what a numeric field eats. */}
              <Field id="ls-zip" label="ZIP" value={doc.premises.zip} onChange={premises('zip')} />
            </div>
            <Area
              id="ls-includes"
              label="Included with it"
              value={doc.includes}
              onChange={(v) => set('includes', v)}
              placeholder={'Parking space 4\nBasement storage unit\nWasher and dryer'}
            />
          </Section>

          <Section title="Term">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="ls-start" label="Starts" type="date" value={doc.start} onChange={setStart} />
              <div>
                <Label htmlFor="ls-length">Length</Label>
                <NativeSelect
                  id="ls-length"
                  wrapperClassName="mt-1.5"
                  className={SELECT_CLASS}
                  value={lengthChoice}
                  onChange={(e) => setLength(e.target.value)}
                >
                  {TERM_LENGTHS.map((n) => (
                    <option key={n} value={n}>
                      {n} months
                    </option>
                  ))}
                  <option value="other">Other — type the end date</option>
                </NativeSelect>
              </div>
            </div>
            <Field
              id="ls-end"
              label="Ends"
              type="date"
              value={doc.end}
              onChange={(v) => set('end', v)}
              hint={!doc.start ? 'Choose the start and the end fills itself in.' : undefined}
            />
          </Section>

          <Section title="Rent">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="ls-rent"
                label="Monthly rent"
                inputMode="decimal"
                value={doc.rent}
                onChange={(v) => set('rent', v)}
                placeholder="2,400"
              />
              <Field
                id="ls-due"
                label="Due on day"
                inputMode="numeric"
                value={doc.dueDay}
                onChange={(v) => set('dueDay', v)}
                placeholder="1"
              />
            </div>
            <Field
              id="ls-payto"
              label="Paid to"
              value={doc.payTo}
              onChange={(v) => set('payTo', v)}
              placeholder={doc.landlord.name || 'The landlord, or a management company'}
            />
            <Field
              id="ls-payhow"
              label="Paid by"
              value={doc.payHow}
              onChange={(v) => set('payHow', v)}
              placeholder="check, or Zelle to owner@example.com"
            />
            <Field
              id="ls-late"
              label="Late charge"
              inputMode="decimal"
              value={doc.lateFee}
              onChange={(v) => set('lateFee', v)}
              placeholder="Leave blank for none"
              hint="Massachusetts allows a late charge only once rent is thirty days overdue, and the lease says so."
            />
          </Section>

          <Section
            title="Money at the start"
            hint="The most Massachusetts allows: first month, last month at the same rate, a deposit of up to one month, and a new lock."
          >
            <Field
              id="ls-first"
              label="First month’s rent"
              inputMode="decimal"
              value={doc.firstMonth}
              onChange={(v) => set('firstMonth', v)}
            />
            <div>
              <Field
                id="ls-last"
                label="Last month’s rent"
                inputMode="decimal"
                value={doc.lastMonth}
                onChange={(v) => set('lastMonth', v)}
                placeholder="Leave blank if not collected"
              />
              {!doc.lastMonth.trim() && <div className="mt-2">{sameAsRent('lastMonth')}</div>}
            </div>
            <div>
              <Field
                id="ls-security"
                label="Security deposit"
                inputMode="decimal"
                value={doc.security}
                onChange={(v) => set('security', v)}
                placeholder="Leave blank if not collected"
              />
              {!doc.security.trim() && <div className="mt-2">{sameAsRent('security')}</div>}
            </div>
            <Field
              id="ls-lock"
              label="New lock and key"
              inputMode="decimal"
              value={doc.lockFee}
              onChange={(v) => set('lockFee', v)}
              placeholder="Leave blank if not charged"
            />
            {total !== null && (
              <p className="numeral flex justify-between border-t border-gray-200 pt-3 text-sm font-semibold text-ink">
                <span>Total before move-in</span>
                <span>{formatMoney(total)}</span>
              </p>
            )}
          </Section>

          <Section title="Utilities and services" hint="Anything left undecided prints as a blank to fill in.">
            <div className="grid gap-4 sm:grid-cols-2">
              {UTILITIES.map((u) => (
                <div key={u.id}>
                  <Label htmlFor={`ls-util-${u.id}`}>{u.label}</Label>
                  <NativeSelect
                    id={`ls-util-${u.id}`}
                    wrapperClassName="mt-1.5"
                    className={SELECT_CLASS}
                    value={doc.utilities[u.id]}
                    onChange={(e) =>
                      change((d) => ({
                        ...d,
                        utilities: { ...d.utilities, [u.id]: e.target.value as UtilityPayer },
                      }))
                    }
                  >
                    <option value="">Not decided</option>
                    {(Object.keys(PAYER_LABEL) as Exclude<UtilityPayer, ''>[]).map((p) => (
                      <option key={p} value={p}>
                        {PAYER_LABEL[p]}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Pets and vehicles">
            <Area
              id="ls-pets"
              label="Pets allowed"
              value={doc.pets}
              onChange={(v) => set('pets', v)}
              placeholder="One per line — leave blank for none"
              hint="Massachusetts allows no pet fee or pet deposit beyond the security deposit. An assistance animal is not a pet."
            />
            <Area
              id="ls-vehicles"
              label="Vehicles"
              value={doc.vehicles}
              onChange={(v) => set('vehicles', v)}
              placeholder="One per line — 2019 Honda Civic, MA plate ABC123"
            />
          </Section>

          <Section title="Lead paint" hint="Homes built before 1978 come with the state’s lead law notification.">
            <fieldset className="space-y-2">
              <legend className="sr-only">When was the building built?</legend>
              {(
                [
                  ['before1978', 'Built before 1978'],
                  ['after1978', 'Built in 1978 or later'],
                  ['', 'Not sure yet — print both boxes'],
                ] as const
              ).map(([value, label]) => (
                <label key={value || 'unknown'} className="flex items-center gap-3 text-sm text-ink">
                  <input
                    type="radio"
                    name="ls-lead"
                    className="h-4 w-4 accent-champagne-ink"
                    checked={doc.lead === value}
                    onChange={() => set('lead', value)}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
          </Section>

          <Section
            title="Clauses"
            hint="The lease’s own wording, after the sections above. Change, reorder, remove or add."
          >
            {doc.clauses.map((c, i) => (
              <div key={c.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start gap-1">
                  <div className="min-w-0 flex-1">
                    <Label htmlFor={`ls-clause-${c.id}`} className="sr-only">
                      Clause title
                    </Label>
                    <Input
                      id={`ls-clause-${c.id}`}
                      value={c.title}
                      placeholder="Title"
                      className="font-semibold"
                      onChange={(e) =>
                        change((d) => ({
                          ...d,
                          clauses: d.clauses.map((x) => (x.id === c.id ? { ...x, title: e.target.value } : x)),
                        }))
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className={ICON_BUTTON}
                    aria-label={`Move “${c.title || 'clause'}” up`}
                    disabled={i === 0}
                    onClick={() => change((d) => ({ ...d, clauses: moved(d.clauses, i, -1) }))}
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={ICON_BUTTON}
                    aria-label={`Move “${c.title || 'clause'}” down`}
                    disabled={i === doc.clauses.length - 1}
                    onClick={() => change((d) => ({ ...d, clauses: moved(d.clauses, i, 1) }))}
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={ICON_BUTTON}
                    aria-label={`Remove “${c.title || 'clause'}”`}
                    onClick={() => change((d) => ({ ...d, clauses: d.clauses.filter((x) => x.id !== c.id) }))}
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <Label htmlFor={`ls-clause-body-${c.id}`} className="sr-only">
                  Clause wording
                </Label>
                <Textarea
                  id={`ls-clause-body-${c.id}`}
                  rows={5}
                  className="mt-2 min-h-0 leading-relaxed"
                  value={c.body}
                  onChange={(e) =>
                    change((d) => ({
                      ...d,
                      clauses: d.clauses.map((x) => (x.id === c.id ? { ...x, body: e.target.value } : x)),
                    }))
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className={SMALL_BUTTON}
              onClick={() =>
                change((d) => ({ ...d, clauses: [...d.clauses, { id: newId(), title: '', body: '' }] }))
              }
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add a clause
            </button>
          </Section>

          <Section title="Prepared by" hint="Printed at the top. Clear the name to leave it off.">
            <Field id="ls-agent" label="Name" value={doc.agent.name} onChange={agent('name')} />
            <Field id="ls-agent-brokerage" label="Brokerage" value={doc.agent.brokerage} onChange={agent('brokerage')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="ls-agent-phone"
                label="Phone"
                type="tel"
                value={doc.agent.phone}
                onChange={(v) => agent('phone')(formatPhoneInput(v))}
              />
              <Field id="ls-agent-email" label="Email" type="email" value={doc.agent.email} onChange={agent('email')} />
            </div>
          </Section>
        </div>

        {/* ------------------------------------------------------------- paper */}
        <div className="min-w-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
          <div className="rounded-xl bg-gray-200/80 p-3 sm:p-4">
            <DocFrame ref={frame} family="sheet" css={leaseCss} margin="0.75in 0.85in 0.9in" title={title}>
              <LeaseDocument doc={doc} />
            </DocFrame>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-gray-500">
            The print box opens with letter paper and margins already set; “Save as PDF” there gives a file to
            send. Each printed page carries a page number and a line for the tenant’s initials.
          </p>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lease?</AlertDialogTitle>
            <AlertDialogDescription>
              The lease for {address || 'this property'} will be removed. The applications it was made from are
              not affected. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={() => void remove()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LeaseEditor;
