import { useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import AddressAutocomplete from '@/components/admin/AddressAutocomplete';
import { submitValuationRequest, VALUATION_TIMINGS, type ValuationTiming } from '@/lib/submitContact';
import { EVENTS, track } from '@/lib/analytics';
import { formatPhoneInput, isPhone } from '@/lib/phone';
import { SITE } from '@/lib/siteConfig';
import { pill } from '@/lib/pill';

/**
 * The request for a written valuation, on /home-valuation.
 *
 * Until 2026-11-06 that page's only button went to /contact, whose form has no
 * address field, so the one thing a valuation cannot start without had to be
 * typed into a free-text message, if anyone thought to. This asks for the
 * address first and suggests it from MassGIS, the same field the rental invites
 * use; picking a suggestion fills the town and ZIP.
 *
 * Plain state, not react-hook-form: eleven fields, one rule that spans two of
 * them (an email OR a phone), and nothing saved as a draft.
 */
const empty = {
  street: '',
  unit: '',
  town: '',
  zip: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  timing: '' as ValuationTiming | '',
  notes: '',
  // A field people never see. A bot that fills every input fills this one,
  // and the function quietly accepts and drops the request.
  website: '',
};

const label = 'block text-sm font-medium text-ink';
const field = 'mt-1.5';

const ValuationRequestForm = () => {
  const [v, setV] = useState(empty);
  const [problem, setProblem] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const set = (k: keyof typeof empty) => (value: string) => setV((cur) => ({ ...cur, [k]: value }));

  const check = (): string | null => {
    if (!v.street.trim() || !v.town.trim()) return 'Please give the street address and the town.';
    if (!v.firstName.trim() || !v.lastName.trim()) return 'Please give your first and last name.';
    const email = v.email.trim();
    if (!email && !v.phone.trim()) return 'Please give an email address or a phone number, so Kevin can send it.';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'That email address does not look complete.';
    if (v.phone.trim() && !isPhone(v.phone)) return 'Please give the phone number as ten digits.';
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wrong = check();
    setProblem(wrong);
    if (wrong) return;
    setState('sending');
    try {
      await submitValuationRequest({ ...v, timing: v.timing || null });
      track(EVENTS.lead, { form_location: 'home_valuation' });
      setState('sent');
    } catch (err) {
      console.error('Error sending the valuation request:', err);
      setProblem(`Something went wrong sending that. Please try again, or call ${SITE.phone}.`);
      setState('idle');
    }
  };

  if (state === 'sent') {
    return (
      <div className="rounded-2xl border border-champagne/50 bg-white p-8 text-center shadow-sm" role="status">
        <CheckCircle2 className="mx-auto h-10 w-10 text-champagne-ink" aria-hidden />
        <p className="mt-4 text-xl font-semibold text-ink">Kevin has your request.</p>
        <p className="mt-2 leading-relaxed text-gray-700">
          He will be in touch about {v.street.trim()} to ask anything the records will not show, and to arrange a
          walkthrough if you would like one.
          {v.email.trim() ? ' A copy of what you sent is on its way to your inbox.' : ''}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
      <fieldset className="space-y-5">
        <legend className="text-lg font-semibold text-ink">The property</legend>
        <div>
          <label htmlFor="val-street" className={label}>
            Street address
          </label>
          <div className={field}>
            <AddressAutocomplete
              id="val-street"
              value={v.street}
              onChange={set('street')}
              onSelect={(s) => setV((cur) => ({ ...cur, street: s.street, town: s.town, zip: s.zip }))}
              required
              placeholder="Start typing, e.g. 12 Elm St"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_2fr_1fr]">
          <div>
            <label htmlFor="val-unit" className={label}>
              Unit <span className="font-normal text-gray-500">(if any)</span>
            </label>
            <Input id="val-unit" className={field} value={v.unit} onChange={(e) => set('unit')(e.target.value)} />
          </div>
          <div>
            <label htmlFor="val-town" className={label}>
              Town
            </label>
            <Input
              id="val-town"
              className={field}
              value={v.town}
              onChange={(e) => set('town')(e.target.value)}
              autoComplete="address-level2"
              required
            />
          </div>
          <div>
            <label htmlFor="val-zip" className={label}>
              ZIP
            </label>
            {/* Not inputMode="numeric": a leading zero is what a numeric field
                eats, and most ZIPs here start with one. */}
            <Input
              id="val-zip"
              className={field}
              value={v.zip}
              onChange={(e) => set('zip')(e.target.value)}
              autoComplete="postal-code"
            />
          </div>
        </div>
        <div>
          <label htmlFor="val-timing" className={label}>
            When might you sell?
          </label>
          <NativeSelect
            id="val-timing"
            wrapperClassName={field}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={v.timing}
            onChange={(e) => set('timing')(e.target.value)}
          >
            <option value="">Choose one (optional)</option>
            {VALUATION_TIMINGS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div>
          <label htmlFor="val-notes" className={label}>
            Anything the public record will not show{' '}
            <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <Textarea
            id="val-notes"
            className={`${field} h-28`}
            value={v.notes}
            onChange={(e) => set('notes')(e.target.value)}
            placeholder="Work done and roughly when, known problems, tenants…"
          />
        </div>
      </fieldset>

      {/* The rule on a wrapper: on the fieldset itself the legend sits in the
          border line, with the padding under it. */}
      <div className="mt-8 border-t border-gray-100 pt-8">
      <fieldset className="space-y-5">
        <legend className="text-lg font-semibold text-ink">You</legend>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="val-first" className={label}>
              First name
            </label>
            <Input
              id="val-first"
              className={field}
              value={v.firstName}
              onChange={(e) => set('firstName')(e.target.value)}
              autoComplete="given-name"
              required
            />
          </div>
          <div>
            <label htmlFor="val-last" className={label}>
              Last name
            </label>
            <Input
              id="val-last"
              className={field}
              value={v.lastName}
              onChange={(e) => set('lastName')(e.target.value)}
              autoComplete="family-name"
              required
            />
          </div>
          <div>
            <label htmlFor="val-email" className={label}>
              Email
            </label>
            <Input
              id="val-email"
              type="email"
              className={field}
              value={v.email}
              onChange={(e) => set('email')(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="val-phone" className={label}>
              Phone
            </label>
            {/* No maxLength: the browser applies it to pasted text before
                onChange runs, so "+1 (203) 379-8682" would arrive cut short. */}
            <Input
              id="val-phone"
              type="tel"
              className={field}
              value={v.phone}
              onChange={(e) => set('phone')(formatPhoneInput(e.target.value))}
              autoComplete="tel"
              placeholder="617-555-0123"
            />
          </div>
        </div>
        <p className="text-sm text-gray-500">An email address or a phone number is enough.</p>
        <div className="hidden" aria-hidden>
          <label htmlFor="val-website">Website</label>
          <input
            id="val-website"
            tabIndex={-1}
            autoComplete="off"
            value={v.website}
            onChange={(e) => set('website')(e.target.value)}
          />
        </div>
      </fieldset>
      </div>

      {problem && (
        <p className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {problem}
        </p>
      )}

      <button type="submit" disabled={state === 'sending'} className={pill('ink', 'md', 'group mt-8 w-full sm:w-auto')}>
        <Send className="h-4 w-4" aria-hidden />
        {state === 'sending' ? 'Sending…' : 'Request my valuation'}
      </button>
      <p className="mt-4 text-xs leading-relaxed text-gray-500">
        Sent to {SITE.agentName}, {SITE.brokerage}, and nobody else. Free, and no obligation to list.
      </p>
    </form>
  );
};

export default ValuationRequestForm;
