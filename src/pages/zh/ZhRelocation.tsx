import { Link } from 'react-router-dom';
import ZhPage from '@/components/ZhPage';

/**
 * /zh/banjia-mazhou — pairs with /relocation.
 *
 * The English page owns the CT -> MA axis and rests on Kevin having made that move
 * himself. Neither carries to Maggie, and a Chinese reader relocating here is at
 * least as likely to arrive from another state or from abroad. So this keeps what
 * applies from anywhere: town first, the tax and licence mechanics, and timing two
 * transactions. Like /vi/chuyen-den-massachusetts, every statutory figure carries
 * its year and points at the agency that publishes it.
 *
 * The English FAQ's line naming the strongest school districts is left out: a
 * ranking of schools is not something these pages state.
 */
const ZhRelocation = () => (
  <ZhPage
    path="/zh/banjia-mazhou"
    seo={{
      title: '搬到麻州：选城镇、税务、驾照和保险指南',
      description:
        '从外州或海外搬到麻州要知道什么：怎样选城镇，州所得税和房产税，换驾照和车辆登记的顺序，必须购买的医疗保险，以及卖旧房买新房的时间安排。',
      keywords: '搬到波士顿, 搬到麻州, 麻州 驾照, 麻州 医疗保险, 麻州 所得税, 波士顿 选房 城镇, moving to Massachusetts Chinese',
    }}
    eyebrow="搬到麻州"
    h1="搬到麻州，先搞清楚这些事"
    lede="搬到另一个州不只是找房子。麻州有几项自己的规定：必须有医疗保险、换驾照有期限、房产税按城镇计算。提前知道，比事后才知道要省钱得多。"
    hero={{
      image:
        'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?auto=format&fit=crop&w=1920&q=70',
      alt: '秋天白色栅栏后的一栋新英格兰白色木屋',
    }}
    faqHeading="搬家最常见的问题"
    faqs={[
      {
        question: '要多久换麻州驾照？',
        answer:
          '麻州要求新居民在确立居住地后的一定期限内换成本州驾照。期限和所需文件由 RMV（Registry of Motor Vehicles）规定，并且会变化，请直接查 mass.gov/rmv，不要相信听来的数字。请提前预约，到现场排队通常很久。',
      },
      {
        question: '医疗保险是强制的吗？',
        answer:
          '是的。麻州要求成年居民持有符合标准的医疗保险，并在州报税表上申报。这一点和大多数州不同。官方信息可以在 Massachusetts Health Connector 查到。',
      },
      {
        question: '这里的房产税怎么算？',
        answer:
          '每个城镇按每 $1,000 估税价值自行制定税率，相邻城镇之间差别可能很大。同样价格的两套房子，在两个不同的城镇，每年的税可能差几千美元。麻州税务局（DOR）每年公布各城镇的税率。',
      },
      {
        question: '应该先租还是直接买？',
        answer:
          '如果您从来没有在这里住过，先租六个月到一年往往是好决定。波士顿一带的通勤距离和地图给人的印象很不一样，一个城镇在二月和六月给人的感觉也完全不同。',
      },
      {
        question: '搬家那年要在两个州报税吗？',
        answer:
          '通常要：一份报在旧州居住的部分，一份报在麻州居住的部分。收入分配规则比较复杂，因人而异。如果搬家那年要卖房或有大笔收入，请提前咨询报税师。',
      },
    ]}
    cta={{
      heading: '还不知道从哪个城镇开始？',
      body: '告诉 Maggie 您在哪里工作，预算大概多少。她会告诉您哪些城镇实际上在您的范围内，以及每个地方要取舍什么。',
      button: '联系 Maggie',
    }}
    enLabel="Relocating to Massachusetts"
  >
    <h2>先选城镇，再选房子</h2>
    <p>
      搬家时最容易犯的大错，就是先看房子。您看中一套，买了下来，之后才发现二月份的通勤是什么样子，
      这条街属于哪所小学，以及镇中心是不是您真的会走路去的地方。
    </p>
    <p>
      麻州的城镇之间差别很大，而这些差别在房源网站上看不出来。相距十五分钟的两栋房子，
      可能税单差很多，早上八点的通勤差四十分钟。看房之前，花一小时先读三四份
      <Link to="/zh/quyu">城镇指南</Link>，是整个搬家过程中最值得做的事。
    </p>

    <h2>税务：要比较哪些数字</h2>
    <p>
      <strong>州所得税。</strong>
      麻州对大部分收入按 5% 的统一税率征税，收入超过法定门槛的部分另加 4% 附加税（2023 年起）。
      最新数字由麻州税务局（DOR）公布，请到 mass.gov 查询，不要依赖旧文章。
    </p>
    <p>
      <strong>房产税。</strong>
      这是比较两套房子时最容易漏掉的数字。税率由每个城镇按每 $1,000 估税价值制定，并且每年重新确定，
      所以“全州平均税率”并不能告诉您税单是多少。请查您要比较的具体城镇，再乘以您实际会付的房价。
      出价之前，请问清这套房子当年真实的税额。
    </p>
    <p>
      <strong>车辆消费税。</strong>
      麻州每年按城镇收取车辆消费税（motor vehicle excise），还要做一年一次的安全和排放检查。
      第一张账单往往在新居民没有预料的时候寄到。
    </p>

    <h2>大波士顿的三类选择</h2>
    <ul>
      <li>
        <strong>128 号公路以内。</strong>
        Newton（牛顿）、Brookline（布鲁克莱恩）、Belmont（贝尔蒙特）、Waltham（沃尔瑟姆）。
        通勤最短，镇中心最适合步行，每平方英尺价格最高，房子也最老。
      </li>
      <li>
        <strong>128 到 495 号公路之间。</strong>
        Needham（尼德姆）、Wellesley（韦尔斯利）、Lexington（列克星敦）、Winchester（温彻斯特）、
        Concord（康科德）。典型的取舍：同样的钱能买到更多土地和更大的房子，有通勤火车到波士顿。
      </li>
      <li>
        <strong>波士顿南边和北边。</strong>
        Quincy（昆西）、Braintree（布伦特里）、Medford（梅德福）、Malden（莫尔登）。
        价格相对较低，有红线和橙线地铁。
      </li>
    </ul>

    <h2>卖旧房和买新房的时间安排</h2>
    <p>
      这是搬家时最让人头疼的部分，最好提前决定，不要等到有压力时才决定。两边的市场不会同步，
      想在同一天完成两边过户，很少像听起来那么顺利。
    </p>
    <ol>
      <li>
        <strong>先卖后买。</strong>
        这样您在麻州出价时最有优势，但中间可能需要回租（rent-back）或短租。
      </li>
      <li>
        <strong>先买后卖。</strong>
        过程最轻松，但如果旧房卖得慢，成本也最高。只有确实能同时负担两套房才现实。
      </li>
      <li>
        <strong>附带卖房条件的出价。</strong>
        成本最低，但在竞争激烈的麻州市场也是最弱的出价。有些卖家根本不考虑。
      </li>
      <li>
        <strong>过桥贷款。</strong>
        花钱买时间。先算清自己的房屋净值，再问清费用，看是否划算。
      </li>
    </ol>
    <p>
      选哪一种，取决于您的房屋净值，以及能否承受其中一边延误。请在旧房挂牌之前想好，不要等到麻州这边的出价已被接受。
      <Link to="/zh/goufang">购房指南</Link>讲了麻州的完整购房顺序，
      <Link to="/zh/jisuanqi">计算器</Link>能显示某个价位加上麻州的税和保险后每月要花多少。
    </p>

    <h2>行政手续，按顺序办</h2>
    <p>这些都不难，按清单办就行。问题往往出在临近期限才发现。</p>
    <ul>
      <li>
        <strong>先预约 RMV。</strong>
        搬家之前就预约，不要等到之后。名额往往要排几周，而其他几乎所有事情都要等麻州驾照。
      </li>
      <li>
        <strong>先买保险，再登记车辆。</strong>
        麻州要求车辆登记申请上有麻州持牌保险代理的盖章，外州的保单不行。
      </li>
      <li>
        <strong>然后登记，然后验车。</strong>
        安全和排放检查要在登记后的短时间内完成。
      </li>
      <li>
        <strong>孩子入学。</strong>
        各学区有自己的注册时间和文件要求：居住证明、疫苗记录、之前的成绩单。一签约就联系学区，不要等到过户之后。
      </li>
      <li>
        <strong>到市政厅登记。</strong>
        这听起来是小事，但会影响投票权、停车许可和一些房产税减免。
      </li>
    </ul>
    <p>
      请向麻州 RMV 和您要搬去的城镇确认最新的文件清单：要求会变化，只有官方网站才是最新版本。
    </p>

    <h2>这里的房子有什么不同</h2>
    <p>
      这一带的房子大多建于 1940 年以前。这意味着电线可能老旧，可能还有地下油罐，1978 年以前的房子含铅油漆很常见，
      地下室渗水也是普遍问题。这些都不是避开的理由，但都是认真验房的理由。
    </p>

    <p className="text-sm text-gray-500">
      税务和登记要求按 2026 年的情况描述，并且会变化。具体规定以麻州税务局和麻州 RMV 公布的为准。
      这是一般性信息，不是税务或法律建议。
    </p>
  </ZhPage>
);

export default ZhRelocation;
