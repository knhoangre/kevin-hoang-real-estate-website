import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowRight, CheckCircle } from 'lucide-react';

const addressSchema = z.object({
  address: z.string().min(1, 'Address is required'),
});

const signInSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  worksWithRealtor: z.enum(['yes', 'no'], {
    required_error: 'Please select an option',
  }),
  realtorName: z.string().optional(),
  realtorCompany: z.string().optional(),
}).refine((data) => {
  if (data.worksWithRealtor === 'yes') {
    return data.realtorName && data.realtorName.trim().length > 0;
  }
  return true;
}, {
  message: 'Realtor name is required when working with a realtor',
  path: ['realtorName'],
});

type AddressFormValues = z.infer<typeof addressSchema>;
type SignInFormValues = z.infer<typeof signInSchema>;

const OpenHouse = () => {
  const { toast } = useToast();
  const [address, setAddress] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addressForm = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      address: '',
    },
  });

  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      worksWithRealtor: 'no',
      realtorName: '',
      realtorCompany: '',
    },
  });

  const worksWithRealtor = signInForm.watch('worksWithRealtor');

  // Auto-redirect after 5 seconds on success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        handleReset();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleAddressSubmit = (data: AddressFormValues) => {
    setAddress(data.address);
    setShowForm(true);
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handleSignInSubmit = async (data: SignInFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: submitError } = await supabase.functions.invoke('submit-open-house-signin', {
        body: {
          address: address.trim(),
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone ? data.phone.trim() : null,
          worksWithRealtor: data.worksWithRealtor === 'yes',
          realtorName: data.worksWithRealtor === 'yes' && data.realtorName ? data.realtorName.trim() : null,
          realtorCompany: data.worksWithRealtor === 'yes' && data.realtorCompany ? data.realtorCompany.trim() : null,
        }
      });

      if (submitError) {
        throw submitError;
      }

      setSuccess(true);
      signInForm.reset();
      toast({
        title: "Success!",
        description: "Your sign-in has been recorded successfully.",
      });
    } catch (err: any) {
      console.error('Error submitting sign-in:', err);
      
      // Check if it's a Supabase configuration error
      const errorMessage = err?.message || err?.error?.message || 'Unknown error';
      const isConfigError = errorMessage.includes('Supabase not configured') || 
                           errorMessage.includes('environment variables');
      
      if (isConfigError) {
        setError('Supabase is not configured. Please set up VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
        toast({
          title: "Configuration Error",
          description: "Supabase is not configured. Please contact the administrator.",
          variant: "destructive",
        });
      } else {
        setError('Failed to submit sign-in. Please try again.');
        toast({
          title: "Error",
          description: "There was an error submitting your sign-in. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setError(null);
    setShowForm(true); // Keep showing the form, just reset the fields
    signInForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      worksWithRealtor: 'no',
      realtorName: '',
      realtorCompany: '',
    });
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">
            Thank you for signing in.
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Please enjoy the tour!
          </p>
          <Button
            onClick={handleReset}
            className="w-full bg-[#1a1a1a] text-white hover:bg-black/80"
          >
            Return to Sign-In
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            You will be automatically redirected in a few seconds...
          </p>
        </div>
      </div>
    );
  }

  // Address input screen
  if (!showForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-6 text-center">
            Open House Sign-In
          </h1>
          <Form {...addressForm}>
            <form onSubmit={addressForm.handleSubmit(handleAddressSubmit)} className="space-y-6">
              <FormField
                control={addressForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="address">Property Address</Label>
                    <FormControl>
                      <Input
                        id="address"
                        placeholder="Enter property address"
                        style={{ textTransform: 'none' }}
                        autoCapitalize="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-[#1a1a1a] text-white hover:bg-black/80 uppercase"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Form>
        </div>
      </div>
    );
  }

  // Sign-in form screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6 text-center">
          Open House - {address}
        </h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <Form {...signInForm}>
          <form onSubmit={signInForm.handleSubmit(handleSignInSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={signInForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="firstName">First Name</Label>
                    <FormControl>
                      <Input
                        id="firstName"
                        placeholder="First Name"
                        style={{ textTransform: 'none' }}
                        autoCapitalize="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={signInForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="lastName">Last Name</Label>
                    <FormControl>
                      <Input
                        id="lastName"
                        placeholder="Last Name"
                        style={{ textTransform: 'none' }}
                        autoCapitalize="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={signInForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="email">Email Address</Label>
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Email Address"
                      style={{ textTransform: 'none' }}
                      autoCapitalize="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={signInForm.control}
              name="phone"
              render={({ field: { onChange, ...rest } }) => (
                <FormItem>
                    <Label htmlFor="phone">Phone Number</Label>
                  <FormControl>
                    <Input
                      id="phone"
                      placeholder="XXX-XXX-XXXX"
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
              control={signInForm.control}
              name="worksWithRealtor"
              render={({ field }) => (
                <FormItem>
                  <Label>Do you work with a realtor?</Label>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="yes" />
                        <Label htmlFor="yes" className="cursor-pointer">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="no" />
                        <Label htmlFor="no" className="cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {worksWithRealtor === 'yes' && (
              <>
                <FormField
                  control={signInForm.control}
                  name="realtorName"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="realtorName">Realtor Name</Label>
                      <FormControl>
                        <Input
                          id="realtorName"
                          placeholder="Realtor Name"
                          style={{ textTransform: 'none' }}
                          autoCapitalize="off"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signInForm.control}
                  name="realtorCompany"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="realtorCompany">Realtor Company</Label>
                      <FormControl>
                        <Input
                          id="realtorCompany"
                          placeholder="Realtor Company"
                          style={{ textTransform: 'none' }}
                          autoCapitalize="off"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <Button
              type="submit"
              className="w-full bg-[#1a1a1a] text-white hover:bg-black/80 uppercase mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Continue'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default OpenHouse;

