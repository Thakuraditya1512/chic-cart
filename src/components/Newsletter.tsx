import { useState } from "react";
import { Send } from "lucide-react";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail("");
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <section className="py-16 md:py-24 bg-secondary">
      <div className="container mx-auto px-4 text-center max-w-xl">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
          Stay in the Loop
        </h2>
        <p className="text-muted-foreground text-sm mb-8">
          Subscribe for exclusive access, early drops, and styling tips.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="flex-1 px-4 py-3 bg-background border border-border rounded-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-primary text-primary-foreground text-sm font-medium uppercase tracking-wider hover:opacity-90 transition-opacity rounded-sm flex items-center gap-2"
          >
            <Send size={14} />
            <span className="hidden sm:inline">Subscribe</span>
          </button>
        </form>
        {submitted && (
          <p className="mt-4 text-sm text-foreground animate-fade-in">
            Thank you for subscribing! ✨
          </p>
        )}
      </div>
    </section>
  );
};

export default Newsletter;
