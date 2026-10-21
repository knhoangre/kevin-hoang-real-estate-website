/**
 * A market report, in sentences.
 *
 * Pure, and checked by scripts/market-check.ts, for the same reason market.ts
 * is: these sentences are claims about a real market, and the only thing they
 * may say is what the numbers beside them say. Every sentence here names its
 * figure, its window and its property type. Nothing is described as "hot",
 * "cooling" or "a great time to buy" — those are opinions, and the reader is
 * owed the number that would justify one instead.
 *
 * Generated at RENDER time from the stored numbers, not stored with them, so a
 * wording fix reaches every published report and the numbers never change.
 */
import { formatPrice } from './listings.ts';
import {
  EDGE_RULE,
  MIN_SALES,
  TYPE_NAMES,
  activeTypes,
  addMonths,
  edge,
  freshestWindow,
  type Band,
  type Edge,
  type MarketReport,
  type MonthPoint,
  type SaleType,
  type Stats,
  type Window,
} from './market.ts';

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

/** Prices to the nearest $1,000: a median is not accurate to the dollar. */
export const money = (n: number | null): string =>
  n === null ? '—' : formatPrice(n >= 100_000 ? Math.round(n / 1000) * 1000 : Math.round(n));

/** Rents and $/sq ft to the dollar. */
export const dollars = (n: number | null): string => (n === null ? '—' : formatPrice(Math.round(n)));

/** "$1.83M", "$865k" — for tight table cells and chart labels. */
export const compactMoney = (n: number | null): string => {
  if (n === null) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2).replace(/\.?0+$/, '')}M`;
  return `$${Math.round(n / 1000)}k`;
};

/** A share: 0.4552 -> "46%". */
export const pct = (x: number | null): string => (x === null ? '—' : `${Math.round(x * 100)}%`);

/** Sale-to-asking to one decimal: 0.9986 -> "99.9%". A whole percent hides the story. */
export const ratioPct = (x: number | null): string => (x === null ? '—' : `${(x * 100).toFixed(1)}%`);

export const months1 = (x: number | null): string => (x === null ? '—' : x.toFixed(1));

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** '2026-09' -> 'September 2026'. */
export const monthName = (m: string): string => `${MONTHS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;

/** '2026-09' -> 'September'. */
export const monthOnly = (m: string): string => MONTHS[Number(m.slice(5, 7)) - 1];

/** '2026-09' -> 'Sep'. */
export const monthShort = (m: string): string => MONTHS[Number(m.slice(5, 7)) - 1].slice(0, 3);

/** '2026-10-20' -> 'October 20, 2026'. Built in UTC, like every date-only value here. */
export const dateLong = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
};

/** "the last three months", "the last twelve months". */
export const windowPhrase = (n: number): string =>
  n === 1 ? 'the month' : `the last ${({ 3: 'three', 6: 'six', 12: 'twelve' } as Record<number, string>)[n] ?? n} months`;

/** "July–September 2026", the span a window covers. */
export const windowSpan = (w: Pick<Window, 'from' | 'to'>): string => {
  const a = w.from.slice(0, 7);
  const b = w.to.slice(0, 7);
  if (a === b) return monthName(a);
  return a.slice(0, 4) === b.slice(0, 4)
    ? `${monthOnly(a)}–${monthName(b)}`
    : `${monthName(a)}–${monthName(b)}`;
};

/** "Single-family homes", "Condos" — a type as the subject of a sentence. */
export const typeSubject = (t: SaleType) => TYPE_NAMES[t].many.charAt(0).toUpperCase() + TYPE_NAMES[t].many.slice(1);

/** "the three months to September 2026". */
export const windowTo = (n: number, month: string) =>
  `the ${({ 1: 'month of', 3: 'three months to', 6: 'six months to', 12: 'twelve months to' } as Record<number, string>)[n] ?? `${n} months to`} ${monthName(month)}`;

/** A price band inside a sentence: "under $500k", "between $1M and $1.5M", "at $3M and up". */
export const bandPhrase = (b: Pick<Band, 'min' | 'max' | 'label'>) =>
  b.min === 0 ? b.label.replace(/^Under/, 'under') : b.max === null ? `at ${b.label}` : `between ${b.label.replace('–', ' and ')}`;

