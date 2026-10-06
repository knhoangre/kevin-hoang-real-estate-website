/**
 * /admin/showings — build a day of showings and hand the client one schedule.
 *
 * Kevin books the appointments and knows the open-house times; nothing here
 * looks either up (the MLS feed carries neither). What this does is put them in
 * order and turn them into something to send: every stop with its time, its
 * address and a link to that home on this site.
 *
 * TWO WAYS OUT, AND NEITHER NEEDS THE OTHER.
 *   - Email: sent from here, with a calendar file and Kevin on cc.
 *   - Text: GENERATED here and sent by Kevin from his own phone. Nothing is
 *     sent by this page when a text is generated, and a tour needs no email
 *     address at all.
 * Both come from one renderer in the `showing-schedule` edge function, so the
 * text and the email cannot disagree about a time.
 *
 * `?id=<uuid>` opens one tour, as on /admin/applications: a /admin/showings/:id
 * route could not be prerendered and would need a rewrite of its own.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Mail,
  MessageSquare,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import AdminShell, { AdminCard, adminActionClass } from '@/components/AdminShell';
import ListingLookup from '@/components/admin/ListingLookup';
import SuggestInput from '@/components/admin/SuggestInput';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { formatPrice } from '@/lib/listings';
import { formatPhoneInput } from '@/lib/phone';
import { smsHrefTo } from '@/lib/siteConfig';
import type { ListingSuggestion } from '@/lib/idxSearch';
import {
  STOP_KINDS,
  addStop,
  createTour,
  deleteTour,
  formatStopTime,
  formatTourDate,
  isWorthFindingClient,
  listTours,
  previewSchedule,
  removeStop,
  sendSchedule,
  suggestClients,
  todayInBoston,
  updateTour,
  type ClientSuggestion,
  type SchedulePreview,
  type ShowingTour,
  type StopKind,
  type TourDetails,
} from '@/lib/showingTours';

const FIELD =
  'h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-ink focus:border-champagne focus:outline-none focus:ring-1 focus:ring-champagne';

const sentStamp = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const BLANK_DETAILS: TourDetails = {
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  tourDate: '',
  note: '',
};

const detailsOf = (tour: ShowingTour): TourDetails => ({
  clientName: tour.clientName,
  clientEmail: tour.clientEmail ?? '',
  clientPhone: tour.clientPhone ?? '',
  tourDate: tour.tourDate,
  note: tour.note ?? '',
});

/** A name, and at least one way to reach them. Mirrors the table's own constraint. */
const detailsProblem = (d: TourDetails): string | null => {
  if (!d.clientName.trim()) return 'Add the client’s name.';
  if (!d.tourDate) return 'Choose the date.';
  if (!d.clientEmail.trim() && !d.clientPhone.trim()) {
    return 'Add an email address or a phone number — either one is enough.';
  }
  return null;
};

/* ------------------------------------------------------------------ */
/* Client, date, note                                                  */
/* ------------------------------------------------------------------ */

// Module scope: SuggestInput reads these in an effect and needs them stable.
const clientName = (c: ClientSuggestion) => c.name;
const clientKey = (c: ClientSuggestion) => String(c.contactId);
const renderClient = (c: ClientSuggestion) => (
  <>
    <User className="mt-0.5 h-4 w-4 shrink-0 text-champagne-ink" aria-hidden />
    <span className="min-w-0">
      <span className="block font-medium text-ink">{c.name}</span>
      <span className="numeral block truncate text-xs text-gray-500">
        {[c.email, c.phone].filter(Boolean).join(' · ') || 'No contact details in the CRM'}
      </span>
    </span>
  </>
);

