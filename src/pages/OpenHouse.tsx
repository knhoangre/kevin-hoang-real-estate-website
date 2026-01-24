import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, CheckCircle, Lock } from 'lucide-react';

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
  const { isAdmin, loading: authLoading } = useAuth();
  const [address, setAddress] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousAddresses, setPreviousAddresses] = useState<string[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true); // Start as true to prevent flash
  const [addressInputMode, setAddressInputMode] = useState<'select' | 'manual'>('manual');

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

  // Fetch previous addresses on component mount (only if admin)
  useEffect(() => {
    if (isAdmin && !authLoading) {
      fetchPreviousAddresses();
    }
  }, [isAdmin, authLoading]);

  // Auto-redirect after 5 seconds on success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        handleReset();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchPreviousAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const { data, error: fetchError } = await supabase
        .from('open_house_sign_ins')
        .select('address')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching previous addresses:', fetchError);
        // Don't show error to user, just continue without previous addresses
        return;
      }

      if (data) {
        // Get unique addresses, normalized (trimmed and sorted)
        const uniqueAddresses = Array.from(
          new Set(data.map(item => item.address?.trim()).filter(Boolean))
        ).sort() as string[];
        setPreviousAddresses(uniqueAddresses);
        // Switch to select mode if we have addresses, otherwise stay in manual mode
        if (uniqueAddresses.length > 0) {
          setAddressInputMode('select');
        }
      }
    } catch (err) {
      console.error('Error fetching previous addresses:', err);
      // Don't show error to user, just continue without previous addresses
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleAddressSubmit = (data: AddressFormValues) => {
    // Normalize address (trim whitespace)
    const normalizedAddress = data.address.trim();
    if (!normalizedAddress) {
      return;
    }
    setAddress(normalizedAddress);
    setShowForm(true);
  };

  const handleAddressSelect = (selectedAddress: string) => {
    if (selectedAddress === '__new__') {
      setAddressInputMode('manual');
      addressForm.setValue('address', '');
      addressForm.setFocus('address');
    } else {
      addressForm.setValue('address', selectedAddress);
      setAddressInputMode('select');
    }
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
    setShowForm(false); // Go back to address selection
    setAddress('');
    // Set mode based on whether we have previous addresses
    setAddressInputMode(previousAddresses.length > 0 ? 'select' : 'manual');
    addressForm.reset({
      address: '',
    });
    signInForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      worksWithRealtor: 'no',
      realtorName: '',
      realtorCompany: '',
    });
    // Refresh previous addresses in case a new one was added
    fetchPreviousAddresses();
  };

  // Loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Admin check - show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">
            Access Restricted
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            This page is only accessible to administrators.
          </p>
          <p className="text-sm text-gray-500">
            Please contact an administrator if you need access to this feature.
          </p>
        </div>
      </div>
    );
  }

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
                    {loadingAddresses ? (
                      <FormControl>
                        <Input
                          id="address"
                          placeholder="Loading previous addresses..."
                          style={{ textTransform: 'none' }}
                          autoCapitalize="off"
                          disabled
                          {...field}
                        />
                      </FormControl>
                    ) : addressInputMode === 'select' && previousAddresses.length > 0 ? (
                      <FormControl>
                        <Select
                          value={field.value || ''}
                          onValueChange={(value) => {
                            handleAddressSelect(value);
                            if (value !== '__new__') {
                              field.onChange(value);
                            }
                          }}
                        >
                          <SelectTrigger id="address">
                            <SelectValue placeholder="Select a previous address or add new" />
                          </SelectTrigger>
                          <SelectContent>
                            {previousAddresses.map((addr) => (
                              <SelectItem key={addr} value={addr}>
                                {addr}
                              </SelectItem>
                            ))}
                            <SelectItem value="__new__">
                              <span className="text-gray-500 italic">+ Add new address</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    ) : (
                      <FormControl>
                        <Input
                          id="address"
                          placeholder="Enter property address"
                          style={{ textTransform: 'none' }}
                          autoCapitalize="off"
                          {...field}
                        />
                      </FormControl>
                    )}
                    {!loadingAddresses && addressInputMode === 'select' && previousAddresses.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Or{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setAddressInputMode('manual');
                            addressForm.setValue('address', '');
                            addressForm.setFocus('address');
                          }}
                          className="text-blue-600 hover:underline"
                        >
                          type a new address
                        </button>
                      </p>
                    )}
                    {!loadingAddresses && addressInputMode === 'manual' && previousAddresses.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Or{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setAddressInputMode('select');
                            addressForm.setValue('address', '');
                          }}
                          className="text-blue-600 hover:underline"
                        >
                          select from previous addresses
                        </button>
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-[#1a1a1a] text-white hover:bg-black/80 uppercase"
                disabled={loadingAddresses}
              >
                {loadingAddresses ? 'Loading...' : 'Continue'}
                {!loadingAddresses && <ArrowRight className="ml-2 h-4 w-4" />}
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

