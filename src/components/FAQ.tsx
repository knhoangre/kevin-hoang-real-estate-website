
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";

const FAQ = () => {
  const { t } = useTranslation();

  const faqItems = [
    {
      question: t('faq.component_items.item1.question'),
      answer: t('faq.component_items.item1.answer')
    },
    {
      question: t('faq.component_items.item2.question'),
      answer: t('faq.component_items.item2.answer')
    },
    {
      question: t('faq.component_items.item3.question'),
      answer: t('faq.component_items.item3.answer')
    },
    {
      question: t('faq.component_items.item4.question'),
      answer: t('faq.component_items.item4.answer')
    },
    {
      question: t('faq.component_items.item5.question'),
      answer: t('faq.component_items.item5.answer')
    },
    {
      question: t('faq.component_items.item6.question'),
      answer: t('faq.component_items.item6.answer')
    },
    {
      question: t('faq.component_items.item7.question'),
      answer: t('faq.component_items.item7.answer')
    },
    {
      question: t('faq.component_items.item8.question'),
      answer: t('faq.component_items.item8.answer')
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="container px-4">
        <h2 className="text-4xl font-bold text-[#1a1a1a] mb-12">{t('faq.title')}</h2>
        
        <Accordion type="single" collapsible className="w-full max-w-4xl mx-auto">
          {faqItems.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-xl font-semibold text-left">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-700">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
