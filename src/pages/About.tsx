import { Link } from 'react-router-dom';
import { Phone, CalendarDays, ExternalLink } from 'lucide-react';
import PageShell, { ShellSection } from '@/components/PageShell';
import ProseBody from '@/components/ProseBody';
import SectionHeading from '@/components/SectionHeading';
import { agentIdentity, person } from '@/lib/schema';
import { SITE, telHref, formattedAddress, mapsHref } from '@/lib/siteConfig';

/**
 * The person page.
 *
 * `#kevin` is referenced as the `author` of every blog post and as the agent's
 * `employee`, but until this page existed there was nowhere on the site that
 * described him — the footer's "About" link pointed at
 * /needham-real-estate-agent, which is a services page. An entity referenced
 * ninety times and never described is exactly the gap that leaves an answer
 * engine with nothing to resolve "who is Kevin Hoang" to.
 *
 * Topical axis: the PERSON. /needham-real-estate-agent owns hiring intent,
 * /home-valuation seller intent, /relocation the origin market. No <h1> or <h2>
 * string here may appear on any of them.
 *
 * Everything stated here is checkable: the brokerage, the licence, the office,
 * the languages, the towns, and the profiles — which are rendered as visible
 * outbound links rather than only asserted in `sameAs`. That pairing is the
 * point of the page. A `sameAs` claim nothing links to is an assertion; a
 * visible link out, with a link back from the profile, is corroboration, and
 * corroboration is what lets an engine merge seven profiles into one person
 * instead of treating them as seven.
 *
 * NOT here, deliberately: any biography that is not already published
 * elsewhere on this site, invented sale counts, and any credential that cannot
 * be looked up. The Connecticut-to-Massachusetts move is referenced because
 * /relocation already states it in the first person.
 *
 * TODO(kevin): the Massachusetts broker licence number. It is public record at
 * elicensing.mass.gov, which is exactly why it is worth printing — a number a
 * reader can verify does more for trust than any adjective. Drop it into
 * LICENCE_NUMBER below and the line renders itself.
 */

/** Public MA licence number. Empty renders nothing — absent beats invented. */
const LICENCE_NUMBER = '';

/** Salesperson licence issued 2021; broker licence 2026. See Stats.tsx. */
const LICENSED_SINCE = 2021;

const Section = ({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: React.ReactNode;
}) => (
  <section className="mt-16 scroll-mt-28" id={id}>
    <SectionHeading className="mb-6">{heading}</SectionHeading>
    <ProseBody>{children}</ProseBody>
  </section>
);

