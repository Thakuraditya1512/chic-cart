import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogOut, Truck, CheckCircle, Clock, Moon, Sun, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star as StarFilled } from "lucide-react";

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

const Orders = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewItem, setReviewItem] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewImages, setReviewImages] = useState<string[]>([""]);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Success/Coupon Modal State
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [generatedCoupon, setGeneratedCoupon] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("userId", "==", user?.uid));
      const snapshot = await getDocs(q);
      const fetchedOrders = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Order))
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

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchOrders();
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleOpenReview = (order: Order, item: any) => {
    setReviewOrder(order);
    setReviewItem(item);
    setRating(0);
    setComment("");
    setReviewImages([""]);
    setReviewModalOpen(true);
  };

  const submitReview = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please add a comment");
      return;
    }

    try {
      setSubmittingReview(true);
      
      // 1. Save Review
      const reviewData = {
        productId: reviewItem.productId,
        productName: reviewItem.productName,
        userId: user?.uid,
        orderId: reviewOrder?.id,
        customerName: reviewOrder?.customerName || user?.email?.split('@')[0],
        rating,
        comment,
        images: reviewImages.filter(img => img.trim() !== ""),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "reviews"), reviewData);

      // 2. Generate Coupon
      const couponCode = `CHIC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const couponData = {
        code: couponCode,
        discountPercent: 10,
        userId: user?.uid,
        isUsed: false,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };

      await addDoc(collection(db, "coupons"), couponData);

      setGeneratedCoupon(couponCode);
      setReviewModalOpen(false);
      setShowCouponModal(true);
      toast.success("Review submitted! Enjoy your 10% coupon!");
      
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "confirmed":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/50";
      case "packed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "shipped":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      case "out_for_delivery":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "delivered":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
      case "out_for_delivery":
        return <Truck className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? "bg-gray-900" : "bg-white"
      }`}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Loading your orders...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-8 md:pt-12 pb-8 md:pb-12 px-4 transition-colors ${
      isDarkMode ? "bg-gray-900" : "bg-gray-50"
    }`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Truck className={`w-6 h-6 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
              <h1 className={`font-display text-3xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}>My Orders</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-all ${
                  isDarkMode
                    ? "bg-gray-800 text-yellow-400 hover:bg-gray-700"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                title="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Button onClick={handleLogout} variant="outline" size="sm"
                className={isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800" : ""}
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          </div>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Track your purchases and deliveries
          </p>
        </motion.div>

        {/* User Info Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className={`p-6 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}>Logged in as</p>
                <p className={`font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>{user?.email}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm mb-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}>Total Orders</p>
                <p className={`text-2xl font-bold ${
                  isDarkMode ? "text-blue-400" : "text-blue-600"
                }`}>{orders.length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className={`p-12 rounded-lg border text-center ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}>
              <Truck className={`w-12 h-12 mx-auto mb-4 opacity-50 ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`} />
              <h3 className={`text-lg font-semibold mb-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}>No Orders Yet</h3>
              <p className={`mb-6 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>You haven't placed any orders yet.</p>
              <Button onClick={() => navigate("/")} size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Shopping
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className={`cursor-pointer rounded-lg border transition-all ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() =>
                    setExpandedOrder(expandedOrder === order.id ? null : order.id)
                  }
                >
                  {/* Order Header */}
                  <div className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 border-b" style={{
                    borderColor: isDarkMode ? "#4b5563" : "#e5e7eb"
                  }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className={`font-display font-bold ${
                          isDarkMode ? "text-blue-400" : "text-blue-600"
                        }`}>Order #{order.id.slice(0, 8)}</h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}>
                        {order.createdAt?.toDate?.()?.toLocaleDateString() || "Date unavailable"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm mb-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}>Order Total</p>
                      <p className={`text-2xl font-bold ${
                        isDarkMode ? "text-blue-400" : "text-blue-600"
                      }`}>₹{order.total.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedOrder === order.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`overflow-hidden ${
                          isDarkMode ? "bg-gray-750" : "bg-gray-50"
                        }`}
                      >
                        <div className="p-4 md:p-6 space-y-4">
                          {/* Items */}
                          <div>
                            <p className={`text-xs font-bold mb-3 ${
                              isDarkMode ? "text-blue-400" : "text-blue-600"
                            }`}>ITEMS ORDERED ({order.items.length})</p>
                            <div className="space-y-3">
                              {order.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className={`flex gap-4 p-3 rounded border transition-colors ${
                                    isDarkMode
                                      ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                                      : "bg-white border-gray-200 hover:border-gray-300"
                                  }`}
                                >
                                  {/* Product Image */}
                                  {item.image && (
                                    <div className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded overflow-hidden ${
                                      isDarkMode ? "bg-gray-700" : "bg-gray-200"
                                    }`}>
                                      <img
                                        src={item.image}
                                        alt={item.productName}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )}
                                  
                                  {/* Product Details */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                      <p className={`font-medium truncate transition-colors ${
                                        isDarkMode ? "text-white hover:text-blue-400" : "text-gray-900 hover:text-blue-600"
                                      }`}>
                                        {item.productName}
                                      </p>
                                      <div className={`text-sm font-semibold shrink-0 ${
                                        isDarkMode ? "text-blue-400" : "text-blue-600"
                                      }`}>
                                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                      </div>
                                    </div>
                                    <p className={`text-xs mb-2 ${
                                      isDarkMode ? "text-gray-400" : "text-gray-600"
                                    }`}>
                                      Quantity: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                                    </p>
                                    {item.size && (
                                      <p className={`text-xs mb-2 capitalize ${
                                        isDarkMode ? "text-gray-400" : "text-gray-600"
                                      }`}>
                                        Size: {item.size}
                                      </p>
                                    )}
                                    {order.status === "delivered" && (
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="mt-2 h-7 text-[10px] font-bold px-3"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenReview(order, item);
                                        }}
                                      >
                                        <StarFilled className="w-3 h-3 mr-1.5 text-yellow-500 fill-yellow-500" />
                                        Rate & Review
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Pricing */}
                          <div className={`p-4 rounded-xl border space-y-2 text-sm ${
                            isDarkMode
                              ? "bg-gray-800/50 border-gray-700"
                              : "bg-white border-gray-200"
                          }`}>
                            <div className="flex justify-between">
                              <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Subtotal</span>
                              <span className={isDarkMode ? "text-white" : "text-gray-900"}>₹{order.subtotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>COD Charge</span>
                              <span className={isDarkMode ? "text-white" : "text-gray-900"}>₹{order.codCharge.toLocaleString('en-IN')}</span>
                            </div>
                            <div className={`flex justify-between font-bold pt-2 border-t ${
                              isDarkMode ? "border-gray-700" : "border-gray-200"
                            }`}>
                              <span className={isDarkMode ? "text-white" : "text-gray-900"}>Total</span>
                              <span className={`${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>₹{order.total.toLocaleString('en-IN')}</span>
                            </div>
                          </div>

                          {/* Delivery Address */}
                          <div>
                            <p className={`text-xs font-bold mb-2 ${
                              isDarkMode ? "text-blue-400" : "text-blue-600"
                            }`}>DELIVERY ADDRESS</p>
                            <div className={`p-4 rounded-xl border text-sm ${
                              isDarkMode
                                ? "bg-gray-800/50 border-gray-700"
                                : "bg-white border-gray-200"
                            }`}>
                              <p className={`font-medium mb-1 ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}>{order.customerName}</p>
                              {order.lane1 ? (
                                <div className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                                  <p>{order.lane1}</p>
                                  {order.lane2 && <p>{order.lane2}</p>}
                                  {order.landmark && <p className="italic text-xs opacity-80">Near {order.landmark}</p>}
                                </div>
                              ) : (
                                <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>{order.address}</p>
                              )}
                              <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                                {order.city}, {order.zipCode}
                              </p>
                              {(order.location?.googleMapsLink || order.location?.latitude) && (
                                <a 
                                  href={order.location.googleMapsLink || `https://www.google.com/maps?q=${order.location.latitude},${order.location.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-black tracking-wider text-blue-500 hover:text-blue-400 transition-colors uppercase"
                                >
                                  <Navigation className="w-3 h-3" />
                                  View Delivery Location
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Order Status */}
                          <div>
                            <p className={`text-xs font-bold mb-3 ${
                              isDarkMode ? "text-blue-400" : "text-blue-600"
                            }`}>ORDER PROGRESS</p>
                            <div className="space-y-3">
                              {["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"].map(
                                (statusStep, sIdx) => {
                                  const currentIdx = ["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"].indexOf(order.status);
                                  const isDone = sIdx <= currentIdx;
                                  const isCurrent = sIdx === currentIdx;
                                  
                                  return (
                                    <div key={statusStep} className="flex items-center gap-4">
                                      <div className="relative flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full z-10 ${
                                          isCurrent ? "bg-blue-500 ring-4 ring-blue-500/20" : isDone ? "bg-blue-500/50" : "bg-gray-700"
                                        }`} />
                                        {sIdx < 5 && (
                                          <div className={`absolute top-3 w-0.5 h-6 ${
                                            sIdx < currentIdx ? "bg-blue-500/30" : "bg-gray-800"
                                          }`} />
                                        )}
                                      </div>
                                      <span className={`text-xs font-medium uppercase tracking-wider ${
                                        isCurrent ? "text-white" : isDone ? "text-white/60" : "text-white/20"
                                      }`}>
                                        {statusStep.replace("_", " ")}
                                      </span>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Continue Shopping Button */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-center">
          <Button onClick={() => navigate("/")} size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8"
          >
            Explore More Kicks
          </Button>
        </motion.div>
      </div>

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-md bg-gray-900 border-gray-800 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Review Product</DialogTitle>
            <DialogDescription className="text-gray-400">
              Share your thoughts on {reviewItem?.productName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {/* Stars */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Rate your experience</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform active:scale-90"
                  >
                    <StarFilled 
                      className={`w-8 h-8 ${
                        star <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-700"
                      }`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Your Comments</label>
              <Textarea 
                placeholder="What did you like or dislike?"
                className="bg-gray-800 border-gray-700 focus:border-blue-500 min-h-[100px] rounded-xl"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {/* Images */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Product Images (URLs)</label>
              {reviewImages.map((url, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input 
                    placeholder="https://example.com/shoe.jpg"
                    className="bg-gray-800 border-gray-700 focus:border-blue-500 rounded-lg flex-1"
                    value={url}
                    onChange={(e) => {
                      const newImages = [...reviewImages];
                      newImages[idx] = e.target.value;
                      setReviewImages(newImages);
                    }}
                  />
                  {idx === reviewImages.length - 1 && reviewImages.length < 3 && (
                    <Button 
                      variant="outline" 
                      className="shrink-0 border-gray-700"
                      onClick={() => setReviewImages([...reviewImages, ""])}
                    >
                      +
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              className="border-gray-700 text-gray-300 rounded-xl"
              onClick={() => setReviewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 rounded-xl"
              onClick={submitReview}
              disabled={submittingReview}
            >
              {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Coupon Success Modal */}
      <Dialog open={showCouponModal} onOpenChange={setShowCouponModal}>
        <DialogContent className="max-w-sm bg-gray-900 border-gray-800 text-white rounded-3xl text-center overflow-hidden p-0">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-1">Thank You!</h2>
            <p className="text-blue-100 text-sm opacity-80">Your review helps the community</p>
          </div>
          <div className="p-8 space-y-6">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Here is your rewards</p>
              <div className="bg-gray-800 border-2 border-dashed border-gray-700 p-4 rounded-2xl relative">
                <div className="text-3xl font-black tracking-tighter text-blue-400">
                  {generatedCoupon}
                </div>
                <div className="text-[10px] font-bold text-gray-500 mt-2">10% OFF ON YOUR NEXT ORDER</div>
              </div>
            </div>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 rounded-2xl py-6 h-auto text-base font-bold"
              onClick={() => setShowCouponModal(false)}
            >
              Awesome, Copy & Close
            </Button>
            <p className="text-[10px] text-gray-500 italic">Code automatically saved to your profile</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
