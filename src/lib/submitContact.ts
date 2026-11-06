/**
 * The one path a contact message takes to the server.
 *
 * This exists because there are two contact forms — <Contact> on the homepage
 * and the form on /contact — and they had diverged in the worst possible
 * direction: the homepage form invoked the `submit-contact` Edge Function,
 * while /contact's `onSubmit` was a `setTimeout` that showed a success toast and
 * reset the fields WITHOUT SENDING ANYTHING. Every message written on /contact —
 * the page the navbar, the footer, and every CTA link to — was discarded, and
 * the sender was told it had been sent.
 *
 * Two forms, one transport. Each keeps its own markup and its own pending/error
 * UI; neither owns the payload shape or the endpoint any more, so a fix to
 * either reaches both.
 */
import { supabase } from '@/integrations/supabase/client';

export interface ContactMessage {
  firstName: string;
  lastName: string;
  email: string;
  /** Optional. Empty strings are normalised to null rather than stored blank. */
  phone?: string | null;
  message: string;
  /** 'zh' for the Chinese contact form: the function also tells Maggie Li. */
  lang?: 'zh';
}

/**
 * Normalises and sends a contact message.
 *
 * Trimming and lower-casing happen HERE rather than in either form, so the two
 * cannot disagree about what a submitted email address looks like — the address
 * is the de-duplication key on the contacts table.
 *
 * Throws on failure. Callers are expected to catch and surface their own error
 * UI; returning a silent failure is what produced the bug this module exists to
 * prevent.
 */
export const submitContactMessage = async (values: ContactMessage): Promise<void> => {
  const phone = values.phone?.trim();

  const { error } = await supabase.functions.invoke('submit-contact', {
    body: {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: phone ? phone : null,
      message: values.message.trim(),
      ...(values.lang ? { lang: values.lang } : {}),
    },
  });

  if (error) throw error;
};

/** When a seller expects to sell, as the valuation form offers it. */
export const VALUATION_TIMINGS = [
  { value: 'curious', label: 'Just curious about the value' },
  { value: '0-3', label: 'Within 3 months' },
  { value: '3-6', label: 'In 3 to 6 months' },
  { value: '6-12', label: 'In 6 to 12 months' },
  { value: 'later', label: 'More than a year away' },
] as const;

export type ValuationTiming = (typeof VALUATION_TIMINGS)[number]['value'];

export interface ValuationRequest {
  street: string;
  unit?: string;
  town: string;
  zip?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  timing?: ValuationTiming | null;
  notes?: string;
  /** The hidden field. Sent as typed, so the function can tell a bot. */
  website?: string;
}

/**
 * A request for a written valuation, from /home-valuation. Its own function
 * rather than a message through submit-contact: it carries an address, files
 * the person in the CRM as a seller, and says which property in the subject.
 * Normalised here for the same reason as above. Throws on failure.
 */
export const submitValuationRequest = async (values: ValuationRequest): Promise<void> => {
  const clean = (s?: string | null) => (s ?? '').trim();
  const { error } = await supabase.functions.invoke('submit-valuation-request', {
    body: {
      street: clean(values.street),
      unit: clean(values.unit),
      town: clean(values.town),
      zip: clean(values.zip),
      firstName: clean(values.firstName),
      lastName: clean(values.lastName),
      email: clean(values.email).toLowerCase(),
      phone: clean(values.phone),
      timing: values.timing ?? null,
      notes: clean(values.notes),
      website: clean(values.website),
    },
  });
  if (error) throw error;
};
