/**
 * An application's status, as a pill.
 *
 * Its own module rather than an export from a page: /admin/applications and
 * /rentals both render it, and importing it from the Rentals *page* would pull
 * that whole route into the admin bundle.
 *
 * The colours come from STATUS_TONE, which is deliberately not champagne —
 * approved and declined have to differ at a glance, which is the entire point
 * of the field. Recolouring a signal to the brand accent deletes the signal.
 */
import { STATUS_LABEL, STATUS_TONE, type ApplicationStatus } from '@/lib/rentalApplication';

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
