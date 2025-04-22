
import React from 'react';
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

  const onSubmit = (data: FormValues) => {
    // Simulate form submission
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
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-[#1a1a1a] mb-4">GET IN TOUCH</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Let's discuss your real estate goals. Whether you're looking to buy, sell, or just have questions about the Boston market, I'm here to help.
            </p>
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
                    <h2 className="text-2xl font-semibold text-white">Contact Information</h2>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="flex items-start">
                    <div className="bg-green-50 p-3 rounded-full mr-4 flex-shrink-0">
                      <Mail className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[#1a1a1a]">Email</h3>
                      <a href="mailto:kevin@kevinhoang.com" className="text-gray-600 hover:text-[#1a1a1a] transition-colors">kevin@kevinhoang.com</a>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-green-50 p-3 rounded-full mr-4 flex-shrink-0">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[#1a1a1a]">Phone</h3>
                      <a href="tel:6175551234" className="text-gray-600 hover:text-[#1a1a1a] transition-colors">(617) 555-1234</a>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-green-50 p-3 rounded-full mr-4 flex-shrink-0">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[#1a1a1a]">Office</h3>
                      <a 
                        href="https://maps.google.com/?q=123+Beacon+Street,+Boston,+MA+02116" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-600 hover:text-[#1a1a1a] transition-colors"
                      >
                        123 Beacon Street, Boston, MA 02116
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-green-50 p-3 rounded-full mr-4 flex-shrink-0">
                      <Clock className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[#1a1a1a]">Hours</h3>
                      <p className="text-gray-600">Monday - Friday: 9am - 6pm</p>
                      <p className="text-gray-600">Weekends: By appointment</p>
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
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6">
                  <h2 className="text-2xl font-semibold mb-6 text-[#1a1a1a]">Send a Message</h2>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="First Name" className="border-gray-300 focus:ring-green-500 focus:border-green-500" {...field} />
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
                                <Input placeholder="Last Name" className="border-gray-300 focus:ring-green-500 focus:border-green-500" {...field} />
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
                              <Input type="email" placeholder="Email" className="border-gray-300 focus:ring-green-500 focus:border-green-500" {...field} />
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
                              <Input type="tel" placeholder="Phone (optional)" className="border-gray-300 focus:ring-green-500 focus:border-green-500" {...field} />
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
                              <Textarea 
                                placeholder="Your message" 
                                rows={4} 
                                className="border-gray-300 focus:ring-green-500 focus:border-green-500"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <button 
                        type="submit" 
                        className="w-full bg-[#1a1a1a] text-white py-3 px-6 rounded-md hover:bg-black transition-colors font-medium flex items-center justify-center group"
                        disabled={form.formState.isSubmitting}
                      >
                        <span>Send Message</span>
                        <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
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
