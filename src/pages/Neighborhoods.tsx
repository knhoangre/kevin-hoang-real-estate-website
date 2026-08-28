import { useEffect } from "react";
import { Link } from "react-router-dom";
import { neighborhoods } from "../data/neighborhoodData";
import { useTranslation } from "react-i18next";
import PageShell, { ShellSection } from "@/components/PageShell";
import { itemList } from "@/lib/schema";

const Neighborhoods = () => {
  const { t } = useTranslation();

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Neighborhoods", path: "/neighborhoods" },
  ];

  return (
    <PageShell
      path="/neighborhoods"
      crumbs={crumbs}
      seo={{
        title: 'Towns We Serve in MetroWest & Greater Boston',
        description:
          'Area guides for the towns Kevin Hoang serves across MetroWest and Greater Boston — neighborhoods, schools, transit, and what each local housing market is like.',
        keywords:
          'Greater Boston neighborhoods, MetroWest towns, Needham Newton Wellesley real estate, best towns near Boston, Massachusetts town guides',
      }}
      jsonLd={itemList(
        neighborhoods.map((n) => ({ name: `${n.name}, MA`, url: `/neighborhoods/${n.slug}` })),
      )}
      eyebrow="Areas served"
      h1={t('neighborhoods.title')}
      lede={t('neighborhoods.subtitle')}
      hero={{
        image:
          'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?auto=format&fit=crop&w=1600&q=65',
        alt: 'A residential street of brick colonial homes',
      }}
      heroSize="standard"
      width="wide"
      cta={{
        heading: 'Still deciding which town?',
        body:
          'The guides describe each place. Which one fits depends on your commute, your budget and what you need from a school district — that part is worth a conversation.',
      }}
    >
      <ShellSection width="wide">
          {/*
            Answer-first context for the hub page. Without it this page is a
            heading and fourteen photographs — 144 words, and nothing that
            answers the question a visitor actually arrived with, which is
            "which of these should I be looking at". The town cards below carry
            no prose of their own, so this is the page's only chance to say it.
          */}
          <div className="mb-14 max-w-3xl border-y border-gray-200 py-8">
            <p className="text-gray-700 leading-relaxed mb-4">
              Greater Boston is decided street by street rather than town by
              town. Which commuter rail stop you can walk to, which elementary
              school an address actually feeds, and whether a lot is on town
              sewer or{' '}
              <Link to="/blog/title-5-septic-massachusetts" className="underline">
                Title 5 septic
              </Link>{' '}
              matter more to what you pay and how you live than the town line
              does. Two houses a mile apart in the same town can be entirely
              different purchases.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Each guide below names the actual stations, the actual schools,
              the highways, the open space, and the one thing a buyer should
              specifically check in that community. They are informational —
              there is nothing to fill in and no valuation attached.
            </p>
            <p className="text-gray-700 leading-relaxed">
              If you are choosing between towns, start from your commute rather
              than a list of names:{' '}
              <Link to="/blog/transit-oriented-development-boston" className="underline">
                choosing a MetroWest town by your commute
              </Link>
              . Moving from out of state? The{' '}
              <Link to="/relocation" className="underline">
                relocation guide
              </Link>{' '}
              covers the practical side, and{' '}
              <Link to="/blog/mass-property-tax-guide" className="underline">
                how Massachusetts property tax works
              </Link>{' '}
              explains why a town&rsquo;s tax rate on its own tells you nothing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/*
              These are real <Link>s, not a div with an onClick. As click
              handlers they rendered no href at all, so no crawler could reach
              any of the fourteen town guides from their own hub page and they
              were reachable only via the sitemap — and they could not be
              tabbed to either.

              The image alt is empty on purpose: these are stock photographs,
              not photographs of these towns, so an alt of "Newton neighborhood"
              would assert something the picture does not support. The heading
              inside the link is what names the destination.
            */}
            {neighborhoods.map((neighborhood) => (
              <Link
                key={neighborhood.name}
                to={`/neighborhoods/${neighborhood.slug}`}
                className="block overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={neighborhood.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 bg-white">
                  <h2 className="text-2xl font-semibold uppercase">{neighborhood.name}</h2>
                </div>
              </Link>
          ))}
        </div>
      </ShellSection>
    </PageShell>
  );
};

export default Neighborhoods;
