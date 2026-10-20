import { Link } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { LINK } from '@/components/investments/ui';
import { rulesFor, type RuleContext } from '@/lib/investmentRules';

/**
 * The Massachusetts rules that apply to this house under this strategy, each
 * with its source, the date it was read, and the post on this site that
 * explains it. Shown open rather than in an accordion: these are the parts of
 * an analysis an investor most needs to have read.
 */
const RulesPanel = ({ context }: { context: RuleContext }) => {
  const rules = rulesFor(context);
  if (!rules.length) return null;
  return (
    <section aria-labelledby="rules-heading" className="mt-16 border-t border-gray-200 pt-10">
      <h2 id="rules-heading" className="flex items-center gap-3 text-xl font-semibold uppercase tracking-wide text-ink">
        <Scale className="h-5 w-5 text-champagne-ink" aria-hidden />
        Massachusetts rules that apply here
      </h2>
      <ul className="mt-6 grid gap-6 md:grid-cols-2">
        {rules.map((r) => (
          <li key={r.id} className="rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-ink">{r.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">{r.body}</p>
            <p className="mt-3 text-xs leading-relaxed text-gray-500">
              <a href={r.url} target="_blank" rel="noopener noreferrer" className={LINK}>
                {r.source}
              </a>
              , read {r.asOf}.
              {r.blogSlug && (
                <>
                  {' '}
                  <Link to={`/blog/${r.blogSlug}`} className={LINK}>
                    More on this
                  </Link>
                </>
              )}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default RulesPanel;
