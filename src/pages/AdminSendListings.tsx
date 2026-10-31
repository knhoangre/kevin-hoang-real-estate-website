/**
 * /admin/send-listings — homes a client may be interested in, as one text or one
 * email, without assembling the address, the number and the link by hand.
 *
 * Type an address or paste an MLS number and the home goes on the list; paste
 * several and they all do. Then the same two buttons as a showing tour: a text
 * Kevin sends himself, or an email sent from here.
 *
 * NOTHING HAS TO BE CREATED FIRST. A tour has a date and stops, so it is made and
 * then filled in; this is a page Kevin opens with three numbers on his clipboard.
 * The form is the page, and the row is saved the first time a message is
 * generated, so typing and walking away leaves nothing behind. It stays folded to
 * the one field until a home is on it, which keeps what is below in reach.
 *
 * EACH CLIENT HAS THEIR OWN. The page lists clients; `?client=<key>` is one of
 * them, with everything they have been sent and a new message already addressed;
 * `?id=` is one message opened from there. There is no client table to keep: see
 * clientsFrom() in listingSend.ts.
 *
 * NOBODY HAS TO BE ON IT. A lot of these go into a Zillow chat, with no phone or
 * email to give. The text then opens "Hi," and is there to copy.
 *
 * The URL says what was OPENED, not what is being typed. Saving does not touch it:
 * changing it would run this page's view change, and take Kevin back to the top of
 * the page at the moment he pressed a button at the bottom of it.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react';
import AdminShell, { AdminCard, adminActionClass } from '@/components/AdminShell';
import AdminList from '@/components/admin/AdminList';
import ListingLookup from '@/components/admin/ListingLookup';
import MessagePanel, { type MessageWords } from '@/components/admin/MessagePanel';
import PeopleFields from '@/components/admin/PeopleFields';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useViewScroll } from '@/hooks/useViewScroll';
import {
  isWorthLookingUp,
  lastSyncedAt,
  listingsByNumber,
  statusLabel,
  suggestListings,
  type ListingSuggestion,
} from '@/lib/idxSearch';
import {
  MAX_HOMES,
  NOT_AVAILABLE,
  NO_CLIENT,
  clientContact,
  clientName,
  clientsFrom,
  draftKey,
  draftProblem,
  feedIsStale,
  homeFromListing,
  homeLine,
  mlsNumbersIn,
  nextPeople,
  withHomes,
  type SendClient,
  type SendHome,
} from '@/lib/listingSend';
import {
  createSend,
  deleteSend,
  emailSend,
  listSends,
  previewSend,
  updateSend,
  type ListingSend,
} from '@/lib/listingSendStore';
import { formatPrice } from '@/lib/listings';
import { listingPath } from '@/lib/listingUrl';
import {
  blankPerson,
  draftOf,
  isBlankPerson,
  sentStamp,
  tourSaveMessage,
  type PersonDraft,
} from '@/lib/showingTours';

const WORDS: MessageWords = {
  textLede:
    'Writes these homes as a text, with each address, price and link. Copy it into a chat or open it in Messages. Nothing is sent from here.',
  textLabel: 'The homes as a text message',
  emailLede: (who) => `Sends these homes to ${who}, with a photo of each and a copy to you.`,
  noEmail: 'Nobody here has an email address. Add one above to email it, or send it as a text.',
  sentTitle: 'Listings emailed',
  buildError: 'Could not write the message',
  notReady: 'Add at least one home above and both of these come to life.',
};

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const peopleDrafts = (send: ListingSend): PersonDraft[] =>
  send.people.length > 0 ? send.people.map(draftOf) : [blankPerson()];

const keyOf = (send: ListingSend): string =>
  draftKey(send.people.map(draftOf), send.homes, send.note ?? '');

const SECTION_HEADING = 'mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500';

export default function AdminSendListings() {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const openId = params.get('id');
  const clientKey = params.get('client');
  const view = openId ? `id:${openId}` : clientKey ? `client:${clientKey}` : '';
  useViewScroll(view);

  const [rows, setRows] = useState<ListingSend[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedAsOf, setFeedAsOf] = useState<string | null>(null);

  // The message on the form.
  const [people, setPeople] = useState<PersonDraft[]>(() => [blankPerson()]);
  const [homes, setHomes] = useState<SendHome[]>([]);
  const [note, setNote] = useState('');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState<string | null>(null);

  // The field that adds a home.
  const [term, setTerm] = useState('');
  const [finding, setFinding] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const lookupRef = useRef<HTMLInputElement>(null);

  const clients = useMemo(() => clientsFrom(rows), [rows]);
  // Whose page this is: the client in the URL, or the one the opened message is for.
  const client =
    clients.find((c) =>
      openId ? c.sends.some((s) => s.id === openId) : clientKey ? c.key === clientKey : false
    ) ?? null;

  useEffect(() => {
    void listSends()
      .then(setRows)
      .catch((err) => {
        console.error('Could not load sent listings:', err);
        toast({ variant: 'destructive', title: 'Could not load', description: 'Refresh the page to try again.' });
      })
      .finally(() => setLoading(false));
    void lastSyncedAt().then(setFeedAsOf).catch(() => undefined);
  }, [toast]);

  const startBlank = useCallback(() => {
    setPeople([blankPerson()]);
    setHomes([]);
    setNote('');
    setCurrentId(null);
    setSavedKey(null);
    setSentAt(null);
    setTerm('');
    setProblem(null);
  }, []);

  /** A new message to somebody: whoever was on their last one, with row ids of its own. */
  const startFor = useCallback(
    (who: SendClient<ListingSend>) => {
      startBlank();
      const next = nextPeople(who);
      if (next.length > 0) {
        setPeople(next.map((p) => ({ ...draftOf(p), id: blankPerson().id })));
      }
    },
    [startBlank]
  );

  /*
   * The form follows the URL only when the URL changes: a client or a message
   * opened from a list, or Back from one. `seen` is what stops a reload of the
   * rows, which every save does, from re-seeding the form under somebody's typing.
   */
  const seen = useRef('');
  useEffect(() => {
    if (view === seen.current) return;
    if (!view) {
      seen.current = '';
      startBlank();
      return;
    }
    if (loading) return; // This runs again when they are in.
    if (openId) {
      const row = rows.find((r) => r.id === openId);
      if (!row) {
        setParams({}, { replace: true });
        return;
      }
      seen.current = view;
      setPeople(peopleDrafts(row));
      setHomes(row.homes);
      setNote(row.note ?? '');
      setCurrentId(row.id);
      setSavedKey(keyOf(row));
      setSentAt(row.sentAt);
      setTerm('');
      setProblem(null);
      return;
    }
    const opened = clients.find((c) => c.key === clientKey);
    if (!opened) {
      setParams({}, { replace: true });
      return;
    }
    seen.current = view;
    startFor(opened);
  }, [view, loading, openId, clientKey, rows, clients, startBlank, startFor, setParams]);

  /* ---- Adding homes --------------------------------------------------- */

  const add = (listings: ListingSuggestion[]) => {
    const added = listings.map(homeFromListing);
    // The list is set from whatever it is by then: a lookup may have overlapped.
    setHomes((current) => withHomes(current, added).homes);
    const { homes: next, dropped } = withHomes(homes, added);
    if (dropped.length > 0) {
      setProblem(`One message can list ${MAX_HOMES} homes. ${dropped.map(homeLine).join(', ')} did not fit.`);
    } else if (added.length === 1 && next.length === homes.length) {
      setProblem(`${homeLine(added[0])} is already on this message.`);
    }
  };

  /** Numbers, however they arrived. What is not in the feed is named, not dropped silently. */
  const addNumbers = async (numbers: string[]) => {
    setFinding(true);
    setProblem(null);
    try {
      const found = await listingsByNumber(numbers);
      // In the order they were pasted, which is the order Kevin was reading them.
      add(numbers.flatMap((n) => found.filter((l) => l.mls_number === n)));
      setTerm('');
      const missing = numbers.filter((n) => !found.some((l) => l.mls_number === n));
      if (missing.length > 0) {
        setProblem(
          `Not in the MLS feed: ${missing.join(', ')}. Check ${missing.length === 1 ? 'the number' : 'the numbers'}.`
        );
      }
    } catch (err) {
      console.error('Could not look up the listings:', err);
      setProblem('Could not look that up. Please try again.');
    } finally {
      setFinding(false);
    }
  };

  /** A number or a link goes straight on. An address is left to be typed, and suggests. */
  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const numbers = mlsNumbersIn(e.clipboardData.getData('text'));
    if (numbers.length === 0) return;
    e.preventDefault();
    void addNumbers(numbers);
  };

  /** Enter, or Go on a phone, with text in the field and no row highlighted. */
  const submitTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = term.trim();
    if (!text || finding) return;
    const numbers = mlsNumbersIn(text);
    if (numbers.length > 0) {
      await addNumbers(numbers);
      return;
    }
    if (!isWorthLookingUp(text)) return;
    setFinding(true);
    setProblem(null);
    try {
      const matches = await suggestListings(text, undefined, [], 'all');
      if (matches.length === 1) {
        add(matches);
        setTerm('');
      } else {
        setProblem(
          matches.length === 0
            ? 'No listing matches that. Check the address, or use the MLS number.'
            : 'Several listings match that. Pick one from the list.'
        );
      }
    } catch (err) {
      console.error('Could not look up the address:', err);
      setProblem('Could not look that up. Please try again.');
    } finally {
      setFinding(false);
    }
  };

  /* ---- Saving, which generating does ----------------------------------- */

  const key = draftKey(people, homes, note);

  /**
   * The saved row this form describes, saving it first if it has changed. The
   * text and the email can both be pressed before the first save has answered,
   * and two inserts would be two messages in the list, so they share one.
   */
  const saving = useRef<Promise<string> | null>(null);
  const persist = (): Promise<string> => {
    if (currentId && key === savedKey) return Promise.resolve(currentId);
    if (saving.current) return saving.current;

    const write = async () => {
      const issue = draftProblem(people, homes);
      if (issue) throw new Error(issue);
      try {
        const draft = { people, homes, note };
        const saved = currentId ? await updateSend(currentId, draft) : await createSend(draft);
        setCurrentId(saved.id);
        setSavedKey(keyOf(saved));
        setRows((all) => [saved, ...all.filter((r) => r.id !== saved.id)]);
        // From what the database kept: that is where "In your CRM" comes from.
        setPeople(peopleDrafts(saved));
        return saved.id;
      } catch (err) {
        console.error('Could not save the message:', err);
        throw new Error(tourSaveMessage(err) ?? 'Could not save it. Please try again.');
      }
    };

    saving.current = write().finally(() => {
      saving.current = null;
    });
    return saving.current;
  };

  /** A clean form, still for the same client if this is their page. */
  const startOver = () => {
    if (openId) {
      setParams(client ? { client: client.key } : {});
    } else {
      if (client) startFor(client);
      else startBlank();
      window.scrollTo(0, 0);
    }
    lookupRef.current?.focus();
  };

  const remove = async () => {
    if (!currentId) return;
    if (!window.confirm('Delete this message from the list? Anything already sent stays sent.')) return;
    try {
      await deleteSend(currentId);
      const left = rows.filter((r) => r.id !== currentId);
      setRows(left);
      // Back to whoever it was for, if they have anything else. Their key may have
      // moved, if this was their oldest message.
      const other = client?.sends.find((s) => s.id !== currentId);
      const still = other ? clientsFrom(left).find((c) => c.sends.some((s) => s.id === other.id)) : null;
      if (still && clientKey === still.key && !openId) {
        startFor(still);
      } else {
        startBlank();
        if (openId || clientKey) setParams(still ? { client: still.key } : {}, { replace: true });
      }
    } catch (err) {
      console.error('Could not delete the message:', err);
      toast({ variant: 'destructive', title: 'Could not delete it' });
    }
  };

  const named = people
    .filter((p) => !isBlankPerson(p))
    .map((p) => ({
      id: p.id,
      name: p.name.trim(),
      email: p.email.trim().toLowerCase() || null,
      phone: p.phone.trim() || null,
    }));
  const stale = feedAsOf !== null && feedIsStale(feedAsOf, Date.now());

  return (
    <AdminShell
      title={client ? clientName(client) : 'Send listings'}
      description={
        client
          ? clientContact(client) || 'No email or phone on file.'
          : 'Put in an address or an MLS number, then press a button for a text or an email with every home’s details and link.'
      }
      actions={
        <>
          {view && (
            <button type="button" onClick={() => setParams({})} className={adminActionClass('ghost')}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              All clients
            </button>
          )}
          {(currentId || homes.length > 0) && (
            <button type="button" onClick={startOver} className={adminActionClass('primary')}>
              <Plus className="h-4 w-4" aria-hidden />
              New message
            </button>
          )}
          {currentId && (
            <button type="button" onClick={remove} className={adminActionClass('danger')}>
              <Trash2 className="h-4 w-4" aria-hidden />
              Delete
            </button>
          )}
        </>
      }
    >
      <div className="space-y-8">
        <section>
          <h2 className={`numeral ${SECTION_HEADING}`}>
            Homes{homes.length > 0 ? ` (${homes.length})` : ''}
          </h2>
          {/* Not an AdminCard: that is overflow-hidden, and the suggestions drop
              below this field, past the bottom edge of an empty card. */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <form onSubmit={submitTerm} className="space-y-1.5 p-4 sm:p-6">
              <Label htmlFor="send-lookup">Address or MLS number</Label>
              <div className="relative">
                <ListingLookup
                  id="send-lookup"
                  scope="all"
                  inputRef={lookupRef}
                  placeholder="Start typing — 12 elm, or paste 73524017"
                  value={term}
                  onChange={(value) => {
                    setTerm(value);
                    setProblem(null);
                  }}
                  onSelect={(picked) => {
                    setTerm('');
                    setProblem(null);
                    add([picked]);
                  }}
                  inputProps={{ onPaste }}
                />
                {finding && (
                  <Loader2
                    className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400"
                    aria-label="Looking it up"
                  />
                )}
              </div>
              {problem ? (
                <p role="status" className="numeral text-xs text-amber-800">
                  {problem}
                </p>
              ) : (
                <p className="numeral text-xs text-gray-500">
                  Pasting MLS numbers or links from this site adds them straight away, several at once if you like.
                </p>
              )}
              {stale && feedAsOf && (
                <p className="numeral text-xs text-amber-800">
                  MLS PIN data was last updated {shortDate(feedAsOf)}. A home listed since then cannot be found
                  here, and prices may have changed.
                </p>
              )}
            </form>

            {homes.length > 0 && (
              <ol className="divide-y divide-gray-100 border-t border-gray-200">
                {homes.map((home) => {
                  const status = (home.status ?? '').trim().toUpperCase();
                  return (
                    /* On a phone the actions go under the address. Side by side,
                       they would leave it a column a word wide. */
                    <li key={home.mlsNumber} className="px-4 py-4 sm:flex sm:items-start sm:gap-6 sm:px-6">
                      <div className="min-w-0 flex-1">
                        <p className="numeral text-sm font-medium text-ink">
                          {[home.address, home.town, [home.state, home.zip].filter(Boolean).join(' ')]
                            .filter(Boolean)
                            .join(', ') || `MLS ${home.mlsNumber}`}
                        </p>
                        <p className="numeral mt-0.5 text-xs text-gray-500">
                          {formatPrice(home.listPrice)}
                          {home.propType === 'RN' ? '/mo' : ''} · MLS {home.mlsNumber}
                          {NOT_AVAILABLE.has(status) && (
                            <span className="font-semibold text-amber-800"> · {statusLabel(status)}</span>
                          )}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center gap-5 sm:mt-0 sm:shrink-0">
                        <a
                          href={listingPath({
                            mls_number: home.mlsNumber,
                            address: home.address,
                            town: home.town,
                            state: home.state,
                            zip: home.zip,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 py-1 text-xs font-medium text-champagne-ink hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          View page
                        </a>
                        <button
                          type="button"
                          onClick={() => setHomes((all) => all.filter((h) => h.mlsNumber !== home.mlsNumber))}
                          aria-label={`Remove ${homeLine(home)}`}
                          className="py-1 text-xs font-medium text-red-700 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </section>

        {homes.length > 0 && (
          <>
            <section>
              <h2 className={SECTION_HEADING}>Who it is for</h2>
              {/* Not an AdminCard either, for the name field's suggestions. */}
              <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <PeopleFields
                  idPrefix="send"
                  people={people}
                  onChange={setPeople}
                  removeFrom="this message"
                  filedBy="making the message"
                  hint={(several) =>
                    several
                      ? 'The email goes to everyone with an address.'
                      : 'Leave it empty to paste the text into a Zillow chat.'
                  }
                />
                <div className="space-y-1.5">
                  <Label htmlFor="send-note">Note to the client</Label>
                  <Input
                    id="send-note"
                    autoComplete="off"
                    placeholder="These just came on. The first has the yard you wanted."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className={SECTION_HEADING}>Send it</h2>
              <AdminCard>
                <MessagePanel
                  people={named}
                  sentAt={sentAt}
                  fingerprint={key}
                  ready={homes.length > 0}
                  build={async () => previewSend(await persist())}
                  send={async () => {
                    const id = await persist();
                    const result = await emailSend(id);
                    setRows((all) =>
                      all.map((r) => (r.id === id ? { ...r, sentAt: result.sentAt } : r))
                    );
                    return result;
                  }}
                  onSent={setSentAt}
                  words={WORDS}
                />
              </AdminCard>
            </section>
          </>
        )}

        {loading ? (
          <div className="flex min-h-[10vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-champagne-ink" aria-hidden />
          </div>
        ) : client ? (
          <section>
            <h2 className={SECTION_HEADING}>
              {client.key === NO_CLIENT ? 'Sent with no client named' : `Sent to ${clientName(client)}`}
            </h2>
            <AdminCard>
              <AdminList
                label="Messages"
                columns={[
                  { label: 'Homes', primary: true },
                  { label: 'Made' },
                  { label: 'Email' },
                  { label: '', end: true },
                ]}
                grid="md:grid-cols-[minmax(0,2.6fr)_minmax(0,0.8fr)_minmax(0,1.2fr)_1rem]"
                rows={client.sends.map((row) => ({
                  key: row.id,
                  to: `?id=${encodeURIComponent(row.id)}`,
                  cells: [
                    <span key="h" className="block min-w-0">
                      {row.homes.map((home) => (
                        <span key={home.mlsNumber} className="numeral block break-words text-ink">
                          {homeLine(home)}
                        </span>
                      ))}
                      {row.id === currentId && (
                        <span className="mt-0.5 block text-xs font-semibold text-champagne-ink">On the form above</span>
                      )}
                    </span>,
                    shortDate(row.createdAt),
                    row.sentAt ? `Sent ${sentStamp(row.sentAt)}` : 'Not emailed',
                    <ChevronRight key="c" className="hidden h-4 w-4 text-gray-400 md:block" aria-hidden />,
                  ],
                }))}
              />
            </AdminCard>
          </section>
        ) : (
          clients.length > 0 && (
            <section>
              <h2 className={`numeral ${SECTION_HEADING}`}>Clients ({clients.length})</h2>
              <AdminCard>
                <AdminList
                  label="Clients"
                  columns={[
                    { label: 'Client', primary: true },
                    { label: 'Messages' },
                    { label: 'Homes' },
                    { label: 'Last' },
                    { label: '', end: true },
                  ]}
                  grid="md:grid-cols-[minmax(0,2.6fr)_minmax(0,0.7fr)_minmax(0,0.6fr)_minmax(0,0.7fr)_1rem]"
                  rows={clients.map((c) => ({
                    key: c.key,
                    to: `?client=${encodeURIComponent(c.key)}`,
                    cells: [
                      <span key="w" className="block min-w-0">
                        <span className="block font-medium text-ink">{clientName(c)}</span>
                        <span className="numeral block break-words text-xs text-gray-500">{clientContact(c)}</span>
                      </span>,
                      c.sends.length,
                      c.homeCount,
                      shortDate(c.lastAt),
                      <ChevronRight key="c" className="hidden h-4 w-4 text-gray-400 md:block" aria-hidden />,
                    ],
                  }))}
                />
              </AdminCard>
            </section>
          )
        )}
      </div>
    </AdminShell>
  );
}
