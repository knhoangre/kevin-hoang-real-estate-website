/**
 * Send listings: the decisions the page makes before anything is saved.
 *
 * PURE: no imports that survive compilation, no DOM. That is what lets
 * `node scripts/send-listings-check.ts` run it. Everything that touches Supabase
 * is in listingSendStore.ts, the split marketing.ts and marketingStore.ts have.
 */
import type { ListingSuggestion } from '@/lib/idxSearch';
import type { PersonDraft } from '@/lib/showingTours';

/** A home on a message, as the page draws it. Only the number decides anything. */
export interface SendHome {
  mlsNumber: string;
  address: string | null;
  town: string | null;
  state: string | null;
  zip: string | null;
  listPrice: number | null;
  /** The feed's status code, for the words beside it. */
  status: string | null;
  propType: string | null;
}

/** The most homes one message lists. The table enforces the same ceiling. */
export const MAX_HOMES = 20;

export const homeFromListing = (l: ListingSuggestion): SendHome => ({
  mlsNumber: l.mls_number,
  address: l.address,
  town: l.town,
  state: l.state,
  zip: l.zip,
  listPrice: l.list_price,
  status: l.status,
  propType: l.prop_type,
});

const textOr = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

/**
 * The `homes` column, read defensively. It is jsonb, so its type says nothing
 * about its shape, and this refuses to crash the page over a row that lacks one.
 */
export const homesFrom = (raw: unknown): SendHome[] =>
  (Array.isArray(raw) ? raw : []).flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const home = entry as Record<string, unknown>;
    const mlsNumber = textOr(home.mlsNumber);
    if (!mlsNumber) return [];
    return [
      {
        mlsNumber,
        address: textOr(home.address),
        town: textOr(home.town),
        state: textOr(home.state),
        zip: textOr(home.zip),
        listPrice: typeof home.listPrice === 'number' ? home.listPrice : null,
        status: textOr(home.status),
        propType: textOr(home.propType),
      },
    ];
  });

/**
 * Whether the listings on this page may be out of date. The feed loads several
 * times a day, so a day without a good load means something is wrong, and a
 * client is about to be told a price from before it went wrong.
 */
export const feedIsStale = (lastGoodLoad: string, now: number): boolean =>
  now - new Date(lastGoodLoad).getTime() > 24 * 60 * 60 * 1000;

/**
 * Every MLS number in a piece of pasted text, once each, in the order they appear.
 *
 * Six digits or more, the rule `mlsFromListingParam` uses: a ZIP is five, so one
 * of this site's own links — "…-Cambridge-MA-02141-73568135?utm_source=email" —
 * gives its number and nothing else. So does a column of numbers from a
 * spreadsheet, or "MLS# 73568135" copied out of an email, which is why this looks
 * for numbers rather than asking the text to be nothing but numbers.
 *
 * It can pick up something that is not one, a phone number with no punctuation,
 * and that does no harm: it is looked up, not found, and named as not found.
 */
export const mlsNumbersIn = (text: string): string[] => [
  ...new Set(text.match(/\b\d{6,12}\b/g) ?? []),
];

/**
 * The homes after adding some: already-listed ones are not added twice, and
 * nothing past the ceiling is added. `dropped` is what did not fit, for the page
 * to say so rather than leave Kevin counting.
 */
export const withHomes = (
  homes: SendHome[],
  added: SendHome[]
): { homes: SendHome[]; dropped: SendHome[] } => {
  const out = [...homes];
  const dropped: SendHome[] = [];
  for (const home of added) {
    if (out.some((h) => h.mlsNumber === home.mlsNumber)) continue;
    if (out.length >= MAX_HOMES) dropped.push(home);
    else out.push(home);
  }
  return { homes: out, dropped };
};

/** "12 Elm St, Newton", or the number if the feed gave no address. */
export const homeLine = (home: SendHome): string =>
  [home.address, home.town].filter(Boolean).join(', ') || `MLS ${home.mlsNumber}`;

/** One line for the list of past messages: "12 Elm St, Newton and 2 more". */
export const homesSummary = (homes: SendHome[]): string => {
  if (homes.length === 0) return '';
  return homes.length === 1
    ? homeLine(homes[0])
    : `${homeLine(homes[0])} and ${homes.length - 1} more`;
};

type PersonFields = Pick<PersonDraft, 'id' | 'name' | 'email' | 'phone'>;

const isBlank = (p: PersonFields) => !p.name.trim() && !p.email.trim() && !p.phone.trim();

/**
 * What "has this changed" compares, and so what decides whether a preview on
 * screen still describes the form. Blank rows and `contactId` are left out: a
 * spare empty line is not an edit, and contactId is the database's to write.
 */
export const draftKey = (people: PersonFields[], homes: SendHome[], note: string): string =>
  JSON.stringify({
    // Tidied the way the database tidies them, so saving is not itself a change.
    people: people
      .filter((p) => !isBlank(p))
      .map((p) => [p.id, p.name.trim(), p.email.trim().toLowerCase(), p.phone.trim()]),
    homes: homes.map((h) => h.mlsNumber),
    note: note.trim(),
  });

/**
 * Why this cannot be saved yet, in a sentence for Kevin, or null. Nobody on it is
 * fine: a lot of these go into a Zillow chat. The trigger's own message is still
 * shown if it ever disagrees.
 */
export const draftProblem = (people: PersonFields[], homes: SendHome[]): string | null => {
  if (homes.length === 0) return 'Add at least one home.';
  const named = people.filter((p) => !isBlank(p));
  if (named.some((p) => !p.name.trim())) return 'Everyone on the message needs a name.';
  const bad = named.find((p) => p.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim()));
  if (bad) return `Check the email address for ${bad.name.trim()}.`;
  return null;
};

/** Words for a home that cannot be walked into. Mirrors `availabilityNote` in the function. */
export const NOT_AVAILABLE = new Set(['CTG', 'UAG', 'SLD', 'RNT']);
