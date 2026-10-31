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
import { ArrowLeft, ChevronRight, ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react';
import AdminShell, { ADMIN_BUTTON, AdminCard, adminActionClass } from '@/components/AdminShell';
import AdminList from '@/components/admin/AdminList';
import ListingLookup from '@/components/admin/ListingLookup';
import MessagePanel, { type MessageWords } from '@/components/admin/MessagePanel';
import PeopleFields from '@/components/admin/PeopleFields';
import ShowingReminders from '@/components/admin/ShowingReminders';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useViewScroll } from '@/hooks/useViewScroll';
import { formatPrice } from '@/lib/listings';
import { sentenceList } from '@/lib/utils';
import { listingPath } from '@/lib/listingUrl';
import type { ListingSuggestion } from '@/lib/idxSearch';
import {
  STOP_KINDS,
  addStop,
  blankPerson,
  createTour,
  deleteTour,
  draftOf,
  formatStopTime,
  formatTourDate,
  isBlankPerson,
  listTours,
  previewSchedule,
  removeStop,
  sentStamp,
  sendSchedule,
  todayInBoston,
  tourNames,
  tourSaveMessage,
  updateTour,
  type ShowingTour,
  type StopKind,
  type TourDetails,
} from '@/lib/showingTours';

const FIELD =
  'h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-ink focus:border-champagne focus:outline-none focus:ring-1 focus:ring-champagne';

/** What the panel says, in this page's words. */
const SCHEDULE_WORDS: MessageWords = {
  textLede:
    'Writes the schedule as a text for you to send yourself. Nothing is sent from here, and no email goes out.',
  textLabel: 'The schedule as a text message',
  emailLede: (who) => `Sends the schedule to ${who} with a calendar file attached, and a copy to you.`,
  noEmail:
    'Nobody on this tour has an email address. Add one above to email it, or send it as a text.',
  sentTitle: 'Schedule emailed',
  buildError: 'Could not build the schedule',
  notReady: 'Add at least one stop above and both of these come to life.',
};

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

  return (
    <div className="space-y-5">
      <PeopleFields
        idPrefix={idPrefix}
        people={value.people}
        onChange={(people) => onChange({ ...value, people })}
        firstRequired
        removeFrom="this tour"
        hint={(several) =>
          several
            ? 'One email or phone across the group is enough. The email goes to everyone with an address.'
            : 'Email or phone — one is enough.'
        }
      />

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
    <form onSubmit={submit} className="grid gap-4 border-t border-gray-200 bg-gray-50/60 p-4 sm:grid-cols-6 sm:p-6">
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
        <NativeSelect
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
        </NativeSelect>
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
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AdminShowings() {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const openId = params.get('id');
  useViewScroll(openId ?? '');

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
              <ArrowLeft className="h-4 w-4" aria-hidden />
              All tours
            </button>
            {tour && (
              <button type="button" onClick={dropTour} className={adminActionClass('danger')}>
                <Trash2 className="h-4 w-4" aria-hidden />
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
                <form onSubmit={save} className="space-y-5 p-4 sm:p-6">
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
                  <p className="p-4 text-sm text-gray-600 sm:p-6">
                    No stops yet. Add the first one below — they sort themselves by time.
                  </p>
                ) : (
                  <ol className="divide-y divide-gray-100">
                    {tour.stops.map((stop) => (
                      /* On a phone the time and its kind are one line and the
                         address has the whole width under it. Side by side, the
                         two links beside the address left it a column a word
                         wide — "101 / Waite / St / Unit / C5", one per line. */
                      <li key={stop.id} className="px-4 py-4 sm:flex sm:items-start sm:gap-6 sm:px-6">
                        <div className="flex items-baseline gap-3 sm:block sm:w-24 sm:shrink-0">
                          <p className="numeral text-base font-semibold text-ink">
                            {formatStopTime(stop.startsAt)}
                          </p>
                          <p className="text-xs uppercase tracking-wide text-champagne-ink">
                            {STOP_KINDS.find((k) => k.value === stop.kind)?.label}
                          </p>
                        </div>
                        <div className="mt-1 min-w-0 flex-1 sm:mt-0">
                          <p className="numeral text-sm font-medium text-ink">
                            {[stop.address, stop.town].filter(Boolean).join(', ')}
                          </p>
                          <p className="numeral mt-0.5 text-xs text-gray-500">
                            {stop.listPrice !== null && `${formatPrice(stop.listPrice)} · `}
                            {stop.mlsNumber ? `MLS ${stop.mlsNumber}` : 'Not in the MLS feed — no link'}
                          </p>
                          {stop.note && <p className="mt-1 text-sm text-gray-700">{stop.note}</p>}
                        </div>
                        <div className="mt-2 flex items-center gap-5 sm:mt-0 sm:shrink-0">
                          {stop.mlsNumber && (
                            <a
                              href={listingPath({ ...stop, mls_number: stop.mlsNumber })}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 py-1 text-xs font-medium text-champagne-ink hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                              View page
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => dropStop(stop.id)}
                            className="py-1 text-xs font-medium text-red-700 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
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
                <MessagePanel
                  people={tour.people}
                  sentAt={tour.sentAt}
                  // `sentAt` is left out: stamping it is not an edit to the
                  // schedule, and closing the preview the moment the email goes
                  // would look like a failure.
                  fingerprint={JSON.stringify({ ...tour, sentAt: null })}
                  ready={tour.stops.length > 0}
                  build={() => previewSchedule(tour.id)}
                  send={async () => ({ sentAt: await sendSchedule(tour.id) })}
                  onSent={(sentAt) =>
                    setTours((rows) => rows.map((t) => (t.id === tour.id ? { ...t, sentAt } : t)))
                  }
                  words={SCHEDULE_WORDS}
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
          <Plus className="h-4 w-4" aria-hidden />
          New tour
        </button>
      }
    >
      {showNew && (
        <AdminCard className="mb-8">
          <form onSubmit={create} className="space-y-5 p-4 sm:p-6">
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

      <ShowingReminders />

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
          <AdminList
            label="Showing tours"
            columns={[
              { label: 'Who', primary: true },
              { label: 'Date' },
              { label: 'Stops' },
              { label: 'Email' },
              { label: '', end: true },
            ]}
            grid="md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,0.5fr)_minmax(0,1.1fr)_1rem]"
            rows={tours.map((t) => ({
              key: t.id,
              to: `?id=${encodeURIComponent(t.id)}`,
              cells: [
                <span key="w" className="block min-w-0">
                  <span className="block font-medium text-ink">{tourNames(t)}</span>
                  <span className="numeral block break-words text-xs text-gray-500">
                    {t.people
                      .flatMap((p) => [p.email, p.phone])
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>,
                formatTourDate(t.tourDate),
                t.stops.length,
                t.sentAt ? `Sent ${sentStamp(t.sentAt)}` : 'Not sent',
                <ChevronRight key="c" className="hidden h-4 w-4 text-gray-400 md:block" aria-hidden />,
              ],
            }))}
          />
        </AdminCard>
      )}
    </AdminShell>
  );
}
