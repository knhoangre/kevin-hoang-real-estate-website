import { AlertTriangle, CheckCircle, DollarSign, FileText, HelpCircle, Home, KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import ZhPage from '@/components/ZhPage';

/**
 * /zh/shouci-goufang — pairs with /first-time-buyers. The one main page with no
 * Vietnamese version.
 *
 * The English page's closing line is in the first person ("I'm here to guide
 * you"), which is Kevin. Here that is Maggie, in the third person. "Skipping the
 * home inspection" stays a mistake to avoid.
 */
const STEPS = [
  {
    icon: DollarSign,
    title: '检查财务状况',
    description: '了解信用分数，计算负债收入比，确定自己能负担多少钱的房子。',
  },
  {
    icon: FileText,
    title: '申请贷款预批',
    description: '贷款预批让您有明确的预算，也向卖家表明您是认真的买家。',
  },
  {
    icon: Home,
    title: '寻找房屋',
    description: '和经纪人一起看符合您条件和预算的房子。',
  },
  {
    icon: KeyRound,
    title: '提交出价',
    description: '找到合适的房子后，根据市场情况和经纪人的建议，提交有竞争力的出价。',
  },
  {
    icon: HelpCircle,
    title: '验房',
    description: '请专业验房师检查，找出潜在问题和需要修缮的地方。',
  },
  {
    icon: CheckCircle,
    title: '过户',
    description: '签署最后的文件，支付过户费用，拿到新家的钥匙。',
  },
];

const MISTAKES = [
  '跳过贷款预批',
  '没有把过户费用和搬家费算进预算',
  '在过户之前大额消费',
  '不做验房',
  '没有了解周边环境',
  '只找第一家贷款机构，不做比较',
];

const FINANCES = [
  {
    title: '首付选择',
    description: '了解各种首付方案，从常规的 20% 到面向首次购房者的低首付项目。',
    color: 'bg-blue-50',
    text: 'text-blue-800',
  },
  {
    title: '贷款类型',
    description: '了解固定利率、浮动利率、FHA、VA 和 USDA 贷款的区别，找到最适合的一种。',
    color: 'bg-green-50',
    text: 'text-green-800',
  },
  {
    title: '首次购房者项目',
    description: '了解专门面向首次购房者的项目、补助和税务优惠，例如 MassHousing。',
    color: 'bg-purple-50',
    text: 'text-purple-800',
  },
];

const ZhFirstTime = () => (
  <ZhPage
    path="/zh/shouci-goufang"
    seo={{
      title: '麻州首次购房指南：需要多少钱、怎么贷款、怎么验房',
      description:
        '第一次在麻州买房，从头到尾讲清楚：要存多少钱，贷款预批怎么办，验房到底是为了什么，过户那天会发生什么，以及最常见的错误。',
      keywords: '首次购房 麻州, 第一次买房 美国, 首付 多少, MassHousing, 波士顿 首次购房, first time home buyer Massachusetts Chinese',
    }}
    eyebrow="首次购房"
    h1="第一次买房的完整指南"
    lede="第一次买房是人生的大事，也是一个有步骤的过程。这里按您实际会遇到的顺序，把每一步讲清楚。"
    hero={{
      image:
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=65',
      alt: '第一个家的室内，家具不多',
    }}
    heroSize="standard"
    width="wide"
    cta={{
      heading: '正在考虑买第一套房？',
      body: '咨询免费，没有任何压力。Maggie 可以回答您的问题，并告诉您看房之前要做哪些事。',
      button: '联系 Maggie',
    }}
    enLabel="First-time home buyer guide"
    sections={
      <>
        <h2 className="mb-10 text-3xl font-bold text-ink">六个步骤，按顺序来</h2>
        <div className="mb-20 grid grid-cols-1 gap-8 md:grid-cols-2">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="enter rounded-xl border border-gray-100 bg-white p-6 shadow-md transition-all duration-300 hover:shadow-lg"
              style={{ '--enter-delay': `${index * 0.08}s` } as React.CSSProperties}
            >
              <div className="flex items-start">
                <div className="mr-4 rounded-full bg-green-50 p-3">
                  <step.icon className="h-6 w-6 text-green-600" aria-hidden />
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold text-ink">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <h2 className="mb-10 text-3xl font-bold text-ink">首次购房者最容易犯的错误</h2>
        <div className="mb-20 rounded-xl bg-red-50 p-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {MISTAKES.map((mistake) => (
              <div key={mistake} className="flex items-start">
                <AlertTriangle className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden />
                <p className="text-gray-800">{mistake}</p>
              </div>
            ))}
          </div>
        </div>

        <h2 className="mb-10 text-3xl font-bold text-ink">资金方面要先了解什么</h2>
        <div className="mb-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {FINANCES.map((item) => (
            <div key={item.title} className={`${item.color} rounded-xl p-6 shadow-sm`}>
              <h3 className={`mb-3 text-xl font-semibold ${item.text}`}>{item.title}</h3>
              <p className="text-gray-700">{item.description}</p>
            </div>
          ))}
        </div>

        <p className="leading-relaxed text-gray-700">
          完整的流程请看<Link to="/zh/goufang" className="underline decoration-champagne decoration-2 underline-offset-4">购房路线图</Link>，
          每月的实际费用可以用<Link to="/zh/jisuanqi" className="underline decoration-champagne decoration-2 underline-offset-4">计算器</Link>算出来。
        </p>
      </>
    }
  />
);

export default ZhFirstTime;
