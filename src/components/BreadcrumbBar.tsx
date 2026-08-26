import Breadcrumbs from './Breadcrumbs';
import type { Crumb } from '@/lib/schema';

/**
 * Full-width band holding the breadcrumb trail, so every page positions it
 * identically instead of each one inventing its own spacing.
 */
const BreadcrumbBar = ({ items }: { items: Crumb[] }) => (
  <div className="px-4 sm:px-6 lg:px-8 pb-8">
    <div className="max-w-6xl mx-auto">
      <Breadcrumbs items={items} />
    </div>
  </div>
);

export default BreadcrumbBar;
