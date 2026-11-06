/**
 * /admin/visitors — who visited the site, in plain words, without Kevin in it.
 *
 * Kevin asked on 2026-11-05: he could not read Google Analytics and thought
 * most of it was himself (it was about half). The site stopped counting him,
 * test copies and automated browsers on 2026-11-06 (analytics.ts); this page
 * reads what is left, through the `site-visitors` edge function, and says what
 * stands out first. Every label and sentence comes from siteVisitors.ts.
 *
 * READ ONLY, and the only thing it asks for is a period. Until the Google
 * service account is set up the function answers `{configured:false}` and this
 * page is the setup instructions instead.
 */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Lightbulb,
  Loader2,
  MapPin,
  MousePointerClick,
  Search,
  Signpost,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AdminShell, { AdminCard } from '@/components/AdminShell';
import AdminList from '@/components/admin/AdminList';
import { ListError } from '@/components/admin/ListStates';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { isDeviceNotCounted } from '@/lib/analytics';
import {
  PERIODS,
  actionCounts,
  change,
  count,
  duration,
  kindsSplit,
  longDate,
  mergeCities,
  mergePages,
  mergeSources,
  notes,
  resultsPage,
  shortDate,
  type Period,
  type Totals,
  type VisitorReport,
  type VisitorResponse,
} from '@/lib/siteVisitors';

