/**
 * Authenticated download of the MLS PIN IDX feeds.
 *
 * PORTED from the working implementation in the real-estate-marketing project
 * (src/lib/mlspin-fetch.ts). Every non-obvious step below was established there
 * against the live site; none of it is guesswork, and none of it should be
 * "simplified" without testing against MLS PIN itself.
 *
 * WHY A SCRIPTED LOGIN AT ALL. The IDX download endpoints require the agent's
 * signed-in MLS PIN session — an anonymous request 302s to /signin.asp. The
 * reference tables (towns, offices, agents) are public; the listing data is not.
 * MLS PIN's IDX downloads are a human interface, so an unattended job has to
 * present the same credentials a person would.
 *
 * Credentials come from Supabase secrets and are never stored in the database,
 * never logged, and never returned to a caller:
 *   MLSPIN_USERNAME
 *   MLSPIN_PASSWORD
 *   MLSPIN_IDX_USER_ID    the IDX subscriber id in the feed URL, e.g. CN244432
 *   MLSPIN_BASE_URL       optional, defaults to https://h3r.mlspin.com
 *
 * SAFETY: a failed login throws immediately and is never retried, so a wrong or
 * rotated password cannot hammer MLS PIN into locking the account. That matters
 * more than a successful sync — a locked MLS account stops Kevin working, not
 * just the website.
 */

const CONSENT_COOKIE = 'mlsCookieConsent';
const REQUEST_TIMEOUT_MS = 120_000;

export const baseUrl = () =>
  Deno.env.get('MLSPIN_BASE_URL') ?? 'https://h3r.mlspin.com';

export function isConfigured(): boolean {
  return Boolean(
    Deno.env.get('MLSPIN_USERNAME') &&
      Deno.env.get('MLSPIN_PASSWORD') &&
      Deno.env.get('MLSPIN_IDX_USER_ID')
  );
}

const timeout = () => AbortSignal.timeout(REQUEST_TIMEOUT_MS);

function mergeCookies(jar: Map<string, string>, res: Response): void {
  for (const sc of res.headers.getSetCookie()) {
    const first = sc.split(';', 1)[0];
    const eq = first.indexOf('=');
    if (eq > 0) {
      const name = first.slice(0, eq).trim();
      if (name) jar.set(name, first.slice(eq + 1).trim());
    }
  }
}

const cookieHeader = (jar: Map<string, string>) =>
  [...jar].map(([k, v]) => `${k}=${v}`).join('; ');

/**
 * Sign in and return a cookie jar carrying the authenticated session.
 */
export async function login(): Promise<string> {
  const base = baseUrl();
  const signinUrl = `${base}/signin.asp`;
  // The sign-in form posts to signin.asp only until cookie consent is given;
  // once the consent cookie exists its JS retargets the form to
  // validate_new.asp, which is the endpoint that actually authenticates.
  // Posting to signin.asp without it simply re-renders the form.
  const validateUrl = `${base}/validate_new.asp`;

  const jar = new Map<string, string>();

  // 1. GET the form to seed the session cookie and collect the hidden fields —
  //    one carries an anti-bot token echoing the page load time, so they have to
  //    be sent back verbatim rather than reconstructed.
  const page = await fetch(signinUrl, { redirect: 'follow', signal: timeout() });
  mergeCookies(jar, page);
  const html = await page.text();

  const form = new URLSearchParams();
  for (const tag of html.match(/<input[^>]*>/gi) ?? []) {
    const type = (/type=["']([^"']*)["']/i.exec(tag) ?? [])[1]?.toLowerCase();
    const name = (/name=["']([^"']*)["']/i.exec(tag) ?? [])[1];
    const value = (/value=["']([^"']*)["']/i.exec(tag) ?? [])[1] ?? '';
    if (name && type === 'hidden') form.set(name, value);
  }
  form.set('user_name', Deno.env.get('MLSPIN_USERNAME')!);
  form.set('pass', Deno.env.get('MLSPIN_PASSWORD')!);
  form.set('signin', 'Sign In');

  jar.set(CONSENT_COOKIE, '1');

  // 2. POST. `redirect: 'manual'` on purpose — the redirect TARGET is how
  //    success is told from failure.
  const post = await fetch(validateUrl, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookieHeader(jar),
      Referer: signinUrl,
    },
    body: form.toString(),
    signal: timeout(),
  });
  mergeCookies(jar, post);

  // Success is a 3xx AWAY from the sign-in page. A failed login re-renders the
  // form with a 200, or redirects back to signin.asp. Do not key off the .MLSPIN
  // cookie: it is set (empty) on the very first GET, so its presence proves
  // nothing about being authenticated.
  const location = post.headers.get('location') ?? '';
  const redirected = post.status >= 300 && post.status < 400;
  if (!redirected || /signin/i.test(location)) {
    throw new Error('MLS PIN login failed — check MLSPIN_USERNAME / MLSPIN_PASSWORD');
  }

  return cookieHeader(jar);
}

