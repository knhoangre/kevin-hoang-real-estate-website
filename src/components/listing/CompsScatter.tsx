/**
 * The comps, drawn — floor area against what each one actually sold for.
 *
 * WHY THIS CHART AND NOT A HISTOGRAM OR A PRICE STRIP. The reader's question is
 * not "what do houses cost round here", it is "is THIS price sensible". That is
 * a question about one point against a relationship, so the chart has to show
 * the relationship: the real closings, and the subject sitting above or below
 * them. A histogram of prices hides the subject inside a bar; a one-dimensional
 * strip shows the answer with none of the working. This shows the working,
 * which is the entire brief — the estimate is only as trustworthy as the
 * evidence a reader can see for themselves.
 *
 * RAW SALE PRICES, NOT ADJUSTED ONES. The dots are what those houses genuinely
 * closed at. Plotting adjusted prices would draw a tighter, prettier cloud that
 * no longer corresponds to any transaction, and would quietly fold the model's
 * own assumptions into the picture offered as evidence for them. The adjustment
 * is shown per-comp in the table below the chart, where it can be read as
 * arithmetic rather than absorbed as shape.
 *
 * HAND-ROLLED SVG RATHER THAN RECHARTS, on four counts. recharts is in the
 * dependency list but imported only by the admin-only, lazily split
 * CRMDashboard, so reaching for it here drops the whole library into a public
 * route's chunk. Its ResponsiveContainer measures DOM width, so it renders
 * empty on first paint and on paper. A viewBox scales without measuring
 * anything. And five points is not a charting problem.
 * The precedent is already in this folder: ListingPayment draws its cost split
 * as a plain flex bar with role="img" and an enumerated aria-label.
 *
 * COLOUR. Champagne is a NON-TEXT MARK here, which is the one thing it is
 * allowed to be on a light surface — it measures 2.33:1 on white and fails WCAG
 * at every size as text. Every label in this component is text-ink,
 * text-champagne-ink or text-gray-600, and no third accent is invented: the
 * ramp is the one ListingPayment already established.
 *
 * THE LEGEND IS ABOVE THE CHART AND SAYS WHAT EACH MARK MEANS. It was one line
 * of small type under the chart, naming four of the five marks in two words
 * each, and Kevin read the chart on 2026-10-30 without knowing what the circles
 * and lines were. Each entry draws its mark with the same values as the chart
 * and states the figure it stands for.
 *
 * EVERY DOT IS A REAL LINK TO ITS LISTING, in a new tab, so a reader can compare
 * the two side by side rather than pressing Back between them. Pointing at a
 * dot shows the house; on a phone, where nothing can be pointed at, the first
 * tap shows it and a second opens it. The svg was role="img", which hides its
 * children from a screen reader, so with links in it it is a labelled group.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { useOfficeName } from '@/hooks/useOfficeName';
import { listingByMls, photoUrl } from '@/lib/idxSearch';
import { formatBaths, formatPrice, formatSoldMonth } from '@/lib/listings';
import { listingPath } from '@/lib/listingUrl';
import type { AdjustedComp } from '@/lib/valuation';

interface Props {
  comps: AdjustedComp[];
  /** Floor area of the subject, square feet. */
  subjectArea: number;
  /** What the subject is asking. Null on a listing with no price. */
  askingPrice: number | null;
  /** The estimate and its range. `estimate` is null when it was withheld. */
  estimate: number | null;
  low: number;
  high: number;
  subjectLabel: string;
  /** A comp row carries no state; every comp query is filtered to the subject's. */
  subjectState: string | null;
}

/*
 * One viewBox width, and two sets of proportions. The svg scales to fit, which on
 * a phone is about half size: thirteen-unit labels came out at six pixels and a
 * dot at two and a half, too small to read or to tap. So under PHONE_WIDTH the
 * marks and labels are drawn larger (`k`) in a taller box.
 */
const W = 720;
const PHONE_WIDTH = '(max-width: 520px)';
const LAYOUTS = {
  normal: { k: 1, H: 380, M: { top: 30, right: 18, bottom: 46, left: 74 } },
  phone: { k: 1.8, H: 470, M: { top: 50, right: 36, bottom: 80, left: 100 } },
};

/** "$1.2M" / "$840k". Axis ticks have no room for a grouped full figure. */
const compactPrice = (n: number): string =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
    : `$${Math.round(n / 1000)}k`;

/**
 * A "nice" axis domain — rounded outward to readable round numbers.
 *
 * Without this the axis reads $847,312 to $2,113,908 and every tick is noise.
 */
