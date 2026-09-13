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
      // px-3 py-1, not px-2.5 py-0.5. At half a unit of vertical padding the
      // label sat against the pill's own border — "In progress" and "Under
      // review" are two words in a rounded box, and they need room to read as a
      // label rather than as text that has outgrown its container.
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold leading-5 ${STATUS_TONE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