const About = () => {
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'About Kevin', path: '/about' },
  ];

  return (
    <PageShell
      path="/about"
      crumbs={crumbs}
      seo={{
        title: 'About Kevin Hoang | Real Estate Broker in Needham, MA',
        description:
          'Kevin Hoang is a licensed Massachusetts real estate broker with Keller Williams Realty, based in Needham and working across 17 towns in MetroWest and Greater Boston in English and Vietnamese.',
        keywords:
          'Kevin Hoang, Needham real estate broker, Keller Williams Needham, Vietnamese speaking realtor Boston',
        ogImage: '/kevin_hoang.jpg',
        ogType: 'profile',
      }}
      jsonLd={[
        // This page is the canonical description of #kevin, so the Person node
        // is declared here rather than merely referenced.
        person(),
        agentIdentity(),
      ]}
      eyebrow={SITE.brokerage}
      h1="Kevin Hoang"
      lede={
        <>
          Licensed Massachusetts real estate broker, based at the Keller Williams
          office on West Street in Needham. He represents buyers and sellers
          across {SITE.areaServed.length} towns in MetroWest and Greater Boston,
          and works in English and Vietnamese.
        </>
      }
      heroSize="compact"
      width="prose"
      /* Portrait-led rather than the landscape photograph the service pages
         use — the subject of this page is a person, and his face is the most
         useful image on it. */
      asideFirst
      heroAside={
        /* Same crop problem as the homepage portrait, worse: with no
           object-position at all this defaulted to `50% 50%`, which on a
           750x1125 full-length source shows the middle band — the top of his
           head was cut off entirely. Anchor the image and the zoom to the same
           edge and the face lands mid-box.

           The clip needs a wrapper: the ring and radius were on the <img>
           itself, and a scaled image with nothing to overflow into would simply
           spill past them. */
        <div className="aspect-square w-full max-w-[220px] overflow-hidden rounded-2xl ring-1 ring-champagne/40">
          <picture>
            <source srcSet="/kevin_hoang.webp" type="image/webp" />
            <img
              src="/kevin_hoang.jpg"
              alt="Kevin Hoang, real estate broker in Needham, Massachusetts"
              width={440}
              height={440}
              className="h-full w-full origin-top scale-150 object-cover object-top"
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        </div>
      }
      actions={
        <>
          <a
            href={telHref}
            className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold tracking-wide text-ink-deep transition-colors hover:bg-champagne btn-pill"
          >
            <Phone className="w-4 h-4" aria-hidden />
            {SITE.phone}
          </a>
          <a
            href={SITE.appointmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-champagne/60 px-7 py-3.5 text-sm font-semibold tracking-wide text-champagne transition-colors hover:bg-champagne hover:text-ink-deep btn-pill"
          >
            <CalendarDays className="w-4 h-4" aria-hidden />
            Book a consultation
          </a>
        </>
      }
      /* Checkable facts only — the same discipline as the Stats row: nothing
         here is a claim a reader cannot confirm from a public register or a
         public profile. */
      strip={[
        { term: 'Title', value: 'Real Estate Broker' },
        { term: 'Brokerage', value: SITE.brokerage },
        { term: 'Licensed since', value: String(LICENSED_SINCE) },
        { term: 'Languages', value: 'English · Tiếng Việt' },
      ]}
      cta={{
        heading: 'Start with a conversation',
        body:
          'No obligation and no script. Tell Kevin what you are trying to do and he will tell you what the next step actually is, even if that step is not hiring anyone yet.',
      }}
    >
      <ShellSection className="py-20 md:py-24 bg-white">
          <Section id="credentials" heading="What a broker licence means in Massachusetts">
            <p>
              Massachusetts issues two real estate licences. A{' '}
              <strong>salesperson</strong> licence is the entry-level one, and it
              requires the holder to work under the supervision of a broker. A{' '}
              <strong>broker</strong> licence requires documented full-time practice
              as a salesperson first, further classroom education, a separate state
              examination, and three sponsor references. Most practising agents hold
              the salesperson licence.
            </p>
            <p>
              Kevin has been licensed in Massachusetts since {LICENSED_SINCE} and holds
              the broker licence.
              {LICENCE_NUMBER ? (
                <>
                  {' '}
                  His licence number is <strong>{LICENCE_NUMBER}</strong>, and both the
                  licence and its status can be confirmed on the{' '}
                  <a
                    href="https://elicensing.mass.gov/CitizenAccess/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Massachusetts Division of Occupational Licensure register
                  </a>
                  .
                </>
              ) : (
                <>
                  {' '}
                  Any Massachusetts licence can be looked up by name on the{' '}
                  <a
                    href="https://elicensing.mass.gov/CitizenAccess/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Division of Occupational Licensure register
                  </a>
                  , which is the right way to check this claim rather than take it on
                  faith.
                </>
              )}
            </p>
            <p>
              He practises under <strong>{SITE.brokerage}</strong>, from the office at{' '}
              <a href={mapsHref} target="_blank" rel="noopener noreferrer">
                {formattedAddress}
              </a>
              .
            </p>
          </Section>

          <Section id="how-he-works" heading="How Kevin works with clients">
            <p>
              The written guides on this site are the actual process, not marketing
              for it. If you want to know what working together looks like before you
              call anyone, read them first — that is what they are for.
            </p>
            <ul>
              <li>
                <Link to="/buyer">The buyer&rsquo;s roadmap</Link> — every step from
                pre-approval to the closing table, and what each one is actually for.
              </li>
              <li>
                <Link to="/seller">The seller&rsquo;s roadmap</Link> — preparation,
                pricing, marketing, and how offers get negotiated.
              </li>
              <li>
                <Link to="/first-time-buyers">The first-time buyer guide</Link> — the
                Massachusetts programmes and the mistakes that cost the most.
              </li>
              <li>
                <Link to="/home-valuation">A written home valuation</Link> — built from
                comparable sales, not an automated estimate.
              </li>
            </ul>
            <p>
              Two things shape how he handles a transaction. The first is that a
              Massachusetts purchase runs through two contracts, not one — the Offer
              and then the Purchase &amp; Sale agreement — and most of what goes wrong
              for buyers happens in the gap between them. The second is that this
              region is decided street by street rather than town by town: which
              commuter rail stop you can walk to, which elementary school an address
              feeds, whether a lot is on town sewer or{' '}
              <Link to="/blog/title-5-septic-massachusetts">Title 5 septic</Link>.
            </p>
          </Section>

          <Section id="where" heading="Where Kevin works">
            <p>
              {SITE.areaServed.length} towns across MetroWest, Greater Boston and the
              South Shore. Each has its own guide, with named stations, named schools,
              and the specific thing a buyer should check there:
            </p>
            <p>
              {SITE.areaServed.map((town, i) => (
                <span key={town.slug}>
                  {i > 0 && ' · '}
                  <Link to={`/neighborhoods/${town.slug}`}>{town.name}</Link>
                </span>
              ))}
            </p>
            <p>
              He also works with families{' '}
              <Link to="/relocation">moving to Massachusetts from Connecticut</Link>, a
              move he has made himself, and offers the whole of the above{' '}
              <Link to="/vietnamese-speaking-real-estate-agent">in Vietnamese</Link> as
              well as English — an additional service, not a specialisation.
            </p>
          </Section>

          <Section id="writing" heading="What Kevin writes about">
            <p>
              He writes the guides on this site himself. They cover the Massachusetts
              specifics that general national advice gets wrong — the statutes, the
              deadlines, and the local practice:
            </p>
            <ul>
              <li>
                <Link to="/blog/massachusetts-offer-contingencies">
                  What each contingency in a Massachusetts offer actually protects
                </Link>
              </li>
              <li>
                <Link to="/blog/buyer-agency-agreements-massachusetts">
                  What the 2024 buyer-agency change means for buyers
                </Link>
              </li>
              <li>
                <Link to="/blog/renting-in-greater-boston-costs">
                  What it really costs to move into a Greater Boston rental
                </Link>
              </li>
              <li>
                <Link to="/blog/in-law-apartments-adu-massachusetts">
                  In-law apartments and ADUs after the 2024 Affordable Homes Act
                </Link>
              </li>
            </ul>
            <p>
              The full archive is on <Link to="/blog">the blog</Link>, and the
              questions that come up most often are answered on{' '}
              <Link to="/faq">the FAQ page</Link>.
            </p>
          </Section>

          {/* The corroboration block. These are the same URLs the Person node
              emits as `sameAs` — rendered from SITE.profiles so the visible
              list and the machine-readable claim cannot name different sets.

              The heading and the intro used to sit inside <Section>, which
              closed before the list did, so the copy and the links it was
              introducing rendered as two unrelated blocks with a prose gap
              between them. They are one block now, and the copy says what the
              links are rather than editorialising about verifiability. */}
          <section className="mt-16 scroll-mt-28" id="profiles">
            <span className="mb-5 block h-px w-10 bg-champagne" aria-hidden />
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink mb-6">
              Where else to find Kevin
            </h2>
            <p className="text-lg leading-relaxed text-gray-600">
              His profiles on the sites where people usually look an agent up.
              Listings, licence status, and client reviews live on these.
            </p>

            <ul className="mt-8 grid list-none gap-3 p-0 sm:grid-cols-2">
              {SITE.profiles.map((profile) => (
                <li key={profile.url} className="m-0">
                  <a
                    href={profile.url}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm font-medium text-ink transition-colors hover:border-champagne hover:bg-bone"
                  >
                    {profile.name}
                    <ExternalLink className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>

            {/* Was a paragraph explaining, to a visitor, why review schema is
                not implemented on this page. That is a note for whoever
                maintains the site, not for the person reading it — the reason
                still holds, it just does not belong in the copy. */}
            <p className="mt-6 text-sm leading-relaxed text-gray-500">
              Client reviews sit on the Google Business Profile, where Google
              verifies that they came from real clients.{' '}
              <Link
                to="/testimonials"
                className="underline decoration-champagne decoration-2 underline-offset-4"
              >
                The reviews page
              </Link>{' '}
              links straight to them.
            </p>
          </section>
      </ShellSection>
    </PageShell>
  );
};

export default About;
