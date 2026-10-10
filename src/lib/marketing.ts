/**
 * Marketing documents — the shape of one, and everything about one that is
 * arithmetic rather than drawing.
 *
 * Three documents Kevin hands out for a listing: a folded BOOKLET, a sheet of
 * what the home costs to run (EXPENSES) and a sheet of what has been done to it
 * (UPGRADES). /admin/marketing builds them; `marketing_documents.doc` stores
 * one as jsonb, and THIS MODULE IS THE CONTRACT for that column, the way
 * rentalApplication.ts is for an application's answers.
 *
 * PURE — no network, no DOM, no Supabase — so `node scripts/marketing-check.ts`
 * can run it. Fetching and saving are in marketingStore.ts; drawing is in
 * src/components/marketing. The two imports below are relative and carry their
 * extension for the same reason: Node runs this file as it stands.
 *
 * What is decided here rather than in a component, because each has a wrong
 * answer that looks fine on screen:
 *
 *   * WHAT MLS FILLS IN. A fact the feed does not have is LEFT OUT, never
 *     printed as 0 or a dash; a $1 list price is a placeholder, not a price.
 *   * THE CROP. A picture is never redrawn — see `Photo`.
 *   * THE TOTAL on an upgrade sheet, which exists only when every row is a
 *     plain dollar amount. A total that quietly skipped the row reading
 *     "$70 - $80 / month" would be a number about a house that nobody added up.
 *   * HOW A LONG LIST BREAKS ACROSS PAGES.
 */
import { formatPrice } from './listings.ts';
import { casedAddress } from './listingUrl.ts';

/* -------------------------------------------------------------------------- */
/* The document                                                                */
/* -------------------------------------------------------------------------- */

export type DocKind = 'booklet' | 'expenses' | 'upgrades';

export const DOC_KINDS: { id: DocKind; label: string; blurb: string }[] = [
  { id: 'booklet', label: 'Booklet', blurb: 'A folded listing booklet, filled in from MLS.' },
  { id: 'expenses', label: 'Home expenses', blurb: 'What the home costs to run, line by line.' },
  { id: 'upgrades', label: 'Home upgrades', blurb: 'What has been done to the home, and when.' },
];

/**
 * Where a picture comes from. Never a URL: an MLS photo is its listing number
 * and position, which is all photoUrl() needs and cannot go stale the way a
 * stored address can; an upload is its path in the `marketing-images` bucket; a
 * `site` picture is a file this site already serves (Kevin's own headshot).
 */
export type PhotoSource =
  | { type: 'mls'; mls: string; n: number }
  | { type: 'upload'; path: string }
  | { type: 'site'; path: string };

/**
 * One picture in one frame, and how it sits there.
 *
 * THE PICTURE IS NEVER REDRAWN. A crop here is three numbers — which part of
 * the picture to favour (`x`, `y`, each 0 to 1) and how far in to go (`zoom`,
 * 1 = as loose as the frame allows) — and the page places the whole picture
 * behind its frame accordingly. That is not a
 * simplification: MLS PIN's photo host sends no CORS header, so a browser may
 * SHOW one of its photographs but may not read its pixels. A crop that drew to
 * a canvas — what react-image-crop does on the profile page — would throw on
 * every listing photo. It also means the printer gets the photograph at its
 * full size and clips it, rather than a re-encoded copy.
 */
export interface Photo {
  src: PhotoSource;
  x: number;
  y: number;
  zoom: number;
}

export interface Agent {
  name: string;
  title: string;
  phone: string;
  email: string;
  web: string;
  /**
   * Per agent, not per document: a co-listing can be two brokerages. It must be
   * printed — 254 CMR 3.09 requires the broker's name on all advertising — so
   * the designs always draw it and the editor will not let it be left empty.
   */
  brokerage: string;
  photo: Photo | null;
  /** The brokerage's logo, when Kevin has uploaded one. The name prints either way. */
  logo: Photo | null;
}

export interface Stat {
  label: string;
  value: string;
}

/** One line of an expense or upgrade sheet. `date` is upgrades-only; `value` is free text. */
export interface Row {
  label: string;
  date: string;
  value: string;
}

export interface MarketingDoc {
  kind: DocKind;
  design: string;

  /** '' for a home typed by hand. */
  mls: string;
  /** How many photos MLS has for it, which is what the picker offers. */
  photoCount: number;
  /** The listing office — shown in the editor, never printed. */
  office: string;

  street: string;
  cityLine: string;
  /** "Welcome Home" on the design that has a headline. */
  headline: string;
  price: string;
  description: string;
  /** In display order. A design shows the first few; see DesignDef.statCount. */
  stats: Stat[];
  /** Typed by hand. Nothing writes these for him. */
  features: string[];

