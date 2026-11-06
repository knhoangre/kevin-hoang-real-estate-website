import { Link } from 'react-router-dom';
import ZhPage from '@/components/ZhPage';
import { agentIdentity, person } from '@/lib/schema';
import { CHINESE_PARTNER, SITE } from '@/lib/siteConfig';

/**
 * /zh/yuenanyu-fuwu — Kevin's Vietnamese service, in Chinese. Pairs with
 * /vietnamese-speaking-real-estate-agent and /vi/dich-vu-tieng-viet. Added
 * 2026-11-06 because Kevin asked for every row of the menu to have all three
 * languages, and chose a page here over leaving the cell empty.
 *
 * For a family in which some people would rather work in Vietnamese and some in
 * Chinese. About language, never about who anyone is.
 *
 * It is about Kevin, like /zh/guanyu, so its title says his name rather than
 * Maggie's and zh-check counts it among the pages about him. The rest of this
 * tree's rules still hold: every button reaches Maggie, Kevin's phone is not
 * linked (the way to him is his Vietnamese and English contact pages), and no
 * sentence has him doing anything in Chinese.
 */
const ZhVietnamese = () => (
  <ZhPage
    path="/zh/yuenanyu-fuwu"
    seo={{
      title: `越南语房地产服务 | ${SITE.agentName}，${SITE.brokerage}`,
      description: `${SITE.agentName} 是 ${SITE.brokerage} 的房地产经纪人，用越南语和英语与大波士顿的买家和卖家合作。中文服务请联系 ${CHINESE_PARTNER.name}。`,
      keywords: '越南语 房地产经纪人, 波士顿 越南语 地产, Vietnamese speaking realtor Boston, Kevin Hoang',
      ogImage: '/og-about.jpg',
    }}
    eyebrow="越南语服务"
    h1="用越南语买卖房屋：Kevin Hoang"
    lede={`${SITE.agentName} 是 ${SITE.brokerage} 的房地产经纪人，用越南语和英语与大波士顿的买家和卖家合作。如果您的家人更习惯越南语，可以直接联系他；需要中文服务，请联系 ${CHINESE_PARTNER.name}。`}
    hero={{
      image:
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1920&q=70',
      alt: '黄昏时分大波士顿的一栋新英格兰风格住宅',
    }}
    heroSize="standard"
    faqHeading="关于越南语服务的问题"
    faqs={[
      {
        question: 'Kevin 用哪些语言工作？',
        answer: `越南语和英语。中文咨询请联系 ${CHINESE_PARTNER.name}，她用普通话和英文工作。`,
      },
      {
        question: '合同也是越南语的吗？',
        answer:
          '不是。麻州的买卖合同、披露文件和过户文件都以英文签署。越南语用来在签字之前讲解每份文件的内容。',
      },
      {
        question: 'Kevin 服务哪些城镇？',
        answer: `大波士顿的 ${SITE.areaServed.length} 个城镇，包括 Newton（牛顿）、Needham（尼德姆）和 Wellesley（韦尔斯利）。完整列表请看城镇指南。`,
      },
    ]}
    cta={{
      heading: '想用中文咨询？',
      body: `${CHINESE_PARTNER.name} 用普通话和英文与大波士顿的买家和卖家合作。打电话、发短信、发邮件或微信都可以。`,
      button: '联系 Maggie',
    }}
    enLabel="Vietnamese-speaking real estate agent"
    jsonLd={[person(), agentIdentity()]}
  >
    <h2>用越南语可以做哪些事</h2>
    <p>
      <strong>可以用越南语或英语：</strong>
      咨询、看房、了解各个城镇、制定出价策略、议价，以及在签字之前讲解每一份文件的含义。
    </p>
    <p>
      <strong>只能用英文：</strong>
      法律文件本身。麻州的买卖合同、披露文件和过户文件都以英文签署，经纪人无法改变这一点。
    </p>

    <h2>一家人习惯不同的语言</h2>
    <p>
      有的家庭里，父母更习惯越南语，子女更习惯中文或英文。一笔交易由一位经纪人代表您：越南语对家人更重要，可以找 Kevin；中文更重要，可以找{' '}
      <Link to="/zh/maggie-li">Maggie</Link>。
    </p>

    <h2>怎样联系 Kevin</h2>
    <p>
      越南语请看<Link to="/vi/lien-he" lang="vi">越南语联系页</Link>
      ，英文请看<Link to="/contact" lang="en">英文联系页</Link>。越南语服务的详细介绍在
      <Link to="/vi/dich-vu-tieng-viet" lang="vi">越南语页面</Link>上。
    </p>
  </ZhPage>
);

export default ZhVietnamese;
