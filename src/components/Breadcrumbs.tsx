import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import type { Crumb } from '@/lib/schema';

interface BreadcrumbsProps {
  items: Crumb[];
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
 */
const Breadcrumbs = ({ items, className = '' }: BreadcrumbsProps) => (
  <nav aria-label="Breadcrumb" className={className}>
    <ol className="inline-flex flex-wrap items-center gap-x-1 gap-y-1 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-sm shadow-sm backdrop-blur">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const isFirst = i === 0;
        return (
          <li key={item.path} className="inline-flex items-center gap-1">
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" aria-hidden />
            )}
            {isLast ? (
              <span
                className="rounded-full bg-gray-100 px-2.5 py-0.5 font-medium text-[#1a1a1a]"
                aria-current="page"
              >
                {item.name}
              </span>
            ) : (
              <Link
                to={item.path}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#1a1a1a]"
              >
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

export default Breadcrumbs;
