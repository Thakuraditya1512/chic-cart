import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Send, MessageCircle, Phone, Mail, HelpCircle, CheckCircle, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import ChatBot from '@/components/ChatBot';

const Support = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    orderId: '',
    shoeId: '',
    issue: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.support-animate',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setLoading(false);
    setSubmitted(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div>
      {/* ChatBot */}
      <ChatBot isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Floating Chat Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-[#6c5ce7] to-[#a855f7] text-white shadow-lg shadow-[#6c5ce7]/30 hover:shadow-xl hover:shadow-[#6c5ce7]/40 hover:scale-105 transition-all duration-300 flex items-center justify-center group"
        aria-label="Open chat support"
      >
        {chatOpen ? (
          <ArrowLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
        ) : (
          <div className="flex items-center gap-1">
            <Bot size={24} className="group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          </div>
        )}
      </button>

      <div ref={containerRef} className="min-h-screen pt-20 sm:pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-sans text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="support-animate text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 mb-4">
            <HelpCircle size={16} className="text-foreground/70" />
            <span className="text-xs font-sans font-medium text-foreground/70">
              Support Center
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
            How can we help?
          </h1>
          <p className="text-muted-foreground font-sans text-sm sm:text-base max-w-md mx-auto">
            Fill out the form below with your order details and our support team will contact you within 24 hours.
          </p>
        </div>

        {!submitted ? (
          <div className="grid md:grid-cols-5 gap-6 sm:gap-8">
            {/* Contact Info Card */}
            <div className="support-animate md:col-span-2">
              <div className="bg-foreground/5 rounded-2xl p-6 sm:p-8 sticky top-24">
                <h2 className="font-display text-lg sm:text-xl font-bold mb-6">
                  Contact Information
                </h2>

                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                      <MessageCircle size={18} className="text-foreground/70" />
                    </div>
                    <div>
                      <p className="font-sans font-medium text-sm">WhatsApp Support</p>
                      <a
                        href="https://wa.me/919999999999"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground text-sm hover:text-foreground transition-colors"
                      >
                        +91 99999 99999
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                      <Mail size={18} className="text-foreground/70" />
                    </div>
                    <div>
                      <p className="font-sans font-medium text-sm">Email Support</p>
                      <a
                        href="mailto:support@flexthekicks.com"
                        className="text-muted-foreground text-sm hover:text-foreground transition-colors"
                      >
                        support@flexthekicks.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                      <Phone size={18} className="text-foreground/70" />
                    </div>
                    <div>
                      <p className="font-sans font-medium text-sm">Phone Support</p>
                      <p className="text-muted-foreground text-sm">
                        Mon - Sat (10AM - 7PM)
                      </p>
                      <a
                        href="tel:+911800123456"
                        className="text-muted-foreground text-sm hover:text-foreground transition-colors"
                      >
                        1800-123-456
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-foreground/10">
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                    Response time: Usually within 2-4 hours during business hours. For urgent queries, WhatsApp is recommended.
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="support-animate md:col-span-3 bg-foreground/5 rounded-2xl p-6 sm:p-8"
            >
              <h2 className="font-display text-lg sm:text-xl font-bold mb-6">
                Submit a Request
              </h2>

              <div className="space-y-5">
                {/* Name & Email Row */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-sans font-medium text-foreground/70 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                      className="w-full px-4 py-3 bg-background border border-foreground/10 rounded-lg text-sm font-sans focus:outline-none focus:border-foreground/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-sans font-medium text-foreground/70 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 bg-background border border-foreground/10 rounded-lg text-sm font-sans focus:outline-none focus:border-foreground/30 transition-colors"
                    />
                  </div>
                </div>

                {/* Order ID & Shoe ID Row */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-sans font-medium text-foreground/70 mb-2">
                      Order ID *
                    </label>
                    <input
                      type="text"
                      name="orderId"
                      value={formData.orderId}
                      onChange={handleChange}
                      required
                      placeholder="e.g., ORD-123456"
                      className="w-full px-4 py-3 bg-background border border-foreground/10 rounded-lg text-sm font-sans focus:outline-none focus:border-foreground/30 transition-colors uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-sans font-medium text-foreground/70 mb-2">
                      Shoe ID (Optional)
                    </label>
                    <input
                      type="text"
                      name="shoeId"
                      value={formData.shoeId}
                      onChange={handleChange}
                      placeholder="e.g., SHOE-789"
                      className="w-full px-4 py-3 bg-background border border-foreground/10 rounded-lg text-sm font-sans focus:outline-none focus:border-foreground/30 transition-colors uppercase"
                    />
                  </div>
                </div>

                {/* Issue Description */}
                <div>
                  <label className="block text-xs font-sans font-medium text-foreground/70 mb-2">
                    Describe Your Issue *
                  </label>
                  <textarea
                    name="issue"
                    value={formData.issue}
                    onChange={handleChange}
                    required
                    rows={4}
                    placeholder="Please describe your issue in detail..."
                    className="w-full px-4 py-3 bg-background border border-foreground/10 rounded-lg text-sm font-sans focus:outline-none focus:border-foreground/30 transition-colors resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 bg-foreground text-background font-sans font-semibold text-sm uppercase tracking-wider rounded-lg hover:bg-foreground/90 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Request
                    </>
                  )}
                </button>
              </div>

              <p className="mt-4 text-[10px] text-muted-foreground font-sans text-center">
                By submitting, you agree to our privacy policy and terms of service.
              </p>
            </form>
          </div>
        ) : (
          /* Success State */
          <div className="support-animate text-center py-12 sm:py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500/10 mb-6">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">
              Request Submitted!
            </h2>
            <p className="text-muted-foreground font-sans text-sm sm:text-base max-w-md mx-auto mb-8">
              Our support team has received your request and will contact you at{' '}
              <span className="text-foreground font-medium">{formData.email}</span>{' '}
              within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    name: '',
                    email: '',
                    orderId: '',
                    shoeId: '',
                    issue: '',
                  });
                }}
                className="px-6 py-3 bg-foreground text-background font-sans font-semibold text-sm rounded-lg hover:bg-foreground/90 transition-colors"
              >
                Submit Another Request
              </button>
              <Link
                to="/"
                className="px-6 py-3 border border-foreground/20 font-sans font-semibold text-sm rounded-lg hover:bg-foreground/5 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Support;