const Section = ({
  icon: Icon,
  title,
  aside,
  children,
}: {
  icon: LucideIcon;
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <AdminCard>
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-gray-100 px-4 py-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-champagne-ink" aria-hidden />
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">{title}</h2>
      </div>
      {aside && <p className="text-xs text-gray-500">{aside}</p>}
    </div>
    {children}
  </AdminCard>
);

const Quiet = ({ children }: { children: React.ReactNode }) => (
  <p className="px-4 py-5 text-sm leading-relaxed text-gray-600 sm:px-6">{children}</p>
);

const Figure = ({ label, value, before }: { label: string; value: number; before?: number }) => {
  const moved = change(value, before);
  return (
    <AdminCard>
      <div className="p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500">{label}</p>
        <p className="numeral mt-1 text-2xl font-semibold text-ink sm:text-3xl">{count(value)}</p>
        {moved && <p className="numeral mt-1 text-xs text-gray-500">{moved} on the period before</p>}
      </div>
    </AdminCard>
  );
};

const Numbers = ({ now, before }: { now: Totals; before: Totals | null }) => (
  <div className="grid grid-cols-3 gap-3 sm:gap-4">
    <Figure label="People" value={now.people} before={before?.people} />
    <Figure label="Stayed to read" value={now.stayed} before={before?.stayed} />
    <Figure label="All visits" value={now.visits} before={before?.visits} />
  </div>
);

const Report = ({ report }: { report: VisitorReport }) => {
  const said = notes(report);
  const sources = mergeSources(report.sources);
  const pages = mergePages(report.pages);
  const kinds = kindsSplit(pages).filter((k) => k.share > 0);
  const cities = mergeCities(report.cities).slice(0, 12);
  const actions = actionCounts(report.actions);
  const searches = [...(report.search?.queries ?? [])]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 20);

  return (
    <div className="space-y-6">
      <Section icon={Lightbulb} title="What stands out" aside={`${longDate(report.start)} to ${longDate(report.end)}`}>
        <ul className="list-disc space-y-2.5 py-5 pl-9 pr-4 text-sm leading-relaxed text-gray-700 marker:text-champagne sm:pl-11 sm:pr-6">
          {said.map((sentence) => (
            <li key={sentence}>{sentence}</li>
          ))}
        </ul>
      </Section>

      {report.analyticsError ? (
        <AdminCard>
          <Quiet>
            <span className="font-medium text-red-700">Google Analytics could not be read. </span>
            {report.analyticsError}
          </Quiet>
        </AdminCard>
      ) : (
        <>
          {report.totals && <Numbers now={report.totals} before={report.previous} />}

          <Section icon={Signpost} title="Where they came from" aside="Visits · how many stayed to read">
            {sources.length === 0 ? (
              <Quiet>No visits in this period.</Quiet>
            ) : (
              <AdminList
                label="Where visitors came from"
                columns={[{ label: 'From', primary: true }, { label: 'Visits' }, { label: 'Stayed' }]}
                grid="md:grid-cols-[minmax(0,3fr)_minmax(0,0.7fr)_minmax(0,0.7fr)]"
                rows={sources.map((s) => ({
                  key: s.label,
                  cells: [
                    <span key="l" className={s.own ? 'text-gray-400' : 'font-medium text-ink'}>
                      {s.label}
                      {s.own && <span className="ml-1.5 text-xs">(you, not a visitor)</span>}
                    </span>,
                    count(s.visits),
                    count(s.stayed),
                  ],
                }))}
              />
            )}
          </Section>

          <Section icon={FileText} title="What they read" aside="Your admin and sign-in pages are left out">
            {kinds.length > 0 && (
              <p className="numeral border-b border-gray-100 px-4 py-3 text-xs leading-relaxed text-gray-600 sm:px-6">
                {kinds.map((k) => `${k.kind} ${k.share}%`).join(' · ')}
              </p>
            )}
            {pages.length === 0 ? (
              <Quiet>Nothing read in this period.</Quiet>
            ) : (
              <AdminList
                label="Pages read"
                columns={[
                  { label: 'Page', primary: true },
                  { label: 'Views' },
                  { label: 'People' },
                  { label: 'Time each' },
                ]}
                grid="md:grid-cols-[minmax(0,3fr)_minmax(0,0.6fr)_minmax(0,0.6fr)_minmax(0,0.8fr)]"
                rows={pages.slice(0, 25).map((p) => ({
                  key: p.path,
                  cells: [
                    <span key="p" className="block min-w-0">
                      <a
                        href={p.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-full items-baseline gap-1.5 font-medium text-ink hover:text-champagne-ink hover:underline"
                      >
                        <span className="break-words">{p.label}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 text-gray-400" aria-hidden />
                      </a>
                      <span className="block text-xs text-gray-500">{p.kind}</span>
                    </span>,
                    count(p.views),
                    count(p.people),
                    duration(p.secondsPerView),
                  ],
                }))}
              />
            )}
          </Section>
        </>
      )}

      <Section
        icon={Search}
        title="What they searched on Google"
        aside={report.search ? `${shortDate(report.search.start)} to ${shortDate(report.search.end)} · Google is 3 days behind` : undefined}
      >
        {report.searchError ? (
          <Quiet>
            <span className="font-medium text-red-700">Search Console could not be read. </span>
            {report.searchError}
          </Quiet>
        ) : searches.length === 0 ? (
          <Quiet>Your site did not show up in any Google searches in this period.</Quiet>
        ) : (
          <>
            <p className="border-b border-gray-100 px-4 py-3 text-xs leading-relaxed text-gray-600 sm:px-6">
              &ldquo;Shown&rdquo; is how many times your site appeared in someone&rsquo;s results. A search shown
              often with no clicks usually means the page&rsquo;s title in Google does not answer it.
            </p>
            <AdminList
              label="Google searches"
              columns={[
                { label: 'Search', primary: true },
                { label: 'Shown' },
                { label: 'Clicks' },
                { label: 'Where' },
              ]}
              grid="md:grid-cols-[minmax(0,3fr)_minmax(0,0.6fr)_minmax(0,0.6fr)_minmax(0,0.8fr)]"
              rows={searches.map((q) => ({
                key: q.query,
                cells: [
                  <span key="q" className="break-words font-medium text-ink">
                    {q.query}
                  </span>,
                  count(q.impressions),
                  <span key="c" className={q.clicks === 0 ? 'text-gray-400' : undefined}>
                    {count(q.clicks)}
                  </span>,
                  `Page ${resultsPage(q.position)}`,
                ],
              }))}
            />
          </>
        )}
      </Section>

      {!report.analyticsError && (
        <>
          <Section icon={MapPin} title="Where they are" aside="Towns are Google's guess from the internet connection">
            {cities.length === 0 ? (
              <Quiet>No visitors in this period.</Quiet>
            ) : (
              <AdminList
                label="Where visitors are"
                columns={[{ label: 'Place', primary: true }, { label: 'People' }, { label: 'Stayed' }]}
                grid="md:grid-cols-[minmax(0,3fr)_minmax(0,0.7fr)_minmax(0,0.7fr)]"
                rows={cities.map((c) => ({
                  key: c.label,
                  cells: [
                    <span key="c" className="font-medium text-ink">
                      {c.label}
                    </span>,
                    count(c.people),
                    count(c.stayed),
                  ],
                }))}
              />
            )}
          </Section>

          <Section icon={MousePointerClick} title="What they did">
            <AdminList
              label="Leads from the site"
              columns={[{ label: 'Action', primary: true }, { label: 'Times' }]}
              grid="md:grid-cols-[minmax(0,3fr)_minmax(0,0.7fr)]"
              rows={actions.map((a) => ({
                key: a.event,
                cells: [
                  <span key="a" className={a.count ? 'font-medium text-ink' : 'text-gray-500'}>
                    {a.label}
                  </span>,
                  count(a.count),
                ],
              }))}
            />
          </Section>
        </>
      )}
    </div>
  );
};

const step = 'text-champagne-ink underline decoration-champagne underline-offset-2 hover:text-ink';

const Ext = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={step}>
    {children}
  </a>
);

