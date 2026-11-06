import { Link } from 'react-router-dom';
import ZhPage from '@/components/ZhPage';
import { CHINESE_PARTNER } from '@/lib/siteConfig';

/**
 * /zh/zhongwen-fuwu — what working in Chinese actually covers. Pairs with
 * /chinese-speaking-real-estate-agent, as /vi/dich-vu-tieng-viet pairs with the
 * Vietnamese-language page.
 *
 * /zh answers "who"; this answers "what does it cover". They may not share a
 * heading, or they compete for one query and neither ranks.
 *
 * Mandarin only: nothing records that she speaks Cantonese, so 粤语 is not claimed.
 */
const ZhServices = () => (
  <ZhPage
    path="/zh/zhongwen-fuwu"
    seo={{
      title: '用中文在麻州买卖房屋：哪些环节可以用中文',
      description:
        '在麻州用中文买房或卖房，哪些文件可以解释，语言在什么时候最重要，法律文件为什么仍是英文，以及海外买家要注意什么。',
      keywords: '麻州 中文 买房, 波士顿 中文 地产, 中文 房地产 服务, 普通话 地产经纪, 海外 买家 波士顿',
    }}
    eyebrow="中文服务"
    h1="用中文买卖房屋，从第一次看房到签字"
    lede={`${CHINESE_PARTNER.name} 用普通话和英文与买家和卖家合作。每一份文件在您签字之前，都可以用您最习惯的语言讲解清楚。合同本身仍是英文。`}
    hero={{
      image:
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1920&q=70',
      alt: '黄昏时分大波士顿的一栋新英格兰风格住宅',
    }}
    faqHeading="关于中文服务的问题"
    faqs={[
      {
        question: '哪些文件可以用中文解释？',
        answer:
          '交易中您需要阅读或签署的所有文件：购房要约、买卖合同（P&S）、验房报告、贷款估算表（Loan Estimate）、过户披露表（Closing Disclosure），以及含铅油漆披露等法定文件。文件本身仍是英文，解释是用中文，在您签字之前完成。',
      },
      {
        question: '第一次在美国买房，有什么不同？',
        answer:
          '第一次在美国买房的人，通常会对三件事感到意外：贷款预批（pre-approval）重要到几乎没有它就无法出价；验房报告是议价的工具，不只是手续；交易的大部分环节都要经过律师，这在麻州很正常。这些都不难，只是需要有人从头带您走一遍。',
      },
      {
        question: '和父母或子女一起买房，要注意什么？',
        answer:
          '要提前想好几个实际问题：产权怎么登记，谁的名字上贷款，两户住宅或带独立小公寓（in-law）的房子是否比独栋更合适。这些问题最好在开始看房之前讨论，而不是找到房子之后。',
      },
      {
        question: '讲粤语或其他方言可以吗？',
        answer:
          'Maggie 的工作语言是普通话和英文。如果您更习惯其他语言或方言，请先联系她说明情况，她会告诉您怎样安排最合适。',
      },
    ]}
    cta={{
      heading: '用您习惯的语言开始',
      body: '打电话、发短信、发邮件或微信，用中文或英文都可以。咨询免费，没有任何压力。',
      button: '联系 Maggie',
    }}
    enLabel="Chinese-speaking real estate service in Greater Boston"
  >
    <h2>什么时候最需要用母语沟通？</h2>
    <p>
      不是看房的时候，而是下面这几个环节：一旦理解有误，代价很高，而且很难挽回。
    </p>
    <ul>
      <li>
        <strong>出价。</strong>
        附加条件、期限和定金才是您真正在承诺的内容。为了赢得竞争而放弃某个条件，应该是您清楚后果才做的决定。
      </li>
      <li>
        <strong>验房报告。</strong>
        验房报告往往有几十页，列出房子的各种问题，其中大部分都很常见。关键是看清哪几项值得重新议价。
      </li>
      <li>
        <strong>贷款。</strong>
        利率、点数（points）、escrow 和贷款保险相互影响，月供不是唯一要看的数字。
      </li>
      <li>
        <strong>披露文件。</strong>
        在麻州，1978 年以前建造的房子必须披露含铅油漆，而这些城镇的房子有很大一部分都属于这一类。
      </li>
    </ul>
    <p>用中文讨论这些内容，您才能把真正想问的问题问清楚。</p>

    <h2>哪些可以用中文，哪些不可以？</h2>
    <ul>
      <li>
        <strong>普通话或英文，由您选择：</strong>
        咨询、看房、了解各个社区、出价策略、议价，以及在您签字前讲解每份文件的含义。
      </li>
      <li>
        <strong>只有英文：</strong>
        法律文件本身。麻州的买卖合同、披露文件和过户文件都以英文签署。
      </li>
      <li>
        <strong>需要其他专业人士时：</strong>
        Maggie 可以为您介绍贷款机构、房地产律师和税务顾问，其中也有讲普通话的。
      </li>
    </ul>

    <h2>从海外买房或搬到大波士顿</h2>
    <p>
      海外和外州买家遇到的问题和本地人不同。房源很容易找到，难的是知道哪个城镇适合自己、
      学校之间实际有什么差别、通勤到底要多久，以及人不在现场时怎样完成交易。
    </p>
    <p>
      Maggie 可以安排视频看房，代您参加看房和验房，并及早提醒您哪些环节在海外办理会花更长时间，
      例如贷款、资金转账、身份证明和时间安排，好让您有时间提前规划。
      <Link to="/zh/quyu">城镇指南</Link>能帮您在列清单之前先了解情况，
      <Link to="/zh/goufang">购房指南</Link>则把整个流程从头到尾讲一遍。
    </p>

    <h2>第一次在美国买房</h2>
    <p>
      麻州的流程和很多人想象的有些不同，尤其是律师的作用和验房的分量。这些都不难，
      但如果一开始就有人把整个流程讲清楚，后面就不用被期限追着跑。
      <Link to="/zh/shouci-goufang">首次购房指南</Link>讲了完整的路径，
      <Link to="/zh/jisuanqi">计算器</Link>能显示某个价位每月的真实费用。
    </p>

    <h2>如果您要卖房</h2>
    <p>
      可以从一份<Link to="/zh/gujia">书面房屋估价</Link>开始，同样可以用中文讲解。
    </p>
  </ZhPage>
);

export default ZhServices;
