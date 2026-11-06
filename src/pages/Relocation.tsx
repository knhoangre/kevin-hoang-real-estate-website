import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { submitContactMessage } from '@/lib/submitContact';
import { EVENTS, track } from '@/lib/analytics';
import LandingPage from '@/components/LandingPage';
import { guideArticle, person, type QA } from '@/lib/schema';
import { SITE } from '@/lib/siteConfig';
import {
  HOME_VALUES,
  JOBS,
  NAEP,
  PROPERTY_TAX,
  SOURCES,
  ctTax,
  maTax,
  usd,
  usdMillions,
  usdThousands,
  type TownValue,
} from '@/data/ctToMa';

/**
 * Landing page for the ORIGIN MARKET axis — "moving from Connecticut to
 * Massachusetts" and its variants. /needham-real-estate-agent owns hiring
 * intent, /home-valuation seller intent, /vietnamese-speaking-real-estate-agent
 * language. No <h1> or <h2> string here may appear on any of them.
 *
 * Rewritten 2026-11-06. Search Console had it at 109 impressions and no clicks
 * in two months, and no search containing "Connecticut" had shown the site at
 * all: the page was logistics only, never said where Kevin is from, and never
 * answered the question people actually type, which is WHY move. It now opens
 * with his own story (SITE.roots), answers "why" with figures a reader can
 * check, says plainly what the move costs, and links four posts that each own
 * one question (taxes, work, schools, selling the Connecticut house).
 *
 * Rules this page keeps, each for a reason:
 *
 *   * Every figure is in src/data/ctToMa.ts with its period and source, and
 *     the source list at the foot of the page names them all.
 *   * No town is ranked, and no town is called good for families or safe.
 *     Familial status is a protected class; describing towns that way is
 *     steering. Schools are compared at STATE level, on the one test both
 *     states take (NAEP), and the reader is pointed at the official lookups.
 *   * Kevin is not licensed in Connecticut. The page never offers to list or
 *     sell a Connecticut house; it says he connects sellers with a
 *     Connecticut-licensed agent, unnamed, and coordinates the timing. Nothing
 *     about referral fees.
 *   * The checklist is on the page. It used to sit behind an email form that
 *     said "check your email for the checklist" when nothing sent one.
 */

/** When the text last really changed. Drives the byline, the schema and the sitemap's lastmod. */
const UPDATED = { display: 'November 6, 2026', iso: '2026-11-06' };
/** When the page first went up (commit e1fc256). */
const PUBLISHED_ISO = '2026-01-10';

const { roots } = SITE;

