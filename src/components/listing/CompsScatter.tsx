/**
 * The comps, drawn — floor area against what each one actually sold for.
 *
 * WHY THIS CHART AND NOT A HISTOGRAM OR A PRICE STRIP. The reader's question is
 * not "what do houses cost round here", it is "is THIS price sensible". That is
 * a question about one point against a relationship, so the chart has to show
 * the relationship: the cloud of real closings, the line through them, and the
 * subject sitting above or below it. A histogram of prices hides the subject
 * inside a bar; a one-dimensional strip shows the answer with none of the
 * working. This shows the working, which is the entire brief — the estimate is
 * only as trustworthy as the evidence a reader can see for themselves.
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
 * anything. And thirty points and a straight line is not a charting problem.
 * The precedent is already in this folder: ListingPayment draws its cost split
 * as a plain flex bar with role="img" and an enumerated aria-label.
 *
 * COLOUR. Champagne is a NON-TEXT MARK here, which is the one thing it is
 * allowed to be on a light surface — it measures 2.33:1 on white and fails WCAG
 * at every size as text. Every label in this component is text-ink,
 * text-champagne-ink or text-gray-600, and no third accent is invented: the
 * ramp is the one ListingPayment already established.
 */
import { useId } from 'react';
import { formatPrice } from '@/lib/listings';
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
}

const W = 720;
const H = 380;
const M = { top: 16, right: 18, bottom: 46, left: 74 };
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;

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

const CompsScatter = ({
  comps,
  subjectArea,
  askingPrice,
  estimate,
  low,
  high,
  subjectLabel,
}: Props) => {
  const id = useId();

  const points = comps
    .filter((c) => c.living_area && c.sale_price)
    .map((c) => ({
      x: c.living_area as number,
      y: c.sale_price as number,
      weight: c.weight,
      address: c.address,
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
   * The trend line, fitted here rather than passed in.
   *
   * This is an unweighted least-squares line through the DRAWN points, and it
   * is deliberately not the estimator's own regression: that one is
   * multivariate and weighted, and a two-dimensional chart cannot honestly
   * depict a five-dimensional fit. Drawing this one keeps the line and the dots
   * as the same statement — it is the trend in what is on screen, nothing more.
   */
  const n = points.length;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  const sxx = points.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  const sxy = points.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
  const slope = sxx > 0 ? sxy / sxx : 0;
  const lineAt = (x: number) => my + slope * (x - mx);
  const showLine = sxx > 0 && Number.isFinite(slope);

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
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={summary}
      >
        {/* The estimate range, drawn first so every mark sits on top of it. */}
        {high > low && (
          <rect
            x={M.left}
            y={py(high)}
            width={PLOT_W}
            height={Math.max(py(low) - py(high), 1)}
            className="fill-champagne"
            opacity={0.14}
          />
        )}

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
              x={M.left - 10}
              y={py(t)}
              textAnchor="end"
              dominantBaseline="middle"
              className="numeral fill-gray-600"
              fontSize={13}
            >
              {compactPrice(t)}
            </text>
          </g>
        ))}

        {xTicks.map((t) => (
          <text
            key={`x${t}`}
            x={px(t)}
            y={M.top + PLOT_H + 22}
            textAnchor="middle"
            className="numeral fill-gray-600"
            fontSize={13}
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

        {showLine && (
          <line
            x1={px(xScale.min)}
            y1={py(lineAt(xScale.min))}
            x2={px(xScale.max)}
            y2={py(lineAt(xScale.max))}
            className="stroke-champagne-ink"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            opacity={0.7}
          />
        )}

        {/* One dot per closed sale. Opacity carries the comp's weight, so the
            sales the estimate actually leans on read as the solid ones. */}
        {points.map((p, i) => (
          <circle
            key={`${p.address ?? 'comp'}-${i}`}
            cx={px(p.x)}
            cy={py(p.y)}
            r={5}
            className="fill-champagne"
            opacity={0.35 + Math.min(p.weight * points.length, 1) * 0.5}
            stroke="#8c6b35"
            strokeWidth={0.75}
          />
        ))}

        {/* The estimate, at the subject's floor area. */}
        {estimate && (
          <g>
            <line
              x1={px(subjectArea) - 13}
              x2={px(subjectArea) + 13}
              y1={py(estimate)}
              y2={py(estimate)}
              className="stroke-champagne-ink"
              strokeWidth={3}
            />
          </g>
        )}

        {/* The subject's asking price — the mark the whole chart is built
            around, so it is the darkest thing on it. */}
        {askingPrice && (
          <g>
            <line
              x1={px(subjectArea)}
              x2={px(subjectArea)}
              y1={M.top}
              y2={M.top + PLOT_H}
              stroke="#0d0d0f"
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.35}
            />
            <path
              d={`M ${px(subjectArea)} ${py(askingPrice) - 8} L ${px(subjectArea) + 8} ${py(askingPrice)} L ${px(subjectArea)} ${py(askingPrice) + 8} L ${px(subjectArea) - 8} ${py(askingPrice)} Z`}
              className="fill-ink-deep"
              stroke="#ffffff"
              strokeWidth={1.5}
            />
          </g>
        )}

        <text
          x={M.left + PLOT_W / 2}
          y={H - 6}
          textAnchor="middle"
          className="fill-gray-600"
          fontSize={12}
          id={`${id}-x`}
        >
          Floor area (square feet)
        </text>
      </svg>

      <figcaption className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-600">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-champagne ring-1 ring-champagne-ink" aria-hidden />
          Closed sale
        </span>
        {askingPrice && (
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rotate-45 bg-ink-deep" aria-hidden />
            Asking now
          </span>
        )}
        {estimate && (
          <span className="inline-flex items-center gap-2">
            <span className="h-0.5 w-4 bg-champagne-ink" aria-hidden />
            These sales suggest
          </span>
        )}
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-4 bg-champagne/25" aria-hidden />
          Range
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-4 border-t border-dashed border-champagne-ink" aria-hidden />
          Trend in these sales
        </span>
      </figcaption>
    </figure>
  );
};

export default CompsScatter;
