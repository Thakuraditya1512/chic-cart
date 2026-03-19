import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowLeft, HelpCircle, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQ = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.faq-animate',
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

  const faqs = [
    {
      question: 'How do I place an order?',
      answer:
        "Simply browse our collection, select your desired product, choose your size, and click 'Add to Cart'. When you're ready to checkout, proceed to the checkout page, fill in your delivery details, and complete payment. You'll receive an order confirmation email once your order is placed.",
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept multiple payment methods including UPI, Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, and Cash on Delivery (COD) for select locations. All online payments are processed securely through our trusted payment partners.',
    },
    {
      question: 'How long does delivery take?',
      answer:
        'Standard delivery takes 3-7 business days depending on your location. Metro cities typically receive orders within 3-5 days, while tier 2 and 3 cities may take 5-7 days. We also offer express delivery for select pin codes at an additional charge.',
    },
    {
      question: 'Are your products authentic?',
      answer:
        'Yes, all products on FlexTheKicks are 100% authentic. We source directly from authorized distributors and brands. Every product comes with original packaging and brand tags. We guarantee authenticity or your money back.',
    },
    {
      question: 'What is your return policy?',
      answer:
        'We offer a 7-day easy return policy for unworn products in original condition with all tags attached. Simply initiate a return from your orders page, and our team will arrange a pickup. Refunds are processed within 5-7 business days after we receive the returned item.',
    },
    {
      question: 'How do I track my order?',
      answer:
        'Once your order is shipped, you will receive an email and WhatsApp message with your tracking details. You can also track your order from the "My Orders" section in your account dashboard using your order ID.',
    },
    {
      question: 'Do you offer exchanges?',
      answer:
        'Yes, we offer size exchanges within 7 days of delivery. The product must be unworn with original packaging. Contact our support team or initiate an exchange from your orders page. Size exchanges are subject to availability.',
    },
    {
      question: 'Can I cancel my order?',
      answer:
        'Orders can be cancelled within 2 hours of placing them or before they are shipped, whichever comes first. Once shipped, orders cannot be cancelled but can be returned after delivery as per our return policy.',
    },
    {
      question: 'Do you ship internationally?',
      answer:
        'Currently, we only ship within India. We are working on expanding our services to international locations soon. Stay tuned for updates!',
    },
    {
      question: 'How can I contact customer support?',
      answer:
        'You can reach our support team through multiple channels: WhatsApp (+91 99999 99999), Email (support@flexthekicks.com), or our Contact page. We typically respond within 2-4 hours during business hours (10 AM - 7 PM).',
    },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-background py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        {/* Back Button */}
        <Link
          to="/"
          className="faq-animate inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-sans mb-6"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="faq-animate text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 mb-4">
            <HelpCircle size={16} className="text-foreground/70" />
            <span className="text-xs font-sans font-medium text-foreground/70 uppercase tracking-wider">
              Help Center
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground font-sans text-sm sm:text-base">
            Got questions? We've got answers.
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="faq-animate bg-foreground/5 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-foreground/10 transition-colors"
              >
                <span className="font-sans font-medium text-sm sm:text-base pr-4">
                  {faq.question}
                </span>
                <span className="shrink-0">
                  {openIndex === index ? (
                    <Minus size={18} className="text-foreground/60" />
                  ) : (
                    <Plus size={18} className="text-foreground/60" />
                  )}
                </span>
              </button>
              {openIndex === index && (
                <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                  <p className="text-muted-foreground font-sans text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="faq-animate mt-10 text-center">
          <p className="text-muted-foreground font-sans text-sm mb-4">
            Still have questions?
          </p>
          <Link
            to="/support"
            className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background font-sans font-semibold text-sm rounded-lg hover:bg-foreground/90 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
