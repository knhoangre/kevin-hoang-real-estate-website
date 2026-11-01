import type { QA } from '@/lib/schema';
import { TOWN_FACTS } from '@/data/townFacts';
import { CHINESE_PARTNER } from '@/lib/siteConfig';

/**
 * The town FAQ in Chinese, for the guides at /zh/quyu/<slug>.
 *
 * Same questions as townFaqs.ts, assembled from the same TOWN_FACTS, so a tax
 * rate or a station is corrected once and every language has it. Station, school
 * and road names stay in English on purpose: that is what is on the sign and in
 * the listing, and a translated school name is one nobody can look up.
 *
 * `buyerNote` and the schools `note` are prose, written in English in TOWN_FACTS,
 * so the guide's translation passes its own.
 */
export const townFaqsZh = (
  townName: string,
  englishName: string,
  slug: string,
  notes: { buyer?: string; schools?: string } = {},
): QA[] => {
  const f = TOWN_FACTS[slug];
  if (!f) return [];

  const qas: QA[] = [];

  // First, because it is what a reader of Chinese most wants to know about any
  // town, and an answer engine lifts a direct question and answer whole.
  qas.push({
    question: `在${townName}（${englishName}）买房或卖房，有讲中文的房地产经纪人吗？`,
    answer: `有。${CHINESE_PARTNER.name} 是 ${CHINESE_PARTNER.brokerage} 的房地产经纪人，可以用普通话和英文服务${townName}（${englishName}）的买家和卖家。电话 ${CHINESE_PARTNER.phone}，邮箱 ${CHINESE_PARTNER.email}，也可以通过微信联系。`,
  });

  qas.push({
    question: `${townName}有通勤火车或地铁站吗？`,
    answer: f.transit.length
      ? `有：${f.transit.join('；')}。`
      : `${townName}镇内没有自己的轨道交通车站。`,
  });

  const schools = f.schools;
  const parts: string[] = [];
  if (schools.elementary) parts.push(`小学：${schools.elementary.join('、')}`);
  if (schools.middle) parts.push(`初中：${schools.middle.join('、')}`);
  parts.push(`高中：${schools.high.join('、')}`);
  qas.push({
    question: `${townName}有哪些公立学校？`,
    answer: `${parts.join('；')}。${notes.schools ? `${notes.schools}` : ''}学区范围会调整，请针对具体地址向学区确认后再作决定。`,
  });

  if (f.taxRate) {
    qas.push({
      question: `${townName}的房产税率是多少？`,
      answer:
        `${f.taxRate.fiscalYear} 财年的住宅税率为每 $1,000 估税价值 $${f.taxRate.rate.toFixed(2)}。` +
        `您的税单等于税率乘以估税价值再除以 1,000。税率每年由城镇制定，并由麻州税务局公布，请先确认最新数字。` +
        `另外，税率低不等于税单低，因为税率还取决于全镇的总估税价值和预算。`,
    });
  }

  qas.push({
    question: `${townName}附近有哪些高速公路？`,
    answer: `${f.highways.join('、')}。对每天的通勤来说，您离哪条路近，比您在镇界哪一边更重要。`,
  });

  if (f.outdoors.length) {
    qas.push({
      question: `${townName}有哪些公园和开放空间？`,
      answer: `${f.outdoors.join('；')}。`,
    });
  }

  if (notes.buyer) {
    qas.push({
      question: `在${townName}买房要特别查什么？`,
      answer: notes.buyer,
    });
  }

  return qas;
};
