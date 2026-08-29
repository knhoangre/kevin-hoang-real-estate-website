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
    },
  });

  if (error) throw error;
};
