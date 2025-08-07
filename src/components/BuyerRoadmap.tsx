import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
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
            <motion.div
              key={index}
              className="flex flex-col md:flex-row gap-6 items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex-shrink-0 relative z-10">
                <motion.div
                  className="bg-white p-2 rounded-full"
                  initial={{ scale: 0.8 }}
                  whileInView={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: index * 0.1 + 0.2
                  }}
                >
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </motion.div>
                {index < steps.length - 1 && (
                  <motion.div
                    className="absolute w-0.5 bg-green-500 left-1/2 transform -translate-x-1/2 top-12 h-16 md:hidden"
                    initial={{ height: 0 }}
                    whileInView={{ height: 50 }}
                    transition={{ duration: 0.3, delay: index * 0.1 + 0.3 }}
                  ></motion.div>
                )}
              </div>

              <motion.div
                className="bg-white p-6 rounded-xl shadow-lg flex-1 z-10 border border-gray-100 hover:shadow-xl transition-shadow"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <h3 className="text-xl font-semibold mb-3 text-[#1a1a1a]">{step.title}</h3>
                <p className="text-gray-700 mb-4 font-medium">{step.description}</p>
                <ul className="space-y-2">
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="text-gray-600 text-sm leading-relaxed">
                      {detail}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuyerRoadmap;