const FAQS: QA[] = [
  {
    question: 'Why do people move from Connecticut to Massachusetts?',
    answer:
      'Mostly for work, and for what comes with Greater Boston: about twice as many jobs as all of Connecticut, ten times as many in scientific research, and higher average pay (BLS, 2024). Massachusetts public school students also scored higher than Connecticut’s on all four 2024 national (NAEP) tests, the state had the lowest uninsured rate in the country in 2024, and there is a real city within reach. And Greater Boston is about 90 miles from the Hartford suburbs, so family stays a drive away.',
  },
  {
    question: 'Is Massachusetts more expensive than Connecticut?',
    answer:
      'For housing, yes, by a wide margin. In September 2026 Zillow’s typical home value was about $440,000 in South Windsor and about $1.48 million in Newton. The least expensive towns this practice covers, Malden and Quincy, were about $670,000. Income tax runs the other way for most people: Massachusetts taxes most income at a flat 5%, while Connecticut’s rates run from 2% to 6.99%.',
  },
  {
    question: 'Is property tax lower in Massachusetts or Connecticut?',
    answer:
      'The rate is lower in Massachusetts, but the bill often is not. A Connecticut mill rate is charged on 70% of market value, a Massachusetts rate on all of it. South Windsor’s 37.01 mills works out to about 2.6% of market value a year; Newton’s $9.69 per $1,000 (fiscal 2026) is under 1%. But a typical South Windsor house pays about $11,400 a year and a typical Newton house about $14,400, because the Newton house costs more than three times as much. Compare the two specific towns you are choosing between.',
  },
  {
    question: 'Does Massachusetts tax Social Security or retirement income?',
    answer:
      'Massachusetts does not tax Social Security benefits at all. Connecticut exempts them fully below $75,000 of income ($100,000 for a joint return) and taxes up to 25% of them above that. Pensions and IRA withdrawals are taxed differently in each state, and the Massachusetts estate tax starts at $2 million against Connecticut’s $15 million in 2026, so a retiree should run both states’ numbers with a tax adviser before deciding.',
  },
  {
    question: 'How far is Greater Boston from Hartford?',
    answer:
      'About 100 miles from Hartford to Boston, and about 90 from South Windsor to Newton, most of it on I-84 and the Mass Pike. The western suburbs along the Pike are the closest part of Greater Boston to Connecticut by road.',
  },
  {
    question: 'Can Kevin sell my house in Connecticut?',
    answer:
      'No. Kevin is a Massachusetts broker and is not licensed in Connecticut, so he does not list or sell Connecticut property. Talk to him first anyway: he will connect you with a Connecticut-licensed agent he trusts for the sale and coordinate its timing with your purchase in Massachusetts.',
  },
  {
    question: 'How do I time selling in Connecticut against buying in Massachusetts?',
    answer:
      'Decide before you list. The realistic options are selling first (strongest offer in Massachusetts, but you may need a rent-back or a short rental), buying first (simplest to live through, only if you can carry both), a sale contingency (cheapest, and the weakest offer here), or bridge financing (buys the timing, at a cost). Closing both on the same day rarely works cleanly.',
  },
  {
    question: 'Are Massachusetts schools better than Connecticut schools?',
    answer:
      'Both states are strong. On the 2024 National Assessment of Educational Progress, the one test given in both, Massachusetts students scored higher than Connecticut’s in grade 4 and grade 8 reading and math, and Connecticut scored above the national average in reading. What matters for a family is the specific school, so look up its own results on the Massachusetts DESE School and District Profiles, and compare it with your current school on Connecticut’s EdSight.',
  },
  {
    question: "How do I transfer my driver's license from Connecticut to Massachusetts?",
    answer:
      'In person at a Massachusetts RMV service center, with your Connecticut license, proof of identity and lawful presence, proof of Massachusetts residency, and your Social Security number. Book the appointment before you move, because slots run weeks out and registering your car waits on it. Confirm the current document list on the RMV’s website before you go; requirements change.',
  },
  {
    question: 'What is different about buying a house in Massachusetts?',
    answer:
      'Mainly the order of the paperwork. A signed Massachusetts Offer to Purchase is usually a binding contract on its own (McCarthy v. Tobin, 1999), with the inspection and the fuller Purchase and Sale Agreement coming after it. Massachusetts has no statewide seller disclosure form like Connecticut’s, the seller must have smoke and carbon monoxide alarms signed off by the fire department before closing, and a house with a septic system needs a Title 5 inspection.',
  },
];

/**
 * The relocation contact form.
 *
 * It used to be a "send me the checklist" email capture, and the success
 * message told people to check their email for a checklist nothing ever sent.
 * The checklist is now on the page, and this asks only what Kevin will answer
 * himself: where someone is coming from and when.
 */
/**
 * Splits a typed name into the first/last pair `submit-contact` requires.
 *
 * One field rather than two, because every extra input costs submissions.
 * Split on the LAST space, so a middle name goes with the first ("Mai Thi
 * Nguyen" -> "Mai Thi" / "Nguyen") rather than the surname being dropped.
 *
 * A single word keeps an em dash for the surname. The edge function rejects an
 * empty one, so something has to go there, and a marker that reads as "not
 * given" is better than inventing a surname for a real person.
 */
