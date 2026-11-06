import { Link } from 'react-router-dom';
import ZhPage from '@/components/ZhPage';
import { neighborhoods } from '@/data/neighborhoodData';
import { TOWN_NAMES_ZH } from '@/data/zh/townNames';
import { itemList } from '@/lib/schema';
import { SITE } from '@/lib/siteConfig';

/**
 * /zh/quyu — pairs with /neighborhoods, the hub for the Chinese town guides.
 *
 * Unlike /vi/khu-vuc this links to guides in its own language, and unlike it, it
 * has no question about which towns a community lives in. Telling a reader where
 * people of their background live is steering under fair-housing law, whichever
 * language it is written in.
 */
const ZhAreas = () => (
  <ZhPage
    path="/zh/quyu"
    seo={{
      title: `大波士顿 ${SITE.areaServed.length} 个城镇指南：车站、学校和房产税`,
      description: `牛顿、列克星敦、韦尔斯利、布鲁克莱恩、剑桥等大波士顿 ${SITE.areaServed.length} 个城镇的中文指南：火车站、公立学校、高速公路、房产税率，以及在当地买房要注意的事情。`,
      keywords:
        '牛顿 Newton 买房, 列克星敦 Lexington 学区, 韦尔斯利 Wellesley, 布鲁克莱恩 Brookline, 波士顿 郊区 哪里好, 大波士顿 城镇 指南',
    }}
    eyebrow="城镇指南"
    h1="波士顿周边，选哪个城镇？"
    lede="在波士顿一带，房价往往要看具体哪条街，不只是看在哪个镇。能否走路到火车站、这个地址属于哪所小学、接的是市政下水道还是化粪池，比镇名更影响价格和生活。"
    hero={{
      image:
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1600&q=70',
      alt: '大波士顿郊区的住宅区',
    }}
    heroSize="standard"
    width="wide"
    faqHeading="关于选城镇的问题"
    faqs={[
      {
        question: '两户住宅（two-family）在哪里比较多？',
        answer:
          'Medford（梅德福）、Malden（莫尔登）、Somerville（萨默维尔）、Quincy（昆西）和 Waltham（沃尔瑟姆）有很多两户和三户住宅，是这些城镇常见的房源类型。很多家庭买下后自住一户，出租另一户，或者让父母住。',
      },
      {
        question: '能走路到火车站真的那么重要吗？',
        answer:
          '很重要，这是两栋相似的房子之间最持久的差别之一。Needham（尼德姆）一个镇就有四个火车站。请实际走一次并计时，地图总是让人觉得比实际近。',
      },
      {
        question: '哪些城镇有化粪池？',
        answer:
          '在外围城镇比较常见，例如 Dover（多佛）和 Weston（韦斯顿），很多地方没有市政下水道。这很重要，因为 Title 5 规定出售时要检查，不合格的系统可能要花几万美元。',
      },
    ]}
    cta={{
      heading: '还不确定从哪里开始？',
      body: '告诉 Maggie 您在哪里工作、预算多少、家里需要什么。这样缩小范围，比自己一个一个读要容易得多。',
      button: '联系 Maggie',
    }}
    enLabel="Town-by-town area guides"
    sections={
      <>
        <div className="mb-14 max-w-3xl border-y border-gray-200 py-8">
          <h2 className="mb-4 text-2xl font-semibold text-ink">从通勤开始</h2>
          <p className="mb-4 leading-relaxed text-gray-700">
            新搬来的人最常犯的错误，是先从名单里选一个城镇，然后才发现每天的实际情况。
            波士顿一带的通勤和地图上看到的不一样：距离远近，往往不如您靠近哪条路线、能不能走到火车站重要。
          </p>
          <ul className="list-disc space-y-2 pl-6 leading-relaxed text-gray-700">
            <li>
              <strong className="text-ink">在您实际上班的时间开车试一次</strong>
              ，去程和回程都要试。早上八点在 Route 9 上的十五英里，和十点完全不同。
            </li>
            <li>
              <strong className="text-ink">从房子走到车站并计时</strong>
              ，再查这条线的班次频率，不要只看有没有车站。
            </li>
            <li>
              <strong className="text-ink">针对具体地址确认学校</strong>
              ，而不是只看城镇。很多城镇有多个学区范围，Newton（牛顿）有两所高中。
            </li>
          </ul>
        </div>

        <h2 className="mb-8 text-2xl font-semibold text-ink">
          {SITE.areaServed.length} 个城镇，每个一份中文指南
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* The image alt is empty, as on /neighborhoods: these are stock photos,
              not photographs of these towns, and the text names the destination. */}
          {neighborhoods.map((town) => (
            <Link
              key={town.slug}
              to={`/zh/quyu/${town.slug}`}
              className="group block overflow-hidden rounded-lg shadow-md transition-all duration-300 hover:shadow-xl"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={town.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full transform object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="bg-white p-6">
                <h3 className="text-2xl font-semibold">{TOWN_NAMES_ZH[town.slug] ?? town.name}</h3>
                <p lang="en" className="mt-1 text-sm uppercase tracking-wide text-gray-500">
                  {town.name}, MA
                </p>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-12 leading-relaxed text-gray-700">
          想了解每个城镇的房价？
          <Link to="/market" className="underline decoration-champagne decoration-2 underline-offset-4">
            每月市场报告
          </Link>
          目前是英文的。要买房请看
          <Link to="/zh/goufang" className="underline decoration-champagne decoration-2 underline-offset-4">
            购房指南
          </Link>
          ，要卖房请看
          <Link to="/zh/shoufang" className="underline decoration-champagne decoration-2 underline-offset-4">
            售房指南
          </Link>
          。
        </p>
      </>
    }
    jsonLd={[
      itemList(
        neighborhoods.map((town) => ({
          name: `${TOWN_NAMES_ZH[town.slug] ?? town.name}（${town.name}, MA）`,
          url: `/zh/quyu/${town.slug}`,
        })),
      ),
    ]}
  />
);

export default ZhAreas;
