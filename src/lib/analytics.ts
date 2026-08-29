/**
 * Event tracking, and where a visit came from.
 *
 * Until this existed, GA4 recorded `page_view` and nothing else, so no visit
 * could be tied to an outcome — traffic was measurable, results were not.
 *
 * WHAT THIS CAN AND CANNOT TELL YOU. Search engines do not send the query with
 * the click. Google's queries live in Search Console, never in GA4; link the two
 * properties to read them. AI assistants send no query at all, and often no
 * referrer either, so the realistic goal here is CHANNEL attribution — "this
 * lead came from ChatGPT" — not query attribution. Anything promising the
 * latter for AI traffic is inferring it.
 *
 * Safe un-configured, like <Analytics> and submit-indexnow.mjs: with no
 * SITE.ga4Id there is no gtag on the page, and every call here is a no-op.
 */

/** Where a session came from, as far as the referrer can tell us. */
export type TrafficSource =
  | 'ai_chatgpt'
  | 'ai_perplexity'
  | 'ai_claude'
  | 'ai_copilot'
  | 'ai_gemini'
  | 'search_google'
  | 'search_bing'
  | 'search_other'
  | 'social'
  | 'referral'
  | 'direct';

/**
 * Referrer hostname -> source. Matched on the registrable-domain suffix, so
 * `www.perplexity.ai` and `perplexity.ai` both hit.
 *
 * The AI entries are the reason this file exists. In GA4's default reports these
 * land in "Referral" next to any blog that happened to link here, or — when the
 * assistant sends no referrer, which is common — in "Direct", indistinguishable
 * from someone typing the URL. Neither tells you the answer engine is working.
 */
const SOURCES: [string, TrafficSource][] = [
  ['chatgpt.com', 'ai_chatgpt'],
  ['chat.openai.com', 'ai_chatgpt'],
  ['openai.com', 'ai_chatgpt'],
  ['perplexity.ai', 'ai_perplexity'],
  ['claude.ai', 'ai_claude'],
  ['anthropic.com', 'ai_claude'],
  ['copilot.microsoft.com', 'ai_copilot'],
  ['bing.com', 'search_bing'],
  ['gemini.google.com', 'ai_gemini'],
  ['google.', 'search_google'],
  ['duckduckgo.com', 'search_other'],
  ['ecosia.org', 'search_other'],
  ['search.yahoo.com', 'search_other'],
  ['facebook.com', 'social'],
  ['instagram.com', 'social'],
  ['linkedin.com', 'social'],
  ['t.co', 'social'],
  ['x.com', 'social'],
  ['youtube.com', 'social'],
];

/**
 * Classifies a referrer URL.
 *
 * Order matters: `copilot.microsoft.com` and `gemini.google.com` are tested
 * before the bare `bing.com` / `google.` entries, because both are substrings of
 * their parent search engine and the AI surface is the more specific answer.
 */
export const classifyReferrer = (referrer: string, currentHost: string): TrafficSource => {
  if (!referrer) return 'direct';

  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return 'direct';
  }

  // Navigation within our own site is not a new source.
  if (host === currentHost.toLowerCase()) return 'direct';

  for (const [needle, source] of SOURCES) {
    if (host === needle || host.endsWith(`.${needle}`) || host.includes(needle)) {
      return source;
    }
  }
  return 'referral';
};

const STORAGE_KEY = 'kh_traffic_source';

/**
 * The source for THIS session, resolved once on the first page and reused.
 *
 * Sticky because the referrer is only present on the entry page: without this,
 * a lead submitted on the third page would be attributed to `direct` and the
 * ChatGPT visit that produced it would go unrecorded.
 *
 * sessionStorage rather than localStorage — the attribution belongs to the
 * visit, not the person, and a source remembered across visits would credit
 * every later direct return to whatever brought them the first time.
 *
 * MUST be called from an effect, never during render. Reading browser storage
 * at module scope or in a render body is what made the i18n language detector
 * a hydration mismatch here; the same rule applies to anything touching
 * `document` or `sessionStorage`.
 */
export const resolveTrafficSource = (): TrafficSource => {
  if (typeof window === 'undefined') return 'direct';

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored) return stored as TrafficSource;
  } catch {
    // Private mode and "block site data" both throw on access rather than
    // returning null. Fall through and classify without persisting.
  }

  const source = classifyReferrer(document.referrer, window.location.hostname);

  try {
    window.sessionStorage.setItem(STORAGE_KEY, source);
  } catch {
    // Non-fatal: the event still carries the source, it just re-derives on the
    // next page (and becomes 'direct' there, since the referrer is gone).
  }

  return source;
};

/**
 * Sends a GA4 event.
 *
 * Every event carries `traffic_source`, which is the whole point — an event
 * without it says something happened, not what produced it. Register it as a
 * custom dimension in GA4 (Admin -> Custom definitions) or it is collected but
 * not reportable.
 *
 * No-ops when gtag is absent, so call sites need no guard of their own.
 */
export const track = (name: string, params: Record<string, unknown> = {}): void => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  window.gtag('event', name, {
    ...params,
    traffic_source: resolveTrafficSource(),
  });
};

/**
 * The conversions worth naming.
 *
 * Kept as constants rather than free strings: GA4 silently accepts a misspelled
 * event name and creates a second, near-empty event beside the real one, which
 * is not visible until a report looks wrong weeks later. Mark all four as Key
 * Events in the GA4 UI.
 */
export const EVENTS = {
  /** Contact form submitted successfully. The primary conversion. */
  lead: 'generate_lead',
  /** A tel: link was activated. */
  call: 'contact_call',
  /** An sms: link was activated. */
  text: 'contact_text',
  /** The scheduling link was opened. */
  appointment: 'appointment_click',
} as const;
