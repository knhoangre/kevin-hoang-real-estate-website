import { Link } from 'react-router-dom';
import { LINK } from '@/components/investments/ui';

/**
 * What these pages are not, said once at the foot of each. It agrees with
 * /home-valuation, which argues that no automated figure sees a house's
 * condition — and links there rather than overselling.
 */
const InvestmentDisclaimer = () => (
  <div className="mt-16 max-w-3xl space-y-3 text-xs leading-relaxed text-gray-500">
    <p>
      <strong className="font-semibold text-gray-600">Not modelled:</strong> income tax, depreciation and a 1031
      exchange; appreciation; short-term rental, which Massachusetts taxes and towns regulate separately (
      <Link to="/blog/short-term-rentals-massachusetts-law" className={LINK}>
        more on that
      </Link>
      ); and the condition of the house, which no field in the listing data records. The photos, the inspection and a
      contractor&rsquo;s walk-through are where that comes from.
    </p>
    <p>
      These are planning figures worked out from public listing data and the assumptions shown beside each one. They are
      not an appraisal, and not investment, tax, legal or lending advice. A lender, an accountant and a Massachusetts
      attorney each have a part in a real purchase, and{' '}
      <Link to="/home-valuation" className={LINK}>
        a home&rsquo;s value
      </Link>{' '}
      is what someone who has walked through it can tell you.
    </p>
  </div>
);

export default InvestmentDisclaimer;
