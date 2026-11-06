/**
 * Who visited kevinhoang.co, for /admin/visitors: Google Analytics 4 and
 * Search Console, read with a service account.
 *
 * ADMIN ONLY, checked on every call, the same shape as `send-listings`. The
 * request names a period (7, 28 or 90 days) and nothing else: the property,
 * the site and every filter are fixed here.
 *
 * This only FETCHES AND RESHAPES. Every label and sentence on the page is in
 * src/lib/siteVisitors.ts, which is pure and checked; the field names below
 * are its `VisitorReport`, a contract between the two.
 *
 * Set up once by Kevin (the steps are on the page when this answers
 * `{configured:false}`): a Google Cloud project with the Analytics Data API and
 * the Search Console API on, a service account with a JSON key, that account
 * added as a Viewer on the GA4 property and a Restricted user in Search
 * Console, and the key's contents in the `GOOGLE_SERVICE_ACCOUNT_JSON` secret.
 *
 * Each half fails on its own (`Promise.allSettled`): a Search Console
 * permission not yet granted costs that section, not the page.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { googleAccessToken, parseServiceAccount } from '../_shared/googleAuth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });

/** The GA4 property (Admin → Property details) and the Search Console property. */
const GA_PROPERTY = '551743308';
const SEARCH_SITE = 'https://kevinhoang.co/';

/** The real site. Test copies on localhost and previews on vercel.app are not visitors. */
const HOSTS = ['kevinhoang.co', 'www.kevinhoang.co'];

/** Kevin's pages and sign-in plumbing; mirrors HIDDEN_PAGES in siteVisitors.ts. */
const HIDDEN_PREFIXES = ['/admin', '/crm', '/auth'];

/** The events analytics.ts sends; mirrors ACTIONS in siteVisitors.ts. */
const LEAD_EVENTS = [
  'generate_lead',
  'contact_call',
  'contact_text',
  'appointment_click',
  'rental_application_submitted',
];

const PERIODS = [7, 28, 90];

const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
];

/* ---- dates: calendar days on a Boston clock ------------------------------ */

const bostonToday = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/* ---- GA4 ----------------------------------------------------------------- */

type Filter = Record<string, unknown>;

const onRealSite: Filter = {
  filter: { fieldName: 'hostName', inListFilter: { values: HOSTS } },
};

const notHidden: Filter[] = HIDDEN_PREFIXES.map((value) => ({
  notExpression: {
    filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value } },
  },
}));

const all = (...expressions: Filter[]): Filter => ({ andGroup: { expressions } });

interface GaRow {
  dimensionValues?: { value: string }[];
  metricValues?: { value: string }[];
}

interface GaReport {
  dimensionHeaders?: { name: string }[];
  rows?: GaRow[];
}

const num = (v: string | undefined) => Number(v ?? 0) || 0;

/** A report's rows as plain objects keyed by dimension and metric name. */
const rowsOf = (report: GaReport, metrics: string[]) => {
  const dims = (report.dimensionHeaders ?? []).map((h) => h.name);
  return (report.rows ?? []).map((row) => {
    const out: Record<string, string | number> = {};
    dims.forEach((d, i) => (out[d] = row.dimensionValues?.[i]?.value ?? ''));
    metrics.forEach((m, i) => (out[m] = num(row.metricValues?.[i]?.value)));
    return out;
  });
};

const TOTAL_METRICS = ['activeUsers', 'sessions', 'engagedSessions', 'screenPageViews'];

