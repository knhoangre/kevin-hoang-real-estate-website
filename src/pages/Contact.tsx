import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, ArrowRight } from 'lucide-react';
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

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
});

type FormValues = z.infer<typeof formSchema>;

const Contact = () => {
  const { toast } = useToast();
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

  const onSubmit = (data: FormValues) => {
    setTimeout(() => {
      toast({
        title: 'Message sent!',
        description: 'Thank you for contacting us. We\'ll respond shortly.',
      });
      form.reset();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="pt-16">
        <div className="container mx-auto px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h1
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4"
            >
              GET IN TOUCH
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="text-xl text-gray-600 mb-12 max-w-2xl"
            >
              Let's discuss your real estate goals. Whether you're looking to buy, sell, or just have questions about the Boston market, I'm here to help.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="relative h-40 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1073&q=80')" }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a]/70 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-6">
                    <h2 className="text-2xl font-semibold text-white uppercase">Contact Information</h2>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div
                    className="flex items-start relative"
                  >
                    <div className="bg-gray-100 p-3 rounded-full mr-4 flex-shrink-0">
                      <Phone className="w-5 h-5 text-[#1a1a1a]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[#1a1a1a] uppercase">PHONE</h3>
                      <div className="relative">
                        <button
                          id="phone-button"
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className="text-gray-600 hover:text-[#1a1a1a] no-underline group"
                          style={{ borderBottom: "none", textDecoration: "none", position: "relative" }}
                        >
                          <span className="relative select-all">
                            (860) 682-2251
                            <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                          </span>
                        </button>
                        <div
                          id="phone-dropdown"
                          className={`absolute left-1/2 top-8 z-20 w-28 -translate-x-1/2 bg-white shadow-lg rounded-md transition-all duration-300 ${dropdownOpen ? '' : 'hidden'}`}
                        >
                          <div className="flex flex-col items-center py-2">
                            <a href="tel:8606822251" className="block w-full text-center px-4 py-2 text-sm hover:bg-gray-100">Call</a>
                            <a href="sms:8606822251" className="block w-full text-center px-4 py-2 text-sm hover:bg-gray-100">Text</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start group">
                    <div className="bg-gray-100 p-3 rounded-full mr-4 flex-shrink-0">
                      <Mail className="w-5 h-5 text-[#1a1a1a]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[#1a1a1a] uppercase">EMAIL</h3>
                      <div className="relative">
                        <button
                          onClick={() => window.location.href = "mailto:knhoangre@gmail.com"}
                          className="text-gray-600 hover:text-[#1a1a1a] no-underline group"
                          style={{ borderBottom: "none", textDecoration: "none", position: "relative" }}
                        >
                          <span className="relative select-all">
                            KNHOANGRE@GMAIL.COM
                            <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start group">
                    <div className="bg-gray-100 p-3 rounded-full mr-4 flex-shrink-0">
                      <MapPin className="w-5 h-5 text-[#1a1a1a]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[#1a1a1a] uppercase">OFFICE</h3>
                      <div className="relative">
                        <button
                          onClick={() => window.open("https://maps.google.com/?q=150+WEST+ST,+NEEDHAM,+MA+02494", "_blank")}
                          className="text-gray-600 hover:text-[#1a1a1a] no-underline group"
                          style={{ borderBottom: "none", textDecoration: "none", position: "relative" }}
                        >
                          <span className="relative select-all">
                            150 WEST ST, NEEDHAM, MA 02494
                            <span className="absolute bottom-[-4px] left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="bg-white rounded-xl shadow-lg shadow-black/10 overflow-hidden relative border border-gray-100">
                <div className="p-6 bg-gray-50/50">
                  <h2 className="text-2xl font-semibold mb-6 text-[#1a1a1a] uppercase">Send a Message</h2>

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
                        disabled={form.formState.isSubmitting}
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
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
