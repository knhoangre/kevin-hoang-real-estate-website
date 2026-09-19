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
 * Google search is the one entry that cannot be a literal hostname: the ccTLDs
 * are open-ended (google.com, google.co.uk, google.de). Tested AFTER the table
 * so `gemini.google.com` still resolves to the AI surface, which is the more
 * specific answer — the same precedence `copilot.microsoft.com` has over
 * `bing.com` by sitting above it there.
 */
const GOOGLE_SEARCH = /(^|\.)google\.[a-z]{2,}(\.[a-z]{2,})?$/;

/**
 * Classifies a referrer URL.
 *
 * Matched on exact host or registrable-domain suffix ONLY. A substring test
 * lived here until 2026-09-19 and was far too loose — any host merely
 * CONTAINING `t.co` was booked as social, which caught `blogspot.co.uk`,
 * `support.corp.com` and every `*t.co*` domain, corrupting the one dimension
 * this file exists to produce.
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
    if (host === needle || host.endsWith(`.${needle}`)) return source;
  }
  if (GOOGLE_SEARCH.test(host)) return 'search_google';

  return 'referral';
};

/**
 * The path as GA4 should see it, with one-time secrets removed.
 *
 * A rental invite token is a credential — `rental-application-invite` returns one
 * identical `{valid:false}` for every failure precisely so the endpoint cannot be
 * used to guess one — and sending the token itself to a third party undoes that
 * care. Four of them were readable in the GA4 property as full `/apply/<token>`
 * URLs before this existed.
 *
 * The segment is replaced rather than the whole path dropped, because "how many
 * people opened an invite" is worth measuring and "which invite" is not.
 *
 * Callers MUST build `page_location` from the origin plus this, never from
 * `window.location.href`: GA4's path dimension strips the query string but
 * `page_location` retains it, and /auth/callback carries the PKCE `code` there.
 */
export const analyticsPath = (pathname: string): string =>
  pathname.startsWith('/apply/') ? '/apply/:token' : pathname;

/**
 * Routes that are us, not an audience.
 *
 * Admin and CRM usage was the single largest block of traffic in the property —
 * 558 views against the homepage's 335 in the 28 days to 2026-09-18 — so every
 * property-level average was being set from the inside. The tell was 14.5 views
 * per active user on the homepage where pages outside people reach sit at 1.0-1.6.
 *
 * Suppressed at the source rather than with a GA4 internal-traffic IP filter: an
 * IP filter misses a phone on cellular and applies only from the day it is made.
 *
 * Deliberately NARROWER than PRIVATE_PREFIXES in scripts/routes.mjs, which this
 * mirrors two entries of. /apply, /rentals, /profile and /auth are gated too, but
 * they are applicants rather than us and are among the few conversion signals
 * this property has.
 */
const INTERNAL_PREFIXES = ['/admin', '/crm'];

export const isInternalPath = (pathname: string): boolean =>
  INTERNAL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

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
 * is not visible until a report looks wrong weeks later. Mark all five as Key
 * Events in the GA4 UI — until that is done GA4 collects them but reports zero
 * conversions, which is what the property showed for the whole of August 2026.
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
  /** A rental application was submitted. Separate from `lead`: it is the end of
   *  a funnel an invite already started, not the top of a new one. */
  application: 'rental_application_submitted',
} as const;
