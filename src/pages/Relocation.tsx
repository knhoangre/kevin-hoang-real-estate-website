import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import LandingPage from '@/components/LandingPage';
import type { QA } from '@/lib/schema';

/**
 * Landing page for the ORIGIN MARKET axis — "moving to Massachusetts from
 * Connecticut" and its variants. /needham-real-estate-agent owns hiring intent,
 * /home-valuation seller intent, /vietnamese-speaking-real-estate-agent
 * language. No <h1> or <h2> string here may appear on any of them.
 *
 * This page used to carry its own layout entirely: slate gradients, centred
 * headings, shadcn Card and Table components, and no champagne anywhere. It was
 * the only commercial page not built on <LandingPage>, so it read as a
 * different site — which is the exact drift the shared shell exists to stop.
 *
 * Two content problems were fixed on the way across, because re-typesetting
 * them into a nicer template would have made them more prominent rather than
 * less:
 *
 *   1. The comparison table asserted "avg ~1.15%" against "avg ~2.1%" property
 *      tax with no source and no date — the very figures the FAQ below had
 *      already had removed for being uncheckable. The page contradicted itself
 *      in two places a reader could see at once. Rates are municipal and annual;
 *      the table now points at the two authorities that publish them.
 *   2. "Massachusetts is ranked #1 and Connecticut a proud #2" was an unsourced
 *      ranking presented as settled fact, and the FAQ directly beneath it said
 *      rankings differ by methodology. The claim is now stated the way the FAQ
 *      states it, with the sources named.
 *
 * The town spotlight also recommended the Pioneer Valley and Worcester County,
 * neither of which this practice covers. It now describes the actual service
 * area and says plainly where the map runs out.
 */
const FAQS: QA[] = [
  {
    question: 'Is property tax lower in Massachusetts or Connecticut?',
    answer:
      'Effective property tax rates are generally lower in Massachusetts than in Connecticut, but Massachusetts home values are typically higher — so the annual bill on a comparable house is often closer than the rate difference suggests. Rates are set per municipality and change annually: the Massachusetts Department of Revenue publishes each town’s current rate, and the Connecticut Office of Policy and Management publishes mill rates by town. Compare the two specific towns you are choosing between rather than the state averages.',
  },
  {
    question: "How do I transfer my driver's license from Connecticut to Massachusetts?",
    answer:
      'You apply in person at a Massachusetts RMV service center with your current Connecticut license, proof of identity and lawful presence, proof of Massachusetts residency, and your Social Security number. Massachusetts generally exchanges an out-of-state licence without a road test if yours is current, but a vision screening is required. Requirements change, so confirm the current document list on the Massachusetts RMV website before you go, and book an appointment — walk-in waits are long.',
  },
  {
    question: 'How good are Massachusetts public schools?',
    answer:
      "Massachusetts consistently places at or near the top of national state-by-state education rankings, including U.S. News & World Report's, and MetroWest districts such as Wellesley, Newton, and Lexington are among the strongest in the state. Rankings differ by methodology and by grade level, though, and district quality varies within any town — so treat rankings as a starting point and look at the specific schools your children would attend.",
  },
  {
    question: 'How do I time selling in Connecticut against buying in Massachusetts?',
    answer:
      'The two markets do not move together, and trying to close on the same day rarely works cleanly. The realistic options are a sale contingency, a rent-back from your buyer so you have a few weeks of overlap, or bridge financing. Which one fits depends on how much equity you are carrying and how much risk you can absorb if one side slips — it is worth deciding before you list, not after you have an accepted offer.',
  },
];

/**
 * The CT-to-MA checklist capture.
 *
 * Kept as its own component because it is the one stateful thing on an
 * otherwise static page, and <LandingPage> takes its body as children — this
 * can hold its own state without making the page a client-state container.
 */
