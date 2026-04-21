import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff, ArrowLeft, Shield } from "lucide-react";
import PasswordStrengthIndicator, { isPasswordStrong } from "@/components/PasswordStrengthIndicator";
import { sendOTP } from "@/lib/resend";

// Email schema with lowercase normalization
const emailSchema = z.string()
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address");

// Gmail-only validation with lowercase normalization
const gmailSchema = z.string()
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address")
  .refine((email) => email.endsWith("@gmail.com"), {
    message: "Only Gmail addresses (@gmail.com) are allowed",
  });

const nameSchema = z.string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .refine((name) => name.trim().split(/\s+/).length >= 2, {
    message: "Please enter your full name (First and Last name)",
  });

// Strong password schema
const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character");

const usernameSchema = z.string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores");


const AuthPage = () => {
  const navigate = useNavigate();
  const { user, signUp, signIn } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ fullName: "", username: "", email: "", password: "", confirmPassword: "" });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const checkRedirect = async () => {
      if (user) {
        // Check if admin
        if (user.email === "admin@gmail.com") {
          navigate("/admin");
          return;
        }

        const { data: hasAdminRole } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });

        if (hasAdminRole) {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    };
    checkRedirect();
  }, [user, navigate]);

  const validateLogin = () => {
    const newErrors: Record<string, string> = {};

    try {
      emailSchema.parse(loginData.email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.loginEmail = e.errors[0].message;
      }
    }

    if (loginData.password.length < 6) {
      newErrors.loginPassword = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignup = () => {
    const newErrors: Record<string, string> = {};

    try {
      nameSchema.parse(signupData.fullName);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.fullName = e.errors[0].message;
      }
    }

    try {
      usernameSchema.parse(signupData.username);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.username = e.errors[0].message;
      }
    }


    // Gmail validation for signup
    try {
      gmailSchema.parse(signupData.email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.signupEmail = e.errors[0].message;
      }
    }

    // Strong password validation for signup
    try {
      strongPasswordSchema.parse(signupData.password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.signupPassword = e.errors[0].message;
      }
    }

    // Also check with our custom function
    if (!isPasswordStrong(signupData.password)) {
      newErrors.signupPassword = newErrors.signupPassword || "Password does not meet all requirements";
    }

    if (signupData.password !== signupData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setLoading(true);
    // Email is normalized to lowercase in AuthContext
    const { data, error } = await signIn(loginData.email.trim().toLowerCase(), loginData.password);
    
    if (error) {
      setLoading(false);
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Invalid email or password");
      } else if (error.message.includes("Email not confirmed")) {
        toast.error("Please verify your email before signing in");
        navigate("/verify-email", { state: { email: loginData.email.trim().toLowerCase() } });
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

      setLoading(false);
      toast.success("Welcome back!");
      
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!loginData.email) {
      toast.error("Please enter your email address first");
      setErrors({ loginEmail: "Email is required for password reset" });
      return;
    }

    try {
      emailSchema.parse(loginData.email);
    } catch (e) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(loginData.email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset link sent! Please check your email.");
    }
  };


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup()) return;

    setLoading(true);
    const normalizedEmail = signupData.email.trim().toLowerCase();

    // Check if username is already taken
    const { data: existingUser, error: checkError } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", signupData.username)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking username:", checkError);
    }

    if (existingUser) {
      setLoading(false);
      setErrors({ ...errors, username: "Username already taken" });
      toast.error("Username already taken. Please choose another one.");
      return;
    }


    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Send OTP via SendGrid
      const emailResult = await sendOTP(normalizedEmail, otp);
      
      if (!emailResult.success) {
        throw new Error(emailResult.error || "Failed to send verification code");
      }

      setLoading(false);
      toast.success("Verification code sent! Please check your email.");

      // Navigate to verify page with OTP and signup data
      navigate("/verify-email", {
        state: {
          email: normalizedEmail,
          otp,
          signupData: {
            ...signupData,
            email: normalizedEmail,
            username: signupData.username
          }

        }
      });

    } catch (error: any) {
      setLoading(false);
      toast.error(error.message || "Failed to send verification code");
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      <section className="py-16 bg-gradient-to-br from-background via-primary/5 to-secondary/5 min-h-[80vh] flex items-center">
        <div className="container mx-auto px-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="max-w-md mx-auto">
            <Card className="glass border-2">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full gradient-primary flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">Welcome</CardTitle>
                <CardDescription>
                  Sign in to your account or create a new one
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="example@gmail.com"
                          autoComplete="email"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          className={errors.loginEmail ? "border-destructive" : ""}
                        />
                        {errors.loginEmail && (
                          <p className="text-sm text-destructive">{errors.loginEmail}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            className={errors.loginPassword ? "border-destructive" : ""}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.loginPassword && (
                          <p className="text-sm text-destructive">{errors.loginPassword}</p>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-xs text-primary hover:underline font-medium"
                          disabled={loading}
                        >
                          Forgot Password?
                        </button>
                      </div>

                      <Button type="submit" className="w-full gradient-primary" disabled={loading}>

                        {loading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Enter your full name"
                          value={signupData.fullName}
                          onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                          className={errors.fullName ? "border-destructive" : ""}
                        />
                        <p className="text-xs text-muted-foreground">Enter both first and last name</p>
                        {errors.fullName && (
                          <p className="text-sm text-destructive">{errors.fullName}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
                        <Input
                          id="username"
                          type="text"
                          placeholder="johndoe123"
                          value={signupData.username}
                          onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                          className={errors.username ? "border-destructive" : ""}
                        />
                        {errors.username && (
                          <p className="text-sm text-destructive">{errors.username}</p>
                        )}
                      </div>


                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email <span className="text-destructive">*</span></Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="yourname@gmail.com"
                          value={signupData.email}
                          onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                          className={errors.signupEmail ? "border-destructive" : ""}
                        />
                        <p className="text-xs text-muted-foreground">Only Gmail addresses are accepted</p>
                        {errors.signupEmail && (
                          <p className="text-sm text-destructive">{errors.signupEmail}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={signupData.password}
                            onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                            className={errors.signupPassword ? "border-destructive" : ""}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.signupPassword && (
                          <p className="text-sm text-destructive">{errors.signupPassword}</p>
                        )}

                        {/* Password Strength Indicator */}
                        <PasswordStrengthIndicator password={signupData.password} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={signupData.confirmPassword}
                            onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                            className={errors.confirmPassword ? "border-destructive" : ""}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                        )}
                      </div>

                      <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                        {loading ? "Creating account..." : "Create Account"}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center mt-4">
                        By creating an account, you agree to our{" "}
                        <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                        {" "}and{" "}
                        <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                      </p>
                    </form>

                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AuthPage;
