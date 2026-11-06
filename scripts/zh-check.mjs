/**
 * Checks the BUILT Chinese pages, for what cannot be seen from the source and
 * what nobody here can read: every /zh page must say it is Chinese, reach Maggie
 * Li, name both brokerages, and never say Kevin speaks Chinese.
 *
 *   npm run build, then: node scripts/zh-check.mjs
 *
 * Exits non-zero on failure, like the other checks. It reads dist/ and imports
 * nothing, so it runs on the host with plain node.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TOWN_SLUGS, ORIGIN } from './routes.mjs';

const MAGGIE_TEL = 'tel:+1-774-222-0952';
const KEVIN_TEL = 'tel:+1-860-682-2251';

const STATIC_PAGES = [
  '/zh',
  '/zh/maggie-li',
  '/zh/zhongwen-fuwu',
  '/zh/goufang',
  '/zh/shoufang',
  '/zh/shouci-goufang',
  '/zh/gujia',
  '/zh/changjian-wenti',
  '/zh/guanyu',
  '/zh/banjia-mazhou',
  '/zh/pingjia',
  '/zh/jisuanqi',
  '/zh/lianxi',
  '/zh/wenzhang',
  '/zh/quyu',
  '/zh/shichang',
  '/zh/yuenanyu-fuwu',
];
const PAGES = [...STATIC_PAGES, ...TOWN_SLUGS.map((slug) => `/zh/quyu/${slug}`)];

/**
 * Pages with no English partner, which declare no language set. None since
 * 2026-11-06, when /zh/maggie-li gained /maggie-li and /vi/maggie-li.
 */
const UNPAIRED = new Set([]);
/** About Kevin, so his name and card rather than hers. */
const ABOUT_KEVIN = new Set(['/zh/guanyu', '/zh/pingjia', '/zh/yuenanyu-fuwu']);
/** The one page that is about Kevin, and so may give his number. */
const MAY_NAME_KEVINS_NUMBER = new Set(['/zh/guanyu']);

/** The English chrome, which on these pages would mean a branch was missed. */
const ENGLISH_CHROME = [
  'Send a message',
  'Book a consultation',
  'Set an appointment',
  'Show more',
  'All rights reserved',
  'Reading in English',
  'Written by',
  'Common questions about',
  'at a glance',
  'Other towns nearby',
  'Exit menu',
];

/**
 * Maggie read the pages on 2026-10-31 and found the explaining strange: how she
 * and Kevin are connected, that he does not speak Chinese, why a page exists, that
 * everyone is welcome. The rest are mistranslations found while checking for more:
 * Newton's villages are not 村, mid-century is not 中世纪 (medieval), and "the most
 * expensive mistake" is English. Nobody else here reads Chinese, so this is what
 * keeps them from coming back.
 */
const REJECTED_WORDING = [
  '是什么关系',
  '不讲中文',
  '分属不同的经纪公司',
  '这个页面存在',
  '欢迎所有客户',
  '村区',
  '中世纪',
  '最昂贵',
];

const fileFor = (path) =>
  join('dist', path === '/' ? 'index.html' : `${path.replace(/^\//, '')}/index.html`);

const read = (path) => {
  const file = fileFor(path);
  return existsSync(file) ? readFileSync(file, 'utf8') : null;
};

/** The visible page: no head, no scripts, no tags. */
const bodyText = (html) =>
  html
    .replace(/^[\s\S]*?<body[^>]*>/, '')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');

const headings = (html, tag) =>
  [...html.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'g'))].map((m) =>
    m[1].replace(/<[^>]+>/g, '').trim()
  );

const hreflangs = (html) => {
  const out = {};
  for (const tag of html.match(/<link[^>]*rel="alternate"[^>]*>/g) ?? []) {
    const lang = tag.match(/hrefLang="([^"]+)"|hreflang="([^"]+)"/i);
    const href = tag.match(/href="([^"]+)"/);
    if (lang && href) out[lang[1] ?? lang[2]] = href[1].replace(ORIGIN, '') || '/';
  }
  return out;
};

const failures = [];
const fail = (path, message) => failures.push(`${path}: ${message}`);

const h1s = new Map();
const h2s = new Map();
const sitemap = existsSync('dist/sitemap.xml') ? readFileSync('dist/sitemap.xml', 'utf8') : '';
const llms = existsSync('dist/llms.txt') ? readFileSync('dist/llms.txt', 'utf8') : '';

if (!sitemap) failures.push('dist/sitemap.xml: missing. Run `npm run build` first.');

