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
    issue: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const containerRef = useRef(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulated API
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setLoading(false);
    setSubmitted(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div ref={containerRef}>
      {/* ChatBot */}
      <ChatBot isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Floating Chat */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:scale-105 transition"
      >
        {chatOpen ? <ArrowLeft size={22} /> : <Bot size={22} />}
      </button>

      <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 max-w-6xl mx-auto">

        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="support-animate text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Customer Support
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Need help with your order, refund, or product? Our support team is here to assist you.
          </p>
        </div>

        {!submitted ? (
          <div className="grid md:grid-cols-5 gap-6">

            {/* Contact Info */}
            <div className="support-animate md:col-span-2">
              <div className="bg-foreground/5 rounded-2xl p-6 sticky top-24">
                <h2 className="text-lg font-bold mb-6">Contact Options</h2>

                <div className="space-y-5">

                  <div className="flex gap-3">
                    <MessageCircle size={18} />
                    <div>
                      <p className="text-sm font-medium">WhatsApp</p>
                      <a href="https://wa.me/919398415366" className="text-sm text-muted-foreground hover:text-foreground">
                        +91 93984 15366
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Mail size={18} />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <a href="mailto:support@flexthekicks.com" className="text-sm text-muted-foreground hover:text-foreground">
                        support@flexthekicks.com
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Phone size={18} />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-xs text-muted-foreground">Mon–Sat (10AM–7PM)</p>
                      <a href="tel:+919398415366" className="text-sm text-muted-foreground hover:text-foreground">
                        +91 93984 15366
                      </a>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-6">
                  Average response time: 2–6 hours. For urgent queries, we recommend WhatsApp support.
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="support-animate md:col-span-3 bg-foreground/5 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-6">Submit a Request</h2>

              <div className="space-y-4">

                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-foreground/10 bg-background text-sm"
                />

                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-foreground/10 bg-background text-sm"
                />

                <input
                  type="text"
                  name="orderId"
                  required
                  placeholder="Order ID"
                  value={formData.orderId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-foreground/10 bg-background text-sm"
                />

                <textarea
                  name="issue"
                  required
                  rows={4}
                  placeholder="Describe your issue (order delay, refund, product issue, etc.)"
                  value={formData.issue}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-foreground/10 bg-background text-sm resize-none"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-foreground text-background rounded-lg text-sm font-semibold flex justify-center items-center gap-2"
                >
                  {loading ? "Submitting..." : <><Send size={16}/> Submit Request</>}
                </button>
              </div>

              <p className="mt-4 text-[11px] text-muted-foreground text-center">
                By submitting this form, you agree to our Terms & Privacy Policy.
              </p>
            </form>
          </div>
        ) : (
          <div className="support-animate text-center py-16">
            <CheckCircle size={40} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Request Submitted</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Our team will contact you at <strong>{formData.email}</strong> within 24 hours.
            </p>

            <Link to="/" className="px-6 py-3 bg-foreground text-background rounded-lg text-sm">
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Support;