  /** What the Classic booklet's back panel holds. */
  back: 'photos' | 'plan';
  planCaptions: string[];

  /** Frame key -> picture. One pool for every design, so switching keeps them. */
  photos: Record<string, Photo | null>;
  /** Every path uploaded for this document, so deleting it can delete them. */
  uploads: string[];

  agents: Agent[];

  rows: Row[];
  /** Small print under a sheet's table. */
  note: string;
}

/* -------------------------------------------------------------------------- */
/* Designs                                                                     */
/* -------------------------------------------------------------------------- */

export interface SlotDef {
  key: string;
  label: string;
  /**
   * `cover` fills the frame and crops what does not fit — a photograph.
   * `contain` shows the whole picture — a floor plan or a logo, where a missing
   * edge is a missing room.
   */
  fit: 'cover' | 'contain';
}

export interface DesignDef {
  id: string;
  family: 'booklet' | 'sheet';
  label: string;
  blurb: string;
  /** Rebuilt from one of Kevin's own files, or new here. */
  origin: 'yours' | 'new';
  slots: SlotDef[];
  /** How many of `stats` it draws, after the price. */
  statCount: number;
  uses: {
    headline: boolean;
    description: boolean;
    features: boolean;
    back: boolean;
    /**
     * Whether it draws an uploaded brokerage logo. The dark designs do not: a
     * logo is somebody else's artwork in an unknown colour, and most are dark
     * ink that would vanish on a dark panel. The brokerage NAME is drawn by
     * every design regardless.
     */
    logo: boolean;
  };
}

const cover = (key: string, label: string): SlotDef => ({ key, label, fit: 'cover' });
const contain = (key: string, label: string): SlotDef => ({ key, label, fit: 'contain' });
const inside = (count: number): SlotDef[] =>
  Array.from({ length: count }, (_, i) => cover(`in${i + 1}`, `Inside ${i + 1}`));

const PLAN_SLOTS: SlotDef[] = [
  contain('plan1', 'Floor plan 1'),
  contain('plan2', 'Floor plan 2'),
  contain('plan3', 'Floor plan 3'),
];

const SHEET_USES = { headline: false, description: false, features: false, back: false };

/**
 * Every design. The frame keys are ONE POOL shared by all of them — `cover`,
 * `back1`, `in1`… — which is what lets Kevin switch from Classic to Noir and
 * keep the pictures he chose and cropped.
 */
export const DESIGNS: DesignDef[] = [
  {
    id: 'classic',
    family: 'booklet',
    label: 'Classic',
    blurb: 'Your booklet: black rules, one large photo and six small, the description beside them.',
    origin: 'yours',
    slots: [cover('cover', 'Cover'), cover('back1', 'Back, top'), cover('back2', 'Back, bottom'), ...inside(7)],
    statCount: 5,
    uses: { headline: false, description: true, features: false, back: true, logo: true },
  },
  {
    id: 'welcome',
    family: 'booklet',
    label: 'Welcome Home',
    blurb: 'Your framed cover, with eight photos and the key features inside.',
    origin: 'yours',
    slots: [cover('cover', 'Cover'), cover('back1', 'Back'), ...inside(8)],
    statCount: 5,
    uses: { headline: true, description: false, features: true, back: false, logo: true },
  },
  {
    id: 'noir',
    family: 'booklet',
    label: 'Noir',
    blurb: 'Dark, with champagne rules and serif headlines. One photograph fills each panel.',
    origin: 'new',
    slots: [cover('cover', 'Cover'), cover('back1', 'Back'), ...inside(4)],
    statCount: 4,
    uses: { headline: false, description: true, features: false, back: false, logo: false },
  },
  {
    id: 'gallery',
    family: 'booklet',
    label: 'Gallery',
    blurb: 'Light and spare: wide margins, a large photograph, the facts in one ruled line.',
    origin: 'new',
    slots: [cover('cover', 'Cover'), cover('back1', 'Back'), ...inside(5)],
    statCount: 4,
    uses: { headline: false, description: true, features: false, back: false, logo: true },
  },
  {
    id: 'sheet-classic',
    family: 'sheet',
    label: 'Classic',
    blurb: 'Your sheet: the photo band, the address plate, and the list beside its rule.',
    origin: 'yours',
    slots: [cover('header', 'Header photo')],
    statCount: 0,
    uses: { ...SHEET_USES, logo: true },
  },
  {
    id: 'sheet-noir',
    family: 'sheet',
    label: 'Noir',
    blurb: 'Matches the Noir booklet: a dark header, champagne labels, fine rules.',
    origin: 'new',
    slots: [cover('header', 'Header photo')],
    statCount: 0,
    uses: { ...SHEET_USES, logo: false },
  },
  {
    id: 'sheet-gallery',
    family: 'sheet',
    label: 'Gallery',
    blurb: 'Matches the Gallery booklet: a serif title, a small photograph, hairline rows.',
    origin: 'new',
    slots: [cover('header', 'Photo')],
    statCount: 0,
    uses: { ...SHEET_USES, logo: true },
  },
];