/** A count with its noun: 1 condo, 10 condos. */
export const count = (n: number, type: SaleType): string =>
  `${n.toLocaleString('en-US')} ${n === 1 ? TYPE_NAMES[type].one : TYPE_NAMES[type].many}`;

const plural = (n: number, one: string, many: string) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

/**
 * "up 4%", "down 12%", "about the same". Within one percent is the same: a
 * median moves by that much when one sale changes sides of it.
 */
export const change = (now: number | null, before: number | null): string | null => {
  if (now === null || before === null || before === 0) return null;
  const d = now / before - 1;
  if (Math.abs(d) < 0.01) return 'about the same';
  return `${d > 0 ? 'up' : 'down'} ${Math.round(Math.abs(d) * 100)}%`;
};

/* -------------------------------------------------------------------------- */
/* Who has the edge                                                            */
/* -------------------------------------------------------------------------- */

export const EDGE_LABEL: Record<Edge, string> = {
  sellers: 'Sellers have the edge',
  buyers: 'Buyers have room to negotiate',
  balanced: 'Close to balanced',
};

/** The rule, in words, printed wherever the verdict is. */
export const EDGE_RULE_TEXT =
  `We call it for sellers when ${pct(EDGE_RULE.sellersOver)} or more of homes sold above their final ` +
  `asking price, or the median sold above ${ratioPct(EDGE_RULE.sellersRatio)} of it; for buyers when ` +
  `the median sold at or below ${ratioPct(EDGE_RULE.buyersRatio)} and fewer than ` +
  `${pct(EDGE_RULE.buyersOver)} went over. Anything between is close to balanced.`;

/* -------------------------------------------------------------------------- */
/* The short answer                                                            */
/* -------------------------------------------------------------------------- */

export const mainType = (r: MarketReport): SaleType | null => {
  const types = activeTypes(r);
  if (types.length === 0) return null;
  // The type with the most sales leads: Cambridge is a condo market and saying
  // "single-family" first would describe one sale in eight.
  return [...types].sort((a, b) => r.windows[0].byType[b].sales - r.windows[0].byType[a].sales)[0];
};

/** One type's sale price, sale-to-asking and share over, in its freshest window. */
const typeLine = (r: MarketReport, type: SaleType, lead: boolean): string | null => {
  const w = freshestWindow(r, type);
  if (!w) return null;
  const s = w.byType[type];
  const subject = lead ? `${r.town}'s ${TYPE_NAMES[type].many}` : typeSubject(type);
  const over = s.over !== null ? `, with ${pct(s.over)} going over` : '';
  return `${lead ? `Over ${windowTo(w.months, r.month)}, ` : ''}${subject} sold for a median ${money(s.median)} — ${ratioPct(s.ratio)} of the final asking price${over}.`;
};

/**
 * The answer-first paragraph at the top of a town's page: what homes sell for,
 * against asking, and how much is for sale. Two or three sentences, every one a
 * number with its window.
 */
export const townSummary = (r: MarketReport): string => {
  const lead = mainType(r);
  if (!lead) return `Too few homes sold in ${r.town} over the last twelve months to describe the market in numbers.`;
  const others = activeTypes(r).filter((t) => t !== lead && t !== 'MF');
  const inv = r.inventory.byType[lead];
  const supply =
    inv.monthsSupply !== null
      ? ` ${count(inv.available, lead)} were for sale on ${dateLong(r.asOf)} — about ${months1(inv.monthsSupply)} months of supply at the past year's pace — and ${plural(inv.pending, 'more was', 'more were')} under agreement.`
      : '';
  return [typeLine(r, lead, true), ...others.map((t) => typeLine(r, t, false))].filter(Boolean).join(' ') + supply;
};

/* -------------------------------------------------------------------------- */
/* The month                                                                   */
/* -------------------------------------------------------------------------- */

export const lastPoint = (r: MarketReport): MonthPoint => r.series[r.series.length - 1];
export const previousPoint = (r: MarketReport): MonthPoint | null => r.series[r.series.length - 2] ?? null;

/**
 * Where a month's count sits in the year: "the most since July 2026", "the
 * fewest in the twelve months". A fact read off the series, not a seasonal
 * claim — which would need years this data does not have yet.
 */
