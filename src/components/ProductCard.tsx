import { Heart, Plus, Bell, Loader2 } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import SizeSelectionPopup from "./SizeSelectionPopup";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [showSizePopup, setShowSizePopup] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [notifying, setNotifying] = useState(false);
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

  const handleNotifyMe = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.info("Login to set restock alerts", {
        action: { label: "Login", onClick: () => navigate("/login") }
      });
      return;
    }

    try {
      setNotifying(true);
      await addDoc(collection(db, "stock_notifications"), {
        userId: user.uid,
        userEmail: user.email,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        createdAt: serverTimestamp(),
        status: "pending"
      });
      toast.success("Alert Set!", { 
        description: `We'll email you when ${product.name} is back.`
      });
    } catch (err) {
      toast.error("Failed to notify");
    } finally {
      setNotifying(false);
    }
  };

  return (
    <motion.div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Image Container - SQUARE */}
      <Link
        to={`/product/${product.id}`}
        className="block relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-[#F5F5F7] dark:bg-[#1C1C1E] mb-3 group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-500"
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

        {/* Glossy Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/5 backdrop-blur-[8px] flex items-center justify-center z-10 p-2">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 dark:bg-black/60 backdrop-blur-xl px-4 py-3 rounded-[2rem] border border-white/20 shadow-2xl flex flex-col items-center gap-2"
            >
              <div className="flex flex-col items-center gap-0.5 pointer-events-none">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-red-500">
                  Out of Stock
                </span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-amber-500/80">
                  Restocking Soon
                </span>
              </div>
              
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={handleNotifyMe}
                disabled={notifying}
                className="flex items-center gap-2.5 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-full border border-emerald-500/20 transition-all active:scale-95 group"
              >
                {notifying ? (
                   <Loader2 size={12} className="animate-spin text-emerald-500" />
                ) : (
                   <Bell size={12} className="text-emerald-500 group-hover:animate-bounce" />
                )}
                <span className="text-[9px] font-black uppercase tracking-widest">
                  Notify Me
                </span>
              </motion.button>
            </motion.div>
          </div>
        )}

        {/* Badge */}
        {product.badge && !isOutOfStock && (
          <span
            className={`absolute top-4 left-4 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full z-10 shadow-lg ${product.badge === "sale"
                ? "bg-red-500 text-white"
                : "bg-white text-black"
              }`}
          >
            {product.badge}
          </span>
        )}

        {/* Quick add - elegant floating button */}
        {!isOutOfStock && (
          <div
            className={`absolute bottom-4 right-4 transition-all duration-500 z-20 ${isTouchDevice ? "opacity-100" : "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
              }`}
          >
            <motion.button
              onClick={handleQuickAdd}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white dark:bg-zinc-900 text-black dark:text-white rounded-full shadow-2xl border border-black/5 dark:border-white/10 transition-all"
              aria-label="Quick Add"
            >
              <Plus size={20} strokeWidth={2.5} />
            </motion.button>
          </div>
        )}
      </Link>

      {/* Wishlist Button */}
      <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.8 }}
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist(product.id);
          if (!isInWishlist(product.id)) {
            toast.success("Added to wishlist", { duration: 1500 });
          }
        }}
        className="absolute top-4 right-4 p-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-full text-foreground hover:text-red-500 transition-all z-20 shadow-lg border border-black/5 dark:border-white/10"
        aria-label="Wishlist"
      >
        <Heart
          size={14}
          fill={isInWishlist(product.id) ? "currentColor" : "none"}
          className={isInWishlist(product.id) ? "text-red-500" : ""}
        />
      </motion.button>

      {/* Product Info - Refined Editorial Style */}
      <Link to={`/product/${product.id}`} className="block px-2">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-start gap-4">
            <h3 className="text-[14px] sm:text-[16px] font-bold text-foreground line-clamp-1 leading-tight tracking-tight">
              {product.name}
            </h3>
            <p className={`text-[14px] sm:text-[16px] font-black tracking-tighter ${isOutOfStock ? "text-muted-foreground/50" : "text-foreground"}`}>
              ₹{product.price.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium uppercase tracking-[0.1em]">
              {product.brand || 'Premium Kicks'}
            </p>
            {product.originalPrice && !isOutOfStock && (
              <p className="text-[10px] text-red-500 font-bold tracking-tight bg-red-500/5 px-1.5 py-0.5 rounded">
                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
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
    </motion.div>
  );
};

export default ProductCard;