export const familyOf = (kind: DocKind): 'booklet' | 'sheet' =>
  kind === 'booklet' ? 'booklet' : 'sheet';

export const designsFor = (kind: DocKind): DesignDef[] =>
  DESIGNS.filter((d) => d.family === familyOf(kind));

export const defaultDesign = (kind: DocKind): string => designsFor(kind)[0].id;

/** The design a document names, or its kind's first if the name is unknown. */
export const designOf = (doc: Pick<MarketingDoc, 'kind' | 'design'>): DesignDef =>
  designsFor(doc.kind).find((d) => d.id === doc.design) ?? designsFor(doc.kind)[0];

/** How many agents a document may carry. Two is a co-listing; three is a committee. */
export const MAX_AGENTS = 2;

/**
 * Every frame the document shows right now: the design's own (with the Classic
 * back panel resolved to photos or floor plans) and then each agent's.
 */
export const slotsOf = (doc: MarketingDoc): SlotDef[] => {
  const design = designOf(doc);
  const own =
    design.uses.back && doc.back === 'plan'
      ? [...design.slots.filter((s) => !s.key.startsWith('back')), ...PLAN_SLOTS]
      : design.slots;
  const agents = doc.agents.flatMap((agent, i) => [
    cover(`agent${i}.photo`, `${agent.name.trim() || `Agent ${i + 1}`} — headshot`),
    ...(design.uses.logo
      ? [contain(`agent${i}.logo`, `${agent.brokerage.trim() || 'Brokerage'} — logo`)]
      : []),
  ]);
  return [...own, ...agents];
};

const AGENT_KEY = /^agent(\d)\.(photo|logo)$/;

export const getPhoto = (doc: MarketingDoc, key: string): Photo | null => {
  const m = AGENT_KEY.exec(key);
  if (m) return doc.agents[Number(m[1])]?.[m[2] as 'photo' | 'logo'] ?? null;
  return doc.photos[key] ?? null;
};

export const setPhoto = (doc: MarketingDoc, key: string, photo: Photo | null): MarketingDoc => {
  const m = AGENT_KEY.exec(key);
  if (m) {
    const index = Number(m[1]);
    return {
      ...doc,
      agents: doc.agents.map((a, i) => (i === index ? { ...a, [m[2]]: photo } : a)),
    };
  }
  return { ...doc, photos: { ...doc.photos, [key]: photo } };
};

/** A picture just placed: centred, as loose as the frame allows. */
export const placed = (src: PhotoSource): Photo => ({ src, x: 0.5, y: 0.5, zoom: 1 });

/* -------------------------------------------------------------------------- */
/* Blank documents                                                             */
/* -------------------------------------------------------------------------- */

export const blankAgent = (): Agent => ({
  name: '',
  title: 'REALTOR®',
  phone: '',
  email: '',
  web: '',
  brokerage: '',
  photo: null,
  logo: null,
});

export const blankRow = (): Row => ({ label: '', date: '', value: '' });

/**
 * A new document. `me` is the agent it starts with — Kevin, from SITE, passed
 * in rather than imported so this file stays free of the site's configuration.
 */
export const blankDoc = (kind: DocKind, me: Agent): MarketingDoc => ({
  kind,
  design: defaultDesign(kind),
  mls: '',
  photoCount: 0,
  office: '',
  street: '',
  cityLine: '',
  headline: 'Welcome Home',
  price: '',
  description: '',
  stats: [],
  features: [],
  back: 'photos',
  planCaptions: ['First floor', 'Second floor', 'Third floor'],
  photos: {},
  uploads: [],
  agents: [me],
  rows: kind === 'booklet' ? [] : [blankRow(), blankRow(), blankRow()],
  note: '',
});

/* -------------------------------------------------------------------------- */
/* Reading a stored document                                                   */
/* -------------------------------------------------------------------------- */

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const text = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

