import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

const ProfileCompletion = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phoneNumber: "",
  });
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [verificationType, setVerificationType] = useState<"email" | "phone" | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Check if user already has a profile
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data && !error) {
          // User already has a profile, redirect to home
          navigate("/");
          toast({
            title: "Profile already completed",
            description: "Your profile information is already set up.",
          });
        }
      } catch (error) {
        console.error("Error checking profile:", error);
      }
    };

    checkProfile();
  }, [user, navigate, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!user) throw new Error("User not authenticated");

      // Validate form data
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phoneNumber) {
        throw new Error("All fields are required");
      }

      // Create profile in the database
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone_number: formData.phoneNumber,
          email_verified: emailVerified,
          phone_verified: phoneVerified,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile information has been saved successfully.",
      });

      // Redirect to home page
      navigate("/");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast({
        title: "Error updating profile",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendVerificationCode = async (type: "email" | "phone") => {
    try {
      setVerificationType(type);
      setShowVerification(true);

      if (type === "email") {
        // Send email verification
        const { error } = await supabase.auth.signInWithOtp({
          email: formData.email,
          options: {
            shouldCreateUser: false,
          },
        });

        if (error) throw error;

        toast({
          title: "Verification code sent",
          description: "Please check your email for the verification code.",
        });
      } else if (type === "phone") {
        // For phone verification, you would typically use a service like Twilio
        // This is a placeholder for demonstration
        toast({
          title: "Phone verification not implemented",
          description: "Phone verification would be implemented with a service like Twilio.",
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast({
        title: "Error sending verification code",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const verifyCode = async () => {
    try {
      if (!verificationType) return;

      if (verificationType === "email") {
        // Verify email code
        const { error } = await supabase.auth.verifyOtp({
          email: formData.email,
          token: verificationCode,
          type: "email",
        });

        if (error) throw error;

        setEmailVerified(true);
        toast({
          title: "Email verified",
          description: "Your email has been verified successfully.",
        });
      } else if (verificationType === "phone") {
        // For phone verification, you would verify with your service
        // This is a placeholder for demonstration
        setPhoneVerified(true);
        toast({
          title: "Phone verified",
          description: "Your phone number has been verified successfully.",
        });
      }

      setShowVerification(false);
      setVerificationCode("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast({
        title: "Error verifying code",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (loading || !user) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              Please provide your information to complete your account setup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={emailVerified}
                  />
                  {!emailVerified && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => sendVerificationCode("email")}
                    >
                      Verify
                    </Button>
                  )}
                  {emailVerified && (
                    <Button type="button" variant="outline" disabled className="bg-green-50 text-green-600">
                      Verified
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="(123) 456-7890"
                    required
                    disabled={phoneVerified}
                  />
                  {!phoneVerified && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => sendVerificationCode("phone")}
                    >
                      Verify
                    </Button>
                  )}
                  {phoneVerified && (
                    <Button type="button" variant="outline" disabled className="bg-green-50 text-green-600">
                      Verified
                    </Button>
                  )}
                </div>
              </div>

              {showVerification && (
                <div className="space-y-2 p-4 border rounded-md bg-gray-50">
                  <Label htmlFor="verificationCode">
                    Enter verification code for {verificationType === "email" ? "email" : "phone"}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="verificationCode"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter code"
                    />
                    <Button type="button" onClick={verifyCode}>
                      Submit
                    </Button>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full mt-4"
                disabled={isSubmitting || !emailVerified || !phoneVerified}
              >
                {isSubmitting ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              disabled={isSubmitting}
            >
              Skip for now
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default ProfileCompletion;