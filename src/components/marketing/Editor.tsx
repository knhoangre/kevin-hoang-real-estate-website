import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ImagePlus,
  MapPin,
  Plus,
  Printer,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { ADMIN_BUTTON } from '@/components/AdminShell';
import ListingLookup from '@/components/admin/ListingLookup';
import { ListError, ListLoading } from '@/components/admin/ListStates';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  MANUAL_PREFIX,
  MAX_ZOOM_MAP,
  MIN_ZOOM,
  PLACE_GROUPS,
  mapMilesAcross,
  mergeFound,
  type Around,
  type Place,
  type PlaceGroup,
} from '@/lib/around';
import { findNearby, locate } from '@/lib/aroundFetch';
import { listingByMls, officeName, type ListingSuggestion } from '@/lib/idxSearch';
import {
  DOC_KINDS,
  MAX_AGENTS,
  MAX_ZOOM,
  blankAgent,
  blankRow,
  designOf,
  designsFor,
  docTitle,
  familyOf,
  getPhoto,
  placed,
  refreshPrice,
  rowsFromText,
  seedFromListing,
  setPhoto,
  slotsOf,
  type Agent,
  type MarketingDoc,
  type Photo,
  type PhotoSource,
  type Row,
  type Stat,
} from '@/lib/marketing';
import { loadDoc, saveDoc, sourceUrl, uploadImage } from '@/lib/marketingStore';
import DocFrame, { type DocFrameHandle } from './DocFrame';
import PhotoPicker from './PhotoPicker';
import { DocProvider } from './Pic';
import DocPages from './designs';

/**
 * The editor for one marketing document: the words and choices on the left, the
 * sheet of paper on the right.
 *
 * THE PAPER IS LIVE. Every field redraws it as it is typed, and its pictures
 * are adjusted on it — click one to select it, drag it, zoom it with the
 * slider above. There is no "preview" step, because the thing on the right is
 * the thing that prints (DocFrame).
 *
 * IT SAVES ITSELF, a moment after the last change, and says so. A document here
 * is an hour of choosing and cropping; a Save button is one more thing to
 * forget before closing the tab. Printing and leaving both wait for the save.
 *
 * Nothing is validated and nothing is required. A booklet with no price prints
 * with no price block; a design draws what there is.
 */

const SAVE_AFTER_MS = 1200;

type SaveState = 'saved' | 'unsaved' | 'saving' | 'failed';

const SAVE_LABEL: Record<SaveState, string> = {
  saved: 'Saved',
  unsaved: 'Saving…',
  saving: 'Saving…',
  failed: 'Not saved — check your connection',
};

const SMALL_BUTTON =
  'inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-champagne hover:bg-champagne hover:text-ink-deep disabled:pointer-events-none disabled:opacity-50';

const ICON_BUTTON =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-bone hover:text-ink disabled:pointer-events-none disabled:opacity-30';

