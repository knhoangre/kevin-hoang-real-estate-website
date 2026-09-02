import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { submitContactMessage } from '@/lib/submitContact';
import { EVENTS, track } from '@/lib/analytics';
import type { IdxListing } from '@/lib/idxSearch';

/**
 * Ask about THIS listing, without picking up the phone.
 *
 * Until this existed the page offered a `tel:` link and a prefilled SMS and
 * nothing else, so anyone unwilling to ring a stranger — which is most people
 * browsing at 11pm — had no way to respond to a home they liked.
 *
 * SENDS THROUGH @/lib/submitContact, like the other two forms, and that is not
 * a stylistic preference. The reason that module exists is that /contact's
 * submit handler was once a setTimeout that showed a success toast and reset
 * the fields without sending anything; every message written on it was
 * discarded while its sender was told it had been delivered. A third form with
 * its own transport is that bug's next opportunity.
 *
 * The payload has no listing field, so the MLS number rides in the message body
 * — exactly what the SMS draft beside it already does. A `listing_mls` column
 * on contacts would be better for the CRM and is a separate change.
 */

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z
    .string()
    .regex(/^\d{3}-\d{3}-\d{4}$/, 'Phone format should be XXX-XXX-XXXX'),
  message: z.string().min(1, 'Message is required'),
});

type FormValues = z.infer<typeof formSchema>;

/** Hyphens as they type. Same shape as the homepage form's, digits only. */
const formatPhoneNumber = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
};

const ListingEnquiry = ({ listing }: { listing: IdxListing }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  /*
   * THE ADDRESS, NOT THE MLS NUMBER, and the message is already written — the
   * same reasoning as the text-message draft in the sidebar. The reader knows
   * this house as "80 Gary Rd"; asking them to compose a description of the
   * listing they are looking at is how a filled-in form becomes an abandoned
   * one. The MLS number stays on the end so it is unambiguous on receipt, where
   * a street name can repeat across towns.
   */
  const where = [listing.address, listing.town].filter(Boolean).join(', ');
  const defaultMessage = `Hi Kevin, I'm interested in ${
    where || `MLS ${listing.mls_number}`
  } (MLS ${listing.mls_number}). Is it still available, and could I see it?`;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      message: defaultMessage,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Spelled out field by field rather than passed through, because the
      // resolver's inferred argument type marks every field optional while
      // ContactMessage requires them — the zod schema already guarantees they
      // are present by the time this runs.
      await submitContactMessage({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        message: values.message,
      });
      setSent(true);
      // Only after a genuine success. A lead event on a failed submit inflates
      // the one number the whole funnel is judged by.
      track(EVENTS.lead, { form_location: 'listing', mls_number: listing.mls_number });
      toast({
        title: 'Message sent',
        description: `Kevin will get back to you about ${where || `MLS ${listing.mls_number}`}.`,
      });
    } catch (err) {
      console.error('Error submitting listing enquiry:', err);
      toast({
        title: 'Error',
        description: 'There was an error sending your message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <section className="mt-12 rounded-2xl border border-gray-200 bg-bone p-8 print:hidden">
        <span className="mb-4 block h-px w-10 bg-champagne" aria-hidden />
        <h2 className="font-display text-2xl font-semibold text-ink">Message sent</h2>
        <p className="mt-3 text-gray-600">
          Thanks — Kevin will be in touch about{' '}
          {where || `MLS ${listing.mls_number}`} shortly.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-12 rounded-2xl border border-gray-200 bg-bone p-8 print:hidden">
      <span className="mb-4 block h-px w-10 bg-champagne" aria-hidden />
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
        Ask about {listing.address ?? `MLS ${listing.mls_number}`}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-gray-600">
        Questions about the home, the street, or what it will actually take to
        get it — send them here and Kevin will reply.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="First name" autoComplete="given-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Last name" autoComplete="family-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="email"
                      inputMode="email"
                      placeholder="Email"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="tel"
                      inputMode="tel"
                      placeholder="555-555-5555"
                      autoComplete="tel"
                      {...field}
                      onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea rows={4} placeholder="Your message" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-pill btn-pill-light inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-deep px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-champagne hover:text-ink-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" aria-hidden />
            {isSubmitting ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </Form>
    </section>
  );
};

export default ListingEnquiry;
