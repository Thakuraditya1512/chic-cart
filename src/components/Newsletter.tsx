import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Check } from "lucide-react";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail("");
      setTimeout(() => setSubmitted(false), 4000);
    }
  };

  return (
    <section ref={ref} className="py-24 md:py-36 bg-secondary/50 relative overflow-hidden">
      {/* Subtle ambient circle */}
      <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-foreground/[0.02] blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-foreground/[0.02] blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-muted-foreground mb-4 font-sans"
          >
            Stay in the Loop
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-3xl md:text-5xl font-bold leading-[1] mb-4"
          >
            Never Miss a <span className="italic font-normal">Drop</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground text-sm md:text-base mb-10 font-sans font-light max-w-md mx-auto"
          >
            Get early access to new releases, restocks, and exclusive deals
            delivered straight to your inbox.
          </motion.p>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-6 py-4 bg-background border border-border rounded-full text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow font-sans"
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-glow px-8 py-4 bg-foreground text-background text-xs font-sans font-semibold uppercase tracking-[0.15em] rounded-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              {submitted ? (
                <>
                  <Check size={14} />
                  Subscribed
                </>
              ) : (
                <>
                  Subscribe
                  <ArrowRight size={14} />
                </>
              )}
            </motion.button>
          </motion.form>

          {submitted && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-sm text-foreground/60 font-sans"
            >
              Welcome aboard! Check your inbox for confirmation ✨
            </motion.p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