const splitName = (value: string): { firstName: string; lastName: string } => {
  const parts = value.trim().split(/\s+/);
  if (parts.length < 2) return { firstName: parts[0] ?? '', lastName: '—' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
};

const RelocationForm = () => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [from, setFrom] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Through submitContactMessage, like both contact forms, so a fix to
      // the transport reaches all three.
      const town = from.trim();
      await submitContactMessage({
        ...splitName(name),
        email,
        phone: null,
        message: `Moving from Connecticut to Massachusetts (from the relocation page). Coming from: ${town || 'not given'}.`,
      });

      // After a genuine success only, like the contact forms.
      track(EVENTS.lead, { form_location: 'relocation' });

      toast({
        title: 'Sent',
        description: 'Kevin will reply to you himself.',
      });
      setName('');
      setEmail('');
      setFrom('');
    } catch (err) {
      console.error('Error submitting relocation form:', err);
      toast({
        title: 'Error',
        description: 'That did not go through. Please try again, or call or text Kevin.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="not-prose my-12 rounded-3xl border border-gray-200 bg-bone p-8 shadow-sm md:p-10">
      <div className="flex items-start gap-4">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink-deep text-champagne"
          aria-hidden
        >
          <MessageSquare className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-2xl font-semibold text-ink">
            Tell Kevin where you are coming from
          </h3>
          <p className="mt-3 leading-relaxed text-gray-600">
            Your Connecticut town and roughly when you want to move. Kevin reads
            these himself and will tell you where he would start looking, and what
            to do first on the Connecticut side.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-7 grid gap-3 sm:grid-cols-2">
        <Input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          aria-label="Your name"
          className="h-12 rounded-full border-gray-300 bg-white px-5 text-ink"
        />
        <Input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          aria-label="Email address"
          className="h-12 rounded-full border-gray-300 bg-white px-5 text-ink"
        />
        <Input
          type="text"
          placeholder="Your CT town, and when (optional)"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="Your Connecticut town, and when"
          className="h-12 rounded-full border-gray-300 bg-white px-5 text-ink sm:col-span-2"
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          size="lg"
          className="h-12 tracking-wide sm:col-span-2 sm:justify-self-start"
        >
          {isSubmitting ? 'Sending…' : 'Send to Kevin'}
        </Button>
      </form>

      <p className="mt-4 flex items-center gap-2 text-sm text-gray-500">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-champagne-ink" aria-hidden />
        One reply from Kevin. No mailing list.
      </p>
    </div>
  );
};

const townSlug = (name: string) => SITE.areaServed.find((t) => t.name === name)?.slug;

/** One half of the home-value comparison. Massachusetts towns link to their guides. */
const ValueTable = ({ caption, rows }: { caption: string; rows: TownValue[] }) => (
  <div className="self-start overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
    <table className="w-full border-collapse text-left text-sm">
      <caption className="bg-ink-deep px-5 py-3 text-left font-semibold text-white">
        {caption}
      </caption>
      <tbody className="divide-y divide-gray-200 bg-white">
        {rows.map((r) => {
          const slug = townSlug(r.town);
          return (
            <tr key={r.town}>
              <th scope="row" className="px-5 py-2.5 font-medium text-ink">
                {slug ? (
                  <Link
                    to={`/neighborhoods/${slug}`}
                    className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink"
                  >
                    {r.town}
                  </Link>
                ) : (
                  r.town
                )}
              </th>
              <td className="px-5 py-2.5 text-right tabular-nums text-gray-700">
                {usdThousands(r.value)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

/** A plain comparison table: a label column, then Massachusetts, then Connecticut. */
const CompareTable = ({
  head,
  rows,
}: {
  head: [string, string, string];
  rows: [string, React.ReactNode, React.ReactNode][];
}) => (
  <div className="not-prose my-10 overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
    <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
      <thead>
        <tr className="bg-ink-deep text-white">
          {head.map((h, i) => (
            <th key={i} scope="col" className="px-5 py-4 font-semibold">
              {h || <span className="sr-only">Topic</span>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {rows.map(([label, ma, ct]) => (
          <tr key={label} className="align-top">
            <th scope="row" className="px-5 py-4 font-semibold text-ink">
              {label}
            </th>
            <td className="px-5 py-4 leading-relaxed text-gray-700">{ma}</td>
            <td className="px-5 py-4 leading-relaxed text-gray-600">{ct}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const thousands = (n: number) => n.toLocaleString('en-US');

const jobsRow = JOBS.rows[0];
const rnd = JOBS.rows.find((r) => r.label === 'Scientific research and development')!;
const sw = HOME_VALUES.connecticut.find((r) => r.town === 'South Windsor')!.value;
const newton = HOME_VALUES.massachusetts.find((r) => r.town === 'Newton')!.value;
const swTax = ctTax(sw, PROPERTY_TAX.southWindsor.mills);
const newtonTax = maTax(newton, PROPERTY_TAX.newton.rate);

const TAX_ROWS: [string, React.ReactNode, React.ReactNode][] = [
  [
    'Income tax',
    '5% on most income, plus 4% on income over $1,107,750 (2026)',
    'Graduated, from 2% to 6.99% (2025 rates)',
  ],
  [
    'Social Security',
    'Not taxed',
    'Not taxed under $75,000 of income ($100,000 joint); above that, up to 25% of benefits is taxed',
  ],
  ['Sales tax', '6.25%', '6.35%'],
  [
    'Property tax',
    `A rate per $1,000 of full value, set by each town each year. Newton, ${PROPERTY_TAX.newton.period}: $${PROPERTY_TAX.newton.rate}`,
    `A mill rate on 70% of value, set by each town. South Windsor, October 2025 grand list: ${PROPERTY_TAX.southWindsor.mills} mills`,
  ],
  [
    'Car tax',
    'Excise of $25 per $1,000 of a value that starts at 90% of list price and falls to 10% by the fifth year',
    'Taxed by the town as property; the car mill rate is capped at 32.46',
  ],
  [
    'Estate tax',
    'Estates under $2 million owe none; larger estates are taxed at rates from 0.8% to 16%',
    '$15 million exemption in 2026; 12% above it',
  ],
  [
    'Tax when you sell',
    'Deed excise of $2.28 per $500 of price, customarily the seller’s',
    'Conveyance tax: 0.75% of the price up to $800,000 to the state (more above that), plus a share to the town',
  ],
  [
    'Health insurance',
    'Required of adults since 2006, checked on the state tax return',
    'No state requirement',
  ],
];

const Relocation = () => (
  <LandingPage
    path="/relocation"
    crumbs={[
      { name: 'Home', path: '/' },
      { name: 'Moving from Connecticut', path: '/relocation' },
    ]}
    seo={{
      title: 'Moving from Connecticut to Massachusetts: Why and How',
      description: `Born and raised in Connecticut, ${roots.years} years in ${roots.town}: Kevin Hoang on why people move to Massachusetts — jobs, schools, health care — and how to do it.`,
      keywords:
        'moving from Connecticut to Massachusetts, CT to MA, why move to Massachusetts, Connecticut vs Massachusetts taxes, South Windsor to Boston, relocating to Boston from Connecticut',
      ogType: 'article',
      article: {
        publishedTime: PUBLISHED_ISO,
        modifiedTime: UPDATED.iso,
        author: SITE.agentName,
      },
    }}
    serviceMeta={{
      name: 'Connecticut to Massachusetts relocation',
      serviceType: 'Real estate relocation services',
    }}
    jsonLd={[
      // The author of the article node below. #kevin has to be declared on
      // this page for that reference to resolve.
      person(),
      guideArticle({
        title: 'Moving from Connecticut to Massachusetts: Why and How',
        slug: 'relocation',
        path: '/relocation',
        datePublished: PUBLISHED_ISO,
        dateModified: UPDATED.iso,
        description: `Kevin Hoang, born and raised in Connecticut, on why people move to Massachusetts and how to make the move.`,
      }),
    ]}
    hero={{
      image:
        'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?auto=format&fit=crop&w=1920&q=70',
      alt: 'A white clapboard New England house behind a picket fence in autumn',
    }}
    eyebrow="Connecticut → Massachusetts"
    h1="Moving from Connecticut to Massachusetts"
    lede={`Kevin Hoang was born and raised in Connecticut and lived in ${roots.town} for ${roots.years} years before moving up to Greater Boston in ${roots.moved}. This is his guide to the same move: why people make it, what it really costs, and how to sell in Connecticut and buy in Massachusetts without owning two houses or none.`}
    faqHeading="Questions about moving from Connecticut"
    faqs={FAQS}
    cta={{
      heading: 'Planning a move from Connecticut?',
      body: 'Tell Kevin your Connecticut town, your timeline and what you need from a Massachusetts one. He will tell you where to start looking, and what to do first on the Connecticut side.',
    }}
  >
    <p className="not-prose text-sm text-gray-500">
      By <Link to="/about" className="font-medium text-ink underline decoration-champagne decoration-2 underline-offset-4">{SITE.agentName}</Link>
      {' · '}Updated <time dateTime={UPDATED.iso}>{UPDATED.display}</time>
    </p>

    <h2>From {roots.town} to Greater Boston</h2>
    <blockquote>
      <p>
        I was born and raised in Connecticut and lived in {roots.town} for{' '}
        {roots.years} years. I moved up to Greater Boston in {roots.moved} for the
        same mix of reasons most people do: work, family, a bigger market for my
        real estate business, and wanting to live close to a city. My phone number
        still starts with 860.
      </p>
    </blockquote>
    <p>
      Since then Kevin has helped several clients make the same move. He is a
      licensed Massachusetts real estate broker with {SITE.brokerage}, and he knows
      both ends of the drive: what a Connecticut buyer expects, and what is
      different the moment you cross into Massachusetts. About 9,900 people moved
      from Connecticut to Massachusetts in 2024, by the Census Bureau&rsquo;s count,
      and a few more than that went the other way. It is a well-worn road in both
      directions, and everyone on it works out the same questions.
    </p>

    <h2>Why do people move from Connecticut to Massachusetts?</h2>
    <p>
      In short: more jobs and higher pay, strong schools and the universities that
      come with Boston, the best-insured population in the country, and a real city
      within reach, all about 90 miles from family in the Hartford suburbs. In
      more detail:
    </p>

    <h3>Jobs and pay</h3>
    <p>
      Massachusetts has about {thousands(Math.round(jobsRow.ma / 100_000) / 10)} million
      jobs to Connecticut&rsquo;s {thousands(Math.round(jobsRow.ct / 100_000) / 10)}{' '}
      million, a little over twice as many, and the average job paid{' '}
      {usd(jobsRow.maPay)} a year against {usd(jobsRow.ctPay)} ({JOBS.period},
      federal count). The gap is widest in science: about{' '}
      {thousands(Math.round(rnd.ma / 1000) * 1000)} people work in scientific
      research and development in Massachusetts against about{' '}
      {thousands(Math.round(rnd.ct / 1000) * 1000)} in Connecticut, more than ten
      times as many. If your field is biotech, research, health care or technology,
      there are simply more employers here to choose between.
    </p>
    <p>
      Two honest caveats. Massachusetts biotech had a hard 2025, losing about 3,600
      jobs, its first annual decline in more than twenty years by MassBio&rsquo;s
      count. And finance and insurance still pay more in Connecticut, where
      Hartford&rsquo;s insurers are. The{' '}
      <Link to="/blog/moving-from-connecticut-to-massachusetts-for-work">
        guide to moving from Connecticut for work
      </Link>{' '}
      goes through the industries one by one.
    </p>

    <h3>Schools and universities</h3>
    <p>
      Both states have strong public schools, and the only fair way to compare them
      is a test both take. On the 2024 National Assessment of Educational Progress,
      Massachusetts students scored higher than Connecticut&rsquo;s in all four
      subjects tested (grade 4 and grade 8 reading and math), and Massachusetts had
      the highest grade 4 reading score of any state. Connecticut was above the
      national average in reading. U.S. News ranked Massachusetts 7th for education
      in 2026, down from 5th.
    </p>
    <p>
      State averages do not tell you about one school, and no ranking should choose
      a house. Look up the specific school on the Massachusetts{' '}
      <a href="https://profiles.doe.mass.edu/" target="_blank" rel="noopener noreferrer">
        DESE School and District Profiles
      </a>{' '}
      and compare it with your current one on Connecticut&rsquo;s{' '}
      <a href="https://edsight.ct.gov/" target="_blank" rel="noopener noreferrer">
        EdSight
      </a>
      . Beyond high school, Greater Boston is home to Harvard, MIT, Boston
      University, Boston College, Northeastern, Tufts and UMass Boston, among
      others, and New England&rsquo;s Tuition Break program
      lets residents of any New England state study approved programs at another
      New England state&rsquo;s public colleges for less than out-of-state tuition.
      The{' '}
      <Link to="/blog/massachusetts-vs-connecticut-schools">
        schools guide
      </Link>{' '}
      covers enrollment and how to read the data.
    </p>

    <h3>Health care</h3>
    <p>
      Massachusetts had the lowest uninsured rate in the country in 2024, 2.8% of
      residents against 5.8% in Connecticut, and U.S. News ranked it 2nd for health
      care in 2026. Part of that is law: Massachusetts has required adults to carry
      health insurance since 2006, and it is checked on the state tax return. If
      your coverage will not come through an employer, sort it out in your first
      weeks here.
    </p>

    <h3>City life within reach</h3>
    <p>
      Kevin&rsquo;s own reason, and a common one: a real city, with the subway and
      the commuter rail, within a short ride of the suburbs. From most of the towns
      on this site you can get into Boston without driving.
    </p>

    <h3>Family stays a drive away</h3>
    <p>
      {roots.town} to Newton is about 90 miles, most of it on I-84 and the Mass
      Pike, and Hartford to Boston about 100. That is the part people underestimate:
      this is a move you can make without giving up Sunday dinners. If you will be
      driving back often, it is also a reason to look at the towns along the Pike.
    </p>

    <h2>What do you give up by leaving Connecticut?</h2>
    <ul>
      <li>
        <strong>House prices.</strong> This is the big one. A typical home in{' '}
        {roots.town} was worth about {usdThousands(sw)} in {HOME_VALUES.period}; in
        Newton about {usdMillions(newton)}, more than three times as much. The table
        below has the rest.
      </li>
      <li>
        <strong>A higher estate tax.</strong> Massachusetts taxes estates over $2
        million; Connecticut&rsquo;s exemption is $15 million in 2026. For a retiree
        with a paid-off house and savings, that can be a real number, and it is
        worth a conversation with an estate attorney before the move.
      </li>
      <li>
        <strong>Distance from Hartford and New York.</strong> If your work is in
        Hartford or toward New York, Massachusetts moves you away from it.
      </li>
    </ul>

    <h2>How far does a Connecticut budget go in Greater Boston?</h2>
    <p>
      Typical home values, from the same source for both states, so the two lists
      compare like with like. They are estimates of a mid-priced home of any type,
      not sale prices.
    </p>
    <div className="not-prose my-10 grid gap-6 md:grid-cols-2">
      <ValueTable caption="Connecticut" rows={HOME_VALUES.connecticut} />
      <ValueTable caption="Greater Boston (towns Kevin covers)" rows={HOME_VALUES.massachusetts} />
    </div>
    <p className="text-sm text-gray-500">
      {HOME_VALUES.source}, {HOME_VALUES.period}. For actual sale prices in each
      Massachusetts town, read straight from the MLS, see Kevin&rsquo;s{' '}
      <Link to="/market">monthly market reports</Link>.
    </p>
    <p>
      The way to read it: the least expensive towns Kevin covers, Malden and Quincy,
      start around where Stamford is, and about 50% above {roots.town}. People
      coming from the Hartford area usually rethink what they are buying (a condo
      or a two-family, or a smaller house closer in) rather than what town they
      can afford. Nobody does that well from a listing site, which is the case for
      a conversation before you start looking.
    </p>

    <h2>Massachusetts and Connecticut taxes, side by side</h2>
    <p>
      The one that surprises Connecticut people is property tax. A Connecticut mill
      rate is charged on 70% of market value; a Massachusetts rate on all of it.
      So {roots.town}&rsquo;s {PROPERTY_TAX.southWindsor.mills} mills is about 2.6%
      of a house&rsquo;s value each year, and Newton&rsquo;s ${PROPERTY_TAX.newton.rate}{' '}
      per $1,000 is under 1%. But the bill follows the price: a typical{' '}
      {roots.town} house pays about {usd(Math.round(swTax / 100) * 100)} a year, and
      a typical Newton house about {usd(Math.round(newtonTax / 100) * 100)}.
    </p>
    <CompareTable head={['', 'Massachusetts', 'Connecticut']} rows={TAX_ROWS} />
    <p>
      The{' '}
      <Link to="/blog/connecticut-vs-massachusetts-taxes">
        Connecticut vs. Massachusetts tax guide
      </Link>{' '}
      works through each of these, including the year you move, when you file
      part-year returns in both states.
    </p>

    <h2>Which Massachusetts towns do Connecticut movers look at?</h2>
    <p>
      Choose the town before the house. Two houses fifteen minutes apart can sit in
      towns with different tax bills, different commutes and a forty-minute
      difference at eight in the morning. Kevin covers {SITE.areaServed.length}{' '}
      towns, and each has{' '}
      <Link to="/neighborhoods">its own guide</Link> with the stations, schools and
      roads. People coming from Connecticut tend to sort themselves by how they will
      get around:
    </p>
    <ul>
      <li>
        <strong>West, near the Mass Pike: the road home.</strong>{' '}
        <Link to="/neighborhoods/newton-ma">Newton</Link>,{' '}
        <Link to="/neighborhoods/wellesley-ma">Wellesley</Link>,{' '}
        <Link to="/neighborhoods/weston-ma">Weston</Link>,{' '}
        <Link to="/neighborhoods/needham-ma">Needham</Link>,{' '}
        <Link to="/neighborhoods/waltham-ma">Waltham</Link> and{' '}
        <Link to="/neighborhoods/dover-ma">Dover</Link>. The shortest drive back to
        I-84, commuter rail into Boston from all but Dover, and most of the highest
        prices in the table above, with Waltham the exception.
      </li>
      <li>
        <strong>On the subway.</strong>{' '}
        <Link to="/neighborhoods/cambridge-ma">Cambridge</Link>,{' '}
        <Link to="/neighborhoods/somerville-ma">Somerville</Link>,{' '}
        <Link to="/neighborhoods/brookline-ma">Brookline</Link>,{' '}
        <Link to="/neighborhoods/medford-ma">Medford</Link> and{' '}
        <Link to="/neighborhoods/malden-ma">Malden</Link>. More condos and
        multi-families than single-family streets, and in Malden the lowest prices in
        the table.
      </li>
      <li>
        <strong>North and west, along Route 128.</strong>{' '}
        <Link to="/neighborhoods/lexington-ma">Lexington</Link>,{' '}
        <Link to="/neighborhoods/concord-ma">Concord</Link>,{' '}
        <Link to="/neighborhoods/winchester-ma">Winchester</Link> and{' '}
        <Link to="/neighborhoods/belmont-ma">Belmont</Link>. Commuter rail in all but
        Lexington, which has buses and the Minuteman Bikeway instead.
      </li>
      <li>
        <strong>South, on the Red Line.</strong>{' '}
        <Link to="/neighborhoods/quincy-ma">Quincy</Link> and{' '}
        <Link to="/neighborhoods/braintree-ma">Braintree</Link>, with Route 3 and
        I-93, and prices close to Malden&rsquo;s.
      </li>
    </ul>
    <p>
      If you are headed for Worcester, Springfield or the South Coast, those are
      real options and this is not the practice for them. Say so early and Kevin
      will point you to someone who works there.
    </p>

    <h2>How buying in Massachusetts differs from Connecticut</h2>
    <ul>
      <li>
        <strong>The offer is the contract.</strong> A signed Massachusetts Offer to
        Purchase is usually binding on its own (<em>McCarthy v. Tobin</em>, 1999),
        so read it as one before you sign. The inspection and the fuller{' '}
        <Link to="/blog/real-estate-closing-process-massachusetts">Purchase and Sale Agreement</Link>{' '}
        come after it.
      </li>
      <li>
        <strong>No statewide disclosure form.</strong> Connecticut sellers fill in a
        Residential Property Condition Disclosure Report or credit you $500.
        Massachusetts has no equivalent, so your{' '}
        <Link to="/blog/home-inspection-guide">inspection</Link> carries more of the
        weight. Since 2025 a seller cannot require you to waive it (
        <Link to="/blog/massachusetts-home-inspection-waiver-law">760 CMR 74.00</Link>).
      </li>
      <li>
        <strong>Paperwork you have not seen before.</strong> A fire department
        sign-off on smoke and carbon monoxide alarms before closing, a{' '}
        <Link to="/blog/title-5-septic-massachusetts">Title 5 inspection</Link> for a
        house on septic, and the{' '}
        <Link to="/blog/massachusetts-lead-paint-law">lead paint law</Link>, which
        covers every house built before 1978 and requires deleading where a child
        under six lives.
      </li>
      <li>
        <strong>A buyer agreement up front.</strong> You sign a{' '}
        <Link to="/blog/buyer-agency-agreements-massachusetts">buyer agency agreement</Link>{' '}
        before touring homes, as you now would in Connecticut too.
      </li>
    </ul>

    <h2>Selling your Connecticut house first</h2>
    <p>
      Kevin is not licensed in Connecticut and does not list or sell Connecticut
      houses. Talk to him first anyway: he will connect you with a
      Connecticut-licensed agent he trusts for the sale, and coordinate its timing
      with your purchase here. The timing is the part that keeps people up at night,
      and it deserves a decision made before you list:
    </p>
    <ol>
      <li>
        <strong>Sell first, then buy.</strong> The strongest position in
        Massachusetts, where you are a certain buyer, but you may need a rent-back
        or a short rental in between.
      </li>
      <li>
        <strong>Buy first, then sell.</strong> The simplest to live through, and
        the most expensive if the Connecticut sale is slow.
      </li>
      <li>
        <strong>A sale contingency.</strong> The cheapest, and the weakest offer in
        a competitive Massachusetts market. Some sellers will not consider one.
      </li>
      <li>
        <strong>Bridge financing.</strong> Buys you the timing, at a cost. Price it
        before you assume it is out of reach.
      </li>
    </ol>
    <p>
      One thing Hartford-area sellers should know before they list: the Connecticut
      disclosure form asks directly whether you know of pyrrhotite in the
      foundation. The state estimates up to 35,000 homes may have been built with
      affected concrete from a Stafford Springs supplier between 1983 and 2015. If
      yours was built in those years, find out where it stands before a
      buyer&rsquo;s inspector does. The{' '}
      <Link to="/blog/selling-a-connecticut-house-to-move-to-massachusetts">
        guide to selling in Connecticut to buy in Massachusetts
      </Link>{' '}
      covers that, the conveyance tax, and the closing.
    </p>

    <h2>The CT-to-MA moving checklist</h2>
    <p>In the order it actually comes up.</p>
    <h3>Before you list in Connecticut</h3>
    <ol>
      <li>Decide the order: sell first, buy first, a contingency, or a bridge loan.</li>
      <li>
        Get pre-approved for the Massachusetts purchase, with the lender knowing you
        still own in Connecticut.
      </li>
      <li>
        Fill in Connecticut&rsquo;s Residential Property Condition Disclosure Report,
        and if the house was built between 1983 and 2015, know your answer on the
        foundation.
      </li>
      <li>Talk to Kevin, who will connect you with a Connecticut-licensed agent for the sale.</li>
    </ol>
    <h3>Once you are under agreement in Massachusetts</h3>
    <ol>
      <li>
        Call the new school district&rsquo;s registration office: proof of
        residency, immunization records and transcripts. For a child with an IEP or
        504 plan, call the special education office early.
      </li>
      <li>Line up health coverage if it will not come through an employer.</li>
      <li>
        Book the RMV appointment and get a Massachusetts auto insurance policy; the
        insurer stamps your registration application.
      </li>
      <li>
        Ask your Connecticut town&rsquo;s assessor what they need to stop next
        year&rsquo;s car tax bill, usually proof that the Connecticut registration
        was canceled and the plates returned.
      </li>
    </ol>
    <h3>After you move</h3>
    <ol>
      <li>
        Massachusetts license, then registration, then the safety and emissions
        inspection, which is due within days of registering.
      </li>
      <li>Register to vote, and update your address with the Postal Service.</li>
      <li>Expect your first Massachusetts excise bill for the car.</li>
      <li>
        Next spring, file part-year returns in both states: Form 1-NR/PY in
        Massachusetts and Form CT-1040NR/PY in Connecticut.
      </li>
    </ol>
    <p className="text-sm text-gray-500">
      Requirements change. Confirm document lists with the Massachusetts RMV, your
      new district and your Connecticut town before relying on any of it.
    </p>

    <RelocationForm />

    <p>
      Arriving from somewhere else? Most of this still applies, and the{' '}
      <Link to="/blog/moving-to-massachusetts-relocation-guide">
        first-year guide to moving to Massachusetts
      </Link>{' '}
      covers any state. If it would be easier to talk it through in Vietnamese,{' '}
      <Link to="/vietnamese-speaking-real-estate-agent">Kevin does that too</Link>.
    </p>

    <h2>Where these numbers come from</h2>
    <ul className="text-sm">
      {SOURCES.map((s) => (
        <li key={s.url + s.label}>
          <a href={s.url} target="_blank" rel="noopener noreferrer">
            {s.label}
          </a>
        </li>
      ))}
    </ul>
    <p className="text-sm text-gray-500">
      Tax rates and rules are stated as of 2026 and change; the Massachusetts
      Department of Revenue, the Connecticut Department of Revenue Services and each
      town&rsquo;s assessor are the authorities on their own. General information,
      not tax or legal advice.
    </p>
  </LandingPage>
);

export default Relocation;