const ChecklistForm = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('submit-contact', {
        body: {
          firstName: 'Relocation',
          lastName: 'Lead',
          email: email.trim().toLowerCase(),
          phone: null,
          message: `CT to MA Relocation Checklist Request from ${email}`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Check your email for the relocation checklist.',
      });
      setEmail('');
    } catch (err) {
      console.error('Error submitting email:', err);
      toast({
        title: 'Error',
        description: 'There was an error. Please try again.',
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
          <Download className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-2xl font-semibold text-ink">
            The CT-to-MA moving checklist
          </h3>
          <p className="mt-3 leading-relaxed text-gray-600">
            Every deadline in the move, in the order it actually comes up —
            registry appointments, school enrolment windows, insurance,
            registration, and what to settle before you list in Connecticut.
          </p>
        </div>
      </div>

      <form onSubmit={handleEmailSubmit} className="mt-7">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="Email address"
            className="h-12 flex-1 rounded-full border-gray-300 bg-white px-5 text-ink"
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 rounded-full bg-ink-deep px-8 text-sm font-semibold tracking-wide text-white hover:bg-champagne hover:text-ink-deep"
          >
            {isSubmitting ? 'Sending…' : 'Send me the checklist'}
          </Button>
        </div>
      </form>

      <p className="mt-4 flex items-center gap-2 text-sm text-gray-500">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-champagne-ink" aria-hidden />
        No spam. Unsubscribe anytime.
      </p>
    </div>
  );
};

/** One row of the CT/MA comparison. `ma` and `ct` are deliberately prose, not
 *  figures — see the note at the top of the file about the numbers that were
 *  here before. */
const COMPARISON: { category: string; ma: string; ct: string }[] = [
  {
    category: 'Property tax',
    ma: 'Set per municipality; rates published annually by the Department of Revenue',
    ct: 'Set per municipality as a mill rate; published annually by the Office of Policy and Management',
  },
  {
    category: 'Tax on vehicles',
    ma: 'Annual municipal motor vehicle excise, plus an annual safety and emissions inspection',
    ct: 'Motor vehicles taxed as property by the town you garage them in',
  },
  {
    category: 'Income tax',
    ma: '5% flat rate on most income, plus a 4% surtax on the portion above the statutory threshold (2023 onward)',
    ct: 'Graduated brackets; the bottom rates were cut in 2024',
  },
  {
    category: 'Schools',
    ma: 'Ranks at or near the top nationally; quality still varies by district and by school',
    ct: 'Also ranks highly nationally; same caveat about district-level variation',
  },
  {
    category: 'Commute orientation',
    ma: 'Boston-facing — MBTA commuter rail, the Mass Pike, tech and biotech employment',
    ct: 'Splits between Hartford, New Haven and a long Metro-North run toward New York',
  },
];

const Relocation = () => (
  <LandingPage
    path="/relocation"
    crumbs={[
      { name: 'Home', path: '/' },
      { name: 'Relocating to Massachusetts', path: '/relocation' },
    ]}
    seo={{
      title: 'Moving to Massachusetts from Connecticut',
      description:
        'Relocating from Connecticut to Massachusetts: choosing a town, comparing property taxes and schools, transferring your licence, and timing a sale against a purchase.',
      keywords:
        'moving from Connecticut to Massachusetts, CT to MA relocation, relocating to Boston, best Massachusetts towns for families, MA vs CT property tax',
    }}
    serviceMeta={{
      name: 'Relocation assistance',
      serviceType: 'Real estate relocation services',
    }}
    hero={{
      image:
        'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?auto=format&fit=crop&w=1920&q=70',
      alt: 'A white clapboard New England house behind a picket fence in autumn',
    }}
    eyebrow="Connecticut → Massachusetts"
    h1="Moving to Massachusetts from Connecticut"
    lede="Kevin made this move himself, so he knows where the friction actually is — which town fits how you live, what changes at the border, and how to time a Connecticut sale against a Massachusetts purchase without owning two houses or none."
    faqHeading="Questions about moving from Connecticut"
    faqs={FAQS}
    cta={{
      heading: 'Planning a move from Connecticut?',
      body: 'Tell Kevin your timeline and what you need from a town, and he will tell you where to start looking — and what to do first on the Connecticut side.',
    }}
  >
    <h2>Start with the town, not the house</h2>
    <p>
      The single most expensive mistake people make on this move is house-first.
      You find something you like, you buy it, and only afterwards do you learn
      what the commute is really like in February, which elementary school your
      street feeds, and whether the town centre is somewhere you would actually
      walk to.
    </p>
    <p>
      Massachusetts towns are unusually distinct from one another, and the
      differences do not show up on a listing site. Two houses fifteen minutes
      apart can sit in districts with different characters, tax bills that are
      not close, and commutes that differ by forty minutes at eight in the
      morning. Each town in this practice has{' '}
      <Link to="/neighborhoods">its own written guide</Link>, and reading three
      or four of them before you look at a single house is the highest-return
      hour in the whole move.
    </p>

    <h2>What actually changes at the border</h2>
    <p>
      Less than people fear, and different things than they expect. The two
      states are more alike than either likes to admit — the real differences are
      in how each one taxes, and which city your day is organised around.
    </p>

    <div className="not-prose my-10 overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
      <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-ink-deep text-white">
            <th scope="col" className="px-5 py-4 font-semibold">
              &nbsp;
            </th>
            <th scope="col" className="px-5 py-4 font-semibold">
              Massachusetts
            </th>
            <th scope="col" className="px-5 py-4 font-semibold">
              Connecticut
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {COMPARISON.map((row) => (
            <tr key={row.category} className="align-top">
              <th
                scope="row"
                className="px-5 py-4 font-semibold text-ink whitespace-nowrap"
              >
                {row.category}
              </th>
              <td className="px-5 py-4 leading-relaxed text-gray-700">{row.ma}</td>
              <td className="px-5 py-4 leading-relaxed text-gray-600">{row.ct}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <p>
      Deliberately absent from that table: an average property tax rate for
      either state. Both are set town by town and reset every year, so a
      state-wide average is the one number that cannot tell you what your bill
      will be. Look up the two specific towns you are choosing between — the
      Massachusetts Department of Revenue and the Connecticut Office of Policy
      and Management both publish current rates — and multiply by what you would
      actually pay for a house in each.
    </p>
    <p>
      On schools: Massachusetts places at or near the top of national
      state-by-state rankings, including those published by U.S. News &amp; World
      Report, and it performs strongly on the National Assessment of Educational
      Progress. Connecticut also ranks highly. Rankings differ by methodology and
      by grade level, and quality varies between schools inside a single
      district, so use them to build a shortlist rather than to make the
      decision.
    </p>

    <h2>Where this practice can actually help</h2>
    <p>
      Kevin works across Needham and the surrounding MetroWest and Greater Boston
      towns. Broadly, people arriving from Connecticut sort themselves into three
      groups:
    </p>
    <ul>
      <li>
        <strong>Inside Route 128.</strong> Newton, Brookline, Belmont, Waltham.
        Shortest commutes, most walkable centres, highest prices per square foot,
        oldest housing stock.
      </li>
      <li>
        <strong>The 128-to-495 band.</strong> Needham, Wellesley, Lexington,
        Winchester, Concord. The classic MetroWest trade — more land and more
        house for the money, commuter rail into Boston, and the districts most
        people are moving here for.
      </li>
      <li>
        <strong>South and north of the city.</strong> Quincy, Braintree, Medford,
        Malden. Better value, red and orange line access, and a different feel
        from the western suburbs entirely.
      </li>
    </ul>
    <p>
      If you are headed for Worcester, the Pioneer Valley, or the South Coast,
      those are real options and this is not the practice for them — say so early
      and Kevin will point you at someone who works there rather than stretch to
      cover it.
    </p>

    <h2>Timing a Connecticut sale against a Massachusetts purchase</h2>
    <p>
      This is the part that keeps people up at night, and it deserves a decision
      made in advance rather than under pressure. The two markets do not move
      together, and closing both on the same day almost never works as cleanly as
      it sounds.
    </p>
    <ol>
      <li>
        <strong>Sell first, then buy.</strong> Strongest position on the
        Massachusetts side — you are a cash-certain buyer — but you may need a
        rent-back or a short-term rental in between.
      </li>
      <li>
        <strong>Buy first, then sell.</strong> Simplest to live through and the
        most expensive if the Connecticut sale is slow. Realistic only if you can
        genuinely carry both.
      </li>
      <li>
        <strong>A sale contingency.</strong> Cheapest, and the weakest offer in a
        competitive Massachusetts market. Some sellers will not consider one at
        all.
      </li>
      <li>
        <strong>Bridge financing.</strong> Buys you the timing, at a cost. Price
        it before you assume it is out of reach, and after you know what your
        equity looks like.
      </li>
    </ol>
    <p>
      Which of those fits is a function of your equity and your tolerance for one
      side slipping. Work it out before you list in Connecticut, not after you
      have an accepted offer in Massachusetts. The{' '}
      <Link to="/buyer">buyer's guide</Link> covers the Massachusetts purchase
      sequence in full, and the <Link to="/calculator">calculators</Link> will
      show you what a given price costs monthly once Massachusetts taxes and
      insurance are in it.
    </p>

    <ChecklistForm />

    <h2>The administrative side, in order</h2>
    <p>
      None of this is hard. It is just a list, and it goes badly only when people
      discover it one deadline at a time.
    </p>
    <ul>
      <li>
        <strong>Registry appointment first.</strong> Book the RMV before you
        move, not after. Slots go weeks out and almost everything else waits on
        having a Massachusetts licence.
      </li>
      <li>
        <strong>Insurance before registration.</strong> Massachusetts requires
        an insurance stamp from a Massachusetts-licensed agent on the
        registration application. Your Connecticut policy will not do it.
      </li>
      <li>
        <strong>Then registration, then inspection.</strong> The safety and
        emissions inspection is due within a short window after you register.
      </li>
      <li>
        <strong>School enrolment.</strong> Districts have their own registration
        windows and document requirements — proof of residency, immunisation
        records, prior transcripts. Contact the district as soon as you are under
        agreement, not after you close.
      </li>
      <li>
        <strong>Expect an excise bill.</strong> Massachusetts bills motor vehicle
        excise annually, by municipality, and the first one often arrives when
        new residents are not expecting it.
      </li>
    </ul>
    <p>
      Confirm the current document lists with the Massachusetts RMV and your new
      town before you rely on any of it — requirements change, and the registry's
      own site is the only version that is current.
    </p>

    <h2>Why Kevin takes these on</h2>
    <p>
      He made the same move. That is the whole of the claim — not that
      Connecticut-to-Massachusetts is difficult, but that there is a specific set
      of things nobody tells you, and having done it once means the list already
      exists rather than being assembled as you hit each item.
    </p>
    <p>
      If you are arriving from further afield, most of this page still applies —
      the town-first advice and the administrative sequence do not care which
      state you left. And if it would be easier to work through any of it in
      Vietnamese,{' '}
      <Link to="/vietnamese-speaking-real-estate-agent">that option is here</Link>
      .
    </p>

    <p className="text-sm text-gray-500">
      Tax treatment and registry requirements are described as stated in 2026 and
      change; the Massachusetts Department of Revenue, the Connecticut Office of
      Policy and Management, and the Massachusetts RMV are the authorities on
      their own rules. General information, not tax or legal advice.
    </p>
  </LandingPage>
);

export default Relocation;
