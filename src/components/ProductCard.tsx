import { Heart, ShoppingBag, Star } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";

const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();
  const [wishlisted, setWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);

  // GSAP hover animation
  useEffect(() => {
    if (imageRef.current) {
      if (isHovered) {
        gsap.to(imageRef.current, {
          scale: 1.1,
          duration: 0.7,
          ease: "power3.out"
        });
      } else {
        gsap.to(imageRef.current, {
          scale: 1,
          duration: 0.5,
          ease: "power3.out"
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
      ref={cardRef}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <Link
        to={`/product/${product.id}`}
        className="block relative aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden bg-secondary mb-3"
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
            className={`absolute top-2 sm:top-3 left-2 sm:left-3 text-[8px] sm:text-[9px] font-sans font-bold uppercase tracking-[0.1em] px-2 sm:px-3 py-1 rounded-full ${product.badge === "sale"
                ? "bg-sale text-sale-foreground"
                : "bg-foreground text-background"
              }`}
          >
            {product.badge}
          </span>
        )}

        {/* Quick add overlay - visible on hover for desktop, always visible on touch */}
        <div
          ref={quickAddRef}
          className={`absolute bottom-0 left-0 right-0 p-2 sm:p-3 transition-transform duration-300 ease-out ${isTouchDevice ? "translate-y-0" : "translate-y-full group-hover:translate-y-0"
            }`}
        >
          <motion.button
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            whileTap={{ scale: 0.95 }}
            className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-sans font-semibold uppercase tracking-[0.15em] hover:opacity-90 transition-opacity shadow-lg"
          >
            <ShoppingBag size={12} />
            Add to Cart
          </motion.button>
        </div>
      </Link>

      {/* Wishlist */}
      <button
        onClick={() => setWishlisted(!wishlisted)}
        className="absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-2 bg-background/80 backdrop-blur-sm rounded-full text-foreground hover:text-sale transition-colors z-10"
        aria-label="Wishlist"
      >
        <Heart
          size={14}
          fill={wishlisted ? "currentColor" : "none"}
          className={wishlisted ? "text-sale" : ""}
        />
      </button>

      {/* Info */}
      <Link to={`/product/${product.id}`} className="block">
        <h3 className="text-xs sm:text-sm font-sans font-medium text-foreground line-clamp-2 mb-1">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 mb-1">
          <Star size={11} className="fill-foreground text-foreground" />
          <span className="text-[10px] sm:text-[11px] text-muted-foreground font-sans">
            {product.rating || 0}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm sm:text-base font-sans font-semibold text-foreground">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.originalPrice && (
            <span className="text-xs sm:text-sm text-muted-foreground/60 line-through font-sans">
              ₹{product.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
