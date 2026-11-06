import { Star } from 'lucide-react';
import ZhPage from '@/components/ZhPage';
import { ALL_TESTIMONIALS } from '@/data/testimonials';
import { CHINESE_PARTNER, SITE, googleProfileUrl } from '@/lib/siteConfig';

/**
 * /zh/pingjia — pairs with /testimonials.
 *
 * THESE ARE REVIEWS OF KEVIN, AND THE H1 AND LEDE SAY SO. Every button in this
 * tree reaches Maggie, so a reader could otherwise take them for hers, which would
 * be presenting a testimonial about one person as if it were about another. Her
 * own reviews are one link away, on her site.
 *
 * Not translated, for the reason on /vi/danh-gia: rewriting someone's words into
 * another language and presenting them as their review is fabrication, and it
 * breaks the one thing that makes a review checkable. No Review markup either
 * (16 CFR Part 465). The page no longer explains either point in a FAQ: Maggie
 * found the explaining strange (2026-10-31).
 */
const ZhTestimonials = () => (
  <ZhPage
    path="/zh/pingjia"
    seo={{
      title: 'Kevin Hoang 的客户评价 | 英文原文',
      description: `${SITE.agentName} 的客户在 Google 上留下的评价，保留英文原文。${CHINESE_PARTNER.name} 的客户评价请看她的网站。`,
    }}
    eyebrow="客户评价"
    h1="Kevin Hoang 的客户评价"
    lede={`以下是 ${SITE.agentName} 的客户在 Google 上留下的评价，保留英文原文。${CHINESE_PARTNER.name} 的客户评价请看她的网站 maggieli.co。`}
    hero={{
      image:
        'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=1600&q=65',
      alt: '温馨的客厅',
    }}
    heroSize="standard"
    width="wide"
    cta={{
      heading: '想和 Maggie 聊聊？',
      body: '打个电话或发个微信就可以，不用提前准备。',
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