async function analytics(token: string, start: string, end: string, prevStart: string, prevEnd: string) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY}:batchRunReports`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            dateRanges: [
              { startDate: start, endDate: end, name: 'now' },
              { startDate: prevStart, endDate: prevEnd, name: 'before' },
            ],
            metrics: TOTAL_METRICS.map((name) => ({ name })),
            dimensionFilter: onRealSite,
          },
          {
            dateRanges: [{ startDate: start, endDate: end }],
            dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
            metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'userEngagementDuration' }],
            dimensionFilter: all(onRealSite, ...notHidden),
            orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
            limit: 80,
          },
          {
            dateRanges: [{ startDate: start, endDate: end }],
            dimensions: [{ name: 'sessionDefaultChannelGroup' }, { name: 'sessionSource' }],
            metrics: [{ name: 'sessions' }, { name: 'engagedSessions' }],
            dimensionFilter: onRealSite,
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            limit: 50,
          },
          {
            dateRanges: [{ startDate: start, endDate: end }],
            dimensions: [{ name: 'city' }, { name: 'region' }],
            metrics: [{ name: 'activeUsers' }, { name: 'engagedSessions' }],
            dimensionFilter: onRealSite,
            orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
            limit: 40,
          },
          {
            dateRanges: [{ startDate: start, endDate: end }],
            dimensions: [{ name: 'eventName' }],
            metrics: [{ name: 'eventCount' }],
            dimensionFilter: all(onRealSite, {
              filter: { fieldName: 'eventName', inListFilter: { values: LEAD_EVENTS } },
            }),
          },
        ],
      }),
    }
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      res.status === 403
        ? 'Google Analytics refused. Add the service account as a Viewer on the property (Admin → Property access management).'
        : `Google Analytics answered ${res.status}: ${body?.error?.message ?? 'no detail'}`
    );
  }

  const [totalsReport, pagesReport, sourcesReport, citiesReport, actionsReport] = (body.reports ?? []) as GaReport[];

  const totalRows = rowsOf(totalsReport ?? {}, TOTAL_METRICS);
  const totalsFor = (range: string) => {
    // With two date ranges GA4 adds a `dateRange` dimension holding each name.
    const row = totalRows.find((r) => r.dateRange === range);
    return {
      people: Number(row?.activeUsers ?? 0),
      visits: Number(row?.sessions ?? 0),
      stayed: Number(row?.engagedSessions ?? 0),
      views: Number(row?.screenPageViews ?? 0),
    };
  };

  return {
    totals: totalsFor('now'),
    previous: totalsFor('before'),
    pages: rowsOf(pagesReport ?? {}, ['screenPageViews', 'activeUsers', 'userEngagementDuration']).map((r) => ({
      path: String(r.pagePath),
      title: String(r.pageTitle),
      views: Number(r.screenPageViews),
      people: Number(r.activeUsers),
      seconds: Number(r.userEngagementDuration),
    })),
    sources: rowsOf(sourcesReport ?? {}, ['sessions', 'engagedSessions']).map((r) => ({
      channel: String(r.sessionDefaultChannelGroup),
      source: String(r.sessionSource),
      visits: Number(r.sessions),
      stayed: Number(r.engagedSessions),
    })),
    cities: rowsOf(citiesReport ?? {}, ['activeUsers', 'engagedSessions']).map((r) => ({
      city: String(r.city),
      region: String(r.region),
      people: Number(r.activeUsers),
      stayed: Number(r.engagedSessions),
    })),
    actions: rowsOf(actionsReport ?? {}, ['eventCount']).map((r) => ({
      event: String(r.eventName),
      count: Number(r.eventCount),
    })),
  };
}

/* ---- Search Console ------------------------------------------------------ */

interface ScRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  position?: number;
}

async function searchConsole(token: string, start: string, end: string) {
  const query = async (dimensions: string[], rowLimit: number): Promise<ScRow[]> => {
    const res = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SEARCH_SITE)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: start, endDate: end, dimensions, rowLimit }),
      }
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        res.status === 403
          ? 'Search Console refused. Add the service account as a user (Settings → Users and permissions).'
          : `Search Console answered ${res.status}: ${body?.error?.message ?? 'no detail'}`
      );
    }
    return (body.rows ?? []) as ScRow[];
  };

  // Rows come back sorted by clicks, so the queries ask for plenty: the
  // searches that showed the site and were never clicked are at the bottom.
  const [total, queries, pages] = await Promise.all([
    query([], 1),
    query(['query'], 250),
    query(['page'], 25),
  ]);

  return {
    start,
    end,
    clicks: total[0]?.clicks ?? 0,
    impressions: total[0]?.impressions ?? 0,
    queries: queries.map((r) => ({
      query: r.keys?.[0] ?? '',
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      position: r.position ?? 0,
    })),
    pages: pages.map((r) => ({
      page: r.keys?.[0] ?? '',
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
    })),
  };
}

/* ---- the request --------------------------------------------------------- */

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { days } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return json({ error: 'Server configuration error' }, 500);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // The caller, resolved from their JWT against auth — never from the body.
    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: auth, error: authError } = jwt
      ? await admin.auth.getUser(jwt)
      : { data: null, error: null };
    const user = authError ? null : auth?.user ?? null;
    if (!user) return json({ error: 'Not signed in' }, 401);
    if (user.app_metadata?.is_admin !== true) {
      console.warn('Non-admin called site-visitors:', user.id);
      return json({ error: 'Not allowed' }, 403);
    }

    if (!PERIODS.includes(days)) return json({ error: 'Unknown period' }, 400);

    const account = parseServiceAccount(Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON'));
    if (!account) return json({ configured: false });

    let token: string;
    try {
      token = await googleAccessToken(account, SCOPES);
    } catch (error) {
      console.error('site-visitors:', (error as Error).message);
      return json({ error: 'Google would not accept the service account key. Paste the key file again.' }, 502);
    }

    const end = bostonToday();
    const start = addDays(end, -(days - 1));
    // Search Console is two to three days behind; a range ending today would
    // read its last days as a collapse.
    const searchEnd = addDays(end, -3);

    const [ga, sc] = await Promise.allSettled([
      analytics(token, start, end, addDays(start, -days), addDays(start, -1)),
      searchConsole(token, addDays(searchEnd, -(days - 1)), searchEnd),
    ]);

    if (ga.status === 'rejected') console.error('site-visitors analytics:', ga.reason?.message);
    if (sc.status === 'rejected') console.error('site-visitors search:', sc.reason?.message);

    return json({
      configured: true,
      days,
      start,
      end,
      totals: ga.status === 'fulfilled' ? ga.value.totals : null,
      previous: ga.status === 'fulfilled' ? ga.value.previous : null,
      pages: ga.status === 'fulfilled' ? ga.value.pages : [],
      sources: ga.status === 'fulfilled' ? ga.value.sources : [],
      cities: ga.status === 'fulfilled' ? ga.value.cities : [],
      actions: ga.status === 'fulfilled' ? ga.value.actions : [],
      search: sc.status === 'fulfilled' ? sc.value : null,
      ...(ga.status === 'rejected' ? { analyticsError: ga.reason?.message ?? 'Google Analytics failed' } : {}),
      ...(sc.status === 'rejected' ? { searchError: sc.reason?.message ?? 'Search Console failed' } : {}),
    });
  } catch (error) {
    console.error('site-visitors:', (error as Error).message);
    return json({ error: 'Something went wrong' }, 500);
  }
});