/** Shown until GOOGLE_SERVICE_ACCOUNT_JSON is set. About ten minutes, once. */
const Setup = () => (
  <AdminCard>
    <div className="p-5 sm:p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-ink">One-time setup</h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        This page needs permission to read your Google Analytics and Search Console. It is free and takes
        about ten minutes. Do it on a computer, signed in to Google as the account that owns your Analytics.
      </p>
      <ol className="mt-5 list-decimal space-y-4 pl-5 text-sm leading-relaxed text-gray-700 marker:font-semibold marker:text-champagne-ink">
        <li>
          <Ext href="https://console.cloud.google.com/projectcreate">Create a Google Cloud project</Ext>. Name it
          &ldquo;Kevin Hoang website&rdquo; and press Create. No billing account is needed.
        </li>
        <li>
          With that project selected, press <strong>Enable</strong> on both of these:{' '}
          <Ext href="https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com">
            Google Analytics Data API
          </Ext>{' '}
          and{' '}
          <Ext href="https://console.cloud.google.com/apis/library/searchconsole.googleapis.com">
            Google Search Console API
          </Ext>
          .
        </li>
        <li>
          Open{' '}
          <Ext href="https://console.cloud.google.com/iam-admin/serviceaccounts/create">Create service account</Ext>.
          Name it &ldquo;site-visitors&rdquo;, press <strong>Create and continue</strong>, skip the roles, and
          press <strong>Done</strong>. Copy its email address (it ends in <code>.iam.gserviceaccount.com</code>).
        </li>
        <li>
          Click the account, open <strong>Keys</strong>, then <strong>Add key → Create new key → JSON</strong>. A
          small file downloads. Treat it like a password.
        </li>
        <li>
          In Google Analytics, <strong>Admin → Property access management → + → Add users</strong>. Paste the
          email, choose <strong>Viewer</strong>, untick &ldquo;Notify new users by email&rdquo;, and press Add.
        </li>
        <li>
          In{' '}
          <Ext href="https://search.google.com/search-console/users?resource_id=https%3A%2F%2Fkevinhoang.co%2F">
            Search Console&rsquo;s users
          </Ext>
          , press <strong>Add user</strong>, paste the email, and choose <strong>Restricted</strong>.
        </li>
        <li>
          Open your{' '}
          <Ext href="https://supabase.com/dashboard/project/zvipgykolpoxukyjgffx/functions/secrets">
            Supabase function secrets
          </Ext>
          . Add a secret named <code>GOOGLE_SERVICE_ACCOUNT_JSON</code>. For its value, open the downloaded file
          in TextEdit, select everything and paste it in. Save, then delete the file from Downloads.
        </li>
        <li>Come back to this page and refresh it.</li>
      </ol>
    </div>
  </AdminCard>
);

export default function AdminVisitors() {
  const { isAdmin } = useAuth();
  const [days, setDays] = useState<Period>(28);
  const [notCounted, setNotCounted] = useState(false);

  // Read after mount: the mark is in localStorage.
  useEffect(() => setNotCounted(isDeviceNotCounted()), [isAdmin]);

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['site-visitors', days],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('site-visitors', { body: { days } });
      if (error) {
        // The function's own message ("Google would not accept…") is in the body.
        const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
        throw new Error(body?.error ?? error.message);
      }
      return data as VisitorResponse;
    },
    enabled: !!isAdmin,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  return (
    <AdminShell
      title="Website visitors"
      description="Who visited kevinhoang.co, where they came from and what they read, not counting you."
    >
      <div className="space-y-6">
        {data?.configured !== false && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex overflow-hidden rounded-full border border-gray-200 bg-white text-sm">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={days === p}
                  onClick={() => setDays(p)}
                  className={`px-4 py-1.5 font-semibold transition-colors ${
                    days === p ? 'bg-ink-deep text-white' : 'text-gray-600 hover:text-champagne-ink'
                  }`}
                >
                  {p} days
                </button>
              ))}
            </span>
          </div>
        )}

        {isLoading || !isAdmin ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-champagne-ink" aria-hidden />
          </div>
        ) : error ? (
          <ListError message={(error as Error).message} onRetry={() => refetch()} />
        ) : data?.configured === false ? (
          <Setup />
        ) : data ? (
          <Report report={data} />
        ) : null}

        <p className="flex items-start gap-2 text-xs leading-relaxed text-gray-500">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-champagne-ink" aria-hidden />
          <span>
            Not counted: you, on any phone or computer where you have signed in as admin; test copies of the site;
            and automated browsers.{' '}
            {notCounted ? 'This device is not counted.' : 'This device will stop being counted once the page finishes loading.'}{' '}
            A link you open inside another app (Gmail, Instagram) uses that app&rsquo;s own browser, which still
            counts until you sign in there too.
          </span>
        </p>
      </div>
    </AdminShell>
  );
}
