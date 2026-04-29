import React, { useState, useEffect, useRef } from 'react';
import { db } from "@/lib/firebase";// Adjust this path to your firebase config
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import gsap from 'gsap';
import { ArrowLeft, Send, MessageCircle, Phone, Mail, CheckCircle, Bot, ShieldCheck, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import ChatBot from '@/components/ChatBot';

const Support = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    orderId: '',
    category: 'Product Issue',
    issue: '',
    priority: 'Normal'
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const containerRef = useRef(null);
  const successRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.support-animate', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Firebase Firestore Integration
      const docRef = await addDoc(collection(db, "support_tickets"), {
        ...formData,
        status: 'Open',
        createdAt: serverTimestamp(),
        source: 'Web Portal'
      });
      
      setTicketId(docRef.id);
      setLoading(false);
      setSubmitted(true);

      // Success Animation
      setTimeout(() => {
        gsap.fromTo(successRef.current, 
          { scale: 0.8, opacity: 0 }, 
          { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
        );
      }, 100);

    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Something went wrong. Please try again later.");
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div ref={containerRef} className="bg-background text-foreground">
      <ChatBot isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-purple-600 to-pink-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:scale-110 transition-all duration-300 flex items-center justify-center"
      >
        {chatOpen ? <ArrowLeft size={24} /> : <Bot size={24} />}
      </button>

      <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        <div className="support-animate mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
            Help & Support
          </h1>
          <p className="text-muted-foreground text-base max-w-xl">
            Our specialized team usually responds within <span className="text-foreground font-semibold">2-4 hours</span>. 
          </p>
        </div>

        {!submitted ? (
          <div className="grid md:grid-cols-5 gap-8">
            {/* Sidebar info */}
            <div className="support-animate md:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <ShieldCheck className="text-blue-500" size={20}/> Support Channels
                </h2>
                <div className="space-y-6">
                  <div className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                      <MessageCircle size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">WhatsApp Support</p>
                      <a href="https://wa.me/919398415366" className="text-sm text-muted-foreground hover:underline">+91 93984 15366</a>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                      <Mail size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Email Inquiry</p>
                      <a href="mailto:support@flexthekicks.com" className="text-sm text-muted-foreground hover:underline">support@flexthekicks.com</a>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock size={14} />
                    <span>Average Response: 120 mins</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="support-animate md:col-span-3 bg-card border border-border rounded-3xl p-8 shadow-xl shadow-black/5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Name</label>
                  <input name="name" required placeholder="John Doe" value={formData.name} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order ID</label>
                  <input name="orderId" required placeholder="#FTK-9901" value={formData.orderId} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Issue Category</label>
                <select name="category" value={formData.category} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none">
                  <option>Product Defect</option>
                  <option>Shipping Delay</option>
                  <option>Refund Request</option>
                  <option>Size Exchange</option>
                </select>
              </div>

              <div className="space-y-2 mb-6">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                <textarea name="issue" required rows={5} placeholder="Tell us more about the problem..." value={formData.issue} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 bg-foreground text-background rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all flex justify-center items-center gap-2 group">
                {loading ? "Processing..." : <><Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"/> Open Ticket</>}
              </button>
            </form>
          </div>
        ) : (
          <div ref={successRef} className="text-center py-20 bg-card border border-border rounded-3xl max-w-2xl mx-auto shadow-2xl">
            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} />
            </div>
            <h2 className="text-3xl font-bold mb-2">Ticket Created!</h2>
            <p className="text-muted-foreground mb-4">Reference ID: <span className="text-foreground font-mono font-bold uppercase">{ticketId.slice(0, 8)}</span></p>
            <p className="max-w-xs mx-auto text-sm text-muted-foreground mb-8">
              We've sent a confirmation to <strong>{formData.email}</strong>. Our agents are reviewing your request.
            </p>
            <Link to="/" className="inline-flex items-center gap-2 px-8 py-3 bg-foreground text-background rounded-full font-bold hover:scale-105 transition-transform">
              Return Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Support;
