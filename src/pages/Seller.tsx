import { Element } from "react-scroll";
import SellerRoadmap from "@/components/SellerRoadmap";
import SellerResources from "@/components/SellerResources";
import { useTranslation } from "react-i18next";
import PageShell, { ShellSection } from "@/components/PageShell";
import { agentIdentity, service } from "@/lib/schema";

const Seller = () => {
  const { t } = useTranslation();

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Seller's Guide", path: "/seller" },
  ];

  return (
    <PageShell
      path="/seller"
      crumbs={crumbs}
      seo={{
        title: "Home Seller's Guide for Greater Boston",
        description:
          "How to sell a home in Greater Boston: preparing the property, setting a price the market supports, marketing, negotiating offers, and reaching a clean closing.",
        keywords: "home seller guide Massachusetts, selling a house Greater Boston, listing agent Needham MA, how to sell my home MA",
      }}
      jsonLd={[
        // service() names #agent as its provider, and an @id only resolves
        // against a node declared in the same document — so #agent is declared
        // here too.
        agentIdentity(),
        service({
          name: 'Seller representation',
          serviceType: 'Real estate listing agency',
          description: 'Representing home sellers across Needham, MetroWest, and Greater Boston.',
          path: '/seller',
        }),
      ]}
      eyebrow="Selling"
      h1={t('seller_guide.title')}
      lede={t('seller_guide.subtitle')}
      heroSize="compact"
      // Wide: the roadmap is a sticky sidebar beside the steps, and at the
      // prose width its detail columns collapse to about 38 characters.
      width="wide"
      cta={{
        heading: 'Thinking about listing?',
        body:
          'Start with what the house is worth today and what it would take to get there. No listing agreement required to have that conversation.',
      }}
    >
      <ShellSection width="wide">
        <Element name="roadmap">
          <SellerRoadmap />
        </Element>

        <div className="py-8">
          {/* Blue is deliberate here and stays: this panel carries a warning,
              not the brand. Recolouring a signal to the accent deletes it. */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
            <p className="text-gray-700 text-sm leading-relaxed">
              <strong>{t('seller_guide.important_notice')}</strong>{' '}
              {t('seller_guide.important_notice_text')}
            </p>
          </div>
        </div>

        <Element name="resources">
          <SellerResources />
        </Element>
      </ShellSection>
    </PageShell>
  );
};

export default Seller;