const clamp = (v: unknown, low: number, high: number, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(high, Math.max(low, v)) : fallback;

/** How far in a crop can go. Past this a 1280px photo is a smear at any size. */
export const MAX_ZOOM = 4;

const cleanSource = (v: unknown): PhotoSource | null => {
  if (!isObject(v)) return null;
  if (v.type === 'mls' && typeof v.mls === 'string' && v.mls && typeof v.n === 'number') {
    return { type: 'mls', mls: v.mls, n: Math.max(0, Math.floor(v.n)) };
  }
  if ((v.type === 'upload' || v.type === 'site') && typeof v.path === 'string' && v.path) {
    return { type: v.type, path: v.path };
  }
  return null;
};

const cleanPhoto = (v: unknown): Photo | null => {
  if (!isObject(v)) return null;
  const src = cleanSource(v.src);
  if (!src) return null;
  return {
    src,
    x: clamp(v.x, 0, 1, 0.5),
    y: clamp(v.y, 0, 1, 0.5),
    zoom: clamp(v.zoom, 1, MAX_ZOOM, 1),
  };
};

const cleanAgent = (v: unknown): Agent | null => {
  if (!isObject(v)) return null;
  const blank = blankAgent();
  return {
    name: text(v.name),
    title: text(v.title, blank.title),
    phone: text(v.phone),
    email: text(v.email),
    web: text(v.web),
    brokerage: text(v.brokerage),
    photo: cleanPhoto(v.photo),
    logo: cleanPhoto(v.logo),
  };
};

const list = <T>(v: unknown, clean: (item: unknown) => T | null): T[] =>
  Array.isArray(v) ? v.map(clean).filter((item): item is T => item !== null) : [];

/**
 * A stored document, made whole.
 *
 * Whatever is in the column is laid over a blank document field by field, and a
 * field is kept only where it is the right type. So a document saved before a
 * field existed still opens, and one saved with something this version no
 * longer understands opens without it — the same rule hydrateApplication
 * follows, and for the same reason: the column outlives any one shape of it.
 * Nothing here can throw.
 */
export const hydrateDoc = (stored: unknown, kind: DocKind, me: Agent): MarketingDoc => {
  const blank = blankDoc(kind, me);
  if (!isObject(stored)) return blank;

  const photos: Record<string, Photo | null> = {};
  if (isObject(stored.photos)) {
    for (const [key, value] of Object.entries(stored.photos)) {
      const photo = cleanPhoto(value);
      if (photo) photos[key] = photo;
    }
  }

  const agents = list(stored.agents, cleanAgent).slice(0, MAX_AGENTS);
  const planCaptions = list(stored.planCaptions, (c) => (typeof c === 'string' ? c : null));

  const doc: MarketingDoc = {
    ...blank,
    design: text(stored.design, blank.design),
    mls: text(stored.mls),
    photoCount: clamp(stored.photoCount, 0, 500, 0),
    office: text(stored.office),
    street: text(stored.street),
    cityLine: text(stored.cityLine),
    headline: text(stored.headline, blank.headline),
    price: text(stored.price),
    description: text(stored.description),
    stats: list(stored.stats, (s) =>
      isObject(s) ? { label: text(s.label), value: text(s.value) } : null
    ),
    features: list(stored.features, (f) => (typeof f === 'string' ? f : null)),
    back: stored.back === 'plan' ? 'plan' : 'photos',
    planCaptions: blank.planCaptions.map((fallback, i) => planCaptions[i] ?? fallback),
    photos,
    uploads: list(stored.uploads, (p) => (typeof p === 'string' && p ? p : null)),
    agents: agents.length > 0 ? agents : blank.agents,
    rows: Array.isArray(stored.rows)
      ? list(stored.rows, (r) =>
          isObject(r) ? { label: text(r.label), date: text(r.date), value: text(r.value) } : null
        )
      : blank.rows,
    note: text(stored.note),
  };
  // A design this version does not have (renamed, or another kind's) falls back
  // to the kind's first rather than drawing nothing.
  return { ...doc, design: designOf(doc).id };
};

/** The line a document is listed under. */
export const docTitle = (doc: Pick<MarketingDoc, 'street' | 'cityLine'>): string =>
  [doc.street.trim(), doc.cityLine.trim()].filter(Boolean).join(', ');

/* -------------------------------------------------------------------------- */
/* Filling one in from MLS                                                     */
/* -------------------------------------------------------------------------- */

/** The columns of an idx_listings row this reads. An IdxListing satisfies it. */
export interface ListingFacts {
  mls_number: string;
  address: string | null;
  town: string | null;
  state: string | null;
  zip: string | null;
  prop_type: string | null;
  list_price: number | null;
  bedrooms: number | null;
  full_baths: number | null;
  half_baths: number | null;
  living_area: number | null;
  lot_size: number | null;
  year_built: number | null;
  garage_spaces: number | null;
  parking_spaces: number | null;
  total_rooms: number | null;
  hoa_fee: number | null;
  num_units: number | null;
  remarks: string | null;
  photo_count: number | null;
}

const whole = (v: number | null | undefined): string =>
  v === null || v === undefined || !Number.isFinite(v)
    ? ''
    : new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v);