const niceScale = (min: number, max: number, ticks = 5) => {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
    const pad = Math.abs(min) * 0.1 || 1;
    return { min: min - pad, max: max + pad, step: pad };
  }
  const raw = (max - min) / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  return { min: Math.floor(min / step) * step, max: Math.ceil(max / step) * step, step };
};

/*
 * One set of values for a mark's look, read by the chart and the legend alike,
 * so a key cannot describe a mark that is drawn differently.
 */
const DOT = { fillClass: 'fill-champagne', stroke: '#8c6b35', strokeWidth: 0.75 };
const dotOpacity = (share: number) => 0.35 + Math.min(share, 1) * 0.5;
const RANGE_OPACITY = 0.18;
const GUIDE = { stroke: '#0d0d0f', strokeDasharray: '3 3', opacity: 0.45 };
const diamond = (x: number, y: number, r: number) =>
  `M ${x} ${y - r} L ${x + r} ${y} L ${x} ${y + r} L ${x - r} ${y} Z`;

const LegendEntry = ({ mark, children }: { mark: ReactNode; children: ReactNode }) => (
  <li className="flex items-start gap-3">
    <svg viewBox="0 0 28 18" className="mt-0.5 h-[18px] w-7 shrink-0" aria-hidden>
      {mark}
    </svg>
    <span>{children}</span>
  </li>
);

/*
 * The house behind a dot.
 *
 * Centred on the dot and held inside the chart by CSS alone (`clamp` on a
 * percentage of the chart's width), so nothing has to be measured. It goes below
 * a dot in the top half and above one in the bottom half, so it never covers the
 * dot it describes, and it is a link too, because that is where the pointer goes
 * next.
 *
 * It names the listing office because a photo and a price are an IDX display
 * wherever they appear, and the comp row has no office in it. So the listing is
 * asked for once, when a card first opens; a failure just leaves the line off.
 */
const CARD_WIDTH_REM = 19;