for (const path of PAGES) {
  const html = read(path);
  if (!html) {
    fail(path, 'no prerendered file, so it 404s on a hard refresh');
    continue;
  }
  const text = bodyText(html);
  const htmlTag = html.match(/<html[^>]*>/)?.[0] ?? '';

  if (!/lang="zh-Hans"/.test(htmlTag)) fail(path, `<html> is not zh-Hans: ${htmlTag}`);
  if ((htmlTag.match(/\blang=/g) ?? []).length !== 1) fail(path, `<html> has more than one lang: ${htmlTag}`);

  if (!html.includes(MAGGIE_TEL)) fail(path, "no link to Maggie's phone");
  if (!text.includes('William Raveis Real Estate')) fail(path, "does not name Maggie's brokerage");
  if (!text.includes('LPT Realty')) fail(path, "does not name Kevin's brokerage");
  if (!MAY_NAME_KEVINS_NUMBER.has(path) && html.includes(KEVIN_TEL)) {
    fail(path, "links to Kevin's phone, who does not speak Chinese");
  }

  // Kevin, in one sentence, with a language he does not speak or a service he
  // cannot give in it.
  for (const sentence of text.split(/[。！？]/)) {
    if (!/Kevin/.test(sentence)) continue;
    if (/(讲|说|会|用)(中文|普通话|粤语)/.test(sentence)) {
      fail(path, `says Kevin works in Chinese: "${sentence.trim()}"`);
    }
    if (/Kevin[^，]{0,10}(会解释|解释|帮您|为您|回复您|联系您|陪您|代表您)/.test(sentence)) {
      fail(path, `says Kevin will do something for a Chinese reader: "${sentence.trim()}"`);
    }
  }

  for (const phrase of ENGLISH_CHROME) {
    if (text.includes(phrase)) fail(path, `English chrome: "${phrase}"`);
  }
  for (const phrase of REJECTED_WORDING) {
    if (text.includes(phrase)) fail(path, `wording Maggie found strange, or a mistranslation: "${phrase}"`);
  }

  if (!html.includes('bg-ink-deep')) fail(path, 'no dark hero, but hasDarkHero says it has one');

  // What makes Maggie show up: her name in the title, her card when shared, her
  // business in the page's data, and a page that opens in mainland China.
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/)?.[1] ?? '';
  if (!ABOUT_KEVIN.has(path) && !title.includes('Maggie Li')) fail(path, `title does not name her: ${title}`);
  if (!ABOUT_KEVIN.has(path) && !html.includes('/og-zh.jpg')) fail(path, 'does not share as the Chinese card');
  if (!html.includes('https://maggieli.co/#agent')) fail(path, 'her business is not in the schema');
  if (!html.includes('"inLanguage":"zh-Hans"')) fail(path, 'its schema does not say it is in Chinese');
  if (/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/.test(html.replace(/<noscript>[\s\S]*?<\/noscript>/g, '').replace(/<link[^>]*media="print"[^>]*>/g, ''))) {
    fail(path, 'still waits on Google Fonts, which is blocked in mainland China');
  }
  if (!html.includes('1229 Centre St, Newton Centre, MA 02459')) fail(path, 'her address, as on her Google profile, is not on the page');
  if (!html.includes('公平住房机会')) fail(path, 'no Equal Housing Opportunity line');

  // Enough of the page is actually Chinese. /zh/pingjia is mostly Kevin's reviews,
  // in English on purpose, so less of it is; Chinese filler would be worse.
  const chinese = (text.match(/[一-鿿]/g) ?? []).length;
  const floor = path === '/zh/pingjia' ? 250 : 400;
  if (chinese < floor) fail(path, `only ${chinese} Chinese characters: thin, or a page of English`);

  if (!sitemap.includes(`${ORIGIN}${path}<`)) fail(path, 'not in the sitemap');
  if (!llms.includes(`${ORIGIN}${path})`) && !['/zh/guanyu', '/zh/pingjia', '/zh/wenzhang'].includes(path)) {
    fail(path, 'not in llms.txt');
  }

  const set = hreflangs(html);
  if (UNPAIRED.has(path)) {
    if (Object.keys(set).length) fail(path, 'has a language set but no English pair');
  } else {
    if (set.zh !== path) fail(path, `its hreflang set does not list itself: ${JSON.stringify(set)}`);
    if (!set.en) fail(path, 'its hreflang set has no English member');
    if (set['x-default'] !== set.en) fail(path, 'x-default is not the English member');
    // Every member lists the same set, or search engines throw the set away.
    for (const [lang, member] of Object.entries(set)) {
      if (lang === 'x-default' || member === path) continue;
      const other = read(member);
      if (!other) {
        fail(path, `its ${lang} partner ${member} has no file`);
        continue;
      }
      if (hreflangs(other).zh !== path) fail(path, `${member} does not list it back`);
    }
  }

  const h1 = headings(html, 'h1');
  if (h1.length !== 1) fail(path, `${h1.length} h1s`);
  for (const h of h1) h1s.set(h, [...(h1s.get(h) ?? []), path]);
  for (const h of new Set(headings(html, 'h2'))) h2s.set(h, [...(h2s.get(h) ?? []), path]);
}

for (const [heading, paths] of h1s) {
  if (paths.length > 1) failures.push(`same h1 on ${paths.join(', ')}: "${heading}"`);
}
for (const [heading, paths] of h2s) {
  if (paths.length > 1) failures.push(`same h2 on ${paths.join(', ')}: "${heading}"`);
}

// The English pair exists, and English pages point at the Chinese tree.
const english = read('/chinese-speaking-real-estate-agent');
if (!english) failures.push('/chinese-speaking-real-estate-agent: no prerendered file');
else if (!english.includes(MAGGIE_TEL)) failures.push("/chinese-speaking-real-estate-agent: no link to Maggie's phone");
const home = read('/');
if (home && hreflangs(home).zh !== '/zh') failures.push('/: its hreflang set does not list /zh');
if (home && !/<html[^>]*lang="en"/.test(home)) failures.push('/: <html> is not lang="en"');
if (!existsSync('dist/og-zh.jpg')) failures.push('dist/og-zh.jpg: the Chinese share card is missing');
const profile = read('/zh/maggie-li');
if (profile && !profile.includes('"ProfilePage"')) failures.push('/zh/maggie-li: no ProfilePage schema');
const vi = read('/vi');
if (vi && !/<html[^>]*lang="vi"/.test(vi)) failures.push('/vi: <html> is not lang="vi"');

if (failures.length) {
  console.error(`zh-check: ${failures.length} failure(s)\n`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`zh-check: ${PAGES.length} Chinese pages pass.`);