/** A count that is only worth printing when there is one: no "0 garage spaces". */
const some = (v: number | null | undefined): string => (v !== null && v !== undefined && v > 0 ? whole(v) : '');

/**
 * Baths as a booklet prints them: "2", "2.5" — and, past one half bath, spelled
 * out. "3" for two full and two half would be a different house.
 */
export const bathsLine = (full: number | null, half: number | null): string => {
  const f = full ?? 0;
  const h = half ?? 0;
  if (f === 0 && h === 0) return '';
  if (h === 0) return String(f);
  if (h === 1) return `${f}.5`;
  return `${f} full, ${h} half`;
};

/**
 * The price line. Empty rather than wrong: listings are entered at $1 for
 * auctions and "price on request", and a booklet printing $1 is worse than one
 * with a blank Kevin fills in. The same $10,000 floor valuation.ts uses.
 */
export const priceLine = (listing: Pick<ListingFacts, 'list_price' | 'prop_type'>): string => {
  const price = listing.list_price;
  if (price === null || price <= 0) return '';
  if (listing.prop_type === 'RN') return `${formatPrice(price)}/mo`;
  return price < 10_000 ? '' : formatPrice(price);
};

/**
 * The facts, in the order a booklet wants them, WITHOUT the ones MLS does not
 * have. Size and rooms first, since every design shows the first few; then what
 * distinguishes this kind of home — a condo's fee, a house's year.
 */
export const statsFrom = (l: ListingFacts): Stat[] => {
  const condo = l.prop_type === 'CC';
  const year = l.year_built !== null && l.year_built > 1600 ? String(l.year_built) : '';
  const fee = l.hoa_fee !== null && l.hoa_fee > 0 ? `${formatPrice(l.hoa_fee)}/mo` : '';
  const garage = some(l.garage_spaces);
  const parking = some(l.parking_spaces);

  const stats: Stat[] = [
    { label: 'Square feet', value: some(l.living_area) },
    { label: 'Bedrooms', value: l.bedrooms === 0 ? 'Studio' : some(l.bedrooms) },
    { label: 'Bathrooms', value: bathsLine(l.full_baths, l.half_baths) },
    ...(l.prop_type === 'MF' ? [{ label: 'Units', value: some(l.num_units) }] : []),
    garage ? { label: 'Garage', value: garage } : { label: 'Parking', value: parking },
    condo ? { label: 'HOA fee', value: fee } : { label: 'Year built', value: year },
    // The rest, for whoever wants to move one up.
    ...(garage ? [{ label: 'Parking', value: parking }] : []),
    ...(condo ? [{ label: 'Year built', value: year }] : [{ label: 'HOA fee', value: fee }]),
    // Not on a condo: its lot is the whole complex's.
    ...(condo ? [] : [{ label: 'Lot (sq ft)', value: some(l.lot_size) }]),
    { label: 'Rooms', value: some(l.total_rooms) },
  ];
  return stats.filter((s) => s.value !== '');
};

/** "Medford, MA 02155". */
export const cityLineOf = (l: Pick<ListingFacts, 'town' | 'state' | 'zip'>): string => {
  const town = casedAddress(l.town ?? '');
  const tail = [(l.state ?? '').trim().toUpperCase(), (l.zip ?? '').trim()].filter(Boolean).join(' ');
  return [town, tail].filter(Boolean).join(', ');
};

/** The order MLS photos are dealt into frames: the cover first, then inside, then the back. */
const DEAL_ORDER = [
  'cover',
  'in1', 'in2', 'in3', 'in4', 'in5', 'in6', 'in7', 'in8',
  'back1', 'back2',
];

/**
 * MLS photos, dealt into the frames in order. A listing with fewer photos than
 * frames leaves the rest EMPTY rather than repeating one: an empty frame is
 * visible in the editor and gets filled, a repeated kitchen gets printed.
 */
export const dealPhotos = (mls: string, count: number): Record<string, Photo | null> => {
  const photos: Record<string, Photo | null> = {};
  DEAL_ORDER.forEach((key, n) => {
    if (n < count) photos[key] = placed({ type: 'mls', mls, n });
  });
  // A sheet's one picture is the same front-of-house photo as the cover.
  if (count > 0) photos.header = placed({ type: 'mls', mls, n: 0 });
  return photos;
};

