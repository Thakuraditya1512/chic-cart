import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import OrderAnalytics from "@/components/OrderAnalytics";
import OrderGeoMap from "@/components/OrderGeoMap";
import {
  Plus, Pencil, Trash2, Image as ImageIcon, AlertCircle, X, Search,
  ChevronRight, User, Shield, Package, Star, LayoutDashboard, Ticket,
  Upload, ChevronDown, ChevronUp, CheckCircle2, Circle, Loader2, Navigation,
  MessageSquare, LogOut, Bell, Info, Tag as TagIcon, Heart, Sun, Moon
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { sendNotification } from "@/lib/notification";
import {
  SupportChat,
  ChatMessage,
  subscribeToAllChats,
  addChatMessage,
  markMessagesAsRead,
  subscribeToChatMessages,
  updateChatStatus
} from "@/lib/chat";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Brand {
  id: string;
  name: string;
  image: string;
  description?: string;
  createdAt?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  brandId: string;
  image: string;
  images?: string[];
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  sizes?: string[];
  featured?: boolean;
  createdAt?: string;
}

interface OrderItem {
  productName: string;
  price: number;
  quantity: number;
  size?: string;
  image?: string;
}

interface Order {
  id: string;
  userId: string;
  customerName: string;
  email: string;
  phone: string;
  lane1?: string;
  lane2?: string;
  landmark?: string;
  address?: string; // Legacy support
  city: string;
  zipCode: string;
  location?: {
    latitude: number;
    longitude: number;
    googleMapsLink?: string;
  };
  items: OrderItem[];
  total: number;
  status: string;
  createdAt?: any;
}

interface AppUser {
  id: string;
  email: string;
  role: "user" | "admin";
  fullName?: string;
  phone?: string;
  address?: {
    lane1: string;
    lane2: string;
    landmark: string;
    city: string;
    zipCode: string;
    googleMapsLink?: string;
  };
  createdAt?: string;
}

interface Review {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  orderId?: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt?: any;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'sale' | 'coupon' | 'new_arrival' | 'restock';
  target: string;
  link?: string;
  isActive: boolean;
  createdAt: any;
  updatedAt?: any;
}

type TabId = "brands" | "products" | "featured" | "customers" | "users" | "coupons" | "reviews" | "notifications" | "chats" | "wishlists" | "stockAlerts";

const ORDER_STATUSES = ["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"] as const;

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 border-amber-200 dark:border-amber-400/30",
  confirmed: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-400/10 border-blue-200 dark:border-blue-400/30",
  packed: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-400/10 border-indigo-200 dark:border-indigo-400/30",
  shipped: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-400/10 border-violet-200 dark:border-violet-400/30",
  out_for_delivery: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-400/10 border-orange-200 dark:border-orange-400/30",
  delivered: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/30",
};

// ─── Admin Component ──────────────────────────────────────────────────────────

interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  userId: string;
  isUsed: boolean;
  orderId?: string;
  createdAt?: any;
  expiresAt?: any;
}

