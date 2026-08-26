import { CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

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
        <div className="py-12">
      <h2 className="text-3xl font-bold text-[#1a1a1a] mb-12">{t('buyer_guide.roadmap_title')}</h2>

      <div className="relative">
        {/* Vertical Timeline Line */}
        <div className="absolute left-6 top-3 bottom-0 w-0.5 bg-green-500 hidden md:block"></div>

        <div className="space-y-16">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col md:flex-row gap-6 items-center enter" style={{ '--enter-delay': `${index * 0.08}s` } as React.CSSProperties}>
              <div className="flex-shrink-0 relative z-10">
                <div className="bg-white p-2 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute w-0.5 bg-green-500 left-1/2 transform -translate-x-1/2 top-12 h-16 md:hidden"></div>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg flex-1 z-10 border border-gray-100 hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-semibold mb-3 text-[#1a1a1a]">{step.title}</h3>
                <p className="text-gray-700 mb-4 font-medium">{step.description}</p>
                <ul className="space-y-2">
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="text-gray-600 text-sm leading-relaxed">
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuyerRoadmap;
