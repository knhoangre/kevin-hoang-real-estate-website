/**
 * /admin/showings — build a day of showings and hand the client one schedule.
 *
 * Kevin books the appointments and knows the open-house times; nothing here
 * looks either up (the MLS feed carries neither). What this does is put them in
 * order and turn them into something to send: every stop with its time, its
 * address and a link to that home on this site.
 *
 * A TOUR IS OFTEN MORE THAN ONE PERSON. A couple, or a buyer and a parent: each
 * has their own row with their own name, email and phone. The schedule greets
 * all of them by first name and the email goes to everyone who has an address.
 * Anyone typed here who is not in the CRM is filed there when the tour is saved
 * — by the database, not by this page (see showingTours.ts).
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
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import AdminShell, { ADMIN_BUTTON, AdminCard, adminActionClass } from '@/components/AdminShell';
import ListingLookup from '@/components/admin/ListingLookup';
import SuggestInput from '@/components/admin/SuggestInput';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { formatPrice } from '@/lib/listings';
import { formatPhoneInput } from '@/lib/phone';
import { smsHrefTo, smsHrefToGroup } from '@/lib/siteConfig';
import { sentenceList } from '@/lib/utils';
import type { ListingSuggestion } from '@/lib/idxSearch';
import {
  STOP_KINDS,
  addStop,
  blankPerson,
  canFileInCrm,
  createTour,
  deleteTour,
  draftOf,
  formatStopTime,
  formatTourDate,
  isBlankPerson,
  isWorthFindingClient,
  listTours,
  previewSchedule,
  removeStop,
  sendSchedule,
  suggestClients,
  todayInBoston,
  tourEmails,
  tourNames,
  tourSaveMessage,
  updateTour,
  type ClientSuggestion,
  type PersonDraft,
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

/** The most people one tour lists. The table enforces the same ceiling. */
const MAX_PEOPLE = 8;

/** A function, not a constant: each blank form needs a row with its own id. */
const blankDetails = (tourDate = ''): TourDetails => ({
  people: [blankPerson()],
  tourDate,
  note: '',
});

const detailsOf = (tour: ShowingTour): TourDetails => ({
  people: tour.people.length > 0 ? tour.people.map(draftOf) : [blankPerson()],
  tourDate: tour.tourDate,
  note: tour.note ?? '',
});

/**
 * What "has this form been edited" compares. Blank rows and `contactId` are
 * left out: a spare empty line is not an edit, and contactId is the database's
 * answer about a row rather than something typed into it.
 */
const comparable = (d: TourDetails) =>
  JSON.stringify({
    people: d.people
      .filter((p) => !isBlankPerson(p))
      .map((p) => [p.id, p.name.trim(), p.email.trim().toLowerCase(), p.phone.trim()]),
    tourDate: d.tourDate,
    note: d.note.trim(),
  });

/**
 * Everybody named, and at least one of them reachable. Mirrors the trigger on
 * showing_tours, so the usual mistakes are caught before a round trip — the
 * trigger's own message is still shown if it ever disagrees.
 */
const detailsProblem = (d: TourDetails): string | null => {
  const people = d.people.filter((p) => !isBlankPerson(p));
  if (people.length === 0) return 'Add the client’s name.';
  if (people.some((p) => !p.name.trim())) return 'Everyone on the tour needs a name.';
  if (!d.tourDate) return 'Choose the date.';
  if (!people.some((p) => p.email.trim() || p.phone.trim())) {
    return 'Add an email address or a phone number for at least one person.';
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

/**
 * The line under a person's row: whether they are in the CRM, and if not, what
 * saving will do about it. Kevin asked that nobody typed here goes missing from
 * the CRM, so the page says which of the three cases each row is rather than
 * leaving it to be found out later on /crm/contacts.
 */
const CrmLine = ({ person }: { person: PersonDraft }) => {
  if (isBlankPerson(person)) return null;
  if (person.contactId !== null) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-emerald-800">
        <Check className="h-3.5 w-3.5" aria-hidden />
        In your CRM
      </p>
    );
  }
  if (canFileInCrm(person)) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-champagne-ink">
        <UserPlus className="h-3.5 w-3.5" aria-hidden />
        Saving adds them to your CRM, if they are not in it already.
      </p>
    );
  }
  return (
    <p className="text-xs text-gray-500">
      Not in your CRM. Add a last name and an email or phone, and saving adds them.
    </p>
  );
};

