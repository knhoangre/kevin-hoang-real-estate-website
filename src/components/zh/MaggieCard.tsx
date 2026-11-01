import { Link } from 'react-router-dom';
import { ArrowRight, Phone } from 'lucide-react';
import { CHINESE_PARTNER, partnerTelHref } from '@/lib/siteConfig';

/**
 * Who to contact, at the end of a Chinese town guide: what AuthorCard is on the
 * English one. It does not say she wrote the guide, because she did not.
 */
const MaggieCard = ({ className = '' }: { className?: string }) => (
  <aside className={`rounded-2xl border border-gray-200 bg-bone p-6 sm:p-8 ${className}`}>
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <img
        src={CHINESE_PARTNER.photo}
        alt={`${CHINESE_PARTNER.name}，房地产经纪人`}
        width={160}
        height={160}
        className="h-20 w-20 shrink-0 rounded-full object-cover object-[center_20%] ring-1 ring-champagne/40"
        loading="lazy"
        decoding="async"
      />

      <div className="min-w-0">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gray-500">
          中文服务联系人
        </p>
        {/* A <p>, not a heading, for AuthorCard's reason: it closes every guide. */}
        <p className="mt-2 text-2xl font-semibold text-ink">{CHINESE_PARTNER.name}</p>
        <p className="mt-3 text-base leading-relaxed text-gray-700">
          {CHINESE_PARTNER.brokerage} 的房地产经纪人，常驻 Newton（牛顿），可以用普通话或英文为您服务。
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            to="/zh/maggie-li"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-ink"
          >
            了解 Maggie
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <a
            href={partnerTelHref}
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-ink"
          >
            <Phone className="h-4 w-4" aria-hidden />
            {CHINESE_PARTNER.phone}
          </a>
        </div>
      </div>
    </div>
  </aside>
);

export default MaggieCard;
