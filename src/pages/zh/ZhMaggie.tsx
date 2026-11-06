import { Link } from 'react-router-dom';
import ZhPage from '@/components/ZhPage';
import WeChatCard from '@/components/zh/WeChatCard';
import { profilePage } from '@/lib/schema';
import { CHINESE_PARTNER, SITE, partnerTelHref } from '@/lib/siteConfig';

/**
 * /zh/maggie-li — who she is, and how to reach her. The page a search for her
 * name should land on from this site, and the one that declares why her Person
 * node appears here at all.
 *
 * Only what her own site states plainly: the languages, the brokerage, Newton, the
 * AREAA board seat. Her rankings and "over a decade" are left to her own site,
 * which this links to, and her Chinese name is absent because nothing records it.
 */
const ZhMaggie = () => (
  <ZhPage
    path="/zh/maggie-li"
    seo={{
      title: 'Maggie Li：波士顿讲中文的房地产经纪人 | 牛顿 Newton',
      description: `${CHINESE_PARTNER.name} 是 ${CHINESE_PARTNER.brokerage} 的房地产经纪人，办公室位于 Newton（牛顿），用普通话和英文服务大波士顿的买家和卖家，也是美国亚裔房地产协会（AREAA）理事会成员。`,
      keywords:
        'Maggie Li, Maggie Li 地产经纪, Maggie Li real estate, 牛顿 地产经纪, Newton MA Mandarin realtor, William Raveis Maggie Li',
    }}
    eyebrow="认识 Maggie"
    h1="Maggie Li：用普通话和英文服务大波士顿"
    lede={`${CHINESE_PARTNER.name} 是 ${CHINESE_PARTNER.brokerage} 的房地产经纪人，办公室位于 Newton（牛顿），为大波士顿地区的买家和卖家服务。您可以用普通话或英文和她沟通。`}
    hero={{
      image:
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1920&q=70',
      alt: '',
    }}
    heroSize="standard"
    jsonLd={[
      profilePage({
        path: '/zh/maggie-li',
        name: `${CHINESE_PARTNER.name}：波士顿讲中文的房地产经纪人`,
        personId: CHINESE_PARTNER.personId,
      }),
    ]}
    heroAside={
      <div className="aspect-square w-full max-w-[220px] overflow-hidden rounded-2xl ring-1 ring-champagne/40">
        <img
          src={CHINESE_PARTNER.photo}
          alt={`${CHINESE_PARTNER.name}，房地产经纪人`}
          width={440}
          height={440}
          className="h-full w-full object-cover object-[center_20%]"
          fetchPriority="high"
          decoding="async"
        />
      </div>
    }
    faqHeading="关于 Maggie 的问题"
    faqs={[
      {
        question: 'Maggie Li 的联系方式是什么？',
        answer: `电话 ${CHINESE_PARTNER.phone}，邮箱 ${CHINESE_PARTNER.email}，办公室地址 ${CHINESE_PARTNER.addressLine}，个人网站 maggieli.co。也可以扫描这个页面上的二维码，通过微信联系她。`,
      },
      {
        question: 'Maggie 讲哪些语言？',
        answer:
          '普通话和英文。您用哪种语言方便，就用哪种。',
      },
      {
        question: 'Maggie 服务哪些城镇？',
        answer: `本站介绍的 ${SITE.areaServed.length} 个大波士顿城镇，她都可以服务。她的个人网站上还介绍了 Arlington（阿灵顿）以及 Back Bay、Beacon Hill、Fenway 等波士顿街区。`,
      },
    ]}
    cta={{
      heading: '和 Maggie 谈一谈',
      body: '无论您在考虑买房、卖房，还是只想先了解情况，都可以打电话、发短信、发邮件或通过微信联系她。',
      button: '查看所有联系方式',
    }}
  >
    <h2>Maggie 的基本资料</h2>
    <ul>
      <li>
        <strong>团队：</strong>
        {CHINESE_PARTNER.teamName}
      </li>
      <li>
        <strong>经纪公司：</strong>
        {CHINESE_PARTNER.brokerage}
      </li>
      <li>
        <strong>办公地址：</strong>
        {CHINESE_PARTNER.addressLine}
      </li>
      <li>
        <strong>工作语言：</strong>
        普通话、英文
      </li>
      <li>
        <strong>专业组织：</strong>
        美国亚裔房地产协会（Asian Real Estate Association of America，AREAA）理事会成员
      </li>
      <li>
        <strong>电话：</strong>
        <a href={partnerTelHref}>{CHINESE_PARTNER.phone}</a>
      </li>
      <li>
        <strong>邮箱：</strong>
        <a href={`mailto:${CHINESE_PARTNER.email}`}>{CHINESE_PARTNER.email}</a>
      </li>
      <li>
        <strong>个人网站：</strong>
        <a href={CHINESE_PARTNER.website} target="_blank" rel="noopener noreferrer">
          maggieli.co
        </a>
        （英文，有她的成交记录和客户评价）
      </li>
    </ul>

    <WeChatCard />

    <h2>和 Maggie 合作，哪些可以用中文？</h2>
    <p>
      <strong>可以用普通话或英文：</strong>
      咨询、看房、了解各个社区、制定出价策略、议价，以及在您签字前讲解每一份文件的含义。
    </p>
    <p>
      <strong>只能用英文：</strong>
      法律文件本身。麻州的买卖合同、披露文件和过户文件都以英文签署，经纪人无法改变这一点。
    </p>
    <p>
      <strong>需要其他专业人士时：</strong>
      她可以为您介绍贷款机构、房地产律师和税务顾问，其中也有讲普通话的。
    </p>
    <p>
      更多说明请看<Link to="/zh/zhongwen-fuwu">中文服务包括哪些内容</Link>。
    </p>

    <h2>海外买家和外州买家</h2>
    <p>
      房源很容易在网上找到，难的是判断哪个城镇适合您、学校之间实际有什么差别、通勤到底要多久，
      以及您不在现场时整个流程怎么走。Maggie 可以安排视频看房，代您到现场看房、参加验房，
      并提前提醒您哪些环节在海外办理会花更长时间，例如贷款、资金转账、身份证明和时间安排。
    </p>

    <h2>在其他网站上查看 Maggie</h2>
    <ul>
      {CHINESE_PARTNER.profiles.map((profile) => (
        <li key={profile.url}>
          <a href={profile.url} target="_blank" rel="noopener noreferrer">
            {profile.name}
          </a>
        </li>
      ))}
    </ul>
  </ZhPage>
);

export default ZhMaggie;