/**
 * A listing chosen: the address, the facts and the photographs are replaced
 * with MLS's. The design, the agents, the rows of a sheet and the pictures
 * Kevin uploaded are left alone — choosing a listing on an expense sheet he has
 * half typed must not empty it.
 */
export const seedFromListing = (doc: MarketingDoc, l: ListingFacts, office: string | null): MarketingDoc => {
  const count = Math.max(0, l.photo_count ?? 0);
  // Uploaded pictures stay where they were put; MLS pictures are re-dealt.
  const kept = Object.fromEntries(
    Object.entries(doc.photos).filter(([, photo]) => photo && photo.src.type === 'upload')
  );
  return {
    ...doc,
    mls: l.mls_number,
    photoCount: count,
    office: office ?? '',
    street: casedAddress(l.address ?? ''),
    cityLine: cityLineOf(l),
    price: priceLine(l),
    description: (l.remarks ?? '').trim(),
    stats: statsFrom(l),
    photos: { ...dealPhotos(l.mls_number, count), ...kept },
  };
};

/**
 * "Update price from MLS": the one fact that changes while a home is listed.
 * Everything else on the page may have been reworded by hand and is not
 * touched. Returns the document unchanged when MLS has no usable price.
 */
export const refreshPrice = (doc: MarketingDoc, l: ListingFacts): MarketingDoc => {
  const price = priceLine(l);
  return { ...doc, photoCount: Math.max(0, l.photo_count ?? 0), price: price || doc.price };
};

/* -------------------------------------------------------------------------- */
/* The crop                                                                    */
/* -------------------------------------------------------------------------- */

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** The size a picture is drawn at inside its frame, in the frame's own units. */
export const drawnSize = (
  frameW: number,
  frameH: number,
  naturalW: number,
  naturalH: number,
  zoom: number,
  fit: 'cover' | 'contain'
): { w: number; h: number } => {
  if (!(naturalW > 0) || !(naturalH > 0)) return { w: frameW * zoom, h: frameH * zoom };
  const ratios = [frameW / naturalW, frameH / naturalH];
  const scale = (fit === 'cover' ? Math.max(...ratios) : Math.min(...ratios)) * zoom;
  return { w: naturalW * scale, h: naturalH * scale };
};

/**
 * Where the picture's top-left corner sits, relative to the frame's.
 *
 * `x` is how the slack is shared: 0 puts the picture's left edge on the
 * frame's, 1 its right edge on the frame's right. That holds whether the
 * picture is larger than the frame (the offset is negative — it is cropped) or
 * smaller (a floor plan with room either side). So for a `cover` picture, every
 * x and y from 0 to 1 fills the frame: THERE IS NO VALUE THAT SHOWS AN EMPTY
 * EDGE, which is why the editor needs no "snap back".
 *
 * The page draws with THESE numbers (Pic.tsx sets the picture's size and
 * position from drawnSize and this), so the arithmetic that is checked and the
 * drawing that is printed cannot disagree about where a drag ends up.
 */
export const drawnOffset = (
  photo: Pick<Photo, 'x' | 'y'>,
  frameW: number,
  frameH: number,
  drawn: { w: number; h: number }
): { left: number; top: number } => ({
  left: photo.x * (frameW - drawn.w),
  top: photo.y * (frameH - drawn.h),
});

/**
 * A drag of (dx, dy) frame pixels. The picture follows the pointer, so dragging
 * right reveals more of its left. With no slack on an axis there is nowhere to
 * move, and the picture stays put on it rather than dividing by zero.
 */
export const panBy = (
  photo: Photo,
  dx: number,
  dy: number,
  frameW: number,
  frameH: number,
  naturalW: number,
  naturalH: number,
  fit: 'cover' | 'contain'
): Photo => {
  const drawn = drawnSize(frameW, frameH, naturalW, naturalH, photo.zoom, fit);
  const slackX = frameW - drawn.w;
  const slackY = frameH - drawn.h;
  return {
    ...photo,
    x: Math.abs(slackX) < 0.5 ? photo.x : clamp01(photo.x + dx / slackX),
    y: Math.abs(slackY) < 0.5 ? photo.y : clamp01(photo.y + dy / slackY),
  };
};

/** A frame is laid out in CSS pixels at 96 to the inch, which is also how it prints. */
export const CSS_PX_PER_INCH = 96;