export const rankInYear = (r: MarketReport, type: SaleType | null): string | null => {
  const counts = r.series.map((p) => (type ? p.byType[type].sales : p.all.sales));
  const now = counts[counts.length - 1];
  const earlier = counts.slice(0, -1);
  if (earlier.length < 11) return null;
  const last = earlier.length - 1;
  // The latest earlier month that matched or beat this one. Every month after
  // it was lower, which is what "the most since" says.
  const higher = earlier.map((c, i) => (c >= now ? i : -1)).filter((i) => i >= 0).pop() ?? -1;
  const lower = earlier.map((c, i) => (c <= now ? i : -1)).filter((i) => i >= 0).pop() ?? -1;
  if (higher === -1) return 'the most in twelve months';
  if (lower === -1) return 'the fewest in twelve months';
  // Beating only last month is not news.
  if (earlier[last] < now && higher < last - 1) return `the most since ${monthName(r.series[higher].month)}`;
  if (earlier[last] > now && lower < last - 1) return `the fewest since ${monthName(r.series[lower].month)}`;
  return null;
};

/** The opening paragraph of a monthly post. */
export const monthSummary = (r: MarketReport): string => {
  const p = lastPoint(r);
  const prev = previousPoint(r);
  const twelve = r.windows[0];
  const types = activeTypes(r).filter((t) => p.byType[t].sales > 0);
  const parts = types.map((t) => count(p.byType[t].sales, t));
  const list =
    parts.length > 1
      ? `: ${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
      : types.length === 1 && p.all.sales > 1
        ? `, all of them ${TYPE_NAMES[types[0]].many}`
        : '';
  const rank = rankInYear(r, null);
  const sentences = [
    `${plural(p.all.sales, 'home', 'homes')} sold in ${r.town} in ${monthName(r.month)}${list}${rank ? ` — ${rank}` : ''}.`,
  ];

  const lead = mainType(r);
  if (lead) {
    const s = p.byType[lead];
    if (s.median !== null) {
      const vsPrev = change(s.median, prev?.byType[lead].median ?? null);
      const vs12 = change(s.median, twelve.byType[lead].median);
      const comparisons = [
        vsPrev && prev ? `${vsPrev} on ${monthOnly(prev.month)}` : null,
        vs12 ? `${vs12} against the twelve-month median of ${money(twelve.byType[lead].median)}` : null,
      ].filter(Boolean);
      sentences.push(
        `The median ${TYPE_NAMES[lead].one} sold for ${money(s.median)}${comparisons.length ? `, ${comparisons.join(' and ')}` : ''}.`
      );
    }
    if (s.ratio !== null && s.over !== null) {
      sentences.push(
        `${pct(s.over)} sold above their final asking price, and the median sold at ${ratioPct(s.ratio)} of it.`
      );
    }
  }
  const ya = r.yearAgo.month;
  if (ya && ya.all.sales > 0) {
    sentences.push(
      `A year earlier, in ${monthName(ya.month)}, ${plural(ya.all.sales, 'home', 'homes')} sold${
        lead && ya.byType[lead].median !== null && p.byType[lead].median !== null
          ? ` and the median ${TYPE_NAMES[lead].one} went for ${money(ya.byType[lead].median)}`
          : ''
      }.`
    );
  }
  return sentences.join(' ');
};

/** What moved between the month and the one before it, one line a type. */
export const monthChanges = (r: MarketReport): string[] => {
  const p = lastPoint(r);
  const prev = previousPoint(r);
  if (!prev) return [];
  const lines: string[] = [];
  for (const t of activeTypes(r)) {
    const a = p.byType[t];
    const b = prev.byType[t];
    if (a.sales === 0) continue;
    const bits = [`${a.sales} closed, against ${b.sales} in ${monthOnly(prev.month)}`];
    const rank = rankInYear(r, t);
    if (rank) bits[0] += ` (${rank})`;
    const med = change(a.median, b.median);
    if (med) bits.push(`the median price was ${med} at ${money(a.median)}`);
    if (a.over !== null && b.over !== null) {
      const pts = Math.round((a.over - b.over) * 100);
      bits.push(
        pts === 0
          ? `the share selling over asking held at ${pct(a.over)}`
          : `the share selling over asking ${pts > 0 ? 'rose' : 'fell'} from ${pct(b.over)} to ${pct(a.over)}`
      );
    }
    lines.push(`${TYPE_NAMES[t].short}: ${bits.join('; ')}.`);
  }
  return lines;
};

/* -------------------------------------------------------------------------- */
/* Buying and selling                                                          */
/* -------------------------------------------------------------------------- */

/** Bands with enough closings to compare. */
const solidBands = (r: MarketReport): Band[] => r.bands.filter((b) => b.sales >= MIN_SALES * 2 && b.over !== null);

const bandExtremes = (r: MarketReport) => {
  const bands = solidBands(r);
  if (bands.length < 2) return null;
  const byOver = [...bands].sort((a, b) => (b.over as number) - (a.over as number));
  return { hottest: byOver[0], coolest: byOver[byOver.length - 1] };
};

const competitionLine = (r: MarketReport, type: SaleType, s: Stats, w: Window): string | null => {
  if (s.over === null || s.ratio === null) return null;
  const span = `over ${windowPhrase(w.months)}`;
  const premium = s.premium !== null ? `, typically by ${money(s.premium)}` : '';
  switch (edge(s)) {
    case 'sellers':
      return `Expect competition for ${TYPE_NAMES[type].many}: ${span}, ${pct(s.over)} sold above their final asking price${premium}. On many of them, the asking price was not what it took.`;
    case 'buyers':
      return `There has been room to negotiate on ${TYPE_NAMES[type].many}: ${span} the median sold at ${ratioPct(s.ratio)} of its final asking price, and only ${pct(s.over)} went over.`;
    default:
      return `${typeSubject(type)} have sold close to asking ${span} — a median ${ratioPct(s.ratio)} of the final asking price — with ${pct(s.over)} going over${premium}. That varies from home to home and from one price range to the next.`;
  }
};

export const buyerTakeaways = (r: MarketReport): string[] => {
  const out: string[] = [];
  for (const t of activeTypes(r).filter((x) => x !== 'MF').slice(0, 2)) {
    const w = freshestWindow(r, t);
    if (w) {
      const line = competitionLine(r, t, w.byType[t], w);
      if (line) out.push(line);
    }
  }

  const ex = bandExtremes(r);
  if (ex && (ex.hottest.over as number) - (ex.coolest.over as number) >= 0.15) {
    out.push(
      `Competition depends on price. Over the last twelve months ${pct(ex.hottest.over)} of homes ${bandPhrase(ex.hottest)} sold over asking; ${bandPhrase(ex.coolest)} only ${pct(ex.coolest.over)} did` +
        (ex.coolest.monthsSupply !== null ? `, and there are ${months1(ex.coolest.monthsSupply)} months of homes for sale there.` : '.')
    );
  }

  const lead = mainType(r);
  if (lead) {
    const inv = r.inventory.byType[lead];
    if (inv.fresh !== null && inv.available >= MIN_SALES) {
      const older = inv.available - inv.fresh;
      const cuts =
        inv.cuts > 0
          ? ` ${inv.cuts} of the ${inv.available} cut their price in the last 30 days${inv.cutSize !== null ? `, typically by ${pct(inv.cutSize)}` : ''}.`
          : '';
      out.push(
        `Of the ${count(inv.available, lead)} for sale on ${dateLong(r.asOf)}, ${older} have been listed for more than 30 days.${cuts} A listing that has sat is where an offer under asking is most often heard.`
      );
    }
  }
  return out;
};

export const sellerTakeaways = (r: MarketReport): string[] => {
  const out: string[] = [];
  const lead = mainType(r);
  if (!lead) return out;
  const w = freshestWindow(r, lead);
  const s = w?.byType[lead];

  if (w && s && s.ratio !== null) {
    out.push(
      `${typeSubject(lead)} sold at a median ${ratioPct(s.ratio)} of their final asking price over ${windowPhrase(w.months)}${
        s.under !== null ? `, and ${pct(s.under)} sold below it` : ''
      }. That is against the LAST asking price: a home cut before it sold is counted against the lower one, so the price you start at matters more than this number suggests.`
    );
  }

  const inv = r.inventory.byType[lead];
  if (w && s && s.ppsf !== null && inv.askPpsf !== null) {
    // Only when asking is ABOVE what was paid. The gap is partly which homes are
    // for sale — the priciest sit longest, so inventory skews toward them — and
    // in the other direction that skew is most of the story, not a finding.
    const gap = inv.askPpsf / s.ppsf - 1;
    if (gap >= 0.05) {
      out.push(
        `${typeSubject(lead)} for sale now ask a median ${dollars(inv.askPpsf)} a square foot, against ${dollars(s.ppsf)} paid over ${windowPhrase(w.months)} — ${pct(gap)} more. Part of that is which homes are for sale, since the priciest tend to sit longest; but a listing asking well above what buyers have recently paid is the one most likely to cut.`
      );
    }
  }

  if (inv.monthsSupply !== null) {
    out.push(
      `Your competition: ${count(inv.available, lead)} for sale and ${inv.pending} under agreement${
        inv.pendingShare !== null ? ` (${pct(inv.pendingShare)} of the market already has a buyer)` : ''
      }. At the past year's pace the homes for sale would take about ${months1(inv.monthsSupply)} months to sell.`
    );
  }

  const slow = solidBands(r)
    .filter((b) => b.monthsSupply !== null)
    .sort((a, b) => (b.monthsSupply as number) - (a.monthsSupply as number))[0];
  if (slow && inv.monthsSupply !== null && (slow.monthsSupply as number) >= inv.monthsSupply * 1.5) {
    out.push(
      `Homes ${bandPhrase(slow)} sell more slowly: ${slow.available} homes for sale against ${slow.sales} sold in twelve months, or ${months1(slow.monthsSupply)} months of supply. Expect a longer sale there.`
    );
  }

  const peak = [...r.series].sort((a, b) => b.byType[lead].sales - a.byType[lead].sales)[0];
  const trough = [...r.series].sort((a, b) => a.byType[lead].sales - b.byType[lead].sales)[0];
  if (peak && trough && peak.byType[lead].sales >= trough.byType[lead].sales * 2) {
    out.push(
      `Timing: the most ${TYPE_NAMES[lead].many} closed in ${monthName(peak.month)} (${peak.byType[lead].sales}) and the fewest in ${monthName(trough.month)} (${trough.byType[lead].sales}). A closing follows the accepted offer by several weeks, so a busy month for closings reflects offers made the month or two before.`
    );
  }
  return out;
};

