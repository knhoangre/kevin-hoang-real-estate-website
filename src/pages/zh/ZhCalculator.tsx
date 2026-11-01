import { Link } from 'react-router-dom';
import ZhPage from '@/components/ZhPage';
import ProseBody from '@/components/ProseBody';
import HomeCalculator, { type CalculatorSeed } from '@/components/calculator/HomeCalculator';

/**
 * /zh/jisuanqi — pairs with /calculator, with the calculator itself on the page,
 * in Chinese. HomeCalculator takes its language as a prop and carries literal
 * copy, so the tool prerenders in Chinese. The tool comes first and the
 * explanations after it, the order the page is used in. Same seed as the English
 * and Vietnamese pages, which say up front that the opening figures are examples.
 */
const SEED: CalculatorSeed = {
  price: 800_000,
  annualTaxes: 9_000,
  taxSource: { from: 'example' },
  monthlyHoa: 0,
  hoaSource: 'example',
  propType: 'SF',
  rentLookup: null,
  exampleRent: 3_500,
  views: ['live', 'invest', 'sell'],
};

const ZhCalculator = () => (
  <ZhPage
    path="/zh/jisuanqi"
    seo={{
      title: '麻州房贷、出租和卖房计算器（中文）',
      description:
        '用中文算出麻州房子每月的真实费用、出租的现金流，以及卖房后实际拿到的金额，包括麻州地契税和贷款保险（PMI）。',
      keywords: '麻州 房贷 计算器, 月供 计算, 卖房 到手 金额, 地契税 麻州, 出租 回报 计算, PMI',
    }}
    eyebrow="计算器"
    h1="房贷、出租和卖房计算器"
    lede="算一算房子每月要花多少钱、出租能带来多少收入，以及卖房后您实际拿到多少，并包括一般计算器忽略的麻州费用。计算器下面解释了每个数字。"
    hero={{
      image:
        'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1600&q=65',
      alt: '桌上的购房文件',
    }}
    heroSize="standard"
    faqHeading="关于费用的常见问题"
    faqs={[
      {
        question: '月供包括哪些部分？',
        answer:
          '通常是四部分，简称 PITI：本金（Principal）、利息（Interest）、房产税（Taxes）和房屋保险（Insurance）。首付不到 20% 要加贷款保险（PMI），有业主协会要加物业费（HOA）。只显示本金和利息的计算器，得出的数字比实际低不少。',
      },
      {
        question: '除了首付还要准备多少现金？',
        answer:
          '麻州的过户费用通常是购买价的 2–5%，包括贷款费用、银行估价费、律师费、产权调查和产权保险、登记费、预付利息，以及存入 escrow 账户的钱。同样重要的是，过户之后还要留有备用金，因为老房子第一年总会有事情。',
      },
      {
        question: 'PMI 是什么？什么时候能取消？',
        answer:
          'PMI 保护的是贷款机构，不是您，首付不到 20% 时通常必须购买。常规贷款在您的净值达到规定水平后可以申请取消。FHA 贷款规则不同，很多情况下保险费会持续整个贷款期，选贷款之前请问清楚。',
      },
      {
        question: 'Escrow 是什么？',
        answer:
          '这是贷款机构持有的账户，用来代您支付房产税和房屋保险。您每月随贷款多存一部分进去。城镇房产税上涨时，即使贷款利率没变，您的月供也会增加。这就是明年的月供可能和今年不同的原因。',
      },
      {
        question: '房产税影响有多大？',
        answer:
          '比大多数买家预想的要大。麻州每个城镇按每 $1,000 估税价值自行制定税率，同样价位的房子，相邻两个镇每年可能差几千美元。请一定问清这套房子当年的真实税额，不要估算。',
      },
    ]}
    cta={{
      heading: '想知道您的真实数字？',
      body: '把您考虑的价位和城镇告诉 Maggie。她可以帮您算出包括当地房产税在内的每月费用。',
      button: '联系 Maggie',
    }}
    enLabel="The mortgage, rental and seller proceeds calculator"
    width="wide"
    sections={
      <>
        <h2 className="text-2xl font-semibold text-ink">用您的数字算一算</h2>
        <div className="mt-5">
          <HomeCalculator lang="zh" context="general" seed={SEED} />
        </div>

        <ProseBody className="mt-8">
          <h2>月供的四个部分</h2>
          <p>
            <strong>本金和利息。</strong>
            如果您选择固定利率，这是唯一固定不变的部分，所有计算器都会显示。
          </p>
          <p>
            <strong>房产税。</strong>
            由城镇制定，每年变化。在大波士顿，这通常是仅次于利息的第二大开支。
          </p>
          <p>
            <strong>房屋保险。</strong>
            贷款机构要求必须有。靠近海边或在洪水区的房子可能还需要洪水保险，这笔钱不小。
          </p>
          <p>
            <strong>贷款保险（PMI），首付不到 20% 时。</strong>
            这项保险保护的是贷款机构，不是您。
          </p>

          <h2>首次购房者容易忘记的费用</h2>
          <ul>
            <li>律师费：在麻州这几乎是必需的，不是可选项。</li>
            <li>验房费，以及氡气、地下油罐等专项检查。</li>
            <li>首次存入 escrow 的钱，通常是几个月的房产税和保险。</li>
            <li>在契约登记处（Registry of Deeds）的登记费。</li>
            <li>买 condo 的物业费，以及大楼大修时的特别摊派。</li>
            <li>过户后的备用金。1940 年以前的房子第一年总会有事情。</li>
          </ul>

          <h2>出价之前要问哪些数字</h2>
          <p>
            针对这套房子问三个具体数字：当年的房产税、每月的物业费（如有），以及一个冬天的取暖费估算。
            这三个数字不在任何计算器里，却决定这套房子是否在您的能力范围内。完整流程请看
            <Link to="/zh/goufang">购房指南</Link>。
          </p>

          <h2>卖房时实际能拿到多少？</h2>
          <p>
            售价和您拿到的钱是两个不同的数字。从售价中减去经纪佣金、麻州地契税（每 $500 售价 $2.28，由卖方支付）、
            律师费和其他过户费用、验房后的修缮或补贴，再减去尚欠的贷款。最后的数字才是计算下一套房子时应该用的数字。
            如果您想知道售价应该是多少，请从<Link to="/zh/gujia">房屋估价</Link>开始。
          </p>
        </ProseBody>
      </>
    }
  />
);

export default ZhCalculator;
