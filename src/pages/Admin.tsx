import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Image as ImageIcon, AlertCircle, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  category: string;
  image: string;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  createdAt?: string;
}

const CATEGORIES = [
  "Womens Fashion",
  "Mens Fashion",
  "Electronics",
  "Accessories",
  "Home & Living",
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState<"products">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    originalPrice: "",
    category: "",
    description: "",
    image: "",
    rating: "4.5",
    reviews: "0",
    inStock: true,
  });

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

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
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm({
      name: "",
      price: "",
      originalPrice: "",
      category: "",
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

  const openEdit = (p: Product) => {
    setEditing(p);
    setImagePreview(p.image);
    setForm({
      name: p.name,
      price: String(p.price),
      originalPrice: p.originalPrice ? String(p.originalPrice) : "",
      category: p.category,
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
    setForm({ ...form, image: url });
    setImagePreview(url);
  };

  const handleSave = async () => {
    setError("");

    // Validation
    if (!form.name.trim()) {
      setError("Product name is required");
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      setError("Price must be greater than 0");
      return;
    }
    if (!form.category) {
      setError("Category is required");
      return;
    }
    if (!form.image.trim()) {
      setError("Image URL is required");
      return;
    }

    const rating = Number(form.rating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      setError("Rating must be between 0 and 5");
      return;
    }

    const newProduct = {
      name: form.name.trim(),
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
      category: form.category,
      description: form.description.trim(),
      image: form.image.trim(),
      rating: rating,
      reviews: Number(form.reviews) || 0,
      inStock: form.inStock,
      updatedAt: new Date().toISOString(),
    };

    try {
      setLoading(true);
      if (editing) {
        await updateDoc(doc(db, "products", editing.id), newProduct);
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

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        setDeleteLoading(id);
        await deleteDoc(doc(db, "products", id));
        toast.success("Product deleted successfully!");
        fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error("Failed to delete product");
      } finally {
        setDeleteLoading(null);
      }
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
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-red-600/20 blur-3xl"></div>
          <div className="relative p-4 sm:p-6 md:p-8 border border-purple-500/30 rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-900/50 via-purple-900/30 to-gray-900/50 backdrop-blur-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-1 sm:mb-2 leading-tight">
                  ADMIN CONTROL
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-purple-300/80">Manage your products</p>
              </div>
              <button
                onClick={openNew}
                className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-display text-xs sm:text-xs font-bold tracking-wider transition-all shadow-lg hover:shadow-purple-500/50 whitespace-nowrap flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">ADD</span>
                <span className="sm:hidden text-xs">NEW</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 sm:p-5 md:p-6 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 hover:border-blue-500/50 transition-colors"
          >
            <p className="text-xs sm:text-xs md:text-sm text-blue-400/80 mb-2 font-medium uppercase tracking-wider">Total Products</p>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-400">{products.length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 sm:p-5 md:p-6 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 hover:border-purple-500/50 transition-colors"
          >
            <p className="text-xs sm:text-xs md:text-sm text-purple-400/80 mb-2 font-medium uppercase tracking-wider">Total Value</p>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-400">
              ${products.reduce((sum, p) => sum + p.price, 0).toFixed(2)}
            </p>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 border-b border-border/50 overflow-x-auto mb-6 sm:mb-8 pb-2">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-3 sm:px-4 py-2 font-display text-xs sm:text-sm font-bold tracking-wider transition-all whitespace-nowrap relative ${
              activeTab === "products"
                ? "text-blue-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            PRODUCTS
            {activeTab === "products" && (
              <motion.div
                layoutId="adminTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500"
              />
            )}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-lg bg-card border border-border space-y-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between sticky top-0 bg-card pb-3 border-b border-border/30">
              <h2 className="font-display text-sm sm:text-base font-bold text-primary">
                {editing ? "EDIT PRODUCT" : "NEW PRODUCT"}
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
                value={form.image}
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
                  <span className="text-xs text-gray-400 truncate flex-1">{form.image}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Product Name *</label>
                <input
                  placeholder="e.g., Premium Runner X"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
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
                  value={form.originalPrice}
                  onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
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
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  placeholder="4.5"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-md bg-secondary border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-3">Select Category *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <label
                    key={cat}
                    className={`flex items-center p-2 sm:p-3 rounded-md border cursor-pointer transition text-xs sm:text-sm ${
                      form.category === cat
                        ? "border-cyan-400 bg-cyan-400/10"
                        : "border-border hover:border-cyan-400/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat}
                      checked={form.category === cat}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-4 h-4"
                    />
                    <span className="ml-2 font-medium">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Reviews</label>
                <input
                  type="number"
                  min="0"
                  value={form.reviews}
                  onChange={(e) => setForm({ ...form, reviews: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-md bg-secondary border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex items-center pt-2 sm:pt-7">
                <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    checked={form.inStock}
                    onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-foreground font-medium">In Stock</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Description</label>
              <textarea
                placeholder="Describe your product features and details..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
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

        {/* Products List */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg bg-card border border-border/50">
          <p className="text-xs sm:text-sm text-gray-400">
            Total Products: <span className="text-cyan-400 font-bold">{products.length}</span>
          </p>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {products.length === 0 ? (
            <div className="text-center py-8 sm:py-12 px-4 rounded-lg border border-border/50">
              <p className="text-xs sm:text-base text-gray-400 mb-2 sm:mb-4 font-medium">
                No products yet. Create one to get started!
              </p>
              <p className="text-xs text-gray-500">Click "+ ADD" and fill in the form with product details.</p>
            </div>
          ) : (
            products.map((p) => (
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
                    {p.category} · ${p.price.toFixed(2)}
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
                    onClick={() => openEdit(p)}
                    className="p-2 text-muted-foreground hover:text-cyan-400 transition-colors hover:bg-secondary rounded-md"
                    title="Edit product"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deleteLoading === p.id}
                    className="p-2 text-muted-foreground hover:text-red-400 transition-colors hover:bg-secondary rounded-md disabled:opacity-50"
                    title="Delete product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
