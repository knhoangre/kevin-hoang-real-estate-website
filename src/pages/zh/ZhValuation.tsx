import { Link } from 'react-router-dom';
import ZhPage from '@/components/ZhPage';
import { service } from '@/lib/schema';
import { CHINESE_PARTNER } from '@/lib/siteConfig';

/**
 * /zh/gujia — the home valuation page in Chinese. Pairs with /home-valuation, and
 * like it must not contradict the point of the page: an automated estimate cannot
 * see condition.
 */
const ZhValuation = () => (
  <ZhPage
    path="/zh/gujia"
    seo={{
      title: '大波士顿免费房屋估价：书面报告，中文讲解',
      description:
        '想知道您在大波士顿的房子值多少钱？一份免费的书面估价，基于附近同类成交和实地查看，不是自动算出来的数字，可以用中文讲解。',
      keywords: '房屋估价 波士顿, 我的房子值多少钱, 免费 估价 麻州, 比较市场分析, Zillow 估价 准吗, home valuation Boston Chinese',
    }}
    jsonLd={[
      service({
        name: '免费书面房屋估价',
        serviceType: 'Property valuation',
        description: '根据附近同类成交和实地查看准备的书面估价，可以用中文讲解。',
        path: '/zh/gujia',
        provider: CHINESE_PARTNER.agentId,
      }),
    ]}
    eyebrow="房屋估价"
    h1="您的房子值多少钱？"
    lede="根据您附近最近的同类成交和实地查看，为您准备一份书面估价。免费，也不要求您一定要挂牌出售。这是认真的分析，不是网站自动算出来的数字。"
    hero={{
      image:
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=70',
      alt: '从前院小路看到的一栋麻州独栋住宅',
    }}
    faqHeading="关于房屋估价的问题"
    faqs={[
      {
        question: '房屋估价要多少钱？',
        answer:
          '不收费。经纪人提供的估价是比较市场分析（CMA），是经纪人为争取挂牌机会提供的免费服务。它不是银行估价（appraisal）：银行估价由贷款机构委托持牌估价师完成，通常要几百美元。',
      },
      {
        question: '网上的房屋估价准吗？',
        answer:
          '只能作为起点。自动估价依据的是公开记录和过去的成交，所以看不到最影响价格的因素：房屋状况、格局、厨房和浴室的实际样子、院子的朝向、路上的噪音，或者您没有申请许可做的装修。遇到不常见的房子，误差可能很大，高低都有可能。',
      },
      {
        question: '估价需要我提供什么？',
        answer:
          '有地址就可以开始。除此之外，有用的是公开记录上看不到的信息：您做过哪些工程和大概的时间、已知的问题、是否有租客，以及您的时间安排。实地看一次，大约二十分钟，会让估价明显更可靠。',
      },
      {
        question: '做了估价就必须挂牌吗？',
        answer:
          '不必。很多人做估价时还在考虑要不要搬家，或者是在重新贷款、处理遗产，或者只是因为邻居卖了房子而好奇。估价不附带任何挂牌协议。',
      },
      {
        question: '多久估价一次比较合适？',
        answer:
          '如果您没有卖房的打算，一两年一次就足够了解情况。如果您打算在六个月左右挂牌，请在这段时间一开始就做，这样还来得及根据结果安排修缮、时间和准备工作。',
      },
    ]}
    cta={{
      heading: '申请您的房屋估价',
      body: '把地址和房子的一些情况发给 Maggie，您会收到一份书面估价，并附上所依据的同类成交。',
      button: '申请估价',
    }}
    enLabel="Request a free written home valuation"
  >
    <h2>房子的价值到底是怎么决定的？</h2>
    <p>
      取决于买家最近为附近同类房屋实际付了多少钱，而不是您当初买的价格，不是您在装修上花了多少，
      也不是您需要拿回多少。这是定价之前最需要接受的一点，也是估价要从同类成交开始、而不是从公式开始的原因。
    </p>
    <p>比较市场分析会考虑三组房屋：</p>
    <ul>
      <li>
        <strong>最近成交的房屋：</strong>同类房屋实际的成交价，这是其他一切的基准。
      </li>
      <li>
        <strong>正在挂牌的房屋：</strong>如果您现在挂牌，要和哪些房子竞争。
      </li>
      <li>
        <strong>过期和撤牌的房屋：</strong>市场已经拒绝过的价格，往往是三组中最有参考价值的。
      </li>
    </ul>
    <p>然后针对真正重要的差异调整每个可比成交：面积、地块、状况、格局、停车，以及成交时间的远近。</p>

    <h2>为什么自动估价只是一个起点</h2>
    <p>
      自动估价模型依据的是估税记录和过去的交易。它看不到房屋状况，而状况往往是影响价格最大的单一因素。
      公开记录完全相同的两栋房子，同样的年份、面积和地块，您走进去看过之后，可能发现价格差距很大。
    </p>
    <p>
      遇到不典型的情况它也很难处理：多户住宅、形状特殊的地块、扩建过的房子，以及最近成交很少的街区。
    </p>

    <h2>您会收到什么</h2>
    <ul>
      <li>一个有依据的价格范围，以及背后的理由。</li>
      <li>所用的具体同类成交，方便您自己核对。</li>
      <li>在您这个价位，目前哪些房子卖得动，哪些卖不动。</li>
      <li>哪些修缮或准备工作可能带来超过成本的回报，哪些不会。</li>
    </ul>

    <h2>什么时候做估价最合适？</h2>
    <p>
      比大多数人想的更早。如果您考虑在一年内卖房，现在做一次估价，就能知道哪些工程值得开始，哪些不值得。
      钱花出去之后，这个决定就很难挽回了。重新贷款、处理遗产，或者附近有房子成交之后想重新评估时，也值得做一次。
    </p>
    <p>
      有了估价之后，<Link to="/zh/shoufang">售房指南</Link>讲准备、营销和议价，
      <Link to="/zh/jisuanqi">计算器</Link>可以帮您算出卖房后实际拿到的金额。
    </p>

    <h2>估价和房产税有关系吗？</h2>
    <p>
      城镇的估税价值（assessed value）和市场价值不是一回事，不应该用一个去推断另一个。
      城镇是按记录批量估税的，总是落后于市场。如果您认为城镇记录中关于您房子的信息有误，
      大多数城镇申请更正的截止日期是 2 月 1 日，错过了就要再等一整年。
    </p>
  </ZhPage>
);

export default ZhValuation;
