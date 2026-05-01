import { useCart } from "@/contexts/CartContext";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, ShieldCheck, MessageCircle } from "lucide-react";

const CartDrawer = () => {
  const navigate = useNavigate();
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const WHATSAPP_NUMBER = "+919398415366";

  const handleWhatsAppCheckout = () => {
    if (items.length === 0) return;
    let message = "Hello, I would like to order:\n\n";
    items.forEach(item => {
      message += `• ${item.product.name} (Size: ${item.size || 'N/A'}) x ${item.quantity}\n`;
    });
    message += `\nTotal: ₹${totalPrice.toLocaleString('en-IN')}\n\nPlease confirm.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
  };

  useEffect(() => {
    document.body.style.overflow = isCartOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isCartOpen]);

  const freeShippingThreshold = 2000;
  const progress = Math.min((totalPrice / freeShippingThreshold) * 100, 100);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[101] w-full max-w-[420px] bg-white dark:bg-zinc-950 shadow-2xl flex flex-col border-l border-white/10"
          >
            {/* Header */}
            <div className="px-6 py-8 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white" style={{ fontFamily: "'Playfair Display', serif" }}>My Cart</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mt-1">{totalItems} Pieces</p>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-10 h-10 rounded-full border border-zinc-100 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                <X size={18} className="text-zinc-500" />
              </button>
            </div>

            {/* Free Shipping Progress */}
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex justify-between">
                <span>{progress < 100 ? `Add ₹${(freeShippingThreshold - totalPrice).toLocaleString()} for Free Shipping` : 'You got Free Shipping!'}</span>
                <span>{Math.round(progress)}%</span>
              </p>
              <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-zinc-900 dark:bg-white"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <ShoppingBag size={48} strokeWidth={1} className="mb-4" />
                  <p className="text-sm font-medium">Your cart is empty</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <motion.div
                      key={item.product.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex gap-4 group"
                    >
                      <div className="w-20 h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-900 overflow-hidden flex-shrink-0 border border-zinc-200/50 dark:border-zinc-800/50">
                        <img src={item.product.image} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex justify-between items-start">
                          <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate uppercase tracking-wide">{item.product.name}</h3>
                          <button onClick={() => removeFromCart(item.product.id)} className="text-zinc-400 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Size: {item.size || 'N/A'}</p>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 px-3 py-1 rounded-full border border-zinc-200/50 dark:border-zinc-800/50">
                            <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product.id, Math.min(5, item.quantity + 1))} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="text-sm font-bold tracking-tight">₹{item.product.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Total Amount</p>
                    <p className="text-[9px] text-zinc-400 italic">Inclusive of all taxes</p>
                  </div>
                  <span className="text-2xl font-bold tracking-tighter">₹{totalPrice.toLocaleString()}</span>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => { navigate("/checkout"); setIsCartOpen(false); }}
                    className="w-full h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    <ShieldCheck size={16} />
                    Checkout Securely
                    <ArrowRight size={14} className="ml-1" />
                  </button>
                  
                  <button
                    onClick={handleWhatsAppCheckout}
                    className="w-full h-12 bg-[#25D366]/10 text-[#25D366] rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#25D366]/20 transition-all"
                  >
                    <MessageCircle size={16} />
                    WhatsApp Checkout
                  </button>

                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="w-full py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Continue Exploring
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
