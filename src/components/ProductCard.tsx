import { Heart, ShoppingBag, Star } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom";
import { useState } from "react";

const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();
  const [wishlisted, setWishlisted] = useState(false);

  return (
    <div className="group relative">
      {/* Image */}
      <Link to={`/product/${product.id}`} className="block relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary mb-3">
        <img
          src={product.image}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover image-zoom group-hover:scale-105"
          loading="lazy"
        />
        {product.badge && (
          <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm ${
            product.badge === "sale"
              ? "bg-sale text-sale-foreground"
              : "bg-badge text-badge-foreground"
          }`}>
            {product.badge}
          </span>
        )}
        {/* Quick add overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-sm text-xs font-medium uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            <ShoppingBag size={14} />
            Add to Cart
          </button>
        </div>
      </Link>

      {/* Wishlist */}
      <button
        onClick={() => setWishlisted(!wishlisted)}
        className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm rounded-full text-foreground hover:text-sale transition-colors z-10"
        aria-label="Wishlist"
      >
        <Heart size={16} fill={wishlisted ? "currentColor" : "none"} className={wishlisted ? "text-sale" : ""} />
      </button>

      {/* Info */}
      <Link to={`/product/${product.id}`}>
        <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1">{product.name}</h3>
        <div className="flex items-center gap-1 mb-1">
          <Star size={12} className="fill-foreground text-foreground" />
          <span className="text-xs text-muted-foreground">{product.rating}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
