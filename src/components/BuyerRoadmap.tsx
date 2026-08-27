import { useTranslation } from "react-i18next";
import Roadmap from "@/components/Roadmap";

/**
 * Data only. The timeline itself lives in Roadmap.tsx, which this and
 * SellerRoadmap both render — the two used to carry identical
 * copy-pasted markup, so every visual change had to be made twice.
 */
const BuyerRoadmap = () => {
  const { t } = useTranslation();

  const steps = [
    {
      title: t('buyer_guide.roadmap_steps.step1.title'),
      description: t('buyer_guide.roadmap_steps.step1.description'),
      details: [
        t('buyer_guide.roadmap_steps.step1.details.0'),
        t('buyer_guide.roadmap_steps.step1.details.1'),
        t('buyer_guide.roadmap_steps.step1.details.2'),
        t('buyer_guide.roadmap_steps.step1.details.3')
      ]
    },
    {
      title: t('buyer_guide.roadmap_steps.step2.title'),
      description: t('buyer_guide.roadmap_steps.step2.description'),
      details: [
        t('buyer_guide.roadmap_steps.step2.details.0'),
        t('buyer_guide.roadmap_steps.step2.details.1')
      ]
    },
    {
      title: t('buyer_guide.roadmap_steps.step3.title'),
      description: t('buyer_guide.roadmap_steps.step3.description'),
      details: [
        t('buyer_guide.roadmap_steps.step3.details.0'),
        t('buyer_guide.roadmap_steps.step3.details.1')
      ]
    },
    {
      title: t('buyer_guide.roadmap_steps.step4.title'),
      description: t('buyer_guide.roadmap_steps.step4.description'),
      details: [
        t('buyer_guide.roadmap_steps.step4.details.0'),
        t('buyer_guide.roadmap_steps.step4.details.1'),
        t('buyer_guide.roadmap_steps.step4.details.2')
      ]
    },
    {
      title: t('buyer_guide.roadmap_steps.step5.title'),
      description: t('buyer_guide.roadmap_steps.step5.description'),
      details: [
        t('buyer_guide.roadmap_steps.step5.details.0'),
        t('buyer_guide.roadmap_steps.step5.details.1'),
        t('buyer_guide.roadmap_steps.step5.details.2')
      ]
    },
    {
      title: t('buyer_guide.roadmap_steps.step6.title'),
      description: t('buyer_guide.roadmap_steps.step6.description'),
      details: [
        t('buyer_guide.roadmap_steps.step6.details.0'),
        t('buyer_guide.roadmap_steps.step6.details.1'),
        t('buyer_guide.roadmap_steps.step6.details.2')
      ]
    },
    {
      title: t('buyer_guide.roadmap_steps.step7.title'),
      description: t('buyer_guide.roadmap_steps.step7.description'),
      details: [
        t('buyer_guide.roadmap_steps.step7.details.0'),
        t('buyer_guide.roadmap_steps.step7.details.1'),
        t('buyer_guide.roadmap_steps.step7.details.2')
      ]
    },
    {
      title: t('buyer_guide.roadmap_steps.step8.title'),
      description: t('buyer_guide.roadmap_steps.step8.description'),
      details: [
        t('buyer_guide.roadmap_steps.step8.details.0'),
        t('buyer_guide.roadmap_steps.step8.details.1'),
        t('buyer_guide.roadmap_steps.step8.details.2')
      ]
    }
  ];

  return (
    <Roadmap
      title={t('buyer_guide.roadmap_title')}
      steps={steps}
      accent="blue"
      stepLabel={t('roadmap.step')}
      ofLabel={t('roadmap.of')}
    />
  );
};

export default BuyerRoadmap;
