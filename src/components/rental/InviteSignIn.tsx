/**
 * Sign in or create an account, inline on /apply/<token>.
 *
 * Deliberately NOT a redirect to /auth. That page navigates to
 * /complete-profile on signup, which is a broken route (it reads a `profiles`
 * table that does not exist), and it would lose the token — the applicant would
 * arrive signed in with nothing to apply for. Staying on this page means the
 * moment a session exists, RentalApply's effect claims the invite and the form
 * appears.
 *
 * It uses `useAuth` from the CONTEXT, not the standalone hook in
 * src/hooks/useAuth.ts that Auth.tsx happens to import — the context is what
 * owns the session, and this page needs its `user` to change when sign-in
 * succeeds.
 */
import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

/** The same five rules /auth enforces, so one account works on both pages. */
const RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'An uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'A lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'A number', test: (p: string) => /\d/.test(p) },
  { label: 'A special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const SUBMIT =
  'w-full rounded-md bg-ink py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-black/80 disabled:opacity-60';

/**
 * Module scope, NOT nested inside InviteSignIn.
 *
 * A component declared in the parent's body is a new component type on every
 * render, so React unmounts and remounts the whole subtree each keystroke — the
 * input loses focus after every character typed. Both tabs render this, hence
 * the `mode`-scoped ids.
 */
const Fields = ({
  mode,
  email,
  password,
  busy,
  passwordOk,
  onEmail,
  onPassword,
  onSubmit,
}: {
  mode: 'in' | 'up';
  email: string;
  password: string;
  busy: boolean;
  passwordOk: boolean;
  onEmail: (v: string) => void;
  onPassword: (v: string) => void;
  onSubmit: () => void;
}) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
    className="space-y-4"
  >
    <div className="space-y-1.5">
      <Label htmlFor={`${mode}-email`}>Email</Label>
      <Input
        id={`${mode}-email`}
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => onEmail(e.target.value)}
      />
    </div>

    <div className="space-y-1.5">
      <Label htmlFor={`${mode}-password`}>Password</Label>
      <Input
        id={`${mode}-password`}
        type="password"
        autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
        required
        value={password}
        onChange={(e) => onPassword(e.target.value)}
      />
    </div>

    {mode === 'up' && password.length > 0 && (
      <ul className="space-y-1 text-xs">
        {RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li key={rule.label} className={ok ? 'text-emerald-700' : 'text-gray-500'}>
              <span aria-hidden>{ok ? '✓' : '·'}</span> {rule.label}
            </li>
          );
        })}
      </ul>
    )}

    <button
      type="submit"
      disabled={busy || !email || !password || (mode === 'up' && !passwordOk)}
      className={SUBMIT}
    >
      {busy ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Working
        </span>
      ) : mode === 'in' ? (
        'Sign in and continue'
      ) : (
        'Create account and start'
      )}
    </button>
  </form>
);

export default function InviteSignIn() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  // Synchronous guard — setState is async, so two fast submits can both read
  // busy === false and each fire a signup.
  const inFlight = useRef(false);

  const passwordOk = RULES.every((r) => r.test(password));

  const run = async (mode: 'in' | 'up') => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const { error } =
        mode === 'in'
          ? await signIn(email.trim(), password)
          : // The full /apply/<token> URL, so confirming the email brings them
            // back to the application they were invited to rather than to the
            // homepage with the token gone.
            await signUp(email.trim(), password, window.location.href);

      if (error) {
        toast({
          variant: 'destructive',
          title: mode === 'in' ? 'Could not sign in' : 'Could not create your account',
          description: error.message,
        });
        return;
      }

      if (mode === 'up') {
        // If the project requires email confirmation there is no session yet and
        // the page stays as it is, so say what happens next. The link returns
        // them to THIS url — see the emailRedirectTo passed above — so the copy
        // can promise that rather than hedging about coming back here.
        toast({
          title: 'Check your email',
          description:
            'Click the confirmation link and it will bring you straight back to this application.',
        });
      }
      // No navigate: AuthContext publishes the new session, RentalApply's
      // effect re-runs, claims the invite, and the form replaces this panel.
    } catch (err) {
      console.error('Auth failed on /apply:', err);
      toast({ variant: 'destructive', title: 'Something went wrong', description: 'Please try again.' });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const fields = (mode: 'in' | 'up') => (
    <Fields
      mode={mode}
      email={email}
      password={password}
      busy={busy}
      passwordOk={passwordOk}
      onEmail={setEmail}
      onPassword={setPassword}
      onSubmit={() => void run(mode)}
    />
  );

  return (
    <div className="mx-auto max-w-md rounded-xl border border-gray-100 bg-white p-8 shadow-lg shadow-black/10">
      <h2 className="text-xl font-semibold uppercase tracking-wide text-ink">
        Start your application
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        You need an account so your progress saves and you can come back to finish.
      </p>

      <Tabs defaultValue="up" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="up">Create account</TabsTrigger>
          <TabsTrigger value="in">Sign in</TabsTrigger>
        </TabsList>
        <TabsContent value="up" className="mt-5">
          {fields('up')}
        </TabsContent>
        <TabsContent value="in" className="mt-5">
          {fields('in')}
        </TabsContent>
      </Tabs>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-gray-200" aria-hidden />
        <span className="text-xs uppercase tracking-widest text-gray-400">or</span>
        <span className="h-px flex-1 bg-gray-200" aria-hidden />
      </div>

      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        className="flex w-full items-center justify-center gap-2.5 rounded-md border border-gray-300 py-3 text-sm font-semibold text-ink transition-colors hover:border-champagne hover:text-champagne-ink"
      >
        <FcGoogle className="h-5 w-5" aria-hidden />
        Continue with Google
      </button>

      <p className="mt-5 text-xs leading-relaxed text-gray-500">
        Your application is visible only to you and to Kevin Hoang. See the{' '}
        <a href="/privacy-policy" className="text-champagne-ink underline underline-offset-2">
          privacy policy
        </a>
        .
      </p>
    </div>
  );
}
