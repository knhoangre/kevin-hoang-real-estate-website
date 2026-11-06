/**
 * The Chinese route tree and its pairing with the English pages.
 *
 * The same arrangement as viRoutes.ts, and for the same reason: copy swapped in
 * after hydration is never seen by a crawler, so these are real prerendered
 * routes. Slugs are pinyin, written so they cannot be misread: "mai fang" is both
 * 买房 and 卖房, so buying is goufang and selling is shoufang.
 *
 * Adding a route here is not enough on its own. It also needs an entry in
 * src/AppRoutes.tsx and in scripts/routes.mjs, or it has no prerendered file and
 * 404s on hard refresh.
 */
export interface ZhRoute {
  /** Chinese path. */
  zh: string;
  /** The English page this pairs with. Every route has one since 2026-11-06. */
  en?: string;
  /** Chinese link label, for the menu and the footer. Literal, never t(). */
  label: string;
}

export const ZH_ROUTES: ZhRoute[] = [
  { zh: '/zh', en: '/', label: '首页' },
  { zh: '/zh/maggie-li', en: '/maggie-li', label: '认识 Maggie' },
  { zh: '/zh/zhongwen-fuwu', en: '/chinese-speaking-real-estate-agent', label: '中文服务' },
  { zh: '/zh/goufang', en: '/buyer', label: '购房指南' },
  { zh: '/zh/shoufang', en: '/seller', label: '售房指南' },
  { zh: '/zh/shouci-goufang', en: '/first-time-buyers', label: '首次购房' },
  { zh: '/zh/gujia', en: '/home-valuation', label: '房屋估价' },
  { zh: '/zh/quyu', en: '/neighborhoods', label: '城镇指南' },
  { zh: '/zh/banjia-mazhou', en: '/relocation', label: '搬到麻州' },
  { zh: '/zh/jisuanqi', en: '/calculator', label: '计算器' },
  { zh: '/zh/changjian-wenti', en: '/faq', label: '常见问题' },
  { zh: '/zh/wenzhang', en: '/blog', label: '文章' },
  { zh: '/zh/pingjia', en: '/testimonials', label: '客户评价' },
  { zh: '/zh/guanyu', en: '/about', label: '关于本站' },
  { zh: '/zh/lianxi', en: '/contact', label: '联系方式' },
  // Added 2026-11-06 so every row of the menu has all three languages.
  { zh: '/zh/shichang', en: '/market', label: '市场报告' },
  { zh: '/zh/yuenanyu-fuwu', en: '/vietnamese-speaking-real-estate-agent', label: '越南语服务' },
];

/** Each town guide is `/neighborhoods/<slug>` and `/zh/quyu/<slug>`. */
const TOWN_EN = /^\/neighborhoods\/([^/]+)$/;
const TOWN_ZH = /^\/zh\/quyu\/([^/]+)$/;

/** True anywhere in the Chinese tree. Pure, so safe during render and at build. */
export const isZhPath = (pathname: string) =>
  pathname === '/zh' || pathname.startsWith('/zh/');

/** `{ zh, en }` for a path on either side of a Chinese pair, or undefined. */
export const zhPairFor = (path: string): { zh: string; en?: string } | undefined => {
  const town = path.match(TOWN_EN) ?? path.match(TOWN_ZH);
  if (town) return { zh: `/zh/quyu/${town[1]}`, en: `/neighborhoods/${town[1]}` };
  return ZH_ROUTES.find((r) => r.zh === path || r.en === path);
};
