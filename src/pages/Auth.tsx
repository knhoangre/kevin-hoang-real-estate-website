import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { useToast } from "@/components/ui/use-toast";
import { Check, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Password validation states
  const [hasMinLength, setHasMinLength] = useState(false);
  const [hasUpperCase, setHasUpperCase] = useState(false);
  const [hasLowerCase, setHasLowerCase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecialChar, setHasSpecialChar] = useState(false);

  // Check if password meets all requirements
  useEffect(() => {
    setIsPasswordValid(hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar);
  }, [hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar]);

  // Update password validation on password change
  useEffect(() => {
    setHasMinLength(password.length >= 8);
    setHasUpperCase(/[A-Z]/.test(password));
    setHasLowerCase(/[a-z]/.test(password));
    setHasNumber(/[0-9]/.test(password));
    setHasSpecialChar(/[!@#$%^&*(),.?":{}|<>]/.test(password));
  }, [password]);

  const checkUserProfile = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();
    return profile;
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error, data } = await signIn(email, password);
      if (error) throw error;

      if (data.user) {
        const profile = await checkUserProfile(data.user.id);
        if (!profile) {
          navigate("/complete-profile");
        } else {
          navigate("/");
        }
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Please check your credentials and try again.";
      toast({
        title: "Error signing in",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password before submitting
    if (!isPasswordValid) {
      toast({
        title: "Invalid password",
        description: "Please ensure your password meets all requirements.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // First check if the email is already associated with a Google account
      const { data: existingUser, error: checkError } = await signIn(email, password);

      if (checkError) {
        // If the error is about invalid credentials, it means the user exists but with a different provider
        if (checkError.message.includes("Invalid login credentials")) {
          toast({
            title: "Email already registered",
            description: "This email is already associated with a Google account. Please sign in with Google instead.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // If it's a different error, we can proceed with sign up
        const { error } = await signUp(email, password);
        if (error) throw error;

        // Redirect to profile completion after successful sign up
        navigate("/complete-profile");

        toast({
          title: "Account created!",
          description: "Please complete your profile information.",
        });
      } else {
        // If we got a successful sign in, it means the user already exists
        toast({
          title: "Account already exists",
          description: "You already have an account. Please sign in instead.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Please try again with a different email.";
      toast({
        title: "Error creating account",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await signInWithGoogle();
      if (error) throw error;

      if (data.user) {
        const profile = await checkUserProfile(data.user.id);
        if (!profile) {
          navigate("/complete-profile");
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Please try again.";
      toast({
        title: "Error signing in with Google",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Password requirement component
  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className="flex items-center text-xs">
      {met ? (
        <Check className="h-3 w-3 text-green-500 mr-1" />
      ) : (
        <X className="h-3 w-3 text-red-500 mr-1" />
      )}
      <span className={met ? "text-green-500" : "text-gray-500"}>
        {text}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <motion.div
        className="container max-w-md mx-auto px-4 py-32"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h1 className="text-3xl font-bold text-center text-[#1a1a1a] mb-8">ACCOUNT ACCESS</h1>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-6">
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#1a1a1a] hover:bg-black"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
              >
                <FcGoogle className="mr-2 h-5 w-5" />
                Google
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-6">
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div>
                  <label htmlFor="signup-email" className="block text-sm font-medium mb-1">
                    Email Address
                  </label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="signup-password" className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <div className="mt-2 space-y-1">
                    <PasswordRequirement
                      met={hasMinLength}
                      text="At least 8 characters"
                    />
                    <PasswordRequirement
                      met={hasUpperCase}
                      text="At least one uppercase letter"
                    />
                    <PasswordRequirement
                      met={hasLowerCase}
                      text="At least one lowercase letter"
                    />
                    <PasswordRequirement
                      met={hasNumber}
                      text="At least one number"
                    />
                    <PasswordRequirement
                      met={hasSpecialChar}
                      text="At least one special character"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#1a1a1a] hover:bg-black"
                  disabled={isLoading || !isPasswordValid}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
              >
                <FcGoogle className="mr-2 h-5 w-5" />
                Google
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
