/**
 * The two charts on a market report: how many homes closed each month, and the
 * share that sold over asking.
 *
 * HTML COLUMNS AND AN SVG LINE, NOT A SCALED SVG. CompsScatter draws in a
 * 720-wide viewBox, which is fine for one chart a reader studies; here a month
 * label at 12px would print at 6px on a phone and 19px on a desktop. So the
 * columns are flex children sized in percent, every label is ordinary text at
 * an ordinary size, and the line is an SVG stretched to its box with a
 * non-scaling stroke — its dots are HTML so they stay round. Nothing measures
 * the DOM, so the prerendered HTML is the chart, and it prints.
 *
 * ONE SERIES PER CHART. Sale types are split into separate charts or the
 * tooltip rather than stacked in three colours: champagne is the one mark
 * colour this site has on white, and identity by colour alone is what the
 * table under each chart replaces. Text is never champagne — it is 2.33:1 on
 * white (see tailwind.config.ts).
 *
 * The hover layer is state set on pointer and focus, null on the first render,
 * so the server and the hydrating client draw the same thing.
 */
import { useState } from 'react';

export interface ChartPoint {
  /** "September 2026" — the tooltip's heading and the screen-reader label. */
  label: string;
  /** "Sep" — under the column. */
  short: string;
  value: number | null;
  /** Lines under the heading in the tooltip. */
  detail?: string[];
  /** Drawn solid; the rest are drawn as a lighter step of the same hue. */
  highlight?: boolean;
}

/** A clean axis maximum and its ticks: 0, 20, 40, 60 rather than 0, 17, 34, 51. */
const niceTicks = (max: number, count = 4) => {
  if (!Number.isFinite(max) || max <= 0) return { top: 1, ticks: [0, 1] };
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const top = Math.ceil(max / step) * step;
  return { top, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step) };
};

const Tooltip = ({ point, value, left }: { point: ChartPoint; value: string; left: number }) => (
  <div
    role="status"
    className="pointer-events-none absolute -top-2 z-10 w-max max-w-[14rem] -translate-y-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg"
    // Kept inside the plot at both ends rather than hanging off the page.
    style={{ left: `${Math.min(Math.max(left, 12), 88)}%`, transform: 'translate(-50%, -100%)' }}
  >
    <p className="font-semibold text-ink">{point.label}</p>
    <p className="mt-0.5 text-gray-700">{value}</p>
    {point.detail?.map((d) => (
      <p key={d} className="text-gray-600">
        {d}
      </p>
    ))}
  </div>
);

const Gridlines = ({ ticks, top, format }: { ticks: number[]; top: number; format: (n: number) => string }) => (
  <>
    {ticks.map((t) => (
      <div key={t} className="absolute inset-x-0 flex items-center" style={{ bottom: `${(t / top) * 100}%` }} aria-hidden>
        <span className="absolute -left-1 -translate-x-full translate-y-[1px] text-[11px] tabular-nums text-gray-500">
          {format(t)}
        </span>
        <span className={`h-px w-full ${t === 0 ? 'bg-gray-300' : 'bg-gray-100'}`} />
      </div>
    ))}
  </>
);

