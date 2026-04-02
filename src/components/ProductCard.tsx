import { Heart, Star, Plus } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import SizeSelectionPopup from "./SizeSelectionPopup";

const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [showSizePopup, setShowSizePopup] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

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
          className="absolute inset-0 w-full h-full object-cover will-change-transform"
          loading="lazy"
        />

        {/* Badge */}
        {product.badge && (
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
        <div
          className={`absolute bottom-2 right-2 transition-all duration-300 z-20 ${
            isTouchDevice ? "opacity-100" : "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
          }`}
        >
          <motion.button
            onClick={(e) => {
              e.preventDefault();
              if (product.sizes && product.sizes.length > 0) {
                setShowSizePopup(true);
              } else {
                addToCart(product);
              }
            }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-foreground text-background rounded-full shadow-lg hover:scale-110 mb-1 transition-transform"
            aria-label="Quick Add"
          >
            <Plus size={16} strokeWidth={2.5} />
          </motion.button>
        </div>
      </Link>

      {/* Wishlist Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist(product.id);
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
            <p className="text-[12px] sm:text-[14px] font-bold text-foreground tracking-tight">
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
