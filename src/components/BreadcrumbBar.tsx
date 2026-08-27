import Breadcrumbs from './Breadcrumbs';
import type { Crumb } from '@/lib/schema';

/**
 * The canonical placement for a breadcrumb trail: vertical spacing only.
 *
 * It deliberately sets NO width and NO horizontal padding. It used to impose
 * `px-4 … max-w-6xl mx-auto` of its own, which meant that on any page whose
 * content column was narrower — an article at `max-w-4xl`, a landing page at
 * `max-w-3xl` — the trail hung out to the left of the text it belonged to.
 *
 * Instead, each page renders this inside its own content container, so the
 * trail inherits exactly the column its content uses and cannot drift out of
 * alignment as those widths change.
 */
const BreadcrumbBar = ({
  items,
  tone = 'light',
  className = '',
}: {
  items: Crumb[];
  tone?: 'light' | 'dark';
  className?: string;
}) => (
  <div className={`pb-8 ${className}`}>
    <Breadcrumbs items={items} tone={tone} />
  </div>
);

export default BreadcrumbBar;
