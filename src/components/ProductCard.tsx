import { Heart, Plus } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import SizeSelectionPopup from "./SizeSelectionPopup";
import { toast } from "sonner";

const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [showSizePopup, setShowSizePopup] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const isOutOfStock = product.inStock === false;

  // GSAP hover animation for subtle smooth zoom
  useEffect(() => {
    if (imageRef.current) {
      if (isHovered) {
        gsap.to(imageRef.current, {
          scale: 1.05,
          duration: 0.6,
          ease: "power2.out"
        });
      } else {
        gsap.to(imageRef.current, {
          scale: 1,
          duration: 0.4,
          ease: "power2.out"
        });
      }
    }
  }, [isHovered]);

  // Touch device detection
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) {
      toast.error("Out of Stock", { description: "This item is currently unavailable." });
      return;
    }
    if (product.sizes && product.sizes.length > 0) {
      setShowSizePopup(true);
    } else {
      addToCart(product);
      toast.success("Added to cart!", {
        description: product.name,
        duration: 2000,
      });
    }
  };

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container - SQUARE */}
      <Link
        to={`/product/${product.id}`}
        className="block relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-[#F5F5F7] dark:bg-[#1C1C1E] mb-2"
      >
        <img
          ref={imageRef}
          src={product.image}
          alt={product.name}
          className={`absolute inset-0 w-full h-full object-cover will-change-transform transition-opacity duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />

        {/* Skeleton shimmer while loading */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent animate-pulse" />
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-foreground/70 bg-background/80 px-3 py-1.5 rounded-full border border-border">
              Out of Stock
            </span>
          </div>
        )}

        {/* Badge */}
        {product.badge && !isOutOfStock && (
          <span
            className={`absolute top-2 left-2 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full z-10 ${
              product.badge === "sale"
                ? "bg-sale text-sale-foreground"
                : "bg-foreground text-background"
            }`}
          >
            {product.badge}
          </span>
        )}

        {/* Quick add - minimal '+' button */}
        {!isOutOfStock && (
          <div
            className={`absolute bottom-2 right-2 transition-all duration-300 z-20 ${
              isTouchDevice ? "opacity-100" : "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
            }`}
          >
            <motion.button
              onClick={handleQuickAdd}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-foreground text-background rounded-full shadow-lg hover:scale-110 mb-1 transition-transform"
              aria-label="Quick Add"
            >
              <Plus size={16} strokeWidth={2.5} />
            </motion.button>
          </div>
        )}
      </Link>

      {/* Wishlist Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist(product.id);
          if (!isInWishlist(product.id)) {
            toast.success("Added to wishlist", { duration: 1500 });
          }
        }}
        className="absolute top-2 right-2 p-1 bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-full text-foreground hover:text-sale transition-all z-20"
        aria-label="Wishlist"
      >
        <Heart
          size={12}
          fill={isInWishlist(product.id) ? "currentColor" : "none"}
          className={isInWishlist(product.id) ? "text-sale" : ""}
        />
      </button>

      {/* Product Info - Minimalist Editorial Style */}
      <Link to={`/product/${product.id}`} className="block px-1">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-[11px] sm:text-[13px] font-medium text-foreground/90 line-clamp-1 mb-0 tracking-tight">
              {product.name}
            </h3>
            <p className="text-[9px] sm:text-[11px] text-muted-foreground/50 uppercase tracking-[0.08em] font-bold">
              {product.brandId?.replace(/-/g, ' ') || 'Streetwear'}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-[12px] sm:text-[14px] font-bold tracking-tight ${isOutOfStock ? "text-muted-foreground/50" : "text-foreground"}`}>
              ₹{product.price.toLocaleString('en-IN')}
            </p>
            {product.originalPrice && (
              <p className="text-[9px] text-muted-foreground/40 line-through tracking-tighter">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* Size Selection Popup */}
      <SizeSelectionPopup
        product={product}
        isOpen={showSizePopup}
        onClose={() => setShowSizePopup(false)}
      />
    </div>
  );
};

export default ProductCard;