/* -------------------------------------------------------------------------- */
/* Titles                                                                      */
/* -------------------------------------------------------------------------- */

export const townTitle = (r: Pick<MarketReport, 'town'>) => `${r.town}, MA Housing Market: Prices, Trends and Inventory`;

export const monthTitle = (r: Pick<MarketReport, 'town' | 'month'>) =>
  `${r.town} Real Estate Market Report: ${monthName(r.month)}`;

/** The monthly post's meta description: its own numbers, under ~160 characters. */
export const monthDescription = (r: MarketReport): string => {
  const p = lastPoint(r);
  const lead = mainType(r);
  const s = lead ? p.byType[lead] : null;
  const bits = [`${plural(p.all.sales, 'home', 'homes')} sold in ${r.town}, MA in ${monthName(r.month)}`];
  if (lead && s?.median !== null && s) bits.push(`median ${TYPE_NAMES[lead].one} ${money(s.median)}`);
  if (s?.over !== null && s) bits.push(`${pct(s.over)} over asking`);
  return `${bits.join('; ')}. Prices, sale-to-list, inventory and rents from MLS data.`;
};

export const townDescription = (r: MarketReport): string => {
  const lead = mainType(r);
  const s = lead ? r.windows[0].byType[lead] : null;
  const inv = lead ? r.inventory.byType[lead] : null;
  const bits = [
    `${r.town}, MA home prices, sale-to-list and inventory over 12, 6 and 3 months`,
    lead && s?.median ? `median ${TYPE_NAMES[lead].one} ${money(s.median)}` : null,
    inv?.monthsSupply !== null && inv ? `${months1(inv.monthsSupply)} months of supply` : null,
  ].filter(Boolean);
  return `${bits.join('; ')}. Updated monthly from MLS data.`;
};

/** The month after `m`, for "going into October". */
export const nextMonthName = (m: string) => monthOnly(addMonths(m, 1));
