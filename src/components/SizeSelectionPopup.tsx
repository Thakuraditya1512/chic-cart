import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/contexts/CartContext";
import gsap from "gsap";
import { toast } from "sonner";

interface SizeSelectionPopupProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

const SizeSelectionPopup = ({ product, isOpen, onClose }: SizeSelectionPopupProps) => {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleAddToCart = async () => {
    if (!selectedSize && product.sizes && product.sizes.length > 0) {
      // Highlight size selection
      const sizeGrid = document.getElementById('size-grid');
      if (sizeGrid) {
        sizeGrid.classList.add('animate-pulse');
        setTimeout(() => {
          sizeGrid.classList.remove('animate-pulse');
        }, 1000);
      }
      return;
    }

    setIsAdding(true);
    
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
        onComplete: () => {
          addToCart(product, quantity, selectedSize || undefined);
          toast.success("Added to cart!", { description: `${product.name} · Size ${selectedSize}`, duration: 2000 });
          setIsAdding(false);
          onClose();
          // Reset state
          setSelectedSize(null);
          setQuantity(1);
        }
      });
    } else {
      addToCart(product, quantity, selectedSize || undefined);
      toast.success("Added to cart!", { description: `${product.name}${selectedSize ? ` · Size ${selectedSize}` : ''}`, duration: 2000 });
      setIsAdding(false);
      onClose();
      setSelectedSize(null);
      setQuantity(1);
    }
  };

  const handleClose = () => {
    setSelectedSize(null);
    setQuantity(1);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[hsl(var(--overlay))]"
            onClick={handleClose}
          />
          
          {/* Popup */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-background border border-border rounded-2xl shadow-elevated overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover bg-secondary"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm truncate">{product.name}</h3>
                    <p className="text-sm font-bold text-foreground">₹{product.price.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Size Selection */}
                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-foreground">Select Size</label>
                      {!selectedSize && (
                        <span className="text-xs text-destructive animate-pulse">Required</span>
                      )}
                    </div>
                    <div 
                      id="size-grid"
                      className="grid grid-cols-4 gap-2"
                    >
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`h-10 px-3 text-sm font-medium rounded-lg border transition-colors ${
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

                {/* Quantity Selection */}
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-3">Quantity</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="text-lg">−</span>
                    </button>
                    <span className="w-12 text-center font-semibold text-foreground">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="text-lg">+</span>
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-lg font-bold text-foreground">
                      ₹{(product.price * quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  ref={buttonRef}
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isAdding ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag size={16} />
                      Add to Cart
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SizeSelectionPopup;
