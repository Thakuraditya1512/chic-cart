import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, AlertCircle, ArrowRight, ShoppingBag, MapPin, CheckCircle2,
  Navigation, Tag, ChevronRight, Plus, Check, X, Phone, Mail, User,
  Home, Truck, Shield, Gift, Clock, Moon, Sun, Package, ShieldCheck, Lock, Smartphone
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, serverTimestamp, query, where,
  getDocs, updateDoc, doc, orderBy, getDoc
} from "firebase/firestore";
import { toast } from "sonner";

import PhonePeQR from "@/components/PhonePeQR";
import EmailInvoicePopup from "@/components/EmailInvoicePopup";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const PhonePeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M19.467 2.25H4.533c-1.26 0-2.283 1.023-2.283 2.283v14.934c0 1.26 1.023 2.283 2.283 2.283h14.934c1.26 0 2.283-1.023 2.283-2.283V4.533c0-1.26-1.023-2.283-2.283-2.283zm-3.66 12.355l-2.001 2.001h-3.609l2.001-2.001H15.807zM11.996 5.865c1.879 0 3.402 1.523 3.402 3.402s-1.523 3.402-3.402 3.402-3.402-1.523-3.402-3.402 1.523-3.402 3.402-3.402z"/>
  </svg>
);

const VisaIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M15.82 8.76l-1.46 8.75h2.33l1.46-8.75h-2.33zM22.84 8.76c-.53-.22-1.37-.46-2.4-.46-2.37 0-4.04 1.26-4.05 3.07-.01 1.33 1.19 2.07 2.1 2.51.93.45 1.24.74 1.24 1.15-.01.62-.75.9-1.44.9-1.2 0-1.85-.18-2.82-.6l-.39-.19-.42 2.6c.7.32 1.99.6 3.32.61 2.52 0 4.15-1.25 4.17-3.18.02-1.06-.63-1.87-2.02-2.54-.84-.42-1.36-.71-1.35-1.14 0-.38.42-.77 1.33-.77.75-.02 1.3.16 1.72.34l.2.1.41-2.5zm-11.83 5.4l-.23-1.12c-.4-.95-1.63-2.61-2.85-2.61h-2.23l-.04.18c1.78.45 2.96 1.54 3.45 2.87l2.25 6.2h2.46l3.66-8.75h-2.43l-2.04 3.23zm-7.61-5.4L1.07 17.51h2.46l3.66-8.75h-3.79z" fill="#1A1F71"/>
  </svg>
);

const MastercardIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="12" r="7" fill="#EB001B" fillOpacity="0.8"/>
    <circle cx="15" cy="12" r="7" fill="#F79E1B" fillOpacity="0.8"/>
  </svg>
);

type Step = "customer" | "address" | "review";

const STEPS: { id: Step; label: string; icon: any }[] = [
  { id: "customer", label: "Contact", icon: User },
  { id: "address", label: "Delivery", icon: MapPin },
  { id: "review", label: "Review", icon: CheckCircle2 },
];

