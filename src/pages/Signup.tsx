import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Mail, Lock, User, Eye, EyeOff, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { useEffect, useRef } from "react";

const Signup = () => {
  const navigate = useNavigate();
  const { signup, loginWithGoogle, error: authError } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // GSAP entrance animation
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }
      );
    }
  }, []);

  // Password validation
  const passwordRequirements = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);
  const passwordMatch = formData.password === formData.confirmPassword && formData.password.length > 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!isPasswordValid) {
      setError("Password does not meet the requirements");
      return;
    }

    if (!passwordMatch) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await signup(formData.email, formData.password);
      navigate("/");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Signup failed";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setGoogleLoading(true);
      setError("");
      await loginWithGoogle();
      navigate("/");
    } catch (err: any) {
      // Gracefully handle popup closed by user
      if (err.code === "auth/popup-closed-by-user") {
        return;
      }
      const errorMsg = err instanceof Error ? err.message : "Google Signup failed";
      setError(errorMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      <div
        ref={cardRef}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border border-border backdrop-blur-xl bg-card/50 transition-colors duration-500">
          <CardHeader className="space-y-2 pb-4 sm:pb-6">
            <div className="flex items-center justify-center mb-2 sm:mb-4">
              <Link to="/" className="font-cursive text-3xl sm:text-4xl text-foreground mt-2 sm:mt-4 mb-1 sm:mb-2 hover:opacity-80 transition-opacity">
                FlexTheKicks
              </Link>
            </div>
            <CardTitle className="text-xl sm:text-2xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center text-xs sm:text-sm">
              Join us to start your shopping journey
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 sm:space-y-6 pt-0 sm:pt-2">
            {/* Error Messages */}
            {(error || authError) && (
              <Alert className="bg-destructive/10 border-destructive/50 py-2 sm:py-3">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive flex-shrink-0" />
                <AlertDescription className="text-destructive text-xs sm:text-sm ml-2">
                  {error || authError}
                </AlertDescription>
              </Alert>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSignup} className="space-y-3 sm:space-y-4">
              {/* Full Name */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-1.5 sm:space-y-2"
              >
                <label className="block text-xs sm:text-sm font-medium text-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 sm:top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    name="fullName"
                    placeholder="Name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm bg-background border-border placeholder:text-muted-foreground transition-all"
                    disabled={loading || googleLoading}
                  />
                </div>
              </motion.div>

              {/* Email */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-1.5 sm:space-y-2"
              >
                <label className="block text-xs sm:text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 sm:top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    name="email"
                    placeholder="Email address "
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm bg-background border-border placeholder:text-muted-foreground transition-all"
                    disabled={loading || googleLoading}
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-1.5 sm:space-y-2"
              >
                <label className="block text-xs sm:text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 sm:top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-9 sm:pl-10 pr-10 h-10 sm:h-11 text-sm bg-background border-border placeholder:text-muted-foreground transition-all"
                    disabled={loading || googleLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 sm:top-3 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={loading || googleLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </button>
                </div>

                {/* Password Requirements */}
                {formData.password && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs space-y-1 mt-2 bg-muted/30 rounded p-2"
                  >
                    <div
                      className={`flex items-center gap-2 ${passwordRequirements.length ? "text-green-600" : "text-muted-foreground"
                        }`}
                    >
                      {passwordRequirements.length ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      At least 8 characters
                    </div>
                    <div
                      className={`flex items-center gap-2 ${passwordRequirements.uppercase ? "text-green-600" : "text-muted-foreground"
                        }`}
                    >
                      {passwordRequirements.uppercase ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      One uppercase letter
                    </div>
                    <div
                      className={`flex items-center gap-2 ${passwordRequirements.lowercase ? "text-green-600" : "text-muted-foreground"
                        }`}
                    >
                      {passwordRequirements.lowercase ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      One lowercase letter
                    </div>
                    <div
                      className={`flex items-center gap-2 ${passwordRequirements.number ? "text-green-600" : "text-muted-foreground"
                        }`}
                    >
                      {passwordRequirements.number ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      One number
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Confirm Password */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="space-y-1.5 sm:space-y-2"
              >
                <label className="block text-xs sm:text-sm font-medium text-foreground">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 sm:top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-9 sm:pl-10 pr-10 h-10 sm:h-11 text-sm bg-background border-border placeholder:text-muted-foreground transition-all"
                    disabled={loading || googleLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 sm:top-3 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={loading || googleLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </button>
                </div>
                {formData.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-xs flex items-center gap-1 ${passwordMatch ? "text-green-600" : "text-destructive"
                      }`}
                  >
                    {passwordMatch ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    {passwordMatch ? "Passwords match" : "Passwords do not match"}
                  </motion.p>
                )}
              </motion.div>

              {/* Signup Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="pt-1 sm:pt-2"
              >
                <Button
                  type="submit"
                  disabled={loading || googleLoading || !isPasswordValid || !passwordMatch}
                  className="w-full h-10 sm:h-11 text-sm font-semibold tracking-wide"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </motion.div>
            </form>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground font-semibold">Or join with</span>
              </div>
            </div>

            <Button
              variant="outline"
              type="button"
              disabled={loading || googleLoading}
              onClick={handleGoogleSignup}
              className="w-full h-11 border-border font-bold hover:bg-secondary/50 transition-all flex items-center justify-center gap-3"
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Sign up with Google</span>
                </>
              )}
            </Button>

            {/* Login Link */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center text-xs sm:text-sm pt-2"
            >
              <p className="text-muted-foreground font-medium">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-bold text-primary hover:underline transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
