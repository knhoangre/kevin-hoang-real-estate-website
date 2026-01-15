import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, ArrowRight, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import ContactQRCode from "./ContactQRCode";
import { useTranslation } from "react-i18next";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  phone: z
    .string()
    .regex(/^\d{3}-\d{3}-\d{4}$/, "Phone format should be XXX-XXX-XXXX"),
  message: z.string().min(1, "Message is required"),
});

type FormValues = z.infer<typeof formSchema>;

const Contact = () => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneDropdown, setPhoneDropdown] = useState(false);
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setPhoneDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Call the submit-contact Edge Function
      const { error: submitError } = await supabase.functions.invoke('submit-contact', {
        body: {
          firstName: form.getValues('firstName').trim(),
          lastName: form.getValues('lastName').trim(),
          email: form.getValues('email').trim().toLowerCase(),
          phone: form.getValues('phone') ? form.getValues('phone').trim() : null,
          message: form.getValues('message').trim(),
        }
      });

      if (submitError) {
        throw submitError;
      }

      setSuccess(true);
      form.reset();
      toast({
        title: "Success!",
        description: "Your message has been sent successfully.",
      });
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to submit form. Please try again.');
      toast({
        title: "Error",
        description: "There was an error submitting your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  return (
    <section id="contact" className="py-24 bg-white">
      <div className="container px-4">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-[#1a1a1a] uppercase">{t('contact.title')}</h2>
            <div className="space-y-6">
              <div className="flex items-center space-x-4 w-fit group relative"
                   ref={dropdownRef}
              >
                <Phone className="h-5 w-5 text-[#1a1a1a]" />
                <span
                  className="text-[#1a1a1a] uppercase relative cursor-pointer select-all"
                  onClick={() => setPhoneDropdown(!phoneDropdown)}
                >
                  (860) 682-2251
                  <span
                    className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2"
                  />
                </span>
                {phoneDropdown && (
                  <div className="dropdown-content opacity-100 visible absolute left-1/2 top-full mt-3 z-20 w-28 -translate-x-1/2 bg-white shadow-lg rounded-md transition-all duration-300">
                    <div className="flex flex-col items-center py-2">
                      <a href="tel:8606822251" className="block w-full text-center px-4 py-2 text-sm hover:bg-gray-100">{t('contact.call')}</a>
                      <a href="sms:8606822251" className="block w-full text-center px-4 py-2 text-sm hover:bg-gray-100">{t('contact.text')}</a>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4 w-fit">
                <Mail className="h-5 w-5 text-[#1a1a1a]" />
                <a href="mailto:KNHOANGRE@GMAIL.COM" className="relative group">
                  <span className="text-[#1a1a1a] uppercase relative">
                    KNHOANGRE@GMAIL.COM
                    <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                  </span>
                </a>
              </div>

              <div className="flex items-center space-x-4 w-fit">
                <MapPin className="h-5 w-5 text-[#1a1a1a]" />
                <a
                  href="https://maps.google.com/?q=150+WEST+ST,+NEEDHAM,+MA+02494"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group"
                >
                  <span className="text-[#1a1a1a] uppercase relative">
                    150 WEST ST, NEEDHAM, MA 02494
                    <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                  </span>
                </a>
              </div>

              <div className="flex items-center space-x-4 w-fit">
                <Calendar className="h-5 w-5 text-[#1a1a1a]" />
                <a
                  href="https://calendar.app.google/P297MnAu7ei6turA6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group"
                >
                  <span className="text-[#1a1a1a] uppercase relative">
                    SET AN APPOINTMENT WITH ME
                    <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                  </span>
                </a>
              </div>

              <div className="pt-4">
                <ContactQRCode />
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder={t('contact.form.first_name')} {...field} />
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
                        <Input placeholder={t('contact.form.last_name')} {...field} />
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
                        placeholder={t('contact.email')}
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
                        placeholder={t('contact.phone')}
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
                      <Textarea placeholder={t('contact.form.message')} className="h-32" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <button
                className="w-full bg-[#1a1a1a] text-white py-3 rounded-md hover:bg-black/80 transition-all duration-300 uppercase flex items-center justify-center group overflow-hidden relative"
                disabled={isSubmitting}
                type="submit"
              >
                <span className="group-hover:-translate-x-2 transition-transform duration-300">{t('contact.send_message')}</span>
                <ArrowRight className="ml-2 h-4 w-4 transform opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                <span className="absolute bottom-0 left-0 w-0 h-1 bg-white group-hover:w-full transition-all duration-700"></span>
              </button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
