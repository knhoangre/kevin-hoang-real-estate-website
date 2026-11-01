/**
 * The Vietnamese route tree and its pairing with the English pages.
 *
 * Why these exist as real prerendered routes rather than the language toggle:
 * the toggle swaps copy AFTER hydration, so not one word of Vietnamese was in
 * any prerendered document. No crawler and no answer engine had ever seen it.
 * For a genuine differentiator in a market with almost no Vietnamese-language
 * real estate content, that was the largest single gap on the site.
 *
 * ONE SOURCE FOR THE PAIRING. hreflang only works when it is reciprocal —
 * every page in a set must list every member including itself, or the set is
 * discarded. Deriving both sides from this map is what makes that structurally
 * true rather than something to remember.
 *
 * Adding a route here is not enough on its own. It also needs an entry in
 * src/AppRoutes.tsx and in scripts/routes.mjs, or it has no prerendered file
 * and 404s on hard refresh.
 */
import { zhPairFor } from './zhRoutes';

export interface ViRoute {
  /** Vietnamese path. */
  vi: string;
  /** The English page this is the Vietnamese counterpart of. */
  en: string;
  /**
   * Vietnamese link label, for the footer column.
   *
   * It lives here rather than in Footer.tsx for the same reason the pairing
   * does: this is the one place the Vietnamese tree is described, so a route
   * added here arrives in the footer's crawlable link graph automatically
   * instead of being remembered into it. It must NOT go through `t()` — i18n is
   * pinned to `lng: 'en'` during static generation, so a translated label would
   * prerender in English on every page.
   */
  label: string;
}

export const VI_ROUTES: ViRoute[] = [
  { vi: '/vi', en: '/', label: 'Trang chủ' },
  { vi: '/vi/mua-nha', en: '/buyer', label: 'Mua nhà' },
  { vi: '/vi/ban-nha', en: '/seller', label: 'Bán nhà' },
  { vi: '/vi/dinh-gia-nha', en: '/home-valuation', label: 'Định giá nhà' },
  { vi: '/vi/cau-hoi-thuong-gap', en: '/faq', label: 'Câu hỏi thường gặp' },
  { vi: '/vi/khu-vuc', en: '/neighborhoods', label: 'Khu vực phục vụ' },
  { vi: '/vi/gioi-thieu', en: '/about', label: 'Về Kevin' },
  { vi: '/vi/chuyen-den-massachusetts', en: '/relocation', label: 'Chuyển đến Massachusetts' },
  { vi: '/vi/danh-gia', en: '/testimonials', label: 'Khách hàng nói gì' },
  { vi: '/vi/cong-cu-tinh-toan', en: '/calculator', label: 'Công cụ tính toán' },
  { vi: '/vi/lien-he', en: '/contact', label: 'Liên hệ' },
  // Added 2026-09-27, filling the two rows of the paired menu that had nothing
  // on the Vietnamese side.
  { vi: '/vi/bai-viet', en: '/blog', label: 'Bài viết' },
  { vi: '/vi/dich-vu-tieng-viet', en: '/vietnamese-speaking-real-estate-agent', label: 'Dịch vụ tiếng Việt' },
];

/**
 * Every language version of a path, including the path itself, or undefined if
 * it has none. Whichever side it is asked from, the answer goes through the
 * English page, so English, Vietnamese and Chinese all list the same set: a set
 * that is not reciprocal is ignored.
 *
 * `zh`, not `zh-Hans`, though the pages are Simplified: there is one Chinese
 * version, and `zh-Hans` would tell Google it is not for someone searching in
 * Traditional characters.
 */
export const alternatesFor = (path: string): Record<string, string> | undefined => {
  const en =
    VI_ROUTES.find((r) => r.vi === path || r.en === path)?.en ?? zhPairFor(path)?.en;
  if (!en) return undefined;
  const vi = VI_ROUTES.find((r) => r.en === en)?.vi;
  const zh = zhPairFor(en)?.zh;
  if (!vi && !zh) return undefined;
  return { en, ...(vi ? { vi } : {}), ...(zh ? { zh } : {}) };
};
