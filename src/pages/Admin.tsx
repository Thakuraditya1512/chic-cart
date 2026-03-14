import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import OrderAnalytics from "@/components/OrderAnalytics"; // ← add this import
import {
  Plus, Pencil, Trash2, Image as ImageIcon, AlertCircle, X,
  ChevronRight, User, Shield, Tag, Package, Star, LayoutDashboard, Ticket,
  Upload, ChevronDown, ChevronUp, CheckCircle2, Circle, Loader2, Navigation
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

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
  createdAt?: string;
}

type TabId = "brands" | "products" | "featured" | "customers" | "users" | "coupons";

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
  pending: "text-amber-400  bg-amber-400/10  border-amber-400/30",
  confirmed: "text-blue-400   bg-blue-400/10   border-blue-400/30",
  packed: "text-indigo-400 bg-indigo-400/10 border-indigo-400/30",
  shipped: "text-violet-400 bg-violet-400/10 border-violet-400/30",
  out_for_delivery: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  delivered: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
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
  const [activeTab, setActiveTab] = useState<TabId>("brands");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
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

  const [brandForm, setBrandForm] = useState({ name: "", description: "", image: "" });

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
  }, []);

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
          .sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setCoupons(list);
      } catch (innerError) {
        toast.error("Failed to fetch coupons");
      }
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
    { id: "brands" as TabId, label: "Brands", icon: Tag, count: brands.length },
    { id: "products" as TabId, label: "Shoes", icon: Package, count: products.length },
    { id: "featured" as TabId, label: "Featured", icon: Star, count: featuredProducts.size },
    { id: "customers" as TabId, label: "Orders", icon: LayoutDashboard, count: orders.length },
    { id: "users" as TabId, label: "Users", icon: Shield, count: users.length },
    { id: "coupons" as TabId, label: "Coupons", icon: Ticket, count: coupons.length },
  ];

  // ─── Shared form input class ────────────────────────────────────────────────

  const inputCls = `w-full px-4 py-2.5 rounded-lg bg-[#0d0d14] border border-white/8
    text-sm text-white placeholder:text-white/25
    focus:outline-none focus:border-[#6c5ce7]/60 transition-colors`;

  const labelCls = "block text-[11px] font-semibold tracking-widest text-white/40 uppercase mb-1.5";

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#08080f] text-white flex flex-col md:flex-row font-sans">

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className="w-full md:w-60 lg:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/6
        bg-[#0a0a13] flex flex-col md:h-screen md:sticky md:top-0 z-40">

        {/* Logo */}
        <div className="px-7 py-8 hidden md:block">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6c5ce7] to-[#a855f7] flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">KickAdmin</span>
          </div>
          <p className="text-[11px] text-white/30 tracking-widest uppercase pl-9">Control Panel</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 md:px-4 pb-4 md:pb-6 overflow-x-auto md:overflow-y-auto
          flex md:flex-col gap-1 md:gap-0.5 no-scrollbar pt-3 md:pt-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setShowForm(false); }}
                className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm
                  font-medium transition-all whitespace-nowrap md:whitespace-normal w-full text-left
                  group ${active
                    ? "bg-[#6c5ce7]/15 text-white"
                    : "text-white/40 hover:text-white/70 hover:bg-white/4"
                  }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5
                    rounded-r bg-[#6c5ce7]" />
                )}
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-[#6c5ce7]" : ""}`} />
                <span className="flex-1">{tab.label}</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-mono
                  ${active ? "bg-[#6c5ce7]/20 text-[#a78bfa]" : "bg-white/5 text-white/25"}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom badge */}
        <div className="hidden md:block px-5 py-5 border-t border-white/6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#a855f7]
              flex items-center justify-center text-[11px] font-bold">A</div>
            <div>
              <p className="text-xs font-semibold text-white/80">Administrator</p>
              <p className="text-[10px] text-white/30">Full access</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-auto">
        {/* Page header */}
        <header className="sticky top-0 z-30 bg-[#08080f]/90 backdrop-blur border-b border-white/6
          px-6 md:px-10 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
            <p className="text-[11px] text-white/30 tracking-wider uppercase mt-0.5">
              {activeTab === "brands" && `${brands.length} registered brands`}
              {activeTab === "products" && `${products.length} total products`}
              {activeTab === "featured" && `${featuredProducts.size} featured`}
              {activeTab === "customers" && `${orders.length} orders`}
              {activeTab === "users" && `${users.length} registered users`}
            </p>
          </div>

          {(activeTab === "brands" || activeTab === "products") && (
            <button
              onClick={activeTab === "brands" ? openNewBrand : openNewProduct}
              className="flex items-center gap-2 px-4 py-2 rounded-lg
                bg-[#6c5ce7] hover:bg-[#7c6cf7] text-white text-sm font-semibold transition-all
                shadow-lg shadow-[#6c5ce7]/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add New
            </button>
          )}
        </header>

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
                          {p.rating && (
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

              {/* ── Orders List ── */}
              <div className="pt-2 pb-1">
                <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest text-[11px]">Order History</h3>
              </div>

              {orders.length === 0 ? (
                <EmptyState title="No orders yet" subtitle="Orders will appear here when customers check out." />
              ) : (
                orders.map(order => {
                  const expanded = expandedOrder === order.id;
                  const statusIdx = ORDER_STATUSES.indexOf(order.status as any);
                  return (
                    <div key={order.id}
                      className="rounded-2xl border border-white/6 bg-[#0d0d18] overflow-hidden">
                      {/* Order row */}
                      <button
                        onClick={() => setExpandedOrder(expanded ? null : order.id)}
                        className="w-full flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0
                          justify-between p-5 text-left hover:bg-white/2 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center
                            justify-center text-xs font-bold text-white/40 flex-shrink-0">
                            {order.customerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm">{order.customerName}</p>
                            <p className="text-xs text-white/35">{order.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 sm:gap-6 ml-13">
                          <div>
                            <p className="text-[10px] text-white/25 uppercase tracking-widest">Order</p>
                            <p className="text-xs font-mono text-white/50">#{order.id.slice(0, 8)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-white/25 uppercase tracking-widest">Total</p>
                            <p className="text-sm font-bold text-white">₹{order.total.toLocaleString('en-IN')}</p>
                          </div>
                          <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border
                            ${STATUS_COLORS[order.status] || "text-white/40 bg-white/5 border-white/10"}`}>
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                          {expanded
                            ? <ChevronUp className="w-4 h-4 text-white/25 flex-shrink-0" />
                            : <ChevronDown className="w-4 h-4 text-white/25 flex-shrink-0" />}
                        </div>
                      </button>

                      {/* Expanded details */}
                      <AnimatePresence>
                        {expanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-white/6 overflow-hidden">
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
                                          {item.size && ` · Size ${item.size}`}
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
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4
                      rounded-xl border border-white/6 bg-[#0d0d18] hover:border-white/12 transition-all">
                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center
                      justify-center text-sm font-bold text-white/40 flex-shrink-0">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                      <p className="text-[11px] text-white/30 mt-0.5 font-mono">
                        ID: {user.id.slice(0, 14)}…
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => user.role !== "user" && updateUserRole(user.id, "user")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all
                          ${user.role === "user"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "border border-white/10 text-white/30 hover:text-white/60"
                          }`}>
                        User
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
                        Admin
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {activeTab === "coupons" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <SectionLabel>Generated Coupons</SectionLabel>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                  Auto-generated on product reviews
                </p>
              </div>
              
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
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          coupon.isUsed ? "bg-white/5 text-white/20" : "bg-green-500/20 text-green-400"
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

        </div>
      </main>
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
  <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl
    border border-dashed border-white/8 text-center">
    <p className="text-sm font-semibold text-white/50 mb-1">{title}</p>
    <p className="text-xs text-white/25">{subtitle}</p>
    {action && (
      <button onClick={action.onClick}
        className="mt-5 px-5 py-2 rounded-lg bg-[#6c5ce7] hover:bg-[#7c6cf7]
          text-white text-sm font-semibold transition-all">
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
  <p className="text-[10px] uppercase tracking-widest font-bold text-white/25">{children}</p>
);

export default Admin;