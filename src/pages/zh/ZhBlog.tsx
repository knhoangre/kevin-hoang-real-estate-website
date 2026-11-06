import { Link } from 'react-router-dom';
import ZhPage from '@/components/ZhPage';
import { blogPosts } from '@/data/blogData';
import { BLOG_TOPIC_SLUGS } from '@/data/blogTopics';
import { BLOG_TITLES_ZH } from '@/data/zh/blogTitles';

/**
 * /zh/wenzhang — pairs with /blog.
 *
 * THE ARTICLES ARE NOT TRANSLATED YET, and the page says so in its first sentence.
 * Kevin's decision (2026-10-31): they follow in batches once Maggie has read the
 * main pages. Ninety-two translated articles that no Chinese reader has checked is
 * the scaled-content pattern this corpus was cleaned of once. Each title is given
 * in Chinese with the English beneath, so a reader can tell what a post is about
 * before opening it. A post with no Chinese title shows the English alone, and one
 * assigned to no topic falls into the last group, so a new post is never hidden.
 */
const TOPICS = [
  {
    id: 'mua',
    heading: '买房：从贷款预批到拿到钥匙',
    intro:
      '麻州的买房顺序，出价之前要准备什么，多人竞价时怎样竞争，以及 condo、新建房和 40B 抽签房等有特殊规定的房屋类型。',
  },
  {
    id: 'ban',
    heading: '卖房：准备、定价和文件',
    intro: '挂牌前的准备，一开始就定对价格，挂牌协议，实际拿到多少钱，以及麻州卖家过户前必须准备的文件。',
  },
  {
    id: 'gia',
    heading: '房价：怎样看懂成交价和估价',
    intro:
      '为什么面积相同的两栋房子卖不同的价，怎样看可比成交（comp），什么时候是卖方市场，以及自动估价网站看不到什么。',
  },
  {
    id: 'vay',
    heading: '贷款、税务和各项费用',
    intro: '选择贷款类型、房产税、房屋保险、escrow 账户，以及首付之外的各项费用，包括租房和买房的比较。',
  },
  {
    id: 'luat',
    heading: '房屋状况和麻州特有的法规',
    intro:
      '化粪池（Title 5）、含铅油漆、氡气、油罐、水井、老旧电线、潮湿的地下室，这些是验房和州法要求您在买卖之前知道的事，还有产权、地界和分区。',
  },
  {
    id: 'dau-tu',
    heading: '投资、家庭和搬家',
    intro:
      '买两户或三户住宅出租，给父母住的 in-law 公寓，几代同堂，继承和离婚，以及从其他地方搬到麻州。',
  },
];

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));
const assigned = new Set(Object.values(BLOG_TOPIC_SLUGS).flat());
const unassigned = blogPosts.filter((post) => !assigned.has(post.slug));

const GROUPS = [
  ...TOPICS.map((topic) => ({
    ...topic,
    posts: BLOG_TOPIC_SLUGS[topic.id].map((slug) => bySlug.get(slug)).filter((p) => p !== undefined),
  })),
  ...(unassigned.length
    ? [
        {
          id: 'other',
          heading: '其他文章',
          intro: '较新的文章，还没有归入上面的分类。',
          posts: unassigned,
        },
      ]
    : []),
];

const ZhBlog = () => (
  <ZhPage
    path="/zh/wenzhang"
    seo={{
      title: '麻州买房卖房文章，按主题整理',
      description: `${blogPosts.length} 篇关于麻州买房、卖房、房价、贷款和法规的文章，按主题整理并附中文标题。文章目前是英文的，每个主题都有中文介绍。`,
      keywords: '麻州 买房 文章, 波士顿 房地产 指南, 美国 买房 知识, Title 5, 过户费用',
    }}
    eyebrow="文章"
    h1="关于麻州买房卖房的文章"
    lede={`这 ${blogPosts.length} 篇文章目前是英文的，由 Kevin Hoang 撰写。这里按主题整理，并附上中文标题和介绍，让您知道该先读哪一篇。如果有看不懂的地方，可以用中文问 Maggie。`}
    hero={{
      image:
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1600&q=65',
      alt: '一排参考书',
    }}
    heroSize="standard"
    faqHeading="关于这些文章的问题"
    faqs={[
      {
        question: '有中文版的文章吗？',
        answer:
          '文章目前是英文的。主要内容已经有中文页面：购房指南、售房指南、首次购房、房屋估价、城镇指南、搬到麻州、常见问题和计算器。如果需要弄懂某一篇，可以请 Maggie 用中文讲解。',
      },
      {
        question: '第一次买房应该先读哪几篇？',
        answer:
          '如果您不熟悉美国的制度，先读《刚到美国在麻州买房》；再读《大波士顿买家的贷款预批清单》来准备贷款文件；然后读《麻州首次购房者常犯的七个错误》。这三篇都在下面“买房”分类的开头。',
      },
      {
        question: '准备卖房应该先读哪几篇？',
        answer:
          '先读《如何在大波士顿给房子定价》，再读《麻州房屋出售前的准备》，然后读关于卖房实际到手金额的文章。这三篇都在下面的“卖房”分类中。',
      },
    ]}
    cta={{
      heading: '文章没有回答您的问题？',
      body: '打电话或发微信给 Maggie。与其读十篇文章，不如直接问一个关于您自己房子的问题。',
      button: '联系 Maggie',
    }}
    enLabel="The blog"
  >
    {GROUPS.map((group) => (
      <section key={group.id} aria-labelledby={`topic-${group.id}`}>
        <h2 id={`topic-${group.id}`}>{group.heading}</h2>
        <p>{group.intro}</p>
        <ul>
          {group.posts.map((post) => {
            const zhTitle = BLOG_TITLES_ZH[post.slug];
            return (
              <li key={post.slug}>
                <Link to={`/blog/${post.slug}`} lang={zhTitle ? undefined : 'en'}>
                  {zhTitle ?? post.title}
                </Link>
                {zhTitle && (
                  <span lang="en" className="block text-sm text-gray-500">
                    {post.title}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    ))}
  </ZhPage>
);

export default ZhBlog;
