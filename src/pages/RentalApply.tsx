/**
 * /apply/<token> — the shared rental application link.
 *
 * Three states, in order:
 *
 *   1. Resolving the token. The invite table has no read policy for anyone but
 *      an admin, so this goes through the rental-application-invite edge
 *      function, which returns only what the link is FOR.
 *   2. Signed out. Sign in or create an account, with the property shown above
 *      it so the visitor knows what they are signing up for. Account first is
 *      what makes the rest of this simple: the application row is owned by
 *      auth.uid(), so RLS is the whole access story and the applicant can leave
 *      and come back to a saved draft.
 *   3. Signed in. Claim the invite — which creates their draft or returns the
 *      one they started — and render the document.
 *
 * Every unusable link (unknown, expired, revoked, already claimed by somebody
 * else) lands on the same generic panel. The distinctions are real but telling
 * a stranger which one applies turns this page into a token-guessing oracle.
 *
 * This route is NOT prerendered per token — there is no `getStaticPaths`,
 * because tokens are created at runtime. It relies on the scoped rewrite in
 * vercel.json, exactly as /search/:mls does.
 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import PageShell, { ShellSection } from '@/components/PageShell';
import { useAuth } from '@/contexts/AuthContext';
import RentalApplicationForm from '@/components/rental/RentalApplicationForm';
import InviteSignIn from '@/components/rental/InviteSignIn';
import SecurityNotice from '@/components/rental/SecurityNotice';
import {
  getApplication,
  claimInvite,
  resolveInvite,
  emptyApplication,
  formatProperty,
  type ResolvedInvite,
  type RentalApplicationData,
} from '@/lib/rentalApplication';
import { SITE, telHref } from '@/lib/siteConfig';

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Rental application', path: '/apply' },
];

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-lg shadow-black/10">
    {children}
  </div>
);

const Centered = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-[30vh] items-center justify-center">{children}</div>
);

/** One refusal for every unusable link. See the header comment. */
const Unavailable = () => (
  <Panel>
    <h2 className="text-xl font-semibold uppercase tracking-wide text-ink">
      This link is no longer available
    </h2>
    <p className="mt-3 text-sm leading-relaxed text-gray-600">
      Application links expire and can be withdrawn, and each one can only be used by the person
      it was sent to. If you think this one should still work, get in touch and we will send a
      fresh link.
    </p>
    <div className="mt-6 flex flex-wrap gap-3">
      <a
        href={telHref}
        className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/80"
      >
        Call {SITE.phone}
      </a>
      <a
        href="/contact"
        className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-champagne hover:text-champagne-ink"
      >
        Send a message
      </a>
    </div>
  </Panel>
);

/** What this application is for. Shown before sign-up and above the form. */
const OfferCard = ({ invite }: { invite: ResolvedInvite }) => {
  const heading = invite.label || formatProperty(invite);
  if (!heading) return null;
  return (
    <div className="mb-6 rounded-xl border border-champagne/40 bg-bone p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-champagne-ink">
        Applying for
      </p>
      {/* `numeral`, not font-display. This is a street address, so it is half
          digits, and Playfair's old-style figures sit at a different height and
          weight from its letters — "12 Elm Street · Needham, MA 02492" read as
          two mismatched halves. Same resolution as the sign-in group titles in
          components/admin/SignInGroups.tsx. The unit is already part of the
          label and of formatProperty, so it is not appended again here. */}
      <p className="numeral mt-1.5 text-lg font-semibold text-ink">{heading}</p>
      {invite.monthlyRent != null && (
        <p className="numeral mt-1 text-sm text-gray-600">
          ${Number(invite.monthlyRent).toLocaleString()} per month
        </p>
      )}
    </div>
  );
};

