import { BookOpen, Calculator, Eye, FileText, Home, BarChart3 } from 'lucide-react';
import ZhPage from '@/components/ZhPage';
import ZhBuyerRoadmap from '@/components/zh/ZhBuyerRoadmap';
import ViResources from '@/components/vi/ViResources';

/**
 * /zh/goufang — the buyer's guide in Chinese. Pairs with /buyer.
 *
 * The roadmap is the content, as on /buyer and /vi/mua-nha: a prose walkthrough
 * above it would state the same eight steps twice on one page.
 */
const ZhBuy = () => (
  <ZhPage
    path="/zh/goufang"
    seo={{
      title: '麻州买房指南：从贷款预批到过户',
      description:
        '用中文讲解在麻州买房的完整流程：贷款预批、购房要约和买卖合同两份合同、验房、银行估价和过户，以及最容易出错的地方。',
      keywords: '麻州 买房 流程, 波士顿 买房, 美国 买房 流程, 贷款预批, 验房, 过户费用, Massachusetts home buying guide Chinese',
    }}
    eyebrow="购房指南"
    h1="在麻州买房：一步一步来"
    lede="麻州买房和大多数州有两点不同：交易要经过两份合同，而不是一份；而且实际上离不开律师。弄懂这两点，就弄懂了流程的大部分。"
    hero={{
      image:
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=70',
      alt: '大波士顿住宅区的一栋房子',
    }}
    faqHeading="买房最常见的问题"
    faqs={[
      {
        question: '买房要准备多少现金？',
        answer:
          '比首付要多。除了首付，您还要支付贷款费用、银行估价费、律师费、产权调查和产权保险、登记费、预付利息，以及用于房产税和保险的 escrow 账户。同样重要的是，过户之后手上还要留有备用金。',
      },
      {
        question: '购房要约（Offer to Purchase）有约束力吗？',
        answer:
          '有。这是麻州最昂贵的误解。很多人听说“真正的合同是后面的 P&S”，就轻易地签了要约。但要约本身就是有约束力的合同，它确定了价格、定金和所有期限。到了 P&S 阶段，这些期限早已开始计时。',
      },
      {
        question: '为了赢得竞争，应该放弃验房吗？',
        answer:
          '不应该。自 2025 年 10 月 15 日起，麻州法规（760 CMR 74.00）禁止卖家和卖方经纪以放弃验房作为接受出价的条件。有一个很多人不知道的合法做法：在提交要约之前先验房。您要为可能买不到的房子付验房费，但既掌握了信息，也可以提交不带验房条件的出价。这一带的房子大多建于 1940 年以前，老旧电线、油罐、石棉和渗水都是实际存在的问题。',
      },
      {
        question: '银行估价低于我的出价怎么办？',
        answer:
          '银行按估价放贷，而不是按合同价，所以差额要由您承担。您可以重新议价、用现金补足、对估价提出异议，或者退出交易，但前提是合同允许。请在估价之前就问清律师这个条款怎么写。',
      },
      {
        question: '买房要多长时间？',
        answer:
          '从出价被接受算起，波士顿一带的交易大多需要 30 到 45 天。全款买房会快一些。最慢的环节通常是贷款审批和产权文件。',
      },
    ]}
    cta={{
      heading: '准备开始找房了吗？',
      body: '第一步不是去看房，而是拿到一封书面的贷款预批信，并清楚自己要在哪些城镇找。Maggie 可以从这里开始陪您走完全程。',
      button: '联系 Maggie',
    }}
    enLabel="The buyer's guide and roadmap"
    // Wide, like /buyer: the roadmap's sticky index sits beside the steps.
    width="wide"
    sections={
      <>
        <ZhBuyerRoadmap />

        <div className="py-8">
          {/* Blue is deliberate and stays: this panel carries a warning, not
              the brand. Recolouring a signal to the accent deletes it. */}
          <div className="rounded-r-lg border-l-4 border-blue-400 bg-blue-50 p-6">
            <p className="text-sm leading-relaxed text-gray-700">
              <strong>重要提示：</strong>
              每一笔购房交易都不一样，这份路线图只是一般性的指引。您的具体情况可能需要额外的步骤、
              不同的时间安排或其他做法。这些内容仅供参考，不构成法律或财务建议。
              请向经纪人、贷款机构和律师咨询适合您情况的建议。
            </p>
          </div>
        </div>

        <ViResources
          heading="购房资料"
          subtitle="这些资料可以帮助您在买房过程中做出决定。"
          viewLabel="查看详情"
          viewEnglishLabel="查看（英文）"
          resources={[
            {
              icon: BookOpen,
              title: '首次购房指南',
              description: '为第一次买房的人讲解完整流程，从存钱到拿到钥匙。',
              link: '/zh/shouci-goufang',
            },
            {
              icon: Calculator,
              title: '房贷计算器',
              description: '根据房价、首付和利率估算每月的还款。',
              link: '/zh/jisuanqi',
            },
            {
              icon: FileText,
              title: '贷款预批清单',
              description: '申请贷款预批之前要准备的文件和步骤。',
              link: '/blog/pre-approval-checklist',
              english: true,
            },
            {
              icon: Home,
              title: '验房指南',
              description: '验房时要看什么、问什么，特别是 1940 年以前建造的房子。',
              link: '/blog/home-inspection-guide',
              english: true,
            },
            {
              icon: BarChart3,
              title: '多人竞价时怎么办',
              description: '在波士顿一带，赢得竞争的出价往往靠条款，而不只是靠价格。',
              link: '/blog/winning-a-bidding-war-greater-boston',
              english: true,
            },
            {
              icon: Eye,
              title: '城镇指南',
              description: '了解每个城镇的情况，先选地方，再选房子。',
              link: '/zh/quyu',
            },
          ]}
        />
      </>
    }
  />
);

export default ZhBuy;
