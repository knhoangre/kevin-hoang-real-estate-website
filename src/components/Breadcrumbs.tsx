import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import type { Crumb } from '@/lib/schema';

interface BreadcrumbsProps {
  items: Crumb[];
  /**
   * `dark` for a trail on an `ink-deep` surface or a photographic hero.
   * Defaults to `light` so existing call sites need no change.
   */
  tone?: 'light' | 'dark';
  className?: string;
}

/**
 * Visible breadcrumb trail.
 *
 * Pair this with `breadcrumbs(items)` from lib/schema using the SAME array —
 * BreadcrumbList markup that does not correspond to a visible trail violates
 * Google's structured data guidelines.
 *
 * The final crumb is the current page and renders as plain text, not a link.
 *
 * There is no pill. The trail used to sit in a
 * `rounded-full border bg-white/80 shadow-sm backdrop-blur` chip, which exists
 * to keep a trail legible over a photograph — but on the landing heroes it sits
 * at the bottom of the frame inside a near-opaque scrim, so it was solving a
 * problem that was not there and read as a floating white chip; and on the light
 * pages it was a white pill on white. It is chrome with no job on either
 * surface. The tone ramp plus the champagne hover carries it instead.
 *
 * Deliberately NOT uppercased or letter-spaced like the hero eyebrow:
 * BlogPost puts a full post title in the last crumb, and uppercasing a
 * 70-character headline is worse than the pill was.
 */
const Breadcrumbs = ({ items, tone = 'light', className = '' }: BreadcrumbsProps) => {
  const dark = tone === 'dark';

  // Measured against the surface each tone sits on: white/60 on ink-deep is
  // 7.3:1, champagne on ink-deep 8.3:1, gray-500 on white 4.8:1, and
  // champagne-ink on white 4.9:1. All pass AA.
  const sep = dark ? 'text-white/30' : 'text-gray-300';
  const link = dark
    ? 'text-white/60 hover:text-champagne'
    : 'text-gray-500 hover:text-champagne-ink';
  const current = dark ? 'text-white' : 'text-ink';

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="m-0 flex list-none flex-wrap items-center gap-x-1.5 gap-y-1 p-0 text-sm">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const isFirst = i === 0;
          return (
            <li key={item.path} className="inline-flex items-center gap-1.5">
              {i > 0 && <ChevronRight className={`h-3 w-3 shrink-0 ${sep}`} aria-hidden />}
              {isLast ? (
                <span className={`font-medium ${current}`} aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link to={item.path} className={`inline-flex items-center gap-1.5 transition-colors ${link}`}>
                  {isFirst && <Home className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