export default function RentalApply() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [invite, setInvite] = useState<ResolvedInvite | null>(null);
  const [initial, setInitial] = useState<RentalApplicationData | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'invalid' | 'error'>('loading');

  /* ---- Resolve, then (once signed in) claim ------------------------- */
  const load = useCallback(async () => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    try {
      // Signed out: only resolve. Claiming needs a user to own the row.
      if (!user) {
        const resolved = await resolveInvite(token);
        setInvite(resolved);
        setStatus(resolved.valid ? 'ready' : 'invalid');
        return;
      }

      const claimed = await claimInvite(token);
      if (!claimed.valid || !claimed.applicationId) {
        setStatus('invalid');
        return;
      }
      setInvite(claimed);

      // A submitted application is read at /rentals, which is where it lives
      // permanently — sending them back through /apply would show an editable
      // form that the database would then refuse to save.
      if (claimed.status && claimed.status !== 'draft') {
        navigate(`/rentals?id=${claimed.applicationId}`, { replace: true });
        return;
      }

      const record = await getApplication(claimed.applicationId);
      setInitial(seedFromInvite(record?.data ?? emptyApplication(), claimed));
      setStatus('ready');
    } catch (err) {
      console.error('Could not open the application:', err);
      setStatus('error');
    }
  }, [token, user, navigate]);

  useEffect(() => {
    // Wait for the session to settle. Acting on `user === null` mid-restore
    // would show the sign-in panel to somebody who is already signed in.
    if (authLoading) return;
    void load();
  }, [authLoading, load]);

  /* ---- Render ------------------------------------------------------- */
  const body = () => {
    if (authLoading || status === 'loading') {
      return (
        <Centered>
          <Loader2 className="h-8 w-8 animate-spin text-champagne-ink" aria-hidden />
          <span className="sr-only">Loading your application</span>
        </Centered>
      );
    }

    if (status === 'invalid') return <Unavailable />;

    if (status === 'error') {
      return (
        <Panel>
          <h2 className="text-xl font-semibold uppercase tracking-wide text-ink">
            Something went wrong
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            We could not open the application just now. Please refresh the page, or call{' '}
            {SITE.phone}.
          </p>
        </Panel>
      );
    }

    if (!user) {
      return (
        <>
          {invite && <OfferCard invite={invite} />}
          <InviteSignIn />
          {/* Also here, BEFORE the account is created. This is the point where
              somebody decides whether to hand over an ID at all. */}
          <div className="mt-6">
            <SecurityNotice />
          </div>
        </>
      );
    }

    if (!initial) {
      return (
        <Centered>
          <Loader2 className="h-8 w-8 animate-spin text-champagne-ink" aria-hidden />
        </Centered>
      );
    }

    return (
      <>
        {invite && <OfferCard invite={invite} />}
        {/* Above the form, not buried at the bottom: the question "is this safe"
            is asked before the first field, not after the last one. */}
        <div className="mb-6">
          <SecurityNotice />
        </div>
        <RentalApplicationForm
          applicationId={invite?.applicationId ?? ''}
          initial={initial}
          onSubmitted={() => navigate(`/rentals?id=${invite?.applicationId}`)}
        />
      </>
    );
  };

  return (
    <PageShell
      path="/apply"
      seo={{
        title: 'Rental Application',
        description: 'Complete your rental application.',
        noindex: true,
      }}
      crumbs={CRUMBS}
      eyebrow="Rental application"
      hero={{
        image:
          'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=65',
        alt: 'Keys being handed over on the doorstep of a new home',
      }}
      h1="Your rental application"
      lede="It takes about ten minutes. Your answers save as you go, so you can stop and come back."
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

/**
 * Copies the invite's property details, and the address it was sent to, into an
 * untouched draft — so the applicant supplies their name and phone and not much
 * else before the real questions start.
 *
 * Only where they have not already typed something — re-seeding on every load
 * would overwrite a correction they made on purpose, and someone who signed up
 * with a different address than the one Kevin mailed should keep theirs.
 */
const seedFromInvite = (
  data: RentalApplicationData,
  invite: ResolvedInvite
): RentalApplicationData => ({
  ...data,
  applicant: {
    ...data.applicant,
    email: data.applicant.email || invite.inviteeEmail || '',
  },
  tenancy: {
    ...data.tenancy,
    // The whole place — street, town, state, ZIP — but NOT the unit, which has
    // its own field right beside this one. Including it here is what produced
    // "42 Newman St · Unit 3, Malden, MA 02148 · Unit 3" wherever the two were
    // shown together.
    propertyAddress: data.tenancy.propertyAddress || formatProperty(invite, { withUnit: false }) || '',
    unit: data.tenancy.unit || invite.unit || '',
    baseRent: data.tenancy.baseRent || (invite.monthlyRent != null ? String(invite.monthlyRent) : ''),
  },
});
