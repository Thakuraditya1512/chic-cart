import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, AlertCircle, ArrowRight, ShoppingBag, MapPin, CheckCircle2,
  Navigation, Tag, ChevronRight, Plus, Check, X, Phone, Mail, User,
  Home, Truck, Shield, Gift, Clock, Moon, Sun, Package
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, serverTimestamp, query, where,
  getDocs, updateDoc, doc, orderBy
} from "firebase/firestore";
import { toast } from "sonner";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

type Step = "customer" | "address" | "review";

const STEPS: { id: Step; label: string; icon: any }[] = [
  { id: "customer", label: "Contact", icon: User },
  { id: "address", label: "Delivery", icon: MapPin },
  { id: "review", label: "Review", icon: CheckCircle2 },
];

const WHATSAPP_NUMBER = "1234567890";

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: cartItems, clearCart, totalPrice } = useCart();

  const [step, setStep] = useState<Step>("customer");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  const [customerData, setCustomerData] = useState({ fullName: "", email: "", phone: "" });
  const [addressData, setAddressData] = useState({ lane1: "", lane2: "", landmark: "", city: "", zipCode: "", googleMapsLink: "" });
  const [locationData, setLocationData] = useState<{ latitude: number; longitude: number; accuracy: number | null } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "success" | "error">("idle");

  const [couponCode, setCouponCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);

  const [previousAddresses, setPreviousAddresses] = useState<any[]>([]);
  // "saved" = showing saved list, "new" = showing blank form, "selected" = showing selected address
  const [addressMode, setAddressMode] = useState<"saved" | "new" | "selected">("saved");
  const [selectedAddressIdx, setSelectedAddressIdx] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return true; // Default to dark mode for premium feel
  });

  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const bg = isDarkMode ? "bg-black" : "bg-[#f7f6f3]";
  const cardBg = isDarkMode ? "bg-zinc-900/40 backdrop-blur-md border-zinc-800/50" : "bg-white border-black/8 shadow-sm";
  const cardBgAlt = isDarkMode ? "bg-zinc-950/50 border-zinc-800/50" : "bg-black/[0.01] border-black/8";
  const textPrimary = isDarkMode ? "text-white" : "text-[#0f0f0f]";
  const textMuted = isDarkMode ? "text-zinc-500" : "text-black/40";
  const textSub = isDarkMode ? "text-zinc-400" : "text-black/50";
  const divider = isDarkMode ? "border-zinc-800/50" : "border-black/6";
  const inputBg = isDarkMode ? "bg-zinc-950/50" : "bg-white";
  const inputBorder = isDarkMode ? "border-zinc-700" : "border-black/20";

  const codCharge = totalPrice > 1000 ? 0 : 50;
  const discountAmount = Math.round((totalPrice * discount) / 100);
  const finalTotal = Math.max(0, totalPrice + codCharge - discountAmount);

  useEffect(() => {
    if (cartItems.length === 0 && step === "customer") {
      toast.error("Your cart is empty");
      navigate("/");
    }
  }, [cartItems]);

  useEffect(() => {
    if (user?.email) {
      setCustomerData(prev => ({ ...prev, email: user.email || "", fullName: user.displayName || prev.fullName }));
      fetchPreviousAddresses();
    }
  }, [user]);

  const fetchPreviousAddresses = async () => {
    if (!user) { setInitialLoading(false); return; }
    try {
      setInitialLoading(true);
      const q = query(collection(db, "orders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const addresses: any[] = [];
      const seen = new Set();
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.lane1 && data.city) {
          const key = `${data.lane1}-${data.city}-${data.zipCode}`.toLowerCase();
          if (!seen.has(key)) {
            addresses.push({ lane1: data.lane1, lane2: data.lane2 || "", landmark: data.landmark || "", city: data.city, zipCode: data.zipCode, googleMapsLink: data.location?.googleMapsLink || "", location: data.location || null });
            seen.add(key);
          }
        }
      });
      const result = addresses.slice(0, 4);
      setPreviousAddresses(result);
      setAddressMode(result.length > 0 ? "saved" : "new");
    } catch (e) {
      console.error(e);
      setAddressMode("new");
    } finally {
      setInitialLoading(false);
    }
  };

  const selectSavedAddress = (addr: any, idx: number) => {
    setAddressData({ lane1: addr.lane1, lane2: addr.lane2, landmark: addr.landmark, city: addr.city, zipCode: addr.zipCode, googleMapsLink: addr.googleMapsLink });
    if (addr.location) { setLocationData({ latitude: addr.location.latitude, longitude: addr.location.longitude, accuracy: null }); setLocationStatus("success"); }
    else { setLocationData(null); setLocationStatus("idle"); }
    setSelectedAddressIdx(idx);
    setAddressMode("selected");
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      pos => { setLocationData({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }); setLocationStatus("success"); toast.success("Location captured!"); },
      err => { setLocationStatus("error"); toast.error(err.code === 1 ? "Permission denied" : "Could not get location"); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) { toast.error("Enter a coupon code"); return; }
    try {
      setIsValidatingCoupon(true);
      const q = query(collection(db, "coupons"), where("code", "==", couponCode.toUpperCase()), where("isUsed", "==", false));
      const snapshot = await getDocs(q);
      if (snapshot.empty) { toast.error("Invalid or used coupon"); setDiscount(0); setAppliedCouponId(null); return; }
      const couponDoc = snapshot.docs[0]; const couponData = couponDoc.data();
      if (couponData.expiresAt?.toDate() < new Date()) { toast.error("Coupon expired"); return; }
      setDiscount(couponData.discountPercent); setAppliedCouponId(couponDoc.id);
      toast.success(`${couponData.discountPercent}% discount applied!`);
    } catch (e) { toast.error("Failed to validate coupon"); }
    finally { setIsValidatingCoupon(false); }
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!customerData.fullName.trim()) { setError("Full name is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) { setError("Valid email is required"); return; }
    if (customerData.phone.length < 10) { setError("Valid phone number is required"); return; }
    setStep("address");
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!addressData.lane1.trim()) { setError("Address line 1 is required"); return; }
    if (locationStatus === "success") {
      if (!addressData.landmark.trim()) { setError("Landmark required for GPS delivery"); return; }
    } else {
      if (!addressData.city.trim()) { setError("City is required"); return; }
      if (addressData.zipCode.length < 6) { setError("Valid ZIP code required"); return; }
    }
    setStep("review");
  };

  const handlePlaceOrder = async () => {
    try {
      setLoading(true); setError("");
      const orderData = {
        userId: user?.uid || "guest",
        customerName: customerData.fullName, email: customerData.email, phone: customerData.phone,
        lane1: addressData.lane1, lane2: addressData.lane2, landmark: addressData.landmark,
        city: addressData.city, zipCode: addressData.zipCode,
        location: locationData ? { latitude: locationData.latitude, longitude: locationData.longitude, googleMapsLink: addressData.googleMapsLink || `https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}` } : addressData.googleMapsLink ? { latitude: 0, longitude: 0, googleMapsLink: addressData.googleMapsLink } : null,
        items: cartItems.map(item => ({ productId: item.product.id, productName: item.product.name, price: item.product.price, quantity: item.quantity, image: item.product.image, ...(item.product.category && { category: item.product.category }), ...((item as any).size && { size: (item as any).size }) })),
        subtotal: totalPrice, codCharge, discountAmount, discountPercent: discount,
        couponCode: appliedCouponId ? couponCode.toUpperCase() : null,
        total: finalTotal, paymentMethod: "COD", status: "pending", createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "orders"), orderData);
      if (appliedCouponId) await updateDoc(doc(db, "coupons", appliedCouponId), { isUsed: true, usedAt: serverTimestamp(), orderId: docRef.id });
      toast.success("Order placed successfully! 🎉");
      clearCart(); navigate("/orders");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to place order";
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  };

  const handleWhatsAppCheckout = () => {
    let msg = "Hello, I'd like to order:\n\n";
    cartItems.forEach(item => { msg += `• ${item.product.name} × ${item.quantity} — ₹${(item.product.price * item.quantity).toLocaleString('en-IN')}\n`; });
    msg += `\nTotal: ₹${finalTotal.toLocaleString('en-IN')}\n\nPlease confirm.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const currentStepIdx = STEPS.findIndex(s => s.id === step);

  if (initialLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bg}`}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6">
          <div className="relative">
            <motion.div animate={{ rotate: 360, borderRadius: ["40%", "50%", "40%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 border-2 border-emerald-500/20 border-t-emerald-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className={`w-8 h-8 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"} animate-pulse`} />
            </div>
          </div>
          <div className="text-center space-y-1">
            <h2 className={`text-xl font-bold tracking-tighter uppercase ${textPrimary}`}>FLEX THE KICKS</h2>
            <p className={`text-[10px] font-black tracking-[0.3em] uppercase ${textMuted}`}>PREPARING YOUR CHECKOUT...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center p-4`} style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className={`${cardBg} rounded-3xl border shadow-xl p-8 text-center`}>
            <div className={`w-14 h-14 ${isDarkMode ? "bg-white" : "bg-[#0f0f0f]"} rounded-2xl flex items-center justify-center mx-auto mb-5`}>
              <ShoppingBag className={`w-6 h-6 ${isDarkMode ? "text-black" : "text-white"}`} />
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${textPrimary}`}>Sign in required</h2>
            <p className={`text-sm ${textMuted} mb-6`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Please sign in to continue checkout</p>
            <div className="flex gap-3">
              <button onClick={() => navigate("/login")} className={`flex-1 py-3 ${isDarkMode ? "bg-white text-black hover:bg-zinc-200" : "bg-[#0f0f0f] text-white hover:bg-black/80"} rounded-xl text-sm font-semibold transition-all`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Log In</button>
              <button onClick={() => navigate("/signup")} className={`flex-1 py-3 border ${divider} rounded-xl text-sm font-semibold ${textPrimary} hover:${isDarkMode ? "bg-white/5" : "bg-black/5"} transition-all`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Sign Up</button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-500`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Top bar */}
      <div className={`${isDarkMode ? "bg-black/80 border-white/5" : "bg-white/80 border-black/[0.06]"} backdrop-blur-md border-b sticky top-0 z-30 transition-colors`}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className={`flex items-center gap-2 text-sm font-medium ${textMuted} hover:${textPrimary} transition-colors`}>
            <ChevronRight className="w-4 h-4 rotate-180" /> Back to shop
          </button>
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => {
              const done = i < currentStepIdx;
              const active = i === currentStepIdx;
              return (
                <div key={s.id} className="flex items-center gap-1">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${active ? (isDarkMode ? "bg-white text-black" : "bg-[#0f0f0f] text-white") : done ? "bg-emerald-500/10 text-emerald-500" : textMuted}`}>
                    {done ? <Check className="w-3 h-3" /> : <s.icon className="w-3 h-3" />}
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`w-4 h-px ${done ? "bg-emerald-500/40" : (isDarkMode ? "bg-zinc-800" : "bg-black/10")}`} />}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isDarkMode ? "bg-zinc-900 text-zinc-400 border-zinc-800/50" : "bg-gray-100 text-gray-500 border-gray-200"} border`}>
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <div className={`text-sm font-semibold ${textMuted}`}>{cartItems.length} item{cartItems.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">

          {/* ── Left: Steps ── */}
          <div className="space-y-4">
            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── STEP 1: Customer ── */}
            <AnimatePresence mode="wait">
              {step === "customer" && (
                <motion.div key="customer" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
                  <SectionCard label="01" title="Contact Information" subtitle="How should we reach you?" darkMode={isDarkMode}>
                    <form onSubmit={handleCustomerSubmit} className="space-y-4">
                      <FormField icon={<User className="w-4 h-4" />} label="Full Name" darkMode={isDarkMode}>
                        <Input placeholder="" value={customerData.fullName}
                          onChange={e => setCustomerData({ ...customerData, fullName: e.target.value })}
                          className={`checkout-input ${inputBg} ${inputBorder} ${textPrimary}`} />
                      </FormField>
                      <FormField icon={<Mail className="w-4 h-4" />} label="Email Address" darkMode={isDarkMode}>
                        <Input type="email" placeholder="" value={customerData.email}
                          onChange={e => setCustomerData({ ...customerData, email: e.target.value })}
                          className={`checkout-input ${inputBg} ${inputBorder} ${textPrimary}`} disabled />
                        <p className={`text-[11px] ${textMuted} mt-1 ml-1`}>Linked to your account</p>
                      </FormField>
                      <FormField icon={<Phone className="w-4 h-4" />} label="Phone Number" darkMode={isDarkMode}>
                        <Input placeholder="" value={customerData.phone}
                          onChange={e => setCustomerData({ ...customerData, phone: e.target.value })}
                          className={`checkout-input ${inputBg} ${inputBorder} ${textPrimary}`} />
                      </FormField>
                      <CtaButton type="submit" label="Continue to Delivery" darkMode={isDarkMode} />
                    </form>
                  </SectionCard>
                </motion.div>
              )}

              {/* ── STEP 2: Address ── */}
              {step === "address" && (
                <motion.div key="address" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-4">
                  <SectionCard label="02" title="Delivery Address" subtitle="Where should we send your order?" darkMode={isDarkMode}>

                    {/* Saved Addresses Panel */}
                    {previousAddresses.length > 0 && (
                      <div className="mb-6">
                        {/* Mode Toggle */}
                        <div className="flex gap-2 mb-4">
                          <button onClick={() => { setAddressMode("saved"); setSelectedAddressIdx(null); }}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${addressMode !== "new" ? (isDarkMode ? "bg-white text-black border-white" : "bg-[#0f0f0f] text-white border-[#0f0f0f]") : `bg-transparent ${textMuted} ${inputBorder} hover:${isDarkMode ? "border-zinc-700" : "border-black/20"}`}`}>
                            <Home className="w-3.5 h-3.5 inline mr-1.5" />Saved Addresses
                          </button>
                          <button onClick={() => { setAddressMode("new"); setSelectedAddressIdx(null); setAddressData({ lane1: "", lane2: "", landmark: "", city: "", zipCode: "", googleMapsLink: "" }); setLocationData(null); setLocationStatus("idle"); }}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${addressMode === "new" ? (isDarkMode ? "bg-white text-black border-white" : "bg-[#0f0f0f] text-white border-[#0f0f0f]") : `bg-transparent ${textMuted} ${inputBorder} hover:${isDarkMode ? "border-zinc-700" : "border-black/20"}`}`}>
                            <Plus className="w-3.5 h-3.5 inline mr-1.5" />New Address
                          </button>
                        </div>

                        {/* Saved address cards */}
                        <AnimatePresence>
                          {addressMode !== "new" && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-2 mb-4">
                              {previousAddresses.map((addr, idx) => (
                                <motion.button key={idx} type="button" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
                                  onClick={() => selectSavedAddress(addr, idx)}
                                  className={`w-full text-left p-4 rounded-2xl border transition-all group ${selectedAddressIdx === idx ? (isDarkMode ? "border-white bg-white/5" : "border-[#0f0f0f] bg-[#0f0f0f]/[0.03]") : `${inputBorder} ${isDarkMode ? "bg-zinc-950/30" : "bg-white"} hover:${isDarkMode ? "border-zinc-600" : "border-black/20"} hover:shadow-sm`}`}>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <MapPin className={`w-3.5 h-3.5 ${textMuted} flex-shrink-0`} />
                                        <p className={`font-semibold text-sm ${textPrimary} truncate`}>{addr.lane1}</p>
                                      </div>
                                      {addr.lane2 && <p className={`text-xs ${textSub} ml-5`}>{addr.lane2}</p>}
                                      {addr.landmark && <p className={`text-xs ${textMuted} ml-5 italic`}>Near {addr.landmark}</p>}
                                      <p className={`text-xs ${textSub} ml-5 font-medium mt-0.5`}>{addr.city}{addr.zipCode ? ` – ${addr.zipCode}` : ""}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${selectedAddressIdx === idx ? (isDarkMode ? "border-white bg-white" : "border-[#0f0f0f] bg-[#0f0f0f]") : (isDarkMode ? "border-zinc-800" : "border-black/20")}`}>
                                      {selectedAddressIdx === idx && <Check className={`w-2.5 h-2.5 ${isDarkMode ? "text-black" : "text-white"}`} />}
                                    </div>
                                  </div>
                                  {addr.location && (
                                    <div className="flex items-center gap-1.5 mt-2 ml-5 text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">
                                      <Navigation className="w-2.5 h-2.5" /> GPS location saved
                                    </div>
                                  )}
                                </motion.button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Address Form — shown when "new" or no saved addresses */}
                    <AnimatePresence>
                      {(addressMode === "new" || previousAddresses.length === 0) && (
                        <motion.form key="addr-form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} onSubmit={handleAddressSubmit} className="space-y-4">
                          {/* GPS Banner */}
                          <div className={`flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${locationStatus === "success" ? "border-emerald-500/30 bg-emerald-500/5" : `${inputBorder} ${isDarkMode ? "bg-white/5" : "bg-white"}`}`}>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                {locationStatus === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <MapPin className={`w-4 h-4 ${textMuted}`} />}
                                <span className={`text-sm font-semibold ${textPrimary}`}>{locationStatus === "success" ? "GPS location captured" : "Use current location"}</span>
                              </div>
                              <p className={`text-[11px] ${textMuted} ml-6`}>{locationStatus === "success" ? "Precise delivery coordinates saved" : "Faster, more accurate delivery"}</p>
                            </div>
                            <button type="button" onClick={handleGetLocation} disabled={locationStatus === "requesting"}
                              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${locationStatus === "success" ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : (isDarkMode ? "bg-white text-black hover:bg-zinc-200" : "bg-[#0f0f0f] text-white hover:bg-black/80")}`}>
                              {locationStatus === "requesting" ? <Loader2 className="w-3 h-3 animate-spin" /> : locationStatus === "success" ? "Update" : "Capture"}
                            </button>
                          </div>

                          <FormField icon={<Home className="w-4 h-4" />} label={locationStatus === "success" ? "Flat / Door Number *" : "Address Line 1 *"} darkMode={isDarkMode}>
                            <Input placeholder="" value={addressData.lane1}
                              onChange={e => setAddressData({ ...addressData, lane1: e.target.value })} className={`checkout-input ${inputBg} ${inputBorder} ${textPrimary}`} />
                          </FormField>

                          <FormField icon={<MapPin className="w-4 h-4" />} label={`Landmark ${locationStatus === "success" ? "*" : "(optional)"}`} darkMode={isDarkMode}>
                            <Input placeholder="" value={addressData.landmark}
                              onChange={e => setAddressData({ ...addressData, landmark: e.target.value })} className={`checkout-input ${inputBg} ${inputBorder} ${textPrimary}`} />
                          </FormField>

                          {locationStatus !== "success" && (
                            <>
                              <FormField label="Address Line 2 (optional)" darkMode={isDarkMode}>
                                <Input placeholder="" value={addressData.lane2}
                                  onChange={e => setAddressData({ ...addressData, lane2: e.target.value })} className={`checkout-input ${inputBg} ${inputBorder} ${textPrimary}`} />
                              </FormField>
                              <div className="grid grid-cols-2 gap-3">
                                <FormField label="City *" darkMode={isDarkMode}>
                                  <Input placeholder="" value={addressData.city}
                                    onChange={e => setAddressData({ ...addressData, city: e.target.value })} className={`checkout-input ${inputBg} ${inputBorder} ${textPrimary}`} />
                                </FormField>
                                <FormField label="ZIP Code *" darkMode={isDarkMode}>
                                  <Input placeholder="" value={addressData.zipCode}
                                    onChange={e => setAddressData({ ...addressData, zipCode: e.target.value })} className={`checkout-input ${inputBg} ${inputBorder} ${textPrimary}`} />
                                </FormField>
                              </div>
                              <FormField label="Google Maps Link (optional)" darkMode={isDarkMode}>
                                <Input placeholder="" value={addressData.googleMapsLink}
                                  onChange={e => setAddressData({ ...addressData, googleMapsLink: e.target.value })} className={`checkout-input ${inputBg} ${inputBorder} ${textPrimary}`} />
                              </FormField>
                            </>
                          )}

                          <div className="flex gap-3 pt-2">
                            <CtaButton type="submit" label="Continue to Review" darkMode={isDarkMode} />
                            <button type="button" onClick={() => setStep("customer")} className={`px-6 py-3.5 rounded-2xl border ${divider} text-sm font-semibold ${textPrimary} hover:${isDarkMode ? "bg-white/5" : "bg-black/5"} transition-all`}>Back</button>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>

                    {/* Continue button for saved address selection */}
                    {addressMode === "selected" && selectedAddressIdx !== null && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 pt-2">
                        <CtaButton type="button" label="Continue to Review" onClick={() => { setError(""); if (!addressData.lane1) { setError("Please select or enter an address"); return; } setStep("review"); }} darkMode={isDarkMode} />
                        <button type="button" onClick={() => setStep("customer")} className={`px-6 py-3.5 rounded-2xl border ${divider} text-sm font-semibold ${textPrimary} hover:${isDarkMode ? "bg-white/5" : "bg-black/5"} transition-all`}>Back</button>
                      </motion.div>
                    )}

                    {/* If saved mode but nothing selected yet — hint */}
                    {addressMode === "saved" && selectedAddressIdx === null && previousAddresses.length > 0 && (
                      <p className={`text-xs ${textMuted} text-center py-2`}>↑ Select an address above to continue</p>
                    )}
                  </SectionCard>
                </motion.div>
              )}

              {/* ── STEP 3: Review ── */}
              {step === "review" && (
                <motion.div key="review" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
                  <SectionCard label="03" title="Order Review" subtitle="Confirm everything looks right" darkMode={isDarkMode}>
                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                      {/* Contact */}
                      <ReviewBlock title="Contact Details" icon={<User className="w-3.5 h-3.5" />} onEdit={() => setStep("customer")} darkMode={isDarkMode}>
                        <p className={`font-semibold ${textPrimary}`}>{customerData.fullName}</p>
                        <p className={textSub}>{customerData.email}</p>
                        <p className={textSub}>{customerData.phone}</p>
                      </ReviewBlock>
                      {/* Address */}
                      <ReviewBlock title="Delivery Address" icon={<MapPin className="w-3.5 h-3.5" />} onEdit={() => setStep("address")} darkMode={isDarkMode}>
                        <p className={`font-semibold ${textPrimary}`}>{addressData.lane1}</p>
                        {addressData.lane2 && <p className={textSub}>{addressData.lane2}</p>}
                        {addressData.landmark && <p className={`${textMuted} italic text-[11px]`}>Near {addressData.landmark}</p>}
                        {(addressData.city || addressData.zipCode) && <p className={textSub}>{addressData.city}{addressData.city && addressData.zipCode ? ` – ${addressData.zipCode}` : addressData.zipCode}</p>}
                        {locationData && (
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                            <Navigation className="w-2.5 h-2.5" /> GPS attached
                          </div>
                        )}
                      </ReviewBlock>
                    </div>

                    {/* Items */}
                    <div className={`rounded-2xl border ${divider} overflow-hidden mb-6`}>
                      <div className={`${isDarkMode ? "bg-white/5" : "bg-black/[0.02]"} px-4 py-3 border-b ${divider}`}>
                        <p className={`text-[11px] font-bold uppercase tracking-widest ${textMuted}`}>Your Items</p>
                      </div>
                      {cartItems.map((item, i) => (
                        <div key={i} className={`flex items-center gap-4 px-4 py-3 ${i < cartItems.length - 1 ? `border-b ${divider}` : ""}`}>
                          {item.product.image && <img src={item.product.image} alt={item.product.name} className={`w-12 h-12 rounded-xl object-cover flex-shrink-0 border ${divider}`} />}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${textPrimary} truncate`}>{item.product.name}</p>
                            <p className={`text-xs ${textMuted}`}>Qty {item.quantity}{(item as any).size ? ` · Size ${(item as any).size}` : ""}</p>
                          </div>
                          <p className={`text-sm font-bold ${textPrimary} flex-shrink-0`}>₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <CtaButton type="button" label={loading ? "" : "Place Order"} onClick={handlePlaceOrder} disabled={loading}
                        icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined} darkMode={isDarkMode} />
                      <button type="button" onClick={() => setStep("address")} className={`px-6 py-3.5 rounded-2xl border ${divider} text-sm font-semibold ${textPrimary} hover:${isDarkMode ? "bg-white/5" : "bg-black/5"} transition-all`}>Back</button>
                    </div>
                  </SectionCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right: Order Summary ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="sticky top-20">
            <div className={`${cardBg} rounded-3xl border overflow-hidden shadow-sm`}>
              {/* Header */}
              <div className={`px-6 py-5 border-b ${divider} flex items-center justify-between`}>
                <p className={`font-bold ${textPrimary}`}>Order Summary</p>
                <span className={`text-xs ${textMuted} font-medium`}>{cartItems.length} item{cartItems.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Items */}
              <div className={`px-6 py-4 space-y-3 border-b ${divider}`}>
                {cartItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {item.product.image && <img src={item.product.image} alt={item.product.name} className={`w-10 h-10 rounded-xl object-cover flex-shrink-0 border ${divider}`} />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${textPrimary} truncate`}>{item.product.name}</p>
                      <p className={`text-[11px] ${textMuted}`}>× {item.quantity}</p>
                    </div>
                    <p className={`text-sm font-semibold ${textPrimary} flex-shrink-0`}>₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className={`px-6 py-4 border-b ${divider}`}>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${textMuted}`} />
                    <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder=""
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border ${inputBorder} ${inputBg} text-sm ${textPrimary} transition-all`} />
                  </div>
                  <button onClick={handleApplyCoupon} disabled={isValidatingCoupon || !couponCode.trim()}
                    className={`px-4 py-2.5 rounded-xl ${isDarkMode ? "bg-white text-black hover:bg-zinc-200" : "bg-[#0f0f0f] text-white hover:bg-black/80"} text-xs font-bold disabled:opacity-40 transition-all`}>
                    {isValidatingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}
                  </button>
                </div>
                {discount > 0 && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mt-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-semibold">
                    <Gift className="w-3.5 h-3.5" /> {discount}% discount applied
                    <button onClick={() => { setDiscount(0); setAppliedCouponId(null); setCouponCode(""); }} className="ml-auto text-emerald-500/60 hover:text-emerald-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Totals */}
              <div className={`px-6 py-4 space-y-2.5 border-b ${divider} text-sm`}>
                <div className={`flex justify-between ${textSub}`}>
                  <span>Subtotal</span>
                  <span className={`font-medium ${textPrimary}`}>₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className={`flex justify-between ${textSub}`}>
                  <span>Shipping</span>
                  <span className={`font-medium ${codCharge === 0 ? "text-emerald-500" : textPrimary}`}>
                    {codCharge === 0 ? "Free" : `₹${codCharge}`}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-500 font-medium">
                    <span>Discount ({discount}%)</span>
                    <span>−₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className={`flex justify-between font-bold text-base pt-2 border-t ${divider}`}>
                  <span className={textPrimary}>Total</span>
                  <span className={textPrimary}>₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* WhatsApp */}
              <div className={`px-6 py-4 border-b ${divider}`}>
                <button onClick={handleWhatsAppCheckout}
                  className="w-full py-3 bg-[#25D366] hover:bg-[#22c55e] text-white text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#25D366]/20">
                  <WhatsAppIcon className="w-4 h-4" /> Order via WhatsApp
                </button>
              </div>

              {/* Trust signals */}
              <div className="px-6 py-4 space-y-2.5">
                {[
                  { icon: Shield, text: "Cash on Delivery — pay when delivered" },
                  { icon: Truck, text: "Free shipping on orders above ₹1,000" },
                  { icon: Clock, text: "Real-time order tracking in My Orders" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className={`flex items-center gap-2.5 text-[11px] ${textMuted}`}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Inline styles for form inputs */}
      <style>{`
        .checkout-input {
          transition: all 0.2s;
          border-width: 1px !important;
        }
      `}</style>
    </div>
  );
}

// ── Helper Components ──────────────────────────────────────────────────────

function SectionCard({ label, title, subtitle, children, darkMode }: { label: string; title: string; subtitle: string; children: React.ReactNode; darkMode: boolean }) {
  return (
    <div className={`${darkMode ? "bg-zinc-900/40 backdrop-blur-md border-zinc-700" : "bg-white border-black/15 shadow-sm"} rounded-3xl border transition-colors`}>
      <div className={`px-6 pt-6 pb-5 border-b ${darkMode ? "border-zinc-800/50" : "border-black/10"} flex items-center gap-4`}>
        <div className={`w-9 h-9 ${darkMode ? "bg-white" : "bg-[#0f0f0f]"} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <span className={`${darkMode ? "text-black" : "text-white"} text-xs font-bold`}>{label}</span>
        </div>
        <div>
          <h2 className={`font-bold ${darkMode ? "text-white" : "text-[#0f0f0f]"} text-base`} style={{ fontFamily: "'DM Serif Display', serif" }}>{title}</h2>
          <p className={`text-[11px] ${darkMode ? "text-zinc-500" : "text-black/40"} mt-0.5`}>{subtitle}</p>
        </div>
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  );
}

function FormField({ icon, label, children, darkMode }: { icon?: React.ReactNode; label: string; children: React.ReactNode; darkMode?: boolean }) {
  return (
    <div>
      <label className={`flex items-center gap-1.5 text-xs font-semibold ${darkMode ? "text-zinc-500" : "text-black/50"} uppercase tracking-wider mb-1.5`}>
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

function ReviewBlock({ title, icon, onEdit, children, darkMode }: { title: string; icon: React.ReactNode; onEdit: () => void; children: React.ReactNode; darkMode: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border ${darkMode ? "border-zinc-700 bg-white/5" : "border-black/15 bg-black/[0.01]"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${darkMode ? "text-zinc-500" : "text-black/40"}`}>
          {icon} {title}
        </div>
        <button onClick={onEdit} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-wider underline-offset-4 hover:underline">Edit</button>
      </div>
      <div className="text-sm space-y-0.5">{children}</div>
    </div>
  );
}

function CtaButton({ type = "button", label, onClick, disabled, icon, darkMode }: { type?: "button" | "submit"; label: string; onClick?: () => void; disabled?: boolean; icon?: React.ReactNode; darkMode: boolean }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 ${darkMode ? "bg-white text-black hover:bg-zinc-200" : "bg-[#0f0f0f] text-white hover:bg-black/80"} disabled:opacity-50 text-sm font-semibold rounded-2xl transition-all active:scale-[0.98]`}>
      {icon || <>{label} <ArrowRight className="w-4 h-4" /></>}
    </button>
  );
}