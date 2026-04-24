import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, ArrowRight, ShoppingBag, Package } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const transactionId = searchParams.get("id");

  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    if (!transactionId) {
      navigate("/");
      return;
    }
    verifyPayment();
  }, [transactionId]);

  const verifyPayment = async () => {
    try {
      // Check status from backend
      const response = await fetch(`/api/phonepe/status/${transactionId}`);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const text = await response.text();
      if (!text) throw new Error('Empty response from payment server');
      const data = JSON.parse(text);

      if (data.success && data.status === 'COMPLETED') {
        // Update order in Firebase
        const q = query(collection(db, "orders"), where("transactionId", "==", transactionId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const orderDoc = snapshot.docs[0];
          await updateDoc(doc(db, "orders", orderDoc.id), {
            status: "paid",
            paymentStatus: "completed",
            updatedAt: serverTimestamp()
          });
          setOrderDetails({ id: orderDoc.id, ...orderDoc.data() });
        }
        
        setStatus("success");
        clearCart();
        localStorage.removeItem('pending_order');
        toast.success("Payment successful!");
      } else {
        setStatus("failed");
        toast.error("Payment failed or is pending.");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setStatus("failed");
    }
  };

  const isDarkMode = localStorage.getItem("theme") === "dark";
  const bg = isDarkMode ? "bg-black" : "bg-[#f7f6f3]";
  const cardBg = isDarkMode ? "bg-zinc-900/40 backdrop-blur-md border-zinc-800/50" : "bg-white border-black/8 shadow-sm";
  const textPrimary = isDarkMode ? "text-white" : "text-[#0f0f0f]";
  const textMuted = isDarkMode ? "text-zinc-500" : "text-black/40";

  return (
    <div className={`min-h-screen ${bg} flex items-center justify-center p-4`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className={`${cardBg} rounded-[2.5rem] border p-8 text-center overflow-hidden relative`}>
          {status === "loading" && (
            <div className="py-12 space-y-6">
              <div className="relative mx-auto w-20 h-20">
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className={`text-2xl font-bold ${textPrimary}`}>Verifying Payment</h2>
                <p className={textMuted}>Please wait while we confirm your transaction...</p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="py-6 space-y-8">
              <div className="relative mx-auto w-24 h-24">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  className="absolute inset-0 bg-emerald-500 rounded-full flex items-center justify-center"
                >
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </motion.div>
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }} 
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -inset-4 border-2 border-emerald-500/20 rounded-full"
                />
              </div>

              <div className="space-y-2">
                <h2 className={`text-3xl font-bold tracking-tight ${textPrimary}`}>Order Confirmed!</h2>
                <p className={textMuted}>Your payment was successful and your order is being prepared.</p>
              </div>

              <div className={`p-6 rounded-3xl ${isDarkMode ? "bg-white/5" : "bg-black/[0.02]"} border ${isDarkMode ? "border-white/5" : "border-black/[0.05]"} text-left space-y-4`}>
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>Transaction ID</span>
                  <span className={`text-sm font-mono ${textPrimary}`}>{transactionId?.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>Payment Status</span>
                  <span className="text-xs font-bold px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-md">COMPLETED</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => navigate("/orders")}
                  className={`w-full py-4 rounded-2xl ${isDarkMode ? "bg-white text-black" : "bg-black text-white"} font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform`}
                >
                  <Package className="w-4 h-4" /> View My Orders
                </button>
                <button 
                  onClick={() => navigate("/")}
                  className={`w-full py-4 rounded-2xl border ${isDarkMode ? "border-white/10 text-white hover:bg-white/5" : "border-black/10 text-black hover:bg-black/5"} font-bold flex items-center justify-center gap-2 transition-all`}
                >
                  Continue Shopping <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {status === "failed" && (
            <div className="py-6 space-y-8">
              <div className="mx-auto w-24 h-24 bg-red-500 rounded-full flex items-center justify-center">
                <XCircle className="w-12 h-12 text-white" />
              </div>

              <div className="space-y-2">
                <h2 className={`text-3xl font-bold tracking-tight ${textPrimary}`}>Payment Failed</h2>
                <p className={textMuted}>Something went wrong with your transaction. No worries, your items are still in your cart.</p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => navigate("/checkout")}
                  className={`w-full py-4 rounded-2xl ${isDarkMode ? "bg-white text-black" : "bg-black text-white"} font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform`}
                >
                  Retry Payment
                </button>
                <button 
                  onClick={() => navigate("/support")}
                  className={`w-full py-4 rounded-2xl border ${isDarkMode ? "border-white/10 text-white hover:bg-white/5" : "border-black/10 text-black hover:bg-black/5"} font-bold flex items-center justify-center gap-2 transition-all`}
                >
                  Contact Support
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
