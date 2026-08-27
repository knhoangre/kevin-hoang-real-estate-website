import { Link } from 'react-router-dom';
import { neighborhoods } from '@/data/neighborhoodData';

/**
 * Cross-links between the town guides.
 *
 * Without this each guide is a leaf: reachable from the hub page and from the
 * sitemap, and linking nowhere itself. Interlinking them spreads authority
 * across the set and gives a reader on one guide somewhere obvious to go next.
 *
 * The selection is a stable rotation from the current town's position in the
 * list rather than a random sample, so the link graph is the same on every
 * build and every town both gives and receives links.
 */
const NearbyTowns = ({ currentSlug, count = 4 }: { currentSlug: string; count?: number }) => {
  const index = neighborhoods.findIndex((n) => n.slug === currentSlug);
  if (index === -1) return null;

  const others = Array.from({ length: count }, (_, i) =>
    neighborhoods[(index + i + 1) % neighborhoods.length]
  ).filter((n) => n.slug !== currentSlug);

  if (others.length === 0) return null;

  return (
    <aside className="mt-16 pt-8 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-ink mb-6">Other towns nearby</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 list-none p-0">
        {others.map((town) => (
          <li key={town.slug} className="m-0">
            <Link
              to={`/neighborhoods/${town.slug}`}
              className="block rounded-lg border border-gray-200 px-4 py-3 font-medium text-ink transition-shadow hover:shadow-md"
            >
              {town.name}, MA
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default NearbyTowns;
