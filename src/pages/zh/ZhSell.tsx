import { ClipboardCheck, FileText, TrendingUp } from 'lucide-react';
import ZhPage from '@/components/ZhPage';
import ZhSellerRoadmap from '@/components/zh/ZhSellerRoadmap';
import ViResources from '@/components/vi/ViResources';

/**
 * /zh/shoufang — the seller's guide in Chinese. Pairs with /seller. Weighted
 * toward the documents the law requires, because those are what stop a closing.
 */
const ZhSell = () => (
  <ZhPage
    path="/zh/shoufang"
    seo={{
      title: '麻州卖房指南：准备、定价和必备文件',
      description:
        '在麻州卖房：准备房屋、合理定价，以及法律要求的文件，包括烟雾报警器证明、Title 5 化粪池检查、含铅油漆披露和 condo 的 6(d) 证明。',
      keywords: '麻州 卖房, 波士顿 卖房, 卖房 流程, 卖房 费用, Title 5, 烟雾报警器证明, Massachusetts home selling guide Chinese',
    }}
    eyebrow="售房指南"
    h1="在麻州卖房：准备、定价和文件"
    lede="卖房的结果主要取决于三件事：一开始就定对价格，挂牌前把房子准备好，以及在必备文件拖慢过户之前把它们办好。"
    hero={{
      image:
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=70',
      alt: '一栋准备出售的房子的室内',
    }}
    faqHeading="卖房最常见的问题"
    faqs={[
      {
        question: '价格定高一点留出议价空间，可以吗？',
        answer:
          '这是最常见的错误。新挂牌的房子得到的关注最多，而且不会再来第二次：所有正在这个城镇找房的买家都会在同一时间看到它。价格太高，他们看一眼就走了。之后再降价，已经接触不到这批买家，最后的降幅往往比当初拒绝的差价还大。',
      },
      {
        question: '卖房之前要装修吗？',
        answer:
          '修那些便宜又会引起担心的问题：漏水、用电安全、楼梯扶手、地基周围的排水。不必整体翻新厨房或浴室，这笔钱很少能收回来，而且买家通常会按自己的喜好再改。',
      },
      {
        question: '烟雾报警器证明是什么？谁来办？',
        answer:
          '在麻州，卖家有责任向当地消防部门申请烟雾和一氧化碳报警器证明，证明要在临近过户时取得。消防部门的预约常常很满，预约太晚是这里过户推迟最常见的原因之一。',
      },
      {
        question: '我家用化粪池怎么办？',
        answer:
          '大多数交易要求卖家按 Title 5 检查化粪池系统，通常在出售前两年内完成，报告交给买家和当地卫生局。请在挂牌之前做：早知道，您还有选择；等有了合同才知道，就没有了。',
      },
      {
        question: '过户时卖家要付哪些费用？',
        answer:
          '麻州地契税、还清现有贷款、condo 的 6(d) 证明、烟雾报警器证明，以及您签署的协议中约定的经纪费。房产税、水费和下水道费按过户日分摊。',
      },
      {
        question: '卖房要交税吗？',
        answer:
          '要看您持有多久、是否是自住，以及做过哪些资本改良。一般来说，如果过去五年中有两年以上是主要住所，联邦规定单身可免 $250,000、夫妻联合报税可免 $500,000 的资本利得（IRS，2026 年）。您的具体情况请咨询报税师。',
      },
    ]}
    cta={{
      heading: '您的房子值多少钱？',
      body: '从一份基于附近同类成交的书面估价开始，而不是一个自动算出来的数字。免费，也没有任何义务。',
      button: '申请估价',
    }}
    enLabel="The seller's guide and roadmap"
    // Wide, like /seller: the roadmap's sticky index sits beside the steps.
    width="wide"
    sections={
      <>
        <ZhSellerRoadmap />

        <div className="py-8">
          {/* Blue is deliberate and stays: a warning panel, not the brand. */}
          <div className="rounded-r-lg border-l-4 border-blue-400 bg-blue-50 p-6">
            <p className="text-sm leading-relaxed text-gray-700">
              <strong>重要提示：</strong>
              每一笔售房交易都不一样，这份路线图只是一般性的指引。这些内容仅供参考，
              不构成法律、税务或财务建议。请向经纪人、律师和报税师咨询适合您情况的建议。
            </p>
          </div>
        </div>

        <ViResources
          heading="售房资料"
          subtitle="这些资料可以帮助您准备、定价并完成出售。"
          viewLabel="查看详情"
          viewEnglishLabel="查看（英文）"
          resources={[
            {
              icon: ClipboardCheck,
              title: '挂牌前的房屋准备',
              description: '哪些事该做，哪些不该做，让房子卖出最好的价格。',
              link: '/blog/home-preparation-guide',
              english: true,
            },
            {
              icon: TrendingUp,
              title: '定价策略',
              description: '在大波士顿这样竞争激烈的市场如何定价。',
              link: '/blog/pricing-strategy-guide',
              english: true,
            },
            {
              icon: FileText,
              title: '卖家过户前要准备的文件',
              description: '麻州卖家必须准备好的文件、披露和证明。',
              link: '/blog/massachusetts-seller-closing-requirements',
              english: true,
            },
          ]}
        />
      </>
    }
  />
);

export default ZhSell;
