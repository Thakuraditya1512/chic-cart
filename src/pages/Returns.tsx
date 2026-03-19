import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Returns = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.returns-animate',
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

  const steps = [
    {
      icon: RefreshCw,
      title: 'Initiate Return',
      description: 'Go to "My Orders" and select the item you want to return.',
    },
    {
      icon: CheckCircle,
      title: 'Quality Check',
      description: 'We verify the return request and approve if eligible.',
    },
    {
      icon: Clock,
      title: 'Pickup Scheduled',
      description: 'Our courier partner picks up the item from your address.',
    },
    {
      icon: XCircle,
      title: 'Refund Processed',
      description: 'Refund is initiated within 48 hours of receiving the item.',
    },
  ];

  const conditions = [
    'Item must be in original, unworn condition',
    'All original tags and packaging must be intact',
    'Return request must be initiated within 7 days of delivery',
    'Sale items can only be exchanged, not returned for refund',
    'Customized or personalized items cannot be returned',
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-background py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        {/* Back Button */}
        <Link
          to="/"
          className="returns-animate inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-sans mb-6"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="returns-animate text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 mb-4">
            <RefreshCw size={16} className="text-foreground/70" />
            <span className="text-xs font-sans font-medium text-foreground/70 uppercase tracking-wider">
              Easy Returns
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
            Returns & Exchanges
          </h1>
          <p className="text-muted-foreground font-sans text-sm sm:text-base max-w-md mx-auto">
            Hassle-free returns within 7 days. We make it simple and quick.
          </p>
        </div>

        {/* Process Steps */}
        <div className="returns-animate grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 sm:mb-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-foreground/5 rounded-2xl p-5 sm:p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-foreground/10 flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-6 h-6 text-foreground/70" />
              </div>
              <h3 className="font-display text-sm font-bold mb-2">
                {index + 1}. {step.title}
              </h3>
              <p className="text-xs text-muted-foreground font-sans">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Return Conditions */}
        <div className="returns-animate bg-foreground/5 rounded-2xl p-6 sm:p-8 mb-8">
          <h2 className="font-display text-lg font-bold mb-4">
            Return Conditions
          </h2>
          <ul className="space-y-3">
            {conditions.map((condition, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground font-sans">{condition}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Refund Info */}
        <div className="returns-animate grid sm:grid-cols-2 gap-4">
          <div className="bg-foreground/5 rounded-2xl p-6">
            <h3 className="font-display text-base font-bold mb-3">
              Refund Timeline
            </h3>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              Refunds are processed within 5-7 business days after we receive the returned item. 
              The amount is credited back to your original payment method.
            </p>
          </div>

          <div className="bg-foreground/5 rounded-2xl p-6">
            <h3 className="font-display text-base font-bold mb-3">
              Size Exchanges
            </h3>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              Size exchanges are free and subject to availability. If your size is unavailable, 
              you can opt for a refund or store credit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Returns;