const WHATSAPP_NUMBER = "+919398415366";

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
  const [isGiftPackaging, setIsGiftPackaging] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "PHONEPE">("COD");

  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifyingOTP, setVerifyingOTP] = useState(false);

  const [previousAddresses, setPreviousAddresses] = useState<any[]>([]);
  // "saved" = showing saved list, "new" = showing blank form, "selected" = showing selected address
  const [addressMode, setAddressMode] = useState<"saved" | "new" | "selected">("saved");
  const [selectedAddressIdx, setSelectedAddressIdx] = useState<number | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [activeTransactionId, setActiveTransactionId] = useState("");
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  const [completedOrderData, setCompletedOrderData] = useState<any>(null);
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

  const codCharge = paymentMethod === "COD" ? (totalPrice > 1000 ? 0 : 50) : 0;
  const giftPackagingCharge = isGiftPackaging ? 100 : 0;
  const discountAmount = Math.round((totalPrice * discount) / 100);
  const finalTotal = Math.max(0, totalPrice + codCharge + giftPackagingCharge - discountAmount);

  useEffect(() => {
    if (cartItems.length === 0 && step === "customer") {
      toast.error("Your cart is empty");
      navigate("/");
    }
    
    // Check if any items require size but don't have one
    const itemsWithoutSize = cartItems.filter(item => 
      item.product.sizes && item.product.sizes.length > 0 && !item.size
    );
    
    if (itemsWithoutSize.length > 0) {
      toast.error("Please select sizes for all items before checkout");
      navigate("/");
      return;
    }
  }, [cartItems, step, navigate]);

  useEffect(() => {
    if (user?.email) {
      setCustomerData(prev => ({ ...prev, email: user.email || "", fullName: user.displayName || prev.fullName }));
      setIsEmailVerified(true);
      fetchPreviousAddresses();
    }
  }, [user]);

  const fetchPreviousAddresses = async () => {
    if (!user) { setInitialLoading(false); return; }
    try {
      setInitialLoading(true);
      
      const addresses: any[] = [];
      const seen = new Set();

      // 1. First, check the user's profile for a saved address
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const profileData = userDoc.data();
        if (profileData.address && profileData.address.lane1) {
          const addr = profileData.address;
          const key = `${addr.lane1}-${addr.city}-${addr.zipCode}`.toLowerCase();
          const profileAddr = { ...addr, isProfile: true };
          addresses.push(profileAddr);
          seen.add(key);
          
          // Auto-select and confirm the profile address
          setSelectedAddressIdx(0);
          setAddressMode("selected");
          
          // Auto-fill customer data if available in profile
          setCustomerData(prev => ({
            ...prev,
            fullName: profileData.fullName || prev.fullName,
            phone: profileData.phone || prev.phone
          }));
        }
      }

      // 2. Then fetch addresses from previous orders
      const q = query(collection(db, "orders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
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
      const result = addresses.slice(0, 5);
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
      
      const couponDoc = snapshot.docs[0]; 
      const couponData = couponDoc.data();
      
      // Ensure users cannot steal coupons assigned to other users
      if (couponData.userId && couponData.userId !== user?.uid) {
        toast.error("This coupon is strictly assigned to another account.");
        setDiscount(0); setAppliedCouponId(null); return;
      }
      
      if (couponData.expiresAt?.toDate() < new Date()) { toast.error("Coupon expired"); return; }
      
      setDiscount(couponData.discountPercent); 
      setAppliedCouponId(couponDoc.id);
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
      const transactionId = `FLEX${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const orderData = {
        userId: user?.uid || "guest",
        customerName: customerData.fullName, email: customerData.email, phone: customerData.phone,
        lane1: addressData.lane1, lane2: addressData.lane2, landmark: addressData.landmark,
        city: addressData.city, zipCode: addressData.zipCode,
        location: locationData ? { latitude: locationData.latitude, longitude: locationData.longitude, googleMapsLink: addressData.googleMapsLink || `https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}` } : addressData.googleMapsLink ? { latitude: 0, longitude: 0, googleMapsLink: addressData.googleMapsLink } : null,
        items: cartItems.map(item => ({ productId: item.product.id, productName: item.product.name, price: item.product.price, quantity: item.quantity, image: item.product.image, ...(item.product.category && { category: item.product.category }), ...((item as any).size && { size: (item as any).size }) })),
        subtotal: totalPrice, codCharge, giftPackagingCharge, discountAmount, discountPercent: discount,
        couponCode: appliedCouponId ? couponCode.toUpperCase() : null,
        total: finalTotal, paymentMethod, status: paymentMethod === "COD" ? "pending" : "awaiting_payment", 
        transactionId: (paymentMethod === "PHONEPE" || paymentMethod === ("PHONEPE_QR" as any)) ? transactionId : null,
        createdAt: serverTimestamp(),
      };

      if (paymentMethod === ("PHONEPE_QR" as any)) {
        setActiveTransactionId(transactionId);
        setShowQR(true);
        setLoading(false);
        return;
      }

      // If PhonePe, call backend first
      if (paymentMethod === "PHONEPE") {
        const response = await fetch('/api/phonepe/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: finalTotal,
            transactionId: transactionId,
            userId: user?.uid || "guest",
            mobileNumber: customerData.phone
          })
        });

        if (!response.ok) {
          const text = await response.text();
          let errorMsg = 'Failed to initiate payment';
          try { const errData = JSON.parse(text); errorMsg = errData.error || errorMsg; } catch {}
          throw new Error(errorMsg);
        }

        const text = await response.text();
        if (!text) throw new Error('Empty response from payment server');
        const data = JSON.parse(text);

        if (data.success && data.url) {
          // Save order data to local storage to recover if needed
          localStorage.setItem('pending_order', JSON.stringify({ ...orderData, transactionId }));
          // Also save to Firebase as "awaiting_payment"
          await addDoc(collection(db, "orders"), orderData);
          window.location.href = data.url;
          return;
        } else {
          throw new Error(data.error || "Failed to initiate payment");
        }
      }

      // For COD
      const docRef = await addDoc(collection(db, "orders"), orderData);

      // Send confirmation email
      await sendOrderEmail(orderData);

      // Send invoice email
      await sendInvoiceEmail(orderData);

      // Save/Update address and contact info in user's permanent profile
      if (user?.uid) {
        try {
          await updateDoc(doc(db, "users", user.uid), {
            fullName: customerData.fullName,
            phone: customerData.phone,
            address: {
              lane1: addressData.lane1,
              lane2: addressData.lane2,
              landmark: addressData.landmark,
              city: addressData.city,
              zipCode: addressData.zipCode,
              googleMapsLink: addressData.googleMapsLink,
              location: locationData ? { latitude: locationData.latitude, longitude: locationData.longitude } : null
            },
            updatedAt: serverTimestamp()
          });
        } catch (profileErr) {
          console.error("Failed to update user profile address:", profileErr);
        }
      }

      if (appliedCouponId) await updateDoc(doc(db, "coupons", appliedCouponId), { isUsed: true, usedAt: serverTimestamp(), orderId: docRef.id });
      toast.success("Order placed successfully! 🎉");
      clearCart(); 
      
      // Store order data for invoice email
      setCompletedOrderData(orderData);
      // Show email popup for invoice
      setShowEmailPopup(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to place order";
      setError(msg); toast.error(msg);
    } finally { if (paymentMethod !== ("PHONEPE_QR" as any)) setLoading(false); }
  };

  const sendOrderEmail = async (orderDetails: any) => {
    try {
      await fetch("https://flexthekicks-newsletter.onrender.com/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: orderDetails.email,
          action: "send-order-confirmation",
          orderDetails
        })
      });
    } catch (err) {
      console.error("Failed to send order confirmation email", err);
    }
  };

  const sendInvoiceEmail = async (orderDetails: any) => {
    try {
      await fetch("https://flexthekicks-newsletter.onrender.com/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: orderDetails.email,
          action: "send-invoice",
          orderDetails
        })
      });
    } catch (err) {
      console.error("Failed to send invoice email", err);
    }
  };

  const handleInvoiceEmail = async (email: string) => {
    setIsSendingInvoice(true);
    try {
      // Update order data with the provided email
      const orderDataWithEmail = { ...completedOrderData, email };
      
      // Send invoice email
      await sendInvoiceEmail(orderDataWithEmail);
      
      // Close popup and navigate to orders
      setShowEmailPopup(false);
      navigate("/orders");
    } catch (error) {
      console.error("Failed to send invoice:", error);
    } finally {
      setIsSendingInvoice(false);
    }
  };

  const handleQRSuccess = async (data: any) => {
    try {
      setLoading(true);
      const transactionId = activeTransactionId;
      const orderData = {
        userId: user?.uid || "guest",
        customerName: customerData.fullName, email: customerData.email, phone: customerData.phone,
        lane1: addressData.lane1, lane2: addressData.lane2, landmark: addressData.landmark,
        city: addressData.city, zipCode: addressData.zipCode,
        location: locationData ? { latitude: locationData.latitude, longitude: locationData.longitude, googleMapsLink: addressData.googleMapsLink || `https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}` } : addressData.googleMapsLink ? { latitude: 0, longitude: 0, googleMapsLink: addressData.googleMapsLink } : null,
        items: cartItems.map(item => ({ productId: item.product.id, productName: item.product.name, price: item.product.price, quantity: item.quantity, image: item.product.image, size: (item as any).size })),
        subtotal: totalPrice, codCharge: 0, giftPackagingCharge, discountAmount, discountPercent: discount,
        total: finalTotal, paymentMethod: "PHONEPE_QR", status: "paid", transactionId,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      if (appliedCouponId) await updateDoc(doc(db, "coupons", appliedCouponId), { isUsed: true, usedAt: serverTimestamp(), orderId: docRef.id });
      
      // Send confirmation email
      await sendOrderEmail(orderData);

      clearCart();
      setShowQR(false);
      toast.success("Payment Received! Order placed.");
      
      // Store order data for invoice email
      setCompletedOrderData(orderData);
      // Show email popup for invoice
      setShowEmailPopup(true);
    } catch (err) {
      toast.error("Failed to finalize order after payment");
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async () => {
    if (!customerData.email) return toast.error("Please enter email first");
    try {
      setIsSendingOTP(true);
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: customerData.email, action: "send-otp" })
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        toast.success("Verification code sent to email");
      } else {
        toast.error(data.error || "Failed to send OTP");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsSendingOTP(false);
    }
  };

  const verifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) return toast.error("Enter valid 6-digit code");
    try {
      setVerifyingOTP(true);
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: customerData.email, action: "verify-otp", otp: otpCode })
      });
      const data = await res.json();
      if (data.success) {
        setIsEmailVerified(true);
        setOtpSent(false);
        toast.success("Email verified successfully");
      } else {
        toast.error(data.error || "Invalid code");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setVerifyingOTP(false);
    }
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
              <Package className={`w-6 h-6 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"} animate-pulse`} />
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

      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              <PhonePeQR 
                amount={finalTotal} 
                transactionId={activeTransactionId} 
                userId={user?.uid || "guest_user"} 
                mobileNumber={customerData.phone}
                isDarkMode={isDarkMode}
                onSuccess={handleQRSuccess}
                onCancel={() => setShowQR(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">

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
                      <div className="space-y-4">
                        <FormField icon={<Mail className="w-4 h-4" />} label="Email Address" darkMode={isDarkMode}>
                          <div className="relative group">
                            <Input 
                              type="email" 
                              placeholder="" 
                              value={customerData.email}
                              disabled={isEmailVerified}
                              onChange={e => setCustomerData({ ...customerData, email: e.target.value })}
                              className={`checkout-input ${inputBg} ${inputBorder} ${textPrimary} ${isEmailVerified ? "pr-24" : ""}`} 
                            />
                            {customerData.email && !isEmailVerified && !otpSent && (
                              <button 
                                type="button"
                                onClick={sendOTP}
                                disabled={isSendingOTP}
                                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-purple-500 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-purple-600 transition-all disabled:opacity-50"
                              >
                                {isSendingOTP ? "Sending..." : "Verify"}
                              </button>
                            )}
                            {isEmailVerified && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                                <CheckCircle2 className="w-3 h-3" />
                                <span className="text-[9px] font-bold uppercase">Verified</span>
                              </div>
                            )}
                          </div>
                          {!isEmailVerified && <p className={`text-[11px] ${textMuted} mt-1 ml-1`}>Verify your email to continue</p>}
                        </FormField>

                        {otpSent && !isEmailVerified && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 pt-2">
                            <div className="relative">
                              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${textMuted}`} />
                              <input
                                type="text"
                                placeholder="6-digit code"
                                maxLength={6}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                className={`w-full pl-11 pr-4 py-3 rounded-xl border ${inputBorder} ${inputBg} ${textPrimary} text-lg font-mono tracking-widest outline-none focus:ring-2 focus:ring-purple-500/20`}
                              />
                            </div>
                            <button 
                              type="button"
                              onClick={verifyOTP}
                              disabled={verifyingOTP || otpCode.length !== 6}
                              className="w-full py-3 bg-purple-500 text-white text-xs font-bold uppercase rounded-xl hover:bg-purple-600 transition-all disabled:opacity-50"
                            >
                              {verifyingOTP ? "Verifying..." : "Confirm Verification Code"}
                            </button>
                          </motion.div>
                        )}
                      </div>
                      <FormField icon={<Phone className="w-4 h-4" />} label="Phone Number" darkMode={isDarkMode}>
                        <Input placeholder="" value={customerData.phone}
                          onChange={e => setCustomerData({ ...customerData, phone: e.target.value })}
                          className={`checkout-input ${inputBg} ${inputBorder} ${textPrimary}`} />
                      </FormField>
                      <CtaButton 
                        type="submit" 
                        label={isEmailVerified ? "Continue to Delivery" : "Verify Email to Continue"} 
                        disabled={!isEmailVerified}
                        darkMode={isDarkMode} 
                      />
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
                                  className={`w-full text-left p-4 rounded-2xl border transition-all group ${
                                    selectedAddressIdx === idx 
                                      ? (isDarkMode ? "border-white bg-white/5" : "border-[#0f0f0f] bg-[#0f0f0f]/[0.03]") 
                                      : `${inputBorder} ${isDarkMode ? "bg-zinc-950/30" : "bg-white"} hover:${isDarkMode ? "border-zinc-600" : "border-black/20"} hover:shadow-sm`
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <MapPin className={`w-3.5 h-3.5 ${textMuted} flex-shrink-0`} />
                                        <p className={`font-semibold text-sm ${textPrimary} truncate`}>{addr.lane1}</p>
                                      </div>
                                      {addr.lane2 && <p className={`text-xs ${textSub} ml-5`}>{addr.lane2}</p>}
                                      {addr.landmark && <p className={`text-xs ${textMuted} ml-5 italic`}>Near {addr.landmark}</p>}
                                      <p className={`text-xs ${textSub} ml-5 font-medium mt-0.5`}>{addr.city}{addr.zipCode ? ` – ${addr.zipCode}` : ""}</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                      <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all ${
                                        selectedAddressIdx === idx 
                                          ? (isDarkMode ? "border-white bg-white" : "border-[#0f0f0f] bg-[#0f0f0f]") 
                                          : (isDarkMode ? "border-zinc-800" : "border-black/20")
                                      }`}>
                                        {selectedAddressIdx === idx && <Check className={`w-3 h-3 ${isDarkMode ? "text-black" : "text-white"}`} />}
                                      </div>
                                      {addr.location && (
                                        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">
                                          <Navigation className="w-2.5 h-2.5" /> GPS Saved
                                        </div>
                                      )}
                                      {addr.isProfile && !addr.location && (
                                        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold text-blue-500 uppercase tracking-wider">
                                          <CheckCircle2 className="w-2.5 h-2.5" /> Profile
                                        </div>
                                      )}
                                    </div>
                                  </div>
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

                    {/* Payment Method Selection */}
                    <div className="mb-6 space-y-3">
                      <p className={`text-[11px] font-bold uppercase tracking-widest ${textMuted} mb-2`}>Select Payment Method</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button 
                          onClick={() => setPaymentMethod("COD")}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${paymentMethod === "COD" ? (isDarkMode ? "border-white bg-white/5" : "border-[#0f0f0f] bg-black/[0.02]") : `${inputBorder} ${isDarkMode ? "bg-zinc-950/30" : "bg-white"}`}`}
                        >
                          <div className="flex items-center gap-3">
                            <Truck className={`w-5 h-5 ${paymentMethod === "COD" ? (isDarkMode ? "text-white" : "text-black") : textMuted}`} />
                            <div className="text-left">
                              <p className={`text-sm font-bold ${paymentMethod === "COD" ? textPrimary : textSub}`}>Cash on Delivery</p>
                              <p className={`text-[10px] ${textMuted}`}>Pay when you receive</p>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "COD" ? (isDarkMode ? "border-white bg-white" : "border-[#0f0f0f] bg-[#0f0f0f]") : (isDarkMode ? "border-zinc-800" : "border-black/10")}`}>
                            {paymentMethod === "COD" && <Check className={`w-3 h-3 ${isDarkMode ? "text-black" : "text-white"}`} />}
                          </div>
                        </button>
                        
                        <button 
                          onClick={() => setPaymentMethod("PHONEPE")}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${paymentMethod === "PHONEPE" ? (isDarkMode ? "border-white bg-white/5" : "border-[#0f0f0f] bg-black/[0.02]") : `${inputBorder} ${isDarkMode ? "bg-zinc-950/30" : "bg-white"}`}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${paymentMethod === "PHONEPE" ? "bg-purple-500/20" : "bg-black/5"}`}>
                              <PhonePeIcon className={`w-6 h-6 ${paymentMethod === "PHONEPE" ? "text-purple-600" : textMuted}`} />
                            </div>
                            <div className="text-left">
                              <p className={`text-sm font-bold ${paymentMethod === "PHONEPE" ? textPrimary : textSub}`}>PhonePe Redirect</p>
                              <div className="flex items-center gap-1.5">
                                <VisaIcon className="w-6 h-3 opacity-60" />
                                <MastercardIcon className="w-3 h-3 opacity-60" />
                                <p className={`text-[10px] ${textMuted}`}>Cards/UPI/Wallet</p>
                              </div>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "PHONEPE" ? (isDarkMode ? "border-white bg-white" : "border-[#0f0f0f] bg-[#0f0f0f]") : (isDarkMode ? "border-zinc-800" : "border-black/10")}`}>
                            {paymentMethod === "PHONEPE" && <Check className={`w-3 h-3 ${isDarkMode ? "text-black" : "text-white"}`} />}
                          </div>
                        </button>

                        <button 
                          onClick={() => setPaymentMethod("PHONEPE_QR" as any)}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${paymentMethod === ("PHONEPE_QR" as any) ? (isDarkMode ? "border-white bg-white/5" : "border-[#0f0f0f] bg-black/[0.02]") : `${inputBorder} ${isDarkMode ? "bg-zinc-950/30" : "bg-white"}`}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${paymentMethod === ("PHONEPE_QR" as any) ? "bg-purple-500/20" : "bg-black/5"}`}>
                              <Smartphone className={`w-6 h-6 ${paymentMethod === ("PHONEPE_QR" as any) ? "text-purple-600" : textMuted}`} />
                            </div>
                            <div className="text-left">
                              <p className={`text-sm font-bold ${paymentMethod === ("PHONEPE_QR" as any) ? textPrimary : textSub}`}>Dynamic QR Scan</p>
                              <p className={`text-[10px] ${textMuted}`}>Scan & Pay with any App</p>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === ("PHONEPE_QR" as any) ? (isDarkMode ? "border-white bg-white" : "border-[#0f0f0f] bg-[#0f0f0f]") : (isDarkMode ? "border-zinc-800" : "border-black/10")}`}>
                            {paymentMethod === ("PHONEPE_QR" as any) && <Check className={`w-3 h-3 ${isDarkMode ? "text-black" : "text-white"}`} />}
                          </div>
                        </button>
                      </div>
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
                            <p className={`text-xs ${textMuted}`}>
                              Qty {item.quantity}
                              {item.size && (
                                <span className="ml-2">
                                  Size: <span className="font-bold">{item.size}</span>
                                </span>
                              )}
                            </p>
                          </div>
                          <p className={`text-sm font-bold ${textPrimary} flex-shrink-0`}>₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <CtaButton 
                        type="button" 
                        label={loading ? "" : (paymentMethod === "COD" ? "Place COD Order" : "Pay & Place Order")} 
                        onClick={handlePlaceOrder} 
                        disabled={loading}
                        icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (paymentMethod === "PHONEPE" ? <Shield className="w-4 h-4" /> : undefined)} 
                        darkMode={isDarkMode} 
                      />
                      <button type="button" onClick={() => setStep("address")} className={`px-6 py-3.5 rounded-2xl border ${divider} text-sm font-semibold ${textPrimary} hover:${isDarkMode ? "bg-white/5" : "bg-black/5"} transition-all`}>Back</button>
                    </div>
                  </SectionCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right: Order Summary ── (Shows first on mobile) */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:sticky lg:top-20 order-first lg:order-last mb-6 lg:mb-0">
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
                      <p className={`text-[11px] ${textMuted}`}>
                        × {item.quantity}
                        {item.size && (
                          <span className="ml-2">
                            Size: <span className="font-bold">{item.size}</span>
                          </span>
                        )}
                      </p>
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
                
                {/* Gift Packaging */}
                <div className={`flex justify-between ${textSub}`}>
                  <div className="flex items-center gap-2">
                    <Gift className="w-3.5 h-3.5" />
                    <span>Gift Packaging</span>
                  </div>
                  <span className={`font-medium ${isGiftPackaging ? textPrimary : textSub}`}>
                    {isGiftPackaging ? `₹${giftPackagingCharge}` : "₹0"}
                  </span>
                </div>
                
                <div className={`flex justify-between ${textSub}`}>
                  <button
                    onClick={() => setIsGiftPackaging(!isGiftPackaging)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isGiftPackaging
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : `${inputBorder} ${inputBg} ${textMuted} hover:${textPrimary}`
                    }`}
                  >
                    <Gift className="w-3 h-3" />
                    {isGiftPackaging ? "Remove" : "Add"} Gift Packaging (+₹100)
                  </button>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-500 font-medium">
                    <span>Discount ({discount}%)</span>
                    <span>−₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className={`flex justify-between font-bold text-lg pt-3 border-t ${divider}`}>
                  <span className={textPrimary}>Grand Total</span>
                  <span className={textPrimary}>₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
                {paymentMethod !== "COD" && (
                  <div className="flex items-center justify-center gap-1.5 mt-2 py-1.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Secure Online Payment</span>
                  </div>
                )}
              </div>

              {/* WhatsApp */}
              <div className={`px-6 py-4 border-b ${divider}`}>
                <button onClick={handleWhatsAppCheckout}
                  className="w-full py-3 bg-[#25D366] hover:bg-[#22c55e] text-white text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#25D366]/20">
                  <WhatsAppIcon className="w-3.5 h-3.5" /> Order via WhatsApp
                </button>
              </div>

              {/* Trust signals */}
              <div className="px-6 py-4 space-y-2.5">
                {[
                  { icon: Shield, text: paymentMethod === "COD" ? "Cash on Delivery — pay when delivered" : "Secure Payment via PhonePe" },
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

      {/* Email Invoice Popup */}
      <EmailInvoicePopup
        isOpen={showEmailPopup}
        onClose={() => {
          setShowEmailPopup(false);
          navigate("/orders");
        }}
        onSubmit={handleInvoiceEmail}
        loading={isSendingInvoice}
      />
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
      {icon || <>{label} <ArrowRight className="w-3.5 h-3.5" /></>}
    </button>
  );
}