const CompCard = ({
  comp,
  href,
  left,
  top,
  onEnter,
  onLeave,
}: {
  comp: AdjustedComp;
  href: string;
  /** The dot's position, as a percentage of the chart's width and height. */
  left: number;
  top: number;
  onEnter: () => void;
  onLeave: () => void;
}) => {
  const { data: listing } = useQuery({
    queryKey: ['comp-listing', comp.mls_number],
    queryFn: () => listingByMls(comp.mls_number),
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const office = useOfficeName(listing?.list_office_id);
  const sold = formatSoldMonth(comp.settled_date);
  const specs = [
    comp.bedrooms !== null ? `${comp.bedrooms} ${comp.bedrooms === 1 ? 'bed' : 'beds'}` : null,
    comp.full_baths !== null
      ? `${formatBaths(comp.full_baths, comp.half_baths)} ${comp.full_baths + (comp.half_baths ?? 0) === 1 ? 'bath' : 'baths'}`
      : null,
    comp.living_area ? `${comp.living_area.toLocaleString()} sq ft` : null,
  ].filter(Boolean);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      // The dot it belongs to is the same link, and the one a keyboard stops on.
      tabIndex={-1}
      data-comp
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      style={{
        width: `${CARD_WIDTH_REM}rem`,
        left: `clamp(0px, calc(${left}% - ${CARD_WIDTH_REM / 2}rem), calc(100% - ${CARD_WIDTH_REM}rem))`,
        ...(top > 50 ? { bottom: `calc(${100 - top}% + 14px)` } : { top: `calc(${top}% + 14px)` }),
      }}
      className="absolute z-20 flex max-w-full overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-lg transition-colors hover:border-champagne-ink"
    >
      <span className="block w-28 shrink-0 bg-gray-100">
        {(comp.photo_count ?? 0) > 0 ? (
          <img
            src={photoUrl(comp.mls_number, 0, 'card')}
            alt=""
            className="h-full w-full object-cover"
            decoding="async"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-xs text-gray-400">
            No photo
          </span>
        )}
      </span>
      <span className="block min-w-0 p-3">
        <span className="numeral block text-base font-bold text-ink">
          {formatPrice(comp.sale_price)}
        </span>
        {sold && (
          <span className="numeral block text-[11px] font-semibold uppercase tracking-wide text-champagne-ink">
            Sold {sold}
          </span>
        )}
        <span className="mt-1 block text-sm leading-snug text-ink">
          {comp.address ?? `MLS ${comp.mls_number}`}
          {comp.town ? `, ${comp.town}` : ''}
        </span>
        {specs.length > 0 && (
          <span className="numeral mt-1 block text-xs text-gray-600">{specs.join(' · ')}</span>
        )}
        {office && <span className="mt-1 block truncate text-xs text-gray-500">Courtesy of {office}</span>}
        <span className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-champagne-ink">
          Open in a new tab
          <ExternalLink className="h-3 w-3" aria-hidden />
        </span>
      </span>
    </a>
  );
};

const CompsScatter = ({
  comps,
  subjectArea,
  askingPrice,
  estimate,
  low,
  high,
  subjectLabel,
  subjectState,
}: Props) => {
  const id = useId();

  const [active, setActive] = useState<number | null>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const pressedWith = useRef<{ pointer: string; wasOpen: boolean }>({ pointer: 'mouse', wasOpen: false });
  const photosAsked = useRef(false);

  // In an effect, though nothing renders this on the server: it waits on a fetch.
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(PHONE_WIDTH);
    const update = () => setPhone(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const { k, H, M } = phone ? LAYOUTS.phone : LAYOUTS.normal;
  const PLOT_W = W - M.left - M.right;
  const PLOT_H = H - M.top - M.bottom;

  const show = (i: number) => {
    window.clearTimeout(hideTimer.current);
    setActive(i);
  };
  // Not at once: the pointer has to cross the gap from the dot to its card.
  const hideSoon = () => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setActive(null), 200);
  };

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  // What dismisses a card when there is no pointer to take away.
  useEffect(() => {
    if (active === null) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
    };
    const onDown = (e: PointerEvent) => {
      if (!(e.target instanceof Element && e.target.closest('[data-comp]'))) setActive(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [active]);

  const points = comps
    .filter((c) => c.living_area && c.sale_price)
    .map((c) => ({
      x: c.living_area as number,
      y: c.sale_price as number,
      weight: c.weight,
      comp: c,
      href: listingPath({ ...c, state: subjectState }),
    }));

  // Nothing to draw is not an error state, it is a section that should not be
  // on the page. The parent decides; this just refuses to render an empty box.
  if (points.length < 2) return null;

  const xs = [...points.map((p) => p.x), subjectArea];
  const ys = [
    ...points.map((p) => p.y),
    ...(askingPrice ? [askingPrice] : []),
    ...(estimate ? [estimate] : []),
    low,
    high,
  ].filter((n) => Number.isFinite(n) && n > 0);

  const xScale = niceScale(Math.min(...xs), Math.max(...xs), 4);
  const yScale = niceScale(Math.min(...ys), Math.max(...ys), 5);

  const px = (v: number) =>
    M.left + ((v - xScale.min) / (xScale.max - xScale.min)) * PLOT_W;
  const py = (v: number) =>
    M.top + PLOT_H - ((v - yScale.min) / (yScale.max - yScale.min)) * PLOT_H;

  const xTicks: number[] = [];
  for (let v = xScale.min; v <= xScale.max + 1e-9; v += xScale.step) xTicks.push(v);
  const yTicks: number[] = [];
  for (let v = yScale.min; v <= yScale.max + 1e-9; v += yScale.step) yTicks.push(v);

  /*
   * NO TREND LINE. There was one — a least-squares line through the drawn
   * points — while a chart held thirty or more sales. It holds five now, all
   * within 20% of the subject's size, and a line through five points that close
   * together slopes whichever way one sale tips it, including downhill —
   * bigger houses selling for less. The five dots are the statement.
   */

  /*
   * A dot is five units across, and half that on a phone, so what takes the
   * pointer is a larger invisible circle. Each stops halfway to its nearest
   * neighbour, so two close dots do not cover each other.
   */
  const marks = points.map((p, i) => {
    const cx = px(p.x);
    const cy = py(p.y);
    const nearest = Math.min(
      ...points.filter((_, j) => j !== i).map((q) => Math.hypot(px(q.x) - cx, py(q.y) - cy))
    );
    return { ...p, cx, cy, hit: Math.max(12 * k, Math.min(30 * k, nearest / 2)) };
  });
  const open = active === null ? null : marks[active] ?? null;

  // The photos are asked for when the pointer arrives rather than when the card
  // opens, or the first card on each dot would open with an empty box.
  const askForPhotos = () => {
    if (photosAsked.current) return;
    photosAsked.current = true;
    for (const { comp } of marks) {
      if ((comp.photo_count ?? 0) > 0) new Image().src = photoUrl(comp.mls_number, 0, 'card');
    }
  };

  const summary = [
    `Scatter plot of ${points.length} comparable sales.`,
    `Floor area from ${Math.round(Math.min(...points.map((p) => p.x))).toLocaleString()} to ${Math.round(Math.max(...points.map((p) => p.x))).toLocaleString()} square feet;`,
    `sale prices from ${formatPrice(Math.min(...points.map((p) => p.y)))} to ${formatPrice(Math.max(...points.map((p) => p.y)))}.`,
    askingPrice
      ? `${subjectLabel} is asking ${formatPrice(askingPrice)} at ${subjectArea.toLocaleString()} square feet.`
      : '',
    estimate
      ? `These sales put it near ${formatPrice(estimate)}, in a range of ${formatPrice(low)} to ${formatPrice(high)}.`
      : `These sales put it in a range of ${formatPrice(low)} to ${formatPrice(high)}.`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <figure className="mt-8">
      <figcaption className="rounded-xl border border-gray-200 p-5 text-sm leading-relaxed text-gray-700">
        <p className="font-semibold text-ink">How to read this chart</p>
        <p className="mt-1">
          Each home sits by its size, left to right, and its price, bottom to top.
        </p>
        <ul className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-2">
          <LegendEntry
            mark={
              <>
                <circle cx={7} cy={9} r={5} className={DOT.fillClass} opacity={dotOpacity(0)} stroke={DOT.stroke} strokeWidth={DOT.strokeWidth} />
                <circle cx={20} cy={9} r={5} className={DOT.fillClass} opacity={dotOpacity(1)} stroke={DOT.stroke} strokeWidth={DOT.strokeWidth} />
              </>
            }
          >
            <span className="font-semibold text-ink">Circle: a home that sold nearby.</span> The
            darker it is, the more it counts toward the estimate. Hover over one to see the house
            and click it to open that listing in a new tab. On a phone, tap once to see it and
            again to open it.
          </LegendEntry>
          {askingPrice && (
            <LegendEntry mark={<path d={diamond(14, 9, 7)} className="fill-ink-deep" />}>
              <span className="font-semibold text-ink">Black diamond: what this home is asking.</span>{' '}
              <span className="numeral">{formatPrice(askingPrice)}</span>
            </LegendEntry>
          )}
          {estimate && (
            <LegendEntry
              mark={<line x1={2} x2={26} y1={9} y2={9} className="stroke-champagne-ink" strokeWidth={3} />}
            >
              <span className="font-semibold text-ink">Short bar: what these sales suggest.</span>{' '}
              <span className="numeral">{formatPrice(estimate)}</span>
            </LegendEntry>
          )}
          {high > low && (
            <LegendEntry
              mark={
                <rect x={1} y={2} width={26} height={14} className="fill-champagne" opacity={RANGE_OPACITY} />
              }
            >
              <span className="font-semibold text-ink">Shaded band: where most of the evidence falls.</span>{' '}
              <span className="numeral">
                {formatPrice(low)} to {formatPrice(high)}
              </span>
            </LegendEntry>
          )}
          <LegendEntry
            mark={
              <line
                x1={14}
                x2={14}
                y1={0}
                y2={18}
                stroke={GUIDE.stroke}
                strokeWidth={1}
                strokeDasharray={GUIDE.strokeDasharray}
                opacity={GUIDE.opacity}
              />
            }
          >
            <span className="font-semibold text-ink">Dashed line: the size of this home.</span>{' '}
            <span className="numeral">{subjectArea.toLocaleString()} sq ft</span>
          </LegendEntry>
        </ul>
      </figcaption>

      <div className="relative mt-5">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full"
          role="group"
          aria-label={summary}
          onPointerEnter={askForPhotos}
        >
          {/* The estimate range, drawn first so every mark sits on top of it. */}
          {high > low && (
            <rect
              x={M.left}
              y={py(high)}
              width={PLOT_W}
              height={Math.max(py(low) - py(high), 1)}
              className="fill-champagne"
              opacity={RANGE_OPACITY}
            />
          )}

          <text
            x={M.left - 10 * k}
            y={14 * k}
            textAnchor="end"
            className="fill-gray-600"
            fontSize={12 * k}
          >
            Price
          </text>

          {yTicks.map((t) => (
            <g key={`y${t}`}>
              <line
                x1={M.left}
                x2={M.left + PLOT_W}
                y1={py(t)}
                y2={py(t)}
                stroke="#e5e7eb"
                strokeWidth={1}
              />
              <text
                x={M.left - 10 * k}
                y={py(t)}
                textAnchor="end"
                dominantBaseline="middle"
                className="numeral fill-gray-600"
                fontSize={13 * k}
              >
                {compactPrice(t)}
              </text>
            </g>
          ))}

          {xTicks.map((t) => (
            <text
              key={`x${t}`}
              x={px(t)}
              y={M.top + PLOT_H + 22 * k}
              textAnchor="middle"
              className="numeral fill-gray-600"
              fontSize={13 * k}
            >
              {Math.round(t).toLocaleString()}
            </text>
          ))}

          <line
            x1={M.left}
            x2={M.left + PLOT_W}
            y1={M.top + PLOT_H}
            y2={M.top + PLOT_H}
            stroke="#9ca3af"
            strokeWidth={1}
          />

          {/* This home's size, with or without an asking price to sit on it. */}
          <line
            x1={px(subjectArea)}
            x2={px(subjectArea)}
            y1={M.top}
            y2={M.top + PLOT_H}
            stroke={GUIDE.stroke}
            strokeWidth={1}
            strokeDasharray={GUIDE.strokeDasharray}
            opacity={GUIDE.opacity}
          />

          {/* One link per closed sale. Opacity carries the comp's weight, so the
              sales the estimate actually leans on read as the solid ones. */}
          {marks.map((mark, i) => (
            <a
              key={mark.comp.mls_number}
              href={mark.href}
              target="_blank"
              rel="noopener"
              data-comp
              className="cursor-pointer focus:outline-none"
              aria-label={`${mark.comp.address ?? `MLS ${mark.comp.mls_number}`}, sold for ${formatPrice(mark.y)}, ${Math.round(mark.x).toLocaleString()} square feet. Opens in a new tab.`}
              onPointerEnter={(e) => {
                if (e.pointerType === 'mouse') show(i);
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === 'mouse') hideSoon();
              }}
              onPointerDown={(e) => {
                pressedWith.current = { pointer: e.pointerType, wasOpen: active === i };
              }}
              onClick={(e) => {
                // A tap has nothing to point with, so the first shows the house.
                const { pointer, wasOpen } = pressedWith.current;
                pressedWith.current = { pointer: 'mouse', wasOpen: false };
                if (pointer !== 'mouse' && !wasOpen) {
                  e.preventDefault();
                  show(i);
                }
              }}
              // Not when a mouse click focuses it: coming back from the new tab
              // would find the card still open with nothing pointing at it.
              onFocus={(e) => {
                if (e.currentTarget.matches(':focus-visible')) show(i);
              }}
              onBlur={() => {
                if (active === i) hideSoon();
              }}
            >
              <circle cx={mark.cx} cy={mark.cy} r={mark.hit} fill="transparent" />
              <circle
                cx={mark.cx}
                cy={mark.cy}
                r={(active === i ? 8 : 5) * k}
                className={DOT.fillClass}
                opacity={active === i ? 1 : dotOpacity(mark.weight * points.length)}
                stroke={active === i ? '#0d0d0f' : DOT.stroke}
                strokeWidth={(active === i ? 1.5 : DOT.strokeWidth) * k}
              />
            </a>
          ))}

          {/* The estimate, at the subject's floor area. Neither of these two may
              take the pointer from a dot underneath. */}
          {estimate && (
            <line
              x1={px(subjectArea) - 13 * k}
              x2={px(subjectArea) + 13 * k}
              y1={py(estimate)}
              y2={py(estimate)}
              className="stroke-champagne-ink"
              strokeWidth={3 * k}
              pointerEvents="none"
            />
          )}

          {/* The subject's asking price — the mark the whole chart is built
              around, so it is the darkest thing on it. */}
          {askingPrice && (
            <path
              d={diamond(px(subjectArea), py(askingPrice), 8 * k)}
              className="fill-ink-deep"
              stroke="#ffffff"
              strokeWidth={1.5 * k}
              pointerEvents="none"
            />
          )}

          <text
            x={M.left + PLOT_W / 2}
            y={H - 6 * k}
            textAnchor="middle"
            className="fill-gray-600"
            fontSize={12 * k}
            id={`${id}-x`}
          >
            Floor area (square feet)
          </text>
        </svg>

        {open && (
          <CompCard
            comp={open.comp}
            href={open.href}
            left={(open.cx / W) * 100}
            top={(open.cy / H) * 100}
            onEnter={() => show(active as number)}
            onLeave={hideSoon}
          />
        )}
      </div>
    </figure>
  );
};

export default CompsScatter;