const Section = ({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  /*
    AdminCard's look WITHOUT its `overflow-hidden`. The listing field's
    suggestions drop below it, past the bottom of this card, and a card that
    clips its contents cut them off at the edge: results were found and none
    could be seen, which Kevin met as "nothing appears" on 2026-10-10. Nothing
    in these sections needs clipping — they hold fields, not a table.
  */
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
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      className="mt-1.5"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
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

const Editor = ({ id, onClose }: { id: string; onClose: () => void }) => {
  const { toast } = useToast();
  const [doc, setDoc] = useState<MarketingDoc | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>('saved');
  const [selected, setSelected] = useState<string | null>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lookup, setLookup] = useState('');
  const [busy, setBusy] = useState(false);
  const [finding, setFinding] = useState(false);
  /** What the last "Find what's nearby" could not do, in a sentence. */
  const [findNote, setFindNote] = useState<string | null>(null);

  const frame = useRef<DocFrameHandle>(null);
  // The latest document, for the save that fires after the render that made it.
  const latest = useRef<MarketingDoc | null>(null);
  const dirty = useRef(false);
  const timer = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const stored = await loadDoc(id);
      if (!stored) {
        setLoadError('That document no longer exists.');
        return;
      }
      latest.current = stored.doc;
      setDoc(stored.doc);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not open the document.');
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
    if (!dirty.current || !latest.current) return;
    dirty.current = false;
    setSave('saving');
    try {
      await saveDoc(id, latest.current);
      // Something changed while that was in flight: it is not saved yet.
      setSave(dirty.current ? 'unsaved' : 'saved');
    } catch (err) {
      dirty.current = true;
      setSave('failed');
      console.error('Could not save the document:', err);
    }
  }, [id]);

  /** Every edit goes through here: redraw now, save shortly. */
  const change = useCallback(
    (update: (doc: MarketingDoc) => MarketingDoc) => {
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

  const set = <K extends keyof MarketingDoc>(key: K, value: MarketingDoc[K]) =>
    change((d) => ({ ...d, [key]: value }));

  const put = useCallback(
    (key: string, photo: Photo | null) => change((d) => setPhoto(d, key, photo)),
    [change]
  );

  const slots = useMemo(() => (doc ? slotsOf(doc) : []), [doc]);
  const fits = useMemo(
    () => Object.fromEntries(slots.map((s) => [s.key, s.fit])) as Record<string, 'cover' | 'contain'>,
    [slots]
  );
  const labelOf = (key: string) => slots.find((s) => s.key === key)?.label ?? 'Picture';

  /* ------------------------------------------------------------- the listing */

  const chooseListing = async (suggestion: ListingSuggestion) => {
    setLookup(suggestion.address ?? '');
    setBusy(true);
    try {
      const listing = await listingByMls(suggestion.mls_number);
      if (!listing) throw new Error('That listing is no longer in the MLS feed.');
      const office = await officeName(listing.list_office_id).catch(() => null);
      change((d) => seedFromListing(d, listing, office));
      setSelected(null);
      setLookup('');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could not load that listing',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setBusy(false);
    }
  };

  const updatePrice = async () => {
    if (!doc?.mls) return;
    setBusy(true);
    try {
      const listing = await listingByMls(doc.mls);
      if (!listing) {
        toast({
          title: 'That listing has left the MLS feed',
          description: 'The price printed here is the last one it had.',
        });
        return;
      }
      const before = doc.price;
      change((d) => refreshPrice(d, listing));
      const after = refreshPrice(doc, listing).price;
      toast({ title: after === before ? `Still ${after || 'unpriced'}` : `Price is now ${after}` });
    } catch {
      toast({ variant: 'destructive', title: 'Could not reach MLS', description: 'Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  /* ---------------------------------------------------------------- pictures */

  const choose = (src: PhotoSource) => {
    if (picking) {
      put(picking, placed(src));
      setSelected(picking);
    }
    setPicking(null);
  };

  const upload = async (files: File[]) => {
    const into = picking;
    setUploading(true);
    let placedOne = false;
    for (const file of files) {
      try {
        const path = await uploadImage(id, file);
        // The first one uploaded goes in the frame being filled; the rest wait
        // in the picker. Decided HERE, not inside the updater below: React runs
        // that later, by which time the flag has moved on.
        const intoFrame = into !== null && !placedOne;
        placedOne = true;
        change((d) => {
          const withFile = { ...d, uploads: [...d.uploads, path] };
          return intoFrame && into
            ? setPhoto(withFile, into, placed({ type: 'upload', path }))
            : withFile;
        });
        if (intoFrame) {
          setSelected(into);
          setPicking(null);
        }
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'A picture was not added',
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    }
    setUploading(false);
  };

  const print = async () => {
    await flush();
    await frame.current?.print();
  };

  /* ------------------------------------------------------------------ render */

  if (loadError) return <ListError message={loadError} onRetry={() => void load()} />;
  if (!doc) return <ListLoading label="Opening" />;

  const design = designOf(doc);
  const kind = DOC_KINDS.find((k) => k.id === doc.kind) ?? DOC_KINDS[0];
  const title = docTitle(doc);
  const chosen = selected ? getPhoto(doc, selected) : null;
  const sheet = familyOf(doc.kind) === 'sheet';
  // A booklet with Kevin's name on the cover reads as Kevin's listing. When the
  // office that listed the home is not one of the brokerages on the page, say so.
  const otherOffice =
    doc.office.trim() !== '' &&
    !doc.agents.some((a) => {
      const word = a.brokerage.trim().split(/\s+/)[0]?.toLowerCase();
      return word ? doc.office.toLowerCase().includes(word) : false;
    });

  /* ---------------------------------------------------------- around the home */

  const around = doc.around;
  const setAround = (patch: Partial<Around>) => change((d) => ({ ...d, around: { ...d.around, ...patch } }));
  const setPlace = (placeId: string, patch: Partial<Place>) =>
    change((d) => ({
      ...d,
      around: {
        ...d.around,
        places: d.around.places.map((p) => (p.id === placeId ? { ...p, ...patch } : p)),
      },
    }));
  const addPlace = (group: PlaceGroup) =>
    setAround({
      places: [
        ...around.places,
        {
          id: `${MANUAL_PREFIX}${Date.now()}`,
          group,
          name: '',
          note: '',
          distance: '',
          lat: null,
          lon: null,
          show: true,
        },
      ],
    });

  /**
   * Look the address up, then ask each source what is near it. Each list can
   * fail by itself (see aroundFetch); the ones that did are named, and keep
   * whatever they had.
   */
  const findAround = async () => {
    setFinding(true);
    setFindNote(null);
    try {
      const home = await locate(doc.street, doc.cityLine);
      if (!home) {
        setFindNote(
          'That address was not found on the Massachusetts map. Check the street and the town above — this works for Massachusetts addresses only.'
        );
        return;
      }
      const { places, failed } = await findNearby(home);
      const when = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      change((d) => ({ ...d, around: mergeFound({ ...d.around, on: true }, home, places, failed, when) }));
      if (failed.length > 0) {
        const names = failed.map((g) => PLACE_GROUPS.find((x) => x.id === g)?.label.toLowerCase() ?? g);
        setFindNote(
          `Could not load ${names.join(', ')} just now. The rest is in; press the button again in a minute, or add them by hand.`
        );
      }
    } catch (err) {
      console.error('Could not find what is nearby:', err);
      setFindNote('The address lookup did not answer. Check your connection and try again.');
    } finally {
      setFinding(false);
    }
  };

  const setAgent = (index: number, patch: Partial<Agent>) =>
    set(
      'agents',
      doc.agents.map((a, i) => (i === index ? { ...a, ...patch } : a))
    );
  const setStat = (index: number, patch: Partial<Stat>) =>
    set(
      'stats',
      doc.stats.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  const setRow = (index: number, patch: Partial<Row>) =>
    set(
      'rows',
      doc.rows.map((r, i) => (i === index ? { ...r, ...patch } : r))
    );

  /** Several lines pasted into one row become several rows. One line pastes as usual. */
  const pasteRows = (index: number, event: React.ClipboardEvent) => {
    const pasted = event.clipboardData.getData('text');
    if (!/\r?\n/.test(pasted.trim())) return;
    const rows = rowsFromText(pasted, doc.kind);
    if (rows.length === 0) return;
    event.preventDefault();
    const here = doc.rows[index];
    const empty = !here.label.trim() && !here.value.trim() && !here.date.trim();
    // The empty rows a new sheet starts with are not kept below a pasted list.
    const after = doc.rows.slice(index + 1).filter((r) => r.label.trim() || r.value.trim() || r.date.trim());
    set('rows', [...doc.rows.slice(0, empty ? index : index + 1), ...rows, ...after]);
  };

  return (
    <DocProvider value={{ doc, selected, select: setSelected, pick: setPicking, put, fits }}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => void flush().then(onClose)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-champagne-ink underline decoration-champagne underline-offset-4 hover:decoration-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All documents
          </button>
          <p className="numeral mt-2 truncate text-xl font-semibold tracking-tight text-ink">
            {title || `Untitled ${kind.label.toLowerCase()}`}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {kind.label} · {design.label} ·{' '}
            <span className={save === 'failed' ? 'font-medium text-red-700' : ''} aria-live="polite">
              {SAVE_LABEL[save]}
            </span>
          </p>
        </div>
        <div className="text-right">
          <button type="button" className={ADMIN_BUTTON} onClick={() => void print()}>
            <Printer className="h-4 w-4" aria-hidden />
            Print / Save as PDF
          </button>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-gray-500">
            {sheet
              ? 'Opens the print box with the page already set. Choose "Save as PDF" there for a file.'
              : around.on
                ? 'Pages 1 and 2 are the booklet: print them double-sided, flipping on the short edge, and fold. Page 3 is the neighborhood page: print it on its own sheet and tuck it inside.'
                : 'Print double-sided, flipping on the short edge, then fold in half. "Save as PDF" in the print box gives a file.'}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        {/* ------------------------------------------------------------ fields */}
        <div className="space-y-5">
          <Section
            title="Listing"
            hint={
              sheet
                ? 'Optional. Choosing a listing fills in the address and offers its photographs.'
                : 'Choose a listing and the booklet fills itself in. Everything can be changed afterwards.'
            }
          >
            <div>
              <Label htmlFor="mk-listing">Address or MLS number</Label>
              <div className="mt-1.5">
                <ListingLookup
                  id="mk-listing"
                  value={lookup}
                  onChange={setLookup}
                  onSelect={(listing) => void chooseListing(listing)}
                  scope="all"
                  placeholder={doc.mls ? 'Choose a different listing' : '151 Washington St, or 73568135'}
                />
              </div>
            </div>
            {doc.mls && (
              <div className="rounded-lg bg-bone p-3 text-sm text-gray-700">
                <p className="numeral">
                  MLS {doc.mls} · {doc.photoCount} {doc.photoCount === 1 ? 'photo' : 'photos'}
                  {doc.office && <> · Listed by {doc.office}</>}
                </p>
                {otherOffice && (
                  <p className="mt-2 text-xs leading-relaxed text-gray-600">
                    This is another office's listing. A booklet with your name on it reads as your
                    listing, so get the listing agent's OK before handing it out.
                  </p>
                )}
                <button
                  type="button"
                  className={`${SMALL_BUTTON} mt-3`}
                  disabled={busy}
                  onClick={() => void updatePrice()}
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  Update price from MLS
                </button>
              </div>
            )}
          </Section>

          <Section title="Design" hint="Switch at any time. Your words and pictures come with you.">
            <div className="space-y-2">
              {designsFor(doc.kind).map((option) => {
                const current = option.id === design.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={current}
                    onClick={() => {
                      set('design', option.id);
                      setSelected(null);
                    }}
                    className={`block w-full rounded-lg border p-3 text-left transition-colors ${
                      current
                        ? 'border-champagne bg-bone'
                        : 'border-gray-200 hover:border-champagne'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-display text-lg font-semibold tracking-tight text-ink">
                        {option.label}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-champagne-ink">
                        {option.origin === 'yours' ? 'Yours' : 'New'}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-gray-600">
                      {option.blurb}
                    </span>
                  </button>
                );
              })}
            </div>

            {design.uses.back && (
              <div>
                <p className="text-sm font-medium text-ink">Back panel</p>
                <div className="mt-2 flex gap-2">
                  {(
                    [
                      ['photos', 'Two photos'],
                      ['plan', 'Floor plan'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={doc.back === value}
                      onClick={() => {
                        set('back', value);
                        setSelected(null);
                      }}
                      className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                        doc.back === value
                          ? 'border-ink-deep bg-ink-deep text-white'
                          : 'border-gray-300 text-ink hover:border-champagne'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {doc.back === 'plan' && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs leading-relaxed text-gray-600">
                      Upload each floor under Pictures. A floor with no picture is left off.
                    </p>
                    {doc.planCaptions.map((caption, i) => (
                      <Input
                        key={i}
                        aria-label={`Caption for floor plan ${i + 1}`}
                        value={caption}
                        placeholder={`Caption ${i + 1}`}
                        onChange={(event) =>
                          set(
                            'planCaptions',
                            doc.planCaptions.map((c, j) => (j === i ? event.target.value : c))
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </Section>

          <Section title="The home">
            <Field id="mk-street" label="Street" value={doc.street} onChange={(v) => set('street', v)} />
            <Field
              id="mk-city"
              label="Town, state and ZIP"
              value={doc.cityLine}
              onChange={(v) => set('cityLine', v)}
            />
            {design.uses.headline && (
              <Field
                id="mk-headline"
                label="Headline"
                value={doc.headline}
                onChange={(v) => set('headline', v)}
              />
            )}
            {!sheet && (
              <Field id="mk-price" label="Price" value={doc.price} onChange={(v) => set('price', v)} />
            )}
            {design.uses.description && (
              <div>
                <Label htmlFor="mk-description">Description</Label>
                <Textarea
                  id="mk-description"
                  className="mt-1.5 min-h-[160px] text-sm"
                  value={doc.description}
                  onChange={(event) => set('description', event.target.value)}
                />
                <p className="numeral mt-1.5 text-xs text-gray-500">
                  {doc.description.length.toLocaleString()} characters.
                  {doc.description.length > 820 &&
                    ' Past about 800 it is set smaller to fit; past about 1,700 the end is cut off.'}
                </p>
              </div>
            )}
          </Section>

          {!sheet && (
            <Section
              title="Facts"
              hint={`This design shows the first ${design.statCount}, in this order. Move one up to show it.`}
            >
              <div className="space-y-2">
                {doc.stats.map((stat, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-1.5 ${i >= design.statCount ? 'opacity-60' : ''}`}
                  >
                    <Input
                      aria-label={`Fact ${i + 1} label`}
                      value={stat.label}
                      className="min-w-0 flex-1"
                      onChange={(event) => setStat(i, { label: event.target.value })}
                    />
                    <Input
                      aria-label={`Fact ${i + 1} value`}
                      value={stat.value}
                      className="numeral w-24 shrink-0"
                      onChange={(event) => setStat(i, { value: event.target.value })}
                    />
                    <button
                      type="button"
                      className={ICON_BUTTON}
                      aria-label={`Move ${stat.label || 'fact'} up`}
                      disabled={i === 0}
                      onClick={() => set('stats', moved(doc.stats, i, -1))}
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={ICON_BUTTON}
                      aria-label={`Remove ${stat.label || 'fact'}`}
                      onClick={() =>
                        set(
                          'stats',
                          doc.stats.filter((_, j) => j !== i)
                        )
                      }
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={SMALL_BUTTON}
                onClick={() => set('stats', [...doc.stats, { label: '', value: '' }])}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Add a fact
              </button>
            </Section>
          )}

          {design.uses.features && (
            <Section title="Key features" hint="One per line. Leave it empty and the list is left off.">
              <Textarea
                aria-label="Key features, one per line"
                className="min-h-[120px] text-sm"
                value={doc.features.join('\n')}
                placeholder={'Large yard\nHeated driveway\n3 car garage'}
                onChange={(event) => set('features', event.target.value.split('\n'))}
              />
            </Section>
          )}

          {!sheet && (
            <Section
              title="Around the home"
              hint="An extra page for the booklet: a map with the home at its centre, and the schools, parks, restaurants, transit and highways near it."
            >
              <label className="flex items-start gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#8c6b35]"
                  checked={around.on}
                  onChange={(event) => setAround({ on: event.target.checked })}
                />
                <span>
                  Add this page to the booklet
                  <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
                    It prints as page 3, on a sheet of its own. Fold it and tuck it inside.
                  </span>
                </span>
              </label>

              <div>
                <button
                  type="button"
                  className={ADMIN_BUTTON}
                  disabled={finding || !doc.street.trim() || !doc.cityLine.trim()}
                  onClick={() => void findAround()}
                >
                  <MapPin className="h-4 w-4" aria-hidden />
                  {finding ? 'Looking…' : around.home ? 'Find what’s nearby again' : 'Find what’s nearby'}
                </button>
                {!doc.street.trim() || !doc.cityLine.trim() ? (
                  <p className="mt-2 text-xs leading-relaxed text-gray-500">
                    Fill in the street and the town first, or choose a listing.
                  </p>
                ) : (
                  around.checked && (
                    <p className="mt-2 text-xs leading-relaxed text-gray-500">
                      Last looked up {around.checked}. Schools, parks and highway exits are the
                      state’s own lists; stations are the MBTA’s; restaurants and groceries are from
                      OpenStreetMap, which is the one to read through before printing.
                    </p>
                  )
                )}
                {findNote && (
                  <p className="mt-2 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900" role="status">
                    {findNote}
                  </p>
                )}
              </div>

              {around.on && (
                <>
                  <Field
                    id="mk-around-title"
                    label="Page heading"
                    value={around.title}
                    onChange={(v) => setAround({ title: v })}
                  />

                  {around.home && (
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-medium text-ink">Map</span>
                      <button
                        type="button"
                        className={SMALL_BUTTON}
                        disabled={around.zoom >= MAX_ZOOM_MAP}
                        onClick={() => setAround({ zoom: around.zoom + 1 })}
                      >
                        Closer
                      </button>
                      <button
                        type="button"
                        className={SMALL_BUTTON}
                        disabled={around.zoom <= MIN_ZOOM}
                        onClick={() => setAround({ zoom: around.zoom - 1 })}
                      >
                        Wider
                      </button>
                      <span className="numeral text-xs text-gray-500">
                        About {mapMilesAcross(around.home, around.zoom).toFixed(1)} miles across. A
                        place beyond its edge is listed without a number.
                      </span>
                    </div>
                  )}

                  {PLACE_GROUPS.map((group) => {
                    const rows = around.places.filter((p) => p.group === group.id);
                    const ticked = rows.filter((p) => p.show).length;
                    return (
                      <div key={group.id} className="border-t border-gray-200 pt-4">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-sm font-semibold text-ink">{group.label}</p>
                          <p className="numeral text-xs text-gray-500">
                            {ticked > group.max
                              ? `${ticked} ticked — the page shows the first ${group.max}`
                              : `Up to ${group.max} on the page`}
                          </p>
                        </div>
                        <div className="mt-2 space-y-1.5">
                          {rows.map((place) => (
                            <div key={place.id} className="flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                aria-label={`Show ${place.name || 'this place'}`}
                                className="h-4 w-4 shrink-0 accent-[#8c6b35]"
                                checked={place.show}
                                onChange={(event) => setPlace(place.id, { show: event.target.checked })}
                              />
                              <Input
                                aria-label="Name"
                                value={place.name}
                                placeholder="Name"
                                className={`h-9 min-w-0 flex-[3] px-2 text-sm ${place.show ? '' : 'opacity-60'}`}
                                onChange={(event) => setPlace(place.id, { name: event.target.value })}
                              />
                              <Input
                                aria-label="Detail"
                                value={place.note}
                                placeholder="Detail"
                                className={`h-9 min-w-0 flex-[2] px-2 text-xs ${place.show ? '' : 'opacity-60'}`}
                                onChange={(event) => setPlace(place.id, { note: event.target.value })}
                              />
                              <Input
                                aria-label="Distance"
                                value={place.distance}
                                placeholder="0.5 mi"
                                className={`numeral h-9 w-[4.5rem] shrink-0 px-2 text-xs ${place.show ? '' : 'opacity-60'}`}
                                onChange={(event) => setPlace(place.id, { distance: event.target.value })}
                              />
                              <button
                                type="button"
                                className={ICON_BUTTON}
                                aria-label={`Remove ${place.name || 'this place'}`}
                                onClick={() =>
                                  setAround({ places: around.places.filter((p) => p.id !== place.id) })
                                }
                              >
                                <X className="h-4 w-4" aria-hidden />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          className={`${SMALL_BUTTON} mt-2`}
                          onClick={() => addPlace(group.id)}
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden />
                          Add one by hand
                        </button>
                      </div>
                    );
                  })}

                  <p className="text-xs leading-relaxed text-gray-500">
                    Keep this page to names and distances. Describing who lives in a neighborhood,
                    or calling it safe or good for families, is a fair-housing problem; so is
                    ranking the schools. A place added by hand is listed without a pin on the map.
                  </p>
                </>
              )}
            </Section>
          )}

          {sheet && (
            <Section
              title={doc.kind === 'expenses' ? 'Expenses' : 'Upgrades'}
              hint={
                doc.kind === 'expenses'
                  ? 'A name and what it costs, in your own words: "$70 – $80 / month". Paste a whole list into the first box and it splits into lines.'
                  : 'A year and a value are both optional — a column appears only when something is in it, and a total only when every value is a plain dollar amount. Paste a whole list into the first box and it splits into lines.'
              }
            >
              <div className="space-y-2">
                {doc.rows.map((row, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    {doc.kind === 'upgrades' && (
                      <Input
                        aria-label={`Line ${i + 1} year`}
                        value={row.date}
                        placeholder="Year"
                        className="numeral w-[4.25rem] shrink-0 px-2"
                        onChange={(event) => setRow(i, { date: event.target.value })}
                      />
                    )}
                    <Input
                      aria-label={`Line ${i + 1}`}
                      value={row.label}
                      placeholder={doc.kind === 'expenses' ? 'Water & sewer' : 'New roof'}
                      className="min-w-0 flex-1"
                      onChange={(event) => setRow(i, { label: event.target.value })}
                      onPaste={(event) => pasteRows(i, event)}
                    />
                    <Textarea
                      aria-label={`Line ${i + 1} ${doc.kind === 'expenses' ? 'price' : 'value'}`}
                      value={row.value}
                      rows={Math.max(1, row.value.split('\n').length)}
                      placeholder={doc.kind === 'expenses' ? '$150 / month' : '$12,000'}
                      className="numeral min-h-0 w-32 shrink-0 resize-none px-2 py-2 text-sm leading-5"
                      onChange={(event) => setRow(i, { value: event.target.value })}
                    />
                    <button
                      type="button"
                      className={ICON_BUTTON}
                      aria-label={`Move line ${i + 1} up`}
                      disabled={i === 0}
                      onClick={() => set('rows', moved(doc.rows, i, -1))}
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={ICON_BUTTON}
                      aria-label={`Move line ${i + 1} down`}
                      disabled={i === doc.rows.length - 1}
                      onClick={() => set('rows', moved(doc.rows, i, 1))}
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={ICON_BUTTON}
                      aria-label={`Remove line ${i + 1}`}
                      onClick={() =>
                        set(
                          'rows',
                          doc.rows.filter((_, j) => j !== i)
                        )
                      }
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={SMALL_BUTTON}
                onClick={() => set('rows', [...doc.rows, blankRow()])}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Add a line
              </button>
              <div>
                <Label htmlFor="mk-note">Small print under the list</Label>
                <Input
                  id="mk-note"
                  className="mt-1.5"
                  value={doc.note}
                  placeholder="Figures provided by the seller."
                  onChange={(event) => set('note', event.target.value)}
                />
              </div>
            </Section>
          )}

          <Section title={doc.agents.length > 1 ? 'Agents' : 'Agent'}>
            {doc.agents.map((agent, i) => (
              <div key={i} className={i > 0 ? 'border-t border-gray-200 pt-4' : ''}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">
                    {agent.name.trim() || `Agent ${i + 1}`}
                  </p>
                  {doc.agents.length > 1 && (
                    <button
                      type="button"
                      className={SMALL_BUTTON}
                      onClick={() => {
                        set(
                          'agents',
                          doc.agents.filter((_, j) => j !== i)
                        );
                        setSelected(null);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field id={`mk-a${i}-name`} label="Name" value={agent.name} onChange={(v) => setAgent(i, { name: v })} />
                  <Field id={`mk-a${i}-title`} label="Title" value={agent.title} onChange={(v) => setAgent(i, { title: v })} />
                  {/*
                    Free text, not the phone formatter the forms use. This is
                    not a number being collected; it is the line that prints,
                    and Kevin's is written "(860) 682-2251" on the site and
                    "860-682-2251" on his old booklets. Whichever he types is
                    what goes on the page.
                  */}
                  <Field id={`mk-a${i}-phone`} label="Phone" value={agent.phone} onChange={(v) => setAgent(i, { phone: v })} />
                  <Field id={`mk-a${i}-web`} label="Website" value={agent.web} onChange={(v) => setAgent(i, { web: v })} />
                </div>
                <div className="mt-3 space-y-3">
                  <Field id={`mk-a${i}-email`} label="Email" value={agent.email} onChange={(v) => setAgent(i, { email: v })} />
                  <div>
                    <Field
                      id={`mk-a${i}-brokerage`}
                      label="Brokerage"
                      value={agent.brokerage}
                      onChange={(v) => setAgent(i, { brokerage: v })}
                    />
                    <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                      Always printed — Massachusetts requires the broker's name on all advertising.
                      Their headshot and logo are under Pictures.
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {doc.agents.length < MAX_AGENTS && (
              <button
                type="button"
                className={SMALL_BUTTON}
                onClick={() => set('agents', [...doc.agents, blankAgent()])}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Add a co-listing agent
              </button>
            )}
          </Section>

          <Section
            title="Pictures"
            hint="Every frame on this design. Click one here or on the page to change, move or crop it."
          >
            <ul className="space-y-1.5">
              {slots.map((slot) => {
                const photo = getPhoto(doc, slot.key);
                const current = selected === slot.key;
                return (
                  <li
                    key={slot.key}
                    className={`flex items-center gap-3 rounded-lg border p-1.5 ${
                      current ? 'border-champagne bg-bone' : 'border-transparent'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => (photo ? setSelected(slot.key) : setPicking(slot.key))}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-100">
                        {photo ? (
                          <img
                            src={sourceUrl(photo.src, 'card')}
                            alt=""
                            loading="lazy"
                            className={`h-full w-full ${slot.fit === 'cover' ? 'object-cover' : 'object-contain'}`}
                          />
                        ) : (
                          <ImagePlus className="h-4 w-4 text-gray-400" aria-hidden />
                        )}
                      </span>
                      <span className="min-w-0 truncate text-sm text-ink">{slot.label}</span>
                    </button>
                    <button type="button" className={SMALL_BUTTON} onClick={() => setPicking(slot.key)}>
                      {photo ? 'Change' : 'Add'}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Section>
        </div>

        {/* ------------------------------------------------------------- paper */}
        <div className="min-w-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
          <div className="mb-3 flex min-h-[3.25rem] flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5">
            {selected && chosen ? (
              <>
                <p className="min-w-0 truncate text-sm font-semibold text-ink">{labelOf(selected)}</p>
                <label className="flex min-w-[11rem] flex-1 items-center gap-3 text-xs font-medium text-gray-600">
                  Zoom
                  <Slider
                    aria-label="Zoom"
                    min={1}
                    max={MAX_ZOOM}
                    step={0.01}
                    value={[chosen.zoom]}
                    onValueChange={([zoom]) => put(selected, { ...chosen, zoom })}
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={SMALL_BUTTON}
                    onClick={() => put(selected, placed(chosen.src))}
                  >
                    Reset
                  </button>
                  <button type="button" className={SMALL_BUTTON} onClick={() => setPicking(selected)}>
                    Change
                  </button>
                  <button
                    type="button"
                    className={SMALL_BUTTON}
                    onClick={() => {
                      put(selected, null);
                      setSelected(null);
                    }}
                  >
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-600">
                Click a picture to select it. Drag it to move it in its frame; double-click to choose
                another.
              </p>
            )}
          </div>

          <div className="rounded-xl bg-gray-200/80 p-3 sm:p-4">
            <DocFrame
              ref={frame}
              family={design.family}
              title={`${title || 'Untitled'} — ${kind.label}`}
            >
              <DocPages doc={doc} />
            </DocFrame>
          </div>
          {!sheet && (
            <p className="mt-3 text-xs leading-relaxed text-gray-500">
              Page 1 is the outside of the booklet: the back on its left half, the front cover on its
              right. Page 2 is the inside.{around.on && ' Page 3 is the neighborhood page.'}
            </p>
          )}
        </div>
      </div>

      <PhotoPicker
        open={picking !== null}
        onOpenChange={(open) => {
          if (!open) setPicking(null);
        }}
        doc={doc}
        frameLabel={picking ? labelOf(picking) : ''}
        uploading={uploading}
        onChoose={choose}
        onUpload={(files) => void upload(files)}
      />
    </DocProvider>
  );
};

export default Editor;
