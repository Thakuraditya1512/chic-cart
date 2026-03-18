import { useState, useRef, useEffect } from "react";
import { products } from "@/data/products";
import { Product } from "@/types";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";

const SearchOverlay = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim()) {
      const q = query.toLowerCase();
      setResults(products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)));
    } else {
      setResults([]);
    }
  }, [query]);

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // GSAP results animation
  useEffect(() => {
    if (results.length > 0 && resultsRef.current) {
      const cards = resultsRef.current.querySelectorAll('.search-result-item');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power3.out" }
      );
    }
  }, [results.length]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </motion.div>
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="flex-1 text-base bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
            <motion.button 
              onClick={onClose} 
              whileTap={{ scale: 0.9 }}
              className="p-2 text-muted-foreground hover:text-foreground"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>

          {/* Results */}
          <div ref={resultsRef} className="flex-1 overflow-y-auto p-4">
            {query && results.length === 0 && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-muted-foreground text-sm text-center mt-8"
              >
                No results for &quot;{query}&quot;
              </motion.p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {results.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  onClick={onClose}
                  className="search-result-item group"
                >
                  <div className="aspect-[3/4] rounded-lg sm:rounded-xl overflow-hidden bg-secondary mb-2">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-medium text-foreground line-clamp-2">{product.name}</h3>
                  <p className="text-xs sm:text-sm font-semibold text-foreground mt-0.5">₹{product.price.toLocaleString('en-IN')}</p>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;
