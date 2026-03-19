import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.privacy-animate',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-background py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        {/* Back Button */}
        <Link
          to="/"
          className="privacy-animate inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-sans mb-6"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="privacy-animate text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 mb-4">
            <Shield size={16} className="text-foreground/70" />
            <span className="text-xs font-sans font-medium text-foreground/70 uppercase tracking-wider">
              Your Data Matters
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground font-sans text-sm">
            Last updated: March 2025
          </p>
        </div>

        {/* Content */}
        <div className="privacy-animate space-y-8">
          <section>
            <h2 className="font-display text-lg font-bold mb-3">1. Information We Collect</h2>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              We collect information you provide directly to us when you create an account, 
              make a purchase, or contact our support team. This includes your name, email address, 
              phone number, shipping address, and payment information. We also automatically collect 
              certain information about your device and usage of our services.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-3">2. How We Use Your Information</h2>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              We use the information we collect to process your orders, communicate with you about 
              your purchases, provide customer support, improve our services, and send you marketing 
              communications (with your consent). We may also use your information for fraud prevention 
              and security purposes.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-3">3. Information Sharing</h2>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              We do not sell your personal information. We may share your information with 
              service providers who help us operate our business (payment processors, shipping 
              carriers, etc.) and when required by law or to protect our rights.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-3">4. Data Security</h2>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              We implement appropriate technical and organizational measures to protect your 
              personal information against unauthorized access, alteration, disclosure, or destruction. 
              However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-3">5. Your Rights</h2>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              You have the right to access, correct, or delete your personal information. 
              You may also opt out of receiving marketing communications at any time. To exercise 
              these rights, please contact us at privacy@flexthekicks.com.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-3">6. Cookies</h2>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              We use cookies and similar technologies to enhance your experience, understand 
              usage patterns, and improve our services. You can control cookies through your 
              browser settings.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-3">7. Contact Us</h2>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:privacy@flexthekicks.com" className="text-foreground hover:underline">
                privacy@flexthekicks.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
