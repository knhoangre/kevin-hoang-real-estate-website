import { CheckCircle, Lock } from 'lucide-react';

/**
 * The sign-in kiosk chrome for /open-house and /events.
 *
 * Both pages render four states — loading, access denied, success, form — and
 * each had hand-copied `min-h-screen flex items-center justify-center
 * bg-gray-50` + `bg-white rounded-lg shadow-lg p-8` eight times between them,
 * with `text-3xl font-bold` headings that matched nothing else on the site.
 * The card now sits on `bone` with the champagne rule and font-display heading
 * the public pages use.
 *
 * These run on a tablet at a door, so the card is centred and the type stays
 * large; that is the one thing this shell does differently from AdminShell.
 */
const KioskShell = ({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div className="flex min-h-screen items-center justify-center bg-bone px-4 py-24">
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-[0_2px_24px_rgba(13,13,15,0.06)]">
      {title && (
        <div className="mb-8 text-center">
          <span className="mx-auto mb-5 block h-px w-10 bg-champagne" aria-hidden />
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            {title}
          </h1>
          {subtitle && <p className="mt-3 text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  </div>
);

/** Centred status card: spinner, denied, or success. */
export const KioskStatus = ({
  icon,
  heading,
  body,
  children,
}: {
  icon: React.ReactNode;
  heading: string;
  body?: React.ReactNode;
  children?: React.ReactNode;
}) => (
  <KioskShell>
    <div className="text-center">
      <div className="mb-6 flex justify-center">{icon}</div>
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
        {heading}
      </h2>
      {body && <div className="mt-3 text-gray-600">{body}</div>}
      {children && <div className="mt-7">{children}</div>}
    </div>
  </KioskShell>
);

export const KioskLoading = () => (
  <KioskStatus
    icon={
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-champagne border-t-transparent"
        aria-hidden
      />
    }
    heading="Loading"
  />
);

export const KioskDenied = () => (
  <KioskStatus
    icon={<Lock className="h-12 w-12 text-champagne-ink" aria-hidden />}
    heading="Access restricted"
    body={
      <>
        <p>This page is only accessible to administrators.</p>
        <p className="mt-2 text-sm text-gray-500">
          Please contact an administrator if you need access.
        </p>
      </>
    }
  />
);

export const KioskSuccess = ({
  heading,
  body,
  children,
}: {
  heading: string;
  body?: React.ReactNode;
  children?: React.ReactNode;
}) => (
  <KioskStatus
    icon={<CheckCircle className="h-12 w-12 text-emerald-600" aria-hidden />}
    heading={heading}
    body={body}
  >
    {children}
  </KioskStatus>
);

/** The kiosk's primary button: ink-deep with a champagne hover, full width. */
export const kioskButtonClass =
  'w-full bg-ink-deep text-white hover:bg-champagne hover:text-ink-deep transition-colors';

export default KioskShell;
