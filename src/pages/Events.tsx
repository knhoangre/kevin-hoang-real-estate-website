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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, CheckCircle, Lock } from 'lucide-react';

const eventSchema = z.object({
  eventName: z.string().min(1, 'Event name is required'),
});

const signInSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;
type SignInFormValues = z.infer<typeof signInSchema>;

const Events = () => {
  const { toast } = useToast();
  const { isAdmin, loading: authLoading } = useAuth();
  const [eventName, setEventName] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousEvents, setPreviousEvents] = useState<string[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventInputMode, setEventInputMode] = useState<'select' | 'manual'>('manual');

  const eventForm = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: { eventName: '' },
  });

  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (isAdmin && !authLoading) {
      fetchPreviousEvents();
    }
  }, [isAdmin, authLoading]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        handleReset();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchPreviousEvents = async () => {
    try {
      setLoadingEvents(true);
      const { data, error: fetchError } = await supabase
        .from('event_sign_ins')
        .select('event_name')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching previous events:', fetchError);
        return;
      }

      if (data) {
        const unique = Array.from(
          new Set(data.map((item) => item.event_name?.trim()).filter(Boolean))
        ).sort() as string[];
        setPreviousEvents(unique);
        if (unique.length > 0) setEventInputMode('select');
      }
    } catch (err) {
      console.error('Error fetching previous events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleEventSubmit = (data: EventFormValues) => {
    const name = data.eventName.trim();
    if (!name) return;
    setEventName(name);
    setShowForm(true);
  };

  const handleEventSelect = (value: string) => {
    if (value === '__new__') {
      setEventInputMode('manual');
      eventForm.setValue('eventName', '');
      eventForm.setFocus('eventName');
    } else {
      eventForm.setValue('eventName', value);
      setEventInputMode('select');
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handleSignInSubmit = async (data: SignInFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Use the same edge function as open house (already deployed); it handles type: 'event'
      const { error: submitError } = await supabase.functions.invoke('submit-open-house-signin', {
        body: {
          type: 'event',
          eventName: eventName.trim(),
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone ? data.phone.trim() : null,
        },
      });

      if (submitError) throw submitError;

      setSuccess(true);
      signInForm.reset();
      toast({
        title: 'Success!',
        description: 'Sign-in has been recorded successfully.',
      });
    } catch (err: unknown) {
      console.error('Error submitting sign-in:', err);
      const msg = err && typeof err === 'object' && 'message' in err
        ? String((err as { message?: string }).message)
        : 'Unknown error';
      const isConfig = msg.includes('Supabase not configured') || msg.includes('environment variables');
      if (isConfig) {
        setError('Supabase is not configured. Please set up VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
        toast({
          title: 'Configuration Error',
          description: 'Supabase is not configured. Please contact the administrator.',
          variant: 'destructive',
        });
      } else {
        setError('Failed to submit sign-in. Please try again.');
        toast({
          title: 'Error',
          description: 'There was an error submitting. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setError(null);
    setShowForm(true);
    signInForm.reset({ firstName: '', lastName: '', email: '', phone: '' });
    fetchPreviousEvents();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">Access Restricted</h2>
          <p className="text-lg text-gray-600 mb-6">
            This page is only accessible to administrators.
          </p>
          <p className="text-sm text-gray-500">
            Please contact an administrator if you need access.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">Thank you for signing in.</h2>
          <p className="text-lg text-gray-600 mb-6">Enjoy the event!</p>
          <Button
            onClick={handleReset}
            className="w-full bg-[#1a1a1a] text-white hover:bg-black/80"
          >
            Return to Sign-In
          </Button>
          <p className="text-sm text-gray-500 mt-4">Redirecting in a few seconds...</p>
        </div>
      </div>
    );
  }

  // Event selection / name input
  if (!showForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-6 text-center">
            Events
          </h1>
          <Form {...eventForm}>
            <form onSubmit={eventForm.handleSubmit(handleEventSubmit)} className="space-y-6">
              <FormField
                control={eventForm.control}
                name="eventName"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="eventName">Event</Label>
                    {loadingEvents ? (
                      <FormControl>
                        <Input
                          id="eventName"
                          placeholder="Loading previous events..."
                          style={{ textTransform: 'none' }}
                          autoCapitalize="off"
                          disabled
                          {...field}
                        />
                      </FormControl>
                    ) : eventInputMode === 'select' && previousEvents.length > 0 ? (
                      <FormControl>
                        <Select
                          value={field.value || ''}
                          onValueChange={(value) => {
                            handleEventSelect(value);
                            if (value !== '__new__') field.onChange(value);
                          }}
                        >
                          <SelectTrigger id="eventName">
                            <SelectValue placeholder="Select a previous event or add new" />
                          </SelectTrigger>
                          <SelectContent>
                            {previousEvents.map((ev) => (
                              <SelectItem key={ev} value={ev}>
                                {ev}
                              </SelectItem>
                            ))}
                            <SelectItem value="__new__">
                              <span className="text-gray-500 italic">+ Add new event</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    ) : (
                      <FormControl>
                        <Input
                          id="eventName"
                          placeholder="Enter event name"
                          style={{ textTransform: 'none' }}
                          autoCapitalize="off"
                          {...field}
                        />
                      </FormControl>
                    )}
                    {!loadingEvents && eventInputMode === 'select' && previousEvents.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Or{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setEventInputMode('manual');
                            eventForm.setValue('eventName', '');
                            eventForm.setFocus('eventName');
                          }}
                          className="text-blue-600 hover:underline"
                        >
                          type a new event
                        </button>
                      </p>
                    )}
                    {!loadingEvents && eventInputMode === 'manual' && previousEvents.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Or{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setEventInputMode('select');
                            eventForm.setValue('eventName', '');
                          }}
                          className="text-blue-600 hover:underline"
                        >
                          select from previous events
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
                disabled={loadingEvents}
              >
                {loadingEvents ? 'Loading...' : 'Continue'}
                {!loadingEvents && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    );
  }

  // Sign-in form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6 text-center">
          Events – {eventName}
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
                  <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
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
                  <Label htmlFor="phone">Phone Number <span className="text-gray-400">(optional)</span></Label>
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

            <Button
              type="submit"
              className="w-full bg-[#1a1a1a] text-white hover:bg-black/80 uppercase mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default Events;
