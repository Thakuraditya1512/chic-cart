import { useCart } from "@/contexts/CartContext";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import gsap from "gsap";

const CartDrawer = () => {
  const navigate = useNavigate();
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  const WHATSAPP_NUMBER = "+919398415366";

  const handleWhatsAppCheckout = () => {
    if (items.length === 0) return;

    let message = "Hello, I would like to order the following items:\n\n";

    items.forEach(item => {
      message += `Product: ${item.product.name}\n`;
      message += `Quantity: ${item.quantity}\n`;
      message += `Price: ₹${item.product.price.toLocaleString('en-IN')}\n\n`;
    });

    message += `Total: ₹${totalPrice.toLocaleString('en-IN')}\n\n`;
    message += "Please confirm the order.";

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
  };

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  // GSAP animation for items
  useEffect(() => {
    if (isCartOpen && itemsRef.current.length > 0) {
      gsap.fromTo(
        itemsRef.current.filter(Boolean),
        { opacity: 0, x: 30 },
        { 
          opacity: 1, 
          x: 0, 
          duration: 0.4, 
          stagger: 0.05, 
          ease: "power3.out",
          delay: 0.2 
        }
      );
    }
  }, [isCartOpen, items.length]);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[hsl(var(--overlay))]"
            onClick={() => setIsCartOpen(false)}
          />
          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:max-w-md bg-background shadow-elevated flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h2 className="font-display text-base sm:text-lg font-semibold text-foreground">Cart ({totalItems})</h2>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <svg className="w-12 h-12 text-muted-foreground/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p className="text-muted-foreground text-sm">Your cart is empty</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="mt-4 text-sm font-medium text-foreground underline underline-offset-4"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                items.map((item, index) => (
                  <motion.div
                    key={item.product.id}
                    ref={(el) => { itemsRef.current[index] = el; }}
                    layout
                    className="flex gap-3 sm:gap-4 p-2 sm:p-0"
                  >
                    <Link
                      to={`/product/${item.product.id}`}
                      onClick={() => setIsCartOpen(false)}
                      className="w-16 h-20 sm:w-20 sm:h-24 rounded-md overflow-hidden bg-secondary flex-shrink-0"
                    >
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-sm font-medium text-foreground line-clamp-2">{item.product.name}</h3>
                      <p className="text-xs sm:text-sm font-semibold text-foreground mt-1">₹{item.product.price.toLocaleString('en-IN')}</p>
                      <div className="flex items-center gap-2 sm:gap-3 mt-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="text-xs sm:text-sm font-medium text-foreground w-4 sm:w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="ml-auto text-muted-foreground hover:text-sale transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-3 sm:p-4 border-t border-border space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-base sm:text-lg font-semibold text-foreground">₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      navigate("/checkout");
                      setIsCartOpen(false);
                    }}
                    className="w-full py-3 sm:py-3.5 bg-primary text-primary-foreground font-medium text-xs sm:text-sm uppercase tracking-wider hover:opacity-90 transition-opacity rounded-sm"
                  >
                    Checkout
                  </button>
                  <button
                    onClick={handleWhatsAppCheckout}
                    className="w-full py-3 sm:py-3.5 bg-[#25D366] text-white flex items-center justify-center gap-2 font-medium text-xs sm:text-sm uppercase tracking-wider hover:opacity-90 transition-opacity rounded-sm"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Order via WhatsApp
                  </button>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-full text-center text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
