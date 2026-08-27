import { Element } from "react-scroll";
import BuyerRoadmap from "@/components/BuyerRoadmap";
import BuyerResources from "@/components/BuyerResources";
import { useTranslation } from "react-i18next";
import PageShell, { ShellSection } from "@/components/PageShell";
import { agentIdentity, service } from "@/lib/schema";

const Buyer = () => {
  const { t } = useTranslation();

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Buyer's Guide", path: "/buyer" },
  ];

  return (
    <PageShell
      path="/buyer"
      crumbs={crumbs}
      seo={{
        title: "Home Buyer's Guide for Greater Boston",
        description:
          "A step-by-step guide to buying a home in Greater Boston: getting pre-approved, searching, writing an offer, the inspection, and what happens at closing.",
        keywords: "home buyer guide Massachusetts, buying a house Greater Boston, home buying process MA, buyer representation Needham",
      }}
      jsonLd={[
        // service() names #agent as its provider, and an @id only resolves
        // against a node declared in the same document — so #agent is declared
        // here too.
        agentIdentity(),
        service({
          name: 'Buyer representation',
          serviceType: 'Real estate buyer agency',
          description: 'Representing home buyers across Needham, MetroWest, and Greater Boston.',
          path: '/buyer',
        }),
      ]}
      eyebrow="Buying"
      h1={t('buyer_guide.title')}
      lede={t('buyer_guide.subtitle')}
      heroSize="compact"
      // Wide: the roadmap is a sticky sidebar beside the steps, and at the
      // prose width its detail columns collapse to about 38 characters.
      width="wide"
      cta={{
        heading: 'Ready to start looking?',
        body:
          'Tell Kevin the towns and the budget and he will tell you what is realistic in them right now, and what the first week actually looks like.',
      }}
    >
      <ShellSection width="wide">
        <Element name="roadmap">
          <BuyerRoadmap />
        </Element>

        <div className="py-8">
          {/* Blue is deliberate here and stays: this panel carries a warning,
              not the brand. Recolouring a signal to the accent deletes it. */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
            <p className="text-gray-700 text-sm leading-relaxed">
              <strong>{t('buyer_guide.important_notice')}</strong>{' '}
              {t('buyer_guide.important_notice_text')}
            </p>
          </div>
        </div>

        <Element name="resources">
          <BuyerResources />
        </Element>
      </ShellSection>
    </PageShell>
  );
};

export default Buyer;
