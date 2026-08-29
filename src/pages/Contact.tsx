import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Clock, Send, ArrowRight, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ContactQRCode from '@/components/ContactQRCode';
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
import PageShell, { ShellSection } from "@/components/PageShell";
import { SITE, formattedAddress, mapsHref, smsHref, telHref } from "@/lib/siteConfig";
import { submitContactMessage } from "@/lib/submitContact";
import { EVENTS, track } from "@/lib/analytics";
import { agentIdentity, contactPage } from "@/lib/schema";

const Contact = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const formSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email format'),
    phone: z.string().optional(),
    message: z.string().min(1, 'Message is required'),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  // Add state for dropdown visibility
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Add event listeners for ESC key and clicks outside
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('phone-dropdown');
      const phoneButton = document.getElementById('phone-button');

      if (dropdown && phoneButton &&
          !dropdown.contains(event.target as Node) &&
          !phoneButton.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatPhoneNumber = (input: string) => {
    const numbers = input.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  /**
   * Sends the message.
   *
   * This used to be a `setTimeout` that showed the success toast and reset the
   * fields without contacting anything — so every message written on this page
   * was discarded while its sender was told it had been delivered. It now goes
   * through the same transport as the homepage form (@/lib/submitContact), and
   * a failure surfaces as a failure instead of a success.
   */
  const onSubmit = async () => {
    try {
      // Read through getValues() rather than the handler's argument: with this
      // version of @hookform/resolvers, handleSubmit's transformed-values
      // generic widens every field to optional, which does not satisfy
      // ContactMessage. The homepage form reads the same way.
      await submitContactMessage({
        firstName: form.getValues('firstName'),
        lastName: form.getValues('lastName'),
        email: form.getValues('email'),
        phone: form.getValues('phone'),
        message: form.getValues('message'),
      });
      track(EVENTS.lead, { form_location: 'contact_page' });
      toast({
        title: t('contact.form.message_sent_title'),
        description: t('contact.form.message_sent_description'),
      });
      form.reset();
    } catch (err) {
      console.error('Error submitting contact form:', err);
      toast({
        title: 'Message not sent',
        description: `Something went wrong sending that. Please try again, or call ${SITE.phone}.`,
        variant: 'destructive',
      });
    }
  };

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <PageShell
      path="/contact"
      crumbs={crumbs}
      seo={{
        title: 'Contact Kevin Hoang',
        // This was a plain string containing a literal `{SITE.phone}`, which is
        // not interpolation — the placeholder was shipping verbatim in the
        // meta description and og:description on the live page.
        description: `Get in touch about buying or selling in Needham, MetroWest, or Greater Boston. Call ${SITE.phone}, send a message, or book a consultation directly.`,
        keywords:
          'contact Kevin Hoang, real estate agent Needham MA contact, Greater Boston realtor phone number',
      }}
      /*
        agentIdentity(), not realEstateAgent().

        contactPage()'s mainEntity references #agent, and an @id only resolves
        against a node in the SAME document — so #agent has to be declared here.
        But the FULL node carries `employee: {'@id': '#kevin'}`, which is itself
        a reference, and #kevin is declared on the homepage and /about. Emitting
        it here traded one dangling reference for another; the SEO auditor
        caught exactly that. agentIdentity() is the compact declaration built for
        this case and has no onward references to strand.

        This also keeps the documented convention: the business is declared once,
        on the homepage, and every other page references that @id.
      */
      jsonLd={[agentIdentity(), contactPage()]}
      eyebrow="Get in touch"
      h1={t('contact.title')}
      lede={t('contact.subtitle')}
      hero={{
        image:
          'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1600&q=65',
        alt: 'A bright kitchen and dining area',
      }}
      heroSize="standard"
      width="wide"
      // No closing CTA band: this page is the call to action. A second one
      // below the form would just be asking twice.
      cta={false}
    >
      <ShellSection width="wide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="enter-left" style={{ '--enter-delay': '0.2s' } as React.CSSProperties}>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="relative h-40 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1073&q=80')" }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-ink/70 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-6">
                    <h2 className="text-2xl font-semibold text-white uppercase">{t('contact.contact_information')}</h2>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div
                    className="flex items-start relative"
                  >
                    <div className="bg-gray-100 p-3 rounded-full mr-4 flex-shrink-0">
                      <Phone className="w-5 h-5 text-ink" />
                    </div>
                    <div>
                      <h3 className="font-medium text-ink uppercase">{t('contact.phone')}</h3>
                      <div className="relative">
                        <button
                          id="phone-button"
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className="text-gray-600 hover:text-ink no-underline group"
                          style={{ borderBottom: "none", textDecoration: "none", position: "relative" }}
                        >
                          <span className="relative select-all">
                            {SITE.phone}
                            <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-ink group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                          </span>
                        </button>
                        <div
                          id="phone-dropdown"
                          className={`absolute left-1/2 top-8 z-20 w-28 -translate-x-1/2 bg-white shadow-lg rounded-md transition-all duration-300 ${dropdownOpen ? '' : 'hidden'}`}
                        >
                          <div className="flex flex-col items-center py-2">
                            <a href={telHref} className="block w-full text-center px-4 py-2 text-sm hover:bg-gray-100">{t('contact.call')}</a>
                            <a href={smsHref} className="block w-full text-center px-4 py-2 text-sm hover:bg-gray-100">{t('contact.text')}</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="bg-gray-100 p-3 rounded-full mr-4 flex-shrink-0">
                      <Mail className="w-5 h-5 text-ink" />
                    </div>
                    <div>
                      <h3 className="font-medium text-ink uppercase">{t('contact.email')}</h3>
                      <div className="relative">
                        <button
                          onClick={() => window.location.href = `mailto:${SITE.email}`}
                          className="text-gray-600 hover:text-ink no-underline group"
                          style={{ borderBottom: "none", textDecoration: "none", position: "relative" }}
                        >
                          <span className="relative select-all">
                            {SITE.email.toUpperCase()}
                            <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-ink group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="bg-gray-100 p-3 rounded-full mr-4 flex-shrink-0">
                      <MapPin className="w-5 h-5 text-ink" />
                    </div>
                    <div>
                      <h3 className="font-medium text-ink uppercase">{t('contact.office')}</h3>
                      <div className="relative">
                        <button
                          onClick={() => window.open(mapsHref, "_blank")}
                          className="text-gray-600 hover:text-ink no-underline group"
                          style={{ borderBottom: "none", textDecoration: "none", position: "relative" }}
                        >
                          <span className="relative select-all">
                            {formattedAddress.toUpperCase()}
                            <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-ink group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="bg-gray-100 p-3 rounded-full mr-4 flex-shrink-0">
                      <Calendar className="w-5 h-5 text-ink" />
                    </div>
                    <div>
                      <div className="relative">
                        <a
                          href={SITE.appointmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-ink no-underline group"
                          style={{ borderBottom: "none", textDecoration: "none", position: "relative" }}
                        >
                          <span className="relative select-all uppercase">
                            SET AN APPOINTMENT WITH ME
                            <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-ink group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                          </span>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-center">
                    <ContactQRCode />
                  </div>
                </div>
              </div>
            </div>

            <div className="enter-right" style={{ '--enter-delay': '0.3s' } as React.CSSProperties}>
              <div className="bg-white rounded-xl shadow-lg shadow-black/10 overflow-hidden relative border border-gray-100">
                <div className="p-6 bg-gray-50/50">
                  <h2 className="text-2xl font-semibold mb-6 text-ink uppercase">{t('contact.send_message')}</h2>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder={t('contact.form.first_name')} className="uppercase" {...field} />
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
                                <Input placeholder={t('contact.form.last_name')} className="uppercase" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder={t('contact.form.email')}
                                className="uppercase"
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
                        render={({ field: { onChange, ...rest } }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder={t('contact.form.phone_number')}
                                className="uppercase"
                                onChange={(e) => {
                                  const formatted = formatPhoneNumber(e.target.value);
                                  e.target.value = formatted;
                                  onChange(formatted);
                                }}
                                maxLength={12}
                                {...rest}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea placeholder={t('contact.form.message')} className="h-32 uppercase" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <button
                        className="w-full bg-ink text-white py-3 rounded-md hover:bg-black/80 transition-all duration-300 uppercase flex items-center justify-center group overflow-hidden relative"
                        disabled={form.formState.isSubmitting}
                        type="submit"
                      >
                        <span className="group-hover:-translate-x-2 transition-transform duration-300">{t('contact.form.send_message')}</span>
                        <ArrowRight className="ml-2 h-4 w-4 transform opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                        <span className="absolute bottom-0 left-0 w-0 h-1 bg-white group-hover:w-full transition-all duration-700"></span>
                      </button>
                    </form>
                  </Form>
                </div>
              </div>
            </div>
          </div>

          <section className="mt-20 border-t border-gray-200 pt-14">
            <div className="grid gap-12 md:grid-cols-2">
              <div>
                <h2 className="mb-4 text-2xl font-semibold text-ink">
                  What happens after you send this
                </h2>
                <p className="mb-4 text-gray-700 leading-relaxed">
                  Kevin replies personally, usually the same day. The first
                  conversation is a conversation — what you are trying to do, what
                  your timeline is, and what the realistic next step actually is.
                  There is no obligation attached to it, and if the honest answer is
                  that you should wait, that is the answer you will get.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  If it is faster to talk, call or text{' '}
                  <a href={telHref} className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink">
                    {SITE.phone}
                  </a>
                  , or{' '}
                  <a
                    href={SITE.appointmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink"
                  >
                    book a time directly
                  </a>
                  . Service is available in English and Vietnamese —{' '}
                  <Link to="/vietnamese-speaking-real-estate-agent" className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink">
                    tiếng Việt
                  </Link>
                  .
                </p>
              </div>
              <div>
                <h2 className="mb-4 text-2xl font-semibold text-ink">
                  You may not need to write at all
                </h2>
                <p className="mb-4 text-gray-700 leading-relaxed">
                  A lot of what people write in about is already answered on this
                  site, in more detail than a reply would give:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li>
                    <Link to="/home-valuation" className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink">
                      What is my home worth?
                    </Link>{' '}
                    — a written valuation from comparable sales
                  </li>
                  <li>
                    <Link to="/first-time-buyers" className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink">
                      Buying your first home in Massachusetts
                    </Link>
                  </li>
                  <li>
                    <Link to="/neighborhoods" className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink">
                      Which town should I be looking at?
                    </Link>{' '}
                    — {SITE.areaServed.length} guides
                  </li>
                  <li>
                    <Link to="/relocation" className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink">
                      Moving to Massachusetts
                    </Link>
                  </li>
                  <li>
                    <Link to="/faq" className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink">
                      Common Massachusetts real estate questions
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className="underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink">
                      Who Kevin is, and how to verify it
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </section>
      </ShellSection>
    </PageShell>
  );
};

export default Contact;
