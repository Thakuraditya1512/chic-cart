import { Heart, ShoppingBag, Star } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";

const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();
  const [wishlisted, setWishlisted] = useState(false);

  return (
    <div className="group relative">
      {/* Image Container */}
      <Link
        to={`/product/${product.id}`}
        className="block relative aspect-[3/4] rounded-xl overflow-hidden bg-secondary mb-3"
      >
        <img
          src={product.image}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          loading="lazy"
        />

        {/* Badge */}
        {product.badge && (
          <span
            className={`absolute top-3 left-3 text-[9px] font-sans font-bold uppercase tracking-[0.1em] px-3 py-1 rounded-full ${
              product.badge === "sale"
                ? "bg-sale text-sale-foreground"
                : "bg-foreground text-background"
            }`}
          >
            {product.badge}
          </span>
        )}

        {/* Quick add overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <motion.button
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            whileTap={{ scale: 0.95 }}
            className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-3 rounded-lg text-[10px] font-sans font-semibold uppercase tracking-[0.15em] hover:opacity-90 transition-opacity"
          >
            <ShoppingBag size={12} />
            Add to Cart
          </motion.button>
        </div>
      </Link>

      {/* Wishlist */}
      <button
        onClick={() => setWishlisted(!wishlisted)}
        className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm rounded-full text-foreground hover:text-sale transition-colors z-10"
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
        <h3 className="text-sm font-sans font-medium text-foreground line-clamp-2 mb-1">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 mb-1">
          <Star size={11} className="fill-foreground text-foreground" />
          <span className="text-[11px] text-muted-foreground font-sans">
            {product.rating}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-sans font-semibold text-foreground">
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground/60 line-through font-sans">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
