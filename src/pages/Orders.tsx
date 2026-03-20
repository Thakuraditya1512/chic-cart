import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Star as StarFilled, X, Plus, Loader2, LogOut, Truck, CheckCircle,
  Clock, Moon, Sun, Navigation, MapPin, Package, ShoppingBag, Star,
  ChevronDown, ChevronUp, Copy, Check, ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import {
  collection, query, where, getDocs, addDoc, serverTimestamp, orderBy,
} from "firebase/firestore";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
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
  location?: { latitude: number; longitude: number; googleMapsLink?: string };
  items: any[];
  subtotal: number;
  codCharge: number;
  total: number;
  status: string;
  createdAt: any;
}

const statusOptions = ["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:          { label: "Pending",          color: "text-amber-400",  bg: "bg-amber-400/10 border-amber-400/30",  dot: "bg-amber-400"  },
  confirmed:        { label: "Confirmed",         color: "text-sky-400",    bg: "bg-sky-400/10 border-sky-400/30",      dot: "bg-sky-400"    },
  packed:           { label: "Packed",            color: "text-indigo-400", bg: "bg-indigo-400/10 border-indigo-400/30",dot: "bg-indigo-400" },
  shipped:          { label: "Shipped",           color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/30",dot: "bg-violet-400" },
  out_for_delivery: { label: "Out for Delivery",  color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30",dot: "bg-orange-400" },
  delivered:        { label: "Delivered",         color: "text-emerald-400",bg: "bg-emerald-400/10 border-emerald-400/30",dot:"bg-emerald-400"},
};

/* ─── theme helpers ─── */
const th = (dark: boolean) => ({
  bg:          dark ? "bg-black"                                          : "bg-[#f5f5f7]",
  card:        dark ? "bg-zinc-900/50 backdrop-blur-md border-zinc-800/60" : "bg-white border-gray-100 shadow-sm",
  cardAlt:     dark ? "bg-zinc-950/60 border-zinc-800/50"                 : "bg-gray-50 border-gray-100",
  textPrimary: dark ? "text-white"                                         : "text-gray-900",
  textMuted:   dark ? "text-zinc-500"                                      : "text-gray-400",
  textSub:     dark ? "text-zinc-400"                                      : "text-gray-600",
  divider:     dark ? "border-zinc-800/50"                                 : "border-gray-100",
  tag:         dark ? "bg-white/[0.05] text-white/40"                      : "bg-black/[0.05] text-black/40",
});

/* ════════════════════════════════════════════════════════════════════════════
   ORDERS PAGE
════════════════════════════════════════════════════════════════════════════ */
const Orders = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isDark, setIsDark]         = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("theme") !== "light" : true
  );
  const [activeTab, setActiveTab]   = useState<"orders" | "addresses">("orders");
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [copiedCoupon, setCopiedCoupon]     = useState(false);

  /* review state */
  const [reviewModalOpen, setReviewModalOpen]   = useState(false);
  const [reviewOrder, setReviewOrder]           = useState<Order | null>(null);
  const [reviewItem, setReviewItem]             = useState<any>(null);
  const [rating, setRating]                     = useState(0);
  const [hoverRating, setHoverRating]           = useState(0);
  const [comment, setComment]                   = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedIds, setReviewedIds]           = useState<Set<string>>(new Set());

  /* coupon state */
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode]           = useState("");

  const t = th(isDark);

  /* ── theme sync ── */
  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  /* ── data fetching ── */
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(query(collection(db, "orders"), where("userId", "==", user?.uid)));
      setOrders(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Order))
          .sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0))
      );
    } catch { toast.error("Failed to load orders"); }
    finally { setLoading(false); }
  };

  const fetchReviews = async () => {
    const snap = await getDocs(query(collection(db, "reviews"), where("userId", "==", user?.uid)));
    setReviewedIds(new Set(snap.docs.map(d => d.data().productId)));
  };

  const fetchAddresses = async () => {
    const snap = await getDocs(
      query(collection(db, "orders"), where("userId", "==", user?.uid), orderBy("createdAt", "desc"))
    );
    const seen = new Set<string>();
    const addrs: any[] = [];
    snap.docs.forEach(d => {
      const data = d.data();
      if (data.lane1 && data.city) {
        const key = `${data.lane1}-${data.city}-${data.zipCode}`.toLowerCase();
        if (!seen.has(key)) {
          addrs.push({ lane1: data.lane1, lane2: data.lane2 || "", landmark: data.landmark || "",
            city: data.city, zipCode: data.zipCode, location: data.location || null });
          seen.add(key);
        }
      }
    });
    setSavedAddresses(addrs);
  };

  useEffect(() => {
    if (user) { fetchOrders(); fetchReviews(); fetchAddresses(); }
  }, [user]);

  /* ── review submit ── */
  const submitReview = async () => {
    if (!rating)        { toast.error("Please select a rating"); return; }
    if (!comment.trim()){ toast.error("Please add a comment");   return; }
    try {
      setSubmittingReview(true);
      await addDoc(collection(db, "reviews"), {
        productId: reviewItem.productId, productName: reviewItem.productName,
        userId: user?.uid, orderId: reviewOrder?.id,
        customerName: reviewOrder?.customerName || user?.email?.split("@")[0],
        rating, comment, images: [], createdAt: serverTimestamp(),
      });
      const code = `CHIC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await addDoc(collection(db, "coupons"), {
        code, discountPercent: 10, userId: user?.uid, isUsed: false,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      });
      setReviewedIds(prev => new Set([...prev, reviewItem.productId]));
      setCouponCode(code);
      setReviewModalOpen(false);
      setShowCouponModal(true);
      toast.success("Review submitted! 🎉");
    } catch { toast.error("Failed to submit review"); }
    finally { setSubmittingReview(false); }
  };

  const copyCoupon = async () => {
    await navigator.clipboard.writeText(couponCode);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  /* ── loading screen ── */
  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${t.bg}`}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <motion.div
            animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-blue-400 animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <p className={`text-sm font-bold tracking-widest uppercase ${t.textPrimary}`}>FLEX THE KICKS</p>
          <p className={`text-[10px] tracking-[0.25em] uppercase mt-0.5 ${t.textMuted}`}>Loading…</p>
        </div>
      </motion.div>
    </div>
  );

  /* ── main render ── */
  return (
    <div className={`min-h-screen ${t.bg} transition-colors duration-300`}
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

      {/* ambient orb */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none rounded-full"
        style={{ background: "radial-gradient(ellipse at top, rgba(59,130,246,0.06) 0%, transparent 70%)" }} />

      <div className="max-w-2xl mx-auto px-3 sm:px-4 pt-6 pb-20 relative">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between gap-2">

          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/")}
              className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${t.card} ${t.textMuted}`}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div>
              <h1 className={`text-xl font-black tracking-tight leading-none ${t.textPrimary}`}>MY ACCOUNT</h1>
              <p className={`text-[9px] font-semibold tracking-[0.18em] uppercase mt-0.5 truncate max-w-[160px] sm:max-w-none ${t.textMuted}`}>
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => setIsDark(!isDark)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center border ${t.card} ${t.textMuted}`}>
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button onClick={async () => { await logout(); navigate("/login"); }}
              className={`h-8 px-2.5 rounded-xl flex items-center gap-1 border text-[10px] font-bold uppercase tracking-wide ${t.card} ${t.textSub} hover:text-red-400 hover:border-red-400/30`}>
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </motion.div>

        {/* ── Stats Row ── */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: "Orders",     value: orders.length,                                                   icon: ShoppingBag },
            { label: "Delivered",  value: orders.filter(o => o.status === "delivered").length,             icon: CheckCircle },
            { label: "In Transit", value: orders.filter(o => !["delivered","pending"].includes(o.status)).length, icon: Truck },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className={`rounded-xl border p-3 ${t.card}`}>
              <Icon className={`w-3.5 h-3.5 mb-2 ${t.textMuted}`} />
              <p className={`text-xl font-bold leading-none ${t.textPrimary}`}>{value}</p>
              <p className={`text-[9px] mt-1 font-medium ${t.textMuted}`}>{label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Tabs ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
          className={`flex gap-1 p-1 rounded-xl border mb-5 ${t.card}`}>
          {(["orders", "addresses"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === tab
                  ? isDark ? "bg-white text-black shadow-sm" : "bg-black text-white shadow-sm"
                  : `${t.textMuted}`
              }`}>
              {tab === "orders" ? `Orders (${orders.length})` : "Addresses"}
            </button>
          ))}
        </motion.div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === "addresses" ? (
            <motion.div key="addresses"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              {savedAddresses.length === 0
                ? <EmptyState icon={MapPin} title="No saved addresses" subtitle="Addresses from your orders appear here" dark={isDark} />
                : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {savedAddresses.map((addr, i) => (
                      <motion.div key={i} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`rounded-xl border p-4 ${t.card}`}>
                        <div className="flex items-start justify-between mb-3">
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${t.tag}`}>
                            Address {i + 1}
                          </span>
                          <MapPin className={`w-3.5 h-3.5 ${t.textMuted}`} />
                        </div>
                        <p className={`font-semibold text-sm ${t.textPrimary}`}>{addr.lane1}</p>
                        {addr.lane2    && <p className={`text-xs mt-0.5 ${t.textSub}`}>{addr.lane2}</p>}
                        {addr.landmark && <p className={`text-xs italic mt-0.5 ${t.textMuted}`}>Near {addr.landmark}</p>}
                        <p className={`text-xs font-medium mt-1 ${t.textSub}`}>{addr.city} – {addr.zipCode}</p>
                        {addr.location?.googleMapsLink && (
                          <a href={addr.location.googleMapsLink} target="_blank" rel="noopener noreferrer"
                            className="mt-3 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black tracking-widest uppercase transition-all">
                            <Navigation className="w-3 h-3" /> Directions
                          </a>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
            </motion.div>
          ) : (
            <motion.div key="orders"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="space-y-3">
              {orders.length === 0
                ? <EmptyState icon={ShoppingBag} title="No orders yet" subtitle="Your order history will appear here" dark={isDark}
                    cta={{ label: "Start Shopping", onClick: () => navigate("/") }} />
                : orders.map((order, i) => (
                  <OrderCard key={order.id} order={order} index={i}
                    expanded={expandedOrder === order.id}
                    onToggle={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    onReview={(o, item) => { setReviewOrder(o); setReviewItem(item); setRating(0); setComment(""); setReviewModalOpen(true); }}
                    reviewedIds={reviewedIds} dark={isDark} t={t} />
                ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Footer CTA ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="mt-8 text-center">
          <button onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all active:scale-95">
            <ShoppingBag className="w-4 h-4" /> Continue Shopping
          </button>
        </motion.div>
      </div>

      {/* ══ Review Modal ══ */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className={`max-w-sm mx-3 rounded-2xl border p-0 overflow-hidden shadow-2xl
          ${isDark ? "bg-[#111118] border-white/10 text-white" : "bg-white border-black/10 text-[#0a0a0f]"}`}>

          {/* header */}
          <div className={`px-5 pt-5 pb-4 border-b ${isDark ? "border-white/[0.07]" : "border-black/[0.07]"}`}>
            <p className={`text-[9px] font-semibold uppercase tracking-widest mb-0.5 ${isDark ? "text-white/40" : "text-black/40"}`}>Review</p>
            <h2 className="text-base font-bold leading-tight">{reviewItem?.productName}</h2>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* stars */}
            <div>
              <p className={`text-[9px] font-semibold uppercase tracking-widest mb-2 ${isDark ? "text-white/40" : "text-black/40"}`}>Rating</p>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setRating(s)}
                    onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110 active:scale-95">
                    <StarFilled className={`w-7 h-7 transition-colors ${
                      s <= (hoverRating || rating)
                        ? "text-amber-400 fill-amber-400"
                        : isDark ? "text-white/10 fill-white/10" : "text-black/10 fill-black/10"
                    }`} />
                  </button>
                ))}
              </div>
            </div>
            {/* comment */}
            <div>
              <p className={`text-[9px] font-semibold uppercase tracking-widest mb-2 ${isDark ? "text-white/40" : "text-black/40"}`}>Your Review</p>
              <Textarea value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Tell others what you think…"
                className={`rounded-xl min-h-[90px] text-sm border resize-none focus-visible:ring-1 focus-visible:ring-blue-500
                  ${isDark ? "bg-white/[0.03] border-white/10 text-white placeholder:text-white/20"
                           : "bg-black/[0.02] border-black/10 placeholder:text-black/30"}`} />
            </div>
          </div>

          <div className={`px-5 py-4 flex gap-2 border-t ${isDark ? "border-white/[0.07] bg-white/[0.02]" : "border-black/[0.07] bg-black/[0.02]"}`}>
            <button onClick={() => setReviewModalOpen(false)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all
                ${isDark ? "border-white/10 text-white/50 hover:bg-white/[0.04]" : "border-black/10 text-black/50"}`}>
              Cancel
            </button>
            <button onClick={submitReview} disabled={submittingReview}
              className="flex-[2] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition-all">
              {submittingReview ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Submit Review"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ Coupon Modal ══ */}
      <Dialog open={showCouponModal} onOpenChange={setShowCouponModal}>
        <DialogContent className={`max-w-xs mx-3 rounded-2xl border p-0 overflow-hidden shadow-2xl
          ${isDark ? "bg-[#111118] border-white/10 text-white" : "bg-white border-black/10 text-[#0a0a0f]"}`}>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 text-center">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-4.5 h-4.5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Review Submitted!</h2>
            <p className="text-blue-100/70 text-xs mt-0.5">You've earned a reward</p>
          </div>
          <div className="p-5 space-y-4 text-center">
            <div>
              <p className={`text-[9px] font-semibold uppercase tracking-widest mb-2.5 ${isDark ? "text-white/40" : "text-black/40"}`}>Your Coupon</p>
              <div className={`relative rounded-xl border-2 border-dashed p-4
                ${isDark ? "border-white/10 bg-white/[0.02]" : "border-black/10 bg-black/[0.02]"}`}>
                <p className="text-xl font-bold tracking-widest text-blue-500 mb-0.5">{couponCode}</p>
                <p className={`text-[10px] ${isDark ? "text-white/30" : "text-black/30"}`}>10% off · Valid 10 days</p>
                <button onClick={copyCoupon}
                  className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-lg flex items-center justify-center
                    ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"}`}>
                  {copiedCoupon
                    ? <Check className="w-3 h-3 text-emerald-400" />
                    : <Copy className={`w-3 h-3 ${isDark ? "text-white/40" : "text-black/40"}`} />}
                </button>
              </div>
            </div>
            <button onClick={() => setShowCouponModal(false)}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all active:scale-95">
              Start Shopping
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   ORDER CARD
════════════════════════════════════════════════════════════════════════════ */
const OrderCard = ({ order, index, expanded, onToggle, onReview, reviewedIds, dark, t }: any) => {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const currentIdx = statusOptions.indexOf(order.status);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
      <div className={`rounded-xl border overflow-hidden ${t.card}`}>

        {/* ── Collapsed header ── */}
        <button onClick={onToggle} className="w-full text-left p-4 flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span className={`text-[9px] font-bold tracking-wider uppercase ${t.textMuted}`}>
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
              <span className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
            </div>
            <p className={`text-xs ${t.textMuted}`}>
              {order.createdAt?.toDate?.()?.toLocaleDateString("en-GB",
                { day: "2-digit", month: "short", year: "numeric" }) || "—"}
              {" · "}{order.items.length} {order.items.length === 1 ? "item" : "items"}
            </p>
          </div>

          <p className={`text-base font-bold shrink-0 ${t.textPrimary}`}>
            ₹{order.total.toLocaleString("en-IN")}
          </p>
          <div className={`ml-0.5 shrink-0 ${t.textMuted}`}>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {/* ── Expanded body ── */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className={`border-t ${t.divider}`}>

                {/* items */}
                <div className="p-4 space-y-2.5">
                  <p className={`text-[9px] font-bold uppercase tracking-widest ${t.textMuted}`}>Items</p>
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className={`flex gap-3 p-3 rounded-xl border ${t.cardAlt}`}>
                      {item.image && (
                        <img src={item.image} alt={item.productName}
                          className="w-14 h-14 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2 mb-1">
                          <p className={`font-semibold text-xs truncate ${t.textPrimary}`}>{item.productName}</p>
                          <p className="text-xs font-bold text-blue-500 shrink-0">
                            ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="flex gap-1.5 flex-wrap mb-2.5">
                          {[`Qty ${item.quantity}`, item.size && `Size ${item.size}`, `₹${item.price.toLocaleString("en-IN")} ea`]
                            .filter(Boolean).map((tag, ti) => (
                              <span key={ti} className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md ${t.tag}`}>{tag}</span>
                            ))}
                        </div>
                        {order.status === "delivered" && (
                          reviewedIds.has(item.productId)
                            ? <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-400">
                                <CheckCircle className="w-3 h-3" /> Reviewed
                              </span>
                            : <button onClick={e => { e.stopPropagation(); onReview(order, item); }}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all">
                                <Star className="w-3 h-3" /> Review
                              </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* details */}
                <div className={`border-t ${t.divider}`}>
                  {/* payment */}
                  <div className={`p-4 border-b ${t.divider}`}>
                    <p className={`text-[9px] font-bold uppercase tracking-widest mb-2.5 ${t.textMuted}`}>Payment</p>
                    <div className="space-y-1.5 text-xs">
                      {[
                        { label: "Subtotal",  val: `₹${order.subtotal.toLocaleString("en-IN")}` },
                        { label: "Shipping",  val: order.codCharge > 0 ? `₹${order.codCharge}` : "Free" },
                      ].map(({ label, val }) => (
                        <div key={label} className="flex justify-between">
                          <span className={t.textMuted}>{label}</span>
                          <span className={`font-medium ${t.textSub}`}>{val}</span>
                        </div>
                      ))}
                      <div className={`flex justify-between pt-1.5 border-t font-bold ${t.divider}`}>
                        <span className={t.textSub}>Total</span>
                        <span className="text-blue-500">₹{order.total.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>

                  {/* address */}
                  <div className={`p-4 border-b ${t.divider}`}>
                    <p className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${t.textMuted}`}>Delivery Address</p>
                    <div className={`text-xs ${t.textSub} space-y-0.5`}>
                      <p className={`font-semibold ${t.textPrimary}`}>{order.customerName}</p>
                      {order.lane1 ? (
                        <>
                          <p>{order.lane1}</p>
                          {order.lane2    && <p>{order.lane2}</p>}
                          {order.landmark && <p className={`italic ${t.textMuted}`}>Near {order.landmark}</p>}
                        </>
                      ) : <p>{order.address}</p>}
                      <p>{order.city} – {order.zipCode}</p>
                    </div>
                    {(order.location?.googleMapsLink || order.location?.latitude) && (
                      <a href={order.location.googleMapsLink ||
                          `https://www.google.com/maps?q=${order.location.latitude},${order.location.longitude}`}
                        target="_blank" rel="noopener noreferrer"
                        className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-semibold text-blue-500 hover:text-blue-400">
                        <Navigation className="w-3 h-3" /> View on Maps
                      </a>
                    )}
                  </div>

                  {/* journey */}
                  <div className="p-4">
                    <p className={`text-[9px] font-bold uppercase tracking-widest mb-3 ${t.textMuted}`}>Order Journey</p>
                    <div className="space-y-0">
                      {statusOptions.map((step, si) => {
                        const done   = si <= currentIdx;
                        const active = si === currentIdx;
                        return (
                          <div key={step} className="flex items-start gap-2.5">
                            <div className="flex flex-col items-center w-4">
                              <div className={`w-1.5 h-1.5 rounded-full mt-0.5 shrink-0 ${
                                active ? "bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
                                : done  ? "bg-blue-500"
                                : dark  ? "bg-white/10" : "bg-black/10"
                              }`} />
                              {si < statusOptions.length - 1 && (
                                <div className={`w-px my-1 h-4 ${
                                  si < currentIdx ? "bg-blue-500/40" : dark ? "bg-white/[0.07]" : "bg-black/[0.07]"
                                }`} />
                              )}
                            </div>
                            <p className={`text-[11px] pb-3 font-medium capitalize ${
                              active ? "text-blue-500" : done ? t.textSub : t.textMuted
                            }`}>
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

/* ════════════════════════════════════════════════════════════════════════════
   EMPTY STATE
════════════════════════════════════════════════════════════════════════════ */
const EmptyState = ({ icon: Icon, title, subtitle, dark, cta }: any) => (
  <div className={`rounded-xl border p-10 text-center
    ${dark ? "bg-[#111118] border-white/[0.06]" : "bg-white border-black/[0.06]"}`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3
      ${dark ? "bg-white/[0.04]" : "bg-black/[0.04]"}`}>
      <Icon className={`w-4 h-4 ${dark ? "text-white/20" : "text-black/20"}`} />
    </div>
    <p className={`font-semibold text-sm ${dark ? "text-white" : "text-[#0a0a0f]"}`}>{title}</p>
    <p className={`text-xs mt-1 mb-4 ${dark ? "text-white/30" : "text-black/30"}`}>{subtitle}</p>
    {cta && (
      <button onClick={cta.onClick}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all">
        {cta.label}
      </button>
    )}
  </div>
);

export default Orders;