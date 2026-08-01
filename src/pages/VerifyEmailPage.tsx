import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { sendOTP } from "@/lib/resend";

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp } = useAuth();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const email = location.state?.email || "";

  useEffect(() => {
    if (!email) {
      navigate("/auth");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    // Verify against the OTP passed in state
    if (otp !== location.state?.otp) {
      toast.error("Invalid verification code. Please check and try again.");
      return;
    }

    setLoading(true);
    try {
      // Create user in Supabase
      const { email, password, fullName, username } = location.state.signupData;
      const { data, error } = await signUp(email, password, fullName, username);

      
      if (error) {
        if (error.message.includes("User already registered")) {
          toast.error("An account with this email already exists.");
        } else {
          toast.error(error.message);
        }
      } else if (data.user) {
        // Check if admin
        const user = data.user;
        let isAdmin = user.email === "admin@gmail.com";
        
        if (!isAdmin) {
          const { data: hasAdminRole } = await supabase.rpc("has_role", {
            _user_id: user.id,
            _role: "admin",
          });
          isAdmin = !!hasAdminRole;
        }

        toast.success("Email verified successfully! Welcome!");
        
        if (isAdmin) {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        toast.success("Email verified successfully! Welcome!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setResending(true);
    try {
      // Generate new OTP
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

      // Send OTP via SendGrid
      const emailResult = await sendOTP(email, newOtp);
      if (!emailResult.success) throw new Error(emailResult.error || "Failed to send code");

      // Update state with new OTP
      // We need to update location state or local component state to checking against new OTP? 
      // Problem: handleVerify checks location.state.otp.
      // Solution: We should rely on a local state reference for validity if we resend.
      // But for simplicity, we can just update the location state using navigate with replace?
      // Or just check against a mutable ref?
      // Let's navigate replace to update state.
      navigate(".", {
        replace: true,
        state: {
          ...location.state,
          otp: newOtp
        }
      });

      toast.success("New verification code sent to your email!");
      setCountdown(60);
      setOtp("");

    } catch (error: any) {
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      <section className="py-16 bg-gradient-to-br from-background via-primary/5 to-secondary/5 min-h-[80vh] flex items-center">
        <div className="container mx-auto px-4">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>

          <div className="max-w-md mx-auto">
            <Card className="glass border-2">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">Verify Your Email</CardTitle>
                <CardDescription className="space-y-2 flex flex-col">
                  <span>We've sent a 6-digit verification code to:</span>
                  <span className="font-medium text-foreground">{email}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <InputOTP
                    value={otp}
                    onChange={setOtp}
                    maxLength={6}
                    disabled={loading}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>

                  <p className="text-sm text-muted-foreground text-center">
                    Enter the 6-digit code from your email
                  </p>
                </div>

                <Button
                  onClick={handleVerify}
                  className="w-full gradient-primary"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify Email
                    </>
                  )}
                </Button>

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the code?
                  </p>
                  <Button
                    variant="ghost"
                    onClick={handleResendOTP}
                    disabled={resending || countdown > 0}
                    className="text-primary hover:text-primary/80"
                  >
                    {resending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : countdown > 0 ? (
                      `Resend in ${countdown}s`
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Resend Code
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Tips:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Check your spam/junk folder</li>
                    <li>Make sure you entered the correct email</li>
                    <li>The code expires in 10 minutes</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VerifyEmailPage;
