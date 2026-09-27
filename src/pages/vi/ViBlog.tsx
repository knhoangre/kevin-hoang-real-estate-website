import { Link } from 'react-router-dom';
import ViPage from '@/components/ViPage';
import { blogPosts } from '@/data/blogData';

/**
 * /vi/bai-viet — the counterpart of /blog, added 2026-09-27 so the "Blog" row of
 * the paired menu has a Vietnamese partner.
 *
 * THE ARTICLES ARE NOT TRANSLATED, and the page says so in its first sentence.
 * This is /vi/khu-vuc's arrangement applied to the blog: a Vietnamese page that
 * describes the English corpus and routes a reader into it by topic, rather than
 * ninety-two machine-shaped translations — which is the scaled-content pattern
 * this corpus was cleaned of once, and a lot of Vietnamese nobody has checked.
 * `BlogPost` already carries optional titleVi/excerptVi/contentVi fields; a post
 * translated properly, one at a time, is the way to grow this.
 *
 * TOPICS ARE ASSIGNED HERE BY SLUG, because posts carry no category. Titles are
 * read from blogData, never retyped, so a renamed post cannot go stale here. A
 * slug listed below that no longer exists is skipped, and a post assigned to no
 * topic falls into the last group rather than vanishing — so adding a post can
 * never silently hide it from this page.
 */
interface Topic {
  id: string;
  heading: string;
  intro: string;
  slugs: string[];
}

