import { useState } from "react";
import { Mail, X, Check } from "lucide-react";
import { toast } from "sonner";

interface EmailInvoicePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
  loading?: boolean;
}

const EmailInvoicePopup = ({ isOpen, onClose, onSubmit, loading = false }: EmailInvoicePopupProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      await onSubmit(email);
      setIsSubmitted(true);
      toast.success("Invoice will be sent to your email!");
    } catch (error) {
      toast.error("Failed to send invoice. Please try again.");
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail("");
      setIsSubmitted(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl border border-border shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Invoice Delivery</h3>
                <p className="text-sm text-muted-foreground">Get your order invoice</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="w-8 h-8 rounded-full bg-background hover:bg-muted transition-colors flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isSubmitted ? (
            <>
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Enter your email address to receive a detailed invoice with your order details, payment information, and product specifications.
                </p>
                <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 p-3 rounded-lg">
                  <Check className="w-4 h-4" />
                  {/* <span>You'll receive a beautifully formatted PDF invoice</span> */}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="invoice-email" className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <input
                    id="invoice-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="flex-1 px-4 py-3 border border-border rounded-lg bg-background hover:bg-muted transition-colors font-medium text-foreground disabled:opacity-50"
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send Invoice"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              <h4 className="text-lg font-bold text-foreground mb-2">Invoice Sent!</h4>
              <p className="text-sm text-muted-foreground mb-6">
                Your invoice has been sent to <strong>{email}</strong>. You should receive it shortly.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailInvoicePopup;
