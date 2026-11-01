import { Link } from 'react-router-dom';
import ZhPage from '@/components/ZhPage';
import { agentIdentity, person } from '@/lib/schema';
import { CHINESE_PARTNER, SITE, locality, telHref } from '@/lib/siteConfig';

/**
 * /zh/guanyu — pairs with /about. It says whose site this is, and answers the
 * question a Chinese reader has after seeing two names: why Maggie and not Kevin.
 *
 * #kevin and #agent are declared here because this page describes him. The profile
 * links are SITE.profiles, as on /about, so the visible list and sameAs agree.
 * Nothing about fees (Kevin's decision, 2026-10-31).
 */
const LICENSED_SINCE = 2021;

const ZhAbout = () => (
  <ZhPage
    path="/zh/guanyu"
    seo={{
      title: `关于本站 | Kevin Hoang，${locality} 持牌房地产经纪人`,
      description: `这是 ${SITE.agentName} 的网站。他是 ${SITE.brokerage} 的麻州持牌房地产经纪人，常驻 Newton，用英文和越南语工作。中文客户由 ${CHINESE_PARTNER.name} 直接服务。`,
      keywords: `Kevin Hoang, ${SITE.brokerage}, 麻州 持牌 房地产经纪人, 牛顿 地产经纪`,
      ogImage: '/og-about.jpg',
    }}
    eyebrow="关于本站"
    h1="这是谁的网站？"
    lede={`这是 ${SITE.agentName} 的网站。他是 ${SITE.brokerage} 的麻州持牌房地产经纪人（broker），常驻 Newton（牛顿），用英文和越南语工作。他不讲中文，所以需要中文服务的客户由 ${CHINESE_PARTNER.name} 直接服务。`}
    hero={{
      image:
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1920&q=70',
      alt: '',
    }}
    heroSize="standard"
    faqHeading="关于本站的问题"
    faqs={[
      {
        question: '为什么有两个名字？',
        answer: `网站是 ${SITE.agentName} 的。他希望讲中文的读者也能看懂这些内容，并找到能用中文服务的人，所以有了中文页面，并由 ${CHINESE_PARTNER.name} 作为中文服务的联系人。`,
      },
      {
        question: '我可以用英文联系 Kevin 吗？',
        answer: `可以。如果您习惯用英文或越南语，电话是 ${SITE.phone}，邮箱是 ${SITE.email}。英文网站上有他的全部资料。`,
      },
      {
        question: '这些中文内容是谁写的？',
        answer: `这些内容译自 ${SITE.agentName} 为这个网站写的英文指南，并根据中文读者的需要做了调整。如果中文和英文有出入，或者涉及您的具体情况，请以您的律师和其他专业人士的意见为准。`,
      },
    ]}
    cta={{
      heading: '需要中文服务？',
      body: '请直接联系 Maggie。如果您更习惯英文，也可以在英文页面上联系 Kevin。',
      button: '联系 Maggie',
    }}
    enLabel="About Kevin Hoang"
    jsonLd={[person(), agentIdentity()]}
  >
    <h2>麻州的 broker 执照是什么意思？</h2>
    <p>
      麻州有两种房地产执照。<strong>销售员（salesperson）</strong>执照是入门级的，持有人要在经纪人（broker）的监督下工作。
      <strong>经纪人（broker）</strong>执照要求先有全职担任销售员的记录，再完成额外的课程、通过单独的州考试，并有三位推荐人。
      大多数执业人员持有的是销售员执照。
    </p>
    <p>
      {SITE.agentName} 自 {LICENSED_SINCE} 年起在麻州持有执照，现持有 broker 执照。任何麻州执照都可以在{' '}
      <a href="https://elicensing.mass.gov/CitizenAccess/" target="_blank" rel="noopener noreferrer">
        麻州职业执照管理局的登记系统
      </a>
      按姓名查询，这是核实这一点的正确方式。
    </p>

    <h2>两位经纪人，两家公司</h2>
    <p>
      {SITE.agentName} 隶属于 <strong>{SITE.brokerage}</strong>，{CHINESE_PARTNER.name} 隶属于{' '}
      <strong>{CHINESE_PARTNER.brokerage}</strong>。您和 Maggie 合作时，由她和她的公司代表您。
      她的详细资料请看<Link to="/zh/maggie-li">认识 Maggie</Link>。
    </p>

    <h2>这个网站写了什么？</h2>
    <p>
      网站上的指南讲的是麻州的具体情况：法规、期限和本地做法，这些往往是全国性的通用建议讲错的地方。
    </p>
    <ul>
      <li>
        <Link to="/zh/goufang">购房路线图</Link>：从贷款预批到过户的每一步，以及每一步的作用。
      </li>
      <li>
        <Link to="/zh/shoufang">售房路线图</Link>：准备、定价、营销和议价。
      </li>
      <li>
        <Link to="/zh/quyu">城镇指南</Link>：大波士顿 {SITE.areaServed.length} 个城镇的车站、学校和要查的事情。
      </li>
      <li>
        <Link to="/zh/wenzhang">文章</Link>：更深入的英文文章，按主题整理。
      </li>
    </ul>

    <h2>Kevin 的职业资料</h2>
    <p>这些是 {SITE.agentName} 在常用网站上的资料页面（英文）：</p>
    <ul>
      {SITE.profiles.map((profile) => (
        <li key={profile.url}>
          <a href={profile.url} target="_blank" rel="noopener noreferrer me" lang="en">
            {profile.name}
          </a>
        </li>
      ))}
    </ul>

    <h2>联系 Kevin（英文或越南语）</h2>
    <p>
      电话：<a href={telHref}>{SITE.phone}</a>
      <br />
      邮箱：<a href={`mailto:${SITE.email}`}>{SITE.email}</a>
    </p>
  </ZhPage>
);

export default ZhAbout;
