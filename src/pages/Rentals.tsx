/**
 * /rentals — the applicant's own applications.
 *
 * Reached from the profile menu, and where /apply sends someone once they have
 * submitted. It lists what they have started or sent, and `?id=<uuid>` opens one
 * read-only.
 *
 * The detail view is a QUERY PARAM rather than /rentals/:id on purpose. A
 * dynamic segment cannot be prerendered, so it would need its own rewrite in
 * vercel.json alongside /search and /apply — and every broadening of that file
 * is how this site once returned HTTP 200 soft-404s for every typo. A query
 * param resolves against the prerendered /rentals with no rewrite at all.
 *
 * The document itself renders through RentalApplicationForm in `readOnly` mode,
 * so there is exactly one rendering of an application on this site — the
 * applicant's copy cannot drift from the admin's.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import PageShell from '@/components/PageShell';
import { useAuth } from '@/contexts/AuthContext';
import RentalApplicationForm from '@/components/rental/RentalApplicationForm';
import StatusBadge from '@/components/rental/StatusBadge';
import { listMyApplications, type RentalApplicationRecord } from '@/lib/rentalApplication';
import { SITE, telHref } from '@/lib/siteConfig';

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Rentals', path: '/rentals' },
];

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-lg shadow-black/10">
    {children}
  </div>
);

export default function Rentals() {
  const { user, loading: authLoading } = useAuth();
  const [params, setParams] = useSearchParams();
  const openId = params.get('id');

  const [rows, setRows] = useState<RentalApplicationRecord[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      // RLS scopes this to the caller — there is deliberately no user filter
      // here, so the policy is the only thing deciding what comes back.
      setRows(await listMyApplications());
      setFailed(false);
    } catch (err) {
      console.error('Could not load applications:', err);
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    void load();
  }, [authLoading, user, load]);

  const body = () => {
    if (authLoading) {
      return (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-champagne-ink" aria-hidden />
        </div>
      );
    }

    if (!user) {
      return (
        <Card>
          <h2 className="text-xl font-semibold uppercase tracking-wide text-ink">
            Please sign in
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Sign in to see your rental applications.
          </p>
          <Link
            to="/auth"
            className="mt-6 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/80"
          >
            Sign in
          </Link>
        </Card>
      );
    }

    if (failed) {
      return (
        <Card>
          <h2 className="text-xl font-semibold uppercase tracking-wide text-ink">
            Could not load your applications
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Please refresh the page, or call {SITE.phone}.
          </p>
        </Card>
      );
    }

    if (!rows) {
      return (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-champagne-ink" aria-hidden />
        </div>
      );
    }

    /* ---- One application, read-only ---------------------------------- */
    if (openId) {
      const record = rows.find((r) => r.id === openId);
      if (!record) {
        return (
          <Card>
            <h2 className="text-xl font-semibold uppercase tracking-wide text-ink">Not found</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              That application is not one of yours.
            </p>
          </Card>
        );
      }

      return (
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
            <button
              type="button"
              onClick={() => setParams({}, { replace: true })}
              className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-champagne-ink"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              All applications
            </button>
            <div className="flex items-center gap-3">
              <StatusBadge status={record.status} />
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-champagne hover:text-champagne-ink"
              >
                Print
              </button>
            </div>
          </div>

          {record.status !== 'draft' && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              Submitted {record.submittedAt ? shortDate(record.submittedAt) : ''}. A submitted
              application can no longer be edited — call {SITE.phone} if something needs to
              change.
            </div>
          )}

          {/* readOnly for the answers, uploads still open: documents live in
              their own table and are deliberately not frozen at submit, so a
              missing pay stub can follow the application. */}
          <RentalApplicationForm
            applicationId={record.id}
            initial={record.data}
            readOnly
            documentUploads
          />
        </div>
      );
    }

    /* ---- The list ----------------------------------------------------- */
    if (rows.length === 0) {
      return (
        <Card>
          <h2 className="text-xl font-semibold uppercase tracking-wide text-ink">
            No applications yet
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Rental applications start from a link Kevin sends you. If you are expecting one and
            it has not arrived, get in touch.
          </p>
          <a
            href={telHref}
            className="mt-6 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/80"
          >
            Call {SITE.phone}
          </a>
        </Card>
      );
    }

    return (
      <ul className="space-y-4">
        {rows.map((record, i) => (
          <li
            key={record.id}
            className="enter"
            style={{ '--enter-delay': `${0.05 * i}s` } as React.CSSProperties}
          >
            <Link
              to={`/rentals?id=${record.id}`}
              className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-lg shadow-black/10 transition-colors hover:border-champagne"
            >
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-champagne-ink" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-semibold text-ink">
                  {record.data.tenancy.propertyAddress || 'Rental application'}
                  {record.data.tenancy.unit && (
                    <span className="text-gray-600"> · Unit {record.data.tenancy.unit}</span>
                  )}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {record.status === 'draft'
                    ? `Started ${shortDate(record.createdAt)}`
                    : `Submitted ${record.submittedAt ? shortDate(record.submittedAt) : ''}`}
                </p>
              </div>
              <StatusBadge status={record.status} />
            </Link>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <PageShell
      path="/rentals"
      seo={{
        title: 'Your Rental Applications',
        description: 'Your rental applications.',
        noindex: true,
      }}
      crumbs={CRUMBS}
      eyebrow="Rentals"
      h1="Your rental applications"
      lede="Everything you have started or submitted."
      heroSize="compact"
      width="wide"
      strip={false}
      actions={false}
      cta={false}
    >
      {body()}
    </PageShell>
  );
}