/** The feed URL for one property type. */
export const feedUrl = (propType: string, sold = false) => {
  const userId = Deno.env.get('MLSPIN_IDX_USER_ID')!;
  const base = `${baseUrl()}/tools/idx/idxDownloads/idx.asp` +
    `?userId=${encodeURIComponent(userId)}&proptype=${encodeURIComponent(propType)}`;
  return sold ? `${base}&status=SLD` : base;
};

/**
 * Download one feed with an authenticated session.
 *
 * Throws rather than returning junk if the session was not accepted: the
 * sign-in page is valid HTML and would otherwise parse to zero listings, which
 * the ingest would faithfully interpret as "the feed is empty, delete
 * everything". That failure mode is why this checks the header row.
 */
export async function fetchFeed(cookie: string, url: string): Promise<string> {
  const res = await fetch(url, {
    redirect: 'manual',
    headers: { Cookie: cookie },
    signal: timeout(),
  });

  if (res.status >= 300 && res.status < 400) {
    throw new Error(`Feed download redirected (session not accepted): ${url}`);
  }

  /*
   * Decoded as Windows-1252, NOT UTF-8.
   *
   * The feed is cp1252, and `res.text()` assumes UTF-8 — which turns every
   * curly apostrophe (0x92) into the replacement character. That is 1,263
   * occurrences in the first 4 MB of the single-family file alone, so listing
   * remarks arrive reading "Boston<?>s most storied neighborhood". The bytes
   * are unambiguous: 0x80-0x9F is undefined in Latin-1 and invalid as UTF-8, so
   * cp1252 is the only reading under which they are text at all.
   */
  const text = new TextDecoder('windows-1252').decode(await res.arrayBuffer());
  if (!/^\s*PROP_TYPE\|/i.test(text)) {
    throw new Error(
      `Unexpected non-feed response for ${url} (got "${text.slice(0, 40).replace(/\s+/g, ' ')}…")`
    );
  }
  return text;
}

/**
 * Download one feed as a STREAM of lines.
 *
 * fetchFeed() reads the whole body into a string, which is fine for the active
 * feeds and fatal for the sold ones: the sold single-family file is 66 MB, and
 * a JS string holds it as UTF-16 — roughly 132 MB, before the parsed rows. That
 * exhausted the Edge Function worker outright (WORKER_RESOURCE_LIMIT).
 *
 * Nothing needs the whole file at once. This decodes and splits incrementally,
 * so peak memory is one chunk plus one batch of rows regardless of feed size.
 *
 * The header check still happens, on the first line, and still throws — a
 * sign-in page would otherwise stream through as zero valid rows, which the
 * ingest would read as "the feed is empty, delete everything".
 */
export async function* fetchFeedLines(
  cookie: string,
  url: string
): AsyncGenerator<string> {
  const res = await fetch(url, {
    redirect: 'manual',
    headers: { Cookie: cookie },
    signal: timeout(),
  });

  if (res.status >= 300 && res.status < 400) {
    throw new Error(`Feed download redirected (session not accepted): ${url}`);
  }
  if (!res.body) throw new Error(`Feed download returned no body: ${url}`);

  // windows-1252, like fetchFeed — see the note there about curly apostrophes.
  const reader = res.body
    .pipeThrough(new TextDecoderStream('windows-1252'))
    .getReader();

  let buffer = '';
  let first = true;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += value;

      // Split on whichever newline the file uses, keeping the trailing partial
      // line in the buffer for the next chunk.
      const lines = buffer.split(/\r\n|\n|\r/);
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (first) {
          first = false;
          if (!/^\s*PROP_TYPE\|/i.test(line)) {
            throw new Error(
              `Unexpected non-feed response for ${url} (got "${line.slice(0, 40)}…")`
            );
          }
          yield line; // the header, which the caller needs to build its parser
          continue;
        }
        yield line;
      }
    }
    if (buffer.trim() !== '') yield buffer;
  } finally {
    // Releases the connection even when the consumer stops early or throws.
    reader.releaseLock();
  }
}
