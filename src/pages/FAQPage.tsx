import { useState } from "react";
import { Phone, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageShell from "@/components/PageShell";
import FaqAccordion from "@/components/FaqAccordion";
import { faqPage } from "@/lib/schema";
import { SITE, telHref, smsHref } from "@/lib/siteConfig";

const FAQPage = () => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("general");

  const generalFaqItems = [
    {
      question: t('faq.general_items.item1.question'),
      answer: t('faq.general_items.item1.answer')
    },
    {
      question: t('faq.general_items.item2.question'),
      answer: t('faq.general_items.item2.answer')
    },
    {
      question: t('faq.general_items.item3.question'),
      answer: t('faq.general_items.item3.answer')
    },
    {
      question: t('faq.general_items.item4.question'),
      answer: t('faq.general_items.item4.answer')
    },
    {
      question: t('faq.general_items.item5.question'),
      answer: t('faq.general_items.item5.answer')
    },
    {
      question: t('faq.general_items.item6.question'),
      answer: t('faq.general_items.item6.answer')
    },
    {
      question: t('faq.general_items.item7.question'),
      answer: t('faq.general_items.item7.answer')
    },
    {
      question: t('faq.general_items.item8.question'),
      answer: t('faq.general_items.item8.answer')
    },
    {
      question: t('faq.general_items.item9.question'),
      answer: t('faq.general_items.item9.answer')
    },
    {
      question: t('faq.general_items.item10.question'),
      answer: t('faq.general_items.item10.answer')
    },
    {
      question: t('faq.general_items.item11.question'),
      answer: t('faq.general_items.item11.answer')
    },
    {
      question: t('faq.general_items.item12.question'),
      answer: t('faq.general_items.item12.answer')
    }
  ];

  const sellerFaqItems = [
    {
      question: t('faq.seller_items.item1.question'),
      answer: t('faq.seller_items.item1.answer')
    },
    {
      question: t('faq.seller_items.item2.question'),
      answer: t('faq.seller_items.item2.answer')
    },
    {
      question: t('faq.seller_items.item3.question'),
      answer: t('faq.seller_items.item3.answer')
    },
    {
      question: t('faq.seller_items.item4.question'),
      answer: t('faq.seller_items.item4.answer')
    },
    {
      question: t('faq.seller_items.item5.question'),
      answer: t('faq.seller_items.item5.answer')
    },
    {
      question: t('faq.seller_items.item6.question'),
      answer: t('faq.seller_items.item6.answer')
    },
    {
      question: t('faq.seller_items.item7.question'),
      answer: t('faq.seller_items.item7.answer')
    },
    {
      question: t('faq.seller_items.item8.question'),
      answer: t('faq.seller_items.item8.answer')
    },
    {
      question: t('faq.seller_items.item9.question'),
      answer: t('faq.seller_items.item9.answer')
    },
    {
      question: t('faq.seller_items.item10.question'),
      answer: t('faq.seller_items.item10.answer')
    },
    {
      question: t('faq.seller_items.item11.question'),
      answer: t('faq.seller_items.item11.answer')
    },
    {
      question: t('faq.seller_items.item12.question'),
      answer: t('faq.seller_items.item12.answer')
    }
  ];

  const buyerFaqItems = [
    {
      question: t('faq.buyer_items.item1.question'),
      answer: t('faq.buyer_items.item1.answer')
    },
    {
      question: t('faq.buyer_items.item2.question'),
      answer: t('faq.buyer_items.item2.answer')
    },
    {
      question: t('faq.buyer_items.item3.question'),
      answer: t('faq.buyer_items.item3.answer')
    },
    {
      question: t('faq.buyer_items.item4.question'),
      answer: t('faq.buyer_items.item4.answer')
    },
    {
      question: t('faq.buyer_items.item5.question'),
      answer: t('faq.buyer_items.item5.answer')
    },
    {
      question: t('faq.buyer_items.item6.question'),
      answer: t('faq.buyer_items.item6.answer')
    },
    {
      question: t('faq.buyer_items.item7.question'),
      answer: t('faq.buyer_items.item7.answer')
    },
    {
      question: t('faq.buyer_items.item8.question'),
      answer: t('faq.buyer_items.item8.answer')
    },
    {
      question: t('faq.buyer_items.item9.question'),
      answer: t('faq.buyer_items.item9.answer')
    },
    {
      question: t('faq.buyer_items.item10.question'),
      answer: t('faq.buyer_items.item10.answer')
    },
    {
      question: t('faq.buyer_items.item11.question'),
      answer: t('faq.buyer_items.item11.answer')
    },
    {
      question: t('faq.buyer_items.item12.question'),
      answer: t('faq.buyer_items.item12.answer')
    }
  ];


  const crumbs = [
    { name: "Home", path: "/" },
    { name: "FAQ", path: "/faq" },
  ];

  /**
   * The three question sets, in one array.
   *
   * The rail, the panels and the counts are all derived from it, so a fourth
   * category means adding one entry rather than editing three places that have
   * to agree with each other.
   */
  const sections = [
    { id: "general", title: t('faq.general'), items: generalFaqItems },
    { id: "seller", title: t('faq.sellers'), items: sellerFaqItems },
    { id: "buyer", title: t('faq.buyers'), items: buyerFaqItems },
  ];

  return (
    <PageShell
      path="/faq"
      crumbs={crumbs}
      seo={{
        title: 'Frequently Asked Questions About Buying & Selling in Greater Boston',
        description:
          'Straight answers to the questions buyers and sellers ask most about Massachusetts real estate — offers, inspections, pricing, closing, and agent fees.',
        keywords:
          'Massachusetts real estate FAQ, home buying questions MA, home selling questions Boston, real estate agent questions',
      }}
      /*
        FAQPage markup is kept for AI-search comprehension, not for a SERP
        feature — Google removed FAQ rich results in May 2026. Never build a
        page *for* that rich result.
      */
      jsonLd={faqPage([...generalFaqItems, ...sellerFaqItems, ...buyerFaqItems])}
      h1={t('faq.title')}
      lede={t('faq.subtitle')}
      heroSize="compact"
      width="wide"
      // No credential strip: this page answers questions rather than pitching,
      // and the four facts belong where someone is deciding whom to hire.
      strip={false}
      cta={{
        heading: t('faq.cta_heading'),
        body: t('faq.cta_body'),
        button: t('faq.cta_button'),
      }}
    >
        {/*
          Two columns: a sticky category rail beside the questions, replacing a
          full-width three-up pill switcher above a flat list. The pill bar had
          to carry three long labels across the whole page width, and below it
          twelve identically-weighted rows ran off the bottom of the screen with
          nothing to place the reader in the set. A rail keeps the categories,
          their counts and a way to make contact visible the whole way down.
        */}
        <section className="border-t border-black/5 bg-bone py-16 md:py-20">
          <div className="container px-4">
            <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:gap-16">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  {t('faq.browse')}
                </p>

                {/*
                  Horizontally scrollable on phones, a stacked list from lg.
                  Real buttons either way — this switches a panel, it does not
                  navigate, so an anchor would be a lie about what it does.
                */}
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0">
                  {sections.map((section) => {
                    const isActive = activeSection === section.id;
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setActiveSection(section.id)}
                        aria-pressed={isActive}
                        className={`flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-300 lg:w-full lg:shrink lg:justify-between lg:rounded-xl lg:px-4 lg:py-3 ${
                          isActive
                            ? 'bg-ink-deep text-white shadow-md'
                            : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-white hover:text-ink hover:ring-gray-300'
                        }`}
                      >
                        <span className="whitespace-nowrap lg:whitespace-normal lg:text-left">
                          {section.title}
                        </span>
                        <span
                          className={`text-xs font-semibold tabular-nums transition-colors ${
                            isActive ? 'text-champagne' : 'text-gray-400'
                          }`}
                        >
                          {section.items.length}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Contact card. The question that is not on this page is the
                    reason someone leaves it, so the way to ask stays in view. */}
                <div className="mt-8 hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:block">
                  <span className="mb-4 block h-px w-10 bg-champagne" aria-hidden />
                  <p className="font-display text-lg font-semibold leading-snug text-ink">
                    {t('faq.still_asking')}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {t('faq.still_asking_body')}
                  </p>
                  <div className="mt-5 space-y-2">
                    <a
                      href={telHref}
                      className="flex items-center gap-2.5 text-sm font-medium text-ink transition-colors hover:text-champagne-ink"
                    >
                      <Phone className="h-4 w-4 shrink-0 text-champagne-ink" aria-hidden />
                      {SITE.phone}
                    </a>
                    <a
                      href={smsHref}
                      className="flex items-center gap-2.5 text-sm font-medium text-ink transition-colors hover:text-champagne-ink"
                    >
                      <MessageSquare className="h-4 w-4 shrink-0 text-champagne-ink" aria-hidden />
                      {t('faq.text_kevin')}
                    </a>
                  </div>
                </div>
              </div>

              {/*
                All three sets are rendered and the inactive ones hidden with
                `hidden`, rather than `{activeSection === x && ...}`.

                Conditional rendering meant the prerendered HTML contained ONE
                of the three question sets and — because the Radix accordion
                unmounts collapsed content — none of the answers at all. That
                both hides the copy from every crawler that does not run JS and
                invalidates the FAQPage markup above, which requires the answers
                to actually be on the page.
              */}
              <div className="min-w-0">
                {sections.map((section) => (
                  <div key={section.id} hidden={activeSection !== section.id}>
                    <div className="faq-reveal mb-8">
                      <span className="mb-4 block h-px w-10 bg-champagne" aria-hidden />
                      <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-ink">
                        {section.title}
                      </h2>
                      <p className="mt-3 text-sm text-gray-500">
                        {section.items.length} {t('faq.answered')}
                      </p>
                    </div>
                    <FaqAccordion faqs={section.items} variant="cards" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

    </PageShell>
  );
};

export default FAQPage;
