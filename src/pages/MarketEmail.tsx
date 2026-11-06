import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import PageShell, { ShellSection } from '@/components/PageShell';
import { useHydrated } from '@/hooks/useHydrated';
import { SITE } from '@/lib/siteConfig';
import { pill } from '@/lib/pill';
import { confirmMarketEmail, unsubscribeMarketEmail } from '@/lib/marketEmail';

/**
 * /market-email?confirm=<token> and ?unsubscribe=<token>: where the links in the
 * market email land.
 *
 * Each asks for a press before it does anything. Mail security scanners open
 * every link in an email the moment it arrives, and some run the page's script;
 * a link that confirmed on arrival would confirm addresses nobody had read, and
 * one that unsubscribed would stop the email of everyone behind such a scanner.
 *
 * The query string is read only once hydrated: the page is prerendered once,
 * with none, and that document is what every one of these links is served.
 */
const townName = (slug: string) => SITE.areaServed.find((t) => t.slug === slug)?.name ?? slug;
const listOf = (names: string[]) =>
  names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

const MarketEmail = () => {
  const hydrated = useHydrated();
  const [params] = useSearchParams();
  const [state, setState] = useState<'ready' | 'working' | 'done' | 'error'>('ready');
  const [message, setMessage] = useState('');
  const [towns, setTowns] = useState<string[]>([]);

  const confirmToken = hydrated ? params.get('confirm') : null;
  const stopToken = hydrated ? params.get('unsubscribe') : null;
  const mode = confirmToken ? 'confirm' : stopToken ? 'unsubscribe' : null;

  // A different link opened in the same tab starts again.
  useEffect(() => setState('ready'), [confirmToken, stopToken]);

  const act = async () => {
    setState('working');
    try {
      const result = mode === 'confirm' ? await confirmMarketEmail(confirmToken!) : await unsubscribeMarketEmail(stopToken!);
      setTowns(result.towns ?? []);
      setState('done');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong.');
      setState('error');
    }
  };

  const body = () => {
    if (!hydrated) return <p className="text-gray-600">Loading…</p>;
    if (!mode) {
      return (
        <p className="leading-relaxed text-gray-700">
          This page is for the links in the monthly market email. To sign up, go to the{' '}
          <Link to="/market" className="underline decoration-champagne underline-offset-4">
            market reports
          </Link>
          .
        </p>
      );
    }
    if (state === 'done') {
      return (
        <div className="rounded-2xl border border-champagne/50 bg-white p-8 shadow-sm" role="status">
          <CheckCircle2 className="h-8 w-8 text-champagne-ink" aria-hidden />
          <p className="mt-4 text-xl font-semibold text-ink">
            {mode === 'confirm' ? 'You are subscribed.' : 'You are unsubscribed.'}
          </p>
          <p className="mt-2 leading-relaxed text-gray-700">
            {mode === 'confirm'
              ? `The report${towns.length ? ` for ${listOf(towns.map(townName))}` : ''} arrives once a month, a few days after the 3rd. Every email has a link to stop.`
              : 'No more market emails will be sent to this address. If that was a mistake, sign up again on any market report.'}
          </p>
          <Link to="/market" className={pill('outline', 'sm', 'group mt-6')}>
            See this month&rsquo;s reports
          </Link>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="leading-relaxed text-gray-700">
          {mode === 'confirm'
            ? 'Press the button to start the monthly market report.'
            : 'Press the button to stop the monthly market report.'}
        </p>
        {state === 'error' && (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {message}
          </p>
        )}
        <button type="button" onClick={act} disabled={state === 'working'} className={pill('ink', 'md', 'group mt-6')}>
          {state === 'working' ? 'One moment…' : mode === 'confirm' ? 'Confirm my subscription' : 'Unsubscribe'}
        </button>
      </div>
    );
  };

  return (
    <PageShell
      path="/market-email"
      seo={{
        title: 'Market Report Email',
        description: 'Confirm or stop the monthly market report by email.',
        noindex: true,
      }}
      crumbs={[
        { name: 'Home', path: '/' },
        { name: 'Market Reports', path: '/market' },
        { name: 'Email', path: '/market-email' },
      ]}
      eyebrow="Market reports"
      h1="The monthly market email"
      lede="Once a month, what sold in the towns you follow, against the asking price, and how much is for sale."
      heroSize="compact"
      strip={false}
      actions={false}
      cta={false}
    >
      <ShellSection inner="">{body()}</ShellSection>
    </PageShell>
  );
};

export default MarketEmail;
