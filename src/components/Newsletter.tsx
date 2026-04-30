import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Check, Mail, Lock, RefreshCw } from "lucide-react";
import gsap from "gsap";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  // GSAP animation for form elements
  useEffect(() => {
    if (isInView && formRef.current) {
      const button = formRef.current.querySelector('button');
      if (button) {
        gsap.fromTo(
          button,
          { scale: 0.9, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, delay: 0.4, ease: "back.out(1.7)" }
        );
      }
    }
  }, [isInView]);

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const API_URL = '/api/newsletter';

const sendOTP = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          action: 'send-otp'
        })
      });

      const data = await response.json();

      if (data.success) {
        setStep('otp');
        setResendTimer(60); // 60 seconds timer
      } else {
        setError(data.error || 'Failed to send verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          action: 'verify-otp',
          otp
        })
      });

      const data = await response.json();

      if (data.success) {
        setStep('success');
        setEmail("");
        setOtp("");
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          action: 'send-otp'
        })
      });

      const data = await response.json();

      if (data.success) {
        setResendTimer(60);
        setError("");
      } else {
        setError(data.error || 'Failed to resend code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'email') {
      sendOTP();
    } else if (step === 'otp') {
      verifyOTP();
    }
  };

  const resetForm = () => {
    setStep('email');
    setEmail("");
    setOtp("");
    setError("");
    setResendTimer(0);
  };

  return (
    <section ref={ref} className="py-10 sm:py-20 md:py-32 bg-secondary/50 relative overflow-hidden">
      {/* Subtle ambient circle */}
      <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-foreground/[0.02] blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-foreground/[0.02] blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3 sm:mb-4 font-sans"
          >
            Stay in the Loop
           
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-xl sm:text-3xl md:text-5xl font-bold leading-[1] mb-2 sm:mb-4"
          >
            Never Miss a <span className="italic font-normal">Drop</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground text-[11px] sm:text-sm md:text-base mb-5 sm:mb-8 md:mb-10 font-sans font-light max-w-md mx-auto px-2 sm:px-0"
          >
            {step === 'success' 
              ? "You're all set! Get ready for exclusive drops and special offers."
              : "Get early access to new releases, restocks, and exclusive deals delivered straight to your inbox."
            }
          </motion.p>

          {step !== 'success' ? (
            <motion.form
              ref={formRef}
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-4 max-w-lg mx-auto"
            >
              {step === 'email' ? (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-4 bg-background border border-border rounded-full text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow font-sans"
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    className="btn-glow px-5 sm:px-8 py-2.5 sm:py-4 bg-foreground text-background text-[10px] font-sans font-semibold uppercase tracking-[0.15em] rounded-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <>
                        Subscribe
                        <ArrowRight size={14} />
                      </>
                    )}
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-full text-center text-lg font-mono tracking-widest placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={loading}
                      className="flex-1 btn-glow px-6 py-3 bg-foreground text-background text-xs font-sans font-semibold uppercase tracking-[0.15em] rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw size={14} className="animate-spin mx-auto" />
                      ) : (
                        'Verify'
                      )}
                    </motion.button>
                    
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendTimer > 0 || loading}
                      className="px-6 py-3 bg-muted text-muted-foreground text-xs font-sans font-medium rounded-full hover:bg-muted/80 transition-colors disabled:opacity-50"
                    >
                      {resendTimer > 0 ? `${resendTimer}s` : 'Resend'}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500 font-medium text-center"
                >
                  {error}
                </motion.p>
              )}
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check size={24} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Welcome aboard!</h3>
              <p className="text-muted-foreground text-sm">
                Check your inbox for a confirmation email ✨
              </p>
              <button
                onClick={resetForm}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
              >
                Subscribe another email
                
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
