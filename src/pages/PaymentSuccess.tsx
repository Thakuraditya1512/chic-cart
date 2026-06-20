import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, XCircle, Loader2, ArrowRight, ShoppingBag, 
  Package, Download, Mail, Printer, Check, Edit2, AlertCircle 
} from "lucide-react";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, getDocs, updateDoc, 
  doc, serverTimestamp, addDoc 
} from "firebase/firestore";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const transactionId = searchParams.get("id");

  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [targetEmail, setTargetEmail] = useState("");
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  const sendOrderEmail = async (order: any) => {
    if (emailSent) return;
    try {
      await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: order.email,
          action: "send-order-confirmation",
          orderDetails: order
        })
      });
      setEmailSent(true);
    } catch (err) {
      console.error("Failed to send order email", err);
    }
  };

  const emailInvoice = async () => {
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    try {
      setEmailLoading(true);
      const resp = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          action: "send-invoice",
          orderDetails
        })
      });
      if (resp.ok) {
        toast.success(`Invoice sent successfully to ${targetEmail}! ✉️`);
        setIsEditingEmail(false);
      } else {
        throw new Error("Failed to send email");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to email invoice. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  useEffect(() => {
    if (!transactionId) {
      navigate("/");
      return;
    }
    verifyPayment();
  }, [transactionId]);

  const verifyPayment = async (attempt = 0) => {
    const method = searchParams.get("method");
    const isDirect = method === "cod" || method === "phonepe_qr" || method === "qr";

    if (isDirect) {
      try {
        const snap = await getDocs(query(collection(db, "orders"), where("__name__", "==", transactionId)));
        if (!snap.empty) {
          const orderData = { id: snap.docs[0].id, ...snap.docs[0].data() };
          setOrderDetails(orderData);
          setTargetEmail(orderData.email || "");
          setStatus("success");
          clearCart();
          await sendOrderEmail(orderData);
          return;
        }
        throw new Error("Order not found");
      } catch (err) {
        console.error("Direct order verification failed", err);
        setStatus("failed");
        return;
      }
    }

    try {
      const response = await fetch(`/api/phonepe/status/${transactionId}`);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const text = await response.text();
      if (!text) throw new Error('Empty response from payment server');
      const data = JSON.parse(text);

      if (data.success && data.status === 'COMPLETED') {
        const q = query(collection(db, "orders"), where("transactionId", "==", transactionId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const orderDoc = snapshot.docs[0];
          await updateDoc(doc(db, "orders", orderDoc.id), {
            status: "paid",
            paymentStatus: "completed",
            phonePeOrderId: data.data?.orderId || null,
            updatedAt: serverTimestamp(),
          });
          const orderData = { id: orderDoc.id, ...orderDoc.data() };
          setOrderDetails(orderData);
          setTargetEmail(orderData.email || "");
          await sendOrderEmail(orderData);
        } else {
          // Recover order from localStorage
          const pendingStr = localStorage.getItem('pending_order');
          if (pendingStr) {
            const pendingOrder = JSON.parse(pendingStr);
            if (pendingOrder.transactionId === transactionId) {
              pendingOrder.status = "paid";
              pendingOrder.paymentStatus = "completed";
              pendingOrder.phonePeOrderId = data.data?.orderId || null;
              pendingOrder.updatedAt = serverTimestamp();
              const docRef = await addDoc(collection(db, "orders"), pendingOrder);
              const orderData = { id: docRef.id, ...pendingOrder };
              setOrderDetails(orderData);
              setTargetEmail(orderData.email || "");
              await sendOrderEmail(orderData);
            }
          }
        }

        setStatus("success");
        clearCart();
        localStorage.removeItem('pending_order');
        toast.success("Payment successful! 🎉");

      } else if (data.status === 'PENDING' && attempt < 10) {
        setTimeout(() => verifyPayment(attempt + 1), 3000);
      } else {
        setStatus("failed");
        toast.error(data.status === 'PENDING'
          ? "Payment is still pending. Check My Orders for updates."
          : "Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setStatus("failed");
      toast.error("Could not verify payment. Check My Orders.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isDarkMode = localStorage.getItem("theme") === "dark";
  const bg = isDarkMode ? "bg-black" : "bg-[#f7f6f3]";
  const cardBg = isDarkMode ? "bg-zinc-900/40 backdrop-blur-md border-zinc-800/50" : "bg-white border-black/8 shadow-sm";
  const textPrimary = isDarkMode ? "text-white" : "text-[#0f0f0f]";
  const textSub = isDarkMode ? "text-zinc-300" : "text-black/70";
  const textMuted = isDarkMode ? "text-zinc-500" : "text-black/40";
  const divider = isDarkMode ? "border-zinc-800" : "border-black/5";
  const inputBg = isDarkMode ? "bg-zinc-950/50" : "bg-white";
  const inputBorder = isDarkMode ? "border-zinc-800" : "border-black/10";

  return (
    <div className={`min-h-screen ${bg} flex flex-col items-center justify-start py-12 px-4 sm:px-6 lg:px-8`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* CSS Print Styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          nav, header, footer, button, .no-print {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        <div className={`${cardBg} rounded-[2.5rem] border p-6 sm:p-10 relative overflow-hidden print-container`}>
          {status === "loading" && (
            <div className="py-20 text-center space-y-6 no-print">
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
                <h2 className={`text-2xl font-bold ${textPrimary}`}>Verifying Order</h2>
                <p className={textMuted}>Please wait while we confirm your details...</p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-8">
              {/* Header section (Celebration) */}
              <div className="text-center pb-6 border-b border-zinc-800/10 dark:border-white/5 space-y-4 no-print">
                <div className="relative mx-auto w-20 h-20">
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    className="absolute inset-0 bg-emerald-500 rounded-full flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </motion.div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }} 
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -inset-3 border-2 border-emerald-500/20 rounded-full"
                  />
                </div>

                <div className="space-y-2">
                  <h2 className={`text-3xl font-extrabold tracking-tight ${textPrimary}`}>Thank You!</h2>
                  <p className={`text-base ${textSub}`}>
                    Your order has been successfully placed. We've sent a confirmation email to <strong className={textPrimary}>{orderDetails?.email}</strong>.
                  </p>
                </div>
              </div>

              {/* Printable Invoice Card */}
              <div id="invoice-bill-print" className={`p-6 sm:p-8 rounded-3xl ${isDarkMode ? "bg-zinc-955/40" : "bg-black/[0.01]"} border ${divider} space-y-6 relative`}>
                
                {/* Watermark for styling */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] select-none overflow-hidden">
                  <span className="text-black dark:text-white text-[8vw] font-black tracking-widest rotate-[320deg]">FLEX THE KICKS</span>
                </div>

                {/* Stamp */}
                <div className={`absolute top-6 right-6 px-4 py-2 border-2 ${
                  orderDetails?.paymentMethod === "COD" 
                    ? "border-amber-500 text-amber-500" 
                    : "border-emerald-500 text-emerald-500"
                } rounded-xl text-xs font-black tracking-widest uppercase rotate-[-8deg] opacity-80 select-none`}>
                  {orderDetails?.paymentMethod === "COD" ? "COD PENDING" : "PAID"}
                </div>

                {/* Store Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 divider">
                  <div>
                    <h1 className="text-2xl font-black tracking-tighter text-black dark:text-white">FLEX THE KICKS</h1>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Official Invoice Statement</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Invoice Number</p>
                    <p className={`text-base font-bold ${textPrimary}`}>#{orderDetails?.id?.slice(-8).toUpperCase()}</p>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  {/* Bill To */}
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Bill To</p>
                    <div>
                      <p className={`font-bold ${textPrimary}`}>{orderDetails?.customerName}</p>
                      <p className={textSub}>{orderDetails?.email}</p>
                      <p className={textSub}>{orderDetails?.phone}</p>
                    </div>
                  </div>

                  {/* Shipment Address */}
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Delivery Details</p>
                    <div className={textSub}>
                      <p>{orderDetails?.lane1}</p>
                      {orderDetails?.lane2 && <p>{orderDetails?.lane2}</p>}
                      {orderDetails?.landmark && <p className="text-xs italic">Landmark: {orderDetails?.landmark}</p>}
                      <p>{orderDetails?.city} - {orderDetails?.zipCode}</p>
                    </div>
                  </div>
                </div>

                {/* Order Date / Payment Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs bg-black/5 dark:bg-white/5 p-4 rounded-2xl border divider">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400 block font-medium">Order Date</span>
                    <strong className={textPrimary}>
                      {orderDetails?.createdAt?.seconds 
                        ? new Date(orderDetails.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400 block font-medium">Payment Mode</span>
                    <strong className={textPrimary}>{orderDetails?.paymentMethod === "COD" ? "Cash on Delivery" : orderDetails?.paymentMethod === "PHONEPE_QR" ? "UPI QR Scan" : "Online Redirect"}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400 block font-medium">Delivery Status</span>
                    <strong className="text-amber-500 font-bold">PENDING SHIPMENT</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400 block font-medium">Transaction ID</span>
                    <strong className={`truncate block max-w-[120px] ${textPrimary}`} title={orderDetails?.transactionId || "N/A"}>
                      {orderDetails?.transactionId || "N/A"}
                    </strong>
                  </div>
                </div>

                {/* Product Table */}
                <div className="space-y-4">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider border-b pb-2 divider">Order Items</p>
                  
                  <div className="space-y-3">
                    {orderDetails?.items?.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 py-1">
                        <div className="w-12 h-12 rounded-xl border border-zinc-800/10 dark:border-white/10 overflow-hidden flex-shrink-0 bg-white/5">
                          <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${textPrimary}`}>{item.productName}</p>
                          <p className={`text-xs ${textMuted}`}>Size: {item.size || 'N/A'} × Qty: {item.quantity}</p>
                        </div>
                        <span className={`text-sm font-bold ${textPrimary}`}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtotals & Grand Total */}
                <div className="border-t pt-4 divider space-y-2 text-sm max-w-xs ml-auto">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Subtotal</span>
                    <span className={`font-bold ${textPrimary}`}>₹{orderDetails?.subtotal?.toLocaleString('en-IN')}</span>
                  </div>
                  {orderDetails?.codCharge > 0 && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">COD Charges</span>
                      <span className={`font-bold ${textPrimary}`}>₹{orderDetails?.codCharge?.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {orderDetails?.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-500">
                      <span>Discount ({orderDetails?.discountPercent}%)</span>
                      <span className="font-bold">-₹{orderDetails?.discountAmount?.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 divider text-base">
                    <span className={`font-extrabold ${textPrimary}`}>Grand Total</span>
                    <span className="font-extrabold text-purple-600 dark:text-purple-400">₹{orderDetails?.total?.toLocaleString('en-IN')}</span>
                  </div>
                </div>

              </div>

              {/* Control Center: download and email (hidden in print) */}
              <div className="space-y-6 no-print">
                {/* Email Section */}
                <div className={`p-5 rounded-3xl border ${divider} bg-black/5 dark:bg-white/[0.02] space-y-4`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${textPrimary}`}>Email Invoice</p>
                      <p className="text-xs text-zinc-500">Send a detailed invoice statement straight to your mail</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type="email"
                        value={targetEmail}
                        disabled={!isEditingEmail && targetEmail !== ""}
                        onChange={(e) => setTargetEmail(e.target.value)}
                        placeholder="Enter email address"
                        className={`w-full pl-4 pr-10 py-3 rounded-2xl border ${inputBorder} ${inputBg} ${textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                      />
                      {targetEmail !== "" && (
                        <button 
                          onClick={() => setIsEditingEmail(!isEditingEmail)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-purple-500 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={emailInvoice}
                      disabled={emailLoading}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-purple-600/15"
                    >
                      {emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Email"}
                    </button>
                  </div>
                </div>

                {/* Primary navigation buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button 
                    onClick={handlePrint}
                    className={`flex-1 py-4 rounded-2xl ${isDarkMode ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-black/90"} font-extrabold flex items-center justify-center gap-2 hover:scale-[1.01] transition-all cursor-pointer shadow-xl`}
                  >
                    <Printer className="w-4 h-4" /> Download PDF Invoice
                  </button>
                  <button 
                    onClick={() => navigate("/orders")}
                    className={`flex-1 py-4 rounded-2xl border ${divider} text-sm font-bold ${textPrimary} flex items-center justify-center gap-2 hover:bg-white/5 transition-all`}
                  >
                    <Package className="w-4 h-4 text-purple-500" /> View All Orders
                  </button>
                </div>

                <button 
                  onClick={() => navigate("/")}
                  className={`w-full py-4 rounded-2xl border border-dashed ${isDarkMode ? "border-zinc-700/50 text-zinc-400 hover:text-white hover:border-white/30" : "border-black/20 text-black/70 hover:bg-black/5"} font-bold flex items-center justify-center gap-2 transition-all cursor-pointer`}
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-500" /> Continue Shopping
                </button>
              </div>

            </div>
          )}

          {status === "failed" && (
            <div className="py-20 text-center space-y-8 no-print">
              <div className="mx-auto w-24 h-24 bg-red-500 rounded-full flex items-center justify-center">
                <XCircle className="w-12 h-12 text-white" />
              </div>

              <div className="space-y-2">
                <h2 className={`text-3xl font-bold tracking-tight ${textPrimary}`}>Payment Verification Failed</h2>
                <p className={textMuted}>Something went wrong while confirming your transaction. Please check your order status in My Orders.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-4">
                <button 
                  onClick={() => navigate("/checkout")}
                  className={`flex-1 py-4 rounded-2xl ${isDarkMode ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-black/90"} font-bold hover:scale-[1.02] transition-transform`}
                >
                  Retry Payment
                </button>
                <button 
                  onClick={() => navigate("/support")}
                  className={`flex-1 py-4 rounded-2xl border ${divider} text-sm font-bold ${textPrimary} hover:bg-white/5 transition-all`}
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
