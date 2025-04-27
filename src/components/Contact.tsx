import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, ArrowRight } from "lucide-react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneDropdown, setPhoneDropdown] = useState(false);
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const { data: firstNameData, error: firstNameError } = await supabase
        .from('contact_first_names')
        .insert({ first_name: data.firstName })
        .select()
        .single();
      if (firstNameError) throw firstNameError;

      const { data: lastNameData, error: lastNameError } = await supabase
        .from('contact_last_names')
        .insert({ last_name: data.lastName })
        .select()
        .single();
      if (lastNameError) throw lastNameError;

      const { data: emailData, error: emailError } = await supabase
        .from('contact_emails')
        .insert({ email: data.email })
        .select()
        .single();
      if (emailError) throw emailError;

      const { data: phoneData, error: phoneError } = await supabase
        .from('contact_phones')
        .insert({ phone: data.phone })
        .select()
        .single();
      if (phoneError) throw phoneError;

      const { error: messageError } = await supabase
        .from('contact_messages')
        .insert({
          first_name_id: firstNameData.id,
          last_name_id: lastNameData.id,
          email_id: emailData.id,
          phone_id: phoneData.id,
          message: data.message
        });
      if (messageError) throw messageError;

      const response = await supabase.functions.invoke('submit-contact', {
        body: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          message: data.message
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Message sent!",
        description: "Thank you for contacting us. We'll respond shortly.",
      });
      
      form.reset();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "There was a problem sending your message. Please try again.",
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
            <h2 className="text-4xl font-bold text-[#1a1a1a] uppercase">Contact Information</h2>
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
                      <a href="tel:8606822251" className="block w-full text-center px-4 py-2 text-sm hover:bg-gray-100">Call</a>
                      <a href="sms:8606822251" className="block w-full text-center px-4 py-2 text-sm hover:bg-gray-100">Text</a>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4 w-fit group">
                <Mail className="h-5 w-5 text-[#1a1a1a]" />
                <a href="mailto:KNHOANGRE@GMAIL.COM" className="relative group">
                  <span className="text-[#1a1a1a] uppercase relative">
                    KNHOANGRE@GMAIL.COM
                    <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                  </span>
                </a>
              </div>

              <div className="flex items-center space-x-4 w-fit group">
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
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="FIRST NAME" className="uppercase" {...field} />
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
                        <Input placeholder="LAST NAME" className="uppercase" {...field} />
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
                        placeholder="EMAIL"
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
                        placeholder="PHONE NUMBER (XXX-XXX-XXXX)"
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
                      <Textarea placeholder="MESSAGE" className="h-32 uppercase" {...field} />
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
                <span className="group-hover:-translate-x-2 transition-transform duration-300">SEND MESSAGE</span>
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