/**
 * Photograph pixels per printed inch, for a picture in a frame.
 *
 * 300 is what a print shop asks for and 200 looks sharp at arm's length. Below
 * SOFT_PPI the softness shows, and that is the common case for one listing in
 * three: MLS PIN serves whatever the listing agent uploaded, and measured on
 * 2026-10-09 that was 2048px wide on one Newton listing and 481px on another.
 */
export const printPpi = (
  frameW: number,
  frameH: number,
  naturalW: number,
  naturalH: number,
  zoom: number,
  fit: 'cover' | 'contain'
): number => {
  const drawn = drawnSize(frameW, frameH, naturalW, naturalH, zoom, fit);
  return drawn.w > 0 ? (naturalW / drawn.w) * CSS_PX_PER_INCH : 0;
};

export const SOFT_PPI = 150;

/* -------------------------------------------------------------------------- */
/* Sheets: rows, totals, pages                                                 */
/* -------------------------------------------------------------------------- */

/** A row with nothing in it is not printed and not counted. */
export const printableRows = (rows: Row[]): Row[] =>
  rows.filter((r) => r.label.trim() || r.value.trim() || r.date.trim());

/**
 * Lines pasted from somewhere else, as rows.
 *
 * Kevin's existing sheets are lists in a slide program, and retyping twenty-six
 * upgrades to try this is the kind of first step that stops a person. A paste
 * of several lines becomes several rows: a leading year is the date (upgrades
 * only), and everything from the first "$" is the value. Cells split by a tab —
 * a paste from a spreadsheet — are taken as they are.
 *
 * It only SPLITS; it never guesses. A line with no "$" is a label with no
 * value, and a line with no year has no date — it does not inherit the year
 * above it, because nothing in the text says it should.
 */
export const rowsFromText = (pasted: string, kind: DocKind): Row[] =>
  pasted
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cells = line.split('\t').map((c) => c.trim()).filter(Boolean);
      if (cells.length >= 2) {
        const dated = kind === 'upgrades' && /^(19|20)\d{2}$/.test(cells[0]);
        return dated
          ? { label: cells[1], date: cells[0], value: cells.slice(2).join(' ') }
          : { label: cells[0], date: '', value: cells.slice(1).join(' ') };
      }
      let rest = line;
      let date = '';
      const year = kind === 'upgrades' ? /^((?:19|20)\d{2})\s+(\S.*)$/.exec(rest) : null;
      if (year) {
        date = year[1];
        rest = year[2];
      }
      const priced = /^(.*?\S)\s+(\$\s?\d.*)$/.exec(rest);
      return priced ? { label: priced[1], date, value: priced[2] } : { label: rest, date, value: '' };
    });

/** "$31,186.00", "31186", "$980" — and nothing else. */
const MONEY = /^\$?\s*(\d{1,3}(?:,\d{3})+|\d+)(\.\d{1,2})?$/;

export const parseMoney = (value: string): number | null => {
  const m = MONEY.exec(value.trim());
  if (!m) return null;
  return Number(m[1].replace(/,/g, '') + (m[2] ?? ''));
};

export const formatMoney = (amount: number, cents: boolean): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(amount);

/**
 * The total of a sheet's values — or null, which is the usual answer.
 *
 * Only when EVERY printed row carries a plain dollar amount. One row reading
 * "$70 - $80 / month", or one with no figure at all, and there is no total:
 * adding up the rows that happen to parse would print a sum that is not the sum
 * of the page above it. Summed in cents so 26 lines of dollars-and-cents do not
 * come out a fraction of a cent adrift.
 */
export const sumValues = (rows: Row[]): string | null => {
  const printed = printableRows(rows);
  if (printed.length < 2) return null;
  let cents = 0;
  let anyCents = false;
  for (const row of printed) {
    const amount = parseMoney(row.value);
    if (amount === null) return null;
    cents += Math.round(amount * 100);
    if (/\.\d/.test(row.value)) anyCents = true;
  }
  return formatMoney(cents / 100, anyCents);
};

export type Density = 'airy' | 'regular' | 'compact';

/**
 * How large a sheet's list is set, and how many lines of it fit on a page.
 * Kevin's own sheets do this by hand: six expenses are set large, twenty-six
 * upgrades small. Each design draws its table in at least the height these
 * line counts assume.
 */
export const DENSITY: Record<Density, { linesPerPage: number; fontPx: number }> = {
  airy: { linesPerPage: 7, fontPx: 20 },
  regular: { linesPerPage: 10, fontPx: 17 },
  compact: { linesPerPage: 14, fontPx: 14.5 },
};

export interface SheetRow extends Row {
  /** The date to print: blank when it repeats the row above, so a year heads its group. */
  dateCell: string;
}

