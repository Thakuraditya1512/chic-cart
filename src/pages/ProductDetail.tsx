import { useParams, Link } from "react-router-dom";
import { products } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { ArrowLeft, Heart, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import CartDrawer from "@/components/CartDrawer";
import SearchOverlay from "@/components/SearchOverlay";
import ProductCard from "@/components/ProductCard";

const ProductDetail = () => {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Product not found</p>
          <Link to="/" className="text-foreground underline underline-offset-4">Go back</Link>
        </div>
      </div>
    );
  }

  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <Header onSearchOpen={() => setSearchOpen(true)} />
      <main className="container mx-auto px-4 py-6 md:py-12 pb-20 md:pb-12">
        {/* Breadcrumb */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft size={16} />
          Back to shop
        </Link>

        <div className="grid md:grid-cols-2 gap-8 md:gap-16">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary cursor-zoom-in"
            onClick={() => setImageZoomed(!imageZoomed)}
          >
            <img
              src={product.image}
              alt={product.name}
              className={`w-full h-full object-cover transition-transform duration-500 ${imageZoomed ? "scale-150" : "scale-100"}`}
            />
            {product.badge && (
              <span className={`absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm ${
                product.badge === "sale" ? "bg-sale text-sale-foreground" : "bg-badge text-badge-foreground"
              }`}>
                {product.badge}
              </span>
            )}
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{product.category}</p>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">{product.name}</h1>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < Math.floor(product.rating) ? "fill-foreground text-foreground" : "text-border"} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{product.rating}</span>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl font-bold text-foreground">${product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">${product.originalPrice.toFixed(2)}</span>
              )}
              {product.originalPrice && (
                <span className="text-xs font-bold uppercase px-2 py-1 bg-sale text-sale-foreground rounded-sm">
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Sizes */}
            {product.sizes && (
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[44px] h-11 px-4 text-sm font-medium rounded-sm border transition-colors ${
                        selectedSize === size
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-foreground hover:border-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-border rounded-sm">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <Minus size={16} />
                </button>
                <span className="w-11 h-11 flex items-center justify-center text-sm font-medium text-foreground border-x border-border">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <Plus size={16} />
                </button>
              </div>
              <button
                onClick={() => addToCart(product, qty)}
                className="flex-1 flex items-center justify-center gap-2 h-11 bg-primary text-primary-foreground font-medium text-sm uppercase tracking-wider hover:opacity-90 transition-opacity rounded-sm"
              >
                <ShoppingBag size={16} />
                Add to Cart
              </button>
              <button
                onClick={() => setWishlisted(!wishlisted)}
                className="w-11 h-11 flex items-center justify-center border border-border rounded-sm text-foreground hover:text-sale transition-colors"
              >
                <Heart size={18} fill={wishlisted ? "currentColor" : "none"} className={wishlisted ? "text-sale" : ""} />
              </button>
            </div>

            {/* Colors */}
            {product.colors && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2">Available Colors</p>
                <p className="text-sm text-muted-foreground">{product.colors.join(", ")}</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16 md:mt-24">
            <h2 className="font-display text-2xl font-bold text-foreground mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <BottomNav onSearchOpen={() => setSearchOpen(true)} />
      <CartDrawer />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export default ProductDetail;
