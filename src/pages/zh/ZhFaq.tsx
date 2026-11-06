import { Link } from 'react-router-dom';
import ZhPage from '@/components/ZhPage';
import { CHINESE_PARTNER, SITE } from '@/lib/siteConfig';

/**
 * /zh/changjian-wenti — the FAQ in Chinese. Pairs with /faq.
 *
 * The questions and the facts come from /faq and /vi/cau-hoi-thuong-gap. WHAT IS
 * NOT CARRIED ACROSS is deliberate, because a translation would have made a claim:
 *
 *   - /faq's answers about how "we" work (a secure showing system, a buyer
 *     database, daily MLS analysis). Those describe Kevin's practice, and printed
 *     here they would be statements about Maggie's that nobody has checked.
 *   - "a personal letter to the seller" as a way to win. Love letters are a
 *     fair-housing problem, and "neighborhood safety" as a thing to judge.
 *   - "real estate commission (usually 5-6%)". There is no standard rate since the
 *     2024 NAR settlement; the answer says it is negotiated.
 *   - "minimizing contingencies" without saying which: no answer here may suggest
 *     waiving an inspection (760 CMR 74.00).
 */
const ZhFaq = () => (
  <ZhPage
    path="/zh/changjian-wenti"
    seo={{
      title: '麻州买房卖房常见问题：要约、定金、房产税和律师',
      description:
        '用中文回答在麻州买卖房屋最常见的问题：两份合同、定金、房产税、化粪池、含铅油漆、律师，以及非美国公民能否买房。',
      keywords: '麻州 买房 问题, 美国 买房 常见问题, 外国人 在美国 买房, 非公民 买房 麻州, 定金 退还, 房产税 麻州',
    }}
    eyebrow="常见问题"
    h1="关于麻州房地产，大家最常问的问题"
    lede="下面是大家最常问的问题。很多问题在麻州法律中都有明确的规定。"
    hero={{
      image:
        'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=70',
      alt: '办公桌上的购房文件',
    }}
    heroSize="standard"
    faqGroups={[
      {
        heading: '一般问题',
        faqs: [
          {
            question: '非美国公民可以在麻州买房吗？',
            answer:
              '可以。麻州对房产所有权没有国籍限制。比较难的通常是贷款：每家贷款机构对居留身份、美国信用记录和首付的要求都不同。请在看房之前先问清楚贷款机构。',
          },
          {
            question: '买方经纪和卖方经纪有什么区别？',
            answer:
              '买方经纪代表买家，帮助找房、争取价格和条款，并协助处理验房和过户。卖方经纪（listing agent）代表卖家，负责营销、定价建议，并为卖家争取最有利的条款。在麻州，经纪人必须披露自己在交易中代表谁。',
          },
          {
            question: '一定要请律师吗？',
            answer:
              '在麻州，买卖房屋请房地产律师既常见也值得。和有些州不同，这里的过户通常由律师而不是产权公司处理。律师会审查买卖合同、调查产权、解决法律问题，并确保文件正确准备和登记。贷款机构也有自己的律师，但那位律师保护的是贷款机构，不是您。请在提交第一份要约之前就请好自己的律师。',
          },
          {
            question: '2024 年 8 月之后，买家有什么变化？',
            answer:
              '买家必须在经纪人带看房之前签署书面代理协议，报酬要写在协议中，而不是默认来自 MLS。也就是说，买方经纪的费用现在是可以协商的。签字之前请看清楚期限和范围。',
          },
          {
            question: '我可以全程用中文吗？',
            answer: `和 ${CHINESE_PARTNER.name} 合作时，看房、议价和解释条款都可以用普通话。法律文件仍是英文，而且有约束力，所以真正要做的是确保您在签字前清楚自己签的是什么。电话：${CHINESE_PARTNER.phone}。`,
          },
          {
            question: '应该选哪个城镇？',
            answer:
              '先看通勤，再看镇名。在您实际上班的时间开车试一次，从房子走到火车站并计时，再确认这个具体地址属于哪个学校：很多城镇有多个学区范围，Newton（牛顿）有两所高中。',
          },
          {
            question: '如果交易没能按计划过户怎么办？',
            answer:
              '可能出现的问题包括验房发现问题、贷款出现状况或产权有疑问。关键是合同中的期限和保护条款：在期限内，您通常还有选择；错过期限又没有书面延期，就可能有损失。遇到问题请立即告诉您的律师和经纪人。',
          },
          {
            question: '租房要准备多少钱？',
            answer:
              '根据麻州法律，房东在起租时只能收四项：第一个月租金、最后一个月租金、不超过一个月的押金，以及换锁费。但中介费不在此限，通常相当于一个月租金，所以要准备的钱可能达到四个月的租金。',
          },
        ],
      },
      {
        heading: '卖家问题',
        faqs: [
          {
            question: '在波士顿一带卖房通常要多久？',
            answer:
              '取决于市场、房屋类型、地点和定价。从签买卖合同到过户通常是 30 到 45 天。定价合理的房子通常比定价过高的卖得快得多。',
          },
          {
            question: '挂牌价格是怎么定的？',
            answer:
              '通过比较市场分析（CMA）：看同类房屋最近的成交、目前的市场情况、您房子的特点和改良，以及地段优势。目标是定出能吸引认真买家、同时又能争取最好回报的价格。',
          },
          {
            question: '卖房要花哪些钱？',
            answer:
              '包括经纪佣金（可以协商，写在您的挂牌协议中）、麻州地契税（每 $500 售价 $2.28，由卖方支付）、律师费、验房后可能的修缮或补贴、搬家费，以及还清现有贷款。卖房前可以用计算器估算实际拿到的金额。',
          },
          {
            question: '挂牌前要先修房子吗？',
            answer:
              '取决于问题的类型和程度。一般来说，结构问题、安全隐患和明显的外观问题值得先处理，因为它们会吓跑买家或明显影响价值。小问题可以考虑修或者在价格上体现，按成本和回报排优先级。',
          },
          {
            question: '验房发现问题怎么办？',
            answer:
              '先判断问题有多严重。常见的做法是请承包商报价，再和买方协商修缮或补贴。重要的是分清小问题和可能影响交易的重大问题。',
          },
          {
            question: '房子一直卖不掉怎么办？',
            answer:
              '如果在预期时间内没有出价，就要重新评估：调整价格、加强营销、做一些额外的改善，或考虑其他出售方式。看房后的反馈和最新的市场数据是做这些决定的依据。',
          },
          {
            question: '卖房的税务影响是什么？',
            answer:
              '取决于您持有多久、是否是主要住所，以及做过哪些资本改良。一般来说，如果过去五年中有两年以上是主要住所，单身可免 $250,000、夫妻可免 $500,000 的资本利得（IRS，2026 年）。您的具体情况请咨询税务专业人士。',
          },
        ],
      },
      {
        heading: '买家问题',
        faqs: [
          {
            question: '定金会因为我改变主意而损失吗？',
            answer:
              '有可能。这完全取决于合同中的保护条款，以及您是否还在期限内。在验房期限内退出，通常可以拿回。如果错过贷款承诺期限又没有书面延期，这笔钱就有风险，通常是购买价的 5%。',
          },
          {
            question: '为什么相邻两个镇的房产税差这么多？',
            answer:
              '因为税率不是由市场决定的，而是由预算决定的。城镇决定要收多少钱，再除以全镇的总估税价值，得出税率。高价值房屋多的城镇，可以用较低的税率收到同样多的钱。不要比较税率，要比较具体地址的真实税单。',
          },
          {
            question: '化粪池（septic）是什么？为什么重要？',
            answer:
              '很多郊区的房子没有接市政下水道，而是就地处理污水。麻州 Title 5 法规要求大多数情况下卖家在出售前检查系统。不合格的系统更换可能要花几万美元，所以这件事要在签字之前弄清楚，不能等到之后。',
          },
          {
            question: '1978 年以前的房子有含铅油漆怎么办？',
            answer:
              '联邦法律要求卖家披露所知道的情况，并提供 EPA 的资料。麻州法律对出租房更严格：如果有六岁以下的孩子居住，房东必须处理含铅风险，而且这是严格责任，即使房东不知道有铅也要负责。',
          },
          {
            question: '怎样申请贷款预批？',
            answer:
              '联系贷款机构，提供收入证明、工作证明、信用记录和银行对账单。贷款机构审核后确定愿意借给您多少。预批信要在出价之前拿到。',
          },
          {
            question: '出价应该包含哪些附加条件？',
            answer:
              '常见的有贷款、验房，以及出售现有房屋。具体包含哪些取决于您的情况和这套房子。这些条件是保护您的工具，放弃之前要清楚后果，并先问律师。注意：麻州法规禁止卖家和卖方经纪以放弃验房作为接受出价的条件。',
          },
          {
            question: '过户费用大概多少？',
            answer:
              '通常是购买价的 2% 到 5%，包括贷款费用、产权保险、律师费、预付房产税和 escrow 存款。签约前可以向贷款机构要一份估算表（Loan Estimate）。',
          },
          {
            question: '多人竞价时怎么办？',
            answer:
              '在波士顿这样的市场，多人竞价很常见。除了价格，条款也会起作用，例如更灵活的过户日期、更多的定金，或者在提交要约前先验房。每种做法都有利弊，要根据您的目标和能承受的风险来决定。不要写私人信件给卖家：这会带来公平住房方面的问题。',
          },
        ],
      },
    ]}
    cta={{
      heading: '没有找到您的问题？',
      body: '打电话、发短信或发微信给 Maggie。再简单的问题都可以问，事先问清楚，总比事后补救好。',
      button: '问 Maggie',
    }}
    enLabel="Frequently asked questions"
  >
    <h2>最需要先知道的三件事</h2>
    <p>
      <strong>第一，麻州用两份合同。</strong>
      先是购房要约（Offer to Purchase），大约十到十四天后是买卖合同（Purchase and Sale Agreement）。
      两份都有约束力。买家的大部分麻烦都出现在这两份文件之间。
    </p>
    <p>
      <strong>第二，所有期限都从签要约那一刻开始计时。</strong>
      验房期限、贷款承诺期限。错过其中之一又没有书面延期，就可能失去定金。
    </p>
    <p>
      <strong>第三，这里的交易实际上离不开律师。</strong>
      请在提交第一份要约之前就请好自己的律师，而不是等到 P&amp;S 寄来。
    </p>

    <h2>继续阅读</h2>
    <ul>
      <li>
        <Link to="/zh/goufang">一步一步的购房指南</Link>
      </li>
      <li>
        <Link to="/zh/shoufang">售房指南和必备文件</Link>
      </li>
      <li>
        <Link to="/zh/gujia">免费房屋估价</Link>
      </li>
      <li>
        <Link to="/zh/quyu">{SITE.areaServed.length} 个城镇的指南</Link>
      </li>
    </ul>
  </ZhPage>
);

export default ZhFaq;