const TOPICS: Topic[] = [
  {
    id: 'mua',
    heading: 'Mua nhà: từ chấp thuận vay đến ngày nhận chìa khóa',
    intro:
      'Trình tự mua nhà ở Massachusetts, những gì cần có trước khi ra giá, cách cạnh tranh khi nhiều người cùng muốn mua một căn, và những loại nhà có luật lệ riêng như condo, nhà mới xây hay nhà theo diện xổ số 40B.',
    slugs: [
      'buying-a-home-new-to-the-us-massachusetts',
      'first-time-homebuyer-mistakes-massachusetts',
      'pre-approval-checklist',
      'first-time-buyer-programs-mass',
      'choosing-real-estate-agent-massachusetts',
      'buyer-agency-agreements-massachusetts',
      'how-much-to-offer-massachusetts',
      'multiple-offers-boston-market',
      'winning-a-bidding-war-greater-boston',
      'massachusetts-offer-contingencies',
      'real-estate-negotiation-strategies-massachusetts',
      'home-inspection-guide',
      'massachusetts-home-inspection-waiver-law',
      'deposit-and-liquidated-damages-massachusetts',
      'listing-status-under-agreement-massachusetts',
      'real-estate-closing-process-massachusetts',
      'buyer-closing-costs-massachusetts',
      'closing-wire-fraud-massachusetts',
      'condominium-living-boston-guide',
      'buying-new-construction-massachusetts',
      'buying-a-flipped-house-massachusetts',
      'foreclosure-short-sale-massachusetts',
      'historic-homes-massachusetts-guide',
      'age-restricted-55-communities-massachusetts',
      'chapter-40b-affordable-housing-lottery',
      'buying-land-to-build-massachusetts',
      'waterfront-property-buying-guide',
      'second-home-cape-cod-islands-massachusetts',
    ],
  },
  {
    id: 'ban',
    heading: 'Bán nhà: chuẩn bị, định giá và giấy tờ',
    intro:
      'Chuẩn bị nhà trước khi rao, đặt giá đúng ngay từ đầu, hợp đồng niêm yết, số tiền thật sự nhận về, và những giấy tờ người bán ở Massachusetts phải có trước ngày đóng giao dịch.',
    slugs: [
      'pricing-strategy-guide',
      'home-preparation-guide',
      'staging-strategies-mass-homes',
      'listing-agreement-massachusetts',
      'open-houses-massachusetts-sellers',
      'when-to-reduce-the-price-massachusetts',
      'what-earns-a-premium-price-massachusetts',
      'sellers-net-proceeds-massachusetts',
      'selling-a-house-as-is-massachusetts',
      'massachusetts-seller-closing-requirements',
      'selling-a-house-with-tenants-massachusetts',
      'solar-panels-massachusetts-home-sale',
      'downsizing-strategies-empty-nesters',
      'fair-housing-massachusetts-buyers-sellers',
    ],
  },
  {
    id: 'gia',
    heading: 'Giá nhà: cách đọc một con số',
    intro:
      'Vì sao hai căn nhà cùng diện tích lại bán giá khác nhau, cách đọc một căn so sánh (comp), khi nào là thị trường của người bán, và những gì các trang định giá tự động không nhìn thấy được.',
    slugs: [
      'automated-home-valuations-what-they-miss',
      'how-to-read-a-comp-massachusetts',
      'house-layout-and-home-value',
      'lot-size-and-home-value-massachusetts',
      'is-it-a-sellers-market-how-to-tell',
      'home-appraisal-process-massachusetts',
      'school-districts-property-values',
      'home-renovation-roi-mass',
      'smart-home-property-value',
      'swimming-pool-home-value-massachusetts',
    ],
  },
  {
    id: 'vay',
    heading: 'Tiền vay, thuế và các khoản chi phí',
    intro:
      'Chọn loại khoản vay, thuế bất động sản, bảo hiểm nhà, tài khoản escrow, và những khoản chi phí ngoài tiền trả trước — kể cả so sánh thuê nhà với mua nhà.',
    slugs: [
      'massachusetts-mortgage-options-guide',
      'navigating-changing-interest-rates',
      'mortgage-escrow-account-massachusetts',
      'mass-property-tax-guide',
      'massachusetts-home-insurance-guide',
      'rent-versus-buy-massachusetts',
      'renting-in-greater-boston-costs',
      'renovation-loans-massachusetts',
      'home-equity-refinancing-massachusetts',
      'betterments-municipal-assessments-massachusetts',
      'home-warranty-protection-plans-massachusetts',
    ],
  },
  {
    id: 'luat',
    heading: 'Tình trạng căn nhà và luật riêng của Massachusetts',
    intro:
      'Hầm tự hoại (Title 5), sơn chì, radon, bồn dầu, giếng nước, hệ thống điện cũ, tầng hầm ẩm — những điều kiểm định nhà và luật tiểu bang buộc bạn phải biết trước khi mua hoặc bán, cùng quyền sở hữu, ranh giới đất và quy hoạch.',
    slugs: [
      'title-5-septic-massachusetts',
      'massachusetts-lead-paint-law',
      'radon-testing-massachusetts-homes',
      'heating-oil-tanks-massachusetts',
      'private-well-water-massachusetts',
      'old-wiring-electrical-service-massachusetts',
      'wet-basements-massachusetts',
      'chimneys-fireplaces-wood-stoves-massachusetts',
      'asbestos-in-massachusetts-homes',
      'title-insurance-massachusetts',
      'massachusetts-homestead-declaration',
      'boundary-disputes-fences-massachusetts',
      'private-roads-shared-driveways-massachusetts',
      'zoning-laws-building-permits-massachusetts',
      'climate-change-boston-real-estate',
      'energy-efficient-homes-mass',
      'massachusetts-home-maintenance-checklist',
    ],
  },
  {
    id: 'dau-tu',
    heading: 'Đầu tư, gia đình và chuyển nhà',
    intro:
      'Mua nhà hai, ba căn hộ để cho thuê, căn hộ in-law cho cha mẹ, gia đình nhiều thế hệ ở chung, thừa kế và ly hôn, và chuyển đến Massachusetts từ nơi khác.',
    slugs: [
      'boston-multifamily-investment',
      'rental-property-investment-massachusetts',
      'multi-generational-housing-trends',
      'in-law-apartments-adu-massachusetts',
      'condo-conversion-massachusetts',
      'short-term-rentals-massachusetts-law',
      'condo-fees-hoa-regulations-massachusetts',
      'estate-planning-real-estate-massachusetts',
      'divorce-and-the-marital-home-massachusetts',
      'moving-to-massachusetts-relocation-guide',
      'transit-oriented-development-boston',
      'mbta-communities-act-zoning',
    ],
  },
];

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));
const assigned = new Set(TOPICS.flatMap((t) => t.slugs));
const unassigned = blogPosts.filter((post) => !assigned.has(post.slug));

