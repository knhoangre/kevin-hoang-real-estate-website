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
 * The document itself renders through RentalApplicationForm, so there is exactly
 * one rendering of an application on this site — the applicant's copy cannot
 * drift from the admin's. It is editable while the status is draft or submitted
 * and read-only from the moment review starts; `isApplicantEditable` is the one
 * place that decides, mirroring the database trigger.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, Loader2, XCircle } from 'lucide-react';
import PageShell, { ShellSection } from '@/components/PageShell';
import { useAuth } from '@/contexts/AuthContext';
import RentalApplicationForm from '@/components/rental/RentalApplicationForm';
import StatusBadge from '@/components/rental/StatusBadge';
import {
  formatTenancyAddress,
  isApplicantEditable,
  listMyApplications,
  withdrawApplication,
  type RentalApplicationRecord,
} from '@/lib/rentalApplication';
import { useToast } from '@/components/ui/use-toast';
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
  const [withdrawing, setWithdrawing] = useState(false);
  const { toast } = useToast();

  const withdraw = async (id: string) => {
    if (withdrawing) return;
    if (
      !window.confirm(
        'Withdraw this application? Kevin will see that you are no longer interested, and you will not be able to edit it afterwards.'
      )
    )
      return;
    setWithdrawing(true);
    try {
      await withdrawApplication(id);
      setRows((prev) =>
        (prev ?? []).map((r) => (r.id === id ? { ...r, status: 'withdrawn' as const } : r))
      );
      toast({ title: 'Application withdrawn' });
    } catch (err) {
      console.error('Could not withdraw the application:', err);
      toast({
        variant: 'destructive',
        title: 'Could not withdraw it',
        description: 'Please try again in a moment.',
      });
    } finally {
      setWithdrawing(false);
    }
  };

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
              {/* Withdrawing is how somebody stops their own application, and it
                  is deliberately not a return to draft — an application that
                  quietly left the admin's list would leave them waiting on a
                  decision nobody was going to make. */}
              {isApplicantEditable(record.status) && (
                <button
                  type="button"
                  onClick={() => withdraw(record.id)}
                  disabled={withdrawing}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-red-300 hover:text-red-700 disabled:opacity-60"
                >
                  {withdrawing ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <XCircle className="h-4 w-4" aria-hidden />
                  )}
                  Withdraw
                </button>
              )}
            </div>
          </div>

          {record.status === 'submitted' && (
            <div className="numeral mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              Sent {record.submittedAt ? shortDate(record.submittedAt) : ''}. You can still change
              your answers and add documents until Kevin starts reviewing it. Send it again after
              an edit so he reads the version you meant.
            </div>
          )}

          {!isApplicantEditable(record.status) && record.status !== 'withdrawn' && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              This application is being reviewed, so the answers are now fixed — call{' '}
              <a href={telHref} className="font-semibold underline">
                {SITE.phone}
              </a>{' '}
              if something needs to change. You can still add documents.
            </div>
          )}

          {/* Documents stay uploadable at every status: they live in their own
              table and are deliberately not frozen, so a missing pay stub can
              follow the application even after a decision is underway. */}
          <RentalApplicationForm
            applicationId={record.id}
            initial={record.data}
            readOnly={!isApplicantEditable(record.status)}
            documentUploads
            alreadySent={record.status !== 'draft'}
            onSubmitted={load}
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
                {/* See the note in RentalApply's OfferCard: addresses go in
                    Inter with lining, tabular figures, not the display serif. */}
                <p className="numeral text-lg font-semibold text-ink">
                  {formatTenancyAddress(record.data.tenancy) || 'Rental application'}
                </p>
                <p className="numeral mt-1 text-sm text-gray-600">
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
      hero={{
        image:
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=65',
        alt: 'The interior of a first home, sparsely furnished',
      }}
      h1="Your rental applications"
      lede="Everything you have started or submitted."
      heroSize="compact"
      width="wide"
      strip={false}
      actions={false}
      cta={false}
    >
      {/* Every other page on the site wraps its body in ShellSection; these two
          passed children straight through, so they rendered full-bleed with no
          horizontal padding and no width cap — the sticky section index sat
          against the window, and the body ran past max-w-6xl on a wide screen.
          Shorter vertical padding than the default because this is a form to
          work through, not a page to read. */}
      <ShellSection width="wide" className="pb-20 pt-10 md:pt-12 bg-white">
        {body()}
      </ShellSection>
    </PageShell>
  );
}