const DetailsFields = ({
  idPrefix,
  value,
  onChange,
}: {
  idPrefix: string;
  value: TourDetails;
  onChange: (next: TourDetails) => void;
}) => {
  const set = (key: keyof TourDetails) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [key]: e.target.value });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-name`}>Client</Label>
        <SuggestInput<ClientSuggestion>
          id={`${idPrefix}-name`}
          required
          placeholder="Start typing a name — CRM contacts are suggested"
          value={value.clientName}
          onChange={(name) => onChange({ ...value, clientName: name })}
          onSelect={(c) =>
            onChange({
              ...value,
              clientName: c.name,
              // What the CRM has, without wiping something already typed here
              // when the CRM has nothing.
              clientEmail: c.email ?? value.clientEmail,
              clientPhone: c.phone ? formatPhoneInput(c.phone) : value.clientPhone,
            })
          }
          worth={isWorthFindingClient}
          suggest={suggestClients}
          valueOf={clientName}
          keyOf={clientKey}
          renderItem={renderClient}
          listLabel="Matching contacts"
          footer="From your CRM. Somebody new? Just keep typing."
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-email`}>Email</Label>
        <Input
          id={`${idPrefix}-email`}
          type="email"
          autoComplete="off"
          value={value.clientEmail}
          onChange={set('clientEmail')}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-phone`}>Phone</Label>
        <Input
          id={`${idPrefix}-phone`}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          placeholder="774-222-0952"
          value={value.clientPhone}
          onChange={(e) => onChange({ ...value, clientPhone: formatPhoneInput(e.target.value) })}
        />
        <p className="text-xs text-gray-500">Email or phone — one is enough.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-date`}>Date</Label>
        <Input
          id={`${idPrefix}-date`}
          type="date"
          required
          value={value.tourDate}
          onChange={set('tourDate')}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-note`}>Note to the client</Label>
        <Input
          id={`${idPrefix}-note`}
          autoComplete="off"
          placeholder="Meet at the first house. Parking is on the street."
          value={value.note}
          onChange={set('note')}
        />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Adding a stop                                                       */
/* ------------------------------------------------------------------ */

const AddStopForm = ({
  tourId,
  onAdded,
}: {
  tourId: string;
  onAdded: () => Promise<void> | void;
}) => {
  const { toast } = useToast();
  const [address, setAddress] = useState('');
  const [listing, setListing] = useState<ListingSuggestion | null>(null);
  const [time, setTime] = useState('');
  const [kind, setKind] = useState<StopKind>('showing');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!address.trim() || !time) {
      toast({ variant: 'destructive', title: 'A stop needs an address and a time.' });
      return;
    }
    setBusy(true);
    try {
      await addStop(tourId, {
        mlsNumber: listing?.mls_number ?? null,
        startsAt: time,
        kind,
        note,
        address: listing?.address ?? address,
        town: listing?.town ?? null,
        state: listing?.state ?? null,
        zip: listing?.zip ?? null,
        listPrice: listing?.list_price ?? null,
      });
      setAddress('');
      setListing(null);
      setTime('');
      setNote('');
      await onAdded();
    } catch (err) {
      console.error('Could not add the stop:', err);
      toast({ variant: 'destructive', title: 'Could not add the stop', description: 'Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 border-t border-gray-200 bg-gray-50/60 p-6 sm:grid-cols-6">
      <div className="space-y-1.5 sm:col-span-6">
        <Label htmlFor="stop-address">Address or MLS number</Label>
        <ListingLookup
          id="stop-address"
          placeholder="Start typing — 12 elm, or paste 73524017"
          value={address}
          onChange={(value) => {
            setAddress(value);
            // Typing over a matched address means it may no longer be that listing.
            setListing(null);
          }}
          onSelect={(picked) => {
            setAddress(picked.address ?? '');
            setListing(picked);
          }}
        />
        <p className="numeral text-xs text-gray-500">
          {listing
            ? `Matched to MLS ${listing.mls_number} in ${listing.town ?? 'the feed'} — the schedule will link to this home on your site.`
            : 'Pick a suggestion to link the stop to its page on your site. A home that is not listed can be typed in and simply has no link.'}
        </p>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="stop-time">Time</Label>
        <Input
          id="stop-time"
          type="time"
          step={300}
          required
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="stop-kind">Type</Label>
        <select
          id="stop-kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as StopKind)}
          className={FIELD}
        >
          {STOP_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="stop-note">Note</Label>
        <Input
          id="stop-note"
          autoComplete="off"
          placeholder="Lockbox on the side door"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div className="sm:col-span-6">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/80 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
          Add stop
        </button>
      </div>
    </form>
  );
};

/* ------------------------------------------------------------------ */
/* Sending it                                                          */
/* ------------------------------------------------------------------ */

const DeliveryPanel = ({
  tour,
  onSent,
}: {
  tour: ShowingTour;
  onSent: (sentAt: string) => void;
}) => {
  const { toast } = useToast();
  const [preview, setPreview] = useState<SchedulePreview | null>(null);
  const [building, setBuilding] = useState<'text' | 'email' | null>(null);
  const [showEmail, setShowEmail] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  /*
   * A preview describes the tour as it was when it was built. Any edit — a
   * stop added, a time changed, a new note — makes it a description of a
   * schedule that no longer exists, and the worst outcome here is texting one.
   * So it is thrown away whenever the tour changes and has to be asked for again.
   */
  // `sentAt` is left out: stamping it is not an edit to the schedule, and
  // closing the preview the moment the email goes would look like a failure.
  const fingerprint = useMemo(() => JSON.stringify({ ...tour, sentAt: null }), [tour]);
  useEffect(() => {
    setPreview(null);
    setShowEmail(false);
  }, [fingerprint]);

  const noStops = tour.stops.length === 0;

  const build = async (which: 'text' | 'email') => {
    if (building) return;
    setBuilding(which);
    try {
      setPreview(await previewSchedule(tour.id));
      if (which === 'email') setShowEmail(true);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could not build the schedule',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setBuilding(null);
    }
  };

  const send = async () => {
    if (sending || !tour.clientEmail) return;
    setSending(true);
    try {
      const sentAt = await sendSchedule(tour.id);
      onSent(sentAt);
      toast({ title: 'Schedule emailed', description: `Sent to ${tour.clientEmail}, with you on cc.` });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could not send the email',
        description: err instanceof Error ? err.message : 'Please try again in a moment.',
      });
    } finally {
      setSending(false);
    }
  };

  const copy = async () => {
    if (!preview) return;
    try {
      await navigator.clipboard.writeText(preview.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard needs a secure context and a permission. The text is in a
      // selectable box right there, which is the fallback that always works.
      toast({ title: 'Select the text in the box and copy it.' });
    }
  };

  return (
    <div className="grid gap-px bg-gray-200 md:grid-cols-2">
      {/* ---- Text ---- */}
      <div className="space-y-4 bg-white p-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-champagne-ink" aria-hidden />
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">Text message</h3>
        </div>
        <p className="text-sm leading-relaxed text-gray-600">
          Writes the schedule as a text for you to send yourself. Nothing is sent from here, and no
          email goes out.
        </p>
        <button
          type="button"
          onClick={() => build('text')}
          disabled={noStops || building !== null}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/80 disabled:opacity-50"
        >
          {building === 'text' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <MessageSquare className="h-4 w-4" aria-hidden />
          )}
          {preview ? 'Rebuild the text' : 'Generate text message'}
        </button>

        {preview && (
          <div className="space-y-3">
            <textarea
              readOnly
              value={preview.text}
              rows={Math.min(22, preview.text.split('\n').length + 1)}
              aria-label="The schedule as a text message"
              onFocus={(e) => e.currentTarget.select()}
              className="numeral w-full rounded-md border border-gray-200 bg-bone p-3 text-sm leading-relaxed text-ink"
            />
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-champagne-ink hover:underline"
              >
                {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              {tour.clientPhone ? (
                <a
                  href={smsHrefTo(tour.clientPhone, preview.text)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-champagne-ink hover:underline"
                >
                  <MessageSquare className="h-4 w-4" aria-hidden />
                  Open in Messages to {tour.clientPhone}
                </a>
              ) : (
                <span className="text-xs text-gray-500">
                  Add a phone number above to open it straight in Messages.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ---- Email ---- */}
      <div className="space-y-4 bg-white p-6">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-champagne-ink" aria-hidden />
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">Email</h3>
        </div>
        <p className="text-sm leading-relaxed text-gray-600">
          {tour.clientEmail
            ? `Sends the schedule to ${tour.clientEmail} with a calendar file attached, and a copy to you.`
            : 'This tour has no email address. Add one above to email it, or send it as a text.'}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={send}
            disabled={noStops || sending || !tour.clientEmail}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/80 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Mail className="h-4 w-4" aria-hidden />}
            {tour.sentAt ? 'Email it again' : 'Email to client'}
          </button>
          <button
            type="button"
            onClick={() => (showEmail ? setShowEmail(false) : build('email'))}
            disabled={noStops || building !== null}
            className="text-sm font-medium text-champagne-ink hover:underline disabled:opacity-50"
          >
            {building === 'email' ? 'Building…' : showEmail ? 'Hide the preview' : 'Preview the email'}
          </button>
        </div>
        <p className="numeral text-xs text-gray-500">
          {tour.sentAt ? `Emailed ${sentStamp(tour.sentAt)}.` : 'Not emailed yet.'}
        </p>

        {showEmail && preview && (
          /* `sandbox` with no allowances: the email is our own HTML, but it is
             rendered as a document and nothing in it needs to run. */
          <iframe
            title="Email preview"
            sandbox=""
            srcDoc={preview.html}
            className="h-[32rem] w-full rounded-md border border-gray-200 bg-white"
          />
        )}
      </div>

      {noStops && (
        <p className="bg-white px-6 pb-6 text-sm text-gray-600 md:col-span-2">
          Add at least one stop above and both of these come to life.
        </p>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AdminShowings() {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const openId = params.get('id');

  const [tours, setTours] = useState<ShowingTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState<TourDetails>(BLANK_DETAILS);
  const [details, setDetails] = useState<TourDetails>(BLANK_DETAILS);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setTours(await listTours());
    } catch (err) {
      console.error('Could not load showing tours:', err);
      toast({ variant: 'destructive', title: 'Could not load', description: 'Refresh the page to try again.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const tour = useMemo(() => tours.find((t) => t.id === openId) ?? null, [tours, openId]);

  // The details form follows the tour that is open, and is re-seeded when a
  // different one is opened — not on every reload, which would wipe typing.
  useEffect(() => {
    if (tour) setDetails(detailsOf(tour));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour?.id]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const problem = detailsProblem(draft);
    if (problem) {
      toast({ variant: 'destructive', title: problem });
      return;
    }
    setBusy(true);
    try {
      const created = await createTour(draft);
      setTours((rows) => [created, ...rows]);
      setDraft(BLANK_DETAILS);
      setShowNew(false);
      setParams({ id: created.id });
    } catch (err) {
      console.error('Could not create the tour:', err);
      toast({ variant: 'destructive', title: 'Could not create the tour', description: 'Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !tour) return;
    const problem = detailsProblem(details);
    if (problem) {
      toast({ variant: 'destructive', title: problem });
      return;
    }
    setBusy(true);
    try {
      await updateTour(tour.id, details);
      await load();
      toast({ title: 'Saved' });
    } catch (err) {
      console.error('Could not save the tour:', err);
      toast({ variant: 'destructive', title: 'Could not save', description: 'Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  const dropStop = async (id: string) => {
    try {
      await removeStop(id);
      await load();
    } catch (err) {
      console.error('Could not remove the stop:', err);
      toast({ variant: 'destructive', title: 'Could not remove the stop' });
    }
  };

  const dropTour = async () => {
    if (!tour) return;
    if (!window.confirm(`Delete the tour for ${tour.clientName}? Its stops go with it.`)) return;
    try {
      await deleteTour(tour.id);
      setTours((rows) => rows.filter((t) => t.id !== tour.id));
      setParams({}, { replace: true });
    } catch (err) {
      console.error('Could not delete the tour:', err);
      toast({ variant: 'destructive', title: 'Could not delete the tour' });
    }
  };

  /* ---- One tour ------------------------------------------------------ */
  if (openId) {
    const unsaved = tour ? JSON.stringify(details) !== JSON.stringify(detailsOf(tour)) : false;

    return (
      <AdminShell
        title={tour ? tour.clientName : 'Showing tour'}
        description={tour ? formatTourDate(tour.tourDate) : undefined}
        actions={
          <>
            <button
              type="button"
              onClick={() => setParams({}, { replace: true })}
              className={adminActionClass('ghost')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
              All tours
            </button>
            {tour && (
              <button type="button" onClick={dropTour} className={adminActionClass('danger')}>
                <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                Delete tour
              </button>
            )}
          </>
        }
      >
        {!tour ? (
          <AdminCard>
            <p className="p-6 text-sm text-gray-600">
              {loading ? 'Loading…' : 'That tour could not be found.'}
            </p>
          </AdminCard>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                Who and when
              </h2>
              <AdminCard>
                <form onSubmit={save} className="space-y-5 p-6">
                  <DetailsFields idPrefix="tour" value={details} onChange={setDetails} />
                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      type="submit"
                      disabled={busy || !unsaved}
                      className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/80 disabled:opacity-50"
                    >
                      {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                      Save changes
                    </button>
                    {unsaved && (
                      <p className="text-xs text-amber-800">
                        Not saved yet — the schedule below still uses the old details.
                      </p>
                    )}
                  </div>
                </form>
              </AdminCard>
            </section>

            <section>
              <h2 className="numeral mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                Stops ({tour.stops.length})
              </h2>
              <AdminCard>
                {tour.stops.length === 0 ? (
                  <p className="p-6 text-sm text-gray-600">
                    No stops yet. Add the first one below — they sort themselves by time.
                  </p>
                ) : (
                  <ol className="divide-y divide-gray-100">
                    {tour.stops.map((stop) => (
                      <li key={stop.id} className="flex flex-wrap items-start gap-x-6 gap-y-2 px-6 py-4">
                        <div className="w-24 shrink-0">
                          <p className="numeral text-base font-semibold text-ink">
                            {formatStopTime(stop.startsAt)}
                          </p>
                          <p className="text-xs uppercase tracking-wide text-champagne-ink">
                            {STOP_KINDS.find((k) => k.value === stop.kind)?.label}
                          </p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="numeral text-sm font-medium text-ink">
                            {[stop.address, stop.town].filter(Boolean).join(', ')}
                          </p>
                          <p className="numeral mt-0.5 text-xs text-gray-500">
                            {stop.listPrice !== null && `${formatPrice(stop.listPrice)} · `}
                            {stop.mlsNumber ? `MLS ${stop.mlsNumber}` : 'Not in the MLS feed — no link'}
                          </p>
                          {stop.note && <p className="mt-1 text-sm text-gray-700">{stop.note}</p>}
                        </div>
                        {stop.mlsNumber && (
                          <a
                            href={`/search/${stop.mlsNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-champagne-ink hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                            View page
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => dropStop(stop.id)}
                          className="text-xs font-medium text-red-700 hover:underline"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
                <AddStopForm tourId={tour.id} onAdded={load} />
              </AdminCard>
            </section>

            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                Send it
              </h2>
              <AdminCard>
                <DeliveryPanel
                  tour={tour}
                  onSent={(sentAt) =>
                    setTours((rows) => rows.map((t) => (t.id === tour.id ? { ...t, sentAt } : t)))
                  }
                />
              </AdminCard>
            </section>
          </div>
        )}
      </AdminShell>
    );
  }

  /* ---- List ---------------------------------------------------------- */
  return (
    <AdminShell
      title="Showings"
      description="Put a day of showings in order and send the client one schedule, by email or as a text."
      actions={
        <button
          type="button"
          onClick={() => {
            setDraft({ ...BLANK_DETAILS, tourDate: todayInBoston() });
            setShowNew((v) => !v);
          }}
          className={adminActionClass('primary')}
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden />
          New tour
        </button>
      }
    >
      {showNew && (
        <AdminCard className="mb-8">
          <form onSubmit={create} className="space-y-5 p-6">
            <DetailsFields idPrefix="new" value={draft} onChange={setDraft} />
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/80 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
              Create tour and add stops
            </button>
          </form>
        </AdminCard>
      )}

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-champagne-ink" aria-hidden />
        </div>
      ) : tours.length === 0 ? (
        <AdminCard>
          <p className="p-6 text-sm text-gray-600">
            No tours yet. Press New tour, name the client and the day, then add each home with its
            time.
          </p>
        </AdminCard>
      ) : (
        <AdminCard>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Client</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Stops</th>
                <th className="px-6 py-3 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody>
              {tours.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setParams({ id: t.id })}
                  className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-bone"
                >
                  <td className="px-6 py-4">
                    <span className="font-medium text-ink">{t.clientName}</span>
                    <span className="numeral block text-xs text-gray-500">
                      {[t.clientEmail, t.clientPhone].filter(Boolean).join(' · ')}
                    </span>
                  </td>
                  <td className="numeral px-6 py-4 text-gray-700">{formatTourDate(t.tourDate)}</td>
                  <td className="numeral px-6 py-4 text-gray-700">{t.stops.length}</td>
                  <td className="numeral px-6 py-4 text-gray-700">
                    {t.sentAt ? `Sent ${sentStamp(t.sentAt)}` : 'Not sent'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminCard>
      )}
    </AdminShell>
  );
}