const GROUPS = [
  ...TOPICS.map((t) => ({
    ...t,
    posts: t.slugs.map((slug) => bySlug.get(slug)).filter((p) => p !== undefined),
  })),
  ...(unassigned.length
    ? [
        {
          id: 'khac',
          heading: 'Bài viết khác',
          intro: 'Những bài mới hơn, chưa được xếp vào nhóm nào ở trên.',
          slugs: [],
          posts: unassigned,
        },
      ]
    : []),
];

const ViBlog = () => (
  <ViPage
    path="/vi/bai-viet"
    seo={{
      title: 'Bài Viết Về Mua Bán Nhà Ở Massachusetts, Theo Chủ Đề',
      description: `${blogPosts.length} bài viết của Kevin Hoang về mua nhà, bán nhà, giá nhà, tiền vay và luật riêng của Massachusetts — sắp theo chủ đề, giới thiệu bằng tiếng Việt.`,
    }}
    eyebrow="Bài viết"
    h1="Bài viết về mua bán nhà ở Massachusetts"
    lede={`${blogPosts.length} bài viết của Kevin về mua nhà, bán nhà, giá cả và luật lệ riêng của Massachusetts, sắp theo chủ đề. Các bài viết bằng tiếng Anh; phần giới thiệu từng nhóm bằng tiếng Việt để bạn biết nên đọc bài nào trước — và nếu có đoạn nào khó hiểu, cứ hỏi Kevin bằng tiếng Việt.`}
    crumbs={[
      { name: 'Trang chủ', path: '/' },
      { name: 'Tiếng Việt', path: '/vi' },
      { name: 'Bài viết', path: '/vi/bai-viet' },
    ]}
    hero={{
      image:
        // The English /blog hero, so it is an image already known to resolve at
        // these params.
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1600&q=65',
      alt: 'Một kệ sách tham khảo',
    }}
    faqHeading="Câu hỏi về các bài viết"
    faqs={[
      {
        question: 'Có bài viết nào bằng tiếng Việt không?',
        answer:
          'Các bài viết hiện bằng tiếng Anh. Những nội dung chính đã có bằng tiếng Việt ở các trang riêng: hướng dẫn mua nhà, hướng dẫn bán nhà, định giá nhà, khu vực phục vụ, chuyển đến Massachusetts, câu hỏi thường gặp và máy tính mua nhà. Nếu bạn cần hiểu kỹ một bài cụ thể, Kevin có thể giải thích bằng tiếng Việt.',
      },
      {
        question: 'Mua nhà lần đầu thì nên đọc bài nào trước?',
        answer:
          'Ba bài: "Buying a Home in Massachusetts When You Are New to the United States" nếu bạn chưa quen hệ thống của Mỹ, "The Pre-Approval Checklist for Greater Boston Buyers" để chuẩn bị hồ sơ vay, và "Seven Mistakes First-Time Buyers Make in Massachusetts". Cả ba nằm ở đầu nhóm Mua nhà bên trên.',
      },
      {
        question: 'Sắp bán nhà thì nên đọc bài nào trước?',
        answer:
          'Bắt đầu với "How to Price a Home in Greater Boston" về cách đặt giá, rồi "Preparing a Massachusetts Home for Sale" về những việc cần làm trước khi rao, và bài về số tiền thật sự nhận về sau khi bán. Cả ba nằm ở nhóm Bán nhà bên trên.',
      },
    ]}
    cta={{
      heading: 'Có câu hỏi mà bài viết chưa trả lời?',
      body: 'Gọi hoặc nhắn tin cho Kevin bằng tiếng Việt. Một câu hỏi cụ thể về căn nhà của bạn thường được trả lời nhanh hơn là đọc mười bài viết.',
      button: 'Hỏi Kevin',
    }}
    enLabel="The blog"
  >
    {GROUPS.map((group) => (
      <section key={group.id} aria-labelledby={`chu-de-${group.id}`}>
        <h2 id={`chu-de-${group.id}`}>{group.heading}</h2>
        <p>{group.intro}</p>
        <ul lang="en">
          {group.posts.map((post) => (
            <li key={post.slug}>
              <Link to={`/blog/${post.slug}`}>{post.title}</Link>
            </li>
          ))}
        </ul>
      </section>
    ))}
  </ViPage>
);

export default ViBlog;