/** Columns, one per month. Labels every column on a wide screen, every other on a phone. */
export const ColumnChart = ({
  points,
  format,
  axisFormat = format,
  ariaLabel,
}: {
  points: ChartPoint[];
  format: (n: number) => string;
  axisFormat?: (n: number) => string;
  ariaLabel: string;
}) => {
  const [active, setActive] = useState<number | null>(null);
  const { top, ticks } = niceTicks(Math.max(...points.map((p) => p.value ?? 0)));
  const last = points.length - 1;

  return (
    <figure className="m-0">
      <div className="relative ml-10 h-52 sm:h-60" role="img" aria-label={ariaLabel}>
        <Gridlines ticks={ticks} top={top} format={axisFormat} />
        <div className="absolute inset-0 flex items-end" onMouseLeave={() => setActive(null)}>
          {points.map((p, i) => (
            <div
              key={p.label}
              className="relative flex h-full flex-1 items-end justify-center outline-none"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              tabIndex={0}
              aria-label={`${p.label}: ${p.value === null ? 'no figure' : format(p.value)}`}
            >
              <div
                className={`w-3/5 max-w-[24px] rounded-t transition-colors ${
                  p.highlight || active === i ? 'bg-champagne' : 'bg-champagne/45'
                }`}
                style={{ height: `${((p.value ?? 0) / top) * 100}%` }}
              />
              {/* Selective labels: the highlighted month carries its value, the
                  rest are in the tooltip and the table. */}
              {p.highlight && p.value !== null && (
                <span
                  className="absolute text-xs font-semibold tabular-nums text-ink"
                  style={{ bottom: `calc(${(p.value / top) * 100}% + 4px)` }}
                >
                  {format(p.value)}
                </span>
              )}
            </div>
          ))}
        </div>
        {active !== null && points[active].value !== null && (
          <Tooltip point={points[active]} value={format(points[active].value as number)} left={((active + 0.5) / points.length) * 100} />
        )}
      </div>
      <div className="ml-10 mt-2 flex" aria-hidden>
        {points.map((p, i) => (
          <span
            key={p.label}
            className={`flex-1 text-center text-[11px] text-gray-500 ${i % 2 === last % 2 ? '' : 'invisible sm:visible'}`}
          >
            {p.short}
          </span>
        ))}
      </div>
    </figure>
  );
};

/**
 * A share, month by month, on a fixed 0–100% axis. A month with too few sales
 * for a share is a gap in the line, not a zero.
 */
export const ShareLine = ({ points, ariaLabel }: { points: ChartPoint[]; ariaLabel: string }) => {
  const [active, setActive] = useState<number | null>(null);
  const x = (i: number) => ((i + 0.5) / points.length) * 100;
  const y = (v: number) => 100 - v * 100;
  const pct = (v: number) => `${Math.round(v * 100)}%`;

  // Runs of consecutive months with a value, each drawn as its own line.
  const runs: { i: number; v: number }[][] = [];
  points.forEach((p, i) => {
    if (p.value === null) return;
    const prev = runs[runs.length - 1];
    if (prev && prev[prev.length - 1].i === i - 1) prev.push({ i, v: p.value });
    else runs.push([{ i, v: p.value }]);
  });
  const last = points.length - 1;

  return (
    <figure className="m-0">
      <div className="relative ml-10 h-44 sm:h-52" role="img" aria-label={ariaLabel}>
        <Gridlines ticks={[0, 0.25, 0.5, 0.75, 1]} top={1} format={pct} />
        <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {runs.map((run) => (
            <polyline
              key={run[0].i}
              points={run.map((r) => `${x(r.i)},${y(r.v)}`).join(' ')}
              fill="none"
              stroke="#c5a572"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex" onMouseLeave={() => setActive(null)}>
          {points.map((p, i) => (
            <div
              key={p.label}
              className="relative h-full flex-1 outline-none"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              tabIndex={0}
              aria-label={`${p.label}: ${p.value === null ? 'too few sales' : pct(p.value)}`}
            >
              {active === i && <span className="absolute inset-y-0 left-1/2 w-px bg-gray-200" aria-hidden />}
              {p.value !== null && (
                <span
                  className={`absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-champagne ring-2 ring-white ${
                    active === i || p.highlight ? 'scale-125' : ''
                  }`}
                  style={{ bottom: `${p.value * 100}%` }}
                  aria-hidden
                />
              )}
              {p.highlight && p.value !== null && (
                <span
                  className="absolute left-1/2 -translate-x-1/2 text-xs font-semibold tabular-nums text-ink"
                  style={{ bottom: `calc(${p.value * 100}% + 10px)` }}
                >
                  {pct(p.value)}
                </span>
              )}
            </div>
          ))}
        </div>
        {active !== null && (
          <Tooltip
            point={points[active]}
            value={points[active].value === null ? 'Too few sales to say' : `${pct(points[active].value as number)} sold over asking`}
            left={x(active)}
          />
        )}
      </div>
      <div className="ml-10 mt-2 flex" aria-hidden>
        {points.map((p, i) => (
          <span
            key={p.label}
            className={`flex-1 text-center text-[11px] text-gray-500 ${i % 2 === last % 2 ? '' : 'invisible sm:visible'}`}
          >
            {p.short}
          </span>
        ))}
      </div>
    </figure>
  );
};