export interface SheetLayout {
  density: Density;
  showDate: boolean;
  showValue: boolean;
  /** At least one page, even for an empty sheet. */
  pages: SheetRow[][];
  /** Printed under the last page's rows. Null when there is no honest total. */
  total: string | null;
}

/** The width a sheet's table is laid out in, in CSS px. The narrowest design's. */
const TABLE_PX = 640;
const DATE_PX = 96;
/**
 * How wide a character runs, as a fraction of the font size. Measured off
 * Kevin's own expense sheet: "$100 - $120 / MONTH / UNIT" is 26 characters in
 * 273px at 21px, which is 0.50; a run of plain capitals is nearer 0.60. This
 * sits between them, and each design leaves a line of slack above its footer
 * for the label that turns out wider than its count.
 */
const CAP_WIDTH = 0.56;

const linesOf = (value: string, charsPerLine: number): number =>
  value
    .split('\n')
    .reduce((sum, part) => sum + Math.max(1, Math.ceil(part.trim().length / charsPerLine)), 0);

/**
 * A sheet, laid out: which columns exist, how large the list is set, and where
 * it breaks.
 *
 * A COLUMN EXISTS ONLY WHEN SOMETHING IS IN IT. That one rule is Kevin's three
 * upgrade sheets: dates and upgrades (Billerica), upgrades alone (Dedham),
 * upgrades and values with a total (Natick). An expense sheet always has its
 * second column, since "what it costs" is the point of it.
 *
 * Page breaks are worked out from the text, not measured from the page: a
 * label too long for its column counts as two lines. The estimate is
 * deliberately tight-fisted — a row sent to the next page early costs nothing,
 * and one that runs into the footer is a spoiled sheet.
 */
export const layoutSheet = (doc: Pick<MarketingDoc, 'kind' | 'rows'> & { note?: string }): SheetLayout => {
  const rows = printableRows(doc.rows);
  const showDate = doc.kind === 'upgrades' && rows.some((r) => r.date.trim());
  const showValue = doc.kind === 'expenses' || rows.some((r) => r.value.trim());
  const total = doc.kind === 'upgrades' && showValue ? sumValues(rows) : null;

  const valuePx = !showValue ? 0 : doc.kind === 'expenses' ? TABLE_PX * 0.48 : 150;
  const labelPx = TABLE_PX - valuePx - (showDate ? DATE_PX : 0);

  const heights = (density: Density): number[] => {
    const charPx = DENSITY[density].fontPx * CAP_WIDTH;
    return rows.map((r) =>
      Math.max(
        linesOf(r.label, Math.floor(labelPx / charPx)),
        showValue ? linesOf(r.value, Math.max(6, Math.floor(valuePx / charPx))) : 1
      )
    );
  };

  // The total and the small print each take a line under the last row.
  const extra = (total ? 1 : 0) + (doc.note?.trim() ? 1 : 0);
  const fits = (density: Density): boolean =>
    heights(density).reduce((a, b) => a + b, 0) + extra <= DENSITY[density].linesPerPage;
  const density: Density = fits('airy') ? 'airy' : fits('regular') ? 'regular' : 'compact';

  const capacity = DENSITY[density].linesPerPage;
  const tall = heights(density);
  const pages: SheetRow[][] = [[]];
  let used = 0;
  rows.forEach((row, i) => {
    // A row taller than a whole page still has to go somewhere: alone on one.
    if (used > 0 && used + tall[i] > capacity) {
      pages.push([]);
      used = 0;
    }
    const page = pages[pages.length - 1];
    const above = page[page.length - 1];
    page.push({ ...row, dateCell: above && above.date.trim() === row.date.trim() ? '' : row.date.trim() });
    used += tall[i];
  });
  // What goes under the last row needs room of its own; if the last page is
  // full it would land on the footer, so it takes the last row with it to a new
  // page rather than sitting there alone.
  if (extra > 0 && used + extra > capacity && pages[pages.length - 1].length > 1) {
    const last = pages[pages.length - 1].pop() as SheetRow;
    pages.push([{ ...last, dateCell: last.date.trim() }]);
  }
  return { density, showDate, showValue, pages, total };
};

/** The two words of a sheet's title: "Home" and what the sheet is. */
export const sheetWord = (kind: DocKind): string => (kind === 'expenses' ? 'expenses' : 'upgrades');

/** Column headings, as Kevin's sheets have them. */
export const sheetHeadings = (kind: DocKind): { label: string; value: string; date: string } =>
  kind === 'expenses'
    ? { label: 'Expenses', value: 'Estimated price', date: '' }
    : { label: 'Upgrades', value: 'Value', date: 'Date' };
