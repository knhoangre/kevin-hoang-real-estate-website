import { Link } from 'react-router-dom';
import ZhPage from '@/components/ZhPage';
import { service } from '@/lib/schema';
import { CHINESE_PARTNER, SITE } from '@/lib/siteConfig';

/**
 * /zh — the Chinese entry point.
 *
 * Answers two things in its first lines: who a Chinese-speaking reader would be
 * working with, and what they can do here. Kevin's homepage is about Kevin; this
 * one cannot be a translation of it, because he is not who the reader would hire.
 *
 * These pages talk about language, never ethnicity, and never say which towns a
 * given community lives in. That is steering under fair-housing law. There is no
 * "everyone is welcome" paragraph or "does she only serve Chinese speakers?"
 * question any more: Maggie read them on 2026-10-31 and found them strange, and the
 * footer's 公平住房机会 (Equal Housing Opportunity) line is how a real estate page
 * says it.
 */
const ZhHome = () => (
  <ZhPage
    path="/zh"
    seo={{
      title: '波士顿中文地产经纪 Maggie Li | 大波士顿买房卖房',
      description: `需要用中文在大波士顿买房或卖房？${CHINESE_PARTNER.name}（${CHINESE_PARTNER.brokerage}）用普通话和英文服务 Newton 等 ${SITE.areaServed.length} 个城镇，提供购房、售房和免费估价。`,
      keywords:
        '波士顿 地产经纪, 波士顿 买房, 麻州 买房, 牛顿 房地产, 大波士顿 中文 经纪人, Maggie Li, Chinese speaking realtor Boston, Mandarin real estate agent Newton',
    }}
    eyebrow="中文"
    crumbs={[{ name: '首页', path: '/zh' }]}
    h1="大波士顿地区的中文房地产服务"
    lede={`${CHINESE_PARTNER.name} 是 ${CHINESE_PARTNER.brokerage} 的房地产经纪人，办公室位于 Newton（牛顿），用普通话和英文为买家和卖家服务，服务范围覆盖大波士顿地区 ${SITE.areaServed.length} 个城镇。从第一次看房到签字过户，您都可以用中文沟通。`}
    hero={{
      image:
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=70',
      alt: '大波士顿郊区的一栋住宅',
    }}
    faqHeading="大家最常问的问题"
    jsonLd={[
      service({
        name: '大波士顿中文房地产服务',
        serviceType: 'Real estate representation in Mandarin and English',
        description: `${CHINESE_PARTNER.name} 用普通话和英文代表大波士顿地区的买家和卖家。`,
        path: '/zh',
        provider: CHINESE_PARTNER.agentId,
      }),
    ]}
    faqs={[
      {
        question: '大波士顿有讲中文的房地产经纪人吗？',
        answer: `有。${CHINESE_PARTNER.name} 是 ${CHINESE_PARTNER.brokerage} 的房地产经纪人，办公室在 ${CHINESE_PARTNER.addressLine}，可以用普通话和英文代表大波士顿 ${SITE.areaServed.length} 个城镇的买家和卖家。电话 ${CHINESE_PARTNER.phone}，邮箱 ${CHINESE_PARTNER.email}，也可以通过微信联系。`,
      },
      {
        question: '整个买房过程真的都可以用中文吗？',
        answer:
          '看房、商量出价、议价，以及讲解每一份文件，都可以用中文。合同本身是英文的，因为麻州的房地产合同以英文签署；但在签字之前，您会清楚知道每一条的意思。',
      },
      {
        question: '英语不好能在麻州买房吗？',
        answer:
          '可以。麻州的法律文件都是英文，一旦签字就有约束力，所以关键是您要清楚自己签的是什么。Maggie 可以用中文为您讲解每一步。',
      },
      {
        question: '人在中国或其他国家，可以在波士顿买房吗？',
        answer:
          '可以。从海外买房会在贷款、资金转账、身份证明和时间安排上多出一些步骤，而且通常需要有人代您参加看房和验房。Maggie 可以安排视频看房，在您无法到场时全程代表您，并尽早告诉您哪些问题应该找贷款机构、律师或税务顾问。',
      },
      {
        question: '可以用微信联系吗？',
        answer:
          '可以。每个中文页面的底部都有 Maggie 的微信二维码。如果您或家人在海外，微信往往是最方便的方式。',
      },
      {
        question: '怎样核实经纪人的执照？',
        answer:
          '麻州所有房地产执照都可以在 elicensing.mass.gov 按姓名公开查询，包括执照类别、状态和纪律处分记录。无论找哪位经纪人，都值得查一下。',
      },
    ]}
    cta={{
      heading: '先聊一聊',
      body: '不用提前准备，也没有任何压力。告诉 Maggie 您的想法，她会告诉您下一步该怎么做。',
      button: '联系 Maggie',
    }}
    enLabel="Greater Boston real estate, in English"
  >
    <h2>在麻州买房有什么不一样？</h2>
    <p>
      在麻州买卖房屋要经过<strong>两份合同</strong>，不是一份：先是购房要约（Offer to Purchase），
      大约十到十四天后是买卖合同（Purchase and Sale Agreement，简称 P&amp;S）。买家遇到的大部分麻烦，
      都发生在这两份合同之间。两份都是英文，一签就有约束力。
    </p>
    <p>
      麻州的房产交易实际上也离不开律师。经纪人的工作是确保您在每一步都清楚自己同意了什么、
      哪些期限正在计时，以及事情不如预期时会发生什么。
    </p>

    <h2>您可以从这里开始</h2>
    <ul>
      <li>
        <Link to="/zh/goufang">购房指南</Link>：从贷款预批到拿到钥匙，以及不该放弃的保护条款。
      </li>
      <li>
        <Link to="/zh/shoufang">售房指南</Link>：准备、定价，以及麻州法律要求的文件。
      </li>
      <li>
        <Link to="/zh/shouci-goufang">首次购房</Link>：第一次买房要知道的步骤和常见错误。
      </li>
      <li>
        <Link to="/zh/gujia">免费房屋估价</Link>：基于附近同类成交的书面估价，不是自动算出来的数字。
      </li>
      <li>
        <Link to="/zh/jisuanqi">购房和售房计算器</Link>：算出每月的真实费用和卖房后实际拿到的金额。
      </li>
    </ul>

    <h2>服务哪些城镇？</h2>
    <p>
      大波士顿地区 {SITE.areaServed.length} 个城镇。每个城镇都有一份中文指南，列出火车站、学校、
      高速公路，以及在当地买房要特别注意的事情。请看<Link to="/zh/quyu">城镇指南</Link>。
    </p>
    <p>
      选城镇之前有一点值得知道：在波士顿一带，房价往往要看具体哪条街，不只是看在哪个镇。
      同一个镇里相距一英里的两栋房子，价格可能差很多，这取决于能否走路到火车站，
      以及这个地址对应哪所小学。
    </p>

    <h2>刚搬到麻州？</h2>
    <p>
      有几件事是必须做而且有期限的：到 RMV 换驾照和车辆登记、按州法规定购买医疗保险、为孩子办理入学。
      买房之前先租一年，往往是明智的决定，这样您可以在投入大笔资金之前先了解这里的地理和通勤。
      详情请看<Link to="/zh/banjia-mazhou">搬到麻州</Link>。
    </p>
    <p>
      还有其他问题？请看<Link to="/zh/changjian-wenti">常见问题</Link>，或直接联系 Maggie。
    </p>
  </ZhPage>
);

export default ZhHome;
