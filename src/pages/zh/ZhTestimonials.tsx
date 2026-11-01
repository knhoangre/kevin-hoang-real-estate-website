import { Star } from 'lucide-react';
import ZhPage from '@/components/ZhPage';
import { ALL_TESTIMONIALS } from '@/data/testimonials';
import { CHINESE_PARTNER, SITE, googleProfileUrl } from '@/lib/siteConfig';

/**
 * /zh/pingjia — pairs with /testimonials.
 *
 * THESE ARE REVIEWS OF KEVIN, AND THE PAGE SAYS SO BEFORE ANYTHING ELSE. Every
 * button in this tree reaches Maggie, so a reader could otherwise take them for
 * hers, which would be presenting a testimonial about one person as if it were
 * about another. Her own reviews are one link away, on her site.
 *
 * Not translated, for the reason on /vi/danh-gia: rewriting someone's words into
 * another language and presenting them as their review is fabrication, and it
 * breaks the one thing that makes a review checkable. No Review markup either
 * (16 CFR Part 465).
 */
const ZhTestimonials = () => (
  <ZhPage
    path="/zh/pingjia"
    seo={{
      title: 'Kevin Hoang 的客户评价（英文原文）',
      description: `这些是 ${SITE.agentName} 的客户在 Google 上写的真实评价，保留英文原文。${CHINESE_PARTNER.name} 的客户评价在她自己的网站上。`,
    }}
    eyebrow="客户评价"
    h1="客户怎么说"
    lede={`这个页面上的评价都是写给 ${SITE.agentName} 的，不是写给 ${CHINESE_PARTNER.name} 的。它们来自他的 Google 商家资料，保留英文原文，您可以在 Google 上逐条核对。`}
    hero={{
      image:
        'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=1600&q=65',
      alt: '温馨的客厅',
    }}
    heroSize="standard"
    width="wide"
    faqHeading="关于评价的问题"
    faqs={[
      {
        question: '为什么不翻译成中文？',
        answer:
          '因为这是客户自己写的原话。把别人的话翻译后当作他们的评价来呈现，会改变原意，您也无法再和 Google 上的原文核对。页面的介绍是中文的，引用的内容保持原样。',
      },
      {
        question: '在哪里能看到 Maggie 的评价？',
        answer: `在她的个人网站 maggieli.co 上，这里的评价都不是关于她的。`,
      },
      {
        question: '怎样核实这些评价？',
        answer:
          '打开 Kevin 的 Google 商家资料直接阅读。如果一位经纪人只在自己网站上放好评，没有公开的资料可以核对，这件事本身就值得问一问。',
      },
    ]}
    cta={{
      heading: '想和 Maggie 谈一谈？',
      body: '了解是否合适，最好的办法就是打一个简短的电话。不需要提前准备。',
      button: '联系 Maggie',
    }}
    enLabel="Client reviews"
    sections={
      <>
        <p className="mb-8 flex flex-wrap gap-x-6 gap-y-2">
          <a
            href={googleProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-champagne decoration-2 underline-offset-4"
          >
            在 Google 上阅读 Kevin 的评价
          </a>
          <a
            href={CHINESE_PARTNER.reviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-champagne decoration-2 underline-offset-4"
          >
            阅读 Maggie 的客户评价（maggieli.co）
          </a>
        </p>

        <h2 className="mb-6 text-3xl font-bold text-ink">Kevin 的客户写的评价</h2>
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ALL_TESTIMONIALS.map((review) => (
            <li
              key={review.firstName + review.text.slice(0, 24)}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              {/* Amber carries meaning here — a rating is not a brand mark. */}
              <div className="mb-3 flex gap-0.5" aria-label={`${review.stars} 星（满分 5 星）`}>
                {Array.from({ length: review.stars }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                ))}
              </div>
              <blockquote lang="en" className="text-sm leading-relaxed text-gray-700">
                {review.text}
              </blockquote>
              <p lang="en" className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                {review.firstName}
              </p>
            </li>
          ))}
        </ul>
      </>
    }
  />
);

export default ZhTestimonials;
