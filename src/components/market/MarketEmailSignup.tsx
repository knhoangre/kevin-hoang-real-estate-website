import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SITE } from '@/lib/siteConfig';
import { pill } from '@/lib/pill';
import { subscribeToMarket } from '@/lib/marketEmail';

/**
 * "Get this report by email": the sign-up for the monthly market email, on
 * /market, every town's report, every monthly post and the homepage.
 *
 * The heading is a <p>, not an <h2>: this block is on some fifty pages, and the
 * topical-distinctness rule allows no h2 string on more than one.
 *
 * The town of the page it is on is ticked; elsewhere the visitor picks. The
 * function answers the same whether the address is new, waiting for its
 * confirmation or already subscribed, so the message after sending says what
 * happens in every case rather than which case this was.
 */
const TOWNS = SITE.marketTowns
  .map((name) => SITE.areaServed.find((t) => t.name === name))
  .filter((t): t is (typeof SITE.areaServed)[number] => Boolean(t));

const MarketEmailSignup = ({ town, className = '' }: { town?: { name: string; slug: string }; className?: string }) => {
  const { pathname } = useLocation();
  const [email, setEmail] = useState('');
  const [chosen, setChosen] = useState<string[]>(town ? [town.slug] : []);
  const [website, setWebsite] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [problem, setProblem] = useState<string | null>(null);

  const toggle = (slug: string) =>
    setChosen((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setProblem('Please give a complete email address.');
    if (chosen.length === 0) return setProblem('Please choose at least one town.');
    setProblem(null);
    setState('sending');
    try {
      await subscribeToMarket(email, chosen, pathname, website);
      setState('sent');
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setState('idle');
    }
  };

  const heading = town ? `Get the ${town.name} report by email` : 'Get the monthly market report by email';
  const names = TOWNS.filter((t) => chosen.includes(t.slug)).map((t) => t.name);

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8 ${className}`}>
      <div className="flex items-start gap-3">
        <Mail className="mt-1 h-5 w-5 shrink-0 text-champagne-ink" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-ink">{heading}</p>
          {state === 'sent' ? (
            <p className="mt-2 leading-relaxed text-gray-700" role="status">
              Thank you. If {email.trim()} is new here, a confirmation is on its way; the report starts once it is
              confirmed. If it was already subscribed, {names.length === 1 ? names[0] : 'these towns'} will be in the
              next one.
            </p>
          ) : (
            <form onSubmit={onSubmit} noValidate className="mt-2">
              <p className="leading-relaxed text-gray-700">
                Once a month, a few days after the 3rd: what sold, against the asking price, and how much is for sale.
                Nothing else is sent, and every email has a link to stop.
              </p>

              <details className="mt-4 group" open={!town}>
                <summary className="cursor-pointer text-sm font-medium text-ink">
                  {names.length ? `Towns: ${names.join(', ')}` : 'Choose your towns'}
                  <span className="ml-2 text-champagne-ink underline decoration-champagne underline-offset-4 group-open:hidden">
                    change
                  </span>
                </summary>
                <fieldset className="mt-3">
                  <legend className="sr-only">Towns</legend>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
                    {TOWNS.map((t) => (
                      <label key={t.slug} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-ink-deep"
                          checked={chosen.includes(t.slug)}
                          onChange={() => toggle(t.slug)}
                        />
                        {t.name}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </details>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <label htmlFor={`market-email-${town?.slug ?? 'all'}`} className="sr-only">
                  Email address
                </label>
                <Input
                  id={`market-email-${town?.slug ?? 'all'}`}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="sm:flex-1"
                />
                <div className="hidden" aria-hidden>
                  <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>
                <button type="submit" disabled={state === 'sending'} className={pill('ink', 'sm', 'group shrink-0')}>
                  {state === 'sending' ? 'Sending…' : 'Send me the report'}
                </button>
              </div>
              {problem && (
                <p className="mt-3 text-sm text-red-700" role="alert">
                  {problem}
                </p>
              )}
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                Your address is used for this report and nothing else; see the{' '}
                <Link to="/privacy-policy" className="underline underline-offset-2">
                  privacy policy
                </Link>
                .
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketEmailSignup;
