import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TermsOfService = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.terms-animate',
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
    <>
      <Header onSearchOpen={() => {}} />
      <main ref={containerRef} className="min-h-[70vh] bg-background pt-28 pb-16 flex flex-col items-center">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl rounded-lg shadow-md p-8 bg-white dark:bg-zinc-900 dark:text-zinc-100 transition-colors">
          {/* Back Button */}
          <Link
            to="/"
            className="terms-animate inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-sans mb-6"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          {/* Header */}
          <div className="terms-animate text-center mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 dark:bg-white/10 mb-4">
              <FileText size={16} className="text-foreground/70 dark:text-white/70" />
              <span className="text-xs font-sans font-medium text-foreground/70 dark:text-white/70 uppercase tracking-wider">
                Legal Information
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
              Terms of Service
            </h1>
            <p className="text-muted-foreground dark:text-zinc-300 font-sans text-sm">
              Last updated: March 2025
            </p>
          </div>

          {/* Content */}
          <div className="terms-animate space-y-8">
            <section>
              <h2 className="font-display text-lg font-bold mb-3">1. Acceptance of Terms</h2>
              <p className="text-sm text-muted-foreground dark:text-zinc-300 font-sans leading-relaxed">
                By accessing or using FlexTheKicks, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. We reserve the right to modify these terms at any time, and your continued use constitutes acceptance of any changes.
              </p>
            </section>
            <section>
              <h2 className="font-display text-lg font-bold mb-3">2. Account Registration</h2>
              <p className="text-sm text-muted-foreground dark:text-zinc-300 font-sans leading-relaxed">
                To make purchases, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
              </p>
            </section>
            <section>
              <h2 className="font-display text-lg font-bold mb-3">3. Product Information</h2>
              <p className="text-sm text-muted-foreground dark:text-zinc-300 font-sans leading-relaxed">
                We strive to display accurate product information, including images, descriptions, and pricing. However, we do not guarantee that all information is accurate, complete, or current. Colors may appear differently on various devices.
              </p>
            </section>
            <section>
              <h2 className="font-display text-lg font-bold mb-3">4. Orders and Payment</h2>
              <p className="text-sm text-muted-foreground dark:text-zinc-300 font-sans leading-relaxed">
                All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason. Prices are subject to change without notice. Payment must be made at the time of ordering through our approved payment methods.
              </p>
            </section>
            <section>
              <h2 className="font-display text-lg font-bold mb-3">5. Shipping and Delivery</h2>
              <p className="text-sm text-muted-foreground dark:text-zinc-300 font-sans leading-relaxed">
                Delivery times are estimates and not guaranteed. We are not responsible for delays caused by shipping carriers or circumstances beyond our control. Risk of loss and title for items pass to you upon delivery to the carrier.
              </p>
            </section>
            <section>
              <h2 className="font-display text-lg font-bold mb-3">6. Returns and Refunds</h2>
              <p className="text-sm text-muted-foreground dark:text-zinc-300 font-sans leading-relaxed">
                Returns are accepted within 7 days of delivery for unworn products in original condition. Refunds are processed within 5-7 business days after we receive the returned item. Sale items may have different return policies.
              </p>
            </section>
            <section>
              <h2 className="font-display text-lg font-bold mb-3">7. Intellectual Property</h2>
              <p className="text-sm text-muted-foreground dark:text-zinc-300 font-sans leading-relaxed">
                All content on this website, including text, graphics, logos, and images, is the property of FlexTheKicks or its content suppliers and is protected by copyright and other intellectual property laws.
              </p>
            </section>
            <section>
              <h2 className="font-display text-lg font-bold mb-3">8. Contact Information</h2>
              <p className="text-sm text-muted-foreground dark:text-zinc-300 font-sans leading-relaxed">
                For any questions about these Terms of Service, please contact us at{' '}
                <a href="mailto:legal@flexthekicks.com" className="text-foreground hover:underline">
                  legal@flexthekicks.com
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default TermsOfService;
