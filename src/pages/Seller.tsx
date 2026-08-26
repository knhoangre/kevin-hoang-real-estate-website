import { Element } from "react-scroll";
import SellerRoadmap from "@/components/SellerRoadmap";
import SellerResources from "@/components/SellerResources";
import { useTranslation } from "react-i18next";
import Seo from "@/components/Seo";
import { agentIdentity, breadcrumbs, service } from "@/lib/schema";
import BreadcrumbBar from "@/components/BreadcrumbBar";

const Seller = () => {
  const { t } = useTranslation();

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Seller's Guide", path: "/seller" },
  ];

  return (
    <div className="min-h-screen bg-white">
    <Seo
      title="Home Seller's Guide for Greater Boston"
      description="How to sell a home in Greater Boston: preparing the property, setting a price the market supports, marketing, negotiating offers, and reaching a clean closing."
      keywords="home seller guide Massachusetts, selling a house Greater Boston, listing agent Needham MA, how to sell my home MA"
      jsonLd={[
        breadcrumbs(crumbs),
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
    />
      <div className="pt-16">
        <div className="container px-4 py-24">
          <div className="max-w-6xl mx-auto">
            <BreadcrumbBar items={crumbs} />
          </div>
          <div className="enter-down">
            <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4 enter-down" style={{ '--enter-delay': '0.2s' } as React.CSSProperties}>
{t('seller_guide.title')}
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl enter-down" style={{ '--enter-delay': '0.4s' } as React.CSSProperties}>
{t('seller_guide.subtitle')}
            </p>
          </div>
          <Element name="roadmap">
            <SellerRoadmap />
          </Element>

          <div className="py-8">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong>{t('seller_guide.important_notice')}</strong> {t('seller_guide.important_notice_text')}
              </p>
            </div>
          </div>

          <Element name="resources">
            <SellerResources />
          </Element>
        </div>
      </div>
    </div>
  );
};

export default Seller;
