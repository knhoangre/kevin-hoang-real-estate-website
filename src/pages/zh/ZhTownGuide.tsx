import { Link } from 'react-router-dom';
import ZhPage from '@/components/ZhPage';
import FaqAccordion from '@/components/FaqAccordion';
import NearbyTowns from '@/components/NearbyTowns';
import TownFactsPanel, { type TownFactsLabels } from '@/components/TownFactsPanel';
import TownGuideSections, { type TownSection } from '@/components/TownGuideSections';
import MaggieCard from '@/components/zh/MaggieCard';
import { TOWN_FACTS } from '@/data/townFacts';
import { TOWN_NAMES_ZH } from '@/data/zh/townNames';
import { faqPage } from '@/lib/schema';
import { townFaqsZh } from '@/lib/townFaqsZh';
import { SITE } from '@/lib/siteConfig';

/**
 * /zh/quyu/<slug> — one town guide in Chinese, paired with /neighborhoods/<slug>.
 *
 * Handed its guide as a prop, as the market pages are handed their report: each
 * route lazy-loads only its own text, and the first render is the whole page.
 *
 * Kevin's closings (TownSoldListings) are left off on purpose. Beside Maggie's
 * name and number they would read as her sales. So is the market link's English
 * sentence, replaced with a plain one that says the report is in English.
 */
export interface ZhTownGuideData {
  slug: string;
  title: string;
  description: string;
  keywords: string;
  subtitle: string;
  image: string;
  sections: TownSection[];
  /** TOWN_FACTS' two prose fields, in Chinese. */
  buyerNote?: string;
  schoolsNote?: string;
}

const LABELS: TownFactsLabels = {
  heading: (town) => `${town}概况`,
  transit: '到波士顿的交通',
  highways: '高速公路',
  schools: '公立学校',
  elementary: '小学：',
  middle: '初中：',
  high: '高中：',
  outdoors: '公园和开放空间',
  taxRate: '住宅房产税率',
  taxLine: (_rate, fiscalYear) => `每 $1,000 估税价值，${fiscalYear} 财年。`,
  taxCheckBefore: '税率每年制定。最新数字请向这里确认：',
  taxCheckAfter: '。',
  check: '在这里要特别查什么',
};

const ZhTownGuide = ({ guide }: { guide: ZhTownGuideData }) => {
  const { slug } = guide;
  const english = SITE.areaServed.find((town) => town.slug === slug)?.name ?? slug;
  const chinese = TOWN_NAMES_ZH[slug] ?? english;
  const facts = TOWN_FACTS[slug];
  const faqs = townFaqsZh(chinese, english, slug, { buyer: guide.buyerNote, schools: guide.schoolsNote });
  const path = `/zh/quyu/${slug}`;

  return (
    <ZhPage
      path={path}
      seo={{
        title: guide.title,
        description: guide.description,
        keywords: guide.keywords,
      }}
      eyebrow={`${chinese}（${english}）`}
      crumbs={[
        { name: '首页', path: '/zh' },
        { name: '城镇指南', path: '/zh/quyu' },
        { name: chinese, path },
      ]}
      h1={`住在${chinese}（${english}, MA）`}
      lede={guide.subtitle}
      hero={{ image: guide.image, alt: '' }}
      heroSize="standard"
      cta={{
        heading: `想在${chinese}买房或卖房？`,
        body: `这份指南是背景资料。至于在您的情况下实际要怎么做，请和 Maggie 谈一谈，用中文或英文都可以。`,
        button: '联系 Maggie',
      }}
      enLabel={`Living in ${english}, MA`}
      sections={
        <>
          <div className="prose prose-lg max-w-none">
            <TownGuideSections sections={guide.sections} />
          </div>

          {facts && (
            <TownFactsPanel
              town={chinese}
              facts={facts}
              labels={LABELS}
              buyerNote={guide.buyerNote}
              schoolsNote={guide.schoolsNote}
            />
          )}

          {SITE.marketTowns.includes(english) && (
            <p className="my-8 leading-relaxed text-gray-700">
              想知道{chinese}的房子卖什么价？
              <Link
                to={`/market/${slug}`}
                className="underline decoration-champagne decoration-2 underline-offset-4"
              >
                每月市场报告
              </Link>
              列出了过去 12、6 和 3 个月的价格、在售房源和租金（目前是英文的）。
            </p>
          )}

          {faqs.length > 0 && (
            <section className="my-12">
              <h2 className="mb-6 text-2xl font-bold text-ink">关于{chinese}的常见问题</h2>
              {/* Answers stay in the DOM while collapsed, for the FAQPage markup. */}
              <FaqAccordion faqs={faqs} />
            </section>
          )}

          <NearbyTowns
            currentSlug={slug}
            heading={`${chinese}附近的其他城镇`}
            pathFor={(town) => `/zh/quyu/${town}`}
            labelFor={(town) => `${TOWN_NAMES_ZH[town.slug] ?? town.name}（${town.name}）`}
          />

          <MaggieCard className="mt-12" />
        </>
      }
      jsonLd={faqs.length ? [faqPage(faqs)] : []}
    />
  );
};

export default ZhTownGuide;
