import { Element } from "react-scroll";
import BuyerRoadmap from "@/components/BuyerRoadmap";
import BuyerResources from "@/components/BuyerResources";
import { useTranslation } from "react-i18next";
import Seo from "@/components/Seo";
import { agentIdentity, service } from "@/lib/schema";

const Buyer = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
    <Seo
      title="Home Buyer's Guide for Greater Boston"
      description="A step-by-step guide to buying a home in Greater Boston: getting pre-approved, searching, writing an offer, the inspection, and what happens at closing."
      keywords="home buyer guide Massachusetts, buying a house Greater Boston, home buying process MA, buyer representation Needham"
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
    />
      <div className="pt-16">
        <div className="container px-4 py-24">
          <div className="enter-down">
            <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4 enter-down" style={{ '--enter-delay': '0.2s' } as React.CSSProperties}>
{t('buyer_guide.title')}
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl enter-down" style={{ '--enter-delay': '0.4s' } as React.CSSProperties}>
{t('buyer_guide.subtitle')}
            </p>
          </div>
          <Element name="roadmap">
            <BuyerRoadmap />
          </Element>

          <div className="py-8">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong>{t('buyer_guide.important_notice')}</strong> {t('buyer_guide.important_notice_text')}
              </p>
            </div>
          </div>

          <Element name="resources">
            <BuyerResources />
          </Element>
        </div>
      </div>
    </div>
  );
};

export default Buyer;
