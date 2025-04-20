
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  phone: z
    .string()
    .regex(/^\d{3}-\d{3}-\d{4}$/, "Phone format should be XXX-XXX-XXXX"),
  message: z.string().min(1, "Message is required"),
});

type FormValues = z.infer<typeof formSchema>;

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    setIsSubmitting(true);
    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message sent!",
        description: "Thank you for contacting us. We'll respond shortly.",
      });
      form.reset();
      setIsSubmitting(false);
    }, 1000);
  };

  const formatPhoneNumber = (value: string) => {
    // Strip all non-numeric characters
    const numbers = value.replace(/\D/g, "");
    
    // Format as XXX-XXX-XXXX
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  return (
    <section id="contact" className="py-24 bg-white">
      <div className="container px-4">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-[#1a1a1a]">GET IN TOUCH</h2>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4 w-fit group">
                <Phone className="h-5 w-5 text-[#1a1a1a]" />
                <div className="relative dropdown">
                  <span className="text-[#1a1a1a] uppercase cursor-pointer">
                    (860) 682-2251
                    <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                  </span>
                  <div className="dropdown-content opacity-0 invisible group-hover:opacity-100 group-hover:visible absolute left-0 mt-2 w-24 bg-white shadow-lg rounded-md transition-all duration-300 z-10">
                    <a href="tel:8606822251" className="block px-4 py-2 text-sm hover:bg-gray-100">Call</a>
                    <a href="sms:8606822251" className="block px-4 py-2 text-sm hover:bg-gray-100">Text</a>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 w-fit group">
                <Mail className="h-5 w-5 text-[#1a1a1a]" />
                <a href="mailto:KNHOANGRE@GMAIL.COM" className="relative">
                  <span className="text-[#1a1a1a] uppercase">
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
                  className="relative"
                >
                  <span className="text-[#1a1a1a] uppercase">
                    150 WEST ST, NEEDHAM, MA 02494
                    <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                  </span>
                </a>
              </div>
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="NAME" className="uppercase" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
