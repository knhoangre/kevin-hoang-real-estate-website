import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * The resource grid for the Vietnamese guides — the counterpart of
 * BuyerResources / SellerResources, which are two copies of one grid differing
 * only in their items. This is one grid taking its items as a prop, and it is
 * used by both /vi/mua-nha and /vi/ban-nha.
 *
 * Cards point at the Vietnamese page where one exists and at the English one
 * where it does not. Sending a Vietnamese reader to an English page is honest;
 * sending them to a Vietnamese URL that does not exist is a 404, since routes
 * outside the prerender set have no SPA fallback here.
 */
export interface ViResource {
  icon: LucideIcon;
  title: string;
  description: string;
  link: string;
  /** Set where the destination is only available in English. */
  english?: boolean;
}

const ViResources = ({
  heading,
  subtitle,
  resources,
}: {
  heading: string;
  subtitle: string;
  resources: ViResource[];
}) => (
  <div className="py-12">
    {/* No container of its own: this renders inside the page's container. */}
    <div className="mx-auto mb-12 max-w-3xl text-center">
      <h2 className="mb-4 text-3xl font-bold text-ink">{heading}</h2>
      <p className="text-gray-600">{subtitle}</p>
    </div>

    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {resources.map((resource, index) => (
        <div
          key={resource.link}
          className="enter overflow-hidden rounded-xl bg-white shadow-md transition-shadow duration-300 hover:shadow-lg"
          style={{ '--enter-delay': `${index * 0.08}s` } as React.CSSProperties}
        >
          <div className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-ink-deep text-champagne">
              <resource.icon size={24} aria-hidden />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-ink">{resource.title}</h3>
            <p className="mb-4 text-gray-600">{resource.description}</p>
            <Link
              to={resource.link}
              className="group relative inline-flex items-center font-medium text-ink"
            >
              <span className="relative">
                {resource.english ? 'Xem (tiếng Anh)' : 'Xem chi tiết'}
                <span className="absolute -bottom-[2px] left-0 h-0.5 w-0 bg-ink transition-all duration-300 group-hover:w-full" />
              </span>
              <ArrowRight
                className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ViResources;