const DetailsFields = ({
  idPrefix,
  value,
  onChange,
}: {
  idPrefix: string;
  value: TourDetails;
  onChange: (next: TourDetails) => void;
}) => {
  const set = (key: 'tourDate' | 'note') => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [key]: e.target.value });

  /**
   * Typing in a row. `contactId` is dropped with it: the row was known to be a
   * CRM contact as it stood, and an edited row is a claim nobody has checked
   * until the next save.
   */
  const typed = (id: string, patch: Partial<Pick<PersonDraft, 'name' | 'email' | 'phone'>>) =>
    onChange({
      ...value,
      people: value.people.map((p) => (p.id === id ? { ...p, ...patch, contactId: null } : p)),
    });

  const picked = (id: string, c: ClientSuggestion) =>
    onChange({
      ...value,
      people: value.people.map((p) =>
        p.id === id
          ? {
              ...p,
              name: c.name,
              // What the CRM has, without wiping something already typed here
              // when the CRM has nothing.
              email: c.email ?? p.email,
              phone: c.phone ? formatPhoneInput(c.phone) : p.phone,
              contactId: c.contactId,
            }
          : p
      ),
    });

  const remove = (id: string) =>
    onChange({ ...value, people: value.people.filter((p) => p.id !== id) });

  const several = value.people.length > 1;

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {value.people.map((person, i) => (
          /*
            A fieldset per person, so "Email" and "Phone" are announced as
            belonging to somebody. Keyed on the row's own id, not its position:
            removing the first of two must not hand the second one's typing to
            the first one's inputs.
          */
          <fieldset
            key={person.id}
            className={several ? 'rounded-lg border border-gray-200 p-4' : undefined}
          >
            <legend className={several ? 'numeral px-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500' : 'sr-only'}>
              Person {i + 1}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto]">
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                <Label htmlFor={`${idPrefix}-name-${person.id}`}>{i === 0 ? 'Client' : 'Name'}</Label>
                <SuggestInput<ClientSuggestion>
                  id={`${idPrefix}-name-${person.id}`}
                  required={i === 0}
                  placeholder="Start typing a name"
                  value={person.name}
                  onChange={(name) => typed(person.id, { name })}
                  onSelect={(c) => picked(person.id, c)}
                  worth={isWorthFindingClient}
                  suggest={suggestClients}
                  valueOf={clientName}
                  keyOf={clientKey}
                  renderItem={renderClient}
                  listLabel="Matching contacts"
                  footer="From your CRM. Somebody new? Keep typing — saving adds them."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${idPrefix}-email-${person.id}`}>Email</Label>
                <Input
                  id={`${idPrefix}-email-${person.id}`}
                  type="email"
                  autoComplete="off"
                  value={person.email}
                  onChange={(e) => typed(person.id, { email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${idPrefix}-phone-${person.id}`}>Phone</Label>
                <Input
                  id={`${idPrefix}-phone-${person.id}`}
                  type="tel"
                  inputMode="tel"
                  autoComplete="off"
                  placeholder="774-222-0952"
                  value={person.phone}
                  onChange={(e) => typed(person.id, { phone: formatPhoneInput(e.target.value) })}
                />
              </div>
              {several && (
                <div className="flex items-end sm:col-span-2 lg:col-span-1">
                  <button
                    type="button"
                    onClick={() => remove(person.id)}
                    aria-label={`Remove ${person.name.trim() || `person ${i + 1}`} from this tour`}
                    className="inline-flex h-10 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-red-700 hover:underline"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                    Remove
                  </button>
                </div>
              )}
            </div>
            <div className="mt-2">
              <CrmLine person={person} />
            </div>
          </fieldset>
        ))}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {value.people.length < MAX_PEOPLE && (
            <button
              type="button"
              onClick={() => onChange({ ...value, people: [...value.people, blankPerson()] })}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-champagne-ink hover:underline"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add another person
            </button>
          )}
          <p className="text-xs text-gray-500">
            {several
              ? 'One email or phone across the group is enough. The email goes to everyone with an address.'
              : 'Email or phone — one is enough.'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
          className={ADMIN_BUTTON}
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

const firstName = (name: string) => name.trim().split(/\s+/)[0];

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
  const emails = tourEmails(tour);
  const emailList = sentenceList(emails);
  const texting = tour.people.filter((p) => p.phone);
  // Asked once, after mount — this page is prerendered, and there is no
  // navigator there to ask. It only chooses which form of group link to write.
  const [apple, setApple] = useState(true);
  useEffect(() => {
    setApple(/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent));
  }, []);

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
    if (sending || emails.length === 0) return;
    setSending(true);
    try {
      const sentAt = await sendSchedule(tour.id);
      onSent(sentAt);
      toast({ title: 'Schedule emailed', description: `Sent to ${emailList}, with you on cc.` });
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
          className={ADMIN_BUTTON}
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
              {texting.length === 0 && (
                <span className="text-xs text-gray-500">
                  Add a phone number above to open it straight in Messages.
                </span>
              )}
            </div>
            {texting.length > 0 && (
              /* One link per person, always. With two or more there is also a
                 group link, FIRST because one thread is what a couple expects —
                 but it is the form Apple does not document (see smsHrefToGroup),
                 so the individual links are never replaced by it. */
              <ul className="space-y-2 border-t border-gray-100 pt-3">
                {texting.length > 1 && (
                  <li>
                    <a
                      href={smsHrefToGroup(
                        texting.map((p) => p.phone as string),
                        preview.text,
                        apple
                      )}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-champagne-ink hover:underline"
                    >
                      <Users className="h-4 w-4" aria-hidden />
                      Open one group text to {sentenceList(texting.map((p) => firstName(p.name)))}
                    </a>
                  </li>
                )}
                {texting.map((p) => (
                  <li key={p.id}>
                    <a
                      href={smsHrefTo(p.phone as string, preview.text)}
                      className="numeral inline-flex items-center gap-1.5 text-sm font-medium text-champagne-ink hover:underline"
                    >
                      <MessageSquare className="h-4 w-4" aria-hidden />
                      {texting.length > 1
                        ? `Text ${firstName(p.name)} only — ${p.phone}`
                        : `Open in Messages to ${p.phone}`}
                    </a>
                  </li>
                ))}
              </ul>
            )}
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
          {emails.length > 0
            ? `Sends the schedule to ${emailList} with a calendar file attached, and a copy to you.`
            : 'Nobody on this tour has an email address. Add one above to email it, or send it as a text.'}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={send}
            disabled={noStops || sending || emails.length === 0}
            className={ADMIN_BUTTON}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Mail className="h-4 w-4" aria-hidden />}
            {tour.sentAt ? 'Email it again' : emails.length > 1 ? `Email to all ${emails.length}` : 'Email to client'}
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
  const [draft, setDraft] = useState<TourDetails>(blankDetails);
  const [details, setDetails] = useState<TourDetails>(blankDetails);
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
      setDraft(blankDetails());
      setShowNew(false);
      setParams({ id: created.id });
    } catch (err) {
      console.error('Could not create the tour:', err);
      toast({
        variant: 'destructive',
        title: 'Could not create the tour',
        description: tourSaveMessage(err) ?? 'Please try again.',
      });
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
      const saved = await updateTour(tour.id, details);
      setTours((rows) => rows.map((t) => (t.id === saved.id ? saved : t)));
      // Re-seeded from what the database kept, not left as typed: that is
      // where each person's "In your CRM" comes from, and the trimmed and
      // lower-cased values are what "unsaved" has to compare against next.
      setDetails(detailsOf(saved));
      const added = saved.people.filter(
        (p) => p.contactId !== null && !tour.people.some((was) => was.contactId === p.contactId)
      );
      toast(
        added.length > 0
          ? {
              title: 'Saved',
              description: `${sentenceList(added.map((p) => p.name))} ${
                added.length === 1 ? 'is' : 'are'
              } in your CRM.`,
            }
          : { title: 'Saved' }
      );
    } catch (err) {
      console.error('Could not save the tour:', err);
      toast({
        variant: 'destructive',
        title: 'Could not save',
        description: tourSaveMessage(err) ?? 'Please try again.',
      });
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
    if (!window.confirm(`Delete the tour for ${tourNames(tour)}? Its stops go with it.`)) return;
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
    const unsaved = tour ? comparable(details) !== comparable(detailsOf(tour)) : false;

    return (
      <AdminShell
        title={tour ? tourNames(tour) : 'Showing tour'}
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
                      className={ADMIN_BUTTON}
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
            setDraft(blankDetails(todayInBoston()));
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
              className={ADMIN_BUTTON}
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
                <th className="px-6 py-3 font-semibold">Who</th>
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
                    <span className="font-medium text-ink">{tourNames(t)}</span>
                    <span className="numeral block text-xs text-gray-500">
                      {t.people
                        .flatMap((p) => [p.email, p.phone])
                        .filter(Boolean)
                        .join(' · ')}
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
