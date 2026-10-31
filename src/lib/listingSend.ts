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

/* -------------------------------------------------------------------------- */
/* Each client's own messages                                                  */
/* -------------------------------------------------------------------------- */

/** A person on a stored message, as far as telling clients apart needs. */
export interface StoredPerson {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  contactId: number | null;
}

/** What grouping reads from a stored message. */
export interface GroupableSend {
  id: string;
  people: StoredPerson[];
  homes: SendHome[];
  createdAt: string;
  sentAt: string | null;
}

export interface SendClient<T extends GroupableSend = GroupableSend> {
  /**
   * What `?client=` holds. The id of the first person on their oldest message, so
   * it stays put as messages are added, and opaque: an address in the URL would
   * go to Google Analytics with every page view.
   */
  key: string;
  /** Everyone they have been, newest spelling first. Empty for NO_CLIENT. */
  names: string[];
  emails: string[];
  phones: string[];
  /** Newest first. */
  sends: T[];
  /** When the last thing happened: an email going, or else a message being made. */
  lastAt: string;
  /** Different homes across all their messages. */
  homeCount: number;
}

/** The messages with nobody on them, which are pasted into a chat. */
export const NO_CLIENT = 'none';

const lastTen = (phone: string | null) => (phone ?? '').replace(/\D/g, '').slice(-10);

/** What says two rows are one person: the CRM's word for it, an email or a phone. */
const strongKeys = (p: StoredPerson): string[] => [
  ...(p.contactId !== null ? [`c:${p.contactId}`] : []),
  ...(p.email ? [`e:${p.email.trim().toLowerCase()}`] : []),
  ...(lastTen(p.phone).length === 10 ? [`p:${lastTen(p.phone)}`] : []),
];

const nameKey = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();

const lastActivity = (send: GroupableSend) => send.sentAt ?? send.createdAt;

/** "Tammy" says nothing "Tammy Nguyen" does not, so it is not a second person. */
const withoutShortForms = (names: string[]): string[] =>
  names.filter(
    (name) =>
      !names.some((other) => other !== name && nameKey(other).startsWith(`${nameKey(name)} `))
  );

/**
 * Every message, filed by client.
 *
 * Kevin asked that each client have their own, on 2026-10-30. There is no client
 * table to file them under, and none is needed: the people on a message already
 * say who it was for. Two messages belong together when they share anyone, by
 * CRM contact, by email or by phone.
 *
 * A COUPLE IS ONE CLIENT. Everyone on one message is one client, so "Tammy and
 * Matthew" on Tuesday and "Tammy" alone on Friday land together. Keyed on each
 * person instead, the couple would be two rows holding the same messages.
 *
 * A NAME ALONE IS WEAK. Somebody with nothing but a name, as a Zillow client
 * usually is, is matched by that name, and joins a person with details of the
 * same name. Two people with the same name and DIFFERENT details stay apart: a
 * name is not enough to say that two Sam Lees are one.
 */
export const clientsFrom = <T extends GroupableSend>(sends: T[]): SendClient<T>[] => {
  const parent = new Map<string, string>();
  const find = (key: string): string => {
    if (!parent.has(key)) parent.set(key, key);
    let root = key;
    while (parent.get(root) !== root) root = parent.get(root) as string;
    parent.set(key, root);
    return root;
  };
  const join = (a: string, b: string) => parent.set(find(a), find(b));

  const oldestFirst = [...sends].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  // The first person with details to go by each name, for a name alone to join.
  const firstWithName = new Map<string, string>();
  for (const send of oldestFirst) {
    for (const person of send.people) {
      const [strong] = strongKeys(person);
      if (strong && !firstWithName.has(nameKey(person.name))) {
        firstWithName.set(nameKey(person.name), strong);
      }
    }
  }

  for (const send of oldestFirst) {
    for (const person of send.people) {
      const keys = strongKeys(person);
      if (keys.length > 0) {
        for (const key of keys) join(`m:${send.id}`, key);
      } else {
        const weak = `n:${nameKey(person.name)}`;
        join(`m:${send.id}`, weak);
        const known = firstWithName.get(nameKey(person.name));
        if (known) join(weak, known);
      }
    }
  }

  const groups = new Map<string, T[]>();
  const nobody: T[] = [];
  for (const send of oldestFirst) {
    if (send.people.length === 0) {
      nobody.push(send);
      continue;
    }
    const root = find(`m:${send.id}`);
    groups.set(root, [...(groups.get(root) ?? []), send]);
  }

  const build = (key: string, oldest: T[]): SendClient<T> => {
    const newest = [...oldest].reverse();
    const everyone = newest.flatMap((s) => s.people);
    const names = withoutShortForms([
      ...new Map(everyone.map((p) => [nameKey(p.name), p.name] as const)).values(),
    ]);
    return {
      key,
      names,
      emails: [...new Set(everyone.flatMap((p) => (p.email ? [p.email] : [])))],
      phones: [
        ...new Map(
          everyone.flatMap((p) => (p.phone ? [[lastTen(p.phone), p.phone] as const] : []))
        ).values(),
      ],
      sends: newest,
      lastAt: newest.map(lastActivity).sort().reverse()[0],
      homeCount: new Set(oldest.flatMap((s) => s.homes.map((h) => h.mlsNumber))).size,
    };
  };

  const named = [...groups.values()]
    .map((oldest) => build(oldest[0].people[0].id, oldest))
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  return nobody.length > 0 ? [...named, build(NO_CLIENT, nobody)] : named;
};

/** "Tammy Nguyen", "Tammy Nguyen & Matthew Nguyen", "A, B & C". */
export const clientName = (client: Pick<SendClient, 'names'>): string => {
  const { names } = client;
  if (names.length === 0) return 'No client named';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
};

/** Everything there is to reach them by, on one line. */
export const clientContact = (client: Pick<SendClient, 'emails' | 'phones'>): string =>
  [...client.emails, ...client.phones].join(' · ');

/** Who the next message to them starts with: whoever was on the last one. */
export const nextPeople = (client: Pick<SendClient, 'sends'>): StoredPerson[] =>
  client.sends[0]?.people ?? [];

/** Words for a home that cannot be walked into. Mirrors `availabilityNote` in the function. */
export const NOT_AVAILABLE = new Set(['CTG', 'UAG', 'SLD', 'RNT']);
