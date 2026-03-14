import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Star as StarFilled, X, Plus, Loader2, LogOut, Truck, CheckCircle, Clock, Moon, Sun, Navigation, MapPin, Package, ShoppingBag, Star, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  lane1?: string;
  lane2?: string;
  landmark?: string;
  address?: string;
  city: string;
  zipCode: string;
  location?: {
    latitude: number;
    longitude: number;
    googleMapsLink?: string;
  };
  items: any[];
  subtotal: number;
  codCharge: number;
  total: number;
  status: string;
  createdAt: any;
}

const statusOptions = ["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: "Pending", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30", dot: "bg-amber-400" },
  confirmed: { label: "Confirmed", color: "text-sky-400", bg: "bg-sky-400/10 border-sky-400/30", dot: "bg-sky-400" },
  packed: { label: "Packed", color: "text-indigo-400", bg: "bg-indigo-400/10 border-indigo-400/30", dot: "bg-indigo-400" },
  shipped: { label: "Shipped", color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/30", dot: "bg-violet-400" },
  out_for_delivery: { label: "Out for Delivery", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30", dot: "bg-orange-400" },
  delivered: { label: "Delivered", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30", dot: "bg-emerald-400" },
};

const Orders = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "addresses">("orders");
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  // Review Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewItem, setReviewItem] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<string>>(new Set());

  // Coupon Modal
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [generatedCoupon, setGeneratedCoupon] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("userId", "==", user?.uid));
      const snapshot = await getDocs(q);
      const fetchedOrders = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Order))
        .sort((a, b) => {
          const timeA = a.createdAt?.toDate?.() || new Date(0);
          const timeB = b.createdAt?.toDate?.() || new Date(0);
          return timeB.getTime() - timeA.getTime();
        });
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReviews = async () => {
    try {
      const q = query(collection(db, "reviews"), where("userId", "==", user?.uid));
      const snapshot = await getDocs(q);
      setReviewedProductIds(new Set(snapshot.docs.map(doc => doc.data().productId)));
    } catch (error) {
      console.error("Error fetching user reviews:", error);
    }
  };

  const fetchSavedAddresses = async () => {
    try {
      const q = query(collection(db, "orders"), where("userId", "==", user?.uid), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const addresses: any[] = [];
      const seen = new Set();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.lane1 && data.city) {
          const key = `${data.lane1}-${data.city}-${data.zipCode}`.toLowerCase();
          if (!seen.has(key)) {
            addresses.push({ lane1: data.lane1, lane2: data.lane2 || "", landmark: data.landmark || "", city: data.city, zipCode: data.zipCode, location: data.location || null });
            seen.add(key);
          }
        }
      });
      setSavedAddresses(addresses);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  useEffect(() => {
    if (user) { fetchOrders(); fetchUserReviews(); fetchSavedAddresses(); }
  }, [user]);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  const handleOpenReview = (order: Order, item: any) => {
    setReviewOrder(order); setReviewItem(item); setRating(0); setComment("");
    setReviewModalOpen(true);
  };


  const submitReview = async () => {
    if (rating === 0) { toast.error("Please select a rating"); return; }
    if (!comment.trim()) { toast.error("Please add a comment"); return; }
    try {
      setSubmittingReview(true);
      await addDoc(collection(db, "reviews"), {
        productId: reviewItem.productId, productName: reviewItem.productName,
        userId: user?.uid, orderId: reviewOrder?.id,
        customerName: reviewOrder?.customerName || user?.email?.split('@')[0],
        rating, comment, images: [], createdAt: serverTimestamp(),
      });
      const couponCode = `CHIC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await addDoc(collection(db, "coupons"), {
        code: couponCode, discountPercent: 10, userId: user?.uid, isUsed: false,
        createdAt: serverTimestamp(), expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      });
      setReviewedProductIds(prev => new Set([...prev, reviewItem.productId]));
      setGeneratedCoupon(couponCode);
      setReviewModalOpen(false);
      setShowCouponModal(true);
      toast.success("Review submitted! 🎉");
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const copyCoupon = async () => {
    await navigator.clipboard.writeText(generatedCoupon);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  const bg = isDarkMode ? "bg-black" : "bg-[#f8f9fa]";
  const cardBg = isDarkMode ? "bg-zinc-900/40 backdrop-blur-md border-zinc-800/50" : "bg-white border-gray-100 shadow-sm";
  const cardBgAlt = isDarkMode ? "bg-zinc-950/50 border-zinc-800/50" : "bg-gray-50 border-gray-100";
  const textPrimary = isDarkMode ? "text-white" : "text-gray-900";
  const textMuted = isDarkMode ? "text-zinc-500" : "text-gray-400";
  const textSub = isDarkMode ? "text-zinc-400" : "text-gray-600";
  const divider = isDarkMode ? "border-zinc-800/50" : "border-gray-100";

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bg}`}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6">
          <div className="relative">
            <motion.div animate={{ rotate: 360, borderRadius: ["40%", "50%", "40%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 border-2 border-blue-500/20 border-t-blue-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <ShoppingBag className={`w-8 h-8 ${isDarkMode ? "text-blue-400" : "text-blue-600"} animate-pulse`} />
            </div>
          </div>
          <div className="text-center space-y-1">
            <h2 className={`text-xl font-bold tracking-tighter uppercase ${textPrimary}`}>FLEX THE KICKS</h2>
            <p className={`text-[10px] font-black tracking-[0.3em] uppercase ${textMuted}`}>LOADING YOUR KICKS...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-500`} style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      {/* Subtle gradient orb */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
        style={{ background: isDarkMode ? "radial-gradient(ellipse at top, rgba(59,130,246,0.07) 0%, transparent 70%)" : "radial-gradient(ellipse at top, rgba(59,130,246,0.05) 0%, transparent 70%)" }} />

      <div className="max-w-3xl mx-auto px-4 pt-10 pb-24 relative">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex items-start justify-between">
          <div className="space-y-1">
            <h1 className={`text-4xl font-black tracking-tighter ${textPrimary}`}>MY ACCOUNT</h1>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${textMuted}`}>
              {user?.email}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => setIsDarkMode(!isDarkMode)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${cardBg} ${textMuted} hover:${textSub}`}>
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={handleLogout}
              className={`h-9 px-4 rounded-xl flex items-center gap-2 border text-sm font-medium transition-all ${cardBg} ${textSub}`}>
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </motion.div>

        {/* ── Stats Row ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className={`grid grid-cols-3 gap-3 mb-8`}>
          {[
            { label: "Total Orders", value: orders.length, icon: ShoppingBag },
            { label: "Delivered", value: orders.filter(o => o.status === "delivered").length, icon: CheckCircle },
            { label: "In Transit", value: orders.filter(o => !["delivered", "pending"].includes(o.status)).length, icon: Truck },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className={`rounded-2xl border p-4 ${cardBg}`}>
              <Icon className={`w-4 h-4 mb-3 ${textMuted}`} />
              <p className={`text-2xl font-bold ${textPrimary}`}>{value}</p>
              <p className={`text-[11px] mt-0.5 ${textMuted}`}>{label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Tabs ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className={`flex gap-1 p-1 rounded-2xl border mb-8 ${cardBg}`}>
          {(["orders", "addresses"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-200 ${activeTab === tab
                  ? isDarkMode ? "bg-white text-black shadow-sm" : "bg-black text-white shadow-sm"
                  : `${textMuted} hover:${textSub}`
                }`}>
              {tab === "orders" ? `Orders (${orders.length})` : "Saved Addresses"}
            </button>
          ))}
        </motion.div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === "addresses" ? (
            <motion.div key="addresses" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {savedAddresses.length === 0 ? (
                <EmptyState icon={MapPin} title="No saved addresses" subtitle="Addresses from your orders appear here" darkMode={isDarkMode} />
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {savedAddresses.map((addr, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.06 }}
                      className={`rounded-2xl border p-5 ${cardBg}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${isDarkMode ? "bg-white/5 text-white/40" : "bg-black/5 text-black/40"}`}>
                          Address {idx + 1}
                        </div>
                        <MapPin className={`w-4 h-4 mt-0.5 ${textMuted}`} />
                      </div>
                      <p className={`font-semibold mb-1 ${textPrimary}`}>{addr.lane1}</p>
                      {addr.lane2 && <p className={`text-sm ${textSub}`}>{addr.lane2}</p>}
                      {addr.landmark && <p className={`text-sm italic ${textMuted}`}>Near {addr.landmark}</p>}
                      <p className={`text-sm font-medium mt-1 ${textSub}`}>{addr.city} – {addr.zipCode}</p>
                      {addr.location?.googleMapsLink && (
                        <a href={addr.location.googleMapsLink} target="_blank" rel="noopener noreferrer"
                          className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black tracking-widest uppercase transition-all shadow-lg shadow-blue-500/20">
                          <Navigation className="w-3.5 h-3.5" /> GET DIRECTIONS
                        </a>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="orders" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
              {orders.length === 0 ? (
                <EmptyState icon={ShoppingBag} title="No orders yet" subtitle="Your order history will appear here" darkMode={isDarkMode}
                  cta={{ label: "Start Shopping", onClick: () => navigate("/") }} />
              ) : (
                orders.map((order, index) => (
                  <OrderCard key={order.id} order={order} index={index} expanded={expandedOrder === order.id}
                    onToggle={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    onReview={handleOpenReview} reviewedProductIds={reviewedProductIds}
                    isDarkMode={isDarkMode} cardBg={cardBg} cardBgAlt={cardBgAlt}
                    textPrimary={textPrimary} textMuted={textMuted} textSub={textSub} divider={divider} />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Footer CTA ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-12 text-center">
          <button onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-95">
            <ShoppingBag className="w-4 h-4" /> Continue Shopping
          </button>
        </motion.div>
      </div>

      {/* ── Review Modal ── */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className={`max-w-md rounded-3xl border p-0 overflow-hidden shadow-2xl ${isDarkMode ? "bg-[#111118] border-white/10 text-white" : "bg-white border-black/10 text-[#0a0a0f]"}`}>
          <div className={`px-7 pt-7 pb-5 border-b ${isDarkMode ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
            <p className={`text-[11px] font-semibold uppercase tracking-widest mb-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Review</p>
            <h2 className="text-xl font-bold">{reviewItem?.productName}</h2>
          </div>

          <div className="px-7 py-6 space-y-6">
            {/* Star Rating */}
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-widest mb-3 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Your Rating</p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110 active:scale-95">
                    <StarFilled className={`w-9 h-9 transition-colors ${star <= (hoverRating || rating) ? "text-amber-400 fill-amber-400" : isDarkMode ? "text-white/10 fill-white/10" : "text-black/10 fill-black/10"}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-widest mb-2 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Your Review</p>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="Tell others what you think…"
                className={`rounded-xl min-h-[100px] text-sm border resize-none focus-visible:ring-1 focus-visible:ring-blue-500 ${isDarkMode ? "bg-white/[0.03] border-white/10 text-white placeholder:text-white/20" : "bg-black/[0.02] border-black/10 placeholder:text-black/30"}`} />
            </div>

            {/* Images section removed as per request */}
          </div>

          <div className={`px-7 py-5 flex gap-3 border-t ${isDarkMode ? "border-white/[0.06] bg-white/[0.02]" : "border-black/[0.06] bg-black/[0.02]"}`}>
            <button onClick={() => setReviewModalOpen(false)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${isDarkMode ? "border-white/10 text-white/50 hover:bg-white/[0.04]" : "border-black/10 text-black/50 hover:bg-black/[0.04]"}`}>
              Cancel
            </button>
            <button onClick={submitReview} disabled={submittingReview}
              className="flex-[2] py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition-all">
              {submittingReview ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Submit Review"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Coupon Modal ── */}
      <Dialog open={showCouponModal} onOpenChange={setShowCouponModal}>
        <DialogContent className={`max-w-sm rounded-3xl border p-0 overflow-hidden shadow-2xl ${isDarkMode ? "bg-[#111118] border-white/10 text-white" : "bg-white border-black/10 text-[#0a0a0f]"}`}>
          <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 p-8 text-center">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Review Submitted!</h2>
            <p className="text-blue-100/70 text-sm">You've earned a reward</p>
          </div>
          <div className="p-7 space-y-6 text-center">
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-widest mb-3 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Your Coupon Code</p>
              <div className={`relative rounded-2xl border-2 border-dashed p-5 ${isDarkMode ? "border-white/10 bg-white/[0.02]" : "border-black/10 bg-black/[0.02]"}`}>
                <p className="text-2xl font-bold tracking-widest text-blue-500 mb-1">{generatedCoupon}</p>
                <p className={`text-[11px] ${isDarkMode ? "text-white/30" : "text-black/30"}`}>10% off your next order · Valid 10 days</p>
                <button onClick={copyCoupon}
                  className={`absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isDarkMode ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"}`}>
                  {copiedCoupon ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className={`w-3.5 h-3.5 ${isDarkMode ? "text-white/40" : "text-black/40"}`} />}
                </button>
              </div>
            </div>
            <button onClick={() => setShowCouponModal(false)}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all active:scale-95">
              Start Shopping
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── OrderCard Component ──────────────────────────────────────────────────────

const OrderCard = ({ order, index, expanded, onToggle, onReview, reviewedProductIds, isDarkMode, cardBg, cardBgAlt, textPrimary, textMuted, textSub, divider }: any) => {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const currentIdx = statusOptions.indexOf(order.status);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}>
      <div className={`rounded-2xl border overflow-hidden transition-all ${cardBg}`}>

        {/* Header row — always visible */}
        <button onClick={onToggle} className="w-full text-left p-5 flex items-center gap-4">
          {/* Status dot */}
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className={`text-[10px] font-bold tracking-widest uppercase ${textMuted}`}>
                #{order.id.slice(0, 10).toUpperCase()}
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
            </div>
            <p className={`text-sm ${textMuted}`}>
              {order.createdAt?.toDate?.()?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) || "—"}
              {" · "}{order.items.length} {order.items.length === 1 ? "item" : "items"}
            </p>
          </div>

          <div className="text-right flex-shrink-0">
            <p className={`text-lg font-bold ${textPrimary}`}>₹{order.total.toLocaleString('en-IN')}</p>
          </div>
          <div className={`ml-1 ${textMuted}`}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* Expanded body */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className={`border-t ${divider}`}>

                {/* Items */}
                <div className="p-5 space-y-3">
                  <p className={`text-[10px] font-semibold uppercase tracking-widest ${textMuted}`}>Items</p>
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className={`flex gap-4 p-4 rounded-xl border ${cardBgAlt}`}>
                      {item.image && (
                        <img src={item.image} alt={item.productName} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2 mb-1">
                          <p className={`font-semibold text-sm truncate ${textPrimary}`}>{item.productName}</p>
                          <p className={`text-sm font-bold flex-shrink-0 text-blue-500`}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="flex gap-2 flex-wrap mb-3">
                          {[`Qty ${item.quantity}`, item.size && `Size ${item.size}`, `₹${item.price.toLocaleString('en-IN')} each`].filter(Boolean).map((tag, i) => (
                            <span key={i} className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${isDarkMode ? "bg-white/[0.05] text-white/40" : "bg-black/[0.05] text-black/40"}`}>{tag}</span>
                          ))}
                        </div>
                        {order.status === "delivered" && (
                          reviewedProductIds.has(item.productId) ? (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400`}>
                              <CheckCircle className="w-3 h-3" /> Reviewed
                            </span>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); onReview(order, item); }}
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all">
                              <Star className="w-3 h-3" /> Write a Review
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Details Grid */}
                <div className={`grid md:grid-cols-2 gap-px border-t ${divider}`}>
                  {/* Payment + Delivery */}
                  <div className={`p-5 space-y-5 border-r ${divider}`}>
                    <div>
                      <p className={`text-[10px] font-semibold uppercase tracking-widest mb-3 ${textMuted}`}>Payment</p>
                      <div className="space-y-2 text-sm">
                        {[
                          { label: "Subtotal", value: `₹${order.subtotal.toLocaleString('en-IN')}` },
                          { label: "Shipping", value: order.codCharge > 0 ? `₹${order.codCharge}` : "Free" },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex justify-between">
                            <span className={textMuted}>{label}</span>
                            <span className={`font-medium ${textSub}`}>{value}</span>
                          </div>
                        ))}
                        <div className={`flex justify-between pt-2 border-t font-bold ${divider}`}>
                          <span className={textSub}>Total</span>
                          <span className={`text-blue-500`}>₹{order.total.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className={`text-[10px] font-semibold uppercase tracking-widest mb-3 ${textMuted}`}>Delivery Address</p>
                      <div className={`text-sm ${textSub} space-y-0.5`}>
                        <p className={`font-semibold ${textPrimary}`}>{order.customerName}</p>
                        {order.lane1 ? (
                          <>
                            <p>{order.lane1}</p>
                            {order.lane2 && <p>{order.lane2}</p>}
                            {order.landmark && <p className={`text-xs ${textMuted}`}>Near {order.landmark}</p>}
                          </>
                        ) : <p>{order.address}</p>}
                        <p>{order.city} – {order.zipCode}</p>
                      </div>
                      {(order.location?.googleMapsLink || order.location?.latitude) && (
                        <a href={order.location.googleMapsLink || `https://www.google.com/maps?q=${order.location.latitude},${order.location.longitude}`}
                          target="_blank" rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-500 hover:text-blue-400 transition-colors">
                          <Navigation className="w-3 h-3" /> View on Maps
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Order Journey */}
                  <div className="p-5">
                    <p className={`text-[10px] font-semibold uppercase tracking-widest mb-4 ${textMuted}`}>Order Journey</p>
                    <div className="space-y-0">
                      {statusOptions.map((step, sIdx) => {
                        const done = sIdx <= currentIdx;
                        const active = sIdx === currentIdx;
                        return (
                          <div key={step} className="flex items-start gap-3">
                            <div className="flex flex-col items-center w-5">
                              <div className={`w-2 h-2 rounded-full mt-0.5 flex-shrink-0 transition-all ${active ? "bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.2)]" : done ? "bg-blue-500" : isDarkMode ? "bg-white/10" : "bg-black/10"}`} />
                              {sIdx < statusOptions.length - 1 && (
                                <div className={`w-px flex-1 my-1 h-5 ${sIdx < currentIdx ? "bg-blue-500/40" : isDarkMode ? "bg-white/[0.07]" : "bg-black/[0.07]"}`} />
                              )}
                            </div>
                            <p className={`text-xs pb-4 font-medium capitalize ${active ? "text-blue-500" : done ? textSub : textMuted}`}>
                              {step.replace(/_/g, " ")}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ── EmptyState Component ─────────────────────────────────────────────────────

const EmptyState = ({ icon: Icon, title, subtitle, darkMode, cta }: any) => (
  <div className={`rounded-2xl border p-12 text-center ${darkMode ? "bg-[#111118] border-white/[0.06]" : "bg-white border-black/[0.06]"}`}>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${darkMode ? "bg-white/[0.04]" : "bg-black/[0.04]"}`}>
      <Icon className={`w-5 h-5 ${darkMode ? "text-white/20" : "text-black/20"}`} />
    </div>
    <p className={`font-semibold mb-1 ${darkMode ? "text-white" : "text-[#0a0a0f]"}`}>{title}</p>
    <p className={`text-sm mb-5 ${darkMode ? "text-white/30" : "text-black/30"}`}>{subtitle}</p>
    {cta && (
      <button onClick={cta.onClick} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all">
        {cta.label}
      </button>
    )}
  </div>
);

export default Orders;