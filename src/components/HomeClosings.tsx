import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { soldListings } from '@/data/soldListings';
import { formatPrice } from '@/lib/listings';
import { pill } from '@/lib/pill';

/**
 * Three of Kevin's closings, each linking to its own /properties/<slug> page.
 * They were reachable only from the PROPERTIES item in the navbar, so the
 * strongest first-party evidence on the site was absent from the page most
 * visitors see first.
 *
 * Kevin is named alone and no brokerage is attached: the closings carry no date,
 * so which brokerage each closed under cannot be said (see PropertyDetail). The
 * first three in the snapshot, which sync-listings orders by sale price.
 */
const SHOWN = 3;

const HomeClosings = () => {
  const { t } = useTranslation();
  const shown = soldListings.filter((l) => l.images.length > 0).slice(0, SHOWN);
  if (shown.length === 0) return null;

  return (
    <section className="bg-white py-20" aria-labelledby="home-closings">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <span className="mx-auto mb-5 block h-px w-10 bg-champagne" aria-hidden />
          <h2 id="home-closings" className="mb-4 font-sans text-3xl font-semibold tracking-widest text-ink md:text-4xl">
            {t('homeClosings.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-gray-600">{t('homeClosings.subtitle')}</p>
        </div>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {shown.map((l) => (
            <li key={l.slug}>
              <Link
                to={`/properties/${l.slug}`}
                className="group block overflow-hidden rounded-xl border border-transparent bg-bone shadow-sm transition-all duration-300 hover:border-champagne hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne-ink"
              >
                <div className="aspect-[16/10] overflow-hidden bg-gray-200">
                  <img
                    src={l.images[0]}
                    alt={`${l.address}, ${l.town}`}
                    width={900}
                    height={674}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="p-5">
                  <p className="numeral text-2xl font-bold text-ink">{formatPrice(l.salePrice)}</p>
                  <p className="mt-1 text-gray-700">
                    {l.address}, {l.town}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {l.propertyType} · {t('homeClosings.sold')}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex justify-center">
          <Link to="/properties" className={pill('outline', 'md', 'group')}>
            {t('homeClosings.all', { n: soldListings.length })}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeClosings;
