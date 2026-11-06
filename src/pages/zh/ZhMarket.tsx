import { Link } from 'react-router-dom';
import ZhPage from '@/components/ZhPage';
import MarketGlance, { type GlanceWords } from '@/components/market/MarketGlance';
import { LINK } from '@/components/market/MarketParts';
import { EDGE_RULE, type Headline } from '@/lib/market';
import { pct, ratioPct } from '@/lib/marketText';
import { SITE } from '@/lib/siteConfig';
import { TOWN_NAMES_ZH } from '@/data/zh/townNames';
import summaryJson from '@/data/market/summary.json';

const summary = summaryJson as Headline[];

/**
 * /zh/shichang — pairs with /market and /vi/thi-truong. Added 2026-11-06 so the
 * "Market Reports" row of the menu has all three languages; Kevin agreed it could
 * go up before Maggie had read it, and it is on the list for her to read next.
 *
 * Numbers and labels, not analysis: the table is /market's own, through the same
 * component, and each town links to its English report, which is where the
 * sentences are. A Chinese sentence generator for the reports is what waits on
 * Maggie (see "The Chinese tree" in CLAUDE.md).
 *
 * The figures are Kevin's calculations and the attribution says so, as MLS PIN's
 * rules ask; that is the one place Kevin is named.
 */
const WORDS: GlanceWords = {
  head: ['城镇', '成交价中位数（12 个月）', '成交价 / 挂牌价', '高于挂牌价成交', '在售房源', '库存月数', '市场倾向'],
  edge: {
    sellers: '卖方占优',
    buyers: '买方有议价空间',
    balanced: '大致平衡',
  },
  caption: '各城镇市场数据',
};

const monthZh = (m: string) => `${m.slice(0, 4)}年${Number(m.slice(5, 7))}月`;
const dateZh = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${y}年${m}月${d}日`;
};

const RULE = `判定标准：${pct(EDGE_RULE.sellersOver)}或以上的房屋高于最终挂牌价成交，或成交价中位数高于挂牌价的 ${ratioPct(EDGE_RULE.sellersRatio)}，为卖方占优；成交价中位数不高于挂牌价的 ${ratioPct(EDGE_RULE.buyersRatio)}，且高于挂牌价成交的不到 ${pct(EDGE_RULE.buyersOver)}，为买方有议价空间；介于两者之间为大致平衡。`;

const ZhMarket = () => {
  const latest = summary.reduce((m, h) => (h.month > m ? h.month : m), '');
  const asOf = summary.reduce((m, h) => (h.asOf > m ? h.asOf : m), '');
  const town = (h: Headline) => (
    <Link key={h.slug} to={`/market/${h.slug}`} className={LINK}>
      {TOWN_NAMES_ZH[h.slug] ? `${TOWN_NAMES_ZH[h.slug]}（${h.town}）` : h.town}
    </Link>
  );

  return (
    <ZhPage
      path="/zh/shichang"
      seo={{
        title: '大波士顿各城镇房地产市场报告：房价、成交与库存',
        description: `牛顿（Newton）周边 ${summary.length} 个城镇的成交价中位数、成交价与挂牌价之比和在售房源数量，根据 MLS 数据计算，每月 3 日更新。`,
        keywords: '波士顿 房价, 牛顿 房价, Newton MA 房价, 大波士顿 房地产 市场, 麻州 房市, Greater Boston housing market',
      }}
      eyebrow="市场报告"
      h1="大波士顿各城镇的房地产市场"
      lede={`${summary.length} 个城镇的房子卖了多少钱、和挂牌价相比如何、现在有多少在售，都根据 MLS 数据计算，每月 3 日更新${
        latest ? `，最新数据为${monthZh(latest)}` : ''
      }。各城镇的详细报告为英文。`}
      hero={{
        image:
          'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1600&q=70',
        alt: '大波士顿的郊区住宅区',
      }}
      width="wide"
      faqHeading="关于市场报告的问题"
      faqs={[
        {
          question: '这些数据从哪里来？',
          answer:
            '来自 MLS Property Information Network（MLS PIN）的数据：已成交的房屋、已签约待过户的房屋、在售房源和已签订的租约。数据按完整的自然月统计，独栋住宅、condo 和多户住宅分开计算，每月 3 日重新计算一次。',
        },
        {
          question: '“成交价 / 挂牌价”是什么意思？',
          answer:
            '成交价除以房屋最终的挂牌价。100% 表示按挂牌价成交，高于 100% 表示高于挂牌价成交。数据里只有最终挂牌价，也就是降价之后的价格，所以降过价、再按降后价格成交的房子也算 100%。',
        },
        {
          question: '“库存月数”是什么意思？',
          answer:
            '在售房源数量除以过去十二个月平均每月的成交量。数字越低，说明房子卖得越快，新挂牌的房源越不够买。',
        },
        {
          question: '有中文版的详细报告吗？',
          answer:
            '这个页面上的表格已经包括主要数据。各城镇的详细报告，包括各价位的成交和租金，目前是英文。如果需要了解某个城镇的情况，可以联系 Maggie。',
        },
      ]}
      cta={{
        heading: '想知道一栋房子值多少钱？',
        body: '城镇的中位数只是起点。一栋房子的价值，要看附近条件相近、最近成交的房子。',
        button: '联系 Maggie',
      }}
      enLabel="Greater Boston housing market reports"
      sections={
        <section aria-labelledby="shichang-biao" className="space-y-8">
          <h2 id="shichang-biao" className="text-2xl font-semibold text-ink md:text-3xl">
            {summary.length} 个城镇的数据对比
          </h2>
          <p className="max-w-3xl leading-relaxed text-gray-700">
            成交价与挂牌价之比、高于挂牌价成交的比例，在最近三个月有至少十笔成交时按三个月计算，否则按六个月或十二个月计算。在售房源截至
            {dateZh(asOf)}。点击城镇名称可查看完整报告（英文）；每个城镇的中文介绍在
            <Link to="/zh/quyu" className={LINK}>
              城镇指南
            </Link>
            。
          </p>
          <MarketGlance type="SF" heading="独栋住宅" words={WORDS} town={town} />
          <MarketGlance type="CC" heading="公寓（condo）" words={WORDS} town={town} />
          <p className="max-w-3xl text-xs leading-relaxed text-gray-500">{RULE}</p>
          <p className="max-w-3xl leading-relaxed text-gray-700">
            这些报告描述的是城镇，不是某一栋房子。想了解某一栋房子能卖多少，请看
            <Link to="/zh/gujia" className={LINK}>
              房屋估价
            </Link>
            。
          </p>
          <p className="max-w-3xl text-xs leading-relaxed text-gray-500">
            数据来源：MLS Property Information Network, Inc.（MLS PIN）。数据由 {SITE.agentName}（{SITE.brokerage}
            ）计算，并非由 MLS PIN 计算，力求准确但不作保证。
          </p>
        </section>
      }
    />
  );
};

export default ZhMarket;