const Admin = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>("brands");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editReviewRating, setEditReviewRating] = useState(0);
  const [editReviewComment, setEditReviewComment] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | Brand | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [formType, setFormType] = useState<"brand" | "product">("brand");
  const [featuredProducts, setFeaturedProducts] = useState<Set<string>>(new Set());
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [editingNotif, setEditingNotif] = useState<any | null>(null);
  const [notifForm, setNotifForm] = useState({
    title: "",
    message: "",
    type: "sale" as "sale" | "coupon" | "new_arrival" | "restock",
    targetType: "all" as "all" | "specific",
    targetUserId: "",
    link: "",
    isActive: true
  });
  const [sendingNotif, setSendingNotif] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: "",
    discountPercent: "",
    userId: "",
    expiresAt: ""
  });
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Support Chat State
  const [supportChats, setSupportChats] = useState<SupportChat[]>([]);
  const [activeChat, setActiveChat] = useState<SupportChat | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [adminReply, setAdminReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const chatSubRef = useRef<(() => void) | null>(null);

  const [wishlistStats, setWishlistStats] = useState<{
    productId: string,
    name: string,
    image: string,
    count: number,
    users: { id: string, name: string, email: string }[]
  }[]>([]);
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);

  // Set your secure password here
  const ADMIN_DELETE_PASSWORD = "Thakur@206";

  const [brandForm, setBrandForm] = useState({ name: "", description: "", image: "" });
  const [orderSearchQuery, setOrderSearchQuery] = useState("");

  const [productForm, setProductForm] = useState({
    name: "", price: "", originalPrice: "", description: "",
    image: "", images: [] as string[], rating: "4.5", reviews: "0", inStock: true, sizes: [] as string[],
  });

  useEffect(() => {
    fetchBrands();
    fetchProducts();
    fetchOrders();
    fetchUsers();
    fetchCoupons();
    fetchReviews();
    fetchAdminNotifications();
    fetchWishlistsStats();
    fetchStockAlerts();

    // Subscribe to support chats
    const unsubscribe = subscribeToAllChats((chats) => {
      setSupportChats(chats);
    });

    return () => unsubscribe();
  }, []);

  // Sub-subscription for active chat messages
  useEffect(() => {
    if (activeChat?.id) {
      if (chatSubRef.current) chatSubRef.current();

      chatSubRef.current = subscribeToChatMessages(activeChat.id, (msgs) => {
        setChatMessages(msgs);
        markMessagesAsRead(activeChat.id as string, "admin");
      });

      // Update local unread count
      setSupportChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, unreadCount: 0 } : c));
    } else {
      setChatMessages([]);
      if (chatSubRef.current) {
        chatSubRef.current();
        chatSubRef.current = null;
      }
    }

    return () => {
      if (chatSubRef.current) chatSubRef.current();
    };
  }, [activeChat?.id]);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (activeChat) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [activeChat]);

  // ─── Data Fetchers ──────────────────────────────────────────────────────────

  const fetchBrands = async () => {
    try {
      const snap = await getDocs(collection(db, "brands"));
      setBrands(snap.docs.map(d => ({ id: d.id, ...d.data() } as Brand)));
    } catch {
      toast.error("Failed to fetch brands");
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, "products"));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setProducts(list);
      setFeaturedProducts(new Set(list.filter(p => p.featured).map(p => p.id)));
    } catch {
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const snap = await getDocs(collection(db, "orders"));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))
        .sort((a, b) => {
          const tA = a.createdAt?.toDate?.() ?? new Date(0);
          const tB = b.createdAt?.toDate?.() ?? new Date(0);
          return tB.getTime() - tA.getTime();
        });
      setOrders(list);
    } catch {
      toast.error("Failed to fetch orders");
    }
  };

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppUser)));
    } catch {
      toast.error("Failed to fetch users");
    }
  };

  const fetchCoupons = async () => {
    try {
      const snap = await getDocs(query(collection(db, "coupons"), orderBy("createdAt", "desc")));
      setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon)));
    } catch (error) {
      console.error("Error fetching coupons:", error);
      // Fallback if index is not yet created
      try {
        const snap = await getDocs(collection(db, "coupons"));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setCoupons(list);
      } catch (innerError) {
        toast.error("Failed to fetch coupons");
      }
    }
  };

  const fetchReviews = async () => {
    try {
      const snap = await getDocs(collection(db, "reviews"));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Review))
        .sort((a, b) => {
          const tA = a.createdAt?.toDate?.() ?? new Date(0);
          const tB = b.createdAt?.toDate?.() ?? new Date(0);
          return tB.getTime() - tA.getTime();
        });
      setReviews(list);
    } catch {
      toast.error("Failed to fetch reviews");
    }
  };

  const fetchAdminNotifications = async () => {
    try {
      const snap = await getDocs(query(collection(db, "notifications"), orderBy("createdAt", "desc")));
      setAdminNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching admin notifications:", error);
      // Fallback if index not ready
      const snap = await getDocs(collection(db, "notifications"));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setAdminNotifications(list);
    }
  };

  const fetchWishlistsStats = async () => {
    try {
      const snap = await getDocs(collection(db, "wishlists"));
      const productsMap: Record<string, { id: string, name: string, email: string }[]> = {};

      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        const userId = docSnap.id;
        const items = data.items as string[];
        const userEmail = data.userEmail || "Unknown";

        if (Array.isArray(items)) {
          items.forEach(id => {
            if (!productsMap[id]) productsMap[id] = [];
            productsMap[id].push({
              id: userId,
              name: "Loading...",
              email: userEmail
            });
          });
        }
      });

      const stats = Object.entries(productsMap).map(([id, userList]) => {
        const product = products.find(p => p.id === id);
        return {
          productId: id,
          name: product?.name || "Product ID: " + id,
          image: product?.image || "https://placehold.co/80x80/111/444?text=Shoe",
          count: userList.length,
          users: userList.map(u => {
            const foundUser = users.find(user => user.id === u.id);
            return {
              ...u,
              name: foundUser?.fullName || (u.email !== 'Unknown' ? u.email.split('@')[0] : "Customer")
            };
          })
        };
      }).sort((a, b) => b.count - a.count);
      
      setWishlistStats(stats);
    } catch (error) {
      console.error("Error fetching wishlists:", error);
      toast.error("Failed to fetch wishlists stats");
    }
  };

  useEffect(() => {
    if (wishlistStats.length > 0 && products.length > 0) {
      setWishlistStats(prev => prev.map(s => {
        if (s.name.startsWith("Product ID:")) {
          const product = products.find(p => p.id === s.productId);
          if (product) {
            return {
              ...s,
              name: product.name,
              image: product.image
            };
          }
        }
        return s;
      }));
    }
  }, [products.length, wishlistStats.length]);

  // Handle tab specific fetches
  useEffect(() => {
    if (activeTab === "wishlists") {
      fetchWishlistsStats();
    }
    if (activeTab === "stockAlerts") {
      fetchStockAlerts();
    }
  }, [activeTab]);

  const fetchStockAlerts = async () => {
    try {
      const snap = await getDocs(query(collection(db, "stock_notifications"), orderBy("createdAt", "desc")));
      setStockAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      const snap = await getDocs(collection(db, "stock_notifications"));
      setStockAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
  };

  const deleteStockAlert = async (id: string) => {
    if (!confirm("Remove this alert?")) return;
    try {
      await deleteDoc(doc(db, "stock_notifications", id));
      toast.success("Alert removed");
      fetchStockAlerts();
    } catch {
      toast.error("Failed to delete alert");
    }
  };

  const handleSendNotification = async () => {
    if (!notifForm.title.trim() || !notifForm.message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (notifForm.targetType === "specific" && !notifForm.targetUserId) {
      toast.error("Please select a user");
      return;
    }

    try {
      setSendingNotif(true);
      const data: any = {
        title: notifForm.title.trim(),
        message: notifForm.message.trim(),
        type: notifForm.type,
        target: notifForm.targetType === "all" ? "all" : notifForm.targetUserId,
        isActive: notifForm.isActive,
        updatedAt: serverTimestamp(),
      };
      if (notifForm.link.trim()) data.link = notifForm.link.trim();

      if (editingNotif) {
        await updateDoc(doc(db, "notifications", editingNotif.id), data);
        toast.success("Notification updated!");
      } else {
        await sendNotification(data);
        toast.success("Notification sent!");
      }

      setNotifForm({
        title: "",
        message: "",
        type: "sale",
        targetType: "all",
        targetUserId: "",
        link: "",
        isActive: true
      });
      setEditingNotif(null);
      fetchAdminNotifications();
    } catch (error: any) {
      console.error("Notification operation error:", error);
      toast.error(editingNotif ? "Failed to update notification" : "Failed to send notification", {
        description: error.message || "An unknown error occurred"
      });
    } finally {
      setSendingNotif(false);
    }
  };

  const handleAdminReply = async () => {
    if (!adminReply.trim() || !activeChat?.id || sendingReply) return;

    try {
      setSendingReply(true);
      const text = adminReply.trim();
      setAdminReply("");

      await addChatMessage(activeChat.id, "admin", text);

      // If chat was pending, make it active
      if (activeChat.status === "pending_admin") {
        await updateChatStatus(activeChat.id, "active");
      }

    } catch (error) {
      toast.error("Failed to send reply");
      setAdminReply(adminReply); // Restore input on error
    } finally {
      setSendingReply(false);
    }
  };

  const resolveChat = async (id: string) => {
    try {
      await updateChatStatus(id, "resolved");
      toast.success("Chat marked as resolved");
      if (activeChat?.id === id) setActiveChat(null);
    } catch (error) {
      toast.error("Failed to resolve chat");
    }
  };

  const openEditNotif = (notif: any) => {
    setEditingNotif(notif);
    setNotifForm({
      title: notif.title,
      message: notif.message,
      type: notif.type as any,
      targetType: notif.target === "all" ? "all" : "specific",
      targetUserId: notif.target === "all" ? "" : notif.target,
      link: notif.link || "",
      isActive: notif.isActive ?? true
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Delete this review?")) return;
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
      toast.success("Review deleted");
      fetchReviews();
    } catch {
      toast.error("Failed to delete review");
    }
  };

  const handleCreateCoupon = async () => {
    if (!couponForm.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }
    if (!couponForm.discountPercent || Number(couponForm.discountPercent) <= 0 || Number(couponForm.discountPercent) > 100) {
      toast.error("Discount percentage must be between 1 and 100");
      return;
    }

    try {
      const couponData = {
        code: couponForm.code.trim().toUpperCase(),
        discountPercent: Number(couponForm.discountPercent),
        userId: couponForm.userId || null,
        isUsed: false,
        createdAt: serverTimestamp(),
        expiresAt: couponForm.expiresAt ? new Date(couponForm.expiresAt) : null
      };

      await addDoc(collection(db, "coupons"), couponData);
      toast.success("Coupon created successfully!");
      setCouponForm({ code: "", discountPercent: "", userId: "", expiresAt: "" });
      setShowCouponForm(false);
      fetchCoupons();
    } catch (error: any) {
      console.error("Error creating coupon:", error);
      toast.error("Failed to create coupon", {
        description: error.message || "An unknown error occurred"
      });
    }
  };

  const handleDeleteAllCoupons = async () => {
    if (!confirm("⚠️ This will permanently delete ALL coupons. Are you sure?")) return;
    try {
      setIsDeleting(true);
      const couponsSnap = await getDocs(collection(db, "coupons"));
      const deletePromises = couponsSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      toast.success("All coupons deleted successfully");
      fetchCoupons();
    } catch (error: any) {
      console.error("Error deleting all coupons:", error);
      toast.error("Failed to delete coupons", { description: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (deletePassword !== ADMIN_DELETE_PASSWORD) {
      toast.error("Incorrect password!");
      return;
    }

    if (!confirm("⚠️ DANGER: This will permanently delete ALL orders, notifications, and reviews. This action cannot be undone! Are you absolutely sure?")) {
      return;
    }

    try {
      setIsDeleting(true);

      // Delete all orders
      const ordersSnap = await getDocs(collection(db, "orders"));
      const orderDeletePromises = ordersSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(orderDeletePromises);

      // Delete all notifications
      const notifsSnap = await getDocs(collection(db, "notifications"));
      const notifDeletePromises = notifsSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(notifDeletePromises);

      // Delete all reviews
      const reviewsSnap = await getDocs(collection(db, "reviews"));
      const reviewDeletePromises = reviewsSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(reviewDeletePromises);

      toast.success("✅ All orders, notifications, and reviews have been deleted permanently!");

      // Refresh data
      fetchOrders();
      fetchAdminNotifications();
      fetchReviews();

      // Close modal and reset password
      setShowDeleteAllModal(false);
      setDeletePassword("");

    } catch (error: any) {
      console.error("Error deleting data:", error);
      toast.error("Failed to delete data", {
        description: error.message || "An unknown error occurred"
      });
    } finally {
      setIsDeleting(false);
    }
  };


  const openEditReview = (review: Review) => {
    setEditingReview(review);
    setEditReviewRating(review.rating);
    setEditReviewComment(review.comment);
  };

  const handleSaveReview = async () => {
    if (!editingReview) return;
    if (editReviewRating === 0) { toast.error("Rating required"); return; }
    if (!editReviewComment.trim()) { toast.error("Comment required"); return; }
    try {
      setSavingReview(true);
      await updateDoc(doc(db, "reviews", editingReview.id), {
        rating: editReviewRating,
        comment: editReviewComment.trim(),
      });
      toast.success("Review updated");
      setEditingReview(null);
      fetchReviews();
    } catch {
      toast.error("Failed to update review");
    } finally {
      setSavingReview(false);
    }
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBrand) return;
    try {
      setLoading(true);
      const arr = JSON.parse(await file.text());
      if (!Array.isArray(arr)) { toast.error("Expected a JSON array"); return; }
      for (const shoe of arr) {
        await addDoc(collection(db, "products"), {
          name: shoe.name, price: Number(shoe.price),
          originalPrice: shoe.originalPrice ? Number(shoe.originalPrice) : null,
          brandId: selectedBrand.id, description: shoe.description || "",
          image: shoe.image || "", rating: Number(shoe.rating) || 4.5,
          reviews: Number(shoe.reviews) || Math.floor(Math.random() * 50),
          inStock: shoe.inStock ?? true,
          sizes: shoe.sizes || ["6", "7", "8", "9", "10", "11", "12"],
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        });
      }
      toast.success(`Uploaded ${arr.length} products`);
      fetchProducts();
    } catch {
      toast.error("Error parsing JSON file");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Status → ${STATUS_LABELS[newStatus]}`);
    } catch {
      toast.error("Failed to update order status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const updateUserRole = async (userId: string, newRole: "user" | "admin") => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch {
      toast.error("Failed to update user role");
    }
  };

  const openNewBrand = () => {
    setFormType("brand"); setEditing(null);
    setBrandForm({ name: "", description: "", image: "" });
    setImagePreview(""); setError(""); setShowForm(true);
  };

  const openNewProduct = () => {
    if (!selectedBrand) { toast.error("Select a brand first"); return; }
    setFormType("product"); setEditing(null);
    setProductForm({
      name: "", price: "", originalPrice: "", description: "",
      image: "", images: [], rating: "4.5", reviews: "0", inStock: true, sizes: []
    });
    setImagePreview(""); setError(""); setShowForm(true);
  };

  const openEditBrand = (b: Brand) => {
    setFormType("brand"); setEditing(b);
    setBrandForm({ name: b.name, description: b.description || "", image: b.image });
    setImagePreview(b.image); setError(""); setShowForm(true);
  };

  const openEditProduct = (p: Product) => {
    setFormType("product"); setEditing(p);
    setProductForm({
      name: p.name, price: String(p.price),
      originalPrice: p.originalPrice ? String(p.originalPrice) : "",
      description: p.description, image: p.image,
      images: p.images || [],
      rating: String(p.rating || 4.5), reviews: String(p.reviews || 0),
      inStock: p.inStock ?? true, sizes: p.sizes || [],
    });
    setImagePreview(p.image); setError(""); setShowForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    if (formType === "brand") setBrandForm(f => ({ ...f, image: url }));
    else setProductForm(f => ({ ...f, image: url }));
    setImagePreview(url);
  };

  const handleSave = async () => {
    setError("");
    if (formType === "brand") await saveBrand();
    else await saveProduct();
  };

  const saveBrand = async () => {
    if (!brandForm.name.trim()) { setError("Brand name is required"); return; }
    if (!brandForm.image.trim()) { setError("Image URL is required"); return; }
    const data = {
      name: brandForm.name.trim(), description: brandForm.description.trim(),
      image: brandForm.image.trim(), updatedAt: new Date().toISOString()
    };
    try {
      setLoading(true);
      if (editing) {
        await updateDoc(doc(db, "brands", (editing as Brand).id), data);
        toast.success("Brand updated");
      } else {
        await addDoc(collection(db, "brands"), { ...data, createdAt: new Date().toISOString() });
        toast.success("Brand created");
      }
      setShowForm(false); fetchBrands();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save brand");
    } finally { setLoading(false); }
  };

  const saveProduct = async () => {
    if (!selectedBrand) { setError("No brand selected"); return; }
    if (!productForm.name.trim()) { setError("Product name is required"); return; }
    if (!productForm.price || Number(productForm.price) <= 0) { setError("Price must be > 0"); return; }
    const rating = Number(productForm.rating);
    if (isNaN(rating) || rating < 0 || rating > 5) { setError("Rating must be 0–5"); return; }

    const allImages = [productForm.image.trim(), ...productForm.images].filter(Boolean);
    if (allImages.length === 0) { setError("At least one image is required"); return; }

    const data = {
      name: productForm.name.trim(), price: Number(productForm.price),
      originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : null,
      brandId: selectedBrand.id, description: productForm.description.trim(),
      image: allImages[0],
      images: allImages,
      rating, reviews: Number(productForm.reviews) || 0,
      inStock: productForm.inStock, sizes: productForm.sizes,
      updatedAt: new Date().toISOString(),
    };
    try {
      setLoading(true);
      if (editing) {
        await updateDoc(doc(db, "products", (editing as Product).id), data);
        toast.success("Product updated");
      } else {
        await addDoc(collection(db, "products"), { ...data, createdAt: new Date().toISOString() });
        toast.success("Product created");
      }
      setShowForm(false); fetchProducts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string, type: "brand" | "product") => {
    const msg = type === "brand"
      ? "Delete this brand? Products will remain."
      : "Delete this product?";
    if (!confirm(msg)) return;
    try {
      setDeleteLoading(id);
      await deleteDoc(doc(db, type === "brand" ? "brands" : "products", id));
      toast.success(`${type === "brand" ? "Brand" : "Product"} deleted`);
      if (type === "brand") {
        fetchBrands();
        if (selectedBrand?.id === id) setSelectedBrand(null);
      } else fetchProducts();
    } catch {
      toast.error(`Failed to delete ${type}`);
    } finally { setDeleteLoading(null); }
  };

  const toggleFeatured = async (productId: string) => {
    try {
      const wasFeatured = featuredProducts.has(productId);
      const next = new Set(featuredProducts);
      wasFeatured ? next.delete(productId) : next.add(productId);
      setFeaturedProducts(next);
      await updateDoc(doc(db, "products", productId), { featured: !wasFeatured });
      toast.success(wasFeatured ? "Removed from Featured" : "Added to Featured");
    } catch {
      toast.error("Failed to update featured status");
    }
  };

  // ─── Tab config ─────────────────────────────────────────────────────────────

  const tabs = [
    { id: "brands" as TabId, label: "Brands", icon: TagIcon, count: brands.length },
    { id: "products" as TabId, label: "Shoes", icon: Package, count: products.length },
    { id: "featured" as TabId, label: "Featured", icon: Star, count: featuredProducts.size },
    { id: "customers" as TabId, label: "Orders", icon: LayoutDashboard, count: orders.length },
    { id: "users" as TabId, label: "Users", icon: Shield, count: users.length },
    { id: "coupons" as TabId, label: "Coupons", icon: Ticket, count: coupons.length },
    { id: "reviews" as TabId, label: "Reviews", icon: MessageSquare, count: reviews.length },
    { id: "chats" as TabId, label: "Support", icon: MessageSquare, count: supportChats.filter(c => c.unreadCount > 0 || c.status === "pending_admin").length },
    { id: "notifications" as TabId, label: "Notifs", icon: Bell, count: adminNotifications.length },
    { id: "wishlists" as TabId, label: "Wishlists", icon: Heart, count: wishlistStats.length },
    { id: "stockAlerts" as TabId, label: "Stock Alerts", icon: Bell, count: stockAlerts.length },
  ];

  // ─── Shared form input class ────────────────────────────────────────────────

  const inputCls = `w-full px-4 py-2.5 rounded-lg bg-muted border border-border
    text-sm text-foreground placeholder:text-muted-foreground
    focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-colors`;

  const labelCls = "block text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mb-1.5";

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-[100dvh] bg-background text-foreground flex flex-col md:flex-row font-sans relative overflow-hidden overscroll-none fixed inset-0 w-full">

      {/* ── Background Mesh Gradient ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#6c5ce7]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#a855f7]/10 blur-[120px]" />
      </div>

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className="w-full md:w-60 lg:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/6
        bg-[#0a0a13]/80 backdrop-blur-xl flex flex-col md:h-screen md:sticky md:top-0 z-40">


        {/* Logo */}
        <div className="px-7 py-8 hidden md:block">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">KickAdmin</span>
          </div>
          <p className="text-[11px] text-muted-foreground tracking-widest uppercase pl-9">Control Panel</p>
        </div>

        <nav className="flex-1 px-3 md:px-4 pb-4 md:pb-6 overflow-x-auto md:overflow-y-auto
          flex items-center md:items-stretch md:flex-col gap-1 md:gap-0.5 no-scrollbar pt-3 md:pt-0">

          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setShowForm(false); }}
                className={`relative group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300
                  ${active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
              >
                {/* Active Indicator Background */}
                {active && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}

                <div className="relative flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-500
                    ${active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "bg-accent text-muted-foreground group-hover:text-foreground"}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold tracking-tight">{tab.label}</span>
                </div>

                {tab.count > 0 && (
                  <span className={`relative text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all duration-500
                    ${active ? "bg-primary text-primary-foreground border-primary/20" : "bg-accent text-muted-foreground border-border group-hover:border-border"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Mobile Signout Button (End of horizontal scroll) */}
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="md:hidden flex-shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl ml-2
              text-[10px] font-bold uppercase tracking-widest text-destructive bg-destructive/10 border border-destructive/20"
          >
            <LogOut className="w-3 h-3" />
            Sign Out
          </button>
        </nav>

        {/* Bottom badge */}
        <div className="hidden md:block px-5 py-5 border-t border-border space-y-4 relative mt-auto">
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-purple-500
                flex items-center justify-center text-[11px] font-bold text-white">A</div>
              <div>
                <p className="text-[11px] font-semibold text-foreground">Administrator</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Full access</p>
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-accent border border-border text-muted-foreground hover:text-foreground transition-all"
              title={isDark ? "Switch to Light" : "Switch to Dark"}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Sign Out */}
          <div className="flex gap-2">
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="flex-1 p-2 rounded-lg bg-accent border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 transition-all text-center"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 mx-auto" />
            </button>
          </div>

          {/* Danger Zone */}
          <div className="pt-4 border-t border-white/6">
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50
                text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete All Data
            </button>
            <p className="text-[9px] text-white/20 text-center mt-2 leading-tight">
              Remove all orders, notifications & reviews
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main className="flex-1 relative z-10 overflow-auto">
        {/* Page header */}
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 border-b border-white/6 bg-[#08080f]/40 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white capitalize tracking-tight">{activeTab}</h2>
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <p className="text-xs text-white/30 font-medium">Dashboard Overview</p>
          </div>
          <div className="flex items-center gap-5">
            {/* Quick Actions / Notifications */}
            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors">
                <Bell className="w-4 h-4" />
                {adminNotifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ff5e00] ring-2 ring-[#08080f]" />
                )}
              </button>
            </div>

            <div className="w-px h-6 bg-white/10" />

            {/* Beautiful Profile Chip */}
            <div className="flex items-center gap-3 px-2 py-1.5 rounded-2xl group cursor-pointer hover:bg-white/[0.03] border border-transparent hover:border-white/[0.05] transition-all">
              <div className="hidden lg:flex flex-col items-end justify-center">
                <span className="text-xs font-bold text-white group-hover:text-[#6c5ce7] transition-colors tracking-tight">Admin Console</span>
                <span className="text-[9px] text-white/40 uppercase tracking-widest font-semibold flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 text-emerald-400/70" /> Secured
                </span>
              </div>
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6c5ce7] to-[#a855f7] flex items-center justify-center border border-white/10 shadow-lg shadow-[#6c5ce7]/20 group-hover:shadow-[#6c5ce7]/40 transition-shadow">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[2.5px] border-[#08080f] shadow-sm" title="Online" />
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden flex h-14 items-center justify-between px-4 border-b border-white/6 bg-[#08080f]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#6c5ce7] to-[#a855f7] flex items-center justify-center">
              <Package className="w-3.5 h-3.5 text-white" />
            </div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">{activeTab}</h2>
          </div>
          <p className="text-[10px] text-white/30 font-medium">KickAdmin</p>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white capitalize tracking-tight">{activeTab}</h3>
                  <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">Manage your {activeTab} settings and data</p>
                </div>
                {(activeTab === "brands" || activeTab === "products") && (
                  <button
                    onClick={activeTab === "brands" ? openNewBrand : openNewProduct}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                      bg-[#6c5ce7] hover:bg-[#7c6cf7] text-white text-xs font-bold uppercase tracking-wider transition-all
                      shadow-xl shadow-[#6c5ce7]/20 active:scale-95 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Add {activeTab === "brands" ? "Brand" : "Product"}
                  </button>
                )}
              </div>


              <div className="px-6 md:px-10 py-8 space-y-6">

                {/* ── Stats row ─────────────────────────────────────────────────────── */}
                {(activeTab === "brands" || activeTab === "products") && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Brands", value: brands.length, unit: "" },
                      { label: "Products", value: products.length, unit: "" },
                      { label: "Featured", value: featuredProducts.size, unit: "" },
                      { label: "Inventory", value: `₹${products.reduce((s, p) => s + p.price, 0).toLocaleString('en-IN')}`, unit: "" },
                    ].map(stat => (
                      <div key={stat.label}
                        className="rounded-2xl border border-white/6 bg-[#0d0d18] p-5">
                        <p className="text-[11px] tracking-widest uppercase text-white/30 mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-white font-mono">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Form modal ─────────────────────────────────────────────────────── */}
                <AnimatePresence>
                  {showForm && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="rounded-2xl border border-white/8 bg-[#0d0d18] overflow-hidden"
                    >
                      {/* Form header */}
                      <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
                        <div>
                          <h2 className="text-sm font-bold text-white">
                            {editing
                              ? `Edit ${formType === "brand" ? "Brand" : "Product"}`
                              : `New ${formType === "brand" ? "Brand" : "Product"}`}
                          </h2>
                          {formType === "product" && selectedBrand && (
                            <p className="text-[11px] text-white/30 mt-0.5">
                              Brand: {selectedBrand.name}
                            </p>
                          )}
                        </div>
                        <button onClick={() => setShowForm(false)}
                          className="p-1.5 rounded-lg hover:bg-white/6 text-white/40 hover:text-white transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                        {/* Error */}
                        {error && (
                          <div className="flex items-start gap-3 p-3.5 rounded-xl
                      bg-red-500/8 border border-red-500/20 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {error}
                          </div>
                        )}

                        {/* Image URL */}
                        <div>
                          <label className={labelCls}>Image URL *</label>
                          <input value={formType === "brand" ? brandForm.image : productForm.image}
                            onChange={handleImageChange}
                            placeholder="https://example.com/image.jpg"
                            className={inputCls} />
                          {imagePreview && (
                            <div className="mt-3 flex items-center gap-3 p-3 rounded-xl
                        bg-white/3 border border-white/6">
                              <img src={imagePreview} alt="Preview"
                                onError={() => setImagePreview("")}
                                className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-white/5" />
                              <p className="text-xs text-white/30 truncate flex-1">{imagePreview}</p>
                            </div>
                          )}

                          {formType === "product" && (
                            <div className="mt-4 space-y-3">
                              <label className={labelCls}>Additional Images</label>
                              {productForm.images.map((url, idx) => (
                                <div key={idx} className="flex gap-2">
                                  <input
                                    value={url}
                                    onChange={(e) => {
                                      const newImages = [...productForm.images];
                                      newImages[idx] = e.target.value;
                                      setProductForm(f => ({ ...f, images: newImages }));
                                    }}
                                    placeholder="Additional Image URL"
                                    className={inputCls}
                                  />
                                  <button
                                    onClick={() => {
                                      const newImages = productForm.images.filter((_, i) => i !== idx);
                                      setProductForm(f => ({ ...f, images: newImages }));
                                    }}
                                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => setProductForm(f => ({ ...f, images: [...f.images, ""] }))}
                                className="flex items-center gap-2 text-xs font-semibold text-[#6c5ce7] hover:text-[#7c6cf7] transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add Image
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Brand-specific fields */}
                        {formType === "brand" && (
                          <>
                            <div>
                              <label className={labelCls}>Brand Name *</label>
                              <input value={brandForm.name}
                                onChange={e => setBrandForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Nike, Adidas, Jordan…"
                                className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Description</label>
                              <textarea value={brandForm.description}
                                onChange={e => setBrandForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Describe the brand…"
                                rows={3}
                                className={`${inputCls} resize-none`} />
                            </div>
                          </>
                        )}

                        {/* Product-specific fields */}
                        {formType === "product" && (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className={labelCls}>Shoe Name *</label>
                                <input value={productForm.name}
                                  onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))}
                                  placeholder="Air Max 90"
                                  className={inputCls} />
                              </div>
                              <div>
                                <label className={labelCls}>Price ($) *</label>
                                <input type="number" step="0.01" min="0"
                                  value={productForm.price}
                                  onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))}
                                  placeholder="189.99"
                                  className={inputCls} />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className={labelCls}>Original Price ($)</label>
                                <input type="number" step="0.01" min="0"
                                  value={productForm.originalPrice}
                                  onChange={e => setProductForm(f => ({ ...f, originalPrice: e.target.value }))}
                                  placeholder="249.99"
                                  className={inputCls} />
                              </div>
                              <div>
                                <label className={labelCls}>Rating (0–5)</label>
                                <input type="number" step="0.1" min="0" max="5"
                                  value={productForm.rating}
                                  onChange={e => setProductForm(f => ({ ...f, rating: e.target.value }))}
                                  className={inputCls} />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className={labelCls}>Reviews Count</label>
                                <input type="number" min="0"
                                  value={productForm.reviews}
                                  onChange={e => setProductForm(f => ({ ...f, reviews: e.target.value }))}
                                  placeholder="0"
                                  className={inputCls} />
                              </div>
                              <div className="flex items-end pb-1">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all
                              ${productForm.inStock
                                      ? "bg-[#6c5ce7] border-[#6c5ce7]"
                                      : "border-white/20 bg-transparent"}`}
                                    onClick={() => setProductForm(f => ({ ...f, inStock: !f.inStock }))}>
                                    {productForm.inStock && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                  </div>
                                  <span className="text-sm text-white/70 group-hover:text-white transition-colors">In Stock</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className={labelCls}>Description</label>
                              <textarea value={productForm.description}
                                onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Describe features, materials, style…"
                                rows={3}
                                className={`${inputCls} resize-none`} />
                            </div>

                            <div>
                              <label className={labelCls}>Sizes</label>
                              <div className="flex flex-wrap gap-2">
                                {["6", "7", "8", "9", "10", "11", "12"].map(size => {
                                  const sel = productForm.sizes.includes(size);
                                  return (
                                    <button key={size} type="button"
                                      onClick={() => setProductForm(f => ({
                                        ...f,
                                        sizes: sel ? f.sizes.filter(s => s !== size) : [...f.sizes, size],
                                      }))}
                                      className={`w-11 h-9 rounded-lg text-sm font-semibold transition-all
                                  ${sel
                                          ? "bg-[#6c5ce7] text-white border border-[#6c5ce7]"
                                          : "bg-white/4 text-white/40 border border-white/10 hover:border-white/25"
                                        }`}>
                                      {size}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Form footer */}
                      <div className="flex items-center gap-3 px-6 py-4 border-t border-white/6 bg-[#0a0a12]">
                        <button onClick={handleSave} disabled={loading}
                          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#6c5ce7]
                      hover:bg-[#7c6cf7] text-white text-sm font-semibold transition-all
                      disabled:opacity-50 disabled:cursor-not-allowed">
                          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {loading ? "Saving…" : editing ? "Update" : "Create"}
                        </button>
                        <button onClick={() => setShowForm(false)}
                          className="px-5 py-2 rounded-lg border border-white/10 text-white/50
                      hover:text-white/80 text-sm transition-colors">
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ══════════════════════════════════════════════════════════════════ */}
                {/*  BRANDS TAB                                                       */}
                {/* ══════════════════════════════════════════════════════════════════ */}
                {activeTab === "brands" && (
                  <div>
                    {brands.length === 0 ? (
                      <EmptyState
                        title="No brands yet"
                        subtitle='Click "Add New" to create your first brand.'
                      />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {brands.map(b => {
                          const count = products.filter(p => p.brandId === b.id).length;
                          return (
                            <motion.div key={b.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="group relative rounded-2xl border border-white/6 bg-[#0d0d18]
                          hover:border-white/12 transition-all p-5 flex flex-col">
                              <div className="flex items-start justify-between mb-4">
                                <img src={b.image} alt={b.name}
                                  onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/64x64/111/444?text=B"; }}
                                  className="w-14 h-14 rounded-xl object-cover bg-white/5" />
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <IconBtn title="Manage shoes"
                                    onClick={() => { setSelectedBrand(b); setActiveTab("products"); }}>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </IconBtn>
                                  <IconBtn title="Edit" onClick={() => openEditBrand(b)}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </IconBtn>
                                  <IconBtn title="Delete" danger
                                    disabled={deleteLoading === b.id}
                                    onClick={() => handleDelete(b.id, "brand")}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </IconBtn>
                                </div>
                              </div>
                              <h3 className="font-bold text-base text-white mb-1">{b.name}</h3>
                              {b.description && (
                                <p className="text-sm text-white/35 line-clamp-2 mb-3">{b.description}</p>
                              )}
                              <div className="mt-auto pt-4 border-t border-white/6 flex justify-between">
                                <span className="text-[11px] uppercase tracking-widest text-white/30">Inventory</span>
                                <span className="text-sm font-semibold text-white/70">
                                  {count} {count === 1 ? "Shoe" : "Shoes"}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════ */}
                {/*  WISHLISTS TAB                                                    */}
                {/* ══════════════════════════════════════════════════════════════════ */}

                {/* ══════════════════════════════════════════════════════════════════ */}
                {/*  PRODUCTS TAB                                                     */}
                {/* ══════════════════════════════════════════════════════════════════ */}
                {activeTab === "products" && (
                  <div className="space-y-5">
                    {!selectedBrand ? (
                      <EmptyState
                        title="Select a brand first"
                        subtitle="Go to the Brands tab and click the arrow icon on a brand."
                        action={{ label: "Go to Brands", onClick: () => setActiveTab("brands") }}
                      />
                    ) : (
                      <>
                        {/* Brand header bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4
                    p-4 rounded-2xl border border-white/6 bg-[#0d0d18]">
                          <div className="flex items-center gap-4">
                            <img src={selectedBrand.image} alt={selectedBrand.name}
                              onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/48x48/111/444?text=B"; }}
                              className="w-11 h-11 rounded-xl object-cover bg-white/5" />
                            <div>
                              <p className="font-bold text-white">{selectedBrand.name}</p>
                              <p className="text-xs text-white/35">
                                {products.filter(p => p.brandId === selectedBrand.id).length} products
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg
                        border border-white/10 text-white/50 hover:text-white/80 text-xs font-semibold transition-all">
                              <Upload className="w-3.5 h-3.5" />
                              Bulk Upload
                              <input type="file" accept=".json" onChange={handleBulkUpload} className="hidden" />
                            </label>
                            <button
                              onClick={() => { setSelectedBrand(null); setShowForm(false); }}
                              className="px-4 py-2 rounded-lg border border-white/10 text-white/50
                          hover:text-white/80 text-xs font-semibold transition-all">
                              Change Brand
                            </button>
                          </div>
                        </div>

                        {/* Products grid */}
                        {products.filter(p => p.brandId === selectedBrand.id).length === 0 ? (
                          <EmptyState
                            title={`No shoes for ${selectedBrand.name}`}
                            subtitle='Click "Add New" to add the first shoe.'
                          />
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {products.filter(p => p.brandId === selectedBrand.id).map(p => (
                              <motion.div key={p.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group relative rounded-2xl border border-white/6 bg-[#0d0d18]
                            hover:border-white/12 transition-all p-5 flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                  <img src={p.image} alt={p.name}
                                    onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/80x80/111/444?text=Shoe"; }}
                                    className="w-20 h-20 rounded-xl object-cover bg-white/5" />
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <IconBtn title="Edit" onClick={() => openEditProduct(p)}>
                                      <Pencil className="w-3.5 h-3.5" />
                                    </IconBtn>
                                    <IconBtn title="Delete" danger
                                      disabled={deleteLoading === p.id}
                                      onClick={() => handleDelete(p.id, "product")}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </IconBtn>
                                  </div>
                                </div>
                                <h3 className="font-bold text-white truncate mb-1">{p.name}</h3>
                                <div className="flex items-baseline gap-2 mb-2">
                                  <span className="font-bold text-white">₹{p.price.toLocaleString('en-IN')}</span>
                                  {p.originalPrice && (
                                    <span className="text-sm text-white/25 line-through">₹{p.originalPrice.toLocaleString('en-IN')}</span>
                                  )}
                                </div>
                                {p.rating !== undefined && (
                                  <div className="flex items-center gap-1.5">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    <span className="text-sm font-medium text-white/70">{p.rating}</span>
                                    <span className="text-xs text-white/30">({p.reviews || 0})</span>
                                  </div>
                                )}
                                <div className="mt-3 pt-3 border-t border-white/6">
                                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md
                              ${p.inStock
                                      ? "bg-emerald-500/10 text-emerald-400"
                                      : "bg-red-500/10 text-red-400"}`}>
                                    {p.inStock ? "In Stock" : "Out of Stock"}
                                  </span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════ */}
                {/*  FEATURED TAB                                                     */}
                {/* ══════════════════════════════════════════════════════════════════ */}
                {activeTab === "featured" && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl border border-white/6 bg-[#0d0d18] text-sm text-white/40">
                      <span className="text-white font-semibold">{featuredProducts.size}</span>
                      {" "}of{" "}
                      <span className="text-white font-semibold">{products.length}</span>
                      {" "}products are featured on the homepage carousel.
                    </div>

                    {products.length === 0 ? (
                      <EmptyState title="No products found" subtitle="Add products first." />
                    ) : (
                      <div className="space-y-2">
                        {products.map(product => {
                          const featured = featuredProducts.has(product.id);
                          const brand = brands.find(b => b.id === product.brandId);
                          return (
                            <motion.div key={product.id}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`flex items-center gap-4 p-4 rounded-xl border transition-all
                          ${featured
                                  ? "border-[#6c5ce7]/30 bg-[#6c5ce7]/6"
                                  : "border-white/6 bg-[#0d0d18] hover:border-white/12"
                                }`}>
                              <img src={product.image} alt={product.name}
                                onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/56x56/111/444?text=S"; }}
                                className="w-14 h-14 rounded-xl object-cover bg-white/5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white text-sm truncate">{product.name}</p>
                                <p className="text-xs text-white/35 mt-0.5">
                                  {brand?.name} · ₹{product.price.toLocaleString('en-IN')}
                                </p>
                              </div>
                              <button onClick={() => toggleFeatured(product.id)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0
                            ${featured
                                    ? "bg-[#6c5ce7] text-white hover:bg-[#7c6cf7]"
                                    : "border border-white/10 text-white/40 hover:text-white/70 hover:border-white/25"
                                  }`}>
                                {featured ? "✓ Featured" : "+ Feature"}
                              </button>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════ */}
                {/*  ORDERS TAB                                                       */}
                {/* ══════════════════════════════════════════════════════════════════ */}
                {activeTab === "customers" && (
                  <div className="space-y-3">
                    {/* ── Analytics Dashboard ── */}
                    <OrderAnalytics orders={orders} />

                    {/* ── Geo-Map section ── */}
                    {/* <OrderGeoMap orders={orders} /> */}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 pb-2">
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-tight">Order Activity</h3>
                        <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] mt-0.5">Historical Logs</p>
                      </div>

                      {/* Premium Search Bar */}
                      <div className="relative w-full sm:w-72 group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Search className="w-4 h-4 text-white/10 group-focus-within:text-[#6c5ce7] transition-colors" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search Order ID or Customer..."
                          value={orderSearchQuery}
                          onChange={(e) => setOrderSearchQuery(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#0d0d14]/60 border border-white/6
                      text-xs text-white placeholder:text-white/10
                      focus:outline-none focus:border-[#6c5ce7]/40 focus:ring-4 focus:ring-[#6c5ce7]/5 transition-all"
                        />
                      </div>
                    </div>

                    {orders.length === 0 ? (
                      <EmptyState title="No orders yet" subtitle="Orders will appear here when customers check out." />
                    ) : (
                      orders
                        .filter(o => {
                          const id = o?.id || "";
                          const name = o?.customerName || "";
                          const query = orderSearchQuery.toLowerCase();
                          return id.toLowerCase().includes(query) || name.toLowerCase().includes(query);
                        })
                        .map(order => {
                          const expanded = expandedOrder === order.id;
                          const statusIdx = ORDER_STATUSES.indexOf(order.status as any);
                          return (
                            <div key={order.id}
                              className="group relative rounded-2xl border border-white/6 bg-[#0d0d18]/40 hover:bg-[#0d0d18]/60 
                        backdrop-blur-sm transition-all duration-300 overflow-hidden">
                              {/* Order row */}
                              <button
                                onClick={() => setExpandedOrder(expanded ? null : order?.id)}
                                className="w-full flex flex-col sm:flex-row sm:items-center p-5 text-left border-b border-transparent hover:border-white/5 transition-all">

                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all
                            ${expanded ? "bg-[#6c5ce7] text-white shadow-lg shadow-[#6c5ce7]/20" : "bg-white/5 text-white/30"}`}>
                                    {(order?.customerName?.[0] || "U").toUpperCase()}
                                  </div>
                                  <div className="min-w-0 pr-4">
                                    <p className="font-bold text-white text-sm truncate tracking-tight">{order?.customerName || "Unknown Customer"}</p>
                                    <p className="text-[10px] text-white/20 font-mono mt-0.5 truncate uppercase tracking-widest">
                                      ID: {order?.id?.slice(0, 10) || "N/A"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-6 mt-4 sm:mt-0">
                                  <div className="text-right hidden md:block">
                                    <p className="text-[10px] text-white/20 uppercase tracking-widest mb-0.5">Revenue</p>
                                    <p className="text-sm font-bold text-white tracking-tight">₹{(order?.total || 0).toLocaleString('en-IN')}</p>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.2 rounded-full text-[10px] font-bold uppercase tracking-widest border
                              ${STATUS_COLORS[order?.status || "pending"] || "text-white/40 bg-white/5 border-white/10"}`}>
                                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[order?.status || "pending"] || '#fff' }} />
                                      {STATUS_LABELS[order?.status || "pending"] || (order?.status || "pending")}
                                    </span>

                                    <div className={`p-1.5 rounded-lg border border-white/5 transition-all
                              ${expanded ? "bg-[#6c5ce7]/20 text-[#6c5ce7] border-[#6c5ce7]/20" : "bg-white/5 text-white/20"}`}>
                                      {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </div>
                                  </div>
                                </div>
                              </button>

                              {/* Expanded details */}
                              <AnimatePresence>
                                {expanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="bg-black/20 border-t border-white/5 overflow-hidden">
                                    <div className="p-5 space-y-5">

                                      {/* Items */}
                                      <div>
                                        <SectionLabel>Items ({order.items.length})</SectionLabel>
                                        <div className="space-y-2 mt-2">
                                          {order.items.map((item, i) => (
                                            <div key={i} className="flex gap-3 p-3 rounded-xl
                                      bg-white/3 border border-white/6">
                                              {item.image && (
                                                <img src={item.image} alt={item.productName}
                                                  className="w-12 h-12 rounded-lg object-cover bg-white/5 flex-shrink-0" />
                                              )}
                                              <div className="flex-1 min-w-0">
                                                <div className="flex justify-between gap-2">
                                                  <p className="text-sm font-medium text-white truncate">{item.productName}</p>
                                                  <p className="text-sm font-bold text-white flex-shrink-0">
                                                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                                  </p>
                                                </div>
                                                <p className="text-xs text-white/35 mt-0.5">
                                                  Qty {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                                                  {item.size && (
                                                    <span className="ml-2">
                                                      Size: <span className="font-bold text-white/60">{item.size}</span>
                                                    </span>
                                                  )}
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      <div className="grid sm:grid-cols-2 gap-5">
                                        {/* Delivery */}
                                        <div>
                                          <SectionLabel>Delivery Address</SectionLabel>
                                          <div className="mt-2 p-3.5 rounded-xl bg-white/3 border border-white/6
                                    text-xs text-white/50 space-y-0.5">
                                            <p className="text-white font-medium">{order.customerName}</p>
                                            <p>{order.email} · {order.phone}</p>
                                            <div className="pt-1 border-t border-white/6 mt-1 space-y-0.5">
                                              {order.lane1 ? (
                                                <>
                                                  <p className="text-white">{order.lane1}</p>
                                                  {order.lane2 && <p>{order.lane2}</p>}
                                                  {order.landmark && <p className="italic text-white/40">Near {order.landmark}</p>}
                                                </>
                                              ) : (
                                                <p className="text-white">{order.address}</p>
                                              )}
                                              <p>{order.city}, {order.zipCode}</p>

                                              {(order.location?.googleMapsLink || order.location?.latitude) && (
                                                <a
                                                  href={order.location.googleMapsLink || `https://www.google.com/maps?q=${order.location.latitude},${order.location.longitude}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                                >
                                                  <Navigation className="w-3 h-3" />
                                                  View on Maps
                                                </a>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Update status */}
                                        <div>
                                          <SectionLabel>Update Status</SectionLabel>
                                          <div className="mt-2 flex flex-wrap gap-1.5">
                                            {ORDER_STATUSES.map(s => (
                                              <button key={s}
                                                onClick={() => handleStatusChange(order.id, s)}
                                                disabled={updatingStatus === order.id}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                                          disabled:opacity-50
                                          ${order.status === s
                                                    ? "bg-[#6c5ce7] text-white"
                                                    : "bg-white/4 text-white/40 hover:bg-white/8 hover:text-white/70"
                                                  }`}>
                                                {STATUS_LABELS[s]}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Timeline */}
                                      <div>
                                        <SectionLabel>Timeline</SectionLabel>
                                        <div className="mt-3 flex items-center gap-0">
                                          {ORDER_STATUSES.map((s, i) => {
                                            const done = i <= statusIdx;
                                            const current = i === statusIdx;
                                            return (
                                              <div key={s} className="flex items-center flex-1 last:flex-none">
                                                <div className="flex flex-col items-center gap-1">
                                                  <div className={`w-3 h-3 rounded-full border-2 transition-all
                                            ${current
                                                      ? "border-[#6c5ce7] bg-[#6c5ce7] shadow-[0_0_8px_#6c5ce7]"
                                                      : done
                                                        ? "border-[#6c5ce7]/50 bg-[#6c5ce7]/30"
                                                        : "border-white/15 bg-transparent"
                                                    }`} />
                                                  <span className={`text-[9px] text-center leading-tight max-w-[52px]
                                            ${done ? "text-white/60" : "text-white/20"}`}>
                                                    {STATUS_LABELS[s]}
                                                  </span>
                                                </div>
                                                {i < ORDER_STATUSES.length - 1 && (
                                                  <div className={`flex-1 h-0.5 mx-1 -mt-4 transition-all
                                            ${i < statusIdx ? "bg-[#6c5ce7]/40" : "bg-white/8"}`} />
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════ */}
                {/*  USERS TAB                                                        */}
                {/* ══════════════════════════════════════════════════════════════════ */}
                {activeTab === "users" && (
                  <div className="space-y-2">
                    {users.length === 0 ? (
                      <EmptyState title="No users found" subtitle="Users will appear once they sign up." />
                    ) : (
                      users.map(user => (
                        <motion.div key={user.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex flex-col gap-4 p-5
                      rounded-xl border border-white/6 bg-[#0d0d18] hover:border-white/12 transition-all">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center
                          justify-center text-sm font-bold text-white/40 flex-shrink-0 mt-1">
                                {user.email.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <p className="text-sm font-bold text-white truncate">{user.fullName || "Unset Name"}</p>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider
                              ${user.role === "admin" ? "bg-[#6c5ce7]/20 text-[#a78bfa]" : "bg-white/5 text-white/40"}`}>
                                    {user.role}
                                  </span>
                                </div>
                                <p className="text-xs text-white/50">{user.email}</p>
                                {user.phone && <p className="text-xs text-white/40 mt-1 flex items-center gap-1.5"><TagIcon className="w-3 h-3" /> {user.phone}</p>}
                              </div>
                            </div>

                            <div className="flex gap-2 h-fit">
                              <button
                                onClick={() => user.role !== "user" && updateUserRole(user.id, "user")}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all
                            ${user.role === "user"
                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                    : "border border-white/10 text-white/30 hover:text-white/60"
                                  }`}>
                                Set User
                              </button>
                              <button
                                onClick={() => user.role !== "admin" && updateUserRole(user.id, "admin")}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg
                            text-xs font-bold transition-all
                            ${user.role === "admin"
                                    ? "bg-[#6c5ce7]/20 text-[#a78bfa] border border-[#6c5ce7]/30"
                                    : "border border-white/10 text-white/30 hover:text-white/60"
                                  }`}>
                                <Shield className="w-3 h-3" />
                                Set Admin
                              </button>
                            </div>
                          </div>

                          {user.address && user.address.lane1 && (
                            <div className="mt-2 pt-4 border-t border-white/6 grid sm:grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-white/25 mb-2">Saved Address</p>
                                <div className="p-3 rounded-lg bg-white/3 border border-white/6 text-xs text-white/50 space-y-0.5">
                                  <p className="text-white font-medium">{user.address.lane1}</p>
                                  {user.address.lane2 && <p>{user.address.lane2}</p>}
                                  {user.address.landmark && <p className="italic text-white/30">Near {user.address.landmark}</p>}
                                  <p>{user.address.city}, {user.address.zipCode}</p>
                                </div>
                              </div>
                              {user.address.googleMapsLink && (
                                <div className="flex flex-wrap items-center gap-2 justify-end">
                                  <button
                                    onClick={() => {
                                      const addr = user.address;
                                      if (!addr) return;
                                      const text = `${user.fullName || ""}\n${addr.lane1}${addr.lane2 ? "\n" + addr.lane2 : ""}${addr.landmark ? "\nNear " + addr.landmark : ""}\n${addr.city}, ${addr.zipCode}\nPhone: ${user.phone || ""}`;
                                      navigator.clipboard.writeText(text);
                                      toast.success("Address copied to clipboard");
                                    }}
                                    className="w-fit flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/50 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all"
                                  >
                                    Copy Address
                                  </button>
                                  <a
                                    href={user.address.googleMapsLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-fit flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-500/20 transition-all"
                                  >
                                    <Navigation className="w-3.5 h-3.5" />
                                    View on Maps
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "coupons" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <SectionLabel>Generated Coupons</SectionLabel>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleDeleteAllCoupons}
                          disabled={isDeleting}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg 
                      bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-sm font-semibold transition-all disabled:opacity-50"
                        >
                          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Delete All
                        </button>
                        <button
                          onClick={() => setShowCouponForm(true)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg
                      bg-[#6c5ce7] hover:bg-[#7c6cf7] text-white text-sm font-semibold transition-all
                      shadow-lg shadow-[#6c5ce7]/20 active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                          Create Coupon
                        </button>
                        <p className="hidden md:block text-[10px] text-white/30 font-bold uppercase tracking-widest">
                          Auto-generated on product reviews
                        </p>
                      </div>
                    </div>

                    {/* Coupon Creation Form */}
                    <AnimatePresence>
                      {showCouponForm && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="rounded-2xl border border-white/8 bg-[#0d0d18] overflow-hidden"
                        >
                          <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
                            <h2 className="text-sm font-bold text-white">Create New Coupon</h2>
                            <button onClick={() => setShowCouponForm(false)}
                              className="p-1.5 rounded-lg hover:bg-white/6 text-white/40 hover:text-white transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className={labelCls}>Coupon Code *</label>
                                <input
                                  value={couponForm.code}
                                  onChange={e => setCouponForm(prev => ({ ...prev, code: e.target.value }))}
                                  placeholder="e.g. SUMMER20"
                                  className={inputCls}
                                />
                              </div>
                              <div>
                                <label className={labelCls}>Discount Percentage *</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={couponForm.discountPercent}
                                  onChange={e => setCouponForm(prev => ({ ...prev, discountPercent: e.target.value }))}
                                  placeholder="e.g. 20"
                                  className={inputCls}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className={labelCls}>Assign to User (Optional)</label>
                                <select
                                  value={couponForm.userId}
                                  onChange={e => setCouponForm(prev => ({ ...prev, userId: e.target.value }))}
                                  className={inputCls}
                                >
                                  <option value="">All Users</option>
                                  {users.map(u => (
                                    <option key={u.id} value={u.id}>
                                      {u.fullName || u.email}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className={labelCls}>Expiry Date (Optional)</label>
                                <input
                                  type="date"
                                  value={couponForm.expiresAt}
                                  onChange={e => setCouponForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                                  className={inputCls}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 px-6 py-4 border-t border-white/6 bg-[#0a0a12]">
                            <button onClick={handleCreateCoupon}
                              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#6c5ce7]
                          hover:bg-[#7c6cf7] text-white text-sm font-semibold transition-all">
                              <Ticket className="w-3.5 h-3.5" />
                              Create Coupon
                            </button>
                            <button onClick={() => setShowCouponForm(false)}
                              className="px-5 py-2 rounded-lg border border-white/10 text-white/50
                          hover:text-white/80 text-sm transition-colors">
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="grid gap-3">
                      {coupons.length === 0 ? (
                        <EmptyState title="No Coupons Found" subtitle="Coupons are generated when users review their delivered products." />
                      ) : (
                        coupons.map((coupon) => (
                          <motion.div
                            key={coupon.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-2xl border border-white/6 bg-[#0d0d18] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${coupon.isUsed ? "bg-white/5 text-white/20" : "bg-green-500/20 text-green-400"
                                }`}>
                                <Ticket className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-lg font-black tracking-tighter text-white">{coupon.code}</p>
                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                                  {coupon.discountPercent}% Discount • {coupon.isUsed ? "Redeemed" : "Active"}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col sm:items-end gap-1">
                              <p className="text-[10px] text-white/40 font-medium">
                                Created: {coupon.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}
                              </p>
                              {coupon.orderId && (
                                <p className="text-[10px] text-blue-400 font-bold">
                                  Used for Order: #{coupon.orderId.slice(0, 8)}
                                </p>
                              )}
                              <button
                                onClick={async () => {
                                  if (window.confirm("Are you sure you want to delete this coupon?")) {
                                    await deleteDoc(doc(db, "coupons", coupon.id));
                                    toast.success("Coupon deleted");
                                    fetchCoupons();
                                  }
                                }}
                                className="text-white/20 hover:text-red-400 transition-colors mt-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════ */}
                {/*  REVIEWS TAB                                                      */}
                {/* ══════════════════════════════════════════════════════════════════ */}
                {activeTab === "reviews" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <SectionLabel>Customer Reviews</SectionLabel>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                        Manage all product reviews
                      </p>
                    </div>

                    {/* Edit Review Modal */}
                    <AnimatePresence>
                      {editingReview && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="rounded-2xl border border-white/8 bg-[#0d0d18] overflow-hidden"
                        >
                          <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
                            <div>
                              <h2 className="text-sm font-bold text-white">Edit Review</h2>
                              <p className="text-[11px] text-white/30 mt-0.5">{editingReview.productName}</p>
                            </div>
                            <button onClick={() => setEditingReview(null)}
                              className="p-1.5 rounded-lg hover:bg-white/6 text-white/40 hover:text-white transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="p-6 space-y-5">
                            <div>
                              <label className={labelCls}>Rating</label>
                              <div className="flex gap-1.5">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button key={star} onClick={() => setEditReviewRating(star)}
                                    className="transition-transform hover:scale-110 active:scale-95">
                                    <Star className={`w-8 h-8 transition-colors ${star <= editReviewRating ? "text-amber-400 fill-amber-400" : "text-white/10 fill-white/10"}`} />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className={labelCls}>Comment</label>
                              <textarea value={editReviewComment}
                                onChange={e => setEditReviewComment(e.target.value)}
                                rows={3}
                                className={`${inputCls} resize-none`} />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 px-6 py-4 border-t border-white/6 bg-[#0a0a12]">
                            <button onClick={handleSaveReview} disabled={savingReview}
                              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#6c5ce7]
                          hover:bg-[#7c6cf7] text-white text-sm font-semibold transition-all
                          disabled:opacity-50 disabled:cursor-not-allowed">
                              {savingReview && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              {savingReview ? "Saving…" : "Update Review"}
                            </button>
                            <button onClick={() => setEditingReview(null)}
                              className="px-5 py-2 rounded-lg border border-white/10 text-white/50
                          hover:text-white/80 text-sm transition-colors">
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Reviews Grid */}
                    <div className="grid gap-3">
                      {reviews.length === 0 ? (
                        <EmptyState title="No Reviews Found" subtitle="Reviews will appear here when users review their delivered products." />
                      ) : (
                        reviews.map((review) => (
                          <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-5 rounded-2xl border border-white/6 bg-[#0d0d18]
                        hover:border-white/12 transition-all group"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                {/* Product & Reviewer */}
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center
                              justify-center text-xs font-bold text-white/40 flex-shrink-0">
                                    {review.customerName?.charAt(0)?.toUpperCase() || "?"}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-white">{review.productName}</p>
                                    <p className="text-[11px] text-white/35">by {review.customerName}</p>
                                  </div>
                                </div>

                                {/* Stars */}
                                <div className="flex items-center gap-1 mb-2">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <Star key={star}
                                      className={`w-4 h-4 ${star <= review.rating ? "text-amber-400 fill-amber-400" : "text-white/10 fill-white/10"}`} />
                                  ))}
                                  <span className="text-xs font-semibold text-white/50 ml-1">{review.rating}/5</span>
                                </div>

                                {/* Comment */}
                                <p className="text-sm text-white/60 leading-relaxed">{review.comment}</p>

                                {/* Meta */}
                                <div className="flex items-center gap-4 mt-3 text-[10px] text-white/25 font-bold uppercase tracking-widest">
                                  <span>
                                    {review.createdAt?.toDate?.()?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) || "N/A"}
                                  </span>
                                  {review.orderId && (
                                    <span>Order #{review.orderId.slice(0, 8)}</span>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button
                                  title="Edit review"
                                  onClick={() => openEditReview(review)}
                                  className="p-1.5 rounded-lg text-white/30 hover:text-white/80 hover:bg-white/6 transition-all">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  title="Delete review"
                                  onClick={() => handleDeleteReview(review.id)}
                                  className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "chats" && (
                  <div className="flex flex-col lg:flex-row gap-6 h-[calc(100dvh-180px)] md:h-[calc(100dvh-200px)]">
                    {/* Chat List */}
                    <div className={`w-full lg:w-80 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar ${activeChat ? 'hidden lg:flex' : 'flex'}`}>
                      <SectionLabel>Active Sessions</SectionLabel>
                      {supportChats.length === 0 ? (
                        <EmptyState title="No active chats" subtitle="Wait for users to request help." />
                      ) : (
                        supportChats.map(chat => (
                          <button
                            key={chat.id}
                            onClick={() => setActiveChat(chat)}
                            className={`flex flex-col gap-2 p-3.5 rounded-2xl border transition-all text-left ${activeChat?.id === chat.id
                              ? "bg-[#6c5ce7]/10 border-[#6c5ce7]/50 shadow-lg shadow-[#6c5ce7]/5"
                              : "bg-[#0d0d18] border-white/6 hover:border-white/12"
                              }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/40">
                                  {chat.userName?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <span className="text-xs font-bold text-white truncate max-w-[120px]">{chat.userName}</span>
                              </div>
                              {chat.unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#6c5ce7] text-white text-[9px] font-black">
                                  {chat.unreadCount}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${chat.status === "pending_admin" ? "bg-amber-500/10 text-amber-400" :
                                chat.status === "active" ? "bg-emerald-500/10 text-emerald-400" :
                                  "bg-white/5 text-white/30"
                                }`}>
                                {chat.status.replace("_", " ")}
                              </span>
                              <span className="text-[8px] text-white/20 font-medium">
                                {chat.updatedAt?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    {/* Chat View - Pop on mobile or fixed on desktop */}
                    <div className={`flex-1 flex flex-col rounded-[1.5rem] md:rounded-[2rem] border border-white/8 bg-[#0d0d18] overflow-hidden shadow-2xl transition-all duration-300
                ${activeChat
                        ? 'fixed inset-x-6 top-20 bottom-24 md:inset-auto md:relative z-[60] flex h-auto max-w-[calc(100vw-48px)] mx-auto'
                        : 'hidden md:flex'}`}>
                      {activeChat ? (
                        <>
                          {/* Chat Header */}
                          <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-white/6 bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                              <button onClick={() => setActiveChat(null)} className="md:hidden p-1.5 -ml-1 text-white/40 hover:text-white">
                                <X className="w-4 h-4" />
                              </button>
                              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-[#6c5ce7] to-[#a855f7] flex items-center justify-center border border-white/10">
                                <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="text-xs md:text-sm font-bold text-white tracking-tight">{activeChat.userName}</h4>
                                <p className="text-[8px] md:text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> Live Session
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => resolveChat(activeChat.id!)}
                              className="px-3 md:px-4 py-1 md:py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[9px] md:text-xs font-bold uppercase tracking-widest transition-all"
                            >
                              Resolve
                            </button>
                          </div>

                          {/* Messages Area */}
                          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 md:space-y-4 custom-scrollbar bg-black/20">
                            {chatMessages.map((msg, i) => {
                              const isUser = msg.sender === "user";
                              return (
                                <div key={msg.id || i} className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
                                  <div className={`max-w-[85%] md:max-w-[80%] p-3 md:p-3.5 rounded-2xl text-xs md:text-sm ${isUser
                                    ? "bg-white/5 text-white/80 rounded-bl-none"
                                    : "bg-[#6c5ce7] text-white rounded-br-none shadow-lg shadow-[#6c5ce7]/20"
                                    }`}>
                                    {msg.text}
                                    <div className={`text-[8px] md:text-[10px] mt-1 md:mt-1.5 font-medium ${isUser ? "text-white/20" : "text-white/50"}`}>
                                      {msg.timestamp?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            <div ref={chatMessagesEndRef} />
                          </div>

                          {/* Chat Input */}
                          <div className="p-3 md:p-4 bg-[#0a0a14] border-t border-white/6 sticky bottom-0">
                            <div className="relative flex items-center gap-2">
                              <input
                                type="text"
                                value={adminReply}
                                onChange={(e) => setAdminReply(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAdminReply()}
                                placeholder="Type your response..."
                                className="flex-1 px-4 py-2.5 md:py-3 rounded-xl bg-black/40 border border-white/8 text-xs md:text-sm text-white focus:outline-none focus:border-[#6c5ce7]/50 transition-all"
                              />
                              <button
                                onClick={handleAdminReply}
                                disabled={sendingReply || !adminReply.trim()}
                                className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-[#6c5ce7] hover:bg-[#7c6cf7] text-white flex items-center justify-center transition-all disabled:opacity-50 shadow-lg shadow-[#6c5ce7]/20"
                              >
                                {sendingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />}
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 md:p-12">
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
                            <MessageSquare className="w-8 h-8 md:w-10 md:h-10 text-white/10" />
                          </div>
                          <h4 className="text-base md:text-lg font-bold text-white mb-2">No selected conversation</h4>
                          <p className="text-xs md:text-sm text-white/30 max-w-[280px]">Select a user session from the sidebar to start responding to inquiries.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "notifications" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <SectionLabel>{editingNotif ? "Edit Notification" : "Send Notification"}</SectionLabel>
                      <div className="flex items-center gap-4">
                        {editingNotif && (
                          <button
                            onClick={() => {
                              setEditingNotif(null);
                              setNotifForm({
                                title: "",
                                message: "",
                                type: "sale",
                                targetType: "all",
                                targetUserId: "",
                                link: "",
                                isActive: true
                              });
                            }}
                            className="text-[10px] text-red-400 font-bold uppercase tracking-widest hover:text-red-300 transition-colors"
                          >
                            Cancel Edit
                          </button>
                        )}
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest text-right">
                          Broadcast coupons, updates, or alerts
                        </p>
                      </div>
                    </div>

                    {/* Send Form */}
                    <div className="p-6 rounded-2xl border border-white/8 bg-[#0d0d18] space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Notification Title *</label>
                          <input
                            value={notifForm.title}
                            onChange={e => setNotifForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g. Flash Sale Live! ⚡"
                            className={inputCls}
                          />
                        </div>
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className={labelCls}>Type</label>
                            <select
                              value={notifForm.type}
                              onChange={e => setNotifForm(prev => ({ ...prev, type: e.target.value as any }))}
                              className={inputCls}
                            >
                              <option value="sale" className="bg-[#0d0d18]">Flash Sale</option>
                              <option value="coupon" className="bg-[#0d0d18]">Coupon / Discount</option>
                              <option value="new_arrival" className="bg-[#0d0d18]">New Arrival</option>
                              <option value="restock" className="bg-[#0d0d18]">Restock Alert</option>
                            </select>
                          </div>
                          <div className="w-24">
                            <label className={labelCls}>Status</label>
                            <button
                              onClick={() => setNotifForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                              className={`w-full py-2.5 rounded-lg border text-xs font-bold transition-all ${notifForm.isActive
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                : "bg-red-500/10 border-red-500/30 text-red-400"
                                }`}
                            >
                              {notifForm.isActive ? "ACTIVE" : "INACTIVE"}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className={labelCls}>Message *</label>
                        <textarea
                          value={notifForm.message}
                          onChange={e => setNotifForm(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Enter the notification content..."
                          rows={2}
                          className={`${inputCls} resize-none`}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Target Audience</label>
                          <div className="flex gap-4 p-2 rounded-lg bg-white/3 border border-white/5">
                            <button
                              onClick={() => setNotifForm(prev => ({ ...prev, targetType: "all" }))}
                              className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${notifForm.targetType === "all" ? "bg-[#6c5ce7] text-white" : "text-white/30 hover:text-white/60"
                                }`}
                            >
                              All Users
                            </button>
                            <button
                              onClick={() => setNotifForm(prev => ({ ...prev, targetType: "specific" }))}
                              className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${notifForm.targetType === "specific" ? "bg-[#6c5ce7] text-white" : "text-white/30 hover:text-white/60"
                                }`}
                            >
                              Specific User
                            </button>
                          </div>
                        </div>

                        {notifForm.targetType === "specific" && (
                          <div>
                            <label className={labelCls}>Select User</label>
                            <select
                              value={notifForm.targetUserId}
                              onChange={e => setNotifForm(prev => ({ ...prev, targetUserId: e.target.value }))}
                              className={inputCls}
                            >
                              <option value="" className="bg-[#0d0d18]">Choose a user...</option>
                              {users.map(u => (
                                <option key={u.id} value={u.id} className="bg-[#0d0d18]">
                                  {u.fullName || u.email} ({u.email})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {notifForm.targetType === "all" && (
                          <div>
                            <label className={labelCls}>Action Link (Optional)</label>
                            <input
                              value={notifForm.link}
                              onChange={e => setNotifForm(prev => ({ ...prev, link: e.target.value }))}
                              placeholder="/sale or /product/123"
                              className={inputCls}
                            />
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleSendNotification}
                        disabled={sendingNotif}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl 
                    bg-[#6c5ce7] hover:bg-[#7c6cf7] text-white font-bold transition-all
                    shadow-lg shadow-[#6c5ce7]/10 disabled:opacity-50"
                      >
                        {sendingNotif ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                        {sendingNotif ? (editingNotif ? "Updating..." : "Sending...") : (editingNotif ? "Update Notification" : "Send Notification Now")}
                      </button>
                    </div>

                    {/* History */}
                    <div className="space-y-3">
                      <SectionLabel>Recent Notifications</SectionLabel>
                      <div className="space-y-2">
                        {adminNotifications.length === 0 ? (
                          <EmptyState title="No notifications sent" subtitle="Your broadcast history will appear here." />
                        ) : (
                          adminNotifications.map(notif => (
                            <div key={notif.id} className="p-4 rounded-xl border border-white/6 bg-[#0a0a14] flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.type === 'coupon' ? 'bg-emerald-500/10 text-emerald-500' :
                                notif.type === 'sale' ? 'bg-rose-500/10 text-rose-500' :
                                  notif.type === 'new_arrival' ? 'bg-blue-500/10 text-blue-500' :
                                    'bg-amber-500/10 text-amber-500'
                                }`}>
                                {notif.type === 'coupon' ? <TagIcon size={18} /> :
                                  notif.type === 'sale' ? <Star size={18} /> :
                                    notif.type === 'new_arrival' ? <Info size={18} /> :
                                      <Bell size={18} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-white truncate">{notif.title}</h4>
                                    {!notif.isActive && (
                                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-red-500/20 text-red-500 border border-red-500/30 uppercase">Draft</span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-mono text-white/20">
                                    {notif.target === 'all' ? 'BROADCAST' : 'PRIVATE'}
                                  </span>
                                </div>
                                <p className="text-xs text-white/40 line-clamp-1">{notif.message}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEditNotif(notif)}
                                  className="p-2 rounded-lg text-white/10 hover:text-white/80 hover:bg-white/5 transition-colors"
                                  title="Edit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm("Delete this notification?")) {
                                      await deleteDoc(doc(db, "notifications", notif.id));
                                      toast.success("Notification deleted");
                                      fetchAdminNotifications();
                                    }
                                  }}
                                  className="p-2 rounded-lg text-white/10 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "wishlists" && (
                  <div className="space-y-6 px-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <SectionLabel>Wishlist Analytics</SectionLabel>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">
                          Correlating user interest with product inventory
                        </p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-[#6c5ce7] animate-pulse" />
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                          {wishlistStats.length} Unique items
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                      {wishlistStats.length === 0 ? (
                        <EmptyState title="No wishlisted items" subtitle="User wishlists will appear here." />
                      ) : (
                        wishlistStats.map((item) => (
                          <motion.div
                            key={item.productId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -2 }}
                            className="group relative p-6 rounded-[2rem] border border-white/6 bg-[#0d0d18]/60 backdrop-blur-md overflow-hidden transition-all duration-300"
                          >
                            {/* Glass background effect */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#6c5ce7]/5 blur-3xl -mr-16 -mt-16 rounded-full" />
                            
                            <div className="relative flex flex-col md:flex-row gap-8 items-start">
                              {/* Enhanced Product Preview */}
                              <div className="relative shrink-0 mx-auto md:mx-0">
                                <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#6c5ce7] to-[#a855f7] rounded-[2rem] opacity-20 blur group-hover:opacity-40 transition-opacity duration-500" />
                                <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-[1.75rem] overflow-hidden border border-white/10 bg-black/40 shadow-2xl">
                                  <img 
                                    src={item.image} 
                                    alt={item.name} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                                </div>
                              </div>

                              {/* Content area */}
                              <div className="flex-1 w-full min-w-0">
                                <div className="flex flex-wrap items-center gap-3 mb-5">
                                  <h4 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate max-w-[250px] sm:max-w-md">
                                    {item.name}
                                  </h4>
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6c5ce7]/10 border border-[#6c5ce7]/20 text-[10px] font-black text-[#a855f7] uppercase tracking-wider shadow-lg shadow-purple-500/5">
                                    <Heart className="w-3 h-3 fill-current" />
                                    {item.count} SAVED
                                  </div>
                                </div>

                                {/* User attribution grid */}
                                <div className="space-y-3">
                                  <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">Interrested Customers</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                                    {item.users.map((u, i) => (
                                      <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group/u relative flex items-center gap-3 p-2.5 rounded-xl bg-white/3 border border-white/5 hover:border-[#6c5ce7]/30 transition-all"
                                      >
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-[10px] font-bold text-white/40 group-hover/u:from-[#6c5ce7] group-hover/u:to-[#a855f7] group-hover/u:text-white transition-all">
                                          {u.name[0].toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-[11px] font-bold text-white truncate leading-none mb-1 group-hover/u:text-[#6c5ce7] transition-colors">{u.name}</p>
                                          <p className="text-[9px] text-white/20 truncate font-mono tracking-tight">{u.email}</p>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "stockAlerts" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-2">
                      <SectionLabel>Restock Requests</SectionLabel>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                        Notify users when items return
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {stockAlerts.length === 0 ? (
                        <EmptyState title="No stock alerts" subtitle="Requests will appear when users tap 'Notify Me' on OOS items." />
                      ) : (
                        stockAlerts.map((alert) => (
                          <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl border border-white/6 bg-[#0d0d18] flex items-center justify-between gap-4 group"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <img src={alert.productImage} alt={alert.productName}
                                className="w-12 h-12 rounded-lg object-cover bg-white/5"
                                onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/80x80/111/444?text=Shoe"; }}
                              />
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-white truncate">{alert.productName}</h4>
                                <p className="text-xs text-white/40 truncate">{alert.userEmail}</p>
                                <p className="text-[9px] text-[#6c5ce7] font-bold uppercase tracking-widest mt-1">
                                  Requested on {alert.createdAt?.toDate()?.toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => deleteStockAlert(alert.id)}
                              className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Delete All Data Modal */}
      <AnimatePresence>
        {showDeleteAllModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteAllModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d18] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Delete All Data</h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    This will permanently delete all orders, notifications, and reviews.
                    This action cannot be undone.
                  </p>
                </div>

                {/* Warning */}
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-400">
                      <p className="font-semibold mb-1">⚠️ Danger Zone</p>
                      <p className="text-red-300/80 text-xs leading-relaxed">
                        You are about to delete {orders.length} orders, {adminNotifications.length} notifications,
                        and {reviews.length} reviews permanently.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className={labelCls}>Enter Admin Password</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    placeholder="Enter password to confirm"
                    className={inputCls}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteAllModal(false)}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-white/50
                      hover:text-white/80 text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAllData}
                    disabled={isDeleting || !deletePassword}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                      bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete All
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Helper sub-components ────────────────────────────────────────────────────

const EmptyState = ({
  title, subtitle, action,
}: {
  title: string;
  subtitle: string;
  action?: { label: string; onClick: () => void };
}) => (
  <div className="flex flex-col items-center justify-center py-24 px-6 rounded-[2rem]
    border border-dashed border-white/5 bg-white/[0.01] text-center">
    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
      <Package className="w-6 h-6 text-white/10" />
    </div>
    <h4 className="text-base font-bold text-white mb-2">{title}</h4>
    <p className="text-xs text-white/30 max-w-[240px] leading-relaxed mx-auto">{subtitle}</p>
    {action && (
      <button onClick={action.onClick}
        className="mt-8 px-8 py-3 rounded-2xl bg-[#6c5ce7] hover:bg-[#7c6cf7]
          text-white text-sm font-bold transition-all shadow-xl shadow-[#6c5ce7]/10 active:scale-95">
        {action.label}
      </button>
    )}
  </div>
);

const IconBtn = ({
  children, title, onClick, danger, disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) => (
  <button
    title={title}
    onClick={onClick}
    disabled={disabled}
    className={`p-1.5 rounded-lg transition-all disabled:opacity-50
      ${danger
        ? "text-white/30 hover:text-red-400 hover:bg-red-500/10"
        : "text-white/30 hover:text-white/80 hover:bg-white/6"
      }`}>
    {children}
  </button>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/5 md:hidden" />
    <span className="text-[10px] uppercase tracking-[0.3em] font-black text-[#6c5ce7]/60 whitespace-nowrap">
      {children}
    </span>
    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/5" />
  </div>
);

export default Admin;