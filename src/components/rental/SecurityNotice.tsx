/**
 * What protects the applicant's information, said plainly.
 *
 * Someone is being asked to hand over a photo ID, pay stubs and a tax return to
 * a website, which is a reasonable thing to hesitate over. This says what is
 * actually true of this portal.
 *
 * EVERY LINE HERE IS A CLAIM ABOUT THE CODE, and each one is checkable:
 *
 *   - the link      the invites table has no read policy for anon or
 *                   authenticated, and a token resolves only inside the
 *                   rental-application-invite edge function
 *   - who can see   RLS on rental_applications and
 *                   rental_application_documents: the owning applicant, or
 *                   public.is_admin()
 *   - documents     the rental-documents bucket is private, with no public
 *                   SELECT policy; documentUrl() mints a 300-second signed URL
 *                   per click and getPublicUrl is never called
 *   - never asked   no SSN and no bank account fields exist in
 *                   rentalApplicationSchema, by decision, not omission
 *   - removal       the applicant has a DELETE policy on their own documents
 *
 * So do not add a line here without the thing it describes being true, and do
 * not soften one into marketing. "Bank-level encryption" is the sort of claim
 * that cannot be checked and should never appear. If a policy changes, this copy
 * changes with it.
 */
import { FileLock2, KeyRound, ShieldCheck, Trash2, UserCheck } from 'lucide-react';

const POINTS = [
  {
    Icon: KeyRound,
    title: 'Your link is yours',
    body: 'The invite that brought you here works only for your account. It cannot be looked up, guessed, or opened by anyone else.',
  },
  {
    Icon: UserCheck,
    title: 'Only you and Kevin',
    body: 'Your application and everything you upload are visible to you and to Kevin. No other applicant can reach them, signed in or not.',
  },
  {
    Icon: FileLock2,
    title: 'Documents are not public',
    body: 'Uploads are kept in private storage — never on a public web address. Each time one is opened it gets a link that stops working after five minutes.',
  },
  {
    Icon: ShieldCheck,
    title: 'We never ask for your SSN or bank account',
    body: 'Neither appears anywhere in this application, on purpose. If a document you upload shows an account number, black it out first — it is not needed.',
  },
  {
    Icon: Trash2,
    title: 'You can remove what you upload',
    body: 'Any document you add can be deleted by you at any time, and it is removed from storage, not just hidden.',
  },
];

export default function SecurityNotice() {
  return (
    <section
      aria-labelledby="security-heading"
      className="enter rounded-xl border border-gray-100 bg-white p-6 shadow-lg shadow-black/10 sm:p-8 print:hidden"
    >
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-champagne-ink" aria-hidden />
        <div>
          <h2
            id="security-heading"
            className="text-xl font-semibold uppercase tracking-wide text-ink"
          >
            Your information is protected
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
            You are being asked for documents that matter. Here is exactly what happens to them.
          </p>
        </div>
      </div>

      <dl className="mt-6 grid gap-5 sm:grid-cols-2">
        {POINTS.map(({ Icon, title, body }) => (
          <div key={title} className="flex items-start gap-3">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-champagne-ink" aria-hidden />
            <div>
              <dt className="text-sm font-semibold text-ink">{title}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-gray-600">{body}</dd>
            </div>
          </div>
        ))}
      </dl>

      <p className="mt-6 border-t border-gray-100 pt-4 text-xs leading-relaxed text-gray-500">
        Your connection to this site is encrypted, and your application is stored in a database
        that only this site can reach. Kevin uses what you provide to consider your application
        for this unit and does not sell it or pass it to anyone not involved in that decision.
      </p>
    </section>
  );
}
