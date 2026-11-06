import { Link } from 'react-router-dom';
import ZhPage from '@/components/ZhPage';
import { agentIdentity, person } from '@/lib/schema';
import { CHINESE_PARTNER, SITE, locality, telHref } from '@/lib/siteConfig';

/**
 * /zh/guanyu — pairs with /about: who Kevin is, in plain facts.
 *
 * It used to be "whose site is this?", with questions about why there are two
 * names and who wrote the Chinese. Maggie read it on 2026-10-31 and found that kind
 * of explaining strange, so the page states the facts and points to her instead.
 * The broker-versus-salesperson explainer went with it: on pages where she is the
 * contact, it read as ranking the two of them.
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
      title: `关于 Kevin Hoang | ${locality} 持牌房地产经纪人`,
      description: `${SITE.agentName} 是 ${SITE.brokerage} 的麻州持牌房地产经纪人，在 Newton 工作，使用英文和越南语。中文服务请联系 ${CHINESE_PARTNER.name}。`,
      keywords: `Kevin Hoang, ${SITE.brokerage}, 麻州 持牌 房地产经纪人, 牛顿 地产经纪`,
      ogImage: '/og-about.jpg',
    }}
    eyebrow="关于本站"
    h1="关于 Kevin Hoang"
    lede={`本网站由 ${SITE.agentName} 运营。他是 ${SITE.brokerage} 的麻州持牌房地产经纪人（broker），在 Newton（牛顿）工作，使用英文和越南语。需要中文服务，请联系 ${CHINESE_PARTNER.name}（${CHINESE_PARTNER.brokerage}）。`}
    hero={{
      image:
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1920&q=70',
      alt: '',
    }}
    heroSize="standard"
    cta={{
      heading: '需要中文服务？',
      body: '请直接联系 Maggie，打电话、发短信、发邮件或微信都可以。',
      button: '联系 Maggie',
    }}
    enLabel="About Kevin Hoang"
    jsonLd={[person(), agentIdentity()]}
  >
    <h2>执照</h2>
    <p>
      {SITE.agentName} 自 {LICENSED_SINCE} 年起在麻州持有房地产执照，现持有 broker 执照。任何麻州执照都可以在{' '}
      <a href="https://elicensing.mass.gov/CitizenAccess/" target="_blank" rel="noopener noreferrer">
        麻州职业执照管理局的登记系统
      </a>
      按姓名查询。
    </p>

    <h2>中文服务请联系 Maggie</h2>
    <p>
      {CHINESE_PARTNER.name} 是 {CHINESE_PARTNER.brokerage} 的房地产经纪人，用普通话和英文为大波士顿的买家和卖家服务。
      她的详细资料请看<Link to="/zh/maggie-li">认识 Maggie</Link>。
    </p>

    <h2>网站内容</h2>
    <p>
      网站上的指南讲的是麻州的具体情况：法规、期限和本地做法。中文内容根据英文指南翻译整理，仅供参考，
      涉及您的具体情况，请咨询您的律师和其他专业人士。
    </p>
    <ul>
      <li>
        <Link to="/zh/goufang">购房路线图</Link>：从贷款预批到过户的每一步，以及每一步的作用。
      </li>
      <li>
        <Link to="/zh/shoufang">售房路线图</Link>：准备、定价、营销和议价。
      </li>
      <li>
        <Link to="/zh/quyu">城镇指南</Link>：大波士顿 {SITE.areaServed.length} 个城镇的车站、学校和买房要注意的事情。
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
