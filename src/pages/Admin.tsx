import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Image as ImageIcon, AlertCircle, X, ChevronRight, Sun, Moon, User, Shield } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

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
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  createdAt?: string;
}

interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  items: any[];
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

const Admin = () => {
  const [activeTab, setActiveTab] = useState<"brands" | "products" | "featured" | "customers" | "users">("brands");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
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
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [brandForm, setBrandForm] = useState({
    name: "",
    description: "",
    image: "",
  });

  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    originalPrice: "",
    description: "",
    image: "",
    rating: "4.5",
    reviews: "0",
    inStock: true,
  });

  // Fetch data on mount
  useEffect(() => {
    fetchBrands();
    fetchProducts();
    fetchOrders();
    fetchUsers();
  }, []);

  const fetchBrands = async () => {
    try {
      const brandsRef = collection(db, "brands");
      const snapshot = await getDocs(brandsRef);
      const fetchedBrands = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Brand));
      setBrands(fetchedBrands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error("Failed to fetch brands");
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsRef = collection(db, "products");
      const snapshot = await getDocs(productsRef);
      const fetchedProducts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Product));
      setProducts(fetchedProducts);
      
      // Load featured products
      const featured = new Set(
        fetchedProducts
          .filter((p) => (p as any).featured === true)
          .map((p) => p.id)
      );
      setFeaturedProducts(featured);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const ordersRef = collection(db, "orders");
      const snapshot = await getDocs(ordersRef);
      const fetchedOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Order)).sort((a, b) => {
        const timeA = a.createdAt?.toDate?.() || new Date(0);
        const timeB = b.createdAt?.toDate?.() || new Date(0);
        return timeB.getTime() - timeA.getTime();
      });
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    }
  };

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      const fetchedUsers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as AppUser));
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
      });
      toast.success(`Order status updated to ${newStatus}`);
      // Update local state instead of refetching to keep expanded section open
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const updateUserRole = async (userId: string, newRole: "user" | "admin") => {
    try {
      await updateDoc(doc(db, "users", userId), {
        role: newRole,
      });
      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  const openNewBrand = () => {
    setFormType("brand");
    setEditing(null);
    setBrandForm({
      name: "",
      description: "",
      image: "",
    });
    setImagePreview("");
    setError("");
    setShowForm(true);
  };

  const openNewProduct = () => {
    if (!selectedBrand) {
      toast.error("Please select a brand first");
      return;
    }
    setFormType("product");
    setEditing(null);
    setProductForm({
      name: "",
      price: "",
      originalPrice: "",
      description: "",
      image: "",
      rating: "4.5",
      reviews: "0",
      inStock: true,
    });
    setImagePreview("");
    setError("");
    setShowForm(true);
  };

  const openEditBrand = (b: Brand) => {
    setFormType("brand");
    setEditing(b);
    setImagePreview(b.image);
    setBrandForm({
      name: b.name,
      description: b.description || "",
      image: b.image,
    });
    setError("");
    setShowForm(true);
  };

  const openEditProduct = (p: Product) => {
    setFormType("product");
    setEditing(p);
    setImagePreview(p.image);
    setProductForm({
      name: p.name,
      price: String(p.price),
      originalPrice: p.originalPrice ? String(p.originalPrice) : "",
      description: p.description,
      image: p.image,
      rating: String(p.rating || 4.5),
      reviews: String(p.reviews || 0),
      inStock: p.inStock ?? true,
    });
    setError("");
    setShowForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    if (formType === "brand") {
      setBrandForm({ ...brandForm, image: url });
    } else {
      setProductForm({ ...productForm, image: url });
    }
    setImagePreview(url);
  };

  const handleSave = async () => {
    setError("");

    if (formType === "brand") {
      await saveBrand();
    } else {
      await saveProduct();
    }
  };

  const saveBrand = async () => {
    // Validation
    if (!brandForm.name.trim()) {
      setError("Brand name is required");
      return;
    }
    if (!brandForm.image.trim()) {
      setError("Brand image URL is required");
      return;
    }

    const newBrand = {
      name: brandForm.name.trim(),
      description: brandForm.description.trim(),
      image: brandForm.image.trim(),
      updatedAt: new Date().toISOString(),
    };

    try {
      setLoading(true);
      if (editing) {
        await updateDoc(doc(db, "brands", (editing as Brand).id), newBrand);
        toast.success("Brand updated successfully!");
      } else {
        await addDoc(collection(db, "brands"), {
          ...newBrand,
          createdAt: new Date().toISOString(),
        });
        toast.success("Brand created successfully!");
      }
      setShowForm(false);
      fetchBrands();
    } catch (error: unknown) {
      console.error("Error saving brand:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save brand";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveProduct = async () => {
    if (!selectedBrand) {
      setError("Please select a brand first");
      return;
    }

    // Validation
    if (!productForm.name.trim()) {
      setError("Product name is required");
      return;
    }
    if (!productForm.price || Number(productForm.price) <= 0) {
      setError("Price must be greater than 0");
      return;
    }
    if (!productForm.image.trim()) {
      setError("Image URL is required");
      return;
    }

    const rating = Number(productForm.rating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      setError("Rating must be between 0 and 5");
      return;
    }

    const newProduct = {
      name: productForm.name.trim(),
      price: Number(productForm.price),
      originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : null,
      brandId: selectedBrand.id,
      description: productForm.description.trim(),
      image: productForm.image.trim(),
      rating: rating,
      reviews: Number(productForm.reviews) || 0,
      inStock: productForm.inStock,
      updatedAt: new Date().toISOString(),
    };

    try {
      setLoading(true);
      if (editing) {
        await updateDoc(doc(db, "products", (editing as Product).id), newProduct);
        toast.success("Product updated successfully!");
      } else {
        await addDoc(collection(db, "products"), {
          ...newProduct,
          createdAt: new Date().toISOString(),
        });
        toast.success("Product created successfully!");
      }
      setShowForm(false);
      fetchProducts();
    } catch (error: unknown) {
      console.error("Error saving product:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save product";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: "brand" | "product") => {
    const confirmMessage = type === "brand" 
      ? "Are you sure you want to delete this brand? All products in this brand will still exist." 
      : "Are you sure you want to delete this product?";
    
    if (confirm(confirmMessage)) {
      try {
        setDeleteLoading(id);
        const collection_name = type === "brand" ? "brands" : "products";
        await deleteDoc(doc(db, collection_name, id));
        toast.success(`${type === "brand" ? "Brand" : "Product"} deleted successfully!`);
        
        if (type === "brand") {
          fetchBrands();
          if (selectedBrand?.id === id) {
            setSelectedBrand(null);
          }
        } else {
          fetchProducts();
        }
      } catch (error) {
        console.error("Error deleting:", error);
        toast.error(`Failed to delete ${type}`);
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  const toggleFeatured = async (productId: string) => {
    try {
      const isFeatured = featuredProducts.has(productId);
      const newFeaturedSet = new Set(featuredProducts);
      
      if (isFeatured) {
        newFeaturedSet.delete(productId);
      } else {
        newFeaturedSet.add(productId);
      }
      
      setFeaturedProducts(newFeaturedSet);
      
      // Update in Firestore
      await updateDoc(doc(db, "products", productId), {
        featured: !isFeatured,
      });
      
      toast.success(isFeatured ? "Removed from Featured Kicks" : "Added to Featured Kicks");
      fetchProducts();
    } catch (error) {
      console.error("Error toggling featured:", error);
      toast.error("Failed to update featured status");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-12">
        {/* Admin Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 md:mb-12 relative overflow-hidden rounded-lg sm:rounded-xl"
        >
          <div className={`absolute inset-0 bg-gradient-to-r ${isDarkMode ? "from-gray-600/20 via-slate-600/20 to-gray-600/20" : "from-gray-200/30 via-slate-200/30 to-gray-200/30"} blur-3xl`}></div>
          <div className={`relative p-4 sm:p-6 md:p-8 border rounded-lg sm:rounded-xl backdrop-blur-sm ${
            isDarkMode
              ? "border-gray-500/30 bg-gradient-to-br from-gray-800/50 via-gray-900/30 to-gray-800/50"
              : "border-gray-300 bg-gradient-to-br from-gray-50 via-white to-gray-50"
          }`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className={`font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 leading-tight ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                  ADMIN CONTROL
                </h1>
                <p className={`text-xs sm:text-sm md:text-base ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Manage your brands and shoes</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`p-2 sm:p-2.5 rounded-lg transition-all ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                  title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button
                  onClick={activeTab === "brands" ? openNewBrand : openNewProduct}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-white font-display text-xs sm:text-xs font-bold tracking-wider transition-all shadow-lg whitespace-nowrap ${
                    isDarkMode
                      ? "bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 hover:shadow-gray-500/30"
                      : "bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 hover:shadow-gray-400/30"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">ADD</span>
                  <span className="sm:hidden text-xs">NEW</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 sm:p-5 md:p-6 rounded-lg transition-colors ${
              isDarkMode
                ? "bg-gradient-to-br from-gray-600/10 to-slate-600/10 border border-gray-600/30 hover:border-gray-600/50"
                : "bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-300 hover:border-gray-400"
            }`}
          >
            <p className={`text-xs sm:text-xs md:text-sm mb-2 font-medium uppercase tracking-wider ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}>Total Brands</p>
            <p className={`text-2xl sm:text-3xl md:text-4xl font-bold ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>{brands.length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-4 sm:p-5 md:p-6 rounded-lg transition-colors ${
              isDarkMode
                ? "bg-gradient-to-br from-slate-600/10 to-gray-600/10 border border-slate-600/30 hover:border-slate-600/50"
                : "bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-300 hover:border-gray-400"
            }`}
          >
            <p className={`text-xs sm:text-xs md:text-sm mb-2 font-medium uppercase tracking-wider ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}>Total Products</p>
            <p className={`text-2xl sm:text-3xl md:text-4xl font-bold ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>
              ${products.reduce((sum, p) => sum + p.price, 0).toFixed(2)}
            </p>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 sm:gap-2 border-b overflow-x-auto mb-6 sm:mb-8 pb-2 ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}>
          <button
            onClick={() => {
              setActiveTab("brands");
              setShowForm(false);
            }}
            className={`px-3 sm:px-4 py-2 font-display text-xs sm:text-sm font-bold tracking-wider transition-all whitespace-nowrap relative ${
              activeTab === "brands"
                ? isDarkMode ? "text-gray-300" : "text-gray-800"
                : isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            BRANDS
            {activeTab === "brands" && (
              <motion.div
                layoutId="adminTab"
                className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${
                  isDarkMode ? "from-gray-500 to-gray-400" : "from-gray-600 to-gray-500"
                }`}
              />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("products");
              setShowForm(false);
            }}
            className={`px-3 sm:px-4 py-2 font-display text-xs sm:text-sm font-bold tracking-wider transition-all whitespace-nowrap relative ${
              activeTab === "products"
                ? isDarkMode ? "text-gray-300" : "text-gray-800"
                : isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            SHOES
            {activeTab === "products" && (
              <motion.div
                layoutId="adminTab"
                className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${
                  isDarkMode ? "from-gray-500 to-gray-400" : "from-gray-600 to-gray-500"
                }`}
              />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("featured");
              setShowForm(false);
            }}
            className={`px-3 sm:px-4 py-2 font-display text-xs sm:text-sm font-bold tracking-wider transition-all whitespace-nowrap relative ${
              activeTab === "featured"
                ? isDarkMode ? "text-gray-300" : "text-gray-800"
                : isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            FEATURED KICKS
            {activeTab === "featured" && (
              <motion.div
                layoutId="adminTab"
                className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${
                  isDarkMode ? "from-gray-500 to-gray-400" : "from-gray-600 to-gray-500"
                }`}
              />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("customers");
              setShowForm(false);
            }}
            className={`px-3 sm:px-4 py-2 font-display text-xs sm:text-sm font-bold tracking-wider transition-all whitespace-nowrap relative ${
              activeTab === "customers"
                ? isDarkMode ? "text-gray-300" : "text-gray-800"
                : isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            CUSTOMERS
            {activeTab === "customers" && (
              <motion.div
                layoutId="adminTab"
                className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${
                  isDarkMode ? "from-gray-500 to-gray-400" : "from-gray-600 to-gray-500"
                }`}
              />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("users");
              setShowForm(false);
            }}
            className={`px-3 sm:px-4 py-2 font-display text-xs sm:text-sm font-bold tracking-wider transition-all whitespace-nowrap relative ${
              activeTab === "users"
                ? isDarkMode ? "text-gray-300" : "text-gray-800"
                : isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            MANAGE USERS
            {activeTab === "users" && (
              <motion.div
                layoutId="adminTab"
                className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${
                  isDarkMode ? "from-gray-500 to-gray-400" : "from-gray-600 to-gray-500"
                }`}
              />
            )}
          </button>
        </div>

        {/* Form - Brand Form */}
        {showForm && formType === "brand" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-lg bg-card border border-border space-y-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between sticky top-0 bg-card pb-3 border-b border-border/30">
              <h2 className="font-display text-sm sm:text-base font-bold text-primary">
                {editing ? "EDIT BRAND" : "NEW BRAND"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 hover:bg-secondary rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 sm:p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex gap-2 text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* Image Preview and URL Input */}
            <div className="space-y-2 md:space-y-3">
              <label className="block text-xs sm:text-sm font-medium text-gray-300">Brand Image URL *</label>
              <input
                placeholder="https://example.com/image.jpg"
                value={brandForm.image}
                onChange={handleImageChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-md bg-secondary border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              {imagePreview && (
                <div className="mt-3 p-3 rounded-lg bg-secondary border border-border flex flex-col sm:flex-row sm:items-center gap-3">
                  <ImageIcon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <img
                    src={imagePreview}
                    alt="Preview"
                    onError={() => setImagePreview("")}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded object-cover flex-shrink-0"
                  />
                  <span className="text-xs text-gray-400 truncate flex-1">{brandForm.image}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Brand Name *</label>
              <input
                placeholder="e.g., Nike, Adidas, Jordan"
                value={brandForm.name}
                onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-md bg-secondary border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Description</label>
              <textarea
                placeholder="Describe your brand..."
                value={brandForm.description}
                onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                rows={3}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-md bg-secondary border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sticky bottom-0 bg-card border-t border-border/30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 sm:py-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-md bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-display text-xs sm:text-sm font-bold tracking-wider transition-all disabled:opacity-50 order-2 sm:order-1"
              >
                {loading ? "SAVING..." : editing ? "UPDATE" : "CREATE"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-md border border-border text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors order-1 sm:order-2"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* Form - Product Form */}
        {showForm && formType === "product" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-lg bg-card border border-border space-y-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between sticky top-0 bg-card pb-3 border-b border-border/30">
              <h2 className="font-display text-sm sm:text-base font-bold text-primary">
                {editing ? `EDIT SHOE - ${selectedBrand?.name}` : `NEW SHOE - ${selectedBrand?.name}`}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 hover:bg-secondary rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 sm:p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex gap-2 text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* Image Preview and URL Input */}
            <div className="space-y-2 md:space-y-3">
              <label className="block text-xs sm:text-sm font-medium text-gray-300">Image URL *</label>
              <input
                placeholder="https://example.com/image.jpg"
                value={productForm.image}
                onChange={handleImageChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-md bg-secondary border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              {imagePreview && (
                <div className="mt-3 p-3 rounded-lg bg-secondary border border-border flex flex-col sm:flex-row sm:items-center gap-3">
                  <ImageIcon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <img
                    src={imagePreview}
                    alt="Preview"
                    onError={() => setImagePreview("")}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded object-cover flex-shrink-0"
                  />
                  <span className="text-xs text-gray-400 truncate flex-1">{productForm.image}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Shoe Name *</label>
                <input
                  placeholder="e.g., Air Max 90"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-md bg-secondary border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Price ($) *</label>
                <input
                  placeholder="189.99"
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-md bg-secondary border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Original Price ($)</label>
                <input
                  placeholder="249.99"
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.originalPrice}
                  onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-md bg-secondary border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Rating (0-5) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={productForm.rating}
                  onChange={(e) => setProductForm({ ...productForm, rating: e.target.value })}
                  placeholder="4.5"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-md bg-secondary border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Reviews</label>
                <input
                  type="number"
                  min="0"
                  value={productForm.reviews}
                  onChange={(e) => setProductForm({ ...productForm, reviews: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-md bg-secondary border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex items-center pt-2 sm:pt-7">
                <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    checked={productForm.inStock}
                    onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-foreground font-medium">In Stock</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Description</label>
              <textarea
                placeholder="Describe your shoe features and details..."
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                rows={3}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-md bg-secondary border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sticky bottom-0 bg-card border-t border-border/30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 sm:py-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-md bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-display text-xs sm:text-sm font-bold tracking-wider transition-all disabled:opacity-50 order-2 sm:order-1"
              >
                {loading ? "SAVING..." : editing ? "UPDATE" : "CREATE"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-md border border-border text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors order-1 sm:order-2"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* BRANDS TAB */}
        {activeTab === "brands" && (
          <>
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg bg-card border border-border/50">
              <p className="text-xs sm:text-sm text-gray-400">
                Total Brands: <span className="text-cyan-400 font-bold">{brands.length}</span>
              </p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {brands.length === 0 ? (
                <div className="text-center py-8 sm:py-12 px-4 rounded-lg border border-border/50">
                  <p className="text-xs sm:text-base text-gray-400 mb-2 sm:mb-4 font-medium">
                    No brands yet. Create one to get started!
                  </p>
                  <p className="text-xs text-gray-500">Click "+ ADD" and fill in the brand details.</p>
                </div>
              ) : (
                brands.map((b) => {
                  const brandProductCount = products.filter(p => p.brandId === b.id).length;
                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex flex-col xs:flex-row xs:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-card border border-border hover:border-cyan-500/50 transition-colors"
                    >
                      <img
                        src={b.image}
                        alt={b.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/56?text=Image";
                        }}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-md object-cover flex-shrink-0 mx-auto xs:mx-0"
                      />
                      <div className="flex-1 min-w-0 text-center xs:text-left">
                        <h3 className="font-display text-xs sm:text-sm font-semibold truncate text-cyan-400">
                          {b.name}
                        </h3>
                        {b.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {b.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {brandProductCount} shoe{brandProductCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex gap-2 justify-center xs:justify-end self-center xs:self-auto">
                        <button
                          onClick={() => {
                            setSelectedBrand(b);
                            setActiveTab("products");
                          }}
                          className="p-2 text-muted-foreground hover:text-cyan-400 transition-colors hover:bg-secondary rounded-md"
                          title="View/manage shoes for this brand"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditBrand(b)}
                          className="p-2 text-muted-foreground hover:text-cyan-400 transition-colors hover:bg-secondary rounded-md"
                          title="Edit brand"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id, "brand")}
                          disabled={deleteLoading === b.id}
                          className="p-2 text-muted-foreground hover:text-red-400 transition-colors hover:bg-secondary rounded-md disabled:opacity-50"
                          title="Delete brand"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* PRODUCTS/SHOES TAB */}
        {activeTab === "products" && (
          <>
            {!selectedBrand ? (
              <div className="text-center py-12 px-4 rounded-lg border border-border/50">
                <p className="text-xs sm:text-base text-gray-400 mb-4 font-medium">
                  Please select a brand first to manage its shoes
                </p>
                <button
                  onClick={() => setActiveTab("brands")}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs sm:text-sm font-bold rounded-md transition-all"
                >
                  Go to Brands
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg bg-card border border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedBrand.image}
                      alt={selectedBrand.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://via.placeholder.com/40?text=Brand";
                      }}
                      className="w-10 h-10 rounded object-cover"
                    />
                    <div className="text-left">
                      <p className="text-xs sm:text-sm font-bold text-cyan-400">{selectedBrand.name}</p>
                      <p className="text-xs text-gray-400">
                        {products.filter(p => p.brandId === selectedBrand.id).length} shoe(s)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedBrand(null);
                      setShowForm(false);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    Change Brand
                  </button>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {products.filter(p => p.brandId === selectedBrand.id).length === 0 ? (
                    <div className="text-center py-8 sm:py-12 px-4 rounded-lg border border-border/50">
                      <p className="text-xs sm:text-base text-gray-400 mb-2 sm:mb-4 font-medium">
                        No shoes yet for {selectedBrand.name}. Add one to get started!
                      </p>
                      <p className="text-xs text-gray-500">Click "+ ADD" to create a new shoe.</p>
                    </div>
                  ) : (
                    products.filter(p => p.brandId === selectedBrand.id).map((p) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col xs:flex-row xs:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-card border border-border hover:border-cyan-500/50 transition-colors"
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://via.placeholder.com/56?text=Image";
                          }}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-md object-cover flex-shrink-0 mx-auto xs:mx-0"
                        />
                        <div className="flex-1 min-w-0 text-center xs:text-left">
                          <h3 className="font-display text-xs sm:text-sm font-semibold truncate text-cyan-400">
                            {p.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            ${p.price.toFixed(2)}
                          </p>
                          {p.originalPrice && (
                            <p className="text-xs text-gray-500 line-through">
                              ${p.originalPrice.toFixed(2)}
                            </p>
                          )}
                          {p.rating && (
                            <p className="text-xs text-yellow-400 mt-1">
                              ⭐ {p.rating} ({p.reviews || 0})
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 justify-center xs:justify-end self-center xs:self-auto">
                          <button
                            onClick={() => openEditProduct(p)}
                            className="p-2 text-muted-foreground hover:text-cyan-400 transition-colors hover:bg-secondary rounded-md"
                            title="Edit shoe"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, "product")}
                            disabled={deleteLoading === p.id}
                            className="p-2 text-muted-foreground hover:text-red-400 transition-colors hover:bg-secondary rounded-md disabled:opacity-50"
                            title="Delete shoe"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* FEATURED KICKS TAB */}
        {activeTab === "featured" && (
          <>
            <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-gray-50 border-gray-300"
            }`}>
              <p className={`text-xs sm:text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Featured Kicks: <span className={`font-bold ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>{featuredProducts.size}</span> / {products.length}
              </p>
              <p className={`text-xs mt-2 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                Select which shoes should appear in the Featured Kicks carousel on the homepage
              </p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {products.length === 0 ? (
                <div className={`text-center py-8 sm:py-12 px-4 rounded-lg border ${
                  isDarkMode
                    ? "border-gray-700"
                    : "border-gray-300"
                }`}>
                  <p className={`text-xs sm:text-base mb-2 sm:mb-4 font-medium ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                    No shoes yet. Create some products first!
                  </p>
                  <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>Add shoes in the SHOES tab before selecting featured kicks.</p>
                </div>
              ) : (
                products.map((product) => {
                  const isFeatured = featuredProducts.has(product.id);
                  const brand = brands.find((b) => b.id === product.brandId);
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex flex-col xs:flex-row xs:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border transition-colors ${
                        isFeatured
                          ? isDarkMode
                            ? "bg-green-900/30 border-green-700"
                            : "bg-green-50 border-green-300"
                          : isDarkMode
                          ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                          : "bg-white border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/56?text=Image";
                        }}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-md object-cover flex-shrink-0 mx-auto xs:mx-0"
                      />
                      <div className="flex-1 min-w-0 text-center xs:text-left">
                        <h3 className={`font-display text-xs sm:text-sm font-semibold truncate ${
                          isDarkMode ? "text-gray-200" : "text-gray-900"
                        }`}>
                          {product.name}
                        </h3>
                        <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                          {brand?.name} • ${product.price.toFixed(2)}
                        </p>
                        {product.rating && (
                          <p className={`text-xs mt-1 ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}>
                            ⭐ {product.rating} ({product.reviews || 0})
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => toggleFeatured(product.id)}
                        className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-display font-bold tracking-wider transition-all whitespace-nowrap flex-shrink-0 ${
                          isFeatured
                            ? "bg-green-600 hover:bg-green-500 text-white shadow-lg"
                            : isDarkMode
                            ? "border border-gray-600 text-gray-300 hover:text-gray-100 hover:border-gray-500"
                            : "border border-gray-400 text-gray-700 hover:text-gray-900 hover:border-gray-600"
                        }`}
                      >
                        {isFeatured ? "✓ FEATURED" : "+ ADD"}
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === "customers" && (
          <>
            <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-gray-50 border-gray-300"
            }`}>
              <p className={`text-xs sm:text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Total Orders: <span className={`font-bold ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>{orders.length}</span>
              </p>
            </div>

            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className={`text-center py-8 sm:py-12 px-4 rounded-lg border ${
                  isDarkMode
                    ? "border-gray-700"
                    : "border-gray-300"
                }`}>
                  <p className={`text-xs sm:text-base font-medium ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                    No orders yet
                  </p>
                </div>
              ) : (
                orders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-lg border cursor-pointer transition-colors ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                        : "bg-white border-gray-300 hover:border-gray-400"
                    }`}
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  >
                    {/* Order Header */}
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                        <div>
                          <h3 className={`font-display font-bold mb-1 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                            {order.customerName}
                          </h3>
                          <p className={`text-xs sm:text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {order.email} • {order.phone}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Order #{order.id.slice(0, 8)}</p>
                          <p className={`text-lg sm:text-xl font-bold ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
                            ${order.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedOrder === order.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className={`border-t p-4 sm:p-5 space-y-4 ${
                          isDarkMode ? "border-gray-700 bg-gray-700/20" : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        {/* Items */}
                        <div>
                          <p className={`text-xs font-bold mb-3 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                            ITEMS ORDERED ({order.items.length})
                          </p>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className={`flex gap-3 p-3 rounded border transition-colors ${
                                isDarkMode
                                  ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                                  : "bg-white border-gray-300 hover:border-gray-400"
                              }`}>
                                {/* Product Image */}
                                {item.image && (
                                  <div className={`flex-shrink-0 w-14 h-14 rounded overflow-hidden ${
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
                                  <div className="flex justify-between items-start gap-2 mb-1">
                                    <span className={`text-xs sm:text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                                      {item.productName}
                                    </span>
                                    <span className={`text-xs sm:text-sm font-bold flex-shrink-0 ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>
                                      ${(item.price * item.quantity).toFixed(2)}
                                    </span>
                                  </div>
                                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                    Qty: {item.quantity} × ${item.price.toFixed(2)}
                                  </p>
                                  {item.size && (
                                    <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                      Size: {item.size}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className={`p-3 rounded border space-y-2 text-xs ${
                          isDarkMode
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-gray-300"
                        }`}>
                          <div className="flex justify-between">
                            <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Subtotal</span>
                          </div>
                          <div className={`flex justify-between font-bold pt-2 border-t ${
                            isDarkMode ? "border-gray-700" : "border-gray-300"
                          }`}>
                            <span className={isDarkMode ? "text-gray-200" : "text-gray-900"}>Total</span>
                            <span className={isDarkMode ? "text-blue-400" : "text-blue-600"}>${order.total.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Delivery Address */}
                        <div>
                          <p className={`text-xs font-bold mb-2 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                            DELIVERY ADDRESS
                          </p>
                          <div className={`p-3 rounded border text-xs ${
                            isDarkMode
                              ? "bg-gray-800 border-gray-700"
                              : "bg-white border-gray-300"
                          }`}>
                            <p className={`font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>Customer Info</p>
                            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>{order.customerName}</p>
                            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>{order.email}</p>
                            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Phone: {order.phone}</p>
                            <div className="border-t my-2" style={{ borderColor: isDarkMode ? "#4b5563" : "#d1d5db" }}></div>
                            <p className="font-medium">Address</p>
                            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>{order.address}</p>
                            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                              {order.city}, {order.zipCode}
                            </p>
                          </div>
                        </div>

                        {/* Update Order Status */}
                        <div>
                          <p className={`text-xs font-bold mb-3 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                            UPDATE ORDER STATUS
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"].map(
                              (statusStep) => (
                                <button
                                  key={statusStep}
                                  onClick={() => handleStatusChange(order.id, statusStep)}
                                  disabled={updatingStatus === order.id}
                                  className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                    order.status === statusStep
                                      ? "bg-blue-600 text-white"
                                      : isDarkMode
                                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                  } disabled:opacity-50`}
                                >
                                  {statusStep.replace("_", " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ").substring(0, 8)}
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        {/* Order Timeline */}
                        <div>
                          <p className={`text-xs font-bold mb-3 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                            ORDER TIMELINE
                          </p>
                          <div className="space-y-2">
                            {["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"].map(
                              (statusStep) => (
                                <div key={statusStep} className="flex items-center gap-3 text-xs">
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      ["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"]
                                        .indexOf(statusStep) <=
                                      ["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"].indexOf(
                                        order.status
                                      )
                                        ? "bg-blue-500"
                                        : isDarkMode ? "bg-gray-700" : "bg-gray-300"
                                    }`}
                                  />
                                  <span
                                    className={
                                      ["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"].indexOf(
                                        statusStep
                                      ) <=
                                      ["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"].indexOf(
                                        order.status
                                      )
                                        ? isDarkMode ? "text-gray-200" : "text-gray-900"
                                        : isDarkMode ? "text-gray-400" : "text-gray-600"
                                    }
                                  >
                                    {statusStep.replace("_", " ").toUpperCase()}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </>
        )}

        {/* MANAGE USERS TAB */}
        {activeTab === "users" && (
          <>
            <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-gray-50 border-gray-300"
            }`}>
              <p className={`text-xs sm:text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Total Users: <span className={`font-bold ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>{users.length}</span>
              </p>
              <p className={`text-xs mt-2 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                Click to change user roles between User and Admin
              </p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {users.length === 0 ? (
                <div className={`text-center py-8 sm:py-12 px-4 rounded-lg border ${
                  isDarkMode
                    ? "border-gray-700"
                    : "border-gray-300"
                }`}>
                  <p className={`text-xs sm:text-base font-medium ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                    No users found
                  </p>
                </div>
              ) : (
                users.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex flex-col xs:flex-row xs:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border transition-colors ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                        : "bg-white border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs sm:text-sm font-semibold truncate ${
                        isDarkMode ? "text-gray-200" : "text-gray-900"
                      }`}>
                        {user.email}
                      </p>
                      <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        ID: {user.id.slice(0, 12)}...
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => user.role !== "user" && updateUserRole(user.id, "user")}
                        className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-display font-bold tracking-wider transition-all whitespace-nowrap flex-shrink-0 ${
                          user.role === "user"
                            ? isDarkMode
                              ? "bg-blue-600 hover:bg-blue-500 text-white"
                              : "bg-blue-500 hover:bg-blue-600 text-white"
                            : isDarkMode
                            ? "border border-gray-600 text-gray-400 hover:text-gray-200"
                            : "border border-gray-400 text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        USER
                      </button>
                      <button
                        onClick={() => user.role !== "admin" && updateUserRole(user.id, "admin")}
                        className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-display font-bold tracking-wider transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1 ${
                          user.role === "admin"
                            ? isDarkMode
                              ? "bg-purple-600 hover:bg-purple-500 text-white"
                              : "bg-purple-500 hover:bg-purple-600 text-white"
                            : isDarkMode
                            ? "border border-gray-600 text-gray-400 hover:text-gray-200"
                            : "border border-gray-400 text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                        ADMIN
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
